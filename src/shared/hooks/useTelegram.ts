import { useEffect, useMemo, useState } from 'react';
import {
  init,
  initDataRaw,
  initDataStartParam,
  expandViewport,
  isConcurrentCallError,
  isLaunchParamsRetrieveError,
  isUnknownEnvError,
  miniAppReady,
  mountMiniAppSync,
  mountViewport,
  retrieveLaunchParams,
} from '@telegram-apps/sdk';
import { ensureDevTelegramMock, resetDevTelegramMockState } from '../lib/devTelegramMock';
import {
  getTelegramWebAppInitDataRaw,
  readTelegramWebAppUserPreview,
  type TelegramUserPreview,
} from '../lib/telegramWebApp';

/** Один раз за сессию: mountMiniAppSync / mountViewport нельзя вызывать из каждого useTelegram (ConcurrentCallError). */
let telegramShellMounted = false;

function tryMountTelegramShell(): void {
  if (telegramShellMounted) {
    try {
      if (expandViewport.isAvailable()) expandViewport();
    } catch {
      /* ignore */
    }
    return;
  }

  telegramShellMounted = true;

  try {
    if (mountMiniAppSync.isAvailable()) {
      mountMiniAppSync();
    }
  } catch (e) {
    if (!isConcurrentCallError(e)) {
      console.warn('[SLOTTY] mountMiniAppSync:', e);
    }
  }

  try {
    if (mountViewport.isAvailable()) {
      void mountViewport().catch((e: unknown) => {
        if (isConcurrentCallError(e)) return;
        console.warn('[SLOTTY] mountViewport:', e);
      });
    }
  } catch (e) {
    if (!isConcurrentCallError(e)) {
      console.warn('[SLOTTY] mountViewport:', e);
    }
  }

  try {
    if (expandViewport.isAvailable()) {
      expandViewport();
    }
    if (miniAppReady.isAvailable()) {
      miniAppReady();
    }
  } catch (e) {
    if (!isConcurrentCallError(e)) {
      console.warn('[SLOTTY] expandViewport / miniAppReady:', e);
    }
  }
}

function readStartParamFromInitDataObject(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const o = data as Record<string, string | undefined>;
  return o.start_param ?? o.startParam;
}

function readLaunchParamsSafe() {
  try {
    return retrieveLaunchParams(true);
  } catch (e) {
    if (isLaunchParamsRetrieveError(e)) return undefined;
    return undefined;
  }
}

function readMasterFromQuery(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return new URLSearchParams(window.location.search).get('master_id') ?? undefined;
}

function readTelegramUserPhotoFromInitDataRaw(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  try {
    const userJson = new URLSearchParams(raw.trim()).get('user');
    if (!userJson) return undefined;
    const user = JSON.parse(userJson) as { photo_url?: string };
    const p = user.photo_url?.trim();
    return p || undefined;
  } catch {
    return undefined;
  }
}

export interface UseTelegramResult {
  /** SDK init() отработал, мини-приложение развёрнуто по возможности */
  isReady: boolean;
  /** Строка initData для проверки подписи на бэкенде */
  initDataRaw: string | undefined;
  /** Идентификатор мастера из start_param / tgWebAppStartParam */
  masterId: string | undefined;
  /** Есть ли валидный контекст Mini App (initData) */
  isTelegramWebApp: boolean;
  /** URL фото пользователя из initData (если Telegram передал). */
  telegramUserPhotoUrl: string | undefined;
  /** Имя / username из Mini App до ответа бэка (initDataUnsafe / initData). */
  telegramUserPreview: TelegramUserPreview | null;
}

function tryInit(): VoidFunction | undefined {
  ensureDevTelegramMock();
  try {
    return init();
  } catch (e) {
    if (isUnknownEnvError(e)) {
      resetDevTelegramMockState();
      ensureDevTelegramMock();
      try {
        return init();
      } catch (e2) {
        console.warn('[SLOTTY] Telegram SDK init skipped (browser):', e2);
        return undefined;
      }
    }
    console.warn('[SLOTTY] Telegram SDK init:', e);
    return undefined;
  }
}

export function useTelegram(): UseTelegramResult {
  const [isReady, setIsReady] = useState(false);
  /** После первого кадра перечитываем WebApp — initData иногда появляется чуть позже. */
  const [classicRefresh, setClassicRefresh] = useState(0);

  useEffect(() => {
    const dispose = tryInit();

    tryMountTelegramShell();

    try {
      const w = (window as unknown as { Telegram?: { WebApp?: { ready?: () => void } } }).Telegram?.WebApp;
      w?.ready?.();
    } catch {
      /* ignore */
    }

    setIsReady(true);
    const raf = requestAnimationFrame(() => {
      setClassicRefresh((n) => n + 1);
    });
    return () => {
      cancelAnimationFrame(raf);
      dispose?.();
      resetDevTelegramMockState();
    };
  }, []);

  const launch = useMemo(() => readLaunchParamsSafe(), []);

  const initDataRawValue = useMemo(() => {
    if (!isReady) return undefined;
    try {
      const fromSdk = initDataRaw()?.trim();
      if (fromSdk) return fromSdk;
    } catch {
      /* fall through to classic WebApp */
    }
    return getTelegramWebAppInitDataRaw();
  }, [isReady, classicRefresh]);

  const telegramUserPreview = useMemo(() => {
    if (!isReady) return null;
    return readTelegramWebAppUserPreview();
  }, [isReady, classicRefresh]);

  const telegramUserPhotoUrl = useMemo(() => {
    if (!isReady) return undefined;
    try {
      const fromRaw = readTelegramUserPhotoFromInitDataRaw(initDataRawValue);
      if (fromRaw) return fromRaw;
    } catch {
      /* ignore */
    }
    const p = telegramUserPreview?.photoUrl?.trim();
    return p || undefined;
  }, [isReady, initDataRawValue, telegramUserPreview]);

  const startFromSignal = useMemo(() => {
    if (!isReady) return undefined;
    try {
      return initDataStartParam() || undefined;
    } catch {
      return undefined;
    }
  }, [isReady]);

  const masterId = useMemo(() => {
    const fromInit = startFromSignal;
    const fromLaunch = launch?.tgWebAppStartParam;
    const fromInitDataBlock = readStartParamFromInitDataObject(launch?.tgWebAppData);
    return fromInit ?? fromLaunch ?? fromInitDataBlock ?? readMasterFromQuery();
  }, [launch, startFromSignal]);

  return {
    isReady,
    initDataRaw: initDataRawValue,
    masterId,
    isTelegramWebApp: Boolean(initDataRawValue || telegramUserPreview),
    telegramUserPhotoUrl,
    telegramUserPreview,
  };
}
