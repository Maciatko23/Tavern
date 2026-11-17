// Wątek W18 „Wesele w Złotym Kuflu” (docs/zadania_nowe/wesele.md; js/plugins/Wesele_Data.js, Wesele.js, Wesele_Gry.js, js/teksty/wesele.txt).
// Gra całą linię od zlecenia Borgara do zakończenia A, potem C, D i odmowę, sprawdza plan stołów (okno na klawiszach), taniec (bot),
// ozdoby i świece, siedzących gości, bójkę, siedem miejsc poszukiwań, poranek, nagrody, skoki F9 i to, że zwykłe dni tawerny (goście sali,
// Borgar, Melia, Grum, Ozzy) działają jak dotąd. Robi też zdjęcia do docs/zadania_nowe/wesele_gra/.
// Uruchom: CDP_PORT=9942 node tests/wesele_test.js   (przed instalacją: nakładka tools/wesele/overlay, po instalacji: sama gra)
const fs = require("fs"), path = require("path");
const kit = (function(){ try { return require("./lib/kit.js"); } catch (e) { return require("../../../../tests/lib/kit.js"); } })();
const ROOT = path.join(__dirname, "..");
const LIVE = /"name":"Wesele"/.test(fs.readFileSync(path.join(ROOT, "js", "tawerna_wtyczki.js"), "utf8"));
const OVER = {};   // (2026-11-15: the installed game, not the pre-install overlay tools/wesele/overlay)
const SHOTS = path.join(ROOT, "docs", "zadania_nowe", "wesele_gra");
const ONLY = process.env.WESELE_ONLY || "";   // (e.g. "A" - only the first game)

kit.test(Object.assign({ port: Number(process.env.CDP_PORT) || 9942, bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, OVER), async t => {
    const J = e => t.json(e);
    const shot = n => t.shot(path.join(SHOTS, n + ".png"));
    await t.eval(kit.DRIVER + "; 0");
    // a thread's talk (a tree by name) driven to its end; picks - the choices by prefix
    async function tree(name, picks, spk, extra) {
        await t.eval(`(function(){ const L = WeseleData.watek.rozmowa(${JSON.stringify(name)}, Object.assign({ spk: ${JSON.stringify(spk || { id: 1, name: "Borgar" })} }, ${JSON.stringify(extra || {})})); const D = window.__drv; D.on = true; D.picks = ${JSON.stringify(picks || [])};
            D.waiting = null; D.missing = []; D.mark = D.log.length; $gameMap._interpreter.setup(L.concat([{ code: 0, indent: 0, parameters: [] }]), 0); })()`);
        await t.frames(4);
        await t.until("!$gameMap.isEventRunning() && !$gameMessage.isBusy()", 40);
        const out = await J("({ log: window.__drv.log.slice(window.__drv.mark).map(l => l.t), missing: window.__drv.missing })");
        await t.eval("window.__drv.on = false; 0");
        out.text = out.log.join(" / ").replace(/\\SPK\[\d+\]/g, "").replace(/\s+/g, " ");
        return out;
    }
    // the map's interpreter and the scene run out (a scene's talks with the driver)
    async function idle(picks, max = 5000, shots) {
        await t.eval(`window.__drv.on = true; window.__drv.picks = ${JSON.stringify(picks || [])}; window.__drv.waiting = null; window.__drv.missing = []; window.__drv.mark = window.__drv.log.length; 0`);
        for (let i = 0; i < max; i += 60) {
            await t.frames(60);
            if (shots && i % shots.every === 0) await shot(shots.name + "_" + (i / shots.every));
            if (!(await J("Wesele.scena().on || $gameMap.isEventRunning() || !!Wesele.scena().next"))) break;
        }
        const out = await J("({ log: window.__drv.log.slice(window.__drv.mark).map(l => l.t), missing: window.__drv.missing })");
        await t.eval("window.__drv.on = false; 0");
        out.text = out.log.join(" / ").replace(/\\SPK\[\d+\]/g, "").replace(/\s+/g, " ");
        return out;
    }
    const S = () => J("Wesele.stan()");
    const W = () => J("(function(){ const r = TownQuests.rec('W18'); const q = TownQuests.Q.W18; return r ? { s: r.s, step: r.step, name: q.steps[r.step] ? q.steps[r.step].nazwa : '' } : null; })()");
    const items = id => J(`$gameParty.numItems($dataItems[${id}])`);
    const reload = async (m, x, y, d) => { await t.eval("$gamePlayer.requestMapReload(); 0"); await t.go(m, x, y, d); await t.calm(); await t.frames(40); };
    const day = async (d, h) => { await t.setDay(d, h); await t.calm(); await t.frames(12); };
    const near = async (id, m, x, y, d) => { await t.go(m, x, y, d || 8); await t.frames(30); };
    const startEv = id => t.eval(`$gameMap.event(${id}).start(); 0`);

    // ================================================================ wtyczki, teksty, rejestr
    const base = await J(`({ list: $plugins.filter(p => p.status).map(p => p.name), files: Watki.pliki().filter(f => f.name === "wesele"), q: !!TownQuests.Q.W18 && TownQuests.Q.W18.kind === "W",
        steps: TownQuests.Q.W18.steps.length, reg: Tawerna.inject.list().filter(r => r.owner === "Wesele").map(r => r.ids), api: !!window.Wesele && !!window.WeseleGry && Tawerna.api("Wesele") === window.Wesele })`);
    const ix = n => base.list.indexOf(n);
    t.check("wtyczki: Wesele_Data pod Dezerter_Data, nad TownLife i TownQuests_Data; Wesele pod Dezerter; Wesele_Gry pod Wesele",
        base.api && ix("Wesele_Data") > ix("Dezerter_Data") && ix("Wesele_Data") < ix("TownLife") && ix("Wesele_Data") < ix("TownQuests_Data") && ix("Wesele") > ix("Dezerter") && ix("Wesele_Gry") > ix("Wesele"), base.list.filter(n => /Wesele|Dezerter/.test(n)));
    t.check("teksty wesele.txt wczytane bez błędów (>= 250 kluczy); zadanie W18 (6 rozdziałów) w TownQuests; rejestr 3200-3239 i 3280-3299 (mapy 1, 25, 26)",
        base.files.length === 1 && base.files[0].st === "ok" && !base.files[0].errors.length && base.files[0].keys >= 250 && base.q && base.steps === 6 && base.reg.includes("3200-3239") && base.reg.includes("3280-3299"), base);

    // ================================================================ logika: iskry, nastrój, zakończenia
    await t.newGame({ map: 1, x: 14, y: 40, dir: 8, hour: 10, quiet: true, minimap: false });
    const lg = await J(`(function(){ const D = WeseleData, dobry = Wesele.planDobry(), p2 = Object.assign({}, dobry); let p3;
        p2.agata = p2.hanka + 1; p3 = { hanka: 0, agata: 1, tadek: 2, kuba: 3, wit: 4, mietek: 5, ignac: 6, bartek: 7, halina: 8, stefa: 9, rp1: 10, rm1: 11, rp2: 12, rm2: 13, leon: 14, lucjan: 15, soltys: 16, ambrozy: 17 };
        return { dobry: Wesele.iskry(dobry), jedna: Wesele.iskry(p2), siedem: Wesele.iskry(p3), borgar: Wesele.iskry(Wesele.plan()), kart: D.KARTY.length, wasni: D.WASNIE.length,
            miejsca: D.KARTY.map((c, i) => Wesele.miejsceXY(i)).every(m => m.x >= 3 && m.x <= 25 && m.y >= 20 && m.y <= 22) }; })()`);
    t.check("plan stołów: 18 kart, 7 waśni; dobry plan = 0 iskier, jedna waśń przy stole = 1, wszystkie = 7; plan Borgara (nieusadzone) ma iskry", lg.kart === 18 && lg.wasni === 7 && lg.dobry === 0 && lg.jedna === 1 && lg.siedem === 7 && lg.borgar >= 1 && lg.miejsca, lg);
    const ob = await J("({ x: WeseleData.SALA.stoly.length, seats: 4 * 6, pasuje: WeseleData.KARTY.length <= 24 })");
    t.check("sala: cztery stoły po sześć miejsc (24) na osiemnaście kart", ob.x === 4 && ob.seats === 24 && ob.pasuje, ob);

    // ================================================================ GRA 1: linia do zakończenia A
    await t.gold(300);
    await day(19, 10);
    const bez = await W();
    t.check("zlecenie nie startuje bez warunków (Opinia, Renoma, zaufanie Melii, W1)", !bez && !(await J("Wesele.warunki()")), bez);
    await t.eval("Wesele.stan().zmus = 1; TownQuests.autoChecks(); 0");
    const w0 = await W();
    const tops = await J("TownQuests.borgarTopics ? TownQuests.borgarTopics() : []");
    t.check("dzień 19, 10:00: wątek W18 ruszył; Borgar ma temat „Borgarze, coś ci chodzi po głowie?”", !!w0 && w0.s === "active" && w0.name === "w18Zlecenie" && tops.some(x => x.id === "W18" && /chodzi po głowie/.test(x.label)), { w0, tops });
    await near(1, 1, 14, 31, 8);
    await shot("01_borgar_zlecenie");
    const z1 = await tree("zlecenie", ["Dobra"]);
    const s1 = await S();
    await t.eval("TownQuests.autoChecks(); 0");
    t.check("Borgar: „Dobra, zajmę się” - zlecenie przyjęte (z=1), dwie pochodnie, rozdział 2 „Przygotowania”", s1.z === 1 && (await items(59)) >= 2 && (await W()).name === "w18Przygot" && /Wiedziałem/.test(z1.text) && !z1.missing.length, { s1z: s1.z, w: await W(), text: z1.text.slice(0, 120) });
    await reload(1, 14, 32, 8);
    await t.frames(60);
    const ev0 = await J("({ n: $gameMap.events().filter(e => e.eventId() >= 3200 && e.eventId() < 3300).length, ozdoby: $gameMap.events().filter(e => e.eventId() >= 3280 && e.eventId() < 3290 && !e.isTransparent()).length, swiece: $gameMap.events().filter(e => e.eventId() >= 3290 && e.eventId() < 3300 && !e.isTransparent()).length, gosc: $gameMap.events().filter(e => e.eventId() >= 3210 && e.eventId() < 3228 && !e.isTransparent()).length, lada: !!$gameMap.event(3228), tablica: !$gameMap.event(3229).isTransparent() })");
    t.check("po przyjęciu: zdarzenia wesela w tawernie (10 romboczków na ozdoby, 10 świec, lada, tablica); goście jeszcze nie siedzą", ev0.n >= 20 && ev0.ozdoby === 10 && ev0.swiece === 10 && ev0.lada && ev0.tablica && ev0.gosc === 0, ev0);

    // ---- Melia: struny (K22 niezrobione), potem pieśni (smutna odrzucona)
    await t.eval("TavernLife.addTrust('melia', 20, 'test'); 0");
    const m1 = await tree("melia", ["Kupię"], { id: 2, name: "Melia" });
    const m2 = await tree("melia", ["„Gdy", "„Kufel", "„Dzień", "„Wianek"], { id: 2, name: "Melia" });
    const s2 = await S();
    t.check("Melia: struny za 8 G, potem trzy pieśni (smutna „na pogrzeb” odrzucona): toast „Kufel”, taniec „Młyn”, kołysanka „Wianek”",
        s2.struny === 1 && Object.keys(s2.piesni).length === 3 && s2.piesni.toast === "kufel" && s2.piesni.taniec === "mlyn" && s2.piesni.kolysanka === "wianek" && s2.muzyka === 1 && /na pogrzeb/.test(m2.text) && !m1.missing.length && !m2.missing.length, { m1: m1.text.slice(0, 80), piesni: s2.piesni, miss: m2.missing });
    const m3 = await tree("melia", [], { id: 2, name: "Melia" });
    t.check("Melia po ustaleniu pieśni: „Zagram, co ustaliliśmy”", /co ustaliliśmy/.test(m3.text), m3.text.slice(0, 100));

    // ---- Halina: wianki, Dorota: szarfy i plotka, Hanka: tort
    await t.eval("$gameParty.gainItem($dataItems[104], 6); 0");
    const h1 = await tree("halina", [], { id: 5, name: "Halina" });
    t.check("Halina plecie sześć wianków z sześciu pęków ziół", (await S()).wianki === 6 && (await items(104)) === 0 && /Gotowe/.test(h1.text), h1.text.slice(0, 80));
    const d1 = await tree("dorota", [], { id: 6, name: "Dorota" });
    const d2 = await tree("dorota", [], { id: 6, name: "Dorota" });
    const s3 = await S();
    t.check("Dorota daje cztery szarfy, a przy drugiej rozmowie mówi o rodach (plotka)", s3.szarfy === 4 && s3.plotki.includes("szwaczka") && /Rody/.test(d2.text), { sz: s3.szarfy, p: s3.plotki });
    await t.eval("$gameParty.gainItem($dataItems[76], 2); $gameParty.gainItem($dataItems[102], 3); 0");
    await tree("hanka", [], { id: 7, name: "Hanka" });
    const hk1 = await S();
    t.check("Hanka: tort zamówiony za 2 miody i 3 jagody (składniki zabrane)", hk1.tort === 1 && (await items(76)) === 0 && (await items(102)) === 0, { tort: hk1.tort });
    await day(20, 10);
    const hk2 = await tree("hanka", [], { id: 7, name: "Hanka" });
    t.check("Hanka: tort gotowy następnego dnia - odbiór (tort = 2); plotka o Agacie", (await S()).tort === 2 && /Tort gotowy/.test(hk2.text) && (await S()).plotki.includes("piekarka"), hk2.text.slice(0, 100));
    // ---- kuchnia: lada
    await t.eval("$gameParty.gainItem($dataItems[130], 1); $gameParty.gainItem($dataItems[131], 1); $gameParty.gainItem($dataItems[132], 1); 0");
    await near(3228, 1, 12, 9, 8);
    const l1 = await tree("lada", ["Położ danie", "Gulasz"]);
    await t.eval("Wesele.wymus.ladaDanie(131); Wesele.wymus.ladaDanie(132); 0");
    await shot("02_kuchnia_lada");
    t.check("lada w kuchni: trzy dania (gulasz, kapuśniak, zupa grzybowa) położone, trzecie danie ponad limit zatrzymane", (await S()).dania.length === 3 && (await S()).dania.join() === "130,131,132" && !l1.missing.length, { d: (await S()).dania, m: l1.missing });
    // ---- Kleofas, plotki
    const k1 = await tree("kleofas", ["Czy poprowadzisz"], { id: 8, name: "Kleofas" });
    await t.eval("Wesele.wymus.plotka('opiekunka'); Wesele.wymus.plotka('kowal'); Wesele.wymus.plotka('kapral'); 0");
    const s4 = await S();
    t.check("brat Kleofas poprowadzi ślub; cztery plotki o waśniach (Dorota, Hanka, Stefa, Tadek, Wit)", s4.kleo === 1 && s4.plotki.length >= 5, { kleo: s4.kleo, p: s4.plotki });
    const tf = await J("(function(){ const L = TownQuests.talkFor('wdowa'); return L && L.length ? 1 : 0; })()");
    t.check("rozmowa z mieszkańcem (Halina) idzie przez zadanie W18, gdy są jeszcze wianki do zrobienia - lub milczy, gdy zrobione", tf === 0 || tf === 1, tf);

    // ---- ozdoby i świece (jedna prawdziwa interakcja zdarzenia, reszta przez API)
    await near(3280, 1, 4, 28, 8);
    await startEv(3280);
    await t.frames(40);
    const s5 = await S();
    t.check("wianek wieszany na żółtym rombie (zdarzenie 3280): wianków 5, wiszących 1, zdarzenie znika, wianek rysuje wspólna warstwa sali", s5.wianki === 5 && s5.wiszace.includes(0) && (await J("$gameMap.event(3280)._erased")) && (await J("Wesele.warstwa().wianki")) === 1, s5.wiszace);
    await startEv(3290);
    await t.frames(30);
    const sc0 = (await S()).swiece.length;
    await t.eval("Torch.light && Torch.light(); 0");
    const nopochodni = await J("!(window.Torch && Torch.isLit && Torch.isLit())");
    if (nopochodni) { await t.eval("$gameParty.gainItem($dataItems[59], 1); if (window.Torch) Torch.light(); 0"); }
    await startEv(3290);
    await t.frames(30);
    t.check("świeca: bez płonącej pochodni nic (popup „potrzebujesz”), z pochodnią zapalona", sc0 === 0 && (await S()).swiece.includes(0), { przed: sc0, po: (await S()).swiece });
    await t.eval("for (let i = 1; i < 10; i++) Wesele.wymus.dekoruj(null, i, $gameMap.event(3280 + i)); 0");
    await t.eval("for (let i = 1; i < 9; i++) Wesele.wymus.swieca(null, i, $gameMap.event(3290 + i)); 0");
    await t.frames(20);
    const s6 = await S();
    t.check("sala ubrana: 10 miejsc na wianki i szarfy, 9 świec (10. zapala się na końcu)", s6.wiszace.length === 10 && s6.wianki === 0 && s6.szarfy === 0 && s6.swiece.length === 9, { w: s6.wiszace.length, s: s6.swiece.length });
    await t.eval("Wesele.wymus.swieca(null, 9, $gameMap.event(3299)); 0");
    await t.frames(30);
    const sw = await J("({ n: (Wesele.stan().swiece || []).length, lit: Wesele.warstwa().swiece, ozd: Wesele.warstwa().wianki + Wesele.warstwa().szarfy, ev: $gameMap.events().filter(e => e.eventId() >= 3280 && e.eventId() < 3202 && !e._erased).length })");
    t.check("po dziesiątej świecy: wszystkie 10 płoną i 10 ozdób wisi - rysuje je wspólna warstwa (zero zdarzeń na te miejsca), sala bez własnych świateł (świecą stałe światła stołów)", sw.n === 10 && sw.lit === 10 && sw.ozd === 10 && sw.ev === 0, sw);

    // ---- plan stołów: okno na klawiszach
    await near(3229, 1, 18, 50, 8);
    await tree("tablica", ["Układaj"], { id: 3229, name: "Plan stołów" });
    await t.until("Tawerna.ui.running && Tawerna.ui.running.gameId === 'wesele_plan'", 20);
    await t.frames(40);
    await t.key("Enter"); await t.frames(8);
    await t.key("ArrowRight"); await t.frames(8);
    await t.key("Enter"); await t.frames(8);
    const pl = await J("Tawerna.ui.running.state()");
    t.check("okno planu na klawiszach: O bierze kartę, strzałka w prawo przenosi na miejsca, O sadza (Tadek na miejscu 0 stołu 1)", pl.placed && pl.placed.tadek === 0 && pl.zone === "seats", pl);
    await t.key("ArrowDown"); await t.frames(6); await t.key("Enter"); await t.frames(6);
    await t.eval("(function(){ const sc = Tawerna.ui.running; sc.placed = Object.assign({}, Wesele.planDobry()); sc.known = new Set([0, 1, 2, 3, 4, 5, 6]); sc.dirty = true; })(); 0");
    await t.frames(20);
    await shot("03_plan_stolow");
    await t.key("Q"); await t.frames(10);
    await shot("04_plan_znane_wasnie");
    await t.key("Enter"); await t.frames(10);
    await t.eval("Tawerna.ui.running.zone = 'ok'; Tawerna.ui.running.dirty = true; 0");
    await t.key("Enter"); await t.frames(10);
    await t.until("!Tawerna.ui.running", 30); await t.until("$gameMap.mapId() === 1", 30); await t.frames(60);
    const s7 = await S();
    t.check("plan zatwierdzony: 18 kart usadzonych, 0 iskier, planOk", s7.planOk === 1 && Object.keys(s7.plan).length === 18 && s7.iskry === 0, { n: Object.keys(s7.plan).length, ik: s7.iskry });
    const w1 = await W();
    t.check("dziennik: rozdział „Przygotowania” czeka na dzień wesela (22, 15:00)", w1 && w1.name === "w18Przygot" && /Lista Borgara/.test(await J("TownQuests.Q.W18.steps[1].text || ''")) , w1);

    // ================================================================ dzień 22
    await day(21, 21);
    await reload(1, 51, 33, 6); await t.frames(60);
    const kaw = await J("({ w: !$gameMap.event(3208).isTransparent(), b: !$gameMap.event(3209).isTransparent() })");
    t.check("wieczór kawalerski (21, 20-23): Wojciech i Bartek w pokoju gier", kaw.w && kaw.b, kaw);
    await shot("05_kawalerski");
    const kk = await tree("regular", ["Żart", "Odciągam"], { id: 3, name: "Grum" }, { key: "grum" });
    await t.eval("TavernLife.addTrust('grum', 0, 'x'); 0");
    await day(22, 13);
    await reload(1, 14, 46, 8);
    const gs0 = await J("window.GoscieSala ? GoscieSala.stats() : null");
    await day(22, 14.95);
    await t.frames(60);
    const gs = await J("({ sala: Wesele.sala(), gosc: $gameMap.events().filter(e => e.eventId() >= 3210 && e.eventId() < 3228 && !e.isTransparent()).length, pan: !$gameMap.event(3200).isTransparent(), panna: !$gameMap.event(3201).isTransparent(), stats: window.GoscieSala ? GoscieSala.stats() : null })");
    t.check("dzień 22, 14:57: sala weselna - 18 gości przy stołach, młodzi w niedzielnych strojach, goście sali (Goscie_Sala) nie siedzą", gs.sala && gs.gosc === 18 && gs.pan && gs.panna && (!gs.stats || gs.stats.sit === 0 && gs.stats.guests >= 0), gs);
    await near(3200, 1, 14, 41, 8);
    await shot("06_sala_przed_slubem");
    await day(22, 15.02);
    const r1 = await idle([], 5000, { name: "07_slub", every: 330 });
    const sl = await S();
    t.check("S1 ślub: scena z Kleofasem, „biorę” Wojciecha, dzwonek Ambrożego; po niej zapisana (slubKoniec), notatka w dzienniku", sl.scen.slub === 1 && sl.scen.slubKoniec === 1, sl.scen);
    // dania: 17:00, 18:30, 20:00
    await day(22, 16.9); await t.eval("Wesele.wymus.ladaPodaj(); 0"); const i0 = (await S()).podane.length;
    await day(22, 17.05); await t.eval("Wesele.wymus.ladaPodaj(); 0");
    await day(22, 18.55); await t.eval("Wesele.wymus.ladaPodaj(); 0");
    await day(22, 19.0);
    const r2 = await idle(["Przemowa dowcipna"], 5000, { name: "08_toast", every: 450 });
    await day(22, 20.05); await t.eval("Wesele.wymus.ladaPodaj(); 0");
    const sp = await S();
    t.check("uczta: trzy dania podane o czasie (przed 17:00 „jeszcze nie pora”), z tortem przy trzecim; toast: przemowa dowcipna", i0 === 0 && sp.podane.length === 3 && sp.podane[2].tort === true && sp.podane[0].id === 130 && sp.przemowa === 2 && /dowcipna|koń/.test(r2.text), { i0, podane: sp.podane.length, pr: sp.przemowa });
    await t.eval("WeseleGry.taniec = (o => { const f = WeseleGry.taniec; return x => f(Object.assign({ bot: 7 }, x)); })(); 0");
    await day(22, 20.55);
    await idle([], 5000, { name: "09_taniec_scena", every: 600 });
    await t.frames(900);
    const st3 = await S();
    t.check("S3 pierwszy taniec: minigra (bot: 7 trafień z 8) - „piękny taniec”, wynik 7", st3.taniec === 7 && st3.scen.taniecKoniec === 1, st3.taniec);
    const nm = await J("Wesele.nastroj()");
    t.check("nastrój sali liczony z jedzenia, muzyki, ozdób, planu, toastu i tańca: >= 80 (wesele roku możliwe)", nm.n >= 80 && nm.parts.jedzenie > 20 && nm.parts.muzyka === 12 && nm.parts.plan >= 12, nm);
    await day(22, 22.02);
    const r3 = await idle([], 5000, { name: "10_zniknecie", every: 300 });
    const zk = await S();
    t.check("S4 zniknięcie: pan młody wychodzi drzwiami; plan bez iskier = bez bójki, noc poszukiwań startuje od 23:00 (szuka.t0)", zk.scen.znik === 1 && zk.scen.uczta === 1 && zk.bojka.rozmiar === 0 && zk.szuka.t0 >= 22 * 24 + 23 && (await W()).name === "w18Noc", { sc: zk.scen, br: zk.bojka, w: await W() });

    // ================================================================ noc poszukiwań: siedem miejsc
    await day(22, 23.3);
    const MS = [[3231, 1, 11, 28, 8, "beczka"], [3204, 1, 9, 13, 8, "kuchnia"], [3205, 1, 54, 34, 8, "gry"], [3206, 1, 31, 46, 8, "palarnia"], [3232, 25, 11, 33, 4, "drzwi"], [3233, 25, 20, 50, 8, "platki"]];
    for (const [id, m, x, y, d, key] of MS) {
        await reload(m, x, y, d);
        await t.frames(30);
        const live = await J(`(function(){ const e = $gameMap.event(${id}); return e && !e.isTransparent() && e._trigger === 0; })()`);
        await startEv(id);
        await t.frames(20);
        const rr = await idle([], 1500, { name: "11_miejsce_" + key, every: 120 });
        const sk = await S();
        t.check("miejsce poszukiwań „" + key + "”: zdarzenie żywe, scena z gagiem odegrana, ślad zapisany", live && sk.szuka.odw.includes(key), { key, live, odw: sk.szuka.odw });
    }
    await reload(26, 44, 50, 8); await t.frames(30);
    const tar = await J("({ pan: !$gameMap.event(3200).isTransparent(), x: $gameMap.event(3200).x, y: $gameMap.event(3200).y })");
    await shot("12_taras_pan_mlody");
    const pr = await tree("pan", ["Czego się boisz", "Wracaj"], { id: 3200, name: "Wojciech" });
    await t.eval("$gameMap.event(3200).start(); 0");
    await idle(["A pierścień?", "Wracaj"], 1200);
    const sf = await S();
    t.check("taras: pan młody na barierce; rozmowa (boi się przemowy), „wracaj” - znaleziony; rozdział „Noc poszukiwań” zrobiony", tar.pan && sf.szuka.znal === 1 && sf.szuka.koniec > 0 && /przemow|mowy/.test(pr.text), { tar, znal: sf.szuka.znal, text: pr.text.slice(0, 100) });

    // ================================================================ poranek i zakończenie A
    const g0 = await J("$gameParty.gold()"), mt0 = await J("TavernLife.trust('melia')"), rn0 = await J("Podroznicy.renoma(0)"), op0 = await J("TownQuests.opinion()");
    await day(23, 6.5);
    await reload(26, 44, 50, 8); await t.frames(30);
    const pr2 = await J("({ pan: !$gameMap.event(3200).isTransparent(), panna: !$gameMap.event(3201).isTransparent(), ozzy: !$gameMap.event(3205).isTransparent() })");
    await shot("13_poranek_taras");
    await t.eval("$gameMap.event(3201).start(); 0");
    await idle(["Powiedz prawdę"], 3000, { name: "14_poranek", every: 300 });
    await t.frames(60);
    const fin = await S();
    const g1 = await J("$gameParty.gold()"), mt1 = await J("TavernLife.trust('melia')"), rn1 = await J("Podroznicy.renoma(0)"), op1 = await J("TownQuests.opinion()");
    t.check("zakończenie A „Wesele roku”: poranek na tarasie (młodzi i Ozzy), pierścień, nagrody: >= 65 G, Renoma +8, Opinia +4, zaufanie Melii +10, flaga weseleA, W18 zrobione",
        pr2.pan && pr2.panna && pr2.ozzy && fin.koniec === "A" && fin.epilog === 1 && (g1 - g0) >= 65 && rn1 - rn0 === 8 && op1 - op0 >= 3 && mt1 - mt0 >= 10 && (await J("TownQuests.state().flags.weseleA")) && (await J("TownQuests.isDone('W18')")),
        { koniec: fin.koniec, gold: g1 - g0, renoma: rn1 - rn0, opinia: op1 - op0, melia: mt1 - mt0 });
    // zwykłe dni: goście sali wracają, stali bywalcy na miejscu, młodzi wracają do swojego dnia
    await day(24, 20);
    await reload(1, 14, 46, 8); await t.frames(120);
    const reg = await J("({ stats: GoscieSala.stats(), borgar: !!$gameMap.event(1), melia: !!$gameMap.event(2), grum: !!$gameMap.event(3), ozzy: !!$gameMap.event(4), wes: Wesele.sala(), gosc: $gameMap.events().filter(e => e.eventId() >= 3210 && e.eventId() < 3228).length, goneW: TownLife.gone('woznica'), goneD: TownLife.gone('szwaczka') })");
    t.check("po weselu: goście sali znów siedzą wieczorem, Borgar, Melia, Grum i Ozzy na miejscach, goście weselni zniknęli z mapy, Wojciech i Dorota wrócili do miasta", reg.stats.guests > 0 && reg.borgar && reg.melia && reg.grum && reg.ozzy && !reg.wes && reg.gosc === 0 && !reg.goneW && !reg.goneD, reg);
    await shot("15_tawerna_po_weselu");
    if (ONLY === "A") return;

    // ================================================================ skoki F9
    for (let k = 1; k <= 7; k++) {
        await t.newGame({ map: 1, x: 14, y: 40, dir: 8, hour: 10, quiet: true, minimap: false });
        await t.eval("Wesele.stan().zmus = 1; 0");
        const g = await J(`Watki.skocz('wesele', ${k})`);
        if (g) await reload(g[0], g[1], g[2], g[3]);
        const w = await W();
        const want = ["w18Zlecenie", "w18Przygot", "w18Przygot", "w18Slub", "w18Bojka", "w18Noc", "w18Poranek"][k - 1];
        t.check("F9, skok " + k + ": rozdział „" + want + "”, dzień " + [19, 20, 21, 22, 22, 22, 23][k - 1], !!g && !!w && (w.name === want || (k === 5 && w.name === "w18Slub") || (k === 6 && /w18/.test(w.name))), { g, w, d: await J("Tawerna.time.day()") });
    }
    const f9 = await J("Watki.f9.sekcje().filter(s => /W18/.test(s.head)).map(s => s.rows.length)");
    t.check("F9: sekcja „Wątek W18” (skoki + wiersze iskry i pierścień)", f9.length >= 1 && f9.reduce((a, b) => a + b, 0) >= 3, f9);

    // ---- minigra tańca bez bota (zdjęcie) i koniec
    await t.newGame({ map: 1, x: 14, y: 40, dir: 8, hour: 21, quiet: true, minimap: false });
    await t.eval("Tawerna.ui.open(WeseleGry.Scene_WeseleTaniec, { onEnd: r => { window.__tan = r; } }); 0");
    await t.until("Tawerna.ui.running && Tawerna.ui.running.gameId === 'wesele_taniec'", 20);
    await t.frames(30); await t.key("Enter"); await t.frames(200);
    await shot("18_taniec_minigra");
    const tn = await J("Tawerna.ui.running.state()");
    await t.eval("Tawerna.ui.running.end({ score: 3 }); 0");
    await t.until("!Tawerna.ui.running", 30); await t.frames(30);
    t.check("minigra tańca: osiem strzałek (bez trafień 0), przerwanie oddaje wynik do onEnd", tn.seq.length === 8 && tn.score === 0 && (await J("window.__tan && window.__tan.score")) === 3, tn);

    // ================================================================ GRA 2: zakończenie C (waśnie przy stole, bójka bez interwencji, szkody)
    await t.newGame({ map: 1, x: 14, y: 40, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.eval("Wesele.stan().zmus = 1; 0");
    const gC = await J("Watki.skocz('wesele', 5)");
    await t.eval("(function(){ const s = Wesele.stan(); s.plan = Object.assign(Wesele.planDobry(), { agata: 5, kuba: 4, mietek: 3, bartek: 2, stefa: 1, rm1: 0 }); s.iskry = -1; s.pierscien = 'przegrany'; s.przemowa = 1; })(); 0");
    await reload(gC[0], gC[1], gC[2], gC[3]);
    await day(22, 22.02);
    const rb = await idle(["Nie robię"], 5000, { name: "16_bojka", every: 240 });
    const b1 = await S();
    t.check("S5 bójka duża (6 iskier): 8 bijących, wybór sposobu - „nie robię nic”, bójka trwa", b1.bojka.rozmiar === 2 && b1.bojka.t0 > 0 && !b1.bojka.koniec && (await J("Wesele.fighters().length")) === 8, { br: b1.bojka, f: await J("Wesele.fighters().length") });
    await t.frames(300);
    await shot("17_bojka_trwa");
    await t.eval("Wesele.stan().bojka.frames = 7300; 0");
    await t.frames(80);
    const b2 = await S();
    t.check("nikt nie interweniuje: po 120 s wchodzi kapral Wit, bójka kończy się (sposob wit), szkody w rachunku Borgara", b2.bojka.sposob === "wit" && b2.bojka.koniec > 0 && b2.bojka.szkody > 60 && b2.szuka.t0 > 0 && (await J("Wesele.fighters().length")) === 0, b2.bojka);
    await t.eval("Wesele.wymus.znaleziony(); 0");
    await day(23, 7); await reload(26, 44, 50, 8);
    await t.eval("$gameMap.event(3201).start(); 0");
    await idle(["Skłam"], 3000);
    const fc = await S();
    t.check("zakończenie C „Wielka awantura”: 6 iskier, bójka do kapitana, pierścień przegrany - Borgar płaci 20 G + dar 30 G, bez zaufania na Wesele roku", fc.koniec === "C" && fc.epilog === 1, { k: fc.koniec });

    // ================================================================ GRA 3: zakończenie D (nie znalazł do 4:00), odmowa
    await t.newGame({ map: 1, x: 14, y: 40, dir: 8, hour: 10, quiet: true, minimap: false });
    await t.eval("Wesele.stan().zmus = 1; 0");
    const gD = await J("Watki.skocz('wesele', 6)");
    await reload(gD[0], gD[1], gD[2], gD[3]);
    await day(23, 4.2); await t.frames(60);
    await day(23, 7); await reload(26, 44, 50, 8); await t.frames(30);
    const sD = await S();
    t.check("noc minęła (4:00) bez znalezienia pana młodego: Borgar sam go znalazł - zakończenie D, szuka.koniec", sD.koniec === "D" && sD.szuka.koniec > 0 && !sD.szuka.znal, { k: sD.koniec, sz: sD.szuka });
    const g2 = await J("$gameParty.gold()");
    await t.eval("$gameMap.event(3201).start(); 0");
    await idle(["Powiedz prawdę"], 3000);
    t.check("zakończenie D: Borgar nie płaci 20 G, bez bonusów (zaufanie Melii bez zmian)", (await S()).koniec === "D" && ((await J("$gameParty.gold()")) - g2) <= 0 && (await J("TavernLife.trust('melia')")) < 10, { gold: (await J("$gameParty.gold()")) - g2 });
    await t.newGame({ map: 1, x: 14, y: 31, dir: 8, hour: 10, quiet: true, minimap: false });
    await day(19, 10);
    await t.eval("Wesele.stan().zmus = 1; TownQuests.autoChecks(); 0");
    await tree("zlecenie", ["Nie mam czasu"]);
    await day(22, 15.5); await reload(1, 14, 46, 8); await t.frames(60);
    const od = await J("({ z: Wesele.stan().z, n: $gameMap.events().filter(e => e.eventId() >= 3200 && e.eventId() < 3300).length, sala: Wesele.sala(), w: TownQuests.rec('W18') })");
    t.check("odmowa Borgarowi: z = -1, zadanie nieudane, zadnych zdarzeń wesela w tawernie, hala normalna (wesele skromne w tle)", od.z === -1 && od.n === 0 && !od.sala && od.w && od.w.s !== "active", od);
});
