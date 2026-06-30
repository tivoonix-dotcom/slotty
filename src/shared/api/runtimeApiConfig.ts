/** Runtime API URL с slotty-web (Railway env без пересборки фронта). */
let runtimeApiUrl: string | undefined;
let initPromise: Promise<void> | null = null;

function normalizeOrigin(raw: string | undefined | null): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/$/, '');
}

export async function initRuntimeApiConfig(): Promise<void> {
  if (normalizeOrigin(import.meta.env.VITE_API_URL)) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const res = await fetch('/slotty-runtime-config.json', { cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as { apiUrl?: string | null };
      runtimeApiUrl = normalizeOrigin(data.apiUrl ?? undefined);
    } catch {
      /* offline / local preview */
    }
  })();

  return initPromise;
}

export function getRuntimeApiBaseUrl(): string | undefined {
  return runtimeApiUrl;
}
