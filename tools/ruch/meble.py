# -*- coding: utf-8 -*-
"""Ruch swobodny przy meblach (gracz 2026-11-06: „przy stołach jest od góry jakby klatka blokująca, że się nie da dojść”): stopy wchodzą w pusty brzeg kafla mebla
(górę do pół kratki, bok trochę - tak, by bohater wciąż stał na swojej kratce), nigdy w to, co narysowane. Z żywego js/plugins/FreeMovement.js robi tools/ruch/staging/js/plugins/FreeMovement.js.
  python tools/ruch/meble.py"""
import os
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
WY = os.path.join(HERE, "staging", "js", "plugins")
os.makedirs(WY, exist_ok=True)
p = os.path.join(ROOT, "js", "plugins", "FreeMovement.js")
s = open(p, "rb").read().decode("utf-8")
crlf = "\r\n" in s
reps = [
("""    // the tile the feet come from (the one beside the new tile, inside the feet's box), when it is a hill's rim: its side towards the new tile
""", """    // ------------------------------------------------------------------
    // Furniture's empty edges (2026-11-06, user: "przy stołach jest od góry jakby klatka blokująca, że się nie da dojść"): a table's tile is shut whole, but
    // its picture often starts half a tile down. The feet may come into the empty band of such a tile (from above up to half a tile, from a side a little:
    // the hero still stands on his own tile then - events, talks, tools see him there), never into what is drawn. Only a tile shut whole by a piece of the
    // B-E sheets; a person in it, an A tile (a wall, a hill), a one-way edge: as before.
    // ------------------------------------------------------------------
    const edgeCache = new Map();
    function tileEdges(t) {
        const key = $gameMap.tilesetId() + ":" + t;
        if (edgeCache.has(key)) return edgeCache.get(key);
        const ts = $gameMap.tileset(), name = ts && ts.tilesetNames[5 + Math.floor(t / 256)];
        if (!name) { edgeCache.set(key, null); return null; }
        const bmp = ImageManager.loadTileset(name);
        if (!bmp.isReady()) return null;   // (not kept: asked again once the sheet is in)
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight(), i = t % 256;
        const col = (i % 8) + Math.floor(i / 128) * 8, row = Math.floor(i / 8) % 16;
        let data = null;
        try { data = bmp.context.getImageData(col * tw, row * th, tw, th).data; } catch (e) { data = null; }
        if (!data) { edgeCache.set(key, null); return null; }
        const solid = (x, y) => data[(y * tw + x) * 4 + 3] > 40;
        const rowFull = y => { let n = 0; for (let x = 0; x < tw; x++) if (solid(x, y) && ++n >= 2) return true; return false; };
        const colFull = x => { let n = 0; for (let y = 0; y < th; y++) if (solid(x, y) && ++n >= 2) return true; return false; };
        let top = 0, left = 0, right = 0;
        while (top < th && !rowFull(top)) top++;
        while (left < tw && !colFull(left)) left++;
        while (right < tw && !colFull(tw - 1 - right)) right++;
        const e = top >= th ? { top: th, left: tw, right: tw } : { top, left, right };
        edgeCache.set(key, e);
        return e;
    }
    // the empty edges of a cell shut whole by furniture (null: not such a cell), as far as the feet may go into it
    function furnitureEdges(x, y) {
        if (!$gameMap.isValid(x, y)) return null;
        const flags = $gameMap.tilesetFlags(), tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const half = Math.max(1, Math.round(HIT_W * tw / 2));
        let deciding = true, out = null;
        // (in the engine's order: the tiles of tile events first - a cup on the table - then the layers from the top)
        for (const t of $gameMap.tileEventsXy(x, y).map(ev => ev.tileId()).concat($gameMap.layeredTiles(x, y))) {
            if (!t) continue;
            const f = flags[t];
            if (f & 0x10) continue;
            const shut = (f & 0x0f) === 0x0f;
            if (deciding) { if (!shut || t >= 1024) return null; deciding = false; }
            if (!shut) continue;
            if (t >= 1024) return null;
            const e = tileEdges(t);
            if (!e) return null;
            out = out ? { top: Math.min(out.top, e.top), left: Math.min(out.left, e.left), right: Math.min(out.right, e.right) } : Object.assign({}, e);
        }
        if (!out) return null;
        out.top = Math.min(out.top, Math.floor(th / 2) - 1);   // (from above: the feet stop before the middle - he stays on the tile above)
        out.left = Math.min(out.left, half - 1);               // (from a side: his middle stays out of it)
        out.right = Math.min(out.right, half - 1);
        return out;
    }
    // do the feet at (fx, fy) touch the cell only in its empty edges?
    function onlyInEdges(x, y, fx, fy) {
        const e = furnitureEdges(x, y);
        if (!e) return false;
        const tw = $gameMap.tileWidth(), th = $gameMap.tileHeight();
        const half = Math.max(1, Math.round(HIT_W * tw / 2)), high = Math.max(1, Math.round(HIT_H * th));
        const cx = fx + Math.floor(tw / 2), px0 = cx - half, px1 = cx + half - 1, py0 = fy + th - high, py1 = fy + th - 1;
        const X0 = x * tw, Y0 = y * th;
        const ox0 = Math.max(px0, X0), ox1 = Math.min(px1, X0 + tw - 1), oy0 = Math.max(py0, Y0), oy1 = Math.min(py1, Y0 + th - 1);
        if (ox0 > ox1 || oy0 > oy1) return true;
        return oy1 < Y0 + e.top || ox1 < X0 + e.left || ox0 > X0 + tw - 1 - e.right;
    }
    // the tile the feet come from (the one beside the new tile, inside the feet's box), when it is a hill's rim: its side towards the new tile
"""),
("""                if (x >= from.x0 && x <= from.x1 && y >= from.y0 && y <= from.y1) continue;
                const edge = x > from.x1 ? 4 : x < from.x0 ? 6 : y > from.y1 ? 8 : 2;   // (going right the feet come in by its left edge...)
                if (this.freeTileBlocked(x, y, edge) || rimKeeps(x, y, edge, from)) return { x: $gameMap.roundX(x), y: $gameMap.roundY(y) };
""", """                if (x >= from.x0 && x <= from.x1 && y >= from.y0 && y <= from.y1) {
                    // (already in a piece of furniture's empty edge: no deeper than it; feet that are deep in something - an old save, a push - still get out)
                    if (!this.isThrough() && !this.isDebugThrough() && onlyInEdges(x, y, fromX, fromY) && !onlyInEdges(x, y, fx, fy)) return { x: $gameMap.roundX(x), y: $gameMap.roundY(y) };
                    continue;
                }
                const edge = x > from.x1 ? 4 : x < from.x0 ? 6 : y > from.y1 ? 8 : 2;   // (going right the feet come in by its left edge...)
                if (this.freeTileBlocked(x, y, edge) || rimKeeps(x, y, edge, from)) {
                    if (edge !== 2 && !this.isThrough() && !this.isCollidedWithCharacters($gameMap.roundX(x), $gameMap.roundY(y)) && !rimKeeps(x, y, edge, from) && onlyInEdges(x, y, fx, fy)) continue;
                    return { x: $gameMap.roundX(x), y: $gameMap.roundY(y) };
                }
"""),
]
for o, n in reps:
    if crlf: o, n = o.replace("\n", "\r\n"), n.replace("\n", "\r\n")
    assert s.count(o) == 1, o[:60]
    s = s.replace(o, n)
open(os.path.join(WY, "FreeMovement.js"), "wb").write(s.encode("utf-8"))
print("ok")
