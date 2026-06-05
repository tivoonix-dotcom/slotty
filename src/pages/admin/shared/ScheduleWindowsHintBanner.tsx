import { useCallback, useState, type ReactNode } from 'react';
import { HiInformationCircle } from 'react-icons/hi2';
import {
  notifCardShell,
  notifIconFallback,
  notifIconStrip,
} from '../notifications/adminNotificationsTheme';
import {
  dismissScheduleWindowsHintPermanently,
  isScheduleWindowsHintDismissed,
  SCHEDULE_WINDOWS_HINT_TEXT,
  SCHEDULE_WINDOWS_HINT_TITLE,
} from './scheduleWindowsHintStorage';

type Props = {
  /** Условие показа снаружи (например, нет окон). */
  show?: boolean;
  /** Синий акцент — только страница расписания. */
  variant?: 'default' | 'schedule';
  children?: ReactNode;
};

const VARIANT_STYLES = {
  default: {
    shell: `${notifCardShell} border-l-[3px] border-l-[#F47C8C] bg-[#FFFBFC] ring-[#FDE8ED] shadow-[0_2px_12px_rgba(244,124,140,0.08)]`,
    iconStrip: `${notifIconStrip} bg-[#FFF1F4]`,
    icon: `${notifIconFallback} h-11 w-11 bg-[#FFF1F4] text-[#F47C8C]`,
    iconMobile: `${notifIconFallback} h-8 w-8 bg-[#FFF1F4] text-[#F47C8C]`,
    actionMutedCompact:
      'inline-flex min-h-8 items-center justify-center rounded-[9px] bg-[#F5F5F5] px-3 text-[12px] font-semibold text-[#374151] ring-1 ring-[#EEEEEE] transition hover:bg-[#EBEBEB] active:scale-[0.98] sm:min-h-9 sm:rounded-[10px] sm:px-3.5 sm:text-[13px]',
  },
  schedule: {
    shell: `${notifCardShell} border-l-[3px] border-l-[#3B4CCA] bg-[#F4F5FD] ring-[#D8DCF5] shadow-[0_2px_12px_rgba(59,76,202,0.08)]`,
    iconStrip: `${notifIconStrip} bg-[#EEF0FC]`,
    icon: `${notifIconFallback} h-11 w-11 bg-[#EEF0FC] text-[#3B4CCA]`,
    iconMobile: `${notifIconFallback} h-8 w-8 bg-[#EEF0FC] text-[#3B4CCA]`,
    actionMutedCompact:
      'inline-flex min-h-8 items-center justify-center rounded-[9px] bg-[#EEF0FC] px-3 text-[12px] font-semibold text-[#3B4CCA] transition hover:bg-[#E0E4F8] active:scale-[0.98] sm:min-h-9 sm:rounded-[10px] sm:px-3.5 sm:text-[13px]',
  },
} as const;

const dismissBtnClass =
  'inline-flex min-h-8 shrink-0 items-center justify-center rounded-[9px] px-2.5 text-[12px] font-semibold text-[#6B7280] transition hover:bg-[#F6F7FB] hover:text-[#111827] active:scale-[0.98] sm:min-h-10 sm:rounded-[12px] sm:px-3 sm:text-[14px]';

export function ScheduleWindowsHintBanner({
  show = true,
  variant = 'default',
  children,
}: Props) {
  const [hidden, setHidden] = useState(() => isScheduleWindowsHintDismissed());
  const styles = VARIANT_STYLES[variant];

  const dismiss = useCallback(() => {
    setHidden(true);
  }, []);

  const dismissPermanently = useCallback(() => {
    dismissScheduleWindowsHintPermanently();
    setHidden(true);
  }, []);

  if (!show || hidden) return null;

  return (
    <article className={styles.shell} role="note">
      <div className="flex min-w-0 flex-1">
        <div className={`${styles.iconStrip} hidden sm:flex`} aria-hidden>
          <span className={styles.icon}>
            <HiInformationCircle className="h-5 w-5" />
          </span>
        </div>

        <div className="min-w-0 flex-1 p-3 sm:p-3.5 lg:p-4">
          <div className="flex items-start gap-2.5">
            <span className={`${styles.iconMobile} shrink-0 sm:hidden`} aria-hidden>
              <HiInformationCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-snug text-[#111827] sm:text-[15px] lg:text-[16px]">
                {SCHEDULE_WINDOWS_HINT_TITLE}
              </p>
              <p className="mt-1 text-[12px] leading-snug text-[#6B7280] sm:text-[13px] sm:leading-relaxed lg:text-[14px]">
                {SCHEDULE_WINDOWS_HINT_TEXT}
              </p>
            </div>
          </div>

          {children ? <div className="mt-2.5 space-y-2 sm:mt-3 sm:space-y-3">{children}</div> : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
            <button type="button" onClick={dismiss} className={styles.actionMutedCompact}>
              Понятно
            </button>
            <button type="button" onClick={dismissPermanently} className={dismissBtnClass}>
              Не показывать снова
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
