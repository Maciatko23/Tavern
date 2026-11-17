// Utrata działki i dom na sprzedaż w NOWYM świecie (Story.js + Homes.js, 2026-11-16; bez spalonej zagrody - gracz: „pominąć”).
// Działka = ogrodzona działka dziadka na Podgrodziu (Map218: płot x 20..41, y 9..25), chata na sprzedaż = „Chata pod lasem” na łące
// Słonego Brzegu (Map219, drzwi (66,32), izba Map154). Stary bliźniak (stare mapy): field_loss_test.
//   A. świt dnia 61 z dala od działki: gra trwa, działka przepadła, 3 dni na wyniesienie
//   B. pierwsze wejście na działkę: scena mierzenia (kamerdyner, strażnicy), znak Lorda przy furtce
//   C. dni wynoszenia: na działce nic nowego nie stanie
//   D. świt dnia 64 na działce: strażnik wyprowadza przed furtkę (27,26); strażnicy w trzech furtkach - nie da się wejść (chodzenie)
//   E. sołtys sprzedaje Chatę pod lasem (bez spalonej zagrody w jego słowach); drzwi na Słonym Brzegu, izba, wyjście, własna ziemia
// Zdjęcia: docs/strata_pola/nowy_*.png
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "strata_pola");

const LOG = `(function(){ if (window.__fl) return 0; const L = window.__fl = { log: [] };
    const _s = Window_Message.prototype.startMessage;
    Window_Message.prototype.startMessage = function() { _s.call(this); L.log.push($gameMessage.allText().replace(/ /g, " ")); };
    return 0; })()`;

kit.test({ bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const J = e => t.json(e);
    const through = async secs => {
        const t0 = Date.now();
        while (Date.now() - t0 < secs * 1000) {
            const busy = await t.eval("$gameMap.isEventRunning() || $gameMessage.isBusy() || $gamePlayer.isTransferring() || !(SceneManager._scene instanceof Scene_Map) || SceneManager.isSceneChanging()");
            if (!busy) { await t.frames(10); if (!(await t.eval("$gameMap.isEventRunning() || $gameMessage.isBusy()"))) return true; }
            if (await t.eval("$gameMessage.isBusy() && !$gameMessage.isChoice()")) await t.press("ok");
            await t.frames(8);
        }
        return false;
    };
    const logFrom = async n => (await J("window.__fl.log")).slice(n).join(" / ").replace(/\s+/g, " ");
    const shown = id => `(function(){ const e = $gameMap.mapId() === 218 ? $gameMap.event(${id}) : null; return !!e && !!e.page() && !!e.characterName() && !e.isTransparent(); })()`;
    // the hero really walks: a key held, where he got to
    const walk = async (x, y, dir, key, frames) => {
        await t.locate(x, y, dir); await t.frames(10);
        await t.eval(`Input._currentState[${JSON.stringify(key)}] = true; 0`); await t.frames(frames);
        await t.eval(`Input._currentState[${JSON.stringify(key)}] = false; 0`); await t.frames(10);
        return J("[$gamePlayer._realX, $gamePlayer._realY]");
    };

    t.check("nowa gra z fabułą (nowy świat)", await t.newGame({ story: true, skipIntro: true, quiet: true, minimap: false }));
    await t.eval(LOG);
    const world = await J("({ w: Story.world(), field: Story.MAP.field, land: Homes.land().field, chata: Homes.HOUSES.chata.land, sale: Homes.forSale() })");
    t.check("świat „nowy”: działka = Map218, chata na sprzedaż na Map219, u sołtysa tylko chata", world.w === "nowy" && world.field === 218 && world.land === 218 && world.chata === 219 && world.sale.join() === "chata", world);

    // ================= A
    await t.go(220, 44, 42, 2);
    await t.notices({ clear: true });
    await t.setDay(61, 5.8);
    await t.frames(40);
    await t.setHour(6.2);
    const lostOk = await t.until("!!Story.state().lost", 15);
    await t.frames(30);
    await through(20);
    const A = await J("({ scene: SceneManager._scene.constructor.name, lost: Story.state().lost, fieldLost: Story.fieldLost(), locked: Story.fieldLocked(), carry: Story.carryLeft(), notes: Journal.data().notes.map(n => n.title) })");
    t.check("A świt dnia 61 z dala od działki: gra trwa, działka przepadła (3 dni na wyniesienie), notatka w dzienniku",
        lostOk && A.scene === "Scene_Map" && A.fieldLost && !A.locked && A.carry === 3 && A.notes.includes("Działka przepadła"), A);

    // ================= B
    await t.go(218, 44, 42, 4);
    await t.frames(40);
    t.check("B0 na Podgrodziu poza płotem scena NIE rusza (działka to tylko to, co w płocie)", !(await t.eval("$gameMap.isEventRunning()")) && !(await J("Story.state().lost.scene")));
    await t.locate(30, 17, 8);
    const sceneOn = await t.until("$gameMap.isEventRunning()", 10);
    const n0 = (await J("window.__fl.log")).length;
    let shot = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 90000) {
        if (!shot && await t.eval("$gameSelfSwitches.value([218, 703, 'A']) && $gameMessage.isBusy()")) { shot = true; await t.frames(10); await t.shot(path.join(SHOTS, "nowy_scena_mierzenia.png")); }
        const busy = await t.eval("$gameMap.isEventRunning() || $gameMessage.isBusy()");
        if (!busy) { await t.frames(10); if (!(await t.eval("$gameMap.isEventRunning() || $gameMessage.isBusy()"))) break; }
        if (await t.eval("$gameMessage.isBusy() && !$gameMessage.isChoice()")) await t.press("ok");
        await t.frames(8);
    }
    const sceneText = await logFrom(n0);
    const B = await J(`({ scene: Story.state().lost.scene, sign: $gameSelfSwitches.value([218, 703, 'A']), b: ${shown(700)}, m: ${shown(701)}, w: ${shown(702)},
        wx: $gameMap.event(702).x, wy: $gameMap.event(702).y, sx: $gameMap.event(703).x, sy: $gameMap.event(703).y, signShown: ${shown(703)} })`);
    t.check("B1 w płocie działki scena rusza sama: kamerdyner i strażnicy, mierzenie, znak Lorda staje przy furtce",
        sceneOn && B.scene === 61 && B.sign && B.signShown && B.sy >= 21 && B.sx >= 25 && B.sx <= 34, B);
    t.check("B2 słowa kamerdynera: termin minął, 3 dni na wyniesienie, odkup", /Termin minął o świcie/.test(sceneText) && /Znak stoi\. Własność Lorda Zaleskiego/.test(sceneText), sceneText.slice(0, 500));
    t.check("B3 kamerdyner i mierniczy odchodzą, strażnik zostaje przy znaku", !B.b && !B.m && B.w && Math.abs(B.wx - B.sx) + Math.abs(B.wy - B.sy) <= 2, B);
    await t.locate(B.sx - 2, B.sy - 1, 6);
    await t.frames(20);
    await t.shot(path.join(SHOTS, "nowy_znak_na_dzialce.png"));

    // ================= C
    const C = await J("({ allows: Farming.mapAllowsBuilding(), why: Farming.whyNotBuild('chest_s', 30, 15) })");
    t.check("C na działce Lorda nic nowego nie stanie: „Działka należy teraz do Lorda”", C.why === "Działka należy teraz do Lorda.", C);
    const watch = await t.talkTo(702, []);
    t.check("C2 strażnik przy znaku: „Masz jeszcze 3 dni”", watch.done && /Masz jeszcze 3 dni/.test(watch.text), watch.text);

    // ================= D
    await t.locate(30, 13, 6);
    const n1 = (await J("window.__fl.log")).length;
    await t.popups({ clear: true });
    await t.setDay(64, 6.1);
    const escort = await t.until("$gameMap.isEventRunning()", 10);
    await through(40);
    await t.frames(40);
    const D = await J(`({ map: $gameMap.mapId(), x: $gamePlayer.x, y: $gamePlayer.y, locked: Story.state().lost.locked, g1: ${shown(704)}, g2: ${shown(705)}, g3: ${shown(713)},
        at: [704, 705, 713].map(id => { const e = $gameMap.event(id); return e ? [e.x, e.y] : null; }), held: Farming.landHeld(218) })`);
    const escText = await logFrom(n1), pop1 = await t.popups({ clear: true });
    t.check("D1 świt dnia 64 na działce: strażnik wyprowadza („Minęły 3 dni”) przed furtkę (27,26), napis nad bohaterem",
        escort && D.map === 218 && D.x === 27 && D.y === 26 && D.locked === 64 && /Minęły 3 dni/.test(escText) && pop1.includes("Działka należy teraz do Lorda."), { D, escText, pop1 });
    t.check("D2 strażnicy Lorda w trzech furtkach: południowa (29,25) i (30,25), od podwórka chatki (20,22); ziemia zajęta",
        D.g1 && D.g2 && D.g3 && JSON.stringify(D.at) === "[[29,25],[30,25],[20,22]]" && D.held, D);
    await t.locate(27, 27, 8); await t.frames(20);
    await t.shot(path.join(SHOTS, "nowy_straz_w_furtce.png"));
    const up1 = await walk(29, 27, 8, "up", 90), up2 = await walk(30, 27, 8, "up", 90), right = await walk(17, 22, 6, "right", 120);
    t.check("D3 nie da się wejść: od południa bohater staje przed strażnikami, od podwórka chatki też", up1[1] > 25.2 && up2[1] > 25.2 && right[0] < 19.8, { up1, up2, right });
    const guard = await t.talkTo(704, []);
    t.check("D4 strażnik w furtce: „Działka należy teraz do jaśnie pana Zaleskiego”", /jaśnie pana Zaleskiego/.test(guard.text), guard.text);
    const yard = await walk(14, 25, 8, "up", 60);
    t.check("D5 podwórko chatki dziadka zostaje otwarte (to nie działka)", yard[1] < 24.5, yard);

    // ================= E
    await t.setDay(64, 10);
    await t.go(219, 66, 34, 8);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "nowy_chata_pod_lasem.png"));
    await t.popups({ clear: true });
    const doorId = await J("($gameMap.events().find(e => e.event() && /Chata pod lasem/.test(e.event().name)) || { eventId: () => 0 }).eventId()");
    await t.locate(66, 33, 8);
    await t.eval(`$gameMap.event(${doorId}).start(); 0`); await t.frames(30);
    const pops = await t.popups({ clear: true });
    const E0 = await J("({ map: $gameMap.mapId(), why: Farming.whyNotBuild('chest_s', 62, 35), region: $gameMap.regionId(62, 35) })");
    t.check("E1 Chata pod lasem na Słonym Brzegu: drzwi „Na sprzedaż: 600 G”, cudza ziemia („To nie twoja ziemia”)",
        doorId > 0 && E0.map === 219 && pops.some(p => /Na sprzedaż: 600 G/.test(p)) && E0.region === 8 && E0.why === "To nie twoja ziemia.", { doorId, pops, E0 });
    await t.go(220, 44, 42, 8);
    await t.frames(30);
    await t.eval(kit.DRIVER + "; 0");
    await t.gold(700);
    await t.until("!!TownLife.eventOf('soltys') && !TownLife.eventOf('soltys')._town.hidden", 15);
    await t.eval("__standBy(TownLife.eventOf('soltys').eventId()); 0");
    const BUY = "Kup chatę pod lasem na Słonym Brzegu (600 G)";
    const sol = await t.talkTo("TownLife.eventOf('soltys')", ["Nie teraz.", "Domy na sprzedaż", BUY, "Do widzenia"], { place: false, secs: 40 });
    const E1 = await J("({ owns: Homes.owns('chata'), gold: $gameParty.gold() })");
    t.check("E2 sołtys: chata pod lasem na Słonym Brzegu (bez słowa o spalonej zagrodzie), kupno za 600 G",
        E1.owns && E1.gold === 100 && /Słonym Brzegu/.test(sol.text) && !/zagroda Ługów/.test(sol.text), { E1, text: sol.text.slice(0, 400), choices: sol.choices });
    await t.go(219, 66, 33, 8);
    await t.eval(`$gameMap.event(${doorId}).start(); 0`);
    const inn = await t.until(t.onMap(154), 15);
    await t.frames(30);
    await t.shot(path.join(SHOTS, "nowy_izba_chaty.png"));
    const room = await J("({ beds: (Farming.farm().buildings[154] || []).map(b => b.type) })");
    await t.eval("$gameMap.events().find(e => e.event() && /^Drzwi ->/.test(e.event().name)).start(); 0");
    const out = await t.until(t.onMap(219), 15);
    await t.frames(30);
    const E2 = await J("({ at: [$gamePlayer.x, $gamePlayer.y], why: Farming.whyNotBuild('chest_s', 62, 35), outside: Farming.whyNotBuild('chest_s', 45, 30) })");
    t.check("E3 własna chata: drzwi wpuszczają do izby (łóżko i skrzynia), wyjście przed drzwi (66,33)", inn && out && room.beds.includes("bed") && E2.at.join() === "66,33", { room, E2 });
    t.check("E4 własna ziemia wokół chaty: budować wolno, poza nią nie", !E2.why && !!E2.outside, E2);
});
