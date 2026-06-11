import type { ReactNode } from 'react';
import { MiniPicture } from '../../../shared/ui/MiniPicture';
import { notifCardShell } from './adminNotificationsTheme';

type Props = {
  title: string;
  text: string;
  icon?: ReactNode;
};

export function NotificationsEmptyState({ title, text, icon }: Props) {
  return (
    <section className={notifCardShell}>
      <div className="flex flex-col items-center px-5 py-8 text-center sm:px-8 sm:py-10">
        {icon ?? <MiniPicture name="notificationsEmpty" variant="empty" className="mb-1" />}
        <h3 className="mt-4 text-[18px] font-black tracking-[-0.04em] text-[#111827] sm:text-[20px]">{title}</h3>
        <p className="mt-2 max-w-[22rem] text-[14px] leading-relaxed text-[#6B7280] sm:leading-7">{text}</p>
      </div>
    </section>
  );
}
