from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any, List
import logging
import stripe

from app.core.config import settings
from app.services.auth import get_current_user

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# Stripe Payment Links for each plan (you'll need to create these in Stripe Dashboard)
PAYMENT_LINKS = {
    "basic": "https://buy.stripe.com/test_cNicN519E46LbVA6ggbZe02",  # Replace with actual Stripe payment link
    "pro": "https://buy.stripe.com/test_bJeeVddWq32HaRw6ggbZe01",      # Replace with actual Stripe payment link
    "business": "https://buy.stripe.com/test_00w9AT9Ga6eT3p47kkbZe00"  # Replace with actual Stripe payment link
}

@router.get("/plans")
async def get_subscription_plans() -> Dict[str, Any]:
    """Get list of available subscription plans with payment links"""
    plans = []
    for plan_id, plan_data in settings.SUBSCRIPTION_PLANS.items():
        plan = {
            "id": plan_id,
            "name": plan_data["name"],
            "price": plan_data["price"],
            "credits": plan_data["credits"],
            "features": get_plan_features(plan_id)
        }

        # Add payment link for paid plans
        if plan_id in PAYMENT_LINKS:
            plan["payment_link"] = PAYMENT_LINKS[plan_id]

        plans.append(plan)

    return {
        "plans": plans,
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY
    }

def get_plan_features(plan_id: str) -> List[str]:
    """Get features for a specific plan"""
    features_map = {
        "free": [
            "15 credits per month",
            "Basic image generation",
            "Standard processing speed",
            "Email support"
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

@router.get("/status")
async def get_subscription_status(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get user's current subscription status"""
    try:
        # For now, return free plan status
        # You can enhance this later to check actual subscription status from database

        plan_config = settings.SUBSCRIPTION_PLANS["free"]

        result = {
            "subscription": None,  # No active paid subscription
            "plan": {
                "id": "free",
                "name": plan_config["name"],
                "price": plan_config["price"],
                "credits": plan_config["credits"]
            },
            "credits": {
                "current": 15,  # You can get this from credit manager later
                "last_reset": None,
                "next_reset": None
            }
        }

        return result

    except Exception as e:
        user_id = current_user.get('user_id', 'unknown')
        logger.error(f"Failed to get subscription status for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription status")

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""

    try:
        # Get the request body
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        if settings.STRIPE_WEBHOOK_SECRET:
            # Verify webhook signature
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
                )
            except ValueError as e:
                logger.error(f"Invalid payload: {e}")
                raise HTTPException(status_code=400, detail="Invalid payload")
            except stripe.error.SignatureVerificationError as e:
                logger.error(f"Invalid signature: {e}")
                raise HTTPException(status_code=400, detail="Invalid signature")
        else:
            # For testing without webhook secret
            event = stripe.Event.construct_from(
                stripe.util.convert_to_stripe_object(payload), stripe.api_key
            )

        logger.info(f"Received Stripe webhook: {event['type']}")

        # Handle successful checkout sessions
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            await handle_successful_payment(session)

        # Handle subscription events
        elif event['type'] == 'customer.subscription.created':
            subscription = event['data']['object']
            await handle_subscription_created(subscription)

        elif event['type'] == 'customer.subscription.updated':
            subscription = event['data']['object']
            await handle_subscription_updated(subscription)

        elif event['type'] == 'invoice.payment_succeeded':
            invoice = event['data']['object']
            await handle_payment_succeeded(invoice)

        return {"status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

async def handle_successful_payment(session):
    """Handle successful payment from checkout session"""
    try:
        # Extract customer email from the session
        customer_email = session.get('customer_details', {}).get('email')

        if not customer_email:
            logger.warning("No customer email in checkout session")
            return

        # Determine plan from the session
        amount = session.get('amount_total', 0)
        plan_id = determine_plan_from_amount(amount)

        logger.info(f"Processing payment for {customer_email}, plan: {plan_id}, amount: {amount}")

        # Find user by email (you might need to adjust this based on your auth system)
        user_id = await find_user_by_email(customer_email)
        if not user_id:
            logger.error(f"Could not find user with email: {customer_email}")
            return

        # Create customer record if needed
        customer_id = session.get('customer')
        subscription_id = session.get('subscription')

        # Save subscription to database if we have subscription ID
        if subscription_id:
            await save_subscription_record(user_id, customer_id, subscription_id, plan_id)

        # Update user credits immediately
        from app.services.credits import credit_manager
        plan_config = settings.SUBSCRIPTION_PLANS.get(plan_id)
        if plan_config:
            credit_manager.renew_credits(user_id, plan_config["credits"], plan_id)
            logger.info(f"Updated credits for user {user_id} to {plan_config['credits']} credits")

    except Exception as e:
        logger.error(f"Error handling successful payment: {e}")

async def handle_subscription_created(subscription):
    """Handle subscription creation"""
    try:
        customer_id = subscription.get('customer')
        subscription_id = subscription.get('id')
        logger.info(f"Subscription {subscription_id} created for customer: {customer_id}")

        # This is typically handled by checkout.session.completed, so just log for now

    except Exception as e:
        logger.error(f"Error handling subscription creation: {e}")

async def handle_subscription_updated(subscription):
    """Handle subscription updates"""
    try:
        customer_id = subscription.get('customer')
        subscription_id = subscription.get('id')
        status = subscription.get('status')
        logger.info(f"Subscription {subscription_id} updated for customer: {customer_id}, status: {status}")

        # Update subscription status in database
        await update_subscription_status(subscription_id, status)

    except Exception as e:
        logger.error(f"Error handling subscription update: {e}")

async def handle_payment_succeeded(invoice):
    """Handle successful recurring payments - renew credits"""
    try:
        subscription_id = invoice.get('subscription')
        if not subscription_id:
            return

        logger.info(f"Payment succeeded for subscription: {subscription_id}")

        # Get user from subscription
        user_id = await get_user_from_subscription(subscription_id)
        if not user_id:
            logger.error(f"Could not find user for subscription: {subscription_id}")
            return

        # Get user's current plan and renew credits
        from app.services.credits import credit_manager
        plan_id = credit_manager.get_user_plan(user_id)
        plan_config = settings.SUBSCRIPTION_PLANS.get(plan_id)

        if plan_config and plan_id != "free":
            credit_manager.renew_credits(user_id, plan_config["credits"], plan_id)
            logger.info(f"Renewed credits for user {user_id} to {plan_config['credits']} credits")

    except Exception as e:
        logger.error(f"Error handling payment succeeded: {e}")

async def find_user_by_email(email: str) -> str:
    """Find user ID by email address"""
    try:
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

        # Try direct SQL query to auth.users table (more reliable)
        try:
            result = client.rpc('get_user_by_email', {'email_input': email}).execute()
            if result.data:
                return result.data
        except Exception as rpc_error:
            logger.info(f"RPC method not available, trying admin API: {rpc_error}")

        # Fallback to admin API with better error handling
        try:
            result = client.auth.admin.list_users()

            # Handle different response structures
            users_list = []
            if hasattr(result, 'users'):
                users_list = result.users
            elif hasattr(result, 'data') and isinstance(result.data, list):
                users_list = result.data
            elif isinstance(result, dict) and 'users' in result:
                users_list = result['users']
            elif isinstance(result, list):
                users_list = result
            else:
                logger.error(f"Cannot parse auth result: {type(result)} - {result}")
                return None

            # Search for user by email
            for user in users_list:
                user_email = None
                user_id = None

                if hasattr(user, 'email'):
                    user_email = user.email
                    user_id = user.id
                elif isinstance(user, dict):
                    user_email = user.get('email')
                    user_id = user.get('id')

                if user_email == email and user_id:
                    logger.info(f"Found user {user_id} for email {email}")
                    return user_id

            logger.warning(f"User not found with email: {email}")
            return None

        except Exception as admin_error:
            logger.error(f"Admin API error: {admin_error}")
            return None

    except Exception as e:
        logger.error(f"Error finding user by email {email}: {e}")
        return None

async def save_subscription_record(user_id: str, customer_id: str, subscription_id: str, plan_id: str):
    """Save subscription record to database"""
    try:
        from supabase import create_client
        from datetime import datetime, timezone

        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

        if subscription_id:
            # Get subscription details from Stripe
            subscription = stripe.Subscription.retrieve(subscription_id)

            # Convert timestamps to ISO format strings
            current_period_start = None
            current_period_end = None

            if hasattr(subscription, 'current_period_start') and subscription.current_period_start:
                current_period_start = datetime.fromtimestamp(subscription.current_period_start, tz=timezone.utc).isoformat()

            if hasattr(subscription, 'current_period_end') and subscription.current_period_end:
                current_period_end = datetime.fromtimestamp(subscription.current_period_end, tz=timezone.utc).isoformat()

            data = {
                "user_id": user_id,
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": subscription_id,
                "plan_id": plan_id,
                "status": getattr(subscription, 'status', 'active'),
                "current_period_start": current_period_start,
                "current_period_end": current_period_end
            }
        else:
            # For one-time payments without subscription ID
            data = {
                "user_id": user_id,
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": None,
                "plan_id": plan_id,
                "status": 'active',
                "current_period_start": datetime.now(timezone.utc).isoformat(),
                "current_period_end": None
            }

        # Use upsert to handle case where subscription already exists
        client.table("user_subscriptions").upsert(data, on_conflict="user_id").execute()
        logger.info(f"Saved subscription record for user {user_id}")

    except Exception as e:
        logger.error(f"Error saving subscription record: {e}")
        logger.error(f"Error details: user_id={user_id}, customer_id={customer_id}, subscription_id={subscription_id}, plan_id={plan_id}")

async def update_subscription_status(subscription_id: str, status: str):
    """Update subscription status in database"""
    try:
        from supabase import create_client
        from datetime import datetime

        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

        client.table("user_subscriptions").update({
            "status": status,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("stripe_subscription_id", subscription_id).execute()

        logger.info(f"Updated subscription {subscription_id} status to {status}")

    except Exception as e:
        logger.error(f"Error updating subscription status: {e}")

async def get_user_from_subscription(subscription_id: str) -> str:
    """Get user ID from subscription ID"""
    try:
        from supabase import create_client

        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

        result = client.table("user_subscriptions").select("user_id").eq("stripe_subscription_id", subscription_id).maybe_single().execute()

        if result.data:
            return result.data["user_id"]
        return None

    except Exception as e:
        logger.error(f"Error getting user from subscription {subscription_id}: {e}")
        return None

def determine_plan_from_amount(amount_cents):
    """Determine plan ID from payment amount"""
    if amount_cents == 1200:  # $12.00
        return "basic"
    elif amount_cents == 3900:  # $39.00
        return "pro"
    elif amount_cents == 8900:  # $89.00
        return "business"
    else:
        logger.warning(f"Unknown amount: {amount_cents}")
        return "basic"  # Default to basic