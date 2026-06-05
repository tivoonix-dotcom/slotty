import type { MeNotificationRow } from '../../../features/profile/api/clientNotifications';
import { parseNotificationSummary } from '../../../features/notifications/parseNotificationSummary';
import { formatNotificationPreviewBody } from '../../../features/notifications/formatNotificationPreview';

export type SystemNotificationScenarioId =
  | 'catalog_top_master'
  | 'billing_pro'
  | 'support'
  | 'dispute'
  | 'generic';

export type SystemNotificationStat = {
  label: string;
  value: string;
  accent?: 'pink' | 'green' | 'blue' | 'neutral';
};

export type SystemNotificationDetailModel = {
  scenarioId: SystemNotificationScenarioId;
  narrative: string;
  stats: SystemNotificationStat[];
  perks: string[];
  tips: string[];
  bodyNote?: string | null;
};

const TOP_RATING_THRESHOLD = '4,5';
const TOP_REVIEWS_THRESHOLD = '10';

function titleLower(item: MeNotificationRow): string {
  return item.title.trim().toLowerCase();
}

function formatReviewsRu(count: number): string {
  const n = Math.abs(Math.round(count));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} отзыв`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} отзыва`;
  return `${n} отзывов`;
}

function parseTopMasterStats(body: string): { rating: string | null; reviews: number | null } {
  const m = body.match(/Рейтинг\s+([\d.—]+)★\s+и\s+(\d+)/i);
  if (!m) return { rating: null, reviews: null };
  const reviews = Number(m[2]);
  return {
    rating: m[1]?.trim() || null,
    reviews: Number.isFinite(reviews) ? reviews : null,
  };
}

export function resolveSystemNotificationScenario(item: MeNotificationRow): SystemNotificationScenarioId {
  const title = titleLower(item);

  if (title.includes('топе мастеров') || title.includes('топ мастера')) {
    return 'catalog_top_master';
  }
  if (item.type === 'billing' || title.includes('pro') || title.includes('подписк') || title.includes('тариф')) {
    return 'billing_pro';
  }
  if (
    item.related_entity_type === 'support_ticket' ||
    title.includes('обращен') ||
    title.includes('sup-')
  ) {
    return 'support';
  }
  if (title.includes('проблем') || title.includes('спор') || title.includes('жалоб')) {
    return 'dispute';
  }
  return 'generic';
}

export function buildSystemNotificationDetailModel(
  item: MeNotificationRow,
  cabinetMeta?: { rating: number; reviewsCount: number } | null,
): SystemNotificationDetailModel {
  const scenarioId = resolveSystemNotificationScenario(item);
  const summary = parseNotificationSummary(item);
  const body = item.body.trim();

  if (scenarioId === 'catalog_top_master') {
    const parsed = parseTopMasterStats(body);
    const rating =
      parsed.rating && parsed.rating !== '—'
        ? parsed.rating
        : cabinetMeta && cabinetMeta.rating > 0
          ? cabinetMeta.rating.toFixed(1)
          : null;
    const reviews =
      parsed.reviews ?? (cabinetMeta && cabinetMeta.reviewsCount > 0 ? cabinetMeta.reviewsCount : null);

    const stats: SystemNotificationStat[] = [];
    if (rating) {
      stats.push({ label: 'Рейтинг', value: `${rating}★`, accent: 'green' });
    }
    if (reviews != null) {
      stats.push({ label: 'Отзывы', value: formatReviewsRu(reviews), accent: 'pink' });
    }
    stats.push({ label: 'Размещение', value: 'Блок «Топ мастера»', accent: 'blue' });

    return {
      scenarioId,
      narrative:
        'Поздравляем! Ваш профиль попал в подборку лучших мастеров SLOTTY — клиенты чаще увидят вас в каталоге.',
      stats,
      perks: [
        'Профиль показывается в блоке «Топ мастера» на главной каталога',
        'Больше доверия у новых клиентов — виден рейтинг и отзывы',
        'Дополнительный поток заявок без рекламы',
      ],
      tips: [
        `Поддерживайте рейтинг от ${TOP_RATING_THRESHOLD}★ или соберите ${TOP_REVIEWS_THRESHOLD}+ отзывов`,
        'Отвечайте на отзывы и подтверждайте записи вовремя',
        'Обновите фото и описание профиля — так выше конверсия из каталога',
      ],
      bodyNote: body || null,
    };
  }

  if (scenarioId === 'billing_pro') {
    return {
      scenarioId,
      narrative: body || formatNotificationPreviewBody(item) || item.title,
      stats: summary.map((row) => ({
        label: row.label,
        value: row.value,
        accent: 'neutral' as const,
      })),
      perks: [
        'Управление подпиской и оплатой — в разделе «Тариф и оплата»',
        'Там же история платежей и статус Pro',
      ],
      tips: ['Проверьте актуальный тариф и дату следующего списания'],
      bodyNote: summary.length === 0 ? body : null,
    };
  }

  if (scenarioId === 'support') {
    return {
      scenarioId,
      narrative: body || 'Обновление по вашему обращению в поддержку SLOTTY.',
      stats: summary,
      perks: ['Ответ поддержки сохраняется в разделе обращений'],
      tips: ['Откройте обращение, чтобы увидеть переписку и статус'],
      bodyNote: summary.length === 0 ? body : null,
    };
  }

  if (scenarioId === 'dispute') {
    return {
      scenarioId,
      narrative: body || 'По записи зафиксировано обращение — проверьте детали и свяжитесь с клиентом при необходимости.',
      stats: summary,
      perks: ['Все детали спора доступны в карточке записи'],
      tips: ['Откройте запись и посмотрите историю событий'],
      bodyNote: summary.length === 0 ? body : null,
    };
  }

  return {
    scenarioId: 'generic',
    narrative: formatNotificationPreviewBody(item) || body || item.title,
    stats: summary.map((row) => ({
      label: row.label,
      value: row.value,
      accent: 'neutral' as const,
    })),
    perks: [],
    tips: [],
    bodyNote: summary.length === 0 && body ? body : null,
  };
}

export function isSystemStyleNotification(item: MeNotificationRow): boolean {
  const scenario = resolveSystemNotificationScenario(item);
  return (
    item.type === 'system' ||
    item.type === 'billing' ||
    scenario !== 'generic' ||
    item.related_entity_type === 'master'
  );
}
