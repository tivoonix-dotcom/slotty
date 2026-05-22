import { ADMIN_SCHEDULE_PATH, ADMIN_SERVICES_PATH } from '../../../app/paths';
import type { BackendProfile } from '../../auth/types';
import type { MasterDraft } from '../../profile/lib/demoMasterStorage';
import { formatStoredPublicAddress } from '../../profile/model/masterLocation';
import {
  contactRowsFromDraft,
  validateContactValue,
} from '../../master-onboarding/model/masterContacts';
import { isOptionalBelarusPhoneValid } from '../../master-onboarding/model/belarusPhone';
import {
  computeProfileCompletion,
  type ProfileCompletionInput,
  type ProfileCompletionResult,
} from './profileCompletion';

export type ProfileCompletionSectionId =
  | 'basic'
  | 'photo'
  | 'description'
  | 'contacts'
  | 'address'
  | 'portfolio'
  | 'services'
  | 'schedule'
  | 'rules'
  | 'documents';

export type ProfileCompletionSectionTarget =
  | { kind: 'profile'; section?: 'main' | 'address' | 'portfolio' | 'rules'; sheet?: 'main' | 'address' | 'rules' }
  | { kind: 'path'; path: string };

export type ProfileCompletionSectionItem = {
  id: ProfileCompletionSectionId;
  label: string;
  description: string;
  done: boolean;
  target: ProfileCompletionSectionTarget;
};

export type ProfileCompletionSectionsResult = {
  sections: ProfileCompletionSectionItem[];
  percent: number;
  doneCount: number;
  totalCount: number;
  isComplete: boolean;
  /** Сводная логика кабинета (публикация, слоты API). */
  cabinet: ProfileCompletionResult;
  readinessKnown: boolean;
};

function isCategoryChosen(draft: MasterDraft): boolean {
  if (draft.primaryCategoryId?.trim()) return true;
  if (draft.primaryCategoryCode?.trim()) return true;
  const c = draft.category?.trim() ?? '';
  return c.length > 0 && c !== 'Не указана';
}

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

function isBasicInfoDone(draft: MasterDraft): boolean {
  return (draft.name?.trim() ?? '').length >= 2 && isCategoryChosen(draft);
}

function isPhotoDone(draft: MasterDraft): boolean {
  return Boolean(draft.photoUrl?.trim());
}

function isDescriptionDone(draft: MasterDraft): boolean {
  return (draft.description?.trim() ?? '').length >= 10;
}

function isContactsDone(draft: MasterDraft): boolean {
  return hasValidReachability(draft);
}

function isAddressDone(draft: MasterDraft): boolean {
  const loc = draft.location;
  if (!loc?.visitType) return false;
  const city = (loc.city ?? '').trim() || 'Минск';
  if (!city.trim()) return false;
  return Boolean(formatStoredPublicAddress(loc).trim());
}

function isPortfolioDone(draft: MasterDraft): boolean {
  return (draft.portfolio ?? []).some((p) => (p.imageUrl ?? '').trim().length > 0);
}

function isServicesDone(draft: MasterDraft): boolean {
  const active = (draft.services ?? []).filter((s) => s.isActive !== false);
  if (active.length === 0) return false;
  return active.some((s) => {
    const title = s.title.trim();
    return (
      title.length >= 2 &&
      title.length <= 300 &&
      Number.isFinite(s.durationMin) &&
      s.durationMin >= 15 &&
      s.durationMin <= 1440 &&
      Number.isFinite(s.priceByn) &&
      s.priceByn >= 0
    );
  });
}

function isRulesDone(draft: MasterDraft): boolean {
  return (
    Boolean(draft.bookingRules?.trim()) ||
    Boolean(draft.cancellationPolicy?.trim()) ||
    Boolean(draft.paymentNote?.trim()) ||
    (draft.paymentMethods?.length ?? 0) > 0
  );
}

function isDocumentsDone(draft: MasterDraft, authProfile: BackendProfile | null | undefined): boolean {
  const hasCert = (draft.certificates ?? []).some(
    (c) => c.title.trim().length > 0 && (c.imageUrl ?? '').trim().length > 0,
  );
  if (hasCert) return true;
  return Boolean(
    authProfile?.privacy_consent_accepted_at?.trim() && authProfile?.terms_accepted_at?.trim(),
  );
}

function isScheduleDone(input: ProfileCompletionInput): boolean {
  if (!input.useCabinetApi) return false;
  if (input.cabinetLoading || input.slotsLoading || input.activeBookableSlots === null) return false;
  return input.activeBookableSlots > 0;
}

export function computeProfileCompletionSections(
  input: ProfileCompletionInput & { authProfile?: BackendProfile | null },
): ProfileCompletionSectionsResult {
  const { draft, authProfile } = input;
  const cabinet = computeProfileCompletion(input);

  const schedulePending =
    input.useCabinetApi &&
    (input.cabinetLoading || input.slotsLoading || input.activeBookableSlots === null);

  const sections: ProfileCompletionSectionItem[] = [
    {
      id: 'basic',
      label: 'Основная информация',
      description: 'Имя мастера и категория услуг',
      done: isBasicInfoDone(draft),
      target: { kind: 'profile', section: 'main', sheet: 'main' },
    },
    {
      id: 'photo',
      label: 'Фото профиля',
      description: 'Аватар в шапке и каталоге',
      done: isPhotoDone(draft),
      target: { kind: 'profile', section: 'main', sheet: 'main' },
    },
    {
      id: 'description',
      label: 'Описание',
      description: 'Кратко о вас и вашем опыте',
      done: isDescriptionDone(draft),
      target: { kind: 'profile', section: 'main', sheet: 'main' },
    },
    {
      id: 'contacts',
      label: 'Контакты',
      description: 'Телефон и мессенджер для связи',
      done: isContactsDone(draft),
      target: { kind: 'profile', section: 'main', sheet: 'main' },
    },
    {
      id: 'address',
      label: 'Адрес',
      description: 'Город и адрес приёма клиентов',
      done: isAddressDone(draft),
      target: { kind: 'profile', section: 'address', sheet: 'address' },
    },
    {
      id: 'portfolio',
      label: 'Портфолио',
      description: 'Фото работ в галерее',
      done: isPortfolioDone(draft),
      target: { kind: 'profile', section: 'portfolio' },
    },
    {
      id: 'services',
      label: 'Услуги',
      description: 'Цены и длительность услуг',
      done: isServicesDone(draft),
      target: { kind: 'path', path: ADMIN_SERVICES_PATH },
    },
    {
      id: 'schedule',
      label: 'График работы',
      description: 'Окна для онлайн-записи',
      done: isScheduleDone(input),
      target: { kind: 'path', path: ADMIN_SCHEDULE_PATH },
    },
    {
      id: 'rules',
      label: 'Правила',
      description: 'Запись, отмена и оплата',
      done: isRulesDone(draft),
      target: { kind: 'profile', section: 'rules', sheet: 'rules' },
    },
    {
      id: 'documents',
      label: 'Документы',
      description: 'Сертификаты или согласия',
      done: isDocumentsDone(draft, authProfile),
      target: { kind: 'profile', section: 'portfolio' },
    },
  ];

  const countable = sections.filter((s) => s.id !== 'schedule' || !schedulePending);
  const doneCount = countable.filter((s) => s.done).length;
  const totalCount = countable.length;
  const rawPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const percent =
    cabinet.readinessKnown && !schedulePending ? rawPercent : Math.min(rawPercent, 99);

  return {
    sections,
    percent,
    doneCount,
    totalCount,
    isComplete: cabinet.readinessKnown && !schedulePending && sections.every((s) => s.done),
    cabinet,
    readinessKnown: cabinet.readinessKnown && !schedulePending,
  };
}
