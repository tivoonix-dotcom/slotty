export type PaymentMethodId = 'bepaid' | 'erip' | 'visa' | 'mastercard' | 'belkart';

/** Логотипы платёжных систем в `public/photos/pay/` (генерация: `node scripts/generate-payment-logos.mjs`). */
export const PAYMENT_PHOTO_ASSETS = {
  bepaid: '/photos/pay/bepaid.webp',
  erip: '/photos/pay/erip.webp',
  visa: '/photos/pay/visa.webp',
  mastercard: '/photos/pay/mastercard.webp',
  belkart: '/photos/pay/belkart.webp',
} as const;

export type PaymentMethodConfig = {
  id: PaymentMethodId;
  label: string;
  caption: string;
  src: string;
};

export function paymentLogoImageClass(_id: PaymentMethodId): string {
  return 'block max-h-full max-w-full object-contain object-center';
}

/** Компактная строка (футер, блоки доверия). */
export function paymentLogoCompactHeightClass(id: PaymentMethodId): string {
  switch (id) {
    case 'visa':
      return 'h-7 w-auto max-w-[3.25rem] sm:h-8 sm:max-w-[3.75rem]';
    case 'mastercard':
      return 'h-6 w-auto max-w-[2.75rem] sm:h-7 sm:max-w-[3.25rem]';
    case 'bepaid':
      return 'h-6 w-auto max-w-[4.5rem] sm:h-7 sm:max-w-[5.25rem]';
    case 'belkart':
      return 'h-6 w-auto max-w-[5rem] sm:h-7 sm:max-w-[5.75rem]';
    case 'erip':
      return 'h-6 w-auto max-w-[4.25rem] sm:h-7 sm:max-w-[5rem]';
    default:
      return 'h-6 w-auto max-w-[4.25rem] sm:h-7 sm:max-w-[5rem]';
  }
}

/** Высота логотипа в карточке / ленте (`object-contain`). */
export function paymentLogoHeightClass(id: PaymentMethodId): string {
  switch (id) {
    case 'visa':
      return 'h-10 w-auto max-w-[5.5rem] sm:h-11 sm:max-w-[6.25rem]';
    case 'mastercard':
      return 'h-10 w-auto max-w-[4.5rem] sm:h-11 sm:max-w-[5.25rem]';
    case 'bepaid':
      return 'h-9 w-auto max-w-[7.5rem] sm:h-10 sm:max-w-[8.5rem]';
    case 'belkart':
      return 'h-9 w-auto max-w-[8rem] sm:h-10 sm:max-w-[9rem]';
    case 'erip':
      return 'h-8 w-auto max-w-[7rem] sm:h-9 sm:max-w-[8rem]';
    default:
      return 'h-9 w-auto max-w-[7.5rem] sm:h-10 sm:max-w-[8.5rem]';
  }
}

export const PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'bepaid',
    label: 'bePaid',
    caption: 'Платёжный провайдер',
    src: PAYMENT_PHOTO_ASSETS.bepaid,
  },
  {
    id: 'erip',
    label: 'ЕРИП',
    caption: 'Оплата через ЕРИП',
    src: PAYMENT_PHOTO_ASSETS.erip,
  },
  {
    id: 'visa',
    label: 'Visa',
    caption: 'Банковские карты',
    src: PAYMENT_PHOTO_ASSETS.visa,
  },
  {
    id: 'mastercard',
    label: 'Mastercard',
    caption: 'Банковские карты',
    src: PAYMENT_PHOTO_ASSETS.mastercard,
  },
  {
    id: 'belkart',
    label: 'Белкарт',
    caption: 'Карты Беларуси',
    src: PAYMENT_PHOTO_ASSETS.belkart,
  },
];

export const PAYMENT_DISCLAIMER_DEFAULT =
  'Планируемые способы оплаты. Онлайн-оплата на сайте появится после подключения платёжного провайдера. Финальный список будет указан при оформлении.';

/** Страница `/legal/payment` — bePaid подключён. */
export const PAYMENT_DISCLAIMER_LEGAL_PAGE =
  'Оплата проходит через bePaid. Точный список способов оплаты отображается при оформлении заказа или подписки.';

export const PAYMENT_DISCLAIMER_SHORT =
  'Планируемые способы оплаты. Доступные методы будут показаны при оформлении после подключения провайдера.';
