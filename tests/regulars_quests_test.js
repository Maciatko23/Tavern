// The regulars' longer quests (TownQuests.js, 2026-10-06): D13 "Zakład Ozzy'ego" (three predictions read from the weather plan -
// Grum's bet - each seen with one's own eyes: the weather, Hanka's oven, the corporal's horseshoe - Grum pays 10 G for each, Ozzy sober
// for a moment), D6 "Siłacz z targu" (the author 2026-10-06: arm-wrestling only in the tavern - three evenings' training with Grum, the
// sign-up with Borgar at the bar, Baltazar's 40 G for a lost first bout, three bouts at the tavern's arm table on the market day's evening
// in TavernLife's arm-wrestling with other rivals - the belt and its load; or the fight sold),
// W3 "Pieśń o Kruczych Skałach" (Melia's dream, six verses from six sources - Ambroży, Ludmiła, the plinth in the knights' garden,
// the manor's chronicle through the butler, Ozzy at two in the night - who she is, and where she sings it: for Borgar, at the Kupała
// bonfire, or the words burnt). Port: CDP_PORT=9463.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "tawerna_zycie");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    const flat = r => { r.text = r.text.replace(/\s+/g, " "); return r; };
    const step = async id => { const r = await J(`TownQuests.rec(${JSON.stringify(id)})`); return r ? r.s + ":" + r.step : "none"; };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 12); };
    const talk = async (ev, picks, o) => { const r = await t.talkTo(ev, picks || [], Object.assign({ secs: 25 }, o || {})); if (!r.done) await t.finish(); return flat(r); };
    const reg = n => `$gameMap.event(${n})`;
    const res = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const done = id => t.eval(`(function(){ TownQuests.state().q[${JSON.stringify(id)}] = { s: "done", step: 0, day: 1, sday: 1, end: 1, t: { done: {} }, times: 1 }; return 0; })()`);

    // ------------------------------------------------------------------ D13: Ozzy's bet
    await t.newGame({ map: 1, x: 46, y: 41, dir: 8, hour: 19, day: 5, quiet: true, minimap: false });
    await t.frames(20);
    const d0 = await J("(function(){ for (let d = 5; d < 120; d++) if (TownQuests.FX.d13Offer.pred(d)) return d; return 0; })()");
    const p = await J(`TownQuests.FX.d13Offer.pred(${d0})`);
    await done("K33");
    await at(d0, 19, 20);
    const off = await talk(reg(4), ["Sprawdzę", "Bywaj"]);
    const sayW = (p.wDay === d0 + 1 ? "Jutro " : "Pojutrze ") + (await J(`TownQuests.hourWords(${p.wHour})`)) + (p.storm ? " burza" : " deszcz");
    t.check("D13 (day " + d0 + "): Ozzy predicts '" + sayW + "' - read from the weather plan - the oven, the horseshoe; Grum's shout from across the hall",
        off.text.includes(sayW) && /pęknie piec Hanki/.test(off.text) && /koń kaprala zgubi podkowę/.test(off.text) && /Bzdury! Dziesięć groszy/.test(off.text) && (await step("D13")) === "active:0", off.text.slice(0, 300));
    await t.locate(95, 33, 8);
    const bet = await talk(reg(3), ["Bywaj"]);
    t.check("...Grum takes the bet: 10 G for each one that comes true - seen with one's own eyes", /Z gadania nie płacę/.test(bet.text) && (await step("D13")) === "active:1", bet.text.slice(0, 200));
    await t.saveTo(7);
    await t.setDay(p.wDay, p.wHour + 0.4);
    await t.frames(40);
    const w = await J("TownQuests.rec('D13').t.got");
    t.check("...the day and hour come: the weather as he said - seen (a thought: 'Tak, jak mówił Ozzy')", w.weather === true && (await J("SpeechBubbles.log.join('|')")).includes("Tak, jak mówił Ozzy"), w);
    await t.go(8, 22, 33, 8);
    await at(p.oven, 9, 40);
    const hanka = await talk(res("piekarka"), []);
    t.check("...day " + p.oven + ", the stall: Hanka - 'Mój piec pękł!'", /Mój piec pękł/.test(hanka.text) && (await J("TownQuests.rec('D13').t.got.oven")) === true, hanka.text.slice(0, 120));
    await at(p.shoe, 10, 40);
    await t.locate(46, 51, 6);
    const wit = await talk(res("kapral"), []);
    t.check("...day " + p.shoe + ", the east gate: the corporal's horse lost a shoe - all three seen, back to the tavern", /zgubił podkowę/.test(wit.text) && (await step("D13")) === "active:2", wit.text.slice(0, 120));
    await t.go(1, 95, 33, 8);
    await at(p.shoe, 19, 20);
    const g13 = await t.gold();
    const pay = await talk(reg(3), ["Bywaj"]);
    t.check("...Grum pays 3 × 10 G ('Ten stary pijak mnie przeraża')", /3 na trzy/.test(pay.text) && (await t.gold()) === g13 + 30 && (await step("D13")) === "active:3", pay.text.slice(0, 160));
    await t.locate(46, 41, 8);
    const sober = await talk(reg(4), ["Bywaj"]);
    t.check("...and Ozzy, sober for a moment, says true things about the hero (the purse to the grosz) - done, his trust +15",
        new RegExp("Masz w sakiewce " + (await t.gold()) + " groszy").test(sober.text) && /Jedno pytanie - nigdy więcej/.test(sober.text) && (await step("D13")).startsWith("done") && (await J("TavernLife.trust('ozzy')")) >= 15, sober.text.slice(0, 300));
    // missed ones: Grum does not pay for what the hero did not see
    await t.loadFrom(7, { quiet: true });
    await t.setDay(p.shoe + 1, 10);
    await t.frames(40);
    const miss = await J("({ got: TownQuests.rec('D13').t.got, step: TownQuests.rec('D13').step })");
    t.check("(a load: the three days slept through - each prediction missed, the step moves on all the same)", miss.got.weather === false && miss.got.oven === false && miss.got.shoe === false && miss.step === 2, miss);

    // ------------------------------------------------------------------ D6: the tournament - in the tavern, the market day's evening
    await t.newGame({ map: 8, x: 8, y: 50, dir: 4, hour: 10, day: 4, quiet: true, minimap: false });
    await t.frames(40);
    await t.gold(30);
    await t.eval("(function(){ for (const q of TownQuests.QUESTS) if (q.giver === 'kowal' && q.id !== 'D6') TownQuests.state().q[q.id] = { s: 'done', step: 0, day: 1, sday: 1, end: 1, t: { done: {} }, times: 1 }; return 0; })()");   // (Tadek's other quests out of the way)
    const d6 = await talk(res("kowal"), ["Stanę"]);
    t.check("D6: Tadek at the anvil - 'Ja i Grum, co roku. I co roku Grum' - the hero enters; the tournament on the market day 7", /co roku Grum/.test(d6.text) && (await step("D6")) === "active:0" && (await J("TownQuests.rec('D6').t.market")) === 7, d6.text.slice(0, 200));
    for (const d of [4, 5]) { await t.setDay(d, 19); await t.eval("Tawerna.emit('tavernGame', { game: 'arm', won: false, stake: 5, rival: 'grum' }); 0"); await t.frames(10); }
    t.check("...two evenings of arm-wrestling with Grum: training 2/3", (await step("D6")) === "active:0" && (await J("TownQuests.rec('D6').t.n")) === 2);
    await t.setDay(6, 19);
    await t.eval("Tawerna.emit('tavernGame', { game: 'arm', won: true, stake: 5, rival: 'grum' }); 0");
    await t.frames(10);
    t.check("...the third evening: trained - next, the sign-up", (await step("D6")) === "active:1");
    await t.go(1, 48, 31, 8);
    await at(6, 9, 20);
    const sign = await talk("$gameMap.event(38)", ["Zapisz mnie na turniej", "Nic"]);
    t.check("...the sign-up at the bar: Borgar (the counter) takes 2 G - and warns: Baltazar asked about the hero", /Dwa grosze wpisowego/.test(sign.text) && /Baltazar o ciebie pytał/.test(sign.text) && (await t.gold()) === 28 && (await step("D6")) === "active:2", { text: sign.text.slice(0, 200), choices: sign.choices });
    await t.go(8, 12, 41, 8);
    await at(6, 9, 40);
    const bal = await talk(res("kupiec"), ["Biorę."]);
    t.check("...Baltazar: forty groszy to lose the first bout - taken", /Czterdzieści groszy dla ciebie/.test(bal.text) && (await t.gold()) === 68 && (await J("TownQuests.state().flags.d6Bribe")) === 6, bal.text.slice(0, 200));
    await at(7, 10.5, 40);
    t.check("the market day's morning: no tournament at the market any more (the sołtys has nothing about it)", !(await J("TownQuests.armTable()")) && !(await J("(TownQuests.markers().soltys || '') === 'ready'")));
    await t.go(1, 92, 33, 6);
    await at(7, 18.5, 20);
    await t.saveTo(8);
    await t.eval(`(function(){ Combat.hero().attr.str = 60; Combat.hero().attr.con = 60; $gameSystem.setStamina && $gameSystem.setStamina(100); TownQuests.armOpts = { seed: 11, turbo: 6 };
        window.__bt = 0; TavernLife.onTick = function(scene) { const I = Input._currentState; I.ok = false; const s = scene.state(); window.__bt++;
            if (s.phase === "card" || s.phase === "summary") { if (window.__bt % 8 === 0) I.ok = true; return; }
            if (s.phase === "pull") I.ok = s.n < (s.lo + s.hi) / 2 - 0.015; }; return 0; })()`);
    const bout = async (pick, n) => {
        await t.eval("window.__bt = 0; TavernLife.onTick = TavernLife.onTick || null; 0");
        const r = await talk("$gameMap.event(148)", [pick], { secs: 120 });
        await t.until("SceneManager._scene instanceof Scene_Map && !TavernLife.gameState()", 30);
        await t.frames(30);
        return r;
    };
    const qf = await bout("Walczę uczciwie");
    const r1 = await J("({ step: TownQuests.rec('D6'), last: TavernLife.lastResult && { won: TavernLife.lastResult.won, rival: TavernLife.lastResult.rival } })");
    t.check("the market day's evening at the tavern's arm table: Borgar calls the first bout (the woźnica); the bribed hero fights fair - the arm-wrestling with another rival (Wojciech) - won",
        /Wojciechowi, woźnicy/.test(qf.text) && r1.last && r1.last.won && r1.last.rival === "woznica" && r1.step.t.round === 1, r1);
    await t.eval(`TavernLife.onTick = function(scene) { const I = Input._currentState; I.ok = false; const s = scene.state(); window.__bt++;
            if (s.phase === "card" || s.phase === "summary") { if (window.__bt % 8 === 0) I.ok = true; return; }
            if (s.phase === "pull") I.ok = s.n < (s.lo + s.hi) / 2 - 0.015; }; 0`);
    const sf = await bout("Do stołu");
    await t.eval(`TavernLife.onTick = function(scene) { const I = Input._currentState; I.ok = false; const s = scene.state(); window.__bt++;
            if (s.phase === "card" || s.phase === "summary") { if (window.__bt % 8 === 0) I.ok = true; return; }
            if (s.phase === "pull") I.ok = s.n < (s.lo + s.hi) / 2 - 0.015; }; 0`);
    const afterSf = await J("({ round: TownQuests.rec('D6').t.round, s: TownQuests.rec('D6').s, last: TavernLife.lastResult && TavernLife.lastResult.won })");
    console.log("after the semi-final", JSON.stringify(afterSf));
    const cap0 = await J("Survival.weightCap()"), g6 = await t.gold();
    const fin = await bout("Do stołu");
    const champ = await J("({ s: TownQuests.rec('D6').s, pas: TownQuests.vcount('pas'), carry: TownQuests.state().perks.carry, cap: Survival.weightCap(), f: TownQuests.state().flags })");
    t.check("...the semi-final (Tadek Młot) and the final (Grum): the champion - 50 G, the strongman's belt (load +8), flags d6Won and d6Crossed (Baltazar's money taken, the bout won)",
        /Tadkowi Młotowi/.test(sf.text) && /Grumowi Żelaznej Pięści/.test(fin.text) && champ.s === "done" && champ.pas === 1 && champ.carry === 8 && champ.cap === cap0 + 8 && (await t.gold()) === g6 + 50 && champ.f.d6Won && champ.f.d6Crossed, champ);
    await t.locate(95, 33, 8);
    await at(7, 21, 20);
    const gr = await talk(reg(3), ["Bywaj"]);
    t.check("...Grum: 'Pobiłeś mnie przy wszystkich. W mojej własnej tawernie.'", /W mojej własnej tawernie/.test(gr.text), gr.text.slice(0, 120));
    // the fight sold
    await t.loadFrom(8, { quiet: true });
    await at(7, 18.5, 20);
    const sold = await talk("$gameMap.event(148)", ["Przegram"]);
    const sf6 = await J("({ s: TownQuests.rec('D6').s, f: TownQuests.state().flags, pas: TownQuests.vcount('pas') })");
    t.check("(a load) ...or the first bout thrown as Baltazar wished: done, flags d6Sold + balthazarTrust (W5), no belt", sf6.s === "done" && sf6.f.d6Sold && sf6.f.balthazarTrust && !sf6.pas, sf6);

    // ------------------------------------------------------------------ W3: the seventh ballad
    await t.newGame({ map: 1, x: 74, y: 31, dir: 8, hour: 14, day: 10, quiet: true, minimap: false });
    await t.frames(20);
    await done("K22"); await done("K33"); await done("D13");   // (Ozzy's own offers out of the way)
    await t.eval("TavernLife.state().heard = ['kruk', 'pytanie', 'straznik', 'drzwi', 'kasztelan', 'chlopiec']; TownQuests.autoChecks(); 0");
    t.check("W3 begins once all six ballads are heard and 'Struna dla Melii' is done", (await step("W3")) === "active:0");
    const dream = await talk(reg(2), ["Bywaj"]);
    const n1 = await J("({ v: TownQuests.hasVerse('struna'), text: TownQuests.journalOps(TownQuests.journalItems().find(x => x.quest && x.quest.id === 'W3')).map(o => o.text || '').join(' | ') })");
    t.check("ch. 1: Melia's dream - the melody without words; (K22 was late: the string's verse comes now); the journal: 1/6 and where to look",
        /Siódma ballada - o Kruczych Skałach/.test(dream.text) && /♪ Na Kruczych Skałach/.test(dream.text) && n1.v && (await step("W3")) === "active:1" && /\(1\/6\)/.test(n1.text) && /Ambroży/.test(n1.text), n1.text.slice(0, 400));
    await done("D16"); await done("K27");
    await t.eval("TownQuests.state().flags.gardenKey = 3; 0");
    await t.give(137, 2);
    await t.go(8, 20, 36, 8);
    await at(10, 10, 40);
    const amb = await talk(res("dzwonnik"), []);
    t.check("ch. 2: Ambroży (an apprentice's master by now) taps the rhythm and hums the bell's verse", /♪ Raz dzwon uderzy/.test(amb.text) && (await J("TownQuests.hasVerse('dzwon')")), amb.text.slice(0, 200));
    await t.locate(5, 10, 8);
    await at(10, 11, 20);
    const pl = await talk("$gameMap.event(43)", [], { place: false });
    t.check("ch. 5: the plinth of the left statue in the knights' garden - the carved verse ('Strażniku, stój na progu twardy')", /Strażniku, stój na progu twardy/.test(pl.text) && (await J("TownQuests.hasVerse('cokoly')")), pl.text.slice(0, 200));
    await at(11, 8.7, 40);
    const fe = await talk(res("feliks"), ["Dam ci dzban"]);
    t.check("ch. 6: the manor's chronicle - the butler copies a verse for a jug of mead ('Dwór z kamieni - kamień pamięta')", /Dwór z kamieni - kamień pamięta/.test(fe.text) && (await J("TownQuests.hasVerse('kronika')")) && (await t.count(137)) === 1, fe.text.slice(0, 240));
    await at(11, 18, 40);
    const lu = await talk(res("ludmila"), []);
    t.check("ch. 3: Ludmiła's lullaby from the continent - 'Serce, co nie kłamie'", /Serce, co nie kłamie/.test(lu.text) && (await J("TownQuests.hasVerse('kolysanka')")), lu.text.slice(0, 240));
    await t.go(1, 46, 41, 8);
    await at(11, 19, 20);
    await t.gold(100);
    const md = await talk(reg(4), ["Daj mu dzban", "Bywaj"]);
    await t.eval("TavernLife.rentRoom(1); 0");
    await t.frames(30);
    t.check("ch. 4: a jug of mead for Ozzy in the evening (his own topic), a room rented upstairs", /Miód! Pitny!/.test(md.text) && (await t.count(137)) === 0 && !!(await J("TavernLife.rentedRoom()")), md.text.slice(0, 160));
    await t.setDay(12, 2.0);
    await t.frames(20);
    const bel = await talk(reg(4), []);
    t.check("...at two in the night Ozzy, asleep, sings the last verse - the way down ('trzeci jest pusty, przeskocz pół'); all six: on to ch. 7",
        /trzeci jest pusty, przeskocz pół/.test(bel.text) && (await J("TownQuests.hasVerse('belkot')")) && (await step("W3")) === "active:2", bel.text.slice(0, 300));
    await t.locate(74, 31, 8);
    await t.setDay(12, 2.2);
    await t.frames(10);
    const ori = await talk(reg(2), ["Twoja babka", "Bywaj"]);
    t.check("ch. 7, after midnight: where Melia knows them from - the Order kept its memory in songs; told gently, she cries", /Zakon, który pilnował twierdzy/.test(ori.text) && /Melia płacze/.test(ori.text) && (await step("W3")) === "active:3" && (await J("TownQuests.state().flags.w3Told")) === "gentle", ori.text.slice(0, 200));
    await t.saveTo(9);
    const fb = await talk(reg(2), ["Tylko Borgarowi", "Bywaj"]);
    await t.setDay(12, 23.5);
    await t.frames(10);
    const bo = await talk(reg(2), ["Bywaj"]);
    t.check("ch. 8 b: only for Borgar, after closing - the whole song (six verses), Borgar: 'Babka śpiewała mi to do snu' - done (w3Borgar, the shortcut)",
        /Tylko Borgarowi/.test(fb.text) && (bo.text.match(/♪/g) || []).length === 12 && /Babka śpiewała mi to do snu/.test(bo.text) && (await step("W3")).startsWith("done") && (await J("TownQuests.state().flags.w3Shortcut")) && (await J("TavernLife.lib.inspiredXp()")) >= 0.15, bo.text.slice(-300));
    // a: at the Kupała bonfire
    await t.loadFrom(9, { quiet: true });
    await t.setDay(12, 15); await t.frames(10);
    const fk = await talk(reg(2), ["Przy wszystkich", "Bywaj"]);
    const kd = await J("TownQuests.rec('W3').t.kupala");
    t.check("(a load) ch. 8 a: at the Kupała bonfire - day " + kd + " (the 14th of summer), by the south gate", kd === 42 && /Dzień 42/.test(fk.text) && (await step("W3")) === "active:4", fk.text.slice(0, 200));
    await t.go(8, 24, 53, 8);
    await at(42, 20.5, 40);
    const mel = await J("(function(){ const e = $gameMap.event(959); return e && e.page() ? [e.x, e.y, e.characterName(), e.event().note] : null; })()");
    await t.shot(path.join(SHOTS, "w3_noc_kupaly.png"));
    const op0 = await J("TownQuests.opinion()");
    const ku = await talk("$gameMap.event(959)", [], { place: false });
    await t.until("TownQuests.rec('W3').step === 5 && !!TownQuests.rec('W3').t.defend", 10, 100);
    const band = await J("(function(){ const b = window.Humans && Humans.band('w3Kupala'); const m = b ? (b.members || b) : []; return { n: m.length, kinds: m.map(h => h._kind) }; })()");
    t.check("...Kupała night: Melia by the bonfire (event 959, her sheet and bust), the whole town hears the song (six verses) - then men in hoods come for her: a real fight (Humans.js, two bandits)",
        mel && mel[2] === "$Npc_Melia" && /Bust:People2_8/.test(mel[3]) && (ku.text.match(/♪/g) || []).length === 12 && (await step("W3")) === "active:5" && band.n === 2, { mel, band });
    await t.eval("Humans.clear('w3Kupala'); Tawerna.emit('humansDone', { tag: 'w3Kupala', killed: 0, spared: 0, robbed: 0, fled: 2 }); 0");
    await t.frames(30);
    t.check("...the band beaten: done - opinion +13 (+10 the song, +3 the defence), Melia's trust +15",
        (await step("W3")).startsWith("done") && (await J("TownQuests.opinion()")) === op0 + 13 && (await J("TownQuests.state().flags.w3Sung && TownQuests.state().flags.w3Defended")), { op: await J("TownQuests.opinion()"), op0 });
    // c: the words burnt
    await t.loadFrom(9, { quiet: true });
    const bu = await talk(reg(2), ["Spal słowa", "Bywaj"]);
    t.check("(a load) ch. 8 c: the words burnt - done, Melia's Natchniony weaker for good", /Kartki zwijają się w płomieniu/.test(bu.text) && (await step("W3")).startsWith("done") && (await J("TavernLife.lib.inspiredXp()")) < 0.1, bu.text.slice(-200));
});
