import type { ComponentType, ReactNode } from 'react';
import { ADMIN_SEGMENT_NAV_DESKTOP, ADMIN_SEGMENT_NAV_MOBILE } from '../adminCabinetLayout';
import { sheetSegmentClass } from '../profile/adminProfileCabinetTheme';
import { scheduleSegmentClass } from '../schedule/adminScheduleTheme';
import { adminMobileSegmentTabClass } from './adminMobileTabBarTheme';

export type AdminSegmentTab<T extends string> = {
  id: T;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

type Props<T extends string> = {
  tabs: AdminSegmentTab<T>[];
  active: T;
  onChange: (tab: T) => void;
  ariaLabel: string;
  /** `schedule` — синий акцент (страница расписания). */
  accent?: 'brand' | 'schedule';
  desktopClassName?: string;
  /** `mobile` — только нижняя панель; `desktop` — только верхние табы на lg+. */
  mode?: 'both' | 'mobile' | 'desktop';
  renderTabBadge?: (tabId: T) => ReactNode;
};

function SegmentButtons<T extends string>({
  tabs,
  active,
  onChange,
  compact,
  accent = 'brand',
  renderTabBadge,
}: {
  tabs: AdminSegmentTab<T>[];
  active: T;
  onChange: (tab: T) => void;
  compact?: boolean;
  accent?: 'brand' | 'schedule';
  renderTabBadge?: (tabId: T) => ReactNode;
}) {
  const desktopSegmentClass = accent === 'schedule' ? scheduleSegmentClass : sheetSegmentClass;

  return (
    <>
      {tabs.map(({ id, label, Icon }) => {
        const selected = active === id;
        const btnClass = compact
          ? adminMobileSegmentTabClass(selected, accent)
          : `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[10px] px-3 py-2.5 transition active:scale-[0.98] lg:flex-row lg:gap-2 ${desktopSegmentClass(selected)}`;

        const badge = renderTabBadge?.(id);

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`${btnClass} ${badge ? 'relative' : ''}`}
          >
            <Icon
              className={`shrink-0 ${compact ? 'h-[22px] w-[22px]' : 'h-5 w-5'}`}
              aria-hidden
            />
            <span
              className={`max-w-full truncate font-bold leading-none ${
                compact ? 'text-[10px] sm:text-[11px]' : 'text-[12px] lg:text-[13px]'
              }`}
            >
              {label}
            </span>
            {badge}
          </button>
        );
      })}
    </>
  );
}

/** Нижняя панель на мобиле + горизонтальные табы на десктопе (кабинет мастера). */
export function AdminSegmentTabNav<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  desktopClassName,
  accent = 'brand',
  mode = 'both',
  renderTabBadge,
}: Props<T>) {
  const desktopNav = (
    <nav
      className={desktopClassName ?? ADMIN_SEGMENT_NAV_DESKTOP}
      aria-label={ariaLabel}
    >
      <SegmentButtons
        tabs={tabs}
        active={active}
        onChange={onChange}
        accent={accent}
        renderTabBadge={renderTabBadge}
      />
    </nav>
  );

  const mobileNav = (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <nav
        className={ADMIN_SEGMENT_NAV_MOBILE}
        style={{ minHeight: '3.5rem' }}
        aria-label={ariaLabel}
      >
        <SegmentButtons
          tabs={tabs}
          active={active}
          onChange={onChange}
          compact
          accent={accent}
          renderTabBadge={renderTabBadge}
        />
      </nav>
    </div>
  );

  if (mode === 'mobile') return mobileNav;
  if (mode === 'desktop') return <div className="mb-4 hidden lg:block">{desktopNav}</div>;

  return (
    <>
      <div className="mb-4 hidden lg:block">{desktopNav}</div>
      {mobileNav}
    </>
  );
}
