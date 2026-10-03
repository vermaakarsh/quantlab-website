# Handoff

## CTA destinations

| Link | Where it appears | Destination | State |
|---|---|---|---|
| Open Saarth, Open the app | Header, hero, closing sections, footer, and the Features hero and closing | `https://saarth.thequantlab.in/` | Shows **Soon** until its separate site exists |
| YouTube | Learn menu, footer | `https://youtube.com/@quantlab` | Live link; confirm the handle |
| Blog | Learn menu, footer | none: shows **Soon** | Owner will publish its destination later |
| Courses | Learn menu, footer | none: shows **Soon** | Waiting for `courses.thequantlab.in` |
| The Quant Lab: Home | Footer | `https://thequantlab.in/` | Canonical landing page |
| Features, All features | Header, Product menu, footer | `features.html` | In this bundle |
| Product menu, footer and in-page links | Both pages | Sections of `index.html` (Accounts, Goals, Sleeves, Build, Strategies, What we won't do) and `features.html#journal` | In this bundle |
| Show me on the page | Saarthi's panel, on both pages | The section an answer refers to | In this bundle |

The URLs live in `LINKS` at the top of `src/assets/js/site.js`. Rebuild with `npm run build` after changing one.

## Still to configure (not done here)

- **DNS and hosting.** GitHub Actions builds `dist/` and deploys it to GitHub Pages for `thequantlab.in`. The older Sites preview remains separate.
- **Saarth.** `saarth.thequantlab.in` is reserved for separate content later; there is no `/app` route or `app.thequantlab.in` dependency. Enable `LINKS.app` only once that site works.
- **Blog and courses.** Both show "Soon" until their destinations are published. No subdomain redirects are part of this launch.
- **Social preview.** `og:image` uses `https://thequantlab.in/assets/img/og-saarth.jpg`.
- **Analytics and cookies.** There is no analytics, tracking or cookie banner. Only the theme and motion choices are stored, in the visitor's own browser.
- **The review history below is from the original archive.** Check the latest PR, Pages run, and DNS status for current deployment evidence.

## Product claims to confirm

These were checked against `quantlab-compass` `docs/HANDOFF.md` and `docs/requirements/feature-backlog.md`, read-only. Please confirm the ones marked **confirm** before launch.

- **Shipped per the backlog:**
  - imports: Kite MCP read-only snapshot, Zerodha Console files, Dhan statements, generic CSV and manual entry;
  - analysis: tax estimate with FY 2025-26 rules (₹1.25L LTCG exemption), Monte Carlo journeys, and portfolio views of accounts, sectors and concentration;
  - research: rule templates, the Evidence check, backtests and walk-forward (Pro-gated in the app);
  - watchlists.
- **Confirm the status labels on the Features page:** each feature is marked Live, Experimental or Next. Build is presented as experimental throughout; the backlog's launch posture gates parts of Build as "Coming soon".
- **Confirm paper trading:** the Build chat answer says it "runs a rule forward with virtual capital". The Build progress rail shows it as "next, in Saarth".
- **Confirm screenshot import** using the visitor's own AI key (BYOK). The backlog lists statement upload preview and BYOK assistive AI, but not screenshot parsing by name.
- **Confirm Saarthi spotting patterns in reasons** ("Seen 3 of 3 times", with the visitor approving each rule). It is marked next and labelled a concept. The backlog lists journal assistive AI with BYOK.
- **Confirm portfolio optimisation** ("Compare a different mix", marked experimental). The backlog lists strategy-parameter optimisation, not portfolio optimisation.
- **Confirm the new next items:** automated portfolio management on the visitor's own targets (plans only; nothing reaches a broker) and signals from the visitor's own rules, limits and watchlist.
- **Confirm the privacy lines:** read-only broker connections, the session held in a secure cookie, and removing an account and its data from Settings.
- **Confirm pricing:** "You can start free. Deeper features and heavier use come with paid plans."
- **Confirm mutual funds:** listed as next, with today's focus on listed shares and ETFs.
- **Regulatory lens (India):** run the planned SEBI-lens review of the copy. The site is written as research, not advice: no tips, no predictions, past-conditional wording, and "illustrative" labels on every sample.

## Notes

- **The previous `dist/` draft was reviewed and superseded:** `index.html` and `styles.css` with uncommitted edits, `script.js`, and `assets/quant-research-hero.jpg`.
  - This bundle doesn't use the hero photo, so no image licence is needed.
  - Every visual here is drawn in code, apart from `og-saarth.jpg` and the touch icon, which are screenshots of this site.
  - The draft files in the Codex folder were left untouched.
- **Saarthi replaces Chakra.** Saarthi (सारथी, the charioteer) is the guide inside Saarth. On the site it sits in a pinned panel beside the page, follows each section, and ends answers with *Your call*: options it lays out without picking one, then acts on the one chosen (a journal entry, a review date, another test). It never gives tips or places orders. Its answers are scripted (`KB` in `sx-saarthi.js`); it is not live AI.
- **Relative rotation is not shown.** "Relative Rotation Graph" is a trademark; the site uses a plain leaders-and-laggers chart instead.
- **Samples.** Dashboards run on a sample ₹10 lakh portfolio; the Build workbench backtests generated prices, labelled as such.
