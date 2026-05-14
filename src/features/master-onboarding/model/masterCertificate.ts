/**
 * Сертификаты / курсы в анкете мастера (шаг онбординга).
 * В API и БД поле организации передаётся как `issuer`.
 */

export type MasterCertificate = {
  id: string;
  title: string;
  organization: string;
  year?: string;
  description?: string;
  /** Локальный blob: URL или https-ссылка на фото */
  imageUrl?: string;
};

/** Форма добавления/редактирования (локальное состояние экрана). */
export type CertificateFormState = {
  title: string;
  organization: string;
  year: string;
  description: string;
  imageBlobUrl?: string;
  imageFileLabel?: string;
  externalPhotoUrl: string;
};

export const emptyCertificateFormState = (): CertificateFormState => ({
  title: '',
  organization: '',
  year: '',
  description: '',
  externalPhotoUrl: '',
});

/** Допустимая ссылка на фото для сохранения на сервере (только https). */
export function parseHttpsCertificateImageUrl(raw: string): string | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  try {
    const u = new URL(t);
    if (u.protocol !== 'https:') return undefined;
    return u.toString();
  } catch {
    return undefined;
  }
}
