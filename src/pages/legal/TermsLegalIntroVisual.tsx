import type { FC } from 'react';
import { TERMS_LEGAL_INTRO_BG } from './legalSiteInfo';
import { legalDocFontBody, legalDocFontDisplay } from './legalDocumentUi';

/** Декор с фоновым фото и центрированным белым текстом. */
export const TermsLegalIntroVisual: FC = () => (
  <aside className="relative w-full overflow-hidden rounded-[20px] sm:min-h-[9.5rem] sm:rounded-[24px]">
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${TERMS_LEGAL_INTRO_BG})` }}
      aria-hidden
    />
    <div
      className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-black/15 to-black/30"
      aria-hidden
    />
    <div className="relative z-10 flex min-h-[8.5rem] flex-col items-center justify-center px-6 py-8 text-center sm:min-h-[9.5rem] sm:py-10">
      <p
        className={`${legalDocFontDisplay} text-[17px] font-medium text-white sm:text-[20px] lg:text-[22px]`}
      >
        Правила пользования SLOTTY
      </p>
      <p
        className={`${legalDocFontBody} mt-2 max-w-[28rem] text-[14px] leading-relaxed text-white/90 sm:text-[15px]`}
      >
        Для клиентов и мастеров beauty-сферы
      </p>
    </div>
  </aside>
);
