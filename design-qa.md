# RECAST visual QA

## Scope

- Target: local RECAST campaign studio at `http://localhost:3000/`
- Source truth: the supplied fashion-editorial references and the supplied campaign-memory screenshot
- Intentional departure: replace the flat sticky-note campaign cards and illustrated bag art with photographic, credited, campaign-led imagery

## Final comparison

| Priority | Result | Evidence |
| --- | --- | --- |
| P0 | Pass | Core home, archive, navigation, and campaign controls render and remain reachable. |
| P1 | Pass | No horizontal overflow at 1440×900 or 390×844; the mobile header, hero, actions, and editorial timeline reflow correctly. |
| P1 | Pass | The new fashion triptych uses one consistent model across street, studio, and runway scenes; no bag or backpack appears. |
| P1 | Pass | Campaign-memory and archive cards now use real campaign stills with source credits and accessible image descriptions. |
| P2 | Pass | Faces and garment details stay inside the reusable web crops; overlays preserve text contrast. |
| P2 | Pass | Scroll-linked campaign memory retains its motion while using photographic cards instead of flat placeholders. |

## Iterations completed

1. Rejected the first bag-focused visual and regenerated the campaign art from the supplied fashion references.
2. Moved the triptych crop upward after desktop QA so faces remained visible in all three panels.
3. Replaced `next/image` in this vinext worker build with pre-sized native assets after the preview image optimizer failed; assets remain explicitly sized and lazy-loaded where appropriate.
4. Verified the current page in the in-app browser at desktop and mobile breakpoints and confirmed `scrollWidth === innerWidth`.

## Verification

- Unit tests: 12 passed
- Production build: passed
- ESLint: passed
- Browser DOM/accessibility inspection: passed
- Current-session browser errors: none after the image-loader correction
