import { Link } from 'react-router-dom';
import { HiBriefcase, HiUser } from 'react-icons/hi2';
import { ADMIN_PATH, PROFILE_PATH } from '../../app/paths';
import { useIsMasterUser } from '../../features/profile/hooks/useIsMasterUser';
export type CabinetRole = 'master' | 'client';

type Props = {
  active: CabinetRole;
  className?: string;
  /** Компактный вариант для мобильной шапки кабинета. */
  compact?: boolean;
};

function tabClass(active: boolean, compact: boolean): string {
  return `relative flex min-h-0 flex-1 items-center justify-center gap-0.5 overflow-hidden rounded-[8px] font-semibold transition active:scale-[0.98] ${
    compact ? 'min-h-8 px-2 text-[11px]' : 'min-h-9 gap-1.5 px-4 text-[13px]'
  } ${
    active ? 'text-white' : 'bg-white text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#374151]'
  }`;
}

function RoleTabLink({
  to,
  active,
  compact,
  icon: Icon,
  label,
}: {
  to: string;
  active: boolean;
  compact: boolean;
  icon: typeof HiBriefcase;
  label: string;
}) {
  const iconClass = compact ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <Link
      to={to}
      role="tab"
      aria-selected={active}
      className={tabClass(active, compact)}
    >
      {active ? (
        <span className="pointer-events-none absolute inset-0 bg-[#F47C8C]" aria-hidden />
      ) : null}
      <Icon className={`relative z-10 ${iconClass} shrink-0`} aria-hidden />
      <span className="relative z-10">{label}</span>
    </Link>
  );
}

export function CabinetRoleSwitch({
  active,
  className = '',
  compact = false,
}: Props) {
  const isMasterUser = useIsMasterUser();
  if (!isMasterUser) return null;

  return (
    <div
      className={`grid min-w-0 grid-cols-2 gap-0.5 rounded-[10px] bg-[#F5F5F5] p-0.5 ${
        compact ? 'w-full max-w-[10.25rem]' : 'w-[min(100%,15rem)]'
      } ${className}`}
      role="tablist"
      aria-label="Режим кабинета"
    >
      <RoleTabLink
        to={ADMIN_PATH}
        active={active === 'master'}
        compact={compact}
        icon={HiBriefcase}
        label="Мастер"
      />
      <RoleTabLink
        to={PROFILE_PATH}
        active={active === 'client'}
        compact={compact}
        icon={HiUser}
        label="Клиент"
      />
    </div>
  );
};
