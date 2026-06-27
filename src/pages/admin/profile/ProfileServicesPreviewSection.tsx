import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
import { ADMIN_SERVICES_PATH } from '../../../app/paths';
import { getMySlots, type MySlotDto } from '../../../features/admin/api/adminSlotsApi';
import type { MasterDraft, MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { subscribeMasterSlotsChanged } from '../shared/masterSlotsInvalidation';
import { CatalogServiceCard } from '../services/ServicesCatalogServiceCard';
import type { ManagedService } from '../services/servicesFormat';
import { serviceCatalogThumbnailUrl } from '../services/servicesFormat';
import { useServiceBookingStats } from '../services/useServiceBookingStats';
import { ServicesBrandPhotoLayers } from '../services/ServicesBrandPhotoLayers';
import { CabinetIcon } from './cabinetIcons';
import { cabinetCard, cabinetCardPad } from './adminProfileCabinetTheme';
import {
  profileDashboardCard,
  profileDashboardCardPad,
} from './adminProfileDashboardTheme';

function sortServicesForProfilePreview(services: MasterOnboardingService[]): MasterOnboardingService[] {
  return [...services].sort((a, b) => {
    const aVisible = a.isActive !== false ? 0 : 1;
    const bVisible = b.isActive !== false ? 0 : 1;
    if (aVisible !== bVisible) return aVisible - bVisible;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

type Props = {
  /** Мобильный кабинет — `cabinetCard`; десктоп профиля — `profileDashboardCard`. */
  variant?: 'cabinet' | 'dashboard';
  maxItems?: number;
};

export function ProfileServicesPreviewSection({ variant = 'cabinet', maxItems = 4 }: Props) {
  const navigate = useNavigate();
  const { draft, appointments, useCabinetApi } = useAdminMasterCabinet();
  const [slots, setSlots] = useState<MySlotDto[] | null>(null);
  const [slotsReady, setSlotsReady] = useState(!useCabinetApi);

  const reloadSlots = useCallback(() => {
    if (!useCabinetApi) {
      setSlots(null);
      setSlotsReady(true);
      return;
    }
    void getMySlots()
      .then((rows) => {
        setSlots(rows);
        setSlotsReady(true);
      })
      .catch(() => {
        setSlots(null);
        setSlotsReady(true);
      });
  }, [useCabinetApi]);

  useEffect(() => {
    reloadSlots();
  }, [reloadSlots, draft.services.length]);

  useEffect(() => subscribeMasterSlotsChanged(reloadSlots), [reloadSlots]);

  const allServices = draft.services ?? [];
  const previewServices = useMemo(
    () => sortServicesForProfilePreview(allServices).slice(0, maxItems),
    [allServices, maxItems],
  );
  const visibleServicesCount = allServices.filter((s) => s.isActive !== false).length;

  const serviceStats = useServiceBookingStats(
    previewServices.map((s) => ({ id: s.id })),
    slots,
    appointments,
  );

  const statsById = useMemo(
    () => new Map(serviceStats.map((row) => [row.serviceId, row])),
    [serviceStats],
  );

  const surfaceClass =
    variant === 'dashboard'
      ? `${profileDashboardCard} ${profileDashboardCardPad}`
      : `${cabinetCard} ${cabinetCardPad}`;

  const categoryLabel = draft.category?.trim() || null;

  return (
    <section className={surfaceClass}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#EF4444] text-white">
            <ServicesBrandPhotoLayers roundedClassName="rounded-xl" />
            <span className="relative z-10">
              <CabinetIcon name="briefcase" size={18} />
            </span>
          </span>
          <h2 className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">Мои услуги</h2>
        </div>
        <Link
          to={ADMIN_SERVICES_PATH}
          className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#F47C8C] no-underline transition hover:text-[#e84d68]"
        >
          Смотреть все
          <HiArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-4">
        {previewServices.length > 0 ? (
          <>
            {visibleServicesCount === 0 ? (
              <p className="mb-3 rounded-[12px] bg-[#FFF7ED] px-4 py-3 text-[13px] leading-relaxed text-[#B45309]">
                Услуги есть, но скрыты в каталоге. Откройте раздел «Услуги» и нажмите «Показать» у нужной
                позиции.
              </p>
            ) : null}
            <ul className="flex flex-col gap-2.5 rounded-[14px] bg-[#F5F5F5] p-2">
              {previewServices.map((service) => {
                const managed = service as ManagedService;
                const stats = statsById.get(service.id);
                return (
                  <CatalogServiceCard
                    key={service.id}
                    service={managed}
                    imageSrc={serviceCatalogThumbnailUrl(managed, draft as MasterDraft)}
                    categoryLabel={categoryLabel}
                    availableSlotsCount={stats?.availableSlotsCount}
                    upcomingAppointmentsCount={stats?.upcomingAppointmentsCount ?? 0}
                    slotsStatsReady={slotsReady}
                    showMenu={false}
                    onCardClick={() => navigate(ADMIN_SERVICES_PATH)}
                  />
                );
              })}
            </ul>
          </>
        ) : (
          <div className="rounded-[14px] bg-[#F5F5F5] px-4 py-8 text-center">
            <p className="text-[14px] font-medium text-[#6B7280]">Услуги пока не добавлены</p>
            <Link
              to={ADMIN_SERVICES_PATH}
              className="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-[#F47C8C] no-underline"
            >
              Перейти в каталог
              <HiArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
