# -*- coding: utf-8 -*-
"""(ZASTĄPIONE 2026-11-07 przez tools/mapy/mapa_prawdziwa.py: pod E jest teraz prawdziwa mapa x6 - ten szkic x3 już nie działa.)
Mapa wyspy: przybliżenie x3 (gracz 2026-11-07: „a da się tę mapę jakby powiększyć ze 3 razy i po niej po prostu się poruszać?”
-> „Kursor po miejscach”). W zakładce Mapa, w środku (O): E przybliża, Q oddala (P też najpierw oddala); W/S/A/D skacze po
miejscach jak dotąd, a przybliżona mapa płynnie jedzie za kursorem. Przybliżony schemat rysuje się RAZ do własnego obrazka
(1944 x 1296 px), pole pokazuje jego kawałek (sama ramka obrazka się przesuwa - nic nie jest rysowane w czasie przesuwania);
napisy dla tej wielkości: at3 w danych (tools/mapy/mapa_wyspy_atlas.py, skala 3, tylko w pudełku wyspy).
  python tools/mapy/mapa_wyspy_zoom.py              (kopia w tools/mapy/staging_mapa)
  python tools/mapy/mapa_wyspy_zoom.py --wykonaj    (do js/; kopia: tools/mapy/kopie_zapasowe/<czas>_zoom)"""
import datetime, os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
import mapa_wyspy_atlas as ATL
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
PLUG = os.path.join(ROOT, "js", "plugins")
STG = os.path.join(HERE, "staging_mapa", "js", "plugins")


def rep(s, old, new, what):
    if s.count(old) != 1: raise SystemExit("%s: %r (%d)" % (what, old[:70], s.count(old)))
    return s.replace(old, new)


data = open(os.path.join(PLUG, "MapaWyspy_Data.js"), "rb").read().decode("utf-8")
if "at3:" in data: raise SystemExit("już zrobione: MapaWyspy_Data.js ma at3")
a = data.index("    const DROGI = ["); b = data.index("\n    ];", a)
rd = [(x.strip('"'), y.strip('"')) for x, y in re.findall(r'\[("podziemia"|\d+), ("podziemia"|\d+)\]', data[a:b])]
data, n, nl, bad = ATL.place(data, rd, scale=3, key="at3", side=0)
print("napisy x3: %d miejsc, %d z kreską%s" % (n, nl, "; ZACHODZĄ: %s" % bad if bad else ", nic nie zachodzi"))
data = rep(data, "wnętrza przypisane do miejsc. v2.1.0", "wnętrza przypisane do miejsc. v2.2.0", "Data")

mw = open(os.path.join(PLUG, "MapaWyspy.js"), "rb").read().decode("utf-8")
W = "MapaWyspy.js"
mw = rep(mw, "lab: p.lab, at: p.at || null, maly: !!p.maly,", "lab: p.lab, at: p.at || null, at3: p.at3 || null, maly: !!p.maly,", W)
mw = rep(mw, """        const atlasName = (n, p, r, on, can) => {""", """        const atlasName = (n, A, p, r, on, can) => {""", W)
mw = rep(mw, """            const q = at(box, { x: n.at[0], y: n.at[1] }), al = n.at[2], x0 = al === "l" ? q.x : al === "r" ? q.x - w : q.x - w / 2, hh = Math.ceil(size * 1.5);
            if (n.at[3]) {""", """            const q = at(box, { x: A[0], y: A[1] }), al = A[2], x0 = al === "l" ? q.x : al === "r" ? q.x - w : q.x - w / 2, hh = Math.ceil(size * 1.5);
            if (A[3]) {""", W)
mw = rep(mw, """            if (n.state === "known" && o.atlas && n.at) atlasName(n, p, r, on, can);""",
         """            const A = n[o.atKey || "at"];   // (o.atKey "at3": the names of the zoomed sketch)
            if (n.state === "known" && o.atlas && A) atlasName(n, A, p, r, on, can);""", W)
mw = rep(mw, """    const ATLAS = { top: 26, bottom: 26 };""", """    const ATLAS = { top: 26, bottom: 26 };
    const ZOOM = 3;   // (2026-11-07: E - the sketch three times bigger, the field slides after the cursor; Q / P back)""", W)
mw = rep(mw, """            return [["W/S/A/D", word(TX, "klawisz.miejsce") || "miejsce"], ["O", word(TX, "klawisz.karta") || "karta miejsca"], ["P", word(TX, "klawisz.wroc") || "wróć"]];""",
         """            return [["W/S/A/D", word(TX, "klawisz.miejsce") || "miejsce"], ["E/Q", word(TX, "klawisz.zoom") || "przybliż / oddal"], ["O", word(TX, "klawisz.karta") || "karta miejsca"], ["P", word(TX, "klawisz.wroc") || "wróć"]];""", W)
mw = rep(mw, """        MapaView.prototype.known = function() { return (this._drawn ? this._drawn.nodes : []).filter(n => n.state === "known"); };""",
         """        MapaView.prototype.known = function() { return (this._zoom && this._zoomNodes ? this._zoomNodes : this._drawn ? this._drawn.nodes : []).filter(n => n.state === "known"); };""", W)
mw = rep(mw, """        MapaView.prototype.leave = function() { this._card = false; this._mx = undefined; };
        MapaView.prototype.cancel = function() {
            if (!this._card) return false;""", """        MapaView.prototype.leave = function() { this._card = false; this._mx = undefined; this.dropZoom(); };
        MapaView.prototype.cancel = function() {
            if (!this._card) return this.zoomOut();   // (2026-11-07: zoomed in - P first back to the whole island)""", W)
mw = rep(mw, """            const b = this._bg.bitmap, ctx = b.context, R = P.RX(), list = nodes();
            b.clear();""", """            const b = this._bg.bitmap, ctx = b.context, R = P.RX(), list = nodes();
            b.clear();
            if (this._zs) this._zs.visible = false;
            if (this._ring) this._ring.visible = false;""", W)
mw = rep(mw, """            this._drawn = draw(b, { x: R.lx, y: top + ATLAS.top, w: R.rx - R.lx, h: h - ATLAS.top - ATLAS.bottom }, { cursor: this.inside ? this._cursor : null, nodes: list, atlas: true });""",
         """            this._field = { x: R.lx, y: top + ATLAS.top, w: R.rx - R.lx, h: h - ATLAS.top - ATLAS.bottom };
            if (this._zoom) this.place();   // (zoomed: its own picture over the field)
            else this._drawn = draw(b, this._field, { cursor: this.inside ? this._cursor : null, nodes: list, atlas: true });""", W)
ZOOM_CODE = """        // (2026-11-07, the user: "da się tę mapę powiększyć ze 3 razy i po niej się poruszać?" -> the cursor over the places) E: the
        // sketch three times bigger in the same field - drawn ONCE into a picture of its own (the names for that size: at3); the
        // field shows a part of it, sliding after the cursor (only the picture's frame moves: nothing drawn while it slides)
        let ringKept = null;
        const ringBitmap = () => {
            if (ringKept) return ringKept;
            const bm = new Bitmap(40, 40), x = bm.context;
            x.beginPath(); x.arc(20, 20, 14, 0, Math.PI * 2); x.fillStyle = "rgba(255,210,63,0.18)"; x.fill();
            x.beginPath(); x.arc(20, 20, 12, 0, Math.PI * 2); x.lineWidth = 2; x.strokeStyle = K.acc; x.stroke();
            bm._baseTexture.update();
            return (ringKept = bm);
        };
        MapaView.prototype.zoomIn = function() {
            const f = this._field;
            if (this._zoom || !f) { if (this._zoom) SoundManager.playBuzzer(); return; }
            const bw = Math.round(f.h * ZOOM * ASPECT), bh = Math.round(f.h * ZOOM), bm = new Bitmap(bw, bh);
            this._zoomNodes = draw(bm, { x: 0, y: 0, w: bw, h: bh }, { cursor: null, nodes: nodes(), atlas: true, atKey: "at3" }).nodes;
            bm._baseTexture.update();
            if (!this._zs) { this._zs = new Sprite(); this.root.addChild(this._zs); this._ring = new Sprite(ringBitmap()); this._ring.anchor.set(0.5, 0.5); this.root.addChild(this._ring); }
            this._zs.bitmap = bm;
            this._zoom = true;
            const n = this._zoomNodes.find(q => q.key === String(this._cursor));
            this._zc = n ? { x: n.x, y: n.y } : { x: bw / 2, y: bh / 2 };
            SoundManager.playCursor();
            this.redraw();
            this.scene.drawKeys();
        };
        MapaView.prototype.dropZoom = function() {
            this._zoom = false;
            this._zoomNodes = null;
            if (this._zs && this._zs.bitmap) { const bm = this._zs.bitmap; this._zs.bitmap = null; bm.destroy(); }
            if (this._zs) this._zs.visible = false;
            if (this._ring) this._ring.visible = false;
        };
        MapaView.prototype.zoomOut = function() {
            if (!this._zoom) return false;
            this.dropZoom();
            SoundManager.playCancel();
            this.redraw();
            this.scene.drawKeys();
            return true;
        };
        // the part of the picture in the field round the slide's centre, the cursor's ring over its place
        MapaView.prototype.place = function() {
            const f = this._field, bm = this._zs && this._zs.bitmap;
            if (!this._zoom || !f || !bm || !this._zc) return;
            const vx = Math.round(Math.max(0, Math.min(bm.width - f.w, this._zc.x - f.w / 2))), vy = Math.round(Math.max(0, Math.min(bm.height - f.h, this._zc.y - f.h / 2)));
            this._zs.setFrame(vx, vy, Math.min(f.w, bm.width), Math.min(f.h, bm.height));
            this._zs.x = f.x; this._zs.y = f.y;
            this._zs.visible = !this._card;
            const n = this._zoomNodes && this._zoomNodes.find(q => q.key === String(this._cursor)), rx = n ? n.x - vx : -1, ry = n ? n.y - vy : -1;
            this._ring.visible = !!n && !this._card && rx >= 0 && rx <= f.w && ry >= 0 && ry <= f.h;
            if (n) { this._ring.x = f.x + rx; this._ring.y = f.y + ry; }
            this._view = [vx, vy];
        };
        MapaView.prototype.update = function() {
            if (!this.ready()) return;
            if (this._zoom && this._zc && !this._card) {   // the slide: a fifth of the way each frame
                const n = this._zoomNodes && this._zoomNodes.find(q => q.key === String(this._cursor));
                if (n) {
                    const dx = n.x - this._zc.x, dy = n.y - this._zc.y;
                    if (Math.abs(dx) + Math.abs(dy) > 0.6) { this._zc.x += Math.abs(dx) < 1 ? dx : dx * 0.2; this._zc.y += Math.abs(dy) < 1 ? dy : dy * 0.2; this.place(); }
                }
            }
            if (this._card) return;
            if (Input.isTriggered("pagedown")) { this.zoomIn(); return; }   // (E)
            if (Input.isTriggered("pageup")) { this.zoomOut(); return; }    // (Q)
"""
mw = rep(mw, """        MapaView.prototype.update = function() {
            if (!this.ready()) return;
            if (this._card) return;
""", ZOOM_CODE, W)
mw = rep(mw, """        MapaView.prototype.nodeAt = function(x, y) {
            if (!this._drawn) return null;""", """        MapaView.prototype.nodeAt = function(x, y) {
            if (this._zoom && this._zoomNodes && this._view && this._field) { const zx = x - this._field.x + this._view[0], zy = y - this._field.y + this._view[1]; return this._zoomNodes.find(n => n.state === "known" && Math.hypot(n.x - zx, n.y - zy) <= 18) || null; }
            if (!this._drawn) return null;""", W)
mw = rep(mw, """            return { mapa: { cursor: this._cursor, card: this._card,""", """            return { mapa: { cursor: this._cursor, card: this._card, zoom: !!this._zoom, view: this._zoom ? this._view || null : null,""", W)
mw = rep(mw, "i wybór miejsca na schemacie. v1.1.0", "i wybór miejsca na schemacie; E/Q przybliżenie x3. v1.2.0", W)

tp = os.path.join(ROOT, "js", "teksty", "mapa_wyspy.txt")
tt = open(tp, "rb").read().decode("utf-8")
nl_ = "\r\n" if "\r\n" in tt else "\n"
tt = rep(tt, "klawisz.karta = karta miejsca" + nl_, "klawisz.karta = karta miejsca" + nl_ + "klawisz.zoom = przybliż / oddal" + nl_, "teksty")

out = PLUG if "--wykonaj" in sys.argv else STG
os.makedirs(out, exist_ok=True)
tdir = os.path.join(os.path.dirname(out), "teksty"); os.makedirs(tdir, exist_ok=True)
if out == PLUG:
    kop = os.path.join(HERE, "kopie_zapasowe", datetime.datetime.now().strftime("%Y%m%d_%H%M%S") + "_zoom"); os.makedirs(kop, exist_ok=True)
    for f in ("MapaWyspy_Data.js", "MapaWyspy.js"): shutil.copy(os.path.join(PLUG, f), kop)
    shutil.copy(tp, kop)
    print("kopie:", kop)
for f, s in (("MapaWyspy_Data.js", data), ("MapaWyspy.js", mw)): open(os.path.join(out, f), "wb").write(s.encode("utf-8"))
open(os.path.join(tdir, "mapa_wyspy.txt"), "wb").write(tt.encode("utf-8"))
print("zapisane w", out)
