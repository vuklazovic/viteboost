from supabase import create_client, Client
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any

from app.core.config import settings

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

security = HTTPBearer()

class AuthService:
    @staticmethod
    def check_email_exists(email: str) -> Dict[str, Any]:
        """Check if email already exists using Supabase Admin API"""
        try:
            # Use Supabase Admin API to list users by email
            response = supabase_admin.auth.admin.list_users()
            
            if response and hasattr(response, 'users'):
                for user in response.users:
                    if user.email == email:
                        # Determine auth providers
                        identities = getattr(user, 'identities', [])
                        providers = [identity.provider for identity in identities] if identities else []
                        
                        return {
                            "exists": True,
                            "is_email_user": "email" in providers,
                            "is_google_user": "google" in providers,
                            "check_successful": True,
                            "user_id": user.id,
                            "email_confirmed": user.email_confirmed_at is not None,
                            "providers": providers
                        }
            
            # User not found
            return {"exists": False, "check_successful": True}
            
        except Exception as e:
            # Return check failed but don't expose error details for security
            return {"exists": False, "check_successful": False}
    
    @staticmethod
    def create_user(email: str, password: str) -> Dict[str, Any]:
        try:
            response = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "email_redirect_to": f"{settings.FRONTEND_URL}/auth/callback"
                }
            })
            
            return {
                "user": response.user,
                "session": response.session
            }
        except Exception as e:
            error_msg = str(e).lower()
            if "already registered" in error_msg or "already exists" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email already exists"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Registration failed"
                )
    
    @staticmethod
    def sign_in(email: str, password: str) -> Dict[str, Any]:
        try:
            response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            return {
                "user": response.user,
                "session": response.session
            }
        except Exception as e:
            error_message = str(e).lower()
            
            if "invalid login credentials" in error_message or "invalid email or password" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            elif "email not confirmed" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Please check your email to confirm your account"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication failed"
                )
    
    @staticmethod
    def sign_out(access_token: str) -> bool:
        try:
            # Set the session and sign out
            supabase.auth.set_session(access_token, "")
            supabase.auth.sign_out()
            return True
        except Exception:
            # Even if sign out fails on server, consider it successful on client
            return True
    
    @staticmethod
    def refresh_session(refresh_token: str) -> Dict[str, Any]:
        try:
            response = supabase.auth.refresh_session(refresh_token)
            return {
                "user": response.user,
                "session": response.session
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session refresh failed"
            )

    @staticmethod
    def request_password_reset(email: str) -> Dict[str, Any]:
        """Request password reset email"""
        try:
            # Send password reset email via Supabase
            supabase.auth.reset_password_email(
                email,
                {
                    "redirect_to": f"{settings.FRONTEND_URL}/reset-password"
                }
            )
            
            return {
                "message": "If this email is registered, you will receive a password reset link.",
                "success": True
            }
            
        except Exception as e:
            # Return generic message for security (don't reveal if email exists)
            return {
                "message": "If this email is registered, you will receive a password reset link.",
                "success": True
            }

    @staticmethod
    def reset_password(access_token: str, new_password: str) -> Dict[str, Any]:
        """Reset password using token from email"""
        try:
            # Set the session with the access token from password reset email
            supabase.auth.set_session(access_token, "")
            
            # Update the password
            response = supabase.auth.update_user({
                "password": new_password
            })
            
            if response.user:
                return {
                    "message": "Password updated successfully",
                    "success": True,
                    "user": response.user
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to update password"
                )
                
        except Exception as e:
            error_msg = str(e).lower()
            if "invalid token" in error_msg or "expired" in error_msg:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Password reset link is invalid or expired. Please request a new one."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Password reset failed: {str(e)}"
                )

def verify_token(token: str) -> Dict[str, Any]:
    try:
        # Use Supabase to verify the JWT token properly
        response = supabase.auth.get_user(token)
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
        return {
            "user_id": response.user.id,
            "payload": {
                "sub": response.user.id,
                "email": response.user.email,
                "created_at": response.user.created_at,
                "updated_at": response.user.updated_at,
                "user_metadata": response.user.user_metadata
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token required"
        )
    
    token = credentials.credentials
    return verify_token(token)

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        return verify_token(token)
    except HTTPException:
        return None