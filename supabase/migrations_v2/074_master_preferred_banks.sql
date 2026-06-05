-- Предпочтительные банки для приёма оплаты мастером (карта / перевод).

alter table public.master_booking_rules
  add column if not exists preferred_bank_ids text[] not null default '{}';

comment on column public.master_booking_rules.preferred_bank_ids is
  'ID банков из справочника belarusBanks; только при способах card/transfer';
