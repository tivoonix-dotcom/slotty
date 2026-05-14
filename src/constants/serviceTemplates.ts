/**
 * Шаблоны услуг для онбординга мастера (по коду категории из каталога).
 * priceType: exact — фиксированная цена (в форме → fixed), from — «от».
 */

export type ServiceCategorySlug = 'manicure' | 'barbers' | 'brows-lashes' | 'massage' | 'fitness' | 'tattoo';

export type TemplatePriceType = 'exact' | 'from';

export type ServiceTemplate = {
  id: string;
  category: ServiceCategorySlug;
  title: string;
  durationMinutes: number;
  price: number;
  priceType: TemplatePriceType;
  description?: string;
};

const M: ServiceCategorySlug = 'manicure';
const B: ServiceCategorySlug = 'barbers';
const BL: ServiceCategorySlug = 'brows-lashes';
const MS: ServiceCategorySlug = 'massage';
const F: ServiceCategorySlug = 'fitness';
const T: ServiceCategorySlug = 'tattoo';

export const SERVICE_TEMPLATES_BY_CATEGORY: Record<ServiceCategorySlug, ServiceTemplate[]> = {
  [M]: [
    { id: 'm-1', category: M, title: 'Маникюр без покрытия', durationMinutes: 60, price: 30, priceType: 'exact', description: 'Классический уход за ногтями без покрытия' },
    { id: 'm-2', category: M, title: 'Маникюр с покрытием', durationMinutes: 90, price: 45, priceType: 'exact', description: 'Маникюр с покрытием гель-лаком' },
    { id: 'm-3', category: M, title: 'Снятие покрытия', durationMinutes: 30, price: 15, priceType: 'exact', description: 'Аккуратное снятие старого покрытия' },
    { id: 'm-4', category: M, title: 'Маникюр с укреплением', durationMinutes: 110, price: 55, priceType: 'from', description: 'Маникюр с укреплением ногтевой пластины' },
    { id: 'm-5', category: M, title: 'Наращивание ногтей', durationMinutes: 150, price: 80, priceType: 'from', description: 'Моделирование и наращивание ногтей' },
    { id: 'm-6', category: M, title: 'Коррекция наращивания', durationMinutes: 120, price: 65, priceType: 'from', description: 'Коррекция формы и покрытия' },
    { id: 'm-7', category: M, title: 'Педикюр без покрытия', durationMinutes: 70, price: 40, priceType: 'exact', description: 'Уход за стопами и ногтями без покрытия' },
    { id: 'm-8', category: M, title: 'Педикюр с покрытием', durationMinutes: 100, price: 60, priceType: 'exact', description: 'Педикюр с покрытием гель-лаком' },
    { id: 'm-9', category: M, title: 'Дизайн ногтей', durationMinutes: 30, price: 10, priceType: 'from', description: 'Дизайн, рисунки или декор' },
    { id: 'm-10', category: M, title: 'Френч', durationMinutes: 30, price: 15, priceType: 'from', description: 'Французское покрытие' },
    { id: 'm-11', category: M, title: 'Ремонт ногтя', durationMinutes: 20, price: 7, priceType: 'from', description: 'Восстановление одного ногтя' },
    { id: 'm-12', category: M, title: 'Комплекс маникюр и педикюр', durationMinutes: 180, price: 100, priceType: 'from', description: 'Маникюр и педикюр в один визит' },
  ],
  [B]: [
    { id: 'b-1', category: B, title: 'Мужская стрижка', durationMinutes: 45, price: 35, priceType: 'exact', description: 'Стрижка с учётом формы лица и стиля' },
    { id: 'b-2', category: B, title: 'Стрижка машинкой', durationMinutes: 30, price: 25, priceType: 'exact', description: 'Быстрая аккуратная стрижка машинкой' },
    { id: 'b-3', category: B, title: 'Fade стрижка', durationMinutes: 60, price: 45, priceType: 'exact', description: 'Плавный переход и чистая форма' },
    { id: 'b-4', category: B, title: 'Стрижка бороды', durationMinutes: 30, price: 25, priceType: 'exact', description: 'Оформление формы бороды' },
    { id: 'b-5', category: B, title: 'Коррекция бороды', durationMinutes: 20, price: 18, priceType: 'exact', description: 'Лёгкая коррекция и контур' },
    { id: 'b-6', category: B, title: 'Стрижка + борода', durationMinutes: 75, price: 60, priceType: 'exact', description: 'Комплексная услуга стрижки и бороды' },
    { id: 'b-7', category: B, title: 'Детская стрижка', durationMinutes: 40, price: 30, priceType: 'exact', description: 'Аккуратная стрижка для ребёнка' },
    { id: 'b-8', category: B, title: 'Окантовка', durationMinutes: 20, price: 15, priceType: 'exact', description: 'Чистый контур стрижки' },
    { id: 'b-9', category: B, title: 'Укладка волос', durationMinutes: 25, price: 20, priceType: 'exact', description: 'Укладка перед мероприятием или съёмкой' },
    { id: 'b-10', category: B, title: 'Камуфляж седины', durationMinutes: 40, price: 40, priceType: 'from', description: 'Мягкое тонирование седины' },
    { id: 'b-11', category: B, title: 'Бритьё опасной бритвой', durationMinutes: 45, price: 40, priceType: 'exact', description: 'Классическое бритьё с уходом' },
    { id: 'b-12', category: B, title: 'Комплексный уход', durationMinutes: 90, price: 75, priceType: 'from', description: 'Стрижка, борода, уход и укладка' },
  ],
  [BL]: [
    { id: 'bl-1', category: BL, title: 'Коррекция бровей', durationMinutes: 30, price: 25, priceType: 'exact', description: 'Подбор и коррекция формы бровей' },
    { id: 'bl-2', category: BL, title: 'Окрашивание бровей', durationMinutes: 30, price: 25, priceType: 'exact', description: 'Окрашивание краской или хной' },
    { id: 'bl-3', category: BL, title: 'Коррекция и окрашивание бровей', durationMinutes: 50, price: 40, priceType: 'exact', description: 'Комплексная процедура для бровей' },
    { id: 'bl-4', category: BL, title: 'Ламинирование бровей', durationMinutes: 60, price: 50, priceType: 'exact', description: 'Долговременная укладка бровей' },
    { id: 'bl-5', category: BL, title: 'Долговременная укладка бровей', durationMinutes: 60, price: 50, priceType: 'exact', description: 'Фиксация формы и уход' },
    { id: 'bl-6', category: BL, title: 'Осветление бровей', durationMinutes: 40, price: 35, priceType: 'from', description: 'Мягкое осветление оттенка бровей' },
    { id: 'bl-7', category: BL, title: 'Ламинирование ресниц', durationMinutes: 70, price: 60, priceType: 'exact', description: 'Завивка, фиксация и уход за ресницами' },
    { id: 'bl-8', category: BL, title: 'Окрашивание ресниц', durationMinutes: 25, price: 20, priceType: 'exact', description: 'Окрашивание ресниц' },
    { id: 'bl-9', category: BL, title: 'Наращивание ресниц классика', durationMinutes: 120, price: 80, priceType: 'from', description: 'Классическое наращивание ресниц' },
    { id: 'bl-10', category: BL, title: 'Наращивание ресниц 2D', durationMinutes: 150, price: 95, priceType: 'from', description: 'Объёмное наращивание ресниц' },
    { id: 'bl-11', category: BL, title: 'Снятие ресниц', durationMinutes: 30, price: 20, priceType: 'exact', description: 'Безопасное снятие наращенных ресниц' },
    { id: 'bl-12', category: BL, title: 'Комплекс брови и ресницы', durationMinutes: 120, price: 90, priceType: 'from', description: 'Комплексный уход за бровями и ресницами' },
  ],
  [MS]: [
    { id: 'ms-1', category: MS, title: 'Классический массаж', durationMinutes: 60, price: 70, priceType: 'exact', description: 'Общий массаж для расслабления и восстановления' },
    { id: 'ms-2', category: MS, title: 'Массаж спины', durationMinutes: 45, price: 55, priceType: 'exact', description: 'Проработка спины, шеи и плеч' },
    { id: 'ms-3', category: MS, title: 'Расслабляющий массаж', durationMinutes: 60, price: 70, priceType: 'exact', description: 'Мягкий массаж для снятия напряжения' },
    { id: 'ms-4', category: MS, title: 'Спортивный массаж', durationMinutes: 60, price: 80, priceType: 'exact', description: 'Восстановление после нагрузок' },
    { id: 'ms-5', category: MS, title: 'Антицеллюлитный массаж', durationMinutes: 60, price: 75, priceType: 'from', description: 'Интенсивная работа с проблемными зонами' },
    { id: 'ms-6', category: MS, title: 'Лимфодренажный массаж', durationMinutes: 60, price: 75, priceType: 'exact', description: 'Массаж для улучшения лимфотока' },
    { id: 'ms-7', category: MS, title: 'Массаж шейно-воротниковой зоны', durationMinutes: 30, price: 40, priceType: 'exact', description: 'Снятие напряжения в шее и плечах' },
    { id: 'ms-8', category: MS, title: 'Массаж ног', durationMinutes: 40, price: 45, priceType: 'exact', description: 'Расслабление и восстановление ног' },
    { id: 'ms-9', category: MS, title: 'Массаж лица', durationMinutes: 45, price: 55, priceType: 'exact', description: 'Уходовый массаж лица' },
    { id: 'ms-10', category: MS, title: 'Массаж всего тела', durationMinutes: 90, price: 100, priceType: 'exact', description: 'Полноценная проработка всего тела' },
    { id: 'ms-11', category: MS, title: 'Массаж головы', durationMinutes: 30, price: 35, priceType: 'exact', description: 'Расслабляющий массаж головы' },
    { id: 'ms-12', category: MS, title: 'Комплексный массаж', durationMinutes: 120, price: 130, priceType: 'from', description: 'Индивидуальная программа массажа' },
  ],
  [F]: [
    { id: 'f-1', category: F, title: 'Персональная тренировка', durationMinutes: 60, price: 60, priceType: 'exact', description: 'Индивидуальная тренировка под цель клиента' },
    { id: 'f-2', category: F, title: 'Вводная тренировка', durationMinutes: 60, price: 45, priceType: 'exact', description: 'Знакомство, оценка уровня и план занятий' },
    { id: 'f-3', category: F, title: 'Тренировка в зале', durationMinutes: 60, price: 60, priceType: 'exact', description: 'Силовая или функциональная тренировка' },
    { id: 'f-4', category: F, title: 'Функциональная тренировка', durationMinutes: 60, price: 60, priceType: 'exact', description: 'Тренировка на силу, выносливость и координацию' },
    { id: 'f-5', category: F, title: 'Тренировка для похудения', durationMinutes: 60, price: 60, priceType: 'exact', description: 'Занятие с акцентом на снижение веса' },
    { id: 'f-6', category: F, title: 'Силовая тренировка', durationMinutes: 60, price: 60, priceType: 'exact', description: 'Работа над силой и техникой упражнений' },
    { id: 'f-7', category: F, title: 'Растяжка', durationMinutes: 50, price: 45, priceType: 'exact', description: 'Мягкая тренировка на гибкость' },
    { id: 'f-8', category: F, title: 'Пилатес', durationMinutes: 50, price: 50, priceType: 'exact', description: 'Тренировка на осанку, корпус и контроль движений' },
    { id: 'f-9', category: F, title: 'Йога', durationMinutes: 60, price: 50, priceType: 'exact', description: 'Практика для тела и расслабления' },
    { id: 'f-10', category: F, title: 'Онлайн-тренировка', durationMinutes: 60, price: 45, priceType: 'exact', description: 'Индивидуальная тренировка онлайн' },
    { id: 'f-11', category: F, title: 'Составление программы тренировок', durationMinutes: 45, price: 50, priceType: 'from', description: 'План занятий под цель клиента' },
    { id: 'f-12', category: F, title: 'Консультация по питанию', durationMinutes: 45, price: 45, priceType: 'from', description: 'Базовые рекомендации по питанию' },
  ],
  [T]: [
    { id: 't-1', category: T, title: 'Мини-тату', durationMinutes: 60, price: 80, priceType: 'from', description: 'Небольшая татуировка с простым эскизом' },
    { id: 't-2', category: T, title: 'Тату до 5 см', durationMinutes: 90, price: 120, priceType: 'from', description: 'Небольшая работа по готовому или индивидуальному эскизу' },
    { id: 't-3', category: T, title: 'Тату 5–10 см', durationMinutes: 150, price: 180, priceType: 'from', description: 'Средняя татуировка с проработкой деталей' },
    { id: 't-4', category: T, title: 'Большая тату', durationMinutes: 240, price: 300, priceType: 'from', description: 'Крупная работа, цена зависит от сложности' },
    { id: 't-5', category: T, title: 'Разработка эскиза', durationMinutes: 60, price: 50, priceType: 'from', description: 'Индивидуальный эскиз под идею клиента' },
    { id: 't-6', category: T, title: 'Консультация по тату', durationMinutes: 30, price: 0, priceType: 'exact', description: 'Обсуждение идеи, места и размера' },
    { id: 't-7', category: T, title: 'Перекрытие старой тату', durationMinutes: 180, price: 250, priceType: 'from', description: 'Перекрытие старой работы новым эскизом' },
    { id: 't-8', category: T, title: 'Коррекция тату', durationMinutes: 90, price: 100, priceType: 'from', description: 'Обновление или исправление татуировки' },
    { id: 't-9', category: T, title: 'Обновление тату', durationMinutes: 120, price: 150, priceType: 'from', description: 'Освежение цвета и контуров' },
    { id: 't-10', category: T, title: 'Парная тату', durationMinutes: 150, price: 180, priceType: 'from', description: 'Две небольшие татуировки в одном стиле' },
    { id: 't-11', category: T, title: 'Леттеринг', durationMinutes: 120, price: 150, priceType: 'from', description: 'Надпись или текстовая татуировка' },
    { id: 't-12', category: T, title: 'Тату в стиле linework', durationMinutes: 120, price: 160, priceType: 'from', description: 'Линейная работа с аккуратным контуром' },
  ],
};

export function getServiceTemplatesForCategoryCode(categoryCode: string): ServiceTemplate[] {
  if (categoryCode in SERVICE_TEMPLATES_BY_CATEGORY) {
    return SERVICE_TEMPLATES_BY_CATEGORY[categoryCode as ServiceCategorySlug];
  }
  return [];
}

/** exact → fixed в модели приложения */
export function templatePriceTypeToApp(
  t: TemplatePriceType,
): 'fixed' | 'from' {
  return t === 'exact' ? 'fixed' : 'from';
}
