import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HiMagnifyingGlass } from 'react-icons/hi2';

/** Единая CRM design system для кабинета мастера. */

export const crmCardClass =
  'rounded-[20px] border border-[#EAECEF] bg-white shadow-[0_4px_24px_rgba(17,24,39,0.05)]';
export const crmCardPad = 'p-5 sm:p-6';

export function CrmPageHeader({
  title,
  subtitle,
  badge,
  actions,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[22px] font-black tracking-[-0.05em] text-[#111827] sm:text-[26px]">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle ? (
          <p className="mt-1.5 max-w-2xl text-[14px] font-medium leading-relaxed text-[#6B7280]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function CrmMetricCard({
  label,
  value,
  hint,
  to,
  urgent,
  icon,
  className = '',
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  to?: string;
  urgent?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const body = (
    <div
      className={`relative min-w-0 overflow-hidden rounded-[16px] p-4 ring-1 transition active:scale-[0.99] ${
        urgent
          ? 'bg-[#FFF1F4] ring-[#FDE8ED]'
          : 'bg-[#F6F7FB] ring-[#EEEEEE] hover:bg-[#EEF0F4]'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#9CA3AF]">{label}</p>
          <p className="mt-1.5 text-[26px] font-black tabular-nums leading-none tracking-[-0.05em] text-[#111827]">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-[12px] font-medium leading-snug text-[#6B7280]">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-white text-[#6B7280]">
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block no-underline">
        {body}
      </Link>
    );
  }

  return body;
}

export function CrmSectionCard({
  title,
  description,
  children,
  action,
  className = '',
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${crmCardClass} ${crmCardPad} ${className}`}>
      {title || description || action ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-[13px] font-medium text-[#6B7280]">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function CrmEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: ReactNode;
}) {
  const actionClass =
    'mt-5 inline-flex min-h-11 items-center justify-center rounded-[14px] bg-[#FFF1F4] px-5 text-[14px] font-bold text-[#ff5f7a] ring-1 ring-[#FDE8ED] transition hover:bg-[#FFE4EA] active:scale-[0.98]';

  return (
    <div className="flex flex-col items-center rounded-[16px] border border-dashed border-[#EAECEF] bg-[#FAFAFA] px-6 py-10 text-center">
      {icon ? <div className="mb-3 text-[#ff5f7a]">{icon}</div> : null}
      <p className="text-[16px] font-bold text-[#111827]">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[#6B7280]">{description}</p>
      ) : null}
      {actionLabel && actionHref ? (
        <Link to={actionHref} className={actionClass}>
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <button type="button" onClick={onAction} className={actionClass}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function CrmErrorState({
  message,
  onRetry,
  retryLabel = 'Повторить',
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      className="rounded-[16px] border border-[#FECACA] bg-[#FEF2F2] px-5 py-4"
      role="alert"
    >
      <p className="text-[14px] font-semibold leading-relaxed text-[#991B1B]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex min-h-10 items-center rounded-[12px] bg-white px-4 text-[13px] font-bold text-[#B91C1C] ring-1 ring-[#FECACA] transition hover:bg-[#FFF5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/30"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

export function CrmLoadingSkeleton({ rows = 3, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`} aria-busy="true" aria-label="Загрузка">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-[12px] bg-[#F3F4F6]" />
      ))}
    </div>
  );
}

export function CrmStatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'pink' | 'violet';
  children: ReactNode;
}) {
  const tones = {
    neutral: 'bg-[#F3F4F6] text-[#6B7280]',
    success: 'bg-[#ECFDF5] text-[#059669]',
    warning: 'bg-[#FFFBEB] text-[#B45309]',
    danger: 'bg-[#FEF2F2] text-[#B91C1C]',
    pink: 'bg-[#FFF1F4] text-[#ff5f7a]',
    violet: 'bg-[#F5F3FF] text-[#A78BFA]',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export type CrmFilterChip = {
  id: string;
  label: string;
  count?: number;
};

export function CrmFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Поиск…',
  chips,
  activeChipId,
  onChipChange,
}: {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  chips?: CrmFilterChip[];
  activeChipId?: string;
  onChipChange?: (id: string) => void;
}) {
  const showSearch = onSearchChange != null;
  const showChips = chips && chips.length > 0 && onChipChange;

  if (!showSearch && !showChips) return null;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {showSearch ? (
        <label className="relative block min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">{searchPlaceholder}</span>
          <HiMagnifyingGlass
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
            aria-hidden
          />
          <input
            type="search"
            value={searchValue ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-[12px] border-0 bg-[#F6F7FB] py-2.5 pl-10 pr-3 text-[14px] text-[#111827] outline-none ring-1 ring-[#EEEEEE] transition placeholder:text-[#9CA3AF] focus:bg-white focus:ring-[#ff5f7a]/30"
          />
        </label>
      ) : null}
      {showChips ? (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => {
            const active = chip.id === activeChipId;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => onChipChange(chip.id)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition ${
                  active
                    ? 'bg-[#111827] text-white'
                    : 'bg-[#F6F7FB] text-[#6B7280] ring-1 ring-[#EEEEEE] hover:bg-[#EEF0F4]'
                }`}
              >
                {chip.label}
                {chip.count != null ? (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ${
                      active ? 'bg-white/20 text-white' : 'bg-white text-[#9CA3AF]'
                    }`}
                  >
                    {chip.count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function CrmQuickActionCard({
  label,
  icon,
  to,
  onClick,
  accent,
}: {
  label: string;
  icon: ReactNode;
  to?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  const className = `flex min-h-11 w-full flex-col items-center justify-center gap-1.5 rounded-[14px] px-2 py-3 text-center transition active:scale-[0.98] ${
    accent
      ? 'bg-[#FFF1F4] text-[#ff5f7a] ring-1 ring-[#FDE8ED] hover:bg-[#FFE4EA]'
      : 'bg-[#f6f7fb] text-[#111827] hover:bg-[#EEF0F4]'
  }`;

  const content = (
    <>
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-[12px] ${
          accent ? 'bg-white text-[#ff5f7a]' : 'bg-white text-[#6B7280]'
        }`}
      >
        {icon}
      </span>
      <span className="text-[12px] font-bold leading-tight">{label}</span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link to={to ?? '#'} className={className}>
      {content}
    </Link>
  );
}
