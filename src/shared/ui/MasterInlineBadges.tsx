import { MasterProBadge } from './MasterProBadge';
import { MasterVerifiedBadge } from './MasterVerifiedBadge';

export type MasterInlineBadgeSize = 'xs' | 'sm' | 'md';

const SIZE_CLASS: Record<MasterInlineBadgeSize, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
};

type Props = {
  verified?: boolean;
  pro?: boolean;
  size?: MasterInlineBadgeSize;
  className?: string;
};

/** Бейджи проверки и Pro сразу после имени мастера. */
export function MasterInlineBadges({
  verified = false,
  pro = false,
  size = 'sm',
  className = '',
}: Props) {
  if (!verified && !pro) return null;

  const badgeClass = SIZE_CLASS[size];

  return (
    <span className={`inline-flex shrink-0 items-center gap-0.5 ${className}`}>
      {verified ? <MasterVerifiedBadge className={`${badgeClass} text-[#F47C8C]`} /> : null}
      {pro ? <MasterProBadge className={badgeClass} /> : null}
    </span>
  );
}
