# Development security baseline — 11 November 2026

This preparation branch starts at public `main` commit `e45c48d`. It changes no product designs, production services, database schemas, or deployment configuration. Merge and deployment require the owner's explicit approval.

## Repository and history review

Fetched all advertised branch heads, tags, and pull-request heads without rewriting history. The original local checkout remains recoverable on its existing `work` branch. The review covered 205 reachable commits and 1,167 unique file blobs, including the archive and existing feature/Dependabot branches. Private repositories and unreachable/deleted Git objects are outside this scope.

Gitleaks 8.30.1 (release archive checksum verified) scanned all refs: 201 commits containing changes, about 33.3 MB. One generic-key match was a literal mock screenshot key in the original import's regression test. `.gitleaksignore` records only that exact historical fingerprint; no detector or path is broadly excluded. A rerun passed. Additional path/content review found no private-key blocks, SQL COPY exports, database files, credential archives, or student-document files. Email candidates were public institutional/product contacts and synthetic fixtures; Git author contacts are contributor metadata, not student records.

All 461 unique PNG/WebP blobs were inventoried and visually reviewed in contact sheets. Four product screenshots were also OCR reviewed. They show example university choices/preparation, no identifiable student records or uploaded documents. The other assets are institutional logos, product branding, and a map. Metadata inspection found design-tool metadata in third-party logos, including a Canva tool/document/user identifier and an `admin` creator label; these are asset provenance, not account credentials. No student or GPS metadata was identified. This review cannot prove the absence of steganography or identify real people from arbitrary unlabelled content. No historical objects were deleted or republished.

## Dependency remediation

Updated Next.js/eslint-config-next to 16.4.6, React/React DOM/React Server DOM to 19.3.1, Vite to 8.3.8, Vinext to 0.2.1, the Cloudflare Vite plugin to 1.68.0, Wrangler to 4.157.0, and the RSC plugin to 0.5.39. Refreshed compatible transitive dependencies in the lockfile. The `image-size` override pins the compatible 2.1.0 parser, removing denial-of-service advisories inherited through Vinext's older parser dependency.

Vinext 1.4.5 was evaluated but introduces a `cloudflare:` artifact import incompatible with the existing direct Node artifact check. The selected earlier release retains the existing artifact contract. The upgraded Miniflare runtime test uses its documented V4-options adapter and a fully local outbound service; unexpected destinations cannot fall through to the network.

The final registry audit reports zero critical/high findings. Moderate findings remain in Drizzle's legacy esbuild tooling, ESLint/minimatch, and Vinext's Satori/OG dependency chain. They are not suppressed: CI fails at high severity and prints all findings. Do not expose a Drizzle/esbuild development server or add user-controlled OG/SVG generation without resolving the relevant moderate finding. No blind `npm audit fix --force` or schema-tool downgrade was used. An audit is time-sensitive and is not proof that production is patched; this branch has not been deployed.

## Solo-developer GitHub controls

Observed active `Protect MyWay Main` ruleset: PR required, deletion and non-fast-forward updates blocked, no bypass actors, zero approving reviews. Keep zero required reviews for solo development. The owner must still explicitly authorize each merge; automation must not merge merely because checks pass.

After this PR's workflows run successfully, make these exact job names mandatory, with the branch required to be current:

- `Check full application and examples` (type checking, build/artifact validation, regression and isolated authorization tests, engineering examples).
- `Dependency security` (all locked dependencies, fails on high/critical).
- `Full history secret scan` (all fetched history, redacted output).

Also require conversation resolution and retain the existing force-push/deletion restrictions. No external reviewer is required. CI permissions remain `contents: read`; none of these jobs deploys or runs migrations. Dependabot version updates are proposed in repository configuration; an existing Dependabot branch already demonstrates bot activity.

The integration cannot verify administrative secret-scanning/push-protection, Dependabot alert, code-scanning, or Actions policy settings. Repository metadata omitted those fields and the classic protection endpoint returned integration permission denial. The owner should verify secret scanning, push protection, dependency graph/alerts/security updates, read-only default Actions permissions, and disabled Actions PR auto-approval in GitHub settings. No administrative settings were changed by this branch. CodeQL can be added later as a separately measured check; do not require an untested check name that would permanently block solo merges.

## Isolated local work

Use `npm ci`, `npm run dev:isolated`, then the printed loopback URL. This launcher refuses local `.env*`/`.dev.vars*` files other than examples and inherited application-service settings. It binds to 127.0.0.1 and keeps runtime configuration under ignored `.sites-runtime/`. It has no service credentials. Bundled public catalogue browsing works; account configuration returns 503, admin visibility is false, and private feedback access returns 403. Do not seed real student data or connect production to make those disabled features appear functional.

`npm test` builds and verifies the artifact and full regression suite. `npm run test:isolated` runs synthetic account/document/Worker authorization tests with default global fetch rejected; explicit local mock transports supply the only backend responses. Cases include invalid tokens, ordinary-user denial, configured administrator success, guest/forged identity denial, account switching, cross-account document isolation, and stale planning conflicts. These validate application boundaries, not deployed Postgres RLS. The tests use reserved synthetic endpoints, mock storage, and fake accounts.

Browser smoke verification used Chromium with all external origins blocked: landing rendered, navigation reached `#explore` with the 100-institution guest catalogue, and account/admin endpoints failed closed. No page errors occurred. This is a focused smoke test, not a complete visual or accessibility audit.

No database migrations were run, including locally. Before implementing any backend-dependent Major Match storage/auth changes, obtain approval for a disposable database environment and validate migration replay, two-user RLS/storage isolation, role escalation denial, and recovery there. Never reuse production credentials. Platform identity headers may be trusted only behind a provider that strips client-supplied headers; the isolated launcher leaves that administrator allowlist empty.
