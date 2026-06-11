import type { PublicStatusPage, SystemComponentStatus } from './systemStatusApi';

export type StatusCenterVariant = 'public' | 'cabinet';

/** Фон hero публичной страницы `/status` (`public/photos/status/1.webp`). */
export const PUBLIC_STATUS_HERO_BG = '/photos/status/1.webp';

export function statusAccentBar(
  status: SystemComponentStatus | PublicStatusPage['overall']['status'],
): string {
  switch (status) {
    case 'operational':
      return 'bg-[#ff5f7a]';
    case 'degraded':
      return 'bg-[#F59E0B]';
    case 'partial_outage':
    case 'major_outage':
      return 'bg-[#EF4444]';
    case 'maintenance':
      return 'bg-[#818CF8]';
    default:
      return 'bg-[#D1D5DB]';
  }
}

export function statusPillClass(
  status: SystemComponentStatus | PublicStatusPage['overall']['status'],
): string {
  switch (status) {
    case 'operational':
      return 'bg-[#FFF1F4] text-[#ff5f7a]';
    case 'degraded':
      return 'bg-[#FFFBEB] text-[#B45309]';
    case 'partial_outage':
    case 'major_outage':
      return 'bg-[#FEF2F2] text-[#B91C1C]';
    case 'maintenance':
      return 'bg-[#EEF2FF] text-[#4338CA]';
    default:
      return 'bg-[#F6F7FB] text-[#6B7280]';
  }
}

export function uptimeSegmentClass(status: SystemComponentStatus | 'no_data'): string {
  switch (status) {
    case 'operational':
      return 'bg-[#ff5f7a]';
    case 'degraded':
      return 'bg-[#F59E0B]';
    case 'partial_outage':
    case 'major_outage':
      return 'bg-[#EF4444]';
    case 'maintenance':
      return 'bg-[#A5B4FC]';
    default:
      return 'bg-[#E5E7EB]';
  }
}

export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        ok ? 'bg-[#FFF1F4] text-[#ff5f7a]' : 'bg-[#FEF2F2] text-[#EF4444]'
      }`}
      aria-hidden
    >
      {ok ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

export function ComponentCategoryIcon({ category }: { category: string }) {
  const cls = 'h-5 w-5 text-[#9CA3AF]';
  if (category === 'api' || category === 'backend') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <rect x="3" y="4" width="18" height="6" rx="1" />
        <rect x="3" y="14" width="18" height="6" rx="1" />
      </svg>
    );
  }
  if (category === 'database') {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <ellipse cx="12" cy="6" rx="8" ry="3" />
        <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M8 12h8" strokeLinecap="round" />
    </svg>
  );
}
