import type { FC, ReactNode, SVGProps } from 'react';
import { homeSection } from './home/homeTheme';

const BARBER_BG = '/photos/barbershop/fon.webp';

const CREAM = '#FAFAF8';
const BARBER_SERIF = "Georgia, 'Times New Roman', Times, serif";

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RowIcon({ className, children }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const IconScissors = (p: SVGProps<SVGSVGElement>) => (
  <RowIcon {...p}>
    <circle cx="6" cy="6" r="2.5" />
    <circle cx="6" cy="18" r="2.5" />
    <path d="M8.5 7.5 20 3M8.5 16.5 20 21" />
  </RowIcon>
);

const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <RowIcon {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3 10h18" />
  </RowIcon>
);

const IconPerson = (p: SVGProps<SVGSVGElement>) => (
  <RowIcon {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c1.5-3.5 4.5-5.5 7-5.5s5.5 2 7 5.5" />
  </RowIcon>
);

const IconTag = (p: SVGProps<SVGSVGElement>) => (
  <RowIcon {...p}>
    <path d="M4 12 12 4h6l2 2v6l-8 8-6-6z" />
    <circle cx="14.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
  </RowIcon>
);

const IconBell = (p: SVGProps<SVGSVGElement>) => (
  <RowIcon {...p}>
    <path d="M12 3a5 5 0 0 0-5 5v3.5L5 14v1h14v-1l-2-2.5V8a5 5 0 0 0-5-5z" />
    <path d="M10 18a2 2 0 0 0 4 0" />
  </RowIcon>
);

const DEMO_ROWS = [
  { Icon: IconScissors, label: 'Услуга', value: 'Мужская стрижка' },
  { Icon: IconCalendar, label: 'Дата и время', value: 'Завтра, 14:30' },
  { Icon: IconPerson, label: 'Мастер', value: 'Артём Соколов' },
  { Icon: IconTag, label: 'Стоимость', value: 'от 35 BYN' },
  { Icon: IconBell, label: 'Напоминание', value: 'Завтра в 12:00' },
] as const;

export const HomeTelegramShowcase: FC = () => {
  return (
    <section
      id="telegram-showcase"
      className={homeSection}
      style={{ animationDelay: '155ms' }}
      aria-labelledby="home-booking-demo-heading"
    >
      <div className="mx-auto max-w-[40rem] px-1 text-center sm:px-0">
        <h2
          id="home-booking-demo-heading"
          className="text-[clamp(1.75rem,5.5vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]"
        >
          Запись всегда под рукой
        </h2>
      </div>

      <div
        className="relative mt-8 flex min-h-[min(28rem,118vw)] items-center justify-center overflow-hidden rounded-[20px] bg-cover bg-center bg-no-repeat px-5 py-10 sm:mt-14 sm:min-h-[24rem] sm:rounded-[28px] sm:px-6 sm:py-12"
        style={{ backgroundImage: `url('${BARBER_BG}')` }}
      >
        <article
          className="relative w-full max-w-[24rem] shrink-0 overflow-hidden rounded-[20px] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.45)] sm:max-w-md sm:rounded-[24px] lg:max-w-lg"
          style={{ backgroundColor: CREAM }}
        >
          <div className="border-b border-[#1A1A1A]/8 px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A] text-white sm:h-11 sm:w-11">
                  <IconCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-[13px] font-medium leading-snug text-[#737373] sm:text-[14px]">
                    Подтверждение
                  </p>
                  <h3
                    className="mt-0.5 text-[1.3rem] font-bold leading-[1.15] tracking-[-0.02em] text-[#1A1A1A] sm:text-[1.65rem]"
                    style={{ fontFamily: BARBER_SERIF }}
                  >
                    Вы записаны
                  </h3>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-[#1A1A1A]/[0.07] px-2.5 py-1 text-[11px] font-semibold leading-none text-[#1A1A1A] sm:text-[12px]">
                Подтверждено
              </span>
            </div>
          </div>

          <dl className="px-4 py-1 sm:px-5">
            {DEMO_ROWS.map(({ Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-2.5 border-b border-[#1A1A1A]/8 py-2.5 last:border-0 sm:gap-3 sm:py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1A1A1A]/[0.05] text-[#525252] sm:h-9 sm:w-9">
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </span>
                <dt className="min-w-0 flex-1 text-[12px] text-[#737373] sm:text-[13px]">{label}</dt>
                <dd className="max-w-[52%] shrink-0 text-right text-[12px] font-semibold leading-snug text-[#1A1A1A] sm:max-w-none sm:text-[14px]">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-[#1A1A1A]/8 px-4 py-3.5 sm:px-5 sm:py-4">
            <button
              type="button"
              className="flex w-full min-h-11 cursor-default items-center justify-center rounded-xl bg-[#1A1A1A] text-[14px] font-semibold text-white transition sm:min-h-12 sm:rounded-[14px] sm:text-[15px]"
              tabIndex={-1}
            >
              Открыть запись
            </button>
          </div>
        </article>

        <div
          className="pointer-events-none absolute inset-x-5 bottom-4 mx-auto flex w-full max-w-[24rem] items-center justify-center gap-2 sm:inset-x-6 sm:max-w-md sm:bottom-6 sm:gap-3 lg:max-w-lg"
          aria-hidden
        >
          <span className="h-px flex-1 bg-white/25" />
          <svg className="h-4 w-4 text-white/55 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6" cy="6" r="2" />
            <circle cx="6" cy="18" r="2" />
            <path d="M8 7.5 20 3M8 16.5 20 21" strokeLinecap="round" />
          </svg>
          <span className="h-px flex-1 bg-white/25" />
        </div>
      </div>
    </section>
  );
};
