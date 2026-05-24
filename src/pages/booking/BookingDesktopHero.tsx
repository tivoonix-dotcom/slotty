import { Link } from 'react-router-dom';
import { HiArrowLeft, HiCalendarDays, HiChevronRight } from 'react-icons/hi2';
import { catalogDesktopPanel } from '../client/servicesCatalog/servicesCatalogTheme';
import { bookingBackLink } from './bookingUi';

type Props = {
  backTo: string;
  backLabel?: string;
  masterName: string;
  serviceTitle: string;
};

export function BookingDesktopHero({
  backTo,
  backLabel = 'Назад',
  masterName,
  serviceTitle,
}: Props) {
  return (
    <header className={`${catalogDesktopPanel} mb-4 px-5 py-5 lg:px-6 lg:py-6`}>
      <Link to={backTo} className={bookingBackLink}>
        <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>

      <div className="mt-4 min-w-0">
        <p className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#F47C8C]">
          <HiCalendarDays className="h-4 w-4 shrink-0" aria-hidden />
          Онлайн-запись
        </p>

        <h1 className="mt-3 text-[24px] font-bold leading-tight tracking-[-0.03em] text-[#111827] lg:text-[26px]">
          Запись к мастеру
        </h1>

        <p className="mt-1.5 max-w-2xl text-[14px] text-[#6B7280]">
          Выберите дату и время — детали визита и стоимость обновятся в блоке справа.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[14px]">
        <span className="font-semibold text-[#111827]">{masterName}</span>
        <HiChevronRight className="h-4 w-4 shrink-0 text-[#D1D5DB]" aria-hidden />
        <span className="font-medium text-[#6B7280]">{serviceTitle}</span>
      </div>
    </header>
  );
}
