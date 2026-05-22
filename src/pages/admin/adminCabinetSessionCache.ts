import type { MasterSubscriptionDto } from '../../features/admin/api/adminBillingApi';
import type { MasterPublicationStatus } from '../../features/admin/lib/profileCompletion';
import type { DemoMasterAppointment } from '../../features/master/model/demoMasterAppointments';
import type { MasterDraft } from '../../features/profile/lib/demoMasterStorage';

export type AdminCabinetSessionCache = {
  masterId: string;
  draft: MasterDraft;
  appointments: DemoMasterAppointment[];
  publicationStatus: MasterPublicationStatus | null;
  cabinetProfileMeta: { rating: number; reviewsCount: number } | null;
  subscription: MasterSubscriptionDto | null;
};

let cache: AdminCabinetSessionCache | null = null;

export function readAdminCabinetSessionCache(masterId: string): AdminCabinetSessionCache | null {
  if (!cache || cache.masterId !== masterId) return null;
  return cache;
}

export function writeAdminCabinetSessionCache(next: AdminCabinetSessionCache): void {
  cache = next;
}

export function clearAdminCabinetSessionCache(): void {
  cache = null;
}
