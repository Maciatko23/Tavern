"""Ikony przystani 32x32 w stylu IconSet gry (rysunek 16x16 powiększony 2x, obwódka (44,30,30)).

Wzorzec: ikona ryby 354 (kształt, światło z góry), wędzonej ryby 362, liny 349.
Wynik: tools/przystan/art/icons/{sledz,dorsz,chusta,smola}.png + podgląd icons/_podglad.png
(obok ikon wzorcowych z IconSet). IconSet.png NIE jest ruszany.
"""
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
OUT = os.path.join(HERE, "icons")

O = (44, 30, 30)  # obwódka jak w IconSet

ICONS = {}

# --- śledź: smukła srebrnoniebieska ryba, ciemny grzbiet, jasny brzuch, rozwidlony ogon
ICONS["sledz"] = (
    {"A": O, "K": (52, 78, 108), "B": (96, 126, 158), "C": (166, 188, 208), "W": (222, 232, 240),
     "E": O, "T": (72, 100, 132), "G": (124, 150, 176)},
    [
        "................",
        "................",
        "................",
        "................",
        "................",
        "..............AA",
        "..AAAAAAAAAA.ATA",
        ".AKKKKKKKKKKAATA",
        "ACECBBBBBBBBKTTA",
        "ACCWWWWWWWWCCTTA",
        ".ACCCCCCCCCCAATA",
        "..AAAAAAAAAA.ATA",
        "..............AA",
        "................",
        "................",
        "................",
    ],
)

# --- dorsz: gruba, oliwkowo-cętkowana ryba, jasna linia boczna, wąsik pod żuchwą, trzy płetwy grzbietowe
ICONS["dorsz"] = (
    {"A": O, "K": (92, 88, 48), "B": (134, 126, 72), "S": (78, 72, 40), "L": (226, 218, 184),
     "Y": (212, 202, 160), "E": O, "T": (104, 96, 54), "W": (238, 232, 206)},
    [
        "................",
        "................",
        "................",
        "..AAAAAA........",
        ".AKKSKKKAAA...AA",
        "AKKBBBSBKKKA.ATA",
        "ABEBSBBBBSBKAATA",
        "ABBBBBBSBBBBATTA",
        "ALLLLLLLLLLLTTTA",
        "AYWWYYYYYYYAATTA",
        ".AYYYYYYYYAA.ATA",
        ".SAAYYYYAAA...AA",
        ".S..AAAA........",
        "................",
        "................",
        "................",
    ],
)

# --- chusta: złożona beżowa chusta z czerwonym haftem w kwiaty (kolory chusty z Matka_Bust.png)
ICONS["chusta"] = (
    {"A": O, "P": (214, 194, 156), "M": (196, 172, 134), "D": (150, 126, 92), "R": (184, 52, 44),
     "r": (122, 34, 30), "G": (98, 126, 62), "Y": (226, 176, 72), "F": (172, 150, 112)},
    [
        "................",
        "................",
        "....AAAAAAAAAAA.",
        "...APRPRPRPRPRMA",
        "...APPPPGPPPPPMA",
        "..APPPGRRRGPPMA.",
        "..APRPPRYRPPRMA.",
        ".APPPGRRRGPPMA..",
        ".APPPPPGPPPPMA..",
        "APRPRPRPRPRMDA..",
        "AMMMMMMMMMMMDA..",
        "ADDDDDDDDDDDA...",
        "AMMMMMMMMMMMA...",
        "AAAAAAAAAAAAA...",
        ".F.F.F.F.F.F....",
        "................",
    ],
)

# --- smoła: gliniany kubełek z czarną, lśniącą smołą, kapiącą przez brzeg, patyk do mazania
ICONS["smola"] = (
    {"A": O, "C": (176, 104, 52), "L": (204, 138, 80), "D": (120, 70, 44), "K": (26, 22, 26),
     "S": (64, 62, 72), "H": (120, 122, 134), "W": (150, 108, 66), "w": (100, 70, 40)},
    [
        "............AA..",
        "...........AWA..",
        "..........AWA...",
        "...AAAAAAAWAAA..",
        "..ALKKKSHKwKKDA.",
        ".ALKKSHSKKKKKKDA",
        ".ACKKKKKKKKKKKDA",
        ".ALCKKLLCCCKKCDA",
        "..ALCKCCCCCKCDA.",
        "..ALCCCCCCCKCDA.",
        "..ALCCCCCCCCCDA.",
        "..AACCCCCCCCDAA.",
        "...ADDCCCCCDDA..",
        "....AAAAAAAAA...",
        "................",
        "................",
    ],
)


def build(name, pal, rows):
    pal = dict(pal)
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    px = img.load()
    for y, row in enumerate(rows[:16]):
        for x, ch in enumerate(row[:16]):
            if ch == ".":
                continue
            c = pal[ch]
            for dy in (0, 1):
                for dx in (0, 1):
                    px[x * 2 + dx, y * 2 + dy] = c + (255,)
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    made = []
    for name, (pal, rows) in ICONS.items():
        img = build(name, pal, rows)
        img.save(os.path.join(OUT, name + ".png"))
        made.append(img)
    # podgląd: wzorcowe ikony gry + nowe, na szarym tle, x4
    iconset = Image.open(os.path.join(ROOT, "img", "system", "IconSet.png")).convert("RGBA")
    refs = [iconset.crop((i % 16 * 32, i // 16 * 32, i % 16 * 32 + 32, i // 16 * 32 + 32)) for i in (354, 362, 334, 349)]
    row = refs + made
    sheet = Image.new("RGBA", (len(row) * 36 + 8, 40), (58, 58, 62, 255))
    for k, im in enumerate(row):
        sheet.alpha_composite(im, (4 + k * 36 + (4 if k >= len(refs) else 0), 4))
    sheet = sheet.resize((sheet.width * 4, sheet.height * 4), Image.NEAREST)
    sheet.save(os.path.join(OUT, "_podglad.png"))
    print("ikony:", ", ".join(ICONS))


if __name__ == "__main__":
    main()
