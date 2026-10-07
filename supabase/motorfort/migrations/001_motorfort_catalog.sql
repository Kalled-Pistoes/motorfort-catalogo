-- Motorfort Catalog - schema inicial independente.
-- Aplicar somente no futuro projeto Supabase Motorfort.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.catalogo_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cod TEXT NOT NULL,
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
  lancamentos BOOLEAN NOT NULL DEFAULT false,
  disponivel BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT catalogo_produtos_cod_unique UNIQUE (cod),
  CONSTRAINT catalogo_produtos_cod_not_blank CHECK (btrim(cod) <> '')
);

-- ILIKE com curingas nos campos pesquisados pelo catálogo.
CREATE INDEX idx_catalogo_cod_trgm ON public.catalogo_produtos USING gin (cod gin_trgm_ops);
CREATE INDEX idx_catalogo_referencia_principal_trgm ON public.catalogo_produtos USING gin (ref_metal_leve_sulloy gin_trgm_ops);
CREATE INDEX idx_catalogo_referencia_anel_trgm ON public.catalogo_produtos USING gin (ref_anel_kalled gin_trgm_ops);
CREATE INDEX idx_catalogo_montadora_trgm ON public.catalogo_produtos USING gin (montadora gin_trgm_ops);
CREATE INDEX idx_catalogo_veiculo_trgm ON public.catalogo_produtos USING gin (veiculo gin_trgm_ops);
CREATE INDEX idx_catalogo_motor_trgm ON public.catalogo_produtos USING gin (motor gin_trgm_ops);
CREATE INDEX idx_catalogo_grupo ON public.catalogo_produtos (grupo);
CREATE INDEX idx_catalogo_lancamentos_true ON public.catalogo_produtos (cod) WHERE lancamentos = true;
CREATE INDEX idx_catalogo_sem_estoque ON public.catalogo_produtos (cod) WHERE disponivel = false;

ALTER TABLE public.catalogo_produtos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalogo_produtos FROM anon, authenticated;
GRANT SELECT ON public.catalogo_produtos TO anon, authenticated;
CREATE POLICY catalogo_public_read ON public.catalogo_produtos FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.visitantes_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT NOT NULL,
  estado TEXT NOT NULL,
  cnpj TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT visitantes_catalogo_telefone_unique UNIQUE (telefone)
);

ALTER TABLE public.visitantes_catalogo ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.visitantes_catalogo FROM anon, authenticated;
GRANT INSERT ON public.visitantes_catalogo TO anon, authenticated;
CREATE POLICY visitantes_public_insert_only ON public.visitantes_catalogo FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.catalog_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  rows_received INTEGER NOT NULL DEFAULT 0,
  rows_valid INTEGER NOT NULL DEFAULT 0,
  rows_invalid INTEGER NOT NULL DEFAULT 0,
  rows_published INTEGER NOT NULL DEFAULT 0,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT catalog_imports_status_check CHECK (status IN ('processing', 'validated', 'published', 'failed')),
  CONSTRAINT catalog_imports_row_counts_check CHECK (rows_received >= 0 AND rows_valid >= 0 AND rows_invalid >= 0 AND rows_published >= 0),
  CONSTRAINT catalog_imports_warnings_array_check CHECK (jsonb_typeof(warnings) = 'array')
);

CREATE INDEX idx_catalog_imports_created_at ON public.catalog_imports (created_at DESC);
CREATE INDEX idx_catalog_imports_status ON public.catalog_imports (status);
ALTER TABLE public.catalog_imports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.catalog_imports FROM anon, authenticated;

COMMENT ON COLUMN public.catalogo_produtos.ref_anel_kalled IS 'Nome legado preservado temporariamente para compatibilidade.';
COMMENT ON COLUMN public.catalogo_produtos.anel_kalled IS 'Nome legado preservado temporariamente para compatibilidade.';
