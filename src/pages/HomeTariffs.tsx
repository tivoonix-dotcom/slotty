import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { BECOME_MASTER_PATH, SERVICES_PATH } from '../app/paths';

const PLANS = [
  {
    key: 'client',
    title: 'Клиент',
    price: '0 BYN',
    subtitle: 'поиск и запись бесплатно',
    text: 'Выбирайте услуги, мастеров и удобное время без оплаты за использование SLOTTY.',
    features: ['Поиск услуг', 'Профили мастеров', 'Запись онлайн'],
    cta: 'Найти услуги',
    to: SERVICES_PATH,
    muted: true,
  },
  {
    key: 'master',
    title: 'Мастер Pro',
    price: '29 BYN',
    subtitle: 'в месяц',
    text: 'Для мастеров, которые хотят принимать записи без переписок и управлять услугами в одном кабинете.',
    features: ['Профиль мастера', 'Услуги и цены', 'Расписание', 'Заявки клиентов'],
    cta: 'Стать мастером',
    to: BECOME_MASTER_PATH,
    muted: false,
  },
] as const;

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
    <section
      id="tarify"
      className="mt-20 animate-fade-enter scroll-mt-32 sm:mt-24"
      style={{ animationDelay: '60ms' }}
    >
      <div
        className="
          rounded-[38px]
          bg-[#F1EFEF]
          p-3
          shadow-[0_24px_70px_rgba(17,17,17,0.05)]
          sm:rounded-[44px]
        "
      >
        <div
          className="
            rounded-[32px]
            bg-white
            px-5
            py-6
            shadow-[0_10px_30px_rgba(17,17,17,0.035)]
            sm:rounded-[38px]
            sm:px-7
            sm:py-8
          "
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-400">
            Тарифы
          </p>

          <h2
            className="
              mt-2
              max-w-[22rem]
              text-[clamp(2rem,5.5vw,3rem)]
              font-semibold
              leading-[1.02]
              tracking-[-0.07em]
              text-neutral-950
            "
          >
            Начните бесплатно.
            <br />
            Растите с Pro.
          </h2>


        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <article
              key={plan.key}
              className={`
                overflow-hidden
                rounded-[32px]
                px-5
                pb-7
                pt-5
                shadow-[0_14px_42px_rgba(17,17,17,0.045)]
                sm:pb-8
                ${
                  plan.muted
                    ? 'bg-white text-neutral-950'
                    : 'bg-[#E29595] text-white shadow-[0_20px_60px_rgba(226,149,149,0.32)]'
                }
              `}
            >
              <div className="flex min-h-[15.5rem] flex-col">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={`
                          text-[18px]
                          font-semibold
                          tracking-[-0.045em]
                          ${plan.muted ? 'text-neutral-950' : 'text-white'}
                        `}
                      >
                        {plan.title}
                      </p>

                      <p
                        className={`
                          mt-1
                          text-[13px]
                          font-medium
                          ${plan.muted ? 'text-neutral-400' : 'text-white/75'}
                        `}
                      >
                        {plan.subtitle}
                      </p>
                    </div>

                    {!plan.muted ? (
                      <span className="rounded-full bg-white/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                        Pro
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6">
                    <span
                      className={`
                        text-[38px]
                        font-semibold
                        leading-none
                        tracking-[-0.075em]
                        ${plan.muted ? 'text-neutral-950' : 'text-white'}
                      `}
                    >
                      {plan.price}
                    </span>
                  </div>

                  <p
                    className={`
                      mt-4
                      text-[14px]
                      leading-relaxed
                      ${plan.muted ? 'text-neutral-500' : 'text-white/82'}
                    `}
                  >
                    {plan.text}
                  </p>
                </div>

                <ul className="mt-5 flex flex-col gap-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <span
                        className={`
                          flex
                          h-6
                          w-6
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          ${plan.muted ? 'bg-[#F1EFEF] text-[#E29595]' : 'bg-white/20 text-white'}
                        `}
                      >
                        <IconCheck className="h-3.5 w-3.5" />
                      </span>

                      <span
                        className={`
                          text-[14px]
                          font-medium
                          ${plan.muted ? 'text-neutral-700' : 'text-white/90'}
                        `}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="min-h-5 flex-1" aria-hidden />

                <Link
                  to={plan.to}
                  className={`
                    flex
                    min-h-[3.15rem]
                    w-full
                    items-center
                    justify-center
                    rounded-full
                    text-[15px]
                    font-semibold
                    transition
                    active:scale-[0.98]
                    ${
                      plan.muted
                        ? 'bg-[#F1EFEF] text-neutral-950'
                        : 'bg-white text-neutral-950 shadow-[0_12px_30px_rgba(100,50,50,0.16)]'
                    }
                  `}
                >
                  {plan.cta}
                </Link>
              </div>
            </article>
          ))}
        </div>


      </div>
    </section>
  );
};