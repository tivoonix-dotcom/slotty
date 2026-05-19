import { query } from '../../config/db.js';
import { notifyUser } from '../notifications/notifyUser.js';

/** Критерии блока «Топ мастера» в клиентском каталоге. */
const TOP_RATING = 4.5;
const TOP_REVIEWS = 10;

export function isCatalogTopMaster(rating: number, reviewsCount: number): boolean {
  return rating >= TOP_RATING || reviewsCount >= TOP_REVIEWS;
}

/** Один раз сообщить мастеру, что профиль попал в «Топ мастера». */
export async function notifyMasterEnteredTopIfNeeded(masterId: string): Promise<void> {
  const stats = await query<{ avg: string; cnt: string }>(
    `select coalesce(avg(rating)::numeric(3,2), 0)::text as avg, count(*)::text as cnt
       from public.reviews
      where master_id = $1 and status = 'published'::public.review_status`,
    [masterId],
  );
  const rating = Number(stats.rows[0]?.avg ?? 0);
  const reviewsCount = Number(stats.rows[0]?.cnt ?? 0);
  if (!isCatalogTopMaster(rating, reviewsCount)) return;

  const sent = await query(
    `select 1 from public.notifications
      where user_id = $1 and type = 'system'::public.notification_type and title = 'Вы в топе мастеров'
      limit 1`,
    [masterId],
  );
  if (sent.rowCount) return;

  const ratingLabel = rating > 0 ? rating.toFixed(1) : '—';

  await notifyUser({
    userId: masterId,
    type: 'system',
    title: 'Вы в топе мастеров',
    body: `Рейтинг ${ratingLabel}★ и ${reviewsCount} отзывов — ваш профиль показывается в блоке «Топ мастера» в каталоге SLOTTY.`,
    relatedEntityType: 'master',
    relatedEntityId: masterId,
    telegramHtml:
      `<b>Вы в топе мастеров</b>\n` +
      `Рейтинг ${ratingLabel}★, отзывов: ${reviewsCount}.\n` +
      `Профиль попадает в блок «Топ мастера» в каталоге SLOTTY.`,
  });
}
