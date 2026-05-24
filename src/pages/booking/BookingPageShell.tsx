import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import { CLIENT_DESKTOP_SHELL_CLASS } from '../../shared/layout/clientShellLayout';
import { catalogCanvasClass } from '../client/servicesCatalog/servicesCatalogTheme';
import { bookingBackLink } from './bookingUi';

type Props = {
  children: ReactNode;
  backTo: string;
  backLabel?: string;
};

export function BookingPageShell({ children, backTo, backLabel = 'Назад' }: Props) {
  return (
    <main className={`min-h-dvh text-[#111827] ${catalogCanvasClass}`}>
      <div className="mx-auto w-full max-w-lg px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(5.25rem+env(safe-area-inset-top,0px))] lg:max-w-none lg:px-0 lg:pb-0 lg:pt-6">
        <div className={`${CLIENT_DESKTOP_SHELL_CLASS} lg:pb-12`}>
          <Link to={backTo} className={`${bookingBackLink} mb-4 lg:hidden`}>
            <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {backLabel}
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}
