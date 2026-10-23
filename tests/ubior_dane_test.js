// Ubiór - dane i handel (js/plugins/Ubior_Data.js + Ubior_Sklepy.js; nie ma ich jeszcze w js/plugins.js - test wkłada je do strony) na
// danych z tools/ubior/staging (przedmioty 250+, notatki 113/114/171, ikony 528+) - BEZ instalacji: przedmioty trafiają tylko do
// $dataItems w stronie, ikony do IconSet w pamięci. Sprawdza:
//   - dane: każdy przedmiot ma poprawny wzór (rampa 4-6 kolorów od ciemnego, nakładka) i miejsce, Equipment kładzie go na swoją część,
//     klucze wzorów z docs/ekwipunek/PLAN.md, sklepy sprzedają istniejące rzeczy;
//   - start: bohater w łachmanie (tors pusty);
//   - kupno u każdego sprzedawcy (złoto ubywa, rzecz w torbie, zakłada się na wolne miejsce, na zajęte - zostaje w torbie), używane u
//     szmaciarza, brak złota, kantor (odświętna koszula wśród towarów);
//   - sprzedaż, farbowanie (zużycie i założenie zostają), naprawa (kto co naprawia);
//   - bonusy: kapelusz (wolniejsze pragnienie w upał - Needs naprawdę), kaftan (mniej zimna - Survival.costFactor), pas / torba (udźwig),
//     łapcie (chód), rękawice, opaska, skórzane spodnie przy krzaku, zielona kurta (pancerz), schludność (Opinia), sakiewka (rabunek);
//   - zużycie przy pracy i od ciosu, karta Ekwipunku (opis, gdzie kupić);
//   - rozmowa z Agatą na rynku (menu w dymku) i okno sklepu klawiszami (zrzut: tests/ubior_dane/), wiersze F9, brak błędów w konsoli.
//   node tests/ubior_dane_test.js          (port CDP 9576; CDP_PORT=... inny)
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");

const STAGING = path.join(__dirname, "..", "tools", "ubior", "staging");
const OUT = path.join(__dirname, "ubior_dane");
fs.mkdirSync(OUT, { recursive: true });
const ITEMS = JSON.parse(fs.readFileSync(path.join(STAGING, "Items_dopisek.json"), "utf8"));
const NOTES = JSON.parse(fs.readFileSync(path.join(STAGING, "Items_notatki.json"), "utf8"));
// the keys of docs/ekwipunek/PLAN.md section 5
const PLAN_KEYS = {
    glowa: ["kapelusz_slomkowy", "kapelusz_slomkowy_ciemny", "chusta_biala", "chusta_czerwona", "chusta_niebieska", "czapka_filc_braz", "czapka_filc_szara",
        "czapka_filc_zielona", "opaska_braz", "opaska_czarna"],
    tors: ["koszula_lniana_biala", "koszula_lniana_zolta", "koszula_lniana_niebieska", "kaftan_czerwony", "kaftan_brazowy", "kaftan_granatowy", "kurta_zielona",
        "kurta_brazowa", "koszula_odswietna"],
    nogi: ["spodnie_plocienne_szare", "spodnie_plocienne_niebieskie", "spodnie_plocienne_brazowe", "spodnie_welniane_brazowe", "spodnie_welniane_zielone",
        "spodnie_skorzane_czarne", "spodnie_skorzane_brazowe"],
    stopy: ["lapcie", "buty_brazowe", "buty_czarne"],
    pas: ["pas_skorzany_braz", "pas_skorzany_czarny", "pas_sakiewka"],
    rece: ["rekawice_brazowe", "rekawice_szare"],
    plecy: ["plecak", "torba_plocienna", "torba_skorzana"]
};

kit.test({ port: 9576, plugins: ["Equipment", "Ubior_Data", "Ubior_Sklepy"] }, async t => {
    t.check("Ubior_Data i Ubior_Sklepy w stronie", ["injected", "registered"].includes(t.plugins.Ubior_Data) && ["injected", "registered"].includes(t.plugins.Ubior_Sklepy), t.plugins);

    // ---- the staging into the page: the items (metadata parsed as the engine does), the notes of 113/114/171, the icons under IconSet
    const loaded = await t.json(`(function(){ const add = ${JSON.stringify(ITEMS)}, notes = ${JSON.stringify(NOTES)};
        for (const it of add) { DataManager.extractMetadata(it); $dataItems[it.id] = it; }
        for (const id of Object.keys(notes)) { const it = $dataItems[id]; if (it.note.indexOf(notes[id]) < 0) it.note = it.note ? it.note + "\\n" + notes[id] : notes[id]; DataManager.extractMetadata(it); }
        Equipment.readNotes(); Ubior_Sklepy.wire();
        return { len: $dataItems.length, last: $dataItems[249 + add.length].name }; })()`);
    // (2026-10-23: after the clothes the armour's reserve 284-299 and the weapons 300+ may follow - tools/bron/instaluj_dane.py)
    t.check("staging w $dataItems (250-" + (249 + ITEMS.length) + ")", loaded.len >= 250 + ITEMS.length && loaded.last === ITEMS[ITEMS.length - 1].name, loaded);
    await t.eval(`(function(){ const old = ImageManager.loadSystem("IconSet"), add = Bitmap.load("tools/ubior/staging/IconSet_nowe.png");
        window.__iconsDone = false;
        const join = () => { if (!old.isReady() || !add.isReady()) return setTimeout(join, 50);
            const b = new Bitmap(512, old.height + add.height); b.blt(old, 0, 0, 512, old.height, 0, 0); b.blt(add, 0, 0, 512, add.height, 0, old.height);
            ImageManager._system["img/system/IconSet.png"] = b; window.__iconsDone = b.height; };
        join(); return 0; })()`);
    t.check("ikony 528+ doklejone w pamięci", await t.until("window.__iconsDone > 1056", 15), await t.eval("window.__iconsDone"));

    // ---- the data
    const data = await t.json(`(function(){ const D = Ubior_Data, E = Equipment, bad = [], hexOk = c => /^#[0-9a-f]{6}$/i.test(c);
        const luma = c => 0.299 * parseInt(c.slice(1, 3), 16) + 0.587 * parseInt(c.slice(3, 5), 16) + 0.114 * parseInt(c.slice(5, 7), 16);
        for (const w of Object.keys(D.WZORY)) { const z = D.WZORY[w];
            if (!D.MIEJSCA[z.miejsce]) bad.push(w + ": miejsce " + z.miejsce);
            if (!Array.isArray(z.rampa) || z.rampa.length < 4 || z.rampa.length > 6 || !z.rampa.every(hexOk)) bad.push(w + ": rampa");
            else if (z.rampa.some((c, i) => i && luma(c) < luma(z.rampa[i - 1]))) bad.push(w + ": rampa nie od ciemnego do jasnego");
            if (!z.nakladka && !z.czesc) bad.push(w + ": ani części, ani nakładki");
            if (z.nakladka && !/^Ubior_[A-Za-z]+$/.test(z.nakladka)) bad.push(w + ": nakładka " + z.nakladka); }
        for (const p of D.PRZEDMIOTY) { const it = $dataItems[p.id], z = D.WZORY[p.wzor];
            if (!z) { bad.push(p.id + ": wzór " + p.wzor); continue; }
            if (z.miejsce !== p.miejsce) bad.push(p.id + ": miejsce " + p.miejsce + " a wzór " + z.miejsce);
            if (!it || !it.name) { bad.push(p.id + ": brak w $dataItems"); continue; }
            if (it.meta.Ubior !== p.miejsce + "," + p.wzor) bad.push(p.id + ": notatka " + it.meta.Ubior);
            if (E.WEARABLE[p.id] !== D.MIEJSCA[p.miejsce].eq) bad.push(p.id + ": Equipment " + E.WEARABLE[p.id]);
            if (!E.SLOTS.find(s => s.id === D.MIEJSCA[p.miejsce].eq).items.includes(p.id)) bad.push(p.id + ": nie w SLOTS");
            if (p.id >= 250 && (it.iconIndex !== 528 + p.id - 250 || it.name !== p.nazwa || it.price !== p.cena)) bad.push(p.id + ": ikona / nazwa / cena");
            if (p.id >= 250 && !/<Weight:\\d+>/.test(it.note)) bad.push(p.id + ": waga"); }
        for (const k of Object.keys(D.SKLEPY)) for (const w of D.SKLEPY[k].sprzedaje.concat(D.SKLEPY[k].uzywane ? D.SKLEPY[k].uzywane.z : [])) {
            const p = D.poWzorze(w); if (!p || !p.cena || !$dataItems[p.id]) bad.push(k + ": " + w); }
        const keys = {}; for (const w of Object.keys(D.WZORY)) (keys[D.WZORY[w].miejsce] = keys[D.WZORY[w].miejsce] || []).push(w);
        return { bad, keys, n: D.PRZEDMIOTY.length, old: [113, 114, 171].map(id => E.WEARABLE[id]) }; })()`);
    t.check("dane: każdy przedmiot ma poprawny wzór (rampa od ciemnego) i miejsce, notatkę, część w Equipment", data.bad.length === 0 && data.n === ITEMS.length + 3, data.bad.slice(0, 8));
    t.check("klucze wzorów jak w PLAN.md (sekcja 5)", JSON.stringify(Object.keys(PLAN_KEYS).map(m => (data.keys[m] || []).slice().sort())) === JSON.stringify(Object.keys(PLAN_KEYS).map(m => PLAN_KEYS[m].slice().sort())), data.keys);
    t.check("stare 113 / 114 / 171 na swoich miejscach", JSON.stringify(data.old) === JSON.stringify(["feet", "back", "torso"]), data.old);

    // ---- a new game: the hero in rags
    const ok = await t.newGame({ hour: 12, day: 35, quiet: true, minimap: false });
    t.check("nowa gra", ok);
    if (!ok) return;
    await t.eval("Ubior_Sklepy.refresh(); 0");
    const start = await t.json("({ torso: Equipment.current('torso'), head: Equipment.current('head'), stroj: Ubior_Data.stroj(), wired: Ubior_Sklepy.wired() })");
    t.check("start: łachman (tors pusty, nic na głowie), Ubior_Data.stroj() pusty", start.torso === 0 && start.head === 0 && Object.keys(start.stroj).length === 0, start);
    t.check("podpięte: Combat.perk, Combat.carryBonus, Durability, rozmowy", start.wired.perk && start.wired.carry && start.wired.durability && start.wired.talk, start.wired);

    // ---- buying at each seller
    await t.gold(500);
    const buy = (key, wzor, used) => t.json(`(function(){ const g0 = $gameParty.gold(), p = Ubior_Data.poWzorze(${JSON.stringify(wzor)}), r = Ubior_Sklepy.kup(${JSON.stringify(key)}, ${JSON.stringify(wzor)}, ${!!used});
        return { r, paid: g0 - $gameParty.gold(), n: $gameParty.numItems($dataItems[p.id]), worn: Equipment.worn(p.id), id: p.id, cena: p.cena }; })()`);
    const b1 = await buy("szwaczka", "koszula_lniana_biala");
    t.check("szwaczka: biała lniana koszula za 8 G, w torbie i od razu na torsie (było pusto)", b1.r.ok && b1.paid === 8 && b1.n === 1 && b1.worn, b1);
    const b2 = await buy("garbarz", "pas_skorzany_braz");
    t.check("garbarz: skórzany pas za 12 G, założony", b2.r.ok && b2.paid === 12 && b2.n === 1 && b2.worn, b2);
    const b3 = await buy("przekupka", "kapelusz_slomkowy");
    t.check("przekupka: słomkowy kapelusz za 12 G, założony", b3.r.ok && b3.paid === 12 && b3.worn, b3);
    const b4 = await buy("szmaciarz", "chusta_czerwona");
    t.check("szmaciarz: chusta za 6 G - głowa zajęta, więc zostaje w torbie", b4.r.ok && b4.paid === 6 && b4.n === 1 && !b4.worn, b4);
    const used = await t.json("Ubior_Sklepy.usedToday('szmaciarz')");
    if (used.length) {
        const b5 = await buy("szmaciarz", used[0], true);
        const left = await t.json(`({ left: Durability.left(${b5.id}), life: Durability.lifeOf(${b5.id}), again: Ubior_Sklepy.usedToday('szmaciarz').includes(${JSON.stringify(used[0])}) })`);
        t.check("szmaciarz: używana rzecz za pół ceny, zużyta w połowie, raz na dzień", b5.r.ok && b5.paid === Math.round(b5.cena * 0.5) && Math.abs(left.left - left.life / 2) <= 1 && !left.again, { b5, left, used });
    } else t.check("szmaciarz: używane rzeczy na dziś", false, used);
    const poor = await t.json("(function(){ const g = $gameParty.gold(); $gameParty.loseGold(g - 3); const r = Ubior_Sklepy.kup('garbarz', 'kurta_zielona'); const n = $gameParty.numItems($dataItems[266]); $gameParty.gainGold(500); return { r, n }; })()");
    t.check("za mało złota: „Potrzebujesz 40 G”, nic nie kupione", !poor.r.ok && /Potrzebujesz 40 G/.test(poor.r.why) && poor.n === 0, poor);
    const kantor = await t.json("(function(){ Ubior_Sklepy.wire(); const K = window.KantorData; return K ? K.GOODS.filter(g => g.id === 267) : null; })()");
    t.check("kantor: odświętna koszula wśród towarów (60 G)", Array.isArray(kantor) && kantor.length === 1 && kantor[0].price === 60, kantor);

    // ---- selling
    const sell = await t.json(`(function(){ const g0 = $gameParty.gold(), r = Ubior_Sklepy.sprzedaj('szmaciarz', 253), n = $gameParty.numItems($dataItems[253]);
        const wrong = Ubior_Sklepy.sprzedaj('szwaczka', 277); return { r, got: $gameParty.gold() - g0, n, wrong, belt: Equipment.worn(277) }; })()`);
    t.check("sprzedaż: chusta u szmaciarza (20% ceny), pasa szwaczka nie kupi", sell.r.ok && sell.got === Math.max(1, Math.round(6 * 0.2)) && sell.n === 0 && !sell.wrong.ok && sell.belt, sell);
    const sell2 = await t.json(`(function(){ Ubior_Sklepy.kup('garbarz', 'rekawice_szare'); Durability.setUsed(281, Durability.lifeOf(281) / 2); const g0 = $gameParty.gold(), r = Ubior_Sklepy.sprzedaj('garbarz', 281);
        return { r, got: $gameParty.gold() - g0, worn: Equipment.worn(281), hands: Equipment.current('hands') }; })()`);
    t.check("sprzedaż: zużyte rękawice u garbarza za mniej (40% ceny × połowa), schodzą z rąk", sell2.r.ok && sell2.got === Math.round(15 * 0.4 * 0.5) && sell2.hands === 0, sell2);

    // ---- dyeing: the white shirt (worn, a little worn out) -> yellow
    const dye = await t.json(`(function(){ Durability.setUsed(260, 6); const g0 = $gameParty.gold(), r = Ubior_Sklepy.farbuj('szwaczka', 'koszula_lniana_biala', 'koszula_lniana_zolta');
        return { r, paid: g0 - $gameParty.gold(), white: $gameParty.numItems($dataItems[260]), yellow: $gameParty.numItems($dataItems[261]), on: Equipment.current('torso'),
            used: Durability.used(261), usedWhite: Durability.used(260), back: Ubior_Sklepy.farbuj('szwaczka', 'koszula_lniana_niebieska', 'koszula_lniana_biala') }; })()`);
    t.check("farbowanie u szwaczki: biała -> żółta za 4 G, założona dalej, zużycie zostaje; niebieskiej nie rozjaśni",
        dye.r.ok && dye.paid === 4 && dye.white === 0 && dye.yellow === 1 && dye.on === 261 && Math.abs(dye.used - 6) < 1e-6 && dye.usedWhite === 0 && !dye.back.ok, dye);

    // ---- repair: the seamstress the cloth, the tanner the leather
    const fix = await t.json(`(function(){ Durability.setUsed(261, 15); const g0 = $gameParty.gold(); const no = Ubior_Sklepy.napraw('garbarz', 261);
        const r = Ubior_Sklepy.napraw('szwaczka', 261); const paid = g0 - $gameParty.gold(); Durability.setUsed(277, 40); const belt = Ubior_Sklepy.napraw('garbarz', 277);
        return { no, r, paid, used: Durability.used(261), belt, beltUsed: Durability.used(277), tabs: Ubior_Sklepy.tabsOf('szwaczka'), tabsG: Ubior_Sklepy.tabsOf('garbarz') }; })()`);
    t.check("naprawa: szwaczka łata koszulę (za grosze), garbarz jej nie weźmie, ale łata pas", fix.r.ok && fix.paid === Math.round(11 * 0.3 * 0.5) && fix.used === 0 && !fix.no.ok && fix.belt.ok && fix.beltUsed === 0, fix);
    t.check("zakładki: szwaczka kup/sprzedaj/napraw/farbuj, garbarz bez farbowania", JSON.stringify(fix.tabs) === '["kup","sprzedaj","napraw","farbuj"]' && JSON.stringify(fix.tabsG) === '["kup","sprzedaj","napraw"]', fix);

    // ---- the bonuses
    // the hat: summer noon outdoors - thirst slower (Combat.perk and Needs itself)
    const hat = await t.json(`(function(){ const N = window.Needs; N.setEnabled(true);
        const run = on => { if (on) Equipment.equip('head', 250); else Equipment.unequip('head'); Ubior_Sklepy.refresh(); const st = N.state();
            st.water = 100; N.decay(3, 1); return { lost: 100 - st.water, perk: Combat.perk('thirst'), heat: Ubior_Sklepy.heat() }; };
        const on = run(true), off = run(false); Equipment.equip('head', 250); N.setEnabled(false); return { on, off }; })()`);
    t.check("kapelusz: w upał (lato, południe, na dworze) pragnienie rośnie wolniej (perk +0,2, mniej wody ubywa)",
        hat.on.heat && Math.abs(hat.on.perk - hat.off.perk - 0.2) < 1e-9 && hat.on.lost < hat.off.lost, hat);
    // the kaftan: winter outdoors, no cloak - the cold costs less
    const cold = await t.json(`(function(){ $gameSystem._dayNightDay = 90; $gameSystem.setDayNightHour(12); Ubior_Sklepy.kup('szwaczka', 'kaftan_czerwony');
        const cf = () => { Ubior_Sklepy.refresh(); return { cold: $gameSystem.isCold(), f: Survival.costFactor(), perk: Combat.perk('cold') }; };
        Equipment.equip('torso', 261); const shirt = cf(); Equipment.equip('torso', 263); const kaftan = cf(); $gameSystem._dayNightDay = 35; return { shirt, kaftan }; })()`);
    t.check("kaftan: zimą na dworze mniej marzniesz (koszt pracy niższy niż w koszuli)", cold.shirt.cold && cold.kaftan.cold && cold.kaftan.f < cold.shirt.f && Math.abs(cold.kaftan.perk - cold.shirt.perk - 0.35) < 1e-9, cold);
    // the belt and the bag: the load
    const load = await t.json(`(function(){ const cap = () => { Ubior_Sklepy.refresh(); return Survival.weightCap(); };
        const withBelt = cap(); Equipment.unequip('belt'); const without = cap(); Equipment.equip('belt', 277); Ubior_Sklepy.kup('szwaczka', 'torba_plocienna');
        const bag = cap(); return { withBelt, without, bag, back: Equipment.current('back') }; })()`);
    t.check("pas: udźwig +10, płócienna torba na plecach: +20 więcej", load.withBelt - load.without === 10 && load.back === 282 && load.bag - load.withBelt === 20, load);
    // the bast shoes: the walk
    const walk = await t.json(`(function(){ const d0 = $gamePlayer.distancePerFrame(); Ubior_Sklepy.kup('szmaciarz', 'lapcie'); Ubior_Sklepy.refresh();
        const d1 = $gamePlayer.distancePerFrame(); return { d0, d1, feet: Equipment.current('feet') }; })()`);
    t.check("łapcie: chód o 4% szybszy", walk.feet === 275 && Math.abs(walk.d1 / walk.d0 - 1.04) < 1e-6, walk);
    // the gloves, the headband, the leather trousers by a bush
    const work = await t.json(`(function(){ const p = k => Combat.perk(k); const g0 = p('gather.cost'), f0 = p('farm.cost'), s0 = p('stamina.cost');
        Ubior_Sklepy.kup('garbarz', 'rekawice_brazowe'); Ubior_Sklepy.kup('garbarz', 'spodnie_skorzane_czarne'); Equipment.equip('legs', 273); Equipment.equip('head', 258) || (Ubior_Sklepy.kup('garbarz', 'opaska_braz'), Equipment.equip('head', 258));
        Ubior_Sklepy.refresh(); return { gather: p('gather.cost') - g0, farm: p('farm.cost') - f0, stam: p('stamina.cost') - s0, legs: Equipment.current('legs'), head: Equipment.current('head') }; })()`);
    t.check("rękawice: rąbanie / kopanie -10%, motyka -5%; opaska: praca -3%; skórzane spodnie nic poza krzakiem",
        Math.abs(work.gather - 0.1) < 1e-9 && Math.abs(work.farm - 0.05) < 1e-9 && Math.abs(work.stam - 0.03) < 1e-9 && work.legs === 273 && work.head === 258, work);
    const bush = await t.json(`(function(){ const ev = $gameMap.events().find(e => { const P = Tawerna.api("ChoppableTree_parts"); return P && P.objects.bushConfig(e); });
        if (!ev) return { none: true }; const it = $gameMap._interpreter, was = it._list; const base = Combat.perk('gather.cost');
        it.setup([{ code: 230, indent: 0, parameters: [60] }, { code: 0, indent: 0, parameters: [] }], ev.eventId()); const at = Combat.perk('gather.cost'); it.clear(); return { base, at, id: ev.eventId() }; })()`);
    t.check("skórzane spodnie: przy krzaku wycinanie o 30% lżejsze", bush.none || Math.abs(bush.at - bush.base - 0.3) < 1e-9, bush);
    // the green jacket: armour
    const armor = await t.json(`(function(){ Ubior_Sklepy.kup('garbarz', 'kurta_zielona'); Equipment.equip('torso', 266); return { a: Combat.armor(), tool: Durability.TOOLS[266] }; })()`);
    t.check("zielona kurta: pancerz jak skórzana kurtka (cios -20%), zużywa się od ciosów", armor.a && armor.a.id === 266 && armor.a.reduce === 0.2 && armor.tool && armor.tool.unit === "block", armor);
    // neatness: the yellow shirt back on - the opinion's gains grow by a quarter
    const neat = await t.json(`(function(){ Equipment.equip('torso', 261); Ubior_Sklepy.refresh(); const q = TownQuests, o0 = q.opinion(); q.addOpinion(4, "test"); const o1 = q.opinion();
        Equipment.unequip('torso'); Ubior_Sklepy.refresh(); q.addOpinion(4, "test"); const o2 = q.opinion(); Equipment.equip('torso', 261); return { o0, o1, o2, n: Ubior_Sklepy.schludnosc() }; })()`);
    t.check("lniana koszula: schludność - zysk Opinii +25% (4 -> 5), w łachmanie bez dodatku", neat.o1 - neat.o0 === 5 && neat.o2 - neat.o1 === 4 && neat.n === 1, neat);
    // the pouch: a robbery leaves half the money
    const rob = await t.json(`(function(){ Ubior_Sklepy.kup('garbarz', 'pas_sakiewka'); Equipment.equip('belt', 279); Ubior_Sklepy.refresh(); const g0 = $gameParty.gold();
        Tawerna.emit("heroRobbed", { tag: "test", gold: 40, items: [] }); const got = $gameParty.gold() - g0; Equipment.equip('belt', 277); Ubior_Sklepy.refresh(); return { got }; })()`);
    t.check("pas z sakiewką: przy rabunku połowa groszy wraca (+20 z 40)", rob.got === 20, rob);

    // ---- the wear: work and a blow
    const wear = await t.json(`(function(){ Equipment.equip('torso', 261); Ubior_Sklepy.refresh(); const u0 = Durability.used(261), b0 = Durability.used(277);
        $gameSystem.setStamina(100); $gameSystem.trySpendStamina(40); const u1 = Durability.used(261);
        Tawerna.emit("heroHit", { result: "hit", damage: 5 }); const u2 = Durability.used(261);
        return { work: u1 - u0, hit: u2 - u1, belt: Durability.used(277) - b0, unit: Durability.unitWord(261, 3), kurta: Durability.used(266) }; })()`);
    t.check("zużycie: 40 sił pracy = 0,4 dnia, cios 0,1 (każda założona rzecz); jednostka „dni pracy”",
        Math.abs(wear.work - 0.4) < 1e-6 && Math.abs(wear.hit - 0.1) < 1e-6 && wear.belt > 0.4 && wear.unit === "dni pracy" && wear.kurta === 0, wear);
    const torn = await t.json(`(function(){ Durability.setUsed(275, Durability.lifeOf(275) - 1); $gameSystem.setStamina(100); $gameSystem.trySpendStamina(100); Ubior_Sklepy.refresh();
        return { n: $gameParty.numItems($dataItems[275]), feet: Equipment.current('feet') }; })()`);
    t.check("zniszczone łapcie spadają z bohatera (znikają z torby)", torn.n === 0 && torn.feet === 0, torn);
    const wb = await t.json(`(function(){ const r = Farming.BUILDINGS.workbench.recipes.find(x => x.id === "ubior_lapcie"); const rep = Durability.repairRecipes().map(x => x.repair);
        return { r: !!r, out: r && r.output, rep }; })()`);
    t.check("warsztat: łapcie z łyka do uplecenia; napraw tam tylko skórzane rzeczy (koszuli nie)", wb.r && wb.out[0] === 275 && !wb.rep.includes(261), wb);

    // ---- the card of the equipment (MenuRing's Ekwipunek reads these)
    const card = await t.json(`(function(){ const s = Equipment.slots(), head = s.find(x => x.id === 'head'), feet = s.find(x => x.id === 'feet');
        return { head: head.note, feet: feet.note, src: Equipment.source(255), rows: Ubior_Data.wiersze(263), hint: Ubior_Data.podpowiedz('head') }; })()`);
    t.check("karta: opis bonusu, „zrobisz / kupisz: ...” dla pustej części, liczby kaftana", /pot nie zalewa/.test(card.head) && /zrobisz: garbarnia · kupisz: Ignac/.test(card.feet)
        && /kupisz: Dorota/.test(card.src) && card.rows[0][0] === "Zimno" && !!card.hint, card);

    // ---- the talk with Agata at her stall and the shop's window by keys
    const town = await t.go(8, 30, 30, 2);
    let agata = null;
    if (town) {
        await t.setHour(8);
        await t.frames(30);
        agata = await t.json("(function(){ const e = TownLife.eventOf('przekupka'); return e ? { id: e.eventId(), x: e.x, y: e.y, hidden: !!(e._town && e._town.hidden) } : null; })()");
    }
    if (agata && !agata.hidden) {
        const talk = await t.talkTo(agata.id, ["Pokaż ubrania"], { secs: 8 });
        await t.until("SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_UbiorSklep' && SceneManager._scene._started", 10);
        t.check("rozmowa z Agatą: menu w dymku („Pokaż ubrania”) otwiera okno sklepu", talk.choices.some(c => c.some(l => l.includes("Pokaż ubrania"))) && (await t.scene()) === "Scene_UbiorSklep", { text: talk.text, choices: talk.choices, missing: talk.missing });
    } else {
        await t.eval("Ubior_Sklepy.otworz('przekupka', 'kup'); 0");
        await t.until("SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_UbiorSklep' && SceneManager._scene._started", 10);
        console.log("NOTE Agata nie stoi na rynku (mapa 8) - okno otwarte skryptem", JSON.stringify({ town, agata }));
        t.check("okno sklepu przekupki", (await t.scene()) === "Scene_UbiorSklep");
    }
    if ((await t.scene()) === "Scene_UbiorSklep") {
        await t.frames(30);
        const s0 = await t.json("SceneManager._scene.state()");
        await t.shot(path.join(OUT, "sklep_przekupka.png"));
        const g0 = await t.gold();
        await t.key("ArrowDown");
        await t.key("O");
        const s1 = await t.json("SceneManager._scene.state()");
        const g1 = await t.gold();
        t.check("okno: strzałka w dół i O kupuje ciemny kapelusz (12 G), napis w oknie", s0.rows.length === 2 && s1.index === 1 && g0 - g1 === 12 && /Kupione/.test(s1.msg), { s0, s1, g0, g1 });
        await t.key("ArrowRight");
        const s2 = await t.json("SceneManager._scene.state()");
        await t.shot(path.join(OUT, "sklep_przekupka_sprzedaz.png"));
        t.check("okno: → zakładka „Sprzedaż” (kapelusze na liście)", s2.tab === "sprzedaj" && s2.rows.some(r => /kapelusz/i.test(r)), s2);
        await t.key("P");
        t.check("okno: P - z powrotem na mapie", await t.until("SceneManager._scene instanceof Scene_Map && SceneManager._scene._started", 10));
        await t.eval("Ubior_Sklepy.otworz('szwaczka', 'farbuj'); 0");
        await t.until("SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_UbiorSklep' && SceneManager._scene._started", 10);
        await t.frames(30);
        const s3 = await t.json("SceneManager._scene.state()");
        await t.shot(path.join(OUT, "sklep_szwaczka_farbowanie.png"));
        await t.eval("SceneManager._scene.switchTab(-3); 0");
        await t.frames(20);
        await t.shot(path.join(OUT, "sklep_szwaczka.png"));
        await t.key("P");
        await t.until("SceneManager._scene instanceof Scene_Map && SceneManager._scene._started", 10);
        t.check("okno szwaczki: zakładka farbowania (żółta -> niebieska)", s3.tab === "farbuj" && s3.rows.length >= 1 && /niebiesk/.test(s3.rows[0]), s3);
    }

    // ---- F9 (Debug.js through Okolice.f9): all the clothes, +500 G, everything off
    const f9 = await t.json(`(function(){ const sec = Okolice.f9.sections().find(x => x.owner === "Ubior_Sklepy"); if (!sec) return null;
        const g0 = $gameParty.gold(), gold = Okolice.f9.ok(sec.rows.find(r => r.what === "gold")), g1 = $gameParty.gold();
        const all = Okolice.f9.ok(sec.rows.find(r => r.what === "all")), have = Ubior_Data.PRZEDMIOTY.filter(p => p.id >= 250 && $gameParty.numItems($dataItems[p.id]) > 0).length;
        const off = Okolice.f9.ok(sec.rows.find(r => r.what === "off")); Ubior_Sklepy.refresh();
        return { title: sec.title, rows: sec.rows.map(r => r.label), gold, plus: g1 - g0, all, have, total: Ubior_Data.PRZEDMIOTY.filter(p => p.id >= 250).length, off,
            worn: ["head", "torso", "legs", "feet", "belt", "hands", "back"].map(p => Equipment.current(p)) }; })()`);
    t.check("F9: „Ubiór: daj wszystkie ubrania” (każdy wariant w torbie), „+500 G”, „zdejmij wszystko” (łachman)",
        !!f9 && f9.rows.length === 3 && f9.plus === 500 && f9.have === f9.total && f9.worn.every(x => x === 0), f9);
});
