/* Charts for Saarthi's answers. Each has axes and carries data-tip text on its marks so people
   can point at a mark and read it. Data is a sample portfolio or generated, never market data. */
window.Viz = (() => {
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function gauss(r) { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const W = 340, f1 = n => +(+n).toFixed(1);
const inr = v => (v < 0 ? "−" : "") + "₹" + Math.round(Math.abs(v)).toLocaleString("en-IN");
const lakh = v => "₹" + (Math.abs(v) >= 1e7 ? (v / 1e7).toFixed(1) + "Cr" : Math.round(v / 1e5) + "L");
const pct = (v, d = 1) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(d) + "%";
const T = (x, y, t, o = {}) => `<text x="${f1(x)}" y="${f1(y)}" font-size="${o.s || 10.5}" fill="${o.c || "var(--muted)"}"${o.a ? ` text-anchor="${o.a}"` : ""}${o.body ? "" : ' font-family="var(--f-mono)"'}${o.w ? ` font-weight="${o.w}"` : ""}>${esc(t)}</text>`;
const tip = t => ` data-tip="${esc(t)}"`;
const frame = (h, body, label) => `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
const hline = (x0, x1, y, c = "var(--line-soft)", dash) => `<line x1="${f1(x0)}" x2="${f1(x1)}" y1="${f1(y)}" y2="${f1(y)}" stroke="${c}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
const vline = (x, y0, y1, c = "var(--line-soft)") => `<line x1="${f1(x)}" x2="${f1(x)}" y1="${f1(y0)}" y2="${f1(y1)}" stroke="${c}"/>`;
const path = pts => pts.map(([x, y], i) => (i ? "L" : "M") + f1(x) + " " + f1(y)).join("");
const nice = (lo, hi, n = 4) => { const step = Math.pow(10, Math.floor(Math.log10((hi - lo) / n))), m = [1, 2, 2.5, 5, 10].find(k => (hi - lo) / (k * step) <= n) * step; const out = []; for (let v = Math.ceil(lo / m) * m; v <= hi + 1e-9; v += m) out.push(+v.toFixed(6)); return out; };

/* the illustrative portfolio, ₹10 lakh */
const HOLD = [["HDFC Bank", 12, 1], ["ICICI Bank", 9, 1], ["NIFTY 50 fund", 14, .35], ["Kotak Bank", 4, 1], ["Bajaj Finance", 3, .4], ["Infosys", 8, 0]];

/* scenario: rupee impact by holding */
function impact(move = -10) {
  const V = 1e6, rows = HOLD.map(([n, w, s]) => [n, w, s, w / 100 * s * move / 100 * V]);
  const max = 25000, x0 = 104, x1 = W - 60, rh = 26, top = 4, h = top + rows.length * rh + 24, sx = v => x0 + Math.min(1, Math.abs(v) / max) * (x1 - x0);
  let b = [0, 10000, 20000].map(v => vline(sx(v), top, h - 20) + T(sx(v), h - 6, v ? "₹" + v / 1000 + "k" : "₹0", { a: "middle" })).join("");
  rows.forEach(([n, w, s, v], i) => {
    const y = top + i * rh, c = v < 0 ? "var(--down)" : v > 0 ? "var(--up)" : "var(--line-strong)";
    b += `<g${tip(`${n}: ${w}% of the portfolio, moves ${s.toFixed(2)}× with NIFTY Bank, so ${inr(v)} on a ${pct(move, 0)} move`)}><rect x="0" y="${y}" width="${W}" height="${rh}" fill="transparent"/>${T(0, y + 16.5, n, { c: "var(--text-2)", s: 12, body: true })}<rect x="${x0}" y="${y + 7}" width="${f1(Math.max(1.5, sx(v) - x0))}" height="12" rx="2" fill="${c}"/>${T(W, y + 16.5, v ? inr(v) : "₹0", { a: "end", c: "var(--text-2)" })}</g>`;
  });
  return frame(h, b, `Rupee impact by holding for a ${pct(move, 0)} move in NIFTY Bank`);
}

/* exposure: at first glance against looked through */
function lookThrough() {
  const S = [["Banks and financials", 21, 38], ["IT", 16, 19], ["Energy", 9, 11], ["Consumer", 11, 13], ["Index funds", 23, 0], ["Other", 20, 19]];
  const x0 = 120, x1 = W - 34, rh = 26, top = 18, h = top + S.length * rh + 22, sx = v => x0 + v / 40 * (x1 - x0);
  let b = [0, 20, 40].map(v => vline(sx(v), top - 4, h - 20) + T(sx(v), h - 6, v + "%", { a: "middle" })).join("");
  b += `<rect x="${x0}" y="2" width="9" height="9" rx="2" fill="var(--text-2)" fill-opacity=".4"/>` + T(x0 + 13, 10, "At first glance") + `<rect x="${x0 + 112}" y="2" width="9" height="9" rx="2" fill="var(--accent)"/>` + T(x0 + 125, 10, "Looked through");
  S.forEach(([n, a, l], i) => {
    const y = top + i * rh;
    b += `<g${tip(`${n}: ${a}% at first glance, ${l}% once index funds are looked through`)}><rect x="0" y="${y}" width="${W}" height="${rh}" fill="transparent"/>${T(0, y + 16, n, { c: "var(--text-2)", s: 12, body: true })}<rect x="${x0}" y="${y + 5}" width="${f1(Math.max(1, sx(a) - x0))}" height="7" rx="1.5" fill="var(--text-2)" fill-opacity=".4"/><rect x="${x0}" y="${y + 14}" width="${f1(Math.max(1, sx(l) - x0))}" height="7" rx="1.5" fill="var(--accent)"/>${T(W, y + 21, l + "%", { a: "end", c: "var(--text-2)" })}</g>`;
  });
  return frame(h, b, "Sector exposure at first glance and looked through");
}

/* goal journeys: band of simulated outcomes */
function fan(monthly = 10000, goal = 60e5) {
  const r = rng(7), N = 15, P = 240, start = 10e5, all = [];
  for (let p = 0; p < P; p++) { let v = start; const a = [v]; for (let y = 1; y <= N; y++) { v = v * (1 + .105 + gauss(r) * .17) + monthly * 12; v = Math.max(v, 1e5); a.push(v); } all.push(a); }
  const q = (y, k) => { const s = all.map(a => a[y]).sort((m, n) => m - n); return s[Math.floor(k * (s.length - 1))]; };
  const p10 = [], p50 = [], p90 = []; for (let y = 0; y <= N; y++) { p10.push(q(y, .1)); p50.push(q(y, .5)); p90.push(q(y, .9)); }
  const reach = Math.round(all.filter(a => a[N] >= goal).length / P * 100);
  const x0 = 38, x1 = W - 8, y0 = 22, y1 = 172, top = Math.ceil(Math.max(p90[N], goal) * 1.08 / 20e5) * 20e5;
  const sx = y => x0 + y / N * (x1 - x0), sy = v => y1 - v / top * (y1 - y0);
  let b = nice(0, top, 4).map(v => hline(x0, x1, sy(v)) + T(x0 - 4, sy(v) + 3.5, lakh(v), { a: "end" })).join("");
  b += [0, 5, 10, 15].map(y => T(sx(y), y1 + 15, y ? y + "y" : "Today", { a: y ? "middle" : "start" })).join("");
  b += `<path d="${path(p90.map((v, y) => [sx(y), sy(v)]))}L${path(p10.map((v, y) => [sx(y), sy(v)]).reverse()).slice(1)}Z" fill="var(--accent)" fill-opacity=".16"/>`;
  b += all.slice(0, 5).map(a => `<path d="${path(a.map((v, y) => [sx(y), sy(Math.min(v, top))]))}" stroke="var(--accent)" stroke-opacity=".28" fill="none" stroke-width="1"/>`).join("");
  b += `<path d="${path(p50.map((v, y) => [sx(y), sy(v)]))}" stroke="var(--accent)" stroke-width="2" fill="none"/>`;
  b += hline(x0, x1, sy(goal), "var(--sun)", "4 4") + T(x1, sy(goal) - 5, "Goal " + lakh(goal), { a: "end", c: "var(--sun)" });
  b += T(x0, 11, `Reached the goal in ${reach}% of ${P} simulated journeys`, { c: "var(--text-2)" });
  b += [5, 10, 15].map(y => `<rect x="${f1(sx(y) - 18)}" y="${y0}" width="36" height="${y1 - y0}" fill="transparent"${tip(`Year ${y}: middle ${lakh(p50[y])}, eight in ten between ${lakh(p10[y])} and ${lakh(p90[y])}`)}/>`).join("");
  return frame(190, b, "Simulated journeys toward a goal");
}

/* backtest: rule after costs against buy and hold, with the rule's drawdown */
function backtest() {
  const r = rng(3), N = 96; let a = 100, h = 100, peak = 100; const A = [a], B = [h], D = [0];
  for (let i = 1; i <= N; i++) { const m = (r() - .46) * .07; h *= 1 + m; a *= 1 + (m > -.015 ? m * .82 : m * .3) - .0006; peak = Math.max(peak, a); A.push(a); B.push(h); D.push((a / peak - 1) * 100); }
  const lo = Math.min(...A, ...B), hi = Math.max(...A, ...B), x0 = 34, x1 = W - 8, y0 = 22, y1 = 128, d0 = 142, d1 = 188, dmin = Math.min(...D);
  const sx = i => x0 + i / N * (x1 - x0), sy = v => y1 - (v - lo) / (hi - lo) * (y1 - y0), sd = v => d0 + v / dmin * (d1 - d0);
  let b = nice(lo, hi, 3).map(v => hline(x0, x1, sy(v)) + T(x0 - 4, sy(v) + 3.5, Math.round(v), { a: "end" })).join("");
  b += `<rect x="${x0}" y="2" width="9" height="9" rx="2" fill="var(--accent)"/>` + T(x0 + 13, 10, "Rule, after costs") + `<rect x="${x0 + 132}" y="2" width="9" height="9" rx="2" fill="var(--line-strong)"/>` + T(x0 + 145, 10, "Buy and hold");
  b += `<path d="${path(B.map((v, i) => [sx(i), sy(v)]))}" stroke="var(--line-strong)" stroke-width="1.5" fill="none"/><path d="${path(A.map((v, i) => [sx(i), sy(v)]))}" stroke="var(--accent)" stroke-width="2" fill="none"/>`;
  b += hline(x0, x1, d0, "var(--line)") + T(x0 - 4, d0 + 3.5, "0%", { a: "end" }) + T(x0 - 4, d1, Math.round(dmin) + "%", { a: "end" }) + T(x1, d1 + 1, "Rule drawdown", { a: "end" });
  b += `<path d="${path(D.map((v, i) => [sx(i), sd(v)]))}L${f1(x1)} ${d0}L${x0} ${d0}Z" fill="var(--down)" fill-opacity=".22" stroke="var(--down)" stroke-width="1"/>`;
  for (let i = 0; i < N; i += 12) b += `<rect x="${f1(sx(i))}" y="${y0}" width="${f1(sx(12) - x0)}" height="${d1 - y0}" fill="transparent"${tip(`Month ${i + 12}: rule ${Math.round(A[i + 12])}, buy and hold ${Math.round(B[i + 12])}, rule ${Math.round(D[i + 12])}% from its high`)}/>`;
  return frame(196, b, "Backtest: rule after costs against buy and hold, with drawdown");
}

/* holdings map: size is weight, colour is one-year return */
function treemap() {
  const H = [["NIFTY 50 fund", 14, 11.2], ["HDFC Bank", 12, 8.4], ["ICICI Bank", 9, 14.1], ["Infosys", 8, -4.2], ["Reliance", 7, 2.5], ["ITC", 6, 6.8], ["TCS", 5, -7.9], ["L&T", 5, 12], ["Kotak Bank", 4, -1.3], ["Sun Pharma", 4, 21], ["Bajaj Finance", 3, 18.5], ["Others", 23, 5]];
  const out = [];
  (function split(items, x, y, w, h) {
    if (items.length === 1) { out.push([items[0], x, y, w, h]); return; }
    const tot = items.reduce((s, i) => s + i[1], 0); let acc = 0, k = 0;
    while (k < items.length - 1 && acc + items[k][1] <= tot / 2) acc += items[k++][1];
    if (k === 0) acc = items[k++][1];
    const a = items.slice(0, k), c = items.slice(k), fr = acc / tot;
    if (w >= h) { split(a, x, y, w * fr, h); split(c, x + w * fr, y, w * (1 - fr), h); } else { split(a, x, y, w, h * fr); split(c, x, y + h * fr, w, h * (1 - fr)); }
  })([...H].sort((m, n) => n[1] - m[1]), 0, 0, W, 186);
  const b = out.map(([[n, wt, ret], x, y, w, h]) => {
    const c = ret >= 0 ? "var(--up)" : "var(--down)", o = (.18 + Math.min(.55, Math.abs(ret) / 30)).toFixed(2);
    const lab = w > 54 && h > 30 ? T(x + 6, y + 15, n, { c: "var(--text)", s: 11, body: true }) + T(x + 6, y + 28, pct(ret), { c: "var(--text-2)", s: 10 }) : "";
    return `<g${tip(`${n}: ${wt}% of the portfolio, ${pct(ret)} over a year`)}><rect x="${f1(x + 1)}" y="${f1(y + 1)}" width="${f1(w - 2)}" height="${f1(h - 2)}" rx="3" fill="${c}" fill-opacity="${o}"/>${lab}</g>`;
  }).join("");
  return frame(186, b, "Holdings map: size is weight, colour is one-year return");
}

/* leaders and laggers: one-year return of each holding against NIFTY 50 */
function leaders() {
  const R = [["Sun Pharma", 21], ["Bajaj Finance", 18.5], ["ICICI Bank", 14.1], ["L&T", 12], ["HDFC Bank", 8.4], ["ITC", 6.8], ["Reliance", 2.5], ["Kotak Bank", -1.3], ["Infosys", -4.2], ["TCS", -7.9]], idx = 9.6;
  const x0 = 96, x1 = W - 44, rh = 17, top = 18, h = top + R.length * rh + 18, sx = v => x0 + (v + 10) / 32 * (x1 - x0);
  let b = [-10, 0, 10, 20].map(v => vline(sx(v), top - 4, h - 16, v ? "var(--line-soft)" : "var(--line)") + T(sx(v), h - 3, pct(v, 0), { a: "middle" })).join("");
  b += vline(sx(idx), top - 6, h - 16, "var(--sun)") + T(sx(idx), 10, "NIFTY 50 " + pct(idx), { a: "middle", c: "var(--sun)" });
  R.forEach(([n, r], i) => {
    const y = top + i * rh, ahead = r >= idx;
    b += `<g${tip(`${n}: ${pct(r)} over a year, ${ahead ? "ahead of" : "behind"} NIFTY 50 by ${Math.abs(r - idx).toFixed(1)} points`)}><rect x="0" y="${y}" width="${W}" height="${rh}" fill="transparent"/>${T(0, y + 12, n, { c: "var(--text-2)", s: 11, body: true })}<rect x="${f1(Math.min(sx(0), sx(r)))}" y="${y + 4}" width="${f1(Math.abs(sx(r) - sx(0)))}" height="9" rx="1.5" fill="${ahead ? "var(--up)" : "var(--down)"}" fill-opacity="${ahead ? .85 : .7}"/>${T(W, y + 12, pct(r), { a: "end", c: "var(--text-2)" })}</g>`;
  });
  return frame(h, b, "One-year return of each holding against NIFTY 50");
}

/* price with two moving averages, for rule templates */
function candles() {
  const r = rng(5), all = []; let c = 1400;
  for (let i = 0; i < 130; i++) { const o = c; c = o * (1 + (r() - .485) * .035 + (i > 80 ? .004 : -.002)); all.push([o, Math.max(o, c) * (1 + r() * .01), Math.min(o, c) * (1 - r() * .01), c]); }
  const ma = (k, i) => all.slice(i - k + 1, i + 1).reduce((s, b) => s + b[3], 0) / k, S = 70, L = all.slice(S);
  const f = L.map((_, i) => ma(20, i + S)), s = L.map((_, i) => ma(50, i + S));
  let cross = f.findIndex((v, i) => i && f[i - 1] <= s[i - 1] && v > s[i]);
  const lo = Math.min(...L.map(b => b[2])), hi = Math.max(...L.map(b => b[1])), x0 = 40, x1 = W - 6, y0 = 22, y1 = 168, bw = (x1 - x0) / L.length;
  const sx = i => x0 + (i + .5) * bw, sy = v => y1 - (v - lo) / (hi - lo) * (y1 - y0);
  let b = nice(lo, hi, 3).map(v => hline(x0, x1, sy(v)) + T(x0 - 4, sy(v) + 3.5, "₹" + Math.round(v).toLocaleString("en-IN"), { a: "end" })).join("");
  b += `<rect x="${x0}" y="2" width="9" height="9" rx="2" fill="var(--accent)"/>` + T(x0 + 13, 10, "20-day average") + `<rect x="${x0 + 120}" y="2" width="9" height="9" rx="2" fill="var(--sun)"/>` + T(x0 + 133, 10, "50-day average");
  b += L.map(([o, h, l, c2], i) => { const up = c2 >= o, col = up ? "var(--up)" : "var(--down)"; return `<line x1="${f1(sx(i))}" x2="${f1(sx(i))}" y1="${f1(sy(h))}" y2="${f1(sy(l))}" stroke="${col}" stroke-width=".8"/><rect x="${f1(sx(i) - bw * .32)}" y="${f1(sy(Math.max(o, c2)))}" width="${f1(bw * .64)}" height="${f1(Math.max(.8, Math.abs(sy(o) - sy(c2))))}" fill="${col}"/>`; }).join("");
  b += `<path d="${path(s.map((v, i) => [sx(i), sy(v)]))}" stroke="var(--sun)" stroke-width="1.6" fill="none"/><path d="${path(f.map((v, i) => [sx(i), sy(v)]))}" stroke="var(--accent)" stroke-width="1.6" fill="none"/>`;
  if (cross > 0) b += `<g${tip("Here the 20-day average crossed above the 50-day. A rule can act on this; a backtest shows how that would have gone.")}><circle cx="${f1(sx(cross))}" cy="${f1(sy(f[cross]))}" r="5" fill="none" stroke="var(--text)" stroke-width="1.5"/><circle cx="${f1(sx(cross))}" cy="${f1(sy(f[cross]))}" r="13" fill="transparent"/>${T(sx(cross), sy(f[cross]) + 20, "Crossover", { a: "middle", c: "var(--text)" })}</g>`;
  return frame(178, b, "Price with 20-day and 50-day averages");
}

/* walk-forward: tune on one window, test on the next */
function walkforward() {
  const R = [["2016–2019", "2020", 6.2], ["2017–2020", "2021", 11.4], ["2018–2021", "2022", -3.1], ["2019–2022", "2023", 8.8], ["2020–2023", "2024", 1.9]];
  const x0 = 6, x1 = W - 70, rh = 28, top = 18, h = top + R.length * rh + 16, unit = (x1 - x0) / 9;
  let b = `<rect x="${x0}" y="2" width="9" height="9" rx="2" fill="var(--blk)"/>` + T(x0 + 13, 10, "Tuned on") + `<rect x="${x0 + 84}" y="2" width="9" height="9" rx="2" fill="var(--accent)"/>` + T(x0 + 97, 10, "Tested on, unseen") + T(W, 10, "Test result", { a: "end" });
  R.forEach(([tr, te, v], i) => {
    const y = top + i * rh, xs = x0 + i * unit;
    b += `<g${tip(`Tuned on ${tr}, then tested on ${te}, which it had not seen: ${pct(v)}`)}><rect x="0" y="${y}" width="${W}" height="${rh}" fill="transparent"/><rect x="${f1(xs)}" y="${y + 6}" width="${f1(unit * 4 - 2)}" height="14" rx="2" fill="var(--blk)"/><rect x="${f1(xs + unit * 4)}" y="${y + 6}" width="${f1(unit - 2)}" height="14" rx="2" fill="var(--accent)"/>${T(xs + unit * 4 + unit + 4, y + 17, te)}${T(W, y + 17, pct(v), { a: "end", c: v < 0 ? "var(--down)" : "var(--up)" })}</g>`;
  });
  b += T(x0, h - 2, "2016", {}) + T(x1, h - 2, "2025", { a: "end" });
  return frame(h + 2, b, "Walk-forward windows and test results");
}

/* tax before you sell: lot by lot */
function taxlots() {
  const L = [["Mar 2023", 20, 31, 18400], ["Nov 2024", 10, 11, 6200], ["Jun 2025", 15, 4, -2100], ["Aug 2022", 25, 38, 27900]];
  const x0 = 112, x1 = W - 92, rh = 30, top = 4, h = top + L.length * rh + 30, mid = x0 + (x1 - x0) * .22, sx = v => mid + v / 30000 * (x1 - mid);
  let b = vline(mid, top, h - 30, "var(--line)");
  L.forEach(([d, q, m, g], i) => {
    const y = top + i * rh, lt = m >= 12, c = g < 0 ? "var(--down)" : "var(--up)";
    b += `<g${tip(`${q} shares bought ${d}, held ${m} months: ${lt ? "long-term" : "short-term"} ${g < 0 ? "loss" : "gain"} of ${inr(g)}`)}><rect x="0" y="${y}" width="${W}" height="${rh}" fill="transparent"/>${T(0, y + 13, d, { c: "var(--text-2)", s: 11.5, body: true })}${T(0, y + 25, q + " shares", { s: 9.5 })}<rect x="${f1(Math.min(mid, sx(g)))}" y="${y + 9}" width="${f1(Math.abs(sx(g) - mid))}" height="12" rx="2" fill="${c}"/><rect x="${W - 86}" y="${y + 6}" width="${lt ? 70 : 74}" height="17" rx="4" fill="none" stroke="var(--line)"/>${T(W - 80, y + 18, lt ? "Long-term" : "Short-term", { s: 9.5, c: lt ? "var(--text-2)" : "var(--amber)" })}</g>`;
  });
  const st = L.filter(l => l[2] < 12).reduce((s, l) => s + l[3], 0), lt = L.filter(l => l[2] >= 12).reduce((s, l) => s + l[3], 0);
  b += hline(0, W, h - 24, "var(--line)") + T(0, h - 8, `If sold today: ${inr(lt)} long-term, ${inr(st)} short-term`, { c: "var(--text-2)" });
  return frame(h, b, "Gains lot by lot, short- and long-term");
}

/* paper account: a rule followed on new prices, with virtual orders */
function paper() {
  const r = rng(9), N = 60; let v = 100; const E = [v], O = [];
  for (let i = 1; i <= N; i++) { v *= 1 + (r() - .47) * .03; E.push(v); if (i % 13 === 5) O.push([i, i % 2 ? "Virtual buy" : "Virtual sell"]); }
  const lo = Math.min(...E), hi = Math.max(...E), x0 = 30, x1 = W - 8, y0 = 22, y1 = 150, sx = i => x0 + i / N * (x1 - x0), sy = x => y1 - (x - lo) / (hi - lo) * (y1 - y0);
  let b = nice(lo, hi, 3).map(x => hline(x0, x1, sy(x)) + T(x0 - 4, sy(x) + 3.5, Math.round(x), { a: "end" })).join("");
  b += T(x0, 10, "Virtual capital, following your rule on new prices") + `<path d="${path(E.map((x, i) => [sx(i), sy(x)]))}" stroke="var(--accent)" stroke-width="2" fill="none"/>`;
  b += O.map(([i, t]) => `<g${tip(`${t} on day ${i}. It stays inside Saarth; your broker never sees it.`)}><circle cx="${f1(sx(i))}" cy="${f1(sy(E[i]))}" r="4" fill="var(--bg-2)" stroke="var(--text)" stroke-width="1.5"/><circle cx="${f1(sx(i))}" cy="${f1(sy(E[i]))}" r="12" fill="transparent"/></g>`).join("");
  b += T(x0, y1 + 15, "Day 1") + T(x1, y1 + 15, "Day 60", { a: "end" });
  return frame(168, b, "Paper account following a rule");
}

/* comparing mixes under chosen assumptions (portfolio optimisation, experimental) */
function mixes() {
  const M = [["Your mix today", 17.2, 11.4, "var(--text)"], ["More balanced", 12.8, 9.6, "var(--accent)"], ["More equity", 19.5, 12.3, "var(--sun)"]];
  const x0 = 40, x1 = W - 10, y0 = 14, y1 = 150, sx = v => x0 + (v - 8) / 14 * (x1 - x0), sy = v => y1 - (v - 6) / 8 * (y1 - y0);
  let b = [8, 12, 16, 20].map(v => vline(sx(v), y0, y1) + T(sx(v), y1 + 14, v + "%", { a: "middle" })).join("") + [6, 8, 10, 12, 14].map(v => hline(x0, x1, sy(v)) + T(x0 - 4, sy(v) + 3.5, v + "%", { a: "end" })).join("");
  b += T((x0 + x1) / 2, y1 + 28, "Ups and downs (volatility)", { a: "middle" }) + `<text x="10" y="${(y0 + y1) / 2}" font-size="10.5" fill="var(--muted)" font-family="var(--f-mono)" text-anchor="middle" transform="rotate(-90 10 ${(y0 + y1) / 2})">Assumed return</text>`;
  b += `<path d="M${f1(sx(9))} ${f1(sy(7.6))}Q${f1(sx(13))} ${f1(sy(11.6))} ${f1(sx(21))} ${f1(sy(12.9))}" stroke="var(--line-strong)" stroke-dasharray="3 4" fill="none"/>`;
  b += M.map(([n, vol, ret, c]) => `<g${tip(`${n}: about ${vol}% ups and downs a year, ${ret}% assumed return. Assumptions you choose, not a forecast.`)}><circle cx="${f1(sx(vol))}" cy="${f1(sy(ret))}" r="6" fill="${c}"/><circle cx="${f1(sx(vol))}" cy="${f1(sy(ret))}" r="14" fill="transparent"/>${T(sx(vol) + (vol > 18 ? -10 : 10), sy(ret) - 9, n, { c: "var(--text)", s: 11, body: true, a: vol > 18 ? "end" : "start" })}</g>`).join("");
  return frame(186, b, "Comparing mixes under chosen assumptions");
}

function journal(entry) {
  const e = entry || { title: "Bought 20 Infosys", why: "Saarthi asks: what made you buy?", change: "…", review: "12 Sep" };
  return `<div class="vz-entry"><div class="vz-row"><span class="tag">${esc(e.tag || "Draft from an import")}</span><span class="note">${esc(e.date || "12 Mar")}</span></div><p class="vz-h">${esc(e.title)}</p><dl><dt>Why</dt><dd class="${entry ? "" : "vz-blank"}">${esc(e.why)}</dd><dt>What would change my mind</dt><dd class="vz-blank">${esc(e.change)}</dd><dt>Review on</dt><dd>${esc(e.review)}</dd></dl></div>`;
}
function sources() {
  const S = [["Kite, read-only", "Zerodha through its own MCP server. Saarth reads holdings and never places orders."], ["Console file", "CSV or XLSX, checked row by row before it’s saved."], ["Dhan file", "CSV or XLSX, checked row by row before it’s saved."], ["Any CSV or screenshot", "For any broker; screenshots are read with your own AI key."]];
  return frame(180, S.map(([s, t], i) => `<g${tip(t)}><rect x="0" y="${12 + i * 40}" width="150" height="26" fill="transparent"/>${T(0, 30 + i * 40, s, { c: "var(--text-2)", s: 12, body: true })}<path d="M150 ${25 + i * 40}C230 ${25 + i * 40} 236 90 262 90" stroke="var(--accent)" stroke-opacity=".5" fill="none" stroke-width="1.4"/></g>`).join("") + `<rect x="262" y="68" width="78" height="44" rx="6" fill="var(--accent-soft)" stroke="var(--accent-line)"/>${T(301, 94, "One view", { a: "middle", c: "var(--text)", s: 12, body: true })}`, "Accounts flowing into one view");
}
function abilities() {
  return `<ul class="vz-list"><li><span class="dot dot-live"></span>Bring holdings in, read-only</li><li><span class="dot dot-live"></span>See where the risk sits</li><li><span class="dot dot-live"></span>Ask what if, tax included</li><li><span class="dot dot-live"></span>Plan a goal, as simulations</li><li><span class="dot dot-exp"></span>Test a rule, with costs</li></ul>`;
}
const pick = id => ({ advice: abilities, predict: impact, whatif: impact, risk: lookThrough, tax: taxlots, goal: fan, build: backtest, journal: () => journal(), import: sources, unseen: walkforward, paper, describe: candles, optimise: mixes }[id] || abilities);
const reachOf = (monthly, goal) => { const m = fan(monthly, goal).match(/goal in (\d+)%/); return m ? +m[1] : 0; };
return { reachOf, impact, lookThrough, fan, backtest, mixes, treemap, leaders, candles, walkforward, taxlots, paper, journal, sources, abilities, pick };
})();
