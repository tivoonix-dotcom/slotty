/** Единые формулировки про подписку «Мастер Pro» в кабинете мастера. */

export const MASTER_PRO_PLAN_NAME = 'Мастер Pro';

export const PRO_REQUIRED_USER_MESSAGE =
  'Функция доступна по подписке «Мастер Pro». Подключите тариф в разделе «Тарифы».';

const LEGACY_PRO_REQUIRED_SNIPPETS = [
  'Акции и наборы доступны на тарифе Pro',
  'Наборы услуг и акции доступны',
  'тарифе Pro',
] as const;

export function isProRequiredApiMessage(message: string): boolean {
  const m = message.trim();
  if (!m) return false;
  if (m.includes('PRO_REQUIRED')) return true;
  if (m.includes('SUBSCRIPTION_EXPIRED')) return true;
  if (m.includes(MASTER_PRO_PLAN_NAME)) return true;
  return LEGACY_PRO_REQUIRED_SNIPPETS.some((s) => m.includes(s));
}

export type MasterProUpsellVariant = 'analytics' | 'bundles' | 'promotions';

export type MasterProUpsellCopy = {
  title: string;
  lead: string;
  cta: string;
};

export function masterProUpsellCopy(variant: MasterProUpsellVariant): MasterProUpsellCopy {
  switch (variant) {
    case 'analytics':
      return {
        title: 'Доход и сводка',
        lead: `Графики дохода и KPI за период входят в подписку «${MASTER_PRO_PLAN_NAME}». Разделы «Клиенты» и «Репутация» доступны на Free.`,
        cta: 'Перейти к тарифам',
      };
    case 'bundles':
      return {
        title: 'Наборы услуг',
        lead: `Объединяйте несколько услуг в одно предложение со скидкой. Функция входит в подписку «${MASTER_PRO_PLAN_NAME}».`,
        cta: 'Перейти к тарифам',
      };
    case 'promotions':
      return {
        title: 'Акции и скидки',
        lead: `Публикуйте скидки с датами — баннеры появятся в каталоге и при записи. Функция входит в подписку «${MASTER_PRO_PLAN_NAME}».`,
        cta: 'Перейти к тарифам',
      };
    default:
      return masterProUpsellCopy('analytics');
  }
}

/** @deprecated используйте masterProUpsellCopy */
export type ServicesProUpsellVariant = Extract<MasterProUpsellVariant, 'bundles' | 'promotions'>;

/** @deprecated используйте masterProUpsellCopy */
export function servicesProUpsellCopy(variant: ServicesProUpsellVariant) {
  const base = masterProUpsellCopy(variant);
  if (variant === 'bundles') {
    return {
      ...base,
      exampleTitle: 'Пример набора',
      exampleNote: 'Ниже — один пример карточки. С Pro вы создадите свои наборы.',
      fabLabel: 'Подключить Pro',
    };
  }
  return {
    ...base,
    exampleTitle: 'Пример акции',
    exampleNote: 'Ниже — один пример баннера. С Pro вы создадите свои акции.',
    fabLabel: 'Подключить Pro',
  };
}
