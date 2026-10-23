// SIG-ILSP People map: districts shaded by how many listed groups and people are based there.
// Plain SVG, no map library. Institutions are placed by their coordinates in data/institutions.json;
// the district is found here by point-in-polygon, so nobody has to look districts up by hand.

const LNG0 = 68, LAT0 = 37.6, KX = Math.cos((23 * Math.PI) / 180), SCALE = 20;
const proj = ([lng, lat]) => [((lng - LNG0) * KX * SCALE).toFixed(1), ((LAT0 - lat) * SCALE).toFixed(1)];
const W = (97.6 - LNG0) * KX * SCALE, H = (LAT0 - 6) * SCALE;

function ringPath(ring) { return "M" + ring.map((c) => proj(c).join(",")).join("L") + "Z"; }
function geomPath(g) {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return polys.map((p) => p.map(ringPath).join("")).join("");
}
function bbox(g) {
  let x0 = 180, y0 = 90, x1 = -180, y1 = -90;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  polys.forEach((p) => p[0].forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }));
  return [x0, y0, x1, y1];
}
function inRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function contains(f, pt) {
  const [x0, y0, x1, y1] = f.bbox;
  if (pt[0] < x0 || pt[0] > x1 || pt[1] < y0 || pt[1] > y1) return false;
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  return polys.some((p) => inRing(pt, p[0]) && !p.slice(1).some((h) => inRing(pt, h)));
}

const STEPS = [[1, 0.28], [2, 0.45], [3, 0.62], [5, 0.8], [10, 1]];
const shade = (n) => (n ? STEPS.filter(([t]) => n >= t).pop()[1] : 0);

async function peopleMap(root, { groups, people, institutions, snapshotInstitutions }) {
  const geo = await fetch("data/districts.geojson", { cache: "no-cache" }).then((r) => r.json());
  geo.features.forEach((f) => (f.bbox = bbox(f.geometry)));

  // Institution -> district (computed once).
  const instByKey = {};
  const k = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  institutions.forEach((inst) => {
    inst.district = geo.features.find((f) => contains(f, [inst.lng, inst.lat])) || null;
    [inst.name, ...(inst.aliases || [])].forEach((a) => (instByKey[k(a)] = inst));
  });
  const findInst = (name) => instByKey[k(name)];

  const modes = {
    directory: {
      label: "Groups and people listed",
      items(f) {
        const g = groups.filter((x) => findInst(x.institution)?.district === f).map((x) => ({ kind: "Group", title: x.name, sub: x.institution, url: x.website }));
        const p = people.filter((x) => findInst(x.institution)?.district === f).map((x) => ({ kind: x.role, title: x.name, sub: x.institution, url: x.profile }));
        return [...g, ...p];
      },
    },
    snapshot: {
      label: "Institutions in the paper snapshot",
      items(f) {
        return snapshotInstitutions.map(findInst).filter((i) => i && i.district === f)
          .map((i) => ({ kind: "Institution", title: i.name, sub: i.city, url: `outcomes.html?q=${encodeURIComponent(i.name)}` }));
      },
    },
  };
  let mode = groups.length + people.length ? "directory" : "snapshot";

  root.innerHTML = `
    <div class="map-bar">
      <div class="seg" role="tablist">
        <button type="button" data-mode="directory">${modes.directory.label}</button>
        <button type="button" data-mode="snapshot">${modes.snapshot.label}</button>
      </div>
      <div class="zoom"><button type="button" class="icon-btn" data-z="1.6" aria-label="Zoom in">+</button><button type="button" class="icon-btn" data-z="0.625" aria-label="Zoom out">−</button><button type="button" class="icon-btn" data-z="0" aria-label="Reset view">⟲</button></div>
    </div>
    <div class="map-wrap">
      <svg class="dmap" viewBox="0 0 ${W.toFixed(0)} ${H.toFixed(0)}" role="img" aria-label="Map of India by district"><g class="dists"></g><g class="pins"></g></svg>
      <div class="map-tip" hidden></div>
      <aside class="map-panel"></aside>
    </div>
    <div class="map-legend"></div>
    <p class="small muted">District boundaries: LGD, via INDIAN-SHAPEFILES (MIT). Each entry is placed in the district of its institution; individuals are never shown at an exact location.</p>`;

  const svg = root.querySelector("svg"), gd = svg.querySelector(".dists"), tip = root.querySelector(".map-tip"), panel = root.querySelector(".map-panel");
  gd.innerHTML = geo.features.map((f, i) => `<path d="${geomPath(f.geometry)}" data-i="${i}"/>`).join("");
  const paths = [...gd.children];
  let selected = null, counts = [];

  function paint() {
    root.querySelectorAll(".seg button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === mode));
    counts = geo.features.map((f) => modes[mode].items(f).length);
    paths.forEach((p, i) => { p.style.fillOpacity = shade(counts[i]); p.classList.toggle("has", counts[i] > 0); });
    const total = counts.reduce((a, b) => a + b, 0), nd = counts.filter(Boolean).length;
    root.querySelector(".map-legend").innerHTML = `<span>${total} in ${nd} district${nd === 1 ? "" : "s"}</span>
      <span class="ramp">${STEPS.map(([t, o], j) => `<i style="--o:${o}"></i><small>${t}${j === STEPS.length - 1 ? "+" : ""}</small>`).join("")}</span>`;
    showPanel(selected);
  }

  function showPanel(i) {
    selected = i;
    paths.forEach((p, j) => p.classList.toggle("sel", j === i));
    if (i == null) {
      const top = counts.map((n, j) => [n, j]).filter(([n]) => n).sort((a, b) => b[0] - a[0]).slice(0, 12);
      panel.innerHTML = `<h3>${modes[mode].label}</h3><p class="small muted">Select a district to see who is there.</p>
        <ol class="dlist">${top.map(([n, j]) => `<li><button type="button" data-i="${j}"><em>${esc(geo.features[j].properties.name)} <small class="muted">${esc(geo.features[j].properties.state)}</small></em><span>${n}</span></button></li>`).join("")}</ol>`;
      return;
    }
    const f = geo.features[i], items = modes[mode].items(f);
    panel.innerHTML = `<button type="button" class="crumb linkish" data-back>← All districts</button>
      <h3>${esc(f.properties.name)}</h3><p class="small muted">${esc(f.properties.state)}</p>
      ${items.length ? `<ul class="plist">${items.map((x) => `<li><span class="tag plain">${esc(x.kind)}</span>
        <a href="${esc(x.url)}">${esc(x.title)}</a><br><span class="small muted">${esc(x.sub)}</span></li>`).join("")}</ul>`
        : `<p class="small">Nobody listed here yet.</p>`}`;
  }

  panel.addEventListener("click", (e) => {
    const b = e.target.closest("[data-i]");
    if (b) { showPanel(+b.dataset.i); focus(+b.dataset.i); }
    if (e.target.closest("[data-back]")) showPanel(null);
  });
  root.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => { mode = b.dataset.mode; paint(); }));

  gd.addEventListener("mousemove", (e) => {
    const p = e.target.closest("path");
    if (!p) { tip.hidden = true; return; }
    const i = +p.dataset.i, f = geo.features[i], r = root.querySelector(".map-wrap").getBoundingClientRect();
    tip.hidden = false;
    tip.innerHTML = `<b>${esc(f.properties.name)}</b>${f.properties.state ? ", " + esc(f.properties.state) : ""}<br>${counts[i]} ${mode === "directory" ? "listed" : "institutions"}`;
    tip.style.left = e.clientX - r.left + 14 + "px"; tip.style.top = e.clientY - r.top + 14 + "px";
  });
  gd.addEventListener("mouseleave", () => (tip.hidden = true));
  gd.addEventListener("click", (e) => { const p = e.target.closest("path"); if (p && !moved) showPanel(+p.dataset.i); });

  // Zoom and pan by changing the viewBox.
  let vb = [0, 0, W, H], drag = null, moved = false;
  const setVB = () => svg.setAttribute("viewBox", vb.map((v) => v.toFixed(1)).join(" "));
  function zoom(f, cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2) {
    if (!f) { vb = [0, 0, W, H]; return setVB(); }
    const w = Math.min(W, Math.max(W / 40, vb[2] / f)), h = (w * H) / W;
    vb = [cx - ((cx - vb[0]) * w) / vb[2], cy - ((cy - vb[1]) * h) / vb[3], w, h];
    setVB();
    svg.style.setProperty("--sw", (vb[2] / W).toFixed(3));
  }
  const toSvg = (e) => { const r = svg.getBoundingClientRect(); return [vb[0] + ((e.clientX - r.left) / r.width) * vb[2], vb[1] + ((e.clientY - r.top) / r.height) * vb[3]]; };
  function focus(i) {                       // zoom to a district with some context around it
    const [x0, y0, x1, y1] = geo.features[i].bbox;
    const [ax, ay] = proj([x0, y1]).map(Number), [bx, by] = proj([x1, y0]).map(Number);
    const w = Math.max((bx - ax) * 6, W / 12), h = (w * H) / W;
    vb = [(ax + bx) / 2 - w / 2, (ay + by) / 2 - h / 2, w, h];
    setVB();
  }
  root.querySelectorAll(".zoom button").forEach((b) => b.addEventListener("click", () => zoom(+b.dataset.z)));
  svg.addEventListener("wheel", (e) => { e.preventDefault(); const [x, y] = toSvg(e); zoom(e.deltaY < 0 ? 1.25 : 0.8, x, y); }, { passive: false });
  svg.addEventListener("pointerdown", (e) => { drag = [e.clientX, e.clientY, vb[0], vb[1]]; moved = false; });
  addEventListener("pointermove", (e) => {
    if (!drag) return;
    const r = svg.getBoundingClientRect(), dx = e.clientX - drag[0], dy = e.clientY - drag[1];
    if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
    vb[0] = drag[2] - (dx / r.width) * vb[2]; vb[1] = drag[3] - (dy / r.height) * vb[3]; setVB();
  });
  addEventListener("pointerup", () => (drag = null));

  paint();
}
