import {
  apptCardShell,
  apptSkeletonBar,
  apptSkeletonShimmer,
} from './adminAppointmentsTheme';

const PLACEHOLDERS = [0, 1, 2];

export function AppointmentsListSkeleton() {
  return (
    <ul className="flex flex-col gap-2.5 sm:gap-3" aria-busy="true" aria-label="Загрузка записей">
      {PLACEHOLDERS.map((i) => (
        <li key={i}>
          <div className={`${apptCardShell} overflow-hidden`}>
            <div className={`flex min-h-[5.75rem] ${apptSkeletonShimmer}`}>
              <div className="w-[4.75rem] shrink-0 bg-[#F5F5F5] sm:w-20" />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
                <div className={`h-4 w-[55%] ${apptSkeletonBar}`} />
                <div className={`h-3.5 w-[85%] ${apptSkeletonBar}`} />
                <div className={`h-3 w-[40%] ${apptSkeletonBar}`} />
              </div>
            </div>
            <div className="border-t border-[#EEEEEE] p-3.5 sm:p-4">
              <div className={`h-11 w-full rounded-[12px] ${apptSkeletonBar}`} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
