import type { ReactNode } from 'react';
import {
  masterCardAvatarColor,
  masterCardInitials,
  masterListingPortraitUrl,
} from '../../../features/masters/lib/masterListingPortrait';
import { ImageReveal } from '../../../shared/ui/ImageReveal';

type Props = {
  masterName: string;
  photoUrl?: string | null;
  className?: string;
  imageClassName?: string;
  loading?: 'lazy' | 'eager';
  badge?: ReactNode;
  photoMaxEdge?: number;
};

/** Портрет мастера в карточке: своё фото или цветной плейсхолдер с инициалами (без Google). */
export function MasterCardPortrait({
  masterName,
  photoUrl,
  className = 'relative h-full w-full',
  imageClassName = 'h-full w-full rounded-[14px] object-cover',
  loading = 'lazy',
  badge,
  photoMaxEdge,
}: Props) {
  const src = masterListingPortraitUrl(photoUrl, photoMaxEdge);

  if (src) {
    return (
      <div className={className}>
        <ImageReveal src={src} alt="" className={imageClassName} loading={loading} />
        {badge}
      </div>
    );
  }

  const rounded =
    imageClassName.includes('rounded-full')
      ? 'rounded-full'
      : imageClassName.match(/rounded-\[[^\]]+\]|rounded-\w+/)?.[0] ?? 'rounded-[14px]';

  const initials = masterCardInitials(masterName);
  const initialsSizeClass =
    initials.length > 1 ? 'text-[length:38cqmin]' : 'text-[length:46cqmin]';

  return (
    <div className={`${className} [container-type:size]`}>
      <span
        className={`grid h-full w-full place-items-center font-bold leading-none tracking-tight text-white ${rounded}`}
        style={{ backgroundColor: masterCardAvatarColor(masterName) }}
        aria-hidden
      >
        <span className={`${initialsSizeClass} inline-flex items-center justify-center leading-none`}>
          {initials}
        </span>
      </span>
      {badge}
    </div>
  );
}
