// Graf przejść między mapami dla autopilota fabuły (tests/autopilot_fabula/fab.js): każde „Przenieś gracza” (201, wprost) ze zdarzeń
// w plikach data/MapXXX.json - skąd (mapa, zdarzenie, pole, strona i jej warunki, wyzwalacz, priorytet), dokąd (mapa, pole) i czy
// polecenie siedzi w gałęzi warunku (drzwi domów z godzinami). Przejścia w obrębie tej samej mapy pominięte. Bez przeglądarki:
//   node tests/autopilot_fabula/graf.js            (liczby na ekran)
// W stronie: window.FAB_GRAPH = require("./graf.js").build() (test i tryb oglądania wstrzykują go przed fab.js).
"use strict";
const fs = require("fs");
const path = require("path");
const DATA = path.join(__dirname, "..", "..", "data");

function build() {
    const exits = [], names = {};
    const infos = JSON.parse(fs.readFileSync(path.join(DATA, "MapInfos.json"), "utf8"));
    for (const i of infos) if (i) names[i.id] = i.name;
    for (const f of fs.readdirSync(DATA).filter(f => /^Map\d{3}\.json$/.test(f))) {
        const map = Number(f.slice(3, 6));
        let m;
        try { m = JSON.parse(fs.readFileSync(path.join(DATA, f), "utf8")); } catch (e) { continue; }
        for (const e of m.events || []) {
            if (!e) continue;
            e.pages.forEach((p, pi) => {
                for (const c of p.list || []) {
                    if (c.code !== 201 || !c.parameters || c.parameters[0] !== 0) continue;
                    const to = c.parameters[1];
                    if (to === map) continue;
                    const k = p.conditions || {};
                    const cond = {};
                    if (k.switch1Valid) cond.s1 = k.switch1Id;
                    if (k.switch2Valid) cond.s2 = k.switch2Id;
                    if (k.variableValid) cond.v = [k.variableId, k.variableValue];
                    if (k.selfSwitchValid) cond.ss = k.selfSwitchCh;
                    if (k.itemValid) cond.item = k.itemId;
                    exits.push({ m: map, id: e.id, name: e.name || "", x: e.x, y: e.y, p: pi, trig: p.trigger, prio: p.priorityType, cond,
                        to, tx: c.parameters[2], ty: c.parameters[3], br: c.indent > 0 ? 1 : 0, w: m.width, h: m.height });
                    break;   // (one transfer of a page is enough)
                }
            });
        }
    }
    return { made: new Date().toISOString(), names, exits };
}

module.exports = { build };

if (require.main === module) {
    const g = build();
    const maps = new Set(g.exits.map(e => e.m));
    console.log("przejść:", g.exits.length, "map z wyjściami:", maps.size, "w gałęziach:", g.exits.filter(e => e.br).length);
}
