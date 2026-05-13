export type BackendProfile = {
  id: string;
  telegram_user_id: number | null;
  telegram_username: string | null;
  full_name: string;
  avatar_url: string | null;
  role: string;
};
