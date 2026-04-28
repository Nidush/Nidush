-- Migration: Add Spotify synchronization columns to users table
-- Date: 2026-04-28

-- 1. Adicionar colunas para suporte ao Spotify
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS spotify_connected BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS spotify_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS spotify_refresh_token TEXT;

-- 2. Garantir que as políticas de RLS permitem a leitura/escrita destas colunas
-- (Normalmente já incluído nas políticas de select/update existentes)

COMMENT ON COLUMN public.users.spotify_token IS 'Access token for Spotify API integration';
COMMENT ON COLUMN public.users.spotify_connected IS 'Flag indicating if the user has a linked Spotify account';
