import type { ReactNode } from 'react';
import type { MasterVisitType } from '../../../features/profile/model/masterLocation';

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export type CabinetIconName =
  | 'map-pin'
  | 'building'
  | 'home'
  | 'entrance'
  | 'floor'
  | 'apartment'
  | 'intercom'
  | 'landmark'
  | 'directions'
  | 'comment'
  | 'pencil'
  | 'user'
  | 'photo'
  | 'rules'
  | 'star'
  | 'calendar'
  | 'heart'
  | 'tag'
  | 'phone'
  | 'send'
  | 'chat'
  | 'check'
  | 'chevron-right'
  | 'camera'
  | 'certificate'
  | 'briefcase'
  | 'graduation'
  | 'plus'
  | 'more'
  | 'clock'
  | 'card';

const ICONS: Record<CabinetIconName, ReactNode> = {
  'map-pin': (
    <>
      <path d="M20 10c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9Z" {...stroke} />
      <circle cx="11" cy="10" r="2.5" {...stroke} />
    </>
  ),
  building: (
    <>
      <path d="M4 20V6.5a1 1 0 0 1 .55-.9L12 3l7.45 2.6a1 1 0 0 1 .55.9V20" {...stroke} />
      <path d="M9 20v-5h6v5" {...stroke} />
      <path d="M9 10h1M14 10h1M9 14h1M14 14h1" {...stroke} />
    </>
  ),
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5" {...stroke} />
      <path d="M6 9.5V20h12V9.5" {...stroke} />
    </>
  ),
  entrance: (
    <>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" {...stroke} />
      <path d="M10 12H3" {...stroke} />
      <path d="m6 9-3 3 3 3" {...stroke} />
    </>
  ),
  floor: (
    <>
      <path d="M4 7.5 12 3l8 4.5" {...stroke} />
      <path d="M4 12 12 7.5 20 12" {...stroke} />
      <path d="M4 16.5 12 21l8-4.5" {...stroke} />
    </>
  ),
  apartment: (
    <>
      <path d="M6 4h8a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2Z" {...stroke} />
      <path d="M10 12h4" {...stroke} />
      <circle cx="12" cy="9" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  intercom: (
    <>
      <rect x="5" y="4" width="14" height="16" rx="2" {...stroke} />
      <path d="M9 9h6M9 12h4" {...stroke} />
      <path d="M12 16v2" {...stroke} />
    </>
  ),
  landmark: (
    <>
      <path d="M12 3 5 20h14L12 3Z" {...stroke} />
      <path d="M9.5 16h5" {...stroke} />
    </>
  ),
  directions: (
    <>
      <circle cx="6" cy="18" r="2" {...stroke} />
      <circle cx="18" cy="6" r="2" {...stroke} />
      <path d="m8.5 16.5 7-7" {...stroke} />
      <path d="M14 6h4v4" {...stroke} />
    </>
  ),
  comment: (
    <>
      <path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3V7a2 2 0 0 1 2-2Z" {...stroke} />
    </>
  ),
  pencil: (
    <>
      <path d="M12 20h9" {...stroke} />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" {...stroke} />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.25" {...stroke} />
      <path d="M5 20c1.5-3.5 4.5-5.25 7-5.25S18.5 16.5 20 20" {...stroke} />
    </>
  ),
  photo: (
    <>
      <rect x="4" y="5" width="16" height="14" rx="2" {...stroke} />
      <circle cx="9" cy="10" r="1.25" {...stroke} />
      <path d="m4 17 5-5 4 4 3-3 4 4" {...stroke} />
    </>
  ),
  rules: (
    <>
      <path d="M8 4h9a1 1 0 0 1 1 1v15H9a1 1 0 0 1-1-1V4Z" {...stroke} />
      <path d="M6 4h2v16H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" {...stroke} />
      <path d="M11 8h5M11 12h5M11 16h3" {...stroke} />
    </>
  ),
  star: (
    <path
      d="m12 4 2.2 4.46 4.93.72-3.57 3.48.84 4.9L12 15.77l-4.4 2.31.84-4.9L4.87 9.18l4.93-.72L12 4Z"
      {...stroke}
    />
  ),
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" {...stroke} />
      <path d="M8 3v4M16 3v4M4 10h16" {...stroke} />
    </>
  ),
  heart: (
    <path
      d="M12 20s-6.5-4.35-8.5-8.5C1.5 8 4 5.5 7 5.5c1.74 0 3.41 1 5 2.7C13.59 6.5 15.26 5.5 17 5.5c3 0 5.5 2.5 3.5 6C18.5 15.65 12 20 12 20Z"
      {...stroke}
    />
  ),
  tag: (
    <>
      <path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-7 7-8-8Z" {...stroke} />
      <circle cx="9.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  phone: (
    <path
      d="M6.5 4.5c.5-1 1.5-1.5 2.5-1 2.2 1.1 4.1 2.9 5.5 5.1.5.9 0 2-.9 2.5l-1.2.8c-.4.3-.5.8-.3 1.2.8 1.7 2.2 3.1 3.9 3.9.4.2.9.1 1.2-.3l.8-1.2c.5-.9 1.6-1.4 2.5-.9 2.2 1.4 4 3.3 5.1 5.5.5 1 .1 2-1 2.5-1.2.5-2.5.8-3.8.8C10.2 22.3 4 16.1 4 8.5c0-1.3.3-2.6.8-3.8.5-1.1 1.6-1.5 2.5-1Z"
      {...stroke}
    />
  ),
  send: (
    <>
      <path d="M4 12 20 4 15 20 12 13 4 12Z" {...stroke} />
      <path d="M12 13 20 4" {...stroke} />
    </>
  ),
  chat: (
    <>
      <path d="M5 6h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H10l-4 3V8a2 2 0 0 1 2-2Z" {...stroke} />
    </>
  ),
  check: <path d="M5 12.5 9.5 16.5 19 7" {...stroke} />,
  'chevron-right': <path d="m10 7 5 5-5 5" {...stroke} />,
  camera: (
    <>
      <path d="M5 8h2l1.5-2h7L17 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" {...stroke} />
      <circle cx="12" cy="13" r="3" {...stroke} />
    </>
  ),
  certificate: (
    <>
      <circle cx="12" cy="9" r="3" {...stroke} />
      <path d="M8 14h8v7l-4-2-4 2v-7Z" {...stroke} />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="8" width="18" height="12" rx="2" {...stroke} />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...stroke} />
    </>
  ),
  graduation: (
    <>
      <path d="M3 9.5 12 4l9 5.5-9 5.5-9-5.5Z" {...stroke} />
      <path d="M7 12.5V17c0 1.1 2.2 2 5 2s5-.9 5-2v-4.5" {...stroke} />
    </>
  ),
  plus: (
    <>
      <path d="M12 6v12M6 12h12" {...stroke} />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" {...stroke} />
      <path d="M12 7v5l3 2" {...stroke} />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" {...stroke} />
      <path d="M3 10h18" {...stroke} />
    </>
  ),
};

export function CabinetIcon({
  name,
  size = 16,
  className = '',
}: {
  name: CabinetIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      shapeRendering="geometricPrecision"
      className={`block shrink-0 ${className}`.trim()}
    >
      {ICONS[name]}
    </svg>
  );
}

export function addressDetailIconName(label: string, visitType: MasterVisitType): CabinetIconName {
  const lower = label.toLowerCase();

  if (lower.includes('салон')) return 'building';
  if (lower.includes('подъезд') || lower.includes('вход')) return 'entrance';
  if (lower.includes('этаж')) return 'floor';
  if (lower.includes('кабинет') || lower.includes('квартир')) return 'apartment';
  if (lower.includes('домофон') || lower.includes('ресепшен')) return 'intercom';
  if (lower.includes('ориентир') || lower.includes('метро') || lower.includes('район')) return 'landmark';
  if (lower.includes('как пройти')) return 'directions';
  if (lower.includes('комментар')) return 'comment';
  if (lower.includes('дом') || lower.includes('корпус')) return 'home';
  if (lower.includes('адрес')) return 'map-pin';

  return visitType === 'at_home' ? 'home' : 'building';
}

export function AddressDetailIcon({
  label,
  visitType,
  size = 16,
}: {
  label: string;
  visitType: MasterVisitType;
  size?: number;
}) {
  return <CabinetIcon name={addressDetailIconName(label, visitType)} size={size} />;
}
