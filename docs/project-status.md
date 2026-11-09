# Project status and publication scope

## The product and this repository

MyWay is a university preparation product project. This public repository explains its student journey and publishes selected working engineering logic. It is not a full application distribution.

| Included here | Maintained separately |
| --- | --- |
| Three TypeScript engineering modules | Full frontend and application services |
| Ten tests with synthetic data | Production database and access policies |
| Branding and a product-journey illustration | University catalogue and source-review data |
| Product and engineering documentation | Real student records and account data |
| GitHub Actions example verification | Deployment configuration and credentials |

The illustration in the README explains the product journey; it is not a screenshot of a live screen.

## What verification demonstrates

`npm test` runs the public ten-test suite without a package install or a production connection. The tests exercise programme-fit rules, client planning sync, and reminder validation.

Passing those tests supports the demonstrated behavior. It is not evidence of production availability, server authorization, admissions-data accuracy, or complete app correctness.

The source excerpts originate from v133. Historical results for that full application snapshot are documented separately from the public suite. They should not be read as a current production audit.

## Next priorities

These are development directions, not promises of shipped features:

1. Use more structured, source-backed programme evidence to reduce ambiguity in text matching.
2. Represent tuition currencies, fee periods, and applicant categories explicitly.
3. Expand integration checks for real persistence and account boundaries.
4. Continue verifying requirements and dates against official university sources.
5. Improve the clarity of preparation progress and missing evidence through student feedback.

## Publication boundaries

No real student data, production credentials, database exports, private operator notes, or deployment configuration should be added to this repository. Example changes should use synthetic records.

The full application remains separate. No open-source license has been assigned to this showcase; public access does not automatically grant broad reuse rights.
