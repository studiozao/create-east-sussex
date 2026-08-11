# Create East Sussex — landing page

A single-page static site for Create East Sussex, a free programme for
creative businesses across East Sussex, delivered by Studio Zao in
partnership with East Sussex County Council.

No frameworks, no build step. Plain HTML, CSS and vanilla JS.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and copy |
| `styles.css` | Component styles — imports `tokens.css`, references tokens by name throughout |
| `tokens.css` | Design tokens (colour, type, spacing, motion) — portable, reusable in other tooling |
| `script.js` | GSAP hero timeline, card flip-in, photo/map scroll reveals, map pins, header auto-hide, mobile nav, analytics event |
| `assets/vendor/` | Self-hosted GSAP, ScrollTrigger and Lenis (pinned 3.12.5 / 1.1.18) — a third-party CDN having a bad day shouldn't take the motion layer down. Fonts (Archivo, Satoshi) are still loaded from Google Fonts/Fontshare; self-hosting those is a reasonable follow-up but wasn't done in this pass. |
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

2a. **Hero background video.** `assets/hero/hero-cliffs.mp4` is a
   client-supplied golden-hour cliff clip, transcoded from the original
   HEVC `.mov` to H.264 with `avconvert` so Chrome and Firefox can play it
   (they do not reliably decode HEVC). `assets/hero/hero-poster.jpg` is its
   first frame, used as the poster and as the still fallback under
   `prefers-reduced-motion`. Two caveats worth knowing before you swap it:
   the source is a **vertical** phone video, so on desktop most of the frame
   is cropped away to a wide band; and it is only ~2.3s, so it is
   played back at 0.5x across TWO stacked <video> layers that `script.js`
   crossfades into each other near the end of each pass, hiding the loop
   seam (the `loop` attribute is deliberately not set, since it would hard
   cut and fight the fade). The full-res
   original (`IMG_4627.mov`, 8.1MB) is gitignored. The hero scrim is neutral black
   and is weighted to the footage rather than to habit: the clip is bright
   in the upper half (sky) and dark in the lower half (ground), so the
   gradient peaks over the headline band and drops away at the bottom. The
   small tagline sits on a solid red chip because it was over the brightest
   sky and would otherwise have forced the whole scrim darker. If you change
   the clip or the stops, re-measure the luminance under each text block
   before shipping.

2. **Discipline images — TEMPORARY, replace before launch.** All four
   photos are generic (but real, credited) stock, not actual programme
   photography, dropped in so the page doesn't look unfinished. They appear together as one angled cluster in "Who it's for" (eligibility),
   staggering in as it scrolls into view. Files live
   in `assets/hero/`; swap each directly (keep the filename) or update the
   `url()` in `styles.css`.
   Suggested export: ~800×1000px, under 200KB each.

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
     closing line ("Not sure if you fit? Come along to a Connect or get in
     touch") already handles that ambiguity without a discouraging
     exclusion statement up front.

   If you want either reinstated (e.g. for a compliance/T&Cs page rather
   than this checklist), the source figures are in the Lot 3 specification
   document, not repeated here.

6a. **Meet your mentors — real people, placeholder LinkedIn/bio wording
   already replaced.** Sara Carter and Chris Baker have real photos, bios
   and LinkedIn links in `#mentors`. Add more mentors by appending another
   `<li class="mentor-card">` (photo on the left, name/role beside it,
   bio and LinkedIn link below) — the carousel takes any number without
   layout changes.

6b. **About stats — mockup figures, not confirmed.** The count-up strip in
   `#about` (30+ businesses supported, 120+ mentoring hours, 95% would
   recommend) is not real data. Update the three `data-count` values on
   `.stat-count` (and the visible number inside each span, which mirrors
   `data-count` so the figure is still correct if `script.js` fails to load)
   before launch.

6c. **Event calendar dates and register link** — none of the
   `<<< SWAP >>>` dates in `#connects` are locked yet. The five September
   rows have real working dates, ordered earliest to latest; October–
   December have no location or date chosen yet, so they're summarised in
   a single line instead of dated rows. There is now one shared "Register
   for a Connect" link for the whole list (`.calendar-register`) rather
   than a link per row — point it at the real signup form once it exists.

7. **Connect dates** — the register section is currently framed as an
   *expression of interest*, not a live booking, because Connect dates
   aren't confirmed. Once
   dates are live, update the copy in the form section (and the small microcopy
   line beneath the button), and swap the outbound button for a booking link if
   you move to live booking. This is flagged in `index.html`.

## Brand system (as implemented)

Colours are the client's exact locked hex values (defined in `tokens.css`):

| Token | Value | Use |
| --- | --- | --- |
| `--color-white` / `--color-paper` | `#FFFFFF` | Background |
| `--color-paper-2` | `#F4F4F5` | Faint alternating band (About section) |
| `--color-ink` | `#111111` | Headings + primary text |
| `--color-ink-2` | `#3F3F46` | Body copy (10.9:1 on white) |
| `--color-ink-3` | `#6B6B72` | Small print, captions (5.3:1 on white) |
| `--color-red` | `#E42544` | CTA buttons + the only colour on the page |

> **The navy is gone.** `#122D54` was dropped from the page in Aug 2026 at
> client request in favour of near-black and greys, leaving red as the only
> colour. The ESCC crest artwork is still blue, so the two sit side by side
> in the header and footer; that is intentional, not an oversight.

> Note: `--color-red-hover` (`#C51D38`) is a slightly darker red derived for
> button hover so white button text keeps AA contrast. `--color-grey` reads
> at roughly 4.3:1 against white — fine for large text (≥18px bold / 24px
> regular) but under the 4.5:1 floor for small body copy, so small text
> (captions, footer, section numerals) uses `--color-darker-grey` instead.
> Both are the client's own specified greys — this is about *which* one to
> reach for, not a substitution.

### Typography

- **Display:** Archivo (wide, heavy grotesque) — Google Fonts. HEADINGS ONLY.
- **Body:** Satoshi — Fontshare. Everything that is not an h1/h2/h3, including list items, pull quotes and labels, so non-heading copy stays consistent.

Font history, newest first:

- **Aug 2026 (second pass)** — Clash Display replaced with **Archivo** at
  its wide, heavy end. Archivo is used for headings ONLY; every other piece
  of text uses Satoshi, so non-heading copy is consistent throughout.
- **Aug 2026** — Fraunces + Switzer replaced with Clash Display + Satoshi
  after direct feedback that the serif read too light ("looks a bit drunk",
  "I was thinking more bold"). The JetBrains Mono outlier face was dropped
  entirely; the page is now a two-face system.
- **Jul 2026** — Space Grotesk + Inter replaced with Fraunces + Switzer,
  because that pairing is the single most common LLM-default font
  combination and read as generic rather than considered.

## Accessibility & motion

- Semantic HTML, correct heading order, alt text / `aria-label` on all imagery
  and decorative elements (the hand-built specimen swatch is `aria-hidden`).
- Keyboard navigable, visible focus rings, skip-to-content link.
- Colour contrast verified pair-by-pair — see the brand system table above for
  which grey to use where.
- All animation respects `prefers-reduced-motion` — spatial motion collapses to
  a quick fade and looping animations are disabled.

## Design rationale (Aug 2026 rebuild)

The page has been through three shapes. The first was a generic template
(centred hero, 3-column icon-card grid, glass nav). The second was a quiet
serif editorial layout. This third one is a bold editorial rebuild, driven
by direct client feedback that the type read too light and the page felt
passive.

What defines the current shape:

- **Hero** — the page's only dark band. "Create" types out character by
  character behind a caret, then "East Sussex" lands beneath it, over
  looping cliff footage. The second line is scaled to ~0.55em because it is
  11 characters against "Create"'s 6; at a shared size it overflows the
  viewport instead of sitting on the same measure.
- **Type discipline** — Archivo (wide, heavy) for headings ONLY. Everything
  else is Satoshi. This is deliberate: an earlier pass let list items and
  pull quotes use the display face, and the page read inconsistently.
- **Offer section** — an editorial index of full-width rows with line icons,
  specifically NOT a 3-card grid.
- **Map** — a real ONS county boundary rather than a drawn approximation,
  with the first five Connect towns positioned by their actual coordinates.
  See "Map data" below.
- **About** — native `<details>` disclosure panels, so the Studio Zao detail
  is available without dominating the page, and works with JavaScript off.
- **Section order** — the mentoring detail and the mentor-recruitment ask
  both sit at the end, so the participant journey runs uninterrupted and
  both closing asks land together.

## Map data

The county outline in the "Where we meet" section is **real**, not drawn:
it comes from the ONS "Counties and Unitary Authorities (December 2023)
Boundaries UK BUC" (ultra-generalised) dataset, filtered to East Sussex,
projected with a cosine-corrected equirectangular transform into the SVG
viewBox. The five town pins are placed from actual lat/lon and were checked
with a point-in-polygon test. If you add a town, project its coordinates the
same way rather than eyeballing the position.

Note this is administrative East Sussex, which excludes Brighton & Hove
(a separate unitary authority).

`tokens.css` and `.hallmark/log.json` exist so this reasoning and the actual
token values are machine-readable if the page is redesigned again later.
