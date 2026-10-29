// The F9 developer menu in six tabs (Q / E switch them): Zdarzenia (clock, weather, birds, boar), Budowanie (any building
// put down free and finished), Przedmioty (any item in a chosen quantity, in three kinds: Narzędzia i broń / Surowce / Jedzenie,
// switched by Tab or [ / ] or a click), Rdzeń (TawernaCore's own lines), Kot (grandpa's cat: what it does, send it somewhere),
// Wyspa i fabuła (2026-10-16: the six island places and the story's big moments - go there, the tide, the fog, the red water,
// the field lost, the debt, +1000 G, the prologue again, the tame raven, the garrison's favour, the cistern);
// it opens again on the tab, the kind and the row it was left on.
const { launch, sleep } = require("./cdp.js");
(async () => {
    const b = await launch({ width: 1280, height: 720, dpr: 1 });
    const ev = e => Promise.race([b.evaluate(e), new Promise((_, rej) => setTimeout(() => rej(new Error("evaluate timeout: " + String(e).slice(0, 100))), 25000))]);
    const results = [];
    const check = (name, ok, info) => { results.push(ok); console.log((ok ? "PASS " : "FAIL ") + name + (info !== undefined ? "  " + JSON.stringify(info) : "")); };
    try {
        await b.send("Page.navigate", { url: "http://127.0.0.1:8765/index.html" });
        for (let i = 0; i < 120; i++) { if (await ev("!!(window.SceneManager && SceneManager._scene && SceneManager._scene.constructor.name==='Scene_Title')").catch(() => false)) break; await sleep(500); }
        await ev(`(function(){ DataManager.setupNewGame(); $gamePlayer.reserveTransfer(3, 22, 14, 2, 0); SceneManager.goto(Scene_Map); })()`);
        for (let i = 0; i < 120; i++) { if (await ev("SceneManager._scene.constructor.name==='Scene_Map' && SceneManager._scene._spriteset && !SceneManager.isSceneChanging() && $gameMap.mapId()===3").catch(() => false)) break; await sleep(500); }
        await sleep(1500);
        await ev("SceneManager._scene.startFadeIn(1,false); if (window.Needs) Needs.setEnabled(false); $gameSystem.setDayNightHour(12); $gameSystem._dayNightDay = 1; 0");
        await sleep(500);
        const frames = n => ev(`new Promise(res => { const t = Graphics.frameCount + ${n}; const iv = setInterval(() => { if (Graphics.frameCount >= t) { clearInterval(iv); res(Graphics.frameCount); } }, 4); })`);
        const J = async e => JSON.parse(await ev("JSON.stringify(" + e + ")"));
        const key = async (code, hold = 3) => {
            await ev(`Input._onKeyDown({ keyCode: ${code}, preventDefault() {} }); 0`);
            await frames(hold);
            await ev(`Input._onKeyUp({ keyCode: ${code} }); 0`);
            await frames(4);
        };
        const F9 = 120, LEFT = 37, RIGHT = 39, OK = 13, ESC = 27, DOWN = 40, UP = 38, Q = 81, E = 69, TAB = 9, LB = 219, RB = 221;
        const tabNow = () => J("({ tab: SceneManager._scene._tab, sel: SceneManager._scene._tabs.index(), kinds: [...new Set(SceneManager._scene._list._rows.map(r => r.kind))], n: SceneManager._scene._list._rows.length, index: SceneManager._scene._list.index(), help: SceneManager._scene._help.contents ? 1 : 0, kind: SceneManager._scene._kinds.index(), band: SceneManager._scene._kinds.visible, groups: [...new Set(SceneManager._scene._list._rows.map(r => r.group))], listY: SceneManager._scene._list.y, ids: SceneManager._scene._list._rows.map(r => r.item ? r.item.id : 0) })");
        // a click at the middle of item i of a band (the tab band or the kinds band)
        const click = async (win, i) => {
            await ev(`(function(){ const w = SceneManager._scene.${win}, r = w.itemRect(${i}); const p = w.worldTransform.apply(new Point(w.padding + r.x + r.width / 2, w.padding + r.y + r.height / 2)); TouchInput._onTrigger(p.x, p.y); window.__click = p; })(); 0`);
            await frames(3);
            await ev("TouchInput._onRelease(window.__click.x, window.__click.y); 0");
            await frames(4);
        };

        check("F9 is bound to 'debugmenu'", (await ev("Input.keyMapper[120]")) === "debugmenu");

        // ---------------------------------------------------------------- open it
        await key(F9);
        await frames(10);
        check("F9 opens Scene_Debug", (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        check("six tabs: Zdarzenia, Budowanie, Przedmioty, Rdzeń, Kot, Wyspa i fabuła", JSON.stringify(await J("SceneManager._scene._tabs._list.map(c => c.name)")) === '["Zdarzenia","Budowanie","Przedmioty","Rdzeń","Kot","Wyspa i fabuła"]');
        const rows = await J(`SceneManager._scene._list._rows.map(r => ({ kind: r.kind, label: r.label }))`);
        let t = await tabNow();
        check("it opens on 'Zdarzenia': the two time rows, dawn / sunset / a misty morning, the four weather rows (storm, a strike, a strike on a tree, calm), the two bird rows, the three butterfly rows (Motyle.js: butterflies now, moths at a fire, the net), the boar, a wolf pack, a deer, a bear (stage 2), the men of stage 3 (a bandit, a knife bandit, an archer, a mercenary, an ambush, a camp, a raid on a sleeper - Humans.js), the beasts and the men (wolves at a camp, a boar and a bandit, a bear and a bandit - Starcia.js), the creatures of stage 4 (a creature, a boss - Creatures.js), +200 XP, the regions' colours (RegionLayers; the old hero's row is gone since 2026-10-28), the underground's rows (Underground.js: a floor, the grate, the locks, the lift; the Heart's endings, world and Lord - added by Underground.js itself) - nothing else", t.tab === 0 && t.sel === 0 && rows.map(r => r.kind).join().replace(/,act3_arm,act3_start,act3_reset$/, "").replace(/,underground,ugGate(,ugLocks,ugLifts(,heartEnd,heartWorld,heartLord)?)?$/, "") === "hour,day,dawn,dusk,mist,storm,strike,treestrike,calm,birds,raid,motyle,cmy,siatka,boar,wolves,deer,bear,h_bandit,h_knifer,h_archer,h_mercenary,h_ambush,h_camp,h_raid,st_camp,st_boar,st_bear,cr_kind,cr_boss,xp,layers" && rows[0].label === "+1 godzina", rows.map(r => r.kind));
        await key(E); await frames(6);
        t = await tabNow();
        const builds = await J(`SceneManager._scene._list._rows.map(r => ({ kind: r.kind, type: r.type, label: r.label, icon: r.icon }))`);
        const nTypes = await ev("Object.keys(Farming.BUILDINGS).length");
        check("E: 'Budowanie' - one 'Postaw: ...' row for every building of Farming.js, each with an icon, and only those", t.tab === 1 && t.sel === 1 && builds.length === nTypes && builds.every(r => r.kind === "build" && /^Postaw: /.test(r.label) && r.icon > 0) && builds.some(r => r.label === "Postaw: Cegielnia"), { tab: t.tab, n: builds.length, nTypes, first: builds[0] });
        await key(E); await frames(6);
        t = await tabNow();
        const t0 = t;
        check("E: 'Przedmioty' - a second band of kinds: Narzędzia i broń, Surowce, Jedzenie", t.tab === 2 && t.sel === 2 && t.band && JSON.stringify(await J("SceneManager._scene._kinds._list.map(c => c.name)")) === '["Narzędzia i broń","Surowce","Jedzenie"]', t.band);
        check("...it opens on 'Narzędzia i broń': only items of that kind, the list moved down under the band", t.kind === 0 && t.kinds.join() === "item" && t.groups.join() === "0" && t.listY > (await ev("SceneManager._scene._kinds.y")), { kind: t.kind, groups: t.groups, listY: t.listY });
        await key(TAB); await frames(4);
        const t1 = await tabNow();
        check("Tab: 'Surowce'", t1.tab === 2 && t1.kind === 1 && t1.groups.join() === "1", { kind: t1.kind, groups: t1.groups });
        await key(TAB); await frames(4);
        const t2 = await tabNow();
        check("Tab: 'Jedzenie'", t2.tab === 2 && t2.kind === 2 && t2.groups.join() === "2", { kind: t2.kind, groups: t2.groups });
        const all = await J("$dataItems.filter(i => i && i.name && !/^-{3,}/.test(i.name)).map(i => i.id)");
        const seen = t0.ids.concat(t1.ids, t2.ids);
        check("the three kinds hold every item (not the database's '-----' dividers), each once", seen.length === all.length && all.every(id => seen.includes(id)), { seen: seen.length, all: all.length });
        const where = id => (t0.ids.includes(id) ? 0 : t1.ids.includes(id) ? 1 : t2.ids.includes(id) ? 2 : -1);
        const expect = { 60: 0, 116: 0, 89: 0, 154: 0, 155: 0, 156: 0, 126: 0, 127: 0, 129: 0, 138: 0, 121: 0,   // axes, pick, hammer, spear, shield, club, bow, arrows, waterskin, bucket, tent
            61: 1, 64: 1, 80: 1, 85: 1, 86: 1, 67: 1, 82: 1, 119: 1, 149: 1, 104: 1, 163: 1,   // wood, stone, planks, ore, iron, seeds, flour, axe head, nettle, herbs, sinews
            71: 2, 83: 2, 94: 2, 98: 2, 101: 2, 122: 2, 130: 2, 139: 2, 152: 2, 158: 2 };   // potato, bread, raw hare, fish, game, rot, stew, apples, bandage, roast deer
        const wrong = Object.entries(expect).filter(([id, k]) => where(+id) !== k).map(([id, k]) => ({ id: +id, expected: k, got: where(+id) }));
        check("tools and weapons, materials and food each in their own kind", wrong.length === 0, wrong);
        const potion = await ev("$dataItems.findIndex(i => i && i.name === 'Mikstura')");
        check("...the database's potions at the end of 'Jedzenie' (the game's food first)", t2.ids.indexOf(potion) > t2.ids.indexOf(83) && t2.ids[0] !== potion, { first: t2.ids[0], potionAt: t2.ids.indexOf(potion) });
        await key(TAB); await frames(4);
        check("Tab on 'Jedzenie' wraps round to 'Narzędzia i broń'", (await tabNow()).kind === 0);
        await key(LB); await frames(4);
        check("[ goes back (wrapping to 'Jedzenie')", (await tabNow()).kind === 2);
        await key(RB); await frames(4);
        check("] goes forward ('Narzędzia i broń')", (await tabNow()).kind === 0);
        await key(DOWN); await key(DOWN); await frames(4);
        await key(TAB); await key(DOWN); await frames(4);
        await key(LB); await frames(4);
        check("each kind remembers its row ('Narzędzia i broń' back on row 2)", (await tabNow()).index === 2);
        await key(RB); await frames(4);
        check("...and 'Surowce' on row 1", (await tabNow()).index === 1);
        await click("_kinds", 2); await frames(4);
        check("a click on 'Jedzenie' shows the food", (await tabNow()).kind === 2);
        await b.shot("debug_kinds.png");
        await click("_kinds", 0); await frames(4);
        // ---------------------------------------------------------------- 'Rdzeń': the core's own lines (TawernaCore.js)
        await key(E); await frames(6);
        const core = await J("(function(){ const s = SceneManager._scene, l = s._list; return { tab: s._tab, sel: s._tabs.index(), band: s._kinds.visible, kinds: [...new Set(l._rows.map(r => r.kind))], rows: l._rows.map(r => r.label), wide: l._rows.filter(r => l.textWidth(r.label) > l.innerWidth).length }; })()");
        check("E: 'Rdzeń' - Tawerna.debug.lines(): the time a frame, the saved states, every map updater with its ms, the id ranges and their owners, the bus (text rows that fit, no band of kinds)",
            core.tab === 3 && core.sel === 3 && !core.band && core.kinds.join() === "info" && /^Tawerna \d.* ms$/.test(core.rows[0]) && /Stany: [^]*homeDecor v1\/1[^]*Zegary mapy:/.test(core.rows.join("\n")) &&
            core.rows.some(r => /^ +HomeDecor\.refresh: [\d.]+ ms \(co 30\)$/.test(r)) && core.rows.some(r => /^ +980-998 HomeDecor/.test(r)) && core.rows.some(r => /^ +1000-1999 Forestry/.test(r)) &&
            core.rows.some(r => /^Szyna: /.test(r)) && core.wide === 0, core);
        const bagNow = () => J("$gameParty.allItems().map(i => i.id + ':' + $gameParty.numItems(i)).join()");
        const bag0 = await bagNow();
        await key(DOWN); await key(OK); await frames(6);
        check("...only to read: OK there reads the lines again (nothing given, the menu stays on 'Rdzeń')", (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug" && (await ev("SceneManager._scene._tab")) === 3 && (await bagNow()) === bag0);
        // ---------------------------------------------------------------- 'Kot': grandpa's cat (HomeLife.js) - away from the house only the way there
        await key(E); await frames(6);
        const away = await J("(function(){ const l = SceneManager._scene._list; return { tab: SceneManager._scene._tab, rows: l._rows.map(r => r.kind + ':' + r.label) }; })()");
        check("E: 'Kot' - away from grandpa's house: it is not here, 'Zabierz mnie do domu dziadka', and its day described",
            away.tab === 4 && away.rows.some(r => r === "catHouse:Zabierz mnie do domu dziadka") && away.rows.some(r => /^info:Jego dzień/.test(r)) && away.rows.some(r => /W nocy \(22-6\)/.test(r)), away);
        // ---------------------------------------------------------------- 'Wyspa i fabuła': the island places and the story (2026-10-16)
        await key(E); await frames(6);
        const isle = await J(`(function(){ const s = SceneManager._scene, l = s._list; return { tab: s._tab, sel: s._tabs.index(), band: s._kinds.visible, h: l.itemHeight(),
            rows: l._rows.map(r => ({ kind: r.kind, label: r.label, desc: r.desc || "", head: !!r.head })), wide: l._rows.filter(r => l.textWidth(r.label) > l.innerWidth).length,
            okolice: window.Okolice && Okolice.f9 ? Okolice.f9.sections().map(s => [s.title, s.rows.length]) : [] }; })()`);
        // (2026-10-21) the new terrain's packages put their own sections in (Okolice.f9, docs/rozszerzenia/PLAN.md): left out of the fixed lists below
        const okTitles = isle.okolice.map(s => s[0]);
        const isleKinds = isle.rows.filter(r => r.kind !== "info").map(r => r.kind);
        const goNames = isle.rows.filter(r => r.kind === "isleGo").map(r => r.label);
        check("E: 'Wyspa i fabuła' - its parts (Przenieś mnie do / Morze i pogoda / Fabuła / Postacie / Biały orzeł - Orzel.js / Podróżni z promu - Podroznicy.js, 2026-10-28 / Wątek W15, Wątek W16 - łańcuchy podróżnych, 2026-10-29 / Wątek W4 / Wątek W5 / Wątek W7 / Wątek W9 / Wątek W10 - Przystan.js), each row two lines high with its description under it",
            isle.tab === 5 && isle.sel === 5 && !isle.band && isle.rows.filter(r => r.head && !okTitles.includes(r.label)).map(r => r.label).join("|") === "Przenieś mnie do:|Morze i pogoda:|Fabuła:|Postacie:|Biały orzeł:|Podróżni z promu:|Wątek W15 (Święte kości):|Wątek W16 (Dezerter):|Wątek W4 (Borgar, krew kasztelana):|Wątek W5 (kantor Baltazara):|Wątek W7 (dwór Lorda):|Wątek W9 (rywal w ruinach):|Wątek W10 (list do matki):" &&
            isle.rows.filter(r => r.kind !== "info").every(r => r.desc.length > 20) && isle.h > 50 && isle.wide === 0, isle.rows.map(r => r.kind + ": " + r.label));
        check("...'Przenieś mnie do': the harbour, the six places, the hut under the forest, the burnt farm; a room picker",
            goNames.join("|") === "Przystań|Pustelnia na klifie|Urwisko Kruków|Przylądek z latarnią|Garnizon nad zatoką|Wrak na mieliźnie|Stara cysterna zakonu|Chata pod lasem|Spalona zagroda" &&
            isleKinds.includes("isleInside"), goNames);
        check("...the sea (low tide, high tide, a misty night, the water red / grey), the story (day 61 unpaid, pay the debt, +1000 G, the prologue, the texts read again - 2026-10-23), the people (the raven, the garrison's favour, the cistern), W5's chapters, W7's chapters, W9's rival (2026-10-17), the white eagle's eight rows (2026-10-18: the egg, the egg ready on the ridge, the stage, the bond, mount, land, the theft, to the ridge), the ferry's travellers' seven (2026-10-28: the next ferry, a traveller now, everyone off, the book cleared, renown, the seed, the landing scene), W15's and W16's chapters (2026-10-29)",
            isleKinds.filter(k => k !== "isleGo" && k !== "isleOkolice").join() === "isleInside,isleTide,isleTide,isleFog,isleWater,isleLose,islePay,isleGold,isleXp,islePrologue,isleTexts,isleRaven,isleFavor,isleCistern,isleEagle,isleEagle,isleEagle,isleEagle,isleEagle,isleEagle,isleEagle,isleEagle,isleWatek:prom,isleWatek:przyplyn,isleWatek:odplyw,isleWatek:wyczysc,isleWatek:renoma,isleWatek:ziarno,isleWatek:scena,isleW15,isleW16,isleW4,isleW5,isleW7,isleW9,isleW9Meet,isleW10" &&
            /^Przychylność garnizonu: \d+ \/ 100/.test(isle.rows.find(r => r.kind === "isleFavor").label), isleKinds);
        check("...the new terrain's sections (Okolice.f9, 2026-10-21): each one a header with its rows (isleOkolice), the core's first",
            isle.okolice.length >= 1 && isle.okolice[0][0] === "Nowy teren (pakiet 0: Okolice):" && isle.okolice.every(([title, n]) => {
                const i = isle.rows.findIndex(r => r.head && r.label === title);
                return i >= 0 && isle.rows.slice(i + 1, i + 1 + n).every(r => r.kind === "isleOkolice"); }), isle.okolice);
        await key(E); await frames(6);
        const tz = await tabNow();
        check("E on the last tab wraps round to 'Zdarzenia' (the band of kinds hidden, the list back up)", tz.tab === 0 && !tz.band && tz.listY < t0.listY, { tab: tz.tab, band: tz.band, listY: tz.listY });
        await key(TAB); await frames(4);
        check("Tab does nothing on 'Zdarzenia'", (await tabNow()).tab === 0);
        await click("_tabs", 1); await frames(4);
        check("a click on a tab opens it ('Budowanie')", (await tabNow()).tab === 1);
        await click("_tabs", 0); await frames(4);
        await key(Q); await frames(6);
        check("Q goes back (wrapping to 'Wyspa i fabuła')", (await tabNow()).tab === 5);
        await key(Q); await key(Q); await key(Q); await key(Q); await key(Q); await frames(6);
        check("Q five times: back on 'Zdarzenia'", (await tabNow()).tab === 0);

        // ---------------------------------------------------------------- +1 hour / +1 day (set to noon, day 1: no hour rollover to worry about)
        await ev("$gameSystem.setDayNightHour(12); $gameSystem._dayNightDay = 1; 0");
        const before = await J("({ h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay() })");
        await key(OK);   // row 0 is already selected: "+1 godzina"
        await frames(6);
        const afterHour = await J("({ h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay() })");
        check("'+1 godzina' advances the clock by about one hour", afterHour.d === before.d && afterHour.h - before.h > 0.9 && afterHour.h - before.h < 1.1, { before, afterHour });
        check("the menu stays open after granting (so you can do several in a row)", (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        await key(DOWN);
        await key(OK);   // row 1: "+1 dzień"
        await frames(6);
        const afterDay = await J("({ h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay() })");
        check("'+1 dzień' advances the clock by 24 hours (a whole day later)", afterDay.d === afterHour.d + 1 && Math.abs(afterDay.h - afterHour.h) < 0.1, { afterHour, afterDay });

        // ---------------------------------------------------------------- pick an item, raise the quantity, grant it
        await key(Q); await key(Q); await key(Q); await key(Q); await frames(6);   // 'Przedmioty' (past 'Wyspa i fabuła', 'Kot' and 'Rdzeń'), on its first item
        const firstItemId = await ev("SceneManager._scene._list.rowData().item.id");
        const before139 = await ev(`$gameParty.numItems($dataItems[${firstItemId}])`);
        for (let i = 0; i < 4; i++) await key(RIGHT);
        const qty = await ev("SceneManager._scene._list.rowData().qty");
        check("→ four times raised the quantity to 5", qty === 5, qty);
        await key(LEFT);
        const qty2 = await ev("SceneManager._scene._list.rowData().qty");
        check("← lowers it back by one", qty2 === 4, qty2);
        await key(OK);
        await frames(6);
        const after139 = await ev(`$gameParty.numItems($dataItems[${firstItemId}])`);
        check("OK grants exactly that many of the highlighted item", after139 === before139 + 4, { before139, after139 });

        // ---------------------------------------------------------------- "Burza teraz": back to the map, the storm gathering
        await key(E); await key(E); await key(E); await key(E); await frames(6);   // back to 'Zdarzenia' (past 'Rdzeń', 'Kot' and 'Wyspa i fabuła'): its cursor is where it was left (row 1, '+1 dzień')
        check("each tab remembers its row: 'Zdarzenia' is back on '+1 dzień'", (await tabNow()).tab === 0 && (await ev("SceneManager._scene._list.rowData().kind")) === "day");
        for (let i = 0; i < 4; i++) await key(DOWN);   // row 5 (past the dawn, the sunset and the misty morning)
        check("row 5 is 'Burza teraz'", (await ev("SceneManager._scene._list.rowData().kind")) === "storm");
        await key(OK);
        await frames(20);
        check("'Burza teraz' goes back to the map and a storm gathers", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map" && (await ev("Storm.level()")) > 0 && (await ev("Storm.phase()")) === "gather");
        await key(F9); await frames(10);
        check("F9 opens again on the tab and row it was left on ('Zdarzenia', 'Burza teraz')", (await tabNow()).tab === 0 && (await ev("SceneManager._scene._list.rowData().kind")) === "storm");
        for (let i = 0; i < 3; i++) await key(DOWN);   // row 8: calm
        await key(OK);
        await frames(20);
        check("'Koniec pogody na dziś' ends it", (await ev("Storm.level()")) === 0);
        // ---------------------------------------------------------------- "Postaw: Cegielnia": the placer, free, the building finished at once
        await key(F9); await frames(10);
        const bagBefore = await J("({ stone: $gameParty.numItems($dataItems[Farming.ITEM.stone]), planks: $gameParty.numItems($dataItems[Farming.ITEM.planks]), stamina: Math.round($gameSystem.stamina()) })");
        await key(E); await frames(6);   // 'Budowanie'
        await ev("(function(){ const l = SceneManager._scene._list; l.select(l._rows.findIndex(r => r.type === 'brickworks')); })(); 0");
        await key(OK);
        for (let i = 0; i < 40 && !(await ev("!!$gameTemp._buildMode")); i++) await frames(5);
        const mode = await J("($gameTemp._buildMode ? { type: $gameTemp._buildMode.type, free: $gameTemp._buildMode.free, text: SceneManager._scene._farmHelp._text || '' } : null)");
        check("'Postaw: Cegielnia' goes back to the map in the placer, free (help: 'F9: za darmo')", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map" && mode && mode.type === "brickworks" && mode.free === true && /za darmo/.test(mode.text), mode);
        // a spot near the player where it can stand (uncleared grass is fine for the F9 placer)
        const spot = await J(`(function(){ const p = $gamePlayer; for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const x = p.x + dx, y = p.y + dy; if (!Farming.plotAt(x, y) && Farming.whyNotBuild("brickworks", x, y, false, true) === null && Farming.whyNotBuild("brickworks", x, y, false) !== null) return { x, y }; } return null; })()`);
        check("found a spot of uncleared ground where only the F9 placer may build", !!spot, spot);
        await ev(`(function(){ const m = $gameTemp._buildMode; m.x = ${spot.x}; m.y = ${spot.y}; })(); 0`);
        await frames(4);
        await key(OK);
        await frames(20);
        const put = await J(`(function(){ const b = Farming.buildingAt(${spot.x}, ${spot.y}); return b ? { type: b.type, site: !!b.site, v: b.v } : null; })()`);
        const bagAfter = await J("({ stone: $gameParty.numItems($dataItems[Farming.ITEM.stone]), planks: $gameParty.numItems($dataItems[Farming.ITEM.planks]), stamina: Math.round($gameSystem.stamina()) })");
        check("OK puts the brickworks down finished (no site), the placer closes", put && put.type === "brickworks" && !put.site && put.v === 3 && !(await ev("!!$gameTemp._buildMode")), put);
        check("...without taking materials or strength", JSON.stringify(bagBefore) === JSON.stringify(bagAfter), { bagBefore, bagAfter });
        check("...and its menu works at once (the brick recipe)", (await J(`Farming.menuFor(${spot.x}, ${spot.y}).entries.map(e => e.name)`)).includes("Wypal cegły"));
        // the F9 placer still refuses water, a tree, another building
        check("not on top of another building", /stoi/.test(await ev(`Farming.whyNotBuild("brickworks", ${spot.x}, ${spot.y}, false, true)`) || ""));
        // a yard put down free: finished, the animals come
        const yardSpot = await J(`(function(){ for (let y = 8; y < $gameMap.height() - 2; y++) for (let x = 2; x < $gameMap.width() - 8; x++) if (Farming.whyNotBuild("coop", x, y, false, true) === null) return { x, y }; return null; })()`);
        await ev(`$gamePlayer.locate(${yardSpot.x} + 2, ${yardSpot.y} + 1); Farming.placeFree("coop", ${yardSpot.x}, ${yardSpot.y}, false); 0`);
        await frames(60);
        const hens = await ev("Livestock.animals.filter(a => a._kind === 'hen').length");
        check("a coop put down free stands finished and gets its hens", (await ev(`!Farming.buildingAt(${yardSpot.x}, ${yardSpot.y}).site`)) && hens > 0, { yardSpot, hens, all: await ev("Livestock.animals.length") });
        await key(F9); await frames(10);   // open again for the closing checks
        check("after putting a building down, F9 opens on 'Budowanie' with the same building chosen (to put another)", (await tabNow()).tab === 1 && (await ev("SceneManager._scene._list.rowData().type")) === "brickworks");

        // ---------------------------------------------------------------- 'Wyspa i fabuła' at work (2026-10-16)
        // (a place's first visit may start a scene of its own - its lines dismissed, then F9 opens)
        const openF9 = async () => {
            for (let tries = 0; tries < 4; tries++) {
                await frames(30);
                for (let i = 0; i < 80 && (await ev("$gameMap.isEventRunning() || $gameMessage.isBusy() || SceneManager.isSceneChanging()")); i++) { await ev("if ($gameMessage.isBusy()) $gameMessage.clear(); 0"); await frames(8); }
                await key(F9); await frames(10);
                if (await ev("SceneManager._scene.constructor.name === 'Scene_Debug'")) return true;
                console.log("NOTE F9 not open yet: " + JSON.stringify(await J("({ s: SceneManager._scene.constructor.name, ev: $gameMap.isEventRunning(), m: $gameMessage.isBusy(), farm: !!$gameTemp._farmMenuOpen, b: !!$gameTemp._buildMode })")));
            }
            return false;
        };
        const isleSel = kind => ev(`(function(){ const l = SceneManager._scene._list; l.select(l._rows.findIndex(r => ${typeof kind === "string" ? "r.kind === '" + kind + "'" : "r.kind === '" + kind[0] + "' && r.label === '" + kind[1] + "'"})); return l.index(); })()`);
        const isleRow = kind => J(`(function(){ const r = SceneManager._scene._list._rows.find(r => r.kind === '${kind}'); return r ? r.label : null; })()`);
        await ev("SceneManager._scene.goTo(5, 0); 0"); await frames(6);
        const g0 = await ev("$gameParty.gold()");
        await isleSel("isleGold"); await key(OK); await frames(6);
        check("'+1000 G': a thousand gold, the menu stays", (await ev("$gameParty.gold()")) === g0 + 1000 && (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        const lv0 = await ev("Combat.hero().level");
        await isleSel("isleXp"); await key(OK); await frames(6);
        check("'+10 000 doswiadczenia': levels come at once, the menu stays", (await ev("Combat.hero().level")) > lv0 && (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug", [lv0, await ev("Combat.hero().level")]);
        await isleSel("isleFavor");
        const fav0 = await ev("Garnizon.favor()");
        await key(RIGHT); await frames(4);
        const fav1 = await ev("Garnizon.favor()"), favLab = await isleRow("isleFavor");
        await key(LEFT); await frames(4);
        check("'Przychylność garnizonu': → +20, ← -20, the number in the label", fav1 === Math.min(100, fav0 + 20) && favLab.indexOf(": " + fav1 + " / 100") > 0 && (await ev("Garnizon.favor()")) === Math.max(0, fav1 - 20), { fav0, fav1, favLab });
        await isleSel("isleWater");
        const water = [];
        for (let i = 0; i < 3; i++) { await key(OK); await frames(4); water.push([await ev("CzerwonaWoda.forced()"), await isleRow("isleWater")]); }
        check("'Woda w morzu': OK - red, grey, back to the weather (CzerwonaWoda.force), the label says which",
            water[0][0] === "red" && /czerwona \(wymuszona\)/.test(water[0][1]) && water[1][0] === "grey" && /szara \(wymuszona\)/.test(water[1][1]) && water[2][0] === null && /z pogody/.test(water[2][1]), water);
        await isleSel(["isleTide", (await J("SceneManager._scene._list._rows.find(r => r.kind === 'isleTide' && r.tide === 'high').label"))]);
        await key(OK); await frames(70);
        const hi = await J("({ f: Wyspa.tideForced(), low: Wyspa.tide().low, sw: $gameSwitches.value(20) })");
        await ev("(function(){ const l = SceneManager._scene._list; l.select(l._rows.findIndex(r => r.kind === 'isleTide' && r.tide === 'low')); return 0; })()");
        await key(OK); await frames(70);
        const lo = await J("({ f: Wyspa.tideForced(), low: Wyspa.tide().low, sw: $gameSwitches.value(20), label: SceneManager._scene._list.rowData().label })");
        await key(OK); await frames(6);
        check("'Przypływ teraz' / 'Odpływ teraz': the tide forced (switch 20 follows), OK again - from the clock",
            hi.f === "high" && !hi.low && hi.sw === false && lo.f === "low" && lo.low && lo.sw === true && /wymuszony/.test(lo.label) && (await ev("Wyspa.tideForced()")) === null, { hi, lo });
        await isleSel("isleCistern"); await key(OK); await frames(6);
        check("'Otwórz cysternę': cisternOpen (and the rest of W1 ch. 7's flags), the label says so",
            (await J("['cisternOpen','sluiceHalf','millRuns','kubaHonest'].every(k => !!TownQuests.state().flags[k])")) && /^Cysterna otwarta/.test(await isleRow("isleCistern")));
        // (2026-10-23) the texts' files read again (Watki.przeladuj): the label says how many, a notice waits for the map
        await ev("$gameTemp._topNotices = []; 0");
        await isleSel("isleTexts"); await key(OK);
        let texts = null;
        for (let i = 0; i < 40 && !(texts = await J("(function(){ const r = Watki.ostatnieWczytanie(); return r ? r : null; })()")); i++) await frames(5);
        await frames(4);
        const textsLab = await isleRow("isleTexts"), textsTop = await J("($gameTemp._topNotices || []).map(n => n.text || n)");
        check("'Wczytaj teksty od nowa': every file of js/teksty read again - the label 'Teksty wczytane od nowa: N plik...', the same notice for the map, the menu stays",
            !!texts && !texts.bad && texts.n === texts.files && texts.n >= 1 && /Teksty wczytane od nowa: \d+ plik/.test(textsLab) && textsTop.some(t => /Teksty wczytane od nowa/.test(JSON.stringify(t))) &&
            (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug", { texts, textsLab, textsTop });
        await isleSel("isleLose"); await key(OK); await frames(6);
        check("'Świt dnia 61 bez spłaty' in a game without the story: nothing (the label says why), the menu stays",
            /gra bez fabuły/.test(await isleRow("isleLose")) && (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug" && (await ev("$gameSystem.dayNightDay()")) < 61);
        // go: the hermitage (the landing of the harbour's way up), then the wreck (the low tide set)
        await isleSel(["isleGo", "Pustelnia na klifie"]); await key(OK);
        for (let i = 0; i < 60 && !(await ev("$gameMap.mapId() === 155 && SceneManager._scene.constructor.name === 'Scene_Map' && !$gamePlayer.isTransferring()")); i++) await frames(10);
        const at155 = await J("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y]");
        check("'Pustelnia na klifie': back on the map, on Map155 (24,70) - the landing of the harbour's way up (the map doubled 2026-10-18)", at155.join() === "155,24,70", at155);
        await openF9();
        check("F9 opens again on 'Wyspa i fabuła', on the same row", (await tabNow()).tab === 5 && (await ev("SceneManager._scene._list.rowData().label")) === "Pustelnia na klifie");
        await isleSel(["isleGo", "Wrak na mieliźnie"]); await key(OK);
        for (let i = 0; i < 60 && !(await ev("$gameMap.mapId() === 165 && SceneManager._scene.constructor.name === 'Scene_Map' && !$gamePlayer.isTransferring()")); i++) await frames(10);
        await frames(70);
        const at165 = await J("({ at: [$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y], tide: Wyspa.tideForced(), sw: $gameSwitches.value(20) })");
        check("'Wrak na mieliźnie': Map165 (78,20) with the low tide set (the sandbar dry, switch 20 on)", at165.at.join() === "165,78,20" && at165.tide === "low" && at165.sw === true, at165);
        await ev("Wyspa.forceTide(null); 0");
        // the prologue again: the film over the map, then back - the same map, the same tile, the same purse
        await openF9();
        const before165 = await J("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, g: $gameParty.gold(), d: $gameSystem.dayNightDay() })");
        await isleSel("islePrologue"); await key(OK);
        let film = false;
        for (let i = 0; i < 60 && !(film = await ev("SceneManager._scene.constructor.name === 'Scene_Prologue'")); i++) await frames(10);
        await frames(60);
        await ev("SceneManager._scene.skipAll(); 0");
        for (let i = 0; i < 80 && !(await ev("SceneManager._scene.constructor.name === 'Scene_Map' && !SceneManager.isSceneChanging()")); i++) await frames(10);
        await frames(20);
        const after165 = await J("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, g: $gameParty.gold(), d: $gameSystem.dayNightDay(), scene: SceneManager._scene.constructor.name, stack: SceneManager._stack.length })");
        check("'Odtwórz prolog': the film plays (Scene_Prologue), then back on the same map and tile, nothing else changed",
            film && after165.scene === "Scene_Map" && after165.m === before165.m && after165.x === before165.x && after165.y === before165.y && after165.g === before165.g && after165.d === before165.d && after165.stack === 0, { before165, after165 });
        // the raven tamed at once: its name screen, an empty field - "Kruk"
        await openF9();
        await isleSel("isleRaven"); await key(OK);
        let named = false;
        for (let i = 0; i < 120 && !(named = await ev("!!(SceneManager._scene && SceneManager._scene.done && SceneManager._scene.constructor !== Scene_Map && Kruk.state().stage === 'tame')")); i++) {
            await ev("if ($gameMessage.isBusy()) $gameMessage.clear(); 0");   // (the hero's lines before the name screen)
            await frames(10);
        }
        if (named) await ev("SceneManager._scene.done(); 0");
        for (let i = 0; i < 60 && !(await ev("SceneManager._scene.constructor.name === 'Scene_Map' && !SceneManager.isSceneChanging()")); i++) await frames(10);
        await frames(20);
        const raven = await J("({ stage: Kruk.state().stage, name: Kruk.state().name, tame: !!TownQuests.state().flags.krukTame, ring: $gameParty.numItems($dataItems[179]) })");
        check("'Oswojony kruk od razu': back on the map, the name screen (empty field: 'Kruk'), tame, the ring, flag krukTame",
            named && raven.stage === "tame" && raven.name === "Kruk" && raven.tame && raven.ring === 1, { named, raven });

        // ---------------------------------------------------------------- closing
        await openF9();
        await key(ESC);
        await frames(10);
        check("Esc closes the menu, back on the map", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map");
        await openF9();
        check("F9 opens it again", (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        await key(F9);
        await frames(10);
        check("F9 a second time closes it too", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map");
    } catch (e) { console.log("ERR", e.message); results.push(false); }
    const err = b.logs.filter(l => /EXC|rror/.test(l));
    console.log("console errors:", err.length ? err.slice(-6) : "none");
    console.log(results.filter(Boolean).length + "/" + results.length + " passed");
    await b.close();
    process.exit(0);
})();
