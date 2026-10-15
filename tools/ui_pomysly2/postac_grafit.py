# Zakładka POSTAĆ w menu P (Grafit i miedź) - 3 układy (wytyczne użytkownika 2026-10-08): 6 zakładek głównych (Postać, Plecak,
# Dziennik, Opcje, Zapisz grę, Zakończ grę); w Postaci: atrybuty z opisem, obrażenia, odporności, ekwipunek (11 komórek + wybór),
# umiejętności (drzewka). Opis zaznaczonego elementu zawsze w stałym miejscu - nic nie zasłania postaci.
#  A - podzakładki Statystyki / Ekwipunek / Umiejętności (każda na całą szerokość)
#  B - jeden ekran: statystyki | postać z ekwipunkiem | umiejętności (skrót), Enter = drzewko na całym ekranie
#  C - „co to daje”: podgląd +1 w miejscu (zaznaczony atrybut / rzecz podświetla wiersze, na które działa), opis pod listą
# Dane: zrzuty/postac2_dane.json (dane_postac2.js; w grze założone kurtka, tarcza, płaszcz, plecak, buty).
import json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from common2 import *
from p3_grafit import PAN, PAN2, LINE, CU, CU2, TXT, MUT, DIM, COL, FR, FM, FB, FSC, sc
from menu_p_grafit import bar, glow, bust_tile, foot_keys

D = json.load(open(os.path.join(SHOTS2, "postac2_dane.json"), encoding="utf8"))
XP = D["xp"]; FIGHT = D["fight"]; DEF = D["defense"]; ATTRS = {a["id"]: a for a in D["attrs"]}
SLOTS = {s["id"]: s for s in D["slots"]}; CHO = D["choices"]
TREES = D["trees"]; SKILLS = D["skills"]; ROWLV = D["rowLevel"]
NEEDS = [(k, lab, v, val) for k, lab, v, val in D["needs"]]
W8 = D["weight"]
GREEN = "#9fd08a"; WARN = "#e8806a"; DIMT = "#77736b"
CARD = (30, 32, 36, 238)
TREE_TOT = {}
for k in SKILLS:
    TREE_TOT[k["tree"]] = TREE_TOT.get(k["tree"], 0) + k["ranks"]
ATTR_ORDER = ["str", "dex", "con", "per", "wil"]
ATTR_SHORT = {"str": "S", "dex": "Z", "con": "K", "per": "C", "wil": "H"}
ATTR_COL = {"str": "#d8805a", "dex": "#94bf6e", "con": "#dda650", "per": "#62a6dc", "wil": "#b08ad8"}
SLOT_POS_ORDER = ["head", "cloak", "torso", "back", "right", "left", "hands", "belt", "legs", "feet", "extra"]


def bg():
    im = load(os.path.join(SHOTS2, "postac_bez_hud.png")).filter(ImageFilter.GaussianBlur(3.0))
    im.alpha_composite(Image.new("RGBA", im.size, (10, 10, 12, 150)))
    return im


def ptxt(v):
    return str(v).replace(".", ",")


# ------------------------------------------------------------------ wspólne: zakładki główne, pasek dolny, klawisze
def main_tabs(img, act=0):
    items = [("Postać", hero_sprite(0, 1).crop((16, 4, 48, 36))), ("Plecak", icon_key(209, "green")), ("Dziennik", icon_key(121, "dark")),
             ("Opcje", icon_key(83, "dark")), ("Zapisz grę", icon_key(246, "green")), ("Zakończ grę", icon_key(197, "green"))]
    f = FM(18)
    widths = [32 + 8 + tw(n, f) for n, _ in items]
    gap = 40
    total = sum(widths) + gap * (len(items) - 1)
    x = 640 - total / 2
    keycaps(img, x - 58, 30, [("Q", "")], FM(15), LINE, (28, 29, 33, 235), TXT, MUT)
    for i, (n, ic) in enumerate(items):
        on = i == act
        put(img, ic, (x, 26), alpha=1.0 if on else 0.55)
        text(img, (x + 40, 42), n, FB(18) if on else f, TXT if on else MUT, anchor="lm")
        if on:
            with Over(img) as o:
                o.rounded_rectangle((x - 6, 72, x + widths[i] + 6, 74), radius=1, fill=hexc(CU))
        x += widths[i] + gap
    keycaps(img, x - gap + 24, 30, [("E", "")], FM(15), LINE, (28, 29, 33, 235), TXT, MUT)
    with Over(img) as o:
        o.line((60, 80, 1220, 80), fill=LINE)


def bottom_bar(img, y0=618):
    rpanel(img, (96, y0, 1184, y0 + 48), PAN, LINE, r=12)
    put(img, icon(D["goal"]["icon"]), (110, y0 + 8))
    sc(img, (150, y0 + 6), "Cel", 12)
    text(img, (150, y0 + 32), D["goal"]["title"] + " · " + D["goal"]["where"], FM(16), TXT, anchor="lm")
    with Over(img) as o:
        o.line((640, y0 + 10, 640, y0 + 38), fill=LINE); o.line((850, y0 + 10, 850, y0 + 38), fill=LINE)
    sc(img, (660, y0 + 6), "Sakiewka", 12)
    text(img, (660, y0 + 32), f"{D['gold']} G", FM(16), "#e8c87a", anchor="lm")
    sc(img, (870, y0 + 6), "Dług dziadka", 12)
    text(img, (870, y0 + 32), f"{D['debt']['paid']} / {D['debt']['debt']} G", FM(16), TXT, anchor="lm")
    bar(img, 990, y0 + 30, 110, D["debt"]["paid"] / D["debt"]["debt"], CU, h=4)
    text(img, (1168, y0 + 32), f"{D['debt']['days']} dni", FM(16), TXT, anchor="rm")


def panel(img, box, title=None, right=None, r=12):
    rpanel(img, box, PAN, LINE, r=r)
    if title:
        sc(img, (box[0] + 18, box[1] + 12), title, 13)
    if right:
        text(img, (box[2] - 18, box[1] + 20), right, FM(14), CU, anchor="rm")


def hero_figure(scale=4):
    f = load(os.path.join(ROOT, "img", "characters", "Hero_Walk.png")).crop((20, 2, 45, 62))
    return f.resize((f.width * scale, f.height * scale), Image.NEAREST)


def sel_row(img, box, accent=True):
    rpanel(img, box, (46, 48, 54, 255), None, r=6, shadow=0)
    if accent:
        with Over(img) as o:
            o.rectangle((box[0], box[1] + 7, box[0] + 2, box[3] - 7), fill=hexc(CU))


def plus_btn(img, x, y, on=False):
    rpanel(img, (x, y - 11, x + 22, y + 11), None, hexc(CU) if on else LINE, r=5, shadow=0)
    text(img, (x + 11, y), "+", FB(16), CU if on else MUT, anchor="mm")


# ------------------------------------------------------------------ bloki treści
def attrs_block(img, x0, y0, w, sel=None, row_h=36, plus=True, show_points=True):
    for i, aid in enumerate(ATTR_ORDER):
        a = ATTRS[aid]
        y = y0 + i * row_h
        if aid == sel:
            sel_row(img, (x0 - 8, y - 15, x0 + w + 8, y + 17))
        text(img, (x0 + 4, y), a["name"], FM(17), TXT, anchor="lm")
        text(img, (x0 + w - 34, y), str(a["value"]), FB(18), TXT, anchor="rm")
        if plus and XP["points"] > 0:
            plus_btn(img, x0 + w - 24, y, on=(aid == sel))


def fight_rows(w):
    return [("Cios", str(w["hit"]), ("str",)), ("Seria", " / ".join(str(v) for v in w["series"]), ("str",)),
            ("Ciężki cios", f"{w['heavy']}  (pełny {w['heavyFull']})", ("str",)),
            ("Krytyk", f"{ptxt(round(FIGHT['critChance'] * 100, 1))}%  ×1,6 = {w['crit']}", ("per",)),
            ("Zbijanie równowagi", f"{w['poise']}  (ostatni {w['poiseLast']}, ciężki {w['poiseHeavy']})", ("str",)),
            ("Oddech na cios", str(w["breath"]), ()), ("Zasięg", ptxt(w["reach"]) + (" · zamach w wielu" if False else ""), ())]


def next_fight(w):
    s = 1.035   # +1 Siła (Combat.strMult: +3,5% za punkt), zbijanie: +4,5%
    return {"Cios": str(round(w["dmg"] * s)), "Seria": " / ".join(str(round(w["dmg"] * m * s)) for m in (1, 1.1, 1.45)[:len(w["series"])]),
            "Ciężki cios": f"{round(w['dmg'] * 2.2 * s)}  (pełny {round(w['dmg'] * 2.7 * s)})",
            "Zbijanie równowagi": f"{round(30 * 1.045)}  (ostatni {round(45 * 1.045)}, ciężki {round(75 * 1.045)})"}


def defense_rows():
    return [("Życie (najwięcej)", str(DEF["mhp"]), ("con",), None), ("Oddech", str(DEF["breath"]), ("con",), None),
            ("Zbroja · Skórzana kurtka", "−20% obrażeń", (), 435), ("Blok · Drewniana tarcza", "zatrzymuje 75%", (), 417),
            ("Szansa na ranę", "100% zwykłej", ("con",), None), ("Próg przewrócenia", str(DEF["knock"]), ("con",), None),
            ("Zimno · Płaszcz", "nie marzniesz", (), 368), ("Strach i „prawdy”", "opór 15%", ("wil",), None),
            ("Okno parowania", "0,13 s", ("per",), None), ("Przewrót", "24 oddechu · 0,22 s", ("dex",), None)]


def kv_rows(img, x0, y0, w, rows, step=27, f=None, hi=None, nxt=None, dim_others=False):
    f = f or FR(16)
    for i, row in enumerate(rows):
        lab, val = row[0], row[1]
        tags = row[2] if len(row) > 2 else ()
        y = y0 + i * step
        on = hi is not None and (hi in tags or (len(row) > 3 and row[3] == hi))
        dim = dim_others and hi is not None and not on
        if on:
            sel_row(img, (x0 - 8, y - 12, x0 + w + 8, y + 13), accent=True)
        text(img, (x0, y), lab, f, DIMT if dim else (TXT if on else "#cfc9bd"), anchor="lm")
        if nxt and on and lab in nxt:
            nv = nxt[lab]
            vw = tw(nv, FM(16))
            text(img, (x0 + w, y), nv, FM(16), CU, anchor="rm")
            text(img, (x0 + w - vw - 8, y), "→", FM(16), CU, anchor="rm")
            text(img, (x0 + w - vw - 28, y), val, FM(16), MUT, anchor="rm")
        else:
            text(img, (x0 + w, y), val, FM(16), DIMT if dim else TXT, anchor="rm")


def weapon_head(img, x, y, w):
    put(img, icon(SLOTS["right"]["icon"]), (x - 4, y - 16))
    text(img, (x + 34, y - 6), FIGHT["weapon"]["name"], FB(18), TXT, anchor="lm")
    text(img, (x + 34, y + 14), "prawa ręka · [ ] zmienia w trybie walki", FR(14), MUT, anchor="lm")


def attr_desc_block(img, x0, y0, w, aid, table=True, h=None):
    a = ATTRS[aid]
    text(img, (x0, y0 + 10), a["name"], FB(22), TXT, anchor="lm")
    text(img, (x0 + tw(a["name"], FB(22)) + 12, y0 + 12), f"{a['value']} / {a['max']}", FM(15), CU, anchor="lm")
    y = y0 + 34
    for ln in wrapf(a["desc"], FR(16), w if not table else int(w * 0.46)):
        text(img, (x0, y), ln, FR(16), "#d8d2c6"); y += 22
    if table:
        tx = x0 + int(w * 0.5)
        tw_ = w - int(w * 0.5)
        spaced(img, (tx + tw_ - 150, y0 + 2), "teraz", FSC(12), MUT, sp=2, anchor="r")
        spaced(img, (tx + tw_, y0 + 2), "+1 pkt", FSC(12), CU, sp=2, anchor="r")
        for i, r in enumerate(a["rows"]):
            yy = y0 + 26 + i * 21
            text(img, (tx, yy), r["label"], FR(15), "#d8d2c6", anchor="lm")
            text(img, (tx + tw_ - 150, yy), r["now"], FM(15), TXT, anchor="rm")
            text(img, (tx + tw_, yy), r["next"], FM(15), CU, anchor="rm")


def figure_with_slots(img, cx, cy, sel=None, cell=48, spread=150, rows_y=None, labels=True):
    """postać (arkusz chodu x4, piksel-art) pośrodku, 11 komórek wokół (lewa / prawa kolumna + dół)"""
    fig = hero_figure(4)
    with Over(img) as o:
        o.ellipse((cx - 70, cy + fig.height // 2 - 16, cx + 70, cy + fig.height // 2 + 8), fill=(0, 0, 0, 90))
    put(img, fig, (cx - fig.width // 2, cy - fig.height // 2))
    left = ["head", "cloak", "right", "hands", "legs", "feet"]
    right = ["back", "torso", "left", "belt", "extra"]
    anchors = {"head": (0, -100), "cloak": (-22, -40), "torso": (8, -30), "back": (26, -50), "right": (-44, 6), "left": (44, 6),
               "hands": (-40, 20), "belt": (0, 12), "legs": (10, 60), "feet": (-10, 112), "extra": (30, 30)}
    pos = {}
    step = (cell + 18 if cell >= 44 else cell + 14) if labels else cell + 8
    y_start = cy - (len(left) * step) / 2
    for i, s in enumerate(left):
        pos[s] = (cx - spread - cell, y_start + i * step)
    y_start_r = cy - (len(right) * step) / 2
    for i, s in enumerate(right):
        pos[s] = (cx + spread, y_start_r + i * step)
    with Over(img) as o:
        for s, (x, y) in pos.items():
            ax, ay = cx + anchors[s][0], cy + anchors[s][1]
            sx = x + cell if x < cx else x
            o.line((sx, y + cell / 2, (sx + ax) / 2, y + cell / 2), fill=(208, 138, 90, 70) if s == sel else (90, 92, 100, 140))
            o.line(((sx + ax) / 2, y + cell / 2, ax, ay), fill=(208, 138, 90, 70) if s == sel else (90, 92, 100, 140))
            o.ellipse((ax - 2, ay - 2, ax + 2, ay + 2), fill=(150, 150, 160, 200))
    for s, (x, y) in pos.items():
        sl = SLOTS[s]
        on = s == sel
        if on:
            glow(img, (int(x), int(y), int(x + cell), int(y + cell)), r=8, a=120, blur=8)
        rpanel(img, (x, y, x + cell, y + cell), (40, 42, 47, 255) if sl["icon"] else (28, 29, 33, 220), hexc(CU) if on else (LINE if sl["icon"] else (54, 56, 62, 255)),
               r=8, lw=2 if on else 1, shadow=0)
        if sl["icon"]:
            put(img, icon(sl["icon"]), (x + (cell - 32) / 2, y + (cell - 32) / 2 - (3 if sl.get("wear") else 0)))
            if sl.get("wear"):
                bar(img, x + 6, y + cell - 7, cell - 12, sl["wear"]["left"] / sl["wear"]["life"], GREEN, h=3)
        else:
            with Over(img) as o:
                o.line((x + cell / 2 - 7, y + cell / 2, x + cell / 2 + 7, y + cell / 2), fill=(80, 82, 90, 255))
        if labels:
            text(img, (x + cell / 2, y + cell + (9 if cell >= 44 else 7)), sl["label"], FR(13 if cell >= 44 else 12), TXT if on else (MUT if sl["icon"] else DIMT), anchor="mm")
    return pos


def choice_list(img, x0, y0, w, slot="left"):
    sl = SLOTS[slot]
    sc(img, (x0, y0), sl["label"] + " · wybierz", 13)
    items = CHO.get(slot, []) + [{"name": "Pochodnia · zapal", "icon": 436, "worn": False, "note": "gdy masz pochodnię: świeci i płoszy zwierzęta", "ghost": True}]
    y = y0 + 26
    for i, c in enumerate(items):
        on = i == 0
        if on:
            sel_row(img, (x0 - 8, y - 4, x0 + w + 8, y + 40))
        put(img, icon(c["icon"]), (x0, y + 2), alpha=0.45 if c.get("ghost") else 1)
        text(img, (x0 + 42, y + 12), c["name"], FM(17), DIMT if c.get("ghost") else TXT, anchor="lm")
        text(img, (x0 + 42, y + 31), c["note"], FR(14), DIMT if c.get("ghost") else MUT, anchor="lm")
        if c.get("worn"):
            text(img, (x0 + w, y + 12), "założone", FM(14), CU, anchor="rm")
        y += 48
    text(img, (x0 + 42, y + 12), "Zdejmij", FM(17), MUT, anchor="lm")
    return y + 30


def item_desc(img, x0, y0, w, slot="left"):
    sl = SLOTS[slot]
    put(img, icon(sl["icon"], 1.5), (x0, y0))
    text(img, (x0 + 62, y0 + 12), sl["name"], FB(21), TXT, anchor="lm")
    text(img, (x0 + 62, y0 + 36), sl["label"] + " · założone", FR(15), CU, anchor="lm")
    rows = [("Blok zatrzymuje", "75% ciosu"), ("Oddech na blok", "×0,7"), ("Bez tarczy", "blok 45%"), ("Zużycie", f"{sl['wear']['left']} / {sl['wear']['life']}")]
    return rows


# ------------------------------------------------------------------ drzewko umiejętności
def avail(k, learned):
    lv_ok = XP["level"] >= ROWLV[k["row"]]
    from_ok = not k["from"] or any(f in learned for f in k["from"])
    attr_ok = all(XP["attr"].get(a, 0) >= v for a, v in k["attr"].items())
    return lv_ok and from_ok and attr_ok


def draw_tree(img, x0, y0, w, h, tree="melee", sel="m_power", node=(84, 42), learned=None, levels=True):
    learned = learned or {}
    ks = [k for k in SKILLS if k["tree"] == tree]
    nw, nh = node
    rows = max(k["row"] for k in ks) + 1
    rs = (h - nh) / max(1, rows - 1)
    lx = x0 + (46 if levels else 0)
    c0, c1 = min(k["col"] for k in ks), max(k["col"] for k in ks)
    cw = (w - (46 if levels else 0) - nw) / max(1, c1 - c0)
    P = {k["id"]: (lx + (k["col"] - c0) * cw, y0 + k["row"] * rs) for k in ks}
    with Over(img) as o:
        for k in ks:
            for f in k["from"]:
                if f in P:
                    (px_, py_), (cx_, cy_) = P[f], P[k["id"]]
                    a = (px_ + nw / 2, py_ + nh); b = (cx_ + nw / 2, cy_)
                    my = (a[1] + b[1]) / 2
                    col = (208, 138, 90, 200) if f in learned else (78, 80, 88, 255)
                    o.line((a[0], a[1], a[0], my), fill=col, width=2); o.line((a[0], my, b[0], my), fill=col, width=2); o.line((b[0], my, b[0], b[1]), fill=col, width=2)
    if levels:
        for r in range(rows):
            y = y0 + r * rs + nh / 2
            ok = XP["level"] >= ROWLV[r]
            text(img, (x0 + 30, y - 7), "poz.", FR(12), MUT if ok else WARN, anchor="rm")
            text(img, (x0 + 30, y + 8), str(ROWLV[r]), FM(14), TXT if ok else WARN, anchor="rm")
    for k in ks:
        x, y = P[k["id"]]
        on = k["id"] == sel
        av = avail(k, learned)
        rank = learned.get(k["id"], 0)
        if on:
            glow(img, (int(x), int(y), int(x + nw), int(y + nh)), r=8, a=110, blur=8)
        fill = (60, 44, 34, 255) if rank else ((40, 42, 47, 255) if av else (26, 27, 30, 240))
        line = hexc(CU) if on else ((208, 138, 90, 200) if av else (58, 60, 66, 255))
        rpanel(img, (x, y, x + nw, y + nh), fill, line, r=7, lw=2 if on else 1, shadow=0)
        lines = wrapf(k["name"], FM(14), nw - 8)
        for j, ln in enumerate(lines[:2]):
            text(img, (x + nw / 2, y + nh / 2 - 5 - (len(lines[:2]) - 1) * 7 + j * 15), ln, FM(14), TXT if av else DIMT, anchor="mm")
        for j in range(k["ranks"]):
            px0 = x + nw / 2 - k["ranks"] * 5 + j * 10
            with Over(img) as o:
                o.rectangle((px0 + 1, y + nh - 7, px0 + 8, y + nh - 5), fill=hexc(CU) if j < rank else (80, 82, 90, 255))
    return P


def skill_desc(img, x0, y0, w, sid="m_power"):
    k = next(s for s in SKILLS if s["id"] == sid)
    tree = next(t for t in TREES if t["id"] == k["tree"])
    sc(img, (x0, y0), tree["name"] + " · rząd " + str(k["row"] + 1), 13)
    text(img, (x0, y0 + 36), k["name"], FB(24), TXT, anchor="lm")
    text(img, (x0 + w, y0 + 38), f"stopień 0 / {k['ranks']}", FM(15), CU, anchor="rm")
    txt = k["text"].replace("{melee.dmg}", "5%")
    y = y0 + 64
    for ln in wrapf(txt + " Każdy stopień dodaje 5% (razem do 15%).", FR(17), w):
        text(img, (x0, y), ln, FR(17), "#d8d2c6"); y += 24
    y += 8
    for lab, val, ok in (("Wymaga", "poziom 1", True), ("Koszt", "1 pkt umiejętności", True), ("Prowadzi do", "Płynne kombo, Rozpęd", True)):
        text(img, (x0, y), lab, FR(15), MUT, anchor="lm"); text(img, (x0 + w, y), val, FM(15), TXT, anchor="rm"); y += 24
    y += 6
    text(img, (x0, y), "Cios siekierą: 26 → 27", FM(16), CU, anchor="lm")
    return y + 30


# =====================================================================================================================
# A: podzakładki
def a_frame(sub):
    img = bg()
    main_tabs(img, 0)
    names = ["Statystyki", "Ekwipunek", "Umiejętności"]
    f = FM(17)
    widths = [tw(n, f) + 40 for n in names]
    total = sum(widths) + 8 * 2
    x = 640 - total / 2
    rpanel(img, (x - 6, 92, x + total + 6, 126), (24, 25, 29, 220), LINE, r=17, shadow=40)
    for i, n in enumerate(names):
        on = i == sub
        if on:
            rpanel(img, (x, 96, x + widths[i], 122), (52, 54, 60, 255), hexc(CU), r=13, shadow=0)
        text(img, (x + widths[i] / 2, 109), n, FB(17) if on else f, TXT if on else MUT, anchor="mm")
        if i == 2:
            text(img, (x + widths[i] - 10, 100), "5", FB(12), CU, anchor="mm")
        x += widths[i] + 8
    keycaps(img, 640 - total / 2 - 54, 97, [("Z", "")], FM(14), LINE, (28, 29, 33, 235), TXT, MUT, h=22)
    keycaps(img, 640 + total / 2 + 22, 97, [("C", "")], FM(14), LINE, (28, 29, 33, 235), TXT, MUT, h=22)
    bottom_bar(img)
    return img


def A_stats():
    img = a_frame(0)
    # nagłówek: kim jestem + stan
    panel(img, (96, 138, 1184, 200))
    bust_tile(img, 106, 144, 50, 50, scale=0.34, dx=-2, dy=-3, r=8)
    text(img, (168, 158), D["name"], FB(22), TXT, anchor="lm")
    text(img, (168, 180), f"Poziom {XP['level']} · {XP['xp']} / {XP['need']} dośw.", FR(14), CU, anchor="lm")
    bar(img, 330, 179, 140, XP["ratio"], CU, h=4)
    for i, (k, lab, v, val) in enumerate(NEEDS):
        x = 500 + i * 172
        put(img, need_icon(k), (x, 153))
        text(img, (x + 38, 162), lab, FR(15), TXT, anchor="lm")
        text(img, (x + 152, 162), val, FM(15), TXT, anchor="rm")
        bar(img, x + 38, 178, 114, v, COL[k], h=3)
    # kolumny
    panel(img, (96, 212, 420, 456), "Atrybuty", f"{XP['points']} pkt do rozdania")
    attrs_block(img, 114, 262, 288, sel="str", row_h=38)
    panel(img, (432, 212, 808, 456), "Obrażenia")
    weapon_head(img, 452, 262, 336)
    kv_rows(img, 452, 300, 336, fight_rows(FIGHT["weapon"])[:6], step=24)
    text(img, (452, 446), f"Bez broni: cios {FIGHT['fists']['hit']}, seria {' / '.join(map(str, FIGHT['fists']['series']))}", FR(13), MUT, anchor="lm")
    panel(img, (820, 212, 1184, 456), "Odporności")
    kv_rows(img, 838, 254, 328, [(r[0], r[1]) for r in defense_rows()][:8], step=24)
    text(img, (838, 446), "+ parowanie 0,13 s · przewrót 24 oddechu", FR(13), MUT, anchor="lm")
    # stały panel opisu
    panel(img, (96, 468, 1184, 604), "Opis zaznaczonego")
    attr_desc_block(img, 116, 500, 1048, "str")
    foot_keys(img, 640, 684, [("Q/E", "zakładka"), ("Z/C", "podzakładka"), ("↑↓←→", "wybierz"), ("Enter", "rozdaj punkt"), ("Esc", "wróć do gry")])
    return img


def A_equip():
    img = a_frame(1)
    panel(img, (96, 138, 640, 604), "Ekwipunek", "towarzysz: pies")
    figure_with_slots(img, 368, 372, sel="left", cell=48, spread=120)
    panel(img, (652, 138, 1184, 400))
    choice_list(img, 672, 152, 492, "left")
    panel(img, (652, 412, 1184, 604), "Opis zaznaczonego")
    rows = item_desc(img, 672, 438, 492, "left")
    kv_rows(img, 900, 448, 264, rows, step=26, f=FR(15))
    text(img, (672, 560), "Działa tylko to, co założone. Pochodnia w lewej ręce", FR(14), MUT, anchor="lm")
    text(img, (672, 580), "odkłada tarczę na plecy, dopóki płonie.", FR(14), MUT, anchor="lm")
    foot_keys(img, 640, 684, [("Q/E", "zakładka"), ("Z/C", "podzakładka"), ("↑↓←→", "komórka"), ("Enter", "załóż"), ("X", "zdejmij"), ("Esc", "wróć")])
    return img


def domains(img, x0, y0, w, sel="melee", step=40, learned=None):
    for i, t in enumerate(TREES):
        y = y0 + i * step
        on = t["id"] == sel
        if on:
            sel_row(img, (x0 - 8, y - 15, x0 + w + 8, y + 17))
        text(img, (x0 + 4, y - 2), t["name"], FB(17) if on else FM(17), TXT if on else "#cfc9bd", anchor="lm")
        text(img, (x0 + w, y - 2), f"0/{TREE_TOT[t['id']]}", FR(14), MUT, anchor="rm")
        bar(img, x0 + 4, y + 11, w - 4, 0, CU, h=2)


def A_skills():
    img = a_frame(2)
    panel(img, (96, 138, 360, 604), "Dziedziny", f"{XP['skillPoints']} pkt")
    domains(img, 114, 188, 228)
    panel(img, (372, 138, 836, 604))
    text(img, (604, 164), "Walka wręcz", FB(20), CU, anchor="mm")
    draw_tree(img, 388, 190, 432, 396, "melee", "m_power")
    panel(img, (848, 138, 1184, 604), "Opis zaznaczonego")
    skill_desc(img, 868, 170, 296)
    rpanel(img, (868, 520, 1164, 560), hexc(CU), None, r=8, shadow=0)
    text(img, (1016, 540), "Enter: naucz się (1 pkt)", FB(16), "#1a1310", anchor="mm")
    foot_keys(img, 640, 684, [("Q/E", "zakładka"), ("Z/C", "podzakładka"), ("↑↓", "dziedzina"), ("→", "drzewko"), ("Enter", "naucz się"), ("Esc", "wróć")])
    return img


# =====================================================================================================================
# B: jeden ekran
def b_frame():
    img = bg()
    main_tabs(img, 0)
    bottom_bar(img)
    return img


def B_left(img, sel_attr=None):
    panel(img, (96, 96, 420, 500), "Atrybuty", f"{XP['points']} pkt")
    attrs_block(img, 112, 140, 292, sel=sel_attr, row_h=31)
    with Over(img) as o:
        o.line((112, 288, 404, 288), fill=LINE)
    sc(img, (112, 298), "Obrażenia · " + FIGHT["weapon"]["name"], 12)
    w = FIGHT["weapon"]
    kv_rows(img, 112, 330, 292, [("Cios / seria", " / ".join(map(str, w["series"]))), ("Ciężki cios", f"{w['heavy']} (pełny {w['heavyFull']})"),
                                  ("Krytyk", f"3% · {w['crit']}"), ("Zbijanie równowagi", f"{w['poise']} / {w['poiseHeavy']}")], step=23, f=FR(15))
    with Over(img) as o:
        o.line((112, 420, 404, 420), fill=LINE)
    sc(img, (112, 430), "Odporności", 12)
    kv_rows(img, 112, 460, 292, [("Zbroja / blok", "−20% · 75%"), ("Rana · przewrócenie", "100% · 60")], step=23, f=FR(15))


def B_right(img, sel=None):
    panel(img, (860, 96, 1184, 500), "Umiejętności", f"{XP['skillPoints']} pkt do nauki")
    domains(img, 876, 140, 292, sel=sel, step=33)
    text(img, (1022, 482), "Enter: drzewko na całym ekranie", FR(14), MUT, anchor="mm")


def B_center(img, sel_slot=None):
    rpanel(img, (432, 96, 848, 500), (22, 23, 26, 200), LINE, r=12, shadow=40)
    text(img, (450, 118), D["name"], FB(22), TXT, anchor="lm")
    text(img, (450, 141), f"Poziom {XP['level']} · {XP['xp']} / {XP['need']}", FR(14), CU, anchor="lm")
    bar(img, 450, 154, 120, XP["ratio"], CU, h=3)
    for i, (k, lab, v, val) in enumerate(NEEDS):
        x = 592 + i * 62
        put(img, need_icon(k), (x, 102))
        text(img, (x + 16, 144), val, FM(13), TXT, anchor="mm")
        bar(img, x + 2, 154, 28, v, COL[k], h=3)
    with Over(img) as o:
        o.line((448, 166, 832, 166), fill=LINE)
    figure_with_slots(img, 640, 330, sel=sel_slot, cell=40, spread=92, labels=True)


def B_main():
    img = b_frame()
    B_left(img, "str"); B_center(img); B_right(img)
    panel(img, (96, 512, 1184, 606), None)
    a = ATTRS["str"]
    text(img, (116, 532), a["name"], FB(20), TXT, anchor="lm")
    text(img, (180, 534), "5 / 60", FM(14), CU, anchor="lm")
    y = 556
    for ln in wrapf(a["desc"], FR(15), 420):
        text(img, (116, y), ln, FR(15), "#d8d2c6"); y += 20
    spaced(img, (900, 520), "teraz", FSC(12), MUT, sp=2, anchor="r"); spaced(img, (1004, 520), "+1 pkt", FSC(12), CU, sp=2, anchor="r")
    for i, r in enumerate(a["rows"]):
        yy = 544 + i * 17
        text(img, (560, yy), r["label"], FR(14), "#d8d2c6", anchor="lm")
        text(img, (900, yy), r["now"], FM(14), TXT, anchor="rm"); text(img, (1004, yy), r["next"], FM(14), CU, anchor="rm")
    foot_keys(img, 640, 684, [("Q/E", "zakładka"), ("↑↓←→", "wybierz"), ("Tab", "kolumna"), ("Enter", "rozdaj / załóż / drzewko"), ("Esc", "wróć")])
    return img


def B_equip():
    img = b_frame()
    B_left(img); B_center(img, "left"); B_right(img)
    panel(img, (96, 512, 1184, 606), None)
    sc(img, (116, 524), "Lewa ręka · wybierz", 12)
    x = 116
    opts = [(417, "Drewniana tarcza", "blok 75% · zużycie 40/40", True, False), (436, "Pochodnia · zapal", "gdy masz pochodnię", False, True), (None, "Zdejmij", "lewa ręka wolna", False, False)]
    for i, (ic, nm, note, worn, ghost) in enumerate(opts):
        w_ = 300
        on = i == 0
        rpanel(img, (x, 546, x + w_, 596), (46, 48, 54, 255) if on else (32, 34, 38, 255), hexc(CU) if on else LINE, r=8, lw=2 if on else 1, shadow=0)
        if ic:
            put(img, icon(ic), (x + 8, 555), alpha=0.45 if ghost else 1)
        text(img, (x + (48 if ic else 16), 563), nm, FM(16), DIMT if ghost else TXT, anchor="lm")
        text(img, (x + (48 if ic else 16), 582), note, FR(13), DIMT if ghost else MUT, anchor="lm")
        if worn:
            text(img, (x + w_ - 10, 563), "założone", FM(13), CU, anchor="rm")
        x += w_ + 12
    text(img, (1164, 572), "Enter: załóż", FM(15), CU, anchor="rm")
    foot_keys(img, 640, 684, [("←→", "wybór"), ("Enter", "załóż"), ("Esc", "wróć do komórek")])
    return img


def B_tree():
    img = b_frame()
    panel(img, (96, 96, 1184, 606))
    text(img, (116, 120), "Umiejętności", FB(22), TXT, anchor="lm")
    text(img, (260, 122), f"{XP['skillPoints']} pkt do nauki · poziom {XP['level']}", FR(15), CU, anchor="lm")
    # dziedziny jako zakładki w rzędzie
    x = 116
    for t in TREES:
        on = t["id"] == "melee"
        wv = tw(t["name"], FM(15)) + 20
        if on:
            rpanel(img, (x, 140, x + wv, 166), (52, 54, 60, 255), hexc(CU), r=13, shadow=0)
        text(img, (x + wv / 2, 153), t["name"], FB(15) if on else FM(15), TXT if on else MUT, anchor="mm")
        x += wv + 6
    draw_tree(img, 120, 186, 640, 400, "melee", "m_power", node=(96, 44))
    with Over(img) as o:
        o.line((800, 186, 800, 590), fill=LINE)
    skill_desc(img, 824, 192, 340)
    rpanel(img, (824, 540, 1164, 580), hexc(CU), None, r=8, shadow=0)
    text(img, (994, 560), "Enter: naucz się (1 pkt)", FB(16), "#1a1310", anchor="mm")
    foot_keys(img, 640, 684, [("Q/E", "dziedzina"), ("↑↓←→", "umiejętność"), ("Enter", "naucz się"), ("Esc", "wróć do Postaci")])
    return img


# =====================================================================================================================
# C: „co to daje” - podgląd w miejscu
def c_frame():
    img = bg()
    main_tabs(img, 0)
    bottom_bar(img)
    panel(img, (96, 92, 1184, 150))
    bust_tile(img, 106, 98, 46, 46, scale=0.31, dx=-2, dy=-3, r=8)
    text(img, (164, 110), D["name"], FB(21), TXT, anchor="lm")
    text(img, (164, 133), f"Poziom {XP['level']} · {XP['xp']} / {XP['need']} dośw.", FR(14), CU, anchor="lm")
    bar(img, 326, 132, 90, XP["ratio"], CU, h=3)
    for i, (k, lab, v, val) in enumerate(NEEDS):
        x = 440 + i * 130
        put(img, need_icon(k), (x, 104))
        text(img, (x + 112, 113), val, FM(15), TXT, anchor="rm")
        bar(img, x + 36, 128, 76, v, COL[k], h=3)
    rpanel(img, (970, 106, 1170, 136), None, hexc(CU), r=15, shadow=0)
    text(img, (1070, 121), f"{XP['points']} pkt atrybutów · {XP['skillPoints']} umiejętności", FM(14), CU, anchor="mm")
    return img


def C_attrs(img, sel=None, desc=True):
    panel(img, (96, 162, 380, 520), "Atrybuty")
    for i, aid in enumerate(ATTR_ORDER):
        a = ATTRS[aid]
        y = 202 + i * 34
        if aid == sel:
            sel_row(img, (106, y - 15, 370, y + 16))
        with Over(img) as o:
            o.ellipse((116, y - 9, 134, y + 9), fill=hexc(ATTR_COL[aid], 60), outline=hexc(ATTR_COL[aid]))
        text(img, (125, y), ATTR_SHORT[aid], FB(12), ATTR_COL[aid], anchor="mm")
        text(img, (144, y), a["name"], FM(17), TXT, anchor="lm")
        text(img, (330, y), str(a["value"]), FB(18), TXT, anchor="rm")
        plus_btn(img, 338, y, on=(aid == sel))
    if desc and sel:
        with Over(img) as o:
            o.line((114, 376, 362, 376), fill=LINE)
        y = 388
        for ln in wrapf(ATTRS[sel]["desc"], FR(15), 246)[:5]:
            text(img, (114, y), ln, FR(15), "#d8d2c6"); y += 20
        text(img, (114, y + 6), "+1 pkt: zmiany świecą obok →", FM(14), CU)


def tag_dots(img, x, y, tags):
    for j, tg in enumerate(tags):
        with Over(img) as o:
            o.ellipse((x + j * 14 - 6, y - 6, x + j * 14 + 6, y + 6), fill=hexc(ATTR_COL[tg], 50), outline=hexc(ATTR_COL[tg]))
        text(img, (x + j * 14, y), ATTR_SHORT[tg], FB(9), ATTR_COL[tg], anchor="mm")


def C_effects(img, hi_attr=None, hi_item=None):
    panel(img, (392, 162, 808, 520))
    w = FIGHT["weapon"]
    put(img, icon(SLOTS["right"]["icon"]), (404, 168))
    sc(img, (442, 174), "Obrażenia · " + w["name"], 12)
    nxt = next_fight(w) if hi_attr == "str" else None
    rows = [("Cios", str(w["hit"]), ("str",)), ("Seria", " / ".join(map(str, w["series"])), ("str",)), ("Ciężki cios", f"{w['heavy']}  (pełny {w['heavyFull']})", ("str",)),
            ("Krytyk", f"3%  ×1,6 = {w['crit']}", ("per",)), ("Zbijanie równowagi", f"{w['poise']} (ciężki {w['poiseHeavy']})", ("str",))]
    if nxt:
        nxt = dict(nxt); nxt["Zbijanie równowagi"] = f"{round(w['poise'] * 1.045)} ({round(w['poiseHeavy'] * 1.045)})"
    hi = hi_attr
    for i, row in enumerate(rows):
        y = 210 + i * 27
        tag_dots(img, 416, y, row[2])
        sub = [(row[0], row[1], row[2])]
        kv_rows(img, 436, y, 356, sub, hi=hi, nxt=nxt, dim_others=bool(hi_attr or hi_item))
    with Over(img) as o:
        o.line((410, 352, 790, 352), fill=LINE)
    sc(img, (416, 362), "Odporności", 12)
    drows = defense_rows()
    # odporności - 2 kolumny po 4, żeby zmieściły się w panelu
    cols = [drows[0:4], [drows[4], drows[5], drows[6], drows[7]]]
    nd = {"Życie (najwięcej)": "120", "Oddech": "102", "Szansa na ranę": "98,6%", "Próg przewrócenia": "62"} if hi_attr == "con" else None
    for c, lst in enumerate(cols):
        for i, (lab, val, tags, item_icon) in enumerate(lst):
            y = 392 + i * 32
            x0 = 416 + c * 196
            on = (hi_attr in tags) or (hi_item is not None and item_icon == hi_item)
            dim = (hi_attr or hi_item) and not on
            if on:
                sel_row(img, (x0 - 6, y - 13, x0 + 184, y + 14))
            if tags:
                tag_dots(img, x0 + 4, y, tags)
            elif item_icon:
                put(img, icon(item_icon).resize((16, 16), Image.LANCZOS), (x0 - 4, y - 8))
            short = lab.split(" · ")[0]
            text(img, (x0 + 18, y - 7), short, FR(14), DIMT if dim else "#cfc9bd", anchor="lm")
            text(img, (x0 + 18, y + 9), val if not (nd and short in nd) else f"{val} → {nd[short]}", FM(14), DIMT if dim else (CU if (nd and short in nd) else TXT), anchor="lm")


def C_equip(img, sel=None, choose=False):
    panel(img, (820, 162, 1184, 520), "Ekwipunek", "towarzysz: pies")
    order = SLOT_POS_ORDER
    cw, chh = 80, 74
    for i, s in enumerate(order):
        c, r = i % 4, i // 4
        x, y = 836 + c * (cw + 4), 192 + r * (chh + 6)
        sl = SLOTS[s]
        on = s == sel
        if on:
            glow(img, (x, y, x + cw, y + chh), r=8, a=110, blur=7)
        rpanel(img, (x, y, x + cw, y + chh), (40, 42, 47, 255) if sl["icon"] else (28, 29, 33, 220), hexc(CU) if on else (LINE if sl["icon"] else (54, 56, 62, 255)), r=8, lw=2 if on else 1, shadow=0)
        if sl["icon"]:
            put(img, icon(sl["icon"]), (x + cw / 2 - 16, y + 8))
            if sl.get("wear"):
                bar(img, x + 10, y + 44, cw - 20, sl["wear"]["left"] / sl["wear"]["life"], GREEN, h=3)
        else:
            with Over(img) as o:
                o.line((x + cw / 2 - 8, y + 24, x + cw / 2 + 8, y + 24), fill=(80, 82, 90, 255))
        text(img, (x + cw / 2, y + 60), sl["label"], FR(13), TXT if on else (MUT if sl["icon"] else DIMT), anchor="mm")
    if choose:
        # wybór w samym panelu ekwipunku (zamiast dymku na postaci)
        rpanel(img, (836, 352, 1168, 508), (24, 25, 29, 250), hexc(CU), r=10, shadow=60)
        choice_list(img, 852, 364, 300, "left")


def C_skills_strip(img, sel=None):
    panel(img, (96, 528, 1184, 610), "Umiejętności", f"{XP['skillPoints']} pkt · Enter: drzewko")
    x = 112
    wv = (1184 - 112 - 16 - 9 * 6) / 10
    for t in TREES:
        on = t["id"] == sel
        rpanel(img, (x, 560, x + wv, 600), (46, 48, 54, 255) if on else (32, 34, 38, 255), hexc(CU) if on else LINE, r=8, lw=2 if on else 1, shadow=0)
        nm = t["name"] if tw(t["name"], FM(14)) < wv - 8 else t["name"].split(" ")[0]
        text(img, (x + wv / 2, 574), nm, FM(14), TXT if on else "#cfc9bd", anchor="mm")
        text(img, (x + wv / 2, 591), f"0/{TREE_TOT[t['id']]}", FR(12), MUT, anchor="mm")
        x += wv + 6


def C_main():
    img = c_frame()
    C_attrs(img, "str"); C_effects(img, hi_attr="str"); C_equip(img); C_skills_strip(img)
    foot_keys(img, 640, 684, [("Q/E", "zakładka"), ("↑↓←→", "wybierz"), ("Tab", "panel"), ("Enter", "rozdaj punkt"), ("Esc", "wróć do gry")])
    return img


def C_equip_state():
    img = c_frame()
    C_attrs(img, None, desc=False)
    with Over(img) as o:
        o.line((114, 376, 362, 376), fill=LINE)
    put(img, icon(417, 1.5), (114, 388))
    text(img, (170, 400), "Drewniana tarcza", FB(18), TXT, anchor="lm")
    text(img, (170, 422), "lewa ręka · założone", FR(14), CU, anchor="lm")
    y = 452
    for ln in wrapf("Blok zatrzymuje 75% ciosu (bez tarczy 45%), oddech na blok ×0,7. Zużycie 40 / 40.", FR(15), 246):
        text(img, (114, y), ln, FR(15), "#d8d2c6"); y += 20
    C_effects(img, hi_item=417); C_equip(img, "left", choose=True); C_skills_strip(img)
    foot_keys(img, 640, 684, [("↑↓", "wybór"), ("Enter", "załóż"), ("X", "zdejmij"), ("Esc", "wróć do komórek")])
    return img


def C_tree():
    img = c_frame()
    C_attrs(img, None, desc=False)
    with Over(img) as o:
        o.line((114, 376, 362, 376), fill=LINE)
    # opis umiejętności w stałym miejscu (pod atrybutami)
    k = next(s for s in SKILLS if s["id"] == "m_power")
    text(img, (114, 396), "Mocna ręka", FB(19), TXT, anchor="lm")
    text(img, (362, 398), "0 / 3", FM(14), CU, anchor="rm")
    y = 418
    for ln in wrapf("Obrażenia wręcz +5% za stopień (do 15%). Wymaga poziomu 1. Prowadzi do: Płynne kombo, Rozpęd.", FR(15), 246):
        text(img, (114, y), ln, FR(15), "#d8d2c6"); y += 20
    text(img, (114, y + 8), "Cios siekierą: 26 → 27", FM(14), CU)
    panel(img, (392, 162, 1184, 520))
    text(img, (412, 182), "Walka wręcz", FB(19), CU, anchor="lm")
    text(img, (1164, 182), "stopni 0 / 19 · Esc: wróć", FR(14), MUT, anchor="rm")
    draw_tree(img, 408, 200, 760, 306, "melee", "m_power", node=(104, 38))
    C_skills_strip(img, "melee")
    foot_keys(img, 640, 684, [("←→", "dziedzina"), ("↑↓←→", "umiejętność"), ("Enter", "naucz się"), ("Esc", "wróć")])
    return img


if __name__ == "__main__":
    outs = {
        "postac_A.png": A_stats(), "postac_A_ekwipunek.png": A_equip(), "postac_A_umiejetnosci.png": A_skills(),
        "postac_B.png": B_main(), "postac_B_ekwipunek.png": B_equip(), "postac_B_drzewko.png": B_tree(),
        "postac_C.png": C_main(), "postac_C_ekwipunek.png": C_equip_state(), "postac_C_drzewko.png": C_tree(),
    }
    for n, im in outs.items():
        print(save2(im, n))
