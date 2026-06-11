import { Link } from 'react-router-dom';
import { HiArrowLeft, HiChevronRight } from 'react-icons/hi2';
import { catalogDesktopSectionLabel } from '../client/servicesCatalog/servicesCatalogTheme';
import { bookingDesktopPanel } from './bookingDesktopTheme';
import { bookingBackLink } from './bookingUi';

type Props = {
  backTo: string;
  backLabel?: string;
  masterProfileTo: string;
  masterName: string;
  serviceTitle: string;
};

export function BookingDesktopHero({
  backTo,
  backLabel = 'Назад',
  masterProfileTo,
  masterName,
  serviceTitle,
}: Props) {
  return (
    <header className={`${bookingDesktopPanel} mb-4`}>
      <Link to={backTo} className={bookingBackLink}>
        <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>

      <nav
        aria-label="Маршрут записи"
        className="mt-3 flex min-w-0 flex-wrap items-center gap-1"
      >
        <Link
          to={masterProfileTo}
          className="min-w-0 truncate text-[13px] font-semibold text-[#111827] underline-offset-2 transition hover:text-[#F47C8C] hover:underline"
        >
          {masterName}
        </Link>
        <HiChevronRight className="h-3.5 w-3.5 shrink-0 text-[#C7C7CC]" aria-hidden />
        <span
          className="min-w-0 truncate text-[13px] font-medium text-[#6B7280]"
          title={serviceTitle}
          aria-current="page"
        >
          {serviceTitle}
        </span>
      </nav>

      <div className="mt-4 min-w-0">
        <p className={catalogDesktopSectionLabel}>Онлайн-запись</p>
        <h1 className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.03em] text-[#111827] lg:text-[26px]">
          Выберите дату и время
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#6B7280] lg:hidden">
          Онлайн-запись к мастеру
        </p>
        <p className="mt-1.5 hidden text-[14px] leading-relaxed text-[#6B7280] xl:block">
          После выбора слота справа появятся детали визита и итоговая стоимость.
        </p>
      </div>
    </header>
  );
}
