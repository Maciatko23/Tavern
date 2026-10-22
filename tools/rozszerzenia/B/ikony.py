"""Ikony paczki B (480-486) w stylu IconSet gry: rysunek 16x16 powiększony 2x, obwódka (44,30,30) - jak tools/przystan/art/build_icons.py.

Wynik: tools/rozszerzenia/B/ikony.png (512x32, ikona n w kolumnie n-480; wkleja instalator:
  python tools/rozszerzenia/instaluj.py --paczka B --ikony tools/rozszerzenia/B/ikony.png --wykonaj)
oraz tools/rozszerzenia/B/ikony_podglad.png (x3, obok wzorców z IconSet), a także zrzucone poroże do podniesienia przy lizawce:
img/characters/!$Low_Poroze.png (ten sam rysunek poroża w skali 1x, płasko na ziemi, z cieniem; 0 generacji PixelLab).
Uruchom: python tools/rozszerzenia/B/ikony.py
"""
import os

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
O = (44, 30, 30)

ICONS = {}
# 480 Bryła soli: szarobiała krystaliczna bryła
ICONS[480] = ({"A": O, "W": (244, 244, 240), "L": (212, 212, 208), "G": (170, 172, 176), "D": (122, 124, 132)}, [
    "................",
    "................",
    "................",
    "......AAAA......",
    "....AAWWWLAA....",
    "...AWWWLLLGGA...",
    "..AWWLLLLGGGDA..",
    "..AWLLWLLGGDDA..",
    ".AWLLLLLGGGGDDA.",
    ".ALLWLLGGGGDDDA.",
    ".ALLLLGGGGDDDA..",
    "..ADGGGGDDDDA...",
    "...AADDDDDAA....",
    ".....AAAAA......",
    "................",
    "................"])
# 481 Poroże jelenia: rozłożyste, kostne, z brązową różą u nasady
ICONS[481] = ({"A": O, "W": (236, 224, 194), "S": (196, 178, 140), "B": (150, 108, 64), "b": (110, 76, 44)}, [
    "................",
    ".A..........A...",
    "AWA........AWA..",
    "AWA..A....AWSA..",
    ".AWAAWA..AWSA.A.",
    ".AWWWSA.AWSA.AWA",
    "..AWSA.AWSA.AWSA",
    "..AWSAAWWSAAWSA.",
    "..AWWAWWSA.AWSA.",
    "...AWWWSAAWWSA..",
    "...AWWWWWWWSA...",
    "....AWWWWSSA....",
    "....ABBWSSA.....",
    "...ABBbbA.......",
    "...AAAAA........",
    "................"])
# 482 Kieł odyńca: zakrzywiony, kość słoniowa, brązowa nasada
ICONS[482] = ({"A": O, "W": (242, 234, 212), "S": (204, 190, 156), "B": (140, 98, 58)}, [
    "................",
    "................",
    "..AA............",
    ".AWWA...........",
    ".AWWWA..........",
    "..AWWWA.........",
    "..AWWSWA........",
    "...AWSSWA.......",
    "...AWWSSWA...AA.",
    "....AWWSSWAAABA.",
    ".....AWWSSSBBBA.",
    "......AAWWSBBA..",
    "........AAAAA...",
    "................",
    "................",
    "................"])
# 483 Pazur niedźwiedzia: ciemny hak wyrastający z kępki brązowego futra
ICONS[483] = ({"A": O, "F": (132, 92, 56), "f": (96, 64, 38), "K": (54, 44, 42), "S": (112, 106, 100), "W": (214, 208, 194)}, [
    "................",
    "................",
    "....AAAAA.......",
    "...AFFfFFA......",
    "...AFfKKFfA.....",
    "....AKKKKKA.....",
    ".....AKKKKKA....",
    "......AKKKKA....",
    ".......AKKKA....",
    ".......AKKSA....",
    "......AKKSA.....",
    ".....AKSSA......",
    "....ASSWA.......",
    "....AWWA........",
    ".....AA.........",
    "................"])
# 484 Zezwolenie na odstrzał: pismo na pergaminie z czerwoną pieczęcią dworu
ICONS[484] = ({"A": O, "P": (228, 208, 162), "L": (150, 126, 92), "R": (186, 54, 46), "r": (124, 34, 30)}, [
    "................",
    "................",
    "..AAAAAAAAAAA...",
    ".APPPPPPPPPPPA..",
    ".APLLLLLLLLPPA..",
    "..APPPPPPPPPA...",
    "..APLLLLLLLPA...",
    "..APPPPPPPPPA...",
    "..APLLLLLRRPA...",
    "..APPPPPRRRRA...",
    ".APPPPPPRRrrA...",
    ".APLLLLLPrrPPA..",
    "..AAAAAAAAAAAA..",
    "................",
    "................",
    "................"])
# 485 Strzała z białym okiem: czarny drzewiec, białe lotki z czarnym okiem
ICONS[485] = ({"A": O, "K": (40, 36, 40), "H": (172, 176, 182), "W": (238, 238, 232), "E": (24, 24, 30)}, [
    "............AAA.",
    "...........AHHA.",
    "..........AHHHA.",
    ".........AKHHA..",
    "........AKKAA...",
    ".......AKKA.....",
    "......AKKA......",
    ".....AKKA.......",
    "..AAAKKA........",
    ".AWWWKA.........",
    ".AWEWA..........",
    ".AWWWA..........",
    "AWWAWWA.........",
    "AWA.AWA.........",
    ".A...A..........",
    "................"])
# 486 Srebrna strzała: srebrny drzewiec i grot, jasne lotki (nagroda z zawodów)
ICONS[486] = ({"A": O, "K": (176, 184, 194), "H": (240, 242, 248), "W": (214, 222, 236), "E": (150, 160, 176)}, [
    "............AAA.",
    "...........AHHA.",
    "..........AHHHA.",
    ".........AKHHA..",
    "........AKKAA...",
    ".......AKKA.....",
    "......AKKA......",
    ".....AKKA.......",
    "..AAAKKA........",
    ".AWWWKA.........",
    ".AWEWA..........",
    ".AWWWA..........",
    "AWWAWWA.........",
    "AWA.AWA.........",
    ".A...A..........",
    "................"])


def draw(pal, rows, k):
    img = Image.new("RGBA", (16 * k, 16 * k), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows[:16]):
        for x, ch in enumerate(row[:16]):
            if ch == ".":
                continue
            c = pal[ch]
            for dy in range(k):
                for dx in range(k):
                    px[x * k + dx, y * k + dy] = c + (255,)
    return img


def main():
    strip = Image.new("RGBA", (512, 32), (0, 0, 0, 0))
    for n, (pal, rows) in ICONS.items():
        strip.alpha_composite(draw(pal, rows, 2), ((n - 480) * 32, 0))
    out = os.path.join(HERE, "ikony.png")
    strip.save(out)
    # the shed antler on the ground (1x, a soft shadow under it) - the event at the lick, in spring
    pal, rows = ICONS[481]
    ant = draw(pal, rows, 1)
    cell = Image.new("RGBA", (48, 48), (0, 0, 0, 0))
    sh = Image.new("RGBA", ant.size, (0, 0, 0, 0))
    sh.putalpha(ant.getchannel("A").point(lambda v: 80 if v else 0))
    x, y = 16, 48 - 16 - 8
    cell.alpha_composite(sh, (x + 2, y + 2))
    cell.alpha_composite(ant, (x, y))
    sheet = Image.new("RGBA", (144, 192), (0, 0, 0, 0))
    for r in range(4):
        for c in range(3):
            sheet.alpha_composite(cell, (c * 48, r * 48))
    sheet.save(os.path.join(ROOT, "img", "characters", "!$Low_Poroze.png"))
    # the preview, x3: the new icons next to the game's own (meat 94, hide 96, bow 126, arrows 127, bear hide 170)
    ref = Image.open(os.path.join(ROOT, "img", "system", "IconSet.png")).convert("RGBA")
    pv = Image.new("RGBA", (34 * 12, 32), (60, 60, 70, 255))
    for i, n in enumerate([94, 96, 126, 127, 170]):
        pv.alpha_composite(ref.crop(((n % 16) * 32, (n // 16) * 32, (n % 16) * 32 + 32, (n // 16) * 32 + 32)), (i * 34, 0))
    for i in range(7):
        pv.alpha_composite(strip.crop((i * 32, 0, i * 32 + 32, 32)), ((i + 5) * 34, 0))
    pv.resize((pv.width * 3, 96), Image.NEAREST).save(os.path.join(HERE, "ikony_podglad.png"))
    print("zapisano", os.path.relpath(out, ROOT), "i !$Low_Poroze.png")


if __name__ == "__main__":
    main()
