# Saarth by The Quant Lab: website

This is the static marketing site for Saarth, The Quant Lab's investing research workspace. It has two pages:

- `index.html`: the overview. The hero, the opening questions, then Grow (Accounts, Goals, Sleeves) and Build (Describe and test, Check and rehearse, Manage strategies), what Saarth won't do, the name, and the closing section.
- `features.html`: what Saarth does today and what's next. Bring it in, Keep the reason, Portfolio management, Strategy builder, and Insights and signals.

From the opening questions on, **Saarthi** (the guide inside Saarth) sits beside the page in a pinned panel. It follows each section, explains what is on screen, and ends answers with *Your call*: options it lays out without picking one.

There is no backend. Every demo runs in the browser on a sample portfolio or on generated prices, and nothing is sent anywhere. Saarthi's answers are scripted from what Saarth does today; it is not live AI. Pattern spotting in the journal, automated portfolio management, signals and plain-language rules are marked as next, not current app features.

## Stack

- **Plain HTML, CSS and JavaScript, with no framework and no runtime dependencies.**
- **Canvas and SVG** for the animations:
  - the simulated-paths field in the hero and closing;
  - the dashboards and charts beside Saarthi.
- **Self-hosted fonts.** The four families are under the SIL Open Font License 1.1, and each licence file sits next to its fonts in `assets/fonts/`:

  | Family | Used for |
  |---|---|
  | Anek Latin | Display type |
  | Instrument Sans | Body text |
  | IBM Plex Mono | Figures |
  | Anek Devanagari | सार्थ |

- **A small Node build step** with no packages. It assembles the pages from shared partials and writes `dist/`. Node 18 or later is required.

## Commands

```bash
npm run build     # assemble src/ into dist/
npm run preview   # serve dist/ at http://localhost:4173 (set PORT to change)
npm start         # build, then preview
```

There is nothing to install. `package-lock.json` is included, but the package has no dependencies. You can also open `dist/` with any static file server, such as `python3 -m http.server -d dist 4173`.

## Layout

```
src/
  pages/index.html, pages/features.html   page bodies, each with a small @page JSON header (title, description, canonical)
  partials/                               head, header, footer and scripts, shared by both pages
  assets/css/site.css                     base styles; theme tokens are at the top, fonts right after them
  assets/css/sx.css                       Saarthi's panel, the dashboards and the workbench (sp-, wb-, dash-, sx- prefixes)
  assets/js/site.js                       links, theme, motion, the simulated-paths field, header and menus
  assets/js/sx-saarthi.js                 Saarthi's scripted answers (KB), navigation, the glyph's wave and chart tips
  assets/js/sx-panel.js                   the pinned panel: runs, the Thinks to Acts rail, Your call and acting
  assets/js/sx-viz.js                     charts Saarthi shows in its answers
  assets/js/sx-workbench.js               Grow dashboard, goals, sleeves, and the Build workbench (a real backtest on generated prices)
  assets/js/sx-pages.js                   wires each page's sections to Saarthi
  assets/fonts/                           woff2 files and OFL licences
  assets/img/                             social preview image and touch icon
  static/                                 favicon.svg, robots.txt, sitemap.xml and 404.html, copied to the dist/ root
scripts/build.mjs                         build (also turns #links to the other page into cross-page links)
scripts/serve.mjs                         local preview server
dist/                                     production output: deploy this folder
.github/workflows/pages.yml              GitHub Actions build and Pages deployment from main
.openai/hosting.json                      previous Sites preview settings, retained for reference
screenshots/                              supplied ZIP only: visual QA captures, not tracked in Git
```

## Editing notes

- **Copy** lives in `src/pages/*.html`.
- **Saarthi's answers** are the `KB` list in `sx-saarthi.js`, matched by pattern. Questions asking for tips or predictions get the no-tips answer. Each section's narration lives in `sx-pages.js` (`PANEL_SCRIPTS`), and the options under *Your call* are in `DECIDE` in `sx-panel.js`.
- **Destinations** are set in `LINKS` near the top of `site.js`:
  - `app`
  - `youtube`
  - `home`
  - `blog`
  - `courses`

  A destination set to `null` shows **Soon** and isn't a link. Saarth, blog, and courses remain disabled until their destinations exist.
- **Themes.** Dark and light come from the same tokens in `site.css`, and each viewer's choice is remembered in their browser.
- **Motion.** Everything animated, including Saarthi's panel, respects the one Pause motion switch and the system's reduced-motion setting.

## Hostnames

| Hostname | What to serve |
|---|---|
| `thequantlab.in` | This `dist/` output, hosted on GitHub Pages. It is the canonical Saarth landing page. |
| `saarth.thequantlab.in` | Reserved for separate Saarth content later. The landing page's Open Saarth buttons show **Soon** until this hostname is live; then set `LINKS.app` to `https://saarth.thequantlab.in/` and rebuild. |
| `blog.thequantlab.in` | Reserved for later publication. Blog currently shows **Soon**. |
| `courses.thequantlab.in` | Later. Courses shows as **Soon** until it's set up. |

There is no `/app` route in this website and no `app.thequantlab.in` dependency. `REVIEW.md` and `VERIFIED.md` record the earlier artifact review and retain historical URLs; this section supersedes their deployment map.
