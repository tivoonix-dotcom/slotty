import type { MeNotificationRow } from '../profile/api/clientNotifications';

export type NotificationSummaryField = { label: string; value: string };

function fieldsOrEmpty(rows: NotificationSummaryField[]): NotificationSummaryField[] {
  return rows.every((r) => r.value.trim()) ? rows : [];
}

const STRUCTURED_LABELS = new Set([
  'Клиент',
  'Телефон',
  'Email',
  'Telegram',
  'Услуга',
  'Когда',
  'Номер',
  'Мастер',
  'Статус',
  'Оценка',
]);

/** Строки вида «Метка: значение» — новый формат in-app уведомлений. */
function parseStructuredNotificationBody(body: string): NotificationSummaryField[] {
  const rows: NotificationSummaryField[] = [];
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(':');
    if (idx <= 0) continue;
    const label = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!value || !STRUCTURED_LABELS.has(label)) continue;
    rows.push({ label, value });
  }
  return rows.length >= 2 ? rows : [];
}

/** Разбор текста уведомления в поля для карточки (клиент и мастер, старые и новые шаблоны). */
export function parseNotificationSummary(item: MeNotificationRow): NotificationSummaryField[] {
  const body = item.body.trim();

  const structured = parseStructuredNotificationBody(body);
  if (structured.length) return structured;

  const clientConfirmed = body.match(/^Запись подтверждена:\s*(.+?)\.\s*(?:Ждём|Детали)/);
  if (clientConfirmed) {
    return [{ label: 'Когда', value: clientConfirmed[1].trim() }];
  }

  const clientPending = body.match(/^Заявка на запись отправлена/);
  if (clientPending && item.type === 'appointment_pending') {
    return [{ label: 'Статус', value: 'Ожидает подтверждения мастера' }];
  }

  const clientCancelledMaster = body.match(
    /^Мастер\s+(.+?)\s+отменил(?:а)?\s+запись:\s*(.+?)\s+\((.+?)\)/,
  );
  if (clientCancelledMaster) {
    return fieldsOrEmpty([
      { label: 'Мастер', value: clientCancelledMaster[1].trim() },
      { label: 'Услуга', value: clientCancelledMaster[2].trim() },
      { label: 'Когда', value: clientCancelledMaster[3].trim() },
    ]);
  }

  const newRequest = body.match(/^Новая заявка:\s*(.+?),\s*(.+?),\s*(.+)\./);
  if (newRequest) {
    return fieldsOrEmpty([
      { label: 'Клиент', value: newRequest[1].trim() },
      { label: 'Услуга', value: newRequest[2].trim() },
      { label: 'Когда', value: newRequest[3].trim() },
    ]);
  }

  const legacyRequest = body.match(/^Новая заявка на запись:\s*(.+?),\s*(.+?)\./);
  if (legacyRequest) {
    return fieldsOrEmpty([
      { label: 'Услуга', value: legacyRequest[1].trim() },
      { label: 'Когда', value: legacyRequest[2].trim() },
    ]);
  }

  const cancelled = body.match(/^(.+?)\s+отменил(?:а)?\s+запись:\s*(.+?)\s+\((.+?)\)/);
  if (cancelled) {
    return fieldsOrEmpty([
      { label: 'Клиент', value: cancelled[1].trim() },
      { label: 'Услуга', value: cancelled[2].trim() },
      { label: 'Когда', value: cancelled[3].trim() },
    ]);
  }

  const booked = body.match(
    /^(.+?)\s+(?:забронировал(?:а)?|записал(?:ся|ась)|оформил(?:а)?\s+запись):\s*(.+?)\s*[—–-]\s*(.+?)(?:\.\s*Номер|$)/i,
  );
  if (booked) {
    const voucher = body.match(/Номер:\s*(\S+)/i);
    const rows: NotificationSummaryField[] = [
      { label: 'Клиент', value: booked[1].trim() },
      { label: 'Услуга', value: booked[2].trim() },
      { label: 'Когда', value: booked[3].trim() },
    ];
    if (voucher) rows.push({ label: 'Номер', value: voucher[1].trim() });
    return fieldsOrEmpty(rows);
  }

  const completed = body.match(/^Визит завершён:\s*(.+?),\s*(.+?),\s*(.+)\./);
  if (completed) {
    return fieldsOrEmpty([
      { label: 'Клиент', value: completed[1].trim() },
      { label: 'Услуга', value: completed[2].trim() },
      { label: 'Когда', value: completed[3].trim() },
    ]);
  }

  const confirmed = body.match(/^Запись подтверждена:\s*(.+)\./);
  if (confirmed) {
    return [{ label: 'Когда', value: confirmed[1].trim() }];
  }

  const clientSignal = body.match(/^(.+?)\s+сообщил(?:\s|,|\.)/i);
  if (clientSignal) {
    const name = clientSignal[1].trim();
    if (name && name !== 'Клиент') return [{ label: 'Клиент', value: name }];
  }

  const clientLate = body.match(/^(.+?)\s+опаздывает/i);
  if (clientLate) {
    return [{ label: 'Клиент', value: clientLate[1].trim() }];
  }

  const clientComment = body.match(/^(.+?)\s+оставил(?:\s+а)?\s+комментарий/i);
  if (clientComment) {
    return [{ label: 'Клиент', value: clientComment[1].trim() }];
  }

  const clientConfirmedDone = body.match(/^(.+?)\s+подтвердил(?:\s|,)/i);
  if (clientConfirmedDone && item.type === 'appointment_confirmed') {
    return [{ label: 'Клиент', value: clientConfirmedDone[1].trim() }];
  }

  const pendingReminder = body.match(
    /^Заявка (?:всё ещё )?ждёт решения:\s*(.+?),\s*(.+?),\s*(.+)\./i,
  );
  if (pendingReminder) {
    return fieldsOrEmpty([
      { label: 'Клиент', value: pendingReminder[1].trim() },
      { label: 'Услуга', value: pendingReminder[2].trim() },
      { label: 'Когда', value: pendingReminder[3].trim() },
    ]);
  }

  const pendingExpire = body.match(/^Заявка скоро истечёт[^:]*:\s*(.+?),\s*(.+?),\s*(.+)\./i);
  if (pendingExpire) {
    return fieldsOrEmpty([
      { label: 'Клиент', value: pendingExpire[1].trim() },
      { label: 'Услуга', value: pendingExpire[2].trim() },
      { label: 'Когда', value: pendingExpire[3].trim() },
    ]);
  }

  const expiredRequest = body.match(/^Заявка истекла:\s*(.+?),\s*(.+?),\s*(.+)\./i);
  if (expiredRequest) {
    return fieldsOrEmpty([
      { label: 'Клиент', value: expiredRequest[1].trim() },
      { label: 'Услуга', value: expiredRequest[2].trim() },
      { label: 'Когда', value: expiredRequest[3].trim() },
    ]);
  }

  return [];
}

/** Скрыть дублирующий body, если поля уже разобраны в таблицу. */
export function shouldHideNotificationBody(item: MeNotificationRow, summary: NotificationSummaryField[]): boolean {
  if (summary.length === 0) return false;
  if (parseStructuredNotificationBody(item.body.trim()).length > 0) return true;
  return /^Новая заявка:/.test(item.body.trim()) || /^Визит завершён:/.test(item.body.trim());
}
