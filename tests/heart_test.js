// The Heart's chamber (floor 100, Map011) after v2.1 of Underground.js (docs/PODZIEMIA.md "Piętro 100"):
//   - Underground.world(): what the endings read - Story (the debt), TownQuests (Opinia, the flags of W1-W9, W6's people), TownLife
//     (who is gone), Act III (Act3.outcome(), else the flags act3Held / act3Costly / act3Fallen); F9 / tests lay a world over it
//   - the Lord at the Heart (W7 ch. 7): absent (no scene), ally (let him ask - "Tak. I nie."), rival (refuse - his guard will not go
//     near the light, the Lord recoils with Borgar's saying), ask for him and what to tell him (the truth / mercy / silence)
//   - the four endings as scenes: the chamber (who came down: Borgar, Ambroży), the black card, the scenes up above (the manor, the
//     market, the camp - in town or outside in Podgrodzie -, grandpa's house, the tavern) by different worlds, the epilogue, KONIEC,
//     the game goes on in the tavern (the hero visible, the town's people back); the chamber keeps the ending (shards, empty, the
//     guardian on the bench); no autosave in the middle of a scene
//   - F9: "Serce: zakończenie / świat / Lord" rows, OK plays the ending with that world (the hero's own watch here)
// Shots: docs/podziemia/serce_*.png, the GIF serce_zniszczenie.gif.
const path = require("path");
const fs = require("fs");
const kit = require("./lib/kit.js");
const SHOTS = path.join(__dirname, "..", "docs", "podziemia");
const FRAMES = path.join(__dirname, "..", "tools", "underground", "staging", "heart_gif");

kit.test({ bootCheck: "the game boots", errorCheck: "no errors in the console" }, async t => {
    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, hour: 12 });
    await t.eval(`(function(){ const s = Story.state(); s.paid = s.debt; s.done = 1; Underground.film.setSpeed(0.3); return 0; })()`);
    const LORD_FLAGS = ["lordAlly", "lordTruth", "w1Revealed", "lordCold", "feliksPays"];
    // the chamber from the start: no ending, no Lord's scene, the given quest flags, the key and the bell's locks open
    const reset = flags => t.eval(`(function(){ const s = Underground.state(); s.ending = null; s.lord = null; s.forceWorld = null; s.forceLord = null;
        const f = TownQuests.state().flags; for (const k of ${JSON.stringify(LORD_FLAGS)}) delete f[k]; Object.assign(f, ${JSON.stringify(flags || {})});
        Underground.forceLock("all", true); s.locks = { key: true, signal: true }; return 0; })()`);
    const toHeart = async () => {
        for (let i = 0; i < 4; i++) {   // (after an ending the day's summary opens by itself once the map is calm: closed first)
            await t.dismiss();
            await t.frames(30);
            await t.dismiss();
            if (await t.go(11, 15, 8, 8, { timeout: 20 })) break;
        }
        await t.quiet();
        await t.frames(10);
        return t.eval(`$gameMap.events().find(e => e.event().name === "Serce Twierdzy").eventId()`);
    };
    // the talk driver, holding the message whose text matches a pattern (a screenshot then)
    await t.eval(kit.DRIVER + "; 0");
    await t.eval(`(function(){ if (window.__holdHook) return 0; window.__holdHook = true; window.__holdRe = [];
        const _s = Window_Message.prototype.startMessage;
        Window_Message.prototype.startMessage = function() { _s.call(this); const T = window.__drv, txt = $gameMessage.allText();
            const i = window.__holdRe.findIndex(r => new RegExp(r).test(txt)); if (i >= 0) { window.__holdHook = window.__holdRe.splice(i, 1)[0]; T.holdAt = T.log.length; } };
        return 0; })()`);
    // plays a scene to its end: start (an event id to start, or null - it starts by itself), picks (choices by prefix), holds
    // ([pattern, file]: a screenshot at that line; file null = only hold); gif: [pattern, frames] - frames of a GIF from that line on
    async function play(start, picks, holds, o = {}) {
        const files = {};
        for (const [re, file] of holds || []) files[re] = file;
        await t.eval(`(function(){ const T = window.__drv; T.on = true; T.picks = ${JSON.stringify(picks)}; T.waiting = null; T.mark = T.log.length; T.cmark = T.choices.length;
            T.missing = []; T.holdAt = -1; window.__holdRe = ${JSON.stringify(Object.keys(files))}; ${start ? "$gameMap.event(" + start + ").start();" : ""} return 0; })()`);
        const t0 = Date.now(), done = [];
        let ok = false;
        while (Date.now() - t0 < (o.secs || 420) * 1000) {
            const st = await t.json(`({ hold: window.__drv.holdAt, re: window.__holdHook, run: $gameMap.isEventRunning(), busy: $gameMessage.isBusy(),
                map: SceneManager._scene instanceof Scene_Map && SceneManager._scene._started && !SceneManager.isSceneChanging() && !$gamePlayer.isTransferring() ? $gameMap.mapId() : 0 })`);
            if (st.hold >= 0) {
                await t.frames(o.holdFrames || 26);
                const file = files[st.re];
                if (file) { await t.shot(path.join(SHOTS, file)); done.push(file); }
                if (o.gif && st.re === o.gif[0]) {   // (the frames of the GIF while the scene goes on; a line held meanwhile waits for the next round)
                    await t.eval("window.__drv.holdAt = -1; window.__holdHook = null; 0");
                    fs.mkdirSync(FRAMES, { recursive: true });
                    for (let i = 0; i < o.gif[1]; i++) { await t.shot(path.join(FRAMES, "f" + String(i).padStart(3, "0") + ".png")); await t.frames(4); }
                    continue;
                }
                await t.eval("window.__drv.holdAt = -1; 0");
            }
            if (!st.run && !st.busy && st.map && Date.now() - t0 > 2500 && (!o.endMap || st.map === o.endMap)) { ok = true; break; }
            await t.wait(120);
        }
        const out = await t.json(`({ log: window.__drv.log.slice(window.__drv.mark), choices: window.__drv.choices.slice(window.__drv.cmark), missing: window.__drv.missing })`);
        await t.eval("window.__drv.on = false; window.__holdRe = []; 0");
        out.ok = ok;
        out.text = out.log.map(l => l.t.replace(/\n/g, " ")).join(" / ");
        out.shots = done;
        out.maps = [...new Set(out.log.map(l => l.map))];
        return out;
    }
    const has = (o, re) => re.test(o.text);

    // =========================================================================================================== the world
    await reset({ grumDead: 3, rafalSmuggled: 4, campOutside: 5, marekSaved: 6, sluiceHalf: 7, w3Burned: 8, borgarSaying: 2, signalBook: 2, act3Costly: 9 });
    const realAct3 = await t.eval("!!Tawerna.api('Act3')");
    const w0 = await t.json("Underground.world()");
    t.check("world(): the quests' flags as the endings read them - Grum dead, Rafał over the sea, the camp outside, Marek saved, the water under the market, Melia's words burnt, Borgar's saying, the Book of Signals; a story game, the debt paid; the Lord absent (nothing told him)",
        w0.grum === "dead" && w0.rafal === "gone" && w0.camp === "outside" && w0.marek && w0.water && w0.melia === "burned" && w0.borgar && w0.book &&
        w0.story && w0.debtPaid && w0.lord.stance === "absent" && w0.butler === "feliks", w0);
    if (!realAct3) {
        t.check("...Act III without its plugin: the flag act3Costly is the siege's outcome", w0.siege && w0.siege.result === "costly", w0.siege);
        await t.eval(`window.Act3 = { outcome: () => ({ result: "held", defenders: ["borgar", "grum", "tadek"], lost: ["tadek"], grum: "ally", damage: 20 }) }; 0`);
        const w1 = await t.json("Underground.world()");
        delete w1.lordFlags;
        t.check("...with Act3.outcome(): the siege held, the defenders' names in Polish ('Borgar, Grum i Tadek'), Grum by the siege an ally (over the flag)",
            w1.siege && w1.siege.result === "held" && w1.siege.names.defenders === "Borgar, Grum i Tadek" && w1.siege.names.lost === "Tadek" && w1.grum === "ally", w1.siege);
        await t.eval("delete window.Act3; 0");
    } else {
        const w1 = await t.json("({ w: Underground.world(), o: Act3.outcome() })");
        t.check("...Act III is there: the siege as Act3.outcome() says (null before the siege: the flags)", w1.o ? w1.w.siege && w1.w.siege.result === w1.o.result : true, w1);
    }
    const st0 = await t.json(`(function(){ const f = TownQuests.state().flags, out = {}; out.none = Underground.world().lord.stance;
        f.lordAlly = 1; out.ally = Underground.world().lord.stance; delete f.lordAlly;
        f.w1Revealed = 1; out.rival = Underground.world().lord.stance; f.lordTruth = 1; out.truth = Underground.world().lord.stance; delete f.w1Revealed; delete f.lordTruth;
        const s = Story.state(), paid = s.paid; s.paid = 0; s.done = 0; f.lordAlly = 1; out.unpaid = Underground.world().lord.stance; s.paid = paid; s.done = 1; delete f.lordAlly;
        return out; })()`);
    t.check("the Lord's stance: none told - absent; W1 b (lordAlly) - ally; W1 a (shamed at the market) - rival, unless his truth was told (ally); the debt not paid - absent",
        st0.none === "absent" && st0.ally === "ally" && st0.rival === "rival" && st0.truth === "ally" && st0.unpaid === "absent", st0);

    // =========================================================================================================== the Lord at the Heart
    // absent: the Heart's look and the choice at once
    await reset({});
    let heart = await toHeart();
    const ab = await play(heart, ["Jeszcze nie"], []);
    t.check("Lord absent: no scene - the Heart's look and the choice of Act III at once ('Jeszcze nie' leaves it)",
        ab.ok && !has(ab, /Kazimierz|Zaleski/) && /Serce Twierdzy/.test(ab.log[0] ? ab.log[0].t : "") && ab.choices[0] && ab.choices[0].length === 5, ab.text.slice(0, 300));

    // ally: let him ask
    await reset({ lordAlly: 5 });
    heart = await toHeart();
    const al = await play(heart, ["Pozwól", "Jeszcze nie"], [["Kazimierz, popłynął", "serce_lord_sojusznik.png"], ["^Tak. I nie", "serce_lord_odpowiedz.png"]]);
    const alSt = await t.json(`({ lord: Underground.state().lord, img: $gameMap.event(800).characterName(), cinema: Underground.film.cinema })`);
    const lordLines = al.log.filter(l => l.who === 800);
    t.check("Lord an ally (W1 b): he comes down after the hero, wants one question (his son Kazimierz); the choice let him / refuse / ask for him",
        al.ok && has(al, /Szedłem za tobą od dziewięćdziesiątego/) && has(al, /Kazimierz/) && al.choices[0] && al.choices[0].join("|") === "Pozwól mu zapytać.|Nie. To za dużo dla każdego.|Zapytam za ciebie.", al.choices[0]);
    t.check("...let him ask: 'Tak. I nie.' - he called his son a coward once; the Heart says more, the hero pulls him away; he thanks, goes (gone from the chamber); then the Heart's own choice; the Lord's lines with his bust",
        has(al, /Tak\. I nie\./) && has(al, /nazwałem go tchórzem/) && has(al, /Odciągasz Lorda od światła/) && has(al, /czemu zakon dawał tylko jedno/) &&
        has(al, /Co zrobić z Sercem\?/) && alSt.lord && alSt.lord.stance === "ally" && alSt.lord.choice === "allow" && alSt.img === "" && !alSt.cinema && lordLines.length >= 8 && lordLines.every(l => l.bust),
        { lord: alSt, n: lordLines.length });
    const again = await play(heart, ["Jeszcze nie"], []);
    t.check("...talking to the Heart again: the Lord does not come a second time", again.ok && !has(again, /Kazimierz/), again.text.slice(0, 120));

    // rival: refuse him
    await reset({ w1Revealed: 5, lordCold: 5 });
    heart = await toHeart();
    const rv = await play(heart, ["Nie.", "Jeszcze nie"], [["Mówiłem: najpierw", "serce_lord_rywal.png"], ["swoją matkę", "serce_lord_straznik.png"]]);
    const rvSt = await t.json("Underground.state().lord");
    t.check("Lord a rival (W1 a - shamed at the market): with his guard, 'Mówiłem: najpierw do mnie', 'Zrobiłeś ze mnie głupca na rynku'; the choice 'Nie. Stań mu na drodze.'",
        rv.ok && has(rv, /Mówiłem: najpierw do mnie/) && has(rv, /głupca na rynku/) && rv.choices[0] && rv.choices[0][1] === "Nie. Stań mu na drodze.", rv.choices[0]);
    t.check("...refused: the guard sees his dead mother in the light and will not go near; the Lord steps up, recoils - 'Nie pytam o to, czego nie chcę wiedzieć.' (Borgar's saying) - and goes",
        has(rv, /widzę swoją matkę/) && has(rv, /Nie pytam o to, czego nie chcę wiedzieć/) && has(rv, /To powiedzenie Borgara/) && rvSt && rvSt.stance === "rival" && rvSt.choice === "refuse", rvSt);

    // ask for him - and tell him a mercy
    await reset({ lordTruth: 5 });
    heart = await toHeart();
    const af = await play(heart, ["Zapytam", "Powiedz: „Nie", "Jeszcze nie"], []);
    const afSt = await t.json("Underground.state().lord");
    t.check("Lord an ally by his truth told (W9 ch. 6); ask for him: the hero knows the answer, then chooses what to tell (the truth / 'Nie przez ciebie' / nothing) - mercy: 'Połowa prawdy'",
        af.ok && has(af, /Czy syn Lorda zginął przez niego/) && has(af, /I\? Co powiedziało\?/) && af.choices[1] && af.choices[1].length === 3 &&
        has(af, /Odważny\.\.\. tak/) && has(af, /Połowa prawdy/) && afSt && afSt.choice === "askFor" && afSt.told === "mercy", { st: afSt, ch: af.choices });

    // =========================================================================================================== the endings
    // 1) destroy - a good world (three locks, Opinia 75, Grum and Rafał on the hero's side, Marek back, the tavern held), the Lord let ask
    await reset({ lordAlly: 5 });
    await t.eval(`Underground.forceWorld(Underground_Data.HEART.DEBUG.worlds.find(w => w.key === "dobry").world); 0`);
    heart = await toHeart();
    const e1 = await play(heart, ["Pozwól", "Zniszczyć", "Tak", "Wrócić"], [
        ["Bierzesz zamach", null], ["^Cisza\\. Pierwszy raz od stu", "serce_zniszczone_cisza.png"], ["Posadziłem w ogrodzie", "serce_koniec_dwor.png"],
        ["^Marek siedzi", "serce_koniec_oboz_marek.png"], ["^Wnusiu", "serce_koniec_dom.png"], ["^Pusto\\. Pierwszy raz", "serce_koniec_tawerna.png"],
        ["KONIEC - Serce zniszczone", "serce_koniec_napis.png"]], { gif: ["Bierzesz zamach", 34], endMap: 1 });
    await t.dismiss();
    const e1St = await t.json(`({ ending: Underground.state().ending, map: $gameMap.mapId(), at: [$gamePlayer.x, $gamePlayer.y], tr: $gamePlayer.isTransparent(), cinema: Underground.film.cinema,
        borgar: !!$gameMap.event(1) && !$gameMap.event(1)._erased, mine: $gameMap.events().filter(e => e.eventId() >= 800 && e.eventId() <= 827).length })`);
    t.check("destroy: Borgar and Ambroży come down (W4 / W2), the blow, everything at once, silence; the black card (the ending's words); then up above: the manor (the Lord planted an apple tree), the market (water rations, 'To ten, co zszedł na sam dół!'), the camp (Marek speaks again, Rafał stays), grandpa ('ktoś puka'), the tavern (Ozzy's empty head, Grum stays, the siege held: the defenders' names on the beam)",
        e1.ok && has(e1, /Nie puszczę cię samego/) && has(e1, /Bierzesz zamach/) && has(e1, /cisza w głowie/) && has(e1, /Światło pęka jak lód/) &&
        has(e1, /jabłoń/) && has(e1, /Racje z cysterny/) && has(e1, /To ten, co zszedł na sam dół/) && has(e1, /\.\.\.Ela\.|Tato! Powiedziałeś/) && has(e1, /Zostaję - ktoś musi pilnować obozu/) &&
        has(e1, /nikt już nie zapuka/) && has(e1, /Pusto\. Pierwszy raz/) && has(e1, /nikt już nie dostanie pewności/) && has(e1, /nowe okucia/) && has(e1, /Borgar, Grum, Tadek i Rafał/),
        { maps: e1.maps, missing: e1.missing });
    t.check("...the epilogue (three locks, Opinia high, the water), 'KONIEC - Serce zniszczone', 'Wrócić do gry': the hero at the bar of the tavern, seen; the scenes' cast gone, the tavern's own people back; the ending kept with its world",
        has(e1, /Trzy zamki otworzyły się/) && has(e1, /mówią o tobie dobrze/) && has(e1, /KONIEC - Serce zniszczone/) && e1St.map === 1 && e1St.at.join() === "52,31" && !e1St.tr && !e1St.cinema &&
        e1St.borgar && e1St.mine === 0 && e1St.ending && e1St.ending.kind === "zniszczyc" && e1St.ending.world && e1St.ending.world.shots.join() === "dwor,rynek,oboz,dom,tawerna" &&
        e1.maps.join() === "11,24,8,19,1", { st: Object.assign({}, e1St, { ending: e1St.ending && { kind: e1St.ending.kind, shots: e1St.ending.world && e1St.ending.world.shots } }), maps: e1.maps });
    heart = await toHeart();
    const shards = await t.json(`$gameMap.events().find(e => e.event().name === "Serce Twierdzy (blask)").tileId()`);
    t.check("...back in the chamber: dark shards on the pedestal", shards === 544, shards);

    // 2) the guardian Borgar - a bad world (two locks, Opinia 10, Grum dead, Rafał given away, the camp outside, the tavern fallen), the Lord a rival refused
    await reset({ w1Revealed: 5, lordCold: 5 });
    await t.eval(`Underground.forceWorld(Underground_Data.HEART.DEBUG.worlds.find(w => w.key === "zly").world); 0`);
    heart = await toHeart();
    const e2 = await play(heart, ["Nie.", "Zostać", "Borgar", "Tak", "Wrócić"], [
        ["^Idź już\\. I nie oglądaj", "serce_straznik_borgar.png"], ["nie przyjmuje", "serce_koniec_dwor_zamkniety.png"],
        ["^Lulaj", "serce_koniec_podgrodzie.png"], ["^Odbudowujemy", "serce_koniec_tawerna_odbudowa.png"]], { endMap: 1 });
    await t.dismiss();
    t.check("the guardian Borgar: he follows the hero down ('od dziesiątej bramy'), takes the watch (every third night, like the order), sits on the bench; the manor shut (the rival refused), the camp in Podgrodzie (Map111) without Marek, Rafał gone to the manor's men, the market: 'Ktoś odwraca wzrok' (Opinia 10)",
        e2.ok && has(e2, /Szedłem za tobą od dziesiątej bramy/) && has(e2, /zmiana co trzy dni/) && has(e2, /Jaśnie pan nie przyjmuje/) && e2.maps.includes(111) &&
        has(e2, /Lulaj, dziecię/) && has(e2, /Rafała tu nie ma/) && has(e2, /Ktoś odwraca wzrok/), { maps: e2.maps, missing: e2.missing });
    t.check("...the tavern: Borgar off watch today, a full mug on Grum's empty table ('Za Gruma'), rebuilding after the siege fell; 'W miasteczku mało kto pyta'; 'KONIEC - Nowy strażnik'",
        has(e2, /Dziś mam wolne/) && has(e2, /Za Gruma/) && has(e2, /Odbudowujemy/) && has(e2, /mało kto pyta, gdzie byłeś/) && has(e2, /KONIEC - Nowy strażnik/), e2.text.slice(-500));
    heart = await toHeart();
    const bench = await t.json(`({ img: $gameMap.event(802).characterName(), at: [$gameMap.event(802).x, $gameMap.event(802).y] })`);
    const word = await play(802, [], []);
    t.check("...back in the chamber: Borgar sits on the bench before the Heart, a word from him when spoken to", bench.img === "$Npc_Borgar" && bench.at.join() === "12,9" && has(word, /Nie pytaj/), { bench, w: word.text });
    await t.shot(path.join(SHOTS, "serce_borgar_na_lawie.png"));

    // 3) free the truth - a mixed world (Opinia 45, Grum with the faction, Rafał over the sea, the siege costly), the Lord absent
    await reset({});
    await t.eval(`Underground.forceWorld(Underground_Data.HEART.DEBUG.worlds.find(w => w.key === "mieszany").world); 0`);
    heart = await toHeart();
    const e3 = await play(heart, ["Uwolnić", "Tak", "Wrócić"], [["^Światło idzie w górę", "serce_uwolnione.png"], ["^Stragany stoją puste", "serce_koniec_rynek_cisza.png"]], { endMap: 1 });
    await t.dismiss();
    t.check("free the truth: the light rises through the floors, the absent Lord knows everything at once ('o wodzie, o Feliksie, o sobie'), the market silent, Marek: 'czemu milczałem', Rafał's letter from over the sea, grandpa: 'nikt mi nie musiał mówić'",
        e3.ok && has(e3, /Światło idzie w górę/) && has(e3, /o wodzie, o Feliksie, o sobie/) && has(e3, /Stragany stoją puste/) && has(e3, /czemu milczałem/) &&
        has(e3, /list zza morza/) && has(e3, /nikt mi nie musiał mówić/), { maps: e3.maps, missing: e3.missing });
    t.check("...the tavern silent; Grum gone with the faction; the siege costly: 'Wypijmy za tych, co wtedy oberwali: Tadek'; 'KONIEC - Prawda dla wszystkich'",
        has(e3, /W tawernie jest cicho/) && has(e3, /popłynął z kopaczami frakcji/) && has(e3, /oberwali: Tadek/) && has(e3, /KONIEC - Prawda dla wszystkich/), e3.text.slice(-500));
    heart = await toHeart();
    const empty = await t.json(`(function(){ const e = $gameMap.events().find(e => e.event().name === "Serce Twierdzy (blask)"); return { name: e.characterName(), tile: e.tileId() }; })()`);
    t.check("...back in the chamber: the pedestal empty", empty.name === "" && empty.tile === 0, empty);

    // =========================================================================================================== F9
    await reset({});
    await t.eval("Underground.state().ending = null; 0");
    await t.eval(`(function(){ SceneManager.push(Scene_Debug); return 0; })()`);
    await t.until("SceneManager._scene instanceof Scene_Debug && SceneManager._scene._started", 10);
    await t.frames(5);
    const f9 = await t.json(`(function(){ const s = SceneManager._scene, l = s._list; s.showTab(0); const rows = l._rows.filter(r => /^heart/.test(r.kind));
        const out = { kinds: rows.map(r => r.kind), labels: [] };
        const at = k => l._rows.findIndex(r => r.kind === k);
        l.select(at("heartEnd")); l.changeQty(1); out.labels.push(l.rowData().label);
        l.select(at("heartWorld")); l.changeQty(1); out.labels.push(l.rowData().label);
        l.select(at("heartLord")); l.changeQty(1); out.labels.push(l.rowData().label);
        out.after = l._rows[at("heartEnd") - 1].kind; return out; })()`);
    t.check("F9 'Zdarzenia': after the lift's row - 'Serce: zakończenie' (←→ the six endings), 'Serce: świat' (as in the game / good / bad / mixed), 'Serce: Lord przy Sercu' (as in the game / ally / rival / absent)",
        f9.kinds.join() === "heartEnd,heartWorld,heartLord" && f9.after === "ugLifts" && /Strażnik: ja/.test(f9.labels[0]) && /świat - dobry/.test(f9.labels[1]) && /Lord przy Sercu - sojusznik/.test(f9.labels[2]), f9);
    await t.shot(path.join(SHOTS, "serce_f9.png"));
    // OK on the ending's row: to the chamber, the Lord's scene (ally), then the ending - the hero's own watch, a year later someone asks
    await t.eval(`(function(){ const s = SceneManager._scene, l = s._list; l.select(l._rows.findIndex(r => r.kind === "heartEnd")); s.onOk(); return 0; })()`);
    const f9map = await t.until(t.onMap(11), 30);
    const e4 = await play(null, ["Zapytam", "Nic nie mów", "Wrócić"], [["^\\(Siadasz na kamiennej", "serce_straznik_ja.png"], ["Sześćdziesiąt lat temu", "serce_rok_pozniej.png"],
        ["^\\.\\.\\.Wróciłeś\\. Na jeden dzień", "serce_koniec_straznik_tawerna.png"]], { endMap: 1 });
    await t.dismiss();
    const e4St = await t.json(`({ ending: Underground.state().ending && { kind: Underground.state().ending.kind, guardian: Underground.state().ending.guardian }, lord: Underground.state().lord, map: $gameMap.mapId(), tr: $gamePlayer.isTransparent() })`);
    t.check("...OK: the chamber, the Lord (ally) asked for and told nothing ('Skoro milczysz'), the hero sits on the bench, 'Mija rok', Ozzy comes down with his one question; grandpa sets a second plate; in the tavern 'Strażnik może wyjść na górę raz w roku' - and the hero is there",
        f9map && e4.ok && has(e4, /Skoro milczysz, to wiem dość/) && has(e4, /Siadasz na kamiennej ławie/) && has(e4, /Mija rok/) && has(e4, /Sześćdziesiąt lat temu wpadłem tu/) &&
        has(e4, /Stawiam drugi talerz/) && has(e4, /Strażnik może wyjść na górę raz w roku/) && has(e4, /Kufel czeka od roku/) && e4St.ending && e4St.ending.kind === "straznik" &&
        e4St.ending.guardian === "hero" && e4St.lord && e4St.lord.told === "silent" && e4St.map === 1 && !e4St.tr, { st: e4St, maps: e4.maps, missing: e4.missing });

    // no autosave while a scene plays; nothing left of it after a new game
    const auto = await t.json(`(function(){ const sc = SceneManager._scene; Underground.film.start(); const during = sc.shouldAutosave(); Underground.film.end(); return { during, after: sc.shouldAutosave() }; })()`);
    t.check("no autosave in the middle of an ending (the engine's save after a transfer waits till the game goes on)", auto.during === false && auto.after === true, auto);

    // the GIF of the blow (frames taken during the first ending) - docs/podziemia/serce_zniszczenie.gif (tools/underground/make_gif.py)
    const gif = fs.existsSync(FRAMES) && fs.readdirSync(FRAMES).filter(f => /\.png$/.test(f)).length;
    t.check("frames of the destroying blow kept for the GIF", gif >= 20, gif);
});
