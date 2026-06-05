import { notifCardShell, notifSkeletonBar, notifSkeletonShimmer } from './adminNotificationsTheme';

const PLACEHOLDERS = [0, 1, 2, 3];

export function NotificationsListSkeleton() {
  return (
    <ul className="flex flex-col gap-2.5 lg:gap-3" aria-hidden>
      {PLACEHOLDERS.map((i) => (
        <li key={i}>
          <div className={`${notifCardShell} overflow-hidden`}>
            <div className={`flex min-h-[5.5rem] ${notifSkeletonShimmer}`}>
              <div className="w-[4.25rem] shrink-0 bg-[#F5F5F5] sm:w-[4.75rem]" />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3.5 sm:p-4">
                <div className={`h-4 w-[68%] ${notifSkeletonBar}`} />
                <div className={`h-3.5 w-full ${notifSkeletonBar}`} />
                <div className={`h-3 w-[45%] ${notifSkeletonBar}`} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
