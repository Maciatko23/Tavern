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
 * @plugindesc Mapa wyspy: schemat odkrytych miejsc z drogami, bohaterem i celem; zakładka „Mapa” w menu P (O: karta miejsca) i wybór miejsca na schemacie; E/Q prawdziwa mapa (x6, odwiedzone mapy, mgła, morze). v1.4.0
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
    const ASPECT = D.ASPEKT > 0 ? D.ASPEKT : 820 / 550;   // (the island's box: the data's ASPEKT, else the atlas's)

    // ------------------------------------------------------------------ the places
    const PLACES = D.MIEJSCA.map(p => Object.assign({}, p, { key: String(p.id) }));
    const UNDER = Object.assign({}, D.PODZIEMIA, { key: UND });
    const ALL = PLACES.concat([UNDER]);
    const BY = new Map(ALL.map(p => [p.key, p]));
    const NEXT = new Map();   // key -> [neighbour keys]
    for (const [a, b] of D.DROGI) {
        const ka = String(a), kb = String(b);
        if (!BY.has(ka) || !BY.has(kb)) continue;
        if (BY.get(ka).maly || BY.get(kb).maly) continue;   // (2026-11-07: the small edge places - not the cart's ways, no "?" from them)
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
    // (2026-11-07, F9 „Mapa wyspy: wszystko odkryte”, user: "dodaj do F9 odkrycie całej mapy z nazwami miejsc") every place shown
    // known, with its name - only how the sketch is drawn: the visits (the banners' first visits, the journal) stay as they are.
    // Kept by the browser (localStorage), not in a save, as F9's other switches.
    const ALL_KEY = "tawerna_f9_mapa";
    let showAll = false;
    try { showAll = localStorage.getItem(ALL_KEY) === "1"; } catch (e) { showAll = false; }
    function revealAll(on) {
        if (on !== undefined) { showAll = !!on; try { localStorage.setItem(ALL_KEY, showAll ? "1" : "0"); } catch (e) {} }
        return showAll;
    }
    // known: the map visited, or one of its interiors, or the hero there now; the underground: a floor reached
    function discovered(id) {
        if (showAll) return true;
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
            // (a small edge place - maly: seen once visited, never a "?"; at: its name's place in the atlas)
            const state = known.has(p.key) ? "known" : target || (!p.maly && (NEXT.get(p.key) || []).some(k => known.has(k))) ? "hint" : "hidden";
            return { id: p.id, key: p.key, name: p.nazwa, x: p.x, y: p.y, lab: p.lab, at: p.at || null, at6: p.at6 || null, maly: !!p.maly, state, here: String(here) === p.key, target };
        });
    }
    // (an old road through small places - [a, b, [through...]]: seen until all of them are known; then their own ways show)
    const roads = () => D.DROGI.filter(r => !(Array.isArray(r[2]) && r[2].every(k => discovered(k)))).map(([a, b]) => [String(a), String(b)]).filter(([a, b]) => BY.has(a) && BY.has(b));

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
        gold: "rgb(255,214,96)", warn: "#ff9f8f", land: "rgb(31,37,33)", shore: "rgb(74,84,76)", road: "rgb(96,100,108)", sea: "rgb(14,18,22)",
        forest: "rgba(64,80,68,0.65)", bed: "rgb(94,88,72)",
        lead: "rgba(226,229,234,0.85)", halo: "rgba(14,18,22,0.92)"   // (2026-11-07, the atlas: the names' leaders, the dark halo round a name)
    };
    // the island's box inside a rect (the atlas's aspect), centred
    function boxIn(rect) {
        let w = rect.w, h = w / ASPECT;
        if (h > rect.h) { h = rect.h; w = h * ASPECT; }
        return { x: rect.x + (rect.w - w) / 2, y: rect.y + (rect.h - h) / 2, w, h };
    }
    const at = (box, p) => ({ x: box.x + p.x * box.w, y: box.y + p.y * box.h });
    function shore(ctx, box, line) {
        const pts = (line || D.BRZEG).map(([x, y]) => at(box, { x, y })), n = pts.length;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
            const a = pts[i], b = pts[(i + 1) % n], mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            if (i === 0) ctx.moveTo((pts[n - 1].x + a.x) / 2, (pts[n - 1].y + a.y) / 2);
            ctx.quadraticCurveTo(a.x, a.y, mx, my);
        }
        ctx.closePath();
    }
    // (2026-11-07) o.box: the island's box itself (not fitted in the rect); o.real: the real map - no forest, riverbed, roads, only
    // the places near the picture; o.under(ctx, box): drawn over the land, under the places
    // draw(bitmap, rect, o): the sea in the rect, the island, the roads, the places. o: { cursor, nodes (nodes()), selectable(key) -> bool
    // (dimmed when false), labelOf(key) -> a second line, sea: false (no sea fill), atlas: true (every known place named where its
    // `at` says - beside its point or out on the sea with a leader; 2026-11-07), labelKeys: a Set - only these named (not the atlas) }. Returns { box, nodes: [{ key, x, y, state, r }] }
    function draw(b, rect, o) {
        o = o || {};
        const ctx = b.context, c = CH(), list = o.nodes || nodes(), box = o.box || boxIn(rect), out = [];
        ctx.save();
        if (o.seaFill) o.seaFill(ctx);   // (the real map: the sea's own picture)
        else if (o.sea !== false) { ctx.fillStyle = K.sea; if (c && c.roundPath) { c.roundPath(ctx, rect.x, rect.y, rect.w, rect.h, 12); ctx.fill(); } else ctx.fillRect(rect.x, rect.y, rect.w, rect.h); }
        for (const line of o.real ? [] : [null].concat(D.BRZEGI || [])) {   // (the island, then its islets; the real map: its pictures)
            shore(ctx, box, line);
            ctx.fillStyle = K.land;
            ctx.fill();
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = K.shore;
            ctx.stroke();
        }
        if (o.under) o.under(ctx, box);   // (the real map: the visited maps' pictures over the land)
        if (!o.real && D.LAS && D.LAS.length) {   // the trackless forest between the maps: a soft pattern of dots
            ctx.fillStyle = K.forest;
            for (const [fx, fy] of D.LAS) { const q = at(box, { x: fx, y: fy }); ctx.beginPath(); ctx.arc(q.x, q.y, 1.7, 0, Math.PI * 2); ctx.fill(); }
        }
        if (!o.real && D.KORYTO && D.KORYTO.length) {   // the dry riverbed: a thin broken line
            ctx.lineWidth = 1.3; ctx.strokeStyle = K.bed; ctx.setLineDash([5, 4]);
            for (const part of D.KORYTO) { ctx.beginPath(); part.forEach(([kx, ky], i) => { const q = at(box, { x: kx, y: ky }); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }); ctx.stroke(); }
            ctx.setLineDash([]);
        }
        // the roads: both ends seen (a "?" end: dashed)
        const byKey = new Map(list.map(n => [n.key, n]));
        for (const [a, b2] of o.real ? [] : roads()) {   // (the real map: its own ways are seen)
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
        // (2026-11-07) a name of the atlas: its place from the data (at: [x, y, "l" | "r" | "c", leader]), the dark halo round it; the
        // leader from the point's rim to the name's nearest edge
        const atlasName = (n, A, p, r, on, can) => {
            const size = n.maly ? 13 : 15, face = on || n.here ? "bold" : null, w = c && c.measure ? c.measure(n.name, size, face) : n.name.length * size * 0.5;
            const q = at(box, { x: A[0], y: A[1] }), al = A[2], x0 = al === "l" ? q.x : al === "r" ? q.x - w : q.x - w / 2, hh = Math.ceil(size * 1.5);
            if (A[3]) {
                const ex = Math.min(Math.max(p.x, x0 - 2), x0 + w + 2), ey = Math.min(Math.max(p.y, q.y - size * 0.55), q.y + size * 0.55);
                const L = Math.hypot(ex - p.x, ey - p.y) || 1;
                ctx.beginPath(); ctx.moveTo(p.x + (ex - p.x) / L * (r + 1.5), p.y + (ey - p.y) / L * (r + 1.5)); ctx.lineTo(ex, ey);
                ctx.lineWidth = on ? 1.5 : 1; ctx.strokeStyle = on ? K.acc : K.lead; ctx.stroke();   // (lighter and thinner than a road: a leader)
                ctx.beginPath(); ctx.arc(ex, ey, 1.6, 0, Math.PI * 2); ctx.fillStyle = on ? K.acc : K.lead; ctx.fill();
            }
            const col = on ? K.acc : !can ? K.dim : n.maly ? K.soft : K.text;
            if (c && c.textOut) c.textOut(b, n.name, Math.round(x0 - 4), Math.round(q.y - hh / 2), Math.ceil(w) + 8, hh, "center", { size, face, color: col, outline: K.halo, ow: 4, shadow: 0 });
        };
        // the places
        const label = (text, x, y, size, col, face) => { if (c && c.textOut) c.textOut(b, text, Math.round(x - 150), Math.round(y), 300, Math.ceil(size * 1.5), "center", { size, color: col, face: face || null, plain: true }); };
        for (const n of list) {
            if (n.state === "hidden") continue;
            const p = at(box, n), on = o.cursor !== undefined && o.cursor !== null && String(o.cursor) === n.key;
            if (o.real && (p.x < -260 || p.y < -60 || p.x > b.width + 260 || p.y > b.height + 60)) continue;   // (far off this part of the real map)
            const can = typeof o.selectable === "function" ? !!o.selectable(n.key) : n.state === "known";
            const r = n.key === UND ? 7 : n.maly ? 4 : 6;   // (a small edge place: a smaller point)
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
            const A = n[o.atKey || "at"];   // (o.atKey "at3": the names of the zoomed sketch)
            if (n.state === "known" && o.atlas && A) atlasName(n, A, p, r, on, can);
            else if (n.state === "known" && (!o.labelKeys || o.labelKeys.has(n.key))) {
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
    const ATLAS = { top: 26, bottom: 26 };
    // (the atlas's rows over and under the sketch, px - tools/mapy/mapa_wyspy_atlas.py counts on them)
    // (2026-11-07, the user: "a da się mapę prawdziwą zrobić - jakby oddaloną mocno, ale widać malutkie drzewa i inne rzeczy?" ->
    // "Szkic, x6", "Tylko odwiedzone mapy") E: the REAL map - the world's maps as pictures (img/mapa_wyspy/<id>.png, PPT px a tile:
    // tools/mapy/mapa_prawdziwa.py), only the visited ones; the rest of the island its dark land; the names (at6) over them
    const PPT = 4, BOXW = D.SWIAT_BOX ? D.SWIAT_BOX[2] * PPT : 0, BOXH = D.SWIAT_BOX ? D.SWIAT_BOX[3] * PPT : 0;
    const REAL = (D.MAPY_OBRAZY || []).map(String);   // (only these are asked for: a missing picture would stop the game)
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
            return [["W/S/A/D", word(TX, "klawisz.miejsce") || "miejsce"], ["E/Q", word(TX, "klawisz.zoom") || "przybliż / oddal"], ["O", word(TX, "klawisz.karta") || "karta miejsca"], ["P", word(TX, "klawisz.wroc") || "wróć"]];
        };
        MapaView.prototype.known = function() { return (this._zoom && this._zoomNodes ? this._zoomNodes : this._drawn ? this._drawn.nodes : []).filter(n => n.state === "known"); };
        MapaView.prototype.enter = function() {
            const here = hereId();
            if (!this._cursor || !discovered(this._cursor)) this._cursor = here !== null && discovered(here) ? String(here) : (nodes().find(n => n.state === "known") || {}).key || null;
            this._card = false;
            P.View.prototype.enter.call(this);
        };
        MapaView.prototype.leave = function() { this._card = false; this._mx = undefined; this.dropZoom(); };
        MapaView.prototype.cancel = function() {
            if (!this._card) return this.zoomOut();   // (2026-11-07: zoomed in - P first back to the whole island)
            SoundManager.playCancel();
            this._card = false;
            this.redraw();
            return true;
        };
        MapaView.prototype.redraw = function() {
            const b = this._bg.bitmap, ctx = b.context, R = P.RX(), list = nodes();
            b.clear();
            if (this._zs) this._zs.visible = false;
            if (this._ring) this._ring.visible = false;
            P.header(b, null, this.inside ? (this._card ? word(TX, "naglowek.karta") : word(TX, "naglowek.wybor")) : word(TX, "naglowek.podglad"));
            const here = hereId();
            if (!this.inside) this._cursor = here !== null && discovered(here) ? String(here) : this._cursor;
            const top = R.y0 + 104, h = R.y1 - 16 - top, cd = this._cursor ? card(this._cursor) : null;
            this._cardLines = null;
            if (this._card && cd) {   // the card: the sketch on the left (only the chosen place named), the card beside it
                const mw = Math.min(MAP_W, R.rx - R.lx - 360), cx = R.lx + mw + COL_GAP, cw = R.rx - cx;
                this._drawn = draw(b, { x: R.lx, y: top, w: mw, h }, { cursor: this._cursor, nodes: list, labelKeys: new Set([String(this._cursor)]) });
                P.vl(ctx, cx - COL_GAP / 2, top, R.y1 - 16);
                this._cardLines = drawCard(b, P, cx, top, cw, h, cd);
                P.done(b);
                return;
            }
            // (2026-11-07, the user: "Atlas z odnośnikami", "byle było czytelnie i przejrzyście") the atlas: the sketch over the whole
            // panel, every known place named; over it the count and the legend in one row, under it the place under the cursor
            const c = CH(), wOf = (t, s) => (c && c.measure ? c.measure(t, s, null) : t.length * s * 0.5);
            P.tx(b, wstaw(word(TX, "legenda.odkryte"), { n: list.filter(n => n.state === "known").length, wszystkich: list.length }), R.lx, top, 16, { top: true, color: K.muted });
            const legend = [[(x, y) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = K.acc; ctx.fill(); ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.lineWidth = 2; ctx.strokeStyle = K.text; ctx.stroke(); }, word(TX, "legenda.tu")],
                [(x, y) => { ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 8); ctx.lineTo(x - 7, y); ctx.closePath(); ctx.fillStyle = K.gold; ctx.fill(); }, word(TX, "legenda.cel")],
                [(x, y) => { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = K.cell; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = K.muted; ctx.stroke(); P.tx(b, "?", x, y - 1, 13, { align: "center", face: "bold", color: K.muted }); }, word(TX, "legenda.nieznane")]];
            let lx = R.rx - legend.reduce((s, [, t]) => s + 24 + wOf(t, 15) + 22, 0) + 22;
            for (const [dot, t] of legend) { dot(lx + 9, top + 11); P.tx(b, t, lx + 24, top + 1, 15, { top: true, color: K.soft }); lx += 24 + wOf(t, 15) + 22; }
            this._field = { x: R.lx, y: top + ATLAS.top, w: R.rx - R.lx, h: h - ATLAS.top - ATLAS.bottom };
            if (this._zoom) { this.ensureRegion(); this.place(); }   // (the real map: its own picture over the field)
            else this._drawn = draw(b, this._field, { cursor: this.inside ? this._cursor : null, nodes: list, atlas: true });
            const k = this.inside ? this._cursor : here, info = k !== null && k !== undefined && discovered(k) ? card(k) : null;
            if (info) P.tx(b, info.title + (info.sub ? "  ·  " + info.sub : ""), R.lx, top + h - ATLAS.bottom + 6, 16, { top: true, color: K.soft, max: R.rx - R.lx });
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
        // (2026-11-07) the real map's field: the cursor over the places (W/S/A/D as on the sketch), the field sliding after it. A part
        // round the field's view and the view it slides to is drawn ONCE into a picture (draw() with the visited maps' pictures under
        // the places); the slide moves only that picture's frame
        let ringKept = null;
        const ringBitmap = () => {
            if (ringKept) return ringKept;
            const bm = new Bitmap(40, 40), x = bm.context;
            x.beginPath(); x.arc(20, 20, 14, 0, Math.PI * 2); x.fillStyle = "rgba(255,210,63,0.18)"; x.fill();
            x.beginPath(); x.arc(20, 20, 12, 0, Math.PI * 2); x.lineWidth = 2; x.strokeStyle = K.acc; x.stroke();
            bm._baseTexture.update();
            return (ringKept = bm);
        };
        const zxy = n => ({ x: n.x * BOXW, y: n.y * BOXH });   // (a place's point on the real map)
        // the maps' pictures (each asked once; one not ready yet is drawn when it comes): a visited map sharp, the others their FOG
        // (2026-11-07, the user: "mapa ma być jak prostokąt; jak jest ciemno, wypełnij wodą, morzem" - img/mapa_wyspy/mgla/<id>.png:
        // blurred, washed out, a soft rim FOG_PAD tiles round the map - tools/mapy/mapa_prawdziwa_mgla.py)
        const FOG_PAD = 3;
        const pic = (view, folder, name) => {
            const bm = ImageManager.loadBitmap(folder, name);
            if (!bm.isReady() && !bm._mwWait) { bm._mwWait = true; bm.addLoadListener(() => { bm._mwWait = false; view._zoomDirty = true; }); }
            return bm;
        };
        MapaView.prototype.realPics = function() {
            const out = [], R = window.SwiatData && window.SwiatData.maps;
            if (!R) return out;
            for (const id of REAL) {
                if (!R[id]) continue;
                const [x0, y0, w, h] = R[id], x = (x0 - D.SWIAT_BOX[0]) * PPT, y = (y0 - D.SWIAT_BOX[1]) * PPT;
                if (discovered(id)) out.push({ bm: pic(this, "img/mapa_wyspy/", id), x, y, w: w * PPT, h: h * PPT, fog: false });
                else out.push({ bm: pic(this, "img/mapa_wyspy/mgla/", id), x: x - FOG_PAD * PPT, y: y - FOG_PAD * PPT, w: (w + 2 * FOG_PAD) * PPT, h: (h + 2 * FOG_PAD) * PPT, fog: true });
            }
            out.sort((a, b) => a.fog - b.fog);   // (the fog over the sharp ones: its soft rim lies over a visited neighbour's edge)
            return out;
        };
        // the field's view (its top-left on the real map) round a point, kept on the map
        MapaView.prototype.viewAt = function(cx, cy) {
            const f = this._field;
            return { x: Math.round(Math.max(0, Math.min(BOXW - f.w, cx - f.w / 2))), y: Math.round(Math.max(0, Math.min(BOXH - f.h, cy - f.h / 2))) };
        };
        // the picture of the part round both views (a long jump: only the new one, no slide)
        MapaView.prototype.renderReal = function(a, b) {
            const f = this._field;
            let x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y), x1 = Math.max(a.x, b.x) + f.w, y1 = Math.max(a.y, b.y) + f.h;
            if ((x1 - x0) * (y1 - y0) > 3.2e6) { x0 = b.x; y0 = b.y; x1 = b.x + f.w; y1 = b.y + f.h; this._zc = { x: b.x + f.w / 2, y: b.y + f.h / 2 }; }
            const w = x1 - x0, h = y1 - y0;
            let bm = this._zs.bitmap;
            if (!bm || bm.width !== w || bm.height !== h) { if (bm) bm.destroy(); bm = new Bitmap(w, h); this._zs.bitmap = bm; } else bm.clear();
            const pics = this.realPics(), box = { x: -x0, y: -y0, w: BOXW, h: BOXH }, sea = pic(this, "img/mapa_wyspy/", "morze");
            // the sea: its picture over the whole part, on the world's grid of tiles (it joins the maps' own water)
            const seaFill = ctx => {
                if (!sea.isReady()) { ctx.fillStyle = "rgb(76,142,147)"; ctx.fillRect(0, 0, w, h); return; }
                const src = sea._canvas || sea._image, pat = ctx.createPattern(src, "repeat"), s = sea.width;
                const ox = (((-x0) % s) + s) % s, oy = (((-y0) % s) + s) % s;
                ctx.save(); ctx.translate(ox - s, oy - s); ctx.fillStyle = pat; ctx.fillRect(0, 0, w + 2 * s, h + 2 * s); ctx.restore();
            };
            draw(bm, box, { box, real: true, nodes: nodes(), atlas: true, atKey: "at6", cursor: null, seaFill,
                under: () => { for (const q of pics) if (q.bm.isReady() && q.x + q.w > x0 && q.x < x1 && q.y + q.h > y0 && q.y < y1) bm.blt(q.bm, 0, 0, q.bm.width, q.bm.height, q.x - x0, q.y - y0, q.w, q.h); } });
            bm._baseTexture.update();
            this._region = { x: x0, y: y0, w, h };
            this._zoomDirty = false;
        };
        // the picture holds where the field is and where it slides to (else drawn again)
        MapaView.prototype.ensureRegion = function(force) {
            const f = this._field, R = this._region, n = this._zoomNodes && this._zoomNodes.find(q => q.key === String(this._cursor));
            const cur = this.viewAt(this._zc.x, this._zc.y), tgt = n ? this.viewAt(n.x, n.y) : cur;
            const inside = v => !!R && v.x >= R.x && v.y >= R.y && v.x + f.w <= R.x + R.w && v.y + f.h <= R.y + R.h;
            if (force || !inside(cur) || !inside(tgt)) this.renderReal(cur, tgt);
        };
        MapaView.prototype.zoomIn = function() {
            const f = this._field;
            if (this._zoom || !f || !BOXW) { if (this._zoom) SoundManager.playBuzzer(); return; }
            if (!this._zs) { this._zs = new Sprite(); this.root.addChild(this._zs); this._ring = new Sprite(ringBitmap()); this._ring.anchor.set(0.5, 0.5); this.root.addChild(this._ring); }
            this._zoom = true;
            this._zoomNodes = nodes().map(q => Object.assign({}, q, zxy(q)));   // (the places on the real map: the cursor's moves)
            const n = this._zoomNodes.find(q => q.key === String(this._cursor)), v = n ? this.viewAt(n.x, n.y) : this.viewAt(BOXW / 2, BOXH / 2);
            this._zc = { x: v.x + f.w / 2, y: v.y + f.h / 2 };
            this._region = null;
            SoundManager.playCursor();
            this.redraw();
            this.scene.drawKeys();
        };
        MapaView.prototype.dropZoom = function() {
            this._zoom = false;
            this._zoomNodes = null;
            this._region = null;
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
        // the picture's frame at the slide's place, the cursor's ring over its place
        MapaView.prototype.place = function() {
            const f = this._field, bm = this._zs && this._zs.bitmap, R = this._region;
            if (!this._zoom || !f || !bm || !this._zc || !R) return;
            const v = this.viewAt(this._zc.x, this._zc.y);
            this._zs.setFrame(Math.max(0, Math.min(R.w - f.w, v.x - R.x)), Math.max(0, Math.min(R.h - f.h, v.y - R.y)), f.w, f.h);
            this._zs.x = f.x; this._zs.y = f.y;
            this._zs.visible = !this._card;
            const n = this._zoomNodes && this._zoomNodes.find(q => q.key === String(this._cursor)), rx = n ? n.x - v.x : -1, ry = n ? n.y - v.y : -1;
            this._ring.visible = !!n && !this._card && rx >= 0 && rx <= f.w && ry >= 0 && ry <= f.h;
            if (n) { this._ring.x = f.x + rx; this._ring.y = f.y + ry; }
            this._view = [v.x, v.y];
        };
        MapaView.prototype.update = function() {
            if (!this.ready()) return;
            if (this._zoom && this._zc && !this._card) {
                if (this._zoomDirty) { this.ensureRegion(true); this.place(); }   // (a picture came)
                const n = this._zoomNodes && this._zoomNodes.find(q => q.key === String(this._cursor));
                if (n) {   // the slide: a fifth of the way each frame, to the cursor's view
                    const t = this.viewAt(n.x, n.y), f = this._field, tx = t.x + f.w / 2, ty = t.y + f.h / 2, dx = tx - this._zc.x, dy = ty - this._zc.y;
                    if (Math.abs(dx) + Math.abs(dy) > 0.6) { this._zc.x += Math.abs(dx) < 1 ? dx : dx * 0.2; this._zc.y += Math.abs(dy) < 1 ? dy : dy * 0.2; this.place(); }
                }
            }
            if (this._card) return;
            if (Input.isTriggered("pagedown")) { this.zoomIn(); return; }   // (E)
            if (Input.isTriggered("pageup")) { this.zoomOut(); return; }    // (Q)
            if (this.mouseMoved()) { const p = P.touchAt(), n = this.nodeAt(p.x, p.y); if (n && n.key !== this._cursor) { this._cursor = n.key; this.redraw(); } }
            for (const [name, dir] of [["down", 2], ["left", 4], ["right", 6], ["up", 8]]) if (Input.isRepeated(name)) { this.move(dir); return; }
            if (Input.isTriggered("ok")) this.open();
        };
        MapaView.prototype.nodeAt = function(x, y) {
            if (this._zoom && this._zoomNodes && this._view && this._field) { const zx = x - this._field.x + this._view[0], zy = y - this._field.y + this._view[1]; return this._zoomNodes.find(n => n.state === "known" && Math.hypot(n.x - zx, n.y - zy) <= 18) || null; }
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
            return { mapa: { cursor: this._cursor, card: this._card, zoom: !!this._zoom, view: this._zoom ? this._view || null : null, here: here === null ? null : String(here), target: tgt ? String(tgt.id) : null,
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
            this._drawn = draw(b, { x: px + 30, y: top, w: mw, h }, { cursor: this._cursor, nodes: list, labelKeys: keys, selectable: k => { const it = this.item(k); return !!it && it.enabled !== false; },
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
        PLACES: ALL, UND, K, place, nameOf, placeOf, hereId, discovered, revealAll, nodes, roads, card, targetPlace, draw, next, tabIcon, menuView, drawCard,
        choose, Scene_MapaWybor, choosing: () => { const s = SceneManager._scene; return s instanceof Scene_MapaWybor ? s.state() : null; },
        neighbours: key => (NEXT.get(String(key)) || []).slice()
    });
})();
