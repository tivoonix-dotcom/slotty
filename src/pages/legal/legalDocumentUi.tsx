import type { ReactNode } from 'react';
import { homeLandingMastersRowStep } from '../home/homeTheme';
import { scrollToLegalSection } from './useLegalTocActiveId';

export type LegalTocItem = { id: string; label: string };

/** Боковое «Содержание» — только у длинных документов. */
export const LEGAL_DOC_TOC_MIN_SECTIONS = 8;

export function shouldShowLegalDocToc(sectionCount: number): boolean {
  return sectionCount > LEGAL_DOC_TOC_MIN_SECTIONS;
}

/** Шрифты лендинга: Montserrat Alternates — заголовки, Montserrat — текст. */
export const legalDocFontBody = 'font-landing';
export const legalDocFontDisplay = 'font-hero-display';

/** Крупная читаемая типографика (Help Center). */
export const legalDocProseClass =
  `${legalDocFontBody} text-[17px] font-normal leading-[1.65] text-[#374151] antialiased sm:text-[18px] sm:leading-[1.7]`;

export const legalDocSectionTitleClass =
  `${legalDocFontDisplay} text-[18px] font-medium leading-[1.35] text-[#111827] sm:text-[20px]`;

export const legalDocLinkClass =
  'font-medium text-[#111827] underline decoration-[#111827]/25 underline-offset-[3px] transition hover:decoration-[#111827]';

export const legalDocListClass = 'list-disc space-y-2.5 pl-5 marker:text-[#D1D5DB]';

/** Центрированная колонка legal-страниц — на всю ширину shell, без узкой полосы слева. */
export const legalDocLandingArticleClass =
  'mx-auto w-full min-w-0 max-w-[48rem] lg:max-w-[56rem] xl:max-w-[68rem]';

export const legalDocLandingSectionTitleClass =
  `${legalDocFontDisplay} mt-2 text-balance text-[clamp(1.35rem,3vw,2rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[#111827] sm:mt-3 sm:text-[32px] lg:mt-4`;

export const legalDocLandingProseClass =
  `${legalDocFontBody} w-full max-w-none text-[16px] font-normal leading-[1.55] text-[#4B5563] sm:text-[17px] lg:text-[18px]`;

export const legalDocLandingIntroClass =
  `${legalDocFontBody} w-full max-w-none text-[17px] font-normal leading-[1.65] text-[#6B7280] sm:text-[18px] sm:leading-[1.7]`;

export function LegalDocIntro({ children }: { children: ReactNode }) {
  return <p className={`${legalDocProseClass} text-[#6B7280]`}>{children}</p>;
}

/** Вводный абзац — крупный текст как на лендинге. */
export function LegalDocLandingIntro({ children }: { children: ReactNode }) {
  return <p className={legalDocLandingIntroClass}>{children}</p>;
}

/** Секция документа — розовый номер, крупный заголовок и текст как в блоке «Для мастеров». */
export function LegalDocLandingSection({
  id,
  step,
  title,
  children,
  wideChildren,
  miniVisual,
}: {
  id: string;
  step: number;
  title: string;
  children: ReactNode;
  /** На всю ширину колонки — карточки, ленты и т.п. */
  wideChildren?: ReactNode;
  /** Компактная мини-анимация перед текстом секции. */
  miniVisual?: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[calc(6.5rem+env(safe-area-inset-top,0px)+0.75rem)] lg:scroll-mt-[calc(var(--slotty-header-height,4.25rem)+1rem)]"
    >
      <p className={homeLandingMastersRowStep} aria-hidden>
        {step}.
      </p>
      <h2 className={legalDocLandingSectionTitleClass}>{title}</h2>
      {miniVisual ? <div className="mt-3">{miniVisual}</div> : null}
      <div className={`${legalDocLandingProseClass} space-y-3 ${miniVisual ? 'mt-3' : ''}`}>{children}</div>
      {wideChildren ? <div className="mt-5 w-full min-w-0 max-w-none">{wideChildren}</div> : null}
    </section>
  );
}

export function LegalDocSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[calc(6.5rem+env(safe-area-inset-top,0px)+0.75rem)] lg:scroll-mt-[calc(var(--slotty-header-height,4.25rem)+1rem)]"
    >
      <h2 className={legalDocSectionTitleClass}>{title}</h2>
      <div className={`mt-3 space-y-3 ${legalDocProseClass}`}>{children}</div>
    </section>
  );
}

export function LegalDocSubsection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="pt-2">
      <h3
        className={`${legalDocFontBody} text-[17px] font-semibold leading-snug text-[#111827] sm:text-[18px]`}
      >
        {title}
      </h3>
      <div className={`mt-2 space-y-3 ${legalDocProseClass}`}>{children}</div>
    </div>
  );
}

export function LegalDocTocNav({
  items,
  className = '',
  activeId = '',
}: {
  items: LegalTocItem[];
  className?: string;
  activeId?: string;
}) {
  if (!items.length) return null;

  return (
    <nav className={className} aria-label="Содержание документа">
      <p
        className={`${legalDocFontBody} text-[13px] font-medium uppercase tracking-[0.06em] text-[#9CA3AF]`}
      >
        Содержание
      </p>
      <ul className="mt-2 space-y-0.5">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToLegalSection(item.id);
                }}
                className={`block rounded-[6px] py-2 pl-3 text-[15px] leading-[1.5] transition sm:text-[16px] ${
                  active
                    ? 'border-l-2 border-[#111827] bg-[#FAFAFA] font-semibold text-[#111827]'
                    : 'border-l-2 border-transparent font-normal text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#111827]'
                }`}
                aria-current={active ? 'location' : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Тёмная тема — страница политики конфиденциальности. */
export const legalDocDarkProseClass =
  `${legalDocFontBody} text-[17px] font-normal leading-[1.65] text-white/75 antialiased sm:text-[18px] sm:leading-[1.7] [&_strong]:font-semibold [&_strong]:text-white`;

export const legalDocDarkSectionTitleClass =
  `${legalDocFontDisplay} text-[18px] font-medium leading-[1.35] text-white sm:text-[20px]`;

export const legalDocDarkLinkClass =
  'font-medium text-[#ff8fa3] underline decoration-[#ff8fa3]/35 underline-offset-[3px] transition hover:text-[#ffb3c0] hover:decoration-[#ffb3c0]';

export const legalDocDarkListClass = 'list-disc space-y-2.5 pl-5 marker:text-white/25';

export function LegalDocDarkIntro({ children }: { children: ReactNode }) {
  return <p className={`${legalDocDarkProseClass} text-white/55`}>{children}</p>;
}

export function LegalDocDarkSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-[calc(6.5rem+env(safe-area-inset-top,0px)+0.75rem)] lg:scroll-mt-[calc(var(--slotty-header-height,4.25rem)+1rem)]"
    >
      <h2 className={legalDocDarkSectionTitleClass}>{title}</h2>
      <div className={`mt-3 space-y-3 ${legalDocDarkProseClass}`}>{children}</div>
    </section>
  );
}

export function LegalDocDarkTocNav({
  items,
  className = '',
  activeId = '',
}: {
  items: LegalTocItem[];
  className?: string;
  activeId?: string;
}) {
  if (!items.length) return null;

  return (
    <nav className={className} aria-label="Содержание документа">
      <p
        className={`${legalDocFontBody} text-[13px] font-medium uppercase tracking-[0.06em] text-white/40`}
      >
        Содержание
      </p>
      <ul className="mt-2 space-y-0.5">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToLegalSection(item.id);
                }}
                className={`block rounded-[6px] py-2 pl-3 text-[15px] leading-[1.5] transition sm:text-[16px] ${
                  active
                    ? 'border-l-2 border-[#ff5f7a] bg-white/[0.06] font-semibold text-white'
                    : 'border-l-2 border-transparent font-normal text-white/50 hover:bg-white/[0.04] hover:text-white/90'
                }`}
                aria-current={active ? 'location' : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
