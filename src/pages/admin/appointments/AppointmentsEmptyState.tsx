import type { ReactNode } from 'react';
import { apptCard, apptEmptyIcon } from './adminAppointmentsTheme';

type Props = {
  title: string;
  text: string;
  hint?: string;
  action?: ReactNode;
  icon?: ReactNode;
};

function DefaultIcon() {
  return (
    <span className={apptEmptyIcon}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function AppointmentsEmptyState({ title, text, hint, action, icon }: Props) {
  return (
    <section className={`${apptCard} flex flex-col items-center px-6 py-10 text-center`}>
      {icon ?? <DefaultIcon />}
      <h3 className="mt-5 text-[18px] font-black tracking-[-0.03em] text-[#111827]">{title}</h3>
      <p className="mt-2 max-w-[18rem] text-[15px] leading-relaxed text-[#6B7280]">{text}</p>
      {hint ? <p className="mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#9CA3AF]">{hint}</p> : null}
      {action ? <div className="mt-6 w-full max-w-[16rem]">{action}</div> : null}
    </section>
  );
}
