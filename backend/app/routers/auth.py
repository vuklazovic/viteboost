from fastapi import APIRouter, Depends
from typing import Dict, Any

from app.services.auth import AuthService, get_current_user
from app.schemas.models import (
    UserSignUp, UserSignIn, RefreshToken, AuthResponse, 
    MessageResponse, UserProfile, UserResponse, SessionResponse
)

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup")
async def signup(user_data: UserSignUp):
    result = AuthService.create_user(user_data.email, user_data.password)
    
    # Check if session exists (email confirmation might be required)
    if result["session"] is None:
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
    
    return AuthResponse(
        user=user_response,
        session=session_response,
        message="User created successfully"
    )

@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserSignIn):
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