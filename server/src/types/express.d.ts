import type { ProfileAccountStatus } from '../modules/profiles/profileAccount.service.js';
import type { JwtUserRole } from '../middlewares/auth.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        role: JwtUserRole;
        authSessionId: string | null;
        accountStatus: ProfileAccountStatus;
        restrictionReason: string | null;
        blockedReason: string | null;
        accessRestrictedUntil: string | null;
      };
    }
  }
}

export {};
