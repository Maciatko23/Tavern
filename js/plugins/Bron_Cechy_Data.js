//=============================================================================
// Bron_Cechy_Data.js
//=============================================================================
// The weapons' traits - the data (2026-11-17, the user's: small fixed bonuses, the better weapons more; a damage range of ±10%; the
// traits FIXED by the weapon; "udane kucie" - one trait more for a weapon the hero forges well). MADE BY tools/bron/cechy_wtyczka.py
// from tools/bron/cechy.json (tools/bron/cechy.py: the kinds' pools, the materials' levels, the strengths) - do not edit by hand:
// change cechy.py, run it, then cechy_wtyczka.py --wykonaj. Nothing here moves by itself: Bron_Cechy.js works the traits in the fight,
// Bron_Data.js puts their words on the cards.
//   CECHY    - item id -> { trait: value } for every weapon (77, 66 with traits; {} - none)
//   MOC      - a trait's value on the strength levels 1-5 (what "udane kucie" gives: the level of the weapon's material, POZIOM)
//   PULA     - the traits that fit a kind of weapon, the most fitting first (the war bow, the long bow, the order's: PULA_LUK)
//   slowo(trait, value, kind) / slowa(traits, kind) / kv(...) - the words of the cards ("ogłuszenie 12% na 1,5 s")
//   wylosuj(item, have, rng) - the trait a weapon forged well gets: one of its kind's pool it does not have (rng picks), at its
//                material's strength; none left: obrazenia +1
// Without TawernaCore (Node: the tools, the unit tests) only the data is given out: window.Bron_Cechy_Data.

/*:
 * @target MZ
 * @plugindesc Cechy broni - dane: stałe premie każdej broni (szybkość, obrażenia, ogłuszenie, krwawienie, przebicie...), ich słowa na kartach, pule cech do udanego kucia. Plik robi tools/bron/cechy_wtyczka.py. v1.0.0
 * @author Claude
 * @orderAfter TawernaCore
 * @orderAfter Bron_Data
 *
 * @help
 * ============================================================================
 * Bron_Cechy_Data.js - cechy broni: dane
 * ============================================================================
 * Sam nic nie robi. Czytają go Bron_Data.js (słowa na kartach broni, w
 * sklepach i na liście broni) i Bron_Cechy.js (działanie cech w walce, udane
 * kucie). Plik jest robiony narzędziem - zmiany w tools/bron/cechy.py, potem:
 *   python tools/bron/cechy.py
 *   python tools/bron/cechy_wtyczka.py --wykonaj
 * ============================================================================
 */

(() => {
    "use strict";

    const CECHY = {
        60: {},
        63: {},
        115: {},
        116: {},
        125: {},
        126: {},
        154: {},
        156: {},
        300: {"krytyk_mocniej": 1.7},
        301: {"krytyk_mocniej": 1.7},
        302: {"krytyk_mocniej": 1.8, "szybkosc": 0.15},
        303: {"krytyk_mocniej": 1.9, "przebicie": 0.3, "stwory": 0.15},
        304: {"parowanie": 0.1},
        305: {"parowanie": 0.12},
        306: {"krwawienie": {"szansa": 0.1, "dps": 2, "s": 4}},
        307: {"szybkosc": 0.1},
        308: {"parowanie": 0.15, "obrazenia": 3},
        309: {"zasieg": 0.2, "parowanie": 0.15},
        310: {"parowanie": 0.18, "obrazenia": 4, "postrach": 0.05},
        311: {"parowanie": 0.2, "obrazenia": 5, "stwory": 0.15},
        312: {},
        313: {"ogluszenie": {"szansa": 0.08, "s": 1.0}},
        314: {"ogluszenie": {"szansa": 0.08, "s": 1.0}},
        315: {"ogluszenie": {"szansa": 0.1, "s": 1.5}},
        316: {"ogluszenie": {"szansa": 0.08, "s": 1.0}},
        317: {"ogluszenie": {"szansa": 0.1, "s": 1.5}},
        318: {"ogluszenie": {"szansa": 0.12, "s": 1.5}, "obrazenia": 3},
        319: {"ogluszenie": {"szansa": 0.15, "s": 2.0}, "obrazenia": 5, "stwory": 0.15},
        320: {"krwawienie": {"szansa": 0.08, "dps": 1, "s": 4}},
        321: {"krwawienie": {"szansa": 0.1, "dps": 2, "s": 4}},
        322: {"przebicie": 0.15},
        323: {"krwawienie": {"szansa": 0.12, "dps": 2, "s": 4}, "obrazenia": 3},
        324: {"zasieg": 0.2, "krwawienie": {"szansa": 0.12, "dps": 2, "s": 4}},
        325: {"krwawienie": {"szansa": 0.15, "dps": 3, "s": 4}, "obrazenia": 5, "stwory": 0.15},
        326: {},
        327: {"ogluszenie": {"szansa": 0.1, "s": 1.5}},
        328: {"ogluszenie": {"szansa": 0.12, "s": 1.5}, "odrzut": 1},
        329: {"ogluszenie": {"szansa": 0.15, "s": 2.0}, "odrzut": 1, "stwory": 0.15},
        330: {"zasieg": 0.1},
        331: {"zasieg": 0.15},
        332: {"zasieg": 0.15},
        333: {"zasieg": 0.2, "przebicie": 0.2},
        334: {"zasieg": 0.25, "przebicie": 0.3, "stwory": 0.15},
        335: {"przebijajaca_strzala": 2},
        336: {"szybkosc": 0.15, "obrazenia": 3},
        337: {"przebijajaca_strzala": 2, "szybkosc": 0.2, "stwory": 0.15},
        338: {"ogluszajacy_kamien": {"szansa": 0.1, "s": 1.0}},
        339: {"ogluszajacy_kamien": {"szansa": 0.12, "s": 1.0}},
        396: {"parowanie": 0.2, "obrazenia": 5, "krew_za_krew": 0.02, "stwory": 0.15},
        398: {"odrzut": 1, "ogluszenie": {"szansa": 0.15, "s": 2.0}, "krew_za_krew": 0.02},
        399: {"zasieg": 0.25, "parowanie": 0.2, "postrach": 0.05, "krew_za_krew": 0.02},
        402: {"szybkosc": 0.2, "krwawienie": {"szansa": 0.15, "dps": 3, "s": 4}, "oddech": 2},
        403: {"krytyk_mocniej": 1.9, "szybkosc": 0.2, "postrach": 0.05},
        406: {"szybkosc": 0.2, "przebijajaca_strzala": 2, "obrazenia": 5},
        407: {"trwalosc": 0.25},
        408: {"trwalosc": 0.25},
        452: {},
        453: {"odrzut": 1},
        454: {"ogluszenie": {"szansa": 0.08, "s": 1.0}},
        455: {"krwawienie": {"szansa": 0.08, "dps": 1, "s": 4}},
        456: {"ogluszenie": {"szansa": 0.08, "s": 1.0}},
        457: {"ogluszenie": {"szansa": 0.1, "s": 1.5}},
        458: {"zasieg": 0.15},
        459: {"zasieg": 0.15},
        460: {"zasieg": 0.15},
        461: {"zasieg": 0.2, "przebicie": 0.2},
        462: {"krwawienie": {"szansa": 0.12, "dps": 2, "s": 4}, "obrazenia": 3},
        463: {"szybkosc": 0.15, "krwawienie": {"szansa": 0.12, "dps": 2, "s": 4}},
        464: {"ogluszenie": {"szansa": 0.12, "s": 1.5}, "przebicie": 0.2},
        465: {"przebicie": 0.2, "ogluszenie": {"szansa": 0.12, "s": 1.5}},
        466: {"zasieg": 0.2, "obrazenia": 3},
        467: {"krwawienie": {"szansa": 0.15, "dps": 3, "s": 4}, "obrazenia": 5, "stwory": 0.15},
        468: {"przebicie": 0.3, "ogluszenie": {"szansa": 0.15, "s": 2.0}, "stwory": 0.15},
        469: {"zasieg": 0.25, "parowanie": 0.2, "stwory": 0.15},
        470: {"zasieg": 0.25, "krwawienie": {"szansa": 0.15, "dps": 3, "s": 4}, "stwory": 0.15},
        471: {"szybkosc": 0.08},
        472: {"przebijajaca_strzala": 2, "szybkosc": 0.15}
    };
    // the strength level of a material (0: no traits of its own; "udane kucie" gives level 1 at least)
    const POZIOM = {"drewno": 0, "kamien": 0, "okute": 1, "braz": 1, "zelazo": 2, "stal": 3, "pierwszych": 4, "zakon": 5, "krotki": 0, "prosta": 0, "mysliwski": 1, "skorzana": 1, "rzemienna": 2, "dlugi": 2, "refleksyjny": 3, "wojenny": 3};
    const MOC = {
        szybkosc: [0.08, 0.1, 0.15, 0.18, 0.2],
        obrazenia: [1, 2, 3, 4, 5],
        ogluszenie: [{"szansa": 0.08, "s": 1.0}, {"szansa": 0.1, "s": 1.5}, {"szansa": 0.12, "s": 1.5}, {"szansa": 0.14, "s": 2.0}, {"szansa": 0.15, "s": 2.0}],
        krwawienie: [{"szansa": 0.08, "dps": 1, "s": 4}, {"szansa": 0.1, "dps": 2, "s": 4}, {"szansa": 0.12, "dps": 2, "s": 4}, {"szansa": 0.14, "dps": 3, "s": 4}, {"szansa": 0.15, "dps": 3, "s": 4}],
        przebicie: [0.1, 0.15, 0.2, 0.25, 0.3],
        odrzut: [1, 1, 1, 1, 1],
        zasieg: [0.1, 0.15, 0.2, 0.2, 0.25],
        oddech: [1, 1, 1, 2, 2],
        parowanie: [0.1, 0.12, 0.15, 0.18, 0.2],
        krytyk_mocniej: [1.7, 1.7, 1.8, 1.85, 1.9],
        trwalosc: [0.15, 0.2, 0.25, 0.3, 0.35],
        stwory: [0.15, 0.15, 0.15, 0.15, 0.15],
        krew_za_krew: [0.02, 0.02, 0.02, 0.02, 0.02],
        postrach: [0.05, 0.05, 0.05, 0.05, 0.05],
        przebijajaca_strzala: [2, 2, 2, 2, 2],
        ogluszajacy_kamien: [{"szansa": 0.1, "s": 1.0}, {"szansa": 0.12, "s": 1.0}, {"szansa": 0.15, "s": 1.5}, {"szansa": 0.15, "s": 1.5}, {"szansa": 0.15, "s": 1.5}]
    };
    const PULA = {
        sztylet: ["krytyk_mocniej", "szybkosc", "przebicie", "oddech"],
        miecz: ["parowanie", "obrazenia", "oddech", "trwalosc"],
        dlugi_miecz: ["zasieg", "parowanie", "obrazenia"],
        szabla: ["szybkosc", "krwawienie", "oddech"],
        tasak: ["krwawienie", "obrazenia", "szybkosc"],
        palka: ["ogluszenie", "odrzut", "obrazenia"],
        kostur: ["odrzut", "zasieg", "ogluszenie"],
        kiscien: ["ogluszenie", "przebicie", "obrazenia"],
        buzdygan: ["ogluszenie", "obrazenia", "przebicie"],
        mlot: ["ogluszenie", "odrzut", "przebicie"],
        topor: ["krwawienie", "obrazenia", "trwalosc"],
        czekan: ["przebicie", "ogluszenie", "obrazenia"],
        bardysz: ["zasieg", "krwawienie", "obrazenia"],
        wlocznia: ["zasieg", "przebicie", "szybkosc"],
        rohatyna: ["zasieg", "obrazenia", "trwalosc"],
        sulica: ["zasieg", "przebicie", "szybkosc"],
        luk: ["szybkosc", "obrazenia", "przebijajaca_strzala"],
        proca: ["ogluszajacy_kamien", "obrazenia"],
        siekiera: ["trwalosc"],
        kilof: ["trwalosc"]
    };
    const PULA_LUK = ["przebijajaca_strzala", "szybkosc", "obrazenia"];
    const LUK_PRZEBIJA = { wojenny: true, dlugi: true, zakon: true };
    const ZNANE = ["szybkosc", "obrazenia", "ogluszenie", "krwawienie", "przebicie", "odrzut", "zasieg", "oddech", "parowanie", "krytyk_mocniej", "trwalosc", "stwory", "krew_za_krew", "postrach", "przebijajaca_strzala", "ogluszajacy_kamien"];

    // ------------------------------------------------------------------
    // The words (the cards in Ekwipunek, the shops' windows, the weapons' list)
    // ------------------------------------------------------------------
    const pct = v => Math.round(v * 100) + "%";
    const num = v => String(Math.round(v * 100) / 100).replace(".", ",");
    const pola = n => (n === 1 ? "pole" : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? "pola" : "pól");
    const LUKI = { luk: true };
    // each: [the line on a card, [the row's label, its value]]; kind: the weapon's kind (a bow's speed is its aim's)
    const SLOWA = {
        szybkosc: (v, kind) => [(LUKI[kind] ? "szybkość celowania +" : "szybkość ataku +") + pct(v), [LUKI[kind] ? "Celowanie" : "Szybkość ataku", "+" + pct(v)]],
        obrazenia: v => ["obrażenia +" + v, ["Obrażenia", "+" + v]],
        ogluszenie: v => ["ogłuszenie " + pct(v.szansa) + " na " + num(v.s) + " s", ["Ogłuszenie", pct(v.szansa) + " · " + num(v.s) + " s"]],
        krwawienie: v => ["krwawienie " + pct(v.szansa) + ": " + v.dps + " na sekundę przez " + num(v.s) + " s", ["Krwawienie", pct(v.szansa) + " · " + v.dps + "/s · " + num(v.s) + " s"]],
        przebicie: v => ["przebicie pancerza " + pct(v), ["Przebicie pancerza", pct(v)]],
        odrzut: v => ["odrzut +" + v + " " + pola(v), ["Odrzut", "+" + v + " " + pola(v)]],
        zasieg: v => ["zasięg +" + num(v), ["Zasięg", "+" + num(v)]],
        oddech: v => ["oddech -" + v + " na cios", ["Oddech", "-" + v + " na cios"]],
        parowanie: v => ["parowanie +" + pct(v), ["Parowanie", "+" + pct(v)]],
        krytyk_mocniej: v => ["krytyk ×" + num(v), ["Krytyk", "×" + num(v)]],
        trwalosc: v => ["wytrzymałość +" + pct(v), ["Wytrzymałość", "+" + pct(v)]],
        stwory: v => ["na stwory podziemi +" + pct(v), ["Na stwory podziemi", "+" + pct(v)]],
        krew_za_krew: v => ["krew za krew: " + pct(v) + " życia za trafienie", ["Krew za krew", pct(v) + " życia"]],
        postrach: v => ["postrach " + pct(v), ["Postrach", pct(v)]],
        przebijajaca_strzala: v => ["strzała przebija " + v + " wrogów", ["Strzała przebija", v + " wrogów"]],
        ogluszajacy_kamien: v => ["ogłuszający kamień " + pct(v.szansa) + " na " + num(v.s) + " s", ["Ogłuszający kamień", pct(v.szansa) + " · " + num(v.s) + " s"]]
    };
    const slowo = (c, v, kind) => (SLOWA[c] ? SLOWA[c](v, kind)[0] : "");
    const kv = (c, v, kind) => (SLOWA[c] ? SLOWA[c](v, kind)[1] : null);
    // the lines of a set of traits, in ZNANE's order
    function slowa(cechy, kind) {
        const out = [];
        if (!cechy) return out;
        for (const c of ZNANE) if (cechy[c] !== undefined) out.push(slowo(c, cechy[c], kind));
        return out;
    }
    const of = id => CECHY[Number(id)] || null;

    // ------------------------------------------------------------------
    // "Udane kucie": the trait a weapon forged well gets. p: the weapon (Bron_Data.przedmiot: rodzaj, material); have: the traits it has
    // (its own); rng: () => 0..1. -> { c: trait, v: value, plus: true when it adds to a trait it has (obrazenia +1) }
    // ------------------------------------------------------------------
    const poziomOf = p => Math.max(1, Math.min(5, POZIOM[p.material] !== undefined ? POZIOM[p.material] : 2));
    const mocy = (c, L) => (MOC[c] ? MOC[c][Math.max(1, Math.min(5, L)) - 1] : null);
    const pulaOf = p => (p.rodzaj === "luk" && LUK_PRZEBIJA[p.material] ? PULA_LUK : PULA[p.rodzaj] || []);
    function wylosuj(p, have, rng) {
        if (!p) return null;
        const h = have || of(p.id) || {}, left = pulaOf(p).filter(c => h[c] === undefined);
        if (!left.length) return { c: "obrazenia", v: 1, plus: true };
        const r = typeof rng === "function" ? rng() : Math.random(), c = left[Math.min(left.length - 1, Math.floor(r * left.length))];
        const v = mocy(c, poziomOf(p));
        return { c, v: v && typeof v === "object" ? Object.assign({}, v) : v, plus: false };
    }

    const DANE = { VERSION: "1.0.0", CECHY, POZIOM, MOC, PULA, PULA_LUK, ZNANE, of, slowo, slowa, kv, mocy, poziomOf, pulaOf, wylosuj };

    const T = window.Tawerna;
    if (!T || typeof T.register !== "function") { window.Bron_Cechy_Data = DANE; return; }   // (Node: the tools and the unit tests)
    window.Bron_Cechy_Data = T.register("Bron_Cechy_Data", DANE);
})();
