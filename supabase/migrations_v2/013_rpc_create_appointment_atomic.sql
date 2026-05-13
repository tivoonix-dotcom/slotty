-- SLOTTY DB v2 — atomic booking RPC (SECURITY DEFINER)
-- Run after RLS: bypasses RLS for inserts/updates performed inside the function body.

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

  insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
  values (
    v_master,
    'appointment_new'::public.notification_type,
    'Новая запись',
    'У вас новая запись от клиента',
    'appointment',
    v_appt_id
  );

  insert into public.notifications (user_id, type, title, body, related_entity_type, related_entity_id)
  values (
    v_uid,
    'appointment_confirmed'::public.notification_type,
    'Запись создана',
    'Вы записались к мастеру',
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

comment on function public.create_appointment_atomic (uuid, uuid, text) is 'Atomically books a slot, creates appointment + voucher + notifications in one transaction.';

revoke all on function public.create_appointment_atomic (uuid, uuid, text) from public;

grant execute on function public.create_appointment_atomic (uuid, uuid, text) to authenticated;
