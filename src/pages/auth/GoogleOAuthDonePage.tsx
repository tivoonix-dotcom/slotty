import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HUB_PATH, LOGIN_PATH } from '../../app/paths';
import { useAuth } from '../../features/auth/AuthProvider';
import { messageForAuthErrorCode } from '../../features/auth/lib/authApiErrors';
import { getPostClientLoginPath } from '../../features/auth/lib/postLoginRedirect';
import { setStoredAuthToken } from '../../shared/api/backendClient';

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
  const { refreshProfile } = useAuth();
  const [message, setMessage] = useState('Завершаем вход…');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    const status = params.get('status');
    const from = params.get('from') ?? undefined;

    if (status === 'linked') {
      setMessage(
        error
          ? messageForAuthErrorCode(error, 'Не удалось привязать Google.')
          : 'Google привязан. Вернитесь в Telegram и обновите «Способы входа».',
      );
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
    void refreshProfile()
      .then(() => {
        setMessage('Вход через Google выполнен.');
        const target = from
          ? getPostClientLoginPath(`?from=${encodeURIComponent(from)}`)
          : getPostClientLoginPath('');
        navigate(target, { replace: true });
      })
      .catch(() => {
        setMessage('Токен получен, но не удалось загрузить профиль. Откройте главную страницу.');
      });
  }, [location.search, navigate, refreshProfile]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-12 text-center">
      <h1 className="text-[22px] font-bold text-[#111827]">Google</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[#6B7280]">{message}</p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          to={HUB_PATH}
          className="rounded-2xl bg-[#111827] px-4 py-3.5 text-[15px] font-semibold text-white no-underline"
        >
          На главную
        </Link>
        <Link to={LOGIN_PATH} className="text-[14px] font-semibold text-[#6B7280] no-underline">
          Страница входа
        </Link>
      </div>
    </main>
  );
}
