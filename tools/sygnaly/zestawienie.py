# -*- coding: utf-8 -*-
"""docs/zadania_nowe/sygnaly_gra/zestawienie.png: a contact sheet of the in-game pictures (every scene, place and character of W19),
plus poses_strip.png (the four poses of the sails, cropped from the game pictures) and the sprite sheets of the four new people next to the hero.
  python tools/sygnaly/zestawienie.py"""
import os, sys
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
GRA = os.path.join(ROOT, "docs", "zadania_nowe", "sygnaly_gra")
PIC = [("walenty_tawerna", "Walenty w tawernie"), ("s1_przed_mlynem", "S1: czuwanie przed mlynem"), ("s1_skrzydla_B", "S1: skrzydla same (B)"),
       ("poza_A_plus", "poza A plus"), ("poza_B_iks", "poza B iks"), ("poza_C_lewy_skos", "poza C lewy skos"), ("poza_D_prawy_skos", "poza D prawy skos"),
       ("lasica_suszarnia", "Lasica w suszarni"), ("s2_podsluch", "S2: Lasica lunetą"), ("s2_latarnia", "S2: blysk latarni"), ("archiwum_tom", "Archiwum: tom o skrzydlach"),
       ("mlyn_dawn_parter", "Mlyn: parter, switem"), ("mlyn_day_komora", "Mlyn: komora, dzien"), ("mlyn_dusk_parter", "Mlyn: parter, zmierzch"), ("mlyn_night_komora", "Mlyn: komora, noc"),
       ("minigra_poza_B", "mini-gra: Hamulec skrzydel"), ("minigra_latarnia_wpis", "mini-gra: Rozmowa swiatlami"), ("zatoczka_noc_przed", "zatoczka noca"),
       ("lodz_dobija", "lodz dobija"), ("s4_zasadzka", "S4: zasadzka"), ("wyjscie_szyper", "wyjscia"), ("s5_ranek", "S5: ranek w mlynie")]


def main():
    have = [(f, c) for f, c in PIC if os.path.exists(os.path.join(GRA, f + ".png"))]
    cw, ch, cols = 640, 360, 4
    rows = (len(have) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cw, rows * (ch + 22)), (24, 24, 28))
    d = ImageDraw.Draw(sheet)
    for i, (f, cap) in enumerate(have):
        im = Image.open(os.path.join(GRA, f + ".png")).convert("RGB").resize((cw - 6, ch - 4), Image.LANCZOS)
        x, y = (i % cols) * cw + 3, (i // cols) * (ch + 22)
        sheet.paste(im, (x, y + 20))
        d.text((x + 4, y + 4), cap, fill=(255, 210, 63))
    sheet.save(os.path.join(GRA, "zestawienie.png"))
    print("zestawienie.png:", len(have), "obrazkow")
    # the four people next to the hero (from docs/postacie)
    ims = []
    for k in ("walenty", "jasiek", "lasica", "szyper"):
        p = os.path.join(ROOT, "docs", "postacie", k + "_z_bohaterem.png")
        if os.path.exists(p): ims.append(Image.open(p).convert("RGBA"))
    if ims:
        w = max(i.width for i in ims); h = sum(i.height for i in ims)
        o = Image.new("RGBA", (w, h), (70, 74, 80, 255)); y = 0
        for i in ims: o.alpha_composite(i, (0, y)); y += i.height
        o.convert("RGB").save(os.path.join(GRA, "postacie.png"))
        print("postacie.png")
    # the poses' strip: the mill's top cropped from the four pose pictures
    crops = []
    for f in ("poza_A_plus", "poza_B_iks", "poza_C_lewy_skos", "poza_D_prawy_skos"):
        p = os.path.join(GRA, f + ".png")
        if os.path.exists(p): crops.append(Image.open(p).convert("RGB").crop((420, 0, 860, 300)))
    if crops:
        o = Image.new("RGB", (sum(c.width for c in crops) + 6 * len(crops), crops[0].height), (24, 24, 28)); x = 0
        for c in crops: o.paste(c, (x, 0)); x += c.width + 6
        o.save(os.path.join(GRA, "pozy_skrzydel.png"))
        print("pozy_skrzydel.png")


if __name__ == "__main__":
    main()
