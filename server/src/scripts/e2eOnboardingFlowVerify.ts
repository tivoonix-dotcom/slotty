/**
 * Интеграционная проверка onboarding Free/Pro + server progress.
 * cd server && AUTO_START_PRO_TRIAL_ENABLED=false npx tsx src/scripts/e2eOnboardingFlowVerify.ts
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';
import { validateOnboardingServices } from '../modules/masters/masterOnboardingPlanLimits.js';
import { shouldStartProTrialAfterComplete } from '../modules/masters/masterOnboardingProgress.service.js';

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

function makeServices(count: number, active = true) {
  return Array.from({ length: count }, (_, i) => ({
    title: `Услуга ${i + 1}`,
    durationMinutes: 60,
    priceAmount: 50,
    isActive: active,
    sortOrder: i,
  }));
}

async function queryCategoryCode(pg: import('pg').Client): Promise<string | null> {
  const r = await pg.query<{ code: string }>(
    `select code from public.service_categories where is_active = true order by sort_order limit 1`,
  );
  return r.rows[0]?.code ?? null;
}

async function main() {
  loadE2eEnv();
  process.env.AUTO_START_PRO_TRIAL_ENABLED = 'false';

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

  // Pure logic checks (no DB)
  log(
    validateOnboardingServices(makeServices(4, true), 'pro_checkout').ok === true,
    'pro_checkout allows 4 active services',
    String(validateOnboardingServices(makeServices(4, true), 'pro_checkout').ok),
  );
  log(
    validateOnboardingServices(makeServices(4, true), 'free_publish').ok === false,
    'free_publish blocks 4 active',
    String(!validateOnboardingServices(makeServices(4, true), 'free_publish').ok),
  );
  log(
    validateOnboardingServices(makeServices(3, true), 'free_publish').ok === true,
    'free_publish allows 3 active',
    String(validateOnboardingServices(makeServices(3, true), 'free_publish').ok),
  );
  log(
    shouldStartProTrialAfterComplete(true) === false,
    'proCheckoutIntent skips trial helper',
    String(shouldStartProTrialAfterComplete(true)),
  );

  const pg = await connectE2ePg();
  const tag = `e2e_ob_${Date.now()}`;
  const masterId = crypto.randomUUID();
  const cleanupIds: string[] = [masterId];

  try {
    const catCode = await queryCategoryCode(pg);
    if (!catCode) {
      console.error('No category');
      process.exit(1);
    }

    await pg.query(
      `insert into public.profiles (id, role, full_name) values ($1, 'client', $2)`,
      [masterId, `E2E ${tag}`],
    );

    const token = bearer(masterId, 'master', jwtSecret);

    const progressGet = await fetchJson('GET', '/api/masters/me/onboarding-progress', { token });
    log(progressGet.status === 200, 'GET onboarding-progress', `status=${progressGet.status}`);

    const progressPatch = await fetchJson('PATCH', '/api/masters/me/onboarding-progress', {
      token,
      body: { currentStep: 7, furthestStep: 7, selectedTariff: 'pro_purchase' },
    });
    const patched = progressPatch.json?.progress as { selectedTariff?: string; currentStep?: number } | undefined;
    log(
      progressPatch.status === 200 && patched?.selectedTariff === 'pro_purchase',
      'PATCH onboarding-progress tariff',
      `tariff=${patched?.selectedTariff} step=${patched?.currentStep}`,
    );

    const onboardingBody = {
      categoryCode: catCode,
      name: `Master ${tag}`,
      description: 'E2E onboarding',
      phone: '+375291234567',
      location: {
        visitType: 'studio',
        city: 'Минск',
        street: 'Тестовая',
        building: '1',
        publicAddress: 'Минск, Тестовая 1',
      },
      scheduleRules: [{ weekday: 1, startTime: '09:00', endTime: '18:00', isActive: true }],
      services: makeServices(4, true),
      certificates: [],
      proInterested: true,
      proCheckoutIntent: true,
    };

    const onboard = await fetchJson('POST', '/api/masters/me/onboarding', {
      token,
      body: onboardingBody,
    });
    log(onboard.status === 201, 'POST onboarding proCheckoutIntent 4 services', `status=${onboard.status}`);

    const svc = await pg.query<{ active: string; inactive: string }>(
      `select
         count(*) filter (where is_active)::text as active,
         count(*) filter (where not is_active)::text as inactive
       from public.master_services where master_id = $1`,
      [masterId],
    );
    log(
      svc.rows[0]?.active === '3' && svc.rows[0]?.inactive === '1',
      'services 3 active + 1 inactive before payment',
      JSON.stringify(svc.rows[0]),
    );

    const profile = await pg.query<{ publication_status: string; is_profile_active: boolean }>(
      `select publication_status::text, is_profile_active from public.master_profiles where master_id = $1`,
      [masterId],
    );
    log(
      profile.rows[0]?.publication_status === 'draft' && profile.rows[0]?.is_profile_active === false,
      'profile stays draft after onboarding',
      JSON.stringify(profile.rows[0]),
    );

    const progressAfter = await fetchJson('GET', '/api/masters/me/onboarding-progress', { token });
    const pa = progressAfter.json?.progress as { onboardingStatus?: string } | undefined;
    log(
      progressAfter.status === 200 &&
        (pa?.onboardingStatus === 'checkout_pending' ||
          pa?.onboardingStatus === 'payment_processing' ||
          pa?.onboardingStatus === 'ready_to_publish'),
      'progress after onboarding',
      `status=${pa?.onboardingStatus}`,
    );
  } finally {
    for (const id of cleanupIds) {
      await pg.query(`delete from public.master_onboarding_progress where master_id = $1`, [id]).catch(() => {});
      await pg.query(`delete from public.master_services where master_id = $1`, [id]).catch(() => {});
      await pg.query(`delete from public.master_profiles where master_id = $1`, [id]).catch(() => {});
      await pg.query(`delete from public.profiles where id = $1`, [id]).catch(() => {});
    }
    await pg.end();
  }

  const failed = rows.filter((r) => !r.ok);
  console.log(`\n${rows.length - failed.length}/${rows.length} passed`);
  if (failed.length) {
    failed.forEach((r) => console.error(`FAIL: ${r.name} — ${r.detail}`));
    process.exit(1);
  }
}

void main();
