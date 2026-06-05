export type PendingDeadlineView = {
  line: string;
  helper: string;
  tone: 'normal' | 'warning' | 'critical';
  confirmDisabled: boolean;
};

export function formatPendingDeadline(
  pendingExpiresAt: string | null | undefined,
  now = Date.now(),
): PendingDeadlineView | null {
  if (!pendingExpiresAt?.trim()) return null;
  const expires = new Date(pendingExpiresAt);
  if (Number.isNaN(expires.getTime())) return null;

  const msLeft = expires.getTime() - now;
  const timeLabel = expires.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

  if (msLeft <= 0) {
    return {
      line: 'Заявка истекает',
      helper: 'Окно скоро снова станет свободным. Обновите список.',
      tone: 'critical',
      confirmDisabled: true,
    };
  }

  const minutesLeft = Math.ceil(msLeft / 60_000);
  if (minutesLeft <= 15) {
    return {
      line: `Осталось ${minutesLeft} мин`,
      helper: `Ответьте до ${timeLabel}, иначе окно снова станет свободным.`,
      tone: 'warning',
      confirmDisabled: false,
    };
  }

  if (minutesLeft <= 60) {
    return {
      line: 'Заявка скоро истечёт',
      helper: `Ответьте до ${timeLabel}, иначе окно снова станет свободным.`,
      tone: 'warning',
      confirmDisabled: false,
    };
  }

  return {
    line: `Подтвердите до ${timeLabel}`,
    helper: `Ответьте до ${timeLabel}, иначе окно снова станет свободным.`,
    tone: 'normal',
    confirmDisabled: false,
  };
}
