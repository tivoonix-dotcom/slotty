import { HiHomeModern, HiLockClosed, HiMapPin } from 'react-icons/hi2';
import {
  buildLocationDisplayParts,
  catalogLineWithoutVisitPrefix,
  filterAtHomeSensitiveAccessRows,
  formatHomePublicBeforeBooking,
  isHomeAddressHiddenUntilBooking,
  masterVisitTypeLabel,
  type MasterLocation,
} from '../../../features/profile/model/masterLocation';
import { EMPTY_ADDRESS, isEmptyDisplayValue, LOCATION_EMPTY_SENTINEL } from '../../../shared/lib/emptyDisplayText';
import { makeYandexMapsRouteUrl } from '../../../shared/lib/yandexMapsExternal';
import { YandexMapsRouteIcon } from '../../../shared/ui/YandexMapsRouteIcon';

type DetailRow = { label: string; value: string };

function DetailList({ rows }: { rows: DetailRow[] }) {
  const visible = rows.filter((r) => r.label.trim() && r.value.trim());
  if (!visible.length) return null;

  return (
    <ul className="mt-3 space-y-2.5">
      {visible.map((row) => (
        <li key={`${row.label}-${row.value}`} className="flex gap-3 text-[14px] leading-snug">
          <span className="w-[5.5rem] shrink-0 font-medium text-[#9CA3AF]">{row.label}</span>
          <span className="min-w-0 flex-1 font-medium text-[#374151]">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

type Props = {
  location: MasterLocation;
  /** Клиент уже записался и мастер подтвердил — показываем подъезд, этаж, домофон. */
  revealed?: boolean;
  showRoute?: boolean;
};

export function MasterAddressBlock({ location, revealed = false, showRoute = true }: Props) {
  const parts = buildLocationDisplayParts(location);
  const visitLabel = parts?.visitLabel ?? masterVisitTypeLabel(location.visitType);
  const hideDetails = isHomeAddressHiddenUntilBooking(location) && !revealed;

  const mainLine = (() => {
    if (hideDetails) {
      const publicLine = formatHomePublicBeforeBooking(location);
      if (publicLine?.trim()) return publicLine.trim();
      const district = location.district?.trim();
      if (district) return district;
      return null;
    }
    if (parts?.addressLine && parts.addressLine !== LOCATION_EMPTY_SENTINEL) {
      return parts.addressLine.trim();
    }
    if (parts?.catalogLine) {
      const withoutVisit = catalogLineWithoutVisitPrefix(parts.catalogLine, visitLabel);
      if (withoutVisit.trim()) return withoutVisit.trim();
    }
    return null;
  })();

  const detailRows: DetailRow[] = filterAtHomeSensitiveAccessRows(
    hideDetails ? [] : [...(parts?.access ?? []), ...(parts?.wayfinding ?? [])],
    location,
  );

  const VisitIcon = location.visitType === 'at_home' ? HiHomeModern : HiMapPin;
  const hasRealAddress =
    Boolean(mainLine) &&
    mainLine !== EMPTY_ADDRESS &&
    !isEmptyDisplayValue(mainLine);
  const hasRouteCoords = Boolean(
    (location.lat != null && location.lng != null) ||
      (location.distanceLat != null && location.distanceLng != null),
  );
  const canBuildRoute = showRoute && !hideDetails && hasRealAddress && hasRouteCoords;

  return (
    <div className="space-y-3">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF1F4] px-3 py-1.5 text-[13px] font-semibold text-[#F47C8C]">
        <VisitIcon className="h-4 w-4 shrink-0" aria-hidden />
        {visitLabel}
      </span>

      {hasRealAddress ? (
        <p className="text-[15px] font-semibold leading-snug text-[#111827]">{mainLine}</p>
      ) : (
        <p className="text-[14px] text-[#6B7280]">Адрес уточняется у мастера</p>
      )}

      {hideDetails ? (
        <div className="flex gap-3 rounded-[14px] bg-[#FAFAFA] px-3.5 py-3 ring-1 ring-[#F3F4F6]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white text-[#9CA3AF] ring-1 ring-[#EEEEEE]">
            <HiLockClosed className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-[13px] leading-relaxed text-[#6B7280]">
            Подъезд, этаж, квартира и домофон откроются после подтверждения записи мастером.
          </p>
        </div>
      ) : (
        <DetailList rows={detailRows} />
      )}

      {canBuildRoute ? (
        <a
          href={makeYandexMapsRouteUrl({
            lat: location.lat ?? location.distanceLat,
            lng: location.lng ?? location.distanceLng,
            addressLine: mainLine ?? undefined,
          })}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#FFF1F4] px-4 text-[13px] font-semibold text-[#E29595] transition hover:bg-[#FFE8EC] active:scale-[0.98]"
        >
          <YandexMapsRouteIcon className="shrink-0" />
          Построить маршрут
        </a>
      ) : null}
    </div>
  );
}
