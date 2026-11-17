const kit = require("../../../tests/lib/kit.js");
const fs = require("fs");
kit.test({ port: 9742 }, async t => {
    await t.newGame({ map: 8, x: 60, y: 60, quiet: true, minimap: false, hour: 10, day: 5 });
    for (const id of [162, 24, 13, 111, 8, 4, 125, 3, 20, 14, 160, 161, 177, 165, 166, 167, 1, 156, 155, 157, 175, 120, 168, 22, 21, 23, 17, 18]) {
        const ok = await t.go(id, 3, 3, 2, { timeout: 40 });
        if (!ok) { console.log("FAIL", id); continue; }
        const d = await t.json(`(function(){
            const w = $gameMap.width(), h = $gameMap.height(), rows = [];
            for (let y = 0; y < h; y++) { let s = ""; for (let x = 0; x < w; x++) {
                const p = [2,4,6,8].some(d => $gameMap.isPassable(x, y, d));
                const blockedEv = $gameMap.eventsXyNt(x, y).some(e => e._priorityType === 1 && !(e.event() && /^(Miejsce|Znacznik)/.test(e.event().name)));
                s += !p ? "#" : blockedEv ? "e" : "."; } rows.push(s); }
            const ev = $gameMap.events().filter(e => e.event()).map(e => [e.eventId(), e.event().name, e.x, e.y, e._characterName, e.event().note ? e.event().note.slice(0, 60) : ""]);
            return { w, h, rows, ev, name: $dataMapInfos[${id}].name }; })()`);
        fs.writeFileSync(__dirname + "/mapdump_" + id + ".json", JSON.stringify(d));
        console.log(id, d.w, d.h, d.ev.length);
    }
    t.check("done", true);
});
