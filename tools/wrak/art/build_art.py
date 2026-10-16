# python tools/wrak/art/build_art.py   -> grafiki pakietu E (Wrak na mieliźnie)
# Składa arkusze z surowych obrazów PixelLab (tools/wrak/art/raw/) i rysuje w Pythonie to, co proste:
#   img/characters/!$Wrak_Dziob.png    dziobowa połowa „Białej Źrenicy” (PixelLab pro flash 256x208, 9 generacji)
#   img/characters/!$Wrak_Rufa.png     rufowa połowa z dziurą w burcie (PixelLab pro flash 256x208, 9 generacji)
#   img/characters/!$Wrak_Bandera.png  podarta bandera Czarnych Oczu na złamanej rei: czarna chorągiew z paczki autora
#                                      (!Flags_banner, postać 1) z czerwonym kręgiem przemalowanym na białe otwarte oko
#   img/characters/!$Wrak_Szkielet.png szkielet bosmana w ładowni: kości autora z Fantasy_Dungeon_E i mosiężny klucz
#   tools/wrak/art/icons/mapa_178.png  ikona 32x32 przedmiotu 178 „Mapa z zaznaczeniami” (wkleja integracja, pole 439)
# Arkusze „!$” mają 3x4 jednakowe komórki (wzór i kierunek obojętne); dół komórki = dół pola zdarzenia, środek komórki = środek
# pola. Piach pod kadłubem przekolorowany na piach mapy (A2 rodzaj 24 tilesetu 11). Nic tu nie pisze do data/.
import os, sys, json
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", "..")).replace("\\", "/") + "/"
RAW = os.path.join(HERE, "raw")
CHARS = ROOT + "img/characters/"
ICONS = os.path.join(HERE, "icons")
OUT_DIR = os.environ.get("WRAK_ART_OUT") or CHARS

# piach z arkusza kadłuba (jasny beż) -> piach mapy (A2 rodzaj 24: ~124,116,92)
SAND = {(200, 183, 160): (146, 137, 108), (178, 159, 137): (132, 123, 97), (152, 138, 121): (118, 110, 87),
        (122, 112, 98): (101, 94, 74)}


def resand(im, band=22):
    im = im.convert("RGBA")
    bb = im.getbbox()
    px = im.load()
    for y in range(max(0, bb[3] - band), bb[3]):
        for x in range(im.width):
            p = px[x, y]
            if p[3] and p[:3] in SAND:
                q = SAND[p[:3]]
                px[x, y] = q + (p[3],)
    return im


def sheet(frame, cw, ch, dx=0, dy=0):
    """3x4 komórki cw x ch; obraz w każdej komórce: dół obrazu (bbox) dy px nad dołem komórki, poziomo środek obrazu + dx"""
    bb = frame.getbbox()
    crop = frame.crop(bb)
    cell = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    ox = (cw - frame.width) // 2 + bb[0] + dx
    oy = ch - dy - crop.height
    cell.alpha_composite(crop, (ox, oy))
    out = Image.new("RGBA", (cw * 3, ch * 4), (0, 0, 0, 0))
    for j in range(4):
        for i in range(3):
            out.alpha_composite(cell, (i * cw, j * ch))
    return out, {"cell": [cw, ch], "image_in_cell": [ox, oy, ox + crop.width, oy + crop.height]}


def hull():
    meta = {}
    for name, raw, dy in (("Dziob", "dziob.png", 6), ("Rufa", "rufa.png", 6)):
        im = resand(Image.open(os.path.join(RAW, raw)))
        sh, m = sheet(im, 256, 192, 0, dy)
        sh.save(OUT_DIR + "!$Wrak_%s.png" % name)
        meta[name] = m
    return meta


# ------------------------------------------------------------------ the banner: the author's black tattered flag, the eye
def banner():
    src = Image.open(CHARS + "!Flags_banner.png").convert("RGBA")
    # !Flags_banner: 4x2 postaci po 3x4 komórki 48x96; postać 1 = kolumny 3-5, wiersze 0-3
    flag = src.crop((3 * 48, 0, 4 * 48, 96))
    px = flag.load()
    # the red ring out (red -> the cloth's dark), then the white open eye painted in
    cloth = (34, 36, 46)
    for y in range(flag.height):
        for x in range(flag.width):
            r, g, b, a = px[x, y]
            if a and r > g + 30 and r > b + 30:
                px[x, y] = cloth + (a,)
    d = ImageDraw.Draw(flag)
    cx, cy = 24, 38
    # the eye: an almond of white with a dark outline, the iris grey, the pupil black, a glint
    pts_top = [(cx - 13 + i, cy - int(7 * (1 - ((i - 13) / 13.0) ** 2))) for i in range(27)]
    pts_bot = [(cx + 13 - i, cy + int(6 * (1 - ((13 - i) / 13.0) ** 2))) for i in range(27)]
    d.polygon(pts_top + pts_bot, fill=(226, 224, 214, 255), outline=(10, 10, 14, 255))
    d.ellipse((cx - 5, cy - 5, cx + 5, cy + 5), fill=(120, 124, 132, 255), outline=(10, 10, 14, 255))
    d.ellipse((cx - 2, cy - 2, cx + 2, cy + 2), fill=(8, 8, 10, 255))
    px[cx + 2, cy - 3] = (250, 250, 250, 255)
    # a few torn holes / stains in the eye's white (it is old)
    for (x, y) in ((cx - 9, cy - 1), (cx + 8, cy + 2), (cx - 6, cy + 3)):
        px[x, y] = (150, 146, 136, 255)
    # the broken yard (a spar stuck in the sand): a vertical pole and the crossbar the flag hangs from
    W, H = 48, 144
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(out)
    wood_d, wood, wood_l = (52, 36, 24, 255), (92, 66, 42, 255), (128, 96, 62, 255)
    pole_x = 23
    od.rectangle((pole_x - 2, 6, pole_x + 2, H - 3), fill=wood, outline=wood_d)
    od.line((pole_x - 1, 8, pole_x - 1, H - 5), fill=wood_l)
    # a splintered top
    od.polygon([(pole_x - 3, 7), (pole_x - 1, 1), (pole_x + 1, 5), (pole_x + 3, 2), (pole_x + 3, 7)], fill=wood, outline=wood_d)
    od.rectangle((2, 12, 45, 15), fill=wood, outline=wood_d)
    out.alpha_composite(flag.crop((0, 0, 48, 92)), (0, 14))
    # sand heaped at the foot
    od.ellipse((pole_x - 9, H - 7, pole_x + 9, H - 1), fill=(118, 110, 87, 255))
    od.ellipse((pole_x - 6, H - 6, pole_x + 6, H - 2), fill=(132, 123, 97, 255))
    sh, m = sheet(out, 48, 144, 0, 0)
    sh.save(OUT_DIR + "!$Wrak_Bandera.png")
    return m


# ------------------------------------------------------------------ the boatswain's skeleton (the hold): the author's bones of the
# dungeon set (Fantasy_Dungeon_E: the skull with ribs E(10,3) and the scattered bones E(11,3)), a brass key on a thong added
def skeleton():
    E = Image.open(ROOT + "img/tilesets/Winlu Fantasy Tileset - Dungeon/tilesets/Fantasy_Dungeon_E.png").convert("RGBA")
    W, H = 96, 48
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    im.alpha_composite(E.crop((10 * 48, 3 * 48, 12 * 48, 4 * 48)), (0, 0))
    d = ImageDraw.Draw(im)
    # the key: a thong from the skull, a brass bow and bit
    d.line((22, 32, 30, 38), fill=(70, 46, 26, 255))
    d.ellipse((29, 35, 34, 40), outline=(92, 62, 22, 255), fill=(206, 160, 66, 255))
    d.point((31, 37), fill=(92, 62, 22, 255))
    d.rectangle((34, 37, 41, 38), fill=(206, 160, 66, 255), outline=(92, 62, 22, 255))
    d.rectangle((39, 39, 40, 40), fill=(206, 160, 66, 255))
    sh, m = sheet(im, 96, 48, 0, 4)
    sh.save(OUT_DIR + "!$Wrak_Szkielet.png")
    return m


# ------------------------------------------------------------------ the icon of item 178 (32x32): a rolled chart with white eyes
def icon():
    os.makedirs(ICONS, exist_ok=True)
    im = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    paper, paper_d, paper_l, line = (214, 196, 150, 255), (170, 148, 104, 255), (236, 222, 184, 255), (58, 42, 26, 255)
    # an opened chart, its left and right edges rolled
    d.rectangle((6, 6, 26, 26), fill=paper, outline=line)
    d.rectangle((3, 5, 7, 27), fill=paper_d, outline=line)
    d.rectangle((25, 5, 29, 27), fill=paper_d, outline=line)
    d.line((4, 6, 4, 26), fill=paper_l); d.line((26, 6, 26, 26), fill=paper_l)
    # the island's outline in ink
    d.polygon([(10, 12), (14, 9), (19, 10), (22, 14), (21, 20), (16, 23), (11, 21), (9, 16)], outline=(92, 70, 46, 255))
    # the white eyes: little black dots with a white almond
    for (x, y) in ((13, 12), (19, 15), (14, 19)):
        d.polygon([(x - 3, y), (x - 1, y - 2), (x + 1, y - 2), (x + 3, y), (x + 1, y + 2), (x - 1, y + 2)], fill=(250, 250, 244, 255),
                  outline=(24, 20, 18, 255))
        im.putpixel((x, y), (10, 10, 10, 255))
    im.save(os.path.join(ICONS, "mapa_178.png"))
    big = im.resize((128, 128), Image.NEAREST)
    big.save(os.path.join(ICONS, "mapa_178_x4.png"))


def main():
    meta = {"hull": hull(), "banner": banner(), "skeleton": skeleton()}
    icon()
    with open(os.path.join(HERE, "art.json"), "wb") as f:
        f.write(json.dumps(meta, ensure_ascii=False, indent=1).encode("utf-8"))
    print("ok", OUT_DIR, json.dumps(meta))


if __name__ == "__main__":
    main()
