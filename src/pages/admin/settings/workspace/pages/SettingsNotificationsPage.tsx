import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchAuthIdentities } from '../../../../../features/auth/api/authApi';
import type { AuthIdentityDto } from '../../../../../features/auth/types';
import {
  fetchMasterNotificationPreferences,
  saveMasterNotificationPreferences,
  type MasterNotificationPreferencesDto,
  type NotificationEventKey,
} from '../../../../../features/notifications/api/masterNotificationPreferencesApi';
import { getApiBaseUrl } from '../../../../../shared/api/backendClient';
import { AdminToast } from '../../../shared/AdminToast';
import { useAdminToast } from '../../../shared/useAdminToast';
import { NotificationChannelCard, NotificationPreferenceMatrix } from '../settingsCards';
import { SettingsHeader } from '../SettingsHeader';
import { SETTINGS_PAGE_META } from '../settingsNav';
import { SettingsComingSoonBanner, SettingsErrorState, SettingsSectionCard, SettingsSkeleton, SettingsStickySaveBar } from '../settingsUi';
import { settingsOutlineBtn } from '../settingsWorkspaceTheme';

const meta = SETTINGS_PAGE_META.notifications;

function hasProvider(identities: AuthIdentityDto[], provider: string): boolean {
  return identities.some((i) => i.provider === provider);
}

function hasVerifiedEmail(identities: AuthIdentityDto[]): boolean {
  const email = identities.find((i) => i.provider === 'email');
  return Boolean(email?.emailVerified);
}

export function SettingsNotificationsPage() {
  const { toast, showToast, showErrorToast, clearToast } = useAdminToast();
  const hasApi = Boolean(getApiBaseUrl());

  const [identities, setIdentities] = useState<AuthIdentityDto[]>([]);
  const [prefs, setPrefs] = useState<MasterNotificationPreferencesDto | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [loading, setLoading] = useState(hasApi);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!hasApi) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ids, p] = await Promise.all([fetchAuthIdentities(), fetchMasterNotificationPreferences()]);
      setIdentities(ids);
      setPrefs(p);
      setSavedSnapshot(JSON.stringify(p));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить настройки');
    } finally {
      setLoading(false);
    }
  }, [hasApi]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const linked = useMemo(
    () => ({
      telegram: hasProvider(identities, 'telegram'),
      email: hasVerifiedEmail(identities),
    }),
    [identities],
  );

  const dirty = prefs != null && JSON.stringify(prefs) !== savedSnapshot;

  const onPrefChange = useCallback(
    (eventId: string, channel: 'telegram' | 'email' | 'inApp', value: boolean) => {
      if (!prefs) return;
      setPrefs({
        ...prefs,
        events: {
          ...prefs.events,
          [eventId as NotificationEventKey]: {
            ...prefs.events[eventId as NotificationEventKey],
            [channel]: value,
          },
        },
      });
    },
    [prefs],
  );

  const savePrefs = async () => {
    if (!prefs || !hasApi) return;
    setSaving(true);
    try {
      const saved = await saveMasterNotificationPreferences({
        channels: prefs.channels,
        events: prefs.events,
      });
      setPrefs(saved);
      setSavedSnapshot(JSON.stringify(saved));
      showToast('Настройки уведомлений сохранены');
    } catch (e) {
      showErrorToast(e instanceof Error ? e.message : 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (!hasApi) {
    return (
      <>
        <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />
        <SettingsComingSoonBanner
          badge="В разработке"
          title="Настройки уведомлений скоро будут доступны"
          description="Сейчас уведомления отправляются по стандартным правилам SLOTTY. Подключите backend (VITE_API_URL), чтобы сохранять предпочтения."
        />
      </>
    );
  }

  return (
    <>
      <SettingsHeader title={meta.title} description={meta.description} breadcrumb={meta.breadcrumb} />

      {loading ? (
        <SettingsSectionCard>
          <SettingsSkeleton rows={5} />
        </SettingsSectionCard>
      ) : null}

      {error && !loading ? (
        <SettingsErrorState message={error} onRetry={() => void loadAll()} />
      ) : null}

      {prefs && !loading && !error ? (
        <div className="space-y-5 pb-24">
          <SettingsSectionCard title="Каналы">
            <NotificationChannelCard
              title="Telegram"
              description="Уведомления в бот и Mini App"
              connected={linked.telegram}
              disabled={saving}
            />
            <NotificationChannelCard
              title="Email"
              description={
                linked.email
                  ? 'Письма на подтверждённую почту'
                  : 'Подтвердите email в разделе «Безопасность»'
              }
              connected={linked.email}
              disabled={saving}
            />
            <NotificationChannelCard
              title="In-app"
              description="Колокол в кабинете мастера"
              connected
              disabled={saving}
            />
          </SettingsSectionCard>

          <SettingsSectionCard
            title="События"
            description="Выберите каналы для каждого типа события. «Новая запись» и «Биллинг» обязательны и всегда доставляются. Изменения применяются после сохранения."
          >
            <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
              <NotificationPreferenceMatrix
                prefs={prefs.events}
                onChange={onPrefChange}
                disabled={saving}
              />
            </div>
          </SettingsSectionCard>

          <SettingsSectionCard title="Тест уведомлений">
            <p className="mb-3 text-[13px] text-[#6B7280]">
              Тестовые отправки подключаются отдельно. Сейчас проверьте каналы в разделе «Безопасность».
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={settingsOutlineBtn} disabled>
                Отправить тест в Telegram
              </button>
              <button type="button" className={settingsOutlineBtn} disabled>
                Отправить тест на email
              </button>
            </div>
          </SettingsSectionCard>
        </div>
      ) : null}

      <SettingsStickySaveBar
        visible={dirty}
        saving={saving}
        onSave={() => void savePrefs()}
        onDiscard={() => {
          if (!savedSnapshot) return;
          setPrefs(JSON.parse(savedSnapshot) as MasterNotificationPreferencesDto);
        }}
      />

      <AdminToast toast={toast} onDismiss={clearToast} />
    </>
  );
}
