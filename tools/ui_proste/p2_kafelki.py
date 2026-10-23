# Propozycja 2 „Kafelki”: 7 dużych kafli z ikoną i napisem na środku ekranu (4 + 3), O otwiera pełny widok, P wraca do kafli.
#   python tools/ui_proste/p2_kafelki.py  ->  docs/ui_proste/propozycja_2_kafelki_glowne.png, _widok.png
from kit import (background, shadow, rrect, text, font, tw, hline, vline, put, put_c, keybar, save, menu_icon,
                 MENU, HERO, PANEL, LINE, TEXT, MUTED, DIM, ACC, SEL_TEXT, W, H, GOALS)
from widoki import DARK, equipment, hero_head_block, needs_block, attrs_block, fight_block, slot_detail, FIGHT_SHORT

INFO = {
    "postac": "Poziom 1 · ekwipunek",
    "umiejetnosci": "0 punktów do rozdania",
    "plecak": "17 rzeczy · 9 / 130",
    "dziennik": "8 / 77 celów",
    "opcje": "Obraz i dźwięk",
    "zapisz": "7 miejsc na zapis",
    "wyjdz": "Do ekranu tytułowego",
}


def fit(s, f, w):
    if tw(s, f) <= w:
        return s
    while s and tw(s + "…", f) > w:
        s = s[:-1]
    return s.rstrip() + "…"


def tile(img, box, key, lab, on):
    x0, y0, x1, y1 = box
    shadow(img, box, 14, 5, 8, 110)
    rrect(img, box, 16, ACC + (255,) if on else PANEL)
    cx = (x0 + x1) / 2
    put_c(img, menu_icon(key, 3), cx, y0 + 82)
    text(img, (cx, y0 + 168), lab, font("b", 34), SEL_TEXT if on else TEXT, anchor="mm")
    f = font("m", 21)
    text(img, (cx, y0 + 208), fit(INFO[key], f, x1 - x0 - 28), f, (74, 46, 28) if on else MUTED, anchor="mm")


def main():
    img = background(0.27, 2.0)
    # nagłówek: kto, kiedy, gdzie
    text(img, (124, 44), HERO["name"], font("b", 36), TEXT)
    text(img, (124 + tw(HERO["name"], font("b", 36)) + 16, 58), "Poziom %d" % HERO["level"], font("b", 24), ACC)
    text(img, (1156, 48), "Dzień %d · %s · %s" % (HERO["day"], HERO["season"], HERO["time"]), font("m", 23), MUTED, anchor="ra")
    text(img, (1156, 76), HERO["place"] + " · %d G" % HERO["gold"], font("b", 23), TEXT, anchor="ra")
    tw_, th, gap = 240, 248, 24
    x = (W - (4 * tw_ + 3 * gap)) / 2
    y = 124
    for k in range(4):
        key, lab, _ = MENU[k]
        tile(img, (x, y, x + tw_, y + th), key, lab, key == "plecak")
        x += tw_ + gap
    x = (W - (3 * tw_ + 2 * gap)) / 2
    y += th + gap
    for k in range(4, 7):
        key, lab, _ = MENU[k]
        tile(img, (x, y, x + tw_, y + th), key, lab, False)
        x += tw_ + gap
    keybar(img, [("W/S/A/D", "ruch"), ("O", "wybierz"), ("P", "wróć do gry")])
    save(img, "propozycja_2_kafelki_glowne.png")


def view():
    img = background(0.22, 3.0)
    box = (40, 30, 1240, 650)
    shadow(img, box)
    rrect(img, box, 16, PANEL)
    x0, y0, x1, y1 = box
    put(img, menu_icon("postac", 2), x0 + 26, y0 + 14)
    text(img, (x0 + 104, y0 + 46), "Postać", font("b", 40), TEXT, anchor="lm")
    text(img, (x1 - 30, y0 + 48), "ekwipunek i statystyki na jednym ekranie", font("m", 21), DIM, anchor="rm")
    hline(img, x0 + 24, x1 - 24, y0 + 90, LINE)
    # lewa część: figura i miejsca (ubiór po lewej, okrycie / plecy / ręce po prawej)
    equipment(img, (x0 + 20, y0 + 104, x0 + 700, y1 - 20), DARK, sel="torso", fig_scale=5)
    vline(img, x0 + 712, y0 + 110, y1 - 24, LINE)
    # prawa część: kto to, potrzeby, atrybuty, walka, opis zaznaczonego
    cx, w = x0 + 740, x1 - 30 - (x0 + 740)
    y = hero_head_block(img, cx, y0 + 108, w, DARK)
    y = needs_block(img, cx, y + 14, w, DARK, cols=2, row=46)
    yA = y + 8
    cw = (w - 34) // 2
    attrs_block(img, cx, yA, cw, DARK, row=30)
    fight_block(img, cx + cw + 34, yA, cw, DARK, row=30, rows=FIGHT_SHORT)
    hline(img, cx, x1 - 30, y1 - 124, LINE)
    slot_detail(img, (cx, y1 - 108, x1 - 30, y1 - 20), DARK, "torso", short=True)
    keybar(img, [("W/S/A/D", "miejsce"), ("O", "zmień"), ("X", "zdejmij"), ("P", "wróć")])
    save(img, "propozycja_2_kafelki_widok.png")


if __name__ == "__main__":
    main()
    view()
