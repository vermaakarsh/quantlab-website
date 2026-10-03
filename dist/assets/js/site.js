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

// Which page this is. Page-only modules are stand-ins elsewhere, whose methods do nothing.
const PAGE = document.body.dataset.page === "features" ? "features" : "main", ON_MAIN = PAGE === "main";
const NOOP = new Proxy({}, { get: () => () => {} });

const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const mqReduce = matchMedia("(prefers-reduced-motion: reduce)");
const mqLight = matchMedia("(prefers-color-scheme: light)");
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = t => 1 - Math.pow(1 - t, 3);
const easeInOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const el = (tag, cls, html) => { const d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; };
const esc = s => s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

const onVisible = (node, fn, margin = "0px") => { const o = new IntersectionObserver(([e]) => fn(e.isIntersecting), { rootMargin: margin }); o.observe(node); };

/* Links */
$$("[data-link]").forEach(a => {
  const url = LINKS[a.dataset.link];
  if (url) { a.href = url; if (!url.startsWith("https://saarth")) { a.target = "_blank"; a.rel = "noopener noreferrer"; } return; }
  a.replaceWith(el("span", "soon", `${a.textContent}<em>Soon</em>`));
});
$("#yr").textContent = new Date().getFullYear();

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

/* ================= Ask: scroll-lit words ================= */
const Ask = !$("#ask-text") ? NOOP : (() => {
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
    Product.spy();
  });
}
addEventListener("scroll", onScroll, { passive: true });
motionListeners.push(onScroll);
const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.remove("rv-pre"); e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .06 });
$$(".rv").forEach(n => { if (motionOn && n.getBoundingClientRect().top > innerHeight * .92) n.classList.add("rv-pre"); io.observe(n); });
if ($("#word")) io.observe($("#word"));
$$("[data-spot]").forEach(c => c.addEventListener("pointermove", e => { const r = c.getBoundingClientRect(); c.style.setProperty("--mx", (e.clientX - r.left) + "px"); c.style.setProperty("--my", (e.clientY - r.top) + "px"); }));

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
  onScroll();
})();

syncThemeUi();
applyMotion();
onScroll();
setTimeout(() => root.classList.remove("intro"), 2200);
})();
