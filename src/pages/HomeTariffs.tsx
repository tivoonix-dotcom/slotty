import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { BECOME_MASTER_PATH, SERVICES_PATH } from '../app/paths';
import { HomeMasterProCard } from './home/HomeMasterProCard';
import { homePinkBtn, homeSection } from './home/homeTheme';

const CLIENT_PLAN = {
  key: 'client',
  title: 'Клиент',
  price: '0 BYN',
  text: 'Для клиентов SLOTTY бесплатный: выбирайте услуги, смотрите мастеров и записывайтесь онлайн.',
  features: ['Поиск услуг', 'Профили мастеров', 'Онлайн-запись', 'Напоминания в Telegram'],
  cta: 'Найти мастера',
  to: SERVICES_PATH,
} as const;

function IconCheck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const HomeTariffs: FC = () => {
  return (
    <section id="tarify" className={homeSection} style={{ animationDelay: '60ms' }}>
      <div className="mx-auto max-w-[40rem] text-center">
        <h2 className="text-[clamp(2rem,6vw,3.25rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[#111827]">
          Простые условия для клиентов и мастеров
        </h2>
      </div>

      <div className="mt-10 grid gap-3 sm:mt-14 sm:grid-cols-2">
        <article className="relative flex min-h-[20rem] flex-col overflow-hidden rounded-[26px] bg-white px-5 pb-6 pt-5 text-[#111827] shadow-[0_12px_40px_rgba(17,24,39,0.08)] ring-1 ring-[#F3F4F6]">
          <p className="text-[18px] font-semibold tracking-tight text-[#111827]">{CLIENT_PLAN.title}</p>

          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-[36px] font-bold tracking-tight text-[#111827]">{CLIENT_PLAN.price}</span>
          </div>

          <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">{CLIENT_PLAN.text}</p>

          <ul className="mt-4 flex flex-1 flex-col gap-2">
            {CLIENT_PLAN.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]">
                  <IconCheck className="h-3.5 w-3.5" />
                </span>
                <span className="text-[14px] font-medium text-[#374151]">{feature}</span>
              </li>
            ))}
          </ul>

          <Link to={CLIENT_PLAN.to} className={`mt-5 flex min-h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold ${homePinkBtn}`}>
            {CLIENT_PLAN.cta}
          </Link>
        </article>

        <HomeMasterProCard cta="Стать мастером" to={BECOME_MASTER_PATH} />
      </div>
    </section>
  );
};
