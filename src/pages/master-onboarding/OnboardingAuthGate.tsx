import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BECOME_MASTER_PATH } from '../../app/paths';
import { LoginMethodsPanel } from '../../features/auth/components/LoginMethodsPanel';

type OnboardingAuthGateProps = {
  onAuthenticated?: () => void;
};

/** Вход для сохранения анкеты мастера (Google, Telegram, email). */
export function OnboardingAuthGate({ onAuthenticated }: OnboardingAuthGateProps) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('from')) return;
    params.set('from', BECOME_MASTER_PATH);
    navigate({ pathname: location.pathname, search: `?${params.toString()}` }, { replace: true });
  }, [location.pathname, location.search, navigate]);

  return (
    <div id="onboarding-auth-gate" className="scroll-mt-28 rounded-[18px] bg-[#FFF4E8] px-4 py-4 lg:scroll-mt-32">
      <p className="text-[13px] font-semibold leading-snug text-[#B66A24]">
        Войдите через Google, Telegram или email, чтобы сохранить анкету на сервере.
      </p>
      <p className="mt-1 text-[12px] font-medium leading-snug text-[#9A3412]">
        Без входа можно только просмотреть шаги анкеты.
      </p>
      <div className="mt-4 rounded-[20px] bg-white p-4 shadow-[0_4px_16px_rgba(17,24,39,0.04)]">
        <LoginMethodsPanel
          mode="login"
          appearance="page"
          authIntent="master-register"
          oauthReturnPath={BECOME_MASTER_PATH}
          onLinked={onAuthenticated}
        />
      </div>
    </div>
  );
}
