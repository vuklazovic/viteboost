from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
import logging
import stripe

from app.services.auth import get_current_user
from app.services.stripe_service import stripe_service
from app.services.credits import credit_manager
from app.schemas.models import UserResponse
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

@router.get("/plans")
async def get_subscription_plans() -> Dict[str, Any]:
    """Get available subscription plans"""
    try:
        plans = stripe_service.get_available_plans()
        return {
            "plans": plans,
            "publishable_key": settings.STRIPE_PUBLISHABLE_KEY
        }
    except Exception as e:
        logger.error(f"Failed to get subscription plans: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription plans")

@router.post("/create")
async def create_subscription(
    request_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Create a new subscription"""
    try:
        plan_id = request_data.get("plan_id")
        payment_method_id = request_data.get("payment_method_id")

        if not plan_id or not payment_method_id:
            raise HTTPException(status_code=400, detail="Missing required fields")

        if plan_id == "free":
            raise HTTPException(status_code=400, detail="Cannot create subscription for free plan")

        # Validate plan exists
        if plan_id not in settings.SUBSCRIPTION_PLANS:
            raise HTTPException(status_code=400, detail="Invalid plan")

        # Check if user already has a subscription
        existing_subscription = stripe_service.get_user_subscription(current_user['user_id'])
        if existing_subscription and existing_subscription.get("status") in ["active", "trialing"]:
            raise HTTPException(status_code=400, detail="User already has an active subscription")

        # Create subscription
        subscription_result = stripe_service.create_subscription(
            user_id=current_user['user_id'],
            email=current_user['payload']['email'],
            plan_id=plan_id,
            payment_method_id=payment_method_id
        )

        # Update user's plan in credits system
        credit_manager.set_user_plan(current_user['user_id'], plan_id)

        return {
            "success": True,
            "subscription": subscription_result,
            "message": f"Successfully created {plan_id} subscription"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create subscription for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create subscription")

@router.get("/status")
async def get_subscription_status(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get user's current subscription status"""
    try:
        # Get subscription from database
        subscription = stripe_service.get_user_subscription(current_user['user_id'])

        # Get credit information
        credit_info = credit_manager.get_credit_info(current_user['user_id'])

        # Check if free credits need to be reset
        if credit_info["plan_id"] == "free":
            reset_amount = credit_manager.check_and_reset_free_credits_if_needed(current_user['user_id'])
            if reset_amount is not None:
                credit_info["credits"] = reset_amount

        # Get plan configuration
        plan_config = settings.SUBSCRIPTION_PLANS.get(credit_info["plan_id"], settings.SUBSCRIPTION_PLANS["free"])

        result = {
            "subscription": subscription,
            "plan": {
                "id": credit_info["plan_id"],
                "name": plan_config["name"],
                "price": plan_config["price"],
                "credits": plan_config["credits"]
            },
            "credits": {
                "current": credit_info["credits"],
                "last_reset": credit_info["last_credit_reset"],
                "next_reset": credit_info["next_credit_reset"]
            }
        }

        return result

    except Exception as e:
        logger.error(f"Failed to get subscription status for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get subscription status")

@router.post("/cancel")
async def cancel_subscription(
    request_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Cancel user's subscription"""
    try:
        at_period_end = request_data.get("at_period_end", True)

        result = stripe_service.cancel_subscription(
            user_id=current_user['user_id'],
            at_period_end=at_period_end
        )

        if not at_period_end:
            # If canceling immediately, reset to free plan
            credit_manager.set_user_plan(current_user['user_id'], "free")
            free_plan_config = settings.SUBSCRIPTION_PLANS["free"]
            credit_manager.renew_credits(current_user['user_id'], free_plan_config["credits"], "free")

        return {
            "success": True,
            "result": result,
            "message": "Subscription canceled successfully"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to cancel subscription for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to cancel subscription")

@router.post("/reactivate")
async def reactivate_subscription(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Reactivate a canceled subscription"""
    try:
        result = stripe_service.reactivate_subscription(current_user['user_id'])

        return {
            "success": True,
            "result": result,
            "message": "Subscription reactivated successfully"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to reactivate subscription for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to reactivate subscription")

@router.post("/webhook")
async def stripe_webhook(request: Request) -> JSONResponse:
    """Handle Stripe webhook events"""
    try:
        payload = await request.body()
        sig_header = request.headers.get("stripe-signature")

        if not settings.STRIPE_WEBHOOK_SECRET:
            logger.warning("No Stripe webhook secret configured, skipping signature verification")
            # For testing without webhook secret
            event = await request.json()
            event_type = event.get("type", "unknown")
            event_data = event.get("data", {}).get("object", {})
        else:
            # Verify webhook signature
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
                )
                event_type = event["type"]
                event_data = event["data"]["object"]
            except ValueError as e:
                logger.error(f"Invalid payload: {e}")
                raise HTTPException(status_code=400, detail="Invalid payload")
            except stripe.error.SignatureVerificationError as e:
                logger.error(f"Invalid signature: {e}")
                raise HTTPException(status_code=400, detail="Invalid signature")

        # Handle the webhook event
        logger.info(f"Received Stripe webhook: {event_type}")

        stripe_service.handle_webhook_event(event_type, event_data)

        return JSONResponse(content={"status": "success"})

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process webhook: {e}")
        raise HTTPException(status_code=500, detail="Failed to process webhook")

@router.get("/billing-portal")
async def get_billing_portal_url(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get Stripe billing portal URL for subscription management"""
    try:
        subscription = stripe_service.get_user_subscription(current_user['user_id'])

        if not subscription or not subscription.get("stripe_customer_id"):
            raise HTTPException(status_code=400, detail="No subscription found")

        # Create billing portal session
        session = stripe.billing_portal.Session.create(
            customer=subscription["stripe_customer_id"],
            return_url=f"{settings.FRONTEND_URL}/dashboard"
        )

        return {"url": session.url}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create billing portal session for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create billing portal session")

@router.post("/upgrade")
async def upgrade_subscription(
    request_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Upgrade user's subscription to a higher plan"""
    try:
        new_plan_id = request_data.get("plan_id")

        if not new_plan_id or new_plan_id not in settings.SUBSCRIPTION_PLANS:
            raise HTTPException(status_code=400, detail="Invalid plan")

        # Get current subscription
        subscription = stripe_service.get_user_subscription(current_user['user_id'])
        if not subscription or not subscription.get("stripe_subscription_id"):
            raise HTTPException(status_code=400, detail="No active subscription found")

        current_plan = subscription.get("plan_id", "free")

        # Validate upgrade path
        plan_hierarchy = ["free", "basic", "pro", "business"]
        if plan_hierarchy.index(new_plan_id) <= plan_hierarchy.index(current_plan):
            raise HTTPException(status_code=400, detail="Can only upgrade to a higher plan")

        # Get new plan's price ID
        new_plan_config = settings.SUBSCRIPTION_PLANS[new_plan_id]
        new_price_id = stripe_service._get_price_id_for_product(new_plan_config["stripe_product_id"])

        if not new_price_id:
            raise HTTPException(status_code=500, detail="Could not find price for new plan")

        # Update subscription in Stripe
        stripe_subscription = stripe.Subscription.modify(
            subscription["stripe_subscription_id"],
            items=[{
                "id": stripe.Subscription.retrieve(subscription["stripe_subscription_id"])["items"]["data"][0]["id"],
                "price": new_price_id,
            }],
            proration_behavior="always_invoice",
            metadata={"user_id": current_user['user_id'], "plan_id": new_plan_id}
        )

        # Update in database
        stripe_service._save_subscription_to_db(
            user_id=current_user['user_id'],
            customer_id=subscription["stripe_customer_id"],
            subscription_id=subscription["stripe_subscription_id"],
            plan_id=new_plan_id,
            status=stripe_subscription.status,
            current_period_start=stripe_subscription.current_period_start,
            current_period_end=stripe_subscription.current_period_end
        )

        # Update credits immediately
        credit_manager.renew_credits(current_user['user_id'], new_plan_config["credits"], new_plan_id)

        return {
            "success": True,
            "message": f"Successfully upgraded to {new_plan_config['name']} plan",
            "new_plan": new_plan_id,
            "new_credits": new_plan_config["credits"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upgrade subscription for user {current_user['user_id']}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upgrade subscription")