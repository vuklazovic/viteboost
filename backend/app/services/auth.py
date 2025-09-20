import jwt
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
        """Check if email already exists and return user info if found"""
        try:
            # Simplified approach: try to sign in with a dummy password to check if user exists
            # Supabase will give different error messages for "user not found" vs "wrong password"
            try:
                supabase.auth.sign_in_with_password({
                    "email": email,
                    "password": "dummy_password_for_check_12345"
                })
                # If this succeeds (very unlikely), user exists
                return {
                    "exists": True, 
                    "is_email_user": True,
                    "is_google_user": False,
                    "check_successful": True
                }
            except Exception as e:
                error_msg = str(e).lower()
                if "invalid login credentials" in error_msg or "wrong password" in error_msg or "invalid password" in error_msg:
                    # User exists but password is wrong
                    return {
                        "exists": True, 
                        "is_email_user": True,
                        "is_google_user": False,
                        "check_successful": True
                    }
                elif "user not found" in error_msg or "no user found" in error_msg or "signup required" in error_msg:
                    # User doesn't exist
                    return {"exists": False, "check_successful": True}
                else:
                    # Some other error
                    return {"exists": False, "check_successful": False, "error": str(e)}
                
        except Exception as e:
            # Major error - return check failed
            return {"exists": False, "check_successful": False, "error": str(e)}
    
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
            
            if response.user:
                return {
                    "user": response.user,
                    "session": response.session
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to create user"
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration failed: {str(e)}"
            )
    
    @staticmethod
    def sign_in(email: str, password: str) -> Dict[str, Any]:
        try:
            response = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user and response.session:
                return {
                    "user": response.user,
                    "session": response.session
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
        except HTTPException:
            # Re-raise HTTP exceptions as-is
            raise
        except Exception as e:
            # Handle Supabase-specific errors
            error_message = str(e).lower()
            
            if "invalid login credentials" in error_message or "invalid email or password" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid email or password"
                )
            elif "email not confirmed" in error_message:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Please check your email to confirm your account before signing in"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Authentication service error"
                )
    
    @staticmethod
    def sign_out(access_token: str) -> bool:
        try:
            supabase.auth.set_session(access_token, None)
            supabase.auth.sign_out()
            return True
        except Exception:
            return False
    
    @staticmethod
    def refresh_session(refresh_token: str) -> Dict[str, Any]:
        try:
            response = supabase.auth.refresh_session(refresh_token)
            if response.session:
                return {
                    "user": response.user,
                    "session": response.session
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Failed to refresh session"
                )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token refresh failed: {str(e)}"
            )

def verify_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(
            token, 
            options={"verify_signature": False}
        )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
        
        return {"user_id": user_id, "payload": payload}
    except jwt.InvalidTokenError:
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