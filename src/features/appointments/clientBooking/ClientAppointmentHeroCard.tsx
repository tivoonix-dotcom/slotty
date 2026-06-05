import { HiCheckCircle } from 'react-icons/hi2';
import { CLIENT_BOOKING_COMPLETED_HERO_BG } from './clientBookingDetailUi';
import { clientBookingPanel, clientBookingStatusBadge } from './clientBookingDetailTheme';
import type { ClientAppointmentHeroView } from './clientAppointmentViewModel';

type Props = {
  hero: ClientAppointmentHeroView;
  layout: 'sheet' | 'page';
};

export function ClientAppointmentHeroCard({ hero, layout }: Props) {
  if (layout === 'page' && hero.showCompletedPhoto) {
    return (
      <div className="relative overflow-hidden rounded-[16px] bg-white p-5 lg:p-6">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${CLIENT_BOOKING_COMPLETED_HERO_BG})` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/95 via-white/88 to-white/72"
          aria-hidden
        />
        <div className="relative">
          <span className={`${clientBookingStatusBadge} ${hero.statusBadgeClass}`}>
            {hero.statusLabel}
          </span>
          <div className="mt-3 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
              <HiCheckCircle className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[20px]">
                {hero.serviceTitle}
              </h2>
              <p className="mt-1 text-[14px] font-semibold text-[#374151]">{hero.whenLabel}</p>
              <p className="mt-0.5 text-[13px] text-[#6B7280]">
                {hero.durationLabel} · {hero.priceLabel}
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">{hero.hint}</p>
              {hero.reviewThankYou ? (
                <p className="mt-2 text-[13px] font-semibold text-[#059669]">Спасибо за отзыв</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${clientBookingPanel} p-5 lg:p-6`}>
      {layout !== 'page' ? (
        <span className={`${clientBookingStatusBadge} ${hero.statusBadgeClass}`}>{hero.statusLabel}</span>
      ) : (
        <span className={`${clientBookingStatusBadge} ${hero.statusBadgeClass}`}>{hero.statusLabel}</span>
      )}
      <h2 className="mt-3 text-[18px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[20px]">
        {hero.serviceTitle}
      </h2>
      <p className="mt-1 text-[14px] font-semibold text-[#374151]">{hero.whenLabel}</p>
      <p className="mt-0.5 text-[13px] text-[#6B7280]">
        {hero.durationLabel} · {hero.priceLabel}
      </p>
      {hero.hint ? (
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B7280]">{hero.hint}</p>
      ) : null}
    </div>
  );
}
