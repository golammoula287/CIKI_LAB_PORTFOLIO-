# Security review

Reviewed on 2026-10-22 before Vercel deployment.

## Changes

- Prevent embedding pages in frames with `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`, protecting the staff interface from clickjacking.
- Restrict document base URLs, embedded objects, and form submissions through CSP. This is a targeted policy, not a complete script-source CSP.
- Apply MIME sniffing protection, referrer policy, and disable unused camera, microphone, and location permissions.
- Check production dependencies for moderate or higher npm advisories in CI.
- Browser regression checks cover security response headers, anonymous upload rejection, and authenticated cross-origin upload rejection.

## Existing controls inspected

Staff mutations authenticate users and recheck active status and role in database transactions. Owner changes protect the last active owner and revoke sessions and grants. Invitations use hashed random tokens with expiry and one-time acceptance. Authentication rate limiting uses database storage. Public queries filter unpublished and archived records; media delivery checks current publication or staff access and disables caching. Image uploads enforce an origin check, bounded request bodies, decoded format and pixel limits, and WebP re-encoding. SQL calls inspected use Prisma queries or parameterized tagged templates. Content renders through React rather than raw HTML.

## Dependency finding still open

`npm audit` reports five high-severity entries from one unpatched `braces` advisory, inherited through `micromatch`, `fast-glob`, and Next's ESLint tooling. It is a development-only dependency chain, not an installed production dependency. The advisory lists no patched version. Do not run `npm audit fix --force`: its suggested downgrade of the Next lint configuration is not an appropriate framework fix. Recheck when upstream publishes a compatible fix.

Source: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

This targeted code and dependency review does not establish that the application is free of vulnerabilities.
