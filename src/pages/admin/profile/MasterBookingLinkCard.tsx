import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { readPublicAppOrigin, resolveMasterBookingLink } from '../../../shared/lib/masterBookingLink';
import { openTelegramOrBrowserUrl, openTelegramShareUrlPicker } from '../../../shared/lib/telegramWebApp';

type Props = {
  draft: MasterDraft;
  cabinetLoading?: boolean;
  useCabinetApi?: boolean;
};

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function SvgIcon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      shapeRendering="geometricPrecision"
      className="block shrink-0"
    >
      {children}
    </svg>
  );
}

function IconLink({ size = 16 }: { size?: number }) {
  return (
    <SvgIcon size={size}>
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L11 4.93" {...stroke} />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L13 19.07" {...stroke} />
    </SvgIcon>
  );
}

function IconCopy() {
  return (
    <SvgIcon>
      <rect x="9" y="9" width="11" height="11" rx="2" {...stroke} />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" {...stroke} />
    </SvgIcon>
  );
}

function IconCheck() {
  return (
    <SvgIcon>
      <path d="M5 12.5 9.5 16.5 19 7" {...stroke} />
    </SvgIcon>
  );
}

function IconShare() {
  return (
    <SvgIcon>
      <path d="M8.5 10.5 15.5 6.5M15.5 17.5 8.5 13.5" {...stroke} />
      <circle cx="6" cy="12" r="2.25" {...stroke} />
      <circle cx="18" cy="7" r="2.25" {...stroke} />
      <circle cx="18" cy="17" r="2.25" {...stroke} />
    </SvgIcon>
  );
}

function IconExternal() {
  return (
    <SvgIcon>
      <path d="M14 5h5v5M10 14 19 9M5 19h5a2 2 0 0 0 2-2V9" {...stroke} />
    </SvgIcon>
  );
}

const iconBtn =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition active:opacity-85 disabled:opacity-40';

function LinkFieldSkeleton() {
  return (
    <div className="mt-2 flex animate-pulse items-center gap-1.5">
      <div className="h-9 min-w-0 flex-1 rounded-xl bg-[#F7F7F8]" />
      <div className="h-9 w-9 rounded-[10px] bg-[#F3F4F6]" />
      <div className="h-9 w-9 rounded-[10px] bg-[#F3F4F6]" />
      <div className="h-9 w-9 rounded-[10px] bg-[#F3F4F6]" />
    </div>
  );
}

export function MasterBookingLinkCard({ draft, cabinetLoading, useCabinetApi }: Props) {
  const [copied, setCopied] = useState(false);
  const [shareHint, setShareHint] = useState<string | null>(null);

  const resolved = useMemo(
    () => resolveMasterBookingLink(draft.profileSlug, draft.masterId, readPublicAppOrigin()),
    [draft.profileSlug, draft.masterId],
  );

  useEffect(() => {
    if (!shareHint) return undefined;
    const t = window.setTimeout(() => setShareHint(null), 2000);
    return () => window.clearTimeout(t);
  }, [shareHint]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyHref = useCallback(async (href: string) => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      return;
    } catch {
      /* fall through */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = href;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
    } catch {
      setShareHint('Не удалось скопировать');
    }
  }, []);

  const onCopy = useCallback(() => {
    if (!resolved) return;
    void copyHref(resolved.href);
  }, [resolved, copyHref]);

  const onShare = useCallback(async () => {
    if (!resolved) return;
    const { href } = resolved;
    const title = 'SLOTTY — запись к мастеру';
    if (openTelegramShareUrlPicker(href, title)) return;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text: title, url: href });
        return;
      } catch {
        /* отмена или ошибка */
      }
    }
    await copyHref(href);
    setShareHint('Ссылка скопирована');
  }, [resolved, copyHref]);

  const onOpen = useCallback(() => {
    if (!resolved) return;
    openTelegramOrBrowserUrl(resolved.href);
  }, [resolved]);

  const showSkeleton = Boolean(useCabinetApi && cabinetLoading);

  return (
    <section className="rounded-[18px] bg-white px-3 py-2.5 shadow-[0_4px_20px_rgba(17,24,39,0.05)]">
      <div className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]"
          aria-hidden
        >
          <IconLink size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold leading-tight tracking-[-0.02em] text-[#111827]">
            Ссылка для записи
          </h2>
          <p className="mt-px text-[11px] leading-snug text-[#6B7280] line-clamp-1">
            Отправьте клиентам для записи на услуги
          </p>
        </div>
      </div>

      {showSkeleton ? (
        <LinkFieldSkeleton />
      ) : resolved ? (
        <>
          <div className="mt-2 flex items-center gap-1.5">
            <div
              className="flex h-9 min-w-0 flex-1 items-center rounded-xl bg-[#F7F7F8] px-2.5 ring-1 ring-[#EAECEF]"
              title={resolved.href}
            >
              <p className="truncate text-[12px] font-medium leading-none text-[#111827]">{resolved.href}</p>
            </div>
            <button
              type="button"
              onClick={onCopy}
              aria-label={copied ? 'Скопировано' : 'Копировать ссылку'}
              className={`${iconBtn} ${
                copied
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-[#F47C8C] text-white shadow-[0_4px_12px_rgba(244,124,140,0.28)] hover:bg-[#F26D83]'
              }`}
            >
              {copied ? <IconCheck /> : <IconCopy />}
            </button>
            <button
              type="button"
              onClick={() => void onShare()}
              aria-label="Поделиться ссылкой"
              className={`${iconBtn} bg-[#F7F7F8] text-[#111827] hover:bg-[#F3F4F6]`}
            >
              <IconShare />
            </button>
            <button
              type="button"
              onClick={onOpen}
              aria-label="Открыть ссылку"
              className={`${iconBtn} bg-[#F7F7F8] text-[#6B7280] hover:bg-[#F3F4F6]`}
            >
              <IconExternal />
            </button>
          </div>

          {shareHint ? (
            <p className="mt-1 text-center text-[10px] font-medium text-[#6B7280]" role="status">
              {shareHint}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-2 text-[11px] leading-snug text-[#6B7280]">
          Не удалось сформировать ссылку: укажите{' '}
          <code className="rounded bg-[#F7F7F8] px-1 py-px text-[10px] text-[#111827]">VITE_TELEGRAM_BOT_USERNAME</code>{' '}
          в окружении или откройте приложение по HTTPS с сохранённым профилем мастера.
        </p>
      )}
    </section>
  );
}
