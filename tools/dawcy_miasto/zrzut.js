// zrzut danych zadan i mieszkancow z zywej gry -> tools/dawcy_miasto/zrzut.json (CDP 9915). Uzycie: CDP_PORT=9915 node tools/dawcy_miasto/zrzut.js
const kit = require("../../tests/lib/kit.js");
const fs = require("fs"), path = require("path");
kit.test({ port: 9915, bootCheck: "gra", errorCheck: false, evalTimeout: 120000, overlay: process.env.GAME_OVERLAY, overlayJs: !!process.env.GAME_OVERLAY_JS }, async t => {
    await t.newGame({ map: 8, x: 50, y: 40, day: 12, hour: 12, quiet: true, minimap: false });
    const o = await t.json(`(function(){
        const Q = TownQuests.Q || {};
        const quests = {};
        for (const id of Object.keys(Q)) { const q = Q[id];
            quests[id] = { kind: q.kind, title: q.title, giver: q.giver || null, offer: q.offer ? { cond: q.offer.cond || null, auto: !!q.offer.auto } : null, repeat: q.repeat || null,
                steps: (q.steps || []).map(s => ({ name: s.name, type: s.type, to: s.to || null, spot: s.spot || null, hours: s.hours || null, map: s.map || null, where: s.where || null })) }; }
        const res = TownLife.RESIDENTS.map(r => ({ key: r.key, name: r.name, title: r.title, id: r.id, map: r.map || 8, when: r.when || null, alt: r.alt ? { map: r.alt.map, when: r.alt.when } : null,
            plan: r.plan.map(p => [p[0], p[1], Array.isArray(p[2]) ? "[]" : p[2], typeof p[3] === "function" ? "fn" : p[3] || null]) }));
        return { quests, res };
    })()`, 60000);
    fs.writeFileSync(path.join(__dirname, "zrzut.json"), JSON.stringify(o, null, 1));
    console.log("quests", Object.keys(o.quests).length, "res", o.res.length);
});
