import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

const STORAGE_KEY = 'slotty_login_account_hint_dismissed';

const HINT_TEXT =
  'Становились мастером в Telegram? Сначала войдите через Telegram, затем в кабинете откройте «Способы входа» и привяжите Google и email — иначе вход с сайта создаст отдельный профиль клиента.';

function readDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Один раз при входе: модалка про привязку аккаунта после Telegram. После «Понятно» больше не показывается. */
export function LoginAccountHint() {
  const [open, setOpen] = useState(() => !readDismissed());

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-account-hint-title"
    >
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        <div className="px-5 pb-2 pt-6 sm:px-6">
          <h2 id="login-account-hint-title" className="text-[18px] font-bold leading-snug text-[#111827]">
            Уже были мастером в Telegram?
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-[#6B7280]">{HINT_TEXT}</p>
        </div>

        <div className="px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={dismiss}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#111827] text-[15px] font-semibold text-white transition hover:opacity-95 active:scale-[0.98]"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
