import { useCallback, useMemo, useState } from 'react';
import { HiGift } from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  servicesCard,
  servicesIconCircle,
  servicesPinkBtn,
} from './adminServicesTheme';
import { ServicesBundleCard } from './ServicesBundleCard';
import { ServicesBundleFormSheet } from './ServicesBundleFormSheet';
import { ServicesBundleMenuSheet } from './ServicesBundleMenuSheet';
import type { ManagedService } from './servicesFormat';
import type { ServiceBundle } from './servicesTypes';
import { loadServiceBundles, saveServiceBundles } from './servicesStorage';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  onToast?: (message: string) => void;
};

export function ServicesBundlesTab({ draft, services, onToast }: Props) {
  const [bundles, setBundles] = useState<ServiceBundle[]>(() => loadServiceBundles());
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceBundle | null>(null);
  const [menuTarget, setMenuTarget] = useState<ServiceBundle | null>(null);

  const persist = useCallback((next: ServiceBundle[]) => {
    setBundles(next);
    saveServiceBundles(next);
  }, []);

  const serviceTitleById = useMemo(() => {
    const m = new Map<string, string>();
    services.forEach((s) => m.set(s.id, s.title));
    return m;
  }, [services]);

  const sortedBundles = useMemo(
    () => [...bundles].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [bundles],
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (bundle: ServiceBundle) => {
    setEditing(bundle);
    setFormOpen(true);
  };

  const handleSave = (bundle: ServiceBundle) => {
    const exists = bundles.some((b) => b.id === bundle.id);
    const next = exists
      ? bundles.map((b) => (b.id === bundle.id ? bundle : b))
      : [bundle, ...bundles];
    persist(next);
    setFormOpen(false);
    setEditing(null);
    onToast?.(
      bundle.status === 'draft'
        ? 'Черновик набора сохранён'
        : exists
          ? 'Набор обновлён'
          : 'Набор опубликован',
    );
  };

  const handleDelete = (id: string) => {
    persist(bundles.filter((b) => b.id !== id));
    onToast?.('Набор удалён');
  };

  const canCreate = services.length >= 2;

  return (
    <div className="space-y-4 pb-2">
      {sortedBundles.length > 0 ? (
        <button
          type="button"
          onClick={openCreate}
          disabled={!canCreate}
          className={servicesPinkBtn}
        >
          + Создать набор
        </button>
      ) : null}

      {!canCreate ? (
        <p className="text-[13px] font-medium text-[#9CA3AF]">
          Добавьте минимум 2 услуги в каталоге, чтобы создать набор
        </p>
      ) : null}

      {sortedBundles.length === 0 ? (
        <div className={`${servicesCard} p-6 text-center`}>
          <span className={`${servicesIconCircle} mx-auto h-16 w-16 rounded-[22px]`}>
            <HiGift className="h-8 w-8" aria-hidden />
          </span>
          <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827]">
            Наборов пока нет
          </h3>
          <p className="mx-auto mt-2 max-w-[18rem] text-[13px] leading-relaxed text-[#6B7280]">
            Создайте комбо из нескольких услуг, чтобы увеличить средний чек
          </p>
          <button
            type="button"
            onClick={openCreate}
            disabled={!canCreate}
            className={`${servicesPinkBtn} mt-5`}
          >
            + Создать набор
          </button>
        </div>
      ) : (
        <ul className="space-y-3.5">
          {sortedBundles.map((bundle) => (
            <li key={bundle.id}>
              <ServicesBundleCard
                bundle={bundle}
                services={services}
                draft={draft}
                serviceTitleById={serviceTitleById}
                onMenu={() => setMenuTarget(bundle)}
              />
            </li>
          ))}
        </ul>
      )}

      <ServicesBundleFormSheet
        open={formOpen}
        draft={draft}
        services={services}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ServicesBundleMenuSheet
        open={Boolean(menuTarget)}
        bundle={menuTarget}
        onClose={() => setMenuTarget(null)}
        onEdit={() => {
          if (menuTarget) openEdit(menuTarget);
          setMenuTarget(null);
        }}
        onDelete={() => {
          if (menuTarget) handleDelete(menuTarget.id);
          setMenuTarget(null);
        }}
      />
    </div>
  );
}
