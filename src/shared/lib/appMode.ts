import { getApiBaseUrl } from '../api/backendClient';

/** True when demo/localStorage flows are allowed (local dev only). */
export function isDevDemoAllowed(): boolean {
  return !import.meta.env.PROD;
}

/** Production build without API URL — misconfiguration, not demo. */
export function isProductionApiMisconfigured(): boolean {
  return import.meta.env.PROD && !getApiBaseUrl();
}
