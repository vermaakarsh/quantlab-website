/* Saarth site: wires Saarthi and the live dashboards into each page. */
(() => {
const $ = s => document.querySelector(s);
const KB = id => Saarthi.KB.find(k => k.id === id);

function landing() {
  const L = window.SxLab;
  const grow = L.grow($("#grow-dash")), goal = L.goal($("#goal-box")), sl = L.sleeves($("#sleeves-box"));
  const build = L.build($("#build-lab"), $("#build-check"));
  L.strategies($("#strat"), build);
  window.PANEL_SCRIPTS = {
    intro: { meta: "Saarthi", q: "Who’s this beside the page?", steps: ["Reading the questions"], text: "I’m <b>Saarthi</b>, the guide inside Saarth. I do the legwork on questions like these. <b>You make the call.</b>", chips: ["If banks fell 10%, what happens to me?", "Should I buy HDFC Bank?"] },
    accounts: () => grow.narrate(),
    goals: () => goal.narrate(),
    sleeves: () => sl.narrate(0),
    "b-describe": () => build.narrate("describe"),
    "b-check": () => build.narrate("check"),
    "b-strategies": { meta: "Build: strategies", q: "What’s in my strategies?", steps: ["Opening your strategies"], text: "Three rules at three stages. <b>One was dropped</b>, and that’s a result too." },
    wont: { meta: "Try asking for a tip", q: "Should I buy HDFC Bank?", steps: KB("advice").steps, text: KB("advice").text, decide: "advice" },
  };
  Panel.mount($("#saarthi"), { placeholder: "Ask about your holdings, a goal or a rule", foot: "Explains and tests. Never tips or trades." });
}


/* ---------------- Features page ---------------- */
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ICON = {
  kite: '<path d="M12 3 20 12 12 21 4 12Z"/>', console: '<rect x="4" y="5" width="16" height="12" rx="1.5"/><path d="M8 20h8"/>', dhan: '<circle cx="12" cy="12" r="8"/><path d="M9 9h4a3 3 0 0 1 0 6H9Z"/>',
  csv: '<path d="M6 3.5h8l4 4V20H6Z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h6"/>', shot: '<rect x="3.5" y="6" width="17" height="13" rx="2"/><circle cx="12" cy="12.5" r="3.4"/><path d="M8.5 6l1.5-2h4l1.5 2"/>',
  hand: '<path d="M5 19 16.5 7.5l3 3L8 22H5Z" transform="translate(0 -2)"/>', plug: '<path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0Z"/><path d="M12 16v5"/>', api: '<path d="M8 8 4 12l4 4M16 8l4 4-4 4M13.5 6l-3 12"/>',
  view: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 10v10"/>', bolt: '<path d="M4 17l5-6 4 3 7-8"/><path d="M15 6h5v5"/>', book: '<path d="M5 4.5h10.5a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3Z"/><path d="M5 16.5a3 3 0 0 1 3-3h10.5"/>', test: '<path d="M4 20h16"/><path d="M6 16l4-5 3 3 5-7"/>',
};
const ic = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;

/* Bring it in: scattered sources flowing into one portfolio */
function integrations() {
  const SRC = [["kite", "Zerodha Kite", "live", 0, 2, "Through Zerodha’s own MCP server. Saarth reads holdings and never places orders."], ["console", "Console files", "live", 52, 11, "CSV or XLSX exports, checked row by row before they’re saved."], ["dhan", "Dhan", "live", 10, 25, "Statement CSVs, checked row by row."],
    ["csv", "Any CSV", "live", 56, 36, "For any broker: export a CSV and bring it in."], ["shot", "Screenshot", "live", 2, 49, "Screenshots are read using your own AI key."], ["hand", "By hand", "live", 54, 60, "Add a holding yourself, in a few seconds."],
    ["plug", "Other brokers", "next", 8, 74, "Your broker’s own connector, when it has one."], ["api", "Saarth API", "next", 50, 86, "A way to send data in from your own tools."]];
  const OUT = [["view", "Combined view", "One line per stock, every account"], ["bolt", "What if", "Scenarios on what you really own"], ["book", "Journal", "A reason beside every trade"], ["test", "Build", "Tests on the stocks you hold"]];
  const src = $("#ig-src"), out = $("#ig-out");
  src.innerHTML = SRC.map(([k, n, st, x, y], i) => `<button type="button" class="ig-s ${st}" data-i="${i}" style="left:${x}%;top:${y}%"><span class="ig-ic">${ic(k)}</span><b>${n}</b><i class="dot dot-${st}"></i></button>`).join("");
  out.innerHTML = OUT.map(([k, n, d]) => `<div class="ig-o"><span class="ig-ic">${ic(k)}</span><span><b>${n}</b><small>${d}</small></span></div>`).join("");
  const box = $("#ig"), svg = $("#ig-wires");
  function wires() {
    if (innerWidth <= 760) { svg.innerHTML = ""; return; }
    const R = box.getBoundingClientRect(), H = $("#ig-hub").getBoundingClientRect(), hx = H.left - R.left, hx2 = H.right - R.left, hy = H.top - R.top + H.height / 2, f = v => v.toFixed(1);
    svg.setAttribute("viewBox", `0 0 ${R.width} ${R.height}`);
    let d = "";
    src.querySelectorAll(".ig-s").forEach(n => { const b = n.getBoundingClientRect(), x = b.right - R.left, y = b.top - R.top + b.height / 2, mx = (x + hx) / 2; d += `<path class="w ${n.classList.contains("next") ? "next" : "live"}" data-i="${n.dataset.i}" d="M${f(x)} ${f(y)}C${f(mx)} ${f(y)} ${f(mx)} ${f(hy)} ${f(hx)} ${f(hy)}"/>`; });
    out.querySelectorAll(".ig-o").forEach(n => { const b = n.getBoundingClientRect(), x = b.left - R.left, y = b.top - R.top + b.height / 2, mx = (hx2 + x) / 2; d += `<path class="w live" d="M${f(hx2)} ${f(hy)}C${f(mx)} ${f(hy)} ${f(mx)} ${f(y)} ${f(x)} ${f(y)}"/>`; });
    svg.innerHTML = d;
  }
  new ResizeObserver(wires).observe(box); document.fonts && document.fonts.ready.then(wires); wires();
  src.querySelectorAll(".ig-s").forEach(b => b.onclick = () => {
    const [, n, st, , , d] = SRC[+b.dataset.i];
    src.querySelectorAll(".ig-s").forEach(x => x.classList.toggle("on", x === b)); svg.querySelectorAll("path").forEach(p => p.classList.toggle("on", p.dataset.i === b.dataset.i));
    Panel.run({ meta: "Bring it in", key: "ig-" + b.dataset.i, q: st === "next" ? `Can I bring in ${n.toLowerCase()}?` : `How does ${n} come in?`, steps: ["Checking the connection"], text: (st === "next" ? "<b>Not yet; it’s next.</b> " : "") + d + (st === "next" ? "" : " <b>Read-only, always.</b>") }, { auto: true });
  });
  return () => Panel.run({ meta: "Bring it in", key: "ig", q: "How does my money get in?", steps: ["Listing the ways in"], text: "Kite read-only, Console and Dhan files, any CSV, a screenshot or by hand. <b>Read-only, always.</b> Press a source to read about it.", chips: ["What won’t Saarth do?"] }, { auto: true });
}

/* Keep the reason: Saarthi asks why on the right; your journal and rules fill in on the left */
function journal() {
  const now = new Date(), day = d => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const ago = n => { const d = new Date(now); d.setDate(d.getDate() - n); return d; }, ahead = m => { const d = new Date(now); d.setMonth(d.getMonth() + m); return d; };
  const TRADES = [
    { src: "From your Zerodha import", chip: "SELL 20 INFY", title: "Sold 20 INFY", line: `You sold <b>20 Infosys</b> on ${day(ago(2))}. Want to note why? One line is enough.`, tags: ["#IT", "#trim"], replies: ["Rebalancing my IT exposure", "It had run up a lot", "Needed the money"],
      rule: { text: "When an IT holding rises about 15% in three months, you trim around a fifth of it.", seen: 3, of: 3, ev: ["Sep 2026: INFY +16%, sold 20 of 100", "Nov 2025: TCS +14%, sold 10 of 45", "Mar 2025: INFY +17%, sold 15 of 80"] } },
    { src: "From your Dhan import", chip: "BUY 15 HDFCBANK", title: "Bought 15 HDFCBANK", line: `You bought <b>15 HDFC Bank</b> on ${day(ago(1))}. Want to note why?`, tags: ["#banks", "#add"], replies: ["It fell and I wanted more", "Adding to a long-term holding", "Following my plan"],
      rule: { text: "When a bank you own falls about 10% from its high, you add to it.", seen: 2, of: 3, ev: ["Sep 2026: HDFCBANK −11% from high, bought 15", "Jan 2026: ICICIBANK −10% from high, bought 10", "Jul 2025: HDFCBANK −9% from high, held"] } },
    { src: "Your monthly investment", chip: "SIP ₹5,000 NIFTYBEES", title: "₹5,000 into NIFTYBEES", line: `Your monthly <b>₹5,000</b> went in on ${day(ago(0))}, a week after NIFTY 50 fell 8%. Want to note why?`, tags: ["#index", "#monthly"], replies: ["It’s my monthly plan", "Falls don’t change the plan", "Keeping it simple"],
      rule: { text: "You keep your monthly ₹5,000 going, even after the market falls 8% or more.", seen: 5, of: 5, ev: ["Sep 2026: NIFTY 50 −8%, SIP continued", "Jun 2026: NIFTY 50 −9%, SIP continued", "Mar 2026: NIFTY 50 −11%, SIP continued"] } },
  ];
  let k = 0, reasons = 18, ruleN = 1, stage = "ask";
  const entries = [{ date: "Example", title: "Bring financials below 35% of my portfolio", why: "The what-if showed four holdings carry 38% of my money through one sector, plus more inside my index fund.", tags: ["#banks", "#concentration"], review: day(ahead(3)) }];
  const rules = [{ n: 1, text: "You trim any single stock once it grows past 16% of your portfolio.", seen: 4, of: 4, ev: ["Aug 2026: HDFCBANK hit 17%, trimmed to 15%", "Feb 2026: INFY hit 18%, trimmed to 14%", "Oct 2025: RELIANCE hit 16%, trimmed to 12%"] }];
  const dots = (s, n) => `<span class="ev-dots" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < s ? "on" : ""}"></i>`).join("")}</span>`;
  const ruleHtml = (r, isNew) => `<article class="jb-rule${isNew ? " new" : ""}"><div class="jb-top"><span class="jb-rn">Rule ${String(r.n).padStart(2, "0")}</span></div><p class="jb-rt">${esc(r.text)}</p><div class="jb-ev">${dots(r.seen, r.of)}Seen ${r.seen} of ${r.of} times</div><details><summary>The evidence</summary><ul>${r.ev.map(e => `<li>${esc(e)}</li>`).join("")}</ul></details><a class="jb-test" href="#f-strategy">Test this rule in Build</a></article>`;
  const entryHtml = (e, isNew) => `<article class="jb-entry${isNew ? " new" : ""}"><div class="jb-top"><span>${esc(e.date)}</span></div><h4>${esc(e.title)}</h4><p><span>Why</span>${esc(e.why)}</p><div class="jb-tags">${e.tags.map(t => `<span>${esc(t)}</span>`).join("")}</div><span class="jb-review">Review on ${esc(e.review)}</span></article>`;
  function book(newEntry, newRule) {
    $("#jb-journal").innerHTML = entries.map((e, i) => entryHtml(e, newEntry && i === 0)).join("");
    $("#jb-rulelist").innerHTML = rules.map((r, i) => ruleHtml(r, newRule && i === 0)).join("");
    [["#jb-reasons", reasons], ["#jb-rules", rules.length]].forEach(([id, v]) => { const b = $(id); if (+b.textContent !== v) { b.textContent = v; b.classList.add("bump"); setTimeout(() => b.classList.remove("bump"), 1200); } });
    $("#jb-rules-l").textContent = rules.length === 1 ? "rule kept" : "rules kept";
  }
  const tab = t => { document.querySelectorAll(".jb-tabs [data-t]").forEach(b => b.setAttribute("aria-selected", b.dataset.t === t)); $("#jb-journal").hidden = t !== "journal"; $("#jb-rulelist").hidden = t !== "rules"; };
  document.querySelectorAll(".jb-tabs [data-t]").forEach(b => b.onclick = () => tab(b.dataset.t));
  function card() {
    const T = TRADES[k % TRADES.length];
    $("#jt").innerHTML = `<div class="jt-l"><span class="note">${T.src}</span><span class="jd-trade"><i></i>${esc(T.chip)}</span></div><span class="jt-r">${stage === "done" ? `<button type="button" class="jd-next" id="jt-next">Next trade</button>` : `<span class="jt-ask">${Saarthi.GLYPH}Saarthi is asking why</span>`}</span>`;
    const nb = $("#jt-next"); if (nb) nb.onclick = () => { k++; stage = "ask"; ask(); };
  }
  function ask() {
    const T = TRADES[k % TRADES.length]; stage = "ask"; card();
    Panel.run({ meta: "Journal", key: "jr-" + k, q: T.chip.replace(/^(\w+)/, m => m[0] + m.slice(1).toLowerCase()), steps: ["Reading your import"], text: T.line,
      decide: { prompt: "I won’t guess your reason.", options: T.replies.map(r => ({ label: r, sub: "", kind: "fn", fn: answer })), own: answer, ownHint: "Or write your own reason", noLater: true } }, { auto: true });
  }
  async function answer(text) {
    const T = TRADES[k % TRADES.length];
    entries.unshift({ date: day(now), title: T.title, why: text, tags: [...T.tags], review: day(ahead(3)) }); reasons++; tab("journal"); book(true, false);
    await Panel.run({ meta: "Journal", key: "jr-s" + k, q: `“${text}”`, steps: ["Saving it to your journal", "Tagging it", "Setting a review date"], text: `Saved with ${T.tags.join(" ")}. I’ll bring it back on <b>${day(ahead(3))}</b>.` }, { auto: true });
    await Saarthi.wait(700);
    const R = T.rule;
    Panel.run({ meta: "Journal: a pattern", key: "jr-p" + k, q: "I noticed a pattern in your reasons.", steps: ["Reading your past reasons", "Matching them to trades"], viz: `<div class="jd-rule"><p class="jb-rt">${esc(R.text)}</p><div class="jb-ev">${dots(R.seen, R.of)}Seen ${R.seen} of ${R.of} times</div><ul>${R.ev.map(e => `<li>${esc(e)}</li>`).join("")}</ul></div>`, text: "It’s a concept for now: <b>keep it only if it’s you.</b>",
      decide: { prompt: "", options: [{ label: "Keep it as my rule", sub: "you can test it in Build", kind: "fn", fn: keep }, { label: "That’s not me", sub: "nothing kept", kind: "fn", fn: reject }], noLater: true } }, { auto: true });
  }
  function keep() { const R = TRADES[k % TRADES.length].rule; rules.unshift({ n: ++ruleN, ...R }); tab("rules"); book(false, true); stage = "done"; card(); Panel.run({ meta: "Journal", key: "jr-k" + k, q: "Kept as a rule.", steps: ["Writing it as a rule", "Linking the evidence"], text: "It’s in your rules. <b>Test it in Build</b> before you rely on it." }, { auto: true }); }
  function reject() { stage = "done"; card(); Panel.run({ meta: "Journal", key: "jr-r" + k, q: "Nothing kept.", steps: [], text: "Understood. Your reason stays in the journal." }, { auto: true }); }
  book(false, false); card();
  return () => ask();
}

/* Portfolio management on your rules, narrated by Saarthi */
function automation() {
  const RULES = [["Tell me when any holding passes 15% of the portfolio", true], ["Check each sleeve against its plan every quarter", true], ["Ask me why after every trade", true], ["Bring due reviews from my journal to the top", false]];
  $("#ap-rules").innerHTML = RULES.map(([t, on], i) => `<li><label class="ap-tog"><input type="checkbox" data-r="${i}" ${on ? "checked" : ""}><span class="ap-sw" aria-hidden="true"></span><span>${t}</span></label></li>`).join("");
  document.querySelectorAll("#ap-rules input").forEach(inp => inp.onchange = () => {
    const t = RULES[+inp.dataset.r][0].replace(/^./, c => c.toLowerCase());
    Panel.run({ meta: "Your rules", key: "apr" + inp.dataset.r + inp.checked + Date.now(), q: inp.checked ? "Rule on." : "Rule off.", steps: ["Updating your rules"], text: inp.checked ? `Okay. I’ll ${t.replace(/^tell me/, "tell you").replace(/^ask me/, "ask you").replace(/^check/, "check").replace(/^bring/, "bring")}.` : `Off. I won’t do that any more.` }, { auto: true });
  });
  const plan = $("#ap-plan");
  const showPlan = () => {
    plan.hidden = false;
    plan.innerHTML = `<div class="ap-plan-h"><b>Back to your 80 / 20 plan</b><span class="note">Retirement sleeve</span></div><table class="wb-log"><thead><tr><th>Part</th><th>Now</th><th>Plan</th><th>Change</th></tr></thead><tbody><tr><td>Shares</td><td>₹5,33,200</td><td>₹4,96,000</td><td class="down">−₹37,200</td></tr><tr><td>Debt funds</td><td>₹86,800</td><td>₹1,24,000</td><td class="up">+₹37,200</td></tr></tbody></table>`;
    Panel.run({ meta: "Portfolio management", key: "ap-plan", q: "What would it take to get back to plan?", steps: ["Reading your 80 / 20 target", "Measuring the drift", "Working out tax, lot by lot"], text: "Move about <b>₹37,200</b> from shares to debt inside the sleeve. Tax if done today: about ₹2,900. <b>Nothing happens unless you do it.</b>",
      decide: { prompt: "", options: [{ label: "Approve into my journal", sub: "I’ll do it myself", kind: "journal", title: "Rebalance retirement to 80 / 20" }, { label: "Leave the drift", sub: "and write down why", kind: "journal", title: "Left retirement at 86% shares" }, { label: "Remind me next quarter", sub: "set a review date", kind: "review", months: 3 }] } }, { auto: true });
  };
  const FEED = [["Your plan", "Retirement drifted to 86% shares", "Planned 80%, limit 5 points", "See the plan", showPlan], ["Your limit", "HDFC Bank passed 15%", "15.4% after this week’s rise", "What does it mean?", () => Saarthi.ask("Where does my risk really sit?")], ["Your journal", "Review due: bought 20 Infosys", "You said you’d look again this month", "Open the reason", () => Saarthi.ask("Why did I buy this?")]];
  $("#ap-feed").innerHTML = FEED.map(([tag, t, sub, a], i) => `<article class="ev"><span class="ev-tag">${tag}</span><b>${t}</b><p>${sub}</p><div class="ev-acts"><button type="button" class="chip" data-f="${i}">${Saarthi.GLYPH}${a}</button></div></article>`).join("");
  document.querySelectorAll("#ap-feed [data-f]").forEach(b => b.onclick = () => FEED[+b.dataset.f][4]());
  return () => Panel.run({ meta: "Portfolio management", key: "ap", q: "What needs me this week?", steps: ["Checking your rules", "Reading your sleeves"], text: "<b>Three things.</b> Retirement drifted past your limit, HDFC Bank passed 15%, and a review is due.",
    decide: { prompt: "", options: [{ label: "See the retirement plan", sub: "from your own targets", kind: "fn", fn: showPlan }, { label: "Why did HDFC Bank pass 15%?", sub: "see where the risk sits", kind: "ask", q: "Where does my risk really sit?" }, { label: "Open the review", sub: "your reason from March", kind: "ask", q: "Why did I buy this?" }] } }, { auto: true });
}

/* Insights and signals */
function signals() {
  const SEC = [["NIFTY Bank", -3.1, 38], ["NIFTY IT", 2.4, 13], ["NIFTY Pharma", 1.6, 4], ["NIFTY FMCG", .8, 6], ["NIFTY Energy", -.4, 7], ["NIFTY Auto", -1.2, 2]];
  const W = 380, rh = 28, x0 = 100, x1 = W - 84, mid = (x0 + x1) / 2, sx = v => mid + v / 4 * (x1 - mid), sg = v => (v > 0 ? "+" : "−") + Math.abs(v);
  $("#mk-sectors").innerHTML = `<svg viewBox="0 0 ${W} ${SEC.length * rh + 18}" role="img" aria-label="Sector moves this week"><text x="${W}" y="10" font-size="10.5" text-anchor="end" fill="var(--muted)" font-family="var(--f-mono)">Your share</text><line x1="${mid}" x2="${mid}" y1="14" y2="${SEC.length * rh + 14}" stroke="var(--line)"/>` + SEC.map(([n, v, you], i) => { const y = 14 + i * rh; return `<g data-tip="${n}: ${sg(v)}% this week. Looked through, it’s ${you}% of your portfolio."><rect x="0" y="${y}" width="${W}" height="${rh}" fill="transparent"/><text x="0" y="${y + 18}" font-size="12.5" fill="var(--text-2)">${n}</text><rect x="${Math.min(mid, sx(v)).toFixed(1)}" y="${y + 8}" width="${Math.abs(sx(v) - mid).toFixed(1)}" height="12" rx="2" fill="${v < 0 ? "var(--down)" : "var(--up)"}"/><text x="${W - 44}" y="${y + 18}" font-size="12" text-anchor="end" fill="var(--text-2)" font-family="var(--f-mono)">${sg(v)}%</text><text x="${W}" y="${y + 18}" font-size="11" text-anchor="end" fill="var(--muted)" font-family="var(--f-mono)">${you}%</text></g>`; }).join("") + `</svg>`;
  $("#mk-breadth").innerHTML = `<span><b>312</b> of 500 rose</span><span><b>−0.9%</b> NIFTY 50</span>`;
  const FEED = [["Your rule", "Your 20 / 100 crossover fired", "On the steady large-cap, on Tuesday", [["Test it first", "Would a 50-day crossover have worked, after costs?"]]], ["Your holdings", "NIFTY Bank fell 3.1%", "Banks are 38% of you, looked through", [["What does it mean for me?", "If banks fell 10%, what happens to me?"]]], ["Your watchlist", "Sun Pharma is up 21% this year", "On your watchlist, not in your portfolio", [["Test a rule on it", "Test a strategy I heard about"], ["Should I buy it?", "Should I buy Sun Pharma?"]]]];
  $("#mk-feed").innerHTML = FEED.map(([tag, t, sub, acts], i) => `<article class="ev"><span class="ev-tag">${tag}</span><b>${t}</b><p>${sub}</p><div class="ev-acts">${acts.map(([l, q]) => `<button type="button" class="chip" data-ask="${esc(q)}">${Saarthi.GLYPH}${l}</button>`).join("")}</div></article>`).join("");
  return () => Panel.run({ meta: "Insights and signals", key: "mk", q: "What touched my portfolio this week?", steps: ["Reading the week", "Checking your rules and watchlist"], text: "Banks fell 3.1%, and they’re <b>38% of you</b>. One of your rules fired.",
    decide: { prompt: "", options: [{ label: "What would a bigger fall do?", sub: "run a what-if", kind: "ask", q: "If banks fell 10%, what happens to me?" }, { label: "Test the rule that fired", sub: "with charges, on history", kind: "ask", q: "Would a 50-day crossover have worked, after costs?" }] } }, { auto: true });
}

window.SxFeatures = () => {
  const L = window.SxLab;
  const c = L.prices("steady"), bt = L.backtest(c, L.TPL.ma.pos(c, { fast: 20, slow: 100 }), 252, 1259);
  $("#f-bt .f-bt-vis").innerHTML = L.equityChart(bt, 560);
  const ST = { live: ["live", "Live"], exp: ["exp", "Experimental"], next: ["next", "Next"] };
  $("#sb-list").innerHTML = [["Rule templates", "live"], ["Evidence check", "live"], ["Backtests with charges", "live"], ["Walk-forward", "live"], ["Compare rules", "live"], ["Paper trading", "exp"], ["Plain-words rules", "next"]].map(([t, s]) => `<li><i class="dot dot-${s}"></i>${t}</li>`).join("");
  const b = L.build($("#fs-lab")); L.strategies($("#fs-strat"), b);
  window.PANEL_SCRIPTS = { integrations: integrations(), journal: journal(), auto: automation(), strategy: () => b.narrate("describe"), signals: signals() };
  Panel.mount($("#saarthi"), { placeholder: "Ask how any feature works", foot: "Shows how it works. Never tips or trades." });
};

document.addEventListener("DOMContentLoaded", () => {
  if ($("#sx")) landing();
  if (window.SxFeatures && $("#sx-f")) window.SxFeatures();
});
})();
