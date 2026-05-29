const APPOINTMENT_MESSAGES: Record<string, string> = {
  BAD_STATUS: 'Запись уже обработана или её нельзя изменить в текущем статусе.',
  SLOT_UNAVAILABLE: 'Окно больше недоступно для записи.',
  SLOT_IN_PAST: 'Время окна уже прошло.',
  MASTER_OVERLAP: 'У мастера уже есть запись на это время.',
  CLIENT_OVERLAP: 'У клиента уже есть запись на это время.',
  SERVICE_INACTIVE: 'Услуга недоступна.',
  SERVICE_SLOT_MISMATCH: 'Услуга не подходит к выбранному окну.',
  SERVICE_DOES_NOT_FIT: 'Длительность услуги не помещается в окно.',
  MASTER_NOT_PUBLISHED: 'Профиль мастера не опубликован.',
  SELF_BOOKING: 'Нельзя записаться к самому себе.',
};

const SLOT_MESSAGES: Record<string, string> = {
  SLOT_BOOKED:
    'На это окно уже записан клиент. Изменить или удалить его нельзя — сначала отмените запись в разделе «Заявки».',
  SLOT_HAS_APPOINTMENT:
    'На это окно есть активная запись. Сначала отмените её в разделе «Заявки».',
  SLOT_HAS_HISTORY:
    'Нельзя удалить окно: по нему уже была запись и оно сохранено в истории.',
  SLOT_NOT_AVAILABLE: 'Окно занято или недоступно для изменения.',
  SLOT_NOT_EDITABLE: 'Окно занято или недоступно для изменения.',
  SLOT_OVERLAP: 'Время пересекается с другим свободным окном.',
  SLOT_IN_PAST: 'Окно не может начинаться в прошлом.',
  SLOT_TOO_LONG: 'Слишком длинный интервал окна.',
  BAD_SLOT_RANGE: 'Время окончания должно быть позже начала.',
  BAD_SERVICE: 'Услуга не найдена или скрыта.',
};

const REVIEW_MESSAGES: Record<string, string> = {
  APPOINTMENT_NOT_FOUND: 'Запись не найдена.',
  NOT_YOUR_APPOINTMENT: 'Нельзя оставить отзыв к чужой записи.',
  APPOINTMENT_NOT_REVIEWABLE: 'Отзыв можно оставить после завершённого визита.',
  REVIEW_EXISTS: 'Вы уже оставили отзыв к этой записи.',
  REVIEW_BODY_REQUIRED: 'Напишите текст отзыва.',
};

const FAVORITE_MESSAGES: Record<string, string> = {
  SELF_FAVORITE: 'Нельзя добавить себя в избранное.',
  MASTER_NOT_FOUND: 'Мастер не найден или недоступен.',
};

const CATEGORY_CHANGE_MESSAGES: Record<string, string> = {
  active_request_exists: 'У вас уже есть заявка на смену категории.',
  same_category: 'Выберите категорию, отличную от текущей.',
  category_change_requires_request:
    'Для активного профиля смена категории проходит через заявку.',
};

const SPONSOR_MESSAGES: Record<string, string> = {
  active_sponsor_request_exists:
    'У вас уже есть активная заявка на спонсорство. Дождитесь ответа команды SLOTTY.',
};

const PROMO_MESSAGES: Record<string, string> = {
  PROMO_NOT_FOUND: 'Промокод не найден. Проверьте написание.',
  PROMO_INACTIVE: 'Промокод недействителен.',
  PROMO_NOT_STARTED: 'Промокод ещё не активен.',
  PROMO_EXPIRED: 'Срок действия промокода истёк.',
  PROMO_WRONG_PLAN: 'Промокод не подходит к этому тарифу.',
  PROMO_WRONG_PERIOD: 'Промокод не действует для выбранного периода оплаты.',
  PROMO_LIMIT_REACHED: 'Лимит использований промокода исчерпан.',
  PROMO_EXISTS: 'Такой промокод уже создан.',
};

const PRO_FEATURE_MESSAGES: Record<string, string> = {
  PRO_REQUIRED:
    'Наборы услуг и акции доступны по подписке «Мастер Pro». Подключите тариф в разделе «Тарифы».',
};

const PRO_MESSAGES: Record<string, string> = {
  PRO_REQUIRED:
    'Функция доступна по подписке «Мастер Pro». Подключите тариф в разделе «Тарифы».',
  SUBSCRIPTION_EXPIRED:
    'Срок Pro истёк. Продлите тариф в разделе «Тарифы», чтобы снова пользоваться Pro-функциями.',
};

const LIMIT_MESSAGES: Record<string, string> = {
  LIMIT_SERVICES_REACHED:
    'Достигнут лимит услуг по тарифу. Оформите Pro или деактивируйте лишние услуги.',
  LIMIT_SCHEDULE_DAYS_REACHED:
    'Дата окна выходит за пределы горизонта расписания вашего тарифа. Выберите более близкую дату или смените тариф.',
  LIMIT_MONTHLY_APPOINTMENTS_REACHED:
    'У мастера достигнут лимит записей на этот месяц по тарифу. Попробуйте позже или выберите другого мастера.',
  PLAN_LIMIT_REACHED:
    'Достигнут лимит по тарифу. Подключите Pro или удалите лишние элементы.',
};

const ACCOUNT_MESSAGES: Record<string, (reason?: string) => string> = {
  ACCOUNT_BLOCKED: (reason) =>
    reason
      ? `Аккаунт заблокирован. Причина: ${reason}`
      : 'Аккаунт заблокирован. Обратитесь в поддержку.',
  ACCOUNT_RESTRICTED: (reason) =>
    reason
      ? `Доступ ограничен. Причина: ${reason}`
      : 'Доступ ограничен.',
  ACCOUNT_DELETED: () => 'Аккаунт удалён.',
  CANCEL_REASON_REQUIRED: () => 'Укажите причину отмены.',
};

/** Читает тело ошибки API и возвращает понятное сообщение (в т.ч. для кодов лимитов). */
export async function readSlottyApiErrorMessage(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as {
    error?: { message?: string; code?: string; reason?: string };
  } | null;
  const code = j?.error?.code;
  const accountMsg = code && ACCOUNT_MESSAGES[code];
  if (accountMsg) return accountMsg(j?.error?.reason);
  if (code && APPOINTMENT_MESSAGES[code]) return APPOINTMENT_MESSAGES[code];
  if (code && SLOT_MESSAGES[code]) return SLOT_MESSAGES[code];
  if (code && REVIEW_MESSAGES[code]) return REVIEW_MESSAGES[code];
  if (code && FAVORITE_MESSAGES[code]) return FAVORITE_MESSAGES[code];
  if (code && PRO_FEATURE_MESSAGES[code]) return PRO_FEATURE_MESSAGES[code];
  if (code && PRO_MESSAGES[code]) return PRO_MESSAGES[code];
  if (code && LIMIT_MESSAGES[code]) return LIMIT_MESSAGES[code];
  if (code && CATEGORY_CHANGE_MESSAGES[code]) return CATEGORY_CHANGE_MESSAGES[code];
  if (code && SPONSOR_MESSAGES[code]) return SPONSOR_MESSAGES[code];
  if (code && PROMO_MESSAGES[code]) return PROMO_MESSAGES[code];
  const msg = j?.error?.message;
  if (msg) return msg;
  return `Ошибка ${res.status}`;
}
