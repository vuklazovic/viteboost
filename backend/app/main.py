from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers import auth, files

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=settings.ALLOW_CREDENTIALS,
    allow_methods=settings.ALLOWED_METHODS,
    allow_headers=settings.ALLOWED_HEADERS,
)

# Mount static files
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount("/generated", StaticFiles(directory=settings.GENERATED_DIR), name="generated")

# Include routers
app.include_router(auth.router)
app.include_router(files.router)

@app.get("/")
async def root():
    return {"message": "VibeBoost API is running"}

@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS is working!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)