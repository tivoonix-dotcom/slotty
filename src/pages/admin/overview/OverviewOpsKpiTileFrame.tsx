import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  urgent?: boolean;
  /** Плоская плитка кабинета (#F5F5F5) — на мобилке сводки. */
  flat?: boolean;
};

/** KPI «Сегодня»: фото-фон + живая радужная обводка (десктоп); flat — серые плитки на мобиле. */
export function OverviewOpsKpiTileFrame({ children, urgent = false, flat = false }: Props) {
  if (flat) {
    return (
      <div
        className={`min-w-0 flex-1 rounded-[10px] bg-[#F5F5F5] p-3.5 ${
          urgent ? 'ring-2 ring-[#F47C8C]/40' : ''
        }`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`overview-ops-kpi-frame relative min-w-0 flex-1 rounded-[18px] lg:rounded-[22px] ${
        urgent ? 'overview-ops-kpi-frame--urgent' : ''
      }`}
    >
      <span className="overview-ops-kpi-frame__ring" aria-hidden />
      <span className="overview-ops-kpi-frame__glow" aria-hidden />
      <div className="overview-ops-kpi-frame__inner relative overflow-hidden rounded-[16px] p-4 lg:rounded-[20px] lg:p-5">
        {children}
      </div>
    </div>
  );
}
