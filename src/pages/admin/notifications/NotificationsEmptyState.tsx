import type { ReactNode } from 'react';
import { notifCard, notifEmptyIcon } from './adminNotificationsTheme';

type Props = {
  title: string;
  text: string;
  icon?: ReactNode;
};

export function NotificationsEmptyState({ title, text, icon }: Props) {
  return (
    <section className={`${notifCard} flex flex-col items-center px-6 py-10 text-center`}>
      {icon ?? (
        <span className={notifEmptyIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <h3 className="mt-5 text-[18px] font-black tracking-[-0.03em] text-[#111827]">{title}</h3>
      <p className="mt-2 max-w-[18rem] text-[15px] leading-relaxed text-[#6B7280]">{text}</p>
    </section>
  );
}
