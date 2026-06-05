import { HiArrowTopRightOnSquare } from 'react-icons/hi2';
import { getMasterPublicPreviewLabel, getMasterPublicPreviewPath } from '../masterPublicPreview';

type Props = {
  masterId: string | null | undefined;
  ready?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
};

const variantClass: Record<NonNullable<Props['variant']>, string> = {
  primary:
    'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[12px] bg-[#FFF1F4] px-4 text-[13px] font-bold text-[#F47C8C] transition hover:bg-[#FFE4EA] active:scale-[0.98]',
  secondary:
    'inline-flex min-h-11 min-w-0 items-center justify-center gap-1 rounded-[12px] bg-[#f6f7fb] px-3 text-[13px] font-semibold leading-tight text-[#374151] transition hover:bg-[#EEF0F4] active:scale-[0.98]',
  ghost:
    'inline-flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-[#F47C8C] transition hover:opacity-90',
};

export function MasterPublicPreviewLink({
  masterId,
  ready = true,
  className = '',
  variant = 'secondary',
}: Props) {
  const href = getMasterPublicPreviewPath(masterId);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${variantClass[variant]} ${className}`}
    >
      {getMasterPublicPreviewLabel(ready)}
      <HiArrowTopRightOnSquare className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
    </a>
  );
}
