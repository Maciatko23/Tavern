// Mapa wyspy (MapaWyspy.js: the P menu's "Mapa" tab - the sketch of the known places with the roads, the hero and the followed goal,
// the arrows between the places, O the place's card, P back) and the cart of Wojciech (Woz.js: "Podwieź mnie" in the carter's menu,
// the stop chosen on the sketch, the fare, the hours that pass, the arrival by the cart, the refusals - the night, no money, a beast
// after him, grandpa's field shut -, the dog along). CDP_PORT=9701. Screenshots: docs/mapa_wyspy/*.png.
"use strict";
const path = require("path");
const kit = require("./lib/kit.js");
const OUT = path.join(__dirname, "..", "docs", "mapa_wyspy");

kit.test({ port: 9701, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    t.check("nowa gra (dom dziadka)", await t.newGame({ story: true, skipIntro: true, hour: 10, quiet: true, minimap: false }));
    await t.eval("ConfigManager.uiClean = true; window.dispatchEvent(new Event('pointerdown')); 0");
    await t.frames(30);
    const info = () => t.json("MenuRing.info()");
    const inMenu = "SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()";
    const key = async (k, n) => { await t.key(k); await t.frames(n || 6); return info(); };
    const shot = name => t.shot(path.join(OUT, name + ".png"));
    const visit = ids => t.eval(`(function(){ const s = Tawerna.state("nazwaMapy"); for (const id of ${JSON.stringify(ids)}) s.odw[id] = 1; return Object.keys(s.odw).length; })()`);

    // ---------------------------------------------------------------- the places: known, a "?" beside a known one, hidden further on
    let nodes = await t.json("MapaWyspy.nodes().map(n => [n.key, n.state, n.here])");
    const st = k => (nodes.find(n => n[0] === k) || [])[1];
    t.check("dom dziadka (wnętrze 19 -> podwórze 20) jest miejscem bohatera i jest znane", st("20") === "known" && nodes.find(n => n[0] === "20")[2] === true, nodes);
    t.check("Leśna droga za podwórzem to „?”, miasteczko i Przystań ukryte", st("21") === "hint" && st("8") === "hidden" && st("125") === "hidden", { l: st("21"), m: st("8"), p: st("125") });
    t.check("podziemia ukryte (żadnego piętra), wnętrza nie są punktami", st("podziemia") === "hidden" && !nodes.some(n => n[0] === "19" || n[0] === "1"), nodes.length);
    await visit([21, 22, 8]);
    nodes = await t.json("MapaWyspy.nodes().map(n => [n.key, n.state])");
    t.check("odwiedzone mapy stają się znane (Leśna droga, Polna droga, miasteczko), ich sąsiedzi „?”", st("21") === "known" && st("8") === "known" && st("111") === "hint" && st("24") === "hint" && st("13") === "hint", nodes);
    t.check("wnętrze liczy się jako jego miejsce (Dno studni -> miasteczko)", (await t.eval("MapaWyspy.placeOf(118)")) === 8 && (await t.eval("MapaWyspy.placeOf(131)")) === "podziemia" && (await t.eval("MapaWyspy.placeOf(173)")) === 24);

    // ---------------------------------------------------------------- the tab: P, D to Mapa, O in, the arrows, O the card, P back
    await t.key("P");
    t.check("P otwiera menu", await t.until(inMenu, 10));
    await t.frames(40);
    let m = await info();
    for (let i = 0; i < 10 && m.active !== "mapa"; i++) m = await key("D", 12);
    t.check("zakładka „Mapa” między Dziennikiem a Opcjami", m.active === "mapa" && m.labels[m.tabs.indexOf("mapa") - 1] === "Dziennik" && m.labels[m.tabs.indexOf("mapa") + 1] === "Opcje", m.labels);
    t.check("podgląd: bohater i znane miejsca na schemacie, nieznane jako „?”", m.level === 1 && m.mapa && m.mapa.here === "20" && m.mapa.known.includes("20") && m.mapa.known.includes("8") && m.mapa.hints.includes("111"), m.mapa && { here: m.mapa.here, known: m.mapa.known, hints: m.mapa.hints });
    const tgt = await t.json("(function(){ const c = Tawerna.api('CleanHUD_Compass'); const t = c.target(); return t ? { map: t.map, name: t.name } : null; })()");
    const tgtPlace = tgt ? String(await t.eval(`MapaWyspy.placeOf(${tgt.map})`)) : null;
    const tgtNode = m.mapa && m.mapa.nodes.find(n => n.key === tgtPlace);
    t.check("znacznik celu: śledzony cel (działka dziadka) jest na mapie w swoim miejscu - jeszcze nieznanym, więc jako „?” z rombem", tgt && m.mapa.target === tgtPlace && tgtNode && tgtNode.state !== "hidden" && tgtNode.target, { tgt, target: m.mapa.target, node: tgtNode });
    await shot("menu_mapa");
    m = await key("O", 8);
    t.check("O: w mapę (poziom 2), kursor na miejscu bohatera, klawisze W/S/A/D miejsce · O karta · P wróć", m.level === 2 && m.mapa.cursor === "20" && m.keyCaps.join() === "W/S/A/D,O,P" && m.keys[1] === "karta miejsca", m.keys);
    m = await key("S", 8);
    t.check("S: kursor idzie w dół na Leśną drogę", m.mapa.cursor === "21", m.mapa.cursor);
    m = await key("A", 8);
    t.check("A: w lewo na Polną drogę", m.mapa.cursor === "22", m.mapa.cursor);
    m = await key("W", 8);
    t.check("W: w górę na miasteczko", m.mapa.cursor === "8", m.mapa.cursor);
    m = await key("S", 8);
    m = await key("O", 8);
    const pod = await t.eval("Watki.teksty('miejsca').mapa['22'].pod"), opis = await t.eval("Watki.teksty('miejsca').mapa['22'].opis");
    t.check("O: karta miejsca - nazwa, podpis i zdanie z miejsca.txt, klawisz P", m.mapa.card && m.mapa.cardData.title === "Polna droga" && m.mapa.cardData.sub === pod && m.mapa.cardData.opis === opis && m.keyCaps.join() === "P", m.mapa.cardData);
    m = await key("W", 8);
    m = await key("O", 8);
    t.check("na karcie strzałki i O nic nie zmieniają", m.mapa.card && m.mapa.cursor === "22" && m.mapa.cardData.title === "Polna droga", m.mapa.cursor);
    m = await key("P", 8);
    t.check("P zamyka kartę (kursor zostaje)", !m.mapa.card && m.level === 2 && m.mapa.cursor === "22", { card: m.mapa.card, level: m.level });
    m = await key("W", 8);
    m = await key("O", 8);
    const cd = m.mapa.cardData || {};
    t.check("karta miasteczka: ludzie (Tadek Młot), sklepy i usługi (tawerna, kowal), 30+ wnętrz (Piekarnia)", cd.title === "Okolice Tawerny" && cd.ludzie.some(l => /Tadek Młot/.test(l)) && cd.sklepy.some(s => /Tawerna/.test(s)) && cd.sklepy.some(s => /Tadek Młot/.test(s)) && cd.wnetrza.length >= 30 && cd.wnetrza.includes("Piekarnia"), { ludzie: cd.ludzie && cd.ludzie.length, sklepy: cd.sklepy, wnetrza: cd.wnetrza && cd.wnetrza.length });
    t.check("karta miasteczka wymienia postój wozu z godzinami", /wóz Wojciecha stoi tu: 7:00-8:00/.test(cd.woz || ""), cd.woz);
    await shot("karta_miejsca");
    m = await key("P", 8);
    m = await key("P", 8);
    t.check("P na mapie wraca do zakładek", m.level === 1 && m.active === "mapa", m.level);
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 10);

    // ---------------------------------------------------------------- the cart: the timetable, the carter and the cart before the south gate
    await visit([8, 111, 125, 3, 21, 22, 23]);
    await t.gold(30);
    const whereAt = async h => { await t.setHour(h); await t.frames(2); return t.eval("Woz.where()"); };
    const plan = {};
    for (const h of [6.5, 7.5, 8.2, 9.8, 12, 14, 16.5, 19, 21.5, 23]) plan[h] = await whereAt(h);
    t.check("rozkład: 7-8 miasto, 8:00-8:30 w drodze, 9:30-10:30 Przystań, 11:30-12:30 miasto, 13:30-14:30 Leśna droga, 16-17 Kruczy Jar, 18:30-19:30 miasto, 21:20-22:40 miasto (K15), noc nic",
        plan[6.5] === null && plan[7.5] === "miasto" && plan[8.2] === null && plan[9.8] === "przystan" && plan[12] === "miasto" && plan[14] === "lesna" && plan[16.5] === "jar" && plan[19] === "miasto" && plan[21.5] === "miasto" && plan[23] === null, plan);
    t.check("cena i czas: miasto -> Podgrodzie 4 G, pół godziny; -> Przystań 6 G, 1 godz.; -> Kruczy Jar 8 G, 1 godz. 30 min", (await t.json("[Woz.hops('miasto','podgrodzie'), Woz.hops('miasto','przystan'), Woz.hops('miasto','jar'), Woz.priceOf(1), Woz.priceOf(2), Woz.priceOf(3), Woz.timeWords(Woz.timeOf(1)), Woz.timeWords(Woz.timeOf(2)), Woz.timeWords(Woz.timeOf(3))]")).join() === "1,2,3,4,6,8,30 min,1 godz.,1 godz. 30 min");
    await t.setHour(11.7);
    await t.go(8, 50, 90, 6);
    await t.frames(30);
    const town = await t.json(`(function(){ const ev = TownLife.eventOf("woznica"), cart = $gameMap.event(Woz.IDS.woz); return { where: Woz.where(), here: Woz.hereStop(), w: ev ? [ev.x, ev.y, !ev._town.hidden] : null, cart: cart ? [cart.x, cart.y, !cart.isTransparent(), cart.isNormalPriority()] : null, serving: Woz.serving() }; })()`);
    t.check("11:40 w miasteczku: Wojciech stoi przy bramie południowej (54,90), wóz pokazany obok (56,90), woźnica wozi", town.where === "miasto" && town.here === "miasto" && town.w && town.w[0] === 54 && town.w[1] === 90 && town.w[2] && town.cart && town.cart[0] === 56 && town.cart[2] && town.cart[3] && town.serving, town);
    await shot("postoj_miasto");
    await t.setHour(8.2);
    await t.frames(30);
    const road = await t.json(`(function(){ const cart = $gameMap.event(Woz.IDS.woz); return { where: Woz.where(), cart: cart ? [!cart.isTransparent(), cart.isNormalPriority()] : null, rows: Tawerna.talk.rows("woznica", { ev: TownLife.eventOf("woznica") }, []).map(r => r.label) }; })()`);
    t.check("8:10 wóz w drodze: ukryty (nie zawadza), „Podwieź mnie” znika z rozmowy", road.where === null && road.cart && !road.cart[0] && !road.cart[1] && !road.rows.includes("Podwieź mnie"), road);

    // ---------------------------------------------------------------- the refusals: the night, a beast, no money, the field shut
    await t.setHour(22);
    await t.frames(2);
    const night = await t.json(`({ cannot: Woz.cannot(), serving: Woz.serving(), rows: Tawerna.talk.rows("woznica", { ev: TownLife.eventOf("woznica") }, []).map(r => r.label) })`);
    t.check("nocą (22:00): odmowa „po zmroku”, bez wiersza w menu", /zmroku/.test(night.cannot) && !night.serving && !night.rows.includes("Podwieź mnie"), night);
    await t.setHour(11.7);
    await t.frames(2);
    const danger = await t.json(`(function(){ const P = Tawerna.api("Farming_parts"), old = P.build.restDanger; P.build.restDanger = () => "wilk"; const w = Woz.cannot(); P.build.restDanger = old; return { w, after: Woz.cannot() }; })()`);
    t.check("gdy goni zwierzę (wilk): odmowa z nazwą, potem znów wolno", /wilk/.test(danger.w) && danger.after === null, danger);
    await t.gold(3);
    const poor = await t.json(`Woz.destinations("miasto").map(d => [d.key, d.enabled, d.why, d.cena])`);
    t.check("bez pieniędzy (3 G): każdy postój „brakuje N G”, żaden do wyboru", poor.length >= 4 && poor.every(d => !d[1] && /brakuje/.test(d[2])) && poor.find(d => d[0] === "podgrodzie")[2] === "brakuje 1 G", poor);
    await t.gold(30);
    const shut = await t.json(`(function(){ const S = Tawerna.api("Story"), old = S.fieldLocked; S.fieldLocked = () => true; const d = Woz.destinations("miasto").find(x => x.key === "jar"); S.fieldLocked = old; return [d.enabled, d.why, Woz.destinations("miasto").find(x => x.key === "jar").enabled]; })()`);
    t.check("działka zabrana przez Lorda: Kruczy Jar „zamknięte”, nie do wyboru; otwarta - wolno", shut[0] === false && shut[1] === "zamknięte" && shut[2] === true, shut);
    const unknown = await t.json(`(function(){ const s = Tawerna.state("nazwaMapy"), keep = Object.assign({}, s.odw); for (const k of [111, 125, 3, 21]) delete s.odw[k]; const d = Woz.destinations("miasto"); s.odw = keep; return d.length; })()`);
    t.check("tylko znane postoje do wyboru (bez odwiedzin: żaden)", unknown === 0, unknown);

    // ---------------------------------------------------------------- the ride: "Podwieź mnie", the stop on the sketch, the fare, the hours, the arrival, the dog
    await t.eval(`(function(){ const d = Dog.state(); d.tame = true; d.mode = "follow"; d.map = 8; d.x = -1; d.y = -1; if (window.Needs && Needs.setEnabled) Needs.setEnabled(true); Needs.state().food = 80; Needs.state().water = 80; return 0; })()`);
    const before = await t.json("({ gold: $gameParty.gold(), hour: Tawerna.time.hour(), day: Tawerna.time.day(), food: Needs.state().food, water: Needs.state().water })");
    const talk = await t.talkTo("TownLife.eventOf('woznica')", ["Podwieź mnie"], { secs: 4, keep: true });
    await t.eval("window.__drv.on = false; 0");
    const sceneUp = await t.until("SceneManager._scene instanceof MapaWyspy.Scene_MapaWybor && !SceneManager.isSceneChanging()", 10);
    let ch = await t.json("MapaWyspy.choosing()");
    t.check("„Podwieź mnie” w menu Wojciecha otwiera wybór postoju na mapie wyspy (tytuł, kursor na najbliższym: Podgrodzie)", sceneUp && talk.choices.some(c => c.includes("Podwieź mnie")) && ch && ch.title === "Dokąd cię podwieźć?" && ch.cursor === "111", { choices: talk.choices, ch });
    t.check("postoje z ceną i czasem: Podgrodzie 4 G · 30 min, Przystań 6 G · 1 godz., Leśna droga 6 G, Kruczy Jar 8 G · 1 godz. 30 min", ch.items.length === 4 && ch.items.every(i => i.enabled)
        && /^4 G · 30 min · na miejscu ok\. 12:1\d/.test(ch.items.find(i => i.key === "111").note) && /^6 G · 1 godz\. · na miejscu ok\. 12:4\d/.test(ch.items.find(i => i.key === "125").note) && /^8 G · 1 godz\. 30 min/.test(ch.items.find(i => i.key === "3").note), ch.items);
    await shot("wybor_postoju");
    await t.key("ArrowLeft");
    await t.frames(6);
    ch = await t.json("MapaWyspy.choosing()");
    t.check("strzałka w lewo: kursor na Przystań", ch.cursor === "125", ch.cursor);
    await t.key("O");
    const arrivedMap = await t.until(t.onMap(125), 20);
    await t.frames(40);
    const after = await t.json(`(function(){ const p = $gamePlayer, ev = $gameMap.event(Woz.IDS.woznica), cart = $gameMap.event(Woz.IDS.woz), d = Dog.state();
        return { map: $gameMap.mapId(), x: p.x, y: p.y, gold: $gameParty.gold(), hour: Tawerna.time.hour(), day: Tawerna.time.day(), food: Needs.state().food, water: Needs.state().water,
            where: Woz.where(), ride: Woz.state().ride, rides: Woz.state().rides, dog: d.map, carter: ev ? [ev.x, ev.y, !ev.isTransparent()] : null, cart: cart ? [cart.x, cart.y, !cart.isTransparent()] : null,
            free: $gameMap.checkPassage(p.x, p.y, 0x0f), event: $gameMap.isEventRunning(), arrived: Woz.arrived() }; })()`);
    t.check("O: przejazd - bohater na Przystani przy postoju (ok. 103,17), na wolnym polu, rozmowa skończona", arrivedMap && after.map === 125 && Math.abs(after.x - 103) <= 3 && Math.abs(after.y - 17) <= 3 && after.free && !after.event, after);
    t.check("opłata 6 G zdjęta, minęła godzina drogi (11:42 -> 12:42)", after.gold === before.gold - 6 && Math.abs(after.hour - (before.hour + 1)) < 0.08 && after.day === before.day, { before: before.gold, after: after.gold, h0: before.hour, h1: after.hour });
    t.check("głód i pragnienie minęły jak przy godzinie na nogach", after.food < before.food && after.water < before.water, { food: [before.food, after.food], water: [before.water, after.water] });
    t.check("wóz i Wojciech stoją przy postoju na Przystani (106,17 / 104,17), zostają tam godzinę", after.where === "przystan" && after.ride && after.ride.stop === "przystan" && after.rides === 1 && after.carter && after.carter[0] === 104 && after.carter[2] && after.cart && after.cart[2], after);
    t.check("pies pojechał z bohaterem", after.dog === 125, after.dog);
    const pops = await t.popups();
    t.check("dymek przyjazdu nad bohaterem: Przystań, 6 G, w drodze 1 godz.", pops.some(p => /Przystań.*6 G.*1 godz\./.test(p)) || (after.arrived && /Przystań/.test(after.arrived.text)), pops);
    await shot("przyjazd_przystan");
    // the stand-in carter on the harbour talks like the resident, with the ride's row; the ride back with no talk (Woz.go)
    const back = await t.talkTo(`$gameMap.event(${await t.eval("Woz.IDS.woznica")})`, ["Bywaj"], { secs: 8 });
    t.check("Wojciech na Przystani zaprasza na wóz i ma w menu „Podwieź mnie” i „Bywaj.”", back.done && back.choices.length && back.choices[0].includes("Podwieź mnie") && back.choices[0][back.choices[0].length - 1] === "Bywaj." && /wóz|konie|grosz|Dokąd/i.test(back.text), { choices: back.choices, text: back.text });
    await t.setHour(15);   // (the cart has moved on: the ride's hour is over - the timetable has it on the road at 14:30-16:00)
    await t.frames(25);
    const gone = await t.json(`(function(){ const ev = $gameMap.event(Woz.IDS.woznica); return { where: Woz.where(), shown: ev ? !ev.isTransparent() : null, here: Woz.hereStop() }; })()`);
    t.check("po godzinie wóz odjechał z Przystani (rozkład: w drodze), Wojciech ukryty", gone.where === null && gone.shown === false && gone.here === null, gone);
    await t.setHour(9.8);
    await t.frames(25);
    const ok = await t.eval("Woz.go('lesna')");
    const back2 = await t.until(t.onMap(21), 20);
    await t.frames(30);
    const l = await t.json("({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, gold: $gameParty.gold(), hour: Tawerna.time.hour(), where: Woz.where() })");
    t.check("9:50 z Przystani na Leśną drogę (4 mapy): 10 G, 2 godz., przyjazd ok. 11:50 przy postoju (4,20)", ok && back2 && l.map === 21 && Math.abs(l.x - 4) <= 3 && Math.abs(l.y - 20) <= 3 && l.gold === after.gold - 10 && Math.abs(l.hour - 11.8) < 0.05 && l.where === "lesna", l);
    await shot("postoj_lesna");
    t.check("zapis i wczytanie po jeździe", (await t.saveTo(1)) && (await t.loadFrom(1)) && (await t.eval("$gameMap.mapId()")) === 21 && (await t.eval("Woz.state().rides")) === 2);
});
