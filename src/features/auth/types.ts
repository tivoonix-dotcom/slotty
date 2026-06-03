export type BackendProfile = {
  id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  full_name: string;
  avatar_url: string | null;
  header_avatar_url?: string | null;
  role: string;
  /** Есть master_profiles для этого profile.id (кабинет мастера доступен при platform_admin). */
  hasMasterProfile?: boolean;
  phone?: string | null;
  address?: string | null;
  /** Email из привязки email или Google. */
  account_email?: string | null;
  privacy_consent_accepted_at?: string | null;
  terms_accepted_at?: string | null;
  account_status?: 'active' | 'restricted' | 'blocked' | 'deleted';
  blocked_reason?: string | null;
  access_restriction_reason?: string | null;
  access_restricted_until?: string | null;
  consent_status?: {
    satisfied: boolean;
    missing: Array<{
      documentKey: string;
      version: number;
      title: string;
      effectiveFrom: string;
      path: string;
    }>;
  };
  /** Сервер переключил на основной аккаунт (email/TG/Google были на разных profiles). */
  session_refresh?: { token: string };
};

export function normalizeBackendProfile(payload: BackendProfile): BackendProfile {
  const { session_refresh: refresh, ...profile } = payload;
  if (refresh?.token) {
    return profile;
  }
  return payload;
}

export function sessionRefreshToken(payload: BackendProfile): string | null {
  return payload.session_refresh?.token?.trim() || null;
}

export type AuthProvider = 'telegram' | 'google' | 'email';

export type AuthIdentityDto = {
  provider: AuthProvider;
  email: string | null;
  linkedAt: string;
  emailVerified?: boolean;
};

export type AuthSessionResponse = {
  token: string;
  profile: BackendProfile;
};

export type AuthSessionRowDto = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
};
