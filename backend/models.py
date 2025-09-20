from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Dict, Any, Union
from datetime import datetime

class UserSignUp(BaseModel):
    email: EmailStr
    password: str

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class RefreshToken(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    created_at: str
    updated_at: str
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def convert_datetime_to_string(cls, v: Union[str, datetime]) -> str:
        if isinstance(v, datetime):
            return v.isoformat()
        return v

class SessionResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str = "bearer"

class AuthResponse(BaseModel):
    user: UserResponse
    session: SessionResponse
    message: str

class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    detail: str

class UserProfile(BaseModel):
    id: str
    email: str
    created_at: str
    updated_at: str
    metadata: Optional[Dict[str, Any]] = None
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def convert_datetime_to_string(cls, v: Union[str, datetime]) -> str:
        if isinstance(v, datetime):
            return v.isoformat()
        return v