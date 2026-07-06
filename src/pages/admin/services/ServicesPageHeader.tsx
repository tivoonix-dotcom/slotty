import { useEffect, useState } from 'react';
import { HiChevronRight } from 'react-icons/hi2';
import { ServicesDesktopHero, servicesHeroSummary } from './ServicesDesktopHero';
import type { ServicesTabMetrics } from './servicesTabMetrics';
import type { ServicesTabId } from './servicesTypes';

type Props = {
  activeTab: ServicesTabId;
  metrics: ServicesTabMetrics;
  extrasLocked?: boolean;
  /** Free: счётчик активных услуг в свёрнутой сводке. */
  freeActiveCount?: number;
  freeMaxCount?: number;
  showFreeLimitHint?: boolean;
};

export function ServicesPageHeader({
  activeTab,
  metrics,
  extrasLocked = false,
  freeActiveCount,
  freeMaxCount = 3,
  showFreeLimitHint = false,
}: Props) {
  const hideHero = extrasLocked && (activeTab === 'bundles' || activeTab === 'promotions');
  const [heroOpen, setHeroOpen] = useState(false);

  useEffect(() => {
    setHeroOpen(false);
  }, [activeTab]);

  if (hideHero) return null;

  const summary = servicesHeroSummary(activeTab, metrics);

  if (!heroOpen) {
    return (
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold tracking-[-0.02em] text-[#111827]">
            {summary.badge}: {summary.value}
          </p>
          <p className="mt-0.5 text-[13px] font-medium leading-snug text-[#6B7280]">{summary.subtitle}</p>
          {showFreeLimitHint && activeTab === 'catalog' && freeActiveCount != null ? (
            <p className="mt-1 text-[12px] font-semibold text-[#F47C8C]">
              Активные услуги: {freeActiveCount} из {freeMaxCount} на бесплатном тарифе
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setHeroOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-[12px] bg-[#FFF1F4] px-3 py-2 text-[14px] font-semibold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
        >
          Открыть сводку
          <HiChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="pb-4 lg:hidden">
        <ServicesDesktopHero
          tab={activeTab}
          metrics={metrics}
          extrasLocked={extrasLocked}
          onCollapse={() => setHeroOpen(false)}
        />
      </div>
      <div className="hidden lg:block">
        <ServicesDesktopHero
          tab={activeTab}
          metrics={metrics}
          extrasLocked={extrasLocked}
          onCollapse={() => setHeroOpen(false)}
        />
      </div>
    </>
  );
}
