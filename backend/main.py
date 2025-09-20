from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import uuid
import shutil
from pathlib import Path
from typing import List, Dict, Any, Optional
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv

load_dotenv()

from image_generator import generate_images
from auth import AuthService, get_current_user, get_optional_user
from models import (
    UserSignUp, UserSignIn, RefreshToken, AuthResponse, 
    MessageResponse, UserProfile, UserResponse, SessionResponse
)
from file_manager import file_manager

app = FastAPI(title="VibeBoost API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
GENERATED_DIR = Path("generated")
UPLOAD_DIR.mkdir(exist_ok=True)
GENERATED_DIR.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/generated", StaticFiles(directory=GENERATED_DIR), name="generated")

@app.get("/")
async def root():
    return {"message": "VibeBoost API is running"}

@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS is working!"}

# Authentication Routes
@app.post("/auth/signup")
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

@app.post("/auth/login", response_model=AuthResponse)
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

@app.post("/auth/logout", response_model=MessageResponse)
async def logout(current_user: Dict[str, Any] = Depends(get_current_user)):
    AuthService.sign_out(current_user.get("access_token", ""))
    return MessageResponse(message="Logout successful")

@app.post("/auth/refresh", response_model=AuthResponse)
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

@app.get("/auth/profile", response_model=UserProfile)
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return UserProfile(
        id=current_user["user_id"],
        email=current_user["payload"].get("email", ""),
        created_at=current_user["payload"].get("created_at", ""),
        updated_at=current_user["payload"].get("updated_at", ""),
        metadata=current_user["payload"].get("user_metadata", {})
    )

@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...), 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{file_id}{file_extension}"
    file_path = UPLOAD_DIR / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Register file with user
    file_manager.register_file(file_id, current_user["user_id"], filename, "upload")
    
    return {
        "file_id": file_id,
        "filename": filename,
        "url": f"/uploads/{filename}",
        "user_id": current_user["user_id"]
    }

@app.post("/generate")
async def generate_product_images(
    file_id: str, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check if user owns the file
    if not file_manager.user_owns_file(file_id, current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Access denied: You don't own this file")
    
    file_path = None
    for ext in ['.jpg', '.jpeg', '.png', '.webp']:
        potential_path = UPLOAD_DIR / f"{file_id}{ext}"
        if potential_path.exists():
            file_path = potential_path
            break
    
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        generated_images = await generate_images(str(file_path), file_id)
        
        # Register generated files
        for image_info in generated_images:
            if "filename" in image_info:
                file_manager.add_generated_file(file_id, image_info["filename"])
        
        return {
            "file_id": file_id,
            "generated_images": generated_images,
            "user_id": current_user["user_id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.get("/download/{filename}")
async def download_file(
    filename: str, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check if user owns the generated file
    if not file_manager.user_owns_generated_file(filename, current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Access denied: You don't own this file")
    
    file_path = GENERATED_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

# User file management routes
@app.get("/files")
async def get_user_files(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_files = file_manager.get_user_files(current_user["user_id"])
    return {"files": user_files}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)