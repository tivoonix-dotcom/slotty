import { Outlet, useLocation } from 'react-router-dom';
import { SlottyHeader } from '../../shared/layout/SlottyHeader/SlottyHeader';
import { ClientNotificationsProvider } from '../profile/notifications/ClientNotificationsContext';
import { ClientBottomNav } from './components/ClientBottomNav';
import { ClientHeader } from './components/ClientHeader';
import { ClientErrorModalProvider } from './ClientErrorModalContext';
import type { ClientOutletContext } from './clientOutletContext';
import { useClientGeo } from './hooks/useClientGeo';

import { BOOKING_PATH, PROFILE_PATH, SERVICES_PATH } from '../../app/paths';

function isMasterPublicPath(pathname: string): boolean {
  return /^\/master\/[^/]+/.test(pathname);
}

function isBookingPath(pathname: string): boolean {
  return pathname === BOOKING_PATH;
}

function isClientAppointmentDetailPath(pathname: string): boolean {
  return /^\/client\/appointments\/[^/]+$/.test(pathname);
}

function isCatalogPath(pathname: string): boolean {
  if (pathname === SERVICES_PATH) return true;
  return pathname.startsWith(`${SERVICES_PATH}/category/`);
}

function isClientProfilePath(pathname: string): boolean {
  return pathname === PROFILE_PATH || pathname.startsWith(`${PROFILE_PATH}/`);
}

export function ClientLayout() {
  const { pathname } = useLocation();
  const profileDesktopCabinet = isClientProfilePath(pathname);
  const hideBottomNav =
    isMasterPublicPath(pathname) ||
    isBookingPath(pathname) ||
    isClientAppointmentDetailPath(pathname) ||
    profileDesktopCabinet;
  const { cityLabel, hasGeo, requestGeo, userLat, userLng } = useClientGeo();

  const outletContext: ClientOutletContext = {
    clientShell: true,
    cityLabel,
    requestGeo,
    hasGeo,
    userLat,
    userLng,
  };

  const hideMobileClientHeader =
    isBookingPath(pathname) ||
    isCatalogPath(pathname) ||
    isMasterPublicPath(pathname) ||
    profileDesktopCabinet;
  const masterPublicDesktop = isMasterPublicPath(pathname);
  const hideSlottyHeader = profileDesktopCabinet || masterPublicDesktop;
  const catalogCanvas = isCatalogPath(pathname) || isBookingPath(pathname);

  return (
    <ClientErrorModalProvider>
      <div
        className={`min-h-dvh w-full min-w-0 text-neutral-900 ${
          catalogCanvas
            ? 'bg-[#F5F5F5]'
            : profileDesktopCabinet
              ? 'max-lg:bg-[#F5F5F5] lg:bg-[#f6f7fb]'
              : 'bg-white'
        }`}
      >
        {hideMobileClientHeader ? null : (
          <div className="lg:hidden">
            <ClientHeader cityLabel={cityLabel} onCityClick={hasGeo ? undefined : requestGeo} />
          </div>
        )}
        {hideSlottyHeader ? null : <SlottyHeader variant="bar" />}
        <div className="w-full min-w-0">
          {profileDesktopCabinet ? (
            <ClientNotificationsProvider>
              <Outlet context={outletContext} />
            </ClientNotificationsProvider>
          ) : (
            <Outlet context={outletContext} />
          )}
        </div>
        {hideBottomNav ? null : <ClientBottomNav />}
      </div>
    </ClientErrorModalProvider>
  );
}
