<div align="center">
  <img src="assets/myway-mark.png" alt="MyWay logo" width="100" />
  <h1>MyWay</h1>
  <p><strong>Your future. Your way.</strong></p>
  <p>Explore your options. Choose your direction. Build your university pathway.</p>
  <p><strong><a href="https://mywaypath.com">Explore MyWay →</a></strong> · <a href="#what-you-can-do">Discover the features</a> · <a href="#run-the-code">Run the code</a></p>
  <p><a href="https://github.com/alifiandz/myway-showcase/actions/workflows/verify.yml"><img src="https://github.com/alifiandz/myway-showcase/actions/workflows/verify.yml/badge.svg" alt="Verify MyWay workflow status" /></a></p>
  <p>
    <img src="https://img.shields.io/badge/React-19.2.6-149eca?style=for-the-badge&amp;logo=react&amp;logoColor=white" alt="React 19.2.6" />
    <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178c6?style=for-the-badge&amp;logo=typescript&amp;logoColor=white" alt="TypeScript 5.9.3" />
    <img src="https://img.shields.io/badge/Vite-8.0.13-646cff?style=for-the-badge&amp;logo=vite&amp;logoColor=white" alt="Vite 8.0.13" />
    <img src="https://img.shields.io/badge/Node.js-22.13%2B-43853d?style=for-the-badge&amp;logo=nodedotjs&amp;logoColor=white" alt="Node.js 22.13 or newer" />
  </p>
  <p><sub>Application stack shown above · Public engineering examples run with Node.js alone</sub></p>
</div>

## A university shortlist is only the beginning.

**MyWay helps students move from “Where could I study?” to “What should I prepare next?”**

Explore business-related university programmes, compare the options that matter to you, and organize your choices into a personal pathway. Put your preferences, requirements, records, evidence, and next actions in context rather than keeping them scattered across tabs and notes.

A Dream university gives you a direction. Target and Alternative choices give you options. Your pathway connects those choices to preparation you can actually work on.

<p align="center"><img src="assets/student-journey.svg" alt="MyWay journey: explore programmes, choose Dream, Target and Alternative universities, and prepare through requirements, records, evidence and actions" width="100%" /></p>

## What you can do

| Your goal | How MyWay helps |
| --- | --- |
| Find a direction that reflects your interests | Explore business-related programmes alongside recorded study information and your preferences. |
| Understand why an option appears relevant | Programme-fit explanations surface contributing factors and missing must-have evidence. |
| Keep your options organized | Save and compare universities, then give each pathway choice a Dream, Target, or Alternative role. |
| Know what preparation involves | Bring requirements, student records, supporting evidence, and actions into a personal pathway. |
| Keep moving between big milestones | Organize tasks and habits and review preparation progress. |
| Pay attention to the right dates | Planning reminders use explicit calendar dates and respect completed actions and preferences. |
| Continue your planning across sessions | Account planning sync includes revision checks and an explicit conflict-resolution path. |

[Take a closer look at the student journey →](docs/product-tour.md)

## Built around clearer decisions

- **Reasons alongside results.** Programme fit explains preference alignment; it is not an admission probability.
- **Missing evidence stays visible.** An unverified must-have should not quietly become a confident recommendation.
- **Dates should be real.** Ambiguous or impossible dates must not become fabricated deadline reminders.
- **Your choices should not disappear silently.** Revision-aware planning sync handles conflicting browser changes explicitly.
- **Information needs upkeep.** The full application includes an operator workspace for reviewing university facts, source evidence, and logos.

MyWay supports preparation and comparison. Admissions decisions, eligibility, fees, and dates must be confirmed with the university’s official sources.

## Current project status

MyWay is a working product project by [Alif](https://github.com/alifiandz), developed through product, design, data, and reliability iterations with AI-assisted implementation.

**This public repository is the engineering showcase:** three runnable modules, ten tests using synthetic data, product documentation, and the decisions behind the work. The complete application is maintained separately and is not included in this repository.

The examples were extracted from the application’s **v133 source snapshot**. Their tests demonstrate selected logic; they do not establish the current live website’s availability, database security, or end-to-end correctness. The v133 application snapshot previously passed TypeScript, a production build, and 48 application tests; that is historical snapshot evidence, not this repository’s test count.

[Read the scope and next priorities →](docs/project-status.md)

## Run the code

Use **Node.js 22.13 or newer**:

```sh
git clone https://github.com/alifiandz/myway-showcase.git
cd myway-showcase
npm test
```

No package installation, account, API key, or production database is required. The command runs all ten public example tests. It does not start the full MyWay website.

GitHub Actions runs the same suite for changes to `main` and for pull requests. Its badge above reports the actual workflow status.

## Engineering you can inspect

| Module | The decision | Verification |
| --- | --- | --- |
| [Programme fit](src/programme-fit.ts) | Separate preferences from must-haves and expose evidence gaps. | Confirmed, missing, and negative evidence; incomplete profiles; selection across a 100-candidate synthetic catalogue. |
| [Account sync](src/account-sync.ts) | Use expected revisions so a stale browser cannot silently overwrite newer planning. | Cross-browser refresh, preserved conflicting local data, and stale-write refusal using an in-memory test backend. |
| [Planning reminders](src/planning-reminders.ts) | Validate explicit calendar dates and scope reminders to the relevant programme. | Due-today, overdue, future-window, completed, paused, invalid-date, and programme-scoped records. |

[Explore the reasoning, tradeoffs, and limitations →](docs/engineering.md)

## Under the hood

| Technology | Role in the full application |
| --- | --- |
| React + TypeScript | Interactive screens, typed product logic, and application state. |
| Next.js conventions + Vinext/Vite | Application structure, development, and build tooling. |
| Tailwind CSS + Lucide | Interface styling and icons. |
| Supabase | Account and catalogue/planning data integrations. |
| Managed database and object storage | Supporting services for feedback workflows. |

The public showcase only needs **Node.js**. Its tests use the built-in Node test runner and synthetic records; they do not contact production services.

```text
assets/                 MyWay branding and student-journey illustration
src/
  programme-fit.ts      Preference alignment and recommendation eligibility
  account-sync.ts       Planning snapshots, revisions, and conflicts
  planning-reminders.ts Calendar validation and reminder selection
tests/                  Ten executable example tests
docs/
  product-tour.md       The student journey and key product concepts
  engineering.md        Three decisions, tradeoffs, and test boundaries
  build-story.md        Product thinking and documented development work
  project-status.md     Publication scope and next priorities
.github/workflows/      Automated example verification
```

## Explore the build

- [Student journey and product guide](docs/product-tour.md)
- [Engineering decisions and limitations](docs/engineering.md)
- [The work behind the screens](docs/build-story.md)
- [Project status and next priorities](docs/project-status.md)

MyWay existed before this public repository. Its initial import is a snapshot, not the project’s start date or a complete record of earlier development.

No production credentials, student records, university database dumps, internal review notes, or deployment configuration are included. No open-source license has been granted by publishing this showcase; public visibility alone does not assign reuse rights.

---

**You do not need every answer to take your next step. Start with a direction.**

[Explore your pathway with MyWay →](https://mywaypath.com)
