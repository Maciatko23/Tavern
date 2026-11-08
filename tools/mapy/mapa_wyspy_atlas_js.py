# -*- coding: utf-8 -*-
"""Zmiany MapaWyspy.js do mapy jak atlas (część tools/mapy/mapa_wyspy_brzegowe.py; gracz 2026-11-07: „Atlas z odnośnikami”, „byle
było czytelnie i przejrzyście”). Zakładka Mapa: schemat na cały panel, każde odkryte miejsce z nazwą tam, gdzie wyliczył ją
mapa_wyspy_atlas.py (przy punkcie albo na morzu z cienką kreską), napisy z ciemną obwódką koloru morza; u góry liczba odkrytych
i legenda w jednym rzędzie, u dołu miejsce pod kursorem (albo bohatera). Karta miejsca (O): jak dotąd - schemat z lewej, karta
z prawej. Wybór celu wozu: nazwy tylko przystanków. Małe miejsca (maly): mniejszy punkt i napis, bez „?”, poza drogami wozu."""


def patch(mw):
    def rep(s, old, new):
        if s.count(old) != 1: raise SystemExit("MapaWyspy.js: %r (%d)" % (old[:70], s.count(old)))
        return s.replace(old, new)
    mw = rep(mw, """    for (const [a, b] of D.DROGI) {
        const ka = String(a), kb = String(b);
        if (!BY.has(ka) || !BY.has(kb)) continue;""", """    for (const [a, b] of D.DROGI) {
        const ka = String(a), kb = String(b);
        if (!BY.has(ka) || !BY.has(kb)) continue;
        if (BY.get(ka).maly || BY.get(kb).maly) continue;   // (2026-11-07: the small edge places - not the cart's ways, no "?" from them)""")
    mw = rep(mw, """            const state = known.has(p.key) ? "known" : target || (NEXT.get(p.key) || []).some(k => known.has(k)) ? "hint" : "hidden";
            return { id: p.id, key: p.key, name: p.nazwa, x: p.x, y: p.y, lab: p.lab, state, here: String(here) === p.key, target };""",
"""            // (a small edge place - maly: seen once visited, never a "?"; at: its name's place in the atlas)
            const state = known.has(p.key) ? "known" : target || (!p.maly && (NEXT.get(p.key) || []).some(k => known.has(k))) ? "hint" : "hidden";
            return { id: p.id, key: p.key, name: p.nazwa, x: p.x, y: p.y, lab: p.lab, at: p.at || null, maly: !!p.maly, state, here: String(here) === p.key, target };""")
    mw = rep(mw, """    const roads = () => D.DROGI.map(([a, b]) => [String(a), String(b)]).filter(([a, b]) => BY.has(a) && BY.has(b));""",
"""    // (an old road through small places - [a, b, [through...]]: seen until all of them are known; then their own ways show)
    const roads = () => D.DROGI.filter(r => !(Array.isArray(r[2]) && r[2].every(k => discovered(k)))).map(([a, b]) => [String(a), String(b)]).filter(([a, b]) => BY.has(a) && BY.has(b));""")
    mw = rep(mw, """        forest: "rgba(64,80,68,0.65)", bed: "rgb(94,88,72)"
    };""", """        forest: "rgba(64,80,68,0.65)", bed: "rgb(94,88,72)",
        lead: "rgba(226,229,234,0.85)", halo: "rgba(14,18,22,0.92)"   // (2026-11-07, the atlas: the names' leaders, the dark halo round a name)
    };""")
    # the places: the atlas's names (o.atlas) or the names of o.labelKeys only
    mw = rep(mw, """    // draw(bitmap, rect, o): the sea in the rect, the island, the roads, the places. o: { cursor, nodes (nodes()), selectable(key) -> bool
    // (dimmed when false), labelOf(key) -> a second line, sea: false (no sea fill) }.""",
"""    // draw(bitmap, rect, o): the sea in the rect, the island, the roads, the places. o: { cursor, nodes (nodes()), selectable(key) -> bool
    // (dimmed when false), labelOf(key) -> a second line, sea: false (no sea fill), atlas: true (every known place named where its
    // `at` says - beside its point or out on the sea with a leader; 2026-11-07), labelKeys: a Set - only these named (not the atlas) }.""")
    mw = rep(mw, """            const r = n.key === UND ? 7 : 6;""", """            const r = n.key === UND ? 7 : n.maly ? 4 : 6;   // (a small edge place: a smaller point)""")
    mw = rep(mw, """            if (n.state === "known") {
                const side = n.lab""", """            if (n.state === "known" && o.atlas && n.at) atlasName(n, p, r, on, can);
            else if (n.state === "known" && (!o.labelKeys || o.labelKeys.has(n.key))) {
                const side = n.lab""")
    mw = rep(mw, """        // the places
        const label = (text, x, y, size, col, face) => {""", """        // (2026-11-07) a name of the atlas: its place from the data (at: [x, y, "l" | "r" | "c", leader]), the dark halo round it; the
        // leader from the point's rim to the name's nearest edge
        const atlasName = (n, p, r, on, can) => {
            const size = n.maly ? 13 : 15, face = on || n.here ? "bold" : null, w = c && c.measure ? c.measure(n.name, size, face) : n.name.length * size * 0.5;
            const q = at(box, { x: n.at[0], y: n.at[1] }), al = n.at[2], x0 = al === "l" ? q.x : al === "r" ? q.x - w : q.x - w / 2, hh = Math.ceil(size * 1.5);
            if (n.at[3]) {
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
        const label = (text, x, y, size, col, face) => {""")
    # the tab: the atlas over the whole panel; the card (O) as before
    a = mw.index("""            const top = R.y0 + 104, h = R.y1 - 16 - top, mw = Math.min(MAP_W, R.rx - R.lx - 360);""")
    b = mw.index("""            P.done(b);
        };
        MapaView.prototype.move""")
    mw = mw[:a] + """            const top = R.y0 + 104, h = R.y1 - 16 - top, cd = this._cursor ? card(this._cursor) : null;
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
            this._drawn = draw(b, { x: R.lx, y: top + ATLAS.top, w: R.rx - R.lx, h: h - ATLAS.top - ATLAS.bottom }, { cursor: this.inside ? this._cursor : null, nodes: list, atlas: true });
            const k = this.inside ? this._cursor : here, info = k !== null && k !== undefined && discovered(k) ? card(k) : null;
            if (info) P.tx(b, info.title + (info.sub ? "  ·  " + info.sub : ""), R.lx, top + h - ATLAS.bottom + 6, 16, { top: true, color: K.soft, max: R.rx - R.lx });
""" + mw[b:]
    mw = rep(mw, """    const MAP_W = 700, COL_GAP = 30;""", """    const MAP_W = 700, COL_GAP = 30;
    const ATLAS = { top: 26, bottom: 26 };   // (the atlas's rows over and under the sketch, px - tools/mapy/mapa_wyspy_atlas.py counts on them)""")
    # the cart's choice: only the stops named
    mw = rep(mw, """            this._drawn = draw(b, { x: px + 30, y: top, w: mw, h }, { cursor: this._cursor, nodes: list, selectable: k => { const it = this.item(k); return !!it && it.enabled !== false; },""",
             """            this._drawn = draw(b, { x: px + 30, y: top, w: mw, h }, { cursor: this._cursor, nodes: list, labelKeys: keys, selectable: k => { const it = this.item(k); return !!it && it.enabled !== false; },""")
    mw = rep(mw, "schemat odkrytych miejsc z drogami, bohaterem i celem; zakładka „Mapa” w menu P (O: karta miejsca) i wybór miejsca na schemacie. v1.0.0",
             "schemat odkrytych miejsc z drogami, bohaterem i celem; zakładka „Mapa” w menu P (O: karta miejsca) i wybór miejsca na schemacie. v1.1.0")
    return mw
