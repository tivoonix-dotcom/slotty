import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  urgent?: boolean;
  /** Плоская плитка кабинета (#F5F5F5) — на мобилке сводки. */
  flat?: boolean;
};

/** KPI «Сегодня»: фото-фон без декоративной обводки. */
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
      className={`relative min-w-0 flex-1 overflow-hidden rounded-[16px] p-4 lg:rounded-[20px] lg:p-5 ${
        urgent ? 'ring-2 ring-[#F47C8C]/35' : ''
      }`}
    >
      {children}
    </div>
  );
}
