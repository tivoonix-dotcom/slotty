import { referencePhotoPinterestUrl } from '../booking/lib/referencePhotoCategories';
import {
  getCategoryWorkPhotoUrl,
  resolveCategoryWorkCode,
} from './categoryWorkPhotos';

/** Готовое фото из `public/photos/catalog-services/` для категории мастера. */
export function getServiceCoverStockPhotoUrl(
  categoryCode?: string | null,
  categoryLabel?: string | null,
): string {
  const code = resolveCategoryWorkCode(categoryCode ?? categoryLabel);
  return getCategoryWorkPhotoUrl(code);
}

export function serviceCoverPinterestUrl(
  categoryCode?: string | null,
  categoryLabel?: string | null,
): string {
  const code = resolveCategoryWorkCode(categoryCode ?? categoryLabel);
  return referencePhotoPinterestUrl(code) ?? 'https://www.pinterest.com/search/pins/?q=beauty%20service%20photo';
}

/** Загружает stock-фото с сайта в storage (для API нужен абсолютный URL). */
export async function uploadServiceCoverStockPhoto(stockPath: string): Promise<string> {
  const { uploadMasterPortfolioImageFile } = await import('../admin/api/masterCabinetApi');
  const res = await fetch(stockPath);
  if (!res.ok) throw new Error('Не удалось загрузить готовое фото');
  const blob = await res.blob();
  const ext = stockPath.endsWith('.png') ? 'png' : 'webp';
  const file = new File([blob], `service-cover.${ext}`, { type: blob.type || `image/${ext}` });
  return uploadMasterPortfolioImageFile(file);
}
