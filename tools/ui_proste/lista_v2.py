# „Lista v2” (wybrana propozycja 1 + uwagi użytkownika 2026-10-22: „nie powinno być w postaci na sobie, tylko oddzielnie okno
# ekwipunku, ładnie całego”): 8 pozycji, Postać bez „na sobie”, Ekwipunek jako osobne duże okno (+ lista wyboru z podglądem),
# Dziennik z działami na A/D („‹ Cele ›”).
#   python tools/ui_proste/lista_v2.py  ->  docs/ui_proste/lista_v2_glowne.png, _ekwipunek.png, _ekwipunek_wybor.png, _dziennik.png
import os
from PIL import Image
from kit import (background, shadow, rrect, rect, text, font, tw, hline, vline, put, put_c, para, meter, keybar, keycap, save,
                 menu_icon, bust, icon, item_icon, item_name, load, RAW, HERO, GOALS, PANEL, LINE, TEXT, MUTED, DIM, ACC, ACC_DIM,
                 SEL_TEXT, GREEN)
from widoki import DARK, hero_head_block, needs_block, attrs_block, fight_block, heading, FIGHT_SHORT

MENU2 = [("postac", "Postać"), ("ekwipunek", "Ekwipunek"), ("umiejetnosci", "Umiejętności"), ("plecak", "Plecak"),
         ("dziennik", "Dziennik"), ("opcje", "Opcje"), ("zapisz", "Zapisz grę"), ("wyjdz", "Wyjdź")]
LEFT = (40, 36, 420, 652)
RIGHT = (440, 36, 1240, 652)
CELLBG = (40, 42, 48, 255)
EMPTY = (29, 30, 35, 255)


def left_list(img, sel, inside=False):
    x0, y0, x1, y1 = LEFT
    shadow(img, LEFT)
    rrect(img, LEFT, 14, PANEL)
    text(img, (x0 + 26, y0 + 16), "Dzień %d · %s · %s" % (HERO["day"], HERO["season"], HERO["time"]), font("m", 21), MUTED)
    text(img, (x0 + 26, y0 + 42), HERO["place"], font("b", 23), TEXT)
    hline(img, x0 + 20, x1 - 20, y0 + 80, LINE)
    y, rh = y0 + 88, 66
    for key, lab in MENU2:
        on = key == sel
        if on:
            rrect(img, (x0 + 12, y + 1, x1 - 12, y + rh - 3), 10, (ACC_DIM if inside else ACC) + (255,))
        put(img, menu_icon(key), x0 + 26, y + (rh - 64) // 2, 0.4 if inside and not on else 1.0)
        col = (TEXT if inside else SEL_TEXT) if on else (DIM if inside else TEXT)
        text(img, (x0 + 108, y + rh / 2), lab, font("b", 30), col, anchor="lm")
        y += rh


def right_panel(img, title, note=None):
    shadow(img, RIGHT)
    rrect(img, RIGHT, 14, PANEL)
    x0, y0, x1, y1 = RIGHT
    text(img, (x0 + 34, y0 + 24), title, font("b", 40), TEXT)
    if note:
        text(img, (x1 - 34, y0 + 42), note, font("m", 21), DIM, anchor="ra")
    hline(img, x0 + 30, x1 - 30, y0 + 90, LINE)


# ------------------------------------------------------------------ 1 + 2: lista z 8 pozycjami, karta Postaci bez „na sobie”
def glowne():
    img = background(0.30, 1.5)
    left_list(img, "postac")
    right_panel(img, "Postać", "podgląd")
    x0, y0, x1, y1 = RIGHT
    lx, rx = x0 + 34, x1 - 34
    # popiersie
    b = bust(262)
    bw = 230
    rrect(img, (lx, y0 + 106, lx + bw, y0 + 106 + 262), 12, (32, 34, 39, 255))
    put(img, b.crop((int((b.width - bw) / 2), 0, int((b.width - bw) / 2) + bw, 262)), lx, y0 + 106)
    # obok: imię, poziom, potrzeby, sakiewka / dług / opinia
    cx = lx + bw + 26
    w = rx - cx
    y = hero_head_block(img, cx, y0 + 108, w, DARK)
    y = needs_block(img, cx, y + 12, w, DARK, cols=2, row=48)
    y += 10
    cw = w / 3
    for k, (lab, val, col) in enumerate((("Sakiewka", "%d G" % HERO["gold"], (232, 200, 122)),
                                          ("Dług dziadka", "%d G" % HERO["debt_left"], TEXT),
                                          ("Opinia", "10 · Obcy", TEXT))):
        xx = cx + k * cw
        text(img, (xx, y), lab, font("m", 19), MUTED)
        text(img, (xx, y + 24), val, font("b", 24), col)
    text(img, (cx + cw, y + 54), "zostało %d dni" % HERO["debt_days"], font("m", 18), MUTED)
    text(img, (cx + 2 * cw, y + 54), "w miasteczku, z 100", font("m", 18), MUTED)
    # atrybuty i walka
    ya = y0 + 392
    hline(img, x0 + 30, x1 - 30, ya - 12, LINE)
    cw2 = (rx - lx - 50) // 2
    attrs_block(img, lx, ya, cw2, DARK, row=30)
    fight_block(img, lx + cw2 + 50, ya, cw2, DARK, row=30, rows=FIGHT_SHORT)
    keybar(img, [("W/S", "ruch"), ("O", "wybierz"), ("P", "wróć do gry")])
    save(img, "lista_v2_glowne.png")


# ------------------------------------------------------------------ 3: Ekwipunek - osobne duże okno
GRID_L = [["head", "torso"], ["hands", "belt"], ["legs", "feet"]]
GRID_R = [["cloak", "back"], ["right", "left"], ["extra", None]]
NAMES = {"head": "Głowa", "torso": "Tors", "hands": "Rękawice", "belt": "Pas", "legs": "Nogi", "feet": "Stopy", "cloak": "Płaszcz",
         "back": "Plecy", "right": "Prawa ręka", "left": "Lewa ręka", "extra": "Dodatek"}
WORN = {"torso": 260, "belt": 277, "legs": 270, "feet": 275, "right": 60}
CELL, PX, PY = 72, 88, 100
GY = 134   # góra pierwszego rzędu komórek (od góry panelu)


def figure(sheet, scale=4, row=0):
    f = load(os.path.join(RAW, sheet)).crop((0, row * 64, 64, row * 64 + 64))
    return f.resize((64 * scale, 64 * scale), Image.NEAREST)


def slot_grid(img, gx, gy, grid, sel, focus=True, title=None, title_right=False, preview=None):
    if title:
        f = font("sc", 20)
        tx = gx + 2 * CELL + 16 - tw(title, f) if title_right else gx
        text(img, (tx, gy - 34), title, f, ACC)
    for r, rowk in enumerate(grid):
        for c, k in enumerate(rowk):
            if not k:
                continue
            x, y = gx + c * PX, gy + r * PY
            on = k == sel
            it = WORN.get(k)
            fill = ((ACC if focus else ACC_DIM) + (255,)) if on else (CELLBG if it else EMPTY)
            rrect(img, (x, y, x + CELL, y + CELL), 11, fill)
            if it:
                put_c(img, item_icon(it, 2), x + CELL / 2, y + CELL / 2)
            elif preview and k in preview:   # (wybierana rzecz, na próbę - półprzezroczysta)
                ic = icon(preview[k], 2)
                put(img, ic, x + CELL / 2 - 32, y + CELL / 2 - 32, 0.55)
            else:
                text(img, (x + CELL / 2, y + CELL / 2), "–", font("m", 26), SEL_TEXT if on and focus else DIM, anchor="mm")
            col = (ACC if on else (TEXT if it else MUTED))
            text(img, (x + CELL / 2, y + CELL + 12), NAMES[k], font("b" if on else "m", 19), col, anchor="mm")


def doll(img, sel, sheet="hero_walk_ubrany.png", focus=True, caption="przód", preview=None):
    x0, y0, x1, y1 = RIGHT
    lx, rx = x0 + 34, x1 - 34
    gy = y0 + GY
    slot_grid(img, lx, gy, GRID_L, sel, focus, "UBIÓR", preview=preview)
    slot_grid(img, rx - (2 * CELL + 16), gy, GRID_R, sel, focus, "OKRYCIE I RĘCE", title_right=True)
    # postać na środku (cały kadr 64 x 64 powiększony x4: stopy zawsze w tym samym miejscu)
    cx = (lx + 2 * CELL + 16 + rx - (2 * CELL + 16)) / 2
    fig = figure(sheet, 4)
    top = gy - 30
    rrect(img, (cx - 58, top + 246, cx + 58, top + 262), 8, (0, 0, 0, 90))
    put(img, fig, cx - 128, top)
    # obrót: 4 kropki (przód, bok, tył, bok) + podpis
    py = top + 284
    for k in range(4):
        dx = cx - 33 + k * 22
        rrect(img, (dx - 5, py - 5, dx + 5, py + 5), 5, (ACC if k == 0 else (70, 72, 78)) + (255,))
    text(img, (cx, py + 24), caption, font("m", 19), MUTED, anchor="mm")
    return cx


def sums_band(img, y):
    x0, y0, x1, y1 = RIGHT
    lx, rx = x0 + 34, x1 - 34
    rrect(img, (lx - 8, y, rx + 8, y + 50), 10, (32, 34, 39, 255))
    text(img, (lx + 6, y + 25), "RAZEM", font("sc", 19), ACC, anchor="lm")
    items = [("Zbroja", "brak"), ("Ciepło", "brak"), ("Udźwig", "+10"), ("Schludność", "+1"), ("Chód", "+4%")]
    fl, fv = font("m", 20), font("b", 22)
    widths = [tw(a, fl) + 8 + tw(b, fv) for a, b in items]
    x = lx + 96
    gap = (rx - 10 - x - sum(widths)) / (len(items) - 1)
    for (lab, val), wd in zip(items, widths):
        text(img, (x, y + 26), lab, fl, MUTED, anchor="lm")
        text(img, (x + tw(lab, fl) + 8, y + 26), val, fv, TEXT if val != "brak" else DIM, anchor="lm")
        x += wd + gap


def ekwipunek():
    img = background(0.30, 1.5)
    left_list(img, "ekwipunek", inside=True)
    right_panel(img, "Ekwipunek", "działa tylko to, co założone")
    x0, y0, x1, y1 = RIGHT
    lx, rx = x0 + 34, x1 - 34
    doll(img, "belt")
    # karta wybranego miejsca
    yc = y0 + 446
    hline(img, x0 + 30, x1 - 30, yc - 10, LINE)
    rrect(img, (lx, yc, lx + 76, yc + 76), 11, CELLBG)
    put_c(img, item_icon(277, 2), lx + 38, yc + 38)
    text(img, (lx + 94, yc + 2), "PAS  ·  NA SOBIE", font("sc", 19), ACC)
    text(img, (lx + 94, yc + 24), item_name(277), font("b", 28), TEXT)
    text(img, (lx + 94, yc + 60), "Udźwig +10: za pasem zatkniesz więcej.", font("m", 21), GREEN)
    bx = rx - 236
    text(img, (bx, yc + 6), "Zużycie", font("m", 20), MUTED)
    text(img, (rx, yc + 4), "80 / 80 dni", font("b", 21), TEXT, anchor="ra")
    meter(img, bx, yc + 34, 236, 8, 1.0, GREEN)
    text(img, (bx, yc + 54), "Waga", font("m", 20), MUTED)
    text(img, (rx, yc + 52), "1", font("b", 21), TEXT, anchor="ra")
    sums_band(img, y1 - 62)
    keybar(img, [("W/S/A/D", "miejsce"), ("O", "wybierz"), ("X", "zdejmij"), ("Tab", "obróć"), ("P", "wróć")])
    save(img, "lista_v2_ekwipunek.png")


def ekwipunek_wybor():
    img = background(0.30, 1.5)
    left_list(img, "ekwipunek", inside=True)
    right_panel(img, "Ekwipunek", "podgląd: tak będziesz wyglądać")
    x0, y0, x1, y1 = RIGHT
    lx, rx = x0 + 34, x1 - 34
    doll(img, "head", sheet="hero_walk_kapelusz.png", focus=False, caption="podgląd: Słomkowy kapelusz", preview={"head": 528})
    # lista rzeczy z torby, które pasują na głowę
    yl = y0 + 446
    hline(img, x0 + 30, x1 - 30, yl - 10, LINE)
    heading(img, lx, yl, "GŁOWA  ·  Z TORBY", DARK, rx)
    y = yl + 32
    rows = [(528, "Słomkowy kapelusz", "w upał pragnienie rośnie o 20% wolniej", "waga 1"),
            (533, "Brązowa filcowa czapka", "zimą marzniesz o 15% mniej", "waga 1"),
            (None, "Nic", "głowa zostaje odkryta", "")]
    for k, (ic, name, eff, wt) in enumerate(rows):
        on = k == 0
        if on:
            rrect(img, (lx - 8, y, rx + 8, y + 38), 8, ACC + (255,))
        if ic:
            put(img, icon(ic), lx, y + 3)
        else:
            text(img, (lx + 16, y + 19), "–", font("m", 24), SEL_TEXT if on else DIM, anchor="mm")
        col = SEL_TEXT if on else TEXT
        text(img, (lx + 44, y + 19), name, font("b", 23), col, anchor="lm")
        text(img, (lx + 300, y + 19), eff, font("m", 20), (70, 44, 26) if on else MUTED, anchor="lm")
        if wt:
            text(img, (rx, y + 19), wt, font("m", 20), (70, 44, 26) if on else MUTED, anchor="rm")
        y += 40
    keybar(img, [("W/S", "rzecz"), ("O", "załóż"), ("P", "wróć do miejsc")])
    save(img, "lista_v2_ekwipunek_wybor.png")


# ------------------------------------------------------------------ 4: Dziennik - dział na A/D
def dziennik():
    img = background(0.30, 1.5)
    left_list(img, "dziennik", inside=True)
    right_panel(img, "Dziennik")
    x0, y0, x1, y1 = RIGHT
    lx, rx = x0 + 34, x1 - 34
    # przełącznik działów: A ‹ Cele › D
    f = font("b", 30)
    lab = "‹  Cele  ›"
    wl = tw(lab, f)
    xD = rx - 34
    keycap(img, xD, y0 + 46, "D")
    text(img, (xD - 14, y0 + 46), lab, f, ACC, anchor="rm")
    keycap(img, xD - 14 - wl - 14 - 34, y0 + 46, "A")
    text(img, (xD - 14 - wl / 2, y0 + 78), "dział 1 z 10", font("m", 17), MUTED, anchor="mm")
    # lista celów
    y = y0 + 104
    lw = 330
    for k, (name, ic, mark) in enumerate(GOALS[:10]):
        on = k == 0
        if on:
            rrect(img, (lx - 8, y, lx + lw, y + 40), 8, ACC + (255,))
        col = SEL_TEXT if on else TEXT
        put(img, icon(ic), lx, y + 4)
        text(img, (lx + 42, y + 20), name if tw(name, font("m", 22)) < lw - 50 else name[:24] + "…", font("m", 22), col, anchor="lm")
        y += 44
    text(img, (lx, y1 - 32), "Wykonano 8 z 77 celów", font("m", 20), MUTED)
    vline(img, lx + lw + 22, y0 + 108, y1 - 24, LINE)
    # opis wybranego celu
    dx = lx + lw + 46
    dw = rx - dx
    rrect(img, (dx, y0 + 108, dx + 72, y0 + 180), 11, CELLBG)
    put_c(img, icon(GOALS[0][1], 2), dx + 36, y0 + 144)
    text(img, (dx + 88, y0 + 110), "ROZDZIAŁ 1  ·  DŁUG DZIADKA", font("sc", 18), ACC)
    yy = y0 + 134
    for ln in ("Dojdź na działkę", "dziadka"):
        text(img, (dx + 88, yy), ln, font("b", 26), TEXT)
        yy += 30
    y = y0 + 218
    y = para(img, dx, y, "Z podwórza na południe, leśną drogą do Polnej, stamtąd na południe na skraj lasu i dalej na zachód, do "
             "Kruczego Jaru. Budować wolno ci tylko na działce dziadka - w obrębie muru.", font("r", 21), TEXT, dw, 28)
    y += 16
    heading(img, dx, y, "KIERUNEK", DARK)
    text(img, (dx, y + 30), "Kruczy Jar · 175 kroków", font("b", 22), TEXT)
    text(img, (dx, y + 58), "na południowy wschód", font("m", 21), MUTED)
    y += 100
    heading(img, dx, y, "POSTĘP ROZDZIAŁU", DARK)
    meter(img, dx, y + 34, dw - 60, 8, 1 / 7, ACC)
    text(img, (dx + dw, y + 38), "1 z 7", font("b", 20), TEXT, anchor="rm")
    keybar(img, [("A/D", "dział"), ("W/S", "wpis"), ("O", "przypnij"), ("P", "wróć")])
    save(img, "lista_v2_dziennik.png")


if __name__ == "__main__":
    glowne()
    ekwipunek()
    ekwipunek_wybor()
    dziennik()
