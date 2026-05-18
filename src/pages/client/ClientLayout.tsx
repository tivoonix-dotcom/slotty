import { Outlet, useLocation } from 'react-router-dom';
import { ClientBottomNav } from './components/ClientBottomNav';
import { ClientHeader } from './components/ClientHeader';
import type { ClientOutletContext } from './clientOutletContext';
import { useClientGeo } from './hooks/useClientGeo';

function isMasterPublicPath(pathname: string): boolean {
  return /^\/master\/[^/]+/.test(pathname);
}

export function ClientLayout() {
  const { pathname } = useLocation();
  const hideCatalogHeader = isMasterPublicPath(pathname);
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
    <div className="min-h-dvh bg-white text-neutral-900">
      {hideCatalogHeader ? null : (
        <ClientHeader cityLabel={cityLabel} onCityClick={hasGeo ? undefined : requestGeo} />
      )}
      <Outlet context={outletContext} />
      <ClientBottomNav />
    </div>
  );
}
