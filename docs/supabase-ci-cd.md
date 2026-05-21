# Supabase CI/CD

This repository has a dedicated GitHub Actions workflow at `.github/workflows/supabase-ci-cd.yml`.

## What Runs

- App checks with `npm ci`, `npm audit`, Jest, TypeScript, and Expo web build.
- Supabase local checks with `supabase db reset`, `supabase db lint`, and pgTAP tests.
- Edge Function checks with `deno lint` and `deno check`.
- Production deploy on pushes to `main`, after all checks pass.
- Manual deploy through `workflow_dispatch` when `deploy_to_supabase` is enabled.

## Required GitHub Secrets

Set these in GitHub under `Settings > Secrets and variables > Actions`:

- `SUPABASE_ACCESS_TOKEN`: Supabase personal access token for the deploy bot/user.
- `SUPABASE_PROJECT_REF`: Supabase project ref, for example the value before `.supabase.co`.
- `SUPABASE_DB_PASSWORD`: Postgres database password for the Supabase project.

Optional existing deploy secrets:

- `NETLIFY_AUTH_TOKEN`
- `SITEID`

## Deploy Behavior

Pull requests only validate locally. Pushes to `main` deploy database migrations and all Edge Functions to the configured Supabase project.

Do not store Supabase access tokens, service-role keys, or database passwords in committed files.
