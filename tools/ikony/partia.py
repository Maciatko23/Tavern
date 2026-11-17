# Ikony przedmiotów z PixelLab (create_image_pixen 32x32): pobieranie partii, wybór próby, arkusze do przeglądu.
#   python tools/ikony/partia.py pobierz <id>=<job_id> ...      pobiera próbę (tools/ikony/proby/<id>_<n>.png), zapisuje opis.json,
#                                                                 kopiuje ją do staging/<id>.png (najnowsza próba = wybrana)
#   python tools/ikony/partia.py wybierz <id>=<n> ...            wybrana zostaje próba n (kopia do staging/<id>.png)
#   python tools/ikony/partia.py arkusz <od>-<do> | <id> ... [--proby] [--plik NAZWA]
#                                                                 arkusz docs/ekwipunek/ikony/arkusz_<od>-<do>.png (x4, ciemne tło,
#                                                                 numer i nazwa); --proby: wszystkie próby w rzędzie, wybrana w ramce
#   python tools/ikony/partia.py wszystkie                        docs/ekwipunek/ikony/WSZYSTKIE.png (x2, siatka z numerami)
#   python tools/ikony/partia.py lista <od>-<do> | <id> ...     pełne prompty (id TAB prompt) do wysłania
#   python tools/ikony/partia.py stan                             ile ikon, ile prób, czego brak
# Opisy (prompty) są w tools/ikony/prompty.py (PROMPTY: id -> opis po angielsku, NAZWY_NOWE: nazwy rzeczy spoza Items.json).
import json
import os
import shutil
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "tools"))
import prompty as P   # noqa: E402
from pixellab_pobierz import pobierz   # noqa: E402

STAGING = os.path.join(HERE, "staging")
PROBY = os.path.join(HERE, "proby")
OPIS = os.path.join(HERE, "opis.json")
ARKUSZE = os.path.join(ROOT, "docs", "ekwipunek", "ikony")
BG = (58, 58, 62, 255)
FONT = "C:/Windows/Fonts/arial.ttf"

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass


def names():
    out = {}
    try:
        items = json.load(open(os.path.join(ROOT, "data", "Items.json"), encoding="utf-8"))
        for it in items:
            if it and it.get("name", "").strip() and not it["name"].startswith("-"):
                out[it["id"]] = it["name"].strip()
    except Exception as e:
        print("UWAGA: Items.json:", e)
    for k, v in P.NAZWY_NOWE.items():
        out.setdefault(k, v)
    return out


def load():
    if os.path.exists(OPIS):
        return {int(k): v for k, v in json.load(open(OPIS, encoding="utf-8")).items()}
    return {}


def save(op):
    tmp = OPIS + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        json.dump({str(k): op[k] for k in sorted(op)}, f, ensure_ascii=False, indent=1)
    os.replace(tmp, OPIS)


def full_prompt(i):
    return "RPG inventory item icon: %s, centered" % P.PROMPTY[i]


def check(path):
    """short warnings: background, touching the edges, too few pixels"""
    im = Image.open(path).convert("RGBA")
    a = im.getchannel("A")
    box = a.getbbox()
    w = []
    if box is None:
        return "PUSTA"
    corners = [a.getpixel(p) for p in ((0, 0), (31, 0), (0, 31), (31, 31))]
    if sum(1 for c in corners if c > 0) >= 2:
        w.append("TŁO?")
    edges = sum(1 for side in (box[0] == 0, box[1] == 0, box[2] == 32, box[3] == 32) if side)
    if edges >= 3:
        w.append("brzegi%d" % edges)
    n = 32 * 32 - a.histogram()[0]
    if n < 120:
        w.append("mała(%d)" % n)
    return " ".join(w)


def cmd_pobierz(args):
    op = load()
    nm = names()
    os.makedirs(STAGING, exist_ok=True)
    os.makedirs(PROBY, exist_ok=True)
    for a in args:
        sid, job = a.split("=", 1)
        i = int(sid)
        rec = op.get(i) or {"name": nm.get(i, "?"), "prompt": "", "job": "", "tries": 0, "proby": []}
        n = rec["tries"] + 1
        dest = os.path.join(PROBY, "%d_%d.png" % (i, n))
        if not pobierz(job, None, dest):
            print("BŁĄD pobierania", i, job)
            continue
        im = Image.open(dest)
        if im.size != (32, 32):
            print("UWAGA %d: rozmiar %s" % (i, im.size))
        rec["name"] = nm.get(i, rec["name"])
        rec["tries"] = n
        rec["proby"].append({"n": n, "job": job, "prompt": full_prompt(i)})
        rec["wybrana"] = n
        rec["job"] = job
        rec["prompt"] = full_prompt(i)
        shutil.copyfile(dest, os.path.join(STAGING, "%d.png" % i))
        op[i] = rec
        w = check(dest)
        print("%d (%s) próba %d %s" % (i, rec["name"], n, w))
    save(op)


def cmd_wybierz(args):
    op = load()
    for a in args:
        sid, n = a.split("=", 1)
        i, n = int(sid), int(n)
        rec = op[i]
        pr = next(p for p in rec["proby"] if p["n"] == n)
        rec["wybrana"] = n
        rec["job"] = pr["job"]
        rec["prompt"] = pr["prompt"]
        shutil.copyfile(os.path.join(PROBY, "%d_%d.png" % (i, n)), os.path.join(STAGING, "%d.png" % i))
        print("%d: próba %d" % (i, n))
    save(op)


def parse_ids(args, op):
    ids = []
    for a in args:
        if "-" in a:
            lo, hi = map(int, a.split("-"))
            ids += [i for i in sorted(op) if lo <= i <= hi]
        else:
            ids.append(int(a))
    return ids


def font(size):
    try:
        return ImageFont.truetype(FONT, size)
    except Exception:
        return ImageFont.load_default()


def cmd_arkusz(args):
    proby = "--proby" in args
    plik = None
    if "--plik" in args:
        plik = args[args.index("--plik") + 1]
        args = [a for a in args if a not in ("--plik", plik)]
    args = [a for a in args if a != "--proby"]
    op = load()
    ids = parse_ids(args, op)
    if not ids:
        print("nic do pokazania")
        return
    os.makedirs(ARKUSZE, exist_ok=True)
    f = font(13)
    S = 128
    if proby:
        S = 96
        maxn = max(op[i]["tries"] for i in ids)
        cell_w = 8 + maxn * (S + 8) + 8
        cols = max(1, 1200 // cell_w)
        ch = S + 40
        rows = (len(ids) + cols - 1) // cols
        sheet = Image.new("RGBA", (cols * cell_w + 8, rows * ch + 8), BG)
        d = ImageDraw.Draw(sheet)
        for k, i in enumerate(ids):
            rec = op[i]
            x0, y = 8 + (k % cols) * cell_w, 8 + (k // cols) * ch
            for t in range(1, rec["tries"] + 1):
                p = os.path.join(PROBY, "%d_%d.png" % (i, t))
                x = x0 + (t - 1) * (S + 8)
                if t == rec.get("wybrana"):
                    d.rectangle((x - 3, y - 3, x + S + 2, y + S + 2), outline=(255, 230, 90, 255), width=2)
                if os.path.exists(p):
                    sheet.alpha_composite(Image.open(p).convert("RGBA").resize((S, S), Image.NEAREST), (x, y))
                d.text((x + 2, y + 2), str(t), font=f, fill=(150, 150, 150, 255))
            d.text((x0, y + S + 4), "%d %s" % (i, rec["name"][:22]), font=f, fill=(255, 230, 90, 255))
    elif False:
        maxn = max(op[i]["tries"] for i in ids)
        cw, ch = 210 + maxn * (S + 12), S + 14
        sheet = Image.new("RGBA", (cw, 8 + ch * len(ids)), BG)
        d = ImageDraw.Draw(sheet)
        for r, i in enumerate(ids):
            rec = op[i]
            y = 8 + r * ch
            d.text((8, y + 40), "%d" % i, font=font(18), fill=(255, 230, 90, 255))
            d.text((8, y + 66), rec["name"][:26], font=f, fill=(230, 230, 230, 255))
            for k in range(1, rec["tries"] + 1):
                p = os.path.join(PROBY, "%d_%d.png" % (i, k))
                x = 210 + (k - 1) * (S + 12)
                if k == rec.get("wybrana"):
                    d.rectangle((x - 4, y - 4, x + S + 3, y + S + 3), outline=(255, 230, 90, 255), width=2)
                if os.path.exists(p):
                    sheet.alpha_composite(Image.open(p).convert("RGBA").resize((S, S), Image.NEAREST), (x, y))
                d.text((x + 2, y + S - 14), str(k), font=f, fill=(150, 150, 150, 255))
    else:
        cols = 6
        cw, ch = S + 24, S + 40
        rows = (len(ids) + cols - 1) // cols
        sheet = Image.new("RGBA", (cols * cw + 8, rows * ch + 8), BG)
        d = ImageDraw.Draw(sheet)
        for k, i in enumerate(ids):
            x, y = 8 + (k % cols) * cw, 8 + (k // cols) * ch
            p = os.path.join(STAGING, "%d.png" % i)
            d.rectangle((x - 1, y - 1, x + S, y + S), outline=(80, 80, 86, 255))
            if os.path.exists(p):
                sheet.alpha_composite(Image.open(p).convert("RGBA").resize((S, S), Image.NEAREST), (x, y))
            rec = op.get(i, {"name": "?", "tries": 0})
            d.text((x, y + S + 3), "%d (%d)" % (i, rec["tries"]), font=f, fill=(255, 230, 90, 255))
            d.text((x, y + S + 18), rec["name"][:20], font=f, fill=(230, 230, 230, 255))
    name = plik or ("arkusz_%d-%d%s.png" % (ids[0], ids[-1], "_proby" if proby else ""))
    out = os.path.join(ARKUSZE, name)
    sheet.convert("RGB").save(out)
    print(out)


def cmd_wszystkie(args):
    op = load()
    ids = [i for i in sorted(op) if os.path.exists(os.path.join(STAGING, "%d.png" % i))]
    cols = 20
    cw, ch = 64 + 8, 64 + 18
    rows = (len(ids) + cols - 1) // cols
    sheet = Image.new("RGBA", (cols * cw + 8, rows * ch + 8), BG)
    d = ImageDraw.Draw(sheet)
    f = font(11)
    for k, i in enumerate(ids):
        x, y = 8 + (k % cols) * cw, 8 + (k // cols) * ch
        sheet.alpha_composite(Image.open(os.path.join(STAGING, "%d.png" % i)).convert("RGBA").resize((64, 64), Image.NEAREST), (x, y))
        d.text((x, y + 65), str(i), font=f, fill=(255, 230, 90, 255))
    os.makedirs(ARKUSZE, exist_ok=True)
    out = os.path.join(ARKUSZE, "WSZYSTKIE.png")
    sheet.convert("RGB").save(out)
    print(out, len(ids), "ikon")


def cmd_lista(args):
    """the full prompts of the given ids (ranges over PROMPTY): one line each, "id<TAB>prompt" """
    ids = []
    for a in args:
        if "-" in a:
            lo, hi = map(int, a.split("-"))
            ids += [i for i in sorted(P.PROMPTY) if lo <= i <= hi]
        else:
            ids.append(int(a))
    for i in ids:
        print("%d	%s" % (i, full_prompt(i)))


def cmd_stan(args):
    op = load()
    nm = names()
    want = sorted(set(nm) | set(P.PROMPTY))
    done = [i for i in want if os.path.exists(os.path.join(STAGING, "%d.png" % i))]
    tries = sum(sum(1 for p in r["proby"] if len(p["job"]) == 36) for r in op.values())   # (PixelLab job ids only: no pilot, no recolour)
    print("ikon: %d / %d, prób (generacji): %d" % (len(done), len(want), tries))
    no_prompt = [i for i in want if i not in P.PROMPTY and i not in P.PILOT]
    if no_prompt:
        print("bez opisu:", no_prompt)
    missing = [i for i in want if i not in done]
    print("brak ikon (%d):" % len(missing), " ".join(map(str, missing)))


if __name__ == "__main__":
    c, rest = sys.argv[1], sys.argv[2:]
    {"pobierz": cmd_pobierz, "wybierz": cmd_wybierz, "arkusz": cmd_arkusz, "wszystkie": cmd_wszystkie, "stan": cmd_stan, "lista": cmd_lista}[c](rest)
