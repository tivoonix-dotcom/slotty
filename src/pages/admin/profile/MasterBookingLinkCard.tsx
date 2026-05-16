import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HiArrowTopRightOnSquare,
  HiCheck,
  HiClipboardDocument,
  HiLink,
  HiShare,
} from 'react-icons/hi2';
import type { MasterDraft } from '../../../features/profile/lib/demoMasterStorage';
import { readPublicAppOrigin, resolveMasterBookingLink } from '../../../shared/lib/masterBookingLink';
import { openTelegramOrBrowserUrl, openTelegramShareUrlPicker } from '../../../shared/lib/telegramWebApp';

type Props = {
  draft: MasterDraft;
  cabinetLoading?: boolean;
  useCabinetApi?: boolean;
};

function LinkFieldSkeleton() {
  return (
    <div className="mt-4 space-y-3 animate-pulse">
      <div className="h-12 w-full rounded-2xl bg-[#F7F7F8]" />
      <div className="flex gap-2.5">
        <div className="h-12 min-h-[48px] flex-1 rounded-2xl bg-[#F3F4F6]" />
        <div className="h-12 min-h-[48px] flex-1 rounded-2xl bg-[#F3F4F6]" />
      </div>
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
  const statusLine = copied ? 'Скопировано' : shareHint;

  return (
    <section className="rounded-[22px] bg-white p-[18px] shadow-[0_8px_32px_rgba(17,24,39,0.06)]">
      <div className="flex items-start gap-3.5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]"
          aria-hidden
        >
          <HiLink className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold tracking-[-0.03em] text-[#111827]">Ссылка для записи</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">
            Отправьте клиентам для записи на услуги
          </p>
        </div>
      </div>

      {showSkeleton ? (
        <LinkFieldSkeleton />
      ) : resolved ? (
        <>
          <div className="mt-4 rounded-2xl bg-[#F7F7F8] px-3.5 py-3 ring-1 ring-[#EAECEF]">
            <p className="truncate text-[14px] font-medium text-[#111827]" title={resolved.href}>
              {resolved.href}
            </p>
          </div>

          <div className="mt-3 flex gap-2.5">
            <button
              type="button"
              onClick={onCopy}
              className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition active:scale-[0.98] ${
                copied
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-[#F47C8C] text-white shadow-[0_8px_24px_rgba(244,124,140,0.35)] hover:bg-[#F26D83]'
              }`}
            >
              {copied ? (
                <HiCheck className="h-5 w-5" strokeWidth={2.25} />
              ) : (
                <HiClipboardDocument className="h-5 w-5" strokeWidth={2} />
              )}
              {copied ? 'Скопировано' : 'Копировать'}
            </button>
            <button
              type="button"
              onClick={() => void onShare()}
              className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#F7F7F8] text-[15px] font-semibold text-[#111827] transition hover:bg-[#F3F4F6] active:scale-[0.98]"
            >
              <HiShare className="h-5 w-5" strokeWidth={2} />
              Поделиться
            </button>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="mt-2.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-semibold text-[#6B7280] transition hover:bg-[#F7F7F8] active:scale-[0.98]"
          >
            <HiArrowTopRightOnSquare className="h-4 w-4" strokeWidth={2} />
            Открыть ссылку
          </button>

          {statusLine && statusLine !== 'Скопировано' ? (
            <p className="mt-2 text-center text-[12px] font-medium text-[#6B7280]" role="status">
              {statusLine}
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-4 text-[13px] leading-relaxed text-[#6B7280]">
          Не удалось сформировать ссылку: укажите{' '}
          <code className="rounded-lg bg-[#F7F7F8] px-1.5 py-0.5 text-[12px] text-[#111827]">VITE_TELEGRAM_BOT_USERNAME</code>{' '}
          в окружении или откройте приложение по HTTPS с сохранённым профилем мастера.
        </p>
      )}
    </section>
  );
}
