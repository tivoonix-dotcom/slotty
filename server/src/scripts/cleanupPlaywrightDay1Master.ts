/**
 * Cleanup Playwright day-1 seed by masterId.
 * Usage: cd server && npx tsx src/scripts/cleanupPlaywrightDay1Master.ts <masterId>
 */
import { connectE2ePg, loadE2eEnv } from './e2eDb.js';

async function main() {
  const masterId = process.argv[2]?.trim();
  if (!masterId) {
    console.error('Usage: cleanupPlaywrightDay1Master.ts <masterId>');
    process.exit(1);
  }
  loadE2eEnv();
  const pg = await connectE2ePg();
  try {
    await pg.query(`delete from public.profiles where id = $1`, [masterId]);
  } finally {
    await pg.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
