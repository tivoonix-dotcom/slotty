/**
 * Staging verification for Settings / Support / Data Export / Billing.
 * npm run staging:settings-verify --prefix server
 */
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
import { env } from '../config/env.js';

const API = (process.env.PUBLIC_API_URL ?? process.env.E2E_API_URL ?? '').replace(/\/$/, '');
const FRONTEND = (process.env.CLIENT_URL ?? 'https://slotty.of.by').replace(/\/$/, '');

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function add(name: string, ok: boolean, detail: string): void {
  checks.push({ name, ok, detail });
}

async function tableExists(table: string): Promise<boolean> {
  const r = await query<{ reg: string | null }>(
    `select to_regclass($1)::text as reg`,
    [`public.${table}`],
  );
  return Boolean(r.rows[0]?.reg);
}

async function verifyMigrationsAndTables(): Promise<void> {
  const mig = await query<{ filename: string }>(
    `select filename from public.schema_migrations_v2
      where filename in (
        '060_master_subscription_saas.sql',
        '061_subscription_billing_jobs.sql',
        '062_master_notification_preferences.sql',
        '063_support_tickets.sql',
        '064_system_status.sql',
        '065_data_export_jobs.sql'
      )
      order by filename`,
  );
  const applied = mig.rows.map((r) => r.filename);
  add(
    'migrations 060-065',
    applied.length === 6,
    applied.length === 6 ? applied.join(', ') : `missing: expected 6, got ${applied.length}: ${applied.join(', ')}`,
  );

  const tables = [
    'data_export_jobs',
    'data_export_audit_logs',
    'support_tickets',
    'support_ticket_events',
    'master_notification_preferences',
    'subscription_billing_jobs',
    'system_status_components',
  ];
  for (const t of tables) {
    const ok = await tableExists(t);
    add(`table ${t}`, ok, ok ? 'exists' : 'MISSING');
  }
}

async function verifyEnvFlags(): Promise<void> {
  add('DATA_EXPORT_ENABLED', env.DATA_EXPORT_ENABLED === true, String(env.DATA_EXPORT_ENABLED));
  add('DATA_EXPORT_WORKER_ENABLED', env.DATA_EXPORT_WORKER_ENABLED === true, String(env.DATA_EXPORT_WORKER_ENABLED));
  add('BEPAID_ENABLED', env.BEPAID_ENABLED === true, String(env.BEPAID_ENABLED));
  add('BEPAID_RECURRING_ENABLED', env.BEPAID_RECURRING_ENABLED === true, String(env.BEPAID_RECURRING_ENABLED));
  add('BILLING_WORKER_ENABLED', env.BILLING_WORKER_ENABLED === true, String(env.BILLING_WORKER_ENABLED));
  add('SYSTEM_STATUS_CHECKS_ENABLED', env.SYSTEM_STATUS_CHECKS_ENABLED === true, String(env.SYSTEM_STATUS_CHECKS_ENABLED));
}

async function fetchJson(url: string, init?: RequestInit): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, init);
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = await res.text();
  }
  return { status: res.status, body };
}

async function verifyPublicApi(): Promise<void> {
  if (!API) {
    add('PUBLIC_API_URL', false, 'not set');
    return;
  }
  const ready = await fetchJson(`${API}/api/health/ready`);
  add(
    'API health/ready',
    ready.status === 200,
    `${ready.status} ${JSON.stringify(ready.body).slice(0, 120)}`,
  );

  const status = await fetchJson(`${API}/api/public/status/`);
  const st = status.body as { monitoring?: { mode?: string } } | null;
  add(
    'GET /api/public/status',
    status.status === 200,
    `${status.status} monitoring=${st?.monitoring?.mode ?? '?'}`,
  );
}

async function signToken(profileId: string, role: string): Promise<string> {
  return jwt.sign({ sub: profileId, role }, env.JWT_SECRET, { expiresIn: '1h' });
}

async function verifyAuthenticatedFlows(): Promise<void> {
  const masterR = await query<{ id: string }>(
    `select mp.master_id as id from public.master_profiles mp
      join public.profiles p on p.id = mp.master_id
     where p.account_status = 'active'
     limit 1`,
  );
  const adminR = await query<{ id: string }>(
    `select id from public.profiles
      where role = 'platform_admin' and account_status = 'active'
     limit 1`,
  );
  const masterId = masterR.rows[0]?.id;
  const adminId = adminR.rows[0]?.id;
  if (!masterId || !adminId || !API) {
    add('auth flows', false, 'no master/admin or API');
    return;
  }

  const masterToken = await signToken(masterId, 'master');
  const adminToken = await signToken(adminId, 'platform_admin');

  const caps = await fetchJson(`${API}/api/me/data-export/capabilities`, {
    headers: { Authorization: `Bearer ${masterToken}` },
  });
  const capBody = caps.body as { available?: boolean } | null;
  add(
    'data-export capabilities',
    caps.status === 200,
    `${caps.status} available=${String(capBody?.available)}`,
  );

  const prefs = await fetchJson(`${API}/api/me/master/notification-preferences/`, {
    headers: { Authorization: `Bearer ${masterToken}` },
  });
  add('notification preferences GET', prefs.status === 200, String(prefs.status));

  const supportList = await fetchJson(`${API}/api/platform-admin/support/tickets?status=unresolved&limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const sl = supportList.body as { tickets?: unknown[] } | null;
  add(
    'platform-admin support tickets',
    supportList.status === 200,
    `${supportList.status} count=${sl?.tickets?.length ?? 0}`,
  );

  const billing = await fetchJson(`${API}/api/billing/subscription`, {
    headers: { Authorization: `Bearer ${masterToken}` },
  });
  const b = billing.body as { billing?: { autoRenewLegalAllowed?: boolean; uiState?: string } } | null;
  add(
    'billing subscription',
    billing.status === 200,
    `${billing.status} uiState=${b?.billing?.uiState} autoRenewLegalAllowed=${b?.billing?.autoRenewLegalAllowed}`,
  );

  const diag = await fetchJson(`${API}/api/platform-admin/billing/diagnostics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  add('billing diagnostics', diag.status === 200, String(diag.status));

  const sec = await query<{ action: string }>(
    `select action from public.admin_audit_logs
      where action like 'auth_%' or action like 'support_%'
      order by created_at desc limit 5`,
  );
  add(
    'recent security/support audit rows',
    (sec.rowCount ?? 0) > 0,
    sec.rows.map((r) => r.action).join(', ') || 'none',
  );

  const notif = await query<{ title: string }>(
    `select title from public.notifications
      where user_id = $1 and type = 'system'
      order by created_at desc limit 3`,
    [adminId],
  );
  add(
    'admin system notifications exist',
    (notif.rowCount ?? 0) > 0,
    notif.rows.map((r) => r.title).join(' | ') || 'none (support flow may not have been run on staging API yet)',
  );
}

async function verifyFrontendReachable(): Promise<void> {
  for (const path of ['/status', '/master/settings/security']) {
    try {
      const res = await fetch(`${FRONTEND}${path}`, { redirect: 'follow' });
      add(`frontend ${path}`, res.status < 500, `HTTP ${res.status}`);
    } catch (e) {
      add(`frontend ${path}`, false, e instanceof Error ? e.message : String(e));
    }
  }
}

async function main(): Promise<void> {
  console.log('=== SLOTTY Staging Settings Verification ===');
  console.log(`API: ${API || '(not set)'}`);
  console.log(`Frontend: ${FRONTEND}`);
  console.log(`NODE_ENV: ${env.NODE_ENV}`);
  console.log('');

  await verifyMigrationsAndTables();
  await verifyEnvFlags();
  await verifyPublicApi();
  await verifyAuthenticatedFlows();
  await verifyFrontendReachable();

  console.log('');
  let failed = 0;
  for (const c of checks) {
    const mark = c.ok ? 'PASS' : 'FAIL';
    if (!c.ok) failed += 1;
    console.log(`[${mark}] ${c.name}: ${c.detail}`);
  }
  console.log('');
  console.log(`Total: ${checks.length - failed}/${checks.length} passed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
