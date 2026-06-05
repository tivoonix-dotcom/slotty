import { useEffect, useMemo, useState } from 'react';
import { HiCheck, HiExclamationTriangle } from 'react-icons/hi2';
import { updateMyMasterProfile } from '../../../features/admin/api/adminProfileApi';
import type { MasterPublicationStatus } from '../../../features/admin/lib/profileCompletion';
import { isMasterProfileActive } from '../../../features/admin/lib/masterProfileActive';
import { useMasterPlatformAccess } from '../../../features/auth/context/MasterPlatformAccessContext';
import { useAuth } from '../../../features/auth/AuthProvider';
import { ADMIN_SIDEBAR_OVERLAY_INSET } from '../adminCabinetLayout';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { assessMasterBookingReadiness } from '../masterReadiness';
import { useProfileCompletionSlots } from './useProfileCompletionSlots';
import { profileDashboardCard, profileDashboardCardPad } from './adminProfileDashboardTheme';
import { extractMasterLastName, lastNameMatchesInput } from './masterProfileLastName';
import { ConfirmModal } from '../../../shared/ui/ConfirmModal';

type Props = {
  publicationStatus: MasterPublicationStatus | null;
  useCabinetApi: boolean;
  /** Имя мастера из кабинета (для подтверждения фамилии). */
  masterDisplayName?: string | null;
};

export function MasterProfileActiveToggle({
  publicationStatus,
  useCabinetApi,
  masterDisplayName,
}: Props) {
  const masterWrite = useMasterPlatformAccess();
  const { profile } = useAuth();
  const { draft, setPublicationStatus, refreshDraft, cabinetLoading } = useAdminMasterCabinet();
  const { activeBookableSlots, slotsLoading, slotsLoadError, reloadSlots } = useProfileCompletionSlots(
    useCabinetApi,
    cabinetLoading,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState(false);
  const [lastNameInput, setLastNameInput] = useState('');

  const fullName = masterDisplayName?.trim() || draft.name?.trim() || profile?.full_name?.trim() || '';
  const expectedLastName = useMemo(() => extractMasterLastName(fullName), [fullName]);
  const lastNameOk = lastNameMatchesInput(expectedLastName, lastNameInput);

  useEffect(() => {
    if (!confirmOff) setLastNameInput('');
  }, [confirmOff]);

  const active = isMasterProfileActive(publicationStatus);
  const blocked = publicationStatus === 'blocked';
  const adminPaused = publicationStatus === 'paused';
  const accountRestricted = !masterWrite.canMutate;
  const disabled = !useCabinetApi || blocked || busy || accountRestricted;

  async function applyStatus(next: MasterPublicationStatus) {
    if (!useCabinetApi) return;
    setBusy(true);
    setError(null);
    try {
      await updateMyMasterProfile({
        publicationStatus: next,
      });
      setPublicationStatus(next);
      await refreshDraft();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить');
      await refreshDraft();
    } finally {
      setBusy(false);
      setConfirmOff(false);
    }
  }

  function onToggleClick() {
    if (disabled || adminPaused) return;
    if (active) {
      setConfirmOff(true);
      return;
    }
    if (slotsLoadError) {
      setError(slotsLoadError);
      return;
    }
    if (slotsLoading || activeBookableSlots === null) {
      setError('Проверяем окна для записи… Попробуйте через секунду.');
      void reloadSlots();
      return;
    }
    const readiness = assessMasterBookingReadiness({
      draft,
      activeSlotCount: activeBookableSlots,
      isPublished: false,
    });
    if (readiness.publishBlockMessage) {
      setError(readiness.publishBlockMessage);
      return;
    }
    void applyStatus('published');
  }

  const toggleTitle = accountRestricted
    ? masterWrite.mutateDisabledTitle
    : adminPaused
      ? 'Профиль на паузе'
      : blocked
        ? 'Профиль заблокирован'
        : active
          ? 'Отключить профиль'
          : 'Включить профиль';

  return (
    <>
      <section className={`${profileDashboardCard} ${profileDashboardCardPad}`}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-[15px] font-semibold text-[#111827] sm:text-[16px]">Видимость профиля</p>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label={toggleTitle}
            disabled={disabled || adminPaused}
            title={toggleTitle}
            onClick={onToggleClick}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-[0.96] ${
              active
                ? 'border-[#ff5f7a] bg-[#ff5f7a] text-white'
                : 'border-[#D1D5DB] bg-white text-transparent'
            } ${disabled || adminPaused ? 'cursor-not-allowed opacity-45' : 'cursor-pointer hover:border-[#ff5f7a]/60'}`}
          >
            <HiCheck className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </button>
        </div>

        {error ? <p className="mt-3 text-[13px] font-medium text-[#DC2626]">{error}</p> : null}
      </section>

      <ConfirmModal
        open={confirmOff}
        overlayInsetClassName={ADMIN_SIDEBAR_OVERLAY_INSET}
        title="Отключить профиль?"
        description="Профиль исчезнет из каталога. Текущие записи сохранятся, но новые клиенты не смогут записаться."
        confirmLabel="Отключить"
        danger
        busy={busy}
        confirmDisabled={!lastNameOk}
        banner={
          <div className="border-b border-[#FFE4EA] bg-gradient-to-b from-[#FFF1F4] to-white px-6 py-5 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C] ring-4 ring-white">
              <HiExclamationTriangle className="h-7 w-7" aria-hidden />
            </span>
            <p className="mt-3 text-[13px] font-semibold uppercase tracking-wide text-[#F47C8C]">
              Внимание
            </p>
          </div>
        }
        onConfirm={() => void applyStatus('hidden')}
        onClose={() => !busy && setConfirmOff(false)}
      >
        <label className="block">
          <span className="text-[13px] font-semibold text-[#374151]">
            Введите свою фамилию для подтверждения
          </span>
          <input
            type="text"
            autoComplete="family-name"
            value={lastNameInput}
            disabled={busy}
            placeholder={expectedLastName || 'Фамилия'}
            onChange={(e) => setLastNameInput(e.target.value)}
            className="mt-2 w-full rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 text-[15px] text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#F47C8C] focus:ring-2 focus:ring-[#FFF1F4]"
          />
        </label>
        {lastNameInput.trim() && !lastNameOk ? (
          <p className="mt-2 text-[13px] font-medium text-[#DC2626]">
            Фамилия не совпадает. Проверьте написание.
          </p>
        ) : null}
      </ConfirmModal>
    </>
  );
}
