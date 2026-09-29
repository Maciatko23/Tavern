# python make_docs.py   (CDP_PORT 9376, the game served at 127.0.0.1:8765)  -> docs/dom_dziadka/
# One command for the concept pictures of grandpa's cottage: builds both concepts (and the literal <DayNight:on> variant
# for the lighting comparison), runs the placement checks (stops if anything fails), renders in the real game
#   koncepcja_X.png        the whole map at 1:1, evening 20:30
#   koncepcja_X_dzien.png  the whole map at 1:1, 11:00
#   koncepcja_X_ekran.png  a game screen at the map's zoom 1.5 with the hero and grandpa (17:30)
# and draws
#   koncepcja_X_plan.png   the day picture with numbered pins and a Polish legend
#   oswietlenie.png        the same evening with <DayNight:off> (proposed) and <DayNight:on> (today's note)
import os, sys, json, subprocess
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DOCS = os.path.join(ROOT, "docs", "dom_dziadka")
STAGING = os.path.join(HERE, "staging")
FONT = os.path.join(ROOT, "fonts", "AlegreyaSans-Medium.ttf")
PORT = os.environ.get("CDP_PORT", "9376")

def run(*args):
    r = subprocess.run([sys.executable] + list(args), cwd=HERE)
    return r.returncode

def font(n): return ImageFont.truetype(FONT, n)

def render(jobs):
    jp = os.path.join(STAGING, "_jobs_docs.json")
    with open(jp, "wb") as f: f.write(json.dumps(jobs).encode("utf-8"))
    subprocess.run(["node", os.path.join(HERE, "render.js"), jp], cwd=ROOT, env=dict(os.environ, CDP_PORT=PORT))

def plan(concept, title):
    meta = json.load(open(os.path.join(STAGING, "Map019_%s_meta.json" % concept), encoding="utf-8"))
    base = Image.open(os.path.join(DOCS, "koncepcja_%s_dzien.png" % concept)).convert("RGB")
    W, H = base.size
    LEG = 330
    out = Image.new("RGB", (W + LEG, max(H, 60 + 26 * len(meta["pins"]) + 120) + 50), (24, 22, 26))
    out.paste(Image.blend(base, Image.new("RGB", base.size, (10, 8, 12)), 0.15), (0, 50))
    d = ImageDraw.Draw(out)
    d.text((14, 12), title, font=font(26), fill=(245, 215, 120))
    f, fs = font(17), font(15)
    for i, (label, x, y) in enumerate(meta["pins"], 1):
        cx, cy = int(x * 48 + 24), int(y * 48 + 24) + 50
        d.ellipse([cx - 12, cy - 12, cx + 12, cy + 12], fill=(250, 214, 64), outline=(20, 16, 10), width=2)
        t = str(i); tw = d.textlength(t, font=fs)
        d.text((cx - tw / 2, cy - 10), t, font=fs, fill=(20, 16, 10))
        d.text((W + 18, 60 + (i - 1) * 26), "%d  %s" % (i, label), font=f, fill=(235, 230, 220))
    sp = meta["spots"]
    for key, lab, col in (("start", "S", (120, 220, 120)), ("grandpa", "D", (120, 180, 250)), ("landing", "W", (230, 140, 90))):
        x, y = sp[key][:2]
        cx, cy = x * 48 + 24, y * 48 + 24 + 50
        d.rectangle([cx - 11, cy - 11, cx + 11, cy + 11], fill=col, outline=(20, 16, 10), width=2)
        tw = d.textlength(lab, font=fs); d.text((cx - tw / 2, cy - 10), lab, font=fs, fill=(20, 16, 10))
    y0 = 60 + len(meta["pins"]) * 26 + 14
    for lab, col, txt in (("S", (120, 220, 120), "start nowej gry (%d,%d)" % tuple(sp["start"][:2])),
                          ("D", (120, 180, 250), "dziadek Stach (%d,%d)" % tuple(sp["grandpa"][:2])),
                          ("W", (230, 140, 90), "wejście z podwórza (%d,%d)" % tuple(sp["landing"][:2]))):
        d.rectangle([W + 18, y0, W + 38, y0 + 20], fill=col, outline=(20, 16, 10))
        tw = d.textlength(lab, font=fs); d.text((W + 28 - tw / 2, y0 + 1), lab, font=fs, fill=(20, 16, 10))
        d.text((W + 48, y0), txt, font=f, fill=(235, 230, 220))
        y0 += 28
    d.text((W + 18, y0 + 8), "%d x %d pól, widok w grze: zoom 1.5" % (meta["width"], meta["height"]), font=fs, fill=(170, 165, 160))
    out.save(os.path.join(DOCS, "koncepcja_%s_plan.png" % concept))

def lighting():
    tmp = os.path.join(STAGING, "_light")
    os.makedirs(tmp, exist_ok=True)
    jobs = []
    for tag, mp in (("off", "Map019_B.json"), ("on", "Map019_B_daynight.json")):
        for h in (20.5, 22.5):
            jobs.append({"map": os.path.join(STAGING, mp), "id": 19, "mode": "full", "hour": h, "out": os.path.join(tmp, "%s_%s.png" % (tag, h))})
    render(jobs)
    ims = [[Image.open(os.path.join(tmp, "%s_%s.png" % (t, h))).convert("RGB") for h in (20.5, 22.5)] for t in ("off", "on")]
    w, h = ims[0][0].size
    S = 0.62
    tw, th = int(w * S), int(h * S)
    out = Image.new("RGB", (tw * 2 + 30, th * 2 + 150), (24, 22, 26))
    d = ImageDraw.Draw(out)
    d.text((12, 10), "Oświetlenie domu wieczorem i w nocy (koncepcja B, 20:30 i 22:30)", font=font(24), fill=(245, 215, 120))
    rows = [("PROPONOWANE: <Dark:on> <DayNight:off> <DarkDay:60> <DarkNight:175> - jak tawerna: pora dnia działa przez RoomLighting, świece i palenisko świecą", (140, 220, 140)),
            ("DOSŁOWNIE JAK DZIŚ: <DayNight:on> - nocna warstwa Farming_Render (90% czerni od 20:00) zakrywa pokój, świece i ogień jej nie przebijają", (240, 150, 120))]
    for r, (label, col) in enumerate(rows):
        y = 48 + r * (th + 48)
        d.text((12, y), label, font=font(16), fill=col)
        for c in range(2):
            out.paste(ims[r][c].resize((tw, th), Image.LANCZOS), (10 + c * (tw + 10), y + 24))
    out.save(os.path.join(DOCS, "oswietlenie.png"))

def main():
    os.makedirs(DOCS, exist_ok=True)
    if run("build_house.py") or run("build_house.py", "--daynight-on"): sys.exit("build failed")
    if run("check_house.py"): sys.exit("check_house.py found problems")
    subprocess.run([sys.executable, os.path.join(HERE, "render_house.py"), "A", "B", "full", "day", "screen", "--out", DOCS, "--port", PORT], cwd=HERE)
    plan("A", "Koncepcja A - Chata z bali: izba i komora za ścianką")
    plan("B", "Koncepcja B - Bielona chata: izba z dwiema wnękami")
    lighting()
    print("docs ->", DOCS)

if __name__ == "__main__":
    main()
