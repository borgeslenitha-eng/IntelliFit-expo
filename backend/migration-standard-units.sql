-- Unidades de estoque padronizadas: un, g, kg, ml e L.
-- Caixa, pacote, lata e garrafa deixam de ser unidade. Lotes antigos
-- cadastrados assim passam a "un" (a contagem é preservada) e podem ser
-- ajustados depois, ex.: "atualize o leite para 8 L".
-- Idempotente: pode rodar a cada inicialização.
UPDATE foods
   SET unit = 'un'
 WHERE LOWER(TRIM(unit)) IN (
    'caixa', 'caixas', 'pacote', 'pacotes', 'pct',
    'lata', 'latas', 'garrafa', 'garrafas'
 );
