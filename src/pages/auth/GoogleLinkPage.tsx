import { useCallback, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MASTER_SETTINGS_SECURITY_PATH, HUB_PATH, LOGIN_PATH } from '../../app/paths';
import { linkGoogle } from '../../features/auth/api/authApi';
import { GoogleSignInButton } from '../../features/auth/components/GoogleSignInButton';
import { useAuth } from '../../features/auth/AuthProvider';
import { ReturnToTelegramButton } from '../../features/auth/components/ReturnToTelegramButton';
import { GoogleIcon } from '../../shared/ui/GoogleIcon';

/** Привязка Google в обычном браузере (fallback, если OAuth redirect на API не настроен). */
export function GoogleLinkPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handoffToken = searchParams.get('handoff')?.trim() || undefined;
  const { isAuthenticated, isLoading, refreshProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onCredential = useCallback(
    async (idToken: string) => {
      setError(null);
      try {
        await linkGoogle(idToken, handoffToken);
        if (!handoffToken) await refreshProfile();
        setDone(true);
        if (!handoffToken) {
          setTimeout(() => navigate(MASTER_SETTINGS_SECURITY_PATH, { replace: true }), 1200);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось привязать Google');
      }
    },
    [handoffToken, navigate, refreshProfile],
  );

  if (!isLoading && !isAuthenticated && !handoffToken) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10 text-center">
        <h1 className="text-[22px] font-bold text-[#111827]">Привязать Google</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-[#6B7280]">
          Откройте «Способы входа» в Telegram (вы должны быть уже в кабинете) и нажмите «Подключить Google» там —
          откроется эта страница с одноразовой ссылкой.
        </p>
        <Link
          to={LOGIN_PATH}
          className="mt-8 inline-block rounded-2xl bg-[#111827] px-4 py-3.5 text-[15px] font-semibold text-white no-underline"
        >
          Страница входа
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <Link to={HUB_PATH} className="mb-6 text-[14px] font-semibold text-[#6B7280]">
        ← На главную
      </Link>
      <div className="rounded-[24px] bg-white p-6 shadow-[0_12px_40px_rgba(17,24,39,0.08)] ring-1 ring-[#F3F4F6]">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1F4] text-[#F47C8C]">
          <GoogleIcon size={28} />
        </div>
        <h1 className="text-[22px] font-bold tracking-[-0.04em] text-[#111827]">Привязать Google</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
          Войдите через Google в браузере. После успеха вернитесь в Telegram и обновите «Способы входа».
        </p>

        {done ? (
          <div className="mt-6 space-y-3">
            <p className="rounded-2xl bg-[#F0FDF4] px-4 py-3 text-[14px] font-semibold text-[#166534]">
              {handoffToken
                ? 'Google привязан к вашему кабинету. Откройте Telegram и нажмите «Обновить» в «Способы входа».'
                : 'Google привязан. Перенаправляем…'}
            </p>
            {handoffToken ? (
              <ReturnToTelegramButton className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#111827] text-[15px] font-semibold text-white" />
            ) : null}
          </div>
        ) : (
          <div className="relative mt-6 min-h-[52px] w-full">
            <div className="pointer-events-none flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#F47C8C] text-[15px] font-semibold text-white">
              <GoogleIcon size={20} className="brightness-0 invert" />
              Войти через Google
            </div>
            <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-[0.011]">
              <GoogleSignInButton
                buttonWidth="full"
                className="h-full w-full"
                text="continue_with"
                onCredential={(t) => void onCredential(t)}
                onError={(m) => setError(m)}
              />
            </div>
          </div>
        )}

        {error ? (
          <p className="mt-4 rounded-2xl bg-[#FFF0F0] px-4 py-3 text-[13px] font-medium text-[#9B2C2C]">{error}</p>
        ) : null}
      </div>
    </main>
  );
}
