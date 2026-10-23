//=============================================================================
// Ubior_Data.js
//=============================================================================
// The hero's clothes - the data (docs/ekwipunek/PLAN.md, section 5 "Wspólne klucze"). Nothing here moves by itself: the look is
// Ubior.js (the masks, the repaints, the things put on), the trade, the bonuses and the wear are Ubior_Sklepy.js, the parts of the body
// are Equipment.js (it reads <Ubior:miejsce,wzor> from the items' notes and puts each thing on its part).
//   WZORY       - wzor key -> { miejsce, czesc (the mask part it repaints), rampa (6 colours, darkest first), nakladka (a picture put
//                 on: img/system/<file>.png; with a rampa the picture's own tones are repainted through it), akcent }
//   PRZEDMIOTY  - the things: id (data/Items.json; 250-299 new, 113 / 114 / 171 the old ones), wzor, nazwa, miejsce, cena, bonus,
//                 waga, trwalosc (days of work, Durability.js "wear"; null: it does not wear out by work), material, ikona
//   BONUSY      - what a bonus key does and its words; small on purpose: the clothes are mostly the look and a little edge
//   SKLEPY      - who sells what (TownLife residents by key; the kantor: Kantor.js goods), what each buys back and for how much
//   FARBOWANIE  - the seamstress dyes the linen shirt (the same thing in another colour: another item, the wear kept)
//   NAPRAWA     - who mends what (the seamstress the cloth, the tanner the leather) and for how much
//   ZUZYCIE     - how fast the clothes wear (work, blows)
// Without TawernaCore (Node, the tools in tools/ubior/) only the data is given out: window.Ubior_Data.

/*:
 * @target MZ
 * @plugindesc Ubiór - dane: wzory (rampy kolorów, nakładki), przedmioty 250-299 i stare 113/114/171, ceny, bonusy, sklepy, farbowanie, naprawa. v1.0.0
 * @author Claude
 * @orderAfter TawernaCore
 * @orderAfter Equipment
 *
 * @help
 * ============================================================================
 * Ubior_Data.js - ubiór bohatera: dane
 * ============================================================================
 * Sam nic nie robi. Czytają go: Ubior.js (wygląd: WZORY), Ubior_Sklepy.js
 * (sklepy, bonusy, zużycie, farbowanie, naprawa) i Equipment.js (opis
 * przedmiotu na karcie postaci). Przedmiot ubioru ma w notatce
 * <Ubior:miejsce,wzor> (miejsce: glowa, tors, nogi, stopy, pas, rece, plecy).
 *
 * Ceny, bonusy i trwałość poprawia się tutaj (tabela PRZEDMIOTY), sklepy
 * w tabeli SKLEPY. Po zmianie nazw, cen albo opisów: tools/ubior/
 * zrob_staging.js, potem tools/ubior/instaluj_dane.py (przy zamkniętym
 * edytorze) - albo poprawka w edytorze bazy danych.
 *
 * Skrypt:
 *   Ubior_Data.przedmiot(id)     wpis z PRZEDMIOTY (albo null)
 *   Ubior_Data.wzorPrzedmiotu(id)  klucz wzoru ("koszula_lniana_biala")
 *   Ubior_Data.stroj()           co widać teraz: { glowa: wzor, tors: ... }
 *   Ubior_Data.opis(id)          co daje (słowa karty postaci)
 * ============================================================================
 */

(() => {
    "use strict";

    // ------------------------------------------------------------------
    // The places on the body: Equipment.js's part, the name, the mask part a repaint goes on (tools/ubior/maski.py CZESCI;
    // "dlonie" - the hands - is not in the masks yet: the gloves wait for it)
    // ------------------------------------------------------------------
    const MIEJSCA = {
        glowa: { eq: "head", nazwa: "Głowa", czesc: null },
        tors: { eq: "torso", nazwa: "Tors", czesc: "koszula" },
        nogi: { eq: "legs", nazwa: "Nogi", czesc: "spodnie" },
        stopy: { eq: "feet", nazwa: "Stopy", czesc: "stopy" },
        pas: { eq: "belt", nazwa: "Pas", czesc: "pas" },
        rece: { eq: "hands", nazwa: "Rękawice", czesc: "dlonie" },
        plecy: { eq: "back", nazwa: "Plecy", czesc: null }
    };
    const MATERIALY = { len: "len", plotno: "płótno", welna: "wełna", filc: "filc", skora: "skóra", sloma: "słoma", lyko: "łyko" };

    // ------------------------------------------------------------------
    // WZORY: the look of each thing. rampa: 6 tones, the darkest first - a repainted part takes them by the old pixel's brightness
    // (Ubior.js); for a nakladka the same ramp repaints the picture's own tones (one drawing, many colours). The ramps are a proposal in
    // the game's earthy palette (the grey tunic #5e5b58-#999792, the trousers #442b1d-#78573b): the graphics may tune them.
    // ------------------------------------------------------------------
    const SKORA_BRAZ = ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f"];
    const SKORA_CZARNA = ["#0e0b0a", "#1a1513", "#28211d", "#373029", "#4a4038", "#5e5349"];
    const WZORY = {
        // ---- głowa (nakładki: tylko niskie nakrycia - w klatkach chodu nad włosami są 2 px)
        kapelusz_slomkowy: { miejsce: "glowa", nakladka: "Ubior_Kapelusz", rampa: ["#5a4220", "#7d5e2c", "#a07c3a", "#c29d4f", "#dcbd6e", "#efd894"] },
        kapelusz_slomkowy_ciemny: { miejsce: "glowa", nakladka: "Ubior_Kapelusz", rampa: ["#33240f", "#4a3416", "#63461f", "#7c5a29", "#957037", "#ad8749"] },
        chusta_biala: { miejsce: "glowa", nakladka: "Ubior_Chusta", rampa: ["#6e6656", "#8f8672", "#b0a68e", "#cdc4aa", "#e3dcc6", "#f3eee0"] },
        chusta_czerwona: { miejsce: "glowa", nakladka: "Ubior_Chusta", rampa: ["#4a1414", "#6b1d1a", "#8c2a22", "#ab3a2c", "#c4533b", "#d9725a"] },
        chusta_niebieska: { miejsce: "glowa", nakladka: "Ubior_Chusta", rampa: ["#1c2640", "#28365a", "#364a75", "#47608f", "#5d79a8", "#7d96c0"] },
        czapka_filc_braz: { miejsce: "glowa", nakladka: "Ubior_Czapka", rampa: ["#2a1d14", "#3e2b1d", "#544028", "#6b5434", "#836a44", "#9a8158"] },
        czapka_filc_szara: { miejsce: "glowa", nakladka: "Ubior_Czapka", rampa: ["#2b2b2a", "#3f3e3c", "#555350", "#6c6a66", "#85827d", "#9e9b95"] },
        czapka_filc_zielona: { miejsce: "glowa", nakladka: "Ubior_Czapka", rampa: ["#1d2618", "#2a3822", "#3a4b2e", "#4b5f3a", "#5f7449", "#768a5c"] },
        opaska_braz: { miejsce: "glowa", nakladka: "Ubior_Opaska", rampa: SKORA_BRAZ },
        opaska_czarna: { miejsce: "glowa", nakladka: "Ubior_Opaska", rampa: ["#0f0d0c", "#1c1816", "#2a2522", "#3a3430", "#4c4540", "#605852"] },
        // ---- tors (przemalowanie koszuli: kształt zostaje - krótkie rękawy, postrzępiony dół)
        koszula_lniana_biala: { miejsce: "tors", czesc: "koszula", rampa: ["#4a4538", "#6b6452", "#8f8770", "#b0a88f", "#cdc6ac", "#e6e0c8"] },
        koszula_lniana_zolta: { miejsce: "tors", czesc: "koszula", rampa: ["#4d3c16", "#6e5620", "#91722c", "#b18f3b", "#ccab52", "#e2c66f"] },
        koszula_lniana_niebieska: { miejsce: "tors", czesc: "koszula", rampa: ["#1f2a3d", "#2d3c56", "#3e5070", "#516689", "#687ea2", "#849abb"] },
        kaftan_czerwony: { miejsce: "tors", czesc: "koszula", rampa: ["#3a1214", "#561a1a", "#73241f", "#8f3024", "#a8402c", "#bf5638"] },
        kaftan_brazowy: { miejsce: "tors", czesc: "koszula", rampa: ["#2a1a10", "#3f2717", "#56351f", "#6e4529", "#875735", "#a06b43"] },
        kaftan_granatowy: { miejsce: "tors", czesc: "koszula", rampa: ["#141a2b", "#1e273f", "#2a3554", "#38456a", "#485880", "#5c6d96"] },
        kurta_zielona: { miejsce: "tors", czesc: "koszula", rampa: ["#1c2614", "#2a3a1c", "#3a4f25", "#4b6330", "#5f793c", "#78914c"] },
        kurta_brazowa: { miejsce: "tors", czesc: "koszula", rampa: ["#24160d", "#3a2414", "#54351d", "#6d4726", "#875b31", "#a1713f"] },   // (= 171 Skórzana kurtka)
        koszula_odswietna: { miejsce: "tors", czesc: "koszula", rampa: ["#5a5548", "#7d7765", "#a29b86", "#c4bea8", "#dfdac8", "#f5f2e6"], akcent: "#b8342c" },   // (akcent: czerwony haft)
        // ---- nogi (przemalowanie spodni)
        spodnie_plocienne_szare: { miejsce: "nogi", czesc: "spodnie", rampa: ["#2e2c29", "#423f3b", "#57534d", "#6d6862", "#847f77", "#9b958c"] },
        spodnie_plocienne_niebieskie: { miejsce: "nogi", czesc: "spodnie", rampa: ["#1a2233", "#263147", "#33425c", "#435472", "#566888", "#6c7f9e"] },
        spodnie_plocienne_brazowe: { miejsce: "nogi", czesc: "spodnie", rampa: ["#2e1d12", "#442b1d", "#533624", "#62452e", "#78573b", "#8e6c4c"] },
        spodnie_welniane_brazowe: { miejsce: "nogi", czesc: "spodnie", rampa: ["#2a1c14", "#3d2a1e", "#52392a", "#684a37", "#7e5c46", "#946f57"] },
        spodnie_welniane_zielone: { miejsce: "nogi", czesc: "spodnie", rampa: ["#1c2419", "#283424", "#364531", "#45573f", "#566a4e", "#6a7e60"] },
        spodnie_skorzane_czarne: { miejsce: "nogi", czesc: "spodnie", rampa: SKORA_CZARNA },
        spodnie_skorzane_brazowe: { miejsce: "nogi", czesc: "spodnie", rampa: SKORA_BRAZ },
        // ---- stopy (łapcie: przemalowanie stóp; buty: przemalowanie stóp + cholewka jako nakładka)
        lapcie: { miejsce: "stopy", czesc: "stopy", rampa: ["#3d2c17", "#5a4222", "#77592f", "#937340", "#ad8c55", "#c4a56e"] },
        buty_brazowe: { miejsce: "stopy", czesc: "stopy", nakladka: "Ubior_Cholewka", rampa: SKORA_BRAZ },   // (= 113 Skórzane buty)
        buty_czarne: { miejsce: "stopy", czesc: "stopy", nakladka: "Ubior_Cholewka", rampa: ["#0d0b0a", "#191513", "#262019", "#352d25", "#463c32", "#5a4e42"] },
        // ---- pas (przemalowanie paska; sakiewka: nakładka na biodrze)
        pas_skorzany_braz: { miejsce: "pas", czesc: "pas", rampa: SKORA_BRAZ, akcent: "#b9b3a6" },   // (akcent: sprzączka)
        pas_skorzany_czarny: { miejsce: "pas", czesc: "pas", rampa: SKORA_CZARNA, akcent: "#b9b3a6" },
        pas_sakiewka: { miejsce: "pas", czesc: "pas", nakladka: "Ubior_Sakiewka", rampa: SKORA_BRAZ, akcent: "#b9b3a6" },
        // ---- ręce (przemalowanie dłoni - część „dlonie” jeszcze nie w maskach)
        rekawice_brazowe: { miejsce: "rece", czesc: "dlonie", rampa: SKORA_BRAZ },
        rekawice_szare: { miejsce: "rece", czesc: "dlonie", rampa: ["#2b2a28", "#3e3c39", "#53504c", "#6a6661", "#827d77", "#9a958e"] },
        // ---- plecy (nakładki)
        plecak: { miejsce: "plecy", nakladka: "Ubior_Plecak", rampa: ["#3a2616", "#543420", "#6a4428", "#7a502e", "#966c42", "#c49660"] },   // (= 114 Plecak)
        torba_plocienna: { miejsce: "plecy", nakladka: "Ubior_Torba", rampa: ["#4a4436", "#665e4b", "#837962", "#a0967c", "#bbb197", "#d3cab2"] },
        torba_skorzana: { miejsce: "plecy", nakladka: "Ubior_Torba", rampa: SKORA_BRAZ }
    };

    // ------------------------------------------------------------------
    // BONUSY: key -> { opis(value), perk (Combat.perk's key the value adds to - Ubior_Sklepy wraps Combat.perk), kiedy (only then) }.
    // The rest is worked by Ubior_Sklepy itself: chod (the walk), udzwig (Combat.carryBonus), rabunek (the bus "heroRobbed"),
    // schludnosc (the bus "townOpinion", the prices), pancerz (Combat_Fight ARMORS), plecak (Survival.js).
    // ------------------------------------------------------------------
    const pct = v => Math.round(v * 100) + "%";
    const BONUSY = {
        pragnienie_upal: { perk: "thirst", kiedy: "upal", opis: v => "w upał i suszę pragnienie rośnie o " + pct(v) + " wolniej", kv: v => ["Pragnienie w upał", "-" + pct(v)] },
        zimno: { perk: "cold", opis: v => "zimą i w śniegu marzniesz o " + pct(v) + " mniej", kv: v => ["Zimno", "-" + pct(v)] },
        praca: { perk: "stamina.cost", opis: v => "pot nie zalewa oczu: praca męczy o " + pct(v) + " mniej", kv: v => ["Zmęczenie pracą", "-" + pct(v)] },
        rabanie: { perk: "gather.cost", perk2: ["farm.cost", 0.5], opis: v => "rąbanie, kopanie i kucie skał męczą o " + pct(v) + " mniej", kv: v => ["Rąbanie, kopanie", "-" + pct(v) + " zmęczenia"] },
        krzaki: { perk: "gather.cost", kiedy: "krzak", opis: v => "krzaki i ciernie mniej kaleczą: wycinasz je o " + pct(v) + " mniejszym wysiłkiem", kv: v => ["Krzaki, ciernie", "-" + pct(v) + " zmęczenia"] },
        chod: { opis: v => "chodzisz o " + pct(v) + " szybciej", kv: v => ["Chód", "+" + pct(v) + " szybciej"] },
        udzwig: { opis: v => "udźwig +" + v, kv: v => ["Udźwig", "+" + v] },
        rabunek: { opis: v => "przy rabunku sakiewka pod pasem ocala " + (v === 0.5 ? "połowę" : pct(v)) + " groszy", kv: v => ["Przy rabunku ocalisz", pct(v) + " groszy"] },
        schludnosc: { opis: v => v >= 2 ? "duża schludność: Opinia w miasteczku rośnie o " + pct(SCHLUDNOSC[2].opinia) + " szybciej, u kramarzy płacisz mniej i dostajesz więcej"
            : "schludność: Opinia w miasteczku rośnie o " + pct(SCHLUDNOSC[1].opinia) + " szybciej", kv: v => ["Opinia rośnie", "+" + pct(SCHLUDNOSC[v >= 2 ? 2 : 1].opinia) + " szybciej"] },
        pancerz: { opis: v => "cios słabszy o " + pct(v), kv: v => ["Cios słabszy o", pct(v)] },
        plecak: { opis: () => "większe stosy, więcej udźwigu", kv: () => ["Plecak", "stosy i udźwig"] }
    };
    // neatness (a clean shirt, not torn - at least `stan` of its wear left): the opinion's gains grow by `opinia`; `ceny`: the shops of
    // the clothes (and the kantor's shirt) are that much kinder - buying cheaper, selling dearer
    const SCHLUDNOSC = { stan: 0.3, 1: { opinia: 0.25, ceny: 0 }, 2: { opinia: 0.5, ceny: 0.1 } };
    // the hat's heat: outdoors, from 8 to 19, in summer or on a hot / drought day (Okolice.hot, Okolice.drought)
    const UPAL = { od: 8, do: 19, lato: 1 };

    // ------------------------------------------------------------------
    // PRZEDMIOTY. ikona: the icon (528+ the new rows of IconSet, tools/ubior/ikony.py; rysunek: its drawing there - "kurta" and
    // "buty" are the old icons 435 / 369 repainted). trwalosc: days of work it lasts (100 strength spent = one day; Durability.js
    // "wear"), "cios": worn only by the blows that get through (like the jacket 171); null: it does not wear. rodzaj: f / m / p (the
    // words "się podarła / podarł / podarły"). cena: the price in the shops (null: not traded). istnieje: an old item (113, 114, 171) -
    // its name, icon and description stay as they are in Items.json, only the note <Ubior:...> is added.
    // ------------------------------------------------------------------
    const P = (id, wzor, nazwa, cena, o) => Object.assign({ id, wzor, nazwa, miejsce: WZORY[wzor].miejsce, cena, bonus: {}, waga: 1, trwalosc: 30, material: "len", rodzaj: "f",
        ikona: id >= 250 ? 528 + (id - 250) : 0, rysunek: "", opis: "" }, o);
    const PRZEDMIOTY = [
        // ---- głowa
        P(250, "kapelusz_slomkowy", "Słomkowy kapelusz", 12, { bonus: { pragnienie_upal: 0.2 }, material: "sloma", rodzaj: "m", rysunek: "kapelusz",
            opis: "Kapelusz z plecionej słomy, z szerokim rondem. W upał i suszę osłania głowę: pragnienie rośnie wolniej." }),
        P(251, "kapelusz_slomkowy_ciemny", "Ciemny słomkowy kapelusz", 12, { bonus: { pragnienie_upal: 0.2 }, material: "sloma", rodzaj: "m", rysunek: "kapelusz",
            opis: "Słomkowy kapelusz uwędzony nad dymem na ciemno. W upał i suszę osłania głowę: pragnienie rośnie wolniej." }),
        P(252, "chusta_biala", "Biała lniana chusta", 6, { waga: 0, trwalosc: 25, rysunek: "chusta",
            opis: "Kawałek bielonego lnu zawiązany na głowie. Tani i ładny - nic więcej." }),
        P(253, "chusta_czerwona", "Czerwona lniana chusta", 6, { waga: 0, trwalosc: 25, rysunek: "chusta",
            opis: "Lniana chusta farbowana na czerwono. Widać cię z daleka." }),
        P(254, "chusta_niebieska", "Niebieska lniana chusta", 6, { waga: 0, trwalosc: 25, rysunek: "chusta",
            opis: "Lniana chusta w kolorze morza. Tania, a ładna." }),
        P(255, "czapka_filc_braz", "Brązowa filcowa czapka", 18, { bonus: { zimno: 0.15 }, material: "filc", trwalosc: 45, rysunek: "czapka",
            opis: "Gruba czapka z ubitej wełny. Zimą trochę mniej marzniesz." }),
        P(256, "czapka_filc_szara", "Szara filcowa czapka", 18, { bonus: { zimno: 0.15 }, material: "filc", trwalosc: 45, rysunek: "czapka",
            opis: "Szara filcowa czapka, ciepła i miękka. Zimą trochę mniej marzniesz." }),
        P(257, "czapka_filc_zielona", "Zielona filcowa czapka", 18, { bonus: { zimno: 0.15 }, material: "filc", trwalosc: 45, rysunek: "czapka",
            opis: "Filcowa czapka w kolorze mchu. Zimą trochę mniej marzniesz." }),
        P(258, "opaska_braz", "Brązowa skórzana opaska", 10, { bonus: { praca: 0.03 }, waga: 0, material: "skora", trwalosc: 40, rysunek: "opaska",
            opis: "Rzemienna opaska na czoło. Pot nie zalewa oczu: praca męczy odrobinę mniej." }),
        P(259, "opaska_czarna", "Czarna skórzana opaska", 10, { bonus: { praca: 0.03 }, waga: 0, material: "skora", trwalosc: 40, rysunek: "opaska",
            opis: "Czarna rzemienna opaska. Pot nie zalewa oczu: praca męczy odrobinę mniej." }),
        // ---- tors (bez niczego: łachman - wygląd jak dziś)
        P(260, "koszula_lniana_biala", "Biała lniana koszula", 8, { bonus: { schludnosc: 1 }, rysunek: "koszula",
            opis: "Prosta koszula z bielonego lnu. Schludny chłopak to inna rozmowa: Opinia w miasteczku rośnie szybciej." }),
        P(261, "koszula_lniana_zolta", "Żółta lniana koszula", 11, { bonus: { schludnosc: 1 }, rysunek: "koszula",
            opis: "Lniana koszula farbowana rezedą na żółto. Schludność: Opinia w miasteczku rośnie szybciej." }),
        P(262, "koszula_lniana_niebieska", "Niebieska lniana koszula", 14, { bonus: { schludnosc: 1 }, rysunek: "koszula",
            opis: "Lniana koszula farbowana urzetem na niebiesko. Schludność: Opinia w miasteczku rośnie szybciej." }),
        P(263, "kaftan_czerwony", "Czerwony wełniany kaftan", 25, { bonus: { zimno: 0.35 }, waga: 2, material: "welna", rodzaj: "m", trwalosc: 45, rysunek: "kaftan",
            opis: "Ciepły kaftan z grubej wełny. Zimą i w śniegu marzniesz wyraźnie mniej." }),
        P(264, "kaftan_brazowy", "Brązowy wełniany kaftan", 25, { bonus: { zimno: 0.35 }, waga: 2, material: "welna", rodzaj: "m", trwalosc: 45, rysunek: "kaftan",
            opis: "Wełniany kaftan w kolorze kory. Zimą i w śniegu marzniesz wyraźnie mniej." }),
        P(265, "kaftan_granatowy", "Granatowy wełniany kaftan", 25, { bonus: { zimno: 0.35 }, waga: 2, material: "welna", rodzaj: "m", trwalosc: 45, rysunek: "kaftan",
            opis: "Granatowy kaftan z wełny, jak u przewoźników. Zimą i w śniegu marzniesz wyraźnie mniej." }),
        P(266, "kurta_zielona", "Zielona skórzana kurta", 40, { bonus: { pancerz: 0.2 }, waga: 2, material: "skora", trwalosc: "cios", rysunek: "kurta",
            opis: "Kurta z wyprawionej skóry barwionej na zielono. Każdy cios, który do ciebie dojdzie, jest o 20% słabszy. Zużywa się od ciosów." }),
        P(267, "koszula_odswietna", "Odświętna koszula z haftem", 60, { bonus: { schludnosc: 2 }, trwalosc: 25, rysunek: "koszula_haft",
            opis: "Biała koszula z czerwonym haftem, towar z kontynentu. Duża schludność: lepsze ceny u kramarzy i Opinia rośnie szybciej." }),
        // ---- nogi
        P(268, "spodnie_plocienne_szare", "Szare płócienne spodnie", 10, { material: "plotno", rodzaj: "p", rysunek: "spodnie",
            opis: "Zwykłe spodnie z szarego płótna. Całe, bez dziur - i tyle." }),
        P(269, "spodnie_plocienne_niebieskie", "Niebieskie płócienne spodnie", 10, { material: "plotno", rodzaj: "p", rysunek: "spodnie",
            opis: "Płócienne spodnie farbowane na niebiesko." }),
        P(270, "spodnie_plocienne_brazowe", "Brązowe płócienne spodnie", 10, { material: "plotno", rodzaj: "p", rysunek: "spodnie",
            opis: "Płócienne spodnie w kolorze ziemi. Brudu na nich nie widać." }),
        P(271, "spodnie_welniane_brazowe", "Brązowe wełniane spodnie", 20, { bonus: { zimno: 0.2 }, material: "welna", rodzaj: "p", trwalosc: 45, rysunek: "spodnie_welna",
            opis: "Grube spodnie z wełny. Zimą marzniesz mniej." }),
        P(272, "spodnie_welniane_zielone", "Zielone wełniane spodnie", 20, { bonus: { zimno: 0.2 }, material: "welna", rodzaj: "p", trwalosc: 45, rysunek: "spodnie_welna",
            opis: "Wełniane spodnie w kolorze mchu. Zimą marzniesz mniej." }),
        P(273, "spodnie_skorzane_czarne", "Czarne skórzane spodnie", 35, { bonus: { krzaki: 0.3 }, waga: 2, material: "skora", rodzaj: "p", trwalosc: 70, rysunek: "spodnie_skora",
            opis: "Spodnie z twardej skóry. Krzaki i ciernie mniej kaleczą: wycinasz je mniejszym wysiłkiem." }),
        P(274, "spodnie_skorzane_brazowe", "Brązowe skórzane spodnie", 35, { bonus: { krzaki: 0.3 }, waga: 2, material: "skora", rodzaj: "p", trwalosc: 70, rysunek: "spodnie_skora",
            opis: "Brązowe skórzane spodnie. Krzaki i ciernie mniej kaleczą: wycinasz je mniejszym wysiłkiem." }),
        // ---- stopy
        P(275, "lapcie", "Łapcie z łyka", 4, { bonus: { chod: 0.04 }, waga: 0, material: "lyko", rodzaj: "p", trwalosc: 12, rysunek: "lapcie",
            opis: "Plecione z łyka, lekkie jak nic. Chodzisz trochę szybciej niż boso. Szybko się rozpadają." }),
        P(276, "buty_czarne", "Czarne skórzane buty", 30, { bonus: { chod: 0.1 }, waga: 2, material: "skora", rodzaj: "p", trwalosc: 70, rysunek: "buty",
            opis: "Mocne buty z czarnej skóry, z cholewką. Chodzisz w nich szybciej." }),
        // ---- pas
        P(277, "pas_skorzany_braz", "Brązowy skórzany pas", 12, { bonus: { udzwig: 10 }, material: "skora", rodzaj: "m", trwalosc: 80, rysunek: "pas",
            opis: "Szeroki pas z żelazną sprzączką. Za pasem zatkniesz więcej: udźwig +10." }),
        P(278, "pas_skorzany_czarny", "Czarny skórzany pas", 12, { bonus: { udzwig: 10 }, material: "skora", rodzaj: "m", trwalosc: 80, rysunek: "pas",
            opis: "Czarny pas z żelazną sprzączką. Udźwig +10." }),
        P(279, "pas_sakiewka", "Pas z sakiewką", 25, { bonus: { udzwig: 15, rabunek: 0.5 }, material: "skora", rodzaj: "m", trwalosc: 80, rysunek: "pas_sakiewka",
            opis: "Pas z sakiewką schowaną pod koszulą. Udźwig +15, a przy rabunku połowa groszy zostaje przy tobie." }),
        // ---- ręce
        P(280, "rekawice_brazowe", "Brązowe skórzane rękawice", 15, { bonus: { rabanie: 0.1 }, material: "skora", rodzaj: "p", trwalosc: 40, rysunek: "rekawice",
            opis: "Grube rękawice ze skóry. Trzonek nie obciera dłoni: rąbanie i kopanie męczą mniej." }),
        P(281, "rekawice_szare", "Szare skórzane rękawice", 15, { bonus: { rabanie: 0.1 }, material: "skora", rodzaj: "p", trwalosc: 40, rysunek: "rekawice",
            opis: "Rękawice z szarej, miękkiej skóry. Rąbanie i kopanie męczą mniej." }),
        // ---- plecy (torby się nie zużywają, jak plecak)
        P(282, "torba_plocienna", "Płócienna torba przez ramię", 15, { bonus: { udzwig: 20 }, material: "plotno", trwalosc: null, rysunek: "torba",
            opis: "Torba z płótna na długim pasku. Mniejsza od plecaka: udźwig +20." }),
        P(283, "torba_skorzana", "Skórzana torba przez ramię", 30, { bonus: { udzwig: 35 }, waga: 2, material: "skora", trwalosc: null, rysunek: "torba",
            opis: "Skórzana torba z klapą. Udźwig +35 - prawie plecak." }),
        // ---- the old things (the same items: only the note <Ubior:...>; their effects stay with Survival.js and Combat_Fight.js)
        P(113, "buty_brazowe", "Skórzane buty", 30, { bonus: { chod: 0.1 }, waga: 2, material: "skora", rodzaj: "p", trwalosc: 70, ikona: 369, istnieje: true }),
        P(171, "kurta_brazowa", "Skórzana kurtka", 40, { bonus: { pancerz: 0.2 }, waga: 2, material: "skora", trwalosc: "cios", ikona: 435, istnieje: true }),
        P(114, "plecak", "Plecak", null, { bonus: { plecak: true }, waga: 0, material: "skora", rodzaj: "m", trwalosc: null, ikona: 370, istnieje: true })
    ];
    // the things whose bonus another plugin works already (Ubior_Sklepy leaves them alone): the boots' walk (Survival BOOTS_SPEED), the
    // jacket's armour (Combat_Fight ARMORS[171]), the backpack (Survival)
    const STARE = { 113: "chod", 171: "pancerz", 114: "plecak" };

    // ------------------------------------------------------------------
    // SKLEPY: TownLife residents (key) and their trade. sprzedaje: the wzor keys (each at its PRZEDMIOTY cena); skupuje: the materials
    // bought back (true: everything) at `skup` of the price (worn things less: by what is left of them, at least `skupMin`);
    // naprawia / farbuje: NAPRAWA / FARBOWANIE; uzywane: the rag-and-bone man's used things (each day `ile` of the list, `cena` of the
    // price, `zuzycie` of the wear already on them); godziny: when the shop is open (else the resident's usual talk); teksty: their words.
    // The kantor (Kantor.js, Baltazar / Ludmiła after W5) sells the festive shirt among its goods: `kantor`.
    // ------------------------------------------------------------------
    const SKLEPY = {
        szwaczka: {
            kto: "Dorota Igła", tytul: "szwaczka", godziny: [7, 20], skup: 0.4, skupuje: ["len", "plotno", "welna", "filc"], naprawia: true, farbuje: true,
            sprzedaje: ["koszula_lniana_biala", "koszula_lniana_zolta", "koszula_lniana_niebieska", "kaftan_czerwony", "kaftan_brazowy", "kaftan_granatowy",
                "czapka_filc_braz", "czapka_filc_szara", "czapka_filc_zielona", "spodnie_plocienne_szare", "spodnie_plocienne_niebieskie",
                "spodnie_plocienne_brazowe", "spodnie_welniane_brazowe", "spodnie_welniane_zielone", "torba_plocienna"],
            teksty: {
                witaj: ["Koszula, kaftan, spodnie? Wszystko szyte tu, na miejscu, ściegiem, za który ręczę.", "Siadaj, zmierzę cię na oko. Igła się nie myli.",
                    "Masz coś do połatania? Albo do ufarbowania? Mów śmiało."],
                kupione: ["Noś na zdrowie!", "Leży jak ulał. Mówiłam."], sprzedane: ["Wypiorę, załatam - jeszcze komuś posłuży."],
                naprawione: ["Gotowe. Szew mocniejszy niż był."], farbowane: ["Wyschnie w mig. Ładny kolor, prawda?"], zegnaj: ["Przyjdź, jak coś się podrze."]
            }
        },
        garbarz: {
            kto: "Ignac", tytul: "garbarz i szewc", godziny: [6.5, 19], skup: 0.4, skupuje: ["skora"], naprawia: true,
            sprzedaje: ["buty_brazowe", "buty_czarne", "kurta_brazowa", "kurta_zielona", "spodnie_skorzane_brazowe", "spodnie_skorzane_czarne",
                "pas_skorzany_braz", "pas_skorzany_czarny", "pas_sakiewka", "rekawice_brazowe", "rekawice_szare", "opaska_braz", "opaska_czarna", "torba_skorzana"],
            teksty: {
                witaj: ["Buty, pasy, kurty - wszystko z dobrej skóry. Tańsze niż na kontynencie, mocniejsze na pewno.", "Bosy dalej? Wstyd. Popatrz na buty.",
                    "Skórę się smaruje, a nie płacze nad nią. Coś naprawić?"],
                kupione: ["Dobra skóra. Posłuży latami, jak o nią zadbasz."], sprzedane: ["Wezmę. Skóra zawsze się przyda."],
                naprawione: ["Nowa łata, nowe szwy. Jak nowe."], zegnaj: ["Nie chodź boso po rżysku!"]
            }
        },
        przekupka: {
            kto: "Agata", tytul: "przekupka", godziny: [6, 18.5], skup: 0.4, skupuje: ["sloma"],
            sprzedaje: ["kapelusz_slomkowy", "kapelusz_slomkowy_ciemny"],
            teksty: {
                witaj: ["Kapelusze ze słomy, złociutki! Bez kapelusza w taki upał to głowa się ugotuje jak jajko.", "Słomkowy kapelusz - mąż sam pleciony! No, szwagier. Ale porządnie."],
                kupione: ["Pasuje ci, jak ulał! Wyglądasz jak prawdziwy gospodarz."], sprzedane: ["Dobrze, wezmę. Tylko tanio, bo słoma tania."], zegnaj: ["Przychodź, przychodź!"]
            }
        },
        szmaciarz: {
            kto: "Józek Łata", tytul: "handlarz starzyzną", godziny: [7, 20], skup: 0.2, skupuje: true,
            sprzedaje: ["chusta_biala", "chusta_czerwona", "chusta_niebieska", "lapcie"],
            uzywane: { ile: 3, cena: 0.5, zuzycie: 0.5, z: ["koszula_lniana_biala", "spodnie_plocienne_szare", "spodnie_plocienne_brazowe", "kaftan_brazowy",
                "czapka_filc_szara", "rekawice_szare", "pas_skorzany_braz", "opaska_braz", "kapelusz_slomkowy", "spodnie_welniane_brazowe"] },
            teksty: {
                witaj: ["Ubrania? Józek ma! Mało noszone, prawie nic. No, trochę noszone.", "Kupię wszystko, co nosisz. No, prawie wszystko. Tanio, ale kupię!",
                    "Chusty, łapcie, stare kaftany po ludziach z promu. Wszystko ma swoją cenę!"],
                kupione: ["Jak nowe! No, prawie."], sprzedane: ["Ha! Józek bierze. Grosz to grosz."], zegnaj: ["Wracaj! Józek zawsze coś ma."]
            }
        },
        kantor: { kto: "kantor", sprzedaje: ["koszula_odswietna"] }
    };
    // the words of the talk's menu and of the shop's window
    const TEKSTY = {
        menu: { kup: "Pokaż ubrania", sprzedaj: "Sprzedaj ubrania", napraw: "Napraw", farbuj: "Ufarbuj", rozmowa: "Porozmawiaj", nic: "Nic, dziękuję" },
        zakladki: { kup: "Kupno", sprzedaj: "Sprzedaż", napraw: "Naprawa", farbuj: "Farbowanie" },
        pusto: { kup: "Dziś nic tu nie ma.", sprzedaj: "Nie masz nic, co by tu kupili.", napraw: "Nie masz nic do naprawy.", farbuj: "Nie masz nic do ufarbowania." },
        uzywane: "używane"
    };

    // ------------------------------------------------------------------
    // FARBOWANIE: at whose shop, from which wzor to which, for how much (the darker over the lighter only: blue does not go yellow)
    // ------------------------------------------------------------------
    const FARBOWANIE = {
        szwaczka: {
            koszula_lniana_biala: { koszula_lniana_zolta: 4, koszula_lniana_niebieska: 6 },
            koszula_lniana_zolta: { koszula_lniana_niebieska: 4 }
        }
    };
    // ------------------------------------------------------------------
    // NAPRAWA: who mends which materials; the price: `cena` of the thing's price for its whole wear (a half-worn one - half of it), at
    // least `min`; the jacket and the boots can also be patched at the workbench (Durability.js: hide + sinew)
    // ------------------------------------------------------------------
    const NAPRAWA = {
        szwaczka: ["len", "plotno", "welna", "filc", "sloma", "lyko"],
        garbarz: ["skora"],
        cena: 0.3, min: 1,
        warsztat: { skora: [[97, 1], [163, 1]] }   // (the leather ones: Skóra wyprawiona + Ścięgna, as the jacket 171)
    };
    // ------------------------------------------------------------------
    // ZUZYCIE: praca - wear for each point of strength spent (100 = one day of work); cios - wear of every worn piece (besides the
    // armour, which the blows wear in Combat_Fight) for each blow that gets through
    // ------------------------------------------------------------------
    const ZUZYCIE = { praca: 0.01, cios: 0.1 };

    // ------------------------------------------------------------------
    // Lookups (plain data; the runtime ones ask Equipment.js)
    // ------------------------------------------------------------------
    const BY_ID = {}, BY_WZOR = {};
    for (const p of PRZEDMIOTY) { BY_ID[p.id] = p; BY_WZOR[p.wzor] = p; }
    const przedmiot = id => BY_ID[Number(id)] || null;
    const poWzorze = w => BY_WZOR[w] || null;
    const wzorPrzedmiotu = id => (BY_ID[Number(id)] ? BY_ID[Number(id)].wzor : "");
    // the note of an item in Items.json
    const notatka = p => "<Ubior:" + p.miejsce + "," + p.wzor + ">";
    // what a thing does, in words (Equipment's card, the shop's window)
    function opis(id) {
        const p = przedmiot(id);
        if (!p) return "";
        const out = [];
        for (const k of Object.keys(p.bonus)) if (BONUSY[k]) out.push(BONUSY[k].opis(p.bonus[k]));
        return out.join(" · ");
    }
    // the card's rows of numbers (MenuRing's Ekwipunek): [[label, value]]; none - only the look
    function wiersze(id) {
        const p = przedmiot(id);
        if (!p) return [];
        const out = Object.keys(p.bonus).filter(k => BONUSY[k] && BONUSY[k].kv).map(k => BONUSY[k].kv(p.bonus[k]));
        return out.length ? out : [["Daje", "tylko wygląd"]];
    }
    // the card's hint under an empty part's description (MenuRing's Ekwipunek), once the clothes are in the database
    const PODPOWIEDZI = {
        head: "Słomkowy kapelusz chroni w upał, filcowa czapka grzeje zimą. Kupisz u Agaty, Doroty, Ignaca i Józka.",
        torso: "Lniana koszula to schludność, wełniany kaftan grzeje zimą, skórzana kurta osłabia ciosy.",
        legs: "Wełniane spodnie grzeją zimą, skórzane chronią w krzakach.",
        feet: "Bez butów chodzisz wolniej. Łapcie uplecesz w warsztacie albo kupisz u Józka.",
        belt: "Pas dodaje udźwigu, pas z sakiewką ratuje grosze przy rabunku.",
        hands: "Rękawice: rąbanie i kopanie męczą mniej.",
        back: "Bez plecaka mniej uniesiesz. Torba przez ramię to trochę udźwigu."
    };
    function podpowiedz(eq) {
        const m = Object.keys(MIEJSCA).find(k => MIEJSCA[k].eq === eq);
        if (!m || !PODPOWIEDZI[eq] || typeof window === "undefined" || !window.$dataItems) return "";
        return PRZEDMIOTY.some(p => p.miejsce === m && !p.istnieje && $dataItems[p.id] && $dataItems[p.id].name) ? PODPOWIEDZI[eq] : "";
    }
    // who sells it: "Dorota Igła (szwaczka), 18 G"
    function gdzie(id) {
        const p = przedmiot(id);
        if (!p) return "";
        const who = [];
        for (const k of Object.keys(SKLEPY)) {
            const s = SKLEPY[k];
            if (s.sprzedaje.includes(p.wzor) || (s.uzywane && s.uzywane.z.includes(p.wzor))) who.push(k === "kantor" ? "kantor (towar z kontynentu)" : s.kto + " (" + s.tytul + ")");
        }
        return who.length ? who.join(", ") + (p.cena ? ", " + p.cena + " G" : "") : "";
    }

    // ------------------------------------------------------------------
    // ZBROJE, BROŃ, TARCZE - the look (2026-10-23, docs/ekwipunek/PLAN_BRON_ZBROJE.md "Klucze wyglądu"; the numbers: Bron_Data.js).
    // Kept apart from WZORY (the clothes' table of PLAN.md section 5): Ubior.js reads WZORY_ZBROI the same way, Ubior_Bron.js reads
    // WZORY_BRONI and WZORY_TARCZ. An item says its look in its note: <Zbroja:miejsce,wzor> (like <Ubior:...>), <Bron:rodzaj,material>
    // (the key bron_<rodzaj>_<material>; a unique: <Bron:rodzaj,material,klucz>), <Tarcza:wzor>.
    //   RAMPY_ZBROI  - the materials' ramps (7 tones, the darkest first), akcent: 4 tones (rivets, straps, the cross)
    //   WZORY_ZBROI  - helm_<rodzaj>_<material> (glowa: kaptur, czepiec, kapalin, otwarty, nosal, zakonny - pictures Ubior_Helm_*),
    //                  zbroja_<rodzaj>_<material> (tors: przeszywanica, skorznia, kolczuga, luska, napiersnik - a texture on the shirt),
    //                  karwasze_<m> (rece), nagolenniki_<m> (nogi), buty_okute_<m> (stopy)
    //   WZORY_BRONI  - bron_<rodzaj>_<material>: rodzaj (where it is drawn: Ubior_Bron.js SHEETS_OF), material (its ramps there);
    //                  the uniques with their own colours (metal / drzewce / owijka / luk - ramps)
    //   WZORY_TARCZ  - tarcza_<rodzaj>[_<material>]: plik (img/system/Ubior_Tarcza_<plik>), metal (its material), farba (the paint)
    // ------------------------------------------------------------------
    const RAMPY_ZBROI = {
        len: { rampa: ["#3e3a30", "#5a5446", "#777060", "#958d7a", "#b1a993", "#cbc4ad", "#e0dac4"], akcent: ["#2a2418", "#4a3e2a", "#6a5a3c", "#8a7650"] },
        welna: { rampa: ["#22261c", "#333a2a", "#454e39", "#58634a", "#6c785c", "#828e70", "#9aa586"], akcent: ["#2a2418", "#4a3e2a", "#6a5a3c", "#8a7650"] },
        jedwab: { rampa: ["#3c3f44", "#5a5e65", "#7b8088", "#a0a5ad", "#c6cad0", "#e0e3e7", "#f4f5f7"], akcent: ["#5a4a30", "#7a6640", "#9a8456", "#bca46e"] },
        skora: { rampa: ["#24150c", "#3b2414", "#55341d", "#704628", "#8b5a33", "#a6703f", "#bd8a55"], akcent: ["#1a100a", "#2e1c10", "#4a2e18", "#6a4426"] },
        skora_czarna: { rampa: ["#0e0b0a", "#1a1513", "#28211d", "#373029", "#4a4038", "#5e5349", "#74685c"], akcent: ["#5a4a30", "#7a6640", "#9a8456", "#bca46e"] },
        braz: { rampa: ["#2e1a0c", "#4a2c12", "#6a421b", "#8c5a26", "#ad7633", "#c99447", "#e0b464"], akcent: ["#3a2414", "#5a3a20", "#7a5230", "#9a6c42"], polysk: 0.6 },
        zelazo: { rampa: ["#1b1d20", "#2c2f33", "#40444a", "#565b62", "#6e747b", "#888e95", "#a4a9ae"], akcent: ["#3a2414", "#5a3a20", "#7a5230", "#9a6c42"], polysk: 0.4 },
        stal: { rampa: ["#1c222a", "#2e3742", "#44505d", "#5d6b7a", "#7a8999", "#9cabb9", "#c4d0da"], akcent: ["#3a2414", "#5a3a20", "#7a5230", "#9a6c42"], polysk: 0.9 },
        zakon: { rampa: ["#0e1018", "#1a1e2c", "#282e42", "#38405a", "#4c5674", "#66728f", "#8e9ab4"], akcent: ["#5a3c10", "#8a6420", "#b88c34", "#e0bc5c"], polysk: 1 }
    };
    const METALE = { braz: true, zelazo: true, stal: true, zakon: true };
    // the helmets: the materials each is made in; the accent - "jasny": the material's own light tones (rivets on iron), else a material's
    const HELMY = {
        kaptur: { plik: "Ubior_Helm_Kaptur", materialy: ["len", "welna", "skora", "skora_czarna"], faktura: { miekki: "sukno" } },
        czepiec: { plik: "Ubior_Helm_Czepiec", materialy: ["len", "skora", "zelazo", "stal", "zakon"], faktura: { metal: "kolczuga", miekki: "pikowana" } },
        kapalin: { plik: "Ubior_Helm_Kapalin", materialy: ["zelazo", "stal", "braz", "zakon"], akcent: "skora" },
        otwarty: { plik: "Ubior_Helm_Otwarty", materialy: ["skora", "braz", "zelazo", "stal"], akcent: "jasny" },
        nosal: { plik: "Ubior_Helm_Nosal", materialy: ["braz", "zelazo", "stal", "zakon"], akcent: "jasny" },
        zakonny: { plik: "Ubior_Helm_Zakonny", materialy: ["zelazo", "stal", "zakon"], akcent: "jasny" }
    };
    const ZBROJE = {
        przeszywanica: { materialy: ["len", "welna", "skora", "jedwab"], faktura: "pikowana" },
        skorznia: { materialy: ["skora", "skora_czarna"], faktura: "skora" },
        kolczuga: { materialy: ["zelazo", "stal", "zakon"], faktura: "kolczuga" },
        luska: { materialy: ["braz", "zelazo", "stal", "zakon"], faktura: "luska" },
        napiersnik: { materialy: ["braz", "zelazo", "stal", "zakon"], faktura: "blacha" }
    };
    const KARWASZE = ["skora", "skora_czarna", "braz", "zelazo", "stal", "zakon"], NAGOLENNIKI = ["skora", "braz", "zelazo", "stal", "zakon"], OKUTE = ["zelazo", "stal", "zakon"];
    const WZORY_ZBROI = {};
    for (const [k, h] of Object.entries(HELMY)) {
        for (const m of h.materialy) {
            const R = RAMPY_ZBROI[m];
            WZORY_ZBROI["helm_" + k + "_" + m] = { miejsce: "glowa", nakladka: h.plik, rampa: R.rampa, material: m, polysk: R.polysk || 0,
                rampaAkcentu: h.akcent === "jasny" ? R.rampa.slice(3) : h.akcent ? RAMPY_ZBROI[h.akcent].akcent : R.akcent,
                faktura: h.faktura ? h.faktura[METALE[m] ? "metal" : "miekki"] || null : null };
        }
    }
    for (const [k, z] of Object.entries(ZBROJE)) {
        for (const m of z.materialy) WZORY_ZBROI["zbroja_" + k + "_" + m] = { miejsce: "tors", czesc: "koszula", rampa: RAMPY_ZBROI[m].rampa, faktura: z.faktura, material: m,
            polysk: RAMPY_ZBROI[m].polysk || 0 };
    }
    for (const m of KARWASZE) WZORY_ZBROI["karwasze_" + m] = { miejsce: "rece", nakladka: "karwasze", rampa: RAMPY_ZBROI[m].rampa, material: m,
        rampaDloni: METALE[m] ? RAMPY_ZBROI.skora.rampa : null };
    for (const m of NAGOLENNIKI) WZORY_ZBROI["nagolenniki_" + m] = { miejsce: "nogi", nakladka: "nagolenniki", rampa: RAMPY_ZBROI[m].rampa, material: m, polysk: RAMPY_ZBROI[m].polysk || 0 };
    for (const m of OKUTE) WZORY_ZBROI["buty_okute_" + m] = { miejsce: "stopy", czesc: "stopy", nakladka: "Ubior_Cholewka", rampa: RAMPY_ZBROI.skora.rampa, okucie: RAMPY_ZBROI[m].rampa, material: m };

    // the weapons: the kinds and the materials each is made in (Bron_Data.js's items; any other pair works too - Ubior_Bron.js reads
    // the key), the uniques with their own colours
    const BRON_RODZAJE = {
        sztylet: ["braz", "zelazo", "stal", "zakon"], miecz: ["braz", "zelazo", "stal", "pierwszych", "zakon"], dlugi_miecz: ["stal", "pierwszych", "zakon"],
        tasak: ["zelazo", "stal"], szabla: ["zelazo", "stal"], palka: ["drewno", "okute", "braz"], kostur: ["drewno", "zakon"], kiscien: ["zelazo", "stal"],
        buzdygan: ["braz", "zelazo", "stal", "zakon"], topor: ["braz", "zelazo", "stal", "zakon"], czekan: ["zelazo", "stal"], bardysz: ["zelazo", "stal"],
        mlot: ["kamien", "zelazo", "stal", "zakon"], wlocznia: ["kamien", "braz", "zelazo", "stal", "zakon"], rohatyna: ["zelazo", "stal"], sulica: ["zelazo", "stal"],
        siekiera: ["kamien", "zelazo", "stal"], kilof: ["kamien", "zelazo", "stal"], luk: ["krotki", "dlugi", "refleksyjny", "zakon"], proca: ["prosta", "skorzana", "rzemienna"]
    };
    const WZORY_BRONI = {};
    for (const [r, ms] of Object.entries(BRON_RODZAJE)) for (const m of ms) WZORY_BRONI["bron_" + r + "_" + m] = { miejsce: "prawa", rodzaj: r, material: m };
    Object.assign(WZORY_BRONI, {
        bron_miecz_bogumila: { miejsce: "prawa", rodzaj: "miecz", material: "zakon", metal: ["#141a26", "#222c40", "#34425e", "#4a5c80", "#687ea2", "#93a8c6", "#e2ecf6"],
            owijka: ["#6a4a14", "#9a7224", "#c89a3a", "#f0cc68"] },
        bron_kostur_przeora: { miejsce: "prawa", rodzaj: "kostur", material: "zakon", metal: ["#5a3c10", "#7a5418", "#9a6e22", "#b8892e", "#d2a444", "#e8c064", "#f6dc94"],
            owijka: ["#3a1018", "#5a1a24", "#7a2632", "#9a3442"] },
        bron_dlugi_miecz_bez_herbu: { miejsce: "prawa", rodzaj: "dlugi_miecz", material: "pierwszych" },
        bron_szabla_brzozowa: { miejsce: "prawa", rodzaj: "szabla", material: "stal", owijka: ["#3a0e10", "#5e1618", "#862024", "#ac3030"] },
        bron_sztylet_krucze_pioro: { miejsce: "prawa", rodzaj: "sztylet", material: "stal", metal: ["#08080c", "#121218", "#1c1c26", "#282a36", "#383c4c", "#4e5468", "#7a86a6"],
            owijka: ["#08080a", "#141418", "#222228", "#34343c"] },
        bron_luk_bialej_zrenicy: { miejsce: "prawa", rodzaj: "luk", material: "refleksyjny", luk: ["#5a5650", "#7e7a72", "#a29d94", "#c4c0b6", "#e0ddd4", "#f6f4ee"] }
    });
    // the shields
    const WZORY_TARCZ = {
        tarcza_drewniana: { miejsce: "lewa", plik: "Drewniana", metal: "zelazo" },
        tarcza_okuta: { miejsce: "lewa", plik: "Okuta", metal: "zelazo" },
        tarcza_umbo_braz: { miejsce: "lewa", plik: "UmboBraz", metal: "braz", farba: ["#4a1010", "#7a1c18", "#a82a22", "#cc4434"] },
        tarcza_puklerz: { miejsce: "lewa", plik: "Puklerz", metal: "zelazo" },
        tarcza_migdalowa: { miejsce: "lewa", plik: "Migdalowa", metal: "zelazo", farba: ["#14203a", "#22345a", "#34507e", "#5070a0"] },
        tarcza_zelazna: { miejsce: "lewa", plik: "Zelazna", metal: "stal" },
        tarcza_zakonna: { miejsce: "lewa", plik: "Zakonna", metal: "zakon", farba: ["#5a3c10", "#8a6420", "#b88c34", "#e0bc5c"] },
        tarcza_skrzydlata_straz: { miejsce: "lewa", plik: "SkrzydlataStraz", metal: "zakon", farba: ["#7a8090", "#a4aab8", "#ccd2dc", "#f2f4f8"] }
    };

    const DANE = { VERSION: "1.0.0", MIEJSCA, MATERIALY, WZORY, BONUSY, SCHLUDNOSC, UPAL, PRZEDMIOTY, STARE, SKLEPY, TEKSTY, FARBOWANIE, NAPRAWA, ZUZYCIE,
        przedmiot, poWzorze, wzorPrzedmiotu, notatka, opis, gdzie, wiersze, podpowiedz,
        RAMPY_ZBROI, HELMY, ZBROJE, WZORY_ZBROI, BRON_RODZAJE, WZORY_BRONI, WZORY_TARCZ };

    const T = window.Tawerna;
    if (!T || typeof T.register !== "function") { window.Ubior_Data = DANE; return; }   // (Node: the tools read the data)

    // ------------------------------------------------------------------
    // At run time: what is worn now (Equipment.js), as { miejsce: wzor } - what Ubior.js shows; and the slot of a place
    // ------------------------------------------------------------------
    function stroj() {
        const E = T.api("Equipment"), out = {};
        if (!E || !E.current || !window.$gameSystem) return out;
        for (const m of Object.keys(MIEJSCA)) {
            const id = E.current(MIEJSCA[m].eq), p = id ? przedmiot(id) : null;
            if (p && p.miejsce === m) out[m] = p.wzor;
        }
        return out;
    }
    // what is worn now: [{ id, p }] (each part once)
    function zalozone() {
        const E = T.api("Equipment"), out = [];
        if (!E || !E.current || !window.$gameSystem || !window.$dataItems) return out;
        for (const m of Object.keys(MIEJSCA)) {
            const id = E.current(MIEJSCA[m].eq), p = id ? przedmiot(id) : null;
            if (p) out.push({ id, p });
        }
        return out;
    }
    // the card's words for an empty place (Equipment.js): where such things are bought
    function gdzieMiejsce(eq) {
        const m = Object.keys(MIEJSCA).find(k => MIEJSCA[k].eq === eq);
        if (!m) return "";
        const who = [];
        for (const k of Object.keys(SKLEPY)) {
            const s = SKLEPY[k];
            if (s.sprzedaje.some(w => WZORY[w] && WZORY[w].miejsce === m && poWzorze(w) && window.$dataItems && $dataItems[poWzorze(w).id] && $dataItems[poWzorze(w).id].name))
                who.push(k === "kantor" ? "kantor" : s.kto);
        }
        return who.join(", ");
    }

    window.Ubior_Data = T.register("Ubior_Data", Object.assign(DANE, { stroj, zalozone, gdzieMiejsce }));
})();
