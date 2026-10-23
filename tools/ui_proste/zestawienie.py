# Zestawienie: obecne menu P + 4 proste propozycje w miniaturach -> docs/ui_proste/wszystkie.png
#   python tools/ui_proste/zestawienie.py
import os
from PIL import Image
from kit import OUT, font, text, para, rrect, hline, TEXT, MUTED, DIM, ACC, LINE

TW, TH = 600, 338
LEFT_W = 400
M = 40
ROWS = [
    ("Teraz", "obecne menu (MenuRing)",
     "Zakładki u góry (A/D), podzakładki, zawartość: 3 poziomy. Aktywna warstwa ma miedzianą obwódkę, reszta przygaszona.",
     ("obecne_postac_poziom1.png", "zakładki: Postać"), ("obecne_plecak.png", "w środku: Plecak")),
    ("1", "Lista",
     "Pionowa lista 7 pozycji po lewej, po prawej podgląd wybranej. O otwiera ją na prawym polu, lista zostaje (przygaszona). P wraca.",
     ("propozycja_1_lista_glowne.png", "główne: Postać zaznaczona"), ("propozycja_1_lista_widok.png", "widok: Plecak")),
    ("2", "Kafelki",
     "7 dużych kafli na środku (4 + 3). Strzałki / WSAD po kaflach, O otwiera pełny ekran, P wraca do kafli.",
     ("propozycja_2_kafelki_glowne.png", "główne: Plecak zaznaczony"), ("propozycja_2_kafelki_widok.png", "widok: Postać (ekwipunek + statystyki)")),
    ("3", "Pasek",
     "Pasek 7 ikon na dole, gra widoczna nad nim. A/D po pasku, O otwiera panel nad paskiem, P zamyka.",
     ("propozycja_3_pasek_glowne.png", "główne: Plecak zaznaczony"), ("propozycja_3_pasek_widok.png", "widok: Plecak (siatka)")),
    ("4", "Księga",
     "Rozłożona księga: po lewej spis 7 rozdziałów, po prawej strona. O otwiera rozdział na obu stronach, P wraca do spisu.",
     ("propozycja_4_ksiega_glowne.png", "spis: Dziennik zaznaczony"), ("propozycja_4_ksiega_widok.png", "rozdział: Postać")),
]


def main():
    row_h = TH + 46 + 34
    Wc = M + LEFT_W + 24 + TW + 20 + TW + M
    Hc = 150 + len(ROWS) * row_h
    img = Image.new("RGBA", (Wc, Hc), (17, 17, 20, 255))
    text(img, (M, 34), "Menu P – proste propozycje", font("b", 50), ACC)
    text(img, (M, 98), "O – wejdź / wybierz / użyj     P – wyjdź / wróć poziom wyżej     najwyżej 2 poziomy: lista → widok     "
         "stały pasek klawiszy na dole", font("m", 25), MUTED)
    y = 150
    for k, (num, name, desc, a, b) in enumerate(ROWS):
        hline(img, M, Wc - M, y - 14, LINE)
        cur = num == "Teraz"
        if cur:
            text(img, (M, y + 4), "Teraz", font("b", 40), MUTED)
        else:
            rrect(img, (M, y + 6, M + 46, y + 52), 10, ACC + (255,))
            text(img, (M + 23, y + 30), num, font("b", 32), (26, 20, 15), anchor="mm")
            text(img, (M + 62, y + 4), name, font("b", 40), TEXT)
        if cur:
            text(img, (M, y + 56), name, font("m", 22), DIM)
        para(img, M, y + (92 if cur else 70), desc, font("m", 24), TEXT if not cur else MUTED, LEFT_W - 20, 32)
        x = M + LEFT_W + 24
        for fn, cap in (a, b):
            th = Image.open(os.path.join(OUT, fn)).convert("RGBA").resize((TW, TH), Image.LANCZOS)
            rrect(img, (x - 2, y - 2, x + TW + 1, y + TH + 1), 4, LINE + (255,))
            img.alpha_composite(th, (x, y))
            text(img, (x + 2, y + TH + 12), cap, font("m", 22), MUTED)
            x += TW + 20
        y += row_h
    p = os.path.join(OUT, "wszystkie.png")
    img.convert("RGB").save(p, optimize=True)
    print("zapisano", p, img.size)


if __name__ == "__main__":
    main()
