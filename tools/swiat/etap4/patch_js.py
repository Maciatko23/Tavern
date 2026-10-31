# -*- coding: utf-8 -*-
"""Etap 4: zmiany MapaWyspy.js (kopia w staging/js/plugins/). Każda zmiana jest wsteczna: stara wersja danych (bez ASPEKT, lab, BRZEGI, KORYTO, LAS) działa jak dotąd.
  python tools/swiat/etap4/patch_js.py     (idempotentne: zawsze od oryginału js/plugins/MapaWyspy.js)"""
import os, sys, shutil
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
SRC = os.path.join(ROOT, "js", "plugins", "MapaWyspy.js"); DST = os.path.join(HERE, "staging", "js", "plugins", "MapaWyspy.js")
t = open(SRC, "rb").read().decode("utf-8"); crlf = "\r\n" in t; t = t.replace("\r\n", "\n")
def rep(a, b):
    global t
    assert t.count(a) == 1, (t.count(a), a[:60])
    t = t.replace(a, b)
rep("    const ASPECT = 820 / 550;   // (the atlas's box)",
    "    const ASPECT = D.ASPEKT > 0 ? D.ASPEKT : 820 / 550;   // (the island's box: the data's ASPEKT, else the atlas's)")
rep("return { id: p.id, key: p.key, name: p.nazwa, x: p.x, y: p.y, state, here: String(here) === p.key, target };",
    "return { id: p.id, key: p.key, name: p.nazwa, x: p.x, y: p.y, lab: p.lab, state, here: String(here) === p.key, target };")
rep("""    function shore(ctx, box) {
        const pts = D.BRZEG.map(([x, y]) => at(box, { x, y })), n = pts.length;""",
    """    function shore(ctx, box, line) {
        const pts = (line || D.BRZEG).map(([x, y]) => at(box, { x, y })), n = pts.length;""")
rep("""        shore(ctx, box);
        ctx.fillStyle = K.land;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = K.shore;
        ctx.stroke();
""", """        for (const line of [null].concat(D.BRZEGI || [])) {   // (the island, then its islets)
            shore(ctx, box, line);
            ctx.fillStyle = K.land;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = K.shore;
            ctx.stroke();
        }
        if (D.LAS && D.LAS.length) {   // the trackless forest between the maps: a soft pattern of dots
            ctx.fillStyle = K.forest;
            for (const [fx, fy] of D.LAS) { const q = at(box, { x: fx, y: fy }); ctx.beginPath(); ctx.arc(q.x, q.y, 1.7, 0, Math.PI * 2); ctx.fill(); }
        }
        if (D.KORYTO && D.KORYTO.length) {   // the dry riverbed: a thin broken line
            ctx.lineWidth = 1.3; ctx.strokeStyle = K.bed; ctx.setLineDash([5, 4]);
            for (const part of D.KORYTO) { ctx.beginPath(); part.forEach(([kx, ky], i) => { const q = at(box, { x: kx, y: ky }); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.stroke(); }
            ctx.setLineDash([]);
        }
""")
rep("""road: "rgb(96,100,108)", sea: "rgb(14,18,22)"
    };""", """road: "rgb(96,100,108)", sea: "rgb(14,18,22)",
        forest: "rgba(64,80,68,0.65)", bed: "rgb(94,88,72)"
    };""")
rep("""            if (n.state === "known") {
                const above = n.y > 0.82, size = on ? 17 : 16, ly = above ? p.y - r - (n.target ? 40 : 24) : p.y + r + 4;
                label(n.name, p.x, ly, size, on ? K.acc : can ? K.text : K.dim, on ? "bold" : null);
                const extra = typeof o.labelOf === "function" ? o.labelOf(n.key) : "";
                if (extra) label(extra, p.x, ly + size + 3, 14, on ? K.acc : K.muted);
            }""", """            if (n.state === "known") {
                const side = n.lab || (n.y > 0.82 ? "n" : "s"), size = on ? 17 : 16, col = on ? K.acc : can ? K.text : K.dim, face = on ? "bold" : null;
                const extra = typeof o.labelOf === "function" ? o.labelOf(n.key) : "";
                if (side === "e" || side === "w") {   // (beside the point: the name, the stop's line under it)
                    const ly = p.y - Math.ceil(size * 0.75), lx = side === "e" ? p.x + r + 7 : p.x - r - 7 - 300;
                    if (c && c.textOut) c.textOut(b, n.name, Math.round(lx), Math.round(ly), 300, Math.ceil(size * 1.5), side === "e" ? "left" : "right", { size, color: col, face, plain: true });
                    if (extra && c && c.textOut) c.textOut(b, extra, Math.round(lx), Math.round(ly + size + 3), 300, 21, side === "e" ? "left" : "right", { size: 14, color: on ? K.acc : K.muted, plain: true });
                } else {
                    const above = side === "n", ly0 = above ? p.y - r - (n.target ? 40 : 24) : p.y + r + 4, ly = above && extra ? ly0 - size - 3 : ly0;   // (above: the name over its second line)
                    label(n.name, p.x, ly, size, col, face);
                    if (extra) label(extra, p.x, ly + size + 3, 14, on ? K.acc : K.muted);
                }
            }""")
open(DST, "wb").write((t.replace("\n", "\r\n") if crlf else t).encode("utf-8"))
import hashlib, json
sp = os.path.join(HERE, "staging", "sumy.json")
sumy = json.load(open(sp)) if os.path.exists(sp) else {}
sumy["MapaWyspy.js"] = hashlib.sha256(open(SRC, "rb").read()).hexdigest()
json.dump(sumy, open(sp, "w"), indent=1)
print("MapaWyspy.js ->", DST, "(CRLF)" if crlf else "(LF)")
