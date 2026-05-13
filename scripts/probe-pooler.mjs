/**
 * Finds working Supabase pooler endpoint (IPv4). Run:
 *   $env:SUPABASE_DB_PASSWORD='...'; node scripts/probe-pooler.mjs
 */
import pg from 'pg';

const pw = process.env.SUPABASE_DB_PASSWORD;
const ref = process.env.SUPABASE_PROJECT_REF ?? 'gspnsnzdchuigbbdteqz';
if (!pw) {
  console.error('Set SUPABASE_DB_PASSWORD');
  process.exit(1);
}

const regions = [
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'eu-central-2',
  'eu-north-1',
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'ca-central-1',
  'ap-south-1',
  'ap-south-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'sa-east-1',
  'me-central-1',
  'af-south-1',
];

const prefixes = ['aws-0', 'aws-1'];
const ports = [5432, 6543];
const users = [`postgres.${ref}`, 'postgres'];

async function tryOne(host, port, user) {
  const c = new pg.Client({
    host,
    port,
    user,
    password: pw,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 6000,
  });
  try {
    await c.connect();
    await c.query('select 1');
    return true;
  } catch (e) {
    return String(e?.message ?? e);
  } finally {
    await c.end().catch(() => {});
  }
}

for (const p of prefixes) {
  for (const r of regions) {
    const host = `${p}-${r}.pooler.supabase.com`;
    for (const port of ports) {
      for (const user of users) {
        const res = await tryOne(host, port, user);
        if (res === true) {
          console.log(`OK host=${host} port=${port} user=${user}`);
          process.exit(0);
        }
        if (!String(res).includes('Tenant or user not found')) {
          console.log(`-- ${host}:${port} user=${user} => ${res}`);
        }
      }
    }
  }
}

console.error('No pooler match. Set SUPABASE_POOLER_HOST / PORT / USER from Dashboard → Connect → Session pooler.');
process.exit(1);
