# CIKI Lab — Project Planning

Planning baseline: 11 October 2026.

This repository contains the full-stack research lab website and its admin CMS. Public pages run without credentials; database-backed staff access requires Neon and authentication configuration. No live Neon database or hosting has been provisioned.

The working project name, CIKI Lab, comes from the workspace name and should be confirmed before branding is finalized.

## Documents

- [Admin handover](docs/ADMIN.md): first sign-in, content entry, publishing, staff access, and recovery.
- [Vercel deployment](docs/VERCEL.md): deploy with Neon and Cloudinary, configure environment variables, and initialize the database.

- [Development setup](docs/SETUP.md): run locally, connect Neon, provision the first owner, and understand implementation limits.
- [Operations](docs/OPERATIONS.md): deployment, storage, recovery, and monitoring.
- [Project context](docs/PROJECT_CONTEXT.md): requirements, sitemap, admin capabilities, assumptions, and scope.
- [Architecture and boilerplate](docs/ARCHITECTURE.md): technology choices, folder structure, backend boundaries, database model, and security.
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md): delivery phases, acceptance criteria, testing, and launch checklist.

## Intended solution

A full-stack TypeScript application using Next.js for the public website, dedicated admin dashboard, and backend; Neon PostgreSQL for persistent data; and Prisma for database access and migrations.

The architecture keeps the familiar separation of a MERN application—presentation, request handling, business logic, and persistence—inside one Next.js project. React supplies the UI, Next.js supplies backend entry points, and PostgreSQL replaces MongoDB.

## Run locally

```sh
npm ci
npm run db:generate
npm run dev
```

Open http://localhost:3000. Follow the setup guide to enable staff login and persistence. Dependencies are pinned with a committed npm lockfile.
