# CIKI blue design system

## Mobile experience

At phone widths (up to 580 px), public pages use a compact masthead and a fixed bottom navigation for Home, Research, Community, and Gallery. The top Menu retains access to every existing section, including achievements and the advisory panel. Active destinations have a blue surface and `aria-current`; the bottom bar reserves device safe-area space and the footer includes clearance. The banner uses a responsive heading, full-width touch-friendly actions, and a shorter image stack. Inputs use 16 px text to avoid focus zoom on phones. The admin workspace retains its separate navigation, with 44 px touch targets and automatic horizontal positioning of the current tab.

The public website, login and invitation screens, and admin dashboard share the tokens in `src/app/globals.css`.

| Token | Value | Use |
| --- | --- | --- |
| `--brand-navy` | `#071B40` | Headings, footer, community callout |
| `--brand-royal` | `#125CE1` | Primary buttons, links, focus states |
| `--brand-electric` | `#087CFA` | Reserved highlight |
| `--brand-cyan` | `#13B8F5` | Reserved accent; not body text |
| `--brand-ice` | `#EAF4FF` | Subtle section backgrounds |
| `--paper` | `#F8FAFE` | Page background |
| `--white` | `#FFFFFF` | Cards and header |
| `--muted` | `#52647C` | Supporting text |
| `--line` | `#DEE8F4` | Borders and dividers |

Section and banner headings use Plus Jakarta Sans with restrained weight and spacing, paired with Inter for navigation and body text. All three families are served locally through `next/font/local`, using Latin variable WOFF2 files in `src/app/fonts/`; their OFL licenses are included. The browser no longer requests Google Fonts. Inter is preloaded; editorial and Jakarta fonts load when used.

Standard transitions are 180 ms. Smooth in-page scrolling respects reduced-motion preferences, and the interface has no scroll-jacking or animated loading sequence. Shared corner radius is 10 px, with smaller radii on controls. Focus rings use royal blue. Bright cyan is reserved for accents rather than small text.

## Identity assets

The supplied `docs/CIKI_brand_assets_blue.zip` is the source of the original PNGs copied to `public/brand/` and `src/app/icon.png`. The blue navbar logo is used by default; the supplied white-background version is used in the navy footer. No CSS logo recreation, generated logo, or color filter is used. Next.js Image optimizes delivered navbar images.

Existing CMS logo overrides and lab identity settings remain supported. The default identity is CIKI — Cognexa Center for Intelligence, Knowledge, and Innovation. No saved database copy or logo choice is overwritten by the redesign.

## Navigation and layouts

The People navigation opens a disclosure with separate Members and Advisory Panel links. The button exposes expanded state and supports Enter/Space, Escape with focus return, dismissal outside the navigation, and closing after navigation. Mobile uses a separate Menu disclosure and the same links. Ordinary links retain native Tab behavior; this is not an application-style ARIA menu.

The homepage uses a full-screen asymmetric introduction with a lightweight blue geometric SVG, followed by a numbered research directory, community links, publication categories, and a membership invitation. Research entries link to the existing CMS-backed department pages; there are no decorative home-card icons. Published home titles, summaries, and body content remain editable.

The public masthead shows the supplied logo alone. Sticky navigation and a homepage section bar keep research, community, publications, and opportunities within reach. The full institution name appears in the introduction, while footer and admin identity information remain available. Mobile dashboard navigation scrolls horizontally rather than consuming several rows.

The existing website has no dark-mode switch; the shared light theme is retained. Blog submission and community account features require a separate functional implementation and are not represented by nonfunctional buttons in this visual pass.

## Verification

Production build, lint, formatting, and the existing unit tests pass. Browser acceptance checks cover keyboard and mobile People navigation, existing admin editing/publishing workflows, and page overflow at 390, 768, and 1280 px. Generated screenshots are ignored under `test-results/`.

Design references reviewed: [Stanford HAI](https://hai.stanford.edu/) and [The Alan Turing Institute](https://www.turing.ac.uk/). The CIKI layout uses its own supplied assets and content.
