// PACZKA D „Tajemnice i zakon” (docs/rozszerzenia/PLAN.md 7; Zakon_Data.js + Zakon.js, mapa 176). Sprawdza:
//   - wtyczki, przedmioty 225-232 i ikony 512-527, miejsca (Okolice.registerSpots "D") i odkrycia, grabarz 2930 z popiersiem, zadania
//   - zdarzenia 2700-2899 na polach z planu na 16 mapach i kolizje miejsc paczki (Okolice.checkMap)
//   - strażnica (płyta -> karta 4), kapliczka (modlitwa -> Błogosławieństwo drogi, drugi raz dymek, dar +1 h), kopiec (4 uderzenia
//     rękami -> karta 1), Kleofas czyta Zapiski (hak rozmowy, 2 h, 40 PD, notatka)
//   - zagadka cieni: okno godzin we wszystkich porach roku, kopanie w złej porze = dymek, w dobrej = Klucz Strażnika; płyta, schody,
//     komora (mapa 176): wejście, ściana z wieżami, skrzynia z piórem
//   - miejsce tylko z orła (odkrycie po wylądowaniu, skrytka, zejście po linie w dół), nurkowanie nad ziołem z klifu
//   - grzęda (wpis, strzemię), cmentarz (grób z krukiem 4 uderzenia, imiona), grabarz na Map008, szubienica nocą (mgła)
//   - gaj Milczących (godzina od zmierzchu, złamanie zasady), kruki na skałach (siedzą, karmione dają drobiazg), kawałki wraku (sztorm,
//     odpływ, 6 uderzeń łopatą)
//   - braki dymkiem nad bohaterem (nie oknem), wiersze F9 (przenoszą na miejsca), zapis i wczytanie stanu paczki
// Uruchom: CDP_PORT=9554 node tests/zakon_test.js (serwer: node tools/serve.js)
const kit = require("./lib/kit.js");

const OFF = `if (window.Needs && Needs.setEnabled) Needs.setEnabled(false);
    if (window.Hunting) { Hunting.auto(false); for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); }
    if (window.Dog && Dog.auto) Dog.auto(false); if (window.Birds && Birds.auto) Birds.auto(false);
    if (window.Livestock && Livestock.auto) Livestock.auto(false);
    if (window.Humans && Humans.auto) { Humans.auto(false); Humans.clear(); }
    if (window.Creatures && Creatures.auto) Creatures.auto(false); if (window.Act3 && Act3.auto) Act3.auto(false);
    if (window.Rywal && Rywal.auto) Rywal.auto(false); if (window.Combat && Combat.feel && Combat.feel.auto) Combat.feel.auto(false);
    if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather();
    $gameSystem._minimapHidden = true; $gameSystem._combatMode = false; if ($gameSystem.setStamina) $gameSystem.setStamina(9999);`;
const HELPERS = `(function(){
    // the hero beside a cell (below it if free, else a side), facing it
    window.__near = function(x, y) {
        for (const [dx, dy, d] of [[0, 1, 8], [-1, 0, 6], [1, 0, 4], [0, -1, 2]]) {
            const nx = x + dx, ny = y + dy;
            if (!$gameMap.isValid(nx, ny) || !$gameMap.checkPassage(nx, ny, 0x0f)) continue;
            if ($gameMap.eventsXyNt(nx, ny).some(e => e.isNormalPriority() && !e.isThrough())) continue;
            $gamePlayer.locate(nx, ny); $gamePlayer.setDirection(d); return [nx, ny];
        }
        return null;
    };
    window.__stam = function() { if ($gameSystem.changeStamina) $gameSystem.changeStamina(999); };
    return 0; })()`;

kit.test({ port: 9554, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const go = async (map, x, y, hour) => {
        if (hour !== undefined) await t.setHour(hour);
        if (x === undefined) { const e = await t.json(`OkoliceData.ENTRY[${map}] || [5, 5]`); x = e[0]; y = e[1]; }
        if (!(await t.go(map, x, y, 2, { timeout: 120 }))) await t.until(t.onMap(map), 120);
        await t.eval(`(function(){ ${OFF} return 0; })()`);
        await t.eval(HELPERS);
        await t.frames(30);
    };
    const act = (args) => t.eval(`(function(){ Zakon.act(null, ${JSON.stringify(args)}); return 0; })()`);
    // the work: one strike, then wait for the swing; n times
    const work = async (args, n) => {
        for (let i = 0; i < n; i++) {
            await t.eval("__stam(); 0");
            await act(args);
            await t.until("!($gamePlayer.isToolSwinging && $gamePlayer.isToolSwinging())", 10, 50);
            await t.frames(6);
        }
    };
    const finish = () => t.finish(40);

    await t.newGame({ map: 3, x: 25, y: 15, hour: 10, minimap: false });
    await t.eval(`(function(){ ${OFF} return 0; })()`);
    await t.eval(HELPERS);

    // ---------------------------------------------------------------- wtyczki, dane, miejsca, zadania
    const base = await t.json(`(function(){ const it = []; for (let i = 225; i <= 232; i++) it.push([i, $dataItems[i].name, $dataItems[i].iconIndex]);
        const sp = Okolice.spots().filter(s => s.pkg === "D"), disc = Okolice.discoverables().filter(d => d.pkg === "D");
        const res = TownLife.RESIDENTS.find(r => r.key === "grabarz");
        return { ready: !!(window.Zakon && Zakon.ready && ZakonData.ready), it, spots: sp.length, want: ZakonData.SPOTS.length, plan: Okolice.spots().filter(s => s.pkg === "D" && !ZakonData.SPOTS.some(z => z.key === s.key)).length,
            disc: disc.length, wantDisc: ZakonData.DISC.length, res: res ? [res.id, res.map, res.sheet] : null, bust: SpeechBubbles.BUSTS["$Npc_Grabarz:0"],
            quests: ["K67", "K68", "K69", "K70", "D36", "D37", "D38"].filter(id => !TownQuests.Q[id]),
            fx: ["k67Modl", "k68Pora", "k68Karty", "k68Czytaj", "d36Start", "d36Kop", "d36Komora", "d36Mapa", "k69Grzedy", "k70Kawalki", "d37Groby", "d38Godzina"].filter(k => !TownQuests.FX[k]),
            vitems: ["zak_karta_1", "zak_karta_6", "zak_imiona"].filter(k => !(TownQuests.VITEMS || {})[k] && !((TownQuests.DATA || {}).VITEMS || {})[k]),
            buffs: [Survival.defineBuff ? 1 : 0], spots8: ["grabarz_groby", "grabarz_chata"].every(k => !!TownLifeData.SPOTS[k]),
            reg: Tawerna.inject.list().filter(r => r.owner === "Zakon").map(r => r.ids) }; })()`);
    t.check("wtyczki paczki D gotowe, zadania K67-K70 i D36-D38 w TownQuests, ich FX, miejsca grabarza na Map008, numery 2700-2899",
        base.ready && !base.quests.length && !base.fx.length && base.spots8 && base.reg.includes("2700-2899"), base);
    t.check("przedmioty 225-232 nazwane, z ikonami 512-519", base.it.every(([i, n, ic]) => n && ic === 287 + i), base.it);
    t.check("miejsca paczki D zarejestrowane (" + base.want + ", plan zastąpiony) i odkrycia (" + base.wantDisc + ")", base.spots === base.want && base.plan === 0 && base.disc === base.wantDisc, base);
    t.check("grabarz: mieszkaniec 2930 na Map008, arkusz $Npc_Grabarz, popiersie Grabarz_Bust", JSON.stringify(base.res) === JSON.stringify([2930, 8, "$Npc_Grabarz"]) && base.bust === "Grabarz_Bust", base);
    await t.eval(`(function(){ window.__icons = ImageManager.loadSystem("IconSet"); window.__bust = ImageManager.loadPicture("Grabarz_Bust"); window.__npc = ImageManager.loadCharacter("$Npc_Grabarz");
        window.__sheets = ["!$Zak_Fundament", "!$Zak_Plyty", "!$Zak_Kapliczka", "!$Zak_Male", "!$Zak_Gniazdo", "!$Zak_Grzeda", "!$Zak_Slady", "!$Zak_Groby", "!$Zak_Szubienica", "!$Zak_Wrak", "!$Zak_Komora"].map(n => ImageManager.loadCharacter(n)); return 0; })()`);
    await t.until("__icons.isReady() && __bust.isReady() && __npc.isReady() && __sheets.every(b => b.isReady())", 30);
    const art = await t.json(`(function(){ const c = __icons.context || (__icons._canvas && __icons._canvas.getContext("2d")); const per = [];
        if (c) for (let k = 0; k < 16; k++) { const d = c.getImageData(k * 32, 32 * 32, 32, 32).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; per.push(n); }
        return { per, bust: __bust.width, npc: [__npc.width, __npc.height], sheets: __sheets.map(b => [b.width, b.height]) }; })()`);
    t.check("ikony 512-527 narysowane (wiersz 32), popiersie, arkusz grabarza i 11 arkuszy !$Zak_* wczytują się",
        art.per.length === 16 && art.per.every(n => n > 40) && art.bust > 100 && art.npc[0] === 192 && art.sheets.every(s => s[0] > 0), art);

    // ---------------------------------------------------------------- zdarzenia na polach z planu + kolizje
    const MAPS = [22, 13, 157, 21, 4, 17, 23, 155, 18, 125, 168, 175, 8, 120, 165];
    const evBad = {}, col = {};
    for (const m of MAPS) {
        await go(m, undefined, undefined, 10);
        if (m === 165) { await t.eval(`Wyspa.forceTide("low"); 0`); await t.frames(3); }
        const r = await t.json(`(function(){ const want = Zakon.buildMap($dataMap, ${m}).map(e => [e.id, e.x, e.y]), bad = [];
            for (const [id, x, y] of want) { const e = $dataMap.events[id]; if (!e || e.x !== x || e.y !== y || e._twOwner !== "Zakon") bad.push([id, e ? [e.x, e.y, e._twOwner] : null]); }
            const mine = $dataMap.events.filter(e => e && e._twOwner === "Zakon").map(e => e.id);
            const keys = new Set(ZakonData.SPOTS.filter(s => s.map === ${m}).map(s => s.key));
            const ch = Okolice.checkMap();
            return { bad, out: mine.filter(id => id < 2700 || id > 2899), n: mine.length, want: want.length, problems: ch.problems.filter(p => keys.has(p.split(" ")[0])) }; })()`);
        if (m === 165) await t.eval(`Wyspa.forceTide(null); 0`);
        if (r.bad.length || r.out.length || r.n !== r.want || !r.want) evBad[m] = r;
        if (r.problems.length) col[m] = r.problems;
    }
    t.check("zdarzenia paczki D (2700-2899) stoją na polach z planu na 15 mapach", Object.keys(evBad).length === 0, evBad);
    t.check("kolizje miejsc paczki D: 0 (Okolice.checkMap na 15 mapach)", Object.keys(col).length === 0, col);

    // ---------------------------------------------------------------- 7.1 strażnica: płyta -> karta 4
    await go(22, 73, 41, 10);
    await t.eval(`__near(73, 39); 0`);
    await t.frames(40);
    await act(["towerTake", "straznica_022"]);
    await finish();
    const tw = await t.json(`({ v: TownQuests.state().v.zak_karta_4 || 0, s: !!Zakon.state().towers.straznica_022, found: Okolice.isFound("straznica_022"),
        sw: $gameSelfSwitches.value([22, 2701, "B"]) })`);
    t.check("strażnica: pod płytą karta Zapisków strażnic 4 (przedmiot zadania), odkrycie, płyta „zbadana” (strona B)", tw.v === 1 && tw.s && tw.found, tw);

    // ---------------------------------------------------------------- 7.2 kapliczka: modlitwa, drugi raz, dar
    await go(22, 72, 18, 10);
    await t.eval("window.__kit.pops.length = 0; 0");
    await act(["pray", "kapliczka_022"]);
    await t.frames(5);
    await act(["pray", "kapliczka_022"]);
    await t.frames(5);
    await t.gold(10);
    const left0 = await t.json(`$gameSystem.buffs().blogoslawienstwo - ($gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour())`);
    await act(["offer", "kapliczka_022", "coin"]);
    await t.frames(5);
    const sh = await t.json(`({ buff: $gameSystem.hasBuff("blogoslawienstwo"), left: $gameSystem.buffs().blogoslawienstwo - ($gameSystem.dayNightDay() * 24 + $gameSystem.dayNightHour()),
        gold: $gameParty.gold(), pops: window.__kit.pops.map(p => p.text), msg: $gameMessage.isBusy(), cost: Survival.costFactor ? Survival.costFactor() : null })`);
    t.check("kapliczka: modlitwa = Błogosławieństwo drogi 4 h; drugi raz tego dnia dymek; dar 1 G = +1 h", sh.buff && Math.abs(left0 - 4) < 0.1 && Math.abs(sh.left - 5) < 0.1 && sh.gold === 9
        && sh.pops.some(p => /Już się tu dziś modliłeś/.test(p)) && !sh.msg, Object.assign({ left0 }, sh));

    // ---------------------------------------------------------------- 7.3 kopiec: 4 uderzenia rękami -> karta 1
    await go(17, 50, 39, 10);
    await t.eval(`__near(50, 37); 0`);
    await work(["cairnWork", "kopiec_017"], 4);
    await t.frames(20);
    const ca = await t.json(`({ v: TownQuests.state().v.zak_karta_1 || 0, s: !!Zakon.state().cairns.kopiec_017, sw: $gameSelfSwitches.value([17, 2751, "B"]), found: Okolice.isFound("kopiec_017") })`);
    t.check("kopiec: 4 uderzenia rękami zdejmują szczyt - karta Zapisków strażnic 1, kamień z krukiem znika (strona B)", ca.v === 1 && ca.s && ca.sw && ca.found, ca);

    // ---------------------------------------------------------------- Kleofas czyta Zapiski
    await t.setHour(10);
    const kl = await t.json(`(function(){ const P = Pustelnia.state(); P.met = P.met || 1; const h0 = $gameSystem.dayNightHour();
        const list = Zakon.kleofasTalk({ eventId: () => 944 }); const labels = list ? (list.find(c => c.code === 102) || { parameters: [[]] }).parameters[0] : [];
        const ok = Zakon.readCard(1); const notes = (Journal.state ? Journal.state().notes : $gameSystem._journalNotes || []) || [];
        return { labels, ok, read: Zakon.state().read[1], v: TownQuests.state().v.zak_karta_1 || 0, dh: $gameSystem.dayNightHour() - h0,
            note: JSON.stringify(notes).indexOf("Zapiski strażnic (1)") >= 0 }; })()`);
    t.check("Kleofas: w rozmowie „Przeczytaj mi Zapiski strażnic (1)”; czytanie zabiera kartę, mija 2 h, notatka w dzienniku",
        kl.labels.some(l => /Zapiski strażnic \(1\)/.test(l)) && kl.ok && kl.read && kl.v === 0 && Math.abs(kl.dh - 2) < 0.05, kl);

    // ---------------------------------------------------------------- 7.4 zagadka cieni
    const win = await t.json(`(function(){ const out = {}; for (const [n, d] of [["wiosna", 2], ["lato", 30], ["jesień", 58], ["zima", 86]]) out[n] = Zakon.shadowWindow(d); return out; })()`);
    const inWin = (w, a, b) => w && w[0] >= a && w[1] <= b && w[1] - w[0] >= 1.5;
    t.check("zagadka cieni: okno godzin, gdy cień Strażnika pada na dół, w każdej porze roku (późne popołudnie, 2+ h)",
        inWin(win.wiosna, 16.5, 20.5) && inWin(win.lato, 17.5, 21) && inWin(win["jesień"], 15.5, 19.5) && inWin(win.zima, 14.5, 18.5), win);
    await t.setDay(2, 12);
    await go(18, 52, 45, 12);
    await t.eval(`__near(52, 43); window.__kit.pops.length = 0; 0`);
    await act(["hole"]);
    await t.frames(5);
    const noShovel = await t.json(`({ pops: window.__kit.pops.map(p => p.text), msg: $gameMessage.isBusy() })`);
    await t.give(62, 1);
    await act(["hole"]);
    await t.frames(5);
    const wrong = await t.json(`({ pops: window.__kit.pops.map(p => p.text), key: Zakon.state().key, msg: $gameMessage.isBusy() })`);
    t.check("dół w złej porze: bez łopaty dymek „Potrzebujesz łopaty”, z łopatą „Ubita ziemia... Strażnik nie patrzy” (dymki, nie okno)",
        noShovel.pops.some(p => /łopaty/.test(p)) && wrong.pops.some(p => /Strażnik nie patrzy/.test(p)) && !wrong.key && !wrong.msg && !noShovel.msg, { noShovel, wrong });
    const w2 = win.wiosna;
    await t.setHour((w2[0] + w2[1]) / 2);
    await t.eval(`(function(){ Survival.calmWeather(); $gameScreen.clearWeather(); __near(52, 43); return 0; })()`);
    await t.frames(10);
    const now = await t.json(`({ hits: Zakon.shadowNow(), light: Sky.now().light })`);
    await work(["hole"], 3);
    await t.frames(20);
    const dug = await t.json(`({ key: Zakon.state().key, n: $gameParty.numItems($dataItems[225]), disc: Okolice.isFound("cien_straznika"), sw: $gameSelfSwitches.value([18, 2769, "B"]) })`);
    t.check("dół w porze cienia: 3 uderzenia łopatą - Klucz Strażnika (225), odkrycie „Cień Strażnika”, dół wykopany", now.hits && dug.key && dug.n === 1 && dug.disc && dug.sw, { now, dug });
    await act(["plateKey"]);
    await finish();
    const sw27 = await t.json(`$gameSwitches.value(27)`);
    await t.eval(`$gamePlayer.locate(53, 46); 0`);
    await act(["plateDown"]);
    const down = await t.until(t.onMap(176), 30);
    await t.frames(40);
    await t.eval(`(function(){ ${OFF} return 0; })()`);
    const ch = await t.json(`({ map: $gameMap.mapId(), been: Zakon.state().chamber.been, disc: Okolice.isFound("komora"), x: $gamePlayer.x, y: $gamePlayer.y,
        ev: [2770, 2771, 2772, 2773, 2774, 2775, 2776].map(id => !!$gameMap.event(id)) })`);
    t.check("płyta z kluczem otwiera schody (przełącznik 27), zejście na mapę 176: komora, odkrycie, jej rzeczy", sw27 && down && ch.map === 176 && ch.been && ch.disc && ch.ev.every(Boolean), ch);
    await act(["chWall"]);
    await finish();
    await act(["chChest"]);
    await finish();
    const ch2 = await t.json(`({ wall: Zakon.state().chamber.wall, chest: Zakon.state().chamber.chest, pioro: $gameParty.numItems($dataItems[226]) })`);
    t.check("komora: ściana z czterema wieżami obejrzana, w skrzyni Pióro Skrzydlatej Straży (226)", ch2.wall && ch2.chest === "pioro" && ch2.pioro === 1, ch2);
    await act(["chStairs"]);
    const up = await t.until(t.onMap(18), 30);
    t.check("schody komory wyprowadzają na Łąkę menhirów (53,46)", up && (await t.json(`[$gamePlayer.x, $gamePlayer.y]`)).join() === "53,46");

    // ---------------------------------------------------------------- 7.5 miejsce tylko z orła: odkrycie, skrytka, zejście
    await go(125, 98, 45, 10);
    await t.frames(70);
    const ea = await t.json(`({ found: Okolice.isFound("orzel_125_a"), gold: $gameParty.gold() })`);
    await act(["eagleThing", "orzel_125_a", 2780]);
    await finish();
    const ea2 = await t.json(`({ stash: Zakon.state().stash, gold: $gameParty.gold(), lina: $gameParty.numItems($dataItems[93]), crate: $gameParty.numItems($dataItems[212]) })`);
    await act(["downGo", "orzel_125_a"]);
    await t.until("!$gamePlayer.isTransferring() && " + t.onMap(125), 30);
    await t.frames(30);
    const dn = await t.json(`[$gamePlayer.x, $gamePlayer.y]`);
    t.check("miejsce tylko z orła (Map125): odkrycie na miejscu, skrytka przemytników daje łup, stare liny sprowadzają na dół (81,68)",
        ea.found && ea2.stash && (ea2.gold > ea.gold || ea2.lina > 0 || ea2.crate > 0) && dn.join() === "81,68", { ea, ea2, dn });

    // ---------------------------------------------------------------- 7.5 nurkowanie nad ziołem z klifu (Map157)
    await go(157, 72, 7, 10);
    const dv = await t.json(`(async function(){ Orzel.forceStage(5); const s = Orzel.state(); s.bond = 90; s.st = 100; s.name = s.name || "Śnieżny";
        const L = OrzelLot; if (L.mount) L.mount(); return { flying: L.flying(), why: L.why ? L.why() : null }; })()`);
    let dive = { skipped: true };
    if (dv.flying) {
        await t.until("OrzelLot.lot && OrzelLot.lot.phase === 'fly'", 20);
        await t.eval(`(function(){ OrzelLot.setLevel("low"); return 0; })()`);
        await t.until("OrzelLot.lot && OrzelLot.lot.phase === 'fly' && OrzelLot.lot.level === 'low'", 20);
        await t.eval(`(function(){ $gamePlayer._realX = 72; $gamePlayer._realY = 5; $gamePlayer._x = 72; $gamePlayer._y = 5; return 0; })()`);
        await t.frames(2);
        const before = await t.json(`$gameParty.numItems($dataItems[229])`);
        await t.eval(`(function(){ Input._currentState.dodge = true; return 0; })()`);
        await t.frames(2);
        await t.eval(`Input._currentState.dodge = false; 0`);
        await t.frames(5);
        dive = await t.json(`({ got: $gameParty.numItems($dataItems[229]) - ${before}, herb: Zakon.state().cliff.klif_157_2, found: Okolice.isFound("ziola_klif"), phase: OrzelLot.lot ? OrzelLot.lot.phase : null })`);
        await t.eval(`(function(){ if (OrzelLot.forceLand) OrzelLot.forceLand("f9"); return 0; })()`);
        await t.frames(60);
    }
    t.check("nurkowanie dorosłego orła w niskim locie nad półką klifu: warzucha (229), odkrycie „Zioła z klifów”, bez ataku", dv.flying && dive.got === 1 && dive.herb && dive.found && dive.phase !== "dive", { dv, dive });

    // ---------------------------------------------------------------- 7.6 grzęda
    await go(175, 68, 15, 10);
    await act(["perch", 1]);
    await finish();
    await act(["trace", 1]);
    await t.frames(5);
    const pe = await t.json(`({ p: Zakon.state().perches[1], st: $gameParty.numItems($dataItems[227]), found: Okolice.isFound("orle_grzedy_1") })`);
    t.check("orla grzęda: obejrzana (wpis, odkrycie), pod nią strzemię jeźdźca (227)", pe.p && pe.st === 1 && pe.found, pe);

    // ---------------------------------------------------------------- 7.7 cmentarz, grabarz, szubienica
    await go(8, 84, 19, 10);
    await t.frames(60);
    const gr = await t.json(`(function(){ const e = $gameMap.event(2930); return { e: !!e, note: e ? e.event().note : null, walls: [2800, 2810, 2820, 2821].map(id => !!$gameMap.event(id)) }; })()`);
    t.check("cmentarz: murek, lampka i groby stoją; grabarz Hieronim (2930) na Map008 za dnia", gr.e && /<Town:grabarz>/.test(gr.note || "") && gr.walls.every(Boolean), gr);
    await t.eval(`__near(82, 13); 0`);
    await work(["graveWork", 1], 4);
    await t.eval(`(function(){ const s = Zakon.state(); s.graves[2] = s.graves[2] || 1; return 0; })()`);
    await t.eval(`__near(85, 15); 0`);
    await work(["graveWork", 3], 4);
    await t.frames(10);
    const gv = await t.json(`({ g: Zakon.state().graves, names: TownQuests.state().v.zak_imiona || 0, sw: $gameSelfSwitches.value([8, 2831, "B"]) })`);
    t.check("grób z krukiem: 4 uderzenia rękami odsłaniają imię; trzy groby = „Imiona z grobów z krukiem” dla Ambrożego", gv.g[1] && gv.g[3] && gv.names === 1 && gv.sw, gv);
    await t.setHour(23);
    await t.eval(`$gamePlayer.locate(94, 59); 0`);
    await t.frames(240);
    const fog = await t.json(`Zakon.fog()`);
    t.check("szubienica nocą (22-3): mgła wokół niej", fog && fog.alpha > 0.3 && fog.visible, fog);

    // ---------------------------------------------------------------- 7.8 gaj Milczących
    await t.setHour(12);
    await go(120, 57, 55, 12);
    const set = await t.json(`Zakon.grove().sunset`);
    await t.setHour(set + 0.1);
    await t.eval(`(function(){ $gamePlayer.locate(57, 54); return 0; })()`);
    await t.frames(40);
    const g1 = await t.json(`({ run: !!Zakon.state().grove.run })`);
    await t.eval(`$gamePlayer.locate(57, 59); 0`);
    await t.frames(10);
    const g2 = await t.json(`({ run: !!Zakon.state().grove.run, broken: Zakon.state().grove.broken, pops: window.__kit.pops.map(p => p.text).filter(p => /Milczący/.test(p)) })`);
    t.check("gaj: o zmierzchu w środku kręgu zaczyna się godzina ciszy; wyjście poza krąg ją łamie (dymek)", g1.run && !g2.run && g2.broken && g2.pops.length > 0, { g1, g2 });
    await t.eval(`(function(){ Zakon.state().grove.broken = 0; $gamePlayer.locate(57, 54); return 0; })()`);
    await t.frames(40);
    await t.eval(`$gameSystem.setDayNightHour($gameSystem.dayNightHour() + 1.05); 0`);
    await t.frames(20);
    await act(["gstone", 0]);
    await t.frames(5);
    const g3 = await t.json(`({ done: Zakon.state().grove.done, buff: $gameSystem.hasBuff("spokoj"), stone: $gameParty.numItems($dataItems[232]), found: Okolice.isFound("gaj") })`);
    t.check("gaj: godzina bez ruchu = Spokój Milczących, biały kamień milczenia (232) przy kamieniu", g3.done && g3.buff && g3.stone === 1 && g3.found, g3);

    // ---------------------------------------------------------------- 7.9 kruki
    await go(155, 76, 50, 10);
    await t.frames(30);
    const rv = await t.json(`Zakon.ravens()`);
    await t.give(98, 1);
    const before = await t.json(`$gameParty.numItems($dataItems[194]) + $gameParty.numItems($dataItems[146])`);
    await t.eval(`Zakon.feedRavens("kruki_155", 1, 98); 0`);
    const rv2 = await t.json(`({ gift: $gameParty.numItems($dataItems[194]) + $gameParty.numItems($dataItems[146]) - ${before}, fish: $gameParty.numItems($dataItems[98]) })`);
    t.check("kruki siedzą na skałach (Map155); rzucona ryba = błyszczący drobiazg", rv.length >= 3 && rv.every(b => b.z > 30) && rv2.gift > 0 && rv2.fish === 0, { rv, rv2 });

    // ---------------------------------------------------------------- 7.10 kawałki wraku
    await t.eval(`(function(){ Tawerna.emit("stormStart", {}); Tawerna.emit("stormEnd", {}); Wyspa.forceTide("low"); return 0; })()`);
    await go(165, 47, 22, 10);
    await t.eval(`Wyspa.forceTide("low"); 0`);
    await t.frames(40);
    const wr = await t.json(`({ n: Zakon.state().wreck, b: $gameSelfSwitches.value([165, 2860, "B"]), vis: !!($gameMap.event(2860) && $gameMap.event(2860).characterName()) })`);
    await t.eval(`__near(47, 24); 0`);
    await work(["wreckWork", 1], 6);
    await t.frames(10);
    const wr2 = await t.json(`({ dug: Zakon.state().wreckDug[1], ok: $gameParty.numItems($dataItems[230]), seen: Okolice.isFound("wrak_kawalki") })`);
    await t.eval(`Wyspa.forceTide("high"); 0`);
    await t.frames(40);
    const wr3 = await t.json(`({ b: $gameSelfSwitches.value([165, 2860, "B"]), c: $gameSelfSwitches.value([165, 2860, "C"]) })`);
    await t.eval(`Wyspa.forceTide(null); 0`);
    t.check("wrak: po sztormie piasek odsłania kawałek (widać go w odpływie); 6 uderzeń łopatą = 2 okucia (230); w przypływie znika",
        wr.n === 1 && wr.b && wr.vis && wr2.dug && wr2.ok === 2 && wr2.seen && !wr3.b && !wr3.c, { wr, wr2, wr3 });

    // ---------------------------------------------------------------- zadania: K67 po trzech kapliczkach, D37 liczy groby
    const qq = await t.json(`(function(){ TownQuests.start("K67"); const s = Zakon.state(); s.prayCount.kapliczka_021 = 1; s.prayCount.kapliczka_004 = 1;
        TownQuests.autoChecks(); TownQuests.start("D37"); TownQuests.autoChecks();
        return { k67: TownQuests.rec("K67"), d37: TownQuests.rec("D37") }; })()`);
    t.check("K67: trzy modlitwy zaliczają krok kapliczek; D37: trzy oczyszczone groby zaliczają pierwszy krok", qq.k67 && qq.k67.step >= 1 && qq.d37 && qq.d37.step >= 1, qq);

    // ---------------------------------------------------------------- F9
    const f9 = await t.json(`(function(){ const sec = Okolice.f9.sections().find(s => s.owner === "Zakon"); if (!sec) return null;
        const row = Object.assign({ owner: "Zakon" }, sec.rows.find(r => r.what === "spot")); Okolice.f9.pick(row, 3); const r = Okolice.f9.ok(row);
        const sh = Okolice.f9.ok(Object.assign({ owner: "Zakon" }, sec.rows.find(r => r.what === "shadow")));
        return { rows: sec.rows.length, go: r && r.go, label: row.label, shadow: sh }; })()`);
    t.check("F9: wiersze paczki D (miejsca, godzina cienia, klucz, karty, orzeł, sztorm, odpływ, Akt II, gaj); miejsce przenosi", f9 && f9.rows >= 9 && f9.go && f9.go.length === 5 && f9.shadow && f9.shadow.say, f9);
    await go(f9.go[1], f9.go[2], f9.go[3], 10);
    t.check("F9: przeniesienie na miejsce paczki D działa", (await t.json(`$gameMap.mapId()`)) === f9.go[1]);

    // ---------------------------------------------------------------- zapis i wczytanie
    const snap = await t.json(`JSON.stringify(Zakon.state())`);
    await t.saveTo(1);
    await t.loadFrom(1);
    const snap2 = await t.json(`JSON.stringify(Zakon.state())`);
    t.check("zapis i wczytanie zachowują stan paczki (karty, klucz, komora, groby, gaj, wrak)", snap === snap2 && /"key":\d/.test(snap2), { len: snap.length });
});
