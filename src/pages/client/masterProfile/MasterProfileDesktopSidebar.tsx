import { useCallback, useMemo } from 'react';
import { HiCalendarDays, HiPhone } from 'react-icons/hi2';
import { masterShowsVerifiedBadge } from '../../../features/masters/lib/masterVerifiedBadge';
import { MasterInlineBadges } from '../../../shared/ui/MasterInlineBadges';
import type { MasterTopAchievement } from '../lib/resolveMasterTopRankStatus';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import { openPhoneDial, resolveMasterCallablePhone } from './masterProfileUtils';
import { MasterProfileSidebarStats } from './MasterProfileSidebarStats';
import {
  catalogDesktopPanel,
  catalogPrimaryBtn,
  catalogSecondaryBtn,
  masterProfileSidebarColClass,
  masterProfileMutedPanel,
} from './masterProfileTheme';

type Props = {
  master: ExtendedMasterProfile;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  topAchievements?: MasterTopAchievement[];
  onChooseTime: () => void;
  onPhoneUnavailable?: () => void;
};

export function MasterProfileDesktopSidebar({
  master,
  nearest,
  nearestLoading,
  topAchievements = [],
  onChooseTime,
  onPhoneUnavailable,
}: Props) {
  const callablePhone = useMemo(
    () => resolveMasterCallablePhone(master.phone, master.contact),
    [master.contact, master.phone],
  );
  const hasSlot = Boolean(nearest?.label);
  const showVerified = masterShowsVerifiedBadge(master);
  const showPro = master.isProEntitled === true;

  const handleCall = useCallback(() => {
    if (callablePhone && openPhoneDial(callablePhone)) return;
    onPhoneUnavailable?.();
  }, [callablePhone, onPhoneUnavailable]);

  return (
    <div className={masterProfileSidebarColClass}>
      <div className={`${catalogDesktopPanel} box-border w-full space-y-4 p-5`}>
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

        <div className="border-t border-[#F0F0F0] pt-4">
          <p className="mb-2 text-[13px] font-medium text-[#8E8E93]">О мастере</p>
          {showVerified || showPro ? (
            <p className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-[#374151]">
              <MasterInlineBadges verified={showVerified} pro={showPro} />
              {showVerified && showPro
                ? 'Проверенный Pro мастер'
                : showPro
                  ? 'Pro мастер'
                  : 'Проверенный мастер'}
            </p>
          ) : null}
          <MasterProfileSidebarStats master={master} topAchievements={topAchievements} />
        </div>
      </div>
    </div>
  );
}
