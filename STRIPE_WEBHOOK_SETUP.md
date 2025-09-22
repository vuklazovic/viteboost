# 🔗 Stripe Webhook Setup Guide

## 🎯 Overview

Now that your Stripe payment links are working, you need to set up webhooks so that your backend gets notified when payments succeed and can update user subscriptions and credits automatically.

## 🚀 Setting Up Webhooks in Stripe

### Step 1: Access Webhook Settings

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**

### Step 2: Configure Webhook Endpoint

**Endpoint URL**: Enter your backend webhook URL:
- For local testing: `http://localhost:8000/subscriptions/webhook`
- For production: `https://yourdomain.com/subscriptions/webhook`

**Events to send**: Select these events:
- `checkout.session.completed` ✅ (When payment succeeds)
- `customer.subscription.created` ✅ (When subscription is created)
- `customer.subscription.updated` ✅ (When subscription changes)
- `customer.subscription.deleted` ✅ (When subscription is canceled)

### Step 3: For Local Testing (ngrok)

Since Stripe needs to reach your local server, you'll need to use ngrok:

1. **Install ngrok**: `brew install ngrok` (Mac) or download from ngrok.com
2. **Start your backend**: Make sure it's running on port 8000
3. **Start ngrok**: `ngrok http 8000`
4. **Copy the URL**: ngrok will give you a URL like `https://abc123.ngrok.io`
5. **Update webhook URL**: Use `https://abc123.ngrok.io/subscriptions/webhook`

## 🧪 Testing Webhooks

### Step 1: Make a Test Purchase

1. Go to your frontend: `http://localhost:8082`
2. Click on a subscription plan (Basic, Pro, or Business)
3. Complete payment with test card: `4242 4242 4242 4242`

### Step 2: Check Backend Logs

After payment, you should see webhook logs in your backend terminal:

```
INFO: Received Stripe webhook: checkout.session.completed
INFO: Processing payment for user@example.com, plan: basic, amount: 1200
```

### Step 3: Verify Database Updates

The webhook should automatically:
- Create a record in `user_subscriptions` table
- Update user credits for the new plan
- Set up monthly credit renewal

## 🔧 Current Webhook Implementation

Your webhook currently handles:

### ✅ **checkout.session.completed**
- Extracts customer email and payment amount
- Determines subscription plan from amount
- Logs successful payment processing

### ✅ **customer.subscription.created**
- Records new subscription creation
- Logs customer ID and subscription details

### ✅ **customer.subscription.updated**
- Handles subscription status changes
- Logs updates for monitoring

## 🎯 Next Steps for Full Integration

To complete the webhook integration, you'll need to connect it to your user system:

### 1. User Identification
Currently webhooks identify users by email. You may want to:
- Add user ID to payment link metadata
- Match webhook emails to your user database
- Handle cases where email doesn't match existing users

### 2. Database Updates
Implement actual database operations in the webhook handlers:
- Insert/update `user_subscriptions` table
- Update user credits via credit manager
- Set up automatic credit renewal

### 3. Error Handling
Add robust error handling for:
- Failed database operations
- Duplicate webhook events
- Invalid or missing data

## 🔒 Security (Production)

For production, add webhook signature verification:

```python
# Add to webhook function
import hashlib
import hmac

def verify_webhook_signature(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected_signature}", signature)
```

## 🐛 Troubleshooting

### Common Issues:

1. **No webhooks received**:
   - Check ngrok is running and URL is correct
   - Verify webhook endpoint is added in Stripe
   - Check if backend is accessible from internet

2. **Webhook errors**:
   - Check backend logs for error details
   - Verify webhook events are configured correctly
   - Test webhook endpoint manually with curl

3. **Database not updating**:
   - Check if webhook handlers are calling database functions
   - Verify database connection and permissions
   - Look for error logs in webhook processing

### Manual Testing:

Test webhook endpoint manually:
```bash
curl -X POST http://localhost:8000/subscriptions/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "data": {"object": {}}}'
```

## 📊 Monitoring

Monitor webhook performance:
- Check Stripe webhook logs for delivery status
- Monitor backend logs for processing errors
- Set up alerts for failed webhook processing

## 🎉 Expected Flow After Setup

1. **User completes payment** → Stripe processes payment
2. **Stripe sends webhook** → Your backend receives notification
3. **Backend processes webhook** → Updates user subscription and credits
4. **User gets access** → Credits updated, subscription active
5. **Automatic renewal** → Monthly credit refresh via webhooks

Your webhook system will make the subscription process completely automated! 🚀