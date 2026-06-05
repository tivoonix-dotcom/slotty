import { addDays } from '../../../features/booking/lib/calendar';
import {
  isoDateLocal,
  listIsoDatesInclusive,
  OVERVIEW_MAX_RANGE_DAYS,
} from '../../../features/master/model/demoMasterAppointments';
import { overviewChartWindow, previousOverviewReportPeriod } from './overviewFormat';

const REVIEWS_STORAGE_KEY = 'slotty_overview_master_reviews_v1';
const REPLIES_STORAGE_KEY = 'slotty_overview_review_replies_v1';

export type MasterOverviewReview = {
  id: string;
  author: string;
  authorInitial: string;
  authorAvatarUrl?: string | null;
  dateIso: string;
  rating: number;
  text: string;
  masterReply: string | null;
  replyAtIso: string | null;
};

export type RatingDayStat = {
  date: string;
  averageRating: number;
};

type StoredReply = { text: string; atIso: string };

function readReplies(): Record<string, StoredReply> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(REPLIES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, StoredReply>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeReplies(map: Record<string, StoredReply>) {
  window.localStorage.setItem(REPLIES_STORAGE_KEY, JSON.stringify(map));
}

function mergeReplies(rows: MasterOverviewReview[]): MasterOverviewReview[] {
  const replies = readReplies();
  return rows.map((r) => {
    const saved = replies[r.id];
    if (!saved?.text) return r;
    return { ...r, masterReply: saved.text, replyAtIso: saved.atIso };
  });
}

function createSeedReviews(): MasterOverviewReview[] {
  const end = new Date();
  const authors = [
    'Анна',
    'Мария',
    'Екатерина',
    'Даша',
    'Алина',
    'Ольга',
    'Вика',
    'Катя',
    'Настя',
    'Ирина',
    'София',
    'Полина',
    'Юля',
    'Лена',
    'Таня',
    'Кристина',
    'Алёна',
    'Вера',
    'Зоя',
    'Мила',
    'Рита',
    'Света',
    'Нина',
    'Диана',
  ];
  const texts = [
    'Все супер! Очень аккуратно и красиво. Спасибо большое! ❤️',
    'Удобная запись, мастер сразу подтвердила время.',
    'Приятная атмосфера и отличный результат.',
    'Все понравилось, особенно напоминание перед записью.',
    'Очень аккуратно, быстро и красиво. Обязательно вернусь.',
    'Мастер внимательная, результат держится отлично.',
    'Классный сервис, записалась без проблем.',
    'Спасибо за аккуратную работу!',
    'Всё на высоте, рекомендую.',
    'Очень довольна, вернусь снова.',
  ];

  const rows: MasterOverviewReview[] = authors.map((author, i) => {
    const daysAgo = Math.max(0, 58 - i * 2 - (i % 3));
    const date = addDays(end, -daysAgo);
    const rating = 4.5 + ((i * 7) % 6) * 0.1;
    return {
      id: `overview-rev-${i + 1}`,
      author,
      authorInitial: author.charAt(0),
      dateIso: isoDateLocal(date),
      rating: Math.min(5, Math.round(rating * 10) / 10),
      text: texts[i % texts.length]!,
      masterReply: null,
      replyAtIso: null,
    };
  });

  const anna = rows.find((r) => r.author === 'Анна');
  if (anna) {
    anna.dateIso = isoDateLocal(addDays(end, -6));
    anna.rating = 5;
    anna.text = 'Все супер! Очень аккуратно и красиво. Спасибо большое! ❤️';
  }

  const secondLatest = rows.find((r) => r.author === 'Мария');
  if (secondLatest) {
    secondLatest.masterReply = 'Спасибо за тёплые слова! Буду рада видеть снова 💗';
    secondLatest.replyAtIso = isoDateLocal(addDays(end, -4));
  }

  return rows;
}

function readSeedReviews(): MasterOverviewReview[] {
  if (typeof window === 'undefined') return createSeedReviews();
  try {
    const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) {
      const seed = createSeedReviews();
      window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as MasterOverviewReview[];
    if (!Array.isArray(parsed) || !parsed.length) return mergeReplies(createSeedReviews());
    return mergeReplies(parsed);
  } catch {
    return mergeReplies(createSeedReviews());
  }
}

export function loadMasterReviews(): MasterOverviewReview[] {
  return readSeedReviews().sort((a, b) => b.dateIso.localeCompare(a.dateIso));
}

/** Ответ возможен только один раз на отзыв. */
export function trySaveMasterReviewReply(
  reviewId: string,
  text: string,
): { ok: true } | { ok: false; reason: 'already_replied' | 'empty' | 'not_found' } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };

  const reviews = readSeedReviews();
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) return { ok: false, reason: 'not_found' };
  if (review.masterReply) return { ok: false, reason: 'already_replied' };

  const replies = readReplies();
  if (replies[reviewId]?.text) return { ok: false, reason: 'already_replied' };

  replies[reviewId] = { text: trimmed, atIso: isoDateLocal(new Date()) };
  writeReplies(replies);
  return { ok: true };
}

function reviewsInRange(reviews: MasterOverviewReview[], start: string, end: string) {
  return reviews.filter((r) => r.dateIso >= start && r.dateIso <= end);
}

function averageRating(reviews: MasterOverviewReview[]): number | null {
  if (!reviews.length) return null;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function ratingDailyAverages(reviews: MasterOverviewReview[]): RatingDayStat[] {
  const ratingsByDate = new Map<string, number[]>();
  for (const r of reviews) {
    const list = ratingsByDate.get(r.dateIso) ?? [];
    list.push(r.rating);
    ratingsByDate.set(r.dateIso, list);
  }
  return [...ratingsByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ratings]) => {
      const avg = ratings.reduce((s, n) => s + n, 0) / ratings.length;
      return { date, averageRating: Math.round(avg * 10) / 10 };
    });
}

function ratingSeriesByDay(
  reviews: MasterOverviewReview[],
  chartStart: string,
  chartEnd: string,
): RatingDayStat[] {
  const inWindow = reviews.filter((r) => r.dateIso >= chartStart && r.dateIso <= chartEnd);
  const source = inWindow.length > 0 ? inWindow : reviews;

  if (source.length <= 6) {
    return ratingDailyAverages(source);
  }

  const dates = listIsoDatesInclusive(chartStart, chartEnd);
  const ratingsByDate = new Map<string, number[]>();
  for (const r of source) {
    const list = ratingsByDate.get(r.dateIso) ?? [];
    list.push(r.rating);
    ratingsByDate.set(r.dateIso, list);
  }

  const series: RatingDayStat[] = [];
  for (const date of dates) {
    const dayRatings = ratingsByDate.get(date);
    if (!dayRatings?.length) continue;
    const avg = dayRatings.reduce((s, n) => s + n, 0) / dayRatings.length;
    series.push({ date, averageRating: Math.round(avg * 10) / 10 });
  }

  return series.length > 0 ? series : ratingDailyAverages(source);
}

export type ReputationAnalyticsPayload = {
  hasReviews: boolean;
  averageRating: number | null;
  reviewsCount: number;
  newReviewsInPeriod: number;
  unansweredReviews: number;
  ratingTrend: 'up' | 'down' | 'flat' | null;
  ratingDelta: number | null;
  ratingTrendPercent: number | null;
  totalReviewsDelta: number;
  newReviewsDelta: number;
  ratingByDay: RatingDayStat[];
  chartIsTruncated: boolean;
  reviews: MasterOverviewReview[];
  latestReview: MasterOverviewReview | null;
  unansweredList: MasterOverviewReview[];
};

export function computeReputationFromReviews(
  start: string,
  end: string,
): ReputationAnalyticsPayload {
  const all = loadMasterReviews();
  const hasReviews = all.length > 0;
  const inPeriod = reviewsInRange(all, start, end);
  const averageAll = averageRating(all);
  const unansweredList = all.filter((r) => !r.masterReply);
  const latestReview = all[0] ?? null;

  const prev = previousOverviewReportPeriod(start, end);
  const prevPeriod = prev ? reviewsInRange(all, prev.start, prev.end) : [];
  const totalReviewsDelta = inPeriod.length - prevPeriod.length;
  const newReviewsDelta = totalReviewsDelta;

  const avgNow = averageRating(inPeriod.length ? inPeriod : all);
  const avgPrev = prev ? averageRating(prevPeriod) : null;
  let ratingDelta: number | null = null;
  let ratingTrendPercent: number | null = null;
  let ratingTrend: 'up' | 'down' | 'flat' | null = null;

  if (avgNow !== null && avgPrev !== null) {
    ratingDelta = Math.round((avgNow - avgPrev) * 10) / 10;
    if (ratingDelta > 0.05) ratingTrend = 'up';
    else if (ratingDelta < -0.05) ratingTrend = 'down';
    else ratingTrend = 'flat';
    if (avgPrev > 0) {
      ratingTrendPercent = Math.round(((avgNow - avgPrev) / avgPrev) * 100);
    }
  }

  const chartRange = overviewChartWindow(start, end, OVERVIEW_MAX_RANGE_DAYS);
  const ratingByDay = ratingSeriesByDay(all, chartRange.chartStart, chartRange.chartEnd);

  return {
    hasReviews,
    averageRating: averageAll,
    reviewsCount: all.length,
    newReviewsInPeriod: inPeriod.length,
    unansweredReviews: unansweredList.length,
    ratingTrend,
    ratingDelta,
    ratingTrendPercent,
    totalReviewsDelta,
    newReviewsDelta,
    ratingByDay,
    chartIsTruncated: chartRange.chartStart > start,
    reviews: all,
    latestReview,
    unansweredList,
  };
}
