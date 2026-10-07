# Administrador Motorfort

O fluxo administrativo usa Supabase Auth com e-mail e senha. Nenhuma senha deve ser adicionada ao repositório.

## Criar o primeiro administrador

1. No painel do projeto Supabase Motorfort, abra **Authentication → Users → Add user**.
2. Cadastre o e-mail e uma senha temporária forte.
3. Edite o usuário e defina administrativamente o `app_metadata`:

```json
{
  "role": "admin"
}
```

O backend aceita `/api/sync` e `/api/sync/preview` somente quando o access token é válido e `app_metadata.role` é `admin`. Não use `user_metadata` para autorização, pois esse campo pode ser alterado pelo próprio usuário.

## Variáveis

- Frontend: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Backend: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

A service role nunca deve ser exposta em variáveis `VITE_*` nem enviada ao navegador.
