# Project setup

## Application scope

The application implements the public research lab website and its dedicated admin dashboard:

- Editable Home, About, ethics/policy, recruitment guidance, and other public page introductions.
- Department editors, member/advisor profiles, membership categories, and related department links.
- Achievement drafts, normalized ordered authors, department relations, type/year/status/search filters, public details, and URL redirects.
- Recruitment positions, explicit deadlines, application links, eligibility, benefits, and FAQs.
- Gallery albums, ordered photographs, captions, required alt text, and private media storage.
- Lab identity, navigation labels, office/phone/email, social links, timezone, and SEO settings.
- Owner/admin/editor permissions, staff invitations, password recovery links, account password changes, access revocation, and audit history.
- Search/pagination, draft preview, publish/archive/restore workflows, stale-edit protection, sitemap, metadata, and responsive layouts.

Database and hosting credentials are intentionally not included. Approved lab copy, people, publications, photos, and contact details still need to be supplied; no academic credentials or achievements have been invented.

## Run locally

Use Node.js 24 and npm. From the project directory:

```powershell
npm ci
npm run db:generate
npm run dev
```

Open http://localhost:3000. Without database credentials, the public shell and initial research catalog remain available. Staff access stays disabled. Once a database is configured, public pages read its published records; a connection failure is not disguised as an empty database.

## Connect Neon

1. Copy `.env.example` to `.env` (ignored by Git).
2. Set `DATABASE_URL` to your Neon pooled development connection and `DIRECT_URL` to its direct migration connection. Retain the TLS options supplied by Neon.
3. Set `BETTER_AUTH_SECRET` to a cryptographically random value of at least 32 characters.
4. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the same origin, such as `http://localhost:3000` locally. Restart the server after changing the environment.
5. Apply both supplied migrations and run the idempotent seed:

```powershell
npm run db:deploy
npm run db:seed
```

Seeds create the six initial research departments and five membership categories. They also create private page drafts. Re-running seeds preserves existing edits and does not create staff passwords. Existing phase-one Department rows are retained for compatibility; the seed imports their values into the revision-based content model on first run.

For later schema changes, use `npm run db:migrate -- --name meaningful_change` in development. Review and retain the generated SQL. Production uses `db:deploy`, never schema push.

## First owner

Temporarily set `OWNER_EMAIL`, `OWNER_NAME`, and a unique `OWNER_PASSWORD` of 12–128 characters in the ignored `.env` or secure process environment:

```powershell
npm run owner:create
```

The script hashes the password using Better Auth, creates the credential account atomically, records an audit event, and refuses if an owner already exists. Remove the password environment variable afterward. Sign in at `/login` and open `/admin`.

## Staff invitations and recovery

Only owners can open `/admin/users`. Create an invitation for a new staff member or a recovery link for an existing active account. Copy the private link and send it directly to its intended recipient using your chosen channel. The application does not automatically send email.

Links expire after 24 hours, are single-use, and are stored only as hashes. A newly issued link invalidates previous links for the same email. The recipient sets a password; recovery preserves their existing role and revokes sessions. Revoking or changing staff access also invalidates sessions and outstanding links. The final active owner cannot be demoted or disabled.

Signed-in staff can change their password at `/admin/account`. Keep at least two trusted owner accounts for recovery. If all owners lose access, the database operator can use the explicitly documented owner recovery command in OPERATIONS.md.

## Images and storage

Local development uses `STORAGE_DRIVER=local` and an ignored `.storage` directory. This requires persistent disk and is not suitable for ephemeral serverless filesystems.

For Cloudinary on Vercel, set the following in `.env` and Vercel environment settings:

```dotenv
STORAGE_DRIVER=cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Find these credentials in your Cloudinary product environment. Keep the secret server-side. Uploads use authenticated assets; images continue to pass through the application's access checks. No unsigned upload preset or public delivery domain is required. Existing local or S3 assets retain their recorded storage driver and are not automatically migrated. Redeploy after changing Vercel environment variables.

For S3-compatible hosting, set:

```dotenv
STORAGE_DRIVER=s3
S3_BUCKET=your-private-bucket
S3_REGION=your-region
# Optional for non-AWS S3 providers:
S3_ENDPOINT=https://your-storage-endpoint
S3_FORCE_PATH_STYLE=false
```

Supply AWS credentials securely through `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` or the hosting platform's IAM role. The account needs object put/get/delete permissions for the application's bucket. Keep the bucket private; browsers receive images through `/api/media/[id]` after the application checks publication or staff access.

Uploads accept non-animated JPEG/PNG/WebP up to 4 MB and 40 million pixels. Images are decoded, stripped of metadata, bounded to 2400 pixels, and re-encoded as WebP. SVG and arbitrary file uploads are not supported. The server bounds the request body independently of client headers and checks the request origin. Files are private until used by a published revision or saved as the public site logo.

Archiving content removes its publication-based image access unless another published record or the site logo still uses the same asset. Image responses use no-store to avoid serving stale private content. Already downloaded files cannot be recalled. Deletion is allowed only for unreferenced images; revision history also counts as a reference.

## Editorial workflows

1. Upload needed images in the media library.
2. Open a content module, create or edit a record, and save a draft.
3. Expand the saved-revision preview and review it.
4. An owner/admin publishes the saved revision. Editors can prepare drafts but cannot publish.
5. Later edits remain private until republished. Stale forms cannot overwrite a newer revision.
6. Archive removes public access; restore returns the record to a private draft.

Publish departments before people, positions, or achievements that reference them. Person membership and advisory placement are independent; a person can appear in both without duplicate records. An accepted paper can remain a website draft. Under-review research requires explicit administrator disclosure approval before publication.

Core page addresses are fixed. Other content/achievement slug changes take effect on publishing; old addresses redirect directly to the record's current address. SEO and related lists use published revisions only. Recruitment deadline input is explicitly UTC and public display uses the timezone configured in Settings (Asia/Dhaka by default).

Settings and category labels use explicit immediate saves; they do not use the page-draft workflow. Body content uses plain text and structured sections, not executable HTML or MDX.

## Verification commands

```powershell
npm run db:generate
npm run lint
npm run typecheck
npm run format:check
npm test
npm run test:integration
npm run build
npm run test:e2e
```

Integration and browser tests create their own isolated, in-memory PostgreSQL-compatible database, apply both SQL migrations, and use synthetic data. They do not use Neon or your configured production database. Browser tests start and stop their own Next.js production server; build first. On Windows they use installed Edge when available. On other systems run `npx playwright install chromium` first. Test screenshots go to ignored `test-results/`.

For a separate HTTP smoke check, start `npm start` in one terminal and run `npm run test:smoke` in another. `SMOKE_BASE_URL` can point to a different local test origin.

## Remaining external setup

Connect Neon and the selected production storage provider, supply approved content, configure the production domain/HTTPS, verify backup retention and restore on the chosen Neon plan, and deploy to a Node-compatible Next.js host. See [OPERATIONS.md](OPERATIONS.md) and [VERIFICATION.md](VERIFICATION.md). Local database tests do not establish Neon networking, TLS, pooling, backup, or multi-process concurrency behavior.

Production dependencies use overrides for patched `deepmerge-ts` and `mysql2`. The previously observed unresolved `braces` advisory is confined to the Next.js lint-tool chain; do not downgrade framework lint tooling blindly to satisfy npm's automatic suggestion. Recheck the dependency audit before deployment.

## Git ownership

The assistant does not make commits. After the verified checkpoint is reported, the user reviews the files and commits them. Never stage `.env`, `.storage`, test outputs, generated Prisma code, or npm caches.
