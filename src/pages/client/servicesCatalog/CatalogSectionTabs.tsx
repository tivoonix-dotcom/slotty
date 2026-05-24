import { NavLink } from 'react-router-dom';
import { HiScissors, HiUserGroup } from 'react-icons/hi2';
import { MASTERS_PATH, SERVICES_PATH } from '../../../app/paths';
import {
  catalogSectionTabActive,
  catalogSectionTabIdle,
} from './servicesCatalogTheme';

const SECTIONS = [
  { id: 'services' as const, label: 'Услуги', to: SERVICES_PATH, icon: HiScissors },
  { id: 'masters' as const, label: 'Мастера', to: MASTERS_PATH, icon: HiUserGroup },
];

type Props = {
  className?: string;
  compact?: boolean;
};

export function CatalogSectionTabs({ className = '', compact = false }: Props) {
  const tabClass = compact
    ? 'inline-flex items-center gap-1 rounded-[8px] px-3 py-1.5 text-[13px] font-semibold transition'
    : 'inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-[14px] font-semibold transition';

  return (
    <nav
      className={`flex flex-wrap items-center gap-1 ${className}`}
      aria-label="Каталог: услуги или мастера"
    >
      {SECTIONS.map(({ id, label, to, icon: Icon }) => (
        <NavLink
          key={id}
          to={to}
          className={({ isActive }) =>
            `${tabClass} ${isActive ? catalogSectionTabActive : catalogSectionTabIdle}`
          }
        >
          <Icon className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} shrink-0 opacity-80`} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
