// The weapons, the armour, the shields and the trinkets without the game (Bron_Data.js, Bron.js; data/Items.json; the looks of
// Ubior_Data.js, the foes of Humans_Data.js / Creatures_Data.js): every thing a real item with its note, name, icon, price and weight,
// unique ids, valid kinds, materials, places and bonuses; a weapon's numbers from its kind x its material (a better metal stronger,
// dearer and longer-lasting), the wear's unit, the level's lack (3% a level, at most 45%), the prices, the shops, the uniques, the loot
// (the people, the creatures, the bosses, the underground's bands), the forge's / tannery's / workbench's recipes, the look keys, the
// card's words; Bron.js's trade (buying, selling by the wear, mending, the order's steel dearer), the best bow owned, the F9 set for a
// level, a trinket's bonus through Combat.perk.
// Mirrors tests/bron_dane_test.js (the data block, the swords 23 / 27 / 31, the mace +30%, the steel axe and pick, the look keys, the
// smith's 105 G and 42 G, the mending 17 G, the bow 44, the ring +15 life, the boss loot, the shops' lists).
const unit = require("../lib/unit.js");

const FILES = ["TawernaCore", "Durability", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI", "Humans_Data", "Creatures_Data", "Equipment", "Ubior_Data",
    "Bron_Data", "Bron"];
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);
const OLD_IDS = [156, 60, 115, 63, 116, 154, 126, 125, 155];
const METALS = ["braz", "zelazo", "stal", "pierwszych", "zakon"];

unit.test(t => {
    const $dataItems = unit.data("Items");
    function Game_System() {}
    let sys = new Game_System();
    const bag = {};
    const $gameParty = { numItems: it => bag[it.id] || 0, hasItem: it => (bag[it.id] || 0) > 0, gainItem(it, n) { bag[it.id] = Math.max(0, (bag[it.id] || 0) + n); },
        loseItem(it, n) { this.gainItem(it, -n); }, maxItems: () => 99, leader: () => null };
    const globals = { Game_System, $gameParty, $dataItems, DataManager: { isItem: o => !!o && $dataItems.includes(o) } };
    Object.defineProperty(globals, "$gameSystem", { get: () => sys, enumerable: true, configurable: true });
    const w = unit.load(FILES, { globals });
    const D = w.Bron_Data, B = w.Bron, C = w.Combat, DU = w.Durability;
    const P = D.PRZEDMIOTY, fresh = P.filter(p => !p.istnieje), real = id => !!($dataItems[id] && $dataItems[id].name);
    const count = typ => fresh.filter(p => p.typ === typ).length;

    // ---- the list
    const ids = P.map(p => p.id);
    t.check("~100 things: 48 weapons (the uniques and the 2 steel tools among them), 38 armour, 7 shields, 16 trinkets - ids 300-408 once each; the old ones " +
        OLD_IDS.join(", ") + " only get their note", count("bron") === 48 && count("zbroja") === 38 && count("tarcza") === 7 && count("dodatek") === 16 &&
        new Set(ids).size === ids.length && JSON.stringify(fresh.map(p => p.id).sort((a, b) => a - b)) === JSON.stringify(Array.from({ length: 109 }, (_, i) => 300 + i)) &&
        JSON.stringify(P.filter(p => p.istnieje).map(p => p.id)) === JSON.stringify(OLD_IDS), { bron: count("bron"), zbroja: count("zbroja"), tarcza: count("tarcza"), dodatek: count("dodatek") });
    const bad = [];
    for (const p of P) {
        const it = $dataItems[p.id];
        if (!real(p.id)) { bad.push(p.id + ": not in Items.json"); continue; }
        if (!it.note.includes(D.notatka(p))) bad.push(p.id + ": note");
        if (p.istnieje) continue;
        const weight = /<Weight:(\d+)>/.exec(it.note);
        if (it.name !== p.nazwa || it.iconIndex !== 576 + p.id - 300 || it.iconIndex !== D.ikonaOf(p.id)) bad.push(p.id + ": name / icon");
        if (it.price !== (D.cenaOf(p) || p.wartosc) || !(it.price > 0)) bad.push(p.id + ": price " + it.price);
        if (!weight || Number(weight[1]) !== D.wagaOf(p)) bad.push(p.id + ": weight");
        if (!p.opis) bad.push(p.id + ": no description");
    }
    t.check("every thing is an item of data/Items.json with its note (<Bron:...>, <Zbroja:...>, <Tarcza:...>, <Dodatek:...>); the new ones: name, icon 576+, " +
        "price (or worth), <Weight:> as the data says, a description", bad.length === 0, bad.slice(0, 8));
    const kinds = [];
    for (const p of P) {
        if (p.typ === "bron" && !(D.RODZAJE[p.rodzaj] && D.MATERIALY[p.material])) kinds.push(p.id + ": " + p.rodzaj + "/" + p.material);
        if (p.typ === "zbroja" && !(D.MIEJSCA[p.miejsce] && D.MATERIALY[p.material] && p.obrona > 0 && p.obrona < D.ZBROJA_MAX)) kinds.push(p.id + ": " + p.miejsce);
        if (p.typ === "tarcza" && !(p.blok > 0 && p.blok < 1 && p.oddechBloku > 0 && D.MATERIALY[p.material])) kinds.push(p.id + ": shield");
        if (p.typ === "dodatek" && !["amulet", "pierscien", "talizman"].includes(p.rodzaj)) kinds.push(p.id + ": " + p.rodzaj);
        if (!["bron", "zbroja", "tarcza", "dodatek"].includes(p.typ)) kinds.push(p.id + ": " + p.typ);
        for (const k of Object.keys(p.bonus || {}).concat(Object.keys(p.reka || {}))) if (!D.BONUSY[k]) kinds.push(p.id + ": bonus " + k);
        if (!(p.poziom >= 1 && p.poziom <= 27)) kinds.push(p.id + ": level " + p.poziom);
        const M = D.MATERIALY[p.material];
        if (!p.istnieje && !p.unikat && M && M.poziom && (p.poziom < M.poziom[0] || p.poziom > M.poziom[1])) kinds.push(p.id + ": level " + p.poziom + " for " + p.material);
    }
    const perkKeys = Object.keys(D.BONUSY).filter(k => k !== "luck" && !w.SkillData.FX[k]);
    t.check("kinds, materials, places and bonuses all known; a common thing's level within its material's levels (levels 1-27); every bonus but Bron's own luck is a " +
        "Combat.perk effect of the skills", kinds.length === 0 && perkKeys.length === 0, kinds.concat(perkKeys).slice(0, 8));

    // ---- a weapon's numbers: its kind x its material
    const s = id => D.staty(id);
    const formula = fresh.filter(p => p.typ === "bron" && !p.staty).filter(p => {
        const R = D.RODZAJE[p.rodzaj], M = D.MATERIALY[p.material], q = s(p);
        return q.dmg !== Math.round(R.dmg * M.mn) || q.poise !== Math.round(R.poise * (0.5 + 0.5 * M.mn)) || q.cost !== Math.max(4, R.cost + (M.oddech || 0)) ||
            !near(q.crit, (R.crit || 0) + (M.crit || 0), 0.005) || q.reach !== R.reach;
    }).map(p => p.id);
    t.check("a weapon without numbers of its own: damage = kind x material, balance x (0.5 + 0.5 x material), breath + the material's, crit summed; " +
        "swords of bronze / iron / steel 23 / 27 / 31, the iron mace 25 (+30% on armour), steel axe 30 / 15 breath, steel pick 35 / 21",
        formula.length === 0 && [304, 305, 308].map(id => s(id).dmg).join() === "23,27,31" && s(317).dmg === 25 && s(317).pancerz === 1.3 &&
        s(407).dmg === 30 && s(407).cost === 15 && s(408).dmg === 35 && s(408).cost === 21, formula);
    const rise = f => METALS.every((m, i) => !i || D.MATERIALY[m][f] > D.MATERIALY[METALS[i - 1]][f]);
    const kindsOrdered = Object.keys(D.RODZAJE).filter(k => {
        const list = fresh.filter(p => p.rodzaj === k && !p.unikat && !p.staty && D.MATERIALY[p.material].mn).sort((a, b) => D.MATERIALY[a.material].mn - D.MATERIALY[b.material].mn);
        return list.some((p, i) => i && (s(p).dmg < s(list[i - 1]).dmg || D.cenaOf(p) < D.cenaOf(list[i - 1]) || D.trwalosc(p) < D.trwalosc(list[i - 1])));
    });
    t.check("the metals rise bronze < iron < steel < the First's ore < the order's steel (damage, price, wear, level); within each kind a better metal hits harder, costs more, lasts longer",
        rise("mn") && rise("cena") && rise("trw") && METALS.every((m, i) => !i || D.MATERIALY[m].poziom[0] > D.MATERIALY[METALS[i - 1]].poziom[0]) && kindsOrdered.length === 0, kindsOrdered);
    const units = {};
    for (const p of P) units[p.typ + ":" + (p.typ === "bron" ? p.rodzaj : "")] = D.jednostka(p);
    t.check("the wear: every weapon, armour and shield lasts (weapons: the material's wear x the kind's, to tens); a trinket does not wear; the unit: spears jabs, " +
        "bows and slings shots, the rest blows, armour and shields the blows taken",
        P.filter(p => p.typ !== "dodatek").every(p => D.trwalosc(p) > 0) && P.filter(p => p.typ === "dodatek").every(p => D.trwalosc(p) === null && D.jednostka(p) === null) &&
        D.trwalosc(D.przedmiot(300)) === 110 && D.trwalosc(D.przedmiot(308)) === 320 && units["bron:wlocznia"] === "jab" && units["bron:rohatyna"] === "jab" &&
        units["bron:luk"] === "shot" && units["bron:proca"] === "shot" && units["bron:miecz"] === "blow" && units["zbroja:"] === "block" && units["tarcza:"] === "block", units);

    // ---- the level's lack
    t.eq("brak(level of the thing, the hero's): none at or under it, 3% a level over, at most 45%; no levels given: none",
        [D.brak(5, 5), D.brak(5, 30), D.brak(16, 6), D.brak(9, 1), D.brak(27, 1), D.brak(16, 15), D.brak(undefined, undefined)].map(v => Math.round(v * 1000) / 1000),
        [0, 0, 0.3, 0.24, 0.45, 0.03, 0]);

    // ---- the prices, the shops
    t.eq("prices to fives (the material's price x the kind's): bronze dagger 30, iron battle axe 105, steel sword 240, order's hammer 545; not sold: its worth (Miecz Bogumiła 600)",
        [300, 321, 308, 329].map(id => D.cenaOf(D.przedmiot(id))).concat([D.cenaOf(D.przedmiot(396)), D.wartoscOf(D.przedmiot(396))]), [30, 105, 240, 545, null, 600]);
    const shopBad = [];
    for (const [k, sh] of Object.entries(D.SKLEPY)) {
        const list = sh.sprzedaje || (D.SKLEPY[sh.wzor] || {}).sprzedaje;
        if (!list) shopBad.push(k + ": no goods");
        for (const id of sh.sprzedaje || []) { const p = D.przedmiot(id); if (!p || p.istnieje || p.unikat || !(D.cenaOf(p) > 0) || !real(id)) shopBad.push(k + ": sells " + id); }
        for (const id of Object.keys(sh.warunek || {})) if (!(sh.sprzedaje || []).includes(Number(id))) shopBad.push(k + ": condition on " + id);
        for (const id of sh.uzywane ? sh.uzywane.z : []) if (!(D.cenaOf(D.przedmiot(id)) > 0)) shopBad.push(k + ": used " + id);
        for (const m of [].concat(Array.isArray(sh.skupuje) ? sh.skupuje : [], sh.naprawia || [])) if (!D.MATERIALY[m]) shopBad.push(k + ": material " + m);
        if (sh.godziny && !(sh.godziny[0] >= 0 && sh.godziny[0] < sh.godziny[1] && sh.godziny[1] <= 24)) shopBad.push(k + ": hours");
        if (sh.wzor && !D.SKLEPY[sh.wzor]) shopBad.push(k + ": like " + sh.wzor);
        if (!(sh.skup > 0 && sh.skup < 1)) shopBad.push(k + ": buys back at " + sh.skup);
    }
    t.check("the shops (" + Object.keys(D.SKLEPY).join(", ") + "): sell only common new things with a price, their conditions on their own goods, the used ones priced, " +
        "known materials bought back and mended, open hours within the day", shopBad.length === 0, shopBad.slice(0, 8));

    // ---- the uniques and the loot
    const CD = w.CreaturesData, HD = w.HumansData, L = D.LUP;
    const uq = P.filter(p => p.unikat).map(p => p.id), soldAnywhere = new Set(Object.values(D.SKLEPY).flatMap(sh => (sh.sprzedaje || []).concat(sh.uzywane ? sh.uzywane.z : [])));
    const uqBad = uq.filter(id => {
        const u = D.UNIKATY[id], ways = ["boss", "flaga", "zadanie", "przychylnosc"].filter(k => u && u[k]);
        return !u || ways.length !== 1 || !(u.notatka && u.notatka.length === 2) || soldAnywhere.has(id) || (u.boss && !(CD.BOSSES[u.boss] && (L.bossowie[u.boss] || []).includes(id)));
    });
    t.check("the uniques (" + uq.length + "): each in UNIKATY with one way to come (a boss, a flag, a quest, the garrison's favour) and a journal note, never sold; " +
        "a boss's one lies in that boss's remains", uq.length === 11 && JSON.stringify(Object.keys(D.UNIKATY).map(Number)) === JSON.stringify(uq) && uqBad.length === 0, uqBad);
    const lootBad = [];
    const lootList = (where, list) => { for (const [id, c] of list) if (!real(id) || !D.przedmiot(id) || !(c > 0 && c <= 1)) lootBad.push(where + ": " + id + " " + c); };
    for (const [k, list] of Object.entries(L.ludzie)) { if (!HD.KINDS[k]) lootBad.push("people: " + k); lootList(k, list); }
    for (const [k, list] of Object.entries(L.stwory)) { if (!CD.KINDS[k]) lootBad.push("creatures: " + k); lootList(k, list); }
    for (const [k, list] of Object.entries(L.bossowie)) { if (!CD.BOSSES[k]) lootBad.push("boss: " + k); lootList(k, list.map(id => [id, 1])); }
    lootList("camp", L.oboz);
    const bands = [1, 2, 3, 4, 5].map(b => L.podziemia.pasma[b]);
    for (const band of bands) lootList("band", band.map(([id, wt]) => [id, wt > 0 ? 1 : 0]));
    const avg = bands.map(band => band.reduce((a, [id]) => a + D.przedmiot(id).poziom, 0) / band.length);
    t.check("the loot: the people's kinds (Humans_Data), the creatures' kinds and the bosses (Creatures_Data) exist, every thing is real with a chance in (0, 1]; " +
        "the underground's five bands get better deeper (average level " + avg.map(Math.round).join(" < ") + ")",
        lootBad.length === 0 && avg.every((v, i) => !i || v > avg[i - 1]) && Object.values(L.podziemia.szansa).every(c => c > 0 && c < 1), lootBad.slice(0, 8));

    // ---- the recipes, the looks, the words
    const recipes = D.przepisy(), recBad = [];
    for (const st of ["forge", "tannery", "workbench"]) {
        const outs = D.PRZEPISY[st].map(r => r[0]);
        if (new Set(outs).size !== outs.length) recBad.push(st + ": twice");
        for (const [id, inputs, hours, stamina] of D.PRZEPISY[st]) if (!D.przedmiot(id) || !real(id) || !inputs.every(([i, n]) => real(i) && n > 0) || !(hours > 0 && stamina > 0)) recBad.push(st + ": " + id);
        for (const r of recipes[st]) if (r.id !== "bron_" + r.output[0] || r.output[1] !== 1 || r.poziom !== D.przedmiot(r.output[0]).poziom || !r.name.startsWith({ forge: "Wykuj: ", tannery: "Uszyj: ", workbench: "Zrób: " }[st])) recBad.push(r.id);
    }
    const mats = st => [...new Set(D.PRZEPISY[st].map(([id]) => D.przedmiot(id).material))].sort().join();
    t.check("the recipes: real outputs and inputs, once per station, hours and strength; the forge makes iron, iron-shod and steel things, the tannery leather; " +
        "przepisy() as Farming wants them (bron_<id>, Wykuj / Uszyj / Zrób, the thing's level)", recBad.length === 0 && mats("forge") === "okute,stal,zelazo" && mats("tannery") === "skora" &&
        recipes.forge.length === 26 && D.PRZEPISY.widac === 4, recBad.concat([mats("forge"), mats("tannery")]));
    const U = w.Ubior_Data, looks = Object.assign({}, U.WZORY, U.WZORY_ZBROI, U.WZORY_BRONI, U.WZORY_TARCZ);
    const noLook = P.filter(p => p.typ !== "dodatek" && !looks[D.wygladOf(p)]).map(p => p.id + ":" + D.wygladOf(p));
    t.check("the look keys: every weapon's, armour's and shield's key is in Ubior_Data.js's graphics (WZORY, WZORY_ZBROI, WZORY_BRONI, WZORY_TARCZ)", noLook.length === 0, noLook);
    t.eq("the card's words: the steel sword, the mail, the buckler, the hematite ring; the iron sword's rows; who sells the battle axe, where Bogumił's sword comes from",
        [D.opis(308), D.opis(353), D.opis(377), D.opis(384), D.wiersze(305).map(r => r.join(" ")).join(" | "), D.gdzie(321), D.gdzie(396)],
        ["obrażenia 31 · zasięg 1,55 · oddech 10 · krytyk +6%", "cios słabszy o 28% · oddech -5% · głośniej o 12%", "blok zatrzymuje 68% ciosu · parowanie +50%", "życie +15",
            "Obrażenia 27 | Zachwianie 24 | Zasięg 1,55 | Oddech 11 | Krytyk +5% | Poziom 10", "Tadek Młot (kowal), 105 G", "W4 Krew kasztelana: Borgar po rozmowie o rodzie"]);

    // ---- Bron.js: the trade (wired as at the boot: Durability knows the new things)
    const wired = B.wire();
    const give = (id, n) => $gameParty.gainItem($dataItems[id], n || 1);
    give(321);
    give(305);
    give(310);
    DU.setUsed(305, 110);
    DU.setUsed(310, DU.lifeOf(310) / 2);
    const trade = [B.buyPrice("kowal", 321), B.buyPrice("szmaciarz", 300, true), B.buyPrice("kantor", 308), B.sellPrice("kowal", 321), B.sellPrice("kowal", 396),
        B.sellPrice("kowal", 349), B.repairPrice(305), B.repairPrice(310)];
    DU.setUsed(321, 110);
    DU.setUsed(305, 1);
    trade.push(B.sellPrice("kowal", 321), B.repairPrice(305));
    t.eq("Bron.js trade: the smith sells the battle axe for 105, the rag-and-bone man a used dagger for half (15), the kantor steel at its price (240, no Kantor.js); " +
        "the smith buys the axe back for 40% (42), never a unique or cloth; mending half of an iron sword's wear 17, of the First's ore double (99); the axe half worn sells for 21, " +
        "a scratch costs 2 at least", trade, [105, 15, 240, 42, 0, 0, 17, 99, 21, 2]);
    t.check("... wired: the perk source, the hand, the parts, the wear of every new thing", wired.perk && wired.hand && wired.equip && wired.durability && wired.loot);

    // ---- Bron.js: the best bow owned, the F9 set, a trinket's bonus
    give(126);
    give(127, 10);
    C.hero().level = 20;
    const bow = [B.rangedItem(), B.rangedDef("bow")];
    give(336);
    const best = [B.rangedItem(), B.rangedDef("bow")];
    C.hero().level = 6;
    const low = B.rangedDef("bow");
    t.check("the bows: only the old one owned - it shoots with its own numbers (no def); the reflex bow owned - it shoots 44; at hero level 6 (14 needed) 33, the aim 24% longer",
        bow[0] === 126 && bow[1] === null && best[0] === 336 && best[1].damage === 44 && best[1].item === 336 && low.damage === 33 && low.steady === 57 && B.isRanged(336) && !B.isRanged(305),
        { best: best[1], low });
    const sets = Array.from({ length: 27 }, (_, i) => B.setFor(i + 1));
    const setBad = [];
    sets.forEach((set, i) => { for (const [part, p] of Object.entries(set)) if (p.poziom > i + 1 || p.unikat || p.narzedzie || p.istnieje) setBad.push(i + 1 + ": " + part + " " + p.id); });
    t.check("the F9 set for each level 1-27: nothing above the level, no unique or tool; level 10: the iron battle axe, the long bow, the buckler; " +
        "level 27: the order's armour and shield", setBad.length === 0 && sets[9].weapon.id === 321 && sets[9].ranged.id === 335 && sets[9].shield.id === 377 && sets[26].tors.id === 359 &&
        sets[26].shield.id === 380, setBad.slice(0, 6));
    give(384);
    C.hero().level = 1;
    B.refresh();
    const lv1 = [w.Equipment.current("extra"), C.perk("hp.max")];
    C.hero().level = 30;
    B.refresh();
    t.check("a trinket worn (the hematite ring, put on by itself): +15 life through Combat.perk at level 8+, 21% less at hero level 1",
        lv1[0] === 384 && near(lv1[1], 15 * 0.79) && C.perk("hp.max") === 15 && C.heroMhp() === 100 + 87 + 15, { lv1, now: C.perk("hp.max") });
});
