import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  patchMasterAppointmentCancel,
  patchMasterAppointmentConfirm,
} from '../../../features/admin/api/masterCabinetApi';
import { afterBookingMutation } from '../../../features/appointments/bookingDataSync';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { LoadingVideo } from '../../../shared/ui/LoadingVideo';
import { AdminBottomSheet } from '../shared/AdminBottomSheet';
import { isPendingConfirmDisabled } from '../appointments/PendingDeadlineHint';
import {
  buildBookingNotificationViewModel,
  resolveBookingNotificationActions,
  type BookingNotificationActionId,
} from './bookingNotificationModel';
import { MasterNotificationDetailContent } from './MasterNotificationDetailContent';
import { ReviewNotificationDetailView } from './ReviewNotificationDetailView';
import {
  buildMasterNotificationDetailModel,
  getMasterNotificationVisual,
  resolveMasterNotificationStatusBadge,
} from './masterNotificationModel';
import {
  resolveMasterContactAction,
  resolveMasterNotificationAction,
} from './notificationAction';
import {
  isAppointmentNotification,
  useMasterNotificationAppointment,
} from './masterNotificationAppointment';
import { isReviewNotification, useMasterNotificationReview } from './useMasterNotificationReview';
import { notifDetailSticker } from './adminNotificationsTheme';
import { ADMIN_PATH } from '../../../app/paths';
import { useAdminMasterCabinet } from '../AdminMasterCabinetContext';
import { SystemNotificationDetailView } from './SystemNotificationDetailView';
import {
  buildSystemNotificationDetailModel,
  isSystemStyleNotification,
  resolveSystemNotificationScenario,
} from './systemNotificationDetailModel';
import {
  NotificationDetailFooterActions,
  NotificationRejectFooterActions,
} from './NotificationDetailFooterActions';

type Props = {
  item: MeNotificationRow | null;
  onClose: () => void;
  onMarkRead?: (id: string) => void;
  onBookingAction?: () => void | Promise<void>;
};

export function AdminNotificationDetailSheet({
  item,
  onClose,
  onMarkRead,
  onBookingAction,
}: Props) {
  const navigate = useNavigate();
  const { cabinetProfileMeta } = useAdminMasterCabinet();
  const { appointment, extras, loading, error, refetch } = useMasterNotificationAppointment(item);
  const isReview = item ? isReviewNotification(item) : false;
  const {
    review,
    loading: reviewLoading,
    error: reviewError,
  } = useMasterNotificationReview(isReview ? item : null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (!item?.id || item.read_at) return;
    onMarkRead?.(item.id);
  }, [item, onMarkRead]);

  const navigateAction = useMemo(() => (item ? resolveMasterNotificationAction(item) : null), [item]);
  const contactAction = useMemo(() => (item ? resolveMasterContactAction(item) : null), [item]);
  const isBookingNotification = item ? isAppointmentNotification(item) : false;

  const viewModel = useMemo(() => {
    if (!appointment) return null;
    return buildBookingNotificationViewModel(appointment, extras ?? undefined);
  }, [appointment, extras]);

  const isSystemStyle =
    Boolean(item) && !isReview && !viewModel && isSystemStyleNotification(item!);
  const systemScenario = item ? resolveSystemNotificationScenario(item) : null;
  const systemModel = useMemo(
    () => (item && isSystemStyle ? buildSystemNotificationDetailModel(item, cabinetProfileMeta) : null),
    [cabinetProfileMeta, isSystemStyle, item],
  );

  const detailModel = useMemo(
    () => (item ? buildMasterNotificationDetailModel(item, viewModel) : null),
    [item, viewModel],
  );

  const visual = item ? getMasterNotificationVisual(item) : null;
  const statusBadge = item ? resolveMasterNotificationStatusBadge(item) : null;
  const DetailIcon = visual?.icon;

  const acceptDisabled =
    viewModel?.dbStatus === 'pending' &&
    isPendingConfirmDisabled(viewModel.dbStatus, appointment?.pendingExpiresAt);

  const footerActions = useMemo(() => {
    if (viewModel) return resolveBookingNotificationActions(viewModel.dbStatus);
    if (isReview) {
      const actions: Array<{
        id: BookingNotificationActionId | 'contact' | 'profile';
        label: string;
        variant: 'primary' | 'secondary' | 'danger';
      }> = [];
      if (navigateAction?.label === 'Открыть запись') {
        actions.push({ id: 'open', label: 'Открыть запись', variant: 'primary' });
      }
      actions.push({ id: 'profile', label: 'Кабинет мастера', variant: 'secondary' });
      actions.push({ id: 'close', label: 'Закрыть', variant: 'secondary' });
      return actions;
    }
    if (isSystemStyle) {
      const actions: Array<{
        id: BookingNotificationActionId | 'contact' | 'profile';
        label: string;
        variant: 'primary' | 'secondary' | 'danger';
      }> = [];
      if (navigateAction) {
        actions.push({ id: 'open', label: navigateAction.label, variant: 'primary' });
      }
      if (systemScenario === 'catalog_top_master') {
        actions.push({ id: 'profile', label: 'Кабинет мастера', variant: 'secondary' });
      }
      actions.push({ id: 'close', label: 'Закрыть', variant: 'secondary' });
      return actions;
    }
    const actions: Array<{
      id: BookingNotificationActionId | 'contact' | 'profile';
      label: string;
      variant: 'primary' | 'secondary' | 'danger';
    }> = [];
    if (navigateAction) {
      actions.push({ id: 'open', label: navigateAction.label, variant: 'primary' });
    }
    if (contactAction && contactAction.label !== navigateAction?.label) {
      actions.push({ id: 'contact', label: contactAction.label, variant: 'secondary' });
    }
    actions.push({ id: 'close', label: 'Закрыть', variant: 'secondary' });
    return actions;
  }, [contactAction, isReview, isSystemStyle, navigateAction, systemScenario, viewModel]);

  const runBookingMutation = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      setActionError(null);
      try {
        await fn();
        afterBookingMutation();
        await onBookingAction?.();
        await refetch({ quiet: true });
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
      } finally {
        setBusy(false);
      }
    },
    [onBookingAction, refetch],
  );

  const handleFooterAction = useCallback(
    (actionId: BookingNotificationActionId | 'contact' | 'profile') => {
      if (actionId === 'close') {
        onClose();
        return;
      }
      if (actionId === 'profile') {
        onClose();
        navigate(ADMIN_PATH);
        return;
      }
      if (actionId === 'open' || actionId === 'contact') {
        const target = actionId === 'contact' ? contactAction : navigateAction;
        if (!target) return;
        onClose();
        navigate(target.to);
        return;
      }
      if (!appointment) return;

      if (actionId === 'accept') {
        void runBookingMutation(async () => {
          await patchMasterAppointmentConfirm(appointment.id);
          onClose();
        });
        return;
      }

      if (actionId === 'reject' || actionId === 'cancel') {
        setRejectOpen(true);
      }
    },
    [appointment, contactAction, navigate, navigateAction, onClose, runBookingMutation],
  );

  const submitReject = useCallback(() => {
    if (!appointment || !rejectReason.trim()) return;
    const category = viewModel && viewModel.dbStatus === 'pending' ? 'rejected_request' : 'master_unavailable';
    void runBookingMutation(async () => {
      await patchMasterAppointmentCancel(appointment.id, rejectReason.trim(), category);
      setRejectOpen(false);
      setRejectReason('');
      onClose();
    });
  }, [appointment, onClose, rejectReason, runBookingMutation, viewModel]);

  const rejectTitle =
    viewModel && viewModel.dbStatus === 'pending' ? 'Отклонить заявку?' : 'Отменить запись?';

  return (
    <>
      <AdminBottomSheet
        open={Boolean(item)}
        onClose={onClose}
        variant="catalog"
        headerContent={
          item && detailModel ? (
            <div className="min-w-0 pr-2">
              <div className="flex items-start gap-3">
                {visual && DetailIcon ? (
                  <span className={`${notifDetailSticker} ${visual.stickerClass}`} aria-hidden>
                    <DetailIcon className="h-6 w-6" />
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="admin-sheet-title" className="text-[18px] font-bold text-[#111827]">
                      {detailModel.title}
                    </h2>
                    {statusBadge ? (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[13px] font-medium text-[#6B7280]">
                    {detailModel.createdAtLabel}
                  </p>
                </div>
              </div>
            </div>
          ) : undefined
        }
        footer={
          footerActions.length ? (
            <NotificationDetailFooterActions
              actions={footerActions}
              disabled={busy}
              isActionDisabled={(action) =>
                action.id === 'accept' && (loading || acceptDisabled)
              }
              onAction={(id) =>
                handleFooterAction(id as BookingNotificationActionId | 'contact' | 'profile')
              }
            />
          ) : undefined
        }
      >
        {item ? (
          <div className="space-y-4">
            {isReview && reviewLoading && !review ? (
              <div className="flex min-h-[10rem] items-center justify-center">
                <LoadingVideo size="sm" />
              </div>
            ) : null}

            {isBookingNotification && !isReview && loading && !viewModel ? (
              <div className="flex min-h-[10rem] items-center justify-center">
                <LoadingVideo size="sm" />
              </div>
            ) : null}

            {actionError ? (
              <p className="rounded-[10px] bg-[#FFF0F0] px-3 py-2 text-[13px] font-semibold text-[#9B2C2C]">
                {actionError}
              </p>
            ) : null}

            {isReview && reviewError && !review ? (
              <p className="rounded-[10px] bg-[#FFF0F0] px-3 py-2 text-[13px] font-semibold text-[#9B2C2C]">
                {reviewError}
              </p>
            ) : null}

            {isBookingNotification && !isReview && error && !viewModel ? (
              <p className="rounded-[10px] bg-[#FFF0F0] px-3 py-2 text-[13px] font-semibold text-[#9B2C2C]">
                {error}
              </p>
            ) : null}

            {isReview && review ? (
              <ReviewNotificationDetailView review={review} />
            ) : isSystemStyle && systemModel ? (
              <SystemNotificationDetailView model={systemModel} />
            ) : (
              <MasterNotificationDetailContent
                item={item}
                bookingModel={viewModel}
                showBookingFull={Boolean(viewModel)}
              />
            )}
          </div>
        ) : null}
      </AdminBottomSheet>

      <AdminBottomSheet
        variant="catalog"
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setRejectReason('');
        }}
        title={rejectTitle}
        footer={
          <NotificationRejectFooterActions
            busy={busy}
            canSubmit={Boolean(rejectReason.trim())}
            onBack={() => {
              setRejectOpen(false);
              setRejectReason('');
            }}
            onSubmit={() => submitReject()}
          />
        }
      >
        <label className="block">
          <span className="text-[13px] font-medium text-[#6B7280]">Причина *</span>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="mt-1.5 w-full min-h-[5rem] resize-none rounded-[10px] border-0 bg-[#EBEBEB] px-4 py-3 text-[15px] font-medium text-[#111827] outline-none"
            placeholder="Кратко опишите причину"
          />
        </label>
      </AdminBottomSheet>
    </>
  );
}
