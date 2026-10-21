# Verification record

## Functional release checkpoint — 21 October 2026

Verified with Node.js 24.22.0. UI redesign and additional features are deferred.

- Production build and TypeScript checks passed.
- ESLint and Prettier passed.
- 13 unit tests passed, including Cloudinary signed authenticated operations and Vercel configuration failures.
- 9 integration test results passed against isolated PGlite, covering migrations, idempotent seeds, drafts, publication, permissions, media references, settings, staff invitations, recovery, and last-owner protection.
- Browser acceptance passed against the production build with an isolated database and matching Chromium: owner sign-in, dashboard, page drafts/publication, local image upload and archive privacy, recruitment deadlines, achievements, settings, staff invitations, editor permissions, last-owner protection, sitemap, and mobile navigation.
- HTTP smoke checks passed against the live Neon-backed production server: 13 public/login routes, 16 protected admin redirects, missing routes, health, upload authorization, private media, sitemap, and invalid routes. `/api/ready` returned HTTP 200 after migrations and seed.
- The configured live Neon pooled and direct endpoints were reachable. Both repository migrations were applied to the previously empty database. The catalog seed completed.
- After the user updated Cloudinary credentials, live authenticated upload, signed image read, and deletion passed. The live check exposed a missing download timestamp, which was fixed and covered by the adapter test. Temporary test images were deleted.
- Production dependency audit reported zero known vulnerabilities during this session.
- The first live owner account requires user-supplied local bootstrap credentials. No default account was created.
- Vercel deployment, domain/DNS changes, backup restore, monitoring, and approved lab content remain external launch steps. The assistant has not pushed, committed, or deployed the site.

See [VERCEL.md](VERCEL.md) for hosting and custom domains and [ADMIN.md](ADMIN.md) for owner provisioning and content administration.

## Earlier local checkpoint

Verified locally on 12 October 2026 with Node.js 24.6.0. No live Neon database or deployed environment was used.

| Check | Result |
| --- | --- |
| Prisma schema and client generation | Passed |
| SQL migrations | Both migrations applied to isolated PGlite PostgreSQL; seed idempotency verified |
| TypeScript and production build | Passed |
| ESLint and Prettier | Passed |
| Unit tests | 10 passed: achievement rules, disclosure, roles, URLs, content validation, deadlines, pagination, image normalization, and request limits |
| Integration tests | 9 reported tests passed (suite plus 8 subtests): publishing, draft isolation, stale edits, redirects, archiving, permissions, media references, settings, invitations, recovery, and last-owner protection |
| Browser workflows | Passed against a production build using headless Microsoft Edge and an isolated test database |
| HTTP smoke checks | 13 public/login routes, 16 protected admin redirects, missing-page handling, health, upload authorization, private media, invalid routes, and sitemap passed |
| Production dependency audit | Zero known vulnerabilities at verification time |
| Full dependency audit | Five development-tool entries remain from the upstream braces advisory; see SETUP.md |

## Browser coverage

The browser suite exercises actual forms and server actions: owner sign-in, dashboard, page drafts and publication, preservation of private revisions, image uploads, album publication and archive access revocation, recruitment deadline filtering, achievement authors and publication, settings publication, invitation acceptance, editor restrictions, and last-owner protection. The sitemap includes published achievements and excludes archived albums.

Desktop and mobile home screenshots were generated and visually inspected. At 390px width the page has no horizontal overflow and mobile navigation opens correctly. No browser runtime errors were observed. Screenshots use synthetic lab settings and remain ignored under test-results/.

The browser harness waits for completed form responses before inspecting the embedded database. This avoids overlapping direct test queries with application transactions on PGlite's shared backend. These checks do not establish production multi-connection concurrency behavior.

## Remaining deployment verification

User-provided credentials and infrastructure are still required to verify Neon TLS and pooling, production migration application, owner bootstrap in the live environment, private S3 storage, hosting and domain configuration, monitoring, backup restoration, and concurrent production updates. Local uploads and real password sign-in were tested; no invitation email delivery is implemented (owners share private links themselves).

Approved lab copy, member details, publications, recruitment information, and photographs still need to be entered and reviewed. The site has not been deployed.

## Commit checkpoint

Phase 1 foundation is complete; the current working tree also contains the subsequently requested CMS modules. The code is ready for the user's review and commit. The assistant has not staged or committed any files. Review the scope before committing; this working tree is broader than Phase 1 alone.
