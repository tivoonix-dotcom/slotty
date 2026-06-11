import type { FC } from 'react';
import { ImageReveal } from '../../shared/ui/ImageReveal';
import { homeSection } from './homeTheme';

const whySlottyPhoto = (file: string) => `/photos/why-slotty/${file}`;

type WhyCard = {
  id: string;
  title: string;
  description: string;
  imageFile: string;
  imageAlt: string;
};

const WHY_CARDS: WhyCard[] = [
  {
    id: 'free-slots',
    title: 'Свободные окна',
    description: 'Клиент сразу видит доступное время и выбирает удобный слот без переписки в личке.',
    imageFile: 'free-slots.webp',
    imageAlt: 'Свободные окна мастера в Slotty',
  },
  {
    id: 'booking',
    title: 'Запись без хаоса',
    description: 'Услуга, мастер, время и правила записи собраны в одном месте.',
    imageFile: 'booking-flow.webp',
    imageAlt: 'Запись на услугу без хаоса в переписках',
  },
  {
    id: 'reminders',
    title: 'Напоминания',
    description: 'Slotty помогает не забыть о визите через Telegram и email.',
    imageFile: 'reminders.webp',
    imageAlt: 'Напоминания о визите в Telegram и email',
  },
  {
    id: 'reviews',
    title: 'Отзывы и рейтинг',
    description: 'Клиенты выбирают мастера по реальному опыту других людей.',
    imageFile: 'reviews.webp',
    imageAlt: 'Отзывы и рейтинг мастера в Slotty',
  },
  {
    id: 'history',
    title: 'История записей',
    description: 'Все визиты сохраняются в профиле, чтобы ничего не потерялось.',
    imageFile: 'booking-history.webp',
    imageAlt: 'История записей в профиле клиента',
  },
];

export const WhySlottyBetterSection: FC = () => {
  return (
    <section
      id="why-slotty"
      className={`${homeSection} scroll-mt-28`}
      style={{ animationDelay: '100ms' }}
      aria-labelledby="why-slotty-heading"
    >
      <span className="inline-flex rounded-full bg-[#FFF1F3] px-4 py-1.5 text-[12px] font-semibold tracking-wide text-[#F47C8C] sm:text-[13px]">
        Почему Slotty
      </span>
      <h2
        id="why-slotty-heading"
        className="mt-4 text-[clamp(1.75rem,5vw,3rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[#111827]"
      >
        Без хаоса в переписках
      </h2>
      <p className="mt-4 max-w-[36rem] text-[15px] leading-7 text-[#6B7280] sm:text-[17px]">
        Slotty собирает свободные окна, записи, напоминания, отзывы и историю визитов в одном понятном
        месте.
      </p>

      <div className="mt-10 mr-[calc(50%-50vw)] overflow-x-auto [scrollbar-width:none] sm:mt-14 [&::-webkit-scrollbar]:hidden">
        <ul className="flex w-max list-none snap-x snap-mandatory gap-5 pb-2 sm:gap-6">
          {WHY_CARDS.map((card, index) => (
            <li
              key={card.id}
              className="w-[min(17.5rem,82vw)] shrink-0 snap-start sm:w-[19.5rem] lg:w-[21rem]"
            >
              <article aria-labelledby={`why-slotty-${card.id}-title`}>
                <div className="overflow-hidden rounded-[22px] bg-[#F2F2F2] p-3 sm:rounded-[26px] sm:p-4">
                  <ImageReveal
                    src={whySlottyPhoto(card.imageFile)}
                    alt={card.imageAlt}
                    loading={index < 2 ? 'eager' : 'lazy'}
                    fetchPriority={index < 2 ? 'high' : 'low'}
                    draggable={false}
                    className="block h-auto w-full rounded-[20px] object-contain sm:rounded-[24px]"
                  />
                </div>

                <h3
                  id={`why-slotty-${card.id}-title`}
                  className="mt-4 text-[1.05rem] font-bold tracking-[-0.02em] text-[#111827] sm:text-[1.15rem]"
                >
                  {card.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280] sm:text-[15px] sm:leading-7">
                  {card.description}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
