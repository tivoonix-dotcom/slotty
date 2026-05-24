import { useCallback, useMemo } from 'react';
import { HiCalendarDays, HiClock, HiPhone } from 'react-icons/hi2';
import { clientPinkBtn, clientOutlineBtn } from '../clientTheme';
import { openPhoneDial, resolveMasterCallablePhone } from './masterProfileUtils';
import type { NearestSlotInfo } from './types';

type Props = {
  onChooseTime: () => void;
  phone?: string;
  contact?: string;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  onPhoneUnavailable?: () => void;
};

export function MasterStickyActions({
  onChooseTime,
  phone,
  contact,
  nearest,
  nearestLoading,
  onPhoneUnavailable,
}: Props) {
  const callablePhone = useMemo(
    () => resolveMasterCallablePhone(phone, contact),
    [contact, phone],
  );
  const hasSlot = Boolean(nearest?.label);

  const handleCall = useCallback(() => {
    if (callablePhone && openPhoneDial(callablePhone)) return;
    onPhoneUnavailable?.();
  }, [callablePhone, onPhoneUnavailable]);

  const callBtnClass = `${clientOutlineBtn} min-h-12 flex-1 gap-1.5 !px-3`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EEEEEE] bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-2.5 backdrop-blur-sm">
      <div className="mx-auto max-w-lg">
        {nearestLoading || hasSlot ? (
          <div className="mb-2 flex items-center gap-2 rounded-[10px] bg-[#FFF1F4] px-3 py-2">
            <HiClock className="h-4 w-4 shrink-0 text-[#F47C8C]" aria-hidden />
            <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#111827]">
              {nearestLoading
                ? 'Ищем ближайшее окно…'
                : `Ближайшее: ${nearest!.label.toLowerCase()}`}
            </p>
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <button type="button" onClick={onChooseTime} className={`${clientPinkBtn} min-h-12 flex-1 gap-2`}>
            <HiCalendarDays className="h-5 w-5" aria-hidden />
            {hasSlot ? 'Выбрать время' : 'Записаться'}
          </button>
          <button type="button" onClick={handleCall} className={callBtnClass}>
            <HiPhone className="h-4 w-4" aria-hidden />
            Позвонить
          </button>
        </div>
      </div>
    </div>
  );
}
