import type { MySlotDto } from '../api/adminSlotsApi';
import type { MasterOnboardingService, MasterDraft } from '../../profile/lib/demoMasterStorage';
import { formatStoredPublicAddress } from '../../profile/model/masterLocation';
import {
  contactRowsFromDraft,
  validateContactValue,
} from '../../master-onboarding/model/masterContacts';
import { isOptionalBelarusPhoneValid } from '../../master-onboarding/model/belarusPhone';

export type MasterPublicationStatus = 'draft' | 'published' | 'hidden' | 'blocked' | 'paused';

export type ProfileCompletionActionId =
  | 'main'
  | 'services'
  | 'schedule'
  | 'address'
  | 'portfolio'
  | 'rules'
  | 'publish';

export type ProfileCompletionMissingItem = {
  id: string;
  label: string;
  actionId: ProfileCompletionActionId;
};

export type ProfileCompletionCategory = {
  id: string;
  done: boolean;
  missing: ProfileCompletionMissingItem[];
};

export type ProfileCompletionInput = {
  draft: MasterDraft;
  publicationStatus: MasterPublicationStatus | null;
  /** null = ещё не загружено (API); число = известное количество активных окон */
  activeBookableSlots: number | null;
  useCabinetApi: boolean;
  cabinetLoading: boolean;
  slotsLoading: boolean;
};

export type ProfileCompletionResult = {
  percent: number;
  categories: ProfileCompletionCategory[];
  missing: ProfileCompletionMissingItem[];
  isContentComplete: boolean;
  isPublished: boolean;
  isFullyReady: boolean;
  /** Нельзя показывать «100%» пока нет данных с сервера */
  readinessKnown: boolean;
};

function hasValidReachability(draft: MasterDraft): boolean {
  const phoneOk = isOptionalBelarusPhoneValid(draft.phone?.trim() ?? '');
  if (!phoneOk) return false;
  const rows = contactRowsFromDraft(draft);
  return rows.some((row) => {
    const v = row.value.trim();
    if (!v) return false;
    return validateContactValue(row.type, v) == null;
  });
}

function isCategoryChosen(draft: MasterDraft): boolean {
  if (draft.primaryCategoryId?.trim()) return true;
  if (draft.primaryCategoryCode?.trim()) return true;
  const c = draft.category?.trim() ?? '';
  return c.length > 0 && c !== 'Не указана';
}

function isMainInfoComplete(draft: MasterDraft): ProfileCompletionMissingItem[] {
  const missing: ProfileCompletionMissingItem[] = [];
  const name = draft.name?.trim() ?? '';
  if (name.length < 2) {
    missing.push({ id: 'main-name', label: 'Укажите имя мастера', actionId: 'main' });
  }
  if (!isCategoryChosen(draft)) {
    missing.push({ id: 'main-category', label: 'Выберите категорию', actionId: 'main' });
  }
  if (!hasValidReachability(draft)) {
    missing.push({
      id: 'main-contact',
      label: 'Укажите телефон Беларуси и контакт в мессенджере',
      actionId: 'main',
    });
  }
  if ((draft.description?.trim() ?? '').length < 10) {
    missing.push({ id: 'main-bio', label: 'Добавьте описание (от 10 символов)', actionId: 'main' });
  }
  return missing;
}

function parseServicePriceByn(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Услуга в каталоге: название, цена и видимость (фото — отдельно при публикации в каталоге). */
export function isCatalogServiceComplete(s: MasterOnboardingService): boolean {
  if (s.isActive === false) return false;
  const title = (s.title ?? '').trim();
  if (title.length < 2 || title.length > 300) return false;
  const legacyPrice = (s as MasterOnboardingService & { price?: unknown }).price;
  const price = parseServicePriceByn(s.priceByn) ?? parseServicePriceByn(legacyPrice);
  if (price === null || price < 0) return false;
  return true;
}

export function hasCompletedServicesCatalog(services: MasterOnboardingService[] | undefined): boolean {
  const list = services ?? [];
  if (list.length === 0) return false;
  return list.some(isCatalogServiceComplete);
}

function servicesMissing(draft: MasterDraft): ProfileCompletionMissingItem[] {
  const list = draft.services ?? [];
  const missing: ProfileCompletionMissingItem[] = [];
  if (list.length === 0) {
    missing.push({ id: 'services-empty', label: 'Добавьте хотя бы одну услугу', actionId: 'services' });
    return missing;
  }
  if (!hasCompletedServicesCatalog(list)) {
    missing.push({
      id: 'services-invalid',
      label: 'Укажите название и цену у хотя бы одной активной услуги',
      actionId: 'services',
    });
  }
  return missing;
}

function addressMissing(draft: MasterDraft): ProfileCompletionMissingItem[] {
  const loc = draft.location;
  const missing: ProfileCompletionMissingItem[] = [];
  if (!loc?.visitType) {
    missing.push({ id: 'address-visit', label: 'Укажите формат работы', actionId: 'address' });
  }
  const city = (loc?.city ?? '').trim() || 'Минск';
  if (!city.trim()) {
    missing.push({ id: 'address-city', label: 'Укажите город', actionId: 'address' });
  }
  const publicLine = formatStoredPublicAddress(loc).trim();
  if (!publicLine) {
    missing.push({ id: 'address-line', label: 'Укажите адрес приёма', actionId: 'address' });
  }
  return missing;
}

function portfolioMissing(draft: MasterDraft): ProfileCompletionMissingItem[] {
  const withPhoto = (draft.portfolio ?? []).filter((p) => (p.imageUrl ?? '').trim().length > 0);
  if (withPhoto.length > 0) return [];
  return [{ id: 'portfolio-empty', label: 'Загрузите фото работ', actionId: 'portfolio' }];
}

function rulesMissing(draft: MasterDraft): ProfileCompletionMissingItem[] {
  const hasRules =
    Boolean(draft.bookingRules?.trim()) ||
    Boolean(draft.cancellationPolicy?.trim()) ||
    Boolean(draft.paymentNote?.trim()) ||
    (draft.paymentMethods?.length ?? 0) > 0;
  if (hasRules) return [];
  return [
    {
      id: 'rules-empty',
      label: 'Заполните правила записи или оплаты',
      actionId: 'rules',
    },
  ];
}

function isSlotsCategoryDone(input: ProfileCompletionInput): boolean {
  if (!input.useCabinetApi) return false;
  if (input.cabinetLoading || input.slotsLoading || input.activeBookableSlots === null) return false;
  return input.activeBookableSlots > 0;
}

function slotsMissing(input: ProfileCompletionInput): ProfileCompletionMissingItem[] {
  if (!input.useCabinetApi) {
    return [{ id: 'slots-api', label: 'Подключите сервер, чтобы открыть запись по слотам', actionId: 'schedule' }];
  }
  if (input.cabinetLoading || input.slotsLoading || input.activeBookableSlots === null) {
    return [];
  }
  if (input.activeBookableSlots > 0) return [];
  return [{ id: 'slots-empty', label: 'Добавьте окна для записи', actionId: 'schedule' }];
}

function publishMissing(publicationStatus: MasterPublicationStatus | null): ProfileCompletionMissingItem[] {
  if (publicationStatus === 'published') return [];
  return [{ id: 'publish', label: 'Опубликуйте профиль', actionId: 'publish' }];
}

export function computeProfileCompletion(input: ProfileCompletionInput): ProfileCompletionResult {
  const { draft, publicationStatus, useCabinetApi, cabinetLoading, slotsLoading } = input;

  const CATEGORY_COUNT = 7;

  const categories: ProfileCompletionCategory[] = [
    { id: 'main', done: false, missing: isMainInfoComplete(draft) },
    { id: 'services', done: false, missing: servicesMissing(draft) },
    { id: 'slots', done: false, missing: slotsMissing(input) },
    { id: 'address', done: false, missing: addressMissing(draft) },
    { id: 'portfolio', done: false, missing: portfolioMissing(draft) },
    { id: 'rules', done: false, missing: rulesMissing(draft) },
    { id: 'published', done: false, missing: publishMissing(publicationStatus) },
  ].map((c) => {
    if (c.id === 'slots') {
      return { ...c, done: isSlotsCategoryDone(input) };
    }
    return { ...c, done: c.missing.length === 0 };
  });

  const slotsPending =
    useCabinetApi && (cabinetLoading || slotsLoading || input.activeBookableSlots === null);

  const readinessKnown = !slotsPending && !(useCabinetApi && cabinetLoading);

  const doneCount = categories.filter((c) => c.done).length;
  const rawPercent = Math.round((doneCount / CATEGORY_COUNT) * 100);
  const percent = readinessKnown ? rawPercent : Math.min(rawPercent, 99);

  const missing = categories.flatMap((c) => c.missing);
  const contentCategories = categories.filter((c) => c.id !== 'published');
  const isContentComplete = contentCategories.every((c) => c.done);
  const isPublished = publicationStatus === 'published';
  const isFullyReady = isContentComplete && isPublished && readinessKnown;

  return {
    percent: readinessKnown ? percent : Math.min(percent, 99),
    categories,
    missing,
    isContentComplete,
    isPublished,
    isFullyReady,
    readinessKnown,
  };
}

export function countActiveBookableSlots(slots: MySlotDto[]): number {
  const now = Date.now();
  return slots.filter(
    (s) => s.status === 'available' && new Date(s.endsAt).getTime() > now,
  ).length;
}
