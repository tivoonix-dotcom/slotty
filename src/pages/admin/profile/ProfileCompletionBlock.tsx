import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
import { ADMIN_PROFILE_COMPLETION_PATH } from '../../../app/paths';
import { computeProfileCompletion } from '../../../features/admin/lib/profileCompletion';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { cabinetCard, cabinetCardPad } from './adminProfileCabinetTheme';
import { useProfileCompletionSlots } from './useProfileCompletionSlots';

export type ProfileCompletionHandlers = {
  onEditMain: () => void;
  onGoServices: () => void;
  onGoSchedule: () => void;
  onGoAddress: () => void;
  onGoPortfolio: () => void;
  onGoRules: () => void;
};

type Props = {
  draft: MasterDraft;
  /** Оставлено для совместимости; действия — на странице заполненности. */
  handlers?: ProfileCompletionHandlers;
  surfaceClassName?: string;
};

const defaultSurfaceClass = `${cabinetCard} ${cabinetCardPad}`;

function statusCaption(
  percent: number,
  loading: boolean,
  isFullyReady: boolean,
  isContentComplete: boolean,
  isPublished: boolean,
): string {
  if (loading) return 'Проверяем данные профиля…';
  if (isFullyReady) return 'Профиль готов — клиенты могут записываться';
  if (isContentComplete && !isPublished) return 'Заполнено — осталось опубликовать профиль';
  if (percent >= 100) return 'Почти готово';
  return 'Заполните разделы, чтобы клиенты доверяли профилю';
}

export function ProfileCompletionBlock({ draft, surfaceClassName }: Props) {
  const surface = surfaceClassName ?? defaultSurfaceClass;
  const { useCabinetApi, cabinetLoading, cabinetError, publicationStatus } = useAdminMasterCabinet();

  const { activeBookableSlots, slotsLoading } = useProfileCompletionSlots(
    useCabinetApi,
    cabinetLoading,
  );

  const completion = useMemo(
    () =>
      computeProfileCompletion({
        draft,
        publicationStatus,
        activeBookableSlots,
        useCabinetApi,
        cabinetLoading,
        slotsLoading,
      }),
    [draft, publicationStatus, activeBookableSlots, useCabinetApi, cabinetLoading, slotsLoading],
  );

  const percent = Math.min(100, Math.max(0, completion.percent));
  const showLoading = useCabinetApi && (cabinetLoading || slotsLoading) && !completion.readinessKnown;
  const displayPercent = showLoading ? Math.min(percent, 99) : percent;

  if (cabinetError && useCabinetApi) {
    return (
      <section className={surface}>
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Завершение профиля</h2>
        <p className="mt-2 text-[14px] leading-snug text-[#6B7280]">
          Не удалось загрузить данные кабинета. Обновите страницу.
        </p>
      </section>
    );
  }

  const caption = statusCaption(
    displayPercent,
    showLoading,
    completion.isFullyReady,
    completion.isContentComplete,
    completion.isPublished,
  );

  const linkLabel = completion.isFullyReady ? 'Подробнее' : 'Что ещё сделать';

  return (
    <section className={surface}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Завершение профиля</h2>
        <span className="text-[15px] font-semibold tabular-nums text-[#F47C8C]">
          {showLoading ? '…' : `${displayPercent}%`}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F7F7F8]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#F47C8C] to-[#F26D83] transition-[width] duration-500"
          style={{ width: `${displayPercent}%` }}
        />
      </div>

      <p className="mt-3 text-[14px] leading-snug text-[#6B7280]">{caption}</p>

      <Link
        to={ADMIN_PROFILE_COMPLETION_PATH}
        className="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-[#F47C8C] no-underline transition hover:text-[#e84d68]"
      >
        {linkLabel}
        <HiArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </section>
  );
}
