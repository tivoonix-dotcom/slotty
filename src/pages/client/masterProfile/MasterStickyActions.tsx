import { HiCalendarDays, HiPaperAirplane, HiPhone } from 'react-icons/hi2';
import { clientPinkBtn, clientOutlineBtn } from '../clientTheme';
import { buildTelHref, telegramUrlFromContact } from './masterProfileUtils';

type Props = {
  onChooseTime: () => void;
  phone?: string;
  contact?: string;
  onContactUnavailable?: () => void;
};

export function MasterStickyActions({
  onChooseTime,
  phone,
  contact,
  onContactUnavailable,
}: Props) {
  const telHref = phone ? buildTelHref(phone) : null;
  const tgHref = contact ? telegramUrlFromContact(contact) : null;

  const onMessage = () => {
    if (tgHref) {
      window.open(tgHref, '_blank', 'noopener,noreferrer');
      return;
    }
    onContactUnavailable?.();
  };

  return (
    <div className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-40 border-t border-[#F3F4F6]/80 bg-white/95 px-4 py-3 shadow-[0_-8px_32px_rgba(17,24,39,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <button type="button" onClick={onChooseTime} className={`${clientPinkBtn} min-h-12 flex-1 gap-2`}>
          <HiCalendarDays className="h-5 w-5" aria-hidden />
          Выбрать время
        </button>
        <button
          type="button"
          onClick={onMessage}
          className={`${clientOutlineBtn} min-h-12 flex-1 gap-1.5 !px-3`}
        >
          <HiPaperAirplane className="h-4 w-4" aria-hidden />
          Написать
        </button>
        {telHref ? (
          <a
            href={telHref}
            aria-label="Позвонить"
            className={`${clientOutlineBtn} !min-h-12 !w-12 !shrink-0 !p-0`}
          >
            <HiPhone className="h-5 w-5" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
}
