import { HiPhone } from 'react-icons/hi2';
import { AppointmentsClientAvatar } from '../appointments/AppointmentsClientAvatar';
import { resolveClientDisplayName } from '../appointments/appointmentDetailHelpers';
import {
  formatDurationMinutes,
  formatVisitPlace,
} from '../appointments/appointmentsFormat';
import { PendingDeadlineHint } from '../appointments/PendingDeadlineHint';
import {
  apptCardMetricDuration,
  apptCardMetricPrice,
} from '../appointments/adminAppointmentsTheme';
import {
  bookingNotificationHint,
  formatBookingSource,
  formatServicePrice,
  type BookingNotificationViewModel,
} from './bookingNotificationModel';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#EEEEEE] py-3 last:border-b-0">
      <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{label}</span>
      <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">
        {value}
      </span>
    </div>
  );
}

function BookingVisitMetrics({
  whenRange,
  durationLabel,
  priceLabel,
}: {
  whenRange: string;
  durationLabel: string;
  priceLabel: string;
}) {
  return (
    <div className="rounded-[12px] bg-[#F5F5F5] px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
        Дата и время
      </p>
      <p className="mt-1 text-[16px] font-black leading-snug tracking-[-0.03em] text-[#111827] sm:text-[18px]">
        {whenRange}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-[#E5E7EB] pt-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
            Длительность
          </p>
          <p className={`mt-1 ${apptCardMetricDuration} text-[16px] sm:text-[18px]`}>{durationLabel}</p>
        </div>
        <div className="min-w-0 text-right sm:text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#9CA3AF]">
            Цена
          </p>
          <p className={`mt-1 ${apptCardMetricPrice} text-[18px] sm:text-[20px]`}>{priceLabel}</p>
        </div>
      </div>
    </div>
  );
}

type Props = {
  model: BookingNotificationViewModel;
  notificationType: string;
  showStatusBadge?: boolean;
};

export function BookingNotificationDetailView({
  model,
  notificationType,
  showStatusBadge = true,
}: Props) {
  const { appointment, statusBadge, whenRange, visitFormat, visitAddress, serviceCategory, cancelReason } =
    model;
  const displayName = resolveClientDisplayName(appointment);
  const phone = appointment.contact?.trim() || null;
  const telegram = appointment.clientTelegramUsername?.trim().replace(/^@+/, '') || null;
  const email = appointment.clientEmail?.trim() || null;
  const phoneHref = phone ? `tel:${phone.replace(/\s/g, '')}` : null;
  const telegramHref = telegram ? `https://t.me/${telegram}` : null;
  const writeHref = telegramHref ?? (email ? `mailto:${email}` : null);
  const writeLabel = telegram ? 'Написать в Telegram' : email ? 'Написать на email' : null;

  return (
    <div className="space-y-3">
      {showStatusBadge ? (
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusBadge.className}`}
        >
          {statusBadge.label}
        </span>
      ) : null}

      <div className="rounded-[10px] bg-[#F5F5F5] px-4 py-4">
        <div className="flex items-start gap-3">
          <AppointmentsClientAvatar
            name={displayName}
            phone={phone}
            photoUrl={appointment.clientAvatarUrl}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-bold tracking-[-0.03em] text-[#111827]">{displayName}</p>
            {phone ? (
              <a
                href={phoneHref ?? undefined}
                className="mt-1 inline-flex items-center gap-1 text-[14px] font-semibold text-[#F47C8C]"
              >
                <HiPhone className="h-4 w-4" aria-hidden />
                {phone}
              </a>
            ) : (
              <p className="mt-1 text-[13px] font-medium text-[#9CA3AF]">Телефон не указан</p>
            )}
            {email && !phone ? (
              <p className="mt-1 truncate text-[13px] text-[#6B7280]">{email}</p>
            ) : null}
            {telegram ? <p className="mt-0.5 text-[13px] font-medium text-[#6B7280]">@{telegram}</p> : null}
          </div>
        </div>

        {phoneHref || writeHref ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            {phoneHref ? (
              <a
                href={phoneHref}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[10px] bg-white px-4 text-[14px] font-semibold text-[#111827] ring-1 ring-[#EEEEEE]"
              >
                Позвонить
              </a>
            ) : null}
            {writeHref && writeLabel ? (
              <a
                href={writeHref}
                target={telegram ? '_blank' : undefined}
                rel={telegram ? 'noopener noreferrer' : undefined}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[10px] bg-white px-4 text-[14px] font-semibold text-[#111827] ring-1 ring-[#EEEEEE]"
              >
                {writeLabel}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <BookingVisitMetrics
        whenRange={whenRange}
        durationLabel={formatDurationMinutes(appointment.durationMinutes, appointment.serviceTitle)}
        priceLabel={formatServicePrice(appointment.priceByn)}
      />

      <div className="rounded-[10px] bg-white px-4 ring-1 ring-[#EEEEEE]">
        <p className="border-b border-[#EEEEEE] py-3 text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">
          Услуга
        </p>
        <DetailRow label="Название" value={appointment.serviceTitle} />
        {serviceCategory ? <DetailRow label="Категория" value={serviceCategory} /> : null}
      </div>

      <div className="rounded-[10px] bg-white px-4 ring-1 ring-[#EEEEEE]">
        <p className="border-b border-[#EEEEEE] py-3 text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">
          Место
        </p>
        <DetailRow label="Формат" value={visitFormat || formatVisitPlace(appointment.addressShort)} />
        <DetailRow label="Адрес" value={visitAddress} />
      </div>

      {appointment.clientNote?.trim() ? (
        <div className="rounded-[10px] bg-white px-4 py-3 ring-1 ring-[#EEEEEE]">
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#9CA3AF]">
            Комментарий клиента
          </p>
          <p className="mt-1 text-[14px] font-medium leading-snug text-[#111827]">
            {appointment.clientNote.trim()}
          </p>
        </div>
      ) : null}

      <div className="rounded-[10px] bg-white px-4 ring-1 ring-[#EEEEEE]">
        <DetailRow label="Источник" value={formatBookingSource(appointment.bookingSource)} />
        {appointment.voucherNumber ? (
          <DetailRow label="Номер записи" value={appointment.voucherNumber.toUpperCase()} />
        ) : null}
      </div>

      {cancelReason ? (
        <div className="rounded-[10px] bg-[#F3F4F6] px-4 py-3">
          <p className="text-[12px] font-bold uppercase tracking-wide text-[#6B7280]">Причина отмены</p>
          <p className="mt-1 text-[14px] font-medium text-[#111827]">{cancelReason}</p>
        </div>
      ) : null}

      <div className="rounded-[10px] bg-[#FFF4F6] px-4 py-3">
        <p className="text-[12px] font-bold uppercase tracking-wide text-[#F47C8C]">Что дальше</p>
        <PendingDeadlineHint pendingExpiresAt={appointment.pendingExpiresAt} className="mt-2" />
        <p className="mt-2 text-[14px] font-medium leading-snug text-[#111827]">
          {bookingNotificationHint(model.dbStatus, notificationType, appointment.pendingExpiresAt)}
        </p>
      </div>
    </div>
  );
}
