-- SLOTTY DB v2 — тариф онбординга и интерес к Pro (без деструктива).

alter table public.master_profiles
  add column if not exists master_plan text not null default 'basic',
  add column if not exists pro_interested boolean not null default false,
  add column if not exists pro_status text,
  add column if not exists pro_started_at timestamptz,
  add column if not exists pro_expires_at timestamptz,
  add column if not exists published_at timestamptz;

comment on column public.master_profiles.master_plan is 'Тариф профиля: basic | pro (pro — после реальной оплаты / биллинга).';
comment on column public.master_profiles.pro_interested is 'Мастер оставил интерес к Pro при онбординге (без обязательства).';
comment on column public.master_profiles.pro_status is 'Статус Pro: inactive | interested | active | expired (текст для гибкости).';
comment on column public.master_profiles.pro_started_at is 'Начало оплаченного периода Pro.';
comment on column public.master_profiles.pro_expires_at is 'Окончание оплаченного периода Pro.';
comment on column public.master_profiles.published_at is 'Первое или последнее успешное опубликование профиля.';

do $$
begin
  alter table public.master_profiles
    add constraint master_profiles_master_plan_chk check (master_plan in ('basic', 'pro'));
exception
  when duplicate_object then null;
end $$;
