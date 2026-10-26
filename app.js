const $ = id => document.getElementById(id);
let BOM = [], PULL = [], PAGES = [];
document.querySelectorAll(".tab").forEach(b => b.onclick = () => { document.querySelectorAll(".tab").forEach(x => x.setAttribute("aria-selected", x == b)); ["t1","t2","t3","t4"].forEach(t => $(t).hidden = t != b.dataset.t); document.querySelector(".bar").style.display = ["t1","t3"].includes(b.dataset.t) ? "" : "none"; });
// ---------- parsing
const g = (r, ...n) => { for (const k in r) if (n.includes(nk(k)) && String(r[k]).trim() !== "") return String(r[k]).trim(); return ""; };
const num = (r, ...n) => parseFloat(g(r, ...n)) || 0;
async function load(files) {
  for (const f of [...files].filter(f => /\.(xlsx|xlsm|xls|csv)$/i.test(f.name))) {
    let wb; try { wb = XLSX.read(await f.arrayBuffer(), { type: "array", bookVBA: false }); } catch (e) { $("audit").innerHTML = `<p class="p-2 rounded" style="background:var(--s-crit)">Could not read ${f.name}: ${e.message}. If it is open in Excel, save a copy and try again.</p>`; continue; }
    for (const s of wb.SheetNames) {
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[s], { defval: "" }); if (!rows.length) continue;
      const keys = Object.keys(rows[0]).map(nk);
      if (keys.includes("cableid") || keys.includes("cable")) PULL = rows;
      else if (keys.includes("brand") && keys.includes("code") && keys.includes("description") && !WIDE.length) WIDE = rows;
      else if (keys.some(k => ["id", "deviceid", "componentid", "tag", "make", "model"].includes(k))) BOM = rows;
    }
  }
  pickRoom(); progress(); if (!WIDE.length || BOM.length) { $("audit").innerHTML = ""; runAudit(); }
}
$("files").onchange = e => load(e.target.files);
$("drop").ondragover = e => e.preventDefault();
$("drop").ondrop = e => { e.preventDefault(); load(e.dataTransfer.files); };
// ---------- Module A: audit
function dev(r) {
  const id = g(r, "id", "deviceid", "componentid", "tag"), make = g(r, "make", "manufacturer"), model = g(r, "model");
  const desc = g(r, "description"), db = lookup(make, model, desc) || {}, cat = g(r, "category", "type");
  return { id, make, model, cat, sw: g(r, "switch", "switchid"), qty: num(r, "qty", "quantity") || 1, poe: normPoe(g(r, "poeclass", "poe")) || db.poe || null,
    isSw: /switch(?!er)/i.test(cat + model), budget: num(r, "poebudgetw"), ports: num(r, "portstotal", "ports"), maxPoe: normPoe(g(r, "maxpoeclass")), uplink: num(r, "uplinkgbps"),
    dTx: num(r, "dantetxch", "dantetx") || db.dante || 0, mbps: num(r, "avoipmbps") || db.mbps || 0, role: g(r, "avoiprole").toLowerCase(), speed: num(r, "portspeedgbps"),
    ru: num(r, "ru") || db.ru || 1, kg: db.kg || (/ups|amp/i.test(cat + model) ? 30 : 5), ip: g(r, "ipaddress", "ip"), vlan: g(r, "vlan"), known: !!lookup(make, model, desc) };
}
function runAudit() {
  const D = BOM.map(dev), F = [], add = (s, c, i, m) => F.push([s, c, i, m]), ids = new Set(D.map(d => d.id)), by = Object.fromEntries(D.map(d => [d.id, d]));
  const P = PULL.map(r => ({ id: g(r, "cableid", "cable"), type: g(r, "cabletype", "media"), sig: g(r, "signaltype", "signal"), s: g(r, "sourceid", "source", "from"), d: g(r, "destid", "destination", "dest", "to"), len: num(r, "lengthm", "length"), ch: num(r, "channels") }));
  const rank = { af: 1, at: 2, bt3: 3, bt4: 4 };
  D.filter(d => d.isSw).forEach(s => { // PoE
    const kids = D.filter(d => d.sw == s.id && !d.isSw); let w = 0, n = 0;
    kids.forEach(d => { n += d.qty; if (POE_W[d.poe]) { w += POE_W[d.poe] * d.qty; if (s.maxPoe && rank[d.poe] > rank[s.maxPoe]) add("ERROR", "PoE", d.id, `needs ${d.poe} but ${s.id} ports max ${s.maxPoe}`); } else if (!d.poe && d.known) add("INFO", "PoE", d.id, "PoE class unknown - add PoE_Class"); });
    if (s.budget && w > s.budget) add("CRITICAL", "PoE", s.id, `${w.toFixed(0)} W exceeds ${s.budget} W budget`); else if (s.budget && w > .8 * s.budget) add("WARNING", "PoE", s.id, `${w.toFixed(0)} W is ${(100 * w / s.budget).toFixed(0)}% of budget (limit 80%)`);
    if (s.ports && n > s.ports) add("ERROR", "PoE", s.id, `${n} devices on ${s.ports} ports`);
  });
  D.filter(d => d.sw && !D.some(s => s.id == d.sw && s.isSw)).forEach(d => add("ERROR", "PoE", d.id, `switch '${d.sw}' not in schedule`));
  D.filter(d => d.dTx).forEach(d => { // Dante
    const rows = P.filter(p => p.s == d.id && /dante|aes67/i.test(p.sig + p.type)), ch = rows.reduce((a, p) => a + p.ch, 0);
    if (!rows.length) add("ERROR", "Dante", d.id, `${d.dTx} Dante TX channels, no receiver mapped`); else if (ch < d.dTx) add("WARNING", "Dante", d.id, `${d.dTx - ch} of ${d.dTx} TX channels unrouted`);
  });
  const eg = {}, ing = {}; // AVoIP
  [...new Set(P.filter(p => /avoip|nvx|nav/i.test(p.sig + p.type)).map(p => p.s))].forEach(e => {
    const bw = (by[e] && by[e].mbps) || 850, ds = P.filter(p => p.s == e && /avoip|nvx|nav/i.test(p.sig + p.type)).map(p => by[p.d] ? by[p.d].sw : ""), se = by[e] ? by[e].sw : "", rem = [...new Set(ds)].filter(x => x != se);
    if (rem.length) { eg[se] = (eg[se] || 0) + bw; rem.forEach(x => ing[x] = (ing[x] || 0) + bw); }
    if (by[e] && by[e].speed == 1 && bw > 900) add("ERROR", "AVoIP", e, `${bw} Mbps saturates a 1G port`);
  });
  D.filter(d => d.isSw && d.uplink).forEach(s => { const pk = Math.max(eg[s.id] || 0, ing[s.id] || 0), cap = s.uplink * 1000;
    if (pk > cap) add("CRITICAL", "AVoIP", s.id, `${pk} Mbps multicast exceeds ${s.uplink}G uplink`); else if (pk > .8 * cap) add("WARNING", "AVoIP", s.id, `${pk} Mbps is ${(100 * pk / cap).toFixed(0)}% of ${s.uplink}G uplink`); });
  const seen = new Set();
  P.forEach((p, i) => { const id = p.id || `row ${i + 2}`, t = (p.type + " " + p.sig).toLowerCase(), L = p.len;
    if (seen.has(p.id)) add("ERROR", "Cable", id, "duplicate Cable_ID"); seen.add(p.id);
    [["source", p.s], ["destination", p.d]].forEach(([k, v]) => { if (!v) add("ERROR", "Cable", id, `orphan - missing ${k}`); else if (!ids.has(v)) add("ERROR", "Cable", id, `${k} '${v}' not in schedule`); });
    const ext = /hdbaset|dtp|xtp|fib|aoc|icron|extend/.test(t), act = /active|aoc/.test(t);
    if (/hdmi/.test(t) && !ext) { if (L > LIMITS.hdmiActive) add("ERROR", "Cable", id, `HDMI ${L} m > ${LIMITS.hdmiActive} m, use HDBaseT/DTP/fibre`); else if (L > LIMITS.hdmiPassive && !act) add("WARNING", "Cable", id, `passive HDMI ${L} m > ${LIMITS.hdmiPassive} m`); }
    else if (/usb/.test(t) && !/icron|extend|fib/.test(t)) { const lim = act ? LIMITS.usbActive : /usb\s*3|3\.\d/.test(t) ? LIMITS.usb3 : /usb-?c/.test(t) ? LIMITS.usbc : LIMITS.usb2; if (L > lim) add("ERROR", "Cable", id, `USB ${L} m > ${lim} m without active extension`); }
    else if (/cat|utp|dante|avoip|network/.test(t)) { if (L > LIMITS.cat) add("ERROR", "Cable", id, `${L} m > 100 m`); else if (L > LIMITS.catWarn) add("WARNING", "Cable", id, `${L} m leaves little patch margin`); }
  });
  const unk = D.filter(d => !d.known && !d.isSw), bc = {}; unk.forEach(d => bc[d.make || "(no brand)"] = (bc[d.make || "(no brand)"] || 0) + 1);
  if (unk.length) add("INFO", "Data", "specs", `${unk.length} of ${D.length} lines have no spec in brands.js. Most lines: ${Object.entries(bc).sort((a, b) => b[1] - a[1]).slice(0, 8).map(e => e[0] + " " + e[1]).join(", ")}`);
  if (D.length && !D.some(d => d.isSw)) { let w = 0, n = 0; D.forEach(d => { if (POE_W[d.poe]) { w += POE_W[d.poe] * d.qty; n += d.qty; } });
    if (n) add("INFO", "PoE", "no switch in BOM", `${n} PoE devices need ${w.toFixed(0)} W (class allocation) - no switch listed, so budget not checked. Size the switch for at least ${(w / 0.8).toFixed(0)} W.`); }
  const o = { CRITICAL: 0, ERROR: 1, WARNING: 2, INFO: 3 }; F.sort((a, b) => o[a[0]] - o[b[0]]);
  const cnt = k => F.filter(f => f[0] == k).length, room = $("roomrow").hidden ? "" : ` from "${$("room").value}"`;
  const head = `<p class="mb-2 text-sm"><b>${D.length} equipment lines${room}</b>, ${P.length} cables. ${cnt("CRITICAL")} critical, ${cnt("ERROR")} errors, ${cnt("WARNING")} warnings, ${cnt("INFO")} notes.${P.length ? "" : " No cable pull sheet loaded, so cable, Dante and AVoIP checks were skipped."}</p>`;
  const list = D.length ? `<details class="mt-3 text-sm"><summary class="cursor-pointer font-semibold">Loaded equipment (${D.length})</summary><table class="w-full mt-1">${D.map(d => `<tr class="border-b"><td class="p-1">${d.qty}x</td><td>${d.make}</td><td>${d.model}</td><td>${d.poe && d.poe != "none" ? "PoE " + d.poe : ""}</td><td>${d.known ? "" : "no spec"}</td></tr>`).join("")}</table></details>` : "";
  $("audit").innerHTML = head + (F.length ? `<table class="w-full text-sm">${F.map(f => `<tr class="sev-${f[0]} border-b"><td class="p-1">${f[0]}</td><td>${f[1]}</td><td>${f[2]}</td><td>${f[3]}</td></tr>`).join("")}</table>` : "No findings.") + list;
}
$("tpl").onclick = () => { const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ ID: "SW01", Make: "Generic", Model: "PoE Switch", Category: "Switch", PoE_Budget_W: 200, Ports_Total: 24, Max_PoE_Class: "at", Uplink_Gbps: 10 }, { ID: "MIC01", Make: "Shure", Model: "MXA920", Category: "Mic", Switch: "SW01", RU: "", IP_Address: "10.0.10.21", VLAN: 10 }, { ID: "DSP01", Make: "Q-SYS", Model: "Core 110f", Category: "DSP", Switch: "SW01", IP_Address: "10.0.10.2", VLAN: 10 }]), "BOM");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ Cable_ID: "C001", Cable_Type: "Cat6a", Signal_Type: "Dante", Source_ID: "MIC01", Dest_ID: "DSP01", Length_m: 35, Channels: 8 }, { Cable_ID: "C002", Cable_Type: "HDMI passive", Signal_Type: "Video", Source_ID: "DSP01", Dest_ID: "DISP01", Length_m: 7 }]), "Cables");
  XLSX.writeFile(wb, "AV_BOM_and_Cable_Template.xlsx"); };
// ---------- Module C: Visio export
function layout() { // bottom-to-top: heavy first, 1RU gap after each group
  const D = BOM.map(dev).filter(d => !d.isSw || true), heavy = D.filter(d => /ups|amp/i.test(d.cat + d.model)), rest = D.filter(d => !heavy.includes(d)).sort((a, b) => b.kg - a.kg);
  let ru = 1; const out = []; [heavy, rest].forEach(grp => { grp.forEach((d, i) => { if (ru + d.ru - 1 > 42) { d.RU = "OVERFLOW"; } else { d.RU = ru; ru += d.ru; } out.push(d); if ((i + 1) % 4 == 0) ru++; }); ru++; }); return out;
}
$("vx").onclick = () => { if (!BOM.length) return $("vmsg").textContent = "Load a BOM on the audit tab first.";
  const L = layout(), conn = id => PULL.map(r => [g(r, "sourceid", "source", "from"), g(r, "destid", "destination", "dest", "to"), g(r, "cabletype", "media")]).filter(c => c[0] == id || c[1] == id);
  const rows = L.map(d => { const c = conn(d.id); return { Component_ID: d.id, Make: d.make, Model: d.model, RU: d.RU, IP_Address: d.ip, VLAN: d.vlan, PoE_W: POE_W[d.poe] || 0, Connected_To: c.map(x => x[0] == d.id ? x[1] : x[0]).join("; "), Cable_Type: [...new Set(c.map(x => x[2]))].join("; ") }; });
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Components");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(PULL.map(r => ({ Cable_ID: g(r, "cableid", "cable"), From: g(r, "sourceid", "source", "from"), To: g(r, "destid", "destination", "dest", "to"), Cable_Type: g(r, "cabletype", "media"), Length_m: g(r, "lengthm", "length") }))), "Connections");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(L.filter(d => d.RU != "OVERFLOW").map(d => ({ RU_Start: d.RU, RU_Height: d.ru, Label: `${d.id} ${d.make} ${d.model}` }))), "Rack_Elevation");
  XLSX.writeFile(wb, "Visio_Data_Visualizer.xlsx"); $("vmsg").textContent = `${rows.length} components exported.` + (L.some(d => d.RU == "OVERFLOW") ? " Some devices overflow 42U." : ""); };
$("vb").onclick = () => { if (!BOM.length) return $("vmsg").textContent = "Load a BOM on the audit tab first.";
  const q = s => String(s).replace(/"/g, '""'), L = layout().filter(d => d.RU != "OVERFLOW");
  const bas = `Attribute VB_Name = "RackElevation"\r\n' Generated by AV Engineering Assistant. Import into Visio (Alt+F11 > File > Import), run DrawRack.\r\nOption Explicit\r\nDim pg As Visio.Page\r\nConst RUH As Double = 1.75, RW As Double = 19#\r\n` +
    `Sub Dev(ru As Long, h As Long, lbl As String)\r\n  Dim s As Visio.Shape\r\n  Set s = pg.DrawRectangle(1#, (ru - 1) * RUH + 1#, 1# + RW, (ru - 1 + h) * RUH + 1#)\r\n  s.Text = lbl: s.CellsU("FillForegnd").FormulaU = "RGB(220,230,242)"\r\nEnd Sub\r\n` +
    `Sub DrawRack()\r\n  Dim i As Long, t As Visio.Shape\r\n  Set pg = ActivePage\r\n  pg.DrawRectangle 1#, 1#, 1# + RW, 42 * RUH + 1#\r\n  For i = 1 To 42\r\n    Set t = pg.DrawRectangle(0.2, (i - 1) * RUH + 1#, 0.9, i * RUH + 1#): t.Text = CStr(i): t.LineStyle = "None"\r\n  Next i\r\n` +
    L.map(d => `  Dev ${d.RU}, ${d.ru}, "${q(d.id + " " + d.make + " " + d.model)}"\r\n`).join("") + `End Sub\r\n`;
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([bas], { type: "text/plain" })); a.download = "RackElevation.bas"; a.click(); $("vmsg").textContent = `Rack macro written for ${L.length} devices (RU 1 = bottom).`; };
// ---------- Module D: PDFs + Claude
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
$("key").value = localStorage.getItem("av_key") || ""; $("key").onchange = e => localStorage.setItem("av_key", e.target.value);
async function readPdf(name, buf) { const pdf = await pdfjsLib.getDocument({ data: buf }).promise; for (let i = 1; i <= pdf.numPages; i++) { const tc = await (await pdf.getPage(i)).getTextContent(); PAGES.push({ name, page: i, text: tc.items.map(x => x.str).join(" ") }); } $("pmsg").textContent = `${PAGES.length} pages indexed`; }
$("pdfs").onchange = async e => { for (const f of e.target.files) await readPdf(f.name, await f.arrayBuffer()); };
$("srv").onclick = async () => { try { for (const n of await (await fetch("manuals/index.json")).json()) await readPdf(n, await (await fetch("manuals/" + encodeURIComponent(n))).arrayBuffer()); } catch (e) { $("pmsg").textContent = "No manuals/index.json (a JSON array of PDF file names) found."; } };
$("ask").onclick = async () => { const q = $("q").value, terms = q.toLowerCase().split(/\W+/).filter(w => w.length > 2);
  const top = PAGES.map(p => ({ p, s: terms.reduce((a, t) => a + (p.text.toLowerCase().split(t).length - 1), 0) })).filter(x => x.s).sort((a, b) => b.s - a.s).slice(0, 6).map(x => x.p);
  if (!top.length) return $("ans").textContent = "No matching pages. Load manuals first or rephrase.";
  const cites = top.map(p => `${p.name} p.${p.page}`).join("\n"), key = $("key").value;
  if (!key) return $("ans").textContent = "Top pages (add an API key for an answer):\n" + cites + "\n\n" + top.map(p => p.text.slice(0, 400)).join("\n---\n");
  $("ans").textContent = "Asking Claude...";
  try { const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 1000, system: "Answer only from the manual excerpts. Cite file and page. Say so if the answer is not in them.", messages: [{ role: "user", content: top.map(p => `[${p.name} p.${p.page}]\n${p.text.slice(0, 3500)}`).join("\n\n") + "\n\nQuestion: " + q }] }) });
    const j = await r.json(); $("ans").textContent = (j.content ? j.content.map(c => c.text).join("") : JSON.stringify(j)) + "\n\nSources searched:\n" + cites; } catch (e) { $("ans").textContent = "API error: " + e.message; } };

function progress() { $("loaded").textContent = `${BOM.length} devices, ${PULL.length} cables loaded`; $("prog").style.width = (BOM.length ? 50 : 0) + (PULL.length ? 50 : 0) + "%"; }
$("clr").onclick = () => { BOM = []; PULL = []; WIDE = []; $("roomrow").hidden = true; $("audit").innerHTML = ""; $("vmsg").textContent = ""; progress(); };
$("rerun").onclick = () => { if (BOM.length || PULL.length) runAudit(); };

// ---------- estimating-BOM import (SKS format: one column per room/scenario)
let WIDE = [];
function pickRoom() {
  const row = $("roomrow"); if (!WIDE.length) { row.hidden = true; return; }
  const keys = Object.keys(WIDE[0]), i = keys.findIndex(k => nk(k) == "margin");
  const eq = WIDE.filter(r => g(r, "code") && g(r, "code") !== "0" && (g(r, "brand") || g(r, "description")) && !/do not use/i.test(g(r, "category")));
  const rooms = keys.slice(i + 1).filter(k => !/^\s*(total|freight|__empty)|do not change/i.test(k) && !/\.\d+$/.test(k) && eq.some(r => parseFloat(r[k]) > 0));
  if (!rooms.length) { row.hidden = true; BOM = []; $("audit").innerHTML = `<p class="p-3 rounded" style="background:var(--s-warn)">This estimating workbook has ${eq.length} equipment lines but no quantities entered in any room or scenario column, so there is nothing to audit yet. Enter quantities on the BOM sheet, or load a schedule with ID, Make, Model and Qty columns.</p>`; return; }
  $("room").innerHTML = rooms.map(r => `<option>${r}</option>`).join(""); $("room").value = rooms[0]; row.hidden = false; buildWide();
}
function buildWide() {
  const room = $("room").value, seen = new Set();
  BOM = WIDE.filter(r => { const c = g(r, "code"); return c && c !== "0" && !/do not use|^services$/i.test(g(r, "category")) && parseFloat(r[room]) > 0 && (g(r, "brand") || g(r, "description")); })
    .map(r => { let id = g(r, "code"); if (seen.has(id)) id += "#" + seen.size; seen.add(id);
      return { ID: id, Make: g(r, "brand"), Model: g(r, "code"), Description: g(r, "description"), Category: g(r, "subcategory", "category"), Qty: parseFloat(r[room]) }; });
}
$("room").onchange = () => { buildWide(); progress(); runAudit(); };
