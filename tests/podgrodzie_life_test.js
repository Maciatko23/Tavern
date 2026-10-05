// Podgrodzie lives by the clock too (TownLife.js v1.1.0, user 2026-10-05: "mapa z domkami drewnianymi i wnętrzami i
// mieszkańcami, biedniejsza dzielnica"): the 7 residents with "map: 111" in TownLife_Data.js are put on Map111, not on the town
// (Map008 keeps its own 14); at 10:00 each is where its plan says (Marta at the laundry, Józek at his stall, Zbych gone to the
// forest, Rysiek asleep at home...), all are indoors at 23:48 except the poacher (out in the forest - also hidden), Marta and her
// son are seen inside their cabin at night, Józek calls out and answers when spoken to. Shot: docs/podgrodzie/mieszkancy.png.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "podgrodzie");
const KEYS = ["praczka", "franek", "drwal", "klusownik", "znachorka", "szmaciarz", "uchodzca"];

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    require("fs").mkdirSync(SHOTS, { recursive: true });
    const gate = await t.json(`(function(){ const m = $dataMapInfos[111]; return m ? m.name : null; })()`);
    t.check("Map111 (Podgrodzie) is in the game", !!gate, gate);
    // start by the junk stall (its "Miejsce: kram" event)
    await t.newGame({ map: 111, x: 1, y: 1, dir: 2, hour: 10, quiet: true, minimap: false });
    const kram = await t.json("TownLife.spot('kram')");
    await t.eval(`(function(){ const k = ${JSON.stringify(kram)}; if (k) $gamePlayer.locate(k[0], k[1] + 2); return 0; })()`);
    await t.frames(30);
    const at10 = await t.json(`(function(){ const out = {}; for (const k of ${JSON.stringify(KEYS)}) { const e = TownLife.eventOf(k);
        out[k] = e ? [e.x, e.y, e._town.hidden ? "hidden" : "shown", e.characterName(), e.eventId()] : null; } return out; })()`);
    t.check("the 7 residents of Podgrodzie are on Map111, each with its own sheet", KEYS.every(k => at10[k] && /^\$Npc_/.test(at10[k][3])), at10);
    const spots = await t.json(`(function(){ const o = {}; for (const k of ["pranie", "kram", "kapliczka", "brama_zach", "zabawa"]) o[k] = TownLife.spot(k); return o; })()`);
    const near = (a, s, r) => !!a && !!s && Math.abs(a[0] - s[0]) <= r && Math.abs(a[1] - s[1]) <= r;
    t.check("at 10:00: Marta works at the laundry, Józek stands at his stall (on their spots)",
        at10.praczka[0] === spots.pranie[0] && at10.praczka[1] === spots.pranie[1] && at10.szmaciarz[0] === spots.kram[0] && at10.szmaciarz[1] === spots.kram[1]
        && at10.praczka[2] === "shown" && at10.szmaciarz[2] === "shown", { at10, spots });
    t.check("...Franek runs round the stall, babka Jadwiga strolls by the shrine, Darin looks for work by the gate (within a stroll)",
        near(at10.franek, spots.kram, 4) && near(at10.znachorka, spots.kapliczka, 4) && near(at10.uchodzca, spots.brama_zach, 4), { at10, spots });
    t.check("...Zbych is away in the forest and Rysiek sleeps at home (both hidden)", at10.drwal[2] === "hidden" && at10.klusownik[2] === "hidden", at10);
    await t.shot(path.join(SHOTS, "mieszkancy.png"));

    // calls and talk: Józek at his stall
    await t.eval(`(function(){ const k = ${JSON.stringify(kram)}; $gamePlayer.locate(k[0], k[1] + 1); $gamePlayer.setDirection(8); return 0; })()`);
    await t.until("SpeechBubbles.log.some(l => /Starzyzna|cenę|Hełm/i.test(l))", 25);
    const heard = await t.json("SpeechBubbles.log.slice(-6)");
    t.check("passing the stall, Józek calls out his junk", heard.some(l => /Starzyzna|cenę|Hełm/i.test(l)), heard);
    const talk = await t.talkTo("TownLife.eventOf('szmaciarz')", []);
    t.check("spoken to in the morning, Józek answers with one of his morning lines", talk.done && /Kupię wszystko|sklep na rynku/.test(talk.text), talk.text);

    // the town keeps its own: none of Podgrodzie's on Map008, its 14 there
    await t.go(8, 24, 37, 8);
    const town = await t.json(`(function(){ const o = { podgrodzie: [], town: 0 }; for (const r of TownLife.RESIDENTS) { const e = TownLife.eventOf(r.key);
        if (TownLife.homeOf(r) === 111 && e) o.podgrodzie.push(r.key); if (TownLife.homeOf(r) === 8 && e) o.town++; } return o; })()`);
    t.check("on Map008 the town's 14 residents and none of Podgrodzie's", town.town === 14 && !town.podgrodzie.length, town);

    // the night: back in Podgrodzie at 23:48 everyone is hidden (indoors, or the poacher in the forest)
    await t.go(111, 1, 1, 2);
    await t.eval(`(function(){ const k = ${JSON.stringify(kram)}; $gamePlayer.locate(k[0], k[1] + 2); return 0; })()`);
    await t.setHour(23.8);
    await t.frames(10);
    const at23 = await t.json(`(function(){ const out = {}; for (const k of ${JSON.stringify(KEYS)}) { const e = TownLife.eventOf(k);
        out[k] = [e._town.hidden, e.isThrough(), e.isNormalPriority(), e.isTransparent()]; } return out; })()`);
    t.check("at 23:48 all of Podgrodzie is hidden: passable, out of the way", Object.values(at23).every(v => v[0] && v[1] && !v[2] && v[3]), at23);

    // indoors at night: Marta and Franek at home in their cabin (its "Miejsce: praczka_wnetrze" / "franek_wnetrze")
    const cabin = await t.json(`(function(){ for (let id = 112; id <= 117; id++) if ($dataMapInfos[id] && /praczki/i.test($dataMapInfos[id].name)) return id; return 0; })()`);
    t.check("the washerwoman's cabin is one of the interiors 112-117", cabin > 0, cabin);
    if (cabin) {
        await t.go(cabin, 2, 2, 8);
        await t.frames(20);
        const home = await t.json(`(function(){ const o = {}; for (const k of ["praczka", "franek"]) { const e = TownLife.eventOf(k); o[k] = e ? [e.x, e.y, e._town.hidden] : null; } return o; })()`);
        t.check("...at night Marta and Franek are seen inside it", home.praczka && home.franek && home.praczka[2] === false && home.franek[2] === false, home);
    }
});
