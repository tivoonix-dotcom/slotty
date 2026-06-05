import { HiChatBubbleLeftRight, HiChevronRight, HiPhone } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import type { ClientBookingDetail } from './clientBookingDetailTypes';
import { ClientBookingSectionTitle } from './clientBookingDetailUi';
import {
  clientBookingOutlineBtn,
  clientBookingPanel,
  clientBookingProfileLinkBtn,
} from './clientBookingDetailTheme';

type Props = {
  master: NonNullable<ClientBookingDetail['master']>;
  showContactActions: boolean;
};

export function ClientAppointmentMasterCard({ master, showContactActions }: Props) {
  const messageAction =
    master.contact_actions.find((a) => a.href && (a.type === 'telegram' || a.type === 'slotty')) ??
    master.contact_actions.find((a) => a.href && a.type !== 'phone' && a.type !== 'whatsapp') ??
    null;
  const phoneAction =
    master.contact_actions.find((a) => a.href && (a.type === 'phone' || a.type === 'whatsapp')) ??
    null;

  return (
    <div className={`${clientBookingPanel} p-4 lg:p-5`}>
      <ClientBookingSectionTitle>Мастер</ClientBookingSectionTitle>
      <div className="mt-3 flex gap-3">
        {master.photo_url ? (
          <img
            src={master.photo_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F5F5F5] text-[18px] font-bold text-[#9CA3AF]">
            {master.display_name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-bold text-[#111827]">{master.display_name}</p>
          {master.specialty ? (
            <p className="truncate text-[13px] text-[#6B7280]">{master.specialty}</p>
          ) : null}
          {master.reviews_count > 0 ? (
            <p className="mt-0.5 text-[13px] font-semibold text-[#F47C8C]">
              ★ {master.rating.toFixed(1)} · {master.reviews_count} отзывов
            </p>
          ) : null}
        </div>
        {showContactActions ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {messageAction?.href ? (
              <a
                href={messageAction.href}
                aria-label="Написать мастеру"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5] text-[#374151] transition hover:bg-[#EBEBEB]"
              >
                <HiChatBubbleLeftRight className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
            {phoneAction?.href ? (
              <a
                href={phoneAction.href}
                aria-label="Позвонить мастеру"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F5F5] text-[#374151] transition hover:bg-[#EBEBEB]"
              >
                <HiPhone className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
      {showContactActions && !messageAction?.href && !phoneAction?.href ? (
        <p className="mt-3 text-[13px] text-[#6B7280]">
          Свяжитесь с мастером через SLOTTY — напоминания придут в Telegram.
        </p>
      ) : null}
      <Link to={master.profile_path} className={clientBookingProfileLinkBtn}>
        Открыть профиль мастера
        <HiChevronRight className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
      </Link>
      {showContactActions && (messageAction?.href || phoneAction?.href) ? (
        <div className="mt-2 flex flex-wrap gap-2 lg:hidden">
          {messageAction?.href ? (
            <a href={messageAction.href} className={`${clientBookingOutlineBtn} flex-1`}>
              <HiChatBubbleLeftRight className="h-4 w-4 shrink-0" aria-hidden />
              Написать
            </a>
          ) : null}
          {phoneAction?.href ? (
            <a href={phoneAction.href} className={`${clientBookingOutlineBtn} flex-1`}>
              <HiPhone className="h-4 w-4 shrink-0" aria-hidden />
              Позвонить
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
