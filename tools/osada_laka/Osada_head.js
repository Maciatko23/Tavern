//=============================================================================
// Osada.js
//=============================================================================
// The Silent's settlement ("Osada Milczących") on the east meadow of Łąka pod Gawrą (Map004; 2026-11-11, the player: "wywal tę bramę ... Osadę daj na łąkę").
// The tiles (the four huts, the paths, the ring ground, the regions) are in Map004's file; what stands and lives there is put in here, as the
// map loads (Tawerna.inject, ids 5300-5399 - the map files keep their ids below 500): the huts' doors (touch -> the interiors Map121-124), the
// residents and their hours event, the circle's stones, the mounds and posts, the lamps, the "Miejsce: osada_*" markers (W8, Okolice), the
// palisade (north / south pieces and the side poles) and the gate (shut, open by switch 16 - W8 chapter 5).
// The data below were copied from Map120 by tools/osada_laka/popraw.py (moved by +79, +32); nothing is saved, nothing runs per frame.

/*:
 * @target MZ
 * @plugindesc Osada Milczących na wschodniej łące pod Gawrą (Map004): drzwi chat, mieszkańcy, kamienie kręgu, palisada i brama wstawiane przy wczytaniu mapy. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * Bez ustawień. Zdarzenia 5300-5399 mapy 4 (Łąka pod Gawrą). Kafle osady są w pliku mapy; cieni słonecznych chaty nie rzucają (notatka
 * mapy <CienieBez:...>, Cienie.js).
 */
(() => {
    "use strict";
    const T = window.Tawerna;
    if (!T) throw new Error("Osada.js: brak TawernaCore.js");
    const PLUGIN = "Osada", MAP = 4, FIRST = 5300, LAST = 5399;
    // <OSADA_DANE> (tools/osada_laka/popraw.py)
    const EV = __EV__;
    const PAL = __PAL__;
    // </OSADA_DANE>
    const copy = o => JSON.parse(JSON.stringify(o));
    function build(data, mapId) {
        if (mapId !== MAP) return [];
        const out = [];
        let id = FIRST;
        for (const e of EV) { const c = copy(e); c.id = id++; out.push(c); }
        for (const p of PAL.pts) { const c = copy(PAL.tpl[p[0]]); c.id = id++; c.x = p[1]; c.y = p[2]; out.push(c); }
        if (id - 1 > LAST) throw new Error("Osada.js: " + (id - FIRST) + " events do not fit in " + FIRST + "-" + LAST);
        return out;
    }
    T.inject(MAP, { ids: [FIRST, LAST], owner: PLUGIN, build });
    T.register(PLUGIN, { ids: () => [FIRST, FIRST + EV.length + PAL.pts.length - 1] });
})();
