/** Пороги рейтинга: 5 — зелёный, ~4 — жёлтый, 2 и ниже — красный. */
export type RatingTone = 'excellent' | 'good' | 'poor' | 'empty';

export function ratingToneFromValue(rating: number | null | undefined): RatingTone {
  if (rating == null || !Number.isFinite(rating) || rating <= 0) return 'empty';
  if (rating >= 4.5) return 'excellent';
  if (rating >= 2.5) return 'good';
  return 'poor';
}

export function ratingQualityLabel(tone: RatingTone): string | null {
  if (tone === 'excellent') return 'Отлично';
  if (tone === 'good') return 'Нормально';
  if (tone === 'poor') return 'Нужно внимание';
  return null;
}

export const ratingToneUi = {
  excellent: {
    stars: 'text-[#10B981]',
    value: 'text-[#059669]',
    badge: 'bg-[#ECFDF5] text-[#059669] ring-1 ring-[#A7F3D0]',
    chartStroke: '#10B981',
    chartFillTop: 'rgba(16, 185, 129, 0.32)',
    chartFillMid: 'rgba(16, 185, 129, 0.10)',
    chartBg: 'from-[#ECFDF5] to-white',
    dot: 'bg-[#10B981]',
  },
  good: {
    stars: 'text-[#F59E0B]',
    value: 'text-[#D97706]',
    badge: 'bg-[#FFFBEB] text-[#D97706] ring-1 ring-[#FDE68A]',
    chartStroke: '#F59E0B',
    chartFillTop: 'rgba(245, 158, 11, 0.28)',
    chartFillMid: 'rgba(245, 158, 11, 0.08)',
    chartBg: 'from-[#FFFBEB] to-white',
    dot: 'bg-[#F59E0B]',
  },
  poor: {
    stars: 'text-[#EF4444]',
    value: 'text-[#DC2626]',
    badge: 'bg-[#FEF2F2] text-[#DC2626] ring-1 ring-[#FECACA]',
    chartStroke: '#EF4444',
    chartFillTop: 'rgba(239, 68, 68, 0.22)',
    chartFillMid: 'rgba(239, 68, 68, 0.06)',
    chartBg: 'from-[#FEF2F2] to-white',
    dot: 'bg-[#EF4444]',
  },
  empty: {
    stars: 'text-[#D1D5DB]',
    value: 'text-[#9CA3AF]',
    badge: 'bg-[#F3F4F6] text-[#6B7280] ring-1 ring-[#E5E7EB]',
    chartStroke: '#F47C8C',
    chartFillTop: 'rgba(244, 124, 140, 0.35)',
    chartFillMid: 'rgba(249, 168, 180, 0.12)',
    chartBg: 'from-[#FFF5F7] to-white',
    dot: 'bg-[#D1D5DB]',
  },
} as const satisfies Record<RatingTone, Record<string, string>>;
