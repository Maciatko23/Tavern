// The F9 developer menu in six tabs (Q / E switch them), the layout of 2026-11-11: Szybkie (time, gold, experience, the texts read again, the
// ten places to go to, the rooms), Pogoda i morze (the weather, one tide row, the sea's water, the storm's end, birds and butterflies),
// Walka i zwierzęta (beasts, men, the ruins' creatures, the hunts of package B, weapons), Budowanie (any building put down free and
// finished), Przedmioty (any item in a chosen quantity, three kinds switched by Tab or [ / ] or a click; the clothes' section on top of the
// first), Fabuła i postacie (the debt, the prologue, the underground, Act III, the threads' chapters, the people, the cat, the packages);
// it opens again on the tab, the kind and the row it was left on. The rows other plugins give are routed by Debug.js (ROUTE): no row twice.
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
        const NAMES = ["Szybkie", "Pogoda i morze", "Walka i zwierzęta", "Budowanie", "Przedmioty", "Fabuła i postacie"];
        const tabNow = () => J("({ tab: SceneManager._scene._tab, sel: SceneManager._scene._tabs.index(), kinds: [...new Set(SceneManager._scene._list._rows.map(r => r.kind))], n: SceneManager._scene._list._rows.length, index: SceneManager._scene._list.index(), help: SceneManager._scene._help.contents ? 1 : 0, kind: SceneManager._scene._kinds.index(), band: SceneManager._scene._kinds.visible, groups: [...new Set(SceneManager._scene._list._rows.map(r => r.group))], listY: SceneManager._scene._list.y, ids: SceneManager._scene._list._rows.map(r => r.item ? r.item.id : 0) })");
        // a click at the middle of item i of a band (the tab band or the kinds band)
        const click = async (win, i) => {
            await ev(`(function(){ const w = SceneManager._scene.${win}, r = w.itemRect(${i}); const p = w.worldTransform.apply(new Point(w.padding + r.x + r.width / 2, w.padding + r.y + r.height / 2)); TouchInput._onTrigger(p.x, p.y); window.__click = p; })(); 0`);
            await frames(3);
            await ev("TouchInput._onRelease(window.__click.x, window.__click.y); 0");
            await frames(4);
        };
        // go to a tab by its name (no key presses) and read it; the rows of every tab in one go
        const goTab = async (name, kind = 0) => { await ev(`(function(){ const s = SceneManager._scene; s.goTo(s._tabs._list.findIndex(c => c.name === ${JSON.stringify(name)}), ${kind}); return 0; })()`); await frames(4); };
        const rowsOf = () => J("SceneManager._scene._list._rows.map(r => ({ kind: r.kind, label: r.label, desc: r.desc || '', head: !!r.head, sec: r.sec || '', watek: r.watek || '', owner: r.owner || '', what: r.what || '' }))");
        const everyRow = async () => {   // (every tab, the item tab's three kinds too)
            const all = [];
            for (let i = 0; i < 6; i++) for (const k of (i === 4 ? [0, 1, 2] : [0])) { await goTab(NAMES[i], k); for (const r of await rowsOf()) all.push(Object.assign({ tab: i }, r)); }
            return all;
        };
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
        const selKind = kind => ev(`(function(){ const l = SceneManager._scene._list; const i = l._rows.findIndex(r => r.kind === ${JSON.stringify(kind)}); l.select(i); return i; })()`);
        const selLabel = (kind, label) => ev(`(function(){ const l = SceneManager._scene._list; const i = l._rows.findIndex(r => r.kind === ${JSON.stringify(kind)} && r.label === ${JSON.stringify(label)}); l.select(i); return i; })()`);
        const rowLabel = kind => J(`(function(){ const r = SceneManager._scene._list._rows.find(r => r.kind === ${JSON.stringify(kind)}); return r ? r.label : null; })()`);

        check("F9 is bound to 'debugmenu'", (await ev("Input.keyMapper[120]")) === "debugmenu");
        check("the core's own lines are still there for the tests (Tawerna.debug.lines()), only the tab is gone", (await ev("typeof Tawerna.debug.lines()[0]")) === "string");

        // ---------------------------------------------------------------- open it: six tabs in the user's order
        await key(F9);
        await frames(10);
        check("F9 opens Scene_Debug", (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        check("six tabs, in order: Szybkie, Pogoda i morze, Walka i zwierzęta, Budowanie, Przedmioty, Fabuła i postacie - no Rdzeń, no Kot",
            JSON.stringify(await J("SceneManager._scene._tabs._list.map(c => c.name)")) === JSON.stringify(NAMES), await J("SceneManager._scene._tabs._list.map(c => c.name)"));
        let t = await tabNow();
        let rows = await rowsOf();
        const heads0 = rows.filter(r => r.head).map(r => r.label);
        check("it opens on 'Szybkie': the sections 'Czas, gracz i teksty:', 'Przenieś mnie do:', 'Podgląd:' (headers, then rows)",
            t.tab === 0 && t.sel === 0 && heads0.join("|") === "Czas, gracz i teksty:|Przenieś mnie do:|Podgląd:", { tab: t.tab, heads0 });
        const q = rows.filter(r => !r.head).map(r => r.kind);
        check("...the clock (switch for full stats, +1 hour, +1 day, dawn, sunset, the season), +1000 G, +200 and +10 000 experience, the texts read again; then ten places and the rooms; the map sketch and the regions' layers - nothing else",
            q.join() === "pelne,hour,day,dawn,dusk,season,isleGold,xp,isleXp,isleTexts,isleGo,isleGo,isleGo,isleGo,isleGo,isleGo,isleGo,isleGo,isleGo,isleGo,isleInside,isleMapa,layers", q);
        check("...'+1000 G' once (with its line under it), the rows with a line under them are two lines high", rows.filter(r => /^\+1000 G/.test(r.label)).length === 1 && rows.find(r => r.kind === "isleGold").desc.length > 10 && (await J("SceneManager._scene._list.itemHeight()")) > 50);
        const tele = rows.filter(r => r.kind === "isleGo").map(r => r.label);
        check("...'Przenieś mnie do:' - Kruczogród, Kruczy Jar - działka dziadka, Dom dziadka, Łąka pod Gawrą, Posiadłość Lorda, Góry i kamieniołom, Podgrodzie, Garnizon nad zatoką, Przystań, Tawerna - sala",
            tele.join("|") === "Kruczogród|Kruczy Jar - działka dziadka|Dom dziadka|Łąka pod Gawrą|Posiadłość Lorda|Góry i kamieniołom|Podgrodzie|Garnizon nad zatoką|Przystań|Tawerna - sala", tele);
        const inside = await J("(function(){ const l = SceneManager._scene._list; const r = l._rows.find(r => r.kind === 'isleInside'); const seen = []; l.select(l._rows.indexOf(r)); for (let i = 0; i < 12; i++) { seen.push(l._rows[l.index()].label); l.changeQty(1); } return [...new Set(seen)]; })()");
        check("...'Wnętrze: ...' ←→ goes through the rooms one can still enter (no scriptorium, wreck hold or burnt farm's house)",
            inside.length === 8 && inside.every(l => /^Wnętrze: /.test(l)) && !inside.some(l => /Skryptorium|Wrak|Dom Ługów/.test(l)) && inside.some(l => /Dwór - hol/.test(l)), inside);
        // the switch "Statystyki zawsze pełne" (2026-11-07): on - what fell is full again on the map; off again
        const pelneAt = async () => { await selKind("pelne"); };
        await pelneAt();
        const sw0 = await rowLabel("pelne");
        await ev("(function(){ const s = SceneManager._scene; s.onOk(); return 0; })()");
        const sw1 = await rowLabel("pelne");
        await ev("SceneManager._scene.popScene(); 0");
        for (let i = 0; i < 60 && !(await ev("SceneManager._scene.constructor === Scene_Map && !SceneManager.isSceneChanging()")); i++) await frames(5);
        await ev("$gameParty.leader().setHp(10); $gameSystem.setStamina(5); Needs.state().food = 20; Needs.state().water = 20; 0");
        await frames(10);
        const full = await J("({ hp: $gameParty.leader().hp === $gameParty.leader().mhp, st: $gameSystem.stamina() === $gameSystem.maxStamina(), food: Needs.state().food, water: Needs.state().water })");
        await key(F9); await frames(10);
        await pelneAt();
        await ev("(function(){ SceneManager._scene.onOk(); return 0; })()");
        const sw2 = await rowLabel("pelne");
        check("the switch 'Statystyki zawsze pełne': on - life, strength, food and water full again on the map; off again", /WYŁ/.test(sw0) && /WŁ\./.test(sw1) && !/WYŁ/.test(sw1)
            && full.hp && full.st && full.food === 100 && full.water === 100 && /WYŁ/.test(sw2), { sw0, sw1, sw2, full });

        // ---------------------------------------------------------------- the other tabs by E
        await key(E); await frames(6);
        t = await tabNow(); rows = await rowsOf();
        const heads1 = rows.filter(r => r.head).map(r => r.label), k1 = rows.filter(r => !r.head).map(r => r.kind);
        check("E: 'Pogoda i morze' - 'Pogoda:' (mist, storm, a strike, a strike on a tree, calm, the rain / heat / snow of package A, today's weather), 'Morze:' (the tide, the water, the storm's end, the misty night), 'Ptaki i motyle:'",
            t.tab === 1 && t.sel === 1 && heads1.join("|") === "Pogoda:|Morze:|Ptaki i motyle:" &&
            k1.join() === "mist,storm,strike,treestrike,calm,isleOkolice,isleOkolice,isleOkolice,isleOkolice,isleTide,isleWater,isleStorm,isleFog,birds,raid,motyle,cmy,siatka" &&
            rows.filter(r => r.kind === "isleOkolice").map(r => r.what).join() === "rain,hot,snow,weather", { heads1, k1 });
        await key(E); await frames(6);
        t = await tabNow(); rows = await rowsOf();
        const heads2 = rows.filter(r => r.head).map(r => r.label), k2 = rows.filter(r => !r.head).map(r => r.kind);
        check("E: 'Walka i zwierzęta' - beasts (boar, wolves, deer, bear), men (7 rows), beasts against men (3), the ruins' creature and boss, package B's hunts that stay on the world's maps (5 rows), weapons (all, the set for a level)",
            t.tab === 2 && heads2.join("|") === "Zwierzęta:|Ludzie-wrogowie:|Zwierzęta kontra ludzie:|Ruiny i podziemia:|Łowy (paczka B):|Bronie i zbroje:" &&
            k2.slice(0, 17).join() === "boar,wolves,deer,bear,h_bandit,h_knifer,h_archer,h_mercenary,h_ambush,h_camp,h_raid,st_camp,st_boar,st_bear,cr_kind,cr_boss,isleOkolice" &&
            rows.filter(r => r.sec === "lowy" && !r.head).length === 9 && rows.filter(r => r.sec === "bron" && !r.head).map(r => r.what).join() === "all,set", { heads2, n: rows.length, k2: k2.slice(0, 17).join(), lowy: rows.filter(r => r.sec === "lowy").length, bron: rows.filter(r => r.sec === "bron").map(r => r.what) });
        // ---------------------------------------------------------------- 'Budowanie'
        await key(E); await frames(6);
        t = await tabNow();
        const builds = await J(`SceneManager._scene._list._rows.map(r => ({ kind: r.kind, type: r.type, label: r.label, icon: r.icon }))`);
        const nTypes = await ev("Object.keys(Farming.BUILDINGS).length");
        check("E: 'Budowanie' - one 'Postaw: ...' row for every building of Farming.js, each with an icon, and only those (unchanged)", t.tab === 3 && t.sel === 3 && builds.length === nTypes && builds.every(r => r.kind === "build" && /^Postaw: /.test(r.label) && r.icon > 0) && builds.some(r => r.label === "Postaw: Cegielnia"), { tab: t.tab, n: builds.length, nTypes, first: builds[0] });
        await key(E); await frames(6);
        t = await tabNow();
        const t0 = t;
        check("E: 'Przedmioty' - a second band of kinds: Narzędzia i broń, Surowce, Jedzenie", t.tab === 4 && t.sel === 4 && t.band && JSON.stringify(await J("SceneManager._scene._kinds._list.map(c => c.name)")) === '["Narzędzia i broń","Surowce","Jedzenie"]', t.band);
        rows = await rowsOf();
        check("...it opens on 'Narzędzia i broń': the clothes' section on top (the whole set, undress - no gold row), then only items of that kind, the list moved down under the band",
            t.kind === 0 && rows[0].head && rows[0].label === "Ubiór (ubrania):" && rows.slice(1, 3).map(r => r.what).join() === "all,off" && rows.slice(3).every(r => r.kind === "item") &&
            t.groups.filter(g => g !== null).join() === "0" && t.listY > (await ev("SceneManager._scene._kinds.y")), { kind: t.kind, first: rows.slice(0, 4).map(r => r.label) });
        await ev("(function(){ SceneManager._scene._list.select(1); return 0; })()"); await frames(6);
        const helpLine = await J("({ text: SceneManager._scene._helpText, small: SceneManager._scene._help.contents.fontSize })");
        check("...on a clothes' row the line over the tabs shows its description (the one-line rows keep theirs there)", /ubrania|ubranie/i.test(helpLine.text) && !/Q \/ E zakładka/.test(helpLine.text), helpLine);
        await ev("(function(){ SceneManager._scene._list.select(0); return 0; })()");
        await key(TAB); await frames(4);
        const t1 = await tabNow();
        check("Tab: 'Surowce'", t1.tab === 4 && t1.kind === 1 && t1.groups.join() === "1", { kind: t1.kind, groups: t1.groups });
        await key(TAB); await frames(4);
        const t2 = await tabNow();
        check("Tab: 'Jedzenie'", t2.tab === 4 && t2.kind === 2 && t2.groups.join() === "2", { kind: t2.kind, groups: t2.groups });
        const all = await J("$dataItems.filter(i => i && i.name && !/^-{3,}/.test(i.name)).map(i => i.id)");
        const seen = t0.ids.concat(t1.ids, t2.ids).filter(id => id > 0);
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
        await click("_kinds", 0); await frames(4);
        // ---------------------------------------------------------------- 'Fabuła i postacie'
        await key(E); await frames(6);
        const story = await J(`(function(){ const s = SceneManager._scene, l = s._list; return { tab: s._tab, sel: s._tabs.index(), band: s._kinds.visible, h: l.itemHeight(),
            rows: l._rows.map(r => ({ kind: r.kind, label: r.label, desc: r.desc || "", head: !!r.head })), wide: l._rows.filter(r => l.textWidth(r.label) > l.innerWidth).length }; })()`);
        const sheads = story.rows.filter(r => r.head).map(r => r.label);
        check("E: 'Fabuła i postacie' - Fabuła, Podziemia i Serce, Akt III, then the threads (ferry travellers, W15, W16, W14, spring 5, intrigues, W4, W5, W7, W9, W10), Postacie, Biały orzeł, Kot Mruczek, packages C / A / D, Miejsca z paczek",
            story.tab === 5 && story.sel === 5 && !story.band && sheads.join("|").startsWith("Fabuła:|Podziemia i Serce:|Akt III:|Podróżni z promu:|") &&
            ["Wątek W15 (Święte kości):", "Wątek W16 (Dezerter):", "Wątek W14 (Poselstwo):", "Intrygi na piętrach:", "Wątek W4 (Borgar, krew kasztelana):", "Wątek W5 (kantor Baltazara):", "Wątek W7 (dwór Lorda):", "Wątek W9 (rywal w ruinach):", "Wątek W10 (list do matki):"].every(h => sheads.includes(h)) &&
            sheads.slice(-7).join("|") === "Postacie:|Biały orzeł:|Kot Mruczek:|Ludzie (paczka C):|Woda i zasoby (paczka A):|Tajemnice i zakon (paczka D):|Miejsca z paczek:", sheads);
        check("...each row two lines high with its description (headers aside), nothing wider than the list",
            story.h > 50 && story.wide === 0 && story.rows.filter(r => !r.head).every(r => r.desc.length > 10), story.rows.filter(r => !r.head && r.desc.length <= 10).map(r => r.kind + ": " + r.label));
        check("...'Kot Mruczek:' away from grandpa's house has the way there ('Zabierz mnie do domu dziadka') and no text about the cat's day",
            story.rows.some(r => r.kind === "catHouse" && r.label === "Zabierz mnie do domu dziadka") && !story.rows.some(r => /Jego dzień|W nocy \(22-6\)/.test(r.label)));
        // the thing a Rdzeń / Kot tab would be: none left
        check("no 'Rdzeń' and no 'Kot' tab", !NAMES.includes("Rdzeń") && !(await J("SceneManager._scene._tabs._list.map(c => c.name)")).some(n => n === "Rdzeń" || n === "Kot"));
        await key(E); await frames(6);
        const tz = await tabNow();
        check("E on the last tab wraps round to 'Szybkie' (the band of kinds hidden, the list back up)", tz.tab === 0 && !tz.band && tz.listY < t0.listY, { tab: tz.tab, band: tz.band, listY: tz.listY });
        await key(TAB); await frames(4);
        check("Tab does nothing on 'Szybkie'", (await tabNow()).tab === 0);
        await click("_tabs", 1); await frames(4);
        check("a click on a tab opens it ('Pogoda i morze')", (await tabNow()).tab === 1);
        await click("_tabs", 0); await frames(4);
        await key(Q); await frames(6);
        check("Q goes back (wrapping to 'Fabuła i postacie')", (await tabNow()).tab === 5);
        for (let i = 0; i < 5; i++) await key(Q);
        await frames(6);
        check("Q five times: back on 'Szybkie'", (await tabNow()).tab === 0);

        // ---------------------------------------------------------------- no row twice: every tab, every kind
        const every = await everyRow();
        const act = every.filter(r => !r.head && r.kind !== "item");
        const keyOf = r => (r.owner ? r.owner + ":" + r.what : r.watek ? r.watek + ":" + r.kind : r.kind + ":" + r.label);
        const dups = act.map(keyOf).filter((k, i, a) => a.indexOf(k) !== i);
        check("no action twice in the whole menu (same owner and row, same thread row, same kind and label)", dups.length === 0, dups);
        check("one '+1000 G' and no other gold row (no '+500 G' of the clothes, no '+1000 G' of the weapons)", act.filter(r => /\+\s?\d[\d ]* G/.test(r.label)).length === 1 && act.filter(r => /^\+1000 G/.test(r.label)).length === 1, act.filter(r => /G\b/.test(r.label) && /\+/.test(r.label)).map(r => r.label));
        check("one tide row (no second 'Morze odpływ / przypływ', no package A's 'Pływ', no package D's 'Odpływ teraz')", act.filter(r => r.kind === "isleTide").length === 1 && !act.some(r => r.kind === "isleOkolice" && /^(Pływ|Odpływ teraz)/.test(r.label) && r.what === "tide" && r.owner !== "Ludzie") &&
            act.filter(r => /(^|\W)(Odpływ|Przypływ|Pływ)(\W|$)/.test(r.label) && !/podróżni|Odpływ wszystkich|jaskini/i.test(r.label)).length === 1, act.filter(r => /Odpływ|Przypływ|Pływ/.test(r.label)).map(r => r.label));
        check("package C's tide row stays only as the way to the cove with the cave ('Idź do zatoczki z jaskinią')", act.some(r => r.owner === "Ludzie" && r.what === "tide" && /zatoczki z jaskinią/.test(r.label)));
        check("one 'Sztorm się skończył' (the driftwood and the wreck's piece together)", act.filter(r => /^Sztorm się skończył/.test(r.label)).length === 1 && act.filter(r => r.kind === "isleStorm").length === 1);
        check("the white eagle's flight once: package D's 'Orzeł dorosły, lot' is gone, 'Dosiądź orła (lot)' stays", !act.some(r => /Orzeł dorosły, lot/.test(r.label)) && act.filter(r => /Dosiądź orła/.test(r.label)).length === 1);
        check("every row kind is on a tab of its own: a head has no kind of action", every.filter(r => r.head).every(r => r.kind === "info"));

        // ---------------------------------------------------------------- the pickers skip places on maps outside the world
        const pick = await J(`(function(){
            const s = SceneManager._scene; s.goTo(5, 0); const l = s._list, res = {}, world = n => !!SwiatData.maps[n] || (SwiatData.extra || []).includes(n) || n === 1;
            for (const r of l._rows) {
                if (r.kind !== "isleOkolice" || !["spot", "go", "place"].includes(r.what) || r.sec !== "miejsca") continue;
                const maps = new Set(); let i = l._rows.indexOf(r); l.select(i);
                for (let n = 0; n < 140; n++) {
                    const w = Wyspa.tideForced(), g = Okolice.f9.ok(r); Wyspa.forceTide(w);
                    if (g && g.go) maps.add(g.go[1]);
                    l.changeQty(1);
                }
                res[r.owner + ":" + r.what] = [...maps].sort((a, b) => a - b);
            }
            return { res, outside: Object.entries(res).filter(([k, v]) => v.some(m => !world(m))).map(([k]) => k) }; })()`);
        check("the place pickers of the packages (0, A, B, C, D) lead only to maps of the world - none to the parked meadows, the island's old places, the settlement", Object.keys(pick.res).length === 5 && pick.outside.length === 0 && Object.values(pick.res).every(v => v.length > 0), pick);

        // ---------------------------------------------------------------- +1 hour / +1 day (set to noon, day 1: no hour rollover to worry about)
        await goTab("Szybkie");
        await ev("$gameSystem.setDayNightHour(12); $gameSystem._dayNightDay = 1; 0");
        const before = await J("({ h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay() })");
        await selKind("hour");
        await key(OK);
        await frames(6);
        const afterHour = await J("({ h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay() })");
        check("'+1 godzina' advances the clock by about one hour", afterHour.d === before.d && afterHour.h - before.h > 0.9 && afterHour.h - before.h < 1.1, { before, afterHour });
        check("the menu stays open after granting (so you can do several in a row)", (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        await selKind("day");
        await key(OK);   // "+1 dzień"
        await frames(6);
        const afterDay = await J("({ h: $gameSystem.dayNightHour(), d: $gameSystem.dayNightDay() })");
        check("'+1 dzień' advances the clock by 24 hours (a whole day later)", afterDay.d === afterHour.d + 1 && Math.abs(afterDay.h - afterHour.h) < 0.1, { afterHour, afterDay });

        // ---------------------------------------------------------------- pick an item, raise the quantity, grant it
        await goTab("Przedmioty", 0);
        await ev("(function(){ SceneManager._scene._list.select(3); return 0; })()"); await frames(4);   // (past the clothes' section: its head and two rows)
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
        // the clothes: all of them, then undress (package Ubior_Sklepy's own acts, from this tab)
        await ev("(function(){ SceneManager._scene._list.select(1); return 0; })()");
        const cl0 = await ev("$gameParty.allItems().length");
        await key(OK); await frames(8);
        const cl1 = await ev("$gameParty.allItems().length");
        check("'Ubiór: daj wszystkie ubrania' from the item tab gives the clothes (the menu stays)", cl1 > cl0 && (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug", { cl0, cl1 });

        // ---------------------------------------------------------------- "Burza teraz": back to the map, the storm gathering
        await goTab("Szybkie");
        await goTab("Pogoda i morze");
        check("each tab remembers its row: 'Szybkie' was left on '+1 dzień'", (await J("(function(){ const s = SceneManager._scene; s.goTo(0, 0); return s._list.rowData().kind; })()")) === "day");
        await goTab("Pogoda i morze");
        await selKind("storm");
        await key(OK);
        await frames(20);
        check("'Burza teraz' goes back to the map and a storm gathers", (await ev("SceneManager._scene.constructor.name")) === "Scene_Map" && (await ev("Storm.level()")) > 0 && (await ev("Storm.phase()")) === "gather");
        await key(F9); await frames(10);
        check("F9 opens again on the tab and row it was left on ('Pogoda i morze', 'Burza teraz')", (await tabNow()).tab === 1 && (await ev("SceneManager._scene._list.rowData().kind")) === "storm");
        await selKind("calm");
        await key(OK);
        await frames(20);
        check("'Koniec pogody na dziś' ends it", (await ev("Storm.level()")) === 0);
        // ---------------------------------------------------------------- "Postaw: Cegielnia": the placer, free, the building finished at once
        await key(F9); await frames(10);
        const bagBefore = await J("({ stone: $gameParty.numItems($dataItems[Farming.ITEM.stone]), planks: $gameParty.numItems($dataItems[Farming.ITEM.planks]), stamina: Math.round($gameSystem.stamina()) })");
        await goTab("Budowanie");
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
        check("after putting a building down, F9 opens on 'Budowanie' with the same building chosen (to put another)", (await tabNow()).tab === 3 && (await ev("SceneManager._scene._list.rowData().type")) === "brickworks");

        // ---------------------------------------------------------------- the quick tab and the sea at work
        await goTab("Szybkie");
        const g0 = await ev("$gameParty.gold()");
        await selKind("isleGold"); await key(OK); await frames(6);
        check("'+1000 G': a thousand gold, the menu stays", (await ev("$gameParty.gold()")) === g0 + 1000 && (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        const xp0 = await ev("Combat.hero().xp !== undefined ? Combat.hero().xp : 0");
        await selKind("xp"); await key(OK); await frames(6);
        check("'+200 doświadczenia': the experience grows, the menu stays", (await ev("Combat.hero().xp !== undefined ? Combat.hero().xp : 0")) >= xp0 && (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug");
        const lv0 = await ev("Combat.hero().level");
        await selKind("isleXp"); await key(OK); await frames(6);
        check("'+10 000 doswiadczenia': levels come at once, the menu stays", (await ev("Combat.hero().level")) > lv0 && (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug", [lv0, await ev("Combat.hero().level")]);
        // (2026-10-23) the texts' files read again (Watki.przeladuj): the label says how many, a notice waits for the map
        await ev("$gameTemp._topNotices = []; 0");
        await selKind("isleTexts"); await key(OK);
        let texts = null;
        for (let i = 0; i < 40 && !(texts = await J("(function(){ const r = Watki.ostatnieWczytanie(); return r ? r : null; })()")); i++) await frames(5);
        await frames(4);
        const textsLab = await rowLabel("isleTexts"), textsTop = await J("($gameTemp._topNotices || []).map(n => n.text || n)");
        check("'Wczytaj teksty od nowa': every file of js/teksty read again - the label 'Teksty wczytane od nowa: N plik...', the same notice for the map, the menu stays",
            !!texts && !texts.bad && texts.n === texts.files && texts.n >= 1 && /Teksty wczytane od nowa: \d+ plik/.test(textsLab) && textsTop.some(t => /Teksty wczytane od nowa/.test(JSON.stringify(t))) &&
            (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug", { texts, textsLab, textsTop });

        await goTab("Pogoda i morze");
        await selKind("isleWater");
        const water = [];
        for (let i = 0; i < 3; i++) { await key(OK); await frames(4); water.push([await ev("CzerwonaWoda.forced()"), await rowLabel("isleWater")]); }
        check("'Woda w morzu': OK - red, grey, back to the weather (CzerwonaWoda.force), the label says which",
            water[0][0] === "red" && /czerwona \(wymuszona\)/.test(water[0][1]) && water[1][0] === "grey" && /szara \(wymuszona\)/.test(water[1][1]) && water[2][0] === null && /z pogody/.test(water[2][1]), water);
        // the one tide row: OK goes round clock -> low -> high -> clock, ←→ both ways (Wyspa.forceTide; switch 20 follows the low tide)
        await selKind("isleTide");
        const tide = [];
        for (let i = 0; i < 3; i++) { await key(OK); await frames(70); tide.push(await J("({ f: Wyspa.tideForced(), low: Wyspa.tide().low, sw: $gameSwitches.value(20), label: SceneManager._scene._list.rowData().label })")); }
        await key(LEFT); await frames(70);
        const tl = await J("({ f: Wyspa.tideForced(), label: SceneManager._scene._list.rowData().label })");
        await key(RIGHT); await frames(70);
        const tr = await J("({ f: Wyspa.tideForced(), label: SceneManager._scene._list.rowData().label })");
        await key(OK); await frames(10);
        check("the one tide row: OK - low (the sandbar dry, switch 20 on), high, then the clock again; ←→ go round the other way too; the label says which",
            tide[0].f === "low" && tide[0].low && tide[0].sw === true && /odpływ wymuszony/.test(tide[0].label) && tide[1].f === "high" && !tide[1].low && tide[1].sw === false && /przypływ wymuszony/.test(tide[1].label) &&
            tide[2].f === null && /z zegara/.test(tide[2].label) && tl.f === "high" && tr.f === null && (await ev("Wyspa.tideForced()")) === "low", { tide, tl, tr });
        await ev("Wyspa.forceTide(null); 0");
        // the storm's end does what both packages' rows did (the driftwood of A, the wreck's piece of D)
        await selKind("isleStorm");
        const calls = await J(`(function(){ const orig = Okolice.f9.ok, calls = []; Okolice.f9.ok = r => { calls.push(r.owner + ":" + r.what); return orig.call(Okolice.f9, r); };
            try { SceneManager._scene.onOk(); } finally { Okolice.f9.ok = orig; } return calls; })()`);
        check("'Sztorm się skończył' runs package A's driftwood and package D's wreck piece, both (once each)", calls.filter(c => /:storm$/.test(c)).join() === "Zasoby:storm,Zakon:storm" && (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug", calls);

        // ---------------------------------------------------------------- the story tab at work
        await goTab("Fabuła i postacie");
        await selKind("isleFavor");
        const fav0 = await ev("Garnizon.favor()");
        await key(RIGHT); await frames(4);
        const fav1 = await ev("Garnizon.favor()"), favLab = await rowLabel("isleFavor");
        await key(LEFT); await frames(4);
        check("'Przychylność garnizonu': → +20, ← -20, the number in the label", fav1 === Math.min(100, fav0 + 20) && favLab.indexOf(": " + fav1 + " / 100") > 0 && (await ev("Garnizon.favor()")) === Math.max(0, fav1 - 20), { fav0, fav1, favLab });
        await selKind("isleCistern"); await key(OK); await frames(6);
        check("'Otwórz cysternę': cisternOpen (and the rest of W1 ch. 7's flags), the label says so",
            (await J("['cisternOpen','sluiceHalf','millRuns','kubaHonest'].every(k => !!TownQuests.state().flags[k])")) && /^Cysterna otwarta/.test(await rowLabel("isleCistern")));
        await selKind("isleLose"); await key(OK); await frames(6);
        check("'Świt dnia 61 bez spłaty' in a game without the story: nothing (the label says why), the menu stays",
            /gra bez fabuły/.test(await rowLabel("isleLose")) && (await ev("SceneManager._scene.constructor.name")) === "Scene_Debug" && (await ev("$gameSystem.dayNightDay()")) < 61);

        // ---------------------------------------------------------------- the ten places: each on a free, walkable cell of the right map
        const PLACES = [["Kruczogród", 8], ["Kruczy Jar - działka dziadka", 3], ["Dom dziadka", 20], ["Łąka pod Gawrą", 4], ["Posiadłość Lorda", 24], ["Góry i kamieniołom", 13],
            ["Podgrodzie", 111], ["Garnizon nad zatoką", 162], ["Przystań", 125], ["Tawerna - sala", 1]];
        const landed = [];
        for (const [name, map] of PLACES) {
            await goTab("Szybkie");
            await selLabel("isleGo", name);
            await key(OK);
            for (let i = 0; i < 80 && !(await ev(`$gameMap.mapId() === ${map} && SceneManager._scene.constructor.name === 'Scene_Map' && !$gamePlayer.isTransferring() && !SceneManager.isSceneChanging()`)); i++) await frames(10);
            await frames(12);
            landed.push(Object.assign({ name }, await J(`(function(){ const x = $gamePlayer.x, y = $gamePlayer.y;
                return { map: $gameMap.mapId(), x, y, pass: [2, 4, 6, 8].every(d => $gameMap.isPassable(x, y, d)), blockedBy: $gameMap.eventsXyNt(x, y).map(e => e.event().name),
                    around: [-1, 0, 1].every(dx => [-1, 0, 1].every(dy => [2, 4, 6, 8].every(d => $gameMap.isPassable(x + dx, y + dy, d)))) }; })()`)));
            await sleep(100);
            // (a place's first visit may start a scene of its own: its lines dismissed)
            await ev("if ($gameMessage.isBusy()) $gameMessage.clear(); 0");
            if (name !== "Tawerna - sala") { await openF9(); }
            else await openF9();
        }
        check("the ten places: each lands on the right map (Map008, 003, 020, 004, 024, 013, 111, 162, 125, 001) on a passable cell with no event on it and room all round (3x3)",
            PLACES.every(([n, m], i) => landed[i].map === m && landed[i].pass && landed[i].blockedBy.length === 0 && landed[i].around), landed);
        check("F9 opens again on 'Szybkie', on the same row", (await tabNow()).tab === 0 && (await ev("SceneManager._scene._list.rowData().label")) === "Tawerna - sala");
        // the harbour's old way: the wreck's low tide is no more - the Garnizon's place does not force the tide
        check("'Garnizon nad zatoką' and the rest do not force the tide (the wreck's low tide went with the wreck)", (await ev("Wyspa.tideForced()")) === null);

        // the prologue again: the film over the map, then back - the same map, the same tile, the same purse
        const before165 = await J("({ m: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, g: $gameParty.gold(), d: $gameSystem.dayNightDay() })");
        await goTab("Fabuła i postacie");
        await selKind("islePrologue"); await key(OK);
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
        await goTab("Fabuła i postacie");
        await selKind("isleRaven"); await key(OK);
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

        // ---------------------------------------------------------------- no row that is left moves the hero off the world's maps
        await openF9();
        const moved = await J(`(function(){
            const rec = [], orig = $gamePlayer.reserveTransfer; $gamePlayer.reserveTransfer = function(m) { rec.push(m); };
            const OUT = [12, 17, 18, 21, 22, 23, 27, 159, 165, 166, 167, 176, 177, 990, 991], bad = [], seen = {};
            try {
                const s = SceneManager._scene;
                for (let tab = 0; tab < 6; tab++) for (const kind of (tab === 4 ? [0] : [0])) {
                    s._list.setTab(tab, 0, kind);
                    for (const r0 of s._list._rows.slice()) {
                        if (r0.head || !/^isle|^cat|^ug|^heart|^act3|^underground/.test(r0.kind) && !r0.watek) continue;
                        const row = r0, maps = [], start = r0.pick;   // (the row itself: ←→ changes it, as the player's would)
                        for (let i = 0; i < 14; i++) {
                            rec.length = 0; let r = null;
                            try {
                                if (row.watek) r = Watki.f9.ok(row);
                                else if (row.kind === "isleOkolice") r = Okolice.f9.ok(row);
                                else if (row.kind === "isleEagle") r = Orzel.f9(row);
                            } catch (e) {}
                            maps.push(...rec); if (r && r.go) maps.push(r.go[1]);
                            if (!row.watek || row.pick === undefined) break;
                            s._list.select(s._list._rows.indexOf(r0)); s._list.changeQty(1);
                            if (row.pick === start) break;
                        }
                        const off = maps.filter(m => OUT.includes(m));
                        if (off.length) bad.push([r0.kind, r0.label, off]);
                        seen[r0.kind] = (seen[r0.kind] || 0) + 1;
                    }
                }
            } finally { $gamePlayer.reserveTransfer = orig; }
            return { bad, kinds: Object.keys(seen).length }; })()`);
        check("every action row left in the menu (package, eagle, thread rows, with every chapter ←→ offers) ends on a map of the world - none on the parked meadows, Leśna droga, the island's old places, the settlement, the eagle's ridge", moved.bad.length === 0 && moved.kinds > 8, moved);
        check("the rows that came back (2026-11-11 pockets): Łowy 'wataha przy norze', 'obóz rabusiów', 'obóz myśliwych', 'zbłąkane zwierzęta'; package C 'mielerz', 'handlarz', 'pasterz'; package D 'gaj Milczących'; the eagle's 'kradzież' and 'Orla Grań'",
            (await everyRow()).filter(r => /Wataha i szczenięta przy norze|Obóz rabusiów|Obóz myśliwych|Zbłąkane zwierzęta|Dzień mielerza|Dzień handlarza|Pasterz z owcami|Zmierzch w gaju|Kradzież \(W13|Orlą Grań/.test(r.label)).length >= 8);
        await key(ESC); await frames(10);

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
