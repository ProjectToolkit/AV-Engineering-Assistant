// AV Engineering Assistant - calculators (list page + one page per calculator).
// Field: [key, label, default, type("num"|"sel"|"area"), options, {h: hint, p: [[label,value],...] presets}]
// run(v) returns {head:[label,value,unit,sub], stats:[[label,value]], steps:[lines], notes:[lines], ref:{title,items}}
// Constants are planning values - confirm against datasheets and the relevant standard for the job.
const cq = id => document.getElementById(id);
const R = (v, d = 2) => Number.isFinite(v) ? (+v).toFixed(d) : "-";
const L10 = Math.log10, DEG = Math.PI / 180, has = x => Number.isFinite(x);
const STD_DIAG = [32, 43, 50, 55, 65, 75, 86, 98, 100, 110];
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const OHM = { 1.5: 12.1, 2.5: 7.41, 4: 4.61, 6: 3.08, 10: 1.83, 16: 1.15 };   // ohm/km copper @20C
const MM = ["1.5", "2.5", "4", "6", "10", "16"];
const ARS = ["16:9", "16:10", "4:3", "21:9"];
const aspect = s => { const [w, h] = String(s).split(":").map(Number); return w / h; };
const lines = t => String(t || "").split("\n").map(s => s.trim()).filter(Boolean);
// ---------- room model (shared by the Project tab and the calculators)
const ROOM_FIELDS = [["rw", "Room width (m)", 6], ["rl", "Room length (m)", 8], ["ch", "Ceiling height (m)", 2.7], ["tw", "Table width, across the room (m)", 1.2], ["tl", "Table length, away from the camera (m)", 3.6],
  ["td", "Camera wall to nearest table edge (m)", 1.0], ["seats", "Seats along each side of the table", 6], ["fv", "Farthest viewer (m, blank = far end of table)", NaN], ["ar", "Display aspect ratio", "16:9"], ["eh", "Display % element height", 2.5], ["bot", "Display bottom above floor (m)", 1.0],
  ["hfov", "Camera horizontal FOV (deg)", 90], ["th", "Talker mouth height (m)", 1.2], ["ear", "Listener ear height (m)", 1.2], ["af", "Floor absorption (alpha)", 0.2], ["ac", "Ceiling absorption (alpha)", 0.6], ["aw", "Wall absorption (alpha)", 0.1],
  ["tg", "Target RT60 (s)", 0.5], ["nm", "Planned ceiling mics (optional)", NaN], ["ns", "Planned ceiling speakers (optional)", NaN]];
const ROOM = Object.fromEntries(ROOM_FIELDS.map(f => [f[0], f[2]]));
const PROJ = { name: "", calcs: {} };
// calculator field -> room key
const RMAP = { 1: { fv: "fv", ar: "ar", eh: "eh", bot: "bot" }, 2: { dist: "fv" }, 3: { h: "hfov", ar: "ar", rw: "rw", rl: "rl", tw: "tw", tl: "tl", td: "td", d: "fv", sn: "seats" }, 4: { ch: "ch", th: "th", rw: "rw", rl: "rl" }, 5: { ch: "ch", ear: "ear", rw: "rw", rl: "rl" },
  14: { L: "rl", W: "rw", H: "ch", af: "af", ac: "ac", aw: "aw", tg: "tg" } };
const NOSAVE = { 1: ["u", "cv"] };
const roomVal = k => k == "fv" ? (has(ROOM.fv) ? ROOM.fv : ROOM.td + ROOM.tl) : ROOM[k];
function fieldDefault(c, f) {
  const m = (RMAP[c.id] || {})[f[0]]; if (m) { const x = roomVal(m); if (x !== undefined && !(typeof x == "number" && isNaN(x))) return x; }
  const sv = PROJ.calcs[c.id]; if (sv && f[0] in sv && sv[f[0]] !== null) return sv[f[0]]; return f[2];
}
function calcValues(c) { const v = {}; c.f.forEach(f => { const t = f[3] || "num", x = fieldDefault(c, f); v[f[0]] = t == "num" ? parseFloat(x) : String(x); }); return v; }
const selOpt = (arr, id) => arr.find(o => o.split("|")[0] == String(id).split("|")[0]);

const CALCS = [
  { id: 1, name: "Display size & viewing distance", group: "core", about: "Determine suitable screen sizes for meeting rooms",
    f: [["m", "Viewing method", "BDM", "sel", ["BDM|BDM (Basic Decision Making)", "ADM|ADM (Analytical Decision Making)"]], ["u", "Distance unit", "m", "sel", ["m|Metres", "ft|Feet"]],
      ["fv", "Farthest viewer distance", 4.6, "num", null, { h: "Horizontal distance from display to farthest viewer" }], ["ar", "Aspect ratio", "16:9", "sel", ARS],
      ["eh", "% Element height", 2.5, "num", null, { h: "Smallest critical element as a % of screen height. Typical 1.5% (small text) to 3.5% (large text/graphics).", p: [["1.5% (Fine)", 1.5], ["2.5% (Standard)", 2.5], ["3.5% (Large)", 3.5]] }],
      ["k", "Acuity factor", 200, "num", null, { h: "AVIXA acuity factor used in the BDM formula. Confirm against your copy of the standard." }],
      ["cv", "Closest viewer distance (optional)", NaN], ["bot", "Bottom of screen above floor (m)", 1.0]],
    run: v => { const ft = v.u == "ft", uL = ft ? "ft" : "m", toIn = ft ? 12 : 39.3701, a = aspect(v.ar), k = Math.sqrt(1 + a * a), eh = v.eh / 100;
      let ih = v.fv / (v.k * eh), adm = false; const ih4 = v.fv / 4; if (v.m == "ADM" && ih4 > ih) { ih = ih4; adm = true; }
      const iw = ih * a, diag = ih * toIn * k, pick = STD_DIAG.find(d => d >= diag - 1e-9), cl = 1.4 * iw, ihM = ih * (ft ? 0.3048 : 1);
      const ratio = v.fv / ih;
      return { head: ["Recommended display size", R(diag), "\"", "diagonal"],
        stats: [["Width", `${R(iw)} ${uL}`], ["Height", `${R(ih)} ${uL}`], ["Aspect ratio", v.ar], ["Nearest standard panel", pick ? pick + '"' : "larger than 110\" - video wall or projection"],
          ["Farthest viewer / image height", `${R(ratio, 1)} : 1`], ["Closest viewer (1.4 x width)", `${R(cl)} ${uL}${has(v.cv) ? (v.cv >= cl ? " - OK" : " - too close") : ""}`],
          ["Mounting", `bottom ${R(v.bot)} m, top ${R(v.bot + ihM)} m. Bottom 1.0-1.2 m: ${v.bot >= 1 && v.bot <= 1.2 ? "OK" : "outside range"}`]],
        steps: ["Image Height = Farthest Viewer ÷ (Acuity Factor × %Element Height)", `Image Height = ${v.fv} ÷ (${v.k} × ${eh})`, `Image Height = ${v.fv} ÷ ${R(v.k * eh)} = ${R(v.fv / (v.k * eh))} ${uL}`].concat(v.m == "ADM" ? [`ADM also applies FV <= 4 x IH: ${v.fv} ÷ 4 = ${R(ih4)} ${uL}${adm ? " (this governs)" : ""}`] : []),
        notes: [`Rule-of-thumb check: FV/IH = ${R(ratio, 1)}. The older 4:1 (ADM) and 6:1 (BDM) ratios correspond to %EH of 2% and 3%.`],
        ref: { title: "Common display sizes (width x height)", items: [55, 65, 75, 86, 98, 100, 110, 120].map(d => `${d}" = ${R(d / k * a, 0)}" x ${R(d / k, 0)}"`) } }; } },
  { id: 2, name: "Display resolution & viewing angle", group: "core", about: "Check readability and screen visibility",
    f: [["d", "Display diagonal (in)", 65], ["hr", "Horizontal pixels", 3840], ["vr", "Vertical pixels", 2160], ["dist", "Viewing distance (m)", 3]],
    run: v => { const a = v.hr / v.vr, w = v.d * 0.0254 * a / Math.sqrt(1 + a * a), h = w / a, pitch = w * 1000 / v.hr, ang = 2 * Math.atan(w / 2 / v.dist) / DEG, vang = 2 * Math.atan(h / 2 / v.dist) / DEG, ppd = v.hr / ang, dMax = pitch / 1000 * 3438;
      return { head: ["Pixels per degree", R(ppd, 0), "ppd", ppd >= 60 ? "pixels not resolvable (20/20 limit)" : ppd >= 30 ? "good for general content" : "pixel structure visible, fine text will be soft"],
        stats: [["Screen size", `${R(w)} m x ${R(h)} m`], ["Pixel pitch", `${R(pitch, 3)} mm`], ["Horizontal viewing angle", `${R(ang, 1)} deg${ang > 60 ? " (very wide - too close)" : ang < 20 ? " (narrow)" : ""}`], ["Vertical viewing angle", `${R(vang, 1)} deg`], ["Pixels invisible beyond", `${R(dMax)} m`]],
        steps: ["Width = diagonal x aspect / sqrt(1 + aspect²)", `Viewing angle = 2 x atan(width / 2 ÷ distance) = ${R(ang, 1)} deg`, `Pixels per degree = ${v.hr} ÷ ${R(ang, 1)} = ${R(ppd, 0)}`, `Distance for 1 arc-minute pixels = pitch x 3438 = ${R(dMax)} m`],
        notes: ["60 pixels per degree matches 20/20 vision. Around 30 is comfortable for video. Below that, small text looks soft."] }; } },
  { id: 3, name: "Camera field of view", group: "core", about: "Confirm camera coverage for room and table layouts",
    f: [["h", "Horizontal FOV (deg)", 90, "num", null, { h: "Camera is on the front wall, centred, facing into the room", p: [["70°", 70], ["90°", 90], ["120°", 120], ["180°", 180]] }], ["vf", "Vertical FOV (deg, blank = derive)", NaN], ["ar", "Aspect ratio", "16:9", "sel", ARS],
      ["rw", "Room width (m)", 6], ["rl", "Room length (m)", 8], ["tw", "Table width, across the room (m)", 1.2], ["tl", "Table length, away from camera (m)", 3.6], ["td", "Camera wall to nearest table edge (m)", 1.0],
      ["d", "Distance to subjects D (m)", 4, "num", null, { h: "Used for the coverage width marker, e.g. the farthest seat" }], ["sn", "Seats along each side of the table", 6], ["cw", "Width to cover (m, optional)", NaN]],
    run: v => { const full = v.h >= 179, t = Math.tan(Math.min(v.h, 179.5) * DEG / 2), w = 2 * v.d * t, vf = has(v.vf) ? v.vf : 2 * Math.atan(t / aspect(v.ar)) / DEG, ht = 2 * v.d * Math.tan(vf * DEG / 2);
      const near = v.td, tMin = v.tw / 2 / t, tIn = v.tw / 2 <= near * t + 1e-9, rIn = v.rw / 2 <= v.rl * t + 1e-9, wallW = 2 * v.rl * t;
      const st = [["Coverage height", full ? "full height" : `${R(ht)} m`], ["Vertical FOV", `${R(vf, 1)} deg`], ["Table", tIn ? "fully in view" : `front corners cut off - need the table at least ${R(tMin)} m from the camera, or a wider lens`], ["Width seen at the far wall", full ? "full room width" : `${R(wallW)} m of ${R(v.rw)} m room width${rIn ? " (whole width)" : ""}`], ["Seats along each side of the table", `${v.sn} at ${R(v.tl / Math.max(v.sn, 1))} m pitch (${v.sn * 2} seats in total)`]];
      if (has(v.cw)) st.push([`Mount distance to cover ${R(v.cw)} m`, `${R(v.cw / (2 * t))} m`]);
      return { head: full ? ["Coverage width", "Wall to wall", "", `180° sees the whole front half of the room at any distance`] : ["Coverage width", R(w), "m", `at ${R(v.d)} m`], stats: st, steps: ["W = 2 x D x tan(HFOV / 2)", full ? "At 180 degrees the lens sees everything in front of the camera plane (practically limited by lens edge quality)" : `W = 2 x ${v.d} x tan(${v.h / 2} deg) = ${R(w)} m`, `Table front corners in view when table width / 2 <= distance x tan(HFOV / 2)`, `${R(v.tw / 2)} <= ${R(near)} x ${R(t, 3)} = ${R(near * t)} -> ${tIn ? "yes" : "no"}`], notes: ["Use the usable FOV after digital zoom or framing crop, not the lens maximum. Seats are drawn for layout only."] }; } },
  { id: 4, name: "Microphone coverage", group: "core", about: "Estimate ceiling microphone placement and coverage",
    f: [["ch", "Ceiling height (m)", 2.7], ["th", "Talker mouth height (m)", 1.2], ["ang", "Coverage cone angle (deg)", 90], ["dia", "Datasheet coverage diameter at talker height (m, overrides angle)", NaN], ["rw", "Room width (m)", 6], ["rl", "Room length (m)", 8]],
    run: v => { const r = has(v.dia) ? v.dia / 2 : (v.ch - v.th) * Math.tan(v.ang * DEG / 2); if (!(r > 0)) return { head: ["Microphones", "-", "", "Enter a cone angle or datasheet diameter"], stats: [], steps: [], notes: [] };
      const s = r * Math.SQRT2, nx = Math.max(1, Math.ceil(v.rw / s)), ny = Math.max(1, Math.ceil(v.rl / s));
      return { head: ["Microphones needed", String(nx * ny), "", `${nx} x ${ny} grid`], stats: [["Coverage circle at talker height", `${R(2 * r)} m diameter`], ["Grid spacing (circles meet at corners)", `${R(s)} m`], ["Room", `${R(v.rw)} m x ${R(v.rl)} m`]],
        steps: ["Radius = (ceiling - talker height) x tan(angle / 2)", `Radius = ${R(v.ch - v.th)} x tan(${v.ang / 2} deg) = ${R(r)} m`, `Spacing = radius x sqrt(2) = ${R(s)} m`, `Count = ceil(${R(v.rw)} ÷ ${R(s)}) x ceil(${R(v.rl)} ÷ ${R(s)})`],
        notes: ["Use the manufacturer's coverage figure where possible. Beamforming arrays cover zones, not a simple cone, and mics near walls need pickup-pattern checks."] }; } },
  { id: 5, name: "Loudspeaker coverage", group: "core", about: "Check speaker placement and coverage areas",
    f: [["ch", "Ceiling height (m)", 2.7], ["ear", "Listener ear height (m)", 1.2], ["ang", "Speaker coverage angle (deg, -6 dB)", 90], ["rw", "Room width (m)", 6], ["rl", "Room length (m)", 8], ["sens", "Sensitivity 1W/1m (dB)", 88], ["p", "Power per speaker (W)", 10]],
    run: v => { const dh = v.ch - v.ear, r = dh * Math.tan(v.ang * DEG / 2), ev = r * Math.SQRT2, nx = Math.max(1, Math.ceil(v.rw / ev)), ny = Math.max(1, Math.ceil(v.rl / ev)), spl = v.sens + 10 * L10(v.p) - 20 * L10(dh);
      return { head: ["Speakers needed", String(nx * ny), "", `${nx} x ${ny} at even-coverage spacing`], stats: [["Coverage circle at ear height", `${R(2 * r)} m diameter`], ["Edge-to-edge spacing", `${R(2 * r)} m (-6 dB gaps between speakers)`], ["Even-coverage spacing", `${R(ev)} m`], ["On-axis level at ear", `${R(spl, 1)} dB SPL at ${R(dh)} m`]],
        steps: ["Radius = (ceiling - ear height) x tan(angle / 2)", `Radius = ${R(dh)} x tan(${v.ang / 2} deg) = ${R(r)} m`, `Edge-to-edge = 2 x radius = ${R(2 * r)} m; even coverage = radius x sqrt(2) = ${R(ev)} m`, `SPL = ${v.sens} + 10 log(${v.p}) - 20 log(${R(dh)}) = ${R(spl, 1)} dB`],
        notes: ["Keep the first and last speakers about half a spacing from the walls. Overlap raises level where coverage circles cross."] }; } },
  { id: 6, name: "Audio delay & latency", group: "core", about: "Calculate delays between speakers and audio sources",
    f: [["dm", "Main speaker to listener (m)", 30], ["df", "Fill speaker to listener (m)", 10], ["T", "Temperature (C)", 20], ["hs", "Haas offset (ms)", 10], ["fr", "Video processing latency (frames)", 3], ["fps", "Frame rate (fps)", 60], ["fs", "DSP sample rate (Hz)", 48000], ["sm", "DSP latency (samples)", 64]],
    run: v => { const c = 331.3 + 0.606 * v.T, vl = v.fr / v.fps * 1000, dl = v.sm / v.fs * 1000, fill = (v.dm - v.df) / c * 1000;
      return { head: ["Fill speaker delay", R(fill + v.hs, 1), "ms", `${R(fill, 1)} ms alignment + ${R(v.hs, 0)} ms Haas${fill < 0 ? " - negative: delay the main instead" : ""}`],
        stats: [["Speed of sound", `${R(c, 1)} m/s (${R(1000 / c, 3)} ms per metre)`], ["Main arrives at listener", `${R(v.dm / c * 1000, 1)} ms`], ["Lip-sync: video lags by", `${R(vl, 1)} ms - delay audio about this much`], ["DSP latency", `${R(dl, 2)} ms`]],
        steps: ["c = 331.3 + 0.606 x T", `c = 331.3 + 0.606 x ${v.T} = ${R(c, 1)} m/s`, `Delay = (main distance - fill distance) ÷ c = (${v.dm} - ${v.df}) ÷ ${R(c, 1)} = ${R(fill, 1)} ms`, `Video latency = ${v.fr} frames ÷ ${v.fps} fps = ${R(vl, 1)} ms`],
        notes: ["Commonly cited lip-sync limit: audio no more than about 40 ms early or 60 ms late (EBU R37)."] }; } },
  { id: 7, name: "SPL & decibel calculations", group: "core", about: "Calculate sound levels and level differences",
    f: [["a", "Level A (dB)", 90], ["b", "Level B (dB, optional)", NaN], ["n", "Identical sources", 2], ["d1", "Distance 1 (m)", 10], ["d2", "Distance 2 (m)", 20], ["db", "dB change to convert", 3], ["sens", "Speaker sensitivity (dB 1W/1m)", 94], ["p", "Power (W)", 100], ["D", "Listener distance (m)", 10]],
    run: v => { const dd = 20 * L10(v.d1 / v.d2), spl = v.sens + 10 * L10(v.p) - 20 * L10(v.D);
      return { head: ["Level change over distance", R(dd), "dB", `${R(v.d1)} m to ${R(v.d2)} m`],
        stats: [[has(v.b) ? "A + B (incoherent)" : "Level A", has(v.b) ? `${R(10 * L10(10 ** (v.a / 10) + 10 ** (v.b / 10)), 1)} dB` : `${R(v.a, 1)} dB`], [`${R(v.n, 0)} identical sources`, `+${R(10 * L10(v.n), 1)} dB incoherent, up to +${R(20 * L10(v.n), 1)} dB coherent`], [`${R(v.db)} dB equals`, `power x${R(10 ** (v.db / 10))}, voltage x${R(10 ** (v.db / 20))}`], [`Speaker at ${R(v.D)} m`, `${R(spl, 1)} dB SPL`]],
        steps: ["Distance: dB = 20 log(d1 ÷ d2)", `dB = 20 log(${v.d1} ÷ ${v.d2}) = ${R(dd)}`, "Sum of levels: 10 log(10^(A/10) + 10^(B/10))", `Speaker SPL = sens + 10 log(P) - 20 log(D) = ${R(spl, 1)} dB`], notes: ["Level drops 6 dB for each doubling of distance in free field."] }; } },
  { id: 8, name: "Cable length & signal limits", group: "core", about: "Check maximum cable distances for AV signals",
    f: [["t", "Cable / signal type", "cat", "sel", ["hdmip|HDMI passive|5|Cable-quality dependent; 4K60 is often 3 m or less.", "hdmia|HDMI active / AOC|15|Check the cable's rated resolution.", "usb2|USB 2.0 passive|5|", "usb3|USB 3.x passive|3|", "usbc|USB-C passive (data)|2|", "usba|USB active extension|10|Check the extender datasheet; some go further.", "cat|Cat6/6a Ethernet, PoE, Dante, AVoIP|100|90 m permanent link plus 10 m patch leads.", "cat6_10g|Cat6 10GBASE-T|55|Cat6a reaches 100 m.", "hdbt|HDBaseT copper|100|Some products drop to 70 m at 4K60 4:4:4.", "om3|Multimode fibre OM3 (10G SR)|300|", "om4|Multimode fibre OM4 (10G SR)|400|", "os2|Single-mode fibre OS2 (10G LR)|10000|"]], ["len", "Planned run length (m)", 12], ["sl", "Slack / routing allowance (%)", 10]],
    run: v => { const [, name, lim, note] = selOpt(CALCS[7].f[0][4], v.t).split("|"), eff = v.len * (1 + v.sl / 100), L = +lim, ok = eff <= L;
      return { head: ["Run length with allowance", R(eff, 1), "m", ok ? `OK, ${R(L - eff, 1)} m margin` : `OVER by ${R(eff - L, 1)} m`], stats: [["Cable / signal", name], ["Limit", `${L} m`], ["Result", ok ? "Within limit" : "Over limit - use an extender, active or fibre cable, or an intermediate switch"]],
        steps: [`Run = ${v.len} m x (1 + ${v.sl}%) = ${R(eff, 1)} m`, `Limit = ${L} m`, `Margin = ${R(L - eff, 1)} m`], notes: note ? [note] : [] }; } },
  { id: 9, name: "Bandwidth", group: "core", about: "Estimate network bandwidth requirements",
    f: [["na", "AVoIP streams", 4], ["ma", "Mbps per AVoIP stream", 850], ["dc", "Dante channels", 32], ["md", "Mbps per Dante channel", 1.5], ["uc", "Conference calls", 2], ["mu", "Mbps per call", 4], ["ot", "Other traffic (Mbps)", 100], ["up", "Uplink (Gbps)", 10]],
    run: v => { const av = v.na * v.ma, da = v.dc * v.md, ca = v.uc * v.mu, t = av + da + ca + v.ot, u = t / (v.up * 1000), need = t / 0.8 / 1000, pick = [1, 2.5, 10, 25, 40, 100].find(x => x >= need);
      return { head: ["Total bandwidth", R(t / 1000, 2), "Gbps", `${R(u * 100, 1)}% of a ${v.up}G uplink - ${u > 1 ? "OVERLOADED" : u > 0.8 ? "over the 80% limit" : "OK"}`], stats: [["AVoIP", `${R(av, 0)} Mbps`], ["Dante", `${R(da, 0)} Mbps`], ["Conference calls", `${R(ca, 0)} Mbps`], ["Other", `${R(v.ot, 0)} Mbps`], ["Smallest standard uplink at 80% load", pick ? pick + "G" : ">100G"]],
        steps: [`AVoIP = ${v.na} x ${v.ma} = ${R(av, 0)} Mbps`, `Dante = ${v.dc} x ${v.md} = ${R(da, 0)} Mbps`, `Calls = ${v.uc} x ${v.mu} = ${R(ca, 0)} Mbps`, `Total = ${R(t, 0)} Mbps; needed uplink = ${R(t, 0)} ÷ 0.8 = ${R(need * 1000, 0)} Mbps`], notes: ["Rule-of-thumb inputs. Use the encoder's actual bitrate and your conferencing platform's figures."] }; } },
  { id: 10, name: "PoE power budget", group: "core", about: "Calculate switch power requirements for AV equipment",
    f: [["af", "802.3af devices (15.4 W)", 4], ["at", "802.3at / PoE+ devices (30 W)", 6], ["b3", "802.3bt Type 3 devices (60 W)", 0], ["b4", "802.3bt Type 4 devices (90 W)", 0], ["bud", "Switch PoE budget (W)", 370], ["dr", "Planning limit (% of budget)", 80]],
    run: v => { const t = v.af * 15.4 + v.at * 30 + v.b3 * 60 + v.b4 * 90, pd = v.af * 12.95 + v.at * 25.5 + v.b3 * 51 + v.b4 * 71.3, lim = v.bud * v.dr / 100, n = v.af + v.at + v.b3 + v.b4;
      return { head: ["PoE class allocation", R(t, 1), "W", `${R(t / v.bud * 100, 0)}% of ${v.bud} W - ${t > v.bud ? "OVER BUDGET" : t > lim ? `over the ${v.dr}% limit` : "OK"}`], stats: [["PoE devices", String(n)], ["Minimum budget at limit", `${R(t / (v.dr / 100), 0)} W`], ["If devices draw rated PD power", `${R(pd, 1)} W`], ["Headroom to limit", `${R(lim - t, 1)} W`]],
        steps: [`af: ${v.af} x 15.4 = ${R(v.af * 15.4, 1)} W`, `at: ${v.at} x 30 = ${R(v.at * 30, 1)} W`, `bt3: ${v.b3} x 60 = ${R(v.b3 * 60, 1)} W; bt4: ${v.b4} x 90 = ${R(v.b4 * 90, 1)} W`, `Total = ${R(t, 1)} W; minimum budget = ${R(t, 1)} ÷ ${v.dr / 100} = ${R(t / (v.dr / 100), 0)} W`], notes: ["Class allocation is the safe basis. Also check per-port limits and the total port count."] }; } },
  { id: 11, name: "Rack space & power", group: "core", about: "Size AV racks and electrical requirements",
    f: [["eq", "Equipment: name, RU, watts (one per line)", "UPS, 2, 300\nAmplifier 4ch, 2, 800\nDSP, 1, 60\nNetwork switch, 1, 150\nControl processor, 1, 40", "area"], ["bl", "Blank / vent panels (RU)", 2], ["sp", "Spare capacity (%)", 20], ["pf", "Power factor", 0.95]],
    run: v => { let ru = 0, w = 0; const st = []; lines(v.eq).forEach(l => { const p = l.split(",").map(s => s.trim()); ru += +p[1] || 0; w += +p[2] || 0; st.push(`${p[0]}: ${+p[1] || 0} RU, ${+p[2] || 0} W`); });
      const tot = ru + v.bl, need = Math.ceil(tot * (1 + v.sp / 100)), pick = [6, 9, 12, 15, 18, 22, 24, 27, 32, 37, 42, 45, 47].find(x => x >= need), va = w / v.pf, a = va / 230, br = [10, 15, 20, 32].find(x => a <= x * 0.8);
      return { head: ["Recommended rack", pick ? String(pick) : ">47", "U", `${tot} RU used, ${need} RU with ${v.sp}% spare`], stats: [["Equipment", `${R(ru, 0)} RU + ${R(v.bl, 0)} RU blanks`], ["Power", `${R(w, 0)} W, ${R(va, 0)} VA`], ["Current at 230 V", `${R(a, 2)} A`], ["Heat", `${R(w * 3.412, 0)} BTU/hr`], ["Breaker at 80% continuous", br ? br + " A" : "over 32 A - split circuits or use 3-phase"]],
        steps: st.concat([`Total = ${R(ru, 0)} RU, ${R(w, 0)} W`, `VA = W ÷ PF = ${R(w, 0)} ÷ ${v.pf} = ${R(va, 0)}`, `Amps = VA ÷ 230 = ${R(a, 2)} A; BTU/hr = W x 3.412 = ${R(w * 3.412, 0)}`]), notes: ["Use operating watts, not nameplate. Amplifiers at 1/8 power draw far less than rated. Confirm circuits with the electrician (AS/NZS 3000)."] }; } },
  { id: 12, name: "Projector throw distance", group: "core", about: "Select projectors and lens configurations",
    f: [["d", "Screen diagonal (in)", 120], ["ar", "Aspect ratio", "16:9", "sel", ARS], ["t1", "Lens throw ratio, minimum", 1.3], ["t2", "Lens throw ratio, maximum", 1.7], ["dist", "Planned distance (m, optional)", NaN], ["lm", "Projector lumens", 5000], ["g", "Screen gain", 1.0]],
    run: v => { const a = aspect(v.ar), w = v.d * 0.0254 * a / Math.sqrt(1 + a * a), h = w / a, nits = v.lm / (w * h) * v.g / Math.PI, st = [["Image size", `${R(w)} m x ${R(h)} m`], ["Brightness (before ambient light)", `${R(nits, 0)} nits (${R(nits / 3.426, 1)} fL)`]];
      if (has(v.dist)) st.push([`Throw ratio needed at ${R(v.dist)} m`, `${R(v.dist / w)}:1 ${v.dist / w >= v.t1 && v.dist / w <= v.t2 ? "(inside lens range)" : "(outside lens range)"}`]);
      return { head: ["Projector distance", `${R(v.t1 * w)} - ${R(v.t2 * w)}`, "m", "from the screen"], stats: st, steps: ["Image width = diagonal x aspect / sqrt(1 + aspect²)", `Width = ${R(w)} m`, `Distance = throw ratio x width = ${R(v.t1)} x ${R(w)} to ${R(v.t2)} x ${R(w)}`, `Nits = lumens ÷ area x gain ÷ pi = ${R(nits, 0)}`], notes: ["Cinema reference brightness is 55 nits (16 fL). Ambient light and lens shift limits are not included."] }; } },
  { id: 13, name: "Aspect ratio & resolution conversion", group: "core", about: "Check display and source compatibility",
    f: [["sw", "Source width (px)", 3840], ["sh", "Source height (px)", 2160], ["tw", "Display width (px)", 1920], ["th", "Display height (px)", 1200], ["fps", "Frame rate", 60], ["bpp", "Bits per pixel", "24", "sel", ["24|8-bit 4:4:4 (24)", "16|8-bit 4:2:2 (16)", "12|8-bit 4:2:0 (12)", "30|10-bit 4:4:4 (30)"]]],
    run: v => { const bpp = +v.bpp, gs = gcd(v.sw, v.sh), gt = gcd(v.tw, v.th), fit = Math.min(v.tw / v.sw, v.th / v.sh), fill = Math.max(v.tw / v.sw, v.th / v.sh), fw = v.sw * fit, fh = v.sh * fit;
      const g = v.sw * v.sh * v.fps * bpp / 1e9, gb = g * 1.2, link = gb <= 8.16 ? "HDMI 1.4" : gb <= 14.4 ? "HDMI 2.0" : gb <= 25.92 ? "DisplayPort 1.4 / HDMI 2.1" : gb <= 42.67 ? "HDMI 2.1" : "more than one HDMI 2.1 link (compress or use DSC)";
      return { head: ["Scale to fit", R(fit * 100, 1), "%", `${R(fw, 0)} x ${R(fh, 0)} px`], stats: [["Source aspect", `${gs ? v.sw / gs : 0}:${gs ? v.sh / gs : 0} (${R(v.sw / v.sh)})`], ["Display aspect", `${gt ? v.tw / gt : 0}:${gt ? v.th / gt : 0} (${R(v.tw / v.th)})`], ["Fit", fw < v.tw - 0.5 ? `bars ${R((v.tw - fw) / 2, 0)} px each side` : fh < v.th - 0.5 ? `bars ${R((v.th - fh) / 2, 0)} px top and bottom` : "no bars"], ["Fill (crop)", `scale ${R(fill * 100, 1)}%, crops ${R(Math.max(0, v.sw * fill - v.tw), 0)} px wide / ${R(Math.max(0, v.sh * fill - v.th), 0)} px high`], ["Uncompressed video", `${R(g, 2)} Gbps active, about ${R(gb, 1)} Gbps with blanking`], ["Needs at least", link]],
        steps: [`Fit scale = min(${v.tw} ÷ ${v.sw}, ${v.th} ÷ ${v.sh}) = ${R(fit, 4)}`, `Fill scale = max(...) = ${R(fill, 4)}`, `Bitrate = ${v.sw} x ${v.sh} x ${v.fps} x ${bpp} = ${R(g, 2)} Gbps`], notes: ["Blanking is approximated at 20%. Check the exact timing and link version for the product."] }; } },
  { id: 14, name: "Room acoustics & reverberation", group: "core", about: "Assess acoustic suitability for conferencing",
    f: [["L", "Length (m)", 8], ["W", "Width (m)", 6], ["H", "Height (m)", 2.7], ["af", "Floor absorption (alpha)", 0.2], ["ac", "Ceiling absorption (alpha)", 0.6], ["aw", "Wall absorption (alpha)", 0.1], ["ex", "Extra absorption: furniture, people (m2 sabins)", 2], ["tg", "Target RT60 (s)", 0.5], ["Q", "Source directivity Q (1 omni, 2 talker)", 2], ["ft", "Farthest talker to mic (m)", 4]],
    run: v => { const V = v.L * v.W * v.H, Sf = v.L * v.W, Sw = 2 * (v.L + v.W) * v.H, S = 2 * Sf + Sw, A = Sf * v.af + Sf * v.ac + Sw * v.aw + v.ex, am = A / S, sab = 0.161 * V / A, eyr = 0.161 * V / (-S * Math.log(1 - Math.min(am, 0.99))), need = 0.161 * V / v.tg - A, dc = 0.057 * Math.sqrt(v.Q * V / sab);
      return { head: ["RT60 (Sabine)", R(sab), "s", sab <= v.tg ? `meets the ${R(v.tg)} s target` : `above the ${R(v.tg)} s target`], stats: [["RT60 (Eyring)", `${R(eyr)} s`], ["Room volume", `${R(V, 1)} m3`], ["Total absorption", `${R(A, 1)} sabins (mean alpha ${R(am)})`], ["Extra absorption needed", need > 0 ? `${R(need, 1)} sabins, about ${R(need / 0.8, 1)} m2 of alpha-0.8 panel` : "none"], ["Critical distance", `${R(dc)} m - talker at ${R(v.ft)} m is ${v.ft > dc ? "beyond it (reverberant sound dominates)" : "inside it (direct sound dominates)"}`]],
        steps: ["RT60 = 0.161 x V ÷ A (Sabine)", `RT60 = 0.161 x ${R(V, 1)} ÷ ${R(A, 1)} = ${R(sab)} s`, "Critical distance = 0.057 x sqrt(Q x V ÷ RT60)", `Critical distance = 0.057 x sqrt(${v.Q} x ${R(V, 1)} ÷ ${R(sab)}) = ${R(dc)} m`], notes: ["Absorption coefficients are mid-frequency estimates. Use datasheet or measured values. Sabine overstates RT60 when mean alpha is above about 0.2, so use Eyring then. Conferencing rooms commonly target 0.4-0.6 s."] }; } },
  { id: 15, name: "DSP gain structure", group: "core", about: "Calculate gain structure, delays and signal levels",
    f: [["in", "Input level (dBu)", -40], ["ch", "Stages: name, gain dB (one per line)", "Mic preamp, 40\nDSP input trim, 0\nProcessing / AEC, -3\nOutput trim, 0", "area"], ["clip", "Line-level clip point (dBu)", 20], ["ag", "Amplifier voltage gain (dB)", 32], ["ap", "Amplifier power (W)", 100], ["ar", "Load (ohm)", 8]],
    run: v => { let lv = v.in; const st = [`Input: ${R(lv, 1)} dBu`]; lines(v.ch).forEach(l => { const p = l.split(","), g = +p[p.length - 1] || 0; lv += g; st.push(`${p.slice(0, -1).join(",").trim() || "Stage"}: ${g >= 0 ? "+" : ""}${R(g, 1)} dB -> ${R(lv, 1)} dBu (headroom ${R(v.clip - lv, 1)} dB${v.clip - lv < 6 ? ", low" : ""})`); });
      const vo = Math.sqrt(v.ap * v.ar), full = 20 * L10(vo / 0.7746) - v.ag;
      return { head: ["Level at amplifier input", R(lv, 1), "dBu", `${R(0.7746 * 10 ** (lv / 20), 3)} V, headroom ${R(v.clip - lv, 1)} dB to clip`], stats: [["Amp full power", `${R(v.ap, 0)} W into ${R(v.ar, 0)} ohm = ${R(vo, 1)} V`], ["Input needed for full power", `${R(full, 1)} dBu`], ["Headroom from line level to full power", `${R(full - lv, 1)} dB`]],
        steps: st.concat([`Amp output voltage = sqrt(P x R) = ${R(vo, 1)} V`, `Input for full power = 20 log(${R(vo, 1)} ÷ 0.7746) - ${v.ag} = ${R(full, 1)} dBu`]), notes: ["0 dBu = 0.7746 V RMS. Keep gain before the clip point as even as practical, with the noisiest stage at the front."] }; } },
  { id: 16, name: "Amplifier power for target SPL", group: "pa", about: "Stadium and large venue amplifier sizing",
    f: [["d", "Listener distance (m)", 40], ["sens", "Sensitivity 1W/1m (dB)", 98], ["spl", "Target continuous SPL (dB)", 100], ["n", "Speakers", 1]],
    run: v => { const p = 10 ** ((v.spl - v.sens + 20 * L10(v.d) - 10 * L10(v.n)) / 10); return { head: ["Continuous power per speaker", R(p, 1), "W", `at ${R(v.d)} m`], stats: [["Peak, +10 dB crest", `${R(p * 10, 0)} W`], ["Peak, +12 dB crest", `${R(p * 10 ** 1.2, 0)} W`]], steps: ["P = 10 ^ ((SPL - sens + 20 log D - 10 log N) ÷ 10)", `P = ${R(p, 1)} W; peak = P x 10^(crest ÷ 10)`], notes: ["Free-field estimate. Add loss for air absorption and coverage-angle roll-off over long distances."] }; } },
  { id: 17, name: "Delay ring timing", group: "pa", about: "Stadium delay and fill ring timing",
    f: [["d", "Distance from source (m)", 60], ["T", "Temperature (C)", 25], ["hs", "Haas offset (ms)", 10]],
    run: v => { const c = 331.3 + 0.606 * v.T; return { head: ["DSP delay", R(v.d / c * 1000 + v.hs), "ms", `${R(v.d / c * 1000)} ms acoustic + ${R(v.hs, 0)} ms Haas`], stats: [["Speed of sound", `${R(c, 1)} m/s`], ["Time per metre", `${R(1000 / c, 3)} ms`]], steps: ["c = 331.3 + 0.606 x T", `c = ${R(c, 1)} m/s`, `Delay = ${v.d} ÷ ${R(c, 1)} x 1000 = ${R(v.d / c * 1000)} ms`], notes: ["Recheck at the actual event temperature."] }; } },
  { id: 18, name: "100 V line loss", group: "pa", about: "Australian 100 V line voltage drop",
    f: [["w", "Total load (W)", 400], ["len", "Run (m)", 100], ["mm", "Cable (mm2)", "1.5", "sel", MM], ["max", "Max loss (dB)", 1]],
    run: v => { const i = v.w / 100, r = OHM[v.mm] * 2 * v.len / 1000, dv = i * r, db = 20 * L10((100 - dv) / 100); return { head: ["Line loss", R(db), "dB", Math.abs(db) <= v.max ? "within limit" : "over limit - use a larger conductor"], stats: [["Current", `${R(i)} A`], ["Voltage drop", `${R(dv)} V (${R(dv)}%)`], ["Power lost in cable", `${R(i * i * r, 1)} W`]], steps: [`I = P ÷ V = ${v.w} ÷ 100 = ${R(i)} A`, `R (loop) = ${OHM[v.mm]} ohm/km x 2 x ${v.len} m = ${R(r, 3)} ohm`, `Drop = I x R = ${R(dv)} V; loss = 20 log((100 - drop) ÷ 100) = ${R(db)} dB`], notes: ["Confirm AS 1670.4 and fire-rated cabling separately. This is not a compliance test."] }; } },
  { id: 19, name: "Low-Z speaker cable", group: "pa", about: "4 or 8 ohm speaker cable gauge and loss",
    f: [["z", "Load (ohm)", 4], ["len", "Run (m)", 30], ["mm", "Cable (mm2)", "2.5", "sel", MM]],
    run: v => { const rc = OHM[v.mm] * 2 * v.len / 1000, db = 20 * L10(v.z / (v.z + rc)); return { head: ["Cable loss", R(db), "dB", `damping factor ${R(v.z / rc, 0)}`], stats: [["Loop resistance", `${R(rc, 3)} ohm`], ["Power lost", `${R(rc / (v.z + rc) * 100, 1)}%`]], steps: [`R (loop) = ${OHM[v.mm]} x 2 x ${v.len} ÷ 1000 = ${R(rc, 3)} ohm`, `Loss = 20 log(${v.z} ÷ (${v.z} + ${R(rc, 3)})) = ${R(db)} dB`], notes: ["A loss under about 0.5 dB is a common design target."] }; } }
];

// ---------- rendering
let cur = null, LASTRES = null;
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
function showList() {
  cur = null;
  const grp = (g, t) => `<h3 class="grp">${t}</h3><div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">${CALCS.filter(c => c.group == g).map(c => `<button class="tile" data-id="${c.id}"><span class="num">${c.id}</span><span><b>${c.name}</b><br><span class="sub">${c.about}</span></span></button>`).join("")}</div>`;
  cq("calcs").innerHTML = grp("core", "Everyday AV design, in priority order") + grp("pa", "Stadium and PA");
  cq("calcs").querySelectorAll(".tile").forEach(b => b.onclick = () => openCalc(+b.dataset.id));
}
function openCalc(id) {
  cur = id; const c = CALCS.find(x => x.id == id);
  const rmap = RMAP[id] || {};
  const field = f => { const t = f[3] || "num", o = f[5] || {}, base = `data-k="${f[0]}" id="f_${f[0]}"`, def = fieldDefault(c, f), fromRoom = !!rmap[f[0]], nd = parseFloat(def);
    const inp = t == "sel" ? `<select ${base} class="w-full">${f[4].map(op => { const lab = op.includes("|") ? op.split("|")[1] : op, val = op.split("|")[0]; return `<option value="${esc(val)}" ${val == String(def) ? "selected" : ""}>${esc(lab)}</option>`; }).join("")}</select>`
      : t == "area" ? `<textarea ${base} rows="6" class="w-full">${esc(def)}</textarea>` : `<input ${base} type="number" step="any" value="${has(nd) ? nd : ""}" class="w-full">`;
    return `<label class="block text-xs" style="color:var(--mute);${t == "area" || o.p ? "grid-column:1/-1" : ""}">${f[1]}${fromRoom ? ' <span class="roomtag">room</span>' : ""}${inp}${o.h ? `<span class="hint">${o.h}</span>` : ""}${o.p ? `<span class="pres">${o.p.map(p => `<button type="button" class="pre" data-for="f_${f[0]}" data-v="${p[1]}">${p[0]}</button>`).join("")}</span>` : ""}</label>`; };
  cq("calcs").innerHTML = `<button class="btn alt mb-3" id="back">&larr; All calculators</button><div class="rc"><h3 class="font-bold mb-1 text-lg">${c.id}. ${c.name}</h3>${Object.keys(rmap).length ? `<p class="text-xs mb-3" style="color:var(--mute)">Fields tagged <span class="roomtag">room</span> are filled from the room design${PROJ.name ? ` "${esc(PROJ.name)}"` : ""}. <a href="#" id="editroom" style="color:var(--accent-text);text-decoration:underline">Edit room</a></p>` : "<div class=\"mb-2\"></div>"}<div class="grid sm:grid-cols-2 gap-x-4 gap-y-3">${c.f.map(field).join("")}</div><button class="btn calcbtn" id="go">Calculate</button></div><div id="cres"></div>`;
  cq("back").onclick = showList; let done = false;
  const go = () => { done = true; calcRun(); };
  cq("go").onclick = go;
  cq("calcs").querySelectorAll("[data-k]").forEach(el => { el.oninput = el.onchange = () => { syncPre(); if (done) calcRun(); }; el.onkeydown = e => { if (e.key == "Enter" && el.tagName != "TEXTAREA") go(); }; });
  cq("calcs").querySelectorAll(".pre").forEach(b => b.onclick = () => { cq(b.dataset.for).value = b.dataset.v; syncPre(); if (done) calcRun(); });
  const er = cq("editroom"); if (er) er.onclick = e => { e.preventDefault(); document.querySelector('.tab[data-t="t5"]').click(); };
  if (id == 1) { let pu = cq("f_u").value; cq("f_u").addEventListener("change", () => { const k = cq("f_u").value == "ft" ? 3.2808 : 1 / 3.2808; if (pu != cq("f_u").value) ["fv", "cv"].forEach(n => { const el = cq("f_" + n), x = parseFloat(el.value); if (has(x)) el.value = +(x * k).toFixed(2); }); pu = cq("f_u").value; if (done) calcRun(); }); }
  syncPre(); go();
}
function syncPre() { document.querySelectorAll("#calcs .pre").forEach(b => b.setAttribute("aria-pressed", parseFloat(cq(b.dataset.for).value) == parseFloat(b.dataset.v))); }
function calcRun() {
  const c = CALCS.find(x => x.id == cur), v = {};
  c.f.forEach(f => { const el = cq("f_" + f[0]), t = f[3] || "num"; v[f[0]] = t == "num" ? parseFloat(el.value) : el.value; });
  const sv = {}; c.f.forEach(f => { if (!(RMAP[c.id] || {})[f[0]] && !(NOSAVE[c.id] || []).includes(f[0])) sv[f[0]] = (f[3] || "num") == "num" ? (cq("f_" + f[0]).value) : v[f[0]]; }); PROJ.calcs[c.id] = sv; if (typeof projChanged == "function") projChanged();
  let r; try { r = c.run(v); } catch (e) { cq("cres").innerHTML = `<div class="rc mt-4">Check the inputs: ${esc(e.message)}</div>`; return; }
  cq("cres").innerHTML = resultHtml(c, r, v); if (typeof exportAction == "function") cq("cres").querySelectorAll("[data-exp]").forEach(b => b.onclick = () => exportAction(b.dataset.exp));
}
function resultHtml(c, r, v) {
  const h = r.head || [];
  let dg = ""; try { if (VIZ[c.id]) dg = VIZ[c.id](v); } catch (e) { dg = ""; }
  LASTRES = { c, r, v, dg };
  const ex = typeof exportAction == "function" ? `<div class="flex flex-wrap gap-2 mb-3"><button class="btn alt" data-exp="copy">Copy results</button>${dg ? '<button class="btn alt" data-exp="png">Diagram PNG</button>' : ""}<button class="btn alt" data-exp="print">Print / save PDF</button></div>` : "";
  return `<h3 class="font-bold text-lg mt-5 mb-2">${c.name} results</h3>${ex}<div class="grid md:grid-cols-2 gap-4">
    <div class="rc center"><div class="lbl">${esc(h[0] || "")}</div><div class="big">${esc(h[1] || "-")}${h[2] ? `<span class="unit">${esc(h[2])}</span>` : ""}</div><div class="lbl">${esc(h[3] || "")}</div></div>
    <div class="rc"><div class="lbl mb-2">Details</div>${(r.stats || []).map(s => `<p class="kv"><b>${esc(s[0])}:</b> ${esc(s[1])}</p>`).join("")}</div></div>
    ${dg ? `<div class="rc mt-4"><div class="lbl mb-2">Diagram</div>${dg}</div>` : ""}
    ${(r.steps || []).length ? `<div class="rc mt-4"><div class="lbl mb-2">Formula breakdown</div><pre class="mono">${esc(r.steps.join("\n"))}</pre></div>` : ""}
    ${(r.notes || []).length ? `<div class="rc mt-4">${r.notes.map(n => `<p class="note">${esc(n)}</p>`).join("")}</div>` : ""}
    ${r.ref ? `<div class="rc mt-4"><div class="lbl mb-2" style="color:var(--accent-text)"><b>${esc(r.ref.title)}</b></div><div class="refgrid">${r.ref.items.map(i => `<span>&bull; ${esc(i)}</span>`).join("")}</div></div>` : ""}`;
}

const plannedWrap = (i, key, what) => { const f0 = CALCS[i].run; CALCS[i].run = v => { const r = f0(v), n = +r.head[1], p = ROOM[key]; if (has(p) && r.stats) r.stats.push([`Planned ${what} in room design`, `${p} planned, ${n} needed - ${p >= n ? "OK" : "SHORT by " + (n - p)}`]); return r; }; };
plannedWrap(3, "nm", "microphones"); plannedWrap(4, "ns", "speakers");
// ---------- diagrams (inline SVG, theme-aware). Drawn from the same inputs as run(); not to scale for labels.
const ST = { ink: "var(--ink)", mute: "var(--mute)", acc: "var(--accent-text)", line: "var(--line)" };
const T = (x, y, t, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" style="font-size:${o.s || 12}px;fill:${o.c || ST.ink};${o.b ? "font-weight:700" : ""}">${esc(t)}</text>`;
const LN = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${o.c || ST.ink};stroke-width:${o.w || 1.5};${o.d ? `stroke-dasharray:${o.d}` : ""}"/>`;
const RC = (x, y, w, h, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r || 0}" style="fill:${o.f || "none"};stroke:${o.c || ST.ink};stroke-width:${o.w == null ? 1.5 : o.w};${o.op ? `fill-opacity:${o.op}` : ""}"/>`;
const SV = (w, h, b) => `<svg viewBox="0 0 ${w} ${h}" role="img" style="width:100%;max-width:${w}px;height:auto;display:block;margin:0 auto">${b}</svg>`;
let _cid = 0;
const planView = (rw, rl, r, nx, ny, lab) => {
  const s = Math.min(460 / rw, 270 / rl), x0 = (520 - rw * s) / 2, y0 = 22, id = "cp" + (++_cid), sx = rw / nx, sy = rl / ny; let b = `<clipPath id="${id}"><rect x="${x0}" y="${y0}" width="${rw * s}" height="${rl * s}"/></clipPath>`;
  b += RC(x0, y0, rw * s, rl * s, { c: ST.mute }) + `<g clip-path="url(#${id})">`;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const cx = x0 + (i + .5) * sx * s, cy = y0 + (j + .5) * sy * s; b += `<circle cx="${cx}" cy="${cy}" r="${r * s}" style="fill:${ST.acc};fill-opacity:.18;stroke:${ST.acc};stroke-width:1.5"/>`; }
  b += `</g>`;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) b += `<circle cx="${x0 + (i + .5) * sx * s}" cy="${y0 + (j + .5) * sy * s}" r="4" style="fill:${ST.ink}"/>`;
  return SV(520, y0 + rl * s + 34, b + T(260, y0 + rl * s + 20, `${R(rw)} m x ${R(rl)} m room - ${nx * ny} ${lab}, coverage circles shown at ${R(2 * r)} m diameter`, { c: ST.mute, s: 11 }));
};
const barRow = (x, y, w, segs, scale, h = 26) => { let cx = x, b = ""; segs.forEach(s => { const sw = s[1] * scale; if (sw > 0) { b += RC(cx, y, sw, h, { f: s[2], c: "none", op: s[3] || 1, w: 0 }); cx += sw; } }); return b + RC(x, y, w, h, { c: ST.mute, w: 1 }); };
const VIZ = {
  1: v => { const ft = v.u == "ft", a = aspect(v.ar), eh = v.eh / 100; let ih = v.fv / (v.k * eh); if (v.m == "ADM") ih = Math.max(ih, v.fv / 4);
    const iw = ih * a, cl = 1.4 * iw, k = ft ? 3.2808 : 1, bot = v.bot * k, eye = 1.2 * k, top = bot + ih, s = Math.min(380 / v.fv, 230 / Math.max(top, eye + 1)), fy = 280, sx = 70, ux = ft ? "ft" : "m";
    const person = (x, c) => `<circle cx="${x}" cy="${fy - eye * s}" r="6" style="fill:${c}"/>` + LN(x, fy - eye * s + 6, x, fy - 4, { c, w: 3 });
    let b = LN(20, fy, 500, fy, { c: ST.mute }) + RC(sx - 8, fy - top * s, 8, ih * s, { f: ST.acc, c: ST.acc });
    b += LN(sx, fy - eye * s, sx + v.fv * s, fy - eye * s, { c: ST.mute, d: "5 4", w: 1 }) + LN(sx, fy - top * s, sx + v.fv * s, fy - eye * s, { c: ST.acc, w: 1, d: "3 3" }) + LN(sx, fy - bot * s, sx + v.fv * s, fy - eye * s, { c: ST.acc, w: 1, d: "3 3" });
    b += person(sx + v.fv * s, ST.ink); if (cl < v.fv) b += person(sx + cl * s, ST.mute) + T(sx + cl * s, fy + 18, `closest ${R(cl, 1)} ${ux}`, { s: 11, c: ST.mute });
    b += T(sx + v.fv * s, fy + 18, `farthest ${R(v.fv, 1)} ${ux}`, { s: 11 }) + T(sx + 6, fy - top * s - 8, `image height ${R(ih)} ${ux}`, { a: "start", s: 12, c: ST.acc, b: 1 }) + T(sx - 12, fy - bot * s / 2, `${R(v.bot)} m`, { a: "end", s: 11, c: ST.mute });
    return SV(520, 310, b); },
  3: v => { const t = Math.tan(Math.min(v.h, 179.5) * DEG / 2), w = 2 * v.d * t, s = Math.min(460 / v.rw, 290 / v.rl), x0 = (520 - v.rw * s) / 2, y0 = 26, cx = 260, py = d => y0 + d * s, id = "cf" + (++_cid), tIn = v.tw / 2 <= v.td * t + 1e-9, tc = tIn ? "#16a34a" : "#dc2626", ext = v.rl * t * s;
    let b = `<clipPath id="${id}"><rect x="${x0}" y="${y0}" width="${v.rw * s}" height="${v.rl * s}"/></clipPath>` + `<path clip-path="url(#${id})" d="M${cx} ${y0} L${cx - ext} ${py(v.rl)} L${cx + ext} ${py(v.rl)} Z" style="fill:${ST.acc};fill-opacity:.12"/>`;
    b += RC(x0, y0, v.rw * s, v.rl * s, { c: ST.mute, w: 2 });
    const tx = cx - v.tw * s / 2, ty = py(v.td), n = Math.max(0, Math.round(v.sn)), sp = v.tl / Math.max(n, 1);
    for (let i = 0; i < n; i++) { const yy = ty + (i + .5) * sp * s; b += RC(tx - 16, yy - 7, 12, 14, { r: 3, c: ST.mute, w: 1 }) + RC(tx + v.tw * s + 4, yy - 7, 12, 14, { r: 3, c: ST.mute, w: 1 }); }
    b += RC(tx, ty, v.tw * s, v.tl * s, { f: tc, op: .25, c: tc, w: 2, r: 4 });
    b += `<g clip-path="url(#${id})">` + LN(cx, y0, cx - ext, py(v.rl), { c: ST.acc, w: 2 }) + LN(cx, y0, cx + ext, py(v.rl), { c: ST.acc, w: 2 }) + `</g>`;
    b += RC(cx - 30, y0 - 9, 60, 7, { f: ST.ink, c: ST.ink, r: 2 }) + LN(cx, y0, cx, py(v.d), { c: ST.ink, d: "6 4", w: 1.5 });
    if (v.d < v.rl) b += LN(cx - Math.min(w / 2, v.rw / 2) * s, py(v.d), cx + Math.min(w / 2, v.rw / 2) * s, py(v.d), { c: ST.acc, d: "4 3", w: 1.5 }) + `<circle cx="${cx}" cy="${py(v.d)}" r="5" style="fill:${ST.ink}"/>` + T(cx + 10, py(v.d) - 6, `D ${R(v.d)} m${v.h >= 179 ? ", wall to wall" : `, ${R(w)} m wide`}`, { a: "start", s: 11, c: ST.acc, b: 1 });
    b += T(x0 + 8, y0 + 18, `${R(v.h, 0)}° HFOV`, { a: "start", b: 1, c: ST.acc }) + T(260, py(v.rl) + 18, `${R(v.rw)} m x ${R(v.rl)} m room, table ${R(v.tw)} x ${R(v.tl)} m ${tIn ? "in view" : "- front corners outside the FOV"}`, { s: 11, c: tIn ? ST.mute : "#dc2626" });
    return SV(520, py(v.rl) + 30, b); },
  4: v => { const r = has(v.dia) ? v.dia / 2 : (v.ch - v.th) * Math.tan(v.ang * DEG / 2); if (!(r > 0)) return ""; const s = r * Math.SQRT2; return planView(v.rw, v.rl, r, Math.max(1, Math.ceil(v.rw / s)), Math.max(1, Math.ceil(v.rl / s)), "microphones"); },
  5: v => { const r = (v.ch - v.ear) * Math.tan(v.ang * DEG / 2), s = r * Math.SQRT2; return planView(v.rw, v.rl, r, Math.max(1, Math.ceil(v.rw / s)), Math.max(1, Math.ceil(v.rl / s)), "speakers"); },
  8: v => { const L = +selOpt(CALCS[7].f[0][4], v.t).split("|")[2], eff = v.len * (1 + v.sl / 100), m = Math.max(L, eff) * 1.05, sc = 460 / m, ok = eff <= L;
    return SV(520, 110, RC(30, 30, L * sc, 28, { f: ST.line, c: ST.mute }) + RC(30, 30, Math.min(eff, L) * sc, 28, { f: ok ? "#16a34a" : "#dc2626", c: "none", w: 0, op: .85 }) + (ok ? "" : RC(30 + L * sc, 30, (eff - L) * sc, 28, { f: "#dc2626", c: "none", w: 0 })) + LN(30 + L * sc, 22, 30 + L * sc, 66, { c: ST.ink, w: 2 }) + T(30 + L * sc, 82, `limit ${L} m`, { b: 1 }) + T(32, 20, `run ${R(eff, 1)} m with allowance`, { a: "start", c: ST.mute, s: 11 })); },
  9: v => { const av = v.na * v.ma, da = v.dc * v.md, ca = v.uc * v.mu, t = av + da + ca + v.ot, cap = v.up * 1000, m = Math.max(cap, t) * 1.05, sc = 460 / m, segs = [["AVoIP", av, ST.acc, 1], ["Dante", da, ST.acc, .6], ["Calls", ca, ST.acc, .35], ["Other", v.ot, ST.mute, .5]];
    let b = barRow(30, 40, 460, segs.map(x => [x[0], x[1], x[2], x[3]]), sc, 30).replace(/<rect x="30" y="40" width="460"[^>]*>$/, "") + RC(30, 40, cap * sc, 30, { c: ST.ink, w: 2 }) + LN(30 + cap * 0.8 * sc, 30, 30 + cap * 0.8 * sc, 80, { c: ST.mute, d: "4 3", w: 1 }) + T(30 + cap * sc, 100, `${v.up}G uplink`, { a: "end", b: 1 }) + T(30 + cap * .8 * sc, 24, "80%", { c: ST.mute, s: 11 });
    let lx = 30; segs.forEach(x => { b += RC(lx, 118, 12, 12, { f: x[2], c: "none", op: x[3], w: 0 }) + T(lx + 17, 129, `${x[0]} ${R(x[1], 0)} Mbps`, { a: "start", s: 11 }); lx += 125; }); return SV(520, 140, b); },
  10: v => { const segs = [["802.3af", v.af * 15.4, .4], ["PoE+", v.at * 30, .6], ["bt3", v.b3 * 60, .8], ["bt4", v.b4 * 90, 1]], t = segs.reduce((a, x) => a + x[1], 0), m = Math.max(v.bud, t) * 1.05, sc = 460 / m;
    let b = barRow(30, 40, 460, segs.map(x => [x[0], x[1], ST.acc, x[2]]), sc, 30) + RC(30, 40, v.bud * sc, 30, { c: ST.ink, w: 2 }) + LN(30 + v.bud * v.dr / 100 * sc, 30, 30 + v.bud * v.dr / 100 * sc, 80, { c: ST.mute, d: "4 3", w: 1 }) + T(30 + v.bud * sc, 100, `budget ${v.bud} W`, { a: "end", b: 1 }) + T(30 + v.bud * v.dr / 100 * sc, 24, `${v.dr}% limit`, { c: ST.mute, s: 11 });
    let lx = 30; segs.forEach(x => { b += RC(lx, 118, 12, 12, { f: ST.acc, c: "none", op: x[2], w: 0 }) + T(lx + 17, 129, `${x[0]} ${R(x[1], 0)} W`, { a: "start", s: 11 }); lx += 120; }); return SV(520, 140, b); },
  11: v => { const items = lines(v.eq).map(l => { const p = l.split(",").map(x => x.trim()); return [p[0], +p[1] || 0, +p[2] || 0]; }), ru = items.reduce((a, x) => a + x[1], 0), tot = ru + v.bl, need = Math.ceil(tot * (1 + v.sp / 100)), U = [6, 9, 12, 15, 18, 22, 24, 27, 32, 37, 42, 45, 47].find(x => x >= need) || need, u = Math.min(24, 300 / U), x0 = 150, y0 = 14;
    let b = RC(x0 - 14, y0 - 6, 244, U * u + 12, { c: ST.mute, w: 2 }), y = y0;
    items.slice().forEach(it => { const h = it[1] * u; b += RC(x0, y, 216, h - 1, { f: ST.acc, c: ST.acc, op: .3, r: 3 }) + T(x0 + 108, y + h / 2 + 4, `${it[0]} (${it[1]}U)`, { s: Math.min(12, h) }); y += h; });
    if (v.bl > 0) { b += RC(x0, y, 216, v.bl * u - 1, { f: ST.mute, c: ST.mute, op: .25, r: 3 }) + T(x0 + 108, y + v.bl * u / 2 + 4, "blanks", { s: 10, c: ST.mute }); y += v.bl * u; }
    b += RC(x0, y, 216, y0 + U * u - y, { c: ST.mute, w: 1 }) + T(x0 + 108, y + (y0 + U * u - y) / 2 + 4, "spare", { s: 11, c: ST.mute }) + T(x0 - 24, y0 + 12, "top", { a: "end", s: 11, c: ST.mute }) + T(x0 + 270, y0 + 24, `${U}U rack`, { a: "start", b: 1 }) + T(x0 + 270, y0 + 44, `${R(items.reduce((a, x) => a + x[2], 0), 0)} W`, { a: "start", c: ST.mute });
    return SV(520, U * u + 28, b); },
  12: v => { const a = aspect(v.ar), w = v.d * 0.0254 * a / Math.sqrt(1 + a * a), h = w / a, d1 = v.t1 * w, d2 = v.t2 * w, s = Math.min(380 / d2, 200 / h), sx = 480, cy = 150, top = cy - h * s / 2, bt = cy + h * s / 2;
    let b = RC(sx, top, 8, h * s, { f: ST.acc, c: ST.acc }) + LN(20, bt + 30, 505, bt + 30, { c: ST.mute, w: 1 });
    [[d1, 1, ""], [d2, .5, "5 4"]].forEach(p => { const px = sx - p[0] * s; b += LN(px, cy, sx, top, { c: ST.acc, w: 1.5, d: p[2] }) + LN(px, cy, sx, bt, { c: ST.acc, w: 1.5, d: p[2] }) + RC(px - 14, cy - 8, 14, 16, { f: ST.ink, c: ST.ink, op: p[1], r: 2 }) + T(px - 7, bt + 50, `${R(p[0])} m`, { s: 12, b: 1 }); });
    if (has(v.dist)) b += LN(sx - v.dist * s, bt + 12, sx - v.dist * s, bt + 30, { c: "#d97706", w: 2 }) + T(sx - v.dist * s, bt + 66, `planned ${R(v.dist)} m`, { c: "#d97706", s: 11 });
    return SV(520, bt + 80, b + T(sx + 4, top - 8, `${R(h)} m high`, { a: "end", c: ST.acc, b: 1 }) + T(260, 14, "side view: solid = shortest throw, dashed = longest", { c: ST.mute, s: 11 })); },
  14: v => { const V = v.L * v.W * v.H, Sf = v.L * v.W, Sw = 2 * (v.L + v.W) * v.H, S = 2 * Sf + Sw, A = Sf * v.af + Sf * v.ac + Sw * v.aw + v.ex, sab = 0.161 * V / A, eyr = 0.161 * V / (-S * Math.log(1 - Math.min(A / S, 0.99))), m = Math.max(sab, eyr, v.tg) * 1.15, sc = 400 / m;
    let b = ""; [["Sabine", sab], ["Eyring", eyr]].forEach((p, i) => { b += RC(90, 20 + i * 40, p[1] * sc, 26, { f: p[1] <= v.tg ? "#16a34a" : "#dc2626", c: "none", w: 0, op: .85 }) + T(84, 38 + i * 40, p[0], { a: "end", s: 12 }) + T(96 + p[1] * sc, 38 + i * 40, `${R(p[1])} s`, { a: "start", b: 1, s: 12 }); });
    return SV(520, 110, b + LN(90 + v.tg * sc, 10, 90 + v.tg * sc, 92, { c: ST.ink, w: 2, d: "5 3" }) + T(90 + v.tg * sc, 106, `target ${R(v.tg)} s`, { b: 1, s: 11 })); }
};

VIZ[6] = v => { const c = 331.3 + 0.606 * v.T, tm = v.dm / c * 1000, tf = v.df / c * 1000, fill = Math.max(0, (v.dm - v.df) / c * 1000), dly = fill + v.hs, s = 430 / Math.max(v.dm, 1), x0 = 40, xl = x0 + v.dm * s, xf = xl - v.df * s, y = 62;
  let b = LN(x0, y, xl, y, { c: ST.mute, w: 1, d: "3 3" }) + RC(x0 - 12, y - 12, 12, 24, { f: ST.ink, c: ST.ink, r: 2 }) + RC(xf - 6, y - 8, 12, 16, { f: ST.acc, c: ST.acc, r: 2 }) + `<circle cx="${xl}" cy="${y}" r="7" style="fill:#d97706"/>`;
  b += LN(x0, y - 26, xl, y - 26, { c: ST.ink, w: 1.2 }) + T((x0 + xl) / 2, y - 32, `main to listener ${R(v.dm)} m`, { s: 11 }) + LN(xf, y + 26, xl, y + 26, { c: ST.acc, w: 1.2 }) + T((xf + xl) / 2, y + 42, `fill ${R(v.df)} m`, { s: 11, c: ST.acc }) + T(x0 - 6, y + 40, "main", { a: "start", s: 11, c: ST.mute }) + T(xl, y + 24, "", { s: 1 });
  const sc = 330 / Math.max(tm + v.hs, 1), bx = 100, y1 = 130, y2 = 170;
  b += T(bx - 8, y1 + 17, "Main", { a: "end", s: 12 }) + RC(bx, y1, tm * sc, 24, { f: ST.ink, c: "none", op: .55, w: 0 }) + T(bx + tm * sc + 6, y1 + 17, `${R(tm, 1)} ms`, { a: "start", b: 1, s: 12 });
  b += T(bx - 8, y2 + 17, "Fill", { a: "end", s: 12 }) + RC(bx, y2, dly * sc, 24, { f: "#d97706", c: "none", op: .6, w: 0 }) + RC(bx + dly * sc, y2, tf * sc, 24, { f: ST.acc, c: "none", op: .6, w: 0 }) + T(bx + (dly + tf) * sc + 6, y2 + 17, `${R(dly + tf, 1)} ms`, { a: "start", b: 1, s: 12 });
  b += T(bx, y2 + 44, `delay ${R(dly, 1)} ms (orange) + travel ${R(tf, 1)} ms (blue) = main + ${R(v.hs, 0)} ms Haas`, { a: "start", s: 11, c: ST.mute });
  return SV(520, 240, b + T(bx, 112, "arrival time at the listener", { a: "start", s: 11, c: ST.mute })); };
const lineViz = (title, cab, load, bars, foot) => { let b = RC(24, 24, 70, 44, { c: ST.ink, r: 6, f: ST.line, op: .5 }) + T(59, 51, title, { s: 12, b: 1 }) + LN(94, 46, 400, 46, { c: ST.acc, w: 3 }) + T(247, 36, cab, { s: 12, c: ST.acc, b: 1 }) + RC(400, 24, 96, 44, { c: ST.ink, r: 6, f: ST.line, op: .5 }) + T(448, 51, load, { s: 12, b: 1 });
  bars.forEach((r, i) => { const y = 100 + i * 44; b += T(24, y + 15, r[0], { a: "start", s: 12 }) + RC(24 + 110, y, 360, 22, { c: ST.mute, w: 1 }) + RC(134, y, 360 * r[1], 22, { f: r[2], c: "none", w: 0, op: .85 }) + T(134 + 360 * Math.min(r[1], 1) - 4, y + 15, r[3], { a: "end", s: 11, c: "#fff", b: 1 }); });
  return SV(520, 110 + bars.length * 44 + 24, b + T(24, 108 + bars.length * 44 + 12, foot, { a: "start", s: 11, c: ST.mute })); };
VIZ[18] = v => { const i = v.w / 100, r = OHM[v.mm] * 2 * v.len / 1000, dv = i * r, db = 20 * L10((100 - dv) / 100), ok = Math.abs(db) <= v.max;
  return lineViz("Amp 100 V", `${R(v.len, 0)} m of ${v.mm} mm²`, `${R(v.w, 0)} W load`, [["Voltage delivered", Math.max(0, (100 - dv) / 100), ok ? "#16a34a" : "#dc2626", `${R(100 - dv, 1)} V of 100 V`], ["Loss vs limit", Math.min(1, Math.abs(db) / Math.max(v.max, 0.01)), ok ? "#16a34a" : "#dc2626", `${R(db)} dB of ${R(v.max)} dB allowed`]], `current ${R(i)} A, cable drops ${R(dv)} V and wastes ${R(i * i * r, 1)} W`); };
VIZ[19] = v => { const rc = OHM[v.mm] * 2 * v.len / 1000, db = 20 * L10(v.z / (v.z + rc)), lost = rc / (v.z + rc), df = v.z / rc;
  return lineViz("Amplifier", `${R(v.len, 0)} m of ${v.mm} mm²`, `${R(v.z, 0)} ohm speaker`, [["Power reaching speaker", 1 - lost, db > -0.5 ? "#16a34a" : "#dc2626", `${R((1 - lost) * 100, 1)}%`], ["Loss vs 0.5 dB target", Math.min(1, Math.abs(db) / 0.5), db > -0.5 ? "#16a34a" : "#dc2626", `${R(db)} dB`]], `loop resistance ${R(rc, 3)} ohm, damping factor ${R(df, 0)}`); };
showList();
