import { HiScissors } from 'react-icons/hi2';
import { servicesIconCircle } from './adminServicesTheme';

export function ServiceThumbnail({
  src,
  title,
  sizeClass,
}: {
  src: string;
  title: string;
  sizeClass: string;
}) {
  return (
    <span
      className={`relative shrink-0 overflow-hidden bg-[#f6f7fb] ring-1 ring-[#EAECEF]/80 ${sizeClass}`}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover object-center"
        decoding="async"
      />
      <span className="sr-only">{title}</span>
    </span>
  );
}

export function ServiceThumbnailFallback({ sizeClass }: { sizeClass: string }) {
  return (
    <span className={`${servicesIconCircle} shrink-0 ${sizeClass}`}>
      <HiScissors className="h-7 w-7" aria-hidden />
    </span>
  );
}
