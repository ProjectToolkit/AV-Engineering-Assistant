// AV Engineering Assistant - project, room design, design checklist, room summary, export.
// Depends on app.js (BOM, PULL, LAST_AUDIT) and calcs.js (ROOM, PROJ, CALCS, VIZ and the SVG helpers).
const APP_VERSION = "1.2.0", APP_DATE = "27 Oct 2026";
const verEl = document.getElementById("ver"); if (verEl) verEl.textContent = `AV Engineering Assistant - ${APP_DATE} - Created by Andrew Scofield`; const vb = document.getElementById("vbadge"); if (vb) vb.textContent = "v" + APP_VERSION;

// ---------- small helpers
function toast(m) { let t = cq("toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.style.cssText = "position:fixed;left:50%;bottom:80px;transform:translateX(-50%);background:#1b2d5e;color:#fff;padding:9px 16px;border-radius:10px;font-size:13px;z-index:50;box-shadow:0 6px 24px rgba(0,0,0,.35)"; document.body.appendChild(t); } t.textContent = m; t.style.display = "block"; clearTimeout(t._h); t._h = setTimeout(() => t.style.display = "none", 2600); }
function lightify(s) { const P = { ink: "#1a2547", mute: "#5b6679", line: "#dfe4ec", "accent-text": "#1b2d5e", accent: "#1b2d5e", card: "#ffffff", fill: "#f3f5f9" }; return s.replace(/var\(--([a-z-]+)\)/g, (m, k) => P[k] || "#1a2547"); }
const PAPER_CSS = `.paper{background:#fff;color:#1a2547;font:14px/1.45 "DM Sans","Segoe UI",Arial,sans-serif;padding:22px;border-radius:12px;text-align:left}
.paper h2{font-size:20px;margin:0 0 2px}.paper h3{font-size:16px;margin:18px 0 6px;border-bottom:2px solid #1b2d5e;padding-bottom:3px}
.paper .meta{color:#5b6679;font-size:12px;margin-bottom:10px}
.paper .hl{background:#e6edfb;border-radius:8px;padding:8px 12px;margin:6px 0}.paper .hl-l{color:#5b6679;font-size:12px;margin-right:8px}.paper .hl-v{font-size:24px;font-weight:700;color:#1b2d5e}.paper .hl-s{color:#5b6679;font-size:12px;margin-left:8px}
.paper table{border-collapse:collapse;width:100%;font-size:13px;margin:6px 0}.paper pre{background:#f3f5f9;padding:8px;border-radius:6px;font:12px/1.4 ui-monospace,Consolas,monospace;white-space:pre-wrap}
.paper .pill{display:inline-block;padding:1px 8px;border-radius:99px;font-size:11px;font-weight:700}.paper .PASS{background:#d7f3de;color:#14532d}.paper .WARN{background:#fff0c2;color:#7a4b00}.paper .FAIL{background:#fddada;color:#8a1212}.paper .INFO{background:#e6edfb;color:#1b2d5e}
.paper svg{max-width:100%;height:auto;display:block;margin:6px auto}.paper .blk{break-inside:avoid;page-break-inside:avoid}.paper .note{color:#5b6679;font-size:12px;margin:2px 0}
@media print{body{margin:0}.paper{padding:0}}`;
(() => { const st = document.createElement("style"); st.textContent = PAPER_CSS; document.head.appendChild(st); })();
const TD = 'style="border-bottom:1px solid #dfe4ec;padding:4px 6px;vertical-align:top;text-align:left"', TDL = 'style="border-bottom:1px solid #dfe4ec;padding:4px 6px;vertical-align:top;color:#5b6679;width:38%;text-align:left"';
const dateStr = () => new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" });
const docHead = t => `<h2>${esc(t)}</h2><div class="meta">${dateStr()} - AV Engineering Assistant v${APP_VERSION} - Created by Andrew Scofield</div>`;

// ---------- svg -> png, copy, print
function svgToPng(svg) {
  return new Promise((res, rej) => {
    svg = lightify(svg); const m = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/); if (!m) return rej(new Error("no viewBox"));
    const w = +m[1], h = +m[2];
    svg = svg.replace(/<svg [^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 2}" height="${h * 2}" style="font-family:Arial,Helvetica,sans-serif">`);
    const img = new Image();
    img.onload = () => { const c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0); c.toBlob(b => b ? res(b) : rej(new Error("png")), "image/png"); };
    img.onerror = () => rej(new Error("svg render")); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}
async function inlinePngs(html) {
  const m = html.match(/<svg[\s\S]*?<\/svg>/g) || [];
  for (const s of m) { try { const b = await svgToPng(s), u = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }), w = +s.match(/viewBox="0 0 (\d+(?:\.\d+)?)/)[1], img = `<img src="${u}" width="${Math.min(w, 560)}" alt="diagram">`; html = html.replace(s, () => img); } catch (e) { } }
  return html;
}
async function richCopy(html, text) {
  html = await inlinePngs(lightify(html));
  try { if (navigator.clipboard && window.ClipboardItem) { await navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([`<meta charset="utf-8"><div style="font-family:Arial,sans-serif;color:#1a2547">${html}</div>`], { type: "text/html" }), "text/plain": new Blob([text], { type: "text/plain" }) })]); toast("Copied - paste into your email or document"); return; } } catch (e) { }
  const d = document.createElement("div"); d.contentEditable = "true"; d.style.cssText = "position:fixed;left:-9999px;top:0;background:#fff;color:#1a2547;width:600px"; d.innerHTML = html; document.body.appendChild(d);
  const rg = document.createRange(); rg.selectNodeContents(d); const sl = getSelection(); sl.removeAllRanges(); sl.addRange(rg); let ok = false; try { ok = document.execCommand("copy"); } catch (e) { } sl.removeAllRanges(); d.remove();
  toast(ok ? "Copied - paste into your email or document" : "Copy was blocked by the browser - use Print / save PDF instead");
}
function printDoc(title, body) {
  const w = window.open("", "_blank"); if (!w) { toast("Pop-up blocked - allow pop-ups for this page, then try again"); return; }
  w.document.write(`<!doctype html><meta charset="utf-8"><title>${esc(title)}</title><style>${PAPER_CSS}body{margin:24px;background:#fff}</style><div class="paper">${lightify(body)}</div><script>setTimeout(function(){print()},500)<\/script>`); w.document.close();
}
function download(name, blob) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
const safeName = s => String(s || "av").replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_") || "av";

// ---------- calculator export blocks
function calcBlock(c, r, dg, o = {}) {
  const h = r.head || [], inputs = o.v ? c.f.filter(f => (f[3] || "num") != "area").map(f => { let x = o.v[f[0]]; if ((f[3] || "num") == "sel") { const op = (f[4] || []).find(q => q.split("|")[0] == x); x = op ? (op.includes("|") ? op.split("|")[1] : op) : x; } return has(+x) || typeof x == "string" ? [f[1], x] : null; }).filter(Boolean) : [];
  return `<div class="blk"><h3>${c.id}. ${esc(c.name)}</h3><div class="hl"><span class="hl-l">${esc(h[0] || "")}</span><span class="hl-v">${esc(h[1] || "-")}${h[2] ? " " + esc(h[2]) : ""}</span><span class="hl-s">${esc(h[3] || "")}</span></div>${dg || ""}
  <table>${(r.stats || []).map(s => `<tr><td ${TDL}>${esc(s[0])}</td><td ${TD}>${esc(s[1])}</td></tr>`).join("")}</table>
  ${!o.brief && o.v ? `<p class="note"><b>Inputs:</b> ${inputs.map(i => `${esc(i[0])} ${esc(i[1])}`).join("; ")}</p>` : ""}
  ${!o.brief && (r.steps || []).length ? `<pre>${esc(r.steps.join("\n"))}</pre>` : ""}${(r.notes || []).map(n => `<p class="note">${esc(n)}</p>`).join("")}</div>`;
}
function calcText(c, r, v) {
  const h = r.head || [];
  return [`${PROJ.name ? PROJ.name + " - " : ""}${c.name}`, `${h[0]}: ${h[1]}${h[2] ? " " + h[2] : ""} ${h[3] ? "(" + h[3] + ")" : ""}`, ""].concat((r.stats || []).map(s => `${s[0]}: ${s[1]}`), [""], (r.steps || []), [""], (r.notes || [])).join("\n");
}
function exportAction(kind) {
  if (!LASTRES) return; const { c, r, v, dg } = LASTRES, doc = docHead(PROJ.name || "AV calculation") + calcBlock(c, r, dg, { v });
  if (kind == "copy") richCopy(doc, calcText(c, r, v)); else if (kind == "print") printDoc(`${c.name}`, doc);
  else if (kind == "png") svgToPng(dg).then(b => { download(`${safeName(c.name)}.png`, b); toast("Diagram saved as PNG"); }).catch(() => toast("Could not render the diagram"));
}

// ---------- project persistence
function projData(full) { const d = { app: "av-engineering-assistant", version: APP_VERSION, saved: new Date().toISOString(), name: PROJ.name, room: ROOM, calcs: PROJ.calcs }; if (full) { d.bom = BOM; d.pull = PULL; } return d; }
function projChanged() { try { localStorage.setItem("av_project", JSON.stringify(projData(false))); } catch (e) { } }
function applyProject(d) {
  if (!d || d.app != "av-engineering-assistant") throw new Error("This is not an AV Engineering Assistant project file");
  PROJ.name = d.name || ""; PROJ.calcs = d.calcs || {};
  ROOM_FIELDS.forEach(f => { const v = d.room && d.room[f[0]]; ROOM[f[0]] = typeof f[2] == "number" ? (v == null || v === "" ? (f[0] == "fv" || f[0] == "nm" || f[0] == "ns" ? NaN : f[2]) : +v) : (v || f[2]); });
}
function refreshProjectUI() { cq("pname").value = PROJ.name || ""; buildRoomForm(); drawPlan(); if (cur) openCalc(cur); }
try { const raw = localStorage.getItem("av_project"); if (raw) applyProject(JSON.parse(raw)); } catch (e) { }

// ---------- room form + plan
function buildRoomForm() {
  cq("proomform").innerHTML = ROOM_FIELDS.map(f => { const sel = f[0] == "ar"; const x = ROOM[f[0]];
    const inp = sel ? `<select id="rf_${f[0]}" class="w-full">${ARS.map(a => `<option ${a == x ? "selected" : ""}>${a}</option>`).join("")}</select>` : `<input id="rf_${f[0]}" type="number" step="any" class="w-full" value="${has(x) ? x : ""}">`;
    const pre = f[0] == "hfov" ? `<span class="pres">${[70, 90, 120, 180].map(d => `<button type="button" class="pre" data-v="${d}">${d}°</button>`).join("")}</span>` : "";
    return `<label class="block text-xs" style="color:var(--mute)">${f[1]}${inp}${pre}</label>`; }).join("");
  ROOM_FIELDS.forEach(f => { const el = cq("rf_" + f[0]); el.oninput = el.onchange = () => { ROOM[f[0]] = f[0] == "ar" ? el.value : parseFloat(el.value); roomDirty = true; projChanged(); drawPlan(); syncHfov(); }; });
  document.querySelectorAll("#proomform .pre").forEach(b => b.onclick = () => { cq("rf_hfov").value = b.dataset.v; cq("rf_hfov").oninput(); });
  syncHfov();
}
function syncHfov() { document.querySelectorAll("#proomform .pre").forEach(b => b.setAttribute("aria-pressed", parseFloat(cq("rf_hfov").value) == +b.dataset.v)); }
let roomDirty = false;
function micGrid() { const v = calcValues(CALCS[3]), r = has(v.dia) ? v.dia / 2 : (v.ch - v.th) * Math.tan(v.ang * DEG / 2); if (!(r > 0)) return null; const s = r * Math.SQRT2; return { r, nx: Math.max(1, Math.ceil(v.rw / s)), ny: Math.max(1, Math.ceil(v.rl / s)) }; }
function spkGrid() { const v = calcValues(CALCS[4]), r = (v.ch - v.ear) * Math.tan(v.ang * DEG / 2); if (!(r > 0)) return null; const s = r * Math.SQRT2; return { r, nx: Math.max(1, Math.ceil(v.rw / s)), ny: Math.max(1, Math.ceil(v.rl / s)) }; }
function roomPlanSvg() {
  const { rw, rl, tw, tl, td } = ROOM; if (!(rw > 0 && rl > 0)) return "";
  const hf = ROOM.hfov, t = Math.tan(Math.min(hf, 179.5) * DEG / 2), s = Math.min(440 / rw, 290 / rl), x0 = (520 - rw * s) / 2, y0 = 34, cx = 260, py = d => y0 + d * s, id = "rp" + (++_cid), ext = rl * t * s;
  const tIn = tw / 2 <= td * t + 1e-9, tc = tIn ? "#16a34a" : "#dc2626";
  let b = `<clipPath id="${id}"><rect x="${x0}" y="${y0}" width="${rw * s}" height="${rl * s}"/></clipPath><path clip-path="url(#${id})" d="M${cx} ${y0} L${cx - ext} ${py(rl)} L${cx + ext} ${py(rl)} Z" style="fill:${ST.acc};fill-opacity:.1"/>`;
  b += RC(x0, y0, rw * s, rl * s, { c: ST.mute, w: 2 });
  const D1 = calcValues(CALCS[0]); const a = aspect(D1.ar), eh = D1.eh / 100; let ih = roomVal("fv") / (D1.k * eh); const iw = Math.min(ih * a, rw * 0.95), diag = ih * 39.3701 * Math.sqrt(1 + a * a);
  const nd = Math.max(1, Math.round(ROOM.nd || 1)), dw = Math.min(iw, rw * 0.95 / nd - 0.1), tot = nd * dw + (nd - 1) * 0.1;
  for (let i = 0; i < nd; i++) b += RC(cx - tot * s / 2 + i * (dw + 0.1) * s, y0 - 7, dw * s, 7, { f: ST.ink, c: ST.ink, r: 1 });
  b += T(cx + tot * s / 2 + 6, y0 - 1, `${nd > 1 ? nd + " x " : "display "}${R(diag, 0)}"`, { a: "start", s: 10, c: ST.mute });
  const n = Math.max(0, Math.round(ROOM.seats)), sp = tl / Math.max(n, 1), tx = cx - tw * s / 2, ty = py(td);
  for (let i = 0; i < n; i++) { const yy = ty + (i + .5) * sp * s; b += RC(tx - 14, yy - 6, 10, 12, { r: 3, c: ST.mute, w: 1 }) + RC(tx + tw * s + 4, yy - 6, 10, 12, { r: 3, c: ST.mute, w: 1 }); }
  b += RC(tx, ty, tw * s, tl * s, { f: tc, op: .25, c: tc, w: 2, r: 4 });
  b += `<g clip-path="url(#${id})">` + LN(cx, y0, cx - ext, py(rl), { c: ST.acc, w: 1.5 }) + LN(cx, y0, cx + ext, py(rl), { c: ST.acc, w: 1.5 }) + `</g>` + RC(cx - 14, y0 + 2, 28, 6, { f: ST.acc, c: ST.acc, r: 2 });
  const sg = spkGrid(), mg = micGrid();
  if (sg) for (let i = 0; i < sg.nx; i++) for (let j = 0; j < sg.ny; j++) b += `<circle cx="${x0 + (i + .5) * rw / sg.nx * s}" cy="${y0 + (j + .5) * rl / sg.ny * s}" r="5" style="fill:none;stroke:${ST.mute};stroke-width:1.5;stroke-dasharray:2 2"/>`;
  if (mg) for (let i = 0; i < mg.nx; i++) for (let j = 0; j < mg.ny; j++) { const x = x0 + (i + .5) * rw / mg.nx * s, y = y0 + (j + .5) * rl / mg.ny * s; b += `<path d="M${x} ${y - 5} L${x + 5} ${y} L${x} ${y + 5} L${x - 5} ${y} Z" style="fill:#d97706"/>`; }
  const ly = py(rl) + 18;
  b += T(30, ly, `${R(rw)} x ${R(rl)} m, ceiling ${R(ROOM.ch)} m`, { a: "start", s: 11, c: ST.mute }) + `<path d="M232 ${ly - 9} l5 5 l-5 5 l-5 -5 Z" style="fill:#d97706"/>` + T(242, ly, `mic ${mg ? mg.nx * mg.ny : "-"}`, { a: "start", s: 11 }) + `<circle cx="305" cy="${ly - 4}" r="5" style="fill:none;stroke:${ST.mute};stroke-width:1.5;stroke-dasharray:2 2"/>` + T(315, ly, `speaker ${sg ? sg.nx * sg.ny : "-"}`, { a: "start", s: 11 }) + T(405, ly, `camera ${R(hf, 0)}°`, { a: "start", s: 11, c: ST.acc });
  return SV(520, ly + 12, b);
}
function drawPlan() { try { cq("pplan").innerHTML = roomPlanSvg(); } catch (e) { cq("pplan").innerHTML = ""; } }

// ---------- design checklist
function designChecks() {
  const out = [], add = (sev, area, rule, detail) => out.push({ sev, area, rule, detail });
  try { // display
    const v = calcValues(CALCS[0]); v.u = "m"; v.fv = roomVal("fv"); const a = aspect(v.ar), k = Math.sqrt(1 + a * a); let ih = v.fv / (v.k * v.eh / 100); if (v.m == "ADM") ih = Math.max(ih, v.fv / 4);
    const diag = ih * 39.3701 * k, pick = STD_DIAG.find(d => d >= diag - 1e-9), cl = 1.4 * ih * a;
    add(pick ? "PASS" : "FAIL", "Display", "A standard panel size exists", pick ? `Needs ${R(diag, 0)}" - nearest standard panel ${pick}".` : `Needs ${R(diag, 0)}" which is larger than a 110" panel. Use a video wall or projection.`);
    const nd = Math.max(1, Math.round(ROOM.nd || 1)); if (nd > 1) add(nd * ih * a + (nd - 1) * 0.1 <= ROOM.rw * 0.95 ? "PASS" : "FAIL", "Display", `${nd} displays fit on the front wall`, `${nd} x ${R(ih * a)} m wide = ${R(nd * ih * a + (nd - 1) * 0.1)} m against a ${R(ROOM.rw)} m wall.`);
    add(ROOM.td >= cl ? "PASS" : "WARN", "Display", "Nearest viewer is not too close", `Nearest seat ${R(ROOM.td)} m from the display wall; 1.4 x image width = ${R(cl)} m.`);
  } catch (e) { }
  try { // camera
    const v = calcValues(CALCS[2]), t = Math.tan(Math.min(v.h, 179.5) * DEG / 2), tIn = v.tw / 2 <= v.td * t + 1e-9, cIn = v.tw / 2 + .45 <= (v.td + v.tl / Math.max(v.sn, 1) / 2) * t + 1e-9, wallW = 2 * v.rl * t;
    add(tIn ? "PASS" : "FAIL", "Camera", "Whole table is in view", tIn ? `${R(v.h, 0)}° HFOV covers the front corners of the table.` : `Front corners are outside the ${R(v.h, 0)}° FOV. Move the table back to at least ${R(v.tw / 2 / t)} m or use a wider lens.`);
    add(cIn ? "PASS" : "WARN", "Camera", "Front seats are in view", cIn ? "First seats on each side are inside the FOV." : "The first seats beside the table are outside the FOV.");
    add(v.h >= 179 || wallW >= v.rw ? "PASS" : "INFO", "Camera", "Camera sees the full room width at the back wall", `${v.h >= 179 ? "180° lens" : R(wallW) + " m of " + R(v.rw) + " m"}.`);
  } catch (e) { }
  const grid = (name, i, key, gridFn) => { try { const g = gridFn(), v = calcValues(CALCS[i]); if (!g) { add("WARN", name, "Coverage can be calculated", "Check the coverage angle or datasheet diameter."); return; } const need = g.nx * g.ny, n = ROOM[key];
    if (has(n)) { add(n >= need ? (n > need * 1.5 ? "WARN" : "PASS") : "FAIL", name, "Planned count covers the room", `${n} planned, ${need} needed for even coverage.${n > need * 1.5 ? " Well above what is needed." : ""}`); const sp = Math.sqrt(v.rw * v.rl / n);
      add(sp <= g.r * Math.SQRT2 + 1e-6 ? "PASS" : sp <= 2 * g.r ? "WARN" : "FAIL", name, i == 3 ? "Ceiling mic spacing" : "Coverage overlap", `Average spacing ${R(sp)} m; even coverage needs <= ${R(g.r * Math.SQRT2)} m, edge-to-edge limit ${R(2 * g.r)} m.${sp > 2 * g.r ? " There are gaps in coverage." : sp > g.r * Math.SQRT2 ? " Dips between units." : ""}`); }
    else add("INFO", name, "Count", `${need} needed for even coverage. Enter your planned count in the room to check it.`); } catch (e) { } };
  grid("Microphones", 3, "nm", micGrid); grid("Speakers", 4, "ns", spkGrid);
  try { const M = calcValues(CALCS[3]); add(M.ch - M.th >= 1 ? "PASS" : "WARN", "Microphones", "Ceiling mic height above talkers", `${R(M.ch - M.th)} m between mic and talker mouth.`); } catch (e) { }
  try { // acoustics
    const v = calcValues(CALCS[13]), V = v.L * v.W * v.H, Sf = v.L * v.W, Sw = 2 * (v.L + v.W) * v.H, A = Sf * v.af + Sf * v.ac + Sw * v.aw + v.ex, sab = 0.161 * V / A, dc = 0.057 * Math.sqrt(v.Q * V / sab);
    add(sab <= v.tg ? "PASS" : sab <= v.tg * 1.25 ? "WARN" : "FAIL", "Acoustics", "RT60 meets the target", `${R(sab)} s calculated (Sabine) against ${R(v.tg)} s.`);
    const mg = micGrid(), dmax = mg ? Math.sqrt((ROOM.rw / mg.nx / 2) ** 2 + (ROOM.rl / mg.ny / 2) ** 2 + (v.H - ROOM.th) ** 2) : roomVal("fv");
    add(dmax <= dc ? "PASS" : "WARN", "Acoustics", "Talkers are inside the critical distance of the nearest mic", `Critical distance ${R(dc)} m; worst-case talker to nearest ceiling mic ${R(dmax)} m.${dmax > dc ? " Reverberant sound will dominate - add absorption or more mics." : ""}`);
    add(ROOM.ch >= 2.4 ? "PASS" : "WARN", "Room", "Ceiling height", `${R(ROOM.ch)} m.`);
  } catch (e) { }
  // BOM
  if (!BOM.length) add("INFO", "BOM", "No BOM loaded", "Load a BOM on the first tab to include PoE, Dante, AVoIP and cable checks.");
  else [["PoE", "PoE headroom and class"], ["Dante", "Dante channels and routing"], ["AVoIP", "AVoIP uplinks"], ["Cable", "Cable length and pull sheet"], ["Data", "Data checks"]].forEach(([cat, title]) => {
    const fs = LAST_AUDIT.filter(f => f[1] == cat), bad = fs.filter(f => f[0] == "CRITICAL" || f[0] == "ERROR"), warn = fs.filter(f => f[0] == "WARNING");
    if (!fs.length) { if (!PULL.length && cat != "PoE" && cat != "Data") add("INFO", "BOM", title, "No pull sheet loaded, so this check was skipped."); else if (cat != "Data") add("PASS", "BOM", title, "No issues found."); return; }
    const w = bad.length ? "FAIL" : warn.length ? "WARN" : "INFO", first = (bad.length ? bad : warn.length ? warn : fs).slice(0, 2).map(f => `${f[2]}: ${f[3]}`).join(" | ");
    add(w, "BOM", title, `${bad.length} error(s), ${warn.length} warning(s). ${first}`); });
  return out;
}
function checksHtml(list) {
  const n = k => list.filter(x => x.sev == k).length;
  return `<div class="blk"><h3>Design checklist</h3><p class="note">${n("FAIL")} fail, ${n("WARN")} warning, ${n("PASS")} pass, ${n("INFO")} note. Generated from the room design${BOM.length ? " and the loaded BOM" : ""}.</p>
  <table>${list.map(x => `<tr><td ${TD} width="62"><span class="pill ${x.sev}">${x.sev}</span></td><td ${TD} width="110"><b>${esc(x.area)}</b></td><td ${TD}>${esc(x.rule)}<br><span class="note">${esc(x.detail)}</span></td></tr>`).join("")}</table></div>`;
}
function roomSummaryHtml() {
  let h = docHead(PROJ.name || "Room design summary"); const R_ = ROOM;
  h += `<h3>Room</h3>${roomPlanSvg()}<table>${[["Room", `${R(R_.rw)} x ${R(R_.rl)} m, ceiling ${R(R_.ch)} m`], ["Table", `${R(R_.tw)} x ${R(R_.tl)} m, ${R(R_.td)} m from the camera wall`], ["Farthest viewer", `${R(roomVal("fv"))} m`], ["Camera", `${R(R_.hfov, 0)}° HFOV`], ["Display", `${R_.ar}, ${R_.eh}% element height`], ["Displays", `${Math.max(1, Math.round(R_.nd || 1))}`], ["Microphones / speakers", `${has(R_.nm) ? R_.nm : "calculated"} / ${has(R_.ns) ? R_.ns : "calculated"}`]].map(r => `<tr><td ${TDL}>${r[0]}</td><td ${TD}>${r[1]}</td></tr>`).join("")}</table>`;
  [1, 2, 3, 4, 5, 14].forEach(id => { const c = CALCS.find(x => x.id == id); try { const v = calcValues(c), r = c.run(v); let dg = ""; try { dg = VIZ[id] ? VIZ[id](v) : ""; } catch (e) { } h += calcBlock(c, r, dg, { brief: true }); } catch (e) { } });
  return h + checksHtml(designChecks());
}
let OUT = null;
function showOut(title, html, text) {
  OUT = { title, html, text }; cq("pout").innerHTML = `<div class="flex flex-wrap gap-2 mb-3"><button class="btn alt" id="ocopy">Copy to clipboard</button><button class="btn alt" id="oprint">Print / save PDF</button></div><div class="paper" id="opaper">${lightify(html)}</div>`;
  cq("ocopy").onclick = () => richCopy(OUT.html, cq("opaper").innerText); cq("oprint").onclick = () => printDoc(OUT.title, OUT.html);
}

// ---------- wire up
cq("pname").oninput = () => { PROJ.name = cq("pname").value; projChanged(); };
cq("pchk").onclick = () => showOut("Design checklist", docHead(PROJ.name || "Design checklist") + checksHtml(designChecks()));
cq("psumb").onclick = () => showOut("Room summary", roomSummaryHtml());
cq("ppdf").onclick = () => printDoc(`${PROJ.name ? "Job " + PROJ.name + " - " : ""}Room design`, roomSummaryHtml());
cq("psave").onclick = () => { download(`${safeName(PROJ.name)}.avproject.json`, new Blob([JSON.stringify(projData(true), null, 1)], { type: "application/json" })); toast("Project saved to your downloads folder"); };
cq("pload").onchange = async e => { const f = e.target.files[0]; if (!f) return; try { const d = JSON.parse(await f.text()); applyProject(d); if (Array.isArray(d.bom)) { BOM = d.bom; PULL = Array.isArray(d.pull) ? d.pull : []; progress(); if (BOM.length) runAudit(); } projChanged(); refreshProjectUI(); cq("pout").innerHTML = ""; toast(`Loaded "${PROJ.name || f.name}"`); } catch (err) { toast("Could not load: " + err.message); } e.target.value = ""; };
cq("pnew").onclick = () => { if (!confirm("Start a new project? Unsaved room and calculator values will be cleared (save first if you need them).")) return; PROJ.name = ""; PROJ.calcs = {}; ROOM_FIELDS.forEach(f => ROOM[f[0]] = f[2]); BOM = []; PULL = []; LAST_AUDIT = []; progress(); cq("audit").innerHTML = ""; projChanged(); refreshProjectUI(); cq("pout").innerHTML = ""; };
document.querySelectorAll(".tab").forEach(b => b.addEventListener("click", () => { if (b.dataset.t == "t2" && roomDirty) { roomDirty = false; if (cur) openCalc(cur); } if (b.dataset.t == "t5") drawPlan(); }));
refreshProjectUI();
