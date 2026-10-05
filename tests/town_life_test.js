// The town lives by the clock (TownLife.js + TownLife_Data.js, user 2026-10-04): the 8 residents on Map008 (events 910-917) stand
// where their plans put them at 10:00, all are indoors (hidden, passable, not spoken to) at 23:00, a resident walks off on foot when
// her plan changes, Ambroży rings the bell on the full hour he stands at it, a resident calls out when the hero passes and answers
// when spoken to. Shot: docs/miasteczko/mieszkancy_rynek.png.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "miasteczko");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ map: 8, x: 24, y: 37, dir: 8, hour: 10, quiet: true, minimap: false });
    const at10 = await t.json(`(function(){ const out = {}; for (const r of TownLife.RESIDENTS.filter(r => TownLife.homeOf(r) === 8)) { const e = TownLife.eventOf(r.key);   // (Podgrodzie's live on Map111)
        out[r.key] = e ? [e.x, e.y, e._town.hidden ? "hidden" : "shown", e.characterName()] : null; } return out; })()`);
    t.check("14 residents in the town, each with its own sheet", Object.values(at10).filter(Boolean).length === 14 && Object.values(at10).every(v => v && /^\$Npc_/.test(v[3])), at10);
    const want = { piekarka: [21, 31], woziwoda: [23, 34], kapral: [48, 51], kowal: [7, 49], soltys: [39, 40], kupiec: [12, 40], garbarz: [16, 45], feliks: [40, 40] };
    t.check("at 10:00 each stands at its place (the baker at her stall, the water seller by the dry well, the corporal at the east gate...)",
        Object.entries(want).every(([k, [x, y]]) => at10[k][0] === x && at10[k][1] === y && at10[k][2] === "shown"), { at10 });
    t.check("...and Ambroży strolls round the bench on the market (3 tiles)", Math.abs(at10.dzwonnik[0] - 19) <= 3 && Math.abs(at10.dzwonnik[1] - 35) <= 3 && at10.dzwonnik[2] === "shown", at10.dzwonnik);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "mieszkancy_rynek.png"));

    // calls and talk: by the baker's stall
    await t.locate(21, 33, 8);
    await t.until("SpeechBubbles.log.some(l => /chleb|Bułki|kromka/i.test(l))", 20);
    const heard = await t.json("SpeechBubbles.log.slice(-5)");
    t.check("passing the baker's stall, Hanka calls out her bread", heard.some(l => /chleb|Bułki|kromka/i.test(l)), heard);
    await t.locate(21, 32, 8);
    const talk = await t.talkTo("TownLife.eventOf('piekarka')", []);
    t.check("spoken to in the morning, Hanka answers with one of her morning lines", talk.done && /Wstaję o czwartej|zboża z pola dziadka/.test(talk.text), talk.text);

    // the night: everyone inside
    await t.setHour(23.8);   // (Rafał the deserter lurks out till 23:30)
    await t.frames(10);
    const at23 = await t.json(`(function(){ const out = {}; for (const r of TownLife.RESIDENTS.filter(r => TownLife.homeOf(r) === 8)) { const e = TownLife.eventOf(r.key);
        out[r.key] = [e._town.hidden, e.isThrough(), e.isNormalPriority(), e.isTransparent()]; } return out; })()`);
    t.check("at 23:48 all of them are indoors: hidden, passable, out of the way", Object.values(at23).every(v => v[0] && v[1] && !v[2] && v[3]), at23);

    // a change of plan on foot: Hanka goes home at 14:00
    await t.setHour(13.97);
    await t.frames(10);
    const before = await t.json("TownLife.state('piekarka')");
    await t.until("TownLife.state('piekarka').hidden", 40, 300);
    const after = await t.json("TownLife.state('piekarka')");
    t.check("at 14:00 Hanka walks from the market bench to the bakery's door and goes in", !before.hidden && after.hidden && after.x === 6 && after.y === 39, { before, after });

    // the bell at noon
    await t.eval("window.__bells = 0; const _p = AudioManager.playSe; AudioManager.playSe = function(se){ if (se && se.name === 'Bell3') window.__bells++; return _p.call(this, se); }; 0");
    await t.setHour(11.98);
    await t.until("window.__bells >= 12", 40, 300);
    const bells = await t.eval("window.__bells");
    t.check("at noon Ambroży, standing at the bell, rings it twelve times", bells === 12, { bells, at: await t.json("TownLife.state('dzwonnik')") });
});
