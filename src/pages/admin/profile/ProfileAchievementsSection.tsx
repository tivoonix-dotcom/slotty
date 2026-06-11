import { useState } from 'react';
import { HiArrowRight } from 'react-icons/hi2';
import { MasterProfileTopAchievements } from '../../client/masterProfile/MasterProfileTopAchievements';
import { MASTER_ACHIEVEMENTS_EMPTY_ART } from '../../client/lib/masterAchievementAssets';
import { MASTER_ACHIEVEMENT_VISUALS } from '../../client/lib/masterAchievementPresentation';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { catalogSheetSecondaryBtn } from '../shared/adminCatalogSheetTheme';
import { ServicesBrandPhotoLayers } from '../services/ServicesBrandPhotoLayers';
import { CabinetIcon } from './cabinetIcons';
import { cabinetCard, cabinetCardPad } from './adminProfileCabinetTheme';
import {
  profileDashboardCard,
  profileDashboardCardPad,
} from './adminProfileDashboardTheme';
import { useAdminProfileAchievements } from './useAdminProfileAchievements';

function achievementsCountLabel(count: number): string {
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} достижений`;
  if (mod10 === 1) return `${n} достижение`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} достижения`;
  return `${n} достижений`;
}

type Props = {
  variant?: 'cabinet' | 'dashboard';
};

export function ProfileAchievementsSection({ variant = 'cabinet' }: Props) {
  const { achievements, ready } = useAdminProfileAchievements();
  const [open, setOpen] = useState(false);

  const surfaceClass =
    variant === 'dashboard'
      ? `${profileDashboardCard} ${profileDashboardCardPad}`
      : `${cabinetCard} ${cabinetCardPad}`;

  return (
    <>
      <section className={surfaceClass}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left transition active:scale-[0.995]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EF4444] text-white">
                <ServicesBrandPhotoLayers roundedClassName="rounded-xl" />
                <span className="relative z-10">
                  <CabinetIcon name="star" size={18} />
                </span>
              </span>
              <div className="min-w-0">
                <h2 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">
                  Достижения
                </h2>
                <p className="mt-0.5 text-[13px] text-[#6B7280]">
                  Как клиенты видят вас в каталоге
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#F47C8C]">
              {ready ? (
                achievements.length > 0 ? achievementsCountLabel(achievements.length) : 'Открыть'
              ) : (
                '…'
              )}
              <HiArrowRight className="h-4 w-4" aria-hidden />
            </span>
          </div>

          <div className="mt-4 rounded-[14px] bg-[#F5F5F5] p-2">
            {!ready ? (
              <p className="px-2 py-6 text-center text-[13px] font-medium text-[#9CA3AF]">
                Загружаем достижения…
              </p>
            ) : achievements.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {achievements.map((achievement) => {
                  const visual = MASTER_ACHIEVEMENT_VISUALS[achievement.id];
                  return (
                    <div
                      key={achievement.id}
                      className="flex w-[10rem] shrink-0 flex-col overflow-hidden rounded-[12px] bg-white"
                    >
                      <div className="relative flex h-[6.5rem] items-center justify-center overflow-hidden bg-[#FAFAFA] px-2 pt-1">
                        <img
                          src={visual.artSrc}
                          alt=""
                          className="max-h-full max-w-full object-contain object-center"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="line-clamp-1 text-[11px] font-bold text-[#111827]">
                          {achievement.title}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[10px] font-medium text-[#6B7280]">
                          {achievement.meta}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex justify-center px-2 py-4">
                <img
                  src={MASTER_ACHIEVEMENTS_EMPTY_ART}
                  alt=""
                  className="h-auto w-full max-w-[240px] object-contain opacity-90"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
          </div>
        </button>
      </section>

      <AdminBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        variant="catalog"
        title="Достижения"
        subtitle="Те же награды, что видят клиенты в каталоге Slotty"
        footer={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`${catalogSheetSecondaryBtn} w-full`}
          >
            Закрыть
          </button>
        }
      >
        <MasterProfileTopAchievements achievements={achievements} ready={ready} bare />
      </AdminBottomSheet>
    </>
  );
}
