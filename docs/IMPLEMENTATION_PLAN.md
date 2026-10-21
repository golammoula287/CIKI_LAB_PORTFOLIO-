# Implementation plan

## Delivery approach

Build a complete achievement-management slice first: database record, validation, permissions, draft editor, preview, publishing, public listing, and detail page. Use this proven structure for the remaining modules.

Phases are ordered by dependency. Calendar estimates should be set after design, staffing, content readiness, and provider choices are known.

## Phase 1 — Foundation and runnable boilerplate

Tasks:

- Confirm official project name, staff sign-in method, hosting, media provider, and environment ownership.
- Scaffold Next.js App Router with TypeScript, styling, linting, formatting, and one lockfile.
- Add the folder boundaries defined in the architecture specification.
- Configure environment validation and safe example variables.
- Create public and admin shells, navigation, error/loading/empty states, and shared form/table components.
- Connect a development Neon database and configure Prisma generation and migration commands.
- Integrate staff login, session handling, permissions, and first-owner provisioning.
- Configure CI for lint, type checking, tests, and production build.

Done when: a clean checkout can run using documented setup; a migration works on an empty development database; anonymous users cannot read admin data or invoke admin mutations; no credentials are committed.

## Phase 2 — Data model and achievement slice

Tasks:

- Implement content identities, typed revision tables, publication pointers, relations, constraints, and audit events.
- Seed the six research departments and five member categories idempotently.
- Implement achievement list/editor, author ordering, type-specific validation, year/status filters, and public detail pages.
- Add draft preview, explicit disclosure approval for under-review work, publish, archive, and stale-edit handling.
- Add cache invalidation and safe error handling.

Done when: an editor can draft an achievement; an admin can publish it; public pages reflect that revision; subsequent draft edits stay private; archived and unapproved under-review entries are absent from public reads, counts, related lists, and sitemap.

## Phase 3 — Public website and core content administration

Tasks:

- Implement Home, About, mission/vision, research ethics/policy, and Contact.
- Implement research department index/detail pages and admin editors.
- Implement people, memberships, advisory panel placement, and related achievements.
- Add global settings, reusable SEO fields, navigation, and responsive page layouts.
- Implement draft/revision workflows consistently across content modules.

Done when: every implemented public section is editable from the dashboard; people can appear in membership and advisory contexts without duplication; changes respect publication boundaries.

## Phase 4 — Recruitment and gallery

Tasks:

- Build positions, eligibility, how-to-apply, benefits, and FAQ management.
- Display clear position states and timezone-aware deadlines; expired positions must stop appearing as open even if public pages are cached.
- Support an application instructions block or approved external application link.
- Implement authorized upload initiation/finalization, media metadata, album editor, captions, alt text, and ordering.
- Protect private assets and prevent deletion of referenced assets.

Done when: recruitment covers all five source-diagram subsections; applicants can follow accurate application instructions; authorized staff can publish an album; invalid uploads are rejected; private media is inaccessible to anonymous visitors.

## Phase 5 — Admin completion and quality

Tasks:

- Finish dashboard counts, draft queues, and recent activity using permission-aware queries.
- Complete staff invitations, access revocation, role management, and last-owner protection.
- Add search, pagination, and filters across admin lists.
- Review mobile navigation, keyboard interaction, form errors, and image performance.
- Add canonical metadata, social previews, sitemap, redirects, robots configuration, and noindex for private previews/admin pages.
- Load approved lab content and remove demonstration content.

Done when: all source-diagram content can be maintained from admin; users can complete editing workflows on small screens; public metadata excludes private content; revoked users lose effective access.

## Phase 6 — Staging, launch, and handover

Tasks:

- Provision isolated staging and production environments with correctly scoped secrets.
- Rehearse migrations and seed/setup behavior against a fresh environment.
- Verify backup retention, restore procedure, observability, and failure alerts.
- Complete lab review of content, public research disclosures, media permissions, and contact details.
- Run critical end-to-end checks in staging and verify metadata, links, and deadlines.
- Prepare a deployment rollback procedure that accounts for database migration compatibility.
- Provide setup, deployment, admin editing, and recovery documentation.

Done when: the staging acceptance checks pass, production configuration is ready, and the lab has reviewed launch content. Publishing to a live host is a separate deployment action after implementation.

## Required verification during implementation

| Area | Meaningful checks |
| --- | --- |
| Access control | Anonymous, editor, admin, owner, and revoked-user behavior against actual server operations; private previews and assets |
| Editorial workflow | Draft creation, publishing, later private edits, archiving, concurrent edits, and related-record publication behavior |
| Achievements | Type/status compatibility, multiple years, external authors, filters, pagination, and private under-review visibility |
| Persistence | Migrations from empty database, idempotent seeds, foreign-key behavior, and rollback-compatible deployment procedure |
| Media | File signature/size rejection, unauthorized upload/fetch denial, referenced-file deletion protection |
| Recruitment | Open/closed behavior at deadline boundaries and timezone display |
| Public experience | Mobile layouts, keyboard navigation, form labels, broken links, metadata, and sitemap exclusions |
| Reliability | Safe errors, no leaked secrets, bounded database queries, restored backup validation |

Prioritize unit tests for business rules, integration tests for database/permission boundaries, and browser tests for a small number of complete workflows. Avoid tests that merely duplicate static page copy.

## Launch acceptance checklist

- [ ] Home includes lab introduction, mission/vision, about, ethics, and policy access.
- [ ] Contact includes approved office and phone details.
- [ ] Achievements support conferences, journals, book chapters, patents, and editable years.
- [ ] All six initial research departments are present.
- [ ] Advisory panel and all five membership categories are represented as appropriate to actual content.
- [ ] Recruitment includes positions, eligibility, application instructions, benefits, and FAQs.
- [ ] Gallery supports albums, photos, captions, and alt text.
- [ ] Admin manages all public data in scope without code edits.
- [ ] Drafts, private media, and staff-only fields remain private.
- [ ] Permissions, revocation, backups, migrations, and production build have been verified.
- [ ] Real content has been reviewed; fabricated claims and sample credentials are absent.

## Later extensions

If needed, scope online applications as a separate increment with applicant data fields, private CV storage, consent wording, retention rules, reviewer permissions, submission limits, and notification delivery. Similarly scope contact forms, member logins, automated publication imports, and multilingual content before introducing their tables and services.

## Current deliverable status

Planning complete: project context, requirements mapping, architecture, database design, phased delivery plan, and acceptance criteria.

Application implementation now covers Phases 1–5: all planned content/admin modules, normalized achievement authors and department links, publication/restore workflows, media storage adapters, settings, staff access/recovery, search/pagination, metadata, sitemap, and audit history. The shared revision implementation is described in ARCHITECTURE.md.

Local verification uses an isolated PostgreSQL-compatible database and browser workflows. The exact executed checks and limitations are recorded in [VERIFICATION.md](VERIFICATION.md). Live Neon/provider connectivity, production load tests, real content review, backup restore, hosting, and domain configuration remain Phase 6 tasks dependent on the user's credentials, infrastructure, and approved content. No external infrastructure has been provisioned or website deployed.

Git checkpoint: the user owns all commits. The assistant must report the verified checkpoint and must not commit changes.


## Functional release checkpoint — 21 October 2026

Phases 1–5 have passed current integration and browser acceptance checks; UI redesign and additional features are deferred. Vercel build configuration, environment validation, Cloudinary storage integration, custom-domain instructions, and admin handover are implemented. The configured live Neon database has been migrated and seeded.

Phase 6 is partially complete: repository preparation and local acceptance are verified. Pending external items are the first real owner account, Vercel deployment, domain/DNS verification, backup restore/monitoring, and approved public content. These items must not be marked complete until performed. See the current checkpoint in VERIFICATION.md.

Cloudinary follow-up: updated credentials and the corrected download timestamp passed live upload, authenticated read, and deletion checks. The first owner account still requires the user to fill the temporary owner fields in `.env`.
