import type { FC } from 'react';
import { Link } from 'react-router-dom';

function IconTelegram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.8 4.35 3.65 10.95c-1.1.43-1.1 1.08-.2 1.36l4.38 1.37 1.68 5.13c.22.62.43.86.86.86.39 0 .62-.18.96-.5l2.08-2.02 4.32 3.18c.8.44 1.36.22 1.56-.74l2.79-13.15c.28-1.12-.43-1.64-1.28-1.29ZM8.92 13.17l10.18-6.4c.5-.3.94-.14.57.2l-8.25 7.46-.32 3.08-1.52-4.17-.66-.17Z" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <path d="M7 4v3M17 4v3M5.5 9.5h13" strokeLinecap="round" />
      <path
        d="M6.5 6h11A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-9A2.5 2.5 0 0 1 6.5 6Z"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <path
        d="M18 8.5a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10.3 19a2 2 0 0 0 3.4 0" strokeLinecap="round" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <path d="M16 19c0-2.2-1.8-4-4-4s-4 1.8-4 4" strokeLinecap="round" />
      <circle cx="12" cy="10" r="3" />
      <path
        d="M18 18c0-1.5-.8-2.8-2-3.5M6 18c0-1.5.8-2.8 2-3.5"
        strokeLinecap="round"
      />
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

function IconMessage({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <path
        d="M6.5 17.5h-.8A2.7 2.7 0 0 1 3 14.8V7.7A2.7 2.7 0 0 1 5.7 5h12.6A2.7 2.7 0 0 1 21 7.7v7.1a2.7 2.7 0 0 1-2.7 2.7H11l-4.5 3v-3Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      aria-hidden
    >
      <path d="M5 19V9M12 19V5M19 19v-7" strokeLinecap="round" />
    </svg>
  );
}

const FLOATING_ICONS = [
  {
    key: 'telegram',
    label: 'Telegram',
    Icon: IconTelegram,
    position: 'left-4 top-8 rotate-[-8deg]',
    tile: 'bg-[#EAF7FF]',
    icon: 'text-[#229ED9]',
  },
  {
    key: 'calendar',
    label: 'Календарь',
    Icon: IconCalendar,
    position: 'right-7 top-14 rotate-[7deg]',
    tile: 'bg-[#FFF0F0]',
    icon: 'text-[#E29595]',
  },
  {
    key: 'bell',
    label: 'Напоминания',
    Icon: IconBell,
    position: 'left-[-14px] top-[205px] rotate-[8deg]',
    tile: 'bg-[#FFF2E9]',
    icon: 'text-[#FF7A45]',
  },
  {
    key: 'clock',
    label: 'Слоты',
    Icon: IconClock,
    position: 'right-[-10px] top-[248px] rotate-[-7deg]',
    tile: 'bg-[#F1EEFF]',
    icon: 'text-[#7C5CFF]',
  },
  {
    key: 'users',
    label: 'Мастера',
    Icon: IconUsers,
    position: 'left-14 bottom-28 rotate-[6deg]',
    tile: 'bg-[#EAFBF7]',
    icon: 'text-[#21BFA6]',
  },
  {
    key: 'rating',
    label: 'Рейтинг',
    Icon: IconStar,
    position: 'right-16 bottom-24 rotate-[-6deg]',
    tile: 'bg-[#FFF7D7]',
    icon: 'text-[#F5B400]',
  },
  {
    key: 'chat',
    label: 'Сообщения',
    Icon: IconMessage,
    position: 'left-[-8px] bottom-9 rotate-[-7deg]',
    tile: 'bg-[#F2EAFF]',
    icon: 'text-[#8B5CF6]',
  },
  {
    key: 'stats',
    label: 'Статистика',
    Icon: IconChart,
    position: 'right-[-12px] bottom-6 rotate-[8deg]',
    tile: 'bg-[#EAF3FF]',
    icon: 'text-[#3B82F6]',
  },
] as const;

export type HomeTrustProps = {
  onJoinFree: () => void | Promise<void>;
};

export const HomeTrust: FC<HomeTrustProps> = ({ onJoinFree }) => {
  return (
    <section
      id="nagrady"
      className="mt-20 animate-fade-enter scroll-mt-32 sm:mt-24"
      style={{ animationDelay: '80ms' }}
    >
      <div
        className="
          relative
          overflow-hidden
          rounded-[44px]
          bg-white
          px-5
          py-8
          sm:rounded-[52px]
          sm:px-8
          sm:py-10
        "
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#E29595]/[0.07] blur-3xl" />
          <div className="absolute -left-24 top-20 h-56 w-56 rounded-full bg-[#EAF7FF]/80 blur-3xl" />
          <div className="absolute -right-24 bottom-16 h-56 w-56 rounded-full bg-[#FFF0F0]/90 blur-3xl" />
        </div>

        <div className="relative mx-auto h-[560px] max-w-[24rem]">
          {FLOATING_ICONS.map(({ key, label, Icon, position, tile, icon }) => (
            <div
              key={key}
              title={label}
              className={`
                absolute
                z-[1]
                flex
                h-[58px]
                w-[58px]
                items-center
                justify-center
                rounded-[20px]
                ${tile}
                shadow-[0_18px_46px_rgba(17,17,17,0.08)]
                backdrop-blur-xl
                ${position}
              `}
            >
              <Icon className={`h-[27px] w-[27px] ${icon}`} />
            </div>
          ))}

          <div
            className="
              absolute
              left-1/2
              top-1/2
              z-[3]
              w-[292px]
              -translate-x-1/2
              -translate-y-1/2
              text-center
            "
          >

            <div className="mt-4 space-y-1">
              <p className="text-[34px] font-semibold leading-none tracking-[-0.065em] text-neutral-950">
                6 категорий
              </p>

              <p className="text-[34px] font-semibold leading-none tracking-[-0.065em] text-neutral-950">
                100+ мастеров
              </p>

              <p className="text-[34px] font-semibold leading-none tracking-[-0.065em] text-neutral-950">
                1 Telegram
              </p>
            </div>

            <p className="mx-auto mt-5 max-w-[16rem] text-[14px] leading-relaxed text-neutral-500">
              Мастера, услуги, расписание и напоминания собраны в одном понятном интерфейсе.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void onJoinFree()}
                className="
                  rounded-full
                  bg-neutral-950
                  px-7
                  py-4
                  text-[15px]
                  font-semibold
                  text-white
                  shadow-[0_18px_44px_rgba(17,17,17,0.16)]
                  transition
                  active:scale-[0.98]
                "
              >
                Присоединиться бесплатно
              </button>

              <Link
                to="/settings"
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-[#F3F1F1]
                  px-7
                  py-4
                  text-[15px]
                  font-semibold
                  text-neutral-950
                  transition
                  active:scale-[0.98]
                "
              >
                Смотреть планы
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};