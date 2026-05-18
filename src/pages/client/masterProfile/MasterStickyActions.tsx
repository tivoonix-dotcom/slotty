import { HiCalendarDays, HiPhone } from 'react-icons/hi2';
import { clientPinkBtn, clientOutlineBtn } from '../clientTheme';
import { buildTelHref } from './masterProfileUtils';

type Props = {
  onChooseTime: () => void;
  phone?: string;
  onPhoneUnavailable?: () => void;
};

export function MasterStickyActions({
  onChooseTime,
  phone,
  onPhoneUnavailable,
}: Props) {
  const telHref = phone ? buildTelHref(phone) : null;

  const callBtnClass = `${clientOutlineBtn} min-h-12 flex-1 gap-1.5 !px-3`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#F3F4F6]/80 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-8px_32px_rgba(17,24,39,0.08)] backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-center gap-2">
        <button type="button" onClick={onChooseTime} className={`${clientPinkBtn} min-h-12 flex-1 gap-2`}>
          <HiCalendarDays className="h-5 w-5" aria-hidden />
          Выбрать время
        </button>
        {telHref ? (
          <a href={telHref} className={callBtnClass}>
            <HiPhone className="h-4 w-4" aria-hidden />
            Позвонить
          </a>
        ) : (
          <button type="button" onClick={() => onPhoneUnavailable?.()} className={callBtnClass}>
            <HiPhone className="h-4 w-4" aria-hidden />
            Позвонить
          </button>
        )}
      </div>
    </div>
  );
}
