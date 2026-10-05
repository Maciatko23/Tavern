// Podgrodzie's errands (TownQuests_Data K40-K46, 2026-10-05): every resident of the suburb gives one short quest; at 10:00 on day
// 4 the washerwoman, the healer, the junk dealer and Franek have something to offer ("!" over them); Franek's bread (K46) and
// Józek's roof (K42, with a hammer) go from the offer to the reward; no reward is water (the drought rule).
const kit = require("./lib/kit.js");
const OURS = ["K40", "K41", "K42", "K43", "K44", "K45", "K46"];

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ map: 111, x: 26, y: 17, dir: 2, day: 4, hour: 10, quiet: true, minimap: false });
    await t.frames(30);
    const data = await t.json(`(function(){ const Q = TownQuests.QUESTS.filter(q => ${JSON.stringify(OURS)}.includes(q.id));
        const water = [138, 165, 166, 167];   // (the bucket, pots: never handed out)
        return { n: Q.length, givers: Q.map(q => q.giver), wet: Q.filter(q => [q.reward].concat(q.steps.map(s => s.reward)).some(r => r && (r.items || []).some(([id]) => water.includes(id)))).map(q => q.id),
            residents: Q.every(q => TownLife.RESIDENTS.some(r => r.key === q.giver && TownLife.homeOf(r) === 111)) }; })()`);
    t.check("7 errands, one from each resident of Podgrodzie, none of them hands out water", data.n === 7 && data.residents && !data.wet.length, data);
    await t.eval("TownQuests.refreshMarkers(); 0");
    const marks = await t.json("TownQuests.markers()");
    t.check("at 10:00 on day 4 the washerwoman, the healer, the junk dealer and Franek have an errand to offer ('!')",
        ["praczka", "znachorka", "szmaciarz", "franek"].every(k => marks[k] === "new"), marks);

    // Franek: a loaf of bread
    const offer = await t.talkTo("TownLife.eventOf('franek')", ["Przyniosę ci chleb."]);
    t.check("Franek asks for something to eat; 'Przyniosę ci chleb.' takes the errand", offer.done && /coś do jedzenia/.test(offer.text) && await t.json("TownQuests.isActive('K46')"), offer.text);
    await t.eval("$gameParty.gainItem($dataItems[83], 1); 0");
    const give = await t.talkTo("TownLife.eventOf('franek')", []);
    const k46 = await t.json(`({ done: TownQuests.isDone("K46"), bread: $gameParty.numItems($dataItems[83]) })`);
    t.check("...the bread given, he tells about Kuba's barrels at night (a note) and the errand is done", k46.done && k46.bread === 0 && /Kuba woziwoda/.test(give.text), { k46, text: give.text });

    // Józek: the stall's roof (boards, nails, the hammer shown)
    const jo = await t.talkTo("TownLife.eventOf('szmaciarz')", ["Zbiję."]);
    t.check("Józek asks to mend his stall's roof; 'Zbiję.' takes it", /daszek/i.test(jo.text) && await t.json("TownQuests.isActive('K42')"), jo.text);
    await t.eval("$gameParty.gainItem($dataItems[80], 2); $gameParty.gainItem($dataItems[88], 4); $gameParty.gainItem($dataItems[89], 1); 0");
    const ropes0 = await t.json("$gameParty.numItems($dataItems[93])");
    await t.talkTo("TownLife.eventOf('szmaciarz')", []);
    await t.frames(60);
    const k42 = await t.json(`({ done: TownQuests.isDone("K42"), boards: $gameParty.numItems($dataItems[80]), nails: $gameParty.numItems($dataItems[88]), hammer: $gameParty.numItems($dataItems[89]), ropes: $gameParty.numItems($dataItems[93]) })`);
    t.check("...boards and nails taken, the hammer kept, two ropes from the stall as the reward", k42.done && k42.boards === 0 && k42.nails === 0 && k42.hammer === 1 && k42.ropes === ropes0 + 2, k42);
});
