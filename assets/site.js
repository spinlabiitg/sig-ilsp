// SIG-ILSP site: shared header/footer, speech animations and page renderers.
// All links are relative so the site works at spinlabiitg.github.io/sig-ilsp/ and at a future domain root.

const REPO = "https://github.com/spinlabiitg/sig-ilsp";
const NEW_ISSUE = REPO + "/issues/new";

const NAV = [
  ["index.html", "Home"],
  ["lectures.html", "Lectures"],
  ["outcomes.html", "Outcomes"],
  ["people.html", "People"],
  ["news.html", "News"],
  ["about.html", "About"],
];

const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

const ICON = {
  logo: `<svg class="brand-mark" viewBox="0 0 36 36" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0b7a72"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs>
    <rect width="36" height="36" rx="10" fill="url(#lg)"/><g stroke="#fff" stroke-width="2.4" stroke-linecap="round">
    <line x1="8" y1="15" x2="8" y2="21"/><line x1="13" y1="11" x2="13" y2="25"/><line x1="18" y1="7" x2="18" y2="29"/>
    <line x1="23" y1="12" x2="23" y2="24"/><line x1="28" y1="16" x2="28" y2="20"/></g></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
  cal: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>`,
  next: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5l9 7-9 7zM16 5h2v14h-2z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.3 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2z"/></svg>`,
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel) => document.querySelector(sel);
// "no-cache" makes the browser check for a newer file each time, so maintainers' edits show up at once.
const getJSON = (name) => fetch(`data/${name}.json`, { cache: "no-cache" }).then((r) => r.json());
const TODAY = new Date().toISOString().slice(0, 10);
const PAPER_FORM = NEW_ISSUE + "?template=paper.yml";
const GROUP_FORM = NEW_ISSUE + "?template=group.yml";
const THESIS_FORM = NEW_ISSUE + "?template=thesis.yml";
const RESOURCE_FORM = NEW_ISSUE + "?template=resource.yml";

// All outcomes: the fixed paper snapshot (Sep 2025 - Oct 2026), papers added by authors, and theses.
// Theses are given the same shape as papers (kind: "thesis") so lists and filters treat them alike.
async function getPapers() {
  const [snap, added, theses] = await Promise.all([getJSON("papers"), getJSON("submitted_papers").catch(() => []), getJSON("theses").catch(() => [])]);
  const t = theses.map((x) => ({ ...x, kind: "thesis", source: "submitted", authors: x.author, affiliations: x.institution,
    venue: x.degree + " thesis", institutions: [x.institution] }));
  return [...t, ...added.map((p) => ({ ...p, kind: "paper", source: "submitted" })), ...snap.map((p) => ({ ...p, kind: "paper", source: "snapshot" }))];
}

/* ---------------- theme ---------------- */
function storedTheme() { try { return localStorage.getItem("sig-theme"); } catch { return null; } }
function applyTheme(t) {
  if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme;
  const btn = $("#theme-btn");
  if (btn) {
    const dark = t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    btn.innerHTML = dark ? ICON.sun : ICON.moon;
    btn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }
}
applyTheme(storedTheme());

/* ---------------- header & footer ---------------- */
function chrome() {
  const here = location.pathname.split("/").pop() || "index.html";
  const active = here;
  document.body.insertAdjacentHTML("afterbegin", `
    <div class="draft-banner">Draft site under construction. Content is provisional and open for comment.</div>
    <header class="site-header"><div class="wrap">
      <a class="brand" href="index.html">${ICON.logo}<div><b>SIG-ILSP</b><span>Indian Language Speech Processing · an ISCA Special Interest Group</span></div></a>
      <div class="nav-wrap">
        <nav id="nav" aria-label="Main"><ul>${NAV.map(([h, t]) =>
          `<li><a href="${h}"${h === active ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}</ul></nav>
        <button class="icon-btn" id="theme-btn" type="button"></button>
        <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav">${ICON.menu}</button>
      </div>
    </div></header>`);
  document.body.insertAdjacentHTML("beforeend", `
    <footer class="site-footer"><div class="wrap">
      <div class="foot-grid">
        <div><a class="brand" href="index.html">${ICON.logo}<div><b>SIG-ILSP</b></div></a>
          <p style="max-width:28rem">The Special Interest Group on Indian Language Speech Processing of the
          <a href="https://isca-speech.org/Special-Interest-Groups">International Speech Communication Association</a>.</p></div>
        <div><h4>Explore</h4><ul>${NAV.slice(1, 5).map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul></div>
        <div><h4>Contribute</h4><ul>
          <li><a href="${PAPER_FORM}">Add your paper</a></li>
          <li><a href="${THESIS_FORM}">Add a thesis</a></li>
          <li><a href="${NEW_ISSUE}?template=person.yml">Join the directory</a></li>
          <li><a href="${GROUP_FORM}">List your group</a></li>
          <li><a href="${RESOURCE_FORM}">Add a dataset</a></li>
          <li><a href="${NEW_ISSUE}?title=Lecture%20suggestion%3A%20">Suggest a speaker</a></li>
          <li><a href="${NEW_ISSUE}?title=Event%3A%20">Submit an event</a></li>
          <li><a href="${REPO}">Source on GitHub</a></li></ul></div>
      </div>
      <div class="foot-note">Hosted by SPIN Lab, IIT Guwahati, for the SIG. Paper data compiled from the ISCA Archive and OpenAlex.</div>
    </div></footer>`);

  applyTheme(storedTheme());
  $("#theme-btn").addEventListener("click", () => {
    const cur = document.documentElement.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    try { localStorage.setItem("sig-theme", next); } catch {}
    applyTheme(next);
  });
  $("#menu-btn").addEventListener("click", (e) => {
    const open = $("#nav").classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", open);
  });
}

/* ---------------- speech animations (real recordings) ---------------- */

// Decode a spectrogram PNG (rows = 0..fmax Hz, top = high) into column-major bytes.
const specCache = {};
function loadSpec(clip) {
  if (!specCache[clip.key]) specCache[clip.key] = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const x = c.getContext("2d");
      x.drawImage(img, 0, 0);
      const px = x.getImageData(0, 0, c.width, c.height).data;
      const rows = c.height, cols = c.width, out = new Uint8Array(rows * cols);
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) out[k * rows + r] = px[(r * cols + k) * 4];
      resolve({ rows, cols, data: out });
    };
    img.onerror = reject;
    img.src = clip.spec;
  });
  return specCache[clip.key];
}

// Scrolling spectrogram of real speech clips, one after another, in real time.
// Optional hooks: start (clip index), onClip(clip, index) when a clip starts, onFrame(clip, t) every frame.
function speechBackdrop(canvas, voices, hooks = {}) {
  const ctx = canvas.getContext("2d");
  const clips = voices.clips, FPS = voices.spec.fps, GAP = 0.7;
  let W, H, idx = hooks.start ?? 0, t = 0, spec = null, audio = null, touring = false;
  let colsDrawn = 0, last = performance.now(), raf = 0;
  const css = () => getComputedStyle(document.documentElement);
  const rgb = (hex) => { const n = parseInt(hex.trim().replace("#", ""), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  let cA, cB;
  const readColors = () => { cA = rgb(css().getPropertyValue("--accent")); cB = rgb(css().getPropertyValue("--accent-2")); };

  function resize() {
    const r = canvas.getBoundingClientRect();
    W = canvas.width = Math.max(1, Math.round(r.width / 2));
    H = canvas.height = Math.max(200, Math.round(r.height / 2));
    readColors();
  }

  function column(v) {                       // v: Float32Array(H) in 0..1, top row first
    ctx.globalCompositeOperation = "copy";
    ctx.drawImage(canvas, -1, 0);
    ctx.globalCompositeOperation = "source-over";
    const img = ctx.createImageData(1, H);
    for (let y = 0; y < H; y++) {
      const m = y / H, i = y * 4;
      img.data[i] = cA[0] * m + cB[0] * (1 - m);
      img.data[i + 1] = cA[1] * m + cB[1] * (1 - m);
      img.data[i + 2] = cA[2] * m + cB[2] * (1 - m);
      img.data[i + 3] = 255 * v[y];
    }
    ctx.putImageData(img, W - 1, 0);
  }

  function specColumn(s, frame) {
    const v = new Float32Array(H);
    if (!s || frame < 0 || frame >= s.cols) return v;
    const base = frame * s.rows;
    for (let y = 0; y < H; y++) v[y] = (s.data[base + Math.floor((y * s.rows) / H)] / 255) ** 1.15;
    return v;
  }

  async function setClip(i) {
    idx = (i + clips.length) % clips.length; t = 0; colsDrawn = 0; spec = null;
    const clip = clips[idx];
    hooks.onClip?.(clip, idx);
    spec = await loadSpec(clip);
    loadSpec(clips[(idx + 1) % clips.length]);   // prefetch the next one
    if (touring) playAudio();
  }

  function playAudio() {
    if (audio) audio.pause();
    audio = new Audio(clips[idx].audio);
    audio.play().catch(() => {});
    audio.onended = () => { audio = null; };
    t = 0; colsDrawn = 0;
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (document.hidden) return;
    const clip = clips[idx];
    if (!spec) return;
    t = audio && !audio.paused ? audio.currentTime : t + dt;
    const target = Math.floor(t * FPS);
    for (; colsDrawn < target; colsDrawn++) column(specColumn(spec, colsDrawn));
    hooks.onFrame?.(clip, Math.min(t, clip.duration));
    if (t > clip.duration + GAP && !(audio && !audio.paused)) setClip(idx + 1);
  }

  // Fill the canvas once with the clips before the current one, so it is never empty
  // (and under reduced motion this still picture is all there is).
  async function prefill() {
    const cols = [];
    let i = idx;
    while (cols.length < W) {
      i = (i + clips.length - 1) % clips.length;
      const s = await loadSpec(clips[i]);
      const part = Array.from({ length: s.cols }, (_, k) => [s, k]);
      cols.unshift(...part, ...Array(Math.round(GAP * FPS)).fill(null));
    }
    for (const c of cols.slice(-W)) column(c ? specColumn(c[0], c[1]) : new Float32Array(H));
  }

  resize();
  addEventListener("resize", () => { resize(); prefill(); });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", readColors);
  new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  prefill().then(() => setClip(idx)).then(() => { last = performance.now(); if (!REDUCED) raf = requestAnimationFrame(frame); });

  return {
    get touring() { return touring; },
    toggleTour() {
      touring = !touring;
      if (touring) {
        playAudio();
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
      } else if (audio) { audio.pause(); audio = null; }
      return touring;
    },
    next() { if (audio) audio.pause(); audio = null; return setClip(idx + 1); },
  };
}

// Real waveform (min/max envelope of the recording) with a playhead.
function drawWave(canvas, clip, t) {
  const r = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
  const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
  if (!w || !h) return;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext("2d"), cs = getComputedStyle(document.documentElement);
  const played = cs.getPropertyValue("--accent").trim(), ink = cs.getPropertyValue("--muted").trim();
  ctx.clearRect(0, 0, w, h);
  const env = clip.env, n = env.length, bw = w / n, mid = h / 2, p = t / clip.duration;
  for (let i = 0; i < n; i++) {
    const [lo, hi] = env[i], on = (i + 0.5) / n <= p;
    ctx.fillStyle = on ? played : ink;
    ctx.globalAlpha = on ? 1 : 0.35;
    const y0 = mid - (hi / 100) * mid * 0.95, y1 = mid - (lo / 100) * mid * 0.95;
    ctx.fillRect(i * bw, y0, Math.max(1, bw - 0.5 * dpr), Math.max(dpr, y1 - y0));
  }
  ctx.globalAlpha = 1;
  if (p > 0 && p < 1) { ctx.fillStyle = played; ctx.fillRect(p * w - dpr, 0, 2 * dpr, h); }
}

function ticker(el, voices) {
  const items = voices.clips.map((c) => `<span>${esc(c.native)}<small>${esc(c.language)}</small></span>`).join("");
  el.innerHTML = `<div class="ticker-track">${items}${REDUCED ? "" : items}</div>`;
}

function countUp(el, target) {
  if (REDUCED) { el.textContent = target; return; }
  const t0 = performance.now(), dur = 1200;
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    el.textContent = Math.round(target * (1 - (1 - p) ** 3));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function reveal() {
  const els = document.querySelectorAll(".reveal");
  if (REDUCED || !("IntersectionObserver" in window)) { els.forEach((e) => e.classList.add("in")); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  els.forEach((e) => io.observe(e));
}

/* ---------------- shared renderers ---------------- */
function paperItem(p) {
  const title = p.link ? `<a href="${esc(p.link)}">${esc(p.title)}</a>` : esc(p.title);
  if (p.kind === "thesis") return `<li class="thesis"><div class="t">${title}</div>
    <div class="a">${esc(p.author)} · supervised by ${esc(p.supervisors)}</div>
    <div class="a">${esc(p.institution)} · ${esc(p.date)}</div>
    <div class="meta"><span class="tag warm">${esc(p.degree)} thesis</span><span class="tag">${esc(p.theme)}</span>${p.indian_language ? '<span class="tag warm">Indian-language focus</span>' : ""}</div></li>`;
  return `<li><div class="t">${title}</div>
    <div class="a">${esc(p.authors)}</div>
    <div class="a">${esc(p.affiliations)}</div>
    <div class="meta"><span class="tag plain">${esc(p.venue)}</span><span class="tag">${esc(p.theme)}</span>${p.indian_language ? '<span class="tag warm">Indian-language focus</span>' : ""}${p.source === "submitted" ? '<span class="tag plain">added by authors</span>' : ""}</div></li>`;
}

function fmtDate(iso) {
  if (!iso) return { d: "TBA", m: "" };
  const dt = new Date(iso + "T00:00:00");
  return { d: dt.getDate(), m: dt.toLocaleString("en-IN", { month: "short", year: "numeric" }) };
}

// Build an .ics file for a lecture (time given in IST, e.g. "7:00 pm IST"; 75 minutes).
function icsHref(l) {
  const m = /(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(l.time || "");
  let h = m ? (+m[1] % 12) + (m[3].toLowerCase() === "pm" ? 12 : 0) : 19, mi = m ? +m[2] : 0;
  const start = new Date(`${l.date}T${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}:00+05:30`);
  const end = new Date(start.getTime() + 75 * 60000);
  const z = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SIG-ILSP//Lectures//EN", "BEGIN:VEVENT",
    `UID:${l.id}@sig-ilsp`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(start)}`, `DTEND:${z(end)}`,
    `SUMMARY:SIG-ILSP lecture: ${l.title} (${l.speaker})`, `DESCRIPTION:${(l.live_url || "Link on the SIG-ILSP website").replace(/[,;]/g, " ")}`,
    "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
}

function lectureCard(l) {
  const dt = fmtDate(l.date);
  const isToday = l.date === TODAY;
  const links = [
    l.live_url && `<a class="btn accent sm" href="${esc(l.live_url)}">${isToday ? '<span class="live-dot"></span>' : ICON.play}Join live</a>`,
    l.date && l.date >= TODAY && `<a class="btn ghost sm" href="${icsHref(l)}" download="sig-ilsp-${esc(l.id)}.ics">${ICON.cal}Add to calendar</a>`,
    l.recording_url && `<a class="btn accent sm" href="${esc(l.recording_url)}">${ICON.play}Watch recording</a>`,
    l.slides_url && `<a class="btn ghost sm" href="${esc(l.slides_url)}">Slides</a>`,
  ].filter(Boolean).join("");
  return `<div class="card lecture">
    <div class="datebox"><span class="d">${dt.d}</span>${esc(dt.m)}</div>
    <div><h3>${esc(l.title)}</h3>
      <p><b>${esc(l.speaker)}</b>${l.affiliation ? ", " + esc(l.affiliation) : ""}</p>
      <p class="muted small">${l.date ? esc(l.time) + " · streamed online" : "Date to be announced · streamed online"}</p>
      <p>${esc(l.abstract)}</p>
      ${links ? `<div class="actions">${links}</div>` : ""}
    </div></div>`;
}

function resourceCard(r) {
  return `<div class="card">
    <p class="eyebrow">${esc(r.type)}${r.year ? " · " + esc(r.year) : ""}</p>
    <h3><a href="${esc(r.link)}">${esc(r.name)}</a></h3>
    <p class="small">${esc(r.description)}</p>
    <p class="small muted">${esc(r.creators)}${r.size ? " · " + esc(r.size) : ""}</p>
    <div class="meta"><span class="tag plain">${esc(r.licence)}</span><span class="tag plain">${esc(r.access)}</span>${r.languages.map((l) => `<span class="tag warm">${esc(l)}</span>`).join("")}</div>
  </div>`;
}

function eventItem(e) {
  const name = e.link ? `<a href="${esc(e.link)}">${esc(e.name)}</a>` : esc(e.name);
  const d = e.start ? new Date(e.start + "T00:00:00") : null;
  const cal = d ? `<div class="cal">${d.toLocaleString("en-IN", { month: "short" })}<b>${d.getFullYear()}</b></div>` : `<div class="cal">TBA</div>`;
  return `<li>${cal}<div><div class="when">${esc(e.when)} · ${esc(e.type)}</div><div><b>${name}</b></div>
    <div class="small muted">${esc(e.venue)}${e.relevance ? " · " + esc(e.relevance) : ""}</div></div></li>`;
}

/* ---------------- pages ---------------- */
const pages = {
  async home() {
    const voices = await getJSON("voices");
    ticker($("#ticker"), voices);
    const wave = $("#wave"), lab = $("#voice-word");
    let cur = voices.clips[0], curT = 0;
    const spec = speechBackdrop($("#spec"), voices, {
      onClip(clip) {
        cur = clip; curT = 0;
        lab.classList.add("swap");
        setTimeout(() => {
          lab.innerHTML = `<b>${esc(clip.native)}</b><span>${esc(clip.language)} · ${esc(clip.recorded_in)}</span>`;
          lab.classList.remove("swap");
        }, REDUCED ? 0 : 250);
        drawWave(wave, clip, 0);
      },
      onFrame(clip, t) { curT = t; drawWave(wave, clip, t); },
    });
    addEventListener("resize", () => drawWave(wave, cur, curT));
    const playBtn = $("#play-btn"), nextBtn = $("#next-btn");
    const setPlay = (on) => { playBtn.innerHTML = on ? `${ICON.pause}Pause` : `${ICON.play}Listen`; playBtn.setAttribute("aria-pressed", on); };
    setPlay(false);
    playBtn.addEventListener("click", () => setPlay(spec.toggleTour()));
    nextBtn.innerHTML = ICON.next;
    nextBtn.addEventListener("click", () => spec.next());

    const [meta, lectures, resources, events] = await Promise.all([getJSON("meta"), getJSON("lectures"), getJSON("resources").catch(() => []), getJSON("events")]);
    const stats = [
      [meta.papers, "India-affiliated speech papers in the " + meta.window + " snapshot"],
      [meta.venues, "conferences and journals"],
      [meta.indian_language_papers, "papers focused on Indian languages"],
      [resources.length, "datasets and resources listed"],
    ];
    $("#stats").innerHTML = stats.map(([n, t]) => `<div class="stat"><b data-n="${n}">0</b><span>${esc(t)}</span></div>`).join("");
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.querySelectorAll("b[data-n]").forEach((b) => countUp(b, +b.dataset.n)); io.disconnect(); }
    }));
    io.observe($("#stats"));
    const next = lectures.filter((l) => !l.date || l.date >= TODAY)[0] || lectures[lectures.length - 1];
    $("#next-lecture").innerHTML = next ? lectureCard(next) : "";
    $("#resource-teasers").innerHTML = [...resources].sort((a, b) => (b.added || "").localeCompare(a.added || "")).slice(0, 3).map(resourceCard).join("")
      || `<div class="card muted">No resources listed yet. <a href="${RESOURCE_FORM}">Add a dataset</a>.</div>`;
    const upcoming = events.filter((e) => e.start && e.start >= TODAY);
    const recent = events.filter((e) => e.start && e.start < TODAY).slice(-3).reverse();
    $("#events").innerHTML = [...upcoming, ...recent].slice(0, 4).map(eventItem).join("");
  },

  async lectures() {
    const lectures = await getJSON("lectures");
    const up = lectures.filter((l) => !l.date || l.date >= TODAY);
    const past = lectures.filter((l) => l.date && l.date < TODAY).reverse();
    $("#upcoming").innerHTML = up.map((l) => `<div id="${l.id}">${lectureCard(l)}</div>`).join("") || '<p class="muted">No talks scheduled yet.</p>';
    $("#past").innerHTML = past.map((l) => `<div id="${l.id}">${lectureCard(l)}</div>`).join("") || '<div class="card muted">Recordings will appear here after each talk.</div>';
  },

  async outcomes() {
    const [papers, meta, resources] = await Promise.all([getPapers(), getJSON("meta"), getJSON("resources").catch(() => [])]);
    // Two views: papers and theses, or resources (datasets, benchmarks, models, toolkits).
    const showView = (v) => {
      document.querySelectorAll("[data-view]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.view === v));
      $("#view-papers").hidden = v !== "papers"; $("#view-resources").hidden = v !== "resources";
    };
    document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => showView(b.dataset.view)));
    $("#n-resources").textContent = resources.length;
    const rtypes = [...new Set(resources.map((r) => r.type))].sort();
    const rlangs = [...new Set(resources.flatMap((r) => r.languages))].sort();
    $("#rtype").innerHTML += rtypes.map((t) => `<option>${esc(t)}</option>`).join("");
    $("#rlang").innerHTML += rlangs.map((t) => `<option>${esc(t)}</option>`).join("");
    const drawRes = () => {
      const q = $("#rq").value.trim().toLowerCase(), ty = $("#rtype").value, la = $("#rlang").value;
      const rows = resources.filter((r) => (!ty || r.type === ty) && (!la || r.languages.includes(la)) &&
        (!q || [r.name, r.description, r.creators, ...r.languages].join(" ").toLowerCase().includes(q)));
      $("#rcount").textContent = `Showing ${rows.length} of ${resources.length} resources`;
      $("#resources").innerHTML = rows.map(resourceCard).join("") || '<div class="card muted">No resources match.</div>';
    };
    ["rq", "rtype", "rlang"].forEach((id) => $("#" + id).addEventListener("input", drawRes));
    drawRes();
    showView(new URLSearchParams(location.search).get("view") === "resources" ? "resources" : "papers");
    const themes = [...new Set(papers.map((p) => p.theme))].sort();
    const venues = [...new Set(papers.filter((p) => p.kind === "paper").map((p) => p.venue))].sort();
    let theme = new URLSearchParams(location.search).get("theme") || "";
    const chips = $("#chips");
    const drawChips = () => {
      chips.innerHTML = ["", ...themes].map((t) => `<button type="button" class="chip" data-t="${esc(t)}" aria-pressed="${t === theme}">${t ? esc(t) : "All themes"}</button>`).join("");
    };
    chips.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      theme = b.dataset.t; drawChips(); render();
    });
    $("#venue").innerHTML += venues.map((t) => `<option>${esc(t)}</option>`).join("");
    const render = () => {
      const q = $("#q").value.trim().toLowerCase();
      const ve = $("#venue").value, il = $("#indic").checked, so = $("#source").value, ty = $("#kind").value;
      const rows = papers.filter((p) => (!theme || p.theme === theme) && (!ve || p.venue === ve) && (!il || p.indian_language) && (!so || p.source === so) && (!ty || p.kind === ty) &&
        (!q || (p.title + " " + p.authors + " " + p.affiliations).toLowerCase().includes(q)));
      $("#count").textContent = `Showing ${rows.length} of ${papers.length} outcomes`;
      $("#papers").innerHTML = rows.map(paperItem).join("");
    };
    ["q", "venue", "indic", "source", "kind"].forEach((id) => $("#" + id).addEventListener("input", render));
    $("#window").textContent = meta.window;
    $("#n-added").textContent = papers.filter((p) => p.source === "submitted" && p.kind === "paper").length;
    $("#n-theses").textContent = papers.filter((p) => p.kind === "thesis").length;
    const kind = new URLSearchParams(location.search).get("kind");
    if (kind) $("#kind").value = kind;
    const q = new URLSearchParams(location.search).get("q");
    if (q) $("#q").value = q;
    drawChips(); render();
  },

  async people() {
    const [groups, people, institutions, papers] = await Promise.all([
      getJSON("groups").catch(() => []), getJSON("people").catch(() => []),
      getJSON("institutions"), getJSON("papers"),
    ]);
    const snapshotInstitutions = [...new Set(papers.flatMap((p) => p.institutions))];
    $("#n-groups").textContent = groups.length;
    $("#n-people").textContent = people.length;
    const tagsOf = (x) => `${x.topics.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}${x.languages.map((l) => `<span class="tag warm">${esc(l)}</span>`).join("")}`;
    const empty = (what) => `<div class="card muted">No ${what} listed yet. Be the first: use the button above.</div>`;
    const draw = () => {
      const q = $("#gq").value.trim().toLowerCase();
      const hit = (x) => !q || [x.name, x.institution, x.lead, x.group, x.role, ...x.topics, ...x.languages].join(" ").toLowerCase().includes(q);
      $("#groups").innerHTML = groups.filter(hit).map((g) => `<div class="card">
        <p class="eyebrow">${esc(g.sector)}</p>
        <h3><a href="${esc(g.website)}">${esc(g.name)}</a></h3>
        <p class="muted small">${esc(g.institution)} · ${esc(g.lead)}</p>
        <div class="meta">${tagsOf(g)}</div></div>`).join("") || (groups.length ? '<div class="card muted">No groups match.</div>' : empty("groups"));
      $("#people").innerHTML = people.filter(hit).map((p) => `<div class="card">
        <p class="eyebrow">${esc(p.role)}</p>
        <h3><a href="${esc(p.profile)}">${esc(p.name)}</a></h3>
        <p class="muted small">${esc(p.institution)}${p.group ? " · " + esc(p.group) : ""}</p>
        <div class="meta">${tagsOf(p)}</div></div>`).join("") || (people.length ? '<div class="card muted">No people match.</div>' : empty("people"));
    };
    $("#gq").addEventListener("input", draw);
    draw();
    document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
      document.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", x === b));
      ["map", "groups", "people"].forEach((v) => ($("#view-" + v).hidden = v !== b.dataset.view));
      $("#gq").hidden = b.dataset.view === "map";
    }));
    await peopleMap($("#view-map"), { groups, people, institutions, snapshotInstitutions });
  },

  async news() {
    const [events, theses] = await Promise.all([getJSON("events"), getJSON("theses").catch(() => [])]);
    $("#theses").innerHTML = theses.slice(0, 6).map((t) => paperItem({ ...t, kind: "thesis" })).join("")
      || `<li class="muted">No theses submitted yet. Recently defended? <a href="${THESIS_FORM}">Add your thesis</a>.</li>`;
    const up = events.filter((e) => e.start && e.start >= TODAY);
    const past = events.filter((e) => !e.start || e.start < TODAY).reverse();
    $("#up").innerHTML = up.map(eventItem).join("") || '<li class="muted">Nothing listed yet.</li>';
    $("#past").innerHTML = past.map(eventItem).join("");
  },
};

chrome();
const page = document.body.dataset.page;
(pages[page] ? pages[page]() : Promise.resolve()).then(() => {
  // A quieter spectrogram behind each inner page header.
  const heads = document.querySelectorAll(".page-head");
  if (heads.length) getJSON("voices").then((voices) => heads.forEach((h) => {
    const c = document.createElement("canvas");
    c.className = "hero-spec"; c.setAttribute("aria-hidden", "true");
    h.prepend(c);
    speechBackdrop(c, voices, { start: Math.floor(Math.random() * voices.clips.length) });
  }));
  reveal();
}).catch((err) => console.error(err));
