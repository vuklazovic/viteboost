from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict, Any, List
import logging
import stripe
from datetime import datetime

from app.core.config import settings
from app.services.auth import get_current_user

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/plans")
async def get_subscription_plans() -> Dict[str, Any]:
    """Get list of available subscription plans"""
    plans = []
    for plan_id, plan_data in settings.SUBSCRIPTION_PLANS.items():
        plan = {
            "id": plan_id,
            "name": plan_data["name"],
            "price": plan_data["price"],
            "credits": plan_data["credits"],
            "features": get_plan_features(plan_id)
        }
        plans.append(plan)

    return {
        "plans": plans,
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY
    }

@router.post("/create-checkout-session")
async def create_checkout_session(
    request_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Create a Stripe checkout session with user metadata"""
    try:
        plan_id = request_data.get("plan_id")

        if not plan_id or plan_id not in settings.SUBSCRIPTION_PLANS:
            raise HTTPException(status_code=400, detail="Invalid plan")

        if plan_id == "free":
            raise HTTPException(status_code=400, detail="Cannot create checkout for free plan")

        plan_config = settings.SUBSCRIPTION_PLANS[plan_id]

        # Create Stripe checkout session with user metadata
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'VibeBoost {plan_config["name"]} Plan',
                        'description': f'{plan_config["credits"]} credits per month'
                    },
                    'unit_amount': plan_config["price"],
                    'recurring': {
                        'interval': 'month'
                    }
                },
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/generate?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/pricing",
            metadata={
                'user_id': current_user['user_id'],
                'plan_id': plan_id,
                'user_email': current_user.get('payload', {}).get('email', '')
            },
            customer_email=current_user.get('payload', {}).get('email')
        )

        return {"checkout_url": checkout_session.url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create checkout session: {e}")
        raise HTTPException(status_code=500, detail="Failed to create checkout session")

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
        user_id = current_user.get("user_id") or current_user.get("id")
        logger.info(f"Getting subscription status for user: {user_id}")

        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")

        # Get user's subscription from database
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

        # Get subscription info
        subscription_result = client.table("user_subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()

        # Get current credits with error handling
        try:
            from app.services.credits import credit_manager
            user_credits = credit_manager.get_credits(user_id)
        except Exception as credit_error:
            logger.warning(f"Failed to get credits for user {user_id}: {credit_error}")
            user_credits = 0  # Default to 0 if credits fetch fails

        if subscription_result.data and subscription_result.data.get("status") == "active":
            # User has active subscription
            subscription_data = subscription_result.data
            plan_id = subscription_data.get("plan_id", "free")
            plan_config = settings.SUBSCRIPTION_PLANS.get(plan_id, settings.SUBSCRIPTION_PLANS["free"])

            # Get Stripe subscription details
            stripe_subscription_id = subscription_data.get("stripe_subscription_id")
            stripe_subscription = None
            if stripe_subscription_id:
                try:
                    stripe_subscription = stripe.Subscription.retrieve(stripe_subscription_id)
                except:
                    logger.warning(f"Failed to retrieve Stripe subscription {stripe_subscription_id}")

            # Safely extract Stripe subscription data
            current_period_start = None
            current_period_end = None
            cancel_at_period_end = False

            if stripe_subscription:
                try:
                    current_period_start = getattr(stripe_subscription, 'current_period_start', None)
                    current_period_end = getattr(stripe_subscription, 'current_period_end', None)
                    cancel_at_period_end = getattr(stripe_subscription, 'cancel_at_period_end', False)
                except Exception as stripe_error:
                    logger.warning(f"Error accessing Stripe subscription attributes: {stripe_error}")

            result = {
                "subscription": {
                    "id": subscription_data.get("id"),
                    "stripe_customer_id": subscription_data.get("stripe_customer_id"),
                    "stripe_subscription_id": stripe_subscription_id,
                    "plan_id": plan_id,
                    "status": subscription_data.get("status"),
                    "current_period_start": current_period_start,
                    "current_period_end": current_period_end,
                    "cancel_at_period_end": cancel_at_period_end
                },
                "plan": {
                    "id": plan_id,
                    "name": plan_config["name"],
                    "price": plan_config["price"],
                    "credits": plan_config["credits"]
                },
                "credits": {
                    "current": user_credits,
                    "last_reset": subscription_data.get("last_reset"),
                    "next_reset": subscription_data.get("next_reset")
                }
            }
        else:
            # User is on free plan
            plan_config = settings.SUBSCRIPTION_PLANS["free"]
            result = {
                "subscription": None,
                "plan": {
                    "id": "free",
                    "name": plan_config["name"],
                    "price": plan_config["price"],
                    "credits": plan_config["credits"]
                },
                "credits": {
                    "current": user_credits,
                    "last_reset": None,
                    "next_reset": None
                }
            }

        logger.info(f"Subscription status result for user {user_id}: {result}")
        return result

    except Exception as e:
        user_id = current_user.get('user_id', 'unknown')
        logger.error(f"Failed to get subscription status for user {user_id}: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
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
        logger.info(f"Event data keys: {list(event.get('data', {}).get('object', {}).keys())}")

        # Handle successful checkout sessions
        if event['type'] == 'checkout.session.completed':
            session = event['data']['object']
            logger.info(f"Checkout session data: customer_details={session.get('customer_details')}, amount_total={session.get('amount_total')}")
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
        logger.info(f"=== HANDLING SUCCESSFUL PAYMENT ===")

        # Get user info from metadata (required for checkout sessions)
        metadata = session.get('metadata', {})
        user_id = metadata.get('user_id')
        plan_id = metadata.get('plan_id')

        logger.info(f"Processing payment - User: {user_id}, Plan: {plan_id}")

        if not user_id or not plan_id:
            logger.error("Missing user_id or plan_id in session metadata. Session was not created properly.")
            logger.error(f"Metadata: {metadata}")
            return

        # Get session details
        customer_id = session.get('customer')
        subscription_id = session.get('subscription')
        logger.info(f"Customer ID: {customer_id}, Subscription ID: {subscription_id}")

        # Save subscription to database if we have subscription ID
        if subscription_id:
            logger.info(f"Saving subscription record...")
            await save_subscription_record(user_id, customer_id, subscription_id, plan_id)
        else:
            logger.warning("No subscription ID found in session")

        # Update user credits immediately
        logger.info(f"Updating user credits...")
        from app.services.credits import credit_manager
        plan_config = settings.SUBSCRIPTION_PLANS.get(plan_id)
        if plan_config:
            result = credit_manager.renew_credits(user_id, plan_config["credits"], plan_id)
            logger.info(f"Updated credits for user {user_id} to {plan_config['credits']} credits, result: {result}")
        else:
            logger.error(f"No plan config found for plan: {plan_id}")

        logger.info(f"=== PAYMENT HANDLING COMPLETED ===")

    except Exception as e:
        logger.error(f"Error handling successful payment: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")

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


@router.post("/cancel")
async def cancel_subscription(
    request_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Cancel user's subscription"""
    try:
        at_period_end = request_data.get("at_period_end", True)
        user_id = current_user.get("user_id") or current_user.get("id")

        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")

        # Get user's subscription from database
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

        result = client.table("user_subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="No active subscription found")

        subscription_id = result.data.get("stripe_subscription_id")
        if not subscription_id:
            raise HTTPException(status_code=404, detail="No Stripe subscription found")

        # Cancel the subscription in Stripe
        if at_period_end:
            # Cancel at period end
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
        else:
            # Cancel immediately
            subscription = stripe.Subscription.cancel(subscription_id)

        # Update database
        client.table("user_subscriptions").update({
            "status": subscription.status,
            "cancel_at_period_end": subscription.cancel_at_period_end,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("stripe_subscription_id", subscription_id).execute()

        # If canceled immediately, reset credits to free plan
        if not at_period_end:
            from app.services.credits import credit_manager
            free_credits = settings.SUBSCRIPTION_PLANS["free"]["credits"]
            credit_manager.renew_credits(user_id, free_credits, "free")

        return {
            "message": "Subscription canceled successfully",
            "canceled_at_period_end": at_period_end,
            "current_period_end": subscription.current_period_end
        }

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error canceling subscription: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to cancel subscription: {str(e)}")
    except Exception as e:
        logger.error(f"Error canceling subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")


@router.post("/reactivate")
async def reactivate_subscription(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Reactivate a canceled subscription"""
    try:
        user_id = current_user.get("user_id") or current_user.get("id")

        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")

        # Get user's subscription from database
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

        result = client.table("user_subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="No subscription found")

        subscription_id = result.data.get("stripe_subscription_id")
        if not subscription_id:
            raise HTTPException(status_code=404, detail="No Stripe subscription found")

        # Reactivate the subscription in Stripe
        subscription = stripe.Subscription.modify(
            subscription_id,
            cancel_at_period_end=False
        )

        # Update database
        client.table("user_subscriptions").update({
            "cancel_at_period_end": False,
            "updated_at": datetime.utcnow().isoformat()
        }).eq("stripe_subscription_id", subscription_id).execute()

        return {
            "message": "Subscription reactivated successfully",
            "current_period_end": subscription.current_period_end
        }

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error reactivating subscription: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to reactivate subscription: {str(e)}")
    except Exception as e:
        logger.error(f"Error reactivating subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to reactivate subscription")


@router.get("/billing-portal")
async def create_billing_portal_session(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Create a Stripe billing portal session"""
    try:
        user_id = current_user.get("user_id") or current_user.get("id")

        if not user_id:
            raise HTTPException(status_code=401, detail="User not authenticated")

        # Get user's subscription from database
        from supabase import create_client
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

        result = client.table("user_subscriptions").select("*").eq("user_id", user_id).maybe_single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="No subscription found")

        customer_id = result.data.get("stripe_customer_id")
        if not customer_id:
            raise HTTPException(status_code=404, detail="No Stripe customer found")

        # Create billing portal session
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{settings.FRONTEND_URL}/subscription"
        )

        return {"url": session.url}

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error creating billing portal: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to create billing portal: {str(e)}")
    except Exception as e:
        logger.error(f"Error creating billing portal: {e}")
        raise HTTPException(status_code=500, detail="Failed to create billing portal")

