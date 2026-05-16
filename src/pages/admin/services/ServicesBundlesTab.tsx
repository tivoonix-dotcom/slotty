import { useMemo, useState } from 'react';
import { HiCheck, HiEllipsisHorizontal, HiGift, HiScissors } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCard,
  servicesIconCircle,
  servicesPinkBtn,
} from './adminServicesTheme';
import type { ManagedService } from './servicesFormat';
import { serviceImageUrl } from './servicesFormat';
import type { ServiceBundle } from './servicesTypes';
import { loadServiceBundles, newBundleId, saveServiceBundles } from './servicesStorage';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
};

function bundleImage(bundle: ServiceBundle, services: ManagedService[], draft: MasterDraft): string | null {
  if (bundle.imageUrl) return bundle.imageUrl;
  const first = services.find((s) => bundle.serviceIds.includes(s.id));
  return first ? serviceImageUrl(first, draft) : null;
}

function discountPercent(oldPrice: number, price: number): number {
  if (oldPrice <= 0) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function ServicesBundlesTab({ draft, services }: Props) {
  const [bundles, setBundles] = useState<ServiceBundle[]>(() => loadServiceBundles());
  const [menuTarget, setMenuTarget] = useState<ServiceBundle | null>(null);

  const persist = (next: ServiceBundle[]) => {
    setBundles(next);
    saveServiceBundles(next);
  };

  const createBundle = () => {
    if (services.length < 2) return;
    const picked = services.slice(0, 2);
    const oldPrice = picked.reduce((s, r) => s + r.priceByn, 0);
    const priceByn = Math.round(oldPrice * 0.83);
    const bundle: ServiceBundle = {
      id: newBundleId(),
      title: `${picked[0]?.title ?? 'Услуга'} + ${picked[1]?.title ?? 'услуга'}`,
      serviceIds: picked.map((s) => s.id),
      priceByn,
      oldPriceByn: oldPrice,
      isActive: true,
    };
    persist([bundle, ...bundles]);
  };

  const serviceTitleById = useMemo(() => {
    const m = new Map<string, string>();
    services.forEach((s) => m.set(s.id, s.title));
    return m;
  }, [services]);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={createBundle}
        disabled={services.length < 2}
        className={servicesPinkBtn}
      >
        + Создать набор
      </button>

      {bundles.length === 0 ? (
        <div className={`${servicesCard} p-6 text-center`}>
          <span className={`${servicesIconCircle} mx-auto h-16 w-16 rounded-[22px]`}>
            <HiGift className="h-8 w-8" aria-hidden />
          </span>
          <h3 className="mt-4 text-[18px] font-bold text-[#111827]">Наборов пока нет</h3>
          <p className="mx-auto mt-2 max-w-[18rem] text-[13px] text-[#6B7280]">
            Создайте первый набор из нескольких услуг
          </p>
          <button
            type="button"
            onClick={createBundle}
            disabled={services.length < 2}
            className={`${servicesPinkBtn} mt-5`}
          >
            Создать набор
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {bundles.map((bundle) => {
            const img = bundleImage(bundle, services, draft);
            const pct = discountPercent(bundle.oldPriceByn, bundle.priceByn);
            return (
              <li key={bundle.id} className={`${servicesCard} flex gap-3 p-3.5`}>
                <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-[16px] bg-[#FFF1F4]">
                  {img ? (
                    <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <HiScissors className="h-7 w-7 text-[#F47C8C]" aria-hidden />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#F47C8C]">
                        выгодно
                      </span>
                      <h3 className="mt-1 text-[16px] font-bold text-[#111827]">{bundle.title}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMenuTarget(bundle)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F7F8] text-[#6B7280]"
                      aria-label="Меню набора"
                    >
                      <HiEllipsisHorizontal className="h-5 w-5" aria-hidden />
                    </button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {bundle.serviceIds.slice(0, 3).map((id) => (
                      <li key={id} className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
                        <HiCheck className="h-3.5 w-3.5 shrink-0 text-[#F47C8C]" aria-hidden />
                        <span className="truncate">{serviceTitleById.get(id) ?? 'Услуга'}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className="text-[18px] font-bold text-[#111827]">{bundle.priceByn} BYN</span>
                    <span className="text-[13px] text-[#9CA3AF] line-through">{bundle.oldPriceByn} BYN</span>
                    {pct > 0 ? (
                      <span className="text-[12px] font-bold text-[#F47C8C]">-{pct}%</span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className={`${servicesCard} flex gap-3 border-[#FDE8ED] bg-[#FFF9FB] p-4`}>
        <span className={`${servicesIconCircle} h-11 w-11`}>
          <HiGift className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-[14px] font-bold text-[#111827]">Создавайте наборы и увеличивайте средний чек</p>
          <p className="mt-1 text-[12px] text-[#6B7280]">Клиенты любят выгодные предложения</p>
        </div>
      </div>

      {menuTarget ? (
        <div className="fixed inset-x-4 bottom-24 z-30 mx-auto max-w-[420px] rounded-[20px] border border-[#EAECEF] bg-white p-2 shadow-xl">
          <button
            type="button"
            className="flex w-full rounded-[14px] px-4 py-3 text-left text-[14px] font-semibold text-[#EF4444]"
            onClick={() => {
              persist(bundles.filter((b) => b.id !== menuTarget.id));
              setMenuTarget(null);
            }}
          >
            Удалить набор
          </button>
          <button
            type="button"
            className="mt-1 flex w-full rounded-[14px] px-4 py-3 text-[14px] font-semibold text-[#6B7280]"
            onClick={() => setMenuTarget(null)}
          >
            Отмена
          </button>
        </div>
      ) : null}
    </div>
  );
}
