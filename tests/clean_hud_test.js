// "Czysty widok" in the graphite look "Grafit i miedź" (CleanHUD.js, CleanHUD_Compass.js, MenuRing.js; the user's choices 2026-10-08,
// mock-ups docs/ui_pomysly/pomysl_4_*, docs/ui_pomysly2/pomysl_3_grafit_*; 2026-10-12: "paski ... poziome i po prawo od zegara, a pod
// zegarem aktywne zadanie"): the HUD on the map - the parts in their corners, the old parts working but not drawn; top left the round
// clock, right of it the needs as level bars one under another (one length, one spacing; low = red), under the clock the
// day's line, "Tryb walki" under it and the breath as a fifth bar in the combat mode; the bottom left corner empty; the
// round goal compass in the top right corner (the goal on this map and on another one, through the exits) with the goal followed
// under it (2026-10-23: what it needs, have / need, growing as things are picked up - a goal's recipe, a town quest's step; the load
// hidden) and the minimap under that; the gains; no bars under the hero, no experience line; the thoughts over the hero; the fade under him (the whole
// top left corner as one); the minimap on M; P opens the menu „Lista” (its pages: tests/menu_lista_test.js); the option "Wygląd" back
// to the classic look and again. CDP_PORT=9460.
// The plugins are put into the page while they are not in js/plugins.js yet.
"use strict";
const path = require("path");
const kit = require("./lib/kit.js");

kit.test({ port: 9486, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", plugins: ["CleanHUD", "CleanHUD_Compass", "MenuRing"] }, async t => {
    t.check("wtyczki wczytane", ["CleanHUD", "CleanHUD_Compass", "MenuRing"].every(n => t.plugins[n] === "injected" || t.plugins[n] === "registered"), t.plugins);
    t.check("czysty widok jest domyślny", await t.eval("ConfigManager.uiClean === true && CleanHUD.lookClean()"));
    // (Fullscreen.js asks for fullscreen at the first key - the browser would then eat the first Esc to leave it: used up here)
    await t.eval("window.dispatchEvent(new Event('pointerdown')); 0");
    const ok = await t.newGame({ story: true, skipIntro: true, hour: 10, quiet: true });
    t.check("nowa gra w domu dziadka", ok && (await t.eval("$gameMap.mapId()")) === 19);
    await t.frames(30);
    const dbg = () => t.json("CleanHUD.debug()");

    // ---------------------------------------------------------------- the parts in their places, the old ones not drawn
    let d = await dbg();
    const P = d.parts;
    // (2026-10-23, the user: "okno z celem w lewo u góry w kącie, ładnie; zegar tuż przy kompasie po prawej stronie (niech obydwa są
    // tej samej wielkości), a okno z paskami stanu gracza pod oknem celu"; before: "Udźwig można usunąć z ekranu na razie")
    const cmp0 = await t.json("CleanCompass.info()");
    // (2026-10-23: "zmieniamy tylko okno celu z oknem pasków" - the bars in the corner, the goal under them; no plates behind them)
    t.check("lewy górny róg: paski w samym rogu (margines 12; bez głodu i pragnienia: życie i kondycja)", P.needs.visible && P.needs.x === 12 && P.needs.y === 12
        && d.bars.map(b => b.key).join() === "health,stamina" && d.bars.every(b => b.x > 12 && b.y < P.goal.y), { needs: P.needs, bars: d.bars });
    t.check("pod paskami cel (tytuł, etykieta CEL), tej samej szerokości, wyrównany do lewej", P.goal.visible && P.goal.x === 12 && P.goal.y >= P.needs.y + P.needs.h && P.goal.y <= P.needs.y + P.needs.h + 12
        && P.needs.w === P.goal.w && d.goalBox && d.goalBox.title === d.goal.title && d.goalBox.label === "CEL", { goal: P.goal, needs: P.needs, box: d.goalBox });
    t.check("prawy górny róg: okrągły kompas w rogu (margines 12)", P.compass.visible && cmp0.centre.x + cmp0.centre.r === 1268 && cmp0.centre.y - cmp0.centre.r === 12, { box: P.compass, c: cmp0.centre });
    const ck = d.text && d.text.clock;
    t.check("zegar tuż obok kompasu z lewej: ta sama wielkość, w jednej linii, nie nachodzą na siebie", !!ck && ck.r === cmp0.centre.r && ck.y === cmp0.centre.y && ck.x + ck.r <= cmp0.centre.x - cmp0.centre.r && cmp0.centre.x - cmp0.centre.r - (ck.x + ck.r) <= 16 && !d.text.goal, { clock: ck, compass: cmp0.centre });
    t.check("pora dnia pod zegarem i kompasem, wyrównana do prawej krawędzi", /^\S+ · dzień \d+ · \S+$/.test(d.text.day) && d.text.y >= ck.y + ck.r && d.text.x > 1000, d.text);
    // nothing on top of anything: the goal, the bars, the compass (with its label), the clock's dial, the day's line
    const c0 = cmp0.centre, boxes = { goal: P.goal, needs: P.needs, compass: { x: c0.x - c0.r, y: c0.y - c0.r, w: c0.r * 2, h: c0.r * 2 },
        clock: { x: ck.x - ck.r, y: ck.y - ck.r, w: ck.r * 2, h: ck.r * 2 }, day: { x: d.text.x, y: d.text.y, w: 1268 - d.text.x, h: 20 } };
    if (cmp0.label) boxes.label = { x: P.compass.x, y: c0.y + c0.r + 4, w: 1268 - P.compass.x, h: cmp0.bottom - (c0.y + c0.r + 4) };
    const meet = (a, c) => a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h;
    const clash = [];
    for (const a of Object.keys(boxes)) for (const c of Object.keys(boxes)) if (a < c && meet(boxes[a], boxes[c])) clash.push(a + "/" + c);
    t.check("nic na siebie nie nachodzi (cel, paski, zegar, kompas, jego podpis, pora dnia)", clash.length === 0 && (!cmp0.label || d.text.y >= cmp0.bottom), { clash, boxes, label: cmp0.label });
    const bottomLeft = Object.entries(d.parts).filter(([k, r]) => r && r.visible && r.w > 0 && r.x < 420 && r.y + r.h > 470);
    t.check("lewy dolny róg pusty (bez wachlarza)", bottomLeft.length === 0, bottomLeft);
    t.check("obciążenie na razie ukryte (CleanHUD: SHOW_LOAD), udźwig działa dalej", !P.load.visible && (await t.eval("!!CleanHUD.loadInfo()")), P.load);
    t.check("bez paska doświadczenia (stary nierysowany, nowego nie ma)", !d.parts.xp && d.old.xpBar === false && !(await t.eval("!!SceneManager._scene._cleanXp")), d.old.xpBar);
    t.check("stare części działają, ale nie są rysowane", Object.values(d.old).every(v => v === false) && Object.keys(d.old).length >= 8, d.old);
    await t.eval("$gameSystem._minimapHidden = undefined; 0");   // (a game that never pressed M: kit's quiet hid it)
    await t.frames(5);
    const mm0 = (await dbg()).minimap;
    t.check("minimapa domyślnie ukryta", !!mm0 && mm0.visible === false && mm0.hidden === true, mm0);
    const clock = await t.eval("SceneManager._scene._cleanClock._key");
    t.check("zegar ze wskazówkami: godzina gry (10:00 = 600 minut)", /^60\d#/.test(clock), clock);
    t.check("cel z dziennika w lewym górnym rogu: Dojdź na działkę dziadka (bez składników: pod tytułem jego linia)", d.goal && d.goal.id === "story_field" && /działkę dziadka/i.test(d.goal.title) && d.goalBox.needs.length === 0 && !!d.goalBox.sub, { goal: d.goal, box: d.goalBox });
    await t.shot(path.join(__dirname, "..", "docs", "ui_grafit", "test_hud_dom.png"));

    // ---------------------------------------------------------------- the compass: the goal on another map - through the exits
    const routed = await t.until("(function(){ const i = CleanCompass.info(); return !!(i && i.route && i.route.x !== undefined && !i.route.pending); })()", 30);
    let c = await t.json("CleanCompass.info()");
    t.check("kompas: cel na innej mapie (działka dziadka w Kruczym Jarze) - droga przez przejścia", routed && c.target && c.target.map === 3 && c.route.via > 0 && c.route.steps > 20, c);
    t.check("kompas: strzałka i podpis pod tarczą „Kruczy Jar · N kroków” (z innej mapy - nazwa mapy celu)", !!c.marker && /^Kruczy Jar · \d+ krok/.test(c.label || ""), c.label);
    const exitEv = await t.json(`(function(){ const i = CleanCompass.info(), e = $gameMap.event(i.route.exit); return e ? { x: e.x, y: e.y, to: CleanCompass.exitsHere().find(x => x.id === e.eventId()).to.map } : null; })()`);
    t.check("kompas: romb wskazuje prawdziwe przejście tej mapy", !!exitEv && exitEv.x === c.route.x && exitEv.y === c.route.y, exitEv);
    // the bearing: the hero west of the exit -> the arrow points east (right of N); east of it -> west
    const bearing = async dx => {
        await t.eval(`(function(){ const i = CleanCompass.info(); $gamePlayer.locate(Math.max(0, Math.min($gameMap.width() - 1, i.route.x + (${dx}))), i.route.y); CleanCompass.refresh(); return 0; })()`);
        await t.frames(40);
        return t.json("CleanCompass.info()");
    };
    const west = await bearing(-6), east = await bearing(6);
    t.check("kompas: cel na wschód - strzałka w prawo, na zachód - w lewo", west.marker && east.marker && west.angle > 45 && west.angle < 135 && east.angle < -45 && east.angle > -135
        && west.marker.x > west.centre.x + 30 && east.marker.x < east.centre.x - 30, { west: [west.angle, west.marker], east: [east.angle, east.marker] });
    // a person on this map: grandpa (the table's "person"), straight to him
    const gp = await t.json(`(function(){ const r = CleanCompass.resolve({ person: "grandpa" }), e = $gameMap.event(Story.NPCS.grandpa.id); return { r, ev: e ? [e.x, e.y] : null }; })()`);
    t.check("osoba na tej mapie: dziadek Stach tam, gdzie stoi", gp.r && gp.r.map === 19 && gp.ev && gp.r.x === gp.ev[0] && gp.r.y === gp.ev[1], gp);
    const direct = await t.json(`(function(){ $gamePlayer.locate(4, 6); return CleanCompass.route({ map: 19, x: 10, y: 6 }); })()`);
    t.check("cel na tej mapie: wprost, 6 kroków", direct && direct.direct && Math.round(direct.steps) === 6, direct);

    // ---------------------------------------------------------------- the map's name as one comes in, then it goes
    await t.go(20, 10, 12, 2);
    await t.frames(10);
    let top = (await dbg()).top;
    t.check("nazwa miejsca po wejściu u góry na środku", top.some(x => x.k === "name" && x.y < 30), top);
    await t.frames(260);
    top = (await dbg()).top;
    t.check("...i gaśnie po chwili", !top.some(x => x.k === "name"), top);
    await t.go(19, 4, 6, 2);
    await t.eval("CleanCompass.refresh(); 0");
    await t.frames(20);

    // ---------------------------------------------------------------- a town quest followed: its step's person
    const tq = await t.json(`(function(){ if (!window.TownQuests) return null; TownQuests.start("K1"); TownQuests.track("K1"); $gameSystem.setDayNightHour(10);
        return { track: TownQuests.state().track }; })()`);
    if (tq) {
        await t.frames(30);
        await t.eval("CleanCompass.refresh(); 0");
        await t.frames(10);
        const dq = await dbg(), g = dq.goal, ct = await t.json("CleanCompass.info()");
        t.check("zadanie z miasteczka w lewym górnym rogu pod paskami (K1, kowal)", g && g.source === "town" && g.id === "K1" && dq.parts.goal.visible && dq.parts.goal.x === 12 && dq.parts.goal.y >= dq.parts.needs.y + dq.parts.needs.h, g);
        t.check("kompas: krok zadania zna osobę - kowal w miasteczku (mapa 8)", ct.target && ct.target.map === 8 && /Tadek/.test(ct.target.name) && ct.target.x !== undefined, ct.target);
        const coal = await t.eval("$gameParty.numItems($dataItems[79])");
        t.check("okienko zadania: MIASTECZKO, bieżący krok („Przynieś…”) i rzecz z kroku z ilością mam/potrzeba",
            dq.goalBox && dq.goalBox.label === "MIASTECZKO" && /^Przynieś/.test(dq.goalBox.sub) && dq.goalBox.needs.length === 1 && dq.goalBox.needs[0].name === "Węgiel drzewny" && dq.goalBox.needs[0].need === 5 && dq.goalBox.needs[0].have === Math.min(5, coal) && !dq.goalBox.needs[0].ok, dq.goalBox);
        await t.shot(path.join(__dirname, "..", "docs", "ui_proste", "hud_cel_zadanie.png"));
        await t.eval("$gameParty.gainItem($dataItems[79], 2); 0");
        await t.frames(20);
        const dq2 = (await dbg()).goalBox;
        t.check("...po podniesieniu 2 sztuk liczba rośnie na bieżąco", dq2 && dq2.needs[0].have === Math.min(5, coal + 2), dq2 && dq2.needs);
        await t.eval(`(function(){ $gameParty.loseItem($dataItems[79], 2); TownQuests.track(null); return 0; })()`);
        await t.frames(20);
    }

    // ---------------------------------------------------------------- a goal pinned ("Zrób młotek"): its ingredients from the recipe, have / need
    const recipe = await t.json(`(function(){ const r = Farming.HAND_RECIPES.find(x => x.id === "hammer"); return r.inputs.map(([id, n]) => ({ id, name: $dataItems[id].name, n })); })()`);
    await t.eval(`(function(){ for (const [id, n] of ${JSON.stringify(recipe.map(r => [r.id, 1]))}) { $gameParty.loseItem($dataItems[id], $gameParty.numItems($dataItems[id])); $gameParty.gainItem($dataItems[id], n); }
        Journal.unpinOthers("goal"); Journal.data().pinned = "hammer"; return 0; })()`);
    await t.frames(30);
    let hb = (await dbg()).goalBox;
    t.check("przypięty cel „Zrób młotek”: pod tytułem składniki z przepisu z ilościami (po 1), brakujące nie zaznaczone, i gdzie się to robi",
        hb && hb.title === "Zrób młotek" && hb.needs.length === recipe.length && recipe.every((r, i) => hb.needs[i].name === r.name && hb.needs[i].need === r.n && hb.needs[i].have === 1 && hb.needs[i].ok === (r.n <= 1)) && /Wytwórz/.test(hb.at), { hb, recipe });
    await t.eval(`$gameParty.gainItem($dataItems[${recipe[0].id}], ${recipe[0].n}); 0`);
    await t.frames(20);
    hb = (await dbg()).goalBox;
    t.check("...dodane " + recipe[0].name + ": jego wiersz rośnie do " + recipe[0].n + "/" + recipe[0].n + " i jest spełniony (✓), reszta bez zmian",
        hb && hb.needs[0].have === recipe[0].n && hb.needs[0].ok && hb.needs.slice(1).every(n => n.have === 1), hb && hb.needs);
    await t.shot(path.join(__dirname, "..", "docs", "ui_proste", "hud_cel_skladniki.png"));
    // the layout's shots (the needs on: four bars under the goal), with the goal and without one (every goal done for a moment)
    await t.eval("Needs.setEnabled(true); 0");
    await t.frames(20);
    let du = await dbg();
    t.check("układ z przypiętym celem: paski (cztery) w rogu, cel pod nimi, tej samej szerokości", du.parts.goal.y >= du.parts.needs.y + du.parts.needs.h && du.parts.needs.y === 12 && du.parts.needs.w === du.parts.goal.w && du.bars.length === 4, { goal: du.parts.goal, needs: du.parts.needs });
    await t.shot(path.join(__dirname, "..", "docs", "ui_proste", "hud_uklad.png"));
    await t.eval(`(function(){ const d = Journal.data(); window._hudDone = Object.assign({}, d.done); for (const g of Journal.GOALS) if (d.done[g.id] === undefined) d.done[g.id] = 1; d.pinned = null; return 0; })()`);
    await t.frames(30);
    du = await dbg();
    t.check("bez celu okienka nie ma, a paski podjeżdżają do rogu (12, 12)", !du.parts.goal.visible && du.parts.needs.x === 12 && du.parts.needs.y === 12, { goal: du.parts.goal, needs: du.parts.needs });
    await t.shot(path.join(__dirname, "..", "docs", "ui_proste", "hud_uklad_bez_celu.png"));
    await t.eval(`(function(){ Journal.data().done = window._hudDone; Needs.setEnabled(false); return 0; })()`);
    await t.frames(30);

    // ---------------------------------------------------------------- gains, thoughts, the arc, the experience
    await t.eval(`(function(){ $gamePlayer.locate(9, 9); $gameParty.gainItem($dataItems[64], 2); $gameParty.gainItem($dataItems[77], 3); return 0; })()`);
    await t.frames(30);
    const gains = await t.json(`(function(){ const g = SceneManager._scene._cleanGains; return { rows: g.children.length, plates: SceneManager._scene._gainFeed.children.length,
        right: Math.max.apply(null, g.children.map(r => r.x)), bottom: Math.max.apply(null, g.children.map(r => r.y)) }; })()`);
    t.check("zdobycze: tekst z ikoną w prawym dolnym rogu (tyle wierszy, ile tabliczek)", gains.rows === gains.plates && gains.rows >= 2 && gains.right > 1200 && gains.bottom > 560, gains);
    const fades = await t.json(`(function(){ const g = SceneManager._scene._cleanGains; const r = g.children.slice().sort((a, b) => b.y - a.y); return r.map(x => x.opacity); })()`);
    t.check("zdobycze: starsze bledną", fades.length >= 2 && fades[0] > fades[1], fades);
    await t.eval(`(function(){ Tawerna.popup.need($dataItems[60].iconIndex, "Potrzebujesz siekiery"); SpeechBubbles.say($gamePlayer, "Muszę się czegoś napić..."); return 0; })()`);
    await t.frames(12);
    const over = await t.json(`(function(){ const s = SceneManager._scene, p = s._lootLayer.children.slice(-1)[0]; let cry = null;
        for (const [b, sp] of s._barks._shown) if (b.ch === $gamePlayer) cry = { clean: sp._cleanKey === sp._key, visible: sp.visible };
        return { popup: p ? { clean: !!p._cleanDone, text: p._data.text } : null, cry }; })()`);
    const pops = await t.popups();
    t.check("brak narzędzia: komunikat nad bohaterem, tekst z obrysem bez tabliczki", over.popup && over.popup.clean && pops.includes("Potrzebujesz siekiery"), over.popup);
    t.check("myśl bohatera bez dymka", over.cry && over.cry.clean, over.cry);
    // no bars under the hero (the user, 2026-10-08): no arc of the needs, the breath's bar of Combat_UI not drawn - also after a run
    await t.eval("$gameSystem.changeStamina(-8); if (Combat.spendBreath) Combat.spendBreath(30); 0");
    await t.frames(10);
    const feetBars = await t.json(`(function(){ const s = SceneManager._scene, b = s._spriteset._combatLayer && s._spriteset._combatLayer._breath;
        return { arc: !!s._cleanArc, breath: b ? { renderable: b.renderable, opacity: b.opacity } : null }; })()`);
    t.check("pod bohaterem żadnych pasków (oddech pod stopami niewidoczny)", !feetBars.arc && !!feetBars.breath && feetBars.breath.renderable === false, feetBars);

    // ---------------------------------------------------------------- the needs on: four level bars of one length and spacing; low; the fade
    await t.eval("Needs.setEnabled(true); 0");
    await t.frames(10);
    let bars = (await dbg()).bars;
    t.check("z głodem i pragnieniem: cztery paski - życie, kondycja, sytość, nawodnienie", bars.map(b => b.key).join() === "health,stamina,food,water", bars.map(b => b.key));
    t.check("paski poziome, jeden pod drugim: ta sama długość i grubość, równe odstępy, wyrównane do lewej", bars.every(b => b.w === bars[0].w && b.h === bars[0].h && b.x === bars[0].x) && bars[0].w > bars[0].h * 10
        && bars.every((b, i) => i === 0 || b.y - bars[i - 1].y === bars[1].y - bars[0].y), bars.map(b => [b.x, b.y, b.w, b.h]));
    const pg = (await dbg()).parts.goal;
    t.check("paski w lewej kolumnie, nad celem", bars.every(b => b.x > 12 && b.x < 120 && (!pg.visible || b.y < pg.y)), { bars: bars.map(b => [b.x, b.y]), goal: pg });
    t.check("wypełnienie w kolorze potrzeby, liczba przy pasku", bars.every(b => !b.low && /^#/.test(b.colour) && !!b.number && Math.abs(b.fill - Math.round(b.w * b.ratio)) <= 1), bars.map(b => [b.key, b.fill, b.number]));
    await t.eval("$gameSystem._needs.water = 8; 0");
    await t.frames(10);
    bars = (await dbg()).bars;
    const water = bars.find(b => b.key === "water");
    t.check("niskie nawodnienie: pasek czerwony (miga), krótki, liczba czerwona", water && water.low && water.colour === "#ff6f5e" && water.ratio < 0.15, water);
    await t.eval("$gameSystem._needs.water = 70; 0");
    const alphaAt = async (sx, sy) => {
        await t.eval(`(function(){ $gameMap.setDisplayPos(0, 0); $gamePlayer.locate(${sx}, ${sy}); $gameMap.setDisplayPos(0, 0); return 0; })()`);
        await t.frames(40);
        return t.json(`(function(){ const s = SceneManager._scene; return { clock: +s._cleanClock.alpha.toFixed(2), bars: +s._cleanNeeds.alpha.toFixed(2), goal: +s._cleanGoal.alpha.toFixed(2), compass: +s._cleanCompass.alpha.toFixed(2) }; })()`);
    };
    await t.go(20, 10, 12, 2);
    const tileOf = r => [Math.floor((r.x + r.w / 2) / 48), Math.floor((r.y + r.h / 2) / 48)];
    const pr = (await dbg()).parts, ckNow = (await dbg()).text.clock;
    const underGoal = await alphaAt(...tileOf(pr.goal)), underBars = await alphaAt(...tileOf(pr.needs));
    const underClock = await alphaAt(Math.floor(ckNow.x / 48), Math.floor(ckNow.y / 48)), away = await alphaAt(10, 8);
    t.check("bohater pod celem (lewy górny róg): blednie cała lewa kolumna (cel i paski), zegar nie", underGoal.goal <= 0.35 && underGoal.bars <= 0.35 && underGoal.clock === 1, underGoal);
    t.check("bohater pod paskami: blednie cała lewa kolumna", underBars.goal <= 0.35 && underBars.bars <= 0.35 && underBars.clock === 1, underBars);
    t.check("bohater pod zegarem (prawy górny róg): zegar blednie, lewa kolumna nie", underClock.clock <= 0.35 && underClock.goal === 1 && underClock.bars === 1, underClock);
    t.check("...a gdy odejdzie, wraca", away.clock === 1 && away.bars === 1 && away.compass === 1 && away.goal === 1, away);
    await t.eval("Needs.setEnabled(false); 0");

    // ---------------------------------------------------------------- the minimap on M, under the clock, the compass and the day's line
    await t.key("M");
    await t.frames(10);
    let mm = (await dbg()).minimap;
    const textNow = (await dbg()).text, cmpNow = await t.json("CleanCompass.info()");
    t.check("M pokazuje minimapę pod zegarem, kompasem i porą dnia (prawy górny róg)", mm && mm.visible && mm.y >= cmpNow.bottom && mm.y >= textNow.y + 20 && mm.y < 260, { mm, text: textNow, bottom: cmpNow.bottom });
    await t.key("M");
    await t.frames(10);
    mm = (await dbg()).minimap;
    t.check("M znowu ją chowa", mm && !mm.visible, mm);

    // ---------------------------------------------------------------- the combat mode: the breath's bar and "Tryb walki" in the left column, the weapon
    await t.eval("$gameParty.gainItem($dataItems[60], 1); 0");
    const before = await dbg();
    await t.key("Tab");
    await t.frames(20);
    d = await dbg();
    t.check("tryb walki: plakietka „Tryb walki” pod paskami (lewa kolumna), nie u góry na środku", d.text.combat && d.text.pillY > d.bars[d.bars.length - 1].y && d.text.pillY < 400 && !d.top.some(x => x.k === "mode"), { text: d.text, top: d.top });
    const br = d.bars[d.bars.length - 1], prev = d.bars[d.bars.length - 2];
    t.check("tryb walki: oddech jako kolejny pasek na dole (ta sama długość i odstęp; poza walką go nie ma)", br && br.key === "breath" && br.w === prev.w && br.x === prev.x && br.y - prev.y === prev.y - d.bars[d.bars.length - 3].y
        && !before.bars.some(b => b.key === "breath"), { bars: d.bars.map(b => [b.key, b.y]), before: before.bars.map(b => b.key) });
    t.check("tryb walki: pora dnia i zegar zostają po prawej (nic się nie przesuwa ani nie nakłada)", d.text.x === before.text.x && d.text.y === before.text.y && d.parts.needs.x + d.parts.needs.w < d.text.x, { text: d.text, needs: d.parts.needs });
    t.check("tryb walki: broń w prawym dolnym rogu", d.parts.weapon.visible && d.parts.weapon.x > 900 && d.parts.weapon.y > 600, d.parts.weapon);
    await t.shot(path.join(__dirname, "..", "docs", "ui_grafit", "test_hud_walka.png"));
    await t.key("Tab");
    await t.frames(10);

    // ---------------------------------------------------------------- P: the menu "Lista" (every page: tests/menu_lista_test.js)
    await t.key("P");
    t.check("P otwiera menu", await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10));
    await t.frames(45);
    const menu = await t.json("MenuRing.info()");
    t.check("menu P: rząd ośmiu zakładek (Postać, Ekwipunek, Umiejętności, Plecak, Dziennik, Opcje, Zapisz, Wyjdź), na początku Postać", menu && menu.tabs.join() === "hero,equip,skills,item,journal,options,save,gameEnd" && menu.active === "hero" && !menu.window.visible, menu && menu.tabs);
    const back = await t.json("(function(){ const s = SceneManager._scene._backgroundSprite; return { blur: s.filters && s.filters[0] ? +s.filters[0].blur.toFixed(1) : 0, opacity: s.opacity }; })()");
    t.check("mapa za menu rozmyta (wejście się dokończyło)", back.blur >= 1.4 && back.opacity === 255, back);
    await t.key("Escape");
    t.check("Esc zamyka menu", await t.until(t.onMap(20), 10));
    await t.frames(10);

    // ---------------------------------------------------------------- Opcje: "Wygląd" - the classic look, and back
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(30);
    for (let i = 0; i < 5; i++) { await t.key("D"); await t.frames(12); }   // (the tabs: Postać -> Ekwipunek -> Umiejętności -> Plecak -> Dziennik -> Opcje)
    await t.key("O");   // (into Opcje: their list has the keys)
    await t.frames(8);
    const opt = await t.json(`(function(){ const i = MenuRing.info(), w = SceneManager._scene._views.options._win; return { tab: i.active, symbol: i.options.symbol, text: w.statusText(w.index()), name: w.commandName(w.index()) }; })()`);
    t.check("Opcje (zakładka menu P): „Wygląd: Grafit” w pierwszym wierszu", opt.tab === "options" && opt.symbol === "uiClean" && opt.name === "Wygląd" && opt.text === "Grafit", opt);
    await t.key("Enter");
    const closed = await t.until(t.onMap(20), 10);
    const opt2 = await t.json(`(function(){ return { cfg: ConfigManager.uiClean, saved: ConfigManager.makeData().uiClean }; })()`);
    t.check("Enter zmienia na „Klasyczny” (zapisane w ustawieniach), menu Grafit się zamyka", closed && opt2.cfg === false && opt2.saved === false, opt2);
    await t.frames(10);
    await t.key("P");
    await t.until("SceneManager._scene instanceof Scene_Menu && !SceneManager.isSceneChanging()", 10);
    await t.frames(10);
    t.check("klasyczny: menu P znowu jako panel", !(await t.eval("SceneManager._scene._cardOn")) && (await t.eval("SceneManager._scene._menuPanel.visible && SceneManager._scene._commandWindow.visible")));
    await t.key("Escape");
    await t.until(t.onMap(20), 10);
    await t.frames(10);
    d = await dbg();
    t.check("klasyczny: stare części znowu rysowane, czyste schowane", !d.clean && Object.values(d.old).every(v => v === true) && !d.parts.clock.visible && !d.parts.compass.visible && !d.parts.needs.visible, d.old);
    await t.shot(path.join(__dirname, "..", "docs", "ui_grafit", "test_klasyczny.png"));
    await t.eval("CleanHUD.setClean(true); 0");
    await t.frames(10);
    d = await dbg();
    t.check("i z powrotem czysty widok", d.clean && d.parts.clock.visible && Object.values(d.old).every(v => v === false), d.parts.clock);
});
