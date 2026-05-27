# Supabase CI/CD

This repository has a dedicated GitHub Actions workflow at `.github/workflows/supabase-ci-cd.yml`.

## What Runs

- App checks with `npm ci`, `npm audit`, Jest, TypeScript, and Expo web build.
- Smoke validation that the exported web build produced `dist/index.html`.
- Supabase local checks with `supabase db reset`, `supabase db lint`, and pgTAP tests.
- Edge Function checks with `deno lint` and `deno check`.
- Android validation with `expo prebuild`, Gradle debug build, and an APK smoke check.
- Production deploy on pushes to `main`, after all checks pass.
- Manual deploy through `workflow_dispatch` when `deploy_to_supabase` is enabled.

## Tooling Notes

- The workflow pins `SUPABASE_CLI_VERSION` in `.github/workflows/supabase-ci-cd.yml` to avoid GitHub API rate-limit failures when resolving `latest`.
- Update that pinned version intentionally when you want to move the CI environment to a newer Supabase CLI release.

## Required GitHub Secrets

Set these in GitHub under `Settings > Secrets and variables > Actions`:

- `SUPABASE_ACCESS_TOKEN`: Supabase personal access token for the deploy bot/user.
- `SUPABASE_PROJECT_REF`: Supabase project ref, for example the value before `.supabase.co`.
- `SUPABASE_DB_PASSWORD`: Postgres database password for the Supabase project.
- `DEVICE_SYNC_SHARED_SECRET`: Shared secret used by the local device discovery/sync Edge Functions.

Optional existing deploy secrets:

- `NETLIFY_AUTH_TOKEN`
- `SITEID`

## Deploy Behavior

Pull requests only validate locally. Pushes to `main` deploy database migrations and all Edge Functions to the configured Supabase project.

The deploy job now also:

- syncs `DEVICE_SYNC_SHARED_SECRET` into Supabase runtime secrets
- smoke-checks that the latest migration is visible remotely
- smoke-checks that the key Edge Functions are listed after deploy

Do not store Supabase access tokens, service-role keys, or database passwords in committed files.
