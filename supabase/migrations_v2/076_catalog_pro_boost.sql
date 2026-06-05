-- Pro entitlement + capped boost в recommended sort каталога.

create or replace function public.catalog_master_pro_entitled(p_master_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
      from public.master_subscriptions ms
      join public.subscription_plans sp on sp.id = ms.plan_id
      left join public.master_profiles mp on mp.master_id = ms.master_id
     where ms.master_id = p_master_id
       and sp.code = 'pro'
       and (
         (
           ms.status = 'trialing'::public.subscription_status
           and ms.trial_ends_at is not null
           and ms.trial_ends_at > now()
         )
         or (
           ms.status::text in ('active', 'canceled_at_period_end', 'past_due', 'payment_failed')
           and ms.current_period_end > now()
         )
         or (
           mp.pro_expires_at is not null
           and mp.pro_expires_at > now()
         )
       )
  );
$$;

comment on function public.catalog_master_pro_entitled(uuid) is
  'Pro/trial entitlement для каталога: trialing, paid period, complimentary pro_expires_at';

create or replace function public.catalog_pro_boost_score(
  p_rating numeric,
  p_reviews int,
  p_has_slot boolean,
  p_is_verified boolean,
  p_is_pro boolean
)
returns numeric
language sql
immutable
as $$
  select case
    when not coalesce(p_is_pro, false) or not coalesce(p_has_slot, false) then 0::numeric
    else least(
      10::numeric,
      greatest(
        0::numeric,
        coalesce(p_rating, 0) * 1.5
        + least(ln(greatest(coalesce(p_reviews, 0), 0) + 1), 3)
        + case when coalesce(p_is_verified, false) then 1 else 0 end
      )
    )
  end;
$$;

-- Пересоздаём RPC с pro boost (recommended/soonest) и полем isProEntitled в JSON.
create or replace function public.catalog_search_listings(
  p_search text default null,
  p_category_code text default null,
  p_location_id uuid default null,
  p_address_text text default null,
  p_date_range text default 'any',
  p_time_of_day text default 'any',
  p_min_price numeric default null,
  p_max_price numeric default null,
  p_min_rating numeric default null,
  p_min_reviews int default null,
  p_visit_type text default 'any',
  p_verified_only boolean default false,
  p_promotion_only boolean default false,
  p_duration_preset text default 'any',
  p_sort_by text default 'recommended',
  p_page int default 1,
  p_limit int default 24
)
returns jsonb
language plpgsql
stable
set search_path = public
as $$
declare
  v_search text;
  v_search_pat text;
  v_addr text;
  v_addr_pat text;
  v_page int;
  v_limit int;
  v_offset int;
  v_total int;
  v_items jsonb;
  v_cat text;
begin
  v_search := catalog_safe_ilike_fragment(p_search);
  v_search_pat := case when v_search is not null then '%' || v_search || '%' else null end;
  v_addr := catalog_safe_ilike_fragment(p_address_text);
  v_addr_pat := case when v_addr is not null then '%' || v_addr || '%' else null end;
  v_cat := nullif(trim(coalesce(p_category_code, '')), '');
  v_page := greatest(1, least(coalesce(p_page, 1), 500));
  v_limit := greatest(1, least(coalesce(p_limit, 24), 80));
  v_offset := (v_page - 1) * v_limit;

  with filtered as (
    select
      mp.master_id,
      mp.display_name,
      mp.bio,
      mp.photo_url,
      mp.slug,
      mp.rating_avg,
      mp.reviews_count,
      mp.is_verified,
      sc.code as category_code,
      sc.name as category_name,
      ml.public_address,
      ml.city,
      ml.lat::double precision as location_lat,
      ml.lng::double precision as location_lng,
      ps.id as primary_service_id,
      ps.title as primary_service_title,
      ps.price_amount as primary_service_price,
      ns.starts_at as next_slot_starts_at,
      ns.id as next_slot_id,
      public.catalog_master_pro_entitled(mp.master_id) as is_pro_entitled,
      public.catalog_pro_boost_score(
        mp.rating_avg,
        mp.reviews_count,
        ns.starts_at is not null,
        mp.is_verified,
        public.catalog_master_pro_entitled(mp.master_id)
      ) as pro_boost_score
    from public.master_profiles mp
    left join public.service_categories sc on sc.id = mp.primary_category_id
    left join public.master_locations ml on ml.master_id = mp.master_id and ml.is_primary = true
    left join lateral (
      select ms.id, ms.title, ms.price_amount
      from public.master_services ms
      where ms.master_id = mp.master_id
        and ms.is_active = true
        and ms.admin_hidden_at is null
      order by ms.sort_order asc, ms.price_amount asc nulls last, ms.title asc
      limit 1
    ) ps on true
    left join lateral (
      select s.id, s.starts_at
      from public.master_availability_slots s
      where s.master_id = mp.master_id
        and s.status = 'available'
        and s.starts_at > now()
      order by s.starts_at asc
      limit 1
    ) ns on true
    where mp.publication_status = 'published'
      and public.catalog_master_account_ok(mp.master_id)
      and (
        v_search_pat is null
        or mp.display_name ilike v_search_pat
        or coalesce(ml.public_address, '') ilike v_search_pat
        or exists (
          select 1
          from public.master_services ms
          join public.service_categories scs on scs.id = ms.category_id
          where ms.master_id = mp.master_id
            and ms.is_active = true
            and ms.admin_hidden_at is null
            and (
              ms.title ilike v_search_pat
              or scs.name ilike v_search_pat
              or scs.code ilike v_search_pat
            )
        )
      )
      and (
        v_cat is null
        or sc.code = v_cat
        or exists (
          select 1
          from public.master_services ms2
          join public.service_categories sc2 on sc2.id = ms2.category_id
          where ms2.master_id = mp.master_id
            and ms2.is_active = true
            and ms2.admin_hidden_at is null
            and sc2.code = v_cat
        )
      )
      and (p_location_id is null or ml.id = p_location_id)
      and (
        v_addr_pat is null
        or p_location_id is not null
        or coalesce(ml.public_address, '') ilike v_addr_pat
        or coalesce(ml.street, '') ilike v_addr_pat
        or coalesce(ml.building, '') ilike v_addr_pat
      )
      and (p_min_rating is null or mp.rating_avg >= p_min_rating)
      and (p_min_reviews is null or p_min_reviews <= 0 or mp.reviews_count >= p_min_reviews)
      and (
        coalesce(p_visit_type, 'any') = 'any'
        or ml.visit_type = p_visit_type::public.visit_type
      )
      and (not coalesce(p_verified_only, false) or mp.is_verified = true)
      and (
        not coalesce(p_promotion_only, false)
        or exists (
          select 1 from public.master_services msp
          where msp.master_id = mp.master_id
            and msp.is_active = true
            and msp.admin_hidden_at is null
            and (
              msp.has_promotion = true
              or (msp.old_price_amount is not null and msp.old_price_amount > msp.price_amount)
            )
        )
        or exists (
          select 1 from public.master_service_promotions pr
          where pr.master_id = mp.master_id
            and pr.status = 'active'
            and pr.starts_at <= now()
            and pr.ends_at >= now()
        )
      )
      and public.catalog_duration_matches(mp.master_id, p_duration_preset)
      and (
        (coalesce(p_date_range, 'any') = 'any' and coalesce(p_time_of_day, 'any') = 'any')
        or public.catalog_slot_matches(mp.master_id, p_date_range, p_time_of_day)
      )
      and (
        p_min_price is null
        or exists (
          select 1 from public.master_services msp
          where msp.master_id = mp.master_id
            and msp.is_active = true
            and msp.admin_hidden_at is null
            and msp.price_amount >= p_min_price
        )
      )
      and (
        p_max_price is null
        or exists (
          select 1 from public.master_services msp
          where msp.master_id = mp.master_id
            and msp.is_active = true
            and msp.admin_hidden_at is null
            and msp.price_amount <= p_max_price
        )
      )
  ),
  counted as (
    select count(*)::int as c from filtered
  ),
  sorted as (
    select *
    from filtered f
    order by
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then
        case when f.next_slot_starts_at is null then 1 else 0 end
      end asc nulls last,
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then
        f.next_slot_starts_at
      end asc nulls last,
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then
        f.pro_boost_score
      end desc nulls last,
      case when coalesce(p_sort_by, 'recommended') = 'rating' then f.rating_avg end desc nulls last,
      case when p_sort_by = 'price_asc' then f.primary_service_price end asc nulls last,
      case when p_sort_by = 'price_desc' then f.primary_service_price end desc nulls last,
      case when p_sort_by = 'reviews' then f.reviews_count end desc nulls last,
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then f.rating_avg end desc nulls last,
      case when coalesce(p_sort_by, 'recommended') in ('recommended', 'soonest') then f.reviews_count end desc nulls last,
      f.display_name asc
    limit v_limit
    offset v_offset
  )
  select
    (select c from counted),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'masterId', s.master_id,
            'displayName', s.display_name,
            'bio', s.bio,
            'photoUrl', s.photo_url,
            'slug', s.slug,
            'rating', coalesce(s.rating_avg, 0),
            'reviewsCount', s.reviews_count,
            'isVerified', s.is_verified,
            'isProEntitled', s.is_pro_entitled,
            'category', case
              when s.category_code is not null then jsonb_build_object(
                'code', s.category_code,
                'name', coalesce(s.category_name, s.category_code)
              )
              else null
            end,
            'location', case
              when s.public_address is not null then jsonb_build_object(
                'publicAddress', s.public_address,
                'city', s.city,
                'lat', s.location_lat,
                'lng', s.location_lng
              )
              when s.city is not null then jsonb_build_object(
                'publicAddress', s.city,
                'city', s.city,
                'lat', s.location_lat,
                'lng', s.location_lng
              )
              when s.location_lat is not null and s.location_lng is not null then jsonb_build_object(
                'publicAddress', 'Точка на карте',
                'city', s.city,
                'lat', s.location_lat,
                'lng', s.location_lng
              )
              else null
            end,
            'minServicePrice', s.primary_service_price,
            'primaryServiceId', s.primary_service_id,
            'primaryServiceName', s.primary_service_title,
            'nextSlotStartsAt', s.next_slot_starts_at,
            'nextSlotId', s.next_slot_id
          )
        )
        from sorted s
      ),
      '[]'::jsonb
    )
  into v_total, v_items;

  return jsonb_build_object(
    'items', coalesce(v_items, '[]'::jsonb),
    'total', coalesce(v_total, 0),
    'page', v_page,
    'limit', v_limit,
    'hasMore', (v_offset + v_limit) < coalesce(v_total, 0)
  );
end;
$$;
