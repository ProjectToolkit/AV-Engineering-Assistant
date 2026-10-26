// AV Engineering Assistant - brand database. SEED VALUES: verify against current datasheets
// (blank = unknown, the auditor reports it instead of guessing). Edit rows freely.
const POE_W = { af: 15.4, at: 30, bt3: 60, bt4: 90 };
const LIMITS = { hdmiPassive: 5, hdmiActive: 15, usb2: 5, usb3: 3, usbc: 2, usbActive: 10, cat: 100, catWarn: 90, hdbt: 100 };
const TIERS = { 1: "Cisco,Logitech,Poly,Yealink,Neat,AVer,Crestron,Q-SYS,Shure,Extron", 2: "Jabra,Lenovo,HP", 3: "Sennheiser,Biamp,Kramer,Barco,MAXHUB,CommBox,Huddly" };
// make|model|poe|danteTx|avoipMbps|RU|kg|W
const RAW = `Cisco|Room Navigator|af|||||
Cisco|Room Kit Pro||||1|3|
Cisco|Room Bar|none||||||
Logitech|Tap IP|at|||||
Logitech|Rally Bar|none||||||
Poly|TC10|af|||||
Poly|Studio X50|none||||||
Yealink|MeetingBar A20|||||||
Neat|Neat Pad|af|||||
Neat|Neat Bar|||||||
AVer|CAM520 Pro3|||||||
Crestron|DM-NVX-360|at||850|1|1.5|
Crestron|DM-NVX-363|at||850|1|1.5|
Crestron|TSW-1070|at|||||
Crestron|CP4N|||||1|2|
Q-SYS|Core 110f|none|||1|3|
Q-SYS|NC-20x60|at|||||
Shure|MXA920|at|8||||
Shure|MXA710|at|||||
Shure|MXA902|at|8||||
Shure|MXW2X|none||||||
Q-SYS|NC-12x80|at|||||
Q-SYS|CORE 8 FLEX|at|||1|3|
Q-SYS|TSC-|at|||||
Extron|DTP|none||||||
Shure|IntelliMix P300|none||||1|2|
Extron|NAV E 201|||800|1|1|
Extron|NAV SD 201|||800|1|1|
Extron|DMP 128 Plus C|||||1|3|
Jabra|PanaCast 50|||||||
Lenovo|ThinkSmart Core|||||||
HP|Presence Mini PC|||||||
Sennheiser|TeamConnect Ceiling 2|||||||
Biamp|TesiraFORTE X|||||1|3|
Kramer|VS-88H2|||||1|3|
Barco|ClickShare CX-30|||||||
MAXHUB|XT Series|||||||
CommBox|Interactive Classic|||||||
Huddly|L1|||||||
Generic|UPS 3kVA|none||||2|35|
Generic|Power Amplifier 4ch|none||||2|18|`;
const DB = RAW.split("\n").map(l => { const c = l.split("|"); return { make: c[0], model: c[1], poe: c[2] || "", dante: +c[3] || 0, mbps: +c[4] || 0, ru: +c[5] || 0, kg: +c[6] || 0 }; });
const nk = s => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const BA = { hppoly: "Poly", polyhp: "Poly", hpinc: "HP", qsc: "Q-SYS" };
function lookup(make, model, desc) {
  const mk = nk(BA[nk(make)] || make), m = nk(model), ds = nk(desc);
  return DB.filter(d => nk(d.make) === mk && ((m && (m.startsWith(nk(d.model)) || nk(d.model).startsWith(m))) || (ds && nk(d.model).length >= 5 && ds.includes(nk(d.model)))))
    .sort((a, b) => b.model.length - a.model.length)[0] || null;
}
function normPoe(v) {
  const s = String(v || "").toLowerCase().replace(/\s/g, ""); if (!s) return null;
  if (/none|n\/a|ext/.test(s)) return "none"; if (/bt4|type4|90w/.test(s)) return "bt4";
  if (/bt|type3|60w|\+\+/.test(s)) return "bt3"; if (/at|30w|\+/.test(s)) return "at"; return /af|15w|poe/.test(s) ? "af" : null;
}
