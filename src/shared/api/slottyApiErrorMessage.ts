const LIMIT_MESSAGES: Record<string, string> = {
  LIMIT_SERVICES_REACHED:
    'Достигнут лимит услуг по тарифу. Оформите Pro или деактивируйте лишние услуги.',
  LIMIT_SCHEDULE_DAYS_REACHED:
    'Дата окна выходит за пределы горизонта расписания вашего тарифа. Выберите более близкую дату или смените тариф.',
  LIMIT_MONTHLY_APPOINTMENTS_REACHED:
    'У мастера достигнут лимит записей на этот месяц по тарифу. Попробуйте позже или выберите другого мастера.',
};

/** Читает тело ошибки API и возвращает понятное сообщение (в т.ч. для кодов лимитов). */
export async function readSlottyApiErrorMessage(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as { error?: { message?: string; code?: string } } | null;
  const code = j?.error?.code;
  if (code && LIMIT_MESSAGES[code]) return LIMIT_MESSAGES[code];
  const msg = j?.error?.message;
  if (msg) return msg;
  return `Ошибка ${res.status}`;
}
