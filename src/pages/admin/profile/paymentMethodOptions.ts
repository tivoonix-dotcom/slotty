export const PAYMENT_OPTIONS = ['Наличные', 'Карта', 'Перевод', 'Онлайн позже'] as const;

export type PaymentOption = (typeof PAYMENT_OPTIONS)[number];
