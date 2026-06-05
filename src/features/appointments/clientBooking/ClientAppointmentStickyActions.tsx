import type {
  ClientAppointmentPrimaryAction,
  ClientAppointmentSecondaryAction,
} from './clientAppointmentViewModel';
import {
  primaryActionLabel,
  secondaryActionLabel,
} from './clientAppointmentViewModel';
import {
  clientBookingGhostBtnClass,
  clientBookingPanel,
  clientBookingPrimaryBtnClass,
  clientBookingSecondaryBtnClass,
} from './clientBookingDetailTheme';

type Props = {
  layout: 'sheet' | 'page';
  primary: ClientAppointmentPrimaryAction;
  secondary: ClientAppointmentSecondaryAction[];
  busy?: boolean;
  onPrimary: (action: ClientAppointmentPrimaryAction) => void;
  onSecondary: (action: ClientAppointmentSecondaryAction) => void;
  onClose?: () => void;
};

export function ClientAppointmentStickyActions({
  layout,
  primary,
  secondary,
  busy,
  onPrimary,
  onSecondary,
  onClose,
}: Props) {
  const primaryLabel = primaryActionLabel(primary);
  const visibleSecondary = secondary.slice(0, 2);

  if (!primaryLabel && !visibleSecondary.length && !onClose) return null;

  const shellClass =
    layout === 'page'
      ? `sticky bottom-0 z-10 -mx-4 border-t border-[#EEEEEE] bg-[#F5F5F5]/95 px-4 py-3 backdrop-blur-sm lg:static lg:mx-0 lg:rounded-[16px] lg:border-0 lg:bg-white lg:p-5 ${clientBookingPanel}`
      : 'flex flex-col gap-2';

  return (
    <div className={shellClass}>
      {layout === 'page' ? (
        <p className="hidden text-[16px] font-bold tracking-[-0.02em] text-[#111827] lg:block">Действия</p>
      ) : null}
      <div className={`flex flex-col gap-2 ${layout === 'page' ? 'mt-0 lg:mt-3' : ''}`}>
        {primaryLabel ? (
          <button
            type="button"
            disabled={busy}
            className={`${clientBookingPrimaryBtnClass} disabled:opacity-50`}
            onClick={() => onPrimary(primary)}
          >
            {primaryLabel}
          </button>
        ) : null}
        {visibleSecondary.length ? (
          <div className="flex gap-2">
            {visibleSecondary.map((action) => (
              <button
                key={action}
                type="button"
                disabled={busy}
                className={`${clientBookingSecondaryBtnClass} flex-1 text-[13px] disabled:opacity-50`}
                onClick={() => onSecondary(action)}
              >
                {secondaryActionLabel(action)}
              </button>
            ))}
          </div>
        ) : null}
        {onClose ? (
          <button type="button" className={clientBookingGhostBtnClass} onClick={onClose}>
            Закрыть
          </button>
        ) : null}
      </div>
    </div>
  );
}
