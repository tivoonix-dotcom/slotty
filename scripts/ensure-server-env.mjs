import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEnv = path.join(root, 'server', '.env');
const example = path.join(root, 'server', '.env.example');

if (!fs.existsSync(serverEnv)) {
  if (fs.existsSync(example)) {
    fs.copyFileSync(example, serverEnv);
    console.log('[dev] Создан server/.env из server/.env.example — заполните DATABASE_URL и ключи.');
  } else {
    console.warn('[dev] Нет server/.env — создайте файл по образцу server/.env.example');
  }
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

const server = readEnvFile(serverEnv);
const rootEnv = readEnvFile(path.join(root, '.env'));

const missing = [];
const databaseUrl = server.DATABASE_URL || rootEnv.DATABASE_URL || process.env.DATABASE_URL;
const jwtSecret = server.JWT_SECRET || rootEnv.JWT_SECRET || process.env.JWT_SECRET;
if (!databaseUrl) missing.push('DATABASE_URL');
if (!jwtSecret || jwtSecret.length < 16) missing.push('JWT_SECRET (≥16 символов)');

if (missing.length > 0) {
  console.warn(
    `[dev] server/.env: не задано — ${missing.join(', ')}. API не запустится, пока не укажете (Supabase → Database → connection string).`,
  );
}

if (!rootEnv.VITE_API_URL) {
  console.warn('[dev] В корневом .env добавьте: VITE_API_URL=http://localhost:4000');
}
