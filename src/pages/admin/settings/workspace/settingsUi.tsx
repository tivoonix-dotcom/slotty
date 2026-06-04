import type { ReactNode } from 'react';
import { settingsCardClass, settingsPinkBtn } from './settingsWorkspaceTheme';

export function SettingsSectionCard({
  title,
  description,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${settingsCardClass} p-5 sm:p-6 ${className}`}>
      {title ? <h2 className="text-[17px] font-bold text-[#111827]">{title}</h2> : null}
      {description ? <p className="mt-1 text-[14px] text-[#6B7280]">{description}</p> : null}
      <div className={title || description ? 'mt-4' : ''}>{children}</div>
    </section>
  );
}

export function SettingsFormRow({
  icon,
  title,
  description,
  control,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#F3F4F6] py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {icon ? (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#FFF1F4] text-[#ff5f7a]">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-[#111827]">{title}</p>
          {description ? <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{description}</p> : null}
        </div>
      </div>
      <div className="shrink-0 sm:max-w-[240px] sm:w-full">{control}</div>
    </div>
  );
}

export function SettingsStatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'pink';
  children: ReactNode;
}) {
  const tones = {
    neutral: 'bg-[#F3F4F6] text-[#6B7280]',
    success: 'bg-[#ECFDF5] text-[#059669]',
    warning: 'bg-[#FFFBEB] text-[#B45309]',
    pink: 'bg-[#FFF1F4] text-[#ff5f7a]',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function SettingsStickySaveBar({
  visible,
  onSave,
  onDiscard,
  saving,
}: {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  saving?: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EAECEF] bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_rgba(17,24,39,0.08)] backdrop-blur-sm lg:left-[352px]"
      role="region"
      aria-label="Несохранённые изменения"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[14px] font-medium text-[#6B7280]">Есть несохранённые изменения</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="min-h-[40px] rounded-[12px] px-4 text-[14px] font-semibold text-[#6B7280] hover:bg-[#F3F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff5f7a]/30 disabled:opacity-50"
          >
            Отменить
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onSave}
            className={`min-h-[40px] ${settingsPinkBtn}`}
          >
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SettingsComingSoonBanner({
  badge = 'В разработке',
  title,
  description,
}: {
  badge?: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#EAECEF] bg-white p-6 shadow-[0_4px_24px_rgba(17,24,39,0.05)]">
      <SettingsStatusBadge tone="pink">{badge}</SettingsStatusBadge>
      <h2 className="mt-4 text-[18px] font-bold text-[#111827]">{title}</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">{description}</p>
    </div>
  );
}

export function SettingsEmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-[16px] border border-dashed border-[#EAECEF] bg-[#FAFAFA] px-6 py-10 text-center">
      {icon ? <div className="mb-3 text-[#ff5f7a]">{icon}</div> : null}
      <p className="text-[15px] font-semibold text-[#111827]">{title}</p>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[#6B7280]">{description}</p>
    </div>
  );
}

export function SettingsErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-[16px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-4 text-[14px] text-[#991B1B]">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-2 font-semibold underline">
          Повторить
        </button>
      ) : null}
    </div>
  );
}

export function SettingsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-[12px] bg-[#F3F4F6]" />
      ))}
    </div>
  );
}
