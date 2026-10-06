//=============================================================================
// Skills_Data.js
//=============================================================================

/*:
 * @target MZ
 * @plugindesc Dane drzewek umiejętności (10 dziedzin, ~90 umiejętności): nazwy, opisy, stopnie, wymagania i działanie. Musi być przed Combat.js. v1.0.0
 * @author Claude
 *
 * @help
 * Same dane - czyta je Combat.js (ekran Postaci, menu P → Postać → zakładki
 * drzewek; Q / E zmieniają dziedzinę).
 *
 * Każda umiejętność:
 *   row, col   - miejsce w drzewku (rząd 0 u góry, kolumny 0-4)
 *   from       - umiejętności, z których do niej prowadzi droga (wystarczy
 *                znać JEDNĄ z nich); pusta lista = korzeń drzewka
 *   ranks      - ile razy można w nią włożyć punkt (każdy stopień: 1 punkt)
 *   attr       - progi atrybutów (np. { str: 12 })
 *   fx         - działanie na stopień: klucz -> wartość (sumy stopni wszystkich
 *                znanych umiejętności czytają inne wtyczki: Combat.perk(klucz))
 *   text       - opis; {klucz} wstawia wartość fx razy stopień
 * Rząd wymaga poziomu postaci: ROW_LEVEL (0: 1, 1: 4, 2: 10, 3: 20, 4: 32, 5: 48).
 *
 * Klucze fx i formaty (FX): "%" procent, "n" liczba, "s" klatki jako sekundy.
 */

(() => {
    "use strict";

    const ROW_LEVEL = [1, 4, 10, 20, 32, 48];

    // how each effect key reads in the texts (the value per rank times the rank)
    const FX = {
        "melee.dmg": "%", "melee.crit": "%", "melee.poise": "%", "melee.breath": "%", "block.reduce": "%", "breath.regen": "%", "knock.resist": "%",
        "roll.iframes": "s", "hp.max": "n", "hurt": "%", "run.breath": "%",
        "stamina.cost": "%", "hunger": "%", "thirst": "%", "cold": "%", "sleep.rest": "%", "bandage.heal": "%", "wound.heal": "%", "carry": "n",
        "needs.penalty": "%", "food.value": "%", "food.buff": "%", "spoil": "%", "spoil.store": "%",
        "chop.hits": "%", "mine.hits": "%", "gather.cost": "%", "chop.yield": "%", "mine.yield": "%", "forage.yield": "%", "ore": "%",
        "crop.growth": "%", "crop.yield": "%", "crop.double": "%", "seed.chance": "%", "water.days": "n", "can.charges": "n", "farm.cost": "%",
        "produce.more": "%", "birds.raid": "%",
        "build.hits": "%", "build.cost": "%", "build.refund": "%", "build.spare": "%",
        "craft.speed": "%", "cook.speed": "%", "smelt.speed": "%", "craft.save": "%", "craft.double": "%", "cook.double": "%", "tool.wear": "%", "fire.fuel": "%", "sell": "%",
        "aim.speed": "%", "ranged.dmg": "%", "ranged.crit": "%", "ammo.save": "%", "shot.cooldown": "%", "sneak": "%", "hunt.dmg": "%",
        "carcass.meat": "%", "carcass.hide": "%", "carcass.sinew": "%", "snare.lure": "%", "fish": "%", "feathers": "n", "sneak.dmg": "%",
        "disarm": "%", "surrender": "%", "surrender.at": "%", "mind.resist": "%", "mind.short": "%", "mind.back": "s", "mind.see": "n"
    };

    const TREES = [
        { id: "melee", name: "Walka wręcz", desc: "Ciosy, kombo, ciężki cios i łamanie gardy wroga." },
        { id: "defense", name: "Obrona", desc: "Życie, blok, parowanie, przewrót i odporność na ciosy." },
        { id: "ranged", name: "Strzelectwo", desc: "Proca i łuk: celowanie, obrażenia, pociski; polowanie z dystansu." },
        { id: "survival", name: "Przetrwanie", desc: "Wytrzymałość, głód, pragnienie, zimno, sen, rany i udźwig." },
        { id: "gather", name: "Zbieractwo", desc: "Rąbanie drzew i krzaków, kucie skał, zbieranie z ziemi." },
        { id: "hunting", name: "Łowiectwo", desc: "Skradanie, oprawianie zwierzyny, sidła, ryby i ptaki." },
        { id: "farming", name: "Rolnictwo", desc: "Uprawy, podlewanie, nasiona, zwierzęta gospodarskie i ptaki na polu." },
        { id: "craft", name: "Rzemiosło", desc: "Warsztaty i piece: szybsza praca, oszczędność materiałów, narzędzia, handel." },
        { id: "build", name: "Budownictwo", desc: "Place budowy, młotek, rozbiórka i odzysk materiałów." },
        { id: "cooking", name: "Kuchnia", desc: "Jedzenie, psucie się zapasów, ogień i gotowanie." }
    ];

    const S = (id, tree, row, col, name, text, o) => Object.assign({ id, tree, row, col, name, text, ranks: 1, from: [], attr: {}, fx: {} }, o || {});

    const SKILLS = [
        // ---- Walka wręcz (the old stage-1 ids stay: combo4, charge, riposte, sweep, execute)
        S("m_power", "melee", 0, 2, "Mocna ręka", "Obrażenia wręcz +{melee.dmg}.", { ranks: 3, fx: { "melee.dmg": 0.05 } }),
        S("combo4", "melee", 1, 1, "Płynne kombo", "Czwarty cios w serii, najmocniejszy.", { from: ["m_power"] }),
        S("charge", "melee", 1, 3, "Rozpęd", "Ciężki cios ładuje się o 40% szybciej.", { from: ["m_power"], attr: { str: 12 } }),
        S("riposte", "melee", 2, 1, "Kontra", "Po udanym parowaniu następny cios w ciągu 2 sekund jest krytyczny.", { from: ["combo4"], attr: { per: 12 } }),
        S("m_breath", "melee", 2, 2, "Oszczędny cios", "Ciosy zużywają o {melee.breath} mniej oddechu.", { ranks: 2, from: ["combo4", "charge"], fx: { "melee.breath": 0.1 } }),
        S("m_poise", "melee", 2, 3, "Łamacz gardy", "Zbijanie równowagi wroga +{melee.poise}.", { ranks: 2, from: ["charge"], fx: { "melee.poise": 0.12 } }),
        // (stage 3, 2026-10-06 - the men of Humans.js): men give up sooner before him
        S("m_fear", "melee", 3, 2, "Postrach", "Ludzie poddają się chętniej: +{surrender} szans, że pobity błaga o litość, i już przy {surrender.at} więcej życia.",
            { ranks: 2, from: ["m_breath"], attr: { wil: 10 }, fx: { "surrender": 0.15, "surrender.at": 0.05 } }),
        S("m_crit", "melee", 3, 1, "Oko rzeźnika", "Szansa na trafienie krytyczne +{melee.crit}.", { ranks: 2, from: ["riposte"], fx: { "melee.crit": 0.03 } }),
        S("sweep", "melee", 3, 3, "Szeroki zamach", "Siekiera i kilof trafiają wszystkich wrogów w zasięgu zamachu, nie tylko najbliższego.", { from: ["m_poise"], attr: { str: 20 } }),
        S("execute", "melee", 4, 1, "Dobicie", "Cios w zataczającego się wroga zadaje 2,5 raza więcej obrażeń.", { from: ["m_crit"] }),
        S("m_power2", "melee", 4, 3, "Ciężka ręka", "Obrażenia wręcz +{melee.dmg}.", { ranks: 2, from: ["sweep", "m_breath"], attr: { str: 28 }, fx: { "melee.dmg": 0.06 } }),
        S("m_master", "melee", 5, 2, "Mistrz oręża", "Obrażenia wręcz +{melee.dmg} i szansa na krytyk +{melee.crit}.", { from: ["execute", "m_power2"], attr: { str: 35 }, fx: { "melee.dmg": 0.1, "melee.crit": 0.05 } }),

        // ---- Obrona (old ids: guard, keen, acrobat, thickskin, secondwind)
        S("d_body", "defense", 0, 2, "Hart ciała", "Życie +{hp.max}.", { ranks: 3, fx: { "hp.max": 12 } }),
        S("guard", "defense", 1, 1, "Twarda garda", "Blok zużywa o 40% mniej oddechu.", { from: ["d_body"] }),
        S("keen", "defense", 1, 3, "Czujne oko", "Okno parowania o połowę dłuższe.", { from: ["d_body"], attr: { per: 12 } }),
        S("d_block", "defense", 2, 0, "Mocny blok", "Blok zatrzymuje o {block.reduce} więcej obrażeń.", { ranks: 2, from: ["guard"], fx: { "block.reduce": 0.07 } }),
        S("d_breath", "defense", 2, 2, "Głęboki oddech", "Oddech wraca o {breath.regen} szybciej.", { ranks: 2, from: ["guard", "keen"], fx: { "breath.regen": 0.15 } }),
        // (stage 3, 2026-10-06): a parried man may lose his weapon
        S("d_disarm", "defense", 2, 3, "Rozbrojenie", "Udane parowanie ciosu człowieka: {disarm} szans, że wytrąci mu broń z ręki (bije wtedy słabiej, a broń leży na ziemi).",
            { ranks: 2, from: ["keen"], attr: { per: 14 }, fx: { "disarm": 0.3 } }),
        // (stage 4, 2026-10-06 - the creatures of the ruins, Creatures.js): Hart ducha against what hits the mind
        S("d_will", "defense", 1, 2, "Spokojna głowa", "Opór przed „prawdą” upiorów i strachem +{mind.resist}; strach i zamęt trwają o {mind.short} krócej.",
            { ranks: 3, from: ["d_body"], attr: { wil: 8 }, fx: { "mind.resist": 0.08, "mind.short": 0.1 } }),
        S("d_truth", "defense", 3, 3, "Prawda nie boli", "Odparta „prawda” odbija się mocniej: upiór zatacza się o {mind.back} dłużej, a ukryte upiory widać jako mgiełkę.",
            { from: ["d_will"], attr: { wil: 18 }, fx: { "mind.back": 45, "mind.see": 1 } }),
        S("acrobat", "defense", 2, 4, "Akrobata", "Drugi przewrót od razu po pierwszym, o 40% tańszy.", { from: ["keen"], attr: { dex: 14 } }),
        S("thickskin", "defense", 3, 1, "Gruba skóra", "Rany zdarzają się o połowę rzadziej.", { from: ["d_block", "d_breath"], attr: { con: 16 } }),
        S("d_knock", "defense", 3, 2, "Twarde nogi", "Trudniej cię przewrócić: +{knock.resist} odporności.", { ranks: 2, from: ["d_breath"], fx: { "knock.resist": 0.2 } }),
        S("d_roll", "defense", 3, 4, "Unik mistrza", "Nietykalność w przewrocie dłuższa o {roll.iframes}.", { ranks: 2, from: ["acrobat"], fx: { "roll.iframes": 3 } }),
        S("secondwind", "defense", 4, 1, "Drugi oddech", "Raz na walkę, gdy życie spadnie poniżej 30%, oddech wraca w całości.", { from: ["thickskin"] }),
        S("d_body2", "defense", 4, 3, "Żelazne zdrowie", "Życie +{hp.max}.", { ranks: 2, from: ["d_knock", "d_roll"], attr: { con: 25 }, fx: { "hp.max": 20 } }),
        S("d_stone", "defense", 5, 2, "Niezłomny", "Wszystkie przyjmowane obrażenia mniejsze o {hurt}.", { from: ["secondwind", "d_body2"], attr: { con: 35 }, fx: { "hurt": 0.12 } }),

        // ---- Strzelectwo
        S("r_aim", "ranged", 0, 2, "Pewna ręka", "Kółko celowania zamyka się o {aim.speed} szybciej.", { ranks: 3, fx: { "aim.speed": 0.08 } }),
        S("r_dmg", "ranged", 1, 1, "Mocny naciąg", "Obrażenia z łuku i procy +{ranged.dmg}.", { ranks: 3, from: ["r_aim"], fx: { "ranged.dmg": 0.08 } }),
        S("r_ammo", "ranged", 1, 3, "Zbieracz pocisków", "{ammo.save} szans, że kamień albo strzała nie przepadnie.", { ranks: 2, from: ["r_aim"], fx: { "ammo.save": 0.2 } }),
        S("r_hunt", "ranged", 2, 0, "Łowca", "Obrażenia zadawane zwierzętom (każdą bronią) +{hunt.dmg}.", { ranks: 2, from: ["r_dmg"], fx: { "hunt.dmg": 0.1 } }),
        S("r_crit", "ranged", 2, 1, "Słaby punkt", "{ranged.crit} szans na podwójne obrażenia strzałem.", { ranks: 2, from: ["r_dmg"], attr: { per: 14 }, fx: { "ranged.crit": 0.06 } }),
        S("r_fast", "ranged", 2, 3, "Szybki strzał", "Następny strzał gotowy o {shot.cooldown} szybciej.", { ranks: 2, from: ["r_ammo"], fx: { "shot.cooldown": 0.15 } }),
        S("r_silent", "ranged", 3, 2, "Cichy strzał", "Strzał płoszy zwierzęta i ptaki w o połowę mniejszym promieniu.", { from: ["r_crit", "r_fast"], attr: { dex: 18 } }),
        S("r_heart", "ranged", 4, 2, "Strzał w serce", "Trafienie zwierzęcia, które cię jeszcze nie zauważyło: potrójne obrażenia.", { from: ["r_silent"], attr: { dex: 26 } }),
        S("r_eagle", "ranged", 4, 4, "Sokole oko", "Celowanie o {aim.speed} szybsze i obrażenia strzałem +{ranged.dmg}.", { ranks: 2, from: ["r_fast"], attr: { per: 22 }, fx: { "aim.speed": 0.1, "ranged.dmg": 0.05 } }),
        S("r_master", "ranged", 5, 2, "Mistrz łuku", "Obrażenia strzałem +{ranged.dmg} i szansa na podwójne +{ranged.crit}.", { from: ["r_heart", "r_eagle"], attr: { dex: 35 }, fx: { "ranged.dmg": 0.15, "ranged.crit": 0.08 } }),

        // ---- Przetrwanie
        S("s_tough", "survival", 0, 2, "Wytrwały", "Każda praca kosztuje o {stamina.cost} mniej wytrzymałości.", { ranks: 3, fx: { "stamina.cost": 0.05 } }),
        S("s_food", "survival", 1, 1, "Mały żołądek", "Głód narasta o {hunger} wolniej.", { ranks: 3, from: ["s_tough"], fx: { "hunger": 0.08 } }),
        S("s_water", "survival", 1, 3, "Wielbłąd", "Pragnienie narasta o {thirst} wolniej.", { ranks: 3, from: ["s_tough"], fx: { "thirst": 0.08 } }),
        S("s_sleep", "survival", 2, 0, "Twardy sen", "Sen i odpoczynek dają o {sleep.rest} więcej sił.", { ranks: 2, from: ["s_food"], fx: { "sleep.rest": 0.15 } }),
        S("s_cold", "survival", 2, 2, "Zahartowany", "Zimno mniej przeszkadza: dopłata wytrzymałości za chłód o {cold} mniejsza.", { ranks: 2, from: ["s_food", "s_water"], fx: { "cold": 0.3 } }),
        S("s_run", "survival", 2, 4, "Długi bieg", "Bieg zużywa o {run.breath} mniej oddechu.", { ranks: 2, from: ["s_water"], fx: { "run.breath": 0.15 } }),
        S("s_band", "survival", 3, 1, "Opatrunki", "Opatrunek leczy o {bandage.heal} więcej.", { ranks: 2, from: ["s_sleep", "s_cold"], fx: { "bandage.heal": 0.25 } }),
        S("s_heal", "survival", 3, 3, "Szybkie gojenie", "Życie wraca o {wound.heal} szybciej.", { ranks: 2, from: ["s_cold", "s_run"], attr: { con: 15 }, fx: { "wound.heal": 0.3 } }),
        S("s_carry", "survival", 4, 1, "Juczny", "Udźwig +{carry}.", { ranks: 3, from: ["s_band"], attr: { str: 15 }, fx: { "carry": 4 } }),
        S("s_iron", "survival", 4, 3, "Żelazny organizm", "Głód i pragnienie mniej osłabiają: ich kary o {needs.penalty} mniejsze.", { ranks: 2, from: ["s_heal"], fx: { "needs.penalty": 0.25 } }),
        S("s_master", "survival", 5, 2, "Syn puszczy", "Praca o {stamina.cost} tańsza, głód i pragnienie o {hunger} wolniej.", { from: ["s_carry", "s_iron"], attr: { con: 30 }, fx: { "stamina.cost": 0.1, "hunger": 0.1, "thirst": 0.1 } }),

        // ---- Zbieractwo
        S("g_chop", "gather", 0, 1, "Drwal", "Drzewa, pnie, kłody i krzaki: o {chop.hits} mniej uderzeń.", { ranks: 3, fx: { "chop.hits": 0.1 } }),
        S("g_mine", "gather", 0, 3, "Kamieniarz", "Skały i żyły rudy: o {mine.hits} mniej uderzeń kilofem.", { ranks: 3, fx: { "mine.hits": 0.1 } }),
        S("g_wood", "gather", 1, 0, "Leśny urobek", "{chop.yield} szans na dodatkową sztukę z drzewa, kłody, pnia i krzaka.", { ranks: 2, from: ["g_chop"], fx: { "chop.yield": 0.2 } }),
        S("g_cost", "gather", 1, 2, "Oszczędny zamach", "Rąbanie, kopanie pni i kucie skał kosztuje o {gather.cost} mniej wytrzymałości.", { ranks: 2, from: ["g_chop", "g_mine"], fx: { "gather.cost": 0.12 } }),
        S("g_stone", "gather", 1, 4, "Dobra żyła", "{mine.yield} szans na dodatkową sztukę ze skały (kamień albo ruda).", { ranks: 2, from: ["g_mine"], fx: { "mine.yield": 0.2 } }),
        S("g_forage", "gather", 2, 1, "Zbieracz", "{forage.yield} szans na dodatkową sztukę przy zbieraniu z ziemi i z krzaków.", { ranks: 2, from: ["g_wood", "g_cost"], fx: { "forage.yield": 0.25 } }),
        S("g_ore", "gather", 2, 3, "Oko na kruszec", "{ore} szans, że zwykła skała da też rudę żelaza.", { ranks: 2, from: ["g_stone", "g_cost"], attr: { per: 12 }, fx: { "ore": 0.1 } }),
        S("g_chop2", "gather", 3, 0, "Mistrz topora", "Drzewa i krzaki: jeszcze o {chop.hits} mniej uderzeń.", { ranks: 2, from: ["g_wood"], attr: { str: 16 }, fx: { "chop.hits": 0.1 } }),
        S("g_quick", "gather", 3, 2, "Szybkie ręce", "Podnoszenie z ziemi (kamyki, gałęzie, zioła, grzyby) nie kosztuje wytrzymałości.", { from: ["g_forage", "g_ore"] }),
        S("g_mine2", "gather", 3, 4, "Mistrz kilofa", "Skały: jeszcze o {mine.hits} mniej uderzeń.", { ranks: 2, from: ["g_ore", "g_stone"], attr: { str: 16 }, fx: { "mine.hits": 0.1 } }),
        S("g_master", "gather", 4, 2, "Dziecko lasu", "+{chop.yield} szans na dodatkową sztukę z każdego drzewa, skały i zbioru z ziemi.", { from: ["g_quick", "g_chop2", "g_mine2"], attr: { per: 20 }, fx: { "chop.yield": 0.25, "mine.yield": 0.25, "forage.yield": 0.25 } }),

        // ---- Łowiectwo
        S("h_sneak", "hunting", 0, 2, "Ciche kroki", "Zwierzęta i ptaki zauważają cię o {sneak} wolniej.", { ranks: 3, fx: { "sneak": 0.1 } }),
        S("h_meat", "hunting", 1, 1, "Rzeźnik", "{carcass.meat} szans na dodatkowy kawał mięsa przy oprawianiu.", { ranks: 2, from: ["h_sneak"], fx: { "carcass.meat": 0.3 } }),
        S("h_hide", "hunting", 1, 3, "Skórnik", "{carcass.hide} szans na dodatkową skórę przy oprawianiu.", { ranks: 2, from: ["h_sneak"], fx: { "carcass.hide": 0.3 } }),
        S("h_fish", "hunting", 2, 0, "Wędkarz", "Ryby biorą częściej: +{fish} szans.", { ranks: 2, from: ["h_meat"], fx: { "fish": 0.1 } }),
        S("h_snare", "hunting", 2, 1, "Sidlarz", "Przynęta w sidłach wabi zające o {snare.lure} skuteczniej.", { ranks: 2, from: ["h_meat"], fx: { "snare.lure": 0.25 } }),
        S("h_sinew", "hunting", 2, 3, "Ścięgna", "{carcass.sinew} szans na dodatkowe ścięgna przy oprawianiu.", { from: ["h_hide"], fx: { "carcass.sinew": 0.5 } }),
        S("h_birds", "hunting", 2, 4, "Ptasznik", "Z każdego ptaka +{feathers} pióro więcej.", { ranks: 2, from: ["h_hide"], fx: { "feathers": 1 } }),
        // (stage 2 of the fight, 2026-10-05: the blow and the shot from hiding - Combat_Fight.js SNEAK)
        S("h_ambush", "hunting", 3, 1, "Zasadzka", "Atak z ukrycia (cios i strzał w zwierzę albo człowieka, który cię nie zauważył) zadaje o {sneak.dmg} więcej obrażeń.", { ranks: 2, from: ["h_snare"], attr: { per: 12 }, fx: { "sneak.dmg": 0.25 } }),
        S("h_track", "hunting", 3, 2, "Tropiciel", "Zwierzęta zauważają cię o {sneak} wolniej, obrażenia zadawane im +{hunt.dmg}.", { ranks: 2, from: ["h_snare", "h_sinew"], attr: { per: 15 }, fx: { "sneak": 0.1, "hunt.dmg": 0.05 } }),
        S("h_beast", "hunting", 4, 2, "Pogromca zwierząt", "Obrażenia zadawane zwierzętom +{hunt.dmg}.", { ranks: 2, from: ["h_track"], attr: { str: 18 }, fx: { "hunt.dmg": 0.1 } }),
        S("h_master", "hunting", 5, 2, "Król puszczy", "+{carcass.meat} szans na mięso i skórę, zwierzęta zauważają cię o {sneak} wolniej.", { from: ["h_beast"], attr: { per: 30 }, fx: { "carcass.meat": 0.5, "carcass.hide": 0.5, "sneak": 0.1 } }),

        // ---- Rolnictwo
        S("f_grow", "farming", 0, 2, "Zielona ręka", "Rośliny rosną o {crop.growth} szybciej.", { ranks: 3, fx: { "crop.growth": 0.08 } }),
        S("f_yield", "farming", 1, 1, "Obfite zbiory", "{crop.yield} szans na dodatkową sztukę plonu z grządki.", { ranks: 3, from: ["f_grow"], fx: { "crop.yield": 0.2 } }),
        S("f_can", "farming", 1, 3, "Duża konewka", "Konewka mieści {can.charges} podlania więcej.", { ranks: 2, from: ["f_grow"], fx: { "can.charges": 2 } }),
        S("f_seed", "farming", 2, 1, "Nasiennik", "{seed.chance} szans na dodatkowe nasiono przy zbiorze.", { ranks: 2, from: ["f_yield"], fx: { "seed.chance": 0.25 } }),
        S("f_cost", "farming", 2, 2, "Ogrodnik", "Grabienie, kopanie, sianie, podlewanie i zbiór kosztują o {farm.cost} mniej wytrzymałości.", { ranks: 2, from: ["f_yield", "f_can"], fx: { "farm.cost": 0.2 } }),
        S("f_water", "farming", 2, 3, "Wilgotna ziemia", "Podlana ziemia trzyma wodę o {water.days} dzień dłużej.", { ranks: 2, from: ["f_can"], fx: { "water.days": 1 } }),
        S("f_birds", "farming", 3, 1, "Strach na wróble", "Ptaki o {birds.raid} rzadziej wyjadają plony.", { ranks: 2, from: ["f_seed"], fx: { "birds.raid": 0.3 } }),
        S("f_animals", "farming", 3, 3, "Hodowca", "{produce.more} szans na dodatkową sztukę z kurnika, ula, owczarni i obory.", { ranks: 2, from: ["f_water", "f_cost"], fx: { "produce.more": 0.25 } }),
        S("f_double", "farming", 4, 2, "Złoty plon", "{crop.double} szans na podwójny plon z grządki.", { ranks: 2, from: ["f_birds", "f_animals"], fx: { "crop.double": 0.08 } }),
        S("f_master", "farming", 5, 2, "Gospodarz", "Rośliny rosną o {crop.growth} szybciej, zwierzęta dają więcej (+{produce.more} szans).", { from: ["f_double"], attr: { con: 20 }, fx: { "crop.growth": 0.15, "produce.more": 0.25 } }),

        // ---- Rzemiosło
        S("c_fast", "craft", 0, 2, "Sprawne ręce", "Praca w warsztatach, piecach i wytwarzanie trwa o {craft.speed} krócej.", { ranks: 3, fx: { "craft.speed": 0.08 } }),
        S("c_save", "craft", 1, 1, "Oszczędny", "{craft.save} szans, że jeden materiał wróci do plecaka po wytworzeniu.", { ranks: 3, from: ["c_fast"], fx: { "craft.save": 0.1 } }),
        S("c_smelt", "craft", 1, 3, "Hutnik", "Piec ziemny, cegielnia, kuźnia i huta pracują o {smelt.speed} krócej.", { ranks: 2, from: ["c_fast"], attr: { str: 12 }, fx: { "smelt.speed": 0.15 } }),
        S("c_wear", "craft", 2, 2, "Dbały", "Narzędzia i broń zużywają się o {tool.wear} wolniej.", { ranks: 3, from: ["c_save", "c_smelt"], fx: { "tool.wear": 0.12 } }),
        S("c_double", "craft", 2, 0, "Podwójna robota", "{craft.double} szans na podwójny wyrób (nie dotyczy narzędzi i rzeczy, które ma się raz).", { ranks: 2, from: ["c_save"], fx: { "craft.double": 0.08 } }),
        S("c_repair", "craft", 3, 3, "Naprawiacz", "Naprawa narzędzi kosztuje o połowę mniej materiałów.", { from: ["c_wear"] }),
        S("c_trade", "craft", 3, 1, "Kupiecka żyłka", "Sprzedajesz o {sell} drożej.", { ranks: 2, from: ["c_double", "c_wear"], attr: { per: 10 }, fx: { "sell": 0.15 } }),
        S("c_master", "craft", 4, 2, "Mistrz cechu", "Wytwarzanie o {craft.speed} krótsze, +{craft.save} szans na zwrot materiału.", { from: ["c_trade", "c_repair"], attr: { per: 20 }, fx: { "craft.speed": 0.15, "craft.save": 0.1 } }),

        // ---- Budownictwo
        S("b_hits", "build", 0, 2, "Cieśla", "Plac budowy: o {build.hits} mniej uderzeń młotkiem.", { ranks: 3, fx: { "build.hits": 0.1 } }),
        S("b_cost", "build", 1, 1, "Lekki młot", "Uderzenie młotkiem kosztuje o {build.cost} mniej wytrzymałości.", { ranks: 2, from: ["b_hits"], fx: { "build.cost": 0.2 } }),
        S("b_refund", "build", 1, 3, "Rozbiórka", "Z rozebranego budynku odzyskujesz o {build.refund} więcej materiałów.", { ranks: 2, from: ["b_hits"], fx: { "build.refund": 0.15 } }),
        S("b_spare", "build", 2, 2, "Resztki", "Po skończonej budowie {build.spare} szans na zwrot sztuki każdego materiału.", { ranks: 2, from: ["b_cost", "b_refund"], fx: { "build.spare": 0.25 } }),
        S("b_hits2", "build", 3, 2, "Majster", "Plac budowy: jeszcze o {build.hits} mniej uderzeń.", { ranks: 2, from: ["b_spare"], attr: { str: 15 }, fx: { "build.hits": 0.1 } }),
        S("b_master", "build", 4, 2, "Architekt", "Budowa: o {build.hits} mniej uderzeń i o {build.cost} mniej wytrzymałości na uderzenie.", { from: ["b_hits2"], attr: { con: 18 }, fx: { "build.hits": 0.1, "build.cost": 0.2 } }),

        // ---- Kuchnia
        S("k_value", "cooking", 0, 2, "Kucharz", "Jedzenie daje o {food.value} więcej sił, sytości i nawodnienia.", { ranks: 3, fx: { "food.value": 0.08 } }),
        S("k_spoil", "cooking", 1, 1, "Spiżarnik", "Jedzenie psuje się o {spoil} wolniej.", { ranks: 3, from: ["k_value"], fx: { "spoil": 0.12 } }),
        S("k_fire", "cooking", 1, 3, "Palacz", "Drewno i gałęzie palą się w ognisku o {fire.fuel} dłużej.", { ranks: 2, from: ["k_value"], fx: { "fire.fuel": 0.25 } }),
        S("k_buff", "cooking", 2, 1, "Smakosz", "Premie z jedzenia trwają o {food.buff} dłużej.", { ranks: 2, from: ["k_spoil"], fx: { "food.buff": 0.25 } }),
        S("k_speed", "cooking", 2, 3, "Szybki ruszt", "Pieczenie, gotowanie i wędzenie trwa o {cook.speed} krócej.", { ranks: 2, from: ["k_fire"], fx: { "cook.speed": 0.15 } }),
        S("k_portion", "cooking", 3, 2, "Większe porcje", "{cook.double} szans na dodatkową porcję z ogniska, kociołka, wędzarni i piekarni.", { ranks: 2, from: ["k_buff", "k_speed"], fx: { "cook.double": 0.12 } }),
        S("k_salt", "cooking", 4, 1, "Solarz", "Jedzenie w spiżarni i w skrzyniach psuje się o {spoil.store} wolniej.", { from: ["k_portion"], fx: { "spoil.store": 0.5 } }),
        S("k_master", "cooking", 5, 2, "Mistrz kuchni", "Jedzenie daje o {food.value} więcej, premie trwają o {food.buff} dłużej.", { from: ["k_salt", "k_portion"], attr: { con: 15 }, fx: { "food.value": 0.15, "food.buff": 0.25 } })
    ];

    window.SkillData = { TREES, SKILLS, FX, ROW_LEVEL };
})();
