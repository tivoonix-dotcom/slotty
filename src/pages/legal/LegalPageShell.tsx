import type { FC, ReactNode } from 'react';
import { HiArrowLeft } from 'react-icons/hi2';
import { SlottyHeader } from '../../shared/layout/SlottyHeader/SlottyHeader';
import { CLIENT_DESKTOP_SHELL_CLASS } from '../../shared/layout/clientShellLayout';
import { HomeFooter } from '../HomeFooter';
import {
  LegalDocTocNav,
  legalDocFontBody,
  legalDocFontDisplay,
  legalDocLandingArticleClass,
  shouldShowLegalDocToc,
  type LegalTocItem,
} from './legalDocumentUi';
import { useLegalPageBack } from './useLegalPageBack';
import { useLegalPageScroll } from './useLegalPageScroll';
import { useLegalTocActiveId } from './useLegalTocActiveId';

/** Отступ контента под fixed pill-хедером лендинга (74px + safe-area + зазор). */
export const LEGAL_LANDING_HEADER_OFFSET =
  'pt-[calc(5.5rem+env(safe-area-inset-top,0px)+1.25rem)] sm:pt-[calc(5.5rem+env(safe-area-inset-top,0px)+1.5rem)]';

const legalPageBackBtnClass = `inline-flex min-h-10 items-center gap-1.5 ${legalDocFontBody} text-[14px] font-semibold text-[#6B7280] transition hover:text-[#111827]`;

function LegalPageBackButton({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className={legalPageBackBtnClass}>
      <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

type Props = {
  title: string;
  /** Подстрока заголовка с розовым дуговым подчёркиванием. */
  titleHighlight?: string;
  /** Фон hero — заголовок и heroLead в этом блоке. */
  heroBg?: string;
  /** `cover` — на весь блок; `contain` — целиком без обрезки (по умолчанию). */
  heroBgFit?: 'contain' | 'cover';
  /** Вводный текст под заголовком в hero. */
  heroLead?: ReactNode;
  /** Декор над заголовком (без hero-фона), по центру. */
  headerCenter?: ReactNode;
  children: ReactNode;
  toc?: LegalTocItem[];
  meta?: ReactNode;
};

function LegalPageHero({
  backLabel,
  onBack,
  title,
  titleHighlight,
  heroBg,
  heroBgFit = 'contain',
  heroLead,
  meta,
}: {
  backLabel: string;
  onBack: () => void;
  title: string;
  titleHighlight?: string;
  heroBg: string;
  heroBgFit?: 'contain' | 'cover';
  heroLead?: ReactNode;
  meta?: ReactNode;
}) {
  const isCover = heroBgFit === 'cover';

  return (
    <section
      className={`relative w-full min-h-[min(400px,52vh)] overflow-hidden sm:min-h-[min(440px,56vh)] lg:min-h-[min(480px,58vh)] ${
        isCover ? 'bg-[#f0eeec]' : 'bg-white'
      }`}
    >
      <div
        className={
          isCover
            ? 'pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat'
            : 'pointer-events-none absolute inset-0 z-0 bg-contain bg-bottom bg-no-repeat lg:bg-right-bottom'
        }
        style={{ backgroundImage: `url(${heroBg})` }}
        aria-hidden
      />
      <div
        className={
          isCover
            ? 'pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white/95 from-40% via-white/75 via-55% to-white/15'
            : 'pointer-events-none absolute inset-y-0 left-0 z-[1] w-full max-w-[min(100%,52rem)] bg-gradient-to-r from-white from-50% via-white/95 via-72% to-transparent lg:max-w-[60%]'
        }
        aria-hidden
      />
      <div
        className={`relative z-[2] ${CLIENT_DESKTOP_SHELL_CLASS} max-lg:px-4 ${LEGAL_LANDING_HEADER_OFFSET} pb-10 sm:pb-12 lg:pb-14`}
      >
        <LegalPageBackButton label={backLabel} onBack={onBack} />
        <div className="relative mt-6 min-w-0 w-full sm:mt-8 lg:mt-10">
          <LegalPageTitle title={title} titleHighlight={titleHighlight} />
          {heroLead ? (
            <div
              className={`mt-4 ${legalDocFontBody} text-[17px] font-normal leading-[1.65] text-[#6B7280] sm:text-[18px]`}
            >
              {heroLead}
            </div>
          ) : null}
          {meta ? (
            <div className={`mt-3 ${legalDocFontBody} text-[16px] font-normal leading-relaxed text-[#9CA3AF]`}>
              {meta}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PinkArcUnderline() {
  return (
    <svg
      className="pointer-events-none absolute -bottom-1 left-0 h-[0.55em] w-full min-w-full text-[#ff5f7a]"
      viewBox="0 0 120 14"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M2 11C30 4 90 4 118 11"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LegalPageTitle({
  title,
  titleHighlight,
  className,
}: {
  title: string;
  titleHighlight?: string;
  className?: string;
}) {
  const highlight = titleHighlight?.trim();
  const baseClass = `${legalDocFontDisplay} text-[32px] font-medium leading-[1.2] tracking-[-0.02em] text-[#111827] sm:text-[36px]`;

  if (highlight && title.includes(highlight)) {
    const idx = title.indexOf(highlight);
    const before = title.slice(0, idx);
    const after = title.slice(idx + highlight.length);
    return (
      <h1 className={[baseClass, className].filter(Boolean).join(' ')}>
        {before}
        <span className="relative inline-block pb-1 align-baseline">
          <span className="relative z-10 font-bold text-[#111827]">{highlight}</span>
          <PinkArcUnderline />
        </span>
        {after}
      </h1>
    );
  }

  return (
    <h1 className={[baseClass.replace('leading-[1.2]', 'leading-[1.15]'), className].filter(Boolean).join(' ')}>
      {title}
    </h1>
  );
}

export const LegalPageShell: FC<Props> = ({
  title,
  titleHighlight,
  heroBg,
  heroBgFit = 'contain',
  heroLead,
  headerCenter,
  children,
  toc = [],
  meta,
}) => {
  const { goBack, backLabel } = useLegalPageBack();
  useLegalPageScroll();
  const showToc = shouldShowLegalDocToc(toc.length);
  const activeSectionId = useLegalTocActiveId(showToc ? toc.map((t) => t.id) : []);
  const hasHero = Boolean(heroBg?.trim());

  return (
    <div className={`min-h-dvh bg-white text-[#111827] ${legalDocFontBody}`}>
      <SlottyHeader variant="landing" />

      {hasHero ? (
        <LegalPageHero
          backLabel={backLabel}
          onBack={goBack}
          title={title}
          titleHighlight={titleHighlight}
          heroBg={heroBg!}
          heroBgFit={heroBgFit}
          heroLead={heroLead}
          meta={meta}
        />
      ) : null}

      <div
        className={`${CLIENT_DESKTOP_SHELL_CLASS} max-lg:px-4 ${hasHero ? 'pb-12 lg:pt-6' : `${LEGAL_LANDING_HEADER_OFFSET} pb-12`}`}
      >
        <div
          className={
            showToc
              ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16 xl:gap-20'
              : ''
          }
        >
          <article className={legalDocLandingArticleClass}>
            {!hasHero ? (
              <>
                <LegalPageBackButton label={backLabel} onBack={goBack} />
                {headerCenter ? <div className="mt-5 flex justify-center sm:mt-6">{headerCenter}</div> : null}
                <LegalPageTitle
                  title={title}
                  titleHighlight={titleHighlight}
                  className={headerCenter ? 'mt-4 sm:mt-5' : 'mt-5 sm:mt-6'}
                />
                {meta ? (
                  <div
                    className={`mt-2 ${legalDocFontBody} text-[16px] font-normal leading-relaxed text-[#9CA3AF]`}
                  >
                    {meta}
                  </div>
                ) : null}
              </>
            ) : null}

            {showToc ? (
              <LegalDocTocNav
                items={toc}
                activeId={activeSectionId}
                className="mt-8 border-b border-[#F0F1F5] pb-6 lg:hidden"
              />
            ) : null}

            <div className="mt-8 space-y-8">{children}</div>
          </article>

          {showToc ? (
            <aside className="hidden lg:block">
              <LegalDocTocNav
                items={toc}
                activeId={activeSectionId}
                className="sticky top-[calc(var(--slotty-header-height,4.25rem)+1.5rem)]"
              />
            </aside>
          ) : null}
        </div>
      </div>

      <HomeFooter />
    </div>
  );
};
