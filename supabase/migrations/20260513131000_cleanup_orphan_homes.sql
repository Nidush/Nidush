-- Atualização do trigger para incluir limpeza de casas órfãs

-- Recriar trigger function com limpeza de casas órfãs
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deletar usuário da tabela public.users
  DELETE FROM public.users WHERE auth_uid = OLD.id;

  -- Limpar casas órfãs (casas sem nenhum usuário associado E sem dependências)
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

-- Recriar função de limpeza de casas órfãs (mais segura)
CREATE OR REPLACE FUNCTION public.cleanup_orphan_homes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Deletar casas que não têm nenhum usuário associado E não têm dependências
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

-- Executar limpeza de casas órfãs
SELECT public.cleanup_orphan_homes();
