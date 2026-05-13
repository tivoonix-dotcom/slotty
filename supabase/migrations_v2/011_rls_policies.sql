-- SLOTTY DB v2 — Row Level Security policies
-- Assumes Supabase roles: anon, authenticated, service_role (service_role bypasses RLS).

-- --------------------------------------------------------------------------- enable RLS

alter table public.profiles enable row level security;

alter table public.telegram_identities enable row level security;

alter table public.service_categories enable row level security;

alter table public.master_profiles enable row level security;

alter table public.master_services enable row level security;

alter table public.master_locations enable row level security;

alter table public.master_schedule_rules enable row level security;

alter table public.master_availability_slots enable row level security;

alter table public.appointments enable row level security;

alter table public.favorite_masters enable row level security;

alter table public.reviews enable row level security;

alter table public.notifications enable row level security;

alter table public.master_portfolio_items enable row level security;

alter table public.master_certificates enable row level security;

alter table public.master_career_items enable row level security;

alter table public.master_booking_rules enable row level security;

alter table public.payment_methods enable row level security;

alter table public.master_payment_methods enable row level security;

alter table public.subscription_plans enable row level security;

alter table public.master_subscriptions enable row level security;

alter table public.booking_vouchers enable row level security;

-- --------------------------------------------------------------------------- profiles

create policy profiles_select_own on public.profiles for
select
  to authenticated using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles for
update
  to authenticated using (id = (select auth.uid()))
with
  check (id = (select auth.uid()));

-- --------------------------------------------------------------------------- telegram_identities

create policy telegram_identities_select_own on public.telegram_identities for
select
  to authenticated using (profile_id = (select auth.uid()));

create policy telegram_identities_insert_own on public.telegram_identities for insert to authenticated
with
  check (profile_id = (select auth.uid()));

create policy telegram_identities_update_own on public.telegram_identities for
update
  to authenticated using (profile_id = (select auth.uid()))
with
  check (profile_id = (select auth.uid()));

create policy telegram_identities_delete_own on public.telegram_identities for delete to authenticated using (profile_id = (select auth.uid()));

-- --------------------------------------------------------------------------- service_categories (read-only catalog)

create policy service_categories_select_all on public.service_categories for
select
  using (true);

-- --------------------------------------------------------------------------- master_profiles

create policy master_profiles_select_public_or_own on public.master_profiles for
select
  using (
    publication_status = 'published'
    or master_id = (select auth.uid())
  );

create policy master_profiles_insert_self on public.master_profiles for insert to authenticated
with
  check (master_id = (select auth.uid()));

create policy master_profiles_update_own on public.master_profiles for
update
  to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

create policy master_profiles_delete_own on public.master_profiles for delete to authenticated using (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_services

create policy master_services_select_catalog_or_own on public.master_services for
select
  using (
    master_id = (select auth.uid())
    or (
      is_active = true
      and exists (
        select
          1
        from
          public.master_profiles mp
        where
          mp.master_id = master_services.master_id
          and mp.publication_status = 'published'
      )
    )
  );

create policy master_services_write_own on public.master_services for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_locations

create policy master_locations_select_public_or_own on public.master_locations for
select
  using (
    master_id = (select auth.uid())
    or (
      is_primary = true
      and exists (
        select
          1
        from
          public.master_profiles mp
        where
          mp.master_id = master_locations.master_id
          and mp.publication_status = 'published'
      )
    )
  );

create policy master_locations_write_own on public.master_locations for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_schedule_rules

create policy master_schedule_rules_select_public_or_own on public.master_schedule_rules for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_schedule_rules.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_schedule_rules_write_own on public.master_schedule_rules for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_availability_slots

create policy master_slots_select_public_or_own on public.master_availability_slots for
select
  using (
    master_id = (select auth.uid())
    or (
      status = 'available'
      and exists (
        select
          1
        from
          public.master_profiles mp
        where
          mp.master_id = master_availability_slots.master_id
          and mp.publication_status = 'published'
      )
    )
  );

create policy master_slots_write_own on public.master_availability_slots for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- appointments (no direct insert from clients)

create policy appointments_select_party on public.appointments for
select
  to authenticated using (
    client_id = (select auth.uid())
    or master_id = (select auth.uid())
  );

create policy appointments_insert_blocked on public.appointments for insert to authenticated
with
  check (false);

create policy appointments_update_party on public.appointments for
update
  to authenticated using (
    client_id = (select auth.uid())
    or master_id = (select auth.uid())
  )
with
  check (
    client_id = (select auth.uid())
    or master_id = (select auth.uid())
  );

-- --------------------------------------------------------------------------- favorite_masters

create policy favorite_masters_all_own on public.favorite_masters for all to authenticated using (client_id = (select auth.uid()))
with
  check (client_id = (select auth.uid()));

-- --------------------------------------------------------------------------- reviews

create policy reviews_select_public_or_party on public.reviews for
select
  using (
    status = 'published'
    or client_id = (select auth.uid())
    or master_id = (select auth.uid())
  );

create policy reviews_insert_completed on public.reviews for insert to authenticated
with
  check (
    client_id = (select auth.uid())
    and master_id = (
      select
        a.master_id
      from
        public.appointments a
      where
        a.id = appointment_id
    )
    and exists (
      select
        1
      from
        public.appointments a
      where
        a.id = appointment_id
        and a.client_id = (select auth.uid())
        and a.status = 'completed'
    )
  );

create policy reviews_update_own_client on public.reviews for
update
  to authenticated using (client_id = (select auth.uid()))
with
  check (client_id = (select auth.uid()));

create policy reviews_delete_own_client on public.reviews for delete to authenticated using (client_id = (select auth.uid()));

-- --------------------------------------------------------------------------- notifications

create policy notifications_select_own on public.notifications for
select
  to authenticated using (user_id = (select auth.uid()));

create policy notifications_update_read_own on public.notifications for
update
  to authenticated using (user_id = (select auth.uid()))
with
  check (user_id = (select auth.uid()));

-- --------------------------------------------------------------------------- trust: portfolio / certificates / career

create policy master_portfolio_select_public_or_own on public.master_portfolio_items for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_portfolio_items.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_portfolio_write_own on public.master_portfolio_items for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

create policy master_certificates_select_public_or_own on public.master_certificates for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_certificates.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_certificates_write_own on public.master_certificates for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

create policy master_career_select_public_or_own on public.master_career_items for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_career_items.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_career_write_own on public.master_career_items for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- master_booking_rules

create policy master_booking_rules_select_public_or_own on public.master_booking_rules for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_booking_rules.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_booking_rules_write_own on public.master_booking_rules for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- payment_methods (read-only reference)

create policy payment_methods_select_all on public.payment_methods for
select
  using (true);

-- --------------------------------------------------------------------------- master_payment_methods

create policy master_payment_methods_select_public_or_own on public.master_payment_methods for
select
  using (
    master_id = (select auth.uid())
    or exists (
      select
        1
      from
        public.master_profiles mp
      where
        mp.master_id = master_payment_methods.master_id
        and mp.publication_status = 'published'
    )
  );

create policy master_payment_methods_write_own on public.master_payment_methods for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- subscription_plans

create policy subscription_plans_select_all on public.subscription_plans for
select
  using (true);

-- --------------------------------------------------------------------------- master_subscriptions

create policy master_subscriptions_select_own on public.master_subscriptions for
select
  to authenticated using (master_id = (select auth.uid()));

create policy master_subscriptions_write_own on public.master_subscriptions for all to authenticated using (master_id = (select auth.uid()))
with
  check (master_id = (select auth.uid()));

-- --------------------------------------------------------------------------- booking_vouchers

create policy booking_vouchers_select_party on public.booking_vouchers for
select
  to authenticated using (
    exists (
      select
        1
      from
        public.appointments a
      where
        a.id = booking_vouchers.appointment_id
        and (
          a.client_id = (select auth.uid())
          or a.master_id = (select auth.uid())
        )
    )
  );

create policy booking_vouchers_insert_blocked on public.booking_vouchers for insert to authenticated
with
  check (false);
