import type { PoolClient } from 'pg';
import type { ConsentAcceptanceInput, ConsentMeta } from '../legal/legal.types.js';
import {
  acceptConsentsForProfile,
  getConsentStatusForProfile,
  getMissingConsentsForProfile,
  getRequiredDocumentsForNewUser,
  recordProfileConsents,
  throwConsentRequired,
  validateConsentPayload,
} from '../legal/legal.service.js';

export type AuthConsentGateOptions = {
  consents?: ConsentAcceptanceInput[];
  meta: ConsentMeta;
};

/** Existing profile: require + save consents before session. */
export async function gateExistingProfileConsents(
  profileId: string,
  options: AuthConsentGateOptions,
): Promise<void> {
  const missing = await getMissingConsentsForProfile(profileId);
  if (missing.length === 0) return;

  if (!options.consents?.length) {
    throwConsentRequired(missing, false);
  }

  await acceptConsentsForProfile(profileId, options.consents, options.meta);
}

/** New profile: validate consents before create; save in same DB transaction. */
export async function prepareNewUserConsents(
  options: AuthConsentGateOptions,
): Promise<ConsentAcceptanceInput[]> {
  if (!options.consents?.length) {
    const required = await getRequiredDocumentsForNewUser();
    throwConsentRequired(required, true);
  }
  return validateConsentPayload(options.consents);
}

export async function saveNewUserConsentsInTx(
  client: PoolClient,
  profileId: string,
  consents: ConsentAcceptanceInput[],
  meta: ConsentMeta,
): Promise<void> {
  await recordProfileConsents(profileId, consents, meta, client);
}

export async function getProfileConsentStatus(profileId: string) {
  return getConsentStatusForProfile(profileId);
}
