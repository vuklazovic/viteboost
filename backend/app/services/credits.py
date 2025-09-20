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
        current = self.get_credits(user_id)
        new_val = int(current) + int(amount)
        try:
            if not self.has_user(user_id):
                self.ensure_user(user_id, new_val)
            else:
                self.client.table(TABLE).update({
                    "credits": new_val,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("user_id", user_id).execute()
        except Exception:
            pass
        return new_val

    def consume_credits(self, user_id: str, amount: int) -> int:
        current = self.get_credits(user_id)
        remaining = int(current) - int(amount)
        if remaining < 0:
            raise ValueError("Insufficient credits")
        try:
            if not self.has_user(user_id):
                # If somehow missing, initialize with 0 then fail
                self.ensure_user(user_id, 0)
            self.client.table(TABLE).update({
                "credits": remaining,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("user_id", user_id).execute()
        except Exception:
            pass
        return remaining


credit_manager = CreditManager()
