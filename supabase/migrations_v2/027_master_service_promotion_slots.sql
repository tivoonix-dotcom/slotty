-- Привязка акций к конкретным окнам (умные акции на свободные слоты).

create table public.master_service_promotion_slots (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.master_service_promotions (id) on delete cascade,
  slot_id uuid not null references public.master_availability_slots (id) on delete cascade,
  master_id uuid not null references public.master_profiles (master_id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint master_service_promotion_slots_promotion_slot_key unique (promotion_id, slot_id)
);

-- Не более одной активной акции на окно — проверяется в POST /api/masters/me/promotions (template free_slots).

create index idx_master_service_promotion_slots_promotion
  on public.master_service_promotion_slots (promotion_id);

create index idx_master_service_promotion_slots_master
  on public.master_service_promotion_slots (master_id, slot_id);

comment on table public.master_service_promotion_slots is
  'Точная привязка акции к окнам; используется для template free_slots (умные акции).';

alter table public.master_service_promotion_slots enable row level security;
