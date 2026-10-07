-- Casos locais para executar futuramente após aplicar migrations 001 e 002.
-- O script inteiro termina em ROLLBACK e não deve ser usado em produção.
BEGIN;

DO $$
DECLARE
  v_import UUID;
  v_failed_import UUID;
  v_count INTEGER;
BEGIN
  INSERT INTO public.catalogo_produtos (cod, disponivel) VALUES ('CATALOGO-A', true);

  -- Publicação válida: somente B permanece e booleanos são preservados.
  INSERT INTO public.catalog_imports (filename, status, rows_received, rows_valid)
  VALUES ('valid.xlsx', 'validated', 2, 2) RETURNING id INTO v_import;

  PERFORM public.publish_catalog_import(v_import, '[
    {"cod":"B-1","lancamentos":false,"disponivel":true},
    {"cod":"B-2","lancamentos":true,"disponivel":false}
  ]'::jsonb);

  IF EXISTS (SELECT 1 FROM public.catalogo_produtos WHERE cod = 'CATALOGO-A')
     OR (SELECT count(*) FROM public.catalogo_produtos) <> 2
     OR NOT EXISTS (SELECT 1 FROM public.catalogo_produtos WHERE cod = 'B-1' AND disponivel = true)
     OR NOT EXISTS (SELECT 1 FROM public.catalogo_produtos WHERE cod = 'B-2' AND disponivel = false) THEN
    RAISE EXCEPTION 'falha no cenário de publicação válida/disponibilidade';
  END IF;

  -- Dataset vazio: a exceção é capturada em subtransação; catálogo B permanece.
  INSERT INTO public.catalog_imports (filename, status) VALUES ('empty.xlsx', 'validated') RETURNING id INTO v_failed_import;
  BEGIN
    PERFORM public.publish_catalog_import(v_failed_import, '[]'::jsonb);
    RAISE EXCEPTION 'dataset vazio deveria falhar';
  EXCEPTION WHEN SQLSTATE '22023' THEN NULL;
  END;
  IF (SELECT count(*) FROM public.catalogo_produtos) <> 2 THEN RAISE EXCEPTION 'dataset vazio alterou o catálogo'; END IF;

  -- Código duplicado: bloqueado antes do DELETE.
  INSERT INTO public.catalog_imports (filename, status) VALUES ('duplicate.xlsx', 'validated') RETURNING id INTO v_failed_import;
  BEGIN
    PERFORM public.publish_catalog_import(v_failed_import, '[{"cod":"DUP","disponivel":true},{"cod":"dup","disponivel":false}]'::jsonb);
    RAISE EXCEPTION 'duplicidade deveria falhar';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  IF (SELECT count(*) FROM public.catalogo_produtos) <> 2 THEN RAISE EXCEPTION 'duplicidade alterou o catálogo'; END IF;

  -- Erro durante INSERT (conversão numérica): DELETE também deve ser revertido.
  INSERT INTO public.catalog_imports (filename, status) VALUES ('invalid-number.xlsx', 'validated') RETURNING id INTO v_failed_import;
  BEGIN
    PERFORM public.publish_catalog_import(v_failed_import, '[{"cod":"BROKEN","diametro_cilindro":"não-numérico","disponivel":true}]'::jsonb);
    RAISE EXCEPTION 'conversão inválida deveria falhar';
  EXCEPTION WHEN invalid_text_representation THEN NULL;
  END;
  SELECT count(*) INTO v_count FROM public.catalogo_produtos;
  IF v_count <> 2 THEN RAISE EXCEPTION 'erro durante INSERT deixou catálogo intermediário'; END IF;
END;
$$;

ROLLBACK;
