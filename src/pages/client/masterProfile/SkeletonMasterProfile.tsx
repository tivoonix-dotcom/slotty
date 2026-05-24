import { CLIENT_DESKTOP_SHELL_CLASS } from '../../../shared/layout/clientShellLayout';
import { catalogDesktopPanel } from './masterProfileTheme';

type Props = {
  desktop?: boolean;
};

export function SkeletonMasterProfile({ desktop = false }: Props) {
  if (desktop) {
    return (
      <div className={`${CLIENT_DESKTOP_SHELL_CLASS} animate-pulse space-y-4 pb-12 pt-6`}>
        <div className={`${catalogDesktopPanel} h-64 bg-[#EBEBEB]`} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className={`${catalogDesktopPanel} h-40 bg-[#EBEBEB]`} />
            <div className={`${catalogDesktopPanel} h-72 bg-[#EBEBEB]`} />
            <div className={`${catalogDesktopPanel} h-28 bg-[#EBEBEB]`} />
          </div>
          <div className={`${catalogDesktopPanel} h-72 bg-[#EBEBEB]`} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse space-y-4 px-4 pb-6 pt-3 sm:px-5">
      <div className={`${catalogDesktopPanel} h-52 bg-[#EBEBEB]`} />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`${catalogDesktopPanel} h-20 bg-[#EBEBEB]`} />
        ))}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[7.5rem] w-[7.5rem] shrink-0 rounded-[12px] bg-[#EBEBEB]" />
        ))}
      </div>
    </div>
  );
}
