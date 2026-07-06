import { useEffect, useState } from 'react';
import { completeTelegramBrowserHandoffIfNeeded } from '../lib/telegramBrowserHandoff';
import { LoadingScreen } from '../../../shared/ui/LoadingVideo';

type Props = {
  pendingId: string;
};

/** Экран в Mini App после входа: браузер получит сессию автоматически. */
export function TelegramBrowserHandoffSuccess({ pendingId }: Props) {
  const [phase, setPhase] = useState<'syncing' | 'done' | 'error'>('syncing');

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const finish = (next: 'done' | 'error') => {
      if (!cancelled) setPhase(next);
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };

    const run = async () => {
      if (cancelled) return;
      attempts += 1;
      const ok = await completeTelegramBrowserHandoffIfNeeded();
      if (cancelled) return;
      if (ok) {
        finish('done');
        return;
      }
      if (attempts >= 8) finish('error');
    };

    void run();
    timer = window.setInterval(() => void run(), 2000);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [pendingId]);

  if (phase === 'syncing') {
    return (
      <LoadingScreen
        className="min-h-dvh bg-white"
        label="Подключаем вход в браузере…"
      />
    );
  }

  if (phase === 'error') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
        <p className="text-[20px] font-bold tracking-[-0.03em] text-[#111827]">Не удалось связать браузер</p>
        <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-[#6B7280]">
          Вернитесь на страницу входа в Chrome и нажмите «Telegram» ещё раз.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
      <p className="text-[22px] font-bold tracking-[-0.03em] text-[#111827]">Готово</p>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-[#6B7280]">
        Вернитесь в браузер на компьютере или телефоне — вход подтвердится автоматически в течение
        нескольких секунд.
      </p>
      <p className="mt-6 text-[13px] text-[#9CA3AF]">Это окно Telegram можно закрыть.</p>
    </div>
  );
}
