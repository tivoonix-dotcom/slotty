import { useMemo, useState } from 'react';
import { HiCalendarDays, HiEllipsisHorizontal, HiReceiptPercent } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCard,
  servicesChip,
  servicesChipActive,
  servicesChipIdle,
  servicesIconCircle,
  servicesPinkBtn,
} from './adminServicesTheme';
import type { ManagedService } from './servicesFormat';
import { derivePromotionStatus, promotionStatusLabel, resolvePromotionImage } from './servicesFormat';
import type { ServicePromotion, ServicePromotionStatus } from './servicesTypes';
import { loadServiceBundles } from './servicesStorage';

type PromoFilter = 'all' | ServicePromotionStatus;

function formatDdMmRu(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  promotions: ServicePromotion[];
  onCreate: () => void;
  onEdit: (promo: ServicePromotion) => void;
  onDelete: (id: string) => void;
};

export function ServicesPromotionsTab({
  draft,
  services,
  promotions,
  onCreate,
  onEdit,
  onDelete,
}: Props) {
  const [filter, setFilter] = useState<PromoFilter>('all');
  const [menuId, setMenuId] = useState<string | null>(null);
  const bundles = useMemo(() => loadServiceBundles(), []);

  const chips: Array<{ id: PromoFilter; label: string }> = [
    { id: 'all', label: 'Все' },
    { id: 'active', label: 'Активные' },
    { id: 'scheduled', label: 'Запланированные' },
    { id: 'finished', label: 'Завершённые' },
    { id: 'draft', label: 'Черновики' },
  ];

  const rows = useMemo(() => {
    return promotions
      .map((p) => ({ ...p, status: derivePromotionStatus(p) }))
      .filter((p) => filter === 'all' || p.status === filter)
      .sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  }, [filter, promotions]);

  return (
    <div className="space-y-4">
      <button type="button" onClick={onCreate} className={servicesPinkBtn}>
        + Создать акцию
      </button>

      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`${servicesChip} ${filter === c.id ? servicesChipActive : servicesChipIdle}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className={`${servicesCard} p-6 text-center`}>
          <span className={`${servicesIconCircle} mx-auto h-16 w-16 rounded-[22px]`}>
            <HiReceiptPercent className="h-8 w-8" aria-hidden />
          </span>
          <h3 className="mt-4 text-[18px] font-bold text-[#111827]">Акций пока нет</h3>
          <p className="mx-auto mt-2 max-w-[18rem] text-[13px] text-[#6B7280]">
            Создайте скидку или спецпредложение для клиентов
          </p>
          <button type="button" onClick={onCreate} className={`${servicesPinkBtn} mt-5`}>
            Создать акцию
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((promo) => {
            const img = resolvePromotionImage({
              serviceId: promo.serviceId,
              bundleId: promo.bundleId,
              services,
              bundles,
              draft,
              fallback: promo.imageUrl,
            });
            const muted = promo.status === 'finished';
            const statusColors =
              promo.status === 'active'
                ? 'bg-[#ECFDF5] text-[#16A34A]'
                : promo.status === 'scheduled'
                  ? 'bg-[#EFF6FF] text-[#2563EB]'
                  : promo.status === 'draft'
                    ? 'bg-[#F3F4F6] text-[#6B7280]'
                    : 'bg-[#F3F4F6] text-[#9CA3AF]';

            return (
              <li
                key={promo.id}
                className={`overflow-hidden rounded-[22px] border border-[#EAECEF] shadow-[0_10px_32px_rgba(17,24,39,0.06)] ${
                  muted ? 'opacity-70' : ''
                }`}
              >
                <div className="relative min-h-[148px]">
                  {img ? (
                    <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFF1F4] via-[#FFE4EA] to-[#FDE8ED]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#F47C8C]/85 via-[#F47C8C]/45 to-[#F47C8C]/15" />
                  <div className="relative flex min-h-[148px] flex-col justify-between p-4 text-white">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusColors}`}>
                        {promotionStatusLabel(promo.status)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMenuId(promo.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm"
                        aria-label="Меню акции"
                      >
                        <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
                      </button>
                    </div>
                    <div>
                      <span className="inline-flex rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold text-[#F47C8C]">
                        {promo.discountLabel}
                      </span>
                      <h3 className="mt-2 text-[18px] font-bold leading-tight drop-shadow-sm">{promo.title}</h3>
                      <p className="mt-1 line-clamp-2 text-[12px] font-medium text-white/90">{promo.description}</p>
                      <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-white/85">
                        <HiCalendarDays className="h-3.5 w-3.5" aria-hidden />
                        {formatDdMmRu(promo.startsAt)} — {formatDdMmRu(promo.endsAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className={`${servicesCard} flex gap-3 border-[#FDE8ED] bg-[#FFF9FB] p-4`}>
        <span className={`${servicesIconCircle} h-11 w-11`}>
          <HiReceiptPercent className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-[14px] font-bold text-[#111827]">Создавайте акции</p>
          <p className="mt-1 text-[12px] text-[#6B7280]">
            Привлекайте новых клиентов и увеличивайте лояльность
          </p>
        </div>
      </div>

      {menuId ? (
        <div className="fixed inset-x-4 bottom-24 z-30 mx-auto max-w-[420px] rounded-[20px] border border-[#EAECEF] bg-white p-2 shadow-xl">
          <button
            type="button"
            className="flex w-full rounded-[14px] px-4 py-3 text-left text-[14px] font-semibold text-[#111827]"
            onClick={() => {
              const p = promotions.find((x) => x.id === menuId);
              if (p) onEdit(p);
              setMenuId(null);
            }}
          >
            Редактировать
          </button>
          <button
            type="button"
            className="flex w-full rounded-[14px] px-4 py-3 text-left text-[14px] font-semibold text-[#EF4444]"
            onClick={() => {
              onDelete(menuId);
              setMenuId(null);
            }}
          >
            Удалить
          </button>
          <button
            type="button"
            className="mt-1 flex w-full rounded-[14px] px-4 py-3 text-[14px] font-semibold text-[#6B7280]"
            onClick={() => setMenuId(null)}
          >
            Отмена
          </button>
        </div>
      ) : null}
    </div>
  );
}
