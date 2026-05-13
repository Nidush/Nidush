-- Garantir que a tabela contents permite leituras a todos os utilizadores autenticados!
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de contents a toda a gente" ON public.contents;

CREATE POLICY "Permitir leitura de contents a toda a gente" 
ON public.contents 
FOR SELECT 
USING (true);
