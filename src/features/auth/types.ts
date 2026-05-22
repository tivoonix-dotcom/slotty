export type BackendProfile = {
  id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  full_name: string;
  avatar_url: string | null;
  header_avatar_url?: string | null;
  role: string;
  phone?: string | null;
  address?: string | null;
  /** Email из привязки email или Google. */
  account_email?: string | null;
  privacy_consent_accepted_at?: string | null;
  terms_accepted_at?: string | null;
};

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
