import { formatPendingDeadline } from './formatPendingDeadline';

type Props = {
  pendingExpiresAt?: string | null;
  className?: string;
};

export function PendingDeadlineHint({ pendingExpiresAt, className = '' }: Props) {
  const deadline = formatPendingDeadline(pendingExpiresAt);
  if (!deadline) return null;

  const toneClass =
    deadline.tone === 'critical'
      ? 'text-[#B45309] bg-[#FFF7ED]'
      : deadline.tone === 'warning'
        ? 'text-[#B45309] bg-[#FFFBEB]'
        : 'text-[#6B7280] bg-[#F5F5F5]';

  return (
    <p className={`rounded-[8px] px-3 py-2 text-[12px] leading-snug ${toneClass} ${className}`}>
      <span className="font-semibold">{deadline.line}</span>
      <span className="mt-0.5 block font-medium">{deadline.helper}</span>
    </p>
  );
}

export function isPendingConfirmDisabled(
  dbStatus: string | undefined,
  pendingExpiresAt?: string | null,
  now = Date.now(),
): boolean {
  if (dbStatus !== 'pending' && dbStatus !== undefined) return false;
  const deadline = formatPendingDeadline(pendingExpiresAt, now);
  return deadline?.confirmDisabled ?? false;
}
