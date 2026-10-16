//=============================================================================
// Wyspa.js
//=============================================================================
// What the six island places share (docs/miejsca_wyspy/PAKIETY.md; the data: Wyspa_Data.js). Kept by the coordinator - the
// packages use it, they do not change it.
//   - the ways in on the user's maps: the harbour's top edge (Map125 14-16,0 -> Pustelnia 155), its bottom edge (21-23,39 ->
//     Garnizon 162) and the mountains' right edge (Map013 59,11-13 -> Przylądek 159) are events put into those maps as they load
//     (Tawerna.inject, ids 690-698; the map files stay as the user made them) - and only once the place behind is built: its
//     package calls Wyspa.ready(mapId) when its map is done (Wyspa.force(true): all of them, for the tests)
//   - the tides: Wyspa.tide(day, hour) -> { level 0 low .. 1 high, low, nextLow, nextHigh } - two low waters a day, about 50 minutes
//     later each day; the switch 20 "Wyspa_Odplyw" follows it (for event pages: the sandbar to the wreck)
//   - the flags passed between the packages (TownQuests flags): Wyspa.flag(name) / Wyspa.setFlag(name)
//   - the gate of Act II: Wyspa.actTwo() - Story.chapterEnded() (the debt paid or the field lost), as everywhere since 2026-10-15
// No water anywhere here (the drought).

/*:
 * @target MZ
 * @plugindesc Wyspa - wspólny rdzeń sześciu nowych miejsc: przejścia z map użytkownika (dopiero gdy miejsce gotowe), pływy, flagi między pakietami. v1.1.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa_Data
 * @orderAfter TownQuests
 *
 * @help
 * ============================================================================
 * Wyspa.js - wspólny rdzeń nowych miejsc (pustelnia, urwisko, latarnia,
 * garnizon, wrak, cysterna)
 * ============================================================================
 * Przejścia z przystani (mapa 125) i z gór (mapa 13) wstawia w czasie
 * wczytania mapy - pliki map zostają bez zmian. Przejście pojawia się dopiero,
 * gdy pakiet danego miejsca zgłosi Wyspa.ready(numer mapy).
 * Pływy: Wyspa.tide() i przełącznik 20 „Wyspa_Odplyw” (odpływ = ON).
 * Menu F9 (zakładka „Wyspa i fabuła”) i testy: Wyspa.forceTide("low" | "high" | null)
 * - odpływ albo przypływ wymuszony teraz (null: znowu z zegara; nie zapisuje się).
 * Plan i zasady: docs/miejsca_wyspy/PAKIETY.md.
 * ============================================================================
 */

(() => {
    "use strict";

    const T = window.Tawerna, D = window.WyspaData;
    if (!T) throw new Error("Wyspa.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    if (!D) throw new Error("Wyspa.js: brak Wyspa_Data.js - musi być wyżej na liście wtyczek (the island's data is missing)");
    const PLUGIN = "Wyspa";

    // ------------------------------------------------------------------ "the place is built" (its package says so at load)
    const readyMaps = new Set();
    let forced = false;
    const ready = mapId => { readyMaps.add(Number(mapId)); return true; };
    const isReady = mapId => forced || readyMaps.has(Number(mapId));

    // ------------------------------------------------------------------ the ways in on the user's maps
    const BLANK_COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
        switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function edgeEvent(edge, k) {
        const [x, y] = edge.cells[k], [lx, ly] = edge.land[k];
        const page = { conditions: Object.assign({}, BLANK_COND), directionFix: false,
            image: { tileId: 0, characterName: "", direction: 2, pattern: 0, characterIndex: 0 },
            list: [{ code: 201, indent: 0, parameters: [0, edge.to, lx, ly, edge.dir, 0] }, { code: 0, indent: 0, parameters: [] }],
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3,
            moveType: 0, priorityType: 0, stepAnime: false, through: false, trigger: 1, walkAnime: false };
        return { id: edge.ids[0] + k, name: edge.name, note: "<Wyspa:" + edge.id + ">", pages: [page], x, y };
    }
    const EDGE_MAPS = Array.from(new Set(D.EDGES.map(e => e.from)));
    T.inject(EDGE_MAPS, { ids: [D.SHARED_IDS[0], D.SHARED_IDS[1]], owner: PLUGIN, build(data, mapId) {
        const out = [];
        for (const edge of D.EDGES) {
            if (edge.from !== mapId || !isReady(edge.to)) continue;
            edge.cells.forEach((c, k) => { if (c[0] < data.width && c[1] < data.height) out.push(edgeEvent(edge, k)); });
        }
        return out;
    } });

    // ------------------------------------------------------------------ the tides
    // (2026-10-16) F9 / the tests: the tide NOW forced low or high (the asked-for day and hour of the forecasts stay as they are);
    // runtime only, not saved
    let tideForced = null;
    function tide(day, hour) {
        if (tideForced && day === undefined && hour === undefined) {
            const P = D.TIDE.period;
            return tideForced === "low" ? { level: 0, low: true, nextLow: 0, nextHigh: P / 2, forced: "low" } : { level: 1, low: false, nextLow: P / 2, nextHigh: 0, forced: "high" };
        }
        const d = day === undefined ? T.time.day() : day, h = hour === undefined ? T.time.hour() : hour;
        const P = D.TIDE.period, t = (d - 1) * 24 + h - D.TIDE.offset;
        const phase = ((t / P) % 1 + 1) % 1;                 // 0 high water, 0.5 low water
        const level = (1 + Math.cos(2 * Math.PI * phase)) / 2;
        // hours till the next low / high water (from the phase)
        const nextLow = ((0.5 - phase + 1) % 1) * P, nextHigh = ((1 - phase) % 1) * P;
        return { level, low: level < D.TIDE.low, nextLow, nextHigh };
    }
    // the hours of the low waters of a day (their middles), for the journal and the talk ("odpływ o 4 i o 16")
    function lowWaters(day) {
        const d = day === undefined ? T.time.day() : day, P = D.TIDE.period, out = [];
        const start = (d - 1) * 24 - D.TIDE.offset;
        for (let k = Math.floor(start / P) - 1; k <= Math.ceil((start + 24) / P) + 1; k++) {
            const hAbs = (k + 0.5) * P + D.TIDE.offset - (d - 1) * 24;
            if (hAbs >= 0 && hAbs < 24) out.push(Math.round(hAbs * 10) / 10);
        }
        return out;
    }
    let lastLow = null;
    function syncTide() {
        if (!window.$gameSwitches) return;
        const low = tide().low;
        if (low !== lastLow || $gameSwitches.value(D.SWITCHES.odplyw) !== low) { lastLow = low; $gameSwitches.setValue(D.SWITCHES.odplyw, low); }
    }
    T.onMapUpdate(syncTide, { name: "tide", owner: PLUGIN, every: 60 });
    function forceTide(kind) {
        tideForced = kind === "low" || kind === "high" ? kind : null;
        syncTide();
        return tideForced;
    }

    // ------------------------------------------------------------------ the flags between the packages, the gate of Act II
    const Q = () => T.api("TownQuests");
    const flag = name => { const q = Q(); const s = q && typeof q.state === "function" ? q.state() : null; return !!(s && s.flags && s.flags[name]); };
    const setFlag = name => {
        const q = Q(); const s = q && typeof q.state === "function" ? q.state() : null;
        if (!s || !s.flags) return false;
        if (!s.flags[name]) s.flags[name] = T.time.day();
        return true;
    };
    const actTwo = () => {
        const st = T.api("Story");
        if (st && typeof st.chapterEnded === "function") return !!st.chapterEnded();
        const q = Q();
        return !!(q && typeof q.actTwo === "function" && q.actTwo());
    };

    // ------------------------------------------------------------------ the API
    window.Wyspa = T.register(PLUGIN, {
        DATA: D, ready, isReady, readyMaps: () => Array.from(readyMaps).sort((a, b) => a - b),
        force: on => { forced = !!on; return forced; }, forced: () => forced,
        tide, lowWaters, forceTide, tideForced: () => tideForced, flag, setFlag, actTwo,
        // (F9 / the tests) what is where
        info: () => ({ ready: Array.from(readyMaps), forced, edges: D.EDGES.map(e => ({ id: e.id, from: e.from, to: e.to, on: isReady(e.to) })), tide: tide() })
    });
})();
