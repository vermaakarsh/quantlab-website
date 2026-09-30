/* Saarth by The Quant Lab: site script, shared by index.html and features.html.
   No dependencies. Everything runs in the browser; nothing is sent anywhere. */
(() => {
"use strict";
const root = document.documentElement;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

/* Destinations. null = not configured yet: rendered as "Soon", never as a live link. */
const LINKS = {
  app: null, // enable https://saarth.thequantlab.in/ when its separate site is live
  youtube: "https://youtube.com/@quantlab",
  home: "https://thequantlab.in/",
  blog: null, // enable when blog.thequantlab.in has a published destination
  courses: null   // https://courses.thequantlab.in (later)
};

// Which page this is. Sections that exist on only one page are built only there;
// on the other page their module is a stand-in whose methods do nothing.
const PAGE = document.body.dataset.page === "features" ? "features" : "main", ON_MAIN = PAGE === "main";
const OTHER = ON_MAIN ? "features.html" : "index.html";
const NOOP = new Proxy({}, { get: () => () => {} });

const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
const mqLight = matchMedia("(prefers-color-scheme: light)");
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const MINUS = "−";
const inr = v => (v < -.5 ? MINUS : "") + "₹" + Math.round(Math.abs(v)).toLocaleString("en-IN");
const pct = (v, d = 1) => (v < -5e-7 ? MINUS : v > 5e-7 ? "+" : "") + Math.abs(v * 100).toFixed(d) + "%";
const el = (tag, cls, html) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; };
const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = d => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const addMonths = (d, m) => { const x = new Date(d); const day = x.getDate(); x.setDate(1); x.setMonth(x.getMonth() + m); x.setDate(Math.min(day, 28)); return x; };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const svgNS = "http://www.w3.org/2000/svg";
const sv = (tag, attrs) => { const n = document.createElementNS(svgNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
const place = (d, x, y, w, h) => { d.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; if (w != null) d.style.width = Math.max(0, w).toFixed(1) + "px"; if (h != null) d.style.height = Math.max(0, h).toFixed(1) + "px"; };

/* ================= Chakra: the solar system ================= */
/* Chakra as a solar system (the "Kaksha" direction).
   Sun = your goal. Planets = rules you keep, each with its own quiet colour. Comets = reasons you log.
   Learning warms the sun to yellow and draws dust together into a new planet.
   One renderer serves every size; detail drops away as the canvas gets smaller. */
const Kaksha = (() => {
  const TAU = Math.PI * 2, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const rgb = h => { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map(x => x + x).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const rgba = (h, a) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; };
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const kep = (M, e) => { let E = M; for (let k = 0; k < 5; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; };

  // States ease in and out. warm: how yellow the sun burns (0 cool white, 1 full gold)
  const STATES = {
    idle:      { speed: 1,   glow: .6,  warm: .55, orbit: 0, pulse: 0, dim: 1,   gather: 0,   scan: 0,  stream: 0, breathe: 0 },
    listening: { speed: .4,  glow: .85, warm: .65, orbit: 0, pulse: 0, dim: 1,   gather: .35, scan: 0,  stream: 0, breathe: 1 },
    thinking:  { speed: 3,   glow: .85, warm: .3,  orbit: 0, pulse: 0, dim: 1,   gather: .1,  scan: 1,  stream: 0, breathe: 0 },
    working:   { speed: 4.5, glow: 1,   warm: .45, orbit: 0, pulse: 0, dim: 1,   gather: .06, scan: .35, stream: 1, breathe: 0 },
    answering: { speed: 1.3, glow: 1,   warm: .6,  orbit: 1, pulse: 0, dim: 1,   gather: 0,   scan: 0,  stream: 0, breathe: 0 },
    learned:   { speed: 1.4, glow: 1,   warm: 1,   orbit: 0, pulse: 0, dim: 1,   gather: 0,   scan: 0,  stream: 0, breathe: 0 },
    unsure:    { speed: .3,  glow: .3,  warm: .4,  orbit: 0, pulse: 0, dim: .55, gather: 0,   scan: 0,  stream: 0, breathe: 0 }
  };
  // Planets: orbit (a, e, inclination, periapsis), size, two tones, surface, extras. Muted, so colour stays quiet.
  const PLANETS = [
    { a: .19, e: .19, i: .2, w: .5, s: 1.5, c: ["#c9c2b8", "#6d6862"], kind: "rock", spin: .4 },
    { a: .29, e: .05, i: .12, w: 2.2, s: 2.6, c: ["#a9d4ff", "#2b5d97"], kind: "earth", moons: 1, atmo: "#a9dcff", spin: .6 },
    { a: .39, e: .09, i: .16, w: 4.1, s: 2.1, c: ["#deb29b", "#7c5142"], kind: "rock", spin: .5 },
    { a: .57, e: .05, i: .1, w: 5.3, s: 5.3, c: ["#eed9ad", "#9a7447"], kind: "bands", moons: 2, spotC: "#c98e6a", spin: 1.4 },
    { a: .72, e: .06, i: .14, w: 1.1, s: 4.4, c: ["#f3e4ba", "#a88b52"], kind: "bands", ring: true, spin: 1.2 },
    { a: .86, e: .04, i: .18, w: 3.3, s: 3.1, c: ["#b3e9e4", "#347b83"], kind: "ice", spin: .8 }
  ].map(p => ({ ...p, M0: rnd() * TAU, T: 3.2 * Math.pow(p.a / .29, 1.5), pop: 0, phase: rnd() * TAU,
    craters: Array.from({ length: 5 }, () => [rnd() * 2 - 1, rnd() * 1.6 - .8, .12 + rnd() * .18]),
    land: Array.from({ length: 4 }, () => [rnd() * 2, rnd() * 1.2 - .6, .25 + rnd() * .3]) }));
  const ORDER = [1, 3, 4, 2, 5, 0]; // the first rules light the most recognisable worlds

  function create(host, { mode = "mini", rules = null, onHover = null, zoom = 1, ghosts = false } = {}) {
    const full = mode === "full";
    const c = document.createElement("canvas"); host.appendChild(c);
    const g = c.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1);
    const S = { W: 0, st: { beads: 18, lit: 1 }, t: 0, tt: 0, tp: 0, P: { ...STATES.idle }, T: STATES.idle, flash: 0, px: 0, py: 0, hover: -1 };
    let col = {};
    const theme = () => { const dark = getComputedStyle(document.documentElement).colorScheme !== "light";
      col = { dark, a: css("--accent"), bg: css("--panel"), sunCool: dark ? "#f4f8ff" : "#fff6dc", sunWarm: dark ? "#ffd36b" : "#e6a70a", sunDeep: dark ? "#f29a3a" : "#c77b06", belt: dark ? "#9a9184" : "#6f6558", star: dark ? "#b9c4d2" : "#6f7986", night: dark ? "rgba(6,10,16,.62)" : "rgba(22,30,44,.72)" }; };
    const size = () => { const w = c.getBoundingClientRect().width; if (!w || Math.abs(w - S.W) < .5) return; S.W = w; c.width = c.height = Math.round(w * dpr); };
    new ResizeObserver(size).observe(c); theme(); new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const BELT = Array.from({ length: full ? 300 : 26 }, () => ({ a: .46 + rnd() * .07, e: rnd() * .06, i: .16 * (rnd() - .5), w: rnd() * TAU, M0: rnd() * TAU, s: .5 + rnd() * .7 }));
    BELT.forEach(b => b.T = 3.2 * Math.pow(b.a / .29, 1.5));
    const CLOUD = Array.from({ length: 72 }, () => ({ a: .95 + rnd() * .08, e: rnd() * .05, i: (rnd() - .5) * .5, w: rnd() * TAU, M0: rnd() * TAU }));
    CLOUD.forEach(b => b.T = 3.2 * Math.pow(b.a / .29, 1.5) * 3);
    const STARS = full ? Array.from({ length: 140 }, () => ({ x: rnd(), y: rnd(), s: .3 + rnd() * .9, tw: rnd() * TAU })) : [];
    const RAYS = Array.from({ length: 10 }, (_, k) => ({ a: k / 10 * TAU + rnd() * .3, l: .7 + rnd() * .6, w: .06 + rnd() * .05 }));
    let comets = [], nextComet = 0, dust = [], tailP = [];
    if (full) { c.addEventListener("pointermove", e => { const b = c.getBoundingClientRect(); S.px = (e.clientX - b.left) / b.width - .5; S.py = (e.clientY - b.top) / b.height - .5; S.mx = (e.clientX - b.left) * dpr; S.my = (e.clientY - b.top) * dpr; });
      c.addEventListener("pointerleave", () => { S.px = S.py = 0; S.mx = S.my = null; }); }

    const pos = (o, t, sc) => { const E = kep(((o.M0 + TAU * t / o.T) % TAU + TAU) % TAU, o.e), x = o.a * sc * (Math.cos(E) - o.e), y = o.a * sc * Math.sqrt(1 - o.e * o.e) * Math.sin(E);
      const X = x * Math.cos(o.w) - y * Math.sin(o.w), Y = x * Math.sin(o.w) + y * Math.cos(o.w); return [X, Y * Math.cos(o.i), Y * Math.sin(o.i)]; };

    const ink = p => col.dark ? p.c[0] : mix(p.c[0], p.c[1], .62);
  function drawPlanet(x, y, r, p, sx, sy, on, warmth) {
      const dx = sx - x, dy = sy - y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, t = S.tt * p.spin + p.phase;
      const c0 = on ? p.c[0] : mix(p.c[0], "#8b929c", .7), c1 = on ? p.c[1] : mix(p.c[1], "#3e444c", .7);
      g.globalCompositeOperation = "source-over"; g.globalAlpha = on ? 1 : .55;
      g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
      const base = g.createLinearGradient(x, y - r, x, y + r); base.addColorStop(0, c0); base.addColorStop(1, mix(c0, c1, .55)); g.fillStyle = base; g.fillRect(x - r, y - r, r * 2, r * 2);
      if (r > 3.5) {
        if (p.kind === "bands") { // bands drift with the planet's spin; a storm crosses the face
          for (let k = -5; k <= 5; k++) { const yy = y + k * r * .24 + Math.sin(t * .6 + k) * r * .03; g.globalAlpha = (on ? .32 : .2) * (k % 2 ? 1 : .55); g.fillStyle = k % 2 ? c1 : mix(c0, "#ffffff", .25); g.fillRect(x - r, yy, r * 2, r * (.09 + .05 * ((k + 7) % 3))); }
          if (p.spotC && on) { const sxp = x + (((t * .18) % 2.4) - 1.2) * r; g.globalAlpha = .6; g.fillStyle = p.spotC; g.beginPath(); g.ellipse(sxp, y + r * .28, r * .22, r * .12, 0, 0, TAU); g.fill(); }
        } else if (p.kind === "earth") { // pale continents rolling past
          g.fillStyle = on ? "#d8ecdf" : "#9aa2a8"; p.land.forEach(([lx, ly, lr]) => { const xx = x + ((((lx + t * .08) % 2) + 2) % 2 - 1) * r * 1.3; g.globalAlpha = .38; g.beginPath(); g.ellipse(xx, y + ly * r, lr * r, lr * r * .6, .4, 0, TAU); g.fill(); });
          g.globalAlpha = .25; g.fillStyle = "#ffffff"; g.fillRect(x - r, y - r * 1.02, r * 2, r * .16); g.fillRect(x - r, y + r * .86, r * 2, r * .16);
        } else if (p.kind === "rock") { g.fillStyle = c1; p.craters.forEach(([cx, cy, cr]) => { const xx = x + ((((cx + t * .05) % 2) + 3) % 2 - 1) * r; g.globalAlpha = .35; g.beginPath(); g.arc(xx, y + cy * r, cr * r, 0, TAU); g.fill(); }); }
        else if (p.kind === "ice") { g.globalAlpha = .22; g.fillStyle = "#ffffff"; for (let k = -2; k <= 2; k++) g.fillRect(x - r, y + k * r * .38 + Math.sin(t * .4 + k) * r * .05, r * 2, r * .06); }
      }
      // day and night: lit toward the sun, night on the far side; a warm cast while learning
      const lg = g.createLinearGradient(x + ux * r, y + uy * r, x - ux * r, y - uy * r);
      lg.addColorStop(0, "rgba(255,255,255,.2)"); lg.addColorStop(.42, "rgba(255,255,255,0)"); lg.addColorStop(.62, rgba("#000000", .12)); lg.addColorStop(1, col.night);
      g.globalAlpha = 1; g.fillStyle = lg; g.fillRect(x - r, y - r, r * 2, r * 2);
      if (warmth > .02) { const wg = g.createRadialGradient(x + ux * r * .6, y + uy * r * .6, 0, x + ux * r * .6, y + uy * r * .6, r * 1.3); wg.addColorStop(0, rgba(col.sunWarm, .55 * warmth)); wg.addColorStop(1, rgba(col.sunWarm, 0)); g.fillStyle = wg; g.fillRect(x - r, y - r, r * 2, r * 2); }
      g.restore();
      if (!col.dark && r > 2) { g.globalAlpha = on ? .22 : .12; g.strokeStyle = mix(p.c[1], "#000000", .3); g.lineWidth = Math.max(.6, r * .05); g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke(); }
      if (p.atmo && on && r > 2.5) { g.globalAlpha = .55; const ag = g.createRadialGradient(x, y, r * .9, x, y, r * 1.35); ag.addColorStop(0, rgba(p.atmo, .5)); ag.addColorStop(1, rgba(p.atmo, 0)); g.fillStyle = ag; g.beginPath(); g.arc(x, y, r * 1.35, 0, TAU); g.fill(); }
    }
    function drawRing(x, y, r, p, half, on) {
      g.globalCompositeOperation = "source-over"; const tilt = -.32, rx = r * 2.15, ry = r * .62;
      [[1, .5, 1.2], [.92, .35, .8], [.8, .55, 1.4], [.68, .3, .9]].forEach(([k, a, w]) => { g.globalAlpha = a * (on ? 1 : .5); g.strokeStyle = col.dark ? mix(p.c[0], "#ffffff", .15) : mix(p.c[0], p.c[1], .45); g.lineWidth = Math.max(.6, r * .09 * w);
        g.beginPath(); g.ellipse(x, y, rx * k, ry * k, tilt, half ? Math.PI : 0, half ? TAU : Math.PI); g.stroke(); });
    }
    function drawSun(x, y, R, u) {
      const P = S.P, br = 1 + .1 * P.breathe * Math.sin(S.t * 2.4), warm = P.warm, hue = mix(col.sunCool, col.sunWarm, warm), core = full ? R * .062 : R * .15;
      const add = "source-over";
      g.globalCompositeOperation = add;
      const halo = g.createRadialGradient(x, y, 0, x, y, core * (full ? 9 : 3.6) * br); halo.addColorStop(0, rgba(hue, (.28 + .2 * P.glow) * (col.dark ? .6 : .5))); halo.addColorStop(.28, rgba(hue, .07 * P.glow)); halo.addColorStop(1, rgba(hue, 0));
      g.globalAlpha = 1; g.fillStyle = halo; g.beginPath(); g.arc(x, y, core * (full ? 9 : 3.6) * br, 0, TAU); g.fill();
      g.globalCompositeOperation = "source-over";
      const body = g.createRadialGradient(x - core * .25, y - core * .25, core * .1, x, y, core * br); body.addColorStop(0, "#fffdf3"); body.addColorStop(.55, hue); body.addColorStop(1, mix(hue, col.sunDeep, .55));
      g.globalAlpha = .6 + .4 * P.glow; g.fillStyle = body; g.beginPath(); g.arc(x, y, core * br, 0, TAU); g.fill();
      if (full) { g.fillStyle = "#fffaf0"; for (let k = 0; k < 5; k++) { const a = k * 2.4 + S.t * .3, rr = core * .55 * ((k * .37) % 1); g.globalAlpha = .25 + .2 * Math.sin(S.t * 3 + k); g.beginPath(); g.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, core * .09, 0, TAU); g.fill(); } }
      return core;
    }

    function frame(now) {
      raf = 0; const dt = reduce || (typeof motionOn !== "undefined" && !motionOn) ? 0 : Math.min(.05, (now - last) / 1000); last = now;
      if (S.W) draw(dt);
      if (vis && dt > 0) raf = requestAnimationFrame(frame);
    }
    function draw(dt) {
      const P = S.P; for (const k in S.T) P[k] += (S.T[k] - P[k]) * Math.min(1, dt ? dt * 2 : 1);
      S.t += dt; S.tt += dt * P.speed; S.tp += dt * P.speed * (1 + 2.2 * P.orbit); S.flash = Math.max(0, S.flash - dt * .38);
      const R = c.width / 2, Z = full ? zoom : 1, u = R / (full ? 200 : 33) * Z, st = S.st, kept = Math.max(0, Math.min(6, st.lit));
      const el = ((full ? 32 : 50) + (full ? 18 : 0) * -S.py + (full ? 2.5 * Math.sin(S.t * .11) : 0)) * Math.PI / 180, spin = S.px * .6 + S.t * (full ? .012 : 0), sc = (1 - .18 * P.gather) * (full ? 1 : 1.06);
      const proj = ([x, y, z]) => { const xr = x * Math.cos(spin) - y * Math.sin(spin), yr = x * Math.sin(spin) + y * Math.cos(spin), d = -yr * Math.cos(el) + z * Math.sin(el), s = 2.5 / (2.5 - d); return [R + xr * R * s * Z, R - (yr * Math.sin(el) + z * Math.cos(el)) * R * s * Z, d, s]; };
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.save();
      if (!full) { g.beginPath(); g.arc(R, R, R, 0, TAU); g.clip(); }
      const add = "source-over", glowOp = col.dark ? "screen" : "source-over";
      // stars
      if (full) { g.globalCompositeOperation = add; g.fillStyle = col.star; STARS.forEach(s => { s.tw += dt; g.globalAlpha = (col.dark ? .16 : .34) * s.s * (.7 + .3 * Math.sin(s.tw * 1.3)); g.beginPath(); g.arc(s.x * c.width + S.px * 8 * s.s, s.y * c.height + S.py * 8 * s.s, u * .9 * s.s, 0, TAU); g.fill(); }); }
      { g.globalCompositeOperation = "source-over"; g.beginPath(); for (let j = 0; j <= 48; j++) { const a = j / 48 * TAU, q = proj([Math.cos(a) * .98 * sc, Math.sin(a) * .98 * sc, 0]); j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }
        const o = proj([0, 0, 0]); if (full) { const near = proj([0, -.55 * sc, 0]), sh = g.createRadialGradient(near[0], near[1], 0, near[0], near[1], R * .5); sh.addColorStop(0, rgba(col.sunWarm, col.dark ? .045 : .06)); sh.addColorStop(1, rgba(col.sunWarm, 0)); g.globalAlpha = 1; g.fillStyle = sh; g.save(); g.clip(); g.fillRect(0, 0, c.width, c.height); g.restore(); g.beginPath(); for (let j = 0; j <= 48; j++) { const a = j / 48 * TAU, q = proj([Math.cos(a) * .98 * sc, Math.sin(a) * .98 * sc, 0]); j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } }
        const pg = g.createRadialGradient(o[0], o[1], 0, o[0], o[1], R * .98); pg.addColorStop(0, rgba(col.a, col.dark ? .07 : .09)); pg.addColorStop(.6, rgba(col.a, col.dark ? .025 : .04)); pg.addColorStop(1, rgba(col.a, 0)); g.globalAlpha = 1; g.fillStyle = pg; g.fill(); }
      const sun = proj([0, 0, 0]), warmth = Math.max(0, (P.warm - .7) / .3) * .9 + S.flash * .6;
      // orbits: a fading trail behind each kept planet, over a guide that is barely there
      const along = (p, E) => proj(pos({ ...p, M0: E - p.e * Math.sin(E), T: 1e9 }, 0, sc)), anomaly = p => { const M = ((p.M0 + TAU * S.tp / p.T) % TAU + TAU) % TAU; return kep(M, p.e); };
      PLANETS.forEach((p, k) => { if (ORDER.indexOf(k) >= kept) return; g.globalCompositeOperation = "source-over"; g.strokeStyle = ink(p); g.lineCap = "round";
        const E0 = anomaly(p), guide = col.dark ? .045 : .07; let prev = along(p, 0);
        g.lineWidth = u * (full ? .7 : .6);
        for (let j = 1; j <= 72; j++) { const q = along(p, j / 72 * TAU); g.globalAlpha = guide * (q[2] < 0 ? .5 : 1); g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(q[0], q[1]); g.stroke(); prev = q; }
        prev = along(p, E0); g.lineWidth = u * (full ? 1.2 : .9);
        for (let j = 1; j <= 36; j++) { const q = along(p, E0 - j / 36 * TAU * .38), f = 1 - j / 36; g.globalAlpha = (col.dark ? .3 : .5) * f * f * (q[2] < 0 ? .55 : 1); g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(q[0], q[1]); g.stroke(); prev = q; } });
      // thinking: a glint travels from world to world rather than round every orbit
      if (P.scan > .05) { g.globalCompositeOperation = add; const n = Math.max(1, kept), w = (S.t * .9) % n; PLANETS.forEach((p, k) => { const rank = ORDER.indexOf(k); if (rank >= n && full) return; const d = Math.min(Math.abs(rank - w), n - Math.abs(rank - w)), a = P.scan * Math.max(0, 1 - d * 1.4); if (a < .02) return;
        const q = proj(pos(p, S.tp, sc)), gl = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], u * (full ? 16 : 7)); gl.addColorStop(0, rgba(col.a, .35 * a)); gl.addColorStop(1, rgba(col.a, 0)); g.globalAlpha = 1; g.fillStyle = gl; g.beginPath(); g.arc(q[0], q[1], u * (full ? 16 : 7), 0, TAU); g.fill(); }); }
      // belt and the outer cloud of logged reasons
      g.globalCompositeOperation = "source-over"; g.fillStyle = col.belt;
      BELT.forEach(b => { const q = proj(pos(b, S.tt * (1 + P.stream), sc)); const wz = pos(b, S.tt * (1 + P.stream), sc)[2]; g.globalAlpha = (col.dark ? .34 : .6) * (.6 + .4 * P.glow) * (q[2] < 0 ? .6 : 1) * (wz < 0 ? .55 : 1); g.beginPath(); g.arc(q[0], q[1], u * .75 * b.s * q[3], 0, TAU); g.fill(); });
      if (full) { g.globalCompositeOperation = add; CLOUD.forEach((b, k) => { const on = k < st.beads, q = proj(pos(b, S.tt, sc)); g.fillStyle = on ? col.a : col.star; g.globalAlpha = on ? (col.dark ? .45 : .5) : (col.dark ? .08 : .12); g.beginPath(); g.arc(q[0], q[1], u * (on ? 1.1 : .9) * q[3], 0, TAU); g.fill(); }); }
      // comets: a straight blue ion tail and a curved pale-gold dust tail, both away from the sun
      if (P.stream > .5 && S.t > nextComet) { spawnComet(); nextComet = S.t + (full ? .9 : .5); }
      comets = comets.filter(cm => S.tt - cm.born < cm.life);
      g.globalCompositeOperation = glowOp;
      comets.forEach(cm => { const w = pos(cm, S.tt - cm.born, sc), q = proj(w), dx = q[0] - sun[0], dy = q[1] - sun[1], dl = Math.hypot(dx, dy) || 1, heat = Math.min(1, R * .3 / dl), L = R * (full ? .28 : .3) * (.4 + heat);
        const ion = g.createLinearGradient(q[0], q[1], q[0] + dx / dl * L, q[1] + dy / dl * L); ion.addColorStop(0, rgba(col.a, .7)); ion.addColorStop(1, rgba(col.a, 0)); g.strokeStyle = ion; g.globalAlpha = 1; g.lineWidth = u * (full ? 1.1 : 1); g.beginPath(); g.moveTo(q[0], q[1]); g.lineTo(q[0] + dx / dl * L, q[1] + dy / dl * L); g.stroke();
        const nx = -dy / dl, ny = dx / dl, dust = g.createLinearGradient(q[0], q[1], q[0] + dx / dl * L * .8, q[1] + dy / dl * L * .8); dust.addColorStop(0, rgba(col.sunWarm, .5)); dust.addColorStop(1, rgba(col.sunWarm, 0)); g.strokeStyle = dust; g.lineWidth = u * (full ? 2.2 : 1.6);
        g.beginPath(); g.moveTo(q[0], q[1]); g.quadraticCurveTo(q[0] + dx / dl * L * .45 + nx * L * .18, q[1] + dy / dl * L * .45 + ny * L * .18, q[0] + dx / dl * L * .8 + nx * L * .32, q[1] + dy / dl * L * .8 + ny * L * .32); g.stroke();
        g.fillStyle = "#f2fbff"; g.beginPath(); g.arc(q[0], q[1], u * (full ? 1.8 : 1.4), 0, TAU); g.fill(); });
      // bodies, sorted by depth so planets and moons pass in front of and behind the sun
      const bodies = [{ sun: true, q: sun }];
      PLANETS.forEach((p, k) => { const rank = ORDER.indexOf(k), on = rank < kept; if (!full && !on && rank > 3) return; if (full && !on && !ghosts) return; bodies.push({ p, k, on, q: proj(pos(p, S.tp, sc)), w: pos(p, S.tp, sc) }); });
      bodies.sort((A, B) => A.q[2] - B.q[2]);
      let hit = -1;
      bodies.forEach(b => {
        if (b.sun) { drawSun(b.q[0], b.q[1], R, u); return; }
        const p = b.p, [x, y, , s] = b.q; p.pop = Math.max(0, p.pop - dt * .7); const r = u * (full ? p.s * 2.1 : Math.min(p.s, 3.4) * .95) * s * (b.on ? 1 : .75) * (1 + .6 * p.pop * Math.sin(p.pop * Math.PI));
        // orrery stem: a hairline from the planet down to the plane, with a small foot
        if (full && b.on) { const dw = Math.hypot(b.w[0], b.w[1]) || 1, sh = proj([b.w[0] + b.w[0] / dw * .05, b.w[1] + b.w[1] / dw * .05, 0]), sg = g.createRadialGradient(sh[0], sh[1], 0, sh[0], sh[1], r * 1.6);
          sg.addColorStop(0, col.dark ? "rgba(0,0,0,.45)" : "rgba(20,26,36,.2)"); sg.addColorStop(1, "rgba(0,0,0,0)"); g.globalCompositeOperation = "source-over"; g.globalAlpha = 1; g.fillStyle = sg; g.save(); g.translate(sh[0], sh[1]); g.scale(1.6, Math.max(.25, Math.sin(el))); g.translate(-sh[0], -sh[1]); g.beginPath(); g.arc(sh[0], sh[1], r * 1.6, 0, TAU); g.fill(); g.restore(); }
        if (full && b.on) { const f = proj([b.w[0], b.w[1], 0]); g.globalCompositeOperation = "source-over"; g.strokeStyle = ink(p); g.globalAlpha = col.dark ? .16 : .3; g.lineWidth = u * .6; g.beginPath(); g.moveTo(x, y + (f[1] > y ? r : -r)); g.lineTo(f[0], f[1]); g.stroke(); g.fillStyle = ink(p); g.globalAlpha = col.dark ? .24 : .4; g.beginPath(); g.ellipse(f[0], f[1], u * 2.2, u * 2.2 * Math.sin(el), 0, 0, TAU); g.fill(); }
        const below = full && b.w && b.w[2] < -.004;
        const moons = (full ? p.moons || 0 : Math.min(1, p.moons || 0)) * (b.on ? 1 : 0), mp = [];
        for (let m = 0; m < moons; m++) { const ma = S.tt * (1.8 - m * .6) + m * 2.2, mr = r * (2 + m * .9); mp.push({ x: x + Math.cos(ma) * mr, y: y + Math.sin(ma) * mr * .38, back: Math.sin(ma) < 0 }); }
        const moon = m => { const hidden = m.back && Math.hypot(m.x - x, m.y - y) < r; if (hidden) return; g.globalCompositeOperation = "source-over"; g.globalAlpha = .9; g.fillStyle = col.dark ? "#cfd6de" : "#8e97a2"; g.beginPath(); g.arc(m.x, m.y, Math.max(.8, r * .16), 0, TAU); g.fill(); };
        mp.filter(m => m.back).forEach(moon);
        if (p.ring) drawRing(x, y, r, p, true, b.on);
        drawPlanet(x, y, r, p, sun[0], sun[1], b.on, b.on ? warmth : 0);
        if (below) { g.globalCompositeOperation = "source-over"; g.globalAlpha = .28; g.fillStyle = col.bg; g.beginPath(); g.arc(x, y, r + .5, 0, TAU); g.fill(); }
        if (p.ring) drawRing(x, y, r, p, false, b.on);
        mp.filter(m => !m.back).forEach(moon);
        if (full && S.mx != null && Math.hypot(S.mx - x, S.my - y) < r + 10 * dpr) hit = b.k;
        if (full && b.k === S.hover) { g.globalCompositeOperation = "source-over"; const hg = g.createRadialGradient(x, y, r, x, y, r * 2.6 + u * 4); hg.addColorStop(0, rgba(col.a, .28)); hg.addColorStop(1, rgba(col.a, 0)); g.globalAlpha = 1; g.fillStyle = hg; g.beginPath(); g.arc(x, y, r * 2.6 + u * 4, 0, TAU); g.fill(); }
      });
      if (full && hit !== S.hover) { S.hover = hit; onHover && onHover(hit, ORDER.indexOf(hit)); }
      // learning: dust spirals in and becomes the new planet
      if (dust.length) { g.globalCompositeOperation = add; dust = dust.filter(d => (d.t += dt / 1.8) < 1); dust.forEach(d => { const tgt = proj(pos(PLANETS[d.k], S.tp, sc)), e = Math.max(0, d.t) * Math.max(0, d.t), a = d.a + (1 - e) * 4.2, rr = (1 - e) * R * d.r; g.fillStyle = col.sunWarm; g.globalAlpha = d.t < 0 ? 0 : .8 * Math.sin(Math.PI * Math.min(1, d.t * 1.2)); g.beginPath(); g.arc(tgt[0] + Math.cos(a) * rr, tgt[1] + Math.sin(a) * rr * (.45 + d.z), u * (full ? 1.4 : 1.1), 0, TAU); g.fill(); }); }
      // learning: a warm light goes once round each kept orbit while the sun burns gold
      if (S.flash > 0) { g.globalCompositeOperation = add; const lap = 1 - S.flash, env = Math.sin(Math.PI * Math.min(1, lap * 1.08));
        PLANETS.forEach((p, k) => { if (ORDER.indexOf(k) >= Math.max(1, kept)) return; g.strokeStyle = col.sunWarm; g.lineCap = "round"; g.lineWidth = u * (full ? 1.6 : 1.1); let prev = null;
          for (let j = 0; j <= 28; j++) { const E = (lap * 1.1 + k * .17) * TAU - j / 28 * TAU * .3, q = proj(pos({ ...p, M0: E - p.e * Math.sin(E), T: 1e9 }, 0, sc)); if (prev) { g.globalAlpha = env * (1 - j / 28) * .5 * (q[2] < 0 ? .5 : 1); g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(q[0], q[1]); g.stroke(); } prev = q; } });
        const hg = g.createRadialGradient(sun[0], sun[1], 0, sun[0], sun[1], R * .42); hg.addColorStop(0, rgba(col.sunWarm, .2 * env)); hg.addColorStop(1, rgba(col.sunWarm, 0)); g.globalAlpha = 1; g.fillStyle = hg; g.beginPath(); g.arc(sun[0], sun[1], R * .42, 0, TAU); g.fill(); }
      g.globalCompositeOperation = "source-over";
      if (P.dim < .99) { g.globalAlpha = (1 - P.dim) * .85; g.fillStyle = col.bg; g.fillRect(0, 0, c.width, c.height); }
      g.restore(); g.globalAlpha = 1;
    }
    function spawnComet() { comets.push({ a: .62, e: .88, i: .35 * (rnd() - .5), w: rnd() * TAU, M0: Math.PI * 1.5, T: 3.4 * (full ? 1.6 : 1), born: S.tt, life: full ? 3.2 : 2.4 }); }
    let last = performance.now(), raf = 0, vis = false;
    const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) kick(); }).observe(c);
    const redraw = () => { if (S.W && (reduce || (typeof motionOn !== "undefined" && !motionOn))) draw(0); else kick(); };
    return {
      state(k) { S.T = STATES[k] || STATES.idle; if (k === "learned") { S.flash = 1; const idx = ORDER[Math.max(0, Math.min(5, S.st.lit - 1))]; PLANETS[idx].pop = 1; if (!reduce) for (let j = 0; j < (full ? 60 : 18); j++) dust.push({ k: idx, a: rnd() * TAU, t: -rnd() * .45, r: .08 + rnd() * .22, z: (rnd() - .5) * .5 }); } redraw(); },
      set(st) { S.st = { ...st }; redraw(); },
      event(kind) { if (kind === "reason") spawnComet(); redraw(); },
      kick,
      look(px, py) { S.px = px; S.py = py; }
    };
  }
  return { create, STATES, ORDER, PLANETS };
})();

const Kx = [];
const kxOf = sel => { const n = typeof sel === "string" ? $(sel) : sel; return n ? n._kx : null; };
const fillChakras = () => $$("[data-chakra]").forEach(n => {
  if (n._kx) return; const full = n.dataset.chakra === "full";
  const v = Kaksha.create(n, { mode: full ? "full" : "mini", zoom: +(n.dataset.zoom || 1), ghosts: n.dataset.ghosts === "1", onHover: full ? (k, rank) => n.dispatchEvent(new CustomEvent("kx-hover", { detail: rank })) : null });
  v.set({ beads: +(n.dataset.beads || 18), lit: +(n.dataset.lit || 1) }); n._kx = v; Kx.push(v);
});

const onVisible = (node, fn, margin = "0px") => { const o = new IntersectionObserver(([e]) => fn(e.isIntersecting), { rootMargin: margin }); o.observe(node); };

/* Links */
$$("[data-link]").forEach(a => {
  const url = LINKS[a.dataset.link];
  if (url) { a.href = url; if (!url.startsWith("https://saarth")) { a.target = "_blank"; a.rel = "noopener noreferrer"; } return; }
  a.replaceWith(el("span", "soon", `${a.textContent}<em>Soon</em>`));
});
$("#yr").textContent = new Date().getFullYear();

/* Tooltip */
const tip = $("#tip");
function showTip(html, x, y) {
  tip.innerHTML = html; tip.classList.add("is-on");
  const r = tip.getBoundingClientRect();
  let left = x + 14, top = y + 14;
  if (left + r.width > innerWidth - 12) left = x - r.width - 14;
  if (top + r.height > innerHeight - 12) top = y - r.height - 14;
  tip.style.transform = `translate(${Math.max(8, left)}px,${Math.max(8, top)}px)`;
}
function hideTip() { tip.classList.remove("is-on"); }

/* Motion preference */
let motionOn = store.get("tql:motion") ? store.get("tql:motion") === "on" : !mqReduce.matches;
const motionBtn = $("#motion-btn");
const motionListeners = [];
function applyMotion() {
  root.classList.toggle("motion-off", !motionOn);
  motionBtn.setAttribute("aria-pressed", String(!motionOn));
  $("#motion-tx").textContent = motionOn ? "Pause motion" : "Play motion";
  motionListeners.forEach(f => f());
}
motionBtn.addEventListener("click", () => { motionOn = !motionOn; store.set("tql:motion", motionOn ? "on" : "off"); applyMotion(); });
mqReduce.addEventListener("change", () => { if (!store.get("tql:motion")) { motionOn = !mqReduce.matches; applyMotion(); } });

/* Theme */
const themeBtn = $("#theme-btn");
const theme = () => { const t = root.dataset.theme; return t === "light" || t === "dark" ? t : (mqLight.matches ? "light" : "dark"); };
const themeListeners = [];
function syncThemeUi() {
  const t = theme();
  themeBtn.dataset.current = t;
  themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  themeListeners.forEach(f => f());
}
themeBtn.addEventListener("click", e => {
  const next = theme() === "dark" ? "light" : "dark";
  const apply = () => { root.dataset.theme = next; store.set("tql:theme", next); syncThemeUi(); };
  if (!document.startViewTransition || !motionOn) { apply(); return; }
  const x = e.clientX || innerWidth - 40, y = e.clientY || 32;
  const rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => {
    root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${rad}px at ${x}px ${y}px)`] }, { duration: 750, easing: "cubic-bezier(.2,.75,.1,1)", pseudoElement: "::view-transition-new(root)" });
  }).catch(() => {});
});
mqLight.addEventListener("change", () => { if (!root.dataset.theme) syncThemeUi(); });

/* ================= Simulated-paths field (hero + closing) ================= */
function createField(o) {
  const cvs = o.canvas, ctx = cvs.getContext("2d"), host = o.host, A = o.alpha || 1;
  let W = 0, H = 0, ax = 0, ay = 0, dx = 6, S = 0, N = 0, mobile = false;
  let hist = null, paths = [], tints = [], p10, p50, p90, parts = [];
  let seed = o.seed || 7, T = 0, last = 0, raf = 0, cycle = -1, inView = false, layer = null, layerReady = false, C = null, ready = false;
  const GROW = 2.8, BAND0 = 2.1, BAND1 = 3.8, HOLD = o.hold || 9.2, FADE = 1.2, CYCLE = HOLD + FADE, LEAD = .9;
  const toRgb = s => { s = s.trim(); if (s[0] === "#") { if (s.length === 4) s = "#" + [...s.slice(1)].map(c => c + c).join(""); const n = parseInt(s.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; } const m = s.match(/[\d.]+/g); return m ? m.slice(0, 3).map(Number) : [154, 215, 255]; };
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function readColors() { const cs = getComputedStyle(root); C = { dark: theme() === "dark", acc: toRgb(cs.getPropertyValue("--accent")), up: toRgb(cs.getPropertyValue("--up")), down: toRgb(cs.getPropertyValue("--down")), ink: toRgb(cs.getPropertyValue("--text-2")) }; }
  function buildTints() { tints = paths.map(p => rgba(mix(C.acc, p.end < ay ? C.up : C.down, .36), (C.dark ? .17 : .12) * A)); }
  function size() {
    const r = cvs.getBoundingClientRect(); W = r.width; H = r.height; if (!W || !H) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mobile = W < 760;
    ax = W * (mobile ? o.mx : o.x); ay = H * (mobile ? (o.my || o.y) : o.y);
    if (mobile && o.gap) { const g = $(o.gap); ay = g.offsetTop + g.offsetHeight * .5 + 14; }
    dx = mobile ? 5 : 6; S = Math.ceil((W - ax) / dx) + 2; N = mobile ? o.nm : o.n;
    genHist(); gen(); layer = null; layerReady = false; ready = true;
  }
  function genHist() {
    const r = mulberry32(99), n = Math.ceil(ax / dx) + 1, raw = new Float32Array(n);
    let v = 0; for (let i = 1; i < n; i++) { v += gauss(r); raw[i] = v; }
    const sd = H * (mobile ? .01 : .012); hist = new Float32Array(n);
    for (let i = 0; i < n; i++) { const f = i / Math.max(1, n - 1); hist[i] = ay + (raw[i] - raw[n - 1] * f) * sd + (1 - f) * H * .1; }
  }
  function gen() {
    const r = mulberry32(seed * 7919);
    const rho = .72, spread = mobile ? Math.min(90, H * .12) : H * (o.spread || .2);
    const sig = spread / Math.sqrt(S * (1 + rho) / (1 - rho)), mu = -(mobile ? 40 : H * .05) / S, inn = Math.sqrt(1 - rho * rho);
    paths = [];
    for (let p = 0; p < N; p++) { const y = new Float32Array(S); let v = 0, e = gauss(r); y[0] = ay; for (let k = 1; k < S; k++) { e = rho * e + inn * gauss(r); v += mu + sig * e; y[k] = ay + v; } paths.push({ y, end: y[S - 1], delay: r() * .28 }); }
    p10 = new Float32Array(S); p50 = new Float32Array(S); p90 = new Float32Array(S);
    const col = new Float32Array(N);
    for (let k = 0; k < S; k++) { for (let p = 0; p < N; p++) col[p] = paths[p].y[k]; col.sort(); p10[k] = col[Math.floor(.1 * (N - 1))]; p50[k] = col[Math.floor(.5 * (N - 1))]; p90[k] = col[Math.ceil(.9 * (N - 1))]; }
    if (C) buildTints();
    parts = Array.from({ length: mobile ? Math.ceil(o.parts / 2.5) : o.parts }, () => spawn(true));
  }
  function spawn(initial) { return { p: Math.floor(Math.random() * N), k: initial ? -Math.random() * S * .9 : -Math.random() * S * .25, v: (.3 + Math.random() * .45) * S / 2.4 }; }
  function drawHist(prog) {
    const n = hist.length, km = Math.max(1, Math.floor(prog * (n - 1)));
    const g = ctx.createLinearGradient(0, 0, ax, 0);
    g.addColorStop(0, rgba(C.ink, 0)); g.addColorStop(.6, rgba(C.ink, (C.dark ? .28 : .3) * A)); g.addColorStop(1, rgba(C.ink, (C.dark ? .6 : .55) * A));
    ctx.strokeStyle = g; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(0, hist[0]);
    for (let i = 1; i <= km; i++) ctx.lineTo(i * dx, hist[i]);
    if (km === n - 1) ctx.lineTo(ax, ay);
    ctx.stroke();
  }
  function drawPaths(c, g, alpha) {
    c.globalCompositeOperation = C.dark ? "lighter" : "source-over"; c.lineWidth = 1; c.globalAlpha = alpha;
    for (let i = 0; i < N; i++) { const P = paths[i], pp = clamp((g - P.delay) / .72); if (pp <= 0) continue; const km = Math.max(1, Math.floor(pp * (S - 1))); c.strokeStyle = tints[i]; c.beginPath(); c.moveTo(ax, P.y[0]); for (let k = 1; k <= km; k++) c.lineTo(ax + k * dx, P.y[k]); c.stroke(); }
    c.globalAlpha = 1; c.globalCompositeOperation = "source-over";
  }
  function cacheLayer() { layer = layer || document.createElement("canvas"); layer.width = cvs.width; layer.height = cvs.height; const lc = layer.getContext("2d"); lc.setTransform(cvs.width / W, 0, 0, cvs.height / H, 0, 0); lc.clearRect(0, 0, W, H); drawPaths(lc, 1, 1); layerReady = true; }
  function blit(alpha) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = C.dark ? "lighter" : "source-over"; ctx.drawImage(layer, 0, 0); ctx.restore(); }
  function line(arr, km) { ctx.beginPath(); ctx.moveTo(ax, arr[0]); for (let k = 1; k <= km; k++) ctx.lineTo(ax + k * dx, arr[k]); }
  function drawBand(bp, alpha) {
    const km = Math.floor(bp * (S - 1)); if (km < 2) return;
    ctx.globalAlpha = alpha; ctx.fillStyle = rgba(C.acc, (C.dark ? .07 : .06) * A);
    ctx.beginPath(); ctx.moveTo(ax, p90[0]); for (let k = 1; k <= km; k++) ctx.lineTo(ax + k * dx, p90[k]); for (let k = km; k >= 0; k--) ctx.lineTo(ax + k * dx, p10[k]); ctx.closePath(); ctx.fill();
    ctx.setLineDash([2, 5]); ctx.lineWidth = 1; ctx.strokeStyle = rgba(C.acc, (C.dark ? .55 : .6) * A); line(p90, km); ctx.stroke(); line(p10, km); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = rgba(C.acc, (C.dark ? .75 : .8) * A); ctx.lineWidth = 1.4;
    if (C.dark) { ctx.shadowColor = rgba(C.acc, .7 * A); ctx.shadowBlur = 10; }
    line(p50, km); ctx.stroke(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  function drawParts(dt, alpha) {
    ctx.globalCompositeOperation = C.dark ? "lighter" : "source-over"; ctx.lineCap = "round";
    for (let i = 0; i < parts.length; i++) {
      const q = parts[i]; q.k += q.v * dt; if (q.k > S + 16) { parts[i] = spawn(false); continue; }
      const k1 = Math.floor(q.k); if (k1 < 1) continue;
      const ke = Math.min(k1, S - 1), k0 = Math.max(0, ke - 18); if (k0 >= ke) continue;
      const P = paths[q.p].y, x0 = ax + k0 * dx, x1 = ax + ke * dx;
      const gr = ctx.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, rgba(C.acc, 0)); gr.addColorStop(1, rgba(C.acc, .95 * alpha * A));
      ctx.strokeStyle = gr; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, P[k0]); for (let k = k0 + 1; k <= ke; k++) ctx.lineTo(ax + k * dx, P[k]); ctx.stroke();
      if (k1 < S) { ctx.fillStyle = rgba(C.acc, alpha * A); ctx.beginPath(); ctx.arc(x1, P[ke], 1.9, 0, 6.283); ctx.fill(); }
    }
    ctx.globalCompositeOperation = "source-over";
  }
  function drawAnchor(pulse) {
    if (pulse >= 0) { ctx.strokeStyle = rgba(C.acc, (1 - pulse) * .7 * A); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(ax, ay, 5 + pulse * 20, 0, 6.283); ctx.stroke(); }
    ctx.fillStyle = rgba(C.acc, A); ctx.beginPath(); ctx.arc(ax, ay, 3.6, 0, 6.283); ctx.fill();
    if (!o.label) return;
    ctx.fillStyle = rgba(C.ink, .85); ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace';
    if (ax < 90) { ctx.textAlign = "left"; ctx.fillText("today", ax + 10, ay + 22); } else { ctx.textAlign = "right"; ctx.fillText("today", ax - 12, ay + 20); }
  }
  function render(dt) {
    ctx.clearRect(0, 0, W, H);
    drawHist(easeOut(clamp(T / 1.3)));
    const t0 = T - LEAD;
    if (t0 > 0) {
      const ci = Math.floor(t0 / CYCLE);
      if (ci !== cycle) { if (cycle !== -1) { seed++; gen(); layerReady = false; } cycle = ci; }
      const tc = t0 - ci * CYCLE, g = easeInOut(clamp(tc / GROW)), fade = tc > HOLD ? 1 - easeInOut(clamp((tc - HOLD) / FADE)) : 1;
      if (g < 1) drawPaths(ctx, g, fade); else { if (!layerReady) cacheLayer(); blit(fade); }
      const bp = easeInOut(clamp((tc - BAND0) / (BAND1 - BAND0))); if (bp > 0) drawBand(bp, fade);
      if (tc > GROW * .75 && fade > 0) drawParts(dt, fade);
    }
    drawAnchor((T % 2.6) / 2.6);
  }
  function drawStatic() { if (!ready || !C) return; ctx.clearRect(0, 0, W, H); drawHist(1); if (!layerReady) cacheLayer(); blit(1); drawBand(1, 1); drawAnchor(-1); }
  function frame(now) { raf = requestAnimationFrame(frame); const dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now; T += dt; render(dt); }
  const running = () => motionOn && inView && !document.hidden && ready;
  function update() { if (running()) { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } } else { if (raf) { cancelAnimationFrame(raf); raf = 0; } drawStatic(); } }
  function recolor() { readColors(); if (paths.length) buildTints(); layerReady = false; if (!running()) drawStatic(); }
  readColors();
  new ResizeObserver(() => { size(); if (C) buildTints(); if (!running()) drawStatic(); }).observe(host);
  onVisible(host, v => { inView = v; update(); });
  document.addEventListener("visibilitychange", update);
  motionListeners.push(update); themeListeners.push(recolor);
  return { cvs };
}
const heroField = !ON_MAIN ? null : createField({ canvas: $("#field"), host: $(".hero"), x: .53, y: .6, mx: .12, gap: ".hero-gap", n: 150, nm: 70, parts: 20, label: true });
if (ON_MAIN) createField({ canvas: $("#field-close"), host: $("#close"), x: .5, y: .58, mx: .1, my: .8, n: 90, nm: 44, parts: 10, alpha: .62, spread: .24, seed: 31, label: false });
if (ON_MAIN) (() => {
  const hero = $(".hero"); let pm = 0;
  hero.addEventListener("pointermove", e => {
    if (pm) return;
    pm = requestAnimationFrame(() => {
      pm = 0; const r = hero.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      hero.style.setProperty("--mx", (e.clientX - r.left) + "px"); hero.style.setProperty("--my", (e.clientY - r.top) + "px");
      if (motionOn) heroField.cvs.style.transform = `translate3d(${(-px * 14).toFixed(1)}px,${(-py * 10).toFixed(1)}px,0)`;
    });
  });
  hero.addEventListener("pointerleave", () => { heroField.cvs.style.transform = ""; });
})();

/* ================= Sample portfolio (real NSE names, sample weights) ================= */
const HOLD = [
  { t: "HDFCBANK", name: "HDFC Bank", band: "Financials", idx: "NIFTY Bank", w: .15, b50: .95, bs: .95 },
  { t: "ICICIBANK", name: "ICICI Bank", band: "Financials", idx: "NIFTY Bank", w: .11, b50: 1.05, bs: 1.05 },
  { t: "SBIN", name: "State Bank of India", band: "Financials", idx: "NIFTY Bank", w: .06, b50: 1.25, bs: 1.2 },
  { t: "BAJFINANCE", name: "Bajaj Finance", band: "Financials", idx: "NIFTY Financial Services", w: .06, b50: 1.3, bs: 1.2 },
  { t: "INFY", name: "Infosys", band: "IT", idx: "NIFTY IT", w: .10, b50: .85, bs: 1.05 },
  { t: "TCS", name: "Tata Consultancy Services", band: "IT", idx: "NIFTY IT", w: .07, b50: .75, bs: .9 },
  { t: "HINDUNILVR", name: "Hindustan Unilever", band: "Consumer", idx: "NIFTY FMCG", w: .08, b50: .55, bs: 1 },
  { t: "MARUTI", name: "Maruti Suzuki", band: "Consumer", idx: "NIFTY Auto", w: .06, b50: .9, bs: 1 },
  { t: "SUNPHARMA", name: "Sun Pharma", band: "Pharma", idx: "NIFTY Pharma", w: .06, b50: .6, bs: 1 },
  { t: "RELIANCE", name: "Reliance Industries", band: "Energy", idx: "NIFTY Energy", w: .09, b50: 1.05, bs: 1 },
  { t: "NIFTYBEES", name: "Nifty 50 ETF", band: "Index fund", idx: "NIFTY 50", w: .16, b50: 1, bs: 1, etf: true }
];
const VALUE = 1000000;
const BANDS = ["Financials", "IT", "Consumer", "Pharma", "Energy", "Index fund"];
const bandW = BANDS.map(b => HOLD.filter(h => h.band === b).reduce((a, h) => a + h.w, 0));
const byBand = BANDS.map(b => HOLD.map((h, i) => ({ h, i })).filter(o => o.h.band === b));
const INDICES = ["NIFTY 50", "NIFTY Bank", "NIFTY IT", "NIFTY FMCG", "NIFTY Auto", "NIFTY Pharma", "NIFTY Energy"];
const LOOK = { "NIFTY Bank": .30, "NIFTY IT": .11, "NIFTY FMCG": .07, "NIFTY Auto": .07, "NIFTY Pharma": .04, "NIFTY Energy": .12 }; // approximate share of NIFTY 50
const hIndex = t => HOLD.findIndex(h => h.t === t);
const sensOf = (h, idx) => idx === "NIFTY 50" ? h.b50 : h.etf ? (LOOK[idx] || 0) : h.idx === idx ? h.bs : 0;
function scenario(idx, mv) { const r = HOLD.map(h => sensOf(h, idx) * mv), impact = HOLD.map((h, i) => VALUE * h.w * r[i]); return { r, impact, total: impact.reduce((a, b) => a + b, 0) }; }
const cr = v => { const a = Math.abs(v), s = v < 0 ? MINUS : ""; return a >= 1e7 ? `${s}₹${(a / 1e7).toFixed(a >= 1e8 ? 1 : 2).replace(/\.?0+$/, "")} Cr` : a >= 1e5 ? `${s}₹${Math.round(a / 1e5)} L` : inr(v); };
/* Sample buy lots for the tax answers (dates relative to today) */
const TAXLOTS = (() => {
  const now = new Date(), L = {
    INFY: { price: 1880, lots: [{ q: 120, p: 1420, m: 20 }, { q: 60, p: 1610, m: 7 }] },
    HDFCBANK: { price: 980, lots: [{ q: 400, p: 780, m: 26 }, { q: 150, p: 930, m: 5 }] },
    NIFTYBEES: { price: 292, lots: [{ q: 2000, p: 240, m: 36 }, { q: 800, p: 276, m: 9 }] }
  };
  Object.values(L).forEach(h => h.lots.forEach(l => { l.d = addMonths(now, -l.m); l.ltFrom = new Date(addMonths(l.d, 12).getTime() + 864e5); l.lt = now >= l.ltFrom; }));
  return L;
})();
function taxSale(t, qty, booked = 0) {
  const H = TAXLOTS[t]; let left = qty, cost = 0, lt = 0, st = 0; const taken = [];
  H.lots.forEach(l => { const k = Math.min(left, l.q); left -= k; taken.push(k); cost += k * l.p; const g = k * (H.price - l.p); if (l.lt) lt += g; else st += g; });
  const exLeft = Math.max(0, 125000 - booked), taxL = .125 * Math.max(0, lt - exLeft), taxS = .2 * Math.max(0, st);
  const i = H.lots.findIndex((l, j) => !l.lt && taken[j] > 0);
  return { proceeds: qty * H.price, cost, lt, st, taxL, taxS, total: taxL + taxS, taken, stLot: i >= 0 ? { k: taken[i], ltFrom: H.lots[i].ltFrom } : null, lots: H.lots };
}


/* ================= Line chart helper ================= */
function niceTicks(lo, hi, count) { const raw = (hi - lo) / count, mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag, step = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag; const out = []; for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push(+v.toFixed(6)); return out; }
function lineChart(box, series, opts) {
  box.innerHTML = "";
  const w = box.clientWidth, h = box.clientHeight; if (!w || !h) return null;
  const padL = opts.padL ?? 44, padR = opts.padR ?? 96, padT = 8, padB = 24, n = series[0].data.length;
  let lo = Infinity, hi = -Infinity; series.forEach(s => s.data.forEach(v => { if (v < lo) lo = v; if (v > hi) hi = v; }));
  const span = hi - lo || 1; lo -= span * .06; hi += span * .06;
  const X = i => padL + (i / (n - 1)) * (w - padL - padR), Y = v => padT + (1 - (v - lo) / (hi - lo)) * (h - padT - padB);
  const svg = sv("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": opts.label });
  if (opts.bands) opts.bands.forEach(([a, b]) => svg.appendChild(sv("rect", { class: "cash", x: X(a), y: padT, width: Math.max(1, X(b) - X(a)), height: h - padT - padB })));
  niceTicks(lo, hi, 4).forEach(t => { svg.appendChild(sv("line", { class: "grid-l", x1: padL, x2: w - padR, y1: Y(t), y2: Y(t) })); const tx = sv("text", { class: "axis-t", x: padL - 8, y: Y(t) + 4, "text-anchor": "end" }); tx.textContent = opts.fmtY(t); svg.appendChild(tx); });
  svg.appendChild(sv("line", { class: "axis", x1: padL, x2: w - padR, y1: h - padB, y2: h - padB }));
  let xt = opts.xTicks || []; while (xt.length > 2 && (w - padL - padR) / (xt.length - 1) < 64) xt = xt.filter((_, k) => k % 2 === 0 || k === xt.length - 1);
  xt.forEach(([i, label]) => { const tx = sv("text", { class: "axis-t", x: X(i), y: h - 6, "text-anchor": "middle" }); tx.textContent = label; svg.appendChild(tx); });
  const pathEls = series.map(s => { let d = ""; const step = opts.step || Math.max(1, Math.floor(n / (w * 1.5))); for (let i = 0; i < n; i += step) d += (i ? "L" : "M") + X(i).toFixed(1) + " " + Y(s.data[i]).toFixed(1); d += "L" + X(n - 1).toFixed(1) + " " + Y(s.data[n - 1]).toFixed(1); const p = sv("path", { class: s.cls, d }); svg.appendChild(p); return p; });
  const ends = series.map(s => ({ y: Y(s.data[n - 1]), s }));
  if (ends.length === 2 && Math.abs(ends[0].y - ends[1].y) < 16) { const mid = (ends[0].y + ends[1].y) / 2, up = ends[0].y <= ends[1].y ? 0 : 1; ends[up].y = mid - 8; ends[1 - up].y = mid + 8; }
  ends.forEach(e => { const t = sv("text", { class: "end-t", x: w - padR + 10, y: e.y + 4 }); t.textContent = e.s.endLabel; svg.appendChild(t); });
  const cross = sv("line", { class: "cross", y1: padT, y2: h - padB, opacity: 0 }); svg.appendChild(cross);
  const dots = series.map(s => { const c = sv("circle", { class: "cross-dot", r: 4, fill: s.cls === "ln-acc" ? "var(--accent)" : "var(--muted)", opacity: 0 }); svg.appendChild(c); return c; });
  const hit = sv("rect", { x: padL, y: 0, width: w - padL - padR, height: h, fill: "transparent" }); svg.appendChild(hit);
  hit.addEventListener("pointermove", e => { const r = svg.getBoundingClientRect(), i = Math.round(clamp((e.clientX - r.left - padL) / (w - padL - padR)) * (n - 1)); cross.setAttribute("x1", X(i)); cross.setAttribute("x2", X(i)); cross.setAttribute("opacity", 1); dots.forEach((c, k) => { c.setAttribute("cx", X(i)); c.setAttribute("cy", Y(series[k].data[i])); c.setAttribute("opacity", 1); }); showTip(opts.tip(i), e.clientX, e.clientY); });
  hit.addEventListener("pointerleave", () => { cross.setAttribute("opacity", 0); dots.forEach(c => c.setAttribute("opacity", 0)); hideTip(); });
  box.appendChild(svg);
  return { svg, pathEls };
}
const maxDD = arr => { let pk = arr[0], m = 0; for (const v of arr) { if (v > pk) pk = v; const d = v / pk - 1; if (d < m) m = d; } return m; };
const annRet = arr => Math.pow(arr[arr.length - 1] / arr[0], 252 / (arr.length - 1)) - 1;

/* ================= What-if lab ================= */
const Lab = !ON_MAIN ? NOOP : (() => {
  const map = $("#lab-map"), mv = $("#mv"), seg = $("#idx-seg");
  const st = { idx: "NIFTY Bank", mv: -.10 };
  const PRESETS = { bank: { idx: "NIFTY Bank", mv: -.10 }, mkt: { idx: "NIFTY 50", mv: -.15 }, it: { idx: "NIFTY IT", mv: .08 } };
  INDICES.forEach(i => { const b = el("button", null, i.replace("NIFTY ", "")); b.type = "button"; b.dataset.idx = i; b.setAttribute("aria-label", i); seg.appendChild(b); });
  seg.firstChild.textContent = "NIFTY 50";
  const blocks = HOLD.map(() => { const d = el("div", "blk show-in", "<span></span>"); map.appendChild(d); return d; });
  const ghosts = BANDS.map(() => { const d = el("div", "ghost"); map.appendChild(d); return d; });
  const labels = BANDS.map(() => { const d = el("div", "band-t", "<b></b><small></small>"); map.appendChild(d); return d; });
  let shown = VALUE, res = null;
  const ret = h => st.idx === "NIFTY 50" ? h.b50 * st.mv : h.etf ? (LOOK[st.idx] || 0) * st.mv : h.idx === st.idx ? h.bs * st.mv : 0;
  function tone(r) { const a = Math.abs(r); if (a < .0005) return "var(--blk-2)"; const p = Math.round(clamp(a / .25) * 58 + 8); return `color-mix(in oklab, ${r < 0 ? "var(--down)" : "var(--up)"} ${p}%, var(--blk-2))`; }
  function layoutMap() {
    const aw = map.clientWidth, ah = map.clientHeight; if (!aw || !ah || !res) return;
    const lw = aw < 520 ? 96 : 128, inner = aw - lw - 4, base = inner * .86, gap = 5, g2 = 3, total = ah - gap * (BANDS.length - 1);
    let y = 0;
    BANDS.forEach((bn, bi) => {
      const bh = total * bandW[bi], group = byBand[bi], avail = base - g2 * (group.length - 1);
      place(ghosts[bi], lw, y, base, bh);
      let x = lw, v0 = 0, v1 = 0;
      group.forEach(o => {
        const r = res.r[o.i], bw = Math.max(3, Math.min(inner - (x - lw), avail * (o.h.w / bandW[bi]) * (1 + r)));
        place(blocks[o.i], x, y, bw, bh); blocks[o.i].style.background = tone(r);
        const tw = o.h.t.length * 7.3 + 18;
        blocks[o.i].firstChild.textContent = bw > tw + 40 && bh > 24 && Math.abs(r) > .0005 ? `${o.h.t} ${pct(r, 0)}` : bw > tw && bh > 18 ? o.h.t : "";
        x += bw + g2; v0 += o.h.w; v1 += o.h.w * (1 + r);
      });
      const tall = bh > 34, ch = pct(v1 / v0 - 1); labels[bi].classList.toggle("one", !tall);
      labels[bi].firstChild.textContent = tall ? bn : `${bn} ${pct(v1 / v0 - 1, 0)}`;
      labels[bi].lastChild.textContent = tall ? `${Math.round(bandW[bi] * 100)}%, ${ch}` : "";
      place(labels[bi], 0, y, lw - 12, bh);
      y += bh + gap;
    });
  }
  const sens = h => st.idx === "NIFTY 50" ? h.b50 : h.etf ? (LOOK[st.idx] || 0) : h.idx === st.idx ? h.bs : 0;
  let rankIdx = null;
  function renderRank() {
    const box = $("#rank");
    if (rankIdx !== st.idx) {
      rankIdx = st.idx;
      const ord = HOLD.map((h, i) => i).sort((a, b) => HOLD[b].w * sens(HOLD[b]) - HOLD[a].w * sens(HOLD[a]) || HOLD[b].w - HOLD[a].w).slice(0, 6);
      box.innerHTML = ord.map(i => `<div class="rk" data-i="${i}"><b>${HOLD[i].t}</b><span class="rk-bar"><i></i></span><span class="num"></span></div>`).join("");
    }
    const maxImp = Math.max(...HOLD.map(h => h.w * sens(h))) * .3 * VALUE || 1;
    $$(".rk", box).forEach(row => { const i = +row.dataset.i, v = res.impact[i]; row.classList.toggle("is-zero", Math.abs(v) < .5); $("i", row).style.width = clamp(Math.abs(v) / maxImp) * 100 + "%"; $("i", row).style.background = v < 0 ? "var(--down)" : "var(--up)"; $(".num", row).textContent = Math.abs(v) < .5 ? "held flat" : `${v > 0 ? "+" : ""}${inr(v)}`; });
  }
  function tweenValue(to) {
    const from = shown, t0 = performance.now(), out = $("#ro-value");
    if (!motionOn) { shown = to; out.textContent = inr(to); return; }
    const step = now => { const k = easeOut(clamp((now - t0) / 500)); shown = from + (to - from) * k; out.textContent = inr(shown); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function setRange(input) { const min = +input.min, max = +input.max, v = +input.value, z = (Math.max(min, 0) - min) / (max - min) * 100, p = (v - min) / (max - min) * 100; input.style.setProperty("--a", Math.min(z, p) + "%"); input.style.setProperty("--b", Math.max(z, p) + "%"); }
  function render() {
    const r = HOLD.map(ret), impact = HOLD.map((h, i) => VALUE * h.w * r[i]), total = impact.reduce((a, b) => a + b, 0);
    res = { r, impact, total };
    mv.value = Math.round(st.mv * 100); setRange(mv);
    $("#mv-out").textContent = pct(st.mv, 0); $("#mv-name").textContent = `${st.idx} moves`;
    $$("button", seg).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.idx === st.idx)));
    const match = Object.entries(PRESETS).find(([, p]) => p.idx === st.idx && Math.abs(p.mv - st.mv) < 1e-9);
    $$("[data-preset]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.preset === "none" ? st.mv === 0 : !!match && match[0] === b.dataset.preset)));
    const b50 = HOLD.reduce((a, h) => a + h.w * h.b50, 0);
    if (st.idx === "NIFTY 50") {
      $("#idx-help").innerHTML = `Every holding moves with the market, by its own sensitivity.`;
      $("#expo-t").textContent = "Portfolio sensitivity to NIFTY 50"; $("#expo-v").textContent = b50.toFixed(2);
      $("#ex-d").style.width = (b50 / 1.5 * 100) + "%"; $("#ex-e").style.width = "0%";
      $("#expo-k").innerHTML = `<span>A 10% index move is roughly a ${(b50 * 10).toFixed(1)}% move for this portfolio.</span>`;
    } else {
      const direct = HOLD.filter(h => !h.etf && h.idx === st.idx).reduce((a, h) => a + h.w, 0), etfW = HOLD.find(h => h.etf).w, via = etfW * (LOOK[st.idx] || 0);
      const names = HOLD.filter(h => !h.etf && h.idx === st.idx).map(h => h.t);
      $("#idx-help").innerHTML = `${names.length ? `<b>${names.join(", ")}</b> move with ${st.idx}. ` : ""}NIFTYBEES moves too, since about ${Math.round(LOOK[st.idx] * 100)}% of NIFTY 50 is in it. The rest stays flat.`;
      $("#expo-t").textContent = `Your exposure to ${st.idx}`; $("#expo-v").textContent = pct(direct + via).replace("+", "");
      $("#ex-d").style.width = (direct * 100) + "%"; $("#ex-e").style.width = (via * 100) + "%";
      $("#expo-k").innerHTML = `<span><i class="ex-d"></i>Held directly <span class="num">${(direct * 100).toFixed(0)}%</span></span><span><i class="ex-e"></i>Inside NIFTYBEES <span class="num">${(via * 100).toFixed(1)}%</span></span>`;
    }
    tweenValue(VALUE + total);
    const dir = total < -.5 ? "down" : total > .5 ? "up" : "flat"; $("#ro-delta").dataset.dir = dir;
    $("#ro-delta-t").textContent = `${total > .5 ? "+" : ""}${inr(total)} (${pct(total / VALUE)})`;
    layoutMap(); renderRank();
    $("#lab-tbody").innerHTML = HOLD.map((h, i) => `<tr><td>${h.name} <span class="fine">${h.t}</span></td><td>${Math.round(h.w * 100)}%</td><td>${st.idx === "NIFTY 50" ? h.b50.toFixed(2) : h.etf ? (LOOK[st.idx] || 0).toFixed(2) : h.idx === st.idx ? h.bs.toFixed(2) : "0"}</td><td>${pct(r[i])}</td><td>${inr(impact[i])}</td></tr>`).join("") + `<tr><td><b>Portfolio</b></td><td>100%</td><td></td><td>${pct(total / VALUE)}</td><td>${inr(total)}</td></tr>`;
    clearTimeout(render.t); render.t = setTimeout(() => { $("#lab-live").textContent = `If ${st.idx} moves ${pct(st.mv, 0)}, this sample portfolio would change by ${pct(total / VALUE)}, or ${inr(total)}.`; }, 600);
  }
  mv.addEventListener("input", () => { st.mv = +mv.value / 100; render(); });
  seg.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; st.idx = b.dataset.idx; render(); });
  $$("[data-preset]").forEach(b => b.addEventListener("click", () => { const p = PRESETS[b.dataset.preset]; if (p) { st.idx = p.idx; st.mv = p.mv; } else st.mv = 0; render(); }));
  blocks.forEach((b, i) => { b.addEventListener("pointermove", e => showTip(`<b>${HOLD[i].name}</b>${HOLD[i].t}, weight <span class="num">${Math.round(HOLD[i].w * 100)}%</span><br>Change <span class="num">${pct(res.r[i])}</span>, impact <span class="num">${inr(res.impact[i])}</span>`, e.clientX, e.clientY)); b.addEventListener("pointerleave", hideTip); });
  render();
  return { resize: layoutMap, set(idx, mv) { st.idx = idx; st.mv = Math.round(mv * 100) / 100; render(); } };
})();

/* ================= Journey: illustrative forward simulation ================= */
const Journey = !ON_MAIN ? NOOP : (() => {
  const N = 400, MAXM = 25 * 12, START = VALUE, EX = 125000;
  const MIXES = [
    { short: "Your mix", tag: "You are here", name: "your current mix", mu: .11, sd: .175, what: "Keeps 38% in financials and 16% in the index fund.", trades: 0, tax: 0, plain: "Your holdings as they are today, with no changes." },
    { short: "Sample alternative", tag: "Illustrative mix", name: "an illustrative alternative mix", mu: .11, sd: .148, what: "Caps financials at 25% and adds weight to IT and FMCG.", trades: 7, tax: 2600, plain: "A sample comparison with assumed growth and smaller swings. This is not a personalised or optimised route." }
  ];
  const st = { goal: 1e7, years: 15, sip: 15000, mix: 0, inf: .05, real: false, net: false };
  const rng = mulberry32(2024), Z = Array.from({ length: N }, () => { const a = new Float32Array(MAXM); for (let m = 0; m < MAXM; m++) a[m] = gauss(rng); return a; });
  const chart = $("#jy-chart"), front = $("#jy-front"), seg = $("#jy-seg");
  let res = null, anim = 0, probShown = 0;
  MIXES.forEach((m, i) => { const b = el("button", null, m.short); b.type = "button"; b.dataset.i = i; seg.appendChild(b); });
  function simRaw(mix, years, sip) {
    const M = years * 12, sdm = mix.sd / Math.sqrt(12), mum = Math.log(1 + mix.mu) / 12 - sdm * sdm / 2;
    const v = new Float64Array(N).fill(START), col = new Float64Array(N), P = { p10: [START], p25: [START], p50: [START], p75: [START], p90: [START] }, S = Array.from({ length: 16 }, () => [START]);
    const q = f => col[Math.min(N - 1, Math.round(f * (N - 1)))];
    for (let m = 0; m < M; m++) {
      for (let i = 0; i < N; i++) v[i] = v[i] * Math.exp(mum + sdm * Z[i][m]) + sip;
      col.set(v); col.sort();
      P.p10.push(q(.1)); P.p25.push(q(.25)); P.p50.push(q(.5)); P.p75.push(q(.75)); P.p90.push(q(.9));
      for (let j = 0; j < 16; j++) S[j].push(v[j * 25]);
    }
    return { P, S, M, final: Float64Array.from(v), sip };
  }
  function adjust(R, goal) {
    const f = (x, m) => { if (st.net) { const g = x - (START + R.sip * m); if (g > EX) x -= (g - EX) * .125; } if (st.real) x /= Math.pow(1 + st.inf, m / 12); return x; };
    const P = {}; Object.keys(R.P).forEach(k => P[k] = R.P[k].map((x, m) => f(x, m)));
    const S = R.S.map(s => s.map((x, m) => f(x, m)));
    let hit = 0; for (let i = 0; i < N; i++) if (f(R.final[i], R.M) >= goal) hit++;
    return { P, S, M: R.M, reach: hit / N };
  }
  function draw(R) {
    chart.innerHTML = "";
    const w = chart.clientWidth, h = chart.clientHeight; if (!w || !h) return;
    const padL = 60, padR = 18, padT = 14, padB = 26, M = R.M;
    const yMax = Math.max(R.P.p90[M], st.goal) * 1.08;
    const X = m => padL + m / M * (w - padL - padR), Y = val => padT + (1 - val / yMax) * (h - padT - padB);
    const svg = sv("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": "Simulated range of portfolio values over time with the goal line" });
    niceTicks(0, yMax, 4).forEach(t => { svg.appendChild(sv("line", { class: "grid-l", x1: padL, x2: w - padR, y1: Y(t), y2: Y(t) })); const tx = sv("text", { class: "axis-t", x: padL - 8, y: Y(t) + 4, "text-anchor": "end" }); tx.textContent = t ? cr(t) : "₹0"; svg.appendChild(tx); });
    svg.appendChild(sv("line", { class: "axis", x1: padL, x2: w - padR, y1: h - padB, y2: h - padB }));
    const yr = new Date().getFullYear(), stepY = st.years > 15 ? 5 : st.years > 8 ? 3 : 2;
    for (let yv = 0; yv <= st.years; yv += stepY) { const tx = sv("text", { class: "axis-t", x: X(yv * 12), y: h - 6, "text-anchor": "middle" }); tx.textContent = yv ? String(yr + yv) : "Now"; svg.appendChild(tx); }
    const stp = Math.max(1, Math.floor(M / 160));
    const ptsOf = a => { let s = ""; for (let m = 0; m <= M; m += stp) s += `${X(m).toFixed(1)},${Y(a[m]).toFixed(1)} `; return s + `${X(M).toFixed(1)},${Y(a[M]).toFixed(1)}`; };
    const area = (lo, hi) => { let d = ""; for (let m = 0; m <= M; m += stp) d += (m ? "L" : "M") + X(m).toFixed(1) + " " + Y(hi[m]).toFixed(1); d += "L" + X(M).toFixed(1) + " " + Y(hi[M]).toFixed(1); for (let m = M; m >= 0; m -= stp) d += "L" + X(m).toFixed(1) + " " + Y(lo[m]).toFixed(1); d += "L" + X(0).toFixed(1) + " " + Y(lo[0]).toFixed(1) + "Z"; return d; };
    R.S.forEach(s => svg.appendChild(sv("polyline", { class: "ln-smp", points: ptsOf(s) })));
    svg.appendChild(sv("path", { class: "b90", d: area(R.P.p10, R.P.p90) }));
    svg.appendChild(sv("path", { class: "b50", d: area(R.P.p25, R.P.p75) }));
    svg.appendChild(sv("polyline", { class: "ln-med", points: ptsOf(R.P.p50) }));
    svg.appendChild(sv("line", { class: "ln-goal", x1: padL, x2: w - padR, y1: Y(st.goal), y2: Y(st.goal) }));
    const gt = sv("text", { class: "goal-t", x: padL + 8, y: Y(st.goal) - 7 }); gt.textContent = `Goal ${cr(st.goal)}`; svg.appendChild(gt);
    const cross = sv("line", { class: "cross", y1: padT, y2: h - padB, opacity: 0 }); svg.appendChild(cross);
    const hit = sv("rect", { x: padL, y: 0, width: w - padL - padR, height: h, fill: "transparent" }); svg.appendChild(hit);
    hit.addEventListener("pointermove", e => { const r = svg.getBoundingClientRect(), m = Math.round(clamp((e.clientX - r.left - padL) / (w - padL - padR)) * M); cross.setAttribute("x1", X(m)); cross.setAttribute("x2", X(m)); cross.setAttribute("opacity", 1); showTip(`<b>${m ? yr + Math.floor(m / 12) : "Now"}</b>Middle <span class="num">${cr(R.P.p50[m])}</span><br>Eight in ten between <span class="num">${cr(R.P.p10[m])}</span> and <span class="num">${cr(R.P.p90[m])}</span>`, e.clientX, e.clientY); });
    hit.addEventListener("pointerleave", () => { cross.setAttribute("opacity", 0); hideTip(); });
    chart.appendChild(svg);
  }
  function drawFront() {
    front.innerHTML = "";
    const w = front.clientWidth, h = front.clientHeight; if (!w || !h) return;
    const padL = 34, padR = 12, padT = 16, padB = 30, x0 = 8, x1 = 20, y0 = 7.5, y1 = 12.2;
    const X = v => padL + (v - x0) / (x1 - x0) * (w - padL - padR), Y = v => padT + (1 - (v - y0) / (y1 - y0)) * (h - padT - padB);
    const fr = v => 7.8 + 4.2 * (1 - Math.exp(-(v - 8) / 4.5));
    const svg = sv("svg", { viewBox: `0 0 ${w} ${h}` }), r = mulberry32(77);
    for (let i = 0; i < 64; i++) { const v = 9 + r() * 10; svg.appendChild(sv("circle", { class: "fr-c", cx: X(v), cy: Y(Math.max(y0 + .25, fr(v) - Math.abs(gauss(r)) * .75 - .08)), r: 2.2 })); }
    let d = ""; for (let v = 8.6; v <= 19.6; v += .25) d += (d ? "L" : "M") + X(v).toFixed(1) + " " + Y(fr(v)).toFixed(1);
    svg.appendChild(sv("path", { class: "fr-line", d }));
    const pts = MIXES.map(m => ({ x: X(m.sd * 100), y: Y(m.mu * 100) }));
    if (st.mix) { const a = pts[0], b = pts[st.mix]; svg.appendChild(sv("path", { class: "fr-move", d: `M${a.x} ${a.y}L${b.x} ${b.y}` })); }
    const LP = [{ dx: 0, dy: 21, a: "middle" }, { dx: 0, dy: -13, a: "middle" }];
    MIXES.forEach((m, i) => {
      const p = pts[i], on = i === st.mix, lp = LP[i];
      svg.appendChild(sv("circle", { class: `fr-opt${on ? " is-on" : ""}`, cx: p.x, cy: p.y, r: on ? 6.5 : 5 }));
      const t = sv("text", { class: `fr-t${on ? " is-on" : ""}`, x: p.x + lp.dx, y: p.y + lp.dy, "text-anchor": lp.a }); t.textContent = m.tag; svg.appendChild(t);
      const hc = sv("circle", { class: "fr-hit", cx: p.x, cy: p.y, r: 16 }); hc.addEventListener("click", () => { st.mix = i; update(); }); svg.appendChild(hc);
    });
    const ax = sv("text", { class: "fr-ax", x: w - padR, y: h - 8, "text-anchor": "end" }); ax.textContent = "Swings →"; svg.appendChild(ax);
    const ay = sv("text", { class: "fr-ax", x: 0, y: 0, transform: `translate(12 ${h - padB}) rotate(-90)` }); ay.textContent = "Expected growth →"; svg.appendChild(ay);
    front.appendChild(svg);
  }
  function setRange(input) { const p = (+input.value - +input.min) / (+input.max - +input.min) * 100; input.style.setProperty("--a", "0%"); input.style.setProperty("--b", p + "%"); }
  function update() {
    const prev = res; res = adjust(simRaw(MIXES[st.mix], st.years, st.sip), st.goal);
    ["jy-goal", "jy-years", "jy-sip", "jy-inf"].forEach(id => setRange($("#" + id)));
    $("#jy-goal-o").textContent = cr(st.goal); $("#jy-years-o").textContent = st.years; $("#jy-sip-o").textContent = inr(st.sip); $("#jy-inf-o").textContent = (st.inf * 100).toFixed(1) + "%";
    $("#jy-real").checked = st.real; $("#jy-net").checked = st.net;
    $$("button", seg).forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.i === st.mix)));
    const M = res.M, end = new Date().getFullYear() + st.years, mix = MIXES[st.mix], base = MIXES[0];
    $("#jy-lbl").textContent = `Simulated journeys that reach ${cr(st.goal)} by ${end}`;
    const to = Math.round(res.reach * 100), from = probShown, t0 = performance.now();
    const step = now => { const k = motionOn ? easeOut(clamp((now - t0) / 450)) : 1; probShown = Math.round(from + (to - from) * k); $("#jy-prob").textContent = probShown + "%"; if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
    $("#jy-sub").textContent = `${st.mix ? "Illustrative alternative mix" : "Sample current mix"}, from the ₹10,00,000 example portfolio${st.real ? ", in today’s rupees" : ""}${st.net ? ", after sample tax assumptions" : ""}.`;
    $("#jy-mid").textContent = cr(res.P.p50[M]); $("#jy-low").textContent = cr(res.P.p10[M]); $("#jy-in").textContent = cr(START + st.sip * M);
    $("#jy-units").textContent = st.real ? `today’s rupees, ${(st.inf * 100).toFixed(1)}% inflation` : "rupees of each year";
    $("#jy-formula").textContent = mix.plain;
    $("#jy-ass").textContent = `Assumed: about ${(mix.mu * 100).toFixed(1)}% growth a year, with yearly swings of about ${(mix.sd * 100).toFixed(1)}%.`;
    $("#jy-move").innerHTML = [["Illustrative trades", mix.trades ? String(mix.trades) : "None", mix.trades ? "in this sample comparison" : "no sample change"], ["Illustrative tax", inr(mix.tax), mix.tax ? "simplified example, not tax advice" : "nothing to sell"]].map(([k, a, b]) => `<div class="stat"><span>${k}</span><b>${a}</b><small>${b}</small></div>`).join("")
      + `<div class="stat wide"><span>What changes</span><b>${mix.what}</b><small>${st.mix ? `swings ${pct(mix.sd - base.sd)}, return ${Math.abs(mix.mu - base.mu) < 1e-9 ? "about the same" : pct(mix.mu - base.mu)}` : "no change"}</small></div>`;
    drawFront();
    cancelAnimationFrame(anim);
    if (prev && prev.M === res.M && motionOn) {
      const A = prev, B = res, keys = ["p10", "p25", "p50", "p75", "p90"], tt = performance.now();
      const frame = now => { const k = easeInOut(clamp((now - tt) / 520)); const R = { M, P: {}, S: B.S.map((s, j) => s.map((v, m) => A.S[j][m] + (v - A.S[j][m]) * k)) }; keys.forEach(key => R.P[key] = B.P[key].map((v, m) => A.P[key][m] + (v - A.P[key][m]) * k)); draw(R); if (k < 1) anim = requestAnimationFrame(frame); };
      anim = requestAnimationFrame(frame);
    } else draw(res);
    clearTimeout(update.t); update.t = setTimeout(() => { $("#jy-live").textContent = `${to}% of simulated journeys reach ${cr(st.goal)} by ${end} with ${mix.name}.`; }, 600);
  }
  let pend = 0; const sched = () => { if (pend) return; pend = requestAnimationFrame(() => { pend = 0; update(); }); };
  $("#jy-goal").addEventListener("input", e => { st.goal = +e.target.value * 1e5; sched(); });
  $("#jy-years").addEventListener("input", e => { st.years = +e.target.value; sched(); });
  $("#jy-sip").addEventListener("input", e => { st.sip = +e.target.value; sched(); });
  $("#jy-inf").addEventListener("input", e => { st.inf = +e.target.value / 100; st.real = true; sched(); });
  $("#jy-real").addEventListener("change", e => { st.real = e.target.checked; update(); });
  $("#jy-net").addEventListener("change", e => { st.net = e.target.checked; update(); });
  seg.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; st.mix = +b.dataset.i; update(); });
  update();
  themeListeners.push(() => { if (res) { draw(res); drawFront(); } });
  return {
    resize() { if (res) { draw(res); drawFront(); } },
    quick(goal, years, sip) { const R = simRaw(MIXES[0], years, sip); let hit = 0; for (let i = 0; i < N; i++) if (R.final[i] >= goal) hit++; return { reach: hit / N, P: R.P, M: R.M }; },
    set(o) { Object.assign(st, o); st.goal = clamp(st.goal, 25e5, 3e7); st.years = clamp(Math.round(st.years), 5, 25); st.sip = clamp(Math.round(st.sip / 1000) * 1000, 0, 50000); $("#jy-goal").value = Math.round(st.goal / 1e5 / 5) * 5; $("#jy-years").value = st.years; $("#jy-sip").value = st.sip; update(); }
  };
})();

/* ================= Build: describe an idea, backtest, walk forward ================= */
const Build = !ON_MAIN ? NOOP : (() => {
  const chart = $("#bt-chart"), statsBox = $("#bt-stats"), wf = $("#wf"), N = 1713, START = 200, COST = .001;
  const st = { seed: 11, rule: { type: "sma", a: 50, b: 200 }, cost: true, tax: false, wf: false };
  let px = [], cache = {}, rsiA = null, maxA = null, cur = null, shown = null, anim = 0, built = 0;
  const TYPE = { sma: "Moving-average cross", rsi: "RSI band", dip: "Buy the dip" };
  const GRID = { sma: [[10, 100], [10, 150], [10, 200], [20, 100], [20, 150], [20, 200], [50, 100], [50, 150], [50, 200]], rsi: [[25, 65], [25, 70], [25, 75], [30, 65], [30, 70], [30, 75], [35, 65], [35, 70], [35, 75]], dip: [[5, 10], [5, 15], [5, 20], [10, 10], [10, 15], [10, 20], [15, 10], [15, 15], [15, 20]] };
  const fmt = r => r.type === "dip" ? `${r.a}%/${r.b}%` : `${r.a}/${r.b}`;
  function genPrices(seed) { const r = mulberry32(seed * 104729), out = [100]; let left = 0, mu = 0, sg = .01; for (let t = 1; t < N; t++) { if (left <= 0) { const u = r(); if (u < .55) { mu = .0009; sg = .0095; } else if (u < .82) { mu = .0001; sg = .009; } else { mu = -.0013; sg = .017; } left = 70 + Math.floor(r() * 280); } left--; out.push(out[t - 1] * Math.exp(mu - sg * sg / 2 + sg * gauss(r))); } return out; }
  function prep() {
    cache = {};
    rsiA = new Float64Array(N).fill(NaN); let g = 0, l = 0;
    for (let t = 1; t < N; t++) { const d = px[t] - px[t - 1], up = Math.max(d, 0), dn = Math.max(-d, 0); if (t <= 14) { g += up / 14; l += dn / 14; if (t === 14) rsiA[t] = 100 - 100 / (1 + g / (l || 1e-9)); } else { g = (g * 13 + up) / 14; l = (l * 13 + dn) / 14; rsiA[t] = 100 - 100 / (1 + g / (l || 1e-9)); } }
    maxA = new Float64Array(N); for (let t = 0; t < N; t++) { let m = -Infinity; for (let k = Math.max(0, t - 59); k <= t; k++) if (px[k] > m) m = px[k]; maxA[t] = m; }
  }
  function sma(len) { if (cache[len]) return cache[len]; const a = new Float64Array(N).fill(NaN); let s = 0; for (let t = 0; t < N; t++) { s += px[t]; if (t >= len) s -= px[t - len]; if (t >= len - 1) a[t] = s / len; } return (cache[len] = a); }
  function decide(r, t, pos, entryPx) {
    if (r.type === "sma") return sma(r.a)[t - 1] > sma(r.b)[t - 1] ? 1 : 0;
    if (r.type === "rsi") { const v = rsiA[t - 1]; if (!(v >= 0)) return pos; return pos ? (v > r.b ? 0 : 1) : (v < r.a ? 1 : 0); }
    return pos ? (px[t - 1] >= entryPx * (1 + r.b / 100) ? 0 : 1) : (px[t - 1] <= (1 - r.a / 100) * maxA[t - 1] ? 1 : 0);
  }
  function run(r, cost, tax, a, b) {
    let eq = 1, bh = 1, pos = 0, trades = 0, inMkt = 0, entryEq = 1, entryT = 0, entryPx = 0, taxPaid = 0; const E = [1], B = [1], P = [];
    for (let t = a + 1; t <= b; t++) {
      const want = decide(r, t, pos, entryPx);
      if (want !== pos) {
        if (pos) { if (tax) { const g = eq - entryEq; if (g > 0) { const x = g * (t - entryT > 252 ? .125 : .2); eq -= x; taxPaid += x; } } if (cost) eq *= 1 - COST; pos = 0; }
        else { if (cost) eq *= 1 - COST; pos = 1; trades++; entryEq = eq; entryT = t; entryPx = px[t - 1]; }
      }
      const ret = px[t] / px[t - 1] - 1; eq *= 1 + pos * ret; bh *= 1 + ret; if (pos) inMkt++;
      E.push(eq); B.push(bh); P.push(pos);
    }
    return { E, B, P, trades, inMkt: inMkt / (b - a), taxPaid };
  }
  function walkForward() {
    const rows = [], grid = GRID[st.rule.type];
    for (let k = 0; k < 4; k++) {
      const tr0 = START + 252 * k, tr1 = tr0 + 504, te1 = tr1 + 252; let best = null;
      grid.forEach(([x, y]) => { const r = { type: st.rule.type, a: x, b: y }, o = run(r, st.cost, st.tax, tr0, tr1), v = o.E[o.E.length - 1]; if (!best || v > best.v) best = { r, v }; });
      const t = run(best.r, st.cost, st.tax, tr1, te1);
      rows.push({ tr0, tr1, te1, r: best.r, rule: t.E[t.E.length - 1] - 1, hold: t.B[t.B.length - 1] - 1 });
    }
    return rows;
  }
  const bandsFrom = P => { const out = []; let s = -1; P.forEach((p, i) => { if (!p && s < 0) s = i; if (p && s >= 0) { out.push([s, i]); s = -1; } }); if (s >= 0) out.push([s, P.length]); return out; };
  const n = v => `<b class="rn">${v}</b>`;
  function sentence(r) {
    if (r.type === "sma") return `Hold when the ${n(r.a + "-day")} average is above the ${n(r.b + "-day")} average. Otherwise, hold cash.`;
    if (r.type === "rsi") return `Buy when ${n("RSI 14")} drops below ${n(r.a)}. Sell when it rises above ${n(r.b)}.`;
    return `Buy after a ${n(r.a + "%")} fall from the 60-day high. Sell once the gain reaches ${n(r.b + "%")}.`;
  }
  const plain = r => sentence(r).replace(/<[^>]+>/g, "");
  function blocks(r) {
    const e = r.type === "sma" ? [`${r.a}-day above ${r.b}-day`, `${r.a}-day below ${r.b}-day`] : r.type === "rsi" ? [`RSI below ${r.a}`, `RSI above ${r.b}`] : [`${r.a}% under 60-day high`, `+${r.b}% from entry`];
    return [["Entry", e[0]], ["Exit", e[1]], ["Costs", st.cost ? "0.1% a trade" : "off", !st.cost], ["Tax", st.tax ? "20% short, 12.5% long" : "off", !st.tax]];
  }
  let btT = 0;
  function renderRule(animate) {
    if (animate && typeof kxOf === "function") { const v = kxOf("#bt-av"); if (v) { v.state("working"); clearTimeout(btT); btT = setTimeout(() => v.state("idle"), 1500); } }
    const box = $("#rule-text"), rb = $("#rblocks"), toks = sentence(st.rule).match(/<b class="rn">.*?<\/b>[.,]?|[^\s<]+/g) || [], my = ++built;
    box.innerHTML = ""; rb.innerHTML = "";
    const addBlocks = () => { rb.innerHTML = blocks(st.rule).map(([k, v, off], i) => `<span class="rb${off ? " off" : ""}" style="animation-delay:${animate ? i * 90 : 0}ms"><span>${k}</span><b>${esc(v)}</b></span>`).join(""); };
    if (!animate || !motionOn) { box.innerHTML = toks.join(" "); addBlocks(); return; }
    let i = 0; const step = () => { if (my !== built) return; if (i < toks.length) { box.appendChild(el("span", "tk", toks[i])); box.appendChild(document.createTextNode(" ")); i++; setTimeout(step, 55); } else addBlocks(); };
    step();
  }
  function renderRail() {
    const S = [["Rule written", true], ["Backtested with costs" + (st.tax ? " and tax" : ""), true], ["Walked forward", st.wf], ["Rehearse with virtual money", false, true]];
    $("#bt-rail").innerHTML = S.map(([t, done, next], i) => `<li class="${done ? "done" : ""}${next ? " next" : ""}"><i>${done ? "✓" : i + 1}</i><span>${t}${next ? "<small>next, in Saarth</small>" : ""}</span></li>`).join("");
  }
  function drawChart(E, B, bands) {
    const nn = E.length;
    lineChart(chart, [{ data: B.map(v => v * 1e5), cls: "ln-neu", endLabel: "Buy and hold" }, { data: E.map(v => v * 1e5), cls: "ln-acc", endLabel: "Rule" }], {
      label: "Growth of one lakh rupees for the rule and for buy and hold on synthetic prices", bands, padL: 52, padR: chart.clientWidth < 560 ? 88 : 104,
      fmtY: v => "₹" + (v >= 1e5 ? (v / 1e5).toFixed(v % 1e5 ? 1 : 0) + "L" : Math.round(v / 1000) + "k"),
      xTicks: Array.from({ length: 7 }, (_, i) => [Math.min(nn - 1, i * 252), i ? `Year ${i}` : "Start"]),
      tip: i => `<b>Year ${(i / 252).toFixed(1)}</b>Rule <span class="num">${inr(E[i] * 1e5)}</span><br>Buy and hold <span class="num">${inr(B[i] * 1e5)}</span><br>${cur.P[Math.max(0, i - 1)] ? "Rule invested" : "Rule in cash"}`
    });
  }
  function morph() {
    const bands = bandsFrom(cur.P);
    if (!shown || !motionOn) { shown = { E: cur.E.slice(), B: cur.B.slice() }; drawChart(shown.E, shown.B, bands); return; }
    const from = { E: shown.E.slice(), B: shown.B.slice() }, t0 = performance.now(); cancelAnimationFrame(anim);
    const step = now => { const k = easeInOut(clamp((now - t0) / 650)); for (let i = 0; i < cur.E.length; i++) { shown.E[i] = from.E[i] + (cur.E[i] - from.E[i]) * k; shown.B[i] = from.B[i] + (cur.B[i] - from.B[i]) * k; } drawChart(shown.E, shown.B, k < 1 ? [] : bands); if (k < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function renderStats() {
    const r = annRet(cur.E), Bl = cur.B[cur.B.length - 1], bFinal = st.tax && Bl > 1 ? 1 + (Bl - 1) * .875 : Bl, h = Math.pow(bFinal, 252 / (cur.B.length - 1)) - 1, dr = maxDD(cur.E), dh = maxDD(cur.B);
    statsBox.innerHTML = [["Rule, a year", pct(r), st.tax ? "after costs and tax" : st.cost ? "after costs" : "before costs"], ["Buy and hold, a year", pct(h), st.tax ? "after tax at the end" : "same prices"], ["Worst fall", pct(dr, 0), `hold: ${pct(dh, 0)}`], ["Trades", String(cur.trades), st.tax ? `${inr(cur.taxPaid * 1e5)} tax per ₹1 L` : st.cost ? "0.1% charged each" : "no costs"], ["Time invested", Math.round(cur.inMkt * 100) + "%", "rest in cash"]].map(([k, a, b]) => `<div class="stat"><span>${k}</span><b>${a}</b><small>${b}</small></div>`).join("");
    $("#bt-live").textContent = `On this made-up history the rule would have returned ${pct(r)} a year, against ${pct(h)} for buying and holding.`;
  }
  function renderWF() {
    const rows = cur.wf, beat = rows.filter(x => x.rule > x.hold).length, changes = rows.reduce((a, x, i) => a + (i && fmt(x.r) !== fmt(rows[i - 1].r) ? 1 : 0), 0);
    $("#wf-sum").textContent = `Walking forward on unseen data, the tuned rule beat buy and hold in ${beat} of 4 windows. The best setting changed ${changes} ${changes === 1 ? "time" : "times"}.`;
    const span = N - 1 - START, L = v => ((v - START) / span * 100).toFixed(2) + "%";
    $("#wf-rows").innerHTML = rows.map((x, k) => `<div class="wf-row"><span>Window ${k + 1}</span><span class="wf-track"><i class="wf-train" style="left:${L(x.tr0)};width:calc(${L(x.tr1)} - ${L(x.tr0)} - 2px)"></i><i class="wf-test${x.rule > x.hold ? " beat" : ""}" style="left:${L(x.tr1)};width:calc(${L(x.te1)} - ${L(x.tr1)})"></i></span><span class="num">${fmt(x.r)}: ${pct(x.rule)} vs ${pct(x.hold)}</span></div>`).join("");
  }
  function update(regen, animateRule) {
    if (regen) { px = genPrices(st.seed); prep(); }
    cur = run(st.rule, st.cost, st.tax, START, N - 1); cur.wf = walkForward();
    renderRule(animateRule); renderRail(); morph(); renderStats(); renderWF();
  }
  function parse(qRaw) {
    const q = qRaw.toLowerCase().replace(/(\d),(?=\d)/g, "$1");
    if (/\brsi\b/.test(q)) { const lo = +((q.match(/(?:below|under|<)\s*(\d+)/) || [])[1] || 30), hi = +((q.match(/(?:above|over|>)\s*(\d+)/) || [])[1] || 70); return { type: "rsi", a: clamp(lo, 5, 50), b: clamp(hi, 50, 95) }; }
    if (/golden cross/.test(q)) return { type: "sma", a: 50, b: 200 };
    const days = [...q.matchAll(/(\d+)\s*-?\s*(?:day|d\b|dma)/g)].map(m => +m[1]);
    if (days.length >= 2 || (days.length && /average|cross|moving/.test(q))) { const f = days.length >= 2 ? Math.min(days[0], days[1]) : days[0], s = days.length >= 2 ? Math.max(days[0], days[1]) : days[0] * 4; return { type: "sma", a: clamp(f, 5, 100), b: clamp(Math.max(s, f + 10), 20, 250) }; }
    if (/\b(fall|falls|drop|drops|dip|dips|down|crash|crashes)\b/.test(q) && /\b(buy|sell|after|when)\b/.test(q)) {
      const d = +((q.match(/(\d+)\s*%?\s*(?:fall|drop|dip|down|crash)/) || q.match(/(?:fall|falls|drop|drops|dip|dips|down)\D{0,12}?(\d+)/) || [])[1] || 10);
      const g = +((q.match(/(\d+)\s*%?\s*(?:gain|rise|profit|\bup\b)/) || q.match(/(?:gain|rises?|profit|\bup\b)\D{0,12}?(\d+)/) || [])[1] || 15);
      return { type: "dip", a: clamp(d, 3, 40), b: clamp(g, 3, 60) };
    }
    return null;
  }
  function load(r, animate) { st.rule = r; update(false, animate); }
  function tryBuild(text) {
    const r = parse(text), msg = $("#bt-msg");
    if (!r) { msg.textContent = "This browser-only demo recognises a few example rules. Try one of the examples."; return; }
    msg.textContent = `Rule type: ${TYPE[r.type]}.`; load(r, true);
  }
  $("#bt-form").addEventListener("submit", e => { e.preventDefault(); tryBuild($("#bt-q").value); });
  $$("#bt-ex .chip").forEach(b => b.addEventListener("click", () => { $("#bt-q").value = b.textContent; tryBuild(b.textContent); }));
  $("#bt-cost").addEventListener("change", e => { st.cost = e.target.checked; update(); });
  $("#bt-tax").addEventListener("change", e => { st.tax = e.target.checked; update(); });
  $("#bt-wf").addEventListener("change", e => { st.wf = e.target.checked; wf.classList.toggle("is-open", st.wf); renderRail(); });
  $("#bt-new").addEventListener("click", () => { st.seed++; update(true); });
  for (let s = 1; s < 300; s++) { px = genPrices(s); const g = Math.pow(px[N - 1] / px[START], 252 / (N - 1 - START)) - 1; if (g > .08 && g < .13) { st.seed = s; break; } }
  update(true, false);
  let seen = false;
  onVisible($("#bt"), v => { if (v && !seen) { seen = true; renderRule(true); } }, "-20% 0px");
  const redraw = () => { if (shown) drawChart(shown.E, shown.B, bandsFrom(cur.P)); };
  themeListeners.push(redraw);
  return {
    resize: redraw, parse, fmt, plain, TYPE,
    quick(r) { const o = run(r, true, false, START, N - 1); return { E: o.E, B: o.B, rc: annRet(o.E), bc: annRet(o.B), trades: o.trades }; },
    load, setTax(v) { st.tax = v; $("#bt-tax").checked = v; update(); }
  };
})();

/* ================= Features page: two journeys side by side, integrations, 3D wheel ================= */
const Features = ON_MAIN ? NOOP : (() => {
  const L = "live", X = "exp", N = "next";
  const ROWS = [
    [{ cat: "Integrations", t: "Bring it all in", d: "Every account, however you hold it, in one place.", items: [["Read-only Kite snapshot over MCP", "Zerodha through its own MCP server. Saarth reads holdings and never places orders.", L], ["Console and Dhan files", "CSV or XLSX exports, checked row by row before they’re saved.", L], ["Any CSV, by hand, or a screenshot", "For any broker, with screenshots read using your own AI key.", L], ["Other brokers’ MCP servers and a Saarth API", "More connectors, and a way to send data in from your own tools.", N]] },
     { cat: "Ideas", t: "Describe it", d: "Start from an idea you heard, read or had.", items: [["Rule templates", "Moving averages, RSI, MACD, Bollinger bands and 52-week breakouts.", L], ["Evidence check", "Replay a simple rule on any stock page, straight from Grow.", L], ["Plain-words rules", "Describe an idea, and Chakra writes the rule.", N]] }],
    [{ cat: "Portfolio management", t: "See it clearly", d: "What your accounts add up to, and where the risk really sits.", items: [["One combined view", "The same stock in two accounts becomes one line.", L], ["Allocation and concentration", "By holding, sector and market cap, with index look-through.", L], ["Sleeves", "Group money by intent, such as retirement or a home.", L], ["Risk against benchmarks", "Volatility, beta and drawdown against NIFTY 50 and other indices.", L], ["Discover, watchlists and rotation", "Research stocks and see which holdings are leading or lagging.", L]] },
     { cat: "Backtests", t: "Test it honestly", d: "What the rule would have done, with the frictions left in.", items: [["Backtests with costs", "Returns, drawdowns and a full trade log, with charges included.", L], ["Compare rules", "Put rules side by side on the same history.", L], ["Capital gains tax", "Short- and long-term tax charged on every exit.", N]] }],
    [{ cat: "Scenarios", t: "Ask what if", d: "Turn a worry into a number before you act.", items: [["Index and sector moves", "Move NIFTY 50, NIFTY Bank or any sector and see who feels it.", L], ["Custom shocks", "Stack market, sector and single-stock moves together.", L], ["Tax before you sell", "Short- and long-term gains, lot by lot, under India’s rules.", L]] },
     { cat: "Walk-forward", t: "Check it on unseen data", d: "An idea that only works on the history it was tuned on isn’t much of an idea.", items: [["Rolling windows", "Tune on one stretch of history, then test on the next.", L], ["Setting stability", "See whether the best setting keeps changing.", N]] }],
    [{ cat: "Goal planning", t: "Plan the route", d: "Explore possible journeys and the assumptions behind them.", items: [["Goal journeys", "Simulated journeys toward a goal you set; not a prediction.", L], ["Portfolio optimisation", "Compare allocations under chosen risk and return assumptions.", X], ["Personalised route", "A future connection between your holdings, constraints and a proposed mix.", N], ["Today’s rupees and after tax", "Journeys adjusted for inflation and capital gains tax.", N]] },
     { cat: "Paper trading", t: "Rehearse with virtual money", d: "Run a rule forward before it touches real money.", items: [["Virtual capital", "A paper account that follows your rule on new prices.", X], ["No broker orders", "Virtual orders stay inside Saarth; connected brokers are read-only.", L]] }],
    [{ cat: "Journal", t: "Keep the reason", d: "Every decision, dated, with the why behind it.", items: [["Decision journal with reviews", "The thesis, what would change your mind, and a date to review it.", L], ["Trades become draft entries", "Imports turn into journal entries that ask you why.", L], ["Chakra learns your habits", "Proposed: patterns from your own trades, presented as rules to review.", N]] },
     { cat: "Decide", t: "Bring it home", d: "A tested idea becomes a reasoned decision in Grow.", items: [["Save evidence to your journal", "Keep the test next to the decision it informed.", L], ["Rules into sleeves", "Attach a tested rule to the part of your portfolio it’s for.", N]] }]
  ];
  const ST = { live: ["live", "Live"], exp: ["exp", "Experimental"], next: ["next", "Next"] };
  const list = $("#dt-list"), fill = $("#dt-fill"), dt = $("#dt"), page = $("#features");
  const card = (s, side) => `<div class="dt-card ${side}"><div class="dt-top"><span class="cat">${esc(s.cat)}</span><span class="trk">${side === "grow" ? "Grow" : "Build"}</span></div><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p><ul>${s.items.map(([b, d, k]) => `<li><div><b>${esc(b)}</b><span class="d">${esc(d)}</span></div><span class="st ${ST[k][0]}"><i></i>${ST[k][1]}</span></li>`).join("")}</ul></div>`;
  list.innerHTML = ROWS.map(([g, b], i) => `<li class="dt-row"><span class="dt-node" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>${card(g, "grow")}${card(b, "build")}</li>`).join("");
  const rio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }), { rootMargin: "0px 0px -18% 0px" });
  $$(".dt-row", list).forEach(r => { if (!motionOn) r.classList.add("in"); rio.observe(r); });
  motionListeners.push(() => { if (!motionOn) $$(".dt-row", list).forEach(r => r.classList.add("in")); });
  function progress() {
    if (page.hidden) return;
    const r = dt.getBoundingClientRect(), line = innerHeight * .6;
    fill.style.height = (motionOn ? clamp((line - r.top - 84) / Math.max(1, r.height - 84)) * 100 : 100) + "%";
  }
  function wires() {
    const svg = $("#wires"), map = $("#imap");
    if (page.hidden || innerWidth <= 900) { svg.innerHTML = ""; return; }
    const R = map.getBoundingClientRect(), hub = $("#hub").getBoundingClientRect(), hx0 = hub.left - R.left, hx1 = hub.right - R.left, hy = hub.top - R.top + hub.height / 2, f = v => v.toFixed(1);
    svg.setAttribute("viewBox", `0 0 ${R.width} ${R.height}`);
    let d = "";
    $$("#src .src-i").forEach(n => { const b = n.getBoundingClientRect(), x = b.right - R.left, y = b.top - R.top + b.height / 2, mx = (x + hx0) / 2; d += `<path class="wire ${n.dataset.w}" d="M${f(x)} ${f(y)}C${f(mx)} ${f(y)} ${f(mx)} ${f(hy)} ${f(hx0 + 4)} ${f(hy)}"/>`; });
    $$("#outs .out-i").forEach(n => { const b = n.getBoundingClientRect(), x = b.left - R.left, y = b.top - R.top + b.height / 2, mx = (hx1 + x) / 2; d += `<path class="wire flow" d="M${f(hx1 - 4)} ${f(hy)}C${f(mx)} ${f(hy)} ${f(mx)} ${f(y)} ${f(x)} ${f(y)}"/>`; });
    svg.innerHTML = d;
  }
  const hero = $("#f-top"); let pm = 0;
  hero.addEventListener("pointermove", e => { if (pm || !motionOn) return; pm = requestAnimationFrame(() => { pm = 0; const r = hero.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5, v = kxOf("#k3d"); if (v) v.look(px * .7, py * .7); }); });
  return { progress, wires, show() { requestAnimationFrame(() => { wires(); progress(); }); } };
})();

/* ================= Chakra: a chat whose every answer comes from the Saarth FAQ ================= */
const ChakraApp = (() => {
  const launch = $("#ck-launch"), panel = $("#ck-panel"), thread = $("#ck-thread"), sugg = $("#ck-sugg"), form = $("#ck-form"), input = $("#ck-q");
  // links inside answers: scroll here, or go to the other page when the section lives there
  const goTo = (id, fn) => () => { const t = document.querySelector(id); if (!t) { location.href = OTHER + id; return; } fn && fn(); if (innerWidth < 1100) close(false); setTimeout(() => t.scrollIntoView({ behavior: motionOn ? "smooth" : "auto", block: "start" }), 120); };
  const CK_STATUS = { idle: "Answers from the Saarth FAQ", listening: "Listening…", thinking: "Thinking…", working: "Searching the FAQ…", answering: "Answering…", unsure: "Not sure, so it won’t guess" };
  const setCk = k => { [kxOf("#ck-launch [data-chakra]"), kxOf(".ck-av")].forEach(v => v && v.state(k)); const st = $("#ck-status"); if (st) st.textContent = CK_STATUS[k]; };
  let lt = 0;
  const norm = q => q.toLowerCase().replace(/(\d),(?=\d)/g, "$1").replace(/[’‘]/g, "'");
  function idxOf(q, raw = q) { if (/bank/.test(q)) return "NIFTY Bank"; if (/nifty it|\bit (stocks?|sector|shares|companies)|\btech|software/.test(q) || /\bIT\b/.test(raw)) return "NIFTY IT"; if (/fmcg|consumer goods/.test(q)) return "NIFTY FMCG"; if (/\bauto|\bcars?\b/.test(q)) return "NIFTY Auto"; if (/pharma|healthcare/.test(q)) return "NIFTY Pharma"; if (/energy|\boil\b/.test(q)) return "NIFTY Energy"; if (/nifty|sensex|market|index/.test(q)) return "NIFTY 50"; return null; }
  const UPW = /\b(rise|rises|rose|rally|rallies|up|gain|gains|jump|jumps|climb|climbs)\b/, DOWNW = /\b(fall|falls|fell|drop|drops|dropped|crash|crashes|down|dip|dips|slump|slumps|lose|loses)\b|[-−]\s*\d/;
  function moveOf(q) { const m = q.match(/(\d+(?:\.\d+)?)\s*(%|percent)/); if (!m) return null; let v = +m[1] / 100; if (!UPW.test(q) || DOWNW.test(q)) v = -v; return clamp(v, -.3, .2); }
  const SECT = { "NIFTY Bank": "bank stocks", "NIFTY IT": "IT stocks", "NIFTY FMCG": "FMCG stocks", "NIFTY Auto": "auto stocks", "NIFTY Pharma": "pharma stocks", "NIFTY Energy": "energy stocks" };
  // the FAQ's what-if method, applied to the move someone asks about
  function scenarioAnswer(idx, mv) {
    const R = scenario(idx, mv), direct = HOLD.filter(h => !h.etf && h.idx === idx).reduce((a, h) => a + h.w, 0), hid = idx === "NIFTY 50" ? 0 : (LOOK[idx] || 0) * HOLD.find(h => h.etf).w;
    const why = idx === "NIFTY 50" ? "Almost every holding moves with the NIFTY 50, some by more than the index and some by less." : `That’s ${Math.round(direct * 100)}% held directly in ${SECT[idx]}${hid ? `, plus another ${(hid * 100).toFixed(1)}% inside the NIFTY 50 index fund` : ""}.`;
    return `In the sample portfolio, if ${idx} ${mv < 0 ? "fell" : "rose"} ${+(Math.abs(mv) * 100).toFixed(1)}%, the ₹10,00,000 would ${R.total < 0 ? "lose" : "gain"} about ${inr(Math.abs(R.total))}, or ${Math.abs(R.total / VALUE * 100).toFixed(1)}%. ${why}`;
  }
  const STOCKS = [["HDFCBANK", /hdfc/], ["ICICIBANK", /icici/], ["SBIN", /\bsbi|sbin|state bank/], ["BAJFINANCE", /bajaj/], ["INFY", /\binfy\b|infosys/], ["TCS", /\btcs\b|tata consultancy/], ["HINDUNILVR", /\bhul\b|hindunilvr|unilever/], ["MARUTI", /maruti/], ["SUNPHARMA", /sun ?pharma/], ["RELIANCE", /reliance|\bril\b/]];
  const stockOf = q => { if (/\bstocks\b|sector/.test(q)) return null; const m = STOCKS.find(([, re]) => re.test(q)); return m ? m[0] : null; };
  function stockAnswer(t, mv) {
    const h = HOLD[hIndex(t)], pos = VALUE * h.w, d = pos * Math.abs(mv);
    return `In the sample portfolio, ${t} is ${inr(pos)} of the ₹10,00,000. If it ${mv < 0 ? "fell" : "rose"} ${+(Math.abs(mv) * 100).toFixed(1)}%, that’s about ${inr(d)}, or ${(d / VALUE * 100).toFixed(1)}% of the whole portfolio. Its small share inside the index fund is left out.`;
  }
  // deterministic intents run before retrieval: advice and predictions get the fixed "no",
  // a question with a move in it gets the FAQ's what-if method, and a short follow-up reuses the last one
  const ADVICE = /\b(should|shall|must) (i|we)\b.*\b(buy|sell|invest|hold|exit|add|book)\b|\b(good|right|best) (time )?(to )?(buy|sell|invest)\b|\bgood buy\b|\b(tips?|best stocks?|which stocks?|multibagger)\b/;
  const PREDICT = /\b(will|going to|gonna)\b.*\b(go up|go down|rise|fall|crash|recover|move|be)\b|\btarget price\b|\bprice target\b|\bnext (week|month|year)\b/;
  let last = null;
  function intent(q, raw) {
    if (ADVICE.test(q)) return { faq: "advice" };
    let mv = moveOf(q); const stock = stockOf(q), idx = stock ? null : idxOf(q, raw), verb = UPW.test(q) || DOWNW.test(q) || /\bmove|moves|moved\b/.test(q), pre = PREDICT.test(q) && !/\bwhat if\b/.test(q);
    if (mv != null && (stock || idx || verb)) return { stock, idx: stock ? null : idx || "NIFTY 50", mv, pre };
    if (pre) return { faq: "predict" };
    if (last && last.id === "whatif" && (mv != null || idx || stock) && q.split(/\s+/).length <= 6) { if (mv != null && !verb) mv = Math.sign(last.mv) * Math.abs(mv); const s2 = stock || (idx ? null : last.stock); return { stock: s2, idx: s2 ? null : idx || last.idx || "NIFTY 50", mv: mv ?? last.mv }; }
    return null;
  }
  const UNITS = { crore: 1e7, crores: 1e7, cr: 1e7, lakh: 1e5, lakhs: 1e5, lac: 1e5, l: 1e5, k: 1e3, thousand: 1e3 };
  const amounts = q => [...q.matchAll(/(\d+(?:\.\d+)?)\s*(crores?|cr|lakhs?|lac|l|k|thousand)?\b/g)].map(m => ({ v: +m[1] * (UNITS[m[2]] || 1), unit: m[2] || "", i: m.index, end: m.index + m[0].length }));
  const FAQ = [
    { id: "diff", s: "top", q: "How is Saarth different from my broker’s app?", a: "Your broker’s app is built for placing orders. Saarth is built for understanding. It combines your accounts, asks what if, tests ideas and keeps your reasons, and it can’t place orders at all.", k: "different difference broker app compare why saarth zerodha kite groww" },
    { id: "whatif", s: "what-if", q: "If bank stocks fell 10% tomorrow, what would it mean for me?", a: "In the sample portfolio, a 10% fall in NIFTY Bank takes about ₹37,800 off ₹10,00,000, or 3.8%. That’s 32% held directly in banks, plus another 4.8% hidden inside the NIFTY 50 index fund. With your own holdings, Saarth works this out for you.", k: "what if fall falls drop crash bank banks nifty index sector market move worry happen tomorrow lose", go: ["Show me in What if", "#what-if", () => Lab.set("NIFTY Bank", -.1)],
      extra(q) { const mv = moveOf(q); if (mv == null) return null; const idx = idxOf(q) || "NIFTY 50", R = scenario(idx, mv); return { line: `For your numbers: if ${idx} moved ${pct(mv, 0)}, the sample portfolio would change by ${R.total > .5 ? "+" : ""}${inr(R.total)}, or ${pct(R.total / VALUE)}.`, go: ["Show me this move", "#what-if", () => Lab.set(idx, mv)] }; } },
    { id: "whatif-how", s: "what-if", q: "How does Saarth work out a what-if?", a: "Each holding moves by its sensitivity to the index you move, and an index fund moves by its share of that sector. It’s plain arithmetic, and you can check it line by line under “See the numbers”.", k: "how calculate calculation work out sensitivity beta method math maths scenario check" },
    { id: "hidden", s: "what-if", q: "How much of my money is really in banks?", a: "More than your holdings list suggests. Saarth looks through index funds: about 30% of NIFTY 50 is banks, so a NIFTY 50 fund adds to your bank exposure. In the sample, it’s 32% held directly plus 4.8% through NIFTYBEES, so 36.8% in all.", k: "how much exposure exposed hidden index fund etf niftybees look through concentration banks concentrated really" },
    { id: "journey", s: "journey", q: "Where could my money be in fifteen years?", a: "Nobody can say for sure, so Saarth shows the range. It simulates hundreds of possible journeys from what you have and what you add each month. In the sample, about half of them reach ₹1 crore in fifteen years with ₹15,000 a month.", k: "future years goal crore lakh reach retire retirement journey monthly sip where could money be target plan", go: ["Show me the journey", "#journey", () => Journey.set({ goal: 1e7, years: 15, sip: 15000 })],
      extra(q) { const A = amounts(q), gA = A.find(a => /cr|lakh|lac|^l$/.test(a.unit)) || A.find(a => a.v >= 1e6); if (!gA) return null; const ym = q.match(/(\d+)\s*(years?|yrs?)/), years = clamp(ym ? +ym[1] : 15, 5, 25), sA = A.find(a => a !== gA && /^(a month|per month|every month|monthly|month|sip|pm)/.test(q.slice(a.end).trim())) || A.find(a => a !== gA && a.v >= 500 && a.v <= 2e5 && !(ym && a.i === ym.index)), sip = clamp(sA ? sA.v : 15000, 0, 50000), goal = clamp(gA.v, 25e5, 3e7), R = Journey.quick(goal, years, sip); return { line: `For your numbers: adding ${inr(sip)} a month for ${years} years, about ${Math.round(R.reach * 100)}% of simulated journeys reach ${cr(goal)}.`, go: ["Show me this journey", "#journey", () => Journey.set({ goal, years, sip })] }; } },
    { id: "route", s: "journey", q: "What is the alternative mix on this page?", a: "It is an illustrative comparison using sample holdings and assumptions. It is not a personalised or AI-optimised route. Saarth also has portfolio-optimisation tools, but this page does not run them on your holdings.", k: "route optimise optimisation optimize optimization better mix markowitz swings rebalance allocation improve", go: ["See the example", "#journey"] },
    { id: "infl", s: "journey", q: "Does the example account for inflation and tax?", a: "The browser demo can show simplified inflation and tax assumptions. Those switches are illustrative, not a personalised calculation or tax advice. Check the app for the available planning tools.", k: "inflation rupees real value purchasing power after tax journey" },
    { id: "tax", s: "journey", q: "Is the tax shown here my actual liability?", a: "No. Tax figures on this page use simplified sample assumptions. Your actual liability depends on your transaction history and current rules; consult a qualified professional when needed.", k: "tax taxes capital gain gains stcg ltcg short term long exemption sell selling lot lots fifo" },
    { id: "build", s: "build", q: "I heard about a strategy in a video. Can I test it?", a: "Yes, if you can express it with the available rule templates. Saarth can backtest a rule on historical prices with transaction costs and show walk-forward checks. The plain-language input on this page is a browser-only concept demo, not the app’s rule builder.", k: "strategy strategies video reel youtube test backtest backtesting idea rule try works heard", go: ["Show me Build", "#build"] },
    { id: "walk", s: "build", q: "What is a walk-forward check?", a: "It tunes a rule on one stretch of history, then tests it on the next stretch it has never seen, window after window. An idea that only works on the data it was tuned on shows up straight away.", k: "walk forward unseen out sample overfit overfitting tuned windows check" },
    { id: "ready", s: "build", q: "Is Build ready to use?", a: "Build is experimental. It’s for testing ideas, not trading them, and its results describe the past under stated assumptions.", k: "build ready experimental beta available released" },
    { id: "paper", s: "build", q: "Can I practise without real money?", a: "The experimental paper-trading area uses virtual capital and virtual buy/sell controls. It does not place orders through a connected broker.", k: "paper practise practice virtual money simulate demo without real" },
    { id: "trader", s: "grow-build", q: "Do I have to become a trader to use Saarth?", a: "No. Grow is about understanding what you own. Build is an optional place to test rule-based ideas and rehearse with virtual money; connected brokers remain read-only.", k: "trader trading active day grow build difference need become" },
    { id: "why", s: "journal", q: "Why did I buy that stock? Will I remember?", a: "Use the decision journal to record your reason and a review date. The Chakra exchange shown here is a scripted concept demo of a possible future assistant, not an automatic journal feature in the app.", k: "journal remember why reason note diary record decision bought buy", go: ["Show me the journal concept", "#journal"] },
    { id: "ai", s: "journal", q: "Is Chakra an AI that decides for me?", a: "No. This website’s Chakra chat answers from a fixed FAQ, and its journal conversation is a scripted concept demo. The proposed product direction is to surface evidence for your review, never to recommend a buy or sell.", k: "chakra ai decide decides decision bot robot automatic intelligent who artificial" },
    { id: "learn", s: "journal", q: "How does Chakra learn my habits?", a: "It does not do that in the app today. The scripted demo illustrates a future idea: show possible patterns from your decisions as readable rules that you could review before keeping.", k: "learn learns habits rules pattern patterns behaviour behavior how" },
    { id: "apps", s: "portfolio", q: "How many apps does it take to see everything I own?", a: "One. Bring in Zerodha (Console files or a read-only Kite snapshot), Dhan, any CSV, or add holdings by hand. Saarth combines the accounts, so the same stock held in two places becomes one line.", k: "apps accounts combine combined consolidate everything one view many", go: ["Show me", "#portfolio"] },
    { id: "mf", s: "portfolio", q: "Does Saarth support mutual funds?", a: "Today Saarth focuses on listed shares and ETFs. Mutual funds are on the list of what’s next.", k: "mutual fund funds mf cas statement" },
    { id: "brokers", s: "f-integrations", q: "Which brokers can I bring in?", a: "Zerodha, through a read-only Kite snapshot or Console files, and Dhan, through its statement files. Any other broker works through a CSV or by hand, and more brokers’ own connectors are next.", k: "broker brokers zerodha dhan kite import connect upstox groww angel which", go: ["Show me integrations", "#f-integrations"] },
    { id: "mcp", s: "f-integrations", q: "What does MCP mean here?", a: "MCP, the Model Context Protocol, is a standard way for apps to talk to a service’s own connector. Saarth uses a broker’s MCP server to read your holdings, and only to read them.", k: "mcp protocol connector api kite model context server" },
    { id: "key", s: "f-integrations", q: "Do I need my own AI key?", a: "Only for optional AI-assisted features in the app, such as reading an account screenshot. The Chakra journal interaction on this page is scripted and does not use your key.", k: "ai key openai api own byok need" },
    { id: "gb", s: "f-timeline", q: "What’s the difference between Grow and Build?", a: "Grow is about what you already own: bringing it in, seeing it clearly, asking what if and planning ahead. Build is about what you might do next: turning an idea into a rule and testing it honestly before it touches real money.", k: "grow build difference between workspace workspaces two" },
    { id: "status", s: "f-timeline", q: "What do Live, Experimental and Next mean?", a: "Live means implemented in the current app, not necessarily publicly launched. Experimental is available for testing and may change. Next describes planned work, not a release promise.", k: "live experimental next status roadmap coming soon" },
    { id: "advice", s: "principles", q: "Does Saarth tell me what to buy or sell?", a: "No. Saarth shows evidence, ranges and trade-offs. The decision, and the reason for it, stay yours.", k: "buy sell tips tip recommend recommendation recommendations advice advise advisor investment stock pick picks should sebi" },
    { id: "orders", s: "principles", q: "Can Saarth place trades on my account?", a: "No. Broker connections are read-only. Saarth reads holdings to analyse them and can’t place orders.", k: "orders order place trade trades execute account read only access behalf automatically" },
    { id: "predict", s: "principles", q: "Can Saarth predict the market?", a: "No. Scenarios, simulations and backtests show ranges under assumptions you can see. They’re research, not forecasts.", k: "predict prediction forecast forecasts future market tomorrow guess" },
    { id: "safe", s: "principles", q: "How is my data handled?", a: "Connected broker access is read-only. The app uses a protected session cookie, and account-data controls are available in Settings. Review the product’s privacy information before importing sensitive data.", k: "safe data privacy private secure security delete remove store stored" },
    { id: "real", s: "principles", q: "Are the numbers on this page real?", a: "The portfolio is a sample with real NSE names, and the price histories are made up. They show how the tools work. They aren’t results or forecasts.", k: "real numbers sample fake demo synthetic data figures" },
    { id: "name", s: "meaning", q: "What does Saarth mean?", a: "Saarth means purposeful. The name also echoes sārathi, the charioteer who keeps a journey on course. Chakra is its wheel.", k: "saarth meaning name mean sarathi charioteer chakra wheel konark" },
    { id: "free", s: "close", q: "Is Saarth free?", a: "Public access and pricing have not been announced. Please check the app when it opens for the current availability and terms.", k: "free cost price pricing pay paid plan plans subscription charge money" },
    { id: "start", s: "close", q: "How do I get started?", a: "The separate Saarth site is not published yet. This website’s interactive examples run locally in your browser and do not create an account.", k: "start started begin sign signup login open account how" },
    { id: "phone", s: "top", q: "Can I use Saarth on my phone?", a: "Yes. Saarth runs in your phone’s browser, and every view is built to work on a small screen.", k: "phone mobile app android iphone ios" },
    { id: "more", s: "close", q: "Where can I learn more?", a: "The Quant Lab’s YouTube channel explains the ideas behind Saarth. Courses are coming, and the blog is being prepared.", k: "learn youtube videos course courses blog read more" }
  ];
  // retrieval: a small keyword index, no generation
  const STOP = new Set("a an the is are am i me my mine you your it its of to in on for and or with what whats how do does did can could would should will be if this that there here about from at by as so any some much get got".split(" "));
  const stem = w => w.length > 3 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w;
  const tok = s => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter(w => w && !STOP.has(w)).map(stem);
  const IDX = FAQ.map(f => ({ f, k: new Set(tok(f.k)), q: new Set(tok(f.q)), a: new Set(tok(f.a)) }));
  const VOCAB = [...new Set(IDX.flatMap(x => [...x.k, ...x.q]))];
  function near(a, b, max) { if (Math.abs(a.length - b.length) > max) return false; let prev = [...Array(b.length + 1).keys()]; for (let i = 1; i <= a.length; i++) { const cur = [i]; let lo = i; for (let j = 1; j <= b.length; j++) { cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); lo = Math.min(lo, cur[j]); } if (lo > max) return false; prev = cur; } return prev[b.length] <= max; }
  const fix = w => VOCAB.includes(w) || w.length < 5 || /\d/.test(w) ? w : VOCAB.find(v => v[0] === w[0] && near(w, v, w.length >= 8 ? 2 : 1)) || w;
  function search(q) {
    const t = tok(q).map(fix); if (!t.length) return [];
    return IDX.map(x => { let hit = 0; const sc = t.reduce((a, w) => { const m = x.k.has(w) || x.q.has(w); if (m) hit++; return a + (x.k.has(w) ? 3 : 0) + (x.q.has(w) ? 2 : 0) + (x.a.has(w) ? .5 : 0); }, 0) / Math.sqrt(t.length); return { f: x.f, s: hit / t.length >= .5 ? sc : sc * .4, cover: hit / t.length }; }).sort((a, b) => b.s - a.s);
  }
  const SEC_DEFAULT = ["diff", "whatif", "journey", "advice"];
  let ctx = "top", busy = false, greeted = false; const asked = new Set();
  const ratio = new Map();
  const sio = new IntersectionObserver(es => { es.forEach(e => ratio.set(e.target.id, e.intersectionRatio)); let best = "top", br = .1; ratio.forEach((r, id) => { if (r > br) { br = r; best = id; } }); if (best !== ctx) { ctx = best; if (!panel.hidden) renderSugg(); } }, { threshold: [0, .1, .25, .4, .6, .8] });
  [...new Set(FAQ.map(f => f.s))].forEach(id => { const n = document.getElementById(id); if (n) sio.observe(n); });
  const byId = id => FAQ.find(f => f.id === id);
  function suggestions() { let l = FAQ.filter(f => f.s === ctx && !asked.has(f.id)); if (l.length < 2) l = l.concat(SEC_DEFAULT.map(byId).filter(f => !asked.has(f.id) && !l.includes(f))); return l.slice(0, 3); }
  function renderSugg() { sugg.innerHTML = ""; suggestions().forEach(f => { const b = el("button", "chip", esc(f.q)); b.type = "button"; b.addEventListener("click", () => ask(f.q)); sugg.appendChild(b); }); }
  function msg(html, cls) { const m = el("div", "msg " + cls, html); thread.appendChild(m); thread.scrollTo({ top: thread.scrollHeight, behavior: motionOn ? "smooth" : "auto" }); return m; }
  function typing(ms, then) { if (!motionOn) { then(); return; } const t = el("div", "typing", "<i></i><i></i><i></i>"); thread.appendChild(t); thread.scrollTop = thread.scrollHeight; setTimeout(() => { t.remove(); then(); }, ms); }
  function stream(node, text, done) { if (!motionOn) { node.textContent = text; done(); return; } let i = 0; const iv = setInterval(() => { i = Math.min(text.length, i + 3); node.textContent = text.slice(0, i); thread.scrollTop = thread.scrollHeight; if (i >= text.length) { clearInterval(iv); done(); } }, 14); }
  const linkBtn = (label, fn) => { const b = el("button", "lnk", `${esc(label)} <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5"/></svg>`); b.type = "button"; b.addEventListener("click", fn); return b; };
  function ask(raw) {
    const q = raw.trim(); if (!q || busy) return; busy = true; input.value = "";
    msg(esc(q), "me"); clearTimeout(lt); setCk("thinking");
    const nq = norm(q), it = intent(nq, q); let res = search(nq), top = res[0];
    if (it) { top = { f: byId(it.faq || "whatif-how"), s: 9 }; res = [top, ...res.filter(r => r.f !== top.f && (it.faq || !/^whatif/.test(r.f.id)))]; }
    const mvq = it && !it.faq ? it : null;
    typing(700, () => {
      const m = msg('<p class="ck-a"></p>', "owl-m"), p = $(".ck-a", m);
      if (!top || top.s < 2.5) {
        setCk("unsure"); lt = setTimeout(() => setCk("idle"), 2600);
        stream(p, "I don’t have a written answer for that yet, and I won’t guess. These are the closest questions I can answer:", () => { const w = el("div", "ck-rel"); res.slice(0, 3).forEach(r => { const b = el("button", "chip", esc(r.f.q)); b.type = "button"; b.addEventListener("click", () => ask(r.f.q)); w.appendChild(b); }); m.appendChild(w); busy = false; renderSugg(); });
        return;
      }
      const f = top.f; asked.add(f.id);
      const ex = !it && f.extra ? f.extra(nq) : null;
      last = mvq ? { id: "whatif", idx: mvq.idx, stock: mvq.stock, mv: mvq.mv } : { id: f.id };
      if (mvq) asked.add("whatif");
      const text = mvq ? (mvq.pre ? "Nobody can say whether it will. If it did: " : "") + (mvq.stock ? stockAnswer(mvq.stock, mvq.mv) : scenarioAnswer(mvq.idx, mvq.mv)) : f.a;
      setCk(mvq || ex ? "working" : "answering"); if (mvq || ex) lt = setTimeout(() => setCk("answering"), 650);
      stream(p, text, () => {
        if (ex) m.appendChild(el("p", "ck-x", esc(ex.line)));
        const g = mvq ? (mvq.stock ? ["See the sample portfolio", "#what-if"] : ["Show me this move", "#what-if", () => Lab.set(mvq.idx, mvq.mv)]) : ex ? ex.go : f.go;
        const foot = el("div", "ck-foot2"); foot.appendChild(el("span", "ck-src", mvq ? `Worked out with the method in the FAQ: ${esc(f.q)}` : `From the FAQ: ${esc(f.q)}`));
        if (g) foot.appendChild(linkBtn(g[0], goTo(g[1], g[2])));
        m.appendChild(foot);
        const rel = res.slice(1).filter(r => r.s > .9 && !asked.has(r.f.id)).slice(0, 2);
        if (rel.length) { const w = el("div", "ck-rel"); w.appendChild(el("span", "ck-rel-h", "Related")); rel.forEach(r => { const b = el("button", "chip", esc(r.f.q)); b.type = "button"; b.addEventListener("click", () => ask(r.f.q)); w.appendChild(b); }); m.appendChild(w); }
        busy = false; renderSugg(); clearTimeout(lt); lt = setTimeout(() => setCk("idle"), 900);
      });
    });
  }
  function open(prefill) {
    panel.hidden = false; launch.setAttribute("aria-expanded", "true"); launch.classList.add("is-open");
    if (!greeted) { greeted = true; msg("Hi, I’m Chakra. Every answer I give comes from Saarth’s FAQ, written and checked by The Quant Lab team. Ask in your own words, like “What if IT falls 15%?”, or pick a question below.", "owl-m"); }
    renderSugg(); if (prefill) ask(prefill); else setTimeout(() => input.focus({ preventScroll: true }), 60);
  }
  function close(refocus = true) { clearTimeout(lt); setCk("idle"); panel.hidden = true; launch.setAttribute("aria-expanded", "false"); launch.classList.remove("is-open"); if (refocus) launch.focus({ preventScroll: true }); }
  launch.addEventListener("click", () => panel.hidden ? open() : close());
  $("#ck-close").addEventListener("click", () => close());
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !panel.hidden) close(); });
  form.addEventListener("submit", e => { e.preventDefault(); ask(input.value); });
  input.addEventListener("input", () => { if (busy) return; clearTimeout(lt); setCk(input.value.trim() ? "listening" : "idle"); lt = setTimeout(() => { if (!busy) setCk("idle"); }, 1600); });
  $$("[data-open-chakra]").forEach(b => b.addEventListener("click", () => open(b.dataset.ask || "")));
  setTimeout(() => launch.classList.remove("is-away"), 1200);
  return { onScroll() {}, open, search };
})();

/* ================= Anchor: stairs ================= */
if (ON_MAIN) (() => {
  const steps = $$("#stairs li"); let i = -1, timer = 0, vis = false;
  const setAll = on => steps.forEach(s => s.classList.toggle("is-on", on));
  function tick() {
    i++;
    if (i < steps.length) { steps[i].classList.add("is-on"); timer = setTimeout(tick, 900); }
    else { timer = setTimeout(() => { setAll(false); i = -1; timer = setTimeout(tick, 900); }, 2600); }
  }
  function sync() { clearTimeout(timer); if (!motionOn) { setAll(true); return; } if (vis) { setAll(false); i = -1; timer = setTimeout(tick, 400); } }
  onVisible($("#anchor"), v => { vis = v; sync(); }, "-10% 0px");
  motionListeners.push(sync);
})();

/* ================= Chakra: scripted concept demo ================= */
if (ON_MAIN) (() => {
  const thread = $("#thread"), replies = $("#owl-replies"), form = $("#owl-form"), input = $("#owl-text"), list = $("#jr-list"), rules = $("#rules");
  const now = new Date(), ago = d => { const x = new Date(now); x.setDate(x.getDate() - d); return x; };
  $("#ex-review").textContent = `Review on ${fmtDate(addMonths(now, 3))}`;
  const TRADES = [
    { title: "Sold 20 INFY", line: `You sold <b>20 INFY</b> on ${fmtDate(ago(2))} in your Zerodha account.`, chip: "SELL 20 INFY", tags: ["#IT", "#trim"], replies: ["Rebalancing my IT exposure", "It had run up a lot", "Needed the money"],
      rule: { text: "When an IT holding rises about 15% in three months, you trim around a fifth of it.", seen: 3, of: 3, ev: ["Sep 2026: INFY +16%, sold 20 of 100", "Nov 2025: TCS +14%, sold 10 of 45", "Mar 2025: INFY +17%, sold 15 of 80"] } },
    { title: "Bought 15 HDFCBANK", line: `You bought <b>15 HDFCBANK</b> on ${fmtDate(ago(1))} in your Dhan account.`, chip: "BUY 15 HDFCBANK", tags: ["#banks", "#add"], replies: ["It fell and I wanted more", "Adding to a long-term holding", "Following my plan"],
      rule: { text: "When a bank you own falls about 10% from its high, you add to it.", seen: 2, of: 3, ev: ["Sep 2026: HDFCBANK −11% from high, bought 15", "Jan 2026: ICICIBANK −10% from high, bought 10", "Jul 2025: HDFCBANK −9% from high, held"], miss: 2 } },
    { title: "₹5,000 into NIFTYBEES", line: `Your monthly <b>₹5,000</b> went into NIFTYBEES on ${fmtDate(ago(0))}, a week after NIFTY 50 fell 8%.`, chip: "SIP ₹5,000 NIFTYBEES", tags: ["#index", "#monthly"], replies: ["It’s my monthly plan", "Falls don’t change the plan", "Keeping it simple"],
      rule: { text: "You keep your monthly ₹5,000 going, even after the market falls 8% or more.", seen: 5, of: 5, ev: ["Sep 2026: NIFTY 50 −8%, SIP continued", "Jun 2026: NIFTY 50 −9%, SIP continued", "Mar 2026: NIFTY 50 −11%, SIP continued", "Nov 2025: NIFTY 50 −8%, SIP continued", "Aug 2025: NIFTY 50 −10%, SIP continued"] } }
  ];
  let k = 0, started = false, busy = false, ruleN = 1, count = 1, reasons = 18;
  // the dial: each logged reason is a comet; each kept rule becomes a planet, and the sun warms as it learns
  const ruleTexts = ["You trim any single stock once it grows past 16% of your portfolio."];
  let learnT = 0;
  const av = k => { const v = kxOf("#jr-av"); v && v.state(k); };
  function renderWheel(change) {
    const d = kxOf("#chakra-dial"), w = kxOf("#rules-wheel");
    [d, w].forEach(v => v && v.set({ beads: reasons, lit: count }));
    if (change === true && d) d.event("reason");
    if (change === "rule") { [d, w].forEach(v => v && v.state("learned")); clearTimeout(learnT); learnT = setTimeout(() => [d, w].forEach(v => v && v.state("idle")), 2600); }
    $("#dial-beads").textContent = reasons; $("#dial-rules").textContent = count; $("#dial-rules-l").textContent = count === 1 ? "rule kept" : "rules kept";
    $("#rules-count").textContent = `${count} sample ${count === 1 ? "rule" : "rules"} in this demo. Each one you keep settles into orbit.`;
  }
  $("#chakra-dial").addEventListener("kx-hover", e => { const r = e.detail; $("#dial-hover").textContent = r >= 0 && ruleTexts[r] ? `Rule ${String(r + 1).padStart(2, "0")}: ${ruleTexts[r]}` : "Hover a planet to read its rule."; });
  renderWheel(false);
  const later = (fn, ms) => { if (!motionOn) { fn(); return; } setTimeout(fn, ms); };
  const toBottom = () => { thread.scrollTo({ top: thread.scrollHeight, behavior: motionOn ? "smooth" : "auto" }); };
  function say(html, cls = "owl-m") { const m = el("div", "msg " + cls, html); thread.appendChild(m); toBottom(); return m; }
  function typing(ms, then) { if (!motionOn) { then(); return; } const t = el("div", "typing", "<i></i><i></i><i></i>"); thread.appendChild(t); toBottom(); later(() => { t.remove(); then(); }, ms); }
  function setReplies(items) { replies.innerHTML = ""; items.forEach(([label, fn]) => { const b = el("button", "chip", esc(label)); b.type = "button"; b.addEventListener("click", fn); replies.appendChild(b); }); }
  const dots = (s, n) => `<span class="ev-dots" aria-hidden="true">${Array.from({ length: n }, (_, i) => `<i class="${i < s ? "on" : ""}"></i>`).join("")}</span>`;
  function start() {
    busy = true; thread.innerHTML = ""; setReplies([]); form.hidden = false; const T = TRADES[k % TRADES.length]; av("thinking");
    typing(700, () => { say(`Sample activity for this concept demo.<div class="trade"><i></i>${T.chip}</div>`); typing(800, () => { say(`${T.line} Want to note why? One line is enough.`); setReplies(T.replies.map(r => [r, () => answer(r)])); busy = false; av("listening"); }); });
  }
  function tagsFor(text, T) { const t = text.toLowerCase(), out = [...T.tags]; if (/rebalanc/.test(t)) out.push("#rebalance"); if (/plan|monthly/.test(t)) out.push("#plan"); if (/money|cash|need/.test(t)) out.push("#cash-need"); if (/fell|fall/.test(t)) out.push("#dip"); if (/run up|ran/.test(t)) out.push("#after-rise"); return [...new Set(out)].slice(0, 4); }
  function answer(text) {
    if (busy || !text.trim()) return; busy = true; const T = TRADES[k % TRADES.length], tags = tagsFor(text, T), review = addMonths(now, 3);
    say(esc(text), "me"); setReplies([]); input.value = ""; form.hidden = true;
    typing(800, () => {
      say(`Added to this page’s sample journal with ${tags.join(" ")}. Nothing here is saved to your account.`);
      reasons = Math.min(72, reasons + 1); renderWheel(true); av("working");
      const card = el("article", "entry is-new", `<div class="entry-top"><span>${fmtDate(now)}</span><span class="badge">Sample entry</span></div><h4>${esc(T.title)}</h4><dl><div><dt>Why</dt><dd>${esc(text)}</dd></div></dl><div class="etags">${tags.map(t => `<span>${esc(t)}</span>`).join("")}</div><span class="review"><i></i>Illustrative review on ${fmtDate(review)}</span>`);
      list.prepend(card); while (list.children.length > 3) list.lastChild.remove();
      typing(1100, () => {
        const R = T.rule; av("answering"); setTimeout(() => av("idle"), 1800);
        say(`I noticed a pattern in how you invest.<div class="proposal"><p class="rc-text">${esc(R.text)}</p><div class="rc-ev">${dots(R.seen, R.of)}Seen ${R.seen} of ${R.of} times</div><ul>${R.ev.map((e, i) => `<li class="${R.miss === i ? "miss" : ""}">${esc(e)}</li>`).join("")}</ul></div>Keep it as one of your rules? You can edit it later.`);
        setReplies([["Keep as my rule", () => keep(R)], ["That’s not me", () => reject()]]);
        busy = false;
      });
    });
  }
  function keep(R) {
    if (busy) return; busy = true; say("Keep as my rule", "me"); setReplies([]); ruleN++;
    typing(700, () => {
      say("Added to this page’s sample rules. This is a scripted example, not a rule in your Saarth account."); ruleTexts.push(R.text); av("learned"); setTimeout(() => av("idle"), 2600);
      const c = el("article", "rule-card is-new", `<div class="rc-top"><span class="rc-tag"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><path d="M2 7h10M7 2l5 5-5 5"/></svg>Sample rule ${String(ruleN).padStart(2, "0")}</span><span class="badge">Added in demo</span></div><p class="rc-text">${esc(R.text)}</p><div class="rc-ev">${dots(R.seen, R.of)}Illustrative examples</div><div class="rc-foot"><details class="rc-why"><summary>Why this sample suggests it</summary><ul>${R.ev.map(e => `<li>${esc(e)}</li>`).join("")}</ul></details><a class="rc-test" href="#build">Explore the Build demo <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 9 9 3M4 3h5v5"/></svg></a></div>`);
      rules.prepend(c); while (rules.children.length > 2) rules.lastChild.remove();
      count = Math.min(6, count + 1); renderWheel("rule");
      next();
    });
  }
  function reject() {
    if (busy) return; busy = true; say("That’s not me", "me"); setReplies([]);
    typing(700, () => { say("Understood. The sample journal entry stays on this page until you leave or reload."); next(); });
  }
  function next() { setReplies([["Try another trade", () => { k++; start(); }]]); busy = false; }
  form.addEventListener("submit", e => { e.preventDefault(); answer(input.value); });
  onVisible($("#owl"), v => { if (v && !started) { started = true; start(); } }, "-15% 0px");
})();

/* ================= Portfolio views ================= */
const Views = !ON_MAIN ? NOOP : (() => {
  const panel = $("#vw"), map = $("#vw-map"), cap = $("#vw-cap"), tabs = $$(".vw-tabs button");
  const ACCTS = ["Zerodha", "Dhan", "CSV import"];
  const POS = [["HDFCBANK", 0, .09], ["INFY", 0, .10], ["TCS", 0, .07], ["RELIANCE", 0, .09], ["NIFTYBEES", 0, .10], ["HDFCBANK", 1, .06], ["ICICIBANK", 1, .11], ["SBIN", 1, .06], ["BAJFINANCE", 1, .06], ["MARUTI", 1, .06], ["HINDUNILVR", 2, .08], ["SUNPHARMA", 2, .06], ["NIFTYBEES", 2, .06]].map(([t, a, w]) => ({ t, a, w, h: HOLD[hIndex(t)] }));
  const acctW = ACCTS.map((_, a) => POS.filter(p => p.a === a).reduce((s, p) => s + p.w, 0));
  const order = HOLD.map((h, i) => i).sort((a, b) => HOLD[b].w - HOLD[a].w);
  const blocks = POS.map(p => { const d = el("div", "blk", `<span>${p.t}</span>`); map.appendChild(d); return d; });
  const acctL = ACCTS.map((a, i) => { const d = el("div", "lbl", `<b>${a}</b><small class="num">${Math.round(acctW[i] * 100)}% of total</small>`); map.appendChild(d); return d; });
  const rowL = HOLD.map(h => { const accts = [...new Set(POS.filter(p => p.t === h.t).map(p => ACCTS[p.a]))]; const d = el("div", "lbl", `<b>${h.t}</b><small>${accts.join(" + ")}</small>`); map.appendChild(d); return d; });
  const rowP = HOLD.map(h => { const d = el("div", "lbl lbl-pct", `${Math.round(h.w * 100)}%`); map.appendChild(d); return d; });
  const bandL = BANDS.map((b, i) => { const d = el("div", "lbl", `<b>${b}</b><small class="num">${Math.round(bandW[i] * 100)}%</small>`); map.appendChild(d); return d; });
  const CAPS = [
    "Three accounts in three apps. Each column is one account, sized by value.",
    "Combined into one list. HDFCBANK and NIFTYBEES were split across accounts. Together they are 31% of the portfolio.",
    "By sector, 38% sits in financials, and roughly 5% more comes through the index ETF.",
    "Against NIFTY 50: return, volatility, beta and worst fall on a synthetic three-year history."
  ];
  let state = -1, auto = 0, userPicked = false, vis = false, drawn = false;
  const series = (() => { for (let s = 1; s < 400; s++) { const r = mulberry32(s * 131), n = 757, bm = [100], pf = [100], rm = [], rp = []; for (let t = 1; t < n; t++) { const a = .00042 + .0088 * gauss(r), b = .00006 + .94 * a + .0066 * gauss(r); rm.push(a); rp.push(b); bm.push(bm[t - 1] * (1 + a)); pf.push(pf[t - 1] * (1 + b)); } const mean = x => x.reduce((q, z) => q + z, 0) / x.length, mm = mean(rm), mp = mean(rp); let cov = 0, vm = 0, vp = 0; for (let i = 0; i < rm.length; i++) { cov += (rm[i] - mm) * (rp[i] - mp); vm += (rm[i] - mm) ** 2; vp += (rp[i] - mp) ** 2; } const beta = cov / vm, st = { retP: annRet(pf), retM: annRet(bm), volP: Math.sqrt(vp / (rp.length - 1) * 252), volM: Math.sqrt(vm / (rm.length - 1) * 252), beta, ddP: maxDD(pf), ddM: maxDD(bm) }; if (st.retP > .08 && st.retP < .17 && st.retM > .07 && st.retM < .14 && st.ddP < st.ddM && beta > .9 && beta < 1.02) return { bm, pf, st }; } })();
  $("#vw-stats").innerHTML = [["Return a year", pct(series.st.retP), pct(series.st.retM)], ["Volatility", (series.st.volP * 100).toFixed(1) + "%", (series.st.volM * 100).toFixed(1) + "%"], ["Beta", series.st.beta.toFixed(2), "1.00"], ["Worst fall", pct(series.st.ddP), pct(series.st.ddM)]].map(([k, a, b]) => `<div class="stat"><span>${k}</span><b>${a}</b><small>NIFTY 50 ${b}</small></div>`).join("");
  function drawChart(animate) {
    const c = lineChart($("#vw-svg"), [{ data: series.bm, cls: "ln-neu", endLabel: "NIFTY 50" }, { data: series.pf, cls: "ln-acc", endLabel: "Portfolio" }], { label: "Synthetic three-year growth of the sample portfolio compared with NIFTY 50", fmtY: v => v.toFixed(0), padL: 36, padR: 78, step: 5, xTicks: [[0, "Start"], [252, "Year 1"], [504, "Year 2"], [756, "Year 3"]], tip: i => `<b>Day ${i}</b>Portfolio <span class="num">${series.pf[i].toFixed(1)}</span><br>NIFTY 50 <span class="num">${series.bm[i].toFixed(1)}</span><br><span class="fine">Synthetic, starting at 100</span>` });
    if (c && animate && motionOn) c.pathEls.forEach((p, k) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.getBoundingClientRect(); p.style.transition = `stroke-dashoffset 1.6s cubic-bezier(.2,.75,.1,1) ${.45 + k * .15}s`; p.style.strokeDashoffset = 0; });
    drawn = true;
  }
  function layout(s, force) {
    if (s === state && !force) return;
    const entering = s === 3 && state !== 3; state = s; panel.dataset.state = s;
    tabs.forEach((b, i) => { b.setAttribute("aria-selected", String(i === s)); b.tabIndex = i === s ? 0 : -1; });
    cap.textContent = CAPS[s];
    const aw = map.clientWidth, ah = map.clientHeight; if (!aw || !ah) return;
    [...acctL, ...rowL, ...rowP, ...bandL].forEach(l => l.classList.remove("is-on", "is-dim", "one"));
    blocks.forEach(b => b.classList.remove("show-in"));
    if (s === 0) {
      const gap = 10, cw = (aw - gap * 2) / 3, top = 40, avail = ah - top, g2 = 3;
      ACCTS.forEach((_, a) => {
        let y = top; const items = POS.map((p, i) => ({ p, i })).filter(o => o.p.a === a), scale = (avail - g2 * 4) / .45;
        place(acctL[a], a * (cw + gap), 0, cw, 34); acctL[a].classList.add("is-on");
        items.forEach(o => { const bh = o.p.w * scale; place(blocks[o.i], a * (cw + gap), y, cw, bh); blocks[o.i].dataset.tone = "base"; blocks[o.i].firstChild.textContent = `${o.p.t} ${Math.round(o.p.w * 100)}%`; blocks[o.i].classList.toggle("show-in", bh > 20 && cw > 90); y += bh + g2; });
      });
    } else if (s === 1) {
      const rowH = ah / HOLD.length, lw = Math.min(170, aw * .38), maxBar = aw - lw - 48, bh = clamp(rowH * .5, 8, 18);
      order.forEach((hi, r) => {
        const h = HOLD[hi], y = r * rowH; let x = lw;
        POS.forEach((p, i) => { if (p.t !== h.t) return; const bw = p.w / .16 * maxBar; place(blocks[i], x, y + (rowH - bh) / 2, bw - 2, bh); blocks[i].dataset.tone = POS.filter(q => q.t === h.t).length > 1 ? "accent" : "base"; x += bw; });
        place(rowL[hi], 0, y, lw - 12, rowH); rowL[hi].classList.add("is-on");
        place(rowP[hi], x + 8, y, 44, rowH); rowP[hi].classList.add("is-on");
      });
    } else if (s === 2) {
      const lw = Math.min(140, aw * .3), gap = 4, g2 = 3, total = ah - gap * (BANDS.length - 1), inner = aw - lw;
      let y = 0;
      BANDS.forEach((bn, bi) => {
        const bh = total * bandW[bi], items = POS.map((p, i) => ({ p, i })).filter(o => o.p.h.band === bn), avail = inner - g2 * (items.length - 1);
        let x = lw;
        items.forEach(o => { const bw = avail * o.p.w / bandW[bi]; place(blocks[o.i], x, y, bw, bh); blocks[o.i].dataset.tone = bn === "Financials" ? "accent" : "dim"; blocks[o.i].firstChild.textContent = o.p.t; blocks[o.i].classList.toggle("show-in", bw > o.p.t.length * 7.3 + 18 && bh > 16); x += bw + g2; });
        place(bandL[bi], 0, y, lw - 12, bh); bandL[bi].classList.add("is-on"); bandL[bi].classList.toggle("is-dim", bn !== "Financials"); bandL[bi].classList.toggle("one", bh < 34);
        y += bh + gap;
      });
    } else {
      const g2 = 2, avail = aw - g2 * (POS.length - 1); let x = 0;
      POS.forEach((p, i) => { const bw = avail * p.w; place(blocks[i], x, 0, bw, 10); blocks[i].dataset.tone = p.h.band === "Financials" ? "accent" : "base"; x += bw + g2; });
      if (entering || !drawn) drawChart(true);
    }
  }
  function schedule() {
    clearTimeout(auto); tabs.forEach(b => $(".tp", b).classList.remove("run"));
    if (!motionOn || userPicked || !vis) return;
    const dur = state === 3 ? 6500 : 4800, bar = $(".tp", tabs[state]);
    bar.style.setProperty("--dur", dur + "ms"); bar.getBoundingClientRect(); bar.classList.add("run");
    auto = setTimeout(() => { layout((state + 1) % 4); schedule(); }, dur);
  }
  tabs.forEach((b, i) => {
    b.addEventListener("click", () => { userPicked = true; layout(i); schedule(); });
    b.addEventListener("keydown", e => { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; e.preventDefault(); const n = (i + (e.key === "ArrowRight" ? 1 : 3)) % 4; userPicked = true; layout(n); schedule(); tabs[n].focus(); });
  });
  panel.addEventListener("pointerenter", () => { clearTimeout(auto); tabs.forEach(b => $(".tp", b).classList.remove("run")); });
  panel.addEventListener("pointerleave", schedule);
  blocks.forEach((b, i) => { b.addEventListener("pointermove", e => showTip(`<b>${POS[i].h.name}</b>${POS[i].t} in ${ACCTS[POS[i].a]}<br>Value <span class="num">${inr(POS[i].w * VALUE)}</span>, ${Math.round(POS[i].w * 100)}% of total`, e.clientX, e.clientY)); b.addEventListener("pointerleave", hideTip); });
  onVisible(panel, v => { vis = v; if (v && state < 0) layout(0); schedule(); }, "-10% 0px");
  motionListeners.push(schedule);
  themeListeners.push(() => { if (state === 3) drawChart(false); });
  return { resize() { const s = state; state = -1; drawn = false; layout(s < 0 ? 0 : s, true); if (s === 3) drawChart(false); } };
})();

/* ================= Ask: scroll-lit words ================= */
const Ask = !ON_MAIN ? NOOP : (() => {
  const p = $("#ask-text"), words = p.textContent.trim().split(/\s+/);
  p.innerHTML = words.map(w => `<span class="w">${esc(w)}</span> `).join("");
  const spans = $$(".w", p);
  function update() {
    if (!motionOn) { spans.forEach(s => s.classList.add("on")); return; }
    const r = p.getBoundingClientRect(), start = innerHeight * .88, end = innerHeight * .38;
    const prog = clamp((start - r.top) / (start - end + r.height * .6)), n = Math.round(prog * spans.length);
    spans.forEach((s, i) => s.classList.toggle("on", i < n));
  }
  motionListeners.push(update);
  return { update };
})();

/* ================= Chrome: header, reveal, parallax ================= */
const hdr = $("#hdr"), progress = $("#progress"), heroInner = $("#hero-inner"), menuBtn = $("#menu-btn"), nav = $("#nav");
const closeMenu = () => { menuBtn.setAttribute("aria-expanded", "false"); menuBtn.setAttribute("aria-label", "Open menu"); nav.classList.remove("is-open"); };
menuBtn.addEventListener("click", () => { const open = menuBtn.getAttribute("aria-expanded") !== "true"; menuBtn.setAttribute("aria-expanded", String(open)); menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu"); nav.classList.toggle("is-open", open); });
nav.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && nav.classList.contains("is-open")) { closeMenu(); menuBtn.focus(); } });
let ticking = false;
function onScroll() {
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    hdr.classList.toggle("is-scrolled", y > 8);
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (heroInner && motionOn && y < innerHeight * 1.2) { heroInner.style.transform = `translate3d(0,${(y * .22).toFixed(1)}px,0)`; heroInner.style.opacity = String(clamp(1 - y / (innerHeight * .8))); }
    else if (heroInner && !motionOn) { heroInner.style.transform = ""; heroInner.style.opacity = ""; }
    Ask.update();
    Features.progress();
    Product.spy();
  });
}
addEventListener("scroll", onScroll, { passive: true });
motionListeners.push(onScroll);
const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.remove("rv-pre"); e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .06 });
$$(".rv").forEach(n => { if (motionOn && n.getBoundingClientRect().top > innerHeight * .92) n.classList.add("rv-pre"); io.observe(n); });
if ($("#word")) io.observe($("#word"));
$$("[data-spot]").forEach(c => c.addEventListener("pointermove", e => { const r = c.getBoundingClientRect(); c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px"); }));
let rt = 0;
addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { Lab.resize(); Journey.resize(); Build.resize(); Views.resize(); Features.wires(); Features.progress(); }, 120); });

/* ================= Product menu: marks the chapter in view ================= */
const Product = !ON_MAIN ? NOOP : (() => {
  const items = $$("#prod-menu .dd-item"), secs = items.map(a => document.getElementById(a.dataset.sec));
  function spy() { const onMain = !$("#main").hidden; let on = -1; if (onMain) secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * .45) on = i; }); items.forEach((a, i) => a.classList.toggle("is-here", i === on)); }
  return { spy };
})();

/* ================= Menus and the current page ================= */
(() => {
  const dds = $$(".nav-dd").map(d => ({ btn: $(".nav-dd-btn", d), menu: $(".dd-menu", d) }));
  const set = (dd, o) => { dd.btn.setAttribute("aria-expanded", String(o)); dd.menu.hidden = !o; };
  dds.forEach(dd => {
    dd.btn.addEventListener("click", e => { e.stopPropagation(); const o = dd.menu.hidden; dds.forEach(x => set(x, false)); set(dd, o); });
    dd.menu.addEventListener("click", e => { if (e.target.closest("a[href]")) set(dd, false); });
  });
  document.addEventListener("click", e => { if (!e.target.closest(".nav-dd")) dds.forEach(x => set(x, false)); });
  document.addEventListener("keydown", e => { const o = dds.find(x => !x.menu.hidden); if (e.key === "Escape" && o) { set(o, false); o.btn.focus(); } });
  $$(".nav a[data-page]").forEach(a => a.classList.toggle("is-current", a.dataset.page === PAGE));
  // older links to the single-page comp used #features
  if (ON_MAIN && location.hash === "#features") location.replace("features.html");
  if (!ON_MAIN) requestAnimationFrame(() => Features.show());
  onScroll();
})();

fillChakras();
motionListeners.push(() => Kx.forEach(v => v.kick()));
syncThemeUi();
applyMotion();
onScroll();
setTimeout(() => root.classList.remove("intro"), 2200);
})();
