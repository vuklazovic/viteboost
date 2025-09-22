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
    ALLOWED_ORIGINS: list = [
        "http://localhost:8080",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8082"
    ]
    ALLOWED_METHODS: list = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    ALLOWED_HEADERS: list = ["*"]
    ALLOW_CREDENTIALS: bool = True
    
    # File Upload Configuration
    UPLOAD_DIR: Path = Path("uploads")
    GENERATED_DIR: Path = Path("generated")
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: set = {".jpg", ".jpeg", ".png", ".webp"}
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:8080"
    
    # Credits Configuration
    INITIAL_CREDITS: int = int(os.getenv("INITIAL_CREDITS", "100"))
    CREDIT_COST_PER_IMAGE: int = int(os.getenv("CREDIT_COST_PER_IMAGE", "1"))

    # Generation configuration
    NUM_IMAGES: int = int(os.getenv("NUM_IMAGES", "3"))

    # Stripe Configuration
    STRIPE_PUBLISHABLE_KEY: str = os.getenv("STRIPE_PUBLISHABLE_KEY", "pk_test_51Rb16KDApD6mGm7q2O5pkiPKaODXtvRpkSphnv4k3gMD9JhKSMGJRi22LaioyHuYy30yeuv3qVDVmkuL36sVmCV200Xsrbsv0w")
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY", "sk_test_51Rb16KDApD6mGm7qK5AGONDfZbG1Lbjq99sWVV1qvf9M2dOzzstY9oJMn3t55CH7AQpnmoCasDbHG0s3Sk4bHqjI00Igg29QLs")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    # Subscription Plans Configuration
    SUBSCRIPTION_PLANS = {
        "free": {
            "name": "Free",
            "price": 0,
            "credits": 15,
            "stripe_product_id": None,
            "stripe_price_id": None
        },
        "basic": {
            "name": "Basic",
            "price": 1200,  # $12.00 in cents
            "credits": 100,
            "stripe_product_id": "prod_T6KHyx8rT3FuZw",
            "stripe_price_id": None  # Will be set from Stripe
        },
        "pro": {
            "name": "Pro",
            "price": 3900,  # $39.00 in cents
            "credits": 500,
            "stripe_product_id": "prod_T6KWg56uGCU5M8",
            "stripe_price_id": None  # Will be set from Stripe
        },
        "business": {
            "name": "Business",
            "price": 8900,  # $89.00 in cents
            "credits": 1500,
            "stripe_product_id": "prod_T6KXqIAYquAPt1",
            "stripe_price_id": None  # Will be set from Stripe
        },
        "enterprise": {
            "name": "Enterprise",
            "price": None,  # Custom pricing
            "credits": None,  # Unlimited or custom
            "stripe_product_id": None,
            "stripe_price_id": None,
            "contact_required": True
        }
    }

    def __init__(self):
        if not all([self.SUPABASE_URL, self.SUPABASE_ANON_KEY]):
            raise ValueError("Missing required Supabase configuration. Please check your .env file.")
        
        # Create directories if they don't exist
        self.UPLOAD_DIR.mkdir(exist_ok=True)
        self.GENERATED_DIR.mkdir(exist_ok=True)

settings = Settings()
