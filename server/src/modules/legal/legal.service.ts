import type { PoolClient } from 'pg';
import { query, withTransaction } from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';
import type {
  ConsentAcceptanceInput,
  ConsentMeta,
  ConsentSource,
  LegalDocumentKey,
  LegalDocumentPublic,
} from './legal.types.js';
import {
  LEGAL_DOCUMENT_PATHS,
  REQUIRED_MASTER_CONSENT_KEYS,
  REQUIRED_SIGNUP_CONSENT_KEYS,
} from './legal.types.js';

export type MissingConsentDocument = LegalDocumentPublic & {
  path: string;
};

export type ConsentStatus = {
  satisfied: boolean;
  missing: MissingConsentDocument[];
};

type ActiveDocRow = {
  document_key: string;
  version: number;
  title: string;
  effective_from: Date | string;
};

function mapActiveDoc(row: ActiveDocRow): LegalDocumentPublic {
  const effectiveFrom =
    row.effective_from instanceof Date
      ? row.effective_from.toISOString().slice(0, 10)
      : String(row.effective_from).slice(0, 10);
  return {
    documentKey: row.document_key as LegalDocumentKey,
    version: row.version,
    title: row.title,
    effectiveFrom,
  };
}

export async function listActiveLegalDocuments(): Promise<LegalDocumentPublic[]> {
  const r = await query<ActiveDocRow>(
    `select document_key, version, title, effective_from
       from public.legal_document_versions
      where is_active = true
      order by document_key asc`,
  );
  return r.rows.map(mapActiveDoc);
}

async function getActiveDocumentMap(): Promise<Map<string, LegalDocumentPublic>> {
  const docs = await listActiveLegalDocuments();
  return new Map(docs.map((d) => [d.documentKey, d]));
}

export async function getMissingConsentsForProfile(
  profileId: string,
  requiredKeys: LegalDocumentKey[] = REQUIRED_SIGNUP_CONSENT_KEYS,
): Promise<MissingConsentDocument[]> {
  const active = await getActiveDocumentMap();
  const r = await query<{ document_key: string; document_version: number }>(
    `select document_key, document_version
       from public.profile_consents
      where profile_id = $1 and accepted = true`,
    [profileId],
  );
  const accepted = new Set(r.rows.map((row) => `${row.document_key}:${row.document_version}`));

  const missing: MissingConsentDocument[] = [];
  for (const key of requiredKeys) {
    const doc = active.get(key);
    if (!doc) {
      throw ApiError.internal(`Legal document not configured: ${key}`, 'LEGAL_DOC_MISSING');
    }
    if (!accepted.has(`${key}:${doc.version}`)) {
      missing.push({
        ...doc,
        path: LEGAL_DOCUMENT_PATHS[key],
      });
    }
  }
  return missing;
}

export async function getConsentStatusForProfile(
  profileId: string,
  requiredKeys: LegalDocumentKey[] = REQUIRED_SIGNUP_CONSENT_KEYS,
): Promise<ConsentStatus> {
  const missing = await getMissingConsentsForProfile(profileId, requiredKeys);
  return { satisfied: missing.length === 0, missing };
}

/** All signup documents a new user must accept (no profile yet). */
export async function getRequiredDocumentsForNewUser(
  requiredKeys: LegalDocumentKey[] = REQUIRED_SIGNUP_CONSENT_KEYS,
): Promise<MissingConsentDocument[]> {
  const active = await getActiveDocumentMap();
  const missing: MissingConsentDocument[] = [];
  for (const key of requiredKeys) {
    const doc = active.get(key);
    if (!doc) {
      throw ApiError.internal(`Legal document not configured: ${key}`, 'LEGAL_DOC_MISSING');
    }
    missing.push({ ...doc, path: LEGAL_DOCUMENT_PATHS[key] });
  }
  return missing;
}

export function throwConsentRequired(
  missing: MissingConsentDocument[],
  isNewUser: boolean,
): never {
  throw new ApiError(
    403,
    'Перед продолжением примите актуальные документы сервиса',
    'CONSENT_REQUIRED',
    { isNewUser, requiredDocuments: missing, missingDocumentKeys: missing.map((m) => m.documentKey) },
  );
}

export async function assertProfileHasRequiredConsents(
  profileId: string,
  requiredKeys: LegalDocumentKey[] = REQUIRED_SIGNUP_CONSENT_KEYS,
): Promise<void> {
  const missing = await getMissingConsentsForProfile(profileId, requiredKeys);
  if (missing.length > 0) {
    throwConsentRequired(missing, false);
  }
}

export async function validateConsentPayload(
  consents: ConsentAcceptanceInput[] | undefined,
  requiredKeys: LegalDocumentKey[] = REQUIRED_SIGNUP_CONSENT_KEYS,
): Promise<ConsentAcceptanceInput[]> {
  if (!consents?.length) {
    throw ApiError.badRequest('Укажите принятые документы', 'CONSENT_PAYLOAD_MISSING');
  }

  const active = await getActiveDocumentMap();
  const seen = new Set<string>();
  const normalized: ConsentAcceptanceInput[] = [];

  for (const item of consents) {
    const key = item.documentKey?.trim();
    const version = Number(item.version);
    if (!key || !Number.isInteger(version) || version < 1) {
      throw ApiError.badRequest('Некорректный формат согласия', 'CONSENT_INVALID');
    }
    const dedupe = `${key}:${version}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    const activeDoc = active.get(key);
    if (!activeDoc) {
      throw ApiError.badRequest(`Неизвестный документ: ${key}`, 'CONSENT_UNKNOWN_DOC');
    }
    if (activeDoc.version !== version) {
      throw ApiError.badRequest(
        `Версия документа «${activeDoc.title}» устарела. Обновите страницу и примите актуальную версию.`,
        'CONSENT_VERSION_MISMATCH',
      );
    }
    normalized.push({ documentKey: key, version });
  }

  for (const key of requiredKeys) {
    const activeDoc = active.get(key);
    if (!activeDoc) continue;
    if (!seen.has(`${key}:${activeDoc.version}`)) {
      throw ApiError.badRequest(
        `Не принят обязательный документ: ${activeDoc.title}`,
        'CONSENT_INCOMPLETE',
      );
    }
  }

  return normalized;
}

async function syncLegacyProfileConsentTimestamps(
  client: PoolClient,
  profileId: string,
): Promise<void> {
  await client.query(
    `update public.profiles set
       privacy_consent_accepted_at = coalesce(privacy_consent_accepted_at, now()),
       terms_accepted_at = coalesce(terms_accepted_at, now()),
       updated_at = now()
     where id = $1`,
    [profileId],
  );
}

export async function recordProfileConsents(
  profileId: string,
  consents: ConsentAcceptanceInput[],
  meta: ConsentMeta,
  client?: PoolClient,
): Promise<void> {
  const run = async (c: PoolClient) => {
    for (const item of consents) {
      await c.query(
        `insert into public.profile_consents (
           profile_id, document_key, document_version, accepted, accepted_at,
           ip_address, user_agent, source
         ) values ($1, $2, $3, true, now(), $4::inet, $5, $6)
         on conflict (profile_id, document_key, document_version) do nothing`,
        [
          profileId,
          item.documentKey,
          item.version,
          meta.ipAddress?.trim() || null,
          meta.userAgent?.trim()?.slice(0, 512) || null,
          meta.source,
        ],
      );
    }
    await syncLegacyProfileConsentTimestamps(c, profileId);
  };

  if (client) {
    await run(client);
    return;
  }
  await withTransaction(run);
}

/** Move consent rows from merged orphan profile to canonical profile. */
export async function reassignProfileConsentsToCanonical(
  canonicalProfileId: string,
  staleProfileId: string,
): Promise<void> {
  if (canonicalProfileId === staleProfileId) return;

  await withTransaction(async (client) => {
    const rows = await client.query<{
      document_key: string;
      document_version: number;
      accepted_at: Date;
      ip_address: string | null;
      user_agent: string | null;
      source: ConsentSource;
      metadata: unknown;
    }>(
      `select document_key, document_version, accepted_at, ip_address, user_agent, source, metadata
         from public.profile_consents
        where profile_id = $1 and accepted = true`,
      [staleProfileId],
    );

    for (const row of rows.rows) {
      await client.query(
        `insert into public.profile_consents (
           profile_id, document_key, document_version, accepted, accepted_at,
           ip_address, user_agent, source, metadata
         ) values ($1, $2, $3, true, $4, $5::inet, $6, $7, $8)
         on conflict (profile_id, document_key, document_version) do nothing`,
        [
          canonicalProfileId,
          row.document_key,
          row.document_version,
          row.accepted_at,
          row.ip_address,
          row.user_agent,
          row.source,
          row.metadata ?? null,
        ],
      );
    }
  });
}

export async function acceptConsentsForProfile(
  profileId: string,
  consents: ConsentAcceptanceInput[] | undefined,
  meta: ConsentMeta,
  requiredKeys: LegalDocumentKey[] = REQUIRED_SIGNUP_CONSENT_KEYS,
): Promise<ConsentStatus> {
  const normalized = await validateConsentPayload(consents, requiredKeys);
  await recordProfileConsents(profileId, normalized, meta);
  return getConsentStatusForProfile(profileId, requiredKeys);
}

export { REQUIRED_MASTER_CONSENT_KEYS, REQUIRED_SIGNUP_CONSENT_KEYS };
