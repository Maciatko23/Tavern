# Makiety „Lista v2” obok zrzutów z gry (tests/menu_lista_test.js robi docs/ui_proste/gra_*.png):
#   python tools/ui_proste/gra_vs_makieta.py  ->  docs/ui_proste/gra_vs_makieta.png
# W każdym rzędzie: po lewej makieta, po prawej to samo w grze (połowa rozmiaru, podpisy nad obrazkami).
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DOCS = os.path.join(ROOT, "docs", "ui_proste")
PARY = [
    ("lista_v2_glowne.png", "gra_postac.png", "Postać (lista, podgląd)"),
    ("lista_v2_ekwipunek.png", "gra_ekwipunek_dymek.png", "Ekwipunek (w grze: dymek zaznaczonego)"),
    ("lista_v2_ekwipunek_wybor.png", "gra_ekwipunek_wybor.png", "Ekwipunek: wybór na głowę z podglądem"),
    ("propozycja_1_lista_widok.png", "gra_plecak.png", "Plecak"),
    ("lista_v2_dziennik.png", "gra_dziennik.png", "Dziennik"),
]
SW, SH, CAP, GAP = 640, 360, 40, 16


def main():
    f = ImageFont.truetype(os.path.join(ROOT, "fonts", "AlegreyaSans-Bold.ttf"), 24)
    fs = ImageFont.truetype(os.path.join(ROOT, "fonts", "AlegreyaSans-Medium.ttf"), 20)
    rows = [p for p in PARY if os.path.exists(os.path.join(DOCS, p[1]))]
    W = SW * 2 + GAP * 3
    H = GAP + len(rows) * (CAP + SH + GAP)
    img = Image.new("RGB", (W, H), (18, 19, 22))
    d = ImageDraw.Draw(img)
    y = GAP
    for mak, gra, name in rows:
        for k, (fn, label) in enumerate(((mak, "makieta"), (gra, "gra"))):
            x = GAP + k * (SW + GAP)
            d.text((x, y + 6), name, font=f, fill=(242, 236, 226))
            d.text((x + SW, y + 10), label, font=fs, fill=(214, 142, 88) if k else (166, 160, 150), anchor="ra")
            p = os.path.join(DOCS, fn)
            if os.path.exists(p):
                img.paste(Image.open(p).convert("RGB").resize((SW, SH), Image.LANCZOS), (x, y + CAP))
        y += CAP + SH + GAP
    out = os.path.join(DOCS, "gra_vs_makieta.png")
    img.save(out, optimize=True)
    print("zapisano", out, len(rows), "par")


if __name__ == "__main__":
    main()
