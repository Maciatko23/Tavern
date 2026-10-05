# python tools/podgrodzie/make_docs.py  -> docs/podgrodzie/MIEJSCA.md
# The list of Podgrodzie's places for TownLife (the "Miejsce: <key>" events of Map111 and of the six interiors), the doors and
# the gate, written from the staged maps' records (tools/podgrodzie/staging/Map111..117_meta.json) - run after the builders.
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import plib

DIRS = {2: "w dół", 4: "w lewo", 6: "w prawo", 8: "w górę"}
WHAT = {
    "brama_zach": "tuż za bramą zachodnią, po stronie Podgrodzia",
    "zebrak": "gdzie siedzi żebrak za dnia - pod basztą przy bramie",
    "zebrak_noc": "gdzie żebrak śpi - na posłaniu pod daszkiem przy murze (na północ od bramy)",
    "namioty": "przy ognisku uchodźców (kąt pod murem: namioty, daszki, posłania)",
    "uchodzcy_drzwi": "przed drzwiami Domu uchodźców",
    "kram": "przed straganem Józka (płócienny daszek, stół, starzyzna)",
    "szmaciarz_drzwi": "przed drzwiami Kramu starzyzny",
    "plac": "środek placu (błotnisty plac przy suchej studni)",
    "studnia_sucha": "przy suchej studni na placu",
    "zabawa": "gdzie bawią się dzieci (zachodnia część placu)",
    "drwal_drzwi": "przed drzwiami Chaty drwala",
    "drewutnia": "przy pieńku z siekierą (podwórko drwala, polana i drewno)",
    "skraj_lasu": "koniec ścieżki na zachodniej krawędzi mapy - tu kłusownik znika w lesie",
    "klusownik_drzwi": "przed drzwiami Chaty kłusownika",
    "znachorka_drzwi": "przed drzwiami Izby znachorki",
    "ziola": "przy furtce ogródka ziół znachorki (suchy zagonek, rama do suszenia)",
    "kapliczka": "przed przydrożnym krzyżem (pod uschniętym drzewem)",
    "praczka_drzwi": "przed drzwiami Chaty praczki",
    "pranie": "pod sznurami z praniem przed chatą praczki",
}

def load(p):
    with open(p, "rb") as f: return json.loads(f.read().decode("utf-8"))

def main():
    meta = load(os.path.join(plib.STAGING, "Map111_meta.json"))
    inner = {mid: load(os.path.join(plib.STAGING, "Map%03d_meta.json" % mid)) for mid in range(112, 118)}
    L = []
    L.append("# Podgrodzie - miejsca, drzwi, brama")
    L.append("")
    L.append("Podgrodzie (mapa 111, %dx%d, tileset 11 „Miasteczko”) to biedna dzielnica za zachodnim murem miasta. Wejście: brama "
             "zachodnia na mapie 8 „Okolice Tawerny” przy kuźni (pola 0-1, rzędy 50-51; wyjścia na x 0) <-> wschodnia krawędź "
             "Podgrodzia (pola 44-45, rzędy 17-18; wyjścia na x 45). Wychodząc z miasta staje się na (44, 17/18) twarzą w lewo, "
             "wracając - na mapie 8 na (1, 50/51) twarzą w prawo." % tuple(meta["size"]))
    L.append("")
    L.append("Woda: Podgrodzie nie ma własnej wody - studnia na placu jest wyschnięta, wodę nosi się z miasta (w mieście i w tawernie "
             "woda jest).")
    L.append("")
    L.append("Miejsca to niewidoczne zdarzenia o nazwie `Miejsce: <klucz>` (pod postacią, przenikalne, bez komend; kierunek obrazka "
             "strony = kierunek, w który patrzy mieszkaniec). TownLife.js czyta je sam (`spotsFrom`), więc przesunięcie zdarzenia w "
             "edytorze przesuwa miejsce. Uwaga: TownLife.spotsFrom (v1.1.0) bierze kierunek z obrazka tylko wtedy, gdy strona ma "
             "grafikę - dla miejsc na dworze (bez grafiki) kierunek bierze z SPOTS_BY_MAP[111] (domyślnie w dół); kolumna „patrzy” "
             "niżej to kierunek zamierzony (zapisany w obrazku strony). We wnętrzach (eventSpot) kierunek z obrazka działa zawsze.")
    L.append("")
    L.append("## Miejsca na mapie 111 (Podgrodzie)")
    L.append("")
    L.append("| klucz | x | y | patrzy | co to za miejsce |")
    L.append("|---|---|---|---|---|")
    for k, (x, y, d) in meta["spots"].items():
        L.append("| `%s` | %d | %d | %s | %s |" % (k, x, y, DIRS.get(d, d), WHAT.get(k, "")))
    L.append("")
    L.append("## Domy z wnętrzami (drzwi na mapie 111)")
    L.append("")
    L.append("| klucz | zdarzenie drzwi | id | drzwi (x,y) | przed drzwiami | wnętrze | lądowanie we wnętrzu | otwarte |")
    L.append("|---|---|---|---|---|---|---|---|")
    for b in meta["buildings"]:
        if not b["interior"]: continue
        im = next(m for m in inner.values() if any(ex["door"] == b["event_id"] for ex in m["exits"]))
        ex = next(ex for ex in im["exits"] if ex["door"] == b["event_id"])
        hours = "%d:00-%d:00 (noc: „Zamknięte.”)" % tuple(b["hours"]) if b["hours"] else "zawsze"
        L.append("| `%s` | Drzwi: %s | %d | %d,%d | %d,%d | %d „%s” | %d,%d | %s |" % (b["key"], b["name"], b["event_id"], b["door"][0], b["door"][1],
                 b["front"][0], b["front"][1], im["id"], im["display"], ex["landing"][0], ex["landing"][1], hours))
    L.append("")
    L.append("Godziny jak przy domach miasta (tools/interiors/install.py: 6-21). Dom uchodźców jest otwarty o każdej porze - "
             "ludzie z promu nie mają dokąd pójść, drzwi tylko się przymyka.")
    L.append("")
    L.append("## Miejsca we wnętrzach (gdzie mieszkaniec stoi w domu)")
    L.append("")
    L.append("| mapa | wnętrze | klucz | x | y | patrzy |")
    L.append("|---|---|---|---|---|---|")
    for mid, im in sorted(inner.items()):
        for r in im["residents"]:
            L.append("| %d | %s | `%s_wnetrze` | %d | %d | %s |" % (mid, im["display"], r["key"], r["x"], r["y"], DIRS.get(r["dir"], r["dir"])))
    L.append("")
    L.append("## Domy bez wnętrz")
    L.append("")
    for b in meta["buildings"]:
        if b["interior"]: continue
        L.append("- %s - drzwi %d,%d (zamknięte: dymek nad bohaterem)" % (b["name"], b["door"][0], b["door"][1]))
    L.append("")
    L.append("## Światła nocą (tylko płomień)")
    L.append("")
    for l in meta["lights"]:
        L.append("- %s - %d,%d `%s`" % (l["name"], l["x"], l["y"], l["note"]))
    L.append("")
    L.append("## Jak przebudować")
    L.append("")
    L.append("```")
    L.append("python tools/town/west_gate.py            (raz: brama zachodnia na mapie 8; odmawia, gdy już otwarta)")
    L.append("python tools/podgrodzie/build_podgrodzie.py   -> staging/Map111.json")
    L.append("python tools/podgrodzie/check_podgrodzie.py   (przejścia, woda, drzwi, miejsca, kieszenie)")
    L.append("python tools/podgrodzie/build_wnetrza.py      -> staging/Map112..117.json")
    L.append("python tools/podgrodzie/check_wnetrza.py --png")
    L.append("python tools/podgrodzie/install.py            (edytor RPG Maker MZ ZAMKNIĘTY; kopie w backup_art_2026-10-05/podgrodzie/)")
    L.append("python tools/podgrodzie/render_podgrodzie.py --brama ; python tools/podgrodzie/make_docs.py")
    L.append("CDP_PORT=9461 node tests/podgrodzie_test.js")
    L.append("```")
    L.append("")
    out = plib.DOCS + "MIEJSCA.md"
    with open(out, "wb") as f: f.write("\n".join(L).encode("utf-8"))
    print("wrote", out)

if __name__ == "__main__":
    main()
