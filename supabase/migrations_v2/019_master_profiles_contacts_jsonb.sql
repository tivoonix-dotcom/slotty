-- SLOTTY DB v2 — структурированные контакты мастера (не деструктивно: колонка nullable).

alter table public.master_profiles
  add column if not exists contacts jsonb;

comment on column public.master_profiles.contacts is
  'Массив контактов для клиентов: [{ "type": "telegram"|..., "value": "..." }]. Поле contact остаётся для обратной совместимости (краткая строка).';
