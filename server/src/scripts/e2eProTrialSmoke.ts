/**
 * Pro trial smoke: entitlements API, trial start, expiry, paid conversion guards.
 * Requires: DATABASE_URL, JWT_SECRET; optional E2E_API_URL + running API for HTTP checks.
 *
 * Usage: cd server && npx tsx src/scripts/e2eProTrialSmoke.ts
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

function bearer(id: string, secret: string): string {
  return jwt.sign({ sub: id, role: 'master' }, secret, { expiresIn: '2h' });
}

async function fetchEntitlements(token: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${API}/api/masters/me/entitlements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { entitlements?: Record<string, unknown> };
    return j.entitlements ?? null;
  } catch {
    return null;
  }
}

async function main() {
  loadE2eEnv();
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 16) {
    console.error('JWT_SECRET missing');
    process.exit(1);
  }

  const pg = await connectE2ePg();
  const tag = `trial_smoke_${Date.now()}`;
  const masterId = crypto.randomUUID();

  try {
    const cat = await pg.query<{ id: string }>(
      `select id from public.service_categories where is_active = true limit 1`,
    );
    const catId = cat.rows[0]?.id;
    const freePlan = await pg.query<{ id: string }>(
      `select id from public.subscription_plans where code = 'free' and is_active = true limit 1`,
    );
    const proPlan = await pg.query<{ id: string }>(
      `select id from public.subscription_plans where code = 'pro' and is_active = true limit 1`,
    );
    if (!catId || !freePlan.rows[0]?.id || !proPlan.rows[0]?.id) {
      console.error('Missing seed data');
      process.exit(1);
    }

    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status)
       values ($1, 'master', $2, 'active')`,
      [masterId, `Trial Smoke ${tag}`],
    );
    await pg.query(
      `insert into public.master_profiles (master_id, display_name, primary_category_id, publication_status)
       values ($1, $2, $3, 'published')`,
      [masterId, `Trial Master ${tag}`, catId],
    );
    await pg.query(
      `insert into public.master_subscriptions (
         master_id, plan_id, status, billing_period, current_period_start, current_period_end, trial_consumed
       ) values ($1, $2, 'active', 'month', now(), now() + interval '400 days', false)`,
      [masterId, freePlan.rows[0].id],
    );

    const { tryStartProTrial } = await import('../modules/billing/trial.service.js');
    const started = await tryStartProTrial(masterId);
    log(started, 'A: trial starts for new master', started ? 'tryStartProTrial=true' : 'false');

    const { getMasterEntitlements } = await import('../modules/billing/entitlements.service.js');
    const entA = await getMasterEntitlements(masterId);
    log(entA.effectivePlan === 'trial_pro', 'A: effectivePlan=trial_pro', entA.effectivePlan);
    log(entA.isProEntitled === true, 'A: isProEntitled=true', String(entA.isProEntitled));
    log(entA.trial.isActive === true, 'A: trial.isActive', String(entA.trial.isActive));
    log(
      entA.trial.daysLeft != null && entA.trial.daysLeft >= 6 && entA.trial.daysLeft <= 7,
      'A: trial.daysLeft ~7',
      String(entA.trial.daysLeft),
    );
    log(entA.features.catalogBoost === true, 'A: catalogBoost', String(entA.features.catalogBoost));
    log(entA.limits.scheduleHorizonDays === 90, 'A: scheduleHorizonDays=90', String(entA.limits.scheduleHorizonDays));

    const token = bearer(masterId, jwtSecret);
    const apiEnt = await fetchEntitlements(token);
    if (apiEnt) {
      log(apiEnt.effectivePlan === 'trial_pro', 'A: API effectivePlan', String(apiEnt.effectivePlan));
    } else {
      log(false, 'A: API entitlements', 'API unavailable or /me/entitlements failed');
    }

    const startedAgain = await tryStartProTrial(masterId);
    log(startedAgain === false, 'B: no second trial', String(startedAgain));

    await pg.query(
      `update public.master_subscriptions
          set trial_ends_at = now() - interval '1 hour',
              current_period_start = now() - interval '8 days',
              current_period_end = now() - interval '1 hour'
        where master_id = $1`,
      [masterId],
    );
    const { expireDueSubscriptions } = await import('../modules/billing/subscriptionBilling.service.js');
    await expireDueSubscriptions(masterId);
    const entC = await getMasterEntitlements(masterId);
    log(entC.effectivePlan === 'free', 'C: expired → free', entC.effectivePlan);
    log(entC.isProEntitled === false, 'C: isProEntitled=false', String(entC.isProEntitled));
    log(entC.trial.consumed === true, 'C: trial.consumed', String(entC.trial.consumed));
    log(entC.limits.maxServices === 3, 'C: maxServices=3', String(entC.limits.maxServices));
    log(entC.limits.scheduleHorizonDays === 14, 'C: scheduleHorizonDays=14', String(entC.limits.scheduleHorizonDays));

    const events = await pg.query<{ event_type: string; c: number }>(
      `select event_type, count(*)::int as c
         from public.subscription_billing_events
        where master_id = $1
          and event_type in ('trial_started', 'trial_expired', 'trial_downgraded_to_free')
        group by event_type`,
      [masterId],
    );
    const eventMap = new Map(events.rows.map((r) => [r.event_type, r.c]));
    log((eventMap.get('trial_started') ?? 0) >= 1, 'events: trial_started', String(eventMap.get('trial_started') ?? 0));
    log((eventMap.get('trial_expired') ?? 0) >= 1, 'events: trial_expired', String(eventMap.get('trial_expired') ?? 0));

    await pg.query(
      `update public.master_subscriptions
          set plan_id = $2,
              status = 'active',
              trial_consumed = true,
              current_period_start = now(),
              current_period_end = now() + interval '30 days',
              trial_ends_at = now() - interval '2 days'
        where master_id = $1`,
      [masterId, proPlan.rows[0].id],
    );
    const entD = await getMasterEntitlements(masterId);
    log(entD.effectivePlan === 'pro', 'D: paid pro after trial', entD.effectivePlan);
    log(entD.source === 'paid', 'D: source=paid', entD.source);
    log(entD.isProEntitled === true, 'D: isProEntitled', String(entD.isProEntitled));

    const { computeCatalogProBoostScore } = await import('../modules/billing/catalogProBoost.js');
    const boostWithSlot = computeCatalogProBoostScore({
      rating: 5,
      reviewsCount: 20,
      hasActiveSlot: true,
      isVerified: true,
      isProEntitled: true,
    });
    const boostNoSlot = computeCatalogProBoostScore({
      rating: 5,
      reviewsCount: 20,
      hasActiveSlot: false,
      isVerified: true,
      isProEntitled: true,
    });
    log(boostWithSlot > 0 && boostWithSlot <= 10, 'catalog: boost capped', String(boostWithSlot));
    log(boostNoSlot === 0, 'catalog: no slot → no boost', String(boostNoSlot));

    const catalog = await pg.query<{ is_pro: boolean }>(
      `select public.catalog_master_pro_entitled($1::uuid) as is_pro`,
      [masterId],
    );
    log(catalog.rows[0]?.is_pro === true, 'catalog: pro entitled fn', String(catalog.rows[0]?.is_pro));
  } finally {
    await pg.query(`delete from public.subscription_billing_events where master_id = $1`, [masterId]);
    await pg.query(`delete from public.master_subscriptions where master_id = $1`, [masterId]);
    await pg.query(`delete from public.master_profiles where master_id = $1`, [masterId]);
    await pg.query(`delete from public.profiles where id = $1`, [masterId]);
    await pg.end();
  }

  const failed = rows.filter((r) => !r.ok);
  console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
  if (failed.length) {
    failed.forEach((r) => console.error(`FAIL: ${r.name} — ${r.detail}`));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
