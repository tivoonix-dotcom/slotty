type Props = {
  text: string;
  className?: string;
};

/** Короткий SEO-вводный абзац для каталога (видимый, не спам). */
export function CatalogSeoIntro({ text, className = '' }: Props) {
  return (
    <p
      className={`mx-auto max-w-3xl text-pretty text-[13px] leading-relaxed text-neutral-600 sm:text-[14px] ${className}`}
    >
      {text}
    </p>
  );
}
