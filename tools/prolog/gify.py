# GIF-y animacji prologu z klatek tools/prolog/klatki_anim (tools/prolog/animacje.js): docs/prolog/choragiew.gif (wieś),
# choragiew_port.gif, plaza_upadek.gif. Czas każdej klatki = odstęp klatek gry między zrzutami (60 na sekundę).
import os, json
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.join(HERE, "klatki_anim")
OUT = os.path.join(HERE, "..", "..", "docs", "prolog")


def gif(name, dir, box, scale=1.0, first=0, last=None, colors=128, short_talk=False):
    """short_talk: while a thought bubble is up only every 4th shot, and quickly (the GIF stays short)"""
    log = json.load(open(os.path.join(FR, "czasy.json")))[dir]
    files = sorted(f for f in os.listdir(os.path.join(FR, dir)) if f.endswith(".png"))
    last = len(files) if last is None else last
    keep = [i for i in range(first, last) if not (short_talk and log[i].get("bubble") and i % 4)]
    frames, durs = [], []
    for n, i in enumerate(keep):
        im = Image.open(os.path.join(FR, dir, files[i])).convert("RGB").crop(box)
        if scale != 1.0:
            im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        frames.append(im)
        nxt = log[keep[n + 1]]["fc"] if n + 1 < len(keep) else log[i]["fc"] + 3
        ms = max(20, round((nxt - log[i]["fc"]) * 1000 / 60 / 10) * 10)
        durs.append(min(ms, 160) if short_talk and log[i].get("bubble") else ms)
    # one palette for the whole film (no flicker between frames)
    pal = frames[len(frames) // 2].quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.Dither.NONE) for f in frames]
    p = os.path.join(OUT, name)
    q[0].save(p, save_all=True, append_images=q[1:], duration=durs, loop=0, optimize=True)
    print(p, len(q), "klatek", sum(durs) / 1000, "s", os.path.getsize(p) // 1024, "KB")


if __name__ == "__main__":
    gif("choragiew.gif", "wies", (880, 160, 1120, 420), colors=80)
    gif("choragiew_port.gif", "port", (180, 60, 640, 290), colors=80)
    log = json.load(open(os.path.join(FR, "czasy.json")))["plaza"]
    start = max(0, next(i for i, e in enumerate(log) if e.get("seq") == "getup") - 14)
    gif("plaza_upadek.gif", "plaza", (0, 56, 1280, 664), scale=0.42, first=start, colors=96, short_talk=True)
