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

const iconSm = 'h-3.5 w-3.5 shrink-0';
const iconXs = 'h-3 w-3 shrink-0';

function LinkFieldSkeleton() {
  return (
    <div className="mt-2.5 space-y-2 animate-pulse">
      <div className="h-8 w-full rounded-xl bg-[#F7F7F8]" />
      <div className="flex gap-2">
        <div className="h-8 flex-1 rounded-xl bg-[#F3F4F6]" />
        <div className="h-8 flex-1 rounded-xl bg-[#F3F4F6]" />
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
    <section className="rounded-[18px] bg-white px-3 py-2.5 shadow-[0_4px_20px_rgba(17,24,39,0.05)]">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF1F4] text-[#F47C8C]"
          aria-hidden
        >
          <HiLink className={iconXs} strokeWidth={2.25} />
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
          <div className="mt-2 rounded-xl bg-[#F7F7F8] px-2.5 py-1.5 ring-1 ring-[#EAECEF]">
            <p className="truncate text-[12px] font-medium leading-tight text-[#111827]" title={resolved.href}>
              {resolved.href}
            </p>
          </div>

          <div className="mt-2 flex gap-1.5">
            <button
              type="button"
              onClick={onCopy}
              className={`flex h-8 min-h-0 flex-1 items-center justify-center gap-1 rounded-xl px-2 text-[12px] font-semibold transition active:scale-[0.98] ${
                copied
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-[#F47C8C] text-white shadow-[0_4px_14px_rgba(244,124,140,0.28)] hover:bg-[#F26D83]'
              }`}
            >
              {copied ? (
                <HiCheck className={iconSm} strokeWidth={2.5} />
              ) : (
                <HiClipboardDocument className={iconSm} strokeWidth={2} />
              )}
              <span className="truncate">{copied ? 'Скопировано' : 'Копировать'}</span>
            </button>
            <button
              type="button"
              onClick={() => void onShare()}
              className="flex h-8 min-h-0 flex-1 items-center justify-center gap-1 rounded-xl bg-[#F7F7F8] px-2 text-[12px] font-semibold text-[#111827] transition hover:bg-[#F3F4F6] active:scale-[0.98]"
            >
              <HiShare className={iconSm} strokeWidth={2} />
              <span className="truncate">Поделиться</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="mt-1.5 flex h-7 w-full items-center justify-center gap-1 rounded-lg text-[11px] font-medium text-[#6B7280] transition hover:bg-[#F7F7F8] active:scale-[0.98]"
          >
            <HiArrowTopRightOnSquare className={iconXs} strokeWidth={2} />
            Открыть ссылку
          </button>

          {statusLine && statusLine !== 'Скопировано' ? (
            <p className="mt-1 text-center text-[10px] font-medium text-[#6B7280]" role="status">
              {statusLine}
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
