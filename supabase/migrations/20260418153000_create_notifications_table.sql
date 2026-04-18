-- Migration: Create Notifications Table
-- Description: Adds a table to store notifications per user, connected to the Supabase BD instead of AsyncStorage.

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(auth_uid) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Segurança)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- O utilizador só pode ver as SUAS próprias notificações
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- O utilizador pode inserir as SUAS próprias notificações
CREATE POLICY "Users can insert their own notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- O utilizador pode atualizar (ex: marcar como lido) as SUAS próprias notificações
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- O utilizador pode apagar (clear all) as SUAS próprias notificações
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

-- Trigger para definir updated_at se quisermos usar no futuro
CREATE TRIGGER tr_notifications_updated_at 
BEFORE UPDATE ON public.notifications 
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
