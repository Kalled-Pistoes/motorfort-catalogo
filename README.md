# Motorfort Catálogo Digital

Catálogo público de produtos Motorfort com busca, filtros e área administrativa para validação e publicação atômica de planilhas.

## Stack

- React
- TypeScript
- Vite
- Supabase
- Vercel
- SheetJS

## Funcionalidades

- catálogo público com busca e filtros;
- disponibilidade e lançamentos;
- tema claro e escuro;
- autenticação administrativa via Supabase Auth;
- preview e validação de planilhas;
- publicação atômica do catálogo.

## Estrutura

```text
api/                    API serverless e importação
frontend/               aplicação React/Vite
supabase/motorfort/      migrations, testes SQL e documentação
vercel.json              build e roteamento da Vercel
```

## Setup local

```bash
npm run install:all
npm run build
npm run lint
npm test
```

Para executar o frontend durante o desenvolvimento:

```bash
npm run dev
```

## Variáveis de ambiente

Backend:

```text
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Frontend:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

A service role é exclusiva do backend e nunca deve ser exposta em uma variável `VITE_*`.

## Rotas

- `/`: catálogo público;
- `/login`: autenticação administrativa;
- `/sync`: preview e publicação protegidos;
- `/api/sync`: publicação serverless;
- `/api/sync/preview`: preview serverless.

Consulte `supabase/motorfort/AUTH_ADMIN.md` para administração de usuários.
