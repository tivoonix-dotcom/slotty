import {
  dedupeTimelineItems,
  isHiddenTimelineEvent,
  isVisibleClientTimelineEvent,
} from '../../../features/appointments/bookingTimelinePolicy';
import type { ClientBookingDetail } from './clientBookingDetailTypes';
import { ClientBookingSectionTitle } from './clientBookingDetailUi';
import { clientBookingPanel } from './clientBookingDetailTheme';

type Props = {
  timeline: NonNullable<ClientBookingDetail['timeline']>;
};

export function ClientAppointmentTimeline({ timeline }: Props) {
  const items = dedupeTimelineItems(
    timeline.filter(
      (ev) =>
        isVisibleClientTimelineEvent(ev.eventType) &&
        !isHiddenTimelineEvent(ev.eventType) &&
        ev.label.trim().length > 0,
    ),
  ).slice(-8);

  if (!items.length) return null;

  return (
    <div className={`${clientBookingPanel} p-4 lg:p-5`}>
      <ClientBookingSectionTitle>История</ClientBookingSectionTitle>
      <ul className="mt-3 space-y-2.5">
        {items.map((ev) => (
          <li key={ev.id} className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#ECFDF3] text-[10px] font-bold text-[#10B981]">
              ✓
            </span>
            <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
              <span className="text-[13px] font-semibold text-[#111827]">{ev.label}</span>
              <span className="shrink-0 text-[12px] text-[#9CA3AF]">{ev.timeLabel}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
