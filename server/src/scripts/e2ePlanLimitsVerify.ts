/**
 * Точечная проверка Free/Pro лимитов (после P0/P1 fix).
 * cd server && npx tsx src/scripts/e2ePlanLimitsVerify.ts
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

function errCode(json: Record<string, unknown> | null): string | undefined {
  return (json?.error as { code?: string } | undefined)?.code;
}

function bearer(id: string, role: string, secret: string): string {
  return jwt.sign({ sub: id, role }, secret, { expiresIn: '2h' });
}

async function queryPlanId(pg: import('pg').Client, code: string): Promise<string | null> {
  const r = await pg.query<{ id: string }>(
    `select id from public.subscription_plans where code = $1 and is_active = true limit 1`,
    [code],
  );
  return r.rows[0]?.id ?? null;
}

async function queryCategoryId(pg: import('pg').Client): Promise<string | null> {
  const r = await pg.query<{ id: string }>(
    `select id from public.service_categories where is_active = true order by sort_order limit 1`,
  );
  return r.rows[0]?.id ?? null;
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
  const tag = `e2e_pl_${Date.now()}`;
  const cleanupIds: string[] = [];

  try {
    const catId = await queryCategoryId(pg);
    if (!catId) {
      console.error('No service category');
      process.exit(1);
    }

    // --- Free master (never mock-switched) ---
    const freeId = crypto.randomUUID();
    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status) values ($1, 'master', $2, 'active')`,
      [freeId, `${tag}_free`],
    );
    await pg.query(
      `insert into public.master_profiles (master_id, display_name, publication_status, is_profile_active)
       values ($1, $2, 'published', true)`,
      [freeId, `${tag}_free`],
    );
    cleanupIds.push(freeId);
    const freePlan = await queryPlanId(pg, 'free');
    if (freePlan) {
      await pg.query(
        `insert into public.master_subscriptions (master_id, plan_id, status, billing_period, current_period_start, current_period_end)
         values ($1, $2, 'active', 'month', now(), now() + interval '400 days')
         on conflict (master_id) do update set plan_id = $2`,
        [freeId, freePlan],
      );
    }
    const freeTok = bearer(freeId, 'master', jwtSecret);

    const serviceIds: string[] = [];
    for (let i = 0; i < 3; i++) {
      const r = await fetchJson('POST', '/api/masters/me/services', {
        token: freeTok,
        body: {
          categoryId: catId,
          title: `Svc ${i + 1}`,
          durationMinutes: 60,
          priceAmount: 10,
        },
      });
      const id = (r.json as { id?: string } | null)?.id;
      if (r.status === 201 && id) serviceIds.push(id);
    }
    log(serviceIds.length === 3, 'Free create 3 services', `created=${serviceIds.length}`);

    const svc4 = await fetchJson('POST', '/api/masters/me/services', {
      token: freeTok,
      body: { categoryId: catId, title: 'Svc 4', durationMinutes: 60, priceAmount: 10 },
    });
    log(
      svc4.status === 403 && errCode(svc4.json) === 'LIMIT_SERVICES_REACHED',
      'Free create 4th service blocked',
      `status=${svc4.status} code=${errCode(svc4.json)}`,
    );

    if (serviceIds[2]) {
      await fetchJson('PATCH', `/api/masters/me/services/${serviceIds[2]}`, {
        token: freeTok,
        body: { isActive: false },
      });
      const reactivate = await fetchJson('PATCH', `/api/masters/me/services/${serviceIds[2]}`, {
        token: freeTok,
        body: { isActive: true },
      });
      log(reactivate.status === 200, 'Free reactivate within limit', `status=${reactivate.status}`);
    }

    await pg.query(
      `insert into public.master_services (
         master_id, category_id, title, description, duration_minutes, price_amount, price_type, is_active, sort_order
       ) values ($1, $2, 'Svc 4 inactive', '', 60, 10, 'fixed', false, 99)`,
      [freeId, catId],
    );
    const svc4Row = await pg.query<{ id: string }>(
      `select id from public.master_services where master_id = $1 and title = 'Svc 4 inactive' limit 1`,
      [freeId],
    );
    const svc4Id = svc4Row.rows[0]?.id;
    const re4 = svc4Id
      ? await fetchJson('PATCH', `/api/masters/me/services/${svc4Id}`, {
          token: freeTok,
          body: { isActive: true },
        })
      : { status: 0, json: null };
    log(
      re4.status === 403 && errCode(re4.json) === 'LIMIT_SERVICES_REACHED',
      'Free reactivate 4th active blocked',
      `status=${re4.status} code=${errCode(re4.json)}`,
    );

    for (let i = 0; i < 3; i++) {
      await pg.query(
        `insert into public.master_portfolio_items (master_id, image_url, sort_order) values ($1, $2, $3)`,
        [freeId, `https://example.com/f${i}.jpg`, i],
      );
    }
    const p4 = await fetchJson('POST', '/api/masters/me/portfolio', {
      token: freeTok,
      body: { imageUrl: 'https://example.com/f4.jpg', sortOrder: 4 },
    });
    log(
      p4.status === 403 && errCode(p4.json) === 'PLAN_LIMIT_REACHED',
      'Free 4th portfolio blocked',
      `status=${p4.status} code=${errCode(p4.json)}`,
    );

    const bundlePatch = await fetchJson('PATCH', '/api/masters/me/bundles/00000000-0000-4000-8000-000000000001', {
      token: freeTok,
      body: { title: 'x' },
    });
    log(
      bundlePatch.status === 403 && errCode(bundlePatch.json) === 'PRO_REQUIRED',
      'Free bundle PATCH blocked',
      `status=${bundlePatch.status} code=${errCode(bundlePatch.json)}`,
    );

    // --- Pending payment does not grant Pro ---
    const pendingId = crypto.randomUUID();
    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status) values ($1, 'master', $2, 'active')`,
      [pendingId, `${tag}_pending`],
    );
    await pg.query(
      `insert into public.master_profiles (master_id, display_name, publication_status, is_profile_active)
       values ($1, $2, 'published', true)`,
      [pendingId, `${tag}_pending`],
    );
    cleanupIds.push(pendingId);
    if (freePlan) {
      await pg.query(
        `insert into public.master_subscriptions (master_id, plan_id, status, billing_period, current_period_start, current_period_end)
         values ($1, $2, 'active', 'month', now(), now() + interval '400 days')
         on conflict (master_id) do nothing`,
        [pendingId, freePlan],
      );
    }
    await pg.query(
      `insert into public.pro_manual_payment_requests (
         master_id, profile_id, plan_code, payer_full_name, tariff_amount, declared_paid_amount,
         currency, billing_period, paid_at, payment_comment, status, fee_covered_by
       ) values ($1, $1, 'pro', 'Test User', 30, 30, 'BYN', 'month', current_date, 'test pending', 'pending', 'slotty')`,
      [pendingId],
    );
    const pendingTok = bearer(pendingId, 'master', jwtSecret);
    const pendingPro = await fetchJson('GET', '/api/masters/me/overview/summary', { token: pendingTok });
    log(
      pendingPro.status === 403 && errCode(pendingPro.json) === 'PRO_REQUIRED',
      'Pending payment no Pro access',
      `status=${pendingPro.status} code=${errCode(pendingPro.json)}`,
    );

    // --- RLS: no write policy ---
    const rls = await pg.query<{ polname: string }>(
      `select policyname as polname from pg_policies
        where schemaname = 'public' and tablename = 'master_subscriptions'
          and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')`,
    );
    log(rls.rowCount === 0, 'RLS no master_subscriptions write', `count=${rls.rowCount}`);

    // --- Plan limits from DB seed ---
    const plans = await pg.query<{ code: string; max_schedule_days_ahead: number }>(
      `select code, max_schedule_days_ahead from public.subscription_plans where code in ('free', 'pro')`,
    );
    const freeDays = plans.rows.find((r) => r.code === 'free')?.max_schedule_days_ahead;
    const proDays = plans.rows.find((r) => r.code === 'pro')?.max_schedule_days_ahead;
    log(freeDays === 14 && proDays === 90, 'DB plan horizons 14/90', `free=${freeDays} pro=${proDays}`);

    const mig047 = await pg.query<{ filename: string }>(
      `select filename from public.schema_migrations_v2 where filename = '047_billing_rls_hardening.sql'`,
    );
    log(mig047.rows.length > 0, 'Migration 047 applied', mig047.rows[0]?.filename ?? 'not found');

    console.log('\n--- Summary ---');
    const failed = rows.filter((r) => !r.ok).length;
    console.log(`${rows.length - failed} pass, ${failed} fail`);
    process.exit(failed > 0 ? 1 : 0);
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
