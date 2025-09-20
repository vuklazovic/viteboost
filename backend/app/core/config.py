import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # API Configuration
    API_TITLE: str = "VibeBoost API"
    API_VERSION: str = "1.0.0"
    API_HOST: str = "127.0.0.1"
    API_PORT: int = 8000
    
    # CORS Configuration
    ALLOWED_ORIGINS: list = ["*"]
    ALLOWED_METHODS: list = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    ALLOWED_HEADERS: list = ["*"]
    ALLOW_CREDENTIALS: bool = False
    
    # File Upload Configuration
    UPLOAD_DIR: Path = Path("uploads")
    GENERATED_DIR: Path = Path("generated")
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".webp"}
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:8081"
    
    # Credits Configuration
    INITIAL_CREDITS: int = int(os.getenv("INITIAL_CREDITS", "100"))
    CREDIT_COST_PER_IMAGE: int = int(os.getenv("CREDIT_COST_PER_IMAGE", "1"))

    # Generation configuration
    NUM_IMAGES: int = int(os.getenv("NUM_IMAGES", "3"))
    
    def __init__(self):
        if not all([self.SUPABASE_URL, self.SUPABASE_ANON_KEY]):
            raise ValueError("Missing required Supabase configuration. Please check your .env file.")
        
        # Create directories if they don't exist
        self.UPLOAD_DIR.mkdir(exist_ok=True)
        self.GENERATED_DIR.mkdir(exist_ok=True)

settings = Settings()
