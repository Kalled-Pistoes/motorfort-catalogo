# Supabase Motorfort

Infraestrutura oficial do catálogo Motorfort.

## Migrations aplicadas

1. `001_motorfort_catalog.sql`: tabelas, índices, extensão `pg_trgm` e RLS.
2. `002_atomic_catalog_publish.sql`: RPC de publicação integral e atômica.
3. `003_fix_atomic_publish_delete.sql`: compatibilidade do `DELETE` integral com a proteção do ambiente.

Não execute novamente migrations já aplicadas. As migrations históricas do CRM não fazem parte deste projeto.

## Fluxo ativo

```text
XLSX
→ parse
→ normalização
→ validação
→ catalog_imports(validated)
→ publish_catalog_import
→ catalogo_produtos + catalog_imports(published)
```

Uma falha durante a RPC reverte integralmente a substituição e preserva o catálogo anterior. O backend registra a falha separadamente em `catalog_imports`.

## Segurança

- Catálogo público: leitura por anon/publishable key.
- Administração: Supabase Auth com `app_metadata.role = "admin"`.
- Importação: backend com service role.
- RPC: `SECURITY INVOKER`, `search_path` fixo e execução concedida somente à service role.
- A service role nunca é enviada ao navegador.

## Storage

Bucket `motorfort-produtos`:

- leitura pública;
- escrita e exclusão somente administrativas/service role.

## Compatibilidade técnica

`ref_anel_kalled` e `anel_kalled` permanecem temporariamente no contrato do schema, parser e planilha. A eventual renomeação exige uma etapa própria de compatibilidade.
