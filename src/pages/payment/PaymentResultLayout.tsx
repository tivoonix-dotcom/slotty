import type { FC, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HUB_PATH, PROFILE_PATH } from '../../app/paths';

export const PaymentResultLayout: FC<{
  title: string;
  tone: 'success' | 'fail' | 'pending';
  children: ReactNode;
}> = ({ title, tone, children }) => {
  const accent =
    tone === 'success' ? 'text-[#15803D]' : tone === 'fail' ? 'text-[#B91C1C]' : 'text-[#92400E]';
  const ring =
    tone === 'success' ? 'ring-[#DCFCE7]' : tone === 'fail' ? 'ring-[#FEE2E2]' : 'ring-[#FDE68A]';
  const bg =
    tone === 'success' ? 'bg-[#F0FDF4]' : tone === 'fail' ? 'bg-[#FEF2F2]' : 'bg-[#FFFBEB]';

  return (
    <div className="min-h-dvh bg-[#F8F6F6] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-lg">
        <p className="text-[13px] font-semibold tracking-[0.08em] text-[#E29595]">SLOTTY</p>
        <div className={`mt-6 rounded-[24px] border border-black/[0.06] bg-white p-6 sm:p-8 ring-4 ${ring} ${bg}/30`}>
          <h1 className={`text-[22px] font-semibold tracking-[-0.03em] ${accent}`}>{title}</h1>
          <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-neutral-700">{children}</div>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row">
            <Link
              to={PROFILE_PATH}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#E29595] px-5 text-[14px] font-semibold text-white transition hover:opacity-90"
            >
              В профиль
            </Link>
            <Link
              to={HUB_PATH}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-[14px] font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
