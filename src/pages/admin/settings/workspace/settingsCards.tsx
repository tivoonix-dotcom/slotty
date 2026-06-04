import type { ReactNode } from 'react';
import { MASTER_SETTINGS_SECURITY_PATH } from '../../../../app/paths';
import {
  SettingsCabinetList,
  SettingsCabinetListRow,
  SettingsCabinetStatusPill,
  SettingsCabinetSwitch,
} from './settingsCabinetUi';
import { settingsPinkBtn } from './settingsWorkspaceTheme';
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

export type NotificationChannelRow = {
  id: 'telegram' | 'email' | 'in_app';
  icon: ReactNode;
  title: string;
  subtitle: string;
  connected: boolean;
  iconTone?: 'default' | 'brand';
};

export function NotificationChannelsCabinetList({ channels }: { channels: NotificationChannelRow[] }) {
  return (
    <SettingsCabinetList>
      {channels.map((ch) => (
        <SettingsCabinetListRow
          key={ch.id}
          icon={ch.icon}
          iconTone={ch.iconTone}
          title={ch.title}
          subtitle={ch.subtitle}
          to={!ch.connected && ch.id !== 'in_app' ? MASTER_SETTINGS_SECURITY_PATH : undefined}
          actionLabel={!ch.connected && ch.id !== 'in_app' ? 'Настроить' : undefined}
          trailing={
            ch.connected ? (
              <SettingsCabinetStatusPill tone="success">Подключён</SettingsCabinetStatusPill>
            ) : ch.id === 'in_app' ? (
              <SettingsCabinetStatusPill tone="pink">Всегда</SettingsCabinetStatusPill>
            ) : undefined
          }
        />
      ))}
    </SettingsCabinetList>
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

const NOTIFICATION_CHANNEL_LABELS: Record<'telegram' | 'email' | 'inApp', string> = {
  telegram: 'Telegram',
  email: 'Email',
  inApp: 'Кабинет',
};

export function NotificationEventsCabinetList({
  prefs,
  onChange,
  disabled = false,
}: {
  prefs: Record<string, { telegram: boolean; email: boolean; inApp: boolean }>;
  onChange: (eventId: string, channel: 'telegram' | 'email' | 'inApp', value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {NOTIFICATION_EVENTS.map((ev) => {
        const row = prefs[ev.id] ?? { telegram: true, email: false, inApp: true };
        const locked = 'alwaysOn' in ev && ev.alwaysOn;

        return (
          <div
            key={ev.id}
            className="overflow-hidden rounded-[16px] bg-white px-5 py-4 shadow-[0_1px_0_rgba(17,24,39,0.04)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-bold text-[#111827]">{ev.label}</p>
              {locked ? <SettingsCabinetStatusPill tone="neutral">Обязательно</SettingsCabinetStatusPill> : null}
            </div>
            {locked ? (
              <p className="mt-1 text-[12px] leading-snug text-[#9CA3AF]">
                Всегда доставляется — отключить нельзя
              </p>
            ) : null}
            <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
              {(['telegram', 'email', 'inApp'] as const).map((ch) => (
                <div
                  key={ch}
                  className="flex flex-col items-center gap-2 rounded-[12px] bg-[#F6F7FB] px-2 py-3"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wide text-[#9CA3AF]">
                    {NOTIFICATION_CHANNEL_LABELS[ch]}
                  </span>
                  <SettingsCabinetSwitch
                    checked={row[ch]}
                    disabled={disabled || locked}
                    onChange={(next) => onChange(ev.id, ch, next)}
                    aria-label={`${ev.label} — ${NOTIFICATION_CHANNEL_LABELS[ch]}`}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type IntegrationCabinetRow = {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  statusText: string;
  statusTone: 'success' | 'warning' | 'neutral' | 'pink';
  disabled?: boolean;
  to?: string;
  externalHref?: string;
  actionLabel?: string;
  iconTone?: 'default' | 'brand';
};

export function IntegrationsCabinetList({ rows }: { rows: IntegrationCabinetRow[] }) {
  return (
    <SettingsCabinetList>
      {rows.map((row) => {
        const trailing = (
          <SettingsCabinetStatusPill tone={row.statusTone}>{row.statusText}</SettingsCabinetStatusPill>
        );

        return (
          <SettingsCabinetListRow
            key={row.id}
            icon={row.icon}
            iconTone={row.iconTone}
            title={row.title}
            subtitle={row.subtitle}
            disabled={row.disabled}
            to={row.to}
            externalHref={row.externalHref}
            trailing={trailing}
          />
        );
      })}
    </SettingsCabinetList>
  );
}

/** @deprecated Используйте IntegrationsCabinetList */
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

export function SettingsCabinetToggleRow({
  title,
  description,
  checked = false,
  disabled = true,
  soonLabel = 'Скоро',
  className = '',
}: {
  title: string;
  description: string;
  checked?: boolean;
  disabled?: boolean;
  soonLabel?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-4 px-5 py-4 ${className}`.trim()}>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-[#111827]">{title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{description}</p>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <SettingsCabinetSwitch
          checked={checked}
          disabled={disabled}
          onChange={() => undefined}
          aria-label={title}
        />
        {disabled && soonLabel ? (
          <span className="text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">{soonLabel}</span>
        ) : null}
      </div>
    </div>
  );
}

export const SETTINGS_DANGER_ZONE_BG_SRC = '/photos/УДАЛИТЬ/1.png';

export function SettingsDangerZone({
  onDelete,
  disabled = true,
  actionLabel,
  hint = 'Удаление через приложение пока недоступно. Напишите в поддержку.',
  backgroundSrc = SETTINGS_DANGER_ZONE_BG_SRC,
}: {
  onDelete?: () => void;
  disabled?: boolean;
  actionLabel?: string;
  hint?: ReactNode;
  backgroundSrc?: string;
}) {
  const buttonLabel =
    actionLabel ?? (disabled ? 'Скоро' : 'Удалить аккаунт');
  return (
    <div className="relative overflow-hidden rounded-[20px] shadow-[0_8px_32px_rgba(127,29,29,0.18)]">
      <img
        src={backgroundSrc}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#450a0a]/88 via-[#7f1d1d]/82 to-[#991b1b]/78"
        aria-hidden
      />
      <div className="relative z-10 p-5 sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/70">Опасная зона</p>
        <h3 className="mt-1 text-[18px] font-extrabold tracking-[-0.02em] text-white">
          Удаление аккаунта
        </h3>
        <p className="mt-2 text-[14px] leading-relaxed text-white/90">
          Удаление аккаунта необратимо: профиль мастера, записи и настройки будут недоступны.
        </p>
        <div className="mt-2 text-[13px] leading-relaxed text-white/85 [&_a]:text-white [&_a]:underline [&_a]:underline-offset-2">
          {hint}
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={disabled ? undefined : onDelete}
          className="mt-4 min-h-[44px] rounded-[14px] border border-white/40 bg-white/95 px-5 py-2.5 text-[14px] font-bold text-[#991B1B] shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

export function SessionList({ children }: { children: ReactNode }) {
  return <div className="min-w-0">{children}</div>;
}
