import { HiPhone } from 'react-icons/hi2';
import type { DemoMasterAppointment } from '../../../features/master/model/demoMasterAppointments';
import { AppointmentsClientAvatar } from './AppointmentsClientAvatar';
import { bookingSourceLabel } from './appointmentsFormat';
import { resolveClientDisplayName } from './appointmentDetailHelpers';

type Props = {
  appointment: DemoMasterAppointment;
  size?: 'md' | 'lg';
  compact?: boolean;
};

function ContactLine({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <span className="text-[14px] font-semibold text-[#111827]">{value}</span>
  );
  return (
    <div className="flex items-start justify-between gap-3 text-[13px]">
      <span className="shrink-0 text-[#6B7280]">{label}</span>
      {href ? (
        <a href={href} className="min-w-0 text-right text-[#F47C8C] hover:underline">
          {content}
        </a>
      ) : (
        <div className="min-w-0 text-right">{content}</div>
      )}
    </div>
  );
}

export function AppointmentsClientSummary({ appointment, size = 'md', compact = false }: Props) {
  const phone = appointment.contact?.trim() || null;
  const email = appointment.clientEmail?.trim() || null;
  const telegram = appointment.clientTelegramUsername?.trim().replace(/^@+/, '') || null;
  const telegramLabel = telegram ? `@${telegram}` : null;
  const displayName = resolveClientDisplayName(appointment);

  return (
    <div className={compact ? 'flex items-start gap-3' : 'rounded-[10px] bg-[#F5F5F5] px-4 py-4 lg:px-5 lg:py-5'}>
      <AppointmentsClientAvatar
        name={displayName}
        phone={phone}
        photoUrl={appointment.clientAvatarUrl}
        size={size}
      />
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[18px]">
          {displayName}
        </p>
        {!compact ? (
          <div className="mt-3 space-y-2">
            {phone ? (
              <ContactLine label="Телефон" value={phone} href={`tel:${phone.replace(/\s/g, '')}`} />
            ) : null}
            {email ? <ContactLine label="Email" value={email} href={`mailto:${email}`} /> : null}
            {telegramLabel ? (
              <ContactLine label="Telegram" value={telegramLabel} href={`https://t.me/${telegram}`} />
            ) : null}
            <ContactLine
              label="Источник"
              value={bookingSourceLabel(appointment.bookingSource)}
            />
          </div>
        ) : (
          <div className="mt-1 space-y-0.5">
            {phone ? (
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#F47C8C]"
              >
                <HiPhone className="h-3.5 w-3.5" aria-hidden />
                {phone}
              </a>
            ) : null}
            {telegramLabel ? (
              <p className="text-[13px] font-medium text-[#6B7280]">{telegramLabel}</p>
            ) : null}
            {email ? <p className="truncate text-[13px] text-[#6B7280]">{email}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
