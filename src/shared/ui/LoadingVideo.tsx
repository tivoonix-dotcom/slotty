import { type ReactNode, useEffect, useRef, useState } from 'react';
import { LOADING_VIDEO_SRC, LOADING_VIDEO_SRC_FALLBACK } from './loadingVideoSrc';

/** Быстрее цикл анимации (выше = «чаще» повторяется движение). */
const LOADING_PLAYBACK_RATE = 1.85;

const SIZE_CLASS = {
  sm: 'h-24 w-24',
  md: 'h-44 w-44',
  lg: 'h-64 w-64',
  xl: 'h-[min(22rem,72vw)] w-[min(22rem,72vw)]',
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const applyRate = () => {
      video.playbackRate = LOADING_PLAYBACK_RATE;
    };

    applyRate();
    video.addEventListener('loadedmetadata', applyRate);
    return () => video.removeEventListener('loadedmetadata', applyRate);
  }, [src]);

  return (
    <div
      className={`mx-auto flex w-full max-w-full flex-col items-center justify-center gap-4 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <video
        ref={videoRef}
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        preload="auto"
        className={`${SIZE_CLASS[size]} shrink-0 object-contain`}
        aria-hidden
        onError={() => {
          setSrc((current) =>
            current === LOADING_VIDEO_SRC ? LOADING_VIDEO_SRC_FALLBACK : current,
          );
        }}
      />
      {label ? (
        <p className="max-w-[18rem] text-center text-[13px] font-medium leading-snug text-[#9CA3AF]">
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
      className={`flex min-h-dvh w-full flex-col items-center justify-center bg-white px-4 py-12 ${className}`}
    >
      <LoadingVideo size="xl" label={label} />
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
  minHeight = 'min-h-[18rem]',
}: LoadingPanelProps) {
  return (
    <div
      className={`flex w-full ${minHeight} items-center justify-center rounded-[24px] border border-[#F3F4F6] bg-white p-8 shadow-[0_8px_28px_rgba(17,24,39,0.04)] ${className}`}
    >
      <LoadingVideo size="lg" label={label} />
    </div>
  );
}
