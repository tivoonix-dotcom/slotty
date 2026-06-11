import { useId } from 'react';

type Props = {
  className?: string;
  size?: number;
};

/** Иконка Pro — три искры с розовым градиентом (без растра). */
export function SlottyProSparkleIcon({ className = '', size = 20 }: Props) {
  const gradientId = useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="5" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB3C0" />
          <stop stopColor="#F47C8C" />
          <stop offset="1" stopColor="#E85D73" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.25c.42 2.35.42 2.35 2.55 4.48 2.13 2.13 2.13 2.13 4.48 2.55-2.35.42-2.35.42-4.48 2.55-2.13 2.13-2.13 2.13-2.55 4.48-.42-2.35-.42-2.35-2.55-4.48-2.13-2.13-2.13-2.13-4.48-2.55 2.35-.42 2.35-.42 4.48-2.55 2.13-2.13 2.13-2.13 2.55-4.48z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M18.75 5.5c.18.95.18.95.95 1.12.77.17.77.17.95 1.12-.18.95-.18.95-.95 1.12-.77.17-.77.17-.95 1.12-.18-.95-.18-.95-.95-1.12-.77-.17-.77-.17-.95-1.12.18-.95.18-.95.95-1.12.77-.17.77-.17.95-1.12z"
        fill="#F47C8C"
        opacity="0.92"
      />
      <path
        d="M6.25 16.75c.12.62.12.62.62.75.5.13.5.13.62.75-.12.62-.12.62-.62.75-.5.13-.5.13-.62.75-.12-.62-.12-.62-.62-.75-.5-.13-.5-.13-.62-.75.12-.62.12-.62.62-.75.5-.13.5-.13.62-.75z"
        fill="#FF9AAC"
        opacity="0.88"
      />
    </svg>
  );
}
