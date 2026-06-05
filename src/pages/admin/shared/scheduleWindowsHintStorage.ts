const STORAGE_KEY = 'slotty_schedule_windows_hint_dismissed';

export const SCHEDULE_WINDOWS_HINT_TITLE = 'Чтобы клиенты записались, откройте окна';

export const SCHEDULE_WINDOWS_HINT_TEXT =
  'График в профиле — это подсказка, когда вы обычно работаете. Запись включается только после того, как вы добавите свободные окна в «Расписании»: клиент сможет выбрать конкретное время.';

export function isScheduleWindowsHintDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissScheduleWindowsHintPermanently(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}
