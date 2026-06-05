/**
 * HTTP smoke: platform-admin bookings search by SL-code + RBAC.
 * Usage: cd server && npm run e2e:platform-admin-bookings-search
 */
import jwt from 'jsonwebtoken';
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';
import { listPlatformBookings } from '../modules/platform-admin/platformAdmin.bookings.service.js';

function pass(name: string, detail?: string) {
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name: string, detail?: string) {
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
  process.exitCode = 1;
}

function bearer(profileId: string, role: string, secret: string): string {
  return jwt.sign({ sub: profileId, role }, secret, { expiresIn: '1h' });
}

async function fetchJson(
  method: string,
  path: string,
  opts?: { token?: string; query?: Record<string, string> },
): Promise<{ status: number; json: unknown }> {
  const base = process.env.E2E_API_URL?.replace(/\/$/, '') ?? `http://localhost:${process.env.PORT ?? 4000}`;
  const qs = opts?.query ? `?${new URLSearchParams(opts.query).toString()}` : '';
  const res = await fetch(`${base}${path}${qs}`, {
    method,
    headers: {
      ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      'Content-Type': 'application/json',
    },
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function main() {
  loadE2eEnv();
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    fail('setup', 'JWT_SECRET required');
    return;
  }

  const pg = await connectE2ePg();

  const sample = await pg.query<{ voucher_number: string; client_name: string; master_name: string; service_title: string }>(
    `select bv.voucher_number, cp.full_name as client_name, mp.display_name as master_name, a.service_title_snapshot as service_title
       from public.booking_vouchers bv
       join public.appointments a on a.id = bv.appointment_id
       join public.profiles cp on cp.id = a.client_id
       join public.master_profiles mp on mp.master_id = a.master_id
      order by a.created_at desc
      limit 1`,
  );
  const row = sample.rows[0];
  if (!row) {
    fail('setup', 'No booking with voucher in DB — create a test booking first');
    await pg.end();
    return;
  }

  const code = row.voucher_number;
  const lower = code.toLowerCase();
  const prefix = code.slice(0, 8);

  const exact = await listPlatformBookings({ q: code, limit: 10 });
  exact.total >= 1 && exact.bookings.some((b) => b.bookingCode === code)
    ? pass('service: exact SL-code', `total=${exact.total}`)
    : fail('service: exact SL-code', `total=${exact.total}`);

  const lowerRes = await listPlatformBookings({ q: `  ${lower}  `, limit: 10 });
  lowerRes.bookings.some((b) => b.bookingCode === code)
    ? pass('service: lowercase SL-code')
    : fail('service: lowercase SL-code');

  const prefixRes = await listPlatformBookings({ q: prefix, limit: 10 });
  prefixRes.bookings.some((b) => b.bookingCode === code)
    ? pass('service: partial SL prefix', prefix)
    : fail('service: partial SL prefix');

  const clientRes = await listPlatformBookings({ q: row.client_name.slice(0, 6), limit: 10 });
  clientRes.total >= 1 ? pass('service: client name search') : fail('service: client name search');

  const masterRes = await listPlatformBookings({ q: row.master_name.slice(0, 6), limit: 10 });
  masterRes.total >= 1 ? pass('service: master name search') : fail('service: master name search');

  const serviceRes = await listPlatformBookings({ q: row.service_title.slice(0, 6), limit: 10 });
  serviceRes.total >= 1 ? pass('service: service title search') : fail('service: service title search');

  const emptyRes = await listPlatformBookings({ limit: 5 });
  emptyRes.total >= 1 ? pass('service: empty search returns list', `total=${emptyRes.total}`) : fail('service: empty search');

  const adminR = await pg.query<{ id: string }>(
    `select id from public.profiles where role = 'platform_admin'::public.user_role and account_status = 'active' limit 1`,
  );
  const masterR = await pg.query<{ id: string }>(
    `select id from public.profiles where role = 'master'::public.user_role and account_status = 'active' limit 1`,
  );
  const adminId = adminR.rows[0]?.id;
  const masterId = masterR.rows[0]?.id;

  if (adminId) {
    const adminToken = bearer(adminId, 'platform_admin', jwtSecret);
    const httpExact = await fetchJson('GET', '/api/platform-admin/bookings', {
      token: adminToken,
      query: { q: code, limit: '5' },
    });
    httpExact.status === 200 ? pass('HTTP admin search by SL-code', `status=${httpExact.status}`) : fail('HTTP admin search', `status=${httpExact.status}`);
  } else {
    fail('HTTP admin search', 'no platform_admin profile');
  }

  if (masterId) {
    const masterToken = bearer(masterId, 'master', jwtSecret);
    const denied = await fetchJson('GET', '/api/platform-admin/bookings', { token: masterToken });
    denied.status === 403 ? pass('HTTP master forbidden', `status=${denied.status}`) : fail('HTTP master forbidden', `status=${denied.status}`);
  } else {
    fail('HTTP master forbidden', 'no master profile');
  }

  const anon = await fetchJson('GET', '/api/platform-admin/bookings');
  anon.status === 401 ? pass('HTTP unauthenticated', `status=${anon.status}`) : fail('HTTP unauthenticated', `status=${anon.status}`);

  await pg.end();
  console.log('\n--- Summary ---');
  console.log(process.exitCode ? 'FAIL' : 'PASS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
