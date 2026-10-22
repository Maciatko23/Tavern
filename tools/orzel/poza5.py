# python tools/orzel/poza5.py   (then: python tools/orzel/build_sheets.py --preview)
#   -> tools/orzel/raw2/dorosly/Idle/animations/wysiad, wysiad_sen, wysiad_ranny   the adult's poses from the front, lying in its nest like a
#      brooding bird (build_sheets.py POSES[5] reads them): 0 = standing, then crouching (the "sit" animation) and lying belly down;
#      asleep; hurt
# Biały orzeł (2026-10-18). Sources: raw3/poza5/lezy_wysiaduje.png, lezy_spi.png (PixelLab edits of the standing south rotation),
# raw3/lezy_dorosly.png (hurt). Lowered to the feet's line (belly on the ground) and made narrower - its wings drawn in to the body (the
# picture squeezed across, nearest pixels) - so that it lies in the perch's bowl with room to spare (user: "dalej widać
# wystające skrzydło z lewej na gnieździe").
import os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, "raw2", "dorosly", "Idle", "animations")
NARROW = {"k": 0.84}                 # its width x this (230 px -> 193)


def load(p):
    return Image.open(p).convert("RGBA")


def lower(im, feet):
    dy = feet - im.getbbox()[3]
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.alpha_composite(im.crop((0, 0, im.width, im.height - max(0, dy))), (0, max(0, dy)))
    return out


def narrow(im, k=NARROW["k"]):
    """narrower: the picture squeezed across (every few columns of pixels left out - no new colours, no blur), its middle kept where it was"""
    x0, y0, x1, y1 = im.getbbox()
    part = im.crop((x0, 0, x1, im.height))
    w = max(1, round(part.width * k))
    part = part.resize((w, im.height), Image.NEAREST)
    out = Image.new("RGBA", im.size, (0, 0, 0, 0))
    out.alpha_composite(part, ((x0 + x1) // 2 - w // 2, 0))
    return out


def save(name, frames, note):
    d = os.path.join(R, name, "south")
    os.makedirs(d, exist_ok=True)
    for i, f in enumerate(frames):
        f.save(os.path.join(d, "frame_%03d.png" % i))
    with open(os.path.join(R, name, "OPIS.txt"), "w", encoding="utf-8") as f:
        f.write(note + "\n")


def main():
    sit = [load(os.path.join(R, "sit", "south", "frame_%03d.png" % i)) for i in range(5)]
    rot = load(os.path.join(HERE, "raw2", "dorosly", "Idle", "rotations", "south.png"))
    feet = max(sit[0].getbbox()[3], rot.getbbox()[3])
    lie = narrow(lower(load(os.path.join(HERE, "raw3", "poza5", "lezy_wysiaduje.png")), feet))
    sleep = narrow(lower(load(os.path.join(HERE, "raw3", "poza5", "lezy_spi.png")), feet))
    hurt = narrow(lower(load(os.path.join(HERE, "raw3", "lezy_dorosly.png")), feet), 0.8)
    save("wysiad", [sit[0], sit[1], sit[2], lie], "(wysiad: 0 = stoi, 1-2 = przysiada (sit), 3 = leży brzuchem w dół, skrzydła przy ciele - tools/orzel/poza5.py)")
    save("wysiad_sen", [sit[0], lie, sleep], "(wysiad_sen: 0 = stoi, 1 = leży, 2 = śpi z głową w piórach - tools/orzel/poza5.py)")
    save("wysiad_ranny", [sit[0], lie, hurt], "(wysiad_ranny: 0 = stoi, 1 = leży, 2 = leży ranny - tools/orzel/poza5.py)")
    print("feet", feet, "lie", lie.getbbox(), "sleep", sleep.getbbox(), "hurt", hurt.getbbox())


if __name__ == "__main__":
    main()
