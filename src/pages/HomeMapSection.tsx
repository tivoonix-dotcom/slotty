import { useMemo } from 'react';
import type { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildYandexMapWidgetUrlForPoints, MAX_WIDGET_PLACEMARKS } from '../features/appointments/model/demoAppointments';
import { fetchPublishedMasters } from '../features/services/api/publishedMastersApi';
import { getApiBaseUrl } from '../shared/api/backendClient';

const MAP_FETCH_LIMIT = 300;

function toFiniteCoord(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

export const HomeMapSection: FC = () => {
  const apiBase = Boolean(getApiBaseUrl());

  const { data: masters, isLoading, isError, error } = useQuery({
    queryKey: ['masters-feed', 'map-pins', MAP_FETCH_LIMIT],
    enabled: apiBase,
    queryFn: async () => fetchPublishedMasters({ limit: MAP_FETCH_LIMIT }),
  });

  const { mapSrc, pinCount, mapShown, publishedCount } = useMemo(() => {
    const list = masters ?? [];
    const ptsAll = list
      .map((m) => {
        const lat = toFiniteCoord(m.location?.lat);
        const lng = toFiniteCoord(m.location?.lng);
        if (lat == null || lng == null) return null;
        return { lon: lng, lat };
      })
      .filter(Boolean) as { lon: number; lat: number }[];
    const mapShown = Math.min(ptsAll.length, MAX_WIDGET_PLACEMARKS);
    return {
      mapSrc: ptsAll.length > 0 ? buildYandexMapWidgetUrlForPoints(ptsAll) : null,
      pinCount: ptsAll.length,
      mapShown,
      publishedCount: list.length,
    };
  }, [masters]);

  const showMap = Boolean(mapSrc);

  return (
    <section className="mt-14 animate-fade-enter scroll-mt-28 sm:mt-16" style={{ animationDelay: '100ms' }}>
      <div className="mb-4 px-1 text-center sm:text-left">
        <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.05em] text-neutral-950 sm:text-[32px]">
          Мастера на карте
        </h2>
        {!apiBase ? (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-neutral-500">
            Карта подгружается с сервера: задайте <span className="font-mono text-[13px]">VITE_API_URL</span> в окружении
            сборки, чтобы показать реальные точки приёма опубликованных мастеров.
          </p>
        ) : isError ? (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#B66A24]">
            Не удалось загрузить мастеров для карты
            {error instanceof Error ? `: ${error.message}` : '.'}
          </p>
        ) : !isLoading && pinCount > 0 ? (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-neutral-500">
            {pinCount > mapShown
              ? `Только опубликованные мастера с сохранёнными координатами. На карте — первые ${mapShown} из ${pinCount} точек (ограничение виджета Яндекса).`
              : `Опубликованные мастера с координатами из профиля: ${mapShown} точек на карте.`}
            {publishedCount > pinCount ? ` В каталоге ещё ${publishedCount - pinCount} без координат — метки появятся после указания точки на карте в анкете.` : ''}
          </p>
        ) : !isLoading && publishedCount > 0 && pinCount === 0 ? (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-neutral-500">
            Опубликованные мастера есть, но ни у кого пока не сохранены координаты точки приёма. После выбора адреса на
            карте в анкете мастера метки появятся здесь автоматически.
          </p>
        ) : !isLoading && publishedCount === 0 ? (
          <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-neutral-500">
            Пока нет опубликованных мастеров с адресом — карта появится, когда мастера завершат анкету и публикацию.
          </p>
        ) : null}
      </div>

      <div className="rounded-[36px] bg-[#F1EFEF] p-3 shadow-[0_24px_70px_rgba(17,17,17,0.05)]">
        <div className="overflow-hidden rounded-[28px] bg-white p-2 shadow-[0_10px_30px_rgba(17,17,17,0.035)]">
          <p className="px-2 pb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Яндекс.Карты
          </p>
          <div className="overflow-hidden rounded-[22px] bg-neutral-200 shadow-[inset_0_0_0_1px_rgba(17,17,17,0.04)]">
            {showMap ? (
              <iframe
                key={mapSrc}
                title="Карта — мастера"
                src={mapSrc!}
                className="block h-[min(280px,50dvh)] w-full min-h-[220px] border-0 sm:h-[min(320px,45dvh)]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div
                className={`flex h-[min(280px,50dvh)] min-h-[220px] w-full flex-col items-center justify-center gap-2 px-4 text-center sm:h-[min(320px,45dvh)] ${
                  isLoading && apiBase ? 'animate-pulse' : ''
                }`}
              >
                {isLoading && apiBase ? (
                  <>
                    <span className="text-[13px] font-medium text-neutral-500">Загрузка точек…</span>
                    <span className="max-w-xs text-[12px] leading-relaxed text-neutral-400">
                      Подставляются только реальные координаты из базы, без демо-меток.
                    </span>
                  </>
                ) : (
                  <span className="max-w-sm text-[13px] leading-relaxed text-neutral-500">
                    {apiBase
                      ? 'Здесь будет карта с метками, как только у опубликованных мастеров появятся сохранённые координаты.'
                      : 'Подключите API, чтобы загрузить мастеров и их метки.'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
