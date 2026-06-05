/**
 * Seed empty day-1 master for Playwright UI tests.
 * Prints JSON: { masterId, token, cleanupTag }
 *
 * Usage: cd server && npx tsx src/scripts/seedPlaywrightDay1Master.ts
 */
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';

function bearer(id: string, role: string, secret: string): string {
  return jwt.sign({ sub: id, role }, secret, { expiresIn: '2h' });
}

async function main() {
  loadE2eEnv();
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret || jwtSecret.length < 16) {
    console.error('JWT_SECRET missing');
    process.exit(1);
  }

  const pg = await connectE2ePg();
  const tag = `pw_d1_${Date.now()}`;
  const masterId = crypto.randomUUID();

  try {
    const cat = await pg.query<{ id: string }>(
      `select id from public.service_categories where is_active = true order by sort_order limit 1`,
    );
    const catId = cat.rows[0]?.id;
    if (!catId) {
      console.error('No active service category');
      process.exit(1);
    }

    await pg.query(
      `insert into public.profiles (id, role, full_name, account_status) values ($1, 'master', $2, 'active')`,
      [masterId, `${tag}_master`],
    );
    await pg.query(
      `insert into public.master_profiles (
         master_id, display_name, publication_status, is_profile_active, primary_category_id
       ) values ($1, $2, 'hidden', false, $3)`,
      [masterId, 'PW Day1 Master', catId],
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

    await pg.query(
      `insert into public.master_locations (
         master_id, visit_type, city, street, building, public_address, is_primary
       ) values ($1, 'studio', 'Минск', 'ул. Тестовая', '1', 'ул. Тестовая, 1', true)`,
      [masterId],
    );

    await pg.query(
      `insert into public.profile_consents (profile_id, document_key, document_version, accepted, source)
       select $1, v.document_key, v.version, true, 'web'
         from public.legal_document_versions v
        where v.is_active = true
          and v.document_key in ('terms', 'privacy', 'personal_data_consent', 'cross_border_consent')
       on conflict (profile_id, document_key, document_version) do nothing`,
      [masterId],
    );

    const token = bearer(masterId, 'master', jwtSecret);
    process.stdout.write(JSON.stringify({ masterId, token, cleanupTag: tag }));
  } finally {
    await pg.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
