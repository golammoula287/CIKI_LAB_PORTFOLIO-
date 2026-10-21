# Deploy to Vercel with Neon and Cloudinary

The repository includes `vercel.json`, uses the Next.js preset and Node.js 24, and runs `npm run build:vercel`. That command validates the environment, generates Prisma Client, and builds Next.js. It does not migrate, seed, or change a database.

1. Import this repository into Vercel. Use the repository root as the Root Directory and keep the checked-in build settings. Leave Output Directory at its Next.js default.
2. Add the following variables to the Production environment. Use your actual public HTTPS address for both URL variables. Your local `.env` is ignored and is not uploaded to Vercel.

```dotenv
DATABASE_URL="your-Neon-pooled-PostgreSQL-connection"
DIRECT_URL="your-Neon-direct-PostgreSQL-connection"
BETTER_AUTH_SECRET="your-random-secret-of-at-least-32-characters"
BETTER_AUTH_URL="https://your-project.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-project.vercel.app"
STORAGE_DRIVER="cloudinary"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

Retain Neon's TLS connection parameters. Copy Cloudinary credentials from the intended product environment. No unsigned upload preset is needed. Uploads are authenticated and served through the app's existing permission checks. These secret variables must not have a `NEXT_PUBLIC_` prefix.

3. Initialize the production database from a trusted local terminal, with `.env` pointing to the intended production Neon database:

```sh
npm ci
npm run db:generate
npm run db:deploy
npm run db:seed
```

Review migrations and confirm a database recovery point before applying them to an existing database. Run these commands once per required migration/initialization, rather than from every preview build.

4. For the first owner, temporarily add `OWNER_EMAIL`, `OWNER_NAME`, and `OWNER_PASSWORD` (12–128 characters) to your local `.env`, then run `npm run owner:create`. Remove those variables afterward. Never put bootstrap credentials in the Vercel build configuration.
5. Deploy on Vercel. Check `/api/health`, `/api/ready`, `/login`, and `/admin`. Upload a small image, verify draft access and publication, and check the gallery.
6. When adding a custom domain, update both URL variables to its HTTPS origin and redeploy. Restart the local dev server after local environment changes.

Use a separate Neon branch, Cloudinary product environment, and authentication secret for Preview deployments. Both URL variables must match the preview origin being tested; configure a stable preview domain if needed. Never point previews at production data by default. The build deliberately fails if required variables are absent or URLs still use HTTP/localhost.

The local `.env` should retain `http://localhost:3000` URL values for local development. Use `npm run build` for a local production build; the Vercel build validates HTTPS deployment values.

## Upload limits

Images are limited to 4 MB, leaving multipart overhead below Vercel's 4.5 MB Function payload limit. The browser rejects oversized files before sending, and the server independently validates size, format, and pixel count. Processed WebP images are also bounded to 4 MB for delivery. Supporting larger originals requires a direct-upload design with equivalent server-side validation; changing the byte limit alone is insufficient.

Cloudinary originals and derived images use authenticated access. Existing assets keep their original storage driver; local disk assets must be migrated separately before using them on Vercel. No migration is performed automatically.

References: [Vercel payload limits](https://vercel.com/docs/functions/limitations), [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json), [Cloudinary access control](https://cloudinary.com/documentation/control_access_to_media).

## Connect your own domain

The public site, `/admin`, and `/api` share one Vercel project and one domain. No separate backend deployment or API subdomain is needed.

1. Open your Vercel project, then **Settings → Domains → Add Domain**. Add your actual domain, for example `example.com`, and add `www.example.com` if you want both addresses.
2. Choose one primary address and configure the other to redirect to it in Vercel.
3. At the DNS provider that manages your domain, add exactly the DNS records displayed by Vercel for each address. Use the project's current suggested A record for the apex and CNAME target for `www`; do not copy a generic IP from an old tutorial. Preserve unrelated mail and verification records.
4. Wait for Vercel to show valid configuration and an active HTTPS certificate.
5. Set Production `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the same primary HTTPS origin, such as `https://example.com`. Redeploy. Keep `BETTER_AUTH_SECRET` unchanged so this change does not unnecessarily rotate the signing secret.
6. Sign in again at `https://example.com/login`; test `/admin`, upload, publishing, sitemap URLs, and redirects from the alternate address. Sessions from the previous hostname do not transfer to the new hostname.

Domain ownership and DNS verification must be completed in your Vercel and registrar accounts after you push. The repository does not need your actual domain hardcoded.

Official guide: [Vercel custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
