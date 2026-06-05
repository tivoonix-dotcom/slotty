import type { IconType } from 'react-icons';
import {
  HiArrowLeft,
  HiArrowTopRightOnSquare,
  HiCalendarDays,
  HiChatBubbleLeftRight,
  HiCheck,
  HiCreditCard,
  HiGlobeAlt,
  HiHomeModern,
  HiLifebuoy,
  HiPhone,
  HiSparkles,
  HiXMark,
} from 'react-icons/hi2';
import {
  notifFooterDanger,
  notifFooterDismiss,
  notifFooterPrimary,
  notifFooterSecondary,
} from './adminNotificationsTheme';

export type NotificationFooterAction = {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
};

function iconForAction(id: string, label: string): IconType {
  if (id === 'close') return HiXMark;
  if (id === 'accept' || id === 'ack') return HiCheck;
  if (id === 'reject' || id === 'cancel') return HiXMark;
  if (id === 'profile') return HiHomeModern;
  if (id === 'contact') return HiPhone;
  if (label.includes('каталог')) return HiGlobeAlt;
  if (label.includes('отзыв')) return HiChatBubbleLeftRight;
  if (label.includes('Тариф') || label.includes('оплат')) return HiCreditCard;
  if (label.includes('обращен')) return HiLifebuoy;
  if (label.includes('заявк') || label.includes('запис')) return HiCalendarDays;
  if (label.includes('топ')) return HiSparkles;
  return HiArrowTopRightOnSquare;
}

function actionButtonClass(variant: NotificationFooterAction['variant']): string {
  if (variant === 'primary') return notifFooterPrimary;
  if (variant === 'danger') return notifFooterDanger;
  return notifFooterSecondary;
}

type Props = {
  actions: NotificationFooterAction[];
  disabled?: boolean;
  onAction: (id: string) => void;
  isActionDisabled?: (action: NotificationFooterAction) => boolean;
};

export function NotificationDetailFooterActions({
  actions,
  disabled = false,
  onAction,
  isActionDisabled,
}: Props) {
  const mainActions = actions.filter((a) => a.id !== 'close');
  const closeAction = actions.find((a) => a.id === 'close');

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {mainActions.map((action) => {
          const Icon = iconForAction(action.id, action.label);
          const actionDisabled = disabled || (isActionDisabled?.(action) ?? false);
          return (
            <button
              key={action.id}
              type="button"
              disabled={actionDisabled}
              onClick={() => onAction(action.id)}
              className={actionButtonClass(action.variant)}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {action.label}
            </button>
          );
        })}
      </div>

      {closeAction ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onAction(closeAction.id)}
          className={notifFooterDismiss}
        >
          <HiXMark className="h-4 w-4 shrink-0" aria-hidden />
          {closeAction.label}
        </button>
      ) : null}
    </div>
  );
}

type RejectFooterProps = {
  busy: boolean;
  canSubmit: boolean;
  onBack: () => void;
  onSubmit: () => void;
  submitLabel?: string;
};

export function NotificationRejectFooterActions({
  busy,
  canSubmit,
  onBack,
  onSubmit,
  submitLabel = 'Подтвердить',
}: RejectFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button type="button" disabled={busy} onClick={onBack} className={notifFooterSecondary}>
        <HiArrowLeft className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        Назад
      </button>
      <button
        type="button"
        disabled={busy || !canSubmit}
        onClick={onSubmit}
        className={notifFooterDanger}
      >
        <HiXMark className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
        {submitLabel}
      </button>
    </div>
  );
}
