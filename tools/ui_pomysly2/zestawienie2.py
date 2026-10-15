# Zestawienie rundy 2: obecny „Czysty widok” + 5 pomysłów (HUD, dziennik, plecak, trzecie okno, paleta, czcionka)
import os
from PIL import Image, ImageDraw
from common2 import *

S = SHOTS2
IDEAS = [
    ("Teraz: Czysty widok", None, [os.path.join(S, f) for f in ("mapa_hud.png", "dziennik.png", "plecak.png", "menu_p.png")],
     ["#f6f2ea", "#000000", "#ffd23f", "#ff6b5e", "#8fe06a", "#5ab8ff"], "Alegreya Sans"),
    ("1. Witraż", "ozdobny", ["pomysl_1_witraz_hud.png", "pomysl_1_witraz_dziennik.png", "pomysl_1_witraz_plecak.png", "pomysl_1_witraz_postac.png"],
     ["#121318", "#161d2c", "#c8304a", "#3a64c8", "#e0a43a", "#2ea05a"], "Uncial Antiqua + Alegreya Sans"),
    ("2. Zielarnia", "ozdobny", ["pomysl_2_zielarnia_hud.png", "pomysl_2_zielarnia_dziennik.png", "pomysl_2_zielarnia_plecak.png", "pomysl_2_zielarnia_opcje.png"],
     ["#4e321c", "#1c281f", "#ece2c4", "#b08a3a", "#b02a36", "#3a7ac8"], "EB Garamond + Cormorant SC"),
    ("3. Grafit i miedź", "schludny", ["pomysl_3_grafit_hud.png", "pomysl_3_grafit_dziennik.png", "pomysl_3_grafit_plecak.png", "pomysl_3_grafit_menu_p.png"],
     ["#16171a", "#40424a", "#d08a5a", "#ece6da", "#d8605a", "#62a6dc"], "Alegreya Sans (+ SC)"),
    ("4. Len i atrament", "schludny", ["pomysl_4_len_hud.png", "pomysl_4_len_dziennik.png", "pomysl_4_len_plecak.png", "pomysl_4_len_zapis.png"],
     ["#f3eee2", "#2b2620", "#a23a22", "#beb4a2", "#5a8a32", "#2f6fb0"], "EB Garamond + Cormorant SC"),
    ("5. Granat i złoto", "schludny", ["pomysl_5_granat_hud.png", "pomysl_5_granat_dziennik.png", "pomysl_5_granat_plecak.png", "pomysl_5_granat_postac.png"],
     ["#101624", "#16203a", "#d4b26a", "#efe9dc", "#9aa3b4", "#5a9fd6"], "Cormorant SC + Alegreya Sans"),
]
ROWS = ["HUD na mapie", "Dziennik", "Plecak", "Trzecie okno"]
TW_, TH_ = 320, 180
GAP = 12
LEFT = 0
HEAD = 92
COLW = TW_ + GAP
W_ = GAP + len(IDEAS) * COLW
H_ = HEAD + len(ROWS) * (TH_ + 8) + 20 + 30 + 28 + 14

img = Image.new("RGBA", (W_, H_), hexc("#121316"))
f1 = font("AlegreyaSans-Medium.ttf", 30)
f2 = font("AlegreyaSans-Medium.ttf", 20)
f3 = font("AlegreyaSans-Medium.ttf", 15)
text(img, (GAP, 12), "Tawerna · 5 nowych pomysłów na interfejs (runda 2)", f1, "#ffd23f")
text(img, (W_ - GAP, 22), "zasady: 4 paski w lewym dole · okrągły kompas w prawym górnym · zegar ze wskazówkami przy celu", f3, "#9aa0a6", anchor="ra")
d = ImageDraw.Draw(img)
for k, (name, tag, files, pal, fnt) in enumerate(IDEAS):
    x = GAP + k * COLW
    cur = tag is None
    text(img, (x, 56), name, f2, "#9aa0a6" if cur else "#f0ece2")
    if tag:
        col = "#8fd08a" if tag == "schludny" else "#e0a43a"
        text(img, (x + TW_, 60), tag, f3, col, anchor="ra")
    y = HEAD
    for p in files:
        path = p if os.path.isabs(p) else os.path.join(OUT2, p)
        th = Image.open(path).convert("RGBA").resize((TW_, TH_), Image.LANCZOS)
        d.rectangle((x - 1, y - 1, x + TW_, y + TH_), outline=hexc("#3a3d42" if cur else "#ffd23f"))
        img.alpha_composite(th, (x, y))
        y += TH_ + 8
    y += 8
    for i, c in enumerate(pal):
        d.rectangle((x + i * 36, y, x + i * 36 + 30, y + 22), fill=hexc(c), outline=hexc("#000000"))
    text(img, (x, y + 30), "Czcionka: " + fnt, f3, "#c8c4ba")
img.convert("RGB").save(os.path.join(OUT2, "zestawienie.png"), optimize=True)
print(os.path.join(OUT2, "zestawienie.png"), img.size)
