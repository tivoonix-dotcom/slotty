import type { FC } from 'react';

const FAQ_ITEMS = [
  {
    key: 'what',
    q: 'Что такое SLOTTY?',
    a: 'SLOTTY — это сервис записи к мастерам внутри Telegram. Клиент выбирает услугу, свободное время и записывается без долгих переписок.',
  },
  {
    key: 'app',
    q: 'Нужно ли скачивать приложение?',
    a: 'Нет. Всё работает прямо в Telegram Web App: достаточно открыть ссылку мастера или перейти в сервис через Telegram.',
  },
  {
    key: 'client-price',
    q: 'Для клиента это бесплатно?',
    a: 'Да. Клиент бесплатно ищет мастера и записывается на услугу. Оплачивается только сама услуга у специалиста.',
  },
  {
    key: 'booking',
    q: 'Как проходит запись?',
    a: 'Вы выбираете категорию, мастера, услугу и удобное время. После подтверждения запись появляется в системе, а клиент получает напоминание.',
  },
  {
    key: 'master-start',
    q: 'Как мастеру начать работать?',
    a: 'Мастер создает профиль, добавляет услуги, цены и расписание. После этого клиенты смогут видеть свободные слоты и записываться самостоятельно.',
  },
  {
    key: 'reminders',
    q: 'Будут ли напоминания о записи?',
    a: 'Да. SLOTTY помогает напоминать клиенту о визите, чтобы мастер меньше терял время из-за забытых записей.',
  },
] as const;

export const HomeFaq: FC = () => {
  return (
    <section
      id="faq"
      className="mt-20 animate-fade-enter scroll-mt-32 sm:mt-24"
      style={{ animationDelay: '100ms' }}
    >
      <div className="mx-auto max-w-2xl px-1 text-center">


        <h2 className="mt-2 font-sans text-[clamp(1.65rem,4.2vw,2.25rem)] font-bold leading-tight tracking-[-0.03em] text-neutral-950">
          Частые вопросы
        </h2>

        <p className="mt-3 text-[15px] leading-relaxed text-neutral-500 sm:text-base">
          Коротко о записи, Telegram и возможностях для мастеров.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-3 sm:mt-12">
        {FAQ_ITEMS.map((item) => (
          <details
            key={item.key}
            className="
              group
              rounded-[22px]
              bg-[#F1EFEF]
              px-5
              py-4
              shadow-[0_12px_40px_rgba(17,17,17,0.04)]
              sm:rounded-[26px]
              sm:px-6
              sm:py-4
            "
          >
            <summary
              className="
                cursor-pointer
                list-none
                text-left
                text-[15px]
                font-semibold
                tracking-tight
                text-neutral-950
                [&::-webkit-details-marker]:hidden
              "
            >
              <span className="flex items-center justify-between gap-3">
                {item.q}

                <span
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    text-lg
                    font-light
                    leading-none
                    text-neutral-400
                    transition
                    group-open:rotate-45
                  "
                  aria-hidden
                >
                  +
                </span>
              </span>
            </summary>

            <p className="mt-3 pt-1 text-left text-[14px] leading-relaxed text-neutral-600 sm:text-[15px]">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};