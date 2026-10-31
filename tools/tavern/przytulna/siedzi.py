# -*- coding: utf-8 -*-
"""Siedzący goście: z klatek PixelLab „pije z kufla” (animate_character v3, wschód, 9 klatek 84/88 px) robi arkusze
img/characters/Przytulna_Siedzi_<Klucz>.png: komórki 88x88, wiersz 0 = zwrot na wschód (klatka 0 = siedzi, 1-8 = unosi i pije),
wiersz 1 = zachód (odbicie). Postać stoi w klatce PixelLab, więc: nogi odcinamy poniżej bioder, resztę (tors, głowa, ręce z kuflem)
opuszczamy o SIAD px na stołek i dorysowujemy udo wysunięte do przodu (kolor spodni z miejsca cięcia).
  python tools/tavern/przytulna/siedzi.py <Klucz> [<Klucz>...]     (klatki muszą leżeć w <scratch>/siedzi/<Klucz>/frame_000..008.png)
  python tools/tavern/przytulna/siedzi.py --statyczny Pula_K2     (bez klatek PixelLab: siedzi z arkusza $Npc_<Klucz>.png, bez picia)"""
import os, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SCR = os.environ.get("PRZYT_SCRATCH", "C:/Users/macie/AppData/Local/Temp/claude/c--Users-macie-OneDrive-Dokumenty-RMMZ-Tawerna/b44c9f90-008a-41ac-a5d8-008fb42ca7be/scratchpad")
CELL = 88; FEET = 76   # stopa komórki 64x64 w płótnie 88 (12 + 64)
SIAD = 15              # o tyle px niżej siedzi tułów
CUT = 24               # tyle px nad stopami odcinamy nogi (pod biodrami)

def na88(im):
    im = im.convert("RGBA")
    if im.size == (CELL, CELL): return im
    out = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0)); o = (CELL - im.width) // 2
    out.alpha_composite(im, (o, o)); return out

def siedzi(fr, feet=None):
    """klatka stojąca (zwrot na wschód, 88x88) -> siedząca"""
    px = fr.load(); W, H = fr.size
    bb = fr.getbbox()
    feet = bb[3] if feet is None else feet
    cut = feet - CUT
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    out.alpha_composite(fr.crop((0, 0, W, cut)), (0, SIAD))
    # nogi: kolor spodni (rzędy 14-7 nad stopami) i butów (ostatnie 5) z klatki stojącej
    def najczestszy(y0, y1):
        v = [px[x, y] for y in range(y0, y1) for x in range(W) if px[x, y][3] > 200 and sum(px[x, y][:3]) > 150]
        return max(set(v), key=v.count) if v else (90, 70, 50, 255)
    col = najczestszy(feet - 14, feet - 7); boot = najczestszy(feet - 5, feet)
    dark = tuple(max(0, int(c * 0.62)) for c in col[:3]) + (255,)
    xs = [x for x in range(W) if px[x, cut - 3][3] > 200]
    x0, x1 = (min(xs), max(xs)) if xs else (30, 50)
    cx = (x0 + x1) // 2
    top = cut + SIAD - 2
    xe = x1 + 9                                  # koniec uda (kolano)
    for y in range(top, top + 7):                # udo
        for x in range(cx - 5, xe + 1):
            edge = y in (top, top + 6) or x == xe
            out.putpixel((x, y), dark if edge else col)
    for y in range(top + 6, top + 13):           # goleń w dół, but
        for x in range(xe - 6, xe + 1):
            out.putpixel((x, y), boot if y >= top + 10 else col)
    return out

def zbuduj(klucz, klatki):
    fr = [siedzi(na88(f)) for f in klatki]
    sheet = Image.new("RGBA", (CELL * len(fr), CELL * 2), (0, 0, 0, 0))
    for i, f in enumerate(fr):
        sheet.alpha_composite(f, (i * CELL, 0))
        sheet.alpha_composite(f.transpose(Image.FLIP_LEFT_RIGHT), (i * CELL, CELL))
    p = os.path.join(ROOT, "img", "characters", "Przytulna_Siedzi_%s.png" % klucz)
    sheet.save(p); return p

def klatki_pixellab(klucz):
    d = os.path.join(SCR, "siedzi", klucz)
    return [Image.open(os.path.join(d, "frame_%03d.png" % i)) for i in range(9)]

def statyczny(klucz):
    im = Image.open(os.path.join(ROOT, "img", "characters", "$Npc_%s.png" % klucz)).convert("RGBA")
    cell = im.crop((64, 128, 128, 192))   # wiersz 3 (prawo), kolumna 1 (stoi)
    big = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0)); big.alpha_composite(cell, (12, 12))
    return [big]

if __name__ == "__main__":
    a = sys.argv[1:]
    if a and a[0] == "--statyczny":
        for k in a[1:]: print(zbuduj(k, statyczny(k)))
    else:
        for k in a: print(zbuduj(k, klatki_pixellab(k)))
