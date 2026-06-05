import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { useProfileCompletionOverview } from './useProfileCompletionOverview';
import { ScheduleBookingWindowsHint } from './ScheduleBookingWindowsHint';

export function ScheduleBookingWindowsHintContainer() {
  const { useCabinetApi, draft } = useAdminMasterCabinet();
  const { sections, showLoading } = useProfileCompletionOverview();

  const hasWorkDays = (draft.schedule?.workDays?.length ?? 0) > 0;
  const scheduleSection = sections.find((s) => s.id === 'schedule');
  const show =
    useCabinetApi &&
    !showLoading &&
    hasWorkDays &&
    Boolean(scheduleSection && !scheduleSection.done);

  return <ScheduleBookingWindowsHint show={show} />;
}
