-- Create user_subscriptions table to track Stripe subscription details
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  plan_id text not null, -- free, basic, pro, business
  status text not null default 'active', -- active, canceled, past_due, unpaid
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraints
  constraint fk_user_subscriptions_user_id foreign key (user_id) references auth.users(id) on delete cascade,
  constraint unique_user_subscription unique (user_id)
);

-- Enable RLS
alter table public.user_subscriptions enable row level security;

-- Create indexes for performance
create index if not exists idx_user_subscriptions_user_id on public.user_subscriptions(user_id);
create index if not exists idx_user_subscriptions_stripe_customer_id on public.user_subscriptions(stripe_customer_id);
create index if not exists idx_user_subscriptions_stripe_subscription_id on public.user_subscriptions(stripe_subscription_id);
create index if not exists idx_user_subscriptions_status on public.user_subscriptions(status);

-- Create or update the set_updated_at function if it doesn't exist
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to maintain updated_at
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_user_subscriptions_updated_at'
  ) then
    create trigger set_user_subscriptions_updated_at
      before update on public.user_subscriptions
      for each row execute function public.set_updated_at();
  end if;
end$$;

-- Add subscription-related fields to user_credits table
alter table public.user_credits add column if not exists plan_id text default 'free';
alter table public.user_credits add column if not exists last_credit_reset timestamptz default now();
alter table public.user_credits add column if not exists next_credit_reset timestamptz default (now() + interval '1 month');

-- Create index on user_credits plan_id
create index if not exists idx_user_credits_plan_id on public.user_credits(plan_id);
create index if not exists idx_user_credits_next_reset on public.user_credits(next_credit_reset);