from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import FileResponse
import os
import uuid
from typing import Dict, Any

from app.services.auth import get_current_user
from app.services.file_manager import file_manager
from app.services.credits import credit_manager
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
    quantity: int = None,
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
        # Use quantity parameter or fall back to default NUM_IMAGES
        num_images = quantity if quantity is not None else settings.NUM_IMAGES

        # Validate quantity limits
        if num_images < 1:
            raise HTTPException(status_code=400, detail="Quantity must be at least 1")
        if num_images > 100:  # Set reasonable upper limit
            raise HTTPException(status_code=400, detail="Quantity cannot exceed 100")

        # Determine and pre-charge credits immediately
        cost = num_images * settings.CREDIT_COST_PER_IMAGE
        user_credits = credit_manager.get_credits(current_user["user_id"])
        if user_credits < cost:
            raise HTTPException(status_code=402, detail="Insufficient credits")

        # Deduct up front; will refund on failure
        remaining_after_charge = credit_manager.consume_credits(current_user["user_id"], cost)

        generated_images = await generate_images(str(file_path), file_id, num_images)
        
        # Register generated files
        for image_info in generated_images:
            if "filename" in image_info:
                file_manager.add_generated_file(file_id, image_info["filename"])
        
        return {
            "file_id": file_id,
            "generated_images": generated_images,
            "user_id": current_user["user_id"],
            "credits": remaining_after_charge
        }
    except Exception as e:
        # Refund on failure
        try:
            credit_manager.add_credits(current_user["user_id"], cost)
        except Exception:
            pass
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

@router.get("/generations")
async def get_user_generations(current_user: Dict[str, Any] = Depends(get_current_user)):
    generations = file_manager.get_user_generations(current_user["user_id"])
    return {"generations": generations}

@router.get("/generation/{generation_id}")
async def get_generation_details(
    generation_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    # Check if user owns the generation
    if not file_manager.user_owns_file(generation_id, current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Access denied: You don't own this generation")

    # Get the generation data
    user_files = file_manager.get_user_files(current_user["user_id"])
    generation = next((f for f in user_files if f["file_id"] == generation_id), None)

    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")

    # Transform generated files to include full URLs
    generated_images = []
    for gen_file in generation.get("generated_files", []):
        generated_images.append({
            "filename": gen_file["filename"],
            "url": f"/generated/{gen_file['filename']}",
            "created_at": gen_file["created_at"],
            "style": f"style_{len(generated_images) + 1}",  # Generate style names
            "description": f"AI-generated variation of {generation['filename']}"
        })

    return {
        "generation_id": generation_id,
        "original_filename": generation["filename"],
        "created_at": generation["created_at"],
        "generated_images": generated_images
    }
