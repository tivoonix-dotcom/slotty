/**
 * SLOTTY — применение миграций supabase/migrations_v2 (только NNN_*.sql).
 *
 * Режимы:
 *   node scripts/apply-migrations-v2.mjs              — только новые (не в schema_migrations_v2)
 *   node scripts/apply-migrations-v2.mjs --baseline — пометить 000–013 как applied без SQL 001–013
 *   node scripts/apply-migrations-v2.mjs --status   — applied / pending / ignored
 *   node scripts/apply-migrations-v2.mjs --smoke    — smoke_test_v2.sql (не пишется в журнал)
 *
 * Пароль: SUPABASE_DB_PASSWORD, .env, или первая строка dbpass.txt (не логируется).
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const MIGRATIONS_DIR = path.join(root, 'supabase', 'migrations_v2');
const MIGRATION_FILE_RE = /^(\d{3})_.*\.sql$/;
const IGNORED_NAMES = new Set(['apply_all_v2.sql', 'smoke_test_v2.sql']);

function loadDotEnv() {
  const p = path.join(root, '.env');
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function resolveDbPassword() {
  const fromEnv = process.env.SUPABASE_DB_PASSWORD;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim();
  }
  const fp = path.join(root, 'dbpass.txt');
  if (fs.existsSync(fp)) {
    const line = fs.readFileSync(fp, 'utf8').split(/\r?\n/)[0]?.trim();
    if (line) return line;
  }
  return null;
}

function sha256Hex(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function listMigrationSqlFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => MIGRATION_FILE_RE.test(f) && !IGNORED_NAMES.has(f))
    .sort();
}

function listIgnoredFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  const all = fs.readdirSync(MIGRATIONS_DIR);
  const migrationSet = new Set(listMigrationSqlFiles());
  return all.filter((f) => !migrationSet.has(f) && f !== '.' && f !== '..');
}

function parseArgs(argv) {
  const baseline = argv.includes('--baseline');
  const status = argv.includes('--status');
  const smoke = argv.includes('--smoke');
  return { baseline, status, smoke };
}

loadDotEnv();

const pw = resolveDbPassword();
if (!pw) {
  console.error(
    'Задайте пароль БД: SUPABASE_DB_PASSWORD, строка в .env, или первая строка в dbpass.txt.',
  );
  process.exit(1);
}

const projectRef = process.env.SUPABASE_PROJECT_REF ?? 'gspnsnzdchuigbbdteqz';

const POOLER_REGIONS = [
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
      console.error(`Подключено к хосту pooler (регион пробуется автоматически).`);
      return c;
    } catch (e) {
      const msg = String(e?.message ?? e?.toString?.() ?? e);
      lastErr = e;
      if (/tenant or user not found/i.test(msg)) {
        continue;
      }
      if (/password authentication failed/i.test(msg)) {
        throw new Error('Ошибка аутентификации к БД (проверьте пароль).', { cause: e });
      }
      console.error(`Пропуск региона pooler: ${msg}`);
    }
  }

  throw new Error(
    `Не удалось подключиться к pooler для проекта. Задайте SUPABASE_POOLER_REGION или SUPABASE_DB_HOST.`,
    { cause: lastErr },
  );
}

/** @param {pg.Client} client */
async function migrationsTableExists(client) {
  const r = await client.query(
    `select 1 from information_schema.tables
     where table_schema = 'public' and table_name = 'schema_migrations_v2' limit 1`,
  );
  return r.rowCount > 0;
}

/** @param {pg.Client} client */
async function ensureMigrationsTableFromFile(client) {
  const fp = path.join(MIGRATIONS_DIR, '000_migration_history.sql');
  if (!fs.existsSync(fp)) {
    throw new Error(`Отсутствует файл ${fp}`);
  }
  const sql = fs.readFileSync(fp, 'utf8');
  await client.query(sql);
}

/** @param {pg.Client} client */
async function getAppliedFilenames(client) {
  const r = await client.query(
    `select filename from public.schema_migrations_v2 order by filename asc`,
  );
  return new Set(r.rows.map((row) => row.filename));
}

/** @param {pg.Client} client @param {string} filename @param {string|null} checksum */
async function insertMigrationRow(client, filename, checksum) {
  await client.query(
    `insert into public.schema_migrations_v2 (filename, checksum) values ($1, $2)`,
    [filename, checksum],
  );
}

/** @param {pg.Client} client */
async function runSmoke(client) {
  const fp = path.join(MIGRATIONS_DIR, 'smoke_test_v2.sql');
  if (!fs.existsSync(fp)) {
    console.error('smoke_test_v2.sql не найден — пропуск.');
    return;
  }
  const sql = fs.readFileSync(fp, 'utf8');
  await client.query(sql);
  console.log('Smoke test: OK');
}

/** @param {pg.Client} client */
async function cmdStatus(client) {
  const exists = await migrationsTableExists(client);
  const allFiles = listMigrationSqlFiles();
  const ignored = listIgnoredFiles();

  if (!exists) {
    console.log('Таблица schema_migrations_v2: отсутствует (выполните db:v2:baseline или первую миграцию 000).');
    console.log('Pending (все нумерованные .sql):', allFiles.join(', ') || '(нет)');
    console.log('Ignored:', ignored.join(', ') || '(нет)');
    return;
  }

  const applied = await client.query(
    `select filename, applied_at, checksum is not null as has_checksum
     from public.schema_migrations_v2 order by filename asc`,
  );
  const appliedSet = new Set(applied.rows.map((r) => r.filename));
  const pending = allFiles.filter((f) => !appliedSet.has(f));

  console.log('--- Applied ---');
  for (const row of applied.rows) {
    console.log(`  ${row.filename}  applied_at=${row.applied_at.toISOString()}  checksum=${row.has_checksum ? 'yes' : 'no'}`);
  }
  console.log('--- Pending ---');
  console.log(pending.length ? pending.map((f) => `  ${f}`).join('\n') : '  (нет)');
  console.log('--- Ignored (не нумерованные NNN_*.sql или служебные) ---');
  console.log(ignored.length ? ignored.map((f) => `  ${f}`).join('\n') : '  (нет)');
}

/** @param {pg.Client} client */
async function cmdBaseline(client) {
  await ensureMigrationsTableFromFile(client);

  const allNumbered = listMigrationSqlFiles();
  const toMark = allNumbered.filter((f) => {
    const n = Number.parseInt(f.slice(0, 3), 10);
    return n >= 1 && n <= 13;
  });

  const marked = [];
  for (const filename of toMark) {
    const fp = path.join(MIGRATIONS_DIR, filename);
    let checksum = null;
    if (fs.existsSync(fp)) {
      checksum = sha256Hex(fs.readFileSync(fp, 'utf8'));
    }
    const ins = await client.query(
      `insert into public.schema_migrations_v2 (filename, checksum)
       values ($1, $2)
       on conflict (filename) do nothing
       returning filename`,
      [filename, checksum],
    );
    if (ins.rowCount > 0) {
      marked.push(filename);
    }
  }

  console.log('Baseline: таблица журнала готова (000 выполнен как SQL, если таблицы не было).');
  console.log('Помечены как applied только 001–013 (без apply_all / smoke):');
  console.log(marked.length ? marked.join(', ') : '(новых строк не добавлено — записи уже были)');
}

/** @param {pg.Client} client */
async function cmdMigrate(client) {
  if (!(await migrationsTableExists(client))) {
    await ensureMigrationsTableFromFile(client);
    const zero = '000_migration_history.sql';
    if (fs.existsSync(path.join(MIGRATIONS_DIR, zero))) {
      const content = fs.readFileSync(path.join(MIGRATIONS_DIR, zero), 'utf8');
      const sum = sha256Hex(content);
      await insertMigrationRow(client, zero, sum);
      console.error(`Зарегистрирован журнал: ${zero}`);
    }
  }

  const applied = await getAppliedFilenames(client);
  const files = listMigrationSqlFiles();

  let appliedAny = false;
  for (const name of files) {
    if (applied.has(name)) {
      continue;
    }
    const fp = path.join(MIGRATIONS_DIR, name);
    const sql = fs.readFileSync(fp, 'utf8');
    const checksum = sha256Hex(sql);
    console.error(`→ ${name} …`);
    await client.query(sql);
    await insertMigrationRow(client, name, checksum);
    console.error('   OK');
    appliedAny = true;
  }

  console.log(
    appliedAny
      ? 'Миграции v2: новые файлы применены.'
      : 'Миграции v2: новых файлов нет (все нумерованные миграции уже в журнале).',
  );
}

async function main() {
  const { baseline, status, smoke } = parseArgs(process.argv.slice(2));

  let client;
  try {
    client = await resolveClient();

    if (smoke) {
      await runSmoke(client);
      return;
    }

    if (status) {
      await cmdStatus(client);
      return;
    }

    if (baseline) {
      await cmdBaseline(client);
      return;
    }

    await cmdMigrate(client);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    if (client) await client.end().catch(() => {});
  }
}

await main();
