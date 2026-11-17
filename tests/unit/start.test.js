// The new game's start (data/System.json) - 2026-11-17, the player: „gra po prologu ma startować normalnie w domu dziadka”: the
// start had been left on Map025 „Pokoje gości” (a test start set in the editor), so after the prologue the game began in the tavern
// with no story at all (Story.js starts its story only when the first map is grandpa's house). Here: the start is grandpa's hut in the
// new world (Map224), on the floor beside the bed (2,5 - BED.standX/standY; the intro then lays the hero in it), the cell a floor one
// can stand on (a tile in layer 0, no event on it).
"use strict";
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");
const ROOT = path.join(__dirname, "..", "..");
const read = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

unit.test(t => {
    const sys = read("data/System.json");
    t.check("nowa gra zaczyna się w domu dziadka: Map224 (2,5), przy łóżku - nie testowy start z edytora", sys.startMapId === 224 && sys.startX === 2 && sys.startY === 5,
        { startMapId: sys.startMapId, startX: sys.startX, startY: sys.startY });
    const m = read("data/Map224.json"), W = m.width;
    const floor = m.data[sys.startY * W + sys.startX] > 0, ev = (m.events || []).filter(e => e && e.x === sys.startX && e.y === sys.startY).map(e => e.name);
    t.check("...na podłodze chaty (kafel jest, żadnego zdarzenia na tym polu)", floor && ev.length === 0, { floor, ev });
    const story = fs.readFileSync(path.join(ROOT, "js", "plugins", "Story.js"), "utf8");
    t.check("...i to jest dom nowego świata w Story.js (nowy: { house: 224 ...), więc fabuła rusza", /nowy:\s*\{\s*house:\s*224\b/.test(story));
});
