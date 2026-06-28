import { useState } from 'react';
import { HiCalendarDays, HiHomeModern, HiMapPin } from 'react-icons/hi2';
import { masterShowsVerifiedBadge } from '../../../features/masters/lib/masterVerifiedBadge';
import { MasterInlineBadges } from '../../../shared/ui/MasterInlineBadges';
import { formatMasterCardSpecialty } from '../lib/catalogFormat';
import { clientPinkBtn } from '../clientTheme';
import type { ExtendedMasterProfile, NearestSlotInfo } from './types';
import { formatMasterProfileLocationChip, visitChipLabel } from './masterProfileUtils';
import { MasterPublicPortraitOverlap } from './MasterPublicCoverBanner';
import { MasterProfileTrustChips } from './MasterProfileTrustChips';
import { masterProfileCard } from './masterProfileTheme';

type Props = {
  master: ExtendedMasterProfile;
  nearest?: NearestSlotInfo | null;
  nearestLoading?: boolean;
  layout?: 'desktop' | 'mobile';
  onChooseTime?: () => void;
  className?: string;
  embeddedPreview?: boolean;
};

function LocationChips({
  locationChip,
  visitChip,
}: {
  locationChip: string;
  visitChip: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-[10px] bg-[#F5F5F5] px-3 py-2 text-[13px] font-medium text-[#374151]">
        <HiMapPin className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        <span className="truncate">{locationChip}</span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#F5F5F5] px-3 py-2 text-[13px] font-medium text-[#374151]">
        <HiHomeModern className="h-4 w-4 shrink-0 text-[#9CA3AF]" aria-hidden />
        {visitChip}
      </span>
    </div>
  );
}

export function MasterPublicHeroProfileCard({
  master,
  nearest,
  nearestLoading,
  layout = 'desktop',
  onChooseTime,
  className = '',
  embeddedPreview = false,
}: Props) {
  const isMobile = layout === 'mobile';
  const isEmbeddedMobile = isMobile && embeddedPreview;
  const visitChip = visitChipLabel(master.location.visitType);
  const locationChip = formatMasterProfileLocationChip(master.location);
  const showVerified = masterShowsVerifiedBadge(master);
  const showPro = master.isProEntitled === true;
  const hasSlot = Boolean(nearest?.label);
  const [bioExpanded, setBioExpanded] = useState(false);
  const bio = master.bio?.trim() ?? '';
  const bioCollapsible = bio.length > 100;

  const avatarSize = isEmbeddedMobile
    ? 'h-[96px] w-[96px]'
    : isMobile
      ? 'h-[112px] w-[112px]'
      : 'h-[148px] w-[148px] lg:h-[168px] lg:w-[168px]';
  const portraitLiftClass = isEmbeddedMobile
    ? '-mt-[36px]'
    : isMobile
      ? '-mt-[44px]'
      : '-mt-[52px] lg:-mt-[60px]';
  const identityPt = isEmbeddedMobile ? 'pt-8' : isMobile ? 'pt-10' : 'pt-11 lg:pt-12';

  return (
    <div className={`${masterProfileCard} relative z-[1] ${className}`}>
      <div className={`bg-white ${isEmbeddedMobile ? 'px-3 pb-3' : isMobile ? 'px-4 pb-4' : 'px-6 pb-6 lg:px-8'}`}>
        <div className={`${isEmbeddedMobile ? 'pt-1' : isMobile ? 'pt-2' : 'pt-4 lg:pt-5'}`}>
          <div className="flex min-w-0 gap-3 sm:gap-5 lg:gap-7 xl:gap-8">
            <MasterPublicPortraitOverlap
              master={master}
              className={`relative z-10 shrink-0 ${avatarSize} ${portraitLiftClass}`}
            />

            <div className={`min-w-0 flex-1 ${identityPt}`}>
              <div className="flex items-start gap-1.5">
                <h1
                  className={`min-w-0 flex-1 font-bold leading-tight tracking-[-0.03em] text-[#111827] ${
                    isEmbeddedMobile ? 'text-[18px]' : isMobile ? 'text-[20px]' : 'text-[24px] lg:text-[28px]'
                  }`}
                >
                  {master.masterName}
                </h1>
                {showVerified || showPro ? (
                  <MasterInlineBadges
                    verified={showVerified}
                    pro={showPro}
                    size={isMobile ? 'sm' : 'md'}
                    className={isMobile ? 'mt-1' : 'mt-1.5'}
                  />
                ) : null}
              </div>

              <p className={`mt-1 font-medium text-[#6B7280] ${isMobile ? 'text-[14px]' : 'text-[15px]'}`}>
                {formatMasterCardSpecialty(master.category)}
              </p>

              {bio ? (
                <>
                  <p
                    className={`mt-2.5 leading-relaxed text-[#6B7280] ${
                      bioCollapsible && !bioExpanded ? 'line-clamp-3' : ''
                    } ${isMobile ? 'text-[13px]' : 'text-[14px]'}`}
                  >
                    {bio}
                  </p>
                  {bioCollapsible ? (
                    <button
                      type="button"
                      onClick={() => setBioExpanded((v) => !v)}
                      className="mt-1 text-[13px] font-semibold text-[#F47C8C]"
                    >
                      {bioExpanded ? 'Свернуть' : 'Показать все'}
                    </button>
                  ) : null}
                </>
              ) : null}

              {!isEmbeddedMobile ? (
                <MasterProfileTrustChips master={master} hasAvailableSlot={hasSlot} />
              ) : null}

              {!isMobile ? (
                <div className="mt-4 hidden max-w-xl lg:block">
                  <LocationChips locationChip={locationChip} visitChip={visitChip} />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {isMobile ? (
          <div className="mt-3 px-0 pb-0">
            <LocationChips locationChip={locationChip} visitChip={visitChip} />
          </div>
        ) : null}

        {isMobile ? (
          <div className="mt-4 rounded-[16px] border border-[#F0F0F0] bg-[#FAFAFA] px-3.5 py-3">
            <div className="flex items-start gap-2.5">
              <HiCalendarDays
                className={`mt-0.5 h-5 w-5 shrink-0 ${hasSlot || nearestLoading ? 'text-[#F47C8C]' : 'text-[#9CA3AF]'}`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-[#9CA3AF]">Ближайшее окно</p>
                <p className="mt-0.5 text-[14px] font-semibold leading-snug text-[#111827]">
                  {nearestLoading
                    ? 'Ищем ближайшее окно…'
                    : hasSlot
                      ? nearest!.label
                      : 'Свободных окон пока нет'}
                </p>
              </div>
            </div>

            {onChooseTime ? (
              <button
                type="button"
                onClick={onChooseTime}
                className={`${clientPinkBtn} mt-3 flex w-full items-center justify-center gap-1.5 !min-h-11 !rounded-[10px] !text-[14px]`}
              >
                <HiCalendarDays className="h-4 w-4" aria-hidden />
                {hasSlot ? 'Выбрать время' : 'Смотреть услуги'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
