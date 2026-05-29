import type { Request } from 'express';
import { resolveClientIp } from '../../lib/clientIp.js';
import type { ConsentAcceptanceInput, ConsentSource } from '../legal/legal.types.js';
import type { AuthConsentGateOptions } from './authConsent.service.js';

export function consentSourceFromRequest(req: Request, fallback: ConsentSource): ConsentSource {
  const header = req.get('x-consent-source')?.trim().toLowerCase();
  if (header === 'telegram' || header === 'google' || header === 'email' || header === 'web') {
    return header;
  }
  return fallback;
}

export function buildConsentGateFromRequest(
  req: Request,
  consents: ConsentAcceptanceInput[] | undefined,
  source: ConsentSource,
): AuthConsentGateOptions {
  return {
    consents,
    meta: {
      source,
      ipAddress: resolveClientIp(req),
      userAgent: req.get('user-agent') ?? null,
    },
  };
}
