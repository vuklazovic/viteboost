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
    # Check if email already exists
    email_check = AuthService.check_email_exists(user_data.email)
    
    # If email check failed, still attempt signup (let Supabase handle it)
    if not email_check.get("check_successful", True):
        # Email check failed for signup
        pass
    
    if email_check.get("exists"):
        # User already exists, check their current auth methods
        if email_check.get("is_google_user") and not email_check.get("is_email_user"):
            # Google-only user wants to add email/password - this should be allowed
            # But first suggest they could use Google login
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Account already exists with Google sign-in. You can sign in with Google or add email authentication.",
                    "suggested_action": "choose_method",
                    "email": user_data.email
                }
            )
        elif email_check.get("is_email_user"):
            # User already has email/password auth
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Account already exists with this email",
                    "suggested_action": "email_login",
                    "email": user_data.email
                }
            )
        else:
            # User exists but no clear auth method detected - safer to suggest login
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "message": "Account already exists with this email",
                    "suggested_action": "email_login",
                    "email": user_data.email
                }
            )
    
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
    
    # Initialize credits for the new user
    try:
        credit_manager.ensure_user(result["user"].id, settings.INITIAL_CREDITS)
    except Exception:
        pass

    return AuthResponse(
        user=user_response,
        session=session_response,
        message="User created successfully"
    )

@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserSignIn):
    # Check if user exists and their signup method
    email_check = AuthService.check_email_exists(user_data.email)
    
    # If email check failed (service error), still attempt login but prepare for generic error
    if not email_check.get("check_successful", True):
        # Email check failed for login
        pass
    
    # Handle Google-only users
    if email_check.get("exists") and email_check.get("is_google_user") and not email_check.get("is_email_user"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "This account uses Google sign-in. Please continue with Google.",
                "suggested_action": "google_login",
                "email": user_data.email
            }
        )
    
    # Attempt authentication
    try:
        result = AuthService.sign_in(user_data.email, user_data.password)
    except HTTPException as http_exc:
        # If email check was successful, we can give specific error messages
        if email_check.get("check_successful", False):
            if email_check.get("exists"):
                # User exists but wrong password
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "message": "Invalid password",
                        "suggested_action": "try_again",
                        "email": user_data.email
                    }
                )
            else:
                # User doesn't exist
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "message": "No account found with this email",
                        "suggested_action": "signup",
                        "email": user_data.email
                    }
                )
        else:
            # Email check failed, give generic error based on Supabase response
            error_message = str(http_exc.detail).lower() if hasattr(http_exc, 'detail') else ""
            if "invalid login credentials" in error_message or "invalid email or password" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail={
                        "message": "Invalid email or password",
                        "suggested_action": "try_again",
                        "email": user_data.email
                    }
                )
            else:
                # Re-raise original exception
                raise http_exc
    except Exception as e:
        # Handle other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Login failed due to server error",
                "suggested_action": "try_again",
                "email": user_data.email
            }
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
    
    return AuthResponse(
        user=user_response,
        session=session_response,
        message="Login successful"
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
    return UserProfile(
        id=current_user["user_id"],
        email=current_user["payload"].get("email", ""),
        created_at=current_user["payload"].get("created_at", ""),
        updated_at=current_user["payload"].get("updated_at", ""),
        metadata=current_user["payload"].get("user_metadata", {})
    )

@router.get("/check-email/{email}", response_model=EmailCheckResponse)
async def check_email(email: str):
    """Check if email already exists and return provider information"""
    result = AuthService.check_email_exists(email)
    
    if result["exists"]:
        # Add suggested action based on user's signup method
        if result["is_google_user"] and not result["is_email_user"]:
            suggested_action = "google_login"
        elif result["is_email_user"] and not result["is_google_user"]:
            suggested_action = "email_login"
        elif result["is_google_user"] and result["is_email_user"]:
            suggested_action = "choose_method"
        else:
            suggested_action = "contact_support"
            
        result["suggested_action"] = suggested_action
    
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
