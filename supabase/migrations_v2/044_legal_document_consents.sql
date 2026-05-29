-- SLOTTY DB v2 — legal document versions + profile consent audit trail

create table if not exists public.legal_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_key text not null,
  version int not null check (version > 0),
  title text not null,
  effective_from date not null,
  content_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint legal_document_versions_key_version_unique unique (document_key, version)
);

create index if not exists legal_document_versions_active_idx
  on public.legal_document_versions (document_key)
  where is_active = true;

comment on table public.legal_document_versions is 'Versioned legal documents (terms, privacy, consents).';
comment on column public.legal_document_versions.content_hash is 'SHA-256 hex of canonical document body for audit.';

create table if not exists public.profile_consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  document_key text not null,
  document_version int not null check (document_version > 0),
  accepted boolean not null default true,
  accepted_at timestamptz not null default now(),
  ip_address inet,
  user_agent text,
  source text not null check (source in ('telegram', 'google', 'email', 'web')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  constraint profile_consents_profile_doc_version_unique
    unique (profile_id, document_key, document_version)
);

create index if not exists profile_consents_profile_id_idx
  on public.profile_consents (profile_id);

create index if not exists profile_consents_document_key_idx
  on public.profile_consents (document_key, document_version);

comment on table public.profile_consents is 'User acceptance of legal document versions (audit trail).';

-- Seed v1 documents (content_hash = placeholder; updated when legal text changes)
insert into public.legal_document_versions (document_key, version, title, effective_from, content_hash, is_active)
values
  ('terms', 1, 'Пользовательское соглашение', '2026-01-01', 'v1-terms', true),
  ('privacy', 1, 'Политика обработки персональных данных', '2026-01-01', 'v1-privacy', true),
  ('personal_data_consent', 1, 'Согласие на обработку персональных данных', '2026-01-01', 'v1-personal_data_consent', true),
  ('cross_border_consent', 1, 'Согласие на трансграничную передачу персональных данных', '2026-01-01', 'v1-cross_border_consent', true),
  ('master_terms', 1, 'Условия для мастеров', '2026-01-01', 'v1-master_terms', true)
on conflict (document_key, version) do nothing;
