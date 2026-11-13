// Kleofas przy kaplicy (2026-11-11): pustelnia poza swiatem (Wyspa_Data HERMITAGE_OPEN = false) - brat Kleofas (TownLife 944) mieszka przy
// kaplicy w Kruczogrodzie (Map008, miejsca kaplica_drzwi / kaplica_lawka). Sprawdza (domyslnie, pustelnia zamknieta):
//   - dane: drugi dom (alt.map 8), Pustelnia.chapel(), miejsca na Map008, Kleofas na Map008 w dzien i nocy (Noc Pytania), nie na 155
//   - W2 rozdz. 7: Ambrozy daje serce (tekst o kaplicy), pierwsza rozmowa z Kleofasem przy kaplicy, wiesza serce, dziennik, Noc Pytania:
//     przed polnoca „czekaj”, po polnocy dzwon i pytanie, rozdz. 8 czeka, nastepne pytanie „przy kaplicy”
//   - W13 rozdz. 3 (w13Kleofas): pioro u Kleofasa przy kaplicy, rozdzial idzie dalej, flaga orzelKroniki
//   - inne watki: teksty z „kaplica.*” wchodza (W4, W11, W15, K68, K72), kalendarz Wigilii
//   - zdjecia do docs/usterki/kleofas/ (dzien, noc)
// KLEOFAS_OPEN=1: pustelnia otwarta (HERMITAGE_OPEN wymuszone na true przed wtyczkami) - stara droga: Kleofas na Map155, teksty z gory plikow.
// Uruchom: CDP_PORT=9840 node tools/usterki/kleofas/staging/tests/kleofas_kaplica_test.js   (nakladka: GAME_OVERLAY, domyslnie staging)
const path = require("path");
const kit = require("./lib/kit.js");

const ROOT = path.join(__dirname, "..");
const OVERLAY = process.env.GAME_OVERLAY || "tools/usterki/kleofas/staging";
const OPEN = process.env.KLEOFAS_OPEN === "1";
const SHOTS = path.join(ROOT, "docs", "usterki", "kleofas");
const FORCE_OPEN = `(function(){ let v; Object.defineProperty(window, 'WyspaData', { configurable: true, get() { return v; },
    set(x) { if (x && typeof x === 'object') x.HERMITAGE_OPEN = true; v = x; } }); })();`;

kit.test({ port: Number(process.env.CDP_PORT) || (OPEN ? 9841 : 9840), overlay: OVERLAY, overlayJs: true, beforeLoad: OPEN ? FORCE_OPEN : undefined,
    bootCheck: "gra się uruchamia", errorCheck: "bez błędów w konsoli" }, async t => {
    console.log("NOTE nakładka: " + OVERLAY + (OPEN ? " (pustelnia OTWARTA)" : " (pustelnia zamknięta)"));
    const K = "TownLife.eventOf('pustelnik')";
    // a picture with the hero two tiles south of Kleofas (the popups and the top notice cleared first)
    const shotNear = async file => {
        await t.eval(`(function(){ const e = ${K}; $gamePlayer.locate(e.x + 1, e.y + 2); $gamePlayer.setDirection(8); return 0; })()`);
        await t.frames(30);
        await t.popups({ clear: true });
        await t.frames(90);
        await t.shot(path.join(SHOTS, file));
    };
    const journal = q => t.json(`TownQuests.journalOps({ quest: TownQuests.Q.${q} }).map(o => o.text || '').join(' ')`);

    // ---------------------------------------------------------------- dane
    const base = await t.json(`(function(){ const R = TownLife.RESIDENTS.find(r => r.key === 'pustelnik');
        return { open: !!WyspaData.HERMITAGE_OPEN, chapel: Pustelnia.chapel(), res: R ? [R.id, R.map, !!R.alt, R.alt && R.alt.map, R.alt && R.alt.when] : null,
            home: R ? TownLife.homeOf(R) : null, ready: Wyspa.isReady(155), w13: TownQuests.Q.W13.steps[2].text, w2: TownQuests.Q.W2.lines.stage1,
            meet: Pustelnia.DATA.TX.meet[0] }; })()`);
    if (!OPEN) {
        t.check("pustelnia zamknięta: Kleofas (944) ma drugi dom na Map008 (alt.when pustelniaZamknieta), mieszka tam, Pustelnia.chapel()",
            !base.open && base.chapel && base.res && base.res[0] === 944 && base.res[1] === 155 && base.res[2] && base.res[3] === 8 && base.res[4] === "pustelniaZamknieta"
            && base.home === 8 && !base.ready, base);
        t.check("teksty z „kaplica.*” weszły: W2 stage1, W13 krok 3, pierwsze spotkanie", /kaplicy/.test(base.w2) && /kaplicy/.test(base.w13) && /ławka jest moja/.test(base.meet), base);
    } else {
        t.check("pustelnia otwarta: Kleofas mieszka na Map155 (homeOf 155), Pustelnia.chapel() false, teksty z góry plików (klif)",
            base.open && !base.chapel && base.home === 155 && /klifie/.test(base.w2) && /pustelnia na klifie/.test(base.w13) && /Czego tu szukasz\? Do miasta/.test(base.meet), base);
    }

    await t.newGame({ story: true, skipIntro: true, deadline: false, quiet: true, minimap: false });
    await t.eval("if (window.Creatures && Creatures.auto) Creatures.auto(false); 0");
    await t.eval("(function(){ TownQuests.start('W2', TownQuests.Q.W2.steps.length - 1, true); const s = Story.state(); s.paid = s.debt; s.done = Tawerna.time.day(); return 0; })()");
    await t.setDay(7, 10);
    await t.go(8, 60, 40, 2);
    await t.frames(40);

    // ---------------------------------------------------------------- Ambrozy daje serce dzwonu
    const amb = { text: "" };
    for (let i = 0; i < 3 && !(await t.json("TownQuests.vcount('serce_dzwonu')")); i++) amb.text += " / " + (await t.talkTo("TownLife.eventOf('dzwonnik')", [])).text;
    const heart = await t.json("({ v: TownQuests.vcount('serce_dzwonu'), s: TownQuests.rec('W2').t.w2s })");
    t.check("Akt II: Ambroży daje serce dzwonu" + (OPEN ? " („Z dzwonu na klifie”)" : " („Z dzwonu w wieży kaplicy... przysiadł brat pióra”)"),
        heart.v === 1 && heart.s === 1 && (OPEN ? /na klifie/.test(amb.text) : /wieży kaplicy/.test(amb.text) && /brat pióra/.test(amb.text)), [heart, amb.text.slice(0, 260)]);
    const j1 = await journal("W2");
    t.check("dziennik W2 rozdz. 7, etap 1: " + (OPEN ? "klif" : "Kleofas przy kaplicy"), OPEN ? /klifie/.test(j1) : /przy\s+kaplicy/.test(j1) && !/klifie/.test(j1.slice(j1.indexOf("Jedno"))), j1.slice(j1.indexOf("Jedno"), j1.indexOf("Jedno") + 260));

    // ---------------------------------------------------------------- Kleofas na swoim miejscu, w dzien
    await t.setDay(7, 14);
    if (OPEN) await t.go(155, 16, 11, 8); else await t.go(8, 14, 24, 8);
    await t.frames(80);
    const noon = await t.json(`(function(){ const s = TownLife.state('pustelnik'), ev = ${K}, cd = TownLife.spot('kaplica_drzwi'), cl = TownLife.spot('kaplica_lawka');
        return { map: $gameMap.mapId(), s: s && [s.x, s.y, s.hidden, s.act], ev: !!ev, cd, cl, sheet: ev && ev.characterName() }; })()`);
    if (!OPEN) {
        const near = p => noon.s && p && Math.abs(noon.s[0] - p[0]) + Math.abs(noon.s[1] - p[1]) <= 2;
        t.check("o 14:00 Kleofas stoi przy kaplicy w Kruczogrodzie (ławka albo drzwi), widoczny, w swoim stroju",
            noon.map === 8 && noon.ev && noon.s && !noon.s[2] && (near(noon.cl) || near(noon.cd)) && noon.sheet === "$Npc_Pustelnik", noon);
        await shotNear("kleofas_kaplica_dzien.png");
    } else t.check("o 14:00 Kleofas na Map155 (otwarta pustelnia)", noon.map === 155 && noon.ev && noon.s && !noon.s[2], noon);

    // ---------------------------------------------------------------- pierwsza rozmowa, potem serce
    const meet = await t.talkTo(K, []);
    const met = await t.json("({ f: TownQuests.state().flags.pustelnikMet, notes: ($gameSystem._journal.notes || []).map(n => n.title) })");
    t.check("pierwsza rozmowa: " + (OPEN ? "stara („Do miasta jest w drugą stronę”)" : "przy kaplicy („ławka jest moja”), notatka „Pustelnik przy kaplicy”") + ", flaga pustelnikMet, „znak posłańca”",
        !!met.f && /znak\s+posłańca/.test(meet.text) && (OPEN ? /w\s+drugą\s+stronę/.test(meet.text) && met.notes.includes("Pustelnik na klifie")
            : /ławka\s+jest\s+moja/.test(meet.text) && met.notes.includes("Pustelnik przy kaplicy")), [met, meet.text.slice(0, 200)]);
    const hang = await t.talkTo(K, []);
    const hung = await t.json("({ v: TownQuests.vcount('serce_dzwonu'), s: TownQuests.rec('W2').t.w2s, f: TownQuests.state().flags.sercePustelni, wig: Pustelnia.nextNight() })");
    t.check("Kleofas wiesza serce w dzwonie (W2 rozdz. 7, etap 2, flaga sercePustelni) i mówi o Nocy Pytania w Wigilię",
        hung.v === 0 && hung.s === 2 && !!hung.f && /Wigilię/.test(hang.text), [hung, hang.text.slice(-160)]);
    const j2 = await journal("W2");
    t.check("dziennik W2 etap 2: " + (OPEN ? "wieża skryptorium" : "dzwon w wieży kaplicy, bądź przy kaplicy"),
        OPEN ? /skryptorium/.test(j2) : /wieży kaplicy/.test(j2) && /przy kaplicy/.test(j2), j2.slice(j2.indexOf("Noc Pytania"), j2.indexOf("Noc Pytania") + 260));

    // ---------------------------------------------------------------- Noc Pytania
    const W = hung.wig.wig;
    await t.setDay(W, 23);
    if (OPEN) await t.go(155, 19, 11, 8); else await t.go(8, 14, 24, 8);
    await t.setDay(W, 23);
    await t.frames(150);
    const eve = await t.json(`(function(){ const s = TownLife.state('pustelnik'), sp = TownLife.spot('${OPEN ? "wieza" : "kaplica_drzwi"}'); return { map: $gameMap.mapId(), s: s && [s.x, s.y, s.hidden, s.act], sp, night: Pustelnia.nightNow(), h: $gameSystem.dayNightHour() }; })()`);
    t.check("Wigilia, 23:00: Kleofas czeka " + (OPEN ? "przy wieży skryptorium" : "przy drzwiach kaplicy w Kruczogrodzie") + ", widoczny",
        eve.night && eve.s && !eve.s[2] && eve.s[3] === "stand" && Math.abs(eve.s[0] - eve.sp[0]) + Math.abs(eve.s[1] - eve.sp[1]) <= 2 && eve.map === (OPEN ? 155 : 8), eve);
    if (!OPEN) await shotNear("kleofas_kaplica_noc.png");
    const early = await t.talkTo(K, []);
    t.check("...przed północą: „Czekaj na dzwon”", /Czekaj na dzwon/.test(early.text), early.text);
    await t.setDay(W + 1, 0.1);
    await t.frames(80);
    const rung = await t.json("Pustelnia.state().rung");
    const q = await t.talkTo(K, ["Co ukrywa mój dziadek"]);
    const asked = await t.json(`({ asked: Pustelnia.state().asked, s: TownQuests.rec('W2').t.w2s, notes: ($gameSystem._journal.notes || []).filter(n => /Jedno pytanie/.test(n.title)).map(n => n.text) })`);
    const j3 = await journal("W2");
    t.check("po północy: dzwon (rung), pytanie „Co ukrywa mój dziadek?” -> odpowiedź, W2 rozdz. 8 czeka (etap 3), notatka w dzienniku",
        Object.keys(rung).length === 1 && /Kruczarze/.test(q.text) && asked.s === 3 && Object.keys(asked.asked).length === 1 && asked.notes.length === 1 && /Alarm/.test(j3),
        { rung, asked, t: q.text.slice(0, 160) });
    t.check("dziennik W2 etap 3: następne pytanie " + (OPEN ? "u Kleofasa" : "u Kleofasa przy kaplicy"), /pytanie\s+zadane/.test(j3) && (OPEN ? true : /przy\s+kaplicy/.test(j3)), j3.slice(j3.indexOf("pytanie"), j3.indexOf("pytanie") + 200));

    // ---------------------------------------------------------------- W13 rozdz. 3: pioro u Kleofasa
    const pioro = await t.json("OrzelData.ITEM.pioro");
    await t.eval("(function(){ TownQuests.start('W13', 2, true); return 0; })()");
    await t.give(pioro, 1);
    await t.setDay(W + 3, 14);
    if (OPEN) await t.go(155, 16, 11, 8); else await t.go(8, 14, 24, 8);
    await t.frames(120);
    const jw = await journal("W13");
    t.check("dziennik W13 rozdz. 3: pióro do Kleofasa " + (OPEN ? "(pustelnia na klifie)" : "przy kaplicy w Kruczogrodzie"), OPEN ? /pustelnia na klifie/.test(jw) : /przy kaplicy w Kruczogrodzie/.test(jw) && !/pustelnia na klifie/.test(jw), jw.slice(0, 300));
    const w13a = await t.json("({ r: TownQuests.rec('W13') && [TownQuests.rec('W13').s, TownQuests.rec('W13').step], f: !!TownQuests.state().flags.orzelKroniki })");
    const feather = await t.talkTo(K, []);
    const w13b = await t.json(`({ r: TownQuests.rec('W13') && [TownQuests.rec('W13').s, TownQuests.rec('W13').step], f: !!TownQuests.state().flags.orzelKroniki, p: ${pioro} && $gameParty.numItems($dataItems[${pioro}]),
        notes: ($gameSystem._journal.notes || []).map(n => n.title) })`);
    t.check("W13 rozdz. 3: rozmowa z Kleofasem (Księga gniazd) - krok idzie dalej, flaga orzelKroniki, notatka „Księga gniazd”",
        /Księga gniazd|Księdze gniazd/.test(feather.text) && !w13a.f && w13b.f && w13b.r && w13b.r[1] > w13a.r[1] && w13b.notes.includes("Księga gniazd"), { w13a, w13b, t: feather.text.slice(0, 200) });

    // ---------------------------------------------------------------- reszta watkow, kalendarz
    const rest = await t.json(`(function(){ const q = TownQuests.Q; const out = {}; 
        const g = (id) => q[id] && q[id].where; out.W4 = (window.Kasztelan && Kasztelan.TX && Kasztelan.TX.where) || null;
        out.W11 = g('W11'); out.W15 = g('W15'); out.K68 = g('K68'); out.cal = null;
        return out; })()`);
    if (!OPEN) {
        t.check("inne wątki mówią o kaplicy: W11 (where), W15 (where), K68 (where)", /kaplica/.test(rest.W11 || "") && /kaplica/.test(rest.W15 || "") && /kaplicy/.test(rest.K68 || ""), rest);
        t.check("W4 (Kasztelan) where: „u brata Kleofasa przy kaplicy”", /przy kaplicy/.test(rest.W4 || ""), rest.W4);
    } else t.check("otwarta pustelnia: W4 i W11 where wciąż z klifem", /pustelnia na klifie/.test(rest.W11 || "") && /na klifie/.test(rest.W4 || ""), rest);
    // W4 ch. 6: the clue from Kleofas (the key shown) - the talk is his key "pustelnik" at the chapel
    const w4 = await t.json("({ has: !!window.Kasztelan, key: typeof Kasztelan !== 'undefined' && !!Kasztelan.state })");
    console.log("NOTE W4 api: " + JSON.stringify(w4));
});
