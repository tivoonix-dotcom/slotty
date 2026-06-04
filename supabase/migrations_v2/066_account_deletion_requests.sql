-- Запросы мастеров/пользователей на удаление аккаунта (обработка в platform-admin)

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  message text not null default '',
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references public.profiles (id) on delete set null,
  admin_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_deletion_requests_status_check check (
    status in ('pending', 'approved', 'rejected', 'cancelled')
  )
);

create unique index if not exists idx_account_deletion_requests_user_pending
  on public.account_deletion_requests (user_id)
  where status = 'pending';

create index if not exists idx_account_deletion_requests_status_requested
  on public.account_deletion_requests (status, requested_at desc);

create trigger trg_account_deletion_requests_updated
before update on public.account_deletion_requests
for each row execute function public.set_updated_at();
