import { adminIntroOverlayClass } from './adminIntroOverlay';
import { useTabIntroImage } from './useTabIntroImage';

export const ADMIN_TAB_INTRO_HEIGHT_CLASS = 'h-[8.5rem]';

type Props = {
  title: string;
  description: string;
  imageSrc: string;
  wrapper?: 'header' | 'div';
  wrapperClassName?: string;
};

export function AdminTabIntroBanner({
  title,
  description,
  imageSrc,
  wrapper = 'div',
  wrapperClassName = '',
}: Props) {
  const displaySrc = useTabIntroImage(imageSrc);

  const card = (
    <div className={`relative ${ADMIN_TAB_INTRO_HEIGHT_CLASS} overflow-hidden rounded-[22px]`}>
      <img
        src={displaySrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
      />
      <div className={`absolute inset-0 ${adminIntroOverlayClass}`} aria-hidden />
      <div
        className={`relative flex ${ADMIN_TAB_INTRO_HEIGHT_CLASS} flex-col justify-center p-4`}
      >
        <h2 className="text-[18px] font-bold leading-snug tracking-[-0.04em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
          {title}
        </h2>
        <p className="mt-1.5 line-clamp-2 max-w-[20rem] text-[13px] leading-relaxed text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
          {description}
        </p>
      </div>
    </div>
  );

  if (wrapper === 'header') {
    return (
      <header className={`pb-4 ${wrapperClassName}`.trim()} role="region" aria-label={title}>
        {card}
      </header>
    );
  }

  return (
    <div className={wrapperClassName} role="region" aria-label={title}>
      {card}
    </div>
  );
}
