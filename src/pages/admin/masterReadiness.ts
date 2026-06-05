import type { MasterDraft } from '../../features/profile/lib/demoMasterStorage';
import { formatStoredPublicAddress } from '../../features/profile/model/masterLocation';

export type MasterBookingReadiness = {
  hasBasicInfo: boolean;
  hasLocationOrFormat: boolean;
  hasActiveService: boolean;
  hasBookableSlot: boolean;
  isPublished: boolean;
  readyToAcceptBookings: boolean;
  blockers: string[];
  publishBlockMessage: string | null;
};

export type MasterReadinessInput = {
  draft: Pick<MasterDraft, 'name' | 'services' | 'location' | 'schedule'>;
  activeSlotCount: number;
  isPublished: boolean;
};

export function countActiveServices(
  services: MasterDraft['services'] | undefined,
): number {
  return (services ?? []).filter((s) => s.isActive !== false).length;
}

export function hasMasterLocationOrFormat(
  draft: Pick<MasterDraft, 'location'>,
): boolean {
  const loc = draft.location;
  if (!loc?.visitType) return false;
  return Boolean(formatStoredPublicAddress(loc).trim());
}

export function assessMasterBookingReadiness(input: MasterReadinessInput): MasterBookingReadiness {
  const hasBasicInfo = Boolean(input.draft.name?.trim());
  const hasActiveService = countActiveServices(input.draft.services) > 0;
  const hasBookableSlot = input.activeSlotCount > 0;
  const hasLocationOrFormat = hasMasterLocationOrFormat(input.draft);

  const blockers: string[] = [];
  if (!hasBasicInfo) blockers.push('Укажите имя в профиле.');
  if (!hasLocationOrFormat) blockers.push('Укажите адрес или формат приёма.');
  if (!hasActiveService) blockers.push('Добавьте хотя бы одну услугу.');
  if (!hasBookableSlot) {
    blockers.push('Создайте хотя бы одно окно для записи. График работы в профиле — не окно.');
  }

  const readyToAcceptBookings =
    hasBasicInfo && hasLocationOrFormat && hasActiveService && hasBookableSlot;

  let publishBlockMessage: string | null = null;
  if (!hasActiveService) {
    publishBlockMessage = 'Добавьте хотя бы одну услугу.';
  } else if (!hasBookableSlot) {
    publishBlockMessage = 'Создайте хотя бы одно окно для записи.';
  } else if (!hasLocationOrFormat) {
    publishBlockMessage = 'Укажите адрес или формат приёма.';
  }

  return {
    hasBasicInfo,
    hasLocationOrFormat,
    hasActiveService,
    hasBookableSlot,
    isPublished: input.isPublished,
    readyToAcceptBookings,
    blockers,
    publishBlockMessage,
  };
}

export type DailyHubState =
  | 'no_services'
  | 'no_slots'
  | 'ready_no_requests'
  | 'has_pending'
  | 'default';

export function resolveDailyHubState(input: {
  activeServiceCount: number;
  activeSlotCount: number;
  pendingCount: number;
}): DailyHubState {
  if (input.activeServiceCount <= 0) return 'no_services';
  if (input.activeSlotCount <= 0) return 'no_slots';
  if (input.pendingCount > 0) return 'has_pending';
  return 'ready_no_requests';
}
