// Biały orzeł (2026-10-18; docs/orzel/KONCEPCJA.md): D29 „Jajo z grani” i W13 „Skrzydlata Straż” - js/plugins/Orzel_Data.js, Orzel.js,
// Orzel_Lot.js; mapa 175 „Orla Grań” z tools/orzel/gran.py (tools/orzel/install.py), arkusze z tools/orzel/build_sheets.py. Sprawdza:
//   - wtyczki, kolejność, dane (przedmioty 182-184, ikony 453+, mapa 175 pod 13, budowle: kosz / gniazdo / grzęda, rękawica w garbarni),
//     zakres numerów 500-539, arkusze etapów 1-5 i lotu, Tawerna.view przy x1 bez zmian
//   - Map013 bez zmian w pliku; ścieżka wspinaczy (500-501) wstawiana przy wczytaniu: zamknięta przed czasem (popup), otwarta, gdy jajo
//     czeka; Orla Grań: rzeczy z historii (510-516), zejście (520-522); jajo z gniazda: D29 zrobione, W13 rusza, gniazdo puste
//   - ciepło jaja (zimno na grani, ciepło w domu), wyklucie po 36 godzinach, ekran imienia (puste = „Śnieżny”), W13 rozdz. 2
//   - dni opieki: dobry dzień się liczy, głodny nie (więź w dół), etapy (pisklę -> młody), karmienie (mięso, bez mięsa popup, syty),
//     woda tylko z wiadra / bukłaka (bez wody popup), nigdy nie daje wody bohaterowi
//   - gniazdo na polu: menu (miska, woda, menu orła, przebudowa dopiero po Kleofasie), orzeł je i pije z miski; pióro przy podrostku;
//     „Wracaj do gniazda” - sam leci do gniazda i w nim siada
//   - dorosły za bohaterem: pieszo na otwartym; daleko / gdzie się nie mieści - podmuch, „wzbił się”, wysoko nad nim (tylko cień, bez skrzydeł
//     w locie - te są tylko przy jeździe); ląduje w podmuchu po ok. 4 s z miejscem obok; płynny chód; dorosły do gniazda tak samo
//   - zaniedbany odlatuje na grań, za wcześnie nie wraca (popup), po trzech dniach wraca na zawołanie
//   - walka: dorosły szarpie wilka (zabity wilk = doświadczenie bohatera), zając i pies to nie wrogowie, człowieka nigdy nie zabija;
//     bez siły skrzydeł odlatuje odpocząć daleko od walki i wraca na ziemię walczyć dalej
//   - lot na prawie dorosłym (mniejszy w powietrzu, bez nurkowania), podrostek nie uniesie
//   - lot: start (x0,5, tilemapa 2x, ekran 2x pól, noc na cały widok, bez zapisu, bez ciosów, Q nie otwiera budowania), Q nisko / wysoko,
//     przelot krawędzią Map003 -> Map023 w powietrzu, lądowanie (x1, wszystko jak przed lotem), lądowisko zapamiętane, W13 lot
//   - lądowanie w mieście tylko na placu (Map008), noc i deszcz w locie bez błędów
//   - kradzież (W13 rozdz. 5): w nocy przy gnieździe, rano „zabrali go”, klatka na grani ze strażą, „Najpierw strażnicy!”, uwolnienie
//   - Akt III: dorosły z więzią broni tawerny (fale w1 i w2 o jednego mniej), epilog; F9 (8 wierszy), zapis i wczytanie
//   - walka naprawdę: wilk z watahy przerzuca się na orła (najwyżej 2) i go gryzie, wysoko orzeł bezpieczny, bez podwójnych obrażeń;
//     bandyta bije orła wręcz; łucznik trafia orła na ziemi i w niskim locie z jeźdźcem (nie jeźdźca), wysoko nie; ranny w locie - ląduj
// Uruchom: CDP_PORT=9542 node tests/orzel_test.js (serwer: node tools/serve.js)
const fs = require("fs");
const path = require("path");
const kit = require("./lib/kit.js");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(__dirname, "orzel");

kit.test({ port: 9542, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    fs.mkdirSync(OUT, { recursive: true });
    const shot = name => t.shot(path.join(OUT, name));
    // a transfer that comes up for sure (a busy server: once more), the map's id checked
    const go = async (map, x, y, dir, o) => {
        for (let i = 0; i < 3; i++) { if (await t.go(map, x, y, dir, o) && (await t.eval("$gameMap.mapId()")) === map) return true; await t.frames(30); }
        console.log("NOTE przejście na Map" + map + " się nie udało");
        return false;
    };
    const S = expr => t.json("(function(){ const s = Orzel.state(); return " + expr + "; })()");
    // the bird against its nest's picture: the nest's sprite, the bird's holder, the front rim in the tilemap's order; the pose
    const NEST_INFO = `(function(){ const e = Orzel.eagle, tm = SceneManager._scene._spriteset._tilemap; if (!e) return null;
        const ent = SceneManager._scene._spriteset._buildingSprites._sprites.find(x => x.b.id === e.perched), ns = ent && ent.sprite;
        const ix = sp => sp && sp.parent === tm ? tm.children.indexOf(sp) : -1;
        const rim = e.rim, rb = rim && rim.children[0] && rim.children[0].bitmap;
        const P = Orzel.poseOf(), top = e.holder ? e.holder.y + e.body.y - e.body.height * e.body.anchor.y : 0;
        return { nested: !!e.nested, perched: e.perched, inNest: !!e.inNest, pose: e.pose && e.pose.kind, posed: !!(e.pose && P), dir: e.dir,
            body: !!(e.body && e.body.visible && e.body.alpha > 0.9), bmp: e.body && e.body.bitmap && e.body.bitmap.url,
            nest: ns ? { x: ns.x, y: ns.y, w: ns.width, h: ns.height, i: ix(ns) } : null,
            holder: e.holder ? { x: e.holder.x, y: e.holder.y, i: ix(e.holder), feet: e.holder.y + e.body.y, top } : null,
            rim: rim ? { i: ix(rim), y: rim.y, vis: rim.visible, img: rb ? rb.url : "" } : null, shadow: !!(e.shadow && e.shadow.visible) }; })()`;
    // the pose's picture now against the standing one: its opaque height (a lying bird is low - under 0.7 of standing)
    const LOW = `(function(){ const e = Orzel.eagle, P = Orzel.poseOf(), sh = OrzelData.SHEETS[Orzel.state().stage]; if (!e || !e.pose || !P) return null;
        const col = P[e.pose.kind][0] + Math.min(P[e.pose.kind][1] - 1, Math.floor(e.pose.i));
        const hOf = (bmp, x, y, c) => { const cv = document.createElement("canvas"); cv.width = cv.height = c; const g = cv.getContext("2d");
            g.drawImage(bmp._image || bmp._canvas, x, y, c, c, 0, 0, c, c); const d = g.getImageData(0, 0, c, c).data; let top = c, bot = -1;
            for (let yy = 0; yy < c; yy++) for (let xx = 0; xx < c; xx++) if (d[(yy * c + xx) * 4 + 3] > 40) { if (yy < top) top = yy; bot = yy; } return bot - top + 1; };
        const lie = hOf(ImageManager.loadSystem(P.file), col * P.cell, 0, P.cell), stand = hOf(ImageManager.loadSystem(sh.file), 0, 0, sh.cell);
        return { kind: e.pose.kind, col, last: col === P.sit[0] + P.sit[1] - 1 || e.pose.kind !== "sit", ratio: +(lie / stand).toFixed(2), file: P.file }; })()`;
    const inBowl = n => !!n && n.nested && n.body && !!n.nest && !!n.holder && !!n.rim && n.rim.vis && n.nest.i >= 0 && n.nest.i < n.holder.i && n.holder.i < n.rim.i
        && Math.abs(n.holder.x - n.nest.x) < n.nest.w / 2 && n.holder.feet < n.nest.y && n.holder.feet > n.nest.y - n.nest.h && !n.shadow;
    const hrs = h => t.eval(`(function(){ $gameSystem.advanceDayNight(${h}); Orzel.tickNeeds(); return 0; })()`);
    // a day of care as the clock writes it (food, water: the day's average; cold: a cold night), then the new day
    const day = (food, water, cold) => t.json(`(function(){ const s = Orzel.state(); s.dayLog = { d: $gameSystem.dayNightDay(), food: ${food} * 24, water: ${water} * 24, n: 24, cold: ${!!cold} };
        s.clock = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour(); Orzel.newDay(); return { care: s.care, stage: s.stage, bond: s.bond, hungry: s.hungryDays }; })()`);

    // ================================================================ wtyczki, dane, grafika
    await t.newGame({ map: 3, x: 20, y: 15, day: 40, hour: 11, quiet: true, minimap: false });
    const base = await t.json(`(function(){ const D = OrzelData, B = Farming.BUILDINGS, ix = n => $plugins.findIndex(p => p.name === n && p.status);
        const tan = (B.tannery.recipes || []).find(r => r.id === "glove_falconer");
        return { api: !!window.Orzel && !!window.OrzelLot && Orzel === Tawerna.api("Orzel") && OrzelLot === Tawerna.api("Orzel_Lot"),
            order: [ix("Kruk_Data"), ix("Orzel_Data"), ix("TownQuests_Data"), ix("Starcia"), ix("Orzel"), ix("Orzel_Lot")],
            quests: !!TownQuests.Q.D29 && !!TownQuests.Q.W13, giver: TownQuests.Q.D29.giver, w13: TownQuests.Q.W13.steps.length,
            items: [182, 183, 184].map(i => $dataItems[i] && [$dataItems[i].name, $dataItems[i].iconIndex]),
            map: $dataMapInfos[175] && [$dataMapInfos[175].name, $dataMapInfos[175].parentId],
            b: ["orzel_kosz", "orzel_gniazdo", "orzel_grzeda"].map(k => B[k] && [B[k].w, B[k].h, B[k].image, B[k].foodOnly, B[k].bowl, B[k].needFlag || "", !!B[k].noBuild]),
            up: B.orzel_gniazdo.upgrade && [B.orzel_gniazdo.upgrade.to, B.orzel_gniazdo.upgrade.needFlag],
            glove: tan && [tan.inputs.map(x => x.join("x")).join(), tan.output.join("x")],
            ids: Tawerna.inject.list().filter(r => r.owner === "Orzel").map(r => r.ids),
            view: [Tawerna.view.scale(), Tawerna.view.w() === Graphics.width, Tawerna.view.h() === Graphics.height, $gameMap.screenTileX() === Math.round(Graphics.width / 48 * 16) / 16],
            sheets: Object.keys(D.SHEETS).map(k => [D.SHEETS[k].file, D.SHEETS[k].cell, !!D.SHEETS[k].walk]), air: Object.keys(D.AIR).map(k => D.AIR[k].file) }; })()`);
    t.check("Orzel_Data, Orzel i Orzel_Lot w grze, w kolejności (dane nad TownQuests_Data, logika pod Starcia)",
        base.api && base.order.every(i => i >= 0) && base.order[0] < base.order[1] && base.order[1] < base.order[2] && base.order[3] < base.order[4] && base.order[4] < base.order[5], base.order);
    t.check("zadania D29 (od latarnika) i W13 (7 rozdziałów); przedmioty 182 Orle jajo / 183 Rękawica sokolnika / 184 Pióro białego orła (ikony 453-455); mapa 175 „Orla Grań” pod 13",
        base.quests && base.giver === "latarnik" && base.w13 === 7 && JSON.stringify(base.items) === '[["Orle jajo",453],["Rękawica sokolnika",454],["Pióro białego orła",455]]'
        && base.map && base.map[0] === "Orla Grań" && base.map[1] === 13, base);
    t.check("budowle: Kosz z sianem 1x1 (po jaju), Orle gniazdo 3x3 (od podrostka) z przebudową na Orlą grzędę 4x4 (po Kleofasie); miski na mięso; rękawica: 2× Skóra + Ścięgno",
        JSON.stringify(base.b) === '[[1,1,"Farm_OrzelKosz",true,3,"orzelJajo",false],[3,3,"Farm_OrzelGniazdo",true,6,"orzelPodrostek",false],[4,4,"Farm_OrzelGrzeda",true,6,"",true]]'
        && base.up && base.up.join() === "orzel_grzeda,orzelKroniki" && base.glove && base.glove[1] === "183x1", base);
    t.check("numery zdarzeń 500-539 zgłoszone w rejestrze (Tawerna.inject); widok x1: Tawerna.view jak ekran, pola na ekranie bez zmian",
        base.ids.length > 0 && base.ids.every(r => String(r).split("-").every(n => Number(n) >= 500 && Number(n) <= 539)) && base.view.join() === "1,true,true,true", base);
    await t.eval(`(function(){ for (const k of ["Orzel1","Orzel2","Orzel3","Orzel4","Orzel5","Orzel4_Lot","Orzel5_Lot","Farm_OrzelKosz","Farm_OrzelGniazdo","Farm_OrzelGrzeda"]) ImageManager.loadSystem(k);
        for (const k of ["!$Orzel_Gniazdo","!$Orzel_Orlica","!$Orzel_Strzaly","!$Orzel_Misa","!$Orzel_Klatka"]) ImageManager.loadCharacter(k); return 0; })()`);
    await t.frames(30);
    const imgs = await t.json(`(function(){ const D = OrzelData, out = {};
        for (const k of Object.keys(D.SHEETS)) { const b = ImageManager.loadSystem(D.SHEETS[k].file), sh = D.SHEETS[k], cols = Math.max(1, ...["walk","atk","flap"].map(a => sh[a] ? sh[a][0] + sh[a][1] : 1));
            out[sh.file] = [b.width, b.height, b.width === cols * sh.cell && b.height === 8 * sh.cell]; }
        for (const k of Object.keys(D.AIR)) { const b = ImageManager.loadSystem(D.AIR[k].file); out[D.AIR[k].file] = [b.width, b.height, b.width === D.AIR[k].cell * D.AIR[k].frames]; }
        for (const k of ["!$Orzel_Gniazdo","!$Orzel_Orlica","!$Orzel_Strzaly","!$Orzel_Misa","!$Orzel_Klatka"]) { const b = ImageManager.loadCharacter(k); out[k] = [b.width, b.height, b.width > 0]; }
        const ic = ImageManager.loadSystem("IconSet"); out.icons = ic.height >= Math.ceil(458 / 16) * 32;
        return out; })()`);
    t.check("arkusze etapów 1-5 (8 wierszy × komórki z Orzel_Data SHEETS: postój, chód, atak, podloty), lot 4 i 5 (9 klatek), rzeczy na grani, ikony do 457",
        Object.keys(imgs).filter(k => k !== "icons").every(k => imgs[k][2]) && imgs.icons, imgs);

    // ================================================================ Map013: ścieżka wspinaczy (plik mapy bez zmian)
    const m13 = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "Map013.json"), "utf8"));
    t.check("Map013.json bez zmian: w pliku nie ma ścieżki wspinaczy ani numerów 500-539 (wstawiane przy wczytaniu)",
        !m13.events.some(e => e && (/wspinaczy|Orla Grań/.test(e.name) || (e.id >= 500 && e.id <= 539))), m13.events.filter(e => e && e.id >= 500 && e.id <= 539).map(e => e.id));
    await go(13, 53, 7, 8);
    const way = await t.json(`[500, 501].map(i => { const e = $gameMap.event(i); return e ? [e.x, e.y, e.event().name, e.isNormalPriority()] : null; })`);
    t.check("Map013: ścieżka wspinaczy (500-501) na (53,6) i (54,6), nad wysoką półką", way.every(Boolean) && way[0][0] === 53 && way[0][1] === 6 && way[1][0] === 54 && way[1][1] === 6, way);
    await t.popups({ clear: true });
    await t.eval("$gameMap.event(500).start(); 0");
    await t.frames(40);
    const locked = { map: await t.eval("$gameMap.mapId()"), pops: await t.popups({ clear: true }) };
    t.check("przed czasem (nie Akt II, bez D29, jajo nie czeka): ściana za stroma - popup, bez przejścia", locked.map === 13 && locked.pops.some(p => /za stroma/.test(p)), locked);
    await t.eval("(function(){ Orzel.f9({ what: 'gotowe' }); return 0; })()");
    const pora = await t.json("({ ready: Orzel.eggReady(), offer: TownQuests.FX.d29Pora.cond() })");
    t.check("jajo czeka (F9 / Akt II po burzy): Orzel.eggReady(), oferta Bazylego (d29Pora) otwarta", pora.ready && pora.offer, pora);
    await t.eval("$gameMap.event(500).start(); 0");
    const up = await t.until(t.onMap(175), 20);
    await t.frames(30);
    await t.eval("SceneManager._scene.startFadeIn(1, false); 0");
    await t.calm();
    const gran = await t.json(`(function(){ const ev = id => { const e = $gameMap.event(id); return e ? { x: e.x, y: e.y, pic: e.characterName(), dir: e.direction(), name: e.event().name } : null; };
        return { at: [$gamePlayer.x, $gamePlayer.y], name: $gameMap.displayName(), size: [$dataMap.width, $dataMap.height], outdoors: Survival.isOutdoors(),
            things: [510, 511, 512, 513, 514, 515, 516].map(ev), down: [520, 521, 522].map(ev) }; })()`);
    t.check("akcja przy kołkach -> Orla Grań (Map175, 80×60 od 2026-10-18 - tools/powieksz, pod chmurami) na (20,57)", up && gran.at.join() === "20,57" && gran.name === "Orla Grań" && gran.size.join() === "80,60" && gran.outdoors, gran);
    t.check("na grani: rozbite gniazdo z jajem (510), martwa orlica, strzały z białym okiem, misa, płyta, zimny obóz, pusta klatka (516); zejście 520-522",
        gran.things.every(Boolean) && gran.things[0].pic === "!$Orzel_Gniazdo" && gran.things[0].dir === 2 && gran.things[1].pic === "!$Orzel_Orlica" && gran.things[6].pic === "!$Orzel_Klatka" && gran.things[6].dir === 4
        && gran.down.every(Boolean), gran);
    await shot("01_orla_gran.png");
    await t.popups({ clear: true });
    await t.eval("Orzel.look('orlica'); Orzel.look('strzaly'); 0");
    const story = await t.popups({ clear: true });
    t.check("orlica i strzały opowiadają (popupy): dwie strzały, lotki z białym okiem, Czarne Oczy", story.some(p => /orlica/.test(p)) && story.some(p => /białym okiem|otwartego oka/.test(p)), story);
    const xp0 = await t.eval("Combat.hero().xp");
    await t.eval("Orzel.look('gniazdo'); 0");
    await t.frames(20);
    const egg = await t.json(`({ n: $gameParty.numItems($dataItems[182]), have: Orzel.state().have, stage: Orzel.state().stage, d29: TownQuests.isDone("D29"), w13: TownQuests.isActive("W13"),
        flag: !!TownQuests.state().flags.orzelJajo, nest: $gameMap.event(510).direction(), xp: Combat.hero().xp })`);
    t.check("jajo z gniazda: Orle jajo w torbie, D29 zrobione (100 dośw.), flaga orzelJajo, W13 rusza samo, gniazdo puste",
        egg.n === 1 && egg.have && egg.stage === 0 && egg.d29 && egg.w13 && egg.flag && egg.nest === 4 && egg.xp >= xp0 + 100, Object.assign({ xp0 }, egg));

    // ================================================================ ciepło jaja, wyklucie, imię
    await hrs(3);
    const cold = await S("({ warm: s.egg.warm, cold: s.egg.cold })");
    t.check("na grani (pod niebem, bez ognia) jajo stygnie: 3 godziny zimna, ani godziny ciepła", cold.warm === 0 && cold.cold >= 3, cold);
    await go(19, 2, 5, 2);
    await hrs(3);
    const warm = await S("({ warm: s.egg.warm, cold: s.egg.cold, w13: TownQuests.rec('W13').step })");
    t.check("w domu dziadka jajo grzeje się (3 godziny ciepła), W13 rozdz. 1", warm.warm >= 3 && warm.cold === 0 && warm.w13 === 0, warm);
    await t.eval("Orzel.state().egg.warm = 34; 0");
    await hrs(3);
    const hatched = await S("({ stage: s.stage, n: $gameParty.numItems($dataItems[182]), flag: !!TownQuests.state().flags.orzelWyklul })");
    t.check("po 36 godzinach w cieple: wyklucie (pisklę, jaja nie ma w torbie, flaga orzelWyklul)", hatched.stage === 1 && hatched.n === 0 && hatched.flag, hatched);
    const named = await t.until("SceneManager._scene && !(SceneManager._scene instanceof Scene_Map) && !SceneManager.isSceneChanging()", 10);
    await t.frames(20);
    await shot("02_imie.png");
    await t.eval("(function(){ const sc = SceneManager._scene; if (sc && sc.done) sc.done(); return 0; })()");
    await t.until(t.onMap(19), 10);
    await t.frames(40);
    const nm = await t.json(`({ name: Orzel.state().name, w13: TownQuests.rec('W13').step, eagle: !!Orzel.eagle && !!(Orzel.eagle.holder && Orzel.eagle.holder.parent), map: Orzel.state().map })`);
    t.check("ekran imienia po wykluciu; puste pole = „Śnieżny”; W13 dalej (rozdz. 2: pokaż dziadkowi); pisklę stoi przy bohaterze (w izbie)",
        named && nm.name === "Śnieżny" && nm.w13 === 1 && nm.eagle && nm.map === 19, nm);
    await shot("03_piskle.png");

    // ================================================================ dni opieki, etapy, karmienie, woda
    const good = await day(80, 80);
    t.check("dobry dzień (najedzony, napojony, ciepło) się liczy: 1 dzień opieki", good.care === 1 && good.stage === 1, good);
    const bad = await day(10, 80);
    t.check("głodny dzień się nie liczy: dni opieki bez zmian, więź w dół, dzień głodu", bad.care === 1 && bad.hungry === 1 && bad.bond < good.bond, { good, bad });
    const coldDay = await day(80, 80, true);
    t.check("zmarznięta noc pisklęcia: dzień się nie liczy", coldDay.care === 1, coldDay);
    await t.popups({ clear: true });
    await t.notices({ clear: true });
    let st2 = null;
    for (let i = 0; i < 4; i++) st2 = await day(85, 85);
    const upPops = (await t.popups({ clear: true })).concat(await t.notices({ clear: true }));
    t.check("5 dni opieki: młody (etap 2) i popup „podrósł”", st2.care === 5 && st2.stage === 2 && upPops.some(p => /podrósł/.test(p)), { st2, upPops });
    await t.eval("(function(){ $gameParty.loseItem($dataItems[94], 99); Orzel.state().food = 30; return 0; })()");
    await t.popups({ clear: true });
    await t.eval("Orzel.feed(); 0");
    const noMeat = await t.popups({ clear: true });
    await t.eval("$gameParty.gainItem($dataItems[94], 2); 0");
    const fed = await t.json("(function(){ const f0 = Orzel.state().food, ok = Orzel.feed(); return { ok, f0, f1: Orzel.state().food, left: $gameParty.numItems($dataItems[94]) }; })()");
    await t.eval("Orzel.state().food = 99; 0");
    await t.eval("Orzel.feed(); 0");
    const full = await t.popups({ clear: true });
    t.check("karmienie: bez mięsa popup, surowe mięso syci (sztuka z torby), syty nie je",
        noMeat.some(p => /Nie masz mięsa/.test(p)) && fed.ok && fed.f1 > fed.f0 && fed.left === 1 && full.some(p => /nie jest głodny/.test(p)), { noMeat, fed, full });
    const w0 = await t.json(`(function(){ $gameSystem._bagWater = 0; if (window.Needs && Needs.state) Needs.state().skin = 0; Orzel.state().water = 20; return Needs && Needs.state ? Needs.state().water : null; })()`);
    await t.eval("Orzel.giveWater(); 0");
    const noWater = await t.popups({ clear: true });
    const watered = await t.json(`(function(){ $gameParty.gainItem($dataItems[138], 1); $gameSystem._bagWater = 2; const ok = Orzel.giveWater();
        return { ok, w: Orzel.state().water, bag: $gameSystem._bagWater, hero: Needs && Needs.state ? Needs.state().water : null }; })()`);
    t.check("woda: bez wody popup; porcja z wiadra w torbie do orła; bohater nic od orła nie dostaje (susza)",
        noWater.some(p => /Nie masz wody/.test(p)) && watered.ok && watered.w > 20 && watered.bag === 1 && watered.hero === w0, { noWater, watered, w0 });

    // ================================================================ gniazdo na polu, pióro
    await go(3, 20, 15, 2);
    await t.frames(30);
    const came = await t.json("({ map: Orzel.state().map, eagle: !!Orzel.eagle })");
    t.check("młody idzie za bohaterem z domu na pole (Map003)", came.map === 3 && came.eagle, came);
    const nestAt = await t.json(`(function(){ const p = $gamePlayer; for (let r = 2; r < 16; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++)
        if (!Farming.whyNotBuild("orzel_gniazdo", p.x + dx, p.y + dy, false, true)) return { x: p.x + dx, y: p.y + dy }; return null; })()`);
    await t.eval(`(function(){ const f = $gameSystem._farm, list = (f.buildings[3] = f.buildings[3] || []); list.push({ id: f.nextId++, type: "orzel_gniazdo", x: ${nestAt.x}, y: ${nestAt.y}, last: 1 }); f.rev++; return 0; })()`);
    await t.frames(10);
    const menu = await t.json(`(function(){ const b = Orzel.nests()[0].b, m = Farming.menuFor(b.x, b.y), names = m.entries.map(e => e.name);
        TownQuests.state().flags.orzelKroniki = $gameSystem.dayNightDay();
        const m2 = Farming.menuFor(b.x, b.y), names2 = m2.entries.map(e => e.name); delete TownQuests.state().flags.orzelKroniki;
        return { names, names2, note: m.note }; })()`);
    t.check("Orle gniazdo: w menu miska na jedzenie, „Nalej wody do miski”, menu orła; przebudowa na grzędę dopiero po Kleofasie (orzelKroniki)",
        !!nestAt && menu.names.includes("Miska: jedzenie") && menu.names.includes("Nalej wody do miski") && menu.names.includes("Orzeł: Śnieżny")
        && !menu.names.includes("Przebuduj na Orlą grzędę") && menu.names2.includes("Przebuduj na Orlą grzędę") && /Miska: jedzenie/.test(menu.note || ""), menu);
    await t.popups({ clear: true, gains: true });
    const pod = await t.json(`(function(){ Orzel.forceStage(3); const s = Orzel.state(); return { stage: s.stage, feather: $gameParty.numItems($dataItems[184]), flag: !!TownQuests.state().flags.orzelPodrostek }; })()`);
    t.check("podrostek zrzuca pióro (184 w torbie), flaga orzelPodrostek", pod.stage === 3 && pod.feather === 1 && pod.flag, pod);
    const bowl = await t.json(`(function(){ const n = Orzel.nests()[0], b = n.b, s = Orzel.state(); $gameParty.gainItem($dataItems[94], 2);
        const put = Farming.putInChest(b, $dataItems[94], 2); b.bowlWater = 2; s.mode = "home"; s.food = 10; s.water = 10;
        $gameSystem.advanceDayNight(1); Orzel.tickNeeds();
        return { put, food: Math.round(s.food), water: Math.round(s.water), left: (b.store || {}).i94 || 0, bowlWater: b.bowlWater }; })()`);
    t.check("orzeł w gnieździe je z miski (mięso ubywa) i pije z niej (woda ubywa)", bowl.put === 2 && bowl.food > 30 && bowl.left < 2 && bowl.water > 50 && bowl.bowlWater < 2, bowl);
    // „Wracaj do gniazda” z orłem przy bohaterze (gniazdo na tej mapie): sam leci do gniazda i w nim siada
    await t.eval(`(function(){ Orzel.setMode('follow'); const e = Orzel.eagle, p = $gamePlayer; if (e) { e.perched = null; e.x = p.x + 0.5; e.y = p.y + 1.9; e.z = 0; e.state = 'stand'; }
        Orzel.setMode('home'); return 0; })()`);
    const sat = await t.until("!!(Orzel.eagle && Orzel.eagle.perched)", 12);
    const satInfo = await t.json(`(function(){ const e = Orzel.eagle, n = Orzel.nests()[0], np = Orzel.nestPoint(n);
        return { perched: e && e.perched, id: n.b.id, d: e ? Math.hypot(e.x - np.x, e.y - np.y) : null, mode: Orzel.state().mode }; })()`);
    t.check("„Wracaj do gniazda”: orzeł sam leci do gniazda na tej mapie i w nim siada", sat && satInfo.perched === satInfo.id && satInfo.d < 0.2 && satInfo.mode === "home", satInfo);
    // (2026-10-18, gniazda na miarę) w misie: po obrazie gniazda, przed jego przednią krawędzią (osobna warstwa nad nim), widoczny
    await t.eval(`(function(){ const n = Orzel.home(), p = $gamePlayer; $gameSystem.setDayNightHour(11); $gamePlayer.locate(n.b.x + 1, n.b.y + 5); $gamePlayer.center(n.b.x + 1, n.b.y + 5); return 0; })()`);
    const sitDown = await t.until("!!(Orzel.eagle && Orzel.eagle.pose && Orzel.eagle.pose.kind === 'sit')", 8);
    await t.frames(60);
    const nestPod = await t.json(NEST_INFO);
    t.check("podrostek w gnieździe 3x3: widoczny, w misie - rysowany po obrazie gniazda, przed przednią krawędzią (warstwa „_Przod” nad nim), bez własnego cienia",
        inBowl(nestPod) && /Farm_OrzelGniazdo_Przod/.test(nestPod.rim.img), nestPod);
    t.check("bohater daleko: w dzień siedzi w gnieździe (poza „siedzi”, obraz póz z przodu)", sitDown && nestPod.pose === "sit" && /Orzel3_Poza/.test(nestPod.bmp || ""), nestPod);
    await shot("04a_podrostek_w_gniezdzie.png");
    await t.eval(`(function(){ const e = Orzel.eagle; $gamePlayer.locate(Math.floor(e.x), Math.floor(e.y) + 1); $gamePlayer.setDirection(8); return 0; })()`);
    const stoodUp = await t.until("!!(Orzel.eagle && !Orzel.eagle.pose)", 6);
    await t.frames(20);
    const near = await t.json(NEST_INFO);
    t.check("bohater podchodzi (2 pola): wstaje i odwraca się do niego (w gnieździe, dalej w misie)", stoodUp && !near.pose && near.dir === 2 && inBowl(near), near);
    await t.eval(`(function(){ const n = Orzel.home(); $gamePlayer.locate(n.b.x + 1, n.b.y + 6); $gamePlayer.setDirection(2); $gameSystem.setDayNightHour(22); return 0; })()`);
    const asleep = await t.until("!!(Orzel.eagle && Orzel.eagle.pose && Orzel.eagle.pose.kind === 'sleep' && Orzel.eagle.pose.i >= Orzel.poseOf().sleep[1] - 1)", 12);
    await t.eval(`(function(){ const e = Orzel.eagle; $gamePlayer.locate(Math.floor(e.x), Math.floor(e.y) + 1); $gamePlayer.setDirection(8); return 0; })()`);
    await t.frames(90);
    const stillAsleep = await t.json(NEST_INFO);
    await shot("04b_podrostek_spi.png");
    await t.eval("Orzel.openMenu(); 0");
    await t.frames(40);
    const woke = await t.json("({ pose: Orzel.eagle.pose && Orzel.eagle.pose.kind, awake: !!Orzel.eagle.awake, menu: !!$gameTemp._farmMenuOpen })");
    await t.eval("(function(){ const sc = SceneManager._scene; if (sc.closeFarmMenu) sc.closeFarmMenu(); $gameTemp._farmMenuOpen = false; const n = Orzel.home(); $gamePlayer.locate(n.b.x + 1, n.b.y + 7); return 0; })()");
    const backToSleep = await t.until("!!(Orzel.eagle && Orzel.eagle.pose && Orzel.eagle.pose.kind === 'sleep')", 12);
    t.check("nocą śpi w gnieździe (głowa w piórach) i sam się nie budzi, nawet gdy bohater stoi tuż obok; budzi go dopiero bohater (menu), a gdy odejdzie - znowu zasypia",
        asleep && stillAsleep.pose === "sleep" && inBowl(stillAsleep) && woke.menu && woke.awake && woke.pose !== "sleep" && backToSleep, { asleep, stillAsleep: stillAsleep.pose, woke, backToSleep });
    await t.eval("(function(){ const s = Orzel.state(); s.hurtUntil = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() + 24; $gameSystem.setDayNightHour(11); return 0; })()");
    const lying = await t.until("!!(Orzel.eagle && Orzel.eagle.pose && Orzel.eagle.pose.kind === 'hurt')", 8);
    await t.frames(60);
    const hurtInfo = await t.json(NEST_INFO);
    await shot("04c_podrostek_ranny.png");
    t.check("ranny (doba leczenia): leży w gnieździe (poza „ranny”), w misie", lying && hurtInfo.pose === "hurt" && inBowl(hurtInfo), hurtInfo);
    await t.eval("(function(){ Orzel.state().hurtUntil = 0; Orzel.state().hp = Orzel.maxHp(); $gamePlayer.locate(20, 15); $gamePlayer.center(20, 15); return 0; })()");
    await t.eval("Orzel.setMode('follow'); 0");
    await t.frames(40);
    await shot("04_podrostek_gniazdo.png");

    // ================================================================ zaniedbany odlatuje, wraca
    await t.popups({ clear: true });
    const off = await t.json(`(function(){ const s = Orzel.state(); s.bond = 10; s.dayLog = { d: $gameSystem.dayNightDay(), food: 60 * 24, water: 60 * 24, n: 24, cold: false }; Orzel.newDay();
        return { away: !!s.away }; })()`);
    const offPops = await t.popups({ clear: true });
    await t.eval("Orzel.callKey(); 0");
    const soon = await t.popups({ clear: true });
    t.check("zaniedbany (więź < 15) odlatuje w góry (popupy, notatka); zawołany za wcześnie nie wraca (popup)",
        off.away && offPops.some(p => /odlatuje w stronę gór/.test(p)) && soon.some(p => /jeszcze nie wróci/.test(p)), { off, offPops, soon });
    const bond1 = await t.eval("(function(){ $gameSystem.advanceDayNight(73); Orzel.tickNeeds(); Orzel.callKey(); return Orzel.state().bond; })()");
    await t.frames(10);
    const back = await t.json("({ away: !!Orzel.state().away, bond: " + bond1 + ", eagle: !!Orzel.eagle })");
    const backPops = await t.popups({ clear: true });
    t.check("po trzech dniach wraca na zawołanie (L): więź co najmniej 25", !back.away && back.bond >= 25 && back.eagle && backPops.some(p => /wraca z gór/.test(p)), { back, backPops });
    await t.setHour(11);

    // ================================================================ walka: dorosły przy bohaterze
    await t.eval(`(function(){ Orzel.forceStage(5); const s = Orzel.state(); s.bond = 80; s.st = Orzel.maxSt(); s.name = "Śnieżny"; return 0; })()`);
    await t.frames(30);
    const fightAt = await t.json(`(function(){ const p = $gamePlayer, e = Orzel.eagle; return e ? { hx: p.x, hy: p.y, ex: e.x, ey: e.y } : null; })()`);
    const wolf = await t.json(`(function(){ const p = $gamePlayer; let at = null;
        for (let r = 3; r < 9 && !at; r++) for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, r]]) if (!at && $gameMap.isPassable(p.x + dx, p.y + dy, 2)) at = { x: p.x + dx, y: p.y + dy };
        const w = Hunting.spawn("wolf", at.x, at.y); w._summoned = true; w._engaged = true; w._maxHp = w._hp = 400; window.__w = w;
        const r = Hunting.spawn("rabbit", at.x, at.y + 1); window.__r = r;
        return { at, hp: w._hp, foe: Orzel.foeOk(w), rabbit: Orzel.foeOk(r), dog: Orzel.foeOk((window.Dog && Dog.dog) || { _realX: 0, _realY: 0 }) }; })()`);
    const mix = await t.json(`(function(){ const n = { szpony: 0, dziob: 0 }; for (let i = 0; i < 4000; i++) n[Orzel.pickAtk(OrzelData.FIGHT[5].atk)[0]]++;
        return { szpony: n.szpony / 4000, dziob: n.dziob / 4000, gap4: OrzelData.FIGHT[4].gap, gap5: OrzelData.FIGHT[5].gap }; })()`);
    t.check("ciosy losowo: szpony ok. 60%, dziób ok. 40%; prawie dorosły bije szybciej (26 klatek), dorosły jeszcze szybciej (20)",
        mix.szpony > 0.56 && mix.szpony < 0.64 && mix.gap4 === 26 && mix.gap5 === 20, mix);
    t.check("wróg orła: wilk w walce tak; zając, pies - nie", !!fightAt && wolf.foe && !wolf.rabbit && !wolf.dog, { fightAt, wolf });
    await t.eval("$gameMap.setDisplayPos(window.__w.x - $gameMap.screenTileX() / 2, window.__w.y - $gameMap.screenTileY() / 2); 0");
    const hit = await t.until("window.__w._hp < 400", 15);
    await t.frames(20);
    await shot("05_walka_wilk.png");
    const hitInfo = await t.json("({ hp: window.__w._hp, st: Orzel.state().st, max: Orzel.maxSt(), state: Orzel.eagle && Orzel.eagle.state })");
    t.check("dorosły rusza na wilka i rani go szponami / dziobem (siła skrzydeł w dół)", hit && hitInfo.st < hitInfo.max, hitInfo);
    const xpK = await t.eval("Combat.hero().xp");
    await t.eval("(function(){ window.__w._maxHp = 3; window.__w._hp = 3; return 0; })()");   // (whole life left: it does not run off - Hunting_AI flees under a quarter of it)
    const dead = await t.until("window.__w._dead || !Hunting.animals.includes(window.__w)", 15);
    await t.frames(20);
    const xpK2 = await t.eval("Combat.hero().xp");
    t.check("wilk zabity przez orła liczy się bohaterowi (doświadczenie)", dead && xpK2 > xpK, { dead, xpK, xpK2 });
    const man = await t.json(`(function(){ const p = $gamePlayer, h = Humans.spawn("bandit", p.x + 2, p.y, { tag: "f9", mode: "idle", level: 1 });
        h._engaged = true; h._band = h._band || {}; h._band._heroAlarm = true; h._hp = 5; const ok = Orzel.foeOk(h);
        Orzel.diveHit(Orzel.eagle, h); return { ok, hp: h._hp, dead: !!h._dead, surrendered: !!h._surrendered }; })()`);
    t.check("człowieka orzeł nigdy nie zabija: nurkowanie (39) zostawia mu życie, klęka albo ucieka", man.ok && !man.dead && man.hp >= 1, man);
    await t.eval("(function(){ Humans.clear(); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); return 0; })()");
    await t.frames(30);

    // ================================================================ zmęczony w walce: odlatuje odpocząć daleko od walki, wraca na ziemię i walczy dalej
    {   // (własny zakres nazw)
        await t.eval(`(function(){ $gamePlayer.locate(32, 13); $gamePlayer.center(32, 13); const e = Orzel.eagle, p = $gamePlayer; Orzel.setMode('follow');
            e.anim = null; e.foe = null; e.restAway = null; e.overhead = false; e.descending = false; e.state = 'stand'; e.z = 0; e.x = p.x + 3.5; e.y = p.y + 0.9;
            Orzel.state().st = Orzel.maxSt();
            const w = Hunting.spawn("wolf", p.x + 5, p.y + 2); w._frozen = true; w._engaged = true; w._summoned = true; w._maxHp = w._hp = 900; window.__w2 = w; return 0; })()`);
        const engaged = await t.until("!!(Orzel.eagle && Orzel.eagle.foe === window.__w2)", 8);
        await t.popups({ clear: true });
        await t.eval("(function(){ Orzel.state().st = 0; return 0; })()");
        const away = await t.until("!!(Orzel.eagle && Orzel.eagle.restAway && Orzel.eagle.overhead)", 5);
        await t.frames(150);
        const awayInfo = await t.json(`(function(){ const e = Orzel.eagle, w = window.__w2; return { phase: e.restAway && e.restAway.phase, dW: Math.hypot(e.x - w._realX - 0.5, e.y - w._realY - 0.9),
            air: e.air.visible, z: Math.round(e.z), st: Math.round(Orzel.state().st),
            dbg: { anim: e.anim && e.anim.kind, cool: e.cool, flee: e.flee, foe: e.foe === w, pose: e.pose && e.pose.kind, leaving: !!e.leaving, hp: Orzel.state().hp, mode: Orzel.state().mode, perched: e.perched, state: e.state, t: e.t } }; })()`);
        const tiredPops = await t.popups({ clear: true });
        t.check("bez siły w walce: odlatuje odpocząć (popup) daleko od walki, wysoko - widać tylko cień",
            engaged && away && awayInfo.phase === "away" && awayInfo.dW > 8 && !awayInfo.air && tiredPops.some(p => /odlatuje odpocząć/.test(p)), { engaged, awayInfo, tiredPops });
        const hp0 = await t.eval("window.__w2._hp");
        const backDown = await t.until("!!(Orzel.eagle && !Orzel.eagle.restAway && Orzel.eagle.state !== 'fly' && Orzel.eagle.z === 0)", 30);
        const backPops = await t.popups({ clear: true });
        const hit2 = await t.until("window.__w2._hp < " + hp0, 12);
        t.check("odpoczęty wraca: ląduje obok bohatera (podmuch) i znowu atakuje wilka", backDown && hit2 && backPops.some(p => /wraca do walki/.test(p)), { backDown, hit2, backPops });
        await t.eval("(function(){ for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gamePlayer.locate(20, 15); $gamePlayer.center(20, 15); return 0; })()");
        await t.frames(20);
    }

    // ================================================================ dorosły za bohaterem: pieszo; daleko albo gdzie się nie mieści - wysoko nad nim (tylko cień)
    // (Map003 (20,15): rzadki las - drzewa co 2-3 pola, 4x4 się nie mieści; na wschód od x=24 otwarta łąka)
    // (2026-10-21) the "rose" line's clock and the popups cleared BEFORE the eagle is put 12 tiles away: it may rise on the very next
    // frame (a slower page - more plugins - lets a frame pass between two evals: the line was said and then cleared, or held back)
    await t.eval("Orzel.riseSaid(-1e9)");   // (napis „wzbił się” najwyżej co 20 s - wcześniej w teście mógł już paść)
    await t.popups({ clear: true });
    await t.eval(`(function(){ const s = Orzel.state(); s.st = Orzel.maxSt(); Orzel.setMode('follow'); const e = Orzel.eagle, p = $gamePlayer;
        e.anim = null; e.foe = null; e.state = 'stand'; e.z = 0; e.target = null; e.groundT = 100; e.x = p.x + 0.5 + 12; e.y = p.y + 0.9; Orzel.riseSaid(-1e9); return 0; })()`);
    // cień co klatkę: wysokość, wielkość sylwetki, okrągły cień pod nim, klatka skrzydeł (szybowanie / uderzenia)
    await t.eval(`(function(){ window.__sh = []; let last = -1; window.__shiv = setInterval(() => { if (Graphics.frameCount === last) return; last = Graphics.frameCount;
        const e = Orzel.eagle; if (!e || !e.airShadow) return; window.__sh.push({ z: Math.round(e.z), k: +e.airShadow.scale.x.toFixed(3), sil: e.airShadow.visible && e.airShadow.alpha > 0.05,
            blob: !!(e.shadow && e.shadow.visible && e.shadow.alpha > 0.05), f: Math.round(e.airShadow._frame.x / 256), air: !!(e.air && e.air.visible), st: e.state }); }, 2); return 0; })()`);
    const upHigh = await t.until("!!(Orzel.eagle && Orzel.eagle.overhead && Orzel.eagle.z > 100)", 8);
    const gust0 = await t.eval("Orzel.gusts()");
    await t.frames(5);
    const upInfo = await t.json("(function(){ const e = Orzel.eagle; return { st: e.state, z: Math.round(e.z), air: e.air.visible, shadow: e.airShadow.visible, body: e.body.visible }; })()");
    const risePops = await t.popups({ clear: true });
    t.check("dorosły 12 pól od bohatera wzbija się: podmuch na ziemi, „wzbił się w powietrze”, wznosi się; widać tylko jego cień, bez skrzydeł w locie",
        upHigh && upInfo.st === "fly" && upInfo.z > 100 && !upInfo.air && upInfo.shadow && !upInfo.body && gust0 >= 1 && risePops.some(p => /wzbił się w powietrze/.test(p)), { upInfo, gust0, risePops });
    await shot("05b_nad_bohaterem_cien.png");
    await t.frames(240);
    const woods = await t.json("({ st: Orzel.eagle.state, over: !!Orzel.eagle.overhead, z: Math.round(Orzel.eagle.z) })");
    t.check("bohater wśród drzew (4x4 się nie mieści): orzeł zostaje w górze nad nim", woods.st === "fly" && woods.over && woods.z > 100, woods);
    // bohater wychodzi na łąkę: po dłuższej chwili (4 s z miejscem obok) orzeł ląduje obok niego - w podmuchu, bez lotu ze skrzydłami
    await t.eval(`(function(){ $gamePlayer.locate(32, 13); $gamePlayer.center(32, 13); window.__land = { air: false, t0: Graphics.frameCount, at: 0, gust: 0 }; let last = -1;
        window.__liv = setInterval(() => { if (Graphics.frameCount === last) return; last = Graphics.frameCount; const e = Orzel.eagle, L = window.__land; if (!e) return;
            if (e.air && e.air.visible) L.air = true;
            if (!L.at && e.state !== "fly" && e.z === 0) { L.at = Graphics.frameCount - L.t0; L.gust = Orzel.gusts(); clearInterval(window.__liv); } }, 2); return 0; })()`);
    const down = await t.until("!!(Orzel.eagle && Orzel.eagle.state !== 'fly' && Orzel.eagle.z === 0)", 15);
    const land = await t.json("window.__land");
    {   // (cień: start, szybowanie, lądowanie)
        const sh = await t.json("(function(){ clearInterval(window.__shiv); return window.__sh; })()");
        const inAir = sh.filter(r => r.st === "fly");
        const lowUp = inAir.find(r => r.z > 6 && r.z < 40), high = inAir.filter(r => r.z >= 190);
        const iDown = (() => { for (let i = inAir.length - 1; i > 0; i--) if (inAir[i].z > 6 && inAir[i].z < 40) return i; return -1; })();
        const kHigh = high.length ? high[0].k : 0;
        t.check("start: cień z okrągłego pod nim przechodzi w sylwetkę i maleje, im wyżej (przy ziemi duży, w górze mniejszy)",
            !!lowUp && lowUp.blob && high.length > 0 && kHigh < lowUp.k && kHigh <= 0.7, { lowUp, kHigh });
        const glides = high.filter(r => r.f === 8).length;
        t.check("w górze szybuje jak orzeł: głównie rozłożone skrzydła, czasem kilka uderzeń (nie macha cały czas)",
            high.length > 120 && glides / high.length > 0.55 && glides < high.length, { frames: high.length, glides });
        t.check("lądowanie: sylwetka cienia rośnie, schodząc, i zlewa się z okrągłym cieniem pod nim",
            iDown > 0 && inAir[iDown].k > kHigh && inAir[iDown].blob, { last: inAir[iDown], kHigh });
    }
    t.check("lądowanie: dopiero po dłuższej chwili na łące (ok. 4 s), w podmuchu kurzu, bez lotu ze skrzydłami", down && land.at >= 240 && land.gust >= 1 && !land.air, land);
    const downInfo = await t.json(`(function(){ const e = Orzel.eagle, p = $gamePlayer; return { st: e.state, z: e.z, d: Math.hypot(e.x - p.x - 0.5, e.y - p.y - 0.9), fits: Orzel.bodyFits(e.x, e.y, 4) }; })()`);
    t.check("bohater na otwartej łące: orzeł schodzi na ziemię obok niego (miejsce 4x4, nie na nim)", down && downInfo.d >= 2 && downInfo.d < 5 && downInfo.fits, downInfo);
    // na otwartym idzie pieszo (nie wzlatuje): bohater o kilka pól dalej, droga wolna dla jego 4 pól
    const walkTo = await t.json(`(function(){ const e = Orzel.eagle;
        for (const dx of [7, -7, 6, -6, 5, -5]) { let ok = true; for (let k = 1; k <= Math.abs(dx) + 1 && ok; k++) if (!Orzel.bodyFits(e.x + Math.sign(dx) * k, e.y, 4)) ok = false;
            if (ok && $gameMap.isPassable(Math.floor(e.x + dx), Math.floor(e.y - 0.9), 2)) return { x: Math.floor(e.x + dx), y: Math.floor(e.y - 0.9) }; } return null; })()`);
    let walked = null;
    if (walkTo) {   // (krótki marsz: stany zbierane co klatkę w grze)
        walked = await t.json(`new Promise(res => { $gamePlayer.locate(${walkTo.x}, ${walkTo.y}); Orzel.eagle.groundT = 100;
            const seen = {}, t0 = Graphics.frameCount, x0 = Orzel.eagle.x; let maxZ = 0, over = false;
            const iv = setInterval(() => { const e = Orzel.eagle; if (e) { seen[e.state] = 1; maxZ = Math.max(maxZ, e.z); over = over || !!e.overhead; }
                if (Graphics.frameCount - t0 > 120) { clearInterval(iv); res({ seen: Object.keys(seen), maxZ, over, moved: e ? Math.abs(e.x - x0) : 0 }); } }, 4); })`);
    }
    t.check("na otwartym terenie dorosły idzie za bohaterem pieszo, nie wzlatuje", !!walkTo && !!walked && walked.seen.includes("walk") && walked.maxZ === 0 && !walked.over && walked.moved > 1, { walkTo, walked });
    // bohater idzie wolno (chód, nie bieg): orzeł rusza raz i idzie jego tempem do końca - bez „stój-idź” co klatkę (szarpany chód)
    await t.eval(`(function(){ $gamePlayer.locate(34, 13); $gamePlayer.center(34, 13); const e = Orzel.eagle; e.x = 37.5; e.y = 13.9; e.state = "stand"; e.z = 0; e.trailing = false;
        e.groundT = 100; e.stuck = 0; return 0; })()`);
    await t.frames(30);
    await t.eval(`(function(){ window.__samp = []; let last = -1; window.__iv = setInterval(() => { if (Graphics.frameCount === last) return; last = Graphics.frameCount;
        const e = Orzel.eagle; if (e) window.__samp.push(e.z > 0 ? "^" : e.state[0]); }, 2); return 0; })()`);
    await t.press("left", 100);
    await t.frames(50);
    const pace = await t.json(`(function(){ clearInterval(window.__iv); const s = window.__samp.join(""); let sw = 0; for (let i = 1; i < s.length; i++) if (s[i] !== s[i - 1]) sw++;
        return { sw, walk: (s.match(/w/g) || []).length, up: s.includes("^"), n: s.length }; })()`);
    t.check("bohater idzie wolno: orzeł idzie za nim płynnie (rusza i staje raz, bez szarpania)", pace.walk > 20 && pace.sw <= 2 && !pace.up, pace);
    await t.eval("(function(){ $gamePlayer.locate(20, 15); $gamePlayer.center(20, 15); return 0; })()");
    // dorosły: „Wracaj do gniazda” - podmuch, sam cień leci do gniazda, siada w nim w podmuchu (bez lotu ze skrzydłami)
    await t.eval(`(function(){ Orzel.setMode('home'); window.__nest = { air: false }; let last = -1; window.__niv = setInterval(() => { if (Graphics.frameCount === last) return;
        last = Graphics.frameCount; const e = Orzel.eagle; if (e && e.air && e.air.visible) window.__nest.air = true; }, 2); return 0; })()`);
    const sat5 = await t.until("!!(Orzel.eagle && Orzel.eagle.perched)", 15);
    const nest5 = await t.json(`(function(){ clearInterval(window.__niv); const e = Orzel.eagle, np = Orzel.nestPoint(Orzel.home()); return { air: window.__nest.air, d: Math.hypot(e.x - np.x, e.y - np.y), z: e.z }; })()`);
    t.check("dorosły „Wracaj do gniazda”: wzlatuje, nad mapą tylko cień, siada przy gnieździe (bez lotu ze skrzydłami)", sat5 && !nest5.air && nest5.d < 0.2, nest5);
    // (gniazda na miarę) dorosły nie wchodzi do gniazda 3x3: odpoczywa na ziemi obok niego (siedzi, nocą śpi)
    await t.frames(30);
    const beside = await t.json(`(function(){ const e = Orzel.eagle, n = Orzel.home(), np = Orzel.nestPoint(n), b = n.b;
        const inside = e.x > b.x && e.x < b.x + 3 && e.y > b.y - 2 && e.y < b.y + 1;
        return { inNest: np.inNest, nested: !!e.nested, rim: !!e.rim, inside, fits: Orzel.bodyFits(e.x, e.y, 4), type: b.type }; })()`);
    await t.eval("(function(){ const e = Orzel.eagle; $gamePlayer.locate(Math.floor(e.x), Math.floor(e.y) + 7); return 0; })()");
    const sits5 = await t.until("!!(Orzel.eagle && Orzel.eagle.pose && Orzel.eagle.pose.kind === 'sit')", 10);
    t.check("dorosły bez grzędy: do gniazda 3x3 się nie mieści - siedzi na ziemi obok niego (4x4 wolne), bez warstwy krawędzi",
        beside.type === "orzel_gniazdo" && !beside.inNest && !beside.nested && !beside.rim && !beside.inside && beside.fits && sits5, { beside, sits5 });
    await t.frames(60);
    const lowGround = await t.json(LOW);
    t.check("dorosły na ziemi obok gniazda leży brzuchem w dół (nowa poza leżąca: ciało nisko, poniżej 0,7 wysokości stojącego)",
        !!lowGround && lowGround.kind === "sit" && lowGround.last && lowGround.ratio < 0.7 && /Orzel5_Poza/.test(lowGround.file), lowGround);
    // z Orlą grzędą (4x4): siedzi w jej misie
    const grz = await t.json(`(function(){ const f = $gameSystem._farm, list = f.buildings[3]; let at = null;
        for (let r = 3; r < 16 && !at; r++) for (let dy = -r; dy <= r && !at; dy++) for (let dx = -r; dx <= r && !at; dx++) if (!Farming.whyNotBuild("orzel_grzeda", 20 + dx, 15 + dy, false, true)) at = { x: 20 + dx, y: 15 + dy };
        if (!at) return null; const b = { id: f.nextId++, type: "orzel_grzeda", x: at.x, y: at.y, last: 1 }; list.push(b); f.rev++; window.__grz = b;
        Orzel.setMode('follow'); Orzel.setMode('home'); return at; })()`);
    const in5 = grz ? await t.until("!!(Orzel.eagle && Orzel.eagle.perched === window.__grz.id && Orzel.eagle.z === 0)", 20) : false;
    if (grz) await t.eval(`(function(){ $gamePlayer.locate(${grz ? grz.x + 2 : 20}, ${grz ? grz.y + 6 : 21}); $gamePlayer.center($gamePlayer.x, $gamePlayer.y); return 0; })()`);
    await t.frames(90);
    const nest5b = await t.json(NEST_INFO);
    await shot("06a_dorosly_w_grzedzie.png");
    t.check("dorosły z Orlą grzędą (4x4, nowy obraz na jego miarę): siedzi w jej misie, przednia krawędź nad nim",
        !!grz && in5 && inBowl(nest5b) && /Farm_OrzelGrzeda_Przod/.test(nest5b.rim.img), { grz, in5, nest5b });
    const lowNest = await t.json(LOW), lip5 = await t.eval("OrzelData.NESTS.orzel_grzeda.lip");
    t.check("dorosły w misie grzędy leży jak wysiadujący ptak (nowa poza: ciało nisko), krawędź zasłania dół - widać grzbiet, barki i głowę",
        !!lowNest && lowNest.kind === "sit" && lowNest.last && lowNest.ratio < 0.7 && inBowl(nest5b) && nest5b.holder.feet > nest5b.nest.y - lip5, { lowNest, feet: nest5b.holder.feet, lip: nest5b.nest.y - lip5 });
    await t.eval(`(function(){ const list = $gameSystem._farm.buildings[3], i = list.indexOf(window.__grz); if (i >= 0) list.splice(i, 1); $gameSystem._farm.rev++;
        Orzel.setMode('follow'); $gamePlayer.locate(20, 15); $gamePlayer.center(20, 15); return 0; })()`);
    await t.frames(30);

    // ================================================================ lot na prawie dorosłym (etap 4): w powietrzu mniejszy, jeździec tej samej wielkości, bez nurkowania
    {
        await t.eval(`(function(){ Orzel.forceStage(4); const s = Orzel.state(); s.st = Orzel.maxSt(); s.bond = 80; Orzel.removeEagle(); Orzel.spawnHere({ near: true }); return 0; })()`);
        await t.frames(20);
        const why4 = await t.eval("OrzelLot.why()");
        const menu4 = await t.json("(function(){ return { stage: Orzel.state().stage }; })()");
        await t.eval("OrzelLot.mount(); 0");
        const up4 = await t.until("OrzelLot.flying() && OrzelLot.lot && OrzelLot.lot.phase === 'fly'", 10);
        await t.frames(10);
        await t.popups({ clear: true });
        await t.eval("OrzelLot.dive(); 0");
        const divePops = await t.popups({ clear: true });
        const look = await t.json(`(function(){ const e = Orzel.eagle, v = Tawerna.view.scale(); return { air: +(e.air.scale.x * v).toFixed(3), rider: e.rider ? +e.rider.scale.x.toFixed(3) : 0,
            riderOn: !!(e.rider && e.rider.visible) }; })()`);
        await shot("06b_lot_prawie_dorosly.png");
        t.check("prawie dorosły (etap 4) też niesie bohatera: start, w locie mniejszy (x0,72), jeździec tej samej wielkości, nurkować nie może",
            why4 === "" && menu4.stage === 4 && up4 && Math.abs(look.air - 0.72) < 0.02 && Math.abs(look.rider - 1 / 0.72) < 0.02 && look.riderOn
            && divePops.some(p => /nie nurkuje/.test(p)), { why4, up4, look, divePops });
        await t.eval("OrzelLot.forceLand(); 0");
        await t.until("!OrzelLot.flying()", 10);
        await t.frames(20);
        const pod4 = await t.eval("(function(){ Orzel.forceStage(3); const w = OrzelLot.why(); Orzel.forceStage(5); return w; })()");
        t.check("podrostek jeszcze nie uniesie człowieka", /nie uniesie/.test(pod4), pod4);
        await t.eval("(function(){ const s = Orzel.state(); s.st = Orzel.maxSt(); s.bond = 80; return 0; })()");
    }

    // ================================================================ lot
    await t.eval("(function(){ const s = Orzel.state(); s.st = Orzel.maxSt(); s.bond = 80; Orzel.removeEagle(); Orzel.spawnHere({ near: true }); return 0; })()");
    await t.frames(20);
    const pre = await t.json(`({ why: OrzelLot.why(), tm: SceneManager._scene._spriteset._tilemap.width, night: SceneManager._scene._spriteset._nightLight.bitmap.width, zoom: $gameScreen.zoomScale() })`);
    t.check("dorosły z więzią 60+ i siłą może wystartować (why pusty)", pre.why === "", pre);
    await shot("06_dorosly_ziemia.png");
    await t.eval(`(function(){ window.__saves = 0; if (!DataManager.__orzelCount) { const o = DataManager.saveGame; DataManager.saveGame = function() { window.__saves++; return o.apply(this, arguments); }; DataManager.__orzelCount = true; }
        OrzelLot.mount(); return 0; })()`);
    await t.frames(70);
    // „leć” startuje nisko (x1, nad koronami drzew); dalsze sprawdzenia wysokiego lotu: Q w górę
    const low0 = await t.json("({ on: OrzelLot.flying(), phase: OrzelLot.lot.phase, lvl: OrzelLot.lot.level, s: Tawerna.view.scale() })");
    t.check("„leć”: start w niskim locie (x1, nad koronami drzew), nie od razu wysoko", low0.on && low0.phase === "fly" && low0.lvl === "low" && low0.s === 1, low0);
    await t.eval("OrzelLot.setLevel('high'); 0");
    await t.frames(60);
    const air = await t.json(`(function(){ const sc = SceneManager._scene, set = sc._spriteset; return { on: OrzelLot.flying(), phase: OrzelLot.lot.phase, s: Tawerna.view.scale(),
        vw: Tawerna.view.w(), gw: Graphics.width, tm: set._tilemap.width, th: set._tilemap.height, stx: $gameMap.screenTileX(), night: set._nightLight.bitmap.width,
        weather: set._weather ? set._weather.scale.x : 2, move: $gamePlayer.canMove(), save: $gameSystem.isSaveEnabled(), hidden: $gamePlayer.isTransparent(),
        hit: Combat.hitPlayer({ dmg: 10 }), flights: Orzel.state().flights, lotFlag: !!TownQuests.state().flags.orzelLot, ridden: !!(Orzel.eagle && Orzel.eagle.ridden), rider: !!(Orzel.eagle && Orzel.eagle.rider) }; })()`);
    t.check("start: w powietrzu, kamera x0,5 (Tawerna.view 2× ekranu, tilemapa 2×, 2× pól na ekranie), bohater ukryty na grzbiecie (jeździec rysowany)",
        air.on && air.phase === "fly" && air.s === 0.5 && air.vw === air.gw * 2 && air.tm === air.gw * 2 && Math.abs(air.stx - air.gw / 48 * 2) < 0.1 && air.hidden && air.ridden && air.rider, air);
    t.check("w locie: noc na cały oddalony widok, deszcz w skali 2, bez chodzenia, bez zapisu, ciosy nie dochodzą; W13 lot (flaga orzelLot)",
        air.night === Math.ceil(air.gw * 2 / 2) && air.weather === 2 && !air.move && !air.save && air.hit === "miss" && air.flights === 2 && air.lotFlag, air);   // (2: pierwszy był na prawie dorosłym)
    await shot("07_lot_wysoko.png");
    await t.key("Q");
    await t.frames(60);
    const low = await t.json("({ s: Tawerna.view.scale(), lvl: OrzelLot.lot.level, menu: !!$gameTemp._farmMenuOpen, build: !!$gameTemp._buildMode })");
    t.check("Q: nisko (x1, nad koronami drzew), Q nie otwiera budowania", low.s === 1 && low.lvl === "low" && !low.menu && !low.build, low);
    await shot("08_lot_nisko.png");
    await t.key("Q");
    await t.frames(60);
    const high = await t.json("({ s: Tawerna.view.scale(), lvl: OrzelLot.lot.level })");
    t.check("Q drugi raz: znów wysoko (x0,5)", high.s === 0.5 && high.lvl === "high", high);
    // night and rain in the air (no errors, the night layer covers the view)
    await t.eval("(function(){ $gameSystem.setDayNightHour(23); $gameScreen.changeWeather('rain', 5, 1); return 0; })()");
    await t.frames(40);
    const nightAir = await t.json("({ night: SceneManager._scene._spriteset._nightLight.bitmap.width, vis: SceneManager._scene._spriteset._nightLight.visible, gw: Graphics.width })");
    await shot("09_lot_noc_deszcz.png");
    t.check("noc i deszcz w locie: warstwa nocy na cały widok, widoczna", nightAir.vis && nightAir.night === nightAir.gw, nightAir);
    await t.eval("(function(){ $gameScreen.changeWeather('none', 0, 1); $gameSystem.setDayNightHour(11); return 0; })()");
    // over the east edge: Map003 -> Map023
    await t.eval("(function(){ const p = $gamePlayer; p._realX = $gameMap.width() - 4; p._realY = 16; OrzelLot.lot.angle = 0; Input._currentState.right = true; return 0; })()");
    const crossed = await t.until(t.onMap(23), 20);
    await t.eval("Input._currentState.right = false; 0");
    await t.frames(50);
    const edge = await t.json(`({ map: $gameMap.mapId(), on: OrzelLot.flying(), phase: OrzelLot.lot && OrzelLot.lot.phase, s: Tawerna.view.scale(), x: $gamePlayer.x, eMap: Orzel.state().map,
        ridden: !!(Orzel.eagle && Orzel.eagle.ridden), tm: SceneManager._scene._spriteset._tilemap.width, gw: Graphics.width })`);
    t.check("przelot wschodnią krawędzią: Map003 -> Map023 w powietrzu (dalej x0,5, orzeł pod bohaterem, przy lewym brzegu)",
        crossed && edge.map === 23 && edge.on && edge.s === 0.5 && edge.eMap === 23 && edge.ridden && edge.x <= 4 && edge.tm === edge.gw * 2, edge);
    await shot("10_przelot_map023.png");
    const airSaves = await t.eval("window.__saves");
    t.check("w powietrzu (start, Q, noc, przelot krawędzią) gra się nie zapisała ani razu (także autozapis przejścia)", airSaves === 0, airSaves);
    await t.eval("OrzelLot.tryLand(true); 0");
    await t.until("!OrzelLot.flying()", 10);
    await t.frames(30);
    const landed = await t.json(`(function(){ const set = SceneManager._scene._spriteset; return { on: OrzelLot.flying(), s: Tawerna.view.scale(), vw: Tawerna.view.w() === Graphics.width,
        tm: set._tilemap.width === Graphics.width && set._tilemap.height === Graphics.height, stx: $gameMap.screenTileX() === Math.round(Graphics.width / 48 * 16) / 16, night: set._nightLight.bitmap.width === Math.ceil(Graphics.width / 2),
        zoom: $gameScreen.zoomScale(), weather: set._weather ? set._weather.scale.x : 1, hidden: $gamePlayer.isTransparent(), through: $gamePlayer.isThrough(), move: $gamePlayer.canMove(), save: $gameSystem.isSaveEnabled(),
        lands: Object.keys(Orzel.state().lands || {}), mode: Orzel.state().mode, e: Orzel.eagle && { st: Orzel.eagle.state, z: Orzel.eagle.z, ridden: Orzel.eagle.ridden } }; })()`);
    t.check("lądowanie: x1 jak przed lotem (widok, tilemapa, pola, noc, deszcz, zoom), bohater widoczny i chodzi, zapis znów można, orzeł stoi obok",
        !landed.on && landed.s === 1 && landed.vw && landed.tm && landed.stx && landed.night && landed.zoom === pre.zoom && landed.weather === 1 && !landed.hidden && !landed.through && landed.move && landed.save
        && landed.e && landed.e.st === "stand" && landed.e.z === 0 && !landed.e.ridden, landed);
    t.check("lądowisko zapamiętane (lot daleki: Map023); W13 rozdz. 7 spełniony (w13Lot)", landed.lands.includes("23") && (await t.eval("TownQuests.FX.w13Lot.check()")), landed.lands);
    await shot("11_po_ladowaniu.png");

    // ================================================================ lądowanie w mieście: tylko na placu
    await go(8, 52, 19, 2);
    const town = await t.json(`(function(){ const a = OrzelLot.landingSpot(); $gamePlayer.locate(56, 33); const b = OrzelLot.landingSpot(); $gamePlayer.locate(52, 19);
        return { square: a, lane: b }; })()`);
    t.check("Map008: na ulicy przed tawerną (plac) wolno wylądować, w wąskim przejściu nie („W mieście lądujesz tylko na placu”)",
        !town.square.why && /tylko na placu/.test(town.lane.why || ""), town);

    // ================================================================ kradzież (W13 rozdz. 5)
    await go(3, 20, 15, 2);
    await t.frames(20);
    await t.eval("(function(){ const s = Orzel.state(); Orzel.forceStage(3); s.theft = null; s.bond = 70; Orzel.setMode('home'); return 0; })()");
    await go(19, 2, 5, 2);
    const theft0 = await t.json(`(function(){ const s = Orzel.state(); s.mode = "home"; const r = TownQuests.rec("W13"); r.step = 4; $gameSystem.setDayNightHour(23.5);
        Orzel.theft.check(false); return { st: s.theft && s.theft.state, home: !!Orzel.home() }; })()`);
    await t.frames(40);
    const theft1 = await S("s.theft && s.theft.state");
    await t.popups({ clear: true });
    await t.eval("(function(){ $gameSystem.setDayNightHour(7); Orzel.theft.morning(); return 0; })()");
    const theftPops = (await t.popups({ clear: true })).concat(await t.notices({ clear: true }));
    const theft2 = await S("({ st: s.theft && s.theft.state, eagle: !!Orzel.eagle })");
    t.check("noc przy gnieździe (bohater daleko): złodzieje (plan -> zabrany), rano „Gniazdo jest puste” i orzeł w obozie na grani",
        theft0.st === "plan" && theft0.home && theft1 === "taken" && theft2.st === "camp" && !theft2.eagle && theftPops.some(p => /Gniazdo jest puste/.test(p)), { theft0, theft1, theft2, theftPops });
    await go(175, 30, 20, 2, { calm: false });
    await t.frames(30);
    const cage = await t.json(`({ guards: Humans.list.filter(h => h._tag === "orzelStraz").length, caged: !!(Orzel.eagle && Orzel.eagle.caged), cageDir: $gameMap.event(516).direction() })`);
    await t.eval("$gameMap.setDisplayPos($gameMap.event(516).x - $gameMap.screenTileX() / 2, $gameMap.event(516).y - $gameMap.screenTileY() / 2); 0");
    await t.frames(10);
    await shot("12_klatka.png");
    await t.popups({ clear: true });
    await t.eval("Orzel.look('klatka'); 0");
    const guardsFirst = await t.popups({ clear: true });
    t.check("na grani: orzeł w zamkniętej klatce, dwóch strażników Czarnych Oczu; przy strażnikach „Najpierw strażnicy!”",
        cage.guards === 2 && cage.caged && cage.cageDir === 2 && guardsFirst.some(p => /Najpierw strażnicy/.test(p)), { cage, guardsFirst });
    await t.eval("(function(){ for (const h of Humans.list.filter(h => h._tag === 'orzelStraz')) h._dead = true; Orzel.look('klatka'); return 0; })()");
    await t.frames(20);
    const freed = await t.json(`({ st: Orzel.state().theft.state, dir: $gameMap.event(516).direction(), eagle: !!Orzel.eagle && !Orzel.eagle.caged, flag: !!TownQuests.state().flags.orzelUwolniony, check: TownQuests.FX.w13Kradziez.check() })`);
    t.check("po strażnikach: klatka otwarta, orzeł wolny przy bohaterze, flaga orzelUwolniony, W13 rozdz. 5 spełniony", freed.st === "freed" && freed.dir === 4 && freed.eagle && freed.flag && freed.check, freed);
    await t.eval("Humans.clear(); 0");

    // ================================================================ Akt III, epilog, F9
    const act3 = await t.json(`(function(){ const s = Orzel.state(); Orzel.forceStage(5); s.bond = 70; const W = Act3Data.WAVES, c = { flags: {} };
        const yes = [W[0].fewer(c), W[1].fewer(c)]; s.bond = 40; const low = W[0].fewer(c); s.bond = 70; s.away = { since: 0, back: 0 }; const away = W[0].fewer(c); s.away = null;
        return { yes, low, away, notice: W[0].fewerNotice(c).join(" ") }; })()`);
    t.check("Akt III: dorosły z więzią 60+ w domu broni tawerny (w1 i w2 o jednego mniej, z napisem); słaba więź albo odleciał - nie",
        act3.yes.join() === "1,1" && act3.low === 0 && act3.away === 0 && /Śnieżny/.test(act3.notice), act3);
    const epi = await t.json(`({ str: Orzel.epilogue("straznik"), any: Orzel.epilogue("cos"), gone: (function(){ const s = Orzel.state(); s.away = { since: 0, back: 1e9 }; const g = Orzel.epilogue("straznik"); s.away = null; return g; })() })`);
    t.check("epilog: linijka o orle po zakończeniu przy Sercu (z imieniem), a gdy odleciał - że nie wrócił", /Śnieżny/.test(epi.str) && /Śnieżny/.test(epi.any) && /nie wrócił/.test(epi.gone), epi);
    const f9 = await t.json("Orzel.f9Rows().map(r => r.what)");
    t.check("F9 (Wyspa i fabuła): 8 wierszy orła - jajo, jajo gotowe, etap (←→), więź, dosiądź, wyląduj, kradzież, grań", f9.join() === "jajo,gotowe,etap,wiez,dosiadz,wyladuj,kradziez,gran", f9);

    // ================================================================ walka naprawdę (2026-10-18): wilk, bandyta, łucznik atakują orła
    {   // (własny zakres nazw)
        await go(3, 32, 13, 2);
        await t.frames(20);
        await t.eval(`(function(){ Humans.clear(); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a);
            const F = OrzelData.FIGHT.foes; window.__turn = { w: F.wolf.turn, m: F.man.turn, a: F.arrows.chance, c: OrzelData.FIGHT[5].cost }; F.wolf.turn = 1; F.man.turn = 1; F.arrows.chance = 1;
            OrzelData.FIGHT[5].cost = 0;   // (it does not tire here: the others' blows are what is looked at)
            $gameSystem.setDayNightHour(12);
            Orzel.forceStage(5); const s = Orzel.state(); s.bond = 80; s.st = Orzel.maxSt(); s.hp = Orzel.maxHp(); s.mode = "follow"; s.hurtUntil = 0; s.name = "Śnieżny";
            window.__hitPlayer = Combat.hitPlayer; Combat.hitPlayer = function() { return "miss"; };   // (the hero himself out of it: only the eagle counts here)
            const b = Orzel.bodyOf(); window.__hits = []; window.__outside = 0;
            if (!b.__wrapped) { const orig = b.takeHit; b.takeHit = function(info) { const hp0 = Orzel.state().hp; const r = orig.call(this, info); const fr = info.from;
                window.__hits.push({ r, d: hp0 - Orzel.state().hp, shot: !!info.shot, who: fr ? (fr.kind ? fr.kind() : "?") : "", mode: fr && fr._mode, jump: !!(fr && fr.isJumping && fr.isJumping()),
                    ridden: !!(Orzel.eagle && Orzel.eagle.ridden), z: Orzel.eagle ? Math.round(Orzel.eagle.z) : -1 });
                window.__hp = Orzel.state().hp; return r; }; b.__wrapped = true; }
            window.__hp = Orzel.state().hp; clearInterval(window.__hpiv); let last = -1;
            window.__hpiv = setInterval(() => { if (Graphics.frameCount === last) return; last = Graphics.frameCount; const hp = Orzel.state().hp; if (hp < window.__hp) window.__outside += window.__hp - hp; window.__hp = hp; }, 1);
            window.__arrowAt = 0; clearInterval(window.__ariv); window.__ariv = setInterval(() => { if (Humans.arrows.some(a => a.target === Orzel.bodyOf())) window.__arrowAt++; }, 16);
            return 0; })()`);
        await t.frames(30);
        // 1. wilk: wataha 3, orzeł szarpie jednego - przerzuca się na orła i atakuje go swoimi ruchami
        const pk = await t.json(`(function(){ const p = $gamePlayer; const pack = Hunting.spawnPack(p.x + 4, p.y + 1, 3); if (!pack) return null;
            for (const w of pack.members) { w._summoned = true; w._maxHp = w._hp = 900; }
            Tawerna.api("Hunting_parts").ai.wolfEngage(pack.members[0]); window.__pack = pack; return { n: pack.members.length, eng: !!pack.engaged }; })()`);
        const turned = await t.until("!!window.__pack && window.__pack.members.some(m => m._clash === Orzel.bodyOf())", 25);
        // (it stays on the ground now - its own hops in the fight would make the wolves lose it a moment; here only their bite is looked at)
        await t.eval("(function(){ Orzel.auto(false); const e = Orzel.eagle; e.anim = null; e.state = 'stand'; e.z = 0; e.overhead = false; return 0; })()");
        const bit = await t.until("window.__hits.some(h => h.who === 'wolf' && h.d > 0)", 40);
        await shot("13_wilk_na_orle.png");
        const wi = await t.json(`({ on: window.__pack.members.filter(m => !m._dead && m._clash === Orzel.bodyOf()).length, n: window.__pack.members.filter(m => !m._dead).length,
            hits: window.__hits.filter(h => h.who === 'wolf').slice(0, 4), outside: window.__outside, hp: Orzel.state().hp, max: Orzel.maxHp() })`);
        t.check("wilk z watahy (3), którego orzeł szarpie, przerzuca się na orła (najwyżej 2, reszta przy bohaterze) i jego atak zabiera orłu życie",
            !!pk && turned && bit && wi.on >= 1 && wi.on <= 2 && wi.on < wi.n && wi.hits.some(h => h.d > 0 && !!h.mode), { pk, wi });
        // 2. orzeł wysoko: bestie go gubią, ciosy nie dochodzą
        await t.eval(`(function(){ Orzel.auto(false); const e = Orzel.eagle; e.anim = null; e.foe = null; e.state = "fly"; e.overhead = true; e.z = 200; return 0; })()`);
        await t.frames(60);
        const n0 = await t.eval("window.__hits.filter(h => h.d > 0).length");
        await t.frames(180);
        const up = await t.json(`({ on: window.__pack.members.filter(m => !m._dead && m._clash === Orzel.bodyOf()).length, reach: Orzel.reachable(true), miss: Orzel.bodyOf().takeHit({ damage: 10 }),
            n1: window.__hits.filter(h => h.d > 0).length })`);
        t.check("orzeł wysoko w górze jest bezpieczny: wilki go gubią (wracają do bohatera), żaden cios ani strzała go nie sięga",
            up.on === 0 && !up.reach && up.miss === "miss" && up.n1 === n0, Object.assign({ n0 }, up));
        await t.eval(`(function(){ const e = Orzel.eagle; e.overhead = false; e.z = 0; e.state = "stand"; Orzel.auto(true); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); return 0; })()`);
        t.check("bez podwójnych obrażeń: życie orła spada tylko od ciosów, które go trafiły (stare abstrakcyjne ugryzienia usunięte)", wi.outside === 0 && !(await t.eval("'takeBites' in Orzel")), { outside: wi.outside });
        // 3. bandyta: orzeł go bije - bandyta odwraca się i bije orła wręcz (nie ginie od orła)
        await t.eval(`(function(){ const p = $gamePlayer, e = Orzel.eagle; Orzel.auto(false); e.anim = null; e.foe = null; e.restAway = null; e.overhead = false; e.state = "stand"; e.z = 0;
            e.x = p.x + 0.5 + 3; e.y = p.y + 0.9; const h = Humans.spawn("bandit", p.x + 6, p.y, { tag: "f9", mode: "idle", level: 1, noBand: true, engaged: true });
            h._noSurrender = true; h._maxHp = h._hp = 600; window.__band = h; Orzel.provoke(h); return 0; })()`);
        const manOn = await t.until("Humans.foeOf(window.__band) === Orzel.bodyOf()", 25);
        const manHit = await t.until("window.__hits.some(h => h.who === 'bandit' && !h.shot && h.d > 0)", 30);
        await shot("14_bandyta_bije_orla.png");
        const mi = await t.json(`({ dead: !!window.__band._dead, hp: window.__band._hp, hits: window.__hits.filter(h => h.who === 'bandit').length })`);
        t.check("bandyta, którego orzeł bije, odwraca się do orła (jego wróg) i bije go wręcz; sam od orła nie ginie", manOn && manHit && !mi.dead && mi.hp >= 1, mi);
        // 4. łucznik: strzela do orła na ziemi (widać strzałę lecącą w orła)
        await t.eval(`(function(){ Humans.clear(); const p = $gamePlayer, e = Orzel.eagle; e.foe = null; e.anim = null; window.__arrowAt = 0;
            const h = Humans.spawn("archer", p.x + 7, p.y, { tag: "f9", mode: "idle", level: 1, noBand: true, engaged: true }); h._noSurrender = true; h._maxHp = h._hp = 600; window.__arch = h; return 0; })()`);
        const shotGround = await t.until("window.__hits.some(h => h.shot && !h.ridden && h.d > 0)", 30);
        const ag = await t.json(`({ arrows: window.__arrowAt, foe: Humans.foeOf(window.__arch) === Orzel.bodyOf(), hits: window.__hits.filter(h => h.shot).slice(0, 3) })`);
        t.check("łucznik strzela do orła na ziemi: jego strzała (widać ją) leci w orła i trafia", shotGround && ag.arrows > 0, ag);
        // 5. lot z bohaterem: nisko łucznik trafia orła (nie jeźdźca), wysoko nie; mocno ranny - „ląduj!”, bez życia - wymuszone lądowanie
        await t.eval(`(function(){ Humans.clear(); const s = Orzel.state(); s.hp = Orzel.maxHp(); s.st = Orzel.maxSt(); s.bond = 80; const e = Orzel.eagle; e.foe = null; e.anim = null;
            const p = $gamePlayer; e.x = p.x + 0.5 + 3; e.y = p.y + 0.9; window.__heroHp = $gameParty.leader().hp; OrzelLot.mount(); return 0; })()`);
        await t.until("OrzelLot.flying() && OrzelLot.lot.phase === 'fly'", 10);
        await t.eval("OrzelLot.setLevel('low'); 0");
        await t.until("OrzelLot.lot.phase === 'fly' && OrzelLot.lot.level === 'low'", 10);
        await t.eval(`(function(){ OrzelLot.lot.speed = 0; const p = $gamePlayer; const h = Humans.spawn("archer", p.x - 6, p.y + 1, { tag: "f9", mode: "idle", level: 1, noBand: true });
            h._noSurrender = true; h._maxHp = h._hp = 600; window.__arch = h; window.__hits = []; return 0; })()`);
        const shotAir = await t.until("window.__hits.some(h => h.shot && h.ridden && h.d > 0)", 30);
        await shot("15_lucznik_lot_nisko.png");
        const la = await t.json(`({ hits: window.__hits.filter(h => h.shot).slice(0, 3), heroHp: $gameParty.leader().hp, hero0: window.__heroHp, flying: OrzelLot.flying() })`);
        t.check("lot z bohaterem nisko: łucznik (nawet nie ścigający bohatera) strzela do wielkiego ptaka - strzała trafia orła, nie jeźdźca",
            shotAir && la.flying && la.heroHp === la.hero0 && la.hits.every(h => h.ridden), la);
        await t.eval("OrzelLot.setLevel('high'); 0");
        await t.until("OrzelLot.lot.phase === 'fly' && OrzelLot.lot.level === 'high'", 10);
        const nh = await t.eval("window.__hits.filter(h => h.shot && h.d > 0).length");
        await t.frames(300);
        const hi = await t.json(`({ n: window.__hits.filter(h => h.shot && h.d > 0).length, foe: Humans.foeOf(window.__arch) === Orzel.bodyOf(), reach: Orzel.reachable(true) })`);
        t.check("lot wysoko: łucznik nie strzela do orła (traci go z oczu), żadna strzała go nie trafia", hi.n === nh && !hi.foe && !hi.reach, Object.assign({ nh }, hi));
        await t.eval("OrzelLot.setLevel('low'); 0");
        await t.until("OrzelLot.lot.phase === 'fly' && OrzelLot.lot.level === 'low'", 10);
        await t.popups({ clear: true });
        await t.eval(`(function(){ OrzelLot.lot.speed = 0; Orzel.state().hp = Math.round(Orzel.maxHp() * 0.3); window.__hits = []; return 0; })()`);
        await t.until("window.__hits.some(h => h.shot && h.d > 0)", 30);
        const lowPops = await t.popups({ clear: true });
        await t.eval("(function(){ Orzel.state().hp = 2; window.__hits = []; return 0; })()");
        const forced = await t.until("!OrzelLot.flying()", 40);
        await t.frames(30);
        const fl = await t.json(`({ flying: OrzelLot.flying(), hurt: Orzel.state().hurtUntil > 0, hp: Orzel.state().hp, s: Tawerna.view.scale(), hidden: $gamePlayer.isTransparent() })`);
        const downPops = await t.popups({ clear: true });
        t.check("ranny z jeźdźcem: popup nad bohaterem „Śnieżny jest ranny - ląduj!”; bez życia - wymuszone lądowanie (x1, bohater na ziemi), orzeł na dobę do gniazda",
            lowPops.some(p => /jest ranny - ląduj/.test(p)) && forced && !fl.flying && fl.hurt && fl.hp === 0 && fl.s === 1 && !fl.hidden && downPops.some(p => /opada|ranny/.test(p)), { lowPops, downPops, fl });
        await t.eval(`(function(){ Humans.clear(); const F = OrzelData.FIGHT.foes, w = window.__turn; F.wolf.turn = w.w; F.man.turn = w.m; F.arrows.chance = w.a; OrzelData.FIGHT[5].cost = w.c; Orzel.auto(true);
            Combat.hitPlayer = window.__hitPlayer; clearInterval(window.__hpiv); clearInterval(window.__ariv);
            const s = Orzel.state(); s.hurtUntil = 0; s.hp = Orzel.maxHp(); s.mode = "follow"; s.away = null; Orzel.removeEagle(); Orzel.spawnHere({ near: true }); return 0; })()`);
        await t.frames(30);
    }

    // ================================================================ zapis i wczytanie
    await go(3, 20, 15, 2);
    await t.frames(30);
    await t.saveTo(1);
    const before = await S("({ stage: s.stage, name: s.name, care: s.care, lands: Object.keys(s.lands || {}).join(), theft: s.theft && s.theft.state })");
    await t.loadFrom(1, { quiet: true, minimap: false });
    await t.frames(40);
    const after = await S("({ stage: s.stage, name: s.name, care: s.care, lands: Object.keys(s.lands || {}).join(), theft: s.theft && s.theft.state, eagle: !!Orzel.eagle, s: Tawerna.view.scale(), fly: OrzelLot.flying() })");
    t.check("zapis i wczytanie: orzeł (etap, imię, dni opieki, lądowiska, kradzież) jak był, stoi przy bohaterze, widok x1, nie w locie",
        after.stage === before.stage && after.name === before.name && after.care === before.care && after.lands === before.lands && after.theft === before.theft && after.eagle && after.s === 1 && !after.fly, { before, after });
}).catch(e => { console.log("ERR", e); process.exit(1); });
