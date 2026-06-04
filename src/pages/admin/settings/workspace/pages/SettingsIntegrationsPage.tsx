import { useCallback, useEffect, useState } from 'react';
import { MASTER_SETTINGS_SECURITY_PATH } from '../../../../../app/paths';
import { Link } from 'react-router-dom';
import { fetchAuthIdentities } from '../../../../../features/auth/api/authApi';
import { useTelegramLoginUrl } from '../../../../../features/auth/hooks/useTelegramLoginUrl';
import { usePublicAppConfig } from '../../../../../features/auth/hooks/usePublicAppConfig';
import { getApiBaseUrl } from '../../../../../shared/api/backendClient';
import { readYandexMapsApiKey } from '../../../../../shared/lib/yandexGeocodeMinsk';
import { IntegrationCard } from '../settingsCards';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';
import { SettingsErrorState, SettingsSectionCard, SettingsSkeleton } from '../settingsUi';
import { settingsOutlineBtn } from '../settingsWorkspaceTheme';

const meta = SETTINGS_PAGE_META.integrations;

export function SettingsIntegrationsPage() {
  const telegramUrl = useTelegramLoginUrl();
  const config = usePublicAppConfig();
  const hasApi = Boolean(getApiBaseUrl());

  const [telegramLinked, setTelegramLinked] = useState(false);
  const [googleLinked, setGoogleLinked] = useState(false);
  const [loading, setLoading] = useState(hasApi);
  const [error, setError] = useState<string | null>(null);

  const yandexClientKey = Boolean(readYandexMapsApiKey());

  const reload = useCallback(async () => {
    if (!hasApi) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ids = await fetchAuthIdentities();
      setTelegramLinked(ids.some((i) => i.provider === 'telegram'));
      setGoogleLinked(ids.some((i) => i.provider === 'google'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось проверить привязки');
    } finally {
      setLoading(false);
    }
  }, [hasApi]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const botReady = config.telegramBotConfigured === true;
  const emailReady = config.emailDeliveryConfigured === true;

  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      {loading ? (
        <SettingsSectionCard>
          <SettingsSkeleton rows={4} />
        </SettingsSectionCard>
      ) : null}

      {error && !loading ? <SettingsErrorState message={error} onRetry={() => void reload()} /> : null}

      {!loading && !error ? (
        <SettingsSectionCard>
          <IntegrationCard
            title="Telegram Bot"
            description="Вход через Telegram и уведомления в бот"
            statusLabel={
              !hasApi
                ? 'Нет подключения к API'
                : !botReady
                  ? 'Бот не настроен на сервере'
                  : telegramLinked
                    ? 'Аккаунт Telegram привязан'
                    : 'Бот настроен · аккаунт не привязан'
            }
            action={
              telegramUrl && botReady ? (
                <a
                  href={telegramUrl}
                  className={`${settingsOutlineBtn} min-h-[40px] no-underline`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {telegramLinked ? 'Открыть бота' : 'Привязать в Telegram'}
                </a>
              ) : null
            }
          />
          <IntegrationCard
            title="Google"
            description="Вход через Google аккаунт"
            statusLabel={
              !hasApi
                ? 'Нет подключения к API'
                : !config.googleOAuthConfigured
                  ? 'OAuth Google не настроен на сервере'
                  : googleLinked
                    ? 'Google привязан к профилю'
                    : 'OAuth готов · аккаунт не привязан'
            }
            action={
              <Link
                to={MASTER_SETTINGS_SECURITY_PATH}
                className={`${settingsOutlineBtn} min-h-[40px] inline-flex no-underline`}
              >
                {googleLinked ? 'Управлять' : 'Привязать'}
              </Link>
            }
          />
          <IntegrationCard
            title="Google Calendar"
            description="Синхронизация записей с календарём"
            statusLabel="Не реализовано"
            badge="Скоро"
          />
          <IntegrationCard
            title="Яндекс.Карты"
            description="Подсказки адреса в кабинете (ключ только в браузере, без отображения значения)"
            statusLabel={
              yandexClientKey
                ? 'Ключ задан в приложении — подсказки доступны'
                : 'Ключ не задан — адрес без автоподсказок'
            }
          />
          <IntegrationCard
            title="Email / Resend"
            description="Исходящая почта платформы (диагностика без секретов)"
            statusLabel={
              !hasApi
                ? 'API недоступен'
                : emailReady
                  ? 'Почтовый канал настроен на сервере'
                  : 'Resend/SMTP не настроен на сервере'
            }
          />
          <IntegrationCard
            title="Webhooks / API"
            description="Исходящие события для внешних систем"
            statusLabel="Не реализовано"
            badge="Скоро"
          />
        </SettingsSectionCard>
      ) : null}
    </>
  );
}
