import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

class FileManager:
    def __init__(self, metadata_file: str = "file_metadata.json"):
        self.metadata_file = Path(metadata_file)
        self.metadata = self._load_metadata()
    
    def _load_metadata(self) -> Dict:
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}
    
    def _save_metadata(self):
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(self.metadata, f, indent=2)
        except IOError:
            pass
    
    def register_file(self, file_id: str, user_id: str, filename: str, file_type: str = "upload"):
        self.metadata[file_id] = {
            "user_id": user_id,
            "filename": filename,
            "file_type": file_type,
            "created_at": datetime.utcnow().isoformat(),
            "generated_files": []
        }
        self._save_metadata()
    
    def add_generated_file(self, original_file_id: str, generated_filename: str):
        if original_file_id in self.metadata:
            self.metadata[original_file_id]["generated_files"].append({
                "filename": generated_filename,
                "created_at": datetime.utcnow().isoformat()
            })
            self._save_metadata()
    
    def get_file_owner(self, file_id: str) -> Optional[str]:
        file_info = self.metadata.get(file_id)
        return file_info["user_id"] if file_info else None
    
    def get_user_files(self, user_id: str) -> List[Dict]:
        user_files = []
        for file_id, file_info in self.metadata.items():
            if file_info["user_id"] == user_id:
                user_files.append({
                    "file_id": file_id,
                    **file_info
                })
        return user_files
    
    def user_owns_file(self, file_id: str, user_id: str) -> bool:
        return self.get_file_owner(file_id) == user_id
    
    def user_owns_generated_file(self, filename: str, user_id: str) -> bool:
        for file_id, file_info in self.metadata.items():
            if file_info["user_id"] == user_id:
                for generated_file in file_info.get("generated_files", []):
                    if generated_file["filename"] == filename:
                        return True
        return False

file_manager = FileManager()