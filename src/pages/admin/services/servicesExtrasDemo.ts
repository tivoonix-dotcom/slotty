import { isoDateLocal } from './servicesFormat';
import type { ManagedService } from './servicesFormat';
import type { ServiceBundle, ServicePromotion } from './servicesTypes';

const DEMO_NOW = isoDateLocal(new Date());

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return isoDateLocal(d);
}

export function demoBundlesForPreview(services: ManagedService[]): ServiceBundle[] {
  const first = services[0];
  const second = services[1] ?? first;
  const p1 = first?.priceByn ?? 55;
  const p2 = second?.priceByn ?? 45;
  const d1 = first?.durationMin ?? 90;
  const d2 = second?.durationMin ?? 60;

  const comboPrice = Math.max(10, Math.round((p1 + p2) * 0.85));
  const original = p1 + p2;

  const primary: ServiceBundle = {
    id: 'preview-bundle-1',
    title:
      first && second
        ? `Пример: ${first.title} + ${second.title}`
        : 'Пример: комбо из двух услуг',
    description: 'Карточка для наглядности — не сохраняется и клиентам не показывается.',
    serviceIds: [first?.id ?? 's1', second?.id ?? 's2'],
    originalPrice: original,
    bundlePrice: comboPrice,
    discountPercent: Math.round(((original - comboPrice) / original) * 100),
    discountAmount: original - comboPrice,
    durationMinutes: d1 + d2,
    imageSource: 'placeholder',
    status: 'visible',
    createdAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
  };

  const secondary: ServiceBundle = {
    id: 'preview-bundle-2',
    title: first ? `Пример: ${first.title}` : 'Пример: набор из одной услуги',
    description: 'Второй пример — иллюстрация интерфейса Pro.',
    serviceIds: [first?.id ?? 's1'],
    originalPrice: p1,
    bundlePrice: Math.max(10, Math.round(p1 * 0.9)),
    discountPercent: 10,
    discountAmount: Math.max(0, p1 - Math.round(p1 * 0.9)),
    durationMinutes: d1,
    imageSource: 'placeholder',
    status: 'draft',
    createdAt: DEMO_NOW,
    updatedAt: DEMO_NOW,
  };

  return [primary, secondary];
}

export function demoPromotionsForPreview(services: ManagedService[]): ServicePromotion[] {
  const svc = services[0];
  const serviceId = svc?.id ?? 'preview-service';
  const serviceTitle = svc?.title ?? 'Маникюр с покрытием';

  return [
    {
      id: 'preview-promo-1',
      template: 'first_visit',
      title: 'Пример: скидка на первый визит',
      description: 'Так будет выглядеть баннер в каталоге — текст и скидку задаёте вы.',
      serviceId,
      serviceTitle: serviceTitle ? `Пример услуги: ${serviceTitle}` : 'Пример услуги из каталога',
      discountType: 'percent',
      discountValue: 15,
      discountLabel: '-15%',
      startsAt: DEMO_NOW,
      endsAt: addDays(DEMO_NOW, 30),
      status: 'active',
      backgroundImage: '/photos/sale/11.webp',
      createdAt: DEMO_NOW,
    },
    {
      id: 'preview-promo-2',
      template: 'happy_hours',
      title: 'Пример: счастливые часы',
      description: 'Второй баннер — иллюстрация, клиентам не показывается.',
      serviceId,
      serviceTitle: 'Сроки и услугу выберете при создании',
      discountType: 'money',
      discountValue: 10,
      discountLabel: '-10 BYN',
      startsAt: addDays(DEMO_NOW, 7),
      endsAt: addDays(DEMO_NOW, 45),
      status: 'scheduled',
      backgroundImage: '/photos/sale/22.webp',
      createdAt: DEMO_NOW,
    },
  ];
}
