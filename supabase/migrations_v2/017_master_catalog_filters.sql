-- SLOTTY DB v2 — доп. поля для каталога (фильтры: проверенный мастер, акции).
-- Только ADD COLUMN IF NOT EXISTS, без удаления данных и таблиц.

alter table public.master_profiles
  add column if not exists is_verified boolean not null default false;

comment on column public.master_profiles.is_verified is 'Проверенный мастер (модерация / доверие)';

alter table public.master_services
  add column if not exists old_price_amount numeric(12, 2);

alter table public.master_services
  add column if not exists has_promotion boolean not null default false;

comment on column public.master_services.old_price_amount is 'Старая цена до скидки (если есть акция)';
comment on column public.master_services.has_promotion is 'Явная метка акции для фильтра каталога';

alter table public.master_services
  add constraint master_services_old_price_nonneg check (old_price_amount is null or old_price_amount >= 0::numeric);
