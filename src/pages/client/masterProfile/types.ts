import type { MasterDraftCareerItem } from '../../../features/profile/lib/demoMasterStorage';
import type { MasterContact } from '../../../features/master-onboarding/model/masterContacts';
import type { DemoMasterProfile } from '../../../features/services/model/demoMasters';
import type { MasterPublicPaymentDto } from '../../../shared/payments/paymentMethodCodes';

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
  coverUrl?: string | null;
  portfolioCoverItemId?: string | null;
  contacts?: MasterContact[];
  careerItems?: MasterDraftCareerItem[];
  experience?: string;
  certificates?: MasterCertificate[];
  portfolio?: MasterPortfolioItem[];
  bookingRules?: string;
  cancellationPolicy?: string;
  paymentMethods?: string[];
  preferredBankIds?: string[];
  paymentNote?: string;
  payment?: MasterPublicPaymentDto | null;
  clientPreview?: string[];
};

export type NearestSlotInfo = {
  startsAt: string;
  label: string;
  serviceId: string | null;
};
