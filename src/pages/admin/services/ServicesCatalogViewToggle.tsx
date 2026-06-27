import { HiListBullet, HiSquares2X2 } from 'react-icons/hi2';
import { apptViewToggleBtnClass } from '../appointments/adminAppointmentsTheme';

export type CatalogViewMode = 'list' | 'grid';

type Props = {
  value: CatalogViewMode;
  onChange: (mode: CatalogViewMode) => void;
};

export function ServicesCatalogViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex shrink-0 gap-1" role="group" aria-label="Вид каталога">
      <button
        type="button"
        onClick={() => onChange('list')}
        className={apptViewToggleBtnClass(value === 'list')}
        aria-pressed={value === 'list'}
        aria-label="Список"
      >
        <HiListBullet className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={apptViewToggleBtnClass(value === 'grid')}
        aria-pressed={value === 'grid'}
        aria-label="Плитка"
      >
        <HiSquares2X2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
