// PAKIET B "Urwisko Kruków" i oswojony kruk (docs/miejsca_wyspy/PAKIETY.md; js/plugins/Kruk_Data.js + Kruk.js; mapa z
// tools/urwisko/build.py; grafika tools/kruk/art/build_sheet.py). Sprawdza:
//   - mapa 157 (56 x 36, tileset 11, <Water:salt>, bez szkieletu): przejścia z kontraktu (lewa krawędź -> pustelnia, prawa ->
//     przylądek tylko gdy gotowy, inaczej popup), krata przelewu (41,15) z dwiema stronami (przełącznik 17 -> cysterna 167 33,3),
//     znaczniki rynien K53, kruczarnia ze starymi żerdziami, stado kruków, kamienie z krukiem w gruzie
//   - wejście od pustelni: Wyspa.ready(157) - prawa krawędź Map155 prowadzi na (1,19)
//   - K51 od Rocha: kruk o świcie na maszcie wraku kutra, potem etapy: górna krawędź przystani, kopiec przy pustelni, sosna na Urwisku,
//     żerdź w kruczarni; D24 rusza samo
//   - D24: karmienie (bez mięsa, pies przy nodze, drugi raz tego samego dnia - popup), bieg płoszy kruka, trzecie karmienie: ramię,
//     obrączka 179, flagi krukTame i kronikaKarta6 (karta 6 w torbie przez Pustelnię), ekran imienia (polskie litery); dziadek; grzęda
//   - oswojony kruk: lot za bohaterem (drzewo / ziemia / ramię), menu (K), listy (raz dziennie, nie do matki, odpowiedź), zwiad (raport
//     od razu po powrocie, notatka w dzienniku, ostrzeżenie; prawdziwy: zwierzyna, jagody, grzyby, nocny obóz), błyskotki i cudzy list (oddany właścicielowi - Opinia), pilnowanie pola (żywe i pod nieobecność), ostrzeżenie przed
//     wilkiem, głód -> powrót na Urwisko i odzyskanie, zapis i wczytanie
//   - grzęda w Farming_Data.js (4× Gałęzie, 2× Deski, 1× Lina, 1x1) i obóz kopaczy nocą po D25
// Przed instalacją mapy: nakładka tools/miejsca_wyspy/staging_B (sama się włącza, gdy data/Map157.json to jeszcze szkielet).
// Zrzuty do dokumentacji: tools/urwisko/shots.js.
// Uruchom: CDP_PORT=9502 node tests/kruk_test.js (serwer: node tools/serve.js)
const fs = require("fs");
const path = require("path");
const kit = require("./lib/kit.js");

const ROOT = path.join(__dirname, "..");
const skeleton = /Wyspa:szkielet/.test(fs.readFileSync(path.join(ROOT, "data", "Map157.json"), "utf8"));
const OVERLAY = process.env.GAME_OVERLAY || (skeleton ? "tools/miejsca_wyspy/staging_B" : null);

kit.test({ port: 9502, overlay: OVERLAY, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    if (OVERLAY) console.log("NOTE nakładka: " + OVERLAY);
    const P = "Kruk.pet";
    const S = expr => t.json("(function(){ const s = Kruk.state(); return " + expr + "; })()");

    // ---------------------------------------------------------------- wtyczki, dane, grafika
    const base = await t.json(`(function(){ const B = Farming.BUILDINGS.grzeda;
        return { api: !!window.Kruk && !!Kruk.look, data: !!window.KrukData, k51: !!TownQuests.Q.K51, d24: !!TownQuests.Q.D24 && TownQuests.Q.D24.giver,
            packs: TownQuestsData.PACKS.filter(p => p.owner === 'Kruk').map(p => p.quests.join()),
            grz: B && { name: B.name, cost: B.cost.map(c => c.join('x')).join(), w: B.w, h: B.h, img: B.image, slots: B.slots, bowl: B.bowl },
            ready: Wyspa.isReady(157), built: Kruk.built(), ring: $dataItems[179] && $dataItems[179].name }; })()`);
    t.check("Kruk.js i Kruk_Data.js działają: K51 i D24 (od dziadka) w zadaniach, paczka „Kruk”, miejsce gotowe (Wyspa.ready 157)",
        base.api && base.data && base.k51 && base.d24 === "grandpa" && base.packs.join() === "K51,D24" && base.ready && base.built, base);
    t.check("Farming_Data.js: budynek „Grzęda kruka” (4× Gałęzie, 2× Deski, 1× Lina; 1x1; Farm_Grzeda; korytko i miseczka)",
        base.grz && base.grz.name === "Grzęda kruka" && base.grz.cost === "77x4,80x2,93x1" && base.grz.w === 1 && base.grz.h === 1 && base.grz.img === "Farm_Grzeda" && base.grz.slots === 2 && base.grz.bowl === 3, base.grz);
    const imgs = await t.json(`(function(){ const a = ImageManager.loadSystem('Kruk'), b = ImageManager.loadSystem('Farm_Grzeda'), c = ImageManager.loadSystem('Kruk_Grzeda_Stara'), d = ImageManager.loadCharacter('!$Urwisko_Gniazda');
        return [a, b, c, d].map(x => [x.width, x.height]); })()`);
    await t.frames(20);
    const imgs2 = await t.json(`[ImageManager.loadSystem('Kruk'), ImageManager.loadSystem('Farm_Grzeda'), ImageManager.loadSystem('Kruk_Grzeda_Stara'), ImageManager.loadCharacter('!$Urwisko_Gniazda')].map(x => [x.width, x.height])`);
    t.check("grafika: arkusz kruka 432x336 (komórki 48, 7 wierszy), grzęda 56x100, stara żerdź, gniazda 192x256", imgs2[0].join() === "432,336" && imgs2[1].join() === "56,100" && imgs2[2][0] > 40 && imgs2[3].join() === "192,256", { imgs, imgs2 });

    // ---------------------------------------------------------------- z pustelni na Urwisko
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.eval("if (window.Creatures && Creatures.auto) Creatures.auto(false); 0");
    await t.setDay(6, 10);
    await t.go(155, 45, 17, 6);
    await t.eval("(function(){ const e = $gameMap.events().find(e => e.x === 47 && e.y === 17); $gamePlayer.locate(46, 17); e.start(); return 0; })()");
    const came = await t.until(t.onMap(157), 30);
    await t.frames(30);
    const at = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, $dataMap.width, $dataMap.height, $dataMap.tilesetId, $dataMap.note, $dataMap.displayName]");
    t.check("prawa krawędź pustelni (47,17) prowadzi na Map157 „Urwisko Kruków” (1,19); 56 x 36, tileset 11, <Water:salt>, nie szkielet",
        came && at[0] === 157 && at[1] === 1 && at[2] === 19 && at[3] === 56 && at[4] === 36 && at[5] === 11 && /<Water:salt>/.test(at[6]) && !/szkielet/.test(at[6]) && at[7] === "Urwisko Kruków", at);
    await t.calm();
    const ways = await t.json(`(function(){ const ev = $dataMap.events.filter(Boolean), tr = e => (e.pages[0].list.find(c => c.code === 201) || {}).parameters;
        const g = ev.find(e => e.name === 'Przelew cysterny');
        return { west: ev.filter(e => e.x === 0 && (e.y === 19 || e.y === 20)).map(e => tr(e) ? tr(e).slice(1, 4) : null),
            east: ev.filter(e => e.x === 55 && (e.y === 19 || e.y === 20)).map(e => String(e.pages[0].list[0].parameters[0]).includes('isReady(159)')),
            grate: g && { x: g.x, y: g.y, img: [g.pages[0].image.characterName, g.pages[0].image.characterIndex, g.pages[0].image.direction, g.pages[0].image.pattern],
                p2: g.pages[1] && g.pages[1].conditions.switch1Valid && g.pages[1].conditions.switch1Id, to: g.pages[1] && /reserveTransfer\\(167, 33, 3/.test(g.pages[1].list[0].parameters[0]) },
            rynny: ev.filter(e => /^Miejsce: rynna_/.test(e.name)).map(e => e.name.slice(9)).sort(),
            rynnyObok: ev.filter(e => /^Miejsce: rynna_/.test(e.name)).every(e => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => $gameMap.isPassable(e.x + dx, e.y + dy, 2) && !$gameMap.eventsXy(e.x + dx, e.y + dy).some(o => o.isNormalPriority()))),
            land: [[1, 19], [1, 20], [54, 19], [54, 20], [41, 16]].every(([x, y]) => $gameMap.isPassable(x, y, 2)) }; })()`);
    t.check("przejścia z kontraktu: lewa krawędź (0,19-20) -> pustelnia (46,17-18), prawa (55,19-20) -> przylądek z bramą Wyspa.isReady(159); lądowania przechodnie",
        ways.west.length === 2 && ways.west.every(w => w && w[0] === 155 && w[1] === 46) && ways.east.length === 2 && ways.east.every(Boolean) && ways.land, ways);
    t.check("krata przelewu (41,15): „Przelew cysterny”, !Quest_Places 0/2/0, strona 2 na przełączniku 17 -> cysterna 167 (33,3); znaczniki rynna_1..4 dla K53 (każdy z wolnym polem obok - pakiet F stawia tam gruz)",
        ways.grate && ways.grate.x === 41 && ways.grate.y === 15 && ways.grate.img.join() === "!Quest_Places,0,2,0" && ways.grate.p2 === 17 && ways.grate.to
        && ways.rynny.join() === "rynna_1,rynna_2,rynna_3,rynna_4" && ways.rynnyObok, ways);
    // the east edge: the cape not built -> a popup (or, when package C is in, the way through)
    await t.popups({ clear: true });
    await t.eval("(function(){ const e = $gameMap.events().find(e => e.x === 55 && e.y === 19); $gamePlayer.locate(54, 19); e.start(); return 0; })()");
    await t.frames(30);
    const eastPop = await t.popups(), capeReady = await t.eval("Wyspa.isReady(159)");
    t.check("prawa krawędź: przylądek niegotowy - popup nad bohaterem, bez przejścia (gotowy - przejście)",
        capeReady ? (await t.eval("$gameMap.mapId()")) === 159 : (await t.eval("$gameMap.mapId()")) === 157 && eastPop.some(p => /osunęło/.test(p)), { eastPop, capeReady });
    if (capeReady) await t.go(157, 26, 13, 8);
    // the grate shut: a popup
    await t.popups({ clear: true });
    await t.locate(41, 16, 8);
    await t.eval("$gameMap.events().find(e => e.event().name === 'Przelew cysterny').start(); 0");
    await t.frames(20);
    t.check("krata zamknięta (przełącznik 17 wyłączony): popup o kracie z krukiem", (await t.popups()).some(p => /Krata z krukiem|kratą z krukiem/.test(p)) && (await t.eval("$gameMap.mapId()")) === 157);

    // ---------------------------------------------------------------- kruczarnia: młody kruk, stado, żerdzie
    await t.locate(26, 13, 8);
    await t.frames(60);
    const rv = await t.json(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z, ${P}.state, !!${P}.wild], flock: Kruk.flock.length, wp: Kruk.wildPlace(), perch: Kruk.legs().length })`);
    t.check("kruczarnia za dnia: młody kruk na starej żerdzi (28,11; 63 px nad ziemią), wokół stado kruków (10+)",
        rv.pet && Math.abs(rv.pet[0] - 28.5) < 0.1 && Math.abs(rv.pet[1] - 12) < 0.1 && rv.pet[2] === 63 && rv.pet[3] === "sit" && rv.pet[4] && rv.flock >= 10, rv);
    await t.setHour(23);
    await t.frames(90);
    const nap = await t.json(`({ f: ${P} && Kruk.frameOf(${P}), flock: Kruk.flock.filter(b => b.nap > 30).length })`);
    t.check("nocą kruki śpią na żerdziach i murach (nastroszone, łeb pod skrzydłem)", nap.f && nap.f[0] === 6 && nap.f[1] === 4 && nap.flock >= 5, nap);
    await t.setHour(10);
    await t.frames(20);
    await t.popups({ clear: true });
    await t.eval("$gameMap.events().find(e => e.event().name === 'Gruz z kamieniem z krukiem').start(); 0");
    await t.frames(10);
    t.check("kamień z krukiem w gruzie: popup i notatka w dzienniku", (await t.popups()).some(p => /kruk/.test(p)) && (await S("Object.keys(s.stones).length")) === 1);

    // ---------------------------------------------------------------- K51: Roch, maszt o świcie, etapy
    await t.eval("(function(){ const s = TownQuests.state(); s.flags.rochMet = 2; return 0; })()");
    await t.setDay(8, 6);
    const offer = await t.eval("TownQuests.offerable('K51')");
    t.check("K51: Roch daje zadanie od dnia 8 rano (po pierwszym spotkaniu)", offer === true, offer);
    await t.go(125, 15, 30, 2);
    await t.setDay(8, 5.5);
    await t.eval("TownQuests.start('K51'); 0");
    await t.frames(40);
    const mast = await t.json(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z, ${P}.state], mast: Kruk.mastPoint(), step: TownQuests.rec('K51').step })`);
    t.check("o świcie kruk siedzi na złamanym maszcie wraku kutra (przystań)", mast.pet && Math.abs(mast.pet[0] - mast.mast.x) < 0.1 && mast.pet[2] > 80 && mast.step === 0, mast);
    await t.eval(`$gamePlayer.locate(Math.round(Kruk.mastPoint().x), Math.round(Kruk.mastPoint().y) - 3); 0`);
    await t.until("Kruk.state().k51.leg >= 1", 20);
    await t.frames(10);
    const st1 = await t.json("({ leg: Kruk.state().k51.leg, step: TownQuests.rec('K51').step })");
    t.check("bohater podchodzi: kruk kracze i odlatuje (krok 1 zaliczony, etap 1)", st1.leg >= 1 && st1.step === 1, st1);
    await t.locate(15, 5, 8);
    await t.until("Kruk.state().k51.leg >= 2", 30);
    t.check("kruk czeka przy górnej krawędzi przystani, potem leci nad klif (etap 2)", (await S("s.k51.leg")) >= 2);
    await t.go(155, 24, 30, 8);
    await t.frames(30);
    const cairn = await t.json(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z], leg: Kruk.state().k51.leg })`);
    t.check("pustelnia: kruk siedzi na kopcu z krukiem", cairn.pet && Math.abs(cairn.pet[0] - 27.5) < 0.6 && cairn.leg === 2, cairn);
    await t.locate(26, 21, 8);
    await t.until("Kruk.state().k51.leg >= 3", 30);
    t.check("bohater przy kopcu: kruk leci na wschód, ku Urwisku (etap 3)", (await S("s.k51.leg")) >= 3);
    await t.go(157, 1, 19, 6);
    await t.frames(30);
    const pine = await t.json(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z], leg: Kruk.state().k51.leg })`);
    t.check("Urwisko: kruk czeka na sośnie przy ścieżce", pine.pet && Math.abs(pine.pet[0] - 3.5) < 0.2 && pine.pet[2] > 50 && pine.leg === 3, pine);
    await t.locate(4, 20, 8);
    await t.until("Kruk.state().k51.leg >= 4", 40);
    await t.locate(27, 13, 8);
    await t.until("TownQuests.isDone('K51')", 30);
    const k51 = await t.json("({ done: TownQuests.isDone('K51'), d24: TownQuests.rec('D24'), leg: Kruk.state().k51.leg })");
    t.check("kruk siada na żerdzi w kruczarni: K51 wykonane, D24 „Oswojony kruk” zaczyna się samo", k51.done && k51.d24 && k51.d24.s === "active" && k51.d24.step === 0, k51);

    // ---------------------------------------------------------------- D24: karmienie
    await t.setDay(9, 12);
    await t.frames(40);
    await t.locate(28, 12, 8);
    await t.frames(10);
    await t.eval("(function(){ for (const id of KrukData.FOOD) { const n = $gameParty.numItems($dataItems[id]); if (n) $gameParty.loseItem($dataItems[id], n); } return 0; })()");
    await t.popups({ clear: true });
    await t.eval("Kruk.feedYoung(); 0");
    await t.frames(5);
    t.check("bez mięsa: popup nad bohaterem „Potrzebujesz mięsa albo ryby”", (await t.popups()).some(p => /mięsa albo ryby/.test(p)) && (await S("s.feeds.length")) === 0);
    await t.give(94, 5);
    await t.eval("(function(){ const d = Dog.state(); d.tame = true; d.mode = 'follow'; d.map = $gameMap.mapId(); return 0; })()");
    await t.popups({ clear: true });
    await t.eval("Kruk.feedYoung(); 0");
    await t.frames(5);
    t.check("pies przy nodze: kruk nie zejdzie (popup)", (await t.popups()).some(p => /pies/.test(p)) && (await S("s.feeds.length")) === 0);
    await t.eval("(function(){ const d = Dog.state(); d.tame = false; d.mode = 'follow'; d.map = 3; return 0; })()");
    await t.eval("Kruk.feedYoung(); 0");
    await t.frames(240);
    const f1 = await t.json(`({ feeds: Kruk.state().feeds.length, meat: $gameParty.numItems($dataItems[94]), pet: ${P} && [${P}.x, ${P}.y, ${P}.z, ${P}.state], d24: TownQuests.rec('D24').step })`);
    t.check("karmienie 1: kruk zeskakuje po mięso, je i wraca na żerdź (1/3)", f1.feeds === 1 && f1.meat === 4 && f1.pet && f1.pet[2] === 63 && f1.d24 === 0, f1);
    await t.popups({ clear: true });
    await t.eval("Kruk.feedYoung(); 0");
    await t.frames(5);
    t.check("drugi raz tego samego dnia: „już dziś jadł”", (await t.popups()).some(p => /już dziś jadł/.test(p)) && (await S("s.feeds.length")) === 1);
    // running near it: it flies off for an hour
    await t.setDay(10, 12);
    await t.frames(30);
    await t.eval("(function(){ $gamePlayer.locate(24, 13); $gamePlayer.isDashing = () => true; $gamePlayer.isMoving = () => true; return 0; })()");
    await t.frames(40);
    await t.eval("(function(){ delete $gamePlayer.isDashing; delete $gamePlayer.isMoving; return 0; })()");
    const scared = await t.json("({ until: Kruk.state().scaredUntil, wp: Kruk.wildPlace() })");
    t.check("bieg przy kruku: płoszy się na godzinę (nie ma go w kruczarni)", scared.until > 0 && scared.wp === null, scared);
    await t.setDay(10, 14);
    await t.frames(60);
    await t.locate(28, 12, 8);
    await t.eval("Kruk.feedYoung(); 0");
    await t.frames(240);
    await t.setDay(11, 9);
    await t.frames(60);
    await t.locate(28, 12, 8);
    await t.frames(10);
    await t.eval("Kruk.feedYoung(); 0");
    await t.until("Kruk.state().stage === 'tame'", 20);
    await t.until("SceneManager._scene && SceneManager._scene.constructor !== Scene_Map", 20);
    // the message lines, then the name screen
    for (let i = 0; i < 12 && !(await t.eval("!!(SceneManager._scene && Kruk.ravenScene() && SceneManager._scene instanceof Kruk.ravenScene())")); i++) { await t.press("ok"); await t.frames(15); }
    const nameUp = await t.eval("!!(SceneManager._scene && SceneManager._scene instanceof Kruk.ravenScene())");
    t.check("trzecie karmienie: kruk na ramieniu, potem ekran imienia (scena z prologu, własne teksty)", nameUp, await t.scene());
    if (nameUp) {
        await t.frames(20);
        await t.eval("(function(){ const s = SceneManager._scene; s._name = Array.from('węgielek'); s.done(); return 0; })()");
        await t.until("SceneManager._scene instanceof Scene_Map", 20);
        await t.frames(30);
    }
    const tamed = await t.json(`({ name: Kruk.state().name, stage: Kruk.state().stage, ring: $gameParty.numItems($dataItems[179]), tame: Wyspa.flag('krukTame'), k6: Wyspa.flag('kronikaKarta6'),
        d24: TownQuests.rec('D24').step, pet: ${P} && ${P}.state })`);
    t.check("oswojony: imię z polską literą („Węgielek”), obrączka 179 w torbie, flagi krukTame i kronikaKarta6, D24 krok 2 (dziadek)",
        tamed.name === "Węgielek" && tamed.stage === "tame" && tamed.ring === 1 && tamed.tame && tamed.k6 && tamed.d24 === 1, tamed);
    await t.finish();
    await t.frames(80);
    t.check("karta kroniki 6 trafia do torby (Pustelnia.js czyta flagę kronikaKarta6)", (await t.eval("(TownQuests.state().v.karta_6 || 0) > 0 || Pustelnia.isRead(6)")) === true);

    // ---------------------------------------------------------------- dziadek, grzęda
    await t.setDay(11, 14);
    await t.go(19, 9, 7, 8);
    await t.frames(30);
    const gp = await t.talkTo(901, []);
    const d24g = await t.json("({ step: TownQuests.rec('D24').step, ring: $gameParty.numItems($dataItems[179]) })");
    t.check("dziadek rozpoznaje obrączkę: „długa historia” (Ród kruczarzy), obrączka zostaje; krok 3 - grzęda",
        d24g.step === 2 && d24g.ring === 1 && /trzymał kruki/.test(gp.text || ""), { d24g, text: (gp.text || "").slice(0, 200) });
    await t.go(3, 20, 14, 2);
    await t.frames(30);
    // (integration 2026-10-16) the perch is on the Q build list only once the raven is tame (Farming_Data needFlag "krukTame")
    const qList = async () => { await t.eval("Farming.openBuildKeyMenu(); 0"); await t.frames(6);
        const names = await t.json("(SceneManager._scene._farmMenu._entries || []).map(e => e.name)"); await t.eval("SceneManager._scene.closeFarmMenu(); 0"); await t.frames(6); return names; };
    const keepTame = await t.eval("TownQuests.state().flags.krukTame");
    await t.eval("delete TownQuests.state().flags.krukTame; 0");
    const listWild = await qList();
    await t.eval(`TownQuests.state().flags.krukTame = ${JSON.stringify(keepTame)}; 0`);
    const listTame = await qList();
    t.check("„Grzęda kruka” w liście budowy (Q) dopiero po oswojeniu kruka (flaga krukTame)",
        !listWild.includes("Grzęda kruka") && listTame.includes("Grzęda kruka") && listWild.length > 3, { wild: listWild.length, tame: listTame.includes("Grzęda kruka") });
    const spot = await t.json(`(function(){ for (let y = 8; y < 20; y++) for (let x = 6; x < 30; x++) {
        if ($gameMap.checkPassage(x, y, 0x0f) && $gameMap.checkPassage(x, y + 1, 0x0f) && !$gameMap.eventsXy(x, y).length && !Farming.buildingAt(x, y) && !Farming.plotAt(x, y).crop) return { x, y }; } return null; })()`);
    await t.eval(`(function(){ const f = Farming.farm(), list = f.buildings[3] = f.buildings[3] || []; list.push({ id: f.nextId++, type: "grzeda", x: ${spot.x}, y: ${spot.y}, last: 1 }); f.rev++; return 0; })()`);
    await t.eval("TownQuests.autoChecks(); 0");
    await t.frames(10);
    t.check("grzęda na polu: D24 wykonane (100 dośw.)", await t.eval("TownQuests.isDone('D24')"));

    // ---------------------------------------------------------------- oswojony kruk: lot za bohaterem, menu (K)
    const free = (x0, y0, r) => t.json(`(function(){ for (let d = 0; d <= ${r || 6}; d++) for (let y = ${y0} - d; y <= ${y0} + d; y++) for (let x = ${x0} - d; x <= ${x0} + d; x++)
        if ($gameMap.isValid(x, y) && $gameMap.checkPassage(x, y, 0x0f) && !$gameMap.eventsXy(x, y).length && !Farming.buildingAt(x, y)) return { x, y }; return null; })()`);
    const near = await free(spot.x, spot.y + 2);
    await t.locate(near.x, near.y, 2);
    await t.frames(300);
    const fol = await t.json(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z, ${P}.state], hero: [$gamePlayer.x + 0.5, $gamePlayer.y + 0.9], mode: Kruk.state().mode })`);
    const dist = p => p.pet ? Math.hypot(p.pet[0] - p.hero[0], p.pet[1] - p.hero[1]) : 99;
    t.check("„Leć ze mną”: kruk jest przy bohaterze na polu (drzewo, ziemia albo ramię)", fol.mode === "follow" && fol.pet && dist(fol) < 7.5, fol);
    const far = await free(near.x + 12, near.y, 8);
    await t.locate(far.x, far.y, 2);
    await t.frames(30);
    const flying = await t.json(`${P} && ${P}.state`);
    await t.frames(400);
    const fol2 = await t.json(`({ pet: ${P} && [${P}.x, ${P}.y, ${P}.z, ${P}.state], hero: [$gamePlayer.x + 0.5, $gamePlayer.y + 0.9] })`);
    t.check("bohater odchodzi: kruk podrywa się i przelatuje bliżej niego", ["fly", "takeoff", "land"].includes(flying) && fol2.pet && dist(fol2) < 7.5 && fol2.pet[3] !== "fly", { flying, fol2 });
    await t.key("K");
    await t.frames(10);
    const menu = await t.json("(function(){ const m = SceneManager._scene._farmMenu; return m && m.visible ? { title: m._title, names: m._entries.map(e => e.name) } : null; })()");
    t.check("klawisz K: menu kruka „Kruk: Węgielek” (leć ze mną, grzęda, pilnuj pola, nakarm, list, zwiad)",
        menu && /Węgielek/.test(menu.title) && ["Leć ze mną", "Zostań na grzędzie", "Pilnuj pola", "Nakarm", "Zanieś list", "Leć na zwiad"].every(n => menu.names.includes(n)), menu);
    await t.eval("SceneManager._scene.closeFarmMenu(); 0");
    await t.frames(5);

    // ---------------------------------------------------------------- listy
    await t.eval("(function(){ Kruk.state().opinion = {}; return 0; })()");
    await t.eval("(function(){ const s = SceneManager._scene; Kruk.openRavenMenu(); const e = s._farmMenu._entries.find(e => e.name === 'Zanieś list'); s.closeFarmMenu(); e.run(); return 0; })()");
    await t.frames(5);
    const letters = await t.json("SceneManager._scene._farmMenu._entries.map(e => [e.name, e.enabled !== false])");
    await t.eval("SceneManager._scene.closeFarmMenu(); 0");
    t.check("„Zanieś list”: dziadek, Janek, Kleofas... i „Matka (za morzem)” wyłączona - kruk nie leci przez morze",
        letters.some(l => l[0] === "Dziadek Stach" && l[1]) && letters.some(l => /^Matka/.test(l[0]) && !l[1]), letters);
    await t.popups({ clear: true });
    await t.eval("Kruk.sendLetter('grandpa'); 0");
    await t.frames(240);
    const gone = await t.json(`({ away: Kruk.state().away && Kruk.state().away.kind, pet: !!${P} })`);
    t.check("kruk odlatuje z listem (nie ma go na mapie)", gone.away === "letter" && !gone.pet, gone);
    await t.eval("Kruk.sendLetter('janek'); 0");
    await t.frames(5);
    t.check("drugi list tego samego dnia: „Dziś ... już niósł list”", (await t.popups()).some(p => /już niósł list/.test(p)));
    await t.eval("$gameSystem.setDayNightHour($gameSystem.dayNightHour() + 2.1); 0");
    await t.until("!Kruk.state().away", 10);
    await t.frames(300);
    const back = await t.json(`({ sent: Kruk.state().sent.grandpa, pet: ${P} && ${P}.state, pops: window.__kit.pops.map(p => p.text) })`);
    t.check("po dwóch godzinach kruk wraca z odpowiedzią dziadka (dymek i popup)", back.sent === 1 && back.pet && back.pops.some(p => /^Dziadek:/.test(p)), back);

    // ---------------------------------------------------------------- zwiad (2026-10-17: raport zamiast znaków na mapie)
    // the meadow (Map004) visited first: its catalogue of berry bushes and mushroom tiles is noted while the hero is there
    await t.setDay(12, 8.5);
    const meadow = await t.json(`(function(){ return { name: ($dataMapInfos[4] || {}).name || "" }; })()`);
    await t.go(4, 20, 20, 2);
    await t.until("!!(Kruk.state().cat && Kruk.state().cat[4])", 15);
    const cat4 = await t.json("(function(){ const c = Kruk.state().cat[4]; return c ? { bush: c.bush.length, mush: c.mush.length, w: c.w } : null; })()");
    t.check("na mapie bohatera kruk notuje, gdzie mogą rosnąć krzaki jagód i grzyby (katalog mapy 4)", cat4 && cat4.w === (await t.eval("$dataMap.width")) && cat4.bush + cat4.mush > 0, cat4);
    await t.go(3, near.x, near.y, 2);
    await t.frames(30);
    await t.setDay(12, 9);
    await t.notices({ clear: true });
    await t.popups({ clear: true });
    await t.eval("Kruk.sendScout(4); 0");
    await t.frames(30);
    t.check("zwiad: kruk leci obejrzeć łąkę (mapa 4), plik mapy wczytany w locie", (await S("s.away && s.away.kind")) === "scout" && (await t.eval("Kruk.mapLoaded(4)")) === true);
    await t.eval("$gameSystem.setDayNightHour($gameSystem.dayNightHour() + 1.6); 0");
    await t.until("!Kruk.state().away", 10);
    await t.frames(240);
    const rep = await t.json(`(function(){ const s = Kruk.state().scout, title = "Zwiad kruka: " + s.name, notes = Journal.data().notes.filter(n => n.title === title);
        return { scout: s, notes: notes.map(n => n.text), tops: window.__kit.tops.slice(), pops: window.__kit.pops.map(p => p.text), marks: !!SceneManager._scene._krukMarks || typeof Kruk.marks === "function",
            plan: Kruk.state().plans && Kruk.state().plans[4], bubble: Kruk.pet && Kruk.pet.state }; })()`);
    t.check("po powrocie od razu podsumowanie u góry: „Zwiad kruka: <łąka>” i co tam jest dziś", rep.scout && rep.scout.map === 4 && rep.tops.some(x => x.startsWith("Zwiad kruka: ") && x.includes(rep.scout.text)), rep);
    t.check("w dzienniku notatka „Zwiad kruka: <łąka>” z dniem, porą roku i tym samym podsumowaniem", rep.notes.length === 1 && /^Dzień 12 \(wiosna\), godz\. 10:/.test(rep.notes[0]) && rep.notes[0].includes(rep.scout.text), rep.notes);
    t.check("wilki na łące (nocą): czerwony popup „Uwaga! ...: wataha wilków ...”", rep.scout.warn && /wilk/.test(rep.scout.warn) && rep.pops.some(p => /^Uwaga! /.test(p) && /wilk/.test(p)), { warn: rep.scout.warn, pops: rep.pops });
    t.check("bez znaczników na mapie (żadnych kółek ani strzałek, żadnego popupu przy wejściu)", !rep.marks, rep.marks);
    // the report is TRUE: the meadow the same day - the game, the berries, the mushrooms, the night's camp
    const num = (re, txt) => { const m = re.exec(txt); return m ? Number(m[1] || 1) : 0; };
    const want = { rabbit: num(/(\d+) zaj/, rep.scout.text), berries: num(/(\d+) krzak/, rep.scout.text), mush: num(/(\d+) grzyb/, rep.scout.text) };
    await t.setDay(12, 10.4);
    await t.go(4, 20, 20, 2, { calm: false });
    await t.eval("(function(){ Hunting.auto(true); return 0; })()");
    await t.frames(240);
    const live = await t.json(`(function(){ let berries = 0, mush = 0; for (let y = 0; y < $gameMap.height(); y++) for (let x = 0; x < $gameMap.width(); x++) {
            const g = Farming.gatherAt(x, y); if (g === "mushroom") mush++; else if (g === "bush" && Farming.bushState(x, y) === "full") berries++; }
        return { rabbit: Hunting.animals.filter(a => a.kind() === "rabbit").length, berries, mush }; })()`);
    await t.eval("(function(){ Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); return 0; })()");
    t.check("raport prawdziwy: na łące tego dnia tyle zajęcy, krzaków jagód i grzybów, ile powiedział kruk", live.rabbit === want.rabbit && live.berries === want.berries && live.mush === want.mush, { want, live, text: rep.scout.text });
    await t.setDay(12, 22.5);
    await t.eval("(function(){ Humans.auto(true); return 0; })()");
    await t.frames(150);
    const night = await t.json(`(function(){ const c = Humans.state().camps[4], b = Humans.campHere(); return { plan: Kruk.state().plans[4], camp: c && { none: !!c.none, night: c.night, n: c.members ? c.members.length : 0 }, here: !!b }; })()`);
    await t.eval("(function(){ Humans.auto(false); Humans.clear(); return 0; })()");
    t.check("noc na łące zgodna z raportem: obóz bandytów jest dokładnie wtedy, gdy kruk go zapowiedział (i tej wielkości)",
        night.plan && night.camp && night.camp.night === night.plan.night && (night.plan.camp ? (!night.camp.none && night.camp.n === night.plan.size && night.here) : night.camp.none), night);
    // ...and when the raven foretells a camp (the next night's plan, its dice made to say "camp"), the camp stands there, that big
    await t.setDay(13, 11);
    const plan13 = await t.json(`(function(){ const r = Math.random; Math.random = () => 0.01; try { return Kruk.planNight(4, null); } finally { Math.random = r; } })()`);
    await t.setDay(13, 22.5);
    await t.eval("(function(){ Humans.auto(true); return 0; })()");
    await t.frames(150);
    const night13 = await t.json(`(function(){ const c = Humans.state().camps[4]; return { camp: c && { none: !!c.none, night: c.night, n: c.members ? c.members.length : 0 }, men: Humans.campHere() ? Humans.band("camp") && Humans.band("camp").members.length : 0 }; })()`);
    await t.eval("(function(){ Humans.auto(false); Humans.clear(); return 0; })()");
    t.check("zapowiedziany obóz stoi nocą na łące, tylu ludzi, ilu powiedział kruk", plan13 && plan13.camp && night13.camp && !night13.camp.none && night13.camp.night === 13 && night13.camp.n === plan13.size, { plan13, night13 });
    await t.go(3, near.x, near.y, 2);
    await t.setDay(12, 9);
    await t.frames(30);

    // ---------------------------------------------------------------- błyskotki: monety, cudzy list oddany właścicielowi
    const g0 = await t.gold();
    await t.eval("(function(){ Kruk.state().trinket = { kind: 'coins', n: 3 }; Kruk.takeTrinket(); return 0; })()");
    t.check("błyskotka: kruk przyniósł 3 G", (await t.gold()) === g0 + 3);
    await t.eval("(function(){ Kruk.state().trinket = { kind: 'letter', id: 'tadek' }; Kruk.takeTrinket(); SceneManager._scene.closeFarmMenu(); return 0; })()");
    t.check("cudzy list: „Liścik Tadka do Hanki” schowany (nieprzeczytany)", await t.eval("!!Kruk.state().held.tadek && !Kruk.state().held.tadek.read"));
    await t.setDay(12, 10);
    await t.go(8, 30, 30, 2);
    await t.frames(60);
    const op0 = await t.eval("TownQuests.opinion()");
    const tad = await t.talkTo("TownLife.eventOf('kowal')", []);
    const op1 = await t.json("({ op: TownQuests.opinion(), held: !!Kruk.state().held.tadek, gone: Kruk.state().gone.tadek, flag: Wyspa.flag('krukUfa_kowal') })");
    t.check("list oddany Tadkowi: Opinia +1, Tadek ufa (flaga krukUfa_kowal)", op1.op === op0 + 1 && !op1.held && op1.gone === "back" && op1.flag && /podkow|kruk/i.test(tad.text || ""), { op0, op1, text: (tad.text || "").slice(0, 160) });

    // ---------------------------------------------------------------- pilnowanie pola
    await t.go(3, near.x, near.y, 2);
    await t.frames(60);
    await t.eval("Kruk.setMode('guard'); 0");
    await t.frames(400);
    const gd = await t.json(`({ mode: Kruk.state().mode, pet: ${P} && [${P}.x, ${P}.y, ${P}.z, ${P}.state], perch: Kruk.perch() && [Kruk.perch().b.x, Kruk.perch().b.y] })`);
    t.check("„Pilnuj pola”: kruk siedzi na grzędzie (65 px)", gd.mode === "guard" && gd.pet && gd.pet[2] === 65 && Math.abs(gd.pet[0] - gd.perch[0] - 0.5) < 0.05, gd);
    const crops = await t.json(`(function(){ const f = Farming.farm(), p = Kruk.perch().b, plots = f.plots[3] = f.plots[3] || {}, crop = Object.keys(Farming.CROPS)[0], out = [];
        for (const [dx, dy] of [[2, 1], [-2, 2], [3, -1], [1, 3]]) { const x = p.x + dx, y = p.y + dy; if ($gameMap.checkPassage(x, y, 0x0f) && !Farming.buildingAt(x, y)) { plots[x + ',' + y] = { s: 'tilled', crop, day: $gameSystem.dayNightDay() - 3 }; out.push([x, y]); } }
        f.rev++; return { crop, out }; })()`);
    await t.eval("(function(){ Birds.RELOCATE.chance = 0; Birds.startRaid({ kind: 'crow', size: 3, hours: 1 }); return 0; })()");
    await t.until("!Birds.raid || Birds.raid.leaving", 25);
    const chase = await t.json("({ raid: !!Birds.raid, leaving: Birds.raid ? !!Birds.raid.leaving : true, pops: window.__kit.pops.map(p => p.text).slice(-6) })");
    t.check("nalot wron na zasiewy przy grzędzie: kruk przegania stadko", chase.leaving && chase.pops.some(p => /przegania ptaki/.test(p)), chase);
    // away: the raids planned while the hero was elsewhere - the crops round the perch stay
    await t.frames(200);
    const left = await t.json(`(function(){ const f = Farming.farm(), ps = f.plots[3]; return ${JSON.stringify(crops.out)}.filter(([x, y]) => ps[x + ',' + y] && ps[x + ',' + y].crop).length; })()`);
    await t.eval("(function(){ const r = Birds.store().maps[3] = Birds.store().maps[3] || {}; r.upto = ($gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()) - 40; Kruk.guardAway(); return 0; })()");
    const left2 = await t.json(`(function(){ const f = Farming.farm(), ps = f.plots[3]; return { n: ${JSON.stringify(crops.out)}.filter(([x, y]) => ps[x + ',' + y] && ps[x + ',' + y].crop).length,
        upto: Birds.store().maps[3].upto, now: $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() }; })()`);
    t.check("pod nieobecność (40 godzin planowanych nalotów): zasiewy w promieniu 5 pól od grzędy zostają", left2.n === left && left2.upto > left2.now - 40, { left, left2 });

    // ---------------------------------------------------------------- ostrzeżenie, głód, zapis
    await t.eval("Kruk.setMode('follow'); 0");
    await t.frames(300);
    await t.popups({ clear: true });
    // (a wolf's stand-in, there for one call only: Hunting's own animals are not touched)
    await t.eval(`(function(){ const fake = { _dead: false, kind: () => 'wolf', _realX: $gamePlayer._realX + 4, _realY: $gamePlayer._realY }; Hunting.animals.push(fake);
        try { Kruk.warnCheck(); } finally { Hunting.animals.splice(Hunting.animals.indexOf(fake), 1); } return 0; })()`);
    await t.frames(5);
    t.check("wilk blisko: kruk kracze ostrzegawczo (popup)", (await t.popups()).some(p => /kracze ostrzegawczo/.test(p)));
    // (it may be on its way somewhere at this moment - wait till it is there; then till it has flown off the screen: a fixed 200
    // frames was not always enough - the "spłoszony" check failed now and then, 2026-10-16)
    await t.until(`!!${P} && ${P}.kind === "pet"`, 15);
    await t.eval("Kruk.frighten(); 0");   // (what the bus's heroDown / a close lightning calls)
    await t.until(`!${P}`, 20);
    await t.frames(10);
    const fled = await t.json(`({ until: Kruk.state().fledUntil, now: $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour(), pet: !!${P}, place: Kruk.tamePlace() })`);
    t.check("bohater powalony: kruk spłoszony odlatuje na Urwisko do rana", fled.until > fled.now && !fled.pet && fled.place === null, fled);
    await t.eval("(function(){ Kruk.state().fledUntil = 0; return 0; })()");
    await t.frames(200);
    await t.eval(`(function(){ const s = Kruk.state(); s.food = 0; s.zeroSince = $gameSystem.dayNightDay() - 3; s.clock = $gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour() - 1;
        const p = Kruk.perch(); if (p && p.b.store) p.b.store = {}; Kruk.tickNeeds(); return 0; })()`);
    t.check("głodny trzy dni: kruk odlatuje na Urwisko", (await S("s.stage")) === "gone");
    await t.setDay(13, 10);
    await t.go(157, 28, 12, 8);
    await t.frames(60);
    await t.give(98, 1);
    await t.eval("Kruk.feedYoung(); 0");
    await t.until("Kruk.state().stage === 'tame'", 20);
    t.check("nakarmiony w kruczarni wraca do bohatera", (await S("[s.stage, s.mode].join()")) === "tame,follow");
    await t.frames(200);
    await t.saveTo(1);
    await t.eval("(function(){ Kruk.state().name = 'X'; return 0; })()");
    await t.loadFrom(1);
    await t.frames(30);
    t.check("zapis i wczytanie: imię i oswojenie zostają", (await S("[s.name, s.stage].join()")) === "Węgielek,tame");

    // ---------------------------------------------------------------- nocny obóz kopaczy po D25
    await t.eval("(function(){ TownQuests.state().flags.dziennikOkretu = 12; return 0; })()");
    await t.eval("if (window.Humans && Humans.auto) Humans.auto(true); 0");
    await t.setDay(14, 22);
    await t.go(157, 40, 20, 6);
    await t.frames(120);
    const camp = await t.json("(function(){ const c = Humans.state().camps[157], b = Humans.band('kopaczeUrwisko'); return { tag: c && c.tag, x: c && c.x, n: b ? b.members.filter(m => !m._dead).length : 0, night: Kruk.campNight() }; })()");
    t.check("nocą po D25 na Urwisku obóz obcych kopaczy (Humans.js, przy ognisku 47,22)", camp.tag === "kopaczeUrwisko" && camp.x === 47 && camp.n === 3, camp);
    await t.eval("if (window.Humans) { Humans.auto(false); Humans.clear(); } 0");
});
