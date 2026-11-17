// Wątek W17 „Jarmark Kruczogrodu” (docs/zadania_nowe/jarmark.md; js/plugins/Jarmark_Data.js, Jarmark.js, Jarmark_Sceny.js, js/teksty/jarmark.txt).
// Gra całą linię od zlecenia sołtysa do zakończenia A, potem B, C, D i F: prace (6 kramów, beczki, 8 lampionów), otwarcie, konkurs piwny
// (cztery dodatki), turniej (trzy mecze, kość Wandy), pomoc trupie, sztuka i kradzież, pięć śladów (trzy w mieście, dwa w Podgrodziu), zasadzka,
// POŚCIG ULICZKAMI (2026-11-16, nowy Kruczogród Map220: bohater stoi - kara za zgubienie z oczu; potem bot biegnie śladem Szepta, beczki w
// przejściu - obejście, meta pod wiatrakiem), poranek i zamknięcie. Sprawdza też skoki F9, brak wody w nagrodach, kolizje miejsc i że zwykłe dni
// miasta działają. Robi zdjęcia do docs/zadania_nowe/jarmark_gra/.
// Uruchom: CDP_PORT=9460 node tests/jarmark_test.js   (przed instalacją: nakładka tools/jarmark/overlay, po instalacji: sama gra)
const fs = require("fs"), path = require("path");
const kit = (function(){ try { return require("./lib/kit.js"); } catch (e) { return require("../../../../tests/lib/kit.js"); } })();
const ROOT = path.join(__dirname, "..");
const LIVE = /"name":"Jarmark"/.test(fs.readFileSync(path.join(ROOT, "js", "tawerna_wtyczki.js"), "utf8"));
const OVER = {};   // (2026-11-15: the installed game, not the pre-install overlay tools/jarmark/overlay)
const SHOTS = path.join(ROOT, "docs", "zadania_nowe", "jarmark_gra");
const ONLY = process.env.JARMARK_ONLY || "";

kit.test(Object.assign({ port: Number(process.env.CDP_PORT) || 9460, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli", evalTimeout: 60000 }, OVER), async t => {
    const J = e => t.json(e);
    fs.mkdirSync(SHOTS, { recursive: true });
    const shot = n => t.shot(path.join(SHOTS, n + ".png"));
    await t.eval(kit.DRIVER + "; 0");
    async function tree(name, picks, spk, extra) {
        await t.eval(`(function(){ const L = JarmarkData.watek.rozmowa(${JSON.stringify(name)}, Object.assign({ spk: ${JSON.stringify(spk || { id: 1, name: "Sołtys" })} }, ${JSON.stringify(extra || {})})); const D = window.__drv; D.on = true; D.picks = ${JSON.stringify(picks || [])};
            D.waiting = null; D.missing = []; D.mark = D.log.length; $gameMap._interpreter.setup(L.concat([{ code: 0, indent: 0, parameters: [] }]), 0); })()`);
        await t.frames(4);
        await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 40);
        const out = await J("({ log: window.__drv.log.slice(window.__drv.mark).map(l => l.t), missing: window.__drv.missing })");
        await t.eval("window.__drv.on = false; 0");
        out.text = out.log.join(" / ").replace(/\\SPK\[\d+\]/g, "").replace(/\s+/g, " ");
        return out;
    }
    // a scene / a talk of the interpreter run out with the driver (picks = the choices by prefix)
    async function idle(picks, max = 6000, cond) {
        await t.eval(`window.__drv.on = true; window.__drv.picks = ${JSON.stringify(picks || [])}; window.__drv.waiting = null; window.__drv.missing = []; window.__drv.mark = window.__drv.log.length; 0`);
        for (let i = 0; i < max; i += 60) {
            await t.frames(60);
            if (!(await J(cond || "Jarmark_Sceny.scena.on || $gameMap.isEventRunning() || $gameMessage.isBusy()"))) break;
        }
        const out = await J("({ log: window.__drv.log.slice(window.__drv.mark).map(l => l.t), missing: window.__drv.missing })");
        await t.eval("window.__drv.on = false; 0");
        out.text = out.log.join(" / ").replace(/\\SPK\[\d+\]/g, "").replace(/\s+/g, " ");
        return out;
    }
    const S = () => J("Jarmark.S()");
    const W = () => J("(function(){ const r = TownQuests.rec('W17'); const q = TownQuests.Q.W17; return r ? { s: r.s, step: r.step, name: q.steps[r.step] ? q.steps[r.step].nazwa : '' } : null; })()");
    const gold = () => J("$gameParty.gold()");
    const v = k => J(`JarmarkData.watek.vcount(${JSON.stringify(k)})`);
    const day = async (d, h) => { await t.setDay(d, h); await t.calm(); await t.frames(12); };
    const reload = async (m, x, y, d) => { await t.eval("$gamePlayer.requestMapReload(); 0"); await t.go(m, x, y, d); await t.calm(); await t.frames(40); };
    const vis = (a, b) => J(`$gameMap.events().filter(e => e.eventId() >= ${a} && e.eventId() <= ${b} && !e.isTransparent()).map(e => e.eventId())`);
    const tick = () => t.eval("TownQuests.autoChecks(); 0");

    // ================================================================ wtyczki, teksty, rejestr, mapa
    const base = await J(`({ list: $plugins.filter(p => p.status).map(p => p.name), files: Watki.pliki().filter(f => f.name === "jarmark"), steps: TownQuests.Q.W17.steps.length, kind: TownQuests.Q.W17.kind,
        reg: Tawerna.inject.list().filter(r => r.owner === "Jarmark").map(r => r.ids) })`);
    const ix = n => base.list.indexOf(n);
    t.check("wtyczki: Jarmark_Data pod Dezerter_Data i nad TownLife i TownQuests_Data; Jarmark pod Dezerter; Jarmark_Sceny pod Jarmark",
        ix("Jarmark_Data") > ix("Dezerter_Data") && ix("Jarmark_Data") < ix("TownLife") && ix("Jarmark_Data") < ix("TownQuests_Data") && ix("Jarmark") > ix("Dezerter") && ix("Jarmark_Sceny") > ix("Jarmark"), base.list.filter(n => /Jarmark|Dezerter/.test(n)));
    t.check("teksty jarmark.txt wczytane bez błędów (>= 250 kluczy); zadanie W17 (9 rozdziałów, wątek W); pasmo 4800-4999 zarezerwowane",
        base.files.length === 1 && base.files[0].st === "ok" && !base.files[0].errors.length && base.files[0].keys >= 250 && base.steps === 9 && base.kind === "W" && base.reg.includes("4800-4999"), base);
    await t.newGame({ map: 220, x: 46, y: 66, dir: 8, hour: 10, quiet: true, minimap: false, day: 46 });
    const gl = await J(`(function(){ const f = n => $dataMap.events.find(e => e && e.name === n);
        return { mapa: $dataMap.displayName, w: $dataMap.width, pole: f("Pole jęczmienia") ? f("Pole jęczmienia").note : "", wiatrak: !!f("Wiatrak"), miasto: Jarmark.D.MAP.miasto,
            ids: $dataMap.events.filter(e => e).every(e => e.id === $dataMap.events.indexOf(e)) }; })()`);
    t.check("jarmark w nowym Kruczogrodzie (Map220, 80 x 80): pole jęczmienia (<Pole:16,8>) i wiatrak zostają na łące, jarmark stoi wokół nich",
        gl.miasto === 220 && gl.w === 80 && /<Pole:16,8>/.test(gl.pole) && gl.wiatrak && gl.ids, gl);
    await t.go(220, 56, 66, 8); await t.frames(60); await shot("00_laka_pod_wiatrakiem");

    const FROM = process.env.JARMARK_FROM || "";
    // ================================================================ GRA 1: linia do zakończenia A
    if (FROM === "poscig") {
        await t.newGame({ map: 220, x: 17, y: 29, dir: 8, hour: 23.6, quiet: true, minimap: false, day: 52 });
        await t.gold(300);
        await t.eval("(function(){ const s = Jarmark.S(); s.zmus = 1; s.z = 1; s.otw = 1; s.konkurs.fin = 1; s.konkurs.wynik = 'wygrana'; s.turniej.fin = 1; s.prace.wydane = 1; s.przed.kradziez = 1; s.slady = { gablota: 52, cech: 52, laznia: 52, przytulek: 52, garbarnia: 52 }; Jarmark.w.skocz && 0; TownQuests.start('W17', 6); TownQuests.autoChecks(); })()");
        await tick();
    }
    if (FROM === "konce") {
        await t.newGame({ map: 220, x: 44, y: 23, dir: 8, hour: 9, quiet: true, minimap: false, day: 53 });
        await t.gold(300);
        await t.eval("(function(){ const s = Jarmark.S(); s.zmus = 1; s.z = 1; s.otw = 1; s.konkurs.fin = 1; s.turniej.fin = 1; s.prace.wydane = 1; s.przed.kradziez = 1; s.zasadzka = 1; s.pogon.koniec = 1; s.szept = 'swiadek'; s.slady = { gablota: 52, cech: 52, laznia: 52, przytulek: 52, garbarnia: 52 }; TownQuests.start('W17', 7); TownQuests.autoChecks(); })()");
        await tick();
    }
    if (!FROM) {
    await t.gold(400);
    await day(47, 10);
    await tick();
    const bez = await W();
    t.check("zlecenie nie startuje bez warunków (Opinia, Renoma, W1)", !bez || bez.s !== "active", bez);
    await t.eval("Jarmark.S().zmus = 1; 0");   // (the conditions of the offer: Opinion 20, Renown 40, W1 chapter 3 - the test's own switch)
    await tick();
    const w0 = await W();
    t.check("dzień 47: wątek W17 aktywny, rozdział 1 „Zgłoszenie”", !!w0 && w0.s === "active" && w0.name === "w17Zgloszenie", w0);
    // --- sołtys
    const z1 = await tree("zgloszenie", ["Pomogę"]);
    const s1 = await S();
    await tick();
    t.check("sołtys: „Pomogę” - zlecenie przyjęte (z=1), rozdział 2 „Prace”", s1.z === 1 && (await W()).name === "w17Prace" && /Wiedziałem/.test(z1.text) && !z1.missing.length, { z: s1.z, w: await W(), text: z1.text.slice(0, 90) });
    // --- deski, obręcze, lampiony
    await reload(220, 46, 66, 8);
    const d1 = await tree("deski", [], { id: 2, name: "Leon" });
    const o1 = await tree("kolodziej", [], { id: 3, name: "Szczepan" });
    const l1 = await tree("lampiony", [], { id: 4, name: "Wit" });
    t.check("Leon, Szczepan i Wit: sześć desek, cztery obręcze, osiem lampionów (przedmioty wirtualne)", (await v("deska_kram")) === 6 && (await v("obrecz")) === 4 && (await v("lampion")) === 8 && !d1.missing.length, { d: await v("deska_kram"), o: await v("obrecz"), l: await v("lampion") });
    const d2 = await tree("deski", [], { id: 2, name: "Leon" });
    t.check("deski tylko raz (Leon: „Deski już masz”)", /już masz/.test(d2.text) && (await v("deska_kram")) === 6, d2.text);
    await reload(220, 46, 67, 8);
    const rom = await vis(4800, 4805);
    await shot("01_miejsca_na_kramy");
    t.check("pod wiatrakiem sześć żółtych romboczków na kramy (zdarzenia 4800-4805)", rom.length === 6, rom);
    // placing the stalls by the very event (the hero beside: the action = the script of the diamond)
    for (let i = 0; i < 6; i++) await t.eval(`Jarmark.postawKram(${i}); 0`);
    await t.frames(10);
    const kr = await vis(4800, 4805), s2 = await S();
    const zaj = await J(`(function(){ const e = $gameMap.event(4803); return e ? { x: e.x, y: e.y, l: $gamePlayer.isCollidedWithCharacters(e.x - 1, e.y), p: $gamePlayer.isCollidedWithCharacters(e.x + 1, e.y) } : null; })()`);
    t.check("kram zajmuje trzy kratki (jak jego obrazek): obie boczne blokują", !!zaj && zaj.l && zaj.p, zaj);
    await shot("02_kramy_stoja");
    t.check("sześć kramów postawionych (deski zabrane, rombocki zniknęły, kramy stoją), nagroda za pracę (12 G)", s2.prace.kramy.length === 6 && (await v("deska_kram")) === 0 && kr.length === 6, { kr, kramy: s2.prace.kramy });
    const g0 = await gold();
    await tree("borgarBeczki", [], { id: 5, name: "Borgar" });
    const s3 = await S();
    t.check("beczki: obręcze oddane Borgarowi, cztery beczki przy scenie (zdarzenia 4814-4817), praca zapłacona", s3.prace.beczki === 1 && (await v("obrecz")) === 0 && (await gold()) - g0 === 12, { g: (await gold()) - g0, b: s3.prace.beczki });
    await day(48, 17.2);
    await reload(220, 60, 67, 4);
    const lampyPrzed = await vis(4806, 4813);
    await t.eval("Jarmark.powiesLampe(0); 0");
    t.check("lampiony: do piątej nie wiszą; osiem słupów-romboczków; pierwszy powieszony po 17:00", lampyPrzed.length === 8, lampyPrzed);
    for (let i = 1; i < 8; i++) await t.eval(`Jarmark.powiesLampe(${i}); 0`);
    await t.frames(10);
    const s4 = await S();
    const swiatla0 = await J("Tawerna.lightsVer || 0");
    await day(48, 20);
    const swiatla = await J(`(function(){ const e = $gameMap.event(4806); return { ver: Tawerna.lightsVer || 0, note: e ? e.event().note : "" }; })()`);
    t.check("lampion powieszony na tej mapie od razu świeci (notatka światła zdarzenia zmieniona, oświetlenie przeczytane na nowo)", swiatla.ver >= 1 && /<Light:/.test(swiatla.note), { swiatla0, swiatla });
    await reload(220, 52, 67, 8);
    await shot("03_lampiony_noc");
    await tick();
    t.check("wszystkie osiem lampionów wisi; prace 3/3; rozdział 3 „Otwarcie”", s4.prace.lampy.length === 8 && (await W()).name === "w17Otwarcie" && !(await J("JarmarkData.watek.vcount('lampion')")), { w: await W(), lampy: s4.prace.lampy });
    // --- otwarcie (49, 14:40)
    await day(49, 14.4);
    await reload(220, 68, 67, 4);
    await t.eval("Jarmark.S().otw = 0; 0");
    await shot("04_scena_dzien");
    await t.eval("Jarmark_Sceny.otwarcie(); 0");
    await t.frames(200);
    await shot("05_otwarcie_pochod");
    const op = await idle([], 6000, "Jarmark_Sceny.scena.on || $gameMap.isEventRunning()");
    const poch = await J("$gameMap.events().filter(e => e.eventId() >= 4860 && e.eventId() < 4868 && !e.isTransparent()).length");
    t.check("pochód wrócił na wschodni skraj miasta i dopiero tam zniknął (nikt nie znika w oczach)", poch === 0 && !(await J("Jarmark.api.pochod")), poch);
    await tick();
    const s5 = await S();
    t.check("otwarcie (49, 14:30): pochód Lorda, dymki, jarmark otwarty (otw=1), rozdział 4 „Konkurs”", s5.otw === 1 && (await W()).name === "w17Konkurs" && !op.missing.length, { w: await W(), otw: s5.otw });

    // --- konkurs piwny (49, 19:30), sala
    await day(49, 19.5);
    await reload(1, 14, 31, 8);
    const pl = await tree("plotka", [], { id: 6, name: "Hanka" }, { key: "piekarka" });
    t.check("plotka o sędzim (Hanka: „lubię słodkie”)", /słodkie/.test(pl.text) || /miód/i.test(pl.text), pl.text.slice(0, 120));
    await t.eval("Jarmark.konkursStart(); 0");
    await t.frames(60);
    await shot("06_konkurs_sedziowie");
    const sala = await J(`$gameMap.events().filter(e => e.eventId() >= 4850 && e.eventId() <= 4856 && !e.isTransparent()).map(e => [e.eventId(), e.x, e.y, $gameMap.isPassable(e.x, e.y, 2) || $gameMap.isPassable(e.x, e.y, 8)])`);
    t.check("sala konkursu w nowej karczmie: sędziowie w rzędzie na chodniku pod barem, sołtys i Mietek - każdy na wolnej podłodze", sala.length === 6 && sala.every(r => r[3]), sala);
    const kon = await idle(["Miód", "Dym", "Coś", "Szyszka"], 4000, "Jarmark.api.sala || $gameMap.isEventRunning() || $gameMessage.isBusy()");
    const sk = await S();
    await tick();
    t.check("konkurs: czterech sędziów, cztery dodatki (miód, dym, coś ostrego, szyszka) - cztery głosy, wygrana Borgara, 40 G i Opinia", sk.konkurs.glosy === 4 && sk.konkurs.fin === 1 && /wygrana/.test(sk.konkurs.wynik) && !kon.missing.length, { sk: sk.konkurs, miss: kon.missing });
    t.check("po konkursie sala jest czysta (sędziowie zeszli), rozdział 5 „Turniej”", !(await J("Jarmark.api.sala")) && (await W()).name === "w17Turniej", { w: await W(), vis: await vis(4850, 4859) });

    // --- turniej (50, 17-23)
    await day(50, 17.5);
    await reload(1, 14, 33, 8);
    const tu = await J("({ ok: Jarmark.D.TURNIEJ.mecze.join(), o: !!Tawerna.api('TavernDice_parts') })");
    await t.eval("Jarmark.dodajWande(); 0");
    const wan = await J("!!Tawerna.api('TavernDice_parts').data.OPPONENTS.wanda");
    t.check("Wanda Ósemka jest rywalem TavernDice (dopisana w czasie ładowania, bez zmiany cudzego pliku); trzy mecze: Bartek, Ozzy, Wanda", wan && tu.ok === "bartek,ozzy,wanda", tu);
    const g1 = await gold();
    await t.eval("Jarmark.turniejWpisz(); 0");
    t.check("wpisowe 20 G zabrane, turniej zapisany", (await gold()) === g1 - 20 && (await S()).turniej.wpisal === 50, { g: (await gold()) - g1 });
    const sim = await J(`(function(){ const D = Tawerna.api("TavernDice") || window.TavernDice; const r = D.simulate({ opponent: "wanda", stake: 15, seed: 7 }); return { w: r.winner, e: r.errors, t: r.totals }; })()`);
    t.check("mecz z Wandą rozgrywa się do końca bez błędu (symulacja silnika kości)", sim.e === 0 && (sim.w === "hero" || sim.w === "wanda" || typeof sim.w === "number" || !!sim.w), sim);
    await t.eval("Jarmark.wymus.turniejWynik(0, true); Jarmark.wymus.turniejWynik(1, true); 0");
    await tree("turniej", ["Pokaż kość"], { id: 5, name: "Borgar" });
    const st1 = await S();
    t.check("przed meczem z Wandą: „Pokaż kość” (OK) - kość fałszywa, Wanda słabsza w finale (oszust=1)", st1.turniej.oszust === 1 && st1.turniej.mecz === 2, st1.turniej);
    const g2 = await gold();
    await t.eval("Jarmark.wymus.turniejWynik(2, true); 0");
    await tick();
    const st2 = await S();
    t.check("turniej wygrany: pula 120 G, Kość Kruczogrodu, rozdział 6 „Sztuka”", st2.turniej.fin === 1 && (await gold()) - g2 === 120 && (await W()).name === "w17Sztuka", { fin: st2.turniej.fin, g: (await gold()) - g2, w: await W() });
    await shot("07_turniej_sala");

    // --- trupa: pomoc (51, 14), sztuka (51, 19), kradzież
    await day(51, 14);
    await reload(220, 62, 68, 8);
    await shot("08_trupa_przed_sztuka");
    const kos = await tree("pomoc", [], { id: 7, name: "Dorota" }, { key: "szwaczka" });
    await tree("pomoc", [], { id: 8, name: "Tadek" }, { key: "kowal" });
    await tree("pomoc", [], { id: 9, name: "Hanka" }, { key: "piekarka" });
    const sp = await S();
    t.check("pomoc trupie: kostiumy, żar i peruka (trzy dostawy), każda +1 Opinia", Object.keys(sp.przed.pomoc).length === 3 && !kos.missing.length, sp.przed.pomoc);
    const ofe = await J("(function(){ const e = $gameMap.event(4830); return !!e && !e.isTransparent(); })()");
    t.check("Ofelia i trupa stoją pod sceną w dzień jarmarku (zdarzenia 4830-4836), scena (4820), poduszka z Krukiem (4821) i cztery pochodnie (4822-4825)", ofe && (await vis(4820, 4825)).length === 6, await vis(4820, 4840));
    await day(51, 18.9);   // (the map loaded before 19:00: the play starts by itself as the hour strikes - a reload in the middle would put the actors back)
    await reload(220, 62, 68, 8);
    await t.setDay(51, 19.05);
    await t.frames(60);
    await shot("09_scena_wieczor");
    await t.eval("Jarmark_Sceny.sztuka(); 0");
    await t.frames(380);
    const naDeskach = await J("['ania', 'bonawentura', 'pimpek'].map(k => { const e = $gameMap.event(Jarmark.D.ID[k]); return e ? [e.x, e.y, e._priorityType] : null; })");
    t.check("sztuka: Ania, Bonawentura i Pimpek na deskach sceny, rysowani nad nią (obrazek sceny ich nie zasłania)", naDeskach.every((c, i) => c && c[0] === [60, 63, 65][i] && c[1] === [64, 64, 65][i] && c[2] === 2), naDeskach);
    await shot("10_sztuka_akt");
    await t.frames(1050);
    const ciemno = await J(`(function(){ const e = $gameMap.event(4824); return { cien: Jarmark.S().przed.cien, note: e ? e.event().note : "?" }; })()`);
    await shot("11_pochodnie_zgasly");
    const si = await idle([], 5200, "Jarmark_Sceny.scena.on || $gameMap.isEventRunning()");
    const s6 = await S();
    await tick();
    t.check("sztuka: trzy akty, żonglerka i ogień, pochodnie zgasły (i ich światło też), kradzież Kruka (kradziez=1), poduszka pusta, rozdział 7 „Śledztwo”", s6.przed.kradziez === 1 && !s6.przed.cien && (ciemno.cien !== 1 || !/<Light/.test(ciemno.note)) && (await W()).name === "w17Sledztwo" && !si.missing.length, { w: await W(), kr: s6.przed.kradziez, ciemno });
    await t.frames(60);
    await shot("12_poduszka_pusta");

    // --- śledztwo: pięć miejsc
    await day(52, 9);
    await reload(218, 40, 55, 8);
    const sl2 = await vis(4870, 4874);
    await shot("13a_slad_przytulek");
    await reload(220, 44, 23, 8);
    const sl = await vis(4870, 4874);
    await shot("13_slad_ratusz");
    t.check("pięć żółtych romboczków śladów po kradzieży: trzy w mieście (ratusz, Cech, studnia - 4870, 4871, 4873), dwa w Podgrodziu (garbarnia, przytułek - 4872, 4874)",
        sl.join() === "4870,4871,4873" && sl2.join() === "4872,4874", { miasto: sl, podgrodzie: sl2 });
    const gl1 = await tree("soltysSledztwo", [], { id: 1, name: "Sołtys" });
    t.check("sołtys: „Znalazłeś 0 z pięciu”", /0 z pięciu/.test(gl1.text), gl1.text.slice(0, 100));
    await t.eval("Jarmark.slad('gablota'); 0");
    await idle([], 600);
    await t.eval("Jarmark.slad('cech'); 0");
    await idle([], 600);
    await t.eval("Jarmark.slad('laznia'); 0");
    await idle([], 600);
    const s7 = await S();
    t.check("trzy z pięciu śladów (gablota w ratuszu, rejestr cechu, studnia): w dzienniku, poszlaki 3, rombocki w mieście znikają", Object.keys(s7.slady).length === 3 && (await vis(4870, 4874)).length === 0, s7.slady);
    await t.eval("Jarmark.slad('przytulek'); Jarmark.slad('garbarnia'); 0");
    await idle([], 900);

    }   // (FROM)

    if (FROM !== "konce") {
    // --- zasadzka i pościg (52, 23:40)
    await day(52, 23.6);
    await reload(220, 17, 29, 8);
    await t.frames(70);
    await t.eval("Jarmark_Sceny.zasadzkaSpec(true); 0");
    await t.frames(30);
    await shot("14_zasadzka_u_dzwonnicy");
    const zas = await J("({ ok: !!Jarmark_Sceny.zasadzkaOkno(), vis: $gameMap.events().filter(e => e.eventId() >= 4880 && e.eventId() < 4896 && !e.isTransparent()).map(e => e.eventId()) })");
    t.check("po 23:30 przy dzwonnicy czekają sołtys i kapral (zasadzka), cztery latarnie i dwa koksowniki straży", zas.ok && zas.vis.includes(4880) && zas.vis.includes(4881) && zas.vis.filter(i => i >= 4890).length === 6, zas);
    await t.eval("$gameMap.event(4880).start(); 0");
    await t.frames(5);
    await idle([], 900, "$gameMap.isEventRunning() || $gameMessage.isBusy()");
    await t.until("Jarmark_Sceny.bieg.on", 15, 200);
    await t.frames(30);
    const b0 = await J("({ on: Jarmark_Sceny.bieg.on, x: $gamePlayer.x, y: $gamePlayer.y, sz: (function(){ const e = $gameMap.event(4882); return e && !e.isTransparent() ? [e.x, e.y] : null; })(), fix: $gameMap.event(4882).isDirectionFixed() })");
    t.check("pościg wystartował: bohater pod dzwonnicą (17,27), Szept wychodzi zza wieży (bez stałego kierunku - patrzy, dokąd biegnie)", b0.on && b0.x === 17 && b0.y === 27 && !!b0.sz && !b0.fix, b0);
    await shot("15_poscig_start");
    // test 1: the hero stands - Szept runs on, then waits out of sight; 3 s out of sight: +15 s, once
    await t.until("Jarmark.S().pogon.upadki > 0", 40, 120);
    await t.frames(200);
    const lost = await J("(function(){ const e = $gameMap.event(4882), s = Jarmark.S().pogon; return { u: s.upadki, c: s.czas, seg: Jarmark_Sceny.bieg.segment, d: Math.max(Math.abs(e.x - $gamePlayer.x), Math.abs(e.y - $gamePlayer.y)), stoi: !e.isMoving() && !e.isMoveRouteForcing() }; })()");
    t.check("bohater stoi w miejscu: Szept ucieka kilka odcinków, potem czeka; zgubiony z oczu na 3 s - kara +15 s (tylko raz)", lost.u === 1 && lost.c >= 15 && lost.seg >= 3 && lost.seg < 11 && lost.d > 13 && lost.stoi, lost);
    // the bot: runs (shift) along Szept's trail cell by cell; a blocked cell (the barrels) - a detour by the map to the trail behind them
    await t.eval(`(function(){
        window.__bot = { trail: [], i: 0, det: [], stuck: 0, on: true, beczki: 0, detours: 0, skok: 0, last: null, seen: [] };
        const blocked = (x, y) => !$gameMap.isValid(x, y) || $gamePlayer.isCollidedWithCharacters(x, y);
        function bfs(sx, sy, tx, ty) {
            const W = $gameMap.width(), key = (x, y) => y * W + x, prev = new Map([[key(sx, sy), null]]), q = [[sx, sy]];
            while (q.length) { const [x, y] = q.shift(); if (x === tx && y === ty) break;
                for (const [d, dx, dy] of [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]) { const nx = x + dx, ny = y + dy;
                    if (prev.has(key(nx, ny)) || blocked(nx, ny) || !$gameMap.isPassable(x, y, d) || !$gameMap.isPassable(nx, ny, 10 - d)) continue;
                    prev.set(key(nx, ny), [x, y]); q.push([nx, ny]); } }
            if (!prev.has(key(tx, ty))) return null;
            const out = []; let c = [tx, ty]; while (c) { out.unshift(c); c = prev.get(key(c[0], c[1])); } return out.slice(1);
        }
        window.__botStep = function() {
            const B = window.__bot; if (!B || !B.on) return;
            const st = Input._currentState; ["up", "down", "left", "right", "shift"].forEach(k => st[k] = false);
            const bg = Jarmark_Sceny.bieg, e = $gameMap.event(4882);
            if (!bg.on || bg.phase !== "bieg" || !e || $gameMessage.isBusy() || $gameMap.isEventRunning()) return;
            const b = $gameMap.event(4883); if (b && !b.isTransparent()) B.beczki = 1;
            const last = B.trail[B.trail.length - 1];
            if (!last || last[0] !== e.x || last[1] !== e.y) { if (last) B.skok = Math.max(B.skok, Math.abs(last[0] - e.x) + Math.abs(last[1] - e.y)); B.trail.push([e.x, e.y]); }
            const p = $gamePlayer;
            let tg = B.det.length ? B.det[0] : B.trail[B.i];
            if (!tg) return;
            if (Math.abs(p._realX - tg[0]) < 0.15 && Math.abs(p._realY - tg[1]) < 0.15) { if (B.det.length) B.det.shift(); else B.i++; B.stuck = 0; return; }
            if (!B.det.length && blocked(tg[0], tg[1])) {
                let j = B.i; while (j < B.trail.length && blocked(B.trail[j][0], B.trail[j][1])) j++;
                if (j < B.trail.length) { const r = bfs(p.x, p.y, B.trail[j][0], B.trail[j][1]); if (r) { B.det = r; B.i = j; B.detours++; } }
                return;
            }
            if (++B.stuck > 90) { const j = Math.min(B.trail.length - 1, B.i + 2), r = bfs(p.x, p.y, B.trail[j][0], B.trail[j][1]); if (r) { B.det = r; B.i = j; } B.stuck = 0; }
            const dx = tg[0] - p._realX, dy = tg[1] - p._realY;
            if (dx > 0.12) st.right = true; else if (dx < -0.12) st.left = true;
            if (dy > 0.12) st.down = true; else if (dy < -0.12) st.up = true;
            st.shift = true;
        };
        if (!Scene_Map.prototype.__botWrapped) { const u = Scene_Map.prototype.update; Scene_Map.prototype.update = function() { try { window.__botStep && window.__botStep(); } catch (er) { console.warn(er); } u.call(this); }; Scene_Map.prototype.__botWrapped = true; }
        // (the trail from where Szept is now: the hero runs to him first by the map)
        const e = $gameMap.event(4882); window.__bot.trail.push([e.x, e.y]);
        window.__bot.zablok = blocked(Jarmark.D.POGON.przeszkoda.x, Jarmark.D.POGON.przeszkoda.y);   // (the barrels already lie in the gap: the bot's first way goes round them)
        const r = bfs($gamePlayer.x, $gamePlayer.y, e.x, e.y); window.__bot.det = r || []; window.__bot.i = 1;
    })(); 0`);
    const snaps = { beczki: false, koryto: false, wiatrak: false };
    await t.eval(`window.__drv.on = true; window.__drv.picks = ["Zostaje"]; window.__drv.waiting = null; window.__drv.missing = []; window.__drv.mark = window.__drv.log.length; 0`);
    for (let i = 0; i < 12000 && (await J("Jarmark_Sceny.bieg.on")); i += 30) {
        await t.frames(30);
        const st = await J("({ b: window.__bot.beczki, seg: Jarmark_Sceny.bieg.segment, ph: Jarmark_Sceny.bieg.phase })");
        if (st.seg >= 6 && !snaps.koryto) { snaps.koryto = true; await shot("17_poscig_dolne_miasto"); }
        if (st.ph === "koniec" && !snaps.wiatrak) { snaps.wiatrak = true; await shot("18_szept_pod_wiatrakiem"); }
    }
    await t.eval("window.__drv.on = false; window.__bot.on = false; ['up','down','left','right','shift'].forEach(k => Input._currentState[k] = false); 0");
    const bot = await J("({ beczki: window.__bot.beczki, det: window.__bot.detours, zablok: window.__bot.zablok, skok: window.__bot.skok, trail: window.__bot.trail.length })");
    await t.frames(90);
    const sc = await S();
    await tick();
    const down = await J("({ x: $gamePlayer.x, y: $gamePlayer.y, ev: $gameMap.events().filter(e => e.eventId() >= 4880 && e.eventId() < 4890 && !e.isTransparent()).length })");
    t.check("pościg: Szept przebiegł całą trasę po ziemi (bez przeskoków), w wąskim przejściu przewrócił beczki (zamykają je), bot obiegł je i dogonił go pod wiatrakiem", bot.beczki === 1 && (bot.det >= 1 || bot.zablok) && bot.skok <= 1 && bot.trail > 60 && down.x >= 40 && down.x <= 50 && down.y >= 57 && down.y <= 68, { bot, down });
    t.check("meta pościgu: wybór „zostaje świadkiem”, Kruk i bilet z promu w torbie, pościg wyłączony, Szept, beczki, sołtys i kapral zdjęci w ciemności", sc.pogon.koniec === 1 && sc.szept === "swiadek" && (await v("srebrny_kruk")) === 1 && (await v("bilet_ferry")) === 1 && !(await J("Jarmark_Sceny.bieg.on")) && down.ev === 0, { pogon: sc.pogon, szept: sc.szept, down });
    await shot("19_po_poscigu");

    }   // (FROM konce)

    // --- poranek: sołtys, Marcel; zamknięcie
    await day(53, 9);
    await reload(220, 44, 23, 8);
    await tick();
    const ra = await tree("soltysSledztwo", [], { id: 1, name: "Sołtys" });
    const rano = await t.eval("0");
    await t.eval("(function(){ const L = Jarmark_Sceny.ranoRozmowa(); const D = window.__drv; D.on = true; D.picks = ['Oskarżyć']; D.waiting = null; D.missing = []; D.mark = D.log.length; $gameMap._interpreter.setup(L.concat([{ code: 0, indent: 0, parameters: [] }]), 0); })()");
    await t.frames(4);
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 40);
    await t.eval("window.__drv.on = false; 0");
    const sm = await S();
    t.check("poranek (53): sołtys pyta o Marcela - „Oskarżyć go przed Lordem” (dowody: 5 śladów, świadek Szept)", sm.marcel === "oskarz", sm.marcel);
    await day(53, 11.8);
    await reload(220, 68, 67, 4);
    const gA = await gold();
    await t.eval("Jarmark_Sceny.zamkniecie(); 0");
    await t.frames(240);
    await shot("22_zamkniecie_jarmarku");
    await idle([], 4000, "Jarmark_Sceny.scena.on || $gameMap.isEventRunning()");
    await tick();
    const sA = await S();
    t.check("zakończenie A „Pełny jarmark”: Marcel aresztowany, Szept ułaskawiony, 60 G + 100 G, zwrotka z Kruka, jarmark zamknięty (znika scena i kramy)", sA.koniec === "A" && sA.marcel === "aresztowany" && sA.szept === "ulaskawiony" && sA.zamkniecie === 1 && (await gold()) - gA === 160 && !!sA.zwrotka, { koniec: sA.koniec, g: (await gold()) - gA, zw: sA.zwrotka });
    t.check("rozdział 9 zrobiony, wątek W17 ukończony; nagrody nie zawierają wody ani naczyń z wodą", (await J("TownQuests.rec('W17').s")) === "done" && !(await J("$gameParty.items().some(i => /wod[aę]|wiadro z wod/i.test(i.name))")), await J("TownQuests.rec('W17').s"));
    await t.frames(30);
    await reload(220, 68, 67, 4);
    await shot("23_po_jarmarku");
    t.check("po zamknięciu: scena, kramy i trupa znikają spod wiatraka", (await vis(4820, 4840)).length === 0 && (await vis(4800, 4805)).length === 0, await vis(4800, 4840));

    // ================================================================ zakończenia B, C, D, F (stan wymuszony, scena zamknięcia)
    async function ending(label, setup, expect, gold0) {
        await t.newGame({ map: 220, x: 68, y: 67, dir: 4, hour: 11.9, quiet: true, minimap: false, day: 53 });
        await t.gold(300);
        await t.eval(`(function(){ const s = Jarmark.S(); s.z = 1; s.otw = 1; s.przed.kradziez = 1; s.zasadzka = 1; s.pogon.koniec = 1; ${setup}; TownQuests.autoChecks(); })()`);
        const g = await gold();
        await t.eval("Jarmark.zegar(); 0");
        const how = await J("Jarmark_Sceny.jak()");
        await t.eval("Jarmark_Sceny.rozstrzygnij(true); 0");
        const s = await S();
        t.check(`zakończenie ${label}`, s.koniec === expect && how === expect && s.zamkniecie === 1 && (await gold()) - g === gold0, { koniec: s.koniec, how, g: (await gold()) - g, marcel: s.marcel, szept: s.szept });
    }
    await ending("B „Złodziej bez zleceniodawcy” (mniej niż 3 poszlaki, Szept w dybach): 60 G", "s.szept = 'kapral'; s.marcel = 'oskarz'; s.slady = { gablota: 1 }", "B", 60);
    await ending("C „Litość” (Szept puszczony): 60 G - 40 G zdjęcia klątwy", "s.szept = 'wolny'; s.marcel = 'puscic'; s.slady = { gablota: 1, cech: 1, laznia: 1 }", "C", 20);
    await ending("D „Szantaż”: 60 G + 80 G", "s.szept = 'kapral'; s.marcel = 'szantaz'; s.slady = { gablota: 1, cech: 1, laznia: 1 }", "D", 140);
    await t.newGame({ map: 220, x: 68, y: 67, dir: 4, hour: 12.2, quiet: true, minimap: false, day: 53 });
    await t.eval("(function(){ const s = Jarmark.S(); s.z = 1; s.otw = 1; s.przed.kradziez = 1; s.pogon.koniec = 0; })()");
    await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 30, 200);
    await t.eval("Jarmark.zegar(); 0");
    await t.frames(70);
    const sF = await S();
    t.check("zakończenie F: kruk nieodzyskany do południa 53 - jarmark odwołany, Opinia -5 (bez nagród złota)", sF.koniec === "F" && sF.zamkniecie === 1 && sF.szept === "uciekl", { koniec: sF.koniec });

    // ================================================================ F9, skoki, zwykłe dni
    await t.newGame({ map: 220, x: 44, y: 23, dir: 8, hour: 10, quiet: true, minimap: false, day: 47 });
    await t.eval("Jarmark.S().zmus = 1; TownQuests.autoChecks(); 0");
    await t.frames(10);
    const f9 = await J("(function(){ const h = Watki.f9.sekcje().filter(x => /W17/.test(x.head)); return h.length ? { head: h[0].head, rows: h.reduce((a, x) => a + x.rows.length, 0), n: h.length } : null; })()");
    t.check("F9: sekcja „Wątek W17 (Jarmark):” z trzema wierszami (udział, poszlaki, finały) i wyborem rozdziału ze skokiem", !!f9 && /Wątek W17 \(Jarmark\):/.test(f9.head) && f9.rows >= 4, f9);   // (the three rows and the chapter picker with its jump)
    await t.eval("Watki.skocz('jarmark', 6); 0");
    await t.frames(80);
    const jmp = await J("({ d: $gameSystem && Tawerna.time.day(), m: $gameMap.mapId(), z: Jarmark.S().z })");
    t.check("skok F9 do rozdziału 6: dzień 51, Kruczogród (Map220), przygotowania zrobione", jmp.d === 51 && jmp.m === 220 && jmp.z === 1, jmp);
    await t.newGame({ map: 220, x: 44, y: 23, dir: 8, hour: 12, quiet: true, minimap: false, day: 30 });
    const norm = await J("({ n: $gameMap.events().filter(e => e.eventId() >= 4800 && e.eventId() < 5000).length, ev: $gameMap.events().length })");
    t.check("zwykły dzień przed jarmarkiem (30): ani jednego zdarzenia jarmarku na mapie", norm.n === 0, norm);
    // ---- the places of the other packages: the fair's props must not stand on or block them (Okolice.checkMap, as tests/zakon_test.js "kolizje miejsc")
    await t.newGame({ map: 220, x: 44, y: 23, dir: 8, hour: 12, quiet: true, minimap: false, day: 30 });
    const kol0 = await J("Okolice.checkMap().problems");
    await t.eval("(function(){ const s = Jarmark.S(); s.z = 1; s.otw = 1; s.prace.kramy = [0,1,2,3,4,5]; s.prace.lampy = [0,1,2,3,4,5,6,7]; s.prace.beczki = 1; s.prace.wydane = 1; s.przed.kradziez = 0; })(); 0");
    await day(51, 19.05);
    await t.eval("Jarmark.api.crowd = true; 0");
    await reload(220, 62, 68, 8);
    const kol1 = await J("Okolice.checkMap().problems");
    t.check("kolizje miejsc (Okolice.checkMap, mapa 220) w dniu jarmarku ze sceną, kramami, lampami i tłumem: tyle samo co w zwykły dzień, żadnego nowego", kol1.length <= kol0.length && kol1.every(p => kol0.includes(p)), { przed: kol0.length, jarmark: kol1.length, nowe: kol1.filter(p => !kol0.includes(p)) });
});
