from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.services.auth import AuthService, get_current_user
from app.services.credits import credit_manager
from app.core.config import settings
from app.schemas.models import (
    UserSignUp, UserSignIn, RefreshToken, AuthResponse, 
    MessageResponse, UserProfile, UserResponse, SessionResponse, EmailCheckResponse,
    ForgotPasswordRequest, ResetPasswordRequest, PasswordResetResponse, CreditsResponse
)

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup")
async def signup(user_data: UserSignUp):
    # Simple approach: let Supabase handle duplicate email detection
    result = AuthService.create_user(user_data.email, user_data.password)
    
    # Check if session exists (email confirmation might be required)
    if result["session"] is None:
        # Initialize credits on first registration even if email confirmation is pending
        try:
            if result.get("user") and getattr(result["user"], "id", None):
                credit_manager.ensure_user(result["user"].id, settings.INITIAL_CREDITS)
        except Exception:
            pass
        return MessageResponse(
            message="Please check your email to confirm your account before signing in"
        )
    
    user_response = UserResponse(
        id=result["user"].id,
        email=result["user"].email,
        created_at=result["user"].created_at,
        updated_at=result["user"].updated_at or result["user"].created_at
    )
    
    session_response = SessionResponse(
        access_token=result["session"].access_token,
        refresh_token=result["session"].refresh_token,
        expires_in=result["session"].expires_in,
        token_type="bearer"
    )
    
    # Initialize credits for the new user and include in response
    credits_info = None
    try:
        credit_manager.ensure_user(result["user"].id, settings.INITIAL_CREDITS)
        user_credits = credit_manager.get_credits(result["user"].id)
        credits_info = {
            "credits": user_credits,
            "cost_per_image": settings.CREDIT_COST_PER_IMAGE,
            "num_images": settings.NUM_IMAGES,
        }
    except Exception:
        pass

    return AuthResponse(
        user=user_response,
        session=session_response,
        message="User created successfully",
        **(credits_info or {})
    )

@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserSignIn):
    # Simple approach: let Supabase handle authentication
    result = AuthService.sign_in(user_data.email, user_data.password)
    
    user_response = UserResponse(
        id=result["user"].id,
        email=result["user"].email,
        created_at=result["user"].created_at,
        updated_at=result["user"].updated_at or result["user"].created_at
    )
    
    session_response = SessionResponse(
        access_token=result["session"].access_token,
        refresh_token=result["session"].refresh_token,
        expires_in=result["session"].expires_in,
        token_type="bearer"
    )
    
    # Ensure credit record exists and include credits for immediate display
    credits_info = None
    try:
        # Ensure the user has a credit record
        if not credit_manager.has_user(result["user"].id):
            credit_manager.ensure_user(result["user"].id, settings.INITIAL_CREDITS)

        # Always attempt to fetch credits now
        user_credits = credit_manager.get_credits(result["user"].id)
        credits_info = {
            "credits": user_credits,
            "cost_per_image": settings.CREDIT_COST_PER_IMAGE,
            "num_images": settings.NUM_IMAGES,
        }
    except Exception as e:
        # Don't fail login if credits can't be fetched, just log it
        print(f"Warning: Could not fetch credits for user {result['user'].id}: {e}")

    return AuthResponse(
        user=user_response,
        session=session_response,
        message="Login successful",
        **credits_info if credits_info else {}
    )

@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    AuthService.sign_out(current_user.get("access_token", ""))
    return MessageResponse(message="Logout successful")

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(token_data: RefreshToken):
    result = AuthService.refresh_session(token_data.refresh_token)
    
    user_response = UserResponse(
        id=result["user"].id,
        email=result["user"].email,
        created_at=result["user"].created_at,
        updated_at=result["user"].updated_at or result["user"].created_at
    )
    
    session_response = SessionResponse(
        access_token=result["session"].access_token,
        refresh_token=result["session"].refresh_token,
        expires_in=result["session"].expires_in,
        token_type="bearer"
    )
    
    return AuthResponse(
        user=user_response,
        session=session_response,
        message="Token refreshed successfully"
    )

@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    credits_info = {}
    try:
        # Ensure user has a credits record and include credit data if available
        if not credit_manager.has_user(current_user["user_id"]):
            credit_manager.ensure_user(current_user["user_id"], settings.INITIAL_CREDITS)
        user_credits = credit_manager.get_credits(current_user["user_id"])
        credits_info = {
            "credits": user_credits,
            "cost_per_image": settings.CREDIT_COST_PER_IMAGE,
            "num_images": settings.NUM_IMAGES,
        }
    except Exception:
        # If credits can't be read, return profile without credits
        credits_info = {}

    return UserProfile(
        id=current_user["user_id"],
        email=current_user["payload"].get("email", ""),
        created_at=current_user["payload"].get("created_at", ""),
        updated_at=current_user["payload"].get("updated_at", ""),
        metadata=current_user["payload"].get("user_metadata", {}),
        **credits_info,
    )

@router.get("/check-email/{email}", response_model=EmailCheckResponse)
async def check_email(email: str):
    """Check if email already exists"""
    result = AuthService.check_email_exists(email)
    return EmailCheckResponse(**result)

@router.post("/forgot-password", response_model=PasswordResetResponse)
async def forgot_password(request: ForgotPasswordRequest):
    """Request password reset email"""
    result = AuthService.request_password_reset(request.email)
    return PasswordResetResponse(**result)

@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(request: ResetPasswordRequest):
    """Complete password reset using token from email"""
    result = AuthService.reset_password(request.access_token, request.new_password)
    return MessageResponse(message=result["message"])

@router.get("/credits", response_model=CreditsResponse)
async def get_credits(current_user: Dict[str, Any] = Depends(get_current_user)):
    # Ensure credits record exists; surface errors to caller for easier setup debugging
    if not credit_manager.table_exists():
        raise HTTPException(status_code=500, detail="Credits table missing. Apply migration at backend/db/migrations/001_create_user_credits.sql")

    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(status_code=500, detail="SUPABASE_SERVICE_ROLE_KEY is not configured on the backend")

    if not credit_manager.has_user(current_user["user_id"]):
        credit_manager.ensure_user(current_user["user_id"], settings.INITIAL_CREDITS)

    credits = credit_manager.get_credits(current_user["user_id"])
    return CreditsResponse(
        credits=credits,
        cost_per_image=settings.CREDIT_COST_PER_IMAGE,
        num_images=settings.NUM_IMAGES,
    )
