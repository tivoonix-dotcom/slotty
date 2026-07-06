-- Разделение in-app уведомлений по аудитории (клиент / мастер).

create type public.notification_audience as enum ('master', 'client');

alter table public.notifications
  add column if not exists audience public.notification_audience;

comment on column public.notifications.audience is
  'Получатель уведомления в UI: клиентский или мастерский кабинет.';

-- Backfill существующих строк (улучшенные эвристики).
update public.notifications n
set audience = case
  when n.type = 'appointment_new'::public.notification_type then 'master'::public.notification_audience
  when n.type = 'billing'::public.notification_type then 'master'::public.notification_audience
  when n.type = 'review_request'::public.notification_type then 'client'::public.notification_audience
  when n.type = 'appointment_confirmed'::public.notification_type then
    case
      when trim(n.title) in ('Запись завершена', 'Клиент подтвердил выполнение')
        then 'master'::public.notification_audience
      when trim(n.body) like 'Клиент:%' then 'master'::public.notification_audience
      else 'client'::public.notification_audience
    end
  when n.type = 'appointment_pending'::public.notification_type then
    case
      when trim(n.title) in ('Заявка ждёт решения', 'Заявка скоро истечёт')
        then 'master'::public.notification_audience
      else 'client'::public.notification_audience
    end
  when n.type = 'appointment_cancelled'::public.notification_type then
    case
      when trim(n.title) = 'Клиент отменил запись' then 'master'::public.notification_audience
      when trim(n.title) = 'Заявка истекла'
        and (
          n.body like '%Вы не успели подтвердить%'
          or n.body like 'Заявка истекла:%'
        )
        then 'master'::public.notification_audience
      else 'client'::public.notification_audience
    end
  when n.type = 'appointment_reminder'::public.notification_type then
    case
      when n.body like '%Клиент должен быть у вас%' then 'master'::public.notification_audience
      when n.title like '%у вас%' then 'master'::public.notification_audience
      else 'client'::public.notification_audience
    end
  when n.type = 'system'::public.notification_type then
    case
      when trim(n.title) = 'Новый отзыв' then 'master'::public.notification_audience
      when trim(n.title) = 'Вы в топе мастеров' then 'master'::public.notification_audience
      when trim(n.title) like 'Категория профиля%' then 'master'::public.notification_audience
      when trim(n.title) like 'Заявка на смену категории%' then 'master'::public.notification_audience
      when trim(n.title) ~* 'тариф|Pro|оплат' then 'master'::public.notification_audience
      when trim(n.title) like 'Ответ поддержки:%' then 'master'::public.notification_audience
      when trim(n.title) like 'Обращение %' then 'master'::public.notification_audience
      when trim(n.title) = 'Клиент сообщил о проблеме' then 'master'::public.notification_audience
      when trim(n.title) = 'Запрос на удаление аккаунта' then 'master'::public.notification_audience
      when trim(n.title) = 'Архив данных готов' then 'master'::public.notification_audience
      else 'client'::public.notification_audience
    end
  else 'client'::public.notification_audience
end
where n.audience is null;

alter table public.notifications
  alter column audience set default 'client'::public.notification_audience;

alter table public.notifications
  alter column audience set not null;

create index if not exists idx_notifications_user_audience_created
  on public.notifications (user_id, audience, created_at desc);

create index if not exists idx_notifications_user_audience_unread
  on public.notifications (user_id, audience)
  where read_at is null;

create index if not exists idx_favorite_masters_client_created
  on public.favorite_masters (client_id, created_at desc);

-- Legacy RPC: явно проставлять audience при insert.
create or replace function public.create_appointment_atomic (
  p_slot_id uuid,
  p_service_id uuid,
  p_client_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_slot public.master_availability_slots%rowtype;
  v_service public.master_services%rowtype;
  v_master uuid;
  v_starts timestamptz;
  v_ends timestamptz;
  v_appt_id uuid;
  v_voucher_num text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select
    * into strict v_slot
  from
    public.master_availability_slots
  where
    id = p_slot_id
  for update;

  if v_slot.status is distinct from 'available'::public.slot_status then
    raise exception 'slot_unavailable';
  end if;

  if v_slot.starts_at <= now() then
    raise exception 'slot_in_past';
  end if;

  select
    * into strict v_service
  from
    public.master_services
  where
    id = p_service_id;

  if v_service.is_active is not true then
    raise exception 'service_inactive';
  end if;

  if v_service.master_id <> v_slot.master_id then
    raise exception 'service_master_mismatch';
  end if;

  if v_slot.service_id is not null and v_slot.service_id <> p_service_id then
    raise exception 'service_slot_mismatch';
  end if;

  if v_slot.starts_at + (v_service.duration_minutes * interval '1 minute') > v_slot.ends_at then
    raise exception 'service_does_not_fit_slot';
  end if;

  if exists (
    select
      1
    from
      public.appointments a
    where
      a.slot_id = p_slot_id
      and a.status in (
        'pending'::public.appointment_status,
        'confirmed'::public.appointment_status
      )
  ) then
    raise exception 'slot_already_booked';
  end if;

  v_master := v_slot.master_id;
  v_starts := v_slot.starts_at;
  v_ends := v_slot.starts_at + (v_service.duration_minutes * interval '1 minute');

  if exists (
    select
      1
    from
      public.appointments a
    where
      a.master_id = v_master
      and a.status in (
        'pending'::public.appointment_status,
        'confirmed'::public.appointment_status
      )
      and tstzrange (a.starts_at, a.ends_at, '[)') && tstzrange (v_starts, v_ends, '[)')
  ) then
    raise exception 'master_has_overlapping_appointment';
  end if;

  insert into public.appointments (
    client_id,
    master_id,
    service_id,
    slot_id,
    starts_at,
    ends_at,
    status,
    price_snapshot,
    price_type_snapshot,
    service_title_snapshot,
    service_duration_snapshot,
    client_note
  )
  values (
    v_uid,
    v_master,
    p_service_id,
    p_slot_id,
    v_starts,
    v_ends,
    'pending'::public.appointment_status,
    v_service.price_amount,
    v_service.price_type,
    v_service.title,
    v_service.duration_minutes,
    p_client_note
  )
returning
  id into v_appt_id;

  update public.master_availability_slots s
  set
    status = 'booked'::public.slot_status,
    updated_at = now()
  where
    s.id = p_slot_id;

  insert into public.notifications (
    user_id, type, title, body, audience, related_entity_type, related_entity_id
  )
  values (
    v_master,
    'appointment_new'::public.notification_type,
    'Новая запись',
    'У вас новая запись от клиента',
    'master'::public.notification_audience,
    'appointment',
    v_appt_id
  );

  insert into public.notifications (
    user_id, type, title, body, audience, related_entity_type, related_entity_id
  )
  values (
    v_uid,
    'appointment_confirmed'::public.notification_type,
    'Запись создана',
    'Вы записались к мастеру',
    'client'::public.notification_audience,
    'appointment',
    v_appt_id
  );

  v_voucher_num := 'SLO-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.booking_vouchers (appointment_id, voucher_number)
  values (v_appt_id, v_voucher_num);

  return jsonb_build_object(
    'appointment_id',
    v_appt_id,
    'master_id',
    v_master,
    'service_title',
    v_service.title,
    'starts_at',
    v_starts,
    'ends_at',
    v_ends,
    'price',
    v_service.price_amount,
    'voucher_number',
    v_voucher_num
  );
exception
  when no_data_found then
    raise exception 'slot_or_service_not_found';
end;
$$;
