import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import { CLIENT_CATALOG_DESKTOP_SHELL_CLASS } from '../../shared/layout/clientShellLayout';
import { catalogCanvasClass } from '../client/servicesCatalog/servicesCatalogTheme';
import { bookingBackLink } from './bookingUi';

type Props = {
  children: ReactNode;
  backTo: string;
  backLabel?: string;
};

export function BookingPageShell({ children, backTo, backLabel = 'Назад' }: Props) {
  return (
    <main className={`min-h-dvh w-full min-w-0 text-[#111827] ${catalogCanvasClass}`}>
      <div className="w-full min-w-0 px-4 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-4 sm:px-5 lg:px-0 lg:pb-0 lg:pt-4">
        <div
          className={`w-full min-w-0 lg:pb-12 ${CLIENT_CATALOG_DESKTOP_SHELL_CLASS} max-lg:!mx-0 max-lg:!max-w-none max-lg:!px-0`}
        >
          <Link to={backTo} className={`${bookingBackLink} mb-4 lg:hidden`}>
            <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {backLabel}
          </Link>
          <div className="w-full min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
