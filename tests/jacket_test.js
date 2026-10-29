// The leather jacket (combat stage 2, docs/WALKA.md 10 / 11.2; Combat_Fight.js ARMORS, Farming_Data.js tannery, Durability.js): the
// item and its icon, sewn at the tannery (3 tanned hides, 2 sinews, a rope), worn by having it in the bag (like the shield): every
// blow that gets through takes 20% less and wears it, a worn one is mended at the workbench, a worn-out one tears; the P menu's
// Ekwipunek page shows it; the journal's goal.
// CDP_PORT=9464 node tests/jacket_test.js        (SHOTS=1: a picture of the Ekwipunek page into docs/walka/)
const kit = require("./lib/kit.js");
const SHOTS = !!process.env.SHOTS;

kit.test({ port: 9464 }, async t => {
    t.check("a new game on grandpa's field (Map003), noon", await t.newGame({ map: 3, x: 22, y: 14, hour: 12, quiet: true }));
    await t.eval("$gameSystem.setStamina(250); 0");

    // ================= 1. the item =================
    const it = await t.json("(function(){ const i = $dataItems[171]; return i && { name: i.name, kind: i.itypeId, icon: i.iconIndex, weight: i.meta.Weight, tool: Durability.TOOLS[171] }; })()");
    t.check("item 171 'Skórzana kurtka': a thing that is worn (like the shield, itypeId 2), it wears out (60 blows)", !!it && it.name === "Skórzana kurtka" && it.kind === 2 && it.tool && it.tool.life === 60 && it.tool.unit === "block", it);
    const icons = await t.json(`new Promise(res => { const bmp = ImageManager.loadSystem("IconSet"); const chk = () => { if (!bmp.isReady()) return setTimeout(chk, 50); const out = [];
        for (const i of [432, 433, 434, 435]) { const d = bmp.context.getImageData((i % 16) * 32, Math.floor(i / 16) * 32, 32, 32).data; let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 0) n++; out.push(n); } res(out); }; chk(); })`);
    t.check("the new icons are drawn (bear meat raw / roasted, the bear's hide, the jacket: 432-435)", icons.every(n => n > 150), icons);

    // ================= 2. sewn at the tannery =================
    const B = await t.json(`(function(){
        const free = (x, y) => $gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && $gameMap.eventsXy(x, y).length === 0 && !Farming.hasObjectTile(x, y) && !Farming.buildingAt(x, y);
        for (let by = 3; by < $gameMap.height() - 4; by++) for (let bx = 2; bx < $gameMap.width() - 6; bx++) {
            let ok = true;
            for (let y = by - 1; y <= by + 1 && ok; y++) for (let x = bx; x < bx + 3; x++) if (!free(x, y)) { ok = false; break; }
            if (!ok) continue;
            const f = $gameSystem._farm, P = f.plots[3] = f.plots[3] || {}, L = f.buildings[3] = f.buildings[3] || [];
            for (let y = by - 1; y <= by; y++) for (let x = bx; x < bx + 3; x++) P[x + "," + y] = { s: "cleared" };
            L.push({ id: f.nextId++, type: "tannery", x: bx, y: by, last: 1, v: 3 }); f.rev++;
            return { bx, by };
        }
        return null; })()`);
    t.check("a tannery stands on the field", !!B && (await t.eval(`(Farming.buildingAt(${B.bx}, ${B.by}) || {}).type`)) === "tannery", B);
    const rec = await t.json("(function(){ const r = Farming.BUILDINGS.tannery.recipes.find(r => r.id === 'jacket'); return r && { name: r.name, inputs: r.inputs, output: r.output, manual: !!r.manual, unique: !!r.unique }; })()");
    t.check("the tannery's 'Uszyj skórzaną kurtkę': 3 tanned hides, 2 sinews, a rope -> the jacket (by hand, one for good)",
        !!rec && JSON.stringify(rec.inputs) === "[[97,3],[163,2],[93,1]]" && rec.output[0] === 171 && rec.manual && rec.unique, rec);
    await t.locate(B.bx + 1, B.by + 1, 8);
    await t.frames(6);
    const menu = await t.json(`Farming.menuFor(${B.bx + 1}, ${B.by}).entries.map(e => e.name + (e.enabled === false ? "(x)" : ""))`);
    t.check("in the tannery's menu (dimmed while the materials are missing)", menu.some(n => /^Uszyj skórzaną kurtkę/.test(n)), menu);
    const no = await t.eval(`Farming.craftManual(Farming.buildingAt(${B.bx}, ${B.by}), Farming.BUILDINGS.tannery.recipes.find(r => r.id === 'jacket'))`);
    await t.give(97, 3); await t.give(163, 2); await t.give(93, 1);
    const made = await t.eval(`Farming.craftManual(Farming.buildingAt(${B.bx}, ${B.by}), Farming.BUILDINGS.tannery.recipes.find(r => r.id === 'jacket'))`);
    await t.until("$gameParty.numItems($dataItems[171]) > 0", 8, 50);
    await t.frames(40);
    const after = await t.json("[171, 97, 163, 93].map(i => $gameParty.numItems($dataItems[i]))");
    t.check("without materials it is refused; with them the jacket is sewn and they are used up", no === false && made === true && after.join() === "1,0,0,0", { no, made, after });
    const goal = await t.json("(function(){ const g = Journal.GOALS.find(g => g.id === 'jacket'); return g && { done: g.done(), recipe: g.recipe, after: g.after }; })()");
    t.check("the journal's goal 'Uszyj skórzaną kurtkę' (after the tannery) is done", !!goal && goal.done === true && goal.after.includes("tannery"), goal);

    // ================= 3. worn: 20% less from every blow, and it wears =================
    const hit = (dmg) => t.json(`(function(){ const a = $gameParty.leader(); a.recoverAll(); Combat.resetAct(); const hp0 = a.hp;
        const r = Combat.hitPlayer({ damage: ${dmg}, poise: 0, from: { x: $gamePlayer._realX + 1.5, y: $gamePlayer._realY + 0.5 }, name: "test", knock: 0 });
        return { r, lost: hp0 - a.hp, left: Durability.left(171) }; })()`);
    const w0 = await t.eval("Durability.left(171)");
    const on = await hit(50);
    await t.eval("$gameParty.loseItem($dataItems[171], 1, true); 0");
    const off = await hit(50);
    await t.give(171, 1);
    t.check("a blow of 50: with the jacket 40 is lost and it wears by one; without it all 50", on.r === "hit" && on.lost === 40 && on.left === w0 - 1 && off.lost === 50, { w0, on, off });
    await t.eval("Combat.armor()") ;
    const both = await t.json(`(function(){ $gameParty.gainItem($dataItems[155], 1); const a = $gameParty.leader(); a.recoverAll(); Combat.resetAct(); Combat.act.mode = "block"; Combat.act.blockT = 99;
        const hp0 = a.hp, r = Combat.hitPlayer({ damage: 100, poise: 0, from: { x: $gamePlayer._realX + 0.5, y: $gamePlayer._realY - 0.5 }, name: "test", knock: 0 }); Combat.resetAct();
        return { r, lost: hp0 - a.hp }; })()`);
    t.check("with the shield raised too: the shield takes three quarters, the jacket a fifth of the rest (100 -> 20)", both.r === "blocked" && both.lost === 20, both);
    const dodge = await t.json(`(function(){ const a = $gameParty.leader(); a.recoverAll(); Combat.resetAct(); Combat.act.iframes = 10; const l0 = Durability.left(171);
        const r = Combat.hitPlayer({ damage: 50, poise: 0, from: { x: $gamePlayer._realX + 1.5, y: $gamePlayer._realY + 0.5 }, name: "test", knock: 0 }); Combat.resetAct();
        return { r, worn: l0 - Durability.left(171) }; })()`);
    t.check("a blow dodged does not wear it", dodge.r === "dodged" && dodge.worn === 0, dodge);

    // ================= 4. mended at the workbench; worn out it tears =================
    const rep = await t.json("(function(){ const r = Durability.repairRecipes().find(r => r.repair === 171); return r && { name: r.name, inputs: r.inputs }; })()");
    t.check("worn: the workbench offers 'Napraw: Skórzana kurtka' (a tanned hide and a sinew)", !!rep && rep.name === "Napraw: Skórzana kurtka" && JSON.stringify(rep.inputs) === "[[97,1],[163,1]]", rep);
    await t.eval("$gameSystem._wear.used[171] = Durability.lifeOf(171) - 1; $gameSystem._wear.warned = {}; window.__kit.pops.length = 0; 0");
    const torn = await hit(30);
    await t.frames(10);
    const pops = await t.popups();
    t.check("its last blow: the jacket tears and is gone ('Skórzana kurtka się podarła') - that blow it still softened (24)", torn.lost === 24 &&
        (await t.eval("$gameParty.numItems($dataItems[171])")) === 0 && pops.some(p => /Skórzana kurtka się podarła/.test(p)), { torn, pops });

    // ================= 5. the P menu shows it (since 2026-10-28 the menu's Ekwipunek page - MenuRing.js; the old Postać screen is gone) =================
    await t.give(171, 1);
    await t.eval("$gameTemp._menuTab = 'equip'; SceneManager.push(Scene_Menu); 0");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging() && !!MenuRing.info()", 10, 50);
    await t.frames(20);
    const scr = await t.json(`(function(){ const i = MenuRing.info(), slots = i && i.equip && i.equip.slots || [], at = id => slots.find(x => x.id === id) || {};
        return { tab: i && i.active, torso: at("torso"), left: at("left"), worn: slots.filter(x => x.item).map(x => x.id + ":" + x.item), armor: Combat.armor() && Combat.armor().id }; })()`);
    t.check("menu P -> Ekwipunek: the jacket worn in a place (and it is the armour), the shield too",
        scr.tab === "equip" && scr.armor === 171 && scr.worn.some(w => /:171$/.test(w)) && scr.worn.some(w => /:155$/.test(w)), scr);
    if (SHOTS) await t.shot("../docs/walka/postac_wyposazenie.png");
    await t.eval("SceneManager.pop(); 0");
    await t.until(t.onMap(3), 10, 50);
});
