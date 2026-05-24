import { useCallback, useMemo } from 'react';
import { CLIENT_STICKY_BELOW_HEADER } from '../clientNavConstants';
import { HiCalendarDays, HiPhone } from 'react-icons/hi2';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import { openPhoneDial, resolveMasterCallablePhone } from './masterProfileUtils';
import {
  catalogDesktopPanel,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
  masterProfileMutedPanel,
} from './masterProfileTheme';

type Props = {
  master: ExtendedMasterProfile;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  onChooseTime: () => void;
  onPhoneUnavailable?: () => void;
};

export function MasterProfileDesktopSidebar({
  master,
  nearest,
  nearestLoading,
  onChooseTime,
  onPhoneUnavailable,
}: Props) {
  const callablePhone = useMemo(
    () => resolveMasterCallablePhone(master.phone, master.contact),
    [master.contact, master.phone],
  );
  const hasSlot = Boolean(nearest?.label);

  const handleCall = useCallback(() => {
    if (callablePhone && openPhoneDial(callablePhone)) return;
    onPhoneUnavailable?.();
  }, [callablePhone, onPhoneUnavailable]);

  return (
    <aside className={`min-w-0 xl:sticky xl:self-start ${CLIENT_STICKY_BELOW_HEADER}`}>
      <div className={`${catalogDesktopPanel} space-y-4 p-5`}>
        <div>
          <p className="text-[20px] font-bold tracking-[-0.03em] text-[#111827]">Запись</p>
          <p className="mt-0.5 text-[14px] text-[#6B7280]">Выберите услугу и удобное время</p>
        </div>

        <div className={`${masterProfileMutedPanel} p-4`}>
          <p className="text-[12px] font-medium text-[#8E8E93]">Ближайшее окно</p>
          <p className="mt-1 text-[16px] font-bold text-[#111827]">
            {nearestLoading
              ? 'Загрузка…'
              : hasSlot
                ? nearest!.label
                : 'Свободных окон пока нет'}
          </p>
        </div>

        <button type="button" onClick={onChooseTime} className={`${catalogPrimaryBtn} w-full min-h-[48px] gap-2`}>
          <HiCalendarDays className="h-5 w-5" aria-hidden />
          {hasSlot ? 'Выбрать время' : 'Смотреть услуги'}
        </button>

        <button type="button" onClick={handleCall} className={`${catalogSecondaryBtn} w-full min-h-[44px] gap-2`}>
          <HiPhone className="h-4 w-4" aria-hidden />
          Позвонить
        </button>

        <p className="text-center text-[12px] leading-relaxed text-[#9CA3AF]">
          Бесплатная отмена за 24 часа · напоминание в Telegram
        </p>
      </div>
    </aside>
  );
}
