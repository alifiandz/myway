# Major Discovery owner preview

## A. GitHub verification — VERIFIED with parity limitations

Repository: https://github.com/alifiandz/myway. GitHub reports it as public, with main as the default branch and owner-authorized read/write access. Remote main was e45c48d93400832756bf1737bf0bb038c0c5f56c, dated 9 November 2026. The selected environment initially contained an older snapshot at fb6331f; verification fetched the exact remote and used an isolated clean worktree at /workspace/myway-verify. Feature work is on feature/major-discovery-preview.

The full-source publication record in docs/project-status.md identifies Sites v182 and original source b1bca7d8185f6c531d2d3b3440e3d8b972669fdb. The Sites API independently returned v182 as the latest saved version for the existing MyWay site at mywaypath.com, with that same source SHA. Current GitHub changes document public-copy sanitization, portable admin configuration, build checks and retained product source. Routes, local catalogue and curriculum assets, Worker APIs, migrations, auth integrations and tests are present.

This supports the source baseline and currency against the latest saved hosted version. It does not prove live visual or authenticated service parity. Direct access to mywaypath.com is denied by the executor's outbound policy. The original Sites SHA is not an object in the current GitHub history, so a direct Git diff against that original object was not available. Production account data and private configuration were deliberately excluded from the repository.

## B. Baseline build and tests — PASSED

Before changing application source: npm run install:ci, npm test, npm run typecheck and npm run test:examples all passed. npm test ran the Vinext/Vite Worker build, Sites artifact validation and 132 regression tests; the independent examples passed 10 tests. No tracked application/dependency files were changed during baseline verification. Local server started and returned HTTP 200.

Runtime service names documented by the repository: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_GOOGLE_ENABLED, MYWAY_ADMIN_ACCOUNT_IDS, MYWAY_ADMIN_SECRET, MYWAY_ADMIN_ORIGIN; optional build-time NEXT_PUBLIC_ADMIN_ORIGIN. None were supplied for this isolated preview. Logical storage bindings: DB and BUCKET. No production credentials or records are used.

## C. Existing architecture

React 19, Next-compatible routing through Vinext, Vite 8 and a Cloudflare Worker. Main application views are in app/page.tsx: Explore, university details, shortlist, Pathway, requirements, documents, progress and dashboard. Browser-local guest planning and documents coexist with configured Supabase auth/account sync and private document storage. Catalogue datasets and review records are bundled. Worker routes cover auth configuration, health and feedback/admin endpoints. D1 feedback schemas, R2 bindings and Supabase migration history are retained. A local build does not validate production service configuration or migration replay.

## D. Major Discovery integration

Added /major-explorer-preview and /major-match-preview, sharing a scoped component/style system. Existing application source, navigation, auth and data models are unchanged. The catalogue contains 60 draft canonical concepts across 12 fields, with distinct IDs, subject research prompts, review state and empty programme mappings. Search, field filter, detail dialogs, three-way comparison and saved majors are implemented. Detail views link back to the existing catalogue without claiming a reviewed programme equivalence.

Match exposes the eight original MyWay academic/priorities screens corresponding to proposed screens 11–18. The official interest chapter is visibly held. No official items, RIASEC scores, rankings, fabricated percentages or implicit matching are included. Users can navigate, intentionally skip/clear, review and edit answers. Uncertainty is distinct from absence. Exclusive options and selection caps are enforced.

The separate versioned localStorage key stores only known IDs and question responses, step, completion state, timestamp and versions. Invalid/unknown state is filtered. Instrument/model versions remain null. No cloud sync or analytics receive these answers. Clear controls remove answer/save/compare content. Existing storage keys are not touched.

## E. Scientific/content/licensing readiness

Official O*NET access, exact item IDs/order/text, permitted custom display, attribution and scoring have not been verified; no official instrument is reproduced. Original MyWay questions are experimental and unvalidated. The 60/30/10 proposal is not implemented. All 60 major records are editorial drafts; Indonesian names, detailed curriculum/skills/career claims, source URLs, review dates, expert mappings and university equivalences remain pending. Subject lists are explicitly draft research prompts. No scholarship or admissions claims are inferred.

Before real assessment use: resolve licensing, approve question content and scientific methodology, obtain expert profile/mapping review, establish missing-data and uncertainty rules, conduct sensitivity analysis and student comprehension testing. Student usability research and expert scientific review have not been performed in this coding task.

## F. Blockers and decisions

No source/build blocker was found. Production website comparison is blocked by outbound policy. Shared browser testing was attempted: the Chrome API could not read requirements and native input failed because the AT-SPI provider was unavailable. Therefore browser interactions, visual screenshots, keyboard behavior and mobile rendering are unverified, despite implementation of responsive CSS, semantic fieldsets, native dialogs, focus styles and reduced-motion handling.

The Sites workflow helper is absent from this executor and unavailable through skill resource reads. The fallback uses the supported native Sites API, ordinary authenticated Git and a locally built deployment tar. The new Sites project is owner-private (one allowed owner; no groups), separate from the public production site. No production migration, deployment or service binding is performed.

## G. Validation, preview and rollback

Post-change: TypeScript passed. Full Worker build/artifact checks and all 137 regression tests passed (132 existing + five new Major Discovery tests). The 10 example tests passed at baseline with unchanged example inputs. New tests cover all 60 draft records, limits/exclusivity, defensive storage restoration, version handling, extreme rating inputs, deterministic persistence and blank-vs-unsure. HTTP checks returned 200 with expected server-rendered content for both new routes.

Browser end-to-end, real account sync, production data parity, mobile screenshots and student/expert review remain unverified. No real scoring tests apply because no scoring model is enabled.

Deploy a separate owner-private site, not the public mywaypath.com release. Production rollback is unnecessary because that release is untouched. To withdraw this preview, disable/delete only the new preview site or deploy its prior saved version after one exists. Keep the feature commit separate from the deployment-only manifest commit. Public launch, production configuration, programme mapping and genuine scoring require later review/authorization.
