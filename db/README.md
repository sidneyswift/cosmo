# Cosmo's Supabase

You have a Postgres database. Use it when an app you build needs persistence.

## What this is for

Apps you build that need a database (or benefit from one). Examples: a web app
backend, a job queue, a logging table, an event store for some service.

## What this is NOT for

Your own memory, knowledge, observations, soul. That stays in
`~/.openclaw/workspace/` as files (`MEMORY.md`, `memory/YYYY-MM-DD.md`, etc.).
Don't migrate that here. It already works.

## Project

- Project ref: `kbrjagevyqsskfmdqjup`
- URL: `https://kbrjagevyqsskfmdqjup.supabase.co`
- Source of truth for credentials: 1Password → Agents → "Cosmo Supabase Project"
  (no copies on disk except the bootstrap service-account token)

To use credentials in a script — source the helper, env vars populate from
1Password at runtime via the cosmo-agent service account:

```bash
. ~/.openclaw/credentials/supabase-env.sh
psql "$SUPABASE_DB_URL" -c '\dt'
```

Exposes: `SUPABASE_URL`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_URL`,
`SUPABASE_DB_PASSWORD`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (when populated).

Or in node (with `pg`):

```js
import { execSync } from 'node:child_process';
// Source the helper into env, then read process.env
const env = execSync('. ~/.openclaw/credentials/supabase-env.sh && env', { encoding: 'utf-8' });
for (const line of env.split('\n')) {
  const m = line.match(/^(SUPABASE_[A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2];
}
import pg from 'pg';
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL });
```

## Schema convention

One Postgres schema per app you build. Keeps things namespaced and makes
permissions easy to scope later.

- `app_<appname>` — every app you build gets its own schema
- `shared` — only used when 2+ apps need to reference the same table
  (don't create it preemptively; promote when the need is real)
- `public` — leave empty / extensions only

Avoid the schemas Supabase reserves: `auth`, `storage`, `realtime`,
`extensions`, `vault`, `graphql`, `pgsodium`.

## Adding an app

1. Pick a name. e.g. `app_mailcat`
2. Add a migration in `migrations/` (Supabase CLI generates these:
   `supabase migration new create_app_mailcat_schema`)
3. The migration creates `CREATE SCHEMA app_mailcat;` and any tables
4. Apply: `supabase db push` (against linked remote project)
5. Your app connects via `SUPABASE_DB_URL` and uses
   `SET search_path TO app_mailcat;` or fully-qualified table names

## Cross-app linking

If two apps end up needing the same record (e.g. a `users` table you want
shared), promote it to the `shared` schema with its own migration. Other apps
reference it as `shared.users`. Don't force this — let it emerge from real
duplication, not anticipation.

## Things you have access to

- `supabase` CLI — for migrations, type generation, local dev (`supabase start`
  spins up a local Docker Postgres if you want to test offline)
- Direct postgres connection via `$SUPABASE_DB_URL` (postgres user, full DDL)
- Service role key (when populated) for REST/auth API calls that bypass RLS

## Things to avoid

- Don't put secrets in the code or in migrations — use env vars
- Don't blow away schemas you didn't create (e.g. anything Supabase manages)
- Don't enable RLS on your app schemas unless you actually need it; it's
  overhead for internal tooling. Only matters if you expose the DB to
  untrusted clients.
