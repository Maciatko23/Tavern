# Zestawienie: obecny wygląd + 5 pomysłów obok siebie (HUD, okno, paleta, czcionka) -> docs/ui_pomysly/zestawienie.png
import os
from PIL import Image, ImageDraw
from uikit import *

IDEAS = [
    ("0", "Teraz (dla porównania)", os.path.join(SHOTS, "mapa_hud.png"), os.path.join(SHOTS, "plecak.png"),
     ["#0b0c0e", "#16181b", "#ffd23f", "#b8952a", "#eceef0", "#8a9099"], "Alegreya Sans"),
    ("1", "Kronika · pergamin i atrament", "pomysl_1_kronika_hud.png", "pomysl_1_kronika_okno.png",
     ["#efdeb4", "#c9aa74", "#2e2014", "#9b2a1e", "#2d4a7a", "#c99a2e"], "Pirata One + Alegreya"),
    ("2", "Kuźnia · kute żelazo i żar", "pomysl_2_kuznia_hud.png", "pomysl_2_kuznia_okno.png",
     ["#16181b", "#30343a", "#7d838d", "#ffd23f", "#ff8a1f", "#ece4d4"], "Jersey 10 (pikselowa)"),
    ("3", "Zakon · kamień, runy, kruk", "pomysl_3_zakon_hud.png", "pomysl_3_zakon_okno.png",
     ["#3c4148", "#1d1f23", "#45d3c2", "#a8fff2", "#e8e4d8", "#d23a3a"], "Cinzel + Alegreya Sans"),
    ("4", "Czysty widok · nic nie zasłania", "pomysl_4_czysty_hud.png", "pomysl_4_czysty_okno.png",
     ["#f6f2ea", "#000000", "#ffd23f", "#ff6b5e", "#8fe06a", "#5ab8ff"], "Alegreya Sans (obecna)"),
    ("5", "Torba wędrowca · skóra, len, szwy", "pomysl_5_torba_hud.png", "pomysl_5_torba_okno.png",
     ["#4f3320", "#86603f", "#c4b593", "#a8443a", "#6e7e3c", "#45608a"], "Kalam (odręczna)"),
]

TW_, TH_ = 400, 225
GAP = 14
COLW = TW_ + GAP
HEAD = 64
W_ = GAP + len(IDEAS) * COLW
H_ = HEAD + 30 + TH_ + 10 + TH_ + 14 + 34 + 30 + 16

img = Image.new("RGBA", (W_, H_), hexc("#121316"))
f1 = font("AlegreyaSans-Medium.ttf", 30)
f2 = font("AlegreyaSans-Medium.ttf", 21)
f3 = font("AlegreyaSans-Medium.ttf", 16)
text(img, (GAP, 14), "Tawerna · 5 pomysłów na nowy interfejs", f1, "#ffd23f")
text(img, (W_ - GAP, 22), "każda kolumna: HUD na mapie · jedno okno · paleta · czcionka", f3, "#9aa0a6", anchor="ra")
d = ImageDraw.Draw(img)
for k, (num, name, hud, okno, pal, fnt) in enumerate(IDEAS):
    x = GAP + k * COLW
    y = HEAD
    cur = num == "0"
    text(img, (x, y), (name if cur else num + ". " + name), f2, "#9aa0a6" if cur else "#f0ece2")
    y += 32
    for p in (hud, okno):
        path = p if os.path.isabs(p) else os.path.join(OUT, p)
        th = Image.open(path).convert("RGBA").resize((TW_, TH_), Image.LANCZOS)
        d.rectangle((x - 1, y - 1, x + TW_, y + TH_), outline=hexc("#ffd23f" if not cur else "#3a3d42"))
        img.alpha_composite(th, (x, y))
        y += TH_ + 10
    y += 4
    for i, c in enumerate(pal):
        d.rectangle((x + i * 40, y, x + i * 40 + 34, y + 26), fill=hexc(c), outline=hexc("#000000"))
    y += 36
    text(img, (x, y), "Czcionka: " + fnt, f3, "#c8c4ba")
img.convert("RGB").save(os.path.join(OUT, "zestawienie.png"), optimize=True)
print(os.path.join(OUT, "zestawienie.png"), img.size)
