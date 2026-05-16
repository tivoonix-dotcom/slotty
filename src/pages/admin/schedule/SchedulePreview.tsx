import type { PlannedSlot } from './scheduleTypes';
import { formatPreviewLine, serviceTitleById, windowsCountRu } from './scheduleUtils';
import type { MasterOnboardingService } from '../../../features/profile/lib/demoMasterStorage';

type Props = {
  slots: PlannedSlot[];
  services: MasterOnboardingService[];
  serviceName?: string;
  beyondHorizon?: number;
  horizonDays?: number | null;
};

export function SchedulePreview({
  slots,
  services,
  serviceName,
  beyondHorizon = 0,
  horizonDays,
}: Props) {
  if (slots.length === 0) return null;

  const title =
    slots.length === 1
      ? 'Будет создано 1 окно'
      : `Будет создано: ${windowsCountRu(slots.length)}`;

  return (
    <section className="rounded-[22px] bg-[#FFF5F5] px-4 py-3.5 ring-1 ring-[#E29595]/15">
      <p className="text-[14px] font-semibold text-neutral-900">{title}</p>
      <p className="mt-0.5 text-[12px] text-neutral-500">Проверь окна перед добавлением</p>
      <ul className="mt-3 space-y-2">
        {slots.slice(0, 8).map((s) => {
          const name = serviceName ?? serviceTitleById(services, s.serviceId);
          return (
            <li key={`${s.dateIso}-${s.startTime}`} className="text-[13px] font-medium text-neutral-700">
              {formatPreviewLine(s.dateIso, s.startTime, s.endTime)}
              {name ? <span className="text-neutral-500"> · {name}</span> : null}
            </li>
          );
        })}
        {slots.length > 8 ? (
          <li className="text-[12px] text-neutral-500">…и ещё {slots.length - 8}</li>
        ) : null}
      </ul>
      {beyondHorizon > 0 && horizonDays != null && horizonDays > 0 ? (
        <p className="mt-3 text-[12px] font-semibold leading-snug text-[#B66A24]">
          {beyondHorizon} {beyondHorizon === 1 ? 'дата выходит' : 'дат выходят'} за горизонт тарифа ({horizonDays}{' '}
          дней) и не будут созданы.
        </p>
      ) : null}
    </section>
  );
}
