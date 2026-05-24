import { useMemo, useState } from 'react';
import { HiCheck, HiFunnel, HiReceiptPercent } from 'react-icons/hi2';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import {
  servicesCard,
  servicesChipActive,
  servicesDesktopCardPad,
  servicesIconCircle,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import { PromotionBannerCard } from './PromotionBannerCard';
import type { ManagedService } from './servicesFormat';
import { derivePromotionStatus } from './servicesFormat';
import { normalizePromotion } from './promotionNormalize';
import type { ServicePromotion, ServicePromotionStatus } from './servicesTypes';
import { ServicesExtrasProPreview } from './ServicesExtrasProPreview';
import { ServicesPromotionMenuSheet } from './ServicesPromotionMenuSheet';
import { ServicesTabFab } from './ServicesTabFab';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';

type PromoFilter = 'all' | ServicePromotionStatus;

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  promotions: ServicePromotion[];
  extrasLocked?: boolean;
  onConnectPro?: () => void;
  onExtrasLocked?: () => void;
  onCreate: () => void;
  onEdit: (promo: ServicePromotion) => void;
  onDelete: (id: string) => void;
};

const FILTER_OPTIONS: Array<{ id: PromoFilter; label: string; hint: string }> = [
  { id: 'all', label: 'Все', hint: 'Показать все акции' },
  { id: 'active', label: 'Активные', hint: 'Сейчас действуют' },
  { id: 'scheduled', label: 'Запланированные', hint: 'Начнутся позже' },
  { id: 'finished', label: 'Завершённые', hint: 'Срок акции истёк' },
  { id: 'draft', label: 'Черновики', hint: 'Ещё не опубликованы' },
];

function promoCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return `${n} акций`;
  if (mod10 === 1) return `${n} акция`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} акции`;

  return `${n} акций`;
}

export function ServicesPromotionsTab({
  draft,
  services,
  promotions,
  extrasLocked = false,
  onConnectPro,
  onExtrasLocked,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<PromoFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [menuPromo, setMenuPromo] = useState<ServicePromotion | null>(null);

  const connectPro = onConnectPro ?? onExtrasLocked ?? (() => {});

  const rows = useMemo(() => {
    return promotions
      .map((p) => {
        const normalized = normalizePromotion(p);
        const serviceTitle =
          normalized.serviceTitle ||
          services.find((s) => s.id === normalized.serviceId)?.title ||
          '';

        return {
          ...normalized,
          serviceTitle,
          status: derivePromotionStatus(normalized),
        };
      })
      .filter((p) => filter === 'all' || p.status === filter)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [filter, promotions, services]);

  const activeFilterLabel = FILTER_OPTIONS.find((o) => o.id === filter)?.label ?? 'Все';
  const filterIsActive = filter !== 'all';

  const pickFilter = (id: PromoFilter) => {
    setFilter(id);
    setFilterOpen(false);
  };

  const tryCreate = () => {
    if (extrasLocked) {
      connectPro();
      return;
    }
    onCreate();
  };

  if (extrasLocked) {
    return (
      <ServicesExtrasProPreview
        variant="promotions"
        draft={draft}
        services={services}
        onConnectPro={connectPro}
      />
    );
  }

  return (
    <div className={`relative space-y-4 lg:space-y-0 ${servicesTabPanelShell} lg:overflow-hidden`}>
      <div className={`space-y-4 lg:space-y-5 ${servicesTabScrollBottomPad} ${servicesDesktopCardPad}`}>
        <div>
          <h2 className="text-[18px] font-black tracking-[-0.04em] text-[#111827] lg:text-[22px] lg:tracking-[-0.05em]">
            Акции
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            {promotions.length > 0
              ? promoCountLabel(promotions.length)
              : 'Скидки и спецпредложения для клиентов'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 lg:justify-start lg:gap-3">
          <p className="text-[12px] font-semibold text-[#9CA3AF] lg:hidden">
            Новая акция — кнопка «+» внизу справа
          </p>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] border transition active:scale-[0.96] lg:min-h-12 lg:w-auto lg:gap-2 lg:px-4 lg:text-[14px] lg:font-bold ${
              filterIsActive
                ? 'border-[#FDE8ED] bg-[#FFF1F4] text-[#F47C8C] shadow-[inset_0_0_0_1px_rgba(244,124,140,0.12)]'
                : 'border-[#EAECEF] bg-white text-[#6B7280]'
            }`}
            aria-label={`Фильтр: ${activeFilterLabel}`}
            aria-expanded={filterOpen}
          >
            <HiFunnel className="h-5 w-5 shrink-0" aria-hidden />
            <span className="hidden lg:inline">{activeFilterLabel}</span>
          </button>
        </div>

        {rows.length === 0 ? (
          <div className={`${servicesCard} p-6 text-center lg:rounded-[24px]`}>
            <span className={`${servicesIconCircle} mx-auto flex h-16 w-16 items-center justify-center rounded-[22px]`}>
              <HiReceiptPercent className="h-8 w-8" aria-hidden />
            </span>
            <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827] lg:text-[20px]">
              {promotions.length === 0 ? 'Акций пока нет' : 'Ничего не найдено'}
            </h3>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
              {promotions.length === 0
                ? 'Нажмите «+» внизу справа — баннер появится в каталоге и при записи.'
                : 'Попробуйте другой фильтр или создайте акцию через «+»'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3.5 lg:space-y-4 lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-4">
            {rows.map((promo) => (
              <li key={promo.id}>
                <PromotionBannerCard
                  promo={promo}
                  onMenu={() => setMenuPromo(promo)}
                  className="lg:min-h-[176px]"
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ServicesTabFab ariaLabel="Создать акцию" onClick={tryCreate} />

      <AdminBottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Фильтр акций">
        <div className="space-y-2 pb-2">
          {FILTER_OPTIONS.map((option) => {
            const selected = filter === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => pickFilter(option.id)}
                className={`flex w-full items-center gap-3 rounded-[18px] border px-4 py-3.5 text-left transition active:scale-[0.98] ${
                  selected
                    ? servicesChipActive
                    : 'border-[#EAECEF] bg-white hover:border-[#FDE8ED] hover:bg-[#FAFAFA]'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-[#111827]">{option.label}</span>
                  <span className="mt-0.5 block text-[12px] font-medium text-[#9CA3AF]">
                    {option.hint}
                  </span>
                </span>
                {selected ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F47C8C] text-white">
                    <HiCheck className="h-5 w-5" aria-hidden />
                  </span>
                ) : (
                  <span
                    className="h-8 w-8 shrink-0 rounded-full border border-[#EAECEF] bg-[#FAFAFA]"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      </AdminBottomSheet>

      <ServicesPromotionMenuSheet
        open={Boolean(menuPromo)}
        promo={menuPromo}
        onClose={() => setMenuPromo(null)}
        onEdit={() => {
          if (menuPromo) onEdit(menuPromo);
          setMenuPromo(null);
        }}
        onDelete={() => {
          if (menuPromo) onDelete(menuPromo.id);
          setMenuPromo(null);
        }}
      />
    </div>
  );
}
