# Propozycja 1 „Lista”: pionowa lista 7 pozycji po lewej (duże napisy z ikonami), po prawej podgląd wybranej;
# O otwiera ją na całym prawym polu (lista zostaje, przygaszona), P wraca do listy.
#   python tools/ui_proste/p1_lista.py  ->  docs/ui_proste/propozycja_1_lista_glowne.png, _widok.png
from kit import (background, shadow, rrect, text, font, tw, hline, put, put_c, meter, keybar, save, menu_icon, bust, item_icon,
                 MENU, HERO, PANEL, LINE, TEXT, MUTED, DIM, ACC, ACC_DIM, SEL_TEXT, W, H)
from widoki import DARK, bag_list, item_detail, hero_head_block, needs_block, heading

LEFT = (40, 40, 420, 650)
RIGHT = (440, 40, 1240, 650)


def left_list(img, sel, inside=False):
    x0, y0, x1, y1 = LEFT
    shadow(img, LEFT)
    rrect(img, LEFT, 14, PANEL)
    text(img, (x0 + 26, y0 + 22), "Dzień %d · %s · %s" % (HERO["day"], HERO["season"], HERO["time"]), font("m", 21), MUTED)
    text(img, (x0 + 26, y0 + 50), HERO["place"], font("b", 23), TEXT)
    hline(img, x0 + 20, x1 - 20, y0 + 90, LINE)
    y = y0 + 102
    rh = 72
    for k, (key, lab, _) in enumerate(MENU):
        on = key == sel
        if on:
            rrect(img, (x0 + 12, y, x1 - 12, y + rh - 6), 10, (ACC_DIM if inside else ACC) + (255,))
        put(img, menu_icon(key), x0 + 26, y + (rh - 6 - 64) // 2, 0.4 if inside and not on else 1.0)
        col = (SEL_TEXT if not inside else TEXT) if on else (DIM if inside else TEXT)
        text(img, (x0 + 108, y + (rh - 6) / 2 + 1), lab, font("b", 32), col, anchor="lm")
        y += rh


def right_panel(img):
    shadow(img, RIGHT)
    rrect(img, RIGHT, 14, PANEL)


def main():
    img = background(0.30, 1.5)
    left_list(img, "postac")
    right_panel(img)
    x0, y0, x1, y1 = RIGHT
    text(img, (x0 + 34, y0 + 26), "Postać", font("b", 40), TEXT)
    text(img, (x1 - 34, y0 + 42), "podgląd", font("m", 21), DIM, anchor="ra")
    hline(img, x0 + 30, x1 - 30, y0 + 90, LINE)
    # popiersie i główne liczby
    b = bust(330)
    rrect(img, (x0 + 34, y0 + 112, x0 + 34 + 300, y0 + 112 + 330), 12, (32, 34, 39, 255))
    put(img, b.crop((int((b.width - 300) / 2), 0, int((b.width - 300) / 2) + 300, 330)), x0 + 34, y0 + 112)
    cx = x0 + 370
    w = x1 - 34 - cx
    y = hero_head_block(img, cx, y0 + 112, w, DARK)
    y = needs_block(img, cx, y + 22, w, DARK, cols=2, row=52)
    y += 18
    heading(img, cx, y, "NA SOBIE", DARK, x1 - 34)
    y += 34
    for i in (260, 270, 275, 277, 60):
        rrect(img, (cx, y, cx + 72, y + 72), 10, (40, 42, 48, 255))
        put_c(img, item_icon(i, 2), cx + 36, y + 36)
        cx += 80
    # na dole: sakiewka i dług
    y = y0 + 470
    hline(img, x0 + 30, x1 - 30, y, LINE)
    text(img, (x0 + 34, y + 22), "Sakiewka", font("m", 22), MUTED)
    text(img, (x0 + 34, y + 50), "%d G" % HERO["gold"], font("b", 30), (232, 200, 122))
    text(img, (x0 + 300, y + 22), "Dług dziadka", font("m", 22), MUTED)
    text(img, (x0 + 300, y + 50), "%d G" % HERO["debt_left"], font("b", 30), TEXT)
    text(img, (x0 + 300 + tw("%d G" % HERO["debt_left"], font("b", 30)) + 14, y + 60), "zostało %d dni" % HERO["debt_days"], font("m", 22), MUTED)
    text(img, (x0 + 34, y1 - 30), "O otwiera kartę postaci: ekwipunek i statystyki.", font("m", 21), DIM)
    keybar(img, [("W/S", "ruch"), ("O", "wybierz"), ("P", "wróć do gry")])
    save(img, "propozycja_1_lista_glowne.png")


def view():
    img = background(0.30, 1.5)
    left_list(img, "plecak", inside=True)
    right_panel(img)
    x0, y0, x1, y1 = RIGHT
    text(img, (x0 + 34, y0 + 26), "Plecak", font("b", 40), TEXT)
    text(img, (x1 - 300, y0 + 30), "OBCIĄŻENIE", font("sc", 19), MUTED)
    text(img, (x1 - 34, y0 + 26), "%d / %d" % HERO["load"], font("b", 24), TEXT, anchor="ra")
    meter(img, x1 - 300, y0 + 58, 266, 8, HERO["load"][0] / HERO["load"][1], ACC)
    hline(img, x0 + 30, x1 - 30, y0 + 90, LINE)
    bag_list(img, (x0 + 24, y0 + 108, x0 + 400, y1 - 22), DARK, sel=131)
    hline(img, x0 + 422, x0 + 422, y0 + 108, LINE)
    from kit import vline
    vline(img, x0 + 424, y0 + 108, y1 - 24, LINE)
    item_detail(img, (x0 + 450, y0 + 112, x1 - 34, y1 - 24), DARK, 131)
    keybar(img, [("W/S", "rzecz"), ("O", "użyj"), ("X", "wyrzuć"), ("P", "wróć")])
    save(img, "propozycja_1_lista_widok.png")


if __name__ == "__main__":
    main()
    view()
