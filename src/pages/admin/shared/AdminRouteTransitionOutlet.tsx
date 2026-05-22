import { Outlet, useLocation } from 'react-router-dom';
import { useRouteTransitionPulse } from './useRouteTransitionPulse';
import { AdminContentLoadingOverlay } from './AdminContentLoadingOverlay';

export function AdminRouteTransitionOutlet() {
  const location = useLocation();
  const busy = useRouteTransitionPulse(location.pathname);

  return (
    <div className="relative min-w-0">
      <div
        className={`transition-opacity duration-200 ease-out ${
          busy ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
        aria-hidden={busy}
      >
        <Outlet key={location.pathname} />
      </div>

      <AdminContentLoadingOverlay show={busy} />
    </div>
  );
}
