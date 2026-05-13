-- Atualizar categorias 'strength' para 'workout' conforme pedido
UPDATE public.contents 
SET category = 'workout' 
WHERE category = 'strength' OR category = 'strength_training';

-- Opcional: Se houver atividades já criadas com essa categoria, atualizar também
UPDATE public.activities
SET category = 'workout'
WHERE category = 'strength';
