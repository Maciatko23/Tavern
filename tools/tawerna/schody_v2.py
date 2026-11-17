# -*- coding: utf-8 -*-
"""Schody tawerny, druga tura uwag gracza (2026-11-16):
  1. nad KAŻDYM biegiem ciemne pole z napisem, dokąd prowadzi, i strzałką (parter Map001, piętro I Map025, piętro II Map026);
  2. złota krata znika - przy schodach w górę stoi odźwierny tawerny i pilnuje, kto może wejść (schodzić może każdy): krata zostaje
     jako NIEWIDZIALNA zapora na dwóch kratkach biegu (ten sam znacznik TavernLife <Tavern:gate>), odźwierny stoi na trzeciej;
  3. balustrady: porządne, równe, pełne po obu stronach - własne obrazki w drewnie Winlu (poręcz, szczebelki, dolna listwa, słupki
     z nakrywą na końcach i w połowie, od korytarza przęsło ze szczebelkami) zamiast cienkich kafli.
Edycja map NA MIEJSCU (gracz poprawia je ręcznie).
  python tools/tawerna/schody_v2.py <podglad.png>            (obrazki do podglądu, nic nie zapisuje w grze)
  python tools/tawerna/schody_v2.py <podglad.png> --wykonaj  (obrazki do img/characters, Map001/025/026; edytor zamknięty)"""
import copy, datetime, importlib.util, os, re, shutil, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH = os.path.abspath(os.path.join(ROOT, "..", "Tawerna_archiwum_2026-11-08"))
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import mapylib as L
spec = importlib.util.spec_from_file_location("rozszerzenia_wspolne", os.path.join(ROOT, "tools", "rozszerzenia", "wspolne.py"))
RW = importlib.util.module_from_spec(spec); spec.loader.exec_module(RW)

# the wood of the tileset's own railing (Fantasy_Inside_B, tiles 188-190)
OUT, DARK, MID, LIGHT, HI = (61, 47, 49, 255), (71, 55, 51, 255), (98, 76, 67, 255), (116, 92, 77, 255), (138, 111, 93, 255)
BLACK = 1536


# ------------------------------------------------------------------------------------------------ the pictures
def rail(px, x, y0, y1, flip=False):
    """a balustrade running north-south seen from above: a stout handrail 10 px wide from x, a soft shadow beside it"""
    cols = [OUT, HI, LIGHT, LIGHT, MID, MID, MID, DARK, DARK, OUT, (0, 0, 0, 110), (0, 0, 0, 60)]
    if flip: cols = cols[::-1]; x -= 2
    for y in range(y0, y1):
        for i, c in enumerate(cols): px[x + i, y] = c
        if y % 48 in (20, 21):                                # (the joints of the boards)
            for i in range(1, 9): px[x + i + (2 if flip else 0), y] = DARK if y % 48 == 20 else HI


def newel(px, cx, y):
    """a post with its cap, 12 x 16, its middle at cx"""
    x0 = cx - 6
    for yy in range(y, y + 16):
        for xx in range(x0, x0 + 12):
            edge = xx in (x0, x0 + 11) or yy in (y, y + 15)
            cap = yy < y + 5
            px[xx, yy] = OUT if edge else (HI if cap and xx < x0 + 4 else LIGHT if cap else MID if xx < x0 + 7 else DARK)
    for xx in range(max(0, x0 - 1), min(48, x0 + 13)): px[xx, y + 5] = OUT    # (the cap's lip)


def balustrade(kind, tiles=7):
    """kind: "mid" - between two flights (a rail on each side of the dark well, a bay of balusters at the corridor's end);
    "r" - a single one on the left of its cell (the flight is on its left); "l" - a single one on the right of its cell"""
    h = tiles * 48
    im = Image.new("RGBA", (48, h), (0, 0, 0, 0)); px = im.load()
    top, bot = 6, h - 4
    if kind in ("mid", "r"): rail(px, 1, top, bot)
    if kind in ("mid", "l"): rail(px, 37, top, bot, flip=True)
    for cx in ([6] if kind == "r" else [42] if kind == "l" else [6, 42]):
        for y in (2, 2 + (h - 20) // 3, 2 + 2 * (h - 20) // 3, h - 18): newel(px, cx, y)
    if kind == "mid":
        for (y0) in (8, h - 12):                              # the cross rails at both ends...
            for x in range(12, 36):
                for k, c in enumerate((OUT, LIGHT, MID, OUT)): px[x, y0 + k] = c
        for x in range(14, 34, 5):                            # ...and the bay of balusters facing the corridor
            for y in range(h - 26, h - 12):
                px[x, y] = OUT; px[x + 1, y] = MID; px[x + 2, y] = OUT
        for x in range(12, 36):
            for k, c in enumerate((OUT, HI, LIGHT, OUT)): px[x, h - 30 + k] = c
    return im


def label(text, up):
    """the words over a flight on the dark band: small caps in warm gold, an arrow after them"""
    im = Image.new("RGBA", (144, 48), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(os.path.join(ROOT, "fonts", "AlegreyaSC-Bold.ttf"), 20)
    w = d.textlength(text, font=f)
    aw, gap = 14, 8
    x0 = (144 - (w + gap + aw)) / 2
    gold, shade = (232, 196, 120, 255), (60, 40, 20, 255)
    d.text((x0 + 1, 12 + 1), text, font=f, fill=shade); d.text((x0, 12), text, font=f, fill=gold)
    ax, ay = x0 + w + gap + aw / 2, 24
    for off, col in ((1, shade), (0, gold)):
        if up:
            d.polygon([(ax + off, ay - 11 + off), (ax - 7 + off, ay - 2 + off), (ax + 7 + off, ay - 2 + off)], fill=col)
            d.rectangle([ax - 2 + off, ay - 2 + off, ax + 2 + off, ay + 10 + off], fill=col)
        else:
            d.polygon([(ax + off, ay + 11 + off), (ax - 7 + off, ay + 2 + off), (ax + 7 + off, ay + 2 + off)], fill=col)
            d.rectangle([ax - 2 + off, ay - 10 + off, ax + 2 + off, ay + 2 + off], fill=col)
    for xx in (int(x0) - 10, int(x0 + w + gap + aw) + 6):                     # a small rule at each end
        d.rectangle([xx, 23, xx + 4, 24], fill=(150, 120, 70, 255))
    return im


PICS = {
    "!$1_Balustrada_Srodek": lambda: balustrade("mid"), "!$1_Balustrada_Lewa": lambda: balustrade("l"), "!$1_Balustrada_Prawa": lambda: balustrade("r"),
    "!$1_Schody_Parter_Dol": lambda: label("PARTER", False), "!$1_Schody_Pietro1_Gora": lambda: label("PIĘTRO I", True),
    "!$1_Schody_Pietro2_Gora": lambda: label("PIĘTRO II", True), "!$1_Schody_Pietro1_Dol": lambda: label("PIĘTRO I", False),
}

# ------------------------------------------------------------------------------------------------ the events
BLANK = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1,
         "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}


def page(name, pri=1, through=False, trigger=0, lst=None, direction=2):
    return {"conditions": dict(BLANK), "directionFix": True, "image": {"tileId": 0, "characterName": name, "direction": direction, "pattern": 1, "characterIndex": 0},
            "list": lst or [{"code": 0, "indent": 0, "parameters": []}], "moveFrequency": 3, "moveRoute": {"list": [{"code": 0, "parameters": []}], "repeat": True, "skippable": False, "wait": False},
            "moveSpeed": 3, "moveType": 0, "priorityType": pri, "stepAnime": False, "through": through, "trigger": trigger, "walkAnime": False}


def put(m, name, x, y, pg, note=""):
    """an event of that name at (x, y): made, or made afresh in its old number"""
    old = next((e for e in m["events"] if e and e["name"] == name and e["x"] == x and e["y"] == y), None)
    ev = {"id": old["id"] if old else len(m["events"]), "name": name, "note": note, "pages": [pg], "x": x, "y": y}
    if old: m["events"][old["id"]] = ev
    else: m["events"].append(ev)
    return ev


C = lambda code, params, indent=0: {"code": code, "indent": indent, "parameters": params}


def guard_list(map_id, gate_id, me):
    say = lambda t, ind: [C(101, ["", 0, 0, 2, "Odźwierny"], ind), C(401, ["\\SPK[%d]%s" % (me, t)], ind)]
    return ([C(111, [12, "$gameSelfSwitches.value([%d, %d, 'A'])" % (map_id, gate_id)])]
            + say("Proszę na górę, szanowny gościu. Apartamenty stoją otworem.", 1) + [C(0, [], 1), C(411, [])]
            + say("Na górę tylko goście Apartamentów. Wchodzi ten,", 1)[:2] + [C(401, ["kogo Borgar zna jak własną kieszeń."], 1), C(0, [], 1), C(412, []), C(0, [])])


def main():
    png = next((a for a in sys.argv[1:] if a.lower().endswith(".png")), None)
    pics = {k: f() for k, f in PICS.items()}
    maps = {n: RW.read_json("data/Map%03d.json" % n) for n in (1, 25, 26)}
    # ---- the labels
    for n, y, flights in ((1, 33, [(2, "!$1_Schody_Pietro1_Gora"), (26, "!$1_Schody_Pietro1_Gora")]),
                          (25, 33, [(2, "!$1_Schody_Parter_Dol"), (6, "!$1_Schody_Pietro2_Gora"), (26, "!$1_Schody_Parter_Dol"), (30, "!$1_Schody_Pietro2_Gora")]),
                          (26, 46, [(2, "!$1_Schody_Pietro1_Dol"), (26, "!$1_Schody_Pietro1_Dol")])):
        m = maps[n][0]
        for x, pic in flights: put(m, "Napis nad schodami", x, y, page(pic, pri=0, through=True))
    # ---- floor 1: the balustrades, the dark band over the flights up, the doorman instead of the gate
    m = maps[25][0]; W, H = m["width"], m["height"]
    d = np.array(m["data"], dtype=np.int64).reshape(6, H, W)
    for x in (0, 4, 8, 24, 28, 32):
        d[2, 33:40, x] = 0; d[3, 33:40, x] = 0
    for x in (5, 6, 7, 29, 30, 31): d[0, 33, x] = BLACK
    m["data"] = [int(v) for v in d.reshape(-1)]
    for x, pic, occ in ((0, "!$1_Balustrada_Lewa", ""), (4, "!$1_Balustrada_Srodek", ""), (8, "!$1_Balustrada_Prawa", "<Occupy:up=6>"),
                        (24, "!$1_Balustrada_Srodek", ""), (28, "!$1_Balustrada_Srodek", ""), (32, "!$1_Balustrada_Prawa", "<Occupy:up=6>")):
        put(m, "Balustrada schodów", x, 39, page(pic, pri=1), occ)
    gates = [e for e in m["events"] if e and e["name"].startswith(("Złota krata", "Zapora odźwiernego"))]
    for e in gates:
        left = 5 if e["x"] < 20 else 29
        e["name"] = "Zapora odźwiernego (schody do Apartamentów)"; e["x"], e["y"] = left, 37
        e["note"] = re.sub(r"<Occupy:[^>]*>", "<Occupy:right=1>", e["note"])
        for p in e["pages"]:
            p["image"]["characterName"] = ""
            p["list"] = [c for c in p["list"] if c["code"] != 250]
            for c in p["list"]:
                if c["code"] == 401: c["parameters"][0] = "Odźwierny zastępuje drogę. Na górę, do apartamentów, wpuszcza tylko zacnych gości."
        g = put(m, "Odźwierny", left + 2, 37, page("$Npc_Pula_M2", pri=1, trigger=0), "<Bust:none>")
        g["pages"][0]["list"] = guard_list(25, e["id"], g["id"])
        g["pages"][0]["directionFix"] = False
    print("krat -> zapór: %d, zdarzeń na Map025: %d" % (len(gates), sum(1 for e in m["events"] if e)))
    if png:
        img = L.render(L.Mapa(25, raw=m), region=(0, 31, 34, 41)).convert("RGBA")
        for e in m["events"]:
            if e and 31 <= e["y"] <= 41 and e["x"] <= 34:
                nm = e["pages"][0]["image"]["characterName"]
                if nm in pics:
                    p = pics[nm]; img.alpha_composite(p, (e["x"] * 48 + 24 - p.width // 2, (e["y"] + 1 - 31) * 48 - p.height))
        img.convert("RGB").save(png); print("podgląd:", png)
    if "--wykonaj" not in sys.argv: print("(podgląd - dopisz --wykonaj)"); return
    RW.need_editor_closed()
    bak = os.path.join(ARCH, "tawerna_schody_v2_" + datetime.datetime.now().strftime("%Y%m%d_%H%M%S")); os.makedirs(bak, exist_ok=True)
    for k, p in pics.items(): p.save(os.path.join(ROOT, "img", "characters", k + ".png"))
    for n, (mm, lay) in maps.items():
        rel = os.path.join(ROOT, "data", "Map%03d.json" % n); shutil.copy2(rel, bak); open(rel, "wb").write(RW.json_text(mm, lay))
    sp = os.path.join(ROOT, "data", "System.json"); shutil.copy2(sp, bak); s = open(sp, "rb").read()
    open(sp, "wb").write(re.sub(rb'"versionId":(\d+)', lambda k: b'"versionId":' + str(int(k.group(1)) + 1).encode(), s, count=1))
    print("Zapisano obrazki i Map001/025/026; kopia:", bak)


if __name__ == "__main__":
    main()
