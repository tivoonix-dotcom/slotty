export type BackendProfile = {
  id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  full_name: string;
  avatar_url: string | null;
  role: string;
  phone?: string | null;
  address?: string | null;
  privacy_consent_accepted_at?: string | null;
  terms_accepted_at?: string | null;
};
