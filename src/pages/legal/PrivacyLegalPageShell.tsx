import type { FC, ReactNode } from 'react';
import { HiArrowLeft } from 'react-icons/hi2';
import { SlottyHeader } from '../../shared/layout/SlottyHeader/SlottyHeader';
import { CLIENT_DESKTOP_SHELL_CLASS } from '../../shared/layout/clientShellLayout';
import { HomeFooter } from '../HomeFooter';
import { LEGAL_LANDING_HEADER_OFFSET } from './LegalPageShell';
import { PRIVACY_LEGAL_HERO_BG } from './legalSiteInfo';
import {
  LegalDocDarkTocNav,
  legalDocFontBody,
  legalDocFontDisplay,
  shouldShowLegalDocToc,
  type LegalTocItem,
} from './legalDocumentUi';
import { useLegalPageBack } from './useLegalPageBack';
import { useLegalPageScroll } from './useLegalPageScroll';
import { useLegalTocActiveId } from './useLegalTocActiveId';

type Props = {
  title: string;
  titleHighlight?: string;
  children: ReactNode;
  toc?: LegalTocItem[];
  meta?: ReactNode;
};

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

function PrivacyHeroTitle({ title, titleHighlight }: { title: string; titleHighlight?: string }) {
  const highlight = titleHighlight?.trim();

  if (highlight && title.includes(highlight)) {
    const idx = title.indexOf(highlight);
    const before = title.slice(0, idx);
    const after = title.slice(idx + highlight.length);
    return (
      <h1
        className={`max-w-4xl ${legalDocFontDisplay} text-[28px] font-medium leading-[1.15] tracking-[-0.03em] text-white sm:text-[36px] lg:text-[40px]`}
      >
        {before}
        <span className="relative inline-block pb-1 align-baseline">
          <span className="relative z-10 font-bold text-white">{highlight}</span>
          <PinkArcUnderline />
        </span>
        {after}
      </h1>
    );
  }

  return (
    <h1
      className={`max-w-4xl ${legalDocFontDisplay} text-[28px] font-medium leading-[1.12] tracking-[-0.03em] text-white sm:text-[36px] lg:text-[40px]`}
    >
      {title}
    </h1>
  );
}

export const PrivacyLegalPageShell: FC<Props> = ({
  title,
  titleHighlight,
  children,
  toc = [],
  meta,
}) => {
  const { goBack, backLabel } = useLegalPageBack();
  useLegalPageScroll();
  const showToc = shouldShowLegalDocToc(toc.length);
  const activeSectionId = useLegalTocActiveId(showToc ? toc.map((t) => t.id) : []);

  return (
    <div className={`min-h-dvh bg-[#0a0a0a] text-white ${legalDocFontBody}`}>
      <SlottyHeader variant="landing" landingTone="dark" />

      <section className="relative min-h-[min(440px,58vh)] overflow-hidden bg-[#0a0a0a] sm:min-h-[min(480px,62vh)] lg:min-h-[min(520px,65vh)] lg:mt-0">
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${PRIVACY_LEGAL_HERO_BG})` }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-[#0a0a0a]/95 from-35% via-[#0a0a0a]/72 via-55% to-[#0a0a0a]/20"
          aria-hidden
        />
        <div
          className={`relative z-[2] ${CLIENT_DESKTOP_SHELL_CLASS} max-lg:px-4 ${LEGAL_LANDING_HEADER_OFFSET} pb-10 sm:pb-12 lg:pb-14`}
        >
          <button
            type="button"
            onClick={goBack}
            className={`inline-flex min-h-10 items-center gap-1.5 ${legalDocFontBody} text-[14px] font-semibold text-white/65 transition hover:text-white`}
          >
            <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {backLabel}
          </button>

          <div className="relative mt-8 max-w-3xl sm:mt-10 lg:mt-12">
            <p className={`${legalDocFontBody} text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff8fa3]`}>
              Конфиденциальность SLOTTY
            </p>
            <div className="mt-3">
              <PrivacyHeroTitle title={title} titleHighlight={titleHighlight} />
            </div>
            {meta ? (
              <div
                className={`mt-4 max-w-2xl ${legalDocFontBody} text-[16px] font-normal leading-relaxed text-white/50`}
              >
                {meta}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className={`${CLIENT_DESKTOP_SHELL_CLASS} max-lg:px-4 pb-12`}>
        <div
          className={
            showToc ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-16 xl:gap-20' : ''
          }
        >
          <article className="min-w-0 w-full">
            {showToc ? (
              <LegalDocDarkTocNav
                items={toc}
                activeId={activeSectionId}
                className="mb-8 border-b border-white/10 pb-6 lg:hidden"
              />
            ) : null}

            <div className="space-y-8">{children}</div>
          </article>

          {showToc ? (
            <aside className="hidden lg:block">
              <LegalDocDarkTocNav
                items={toc}
                activeId={activeSectionId}
                className="sticky top-[calc(var(--slotty-header-height,4.25rem)+1.5rem)]"
              />
            </aside>
          ) : null}
        </div>
      </div>

      <HomeFooter tone="dark" />
    </div>
  );
};
