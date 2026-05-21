-- Criar tabela de dispositivos para suportar Health Connect e dispositivos de rede
CREATE TABLE IF NOT EXISTS public.devices (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    source TEXT, -- 'health_connect', 'network', 'spotify', etc.
    status TEXT DEFAULT 'connected',
    user_id UUID REFERENCES public.users(auth_uid) ON DELETE CASCADE,
    home_id INTEGER REFERENCES public.homes(id) ON DELETE CASCADE,
    external_id TEXT, -- Para ID da Health Connect ou MAC Address
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dispositivos" ON public.devices;
CREATE POLICY "Usuários podem ver seus próprios dispositivos" 
ON public.devices FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios dispositivos" ON public.devices;
CREATE POLICY "Usuários podem gerenciar seus próprios dispositivos" 
ON public.devices FOR ALL 
TO authenticated 
USING (user_id = auth.uid());
