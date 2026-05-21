import { useMemo, type ReactNode } from 'react';
import { buildYandexMapWidgetUrl } from '../../../features/appointments/model/demoAppointments';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import {
  buildLocationDisplayParts,
  catalogLineWithoutVisitPrefix,
  masterVisitTypeLabel,
  type MasterVisitType,
} from '../../../features/profile/model/masterLocation';
import { cabinetCard, cabinetCardPad, cabinetIconCircle } from './adminProfileCabinetTheme';
import {
  addressDetailIconName,
  AddressDetailIcon,
  CabinetIcon,
  type CabinetIconName,
} from './cabinetIcons';

export { addressDetailIconName };

export function addressDetailIcon(label: string, visitType: MasterVisitType) {
  return <AddressDetailIcon label={label} visitType={visitType} size={16} />;
}

function VisitTypeBadge({ visitType }: { visitType: MasterVisitType }) {
  const isHome = visitType === 'at_home';
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-[#F7F7F8] p-3.5">
      <span className={`${cabinetIconCircle} h-10 w-10`}>
        <CabinetIcon name={isHome ? 'home' : 'building'} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#6B7280]">Формат приёма</p>
        <p className="mt-0.5 text-[17px] font-semibold leading-snug text-[#111827]">
          {masterVisitTypeLabel(visitType)}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[12px] font-semibold text-[#F47C8C]">
        Минск
      </span>
    </div>
  );
}

function AddressInfoRow({
  iconName,
  label,
  value,
}: {
  iconName: CabinetIconName;
  label: string;
  value: string;
}) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || trimmed === '—') return null;

  return (
    <div className="flex items-start gap-2.5 rounded-[16px] bg-[#F7F7F8] px-3 py-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF1F4] text-[#F47C8C]">
        <CabinetIcon name={iconName} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-tight text-[#9CA3AF]">{label}</p>
        <p className="mt-0.5 whitespace-pre-wrap text-[15px] font-semibold leading-snug text-[#111827]">
          {trimmed}
        </p>
      </div>
    </div>
  );
}

function AddressBlockTitle({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[14px] font-semibold text-[#111827]">{children}</p>;
}

function buildCatalogMapWidgetUrl(
  addressText: string,
  coords?: { lat?: number; lng?: number },
): string {
  const hasCoords = coords?.lat != null && coords?.lng != null;
  return buildYandexMapWidgetUrl({
    addressShort: addressText,
    yandexMap: hasCoords
      ? { lat: coords!.lat!, lon: coords!.lng!, zoom: 16 }
      : undefined,
    location: {
      visitType: 'studio',
      street: addressText,
      building: '',
      lat: coords?.lat,
      lng: coords?.lng,
    },
  });
}

function AddressCatalogMap({
  address,
  lat,
  lng,
}: {
  address: string;
  lat?: number;
  lng?: number;
}) {
  const mapSrc = useMemo(() => buildCatalogMapWidgetUrl(address, { lat, lng }), [address, lat, lng]);

  return (
    <div className="mt-2 overflow-hidden rounded-[18px] bg-[#F7F7F8] ring-1 ring-[#EAECEF]">
      <iframe
        title={`Карта — ${address}`}
        src={mapSrc}
        className="block h-[min(220px,42dvh)] w-full min-h-[180px] border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

/** Подпись поля в форме редактирования адреса. */
export function AddressFieldLabel({
  iconName,
  children,
}: {
  iconName: CabinetIconName;
  children: ReactNode;
}) {
  return (
    <span className="mb-1 flex items-center gap-2 text-[13px] font-medium text-[#6B7280]">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF1F4] text-[#F47C8C]">
        <CabinetIcon name={iconName} size={16} />
      </span>
      <span className="min-w-0">{children}</span>
    </span>
  );
}

export function AddressSection({
  draft,
  onEditAddress,
}: {
  draft: MasterDraft;
  onEditAddress: () => void;
}) {
  const loc = draft.location;
  const parts = buildLocationDisplayParts(loc);
  const visitType = loc?.visitType ?? 'studio';
  const visitLabel = parts?.visitLabel ?? masterVisitTypeLabel(visitType);

  const catalogMain = parts
    ? catalogLineWithoutVisitPrefix(parts.catalogLine, visitLabel)
    : '—';

  const detailRows = parts
    ? [
        ...(parts.addressLine && parts.addressLine !== '—'
          ? [{ label: 'Адрес', value: parts.addressLine }]
          : []),
        ...parts.access,
        ...parts.wayfinding,
      ].filter((row) => row.value?.trim())
    : [];

  const hasAfterBooking = detailRows.length > 0;

  return (
    <section className={`${cabinetCard} ${cabinetCardPad}`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 flex-1 text-[18px] font-semibold leading-tight tracking-[-0.03em] text-[#111827]">
            Адрес
          </h2>
          <button
            type="button"
            onClick={onEditAddress}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#FFF1F4] px-3 text-[12px] font-semibold leading-none text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]"
          >
            <CabinetIcon name="pencil" size={14} />
            Изменить
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <VisitTypeBadge visitType={visitType} />

          <div>
            <AddressBlockTitle>На карточке в каталоге</AddressBlockTitle>
            {!catalogMain || catalogMain === '—' ? (
              <p className="rounded-[16px] bg-[#F7F7F8] px-3 py-2.5 text-center text-[13px] leading-snug text-[#9CA3AF]">
                Адрес не указан — нажмите «Изменить»
              </p>
            ) : (
              <>
                <AddressInfoRow iconName="map-pin" label="Адрес для всех" value={catalogMain} />
                <AddressCatalogMap address={catalogMain} lat={loc?.lat} lng={loc?.lng} />
              </>
            )}
          </div>

          {hasAfterBooking ? (
            <div className="border-t border-[#EAECEF] pt-3">
              <AddressBlockTitle>После записи</AddressBlockTitle>
              <div className="space-y-2">
                {detailRows.map((row) => (
                  <AddressInfoRow
                    key={`${row.label}-${row.value}`}
                    iconName={addressDetailIconName(row.label, visitType)}
                    label={row.label}
                    value={row.value}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-[16px] bg-[#FAFAFA] px-3 py-2.5 text-center text-[13px] leading-snug text-[#9CA3AF]">
              Детали «после записи» не указаны — клиент увидит только адрес из каталога
            </p>
          )}
        </div>
    </section>
  );
}
