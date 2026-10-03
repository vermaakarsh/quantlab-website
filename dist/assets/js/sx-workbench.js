/* Live dashboards for the Saarth site: Grow (a portfolio you can poke) and Build (a rule workbench
   that really backtests). Prices are generated, not market data; every view says so. */
window.SxLab = (() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const f1 = n => +(+n).toFixed(1);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const inr = v => (v < 0 ? "−" : "") + "₹" + Math.round(Math.abs(v)).toLocaleString("en-IN");
const pct = (v, d = 1) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(d) + "%";
const T = (x, y, t, o = {}) => `<text x="${f1(x)}" y="${f1(y)}" font-size="${o.s || 10.5}" fill="${o.c || "var(--muted)"}"${o.a ? ` text-anchor="${o.a}"` : ""}${o.body ? "" : ' font-family="var(--f-mono)"'}>${esc(t)}</text>`;
const tip = t => ` data-tip="${esc(t)}"`;
const pathOf = pts => pts.map(([x, y], i) => (i ? "L" : "M") + f1(x) + " " + f1(y)).join("");
const nice = (lo, hi, n = 4) => { const step = Math.pow(10, Math.floor(Math.log10((hi - lo) / n))), m = [1, 2, 2.5, 5, 10].find(k => (hi - lo) / (k * step) <= n) * step; const out = []; for (let v = Math.ceil(lo / m) * m; v <= hi + 1e-9; v += m) out.push(+v.toFixed(6)); return out; };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ---------------- prices: generated, with regimes, so rules have something to find ---------------- */
const STOCKS = {
  steady: { name: "Steady large-cap", seed: 40, drift: .00042, vol: .011 },
  choppy: { name: "Choppy mid-cap", seed: 28, drift: .00018, vol: .019 },
  trend: { name: "Trending small-cap", seed: 195, drift: .0007, vol: .022 },
};
const HIST = 1260, FWD = 120, cache = {};
function prices(key) {
  if (cache[key]) return cache[key];
  const s = STOCKS[key], r = rng(s.seed), out = [1000]; let p = 1000, d = s.drift;
  for (let i = 1; i < HIST + FWD; i++) { if (i % 150 === 0) d = s.drift + (r() - .5) * s.drift * 5; p *= Math.exp(d + s.vol * gauss(r)); out.push(p); }
  return (cache[key] = out);
}
function sma(a, k) { const o = new Array(a.length).fill(null); let s = 0; for (let i = 0; i < a.length; i++) { s += a[i]; if (i >= k) s -= a[i - k]; if (i >= k - 1) o[i] = s / k; } return o; }
function rsi(a, k = 14) { const o = new Array(a.length).fill(null); let g = 0, l = 0; for (let i = 1; i < a.length; i++) { const d = a[i] - a[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0); if (i <= k) { g += up / k; l += dn / k; if (i === k) o[i] = 100 - 100 / (1 + g / (l || 1e-9)); } else { g = (g * (k - 1) + up) / k; l = (l * (k - 1) + dn) / k; o[i] = 100 - 100 / (1 + g / (l || 1e-9)); } } return o; }
const roll = (a, k, fn) => a.map((_, i) => i < k - 1 ? null : fn(...a.slice(i - k + 1, i + 1)));

/* ---------------- rule templates (the ones live in Build) ---------------- */
const TPL = {
  ma: { name: "Moving-average crossover", params: [{ id: "fast", label: "Fast average", min: 5, max: 60, step: 5, v: 20, unit: " days" }, { id: "slow", label: "Slow average", min: 70, max: 220, step: 10, v: 100, unit: " days" }],
    sentence: p => `Buy when the ${p.fast}-day average crosses above the ${p.slow}-day. Sell when it crosses back.`,
    pos(c, p) { const f = sma(c, p.fast), s = sma(c, p.slow); return c.map((_, i) => f[i] != null && s[i] != null && f[i] > s[i] ? 1 : 0); },
    lines(c, p) { return [[sma(c, p.fast), "var(--accent)", p.fast + "-day"], [sma(c, p.slow), "var(--sun)", p.slow + "-day"]]; },
    grid: [[10, 100], [20, 100], [20, 150], [30, 150], [50, 200], [10, 200]].map(([fast, slow]) => ({ fast, slow })) },
  rsi: { name: "RSI", params: [{ id: "buy", label: "Buy when RSI drops below", min: 15, max: 40, step: 1, v: 30, unit: "" }, { id: "sell", label: "Sell when RSI rises above", min: 55, max: 85, step: 1, v: 70, unit: "" }],
    sentence: p => `Buy when the 14-day RSI drops below ${p.buy}. Sell when it rises above ${p.sell}.`,
    pos(c, p) { const r = rsi(c); let h = 0; return c.map((_, i) => { if (r[i] == null) return 0; if (!h && r[i] < p.buy) h = 1; else if (h && r[i] > p.sell) h = 0; return h; }); },
    lines() { return []; },
    grid: [[25, 65], [30, 70], [35, 70], [30, 75], [25, 75], [35, 65]].map(([buy, sell]) => ({ buy, sell })) },
  brk: { name: "52-week breakout", params: [{ id: "look", label: "Buy above the high of the last", min: 60, max: 252, step: 12, v: 252, unit: " days" }, { id: "exit", label: "Sell below the low of the last", min: 10, max: 60, step: 5, v: 20, unit: " days" }],
    sentence: p => `Buy when the price beats its ${p.look}-day high. Sell when it drops below its ${p.exit}-day low.`,
    pos(c, p) { const hi = roll(c, p.look, Math.max), lo = roll(c, p.exit, Math.min); let h = 0; return c.map((v, i) => { if (i < p.look) return 0; if (!h && v >= hi[i - 1]) h = 1; else if (h && lo[i - 1] != null && v <= lo[i - 1]) h = 0; return h; }); },
    lines(c, p) { return [[roll(c, p.look, Math.max), "var(--accent)", p.look + "-day high"], [roll(c, p.exit, Math.min), "var(--sun)", p.exit + "-day low"]]; },
    grid: [[120, 10], [120, 20], [252, 20], [252, 40], [180, 20], [180, 40]].map(([look, exit]) => ({ look, exit })) },
};

/* ---------------- backtest: decide at the close, hold from the next day ---------------- */
const COST = .0012; // charges a side, as a share of the trade
function backtest(c, pos, from, to, withCost = true) {
  const cost = withCost ? COST : 0, E = [1e5], B = [1e5], D = [0], trades = [];
  let e = 1e5, b = 1e5, peak = e, bpeak = b, dd = 0, bdd = 0, held = 0, inE = 0, inI = 0, charges = 0;
  for (let i = from; i < to; i++) {
    if (pos[i] !== held) { charges += e * cost; e *= 1 - cost; if (pos[i]) { inE = e; inI = i; } else trades.push({ in: inI, out: i, ret: e / inE - 1 }); held = pos[i]; }
    const r = c[i + 1] / c[i] - 1; if (held) e *= 1 + r; b *= 1 + r;
    peak = Math.max(peak, e); bpeak = Math.max(bpeak, b); dd = Math.min(dd, e / peak - 1); bdd = Math.min(bdd, b / bpeak - 1);
    E.push(e); B.push(b); D.push(e / peak - 1);
  }
  if (held) trades.push({ in: inI, out: to, ret: e / inE - 1, open: true });
  const yrs = (to - from) / 252, ann = x => (Math.pow(x / 1e5, 1 / yrs) - 1) * 100;
  const closed = trades.filter(t => !t.open);
  return { E, B, D, trades, charges, cagr: ann(e), bcagr: ann(b), dd: dd * 100, bdd: bdd * 100, win: closed.length ? closed.filter(t => t.ret > 0).length / closed.length * 100 : 0, from, to, end: e, bend: b };
}
function walk(c, tpl) {
  const out = [], TR = 504, TE = 126, posCache = tpl.grid.map(p => [p, tpl.pos(c.slice(0, HIST), p)]);
  for (let s = 0; s + TR + TE <= HIST - 1; s += TE) {
    let best = null;
    for (const [p, pos] of posCache) { const r = backtest(c, pos, s, s + TR); if (!best || r.end > best.r.end) best = { p, pos, r }; }
    const t = backtest(c, best.pos, s + TR, s + TR + TE);
    out.push({ from: s, to: s + TR, test: s + TR + TE, p: best.p, ret: (t.end / 1e5 - 1) * 100, bh: (t.bend / 1e5 - 1) * 100 });
  }
  return out;
}

/* ---------------- charts with a width, for the dashboards ---------------- */
const svg = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const hl = (x0, x1, y, c = "var(--line-soft)") => `<line x1="${f1(x0)}" x2="${f1(x1)}" y1="${f1(y)}" y2="${f1(y)}" stroke="${c}"/>`;
const yr = i => "Year " + (Math.floor(i / 252) + 1);
function priceChart(c, from, to, lines, trades, W = 500) {
  const H = 210, x0 = 46, x1 = W - 6, y0 = 22, y1 = H - 20, step = 3, idx = [];
  for (let i = from; i <= to; i += step) idx.push(i);
  const vis = idx.map(i => c[i]), lo = Math.min(...vis) * .97, hi = Math.max(...vis) * 1.02;
  const sx = i => x0 + (i - from) / (to - from) * (x1 - x0), sy = v => y1 - (v - lo) / (hi - lo) * (y1 - y0);
  let b = nice(lo, hi, 3).map(v => hl(x0, x1, sy(v)) + T(x0 - 5, sy(v) + 3.5, "₹" + Math.round(v).toLocaleString("en-IN"), { a: "end" })).join("");
  b += [0, 1, 2, 3, 4].map(k => from + k * 252).filter(i => i < to).map(i => T(sx(i), H - 5, yr(i - from), { a: i === from ? "start" : "middle" })).join("");
  let lx = x0;
  b += `<rect x="${lx}" y="3" width="9" height="9" rx="2" fill="var(--text-2)" fill-opacity=".6"/>` + T(lx + 13, 11, "Price"); lx += 64;
  lines.forEach(([arr, col, lab]) => { b += `<rect x="${lx}" y="3" width="9" height="9" rx="2" fill="${col}"/>` + T(lx + 13, 11, lab); lx += 34 + lab.length * 6.6; });
  b += `<path d="${pathOf(idx.map(i => [sx(i), sy(c[i])]))}" stroke="var(--text-2)" stroke-opacity=".6" fill="none" stroke-width="1.2"/>`;
  lines.forEach(([arr, col]) => { const pts = idx.filter(i => arr[i] != null).map(i => [sx(i), sy(arr[i])]); if (pts.length) b += `<path d="${pathOf(pts)}" stroke="${col}" fill="none" stroke-width="1.6"/>`; });
  trades.filter(t => t.in >= from).forEach(t => {
    const bx = sx(t.in), by = sy(c[t.in]);
    b += `<g${tip(`Bought on day ${t.in - from + 1} at ₹${Math.round(c[t.in]).toLocaleString("en-IN")}${t.open ? ", still held" : `, sold on day ${t.out - from + 1}: ${pct(t.ret * 100)}`}`)}><path d="M${f1(bx)} ${f1(by + 6)}l4 7h-8z" fill="var(--up)"/><circle cx="${f1(bx)}" cy="${f1(by + 9)}" r="9" fill="transparent"/></g>`;
    if (!t.open) { const sx2 = sx(t.out), sy2 = sy(c[t.out]); b += `<g${tip(`Sold on day ${t.out - from + 1} at ₹${Math.round(c[t.out]).toLocaleString("en-IN")}: ${pct(t.ret * 100)} on that trade`)}><path d="M${f1(sx2)} ${f1(sy2 - 6)}l4 -7h-8z" fill="var(--down)"/><circle cx="${f1(sx2)}" cy="${f1(sy2 - 9)}" r="9" fill="transparent"/></g>`; }
  });
  return svg(W, H, b, "Price with the rule’s buys and sells");
}
function equityChart(r, W = 500) {
  const H = 230, x0 = 52, x1 = W - 6, y0 = 22, y1 = 150, d0 = 166, d1 = H - 18, N = r.E.length - 1;
  const lo = Math.min(...r.E, ...r.B), hi = Math.max(...r.E, ...r.B), dmin = Math.min(-1, Math.min(...r.D) * 100);
  const sx = i => x0 + i / N * (x1 - x0), sy = v => y1 - (v - lo) / (hi - lo) * (y1 - y0), sd = v => d0 + v * 100 / dmin * (d1 - d0);
  const st = Math.max(1, Math.floor(N / 240)), I = []; for (let i = 0; i <= N; i += st) I.push(i);
  let b = nice(lo, hi, 3).map(v => hl(x0, x1, sy(v)) + T(x0 - 5, sy(v) + 3.5, "₹" + (v / 1e5).toFixed(1) + "L", { a: "end" })).join("");
  b += `<rect x="${x0}" y="3" width="9" height="9" rx="2" fill="var(--accent)"/>` + T(x0 + 13, 11, "Your rule") + `<rect x="${x0 + 88}" y="3" width="9" height="9" rx="2" fill="var(--line-strong)"/>` + T(x0 + 101, 11, "Buy and hold") + T(x1, 11, "₹1 lakh to start", { a: "end" });
  b += `<path d="${pathOf(I.map(i => [sx(i), sy(r.B[i])]))}" stroke="var(--line-strong)" stroke-width="1.4" fill="none"/><path d="${pathOf(I.map(i => [sx(i), sy(r.E[i])]))}" stroke="var(--accent)" stroke-width="2" fill="none"/>`;
  b += hl(x0, x1, d0, "var(--line)") + T(x0 - 5, d0 + 3.5, "0%", { a: "end" }) + T(x0 - 5, d1, Math.round(dmin) + "%", { a: "end" }) + T(x1, d1 + 12, "How far the rule fell from its high", { a: "end" });
  b += `<path d="${pathOf(I.map(i => [sx(i), sd(r.D[i])]))}L${f1(x1)} ${d0}L${x0} ${d0}Z" fill="var(--down)" fill-opacity=".22" stroke="var(--down)" stroke-width="1"/>`;
  for (let y = 0; y < N; y += 126) { const e = Math.min(N, y + 126); b += `<rect x="${f1(sx(y))}" y="${y0}" width="${f1(sx(e) - sx(y))}" height="${d1 - y0}" fill="transparent"${tip(`Month ${Math.round(e / 21)}: rule ${inr(r.E[e])}, buy and hold ${inr(r.B[e])}`)}/>`; }
  return svg(W, H, b, "Rule against buy and hold, with drawdown");
}
function walkChart(ws, W = 500) {
  const rh = 30, top = 22, H = top + ws.length * rh + 24, x0 = 4, x1 = W - 128, span = HIST, sx = i => x0 + i / span * (x1 - x0);
  let b = `<rect x="${x0}" y="3" width="9" height="9" rx="2" fill="var(--text-2)" fill-opacity=".35"/>` + T(x0 + 13, 11, "Tuned on") + `<rect x="${x0 + 80}" y="3" width="9" height="9" rx="2" fill="var(--accent)"/>` + T(x0 + 93, 11, "Tested on, unseen") + T(W - 64, 11, "Rule", { a: "end" }) + T(W, 11, "Hold", { a: "end" });
  ws.forEach((w, k) => {
    const y = top + k * rh;
    b += `<g${tip(`Tuned on months ${Math.round(w.from / 21) + 1} to ${Math.round(w.to / 21)}, the best setting was ${Object.values(w.p).join(" and ")}. On the next six months, unseen: rule ${pct(w.ret)}, holding ${pct(w.bh)}.`)}><rect x="0" y="${y}" width="${W}" height="${rh}" fill="transparent"/><rect x="${f1(sx(w.from))}" y="${y + 7}" width="${f1(sx(w.to) - sx(w.from) - 2)}" height="14" rx="2" fill="var(--text-2)" fill-opacity=".35"/><rect x="${f1(sx(w.to))}" y="${y + 7}" width="${f1(sx(w.test) - sx(w.to) - 1)}" height="14" rx="2" fill="var(--accent)"/>${T(sx(w.from) + 6, y + 18, Object.values(w.p).join(" / "), { c: "var(--text)", s: 10 })}${T(W - 64, y + 18, pct(w.ret), { a: "end", c: w.ret < 0 ? "var(--down)" : "var(--up)" })}${T(W, y + 18, pct(w.bh), { a: "end" })}</g>`;
  });
  b += T(x0, H - 4, "Month 1") + T(x1, H - 4, "Month 60", { a: "end" });
  return svg(W, H, b, "Walk-forward windows");
}
function paperChart(c, pos, W = 500) {
  const from = HIST - 1, to = HIST + FWD - 1, r = backtest(c, pos, from, to), H = 190, x0 = 52, x1 = W - 6, y0 = 24, y1 = H - 22, N = r.E.length - 1;
  const lo = Math.min(...r.E) * .995, hi = Math.max(...r.E) * 1.005, sx = i => x0 + i / N * (x1 - x0), sy = v => y1 - (v - lo) / (hi - lo) * (y1 - y0);
  let b = nice(lo, hi, 3).map(v => hl(x0, x1, sy(v)) + T(x0 - 5, sy(v) + 3.5, inr(v), { a: "end" })).join("");
  b += T(x0, 12, `Virtual ₹1 lakh, following your rule on the next ${FWD} days`);
  const pl = Math.min(...c.slice(from, to + 1)), ph = Math.max(...c.slice(from, to + 1)), py = v => y1 - (v - pl) / (ph - pl || 1) * (y1 - y0);
  b += `<path d="${pathOf(c.slice(from, to + 1).map((v, i) => [sx(i), py(v)]))}" stroke="var(--text-2)" stroke-opacity=".35" fill="none" stroke-width="1.2"/>` + T(x1, y0 + 2, "Price, faint", { a: "end" });
  b += `<path d="${pathOf(r.E.map((v, i) => [sx(i), sy(v)]))}" stroke="var(--accent)" stroke-width="2" fill="none"/>`;
  r.trades.forEach(t => [[t.in, "Virtual buy"], ...(t.open ? [] : [[t.out, "Virtual sell"]])].forEach(([i, lab]) => { if (i < from) return; const k = i - from; b += `<g${tip(`${lab} on day ${k + 1}. It stays inside Saarth; your broker never sees it.`)}><circle cx="${f1(sx(k))}" cy="${f1(sy(r.E[k]))}" r="4.5" fill="var(--bg-2)" stroke="${lab === "Virtual buy" ? "var(--up)" : "var(--down)"}" stroke-width="1.8"/><circle cx="${f1(sx(k))}" cy="${f1(sy(r.E[k]))}" r="12" fill="transparent"/></g>`; }));
  b += T(x0, H - 6, "Day 1") + T(x1, H - 6, "Day " + FWD, { a: "end" });
  return { html: svg(W, H, b, "Paper account"), r };
}

/* ---------------- Build: the rule workbench ---------------- */
function build(host, host2) {
  // One rule, two places: host holds the controls with Describe and Test; host2 (optional) shows Check and Rehearse.
  const ALL = [["describe", "Describe"], ["test", "Test"], ["check", "Check"], ["rehearse", "Rehearse"]];
  const T1 = host2 ? ALL.slice(0, 2) : ALL, T2 = host2 ? ALL.slice(2) : [];
  const st = { tpl: "ma", stock: "choppy", p: {}, tab: "describe", tab2: "check", cost: true };
  const setDefaults = () => { st.p = Object.fromEntries(TPL[st.tpl].params.map(x => [x.id, x.v])); };
  setDefaults();
  const tabs = (list, off = 0) => `<div class="wb-tabs" role="tablist">${list.map(([k, l], i) => `<button type="button" role="tab" data-tab="${k}"><b>${i + 1 + off}</b>${l}</button>`).join("")}</div>`;
  host.innerHTML = `<div class="wb panel">
    <div class="wb-ctl">
      <div class="wb-f"><span class="wb-l">Rule</span><div class="wb-chips" data-k="tpl">${Object.entries(TPL).map(([k, t]) => `<button type="button" class="chip" data-v="${k}">${t.name}</button>`).join("")}</div></div>
      <div class="wb-f"><span class="wb-l">On</span><div class="wb-chips" data-k="stock">${Object.entries(STOCKS).map(([k, s]) => `<button type="button" class="chip" data-v="${k}">${s.name}</button>`).join("")}</div></div>
      <div class="wb-params"></div>
      <p class="wb-rule mono"></p>
      <p class="note">Prices are generated, not market data.</p>
    </div>
    <div class="wb-main">${tabs(T1)}<div class="wb-view vz"></div></div>
  </div>`;
  if (host2) host2.innerHTML = `<div class="wb wb-solo panel"><div class="wb-main">${tabs(T2, 2)}<p class="wb-for"><span class="note">The rule from above</span><span class="wb-rule2 mono"></span></p><div class="wb-view vz"></div></div></div>`;
  const view = $(".wb-view", host), view2 = host2 && $(".wb-view", host2), params = $(".wb-params", host);
  function drawParams() {
    params.innerHTML = TPL[st.tpl].params.map(x => `<label class="wb-sl"><span>${x.label}<b data-o="${x.id}">${st.p[x.id]}${x.unit}</b></span><input type="range" min="${x.min}" max="${x.max}" step="${x.step}" value="${st.p[x.id]}" data-p="${x.id}"></label>`).join("");
    $$("input", params).forEach(inp => inp.addEventListener("input", () => { st.p[inp.dataset.p] = +inp.value; $(`[data-o="${inp.dataset.p}"]`, params).textContent = inp.value + TPL[st.tpl].params.find(x => x.id === inp.dataset.p).unit; render(); narrate(st.tab); }));
  }
  function sync() {
    $$(".wb-chips", host).forEach(g => $$(".chip", g).forEach(c => c.setAttribute("aria-pressed", c.dataset.v === st[g.dataset.k])));
    $$(".wb-tabs [data-tab]", host).forEach(b => b.setAttribute("aria-selected", b.dataset.tab === st.tab));
    if (host2) $$(".wb-tabs [data-tab]", host2).forEach(b => b.setAttribute("aria-selected", b.dataset.tab === st.tab2));
    $(".wb-rule", host).textContent = TPL[st.tpl].sentence(st.p);
    if (host2) $(".wb-rule2", host2).textContent = `${TPL[st.tpl].name}, ${Object.values(st.p).join(" / ")}, on the ${STOCKS[st.stock].name.toLowerCase()}`;
  }
  let res = null;
  function compute() { const c = prices(st.stock), t = TPL[st.tpl], pos = t.pos(c, st.p), from = 252; res = { c, pos, t, bt: backtest(c, pos, from, HIST - 1, st.cost), from }; return res; }
  function draw(tab, v) {
    const { c, pos, t, bt, from } = res;
    if (tab === "describe") v.innerHTML = priceChart(c, from, HIST - 1, t.lines(c, st.p), bt.trades) + `<p class="wb-cap">Green marks are where the rule would have bought; red, where it would have sold. Point at one to read it.</p>`;
    if (tab === "test") {
      const m = [["Rule, a year", pct(bt.cagr), bt.cagr >= bt.bcagr ? "up" : ""], ["Holding, a year", pct(bt.bcagr), ""], ["Rule’s worst fall", pct(bt.dd, 0), "down"], ["Holding’s worst fall", pct(bt.bdd, 0), "down"], ["Trades", bt.trades.length, ""], ["Charges paid", inr(bt.charges), ""]];
      v.innerHTML = `<div class="wb-kpis">${m.map(([l, x, c2]) => `<div><span>${l}</span><b class="${c2}">${x}</b></div>`).join("")}</div>${equityChart(bt)}<label class="wb-tog"><input type="checkbox" ${st.cost ? "checked" : ""}> Include charges of ${(COST * 100).toFixed(2)}% a side</label>
        <table class="wb-log"><thead><tr><th>Trade</th><th>Bought</th><th>Sold</th><th>Result</th></tr></thead><tbody>${bt.trades.slice(-4).reverse().map((tr, k) => `<tr><td>${bt.trades.length - k}</td><td>Day ${tr.in - from + 1}</td><td>${tr.open ? "Still held" : "Day " + (tr.out - from + 1)}</td><td class="${tr.ret < 0 ? "down" : "up"}">${pct(tr.ret * 100)}</td></tr>`).join("")}</tbody></table>`;
      $(".wb-tog input", v).onchange = e => { st.cost = e.target.checked; render(); narrateNow("test"); };
    }
    if (tab === "check") {
      const ws = walk(c, t), good = ws.filter(w => w.ret > 0).length, beat = ws.filter(w => w.ret > w.bh).length, changes = ws.filter((w, i) => i && JSON.stringify(w.p) !== JSON.stringify(ws[i - 1].p)).length;
      v.innerHTML = walkChart(ws) + `<div class="wb-kpis three"><div><span>Unseen windows that made money</span><b>${good} of ${ws.length}</b></div><div><span>Beat holding</span><b>${beat} of ${ws.length}</b></div><div><span>Best setting changed</span><b>${changes === 0 ? "Never" : changes === 1 ? "Once" : changes + " times"}</b></div></div>`;
      res.ws = { good, beat, changes, n: ws.length };
    }
    if (tab === "rehearse") {
      const pc = paperChart(c, pos); res.paper = pc.r;
      const waiting = !pc.r.trades.length ? `<p class="wb-cap">No signal yet in these ${FWD} days, so the virtual money is waiting in cash. ${TPL[st.tpl].sentence(st.p)}</p>` : "";
      v.innerHTML = pc.html + waiting + `<div class="wb-kpis three"><div><span>Virtual balance</span><b>${inr(pc.r.end)}</b></div><div><span>Virtual orders</span><b>${pc.r.trades.length + pc.r.trades.filter(x => !x.open).length}</b></div><div><span>Orders sent to a broker</span><b>0</b></div></div>`;
    }
  }
  function render() { sync(); compute(); draw(st.tab, view); if (host2) draw(st.tab2, view2); }
  /* Saarthi narrates the dashboard; it doesn't drive it */
  function narrateNow(tab = st.tab) {
    if (!res.ws && tab === "check") { st.tab2 = "check"; render(); }
    if (!res.paper && tab === "rehearse") { const pc = paperChart(res.c, res.pos); res.paper = pc.r; }
    const { bt, t } = res, name = t.name.toLowerCase(), stock = STOCKS[st.stock].name.toLowerCase();
    const decide = { prompt: "", options: [
      { label: "Check it on unseen years", sub: "walk-forward", kind: "fn", fn: () => go("check") },
      { label: "Rehearse with virtual money", sub: "paper trading, experimental", kind: "fn", fn: () => go("rehearse") },
      { label: "Drop the idea", sub: "and write down why", kind: "journal", title: `Dropped the ${name} on the ${stock}` }] };
    const S = {
      describe: { q: `What does this rule do?`, steps: ["Reading the rule", "Marking its buys and sells"], text: `It traded <b>${bt.trades.length} times</b> in four years on the ${stock}. Each mark on the chart is one.` },
      test: { q: `Did it work, after charges?`, steps: ["Replaying four years", st.cost ? "Charging every trade" : "Leaving charges out"], text: `Rule <b>${pct(bt.cagr)} a year</b>, worst fall ${pct(bt.dd, 0)}. Holding: ${pct(bt.bcagr)} a year, worst fall ${pct(bt.bdd, 0)}.`, decide },
      check: res.ws && { q: `Does it hold up on years it hasn’t seen?`, steps: ["Tuning on two years", "Testing the next six months", "Repeating"], text: `Made money in <b>${res.ws.good} of ${res.ws.n}</b> unseen windows and beat holding in ${res.ws.beat}. The best setting changed ${res.ws.changes === 0 ? "never" : res.ws.changes === 1 ? "once" : res.ws.changes + " times"}.`, decide: { prompt: "", options: [{ label: "Rehearse with virtual money", sub: "paper trading, experimental", kind: "fn", fn: () => go("rehearse") }, { label: "Keep testing", sub: "try other settings", kind: "fn", fn: () => go("describe") }, { label: "Drop the idea", sub: "and write down why", kind: "journal", title: `Dropped the ${name}` }] } },
      rehearse: res.paper && { q: `What happens with virtual money?`, steps: ["Opening a paper account", "Following the rule on new prices"], text: res.paper.trades.length ? `Virtual ₹1 lakh is now <b>${inr(res.paper.end)}</b>. Every order stayed inside Saarth.` : `<b>No signal yet</b>, so the virtual money waits in cash. Nothing reaches your broker either way.`, decide: { prompt: "", options: [{ label: "Keep it running on paper", sub: "and review in a month", kind: "review", months: 1 }, { label: "Save the evidence", sub: "to your journal", kind: "journal", title: `Paper-traded the ${name}` }] } },
    };
    const e = S[tab]; if (e) Panel.run({ meta: `Build: ${t.name}`, fine: "Generated prices, not market data.", key: "lab", ...e }, { auto: true });
  }
  const narrate = debounce(t => narrateNow(t), 650);
  function go(tab) {
    const second = host2 && T2.some(x => x[0] === tab);
    if (second) st.tab2 = tab; else st.tab = tab;
    render(); narrateNow(tab);
    (second ? host2 : host).scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  $$(".wb-chips", host).forEach(g => g.addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; st[g.dataset.k] = b.dataset.v; if (g.dataset.k === "tpl") { setDefaults(); drawParams(); } render(); narrateNow(st.tab); }));
  $$(".wb-tabs [data-tab]", host).forEach(b => b.onclick = () => go(b.dataset.tab));
  if (host2) $$(".wb-tabs [data-tab]", host2).forEach(b => b.onclick = () => go(b.dataset.tab));
  drawParams(); render();
  Saarthi.on("goto", t => { const tab = { build: "test", unseen: "check", paper: "rehearse", describe: "describe" }[t]; if (tab) setTimeout(() => go(tab), 650); });
  const config = () => ({ tpl: st.tpl, stock: st.stock, p: { ...st.p } });
  function load(cfg) { st.tpl = cfg.tpl; st.stock = cfg.stock; st.p = { ...cfg.p }; st.tab = "test"; drawParams(); render(); narrateNow("test"); host.scrollIntoView({ behavior: "smooth", block: "start" }); }
  return { narrate: narrateNow, go, config, load };
}

/* ---------------- Sleeves: money grouped by what it's for ---------------- */
function sleeves(host) {
  const SL = [
    { name: "Retirement", when: "2045", amt: 620000, goal: 4000000, target: 80, actual: 86 },
    { name: "A home", when: "2030", amt: 280000, goal: 1500000, target: 50, actual: 58 },
    { name: "Safety net", when: "Any time", amt: 100000, goal: 150000, target: 0, actual: 0 },
  ];
  let cur = 0;
  host.innerHTML = `<div class="sl panel"><div class="sl-top"><span class="note">₹10,00,000 across three sleeves</span></div><div class="sl-bar">${SL.map(s => `<i style="flex:${s.amt}"></i>`).join("")}</div><div class="sl-rows">${SL.map((s, i) => {
    const drift = s.actual - s.target;
    return `<button type="button" class="sl-row" data-i="${i}"><span class="sl-name"><b>${s.name}</b><small>${s.when}</small></span>
      <span class="sl-amt"><b>${inr(s.amt)}</b><small>of ${inr(s.goal)} goal</small><span class="sl-prog"><i style="width:${Math.min(100, s.amt / s.goal * 100).toFixed(1)}%"></i></span></span>
      <span class="sl-mix"><span class="sl-mixbar"><i style="width:${s.actual}%"></i><em style="left:${s.target}%"></em></span><small>${s.actual}% shares, ${s.target}% planned</small></span>
      <span class="sl-drift ${Math.abs(drift) >= 5 ? "on" : ""}">${drift ? (drift > 0 ? "+" : "−") + Math.abs(drift) + " pts" : "On plan"}</span></button>`; }).join("")}</div></div>`;
  function narrate(i = cur) {
    cur = i; const s = SL[i], drift = s.actual - s.target;
    $$(".sl-row", host).forEach(r => r.setAttribute("aria-current", +r.dataset.i === i));
    Panel.run({ meta: "Grow: sleeves", key: "sleeve-" + i, q: `How is my ${s.name.toLowerCase()} sleeve doing?`, steps: ["Reading the sleeve", "Comparing it with your plan"],
      text: `${inr(s.amt)} of ${inr(s.goal)}. ${drift ? `It holds <b>${s.actual}% in shares</b>, against the ${s.target}% you planned.` : "<b>Right on your plan.</b>"}`, 
      decide: drift ? { prompt: "Drift isn’t always a problem.", options: [
        { label: "Leave it", sub: "and write down why", kind: "journal", title: `Left ${s.name.toLowerCase()} at ${s.actual}% shares` },
        { label: "Compare a different mix", sub: "optimisation, experimental", kind: "ask", q: "Can I compare a different mix?" },
        { label: "Look again next quarter", sub: "set a review date", kind: "review", months: 3 }] } : null }, { auto: true });
  }
  $$(".sl-row", host).forEach(r => r.onclick = () => narrate(+r.dataset.i));
  return { narrate };
}

/* ---------------- Grow: the portfolio you can poke ---------------- */
const HOLD = [ // name, weight %, sensitivity to NIFTY Bank, NIFTY IT, NIFTY 50
  ["HDFC Bank", 12, 1, 0, .95], ["ICICI Bank", 9, 1, 0, 1.05], ["NIFTY 50 fund", 14, .35, .13, 1], ["Kotak Bank", 4, 1, 0, .9], ["Bajaj Finance", 3, .4, 0, 1.2], ["Infosys", 8, 0, 1, .85], ["TCS", 5, 0, 1, .8], ["Reliance", 7, 0, 0, 1.05], ["ITC", 6, 0, 0, .7], ["Other holdings", 32, .1, .05, .9]];
const IDX = { bank: ["NIFTY Bank", 2], it: ["NIFTY IT", 3], nifty: ["NIFTY 50", 4] };
function impactChart(move, idx, W = 340) {
  const k = IDX[idx][1], rows = HOLD.map(h => [h[0], h[1], h[k], h[1] / 100 * h[k] * move / 100 * 1e6]).filter(r => r[3]).sort((a, b) => Math.abs(b[3]) - Math.abs(a[3])).slice(0, 6);
  const max = 40000, x0 = 106, x1 = W - 62, rh = 26, top = 4, H = top + Math.max(rows.length, 1) * rh + 24, sx = v => x0 + Math.min(1, Math.abs(v) / max) * (x1 - x0);
  let b = [0, 20000, 40000].map(v => `<line x1="${f1(sx(v))}" x2="${f1(sx(v))}" y1="${top}" y2="${H - 20}" stroke="var(--line-soft)"/>` + T(sx(v), H - 6, v ? "₹" + v / 1000 + "k" : "₹0", { a: "middle" })).join("");
  rows.forEach(([n, w, s, v], i) => { const y = top + i * rh, c = v < 0 ? "var(--down)" : "var(--up)"; b += `<g${tip(`${n}: ${w}% of the portfolio, moves ${s.toFixed(2)}× with ${IDX[idx][0]}, so ${inr(v)}`)}><rect x="0" y="${y}" width="${W}" height="${rh}" fill="transparent"/>${T(0, y + 16.5, n, { c: "var(--text-2)", s: 12, body: true })}<rect x="${x0}" y="${y + 7}" width="${f1(Math.max(1.5, sx(v) - x0))}" height="12" rx="2" fill="${c}"/>${T(W, y + 16.5, inr(v), { a: "end", c: "var(--text-2)" })}</g>`; });
  if (!rows.length) b += T(W / 2, 30, "Nothing moves", { a: "middle" });
  return svg(W, H, b, `Rupee impact of a ${pct(move, 0)} move in ${IDX[idx][0]}`);
}
const impactTotal = (move, idx) => HOLD.reduce((s, h) => s + h[1] / 100 * h[IDX[idx][1]] * move / 100, 0) * 100;
function grow(host) {
  const st = { tab: "holdings", move: -10, idx: "bank", monthly: 10000, goal: 60 };
  host.innerHTML = `<div class="dash panel">
    <div class="dash-kpis"><div><span>Value</span><b>₹10,00,000</b></div><div><span>One year</span><b class="up">+9.4%</b></div><div><span>NIFTY 50</span><b>+9.6%</b></div><div><span>Holdings</span><b>14 in 2 accounts</b></div></div>
    <div class="wb-tabs" role="tablist">${[["holdings", "Holdings"], ["exposure", "Exposure"], ["whatif", "What if"], ["leaders", "Leaders"]].map(([k, l]) => `<button type="button" role="tab" data-tab="${k}">${l}</button>`).join("")}</div>
    <div class="dash-body"><div class="dash-vis vz"></div><div class="dash-side"></div></div>
  </div>`;
  const vis = $(".dash-vis", host), side = $(".dash-side", host);
  function render() {
    $$(".wb-tabs [data-tab]", host).forEach(b => b.setAttribute("aria-selected", b.dataset.tab === st.tab));
    if (st.tab === "holdings") { vis.innerHTML = Viz.treemap(); side.innerHTML = `<p class="dash-big">14</p><p class="muted">holdings, one view. The same stock in two accounts is one line.</p><p class="dash-note">Size is weight. Colour is a year’s return.</p>`; }
    if (st.tab === "exposure") { vis.innerHTML = Viz.lookThrough(); side.innerHTML = `<p class="dash-big">21% <span>→</span> 38%</p><p class="muted">in banks, once index funds are opened up.</p>`; }
    if (st.tab === "whatif") {
      const t = impactTotal(st.move, st.idx);
      vis.innerHTML = impactChart(st.move, st.idx);
      side.innerHTML = `<div class="wb-chips">${Object.entries(IDX).map(([k, [n]]) => `<button type="button" class="chip" data-idx="${k}" aria-pressed="${k === st.idx}">${n}</button>`).join("")}</div><label class="wb-sl"><span>Move<b>${pct(st.move, 0)}</b></span><input type="range" min="-25" max="15" step="1" value="${st.move}"></label><p class="dash-big ${t < 0 ? "down" : "up"}">${pct(t)}</p><p class="muted">on the whole portfolio, <span style="white-space:nowrap">${inr(t * 1e4)}</span>.</p>`;
      $("input", side).oninput = e => { st.move = +e.target.value; render(); narrate(); };
      $$("[data-idx]", side).forEach(b => b.onclick = () => { st.idx = b.dataset.idx; render(); narrateNow(); });
    }
    if (st.tab === "goal") {
      vis.innerHTML = Viz.fan(st.monthly, st.goal * 1e5); const reach = Viz.reachOf(st.monthly, st.goal * 1e5);
      side.innerHTML = `<label class="wb-sl"><span>Each month<b>${inr(st.monthly)}</b></span><input type="range" data-g="monthly" min="0" max="50000" step="2500" value="${st.monthly}"></label><label class="wb-sl"><span>Goal in 15 years<b>₹${st.goal}L</b></span><input type="range" data-g="goal" min="30" max="150" step="10" value="${st.goal}"></label><p class="dash-big">${reach}%</p><p class="muted">of simulated journeys reach it. A range, not a promise.</p>`;
      $$("input", side).forEach(i => i.oninput = () => { st[i.dataset.g] = +i.value; render(); narrate(); });
    }
    if (st.tab === "leaders") { vis.innerHTML = Viz.leaders(); side.innerHTML = `<p class="dash-big">5 of 10</p><p class="muted">holdings beat NIFTY 50 over the year.</p>`; }
  }
  const narrateNow = () => {
    const t = impactTotal(st.move, st.idx), reach = Viz.reachOf(st.monthly, st.goal * 1e5);
    const S = {
      holdings: { q: "What do I actually own?", steps: ["Combining two accounts"], text: "Fourteen holdings, one view. <b>Big red boxes</b> are worth a look." },
      exposure: { q: "Where does my money really sit?", steps: ["Looking through 3 index funds"], text: "Statements say 21% in banks. Looked through, it’s <b>38%</b>.", decide: "exposure" },
      whatif: { q: `What if ${IDX[st.idx][0]} moves ${pct(st.move, 0)}?`, steps: ["Applying the move", "Tracing it to each holding"], text: `About <b>${pct(t)}</b> on the whole portfolio, or ${inr(t * 1e4)}.`, decide: "whatif" },
      goal: { q: `₹${st.goal}L in 15 years at ${inr(st.monthly)} a month?`, steps: ["Simulating 240 journeys"], text: `<b>${reach}%</b> of journeys get there. A range, not a promise.`, decide: "goal" },
      leaders: { q: "Which holdings are leading?", steps: ["Comparing a year against NIFTY 50"], text: "Five of ten beat the index. <b>Infosys and TCS</b> trail it most." },
    };
    Panel.run({ meta: "Grow: " + st.tab.replace("whatif", "what if"), key: "grow-" + st.tab, ...S[st.tab] }, { auto: true });
  };
  const narrate = debounce(narrateNow, 600);
  $$(".wb-tabs [data-tab]", host).forEach(b => b.onclick = () => { st.tab = b.dataset.tab; render(); narrateNow(); });
  render();
  const go = tab => { st.tab = tab; render(); narrateNow(); };
  Saarthi.on("goto", t => { const tab = { whatif: "whatif", xray: "exposure", journey: "goal", import: "holdings" }[t]; if (tab) setTimeout(() => go(tab), 650); });
  return { narrate: narrateNow, go };
}
/* ---------------- Plan the route: a small goal box ---------------- */
function goal(host) {
  const st = { monthly: 10000, goal: 60 };
  function render() {
    const reach = Viz.reachOf(st.monthly, st.goal * 1e5);
    host.querySelector(".gb-vis").innerHTML = Viz.fan(st.monthly, st.goal * 1e5);
    host.querySelector(".gb-out").innerHTML = `<b>${reach}%</b> of 240 simulated journeys reach ₹${st.goal}L in 15 years.`;
    $$("[data-o]", host).forEach(o => o.textContent = o.dataset.o === "monthly" ? inr(st.monthly) : "₹" + st.goal + "L");
  }
  const narrate = debounce(() => Panel.run({ meta: "Grow: plan the route", key: "goal", q: `₹${st.goal}L at ${inr(st.monthly)} a month?`, steps: ["Simulating 240 journeys"], text: `<b>${Viz.reachOf(st.monthly, st.goal * 1e5)}%</b> get there. A range, not a promise.`, fine: "Simulated paths. Not a prediction.", decide: "goal" }, { auto: true }), 600);
  $$("input", host).forEach(i => i.oninput = () => { st[i.dataset.g] = +i.value; render(); narrate(); });
  render();
  return { narrate };
}

/* ---------------- Manage strategies ---------------- */
function strategies(host, lab) {
  const STAGE = ["Testing", "On paper", "Dropped"];
  const rows = [
    { tpl: "ma", stock: "choppy", p: { fast: 20, slow: 100 }, stage: 0 },
    { tpl: "rsi", stock: "trend", p: { buy: 30, sell: 70 }, stage: 1 },
    { tpl: "brk", stock: "choppy", p: { look: 252, exit: 20 }, stage: 2 },
  ];
  const label = r => `${TPL[r.tpl].name}, ${Object.values(r.p).join(" / ")}`;
  function result(r) { const c = prices(r.stock), b = backtest(c, TPL[r.tpl].pos(c, r.p), 252, HIST - 1); return b; }
  function render() {
    $(".st-rows", host).innerHTML = rows.map((r, i) => { const b = result(r); return `<div class="st-row">
      <div class="st-name"><b>${esc(label(r))}</b><span>${STOCKS[r.stock].name}</span></div>
      <div class="st-res"><b class="${b.cagr >= b.bcagr ? "up" : "down"}">${pct(b.cagr)}</b><span>vs ${pct(b.bcagr)} holding</span></div>
      <button type="button" class="st-stage s${r.stage}" data-i="${i}" title="Change stage">${STAGE[r.stage]}</button>
      <button type="button" class="st-open" data-o="${i}">Open</button></div>`; }).join("");
    $$(".st-stage", host).forEach(b => b.onclick = () => { const r = rows[+b.dataset.i]; r.stage = (r.stage + 1) % 3; render(); });
    $$(".st-open", host).forEach(b => b.onclick = () => lab.load(rows[+b.dataset.o]));
  }
  $(".st-save", host).onclick = () => {
    const cfg = lab.config();
    if (rows.some(r => r.tpl === cfg.tpl && r.stock === cfg.stock && JSON.stringify(r.p) === JSON.stringify(cfg.p))) { Panel.run({ meta: "Build: strategies", key: "dupe" + Date.now(), q: "Already saved", steps: [], text: "That exact rule is already in your strategies. Change a setting above and save again." }, { auto: true }); return; }
    rows.unshift({ ...cfg, stage: 0 }); render();
    const b = result(cfg);
    Panel.run({ meta: "Build: strategies", key: "saved", q: "Saved. What now?", steps: ["Adding it to your strategies"], text: `<b>${esc(label(cfg))}</b> is saved as Testing: ${pct(b.cagr)} a year against ${pct(b.bcagr)} holding.`, decide: "build" }, { auto: true });
  };
  render();
}
return { build, grow, goal, strategies, sleeves, prices, backtest, equityChart, TPL, STOCKS };
})();
