import { useCallback } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LEGAL_PD_CONSENT_PATH, LEGAL_PRIVACY_PATH, LEGAL_TERMS_PATH } from '../../app/paths';
import { useAuth } from '../../features/auth/AuthProvider';
import { LoginAccountHint } from '../../features/auth/components/LoginAccountHint';
import { LoginMethodsPanel } from '../../features/auth/components/LoginMethodsPanel';
import { getPostClientLoginPath } from '../../features/auth/lib/postLoginRedirect';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { LoadingScreen } from '../../shared/ui/LoadingVideo';

const LOGIN_PREVIEW = '/photos/login/left.png';

/** Общие отступы и ширина текстового блока — левая и правая колонки совпадают. */
const COL_PAD = 'px-6 py-10 sm:px-10 lg:px-12 lg:py-14 xl:px-16 xl:py-[3.75rem]';
const COL_BODY = 'w-full max-w-[28rem]';
const TITLE_CLASS = 'text-[2rem] font-bold leading-[1.1] tracking-[-0.04em] text-[#111827] xl:text-[2.125rem]';
const SUBTITLE_CLASS = 'mt-2 text-[15px] leading-relaxed text-[#6B7280]';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  const afterLoginPath = getPostClientLoginPath(location.search);

  const onLinked = useCallback(() => {
    navigate(afterLoginPath, { replace: true });
  }, [navigate, afterLoginPath]);

  if (isLoading) {
    return <LoadingScreen className="bg-white" />;
  }

  if (isAuthenticated) {
    return <Navigate to={afterLoginPath} replace />;
  }

  return (
    <main className="min-h-dvh bg-white text-[#111827]">
      <div className="grid min-h-dvh lg:grid-cols-2">
        <section className="relative hidden min-h-dvh flex-col overflow-hidden bg-[#FFF1F4] lg:flex">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(244,124,140,0.35),transparent_45%),radial-gradient(circle_at_85%_75%,rgba(255,182,198,0.55),transparent_50%)]"
            aria-hidden
          />

          <div className={`relative flex w-full flex-1 flex-col items-center ${COL_PAD}`}>
            <div className={`${COL_BODY} flex w-full flex-col gap-8`}>
              <div className="min-h-[8.5rem] shrink-0">
                <h1 className={TITLE_CLASS}>Вы мастер?</h1>
                <p className={`${SUBTITLE_CLASS} font-semibold text-[#111827]`}>
                  Принимайте записи без переписок
                </p>
                <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">
                  Создайте профиль, добавьте услуги, настройте график и получайте заявки от клиентов в
                  одном кабинете.
                </p>
              </div>

              <div className="h-[min(42vh,26rem)] w-full shrink-0 overflow-hidden rounded-[20px]">
                <ImageReveal
                  src={LOGIN_PREVIEW}
                  alt=""
                  loading="eager"
                  fetchPriority="high"
                  draggable={false}
                  className="block h-full w-full scale-[1.06] object-cover object-[50%_top]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className={`flex min-h-dvh flex-col items-center ${COL_PAD}`}>
          <div className={COL_BODY}>
            <h1 className={TITLE_CLASS}>Войти</h1>
            <p className={SUBTITLE_CLASS}>Email, Google или Telegram — как вам удобнее.</p>

            <div className="mt-4">
              <LoginAccountHint />
            </div>

            <div className="mt-8 min-h-[28rem]">
              <LoginMethodsPanel mode="login" appearance="page" onLinked={onLinked} />
            </div>

            <p className="mt-10 text-[12px] leading-relaxed text-[#9CA3AF]">
              Продолжая, вы соглашаетесь с{' '}
              <Link to={LEGAL_TERMS_PATH} className="font-semibold text-[#6B7280] underline-offset-2 hover:underline">
                соглашением
              </Link>
              ,{' '}
              <Link to={LEGAL_PRIVACY_PATH} className="font-semibold text-[#6B7280] underline-offset-2 hover:underline">
                политикой ПД
              </Link>{' '}
              и{' '}
              <Link to={LEGAL_PD_CONSENT_PATH} className="font-semibold text-[#6B7280] underline-offset-2 hover:underline">
                согласием на обработку ПД
              </Link>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
