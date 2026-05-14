-- SLOTTY DB v2 — optional client contact fields + consent timestamps (nullable, non-destructive)

alter table public.profiles
  add column if not exists phone text,
  add column if not exists address text,
  add column if not exists privacy_consent_accepted_at timestamptz,
  add column if not exists terms_accepted_at timestamptz;

comment on column public.profiles.phone is 'Optional Belarus mobile; store normalized compact form +375XXXXXXXXX';
comment on column public.profiles.address is 'Optional client address hint for nearby search';
comment on column public.profiles.privacy_consent_accepted_at is 'When user accepted privacy policy in app (optional)';
comment on column public.profiles.terms_accepted_at is 'When user accepted terms of use in app (optional)';
