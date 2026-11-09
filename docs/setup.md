# Local setup and service boundaries

## Browser and build

Use Node.js 22.13 or newer and npm. Run `npm ci`, then `npm run dev`. The retained build uses Vinext/Vite and Cloudflare runtime tooling; Linux is the recommended environment for reproducible builds and CI.

Run `npm run typecheck`, `npm test`, and `npm run test:examples`. `npm test` builds and validates the Worker before running the full regression suite. No live account or secret is needed for tests using mocks and fixtures.

## Your own services

This source snapshot is not preconnected to the author’s production services. A local catalogue and assets are included, but database-backed features require your own accounts, schemas, policies, and runtime configuration.

The Worker reads these values from its runtime environment:

| Setting | Purpose |
| --- | --- |
| `SUPABASE_URL` | Your Supabase project URL. |
| `SUPABASE_PUBLISHABLE_KEY` | Browser-safe key exposed by `/api/auth-config`; never use a service-role/secret key here. |
| `SUPABASE_GOOGLE_ENABLED` | Whether the configured provider is enabled (`true` or `false`). |
| `MYWAY_ADMIN_ACCOUNT_IDS` | Optional comma-separated platform-authenticated admin account IDs. Empty by default. Only use behind a trusted identity-header provider. |
| `MYWAY_ADMIN_SECRET` | Optional server-only admin integration secret. Keep it out of browser code and Git. |
| `MYWAY_ADMIN_ORIGIN` | Exact allowed administrator portal origin for feedback API CORS. |

`NEXT_PUBLIC_ADMIN_ORIGIN` is build-time public configuration for the admin connection window. Set it to the exact origin of your administrator portal. The connection fails clearly if it is absent; it is never a secret.

Local Cloudflare runtime values can be provided through an ignored `.dev.vars` file; deployment values belong in the hosting provider’s runtime configuration. `.dev.vars.example` documents the names only. Build-time `NEXT_PUBLIC_` settings belong in an ignored `.env.local` or your build environment. Verify that your chosen local runtime loads the values before using connected features.

## Database and storage

`supabase/migrations/` contains schema, function, and access-policy history, not production records. Review the sequence and validate it on a disposable Supabase project before applying it to any shared database. Migration replay and a complete production access-policy audit are separate work; publishing this repository does not perform either.

D1 feedback schemas are under `db/` and `drizzle/`. The portable `.openai/hosting.json` declares logical `DB` and `BUCKET` bindings without a production project identity. Configure your own D1/R2 bindings when deploying the Worker. Do not add the original project’s identity or private data just to make a local demo work.

Local file handling uses browser storage. Account cloud documents also depend on the corresponding private storage bucket, metadata schema, authentication, and ownership policies. A successful local build does not prove that those services are correctly configured.

## Administrator security

The platform-header administrator allowlist is empty unless configured. Supabase admin authorization still checks the authenticated user and stored profile role. Never let a public reverse proxy forward arbitrary client-supplied identity headers as trusted identity.

No credentials, account database exports, private student files, feedback screenshots, or production configuration are bundled. Keep the supplied example records synthetic.

## Deployment

`dist/` is a Worker artifact, not an ordinary static export. It needs a compatible Worker host and configured backing services. The public CI workflow verifies source; it does not deploy or run database migrations. Review a separate environment before any future production release.
