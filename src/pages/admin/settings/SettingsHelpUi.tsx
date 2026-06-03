import type { ReactNode } from 'react';
import { HiArrowLeft, HiArrowRight, HiOutlineDocumentText, HiOutlineEnvelope, HiOutlineShieldCheck } from 'react-icons/hi2';
import type { LegalDocId } from '../../../constants/legalDocuments';
import {
  settingsBackBtn,
  settingsHelpHeroBleed,
  SETTINGS_HELP_HERO_BG,
  settingsLegalArticle,
  settingsRow,
  settingsRowIcon,
} from './adminSettingsTheme';

export function SettingsHelpHero({ children }: { children: ReactNode }) {
  return (
    <section
      className={`relative overflow-hidden ${settingsHelpHeroBleed}`}
      aria-label="Поддержка"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${SETTINGS_HELP_HERO_BG})` }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-black/42" aria-hidden />
      <div className="relative px-4 py-6 sm:px-5 sm:py-7 lg:px-6 lg:py-8">{children}</div>
    </section>
  );
}

export const settingsHelpHeroSectionLabel =
  'text-[11px] font-bold uppercase tracking-[0.1em] text-white/70';

export function SettingsBackButton({ onClick, label = 'Назад' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className={settingsBackBtn}>
      <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

function SettingsIconWrap({ children, tone = 'doc' }: { children: ReactNode; tone?: 'telegram' | 'email' | 'doc' }) {
  const toneClass =
    tone === 'telegram'
      ? 'bg-[#E8F6FD] text-[#0284C7] ring-[#BAE6FD]'
      : tone === 'email'
        ? 'bg-[#FFF1F4] text-[#ff5f7a] ring-[#FDE8ED]'
        : 'bg-white text-[#ff5f7a] ring-[#EAECEF]';

  return (
    <span className={`${settingsRowIcon} ${toneClass}`} aria-hidden>
      {children}
    </span>
  );
}

export function SettingsContactCard({
  icon,
  tone,
  title,
  value,
  href,
  external,
}: {
  icon: ReactNode;
  tone: 'telegram' | 'email';
  title: string;
  value: string;
  href?: string | null;
  external?: boolean;
}) {
  const inner = (
    <>
      <SettingsIconWrap tone={tone}>{icon}</SettingsIconWrap>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-[#111827]">{title}</p>
        <p className="mt-0.5 truncate text-[14px] font-medium text-[#6B7280]">{value}</p>
      </div>
      {href ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[#9CA3AF]">
          <HiArrowRight className="h-4 w-4" aria-hidden />
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={settingsRow}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    );
  }

  return <div className={settingsRow}>{inner}</div>;
}

const DOC_META: Record<LegalDocId, { Icon: typeof HiOutlineDocumentText }> = {
  terms: { Icon: HiOutlineDocumentText },
  privacy: { Icon: HiOutlineShieldCheck },
  personal_data_policy: { Icon: HiOutlineShieldCheck },
  consent: { Icon: HiOutlineDocumentText },
  service_rules: { Icon: HiOutlineDocumentText },
};

export function SettingsDocCard({
  id,
  title,
  updatedLabel,
  onOpen,
}: {
  id: LegalDocId;
  title: string;
  updatedLabel: string;
  onOpen: () => void;
}) {
  const Icon = DOC_META[id].Icon;

  return (
    <button type="button" onClick={onOpen} className={settingsRow}>
      <SettingsIconWrap tone="doc">
        <Icon className="h-5 w-5" aria-hidden />
      </SettingsIconWrap>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[15px] font-bold text-[#111827]">{title}</p>
        <p className="mt-0.5 truncate text-[14px] font-medium text-[#6B7280]">{updatedLabel}</p>
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-[#9CA3AF]">
        <HiArrowRight className="h-4 w-4" aria-hidden />
      </span>
    </button>
  );
}

export function SettingsLegalReader({
  title,
  updatedLabel,
  body,
}: {
  title: string;
  updatedLabel: string;
  body: string;
}) {
  const blocks = body.split(/\n\n+/).filter(Boolean);

  return (
    <article className={settingsLegalArticle}>
      <header className="border-b border-[#EEEEEE] pb-4">
        <h2 className="text-[20px] font-bold tracking-[-0.04em] text-[#111827]">{title}</h2>
        <p className="mt-1.5 text-[13px] font-medium text-[#9CA3AF]">{updatedLabel}</p>
      </header>
      <div className="space-y-4 text-[15px] leading-[1.65] text-[#374151]">
        {blocks.map((block, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {block}
          </p>
        ))}
      </div>
    </article>
  );
}

export function TelegramSupportIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path
        fill="#fff"
        d="M5.43 11.47c3.66-1.6 6.1-2.65 7.32-3.15 3.48-1.45 4.2-1.7 4.67-1.7.1 0 .33.02.48.12.12.1.16.24.14.34-.02.1-.16.48-.32.94-.46 1.5-1.98 5.92-2.75 7.86-.34.74-.99 1.1-1.52 1.12-.52.02-1.35-.3-2.01-.55-.9-.33-1.62-.5-1.55-.95.03-.2.38-.4 1.05-.72Z"
      />
    </svg>
  );
}

export function EmailSupportIcon() {
  return <HiOutlineEnvelope className="h-5 w-5" aria-hidden />;
}
