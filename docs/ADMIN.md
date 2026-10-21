# Admin handover

The public site, dashboard, authentication endpoints, and API deploy together in one Next.js project. UI redesign and additional features can be developed after this functional release.

## First sign-in

1. Apply migrations and seeds as described in [VERCEL.md](VERCEL.md).
2. Temporarily set `OWNER_EMAIL`, `OWNER_NAME`, and `OWNER_PASSWORD` in your ignored local `.env`. The password must be 12–128 characters. Use an email address you control and a unique password.
3. Run `npm run owner:create`. The command refuses to create a second initial owner.
4. Remove the three temporary variables and retain your password in a password manager.
5. Open `/login`, sign in, and visit `/admin`.

Do not run the owner command as a Vercel build step. There are no default login credentials or public self-registration.

## Populate the website

1. Open **Site settings**. Enter approved lab identity, contact details, timezone, social links, and navigation. These settings save immediately.
2. Open **Pages**. Edit the introductions for Home, About, Policies, Contact, Research, Members, Advisory Panel, Achievements, Recruitment, and Gallery. Save a draft, preview it, then publish the saved revision.
3. Review the six seeded **Departments**. Publish departments before assigning them to people, positions, or achievements.
4. Review **Membership categories**, then add **People**. Membership and advisory placement are independent, so one profile can appear in both contexts.
5. Add **Achievements** with the correct type, status, year, authors in order, and related departments. Under-review work requires explicit disclosure approval before publication.
6. Add recruitment **Positions**, application instructions, eligibility and benefits, then **Recruitment FAQs**. Deadline input is UTC; public display uses the configured timezone.
7. Upload images in **Media library**, then add **Photo albums** with captions and alt text. JPEG, PNG, and non-animated WebP images must be no larger than 4 MB. Cloudinary credentials must allow uploads.
8. Check the public website after publishing. Empty sections remain empty until real content is entered; synthetic test data is never seeded into your database.

## Editing and permissions

Saving a draft does not change the public version. Review the saved revision and publish explicitly. Archive removes public visibility; restore returns the record to a private draft. Reload before retrying a stale-edit error to avoid overwriting another staff member's work.

Owners manage staff access. Owners and administrators publish and change global settings; editors prepare drafts. Only unreferenced media can be deleted, and revision history counts as a reference. Private media requires staff access until used by published content or the site logo.

To add staff, owners open **Staff access**, create an invitation, and privately share its link. The recipient sets their own password. Links expire after 24 hours and work once. The app does not send email automatically. Owners can issue password recovery links, revoke access, and change roles; the final active owner is protected from removal.

Review **Activity log** for changes. Use **Your account** to change your password. Keep a second trusted owner and follow [OPERATIONS.md](OPERATIONS.md) for emergency recovery and backups.

## After custom-domain connection

Use the chosen domain for both Production URL variables, redeploy, and sign in again on that domain. See [custom-domain setup](VERCEL.md#connect-your-own-domain).


## Banner photographs

Upload images in **Media library**. To choose the banner images, edit **Pages → Home → Banner images (up to 3)**. Click **Add photo +** for each image, select three different uploads, enter alt text, save, and publish. All three appear together in the animated composition. Their order controls placement. If fewer than three are selected, the cover image and then published gallery photos fill the remaining places. Up to three unique images appear; gallery alt text is retained. Draft and archived albums do not supply photos. Unpublished uploads stay private.

The banner shows three overlapping full-size photos. Every six seconds the next image comes forward with gently randomized offsets and angles, bounded inside the banner area. Motion stops while visitors hover over or keyboard-focus the image stack and follows reduced-motion preferences; there is no visible pause button. Until photos are published, the supplied CIKI brand image appears instead. On phones the photos stack below the introduction so text and controls remain readable.
