import type { AnalyticsEventName, AnalyticsEventPayload } from './analyticsEvents';
import { sanitizeAnalyticsPayload } from './analyticsSanitize';

type AnalyticsConfig = {
  yandexMetrikaId: string | null;
  gaMeasurementId: string | null;
  gtmContainerId: string | null;
};

let config: AnalyticsConfig = {
  yandexMetrikaId: null,
  gaMeasurementId: null,
  gtmContainerId: null,
};

let initialized = false;

function readEnvId(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function readAnalyticsConfig(): AnalyticsConfig {
  return {
    yandexMetrikaId: readEnvId(import.meta.env.VITE_YANDEX_METRIKA_ID),
    gaMeasurementId: readEnvId(import.meta.env.VITE_GA_MEASUREMENT_ID),
    gtmContainerId: readEnvId(import.meta.env.VITE_GTM_CONTAINER_ID),
  };
}

function hasAnyProvider(cfg: AnalyticsConfig): boolean {
  return Boolean(cfg.yandexMetrikaId || cfg.gaMeasurementId || cfg.gtmContainerId);
}

function injectScript(id: string, src: string): void {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

type YandexMetrikaFn = ((id: number, method: string, ...args: unknown[]) => void) & {
  a?: unknown[][];
  l?: number;
};

function initYandexMetrika(counterId: string): void {
  const w = window as Window & { ym?: YandexMetrikaFn };
  if (!w.ym) {
    const stub: YandexMetrikaFn = (...args: unknown[]) => {
      stub.a = stub.a || [];
      stub.a.push(args);
    };
    stub.a = [];
    stub.l = Date.now();
    w.ym = stub;
    injectScript('slotty-yandex-metrika', 'https://mc.yandex.ru/metrika/tag.js');
  }
  w.ym(Number(counterId), 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false,
  });
}

function initGoogleAnalytics(measurementId: string): void {
  const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    w.gtag = function gtag(...args: unknown[]) {
      w.dataLayer!.push(args);
    };
    injectScript('slotty-gtag-loader', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`);
    w.gtag('js', new Date());
    w.gtag('config', measurementId, { send_page_view: false });
  }
}

function initGtm(containerId: string): void {
  const w = window as Window & { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  injectScript('slotty-gtm-loader', `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`);
}

/** Подключает провайдеров только при заданных env ID. Без env — no-op. */
export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  config = readAnalyticsConfig();
  if (!hasAnyProvider(config)) return;

  try {
    if (config.gtmContainerId) initGtm(config.gtmContainerId);
    if (config.gaMeasurementId) initGoogleAnalytics(config.gaMeasurementId);
    if (config.yandexMetrikaId) initYandexMetrika(config.yandexMetrikaId);
  } catch {
    /* analytics must never break the app */
  }
}

function sendToYandex(name: AnalyticsEventName, payload?: AnalyticsEventPayload): void {
  const counterId = config.yandexMetrikaId;
  if (!counterId) return;
  const w = window as Window & { ym?: (id: number, method: string, ...args: unknown[]) => void };
  if (!w.ym) return;
  w.ym(Number(counterId), 'reachGoal', name, payload ?? {});
}

function sendToGa(name: AnalyticsEventName, payload?: AnalyticsEventPayload): void {
  const measurementId = config.gaMeasurementId;
  if (!measurementId) return;
  const w = window as Window & { gtag?: (...args: unknown[]) => void };
  if (!w.gtag) return;
  w.gtag('event', name, payload ?? {});
}

function sendToGtm(name: AnalyticsEventName, payload?: AnalyticsEventPayload): void {
  const containerId = config.gtmContainerId;
  if (!containerId) return;
  const w = window as Window & { dataLayer?: unknown[] };
  if (!w.dataLayer) return;
  w.dataLayer.push({ event: name, ...payload });
}

/** Отправка события во все активные провайдеры. */
export function dispatchAnalyticsEvent(name: AnalyticsEventName, payload?: AnalyticsEventPayload): void {
  if (!initialized) initAnalytics();
  if (!hasAnyProvider(config)) return;

  const safe = sanitizeAnalyticsPayload(payload);
  try {
    sendToYandex(name, safe);
    sendToGa(name, safe);
    sendToGtm(name, safe);
  } catch {
    /* ignore provider errors */
  }
}
