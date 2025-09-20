-- Create user_credits table to track balances
create table if not exists public.user_credits (
  user_id uuid primary key,
  credits integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS; no policies defined so anon access is blocked
alter table public.user_credits enable row level security;

-- Optional: trigger to maintain updated_at
do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_user_credits_updated_at'
  ) then
    create or replace function public.set_updated_at()
    returns trigger as $$
    begin
      new.updated_at = now();
      return new;
    end;
    $$ language plpgsql;

    create trigger set_user_credits_updated_at
      before update on public.user_credits
      for each row execute function public.set_updated_at();
  end if;
end$$;

