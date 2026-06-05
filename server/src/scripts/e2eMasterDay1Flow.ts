/**
 * Day-1 master flow (API-level smoke): service → batch slots → publish readiness
 * Requires: running API + DATABASE_URL + JWT_SECRET
 *
 * Usage: cd server && npm run e2e:master-day1
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';

const API = process.env.E2E_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;

type Row = { name: string; ok: boolean; detail: string };
const rows: Row[] = [];

function log(ok: boolean, name: string, detail: string) {
  rows.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name} — ${detail}`);
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
  const tag = `e2e_d1_${Date.now()}`;
  const masterId = crypto.randomUUID();
  const today = isoToday();

  try {
    const cat = await pg.query<{ id: string }>(
      `select id from public.service_categories where is_active = true limit 1`,
    );
    const catId = cat.rows[0]?.id;
    if (!catId) {
      console.error('No category');
      process.exit(1);
    }

    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status) values ($1, 'master', $2, 'active')`,
      [masterId, `${tag}_master`],
    );
    await pg.query(
      `insert into public.master_profiles (master_id, display_name, publication_status, is_profile_active)
       values ($1, $2, 'hidden', false)`,
      [masterId, 'Day1 Master'],
    );

    const freePlan = await pg.query<{ id: string }>(
      `select id from public.subscription_plans where code = 'free' and is_active limit 1`,
    );
    if (freePlan.rows[0]?.id) {
      await pg.query(
        `insert into public.master_subscriptions (master_id, plan_id, status, billing_period, current_period_start, current_period_end)
         values ($1, $2, 'active', 'month', now(), now() + interval '400 days')
         on conflict (master_id) do nothing`,
        [masterId, freePlan.rows[0].id],
      );
    }

    const token = bearer(masterId, 'master', jwtSecret);

    // No service, no slots — publish should fail at UI; API profile patch may still work but slots list empty
    const slots0 = await fetchJson('GET', '/api/masters/me/slots', { token });
    const slotList0 = (slots0.json as { slots?: unknown[] } | null)?.slots ?? [];
    log(slots0.status === 200 && slotList0.length === 0, 'Publish prep: no slots before setup', `count=${slotList0.length}`);

    const batchNoSvc = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token,
      body: {
        startDate: today,
        endDate: addDaysIso(today, 6),
        weekdays: [0, 1, 2, 3, 4],
        dayStartTime: '10:00',
        dayEndTime: '12:00',
        slotDurationMinutes: 60,
      },
    });
    log(batchNoSvc.status === 400, 'Publish gate: batch blocked without service', `status=${batchNoSvc.status}`);

    const svc = await fetchJson('POST', '/api/masters/me/services', {
      token,
      body: { categoryId: catId, title: 'Маникюр', durationMinutes: 60, priceAmount: 50 },
    });
    const serviceId = (svc.json as { id?: string } | null)?.id;
    log(svc.status === 201 && Boolean(serviceId), 'Day-1: first service created', `status=${svc.status}`);

    const batchNoAddr = await fetchJson('POST', '/api/masters/me/slots/batch', {
      token,
      body: {
        startDate: today,
        endDate: addDaysIso(today, 29),
        weekdays: [0, 1, 2, 3, 4],
        dayStartTime: '10:00',
        dayEndTime: '18:00',
        slotDurationMinutes: 60,
        serviceId,
      },
    });
    const batchRes = batchNoAddr.json as { created?: number; skipped?: number } | null;
    log(
      batchNoAddr.status === 201 && (batchRes?.created ?? 0) > 0,
      'Day-1: monthly batch creates windows',
      `created=${batchRes?.created} skipped=${batchRes?.skipped ?? 0}`,
    );

    const slotsAfter = await fetchJson('GET', '/api/masters/me/slots', { token });
    const slotCount = ((slotsAfter.json as { slots?: unknown[] } | null)?.slots ?? []).length;
    log(slotCount > 0, 'Day-1: slots visible in API', `count=${slotCount}`);

    await pg.query(
      `insert into public.master_locations (
         master_id, visit_type, city, street, building, public_address, is_primary
       ) values ($1, 'studio', 'Минск', 'ул. Тестовая', '1', 'ул. Тестовая, 1', true)
       on conflict do nothing`,
      [masterId],
    ).catch(async () => {
      await pg.query(
        `insert into public.master_locations (
           master_id, visit_type, city, street, building, public_address, is_primary
         ) values ($1, 'studio', 'Минск', 'ул. Тестовая', '1', 'ул. Тестовая, 1', true)`,
        [masterId],
      );
    });

    await pg.query(
      `update public.master_profiles
         set publication_status = 'published', is_profile_active = true
       where master_id = $1`,
      [masterId],
    );

    const publicSlots = await fetchJson('GET', `/api/slots?masterId=${masterId}&limit=50`);
    const pubCount = ((publicSlots.json as { slots?: unknown[] } | null)?.slots ?? []).length;
    log(
      publicSlots.status === 200 && pubCount > 0,
      'Day-1: public profile shows bookable times',
      `public_slots=${pubCount}`,
    );

    console.log('\n--- Summary ---');
    const failed = rows.filter((r) => !r.ok).length;
    console.log(`${rows.length - failed} pass, ${failed} fail`);
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    await pg.query(`delete from public.profiles where id = $1`, [masterId]).catch(() => {});
    await pg.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
