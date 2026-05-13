import type { MasterLocation } from '../model/masterLocation';

const DRAFT_KEY = 'slotty_master_draft';
const IS_MASTER_KEY = 'slotty_is_master';
const DEFAULT_MASTER_ID = 'demo_master_local';

export type MasterSchedule = {
  workDays: number[];
  startTime: string;
  endTime: string;
  gapMinutes: number;
};

export type MasterOnboardingService = {
  id: string;
  title: string;
  durationMin: number;
  priceByn: number;
  description?: string;
  priceType?: 'fixed' | 'from';
  isActive?: boolean;
  sortOrder?: number;
};

export type MasterCertificate = {
  id: string;
  title: string;
  issuer: string;
  year?: string;
  imageUrl?: string;
  description?: string;
};

export type MasterPortfolioItem = {
  id: string;
  title?: string;
  imageUrl?: string;
  description?: string;
};

/** Тип пункта «Образование и опыт» (без сертификатов — они в `certificates`). */
export type MasterCareerItemType = 'education' | 'course' | 'practice' | 'work';

/** Строка из localStorage; допускает устаревшие значения. */
export type MasterDraftCareerItem = {
  id: string;
  type?: string;
  title: string;
  place: string;
  startYear?: string;
  endYear?: string;
  description?: string;
};

export type MasterDraft = {
  masterId?: string;
  /** UUID категории из каталога (для API услуг). */
  primaryCategoryId?: string;
  category: string;
  name: string;
  description: string;
  contact: string;
  services: MasterOnboardingService[];
  schedule: MasterSchedule;
  location: MasterLocation;
  createdAt: string;
  photoUrl?: string;
  phone?: string;
  experience?: string;
  careerItems?: MasterDraftCareerItem[];
  certificates?: MasterCertificate[];
  portfolio?: MasterPortfolioItem[];
  bookingRules?: string;
  cancellationPolicy?: string;
  paymentMethods?: string[];
  paymentNote?: string;
};

/** Сжимает legacy `certificate` → `course`, неизвестное → `work`. */
export function normalizeMasterCareerItemType(raw: string | undefined): MasterCareerItemType {
  if (raw === 'education' || raw === 'course' || raw === 'practice' || raw === 'work') return raw;
  if (raw === 'certificate') return 'course';
  return 'work';
}

export function isDemoMaster(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(IS_MASTER_KEY) === 'true';
  } catch {
    return false;
  }
}

export function getStoredMasterDraft(): MasterDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw?.trim()) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as MasterDraft;
  } catch {
    return null;
  }
}

export function saveMasterDraft(draft: MasterDraft): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

export async function persistMasterOnboardingComplete(draft: MasterDraft): Promise<void> {
  const merged: MasterDraft = {
    ...draft,
    masterId: draft.masterId?.trim() || DEFAULT_MASTER_ID,
  };
  saveMasterDraft(merged);
  try {
    window.localStorage.setItem(IS_MASTER_KEY, 'true');
  } catch {
    // ignore
  }
}
