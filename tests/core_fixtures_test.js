// Old saves load with the core (TawernaCore.js + TawernaUI.js) and the plugins moved onto it (HomeAmbience.js, HomeDecor.js,
// HomeLife.js): the three fixtures made before stage 2 (tests/fixtures: new_story_day1 in grandpa's house, tavern_evening in the
// tavern at 19:00, day40_farm on grandpa's field with the buildings, the dog, the hut) and home_decor_v0 - a save of the OLD
// HomeDecor.js with its state in $gameSystem._homeDecor. Checks: every save comes up on its map and plays; the core's state is made
// in each (_tw with versions); the house gets its decoration events and the cat when the save is in it; the old _homeDecor is adopted
// (the keepsakes kept, the old key a hidden alias), saved again only in the new place, and that new save loads again; no console errors.
// Stage 3 (batch B1): Story's _story and Forestry's _forest adopted into _tw (the story as it was saved, the old names still a way there).
// Stage 3 (batch C3): Combat's _hero adopted into _tw.hero (day40_farm: level 6 kept), _combatMode / _combatHand into _tw.combat.
// Stage 3 (batch D2): Hunting's _hunt and _carcasses adopted into _tw.hunt / _tw.carcasses (home_decor_v0: the wolf of day 14), an older
//   save's _sneak into _tw.hunt.sneak (day40_farm made older: sneaking on, a carcass lying there).
//   CDP_PORT=9398 node tests/core_fixtures_test.js
const kit = require("./lib/kit.js");

kit.test({ port: 9398, plugins: ["TawernaCore", "TawernaUI", "HomeAmbience", "HomeDecor", "HomeLife"], bootCheck: "the game boots", errorCheck: "no console errors" }, async t => {
    t.check("the core, the kit and the three house plugins are in the page", await t.eval("!!(window.Tawerna && Tawerna.ui.Scene_MiniGame && window.HomeAmbience && window.HomeDecor && window.HomeLife)"), t.plugins);
    const CORE = `({ tw: !!$gameSystem._tw, keys: Object.keys($gameSystem._tw || {}).filter(k => k !== "_v").sort(), v: ($gameSystem._tw || {})._v,
        seeded: HomeDecor.state().seeded, oldKey: Object.keys($gameSystem).includes("_homeDecor"), map: $gameMap.mapId(), day: $gameSystem.dayNightDay(), scene: SceneManager._scene.constructor.name })`;
    const house = `({ decor: HomeDecor.SLOTS.filter(s => !!$gameMap.event(s.id)).length, cat: !!$gameMap.event(960), grandpa: !!$gameMap.event(901),
        injected: Tawerna.injected(19), looks: HomeDecor.SLOTS.reduce((o, s) => { const e = $gameMap.event(s.id); if (e && e._decorLook) o[s.key] = e._decorLook; return o; }, {}) })`;
    // Story and Forestry on the core: _tw.story / _tw.forest, the old names $gameSystem._story / _forest a hidden way there
    const STORY = `(function(){ const s = Story.state(), sys = $gameSystem, own = Object.keys(sys);
        return { story: !!s && sys._tw.story === s && sys._story === s && !own.includes("_story"), forest: !!sys._tw.forest && sys._forest === sys._tw.forest && !own.includes("_forest"),
            v: [Tawerna.state.version("story"), Tawerna.state.version("forest")], intro: s && s.intro, paid: s && s.paid, flags: s && s.flags, active: Story.active(), grandpa: !!Story.npc("grandpa") }; })()`;
    // Hunting on the core (batch D2): _tw.hunt / _tw.carcasses, the old names $gameSystem._hunt / _carcasses hidden ways there (Journal.js
    // reads _hunt), _sneak on Game_System.prototype (never saved)
    const HUNT = `(function(){ const sys = $gameSystem, own = Object.keys(sys), h = Hunting.hunt();
        return { adopted: sys._tw.hunt === h && sys._hunt === h && !own.includes("_hunt") && !!sys._tw.carcasses && sys._carcasses === sys._tw.carcasses && !own.includes("_carcasses") && !own.includes("_sneak"),
            v: [Tawerna.state.version("hunt"), Tawerna.state.version("carcasses")], kills: h.kills, killed: h.killed, sneak: Hunting.sneaking(), maps: Object.keys(sys._tw.carcasses).sort(),
            carcasses: Hunting.carcasses().length, journal: ((sys._hunt || {}).kills || {}).wolf || 0 }; })()`;
    const plays = async () => { const f0 = await t.eval("Graphics.frameCount"); await t.frames(30); return (await t.eval("Graphics.frameCount")) > f0 && (await t.eval("SceneManager._scene instanceof Scene_Map")); };

    // ================= new_story_day1: a new story game in grandpa's house, day 1
    t.check("new_story_day1 loads (grandpa's house, Map019)", await t.loadFixture("new_story_day1", { calm: true, needsOff: true }));
    let c = await t.json(CORE), h = await t.json(house);
    t.check("... the core's state is made in it (_tw: homeAmbience, homeDecor, homeLife with versions); the old game's past looked at once (seeded)",
        c.tw && ["homeAmbience", "homeDecor", "homeLife"].every(k => c.keys.includes(k)) && c.v.homeDecor === 1 && c.v.homeLife === 1 && c.seeded === 1 && c.map === 19 && !c.oldKey, c);
    t.check("... the house gets its 19 decoration events and the cat in the saved map (the save had none of them); grandpa is there",
        h.decor === 19 && h.cat && h.grandpa && JSON.stringify(h.injected.HomeDecor) === JSON.stringify([...Array(19).keys()].map(i => 980 + i)) && (await plays()), h);
    let st = await t.json(STORY);
    t.check("... the old _story and _forest are adopted (_tw.story, _tw.forest, v1; the old names hidden ways there): the story as saved (intro heard, nothing paid), grandpa by the core's injection",
        st.story && st.forest && st.v.join() === "1,1" && st.intro === 2 && st.flags.talk && st.paid === 0 && st.active && st.grandpa && JSON.stringify(h.injected.Story) === "[901]", { st, injected: h.injected.Story });

    // ================= home_decor_v0: the OLD HomeDecor.js's save - its state in $gameSystem._homeDecor
    const fx = kit.fixture("home_decor_v0");
    const raw = typeof fx.save === "string" ? JSON.parse(fx.save) : fx.save;   // (the save as the game stored it)
    t.check("home_decor_v0 was saved by the old plugin: $gameSystem._homeDecor (the wolf's pelt, Borgar's tankard), no _tw",
        !!raw.system._homeDecor && raw.system._homeDecor.got.wolf === 14 && raw.system._homeDecor.got.tankard === 14 && !raw.system._tw, raw.system._homeDecor);
    t.check("home_decor_v0 loads with the core", await t.loadFixture("home_decor_v0", { calm: true, needsOff: true }));
    c = await t.json(CORE);
    h = await t.json(house);
    const ad = await t.json(`({ got: HomeDecor.state().got, kills: HomeDecor.state().kills, inTw: $gameSystem._tw.homeDecor === HomeDecor.state(), alias: $gameSystem._homeDecor === HomeDecor.state(),
        hidden: !Object.keys($gameSystem).includes("_homeDecor"), v: Tawerna.state.version("homeDecor") })`);
    t.check("the old _homeDecor is adopted: the keepsakes (wolf, tankard on day 14) and the kill tally now in _tw.homeDecor, the old key only a hidden alias",
        ad.got.wolf === 14 && ad.got.tankard === 14 && ad.kills.wolf === 1 && ad.inTw && ad.alias && ad.hidden && ad.v === 1, ad);
    t.check("... the house shows them: the wolf's pelt by his bed, the tankard on his shelf, Easter's eggs on the table (day 14)",
        h.decor === 19 && h.looks.skora === "skora" && h.looks.polka === "polka_kufel" && h.looks.stol_l === "pisanki" && h.cat && (await plays()), h.looks);
    const hu = await t.json(HUNT);
    t.check("... the old _hunt and _carcasses adopted (_tw.hunt, _tw.carcasses, v1; the old names hidden ways there): the wolf killed on day 14 counted (Journal reads it by the old name), not sneaking",
        hu.adopted && hu.v.join() === "1,1" && hu.kills.wolf === 1 && hu.killed[19] && hu.killed[19].day === 14 && hu.killed[19].wolf === 1 && hu.sneak === false && hu.maps.join() === "19" && hu.journal === 1, hu);
    // saved again: only the new place; that save loads again
    t.check("saved again (slot 3)", await t.saveTo(3));
    const saved = await t.json("(async function(){ const s = JSON.parse(await StorageManager.zipToJson(await StorageManager.loadZip(DataManager.makeSavename(3)))).system; return { old: '_homeDecor' in s, tw: s._tw && s._tw.homeDecor, v: s._tw && s._tw._v }; })()");
    t.check("... the new save has _tw.homeDecor (version 1) and no _homeDecor any more", !saved.old && saved.tw && saved.tw.got.wolf === 14 && saved.v.homeDecor === 1, saved);
    const savedHunt = await t.json("(async function(){ const s = JSON.parse(await StorageManager.zipToJson(await StorageManager.loadZip(DataManager.makeSavename(3)))).system; return { old: ['_hunt', '_carcasses', '_sneak'].filter(k => k in s), wolf: s._tw && s._tw.hunt ? s._tw.hunt.kills.wolf : 0, carcasses: !!(s._tw && s._tw.carcasses), v: s._tw && s._tw._v ? [s._tw._v.hunt, s._tw._v.carcasses] : [] }; })()");
    t.check("... and _tw.hunt (the wolf) and _tw.carcasses, none of _hunt, _carcasses, _sneak", savedHunt.old.length === 0 && savedHunt.wolf === 1 && savedHunt.carcasses && savedHunt.v.join() === "1,1", savedHunt);
    t.check("... and that save loads again with everything kept", await t.loadFrom(3, { calm: true, needsOff: true }));
    const again = await t.json(`({ got: HomeDecor.state().got, pelt: $gameMap.event(984) && $gameMap.event(984)._decorLook, map: $gameMap.mapId() })`);
    t.check("... the keepsakes and the pelt are still there", again.got.wolf === 14 && again.got.tankard === 14 && again.pelt === "skora" && again.map === 19, again);

    // ================= tavern_evening: in the tavern at 19:00 (TavernLife's own easel injection beside the core)
    t.check("tavern_evening loads (the tavern, Map001, 19:00)", await t.loadFixture("tavern_evening", { calm: true, needsOff: true }));
    c = await t.json(CORE);
    // (the easel: TavernLife's 950, or - since the map has one of its own - the editor's event with <Tavern:plan>)
    const tav = await t.json("({ easel: $gameMap.events().some(e => { const a = Tawerna.tag(e, 'Tavern'); return !!a && a.pos[0] === 'plan'; }), decor: HomeDecor.SLOTS.some(s => !!$gameMap.event(s.id)), injected: Tawerna.injected(1), rep: QuestBoard.reputation(), gold: $gameParty.gold() })");
    t.check("... the core's state made, a plan easel there (by its <Tavern:plan> tag), no house decoration here (only the town's evening guests injected), the reputation and the purse as saved",
        c.tw && c.keys.includes("homeDecor") && c.map === 1 && tav.easel && !tav.decor && Object.keys(tav.injected).filter(k => k !== "TownLife").length === 0 && tav.rep === fx0("tavern_evening").summary.reputation &&
        tav.gold === fx0("tavern_evening").summary.gold && (await plays()), { c, tav });
    st = await t.json(STORY);
    t.check("... the story as saved: hired at Borgar's, 300 G paid", st.story && st.forest && st.flags.hired && st.flags.tavern && st.paid === 300 && st.active, st);

    // ================= day40_farm: grandpa's field on day 40 (the buildings, the dog, the hut)
    t.check("day40_farm loads (grandpa's field, Map003, day 40)", await t.loadFixture("day40_farm", { calm: true, needsOff: true }));
    c = await t.json(CORE);
    const farm = await t.json(`(function(){ const F = Farming.farm(), bl = F && F.buildings ? Object.values(F.buildings).reduce((a, l) => a.concat(l || []), []) : [];
        return { buildings: bl.filter(b => !b.site).length, dog: !!(window.Dog && Dog.state && Dog.state().tame), day: $gameSystem.dayNightDay(), season: Tawerna.time.seasonName() }; })()`);
    const want = fx0("day40_farm").summary;
    t.check("... the core's state made; the buildings, the dog and the day as saved; Tawerna.time says summer (day 40)",
        c.tw && c.map === 3 && farm.buildings === want.buildings.length && farm.dog === want.dog && farm.day === 40 && farm.season === "Lato" && (await plays()), { c, farm, want: want.buildings.length });
    st = await t.json(STORY);
    t.check("... the story as saved: half the debt paid (1250 G), the field reached", st.story && st.forest && st.paid === 1250 && st.flags.field && st.active, st);
    // Combat on the core (stage 3, batch C3): the old _hero adopted into _tw.hero - the level, the XP, the attributes and the points
    // kept -, the mode and the weapon in hand in _tw.combat; none of the old names saved again; saved and loaded, the same hero
    const HERO = `(function(){ const h = Combat.hero(), sys = $gameSystem, own = Object.keys(sys);
        return { adopted: sys._tw.hero === h && sys._hero === h && !own.includes("_hero") && !!sys._tw.combat && !own.includes("_combatMode") && !own.includes("_combatHand"),
            v: [Tawerna.state.version("hero"), Tawerna.state.version("combat")], level: h.level, xp: h.xp, attr: Object.values(h.attr).join(), points: h.points, sp: h.skillPoints,
            skills: Object.keys(h.skills).length, ready: h.ready, mhp: Combat.heroMhp() }; })()`;
    const hero = await t.json(HERO);
    t.check("... the old _hero adopted (_tw.hero, v1; the old name a hidden way there): level 6, 890 XP, every attribute 5, 15 + 5 points to give out, 115 health",
        hero.adopted && hero.v.join() === "1,1" && hero.level === 6 && hero.xp === 890 && hero.attr === "5,5,5,5,5" && hero.points === 15 && hero.sp === 5 && hero.skills === 0 &&
        hero.ready && hero.mhp === 115, hero);
    t.check("... saved (slot 3) and loaded again", (await t.saveTo(3)) && (await t.loadFrom(3, { calm: true, needsOff: true })));
    const hero2 = await t.json(HERO);
    const savedHero = await t.json("(async function(){ const s = JSON.parse(await StorageManager.zipToJson(await StorageManager.loadZip(DataManager.makeSavename(3)))).system; return { old: ['_hero', '_combatMode', '_combatHand'].filter(k => k in s), level: s._tw && s._tw.hero ? s._tw.hero.level : 0, combat: !!(s._tw && s._tw.combat) }; })()");
    t.check("... the new save has _tw.hero (level 6) and _tw.combat, none of _hero, _combatMode, _combatHand; the hero the same after loading it",
        savedHero.old.length === 0 && savedHero.level === 6 && savedHero.combat && JSON.stringify(hero2) === JSON.stringify(hero), { savedHero, hero2 });
    // Hunting (batch D2): this game made older - _hunt, _carcasses and _sneak back on $gameSystem (sneaking on, a deer's carcass on the field)
    const older = await t.json(`(function(){
        Hunting.dropCarcass("deer", $gamePlayer.x + 1.5, $gamePlayer.y + 0.5, 6);
        const c = JsonEx.parse(JsonEx.stringify(DataManager.makeSaveContents()));
        c.system._hunt = c.system._tw.hunt; delete c.system._tw.hunt; delete c.system._hunt.sneak;
        c.system._carcasses = c.system._tw.carcasses; delete c.system._tw.carcasses;
        c.system._sneak = true;
        const own = Object.keys(c.system).filter(k => ["_hunt", "_carcasses", "_sneak"].includes(k)).sort();
        DataManager.extractSaveContents(c);
        SceneManager.goto(Scene_Map);
        return { own }; })()`);
    await t.until(t.onMap(3), 30, 150);
    await t.frames(30);
    const hu40 = await t.json(HUNT);
    t.check("... an older save's _hunt, _carcasses and _sneak: adopted, it comes back sneaking with the deer's carcass lying on the field, none of the old names left on $gameSystem",
        older.own.join() === "_carcasses,_hunt,_sneak" && hu40.adopted && hu40.sneak === true && hu40.carcasses === 1 && hu40.maps.includes("3"), { older, hu40 });
    await t.eval("Hunting.setSneak(false); for (const c of Hunting.carcasses().slice()) Hunting.removeCarcass(c); 0");
    // and into grandpa's house from this older game: the decoration and the cat come on the way in
    t.check("... a walk into grandpa's house (Map019)", await t.go(19, 9, 11, 8));
    h = await t.json(house);
    t.check("... the house has its decoration events and the cat in this game too", h.decor === 19 && h.cat && (await plays()), h);
});

function fx0(name) { return kit.fixture(name); }
