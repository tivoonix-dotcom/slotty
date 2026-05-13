-- SLOTTY DB v2 — updated_at triggers, auth bootstrap, review aggregates

-- --------------------------------------------------------------------------- updated_at

create or replace function public.set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated
before update on public.profiles for each row
execute procedure public.set_updated_at ();

create trigger trg_telegram_identities_updated
before update on public.telegram_identities for each row
execute procedure public.set_updated_at ();

create trigger trg_service_categories_updated
before update on public.service_categories for each row
execute procedure public.set_updated_at ();

create trigger trg_master_profiles_updated
before update on public.master_profiles for each row
execute procedure public.set_updated_at ();

create trigger trg_master_services_updated
before update on public.master_services for each row
execute procedure public.set_updated_at ();

create trigger trg_master_locations_updated
before update on public.master_locations for each row
execute procedure public.set_updated_at ();

create trigger trg_master_schedule_rules_updated
before update on public.master_schedule_rules for each row
execute procedure public.set_updated_at ();

create trigger trg_master_availability_slots_updated
before update on public.master_availability_slots for each row
execute procedure public.set_updated_at ();

create trigger trg_appointments_updated
before update on public.appointments for each row
execute procedure public.set_updated_at ();

create trigger trg_reviews_updated
before update on public.reviews for each row
execute procedure public.set_updated_at ();

create trigger trg_notifications_updated
before update on public.notifications for each row
execute procedure public.set_updated_at ();

create trigger trg_master_portfolio_items_updated
before update on public.master_portfolio_items for each row
execute procedure public.set_updated_at ();

create trigger trg_master_certificates_updated
before update on public.master_certificates for each row
execute procedure public.set_updated_at ();

create trigger trg_master_career_items_updated
before update on public.master_career_items for each row
execute procedure public.set_updated_at ();

create trigger trg_subscription_plans_updated
before update on public.subscription_plans for each row
execute procedure public.set_updated_at ();

create trigger trg_master_subscriptions_updated
before update on public.master_subscriptions for each row
execute procedure public.set_updated_at ();

-- master_booking_rules: only updated_at column, still bump on any update
create trigger trg_master_booking_rules_updated
before update on public.master_booking_rules for each row
execute procedure public.set_updated_at ();

-- --------------------------------------------------------------------------- auth.users → profiles

create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tg bigint;
  v_full text;
  v_avatar text;
  v_username text;
  v_role public.user_role;
begin
  v_tg := coalesce(
    nullif(new.raw_user_meta_data ->> 'tg_id', '')::bigint,
    nullif(new.raw_user_meta_data ->> 'provider_id', '')::bigint,
    nullif(new.raw_user_meta_data ->> 'sub', '')::bigint
  );

  v_full := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(
      trim(
        concat_ws(
          ' ',
          nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
          nullif(trim(new.raw_user_meta_data ->> 'last_name'), '')
        )
      ),
      ''
    ),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    'Пользователь'
  );

  v_avatar := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'picture'), '')
  );

  v_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');

  begin
    v_role := (new.raw_user_meta_data ->> 'role')::public.user_role;
  exception
    when invalid_text_representation then
      v_role := 'client';
  end;

  insert into public.profiles(id, telegram_user_id, telegram_username, full_name, avatar_url, role)
    values (
      new.id,
      v_tg,
      v_username,
      coalesce(v_full, 'Пользователь'),
      nullif(v_avatar, ''),
      coalesce(v_role, 'client')
    )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure public.handle_new_user ();

-- --------------------------------------------------------------------------- review aggregates → master_profiles

create or replace function public.refresh_master_review_stats (p_master_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avg numeric(3, 2);
  v_cnt integer;
begin
  select
    coalesce(avg(r.rating::numeric), 0::numeric),
    count(*)::integer into v_avg,
    v_cnt
  from
    public.reviews r
  where
    r.master_id = p_master_id
    and r.status = 'published';

  update public.master_profiles mp
  set
    rating_avg = round(v_avg, 2),
    reviews_count = v_cnt
  where
    mp.master_id = p_master_id;
end;
$$;

create or replace function public.trg_reviews_refresh_master_stats ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mid uuid;
begin
  if tg_op = 'DELETE' then
    v_mid := old.master_id;
  else
    v_mid := new.master_id;
  end if;

  perform public.refresh_master_review_stats (v_mid);

  if tg_op = 'UPDATE' and old.master_id is distinct from new.master_id then
    perform public.refresh_master_review_stats (old.master_id);
  end if;

  return coalesce(new, old);
end;
$$;

create trigger trg_reviews_master_stats
after insert
or
update of rating,
status,
master_id
or delete on public.reviews for each row
execute procedure public.trg_reviews_refresh_master_stats ();
