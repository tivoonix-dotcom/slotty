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
  build: {
    target: 'es2020',
    cssMinify: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'router';
          if (id.includes('@tanstack/react-query')) return 'query';
          if (id.includes('@sentry')) return 'sentry';
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react';
          if (id.includes('docx')) return 'docx';
          return 'vendor';
        },
      },
    },
  },
});
