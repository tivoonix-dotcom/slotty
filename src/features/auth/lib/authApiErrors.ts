/** Сообщения для кодов ошибок API auth (см. server ApiError). */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  GOOGLE_ALREADY_LINKED: 'Этот Google уже привязан к другому аккаунту.',
  GOOGLE_EMAIL_CONFLICT:
    'Этот email уже связан с другим аккаунтом. Войдите через email или Telegram и привяжите Google в «Способы входа».',
  TELEGRAM_ALREADY_LINKED: 'Этот Telegram уже привязан к другому аккаунту.',
  EMAIL_ALREADY_LINKED: 'Этот email уже привязан к другому аккаунту.',
  GOOGLE_NOT_CONFIGURED: 'Google Sign-In пока не настроен.',
  GOOGLE_OAUTH_NOT_CONFIGURED:
    'На сервере API не задан GOOGLE_CLIENT_SECRET. Добавьте его в Railway (slotty-api) или откройте привязку в браузере.',
  API_PUBLIC_URL_MISSING:
    'На сервере API не задан публичный URL (PUBLIC_API_URL или RAILWAY_PUBLIC_DOMAIN).',
  AUTH_REQUIRED: 'Сначала войдите через Telegram в кабинет, затем снова нажмите «Подключить Google».',
  CONSENT_REQUIRED: 'Перед продолжением примите актуальные документы сервиса.',
  CONSENT_VERSION_MISMATCH: 'Версия документа устарела. Обновите страницу и примите актуальную версию.',
  CONSENT_INCOMPLETE: 'Отметьте все обязательные документы.',
  GOOGLE_LOGIN_PENDING_EXPIRED: 'Сессия входа через Google устарела. Начните вход заново.',
  GOOGLE_LINK_HANDOFF_INVALID:
    'Ссылка для привязки устарела. Вернитесь в Telegram → «Способы входа» → «Подключить Google».',
  GOOGLE_OAUTH_STATE_INVALID: 'Сессия Google устарела. Начните вход заново.',
  GOOGLE_OAUTH_EXCHANGE_FAILED: 'Не удалось завершить вход через Google.',
  GOOGLE_TOKEN_INVALID: 'Не удалось войти через Google.',
  GOOGLE_TOKEN_AUDIENCE: 'Не удалось войти через Google.',
  TELEGRAM_NOT_AVAILABLE: 'Вход через Telegram доступен внутри Telegram Web App.',
  EMAIL_LOGIN_FAILED: 'Неверный email или пароль.',
  EMAIL_PASSWORD_NOT_SET:
    'Для этого email войдите через Google или задайте пароль в кабинете в разделе «Способы входа».',
  EMAIL_ALREADY_REGISTERED: 'Этот email уже зарегистрирован. Войдите или восстановите пароль.',
  INVALID_CREDENTIALS: 'Неверный email или пароль.',
  PASSWORD_TOO_SHORT: 'Пароль минимум 8 символов.',
  EMAIL_INVALID: 'Введите корректный email.',
  EMAIL_REQUIRED: 'Укажите email.',
  EMAIL_IDENTITY_MISSING: 'Email не привязан к аккаунту.',
  EMAIL_TOKEN_INVALID: 'Ссылка недействительна или устарела.',
  EMAIL_TOKEN_USED: 'Ссылка уже использована.',
  EMAIL_TOKEN_EXPIRED: 'Ссылка истекла. Запросите новую.',
};

export function messageForAuthErrorCode(code: string | undefined, fallback?: string): string {
  if (!code) return fallback ?? 'Произошла ошибка. Попробуйте ещё раз.';
  return AUTH_ERROR_MESSAGES[code] ?? fallback ?? 'Произошла ошибка. Попробуйте ещё раз.';
}

export async function readAuthApiError(res: Response): Promise<string> {
  const j = (await res.json().catch(() => null)) as {
    error?: { message?: string; code?: string };
  } | null;
  const code = j?.error?.code;
  const serverMessage = j?.error?.message?.trim();
  if (code) {
    return messageForAuthErrorCode(code, serverMessage);
  }
  return serverMessage ?? `Ошибка ${res.status}`;
}
