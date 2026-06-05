import { HiPhone } from 'react-icons/hi2';
import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { resolveNotificationClientName } from '../../../features/notifications/resolveNotificationClientName';
import { AppointmentsClientAvatar } from '../appointments/AppointmentsClientAvatar';
import { BookingNotificationDetailView } from './BookingNotificationDetailView';
import type { BookingNotificationViewModel } from './bookingNotificationModel';
import { buildMasterNotificationDetailModel } from './masterNotificationModel';
import {
  notifDetailContextCard,
  notifDetailContextRow,
  notifDetailHighlight,
  notifDetailInsetPanel,
  notifDetailNarrative,
  notifDetailSectionTitle,
} from './adminNotificationsTheme';

function ContextBlock({ rows }: { rows: Array<{ label: string; value: string }> }) {
  if (!rows.length) return null;
  return (
    <div className={notifDetailContextCard}>
      <p className={notifDetailSectionTitle}>Детали</p>
      <div className="mt-2 space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className={notifDetailContextRow}>
            <span className="shrink-0 text-[13px] font-medium text-[#6B7280]">{row.label}</span>
            <span className="min-w-0 text-right text-[14px] font-semibold leading-snug text-[#111827]">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Props = {
  item: MeNotificationRow;
  bookingModel?: BookingNotificationViewModel | null;
  showBookingFull?: boolean;
};

export function MasterNotificationDetailContent({
  item,
  bookingModel,
  showBookingFull = true,
}: Props) {
  const detail = buildMasterNotificationDetailModel(item, bookingModel);

  if (showBookingFull && bookingModel) {
    return (
      <div className="space-y-4">
        <p className={notifDetailNarrative}>{detail.narrative}</p>
        <BookingNotificationDetailView
          model={bookingModel}
          notificationType={item.type}
          showStatusBadge={false}
        />
      </div>
    );
  }

  const clientRow = detail.contextRows.find((r) => r.label === 'Клиент');
  const phoneRow = detail.contextRows.find((r) => r.label === 'Телефон');
  const clientDisplayName = clientRow
    ? resolveNotificationClientName({
        full_name: clientRow.value,
        phone: phoneRow?.value ?? null,
      }) ?? clientRow.value
    : null;

  return (
    <div className="space-y-3">
      <p className={notifDetailNarrative}>{detail.narrative}</p>

      {clientDisplayName ? (
        <div className={notifDetailInsetPanel}>
          <div className="flex items-start gap-3">
            <AppointmentsClientAvatar
              name={clientDisplayName}
              phone={phoneRow?.value}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className={notifDetailSectionTitle}>Клиент</p>
              <p className="mt-0.5 text-[17px] font-bold tracking-[-0.03em] text-[#111827]">
                {clientDisplayName}
              </p>
              {phoneRow ? (
                <a
                  href={`tel:${phoneRow.value.replace(/\s/g, '')}`}
                  className="mt-1 inline-flex items-center gap-1 text-[14px] font-semibold text-[#F47C8C]"
                >
                  <HiPhone className="h-4 w-4" aria-hidden />
                  {phoneRow.value}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <ContextBlock
        rows={detail.contextRows.filter((r) => r.label !== 'Клиент' && r.label !== 'Телефон')}
      />

      {detail.highlight ? (
        <div className={notifDetailHighlight}>
          <p className={notifDetailSectionTitle}>Комментарий клиента</p>
          <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#374151]">
            {detail.highlight}
          </p>
        </div>
      ) : null}
    </div>
  );
}
