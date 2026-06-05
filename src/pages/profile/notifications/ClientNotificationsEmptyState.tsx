import type { ReactNode } from 'react';
import { HiBellAlert } from 'react-icons/hi2';
import { clientNotificationsCardShell, clientNotificationsIconWrap } from './clientNotificationsTheme';

type Props = {
  title: string;
  text: string;
  icon?: ReactNode;
};

export function ClientNotificationsEmptyState({ title, text, icon }: Props) {
  return (
    <section className={`${clientNotificationsCardShell} flex flex-col items-center px-6 py-9 text-center`}>
      {icon ?? (
        <span className={`${clientNotificationsIconWrap} h-14 w-14`}>
          <HiBellAlert className="h-7 w-7" aria-hidden />
        </span>
      )}
      <h3 className="mt-5 text-[18px] font-bold tracking-[-0.03em] text-[#111827]">{title}</h3>
      <p className="mt-2 max-w-[18rem] text-[15px] leading-relaxed text-[#6B7280]">{text}</p>
    </section>
  );
}
