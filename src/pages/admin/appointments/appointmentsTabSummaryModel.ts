import type { AppointmentsTabId } from './appointmentsTypes';

export type AppointmentsTabStats = {
  requests: number;
  upcoming: number;
  history: number;
};

export type TabSummaryCopy = {
  title: string;
  subtitle: string;
  badge?: string;
};

export function tabSummaryCopy(tab: AppointmentsTabId, stats: AppointmentsTabStats): TabSummaryCopy {
  if (tab === 'requests') {
    const count = stats.requests;
    return {
      title: count === 1 ? 'Новая заявка: 1' : `Новые заявки: ${count}`,
      subtitle:
        count === 0
          ? 'Когда клиент отправит заявку, она появится в списке ниже'
          : 'Подтвердите или отклоните — клиент сразу увидит статус',
      badge: count > 0 ? String(count) : undefined,
    };
  }

  if (tab === 'upcoming') {
    const count = stats.upcoming;
    return {
      title: count === 1 ? 'Предстоящая запись: 1' : `Предстоящие записи: ${count}`,
      subtitle:
        count === 0
          ? 'Подтверждённые записи появятся здесь после принятия заявки'
          : 'Откройте карточку для деталей и действий по визиту',
      badge: count > 0 ? String(count) : undefined,
    };
  }

  const count = stats.history;
  return {
    title: count === 1 ? 'Запись в истории: 1' : `История: ${count} ${pluralRecords(count)}`,
    subtitle:
      count === 0
        ? 'Завершённые и отменённые визиты появятся здесь'
        : 'Завершено и отменено — используйте фильтры ниже',
    badge: count > 0 ? String(count) : undefined,
  };
}

export function listLoadErrorTitle(tab: AppointmentsTabId): string {
  if (tab === 'requests') return 'Не удалось загрузить заявки';
  if (tab === 'upcoming') return 'Не удалось загрузить записи';
  return 'Не удалось загрузить историю';
}

function pluralRecords(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'запись';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'записи';
  return 'записей';
}
