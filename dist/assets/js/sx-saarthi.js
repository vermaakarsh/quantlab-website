/* Saarthi on the Saarth site: scripted answers drawn from what Saarth does today, page navigation,
   the glyph's wave and chart tips. Nothing here is live AI, market data or advice. Answers render
   in the Saarthi panel (sx-panel.js). */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wait = ms => new Promise(r => setTimeout(r, RM ? 0 : ms));
const GLYPH = `<svg class="sg" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path class="sg-trail" d="M2.5 18C7.5 18 10 9.6 15.2 8.3" stroke-width="1.7" stroke-linecap="round"/><circle class="sg-dot" cx="17.4" cy="7.7" r="3.1"/></svg>`;

/* ---------- state + events ---------- */
const subs = {};
const on = (ev, fn) => (subs[ev] = subs[ev] || []).push(fn);
const emit = (ev, v) => (subs[ev] || []).forEach(fn => fn(v));
let state = "idle";
function setState(s) { state = s; document.body.dataset.s = s; emit("state", s); }

/* ---------- knowledge: scripted, truthful to the live site ---------- */
const KB = [
  { id: "journal", topic: "journal", re: /\b(why did i|journal|reason|remember|decision|review)/i,
    steps: ["Opening the decision journal"],
    text: "Every decision gets a dated entry: <b>why</b>, what would change your mind, and when to look again.",
    chips: ["How do I bring my holdings in?"] },
  { id: "advice", re: /\b(should i|buy|sell|recommend|tips?|which (stock|fund)|best (stock|fund|share)|multibagger|target price)\b/i,
    steps: ["Reading the question", "Checking what Saarth is for"],
    text: "I don’t give tips or predict prices. <b>I steer the research; you make the call.</b>",
    chips: ["If banks fell 10%, what happens to me?", "Test a strategy I heard about"] },
  { id: "predict", re: /\b(predict|forecast|will (the )?(market|nifty|sensex|it) (go|rise|fall|crash)|next week|tomorrow)\b/i,
    steps: ["Reading the question", "Checking what Saarth is for"],
    text: "Nobody knows where the market goes next. I can turn a worry into a number instead.",
    chips: ["If banks fell 10%, what happens to me?", "Am I on track for my goal?"] },
  { id: "whatif", topic: "whatif", re: /\b(what if|fall|falls|drop|drops|crash|shock|scenario|bank|nifty|sector|down \d+|\d+ ?%)/i,
    steps: ["Reading an illustrative portfolio of 14 holdings", "Applying a 10% fall to NIFTY Bank", "Tracing the move to each holding", "Writing it up"],
    text: "A 10% fall in NIFTY Bank takes about <b>3.1% off</b> this portfolio, mostly through two banks and an index fund.",
    fine: "Not a forecast.", chips: ["What tax would I pay if I sold?", "Where does my risk really sit?"] },
  { id: "risk", topic: "xray", re: /\b(risk|concentrat|allocation|exposure|diversif|overlap|look.?through)/i,
    steps: ["Combining holdings across accounts", "Looking through index funds", "Grouping by sector"],
    text: "Open up the index funds and <b>38% sits in banks</b>, not the 21% your statements show.",
    chips: ["If banks fell 10%, what happens to me?"] },
  { id: "tax", topic: "whatif", re: /\b(tax|ltcg|stcg|capital gains)/i,
    steps: ["Finding the lots", "Applying India’s short- and long-term rules"],
    text: "Short- and long-term gains, <b>lot by lot</b>, before you sell.",
    chips: ["Where does my risk really sit?"] },
  { id: "goal", topic: "journey", re: /\b(goal|retire|on track|fifteen|15 years|plan|journey|future|years)\b/i,
    steps: ["Taking the goal and the date", "Simulating many possible journeys", "Measuring the spread"],
    text: "Hundreds of simulated journeys from what you hold. <b>A range, not a promise.</b>",
    chips: ["Test a strategy I heard about"] },
  { id: "unseen", topic: "unseen", re: /\b(unseen|tuned|walk.?forward|overfit|curve.?fit)/i,
    steps: ["Splitting history into windows", "Tuning on one stretch", "Testing on the next"],
    text: "Tune on one stretch, test on the next, again and again. <b>Steady on unseen years</b> is what you want.",
    chips: ["Can I rehearse with virtual money?"] },
  { id: "paper", topic: "paper", re: /\b(paper|virtual|rehearse|practice|practise)/i,
    steps: ["Opening a paper account", "Following the rule on new prices"],
    text: "Your rule on new prices, with virtual money. <b>Nothing reaches your broker.</b>",
    chips: ["What won’t Saarth do?"] },
  { id: "describe", topic: "describe", re: /\b(plain words|describe|template|turn .* into a rule|write the rule)/i,
    steps: ["Reading the idea", "Matching it to a rule template"],
    text: "Start from a template: moving averages, RSI, MACD, Bollinger or breakouts. <b>Plain words is next.</b>",
    chips: ["Would it have worked, after costs?"] },
  { id: "optimise", topic: "optimise", re: /\b(different mix|optimi[sz]|rebalanc|allocation mix|compare (a )?mix)/i,
    steps: ["Taking your assumptions", "Comparing possible mixes"],
    text: "Compare mixes under assumptions you choose. <b>It won’t pick one for you.</b>",
    fine: "Assumptions you choose. Not a forecast.", chips: ["Am I on track for my goal?"] },
  { id: "build", topic: "build", re: /\b(strategy|reel|video|backtest|rule|test|moving average|rsi|macd|idea|crossover)/i,
    steps: ["Turning the idea into a rule", "Replaying it on history, with costs", "Checking it on data it wasn’t tuned on"],
    text: "Turn it into a rule, replay it with charges, then <b>check it on years it hasn’t seen</b>.",
    chips: ["Why did I buy this?", "What won’t Saarth do?"] },
  { id: "import", topic: "import", re: /\b(import|zerodha|kite|dhan|console|csv|broker|connect|bring|apps|accounts?)\b/i,
    steps: ["Listing the ways in"],
    text: "Kite <b>read-only</b>, Console and Dhan files, or any CSV. Saarth never places orders.",
    chips: ["Where does my risk really sit?"] },
  { id: "wont", topic: "wont", re: /\b(won.?t|will not|safe|orders?|trade for me|access|privacy)\b/i,
    steps: ["Checking the principles"],
    text: "No tips, no orders, no predictions. Brokers stay read-only.",
    chips: ["What does Saarthi mean?"] },
  { id: "saarthi", re: /\b(saarthi|sarathi|charioteer|who are you|your name|what are you|mean)/i,
    steps: ["Remembering the Gita"],
    text: "Charioteer. Krishna steered; Arjuna decided. <b>I do the legwork; you make the call.</b>",
    chips: ["What can you do?"] },
  { id: "price", re: /\b(price|pricing|cost|free|subscription|pay)\b/i,
    steps: ["Checking"], text: "Pricing hasn’t been announced. You can join the beta list in the meantime.", chips: ["What’s live today?"] },
  { id: "status", topic: "status", re: /\b(live|available|launch|beta|experimental|today|when|what can you do|features?)\b/i,
    steps: ["Checking what’s live"],
    text: "<b>Grow is live.</b> <b>Build is experimental.</b>",
    chips: ["If banks fell 10%, what happens to me?", "Test a strategy I heard about"] },
];
const FALLBACK = { steps: ["Reading the question"], text: "On this page I can explain what Saarth does. Try one of these.", chips: ["If banks fell 10%, what happens to me?", "Am I on track for my goal?", "Test a strategy I heard about"] };
const match = q => KB.find(k => k.re.test(q)) || FALLBACK;

/* ---------- asking and showing ---------- */
let busy = false;
async function ask(q) {
  if (busy || !window.Panel) return;
  busy = true;
  try { await window.Panel.answer(q, match(q)); } finally { busy = false; }
}
function goTo(topic) {
  const el = $(`[data-topic~="${topic}"]`);
  if (!el) return;
  setState("navigating"); emit("navigate", el); emit("goto", topic);
  el.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
  setTimeout(() => { el.classList.remove("is-lit"); void el.offsetWidth; el.classList.add("is-lit"); setState("idle"); }, RM ? 0 : 700);
}
// any element with data-ask asks Saarthi; data-go takes you to a section
document.addEventListener("click", e => {
  const t = e.target.closest("[data-ask]"); if (t) { e.preventDefault(); ask(t.dataset.ask); }
  const g = e.target.closest("[data-go]"); if (g) { e.preventDefault(); goTo(g.dataset.go); }
});

/* ---------- motion: the glyph's trail moves like a wave ---------- */
let paused = RM;
const siteOff = () => document.documentElement.classList.contains("motion-off");
function setPaused(p) { paused = p; document.documentElement.classList.toggle("is-paused", p); emit("motion", p); }
const BASE = (() => { // points along the glyph's trail, with normals
  const P = [[2.5, 18], [7.5, 18], [10, 9.6], [15.2, 8.3]], out = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16, u = 1 - t;
    const x = u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0];
    const y = u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1];
    const dx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0]);
    const dy = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1]);
    const l = Math.hypot(dx, dy) || 1; out.push([x, y, -dy / l, dx / l, t]);
  }
  return out;
})();
const WAVE = { idle: [.75, 1.6], thinking: [1.7, 5.5], working: [1.7, 5.5], answering: [1.2, 3.2], navigating: [1.2, 3.2], deciding: [.45, .9], acting: [1.6, 4.6] };
let lastT = 0;
function waveTick(now) {
  const dt = Math.min(.05, (now - lastT) / 1000 || 0); lastT = now;
  document.querySelectorAll(".sg-trail").forEach(p => {
    const host = p.closest("[data-s]"), [amp, speed] = WAVE[host ? host.dataset.s : "idle"] || WAVE.idle;
    if (!p._ph) p._ph = Math.random() * 6;
    p._ph += dt * speed;
    p.setAttribute("d", BASE.map(([x, y, nx, ny, t], i) => {
      const o = paused || siteOff() ? 0 : amp * Math.sin(t * 9.4 - p._ph) * Math.sin(Math.PI * t);
      return (i ? "L" : "M") + (x + nx * o).toFixed(2) + " " + (y + ny * o).toFixed(2);
    }).join(""));
  });
  requestAnimationFrame(waveTick);
}

/* ---------- chart tips: point at a mark to read it; tap on touch screens ---------- */
function mountTips() {
  const t = document.createElement("div"); t.className = "sx-tip"; t.setAttribute("aria-hidden", "true"); document.body.append(t);
  let cur = null, timer;
  const place = (x, y) => { const w = t.offsetWidth, h = t.offsetHeight; t.style.left = Math.min(innerWidth - w - 8, x + 14) + "px"; t.style.top = (y + h + 22 > innerHeight ? y - h - 12 : y + 16) + "px"; };
  const show = (el, x, y) => { if (cur !== el) { cur && cur.classList.remove("tip-on"); cur = el; el.classList.add("tip-on"); t.textContent = el.getAttribute("data-tip"); } t.classList.add("on"); place(x, y); };
  const hide = () => { t.classList.remove("on"); cur && cur.classList.remove("tip-on"); cur = null; };
  document.addEventListener("pointermove", e => { if (e.pointerType === "touch") return; const el = e.target.closest && e.target.closest("[data-tip]"); el ? show(el, e.clientX, e.clientY) : hide(); }, { passive: true });
  document.addEventListener("pointerdown", e => { if (e.pointerType !== "touch") return; const el = e.target.closest && e.target.closest("[data-tip]"); if (el) { show(el, e.clientX, e.clientY); clearTimeout(timer); timer = setTimeout(hide, 2600); } else hide(); });
  addEventListener("scroll", hide, { passive: true });
}

/* ---------- boot ---------- */
window.Saarthi = { ask, goTo, on, emit, setState, match, wait, setPaused, get paused() { return paused || siteOff(); }, get state() { return state; }, GLYPH, KB };
document.addEventListener("DOMContentLoaded", () => { setState("idle"); mountTips(); requestAnimationFrame(waveTick); });
})();
