import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pollTelegramBrowserLoginPending } from '../api/authApi';
import { useAuth } from '../AuthProvider';
import {
  clearStoredTelegramBrowserPendingId,
  readStoredTelegramBrowserPendingId,
} from '../lib/telegramBrowserHandoff';
import { getPostClientLoginPath } from '../lib/postLoginRedirect';
import { useTelegram } from '../../../shared/hooks/useTelegram';

/** Фоновый poll: браузер получает сессию после входа в Telegram Mini App. */
export function TelegramBrowserLoginPoller() {
  const { applySession, isAuthenticated } = useAuth();
  const { isTelegramWebApp } = useTelegram();
  const navigate = useNavigate();

  useEffect(() => {
    if (isTelegramWebApp || isAuthenticated) return undefined;

    const pendingId = readStoredTelegramBrowserPendingId();
    if (!pendingId) return undefined;

    let cancelled = false;
    let attempts = 0;
    let timer: number | undefined;

    const tick = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const result = await pollTelegramBrowserLoginPending(pendingId);
        if (cancelled) return;
        if (result.status === 'complete') {
          applySession({ token: result.token, profile: result.profile });
          clearStoredTelegramBrowserPendingId();
          const path = getPostClientLoginPath(window.location.search);
          navigate(path, { replace: true });
          return;
        }
      } catch {
        clearStoredTelegramBrowserPendingId();
        return;
      }
      if (attempts >= 120) {
        clearStoredTelegramBrowserPendingId();
        return;
      }
      timer = window.setTimeout(() => void tick(), 2000);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') void tick();
    };

    void tick();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [applySession, isAuthenticated, isTelegramWebApp, navigate]);

  return null;
}
