# Create East Sussex — landing page

A single-page static site for Create East Sussex, a free programme for
creative businesses across East Sussex, delivered by Studio Zao in
partnership with East Sussex County Council. (Working title: the programme's
internal community offering is still called "The Collective" throughout the
copy — this is separate from the overall programme name.)

No frameworks, no build step. Plain HTML, CSS and vanilla JS.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and copy |
| `styles.css` | Component styles — imports `tokens.css`, references tokens by name throughout |
| `tokens.css` | Design tokens (colour, type, spacing, motion) — portable, reusable in other tooling |
| `script.js` | Scroll reveals, hero parallax, mobile nav, analytics event |
| `.hallmark/log.json` | Design-system provenance record (see "Design rationale" below) |
| `README.md` | This file |

## Running it

- **Simplest:** double-click `index.html` to open it in a browser.
- **Recommended (so fonts/analytics behave):** run a tiny local server from this
  folder:
  ```bash
  python3 -m http.server 8000
  # then visit http://localhost:8000
  ```

## Before you launch — swap list

Every item below is marked in the code with `<<< SWAP >>>` so you can find it
fast (Cmd/Ctrl+F).

1. ~~**Logos**~~ — done. Real files live in `assets/studiozao-logo.png` and
   `assets/East_Sussex_County_Council.svg`, wired into both the header and
   footer. Studio Zao's wide lockup and ESCC's crest are sized to the same
   *visual* height (not the same box) via `.logo-img` / `.logo-img-escc` in
   `styles.css` — adjust those two rules if either logo is replaced later.

2. **Hero images — TEMPORARY, replace before launch.** All four collage
   tiles use real photos — generic (but real, credited) stock, not actual
   programme photography, dropped in so the page doesn't look unfinished.
   Each tile represents one creative discipline. Files live in
   `assets/hero/`; swap each directly (keep the filename) or update the
   `url()` in `styles.css`. Suggested export: ~800×1000px, under 200KB each.

   | Tile | Discipline | File | `styles.css` rule |
   | --- | --- | --- | --- |
   | 1 | Makers / craft | `hands.jpg` | `.img-hands` |
   | 2 | Illustration & fine art | `art.jpg` | `.img-art` |
   | 3 | Fashion / textiles | `textile.jpg` | `.img-textile` |
   | 4 | Photography (portrait / commercial / drone / property) | `photography.jpg` | `.img-photography` |

   Current stand-in photo credits (all reused under their Commons licence —
   drop this list once the real photos are in):
   - Makers: *Potter-helen-dixon-at-work3.jpg* by Whippetsgalore, CC BY-SA 4.0
   - Illustration & fine art: *Artist painting the mural of Paulo de Carvalho, Lisbon* by Jules Verne Times Two, CC BY-SA 4.0
   - Fashion / textiles: *A Tailor Sewing Clothes in Her Shop.jpg* by Meritkosy, CC BY-SA 4.0
   - Photography: *Quadcopter camera drone in flight.jpg* by Josh Sorenson, CC0 (stands in for drone / property photography)

3. **Google Form URL** — in `index.html`, find the CTA button in the form
   section (`href="https://forms.gle/REPLACE_WITH_REAL_FORM_URL"`) and paste the
   real link. We deliberately do **not** iframe-embed the form — a native embed
   can't be restyled to match the brand, so a clean outbound button is correct.
   The hero and nav buttons scroll to this section.

4. **Analytics tracking ID** — in the `<head>` of `index.html` there are two
   pre-wired, commented-out snippets: **Plausible** (simplest) and
   **Google Analytics 4**. Uncomment ONE, add your ID/domain, delete the other.
   A custom CTA-click event (separate from the page view) fires automatically
   from `script.js` → `trackCtaClick()` and works with either provider.

5. **Eligibility copy — grounded in the Lot 3 spec, deliberately summarised.**
   The three checklist items now reflect the actual eligibility criteria
   (trading status, creative-sector fit including the tech-enabled/pure-IT
   distinction, and eligible business structures including social
   enterprises, co-ops and charity trading arms). Two things from the spec
   are **intentionally** left off the public-facing checklist:
   - **Exact SME thresholds** (up to 249 staff / £44m turnover / £40m balance
     sheet) — this is a legal ceiling that's irrelevant to the realistic
     audience (sole traders, freelancers, small creative businesses never
     approach it) and reads as generic tender-boilerplate exactly where the
     site is trying not to.
   - **A blunt "pre-start businesses are excluded" line** — the existing
     closing line ("Not sure if you fit? Come along to a Hack or get in
     touch") already handles that ambiguity without a discouraging
     exclusion statement up front.

   If you want either reinstated (e.g. for a compliance/T&Cs page rather
   than this checklist), the source figures are in the Lot 3 specification
   document, not repeated here.

6. **Hack dates** — the form section is currently framed as an *expression of
   interest*, not a live booking, because Hack dates aren't confirmed. Once
   dates are live, update the copy in the form section (and the small microcopy
   line beneath the button), and swap the outbound button for a booking link if
   you move to live booking. This is flagged in `index.html`.

## Brand system (as implemented)

Colours are the client's exact locked hex values (defined in `tokens.css`):

| Token | Value | Use |
| --- | --- | --- |
| `--color-white` | `#FFFFFF` | Background |
| `--color-black` | `#000000` | Primary body text |
| `--color-navy` | `#122D54` | Headings, structural colour |
| `--color-grey` | `#6B7280` | Large/decorative text only — fails 4.5:1 at small sizes, see below |
| `--color-light-grey` | `#D1D5DB` | Hairline dividers |
| `--color-darker-grey` | `#4B5563` | Small body text, captions, footer type |
| `--color-red` | `#E42544` | CTA buttons + sparing highlights |

> Note: `--color-red-hover` (`#C51D38`) is a slightly darker red derived for
> button hover so white button text keeps AA contrast. `--color-grey` reads
> at roughly 4.3:1 against white — fine for large text (≥18px bold / 24px
> regular) but under the 4.5:1 floor for small body copy, so small text
> (captions, footer, section numerals) uses `--color-darker-grey` instead.
> Both are the client's own specified greys — this is about *which* one to
> reach for, not a substitution.

### Typography

- **Display:** Fraunces (serif, variable, expressive italic) — Google Fonts
- **Body:** Switzer (clean neutral sans) — Fontshare
- **Numerals/labels only:** JetBrains Mono — Google Fonts, used in exactly two
  places (section index numbers, hero scroll cue) per the "outlier face" rule

Previously Space Grotesk + Inter — replaced in the July 2026 redesign (see
below) because that pairing is the single most common LLM-default font
combination and read as generic rather than considered.

## Accessibility & motion

- Semantic HTML, correct heading order, alt text / `aria-label` on all imagery
  and decorative elements (the hand-built specimen swatch is `aria-hidden`).
- Keyboard navigable, visible focus rings, skip-to-content link.
- Colour contrast verified pair-by-pair — see the brand system table above for
  which grey to use where.
- All animation respects `prefers-reduced-motion` — spatial motion collapses to
  a quick fade and looping animations are disabled.

## Design rationale (July 2026 redesign)

The original build used a generic template shape — a centred-ish hero, a
3-column icon-card grid for the programme offerings, a circle-and-connector-
line "3 steps" pattern, and a sticky nav with a blurred glass background. That
shape is genre-blind: it's the same structure a SaaS product page, a bakery,
and a council-funded creative programme would all get by default, and it
reads as generic to exactly the audience (designers, filmmakers, musicians,
makers) this page is trying to reach.

The redesign keeps every word of copy and the same six sections, but changes
the structural fingerprint:

- **Programme section** — the three offerings (Hacks / Mentoring Sprints /
  The Collective) were an equal 3-card grid; now Hacks leads at full width
  (it's genuinely the primary entry point) with the other two paired beneath,
  divided by a hairline rule instead of card borders.
- **How it works** — the circle-icon + animated connector-line steps became a
  simpler numbered list with large serif numerals, no JS-driven line-drawing
  needed.
- **Section index** — each major section carries a small numbered label
  (01–05) above its heading, in the same order as the nav links, so the page
  reads as a considered, ordered whole rather than a stack of disconnected
  blocks.
- **Header** — dropped the blurred glass background and the filled pill
  "Join" button; nav links are now quiet small-caps text, and the CTA is a
  text+arrow link (the one bold filled button stays reserved for the hero
  and the final register section, so it isn't diluted by repetition).
- **Typography** — Space Grotesk/Inter (the most common default LLM pairing)
  replaced with Fraunces + Switzer.

`tokens.css` and `.hallmark/log.json` exist so this reasoning and the actual
token values are machine-readable if the page is redesigned again later.
