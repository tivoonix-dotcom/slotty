import { HiCalendarDays, HiListBullet } from 'react-icons/hi2';
import { apptViewToggleBtnClass } from './adminAppointmentsTheme';
import type { UpcomingViewMode } from './appointmentsTypes';

type Props = {
  value: UpcomingViewMode;
  onChange: (mode: UpcomingViewMode) => void;
};

export function AppointmentsUpcomingViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex shrink-0 gap-1" role="group" aria-label="Вид предстоящих записей">
      <button
        type="button"
        onClick={() => onChange('list')}
        className={apptViewToggleBtnClass(value === 'list')}
        aria-pressed={value === 'list'}
      >
        <HiListBullet className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Список</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('calendar')}
        className={apptViewToggleBtnClass(value === 'calendar')}
        aria-pressed={value === 'calendar'}
      >
        <HiCalendarDays className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">Календарь</span>
      </button>
    </div>
  );
}
