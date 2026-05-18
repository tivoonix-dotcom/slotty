import type { MasterDraftCareerItem } from '../../../features/profile/lib/demoMasterStorage';
import type { DemoMasterProfile } from '../../../features/services/model/demoMasters';

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

export type ExtendedMasterProfile = DemoMasterProfile & {
  careerItems?: MasterDraftCareerItem[];
  experience?: string;
  certificates?: MasterCertificate[];
  portfolio?: MasterPortfolioItem[];
  bookingRules?: string;
  cancellationPolicy?: string;
  paymentMethods?: string[];
  paymentNote?: string;
};

export type NearestSlotInfo = {
  startsAt: string;
  label: string;
  serviceId: string | null;
};
