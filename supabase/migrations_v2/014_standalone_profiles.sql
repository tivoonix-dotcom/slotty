-- SLOTTY DB v2 — standalone backend auth: public.profiles без FK на auth.users
-- После этой миграции профили создаёт Node.js backend (Telegram initData + JWT), не Supabase Auth.

-- 1) Удалить внешний ключ public.profiles → auth.users (если есть)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname::text AS conname
    FROM pg_constraint c
    JOIN pg_class rel ON rel.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = rel.relnamespace
    JOIN pg_class frel ON frel.oid = c.confrelid
    JOIN pg_namespace fn ON fn.oid = frel.relnamespace
    WHERE n.nspname = 'public'
      AND rel.relname = 'profiles'
      AND c.contype = 'f'
      AND fn.nspname = 'auth'
      AND frel.relname = 'users'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- 2) Default для id (если уже задан — команда идемпотентна по смыслу)
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3) Триггер Supabase Auth → profiles (больше не используется)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4) Функция bootstrap профиля из auth.users (больше не используется)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5) Данные в public.profiles не удаляем

COMMENT ON TABLE public.profiles IS 'Standalone user profiles: managed by SLOTTY Node.js backend (Telegram Web App + JWT). Not tied to auth.users.';

COMMENT ON COLUMN public.profiles.id IS 'Primary key; default gen_random_uuid() in DB or explicit UUID from backend.';

COMMENT ON COLUMN public.profiles.telegram_user_id IS 'Telegram user id (bigint); unique when set; primary handle for Telegram Web App login after initData verification.';
