import type { ReactNode } from 'react';
import { useRouteTransitionPulse } from './useRouteTransitionPulse';
import { AdminContentLoadingOverlay } from './AdminContentLoadingOverlay';

type Props = {
  activeKey: string;
  children: ReactNode;
  className?: string;
  minMs?: number;
};

/** Плавная смена контента таба с видео загрузки (сводка, услуги, расписание). */
export function AdminTabContentTransition({
  activeKey,
  children,
  className = '',
  minMs = 260,
}: Props) {
  const busy = useRouteTransitionPulse(activeKey, minMs);

  return (
    <div className={`relative min-w-0 ${className}`.trim()}>
      <div
        className={`transition-opacity duration-200 ease-out ${
          busy ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        aria-hidden={busy}
      >
        {children}
      </div>
      <AdminContentLoadingOverlay show={busy} />
    </div>
  );
}
