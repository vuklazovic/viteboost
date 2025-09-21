-- Optimize user_credits table performance
-- Create indexes for common query patterns

-- Primary index on user_id for fast lookups (should already exist as PK)
-- Create index on updated_at for sorting/filtering by date
CREATE INDEX IF NOT EXISTS idx_user_credits_updated_at ON public.user_credits(updated_at);

-- Create index on credits for range queries (finding users with low credits, etc.)
CREATE INDEX IF NOT EXISTS idx_user_credits_amount ON public.user_credits(credits);

-- Create composite index for common query patterns (user_id + credits)
CREATE INDEX IF NOT EXISTS idx_user_credits_user_amount ON public.user_credits(user_id, credits);

-- Add constraint to ensure credits are non-negative
ALTER TABLE public.user_credits ADD CONSTRAINT chk_credits_non_negative CHECK (credits >= 0);

-- Optional: Add default value for created_at and updated_at if not already set
ALTER TABLE public.user_credits ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.user_credits ALTER COLUMN updated_at SET DEFAULT now();