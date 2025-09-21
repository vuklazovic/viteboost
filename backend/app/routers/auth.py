from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any

from app.services.auth import AuthService, get_current_user
from app.services.credits import credit_manager
from app.core.config import settings
from app.schemas.models import (
    RefreshToken, AuthResponse,
    MessageResponse, UserProfile, UserResponse, SessionResponse,
    CreditsResponse
)

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    # With Google-only auth handled client-side, server logout is a no-op
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

# Email/password and email-check endpoints are intentionally removed for Google-only auth

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
