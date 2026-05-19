import { Outlet, useLocation } from 'react-router-dom';
import { ClientBottomNav } from './components/ClientBottomNav';
import { ClientHeader } from './components/ClientHeader';
import { ClientErrorModalProvider } from './ClientErrorModalContext';
import type { ClientOutletContext } from './clientOutletContext';
import { useClientGeo } from './hooks/useClientGeo';

import { BOOKING_PATH } from '../../app/paths';

function isMasterPublicPath(pathname: string): boolean {
  return /^\/master\/[^/]+/.test(pathname);
}

function isBookingPath(pathname: string): boolean {
  return pathname === BOOKING_PATH;
}

export function ClientLayout() {
  const { pathname } = useLocation();
  const hideCatalogHeader = isMasterPublicPath(pathname);
  const hideBottomNav = isMasterPublicPath(pathname) || isBookingPath(pathname);
  const { cityLabel, hasGeo, requestGeo, userLat, userLng } = useClientGeo();

  const outletContext: ClientOutletContext = {
    clientShell: true,
    cityLabel,
    requestGeo,
    hasGeo,
    userLat,
    userLng,
  };

  return (
    <ClientErrorModalProvider>
      <div className="min-h-dvh bg-white text-neutral-900">
        {hideCatalogHeader ? null : (
          <ClientHeader cityLabel={cityLabel} onCityClick={hasGeo ? undefined : requestGeo} />
        )}
        <Outlet context={outletContext} />
        {hideBottomNav ? null : <ClientBottomNav />}
      </div>
    </ClientErrorModalProvider>
  );
}
