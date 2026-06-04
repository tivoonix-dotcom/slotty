import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { MASTER_SETTINGS_PATH } from '../../../../app/paths';

type Props = {
  breadcrumb: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function SettingsHeader({ breadcrumb, title, description, actions }: Props) {
  return (
    <header className="mb-6 min-w-0">
      <nav className="text-[13px] text-[#9CA3AF]" aria-label="Хлебные крошки">
        <Link to={MASTER_SETTINGS_PATH} className="transition hover:text-[#6B7280]">
          Настройки
        </Link>
        <span className="mx-1.5" aria-hidden>
          /
        </span>
        <span className="text-[#6B7280]">{breadcrumb}</span>
      </nav>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold tracking-[-0.04em] text-[#111827] lg:text-[28px]">{title}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#6B7280]">{description}</p>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
