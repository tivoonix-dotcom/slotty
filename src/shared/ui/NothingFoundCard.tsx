import type { ReactNode } from 'react';
import { MiniPicture } from './MiniPicture';
import { NOTHING_FOUND_ILLUSTRATION_SRC } from './nothingFoundIllustrationSrc';
import type { MiniPictureKey } from './miniPictureSrc';

type Props = {
  title: string;
  text?: string;
  /** Дополнительная строка мелким шрифтом под основным текстом */
  hint?: string;
  /** Кнопка или ссылка под текстом */
  action?: ReactNode;
  className?: string;
  /** Мини-иллюстрация из `public/photos/minipicture`. */
  picture?: MiniPictureKey;
  /** `plain` — без фона, тени и «коробки» (booking, каталог). */
  variant?: 'card' | 'plain';
};

const SHELL_CLASS: Record<NonNullable<Props['variant']>, string> = {
  card: 'rounded-[34px] bg-[#F1EFEF] px-6 py-10 text-center shadow-[0_12px_40px_rgba(17,17,17,0.045)]',
  plain: 'flex flex-col items-center px-2 py-6 text-center sm:py-10',
};

export function NothingFoundCard({
  title,
  text,
  hint,
  action,
  className = '',
  picture,
  variant = 'card',
}: Props) {
  const isPlain = variant === 'plain';
  const illustrationClass = isPlain
    ? 'mx-auto mb-5 w-full max-w-[12.5rem] select-none object-contain sm:max-w-[14rem]'
    : 'mx-auto mb-6 w-full max-w-[17.5rem] select-none object-contain';

  return (
    <div className={`${SHELL_CLASS[variant]} ${className}`.trim()}>
      {picture ? (
        <MiniPicture
          name={picture}
          variant="empty"
          className={isPlain ? 'mb-5 max-w-[12.5rem] sm:max-w-[14rem]' : 'mb-6 max-w-[17.5rem]'}
        />
      ) : (
        <img
          src={NOTHING_FOUND_ILLUSTRATION_SRC}
          alt=""
          width={320}
          height={280}
          decoding="async"
          className={illustrationClass}
        />
      )}
      <h2
        className={
          isPlain
            ? 'text-[20px] font-semibold tracking-[-0.03em] text-[#111827]'
            : 'text-[22px] font-semibold tracking-[-0.05em] text-neutral-950'
        }
      >
        {title}
      </h2>
      {text ? (
        <p
          className={
            isPlain
              ? 'mx-auto mt-2 max-w-[18rem] text-[14px] leading-relaxed text-[#6B7280]'
              : 'mx-auto mt-3 max-w-[21rem] text-[15px] leading-relaxed text-neutral-500'
          }
        >
          {text}
        </p>
      ) : null}
      {hint ? (
        <p
          className={
            isPlain
              ? 'mx-auto mt-1.5 max-w-[18rem] text-[13px] leading-relaxed text-[#9CA3AF]'
              : 'mx-auto mt-2 max-w-[21rem] text-[13px] leading-relaxed text-neutral-400'
          }
        >
          {hint}
        </p>
      ) : null}
      {action ? (
        <div className={`flex flex-col items-stretch sm:items-center ${isPlain ? 'mt-5' : 'mt-7'}`}>
          {action}
        </div>
      ) : null}
    </div>
  );
}
