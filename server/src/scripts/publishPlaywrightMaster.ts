/**
 * Publish master profile for Playwright fallback (DB-level, mirrors e2eMasterDay1Flow).
 */
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';

async function main() {
  const masterId = process.argv[2]?.trim();
  if (!masterId) {
    console.error('Usage: publishPlaywrightMaster.ts <masterId>');
    process.exit(1);
  }
  loadE2eEnv();
  const pg = await connectE2ePg();
  try {
    await pg.query(
      `update public.master_profiles
         set publication_status = 'published', is_profile_active = true
       where master_id = $1`,
      [masterId],
    );
  } finally {
    await pg.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
