// Drawing Resources data (CAD, Revit, Visio, schematic and rack tools).
// Row: name | url | formats (comma list) | category | status | note
// status: "" = confirmed live, L = Login required, N = No public library, U = Unconfirmed (check before relying on it)
// Checked 27 Oct 2026. Re-check links before quoting; manufacturers move these pages often.
var RES_CATS = ["Manufacturer Library", "Shared Library", "Visio Stencils", "Schematic Tools", "Rack & Elevations", "Reference Designs"];
var RES_RAW = [
// ---- Manufacturer Library ----
"AMX|https://www.amx.com/en-US/support_downloads/download_types/caddrawing|DWG,DXF,PDF|Manufacturer Library||Pictorial and mounting drawings per product. Visio stencils are only mentioned on the HARMAN forum.",
"Atlona|https://atlona.com/resources/|-|Manufacturer Library|N|Literature and manuals only. No CAD, Revit or Visio downloads found. Ask Atlona support.",
"AtlasIED|https://www.atlasied.com/CAD-Library|DWG,PDF|Manufacturer Library||CAD library page (DWG, ZIP, PDF). Revit objects are on ARCAT: https://www.arcat.com/company/atlasied-38830-atlas_sound/bim",
"Audio-Technica|https://www.visiostencils.com/product/products/Audio-Technica.html|VSS|Manufacturer Library|N|No manufacturer library found. Only third-party Visio stencils (link shown).",
"AVer|https://www.aver.com/download-center|-|Manufacturer Library|N|Download centre has manuals and software only. No CAD or BIM found.",
"Barco|https://www.barco.com/en/support/docs/TDE11042|DWG,RFA,STEP|Manufacturer Library|U|Per-product support documents: 2D DWG outlines (G100, RLM), BIM object files (UDM, FL35, F85, FLM HD20, HDX), STEP lens files. No single index page found.",
"BenQ|https://www.benq.com/en-ca/support/downloads-faq/manuals/datasheet/signage-datasheet-005.html|CAD|Manufacturer Library|U|CAD files are per product on each model's Download tab. File type not stated on the page.",
"Biamp|https://www.biamp.com/support/revit-bim|RFA|Manufacturer Library|U|Revit BIM files page. The page did not state whether login is needed.",
"Blustream|https://www.blustream-us.com/|-|Manufacturer Library|N|No CAD, Revit or Visio downloads found (manuals only). Homepage shown because there is no library page.",
"Bose Professional|https://www.bimobject.com/en-us/bose|RFA|Manufacturer Library||Revit objects on BIMobject (DesignMax, FreeSpace, ArenaMatch, RoomMatch). No separate Bose CAD page found.",
"BrightSign|https://www.brightsign.biz/resources/|-|Manufacturer Library|N|Resource centre has software, literature and demos. No CAD or BIM found.",
"Cisco|https://www.cisco.com/c/en/us/support/collaboration-endpoints/spark-room-kit-series/products-technical-reference-list.html|PDF|Manufacturer Library||Room Series technical references. CAD drawings are PDFs, e.g. https://www.cisco.com/c/dam/en/us/td/docs/telepresence/endpoint/room-series/cad-drawing/room-bar-pro-cad-drawings.pdf",
"ClearOne (CAD drawings)|https://www.clearone.com/ceiling-microphone-array-cad-drawing-dxf|DXF,DWG,PDF|Manufacturer Library||One page per drawing (ceiling mic array DXF, wall-mount DWG and PDF, Dialog 20).",
"ClearOne (BMA 360 Revit plugin)|https://www.clearone.com/bma-360-revit-plugin|RFA|Manufacturer Library||Revit plugin for the BMA 360 ceiling array.",
"Crestron|https://support.crestron.com/app/answers/detail/a_id/1000823/~/sss%2Fcad-design-application-drawings---microsoft-teams-rooms|CAD,PDF|Manufacturer Library|U|SSS/CAD Design Application Drawings (Teams Rooms; also Flex, B-Series, M-Series, Zoom Rooms). Support site blocked automated checking, so file types and login are unconfirmed.",
"Epson|https://www.bimobject.com/en-us/epsonamerica|RFA|Manufacturer Library||Projector Revit objects on BIMobject (Pro G, Pro Z, PowerLite, BrightLink).",
"Extron|https://www.extron.com/article/design-resources-for-architects-and-engineers?tab=tools|CAD,PDF|Manufacturer Library|U|Panel drawings, block diagrams and design resources. Site blocked automated fetch, so formats are unconfirmed. Visio library is listed separately.",
"HP / Poly|https://h30434.www3.hp.com/t5/Meeting-Room-Solutions/Dimensional-Drawings-for-Poly-Products-and-accessories/td-p/8738366|PDF|Manufacturer Library|U|Community post for Poly dimensional drawings. No official CAD, Revit or Visio library found.",
"Jabra|https://www.jabra.com/|-|Manufacturer Library|N|No public drawing library found. Homepage shown because there is no library page.",
"JBL Professional|https://jblpro.com/en-US/support_downloads/download_types/caddrawing|DWG,DXF,RFA|Manufacturer Library||CAD drawings per product; VTX Revit files.",
"Kramer|https://k.kramerav.com/support/downloads.asp|-|Manufacturer Library|U|Downloads page (manuals, application diagrams). No CAD library page was confirmed.",
"Lenovo|https://lenovopress.lenovo.com/lp1599-visio-stencils|VSS|Manufacturer Library|N|Visio stencils exist for servers only. No ThinkSmart CAD, Revit or Visio library found.",
"LG Business Solutions|https://solutions.lg.com/us/bim-library|RFA|Manufacturer Library||BIM library (Revit families via BIMsmith).",
"Lightware|https://archive.lightware.com/downloads|-|Manufacturer Library|U|Downloads page (manuals, software). No CAD or Visio library confirmed. Lightware devices are in D-Tools.",
"Listen Technologies|https://www.listentech.com/support/manuals/|PDF|Manufacturer Library|N|Manuals and software only. No CAD, Revit or Visio found.",
"Logitech|https://hub.sync.logitech.com/support/post/video-conferencing-product-design-file-hub-1SHJfOP9BPQ2enk|PDF,DXF,SVG|Manufacturer Library||Video conferencing product design file hub. 2D files (SVG, PDF, DXF, AI) and 3D FBX. Direct ZIP downloads, no login seen. No DWG, Revit or Visio.",
"MAXHUB|https://www.maxhub.com/|-|Manufacturer Library|N|Resource centre has no CAD files. Homepage shown because there is no library page.",
"Neat|https://neat.no/|-|Manufacturer Library|N|Resources are guides and datasheets. No CAD, Revit or Visio found. Homepage shown because there is no library page.",
"NETGEAR AV|https://www.netgear.com/hub/business/av/av-tech-guides/|VSS|Manufacturer Library|L|AV over IP technical guides. M4250 Visio stencils are offered through Netzoom and need registration.",
"Panasonic Connect|https://docs.connect.panasonic.com/projector/download/cad/|CAD|Manufacturer Library|U|CAD pages for projectors (also prodisplays/download/cad/). File type not stated on search results.",
"Planar|https://www.planar.com/products/large-format-lcd-displays/ultrares-p/ultrares-p-downloads/|PDF,DXF|Manufacturer Library|U|Drawings are per product on each Downloads tab. Example link shown.",
"Q-SYS / QSC|https://www.qsys.com/resources/|-|Manufacturer Library|N|No CAD, Revit or Visio library found. Design files are in Reference Designs below.",
"Samsung Business|https://www.samsung.com/us/business/builder/cad-module/|DWG|Manufacturer Library|L|The CAD module page is for appliances. Display drawings are in the display support centre and may need a partner login.",
"Sennheiser|https://www.bimobject.com/en-us/sennheiser/product/tcc2|RFA|Manufacturer Library|U|BIM objects on BIMobject (TeamConnect Ceiling 2, Bar M, EW-DX). The page does not state formats.",
"Sharp NEC Display Solutions|https://www.sharp-nec-displays.com/dl/en/|-|Manufacturer Library|N|Download centre has drivers, software and manuals. No CAD found.",
"Shure|https://www.shure.com/en-US/docs/guide/MXA920|PDF,RFA|Manufacturer Library|U|Product user guides carry dimensions. Revit objects were limited to ShureSAFE items on ARCAT. Check each product's Downloads tab.",
"SMART Technologies|https://www.smarttech.com/|-|Manufacturer Library|N|Display downloads have no CAD files. Homepage shown because there is no library page.",
"Sony Professional|https://pro.sony/ue_US/consultant-portal|RFA,CAD|Manufacturer Library||Architects, Consultants and Engineers portal (Revit via BIMobject). CAD pages per product, e.g. https://pro.sony/ue_US/product-resources/knowledge-panel/cad-drawings-laser-projectors",
"ViewSonic|https://www.viewsonic.com/global/support/downloads|-|Manufacturer Library|N|Downloads are manuals and drivers. No CAD or BIM found.",
"VuWall|https://vuwall.com/design-services/|-|Manufacturer Library|N|No downloadable library. VuWall offers free video wall design services instead.",
"Williams AV|https://williamsav.com/support/tech-services/|-|Manufacturer Library|U|Tech services and design support. No CAD, Revit or Visio download found. See the Infinium design estimator under Schematic Tools.",
"Yamaha Professional Audio|https://www.bimobject.com/en/yamaha/product/vc8n-ceiling-speaker|RFA|Manufacturer Library|U|Revit objects on BIMobject. Product Downloads pages on usa.yamaha.com list drawings; formats not confirmed.",
"Yealink|https://support.yealink.com/docs/a10/meetingbar-a10-uvc34-mounting-bracket-cad-dxf/189e661cf70443549229e3f2890238c8|DXF,STEP|Manufacturer Library||CAD files per product on the support site (DXF and STP).",
// ---- Shared Library ----
"ARCAT BIM, audio-visual equipment|https://www.arcat.com/content-type/bim/equipment-11/audio-visual-equipment-115200|RFA|Shared Library||Free Revit families for AV equipment.",
"AVIXA J-STD-710 drawing symbols|https://www.avixa.org/resources/standards/av-control-architectural-drawing-symbols|-|Shared Library|U|Standard AV and control architectural drawing symbols. Electronic symbol files are sold in the AVIXA store, so formats and cost are unconfirmed.",
"BIMobject, audio|https://www.bimobject.com/en-us/categories/electronics/audio|RFA|Shared Library||Free Revit objects from many AV brands. Filter by Revit.",
"BIMsmith Market, audio equipment|https://market.bimsmith.com/category/Audio-Equipment-revit|RFA|Shared Library||Revit families. Also categories for Displays, Projectors and Speakers.",
"CADdetails, audio-visual equipment|https://www.caddetails.com/cad-drawings/mf/audio-visual-equipment/|DWG|Shared Library||Free CAD drawings from manufacturers.",
"CADdetails, conference room AV systems|https://www.caddetails.com/cad-drawings/mf/integrated-audio-video-systems-and-equipment-for-conference-rooms/|DWG|Shared Library||Integrated AV systems for conference rooms.",
// ---- Visio Stencils ----
"AMX Visio stencils (HARMAN forum)|https://proforums.harman.com/amx/discussion/139923/visio-stencils|VSS|Visio Stencils|U|Forum thread, not an official download page. Ask in the thread or HARMAN support.",
"D-Tools free Visio shapes|https://www.d-tools.com/freetoolspsl|VSS,VSSX|Visio Stencils|L|Industry-standard symbols for Visio. Registration form required.",
"Extron Visio library|https://www.extron.com/article/visio-library|VSS,VSSX|Visio Stencils|U|Official Extron Visio library. Site blocked automated checking, so format list is unconfirmed.",
"HP Poly Visio stencil request|https://h30434.www3.hp.com/t5/Collaboration-Conferencing-Platforms/I-am-looking-for-Visio-design-stencils-VSS-for-the-Poly/td-p/9623262|VSS|Visio Stencils|U|Community thread asking for Poly stencils. Not an official download.",
"ShapeSource|https://www.shapesource.com/|VSS,VSSX|Visio Stencils||Free third-party Visio stencils, including AV extenders and IPTV vendors.",
"Visio Stencils.com, AV gear|https://www.visiostencils.com/product/products/AV%20Gear.html|VSS,VSSX|Visio Stencils||Third-party AV stencils. Also manufacturer pages for Biamp, Crestron, Extron and Audio-Technica.",
"Visio Stencils.com, Biamp|https://www.visiostencils.com/product/products/Biamp%20Systems.html|VSS,VSSX|Visio Stencils||Third-party stencils for Biamp.",
"Visio Stencils.com, Crestron|https://www.visiostencils.com/product/products/Crestron%20Electronics.html|VSS,VSSX|Visio Stencils||Third-party stencils for Crestron (Set 2 also listed).",
"Visio Stencils.com, Extron|https://www.visiostencils.com/product/products/Extron%20Electronics.html|VSS,VSSX|Visio Stencils||Third-party stencils for Extron.",
// ---- Schematic Tools ----
"D-Tools System Integrator, Visio shapes|https://docs.d-tools.com/en/articles/9453755-visio-shapes|VSS,VSSX|Schematic Tools||Product database with Visio-based system drawings. Paid software.",
"draw.io (diagrams.net), rack and network shapes|https://www.drawio.com/docs/diagram-types/rack-diagrams/|SVG,PDF|Schematic Tools||Free. Built-in rack and network shape libraries. No dedicated AV library confirmed.",
"Microsoft Visio, floor plans|https://www.microsoft.com/en-gb/microsoft-365/visio/floor-plan-software|VSSX|Schematic Tools||Visio floor plan and layout templates. Paid.",
"Q-SYS Designer software|https://www.qsys.com/resources/software-and-firmware/q-sys-designer-software/|-|Schematic Tools||Free signal-flow design environment for Q-SYS systems.",
"Stardraw Design|https://stardraw.com/sd7/overview|DWG,PDF|Schematic Tools|U|Schematic, rack and pictorial drawings with a large manufacturer symbol library (over 70,000 symbols). Export formats not confirmed. Paid.",
"Stardraw symbol libraries|https://stardraw.com/sd7/features/libraries|-|Schematic Tools||Manufacturer symbol libraries used inside Stardraw Design.",
"Williams AV Infinium design estimator|https://estimator.williamsav.com/|-|Schematic Tools||Auracast coverage estimator (web).",
"XTEN-AV X-DRAW|https://xtenav.com/av-design-templates/|PDF|Schematic Tools|U|AV design templates and drawing generation. Export formats not confirmed. Paid.",
// ---- Rack & Elevations ----
"draw.io rack diagrams|https://www.drawio.com/docs/diagram-types/rack-diagrams/|SVG,PDF|Rack & Elevations||Free rack elevation diagrams in the browser.",
"Extron panel drawings|https://www.extron.com/DOWNLOAD/download.aspx?type=file&material=5&id=D|CAD,PDF|Rack & Elevations|U|Front and rear panel drawings, handy for wall plates and rack faces. Site blocked automated checking, so formats are unconfirmed.",
"Legrand AV 3D design tool|https://www.legrandav.com/tools%20and%20training/tools|-|Rack & Elevations||Middle Atlantic rack configurator. No Visio or CAD files listed on the page.",
"Stardraw rack layout|https://stardraw.com/sd7/features/modules/racklayout|-|Rack & Elevations||Rack layout module in Stardraw Design. Paid.",
"XTEN-AV rack diagram software comparison|https://xtenav.com/blog/rack-diagram-software-for-av-system-integrators/|-|Rack & Elevations||Vendor article comparing rack design tools, including free options. Treat as a starting list.",
// ---- Reference Designs ----
"Biamp Design Library|https://support.biamp.com/Design_Library|PDF|Reference Designs||Conference room design templates (divisible rooms, beamtracking mics, AEC).",
"Cisco medium collaboration room design guide|https://www.cisco.com/c/dam/en/us/solutions/collateral/hybrid-work/webex-nyc-design-guide-medium-collaboration-room-video-centric.pdf|PDF|Reference Designs||Video-centric medium room. A dual display version is also published.",
"Extron engineering block diagrams|https://www.extron.com/DOWNLOAD/download.aspx?material=79&page=2&id=A&productcategoryid=0&fileLang=4|PDF|Reference Designs|U|Engineering block diagrams. Site blocked automated checking.",
"Logitech room design guide|https://www.logitech.com/content/dam/logitech/vc/en/pdf/logitech-room-design-guide.pdf|PDF|Reference Designs||Room layouts and camera and display placement.",
"Logitech wiring diagrams|https://hub.sync.logitech.com/wiring-diagrams|PDF|Reference Designs||Conference room wiring diagrams.",
"Microsoft Teams Rooms planning guidance|https://learn.microsoft.com/en-us/microsoftteams/rooms/room-planning-guidance|Web|Reference Designs||Room sizes, seating, and Signature room design.",
"Q-SYS sample designs|https://support.qsys.com/en_US/application-notes/how-to-%7C-accessing-sample-designs-in-q-sys|Web|Reference Designs||How to open sample designs in Q-SYS Designer. Conference room control guide: https://www.qsys.com/resource-files/productresources/dn/q_dn_qsys_controllingaconference.pdf",
"Shure MXA920 coverage guide|https://www.shure.com/en-US/docs/guide/MXA920|PDF|Reference Designs||Ceiling array placement and coverage areas. See also https://www.shure.com/en-EU/conferencing-meetings/ignite/how-do-mxa920-coverage-areas-work",
"Yealink design center|https://www.yealink.com/en/design-center/conference-room|Web|Reference Designs||Deployment diagrams, seating and wiring layouts per room size.",
"Zoom Rooms design guide|https://support.zoom.us/hc/en-us/articles/360021724691-Zoom-Rooms-Design-Guides|PDF|Reference Designs||Room design guides. ProAV designs: https://support.zoom.us/hc/en-us/sections/360009297492-Zoom-Rooms-ProAV-Designs"
];
var RES = RES_RAW.map(function (l) {
  var p = l.split("|");
  return { name: p[0], url: p[1], fmt: p[2] == "-" ? [] : p[2].split(","), cat: p[3], st: p[4] || "", note: p[5] || "" };
});
var RES_ST = { L: "Login required", N: "No public library", U: "Unconfirmed" };

// ---- UI ----
(function () {
  var root = document.getElementById("resx");
  if (!root) return;
  var st = { q: "", cat: "All", fmt: "All", status: "All" };
  var fmts = {};
  RES.forEach(function (r) { r.fmt.forEach(function (f) { fmts[f] = 1; }); });
  var FMT = ["All"].concat(Object.keys(fmts).sort());
  var CATS = ["All"].concat(RES_CATS);
  var STAT = ["All", "Confirmed", "Login required", "No public library", "Unconfirmed"];
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function linkify(s) { return esc(s).replace(/https?:\/\/[^\s)]+/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener noreferrer" style="color:var(--accent-text);text-decoration:underline">' + u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 60) + "</a>"; }); }
  function chips(list, key) {
    return list.map(function (v) { return '<button type="button" class="chip" data-k="' + key + '" data-v="' + esc(v) + '" aria-pressed="' + (st[key] == v) + '">' + esc(v) + "</button>"; }).join(" ");
  }
  function stLabel(r) { return r.st ? RES_ST[r.st] : ""; }
  function match(r) {
    if (st.cat != "All" && r.cat != st.cat) return false;
    if (st.fmt != "All" && r.fmt.indexOf(st.fmt) < 0) return false;
    if (st.status != "All") { var l = stLabel(r) || "Confirmed"; if (l != st.status) return false; }
    if (st.q) { var h = (r.name + " " + r.cat + " " + r.fmt.join(" ") + " " + r.note + " " + stLabel(r)).toLowerCase(); if (st.q.toLowerCase().split(/\s+/).some(function (w) { return h.indexOf(w) < 0; })) return false; }
    return true;
  }
  function badge(r) {
    var l = stLabel(r); if (!l) return "";
    var bg = r.st == "U" ? "var(--s-warn)" : r.st == "L" ? "var(--s-err)" : "var(--fill)";
    return '<span class="rsb" style="background:' + bg + '">' + l + "</span>";
  }
  function render() {
    var q = root.querySelector("#rq"); var keep = q && document.activeElement == q;
    var rows = RES.filter(match);
    var html = '<div class="mb-2"><input id="rq" type="search" placeholder="Search brand, format or category" value="' + esc(st.q) + '" style="width:100%;max-width:420px"></div>' +
      '<div class="rsr"><b>Category</b> ' + chips(CATS, "cat") + '</div><div class="rsr"><b>Format</b> ' + chips(FMT, "fmt") + '</div><div class="rsr"><b>Status</b> ' + chips(STAT, "status") + "</div>" +
      '<p class="text-xs my-2" style="color:var(--mute)">' + rows.length + " of " + RES.length + " entries. Checked 27 Oct 2026. Links open in a new tab.</p>";
    RES_CATS.forEach(function (c) {
      var g = rows.filter(function (r) { return r.cat == c; }).sort(function (a, b) { return a.name.localeCompare(b.name, "en", { sensitivity: "base" }); });
      if (!g.length) return;
      html += '<h3 class="rsh">' + c + " <span>" + g.length + "</span></h3>";
      g.forEach(function (r) {
        html += '<div class="rse"><div class="flex flex-wrap items-center gap-2"><a href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer" class="rsn">' + esc(r.name) + "</a>" +
          r.fmt.map(function (f) { return '<span class="rsf">' + esc(f) + "</span>"; }).join("") + badge(r) + "</div>" +
          (r.note ? '<div class="text-xs mt-1" style="color:var(--mute)">' + linkify(r.note) + "</div>" : "") +
          '<div class="text-xs rsu">' + esc(r.url) + "</div></div>";
      });
    });
    if (!rows.length) html += '<p class="text-sm p-3">No entries match.</p>';
    var un = RES.filter(function (r) { return r.st == "U"; });
    var no = RES.filter(function (r) { return r.st == "N"; });
    html += '<h3 class="rsh">Flags <span>' + (un.length + no.length) + "</span></h3><p class=\"text-xs\" style=\"color:var(--mute)\"><b>Unconfirmed (check before relying on):</b> " + un.map(function (r) { return esc(r.name); }).join(", ") +
      '.</p><p class="text-xs mt-2" style="color:var(--mute)"><b>No public library found:</b> ' + no.map(function (r) { return esc(r.name); }).join(", ") + ".</p>";
    root.innerHTML = html;
    root.querySelectorAll(".chip").forEach(function (b) { b.onclick = function () { st[b.dataset.k] = b.dataset.v; render(); }; });
    var nq = root.querySelector("#rq");
    nq.oninput = function () { st.q = nq.value; var pos = nq.selectionStart; render(); var z = root.querySelector("#rq"); z.focus(); try { z.setSelectionRange(pos, pos); } catch (e) {} };
    if (keep) nq.focus();
  }
  render();
})();
