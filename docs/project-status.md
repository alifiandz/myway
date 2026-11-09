# Full-source publication and provenance

## What changed

This repository originally published three extracted engineering modules and ten synthetic-data tests. It now includes the full application source snapshot from Sites version 182, alongside those preserved examples under `examples/engineering/`.

Source baseline: `b1bca7d8185f6c531d2d3b3440e3d8b972669fdb`. The application files in the existing private GitHub import were compared with that Sites checkout; matching files were byte-identical before public-copy sanitization.

## Included and excluded

| Included | Excluded |
| --- | --- |
| Pages, shared application logic, styles and landing experience | Production student/account/feedback records |
| Public catalogue inputs and source/asset records used by the app | Private documents, database exports and feedback attachments |
| Worker/API code and database/schema migrations | Credentials, environment values and Git authentication material |
| Regression tests and build tooling | Dependencies, caches, generated builds and deployment archives |
| Current transparent MyWay logo | Original production project identity and owner-specific admin allowlist |

Runtime catalogue/source-review files required by the app are retained as application inputs; they are not exports of private account or operator database rows. Database migrations define schema/policy behavior without carrying over live student data.

## Publication adaptations

- The production Sites ID is removed from the portable hosting manifest.
- The platform administrator allowlist and portal origin are configurable instead of embedding the original account ID and private portal host. Missing admin configuration fails closed.
- One Worker test uses a synthetic admin ID and explicit test configuration.
- Type-check and independent-example scripts are added. The lockfile’s package name matches MyWay; dependency versions are unchanged.
- Old operational handoffs and source-import review notes are not republished as current setup instructions.

The UI, product logic, and current transparent logo are otherwise retained. The live site, runtime services, migrations, and original private repository were not modified.

## Verification boundaries

The full regression suite builds and tests the application, including runtime mocks. The original ten-test example suite remains independently runnable. Current results should be read from the verification workflow; they are not a certification of a live production database, access policies, migration replay, or admission-data accuracy.

The old three-module engineering notes describe v133 excerpts and their limitations. Those historical examples do not replace the newer full application modules under `app/`.
