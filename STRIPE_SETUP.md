# Stripe Payment System Setup

This document explains how to set up and use the Stripe payment system for VibeBoost.

## Overview

The payment system supports monthly recurring subscriptions with automatic credit renewal:

- **Free Plan**: $0/month, 15 credits (auto-renews monthly)
- **Basic Plan**: $12/month, 100 credits
- **Pro Plan**: $39/month, 500 credits
- **Business Plan**: $89/month, 1500 credits

## Backend Setup

### 1. Database Migration

Apply the subscription migration to create necessary tables:

```sql
-- Run this migration in your Supabase dashboard
-- File: backend/db/migrations/003_create_user_subscriptions.sql
```

### 2. Environment Variables

Update your `backend/.env` file with Stripe configuration:

```env
# Stripe Configuration (Test Keys)
STRIPE_PUBLISHABLE_KEY=pk_test_51Rb16KDApD6mGm7q2O5pkiPKaODXtvRpkSphnv4k3gMD9JhKSMGJRi22LaioyHuYy30yeuv3qVDVmkuL36sVmCV200Xsrbsv0w
STRIPE_SECRET_KEY=sk_test_51Rb16KDApD6mGm7qK5AGONDfZbG1Lbjq99sWVV1qvf9M2dOzzstY9oJMn3t55CH7AQpnmoCasDbHG0s3Sk4bHqjI00Igg29QLs
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Credits Configuration
INITIAL_CREDITS=15
```

### 3. Stripe Products Setup

In your Stripe dashboard, create the following products:

- **Basic Plan**: Product ID `prod_T6KHyx8rT3FuZw` - $12/month
- **Pro Plan**: Product ID `prod_T6KWg56uGCU5M8` - $39/month
- **Business Plan**: Product ID `prod_T6KXqIAYquAPt1` - $89/month

## Frontend Setup

### 1. Environment Variables

Create `frontend/.env` with:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51Rb16KDApD6mGm7q2O5pkiPKaODXtvRpkSphnv4k3gMD9JhKSMGJRi22LaioyHuYy30yeuv3qVDVmkuL36sVmCV200Xsrbsv0w
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 2. Install Dependencies

```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## API Endpoints

### Subscription Management

- `GET /subscriptions/plans` - Get available subscription plans
- `POST /subscriptions/create` - Create new subscription
- `GET /subscriptions/status` - Get user's subscription status
- `POST /subscriptions/cancel` - Cancel subscription
- `POST /subscriptions/reactivate` - Reactivate canceled subscription
- `POST /subscriptions/upgrade` - Upgrade to higher plan
- `GET /subscriptions/billing-portal` - Get Stripe billing portal URL

### Webhook Handling

- `POST /subscriptions/webhook` - Handle Stripe webhook events

## Testing

### 1. Test Cards

Use Stripe test cards for testing:

- **Success**: `4242424242424242`
- **Decline**: `4000000000000002`
- **3D Secure**: `4000002500003155`

### 2. Webhook Testing

1. Install Stripe CLI
2. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:8000/subscriptions/webhook
   ```
3. Copy webhook secret to `.env` file

## Usage

### Subscription Flow

1. User visits `/subscription` page
2. Selects a plan and enters payment information
3. Stripe processes payment and creates subscription
4. Webhook updates user's credits and subscription status
5. Credits are automatically renewed each billing cycle

### Credit Management

- Free users get 15 credits that reset monthly
- Paid subscribers get their plan's credits renewed monthly
- Credits are consumed when generating images
- Credit balance is checked before each generation

## Production Deployment

1. Replace test Stripe keys with live keys
2. Set up production webhook endpoint
3. Configure proper CORS settings
4. Enable webhook signature verification

## Troubleshooting

### Common Issues

1. **Payment fails**: Check Stripe logs in dashboard
2. **Credits not renewing**: Verify webhook is receiving events
3. **Subscription not updating**: Check database tables and logs

### Logs

Check application logs for Stripe-related errors:
- Backend: FastAPI logs
- Stripe: Dashboard event logs
- Database: Supabase logs

## Security

- Webhook signatures are verified in production
- Payment processing happens server-side
- Sensitive data is not stored in frontend
- Credit operations are atomic to prevent race conditions