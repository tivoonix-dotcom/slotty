import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BookingPageShell } from './BookingPageShell';
import { clientPinkBtn } from '../client/clientTheme';

type Props = {
  backTo: string;
  children: ReactNode;
  action?: { to: string; label: string };
};

export function BookingStateScreen({ backTo, children, action }: Props) {
  return (
    <BookingPageShell backTo={backTo}>
      <div className="mt-8">{children}</div>
      {action ? (
        <div className="mt-6 flex justify-center">
          <Link to={action.to} className={`${clientPinkBtn} w-full max-w-xs`}>
            {action.label}
          </Link>
        </div>
      ) : null}
    </BookingPageShell>
  );
}
