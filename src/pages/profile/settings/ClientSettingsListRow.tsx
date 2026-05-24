import type { ReactNode } from 'react';
import {
  settingsCardClass,
  settingsCardInnerDivider,
  settingsRowActionClass,
  settingsRowClass,
  settingsRowIconClass,
  settingsSectionTitleClass,
} from './clientSettingsTheme';

export function SettingsListCard({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section>
      {title ? <h2 className={settingsSectionTitleClass}>{title}</h2> : null}
      <div className={`${settingsCardClass} ${settingsCardInnerDivider}`}>{children}</div>
    </section>
  );
}

export function SettingsListRow({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className={settingsRowClass}>
      <span className={settingsRowIconClass}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-[#111827]">{title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{subtitle}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SettingsRowButton({
  children,
  onClick,
  disabled,
  href,
  external,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  href?: string;
  external?: boolean;
}) {
  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={settingsRowActionClass}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={settingsRowActionClass}>
      {children}
    </button>
  );
}
