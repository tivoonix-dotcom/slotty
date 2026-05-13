import type { ReactNode } from 'react';
import { NOTHING_FOUND_ILLUSTRATION_SRC } from './nothingFoundIllustrationSrc';

type Props = {
  title: string;
  text: string;
  /** Кнопка или ссылка под текстом */
  action?: ReactNode;
  className?: string;
};

export function NothingFoundCard({ title, text, action, className = '' }: Props) {
  return (
    <div
      className={`rounded-[34px] bg-[#F1EFEF] px-6 py-10 text-center shadow-[0_12px_40px_rgba(17,17,17,0.045)] ${className}`.trim()}
    >
      <img
        src={NOTHING_FOUND_ILLUSTRATION_SRC}
        alt=""
        width={320}
        height={280}
        decoding="async"
        className="mx-auto mb-6 w-full max-w-[17.5rem] select-none object-contain"
      />
      <h2 className="text-[22px] font-semibold tracking-[-0.05em] text-neutral-950">{title}</h2>
      <p className="mx-auto mt-3 max-w-[21rem] text-[15px] leading-relaxed text-neutral-500">{text}</p>
      {action ? <div className="mt-7 flex flex-col items-stretch sm:items-center">{action}</div> : null}
    </div>
  );
}
