# Zestawienie trzech projektów menu P (Grafit) + obecny pierścień -> docs/ui_pomysly2/menu_p_zestawienie.png
import os
from PIL import Image, ImageDraw
from common2 import *

ITEMS = [
    ("Teraz: pierścień (MenuRing)", os.path.join(SHOTS2, "menu_p.png"), [
        "Ikony w kręgu wokół bohatera, mapa widoczna.", "←→ obrót · Enter · Esc"]),
    ("A · Karta bohatera", os.path.join(OUT2, "menu_p_A.png"), [
        "Popiersie w kręgu (pierścień = doświadczenie), wokół stan, atrybuty, narzędzia, broń, ubranie.",
        "Menu jako zakładki u góry: Q/E albo klik; strzałki po slotach, Enter rozdaje punkt / otwiera.",
        "Wejście: tło się rozmywa, popiersie wjeżdża od dołu, panele wsuwają się z boków, linie dorysowują się."]),
    ("B · Panel z lewej + podgląd", os.path.join(OUT2, "menu_p_B.png"), [
        "Pełna kolumna z dużymi ikonami i podpisami; po prawej podgląd zaznaczonej pozycji, mapa dalej widać.",
        "↑↓ albo najechanie myszą; Enter / → / klik otwiera; Esc / P zamyka; kółko przewija podgląd.",
        "Wejście: panel wysuwa się z lewej (0,18 s), pozycje wpadają po kolei, podgląd przenika przy zmianie."]),
    ("C · Hub z kafelkami", os.path.join(OUT2, "menu_p_C.png"), [
        "Karty jak w nowoczesnych grach: Plecak, Dziennik, Postać, Dług, Opcje, Zapis, Wyjście.",
        "Strzałki po siatce, Enter / klik otwiera, 1–6 skróty, Esc / P zamyka.",
        "Wejście: kafelki wskakują po przekątnej (0,96 → 1), miedziana ramka płynie do zaznaczonego, liczby dobijają."]),
]
TW_, TH_ = 620, 349
GAP = 20
W_ = GAP * 3 + TW_ * 2
f3 = font("AlegreyaSans-Regular.ttf", 16)
WR = [[l for ln in lines for l in wrapf(ln, f3, TW_)] for _, _, lines in ITEMS]
ROWH = TH_ + 34 + max(len(w) for w in WR) * 21 + 24
H_ = 70 + 2 * ROWH
img = Image.new("RGBA", (W_, H_), hexc("#121316"))
text(img, (GAP, 16), "Menu P w stylu „Grafit i miedź” · 3 projekty", font("AlegreyaSans-Medium.ttf", 30), "#d08a5a")
f2 = font("AlegreyaSans-Bold.ttf", 21); f3 = font("AlegreyaSans-Regular.ttf", 16)
d = ImageDraw.Draw(img)
for k, (name, path, lines) in enumerate(ITEMS):
    c, r = k % 2, k // 2
    x = GAP + c * (TW_ + GAP)
    y = 70 + r * ROWH
    text(img, (x, y), name, f2, "#9aa0a6" if k == 0 else "#ece6da")
    th = Image.open(path).convert("RGBA").resize((TW_, TH_), Image.LANCZOS)
    d.rectangle((x - 1, y + 29, x + TW_, y + 30 + TH_), outline=hexc("#3a3d42" if k == 0 else "#d08a5a"))
    img.alpha_composite(th, (x, y + 30))
    for i, ln in enumerate(WR[k]):
        text(img, (x, y + 38 + TH_ + i * 21), ln, f3, "#c8c4ba")
img.convert("RGB").save(os.path.join(OUT2, "menu_p_zestawienie.png"), optimize=True)
print(os.path.join(OUT2, "menu_p_zestawienie.png"), img.size)
