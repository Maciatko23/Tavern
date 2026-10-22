// PACZKA B „Zwierzęta i łowy” (docs/rozszerzenia/PLAN.md 5; Lowy_Data.js + Lowy.js, blok w Humans.js i Dog.js). Sprawdza:
//   - wtyczki, przedmioty 200-206 i ikony 480-486, miejsca (Okolice.registerSpots) i 9 odkryć, gajowy 2905 z popiersiem
//   - zdarzenia 2300-2499 na polach z planu (Map004, 013, 021, 023, 024, 162) i kolizje miejsc na 7 mapach (Okolice.checkMap)
//   - nora: wataha i szczenięta za dnia; rozbita (szczenięta uciekają, nora pusta 28 dni, K59); mięso 3 dni -> wataha przyjazna (nie
//     atakuje), dar watahy
//   - gawra: niedźwiedź przy gawrze; zima: zajrzyj -> obudzony i wściekły (+20% obrażeń); ubity -> pazur przy oprawianiu
//   - błotnisko: dziki rano, w błocie premia „Ubłocony” (Combat.perk sneak +0.3); obóz rabusiów na stałym miejscu (Humans.fixedCamp)
//   - lizawka: bez soli dymek, sól -> jelenie o świcie (_noDog: pies ich nie bierze - Dog.findPrey), zasiadka (sneak +0.5, celowanie x0.8)
//   - obóz myśliwych Czarnych Oczu (nazwa, strzała 205 w worku), D33: rozmowa przy ognisku, przegnani -> koniec zadania
//   - zwierzyniec: zwierzyna w granicach, gajowy, kłusownictwo (grzywny 40/60/80, bez pieniędzy mięso i skóry, za trzecim razem cierń
//     na wyłomie - przełącznik 23), zezwolenie; D32 (sidła, Rysiek, zezwolenie)
//   - zbłąkane zwierzęta: powróz, kura łapana ręką, odprowadzenie do zagrody Ługów (K62 liczy)
//   - strzelnica: runda 5 prawdziwych strzał z łuku (punkty od środka tarczy), strzały ćwiczebne nie znikają, zawody -> srebrna strzała
//   - braki dymkiem nad bohaterem (nie oknem), wiersze F9 (przenoszą na miejsca), zapis i wczytanie stanu paczki
// Uruchom: CDP_PORT=9552 node tests/lowy_test.js (serwer: node tools/serve.js)
const kit = require("./lib/kit.js");

const OFF = `if (window.Needs && Needs.setEnabled) Needs.setEnabled(false);
    if (window.Hunting) Hunting.auto(false);
    if (window.Dog && Dog.auto) Dog.auto(false); if (window.Birds && Birds.auto) Birds.auto(false);
    if (window.Livestock && Livestock.auto) Livestock.auto(false);
    if (window.Humans && Humans.auto) Humans.auto(false);
    if (window.Creatures && Creatures.auto) Creatures.auto(false); if (window.Act3 && Act3.auto) Act3.auto(false);
    if (window.Rywal && Rywal.auto) Rywal.auto(false); if (window.Combat && Combat.feel && Combat.feel.auto) Combat.feel.auto(false);
    if (window.Survival && Survival.calmWeather) Survival.calmWeather(); $gameScreen.clearWeather();
    $gameSystem._minimapHidden = true; $gameSystem._combatMode = false;`;
// a free cell near (x, y) one reaches on foot from the map's entry (Okolice.walk), between rmin and rmax tiles off
const HELPERS = `(function(){
    window.__spot = function(x, y, rmin, rmax) {
        const e = OkoliceData.ENTRY[$gameMap.mapId()], w = e ? Okolice.walk(e) : null; let best = null, bd = 1e9;
        for (let yy = y - rmax; yy <= y + rmax; yy++) for (let xx = x - rmax; xx <= x + rmax; xx++) {
            const d = Math.hypot(xx - x, yy - y);
            if (d < rmin || d > rmax || !$gameMap.isValid(xx, yy) || !$gameMap.checkPassage(xx, yy, 0x0f)) continue;
            if (w && !w.has(xx + "," + yy)) continue;
            if ($gameMap.eventsXyNt(xx, yy).some(ev => ev.isNormalPriority() && !ev.isThrough())) continue;
            if (d < bd) { bd = d; best = [xx, yy]; }
        }
        return best;
    };
    window.__put = function(x, y, rmin, rmax) { const c = __spot(x, y, rmin, rmax); if (c) $gamePlayer.locate(c[0], c[1]); return c; };
    return 0; })()`;

kit.test({ port: 9552, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const go = async (map, hour) => {
        if (hour !== undefined) await t.setHour(hour);
        const e = await t.json(`OkoliceData.ENTRY[${map}]`), same = (await t.json("$gameMap.mapId()")) === map;
        if (!(await t.go(map, e[0], e[1], 2, { timeout: 120 }))) await t.until(t.onMap(map), 120);
        if (same) await t.eval("Lowy.resetSession(); 0");   // (a transfer within the same map: no mapEnter)
        await t.eval(`(function(){ ${OFF} return 0; })()`);
        await t.eval(HELPERS);
        await t.frames(40);
    };
    const drive = async (picks, secs) => {
        await t.eval(kit.DRIVER + "; 0");
        await t.eval(`(function(){ const T = window.__drv; T.on = true; T.picks = ${JSON.stringify(picks || [])}; T.mark = T.log.length; T.missing = []; return 0; })()`);
        await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", secs || 30);
        const out = await t.json("({ text: window.__drv.log.slice(window.__drv.mark).map(l => l.t).join(' / '), missing: window.__drv.missing })");
        await t.eval("window.__drv.on = false; 0");
        return out;
    };

    await t.newGame({ map: 3, x: 25, y: 15, hour: 10, minimap: false });
    await t.eval(`(function(){ ${OFF} return 0; })()`);
    await t.eval(HELPERS);

    // ---------------------------------------------------------------- wtyczki, dane, miejsca
    const base = await t.json(`(function(){ const it = []; for (let i = 200; i <= 206; i++) it.push([i, $dataItems[i].name, $dataItems[i].iconIndex]);
        const sp = Okolice.spots().filter(s => s.pkg === "B"), disc = Okolice.discoverables().filter(d => d.pkg === "B");
        const res = TownLife.RESIDENTS.find(r => r.key === "gajowy");
        return { ready: !!(window.Lowy && Lowy.ready && LowyData.ready), it, spots: sp.length, want: LowyData.SPOTS.length, disc: disc.map(d => d.key),
            pup: !!Hunting.SPECIES.wolfPup, fixed: [!!Humans.fixedCamp(21), !!Humans.fixedCamp(23)], res: res ? [res.id, res.map, res.sheet] : null,
            bust: SpeechBubbles.BUSTS["$Npc_Gajowy:0"], fx: ["lowK59", "lowK60Sol", "lowK61", "lowK62", "lowD32Sidla", "lowD33Koniec"].every(k => !!TownQuests.FX[k]),
            quests: ["K59", "K60", "K61", "K62", "D32", "D33"].every(id => !!TownQuests.Q[id]), board: QuestBoard.TEMPLATES.some(x => x.id === "low_oboz_021") && !!QuestBoard.BEASTS.bandit }; })()`);
    t.check("wtyczki paczki B gotowe, gatunek „Wilczę”, stałe obozy na Map021 i Map023 (Humans.fixedCamp), FX zadań, wzory tablicy",
        base.ready && base.pup && base.fixed.every(Boolean) && base.fx && base.quests && base.board, base);
    t.check("przedmioty 200-206 nazwane, z ikonami 480-486", base.it.every(([i, n, ic]) => n && ic === 280 + i), base.it);
    t.check("miejsca paczki B zarejestrowane (" + base.want + ") i 9 odkryć", base.spots === base.want && base.disc.length === 9, base);
    t.check("gajowy: mieszkaniec 2905 na Map024, arkusz $Npc_Gajowy, popiersie Gajowy_Bust", JSON.stringify(base.res) === JSON.stringify([2905, 24, "$Npc_Gajowy"]) && base.bust === "Gajowy_Bust", base);
    await t.eval(`(function(){ window.__icons = ImageManager.loadSystem("IconSet"); window.__bust = ImageManager.loadPicture("Gajowy_Bust"); window.__npc = ImageManager.loadCharacter("$Npc_Gajowy"); return 0; })()`);
    await t.until("__icons.isReady() && __bust.isReady() && __npc.isReady()", 20);
    const art = await t.json(`(function(){ const c = __icons.context || (__icons._canvas && __icons._canvas.getContext("2d")); let n = 0;
        if (c) { const d = c.getImageData(0, 30 * 32, 7 * 32, 32).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; }
        return { iconPx: n, bust: __bust.width, npc: [__npc.width, __npc.height] }; })()`);
    t.check("ikony 480-486 narysowane w wierszu 30, popiersie i arkusz gajowego wczytują się", art.iconPx > 500 && art.bust > 100 && art.npc[0] === 192, art);

    // ---------------------------------------------------------------- zdarzenia na polach z planu + kolizje
    const EXPECT = {
        23: [[2300, 65, 50], [2301, 68, 19]], 13: [[2320, 100, 46], [2321, 99, 46]], 21: [[2340, 67, 48], [2341, 62, 39]],
        4: [[2360, 73, 51], [2361, 70, 53], [2362, 74, 52]], 24: [[2380, 7, 29], [2381, 8, 29], [2382, 61, 4], [2383, 60, 22], [2384, 20, 46], [2385, 45, 38], [2386, 66, 12], [2387, 46, 38]],
        162: [[2440, 79, 51], [2441, 81, 53], [2442, 82, 51], [2443, 73, 50], [2444, 75, 50], [2445, 75, 54], [2446, 79, 51], [2447, 81, 53], [2448, 82, 51]], 168: []
    };
    const evBad = [], col = {};
    for (const m of Object.keys(EXPECT).map(Number)) {
        await go(m, 10);
        const r = await t.json(`(function(){ const want = ${JSON.stringify(EXPECT[m])}, bad = [];
            for (const [id, x, y] of want) { const e = $dataMap.events[id]; if (!e || e.x !== x || e.y !== y || e._twOwner !== "Lowy") bad.push([id, e ? [e.x, e.y, e._twOwner] : null]); }
            const mine = $dataMap.events.filter(e => e && e._twOwner === "Lowy").map(e => e.id);
            return { bad, out: mine.filter(id => id < 2300 || id > 2499), n: mine.length, check: Okolice.checkMap() }; })()`);
        if (r.bad.length || r.out.length || r.n !== EXPECT[m].length) evBad.push([m, r.bad, r.out, r.n]);
        col[m] = r.check.problems.filter(p => /^(nora|szary|oboz|blot|gawra|lizaw|zasiad|poroze|wylom|lesnicz|pasnik|sidla|patrol|rysiek|zblak|strzel)/.test(p));
    }
    t.check("zdarzenia paczki B (2300-2499) stoją na polach z planu na 6 mapach", evBad.length === 0, evBad);
    t.check("kolizje miejsc paczki B na 7 mapach: 0 (Okolice.checkMap)", Object.values(col).every(l => !l.length), col);

    // ---------------------------------------------------------------- B1 nora: wataha, szczenięta, rozbicie
    await t.eval("(function(){ const s = Lowy.state(); s.den.forcePups = Tawerna.time.day(); return 0; })()");
    await go(23, 10);
    await t.eval("__put(65, 55, 4, 7); 0");
    await t.frames(40);
    await t.eval("TownQuests.autoChecks(); 0");
    const den = await t.json(`(function(){ const a = Lowy.den.adults(), p = Lowy.den.pups();
        return { adults: a.length, flags: a.every(w => w._noClash && w._summoned && w._lowDen), pups: p.length, pupFlags: p.every(q => q._noDog && q._noClash && q._qbScale === 0.55),
            found: Okolice.isFound("nora"), k59: (TownQuests.rec("K59") || {}).s }; })()`);
    t.check("nora za dnia: 2 dorosłe wilki (_noClash, _summoned) i 2-3 szczenięta (skala 0,55, _noDog); odkrycie „nora”, K59 zaczęte", den.adults >= 2 && den.flags && den.pups >= 2 && den.pupFlags && den.found && den.k59 === "active", den);
    await t.eval("(function(){ for (const w of Lowy.den.adults()) Hunting.kill(w, 'melee', 'hero'); return 0; })()");
    await t.frames(130);
    const broke = await t.json(`({ pups: Lowy.den.pups().length, empty: Lowy.state().den.emptyUntil - Tawerna.time.day(), choice: Lowy.state().den.choice, k59: (TownQuests.rec("K59") || {}).s,
        pops: window.__kit.pops.map(p => p.text).filter(x => /Szczenięta/.test(x)) })`);
    t.check("rozbita wataha: szczenięta uciekają w gąszcz (dymek), nora pusta 28 dni, K59 wykonane", broke.pups === 0 && broke.empty === 28 && broke.choice === "rozbita" && broke.k59 === "done" && broke.pops.length > 0, broke);

    // ---------------------------------------------------------------- B1 nora: mięso trzy dni -> wataha przyjazna
    await t.eval("(function(){ const d = Lowy.state().den; d.emptyUntil = 0; d.choice = null; d.friendly = false; d.betrayed = false; d.meat = [Tawerna.time.day() - 2, Tawerna.time.day() - 1]; return 0; })()");
    await go(23, 10);
    await t.eval("(function(){ __put(64, 51, 1, 3); $gamePlayer.setDirection(8); $gameParty.gainItem($dataItems[94], 1); Drops.drop(94, 1); return 0; })()");
    await t.frames(10);
    await t.eval("__put(65, 50, 7, 10); 0");
    await t.frames(70);
    const fr = await t.json(`({ friendly: Lowy.state().den.friendly, choice: Lowy.state().den.choice, meat: Lowy.state().den.meat.length, bundles: Lowy.den.bundles().length,
        adults: Lowy.den.adults().length, isFriend: Lowy.den.adults().every(w => Lowy.den.isFriend(w)) })`);
    t.check("mięso przy norze trzeciego dnia: wilk zabiera kawałek, wataha przyjazna (zostawione)", fr.friendly && fr.choice === "zostawione" && fr.meat === 3 && fr.adults >= 2 && fr.isFriend, fr);
    // a friendly wolf right by the hero does not go for him
    await t.eval("(function(){ const w = Lowy.den.adults()[0]; __put(w.x, w.y, 1, 2); window.__hp = $gameActors.actor(1).hp; return 0; })()");
    await t.frames(240);
    const calm = await t.json(`({ engaged: Lowy.den.adults().some(w => w._engaged || (w._pack && w._pack.engaged)), hp: $gameActors.actor(1).hp, hp0: __hp,
        modes: Lowy.den.adults().map(w => w._mode) })`);
    t.check("przyjazna wataha: wilk tuż obok nie atakuje (żaden nie walczy, życie bez zmian)", !calm.engaged && calm.hp === calm.hp0, calm);
    await t.eval("(function(){ const d = Lowy.state().den; d.giftDay = -99; return 0; })()");
    await t.frames(40);
    const gift = await t.json("({ day: Lowy.state().den.giftDay === Tawerna.time.day(), carcass: Hunting.carcasses().some(c => c.kind === 'rabbit' && Math.hypot(c.x - 66.5, c.y - 52.5) < 1) })");
    t.check("dar watahy: raz w tygodniu przy norze leży zając", gift.day && gift.carcass, gift);

    // ---------------------------------------------------------------- B2 gawra
    await go(13, 10);
    const bear = await t.json("(function(){ const b = Lowy.bear.get(); return b ? { x: b._home.x, y: b._home.y, kind: b.kind() } : null; })()");
    t.check("gawra (wiosna-jesień, 4-22): niedźwiedź z domem przed wylotem (99,47)", bear && bear.kind === "bear" && bear.x === 99 && bear.y === 47, bear);
    await t.eval("(function(){ const b = Lowy.bear.get(); if (b) Hunting.removeAnimal(b); Lowy.state().bear.forceWinter = Tawerna.time.day(); __put(99, 47, 1, 2); return 0; })()");
    await t.frames(10);
    await t.eval("Lowy.act(null, ['wake']); 0");
    await t.frames(5);
    const woke = await t.json(`(function(){ const b = Lowy.bear.get(); if (!b) return null;
        return { rage: b._lowRage > Graphics.frameCount, wokeDay: Lowy.state().bear.wokeDay === Tawerna.time.day(), engaged: !!b._engaged || b._mode !== "roam",
            dmg: Lowy.bear.rageOf({ damage: 10, attacker: b }).damage, calm: Lowy.bear.rageOf({ damage: 10, attacker: {} }).damage, hooked: !!Combat._lowHooked }; })()`);
    t.check("zima: zajrzyj do gawry -> niedźwiedź obudzony i wściekły: przez minutę bije mocniej (x1,2 przez Combat.hitPlayer)",
        woke && woke.rage && woke.wokeDay && woke.engaged && woke.dmg === 12 && woke.calm === 10 && woke.hooked, woke);
    await t.eval("(function(){ $gameParty.gainItem($dataItems[90], 1); const b = Lowy.bear.get(); Hunting.kill(b, 'melee', 'hero'); return 0; })()");
    await t.frames(5);
    await t.eval(`(function(){ window.__n0 = $gameParty.numItems($dataItems[203]); const c = Hunting.carcasses().find(k => k.kind === "bear"); window.__car = !!c;
        if (c) { $gamePlayer.locate(Math.floor(c.x), Math.floor(c.y) + 1); $gamePlayer.setDirection(8); Hunting.dressCarcass(c); } return 0; })()`);
    await t.frames(120);
    const claw = await t.json(`({ car: __car, n0: __n0, n1: $gameParty.numItems($dataItems[203]), dead: Lowy.bear.dead(), hide: $gameParty.numItems($dataItems[170]) })`);
    t.check("ubity niedźwiedź spod gawry: przy oprawianiu pazur 203 (i skóra), gawra pusta do wiosny", claw.n1 === claw.n0 + 1 && claw.dead, claw);

    // ---------------------------------------------------------------- B3 błotnisko + obóz rabusiów
    await t.eval("(function(){ Lowy.state().wallow.windows = {}; return 0; })()");
    await go(21, 6);
    const wal = await t.json(`({ boars: Hunting.animals.filter(a => a._lowWallow).length, goals: Hunting.animals.filter(a => a._lowWallow).every(a => a._goal && a._goal.x >= 65 && a._goal.x <= 68 && a._goal.y >= 46 && a._goal.y <= 48) })`);
    t.check("błotnisko o świcie: 2-3 dziki idą tarzać się w błocie (_goal na błotnisku)", wal.boars >= 2 && wal.boars <= 3 && wal.goals, wal);
    const s0 = await t.json("Combat.perk('sneak')");
    await t.eval("(function(){ for (const a of Hunting.animals.slice()) Hunting.removeAnimal(a); $gamePlayer.locate(66, 47); return 0; })()");
    await t.frames(40);
    const mud = await t.json("({ buff: $gameSystem.hasBuff('ubloceny'), sneak: Combat.perk('sneak') })");
    t.check("w błocie: premia „Ubłocony” (2 h), zwierzęta wyczują później (sneak +0,3)", mud.buff && Math.abs(mud.sneak - s0 - 0.3) < 1e-6, { s0, mud });
    await t.eval("(function(){ Lowy.state().camps.forceRab = Tawerna.time.day(); $gameSystem.setDayNightHour(22); __put(60, 46, 5, 8); Humans.auto(true); Humans.campCheck(); return 0; })()");
    await t.frames(40);
    const rab = await t.json("(function(){ const c = Humans.campHere(); return c ? { fixed: !!c.fixed, x: c.x, y: c.y, n: c.members.length, tent: !!($gameMap.event(2341) && $gameMap.event(2341).characterName()) } : null; })()");
    t.check("obóz rabusiów na swoim miejscu (60,41) nocą, 2-4 ludzi, namiot widać", rab && rab.fixed && rab.x === 60 && rab.y === 41 && rab.n >= 2 && rab.n <= 4 && rab.tent, rab);
    await t.eval("(function(){ Humans.auto(false); Humans.clear(); return 0; })()");

    // ---------------------------------------------------------------- B4 lizawka, zasiadka, pies
    await go(4, 10);
    await t.eval("window.__kit.pops.length = 0; 0");
    await t.eval("Lowy.act(null, ['salt']); 0");
    await t.frames(5);
    const salt0 = await t.json("({ pops: window.__kit.pops.map(p => p.text), msg: $gameMessage.isBusy() })");
    t.check("lizawka bez soli: dymek nad bohaterem „Potrzebna bryła soli”, nie okno wiadomości", salt0.pops.some(x => /Potrzebna bryła soli/.test(x)) && !salt0.msg, salt0);
    await t.give(200, 1);
    await t.eval("(function(){ $gamePlayer.locate(73, 52); return 0; })()");
    await t.frames(40);
    await t.eval("Lowy.act(null, ['salt']); 0");
    await t.frames(40);
    const lick = await t.json(`({ active: Lowy.lick.active(), left: Lowy.state().lick.until - Tawerna.time.day(), salt: $gameParty.numItems($dataItems[200]), k60: TownQuests.rec("K60"),
        page: $gameMap.event(2360).findProperPageIndex() })`);
    t.check("sól na lizawce: działa 6 dni, pieniek z solą (druga strona), K60 krok 2", lick.active && lick.left === 6 && lick.salt === 0 && lick.page === 1 && lick.k60 && lick.k60.step === 1, lick);
    await t.setHour(5.5);
    await t.eval("(function(){ $gamePlayer.locate(70, 53); return 0; })()");
    await t.frames(70);
    const deer = await t.json(`({ n: Lowy.lick.deer().length, flags: Lowy.lick.deer().every(d => d._noDog && d._goal), hide: Lowy.lick.inHide(), sneak: Combat.perk('sneak'), aim: Combat.aimSteady() })`);
    const aim0 = await t.json("(function(){ $gamePlayer.locate(71, 53); const a = Combat.aimSteady(), s = Combat.perk('sneak'); $gamePlayer.locate(70, 53); return [a, s]; })()");
    t.check("o świcie przy lizawce 1-3 jelenie (_noDog, idą do soli); w zasiadce sneak +0,5 i celowanie x0,8", deer.n >= 1 && deer.n <= 3 && deer.flags && deer.hide
        && Math.abs(deer.sneak - aim0[1] - 0.5) < 1e-6 && Math.abs(deer.aim - aim0[0] * 0.8) < 1e-6, { deer, aim0 });
    const dog = await t.json(`(function(){ const d = Lowy.lick.deer()[0]; if (!d) return null; const g = { _x: d._x, _y: d._y, centerX: () => d.centerX(), centerY: () => d.centerY() };
        const a = Dog.findPrey(g, true); d._noDog = false; const b = Dog.findPrey(g, true); d._noDog = true; return { skip: !a || a.ref !== d, takes: !!(b && b.ref === d) }; })()`);
    t.check("pies nie poluje na jelenie spod lizawki (Dog.findPrey pomija _noDog)", dog && dog.skip && dog.takes, dog);
    // the deer come to the lick: the hero watching from the hide at dawn (K60 step 3)
    await t.eval("(function(){ const d = Lowy.lick.deer()[0]; if (d) d.locate(73, 52); return 0; })()");
    await t.frames(70);
    const watch = await t.json(`({ watched: Lowy.state().lick.watched, k60: TownQuests.rec("K60") })`);
    t.check("jeleń przy lizawce, bohater w zasiadce o świcie: K60 krok 3", watch.watched && watch.k60.step === 2, watch);

    // ---------------------------------------------------------------- B5 obóz myśliwych Czarnych Oczu + D33
    await t.eval("(function(){ Lowy.state().camps.forceCzo = Tawerna.time.day(); return 0; })()");
    await go(23, 10);
    await t.eval("(function(){ __put(66, 26, 5, 8); Humans.auto(true); Humans.campCheck(); return 0; })()");
    await t.frames(40);
    const czo = await t.json(`(function(){ const c = Humans.campHere(), men = Lowy.camps.czoMen(); const sack = Humans.drops().find(d => d.kind === "sack");
        return c ? { fixed: !!c.fixed, x: c.x, y: c.y, names: men.map(h => h.name()), looks: men.map(h => h._look), arrow: !!(sack && sack.items.some(([id]) => id === 205)),
            tent: !!$gameMap.event(2301).characterName() } : null; })()`);
    t.check("obóz myśliwych Czarnych Oczu za dnia na (66,21): łucznicy z nazwą, w worku strzała z białym okiem, namiot", czo && czo.fixed && czo.x === 66 && czo.y === 21
        && czo.names.every(n => n === "Myśliwy Czarnych Oczu") && czo.looks.every(l => l === "Archer") && czo.arrow && czo.tent, czo);
    await t.eval("(function(){ TownQuests.start('D33'); __put(66, 21, 2, 4); return 0; })()");
    await t.frames(40);
    const talk = await drive(["Wynoście się"]);
    const d33a = await t.json("({ choice: Lowy.state().czo.choice, step: (TownQuests.rec('D33') || {}).step, engaged: Lowy.camps.czoMen().some(h => h._engaged) })");
    t.check("D33: przy ognisku rozmowa z myśliwymi („Wynoście się”), myśliwi walczą", /niedźwiedzia/.test(talk.text) && d33a.choice === "drive" && d33a.step === 1 && d33a.engaged, { talk, d33a });
    await t.eval("(function(){ for (const h of Lowy.camps.czoMen()) Humans.kill(h, 'killed'); return 0; })()");
    await t.frames(30);
    const d33 = await t.json(`({ resolved: Lowy.state().czo.resolved, rec: (TownQuests.rec("D33") || {}).s, flag: !!TownQuests.state().flags.lowCzoPrzegnani,
        tpl: QuestBoard.TEMPLATES.some(x => x.id === "low_czo_023") })`);
    t.check("przegnani myśliwi: D33 wykonane, flaga lowCzoPrzegnani, zlecenie z tablicy znika", d33.resolved === "drive" && d33.rec === "done" && d33.flag && !d33.tpl, d33);
    await t.eval("(function(){ Humans.auto(false); Humans.clear(); return 0; })()");

    // ---------------------------------------------------------------- B6 zwierzyniec, gajowy, kłusownictwo
    await go(24, 10);
    await t.eval("(function(){ $gamePlayer.locate(7, 31); return 0; })()");
    await t.frames(70);
    const park = await t.json(`(function(){ const a = Hunting.animals.filter(x => x._lowPark), g = TownLife.eventOf("gajowy");
        const b = a[0]; let blocked = null; if (b) { const keep = [b._x, b._y]; blocked = !b.isMapPassable(10, 30, 8) && !b.isMapPassable(40, 20, 4) && b.isMapPassable(45, 31, 4); }
        return { n: a.length, deer: a.filter(x => x.kind() === "deer").length, boar: a.filter(x => x.kind() === "boar").length, inside: a.every(x => Lowy.park.inPark(x._x, x._y)),
            flags: a.every(x => x._noDog && x._summoned), blocked, gaj: !!g, gajSheet: g ? g.characterName() : "", found: Okolice.isFound("zwierzyniec") }; })()`);
    t.check("zwierzyniec: 4-6 jeleni i 2 dziki w granicach (_noDog), nie wyjdą za żywopłot; gajowy na mapie; odkrycie", park.deer >= 4 && park.boar === 2 && park.inside && park.flags
        && park.blocked && park.gaj && park.gajSheet === "$Npc_Gajowy" && park.found, park);
    await t.gold(200);
    const fine1 = await t.json(`(function(){ const op0 = TownQuests.opinion(); Lowy.park.crime("seen"); const w = Lowy.state().park.wanted; Lowy.park.payFine();
        return { w, gold: $gameParty.gold(), op: TownQuests.opinion() - op0, count: Lowy.state().park.count }; })()`);
    t.check("kłusownictwo pierwszy raz: grzywna 40 G, Opinia -3", fine1.w && fine1.w.fine === 40 && fine1.gold === 160 && fine1.op === -3 && fine1.count === 1, fine1);
    await t.gold(0);
    await t.give(94, 3);
    const fine2 = await t.json(`(function(){ Lowy.park.crime("found"); const w = Lowy.state().park.wanted; Lowy.park.payFine(); return { w, meat: $gameParty.numItems($dataItems[94]) }; })()`);
    t.check("drugi raz bez pieniędzy: grzywna 60 G - gajowy zabiera mięso i skóry", fine2.w.fine === 60 && fine2.meat === 0, fine2);
    await t.gold(100);
    await t.eval("(function(){ $gamePlayer.locate(20, 40); Lowy.park.crime('seen'); return 0; })()");
    await t.frames(5);
    // the fine talk itself (the gamekeeper's talk, then the payment)
    await t.eval("(function(){ Tawerna.call('SpeechBubbles', 'say', $gamePlayer, '', 1); const g = Lowy.park.gajowy(); $gameMap._interpreter.setup(Lowy.park.fineList(g).concat([{ code: 0, indent: 0, parameters: [] }]), 0); return 0; })()");
    const ft = await drive([]);
    await t.frames(10);
    const fine3 = await t.json(`({ gold: $gameParty.gold(), sw: $gameSwitches.value(23), until: Lowy.state().park.shutUntil - Tawerna.time.day(), hero: [$gamePlayer.x, $gamePlayer.y],
        pass: $gameMap.event(2380) && $gameMap.event(2380).findProperPageIndex() === 1 && $gameMap.event(2380).isNormalPriority() })`);
    t.check("trzeci raz: rozmowa z gajowym, 80 G, wyłom zarasta cierniem na 7 dni (przełącznik 23), bohater wyprowadzony za żywopłot",
        /Trzeci raz/.test(ft.text) && fine3.gold === 20 && fine3.sw && fine3.until === 7 && fine3.hero[1] === 28 && fine3.pass, { ft, fine3 });
    const legal = await t.json(`(function(){ $gameParty.gainItem($dataItems[204], 1); const d = Hunting.spawn("deer", 30, 45); d._lowPark = true;
        const c0 = Lowy.state().park.count; Lowy.park.poach(d, { x: 30.5, y: 45.5, mapId: 24, by: "hero" }); return { legal: Lowy.state().park.legal, count: Lowy.state().park.count - c0, wanted: Lowy.state().park.wanted }; })()`);
    t.check("z zezwoleniem jeleń raz w tygodniu jest legalny", legal.legal === 1 && legal.count === 0 && !legal.wanted, legal);
    await t.eval("(function(){ $gameSwitches.setValue(23, false); Lowy.state().park.shutUntil = 0; return 0; })()");

    // ---------------------------------------------------------------- D32: sidła, Rysiek, zezwolenie
    await t.eval("(function(){ $gameParty.loseItem($dataItems[204], 9); TownQuests.start('D32'); $gameMap.requestRefresh(); return 0; })()");
    await t.frames(40);
    const sn = await t.json("[2384, 2385, 2386].map(id => $gameMap.event(id).characterName())");
    t.check("D32: sidła kłusownika widać w zwierzyńcu (3)", sn.every(n => n === "!$Low_Sidla"), sn);
    await t.eval("(function(){ for (let i = 0; i < 3; i++) Lowy.takeSnare(null, i); return 0; })()");
    await t.frames(70);
    await t.setHour(23);
    await t.frames(40);
    const rys = await t.json("({ step: (TownQuests.rec('D32') || {}).step, rysiek: $gameMap.event(2387).characterName() })");
    await t.eval("__put(46, 38, 1, 2); 0");
    await t.frames(40);
    const rt = await drive(["Uciekaj"]);
    const d32 = await t.json("({ choice: Lowy.state().d32.choice, step: (TownQuests.rec('D32') || {}).step, flag: !!TownQuests.state().flags.lowOstrzegl })");
    t.check("D32: trzy sidła zebrane, nocą Rysiek przy sidłach - ostrzeżony (flaga), krok do gajowego", rys.step === 1 && rys.rysiek === "$Npc_Klusownik" && /Ryś|matkę/.test(rt.text)
        && d32.choice === "warn" && d32.step === 2 && d32.flag, { rys, rt, d32 });
    await t.eval("TownQuests.completeStep('D32'); 0");
    await t.frames(5);
    const d32b = await t.json("({ rec: (TownQuests.rec('D32') || {}).s, permit: $gameParty.numItems($dataItems[204]) })");
    t.check("D32 wykonane: zezwolenie na odstrzał (204)", d32b.rec === "done" && d32b.permit === 1, d32b);

    // ---------------------------------------------------------------- B7 zbłąkane zwierzęta
    await go(168, 10);
    const st = await t.json("({ n: Lowy.strays.list().length, kinds: Lowy.strays.list().map(a => a.kind()), inArea: Lowy.strays.list().every(a => a.x >= 72 && a.x <= 95 && a.y >= 18 && a.y <= 35) })");
    t.check("zbłąkane zwierzęta Ługów: krowa, owca, 2 kury na łąkach (x 72-95, y 18-35)", st.n === 4 && st.inArea && st.kinds.sort().join() === "cow,hen,hen,sheep", st);
    await t.eval("window.__kit.pops.length = 0; 0");
    await t.eval("(function(){ $gameParty.loseItem($dataItems[93], 99); Lowy.strays.rope('krasula'); return 0; })()");
    const rope0 = await t.json("({ pops: window.__kit.pops.map(p => p.text), led: Lowy.state().strays.led, msg: $gameMessage.isBusy() })");
    await t.give(93, 1);
    await t.eval("Lowy.strays.rope('krasula'); 0");
    const rope1 = await t.json("({ led: Lowy.state().strays.led, mode: Lowy.strays.list().find(a => a._key === 'krasula')._mode, rope: $gameParty.numItems($dataItems[93]) })");
    t.check("powróz: bez liny dymek (nie okno), z liną Krasula idzie za bohaterem (lina zużyta)", rope0.pops.some(x => /lin/.test(x)) && !rope0.led && !rope0.msg
        && rope1.led === "krasula" && rope1.mode === "led" && rope1.rope === 0, { rope0, rope1 });
    await t.eval(`(function(){ Homes.setStage(3); const c = __put(22, 12, 1, 3); const cow = Lowy.strays.list().find(a => a._key === "krasula"); if (c) cow.locate(c[0], c[1] + 1); return 0; })()`);
    await t.frames(40);
    const del = await t.json("({ done: Lowy.state().strays.done.krasula, led: Lowy.state().strays.led, count: Lowy.strays.count() })");
    t.check("Krasula odprowadzona do zagrody Ługów (etap ≥ 3): zwierzę wróciło, licznik K62 = 1", del.done && del.done.how === "farm" && !del.led && del.count === 1, del);
    const henc = await t.json(`(function(){ const keep = Math.random; Math.random = () => 0.1; const h = Lowy.strays.list().find(a => a._key === "kura1"); Lowy.strays.action(h); Math.random = keep;
        return { led: Lowy.state().strays.led, mode: h._mode }; })()`);
    await t.frames(40);
    const henDone = await t.json("({ done: Lowy.state().strays.done.kura1, count: Lowy.strays.count() })");
    t.check("kura złapana ręką (50%) idzie z bohaterem, a przy domu Ługów wraca do zagrody (K62: 2)", henc.led === "kura1" && henc.mode === "led" && henDone.done && henDone.done.how === "farm" && henDone.count === 2, { henc, henDone });

    // ---------------------------------------------------------------- B8 strzelnica: prawdziwe strzały z łuku, zawody
    await go(162, 10.5);
    await t.eval("window.__kit.pops.length = 0; 0");
    await t.eval("(function(){ $gameParty.loseItem($dataItems[126], 9); Lowy.range.start(false); return 0; })()");
    const nobow = await t.json("({ pops: window.__kit.pops.map(p => p.text), round: !!Lowy.range.round(), msg: $gameMessage.isBusy() })");
    t.check("strzelnica bez łuku: dymek „Bez łuku ani rusz.”, nie okno", nobow.pops.some(x => /Bez łuku/.test(x)) && !nobow.round && !nobow.msg, nobow);
    await t.give(126, 1);
    await t.eval("$gameParty.loseItem($dataItems[127], 99); $gameParty.gainItem($dataItems[127], 3); 0");
    const shootAll = async contest => {
        await t.eval(`Lowy.range.start(${contest}); 0`);
        for (let i = 0; i < 5; i++) {
            await t.eval(`(function(){ const tg = LowyData.STRZELNICA.targets[${i} % 3], sx = $gamePlayer._realX + 0.5, sy = $gamePlayer._realY + 0.3, dx = tg.x + 0.5 - sx, dy = tg.y + LowyData.STRZELNICA.faceY - sy, l = Math.hypot(dx, dy);
                if ($gameSystem.setStamina) $gameSystem.setStamina(999); Hunting.resetCooldown && Hunting.resetCooldown(); Hunting.shoot([dx / l, dy / l], "bow"); return 0; })()`);
            await t.frames(75);
        }
        await t.frames(40);
    };
    await shootAll(false);
    const r1 = await t.json("({ last: Lowy.state().range.last, round: !!Lowy.range.round(), arrows: $gameParty.numItems($dataItems[127]) })");
    t.check("runda: 5 strzał z łuku w środki tarcz = 50 pkt, strzały ćwiczebne nie ubywają (3 jak przed)", r1.last && r1.last.pts === 50 && r1.last.list.length === 5 && !r1.round && r1.arrows === 3, r1);
    await t.eval("(function(){ Lowy.state().range.forceContest = Tawerna.time.day(); Lowy.state().range.contestDay = -1; window.__g0 = $gameParty.gold(); window.__f0 = Garnizon.favor(); return 0; })()");
    await shootAll(true);
    const r2 = await t.json("({ best: Lowy.state().range.beatBest, silver: $gameParty.numItems($dataItems[206]), gold: $gameParty.gold() - __g0, favor: Garnizon.favor() - __f0 })");
    t.check("zawody: 50 pkt bije sierżanta Bełta (36) - 60 G, przychylność garnizonu, srebrna strzała", r2.best && r2.silver === 1 && r2.gold === 60 && r2.favor > 0, r2);

    // ---------------------------------------------------------------- F9
    const f9 = await t.json(`(function(){ const sec = Okolice.f9.sections().find(s => s.owner === "Lowy"); if (!sec) return null;
        const row = w => Object.assign({ owner: "Lowy" }, sec.rows.find(r => r.what === w)); const p = row("place"); Okolice.f9.pick(p, 1);
        return { title: sec.title, n: sec.rows.length, place: Okolice.f9.ok(p), salt: Okolice.f9.ok(row("salt")), lick: Lowy.lick.active() }; })()`);
    t.check("F9: sekcja paczki B (10 wierszy), miejsca i sól na lizawce", f9 && f9.n === 10 && f9.place && f9.place.go && f9.salt.go && f9.lick, f9);
    const goTo = f9.salt.go;
    await t.go(goTo[1], goTo[2], goTo[3]);
    const at = await t.json("[$gameMap.mapId(), $gamePlayer.x, $gamePlayer.y, Lowy.lick.inHide()]");
    t.check("wiersz F9 przenosi na miejsce (zasiadka przy lizawce)", at[0] === 4 && at[1] === 70 && at[2] === 53 && at[3], at);

    // ---------------------------------------------------------------- zapis i wczytanie
    const before = await t.json("JSON.stringify({ den: Lowy.state().den.friendly, park: Lowy.state().park.count, strays: Object.keys(Lowy.state().strays.done), led: Lowy.state().strays.led, silver: Lowy.state().range.silver })");
    await t.saveTo(1);
    await t.eval("(function(){ const s = Lowy.state(); s.den.friendly = false; s.park.count = 0; s.strays.done = {}; return 0; })()");
    await t.loadFrom(1);
    await t.frames(40);
    const after = await t.json("JSON.stringify({ den: Lowy.state().den.friendly, park: Lowy.state().park.count, strays: Object.keys(Lowy.state().strays.done), led: Lowy.state().strays.led, silver: Lowy.state().range.silver })");
    t.check("zapis i wczytanie: stan paczki B (przyjaźń, kłusownictwo, zwierzęta, srebrna strzała) zostaje", before === after, { before, after });

    await t.done();
});
