# Propozycja 4 „Księga”: jedna rozłożona księga (pergamin, atrament, czerwień rubryk): po lewej spis rozdziałów, po prawej strona;
# O otwiera rozdział na obu stronach, P wraca do spisu (drugie P - do gry).
#   python tools/ui_proste/p4_ksiega.py  ->  docs/ui_proste/propozycja_4_ksiega_glowne.png, _widok.png
from PIL import Image, ImageDraw
from kit import (background, shadow, rrect, rect, text, font, tw, hline, vline, put, put_c, para, keybar, save, menu_icon, icon,
                 MENU, HERO, GOALS, TRACKED_TEXT, W, H)
from widoki import PAPER as P, equipment, hero_head_block, needs_block, attrs_block, fight_block, slot_detail, goal_rows, heading, FIGHT_SHORT

BOOK = (66, 22, 1214, 648)
LP = (88, 38, 638, 630)
RP = (642, 38, 1192, 630)
PAGE = (238, 227, 200)
INK_LINE = (196, 176, 140)


def book(img):
    img.alpha_composite(Image.new("RGBA", img.size, (0, 0, 0, 0)))
    shadow(img, BOOK, 18, 8, 14, 150)
    rrect(img, BOOK, 18, (82, 52, 33, 255))
    rrect(img, (BOOK[0] + 6, BOOK[1] + 6, BOOK[2] - 6, BOOK[3] - 6), 14, None, outline=(60, 37, 23, 255), width=2)
    # brzegi kartek pod stronami
    for k in (3, 2, 1):
        rect(img, (LP[0] + 2, LP[1] + 2 + k * 2, LP[2], LP[3] + k * 2), (214 - k * 12, 198 - k * 12, 166 - k * 12, 255))
        rect(img, (RP[0], RP[1] + 2 + k * 2, RP[2] - 2, RP[3] + k * 2), (214 - k * 12, 198 - k * 12, 166 - k * 12, 255))
    rect(img, LP, PAGE + (255,))
    rect(img, RP, PAGE + (255,))
    # cień grzbietu (łagodny, bez ozdób)
    lay = Image.new("RGBA", (120, LP[3] - LP[1]), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    for x in range(120):
        dist = abs(x - 60)
        a = int(max(0, 1 - dist / 60) ** 2.2 * 70)
        d.line((x, 0, x, lay.height), fill=(90, 62, 36, a))
    img.alpha_composite(lay, (640 - 60, LP[1]))


def toc(img, sel, inside=False):
    x0, y0, x1, y1 = LP
    text(img, (x0 + 36, y0 + 22), HERO["name"], font("b", 38), P["text"])
    text(img, (x0 + 36 + tw(HERO["name"], font("b", 38)) + 14, y0 + 38), "Poziom %d" % HERO["level"], font("b", 23), P["acc"])
    text(img, (x0 + 36, y0 + 72), "Dzień %d · %s · %s · %s" % (HERO["day"], HERO["season"], HERO["time"], HERO["place"]), font("m", 21), P["muted"])
    hline(img, x0 + 30, x1 - 30, y0 + 112, INK_LINE)
    y = y0 + 124
    rh = 66
    for k, (key, lab, sub) in enumerate(MENU):
        on = key == sel
        if on:
            rrect(img, (x0 + 22, y, x1 - 22, y + rh - 2), 8, P["acc"] + (255,))
        put(img, menu_icon(key), x0 + 36, y + (rh - 2 - 64) // 2)
        num = "IVXLC"
        roman = ["I", "II", "III", "IV", "V", "VI", "VII"][k]
        col = P["sel_text"] if on else P["text"]
        text(img, (x0 + 118, y + (rh - 2) / 2), lab, font("b", 32), col, anchor="lm")
        text(img, (x1 - 40, y + (rh - 2) / 2), roman, font("m", 24), P["sel_muted"] if on else P["muted"], anchor="rm")
        y += rh


def journal_page(img):
    x0, y0, x1, y1 = RP
    lx, w = x0 + 38, x1 - x0 - 76
    text(img, (lx, y0 + 22), "Dziennik", font("b", 40), P["text"])
    text(img, (x1 - 38, y0 + 40), "wykonano 8 z 77 celów", font("m", 21), P["muted"], anchor="ra")
    hline(img, x0 + 30, x1 - 30, y0 + 84, INK_LINE)
    y = y0 + 100
    heading(img, lx, y, "PRZYPIĘTY CEL", P, x1 - 38)
    y += 34
    put(img, icon(GOALS[0][1], 2), lx - 4, y - 6)
    text(img, (lx + 70, y + 4), GOALS[0][0], font("b", 28), P["text"])
    text(img, (lx + 70, y + 38), "Kruczy Jar · 175 kroków na południowy wschód", font("m", 20), P["muted"])
    y += 80
    y = para(img, lx, y, TRACKED_TEXT, font("r", 22), P["text"], w, 29)
    y += 16
    heading(img, lx, y, "INNE CELE", P, x1 - 38)
    y += 36
    goal_rows(img, lx, y, w, P, n=5, row=40, start=1)
    text(img, (x1 - 38, y1 - 22), "O – cały dziennik", font("m", 20), P["muted"], anchor="rd")


def main():
    img = background(0.28, 2.0)
    book(img)
    toc(img, "dziennik")
    journal_page(img)
    keybar(img, [("W/S", "rozdział"), ("O", "otwórz"), ("P", "wróć do gry")], y=H - 56)
    save(img, "propozycja_4_ksiega_glowne.png")


def view():
    img = background(0.28, 2.0)
    book(img)
    # lewa strona: figura i miejsca
    x0, y0, x1, y1 = LP
    put(img, menu_icon("postac"), x0 + 28, y0 + 14)
    text(img, (x0 + 104, y0 + 46), "Postać", font("b", 40), P["text"], anchor="lm")
    text(img, (x1 - 36, y0 + 48), "rozdział I", font("m", 21), P["muted"], anchor="rm")
    hline(img, x0 + 30, x1 - 30, y0 + 90, INK_LINE)
    equipment(img, (x0 + 10, y0 + 100, x1 - 10, y1 - 12), P, sel="belt", cell=68, gap=10, labels="name", fig_scale=4)
    # prawa strona: kto to, potrzeby, atrybuty, walka, opis zaznaczonego
    x0, y0, x1, y1 = RP
    cx, w = x0 + 38, x1 - x0 - 76
    y = hero_head_block(img, cx, y0 + 26, w, P)
    y = needs_block(img, cx, y + 16, w, P, cols=2, row=46)
    yA = y + 10
    cw = (w - 34) // 2
    attrs_block(img, cx, yA, cw, P, row=30)
    fight_block(img, cx + cw + 34, yA, cw, P, row=30, rows=FIGHT_SHORT)
    hline(img, cx, x1 - 38, y1 - 172, INK_LINE)
    slot_detail(img, (cx, y1 - 156, x1 - 38, y1 - 64), P, "belt", short=True)
    para(img, cx, y1 - 58, "Po O: tu, na tej stronie, inne pasy z plecaka do wyboru.", font("m", 20), P["muted"], w, 26)
    keybar(img, [("W/S/A/D", "miejsce"), ("O", "zmień"), ("X", "zdejmij"), ("P", "spis")], y=H - 56)
    save(img, "propozycja_4_ksiega_widok.png")


if __name__ == "__main__":
    main()
    view()
