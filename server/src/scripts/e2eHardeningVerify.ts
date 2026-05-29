/**
 * Финальная проверка production hardening (локальный API :4000).
 * cd server && npm run e2e:hardening-verify
 *
 * Rate limits (см. server/src/middlewares/rateLimit.ts):
 * - auth email send: 5 / 15 min (prod), ×4 в dev
 * - auth login/verify: 10 / 15 min (prod), ×4 в dev
 * - POST appointments: 10 / min (prod), ×4 в dev
 * - platform-admin POST: 60 / min (prod), ×4 в dev
 * - public catalog GET (listings, masters list, slots): 1000 / min / IP (prod), 5000 / min (dev)
 *   Ключ IP: resolveClientIp (server/src/lib/clientIp.ts)
 *   CF-Connecting-IP только при TRUST_CLOUDFLARE_HEADERS=true или TRUST_PROXY=2 в production
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';

const API = process.env.E2E_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}`;

type Row = { section: string; name: string; ok: boolean; detail: string };
const rows: Row[] = [];

function log(ok: boolean, section: string, name: string, detail: string) {
  rows.push({ section, name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} [${section}] ${name} — ${detail}`);
}

async function fetchJson(
  method: string,
  path: string,
  opts?: { token?: string; body?: unknown },
): Promise<{ status: number; json: Record<string, unknown> | null; headers: Headers }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(opts?.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      ...(opts?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  return { status: res.status, json, headers: res.headers };
}

function errCode(json: Record<string, unknown> | null): string | undefined {
  const err = json?.error as { code?: string } | undefined;
  return err?.code;
}

function bearer(id: string, role: string, secret: string): string {
  return jwt.sign({ sub: id, role }, secret, { expiresIn: '2h' });
}

async function hammer(
  n: number,
  fn: () => Promise<{ status: number; json: Record<string, unknown> | null }>,
): Promise<{ ok429: number; other: number; lastCode?: string }> {
  let ok429 = 0;
  let other = 0;
  let lastCode: string | undefined;
  for (let i = 0; i < n; i++) {
    const r = await fn();
    lastCode = errCode(r.json);
    if (r.status === 429 && lastCode === 'RATE_LIMITED') ok429++;
    else other++;
  }
  return { ok429, other, lastCode };
}

async function main() {
  loadE2eEnv();
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 16) {
    console.error('JWT_SECRET не задан в server/.env');
    process.exit(1);
  }

  const health = await fetch(`${API}/api/health/`);
  if (!health.ok) {
    console.error(`API недоступен: ${API}`);
    process.exit(1);
  }

  const pg = await connectE2ePg();
  const tag = `e2e_hv_${Date.now()}`;
  const cleanupIds: string[] = [];

  try {
    // --- 8. Health ---
    const readyOk = await fetch(`${API}/api/health/ready`);
    const readyJson = (await readyOk.json().catch(() => ({}))) as Record<string, string>;
    log(
      readyOk.status === 200 && readyJson.status === 'ok' && readyJson.db === 'ok',
      'health',
      'GET /api/health/ready (DB up)',
      `status=${readyOk.status} body=${JSON.stringify(readyJson)}`,
    );

    // --- 4. Public slots (до catalog hammer — общий publicCatalogRateLimit) ---
    await verifyPublicSlots(pg, tag, cleanupIds);

    // --- 2. Rate limits (dev ×4 — нужно больше запросов) ---
    const devMult = process.env.NODE_ENV === 'production' ? 1 : 4;
    const emailSendN = 5 * devMult + 2;
    const hammerSend = await hammer(emailSendN, () =>
      fetchJson('POST', '/api/auth/email/send-verification', {
        body: { email: `noreply+${tag}@example.com` },
      }),
    );
    log(
      hammerSend.ok429 >= 1,
      'rate-limit',
      'email send-verification → 429 RATE_LIMITED',
      `${hammerSend.ok429}×429 / ${emailSendN} reqs (NODE_ENV=${process.env.NODE_ENV ?? 'development'}, mult=${devMult})`,
    );

    const loginN = 10 * devMult + 3;
    const hammerLogin = await hammer(loginN, () =>
      fetchJson('POST', '/api/auth/email/login', {
        body: { email: 'nobody@example.com', password: 'wrong-password-xyz' },
      }),
    );
    log(
      hammerLogin.ok429 >= 1,
      'rate-limit',
      'email login → 429',
      `${hammerLogin.ok429}×429 / ${loginN}`,
    );

    let catalogLimitPerMin = process.env.NODE_ENV === 'production' ? 1000 : 5000;
    const firstCatalog = await fetchJson('GET', '/api/catalog/listings?limit=1');
    const limitHeader = firstCatalog.headers.get('RateLimit-Limit');
    if (limitHeader) {
      const parsed = Number.parseInt(limitHeader, 10);
      if (Number.isFinite(parsed) && parsed > 0) catalogLimitPerMin = parsed;
    }

    const catalogBurstTotal = catalogLimitPerMin + 80;
    const batchSize = 80;
    let catalogHit = false;
    let catalogAttempts = 0;
    for (let start = 0; start < catalogBurstTotal && !catalogHit; start += batchSize) {
      const size = Math.min(batchSize, catalogBurstTotal - start);
      const batch = await Promise.all(
        Array.from({ length: size }, () => fetchJson('GET', '/api/catalog/listings?limit=1')),
      );
      catalogAttempts += size;
      for (const r of batch) {
        if (r.status === 429 && errCode(r.json) === 'RATE_LIMITED') {
          catalogHit = true;
          break;
        }
      }
    }
    log(
      catalogHit,
      'rate-limit',
      'catalog listings → 429 RATE_LIMITED',
      catalogHit
        ? `429 within ${catalogAttempts} burst reqs (RateLimit-Limit=${catalogLimitPerMin}/min per IP)`
        : `no 429 in ${catalogAttempts} burst reqs (limit header=${catalogLimitPerMin})`,
    );

    // --- 6. Pagination ---
    const clientId = crypto.randomUUID();
    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status) values ($1, 'client', $2, 'active')`,
      [clientId, `${tag}_pag_client`],
    );
    cleanupIds.push(clientId);
    const clientTok = bearer(clientId, 'client', jwtSecret);
    const p0 = await fetchJson('GET', '/api/me/appointments?limit=10&offset=0', { token: clientTok });
    const p0j = p0.json;
    log(
      p0.status === 200 &&
        Array.isArray(p0j?.appointments) &&
        Array.isArray(p0j?.items) &&
        typeof p0j?.total === 'number' &&
        p0j?.limit === 10,
      'pagination',
      'client appointments shape',
      `keys ok, total=${p0j?.total}`,
    );

    const badOff = await fetchJson('GET', '/api/me/appointments?offset=-1', { token: clientTok });
    log(badOff.status === 400, 'pagination', 'negative offset → 400', `status=${badOff.status}`);

    // --- 5. Pro gates (free master) ---
    const freeMaster = crypto.randomUUID();
    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status) values ($1, 'master', $2, 'active')`,
      [freeMaster, `${tag}_free`],
    );
    await pg.query(
      `insert into public.master_profiles (master_id, display_name, publication_status, is_profile_active)
       values ($1, $2, 'published', true)`,
      [freeMaster, `${tag}_free`],
    );
    cleanupIds.push(freeMaster);
    const freeTok = bearer(freeMaster, 'master', jwtSecret);
    const plan = await queryFreePlan(pg);
    if (plan) {
      await pg.query(
        `insert into public.master_subscriptions (master_id, plan_id, status, billing_period, current_period_start, current_period_end)
         values ($1, $2, 'active', 'month', now(), now() + interval '400 days')
         on conflict (master_id) do update set plan_id = $2`,
        [freeMaster, plan],
      );
    }
    const ov = await fetchJson('GET', '/api/masters/me/overview/summary', { token: freeTok });
    log(
      ov.status === 403 && errCode(ov.json) === 'PRO_REQUIRED',
      'pro-gates',
      'free → overview/summary 403 PRO_REQUIRED',
      `status=${ov.status}`,
    );
    const ovClients = await fetchJson('GET', '/api/masters/me/overview/clients', { token: freeTok });
    log(ovClients.status === 200, 'pro-gates', 'free → overview/clients 200', `status=${ovClients.status}`);
    const ovRep = await fetchJson('GET', '/api/masters/me/overview/reputation', { token: freeTok });
    log(ovRep.status === 200, 'pro-gates', 'free → overview/reputation 200', `status=${ovRep.status}`);
    const sp = await fetchJson('GET', '/api/masters/me/smart-promotion-suggestions/', { token: freeTok });
    log(
      sp.status === 403 && errCode(sp.json) === 'PRO_REQUIRED',
      'pro-gates',
      'free → smart-promo 403',
      `status=${sp.status}`,
    );

    const mockPatch = await fetchJson('PATCH', '/api/masters/me/subscription/mock', {
      token: freeTok,
      body: { planCode: 'pro', billingPeriod: 'month' },
    });
    const mockOk =
      process.env.NODE_ENV === 'production'
        ? mockPatch.status === 403 && errCode(mockPatch.json) === 'SUBSCRIPTION_MOCK_DISABLED'
        : mockPatch.status === 200 || mockPatch.status === 403;
    log(
      mockOk,
      'pro-gates',
      'subscription/mock',
      `NODE_ENV=${process.env.NODE_ENV ?? 'development'} status=${mockPatch.status} code=${errCode(mockPatch.json)}`,
    );

    // --- Expired Pro ---
    const expiredProMaster = crypto.randomUUID();
    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status) values ($1, 'master', $2, 'active')`,
      [expiredProMaster, `${tag}_expired_pro`],
    );
    await pg.query(
      `insert into public.master_profiles (
         master_id, display_name, publication_status, is_profile_active,
         master_plan, pro_status, pro_started_at, pro_expires_at
       ) values ($1, $2, 'published', true, 'pro', 'active', now() - interval '60 days', now() - interval '1 day')`,
      [expiredProMaster, `${tag}_expired_pro`],
    );
    cleanupIds.push(expiredProMaster);
    const proPlanId = await queryPlanId(pg, 'pro');
    if (proPlanId) {
      await pg.query(
        `insert into public.master_subscriptions (
           master_id, plan_id, status, billing_period, current_period_start, current_period_end
         ) values ($1, $2, 'active', 'month', now() - interval '60 days', now() - interval '1 day')
         on conflict (master_id) do update set
           plan_id = $2,
           current_period_start = now() - interval '60 days',
           current_period_end = now() - interval '1 day'`,
        [expiredProMaster, proPlanId],
      );
    }
    const expiredTok = bearer(expiredProMaster, 'master', jwtSecret);
    const expiredSummary = await fetchJson('GET', '/api/masters/me/overview/summary', {
      token: expiredTok,
    });
    log(
      expiredSummary.status === 403 && errCode(expiredSummary.json) === 'SUBSCRIPTION_EXPIRED',
      'pro-expiry',
      'expired Pro → overview/summary 403 SUBSCRIPTION_EXPIRED',
      `status=${expiredSummary.status} code=${errCode(expiredSummary.json)}`,
    );

    // --- Portfolio limit (Free) ---
    for (let i = 0; i < 3; i++) {
      await pg.query(
        `insert into public.master_portfolio_items (master_id, image_url, sort_order)
         values ($1, $2, $3)`,
        [freeMaster, `https://example.com/p${i}.jpg`, i],
      );
    }
    const portfolio4 = await fetchJson('POST', '/api/masters/me/portfolio', {
      token: freeTok,
      body: { imageUrl: 'https://example.com/p4.jpg', sortOrder: 4 },
    });
    log(
      portfolio4.status === 403 && errCode(portfolio4.json) === 'PLAN_LIMIT_REACHED',
      'plan-limits',
      'free → 4th portfolio item blocked',
      `status=${portfolio4.status} code=${errCode(portfolio4.json)}`,
    );

    // --- RLS: no write policy on master_subscriptions ---
    const rlsPolicies = await pg.query<{ polname: string }>(
      `select policyname as polname
         from pg_policies
        where schemaname = 'public'
          and tablename = 'master_subscriptions'
          and cmd in ('ALL', 'INSERT', 'UPDATE', 'DELETE')`,
    );
    log(
      rlsPolicies.rowCount === 0,
      'rls',
      'master_subscriptions has no authenticated write policies',
      `policies=${rlsPolicies.rows.map((r) => r.polname).join(',') || 'none'}`,
    );

    // --- 7. Platform admin safety ---
    const adminId = crypto.randomUUID();
    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status) values ($1, 'platform_admin', $2, 'active')`,
      [adminId, `${tag}_admin`],
    );
    cleanupIds.push(adminId);
    const adminTok = bearer(adminId, 'platform_admin', jwtSecret);
    const selfBlock = await fetchJson('POST', `/api/platform-admin/users/${adminId}/block`, {
      token: adminTok,
      body: { reason: 'e2e self' },
    });
    log(
      selfBlock.status === 403 && errCode(selfBlock.json) === 'SELF_ADMIN_ACTION_FORBIDDEN',
      'platform-admin',
      'self block forbidden',
      `status=${selfBlock.status}`,
    );

    const clientTok2 = bearer(clientId, 'client', jwtSecret);
    const paDenied = await fetchJson('GET', '/api/platform-admin/overview', { token: clientTok2 });
    log(paDenied.status === 403, 'platform-admin', 'client cannot access platform-admin', `status=${paDenied.status}`);

    // --- 3. Privacy (DB + API) ---
    await verifyPrivacy(pg, tag, cleanupIds);

    console.log('\n--- Summary ---');
    const bySection = new Map<string, { pass: number; fail: number }>();
    for (const r of rows) {
      const s = bySection.get(r.section) ?? { pass: 0, fail: 0 };
      if (r.ok) s.pass++;
      else s.fail++;
      bySection.set(r.section, s);
    }
    for (const [sec, s] of bySection) {
      console.log(`${sec}: ${s.pass} pass, ${s.fail} fail`);
    }
    const failed = rows.filter((r) => !r.ok).length;
    process.exit(failed > 0 ? 1 : 0);
  } finally {
    for (const id of cleanupIds) {
      await pg.query(`delete from public.profiles where id = $1`, [id]).catch(() => {});
    }
    await pg.end().catch(() => {});
  }
}

async function queryFreePlan(pg: import('pg').Client): Promise<string | null> {
  return queryPlanId(pg, 'free');
}

async function queryPlanId(pg: import('pg').Client, code: string): Promise<string | null> {
  const r = await pg.query<{ id: string }>(
    `select id from public.subscription_plans where code = $1 and is_active = true limit 1`,
    [code],
  );
  return r.rows[0]?.id ?? null;
}

async function verifyPrivacy(
  pg: import('pg').Client,
  tag: string,
  cleanupIds: string[],
) {
  const masterId = crypto.randomUUID();
  cleanupIds.push(masterId);
  await pg.query(
    `insert into public.profiles (id, role, full_name, account_status) values ($1, 'master', $2, 'active')`,
    [masterId, `${tag}_priv`],
  );
  await pg.query(
    `insert into public.master_profiles (master_id, display_name, publication_status, is_profile_active)
     values ($1, $2, 'published', true)`,
    [masterId, `${tag}_priv`],
  );

  const cat = await pg.query<{ id: string }>(
    `select id from public.service_categories where is_active = true limit 1`,
  );
  const categoryId = cat.rows[0]?.id;
  if (!categoryId) {
    log(false, 'privacy', 'setup', 'no category');
    return;
  }

  const svcId = crypto.randomUUID();
  await pg.query(
    `insert into public.master_services (id, master_id, category_id, title, duration_minutes, price_amount, price_type, is_active, sort_order)
     values ($1, $2, $3, 'svc', 60, 10, 'fixed', true, 0)`,
    [svcId, masterId, categoryId],
  );

  await pg.query(
    `insert into public.master_locations (
       master_id, visit_type, city, street, building, entrance, floor, room, public_address, lat, lng,
       show_exact_address_after_booking, is_primary
     ) values ($1, 'studio', 'Minsk', 'Studio St', '1', 'A', '2', '10', 'Studio public', 53.9, 27.5, false, true)`,
    [masterId],
  );

  const homeMaster = crypto.randomUUID();
  cleanupIds.push(homeMaster);
  await pg.query(
    `insert into public.profiles (id, role, full_name, account_status) values ($1, 'master', $2, 'active')`,
    [homeMaster, `${tag}_home`],
  );
  await pg.query(
    `insert into public.master_profiles (master_id, display_name, publication_status, is_profile_active)
     values ($1, $2, 'published', true)`,
    [homeMaster, `${tag}_home`],
  );
  await pg.query(
    `insert into public.master_locations (
       master_id, visit_type, city, street, building, entrance, floor, room, public_address, lat, lng,
       show_exact_address_after_booking, is_primary
     ) values ($1, 'at_home', 'Minsk', 'Home St', '99', 'B', '3', '15', 'Home area', 53.91, 27.51, true, true)`,
    [homeMaster],
  );
  await pg.query(
    `insert into public.master_services (id, master_id, category_id, title, duration_minutes, price_amount, price_type, is_active, sort_order)
     values ($1, $2, $3, 'home svc', 60, 10, 'fixed', true, 0)`,
    [crypto.randomUUID(), homeMaster, categoryId],
  );

  const pub = await fetchJson('GET', `/api/masters/${homeMaster}`);
  const locs = (pub.json?.locations as Array<Record<string, unknown>>) ?? [];
  const homeLoc = locs[0];
  log(
    pub.status === 200 && homeLoc?.building === '' && (homeLoc?.lat == null || homeLoc?.lat === ''),
    'privacy',
    'at_home hide until booking (public profile)',
    `building=${JSON.stringify(homeLoc?.building)} lat=${JSON.stringify(homeLoc?.lat)}`,
  );

  const studioPub = await fetchJson('GET', `/api/masters/${masterId}`);
  const sl = ((studioPub.json?.locations as Array<Record<string, unknown>>) ?? [])[0];
  log(
    studioPub.status === 200 && sl?.building === '1' && sl?.lat != null,
    'privacy',
    'studio full address public',
    `building=${sl?.building}`,
  );
}

async function verifyPublicSlots(
  pg: import('pg').Client,
  tag: string,
  cleanupIds: string[],
) {
  const cat = await pg.query<{ id: string }>(
    `select id from public.service_categories where is_active = true limit 1`,
  );
  const categoryId = cat.rows[0]?.id;
  if (!categoryId) return;

  async function mkMaster(label: string, pub: string, account: string, restrictedUntil: string | null) {
    const id = crypto.randomUUID();
    cleanupIds.push(id);
    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status, access_restricted_until)
       values ($1, 'master', $2, $3::public.profile_account_status, $4)`,
      [id, `${tag}_${label}`, account, restrictedUntil],
    );
    await pg.query(
      `insert into public.master_profiles (master_id, display_name, publication_status, is_profile_active)
       values ($1, $2, $3::public.master_publication_status, true)`,
      [id, label, pub],
    );
    const svc = crypto.randomUUID();
    await pg.query(
      `insert into public.master_services (id, master_id, category_id, title, duration_minutes, price_amount, price_type, is_active, sort_order, admin_hidden_at)
       values ($1, $2, $3, $4, 60, 10, 'fixed', true, 0, $5)`,
      [svc, id, categoryId, `${label}_svc`, null],
    );
    const slot = crypto.randomUUID();
    const start = new Date(Date.now() + 72 * 3600_000);
    const end = new Date(start.getTime() + 3600_000);
    await pg.query(
      `insert into public.master_availability_slots (id, master_id, service_id, starts_at, ends_at, status, source)
       values ($1, $2, $3, $4, $5, 'available', 'manual')`,
      [slot, id, svc, start.toISOString(), end.toISOString()],
    );
    return { masterId: id, slotId: slot };
  }

  const active = await mkMaster('active_m', 'published', 'active', null);
  const slotsActive = await fetchJson('GET', `/api/slots?masterId=${active.masterId}`);
  const listA = (slotsActive.json?.slots as unknown[]) ?? [];
  log(listA.length >= 1, 'public-slots', 'active master has slots', `count=${listA.length}`);

  const blocked = await mkMaster('blocked_m', 'published', 'blocked', null);
  const slotsBlocked = await fetchJson('GET', `/api/slots?masterId=${blocked.masterId}`);
  log(
    ((slotsBlocked.json?.slots as unknown[]) ?? []).length === 0,
    'public-slots',
    'blocked master no slots',
    `count=${((slotsBlocked.json?.slots as unknown[]) ?? []).length}`,
  );

  const restricted = await mkMaster('restr_m', 'published', 'restricted', new Date(Date.now() + 86400_000).toISOString());
  const slotsR = await fetchJson('GET', `/api/slots?masterId=${restricted.masterId}`);
  log(
    ((slotsR.json?.slots as unknown[]) ?? []).length === 0,
    'public-slots',
    'active restriction no slots',
    `count=${((slotsR.json?.slots as unknown[]) ?? []).length}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
