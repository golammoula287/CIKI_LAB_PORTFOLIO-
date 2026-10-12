# Deployment and operations

## Deployment sequence

1. Choose a Node-compatible Next.js host. Configure a production Neon branch and private S3-compatible bucket separately from development/preview.
2. Supply environment variables from `.env.example` using the host's secret manager. Use the public HTTPS origin consistently for authentication and metadata.
3. Run `npm ci`, `npm run db:generate`, and `npm run build` against the reviewed source and lockfile.
4. Take or confirm a recoverable database checkpoint according to your Neon plan. Apply migrations with `npm run db:deploy`, then run `npm run db:seed` if the content catalog has not been initialized.
5. Provision the first owner through a secure operator environment. Remove temporary password variables immediately afterward.
6. Start the app with `npm start`. Verify `/api/health` for process health and `/api/ready` for authentication configuration plus database reachability.
7. Check sign-in, a draft/save/publish/archive cycle, media upload/private access, deadline rendering, and sitemap on the actual host.
8. Load and review approved content before public launch. Do not treat synthetic test data or working branding as approved lab content.

No cloud resources or deployments are created automatically by this codebase.

## Permissions and secrets

Use a least-privileged database role for runtime where supported and an appropriate migration role for deployment. Keep database, authentication, and storage credentials server-only. Do not put secrets in `NEXT_PUBLIC_` variables. Better Auth rate limits use the database, so limits survive application instance restarts.

Only owners manage staff roles, invitations, and recovery links. Share the generated links privately. They are not automatically emailed, logged, or retrievable later. Maintaining two trusted owners avoids relying on database-operator recovery.

If every owner loses access, a database operator may temporarily set `OWNER_EMAIL`, `OWNER_PASSWORD`, and `RECOVERY_CONFIRM_EMAIL` (matching the email), then run `npm run owner:recover`. This intentionally resets an existing owner's password and invalidates sessions and outstanding links. It does not create new owners. Remove the variables immediately. Access to this script and database credentials is equivalent to administrative control.

## Backups and recovery

Confirm point-in-time restore/branch retention with the selected Neon plan; do not assume a particular retention period. Back up private object storage with matching retention. Database restore alone does not restore image bytes.

Before launch, restore a checkpoint into a new isolated Neon branch, connect a temporary app to it, verify staff sign-in and publication pointers, and test representative image references against a copied storage namespace. Record the recovery time and operator steps.

## Rollback

The CMS migration is additive and retains the phase-one Department table. Prefer application rollback with the migrated schema intact when compatible. Do not drop new tables or reverse migrations on a live database as an automatic rollback. For an incompatible rollback, restore to a separate branch, validate it, and switch the connection deliberately.

Public readers select published revisions. Restore an archived record through the dashboard to recover it as a private draft, then review and republish. Historical revisions and referenced media are retained; automatic history pruning is intentionally excluded to avoid losing published provenance.

## Monitoring and maintenance

- Monitor process and readiness endpoints, request failures, database connection utilization, storage errors, and application logs.
- Audit history records actor, action, record, and timestamp. It excludes passwords, session tokens, invitation tokens, and private body snapshots.
- A failed storage cleanup after deletion emits a storage key for operator cleanup. Confirm that no media record uses that key before removing the orphaned object.
- Expired sessions, rate-limit rows, and used invitation records can be pruned under a documented retention policy. Never delete active grants or content history implicitly.
- Watch dependency advisories and update lockfile/overrides deliberately; rerun tests after upgrades.
- Public content reads are dynamic to ensure publishing and deadlines take effect without a deployment. Introduce caching only with publication-aware invalidation and deadline-aware expiry.

## Known capacity boundaries

Public/admin record lists are paginated at 20 records. Reference selectors and FAQ presentation are intended for a small lab; very large media/people collections should migrate to searchable asynchronous selectors. The sitemap includes up to 20,000 content URLs plus 20,000 achievements; split it into sitemap indexes before approaching that scale. Pending invitation management shows the newest 100 live links.

The embedded database used in tests is not a substitute for live Neon concurrency, TLS, pooling, region, or restore tests. Multi-instance load tests and provider-specific storage tests must be performed after credentials and infrastructure are available.
