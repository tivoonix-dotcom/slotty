/**
 * Applies supabase/schema.sql to the remote database (legacy v1).
 * Для схемы v2 используйте: npm run db:v2:baseline | db:v2:migrate | db:v2:status
 *
 * PowerShell:
 *   $env:SUPABASE_DB_PASSWORD='...'
 *   node scripts/apply-schema.mjs
 *
 * Optional: $env:SUPABASE_POOLER_REGION='eu-west-1' (skip auto-detect)
 * Optional: $env:SUPABASE_DB_HOST='db.xxx.supabase.co' (direct; may fail on some Windows DNS setups)
 *
 * Do not commit passwords or dbpass.txt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const pw = process.env.SUPABASE_DB_PASSWORD;
if (!pw || typeof pw !== 'string') {
  console.error('Set SUPABASE_DB_PASSWORD to your Supabase database password (string).');
  process.exit(1);
}

const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'gspnsnzdchuigbbdteqz';

const POOLER_REGIONS = [
  // Порядок: сначала регион, найденный для этого проекта (Session pooler, IPv4).
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'eu-central-2',
  'eu-north-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'sa-east-1',
];

/** @returns {Promise<pg.Client>} */
async function connectWithConfig(config) {
  const c = new pg.Client({
    ...config,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12_000,
  });
  await c.connect();
  await c.query('select 1');
  return c;
}

/** @returns {Promise<pg.Client>} */
async function resolveClient() {
  const explicitHost = process.env.SUPABASE_DB_HOST;
  if (explicitHost) {
    return connectWithConfig({
      host: explicitHost,
      port: Number(process.env.SUPABASE_DB_PORT ?? 5432),
      user: process.env.SUPABASE_DB_USER ?? 'postgres',
      password: pw,
      database: process.env.SUPABASE_DB_NAME ?? 'postgres',
    });
  }

  const fixedRegion = process.env.SUPABASE_POOLER_REGION;
  const regions = fixedRegion ? [fixedRegion] : POOLER_REGIONS;
  const user = `postgres.${projectRef}`;
  let lastErr = null;

  for (const region of regions) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    try {
      const c = await connectWithConfig({
        host,
        port: 5432,
        user,
        password: pw,
        database: 'postgres',
      });
      console.error(`Connected via session pooler: ${host}`);
      return c;
    } catch (e) {
      const msg = String(e?.message ?? e?.toString?.() ?? e);
      lastErr = e;
      if (/tenant or user not found/i.test(msg)) {
        continue;
      }
      if (/password authentication failed/i.test(msg)) {
        throw new Error(`Authentication failed at ${host}. Check database password.`, { cause: e });
      }
      console.error(`Skip ${host}: ${msg}`);
    }
  }

  throw new Error(
    `Could not find pooler region for project ${projectRef}. Set SUPABASE_POOLER_REGION (see Supabase Dashboard → Settings → Database → Region) or SUPABASE_DB_HOST.`,
    { cause: lastErr },
  );
}

const sqlPath = path.join(root, 'supabase', 'schema.sql');
let client;

try {
  client = await resolveClient();
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await client.query(sql);
  console.log('Schema applied successfully.');
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  if (client) await client.end().catch(() => {});
}
