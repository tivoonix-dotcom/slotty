import type { ReactNode } from 'react';
import { settingsOutlineBtn, settingsPinkBtn } from './settingsWorkspaceTheme';
import { SettingsStatusBadge } from './settingsUi';

export function AuthMethodCard({
  icon,
  title,
  description,
  connected,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  connected: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#F3F4F6] py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#FFF1F4]">{icon}</span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-semibold text-[#111827]">{title}</p>
            <SettingsStatusBadge tone={connected ? 'success' : 'neutral'}>
              {connected ? 'Подключено' : 'Не подключено'}
            </SettingsStatusBadge>
          </div>
          <p className="mt-0.5 text-[13px] text-[#6B7280]">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action ?? (connected ? <span className="text-[#16A34A] font-semibold">✓</span> : null)}</div>
    </div>
  );
}

export function NotificationChannelCard({
  title,
  description,
  connected,
  onTest,
  disabled = false,
}: {
  title: string;
  description: string;
  connected: boolean;
  onTest?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#F3F4F6] py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <p className="text-[15px] font-semibold text-[#111827]">{title}</p>
          <SettingsStatusBadge tone={connected ? 'success' : 'neutral'}>
            {connected ? 'Подключён' : 'Не настроен'}
          </SettingsStatusBadge>
        </div>
        <p className="mt-0.5 text-[13px] text-[#6B7280]">{description}</p>
      </div>
      {onTest ? (
        <button type="button" onClick={onTest} disabled={!connected || disabled} className={settingsOutlineBtn}>
          Тест
        </button>
      ) : null}
    </div>
  );
}

/** Синхронно с server MASTER_NOTIFICATION_ALWAYS_ON */
export const MASTER_NOTIFICATION_ALWAYS_ON_IDS = new Set(['billing', 'new_booking']);

const NOTIFICATION_EVENTS = [
  { id: 'new_booking', label: 'Новая запись', alwaysOn: true },
  { id: 'cancel', label: 'Отмена записи' },
  { id: 'reminder_1h', label: 'Напоминание за 1 час' },
  { id: 'late', label: 'Клиент опаздывает' },
  { id: 'arrived', label: 'Клиент на месте' },
  { id: 'reviews', label: 'Отзывы' },
  { id: 'disputes', label: 'Жалобы и споры' },
  { id: 'billing', label: 'Биллинг', alwaysOn: true },
  { id: 'news', label: 'Новости SLOTTY' },
] as const;

export function NotificationPreferenceMatrix({
  prefs,
  onChange,
  disabled = false,
}: {
  prefs: Record<string, { telegram: boolean; email: boolean; inApp: boolean }>;
  onChange: (eventId: string, channel: 'telegram' | 'email' | 'inApp', value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-[#EAECEF] text-[#9CA3AF]">
            <th className="pb-3 pr-4 font-semibold">Событие</th>
            <th className="pb-3 px-2 text-center font-semibold">Telegram</th>
            <th className="pb-3 px-2 text-center font-semibold">Email</th>
            <th className="pb-3 pl-2 text-center font-semibold">In-app</th>
          </tr>
        </thead>
        <tbody>
          {NOTIFICATION_EVENTS.map((ev) => {
            const row = prefs[ev.id] ?? { telegram: true, email: false, inApp: true };
            const locked = 'alwaysOn' in ev && ev.alwaysOn;
            return (
              <tr key={ev.id} className="border-b border-[#F3F4F6] last:border-0">
                <td className="py-3 pr-4">
                  <span className="font-medium text-[#111827]">{ev.label}</span>
                  {locked ? (
                    <span className="mt-1 block text-[11px] text-[#9CA3AF]">
                      Обязательное — нельзя отключить
                    </span>
                  ) : null}
                </td>
                {(['telegram', 'email', 'inApp'] as const).map((ch) => (
                  <td key={ch} className="py-3 px-2 text-center">
                    <input
                      type="checkbox"
                      checked={row[ch]}
                      disabled={disabled || locked}
                      onChange={(e) => onChange(ev.id, ch, e.target.checked)}
                      className="h-4 w-4 min-h-4 min-w-4 rounded border-[#D1D5DB] text-[#ff5f7a] focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/30 disabled:opacity-40"
                      aria-label={`${ev.label} — ${ch}`}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function IntegrationCard({
  title,
  description,
  statusLabel,
  badge,
  action,
}: {
  title: string;
  description: string;
  statusLabel: string;
  badge?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#F3F4F6] py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-semibold text-[#111827]">{title}</p>
          {badge ? <SettingsStatusBadge tone="warning">{badge}</SettingsStatusBadge> : null}
        </div>
        <p className="mt-0.5 text-[13px] text-[#6B7280]">{description}</p>
        <p className="mt-1 text-[12px] font-medium text-[#9CA3AF]">{statusLabel}</p>
      </div>
      {action}
    </div>
  );
}

export function SettingsPlaceholderPage({
  title,
  description,
  badge,
  features,
}: {
  title: string;
  description: string;
  badge?: string;
  features?: string[];
}) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-[#EAECEF] bg-white px-6 py-12 text-center shadow-[0_4px_24px_rgba(17,24,39,0.05)]">
      {badge ? (
        <span className="mb-4">
          <SettingsStatusBadge tone="pink">{badge}</SettingsStatusBadge>
        </span>
      ) : null}
      <h2 className="text-[20px] font-bold text-[#111827]">{title}</h2>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-[#6B7280]">{description}</p>
      {features?.length ? (
        <ul className="mt-8 w-full max-w-sm space-y-2 text-left text-[14px] text-[#374151]">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span className="text-[#ff5f7a]" aria-hidden>
                ○
              </span>
              {f}
            </li>
          ))}
        </ul>
      ) : null}
      <button type="button" disabled className={`mt-8 ${settingsPinkBtn} opacity-50`}>
        Скоро
      </button>
    </div>
  );
}

export function SettingsDangerZone({
  onDelete,
  disabled = true,
  hint = 'Удаление через приложение пока недоступно. Напишите в поддержку.',
}: {
  onDelete?: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#FECACA] bg-[#FEF2F2] p-5 sm:p-6">
      <h3 className="text-[16px] font-bold text-[#991B1B]">Опасная зона</h3>
      <p className="mt-2 text-[14px] text-[#7F1D1D]">
        Удаление аккаунта необратимо: профиль мастера, записи и настройки будут недоступны.
      </p>
      <p className="mt-2 text-[13px] text-[#7F1D1D]/90">{hint}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={disabled ? undefined : onDelete}
        className="mt-4 min-h-[40px] rounded-[12px] border border-[#DC2626] bg-white px-4 py-2.5 text-[14px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {disabled ? 'Скоро' : 'Удалить аккаунт'}
      </button>
    </div>
  );
}

export function SessionList({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}
