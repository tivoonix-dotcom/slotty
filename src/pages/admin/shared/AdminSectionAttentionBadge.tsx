import { SlottyImg } from '../../../shared/ui/SlottyImg';

/** `public/photos/badges/warning.webp` */
export const ADMIN_ATTENTION_EXCLAMATION_ICON_SRC = '/photos/badges/warning.webp';

type Props = {
  className?: string;
  label?: string;
};

/** Красный индикатор «требует внимания» у таба или пункта меню. */
export function AdminSectionAttentionBadge({
  className = '',
  label = 'Есть услуги без времени для записи',
}: Props) {
  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center ${className}`.trim()}
      title={label}
      aria-label={label}
    >
      <SlottyImg
        src={ADMIN_ATTENTION_EXCLAMATION_ICON_SRC}
        alt=""
        className="h-full w-full object-contain"
        decoding="async"
      />
    </span>
  );
}
