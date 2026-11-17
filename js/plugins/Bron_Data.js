//=============================================================================
// Bron_Data.js
//=============================================================================
// The weapons, the armour, the shields and the trinkets - the data (docs/ekwipunek/PLAN_BRON_ZBROJE.md, the table for the user:
// docs/ekwipunek/BRON_LISTA.md, made from this file by tools/bron/lista.js). Nothing here moves by itself: the fight reads the
// items' notes (Combat_Fight.js: <Bron:rodzaj,material[,wyglad]>, <Zbroja:miejsce,wzor>, <Tarcza:wzor> -> MELEE / ARMORS / SHIELDS
// with the numbers given out here), Equipment.js puts each thing on its part, Bron.js does the rest (the shops, the forge's recipes,
// the loot, the uniques, the trinkets' bonuses, the wear, the F9 rows).
//   MATERIALY  - what a thing is made of: its level, the multiplier of a weapon's numbers, the wear, the base price, who mends it
//   RODZAJE    - the kinds of weapons: the numbers of an IRON one (the material multiplies them), the swing it uses, its sound
//   PRZEDMIOTY - every thing: id (data/Items.json; 300-406 new, the old weapons / shield / bow / sling with their own numbers),
//                its kind, material, level, numbers, price, weight, wear, where it comes from, its words
//   SKLEPY, PRZEPISY, LUP, UNIKATY - the shops, the recipes (forge, tannery, workbench), the loot tables, the uniques' sources
//   KARA       - a thing above the hero's level works weaker (3% a level, at most 45%)
//   ROZRZUT    - (2026-11-17) a blow's / a shot's damage: the base x 0.9-1.1 (the cards: "obrażenia 12-14"); the weapons' traits:
//                Bron_Cechy_Data.js (their words on the cards here), Bron_Cechy.js (at work)
// Without TawernaCore (Node: tools/bron/) only the data is given out: window.Bron_Data.

/*:
 * @target MZ
 * @plugindesc Broń, zbroje, tarcze, dodatki - dane: materiały, rodzaje broni, przedmioty 300-482 i stare bronie, nowe surowce 483-491, ceny, sklepy, przepisy (kuźnia, garbarnia, warsztat, krosno), łupy, unikaty. v1.1.0
 * @author Claude
 * @orderAfter TawernaCore
 * @orderAfter Equipment
 * @orderAfter Ubior_Data
 *
 * @help
 * ============================================================================
 * Bron_Data.js - broń, zbroje, tarcze i dodatki: dane
 * ============================================================================
 * Sam nic nie robi. Czytają go: Combat_Fight.js (statystyki broni, zbroi
 * i tarcz według notatek przedmiotów), Equipment.js (miejsca, opisy na karcie)
 * i Bron.js (sklepy, kuźnia, łupy, unikaty, bonusy dodatków, zużycie).
 *
 * Notatki przedmiotów:
 *   <Bron:rodzaj,material>            broń (np. <Bron:miecz,zelazo>)
 *   <Bron:rodzaj,material,wyglad>     broń z własnym kluczem wyglądu
 *   <Zbroja:miejsce,wzor>             zbroja (glowa, tors, rece, nogi, stopy)
 *   <Tarcza:wzor>                     tarcza (lewa ręka)
 *   <Dodatek:rodzaj>                  amulet, pierścień, talizman
 * Przedmiot z notatką <Bron:...>, którego nie ma w tabeli PRZEDMIOTY, dostaje
 * liczby z RODZAJE x MATERIALY - nową broń można więc zrobić w edytorze
 * samą notatką.
 *
 * Liczby i ceny poprawia się tutaj, potem: node tools/bron/lista.js (tabela
 * docs/ekwipunek/BRON_LISTA.md), node tools/bron/zrob_staging.js,
 * python tools/bron/ikony.py, python tools/bron/instaluj_dane.py (przy
 * zamkniętym edytorze).
 * ============================================================================
 */

(() => {
    "use strict";

    // the items the recipes and the loot use (data/Items.json); (2026-11-17, docs/ekwipunek/NOWE_80.md) the new materials 483-491, the dyes,
    // the tools the recipes want in the bag (the shears 142, the master's hammer 409 - neither wears out)
    const ITEM = { drewno: 61, kamien: 64, jeczmien: 74, galezie: 77, wegiel: 79, deski: 80, ruda: 85, zelazo: 86, gwozdzie: 88, wlokno: 92, lina: 93, skoraSurowa: 96,
        skora: 97, jagody: 102, ziola: 104, welna: 111, stal: 143, piora: 146, szyszki: 147, pokrzywa: 149, krwawnik: 150, sciegna: 163, skoraNiedzwiedzia: 170,
        smola: 176, wosk: 185, surowyKrab: 186, dziurawiec: 191, moneta: 194, poroze: 201, kiel: 202, pazur: 203, palka: 156, tarcza: 155, buty: 113, strzaly: 127,
        kostur: 312, talizman: 389, pancerzKraba: 412, nozyce: 142, mlotek: 409,
        plotno: 483, sukno: 484, braz: 485, stalZakonna: 486, kielWilka: 487, bursztyn: 488, kamienSzlachetny: 489, nicPajecza: 490, okruch: 491 };

    // ------------------------------------------------------------------
    // MATERIALY. mn: a weapon's damage multiplier against iron (the balance: poise 0.5 + 0.5 mn); oddech: its breath cost changed by;
    // crit: added to the kind's crit; trw: the wear (blows) of a sword of it; cena: the price of a sword of it; poziom: the levels it is for;
    // naprawa: who mends it for money (Bron.js); fix: the workbench's mending (Durability.js; [] = only for money); kolor: the icon's
    // ramp (6 tones, the darkest first - tools/bron/ikony.py) - the look on the hero is the graphics' (Ubior_Data.js WZORY)
    // ------------------------------------------------------------------
    const MATERIALY = {
        drewno: { nazwa: "drewno", poziom: [1, 3], mn: 0.55, trw: 70, cena: 12, naprawa: "", fix: [[ITEM.drewno, 1]],
            kolor: ["#2a1a0e", "#43291a", "#5e3c24", "#7a5232", "#966a42", "#b08458"] },
        okute: { nazwa: "drewno okute żelazem", poziom: [3, 5], mn: 0.72, trw: 120, cena: 25, naprawa: "kowal", fix: [[ITEM.drewno, 1], [ITEM.gwozdzie, 2]],
            kolor: ["#2a1a0e", "#43291a", "#5e3c24", "#7a5232", "#8e8a82", "#c8c2b4"] },
        kamien: { nazwa: "kamień", poziom: [1, 4], mn: 0.70, trw: 60, cena: 18, naprawa: "", fix: [[ITEM.kamien, 1], [ITEM.lina, 1]],
            kolor: ["#2e2b28", "#46423d", "#5f5a53", "#7a746b", "#968f85", "#b3ab9f"] },
        braz: { nazwa: "brąz", poziom: [5, 9], mn: 0.84, trw: 140, cena: 55, naprawa: "kowal", fix: [],
            kolor: ["#3a2108", "#5c3611", "#82521c", "#a86e2a", "#c98f3f", "#e6b766"] },
        zelazo: { nazwa: "żelazo", poziom: [9, 15], mn: 1.0, trw: 220, cena: 110, naprawa: "kowal", fix: [[ITEM.zelazo, 1], [ITEM.wegiel, 1]],
            kolor: ["#1f2124", "#363a3f", "#50555b", "#6c7279", "#8e949b", "#b9bec4"] },
        stal: { nazwa: "stal", poziom: [15, 21], mn: 1.15, oddech: -1, crit: 0.01, trw: 320, cena: 240, naprawa: "kowal", fix: [[ITEM.stal, 1], [ITEM.wegiel, 1]],
            kolor: ["#1a2129", "#2c3845", "#425465", "#5d7387", "#8199ad", "#b7c9d8"] },
        pierwszych: { nazwa: "kruszec Pierwszych", poziom: [18, 22], mn: 1.24, oddech: -1, crit: 0.02, trw: 360, cena: 330, naprawa: "kowal2", fix: [],
            kolor: ["#141310", "#2a2620", "#423b2e", "#5e523c", "#7f6e4b", "#a8925f"] },
        zakon: { nazwa: "stal zakonna", poziom: [22, 27], mn: 1.32, oddech: -2, crit: 0.03, trw: 420, cena: 520, naprawa: "kowal2", fix: [[ITEM.stal, 2], [ITEM.wegiel, 1]],
            kolor: ["#141d2a", "#22324a", "#35506e", "#4f7193", "#7b9cbb", "#c6d8ea"] },
        // (armour and trinkets only)
        skora: { nazwa: "skóra", poziom: [1, 8], naprawa: "garbarz", fix: [[ITEM.skora, 1], [ITEM.sciegna, 1]],
            kolor: ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f"] },
        plotno: { nazwa: "płótno", poziom: [1, 8], naprawa: "szwaczka", fix: [[ITEM.wlokno, 2]],
            kolor: ["#3a352a", "#575040", "#756c57", "#948a70", "#b0a78b", "#cbc3a8"] },
        // (2026-11-17, NOWE_80.md) the loom's broadcloth and felt, the wicker shield, the giant crab's shell
        sukno: { nazwa: "sukno", poziom: [1, 8], naprawa: "szwaczka", fix: [[ITEM.sukno, 1]],
            kolor: ["#22261c", "#333a2a", "#454e39", "#58634a", "#6c785c", "#828e70"] },
        filc: { nazwa: "filc", poziom: [1, 8], naprawa: "szwaczka", fix: [[ITEM.welna, 2]],
            kolor: ["#26241f", "#38352e", "#4c483f", "#615c51", "#777165", "#8e877a"] },
        wiklina: { nazwa: "wiklina", poziom: [1, 4], naprawa: "", fix: [[ITEM.galezie, 2], [ITEM.lina, 1]],
            kolor: ["#3e2e14", "#5c461f", "#7a5e2c", "#98793c", "#b4944f", "#ccae68"] },
        krab: { nazwa: "pancerz kraba", poziom: [6, 10], naprawa: "", fix: [[ITEM.pancerzKraba, 1]],
            kolor: ["#3a1a12", "#5a281a", "#7a3a22", "#9a4e2c", "#b8663a", "#d0844e"] },
        jedwab: { nazwa: "pajęczy jedwab", poziom: [14, 20], naprawa: "szwaczka", fix: [],
            kolor: ["#3c3f44", "#5a5e65", "#7b8088", "#a0a5ad", "#c6cad0", "#eef0f2"] },
        kamienie: { nazwa: "kamień i kruszec", poziom: [1, 20], naprawa: "", fix: [],
            kolor: ["#3a2a12", "#5e451c", "#8a6a2c", "#b38f40", "#d6b45e", "#f2dc94"] },
        // (the bows and the slings: the second word of the note is the kind of bow / sling)
        krotki: { nazwa: "łuk z leszczyny", naprawa: "", fix: [[ITEM.lina, 1], [ITEM.galezie, 1]], kolor: ["#2a1a0e", "#43291a", "#5e3c24", "#7a5232", "#966a42", "#b08458"] },
        dlugi: { nazwa: "cis", naprawa: "", fix: [[ITEM.lina, 1], [ITEM.galezie, 1]], kolor: ["#2b1408", "#47220f", "#663418", "#864922", "#a5622f", "#c27f45"] },
        refleksyjny: { nazwa: "róg i ścięgna", naprawa: "", fix: [[ITEM.sciegna, 1], [ITEM.lina, 1]], kolor: ["#1e1712", "#3b2c20", "#5c4632", "#8a6c4a", "#b99a6f", "#e2cfa4"] },
        mysliwski: { nazwa: "jesion i ścięgna", naprawa: "", fix: [[ITEM.sciegna, 1], [ITEM.lina, 1]], kolor: ["#2e1d10", "#4a2f19", "#684425", "#875b33", "#a57444", "#c19059"] },
        wojenny: { nazwa: "drewno, róg i ścięgna", naprawa: "", fix: [[ITEM.sciegna, 1], [ITEM.lina, 1]], kolor: ["#1a120c", "#2f2116", "#4a3522", "#6a4f34", "#94744f", "#c4a678"] },
        prosta: { nazwa: "lina", naprawa: "", fix: [[ITEM.lina, 1], [ITEM.wlokno, 1]], kolor: ["#3a2f20", "#574631", "#756044", "#93795a", "#b09473", "#c9b08f"] },
        skorzana: { nazwa: "skóra", naprawa: "garbarz", fix: [[ITEM.lina, 1], [ITEM.skora, 1]], kolor: ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f"] },
        rzemienna: { nazwa: "rzemień", naprawa: "garbarz", fix: [[ITEM.sciegna, 1], [ITEM.skora, 1]], kolor: ["#1c120c", "#2f1d13", "#462b1b", "#5f3b24", "#7a4e30", "#97663f"] }
    };

    // ------------------------------------------------------------------
    // RODZAJE: the numbers of an IRON weapon of the kind (dmg, poise: before the attributes; reach: tiles; cone: the cosine a target must
    // be within (1 = straight ahead); cost: breath a blow; crit: added to the hero's crit chance), its swing (zamach: club 22 frames,
    // punch 18, axe 26, pick 34, spear 32 - Combat_Fight.js turns them into the swing kinds), klasa: the sound of a hit (edge, blunt,
    // point, pick), se: the sound of a blow; sweep: hits all in reach (with the skill Szeroki zamach); pancerz: x damage on armour
    // (empty armours, stone, the mercenary's mail); zwierz: x damage on animals; ukrycie: x more for a blow from hiding; trw / waga /
    // cena: the kind's share of the material's wear and price, its weight; jed: "blow" | "jab" | "shot" (the wear's word); g: f/m/p
    // ------------------------------------------------------------------
    const RODZAJE = {
        sztylet: { nazwa: "sztylet", zamach: "punch", klasa: "edge", se: "Slash1", dmg: 16, poise: 11, reach: 1.2, cone: 0.5, cost: 7, crit: 0.10, ukrycie: 1.3,
            trw: 0.8, waga: 1, cena: 0.55, g: "m", cecha: "szybki i tani w oddechu, częste krytyki, mocny cios z ukrycia; krótki zasięg" },
        miecz: { nazwa: "miecz", zamach: "sword", klasa: "edge", se: "Slash2", dmg: 27, poise: 24, reach: 1.55, cone: 0.45, cost: 11, crit: 0.05,
            trw: 1, waga: 2, cena: 1, g: "m", cecha: "wszechstronny: szybki zamach, dobre obrażenia, trochę krytyków" },
        tasak: { nazwa: "tasak", zamach: "sword", klasa: "edge", se: "Slash2", dmg: 30, poise: 30, reach: 1.5, cone: 0.45, cost: 12, crit: 0.02,
            trw: 1, waga: 2, cena: 0.95, g: "m", cecha: "ciężkie ostrze: więcej obrażeń i zachwiania niż miecz, mało krytyków" },
        szabla: { nazwa: "szabla", zamach: "sword", klasa: "edge", se: "Slash3", dmg: 25, poise: 22, reach: 1.6, cone: 0.45, cost: 9, crit: 0.09,
            trw: 0.9, waga: 2, cena: 1.15, g: "f", cecha: "lekka i szybka: tani cios, dużo krytyków" },
        dlugi_miecz: { nazwa: "długi miecz", zamach: "sword", klasa: "edge", se: "Slash2", dmg: 31, poise: 28, reach: 1.75, cone: 0.45, cost: 14, crit: 0.05,
            trw: 1, waga: 3, cena: 1.2, g: "m", cecha: "dłuższy zasięg i mocniejszy cios niż miecz, droższy w oddechu" },
        palka: { nazwa: "pałka", zamach: "club", klasa: "blunt", se: "Blow1", dmg: 21, poise: 32, reach: 1.45, cone: 0.45, cost: 10, crit: 0, pancerz: 1.2,
            trw: 1.1, waga: 2, cena: 0.6, g: "f", cecha: "tania i szybka, mocno zbija równowagę, lepsza na pancerz" },
        kostur: { nazwa: "kostur", zamach: "club", klasa: "blunt", se: "Blow1", dmg: 20, poise: 34, reach: 1.75, cone: 0.45, cost: 11, crit: 0, pancerz: 1.1,
            trw: 1, waga: 2, cena: 0.5, g: "m", cecha: "długi drąg: zasięg i równowaga, małe obrażenia" },
        kiscien: { nazwa: "kiścień", zamach: "club", klasa: "blunt", se: "Blow4", dmg: 25, poise: 36, reach: 1.45, cone: 0.4, cost: 12, crit: 0.06, pancerz: 1.2,
            trw: 1.1, waga: 3, cena: 0.85, g: "m", cecha: "kula na łańcuchu: nieprzewidywalny, krytyki i równowaga" },
        buzdygan: { nazwa: "buzdygan", zamach: "club", klasa: "blunt", se: "Blow4", dmg: 25, poise: 40, reach: 1.45, cone: 0.45, cost: 13, crit: 0.02, pancerz: 1.3,
            trw: 1.2, waga: 3, cena: 0.9, g: "m", cecha: "piórowa głowica: bardzo mocno zbija równowagę, +30% na pancerz" },
        topor: { nazwa: "topór", zamach: "axe", klasa: "edge", se: "Slash2", dmg: 31, poise: 36, reach: 1.6, cone: 0.35, cost: 16, crit: 0.03, sweep: true,
            trw: 1, waga: 3, cena: 0.95, g: "m", cecha: "szeroki zamach (z umiejętnością trafia wszystkich), mocny, wolniejszy" },
        czekan: { nazwa: "czekan", zamach: "axe", klasa: "pick", se: "Blow6", dmg: 29, poise: 34, reach: 1.55, cone: 0.4, cost: 15, crit: 0.07, pancerz: 1.35,
            trw: 1, waga: 3, cena: 1.05, g: "m", cecha: "dziób z tyłu obucha: przebija pancerz, krytyki" },
        bardysz: { nazwa: "bardysz", zamach: "axe", klasa: "edge", se: "Slash2", dmg: 34, poise: 40, reach: 1.95, cone: 0.5, cost: 19, crit: 0.03, sweep: true,
            trw: 1, waga: 5, cena: 1.25, g: "m", cecha: "topór na drzewcu: bardzo daleki zasięg, ciężki" },
        mlot: { nazwa: "młot", zamach: "pick", klasa: "blunt", se: "Blow6", dmg: 37, poise: 56, reach: 1.5, cone: 0.45, cost: 21, crit: 0, sweep: true, pancerz: 1.4,
            trw: 1.2, waga: 5, cena: 1.05, g: "m", cecha: "najcięższy: ogromne zachwianie i obrażenia, +40% na pancerz, wolny i drogi w oddechu" },
        wlocznia: { nazwa: "włócznia", zamach: "spear", klasa: "point", se: "Slash4", dmg: 28, poise: 20, reach: 2.3, cone: 0.75, cost: 12, crit: 0.03,
            trw: 0.75, waga: 3, cena: 0.8, g: "f", jed: "jab", cecha: "najdalszy zasięg (pchnięcia na wprost), słabiej zbija równowagę" },
        rohatyna: { nazwa: "rohatyna", zamach: "spear", klasa: "point", se: "Slash4", dmg: 29, poise: 26, reach: 2.2, cone: 0.75, cost: 13, crit: 0.03, zwierz: 1.3,
            trw: 0.8, waga: 3, cena: 0.9, g: "f", jed: "jab", cecha: "włócznia na grubego zwierza: +30% na zwierzęta" },
        // (2026-11-17, NOWE_80.md) the light spear: its drawing is there already (bron_*_sulica)
        sulica: { nazwa: "sulica", zamach: "spear", klasa: "point", se: "Slash4", dmg: 24, poise: 18, reach: 2.0, cone: 0.75, cost: 9, crit: 0.05,
            trw: 0.7, waga: 2, cena: 0.7, g: "f", jed: "jab", cecha: "lekka włócznia: krótsza od włóczni, ale tańsza w oddechu i częściej trafia krytycznie" },
        // (the tools: only the old items; their numbers are their own)
        siekiera: { nazwa: "siekiera", zamach: "axe", klasa: "edge", se: "Slash2", dmg: 26, poise: 30, reach: 1.6, cone: 0.35, cost: 16, crit: 0, sweep: true, trw: 1, waga: 2, cena: 0, g: "f", narzedzie: true },
        kilof: { nazwa: "kilof", zamach: "pick", klasa: "pick", se: "Blow6", dmg: 30, poise: 42, reach: 1.45, cone: 0.45, cost: 22, crit: 0, sweep: true, trw: 1, waga: 2, cena: 0, g: "m", narzedzie: true },
        // (the ranged ones: Hunting_Weapons.js - damage, range (tiles), steady (frames the circle takes to close), cooldown, stamina a shot)
        luk: { nazwa: "łuk", dystans: "bow", klasa: "point", g: "m", jed: "shot", waga: 2, cecha: "strzały: celowanie kółkiem (O przytrzymane)" },
        proca: { nazwa: "proca", dystans: "sling", klasa: "blunt", g: "f", jed: "shot", waga: 1, cecha: "kamienie: celowanie kółkiem (O przytrzymane)" }
    };

    // the places of the armour (Equipment.js's parts) and their words
    const MIEJSCA = {
        glowa: { eq: "head", nazwa: "Głowa" }, tors: { eq: "torso", nazwa: "Tors" }, rece: { eq: "hands", nazwa: "Ręce" },
        nogi: { eq: "legs", nazwa: "Nogi" }, stopy: { eq: "feet", nazwa: "Stopy" }
    };
    // a thing above the hero's level: its damage, balance, defence and bonuses are that much weaker (and a blow costs that much more breath)
    const KARA = { naPoziom: 0.03, max: 0.45 };
    // the armour's sum is capped (with Niezłomny's own part on top, in Combat_Fight)
    const ZBROJA_MAX = 0.58;

    // ------------------------------------------------------------------
    // BONUSY: the keys of Combat.perk the trinkets, the uniques and the armour add to (Bron.js gives them through Combat.addPerkSource),
    // and their words. luck: Bron.js's own (the coins in the ruins, the gear found)
    // ------------------------------------------------------------------
    const pct = v => Math.round(v * 100) + "%";
    const BONUSY = {
        "melee.dmg": { opis: v => "obrażenia wręcz +" + pct(v), kv: v => ["Obrażenia wręcz", "+" + pct(v)] },
        "melee.crit": { opis: v => "trafienie krytyczne +" + pct(v), kv: v => ["Krytyk", "+" + pct(v)] },
        "cold": { opis: v => "marzniesz o " + pct(v) + " mniej", kv: v => ["Zimno", "-" + pct(v)] },
        "sell": { opis: v => "sprzedajesz o " + pct(v) + " drożej", kv: v => ["Sprzedaż", "+" + pct(v)] },
        "hp.max": { opis: v => "życie +" + v, kv: v => ["Życie", "+" + v] },
        "aim.speed": { opis: v => "celujesz o " + pct(v) + " szybciej", kv: v => ["Celowanie", "-" + pct(v) + " czasu"] },
        "ranged.dmg": { opis: v => "strzał +" + pct(v), kv: v => ["Strzał", "+" + pct(v)] },
        "sneak": { opis: v => v >= 0 ? "zwierzęta słyszą cię o " + pct(v) + " słabiej" : "zwierzęta słyszą cię o " + pct(-v) + " lepiej", kv: v => ["Skradanie", (v >= 0 ? "+" : "-") + pct(Math.abs(v))] },
        "knock.resist": { opis: v => "trudniej cię przewrócić (+" + pct(v) + ")", kv: v => ["Przewrócenie", "+" + pct(v) + " odporności"] },
        "breath.regen": { opis: v => "oddech wraca o " + pct(v) + " szybciej", kv: v => ["Oddech wraca", "+" + pct(v)] },
        "mind.resist": { opis: v => "opór przed „prawdą” i strachem +" + pct(v), kv: v => ["Opór umysłu", "+" + pct(v)] },
        "mind.short": { opis: v => "strach i zamęt trwają o " + pct(v) + " krócej", kv: v => ["Strach krócej", "-" + pct(v)] },
        "mind.see": { opis: () => "widzisz ukryte upiory jako mgiełkę", kv: () => ["Upiory", "widoczne"] },
        "wound.heal": { opis: v => "rany goją się o " + pct(v) + " szybciej", kv: v => ["Rany", "+" + pct(v) + " szybciej"] },
        "bandage.heal": { opis: v => "opatrunek leczy o " + pct(v) + " więcej", kv: v => ["Opatrunek", "+" + pct(v)] },
        "thirst": { opis: v => "pragnienie rośnie o " + pct(v) + " wolniej", kv: v => ["Pragnienie", "-" + pct(v)] },
        "hunt.dmg": { opis: v => "zwierzęta dostają +" + pct(v), kv: v => ["Na zwierzęta", "+" + pct(v)] },
        "luck": { opis: v => "szczęście +" + pct(v) + " (stare monety i sprzęt w ruinach)", kv: v => ["Szczęście", "+" + pct(v)] }
    };

    // ------------------------------------------------------------------
    // PRZEDMIOTY. Common: id, typ (bron | zbroja | tarcza | dodatek), nazwa, poziom, cena (in the shops; null: not sold - wartosc: what a
    // merchant pays as if it were its price), waga, trw (its wear: blows / jabs / shots / blows taken), zrodla (the words of where it
    // comes from - the table's), opis (the item's description), g (f / m / p / n: "złamał się / złamała się / złamały się"),
    // ikona: 576 + (id - 300) for the new ones (the drawing: rys - tools/bron/ikony.py), istnieje: an old item (only its note added).
    //   bron:    rodzaj, material, staty (overrides of RODZAJE x MATERIALY), wyglad (the look key: bron_<rodzaj>_<material> by default),
    //            reka: { perk: value } while it is in hand
    //   zbroja:  miejsce, wzor (the look key), obrona (the part of a blow it takes off), cieplo (perk "cold"), kara: { oddech (max breath),
    //            skradanie (perk "sneak"), chod (the walk: + faster) }, bonus: { perk: value }, piesci: { dmg, poise } (the fists' blow)
    //   tarcza:  wzor, blok (the block takes this part of a blow), oddechBloku (x a blow's balance as breath), parowanie (the parry
    //            window +), oslona (the guard covers wider: + to the side), kara: { oddech, chod }
    //   dodatek: rodzaj (amulet | pierscien | talizman), bonus: { perk: value }
    // ------------------------------------------------------------------
    // (2026-11-17) the things 419+ get their icons in the new rows from 688 (docs/ekwipunek/NOWE_80.md); until those are drawn data/Items.json
    // carries the icon of the most like thing (tools/ekwipunek_nowy/zrob_staging.js) - ikona is where the drawn one goes
    const ikonaOf = id => (id >= 419 ? 688 + (id - 419) : id >= 300 ? 576 + (id - 300) : 0);
    const B = (id, nazwa, rodzaj, material, poziom, o) => Object.assign({ id, typ: "bron", nazwa, rodzaj, material, poziom, ikona: ikonaOf(id), zrodla: [], opis: "" }, o);
    const Z = (id, nazwa, miejsce, wzor, material, poziom, obrona, o) => Object.assign({ id, typ: "zbroja", nazwa, miejsce, wzor, material, poziom, obrona, ikona: ikonaOf(id),
        cieplo: 0, kara: {}, bonus: {}, zrodla: [], opis: "", g: "m" }, o);
    const TA = (id, nazwa, wzor, material, poziom, blok, oddechBloku, o) => Object.assign({ id, typ: "tarcza", nazwa, wzor, material, poziom, blok, oddechBloku, ikona: ikonaOf(id),
        parowanie: 0, oslona: 0, kara: {}, zrodla: [], opis: "", g: "f", rys: "tarcza_okragla" }, o);
    const DO = (id, nazwa, rodzaj, poziom, bonus, o) => Object.assign({ id, typ: "dodatek", nazwa, rodzaj, material: "kamienie", poziom, bonus, ikona: ikonaOf(id), waga: 0,
        trw: null, zrodla: [], opis: "", g: "m", rys: rodzaj }, o);

    const PRZEDMIOTY = [
        // ================================================================ weapons 300-339
        // ---- sztylety
        B(300, "Brązowy sztylet", "sztylet", "braz", 5, { zrodla: ["kowal Tadek", "łup: nożownicy, bandyci", "podziemia 1-10", "szmaciarz (używany)"],
            opis: "Krótkie brązowe ostrze w rękojeści z rogu. Szybkie pchnięcia i częste krytyki, a cios z ukrycia jest nim o 30% mocniejszy." }),
        B(301, "Żelazny sztylet", "sztylet", "zelazo", 9, { zrodla: ["kowal Tadek", "kuźnia", "łup: nożownicy", "podziemia 11-30"],
            opis: "Kute żelazo, wąska głownia. Cios za ciosem, prawie bez zadyszki. Dobry na skradanie się." }),
        B(302, "Stalowy sztylet", "sztylet", "stal", 15, { zrodla: ["kantor", "kuźnia (stal)"],
            opis: "Stalowe ostrze z kontynentu, cienkie jak liść wierzby. Rzadko się tępi, łatwo znajduje szczelinę." }),
        B(303, "Mizerykordia zakonna", "sztylet", "zakon", 23, { staty: { crit: 0.16, ukrycie: 1.5 }, zrodla: ["podziemia 76-99"],
            opis: "Sztylet łaski braci zakonu - wąski, trójgrańny, do dobijania. Najwięcej krytyków ze wszystkich ostrzy." }),
        // ---- miecze
        B(304, "Brązowy miecz", "miecz", "braz", 6, { zrodla: ["kowal Tadek", "podziemia 1-10"],
            opis: "Prosty miecz z brązu, ciężki u nasady. Szybki zamach i dobre cięcie." }),
        B(305, "Żelazny miecz", "miecz", "zelazo", 10, { zrodla: ["kowal Tadek", "kuźnia", "łup: najemnicy", "podziemia 11-30"],
            opis: "Jednoręczny miecz z kutego żelaza. Wszechstronny: szybki, celny, wytrzymały." }),
        B(306, "Tasak", "tasak", "zelazo", 10, { zrodla: ["kowal Tadek", "podziemia 31-50"],
            opis: "Szerokie, ciężkie ostrze jak u rzeźnika. Rąbie mocniej niż miecz i chwieje wrogiem, ale rzadko trafia krytycznie." }),
        B(307, "Żelazna szabla", "szabla", "zelazo", 12, { zrodla: ["kwatermistrz Kłos", "łup: najemnicy"],
            opis: "Lekko zakrzywiona szabla jazdy królewskiej. Lekka w dłoni, cios kosztuje mało oddechu, a krytyki trafiają się często." }),
        B(308, "Stalowy miecz", "miecz", "stal", 16, { zrodla: ["kantor", "kuźnia (stal)", "podziemia 51-75"],
            opis: "Miecz ze stali z kontynentu, sprężysty i ostry. Mocniejszy i lżejszy w oddechu niż żelazny." }),
        B(309, "Stalowy długi miecz", "dlugi_miecz", "stal", 19, { zrodla: ["kantor"],
            opis: "Półtora ręki rękojeści i długa głownia. Sięga dalej niż zwykły miecz i tnie mocniej, ale męczy." }),
        B(310, "Prastary miecz", "miecz", "pierwszych", 20, { zrodla: ["podziemia 51-75"],
            opis: "Czarna głownia z kruszcu, którego nie zna żaden kowal. Starsza niż zakon - i wciąż ostra." }),
        B(311, "Miecz zakonny", "miecz", "zakon", 24, { zrodla: ["podziemia 76-99"],
            opis: "Miecz brata straży z wyrytym krukiem na jelcu. Stal zakonna nie rdzewieje - po trzystu latach tnie jak nowa." }),
        // ---- pałki, kostury, kiścień
        B(312, "Dębowy kostur", "kostur", "drewno", 1, { zrodla: ["warsztat"],
            opis: "Długi dębowy drąg. Trzyma wroga na dystans i chwieje nim, choć bije słabo. Tani na początek." }),
        B(313, "Okuta pałka", "palka", "okute", 3, { zrodla: ["warsztat (pałka + gwoździe)", "kowal Tadek", "łup: bandyci", "szmaciarz (używana)"],
            opis: "Pałka nabita żelaznymi ćwiekami. Bije mocniej niż goła i lepiej łamie gardę." }),
        B(314, "Brązowa maczuga", "palka", "braz", 5, { zrodla: ["kowal Tadek", "obozy bandytów", "podziemia 1-10", "szmaciarz (używana)"],
            opis: "Maczuga z brązową głowicą. Szybka, tania, dobra na pancerz i na kości." }),
        B(315, "Kiścień", "kiscien", "zelazo", 11, { zrodla: ["kowal Tadek", "podziemia 31-50"],
            opis: "Żelazna kula z kolcami na łańcuchu. Trudno przewidzieć, gdzie spadnie - wróg też tego nie wie." }),
        // ---- buzdygany
        B(316, "Brązowy buzdygan", "buzdygan", "braz", 7, { zrodla: ["kowal Tadek", "podziemia 1-10"],
            opis: "Głowica z brązowych piór na krótkim trzonku. Mocno chwieje wrogiem i dobrze bije w pancerz." }),
        B(317, "Żelazny buzdygan", "buzdygan", "zelazo", 11, { zrodla: ["kowal Tadek", "kuźnia", "podziemia 11-30"],
            opis: "Żelazny buzdygan o sześciu piórach. Na puste zbroje i kamienniki - lepszy niż jakiekolwiek ostrze." }),
        B(318, "Stalowy pernacz", "buzdygan", "stal", 17, { zrodla: ["kantor", "podziemia 51-75"],
            opis: "Pernacz ze stali, z zdobionym trzonkiem - broń setnika. Gnie blachy jak papier." }),
        B(319, "Buzdygan zakonny", "buzdygan", "zakon", 24, { zrodla: ["podziemia 76-99"],
            opis: "Buzdygan straży zakonu z okiem wyrytym w każdym piórze. Ciężki, ale świetnie wyważony." }),
        // ---- topory
        B(320, "Brązowy topór", "topor", "braz", 6, { zrodla: ["kowal Tadek", "podziemia 1-10"],
            opis: "Topór bojowy z brązu na długim stylisku. Szeroki zamach, mocny cios." }),
        B(321, "Żelazny topór bojowy", "topor", "zelazo", 10, { zrodla: ["kowal Tadek", "kuźnia", "podziemia 11-30"],
            opis: "Brodaty topór bojowy z kutego żelaza. Nie do drewna - do walki. Szeroki zamach trafia kilku naraz." }),
        B(322, "Czekan", "czekan", "zelazo", 12, { zrodla: ["kowal Tadek", "podziemia 31-50"],
            opis: "Obuch z ostrym dziobem z tyłu. Przebija kolczugi i blachy, często trafia krytycznie." }),
        B(323, "Stalowy topór bojowy", "topor", "stal", 16, { zrodla: ["kantor", "kuźnia (stal)", "podziemia 51-75"],
            opis: "Stalowy topór z kontynentu, ostrze cienkie jak brzytwa. Mocny i trochę lżejszy w oddechu." }),
        B(324, "Bardysz", "bardysz", "stal", 19, { zrodla: ["kantor"],
            opis: "Szeroki topór w kształcie półksiężyca na drzewcu. Sięga prawie jak włócznia, tnie jak topór - ale waży swoje." }),
        B(325, "Topór zakonny", "topor", "zakon", 25, { zrodla: ["podziemia 76-99"],
            opis: "Topór straży zakonu z czarnym, nieśmiertelnym ostrzem. Bije najmocniej z toporów." }),
        // ---- młoty
        B(326, "Kamienny młot", "mlot", "kamien", 2, { zrodla: ["warsztat"],
            opis: "Polny kamień obwiązany na mocnym stylisku. Ciężki i wolny, ale przewraca wilka jednym ciosem." }),
        B(327, "Żelazny młot bojowy", "mlot", "zelazo", 11, { zrodla: ["kowal Tadek", "kuźnia", "podziemia 31-50"],
            opis: "Młot bojowy z kutego żelaza. Wolny, zjada oddech, ale nic nie stoi po jego ciosie - zwłaszcza zbroje." }),
        B(328, "Stalowy młot bojowy", "mlot", "stal", 17, { zrodla: ["kantor", "kuźnia (stal)", "podziemia 51-75"],
            opis: "Stalowy młot z kolcem na grzbiecie. Kamienniki i puste zbroje pękają pod nim." }),
        B(329, "Młot zakonny", "mlot", "zakon", 26, { zrodla: ["podziemia 76-99"],
            opis: "Młot strażników bramy. Obuch nosi ślad tysiąca uderzeń, a ani jednej rysy." }),
        // ---- włócznie
        B(330, "Brązowa włócznia", "wlocznia", "braz", 5, { zrodla: ["kowal Tadek", "obozy bandytów", "podziemia 1-10", "szmaciarz (używana)"],
            opis: "Brązowy grot na jesionowym drzewcu. Sięga dalej niż oszczep i lepiej się trzyma." }),
        B(331, "Żelazna włócznia", "wlocznia", "zelazo", 9, { zrodla: ["kowal Tadek", "kwatermistrz Kłos", "kuźnia", "podziemia 11-30"],
            opis: "Żelazna włócznia piechoty. Najdłuższy zasięg: trzymasz wroga z dala i kłujesz na wprost." }),
        B(332, "Rohatyna", "rohatyna", "zelazo", 11, { zrodla: ["kowal Tadek", "podziemia 31-50"],
            opis: "Włócznia na dzika i niedźwiedzia, z poprzeczką pod grotem. Zwierzę dostaje o 30% więcej." }),
        B(333, "Stalowa włócznia", "wlocznia", "stal", 16, { zrodla: ["kantor"],
            opis: "Długi stalowy grot z kontynentu. Lżejsza i mocniejsza od żelaznej." }),
        B(334, "Włócznia zakonna", "wlocznia", "zakon", 24, { zrodla: ["podziemia 76-99"],
            opis: "Włócznia wart zakonu, grot w kształcie kruczego pióra. Sięga najdalej i bije najmocniej z włóczni." }),
        // ---- łuki i proce (strzały / kamienie jak dotąd)
        B(335, "Łuk długi", "luk", "dlugi", 8, { staty: { damage: 38, range: 10.5, steady: 64, cooldown: 34, stamina: 4 }, trw: 110, cena: 120, waga: 2,
            zrodla: ["kwatermistrz Kłos", "łup: łucznicy"], opis: "Wysoki łuk z cisu. Strzela dalej i mocniej niż zwykły, ale dłużej się celuje i męczy." }),
        B(336, "Łuk refleksyjny", "luk", "refleksyjny", 14, { staty: { damage: 44, range: 10, steady: 46, cooldown: 28, stamina: 3 }, trw: 140, cena: 280, waga: 1,
            zrodla: ["kantor"], opis: "Krótki łuk z rogu i ścięgien, wygięty na odwrót. Mocny jak długi, a celuje się szybciej." }),
        B(337, "Łuk zakonny", "luk", "zakon", 24, { staty: { damage: 48, range: 11, steady: 50, cooldown: 28, stamina: 3 }, trw: 180, wartosc: 480, waga: 2,
            zrodla: ["podziemia 76-99"], opis: "Łuk wart zakonu z czarnego drewna i kości. Strzała z niego przebija deskę na wylot." }),
        B(338, "Proca skórzana", "proca", "skorzana", 3, { staty: { damage: 18, range: 6.5, steady: 64, cooldown: 22, stamina: 2 }, trw: 80, cena: 15, waga: 1,
            zrodla: ["warsztat", "garbarz Ignac", "łup: łucznicy", "szmaciarz (używana)"], opis: "Proca z szerokim skórzanym gniazdem. Kamień leci mocniej i dalej niż z lnianej." }),
        B(339, "Proca rzemienna", "proca", "rzemienna", 7, { staty: { damage: 23, range: 7.5, steady: 58, cooldown: 22, stamina: 2 }, trw: 110, cena: 40, waga: 1,
            zrodla: ["garbarz Ignac"], opis: "Długie plecione rzemienie i twarde gniazdo. W wprawnej ręce kamień łamie kości." }),

        // ================================================================ armour 340-374
        // ---- głowa
        Z(340, "Skórzany kaptur", "glowa", "helm_kaptur_skora", "skora", 2, 0.04, { cieplo: 0.12, trw: 50, waga: 1, cena: 18, rys: "kaptur",
            zrodla: ["garbarnia", "garbarz Ignac", "łup: bandyci", "szmaciarz (używany)"], opis: "Kaptur z wyprawionej skóry. Trochę chroni głowę i trochę grzeje." }),
        Z(341, "Futrzany kaptur", "glowa", "helm_kaptur_skora_czarna", "skora", 5, 0.05, { cieplo: 0.3, trw: 60, waga: 1, cena: 45, rys: "kaptur_futro",
            zrodla: ["garbarnia (skóra niedźwiedzia)", "garbarz Ignac"], opis: "Kaptur z niedźwiedziego futra. Zimą najcieplejszy, jaki znajdziesz." }),
        Z(342, "Czepiec pikowany", "glowa", "helm_czepiec_len", "plotno", 3, 0.04, { cieplo: 0.1, trw: 45, waga: 1, cena: 15, rys: "czepiec",
            zrodla: ["szwaczka Dorota", "szmaciarz (używany)"], opis: "Pikowany lniany czepiec, jaki nosi się pod hełmem. Sam też trochę pomaga." }),
        Z(343, "Kaptur zwiadowcy", "glowa", "helm_kaptur_welna", "plotno", 8, 0.03, { cieplo: 0.1, bonus: { sneak: 0.1 }, trw: 60, waga: 1, cena: 70, rys: "kaptur",
            zrodla: ["kwatermistrz Kłos (przychylność 30)"], opis: "Szary kaptur z grubego sukna, jaki noszą zwiadowcy garnizonu. Zlewa się z cieniem - łatwiej się podkraść." }),
        Z(344, "Brązowy kapalin", "glowa", "helm_kapalin_braz", "braz", 6, 0.06, { kara: { oddech: 0.01 }, trw: 90, waga: 2, cena: 45, rys: "kapalin",
            zrodla: ["kowal Tadek", "obozy bandytów", "podziemia 1-10"], opis: "Hełm z szerokim rondem, wyklepany z brązu. Deszcz i ciosy spływają po nim na boki." }),
        Z(345, "Czepiec kolczy", "glowa", "helm_czepiec_zelazo", "zelazo", 9, 0.06, { cieplo: 0.05, kara: { skradanie: 0.03 }, trw: 110, waga: 2, cena: 60, rys: "czepiec_kolczy",
            zrodla: ["kwatermistrz Kłos", "kuźnia", "łup: najemnicy, puste zbroje", "podziemia 11-30"], opis: "Kaptur z żelaznych kółek. Chroni głowę i kark, cicho pobrzękuje." }),
        Z(346, "Hełm z nosalem", "glowa", "helm_nosal_zelazo", "zelazo", 12, 0.08, { kara: { oddech: 0.02 }, trw: 130, waga: 3, cena: 85, rys: "helm_nosal",
            zrodla: ["kowal Tadek", "kwatermistrz Kłos", "kuźnia", "łup: najemnicy", "zbrojownia Lorda (W7)", "podziemia 11-30"], opis: "Stożkowy żelazny hełm z nosalem. Prosty, mocny, sprawdzony w setkach bitew." }),
        Z(347, "Stalowy szyszak", "glowa", "helm_nosal_stal", "stal", 17, 0.08, { kara: { oddech: 0.02 }, trw: 180, waga: 3, cena: 170, rys: "szyszak",
            zrodla: ["kantor", "kuźnia (stal)", "podziemia 51-75"], opis: "Szyszak ze stali z nosalem i karwaszami na policzki. Lekki jak na swoją siłę." }),
        Z(348, "Hełm zakonny", "glowa", "helm_zakonny_zakon", "zakon", 24, 0.09, { kara: { oddech: 0.01 }, trw: 260, waga: 3, wartosc: 420, rys: "helm_zakonny",
            zrodla: ["podziemia 76-99"], opis: "Hełm braci warty z zamkniętą przyłbicą i wyrytym okiem. Nie zardzewiał przez trzysta lat." }),
        // ---- tors
        Z(349, "Przeszywanica", "tors", "zbroja_przeszywanica_len", "plotno", 3, 0.16, { cieplo: 0.3, trw: 50, waga: 2, cena: 35, rys: "przeszywanica", g: "f",
            zrodla: ["szwaczka Dorota", "kwatermistrz Kłos", "obozy bandytów", "podziemia 1-10", "szmaciarz (używana)"], opis: "Gruby kaftan pikowany lnem i wełną. Tani, ciepły i cichy - zatrzymuje część ciosu." }),
        Z(350, "Skórznia", "tors", "zbroja_skorznia_skora", "skora", 5, 0.23, { cieplo: 0.1, trw: 70, waga: 3, cena: 65, rys: "skorznia", g: "f",
            zrodla: ["garbarnia", "garbarz Ignac"], opis: "Zbroja z gotowanej, utwardzonej skóry. Mocniejsza od kurtki i wciąż cicha." }),
        Z(351, "Ćwiekowana skórznia", "tors", "zbroja_skorznia_skora_czarna", "skora", 8, 0.25, { kara: { skradanie: 0.05 }, trw: 90, waga: 4, cena: 95, rys: "skorznia_cwieki", g: "f",
            zrodla: ["garbarnia (+ gwoździe)", "kowal Tadek"], opis: "Skórznia nabita żelaznymi ćwiekami. Trochę głośniejsza, wyraźnie mocniejsza." }),
        Z(352, "Brązowa łuska", "tors", "zbroja_luska_braz", "braz", 7, 0.26, { kara: { oddech: 0.06, skradanie: 0.15, chod: -0.03 }, trw: 110, waga: 7, cena: 120, rys: "luska", g: "f",
            zrodla: ["kowal Tadek", "podziemia 1-10"], opis: "Brązowe łuski naszyte na skórę. Mocna jak na brąz, ale ciężka i dzwoni przy każdym kroku." }),
        Z(353, "Kolczuga", "tors", "zbroja_kolczuga_zelazo", "zelazo", 11, 0.28, { kara: { oddech: 0.05, skradanie: 0.12 }, trw: 140, waga: 6, cena: 170, rys: "kolczuga", g: "f",
            zrodla: ["kwatermistrz Kłos", "kuźnia", "łup: najemnicy", "podziemia 11-30"], opis: "Żelazna koszula z tysięcy kółek, do kolan. Chroni przed cięciem, nie przed zmęczeniem." }),
        Z(354, "Żelazna łuska", "tors", "zbroja_luska_zelazo", "zelazo", 13, 0.30, { kara: { oddech: 0.08, skradanie: 0.2, chod: -0.03 }, trw: 160, waga: 8, cena: 200, rys: "luska", g: "f",
            zrodla: ["kowal Tadek", "podziemia 31-50"], opis: "Żelazne łuski na skórzanym kaftanie. Mocniejsza od kolczugi, ale ciężka i głośna." }),
        Z(355, "Brygantyna", "tors", "zbroja_brygantyna_zelazo", "zelazo", 15, 0.30, { kara: { oddech: 0.04, skradanie: 0.06 }, trw: 170, waga: 6, cena: 260, rys: "brygantyna", g: "f",
            zrodla: ["kwatermistrz Kłos (przychylność 50)", "kantor"], opis: "Żelazne płytki ukryte pod suknem, nabite nitami. Mocna, cicha i wygodna - zbroja oficera." }),
        Z(356, "Jedwabna przeszywanica", "tors", "zbroja_przeszywanica_jedwab", "jedwab", 16, 0.27, { cieplo: 0.35, bonus: { sneak: 0.05 }, trw: 180, waga: 1, wartosc: 380, rys: "przeszywanica", g: "f",
            zrodla: ["Matka pająków (piętro 40)", "podziemia 31-50 (rzadko)"], opis: "Przeszywanica utkana z nici olbrzymich pajęczyc. Lekka jak koszula, ciepła, cicha - i zaskakująco mocna." }),
        Z(357, "Stalowa kolczuga", "tors", "zbroja_kolczuga_stal", "stal", 17, 0.31, { kara: { oddech: 0.04, skradanie: 0.1 }, trw: 220, waga: 6, cena: 340, rys: "kolczuga", g: "f",
            zrodla: ["kantor", "kuźnia (stal)", "Topielec z głębiny (piętro 50)", "podziemia 51-75"], opis: "Kolczuga z drobnych stalowych kółek, nitowanych jedno po drugim. Lżejsza i mocniejsza od żelaznej." }),
        Z(358, "Stalowy napierśnik", "tors", "zbroja_napiersnik_stal", "stal", 19, 0.33, { kara: { oddech: 0.07, skradanie: 0.15, chod: -0.03 }, trw: 260, waga: 7, cena: 420, rys: "napiersnik",
            zrodla: ["kantor", "kuźnia (stal)"], opis: "Płyta ze stali na pierś i plecy, na pasach. Najmocniejsza zbroja z kuźni - ciężka i niecicha." }),
        Z(359, "Pancerz zakonny", "tors", "zbroja_napiersnik_zakon", "zakon", 25, 0.35, { kara: { oddech: 0.04, skradanie: 0.08 }, trw: 320, waga: 6, wartosc: 700, rys: "napiersnik",
            zrodla: ["podziemia 76-99"], opis: "Pancerz braci straży z krukiem na piersi. Stal zakonna: mocniejsza i lżejsza od każdej znanej." }),
        // ---- ręce
        Z(360, "Skórzane karwasze", "rece", "karwasze_skora", "skora", 2, 0.02, { trw: 50, waga: 1, cena: 15, rys: "karwasze", g: "p",
            zrodla: ["garbarnia", "garbarz Ignac", "łup: łucznicy", "szmaciarz (używane)"], opis: "Skórzane osłony przedramion. Cięciwa nie smaga ręki, a cios ześlizguje się bokiem." }),
        Z(361, "Brązowe karwasze", "rece", "karwasze_braz", "braz", 6, 0.03, { trw: 80, waga: 1, cena: 30, rys: "karwasze", g: "p",
            zrodla: ["kowal Tadek", "podziemia 1-10"], opis: "Brązowe karwasze wyklepane na kształt przedramienia." }),
        Z(362, "Żelazne karwasze", "rece", "karwasze_zelazo", "zelazo", 10, 0.04, { trw: 120, waga: 2, cena: 50, rys: "karwasze", g: "p",
            zrodla: ["kowal Tadek", "kuźnia", "łup: puste zbroje", "podziemia 11-30"], opis: "Żelazne karwasze na rzemieniach. Przyjmują ciosy, które szły w rękę." }),
        Z(363, "Rękawice kolcze", "rece", "karwasze_zelazo", "zelazo", 12, 0.04, { kara: { skradanie: 0.02 }, bonus: { "melee.crit": 0.02 }, trw: 130, waga: 1, cena: 60, rys: "rekawice", g: "p",
            zrodla: ["kwatermistrz Kłos", "podziemia 31-50"], opis: "Rękawice z kółek na skórzanej podszewce. Pewny chwyt: odrobinę częstsze krytyki." }),
        Z(364, "Stalowe rękawice płytowe", "rece", "karwasze_stal", "stal", 18, 0.05, { kara: { oddech: 0.01 }, trw: 200, waga: 2, cena: 130, rys: "rekawice_plyty", g: "p",
            zrodla: ["kantor", "kuźnia (stal)", "podziemia 51-75"], opis: "Stalowe płytki na palcach i grzbiecie dłoni. Ręka nie boi się ostrza." }),
        Z(365, "Karwasze zakonne", "rece", "karwasze_zakon", "zakon", 24, 0.05, { trw: 260, waga: 1, wartosc: 260, rys: "karwasze", g: "p",
            zrodla: ["podziemia 76-99"], opis: "Karwasze braci warty z rytem kruczych piór. Lekkie i twarde." }),
        // ---- nogi
        Z(366, "Skórzane nagolenniki", "nogi", "nagolenniki_skora", "skora", 3, 0.03, { cieplo: 0.05, trw: 60, waga: 1, cena: 22, rys: "nagolenniki", g: "p",
            zrodla: ["garbarnia", "garbarz Ignac", "szmaciarz (używane)"], opis: "Utwardzona skóra od kolana do kostki. Chroni łydki przed ciosem i cierniem." }),
        Z(367, "Brązowe nagolenniki", "nogi", "nagolenniki_braz", "braz", 7, 0.04, { kara: { chod: -0.01 }, trw: 90, waga: 2, cena: 40, rys: "nagolenniki", g: "p",
            zrodla: ["kowal Tadek", "podziemia 1-10"], opis: "Brązowe nagolenniki na rzemieniach. Trochę ciążą przy chodzie." }),
        Z(368, "Żelazne nagolenniki", "nogi", "nagolenniki_zelazo", "zelazo", 11, 0.05, { kara: { chod: -0.01, skradanie: 0.03 }, trw: 130, waga: 3, cena: 65, rys: "nagolenniki", g: "p",
            zrodla: ["kowal Tadek", "kuźnia", "podziemia 11-30"], opis: "Żelazne nagolenniki z nakolannikiem. Mocne, choć słychać je w krzakach." }),
        Z(369, "Stalowe nagolenniki", "nogi", "nagolenniki_stal", "stal", 18, 0.06, { kara: { chod: -0.02, skradanie: 0.04 }, trw: 200, waga: 3, cena: 150, rys: "nagolenniki", g: "p",
            zrodla: ["kantor", "kuźnia (stal)", "podziemia 51-75"], opis: "Stalowe płyty na golenie i uda. Mocne, ale chodzi się w nich ciężej." }),
        Z(370, "Nagolenniki zakonne", "nogi", "nagolenniki_zakon", "zakon", 24, 0.06, { kara: { chod: -0.01 }, trw: 260, waga: 2, wartosc: 300, rys: "nagolenniki", g: "p",
            zrodla: ["podziemia 76-99"], opis: "Nagolenniki braci warty. Prawie nie czuć ich na nogach." }),
        // ---- stopy
        Z(371, "Wysokie buty", "stopy", "buty_czarne", "skora", 4, 0.02, { cieplo: 0.1, kara: { chod: 0.08 }, trw: 70, waga: 2, cena: 40, rys: "buty_wysokie", g: "p",
            zrodla: ["garbarnia", "garbarz Ignac"], opis: "Buty z cholewą do kolan. Szybki marsz, suche stopy, odrobina ochrony." }),
        Z(372, "Buty okute", "stopy", "buty_okute_zelazo", "zelazo", 9, 0.03, { kara: { chod: 0.06, skradanie: 0.08 }, trw: 110, waga: 2, cena: 55, rys: "buty_okute", g: "p",
            zrodla: ["kowal Tadek", "kuźnia"], opis: "Skórzane buty z żelaznymi okuciami na palcach i obcasie. Mocne - i słychać je z daleka." }),
        Z(373, "Stalowe trzewiki", "stopy", "buty_okute_stal", "stal", 17, 0.04, { kara: { chod: 0.04, skradanie: 0.1 }, trw: 180, waga: 3, cena: 120, rys: "buty_okute", g: "p",
            zrodla: ["kantor", "podziemia 51-75"], opis: "Trzewiki ze stalowych płytek na skórzanym bucie. Pewny krok na każdym kamieniu." }),
        Z(374, "Buty zakonne", "stopy", "buty_okute_zakon", "zakon", 24, 0.04, { kara: { chod: 0.1 }, trw: 240, waga: 2, wartosc: 260, rys: "buty_wysokie", g: "p",
            zrodla: ["podziemia 76-99"], opis: "Buty posłańców zakonu, lekkie i ciche. Chodzisz w nich najszybciej." }),

        // ================================================================ shields 375-380
        TA(375, "Okuta tarcza", "tarcza_okuta", "okute", 4, 0.78, 0.65, { trw: 70, waga: 4, cena: 35, rys: "tarcza_okragla",
            zrodla: ["kuźnia (drewniana tarcza + żelazo)", "kowal Tadek", "szmaciarz (używana)"], opis: "Drewniana tarcza obita żelaznym brzegiem. Trzyma więcej i dłużej." }),
        TA(376, "Okrągła tarcza z umbem", "tarcza_umbo_braz", "braz", 7, 0.78, 0.55, { parowanie: 0.25, trw: 90, waga: 3, cena: 55, rys: "tarcza_okragla",
            zrodla: ["kowal Tadek", "podziemia 1-10"], opis: "Okrągła tarcza z brązowym guzem pośrodku. Lekka: łatwiej nią parować." }),
        TA(377, "Puklerz", "tarcza_puklerz", "zelazo", 9, 0.68, 0.5, { parowanie: 0.5, trw: 110, waga: 1, cena: 45, rys: "puklerz", g: "m",
            zrodla: ["kowal Tadek", "kwatermistrz Kłos", "podziemia 11-30"], opis: "Mała żelazna tarcza na pięść. Słabo zatrzymuje cios, ale okno parowania jest o połowę dłuższe." }),
        TA(378, "Migdałowa tarcza", "tarcza_migdalowa", "zelazo", 12, 0.82, 0.65, { oslona: 0.25, kara: { oddech: 0.02 }, trw: 150, waga: 5, cena: 110, rys: "tarcza_migdalowa",
            zrodla: ["kwatermistrz Kłos", "kuźnia", "łup: najemnicy", "podziemia 11-30"], opis: "Wysoka tarcza w kształcie migdała, okuta żelazem. Zasłania szerzej - także ciosy z boku." }),
        TA(379, "Żelazna tarcza", "tarcza_zelazna", "stal", 16, 0.86, 0.55, { kara: { oddech: 0.05, chod: -0.02 }, trw: 200, waga: 7, cena: 190, rys: "tarcza_migdalowa",
            zrodla: ["kuźnia (stal)", "kantor", "podziemia 51-75"], opis: "Cała z żelaza i stali. Zatrzymuje prawie wszystko, ale ciąży na ręce i odbiera oddech." }),
        TA(380, "Tarcza zakonna", "tarcza_zakonna", "zakon", 24, 0.87, 0.45, { parowanie: 0.25, oslona: 0.15, trw: 280, waga: 4, wartosc: 380, rys: "tarcza_migdalowa",
            zrodla: ["podziemia 76-99"], opis: "Tarcza straży zakonu z białym krukiem. Mocna, lekka, dobrze się nią paruje." }),

        // ================================================================ trinkets 381-395 (Dodatek)
        DO(381, "Amulet z kłem wilka", "amulet", 3, { "melee.dmg": 0.05 }, { cena: 40, zrodla: ["szmaciarz Józek"], opis: "Wilczy kieł na rzemieniu. Mówią, że dodaje zęba w walce." }),
        DO(382, "Bursztynowy amulet", "amulet", 4, { cold: 0.25 }, { cena: 45, zrodla: ["szmaciarz Józek"], opis: "Bryłka bursztynu z morza. Ciepła w dłoni nawet zimą." }),
        DO(383, "Miedziany pierścień", "pierscien", 1, { sell: 0.06 }, { cena: 25, zrodla: ["szmaciarz Józek", "łup: bandyci"], opis: "Zwykła miedź, ale kupiec od razu widzi, że nie jesteś byle kim. Sprzedajesz trochę drożej." }),
        DO(384, "Pierścień z hematytem", "pierscien", 8, { "hp.max": 15 }, { cena: 130, zrodla: ["kantor", "Królowa szczurów (piętro 30)"], opis: "Czarny, lśniący kamień krwi. Noszący go wytrzymuje więcej." }),
        DO(385, "Kciukowy pierścień łucznika", "pierscien", 6, { "aim.speed": 0.12, "ranged.dmg": 0.06 }, { cena: 70, zrodla: ["kwatermistrz Kłos", "łup: łucznicy"],
            opis: "Rogowy pierścień na kciuk do naciągania cięciwy. Szybsze celowanie, mocniejszy strzał." }),
        DO(386, "Kruczy talizman", "talizman", 6, { sneak: 0.15 }, { cena: 90, zrodla: ["kantor"], opis: "Kamyk z wyrytym krukiem. Baltazar przysięga, że nie ze ściany dworu." }),
        DO(387, "Amulet z pazurem niedźwiedzia", "amulet", 5, { "knock.resist": 0.25 }, { wartosc: 60, zrodla: ["warsztat (pazur niedźwiedzia)"],
            opis: "Pazur niedźwiedzia na lnianym sznurze. Stoisz pewniej na nogach." }),
        DO(388, "Pierścień z akwamarynem", "pierscien", 12, { "breath.regen": 0.2 }, { cena: 170, zrodla: ["kantor", "podziemia 51-75"], opis: "Kamień barwy morskiej wody. Oddech wraca szybciej." }),
        DO(389, "Talizman zakonu", "talizman", 10, { "mind.resist": 0.12 }, { wartosc: 120, zrodla: ["podziemia 11-50", "łup: upiory, cienie"],
            opis: "Brązowy krąg z okiem, jaki nosili bracia. Pomaga oprzeć się „prawdzie” z ruin." }),
        DO(390, "Paciorki strażnika", "talizman", 18, { "mind.short": 0.25, "wound.heal": 0.25 }, { wartosc: 260, zrodla: ["Upiór pytającego (piętro 80)", "podziemia 76-99"],
            opis: "Sznur kamiennych paciorków, przesuwanych przy każdej warcie. Strach mija szybciej, rany szybciej się goją." }),
        DO(391, "Pierścień najemnika", "pierscien", 10, { "melee.crit": 0.04 }, { cena: 110, zrodla: ["kwatermistrz Kłos (przychylność 50)", "łup: najemnicy"],
            opis: "Żelazny sygnet z wyrytym mieczem - znak kompanii. Trafiasz tam, gdzie boli." }),
        DO(392, "Muszla z przystani", "amulet", 2, { thirst: 0.12 }, { cena: 20, zrodla: ["szmaciarz Józek"], opis: "Muszla na sznurku. Rybacy mówią, że kto ją nosi, mniej pragnie." }),
        DO(393, "Krwawnikowy pierścień", "pierscien", 9, { "bandage.heal": 0.25, "wound.heal": 0.2 }, { cena: 95, zrodla: ["kantor", "podziemia 31-50"],
            opis: "Zielony kamień w czerwone plamki. Opatrunek leczy więcej, rana goi się szybciej." }),
        DO(394, "Grosz strażnicy", "talizman", 4, { luck: 0.15 }, { wartosc: 60, zrodla: ["podziemia 1-30 (szczątki, skrzynie)"],
            opis: "Moneta z krukiem na rzemieniu - grosz, którym zakon płacił przewoźnikom. Przynosi szczęście w ruinach." }),
        DO(395, "Amulet z kłem odyńca", "amulet", 4, { "hunt.dmg": 0.1 }, { wartosc: 45, zrodla: ["warsztat (kieł odyńca)"], opis: "Kieł odyńca na rzemieniu. Zwierz czuje łowcę." }),

        // ================================================================ the uniques 396-406 (their stories: UNIKATY)
        B(396, "Miecz Bogumiła", "miecz", "zakon", 12, { unikat: true, wyglad: "bron_miecz_bogumila", wartosc: 600, trw: 600, reka: { "mind.resist": 0.1 },
            staty: { dmg: 31, poise: 30, cost: 10, crit: 0.08, reach: 1.6 }, zrodla: ["W4 Krew kasztelana: Borgar po rozmowie o rodzie"],
            opis: "Miecz ostatniego kasztelana, Bogumiła z rodu Kowali. Na głowni wyryte: „Nie pytam”. W ręku łatwiej oprzeć się prawdzie." }),
        Z(397, "Rękawice Żelaznej Pięści", "rece", "karwasze_skora_czarna", "zelazo", 12, 0.05, { unikat: true, piesci: { dmg: 8, poise: 14 }, trw: 300, waga: 1, wartosc: 250, rys: "rekawice_plyty", g: "p",
            zrodla: ["W8 Żelazna Pięść: Grum (sojusz albo pojedynek)"], opis: "Rękawice Gruma z żelaznymi płytkami na kostkach. Pięść w nich bije jak buzdygan." }),
        B(398, "Kostur przeora", "kostur", "zakon", 9, { unikat: true, wyglad: "bron_kostur_przeora", wartosc: 350, trw: 500, reka: { "mind.resist": 0.08 },
            staty: { dmg: 24, poise: 52, cost: 12, reach: 1.8, pancerz: 1.3 }, zrodla: ["Przeor w zbroi (piętro 20)"],
            opis: "Okuty kostur przeora z krukiem na głowicy. Ciężki jak buzdygan, długi jak włócznia - i przypomina o jednym pytaniu." }),
        B(399, "Długi miecz bez herbu", "dlugi_miecz", "pierwszych", 21, { unikat: true, wyglad: "bron_dlugi_miecz_bez_herbu", wartosc: 700, trw: 700,
            staty: { dmg: 42, poise: 38, cost: 12, crit: 0.07, reach: 1.8 }, zrodla: ["Zbroja bez herbu (piętro 70)"],
            opis: "Miecz pustego pancerza starszego niż zakon. Ktoś wydrapał z niego herb - zostało ostrze, które pamięta wojnę, której nikt nie spisał." }),
        Z(400, "Hełm strażnika bramy", "glowa", "helm_zakonny_zelazo", "zakon", 6, 0.08, { unikat: true, cieplo: 0.1, bonus: { "mind.resist": 0.1 }, kara: { oddech: 0.02 },
            trw: 300, waga: 3, wartosc: 300, rys: "helm_zakonny", zrodla: ["Strażnik dziesiątej bramy (piętro 10)"],
            opis: "Hełm strażnika dziesiątej bramy. W szczelinie przyłbicy jeszcze tli się żar. Kto go nosi, łatwiej znosi to, co szepczą ruiny." }),
        TA(401, "Tarcza Skrzydlatej Straży", "tarcza_skrzydlata_straz", "zakon", 14, 0.85, 0.45, { unikat: true, parowanie: 0.3, oslona: 0.15, trw: 350, waga: 3, wartosc: 450, rys: "tarcza_migdalowa",
            zrodla: ["W13 Skrzydlata Straż: koniec wątku"], opis: "Lekka tarcza jeźdźców orłów z białym skrzydłem na polu. Szeroka garda, długie okno parowania." }),
        B(402, "Szabla spod Brzozowej Woli", "szabla", "stal", 15, { unikat: true, wyglad: "bron_szabla_brzozowa", wartosc: 500, trw: 500,
            staty: { dmg: 33, poise: 26, cost: 9, crit: 0.12, reach: 1.6 }, zrodla: ["Garnizon: przychylność 80 (rotmistrz Bełza)"],
            opis: "Szabla chorągwi brzozowskiej, którą rotmistrz Bełza przechował po bitwie. Twoja wieś, twoja szabla - lekka, szybka i bardzo ostra." }),
        B(403, "Krucze pióro", "sztylet", "stal", 8, { unikat: true, wyglad: "bron_sztylet_krucze_pioro", wartosc: 260, trw: 400, reka: { sneak: 0.1 },
            staty: { dmg: 19, poise: 12, cost: 6, crit: 0.15, ukrycie: 1.6 }, zrodla: ["D24 Oswojony kruk: dziadek Stach"],
            opis: "Sztylet kruczarzy, posłańców zakonu, z rękojeścią jak pióro. Cichy w ręku, zabójczy z ukrycia." }),
        DO(404, "Oko Pierwszych", "talizman", 19, { "mind.see": 1, "mind.resist": 0.15, "melee.crit": 0.03 }, { unikat: true, wartosc: 600, rys: "oko",
            zrodla: ["Kamienny Odźwierny (piętro 60)"], opis: "Kryształ z czoła Odźwiernego, z tego samego kamienia co soczewka latarni. Pokazuje to, co się ukrywa." }),
        Z(405, "Kolczuga Ostatniej Straży", "tors", "zbroja_kolczuga_zakon", "zakon", 25, 0.37, { unikat: true, bonus: { "mind.resist": 0.1 }, kara: { oddech: 0.03 },
            trw: 450, waga: 5, wartosc: 900, rys: "kolczuga", g: "f", zrodla: ["Ostatni Strażnik (piętro 90)"],
            opis: "Kolczuga ostatniego strażnika, czarna i cicha jak noc. Nie dzwoni, nie ciąży - i trzyma prawdę z dala od głowy." }),
        B(406, "Łuk Białej Źrenicy", "luk", "refleksyjny", 12, { unikat: true, wyglad: "bron_luk_bialej_zrenicy", wartosc: 550, trw: 300,
            staty: { damage: 46, range: 10.5, steady: 48, cooldown: 26, stamina: 3 }, zrodla: ["W12 Rozbitek: kajuta kapitana „Białej Źrenicy”"],
            opis: "Łuk kapitana okrętu Czarnych Oczu, z białym okiem na majdanie. Strzela daleko i mocno." }),

        // ================================================================ the steel tools 407-408 (2026-10-23, the user): better than the iron ones
        // at the trees, the bushes, the rocks and the ore (ChoppableTree_Objects.js BETTER_TOOLS: half the blows instead of 0.65, a third less
        // strength a blow) - and weapons of steel in a fight. narzedzie: not a weapon of the shops' or F9's sets
        B(407, "Stalowa siekiera", "siekiera", "stal", 15, { narzedzie: true, trw: 320, cena: 180, waga: 2,
            zrodla: ["kuźnia (stal)", "kantor"], opis: "Siekiera z hartowanej stali. Drzewo i krzak potrzebują połowy uderzeń kamiennej siekiery (żelaznej: dwóch trzecich), a każde męczy mniej. W walce tnie jak stalowy topór." }),
        B(408, "Stalowy kilof", "kilof", "stal", 15, { narzedzie: true, trw: 260, cena: 200, waga: 2,
            zrodla: ["kuźnia (stal)", "kantor"], opis: "Kilof ze stalowym grotem. Skała i ruda potrzebują połowy uderzeń kamiennego kilofa (żelaznego: dwóch trzecich), a każde męczy mniej. W walce bije jak młot." }),

        // ================================================================ (2026-11-17, docs/ekwipunek/NOWE_80.md) the full sets of every material,
        // the missing kinds of weapons, more trinkets - 419-482; each made at the forge, the tannery, the workbench or the loom (PRZEPISY)
        // ---- głowa
        Z(419, "Sukienny kaptur", "glowa", "helm_kaptur_welna", "sukno", 5, 0.04, { cieplo: 0.2, trw: 55, waga: 1, cena: 30, rys: "kaptur",
            zrodla: ["krosno", "szwaczka Dorota", "szmaciarz (używany)"], opis: "Gruby kaptur z sukna z pelerynką na ramiona: ciepły i cichy." }),
        Z(420, "Skórzany hełm", "glowa", "helm_otwarty_skora", "skora", 7, 0.05, { cieplo: 0.05, trw: 70, waga: 1, cena: 40, rys: "otwarty",
            zrodla: ["garbarnia", "garbarz Ignac", "łup: bandyci"], opis: "Skóra gotowana w wosku: twarda jak deska, lekka jak czapka." }),
        Z(421, "Brązowy hełm z nosalem", "glowa", "helm_nosal_braz", "braz", 8, 0.07, { kara: { oddech: 0.02 }, trw: 100, waga: 2, cena: 60, rys: "helm_nosal",
            zrodla: ["kuźnia (sztabki brązu)", "kowal Tadek", "podziemia 1-10"], opis: "Stożkowy hełm z brązu z nosalem. Mocniejszy od kapalina, trochę męczy." }),
        Z(422, "Żelazny kapalin", "glowa", "helm_kapalin_zelazo", "zelazo", 10, 0.07, { kara: { oddech: 0.01 }, trw: 120, waga: 2, cena: 70, rys: "kapalin",
            zrodla: ["kuźnia", "kowal Tadek", "kwatermistrz Kłos", "łup: najemnicy", "podziemia 11-30"], opis: "Żelazny kapelusz z szerokim rondem. Lżejszy od hełmu z nosalem." }),
        Z(423, "Stalowy czepiec kolczy", "glowa", "helm_czepiec_stal", "stal", 15, 0.07, { cieplo: 0.05, kara: { skradanie: 0.03 }, trw: 170, waga: 2, cena: 120, rys: "czepiec_kolczy",
            zrodla: ["kuźnia (stal)", "kantor", "podziemia 51-75"], opis: "Kaptur z drobnych stalowych kółek. Lżejszy i mocniejszy od żelaznego." }),
        Z(424, "Stalowy kapalin", "glowa", "helm_kapalin_stal", "stal", 16, 0.07, { trw: 170, waga: 2, cena: 140, rys: "kapalin",
            zrodla: ["kuźnia (stal)", "kantor"], opis: "Stalowy kapalin z kontynentu: nie męczy i nie dzwoni." }),
        Z(425, "Stalowy hełm garnczkowy", "glowa", "helm_garnczkowy_stal", "stal", 21, 0.09, { kara: { oddech: 0.03 }, trw: 220, waga: 4, cena: 230, rys: "helm_garnczkowy",
            zrodla: ["kuźnia (stal)", "kantor"], opis: "Zamknięty stalowy garnek z wizjerem. Najmocniejszy hełm z kuźni, ale duszno w nim." }),
        Z(426, "Zakonny czepiec kolczy", "glowa", "helm_czepiec_zakon", "zakon", 22, 0.08, { cieplo: 0.05, trw: 240, waga: 2, wartosc: 330, rys: "czepiec_kolczy",
            zrodla: ["kuźnia (Młotek majstra)", "podziemia 76-99"], opis: "Czepiec braci warty z czarnych kółek. Nie dzwoni i nie ciąży." }),
        // ---- tors
        Z(427, "Sukienna przeszywanica", "tors", "zbroja_przeszywanica_welna", "sukno", 7, 0.20, { cieplo: 0.4, trw: 70, waga: 2, cena: 60, rys: "przeszywanica", g: "f",
            zrodla: ["krosno", "szwaczka Dorota", "kwatermistrz Kłos"], opis: "Gruby kaftan z sukna pikowany w romby. Najcieplejsza zbroja, cicha jak każda tkanina." }),
        Z(428, "Futrzana skórznia", "tors", "zbroja_skorznia_skora", "skora", 7, 0.24, { cieplo: 0.35, trw: 80, waga: 4, cena: 85, rys: "skorznia", g: "f",
            zrodla: ["garbarnia (skóra niedźwiedzia)", "garbarz Ignac"], opis: "Skórznia podbita niedźwiedzim futrem. Na zimę i na wilki." }),
        Z(429, "Brązowy napierśnik", "tors", "zbroja_napiersnik_braz", "braz", 9, 0.27, { kara: { oddech: 0.06, skradanie: 0.12, chod: -0.02 }, trw: 120, waga: 6, cena: 140, rys: "napiersnik",
            zrodla: ["kuźnia (sztabki brązu)", "kowal Tadek", "podziemia 1-10 (rzadko)"], opis: "Wyklepana płyta z brązu na pierś i plecy. Najmocniejszy brąz - i najcięższy." }),
        Z(430, "Żelazny napierśnik", "tors", "zbroja_napiersnik_zelazo", "zelazo", 14, 0.30, { kara: { oddech: 0.07, skradanie: 0.15, chod: -0.03 }, trw: 170, waga: 7, cena: 190, rys: "napiersnik",
            zrodla: ["kuźnia", "kowal Tadek", "podziemia 31-50"], opis: "Płyta z kutego żelaza na pasach. Trzyma jak łuska, a dzwoni mniej." }),
        Z(431, "Stalowa łuska", "tors", "zbroja_luska_stal", "stal", 20, 0.33, { kara: { oddech: 0.06, skradanie: 0.2, chod: -0.02 }, trw: 250, waga: 8, cena: 380, rys: "luska", g: "f",
            zrodla: ["kuźnia (stal)", "kantor", "podziemia 51-75"], opis: "Stalowe łuski na skórzanym kaftanie. Mniej dusi niż napierśnik, ale słychać ją z daleka." }),
        Z(432, "Stalowa brygantyna", "tors", "zbroja_brygantyna_stal", "stal", 21, 0.33, { kara: { oddech: 0.04, skradanie: 0.06 }, trw: 260, waga: 6, cena: 440, rys: "brygantyna", g: "f",
            zrodla: ["kuźnia (stal, sukno)", "kwatermistrz Kłos (przychylność 70)", "kantor"], opis: "Stalowe płytki pod suknem, nabite nitami. Zbroja rotmistrza: mocna i cicha." }),
        Z(433, "Zakonna kolczuga", "tors", "zbroja_kolczuga_zakon", "zakon", 22, 0.33, { kara: { oddech: 0.03, skradanie: 0.08 }, trw: 300, waga: 5, wartosc: 560, rys: "kolczuga", g: "f",
            zrodla: ["kuźnia (Młotek majstra)", "podziemia 76-99"], opis: "Kolczuga z czarnych zakonnych kółek. Lekka jak przeszywanica." }),
        Z(434, "Zakonna łuska", "tors", "zbroja_luska_zakon", "zakon", 24, 0.34, { kara: { oddech: 0.06, skradanie: 0.14, chod: -0.02 }, trw: 320, waga: 7, wartosc: 620, rys: "luska", g: "f",
            zrodla: ["kuźnia (Młotek majstra)", "podziemia 76-99"], opis: "Łuski w kształcie kruczych piór. Prawie jak pancerz zakonny, o poziom wcześniej." }),
        // ---- ręce, nogi, stopy
        Z(435, "Pikowane rękawice", "rece", "karwasze_len", "plotno", 2, 0.02, { cieplo: 0.05, trw: 40, waga: 1, cena: 12, rys: "rekawice", g: "p",
            zrodla: ["krosno", "szwaczka Dorota", "szmaciarz (używane)"], opis: "Rękawice z pikowanego lnu. Trochę chronią, trochę grzeją." }),
        Z(436, "Ćwiekowane karwasze", "rece", "karwasze_skora_czarna", "skora", 6, 0.03, { kara: { skradanie: 0.02 }, trw: 70, waga: 1, cena: 30, rys: "karwasze", g: "p",
            zrodla: ["garbarnia", "garbarz Ignac", "łup: bandyci"], opis: "Skórzane karwasze nabite ćwiekami. Ostrze ześlizguje się po główkach." }),
        Z(437, "Stalowe rękawice kolcze", "rece", "karwasze_stal", "stal", 16, 0.04, { kara: { skradanie: 0.02 }, bonus: { "melee.crit": 0.02 }, trw: 190, waga: 1, cena: 110, rys: "rekawice", g: "p",
            zrodla: ["kuźnia (stal)", "kantor", "podziemia 51-75"], opis: "Rękawice z drobnej stalowej kolczugi. Pewny chwyt, częstsze krytyki." }),
        Z(438, "Pikowane nogawice", "nogi", "nagolenniki_len", "plotno", 3, 0.03, { cieplo: 0.1, trw: 45, waga: 1, cena: 18, rys: "nagolenniki", g: "p",
            zrodla: ["krosno", "szwaczka Dorota", "szmaciarz (używane)"], opis: "Pikowane nogawice do kolan. Ciepłe i ciche." }),
        Z(439, "Ćwiekowane nagolenniki", "nogi", "nagolenniki_skora", "skora", 7, 0.04, { kara: { skradanie: 0.03 }, trw: 80, waga: 2, cena: 38, rys: "nagolenniki", g: "p",
            zrodla: ["garbarnia", "garbarz Ignac", "kowal Tadek"], opis: "Utwardzona skóra z ćwiekami, od kolana do kostki." }),
        Z(440, "Kolcze nogawice", "nogi", "nagolenniki_zelazo", "zelazo", 13, 0.05, { kara: { skradanie: 0.05 }, trw: 140, waga: 2, cena: 75, rys: "nagolenniki", g: "p",
            zrodla: ["kuźnia", "kwatermistrz Kłos", "łup: najemnicy", "podziemia 31-50"], opis: "Nogawice z żelaznych kółek. Chronią jak nagolenniki, a nie spowalniają." }),
        Z(441, "Stalowe nogawice kolcze", "nogi", "nagolenniki_stal", "stal", 16, 0.05, { kara: { skradanie: 0.04 }, trw: 190, waga: 2, cena: 120, rys: "nagolenniki", g: "p",
            zrodla: ["kuźnia (stal)", "kantor"], opis: "Stalowe kółka od biodra do kostki. Lekkie, nie męczą w marszu." }),
        Z(442, "Filcowe buty", "stopy", "buty_filcowe", "filc", 3, 0.02, { cieplo: 0.2, kara: { chod: 0.04 }, trw: 50, waga: 1, cena: 20, rys: "buty_wysokie", g: "p",
            zrodla: ["krosno", "szwaczka Dorota"], opis: "Buty z ubitej wełny na skórzanej podeszwie. Zimą stopy nie marzną." }),
        Z(443, "Buty łowcy", "stopy", "buty_brazowe", "skora", 6, 0.02, { kara: { chod: 0.08 }, bonus: { sneak: 0.05 }, trw: 80, waga: 1, cena: 55, rys: "buty_wysokie", g: "p",
            zrodla: ["garbarnia", "garbarz Ignac"], opis: "Miękkie buty z wełnianą wyściółką. Szybki i cichy krok." }),
        Z(444, "Brązowe trzewiki", "stopy", "buty_okute_braz", "braz", 6, 0.03, { kara: { chod: 0.04, skradanie: 0.06 }, trw: 90, waga: 2, cena: 45, rys: "buty_okute", g: "p",
            zrodla: ["kuźnia (sztabki brązu)", "kowal Tadek", "podziemia 1-10"], opis: "Skórzane buty z brązowymi okuciami na palcach." }),

        // ---- tarcze 445-451
        TA(445, "Plecionka", "tarcza_drewniana_plecionka", "wiklina", 2, 0.72, 0.65, { parowanie: 0.2, trw: 35, waga: 2, cena: 8, rys: "tarcza_okragla",
            zrodla: ["warsztat", "szmaciarz (używana)"], opis: "Tarcza upleciona z wikliny. Lekka, łatwo nią parować, ale słabo trzyma." }),
        TA(446, "Tarcza obciągnięta skórą", "tarcza_drewniana_skora", "skora", 3, 0.77, 0.6, { parowanie: 0.1, trw: 60, waga: 3, cena: 25, rys: "tarcza_okragla",
            zrodla: ["garbarnia (drewniana tarcza)", "garbarz Ignac"], opis: "Drewniana tarcza obciągnięta mokrą skórą, która wyschła twarda jak bęben." }),
        TA(447, "Brązowy puklerz", "tarcza_puklerz_braz", "braz", 5, 0.68, 0.55, { parowanie: 0.4, trw: 80, waga: 1, cena: 30, rys: "puklerz", g: "m",
            zrodla: ["kuźnia (sztabka brązu)", "kowal Tadek", "podziemia 1-10"], opis: "Mała brązowa tarcza na pięść. Do parowania, nie do zasłaniania." }),
        TA(448, "Tarcza z pancerza kraba", "tarcza_okuta_krab", "krab", 8, 0.80, 0.6, { trw: 120, waga: 3, cena: 60, rys: "tarcza_okragla",
            zrodla: ["warsztat (pancerze krabów olbrzymów)"], opis: "Trzy pancerze kraba olbrzyma na desce. Twarda jak żelazo, lekka jak drewno." }),
        TA(449, "Pawęż", "tarcza_migdalowa_pawez", "zelazo", 14, 0.85, 0.6, { oslona: 0.25, kara: { oddech: 0.06, chod: -0.03 }, trw: 190, waga: 8, cena: 160, rys: "tarcza_migdalowa",
            zrodla: ["kuźnia", "kwatermistrz Kłos", "zbrojownia Lorda (W7)"], opis: "Wielka tarcza piechoty okuta żelazem. Chowasz się za nią cały - i ledwo ją dźwigasz." }),
        TA(450, "Stalowy puklerz", "tarcza_puklerz_stal", "stal", 16, 0.70, 0.45, { parowanie: 0.6, trw: 180, waga: 1, cena: 120, rys: "puklerz", g: "m",
            zrodla: ["kuźnia (stal)", "kantor"], opis: "Stalowy puklerz z kontynentu. Najdłuższe okno parowania ze wszystkich tarcz." }),
        TA(451, "Stalowa migdałowa tarcza", "tarcza_migdalowa_stal", "stal", 18, 0.85, 0.55, { oslona: 0.25, kara: { oddech: 0.02 }, trw: 230, waga: 5, cena: 260, rys: "tarcza_migdalowa",
            zrodla: ["kuźnia (stal)", "kantor", "podziemia 51-75"], opis: "Migdałowa tarcza ze stalowym brzegiem. Lżejsza od żelaznej, zasłania szerzej." }),

        // ---- bronie 452-472 (the numbers: RODZAJE x MATERIALY, as the table of NOWE_80.md has them)
        B(452, "Krzemienny sztylet", "sztylet", "kamien", 2, { zrodla: ["warsztat", "szmaciarz (używany)"],
            opis: "Łupany krzemień na krótkiej rękojeści. Szybki, ale szybko się tępi." }),
        B(453, "Okuty kostur", "kostur", "okute", 4, { zrodla: ["warsztat (dębowy kostur + gwoździe)", "kowal Tadek", "szmaciarz (używany)"],
            opis: "Dębowy kostur okuty żelazem na obu końcach." }),
        B(454, "Cep bojowy", "kiscien", "okute", 4, { zrodla: ["warsztat", "obozy bandytów", "szmaciarz (używany)"],
            opis: "Chłopski cep, bijak okuty gwoździami. Wieś broniła się nim od zawsze." }),
        B(455, "Brązowy tasak", "tasak", "braz", 6, { zrodla: ["kuźnia (sztabki brązu)", "kowal Tadek", "podziemia 1-10"],
            opis: "Szerokie brązowe ostrze. Rąbie mocniej niż brązowy miecz." }),
        B(456, "Brązowy młot bojowy", "mlot", "braz", 8, { zrodla: ["kuźnia (sztabki brązu)", "kowal Tadek", "podziemia 1-10"],
            opis: "Brązowy obuch na długim stylisku - między kamiennym a żelaznym młotem." }),
        B(457, "Żelazna maczuga", "palka", "zelazo", 9, { zrodla: ["kuźnia", "kowal Tadek", "łup: bandyci", "podziemia 11-30"],
            opis: "Maczuga z żelazną głowicą. Szybka, tania w oddechu, dobra na pancerz." }),
        B(458, "Żelazna sulica", "sulica", "zelazo", 10, { zrodla: ["kuźnia", "kwatermistrz Kłos", "kowal Tadek", "podziemia 11-30"],
            opis: "Lekka włócznia z wąskim grotem. Krótsza od włóczni, ale męczy mniej." }),
        B(459, "Żelazny długi miecz", "dlugi_miecz", "zelazo", 13, { zrodla: ["kuźnia", "kowal Tadek", "łup: najemnicy", "podziemia 31-50"],
            opis: "Długa żelazna głownia na półtorej ręki. Sięga dalej niż miecz." }),
        B(460, "Żelazny bardysz", "bardysz", "zelazo", 14, { zrodla: ["kuźnia", "kwatermistrz Kłos", "zbrojownia Lorda (W7)", "podziemia 31-50"],
            opis: "Żelazny półksiężyc na drzewcu. Daleki zasięg, ciężki zamach." }),
        B(461, "Stalowa sulica", "sulica", "stal", 16, { zrodla: ["kuźnia (stal)", "kantor"],
            opis: "Sulica ze stalowym grotem. Szybkie pchnięcia, częste krytyki." }),
        B(462, "Stalowy tasak", "tasak", "stal", 16, { zrodla: ["kuźnia (stal)", "kantor", "podziemia 51-75"],
            opis: "Ciężki stalowy tasak. Mocniejszy cios niż stalowy miecz." }),
        B(463, "Stalowa szabla", "szabla", "stal", 17, { zrodla: ["kuźnia (stal)", "kantor", "kwatermistrz Kłos (przychylność 50)"],
            opis: "Szabla z hartowanej stali. Tani cios i dużo krytyków." }),
        B(464, "Stalowy kiścień", "kiscien", "stal", 17, { zrodla: ["kuźnia (stal)", "kantor", "podziemia 51-75"],
            opis: "Stalowa kula z kolcami na krótkim łańcuchu." }),
        B(465, "Stalowy czekan", "czekan", "stal", 18, { zrodla: ["kuźnia (stal)", "kantor", "podziemia 51-75"],
            opis: "Stalowy dziób przebija każdą blachę." }),
        B(466, "Stalowa rohatyna", "rohatyna", "stal", 18, { zrodla: ["kuźnia (stal)", "kantor"],
            opis: "Rohatyna na niedźwiedzia, ze stalowym grotem i poprzeczką." }),
        B(467, "Tasak zakonny", "tasak", "zakon", 23, { zrodla: ["kuźnia (Młotek majstra)", "podziemia 76-99"],
            opis: "Tasak kwatermistrzów zakonu. Czarne ostrze nie zna tępienia." }),
        B(468, "Czekan zakonny", "czekan", "zakon", 24, { zrodla: ["kuźnia (Młotek majstra)", "podziemia 76-99"],
            opis: "Czekan straży bramy z kruczym dziobem. Na puste zbroje nie ma lepszego." }),
        B(469, "Długi miecz zakonny", "dlugi_miecz", "zakon", 26, { zrodla: ["kuźnia (Młotek majstra)", "podziemia 76-99"],
            opis: "Miecz komtura zakonu. Najdłuższe i najmocniejsze ostrze z kuźni." }),
        B(470, "Bardysz zakonny", "bardysz", "zakon", 26, { zrodla: ["kuźnia (Młotek majstra)", "podziemia 76-99"],
            opis: "Bardysz wart zakonu. Sięga prawie jak włócznia i tnie najmocniej z drzewcowych." }),
        B(471, "Łuk myśliwski", "luk", "mysliwski", 4, { staty: { damage: 34, range: 9.5, steady: 58, cooldown: 30, stamina: 3 }, trw: 90, cena: 45, waga: 2,
            zrodla: ["warsztat", "kwatermistrz Kłos", "łup: łucznicy"], opis: "Mocniejszy od pierwszego łuku - krok przed łukiem długim." }),
        B(472, "Łuk wojenny", "luk", "wojenny", 18, { staty: { damage: 45, range: 11, steady: 56, cooldown: 32, stamina: 4 }, trw: 160, cena: 330, waga: 2,
            zrodla: ["warsztat", "kantor"], opis: "Klejony łuk z drewna, rogu i ścięgien. Strzela daleko i mocno, ciężko się go napina." }),

        // ---- dodatki 473-482
        DO(473, "Amulet z piór", "amulet", 2, { "aim.speed": 0.06, "ranged.dmg": 0.03 }, { cena: 15, zrodla: ["warsztat", "szmaciarz Józek"],
            opis: "Pęk lotek na lnianym sznurku. Ręka sama wie, gdzie celować." }),
        DO(474, "Woreczek z ziołami", "talizman", 3, { "bandage.heal": 0.15 }, { cena: 20, zrodla: ["krosno", "szmaciarz Józek"],
            opis: "Lniany woreczek z suszonym krwawnikiem. Pachnie jak chata znachorki." }),
        DO(475, "Podkowa na rzemieniu", "talizman", 3, { luck: 0.1 }, { cena: 20, zrodla: ["kuźnia", "kowal Tadek"],
            opis: "Mała podkowa ramionami do góry - żeby szczęście się nie wysypało." }),
        DO(476, "Amulet z poroża", "amulet", 4, { "breath.regen": 0.08 }, { cena: 35, zrodla: ["warsztat", "szmaciarz Józek"],
            opis: "Krążek z poroża jelenia. Biegnie się w nim lżej." }),
        DO(477, "Obrączka z modlitwą", "pierscien", 6, { "mind.short": 0.1 }, { cena: 45, zrodla: ["kuźnia (sztabka brązu)", "kowal Tadek", "podziemia 1-10"],
            opis: "Brązowa obrączka z wyrytą modlitwą przewoźników." }),
        DO(478, "Rzemień tropiciela", "talizman", 5, { sneak: 0.08 }, { cena: 30, zrodla: ["garbarnia", "garbarz Ignac", "łup: łucznicy"],
            opis: "Rzemień z piórami sowy na nadgarstku. Krok staje się cichszy." }),
        DO(479, "Żelazny sygnet", "pierscien", 11, { "melee.dmg": 0.07 }, { cena: 90, zrodla: ["kuźnia", "kowal Tadek", "łup: najemnicy"],
            opis: "Ciężki żelazny sygnet. Cios z nim w pięści waży więcej." }),
        DO(480, "Stalowy pierścień łucznika", "pierscien", 15, { "aim.speed": 0.15, "ranged.dmg": 0.08 }, { cena: 150, zrodla: ["kuźnia (stal)", "kantor"],
            opis: "Pierścień na kciuk ze stali i rogu. Cięciwa schodzi równo." }),
        DO(481, "Stalowy sygnet", "pierscien", 17, { "hp.max": 25 }, { cena: 200, zrodla: ["kuźnia (stal)", "kantor", "podziemia 51-75"],
            opis: "Stalowy sygnet z oczkiem z hematytu (to ruda żelaza). Wytrzymujesz dużo więcej." }),
        DO(482, "Pierścień z okiem zakonu", "pierscien", 22, { "mind.resist": 0.15, "mind.short": 0.1 }, { material: "zakon", wartosc: 320, zrodla: ["kuźnia (Młotek majstra)", "podziemia 76-99"],
            opis: "Pierścień brata warty z wyrytym okiem. Szepty ruin milkną." }),

        // ================================================================ the old items (their numbers as they were - only the note is added)
        B(156, "Pałka", "palka", "drewno", 1, { istnieje: true, staty: { dmg: 13, poise: 26, reach: 1.45, cone: 0.45, cost: 10, crit: 0, pancerz: 1 }, trw: 80, waga: 2, zrodla: ["warsztat"] }),
        B(60, "Kamienna siekiera", "siekiera", "kamien", 1, { istnieje: true, staty: { dmg: 17, poise: 24, reach: 1.55, cone: 0.35, cost: 16, se: "Blow2" }, trw: 70, waga: 2, zrodla: ["warsztat"] }),
        B(115, "Żelazna siekiera", "siekiera", "zelazo", 1, { istnieje: true, staty: { dmg: 26, poise: 30, reach: 1.6, cone: 0.35, cost: 16 }, trw: 220, waga: 2, zrodla: ["kuźnia + warsztat"] }),
        B(63, "Kamienny kilof", "kilof", "kamien", 1, { istnieje: true, staty: { dmg: 22, poise: 36, reach: 1.45, cone: 0.45, cost: 22 }, trw: 55, waga: 2, zrodla: ["warsztat"] }),
        B(116, "Żelazny kilof", "kilof", "zelazo", 1, { istnieje: true, staty: { dmg: 30, poise: 42, reach: 1.45, cone: 0.45, cost: 22 }, trw: 180, waga: 2, zrodla: ["kuźnia + warsztat"] }),
        B(154, "Oszczep", "wlocznia", "kamien", 1, { istnieje: true, staty: { dmg: 20, poise: 16, reach: 2.25, cone: 0.75, cost: 12, crit: 0 }, trw: 50, waga: 3, zrodla: ["warsztat"] }),
        B(126, "Łuk", "luk", "krotki", 1, { istnieje: true, staty: { damage: 30, range: 9, steady: 55, cooldown: 30, stamina: 3 }, trw: 80, waga: 2, zrodla: ["warsztat"] }),
        B(125, "Proca", "proca", "prosta", 1, { istnieje: true, staty: { damage: 14, range: 6, steady: 70, cooldown: 24, stamina: 2 }, trw: 60, waga: 1, zrodla: ["warsztat"] }),
        TA(155, "Drewniana tarcza", "tarcza_drewniana", "drewno", 1, 0.75, 0.7, { istnieje: true, trw: 40, waga: 3, zrodla: ["warsztat"] })
    ];

    // ------------------------------------------------------------------
    // UNIKATY: where each comes from (Bron.js gives it once): boss - its remains (Creatures' boss loot); flaga - a TownQuests flag
    // appears (one of the list); zadanie - a quest is done (the bus "townQuestDone"); przychylnosc - the garrison's favour reaches it.
    // tekst: the popup's words when it comes by itself; notatka: the journal's [title, text]
    // ------------------------------------------------------------------
    const UNIKATY = {
        396: { flaga: ["borgarWie"], tekst: "Borgar wyjmuje spod lady zawiniątko: miecz kasztelana Bogumiła",
            notatka: ["Miecz Bogumiła", "Borgar wyjął spod lady zawiniątko z natłuszczonego płótna. „Babka kazała trzymać. Na wypadek, gdyby ktoś zszedł na dół. Chyba to ty.” Miecz ostatniego kasztelana, Bogumiła z rodu Kowali - na głowni wyryte jedno słowo: „Nie pytam”."] },
        397: { flaga: ["grumAlly", "w8Duel"], tekst: "Rękawice Żelaznej Pięści",
            notatka: ["Rękawice Żelaznej Pięści", "Grum zostawił mi swoje rękawice - żelazne płytki na kostkach, wytarte od lat bicia. „Żelazna Pięść to nie ja. To one.”"] },
        398: { boss: "boss_20", notatka: ["Kostur przeora", "Przy pustej zbroi przeora leżał jego kostur - okuty, z krukiem na głowicy. Wciąż ciepły od rytuału jednego pytania."] },
        399: { boss: "boss_70", notatka: ["Długi miecz bez herbu", "Zbroja bez herbu upadła, a jej miecz został w mojej ręce. Ktoś wydrapał z niego herb - ostrze pamięta wojnę starszą niż zakon."] },
        400: { boss: "guardian", notatka: ["Hełm strażnika bramy", "Strażnik dziesiątej bramy złożył się po raz ostatni. Jego hełm został - w szczelinie przyłbicy jeszcze tli się żar."] },
        401: { zadanie: ["W13"], tekst: "Tarcza Skrzydlatej Straży",
            notatka: ["Tarcza Skrzydlatej Straży", "Na kamiennej grzędzie Orlej Grani, pod misą na deszczówkę, leżała tarcza jeźdźców orłów - białe skrzydło na szarym polu. Teraz jest moja."] },
        402: { przychylnosc: 80, tekst: "Rotmistrz Bełza przysyła ci szablę spod Brzozowej Woli",
            notatka: ["Szabla spod Brzozowej Woli", "Żołnierz z garnizonu przyniósł zawiniątko od rotmistrza Bełzy: szablę chorągwi brzozowskiej. „Zaginiony to nie poległy. Niech ją nosi ktoś stamtąd.”"] },
        403: { zadanie: ["D24"], tekst: "Dziadek Stach daje ci Krucze pióro",
            notatka: ["Krucze pióro", "Dziadek wyjął z kufra sztylet z rękojeścią jak pióro. „Kruczarze nosili listy, których nikt nie powinien czytać. I to - na tych, którzy chcieli je przeczytać.”"] },
        404: { boss: "boss_60", notatka: ["Oko Pierwszych", "Z czoła Kamiennego Odźwiernego wypadł kryształ - ten sam kamień co soczewka latarni. Patrzy się przez niego jak przez łzy."] },
        405: { boss: "boss_90", notatka: ["Kolczuga Ostatniej Straży", "Trzy cienie rozpadły się w pył. Została czarna, cicha kolczuga ostatniego strażnika."] },
        406: { zadanie: ["W12"], tekst: "Łuk Białej Źrenicy",
            notatka: ["Łuk Białej Źrenicy", "W kajucie kapitana „Białej Źrenicy”, za przegrodą, wisiał jego łuk - róg i ścięgna, białe oko na majdanie."] }
    };

    // ------------------------------------------------------------------
    // SKLEPY: the residents who trade in it (TownLife keys; the kantor: Baltazar "kupiec" or Ludmiła after W5). sprzedaje: the ids (shown
    // once the hero's level is at least poziom - pokaz); warunek: { przychylnosc: N } - an item there only from that garrison favour;
    // skupuje: the materials bought back (true: everything but the uniques) at `skup` of the price (worn things less); naprawia: the
    // materials mended for money (cena of the price for the whole wear; "kowal2" - the order's steel and the ore of the First: double);
    // godziny: when the shop is open; uzywane: the rag-and-bone man's used things (each day `ile`, `cena` of the price, `zuzycie` of the
    // wear on them). The garbarz, the szwaczka and the szmaciarz are the clothes' shops (Ubior_Sklepy.js): their menu gets one line more.
    // inne (2026-11-17): other goods on the same list - materials and clothes, not of PRZEDMIOTY: { id, cena, dziennie (how many a day; none:
    // no limit), przychylnosc (the garrison's favour it wants) }
    // ------------------------------------------------------------------
    const SKLEPY = {
        kowal: { kto: "Tadek Młot", tytul: "kowal", godziny: [6, 17], pokaz: 6, skup: 0.4, skupuje: ["braz", "zelazo", "stal", "okute", "pierwszych", "zakon"],
            naprawia: ["braz", "zelazo", "stal", "okute", "pierwszych", "zakon"],
            sprzedaje: [300, 301, 304, 305, 306, 313, 314, 315, 316, 317, 320, 321, 322, 327, 330, 331, 332, 344, 346, 351, 352, 354, 361, 362, 367, 368, 372, 375, 376, 377,
                421, 422, 429, 430, 439, 444, 447, 453, 455, 456, 457, 458, 459, 475, 477, 479],
            // (2026-11-17) the bronze ingots of his old store (two a day), the smith's apron and the bronze-shod belt (the clothes: Ubior_Data.js)
            inne: [{ id: 485, cena: 15, dziennie: 2 }, { id: 285, cena: 22 }, { id: 299, cena: 45 }],
            menu: "Pokaż broń i zbroje",
            teksty: {
                witaj: ["Miecz, topór, hełm? Wszystko kute tu, na tym kowadle. Brąz też mam - stary, ale dobry.", "Pokaż rękę. Hm. Do miecza jeszcze dorośniesz, do pałki już tak.",
                    "Coś się wyszczerbiło? Dawaj, naprostuję."],
                kupione: ["Noś zdrowo. I nie wal nim w kamienie.", "Dobra robota, choć to ja mówię."], sprzedane: ["Przekuję na coś porządnego."],
                naprawione: ["Jak nowy. Prawie."], zegnaj: ["Wracaj, jak się wyszczerbi!"], drogo: ["Takiej stali dziś nikt nie kuje. Spróbuję - ale policzę podwójnie."]
            } },
        kwatermistrz: { kto: "Kwatermistrz Kłos", tytul: "kwatermistrz garnizonu", godziny: [7, 20], pokaz: 6, skup: 0.45, przychylnosc: 15,
            skupuje: ["braz", "zelazo", "stal", "okute", "plotno", "sukno", "skora"], naprawia: [],
            sprzedaje: [307, 331, 335, 343, 345, 346, 349, 353, 355, 363, 377, 378, 385, 391, 422, 427, 432, 440, 449, 458, 460, 463, 471],
            warunek: { 343: { przychylnosc: 30 }, 355: { przychylnosc: 50 }, 391: { przychylnosc: 50 }, 432: { przychylnosc: 70 }, 463: { przychylnosc: 50 } },
            inne: [{ id: 294, cena: 80, przychylnosc: 30 }, { id: 297, cena: 30 }],
            menu: "Pokaż zbrojownię",
            teksty: {
                witaj: ["Zbrojownia królewska. Liczę, ważę, wydaję. Za grosz, rzecz jasna.", "Kolczuga, hełm, szabla - ze stanu. Nikt nie zauważy. Ehem.",
                    "Dla przyjaciół garnizonu - lepszy towar."],
                kupione: ["Wpisuję jako „zużyte w ćwiczeniach”."], sprzedane: ["Przyda się wojsku."], zegnaj: ["Do zobaczenia. Liczę na ciebie. Dosłownie."],
                przychylnosc: ["To tylko dla swoich. Pomóż garnizonowi, to pogadamy."]
            } },
        // (the user: once Kłos is gone - D27, handed over - a soldier of the garrison keeps his trade: the one by the barrels and the
        // granary (Garnizon_Data SOLDIERS, role "beczki", event 643 - his own look already), the same goods and the same favour)
        zastepca: { kto: "Kapral Jur", tytul: "zastępca kwatermistrza", wzor: "kwatermistrz", godziny: [7, 20], pokaz: 6, skup: 0.45, przychylnosc: 15,
            skupuje: ["braz", "zelazo", "stal", "okute", "plotno", "sukno", "skora"], naprawia: [], menu: "Pokaż zbrojownię",
            teksty: {
                witaj: ["(Młody żołnierz z księgą pod pachą.) Kłos popłynął, księga została mnie. Zbrojownia ta sama, ceny te same.",
                    "Kapral Jur, zastępca kwatermistrza. Liczę jak Kłos - tylko uczciwie.", "Rotmistrz kazał zapisywać każdy grosz. Co bierzesz?"],
                kupione: ["Zapisane. Z numerem i podpisem."], sprzedane: ["Wpisuję na przychód. Rotmistrz będzie zadowolony."], zegnaj: ["Za króla!"]
            } },
        kantor: { kto: "Baltazar Vey", tytul: "kupiec z kontynentu", godziny: [8, 18], pokaz: 8, skup: 0.45, skupuje: true, naprawia: [],
            sprzedaje: [302, 308, 309, 318, 323, 324, 328, 333, 336, 347, 355, 357, 358, 364, 369, 373, 379, 384, 386, 388, 393, 407, 408,
                423, 424, 425, 431, 432, 437, 441, 450, 451, 461, 462, 463, 464, 465, 466, 472, 480, 481],
            menu: "Broń z kontynentu",
            teksty: {
                witaj: ["Stal z kontynentu, mój drogi. Prawdziwa, nie to, co kują tu z rudy.", "Wojna to dobry czas dla kupców - i dla tych, co chcą przeżyć.",
                    "Wszystko na sprzedaż. Prawie wszystko."],
                kupione: ["Doskonały wybór. Nikomu nie mów, ile zapłaciłeś."], sprzedane: ["Hm. Wezmę. Na kontynencie ktoś za to zapłaci."], zegnaj: ["Zapraszam ponownie."]
            } },
        ludmila: { kto: "Ludmiła", tytul: "kantor (uczciwy)", godziny: [9, 15], pokaz: 8, skup: 0.45, skupuje: true, naprawia: [], wzor: "kantor",
            menu: "Broń z kontynentu",
            teksty: {
                witaj: ["Baltazar zostawił skrzynie ze stalą. Sprzedam po cenie - bez jego narzutu.", "To z kontynentu. Uczciwie liczone."],
                kupione: ["Niech ci służy."], sprzedane: ["Zapiszę w księdze. Wszystko jawnie."], zegnaj: ["Przyjdź jeszcze."]
            } },
        garbarz: { kto: "Ignac", tytul: "garbarz i szewc", ubior: true, pokaz: 8, skup: 0.4, skupuje: ["skora", "skorzana", "rzemienna"], naprawia: ["skora", "skorzana", "rzemienna"],
            sprzedaje: [340, 341, 350, 360, 366, 371, 338, 339, 420, 428, 436, 439, 443, 446, 478], menu: "Skórzane zbroje", teksty: { kupione: ["Twarda skóra. Ochroni."], sprzedane: ["Skóra zawsze się przyda."], naprawione: ["Nowe szwy."] } },
        szwaczka: { kto: "Dorota Igła", tytul: "szwaczka", ubior: true, pokaz: 8, skup: 0.4, skupuje: ["plotno", "sukno", "filc", "jedwab"], naprawia: ["plotno", "sukno", "filc", "jedwab"],
            sprzedaje: [342, 349, 419, 427, 435, 438, 442], inne: [{ id: 483, cena: 10 }, { id: 484, cena: 25 }], menu: "Przeszywanice", teksty: { kupione: ["Pikowane podwójnie. Ręczę."], sprzedane: ["Wypiorę i odsprzedam."], naprawione: ["Zszyte."] } },
        szmaciarz: { kto: "Józek Łata", tytul: "handlarz starzyzną", ubior: true, pokaz: 4, skup: 0.2, skupuje: true, naprawia: [],
            sprzedaje: [381, 382, 383, 392, 473, 474, 476], menu: "Stara broń i błyskotki",
            uzywane: { ile: 3, cena: 0.5, zuzycie: 0.5, z: [300, 313, 314, 330, 338, 340, 342, 349, 360, 366, 375, 419, 435, 438, 445, 452, 453, 454] },
            teksty: { kupione: ["Prawie nie używane! No, trochę używane."], sprzedane: ["Józek bierze wszystko. Tanio, ale bierze!"] } }
    };
    const SKLEP_TEKSTY = {
        zakladki: { kup: "Kupno", sprzedaj: "Sprzedaż", napraw: "Naprawa" },
        pusto: { kup: "Dziś nic tu dla ciebie nie ma.", sprzedaj: "Nie masz nic, co by tu kupili.", napraw: "Nie masz nic do naprawy." },
        menu: { sprzedaj: "Sprzedaj broń i zbroje", napraw: "Napraw broń i zbroje", rozmowa: "Porozmawiaj", nic: "Nic, dziękuję" },
        uzywane: "używane"
    };
    const NAPRAWA = { cena: 0.3, min: 2, drogo: 2 };

    // ------------------------------------------------------------------
    // PRZEPISY: what is made at the forge, the tannery, the workbench and (2026-11-17) the loom (Farming.js's manual recipes - Bron.js puts
    // them in; a recipe is on the list from the hero's level `poziom - widac`; the clothes of Ubior_Data.js have no level: at once).
    // [id, in, h, s, tool]: in: inputs [[item, n]]; h: hours; s: strength; tool: a tool the bag must hold (not used up) - the shears at the
    // loom, the master's hammer (W22) for the order's steel. The loom's list goes to both looms (with and without the spinning wheel)
    // ------------------------------------------------------------------
    const I = ITEM, N = I.nozyce, M = I.mlotek;
    const PRZEPISY = {
        widac: 4,
        forge: [
            [301, [[I.zelazo, 1], [I.wegiel, 1], [I.drewno, 1]], 1, 4], [305, [[I.zelazo, 3], [I.wegiel, 2], [I.skora, 1]], 2, 6],
            [317, [[I.zelazo, 3], [I.wegiel, 2], [I.drewno, 1]], 2, 6], [321, [[I.zelazo, 3], [I.wegiel, 2], [I.deski, 1]], 2, 6],
            [327, [[I.zelazo, 5], [I.wegiel, 3], [I.deski, 1]], 3, 8], [331, [[I.zelazo, 2], [I.wegiel, 1], [I.drewno, 2]], 2, 5],
            [345, [[I.zelazo, 3], [I.wegiel, 2], [I.skora, 1]], 2, 6], [346, [[I.zelazo, 3], [I.wegiel, 2]], 2, 6],
            [353, [[I.zelazo, 6], [I.wegiel, 4], [I.skora, 1]], 4, 10], [362, [[I.zelazo, 2], [I.wegiel, 1], [I.skora, 1]], 1, 4],
            [368, [[I.zelazo, 2], [I.wegiel, 1], [I.skora, 1]], 1, 4], [372, [[I.zelazo, 1], [I.wegiel, 1], [I.skora, 2]], 1, 4],
            [375, [[I.tarcza, 1], [I.zelazo, 2], [I.gwozdzie, 4]], 1, 4], [378, [[I.zelazo, 3], [I.wegiel, 2], [I.deski, 2], [I.skora, 1]], 2, 6],
            [302, [[I.stal, 1], [I.wegiel, 1], [I.drewno, 1]], 1, 5], [308, [[I.stal, 3], [I.wegiel, 2], [I.skora, 1]], 3, 7],
            [323, [[I.stal, 3], [I.wegiel, 2], [I.deski, 1]], 3, 7], [328, [[I.stal, 4], [I.zelazo, 2], [I.wegiel, 3], [I.deski, 1]], 3, 9],
            [347, [[I.stal, 3], [I.wegiel, 2]], 2, 7], [357, [[I.stal, 6], [I.wegiel, 4], [I.skora, 1]], 4, 11],
            [358, [[I.stal, 6], [I.zelazo, 2], [I.wegiel, 4], [I.skora, 2]], 4, 12], [364, [[I.stal, 2], [I.wegiel, 1], [I.skora, 1]], 2, 5],
            [369, [[I.stal, 2], [I.wegiel, 1], [I.skora, 1]], 2, 5], [379, [[I.zelazo, 4], [I.stal, 2], [I.wegiel, 3], [I.skora, 1]], 3, 9],
            [407, [[I.stal, 3], [I.wegiel, 1], [I.deski, 1]], 2, 6], [408, [[I.stal, 3], [I.wegiel, 1], [I.deski, 1]], 2, 6],
            // (2026-11-17, NOWE_80.md) the new things: bronze (ingots from the old coins), iron, steel, the order's steel (only with the master's hammer)
            [421, [[I.braz, 3], [I.wegiel, 2]], 2, 6], [422, [[I.zelazo, 2], [I.wegiel, 1], [I.skora, 1]], 2, 5],
            [423, [[I.stal, 3], [I.wegiel, 2], [I.skora, 1]], 2, 7], [424, [[I.stal, 2], [I.wegiel, 1], [I.skora, 1]], 2, 6],
            [425, [[I.stal, 4], [I.zelazo, 1], [I.wegiel, 3], [I.skora, 1]], 3, 9], [426, [[I.stalZakonna, 2], [I.stal, 1], [I.wegiel, 2], [I.skora, 1]], 3, 8, M],
            [429, [[I.braz, 5], [I.wegiel, 3], [I.skora, 2]], 4, 10], [430, [[I.zelazo, 6], [I.wegiel, 4], [I.skora, 2]], 4, 12],
            [431, [[I.stal, 6], [I.zelazo, 2], [I.wegiel, 4], [I.skora, 2]], 5, 12], [432, [[I.stal, 5], [I.wegiel, 3], [I.sukno, 2], [I.gwozdzie, 10]], 4, 11],
            [433, [[I.stalZakonna, 6], [I.wegiel, 4], [I.skora, 1]], 5, 12, M], [434, [[I.stalZakonna, 7], [I.stal, 1], [I.wegiel, 4], [I.skora, 2]], 5, 13, M],
            [437, [[I.stal, 2], [I.wegiel, 1], [I.skora, 1]], 2, 5], [440, [[I.zelazo, 3], [I.wegiel, 2], [I.skora, 1]], 2, 6],
            [441, [[I.stal, 3], [I.wegiel, 2], [I.skora, 1]], 2, 6], [444, [[I.braz, 1], [I.wegiel, 1], [I.skora, 2]], 1, 4],
            [447, [[I.braz, 1], [I.wegiel, 1], [I.skora, 1]], 1, 4], [449, [[I.zelazo, 3], [I.wegiel, 2], [I.deski, 4], [I.skora, 1]], 3, 8],
            [450, [[I.stal, 2], [I.wegiel, 1], [I.skora, 1]], 2, 5], [451, [[I.stal, 3], [I.zelazo, 1], [I.wegiel, 2], [I.deski, 2], [I.skora, 1]], 3, 8],
            [455, [[I.braz, 3], [I.wegiel, 2], [I.drewno, 1]], 2, 6], [456, [[I.braz, 4], [I.wegiel, 2], [I.deski, 1]], 3, 8],
            [457, [[I.zelazo, 2], [I.wegiel, 1], [I.drewno, 1]], 1, 4], [458, [[I.zelazo, 1], [I.wegiel, 1], [I.drewno, 2]], 1, 4],
            [459, [[I.zelazo, 4], [I.wegiel, 2], [I.skora, 1]], 3, 8], [460, [[I.zelazo, 4], [I.wegiel, 2], [I.deski, 2]], 3, 8],
            [461, [[I.stal, 1], [I.wegiel, 1], [I.drewno, 2]], 2, 5], [462, [[I.stal, 3], [I.wegiel, 2], [I.drewno, 1]], 3, 7],
            [463, [[I.stal, 3], [I.wegiel, 2], [I.skora, 1]], 3, 7], [464, [[I.stal, 4], [I.wegiel, 2], [I.drewno, 1]], 3, 8],
            [465, [[I.stal, 3], [I.wegiel, 2], [I.deski, 1]], 3, 7], [466, [[I.stal, 3], [I.wegiel, 1], [I.drewno, 2]], 2, 6],
            [467, [[I.stalZakonna, 3], [I.wegiel, 2], [I.drewno, 1]], 4, 8, M], [468, [[I.stalZakonna, 3], [I.wegiel, 2], [I.deski, 1]], 4, 8, M],
            [469, [[I.stalZakonna, 4], [I.wegiel, 2], [I.skora, 1]], 5, 9, M], [470, [[I.stalZakonna, 4], [I.stal, 1], [I.wegiel, 2], [I.deski, 2]], 5, 10, M],
            [475, [[I.zelazo, 1], [I.wegiel, 1], [I.skora, 1]], 1, 3], [477, [[I.braz, 1], [I.wegiel, 1]], 1, 2],
            [479, [[I.zelazo, 2], [I.wegiel, 1]], 2, 4], [480, [[I.stal, 1], [I.wegiel, 1], [I.poroze, 1]], 2, 4],
            [481, [[I.stal, 2], [I.ruda, 1], [I.wegiel, 1]], 2, 5], [482, [[I.stalZakonna, 1], [I.stal, 1], [I.wegiel, 1]], 3, 6, M],
            // (the old things that had no recipe - NOWE_80.md "Istniejące przedmioty bez przepisu")
            [300, [[I.braz, 1], [I.wegiel, 1], [I.drewno, 1]], 1, 4], [303, [[I.stalZakonna, 1], [I.stal, 1], [I.wegiel, 1], [I.drewno, 1]], 2, 6, M],
            [304, [[I.braz, 3], [I.wegiel, 2], [I.skora, 1]], 2, 6], [306, [[I.zelazo, 3], [I.wegiel, 2], [I.drewno, 1]], 2, 6],
            [307, [[I.zelazo, 3], [I.wegiel, 2], [I.skora, 1]], 3, 7], [309, [[I.stal, 4], [I.wegiel, 2], [I.skora, 1]], 3, 8],
            [310, [[I.okruch, 3], [I.wegiel, 2], [I.skora, 1]], 4, 8, M], [311, [[I.stalZakonna, 3], [I.wegiel, 2], [I.skora, 1]], 4, 8, M],
            [314, [[I.braz, 2], [I.wegiel, 1], [I.drewno, 1]], 1, 4], [315, [[I.zelazo, 4], [I.wegiel, 2], [I.drewno, 1]], 2, 6],
            [316, [[I.braz, 3], [I.wegiel, 2], [I.drewno, 1]], 2, 6], [318, [[I.stal, 3], [I.wegiel, 2], [I.drewno, 1]], 3, 7],
            [319, [[I.stalZakonna, 3], [I.wegiel, 2], [I.drewno, 1]], 4, 8, M], [320, [[I.braz, 3], [I.wegiel, 2], [I.deski, 1]], 2, 6],
            [322, [[I.zelazo, 3], [I.wegiel, 2], [I.deski, 1]], 2, 6], [324, [[I.stal, 4], [I.wegiel, 2], [I.deski, 2]], 3, 8],
            [325, [[I.stalZakonna, 3], [I.wegiel, 2], [I.deski, 1]], 4, 8, M], [329, [[I.stalZakonna, 4], [I.stal, 2], [I.wegiel, 3], [I.deski, 1]], 4, 10, M],
            [330, [[I.braz, 2], [I.wegiel, 1], [I.drewno, 2]], 2, 5], [332, [[I.zelazo, 3], [I.wegiel, 1], [I.drewno, 2]], 2, 5],
            [333, [[I.stal, 2], [I.wegiel, 1], [I.drewno, 2]], 2, 5], [334, [[I.stalZakonna, 2], [I.wegiel, 1], [I.drewno, 2]], 3, 6, M],
            [344, [[I.braz, 2], [I.wegiel, 1], [I.skora, 1]], 2, 5], [348, [[I.stalZakonna, 3], [I.wegiel, 2]], 3, 8, M],
            [352, [[I.braz, 4], [I.wegiel, 3], [I.skora, 2]], 4, 10], [354, [[I.zelazo, 6], [I.wegiel, 4], [I.skora, 2]], 4, 11],
            [355, [[I.zelazo, 4], [I.wegiel, 2], [I.sukno, 2], [I.gwozdzie, 10]], 4, 10], [359, [[I.stalZakonna, 6], [I.stal, 2], [I.wegiel, 4], [I.skora, 2]], 5, 13, M],
            [361, [[I.braz, 1], [I.wegiel, 1], [I.skora, 1]], 1, 4], [363, [[I.zelazo, 2], [I.wegiel, 1], [I.skora, 1]], 2, 5],
            [365, [[I.stalZakonna, 1], [I.stal, 1], [I.wegiel, 1], [I.skora, 1]], 2, 6, M], [367, [[I.braz, 2], [I.wegiel, 1], [I.skora, 1]], 1, 4],
            [370, [[I.stalZakonna, 2], [I.wegiel, 1], [I.skora, 1]], 2, 6, M], [373, [[I.stal, 1], [I.wegiel, 1], [I.skora, 2]], 2, 5],
            [374, [[I.stalZakonna, 1], [I.wegiel, 1], [I.skora, 2]], 2, 5, M], [376, [[I.tarcza, 1], [I.braz, 1], [I.gwozdzie, 2]], 1, 4],
            [377, [[I.zelazo, 2], [I.wegiel, 1], [I.skora, 1]], 2, 5], [380, [[I.stalZakonna, 3], [I.stal, 1], [I.wegiel, 2], [I.deski, 2], [I.skora, 1]], 4, 9, M],
            [383, [[I.moneta, 2], [I.wegiel, 1]], 1, 2], [384, [[I.zelazo, 1], [I.ruda, 2], [I.wegiel, 1]], 2, 4],
            [388, [[I.stal, 1], [I.kamienSzlachetny, 1], [I.wegiel, 1]], 2, 4], [389, [[I.braz, 1], [I.wegiel, 1], [I.lina, 1]], 2, 3],
            [391, [[I.zelazo, 2], [I.stal, 1], [I.wegiel, 1]], 2, 4], [393, [[I.zelazo, 1], [I.kamienSzlachetny, 1], [I.wegiel, 1]], 2, 4]
        ],
        tannery: [
            [340, [[I.skora, 1], [I.sciegna, 1]], 1, 3], [341, [[I.skoraNiedzwiedzia, 1], [I.sciegna, 1]], 2, 3], [350, [[I.skora, 4], [I.sciegna, 2], [I.lina, 1]], 3, 5],
            [351, [[I.skora, 4], [I.sciegna, 2], [I.gwozdzie, 8]], 3, 6], [360, [[I.skora, 1], [I.sciegna, 1]], 1, 2], [366, [[I.skora, 2], [I.sciegna, 1]], 1, 3],
            [371, [[I.skora, 2], [I.sciegna, 1], [I.lina, 1]], 2, 4],
            // (2026-11-17) the new things - the leather armour, the shield, the trinket, the clothes (284 285 295 297-299: Ubior_Data.js)
            [420, [[I.skora, 2], [I.wosk, 1], [I.sciegna, 1]], 2, 4], [428, [[I.skoraNiedzwiedzia, 1], [I.skora, 3], [I.sciegna, 2]], 3, 6],
            [436, [[I.skora, 2], [I.sciegna, 1], [I.gwozdzie, 4]], 1, 3], [439, [[I.skora, 2], [I.sciegna, 1], [I.gwozdzie, 6]], 2, 4],
            [443, [[I.skora, 2], [I.sciegna, 1], [I.welna, 1]], 2, 4], [446, [[I.tarcza, 1], [I.skora, 2], [I.sciegna, 1]], 2, 3],
            [478, [[I.skora, 1], [I.sciegna, 1], [I.piora, 2]], 1, 2],
            [284, [[I.skora, 2], [I.welna, 3], [I.sciegna, 1]], 3, 4], [285, [[I.skora, 2], [I.lina, 1]], 1, 2],
            [295, [[I.skoraNiedzwiedzia, 1], [I.skora, 2], [I.sciegna, 2]], 3, 5], [297, [[I.skora, 2], [I.sciegna, 1], [I.gwozdzie, 2]], 2, 3],
            [298, [[I.skora, 3], [I.gwozdzie, 2], [I.lina, 1]], 2, 3], [299, [[I.skora, 1], [I.braz, 1], [I.gwozdzie, 2]], 2, 3],
            // (the old ones without a recipe: the sling, the leather clothes - charcoal blackens the leather, beeswax lightens it)
            [339, [[I.skora, 2], [I.sciegna, 2]], 1, 2], [258, [[I.skora, 1]], 1, 1], [259, [[I.skora, 1], [I.wegiel, 1]], 1, 1],
            [266, [[I.skora, 3], [I.sciegna, 2], [I.lina, 1], [I.pokrzywa, 2]], 3, 5], [273, [[I.skora, 2], [I.sciegna, 1], [I.wegiel, 1]], 2, 3],
            [274, [[I.skora, 2], [I.sciegna, 1]], 2, 3], [276, [[I.skora, 2], [I.lina, 1], [I.wegiel, 1]], 2, 4], [277, [[I.skora, 1], [I.gwozdzie, 2]], 1, 1],
            [278, [[I.skora, 1], [I.gwozdzie, 2], [I.wegiel, 1]], 1, 1], [279, [[I.skora, 2], [I.sciegna, 1], [I.gwozdzie, 2]], 2, 2],
            [280, [[I.skora, 1], [I.sciegna, 1]], 1, 2], [281, [[I.skora, 1], [I.sciegna, 1], [I.wosk, 1]], 1, 2], [283, [[I.skora, 3], [I.sciegna, 1], [I.lina, 1]], 2, 3]
        ],
        workbench: [
            [312, [[I.drewno, 2]], 1, 2], [326, [[I.kamien, 3], [I.drewno, 1], [I.lina, 1]], 1, 3], [313, [[I.palka, 1], [I.gwozdzie, 4]], 1, 2],
            [338, [[I.skora, 1], [I.lina, 2]], 1, 2], [387, [[I.pazur, 1], [I.lina, 1]], 1, 1], [395, [[I.kiel, 1], [I.lina, 1]], 1, 1],
            // (2026-11-17) the new things - the wicker and crab shields, the flint dagger, the shod staff, the flail, the bows, the trinkets, the clogs, the basket
            [445, [[I.galezie, 8], [I.lina, 2]], 1, 3], [448, [[I.pancerzKraba, 3], [I.deski, 1], [I.lina, 2]], 2, 4],
            [452, [[I.kamien, 2], [I.drewno, 1], [I.lina, 1]], 1, 2], [453, [[I.kostur, 1], [I.gwozdzie, 6]], 1, 2],
            [454, [[I.drewno, 2], [I.skora, 1], [I.gwozdzie, 6]], 1, 3], [471, [[I.drewno, 2], [I.sciegna, 3], [I.lina, 1], [I.skora, 1]], 2, 4],
            [472, [[I.drewno, 3], [I.poroze, 3], [I.sciegna, 5], [I.smola, 1], [I.lina, 1]], 4, 7],
            [473, [[I.piora, 6], [I.lina, 1]], 1, 1], [476, [[I.poroze, 1], [I.lina, 1]], 1, 2],
            [291, [[I.deski, 1], [I.skora, 1]], 1, 2], [292, [[I.galezie, 10], [I.lina, 2]], 2, 3],
            // (the old ones: the bows, the trinkets of the new materials (wolf's fang, amber), the horn ring, the raven stone, the beads, the shell,
            // the coin; the bast shoes 275 have theirs already - Ubior_Sklepy.js "ubior_lapcie")
            [335, [[I.drewno, 3], [I.sciegna, 3], [I.lina, 1], [I.skora, 1]], 2, 5], [336, [[I.drewno, 2], [I.poroze, 2], [I.sciegna, 4], [I.lina, 1]], 3, 6],
            [337, [[I.drewno, 3], [I.stalZakonna, 1], [I.sciegna, 4], [I.poroze, 1]], 4, 7, M],
            [381, [[I.kielWilka, 1], [I.lina, 1]], 1, 1], [382, [[I.bursztyn, 1], [I.lina, 1]], 1, 1], [385, [[I.poroze, 1]], 1, 1],
            [386, [[I.kamien, 1], [I.piora, 2], [I.lina, 1]], 1, 1], [390, [[I.talizman, 1], [I.kamien, 6], [I.lina, 1]], 4, 3],
            [392, [[I.surowyKrab, 1], [I.lina, 1]], 1, 1], [394, [[I.moneta, 3], [I.skora, 1]], 1, 1]
        ],
        // (2026-11-17) the loom (Farming_Data.js BUILDINGS.loom): weaving linen and broadcloth is the building's own work; here what is sewn by hand
        loom: [
            [419, [[I.sukno, 2], [I.lina, 1]], 2, 3, N], [427, [[I.sukno, 3], [I.plotno, 2], [I.lina, 1]], 4, 5, N],
            [435, [[I.plotno, 1], [I.welna, 1]], 1, 2, N], [438, [[I.plotno, 2], [I.welna, 1]], 2, 3, N], [442, [[I.welna, 3], [I.skora, 1]], 2, 3],
            [474, [[I.plotno, 1], [I.krwawnik, 2], [I.ziola, 2]], 1, 1],
            [286, [[I.sukno, 4], [I.plotno, 1], [I.dziurawiec, 1]], 4, 4, N], [287, [[I.plotno, 2]], 2, 2, N], [288, [[I.plotno, 2], [I.skora, 1]], 2, 2, N],
            [289, [[I.welna, 2]], 1, 1], [290, [[I.welna, 3]], 2, 2], [293, [[I.plotno, 3], [I.lina, 1]], 2, 2, N],
            [294, [[I.sukno, 3], [I.skora, 1], [I.pokrzywa, 2]], 3, 4, N], [296, [[I.sukno, 4], [I.talizman, 1]], 4, 4, N],
            // (the old ones: the quilted armour, the scout's hood, the silk gambeson of the spider thread, the hats, the kerchiefs, the shirts,
            // the kaftans, the trousers, the linen bag - the dyes: yarrow yellow, berries blue and navy, St John's wort red, nettle green, cones brown)
            [342, [[I.plotno, 1], [I.wlokno, 2]], 1, 2, N], [343, [[I.sukno, 2], [I.pokrzywa, 2]], 2, 3, N], [349, [[I.plotno, 3], [I.welna, 1], [I.lina, 1]], 3, 4, N],
            [356, [[I.nicPajecza, 6], [I.plotno, 1]], 5, 5, N],
            [250, [[I.jeczmien, 4], [I.wlokno, 1]], 1, 1], [251, [[I.jeczmien, 4], [I.wlokno, 1], [I.wegiel, 1]], 1, 1],
            [252, [[I.plotno, 1]], 1, 1, N], [253, [[I.plotno, 1], [I.dziurawiec, 1]], 1, 1, N], [254, [[I.plotno, 1], [I.jagody, 3]], 1, 1, N],
            [255, [[I.welna, 2], [I.szyszki, 2]], 1, 1], [256, [[I.welna, 2]], 1, 1], [257, [[I.welna, 2], [I.pokrzywa, 2]], 1, 1],
            [260, [[I.plotno, 2]], 2, 2, N], [261, [[I.plotno, 2], [I.krwawnik, 2]], 2, 2, N], [262, [[I.plotno, 2], [I.jagody, 3]], 2, 2, N],
            [263, [[I.sukno, 2], [I.dziurawiec, 1]], 3, 3, N], [264, [[I.sukno, 2], [I.szyszki, 2]], 3, 3, N], [265, [[I.sukno, 2], [I.jagody, 4]], 3, 3, N],
            [267, [[I.plotno, 3], [I.dziurawiec, 2]], 4, 3, N], [268, [[I.plotno, 2]], 2, 2, N], [269, [[I.plotno, 2], [I.jagody, 3]], 2, 2, N],
            [270, [[I.plotno, 2], [I.szyszki, 2]], 2, 2, N], [271, [[I.sukno, 2], [I.szyszki, 2]], 3, 3, N], [272, [[I.sukno, 2], [I.pokrzywa, 2]], 3, 3, N],
            [282, [[I.plotno, 3], [I.lina, 1]], 2, 2, N]
        ]
    };
    const PRZEPIS_SLOWO = { forge: "Wykuj", tannery: "Uszyj", workbench: "Zrób", loom: "Uszyj" };
    // the stations with another's list (the loom with the spinning wheel: Farming_Data.js BUILDINGS.loom_wheel)
    const PRZEPISY_KOPIE = { loom_wheel: "loom" };

    // ------------------------------------------------------------------
    // SUROWCE (2026-11-17, NOWE_80.md "Nowe surowce"): the new materials 483-491 - their items (tools/ekwipunek_nowy/zrob_staging.js);
    // cena: in the shops (wartosc: not sold - a merchant's worth); jak: the thing whose icon they carry until their own is drawn
    // ------------------------------------------------------------------
    const SUROWCE = [
        { id: 483, nazwa: "Płótno", cena: 10, waga: 1, jak: 92, opis: "Gęsto tkane płótno z lnu, prosto z krosna. Na koszule, spodnie, chusty i pikowane zbroje." },
        { id: 484, nazwa: "Sukno", cena: 25, waga: 1, jak: 111, opis: "Gruba, ubita tkanina z wełny. Na kaftany, kaptury, żupany, płaszcze i brygantyny." },
        { id: 485, nazwa: "Sztabka brązu", cena: 15, waga: 1, jak: 86, opis: "Stary brąz przetopiony w sztabkę - z zaśniedziałych monet albo ze starego zapasu. W kuźni kuje się z niego brązowe hełmy, napierśniki, tasaki i puklerze." },
        { id: 486, nazwa: "Sztabka stali zakonnej", wartosc: 60, waga: 1, jak: 143, opis: "Czarna sztabka stali, jaką kuli bracia warty. Wykuje z niej coś tylko ten, kto ma Młotek majstra." },
        { id: 487, nazwa: "Kieł wilka", cena: 8, waga: 0, jak: 202, opis: "Długi, zakrzywiony kieł wilka. Na rzemieniu będzie z niego amulet." },
        { id: 488, nazwa: "Bursztyn", cena: 15, waga: 0, jak: 382, opis: "Bryłka bursztynu, którą morze wyrzuciło na plażę po burzy. Ciepła w dłoni." },
        { id: 489, nazwa: "Szlachetny kamień", cena: 40, waga: 0, jak: 388, opis: "Przejrzysty kamień z głębi skał - akwamaryn albo krwawnik. Kowal oprawi go w pierścień." },
        { id: 490, nazwa: "Nić pajęcza", wartosc: 12, waga: 0, jak: 92, opis: "Gruba, lśniąca nić olbrzymiej pajęczycy. Mocniejsza od lnu, lżejsza od wełny." },
        { id: 491, nazwa: "Okruch kruszcu Pierwszych", wartosc: 50, waga: 1, jak: 85, opis: "Czarny okruch kruszcu, którego nie zna żaden kowal. Starszy niż zakon." }
    ];

    // ------------------------------------------------------------------
    // LUP: the loot. ludzie: Humans_Data's kinds ([id, chance]), oboz: the camp's sack; stwory: Creatures_Data's kinds; bossowie: the bosses'
    // remains (always); podziemia: an extra roll of every searched container in the underground (szansa by kind x (1 + luck)), the item
    // picked by the floor's band (w: weight). surowce (2026-11-17): the new materials and the things of Ubior_Data.js - see below
    // ------------------------------------------------------------------
    const LUP = {
        ludzie: {
            bandit: [[340, 0.04], [313, 0.04], [300, 0.03], [383, 0.03], [420, 0.03], [436, 0.03], [457, 0.03]],
            knifer: [[300, 0.07], [301, 0.03], [360, 0.04]],
            archer: [[360, 0.06], [338, 0.05], [335, 0.03], [385, 0.02], [471, 0.03], [478, 0.03]],
            mercenary: [[345, 0.1], [346, 0.06], [353, 0.04], [305, 0.06], [307, 0.03], [378, 0.05], [391, 0.03], [422, 0.05], [440, 0.04], [459, 0.03], [479, 0.02]]
        },
        oboz: [[344, 0.06], [349, 0.05], [330, 0.04], [314, 0.03], [454, 0.04]],
        stwory: { zbroja: [[345, 0.05], [362, 0.04], [305, 0.03]], topielec: [[300, 0.04]], upior: [[389, 0.03]], cien: [[389, 0.03]] },
        bossowie: { guardian: [400], boss_20: [398], boss_30: [384], boss_40: [356], boss_50: [357], boss_60: [404], boss_70: [399], boss_80: [390], boss_90: [405] },
        podziemia: {
            szansa: { skrzynia: 0.14, relikwiarz: 0.3, kosci: 0.08, sakwa: 0.07, skrzynka: 0.04 },
            pasma: {
                1: [[300, 3], [304, 2], [314, 3], [316, 2], [320, 2], [330, 3], [340, 3], [342, 3], [344, 2], [349, 3], [360, 3], [361, 2], [366, 3], [367, 2], [376, 2], [352, 1], [394, 2],
                    [421, 2], [429, 1], [444, 2], [447, 2], [455, 2], [456, 2], [477, 2]],
                2: [[301, 3], [305, 2], [317, 2], [321, 2], [331, 3], [345, 3], [346, 2], [353, 1], [362, 3], [368, 2], [377, 2], [378, 1], [389, 2], [394, 2],
                    [422, 2], [457, 2], [458, 2]],
                3: [[306, 2], [315, 2], [322, 2], [327, 2], [332, 2], [354, 1], [363, 2], [356, 1], [389, 2], [393, 2], [430, 1], [440, 2], [459, 2], [460, 1]],
                4: [[308, 2], [310, 2], [318, 2], [323, 2], [328, 2], [347, 2], [357, 1], [364, 2], [369, 2], [373, 2], [379, 1], [388, 2],
                    [423, 2], [431, 1], [437, 2], [451, 1], [462, 2], [464, 2], [465, 2], [481, 1]],
                5: [[303, 2], [311, 2], [319, 2], [325, 2], [329, 1], [334, 2], [337, 2], [348, 2], [359, 1], [365, 2], [370, 2], [374, 2], [380, 1], [390, 1],
                    [426, 2], [433, 1], [434, 1], [467, 2], [468, 2], [469, 1], [470, 1], [482, 1]]
            }
        },
        zbrojowniaLorda: [346, 449, 460],
        // (2026-11-17, NOWE_80.md "Nowe surowce", the user's answers 1-3) where the new materials come from (Bron.js gives them):
        //   stwory: [id, chance, n, from floor, to floor] into Creatures_Data's kinds (the floors: Creatures.js rollLoot);
        //   bossowie: [id, n] always in that boss's remains;
        //   podziemia: a roll of its own for every searched container on the floors od-do (szansa by the container's kind x (1 + luck));
        //   oprawianie: [id, chance, n] when a carcass of that kind is dressed with a knife;
        //   zyly: an ore vein mined out on the floors od-do (chance x (1 + luck)); plaza: the beach of that map after a storm, once
        //   within `dni` days of it: `ile` lumps
        surowce: {
            stwory: { pajak: [[ITEM.nicPajecza, 0.15, 1, 31, 50]], kamiennik: [[ITEM.kamienSzlachetny, 0.04, 1], [ITEM.okruch, 0.05, 1]] },
            bossowie: { boss_40: [[ITEM.nicPajecza, 6]], boss_70: [[ITEM.stalZakonna, 1]], boss_90: [[ITEM.stalZakonna, 3]] },
            podziemia: [
                { id: ITEM.braz, od: 1, do: 10, szansa: { kosci: 0.06, skrzynia: 0.15, skrzynka: 0.05 } },
                { id: ITEM.stalZakonna, od: 76, do: 99, szansa: { relikwiarz: 0.25, skrzynia: 0.10, kosci: 0.04 } },
                { id: 296, od: 51, do: 75, szansa: { relikwiarz: 0.04, skrzynia: 0.02 } }   // (Płaszcz zakonny - rarely)
            ],
            oprawianie: { wolf: [[ITEM.kielWilka, 0.5, 1]] },
            zyly: [{ id: ITEM.kamienSzlachetny, od: 31, do: 75, szansa: 0.02 }],
            plaza: { id: ITEM.bursztyn, mapa: 219, dni: 2, ile: [1, 2] }
        }
    };

    // ------------------------------------------------------------------
    // Lookups and words
    // ------------------------------------------------------------------
    const BY_ID = {};
    for (const p of PRZEDMIOTY) BY_ID[p.id] = p;
    const przedmiot = id => BY_ID[Number(id)] || null;
    const round5 = v => Math.max(5, Math.round(v / 5) * 5);
    const round10 = v => Math.max(10, Math.round(v / 10) * 10);
    const r2 = v => Math.round(v * 100) / 100;
    // a weapon's numbers: RODZAJE x MATERIALY, then the item's own (p may be { rodzaj, material } of a note only)
    function staty(p) {
        if (typeof p === "number") p = przedmiot(p);
        if (!p) return null;
        const R = RODZAJE[p.rodzaj];
        if (!R) return null;
        if (R.dystans) return Object.assign({ dystans: R.dystans, klasa: R.klasa }, p.staty || {});
        const M = MATERIALY[p.material] || { mn: 1 }, mn = M.mn || 1;
        const s = { dmg: Math.round(R.dmg * mn), poise: Math.round(R.poise * (0.5 + 0.5 * mn)), reach: R.reach, cone: R.cone,
            cost: Math.max(4, R.cost + (M.oddech || 0)), crit: r2((R.crit || 0) + (M.crit || 0)), zamach: R.zamach, klasa: R.klasa, se: R.se,
            sweep: !!R.sweep, pancerz: R.pancerz || 1, zwierz: R.zwierz || 1, ukrycie: R.ukrycie || 1 };
        return Object.assign(s, p.staty || {});
    }
    const trwalosc = p => (p.trw !== undefined ? p.trw : p.typ === "bron" && RODZAJE[p.rodzaj] && MATERIALY[p.material] && MATERIALY[p.material].trw
        ? round10(MATERIALY[p.material].trw * (RODZAJE[p.rodzaj].trw || 1)) : null);
    const cenaOf = p => (p.cena !== undefined ? p.cena : p.wartosc !== undefined ? null : p.typ === "bron" && RODZAJE[p.rodzaj] && MATERIALY[p.material] && RODZAJE[p.rodzaj].cena
        ? round5(MATERIALY[p.material].cena * RODZAJE[p.rodzaj].cena) : null);
    // what a merchant counts it as (the price or, for what is not sold, its worth)
    const wartoscOf = p => (cenaOf(p) || p.wartosc || 0);
    const wagaOf = p => (p.waga !== undefined ? p.waga : p.typ === "bron" && RODZAJE[p.rodzaj] ? RODZAJE[p.rodzaj].waga : 1);
    const wygladOf = p => (p.typ === "bron" ? p.wyglad || "bron_" + p.rodzaj + "_" + p.material : p.wzor || "");
    const jednostka = p => (p.typ === "bron" ? (RODZAJE[p.rodzaj] && RODZAJE[p.rodzaj].jed) || "blow" : p.typ === "dodatek" ? null : "block");
    // the note of an item in Items.json
    function notatka(p) {
        if (p.typ === "bron") return "<Bron:" + p.rodzaj + "," + p.material + (p.wyglad ? "," + p.wyglad : "") + ">";
        if (p.typ === "zbroja") return "<Zbroja:" + p.miejsce + "," + p.wzor + ">";
        if (p.typ === "tarcza") return "<Tarcza:" + p.wzor + ">";
        return "<Dodatek:" + p.rodzaj + ">";
    }
    // the level's lack: how much weaker a thing of `poziom` is for a hero of `level`
    const brak = (poziom, level) => Math.min(KARA.max, Math.max(0, KARA.naPoziom * ((poziom || 1) - (level || 1))));
    const num = v => String(Math.round(v * 100) / 100).replace(".", ",");
    // (2026-11-17, the user's) a blow's or a shot's damage is not fixed: the base x a random 1 - ROZRZUT .. 1 + ROZRZUT (Combat_Fight.js
    // strike, Hunting_Weapons.js shotHit); the cards say the range - "obrażenia 12-14"
    const ROZRZUT = 0.1;
    const zakres = v => { const lo = Math.max(1, Math.round(v * (1 - ROZRZUT))), hi = Math.max(lo, Math.round(v * (1 + ROZRZUT))); return lo === hi ? String(lo) : lo + "-" + hi; };
    // (2026-11-17) a weapon's traits (Bron_Cechy_Data.js: fixed by the weapon) and, in the game, the one of a weapon the hero forged well
    // (Bron_Cechy.js "udane kucie": the save's) - their words; none without those plugins
    const W0 = () => (typeof window !== "undefined" ? window : {});
    function cechyWords(p) {
        const CD = W0().Bron_Cechy_Data, out = CD && CD.slowa ? CD.slowa(CD.of(p.id), p.rodzaj) : [];
        const BC = W0().Bron_Cechy, u = BC && BC.udaneSlowo ? BC.udaneSlowo(p.id) : "";
        if (u) out.push("Udane kucie: " + u);
        return out;
    }
    function cechyRows(p) {
        const CD = W0().Bron_Cechy_Data, own = CD && CD.of ? CD.of(p.id) : null, out = [];
        if (own) for (const c of CD.ZNANE) if (own[c] !== undefined) out.push(CD.kv(c, own[c], p.rodzaj));
        const BC = W0().Bron_Cechy, u = BC && BC.udaneSlowo ? BC.udaneSlowo(p.id) : "";
        if (u) out.push(["Udane kucie", u]);
        return out;
    }
    // what a thing does, in words (the card in Ekwipunek, the shop's window); bezCech: a weapon's numbers only (the shop shows its traits
    // apart)
    function opis(id, bezCech) {
        const p = przedmiot(id);
        if (!p) return "";
        const out = [];
        if (p.typ === "bron") {
            const s = staty(p);
            if (s.dystans) out.push("strzał " + zakres(s.damage) + " · zasięg " + num(s.range) + " pól");
            else {
                out.push("obrażenia " + zakres(s.dmg) + " · zasięg " + num(s.reach) + " · oddech " + s.cost);
                if (s.crit) out.push("krytyk +" + pct(s.crit));
                if (s.pancerz > 1) out.push("na pancerz +" + pct(s.pancerz - 1));
                if (s.zwierz > 1) out.push("na zwierzęta +" + pct(s.zwierz - 1));
                if (s.ukrycie > 1) out.push("z ukrycia +" + pct(s.ukrycie - 1));
            }
            for (const k of Object.keys(p.reka || {})) if (BONUSY[k]) out.push("w ręku: " + BONUSY[k].opis(p.reka[k]));
            if (!bezCech) for (const w of cechyWords(p)) out.push(w);
        } else if (p.typ === "zbroja") {
            out.push("cios słabszy o " + pct(p.obrona));
            if (p.cieplo) out.push("ciepło +" + pct(p.cieplo));
            const k = p.kara || {};
            if (k.chod > 0) out.push("chód +" + pct(k.chod));
            if (k.oddech) out.push("oddech -" + pct(k.oddech));
            if (k.skradanie) out.push("głośniej o " + pct(k.skradanie));
            if (k.chod < 0) out.push("chód -" + pct(-k.chod));
            if (p.piesci) out.push("pięści +" + p.piesci.dmg + " obrażeń");
            for (const b of Object.keys(p.bonus || {})) if (BONUSY[b]) out.push(BONUSY[b].opis(p.bonus[b]));
        } else if (p.typ === "tarcza") {
            out.push("blok zatrzymuje " + pct(p.blok) + " ciosu");
            if (p.parowanie) out.push("parowanie +" + pct(p.parowanie));
            if (p.oslona) out.push("szersza osłona");
            if (p.kara && p.kara.oddech) out.push("oddech -" + pct(p.kara.oddech));
        } else for (const b of Object.keys(p.bonus || {})) if (BONUSY[b]) out.push(BONUSY[b].opis(p.bonus[b]));
        return out.join(" · ");
    }
    // the card's rows of numbers: [[label, value]]
    function wiersze(id) {
        const p = przedmiot(id);
        if (!p) return [];
        const out = [];
        if (p.typ === "bron") {
            const s = staty(p);
            if (s.dystans) out.push(["Strzał", zakres(s.damage)], ["Zasięg", num(s.range) + " pól"]);
            else out.push(["Obrażenia", zakres(s.dmg)], ["Zachwianie", String(s.poise)], ["Zasięg", num(s.reach)], ["Oddech", String(s.cost)]);
            if (s.crit) out.push(["Krytyk", "+" + pct(s.crit)]);
            for (const r of cechyRows(p)) out.push(r);
        } else if (p.typ === "zbroja") out.push(["Cios słabszy", pct(p.obrona)]);
        else if (p.typ === "tarcza") out.push(["Blok", pct(p.blok)]);
        for (const b of Object.keys(p.bonus || {})) if (BONUSY[b] && BONUSY[b].kv) out.push(BONUSY[b].kv(p.bonus[b]));
        out.push(["Poziom", String(p.poziom)]);
        return out;
    }
    // who sells it: "Tadek Młot (kowal), 110 G" - or where else it comes from
    function gdzie(id) {
        const p = przedmiot(id);
        if (!p) return "";
        const who = [];
        for (const k of Object.keys(SKLEPY)) {
            const s = SKLEPY[k], list = s.sprzedaje || (s.wzor ? SKLEPY[s.wzor].sprzedaje : []);
            if (s.wzor) continue;
            if (list.includes(p.id) || (s.uzywane && s.uzywane.z.includes(p.id))) who.push(s.kto + " (" + s.tytul + ")");
        }
        const c = cenaOf(p);
        if (who.length) return who.join(", ") + (c ? ", " + c + " G" : "");
        return (p.zrodla || []).slice(0, 2).join(", ");
    }
    // what a recipe makes: a thing of this file, or (2026-11-17) a piece of clothing of Ubior_Data.js (no level: its recipe is there at once),
    // or else the item itself
    function rzecz(id) {
        const p = przedmiot(id);
        if (p) return { nazwa: p.nazwa, opis: p.opis, poziom: p.poziom, slowa: opis(id) };
        const W = typeof window !== "undefined" ? window : {}, U = W.Ubior_Data, u = U && U.przedmiot ? U.przedmiot(id) : null;
        if (u) return { nazwa: u.nazwa, opis: u.opis, poziom: 0, slowa: U.opis ? U.opis(id) : "" };
        const it = W.$dataItems && W.$dataItems[id];
        return it && it.name ? { nazwa: it.name, opis: it.description || "", poziom: 0, slowa: "" } : null;
    }
    const SZYCIE = { tannery: true, loom: true };
    // the recipes as Farming.js wants them (Bron.js puts them in): { station: [recipe] } - every list of PRZEPISY, the copies (the loom with
    // the spinning wheel) too; tool: the item the bag must hold (Farming: "Potrzebujesz: ..."; not used up - no wear of its own)
    function przepisy() {
        const out = {};
        for (const st of Object.keys(PRZEPISY)) {
            if (!Array.isArray(PRZEPISY[st])) continue;
            out[st] = PRZEPISY[st].map(([id, inputs, hours, stamina, tool]) => {
                const p = rzecz(id);
                if (!p) return null;
                const slowa = p.slowa ? " " + p.slowa.replace(/^./, c => c.toUpperCase()) + "." : "";
                const r = { id: "bron_" + id, name: PRZEPIS_SLOWO[st] + ": " + p.nazwa.charAt(0).toLowerCase() + p.nazwa.slice(1), inputs: inputs.map(x => x.slice()),
                    output: [id, 1], manual: true, unique: true, hours, stamina, startSe: SZYCIE[st] ? "Item1" : "Hammer", poziom: p.poziom, bron: true,
                    desc: (p.opis || p.nazwa) + slowa };
                if (tool) r.tool = tool;
                return r;
            }).filter(Boolean);
        }
        for (const [kopia, st] of Object.entries(PRZEPISY_KOPIE)) if (out[st]) out[kopia] = out[st].map(r => Object.assign({}, r, { inputs: r.inputs.map(x => x.slice()), output: r.output.slice() }));
        return out;
    }
    const surowiec = id => SUROWCE.find(s => s.id === Number(id)) || null;

    const DANE = { VERSION: "1.2.0", ITEM, MATERIALY, RODZAJE, MIEJSCA, KARA, ZBROJA_MAX, BONUSY, PRZEDMIOTY, UNIKATY, SKLEPY, SKLEP_TEKSTY, NAPRAWA, PRZEPISY, PRZEPIS_SLOWO,
        PRZEPISY_KOPIE, SUROWCE, LUP, ROZRZUT, przedmiot, staty, trwalosc, cenaOf, wartoscOf, wagaOf, wygladOf, jednostka, notatka, brak, opis, wiersze, gdzie, przepisy, ikonaOf,
        surowiec, zakres };

    const T = window.Tawerna;
    if (!T || typeof T.register !== "function") { window.Bron_Data = DANE; return; }   // (Node: the tools read the data)
    window.Bron_Data = T.register("Bron_Data", DANE);
})();
