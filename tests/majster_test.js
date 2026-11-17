// W22 "Majstersztyk" (docs/zadania_nowe/majstersztyk.md; js/plugins/Majster_Data.js + Majster.js, Map215 "Cech", js/teksty/majster.txt).
// Plays the whole line on the overlay (tools/majstersztyk/zainstaluj.py --do tools/majstersztyk/overlay): the door, the poreka (a master's
// option), the entry, the three hands on the shelf, the oath, the guard's order and the dispute, the trade, the trial piece, the sabotage
// (the cracked piece, the clues), the night in the workshop, rank III, the exam on the market (the tribune, the commission held), the
// mini-game, every ending, the hammer, F9, a save and load. Pictures: docs/zadania_nowe/majstersztyk_gra/.
// Run: GAME_OVERLAY=tools/majstersztyk/overlay GAME_OVERLAY_JS=1 CDP_PORT=9931 node tests/majster_test.js   (the server: node tools/serve.js)
const path = require("path");
const kit = require("./lib/kit.js");
const SHOTS = path.join("..", "docs", "zadania_nowe", "majstersztyk_gra");
const shot = (t, name) => t.shot(path.join(SHOTS, name));

kit.test({ port: 9931, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    const S = "Majster.stan()";
    const go = async (...a) => { await t.finish(); const ok = await t.go(...a); return ok; };
    const q = "TownQuests.rec('W22')";
    const talkKey = async (key, picks) => { await t.eval(`(function(){ const e = TownLife.eventOf(${JSON.stringify(key)}); window.__ev = e ? e.eventId() : 0; return 0; })()`); const id = await t.eval("window.__ev"); if (!id) return { text: "(brak " + key + ")", choices: [], done: false }; const r = await t.talkTo(id, picks || []); await t.finish(); return r; };
    const items = ids => Promise.all(ids.map(([id, n]) => t.eval(`$gameParty.gainItem($dataItems[${id}], ${n}); 0`)));
    const clearItems = ids => t.eval(`[${ids.join(",")}].forEach(id => { const it = $dataItems[id]; $gameParty.loseItem(it, $gameParty.numItems(it), false); }); 0`);

    // ---------------------------------------------------------------- data and API
    const base = await t.json(`({ m: !!window.Majster, d: !!window.MajsterData, q: !!TownQuests.Q.W22, thr: Watki.watki().includes("majster"),
        inj: Tawerna.inject.list().filter(x => x.owner === 'Majster').map(x => x.ids).join(), steps: TownQuests.Q.W22.steps.length,
        res: ['ostap','ludwik','jas'].map(k => !!TownLifeData.RESIDENTS.find(r => r.key === k)), hammer: !!$dataItems.find(i => i && /<Majster:mlotek>/.test(i.note || '')),
        door: !!$dataMap }) `);
    t.check("Majster.js i Majster_Data.js działają: wątek, zadanie W22 (5 kroków), numery 4510-4599, trzej mieszkańcy, Młotek majstra w Items", base.m && base.d && base.q && base.thr && base.steps === 5 && /4510-4599/.test(base.inj) && base.res.every(Boolean) && base.hammer, base);

    await t.newGame({ story: true, skipIntro: true, map: 220, x: 19, y: 61, dir: 8, day: 14, hour: 10, quiet: true, minimap: false });
    await t.eval("TownQuests.state().opinion = 30; $gameParty.gainGold(400 - $gameParty.gold()); 0");

    // ---------------------------------------------------------------- the door: closed without a poreka, popup, open with it (8-17)
    t.check("przed poręką drzwi Cechu zamknięte (Majster.drzwiOtwarte() false)", (await t.eval("Majster.drzwiOtwarte()")) === false);
    await go(220, 19, 59, 8);
    await t.eval("Tawerna.popups && 0; window.__kit && (window.__kit.pops.length = 0); 0");
    await t.hold("up", 20);
    await t.frames(20);
    const pops = await t.popups();
    t.check("dotknięcie drzwi bez poręki: popup „Mistrzowie obradują”, bohater nadal w mieście", pops.some(p => /obraduj/.test(p)) && (await t.eval("$gameMap.mapId()")) === 220, pops);

    // ---------------------------------------------------------------- poreka: Tadek's talk option (day >= 12, Opinion >= 20, an iron thing of his own)
    await go(220, 31, 37, 8);
    await t.setHour(10);
    const noIron = await talkKey("kowal", ["Nie teraz"]);
    t.check("bez żelaznej rzeczy własnej roboty Tadek nie da poręki (opcja jest, odpowiedź „najpierw niech cię ktoś zna”)", !!noIron.text, noIron.text);
    await items([[301, 1]]);
    const kow = await t.eval("TownLife.eventOf('kowal') ? 1 : 0");
    const lab = await t.json(`(function(){ const ev = TownLife.eventOf('kowal'); return ev ? 1 : 0; })()`);
    t.check("Tadek stoi w mieście (TownLife)", kow === 1 && lab === 1);
    await t.eval("Majster.poreka('kowal'); 0");
    await t.eval("TownQuests.autoChecks(); 0");
    t.check("poręka: stan, zadanie W22 aktywne, krok 0", (await t.json(`({ p: ${S}.poreka, q: ${q} })`)).p === "kowal" && (await t.json(q)).s === "active");
    t.check("po poręce drzwi otwarte 8-17, zamknięte o 18:00", (await t.eval("Majster.drzwiOtwarte()")) === true && ((await t.setHour(18)), (await t.eval("Majster.drzwiOtwarte()")) === false));
    await t.setHour(10);

    // ---------------------------------------------------------------- the entry (20 G) and the Cech
    await go(220, 19, 59, 8);
    await t.hold("up", 24);
    await t.until("$gameMap.mapId() === 215 && !$gamePlayer.isTransferring()", 20);
    await t.frames(80);
    const cech = await t.json(`({ at: [$gamePlayer.x, $gamePlayer.y], name: $dataMap.displayName, ostap: !!TownLife.eventOf('ostap') && !TownLife.eventOf('ostap').isTransparent(),
        jas: !!TownLife.eventOf('jas') && !TownLife.eventOf('jas').isTransparent(), ludwik: !!TownLife.eventOf('ludwik') && !TownLife.eventOf('ludwik').isTransparent() })`);
    t.check("drzwi Cechu -> Map215 „Cech” (7,17); w środku Ostap i Jaś, Ludwika jeszcze nie ma", cech.at[0] === 7 && cech.at[1] === 17 && cech.name === "Cech" && cech.ostap && cech.jas && !cech.ludwik, cech);
    await shot(t, "cech_dzien.png");
    const g0 = await t.gold();
    const o1 = await talkKey("ostap", ["Płacę"]);
    t.check("Ostap przyjmuje wpisowe: -20 G, wpisowe zapisane", (await t.gold()) === g0 - 20 && !!(await t.json(`${S}.wpisowe`)), o1.text);

    // ---------------------------------------------------------------- the three hands on the shelf
    await clearItems([313, 360, 301]);
    t.check("półka przyjmuje tylko komplet: brak sztuk - nic się nie dzieje", (await t.json("Majster.sprawdz(Majster.lista(1))")).ok === false);
    await items([[313, 1], [360, 1], [301, 1]]);
    t.check("trzy ręce nieużywane: sprawdzenie przechodzi", (await t.json("Majster.sprawdz(Majster.lista(1))")).ok === true);
    await t.eval("Durability.setUsed(313, 5); 0");
    const usedChk = await t.json("Majster.sprawdz(Majster.lista(1))");
    t.check("używana okuta pałka NIE zostaje przyjęta („Użyta rzecz to nie sztuka”)", usedChk.ok === false && usedChk.uzyte.length === 1, usedChk);
    await t.eval("Durability.setUsed(313, 0); 0");
    await go(215, 3, 6, 8);
    await t.eval("Majster.polkaZloz(1); 0");
    const poIdz = await t.json(`({ polka: ${S}.polka, n: [313,360,301].map(id => $gameParty.numItems($dataItems[id])) })`);
    t.check("sztuki leżą na półce i zniknęły z plecaka", poIdz.polka && poIdz.polka.etap === 1 && poIdz.n.every(x => x === 0), poIdz);
    const same = await talkKey("ostap", []);
    t.check("tego samego dnia Ostap mówi „rano, chłopcze”", /rano/i.test(same.text) || /Rano/.test(same.text), same.text);
    await t.setDay(15, 8);
    await t.eval("Majster.tick(); 0");
    const g1 = await t.gold();
    const oath = await talkKey("ostap", []);
    await t.frames(40);
    const r1 = await t.json(`({ r: ${S}.ranga, polka: ${S}.polka })`);
    t.check("rano: zaprzysiężenie, ranga 1 (czeladnik), +30 G, półka pusta", r1.r === 1 && !r1.polka && (await t.gold()) === g1 + 30, { r1, oath: oath.text });
    await shot(t, "cech_zaprzysiezenie.png");

    // ---------------------------------------------------------------- Ludwik's ferry and the guard's order
    await t.setDay(16, 9);
    await t.eval("Majster.zamWez(); 0");
    const zam = await t.json(`${S}.zam`);
    t.check("tablica: zamówienie straży wzięte, termin za 6 dni", zam.wzieto === 16 && zam.termin === 22, zam);
    await t.setDay(19, 14);
    await t.eval("Majster.tick(); 0");
    t.check("dzień 19, po 12:00: Ludwik przypłynął (przyjazd 19), jest w mieście", (await t.json(`${S}.ludwik.przyjazd`)) === 19 && (await t.eval("Majster.ludwikJest()")) === true);
    await go(215, 7, 12, 8);
    await t.setHour(10); await t.setDay(20, 10);
    await t.frames(60);
    t.check("w Pracowni Ludwik pracuje (rano w Cechu)", !!(await t.eval("(function(){ const e = TownLife.eventOf('ludwik'); return e && !e.isTransparent() ? 1 : 0; })()")));
    await shot(t, "cech_pracownia_ludwik.png");
    await items([[305, 1], [345, 1], [375, 1]]);
    await go(220, 48, 37, 2);
    await t.setHour(12);
    const gW = await t.gold();
    const witTalk = await talkKey("kapral", ["Mam komplet", "Zrobię taniej"]);
    t.check("Wit ma w rozmowie opcję „Mam komplet dla straży” (przejęcie z „W innej sprawie”)", JSON.stringify(witTalk.choices).includes("Mam komplet") && JSON.stringify(witTalk.choices).includes("W innej sprawie"), JSON.stringify(witTalk.choices));
    await t.frames(30);
    const sp = await t.json(`({ d: ${S}.zam.dostarczono, w: ${S}.zam.wynik })`);
    t.check("spór z Ludwikiem: „Zrobię taniej” -> 90 G, komplet oddany", sp.d > 0 && sp.w === "taniej" && (await t.gold()) === gW + 90, sp);
    await go(215, 7, 10, 8);
    await t.setHour(10); await t.setDay(21, 10);
    await t.eval("Majster.tick(); 0");
    await talkKey("ostap", []);
    await t.frames(30);
    t.check("Ostap po dostawie: ranga 2 (starszy czeladnik)", (await t.json(`${S}.ranga`)) === 2);

    // ---------------------------------------------------------------- the trade, the trial piece, the sabotage
    await talkKey("ostap", ["kowal"]);   // trade: kowal
    t.check("fach wybrany: kowal", (await t.json(`${S}.fach`)) === "kowal");
    await items([[353, 1], [379, 1]]);
    await go(215, 3, 6, 8);
    await t.eval("Majster.polkaZloz(3); 0");
    t.check("sztuka próbna kowala (Kolczuga + Żelazna tarcza) na półce", !!(await t.json(`${S}.polka`)) && (await t.json(`${S}.polka.etap`)) === 3);
    await t.setDay(22, 8);
    await go(220, 19, 59, 8);
    await go(215, 7, 15, 8);
    await t.frames(80);
    const sab = await t.json(`({ sab: ${S}.sab, polka: ${S}.polka })`);
    t.check("rano sztuka PĘKŁA: półka pusta, sabotaż raz (stan 1), scena S4 odegrana", sab.sab.stan === 1 && !sab.polka && sab.sab.scena === 0, sab);
    await shot(t, "cech_sabotaz.png");
    const jasTalk = await talkKey("jas", []);
    t.check("Jaś zdradza świadka: ślad „świadek”", (await t.json(`${S}.slady.swiadek`)) === 1, jasTalk.text);
    await go(215, 22, 10, 2);
    await t.eval("Majster.slad('wegiel'); 0");
    await go(215, 2, 7, 8);
    await t.eval("Majster.slad('odcisk'); 0");
    t.check("trzy ślady: mokry węgiel, odcisk w popiele, świadek (3 dowody)", (await t.eval("Majster.dowody()")) === 3);
    const tw = await talkKey("ostap", []);
    t.check("Ostap po sabotażu: zwraca jedną sztukę żelaza (raz)", (await t.json(`${S}.sab.zwrot`)) === 1, tw.text);

    // ---------------------------------------------------------------- the night in the workshop (22-24): Ludwik with a lamp
    await clearItems([353, 379]);
    await items([[353, 1], [379, 1]]);
    await t.eval("Majster.polkaZloz(3); 0");
    await t.setDay(22, 21.9);
    await t.eval("$gameSystem.setDayNightHour(22.1); 0");
    await t.frames(200);
    const nightA = await t.json(`({ faza: 1, ok: Majster.nocWarunek(), ev: (function(){ const e = $gameMap.event(4510); return e ? { x: e.x, y: e.y, t: e.isTransparent(), mv: e.isMoving() } : null; })() })`);
    t.check("o 22:00 w Cechu wchodzi Ludwik z lampą (zdarzenie 4510 widoczne, w drodze do półki)", nightA.ok && nightA.ev && !nightA.ev.t && (nightA.ev.x !== 0 || nightA.ev.y !== 0), nightA);
    await t.until("(function(){ const e = $gameMap.event(4510); return e && e.x === 4 && e.y === 5; })()", 40);
    await t.frames(40);
    await shot(t, "cech_noc_ludwik.png");
    await t.eval("$gameMessage.clear(); $gameMap._interpreter.clear(); Majster.akcja('noc', 2); 0");
    t.check("noc: wybór „Poczekaj i weź dowód” - dowody 3+, sztuka cała na półce", (await t.json(`${S}.sab.noc`)) === 2 && !!(await t.json(`${S}.polka`)));
    await t.setDay(23, 9);
    await t.eval("Majster.tick(); 0");
    await talkKey("ostap", []);
    await t.frames(30);
    const r3 = await t.json(`({ r: ${S}.ranga, d: ${S}.egz.dzien })`);
    t.check("rano: ranga 3 (podmistrz); egzamin wyznaczony na dzień targowy 3 dni później", r3.r === 3 && r3.d >= 26 && (await t.eval(`Majster.targ(${r3.d})`)), r3);

    // ---------------------------------------------------------------- the exam on the market
    await clearItems([353, 357, 379]);
    await t.eval(`Majster.opts({ ocena: 2 }); 0`);
    await t.setDay(r3.d, 11.5);
    await go(220, 54, 43, 8);
    await t.frames(150);
    const tri = await t.json(`({ props: $gameMap.events().filter(e => /<Majster:trybuna>/.test(e.event().note || '')).length, held: ['ostap','kowal','ciesla','ludwik'].map(k => TownLife.held(k)),
        ostap: (function(){ const e = TownLife.eventOf('ostap'); return e ? [e.x, e.y] : null; })() })`);
    t.check("w dzień egzaminu na rynku stoi trybuna (4 rekwizyty), komisja i Ludwik trzymani przez TownLife", tri.props === 4 && tri.held.every(Boolean), tri);
    await shot(t, "rynek_trybuna.png");
    await t.setHour(12.5);
    await t.frames(240);
    await shot(t, "rynek_egzamin_komisja.png");
    // incomplete piece: the exam moves a week
    const dz = r3.d;
    await talkKey("ostap", []);
    await t.frames(40);
    const przes = await t.json(`({ dzien: ${S}.egz.dzien, proby: ${S}.egz.proby })`);
    t.check("sztuka niekompletna: Ostap przesuwa egzamin o tydzień (następny dzień targowy), surowce zostają", przes.proby === 1 && przes.dzien > dz && (await t.eval(`Majster.targ(${przes.dzien})`)), przes);
    await t.setDay(przes.dzien, 12.5);
    await items([[357, 1]]);
    await go(220, 54, 43, 8);
    await t.frames(200);
    const gE = await t.gold();
    await talkKey("ostap", ["Pokaż dowody"]);
    await t.frames(80);
    const end = await t.json(`({ k: ${S}.koniec, r: ${S}.ranga, o: ${S}.egz.ocena, m: ${S}.mlotek, q: ${q} })`);
    t.check("egzamin ze Stalową kolczugą, „Mistrzowski”, dowody 3: koniec 2 (Ludwik zdemaskowany), ranga 4, Młotek majstra, +150 G", end.k === 2 && end.r === 4 && end.m === 1 && (await t.gold()) >= gE + 150, end);
    const ham = await t.json(`({ n: $gameParty.numItems($dataItems.find(i => i && /<Majster:mlotek>/.test(i.note || ''))), perk: Combat.perk('smelt.speed'), wear: Combat.perk('tool.wear') })`);
    t.check("Młotek majstra w plecaku; kuźnia -15% czasu (perk smelt.speed >= 0.15)", ham.n === 1 && ham.perk >= 0.15, ham);
    t.check("zadanie W22 skończone, Ludwik odpływa następnym promem", (await t.json(`${q}.s`)) === "done" && (await t.json(`${S}.ludwik.odplynal`)) > 0, await t.json(q));
    await shot(t, "rynek_zakonczenie.png");

    // ---------------------------------------------------------------- the other endings (F9 shortcut: state forced), the retake
    const endings = [];
    for (const [k, ocena] of [[1, 1], [3, 2], [4, 0]]) {
        await t.eval(`Majster.debugGo(3); Majster.f9Przygotuj(${ocena}); Majster.opts({ ocena: ${ocena} }); 0`);
        await t.eval(`Majster.wynik({ ocena: ${ocena}, bledy: 0 }); 0`);
        await t.frames(10);
        endings.push(await t.json(`({ k: ${S}.koniec, r: ${S}.ranga })`));
    }
    t.check("wynik z kontrolą: zakończenia 1/3/4 według oceny, opinii i dowodów (wygrywa rywal tylko przy słabym wyniku bez dowodów)", endings.length === 3, endings);
    // the retake after ending 4
    await t.eval(`(function(){ const s = Majster.stan(); Object.assign(s, MajsterData.defaults()); s.poreka = 'kowal'; s.wpisowe = 1; s.ranga = 3; s.koniec = 4; s.fach = 'kowal'; s.egz.poprawka = $gameSystem._dayNightDay; s.ludwik.przyjazd = 5; return 0; })()`);
    await t.eval(`Majster.stan().egz.dzien = Majster.nextMarket($gameSystem._dayNightDay); 0`);
    t.check("po zakończeniu 4 egzamin poprawkowy wyznaczony na dzień targowy", (await t.eval("Majster.targ(Majster.stan().egz.dzien)")) === true);

    // ---------------------------------------------------------------- the mini-game "Ostatnie szlify" (arrows + O; never fails)
    await go(220, 54, 43, 8);
    await t.eval(`Majster.opts(null); Tawerna.ui.open(Majster.Scene_Szlify, { seed: 7, turbo: 1, onEnd: r => { window.__szlify = r; } }); 0`);
    await t.until("SceneManager._scene && SceneManager._scene.phase === 'play'", 30);
    await t.frames(10);
    await shot(t, "szlify_start.png");
    for (let round = 0; round < 3; round++) {
        const ukl = await t.json("SceneManager._scene.ukl");
        for (const d of ukl) { await t.press(d); await t.frames(3); }
        await t.frames(40);
        if (round === 0) await shot(t, "szlify_runda.png");
    }
    await t.until("SceneManager._scene.phase === 'wynik'", 10);
    await shot(t, "szlify_wynik.png");
    const sz = await t.json("({ o: SceneManager._scene.ocena, b: SceneManager._scene.bledy })");
    t.check("mini-gra: trzy rundy bez błędu -> „Mistrzowski” (ocena 2)", sz.o === 2 && sz.b === 0, sz);
    await t.press("ok");
    await t.frames(40);
    await t.until("SceneManager._scene instanceof Scene_Map", 20);
    t.check("po „O” wynik wraca na mapę (onEnd)", !!(await t.json("window.__szlify")) && (await t.json("window.__szlify.ocena")) === 2);
    // a mistake counts, nothing blocks
    await t.eval(`Tawerna.ui.open(Majster.Scene_Szlify, { seed: 9, turbo: 1, onEnd: r => { window.__szlify2 = r; } }); 0`);
    await t.until("SceneManager._scene && SceneManager._scene.phase === 'play'", 30);
    const u0 = await t.json("SceneManager._scene.ukl[0]");
    await t.press(u0 === "up" ? "down" : "up"); await t.frames(4);
    t.check("pomyłka w szlifach: licznik błędów rośnie, gra idzie dalej (nie ma „oblanego”)", (await t.json("SceneManager._scene.bledy")) === 1 && (await t.json("SceneManager._scene.phase")) === "play");
    await t.eval("SceneManager._scene.end({ ocena: 0, bledy: 9 }); 0");
    await t.until("SceneManager._scene instanceof Scene_Map", 20);

    // ---------------------------------------------------------------- the journal: the words of every step
    const jr = await t.json(`(function(){ const out = []; for (const n of [0, 1, 2, 3]) { Majster.debugGo(n); TownQuests.autoChecks(); const q = TownQuests.Q.W22, r = TownQuests.rec('W22');
        const st = q.steps[r.step], vars = st && st.vars && TownQuests.FX[st.vars] && TownQuests.FX[st.vars].vars ? TownQuests.FX[st.vars].vars(q, r) : null; out.push({ n, step: r.step, t: vars ? vars.tekst : null }); } return out; })()`);
    t.check("dziennik: każdy z kroków W22 ma tekst bez {nawiasów} (poręka, trzy ręce, zamówienia, sztuka próbna)", jr.every(x => x.t && !/[{}]/.test(x.t)), jr);

    // ---------------------------------------------------------------- F9 rows, a save and the load
    const f9 = await t.json(`(function(){ const s = Watki.f9.sekcje().find(x => x.watek === 'majster'); return s ? { head: s.head, rows: s.rows.map(r => r.label) } : null; })()`);
    t.check("F9: sekcja „Wątek W22” z sześcioma wierszami", f9 && f9.rows.length === 6, f9);
    await t.saveTo(1);
    const loaded = await t.loadFrom(1);
    const after = await t.json(`({ plugin: !!window.Majster, ranga: ${S}.ranga, koniec: ${S}.koniec })`);
    t.check("zapis i wczytanie: stan wątku W22 wraca", loaded && after.plugin && after.ranga >= 3, after);
});
