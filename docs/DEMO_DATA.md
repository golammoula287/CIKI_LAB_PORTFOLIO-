# Demonstration dataset

Run this only when you intentionally want fictional test content in the configured database:

```sh
SEED_DEMO=1 npm run db:seed:demo
```

The opt-in command uses your configured Neon connection and an existing active owner. It does not create staff accounts or change passwords. The normal `db:seed` command continues to seed only the initial catalog.

## What it adds

- Five fictional members, one for each membership category, and two fictional advisors.
- Four published sample achievements: conference, journal, book chapter, and patent; plus a private under-review draft and an archived example.
- Open, expired, and closed public opportunities, plus one private draft. Deadlines are relative to the first seed run.
- Five recruitment FAQs covering eligibility, applications, collaboration, ethics, and publishing.
- Two public albums and a private album draft, reusing the generated concept images already in the media library.
- Demonstration copy for core pages only when they are still untouched, unpublished initial seed records. Home, its banner images, and edited or published pages are preserved.

Every generated record has a `demo-` slug and a title beginning with “Demo.” Copy explicitly identifies fictional data. No real academic credentials, publications, patents, recruitment offers, or contact details are asserted.

Re-running skips existing demo slugs and preserves edits. It does not reset deadlines or restore deleted/archived demo records. If a run fails partway, completed records remain available; review any saved draft before publishing manually.

## Things to inspect

Visit `/members`, `/advisory-panel`, `/achievements`, `/recruitment`, `/gallery`, `/about`, `/policies`, and `/contact`. Check category/department filters, publication type/year/status filters, detail pages, author order, gallery captions, deadline displays, and empty search results.

In `/admin`, compare public versus draft/archive records. Edit a demo draft, preview, publish, archive, restore, and inspect its audit history. Try a stale edit using two browser tabs. Staff permissions and invitation/recovery flows use the existing account management features; the seed does not add test login credentials.

The private album stays out of public gallery lists. Its reused images may still be publicly accessible because they are already used in the published homepage banner; publication access is reference-based.

## Before launch

Archive demo-prefixed content and achievements through admin. Replace demonstration page copy with approved text. Historical revisions and audit entries remain intact. The seed does not automatically delete content, media, or user accounts.
