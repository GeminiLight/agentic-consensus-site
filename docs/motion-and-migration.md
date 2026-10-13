# Motion and canonical URL refinement · 2026-10-13

## What changed

- The hero trace plays a single, four-step sequence: agreed scope, authority mismatch, missing evidence, and a human decision. A Replay control restarts it. Moving away or hiding the page stops the sequence; reduced-motion preference suppresses it entirely. All four linked statements remain readable and actionable throughout.
- The team now has an editorial introduction, readable author grid, affiliation markers, and a clear paper link. Author order follows the current manuscript.
- Tab selection has a moving highlight. Outgoing content fades into incoming content, and panels interpolate their measured height. Rapid choices replace in-flight transitions; temporary outgoing snapshots are inert, hidden from accessibility, and stripped of IDs.
- Native disclosures animate in both directions. Image viewing and mobile navigation have exit transitions as well as entrances. Navigation keeps its current section highlight between sections, with a reading-progress line.
- Large content surfaces stay still; entrances focus on headings and short groups. Motion is finite, interruptible, and disabled when reduced motion is requested. Without JavaScript, all seven example/workspace panels remain readable and native links/disclosures still work.

The English workspace captures, no-human-study-results constraint, public arXiv links, and one-field-per-line scrollable citation remain intact.

## Address and publication

Canonical: `https://tianfuwang.tech/agentic-consensus/`.

The implementation repository already owns `agentic-consensus`. Renaming it would disrupt code links and concurrent development, so the canonical website uses its dedicated `gh-pages` branch. Only public website files are exported there. The default code branch, its history, repository name, and private visibility are unchanged.

`agentic-consensus-site:gh-pages` remains the public website source and PR base. Its Pages source becomes `legacy-redirect`. The redirect keeps query strings, section anchors, and old asset links. The canonical, Open Graph, structured data, sitemap, robots declaration, and text summary use the new URL. See the README for explicit export/release commands; no credentials or private working files are included.

## Verification

- `scripts/verify-browser.cjs`: 15 behavioral groups, including 320–1440px layouts, real keyboard input, both tab groups, finite replay, rapid switching, disclosure reversal, image viewer focus/zoom, clipboard failure, deep links, reduced motion, automated WCAG A/AA scans, and browser errors.
- Script-disabled browser at 390px: all four walkthrough and three screenshot panels are visible, replay is hidden, and the page has no horizontal overflow.
- Source checks validate metadata, author count, 73 resource/anchor references, public paper PDF, font licenses, sitemap targets, and canonical consistency.
- Rendered desktop, tablet, mobile, and full-page captures are in `docs/qa/motion-2026-10-13/`. Screenshots alone do not establish motion correctness; the behavioral checks inspect state during and after transitions.

Automated accessibility scans are useful coverage, not a claim of complete accessibility certification.
