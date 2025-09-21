from datetime import datetime
from typing import Dict

from supabase import create_client, Client

from app.core.config import settings


TABLE = "user_credits"


class CreditManager:
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    def table_exists(self) -> bool:
        try:
            res = self.client.table(TABLE).select("user_id").limit(1).execute()
            return True if res is not None else False
        except Exception:
            return False

    def has_user(self, user_id: str) -> bool:
        try:
            res = self.client.table(TABLE).select("user_id").eq("user_id", user_id).maybe_single().execute()
            if res is None:
                return False
            data = getattr(res, "data", None)
            return bool(data)
        except Exception:
            return False

    def ensure_user(self, user_id: str, initial_credits: int) -> None:
        if self.has_user(user_id):
            return
        now = datetime.utcnow().isoformat()
        payload = {
            "user_id": user_id,
            "credits": int(initial_credits),
            "created_at": now,
            "updated_at": now,
        }
        # Insert once; ignore failures (e.g., race condition) silently
        try:
            self.client.table(TABLE).insert(payload).execute()
        except Exception:
            pass

    def get_credits(self, user_id: str) -> int:
        try:
            res = self.client.table(TABLE).select("credits").eq("user_id", user_id).maybe_single().execute()
            if res is None:
                return 0
            data = getattr(res, "data", None)
            if isinstance(data, dict) and "credits" in data:
                return int(data["credits"])
            return 0
        except Exception:
            return 0

    def add_credits(self, user_id: str, amount: int) -> int:
        """Add credits to user account"""
        try:
            if not self.has_user(user_id):
                self.ensure_user(user_id, amount)
                return amount
            else:
                current = self.get_credits(user_id)
                new_val = int(current) + int(amount)
                self.client.table(TABLE).update({
                    "credits": new_val,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("user_id", user_id).execute()
                return new_val
        except Exception as e:
            # For add credits, we can be more lenient and return current credits
            return self.get_credits(user_id)

    def consume_credits(self, user_id: str, amount: int) -> int:
        """Atomically consume credits with proper validation"""
        try:
            # First ensure user exists
            if not self.has_user(user_id):
                self.ensure_user(user_id, 0)
            
            # Use atomic update with condition to prevent race conditions
            # First get current credits and check if sufficient
            current_result = self.client.table(TABLE).select("credits").eq("user_id", user_id).single().execute()
            current_credits = current_result.data["credits"] if current_result.data else 0
            
            if current_credits < amount:
                raise ValueError("Insufficient credits")
            
            new_credits = current_credits - amount
            result = self.client.table(TABLE).update({
                "credits": new_credits,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("user_id", user_id).eq("credits", current_credits).execute()
            
            # Check if the update was successful (no rows updated means insufficient credits)
            if not result.data:
                raise ValueError("Insufficient credits")
            
            return new_credits
        except ValueError:
            # Re-raise ValueError for insufficient credits
            raise
        except Exception as e:
            raise ValueError(f"Credit operation failed: {str(e)}")


credit_manager = CreditManager()
