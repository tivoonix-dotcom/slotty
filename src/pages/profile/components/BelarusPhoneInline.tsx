import { BY } from 'country-flag-icons/react/1x1';
import { formatBelarusPhoneDisplay } from '../../../features/profile/lib/belarusPhone';

type Props = {
  phone?: string | null;
  empty?: string;
  flagClassName?: string;
  className?: string;
};

export function BelarusPhoneInline({
  phone,
  empty = 'Не указан',
  flagClassName = 'h-3.5 w-3.5 shrink-0 rounded-full object-cover',
  className = 'inline-flex items-center gap-1.5',
}: Props) {
  if (!phone?.trim()) {
    return <>{empty}</>;
  }

  return (
    <span className={className}>
      <BY title="Беларусь" className={flagClassName} aria-hidden />
      <span>{formatBelarusPhoneDisplay(phone)}</span>
    </span>
  );
}
