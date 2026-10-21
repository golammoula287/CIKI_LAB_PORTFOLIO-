<p align="center">
  <img src="public/brand/ciki-full-logo.png" alt="CIKI — Cognexa Center for Intelligence, Knowledge, and Innovation" width="300" />
</p>

<h1 align="center">CIKI Research Community</h1>

<p align="center">
  A research institution website with an integrated publishing dashboard.
  <br />
  Built with Next.js, TypeScript, Neon PostgreSQL, and Cloudinary.
</p>

---

## About

CIKI stands for **Cognexa Center for Intelligence, Knowledge, and Innovation**. This application brings the center’s research departments, people, publications, opportunities, and photographs into one website, with a dedicated workspace for staff to manage and publish content.

The public website, admin dashboard, authentication, and API run in **one Next.js application**, prepared for deployment to Vercel. No separate backend deployment is required.

## What’s built

### Public website

- A responsive blue brand identity using the supplied CIKI logo, Plus Jakarta Sans headings, and Inter body text served locally.
- A full-screen introduction with up to three overlapping uploaded photographs, gentle transitions, and reduced-motion support.
- Research department listings and detail pages.
- Member profiles, membership categories, and a separate advisory panel.
- Research achievements covering conferences, journals, book chapters, and patents, with search and type, year, and status filters.
- Recruitment positions, deadlines, application links, and FAQs.
- Photo albums with captions and alternative text.
- Editable institutional pages, contact information, navigation labels, metadata, and sitemap.
- Keyboard-accessible navigation and responsive desktop, tablet, and mobile layouts.

### Admin dashboard

- An overview of content, publications, media, drafts, deadlines, and recent activity.
- Draft editing, saved-revision previews, explicit publication, archiving, and restoration.
- Protection against overwriting another staff member’s newer edits.
- Image uploads and a media library with reference tracking and private access for unpublished images.
- Site identity, contact details, timezone, and membership category management.
- Staff invitations, password recovery links, password changes, and access revocation.
- Activity history for content and staff changes.

| Role          | Access                                                               |
| ------------- | -------------------------------------------------------------------- |
| Editor        | Prepare content drafts and upload images                             |
| Administrator | Publish content, manage settings and categories, and review activity |
| Owner         | Administrator capabilities plus staff access and role management     |

Staff access is invitation-based. There is no public registration or default admin password. Invitations and recovery links are shared manually; the app does not send email automatically.

## Technology

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| Application      | Next.js 16, React 19, TypeScript             |
| Styling          | Custom CSS with reusable brand tokens        |
| Database         | Neon PostgreSQL                              |
| Database access  | Prisma 7                                     |
| Authentication   | Better Auth                                  |
| Image storage    | Cloudinary with authenticated media access   |
| Image processing | Sharp                                        |
| Validation       | Zod                                          |
| Verification     | ESLint, Node test runner, PGlite, Playwright |
| Deployment       | Vercel, Node.js 24                           |

## Run locally

**Requirements:** Node.js 24, npm, a Neon database, and Cloudinary credentials with image upload permission.

```sh
npm ci
cp .env.example .env
```

Fill in these values in your local `.env`:

```dotenv
DATABASE_URL="your-neon-pooled-connection"
DIRECT_URL="your-neon-direct-connection"
BETTER_AUTH_SECRET="your-random-secret-of-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STORAGE_DRIVER="cloudinary"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

Keep the TLS parameters supplied by Neon. Generate an authentication secret locally with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Initialize a new database and start the application:

```sh
npm run db:generate
npm run db:deploy
npm run db:seed
npm run dev
```

Open [localhost:3000](http://localhost:3000). The catalog seed creates initial research departments, membership categories, and private page drafts; it does not create staff accounts or fictional publications.

### Create the first owner

For a new database, temporarily add `OWNER_EMAIL`, `OWNER_NAME`, and `OWNER_PASSWORD` to your ignored `.env`. Use a password of 12–128 characters, then run:

```sh
npm run owner:create
```

Remove those temporary variables afterward. Sign in at `/login` and open `/admin`. If you are reusing the database already initialized for this project, use the existing owner account instead.

## Deploy to Vercel

1. Push the repository and import it into Vercel.
2. Use the **Next.js** preset, repository root, and **Node.js 24**. The checked-in `vercel.json` sets installation and build commands.
3. Add the nine variables in [`.env.production.example`](.env.production.example) to Vercel’s Production environment.
4. Set `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the same actual HTTPS deployment address.
5. Deploy and verify `/api/health`, `/api/ready`, `/login`, and `/admin`.

The Vercel build validates configuration, generates Prisma Client, and builds the app. Database migrations, seeding, and owner creation run separately; they are not executed on every deployment. Reusing your existing Neon database and Cloudinary environment preserves content, staff accounts, and images.

For your own domain, add it in Vercel’s domain settings, apply the DNS records Vercel supplies, update both application URL variables, and redeploy. Keep local `.env` URLs set to localhost.

See the [deployment guide](docs/VERCEL.md) for migration steps, preview environments, image limits, and custom-domain setup.

## Development commands

| Command                    | Purpose                                                 |
| -------------------------- | ------------------------------------------------------- |
| `npm run dev`              | Start the development server                            |
| `npm run build`            | Generate Prisma Client and create a production build    |
| `npm start`                | Serve the production build locally                      |
| `npm run build:vercel`     | Validate deployment variables and build for Vercel      |
| `npm run lint`             | Check code with ESLint                                  |
| `npm run typecheck`        | Check TypeScript                                        |
| `npm test`                 | Run unit tests                                          |
| `npm run test:integration` | Run database integration tests                          |
| `npm run test:e2e`         | Run browser workflows against an isolated test database |
| `npm run db:deploy`        | Apply committed database migrations                     |

For browser tests, build first and install Chromium with `npx playwright install chromium`. GitHub Actions runs formatting, lint, type checks, tests, the production build, and a production dependency audit.

## Project structure

```text
src/
  app/
    (public)/       Public pages and research content
    admin/          Staff dashboard
    api/            Authentication, uploads, media, and health endpoints
  components/       Shared interface components
  features/         Content schemas, editors, and forms
  server/           Authentication, database, services, and storage
prisma/             Database schema, migrations, and catalog seed
public/brand/       CIKI brand assets
scripts/            Setup, deployment checks, and browser verification
tests/             Unit and integration tests
docs/              Setup, administration, design, and operations guides
```

## Security and publishing

Staff mutations enforce authentication and permissions on the server. Invitations use expiring, single-use hashed tokens. Media access follows publication status; uploads have size, format, and pixel limits and are re-encoded before storage. Browser security headers block framing and restrict embedded objects and form destinations.

Never commit credentials or populated environment files. Demo data is opt-in for testing and should not be seeded into production. See the [security review](docs/SECURITY_REVIEW.md) for the review scope and the remaining unpatched development-tool dependency advisory.

## Documentation

- [Local setup](docs/SETUP.md)
- [Admin guide](docs/ADMIN.md)
- [Vercel and custom domains](docs/VERCEL.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Brand and design system](docs/DESIGN.md)
- [Operations and recovery](docs/OPERATIONS.md)
- [Verification notes](docs/VERIFICATION.md)
- [Optional demo data](docs/DEMO_DATA.md)

## Future scope

Researcher self-service accounts, blog submissions, and further community features are planned extensions. They are not part of the current staff publishing workflow.
