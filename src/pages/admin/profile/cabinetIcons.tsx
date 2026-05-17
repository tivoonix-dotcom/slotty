import type { IconType } from 'react-icons';
import {
  HiAcademicCap,
  HiArrowLeftOnRectangle,
  HiArrowTrendingUp,
  HiBriefcase,
  HiBuildingOffice2,
  HiCalendar,
  HiCamera,
  HiChatBubbleLeftEllipsis,
  HiChatBubbleLeftRight,
  HiCheck,
  HiChevronRight,
  HiClock,
  HiCreditCard,
  HiDocumentText,
  HiEllipsisHorizontal,
  HiHeart,
  HiHome,
  HiMap,
  HiMapPin,
  HiPaperAirplane,
  HiPencil,
  HiPhone,
  HiPhoto,
  HiPlus,
  HiSquares2X2,
  HiStar,
  HiTag,
  HiTrash,
  HiUser,
  HiKey,
  HiDevicePhoneMobile,
} from 'react-icons/hi2';
import type { MasterVisitType } from '../../../features/profile/model/masterLocation';

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
  | 'card'
  | 'trash';

const ICONS: Record<CabinetIconName, IconType> = {
  'map-pin': HiMapPin,
  building: HiBuildingOffice2,
  home: HiHome,
  entrance: HiArrowLeftOnRectangle,
  floor: HiSquares2X2,
  apartment: HiKey,
  intercom: HiDevicePhoneMobile,
  landmark: HiMap,
  directions: HiArrowTrendingUp,
  comment: HiChatBubbleLeftEllipsis,
  pencil: HiPencil,
  user: HiUser,
  photo: HiPhoto,
  rules: HiDocumentText,
  star: HiStar,
  calendar: HiCalendar,
  heart: HiHeart,
  tag: HiTag,
  phone: HiPhone,
  send: HiPaperAirplane,
  chat: HiChatBubbleLeftRight,
  check: HiCheck,
  'chevron-right': HiChevronRight,
  camera: HiCamera,
  certificate: HiAcademicCap,
  briefcase: HiBriefcase,
  graduation: HiAcademicCap,
  plus: HiPlus,
  more: HiEllipsisHorizontal,
  clock: HiClock,
  card: HiCreditCard,
  trash: HiTrash,
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
  const Icon = ICONS[name];
  return <Icon size={size} className={`block shrink-0 ${className}`.trim()} aria-hidden />;
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
