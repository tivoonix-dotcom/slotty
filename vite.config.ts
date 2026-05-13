import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Tailwind загружает `tailwind.config` через jiti и пишет кэш в `%TEMP%/node-jiti`.
 * На части установок Windows каталог не создаётся → PostCSS ENOENT и 500 на `index.css`.
 */
function ensureJitiTempDir(): Plugin {
  const mkdir = () => {
    try {
      fs.mkdirSync(path.join(os.tmpdir(), 'node-jiti'), { recursive: true });
    } catch {
      /* ignore */
    }
  };

  return {
    name: 'ensure-jiti-temp-dir',
    enforce: 'pre',
    buildStart: mkdir,
    configureServer: mkdir,
  };
}

export default defineConfig({
  plugins: [ensureJitiTempDir(), react()],
});