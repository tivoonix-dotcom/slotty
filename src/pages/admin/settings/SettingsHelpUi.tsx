import type { ReactNode } from 'react';
import { HiArrowLeft, HiArrowRight, HiOutlineDocumentText, HiOutlineEnvelope, HiOutlineShieldCheck } from 'react-icons/hi2';
import type { LegalDocId } from '../../../constants/legalDocuments';

export function SettingsSectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#111827] lg:text-[20px]">{title}</h2>
      {description ? (
        <p className="mt-1.5 text-[14px] leading-relaxed text-[#6B7280]">{description}</p>
      ) : null}
    </div>
  );
}

export function SettingsHelpIntro() {
  return (
    <div className="rounded-[20px] bg-gradient-to-br from-[#FFF0F3] via-white to-white p-5 ring-1 ring-[#FDE8ED]">
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#ff5f7a]">Справка</p>
      <p className="mt-2 text-[15px] leading-relaxed text-[#374151]">
        Напишите в поддержку по вопросам кабинета и записей — ниже юридические документы SLOTTY.
      </p>
    </div>
  );
}

export function SettingsBackButton({ onClick, label = 'Назад' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#f6f7fb] px-4 text-[14px] font-semibold text-[#374151] ring-1 ring-[#EAECEF] transition hover:bg-white hover:text-[#ff5f7a] hover:ring-[#FDE8ED] active:scale-[0.98]"
    >
      <HiArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}

function SettingsIconWrap({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'telegram' | 'email' | 'doc' }) {
  const bg =
    tone === 'telegram'
      ? 'bg-[#E8F6FD] ring-[#BAE6FD]'
      : tone === 'email'
        ? 'bg-[#FFF0F3] ring-[#FDE8ED]'
        : tone === 'doc'
          ? 'bg-[#f6f7fb] ring-[#EAECEF]'
          : 'bg-[#f6f7fb] ring-[#EAECEF]';
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ring-1 ${bg}`}
      aria-hidden
    >
      {children}
    </span>
  );
}

export function SettingsContactCard({
  icon,
  tone,
  title,
  value,
  hint,
  href,
  external,
}: {
  icon: ReactNode;
  tone: 'telegram' | 'email';
  title: string;
  value: string;
  hint?: string;
  href?: string | null;
  external?: boolean;
}) {
  const inner = (
    <>
      <SettingsIconWrap tone={tone}>{icon}</SettingsIconWrap>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#9CA3AF]">{title}</p>
        <p className="mt-1 truncate text-[16px] font-semibold text-[#111827]">{value}</p>
        {hint ? <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">{hint}</p> : null}
      </div>
      {href ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f7fb] text-[#9CA3AF] ring-1 ring-[#EAECEF]">
          <HiArrowRight className="h-4 w-4" aria-hidden />
        </span>
      ) : null}
    </>
  );

  const cardClass =
    'flex w-full items-center gap-3 rounded-[20px] bg-white p-4 text-left shadow-[0_6px_22px_rgba(17,24,39,0.05)] ring-1 ring-[#EAECEF] transition hover:ring-[#FDE8ED] active:scale-[0.99]';

  if (href) {
    return (
      <a
        href={href}
        className={cardClass}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {inner}
      </a>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}

const DOC_META: Record<LegalDocId, { hint: string; Icon: typeof HiOutlineDocumentText }> = {
  terms: { hint: 'Правила пользования сервисом', Icon: HiOutlineDocumentText },
  privacy: { hint: 'Сбор и использование данных', Icon: HiOutlineShieldCheck },
  personal_data_policy: { hint: 'Обработка персональных данных', Icon: HiOutlineShieldCheck },
  consent: { hint: 'Согласие на обработку данных', Icon: HiOutlineDocumentText },
  service_rules: { hint: 'Правила для мастеров и клиентов', Icon: HiOutlineDocumentText },
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
  const meta = DOC_META[id];
  const Icon = meta.Icon;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-[20px] bg-white p-4 text-left shadow-[0_6px_22px_rgba(17,24,39,0.05)] ring-1 ring-[#EAECEF] transition hover:bg-[#FFF9FB] hover:ring-[#FDE8ED] active:scale-[0.99]"
    >
      <SettingsIconWrap tone="doc">
        <Icon className="h-5 w-5 text-[#ff5f7a]" aria-hidden />
      </SettingsIconWrap>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold leading-snug text-[#111827]">{title}</p>
        <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">{meta.hint}</p>
        <p className="mt-1.5 text-[11px] font-semibold text-[#9CA3AF]">{updatedLabel}</p>
      </div>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f6f7fb] text-[#9CA3AF] ring-1 ring-[#EAECEF]">
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
    <article className="rounded-[20px] bg-white p-5 shadow-[0_6px_22px_rgba(17,24,39,0.05)] ring-1 ring-[#EAECEF] sm:p-6">
      <header className="border-b border-[#F3F4F6] pb-4">
        <h2 className="text-[20px] font-bold tracking-[-0.04em] text-[#111827] sm:text-[22px]">{title}</h2>
        <p className="mt-2 text-[13px] font-semibold text-[#9CA3AF]">{updatedLabel}</p>
      </header>
      <div className="mt-5 space-y-4 text-[15px] leading-[1.65] text-[#374151]">
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
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#2AABEE" />
      <path
        fill="#fff"
        d="M5.43 11.47c3.66-1.6 6.1-2.65 7.32-3.15 3.48-1.45 4.2-1.7 4.67-1.7.1 0 .33.02.48.12.12.1.16.24.14.34-.02.1-.16.48-.32.94-.46 1.5-1.98 5.92-2.75 7.86-.34.74-.99 1.1-1.52 1.12-.52.02-1.35-.3-2.01-.55-.9-.33-1.62-.5-1.55-.95.03-.2.38-.4 1.05-.72Z"
      />
    </svg>
  );
}

export function EmailSupportIcon() {
  return <HiOutlineEnvelope className="h-5 w-5 text-[#ff5f7a]" aria-hidden />;
}
