# python tools/miejsca_wyspy/wejscia.py -> docs/miejsca_wyspy/wejscia.png
# Wycinki ISTNIEJĄCYCH map (czytanych z data/, nic tam nie jest pisane) z polami, na których stanęłyby nowe przejścia:
# przystań (Map125) - górna i dolna krawędź, góry (Map013) - prawa krawędź (opcja), piętro 30 (Map147) - Zasuwa główna.
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from PIL import Image, ImageDraw
import szkic_lib as L

T = 48
CUTS = [
    # mapa, (x0, y0, x1, y1), pola, nazwa, opis
    (125, (6, 0, 33, 11), [(14, 0), (15, 0), (16, 0)], "Przystań (Map125), górna krawędź",
     "pola 14-16 w rzędzie 0 → Pustelnia na klifie (Map155)"),
    (125, (8, 29, 35, 39), [(21, 39), (22, 39), (23, 39)], "Przystań (Map125), dolna krawędź",
     "pola 21-23 w rzędzie 39 → Garnizon nad zatoką (Map162)"),
    (13, (40, 3, 59, 19), [(59, 11), (59, 12), (59, 13)], "Góry i kamieniołom (Map013), prawa krawędź",
     "pola 59, 11-13 → Przylądek z latarnią (opcja: pętla)"),
    (147, (10, 2, 31, 12), [(19, 5), (20, 5), (21, 5)], "Piętro 30, Wielka cysterna (Map147)",
     "Zasuwa główna: po W1 rozdz. 7 kod podmienia jej stronę na przejście"),
]


def load(mid):
    with open(L.ROOT + "data/Map%03d.json" % mid, "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def main():
    out = Image.new("RGBA", (1280, 720), L.BG + (255,))
    dr = ImageDraw.Draw(out, "RGBA")
    f_t = L.font("AlegreyaSC-Bold.ttf", 26)
    f_b = L.font("AlegreyaSans-Bold.ttf", 16)
    f_d = L.font("AlegreyaSans-Regular.ttf", 14)
    dr.text((16, 10), "Skąd wchodzimy: pola na istniejących mapach", font=f_t, fill=L.KEY)
    dr.text((16, 44), "Na każdej z tych map dochodzi najwyżej jedno zdarzenie przejścia (3 pola) na samej krawędzi. Kafelki zostają bez zmian. "
            "Tawerna (Map001) i miasteczko (Map008) nietknięte.", font=f_d, fill=L.MUTED)
    boxes = [(16, 76, 628, 386), (652, 76, 1264, 386), (16, 404, 628, 714), (652, 404, 1264, 714)]
    for (mid, (x0, y0, x1, y1), cells, name, desc), (bx0, by0, bx1, by1) in zip(CUTS, boxes):
        m = load(mid)
        full = L.render_map(m, m["tilesetId"])
        crop = full.crop((x0 * T, y0 * T, (x1 + 1) * T, (y1 + 1) * T))
        dd = ImageDraw.Draw(crop, "RGBA")
        for (cx, cy) in cells:
            px, py = (cx - x0) * T, (cy - y0) * T
            dd.rectangle([px + 2, py + 2, px + T - 3, py + T - 3], outline=(255, 216, 102, 255), width=5, fill=(255, 216, 102, 70))
        aw, ah = bx1 - bx0, by1 - by0 - 50
        sc = min(aw / crop.width, ah / crop.height)
        sm = crop.resize((int(crop.width * sc), int(crop.height * sc)), Image.LANCZOS)
        out.alpha_composite(sm, (bx0, by0 + 46))
        dr.text((bx0, by0), name, font=f_b, fill=L.TEXT)
        dr.text((bx0, by0 + 20), desc, font=f_d, fill=L.KEY)
    out.convert("RGB").save(L.DOCS + "wejscia.png")
    print("ok wejscia")


if __name__ == "__main__":
    main()
