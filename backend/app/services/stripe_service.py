import stripe
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import logging

from supabase import create_client, Client

from app.core.config import settings

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY

SUBSCRIPTION_TABLE = "user_subscriptions"

class StripeService:
    def __init__(self):
        self.client: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    def get_available_plans(self) -> List[Dict[str, Any]]:
        """Get list of available subscription plans"""
        plans = []
        for plan_id, plan_data in settings.SUBSCRIPTION_PLANS.items():
            plans.append({
                "id": plan_id,
                "name": plan_data["name"],
                "price": plan_data["price"],
                "credits": plan_data["credits"],
                "features": self._get_plan_features(plan_id)
            })
        return plans

    def _get_plan_features(self, plan_id: str) -> List[str]:
        """Get features for a specific plan"""
        features_map = {
            "free": [
                "15 credits per month",
                "Basic image generation",
                "Standard processing speed"
            ],
            "basic": [
                "100 credits per month",
                "Priority processing",
                "Email support",
                "HD image generation"
            ],
            "pro": [
                "500 credits per month",
                "Fast processing",
                "Priority support",
                "Advanced features",
                "HD image generation"
            ],
            "business": [
                "1500 credits per month",
                "Fastest processing",
                "Premium support",
                "All advanced features",
                "HD image generation",
                "API access"
            ],
            "enterprise": [
                "Custom credit allocation",
                "Dedicated infrastructure",
                "24/7 priority support",
                "Custom integrations",
                "Advanced analytics",
                "SLA guarantee",
                "Dedicated account manager"
            ]
        }
        return features_map.get(plan_id, [])

    def create_customer(self, user_id: str, email: str, name: Optional[str] = None) -> str:
        """Create a Stripe customer"""
        try:
            customer_data = {
                "email": email,
                "metadata": {"user_id": user_id}
            }
            if name:
                customer_data["name"] = name

            customer = stripe.Customer.create(**customer_data)
            logger.info(f"Created Stripe customer {customer.id} for user {user_id}")
            return customer.id
        except Exception as e:
            logger.error(f"Failed to create Stripe customer for user {user_id}: {e}")
            raise

    def get_or_create_customer(self, user_id: str, email: str, name: Optional[str] = None) -> str:
        """Get existing customer or create new one"""
        try:
            # Check if customer already exists in our database
            result = self.client.table(SUBSCRIPTION_TABLE).select("stripe_customer_id").eq("user_id", user_id).maybe_single().execute()

            if result.data:
                return result.data["stripe_customer_id"]

            # Create new customer
            return self.create_customer(user_id, email, name)
        except Exception as e:
            logger.error(f"Failed to get or create customer for user {user_id}: {e}")
            raise

    def create_subscription(self, user_id: str, email: str, plan_id: str, payment_method_id: str) -> Dict[str, Any]:
        """Create a new subscription"""
        try:
            if plan_id == "free":
                raise ValueError("Cannot create subscription for free plan")

            if plan_id == "enterprise":
                raise ValueError("Enterprise plans require custom setup. Please contact sales.")

            plan_config = settings.SUBSCRIPTION_PLANS.get(plan_id)
            if not plan_config:
                raise ValueError(f"Invalid plan: {plan_id}")

            # Get or create customer
            customer_id = self.get_or_create_customer(user_id, email)

            # Attach payment method to customer
            stripe.PaymentMethod.attach(payment_method_id, customer=customer_id)

            # Set as default payment method
            stripe.Customer.modify(
                customer_id,
                invoice_settings={"default_payment_method": payment_method_id}
            )

            # Get the price ID from Stripe products
            price_id = self._get_price_id_for_product(plan_config["stripe_product_id"])
            if not price_id:
                raise ValueError(f"No price found for product {plan_config['stripe_product_id']}")

            # Create subscription
            subscription = stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                payment_behavior="default_incomplete",
                payment_settings={
                    "save_default_payment_method": "on_subscription"
                },
                expand=["latest_invoice.payment_intent"],
                metadata={"user_id": user_id, "plan_id": plan_id}
            )

            # Save subscription to database
            self._save_subscription_to_db(
                user_id=user_id,
                customer_id=customer_id,
                subscription_id=subscription.id,
                plan_id=plan_id,
                status=subscription.status,
                current_period_start=datetime.fromtimestamp(subscription.current_period_start, tz=timezone.utc),
                current_period_end=datetime.fromtimestamp(subscription.current_period_end, tz=timezone.utc)
            )

            logger.info(f"Created subscription {subscription.id} for user {user_id}")

            return {
                "subscription_id": subscription.id,
                "client_secret": subscription.latest_invoice.payment_intent.client_secret,
                "status": subscription.status
            }

        except Exception as e:
            logger.error(f"Failed to create subscription for user {user_id}: {e}")
            raise

    def _get_price_id_for_product(self, product_id: str) -> Optional[str]:
        """Get the price ID for a product from Stripe"""
        try:
            prices = stripe.Price.list(product=product_id, active=True)
            if prices.data:
                # Return the first active price (you might want to filter by currency/interval)
                return prices.data[0].id
            return None
        except Exception as e:
            logger.error(f"Failed to get price for product {product_id}: {e}")
            return None

    def _save_subscription_to_db(self, user_id: str, customer_id: str, subscription_id: str,
                                 plan_id: str, status: str, current_period_start: datetime,
                                 current_period_end: datetime) -> None:
        """Save subscription data to database"""
        try:
            data = {
                "user_id": user_id,
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": subscription_id,
                "plan_id": plan_id,
                "status": status,
                "current_period_start": current_period_start.isoformat(),
                "current_period_end": current_period_end.isoformat()
            }

            # Use upsert to handle case where subscription already exists
            self.client.table(SUBSCRIPTION_TABLE).upsert(data, on_conflict="user_id").execute()

        except Exception as e:
            logger.error(f"Failed to save subscription to database: {e}")
            raise

    def get_user_subscription(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user's current subscription"""
        try:
            result = self.client.table(SUBSCRIPTION_TABLE).select("*").eq("user_id", user_id).maybe_single().execute()
            return result.data
        except Exception as e:
            logger.error(f"Failed to get subscription for user {user_id}: {e}")
            return None

    def cancel_subscription(self, user_id: str, at_period_end: bool = True) -> Dict[str, Any]:
        """Cancel user's subscription"""
        try:
            subscription_data = self.get_user_subscription(user_id)
            if not subscription_data or not subscription_data.get("stripe_subscription_id"):
                raise ValueError("No active subscription found")

            subscription_id = subscription_data["stripe_subscription_id"]

            if at_period_end:
                # Cancel at period end
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )

                # Update database
                self.client.table(SUBSCRIPTION_TABLE).update({
                    "cancel_at_period_end": True,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("user_id", user_id).execute()

            else:
                # Cancel immediately
                subscription = stripe.Subscription.delete(subscription_id)

                # Update database
                self.client.table(SUBSCRIPTION_TABLE).update({
                    "status": "canceled",
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("user_id", user_id).execute()

            logger.info(f"Canceled subscription {subscription_id} for user {user_id}")

            return {
                "subscription_id": subscription_id,
                "status": subscription.status,
                "canceled_at_period_end": at_period_end
            }

        except Exception as e:
            logger.error(f"Failed to cancel subscription for user {user_id}: {e}")
            raise

    def reactivate_subscription(self, user_id: str) -> Dict[str, Any]:
        """Reactivate a canceled subscription"""
        try:
            subscription_data = self.get_user_subscription(user_id)
            if not subscription_data or not subscription_data.get("stripe_subscription_id"):
                raise ValueError("No subscription found")

            subscription_id = subscription_data["stripe_subscription_id"]

            # Reactivate by removing cancel_at_period_end
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False
            )

            # Update database
            self.client.table(SUBSCRIPTION_TABLE).update({
                "cancel_at_period_end": False,
                "status": subscription.status,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).execute()

            logger.info(f"Reactivated subscription {subscription_id} for user {user_id}")

            return {
                "subscription_id": subscription_id,
                "status": subscription.status
            }

        except Exception as e:
            logger.error(f"Failed to reactivate subscription for user {user_id}: {e}")
            raise

    def handle_webhook_event(self, event_type: str, event_data: Dict[str, Any]) -> None:
        """Handle Stripe webhook events"""
        try:
            if event_type == "customer.subscription.created":
                self._handle_subscription_created(event_data)
            elif event_type == "customer.subscription.updated":
                self._handle_subscription_updated(event_data)
            elif event_type == "customer.subscription.deleted":
                self._handle_subscription_deleted(event_data)
            elif event_type == "invoice.payment_succeeded":
                self._handle_payment_succeeded(event_data)
            elif event_type == "invoice.payment_failed":
                self._handle_payment_failed(event_data)
            else:
                logger.info(f"Unhandled webhook event: {event_type}")

        except Exception as e:
            logger.error(f"Failed to handle webhook event {event_type}: {e}")
            raise

    def _handle_subscription_created(self, subscription_data: Dict[str, Any]) -> None:
        """Handle subscription created event"""
        user_id = subscription_data.get("metadata", {}).get("user_id")
        if not user_id:
            logger.warning("No user_id in subscription metadata")
            return

        plan_id = subscription_data.get("metadata", {}).get("plan_id", "basic")

        self._save_subscription_to_db(
            user_id=user_id,
            customer_id=subscription_data["customer"],
            subscription_id=subscription_data["id"],
            plan_id=plan_id,
            status=subscription_data["status"],
            current_period_start=datetime.fromtimestamp(subscription_data["current_period_start"], tz=timezone.utc),
            current_period_end=datetime.fromtimestamp(subscription_data["current_period_end"], tz=timezone.utc)
        )

    def _handle_subscription_updated(self, subscription_data: Dict[str, Any]) -> None:
        """Handle subscription updated event"""
        user_id = subscription_data.get("metadata", {}).get("user_id")
        if not user_id:
            logger.warning("No user_id in subscription metadata")
            return

        self.client.table(SUBSCRIPTION_TABLE).update({
            "status": subscription_data["status"],
            "current_period_start": datetime.fromtimestamp(subscription_data["current_period_start"], tz=timezone.utc).isoformat(),
            "current_period_end": datetime.fromtimestamp(subscription_data["current_period_end"], tz=timezone.utc).isoformat(),
            "cancel_at_period_end": subscription_data.get("cancel_at_period_end", False),
            "updated_at": datetime.utcnow().isoformat()
        }).eq("stripe_subscription_id", subscription_data["id"]).execute()

    def _handle_subscription_deleted(self, subscription_data: Dict[str, Any]) -> None:
        """Handle subscription deleted event"""
        self.client.table(SUBSCRIPTION_TABLE).update({
            "status": "canceled",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("stripe_subscription_id", subscription_data["id"]).execute()

    def _handle_payment_succeeded(self, invoice_data: Dict[str, Any]) -> None:
        """Handle successful payment - trigger credit renewal"""
        subscription_id = invoice_data.get("subscription")
        if not subscription_id:
            return

        # Get subscription from database
        result = self.client.table(SUBSCRIPTION_TABLE).select("user_id, plan_id").eq("stripe_subscription_id", subscription_id).maybe_single().execute()

        if not result.data:
            logger.warning(f"No subscription found for stripe_subscription_id: {subscription_id}")
            return

        user_id = result.data["user_id"]
        plan_id = result.data["plan_id"]

        # Import credit manager to trigger credit renewal
        from app.services.credits import credit_manager
        plan_config = settings.SUBSCRIPTION_PLANS.get(plan_id)
        if plan_config:
            credit_manager.renew_credits(user_id, plan_config["credits"], plan_id)

        logger.info(f"Renewed credits for user {user_id} to {plan_config['credits']} credits")

    def _handle_payment_failed(self, invoice_data: Dict[str, Any]) -> None:
        """Handle failed payment"""
        subscription_id = invoice_data.get("subscription")
        if subscription_id:
            self.client.table(SUBSCRIPTION_TABLE).update({
                "status": "past_due",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("stripe_subscription_id", subscription_id).execute()

            logger.warning(f"Payment failed for subscription {subscription_id}")

stripe_service = StripeService()