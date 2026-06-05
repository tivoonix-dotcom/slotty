import type { ClientAppointmentNextStepView } from './clientAppointmentViewModel';
import { ClientBookingSectionTitle } from './clientBookingDetailUi';
import { clientBookingPanel } from './clientBookingDetailTheme';

type Props = {
  nextStep: ClientAppointmentNextStepView;
  showReviewPendingHint?: boolean;
};

export function ClientAppointmentNextStepCard({ nextStep, showReviewPendingHint }: Props) {
  return (
    <div className={`${clientBookingPanel} p-4 lg:p-5`}>
      <ClientBookingSectionTitle>{nextStep.title}</ClientBookingSectionTitle>
      <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">{nextStep.body}</p>
      {showReviewPendingHint ? (
        <p className="mt-3 rounded-[10px] bg-[#F5F5F5] px-3 py-2 text-[13px] font-medium text-[#374151]">
          После завершения визита мастером вы сможете оставить отзыв.
        </p>
      ) : null}
    </div>
  );
}
