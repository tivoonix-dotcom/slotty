import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../../../shared/api/backendClient';

export type PublicAppConfig = {
  telegramBotUsername?: string;
  googleOAuthConfigured?: boolean;
  googleOAuthMissing?: string[];
  emailDeliveryConfigured?: boolean;
  telegramBotConfigured?: boolean;
};

export function usePublicAppConfig(): PublicAppConfig {
  const [config, setConfig] = useState<PublicAppConfig>({});

  useEffect(() => {
    const base = getApiBaseUrl();
    if (!base) return;

    let cancelled = false;
    void fetch(`${base}/api/public/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PublicAppConfig | null) => {
        if (!cancelled && data) setConfig(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
