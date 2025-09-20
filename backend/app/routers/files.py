from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import FileResponse
import os
import uuid
from typing import Dict, Any

from app.services.auth import get_current_user
from app.services.file_manager import file_manager
from app.services.image_generator import generate_images
from app.core.config import settings

router = APIRouter(tags=["files"])

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...), 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1]
    
    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    filename = f"{file_id}{file_extension}"
    file_path = settings.UPLOAD_DIR / filename
    
    # Check file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")
    
    # Write file
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    # Register file with user
    file_manager.register_file(file_id, current_user["user_id"], filename, "upload")
    
    return {
        "file_id": file_id,
        "filename": filename,
        "url": f"/uploads/{filename}",
        "user_id": current_user["user_id"]
    }

@router.post("/generate")
async def generate_product_images(
    file_id: str, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check if user owns the file
    if not file_manager.user_owns_file(file_id, current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Access denied: You don't own this file")
    
    file_path = None
    for ext in settings.ALLOWED_EXTENSIONS:
        potential_path = settings.UPLOAD_DIR / f"{file_id}{ext}"
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

@router.get("/download/{filename}")
async def download_file(
    filename: str, 
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check if user owns the generated file
    if not file_manager.user_owns_generated_file(filename, current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Access denied: You don't own this file")
    
    file_path = settings.GENERATED_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )

@router.get("/files")
async def get_user_files(current_user: Dict[str, Any] = Depends(get_current_user)):
    user_files = file_manager.get_user_files(current_user["user_id"])
    return {"files": user_files}