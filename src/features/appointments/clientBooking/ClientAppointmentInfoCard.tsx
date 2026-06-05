import {
  HiCalendarDays,
  HiClock,
  HiHashtag,
  HiMapPin,
  HiScissors,
  HiWallet,
} from 'react-icons/hi2';
import { formatServiceName } from '../../../shared/lib/displayFormat';
import { formatPriceByn } from '../../../pages/profile/profileFormat';
import { formatDurationMinutes } from '../../../pages/admin/appointments/appointmentsFormat';
import type { ClientBookingDetail } from './clientBookingDetailTypes';
import { ClientBookingDetailRow, ClientBookingSectionTitle } from './clientBookingDetailUi';
import { clientBookingPanel } from './clientBookingDetailTheme';
import { formatAppointmentWhen } from './clientAppointmentViewModel';

type Props = {
  detail: ClientBookingDetail;
};

export function ClientAppointmentInfoCard({ detail }: Props) {
  const visitLabel = detail.location_visit_type === 'at_home' ? 'На дому' : 'В студии';
  const durationLabel = formatDurationMinutes(
    detail.service_duration_minutes,
    detail.service_title_snapshot,
  );
  const price = Number.parseFloat(String(detail.price_snapshot));
  const priceLabel = Number.isFinite(price) && price > 0 ? formatPriceByn(price) : '—';

  return (
    <div className={`${clientBookingPanel} p-4 lg:p-5`}>
      <ClientBookingSectionTitle>Детали записи</ClientBookingSectionTitle>
      <div className="mt-1">
        <ClientBookingDetailRow
          icon={<HiScissors className="h-4 w-4" aria-hidden />}
          label="Услуга"
          value={formatServiceName(detail.service_title_snapshot)}
        />
        <ClientBookingDetailRow
          icon={<HiCalendarDays className="h-4 w-4" aria-hidden />}
          label="Дата и время"
          value={formatAppointmentWhen(detail)}
        />
        <ClientBookingDetailRow
          icon={<HiClock className="h-4 w-4" aria-hidden />}
          label="Длительность"
          value={durationLabel || '—'}
        />
        <ClientBookingDetailRow
          icon={<HiWallet className="h-4 w-4" aria-hidden />}
          label="Стоимость"
          value={priceLabel}
        />
        <ClientBookingDetailRow
          icon={<HiMapPin className="h-4 w-4" aria-hidden />}
          label="Формат"
          value={visitLabel}
        />
        {detail.address?.line ? (
          <ClientBookingDetailRow
            icon={<HiMapPin className="h-4 w-4" aria-hidden />}
            label="Адрес"
            value={detail.address.line}
          />
        ) : null}
        {!detail.address?.line && detail.address?.hint ? (
          <p className="py-3 pl-11 text-[13px] leading-relaxed text-[#6B7280]">{detail.address.hint}</p>
        ) : null}
        {detail.voucher_number ? (
          <ClientBookingDetailRow
            icon={<HiHashtag className="h-4 w-4" aria-hidden />}
            label="Номер записи"
            value={detail.voucher_number}
          />
        ) : null}
      </div>
    </div>
  );
}
