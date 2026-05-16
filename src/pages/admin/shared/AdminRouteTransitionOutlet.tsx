import { Outlet, useLocation } from 'react-router-dom';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { useRouteTransitionPulse } from './useRouteTransitionPulse';

export function AdminRouteTransitionOutlet() {
  const location = useLocation();
  const busy = useRouteTransitionPulse(location.pathname);

  return (
    <div className="relative min-h-[12rem]">
      <div
        className={`transition-opacity duration-200 ease-out ${
          busy ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        aria-hidden={busy}
      >
        <Outlet key={location.pathname} />
      </div>

      {busy ? (
        <div
          className="absolute inset-0 z-10 flex min-h-[min(52vh,28rem)] items-center justify-center"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <LoadingVideo size="lg" />
        </div>
      ) : null}
    </div>
  );
}
