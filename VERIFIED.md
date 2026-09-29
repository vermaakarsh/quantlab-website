# Verified interactions

These are the interactions I checked on the built `dist/` output, served locally with `npm run preview`, on 29 Sep 2026.
Automated checks were run in Chromium (Playwright) at 1440×900 on desktop and 390×844 on mobile, in both dark and light themes.
I also reviewed every screenshot in `screenshots/` by eye.

**Result: 74 of 74 automated checks passed.**

| Interaction | Where checked | Result |
|---|---|---|
| Overview loads with no errors | dark, light | Pass |
| Fonts are self-hosted and load | dark, light | Pass |
| Hero simulated-paths canvas animates | dark, light | Pass |
| Chakra solar systems render (overview) | dark, light | Pass |
| Theme toggle switches theme | dark, light | Pass |
| Product menu opens and Escape closes it | dark, light | Pass |
| Product menu jumps to Journey | dark, light | Pass |
| Learn menu: YouTube linked, Courses and Blog marked Soon | dark, light | Pass |
| What-if: slider and index switch recompute the impact | dark, light | Pass |
| Journey: SIP changes the odds; Chakra’s route shows the cost to move | dark, light | Pass |
| Build: an example rule rebuilds the backtest; walk-forward opens | dark, light | Pass |
| Journal: a reason is saved and a rule is kept (the dial counts both) | dark, light | Pass |
| Portfolio views: switching to sectors re-lays the map | dark, light | Pass |
| Chakra chat: states show Listening, then Thinking, while it works | dark, light | Pass |
| Chakra chat: a what-if is worked out from the FAQ method | dark, light | Pass |
| Chakra chat: buy/sell questions get the no-tips answer | dark, light | Pass |
| Chakra chat: unknown questions get “won’t guess” | dark, light | Pass |
| Pause motion stops the hero animation | dark, light | Pass |
| Every “Open Saarth” link goes to saarth.thequantlab.in/app | dark, light | Pass |
| No link uses app.thequantlab.in | dark, light | Pass |
| Overview makes no requests outside the site | dark, light | Pass |
| No horizontal scroll at 1440px (overview) | dark, light | Pass |
| Features page loads with no errors | dark, light | Pass |
| Features: Chakra solar systems render | dark, light | Pass |
| Features: the side-by-side journeys reveal and the spine fills | dark, light | Pass |
| Features: integrations map draws its wires | dark, light | Pass |
| Features: its own Pause motion control works | dark, light | Pass |
| Features: Product menu opens the overview at What if | dark, light | Pass |
| Chakra answer on Features links across to the overview | dark, light | Pass |
| Features makes no requests outside the site | dark, light | Pass |
| index.html: no horizontal scroll at 390px | mobile dark, mobile light | Pass |
| features.html: no horizontal scroll at 390px | mobile dark, mobile light | Pass |
| Menu opens, Product expands inline, and choosing Build closes the menu | mobile dark, mobile light | Pass |
| Chakra chat opens as a sheet | mobile dark, mobile light | Pass |
| No errors | mobile dark, mobile light | Pass |
| Hero renders one still frame and says “Play motion” | reduced motion | Pass |
| First Tab reaches “Skip to content” | keyboard | Pass |
| Product menu opens with Enter; Escape closes it and returns focus | keyboard | Pass |
| Focus is visible (accent outline) | keyboard | Pass |

## Checked by eye

- **Layout.** Both pages render in dark and light themes at desktop and mobile widths, with no overlap or clipping. The fixed header, the Chakra launcher and the chat sheet all sit correctly.
- **Chakra solar system.** Its states read clearly at every size: the 76px launcher, the 64px mobile launcher and the 40px chat avatar.
  - Listening: orbits draw in.
  - Thinking: a glint passes between planets.
  - Working: the belt and comets race.
  - Answering: the planets quicken.
  - Learned: the sun turns gold, a warm light goes round each orbit, and dust forms the new planet.
  - Not sure: the system dims.
- **Hover a planet** on the overview to read the rule it stands for.
- **Tilt.** The pointer tilts the system in the Features hero.
- **Hero animation.** The simulated-paths field and its caption stay legible behind the hero text, and the closing field is quieter.
- **Fonts.** Text uses the self-hosted fonts, and सार्थ uses Anek Devanagari.
- **Theme toggle.** The new theme wipes across the page in a circle from the button, where the browser supports view transitions.
