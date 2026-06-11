import { Link } from 'react-router-dom';
import { HiSparkles } from 'react-icons/hi2';
import { ADMIN_BILLING_PATH } from '../../../app/paths';
import { planBadgeLabel } from '../../../features/billing/model/masterPlans';
import { servicesCard } from './adminServicesTheme';

type Variant = 'bundles' | 'promotions';

const COPY: Record<
  Variant,
  { title: string; body: string; bullets: string[] }
> = {
  bundles: {
    title: 'Наборы — только в Pro',
    body: 'На тарифе Free можно вести каталог и прайс. Комбо из нескольких услуг со скидкой доступны после подключения Pro.',
    bullets: [
      'Объединяйте 2+ услуги в одно предложение',
      'Задайте цену набора и скидку в процентах или BYN',
      'Клиенты видят выгоду в каталоге и при записи',
    ],
  },
  promotions: {
    title: 'Акции — только в Pro',
    body: 'На тарифе Free можно вести каталог и прайс. Скидки и спецпредложения с датами публикации доступны в Pro.',
    bullets: [
      'Скидка на первый визит, сезонные и «счастливые часы»',
      'Процент, фиксированная сумма или подарок к услуге',
      'Баннер акции в каталоге и при выборе услуги',
    ],
  },
};

type Props = {
  variant: Variant;
};

export function ServicesExtrasProBlock({ variant }: Props) {
  const copy = COPY[variant];

  return (
    <section
      className={`${servicesCard} border border-[#FDE8ED] bg-gradient-to-br from-[#FFF8F9] via-white to-[#FFF5F5] p-4 shadow-[0_10px_32px_rgba(244,124,140,0.08)] lg:rounded-[28px] lg:shadow-[0_2px_16px_rgba(17,24,39,0.04)]`}
      aria-labelledby={`services-extras-pro-${variant}`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#FFF1F4] text-[#F47C8C]">
          <HiSparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#F47C8C]">
            Подписка · {planBadgeLabel('pro')}
          </p>
          <h3 id={`services-extras-pro-${variant}`} className="mt-1 text-[17px] font-bold tracking-[-0.03em] text-[#111827]">
            {copy.title}
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#4B5563]">{copy.body}</p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {copy.bullets.map((line) => (
          <li key={line} className="flex gap-2 text-[13px] leading-snug text-[#374151]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47C8C]" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <Link
        to={ADMIN_BILLING_PATH}
        className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] text-[15px] font-semibold text-white transition active:scale-[0.98]"
      >
        Подключить Pro
      </Link>
    </section>
  );
}
