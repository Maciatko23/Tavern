# Zawartość widoków wspólna dla 4 propozycji (plecak, opis rzeczy, ekwipunek, statystyki, cele) - w dwóch paletach:
# DARK (grafit, propozycje 1-3) i PAPER (pergamin, propozycja 4 „Księga”). Zaznaczenie = wypełnienie (bez obramowań).
from PIL import ImageDraw
from kit import (font, text, tw, para, rrect, rect, hline, meter, put, put_c, item_icon, item_name, count, BAG, WORN, SHORT, SLOTS,
                 ITEMS, NEEDS, HERO, ATTRS, GOALS, TRACKED_TEXT, need_icon, hero_figure, keycap, icon, NEED,
                 TEXT, MUTED, DIM, LINE, ACC, SEL_TEXT, GREEN)

DARK = dict(text=TEXT, muted=MUTED, dim=DIM, line=LINE, acc=ACC, sel_text=SEL_TEXT, sel_muted=(70, 44, 26),
            cell=(40, 42, 48, 255), cell_empty=(30, 31, 36, 255), track=(52, 54, 60), head=ACC, good=GREEN,
            cap=(236, 230, 218), ink=SEL_TEXT)
PAPER = dict(text=(54, 39, 28), muted=(116, 94, 70), dim=(160, 140, 112), line=(196, 176, 140), acc=(140, 50, 36),
             sel_text=(248, 238, 214), sel_muted=(238, 206, 188), cell=(224, 208, 174, 255), cell_empty=(229, 216, 188, 255),
             track=(214, 197, 160), head=(140, 50, 36), good=(64, 112, 46), cap=(64, 44, 30), ink=(246, 236, 212))


def heading(img, x, y, s, P, x1=None, n=None):
    """mały nagłówek grupy: kapitaliki w kolorze akcentu + liczba + linia"""
    f = font("sc", 20)
    text(img, (x, y), s, f, P["head"])
    x2 = x + tw(s, f) + 10
    if n is not None:
        text(img, (x2, y), str(n), font("m", 19), P["muted"])
        x2 += tw(str(n), font("m", 19)) + 12
    if x1:
        hline(img, int(x2), int(x1), y + 12, P["line"])


# ------------------------------------------------------------------ plecak: lista z grupami
def bag_list(img, box, P, sel=131, row=42):
    x0, y0, x1, y1 = box
    y = y0
    fn, fc = font("m", 24), font("b", 22)
    more = 0
    for g, ids in BAG:
        if y + 34 + row > y1:
            more += len(ids)
            continue
        heading(img, x0 + 6, y, g.upper(), P, x1 - 6, len(ids))
        y += 34
        for i in ids:
            if y + row > y1:
                more += 1
                continue
            on = i == sel
            if on:
                rrect(img, (x0, y, x1, y + row - 2), 8, tuple(P["acc"]) + (255,))
            put(img, item_icon(i), x0 + 10, y + (row - 2 - 32) // 2)
            col = P["sel_text"] if on else P["text"]
            text(img, (x0 + 54, y + row // 2), SHORT.get(i, item_name(i)), fn, col, anchor="lm")
            if i in WORN:
                text(img, (x1 - 14, y + row // 2), WORN[i], font("m", 19), P["sel_muted"] if on else P["muted"], anchor="rm")
            elif count(i) > 1:
                text(img, (x1 - 14, y + row // 2), "×" + str(count(i)), fc, col, anchor="rm")
            y += row
        y += 8
    if more:
        text(img, ((x0 + x1) / 2, y1 - 2), "▼  jeszcze " + str(more) + " niżej", font("m", 19), P["muted"], anchor="md")


# ------------------------------------------------------------------ plecak: siatka kafelków (propozycja 3)
def bag_grid(img, box, P, sel=131, cell=76, gap=10):
    x0, y0, x1, y1 = box
    cols = max(1, (x1 - x0 + gap) // (cell + gap))
    ids = [i for _, g in BAG for i in g]
    for k, i in enumerate(ids):
        cx, cy = x0 + (k % cols) * (cell + gap), y0 + (k // cols) * (cell + gap)
        on = i == sel
        rrect(img, (cx, cy, cx + cell, cy + cell), 9, tuple(P["acc"]) + (255,) if on else P["cell"])
        put_c(img, item_icon(i, 2), cx + cell / 2, cy + cell / 2 - 2)
        if i in WORN:   # (założone: pasek u dołu)
            rrect(img, (cx + 12, cy + cell - 9, cx + cell - 12, cy + cell - 5), 2, (150, 205, 130, 255) if not on else P["sel_text"] + (255,))
        elif count(i) > 1:
            s = str(count(i))
            f = font("b", 21)
            # (cyfra z ciemną obwódką, czytelna na każdej ikonie)
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1), (1, 1)):
                text(img, (cx + cell - 7 + dx, cy + cell - 4 + dy), s, f, (12, 10, 8), anchor="rd")
            text(img, (cx + cell - 7, cy + cell - 4), s, f, (250, 246, 238), anchor="rd")


# ------------------------------------------------------------------ opis zaznaczonej rzeczy (Kapuśniak)
def item_detail(img, box, P, i=131, compact=False):
    x0, y0, x1, y1 = box
    rrect(img, (x0, y0, x0 + 84, y0 + 84), 10, P["cell"])
    put_c(img, item_icon(i, 2), x0 + 42, y0 + 42)
    text(img, (x0 + 104, y0 + 6), "JEDZENIE", font("sc", 20), P["head"])
    text(img, (x0 + 104, y0 + 30), item_name(i), font("b", 34), P["text"])
    y = y0 + 106
    rows = [("Masz", "1"), ("Waga", "1 za sztukę"), ("Świeżość", "zepsuje się za 4 dni")]
    for k, (a, b) in enumerate(rows):
        text(img, (x0, y), a, font("m", 22), P["muted"])
        text(img, (x1, y), b, font("b", 22), P["good"] if k == 2 else P["text"], anchor="ra")
        y += 32
        hline(img, x0, x1, y - 4, P["line"])
    y += 10
    if not compact:   # (w wersji zwartej opis idzie pod siatkę)
        y = para(img, x0, y, ITEMS[i]["desc"], font("r", 22), P["text"], x1 - x0, 29)
    y += 14
    heading(img, x0, y, "PO ZJEDZENIU", P)
    y += 32
    for key, lab, v in (("stamina", "Kondycja", "+50"), ("food", "Sytość", "+48"), ("water", "Nawodnienie", "+26")):
        rrect(img, (x0 + 2, y + 8, x0 + 12, y + 18), 5, NEED[key] + (255,))
        text(img, (x0 + 22, y), lab, font("m", 22), P["text"])
        text(img, (x1, y), v, font("b", 22), P["text"], anchor="ra")
        y += 30
    if not compact:
        y = max(y + 16, y1 - 44)
        w = keycap(img, x0, y + 20, "O", fill=P["cap"], ink=P["ink"])
        text(img, (x0 + w + 10, y + 21), "Zjedz", font("b", 24), P["text"], anchor="lm")


# ------------------------------------------------------------------ ekwipunek: figura i miejsca
BODY = ["head", "torso", "hands", "belt", "legs", "feet"]           # ubiór (lewa kolumna)
CARRY = ["cloak", "back", "right", "left", "extra"]                 # okrycie, plecy, ręce, dodatek (prawa kolumna)
SLOT = {s[0]: s for s in SLOTS}


def equipment(img, box, P, sel="torso", cell=72, gap=10, labels="side", fig_scale=5):
    """labels: "side" - nazwa miejsca i rzeczy obok komórki (od strony brzegu), "name" - tylko nazwa miejsca"""
    x0, y0, x1, y1 = box
    cxm = (x0 + x1) / 2
    fig = hero_figure(fig_scale)
    col_h = len(BODY) * (cell + gap) - gap
    top = y0 + (y1 - y0 - col_h) / 2
    # cień pod stopami i figura
    rrect(img, (cxm - fig.width * 0.42, top + col_h / 2 + fig.height / 2 - 14, cxm + fig.width * 0.42, top + col_h / 2 + fig.height / 2 + 8),
          12, (0, 0, 0, 70))
    put(img, fig, cxm - fig.width / 2, top + col_h / 2 - fig.height / 2)
    inner = fig.width / 2 + 34
    lx, rx = cxm - inner - cell, cxm + inner
    for col, keys, x in ((0, BODY, lx), (1, CARRY, rx)):
        h = len(keys) * (cell + gap) - gap
        yy = y0 + (y1 - y0 - h) / 2
        for k in keys:
            _, lab, it = SLOT[k]
            on = k == sel
            rrect(img, (x, yy, x + cell, yy + cell), 10, tuple(P["acc"]) + (255,) if on else (P["cell"] if it else P["cell_empty"]))
            if it:
                put_c(img, item_icon(it, 2), x + cell / 2, yy + cell / 2)
            else:
                text(img, (x + cell / 2, yy + cell / 2), "–", font("m", 26), P["sel_text"] if on else P["dim"], anchor="mm")
            ty = yy + cell / 2
            fl, fi = font("m", 19), font("b", 21)
            if labels == "side":
                if col == 0:
                    ax, an = x - 14, "r"
                else:
                    ax, an = x + cell + 14, "l"
                text(img, (ax, ty - 2), lab, fl, P["acc"] if on else P["muted"], anchor=an + "d")
                text(img, (ax, ty + 2), SHORT.get(it, "pusto") if it else "pusto", fi, P["text"] if it else P["dim"], anchor=an + "a")
            else:
                if col == 0:
                    text(img, (x - 12, ty), lab, fl, P["acc"] if on else P["muted"], anchor="rm")
                else:
                    text(img, (x + cell + 12, ty), lab, fl, P["acc"] if on else P["muted"], anchor="lm")
            yy += cell + gap


# ------------------------------------------------------------------ statystyki (głowa karty, potrzeby, atrybuty, walka)
def hero_head_block(img, x, y, w, P, name_size=34):
    text(img, (x, y), HERO["name"], font("b", name_size), P["text"])
    s = "Poziom %d" % HERO["level"]
    text(img, (x + tw(HERO["name"], font("b", name_size)) + 14, y + name_size * 0.32), s, font("b", 22), P["acc"])
    y += name_size + 14
    meter(img, x, y, w - 150, 8, HERO["xp"] / HERO["next"], P["acc"], P["track"])
    text(img, (x + w, y + 4), "%d / %d dośw." % (HERO["xp"], HERO["next"]), font("m", 19), P["muted"], anchor="rm")
    return y + 22


def needs_block(img, x, y, w, P, cols=2, row=40):
    cw = (w - (cols - 1) * 28) / cols
    for k, (key, lab, val, r) in enumerate(NEEDS):
        cx, cy = x + (k % cols) * (cw + 28), y + (k // cols) * row
        put(img, need_icon(key), cx - 4, cy - 4)
        text(img, (cx + 34, cy + 4), lab, font("m", 21), P["text"])
        text(img, (cx + cw, cy + 4), val, font("b", 21), P["text"], anchor="ra")
        meter(img, cx + 34, cy + 30, cw - 34, 6, r, NEED[key], P["track"])
    return y + ((len(NEEDS) + cols - 1) // cols) * row


def attrs_block(img, x, y, w, P, row=34):
    heading(img, x, y, "ATRYBUTY", P, x + w)
    y += 32
    for lab, v in ATTRS:
        text(img, (x, y), lab, font("m", 23), P["text"])
        text(img, (x + w, y), str(v), font("b", 23), P["text"], anchor="ra")
        y += row
    return y


FIGHT_LONG = (("W ręce", "Kamienna siekiera"), ("Cios", "17  ·  zasięg 1,6"), ("Zbroja", "brak"), ("Blok bez tarczy", "45% ciosu"))
FIGHT_SHORT = (("Broń", "siekiera"), ("Cios", "17"), ("Zasięg", "1,6"), ("Zbroja", "brak"), ("Blok", "45%"))
EFFECT = {260: "Opinia w miasteczku rośnie szybciej.", 277: "Udźwig +10.", 275: "Chodzisz trochę szybciej niż boso.",
          270: "Brudu na nich nie widać.", 60: "Cios 17 · zasięg 1,6 · zużycie 70 / 70."}


def fight_block(img, x, y, w, P, row=32, rows=FIGHT_LONG):
    heading(img, x, y, "WALKA", P, x + w)
    y += 32
    for a, b in rows:
        text(img, (x, y), a, font("m", 22), P["muted"])
        text(img, (x + w, y), b, font("b", 22), P["text"], anchor="ra")
        y += row
    return y


def slot_detail(img, box, P, slot="torso", short=False):
    x0, y0, x1, y1 = box
    _, lab, it = SLOT[slot]
    rrect(img, (x0, y0, x0 + 76, y0 + 76), 10, P["cell"])
    put_c(img, item_icon(it, 2), x0 + 38, y0 + 38)
    text(img, (x0 + 94, y0 + 4), lab.upper() + "  ·  NA SOBIE", font("sc", 19), P["head"])
    text(img, (x0 + 94, y0 + 28), item_name(it), font("b", 28), P["text"])
    if short:
        para(img, x0 + 94, y0 + 66, EFFECT[it], font("m", 21), P["good"], x1 - x0 - 94, 27)
    else:
        para(img, x0, y0 + 92, ITEMS[it]["desc"], font("r", 21), P["text"], x1 - x0, 28)


# ------------------------------------------------------------------ cele (dziennik)
def goal_rows(img, x, y, w, P, n=6, row=40, sel=None, start=1):
    for k, (lab, ic, mark) in enumerate(GOALS[start:start + n]):
        on = sel == k
        if on:
            rrect(img, (x - 8, y - 4, x + w, y + row - 8), 8, tuple(P["acc"]) + (255,))
        col = P["sel_text"] if on else (P["muted"] if mark == "done" else P["text"])
        bx = x
        rrect(img, (bx, y + 6, bx + 18, y + 24), 4, None, outline=tuple(col) + (255,), width=2)
        if mark == "done":   # (ptaszek rysowany: czcionka gry nie ma znaku ✓)
            ImageDraw.Draw(img).line([(bx + 4, y + 15), (bx + 8, y + 20), (bx + 16, y + 9)], fill=tuple(col) + (255,), width=3)
        put(img, icon(ic), x + 30, y - 1)
        text(img, (x + 72, y + 15), lab, font("m", 23), col, anchor="lm")
        y += row
    return y
