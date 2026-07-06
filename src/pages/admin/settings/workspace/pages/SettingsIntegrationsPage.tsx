import { useCallback, useEffect, useMemo, useState } from 'react';
import { HiInformationCircle } from 'react-icons/hi2';
import { Link } from 'react-router-dom';
import { MASTER_SETTINGS_SECURITY_PATH } from '../../../../../app/paths';
import { fetchAuthIdentities } from '../../../../../features/auth/api/authApi';
import { useTelegramLoginUrl } from '../../../../../features/auth/hooks/useTelegramLoginUrl';
import { usePublicAppConfig } from '../../../../../features/auth/hooks/usePublicAppConfig';
import { getApiBaseUrl } from '../../../../../shared/api/backendClient';
import { readYandexMapsApiKey } from '../../../../../shared/lib/yandexGeocodeMinsk';
import { integrationBrandIcon } from '../integrationBrandIcons';
import {
  IntegrationsCabinetList,
  type IntegrationCabinetRow,
} from '../settingsCards';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';
import {
  SettingsCabinetHero,
  SettingsCabinetRingBadge,
  SettingsCabinetSectionTitle,
  settingsCabinetStack,
} from '../settingsCabinetUi';
import {
  SettingsComingSoonBanner,
  SettingsErrorState,
  SettingsSkeleton,
} from '../settingsUi';

const meta = SETTINGS_PAGE_META.integrations;

const INTEGRATION_TOTAL = 4;

function IntegrationsLoadingSkeleton() {
  return (
    <div className={settingsCabinetStack}>
      <div className="flex items-start gap-4">
        <div className="h-[72px] w-[72px] shrink-0 animate-pulse rounded-full bg-[#F3F4F6]" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-48 animate-pulse rounded-lg bg-[#F3F4F6]" />
          <div className="h-4 w-full max-w-sm animate-pulse rounded-lg bg-[#F3F4F6]" />
        </div>
      </div>
      <SettingsSkeleton rows={5} />
    </div>
  );
}

export function SettingsIntegrationsPage() {
  const { url: telegramUrl } = useTelegramLoginUrl();
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
  const googleOAuthReady = config.googleOAuthConfigured === true;

  const connectedCount = useMemo(() => {
    let n = 0;
    if (hasApi && botReady && telegramLinked) n += 1;
    if (hasApi && googleOAuthReady && googleLinked) n += 1;
    if (yandexClientKey) n += 1;
    if (hasApi && emailReady) n += 1;
    return n;
  }, [hasApi, botReady, telegramLinked, googleOAuthReady, googleLinked, yandexClientKey, emailReady]);

  const authRows = useMemo((): IntegrationCabinetRow[] => {
    const telegramSubtitle = !hasApi
      ? 'Нет подключения к API'
      : !botReady
        ? 'Бот не настроен на сервере'
        : 'Вход через Telegram и уведомления в бот';

    let telegramStatus: IntegrationCabinetRow['statusTone'] = 'neutral';
    let telegramStatusText = 'Недоступно';
    if (hasApi && botReady) {
      if (telegramLinked) {
        telegramStatus = 'success';
        telegramStatusText = 'Привязан';
      } else {
        telegramStatus = 'warning';
        telegramStatusText = 'Не привязан';
      }
    } else if (hasApi && !botReady) {
      telegramStatus = 'warning';
      telegramStatusText = 'Не настроен';
    }

    const googleSubtitle = !hasApi
      ? 'Нет подключения к API'
      : !googleOAuthReady
        ? 'OAuth Google не настроен на сервере'
        : 'Вход через Google аккаунт';

    let googleStatus: IntegrationCabinetRow['statusTone'] = 'neutral';
    let googleStatusText = 'Недоступно';
    if (hasApi && googleOAuthReady) {
      if (googleLinked) {
        googleStatus = 'success';
        googleStatusText = 'Привязан';
      } else {
        googleStatus = 'warning';
        googleStatusText = 'Не привязан';
      }
    } else if (hasApi && !googleOAuthReady) {
      googleStatus = 'warning';
      googleStatusText = 'Не настроен';
    }

    return [
      {
        id: 'telegram',
        icon: integrationBrandIcon('telegram'),
        iconTone: 'brand',
        title: 'Telegram Bot',
        subtitle: telegramSubtitle,
        statusText: telegramStatusText,
        statusTone: telegramStatus,
        disabled: !hasApi || !botReady || !telegramUrl,
        externalHref: hasApi && botReady && telegramUrl ? telegramUrl : undefined,
      },
      {
        id: 'google',
        icon: integrationBrandIcon('google'),
        iconTone: 'brand',
        title: 'Google',
        subtitle: googleSubtitle,
        statusText: googleStatusText,
        statusTone: googleStatus,
        disabled: !hasApi || !googleOAuthReady,
        to: hasApi && googleOAuthReady ? MASTER_SETTINGS_SECURITY_PATH : undefined,
      },
    ];
  }, [hasApi, botReady, telegramUrl, telegramLinked, googleOAuthReady, googleLinked]);

  const platformRows = useMemo(
    (): IntegrationCabinetRow[] => [
      {
        id: 'yandex',
        icon: integrationBrandIcon('yandex'),
        iconTone: 'brand',
        title: 'Яндекс.Карты',
        subtitle: 'Подсказки адреса в кабинете (ключ в приложении)',
        statusText: yandexClientKey ? 'Ключ задан' : 'Без подсказок',
        statusTone: yandexClientKey ? 'success' : 'neutral',
        disabled: true,
      },
      {
        id: 'email',
        icon: integrationBrandIcon('resend'),
        iconTone: 'brand',
        title: 'Email / Resend',
        subtitle: 'Исходящая почта платформы',
        statusText: !hasApi ? 'API недоступен' : emailReady ? 'Настроено' : 'Не настроено',
        statusTone: !hasApi ? 'neutral' : emailReady ? 'success' : 'warning',
        disabled: true,
      },
    ],
    [hasApi, emailReady, yandexClientKey],
  );

  const soonRows = useMemo(
    (): IntegrationCabinetRow[] => [
      {
        id: 'calendar',
        icon: integrationBrandIcon('google-calendar'),
        iconTone: 'brand',
        title: 'Google Calendar',
        subtitle: 'Синхронизация записей с календарём',
        statusText: 'Скоро',
        statusTone: 'pink',
        disabled: true,
      },
      {
        id: 'webhooks',
        icon: integrationBrandIcon('webhooks'),
        iconTone: 'brand',
        title: 'Webhooks / API',
        subtitle: 'Исходящие события для внешних систем',
        statusText: 'Скоро',
        statusTone: 'pink',
        disabled: true,
      },
    ],
    [],
  );

  if (!hasApi) {
    return (
      <>
        <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
        <SettingsComingSoonBanner
          badge="В разработке"
          title="Интеграции скоро будут доступны"
          description="Подключите backend (VITE_API_URL), чтобы видеть статус Telegram, Google и почтового канала."
        />
      </>
    );
  }

  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      {loading ? <IntegrationsLoadingSkeleton /> : null}

      {error && !loading ? (
        <SettingsErrorState message={error} onRetry={() => void reload()} />
      ) : null}

      {!loading && !error ? (
        <div className={`${settingsCabinetStack} pb-8`}>
          <SettingsCabinetHero
            badge={
              <SettingsCabinetRingBadge
                current={connectedCount}
                total={INTEGRATION_TOTAL}
                label="готово"
              />
            }
            title="Сервисы и привязки"
            description={
              connectedCount >= INTEGRATION_TOTAL
                ? 'Основные интеграции настроены — можно пользоваться кабинетом без ограничений'
                : 'Подключите вход через Telegram и Google в разделе безопасности'
            }
          />

          {connectedCount < INTEGRATION_TOTAL && (!telegramLinked || !googleLinked) ? (
            <p className="rounded-[12px] bg-[#FFF1F4] px-4 py-3 text-[13px] leading-relaxed text-[#374151]">
              Для уведомлений и входа привяжите аккаунты в{' '}
              <Link
                to={MASTER_SETTINGS_SECURITY_PATH}
                className="font-semibold text-[#ff5f7a] underline-offset-2 hover:underline"
              >
                «Безопасность»
              </Link>
              .
            </p>
          ) : null}

          <section>
            <SettingsCabinetSectionTitle
              title="Вход и уведомления"
              description="Привязки аккаунта для входа и Telegram-бота"
            />
            <IntegrationsCabinetList rows={authRows} />
          </section>

          <section>
            <SettingsCabinetSectionTitle
              title="Платформа"
              description="Сервисы SLOTTY — статус без секретов"
            />
            <IntegrationsCabinetList rows={platformRows} />
          </section>

          <section>
            <SettingsCabinetSectionTitle
              title="В разработке"
              description="Появятся в следующих обновлениях"
            />
            <IntegrationsCabinetList rows={soonRows} />
          </section>

          <p className="flex items-center gap-2 px-1 text-[12px] text-[#9CA3AF]">
            <HiInformationCircle className="h-4 w-4 shrink-0" aria-hidden />
            Нужна другая интеграция — напишите в поддержку из раздела «Поддержка».
          </p>
        </div>
      ) : null}
    </>
  );
}
