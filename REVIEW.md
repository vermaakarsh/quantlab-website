# Import review — 29 September 2026

This repository was imported from the owner-supplied `quantlab-website-final.zip` after review.

## Independently checked

- Archive entries were checked for path traversal and symlinks before extraction.
- `npm run build` and `node --check src/assets/js/site.js` pass without installed dependencies.
- The supplied `dist/` originally matched a fresh build. After copy changes, `dist/` was rebuilt from the reviewed source.
- Internal page links and assets resolved in the build; overview-to-features navigation and a what-if slider were exercised in a browser.
- Responsive desktop and mobile screenshots supplied with the archive were inspected. They remain in the supplied ZIP rather than Git; they are review aids, not proof of a deployed site.

## Product-copy corrections

The supplied site presented some proposed Chakra behaviour, personal optimisation, tax-aware backtesting and pricing as live. Copy now marks the scripted Chakra journal and plain-language rule input as concepts, labels simulated comparisons as illustrative, distinguishes virtual paper orders from broker orders, and avoids an unverified pricing promise.

## Release gates

- `saarth.thequantlab.in/app` must route to the production app before `LINKS.app` is enabled in `src/assets/js/site.js` and the Open Saarth CTAs become links.
- The site is canonically written for `saarth.thequantlab.in`; register and validate that hostname before treating the site as a public launch.
- `thequantlab.in`, `blog.thequantlab.in`, and `courses.thequantlab.in` need their own final routing decisions. Blog and courses remain Soon in the site.
- The current Sites project may be deployed privately for review; public access and DNS are separate release actions.

The inherited `VERIFIED.md` records the original package author's checks. It is not the independent evidence above.
