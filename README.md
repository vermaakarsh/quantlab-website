# Saarth by The Quant Lab: website

This is the static marketing site for Saarth, The Quant Lab's investing research workspace. It has two pages:

- `index.html`: the overview. It covers the hero, What if, Journey, Build, a scripted Chakra concept, the decision journal, your portfolio, the name, and the closing section.
- `features.html`: what Saarth does today and what's next. It covers integrations, Grow and Build side by side, and the future Chakra concept.

There is no backend. Every demo runs in the browser on illustrative sample data, and nothing is sent anywhere. The scripted Chakra journal interaction and plain-language rule input are concepts, not current app features.

## Stack

- **Plain HTML, CSS and JavaScript, with no framework and no runtime dependencies.**
- **Canvas and SVG** for the animations:
  - the simulated-paths field in the hero;
  - the Chakra solar system;
  - the charts.
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
  partials/                               head, header, footer, the Chakra chat, and scripts, shared by both pages
  assets/css/site.css                     all styles; theme tokens are at the top, fonts right after them
  assets/js/site.js                       all behaviour, shared by both pages; modules run only where their section exists
  assets/fonts/                           woff2 files and OFL licences
  assets/img/                             social preview image and touch icon
  static/                                 favicon.svg, robots.txt, sitemap.xml and 404.html, copied to the dist/ root
scripts/build.mjs                         build (also turns #links to the other page into cross-page links, and fails on app.thequantlab.in)
scripts/serve.mjs                         local preview server
dist/                                     production output: deploy this folder
.openai/hosting.json                      existing Sites project settings, unchanged (static directory: dist)
screenshots/                              desktop and mobile, dark and light, both pages
```

## Editing notes

- **Copy** lives in `src/pages/*.html`.
- **Chakra's FAQ answers** are the `FAQ` list inside `ChakraApp` in `site.js`. Every chat answer comes from that list; nothing is generated.
- **Destinations** are set in `LINKS` near the top of `site.js`:
  - `app`
  - `youtube`
  - `home`
  - `blog`
  - `courses`

  A destination set to `null` shows **Soon** and isn't a link. When blog, courses or the Quant Lab home go live, set their URL there and rebuild.
- **Themes.** Dark and light come from the same tokens in `site.css`, and each viewer's choice is remembered in their browser.
- **Motion.** Everything animated respects Pause motion (on both pages) and the system's reduced-motion setting.

## Hostnames

| Hostname | What to serve |
|---|---|
| `saarth.thequantlab.in` | This `dist/` output: `/` is the overview and `/features.html` is the features page. This is the primary home for the site; canonical URLs, the sitemap and social tags point here. |
| `saarth.thequantlab.in/app` | Reserved for the Saarth app. It is not part of this bundle. The "Open Saarth" buttons remain disabled until this path routes to a verified app deployment; then set `LINKS.app` in `src/assets/js/site.js` and rebuild. |
| `thequantlab.in` | For now, the same `dist/` output, product-led, as the brief allows, or a redirect to `saarth.thequantlab.in`. The canonical tags keep search engines pointed at the saarth hostname either way. The footer's "The Quant Lab: Home" link waits for a real Quant Lab home page. |
| `blog.thequantlab.in` | Later, a redirect to Medium. The footer and the Learn menu show Blog as **Soon** until it's set up. |
| `courses.thequantlab.in` | Later. Courses shows as **Soon** until it's set up. |

`app.thequantlab.in` is never used, and the build fails if it appears anywhere.
