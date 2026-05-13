-- ============================================================
-- Adicionar coluna password_hash à tabela public.users
-- O hash é copiado de auth.users (gerido pelo Supabase Auth)
-- Nunca é a password em texto limpo — é sempre bcrypt ($2b$...)
-- ============================================================

-- 1. Adicionar coluna se não existir
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS password_hash text;

-- 2. Preencher com os hashes existentes de auth.users
UPDATE public.users u
SET password_hash = a.encrypted_password
FROM auth.users a
WHERE u.auth_uid = a.id
  AND a.encrypted_password IS NOT NULL;

-- 3. Atualizar o trigger que cria utilizadores para também copiar o hash
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_uid, email, first_name, last_name, password_hash)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.encrypted_password   -- bcrypt hash, nunca a password real
  )
  ON CONFLICT (auth_uid) DO UPDATE
    SET email         = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash;

  RETURN NEW;
END;
$$;

-- 4. Garantir que o trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
