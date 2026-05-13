-- SLOTTY DB v2 — favorites, reviews, notifications

create table public.favorite_masters (
  client_id uuid not null references public.profiles (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, master_id)
);

create index idx_favorite_masters_master on public.favorite_masters (master_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid (),
  appointment_id uuid not null unique references public.appointments (id) on delete cascade,
  client_id uuid not null references public.profiles (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  rating smallint not null,
  constraint reviews_rating_range check (
    rating >= 1
    and rating <= 5
  ),
  body text not null,
  status public.review_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reviews_master_status_created on public.reviews (master_id, status, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  related_entity_type text,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notifications_user_created on public.notifications (user_id, created_at desc);

create index idx_notifications_user_unread on public.notifications (user_id)
where
  read_at is null;
