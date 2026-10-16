# python tools/miejsca_wyspy/polozenie.py -> docs/miejsca_wyspy/polozenie.png
# Poglądowa mapa Kruczej Wyspy (zarys brzegu jak w artefakcie „Atlas Kruczej Wyspy”): miejsca już w grze (niebieskie, z numerem
# mapy), sześć nowych miejsc z koncepcji (żółte) i przejścia między mapami. Tylko obraz do dokumentu - nic w data/.
import os, sys, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from PIL import Image, ImageDraw
import szkic_lib as L

W, H = 1280, 720
MX, MY, SC = 10, 40, 0.86          # atlas 1000x640 -> obraz
COAST = [[200, 150], [270, 110], [340, 95], [420, 88], [500, 95], [560, 80], [630, 88], [700, 78], [780, 85], [850, 80], [905, 105],
         [900, 160], [870, 200], [890, 260], [880, 330], [900, 390], [885, 450], [840, 500], [790, 540], [720, 560], [650, 578],
         [590, 582], [520, 575], [450, 588], [380, 575], [310, 560], [250, 545], [200, 510], [170, 460], [160, 400], [150, 340],
         [165, 290], [150, 240], [175, 195]]


def P(x, y):
    return (MX + x * SC, MY + y * SC)


def spline(pts, k=8, seed=7):
    r = random.Random(seed)
    out, n = [], len(pts)
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        for j in range(k):
            t = j / k
            t2, t3 = t * t, t * t * t
            x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
            y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
            out.append((x + (r.random() - 0.5) * 6, y + (r.random() - 0.5) * 6))
    return out


# miejsca: klucz -> (x, y w skali atlasu, nazwa, mapa, nowe?)
PL = {
    "miasto": (505, 215, "Miasteczko i tawerna", "Map008 · Map001", False),
    "dwor": (650, 222, "Dwór Lorda", "Map024", False),
    "podgrodzie": (360, 236, "Podgrodzie", "Map111", False),
    "przystan": (205, 318, "Przystań", "Map125", False),
    "polna": (505, 318, "Polna droga", "Map022", False),
    "lesna": (628, 330, "Leśna droga", "Map021", False),
    "dziadek": (650, 275, "Dom dziadka", "Map019/020", False),
    "gory": (772, 340, "Góry i kamieniołom", "Map013", False),
    "jaskinia": (820, 300, "Jaskinia", "Map014", False),
    "osada": (790, 262, "Osada Milczących", "Map120", False),
    "skraj": (505, 420, "Skraj lasu", "Map023", False),
    "pole": (385, 440, "Pole dziadka", "Map003", False),
    "laka": (385, 372, "Łąka", "Map004", False),
    "pustelnia": (318, 128, "Pustelnia na klifie", "Map155 (+156)", True),
    "urwisko": (560, 104, "Urwisko Kruków", "Map157", True),
    "latarnia": (852, 112, "Latarnia na przylądku", "Map159 (+160, 161)", True),
    "garnizon": (212, 418, "Garnizon nad zatoką", "Map162 (+163)", True),
    "wrak": (112, 452, "Wrak na mieliźnie", "Map165 (+166)", True),
    "cysterna": (450, 168, "Stara cysterna zakonu", "Map167 (pod ziemią)", True),
}
LINKS_OLD = [("miasto", "dwor"), ("miasto", "podgrodzie"), ("podgrodzie", "przystan"), ("miasto", "polna"), ("polna", "lesna"),
             ("lesna", "dziadek"), ("lesna", "gory"), ("gory", "jaskinia"), ("gory", "osada"), ("polna", "skraj"), ("skraj", "pole"),
             ("pole", "laka")]
LINKS_NEW = [("przystan", "pustelnia", [(225, 230), (250, 160)]), ("pustelnia", "urwisko", [(440, 110)]),
             ("urwisko", "latarnia", [(700, 100)]), ("przystan", "garnizon", []), ("garnizon", "wrak", []),
             ("gory", "latarnia", [(860, 300), (880, 200)])]
LAB = {"miasto": "l", "dwor": "r", "podgrodzie": "b", "przystan": "l", "polna": "l", "lesna": "b", "dziadek": "r", "gory": "b",
       "jaskinia": "r", "osada": "r", "skraj": "r", "pole": "b", "laka": "l", "pustelnia": "t", "urwisko": "t", "latarnia": "l",
       "garnizon": "r", "wrak": "b", "cysterna": "l"}


def main():
    im = Image.new("RGBA", (W, H), L.BG + (255,))
    dr = ImageDraw.Draw(im, "RGBA")
    # morze
    sea = Image.new("RGBA", (int(1000 * SC), int(640 * SC)), (16, 36, 43, 255))
    sd = ImageDraw.Draw(sea, "RGBA")
    r = random.Random(3)
    for _ in range(110):
        x, y = r.random() * sea.width, r.random() * sea.height
        sd.arc([x, y, x + 22, y + 8], 200, 340, fill=(160, 200, 210, 30), width=1)
    im.alpha_composite(sea, (MX, MY))
    coast = [P(x, y) for (x, y) in spline(COAST)]
    dr.polygon(coast, fill=(57, 67, 47, 255), outline=(120, 180, 170, 120))
    # klify na północy
    for (x, y) in spline(COAST):
        if y < 125 and 290 < x < 910:
            a = P(x, y)
            dr.line([a, (a[0] + 2, a[1] + 8)], fill=(15, 20, 18, 220), width=2)
    # wzgórze twierdzy
    for i in range(4):
        cx, cy = P(520, 200)
        rx, ry = (50 + i * 22) * SC, (30 + i * 13) * SC
        dr.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=(210, 200, 160, 50), width=1)
    # góry, las
    for i in range(36):
        x, y = 730 + r.random() * 150, 280 + r.random() * 170
        a = P(x, y)
        s = 7 + r.random() * 6
        dr.polygon([(a[0] - s, a[1] + s * .7), (a[0], a[1] - s), (a[0] + s, a[1] + s * .7)], fill=(87, 87, 77, 160))
    for i in range(140):
        x, y = 240 + r.random() * 230, 330 + r.random() * 200
        a = P(x, y)
        dr.ellipse([a[0] - 4, a[1] - 4, a[0] + 4, a[1] + 4], fill=(35, 48, 31, 170))
    # kontynent
    dr.rectangle([MX, MY, MX + 34, MY + 640 * SC], fill=(28, 34, 38, 255))
    f_c = L.font("AlegreyaSC-Bold.ttf", 14)
    txt = Image.new("RGBA", (300, 24), (0, 0, 0, 0))
    ImageDraw.Draw(txt).text((0, 2), "KONTYNENT · WOJNA", font=f_c, fill=(160, 159, 163, 255))
    txt = txt.rotate(90, expand=True)
    im.alpha_composite(txt, (MX + 6, int(MY + 640 * SC / 2 - 150)))
    # prom
    a, b = P(205, 318), P(50, 300)
    L.dashed_line(dr, a, b, (255, 216, 102, 110), 2, 6, 6)
    # drogi
    for k1, k2 in LINKS_OLD:
        dr.line([P(*PL[k1][:2]), P(*PL[k2][:2])], fill=(214, 196, 150, 150), width=3)
    for k1, k2, via in LINKS_NEW:
        pts = [P(*PL[k1][:2])] + [P(*v) for v in via] + [P(*PL[k2][:2])]
        col = (255, 216, 102, 235) if k1 != "gory" else (255, 216, 102, 130)
        for p, q in zip(pts, pts[1:]): L.dashed_line(dr, p, q, col, 3, 9, 6)
    # cysterna: pod ziemią - linie do piętra 30 (pod tawerną) i do kraty na Urwisku
    L.dashed_line(dr, P(450, 168), P(520, 200), (150, 210, 255, 200), 2, 4, 5)
    L.dashed_line(dr, P(450, 168), P(560, 104), (150, 210, 255, 200), 2, 4, 5)
    # piny
    f_n = L.font("AlegreyaSans-Bold.ttf", 15)
    f_m = L.font("AlegreyaSans-Medium.ttf", 12)
    for k, (x, y, name, mapn, new) in PL.items():
        cx, cy = P(x, y)
        col = (255, 216, 102) if new else (159, 212, 255)
        rad = 9 if new else 7
        if k == "cysterna":
            dr.rectangle([cx - 8, cy - 8, cx + 8, cy + 8], fill=(150, 210, 255), outline=(0, 0, 0), width=2)
        else:
            dr.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=col, outline=(0, 0, 0), width=2)
        side = LAB[k]
        w1 = dr.textlength(name, font=f_n)
        w2 = dr.textlength(mapn, font=f_m)
        w = max(w1, w2)
        if side == "r": tx, ty = cx + 13, cy - 16
        elif side == "l": tx, ty = cx - 13 - w, cy - 16
        elif side == "t": tx, ty = cx - w / 2, cy - 44
        else: tx, ty = cx - w / 2, cy + 12
        dr.rectangle([tx - 4, ty - 1, tx + w + 4, ty + 33], fill=(11, 12, 15, 205))
        dr.text((tx, ty), name, font=f_n, fill=col if new else L.TEXT)
        dr.text((tx, ty + 17), mapn, font=f_m, fill=L.MUTED)
    # róża wiatrów
    cx, cy = P(960, 590)
    dr.polygon([(cx, cy - 20), (cx + 6, cy), (cx, cy + 20), (cx - 6, cy)], outline=(235, 232, 223, 160))
    dr.polygon([(cx, cy - 20), (cx + 6, cy), (cx - 6, cy)], fill=(235, 232, 223, 190))
    dr.text((cx - 5, cy - 40), "N", font=L.font("AlegreyaSC-Bold.ttf", 14), fill=L.TEXT)
    # legenda po prawej
    x0 = 890
    f_t = L.font("AlegreyaSC-Bold.ttf", 26)
    dr.text((x0, 14), "Położenie miejsc", font=f_t, fill=L.KEY)
    f_s = L.font("AlegreyaSans-Medium.ttf", 14)
    f_b = L.font("AlegreyaSans-Bold.ttf", 15)
    f_d = L.font("AlegreyaSans-Regular.ttf", 13)
    dr.text((x0, 48), "Poglądowo (zarys z Atlasu Kruczej Wyspy).", font=f_s, fill=L.MUTED)
    y = 76
    dr.ellipse([x0, y + 2, x0 + 14, y + 16], fill=(159, 212, 255), outline=(0, 0, 0)); dr.text((x0 + 22, y), "już w grze", font=f_s, fill=L.TEXT)
    y += 22
    dr.ellipse([x0, y + 2, x0 + 14, y + 16], fill=L.KEY, outline=(0, 0, 0)); dr.text((x0 + 22, y), "nowe (koncepcja)", font=f_s, fill=L.TEXT)
    y += 22
    L.dashed_line(dr, (x0, y + 9), (x0 + 16, y + 9), L.KEY, 3, 5, 3); dr.text((x0 + 22, y), "nowe przejście", font=f_s, fill=L.TEXT)
    y += 22
    L.dashed_line(dr, (x0, y + 9), (x0 + 16, y + 9), (150, 210, 255), 2, 4, 3); dr.text((x0 + 22, y), "pod ziemią", font=f_s, fill=L.TEXT)
    y += 32
    rows = [
        ("Przystań → Pustelnia", "Map125 górna krawędź (14-16, 0)"),
        ("Pustelnia → Urwisko", "Map155 (47, 17-18) → Map157 (0, 19-20)"),
        ("Urwisko → Przylądek", "Map157 (55, 19-20) → Map159 (0, 33-34)"),
        ("Góry → Przylądek (opcja)", "Map013 prawa krawędź (59, 11-13)"),
        ("Przystań → Garnizon", "Map125 dolna krawędź (21-23, 39)"),
        ("Garnizon / przystań → Wrak", "łacha w odpływie albo łódź Janka"),
        ("Piętro 30 → Cysterna", "drzwi wstawiane w kodzie (Map147 bez zmian)"),
        ("Cysterna → Urwisko", "krata z krukiem, otwiera się od środka"),
    ]
    dr.text((x0, y), "Jak się dochodzi", font=f_b, fill=L.KEY)
    y += 24
    for a, b in rows:
        dr.text((x0, y), a, font=f_b, fill=L.TEXT)
        dr.text((x0, y + 17), b, font=f_d, fill=L.MUTED)
        y += 40
    dr.text((x0, y + 4), "Na mapach użytkownika: tylko zdarzenia", font=f_d, fill=L.MUTED)
    dr.text((x0, y + 21), "przejścia na krawędzi, kafelki bez zmian.", font=f_d, fill=L.MUTED)
    f_cap = L.font("AlegreyaSans-Regular.ttf", 15)
    cap = ["Dwie nowe drogi od przystani: na północ wzdłuż klifów (Pustelnia → Urwisko Kruków → Przylądek z latarnią, z opcjonalnym zejściem",
           "w Góry, co zamyka pętlę wokół wyspy) i na południe (Garnizon nad zatoką → Wrak na mieliźnie, w odpływie albo łodzią Janka).",
           "Stara cysterna leży pod wzgórzem tawerny: wejście z piętra 30 (Wielka cysterna), wyjście kanałem do kraty z krukiem na Urwisku."]
    for i, line in enumerate(cap):
        dr.text((MX, 606 + i * 21), line, font=f_cap, fill=L.TEXT if i < 2 else (150, 210, 255))
    im.convert("RGB").save(L.DOCS + "polozenie.png")
    print("ok polozenie")


if __name__ == "__main__":
    main()
