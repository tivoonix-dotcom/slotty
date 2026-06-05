import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getClientAppointmentReviewPath } from '../../../app/paths';
import { HiArrowLeft, HiChatBubbleLeftRight } from 'react-icons/hi2';
import { getProfilePath, PROFILE_SETTINGS_SUPPORT_PATH } from '../../../app/paths';
import {
  cancelClientAppointmentById,
  cancelClientAppointmentByVoucher,
} from '../api/bookingByVoucher';
import {
  clientCommentByVoucher,
  clientDisputeByVoucher,
} from '../api/bookingLifecycleApi';
import { afterBookingMutation } from '../bookingDataSync';
import { dbStatusToUi } from '../appointmentStatus';
import type { DemoAppointmentRecord } from '../model/demoAppointments';
import { formatServiceName } from '../../../shared/lib/displayFormat';
import type { ClientBookingDetail } from './clientBookingDetailTypes';
import { formatPriceByn, statusLabelRu } from '../../../pages/profile/profileFormat';
import { openBookingVoucherPrint } from '../../../features/booking/lib/bookingConfirmationVoucherPrint';
import { HEADER_LOGO_SRC } from '../../../app/headerLogo';
import { formatBookingCreatedAt } from './clientBookingDetailUi';
import {
  clientBookingAsideSticky,
  clientBookingBackLink,
  clientBookingField,
  clientBookingPageGrid,
  clientBookingPanel,
  clientBookingPrimaryBtnClass,
} from './clientBookingDetailTheme';
import { ClientAppointmentHeroCard } from './ClientAppointmentHeroCard';
import { ClientAppointmentMasterCard } from './ClientAppointmentMasterCard';
import { ClientAppointmentInfoCard } from './ClientAppointmentInfoCard';
import { ClientAppointmentLocationCard } from './ClientAppointmentLocationCard';
import { ClientAppointmentNextStepCard } from './ClientAppointmentNextStepCard';
import { ClientAppointmentTimeline } from './ClientAppointmentTimeline';
import { ClientAppointmentStickyActions } from './ClientAppointmentStickyActions';
import { downloadAppointmentIcs } from './downloadAppointmentIcs';
import {
  buildClientAppointmentActions,
  buildClientAppointmentHero,
  buildClientAppointmentNextStep,
  type ClientAppointmentPrimaryAction,
  type ClientAppointmentSecondaryAction,
} from './clientAppointmentViewModel';
import { ClientBookingSectionTitle } from './clientBookingDetailUi';

const DISPUTE_REASONS = [
  { id: 'master_no_show', label: 'Мастер не пришёл' },
  { id: 'service_not_done', label: 'Услуга не выполнена' },
  { id: 'service_poor_quality', label: 'Некачественная работа' },
  { id: 'master_late_cancel', label: 'Мастер отменил в последний момент' },
  { id: 'wrong_address_or_contact', label: 'Неверный адрес или контакт' },
  { id: 'no_show_dispute', label: 'Оспорить неявку' },
  { id: 'other', label: 'Другое' },
] as const;

const CANCEL_REASONS = [
  { id: 'plans_changed', label: 'Изменились планы' },
  { id: 'no_time', label: 'Не успеваю' },
  { id: 'wrong_time', label: 'Ошибся со временем' },
  { id: 'other_master', label: 'Хочу выбрать другого мастера' },
  { id: 'other', label: 'Другое' },
] as const;

function primaryBtnClass(disabled?: boolean) {
  return `${clientBookingPrimaryBtnClass} disabled:opacity-50 ${disabled ? 'pointer-events-none' : ''}`;
}

function mapDetailToDemoRow(detail: ClientBookingDetail): DemoAppointmentRecord {
  const when = new Date(detail.starts_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(when);
  day.setHours(0, 0, 0, 0);
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  let dateLabel = when.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  if (diff === 0) dateLabel = 'Сегодня';
  else if (diff === 1) dateLabel = 'Завтра';

  const lat = detail.location_lat != null ? Number(detail.location_lat) : undefined;
  const lng = detail.location_lng != null ? Number(detail.location_lng) : undefined;
  const addressShort = detail.address?.line?.trim() || '';

  return {
    id: detail.id,
    masterId: detail.master_id,
    masterName: detail.master?.display_name ?? detail.master_display_name,
    serviceTitle: formatServiceName(detail.service_title_snapshot),
    dateLabel,
    timeLabel: when.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    location: {
      visitType: detail.location_visit_type === 'at_home' ? 'at_home' : 'studio',
      street: detail.location_street ?? addressShort,
      building: detail.location_building ?? '',
      city: detail.location_city ?? undefined,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    },
    addressShort,
    yandexMap: lat != null && lng != null ? { lon: lng, lat, zoom: 16 } : undefined,
    price: Number.parseFloat(String(detail.price_snapshot)) || 0,
    status: dbStatusToUi(detail.status) as DemoAppointmentRecord['status'],
    type: 'upcoming',
    voucherNumber: detail.voucher_number,
    hasReview: Boolean(detail.has_review),
  };
}

type Props = {
  detail: ClientBookingDetail;
  layout?: 'sheet' | 'page';
  onRefresh: () => void | Promise<void>;
  onClose?: () => void;
  onOpenReview?: () => void;
  onRebook?: (masterId: string) => void;
};

export function ClientAppointmentDetailView({
  detail,
  layout = 'sheet',
  onRefresh,
  onClose,
  onOpenReview,
  onRebook,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>(CANCEL_REASONS[0].id);
  const [cancelComment, setCancelComment] = useState('');
  const [commentDraft, setCommentDraft] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState<string>(DISPUTE_REASONS[0].id);
  const [disputeComment, setDisputeComment] = useState('');
  const navigate = useNavigate();

  const voucher = detail.voucher_number ?? '';
  const openDispute =
    detail.dispute?.status === 'open' || detail.dispute?.status === 'in_review';
  const demoRow = useMemo(() => mapDetailToDemoRow(detail), [detail]);
  const hero = useMemo(() => buildClientAppointmentHero(detail), [detail]);
  const nextStep = useMemo(() => buildClientAppointmentNextStep(detail), [detail]);
  const actionsView = useMemo(() => buildClientAppointmentActions(detail), [detail]);

  const phoneHref =
    detail.master?.contact_actions.find(
      (a) => a.href && (a.type === 'phone' || a.type === 'whatsapp'),
    )?.href ?? null;
  const messageHref =
    detail.master?.contact_actions.find(
      (a) => a.href && (a.type === 'telegram' || a.type === 'slotty'),
    )?.href ??
    detail.master?.contact_actions.find((a) => a.href && a.type !== 'phone')?.href ??
    null;
  const routeHref = demoRow.yandexMap
    ? `https://yandex.ru/maps/?rtext=~${demoRow.yandexMap.lat},${demoRow.yandexMap.lon}&rtt=auto`
    : detail.address?.line
      ? `https://yandex.ru/maps/?text=${encodeURIComponent(detail.address.line)}`
      : null;

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      setBusy(true);
      setError(null);
      try {
        await fn();
        await onRefresh();
        afterBookingMutation();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Не удалось выполнить действие');
      } finally {
        setBusy(false);
      }
    },
    [onRefresh],
  );

  const mapTitle = detail.location_visit_type === 'at_home' ? 'Адрес' : 'Адрес мастера';
  const createdAtLabel = detail.created_at ? formatBookingCreatedAt(detail.created_at) : '';

  const handlePrimary = useCallback(
    (action: ClientAppointmentPrimaryAction) => {
      switch (action) {
        case 'cancel_request':
          setCancelOpen(true);
          break;
        case 'open_route':
          if (routeHref) window.open(routeHref, '_blank', 'noopener,noreferrer');
          break;
        case 'call_master':
          if (phoneHref) window.location.href = phoneHref;
          break;
        case 'leave_review':
          if (voucher) {
            navigate(getClientAppointmentReviewPath(voucher));
          } else {
            onOpenReview?.();
          }
          break;
        case 'book_again':
          onRebook?.(detail.master_id);
          break;
        default:
          break;
      }
    },
    [detail.master_id, navigate, onOpenReview, onRebook, phoneHref, routeHref, voucher],
  );

  const handleSecondary = useCallback(
    (action: ClientAppointmentSecondaryAction) => {
      switch (action) {
        case 'open_master_profile':
          if (detail.master?.profile_path) window.location.href = detail.master.profile_path;
          break;
        case 'copy_address':
          if (detail.address?.line) void navigator.clipboard?.writeText(detail.address.line);
          break;
        case 'cancel_booking':
          setCancelOpen(true);
          break;
        case 'write_master':
          if (messageHref) window.location.href = messageHref;
          break;
        case 'download_pdf':
          openBookingVoucherPrint(
            {
              masterName: demoRow.masterName,
              serviceTitle: demoRow.serviceTitle,
              dateLabel: demoRow.dateLabel,
              timeLabel: demoRow.timeLabel,
              locationLine: demoRow.addressShort,
              priceLabel: formatPriceByn(demoRow.price),
              statusLabel: statusLabelRu(demoRow.status),
              voucherNumber: demoRow.voucherNumber ?? undefined,
            },
            HEADER_LOGO_SRC,
          );
          break;
        case 'dispute':
          setDisputeOpen(true);
          break;
        case 'open_route':
          if (routeHref) window.open(routeHref, '_blank', 'noopener,noreferrer');
          break;
        case 'add_to_calendar':
          downloadAppointmentIcs(detail);
          break;
        case 'call_master':
          if (phoneHref) window.location.href = phoneHref;
          break;
        case 'book_again':
          onRebook?.(detail.master_id);
          break;
        default:
          break;
      }
    },
    [demoRow, detail, detail.address?.line, detail.master?.profile_path, detail.master_id, messageHref, onRebook, phoneHref, routeHref],
  );

  let overlay: ReactNode = null;

  if (disputeOpen) {
    const commentOk = disputeComment.trim().length >= 10;
    overlay = (
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4"
        onClick={() => setDisputeOpen(false)}
      >
        <div
          className="w-full max-w-lg rounded-t-[16px] bg-white p-5 ring-1 ring-[#EEEEEE] sm:rounded-[16px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827]">Сообщить о проблеме</h3>
          <p className="mt-2 text-[14px] text-[#6B7280]">
            Опишите ситуацию — мы передадим обращение в поддержку.
          </p>
          <select
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            className={clientBookingField}
          >
            {DISPUTE_REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={disputeComment}
            onChange={(e) => setDisputeComment(e.target.value)}
            placeholder="Комментарий (минимум 10 символов)"
            rows={4}
            className={`${clientBookingField} mt-3`}
          />
          <p className="mt-1 text-[12px] text-[#9CA3AF]">
            {commentOk ? 'Можно отправить' : `Ещё ${10 - disputeComment.trim().length} символов`}
          </p>
          <button
            type="button"
            className={`${primaryBtnClass(busy || !commentOk)} mt-4`}
            disabled={busy || !commentOk || !voucher}
            onClick={() =>
              void run(async () => {
                await clientDisputeByVoucher(voucher, {
                  reason: disputeReason,
                  comment: disputeComment.trim(),
                });
                setDisputeOpen(false);
                setDisputeComment('');
              })
            }
          >
            Отправить обращение
          </button>
        </div>
      </div>
    );
  }

  if (cancelOpen) {
    overlay = (
      <div
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/35 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4"
        onClick={() => setCancelOpen(false)}
      >
        <div
          className="w-full max-w-lg rounded-t-[16px] bg-white p-5 ring-1 ring-[#EEEEEE] sm:rounded-[16px]"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827]">Отменить запись?</h3>
          <p className="mt-2 text-[14px] text-[#6B7280]">Мастер получит уведомление.</p>
          <select
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className={clientBookingField}
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            value={cancelComment}
            onChange={(e) => setCancelComment(e.target.value)}
            placeholder="Комментарий"
            rows={2}
            className={`${clientBookingField} mt-3`}
          />
          <button
            type="button"
            className={`${primaryBtnClass(busy)} mt-4`}
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const label = CANCEL_REASONS.find((r) => r.id === cancelReason)?.label ?? cancelReason;
                const body = {
                  reasonCategory: cancelReason,
                  reason: label,
                  comment: cancelComment.trim() || undefined,
                };
                if (voucher) await cancelClientAppointmentByVoucher(voucher, body);
                else await cancelClientAppointmentById(detail.id, body);
                setCancelOpen(false);
                onClose?.();
              })
            }
          >
            Отменить запись
          </button>
        </div>
      </div>
    );
  }

  const pageHeader =
    layout === 'page' ? (
      <>
        <Link to={getProfilePath('appointments')} className={clientBookingBackLink}>
          <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Мои записи
        </Link>
        <div className="mt-3">
          <h1 className="text-[22px] font-bold tracking-[-0.04em] text-[#111827] lg:text-[26px]">
            Детали записи
          </h1>
          {hero.voucherNumber || createdAtLabel ? (
            <p className="mt-1.5 text-[13px] font-medium text-[#6B7280] lg:text-[14px]">
              {[hero.voucherNumber, createdAtLabel ? `Создана ${createdAtLabel}` : '']
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
        </div>
      </>
    ) : null;

  const commentBlock = actionsView.showComment ? (
    <div className={`${clientBookingPanel} p-4`}>
      <p className="text-[14px] font-semibold text-[#111827]">Комментарий мастеру</p>
      <textarea
        value={commentDraft}
        onChange={(e) => setCommentDraft(e.target.value)}
        rows={3}
        className={`${clientBookingField} mt-2`}
        placeholder="Например: подъеду к главному входу"
      />
      <button
        type="button"
        disabled={busy || !commentDraft.trim() || !voucher}
        className={`${primaryBtnClass(busy)} mt-2`}
        onClick={() =>
          void run(async () => {
            await clientCommentByVoucher(voucher, commentDraft.trim());
            setCommentDraft('');
          })
        }
      >
        Отправить
      </button>
    </div>
  ) : null;

  const helpBlock =
    layout === 'page' ? (
      <div className={`${clientBookingPanel} p-4 lg:p-5`}>
        <ClientBookingSectionTitle>Нужна помощь?</ClientBookingSectionTitle>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">
          Если возникли вопросы по записи или мастеру — напишите в поддержку.
        </p>
        <Link to={PROFILE_SETTINGS_SUPPORT_PATH} className="mt-4 inline-flex min-h-10 items-center gap-2 text-[14px] font-semibold text-[#F47C8C]">
          <HiChatBubbleLeftRight className="h-4 w-4" aria-hidden />
          Написать в поддержку
        </Link>
      </div>
    ) : null;

  const showMasterContacts =
    actionsView.primary === 'call_master' ||
    actionsView.secondary.includes('write_master') ||
    actionsView.secondary.includes('call_master');

  return (
    <>
      {pageHeader}

      <div className={layout === 'page' ? 'mt-4 lg:mt-6' : 'mt-0'}>
        <div className={layout === 'page' ? clientBookingPageGrid : 'flex flex-col gap-4'}>
          <div className="flex min-w-0 flex-col gap-4">
            <ClientAppointmentHeroCard hero={hero} layout={layout} />
            <ClientAppointmentNextStepCard
              nextStep={nextStep}
              showReviewPendingHint={actionsView.showReviewPendingHint}
            />
            {detail.master ? (
              <ClientAppointmentMasterCard
                master={detail.master}
                showContactActions={showMasterContacts}
              />
            ) : null}
            <ClientAppointmentInfoCard detail={detail} />
            {layout === 'sheet' && actionsView.showMap ? (
              <ClientAppointmentLocationCard
                detail={detail}
                demoRow={demoRow}
                mapTitle={mapTitle}
                onCopyAddress={() => {
                  if (detail.address?.line) void navigator.clipboard?.writeText(detail.address.line);
                }}
              />
            ) : null}
            {commentBlock}
            {actionsView.showTimeline && detail.timeline ? (
              <ClientAppointmentTimeline timeline={detail.timeline} />
            ) : null}
            {openDispute ? (
              <p className={`${clientBookingPanel} px-4 py-3 text-[13px] font-semibold text-[#C2410C] lg:p-5`}>
                Обращение отправлено — ожидает решения поддержки
              </p>
            ) : null}
            {error ? (
              <p className="rounded-[10px] bg-[#FEF2F2] px-4 py-3 text-[14px] font-semibold text-[#EF4444]">
                {error}
              </p>
            ) : null}
            {layout === 'sheet' ? (
              <ClientAppointmentStickyActions
                layout={layout}
                primary={actionsView.primary}
                secondary={actionsView.secondary}
                busy={busy}
                onPrimary={handlePrimary}
                onSecondary={handleSecondary}
                onClose={onClose}
              />
            ) : null}
          </div>

          {layout === 'page' ? (
            <aside className={clientBookingAsideSticky}>
              {actionsView.showMap ? (
                <ClientAppointmentLocationCard
                  detail={detail}
                  demoRow={demoRow}
                  mapTitle={mapTitle}
                  onCopyAddress={() => {
                    if (detail.address?.line) void navigator.clipboard?.writeText(detail.address.line);
                  }}
                />
              ) : null}
              <ClientAppointmentStickyActions
                layout={layout}
                primary={actionsView.primary}
                secondary={actionsView.secondary}
                busy={busy}
                onPrimary={handlePrimary}
                onSecondary={handleSecondary}
              />
              {helpBlock}
            </aside>
          ) : null}
        </div>
      </div>
      {overlay}
    </>
  );
}
