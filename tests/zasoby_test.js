// PACZKA A „Woda i zasoby” (js/plugins/Zasoby_Data.js + Zasoby.js; grafika tools/rozszerzenia/A/build_art.py; plan
// docs/rozszerzenia/PLAN.md punkt 4). Sprawdza:
//   - wtyczki, przedmioty 185-196 i ikony 464-475, jedzenie (FoodTable), premie, przepisy (ognisko, warsztat, kuźnia; po D30 maść i napar)
//   - każde wstawione zdarzenie: numer z zakresu paczki (2100-2299) i pole z planu, na 10 mapach; Jagna (TownLife 2900) na Map017
//   - mechanikę każdej rzeczy: źródełka (porcje, upał, śnieg, odkrycie), studnia sąsiada (oczyść, napraw, tylko deszczówka), dzikie
//     ule (nóż, użądlenie), kręgi grzybów (po deszczu, noc w kręgu), zioła i Jagna (nie twoje, zabrane zioła oddane), ogródki,
//     wysypisko, glinianka, ściana ciosowa, żyły rudy (odrastają), kałuże z krabami (odpływ), drewno z morza, sad, pola mieszczan
//   - braki jako dymek nad bohaterem (nigdy okno wiadomości), zadania K55-K58 / D30-D31 (dane i warunki), ogłoszenia zas_,
//     wiersze F9 (teleport, studnia, sad), zapis i wczytanie stanu paczki
// Uruchom: CDP_PORT=9551 node tests/zasoby_test.js (serwer: node tools/serve.js na 8765)
const kit = require("./lib/kit.js");

kit.test({ port: 9551, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const Z = expr => t.json("(function(){ return " + expr + "; })()");
    const run = js => t.eval("(function(){ " + js + " ; return 0; })()");
    const popsSince = async () => t.popups({ clear: true });
    const msgBusy = () => t.eval("$gameMessage.isBusy()");
    // the weather of the test: rain on the given days (relative to today: 0 today, -1 yesterday), nothing else
    const weather = rel => run(`const d0 = $gameSystem.dayNightDay(), rel = ${JSON.stringify(rel)}; if (!window.__wp) window.__wp = Survival.weatherPlan;
        Survival.weatherPlan = day => rel.includes(day - d0) ? { type: 'rain', start: 9, end: 15, power: 3 } : null;`);
    const restoreWeather = () => run("if (window.__wp) Survival.weatherPlan = window.__wp;");
    // the menu Farming opens (entries' names) and running one of them
    const menuNames = async () => { await t.frames(12); return Z("$gameTemp._farmMenuOpen && SceneManager._scene._farmMenu ? SceneManager._scene._farmMenu._entries.map(e => e.name) : null"); };
    const runEntry = async i => { const r = await Z(`(function(){ const s = SceneManager._scene, e = s._farmMenu._entries[${i}]; s.closeFarmMenu(); return !!e.run(); })()`); await t.frames(70); return r; };
    const closeMenu = () => run("if ($gameTemp._farmMenuOpen) SceneManager._scene.closeFarmMenu();");
    const use = async id => { await run(`$gameMap.event(${id}).start();`); await t.frames(8); };
    const finishWork = async key => { await run(`const sp = Zasoby.specFor(${JSON.stringify(key)}); const w = Zasoby.state().work[${JSON.stringify(key)}];
        const need = w ? w.need : (typeof sp.need === 'function' ? sp.need(0) : sp.need); Zasoby.state().work[${JSON.stringify(key)}] = { done: need - 1, need }; Zasoby.strike(sp);`); await t.frames(90); };

    // ---------------------------------------------------------------- wtyczki, dane, przedmioty, ikony
    const base = await Z(`{ data: !!window.ZasobyData && ZasobyData.ready, api: !!window.Zasoby && Zasoby.ready, order: $plugins.filter(p => p.status).map(p => p.name),
        items: [185,186,187,188,189,190,191,192,193,194,195,196].map(i => [i, $dataItems[i].name, $dataItems[i].iconIndex]),
        food: [186, 187, 196].map(i => FoodTable.get(i) && [FoodTable.get(i).spoil, FoodTable.get(i).stamina || 0, FoodTable.get(i).buff || ""]),
        life: [Spoilage.LIFE[186], Spoilage.LIFE[187]], buffs: [!!Survival.BUFFS.uzadlenie, Survival.BUFFS.uzadlenie && Survival.BUFFS.uzadlenie.cost, !!Survival.BUFFS.gleboki_sen],
        recipes: [Farming.BUILDINGS.campfire.recipes.some(r => r.id === 'zas_roast_crab'), Farming.BUILDINGS.workbench.recipes.some(r => r.id === 'zas_split_drift'),
            Farming.BUILDINGS.forge.recipes.some(r => r.id === 'zas_scrap_iron')],
        quests: ['K55','K56','K57','K58','D30','D31'].map(id => !!TownQuests.Q[id] && TownQuests.Q[id].giver), pack: TownQuestsData.PACKS.filter(p => p.owner === 'Zasoby').map(p => p.quests.join()).join(),
        qb: QuestBoard_parts_tpl(), jagna: TownLife.RESIDENTS.filter(r => r.key === 'jagna').map(r => [r.id, r.map, r.sheet]), bust: SpeechBubbles.BUSTS['$Npc_Jagna:0'] }`
        .replace("QuestBoard_parts_tpl()", "(Tawerna.api('QuestBoard_parts').data.TEMPLATES.filter(x => /^zas_/.test(x.id)).map(x => x.id + ':' + x.giver))"));
    const at = n => base.order.indexOf(n);
    t.check("Zasoby_Data pod Okolice_Data i nad TownLife, Zasoby pod Okolice; obie gotowe",
        base.data && base.api && at("Okolice_Data") < at("Zasoby_Data") && at("Zasoby_Data") < at("TownLife") && at("Okolice") < at("Zasoby"), { data: base.data, api: base.api });
    t.check("przedmioty 185-196 zainstalowane z nazwami, ikony 464-475", base.items.every(([i, n, ic]) => n && ic === 464 + (i - 185)), base.items);
    t.check("jedzenie: surowy krab psuje się w 24 h, pieczony krab 18 sił / 48 h, napar z kozłka daje premię „gleboki_sen”",
        JSON.stringify(base.food) === JSON.stringify([[24, 0, ""], [48, 18, ""], [240, 6, "gleboki_sen"]]) && base.life[0] === 24 && base.life[1] === 48, base.food);
    t.check("premie: użądlenie (prace x1.15, zła), głęboki sen", base.buffs[0] && base.buffs[1] === 1.15 && base.buffs[2], base.buffs);
    t.check("przepisy zawsze: krab na ognisku, rozłupanie drewna dryfowego (warsztat), przetop złomu (kuźnia)", base.recipes.every(Boolean), base.recipes);
    t.check("zadania K55 (dzwonnik), K56 (znachorka), K57 (dziadek), K58 (praczka), D30 (jagna), D31 (szmaciarz) w paczce „Zasoby”",
        base.quests.join() === "dzwonnik,znachorka,grandpa,praczka,jagna,szmaciarz" && base.pack === "K55,K56,K57,K58,D30,D31", { q: base.quests, pack: base.pack });
    t.check("tablica: ogłoszenia zas_dziki_miod (melia), zas_ziola_rzadkie (jagna), zas_bloki (kazimierz), zas_kraby (borgar)",
        base.qb.join() === "zas_dziki_miod:melia,zas_ziola_rzadkie:jagna,zas_bloki:kazimierz,zas_kraby:borgar", base.qb);
    t.check("Babka Jagna: mieszkanka TownLife 2900 na Map017 ($Npc_Jagna), popiersie Jagna_Bust", JSON.stringify(base.jagna) === JSON.stringify([[2900, 17, "$Npc_Jagna"]]) && base.bust === "Jagna_Bust", base);
    await t.eval("['!$Zas_Zrodlo','!$Zas_Ruina','!$Zas_Studnia','!$Zas_DzikiUl','!$Zas_SadSpalony','!Zas_Uprawy','$Npc_Jagna'].forEach(n => ImageManager.loadCharacter(n)); ImageManager.loadPicture('Jagna_Bust'); 0");
    await t.frames(30);
    const pics = await Z("['!$Zas_Zrodlo','!$Zas_Ruina','!$Zas_Studnia','!$Zas_DzikiUl','!$Zas_SadSpalony','!Zas_Uprawy','$Npc_Jagna'].map(n => { const b = ImageManager.loadCharacter(n); return n + ':' + b.width + 'x' + b.height; }).concat([ImageManager.loadPicture('Jagna_Bust').width])");
    t.check("grafika: arkusze !$Zas_* (3 x 4 komórki), !Zas_Uprawy (8 postaci), $Npc_Jagna 192x256, popiersie 330 px", pics.slice(0, 7).every(s => !/:0x0$/.test(s)) && pics[6] === "$Npc_Jagna:192x256" && pics[7] === 330, pics);

    // ---------------------------------------------------------------- nowa gra; zdarzenia na mapach (numery i pola z planu)
    await t.newGame({ map: 3, x: 25, y: 15, hour: 12, quiet: true, minimap: false });
    await run("for (const id of [60, 62, 63, 66, 87, 89, 90, 91, 115, 116, 142]) $gameParty.loseItem($dataItems[id], 99, true);");   // (no tools: the popups first)
    await t.setDay(30, 12);   // (lato)
    await weather([-1]);
    const EXPECT = `(function(){ const D = ZasobyData, out = [];
        for (const s of D.SPRINGS) { out.push([s.map, s.id, s.sx, s.sy]); out.push([s.map, s.stones[0], s.sx + 1, s.sy + 1]); if (s.herb) out.push([s.map, s.herb.id, s.sx - 1, s.sy + 1]); else out.push([s.map, s.stones[1], s.sx - 1, s.sy + 1]); }
        for (const h of D.GLADE.herbs) out.push([17, h.id, h.x, h.y]);
        for (const r of D.RINGS) r.cells.forEach((c, i) => out.push([17, r.ids[i], c[0], c[1]]));
        D.QUARRY.ids.forEach((id, i) => out.push([13, id, D.QUARRY.at[i][0], D.QUARRY.at[i][1]]));
        for (const v of D.VEINS) out.push([13, v.id, v.x, v.y]);
        for (const m of Object.keys(D.DRIFT)) for (const d of D.DRIFT[m]) out.push([Number(m), d.id, d.x, d.y]);
        for (const p of D.POOLS) out.push([125, p.id, p.x, p.y]);
        D.ORCHARD.trees.forEach((c, i) => out.push([168, D.ORCHARD.ids[i], c[0], c[1]])); out.push([168, D.ORCHARD.marta.id, D.ORCHARD.marta.x, D.ORCHARD.marta.y]);
        const F = D.FARMSTEAD; out.push([3, F.ruin.id, F.ruin.x, F.ruin.y], [3, F.well.id, F.well.x, F.well.y], [3, F.fence.id, F.fence.x, F.fence.y]);
        F.garden.ids.forEach((id, i) => out.push([3, id, F.garden.cells[i][0], F.garden.cells[i][1]]));
        for (const h of D.HIVES) out.push([3, h.id, h.x, h.y]);
        for (const g of D.GARDENS) g.ids.forEach((id, i) => out.push([111, id, g.cells[i][0], g.cells[i][1]]));
        for (const h of D.DUMP.heaps) out.push([111, h.id, h.x, h.y]);
        out.push([111, D.CLAYPIT.id, D.CLAYPIT.ex, D.CLAYPIT.ey]);
        for (const c of Zasoby.FIELD_CELLS) out.push([8, c.id, c.x, c.y]);
        return out; })()`;
    const expect = await t.json(EXPECT);
    const MAPS = [17, 21, 13, 155, 168, 3, 111, 125, 162, 8];
    const placed = {}, bad = [];
    for (const m of MAPS) {
        const e = await t.json(`OkoliceData.ENTRY[${m}]`);
        await t.go(m, e[0], e[1]);
        if (!(await t.until("$gameMap.mapId() === " + m + " && !!$dataMap && !$gamePlayer.isTransferring()", 90))) { bad.push(m + ": nie dotarł na mapę"); continue; }
        await t.frames(10);
        const got = await t.json(`$dataMap.events.filter(e => e && /<Zasoby:/.test(e.note || '')).map(e => [e.id, e.x, e.y, e._twOwner || ''])`);
        const range = await t.json(`ZasobyData.IDS[${m}]`);
        placed[m] = got.length;
        for (const [id, x, y, owner] of got) if (id < range[0] || id > range[1] || owner !== "Zasoby") bad.push(m + ":" + id + " poza zakresem / właściciel " + owner);
        for (const [mm, id, x, y] of expect.filter(x => x[0] === m)) {
            const g = got.find(q => q[0] === id);
            if (!g) bad.push(m + ":" + id + " brak");
            else if (g[1] !== x || g[2] !== y) bad.push(m + ":" + id + " na (" + g[1] + "," + g[2] + ") zamiast (" + x + "," + y + ")");
        }
    }
    t.check("każde zdarzenie paczki: numer z jej zakresu na tej mapie (2100-2299), właściciel „Zasoby”, pole z planu (" + expect.length + " zdarzeń na 10 mapach)",
        bad.length === 0 && expect.length >= 130, bad.length ? bad.slice(0, 12) : placed);

    // ---------------------------------------------------------------- A1 źródełka
    await t.go(17, 71, 55, 8);
    await weather([-1]);
    await t.frames(30);
    const sp0 = await Z(`{ max: Zasoby.springMax($gameSystem.dayNightDay()), left: Zasoby.springLeft('zrodlo_017'), found: Okolice.isFound('zrodlo_017') }`);
    t.check("źródełko latem po wczorajszym deszczu: 1 + 1 = 2 porcje na dziś; znalezione przy pierwszym podejściu (pole obok)", sp0.max === 2 && sp0.left === 2 && sp0.found, sp0);
    await popsSince();
    await use(2100);
    const sm = await menuNames();
    t.check("menu źródełka jak studnia: napij się, bukłak, konewka, wiadro", !!sm && sm.length === 4 && /Napij/.test(sm[0]), sm);
    await run("Needs.setEnabled(true); Needs.state().water = 40;");
    await runEntry(0);
    const sp1 = await Z(`{ left: Zasoby.springLeft('zrodlo_017'), water: Math.round(Needs.state().water) }`);
    await run("Needs.setEnabled(false);");
    t.check("napicie się zabiera jedną porcję źródełka (zostaje 1), pragnienie gaśnie", sp1.left === 1 && sp1.water > 40, sp1);
    await run("Zasoby.dbg.hot = true; Zasoby.sync();");
    const hotMax = await Z("Zasoby.springMax($gameSystem.dayNightDay())");
    await use(2100);
    const hotPops = await popsSince();
    t.check("upał: źródełko suche (0 porcji), dymek „Ledwie wilgotny mech...” nad bohaterem, bez okna wiadomości",
        hotMax === 0 && hotPops.some(p => /Ledwie wilgotny mech/.test(p)) && !(await msgBusy()) && !(await menuNames()), { hotMax, hotPops });
    await run("Zasoby.dbg.hot = false; Zasoby.dbg.snow = true; Zasoby.sync();");
    await use(2100);
    const icePops = await popsSince();
    const look = await Z("[$gameMap.event(2100)._direction, Zasoby.springMax($gameSystem.dayNightDay())]");
    await run("Zasoby.dbg.snow = false; Zasoby.sync();");
    t.check("śnieg: źródełko zamarznięte (wygląd lodu, dymek „Lód...”)", look[0] === 8 && look[1] === 0 && icePops.some(p => /^Lód/.test(p)), { look, icePops });
    await weather([]);
    const dryMax = await Z("[Okolice.drought($gameSystem.dayNightDay()), Zasoby.springMax($gameSystem.dayNightDay())]");
    t.check("susza (10+ dni bez deszczu): źródełko suche", dryMax[0] === true && dryMax[1] === 0, dryMax);
    await weather([-1]);

    // ---------------------------------------------------------------- A4 kręgi grzybów, A5 zioła i Jagna
    await run("Zasoby.sync();");
    await t.frames(25);
    const ring = await Z(`{ born: Zasoby.ringBorn(), shown: ZasobyData.RINGS[0].ids.map(id => $gameSelfSwitches.value([17, id, 'A'])).filter(Boolean).length }`);
    t.check("dzień po deszczu: krąg 8 grzybów stoi", ring.born > 0 && ring.shown === 8, ring);
    await t.locate(54, 42, 8);
    const m0 = await t.count(103);
    await use(2107);
    await t.frames(70);
    const ring2 = await Z(`{ shown: $gameSelfSwitches.value([17, 2107, 'A']), picked: Zasoby.state().rings.grzyby_krag1.picked }`);
    t.check("grzyb z kręgu zerwany: +1 Grzyby, znika z kręgu", (await t.count(103)) === m0 + 1 && !ring2.shown && ring2.picked.includes(0), ring2);
    await t.setHour(22);
    await t.locate(54, 44, 2);
    await t.frames(30);
    const fairy = await Z(`{ found: Okolice.isFound('grzyby_krag1'), night: Zasoby.state().fairy.grzyby_krag1 }`);
    t.check("noc w środku kręgu: mgła, szept i odkrycie „Czarci krąg”", fairy.found && fairy.night > 0, fairy);
    // the herbs (summer: all three in season); Jagna away (evening) - a glade herb may be picked, she will notice
    await t.setHour(14);
    await t.locate(66, 13, 8);
    const before = await t.count(190);
    await use(2104);
    await t.frames(70);
    const herb = await Z(`{ n: $gameParty.numItems($dataItems[190]), taken: Zasoby.state().jagna.taken[190] || 0, state: Zasoby.herbState(17, 2104, 'arcydziegiel') }`);
    t.check("zioło z polanki Jagny pod jej nieobecność: zerwane (+1 Arcydzięgiel), zapisane jako zabrane, kępa odrasta", herb.n === before + 1 && herb.taken === 1 && herb.state === "picked", herb);
    // Jagna at her glade: the morning of a day without rain
    await weather([-2]);
    await t.setHour(6);
    await t.go(17, 67, 17, 8);
    await t.frames(40);
    const jg = await Z(`(function(){ const e = TownLife.eventOf('jagna'); return e ? { x: e.x, y: e.y, hidden: !!(e._town && e._town.hidden) } : null; })()`);
    t.check("Jagna rano w dzień bez deszczu stoi przy swojej polance (67,15)", !!jg && jg.x === 67 && jg.y === 15 && !jg.hidden, jg);
    await t.locate(68, 14, 8);
    await popsSince();
    await run("Zasoby.state().herbs = {};");
    await use(2105);
    await t.frames(20);
    const notYours = await popsSince();
    t.check("zioło z polanki przy Jagnie: dymek „Nie twoje, chłopcze.”, zaufanie spada, nic nie zerwane",
        notYours.some(p => /Nie twoje/.test(p)) && (await Z("Zasoby.state().jagna.trust")) === -1 && !(await msgBusy()), notYours);
    const talk1 = await t.talkTo("TownLife.eventOf('jagna')");
    const talk2 = await t.talkTo("TownLife.eventOf('jagna')");
    const jstate = await Z(`{ trust: Zasoby.state().jagna.trust, taken: Object.keys(Zasoby.state().jagna.taken).length, n: $gameParty.numItems($dataItems[190]), met: Zasoby.state().jagna.met > 0 }`);
    t.check("rozmowa z Jagną: najpierw poznanie, potem zauważa zabrane zioło - oddane, zaufanie −2",
        /Jestem Jagna/.test(talk1.text) && /Oddaj, co zerwałeś/.test(talk2.text) && jstate.taken === 0 && jstate.n === before && jstate.trust === -3 && jstate.met, { t1: talk1.text, t2: talk2.text, jstate });
    // D30 done: the permit, the recipes
    await run("Zasoby.state().jagna.trust = 0; TownQuests.start('D30'); TownQuests.finish('D30');");
    await t.frames(5);
    const d30 = await Z(`{ permit: Zasoby.state().jagna.permit, hand: Farming.HAND_RECIPES.some(r => r.id === 'zas_masc'), brew: Farming.BUILDINGS.cauldron.recipes.some(r => r.id === 'zas_napar' && r.water === 1) }`);
    t.check("po D30: zgoda na zbiór z polanki, przepisy - maść szczepiarska (ręcznie) i napar z kozłka (kociołek, 1 porcja wody)", d30.permit && d30.hand && d30.brew, d30);

    // ---------------------------------------------------------------- A2 zagroda Rzepków: ruina, ogródek, studnia
    await weather([-1]);
    await t.setHour(12);
    await t.go(3, 42, 53, 8);
    await t.frames(30);
    t.check("zagroda Rzepków odkryta przy podejściu", await Z("Okolice.isFound('zagroda')"));
    const rope0 = await t.count(93);
    await use(2185);
    const rm = await menuNames();
    await runEntry(0);
    await t.frames(30);
    const letter = await Z("$gameMessage.allText()");
    await t.finish();
    t.check("ruina: przeszukanie raz - list Wojciecha Rzepki, Lina i Gwoździe", !!rm && /Przeszukaj/.test(rm[0]) && /Rzepk|wyschła/.test(letter) && (await t.count(93)) === rope0 + 1 && (await Z("Zasoby.state().ruin")) > 0, { rm, letter });
    await t.locate(47, 54, 8);
    await popsSince();
    await use(2194);
    await runEntry(0);
    const noShovel = await popsSince();
    t.check("studnia zasypana bez łopaty: dymek „Potrzebna łopata.”, bez okna", noShovel.some(p => /Potrzebna łopata/.test(p)) && !(await msgBusy()), noShovel);
    await t.give(62, 1);
    await finishWork("well:clear");
    t.check("studnia oczyszczona łopatą (etap 1) - na dnie zardzewiałe wiadro (Złom żelazny)", (await Z("Zasoby.state().well.stage")) === 1 && (await t.count(193)) >= 1);
    await use(2194);
    await runEntry(0);
    const noMat = await popsSince();
    t.check("naprawa bez materiałów: dymek „Brakuje: Blok kamienny 0/4” (i młotka)", noMat.some(p => /Brakuje: Blok kamienny 0\/4|Potrzebny młotek/.test(p)), noMat);
    await t.give(89, 1); await t.give(188, 4); await t.give(93, 2); await t.give(80, 2);
    await use(2194);
    await runEntry(0);
    await finishWork("well:fix");
    const well = await Z(`{ stage: Zasoby.state().well.stage, blocks: $gameParty.numItems($dataItems[188]), sw: $gameSwitches.value(21), units: Zasoby.wellUnits() }`);
    t.check("studnia naprawiona (4 bloki, 2 liny, 2 deski, młotek): etap 2, przełącznik 21 Zas_Studnia, bez wody na start", well.stage === 2 && well.blocks === 0 && well.sw && well.units === 0, well);
    await popsSince();
    await use(2194);
    const dryWell = await popsSince();
    t.check("studnia deszczowa pusta: dymek „Sucho...” - wody z niczego nie ma", dryWell.some(p => /Sucho/.test(p)) && !(await menuNames()), dryWell);
    await run(`const w = Zasoby.state().well, h = Farming.clockHours(); w.wt = h - 40; const d0 = $gameSystem.dayNightDay(); Survival.weatherPlan = day => day === d0 - 1 ? { type: 'rain', start: 2, end: 14, power: 3 } : null;`);
    const rain = await Z("Zasoby.wellUnits()");
    await weather([-1]);
    t.check("12 godzin deszczu: studnia zbiera najwyżej 4 porcje (1 na 2 godziny)", rain === 4, rain);
    await run("Zasoby.state().well.water = 2;");
    await use(2194);
    const wm = await menuNames();
    await run("Needs.setEnabled(true); Needs.state().water = 30;");
    await runEntry(0);
    await run("Needs.setEnabled(false);");
    t.check("napicie się ze studni zabiera porcję deszczówki (2 → 1)", !!wm && wm.length === 4 && (await Z("Zasoby.wellUnits()")) === 1, wm);
    t.check("K57: warunki kroków (zagroda znaleziona, studnia oczyszczona, naprawiona) spełnione",
        await Z("['k57Zagroda','k57Oczyszczona','k57Bloki','k57Naprawiona'].every(k => TownQuests.FX[k].check())"));
    // the wild garden
    await t.locate(45, 54, 8);
    await popsSince();
    await use(2192);
    await runEntry(0);
    const noHoe = await popsSince();
    await t.give(66, 1);
    const veg0 = (await t.count(71)) + (await t.count(72));
    await finishWork("garden");
    const veg1 = (await t.count(71)) + (await t.count(72));
    t.check("zdziczały ogródek: bez motyki dymek „Potrzebna motyka.”; wypielony daje 2-4 dzikie warzywa", noHoe.some(p => /Potrzebna motyka/.test(p)) && veg1 - veg0 >= 2 && veg1 - veg0 <= 4, { noHoe, got: veg1 - veg0 });

    // ---------------------------------------------------------------- A3 dzikie ule
    await t.locate(66, 39, 8);
    await t.frames(40);
    t.check("dzikie ule odkryte przy podejściu", await Z("Okolice.isFound('dzikie_ule')"));
    await popsSince();
    await use(2196);
    await runEntry(0);
    const noKnife = await popsSince();
    await t.give(90, 1);
    const honey0 = await t.count(76), wax0 = await t.count(185);
    await use(2196);
    await runEntry(0);
    await t.frames(30);
    const hive = await Z(`{ honey: $gameParty.numItems($dataItems[76]), wax: $gameParty.numItems($dataItems[185]), day: Zasoby.state().hives.ul_1, smoke: Zasoby.smokeNear() }`);
    t.check("dziki ul: bez noża dymek „Potrzebny nóż.”; bez dymu tylko 1 miód, bez wosku; ul odpoczywa 4 dni",
        noKnife.some(p => /Potrzebny nóż/.test(p)) && !hive.smoke && hive.honey === honey0 + 1 && hive.wax === wax0 && hive.day > 0, { noKnife, hive });

    // ---------------------------------------------------------------- A6 Podgrodzie
    await t.setHour(8);
    await t.go(111, 66, 15, 8);
    await t.frames(30);
    const cab0 = await t.count(73), op0 = await Z("TownQuests.opinion()");
    await finishWork("plot:ogrodek_1");
    t.check("ogródek: pomoc rano motyką - 2 warzywa (kapusta) i Opinia +1", (await t.count(73)) === cab0 + 2 && (await Z("TownQuests.opinion()")) === op0 + 1);
    await t.go(111, 72, 72, 8);
    await t.frames(30);
    t.check("wysypisko odkryte przy podejściu", await Z("Okolice.isFound('wysypisko')"));
    await use(2217);
    await runEntry(0);
    await t.frames(30);
    const dump1 = await Z("Zasoby.state().dump");
    await popsSince();
    await use(2217);
    const dumpPops = await popsSince();
    t.check("wysypisko: grzebanie raz dziennie (łopatą 2 losowania), drugi raz dymek „Na dziś dość grzebania...”",
        dump1.hero > 0 && dump1.n === 2 && dumpPops.some(p => /Na dziś dość grzebania/.test(p)), { dump1, dumpPops });
    await run("TownQuests.start('D31'); const s = TownQuests.state(); s.v.zas_medalik = 1; s.v.zas_klucz = 1; s.v.zas_moneta_kruk = 1;");
    t.check("D31: trzy rzeczy z wysypiska spełniają krok „Znalezione: 3/3”", await Z("TownQuests.FX.d31Rzeczy.check() && TownQuests.FX.d31Rzeczy.vars().n === 3"));
    await t.go(111, 48, 72, 8);
    await t.frames(20);
    await run("$gameParty.loseItem($dataItems[62], 9);");
    await use(2220);
    const cm = await menuNames();
    await runEntry(0);
    const noShovel2 = await popsSince();
    await t.give(62, 1);
    const clay0 = await t.count(164);
    await use(2220);
    await runEntry(0);
    await t.frames(20);
    await use(2220);
    await runEntry(1);
    const muddy = await popsSince();
    t.check("glinianka: bez łopaty dymek; łopatą +2 Mokra glina; po deszczu woda na dnie „Mętna, z gliną. Tego się nie pije.”",
        !!cm && noShovel2.some(p => /Potrzebna łopata/.test(p)) && (await t.count(164)) === clay0 + 2 && muddy.some(p => /Mętna, z gliną/.test(p)) && !(await msgBusy()), { cm, noShovel2, muddy });

    // ---------------------------------------------------------------- A7 góry: ściana ciosowa, żyły rudy
    await t.go(13, 108, 82, 8);
    await t.frames(30);
    await popsSince();
    await use(2143);
    await runEntry(0);
    const noPick = await popsSince();
    await t.give(63, 1);
    await finishWork("quarry");
    t.check("ściana ciosowa: bez kilofa dymek „Potrzebny kilof.”; kilofem Blok kamienny, zostaje 5 z 6 na tydzień",
        noPick.some(p => /Potrzebny kilof/.test(p)) && (await t.count(188)) === 1 && (await Z("Zasoby.quarryLeft()")) === 5, noPick);
    await run("$gameSelfSwitches.setValue([13, 2146, 'A'], true); Zasoby.state().veins[2146] = $gameSystem.dayNightDay() - 8;");
    await t.go(21, 20, 15);
    await t.go(13, 108, 82, 8);
    const vein = await Z("[$gameSelfSwitches.value([13, 2146, 'A']), !!$gameMap.event(2146) && $gameMap.event(2146).findProperPageIndex() >= 0, /drop=85/.test($gameMap.event(2146).event().note)]");
    t.check("żyła rudy wykopana 8 dni temu odrasta, kiedy bohater wraca na mapę (Ruda 1-5: własna notatka)", vein[0] === false && vein[1] && vein[2], vein);

    // ---------------------------------------------------------------- A8 wybrzeże
    await t.go(125, 17, 66, 4);
    await run("Wyspa.forceTide('low');");
    await t.frames(30);
    const pool = await Z(`{ shown: $gameSelfSwitches.value([125, 2225, 'A']), crabs: Zasoby.crabsLeft('kaluza_1'), found: Okolice.isFound('zatoczka') }`);
    t.check("zatoczka (odkryta): w odpływie kałuża widoczna, 1-2 kraby", pool.shown && pool.crabs >= 1 && pool.crabs <= 2 && pool.found, pool);
    await t.locate(16, 65, 4);
    await popsSince();
    await use(2225);
    const pm = await menuNames();
    await runEntry(pm ? pm.length - 1 : 0);
    const salt = await popsSince();
    t.check("kałuża: „Napij się” daje dymek „Słona. Morskiej wody się nie pije.”", salt.some(p => /Słona/.test(p)) && !(await msgBusy()), { pm, salt });
    const crab0 = await t.count(186);
    for (let k = 0; k < 6 && (await Z("Zasoby.crabsLeft('kaluza_1')")) > 0; k++) { await use(2225); await runEntry(0); }
    const crabPops = await popsSince();
    t.check("łapanie kraba: złapany (+Surowy krab) albo „Szczypie!” (nie więcej niż 2 na odpływ)", (await t.count(186)) > crab0 || crabPops.some(p => /Szczypie/.test(p)), { got: (await t.count(186)) - crab0, crabPops });
    await run("Wyspa.forceTide('high');");
    await t.frames(30);
    t.check("przypływ: kałuży nie widać", !(await Z("$gameSelfSwitches.value([125, 2225, 'A'])")));
    await run("Wyspa.forceTide(null); Zasoby.state().drift[125] = []; Zasoby.addDrift([125]); Zasoby.sync();");
    await t.frames(10);
    const drift = await Z("Zasoby.state().drift[125].slice()");
    const dId = drift.length ? (drift[0] === 0 ? 2227 : 2228) : 0;
    const dCell = dId === 2227 ? [17, 66] : [18, 65];
    await t.locate(dCell[0] - 1, dCell[1], 6);
    const w0 = await t.count(189);
    await use(dId);
    await t.frames(70);
    t.check("drewno dryfowe po sztormie/dniu leży na brzegu i daje się zebrać (+1 Drewno dryfowe)", drift.length >= 1 && (await t.count(189)) === w0 + 1, drift);

    // ---------------------------------------------------------------- A9 sad Ługów
    await t.go(168, 61, 22, 8);
    await t.frames(30);
    await popsSince();
    await use(2169);
    await runEntry(0);
    const noShears = await popsSince();
    await t.give(142, 1);
    const coal0 = await t.count(79);
    await finishWork("tree:0");
    t.check("spalona jabłonka: bez nożyc/siekiery dymek; przycięta (+1 Węgiel drzewny)", noShears.some(p => /Potrzebne nożyce albo siekiera/.test(p)) && (await Z("Zasoby.state().orchard[0].st")) === 1 && (await t.count(79)) === coal0 + 1, noShears);
    await use(2169);
    await runEntry(0);
    const noSalve = await popsSince();
    await t.give(195, 1);
    await use(2169);
    await runEntry(0);
    await t.frames(30);
    await use(2169);
    await runEntry(0);
    const noCan = await popsSince();
    await t.give(87, 1);
    await run("Farming.farm().can = { charges: 3 };");
    await use(2169);
    await runEntry(0);
    await run("const t0 = Zasoby.state().orchard[0]; t0.wd = [$gameSystem.dayNightDay() - 2, $gameSystem.dayNightDay() - 1];");
    await t.frames(10);
    const tr = await Z(`{ st: Zasoby.state().orchard[0].st, wd: Zasoby.state().orchard[0].wd.length, can: Farming.canCharges() }`);
    await run("const t0 = Zasoby.state().orchard[0]; t0.st = 3; t0.wd = [$gameSystem.dayNightDay() - 2, $gameSystem.dayNightDay() - 1];");
    await use(2169);
    await runEntry(0);
    const tr2 = await Z(`{ st: Zasoby.state().orchard[0].st, leaf: Zasoby.state().orchard[0].leaf - $gameSystem.dayNightDay(), view: Zasoby.treeView(0) }`);
    t.check("sad: maść (bez niej dymek), podlewanie konewką (bez niej dymek; jedno podlanie zabiera porcję konewki), po trzech dniach drzewo żyje (liście za 10 dni)",
        noSalve.some(p => /Maść szczepiarska/.test(p)) && noCan.some(p => /Potrzebna konewka/.test(p)) && tr.st === 3 && tr.can === 2 && tr2.st === 4 && tr2.leaf === 10 && tr2.view === "dressed", { noSalve, noCan, tr, tr2 });
    t.check("K58: warunek „Gotowe drzewa” liczy żywe drzewa (1/8)", (await Z("TownQuests.FX.k58Sad.vars().n")) === 1);

    // ---------------------------------------------------------------- A10 pola mieszczan (wiosna, dzień 3 pory: siew)
    await t.setDay(3, 8);
    await t.go(8, 10, 109, 8);
    await t.frames(30);
    const gold0 = await t.gold(), barley0 = await t.count(74);
    await finishWork("field:pole_1");
    t.check("pole mieszczan wiosną: dniówka przy siewie - 15 G i 2 plony, raz dziennie", (await t.gold()) === gold0 + 15 && (await t.count(74)) === barley0 + 2 && (await Z("Zasoby.state().fieldDay")) === 3);

    // ---------------------------------------------------------------- głęboki sen
    await run("$gameSystem.setStamina(10); $gameSystem.addBuff('gleboki_sen', 18); Tawerna.emit('wake', { day: $gameSystem.dayNightDay(), hour: 7, from: 22 });");
    await t.dismiss();   // (the day's summary after a night, then the map again)
    await t.frames(30);
    const deep = await Z(`{ st: $gameSystem.stamina(), max: $gameSystem.maxStamina(), buff: $gameSystem.hasBuff('gleboki_sen') }`);
    t.check("napar z kozłka: po pierwszym śnie +20% sił, premia znika", deep.st >= 10 + Math.round(deep.max * 0.2) - 1 && !deep.buff, deep);

    // ---------------------------------------------------------------- F9, miejsca, odkrycia
    const f9 = await Z(`(function(){ const sec = Okolice.f9.sections().find(s => s.owner === 'Zasoby'); if (!sec) return null;
        const row = w => Object.assign({ owner: 'Zasoby' }, sec.rows.find(r => r.what === w));
        const g = row('go'); Okolice.f9.pick(g, 3); const go = Okolice.f9.ok(g);
        const wl = row('well'); Okolice.f9.pick(wl, 2); Okolice.f9.ok(wl);
        const tr = row('tree'); Okolice.f9.pick(tr, 4); Okolice.f9.ok(tr);
        return { title: sec.title, rows: sec.rows.length, go: go && go.go, well: Zasoby.state().well.stage, tree: Zasoby.treesAlive() }; })()`);
    t.check("F9: sekcja paczki A (idź do miejsca, deszcz, upał, śnieg, pływ, sztorm, studnia, sad, D30, limity)", !!f9 && f9.rows >= 10 && f9.well === 2 && f9.tree === 8, f9);
    if (f9 && f9.go) {
        await t.go(f9.go[1], f9.go[2], f9.go[3]);
        t.check("F9 „Idź do”: przenosi na miejsce paczki (" + f9.go[0] + ")", (await Z("$gameMap.mapId()")) === f9.go[1] && (await Z("$gamePlayer.x")) === f9.go[2], f9.go);
    }
    const reg = await Z(`{ spots: Okolice.spots().filter(s => s.pkg === 'A').length, disc: Okolice.discoverables().filter(d => d.pkg === 'A').map(d => d.key) }`);
    t.check("Okolice: miejsca paczki A zarejestrowane, 15 odkryć (5 źródełek, zagroda, ule, 2 kręgi, polanka, wysypisko, glinianka, ściana, zatoczka, sad)",
        reg.spots >= 30 && reg.disc.length === 15, reg);

    // ---------------------------------------------------------------- zapis i wczytanie
    await run("const s = Zasoby.state(); s.jagna.trust = -5; s.quarry = { from: $gameSystem.dayNightDay(), n: 3 }; s.springs.zrodlo_021 = { day: $gameSystem.dayNightDay(), used: 1 };");
    await t.saveTo(1);
    await run("const s = Zasoby.state(); s.jagna.trust = 9; s.well.stage = 0;");
    await t.loadFrom(1);
    const loaded = await Z(`{ trust: Zasoby.state().jagna.trust, well: Zasoby.state().well.stage, q: Zasoby.state().quarry.n, sp: Zasoby.state().springs.zrodlo_021 && Zasoby.state().springs.zrodlo_021.used, trees: Zasoby.treesAlive() }`);
    t.check("zapis i wczytanie: stan paczki (zaufanie Jagny, studnia, ściana, źródełka, sad) wraca", loaded.trust === -5 && loaded.well === 2 && loaded.q === 3 && loaded.sp === 1 && loaded.trees === 8, loaded);
    await restoreWeather();
});
