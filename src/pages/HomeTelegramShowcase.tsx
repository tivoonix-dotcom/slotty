import type { FC } from 'react';

const FLOAT_CARD =
  'rounded-[24px] bg-white/90 text-neutral-950 shadow-[0_18px_50px_rgba(17,17,17,0.06)] backdrop-blur-xl';

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M18 8.5a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.3 19a2 2 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="m12 3 2.09 4.26L19 8.27l-3.18 3.1L16.18 17 12 14.77 7.82 17 8.18 11.37 5 8.27l4.91-.74L12 3Z" />
    </svg>
  );
}

export const HomeTelegramShowcase: FC = () => {
  return (
    <section
      id="telegram-showcase"
      className="mt-14 animate-fade-enter scroll-mt-28 sm:mt-16"
      style={{ animationDelay: '155ms' }}
    >
      <div className="mb-6 px-1 text-center">

        <h2 className="mt-2 text-[32px] font-semibold leading-[1.02] tracking-[-0.055em] text-neutral-950">
          Запись готова
        </h2>

      </div>

      <div className="relative overflow-hidden rounded-[38px] bg-[#F1EFEF] px-5 py-8 shadow-[0_24px_70px_rgba(17,17,17,0.05)]">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-white/70 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-white/60 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F47C8C]/10 blur-3xl" />
        </div>

        <div className="relative mx-auto min-h-[430px] max-w-[24rem]">
          <div className={`${FLOAT_CARD} absolute left-0 top-4 w-[142px] -rotate-[4deg] px-4 py-3`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 no-underline">
              слот
            </p>
            <p className="mt-1 text-[22px] font-semibold tracking-[-0.05em]">
              14:30
            </p>
          </div>

          <div className={`${FLOAT_CARD} absolute right-0 top-10 w-[132px] rotate-[3deg] px-4 py-3`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 no-underline">
              рейтинг
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <IconStar className="h-4 w-4 text-[#F47C8C]" />
              <span className="text-[22px] font-semibold tracking-[-0.05em]">
                4.9
              </span>
            </div>
          </div>

          <div className="absolute left-1/2 top-[118px] z-[3] w-[270px] -translate-x-1/2 rounded-[36px] bg-white px-5 py-6 text-center shadow-[0_28px_80px_rgba(17,17,17,0.08)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F6F3F3] text-[#F47C8C]">
              <IconCheck className="h-5 w-5" />
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 no-underline">
              подтверждено
            </p>

            <h3 className="mt-2 text-[30px] font-semibold leading-[1.02] tracking-[-0.06em] text-neutral-950">
              Вы записаны
            </h3>

            <p className="mx-auto mt-3 max-w-[13rem] text-[14px] leading-relaxed text-neutral-500">
              Маникюр завтра в 14:30. Напоминание придет в Telegram.
            </p>

            <div className="mt-5 rounded-full bg-[#F47C8C] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_14px_34px_rgba(244,124,140,0.32)]">
              Открыть запись
            </div>
          </div>

          <div className={`${FLOAT_CARD} absolute left-0 bottom-24 w-[166px] rotate-[2deg] px-4 py-3.5 opacity-90`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 no-underline">
              услуга
            </p>
            <p className="mt-1 text-[19px] font-semibold tracking-[-0.045em]">
              Маникюр
            </p>
            <p className="mt-1 text-[13px] font-medium text-neutral-400">
              от 45 BYN
            </p>
          </div>

          <div className={`${FLOAT_CARD} absolute right-0 bottom-20 w-[178px] -rotate-[2deg] px-4 py-3.5 opacity-90`}>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F6F3F3] text-[#F47C8C]">
                <IconBell className="h-5 w-5" />
              </span>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 no-underline">
                  напоминание
                </p>
                <p className="mt-0.5 truncate text-[14px] font-semibold tracking-[-0.03em]">
                  завтра в 12:00
                </p>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-1/2 flex w-max -translate-x-1/2 items-center gap-2 rounded-full bg-white/85 px-4 py-3 shadow-[0_16px_44px_rgba(17,17,17,0.06)] backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-[#F47C8C]" />
            <span className="text-[13px] font-semibold text-neutral-700">
              всё внутри Telegram
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};