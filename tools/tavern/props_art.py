# The tavern's own props, painted to sit with the Winlu Fantasy Interior set (48 px cells, soft painted pixel art, dark
# brown outline, light from the upper left, a soft grey shadow to the lower right).
#   python props_art.py            -> img/characters/!$Tavern_Board.png, !Tavern_Props.png (48x48 frames),
#                                     !Tavern_Props2.png (48x96 frames), !Tavern_Props3.png (96x96 frames)
#                                     + tools/tavern/props_index.json (name -> sheet, index, direction, pattern, size)
# Sources: PixelLab pictures saved in tools/tavern/props_src/ (their prompts in props_src/SOURCES.md), Winlu pieces
# (recoloured / combined) and small things drawn here (artlib.Canvas4: drawn 4x larger, reduced -> soft edges).
# Frames of a normal sheet: 12 columns x 8 rows; slot n (0..95) = characterIndex n // 12 // ... see slot().
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from artlib import *
import pixfont

OUT_DIR = ROOT + "img/characters/"
INDEX = os.path.join(HERE, "props_index.json")

def slot(n):
    """slot n (reading order over the 12 x 8 frame grid) -> (characterIndex, direction, pattern)"""
    col, row = n % 12, n // 12
    index = (row // 4) * 4 + col // 3
    return index, (row % 4 + 1) * 2, col % 3

class Sheet:
    def __init__(self, name, fw, fh):
        self.name, self.fw, self.fh = name, fw, fh
        self.im = Image.new("RGBA", (fw * 12, fh * 8), (0, 0, 0, 0))
        self.used = {}
    def put(self, n, img, key):
        col, row = n % 12, n // 12
        assert img.size == (self.fw, self.fh), (key, img.size)
        assert n not in self.used, (key, n)
        self.im.alpha_composite(img, (col * self.fw, row * self.fh))
        idx, d, p = slot(n)
        self.used[n] = key
        a = np.array(img)[:, :, 3]
        ys, xs = np.nonzero(a > 100)          # the solid picture (not the soft shadow / glow): for the placement checks
        art = [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1] if len(xs) else [0, 0, 0, 0]
        return {"sheet": self.name, "index": idx, "direction": d, "pattern": p, "w": self.fw, "h": self.fh, "slot": n, "art": art}
    def save(self):
        self.im.save(OUT_DIR + self.name + ".png")

# ============================================================================================ the quest board (3 x 3)
GOLD, GOLD_D, RED_D = (238, 196, 92, 255), (122, 78, 26, 255), (74, 16, 12, 255)
TANKARD = ["..fff..", ".fffff.", ".gggg..", ".ggggdd", ".gggg.d", ".ggggdd", "..ddd.."]
def tankard(img, x, y):
    pal = {"f": (246, 232, 196, 255), "g": GOLD, "d": GOLD_D}
    px = img.load()
    for ry, row in enumerate(TANKARD):
        for rx, c in enumerate(row):
            if c in pal: px[x + rx, y + ry] = pal[c]

def parchment(w, h, torn=None, shade=(233, 219, 184), seed=1, grain=7):
    """a pinned notice: cream parchment with a fine grain, a darker rim, a 1 px dark outline, lighter towards the
    upper left"""
    rnd = np.random.RandomState(seed)
    a = np.zeros((h, w, 4), np.float32)
    a[:, :, :3] = shade
    a[:, :, 3] = 255
    a[:, :, :3] += rnd.normal(0, grain, (h, w, 1))
    yy, xx = np.mgrid[0:h, 0:w]
    light = 1.04 - 0.12 * ((xx / max(1, w - 1)) * 0.5 + (yy / max(1, h - 1)) * 0.5)
    a[:, :, :3] *= light[:, :, None]
    rim = (xx == 1) | (yy == 1) | (xx == w - 2) | (yy == h - 2)
    a[rim, :3] *= 0.88
    edge = (xx == 0) | (yy == 0) | (xx == w - 1) | (yy == h - 1)
    a[edge] = (92, 72, 50, 255)
    if torn:   # a torn lower right corner
        for i in range(torn):
            for j in range(torn - i):
                a[h - 1 - i, w - 1 - j] = (0, 0, 0, 0)
        for i in range(torn):
            j = torn - i
            if 0 <= w - 1 - j < w: a[h - 1 - i, w - 1 - j] = (92, 72, 50, 255)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), "RGBA")

def nail(img, x, y):
    px = img.load()
    px[x, y] = (70, 70, 78, 255); px[x + 1, y] = (120, 120, 130, 255)
    px[x, y + 1] = (50, 50, 56, 255); px[x + 1, y + 1] = (70, 70, 78, 255)

def face_sketch(w=18, h=16):
    """a charcoal sketch of a rough man (head, shaggy hair, brows, eyes, nose, a beard) - lines on paper, no fill"""
    c = Canvas4(w, h)
    ch = (58, 46, 38, 255)
    mid = (110, 92, 72, 255)
    c.ellipse(4.5, 3, 13.5, 14.5, fill=(206, 188, 150, 255))
    c.arc((4.5, 3, 13.5, 14.5), 120, 420, ch, 0.9)
    c.poly([(3.5, 8), (4.5, 2.5), (8, 0.8), (12, 1.2), (14.5, 4), (14.5, 8), (13, 5), (9, 3.5), (5.5, 5)], fill=(72, 58, 46, 255))
    c.line([(6.3, 7.4), (8.2, 7.0)], ch, 0.9); c.line([(9.8, 7.0), (11.7, 7.4)], ch, 0.9)
    c.ellipse(6.8, 8.2, 7.9, 9.3, fill=ch); c.ellipse(10.1, 8.2, 11.2, 9.3, fill=ch)
    c.line([(9, 9), (8.4, 11), (9.4, 11.2)], mid, 0.7)
    c.poly([(5.2, 11), (6.5, 12.2), (8, 12), (10, 12), (11.5, 12.2), (12.8, 11), (12.2, 14.2), (9, 15.6), (5.8, 14.2)], fill=(90, 74, 60, 255))
    c.line([(7.4, 12.9), (10.6, 12.9)], (40, 30, 26, 255), 0.8)
    c.line([(2, 15.6), (16, 15.6)], mid, 0.8)
    return c.done(t=50)

def wanted_poster():
    w, h = 48, 31
    p = parchment(w, h, shade=(230, 206, 166), seed=5, grain=6)
    ink = (84, 26, 18, 255)
    tw = pixfont.width("POSZUKIWANY")
    pixfont.draw(p, (w - tw) // 2, 3, "POSZUKIWANY", ink)
    face = face_sketch()
    p.alpha_composite(face, ((w - face.size[0]) // 2, 9))
    pixfont.draw(p, (w - pixfont.width("NAGRODA 50")) // 2, 25, "NAGRODA 50", (100, 44, 28, 255))
    nail(p, 2, 1); nail(p, w - 4, 1)
    return p

def quest_board():
    src = Image.open(os.path.join(SRC, "board_256_s7.png")).convert("RGBA").crop((21, 11, 233, 244))
    f = 0.6
    b = grade(reduce(src, f), sat=0.9)
    frame = Image.new("RGBA", (144, 144), (0, 0, 0, 0))
    ox = round(72 - (4 + 187) / 2 * f)
    frame.alpha_composite(b, (ox, 144 - b.size[1]))
    # the sign: ZLECENIA in gold between two golden tankards
    tw = pixfont.width("ZLECENIA", "5x7")
    pixfont.draw(frame, 72 - tw // 2, 30, "ZLECENIA", GOLD, "5x7", shadow=RED_D)
    tankard(frame, 38, 30); tankard(frame, 100, 30)
    # the torn note moves down to the right, the wanted poster takes the upper right
    torn = frame.crop((99, 49, 114, 64))
    frame.alpha_composite(torn, (98, 71))
    poster = wanted_poster()
    shadow = drop_shadow(poster, dx=1, dy=1, alpha=0.45, blur=0.6)
    frame.alpha_composite(shadow, (64, 41))
    return frame

# ============================================================================================ PixelLab pictures
import props_draw as PD

def src(name):
    return Image.open(os.path.join(SRC, name)).convert("RGBA")

def quad(img, i):
    """one object of a 2x2 sprite-sheet picture (0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right), cropped"""
    w, h = img.size
    q = img.crop(((i % 2) * w // 2, (i // 2) * h // 2, (i % 2 + 1) * w // 2, (i // 2 + 1) * h // 2))
    return q.crop(bbox(q))

def whole(img):
    return img.crop(bbox(img))

def fit(img, w=None, h=None, sat=0.9):
    f = (w / img.size[0]) if w else (h / img.size[1])
    return grade(reduce(img, f), sat=sat)

def floor_frame(img, fw=48, fh=96, base=92, shadow=True, dx=0):
    """an object standing on the floor: centred, its foot `base` px down the frame, Winlu's soft shadow"""
    fr = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    s = drop_shadow(img, 3, 2, 0.32, 1.0) if shadow else img
    fr.alpha_composite(s, (int(round((fw - img.size[0]) / 2 + dx)), base - img.size[1]))
    return fr

def centre_frame(img, cy, fw=48, fh=96, shadow=(2, 2, 0.3), dx=0):
    fr = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
    s = drop_shadow(img, shadow[0], shadow[1], shadow[2], 0.8) if shadow else img
    fr.alpha_composite(s, (int(round((fw - img.size[0]) / 2 + dx)), int(round(cy - img.size[1] / 2))))
    return fr

# every prop: key -> (sheet, builder, notes). "place": floor (stands on its cell), table (on a table / counter cell),
# wall (event on the wall face's bottom row, the picture hangs on the rows above), wall_hi (event one row higher: tall
# hangings on the upper wall), anim (3 frames, step animation)
def props_48():
    g1 = src("grid_cat_hat_drum_box_s21.png"); g2 = src("grid_dog_boar_bucket_towels_s41.png")
    P = {}
    P["kot_spiacy"] = (floor_frame(fit(quad(g1, 0), w=30), base=90), "floor", "śpiący kot")
    P["kapelusz_monety"] = (floor_frame(fit(quad(g1, 1), w=24), base=90), "floor", "kapelusz z monetami (napiwki)")
    P["bebenek"] = (floor_frame(fit(quad(g1, 2), w=22), base=90), "floor", "bębenek")
    P["szkatula"] = (floor_frame(fit(quad(g1, 3), w=26), base=91), "floor", "okuta szkatuła / sejf")
    P["glowa_dzika"] = (centre_frame(fit(quad(g2, 1), w=36), 34, shadow=(2, 3, 0.35)), "wall", "głowa dzika na tarczy")
    P["cebrzyk"] = (floor_frame(fit(quad(g2, 2), w=24), base=91), "floor", "cebrzyk ze szczotką i mydłem")
    P["stolek_reczniki"] = (floor_frame(fit(quad(g2, 3), w=24), base=91), "floor", "stołek z ręcznikami")
    P["lutnia_stojak"] = (floor_frame(fit(whole(src("lute_stand_s22.png")), h=52), base=92), "floor", "lutnia na stojaku")
    P["wieszak"] = (floor_frame(fit(whole(src("coat_rack_s31.png")), h=86), base=93), "floor", "wieszak z płaszczami")
    P["stojak_laski"] = (floor_frame(fit(whole(src("stick_stand_s23.png")), h=42), base=92), "floor", "stojak na laski i parasol")
    t1 = fit(whole(src("tapestry_hunt_s51.png")), h=88); t2 = fit(whole(src("tapestry_tankard_s52.png")), h=88)
    P["gobelin_polowanie"] = (centre_frame(t1, 49, shadow=(2, 2, 0.3)), "wall_hi", "gobelin z polowaniem")
    P["gobelin_kufel"] = (centre_frame(t2, 49, shadow=(2, 2, 0.3)), "wall_hi", "gobelin ze złotym kuflem")
    P["pulpit_nuty"] = (PD.music_stand(), "floor", "pulpit z nutami")
    # things on tables: the event stands on the table's LOWER row (legs / front) and the picture sits on the table top
    # in the row above: centre y 46 of the frame fits round tables (top 29..76) and long tables (top 13..70);
    # on counters (top 12..56) the centre is y 34 ("counter" variants)
    T, L = TABLE_Y, COUNTER_Y
    P["kubek_kosci"] = (centre_frame(PD.dice_cup(), T, shadow=None), "table", "kubek i kości")
    P["karty"] = (centre_frame(PD.cards(), T, shadow=None), "table", "rozłożone karty")
    P["monety"] = (centre_frame(PD.coins(), T, shadow=None), "table", "stosiki monet")
    P["warcaby"] = (centre_frame(PD.checkers(), T, shadow=None), "table", "warcaby")
    P["flet"] = (centre_frame(PD.flute(), T, shadow=None), "table", "flet")
    P["butelki"] = (PD.bottles(T), "table", "butelki w kolorach")
    P["ksiega_rachunkowa"] = (PD.ledger(T), "table", "księga rachunkowa, pióro i kałamarz")
    P["dzwonek"] = (centre_frame(PD.bell(), L, shadow=None), "counter", "mosiężny dzwonek")
    P["kasetka"] = (centre_frame(PD.cash_box(), L, shadow=None), "counter", "kasetka z monetami")
    P["butelki_lada"] = (PD.bottles(L), "counter", "butelki w kolorach (na ladzie)")
    P["tarcza_rzutki"] = (centre_frame(PD.dartboard(), 36, shadow=(2, 2, 0.35)), "wall", "tarcza do rzutek")
    P["klucze"] = (centre_frame(PD.key_rack(), 34, shadow=(1, 2, 0.35)), "wall", "tablica z kluczami")
    P["nie_pluc"] = (PD.no_spit_sign(), "wall", "tabliczka NIE PLUĆ NA PODŁOGĘ")
    P["mysia_dziura"] = (centre_frame(PD.mouse_hole(), 90, shadow=None), "wall", "mysia dziura (na dolnym rzędzie ściany)")
    P["chochla"] = (centre_frame(PD.ladle(), 30, shadow=None), "table", "chochla (na beczce z wodą, zdarzenie na dolnym kafelku beczki)")
    P["polka_przyprawy"] = (PD.spice_shelf(), "wall", "półka z przyprawami")
    return P

TABLE_Y, COUNTER_Y = 46, 34

def props_96():
    g2 = src("grid_dog_boar_bucket_towels_s41.png")
    P = {}
    P["kociol_miedziany"] = (floor_frame(fit(whole(src("copper_kettle_s24.png")), w=88), 96, 96, base=94), "floor2", "miedziany kocioł warzelny")
    P["kadz"] = (floor_frame(fit(whole(src("ferment_vat_s42.png")), w=80), 96, 96, base=93), "floor2", "kadź fermentacyjna")
    P["balia"] = (floor_frame(fit(whole(src("bathtub_s43.png")), w=90), 96, 96, base=93), "floor2", "balia kąpielowa")
    P["pies_spiacy"] = (floor_frame(fit(quad(g2, 0), w=42), 96, 96, base=90), "floor2", "śpiący pies")
    sign = fit(whole(src("hanging_sign_s53.png")), w=80)
    fr = Image.new("RGBA", (96, 96), (0, 0, 0, 0)); fr.alpha_composite(drop_shadow(sign, 2, 3, 0.3, 0.9), ((96 - sign.size[0]) // 2, 4))
    P["szyld_kufel"] = (fr, "wall", "szyld ze złotym kuflem")
    P["tablica_kreda"] = (PD.tally_board(), "wall", "tablica kredowa z wynikami")
    P["cennik"] = (PD.price_board(), "wall", "CENNIK")
    P["kufle_wieszak"] = (PD.tankard_rack(), "wall", "wieszak z kuflami")
    P["krany"] = (PD.beer_taps(), "counter", "krany do piwa (na ladzie)")
    P["mapa"] = (PD.wall_map(), "wall", "mapa krainy na ścianie")
    P["wlocznie"] = (PD.crossed_spears(), "wall", "skrzyżowane włócznie z tarczą")
    P["worki_chmiel"] = (PD.sacks("hops"), "floor2", "worki chmielu")
    P["worki_slod"] = (PD.sacks("malt"), "floor2", "worki słodu")
    return P

# ============================================================================================ build
def main():
    index = {}
    qb = quest_board()
    big = Image.new("RGBA", (144 * 3, 144 * 4), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3): big.alpha_composite(qb, (c * 144, r * 144))
    big.save(OUT_DIR + "!$Tavern_Board.png")
    index["tablica_zlecen"] = {"sheet": "!$Tavern_Board", "index": 0, "direction": 2, "pattern": 0, "w": 144, "h": 144,
                               "place": "floor3", "name": "tablica zleceń"}
    s1 = Sheet("!Tavern_Props", 48, 96)
    # the candle, animated (3 frames = the 3 patterns of one row): on tables (dish at y 56) and on counters (y 44)
    for n0, key, base, place in ((0, "swieca", TABLE_Y + 10, "table"), (3, "swieca_lada", COUNTER_Y + 10, "counter")):
        frames = PD.candle_frames(base)
        first = [s1.put(n0 + k, frames[k], key) for k in range(3)][0]
        first.update(place=place, name="gruba świeca z zaciekami (animowana)", anim=True)
        index[key] = first
    n = 6
    for key, (img, place, name) in props_48().items():
        e = s1.put(n, img, key); e.update(place=place, name=name); index[key] = e; n += 1
    s1.save()
    s2 = Sheet("!Tavern_Props2", 96, 96)
    for i, (key, (img, place, name)) in enumerate(props_96().items()):
        e = s2.put(i, img, key); e.update(place=place, name=name); index[key] = e
    s2.save()
    with open(INDEX, "wb") as f:
        f.write(json.dumps(index, ensure_ascii=False, indent=1).encode("utf-8"))
    print("props:", len(index), "| sheet 1 slots", len(s1.used), "| sheet 2 slots", len(s2.used))

if __name__ == "__main__":
    main()
