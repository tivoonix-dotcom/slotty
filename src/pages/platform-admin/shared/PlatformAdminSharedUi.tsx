import type { ReactNode } from 'react';
import { ConfirmModal } from '../../../shared/ui/ConfirmModal';
import { paCard, paPrimaryBtn } from '../platformAdminTheme';

export { ConfirmModal };

export function PlatformAdminLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${paCard} h-24 animate-pulse bg-[#f3f4f6]`} />
      ))}
    </div>
  );
}

export function PlatformAdminEmpty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <section className={`${paCard} flex flex-col items-center px-6 py-12 text-center`}>
      <h3 className="text-[18px] font-bold text-[#111827]">{title}</h3>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-[#6B7280]">{text}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}

export function PlatformAdminError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <section className={`${paCard} px-6 py-10 text-center`}>
      <h3 className="text-[18px] font-bold text-[#111827]">Не удалось загрузить данные</h3>
      <p className="mt-2 text-[15px] text-[#6B7280]">{message}</p>
      {onRetry ? (
        <button type="button" className={`${paPrimaryBtn} mt-5`} onClick={onRetry}>
          Повторить
        </button>
      ) : null}
    </section>
  );
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'На проверке',
  approved: 'Одобрено',
  rejected: 'Отклонено',
  active: 'Активен',
  blocked: 'Заблокирован',
  restricted: 'Ограничен',
  client: 'Клиент',
  master: 'Мастер',
  platform_admin: 'Админ',
  published: 'В каталоге',
  hidden: 'Скрыт',
  paused: 'Пауза',
  draft: 'Черновик',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  cancelled_by_client: 'Отмена клиентом',
  cancelled_by_master: 'Отмена мастером',
  no_show: 'Неявка',
  in_review: 'В работе',
  closed: 'Закрыта',
  cancelled: 'Отменён',
  deleted: 'Удалён',
};

const SPONSOR_STATUS_LABELS: Record<string, string> = {
  pending: 'Новая',
  in_review: 'В работе',
  closed: 'Закрыта',
  rejected: 'Отклонена',
};

const SPONSOR_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  in_review: 'bg-sky-50 text-sky-800',
  closed: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-rose-50 text-rose-800',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-800',
  approved: 'bg-emerald-50 text-emerald-800',
  rejected: 'bg-rose-50 text-rose-800',
  active: 'bg-emerald-50 text-emerald-800',
  blocked: 'bg-rose-50 text-rose-800',
  restricted: 'bg-orange-50 text-orange-800',
  client: 'bg-sky-50 text-sky-800',
  master: 'bg-violet-50 text-violet-800',
  platform_admin: 'bg-slate-800 text-white',
  published: 'bg-emerald-50 text-emerald-800',
  hidden: 'bg-slate-100 text-slate-700',
  paused: 'bg-violet-50 text-violet-800',
  confirmed: 'bg-sky-50 text-sky-800',
  completed: 'bg-emerald-50 text-emerald-800',
  cancelled_by_client: 'bg-rose-50 text-rose-800',
  cancelled_by_master: 'bg-rose-50 text-rose-800',
  no_show: 'bg-orange-50 text-orange-800',
  cancelled: 'bg-slate-100 text-slate-600',
  deleted: 'bg-slate-200 text-slate-800',
};

export function StatusBadge({ status }: { status: string }) {
  const label = STATUS_LABELS[status] ?? status;
  const color = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${color}`}>
      {label}
    </span>
  );
}

export function SponsorStatusBadge({ status }: { status: string }) {
  const label = SPONSOR_STATUS_LABELS[status] ?? status;
  const color = SPONSOR_STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold ${color}`}>
      {label}
    </span>
  );
}

export function PlatformAdminCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <article className={`${paCard} p-5 ${className}`.trim()}>{children}</article>;
}

