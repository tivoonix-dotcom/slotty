/** Capped Pro boost для recommended sort (зеркало SQL catalog_pro_boost_score). */
export const MAX_PRO_BOOST = 10;

export function computeCatalogProBoostScore(input: {
  rating: number;
  reviewsCount: number;
  hasActiveSlot: boolean;
  isVerified: boolean;
  isProEntitled: boolean;
}): number {
  if (!input.isProEntitled || !input.hasActiveSlot) return 0;
  const ratingPart = Math.max(0, input.rating) * 1.5;
  const reviewsPart = Math.min(Math.log(Math.max(input.reviewsCount, 0) + 1), 3);
  const verifiedPart = input.isVerified ? 1 : 0;
  const base = ratingPart + reviewsPart + verifiedPart;
  return Math.min(MAX_PRO_BOOST, Math.max(0, base));
}
