import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  /** Если не задано — блок «назад» не показывается. */
  backHref?: string;
  backLabel?: string;
  title: string;
  /** Если не задано или пусто — блок под заголовком не показывается. */
  subtitle?: string;
  children: ReactNode;
};

export function AdminSectionLayout({ backHref, backLabel, title, subtitle, children }: Props) {
  const showBack = Boolean(backHref && backLabel);
  const showSubtitle = Boolean(subtitle?.trim());
  return (
    <div className="px-4 pb-10">
      {showBack ? (
        <Link
          to={backHref!}
          className="inline-flex min-h-10 items-center text-[14px] font-semibold text-neutral-700 underline-offset-2 transition hover:text-neutral-900 hover:underline"
        >
          {backLabel}
        </Link>
      ) : null}
      <h1 className={`text-[26px] font-semibold tracking-[-0.05em] text-neutral-950 ${showBack ? 'mt-4' : 'pt-1'}`}>{title}</h1>
      {showSubtitle ? (
        <p className="mt-2 text-[15px] leading-relaxed text-neutral-600">{subtitle}</p>
      ) : null}
      <div className={showSubtitle ? 'mt-6' : 'mt-4'}>{children}</div>
    </div>
  );
}
