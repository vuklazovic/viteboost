from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
import logging

from supabase import create_client, Client

from app.core.config import settings

logger = logging.getLogger(__name__)


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

    def ensure_user(self, user_id: str, initial_credits: int, plan_id: str = "free") -> None:
        if self.has_user(user_id):
            return
        now = datetime.utcnow().isoformat()
        next_reset = (datetime.utcnow() + timedelta(days=30)).isoformat()
        payload = {
            "user_id": user_id,
            "credits": int(initial_credits),
            "plan_id": plan_id,
            "last_credit_reset": now,
            "next_credit_reset": next_reset,
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

    def get_user_plan(self, user_id: str) -> str:
        """Get user's current plan"""
        try:
            res = self.client.table(TABLE).select("plan_id").eq("user_id", user_id).maybe_single().execute()
            if res is None:
                return "free"
            data = getattr(res, "data", None)
            if isinstance(data, dict) and "plan_id" in data:
                return data["plan_id"]
            return "free"
        except Exception:
            return "free"

    def set_user_plan(self, user_id: str, plan_id: str) -> None:
        """Set user's plan"""
        try:
            if not self.has_user(user_id):
                plan_config = settings.SUBSCRIPTION_PLANS.get(plan_id, settings.SUBSCRIPTION_PLANS["free"])
                self.ensure_user(user_id, plan_config["credits"], plan_id)
            else:
                self.client.table(TABLE).update({
                    "plan_id": plan_id,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("user_id", user_id).execute()
        except Exception as e:
            logger.error(f"Failed to set plan for user {user_id}: {e}")

    def renew_credits(self, user_id: str, credits_amount: int, plan_id: str) -> int:
        """Renew user's credits for the subscription period"""
        try:
            if not self.has_user(user_id):
                self.ensure_user(user_id, credits_amount, plan_id)
                return credits_amount

            now = datetime.utcnow().isoformat()
            next_reset = (datetime.utcnow() + timedelta(days=30)).isoformat()

            self.client.table(TABLE).update({
                "credits": credits_amount,
                "plan_id": plan_id,
                "last_credit_reset": now,
                "next_credit_reset": next_reset,
                "updated_at": now,
            }).eq("user_id", user_id).execute()

            logger.info(f"Renewed credits for user {user_id} to {credits_amount} credits (plan: {plan_id})")
            return credits_amount

        except Exception as e:
            logger.error(f"Failed to renew credits for user {user_id}: {e}")
            raise

    def get_credit_info(self, user_id: str) -> Dict:
        """Get comprehensive credit information for user"""
        try:
            res = self.client.table(TABLE).select("*").eq("user_id", user_id).maybe_single().execute()
            if res is None or not res.data:
                return {
                    "credits": 0,
                    "plan_id": "free",
                    "last_credit_reset": None,
                    "next_credit_reset": None
                }

            data = res.data
            return {
                "credits": data.get("credits", 0),
                "plan_id": data.get("plan_id", "free"),
                "last_credit_reset": data.get("last_credit_reset"),
                "next_credit_reset": data.get("next_credit_reset")
            }
        except Exception as e:
            logger.error(f"Failed to get credit info for user {user_id}: {e}")
            return {
                "credits": 0,
                "plan_id": "free",
                "last_credit_reset": None,
                "next_credit_reset": None
            }

    def should_reset_free_credits(self, user_id: str) -> bool:
        """Check if free plan user credits should be reset"""
        try:
            plan = self.get_user_plan(user_id)
            if plan != "free":
                return False

            credit_info = self.get_credit_info(user_id)
            next_reset = credit_info.get("next_credit_reset")

            if not next_reset:
                return True

            next_reset_dt = datetime.fromisoformat(next_reset.replace('Z', '+00:00'))
            return datetime.now(timezone.utc) >= next_reset_dt

        except Exception as e:
            logger.error(f"Failed to check reset status for user {user_id}: {e}")
            return False

    def reset_free_plan_credits(self, user_id: str) -> int:
        """Reset credits for free plan users"""
        try:
            plan = self.get_user_plan(user_id)
            if plan != "free":
                raise ValueError("Can only reset credits for free plan users")

            free_plan_config = settings.SUBSCRIPTION_PLANS["free"]
            return self.renew_credits(user_id, free_plan_config["credits"], "free")

        except Exception as e:
            logger.error(f"Failed to reset free credits for user {user_id}: {e}")
            raise

    def check_and_reset_free_credits_if_needed(self, user_id: str) -> Optional[int]:
        """Check and reset free credits if needed, returns new credit amount if reset occurred"""
        try:
            if self.should_reset_free_credits(user_id):
                return self.reset_free_plan_credits(user_id)
            return None
        except Exception as e:
            logger.error(f"Failed to check/reset free credits for user {user_id}: {e}")
            return None


credit_manager = CreditManager()
