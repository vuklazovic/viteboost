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

@app.on_event("startup")
async def vb_startup_check():
    try:
        from app.services.credits import credit_manager
        import logging
        if not settings.SUPABASE_SERVICE_ROLE_KEY:
            logging.getLogger("uvicorn.error").warning(
                "SUPABASE_SERVICE_ROLE_KEY is missing; credits initialization and charging will fail."
            )
        if not credit_manager.table_exists():
            logging.getLogger("uvicorn.error").warning(
                "Supabase table 'user_credits' not found. Apply migration at backend/db/migrations/001_create_user_credits.sql"
            )
    except Exception as e:
        logging.getLogger("uvicorn.error").warning(f"Credits table check failed: {e}")

@app.get("/")
async def root():
    return {"message": "VibeBoost API is running"}

@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS is working!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
