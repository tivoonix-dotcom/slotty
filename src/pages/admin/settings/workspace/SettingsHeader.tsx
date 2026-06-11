import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MASTER_SETTINGS_PATH } from '../../../../app/paths';
import { useSettingsShell } from './settingsShellContext';

function IconSettingsMenu({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 6h16M4 12h10M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  breadcrumb: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function SettingsHeader({ breadcrumb, title, description, actions }: Props) {
  const shell = useSettingsShell();

  return (
    <header className="mb-6 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <nav className="min-w-0 flex-1 text-[13px] text-[#9CA3AF]" aria-label="Хлебные крошки">
          <Link to={MASTER_SETTINGS_PATH} className="transition hover:text-[#6B7280]">
            Настройки
          </Link>
          <span className="mx-1.5" aria-hidden>
            /
          </span>
          <span className="text-[#6B7280]">{breadcrumb}</span>
        </nav>
        {shell ? (
          <button
            type="button"
            onClick={shell.openSettingsMenu}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#F5F5F5] text-[#111827] transition hover:bg-[#EBEBEB] active:scale-[0.97] lg:hidden"
            aria-label="Меню настроек"
          >
            <IconSettingsMenu />
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold tracking-[-0.04em] text-[#111827] lg:text-[28px]">{title}</h1>
          {description.trim() ? (
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
