#!/usr/bin/env python3

import os
import sys
from pathlib import Path

def check_env_file():
    if not Path('.env').exists():
        print("⚠️  No .env file found. Creating from .env.example...")
        if Path('.env.example').exists():
            import shutil
            shutil.copy('.env.example', '.env')
            print("📝 Please edit .env file with your actual API keys")
            return False
        else:
            print("❌ .env.example not found!")
            return False
    return True

def create_directories():
    Path('uploads').mkdir(exist_ok=True)
    Path('generated').mkdir(exist_ok=True)

def main():
    print("🚀 Starting VibeBoost Backend...")
    
    if not check_env_file():
        sys.exit(1)
    
    create_directories()
    
    print("🎯 Starting FastAPI server...")
    print("Server: http://127.0.0.1:8000")
    print("Docs: http://127.0.0.1:8000/docs")
    print("\nPress Ctrl+C to stop\n")
    
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()