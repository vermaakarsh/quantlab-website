/* Saarthi beside you: a pinned panel that follows the page, answers questions and shows its working.
   Each answer can end with "Your call": Saarthi lays out options, never picks one, and acts on the
   one you choose (a journal entry, a review date, another test). It never places orders.
   Pages call Panel.mount(host, { placeholder, foot }) and define window.PANEL_SCRIPTS = { key: { meta, q, steps, text, viz, chips, fine, topic, decide } }
   and mark sections with data-run="key". Demos run on an illustrative portfolio. */
window.Panel = (() => {
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ORDER = ["thinking", "working", "answering", "deciding", "acting"];
const LABEL = { idle: "Ready", thinking: "Thinking", working: "Working", answering: "Answering", deciding: "Your call", acting: "Acting on your call", navigating: "Taking you there" };
const RAIL = ["Thinks", "Works", "Answers", "Your call", "Acts"];
let sp, log, chips, input, stateEl, followBtn, rail, follow = true, runId = 0, current = null, lastKey = null;

const when = months => { const d = new Date(); d.setMonth(d.getMonth() + months); return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); };
const today = () => new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/* options Saarthi lays out. It never ranks them or picks one. */
const DECIDE = {
  exposure: { prompt: "Leaning on banks is a choice.", options: [
    { label: "Keep it as it is", sub: "and write down why", kind: "journal", title: "Keep 38% in banks and financials" },
    { label: "See what a fall would do", sub: "run the what-if", kind: "go", go: "whatif" },
    { label: "Look again in three months", sub: "set a review date", kind: "review", months: 3 }] },
  whatif: { prompt: "You might be fine with this.", options: [
    { label: "Accept the risk", sub: "and write down why", kind: "journal", title: "Accept the hit from a bank fall" },
    { label: "Compare a different mix", sub: "optimisation, experimental", kind: "ask", q: "Can I compare a different mix?" },
    { label: "Check again in a month", sub: "set a review date", kind: "review", months: 1 }] },
  tax: { prompt: "Tax is one input, not the reason.", options: [
    { label: "Hold for now", sub: "and write down why", kind: "journal", title: "Hold until more lots turn long-term" },
    { label: "Look again when a lot turns long-term", sub: "set a review date", kind: "review", months: 2 }] },
  build: { prompt: "One backtest isn’t proof.", options: [
    { label: "Check it on unseen data", sub: "walk-forward", kind: "ask", q: "Did it only work on the past it was tuned on?" },
    { label: "Rehearse with virtual money", sub: "paper trading, experimental", kind: "ask", q: "Can I rehearse with virtual money?" },
    { label: "Drop the idea", sub: "and write down why", kind: "journal", title: "Dropped the 50-day crossover idea" }] },
  goal: { prompt: "The range is wide, honestly.", options: [
    { label: "Keep the plan", sub: "and note the assumptions", kind: "journal", title: "Keep ₹10,000 a month toward the goal" },
    { label: "Try ₹15,000 a month", sub: "rerun the journeys", kind: "fan", monthly: 15000 },
    { label: "Review in six months", sub: "set a review date", kind: "review", months: 6 }] },
  advice: { prompt: "No tips. Here’s what I can do instead.", options: [
    { label: "Run a what-if", sub: "see what a fall would mean", kind: "ask", q: "If banks fell 10%, what happens to me?" },
    { label: "Test a rule on it", sub: "with costs, on history", kind: "ask", q: "Would a 50-day crossover have worked on HDFC Bank?" },
    { label: "Write down why you’re considering it", sub: "before you act", kind: "journal", title: "Considering HDFC Bank" }] },
};
const DECIDE_FOR = { whatif: "whatif", risk: "exposure", tax: "tax", build: "build", unseen: "build", describe: "build", goal: "goal", advice: "advice", predict: "advice" };

function setS(s) {
  const prev = sp.dataset.s;
  sp.dataset.s = s; Saarthi.setState(s);
  stateEl.textContent = s === "idle" ? (follow ? "Following the page" : "Your question") : LABEL[s];
  const i = ORDER.indexOf(s);
  if (i >= 0) [...rail.children].forEach((li, k) => { li.classList.toggle("done", k < i); li.classList.toggle("now", k === i); });
  else [...rail.children].forEach(li => { li.classList.remove("now"); if (prev === "acting") li.classList.add("done"); });
}
function setFollow(v) {
  follow = v; followBtn.hidden = v;
  if (sp.dataset.s === "idle") stateEl.textContent = v ? "Following the page" : "Your question";
  if (v) { lastKey = null; pickVisible(); }
}
function mount(host, opts = {}) {
  host.innerHTML = `<div class="sp-pin"><aside class="sp" data-s="idle" aria-label="Saarthi">
    <button class="sp-head" type="button" aria-expanded="false">${Saarthi.GLYPH}<b>Saarthi</b><span class="sp-state">Following the page</span><span class="sp-peek"></span></button>
    <ol class="sp-rail" aria-hidden="true">${RAIL.map(r => `<li><i></i>${r}</li>`).join("")}</ol>
    <div class="sp-sub"><button class="sp-follow" type="button" hidden>Follow the page again</button><button class="sp-close" type="button">Close</button></div>
    <div class="sp-log" aria-live="polite"></div>
    <div class="sp-chips"></div>
    <form class="sp-form" autocomplete="off"><label class="sr-only" for="sp-q">Ask Saarthi</label><input id="sp-q" placeholder="${opts.placeholder || "Ask Saarthi"}" enterkeyhint="send"><button class="sp-send" type="submit" aria-label="Ask"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg></button></form>
    <div class="sp-foot"><span>${opts.foot || "Explains and tests. Never tips or trades."}</span><button class="sp-motion" type="button" aria-pressed="false">Pause motion</button></div>
  </aside></div>`;
  sp = $(".sp", host); log = $(".sp-log", sp); chips = $(".sp-chips", sp); input = $("input", sp);
  stateEl = $(".sp-state", sp); followBtn = $(".sp-follow", sp); rail = $(".sp-rail", sp);
  $("form", sp).addEventListener("submit", e => { e.preventDefault(); const q = input.value.trim(); if (q) { input.value = ""; Saarthi.ask(q); } });
  followBtn.onclick = () => setFollow(true);
  $(".sp-head", sp).onclick = () => { if (matchMedia("(max-width: 1000px)").matches) open(!sp.classList.contains("open")); };
  $(".sp-close", sp).onclick = () => open(false);
  const mb = $(".sp-motion", sp);
  const syncMotion = () => { mb.setAttribute("aria-pressed", Saarthi.paused); mb.textContent = Saarthi.paused ? "Play motion" : "Pause motion"; };
  mb.onclick = () => { const site = document.getElementById("motion-btn"); if (site) site.click(); else Saarthi.setPaused(!Saarthi.paused); syncMotion(); };
  new MutationObserver(syncMotion).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  syncMotion();
  Saarthi.on("navigate", () => open(false));
  document.addEventListener("keydown", e => { if (e.key === "/" && document.activeElement === document.body) { e.preventDefault(); input.focus(); } if (e.key === "Escape") open(false); });
  watch();
}
function open(v) {
  const hdr = document.querySelector(".hdr");
  sp.style.top = v && hdr ? Math.max(0, hdr.getBoundingClientRect().bottom) + "px" : "";
  sp.classList.toggle("open", v); $(".sp-head", sp).setAttribute("aria-expanded", v);
  document.documentElement.classList.toggle("sp-locked", v);
}
function setChips(list) {
  chips.innerHTML = "";
  (list || []).slice(0, 3).forEach(t => { const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = t; b.dataset.ask = t; chips.append(b); });
}
const scrollEnd = () => log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });

/* one run: question, steps, picture, answer, then your call */
async function run(e, opts = {}) {
  const me = ++runId, live = () => me === runId;
  [...log.children].forEach(c => c.classList.add("past"));
  while (log.children.length > 4) log.firstChild.remove();
  const el = document.createElement("article");
  el.className = "sp-run";
  el.innerHTML = `<p class="sp-meta">${esc(e.meta || (opts.user ? "You asked" : ""))}</p><h3 class="sp-q"></h3><ol class="sb-steps"></ol><div class="sp-viz vz"></div><p class="sb-text"></p><div class="sb-acts"></div>`;
  el.querySelector(".sp-q").textContent = e.q;
  log.append(el); current = { el, key: e.key };
  $(".sp-peek", sp).textContent = e.q;
  scrollEnd();
  const fast = opts.auto ? .7 : 1;
  setS("thinking"); await Saarthi.wait(320 * fast); if (!live()) return;
  setS("working");
  const ol = el.querySelector("ol");
  for (const s of e.steps || []) {
    const li = document.createElement("li"); li.innerHTML = `<i></i><span>${s}</span>`; ol.append(li);
    await Saarthi.wait(30); li.classList.add("on"); await Saarthi.wait((360 + Math.random() * 200) * fast); if (!live()) return; li.classList.add("done");
  }
  setS("answering");
  const viz = typeof e.viz === "function" ? e.viz() : e.viz;
  if (viz) { const v = el.querySelector(".sp-viz"); v.innerHTML = viz; v.classList.add("on"); }
  const tx = el.querySelector(".sb-text"), words = e.text.split(/(\s+)/);
  for (let i = 0; i <= words.length; i += 3) { if (!live()) return; tx.innerHTML = words.slice(0, i).join(""); await Saarthi.wait(20); }
  tx.innerHTML = e.text;
  const acts = el.querySelector(".sb-acts");
  if (opts.user && e.topic && $(`[data-topic~="${e.topic}"]`)) { const g = document.createElement("button"); g.type = "button"; g.className = "chip sb-go"; g.textContent = "Show me on the page"; g.dataset.go = e.topic; acts.append(g); }
  if (e.fine) { const p = document.createElement("p"); p.className = "note"; p.textContent = e.fine; acts.after(p); }
  setChips(e.chips);
  if (e.after) e.after(el);
  scrollEnd();
  const d = typeof e.decide === "string" ? DECIDE[e.decide] : e.decide;
  if (d) { await Saarthi.wait(500); if (!live()) return; decide(el, d); }
  else setTimeout(() => live() && setS("idle"), 900);
}

/* your call: options laid out side by side, none preferred */
function decide(el, d) {
  const box = document.createElement("div");
  box.className = "sp-decide";
  box.innerHTML = `<p class="sp-dh">${Saarthi.GLYPH}<b>Your call</b></p><p class="sp-dp"></p><div class="sp-opts"></div><button class="sp-later" type="button">Decide later</button>`;
  box.querySelector(".sp-dp").textContent = (d.prompt ? d.prompt + " " : "") + "I won’t pick for you.";
  const opts = box.querySelector(".sp-opts");
  d.options.forEach(o => {
    const b = document.createElement("button"); b.type = "button"; b.className = "sp-opt";
    b.innerHTML = `<b></b><small></small>`; b.firstChild.textContent = o.label; b.lastChild.textContent = o.sub;
    b.onclick = () => choose(box, b, o);
    opts.append(b);
  });
  if (d.own) {
    const f = document.createElement("form"); f.className = "sp-own";
    f.innerHTML = `<label class="sr-only" for="sp-own">Your own answer</label><input id="sp-own" maxlength="140" placeholder="${d.ownHint || "Or write your own"}" autocomplete="off"><button class="btn btn-primary btn-sm" type="submit">Save</button>`;
    f.onsubmit = async e => { e.preventDefault(); const v = f.querySelector("input").value.trim(); if (!v || box.classList.contains("settled")) return; box.classList.add("settled"); box.querySelectorAll(".sp-opt").forEach(x => x.classList.remove("picked")); f.remove(); setS("acting"); await Saarthi.wait(300); d.own(v); };
    opts.after(f);
  }
  if (d.noLater) box.querySelector(".sp-later").hidden = true;
  box.querySelector(".sp-later").onclick = () => { if (box.classList.contains("settled")) return; box.classList.add("settled"); box.querySelector(".sp-dp").textContent = "Fine. It’ll keep. Ask me again whenever you like."; setS("idle"); };
  el.append(box); setS("deciding"); scrollEnd();
}
async function choose(box, btn, o) {
  if (box.classList.contains("settled")) return;
  box.querySelectorAll(".sp-opt").forEach(x => x.classList.toggle("picked", x === btn));
  box.classList.add("settled");
  if (o.kind === "journal") return journalForm(box, o);
  if (o.kind === "fn") { setS("acting"); await Saarthi.wait(400); o.fn(o.label); return; }
  if (o.kind === "ask") { setS("acting"); await Saarthi.wait(450); return Saarthi.ask(o.q); }
  if (o.kind === "go") { setS("acting"); await Saarthi.wait(350); lastKey = null; Saarthi.goTo(o.go); return; }
  if (o.kind === "review") return act(box, ["Setting a review date", "Filing it with this answer"], `<p class="sp-done-h">Review set for ${when(o.months)}</p><p>This answer and its working will be waiting in your journal on the day.</p>`);
  if (o.kind === "fan") return act(box, ["Changing the monthly amount to ₹15,000", "Rerunning 240 journeys"], `<div class="vz">${Viz.fan(o.monthly)}</div><p>Same assumptions, more each month. Compare the band with the one above; the choice is still yours.</p>`);
}
function journalForm(box, o) {
  const f = document.createElement("form");
  f.className = "sp-jf";
  f.innerHTML = `<label for="sp-why">Why? In your own words.</label><textarea id="sp-why" rows="2" placeholder="For example: I’m comfortable with this for the next year because…"></textarea><button class="btn btn-primary btn-sm" type="submit">Save to journal</button>`;
  f.onsubmit = e => {
    e.preventDefault();
    const why = f.querySelector("textarea").value.trim() || "Not written yet. Saarthi will ask again at review.";
    f.remove();
    act(box, ["Drafting the journal entry", "Attaching this answer as evidence", "Setting a review date"],
      `<div class="vz">${Viz.journal({ tag: "Your journal, preview", date: today(), title: o.title, why, change: "Add it any time", review: when(3) })}</div>`);
  };
  box.append(f); setS("deciding"); f.querySelector("textarea").focus({ preventScroll: true }); scrollEnd();
}
async function act(box, steps, result) {
  const me = runId;
  setS("acting");
  const ol = document.createElement("ol"); ol.className = "sb-steps"; box.append(ol);
  for (const s of steps) { const li = document.createElement("li"); li.innerHTML = `<i></i><span>${esc(s)}</span>`; ol.append(li); await Saarthi.wait(30); li.classList.add("on"); await Saarthi.wait(420); li.classList.add("done"); }
  const r = document.createElement("div"); r.className = "sp-done"; r.innerHTML = result; box.append(r); scrollEnd();
  setTimeout(() => me === runId && setS("idle"), 900);
}

// a question from anywhere on the page
function answer(q, a) {
  setFollow(false);
  if (matchMedia("(max-width: 1000px)").matches) open(true);
  return run({ q, steps: a.steps, text: a.text, chips: a.chips, fine: a.fine, topic: a.topic, viz: () => Viz.pick(a.id)(), decide: DECIDE_FOR[a.id] }, { user: true });
}
// follow the page: each section has a script
function pickVisible() {
  const mid = innerHeight * .45;
  const sec = [...document.querySelectorAll("[data-run]")].find(s => { const r = s.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
  if (sec) onSection(sec);
}
function onSection(sec) {
  const key = sec.dataset.run, S = window.PANEL_SCRIPTS || {};
  if (!follow || key === lastKey || !S[key]) return;
  lastKey = key;
  if (typeof S[key] === "function") return S[key]();
  run({ ...S[key], key }, { auto: true });
}
function watch() {
  const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && onSection(e.target)), { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("[data-run]").forEach(s => io.observe(s));
}
// let the page update the current picture live (the what-if slider)
function update(key, fn) { if (current && current.key === key && !["thinking", "working"].includes(sp.dataset.s)) fn(current.el); }
// let the page run a script on demand (rows, cards, charts)
function play(key, force) { const S = window.PANEL_SCRIPTS || {}; if (!S[key] || (key === lastKey && !force)) return; lastKey = key; if (matchMedia("(max-width: 1000px)").matches) open(true); run({ ...S[key], key }, { auto: true }); }
return { mount, run, answer, update, play, setFollow, get follow() { return follow; } };
})();
