# Cechy broni (2026-11-17, gracz: "broniom małe bonusy, szczególnie tym lepszym"; odpowiedzi: zakres obrażeń ±10% - tak, cechy STAŁE dla
# każdej broni, "udane kucie" - tak, wszystkie cechy z listy). Zasada: RODZAJ broni wybiera, jakie cechy do niej pasują (kolejność = ważność),
# MATERIAŁ - ile ich jest i jak są mocne; unikaty mają swoje, dobrane ręcznie. Wynik: tools/bron/cechy.json (id -> {cecha: wartość}),
# z niego js/plugins/Bron_Cechy_Data.js (wtyczka z danymi; mechanika: Bron_Cechy.js).
#   python tools/bron/cechy.py            zapisuje tools/bron/cechy.json i wypisuje tabelę
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.normpath(os.path.join(HERE, "..", ".."))
SRC = sys.argv[1] if len(sys.argv) > 1 else None   # (bronie.json: the dump of Bron_Data - id, rodzaj, material, unikat)

# the strength level of a material (0 = no traits)
POZIOM = {"drewno": 0, "kamien": 0, "okute": 1, "braz": 1, "zelazo": 2, "stal": 3, "pierwszych": 4, "zakon": 5,
          # bows and slings by their make
          "krotki": 0, "prosta": 0, "mysliwski": 1, "skorzana": 1, "rzemienna": 2, "dlugi": 2, "refleksyjny": 3, "wojenny": 3}
# how many traits by that level (1 okute/braz/zelazo, 2 stal, 3 = 2 + a special one: Pierwszych - fear, the Order - the creatures of the depths)
ILE = {0: 0, 1: 1, 2: 1, 3: 2, 4: 3, 5: 3}
SPECIAL = {4: "postrach", 5: "stwory"}

# the strengths by level 1..5
def mocy(c, L):
    i = max(1, min(5, L)) - 1
    return {
        "szybkosc": [0.08, 0.10, 0.15, 0.18, 0.20][i],                 # attack speed + (bows: aiming)
        "obrazenia": [1, 2, 3, 4, 5][i],                                # flat damage +
        "ogluszenie": {"szansa": [0.08, 0.10, 0.12, 0.14, 0.15][i], "s": [1.0, 1.5, 1.5, 2.0, 2.0][i]},
        "krwawienie": {"szansa": [0.08, 0.10, 0.12, 0.14, 0.15][i], "dps": [1, 2, 2, 3, 3][i], "s": 4},
        "przebicie": [0.10, 0.15, 0.20, 0.25, 0.30][i],               # the part of armour ignored
        "odrzut": 1,                                                    # + tiles of knock back
        "zasieg": [0.10, 0.15, 0.20, 0.20, 0.25][i],
        "oddech": [1, 1, 1, 2, 2][i],                                   # - breath a blow
        "parowanie": [0.10, 0.12, 0.15, 0.18, 0.20][i],               # the parry window +
        "krytyk_mocniej": [1.7, 1.7, 1.8, 1.85, 1.9][i],               # a crit's multiplier (instead of 1.6)
        "trwalosc": [0.15, 0.20, 0.25, 0.30, 0.35][i],                 # durability +
        "stwory": 0.15,                                                 # + vs the creatures of the depths
        "krew_za_krew": 0.02,                                           # a part of the max life back a hit
        "postrach": 0.05,                                               # a man may flee at a hit
        "przebijajaca_strzala": 2,                                      # an arrow hits this many in a line
        "ogluszajacy_kamien": {"szansa": [0.10, 0.12, 0.15, 0.15, 0.15][i], "s": [1.0, 1.0, 1.5, 1.5, 1.5][i]},
    }[c]

# the traits that fit a kind, the most fitting first
PULA = {
    "sztylet": ["krytyk_mocniej", "szybkosc", "przebicie", "oddech"],
    "miecz": ["parowanie", "obrazenia", "oddech", "trwalosc"],
    "dlugi_miecz": ["zasieg", "parowanie", "obrazenia"],
    "szabla": ["szybkosc", "krwawienie", "oddech"],
    "tasak": ["krwawienie", "obrazenia", "szybkosc"],
    "palka": ["ogluszenie", "odrzut", "obrazenia"],
    "kostur": ["odrzut", "zasieg", "ogluszenie"],
    "kiscien": ["ogluszenie", "przebicie", "obrazenia"],
    "buzdygan": ["ogluszenie", "obrazenia", "przebicie"],
    "mlot": ["ogluszenie", "odrzut", "przebicie"],
    "topor": ["krwawienie", "obrazenia", "trwalosc"],
    "czekan": ["przebicie", "ogluszenie", "obrazenia"],
    "bardysz": ["zasieg", "krwawienie", "obrazenia"],
    "wlocznia": ["zasieg", "przebicie", "szybkosc"],
    "rohatyna": ["zasieg", "obrazenia", "trwalosc"],
    "sulica": ["zasieg", "przebicie", "szybkosc"],
    "luk": ["szybkosc", "obrazenia", "przebijajaca_strzala"],
    "proca": ["ogluszajacy_kamien", "obrazenia"],
    "siekiera": ["trwalosc"],
    "kilof": ["trwalosc"],
}
# bows that shoot through: the war and the long bow lead with it
PULA_LUK_PRZEBIJA = ["przebijajaca_strzala", "szybkosc", "obrazenia"]

# the uniques, by hand: [(trait, level or value)]
UNIKATY = {
    403: [("krytyk_mocniej", 5), ("szybkosc", 5), ("postrach", 5)],                          # Krucze pióro
    396: [("parowanie", 5), ("obrazenia", 5), ("krew_za_krew", 5), ("stwory", 5)],          # Miecz Bogumiła
    402: [("szybkosc", 5), ("krwawienie", 5), ("oddech", 5)],                                # Szabla spod Brzozowej Woli
    399: [("zasieg", 5), ("parowanie", 5), ("postrach", 5), ("krew_za_krew", 5)],           # Długi miecz bez herbu
    398: [("odrzut", 5), ("ogluszenie", 5), ("krew_za_krew", 5)],                            # Kostur przeora
    406: [("szybkosc", 5), ("przebijajaca_strzala", 5), ("obrazenia", 5)],                  # Łuk Białej Źrenicy
    # (not a unique, set by hand all the same: the misericorde is THE armour-piercing dagger)
    303: [("krytyk_mocniej", 5), ("przebicie", 5), ("stwory", 5)],                          # Mizerykordia zakonna
}


def cechy(b):
    if b["id"] in UNIKATY:
        return {c: mocy(c, L) for c, L in UNIKATY[b["id"]]}
    L = POZIOM.get(b["material"], 2 if b["material"] not in POZIOM else 0)
    n = ILE.get(L, 0)
    if not n:
        return {}
    pula = PULA.get(b["rodzaj"], [])
    if b["rodzaj"] == "luk" and b["material"] in ("wojenny", "dlugi", "zakon"):
        pula = PULA_LUK_PRZEBIJA
    if b["rodzaj"] in ("siekiera", "kilof"):
        n = 1 if L >= 3 else 0
    wybor = pula[: min(n if L < 4 else 2, len(pula))]
    out = {c: mocy(c, L) for c in wybor}
    if L in SPECIAL and b["rodzaj"] not in ("siekiera", "kilof"):
        s = SPECIAL[L]
        out[s] = mocy(s, L)
    return out


def main():
    src = SRC or os.path.join(HERE, "bronie_dump.json")
    d = json.load(open(src, encoding="utf-8"))
    res = {}
    for b in d["bronie"]:
        res[str(b["id"])] = cechy(b)
    open(os.path.join(HERE, "cechy.json"), "w", encoding="utf-8", newline="\n").write(json.dumps(res, ensure_ascii=False, indent=1) + "\n")
    n = sum(1 for v in res.values() if v)
    print("cechy.json: %d broni, %d z cechami" % (len(res), n))
    for b in d["bronie"]:
        c = res[str(b["id"])]
        print("%3d %-28s %-11s %s" % (b["id"], b["nazwa"][:28], b["material"], ", ".join("%s=%s" % kv for kv in c.items()) or "-"))


if __name__ == "__main__":
    main()
