-- Migração para sincronizar usuários entre auth.users e public.users
-- Adiciona trigger para deletar usuários órfãos e função para limpeza

-- Trigger function para deletar usuário da public.users quando deletado do auth.users
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletar usuário da tabela public.users
  DELETE FROM public.users WHERE auth_uid = OLD.id;

  -- Limpar apenas casas totalmente órfãs, sem membros nem dependências.
  DELETE FROM public.homes h
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_homes uh WHERE uh.home_id = h.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.rooms r WHERE r.home_id = h.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.activities a WHERE a.home_id = h.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.routines rt WHERE rt.home_id = h.id
  );

  RETURN OLD;
END;
$$;

-- Trigger para executar quando usuário é deletado do auth
CREATE OR REPLACE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deleted();

-- Função para limpar usuários órfãos (que existem em public.users mas não em auth.users)
CREATE OR REPLACE FUNCTION public.cleanup_orphan_users()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Deletar usuários que existem em public.users mas não em auth.users
  DELETE FROM public.users
  WHERE auth_uid NOT IN (
    SELECT id FROM auth.users
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log do resultado
  RAISE NOTICE 'Deleted % orphan users from public.users', deleted_count;

  RETURN deleted_count;
END;
$$;

-- Função para limpar casas órfãs (que existem em homes mas não têm usuários associados)
CREATE OR REPLACE FUNCTION public.cleanup_orphan_homes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Deletar apenas casas totalmente órfãs, sem membros nem dependências.
  DELETE FROM public.homes h
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_homes uh WHERE uh.home_id = h.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.rooms r WHERE r.home_id = h.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.activities a WHERE a.home_id = h.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.routines rt WHERE rt.home_id = h.id
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Log do resultado
  RAISE NOTICE 'Deleted % orphan homes from public.homes', deleted_count;

  RETURN deleted_count;
END;
$$;

-- Executar limpeza inicial
SELECT public.cleanup_orphan_users();
SELECT public.cleanup_orphan_homes();
