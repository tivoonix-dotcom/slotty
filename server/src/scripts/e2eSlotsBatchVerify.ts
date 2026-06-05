/**
 * Integration verify: POST /api/masters/me/slots/batch
 * Requires: running API + DATABASE_URL + JWT_SECRET
 *
 * Usage: cd server && npm run e2e:slots-batch
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';

const API = process.env.E2E_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;

type Row = { id: string; name: string; ok: boolean; detail: string };
const rows: Row[] = [];

function log(ok: boolean, id: string, name: string, detail: string) {
  rows.push({ id, name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} [${id}] ${name} — ${detail}`);
}

async function fetchJson(
  method: string,
  path: string,
  opts?: { token?: string; body?: unknown },
): Promise<{ status: number; json: Record<string, unknown> | null }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { status: res.status, json };
}

function errCode(json: Record<string, unknown> | null): string | undefined {
  return (json?.error as { code?: string } | undefined)?.code;
}

function bearer(id: string, role: string, secret: string): string {
  return jwt.sign({ sub: id, role }, secret, { expiresIn: '2h' });
}

function isoToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type BatchResult = {
  created: number;
  skipped: number;
  skippedReasons: Array<{ date: string; time: string; reason: string }>;
};

function batchBody(startDate: string, periodDays: number, extra?: Record<string, unknown>) {
  return {
    startDate,
    endDate: addDaysIso(startDate, periodDays - 1),
    weekdays: [0, 1, 2, 3, 4],
    dayStartTime: '10:00',
    dayEndTime: '13:00',
    slotDurationMinutes: 60,
    ...extra,
  };
}

async function queryCategoryId(pg: import('pg').Client): Promise<string | null> {
  const r = await pg.query<{ id: string }>(
    `select id from public.service_categories where is_active = true order by sort_order limit 1`,
  );
  return r.rows[0]?.id ?? null;
}

async function queryPlanId(pg: import('pg').Client, code: string): Promise<string | null> {
  const r = await pg.query<{ id: string }>(
    `select id from public.subscription_plans where code = $1 and is_active = true limit 1`,
    [code],
  );
  return r.rows[0]?.id ?? null;
}

async function setupMaster(
  pg: import('pg').Client,
  tag: string,
  planCode: 'free' | 'pro' = 'free',
): Promise<{ masterId: string; token: string; serviceId: string }> {
  const jwtSecret = process.env.JWT_SECRET!.trim();
  const masterId = crypto.randomUUID();
  const catId = await queryCategoryId(pg);
  if (!catId) throw new Error('No category');

  await pg.query(
    `insert into public.profiles (id, role, full_name, account_status) values ($1, 'master', $2, 'active')`,
    [masterId, `${tag}_${masterId.slice(0, 8)}`],
  );
  await pg.query(
    `insert into public.master_profiles (master_id, display_name, publication_status, is_profile_active)
     values ($1, $2, 'published', true)`,
    [masterId, `${tag}_master`],
  );

  const planId = await queryPlanId(pg, planCode);
  if (planId) {
    await pg.query(
      `insert into public.master_subscriptions (master_id, plan_id, status, billing_period, current_period_start, current_period_end)
       values ($1, $2, 'active', 'month', now(), now() + interval '400 days')
       on conflict (master_id) do update set plan_id = $2`,
      [masterId, planId],
    );
  }

  const token = bearer(masterId, 'master', jwtSecret);
  const svc = await fetchJson('POST', '/api/masters/me/services', {
    token,
    body: {
      categoryId: catId,
      title: 'Batch test service',
      durationMinutes: 60,
      priceAmount: 50,
    },
  });
  const serviceId = (svc.json as { id?: string } | null)?.id;
  if (svc.status !== 201 || !serviceId) {
    throw new Error(`Service create failed: ${svc.status} ${JSON.stringify(svc.json)}`);
  }

  return { masterId, token, serviceId };
}

async function countSlots(pg: import('pg').Client, masterId: string): Promise<number> {
  const r = await pg.query<{ c: number }>(
    `select count(*)::int as c from public.master_availability_slots where master_id = $1 and status = 'available'`,
    [masterId],
  );
  return r.rows[0]?.c ?? 0;
}

async function main() {
  loadE2eEnv();
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 16) {
    console.error('JWT_SECRET missing');
    process.exit(1);
  }

  const health = await fetch(`${API}/api/health/ready`);
  if (!health.ok) {
    console.error(`API not ready: ${API}`);
    process.exit(1);
  }

  const pg = await connectE2ePg();
  const tag = `e2e_batch_${Date.now()}`;
  const cleanupIds: string[] = [];

  try {
    const { masterId, token, serviceId } = await setupMaster(pg, tag, 'free');
    cleanupIds.push(masterId);
    const today = isoToday();

    // G — unauthorized
    const unauth = await fetchJson('POST', '/api/masters/me/slots/batch', {
      body: batchBody(today, 7),
    });
    log(unauth.status === 401, 'G', 'Unauthorized batch → 401', `status=${unauth.status}`);

    // G — no active service
    const noSvcMaster = crypto.randomUUID();
    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status) values ($1, 'master', $2, 'active')`,
      [noSvcMaster, `${tag}_nosvc`],
    );
    await pg.query(
      `insert into public.master_profiles (master_id, display_name, publication_status, is_profile_active)
       values ($1, $2, 'published', true)`,
      [noSvcMaster, `${tag}_nosvc`],
    );
    cleanupIds.push(noSvcMaster);
    const noSvcTok = bearer(noSvcMaster, 'master', jwtSecret);
    const noSvc = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token: noSvcTok,
      body: batchBody(today, 7),
    });
    log(
      noSvc.status === 400 && errCode(noSvc.json) === 'NO_ACTIVE_SERVICE',
      'G',
      'No active service → NO_ACTIVE_SERVICE',
      `status=${noSvc.status} code=${errCode(noSvc.json)}`,
    );

    // G — empty weekdays (zod)
    const noDays = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token,
      body: { ...batchBody(today, 7), weekdays: [] },
    });
    log(noDays.status === 400, 'G', 'Empty weekdays → 400 validation', `status=${noDays.status}`);

    const slotsBeforeInvalid = await countSlots(pg, masterId);

    // G — invalid duration < 15
    const badDurLow = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token,
      body: { ...batchBody(today, 7), slotDurationMinutes: 10 },
    });
    const afterBadDurLow = await countSlots(pg, masterId);
    log(
      badDurLow.status === 400 && afterBadDurLow === slotsBeforeInvalid,
      'G',
      'Invalid duration < 15 → 400',
      `status=${badDurLow.status} db=${afterBadDurLow}`,
    );

    // G — invalid duration > max
    const badDurHigh = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token,
      body: { ...batchBody(today, 7), slotDurationMinutes: 500 },
    });
    const afterBadDurHigh = await countSlots(pg, masterId);
    log(
      badDurHigh.status === 400 && afterBadDurHigh === slotsBeforeInvalid,
      'G',
      'Invalid duration > max → 400',
      `status=${badDurHigh.status} db=${afterBadDurHigh}`,
    );

    // G — invalid time format (zod regex)
    const badTimeFmt = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token,
      body: { ...batchBody(today, 7), dayStartTime: 'ab:cd' },
    });
    const afterBadFmt = await countSlots(pg, masterId);
    log(
      badTimeFmt.status === 400 && afterBadFmt === slotsBeforeInvalid,
      'G',
      'Invalid time format → 400',
      `status=${badTimeFmt.status} db=${afterBadFmt}`,
    );

    // G — invalid time range (start >= end)
    const badTimeRange = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token,
      body: { ...batchBody(today, 7), dayStartTime: '18:00', dayEndTime: '10:00' },
    });
    const rBadRange = badTimeRange.json as BatchResult | null;
    const afterBadRange = await countSlots(pg, masterId);
    log(
      badTimeRange.status === 201 &&
        (rBadRange?.created ?? 0) === 0 &&
        afterBadRange === slotsBeforeInvalid,
      'G',
      'Invalid time range → no slots created',
      `status=${badTimeRange.status} created=${rBadRange?.created} db=${afterBadRange}`,
    );

    // A — batch creates slots (7 days)
    const batch7 = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token,
      body: batchBody(today, 7, { serviceId }),
    });
    const r7 = batch7.json as BatchResult | null;
    const db7 = await countSlots(pg, masterId);
    log(
      batch7.status === 201 && (r7?.created ?? 0) > 0 && db7 >= (r7?.created ?? 0),
      'A',
      'Batch 7 days creates slots',
      `created=${r7?.created} db=${db7}`,
    );

    const inRange = await pg.query<{ c: number }>(
      `select count(*)::int as c from public.master_availability_slots
        where master_id = $1 and status = 'available'
          and starts_at::date >= $2::date and starts_at::date <= $3::date`,
      [masterId, today, addDaysIso(today, 6)],
    );
    log((inRange.rows[0]?.c ?? 0) > 0, 'A', 'Slots in date range', `count=${inRange.rows[0]?.c}`);

    const withService = await pg.query<{ c: number }>(
      `select count(*)::int as c from public.master_availability_slots
        where master_id = $1 and service_id = $2`,
      [masterId, serviceId],
    );
    log((withService.rows[0]?.c ?? 0) > 0, 'A', 'serviceId set on slots', `count=${withService.rows[0]?.c}`);

    // B — skips overlaps
    const beforeOverlap = await countSlots(pg, masterId);
    const batchOverlap = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token,
      body: batchBody(today, 7, { serviceId }),
    });
    const rOverlap = batchOverlap.json as BatchResult | null;
    const afterOverlap = await countSlots(pg, masterId);
    const hasOverlapReason = (rOverlap?.skippedReasons ?? []).some((s) => s.reason === 'overlap');
    log(
      batchOverlap.status === 201 &&
        (rOverlap?.created ?? 0) === 0 &&
        (rOverlap?.skipped ?? 0) > 0 &&
        hasOverlapReason &&
        afterOverlap === beforeOverlap,
      'B',
      'Repeated batch skips overlaps',
      `created=${rOverlap?.created} skipped=${rOverlap?.skipped} overlap=${hasOverlapReason}`,
    );

    // F — idempotency (same as B essentially)
    log(hasOverlapReason && (rOverlap?.skipped ?? 0) > 0, 'F', 'Second identical batch no duplicates', `skipped=${rOverlap?.skipped}`);

    // C — booked slot untouched
    const existing = await pg.query<{ id: string; starts_at: Date; ends_at: Date; status: string }>(
      `select id, starts_at, ends_at, status::text from public.master_availability_slots
        where master_id = $1 and status = 'available' and starts_at > now() + interval '1 day'
        order by starts_at limit 1`,
      [masterId],
    );
    const bookedRow = existing.rows[0];
    if (bookedRow) {
      await pg.query(
        `update public.master_availability_slots set status = 'booked' where id = $1`,
        [bookedRow.id],
      );
      const batchAfterBooked = await fetchJson('POST', '/api/masters/me/slots/batch', {
        token,
        body: batchBody(today, 7),
      });
      const afterBooked = await pg.query<{ status: string; starts_at: Date }>(
        `select status::text, starts_at from public.master_availability_slots where id = $1`,
        [bookedRow.id],
      );
      log(
        afterBooked.rows[0]?.status === 'booked' &&
          afterBooked.rows[0]?.starts_at.getTime() === bookedRow.starts_at.getTime(),
        'C',
        'Booked slot not modified by batch',
        `status=${afterBooked.rows[0]?.status}`,
      );
      log(batchAfterBooked.status === 201, 'C', 'Batch completes with booked slot present', `status=${batchAfterBooked.status}`);
    } else {
      log(false, 'C', 'Booked slot test skipped', 'no available slot');
    }

    // D — plan horizon (free = 14 days)
    const { masterId: freeId, token: freeTok } = await setupMaster(pg, `${tag}_horizon`, 'free');
    cleanupIds.push(freeId);
    const batch30 = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token: freeTok,
      body: batchBody(today, 30, { dayEndTime: '20:00' }),
    });
    const r30 = batch30.json as BatchResult | null;
    const planSkips = (r30?.skippedReasons ?? []).filter((s) => s.reason === 'plan_limit');
    log(
      batch30.status === 201 && (r30?.created ?? 0) > 0 && planSkips.length > 0,
      'D',
      'Free plan skips beyond horizon',
      `created=${r30?.created} plan_limit_skips=${planSkips.length}`,
    );

    // E — past dates not created
    const pastStart = addDaysIso(today, -3);
    const batchPast = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token,
      body: batchBody(pastStart, 5),
    });
    const rPast = batchPast.json as BatchResult | null;
    const pastInDb = await pg.query<{ c: number }>(
      `select count(*)::int as c from public.master_availability_slots
        where master_id = $1 and starts_at < now()`,
      [masterId],
    );
    log(
      batchPast.status === 201 && (pastInDb.rows[0]?.c ?? 0) === 0,
      'E',
      'No slots created in the past',
      `created=${rPast?.created} past_in_db=${pastInDb.rows[0]?.c}`,
    );

    console.log('\n--- Summary ---');
    const failed = rows.filter((r) => !r.ok);
    console.log(`${rows.length - failed.length} pass, ${failed.length} fail`);
    if (failed.length) {
      for (const f of failed) console.log(`  FAIL [${f.id}] ${f.name}: ${f.detail}`);
    }
    process.exit(failed.length > 0 ? 1 : 0);
  } finally {
    for (const id of cleanupIds) {
      await pg.query(`delete from public.profiles where id = $1`, [id]).catch(() => {});
    }
    await pg.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
