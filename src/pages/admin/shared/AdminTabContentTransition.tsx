import type { ReactNode } from 'react';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { useRouteTransitionPulse } from './useRouteTransitionPulse';

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
    <div className={`relative min-h-[10rem] ${className}`.trim()}>
      <div
        className={`transition-opacity duration-200 ease-out ${
          busy ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        aria-hidden={busy}
      >
        {children}
      </div>
      {busy ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center py-10"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <LoadingVideo size="md" />
        </div>
      ) : null}
    </div>
  );
}
