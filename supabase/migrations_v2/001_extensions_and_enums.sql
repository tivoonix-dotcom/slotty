-- SLOTTY DB v2 — extensions and enum types
-- Apply to an EMPTY project or after removing legacy v1 objects from public schema.

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------- enums

create type public.user_role as enum ('client', 'master', 'platform_admin');

create type public.master_publication_status as enum ('draft', 'published', 'hidden', 'blocked');

create type public.visit_type as enum ('studio', 'at_home');

create type public.price_type as enum ('fixed', 'from');

create type public.slot_status as enum ('available', 'booked', 'blocked', 'expired');

create type public.slot_source as enum ('manual', 'generated');

create type public.appointment_status as enum (
  'pending',
  'confirmed',
  'completed',
  'cancelled_by_client',
  'cancelled_by_master',
  'no_show'
);

create type public.review_status as enum ('published', 'hidden');

create type public.career_item_type as enum ('education', 'course', 'practice', 'work');

create type public.subscription_status as enum (
  'active',
  'trialing',
  'past_due',
  'cancelled',
  'incomplete'
);

create type public.billing_period as enum ('month', 'year');

create type public.notification_type as enum (
  'appointment_new',
  'appointment_confirmed',
  'appointment_reminder',
  'appointment_cancelled',
  'review_request',
  'billing',
  'system'
);
