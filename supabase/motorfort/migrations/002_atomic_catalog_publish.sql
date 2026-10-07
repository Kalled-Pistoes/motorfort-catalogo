-- Publicação integral e atômica do catálogo Motorfort.
-- Cada chamada de função PostgreSQL executa em uma única transação.

CREATE OR REPLACE FUNCTION public.publish_catalog_import(
  p_import_id UUID,
  p_dataset JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_import_status TEXT;
  v_rows_published INTEGER;
BEGIN
  IF p_import_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'import_id é obrigatório';
  END IF;

  IF p_dataset IS NULL OR jsonb_typeof(p_dataset) <> 'array' OR jsonb_array_length(p_dataset) = 0 THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'dataset do catálogo não pode estar vazio';
  END IF;

  -- Bloqueia o registro durante a publicação e confirma a associação válida.
  SELECT status
    INTO v_import_status
    FROM public.catalog_imports
   WHERE id = p_import_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'importação não encontrada';
  END IF;

  IF v_import_status <> 'validated' THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = format('importação deve estar validated; status atual: %s', v_import_status);
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_dataset) AS item
     WHERE jsonb_typeof(item) <> 'object'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'cada item do dataset deve ser um objeto JSON';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_dataset) AS item
     WHERE NULLIF(btrim(item->>'cod'), '') IS NULL
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'todos os produtos devem possuir cod não vazio';
  END IF;

  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(p_dataset) AS item
     WHERE jsonb_typeof(item->'disponivel') IS DISTINCT FROM 'boolean'
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'disponivel deve ser um boolean JSON em todos os produtos';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM jsonb_array_elements(p_dataset) AS item
     GROUP BY lower(btrim(item->>'cod'))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23505', MESSAGE = 'dataset contém códigos duplicados';
  END IF;

  -- DELETE e INSERT pertencem à mesma transação da RPC. Qualquer erro posterior
  -- desfaz ambos e mantém o catálogo anterior visível.
  DELETE FROM public.catalogo_produtos;

  INSERT INTO public.catalogo_produtos (
    cod, pa, descricao, grupo, montadora, veiculo, ano_aplicacao, motor,
    sobremedida, qtd_pistoes, diametro_cilindro, ref_metal_leve_sulloy,
    ref_anel_kalled, espessura_canaletas, anel_kalled, observacao, tipo,
    combustivel, medida_haste, comprimento_total, image_url, lancamentos,
    disponivel, updated_at
  )
  SELECT
    btrim(row.cod), row.pa, row.descricao, row.grupo, row.montadora,
    row.veiculo, row.ano_aplicacao, row.motor, row.sobremedida,
    row.qtd_pistoes, row.diametro_cilindro, row.ref_metal_leve_sulloy,
    row.ref_anel_kalled, row.espessura_canaletas, row.anel_kalled,
    row.observacao, row.tipo, row.combustivel, row.medida_haste,
    row.comprimento_total, row.image_url, coalesce(row.lancamentos, false),
    row.disponivel, now()
  FROM jsonb_to_recordset(p_dataset) AS row(
    cod TEXT,
    pa TEXT,
    descricao TEXT,
    grupo TEXT,
    montadora TEXT,
    veiculo TEXT,
    ano_aplicacao TEXT,
    motor TEXT,
    sobremedida TEXT,
    qtd_pistoes INTEGER,
    diametro_cilindro NUMERIC,
    ref_metal_leve_sulloy TEXT,
    ref_anel_kalled TEXT,
    espessura_canaletas TEXT,
    anel_kalled TEXT,
    observacao TEXT,
    tipo TEXT,
    combustivel TEXT,
    medida_haste TEXT,
    comprimento_total TEXT,
    image_url TEXT,
    lancamentos BOOLEAN,
    disponivel BOOLEAN
  );

  GET DIAGNOSTICS v_rows_published = ROW_COUNT;

  UPDATE public.catalog_imports
     SET status = 'published',
         rows_published = v_rows_published,
         finished_at = now(),
         error_message = NULL
   WHERE id = p_import_id;

  RETURN v_rows_published;
END;
$$;

COMMENT ON FUNCTION public.publish_catalog_import(UUID, JSONB) IS
  'Substitui o catálogo e conclui catalog_imports atomicamente. Falhas revertem toda a chamada.';

-- Funções recebem EXECUTE de PUBLIC por padrão; restringir explicitamente.
REVOKE ALL ON FUNCTION public.publish_catalog_import(UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_catalog_import(UUID, JSONB) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_catalog_import(UUID, JSONB) TO service_role;
