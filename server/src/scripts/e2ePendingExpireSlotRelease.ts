/**
 * E2E: pending expire → slot available → second booking allowed.
 * Requires: DATABASE_URL, migration 072 applied.
 *
 * Usage: tsx src/scripts/e2ePendingExpireSlotRelease.ts
 */
import { connectE2ePg } from './e2eDb.js';
import { expireDuePendingAppointments } from '../modules/appointments/pendingExpiry.service.js';

async function main() {
  const pg = await connectE2ePg();

  const slot = await pg.query<{ id: string; master_id: string; starts_at: Date }>(
    `select s.id, s.master_id, s.starts_at
       from public.master_availability_slots s
      where s.status = 'available'::public.slot_status
        and s.starts_at > now() + interval '2 days'
      limit 1`,
  );
  const row = slot.rows[0];
  if (!row) {
    console.error('No available future slot');
    process.exit(1);
  }

  const svc = await pg.query<{ id: string }>(
    `select id from public.master_services where master_id = $1 and is_active limit 1`,
    [row.master_id],
  );
  const serviceId = svc.rows[0]?.id;
  if (!serviceId) {
    console.error('No active service');
    process.exit(1);
  }

  const clients = await pg.query<{ id: string }>(
    `select id from public.profiles where role = 'client' limit 2`,
  );
  const client1 = clients.rows[0]?.id;
  const client2 = clients.rows[1]?.id ?? client1;
  if (!client1) {
    console.error('No client profile');
    process.exit(1);
  }

  await pg.query(
    `update public.master_availability_slots set status = 'booked' where id = $1`,
    [row.id],
  );

  const appt = await pg.query<{ id: string }>(
    `insert into public.appointments (
       client_id, master_id, service_id, slot_id, starts_at, ends_at, status,
       price_snapshot, price_type_snapshot, service_title_snapshot, service_duration_snapshot,
       pending_expires_at
     )
     select $1, $2, $3, $4, s.starts_at,
            s.starts_at + (ms.duration_minutes * interval '1 minute'),
            'pending'::public.appointment_status,
            ms.price_amount, ms.price_type, ms.title, ms.duration_minutes,
            now() - interval '5 minutes'
       from public.master_availability_slots s
       join public.master_services ms on ms.id = $3
      where s.id = $4
     returning id`,
    [client1, row.master_id, serviceId, row.id],
  );
  const apptId = appt.rows[0]?.id;
  if (!apptId) {
    console.error('Failed to create pending appointment');
    process.exit(1);
  }

  const report = await expireDuePendingAppointments(10);
  assertStatus(pg, apptId, 'expired');

  const slotStatus = await pg.query<{ status: string }>(
    `select status::text from public.master_availability_slots where id = $1`,
    [row.id],
  );
  if (slotStatus.rows[0]?.status !== 'available') {
    console.error('FAIL: slot not released after expire', slotStatus.rows[0]?.status);
    await cleanup(pg, apptId, row.id);
    process.exit(1);
  }

  try {
    await pg.query(
      `update public.master_availability_slots set status = 'booked' where id = $1`,
      [row.id],
    );
    const appt2 = await pg.query<{ id: string }>(
      `insert into public.appointments (
         client_id, master_id, service_id, slot_id, starts_at, ends_at, status,
         price_snapshot, price_type_snapshot, service_title_snapshot, service_duration_snapshot,
         pending_expires_at
       )
       select $1, $2, $3, $4, s.starts_at,
              s.starts_at + (ms.duration_minutes * interval '1 minute'),
              'pending'::public.appointment_status,
              ms.price_amount, ms.price_type, ms.title, ms.duration_minutes,
              now() + interval '3 hours'
         from public.master_availability_slots s
         join public.master_services ms on ms.id = $3
        where s.id = $4
       returning id`,
      [client2, row.master_id, serviceId, row.id],
    );
    if (!appt2.rows[0]?.id) throw new Error('second booking failed');
    console.log('PASS: slot rebooked after pending expire');
    await pg.query(`delete from public.appointments where id = $1`, [appt2.rows[0].id]);
  } catch (e) {
    console.error('FAIL: could not rebook after expire', e);
    await cleanup(pg, apptId, row.id);
    process.exit(1);
  }

  const repeat = await expireDuePendingAppointments(10);
  if (repeat.expired > 0) {
    console.error('FAIL: repeat expire not idempotent');
    process.exit(1);
  }

  console.log('PASS: pending expire + slot release', { expired: report.expired });
  await cleanup(pg, apptId, row.id);
  await pg.end();
}

async function assertStatus(pg: Awaited<ReturnType<typeof connectE2ePg>>, id: string, status: string) {
  const r = await pg.query<{ status: string }>(
    `select status::text from public.appointments where id = $1`,
    [id],
  );
  if (r.rows[0]?.status !== status) {
    console.error(`FAIL: expected status ${status}, got ${r.rows[0]?.status}`);
    process.exit(1);
  }
}

async function cleanup(
  pg: Awaited<ReturnType<typeof connectE2ePg>>,
  apptId: string,
  slotId: string,
) {
  await pg.query(`delete from public.appointments where id = $1`, [apptId]);
  await pg.query(
    `update public.master_availability_slots set status = 'available' where id = $1`,
    [slotId],
  );
}

void main();
