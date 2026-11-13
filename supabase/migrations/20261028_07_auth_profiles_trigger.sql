-- ====================================================================
-- SJ STUDIO / SJ KICKS Auth Profiles Trigger
-- Migration: 20261028_07_auth_profiles_trigger.sql
-- Implements:
-- 1. Automated profile creation on auth.users AFTER INSERT
-- 2. Fixed search_path (public, pg_temp) and SECURITY DEFINER
-- 3. Strict anti-privilege escalation: role hardcoded to 'customer'
-- 4. Safe conflict handling for duplicate / existing records
-- ====================================================================

-- Function: handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    role,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      ''
    ),
    COALESCE(
      NULLIF(TRIM(NEW.phone), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
      NULL
    ),
    'customer', -- STRICT: Never allow self-assigned 'admin' from client metadata
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), ''),
      NULL
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' 
      THEN EXCLUDED.full_name 
      ELSE public.profiles.full_name 
    END,
    phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();
    -- NOTE: 'role' is never overwritten on conflict to preserve admin status

  RETURN NEW;
END;
$$;

-- Trigger: on_auth_user_created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Revoke execution from untrusted public roles and grant to authorized internal roles
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, supabase_auth_admin;
