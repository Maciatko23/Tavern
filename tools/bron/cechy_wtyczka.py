# Cechy broni -> wtyczka z danymi (2026-11-17): z tools/bron/cechy.json (id -> {cecha: wartość}, robi go cechy.py) i z tablic cechy.py
# (POZIOM materiałów, PULA rodzajów, moce cech na poziomach 1-5 - dla „udanego kucia”) pisze js/plugins/Bron_Cechy_Data.js.
# Mechanika cech: js/plugins/Bron_Cechy.js (ręcznie pisana). Kolejność: python tools/bron/cechy.py, potem ten skrypt.
#   python tools/bron/cechy_wtyczka.py             podgląd (co by zapisał)
#   python tools/bron/cechy_wtyczka.py --wykonaj   zapisuje js/plugins/Bron_Cechy_Data.js (końce linii LF)
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", ".."))
OUT = os.path.join(GAME, "js", "plugins", "Bron_Cechy_Data.js")
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True   # (no __pycache__ next to the tools)
_argv, sys.argv = sys.argv, sys.argv[:1]   # (cechy.py reads its argv at the import)
import cechy as C   # noqa: E402
sys.argv = _argv

# the traits in the order the cards list them (the same as cechy.py's mocy)
ZNANE = ["szybkosc", "obrazenia", "ogluszenie", "krwawienie", "przebicie", "odrzut", "zasieg", "oddech", "parowanie", "krytyk_mocniej",
         "trwalosc", "stwory", "krew_za_krew", "postrach", "przebijajaca_strzala", "ogluszajacy_kamien"]


def js(v):
    return json.dumps(v, ensure_ascii=False, separators=(", ", ": "))


def main():
    dane = json.load(open(os.path.join(HERE, "cechy.json"), encoding="utf-8"))
    nieznane = sorted({c for v in dane.values() for c in v if c not in ZNANE})
    if nieznane:
        sys.exit("cechy.json: nieznane cechy " + ", ".join(nieznane) + " (dopisz je do ZNANE i do słów w szablonie)")
    for c in ZNANE:
        C.mocy(c, 1)   # (every trait has its strengths in cechy.py)
    moc = {c: [C.mocy(c, L) for L in range(1, 6)] for c in ZNANE}
    wiersze = []
    for k in sorted(dane, key=lambda x: int(x)):
        wiersze.append("        " + js(int(k)) + ": " + js(dane[k]))
    cechy_txt = "{\n" + ",\n".join(wiersze) + "\n    }"
    moc_txt = "{\n" + ",\n".join("        " + c + ": " + js(moc[c]) for c in ZNANE) + "\n    }"
    pula_txt = "{\n" + ",\n".join("        " + k + ": " + js(v) for k, v in C.PULA.items()) + "\n    }"
    tekst = SZABLON.replace("@@CECHY@@", cechy_txt).replace("@@MOC@@", moc_txt).replace("@@PULA@@", pula_txt) \
        .replace("@@PULA_LUK@@", js(C.PULA_LUK_PRZEBIJA)).replace("@@POZIOM@@", js(C.POZIOM)).replace("@@ZNANE@@", js(ZNANE)) \
        .replace("@@ILE@@", str(len(dane))).replace("@@Z_CECHAMI@@", str(sum(1 for v in dane.values() if v)))
    if "@@" in tekst:
        sys.exit("szablon: zostało @@")
    if "--wykonaj" not in sys.argv:
        print(tekst[:1500] + "\n...\n(podgląd; zapis: --wykonaj)")
        return
    data = tekst.encode("utf-8")
    with open(OUT, "wb") as fh:
        fh.write(data)
    print("zapisane: " + os.path.relpath(OUT, GAME) + " (" + str(len(dane)) + " broni, " + str(len(data)) + " bajtów)")


SZABLON = r"""//=============================================================================
// Bron_Cechy_Data.js
//=============================================================================
// The weapons' traits - the data (2026-11-17, the user's: small fixed bonuses, the better weapons more; a damage range of ±10%; the
// traits FIXED by the weapon; "udane kucie" - one trait more for a weapon the hero forges well). MADE BY tools/bron/cechy_wtyczka.py
// from tools/bron/cechy.json (tools/bron/cechy.py: the kinds' pools, the materials' levels, the strengths) - do not edit by hand:
// change cechy.py, run it, then cechy_wtyczka.py --wykonaj. Nothing here moves by itself: Bron_Cechy.js works the traits in the fight,
// Bron_Data.js puts their words on the cards.
//   CECHY    - item id -> { trait: value } for every weapon (@@ILE@@, @@Z_CECHAMI@@ with traits; {} - none)
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

    const CECHY = @@CECHY@@;
    // the strength level of a material (0: no traits of its own; "udane kucie" gives level 1 at least)
    const POZIOM = @@POZIOM@@;
    const MOC = @@MOC@@;
    const PULA = @@PULA@@;
    const PULA_LUK = @@PULA_LUK@@;
    const LUK_PRZEBIJA = { wojenny: true, dlugi: true, zakon: true };
    const ZNANE = @@ZNANE@@;

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
"""

if __name__ == "__main__":
    main()
