//=============================================================================
// MapaWyspy.js
//=============================================================================
// The island as a readable sketch (the user, 2026-10-24: "Mapa wyspy w menu P"): the outdoor places with their names, joined by the
// roads that really lead between the maps (MapaWyspy_Data.js), the hero's place and the followed goal marked; a place not yet seen is
// hidden, or a "?" when a road leads to it from a known one; the interiors are not points (the card of a place lists them); the
// underground is one point with the deepest floor. The P menu's "Mapa" tab (MenuRing.js takes MapaWyspy.menuView) - the arrows walk
// the places, O shows the place's card (who is there, shops, quests, the words of js/teksty/miejsca.txt), P goes back; and a scene
// that lets another plugin ask for a place on the sketch (Woz.js: "Dokąd cię podwieźć?") - MapaWyspy.choose.
// Known = the map (or an interior of it) visited: CleanHUD's visits (Tawerna.state("nazwaMapy").odw). Nothing runs every frame.

/*:
 * @target MZ
 * @plugindesc Mapa wyspy: schemat odkrytych miejsc z drogami, bohaterem i celem; zakładka „Mapa” w menu P (O: karta miejsca) i wybór miejsca na schemacie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @orderAfter MapaWyspy_Data
 * @orderAfter CleanHUD
 * @orderAfter CleanHUD_Compass
 *
 * @help
 * ============================================================================
 * MapaWyspy.js - mapa wyspy
 * ============================================================================
 * Menu P -> zakładka „Mapa”: odkryte miejsca (mapy na zewnątrz) z nazwami,
 * drogi między nimi, bohater (pierścień) i cel śledzonego zadania (romb).
 * Miejsce, w którym jeszcze nie byłeś, jest ukryte albo pokazane jako „?”,
 * gdy prowadzi do niego droga z miejsca, które znasz. Wnętrza nie są
 * punktami - karta miejsca je wymienia. Podziemia to jeden punkt z
 * najgłębszym piętrem.
 *   W / S / A / D (strzałki)  następne miejsce w tę stronę
 *   O                          karta miejsca (ludzie, sklepy, zadania, wnętrza)
 *   P                          wróć
 * Układ miejsc: MapaWyspy_Data.js (x, y na schemacie, drogi).
 * Dla twórcy: MapaWyspy.choose({ title, items: [{ id, label, note, enabled }],
 * onPick(id), onCancel }) otwiera wybór miejsca na schemacie (Woz.js).
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna, D = window.MapaWyspyData;
    if (!T) throw new Error("MapaWyspy.js: brak TawernaCore.js (the Tawerna core is missing)");
    if (!D) throw new Error("MapaWyspy.js: brak MapaWyspy_Data.js - musi stać wyżej na liście wtyczek (the data is missing)");
    const PLUGIN = "MapaWyspy";
    if (T.api(PLUGIN)) return;
    const TX = window.Watki && Watki.teksty ? Watki.teksty("mapa_wyspy") : {};
    const TXM = window.Watki && Watki.teksty ? Watki.teksty("miejsca") : {};   // (the same object CleanHUD reads: the places' words)
    const wstaw = (t, v) => (window.Watki && Watki.wstaw ? Watki.wstaw(String(t || ""), v) : String(t || ""));
    const word = (obj, key) => { let o = obj; for (const p of String(key).split(".")) { if (!o || typeof o !== "object") return ""; o = o[p]; } return typeof o === "string" ? o : ""; };
    const CH = () => T.api("CleanHUD");
    const UND = "podziemia";
    const ASPECT = 820 / 550;   // (the atlas's box)

    // ------------------------------------------------------------------ the places
    const PLACES = D.MIEJSCA.map(p => Object.assign({}, p, { key: String(p.id) }));
    const UNDER = Object.assign({}, D.PODZIEMIA, { key: UND });
    const ALL = PLACES.concat([UNDER]);
    const BY = new Map(ALL.map(p => [p.key, p]));
    const NEXT = new Map();   // key -> [neighbour keys]
    for (const [a, b] of D.DROGI) {
        const ka = String(a), kb = String(b);
        if (!BY.has(ka) || !BY.has(kb)) continue;
        (NEXT.get(ka) || NEXT.set(ka, []).get(ka)).push(kb);
        (NEXT.get(kb) || NEXT.set(kb, []).get(kb)).push(ka);
    }
    const place = id => BY.get(String(id)) || null;
    const nameOf = id => { const p = place(id); return p ? p.nazwa : ""; };
    // the place a map belongs to: itself, the underground (a floor, the castle's ruins, the cistern), its outdoor map (an interior),
    // the land of the hut (grandpa's field, or the house bought after its loss - Homes); null: no place (the title, the test maps)
    function placeOf(mapId) {
        const id = Number(mapId);
        if (!(id > 0)) return null;
        const U = T.api("Underground");
        try { if (U && U.floorOf && U.floorOf(id) > 0) return UND; } catch (e) { /* (no floor) */ }
        if (BY.has(String(id))) return id;
        const w = D.WNETRZA[id];
        if (!w) return null;
        if (w[0] === 3 && id === 100) { const H = T.api("Homes"); const land = H && H.homeLand ? H.homeLand() : 3; return BY.has(String(land)) ? land : 3; }
        return w[0];
    }
    const hereId = () => (window.$gameMap && window.$gameSystem ? placeOf($gameMap.mapId()) : null);
    const visitsOf = () => { const c = CH(); const v = c && c.visits ? c.visits() : null; return (v && v.odw) || {}; };
    const deepest = () => { const U = T.api("Underground"); try { return U && U.deepest ? U.deepest() : 0; } catch (e) { return 0; } };
    // known: the map visited, or one of its interiors, or the hero there now; the underground: a floor reached
    function discovered(id) {
        const key = String(id), odw = visitsOf();
        if (key === UND) return deepest() > 0 || !!odw[10] || !!odw[11] || hereId() === UND;
        if (odw[key]) return true;
        if (String(hereId()) === key) return true;
        for (const k of Object.keys(odw)) { const w = D.WNETRZA[k]; if (w && String(w[0]) === key && odw[k]) return true; }
        return false;
    }
    // where the followed goal is: its place (the compass knows the map)
    function targetPlace() {
        const C = T.api("CleanHUD_Compass");
        let t = null;
        try { t = C && C.target ? C.target() : null; } catch (e) { t = null; }
        if (!t || t.map === undefined) return null;
        const id = placeOf(t.map);
        return id === null ? null : { id, name: t.name || nameOf(id) };
    }
    // every place with its state: "known", "hint" (a road from a known one), "hidden"
    function nodes() {
        const here = hereId(), tgt = targetPlace(), known = new Set(ALL.filter(p => discovered(p.key)).map(p => p.key));
        return ALL.map(p => {
            const target = !!tgt && String(tgt.id) === p.key;
            // (the goal's place not seen yet: a "?" with the diamond - the compass points there anyway)
            const state = known.has(p.key) ? "known" : target || (NEXT.get(p.key) || []).some(k => known.has(k)) ? "hint" : "hidden";
            return { id: p.id, key: p.key, name: p.nazwa, x: p.x, y: p.y, state, here: String(here) === p.key, target };
        });
    }
    const roads = () => D.DROGI.map(([a, b]) => [String(a), String(b)]).filter(([a, b]) => BY.has(a) && BY.has(b));

    // ------------------------------------------------------------------ the card of a place
    function residentsAt(id) {
        const TL = T.api("TownLife"), out = [];
        if (!TL || !TL.RESIDENTS) return out;
        for (const r of TL.RESIDENTS) {
            let home = r.map || 8;
            try { home = TL.homeOf ? TL.homeOf(r) : home; } catch (e) { /* (the data's map) */ }
            if (String(placeOf(home)) !== String(id)) continue;
            let away = false;
            try { away = !!(TL.absent && TL.absent(r.key)); } catch (e) { away = false; }
            if (!away) out.push({ key: r.key, name: r.name, title: r.title || "" });
        }
        return out;
    }
    function shopsAt(id, people) {
        const out = [], B = window.Bron_Data || T.api("Bron_Data"), U = window.Ubior_Data || T.api("Ubior_Data");
        const sk = key => (B && B.SKLEPY && B.SKLEPY[key]) || (U && U.SKLEPY && U.SKLEPY[key]) || null;
        for (const p of people) { const s = sk(p.key); if (s) out.push((s.kto || p.name) + " - " + (s.tytul || p.title)); }
        if (String(id) === "8") { const t = word(TX, "karta.tawerna"), k = word(TX, "karta.kantor"); if (t) out.unshift(t); if (k) out.push(k); }
        if (String(id) === "111") { const s = word(TX, "karta.szynk"); if (s) out.push(s); }
        return out;
    }
    function questsAt(id) {
        const TQ = T.api("TownQuests"), C = T.api("CleanHUD_Compass"), out = [];
        if (TQ && TQ.QUESTS && TQ.isActive && C && C.townPlace) {
            for (const q of TQ.QUESTS) {
                let at = null;
                try { if (!TQ.isActive(q.id)) continue; at = C.townPlace(q.id); } catch (e) { at = null; }
                if (at && String(placeOf(at.map)) === String(id)) out.push(q.title || q.id);
            }
        }
        const tgt = targetPlace();
        if (tgt && String(tgt.id) === String(id) && !out.includes(tgt.name)) out.push(wstaw(word(TX, "karta.cel") || "cel: {co}", { co: tgt.name }));
        return out;
    }
    // (2026-10-29, docs/PODROZNI.md D40) a sentence for a place not seen yet instead of the plain "?" - other plugins' hints
    // (Podroznicy_Sprawy.js: Teofil's sketch): fn(key) -> text | null, the first one that answers
    const HINTS = [];
    function hintOf(key) {
        for (const f of HINTS) { try { const t = f(String(key)); if (t) return t; } catch (e) { console.error("[MapaWyspy] hint", e); } }
        return "";
    }
    const interiorsOf = id => Object.keys(D.WNETRZA).filter(k => String(D.WNETRZA[k][0]) === String(id)).map(k => D.WNETRZA[k][1]);
    function card(id) {
        const p = place(id);
        if (!p) return null;
        const key = p.key;
        if (!discovered(key)) return { id: p.id, title: word(TX, "nieznane.nazwa") || "?", sub: "", opis: hintOf(key) || word(TX, "nieznane.opis"), known: false, ludzie: [], sklepy: [], zadania: [], wnetrza: [], woz: "" };
        const people = residentsAt(key).concat((D.LUDZIE_FABULY[key] || []).map(n => ({ key: "", name: n, title: "" })));
        let sub = word(TXM, "mapa." + key + ".pod"), opis = word(TXM, "mapa." + key + ".opis");
        if (key === UND) { const d = deepest(); sub = d > 0 ? wstaw(word(TX, "podziemia.pietro"), { n: d }) : word(TX, "podziemia.brak"); }
        let woz = "";
        try { const W = T.api("Woz"); woz = W && W.stopInfo ? W.stopInfo(key) || "" : ""; } catch (e) { woz = ""; }
        return { id: p.id, title: p.nazwa, sub, opis, known: true, ludzie: people.map(x => x.name + (x.title ? " · " + x.title : "")),
            sklepy: shopsAt(key, people), zadania: questsAt(key), wnetrza: interiorsOf(key), woz };
    }

    // ------------------------------------------------------------------ the sketch
    // the look (the P menu's black and yellow - MenuRing.K; the same numbers here so the choice scene matches)
    const K = {
        text: "rgb(236,238,240)", muted: "rgb(138,144,153)", dim: "rgb(98,103,111)", line: "rgb(58,62,70)", soft: "rgb(212,214,218)",
        panel: "rgba(11,12,15,0.93)", panel2: "rgb(20,21,25)", cell: "rgb(30,32,37)", acc: "rgb(255,210,63)", accDim: "rgb(92,76,24)", sel: "rgb(16,14,6)",
        gold: "rgb(255,214,96)", warn: "#ff9f8f", land: "rgb(31,37,33)", shore: "rgb(74,84,76)", road: "rgb(96,100,108)", sea: "rgb(14,18,22)"
    };
    // the island's box inside a rect (the atlas's aspect), centred
    function boxIn(rect) {
        let w = rect.w, h = w / ASPECT;
        if (h > rect.h) { h = rect.h; w = h * ASPECT; }
        return { x: rect.x + (rect.w - w) / 2, y: rect.y + (rect.h - h) / 2, w, h };
    }
    const at = (box, p) => ({ x: box.x + p.x * box.w, y: box.y + p.y * box.h });
    function shore(ctx, box) {
        const pts = D.BRZEG.map(([x, y]) => at(box, { x, y })), n = pts.length;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const a = pts[i], b = pts[(i + 1) % n], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            if (i === 0) ctx.moveTo((pts[n - 1].x + a.x) / 2, (pts[n - 1].y + a.y) / 2);
            ctx.quadraticCurveTo(a.x, a.y, mx, my);
        }
        ctx.closePath();
    }
    // draw(bitmap, rect, o): the sea in the rect, the island, the roads, the places. o: { cursor, nodes (nodes()), selectable(key) -> bool
    // (dimmed when false), labelOf(key) -> a second line, sea: false (no sea fill) }. Returns { box, nodes: [{ key, x, y, state, r }] }
    function draw(b, rect, o) {
        o = o || {};
        const ctx = b.context, c = CH(), list = o.nodes || nodes(), box = boxIn(rect), out = [];
        ctx.save();
        if (o.sea !== false) { ctx.fillStyle = K.sea; if (c && c.roundPath) { c.roundPath(ctx, rect.x, rect.y, rect.w, rect.h, 12); ctx.fill(); } else ctx.fillRect(rect.x, rect.y, rect.w, rect.h); }
        shore(ctx, box);
        ctx.fillStyle = K.land;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = K.shore;
        ctx.stroke();
        // the roads: both ends seen (a "?" end: dashed)
        const byKey = new Map(list.map(n => [n.key, n]));
        for (const [a, b2] of roads()) {
            const na = byKey.get(a), nb = byKey.get(b2);
            if (!na || !nb || na.state === "hidden" || nb.state === "hidden") continue;
            const pa = at(box, na), pb = at(box, nb);
            ctx.beginPath();
            ctx.setLineDash(na.state === "hint" || nb.state === "hint" ? [4, 5] : []);
            ctx.lineWidth = 2;
            ctx.strokeStyle = K.road;
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
        }
        ctx.setLineDash([]);
        // the places
        const label = (text, x, y, size, col, face) => { if (c && c.textOut) c.textOut(b, text, Math.round(x - 150), Math.round(y), 300, Math.ceil(size * 1.5), "center", { size, color: col, face: face || null, plain: true }); };
        for (const n of list) {
            if (n.state === "hidden") continue;
            const p = at(box, n), on = o.cursor !== undefined && o.cursor !== null && String(o.cursor) === n.key;
            const can = typeof o.selectable === "function" ? !!o.selectable(n.key) : n.state === "known";
            const r = n.key === UND ? 7 : 6;
            if (on) {   // the cursor: a wide ring
                ctx.beginPath(); ctx.arc(p.x, p.y, r + 9, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,210,63,0.18)"; ctx.fill();
                ctx.beginPath(); ctx.arc(p.x, p.y, r + 7, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = K.acc; ctx.stroke();
            }
            if (n.here) { ctx.beginPath(); ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = K.text; ctx.stroke(); }
            if (n.state === "hint") {
                ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fillStyle = K.cell; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = K.muted; ctx.stroke();
                label("?", p.x, p.y - 10, 15, K.muted, "bold");
            } else {
                ctx.beginPath();
                if (n.key === UND) ctx.rect(p.x - r, p.y - r, r * 2, r * 2); else ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fillStyle = can ? K.acc : K.accDim; ctx.fill();
                ctx.lineWidth = 1.5; ctx.strokeStyle = K.sel; ctx.stroke();
            }
            if (n.target) {   // the followed goal: a diamond over the place
                ctx.beginPath(); ctx.moveTo(p.x, p.y - r - 22); ctx.lineTo(p.x + 7, p.y - r - 14); ctx.lineTo(p.x, p.y - r - 6); ctx.lineTo(p.x - 7, p.y - r - 14); ctx.closePath();
                ctx.fillStyle = K.gold; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = K.sel; ctx.stroke();
            }
            if (n.state === "known") {
                const above = n.y > 0.82, size = on ? 17 : 16, ly = above ? p.y - r - (n.target ? 40 : 24) : p.y + r + 4;
                label(n.name, p.x, ly, size, on ? K.acc : can ? K.text : K.dim, on ? "bold" : null);
                const extra = typeof o.labelOf === "function" ? o.labelOf(n.key) : "";
                if (extra) label(extra, p.x, ly + size + 3, 14, on ? K.acc : K.muted);
            }
            out.push({ key: n.key, id: n.id, x: Math.round(p.x), y: Math.round(p.y), state: n.state, r, here: n.here, target: n.target, can });
        }
        ctx.restore();
        return { box, nodes: out };
    }
    // the next place in a direction (2 down, 4 left, 6 right, 8 up) among `list` (drawn nodes with x / y), from `fromKey`
    function next(fromKey, dir, list) {
        const from = list.find(n => n.key === String(fromKey));
        if (!from) return list.length ? list[0].key : null;
        let best = null, bd = Infinity;
        for (const n of list) {
            if (n.key === from.key) continue;
            const dx = n.x - from.x, dy = n.y - from.y;
            const fwd = dir === 6 ? dx : dir === 4 ? -dx : dir === 2 ? dy : -dy, side = Math.abs(dir === 6 || dir === 4 ? dy : dx);
            if (fwd <= 0 || side > fwd * 1.6) continue;
            const d = fwd + side * 0.9;
            if (d < bd) { bd = d; best = n.key; }
        }
        return best;
    }
    // the hero's tab-icon for MenuRing: a small folded map (drawn once)
    let iconKept = null;
    function tabIcon(size) {
        if (iconKept && iconKept.width === size) return iconKept;
        const b = new Bitmap(size, size), ctx = b.context, s = size / 32;
        ctx.save();
        ctx.scale(s, s);
        ctx.lineJoin = "round";
        ctx.fillStyle = "rgb(236,238,240)";
        ctx.beginPath(); ctx.moveTo(3, 7); ctx.lineTo(12, 4); ctx.lineTo(20, 7); ctx.lineTo(29, 4); ctx.lineTo(29, 25); ctx.lineTo(20, 28); ctx.lineTo(12, 25); ctx.lineTo(3, 28); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgb(60,62,68)";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(12, 4); ctx.lineTo(12, 25); ctx.moveTo(20, 7); ctx.lineTo(20, 28); ctx.stroke();
        ctx.strokeStyle = "rgb(255,210,63)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(6, 20); ctx.lineTo(11, 14); ctx.lineTo(17, 19); ctx.lineTo(25, 11); ctx.stroke();
        ctx.fillStyle = "rgb(255,210,63)";
        ctx.beginPath(); ctx.arc(25, 11, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        b._baseTexture.update();
        iconKept = b;
        return b;
    }

    // ------------------------------------------------------------------ the card drawn in a column (shared by the tab and the scene)
    // returns the lines shown (for the tests)
    // (each section shows at most `max` rows - "i jeszcze N" for the rest - so every section fits the column; a long row wraps to two lines)
    const CARD_MAX = { woz: 1, ludzie: 6, sklepy: 5, zadania: 5, wnetrza: 6 };
    function drawCard(b, P, x, y, w, h, cd) {
        const tx = P.tx, iw = w, shown = [];
        let yy = y;
        tx(b, cd.title, x, yy, 26, { top: true, face: "bold", max: iw });
        yy += 34;
        if (cd.sub) { tx(b, cd.sub.toLocaleUpperCase("pl"), x, yy, 15, { top: true, face: "sc", color: K.acc, max: iw }); yy += 24; }
        if (cd.opis) { for (const line of P.wrapWords(cd.opis, 17, iw, "regular").slice(0, 3)) { tx(b, line, x, yy, 17, { top: true, face: "regular", color: K.soft }); yy += 22; } }
        yy += 8;
        const section = (title, lines, max) => {
            if (yy + 50 > y + h) return;
            P.heading(b, x, yy, title, x + iw, lines.length ? lines.length : undefined);
            yy += 28;
            const rows = lines.length ? lines : [word(TX, "karta.brak") || "-"];
            let k = 0;
            for (const line of rows) {
                const parts = P.wrapWords(line, 17, iw).slice(0, 2), need = parts.length * 22;
                if (k >= max || yy + need > y + h - (k < rows.length - 1 ? 22 : 0)) { tx(b, wstaw(word(TX, "karta.wnetrza_wiecej"), { n: rows.length - k }), x, yy, 16, { top: true, color: K.muted }); yy += 22; break; }
                for (const part of parts) { tx(b, part, x, yy, 17, { top: true, color: lines.length ? K.text : K.dim, max: iw }); yy += 22; }
                shown.push(line);
                k++;
            }
            yy += 10;
        };
        if (cd.known) {
            if (cd.woz) section(word(TX, "karta.woz"), [cd.woz], CARD_MAX.woz);
            section(word(TX, "karta.ludzie"), cd.ludzie, CARD_MAX.ludzie);
            section(word(TX, "karta.sklepy"), cd.sklepy, CARD_MAX.sklepy);
            section(word(TX, "karta.zadania"), cd.zadania, CARD_MAX.zadania);
            section(word(TX, "karta.wnetrza"), cd.wnetrza, CARD_MAX.wnetrza);
        }
        return shown;
    }

    // ------------------------------------------------------------------ the P menu's tab (MenuRing.js gives its pieces: View, RX, tx...)
    const MAP_W = 700, COL_GAP = 30;
    function menuView(P) {
        function MapaView(scene, def) {
            P.View.call(this, scene, def);
            this._bg = this.layer();
            this._cursor = null;
            this._card = false;
            this._drawn = null;
            this._cardLines = null;
        }
        MapaView.prototype = Object.create(P.View.prototype);
        MapaView.prototype.constructor = MapaView;
        MapaView.prototype.keys = function() {
            if (this._card) return [["P", word(TX, "klawisz.wroc") || "wróć"]];
            return [["W/S/A/D", word(TX, "klawisz.miejsce") || "miejsce"], ["O", word(TX, "klawisz.karta") || "karta miejsca"], ["P", word(TX, "klawisz.wroc") || "wróć"]];
        };
        MapaView.prototype.known = function() { return (this._drawn ? this._drawn.nodes : []).filter(n => n.state === "known"); };
        MapaView.prototype.enter = function() {
            const here = hereId();
            if (!this._cursor || !discovered(this._cursor)) this._cursor = here !== null && discovered(here) ? String(here) : (nodes().find(n => n.state === "known") || {}).key || null;
            this._card = false;
            P.View.prototype.enter.call(this);
        };
        MapaView.prototype.leave = function() { this._card = false; this._mx = undefined; };
        MapaView.prototype.cancel = function() {
            if (!this._card) return false;
            SoundManager.playCancel();
            this._card = false;
            this.redraw();
            return true;
        };
        MapaView.prototype.redraw = function() {
            const b = this._bg.bitmap, ctx = b.context, R = P.RX(), list = nodes();
            b.clear();
            P.header(b, null, this.inside ? (this._card ? word(TX, "naglowek.karta") : word(TX, "naglowek.wybor")) : word(TX, "naglowek.podglad"));
            const here = hereId();
            if (!this.inside) this._cursor = here !== null && discovered(here) ? String(here) : this._cursor;
            const top = R.y0 + 104, h = R.y1 - 16 - top, mw = Math.min(MAP_W, R.rx - R.lx - 360);
            this._drawn = draw(b, { x: R.lx, y: top, w: mw, h }, { cursor: this.inside ? this._cursor : null, nodes: list });
            // the right column: the legend and the chosen place, or its card
            const cx = R.lx + mw + COL_GAP, cw = R.rx - cx;
            P.vl(ctx, cx - COL_GAP / 2, top, R.y1 - 16);
            this._cardLines = null;
            const cd = this._cursor ? card(this._cursor) : null;
            if (this._card && cd) { this._cardLines = drawCard(b, P, cx, top, cw, h, cd); P.done(b); return; }
            // the legend
            let yy = top;
            const known = list.filter(n => n.state === "known").length;
            P.tx(b, wstaw(word(TX, "legenda.odkryte"), { n: known, wszystkich: list.length }), cx, yy, 17, { top: true, color: K.muted });
            yy += 30;
            const leg = (drawDot, text) => { drawDot(cx + 8, yy + 11); P.tx(b, text, cx + 24, yy, 16, { top: true, color: K.soft }); yy += 24; };
            leg((x, y) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = K.acc; ctx.fill(); ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = K.text; ctx.stroke(); }, word(TX, "legenda.tu"));
            leg((x, y) => { ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 8); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fillStyle = K.gold; ctx.fill(); }, word(TX, "legenda.cel"));
            leg((x, y) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = K.cell; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = K.muted; ctx.stroke(); P.tx(b, "?", x, y - 1, 13, { align: "center", face: "bold", color: K.muted }); }, word(TX, "legenda.nieznane"));
            yy += 14;
            P.hl(ctx, cx, R.rx, yy);
            yy += 18;
            if (cd) {
                P.tx(b, cd.title, cx, yy, 24, { top: true, face: "bold", max: cw });
                yy += 32;
                if (cd.sub) { P.tx(b, cd.sub.toLocaleUpperCase("pl"), cx, yy, 15, { top: true, face: "sc", color: K.acc, max: cw }); yy += 24; }
                if (cd.opis) for (const line of P.wrapWords(cd.opis, 17, cw, "regular").slice(0, 3)) { P.tx(b, line, cx, yy, 17, { top: true, face: "regular", color: K.soft }); yy += 22; }
                const tgt = targetPlace();
                if (tgt && String(tgt.id) === String(cd.id)) { yy += 6; P.tx(b, wstaw(word(TX, "karta.cel"), { co: tgt.name }), cx, yy, 16, { top: true, color: K.gold, max: cw }); yy += 22; }
            }
            P.done(b);
        };
        MapaView.prototype.move = function(dir) {
            const k = next(this._cursor, dir, this.known());
            if (!k || k === this._cursor) { SoundManager.playBuzzer(); return; }
            this._cursor = k;
            SoundManager.playCursor();
            this.redraw();
        };
        MapaView.prototype.open = function() {
            if (!this._cursor || !discovered(this._cursor)) { SoundManager.playBuzzer(); return; }
            SoundManager.playOk();
            this._card = true;
            this.redraw();
            this.scene.drawKeys();
        };
        MapaView.prototype.update = function() {
            if (!this.ready()) return;
            if (this._card) return;
            if (this.mouseMoved()) { const p = P.touchAt(), n = this.nodeAt(p.x, p.y); if (n && n.key !== this._cursor) { this._cursor = n.key; this.redraw(); } }
            for (const [name, dir] of [["down", 2], ["left", 4], ["right", 6], ["up", 8]]) if (Input.isRepeated(name)) { this.move(dir); return; }
            if (Input.isTriggered("ok")) this.open();
        };
        MapaView.prototype.nodeAt = function(x, y) {
            if (!this._drawn) return null;
            return this._drawn.nodes.find(n => n.state === "known" && Math.hypot(n.x - x, n.y - y) <= 18) || null;
        };
        MapaView.prototype.touch = function(x, y) {
            if (this._card) return;
            const n = this.nodeAt(x, y);
            if (!n) return;
            if (n.key !== this._cursor) { this._cursor = n.key; SoundManager.playCursor(); this.redraw(); } else this.open();
        };
        MapaView.prototype.info = function() {
            const list = this._drawn ? this._drawn.nodes : [], here = hereId(), tgt = targetPlace();
            return { mapa: { cursor: this._cursor, card: this._card, here: here === null ? null : String(here), target: tgt ? String(tgt.id) : null,
                known: list.filter(n => n.state === "known").map(n => n.key), hints: list.filter(n => n.state === "hint").map(n => n.key),
                nodes: list.map(n => ({ key: n.key, x: n.x, y: n.y, state: n.state, here: n.here, target: n.target })), cardData: this._card && this._cursor ? card(this._cursor) : null, cardLines: this._cardLines } };
        };
        return MapaView;
    }

    // ------------------------------------------------------------------ a choice of a place on the sketch (Woz.js: "Dokąd cię podwieźć?")
    // MapaWyspy.choose({ title, items: [{ id, label, note, enabled, why }], start, onPick(id), onCancel() }) -> the scene is pushed
    let choosing = null;
    class Scene_MapaWybor extends Scene_MenuBase {
        needsCancelButton() { return false; }
        create() {
            super.create();
            this._o = choosing || { title: "", items: [] };
            this._items = (this._o.items || []).map(i => Object.assign({}, i, { key: String(i.id) }));
            this._cursor = this._o.start !== undefined && this._items.some(i => i.key === String(this._o.start)) ? String(this._o.start) : (this._items.find(i => i.enabled !== false) || this._items[0] || {}).key || null;
            this._spr = new Sprite(new Bitmap(Graphics.width, Graphics.height));
            this.addChild(this._spr);
            this._t = 0;
            this._done = false;
            this.redraw();
        }
        start() { super.start(); Input.clear(); TouchInput.clear(); }
        item(key) { return this._items.find(i => i.key === String(key)) || null; }
        redraw() {
            const b = this._spr.bitmap, ctx = b.context, c = CH(), W = Graphics.width, H = Graphics.height;
            b.clear();
            const px = 40, py = 40, pw = W - 80, ph = H - 80;
            ctx.save(); ctx.fillStyle = K.panel; if (c && c.roundPath) { c.roundPath(ctx, px, py, pw, ph, 14); ctx.fill(); } else ctx.fillRect(px, py, pw, ph); ctx.restore();
            const tx = (text, x, y, size, o) => { o = o || {}; if (!c) return 0; const w = c.measure(text, size, o.face || null); const bx = o.align === "right" ? x - w - 8 : o.align === "center" ? x - (w + 8) / 2 : x; c.textOut(b, text, Math.round(bx), Math.round(y), w + 8, Math.ceil(size * 1.5), o.align === "right" ? "right" : o.align === "center" ? "center" : "left", { size, face: o.face || null, color: o.color || K.text, plain: true }); return w; };
            tx(this._o.title || "", px + 30, py + 18, 26, { face: "bold" });
            ctx.fillStyle = K.line; ctx.fillRect(px + 30, py + 64, pw - 60, 1);
            const list = nodes(), keys = new Set(this._items.map(i => i.key));
            const top = py + 80, h = ph - 80 - 70, mw = Math.min(MAP_W, pw - 420);
            this._drawn = draw(b, { x: px + 30, y: top, w: mw, h }, { cursor: this._cursor, nodes: list, selectable: k => { const it = this.item(k); return !!it && it.enabled !== false; },
                labelOf: k => { const it = this.item(k); return it && it.enabled !== false ? it.note || "" : it ? it.why || "" : ""; } });
            // the right column: the items as rows
            const cx = px + 30 + mw + COL_GAP, cw = px + pw - 30 - cx;
            ctx.fillStyle = K.line; ctx.fillRect(cx - COL_GAP / 2, top, 1, h);
            let yy = top;
            for (const it of this._items) {
                const on = it.key === this._cursor, can = it.enabled !== false;
                if (on) { ctx.save(); ctx.fillStyle = K.acc; if (c && c.roundPath) { c.roundPath(ctx, cx - 8, yy - 4, cw + 8, 50, 8); ctx.fill(); } ctx.restore(); }
                tx(it.label, cx, yy, 20, { face: on ? "bold" : null, color: on ? K.sel : can ? K.text : K.dim });
                const note = can ? it.note || "" : it.why || "";
                if (note) tx(note, cx, yy + 25, 15, { color: on ? K.sel : K.muted });
                yy += 56;
            }
            // the keys
            const ky = py + ph - 44, pairs = [["W/S/A/D", word(TX, "wybor.klawisz.wybierz")], ["O", this._o.okWord || word(TX, "wybor.klawisz.jedz")], ["P", word(TX, "wybor.klawisz.wroc")]];
            let kx = px + 30;
            for (const [k, t] of pairs) {
                const kw = Math.max(30, (c ? c.measure(k, 18, "bold") : 20) + 16);
                ctx.save(); ctx.fillStyle = K.text; if (c && c.roundPath) { c.roundPath(ctx, kx, ky, kw, 30, 7); ctx.fill(); } ctx.restore();
                if (c) c.textOut(b, k, kx, ky + 1, kw, 30, "center", { size: 18, face: "bold", color: K.sel, plain: true });
                kx += kw + 9;
                kx += tx(t, kx, ky + 4, 18) + 34;
            }
            b._baseTexture.update();
        }
        update() {
            super.update();
            this._t++;
            if (this._done || SceneManager.isSceneChanging() || this._t < 6) return;
            if (Input.isTriggered("cancel") || TouchInput.isCancelled()) { this.finish(null); return; }
            const list = (this._drawn ? this._drawn.nodes : []).filter(n => this._items.some(i => i.key === n.key));
            for (const [name, dir] of [["down", 2], ["left", 4], ["right", 6], ["up", 8]]) {
                if (Input.isRepeated(name)) { const k = next(this._cursor, dir, list); if (k && k !== this._cursor) { this._cursor = k; SoundManager.playCursor(); this.redraw(); } else SoundManager.playBuzzer(); return; }
            }
            if (Input.isTriggered("ok")) { this.pick(); return; }
            if (TouchInput.isTriggered()) {
                const n = list.find(q => Math.hypot(q.x - TouchInput.x, q.y - TouchInput.y) <= 18);
                if (n) { if (n.key !== this._cursor) { this._cursor = n.key; SoundManager.playCursor(); this.redraw(); } else this.pick(); }
            }
        }
        pick() {
            const it = this.item(this._cursor);
            if (!it || it.enabled === false) { SoundManager.playBuzzer(); if (it && this._o.onRefused) { try { this._o.onRefused(it); } catch (e) { console.error("[MapaWyspy] onRefused", e); } } return; }
            SoundManager.playOk();
            this.finish(it.key);
        }
        finish(key) {
            this._done = true;
            if (key === null) SoundManager.playCancel();
            const o = this._o;
            this.popScene();
            try { if (key !== null && o.onPick) o.onPick(key); else if (key === null && o.onCancel) o.onCancel(); } catch (e) { console.error("[MapaWyspy] choose", e); }
        }
        state() { return { cursor: this._cursor, items: this._items.map(i => ({ key: i.key, label: i.label, enabled: i.enabled !== false, note: i.note || "", why: i.why || "" })), title: this._o.title }; }
    }
    function choose(o) {
        if (!(SceneManager._scene instanceof Scene_Map) || SceneManager.isSceneChanging()) return false;
        choosing = o || {};
        SceneManager.push(Scene_MapaWybor);
        return true;
    }
    // (the picture behind the choice: the map alone, as under the P menu)
    const _Scene_Map_terminate = Scene_Map.prototype.terminate;
    Scene_Map.prototype.terminate = function() {
        if (SceneManager.isNextScene(Scene_MapaWybor)) for (const c of this.children) if (c !== this._spriteset && c !== this._mindVeil) c.renderable = false;
        _Scene_Map_terminate.call(this);
    };

    window.MapaWyspy = T.register(PLUGIN, {
        addHint: fn => { if (typeof fn === "function") HINTS.push(fn); },
        PLACES: ALL, UND, K, place, nameOf, placeOf, hereId, discovered, nodes, roads, card, targetPlace, draw, next, tabIcon, menuView, drawCard,
        choose, Scene_MapaWybor, choosing: () => { const s = SceneManager._scene; return s instanceof Scene_MapaWybor ? s.state() : null; },
        neighbours: key => (NEXT.get(String(key)) || []).slice()
    });
})();
