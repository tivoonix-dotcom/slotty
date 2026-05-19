import type { FC } from 'react';
import { Link } from 'react-router-dom';
import {
  HiBell,
  HiCalendarDays,
  HiChartBar,
  HiChatBubbleLeftRight,
  HiClock,
  HiStar,
  HiUserGroup,
} from 'react-icons/hi2';
import { FaTelegram } from 'react-icons/fa6';
import { homeOutlineBtn, homePinkBtn, homeSection } from './home/homeTheme';

const FLOATING_ICONS = [
  { key: 'telegram', label: 'Telegram', Icon: FaTelegram, position: 'left-2 top-6 -rotate-6 sm:left-4' },
  { key: 'calendar', label: 'Календарь', Icon: HiCalendarDays, position: 'right-4 top-10 rotate-6 sm:right-8' },
  { key: 'bell', label: 'Напоминания', Icon: HiBell, position: 'left-0 top-[42%] rotate-6' },
  { key: 'clock', label: 'Слоты', Icon: HiClock, position: 'right-0 top-[48%] -rotate-6' },
  { key: 'users', label: 'Мастера', Icon: HiUserGroup, position: 'left-8 bottom-[28%] rotate-5' },
  { key: 'rating', label: 'Рейтинг', Icon: HiStar, position: 'right-10 bottom-[26%] -rotate-5' },
  { key: 'chat', label: 'Сообщения', Icon: HiChatBubbleLeftRight, position: 'left-1 bottom-8 -rotate-6' },
  { key: 'stats', label: 'Статистика', Icon: HiChartBar, position: 'right-2 bottom-6 rotate-6' },
] as const;

const STATS: Array<{ value: string; label: string; highlight?: boolean }> = [
  { value: '6', label: 'категорий' },
  { value: '100+', label: 'мастеров', highlight: true },
  { value: '1', label: 'Telegram', highlight: true },
];

export type HomeTrustProps = {
  onJoinFree: () => void | Promise<void>;
};

function FloatingIconTile({
  label,
  Icon,
  position,
}: {
  label: string;
  Icon: typeof HiBell;
  position: string;
}) {
  return (
    <div
      title={label}
      className={`
        absolute z-[1] flex h-12 w-12 items-center justify-center rounded-2xl
        bg-white text-[#F47C8C] shadow-[0_8px_24px_rgba(244,124,140,0.14)]
        ring-1 ring-[#F47C8C]/15 sm:h-[52px] sm:w-[52px] sm:rounded-[18px]
        ${position}
      `}
    >
      <Icon className="h-6 w-6 sm:h-[26px] sm:w-[26px]" aria-hidden />
    </div>
  );
}

export const HomeTrust: FC<HomeTrustProps> = ({ onJoinFree }) => {
  return (
    <section
      id="nagrady"
      className={`${homeSection} sm:mt-20`}
      style={{ animationDelay: '80ms' }}
    >
      <div
        className="
          relative overflow-hidden rounded-[28px] bg-[#F1EFEF] p-3
          shadow-[0_8px_28px_rgba(17,24,39,0.05)]
          sm:rounded-[32px]
        "
      >
        <div
          className="
            relative overflow-hidden rounded-[22px] bg-white px-5 py-10
            ring-1 ring-[#F3F4F6] shadow-[0_10px_36px_rgba(17,24,39,0.07)]
            sm:rounded-[26px] sm:px-8 sm:py-12
          "
        >
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F47C8C]/10 blur-3xl" />
          </div>

          <div className="relative mx-auto min-h-[28rem] max-w-[22rem] sm:min-h-[32rem] sm:max-w-[24rem]">
            {FLOATING_ICONS.map(({ key, label, Icon, position }) => (
              <FloatingIconTile key={key} label={label} Icon={Icon} position={position} />
            ))}

            <div className="relative z-[3] flex min-h-[28rem] flex-col items-center justify-center text-center sm:min-h-[32rem]">
              <span className="mb-4 inline-flex rounded-full bg-[#FFF1F4] px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#F47C8C]">
                SLOTTY
              </span>

              <div className="space-y-2">
                {STATS.map((row) => (
                  <p
                    key={row.label}
                    className={`text-[clamp(1.75rem,6vw,2.125rem)] font-semibold leading-tight tracking-tight ${
                      row.highlight
                        ? 'bg-gradient-to-r from-[#F47C8C] to-[#F26D83] bg-clip-text text-transparent'
                        : 'text-[#111827]'
                    }`}
                  >
                    <span className="tabular-nums">{row.value}</span>{' '}
                    <span className={row.highlight ? '' : 'text-[#6B7280]'}>{row.label}</span>
                  </p>
                ))}
              </div>

              <p className="mx-auto mt-5 max-w-[17rem] text-[14px] leading-relaxed text-[#6B7280]">
                Мастера, услуги, график работы и напоминания — в одном понятном интерфейсе.
              </p>

              <div className="mt-8 flex w-full max-w-[16.5rem] flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => void onJoinFree()}
                  className={`w-full ${homePinkBtn} min-h-12 px-7 text-[15px]`}
                >
                  Присоединиться бесплатно
                </button>

                <Link to="#tarify" className={`w-full ${homeOutlineBtn} min-h-12 px-7 text-[15px]`}>
                  Смотреть планы
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
