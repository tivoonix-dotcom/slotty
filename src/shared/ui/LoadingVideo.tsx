import { type ReactNode, useState } from 'react';
import { LOADING_VIDEO_SRC, LOADING_VIDEO_SRC_FALLBACK } from './loadingVideoSrc';

const SIZE_CLASS = {
  sm: 'h-16 w-16',
  md: 'h-28 w-28',
  lg: 'h-36 w-36',
} as const;

type Size = keyof typeof SIZE_CLASS;

type LoadingVideoProps = {
  size?: Size;
  /** Видимая подпись — только если нужен контекст; по умолчанию только видео. */
  label?: string;
  className?: string;
};

export function LoadingVideo({ size = 'md', label, className = '' }: LoadingVideoProps) {
  const [src, setSrc] = useState(LOADING_VIDEO_SRC);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <video
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        preload="auto"
        className={`${SIZE_CLASS[size]} object-contain`}
        aria-hidden
        onError={() => {
          setSrc((current) =>
            current === LOADING_VIDEO_SRC ? LOADING_VIDEO_SRC_FALLBACK : current,
          );
        }}
      />
      {label ? (
        <p className="max-w-[16rem] text-center text-[13px] font-medium leading-snug text-[#9CA3AF]">
          {label}
        </p>
      ) : (
        <span className="sr-only">Загрузка</span>
      )}
    </div>
  );
}

type LoadingScreenProps = {
  label?: string;
  className?: string;
  children?: ReactNode;
};

/** Полноэкранная загрузка (страница, роут). */
export function LoadingScreen({ label, className = '', children }: LoadingScreenProps) {
  return (
    <div
      className={`flex min-h-dvh flex-col items-center justify-center bg-white px-4 py-12 ${className}`}
    >
      <LoadingVideo size="lg" label={label} />
      {children}
    </div>
  );
}

type LoadingPanelProps = {
  label?: string;
  className?: string;
  minHeight?: string;
};

/** Блок загрузки внутри карточки / секции. */
export function LoadingPanel({
  label,
  className = '',
  minHeight = 'min-h-[14rem]',
}: LoadingPanelProps) {
  return (
    <div
      className={`flex ${minHeight} items-center justify-center rounded-[24px] border border-[#F3F4F6] bg-white p-8 shadow-[0_8px_28px_rgba(17,24,39,0.04)] ${className}`}
    >
      <LoadingVideo size="lg" label={label} />
    </div>
  );
}
