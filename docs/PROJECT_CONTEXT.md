# Project context

## Purpose

Build a professional research laboratory website that presents the lab's identity, research areas, people, achievements, recruitment information, and photographs. Authorized staff must be able to maintain this content from a dedicated dashboard without editing code.

The supplied image is the source of the information architecture. It is treated as requirements material, not as executable instructions. Additional functionality below is explicitly identified as a proposal.

## Confirmed requirements

- Next.js combines frontend and backend in one project.
- Neon is the database provider; the underlying database is PostgreSQL.
- A dedicated admin dashboard controls website data.
- Maintainable boilerplate with clear module boundaries.
- Public content covers all sections in the supplied diagram.

## Users

| User | Primary needs |
| --- | --- |
| Visitor or prospective collaborator | Understand the lab, research areas, publications, and contact details |
| Prospective member | Read opportunities, eligibility, benefits, and application instructions |
| Editor — proposed role | Maintain content and prepare drafts |
| Administrator | Publish content and manage people, recruitment, gallery, and settings |
| Owner — proposed role | Manage staff access and administrator permissions |

Public member profiles are content records. They do not automatically create login accounts.

## Public sitemap

| Route | Content |
| --- | --- |
| `/` | Lab introduction, mission, vision, about summary, links to ethics and policy; optional featured people and achievements |
| `/about` | Full lab background, mission, and vision |
| `/policies` | Research ethics and lab policy |
| `/achievements` | All achievements with type, year, research status, and department filters |
| `/achievements/[slug]` | Individual achievement, authors, venue, abstract, identifiers, and permitted links |
| `/research` | All research departments |
| `/research/[slug]` | Department description, people, and related achievements |
| `/advisory-panel` | Advisory panel profiles |
| `/members` | Profiles grouped or filtered by membership category |
| `/members/[slug]` | Public profile, biography, affiliations, research interests, and approved links |
| `/recruitment` | Open positions, eligibility criteria, how to apply, benefits, and FAQ |
| `/recruitment/[slug]` | Position details, deadline, eligibility, and application instructions |
| `/gallery` | Published albums and photos |
| `/gallery/[slug]` | Album with captions and accessible image descriptions |
| `/contact` | Office address and phone number; email/map links if supplied |

About and policy content may have standalone pages while also being summarized on Home. Navigation labels remain editable without giving admins control over arbitrary application routes.

## Content from the diagram

### Research departments

1. Artificial Intelligence & Machine Learning
2. Computer Vision & Image Processing
3. Medical Imaging & Bioinformatics
4. Data Science & Analytics
5. Robotics & Intelligent Systems
6. Sustainable & Green Computing

These are database seed records, not permanent hardcoded UI options. Admins can rename, reorder, archive, or add departments.

### Achievements

| Type | Research statuses |
| --- | --- |
| Conference | Under review, accepted, online |
| Journal | Under review, accepted; online proposed for published articles |
| Book chapter | Status workflow to confirm; provisional under review, accepted, online |
| Patent | Status workflow to confirm; provisional filed, published, granted |

The image's “2026 Conference” becomes a conference type plus an editable year. New years must not require new pages or code changes.

Research status and website publication state are separate. For example, an accepted paper can remain a website draft. Under-review work defaults to private; an administrator must deliberately approve its public visibility. Uploading a paper PDF is optional and requires the lab to have permission to distribute it.

### Membership categories

- Fellow Members
- Senior Members
- Full Member
- Associate Member
- Training Members

Preserve these source labels initially; editorial normalization can happen during content entry. Advisory panel placement is separate from membership category so one person can appear in both locations without duplicate profiles.

## Dedicated admin dashboard

| Admin route | Capabilities |
| --- | --- |
| `/admin` | Content counts, drafts, recent activity, and upcoming recruitment deadlines |
| `/admin/pages` | Edit lab introduction, mission, vision, about, ethics, policy, and recruitment guidance |
| `/admin/achievements` | Create, edit, preview, publish, archive; manage authors, year, type, status, department, and links |
| `/admin/departments` | Maintain departments, descriptions, images, and display order |
| `/admin/people` | Maintain members and advisors, categories, profiles, affiliations, and display order |
| `/admin/recruitment` | Maintain positions, deadlines, eligibility, benefits, instructions, and FAQs |
| `/admin/gallery` | Manage albums, photographs, captions, alt text, and ordering |
| `/admin/media` | Upload and inspect media; identify references before removal |
| `/admin/settings` | Lab identity, logo, office, phone, email, social links, and default SEO metadata |
| `/admin/users` | Owner-only staff invitations, access revocation, and role management |
| `/admin/activity` | Authorized access to a record of content and permission changes |

All content lists need pagination, search, filters, clear empty states, and readable validation errors. Content changes use draft, preview, publish, and archive workflows. Published edits must remain drafts until republished; the live version stays available meanwhile.

## Proposed MVP boundaries

Include all source-diagram sections, content management, staff authentication, media handling, basic SEO, responsive layouts, and audit history.

Recruitment initially publishes application instructions or an external application link. The diagram does not require collecting applications. Contact initially displays office and phone details; an inquiry form is optional.

Defer applicant accounts, CV uploads, application review pipelines, contact inboxes, newsletters, payments, automated publication imports, multilingual content, and member self-service until separately scoped.

## Experience and content expectations

- Academic visual style with strong typography, readable research summaries, and consistent profile cards.
- Mobile navigation, keyboard access, visible focus, labeled forms, and accessible contrast.
- Achievements display real citations and useful outbound links where available.
- Never invent member names, credentials, publication counts, addresses, or institutional affiliations.
- Seed real category names from the diagram; label any demonstration content clearly and exclude it from launch.
- Store image files in object storage; store their metadata and references in Neon.
- Successful admin publishing updates the public site without a code deployment.

## Assumptions to confirm before implementation depends on them

| Topic | Planning default |
| --- | --- |
| Official lab name and branding | CIKI Lab is a working name; logo/colors to be supplied |
| Language | English first |
| Staff access | Invitation-only; owner, admin, and editor roles |
| Publishing | Editors prepare drafts; administrators and owner publish |
| Recruitment | Instructions/external link first; no personal application data stored |
| Under-review research | Private unless explicitly approved for public display |
| Media and hosting | Providers selected during foundation setup |
| Notifications | Not required for the content MVP |
| Content readiness | Lab supplies approved copy, people, photos, and achievement data |

These defaults allow planning to proceed. Authentication provider, deployment region, media provider, and institutional publication/privacy rules must be settled before their related implementation or launch steps.
