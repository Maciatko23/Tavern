# Propozycja 3 „Pasek”: menu jako pasek 7 ikon na dole ekranu nad lekko przyciemnioną grą (gra widoczna);
# O otwiera panel nad paskiem, P zamyka panel (drugie P - menu).
#   python tools/ui_proste/p3_pasek.py  ->  docs/ui_proste/propozycja_3_pasek_glowne.png, _widok.png
from PIL import Image
from kit import (background, shadow, rrect, text, font, tw, hline, vline, put, put_c, meter, keybar, save, menu_icon,
                 MENU, HERO, PANEL, LINE, TEXT, MUTED, DIM, ACC, ACC_DIM, SEL_TEXT, W, H)
from widoki import DARK, bag_grid, item_detail

CELL, GAP = 84, 14
BAR_Y = 520   # góra komórek


def game_bg():
    img = background(0.62, 0.0)
    # dół ciemniejszy (pod paskiem), góra prawie jak w grze
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for y in range(H):
        a = int(max(0, (y - 300) / (H - 300)) ** 1.6 * 200)
        grad.paste((6, 6, 8, a), (0, y, W, y + 1))
    img.alpha_composite(grad)
    return img


def bar(img, sel, inside=False):
    n = len(MENU)
    total = n * CELL + (n - 1) * GAP
    x = (W - total) / 2
    strip = (x - 18, BAR_Y - 16, x + total + 18, BAR_Y + CELL + 44)
    shadow(img, strip, 16, 4, 8, 120)
    rrect(img, strip, 16, PANEL)
    for key, lab, _ in MENU:
        on = key == sel
        y = BAR_Y - (8 if on and not inside else 0)
        fill = (ACC_DIM if inside else ACC) + (255,) if on else (36, 38, 43, 255)
        rrect(img, (x, y, x + CELL, y + CELL), 12, fill)
        put_c(img, menu_icon(key), x + CELL / 2, y + CELL / 2, )
        f = font("b", 19) if on else font("m", 19)
        text(img, (x + CELL / 2, BAR_Y + CELL + 22), lab, f, TEXT if on else MUTED, anchor="mm")
        x += CELL + GAP
    return strip


def main():
    img = game_bg()
    strip = bar(img, "plecak")
    # podpis wybranej pozycji nad paskiem
    k = [m[0] for m in MENU].index("plecak")
    cx = (W - (7 * CELL + 6 * GAP)) / 2 + k * (CELL + GAP) + CELL / 2
    box = (cx - 170, BAR_Y - 124, cx + 170, BAR_Y - 34)
    shadow(img, box, 12, 4, 8, 120)
    rrect(img, box, 12, PANEL)
    text(img, (cx, box[1] + 30), "Plecak", font("b", 34), TEXT, anchor="mm")
    text(img, (cx, box[1] + 66), "17 rzeczy · obciążenie %d / %d" % HERO["load"], font("m", 21), MUTED, anchor="mm")
    # mały trójkąt w dół do komórki
    from PIL import ImageDraw
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(lay).polygon([(cx - 12, box[3]), (cx + 12, box[3]), (cx, box[3] + 12)], fill=PANEL)
    img.alpha_composite(lay)
    keybar(img, [("A/D", "ruch"), ("O", "otwórz"), ("P", "wróć do gry")])
    save(img, "propozycja_3_pasek_glowne.png")


def view():
    img = game_bg()
    bar(img, "plecak", inside=True)
    box = (110, 24, 1170, 486)
    shadow(img, box)
    rrect(img, box, 16, PANEL)
    x0, y0, x1, y1 = box
    put(img, menu_icon("plecak"), x0 + 22, y0 + 12)
    text(img, (x0 + 100, y0 + 44), "Plecak", font("b", 38), TEXT, anchor="lm")
    text(img, (x1 - 330, y0 + 24), "OBCIĄŻENIE", font("sc", 19), MUTED)
    text(img, (x1 - 30, y0 + 20), "%d / %d" % HERO["load"], font("b", 24), TEXT, anchor="ra")
    meter(img, x1 - 330, y0 + 54, 300, 8, HERO["load"][0] / HERO["load"][1], ACC)
    hline(img, x0 + 20, x1 - 20, y0 + 86, LINE)
    bag_grid(img, (x0 + 28, y0 + 108, x0 + 28 + 6 * 86 + 76, y1 - 20), DARK, sel=131, cell=76, gap=10)
    from kit import para, ITEMS
    hline(img, x0 + 28, x0 + 612, y0 + 374, LINE)
    para(img, x0 + 28, y0 + 388, ITEMS[131]["desc"], font("r", 22), TEXT, 584, 29)
    vline(img, x0 + 640, y0 + 104, y1 - 24, LINE)
    item_detail(img, (x0 + 668, y0 + 104, x1 - 30, y1 - 20), DARK, 131, compact=True)
    keybar(img, [("W/S/A/D", "rzecz"), ("O", "użyj"), ("X", "wyrzuć"), ("P", "zamknij")])
    save(img, "propozycja_3_pasek_widok.png")


if __name__ == "__main__":
    main()
    view()
