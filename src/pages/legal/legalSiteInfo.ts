import { SUPPORT_EMAIL, SUPPORT_TELEGRAM } from '../../constants/support';
import { SEO_SITE_ORIGIN } from '../../shared/seo/seoSite';

/**
 * Реквизиты оператора персональных данных (РБ).
 * Заполните константы ниже — без них в документах остаётся обобщённая формулировка про SLOTTY.
 */
export const OPERATOR_LEGAL_NAME: string | null = null;
/** УНП (10 цифр) */
export const OPERATOR_UNP: string | null = null;
/** Юридический адрес (как в регистрации) */
export const OPERATOR_LEGAL_ADDRESS: string | null = null;
/** ФИО ответственного за обработку ПД (если отличается от ИП) */
export const OPERATOR_PD_CONTACT_PERSON: string | null = null;

export const SITE_BRAND_NAME = 'SLOTTY';
export const SITE_PUBLIC_URL = SEO_SITE_ORIGIN;

/** Почта для обращений по вопросам ПД и сервиса. */
export const SITE_SUPPORT_EMAIL = SUPPORT_EMAIL;

export const SITE_SUPPORT_TELEGRAM = SUPPORT_TELEGRAM;

/** Ссылки на актуальные тексты на сайте (вместо устаревших PDF с tivonix.tech). */
export const PD_POLICY_WEB_HREF = '/legal/privacy';
export const PD_CONSENT_WEB_HREF = '/legal/consent';

/** @deprecated Используйте PD_POLICY_WEB_HREF */
export const PD_POLICY_PDF_HREF = PD_POLICY_WEB_HREF;

/** @deprecated Используйте PD_CONSENT_WEB_HREF */
export const PD_CONSENT_PDF_HREF = PD_CONSENT_WEB_HREF;

function hasFullOperatorRequisites(): boolean {
  return Boolean(
    OPERATOR_LEGAL_NAME?.trim() &&
      OPERATOR_UNP?.trim() &&
      OPERATOR_LEGAL_ADDRESS?.trim(),
  );
}

/** Оператор ПД для вставки в согласия и политики. */
export function formatSiteOperatorLegal(): string {
  if (hasFullOperatorRequisites()) {
    const person = OPERATOR_PD_CONTACT_PERSON?.trim();
    const contactSuffix = person ? `, ответственный за обработку ПД: ${person}` : '';
    return (
      `${OPERATOR_LEGAL_NAME!.trim()}, УНП ${OPERATOR_UNP!.trim()}, ` +
      `юридический адрес: ${OPERATOR_LEGAL_ADDRESS!.trim()}${contactSuffix} ` +
      `(оператор интернет-сервиса ${SITE_BRAND_NAME}, ${SITE_PUBLIC_URL})`
    );
  }
  return (
    `Владелец интернет-сервиса онлайн-записи ${SITE_BRAND_NAME} (${SITE_PUBLIC_URL}) ` +
    `— оператор персональных данных в отношении пользователей сервиса ${SITE_BRAND_NAME}`
  );
}

/** @deprecated Используйте formatSiteOperatorLegal() */
export const SITE_OPERATOR_LEGAL = formatSiteOperatorLegal();

/** Фон блока «Оплата и возвраты» на юридических страницах. */
export const PAYMENT_LEGAL_TRUST_BLOCK_BG =
  `/photos/${encodeURIComponent('возрат')}/${encodeURIComponent('1.png')}`;

/** Hero страницы политики конфиденциальности. */
export const PRIVACY_LEGAL_HERO_BG =
  `/photos/${encodeURIComponent('конфиденицальность')}/${encodeURIComponent('1.png')}`;

/** Hero страницы пользовательского соглашения. */
export const TERMS_LEGAL_HERO_BG =
  `/photos/${encodeURIComponent('контракт')}/${encodeURIComponent('1.png')}`;
