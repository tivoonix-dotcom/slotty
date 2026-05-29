import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HUB_PATH, LOGIN_PATH } from '../../app/paths';
import { ReturnToTelegramButton } from '../../features/auth/components/ReturnToTelegramButton';
import { useAuth } from '../../features/auth/AuthProvider';
import { messageForAuthErrorCode } from '../../features/auth/lib/authApiErrors';
import { getPostOAuthLoginPath } from '../../features/auth/lib/postLoginRedirect';
import { normalizeBackendProfile } from '../../features/auth/types';
import { sessionRefreshToken, type BackendProfile } from '../../features/auth/types';
import { apiFetch, setStoredAuthToken } from '../../shared/api/backendClient';

function readTokenFromLocation(): string | null {
  const hash = window.location.hash.replace(/^#/, '');
  const fromHash = new URLSearchParams(hash).get('token')?.trim();
  if (fromHash) return fromHash;

  const fromQuery = new URLSearchParams(window.location.search).get('token')?.trim();
  return fromQuery || null;
}

export function GoogleOAuthDonePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshProfile, openConsentBlock } = useAuth();
  const [message, setMessage] = useState('Завершаем вход…');
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const status = params.get('status');
    const from = params.get('from') ?? undefined;
    const pending = params.get('pending')?.trim();
    const isNewUser = params.get('isNewUser') === '1';

    if (status === 'linked') {
      setLinked(!error);
      setMessage(
        error
          ? messageForAuthErrorCode(error, 'Не удалось привязать Google.')
          : 'Google привязан. Вернитесь в Telegram и нажмите «Обновить» в «Способы входа».',
      );
      return;
    }

    if (error === 'CONSENT_REQUIRED' && pending) {
      openConsentBlock({
        action: { type: 'google_pending', pendingToken: pending },
        isNewUser,
      });
      setMessage('Примите документы, чтобы завершить вход через Google.');
      return;
    }

    if (error) {
      setMessage(messageForAuthErrorCode(error, 'Не удалось войти через Google.'));
      return;
    }

    const token = readTokenFromLocation();
    if (!token) {
      setMessage('Вход не завершён. Попробуйте снова.');
      return;
    }

    setStoredAuthToken(token);
    void (async () => {
      let meProfile: BackendProfile | null = null;
      try {
        const res = await apiFetch('/api/me');
        if (res.ok) {
          const me = (await res.json()) as BackendProfile;
          const refreshed = sessionRefreshToken(me);
          if (refreshed) setStoredAuthToken(refreshed);
          meProfile = normalizeBackendProfile(me);
        }
        await refreshProfile();
        setMessage('Вход через Google выполнен.');
        const search = from ? `?from=${encodeURIComponent(from)}` : '';
        navigate(getPostOAuthLoginPath(meProfile, search), { replace: true });
      } catch {
        setMessage('Токен получен, но не удалось загрузить профиль. Откройте главную страницу.');
      }
    })()
  }, [location.search, navigate, openConsentBlock, refreshProfile]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12 text-center">
      <h1 className="text-[22px] font-bold text-[#111827]">Google</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[#6B7280]">{message}</p>
      <div className="mt-8 flex flex-col gap-3">
        {linked ? (
          <ReturnToTelegramButton className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#111827] text-[15px] font-semibold text-white" />
        ) : null}
        <Link
          to={HUB_PATH}
          className="rounded-2xl bg-[#F7F7F8] px-4 py-3.5 text-[15px] font-semibold text-[#111827] no-underline ring-1 ring-[#EAECEF]"
        >
          На главную
        </Link>
        {!linked ? (
          <Link to={LOGIN_PATH} className="text-[14px] font-semibold text-[#6B7280] no-underline">
            Страница входа
          </Link>
        ) : null}
      </div>
    </main>
  );
}
