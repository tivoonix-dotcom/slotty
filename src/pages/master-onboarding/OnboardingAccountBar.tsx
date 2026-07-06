import type { BackendProfile } from '../../features/auth/types';

type OnboardingAccountBarProps = {
  profile: BackendProfile | null;
  onLogout: () => void;
};

function resolveAccountLabel(profile: BackendProfile | null): string {
  const name = profile?.full_name?.trim();
  if (name) return name;

  const email = profile?.account_email?.trim();
  if (email) return email;

  const tg = profile?.telegram_username?.trim();
  if (tg) return tg.startsWith('@') ? tg : `@${tg}`;

  return 'Аккаунт';
}

export function OnboardingAccountBar({ profile, onLogout }: OnboardingAccountBarProps) {
  const label = resolveAccountLabel(profile);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-[#F0FDF4] px-4 py-3 ring-1 ring-[#BBF7D0]/80">
      <p className="min-w-0 text-[13px] font-medium leading-snug text-[#166534]">
        Вошли как <span className="font-semibold text-[#14532D]">{label}</span>
      </p>
      <button
        type="button"
        onClick={onLogout}
        className="shrink-0 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-[#B91C1C] shadow-sm transition hover:bg-[#FEE2E2] active:scale-[0.98]"
      >
        Выйти
      </button>
    </div>
  );
}
