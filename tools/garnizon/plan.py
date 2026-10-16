# python tools/garnizon/plan.py   -> docs/miejsca_wyspy/garnizon_plan.png
# The built map (tools/miejsca_wyspy/staging_D/data/Map162.json) drawn with numbers and a legend, like the concept's sketch
# (rzut_garnizon.png; the drawing code: tools/miejsca_wyspy/szkic_lib.py draw_doc - only read, never changed).
import os, sys, json, types
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/miejsca_wyspy")
import szkic_lib as L          # noqa: E402

m = json.load(open(ROOT + "tools/miejsca_wyspy/staging_D/data/Map162.json", encoding="utf-8"))
mp = types.SimpleNamespace(crows=[], outlines=[], dashes=[], arrows=[], labels=[])
lab = lambda *a: mp.labels.append(a)
lab(1, 22, 3, "Droga z przystani", "Map125 dolna krawędź 21-23 <-> tu 21-23,0")
lab(2, 29, 6, "Stół werbownika", "werbownik 8-16; dzień po fali na rynku")
lab(3, 36, 10, "Brama garnizonu", "wartownicy, koksownik; nocą wartownik na drodze")
lab(4, 28, 13, "Koszary", "„Wstęp tylko dla wojska”")
lab(5, 42, 13, "Kwatera rotmistrza", "drzwi 7-20 -> Map163 (kancelaria)")
lab(6, 45, 23, "Spichlerz z rekwizycji", "kłódka; D27: nocą obok wartownika")
lab(7, 29, 23, "Plac ćwiczeń", "manekiny, tarcze, musztra 6-7 i 8-12")
lab(8, 32, 31, "Namioty", "kwatermistrz Kłos: skup przy stole (33,29)")
lab(9, 39, 28, "Kuchnia polowa", "kocioł na ogniu, wieczorem żołnierze")
lab(10, 46, 18, "Dyby", "noc w dybach dla złapanego złodzieja")
lab(11, 49, 14, "Wieża strażnicza", "widok na zatokę i wrak")
lab(12, 9, 26, "Pomost i łódź ratownicza", "żołnierze 9-15 przy wraku")
lab(13, 5, 21, "Łacha", "tylko w odpływie: piasek, przejście do wraku")
lab(14, 2, 15, "Wrak w oddali", "ten sam co z przystani")
lab(15, 50, 30, "Beczki z wodą z promu", "pod strażą: „Woda dla wojska. Odejdź.”")
lab(16, 34, 15, "Kuźnia garnizonu", "strzały i stal od przychylności 60")
mp.arrows.append((22, 0, 8, "przystań"))
mp.arrows.append((0, 21, 4, "wrak (odpływ)"))
mp.outlines.append((0, 20, 11, 21, "rect", "łacha (odpływ)", (150, 210, 255)))
L.draw_doc(mp, m, ROOT + "docs/miejsca_wyspy/garnizon_plan.png", "Garnizon nad zatoką",
           "Map162 · 56 × 40 · tileset 11 · zbudowana\nwnętrze: Map163 Kwatera rotmistrza",
           legend_extra=[("palisada z pali: tools/garnizon/art", L.MUTED), ("chorągwie z feniksem: !Flags_banner", L.MUTED)])
print("docs/miejsca_wyspy/garnizon_plan.png")
