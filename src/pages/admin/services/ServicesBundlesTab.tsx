import { useMemo, useState } from 'react';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import {
  servicesCard,
  servicesDesktopCardPad,
  servicesTabPanelShell,
  servicesTabScrollBottomPad,
} from './adminServicesTheme';
import { ServicesBundleCard } from './ServicesBundleCard';
import { ServicesBundleFormSheet } from './ServicesBundleFormSheet';
import { ServicesBundleMenuSheet } from './ServicesBundleMenuSheet';
import { ServicesExtrasProPreview } from './ServicesExtrasProPreview';
import { ServicesTabFab } from './ServicesTabFab';
import type { ManagedService } from './servicesFormat';
import type { ServiceBundle } from './servicesTypes';
import { ServiceThumbnailFallback } from './ServicesServiceThumbnail';

type Props = {
  draft: MasterDraft;
  services: ManagedService[];
  bundles: ServiceBundle[];
  loading?: boolean;
  extrasLocked?: boolean;
  onConnectPro?: () => void;
  onExtrasLocked?: () => void;
  onSave: (bundle: ServiceBundle) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
};

function bundleCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod100 >= 11 && mod100 <= 14) return `${n} наборов`;
  if (mod10 === 1) return `${n} набор`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} набора`;

  return `${n} наборов`;
}

export function ServicesBundlesTab({
  draft,
  services,
  bundles,
  loading = false,
  extrasLocked = false,
  onConnectPro,
  onExtrasLocked,
  onSave,
  onDelete,
}: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceBundle | null>(null);
  const [menuTarget, setMenuTarget] = useState<ServiceBundle | null>(null);
  const [saving, setSaving] = useState(false);

  const connectPro = onConnectPro ?? onExtrasLocked ?? (() => {});

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
    if (extrasLocked) {
      connectPro();
      return;
    }
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (bundle: ServiceBundle) => {
    setEditing(bundle);
    setFormOpen(true);
  };

  const handleSave = (bundle: ServiceBundle) => {
    void (async () => {
      await onSave(bundle);
      setFormOpen(false);
      setEditing(null);
    })();
  };

  const handleDelete = (id: string) => {
    void onDelete(id);
  };

  const canCreate = services.length >= 2;

  if (extrasLocked) {
    return (
      <ServicesExtrasProPreview
        variant="bundles"
        draft={draft}
        services={services}
        onConnectPro={connectPro}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[14rem] items-center justify-center py-8">
        <LoadingVideo size="lg" />
      </div>
    );
  }

  return (
    <div className={`relative space-y-4 lg:space-y-0 ${servicesTabPanelShell} lg:overflow-hidden`}>
      <div className={`space-y-4 lg:space-y-5 ${servicesTabScrollBottomPad} ${servicesDesktopCardPad}`}>
        <div>
          <h2 className="text-[18px] font-black tracking-[-0.04em] text-[#111827] lg:text-[22px] lg:tracking-[-0.05em]">
            Ваши наборы
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#6B7280]">
            {sortedBundles.length > 0
              ? bundleCountLabel(sortedBundles.length)
              : 'Объединяйте услуги в комбо со скидкой'}
          </p>
          {canCreate && sortedBundles.length === 0 ? (
            <p className="mt-2 text-[12px] font-semibold text-[#9CA3AF] lg:hidden">
              Новый набор — кнопка «+» внизу справа
            </p>
          ) : null}
        </div>

        {!canCreate ? (
          <p className="rounded-[16px] bg-[#f6f7fb] px-4 py-3 text-[13px] font-semibold text-[#6B7280]">
            Добавьте минимум 2 услуги в каталоге, чтобы создать набор.
          </p>
        ) : null}

        {sortedBundles.length === 0 ? (
          <div className={`${servicesCard} p-6 text-center lg:rounded-[24px]`}>
            <ServiceThumbnailFallback sizeClass="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px]" />
            <h3 className="mt-4 text-[18px] font-bold tracking-[-0.04em] text-[#111827] lg:text-[20px]">
              Наборов пока нет
            </h3>
            <p className="mx-auto mt-2 max-w-[20rem] text-[13px] leading-relaxed text-[#6B7280]">
              {canCreate
                ? 'Нажмите «+» внизу справа, чтобы создать комбо из услуг.'
                : 'Добавьте минимум 2 услуги в каталоге.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3.5 lg:space-y-4 lg:rounded-[24px] lg:bg-[#f6f7fb] lg:p-4">
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
      </div>

      {canCreate ? (
        <ServicesTabFab ariaLabel="Создать набор" onClick={openCreate} />
      ) : null}

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
