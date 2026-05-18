import type { ReactNode } from 'react';
import { NOTHING_FOUND_ILLUSTRATION_SRC } from '../../../shared/ui/nothingFoundIllustrationSrc';
import { clientOutlineBtn } from '../clientTheme';

type Props = {
  /** Если передан — вместо стандартной иллюстрации «ничего не нашли». */
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, description, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center rounded-[28px] bg-[#F1EFEF] px-6 py-10 text-center shadow-[0_12px_40px_rgba(17,24,39,0.045)]">
      {icon ? (
        <div className="mb-4 text-[#F47C8C] opacity-80">{icon}</div>
      ) : (
        <img
          src={NOTHING_FOUND_ILLUSTRATION_SRC}
          alt=""
          width={320}
          height={280}
          decoding="async"
          className="mx-auto mb-5 w-full max-w-[16.5rem] select-none object-contain"
        />
      )}
      <p className="text-[18px] font-semibold leading-snug tracking-tight text-[#111827]">{title}</p>
      {description ? (
        <p className="mt-2 max-w-[20rem] text-[14px] leading-relaxed text-[#6B7280]">{description}</p>
      ) : null}
      {actionLabel && onAction ? (
        <button type="button" className={`${clientOutlineBtn} mt-5`} onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
