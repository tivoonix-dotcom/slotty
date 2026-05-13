import type { FC } from 'react';
import { buildYandexMapWidgetUrl } from '../features/appointments/model/demoAppointments';
import type { MasterLocation } from '../features/profile/model/masterLocation';

const HUB_MAP_LOCATION: MasterLocation = {
  visitType: 'studio',
  street: 'Минск',
  building: '',
};

/** Демо-центр карты на главной; тот же `map-widget`, что в деталях записи в профиле. */
const HUB_MAP_WIDGET_SRC = buildYandexMapWidgetUrl({
  addressShort: 'Минск',
  yandexMap: { lon: 27.5615, lat: 53.9045, zoom: 11 },
  location: HUB_MAP_LOCATION,
});

export const HomeMapSection: FC = () => {
  return (
    <section className="mt-14 animate-fade-enter scroll-mt-28 sm:mt-16" style={{ animationDelay: '100ms' }}>
      <div className="mb-4 px-1 text-center sm:text-left">
        
        <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.05em] text-neutral-950 sm:text-[32px]">
          Мастера на карте
        </h2>
      </div>

      <div className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_24px_70px_rgba(17,17,17,0.05)]">
        <div className="overflow-hidden rounded-[28px] bg-white p-2 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <p className="px-2 pb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Яндекс.Карты
          </p>
          <div className="overflow-hidden rounded-[22px] bg-neutral-200 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.04)]">
            <iframe
              title="Карта — Минск"
              src={HUB_MAP_WIDGET_SRC}
              className="block h-[min(280px,50dvh)] w-full min-h-[220px] border-0 sm:h-[min(320px,45dvh)]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
