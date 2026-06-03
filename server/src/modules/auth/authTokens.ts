import jwt from 'jsonwebtoken';
import type { JwtUserRole } from '../../middlewares/auth.js';
import { env } from '../../config/env.js';

export function signAccessToken(
  profileId: string,
  role: JwtUserRole,
  sessionId?: string,
): string {
  const payload: { sub: string; role: JwtUserRole; sid?: string } = { sub: profileId, role };
  if (sessionId) payload.sid = sessionId;
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}