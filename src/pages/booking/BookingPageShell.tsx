import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import { bookingBackLink } from './bookingUi';

type Props = {
  children: ReactNode;
  backTo: string;
  backLabel?: string;
};

export function BookingPageShell({ children, backTo, backLabel = 'Назад' }: Props) {
  return (
    <main className="min-h-dvh bg-white text-[#111827]">
      <div className="mx-auto max-w-lg px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] pt-[calc(5.25rem+env(safe-area-inset-top,0px))]">
        <Link to={backTo} className={bookingBackLink}>
          <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          {backLabel}
        </Link>
        {children}
      </div>
    </main>
  );
}
