// The tavern's regulars as people to talk to (TavernLife_Regulars.js, 2026-10-06) and the quests that waited for them (TownQuests):
// Melia, Dziadek Ozzy and Grum (Map001 events 2-4) answer with a talk of their own - the quests first, then a greeting and a menu
// (what is new, rumours, their own topics, a farewell), each in a voice of their own; trust ("Zaufanie") grows from a talk a day, a
// beer for Ozzy (his "vision": tomorrow's weather from the plan), a song, a game - and the quests; deeper topics wait for it.
// K22 "Struna dla Melii" (sinews -> Ignac twists a string in an hour -> Melia before 18:00: a new verse, 15 G, Natchniony),
// K33 "Czapka Ozzy'ego" (the cap on the left statue of the knights' garden, knocked off with the sling through the gate's grate, picked
// up through the bars), K27 Melia's way (she sings for Ela under the wall - the stage is empty that evening), W8 rozdz. 1 (after a win
// over Grum at arm-wrestling and at dice: Grum asks about the mountains). Port: CDP_PORT=9463.
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "tawerna_zycie");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    const J = e => t.json(e);
    const flat = r => { r.text = r.text.replace(/\s+/g, " "); return r; };
    const step = async id => { const r = await J(`TownQuests.rec(${JSON.stringify(id)})`); return r ? r.s + ":" + r.step : "none"; };
    const at = async (day, hour, frames) => { await t.setDay(day, hour); await t.calm(); await t.frames(frames || 12); };
    const talk = async (ev, picks, o) => { const r = await t.talkTo(ev, picks || [], Object.assign({ secs: 25 }, o || {})); if (!r.done) await t.finish(); return flat(r); };
    const reg = n => `$gameMap.event(${n})`;   // (Map001: Melia 2, Grum 3, Ozzy 4)
    const res = key => `TownLife.eventOf(${JSON.stringify(key)})`;
    const trust = role => J(`TavernLife.trust(${JSON.stringify(role)})`);

    // ------------------------------------------------------------------ the talkers
    await t.newGame({ map: 1, x: 74, y: 31, dir: 8, hour: 12, day: 3, quiet: true, minimap: false });
    await t.frames(30);
    const roles = await J("({ m: TavernLife.regularOf($gameMap.event(2)), g: TavernLife.regularOf($gameMap.event(3)), o: TavernLife.regularOf($gameMap.event(4)), b: TavernLife.regularOf($gameMap.event(1)), stub: $gameMap.event(2).list()[0].parameters[0] })");
    t.check("Melia, Grum and Ozzy (events 2-4) are the regulars, Borgar is not; their action runs TavernLife.regular", roles.m === "melia" && roles.g === "grum" && roles.o === "ozzy" && !roles.b && /TavernLife\.regular/.test(roles.stub), roles);
    t.check("Melia has an offer for the hero: a yellow '!' over her (K22)", (await J("TownQuests.markers().melia")) === "new");

    // K22's offer first, then her menu (the quests speak first)
    const k22 = await talk(reg(2), ["Zdobędę ścięgna", "Co słychać", "Jakieś plotki", "Bywaj"]);
    const menu = k22.choices[1] || [];
    t.check("K22: Melia speaks of the broken string (in her bust's bubbles), the hero takes it; then her menu: Co słychać? / Jakieś plotki? / pieśni / Bywaj",
        /Pękła mi struna/.test(k22.text) && k22.log.filter(l => l.who === 2).every(l => l.bust) && (await step("K22")) === "active:0" &&
        menu.join("|") === "Co słychać?|Jakieś plotki?|Opowiedz o swoich pieśniach.|Bywaj." && !k22.missing.length, { menu, missing: k22.missing, text: k22.text.slice(0, 160) });
    t.check("...'Co słychać?' at noon: her own line for the day; a rumour (W1 not begun: Kuba's water); the farewell",
        /Popołudnie to najgorsza|Przepisuję stare słowa|kurz tańczy/.test(k22.text) && /Kuba Woziwoda nosi wodę/.test(k22.text) && /Niech ci droga śpiewa|Wracaj wieczorem|nie zapomnij/.test(k22.text), k22.text.slice(-400));
    t.check("...the first talk of the day: trust +1 (and only once a day)", (await trust("melia")) === 1);
    const again = await talk(reg(2), ["Jakieś plotki", "Bywaj"]);
    t.check("a second talk the same day: no new greeting ('Coś jeszcze' style), the next rumour, trust stays 1",
        /Coś jeszcze|Słucham|Pieśń poczeka/.test(again.text) && !/Kuba Woziwoda nosi wodę/.test(again.text) && (await trust("melia")) === 1, again.text.slice(0, 240));

    // Grum: terse; the game topic opens the arm-wrestling's stakes
    await t.locate(95, 33, 8);
    const grum = await talk(reg(3), ["Zagrajmy", "Siłujmy", "Nie teraz"]);
    t.check("Grum: few words ('Hm.' / 'Czego?'), 'Zagrajmy w coś' -> arm-wrestling or dice -> his stakes (5 / 10 / 20 G)",
        /^(Hm\.|Czego\?)/.test(grum.log[0] && grum.log[0].t) && (grum.choices[1] || []).join("|").startsWith("Siłujmy się.|W kości") && (grum.choices[2] || []).join("|") === "Stawka 5 G|Stawka 10 G|Stawka 20 G|Nie teraz", grum.choices);

    // Ozzy: a beer and his vision (tomorrow's weather from Survival's plan); asleep at night
    await t.locate(46, 41, 8);
    await t.gold(20);
    const plan = await J("(function(){ const p = Survival.weatherPlan($gameSystem.dayNightDay() + 1); return p ? (p.storm ? 'burza' : p.type === 'snow' ? 'śnieg' : 'padać') : 'sucho'; })()");
    const oz = await talk(reg(4), ["Postaw mu piwo", "Postaw mu piwo", "Bywaj"]);
    t.check("Ozzy: a beer (3 G) - '*glug, glug*' and a vision: tomorrow's weather as the plan has it (" + plan + "); trust +1 (talk) +2 (beer)",
        /glug/.test(oz.text) && new RegExp("Jutro.*" + plan).test(oz.text) && (await t.gold()) === 14 && (await trust("ozzy")) === 3, { text: oz.text.slice(0, 400), gold: await t.gold() });
    t.check("...a second beer the same day: no second vision ('Wizje mam jedną na dzień')", /Wizje mam jedną na dzień/.test(oz.text));
    await at(3, 1.5, 10);
    const sleepy = await talk(reg(4), []);
    t.check("at night Ozzy sleeps on the bench: a mumble, no menu", sleepy.choices.length === 0 && sleepy.log.length === 1 && /Chrrr|mruczy|cegła|Ława/.test(sleepy.text), sleepy.text);
    await at(3, 12, 10);
    await t.eval("TavernLife.addTrust('melia', 40, 'test'); 0");
    await t.locate(74, 31, 8);
    const deep = await talk(reg(2), ["Skąd znasz", "Bywaj"]);
    t.check("trust 41 (Kompan): Melia's menu opens 'Skąd znasz te ballady?' - she does not know; at 60+ she tells her dream",
        (deep.choices[0] || []).includes("Skąd znasz te ballady?") && /Nie wiem\. Naprawdę/.test(deep.text) && !/kamienna sala/.test(deep.text), deep.choices);
    const jr = await J("(function(){ const it = TownQuests.journalItems().find(x => x.info === 'regulars'); return it ? { right: it.right, ops: TownQuests.journalOps(it).map(o => o.text || '').join(' | ') } : null; })()");
    t.check("the journal (Miasteczko): 'Stali bywalcy tawerny' - each one's trust and what it opens next", jr && /Melia 41/.test(jr.right) && /Kompan/.test(jr.ops) && /Przy 60/.test(jr.ops), jr);

    // ------------------------------------------------------------------ K22: the string
    await t.give(163, 2);
    await t.go(8, 16, 46, 8);
    await at(3, 13, 30);
    const ig1 = await talk(res("garbarz"), []);
    const ig2 = await talk(res("garbarz"), []);
    t.check("K22: two sinews to Ignac at the tannery - 'Daj mi godzinę'; asked again at once: 'Jeszcze schnie'",
        /Daj mi godzinę/.test(ig1.text) && /Jeszcze schnie/.test(ig2.text) && (await t.count(163)) === 0 && (await step("K22")) === "active:1", { a: ig1.text.slice(0, 120), b: ig2.text.slice(0, 80) });
    await at(3, 14.2, 20);
    const ig3 = await talk(res("garbarz"), []);
    t.check("...an hour later: the string ('śpiewa, aż ucho boli')", /śpiewa, aż ucho boli/.test(ig3.text) && (await J("TownQuests.vcount('struna')")) === 1 && (await step("K22")) === "active:2", ig3.text.slice(0, 120));
    await t.go(1, 74, 31, 8);
    await at(3, 15, 20);
    const g22 = await t.gold();
    const mel = await talk(reg(2), ["Bywaj"]);
    const k22s = await J("({ v: TownQuests.hasVerse('struna'), buff: $gameSystem.hasBuff('inspired'), note: (Journal.data().notes.find(n => n.title === 'Siódma ballada') || {}).text || '' })");
    t.check("...to Melia before 18:00: she strings it and sings a verse nobody heard (♪ 'Na Kruczych Skałach...'), +15 G, Natchniony, trust +15, the journal's 'Siódma ballada'",
        /♪ Na Kruczych Skałach/.test(mel.text) && (await step("K22")) === "done:2" && (await t.gold()) === g22 + 15 && k22s.v && k22s.buff && (await trust("melia")) >= 56 && /Na Kruczych Skałach/.test(k22s.note), { text: mel.text.slice(0, 300), k22s });

    // ------------------------------------------------------------------ K33: Ozzy's cap
    await at(3, 18, 10);
    await t.locate(46, 41, 8);
    const k33 = await talk(reg(4), ["Przyniosę ci czapkę", "Bywaj"]);
    t.check("K33: at evening Ozzy's cap 'leży na głowie rycerza, tego bez nosa' - the hero will bring it", /[Tt]ego bez nosa/.test(k33.text) && (await step("K33")) === "active:0", k33.text.slice(0, 200));
    await t.go(8, 6, 18, 8);
    await at(4, 11, 20);
    await t.give(125, 1);
    await t.give(64, 10);
    await t.eval("$gameSystem.setStamina && $gameSystem.setStamina(100); 0");
    await t.locate(5, 17, 8);
    await t.frames(70);
    const cap0 = await J("(function(){ const st = TownQuests.capState(), spr = SceneManager._scene._spriteset._characterSprites.find(s => s._character === $gameMap.event(st.statue)); return { st, cap: !!(spr && spr._tqCap && spr._tqCap.visible), y: spr && spr._tqCap ? spr._tqCap.y : null, scroll: +($gamePlayer._realY - $gameMap._displayY).toFixed(2) }; })()");
    t.check("the cap sits on the left statue's head (a picture on event 43); standing at the gate facing in, the view eases up over the wall",
        cap0.st.step === 0 && cap0.st.statue === 43 && cap0.cap && cap0.y < -120 && cap0.scroll > 10, cap0);
    await t.shot(path.join(SHOTS, "k33_czapka_na_posagu.png"));
    await t.locate(6, 17, 8);
    await t.frames(30);
    await t.eval("Hunting.resetCooldown(); Hunting.shoot([0, -1], 'sling'); 0");
    await t.frames(90);
    t.check("a stone through the grate, but not in line with the statue (from 6,17): a miss, the cap stays", (await step("K33")) === "active:0");
    await t.locate(5, 17, 8);
    await t.frames(30);
    await t.eval("Hunting.resetCooldown(); Hunting.shoot([0, -1], 'sling'); 0");
    await t.until("TownQuests.rec('K33').step === 1", 10, 100);
    await t.frames(60);
    t.check("...in line with the left statue (from 5,17): the stone stops at the grate, but the cap falls - 'Trafiony!', it lands just behind the bars",
        (await step("K33")) === "active:1" && (await J("SpeechBubbles.log.join('|')")).includes("Trafiony!"));
    const pick = await talk("$gameMap.event(39)", [], { place: false });
    t.check("...O at the locked gate: the hero reaches through the bars and has it", /sięgasz ręką między pręty/.test(pick.text) && (await J("TownQuests.vcount('czapka')")) === 1 && (await step("K33")) === "active:2", pick.text.slice(0, 120));
    await t.go(1, 46, 41, 8);
    await at(4, 19, 20);
    const beer0 = await t.count(81);
    const oz2 = await talk(reg(4), ["Bywaj"]);
    t.check("...back to Ozzy: 'Mówiłem!' - and for a moment he looks sober; a beer for the hero, trust +10, the note",
        /Mówiłem\? Mówiłem!/.test(oz2.text) && (await step("K33")) === "done:2" && (await t.count(81)) === beer0 + 1 && (await trust("ozzy")) >= 13 &&
        (await J("Journal.data().notes.some(n => n.title === \"Czapka Ozzy'ego\")")), oz2.text.slice(0, 200));

    // ------------------------------------------------------------------ K27, Melia's way
    await t.go(8, 31, 52, 8);
    await at(5, 18, 40);
    await talk(res("ludmila"), ["Wystrugam"]);
    t.check("K27: Ludmiła asks for a toy horse for Ela (the step's text names Melia's way too)", (await step("K27")) === "active:0" && /poproś Melię/.test(await J("TownQuests.Q.K27.steps[0].text")));
    await t.go(1, 74, 31, 8);
    await at(5, 18.5, 20);
    const k27 = await talk(reg(2), ["Zaśpiewasz Eli", "Bywaj"]);
    const away = await J("({ flag: TownQuests.state().flags.k27Melia, song: TavernLife.song(0) })");
    t.check("...Melia's own topic 'Zaśpiewasz Eli kołysankę pod murem?': she goes - and that evening there is no song in the tavern",
        /Dziecku, które nie śpi/.test(k27.text) && away.flag === 5 && away.song === false, { away, text: k27.text.slice(0, 160) });
    await t.go(8, 31, 52, 8);
    await at(6, 9, 40);
    const lu = await talk(res("ludmila"), []);
    t.check("...the next morning Ludmiła: Ela slept the whole night - K27 done, Melia's trust +5", /przespała całą noc/.test(lu.text) && (await step("K27")).startsWith("done"), lu.text.slice(0, 160));

    // ------------------------------------------------------------------ W8 rozdz. 1: Grum asks about the mountains
    await t.go(1, 95, 33, 8);
    await at(6, 19, 20);
    t.check("W8 waits until the hero beats Grum at arm-wrestling and at dice", (await step("W8")) === "none");
    await t.eval("TavernLife.state().arm.won = 1; Tawerna.state('dice').vs = { grum: { games: 1, wins: 1, losses: 0, day: 0, lostToday: 0, given: false } }; TownQuests.autoChecks(); 0");
    t.check("...after both: the arc 'Żelazna Pięść' begins", (await step("W8")) === "active:0");
    const w8 = await talk(reg(3), ["A po co ci to", "Bywaj"]);
    t.check("...Grum: 'Dwa razy to nie przypadek' - he asks about the mountains, the hero asks why: someone from the continent pays him; next: chapter 2 - he hires the hero as a guide (since 2026-10-06 - w8_mountains_test)",
        /Dwa razy to nie przypadek/.test(w8.text) && /Płacą mi\. Ktoś z kontynentu/.test(w8.text) && (await step("W8")) === "active:1" &&
        (await J("TownQuests.Q.W8.steps[1].talk")) === "w8Hire" && (await J("Journal.data().notes.some(n => n.title === 'Grum pyta o góry')")), w8.text.slice(0, 240));
    t.check("the drought: none of the regulars' quests gives water", (await J(`(function(){ const W = [129, 138, 166, 167], bad = []; for (const id of ["K22", "K33", "D13", "D6", "W3", "W8"]) { const q = TownQuests.Q[id], rw = [q.reward];
        for (const s of q.steps) { rw.push(s.reward); for (const o of (s.choice || {}).options || []) rw.push(o.reward); } for (const r of rw) for (const it of (r && r.items) || []) if (W.includes(it[0])) bad.push(id); } return bad; })()`)).length === 0);
});
