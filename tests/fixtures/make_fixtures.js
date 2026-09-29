// Makes the save fixtures (tests/fixtures/<name>.json) by playing the game through its own functions and saving it as the save
// screen does (kit: t.saveFixture). Later refactor stages load them (kit: t.loadFixture) to prove old saves still work, so they are
// made ONCE and kept - run this again only for a new fixture, or when a fixture has to show something new.
//   node tests/fixtures/make_fixtures.js                     all three
//   node tests/fixtures/make_fixtures.js day40_farm           just that one
// new_story_day1   a new story game, grandpa's house (Map019), day 1: the intro talk heard to its end
// tavern_evening   the story on: hired by Borgar, a shift worked on day 1 and one on day 20; in the tavern (Map001) at 19:00,
//                  the purse full, the tavern's reputation 60, a part of the debt paid
// day40_farm       the story on, day 40 (summer) on grandpa's field (Map003): the buildings put up over the weeks (F9's placer:
//                  finished, as the game stores them), a tamed dog at its kennel, the hut with its bed, larder and chest, crops in
//                  the ground, food in the bag and in the larder and the pantry, the tools, a level, the debt half paid
"use strict";
const kit = require("../lib/kit.js");

// in the page: a spot for a building near (bx, by) - free for it (as the F9 placer asks) with a tile of room round it - put up there
const HELPERS = String.raw`(function(){
    const F = Farming;
    window.__fx = {
        put(type, bx, by, maxR) {
            const room = (x, y) => { const cells = F.tilesOfBuilding(type, x, y);
                for (const c of cells) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const b = F.buildingAt(c.x + dx, c.y + dy); if (b) return false; }
                return true; };
            for (let r = 0; r <= (maxR || 14); r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
                const x = bx + dx, y = by + dy;
                if (!$gameMap.isValid(x, y) || F.whyNotBuild(type, x, y, false, true) || !room(x, y)) continue;
                if (F.placeFree(type, x, y)) return { type, x, y };
            }
            return { type, failed: true };
        },
        // the hero's needs kept up while the days go by (he eats and drinks between the jumps)
        fed() {
            if (window.Needs && Needs.state) { const n = Needs.state(); n.food = Math.max(n.food, 72); n.water = Math.max(n.water, 70); }
            if (window.Dog && Dog.state && Dog.state().tame) { const d = Dog.state(); d.food = Math.max(d.food, 70); d.water = Math.max(d.water, 70); d.hp = Dog.maxHp(); d.st = Dog.maxSt(); d.hurtUntil = 0; }   // (the dog fed at its bowl too)
            $gameSystem.setStamina && $gameSystem.setStamina(100); return 0; },
        // days go by: the clock through the game's own advance (the needs, the journal, the weather plan follow it), the nights slept
        days(n, hour) {
            for (let i = 0; i < n; i++) { $gameSystem.setDayNightHour(21); $gameSystem.sleepUntilHour(7); this.fed(); }
            if (hour !== undefined) $gameSystem.setDayNightHour(hour);
            if (window.Journal) Journal.evaluateGoals();
            return $gameSystem.dayNightDay();
        }
    };
    return 0;
})()`;

const dismiss = t => t.dismiss();
// the story's intro heard to its end (the driver presses O on grandpa's words)
async function hearIntro(t) {
    await t.eval(kit.DRIVER + "; window.__drv.on = true; window.__drv.picks = []; 0");
    const ok = await t.until("$gameSystem._story && $gameSystem._story.intro === 2 && !$gameMap.isEventRunning() && !$gameMessage.isBusy()", 90);
    await t.eval("window.__drv.on = false; 0");
    t.check("the intro talk is over (grandpa's soup, the journal's chapter)", ok);
    return ok;
}

const MAKERS = {
    async new_story_day1(t) {
        t.check("a new story game in grandpa's house", await t.newGame({ story: true, calm: false, needsOff: false }));
        await hearIntro(t);
        await t.frames(90);
        await dismiss(t);
        t.check("nothing running when it is saved (as the save menu requires)", await t.until(t.idle + " && SceneManager._scene instanceof Scene_Map && !$gameTemp._pendingSummary", 30));
        const r = await t.saveFixture("new_story_day1", { desc: "Nowa gra fabularna: dom dziadka (Map019), dzień 1, po rozmowie z dziadkiem (wstęp wysłuchany)." });
        t.check("saved: " + JSON.stringify(r.summary), r.summary.map === 19 && r.summary.day === 1 && r.summary.story, r.bytes);
    },

    async tavern_evening(t) {
        t.check("a new story game", await t.newGame({ story: true, calm: false, needsOff: false }));
        await hearIntro(t);
        await t.eval(HELPERS);
        t.check("grandpa's field reached (the story's step)", await t.go(3, 26, 14, 2, { calm: false }) && await t.eval("!!$gameSystem._story.flags.field"));
        await t.go(1, 50, 82, 8, { calm: false });
        await t.setHour(10);
        const hire = await t.talkTo("Story.borgarEvent()", [], { secs: 40 });
        t.check("Borgar hires the hero", hire.done && await t.eval("!!$gameSystem._story.flags.hired"), hire.text.slice(0, 120));
        // a shift in the evening (TavernShift driven by its test hook: each part scored 90, O on the cards)
        const shift = async () => {
            await t.eval(`(function(){ $gameSystem.setStamina(100); window.__shiftT = 0;
                TavernShift.onTick = function(scene) { const st = TavernShift.state(), I = Input._currentState; I.ok = false; if (!st) return; if (st.phase === "play") TavernShift.skip(90); else if (++window.__shiftT % 8 === 0) I.ok = true; }; return 0; })()`);
            const r = await t.talkTo("Story.borgarEvent()", ["Weź zmianę"], { secs: 150 });
            await t.eval("TavernShift.onTick = null; Input._currentState.ok = false; 0");
            return r;
        };
        await t.setHour(17);
        const s1 = await shift();
        t.check("the first shift worked (day 1)", s1.done && (await t.eval("$gameSystem._tavernShift && $gameSystem._tavernShift.done")) >= 1, s1.text.slice(0, 120));
        await t.eval("__fx.days(19, 17); 0");
        await dismiss(t);
        const s2 = await shift();
        const idle = await t.until(t.idle + " && !TavernShift.isRunning()", 60);
        t.check("another shift on day 20", (await t.eval("$gameSystem._tavernShift.done")) >= 2, { talkDone: s2.done, idle, text: s2.text.slice(0, 120), running: await t.eval("$gameMap.isEventRunning() && ($gameMap._interpreter._eventId || 0)") });
        // the purse, a part of the debt paid, the tavern's name among the people (QuestBoard's reputation), the evening
        await t.eval("(function(){ $gameParty.gainGold(420); Story.pay(300); QuestBoard.state().rep = 60; $gameSystem.setDayNightHour(19); __fx.fed(); if (window.Journal) Journal.evaluateGoals(); return 0; })()");
        await t.locate(50, 70, 8);
        await t.frames(120);
        await dismiss(t);
        t.check("nothing running when it is saved (as the save menu requires)", await t.until(t.idle + " && SceneManager._scene instanceof Scene_Map && !$gameTemp._pendingSummary", 30));
        const r = await t.saveFixture("tavern_evening", { desc: "Gra fabularna, dzień 20, 19:00 w tawernie (Map001): najęty u Borgara, dwie zmiany, 300 G długu spłacone, sakiewka pełna, reputacja tawerny 60." });
        t.check("saved: " + JSON.stringify(r.summary), r.summary.map === 1 && r.summary.hour >= 19 && r.summary.reputation === 60 && r.summary.gold >= 200, r.bytes);
    },

    async day40_farm(t) {
        t.check("a new story game", await t.newGame({ story: true, calm: false, needsOff: false }));
        await hearIntro(t);
        await t.eval(HELPERS);
        t.check("grandpa's field (Map003)", await t.go(3, 26, 14, 2, { calm: false }) && await t.eval("!!$gameSystem._story.flags.field"));
        const put = async (type, x, y, r) => { const p = await t.json(`__fx.put(${JSON.stringify(type)}, ${x}, ${y}, ${r || 14})`); if (p.failed) console.log("NOTE no room for " + type); return p; };
        const days = async (n, hour) => { await t.eval(`__fx.days(${n}, ${hour === undefined ? 10 : hour}); 0`); await dismiss(t); await t.frames(20); };
        // ---- week 1: the first things (the workbench, the fire, a bed of leaves, the tools)
        await t.eval("(function(){ for (const id of [60, 62, 63, 89, 90]) $gameParty.gainItem($dataItems[id], 1); return 0; })()");   // (the stone tools, the hammer, the knife)
        const built = [];
        built.push(await put("workbench", 24, 12), await put("campfire", 27, 16), await put("bedroll", 29, 13), await put("scarecrow", 20, 18));
        await days(6);
        // ---- week 2: wood and clay (the sawmill, the kiln, a chest, the compost, fired pots for the rain)
        built.push(await put("sawmill", 17, 12), await put("kiln", 31, 18), await put("chest_s", 26, 11), await put("compost", 21, 21));
        for (let i = 0; i < 4; i++) built.push(await put("clay_pot", 30 + i, 15, 6));
        await days(7);
        // ---- week 3: the dog's kennel and the dog tamed with meat (three meals, an hour apart), the stockpile, a bench
        built.push(await put("doghouse", 23, 17), await put("stockpile", 14, 17), await put("bench", 28, 12));
        const tame = await t.json(`(function(){ $gameParty.gainItem($dataItems[94], 3); for (let i = 0; i < 3; i++) { Dog.feedWild(); $gameSystem.advanceDayNight(1.2); } Dog.sync && Dog.sync(); const d = Dog.state(); return { tame: d.tame, mode: d.mode, trust: d.trust }; })()`);
        t.check("the dog tamed with three meals of meat, working from its kennel", tame.tame && tame.mode === "work", tame);
        await days(6);
        // ---- week 4: the hut (and its bed, larder and chest inside), the tannery, the pantry
        const hut = await put("hut", 22, 8, 16);
        built.push(hut, await put("tannery", 33, 11), await put("pantry", 12, 12));
        t.check("the hut stands on the field", !hut.failed, hut);
        if (!hut.failed) {
            let inHut = false;
            for (let i = 0; i < 3 && !inHut; i++) {   // (through the door when nothing else is going on - a letter, a notice)
                await t.dismiss();
                await t.until(t.idle + " && !$gamePlayer.isTransferring()", 20);
                await t.eval(`(function(){ const h = Farming.hutOf(); return Farming.enterHut(h.b); })()`);
                inHut = await t.until(t.onMap(100), 20);
            }
            await t.frames(30);
            const furn = [];
            for (const [type, x, y] of [["bed", 1, 3], ["larder", 5, 3], ["chest_s", 4, 3]]) furn.push(await t.json(`(function(){ return Farming.placeFree("${type}", ${x}, ${y}) ? "${type}" : "${type}: " + Farming.whyNotBuild("${type}", ${x}, ${y}, false, true); })()`));
            t.check("inside the hut (Map100): the bed, the larder, a chest", inHut && furn.every(f => !/:/.test(f)), furn);
            // food into the larder (it keeps five times longer there)
            await t.eval(`(function(){ const L = (Farming.farm().buildings[100] || []).find(b => b.type === "larder"); if (!L) return 0; for (const [id, n] of [[83, 4], [105, 3], [124, 2], [76, 2]]) { $gameParty.gainItem($dataItems[id], n); Farming.putInChest(L, $dataItems[id], n); } return 0; })()`);
            await t.eval("Farming.leaveHut(); 0");
            await t.until(t.onMap(3), 30);
            await t.frames(30);
        }
        await days(7);
        // ---- weeks 5-6: iron and bread (the forge, the brickworks, the bakery, the well with its bucket), the second snare, a coop
        await t.eval("(function(){ for (const id of [115, 116, 118, 87, 129, 154, 125]) $gameParty.gainItem($dataItems[id], 1); $gameParty.gainItem($dataItems[127], 12); return 0; })()");   // (iron tools, the saw, the can, the waterskin, the spear, the sling)
        built.push(await put("forge", 16, 22), await put("brickworks", 33, 22), await put("bakery", 10, 20), await put("well", 29, 21), await put("snare", 36, 8), await put("coop", 6, 12, 18));
        await days(8, 9);
        // ---- day 35 (summer): a patch of potatoes and barley in the natural soil near the scarecrow
        await t.eval("(function(){ for (const [id, n] of [[65, 1], [66, 1], [67, 6], [70, 6]]) $gameParty.gainItem($dataItems[id], n); return 0; })()");
        const soil = await t.json(`(function(){ const out = [];
            for (let r = 1; r < 9 && out.length < 6; r++) for (let dy = -r; dy <= r && out.length < 6; dy++) for (let dx = -r; dx <= r && out.length < 6; dx++) {
                const x = 20 + dx, y = 18 + dy, p = Farming.plotAt(x, y);
                if (p && p.s === "cleared" && !Farming.buildingAt(x, y) && $gameMap.eventsXy(x, y).length === 0 && !(x === $gamePlayer.x && y === $gamePlayer.y)) out.push([x, y]); }
            return out; })()`);
        let planted = 0;
        for (const [i, [x, y]] of soil.entries()) {
            for (const step of [`Farming.rake(${x}, ${y})`, `Farming.till(${x}, ${y})`, `Farming.plant(${x}, ${y}, "${i < 3 ? "potato" : "barley"}")`]) {
                await t.eval(`$gameSystem.setStamina(100); ${step}; 0`);
                await t.until("!$gamePlayer.isToolSwinging()", 10, 100);
                await t.frames(6);
            }
            if (await t.eval(`!!(Farming.plotAt(${x}, ${y}) || {}).crop`)) planted++;
        }
        t.check("crops in the ground (" + planted + " of " + soil.length + " tiles)", planted >= 3, soil);
        await days(5, 17);
        // ---- day 40: the bag, the pantry, the level, the debt, the hero by his hut in the late afternoon
        const end = await t.json(`(function(){
            for (const [id, n] of [[95, 2], [109, 1], [139, 5], [102, 6], [61, 8], [80, 12], [64, 10], [77, 14], [88, 20], [86, 3]]) $gameParty.gainItem($dataItems[id], n);
            const P = (Farming.farm().buildings[3] || []).find(b => b.type === "pantry");
            if (P) for (const [id, n] of [[71, 6], [72, 5], [75, 4]]) { $gameParty.gainItem($dataItems[id], n); Farming.putInChest(P, $dataItems[id], n); }
            if (window.Combat && Combat.gainXp) Combat.gainXp(2200, "test fixture", true);
            $gameParty.gainGold(1500); Story.pay(1250); $gameParty.gainGold(80);
            __fx.fed(); if (window.Journal) Journal.evaluateGoals();
            const h = Farming.hutOf(); if (h) { const d = { x: h.b.x + 1, y: h.b.y + 1 }; $gamePlayer.locate(d.x, d.y); $gamePlayer.setDirection(2); }
            return { day: $gameSystem.dayNightDay(), level: Combat.hero ? Combat.hero().level : null, paid: Story.state().paid, dog: Dog.state().tame, dogHp: Dog.state().hp, dogFood: Dog.state().food };
        })()`);
        t.check("day 40, a level or more, the debt half paid, the dog tame and well", end.day === 40 && end.paid === 1250 && end.dog && end.dogHp > 0 && end.dogFood >= 50, end);
        await t.frames(120);
        await dismiss(t);
        t.check("nothing running when it is saved (as the save menu requires)", await t.until(t.idle + " && SceneManager._scene instanceof Scene_Map && !$gameTemp._pendingSummary", 30));
        const r = await t.saveFixture("day40_farm", { desc: "Gra fabularna, dzień 40 (lato), 17:00 na polu dziadka (Map003): ~25 budynków stawianych przez tygodnie, oswojony pies przy budzie, chatka z łóżkiem, kredensem i skrzynią (jedzenie w kredensie i spiżarni), ziemniaki i jęczmień w ziemi, narzędzia, poziom, połowa długu spłacona." });
        t.check("saved: " + JSON.stringify(Object.assign({}, r.summary, { buildings: r.summary.buildings.length })), r.summary.day === 40 && r.summary.map === 3 && r.summary.buildings.length >= 15 && r.summary.dog, { failed: built.filter(b => b.failed).map(b => b.type), bytes: r.bytes });
    }
};

if (process.argv[2] !== "--one") (async () => {
    const want = process.argv.slice(2).filter(a => MAKERS[a]);
    const names = want.length ? want : Object.keys(MAKERS);
    for (const name of names) {
        console.log("---- " + name);
        // (one browser each, one after another: a clean game every time)
        await new Promise(res => {
            const { spawn } = require("child_process");
            const child = spawn(process.execPath, [__filename, "--one", name], { stdio: "inherit", env: process.env });
            child.on("exit", res);
        });
    }
})();

if (process.argv[2] === "--one") {
    const name = process.argv[3];
    kit.test({ port: 9396 }, async t => { await MAKERS[name](t); });
}
