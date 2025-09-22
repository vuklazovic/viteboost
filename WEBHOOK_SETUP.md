# Stripe Webhook Setup Guide

## Database Migration Fix

First, run the updated migration in your Supabase SQL editor:

```sql
-- This is the corrected migration that includes the function definition
-- Copy and paste the entire content of: backend/db/migrations/003_create_user_subscriptions.sql
```

## Webhook Setup for Development

### Step 1: Install Stripe CLI

#### For macOS:
```bash
brew install stripe/stripe-cli/stripe
```

#### For Windows:
Download from: https://github.com/stripe/stripe-cli/releases

#### For Linux:
```bash
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_X.X.X_linux_x86_64.tar.gz
tar -xvf stripe_X.X.X_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin
```

### Step 2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with your Stripe account.

### Step 3: Forward Webhooks to Local Server

```bash
# Start your backend server first (usually on port 8000)
cd backend
python app/main.py

# In another terminal, forward webhooks:
stripe listen --forward-to localhost:8000/subscriptions/webhook
```

### Step 4: Get Webhook Secret

When you run the `stripe listen` command, you'll see output like:

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

Copy this secret and add it to your `backend/.env` file:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### Step 5: Test Webhooks

```bash
# Trigger a test event
stripe trigger customer.subscription.created
```

## Webhook Setup for Production

### Step 1: Create Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/subscriptions/webhook`
4. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Step 2: Get Webhook Secret

1. After creating the endpoint, click on it
2. Go to "Signing secret" section
3. Click "Reveal" to see the secret
4. Copy the secret starting with `whsec_`

### Step 3: Configure Production Environment

Add to your production environment variables:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_production_secret_here
```

## Testing Payment Flow

### Step 1: Use Test Cards

- **Successful payment**: `4242424242424242`
- **Declined payment**: `4000000000000002`
- **Requires authentication**: `4000002500003155`

### Step 2: Test Subscription Events

1. Create a subscription through your frontend
2. Watch the webhook logs in Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:8000/subscriptions/webhook --print-json
   ```

3. Check your application logs to see webhook processing

### Step 3: Test Credit Renewal

1. Create a test subscription
2. Trigger payment success:
   ```bash
   stripe trigger invoice.payment_succeeded
   ```
3. Verify credits are renewed in your database

## Webhook Events Handled

Your application handles these Stripe events:

- **`customer.subscription.created`**: New subscription created
- **`customer.subscription.updated`**: Subscription modified (plan change, etc.)
- **`customer.subscription.deleted`**: Subscription canceled
- **`invoice.payment_succeeded`**: Payment successful → Renew credits
- **`invoice.payment_failed`**: Payment failed → Mark subscription as past_due

## Webhook Security

### Development
- Webhook signature verification is optional (for testing)
- Set `STRIPE_WEBHOOK_SECRET=""` to disable verification

### Production
- **Always enable signature verification**
- Set the proper webhook secret
- Use HTTPS endpoints only

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**:
   ```bash
   # Check if the endpoint is accessible
   curl -X POST http://localhost:8000/subscriptions/webhook
   ```

2. **Signature verification failing**:
   - Ensure webhook secret is correct
   - Check that the endpoint URL matches exactly

3. **Events not processing**:
   - Check application logs
   - Verify database connectivity
   - Test individual webhook events

### Debug Webhook Events

```bash
# Log all webhook events with details
stripe listen --forward-to localhost:8000/subscriptions/webhook --print-json

# Test specific events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

### Check Webhook Delivery

1. Go to Stripe Dashboard → Webhooks
2. Click on your endpoint
3. View "Recent deliveries" to see success/failure status
4. Click on individual events to see request/response details

## Environment Variables Summary

### Backend (.env)
```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_51Rb16KDApD6mGm7q2O5pkiPKaODXtvRpkSphnv4k3gMD9JhKSMGJRi22LaioyHuYy30yeuv3qVDVmkuL36sVmCV200Xsrbsv0w
STRIPE_SECRET_KEY=sk_test_51Rb16KDApD6mGm7qK5AGONDfZbG1Lbjq99sWVV1qvf9M2dOzzstY9oJMn3t55CH7AQpnmoCasDbHG0s3Sk4bHqjI00Igg29QLs
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Other configuration...
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Frontend (.env)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Rb16KDApD6mGm7q2O5pkiPKaODXtvRpkSphnv4k3gMD9JhKSMGJRi22LaioyHuYy30yeuv3qVDVmkuL36sVmCV200Xsrbsv0w
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## Next Steps

1. **Apply the fixed migration** to your Supabase database
2. **Set up webhook forwarding** for development
3. **Test the complete payment flow** with test cards
4. **Monitor webhook events** during testing
5. **Configure production webhooks** when ready to deploy

The payment system is now ready for testing! 🎉