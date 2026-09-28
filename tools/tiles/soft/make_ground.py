"""make_ground.py - make a new SOFT ground (Winlu style: painted, smooth, soft blended edges) and put
it into a slot of an RPG Maker MZ A2 sheet. See README.md in this folder.

  python tools/tiles/soft/make_ground.py recipes/bloto.json
        build the ground of a recipe into its default slots of --out (default img/tilesets/Soft_Test_A2.png)
  python tools/tiles/soft/make_ground.py --name bloto --describe "wet mud" --kind overlay --slot k39 --out img/tilesets/Soft_X_A2.png
        the same by name: recipes/<name>.json, or a new recipe from the nearest preset when there is none
  python tools/tiles/soft/make_ground.py --sheet recipes/test_sheet.json
        several grounds into one sheet (the test sheet: mud k39 + k24, forest floor k46, sandy path k23)
  python tools/tiles/soft/make_ground.py --pixellab --name X --describe "..." [--ref k24] [--seed 11]
        print (and save to src/X/) the PixelLab call that makes a source image for a new material
  python tools/tiles/soft/make_ground.py --fetch URL src/X/pl_name.png
        download a finished PixelLab image into src/ (then name it in the recipe's sources)

Options: --out SHEET (png, relative to the project), --base SHEET (start from it; default: --out when
it exists, else the Winlu A2 of tileset 9), --fresh (start from the Winlu A2 even when --out exists),
--slot kNN (repeatable, overrides the recipe's slots), --kind overlay|full (for --slot),
--no-preview, --quiet.
Every build writes tools/tiles/soft/work/<name>/: tex.png (the 48x48 texture), block_kNN.png,
preview_1x.png / preview_x3.png (ground-only renders of real map windows, Winlu left, new right),
tiles_x4.png and report.json (the checks, also printed).
"""
import argparse, base64, copy, io, json, math, os, re, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image

from groundlib import paths as P, mz, tex as T, content as CT, edges as E, checks as C, preview as PV

DEFAULT_OUT = os.path.join("img", "tilesets", "Soft_Test_A2.png")


# ------------------------------------------------------------------ recipes
def load_json(path):
    with open(path, "rb") as f:
        return json.loads(f.read().decode("utf-8"))


def dumps(obj):
    """JSON with the short lists (numbers, colours, sizes) on one line - readable recipes."""
    s = json.dumps(obj, indent=1, ensure_ascii=False)

    def collapse(m):
        return "[" + ", ".join(x.strip() for x in m.group(1).split(",")) + "]"
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r"\[\s*([^\[\]{}]*?)\s*\]", collapse, s)
    return s


def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write((dumps(obj) + "\n").encode("utf-8"))


def recipe_path(name_or_path):
    """A recipe by path (from the current folder or from tools/tiles/soft) or by name (recipes/<name>.json)."""
    for p in (name_or_path, os.path.join(HERE, name_or_path)):
        if os.path.isfile(p):
            return p
    base = os.path.basename(name_or_path)
    return os.path.join(P.RECIPES, base if base.endswith(".json") else base + ".json")


def kind_of(slot):
    return int(str(slot).lower().lstrip("k"))


# words -> the recipe a new ground starts from (then tune colours / sources in the copy)
PRESETS = [
    (("mud", "błot", "blot", "wet", "mokr", "bagn", "swamp", "bog", "peat", "torf", "marsh"), "bloto"),
    (("forest", "ściółk", "sciolk", "moss", "mech", "needle", "igliw", "litter", "leaves", "leaf", "liści", "pine", "sosn"), "sciolka"),
    (("grass", "traw", "hay", "siano", "słom", "slom", "meadow", "łąk", "turf", "darń", "darn"), "sucha_trawa"),
    (("sand", "piasek", "piask", "beach", "plaż", "path", "ścież", "sciez", "gravel", "żwir", "pebble", "kamyk"), "piasek"),
]


def preset_for(describe):
    d = (describe or "").lower()
    for words, name in PRESETS:
        if any(w in d for w in words):
            return name
    return "piasek"


def new_recipe(name, describe, kind, slot):
    if not slot:
        sys.exit("a new ground needs --slot kNN (which A2 slot to fill); see README.md for the free ones")
    base = preset_for(describe)
    r = load_json(recipe_path(base))
    r = copy.deepcopy(r)
    r["name"], r["title"] = name, name
    r["describe"] = describe or r.get("describe", "")
    r["made_from"] = "preset '%s' - tune texture.sources / finish.mean / edge (README.md)" % base
    r.pop("note", None)                     # (the preset's own history, not this ground's)
    if slot:
        how = kind or ("overlay" if mz.is_overlay_kind(kind_of(slot)) else "full")
        r["slots"] = {slot: how}
        # previews: a slot no map uses yet is drawn on the cells of a similar kind - the kind whose edge
        # mask the preset borrows (dirt paths k39, dark-grass patches k46) or the dirt ground k24
        used = sum(int(mz.map_kind_mask(m, [kind_of(slot)], 1 if how == "overlay" else 0).sum()) for m in mz.outdoor_maps())
        r.pop("preview_remap", None)
        if used < 20:
            mask = int(r.get("edge", {}).get("mask", 39))
            r["preview_remap"] = {("k%d" % (mask if mask in (39, 46) else 39)) if how == "overlay" else "k24": slot}
    p = recipe_path(name)
    save_json(p, r)
    print("new recipe %s (from the '%s' preset) - edit it and run again" % (os.path.relpath(p, P.ROOT), base))
    return r


# ------------------------------------------------------------------ one ground
def build_ground(r, quiet=False):
    """-> dict(tex, blocks {kind: float RGBA block}, report)"""
    t = r["texture"]
    tex, ex = CT.build_texture(t)
    e = dict(r.get("edge", {}))
    if e.get("spill") and ex.get("cover") is not None:
        e["_spill"] = ex["cover"]
    if e.get("edge_source"):
        # the texture blended in toward the overlay's fade (e.g. moss before the needle litter)
        src = CT.load_source(t["sources"][e["edge_source"]])
        if t.get("finish"):
            # the same finish, but its own mean colour (or edge_mean) - it is there to be a different colour
            f = dict(t["finish"], mean=e.get("edge_mean") or list(src.reshape(-1, 3).mean(0)))
            et = CT.finish(src, **f)
        else:
            et = src
        e["_edge_tex"] = np.clip(et, 0, 255)
    if e.get("mask_sheet"):
        e["mask_sheet_path"] = P.sheet_path(e["mask_sheet"])
    blocks = {}
    for slot, how in r.get("slots", {}).items():
        k = kind_of(slot)
        if how == "overlay":
            b = E.overlay_block(tex, e)
            d = r.get("decor")
            if d:
                b = E.decorate(b, d.get("kind", "glints"), seed=int(d.get("seed", 3)), n_edge=tuple(d.get("n_edge", (0, 1))),
                               n_body=int(d.get("n_body", 0)), min_alpha=float(d.get("min_alpha", 0.55)),
                               colour=d.get("colour"), strength=float(d.get("strength", 1.0)), size=d.get("size"))
            b = E.finish_thumbnail(b, tex, e) if e.get("thumbnail", "mask") == "mask" else E.finish_thumbnail(b)
        else:
            b = mz.plain_block(tex)
        blocks[k] = b
    return {"tex": tex, "blocks": blocks, "edge": e}


def report(r, g):
    t = r["texture"]
    fin = t.get("finish") or {}
    ref = CT.reference(fin.get("ref", "k24"))
    rep = {"texture": C.texture_report(g["tex"], ref), "blocks": {}}
    for k, b in g["blocks"].items():
        img = E.to_image(b)
        br = {"soil": C.soil_verdict(img)}
        if mz.is_overlay_kind(k) and b[..., 3].min() < 255:
            br["alpha_joins"] = C.alpha_joins(img)
            cr, _ = C.crease_report(img, int(g["edge"].get("mask", 39)), mz.winlu_body(16))
            br["creases"] = cr
        rep["blocks"]["k%d" % k] = br
    want = r.get("soil")
    if want:
        got = [v["soil"]["kind"] for v in rep["blocks"].values()]
        rep["soil_ok"] = all((x == want) if want != "soil" else bool(x) for x in got)
    return rep


def print_report(name, rep):
    tr = rep["texture"]
    flag = lambda ok: "ok" if ok else "!!"
    print("  texture  mean %s  hsv %s  colours %d  mean|dL| %.2f  steps>24 %.2f%%" % (
        tr["mean"], tr["hsv"], tr["colours"], tr["grad"], 100 * tr["steps>24"]))
    print("  bands    %s  (Winlu ref %s)  ratio %s  %s" % (tr["bands"], tr["ref_bands"], tr["band_ratio"], flag(tr["bands_ok"])))
    print("  repeat   luma %.2f (<= 1.8) %s   colour %.2f (<= 2.7, Winlu ref %.2f) %s   pops %.2f%% (<= 0.5%%) %s" % (
        tr["repeat"], flag(tr["repeat_ok"]), tr["chroma_repeat"], tr["chroma_repeat_ref"], flag(tr["chroma_repeat_ok"]),
        100 * tr["pops"], flag(tr["pops_ok"])))
    for k, br in rep["blocks"].items():
        s = br["soil"]
        line = "  %-4s     Farming.js soil: %s %s" % (k, s.get("kind"), s.get("tint", s.get("why", "")))
        if "creases" in br:
            c = br["creases"]
            line += ("\n           quarter-line creases: jumps>20 %.2f%% (Winlu %.2f%%), on-line/next-line %.2f (Winlu %.2f) %s"
                     " | alpha joins p99 %.0f (inside %.0f)") % (
                100 * c["new_share"], 100 * c["winlu_share"], c["new_ratio"], c["winlu_ratio"], flag(c["ok"]),
                br["alpha_joins"]["p99_on"], br["alpha_joins"]["p99_next"])
        print(line)
    if "soil_ok" in rep:
        print("  soil     expected by the recipe: %s" % flag(rep["soil_ok"]))


def previews(r, g, sheet_img, workdir):
    """Ground-only renders of real map windows: Winlu left, the new sheet right (1:1 and x3), + tiles."""
    os.makedirs(workdir, exist_ok=True)
    remap = {kind_of(a): kind_of(b) for a, b in r.get("preview_remap", {}).items()}
    wins = r.get("preview")
    if not wins:
        k = next(iter(g["blocks"]))
        look = next((a for a, b in remap.items() if b == k), k)
        wins = [[m, dx, dy, 14, 9] for m, dx, dy in PV.find_windows(look, 14, 9, top=2)]
    items = []
    for m, dx, dy, w, h in wins:
        items.append(("Winlu  Map%03d (%d,%d)" % (m, dx, dy), PV.render_window(mz.sheet(), m, dx, dy, w, h)))
        items.append(("%s  Map%03d (%d,%d)" % (r.get("title", r["name"]), m, dx, dy), PV.render_window(sheet_img, m, dx, dy, w, h, remap)))
    PV.labelled(items, cols=2).save(os.path.join(workdir, "preview_1x.png"))
    m, dx, dy, w, h = wins[0]
    zw, zh = min(w, 7), min(h, 5)
    zx, zy = dx + (w - zw) // 2, dy + (h - zh) // 2
    z = [("Winlu x3", PV.zoom(PV.render_window(mz.sheet(), m, zx, zy, zw, zh), 3)),
         (r.get("title", r["name"]) + " x3", PV.zoom(PV.render_window(sheet_img, m, zx, zy, zw, zh, remap), 3))]
    PV.labelled(z, cols=2).save(os.path.join(workdir, "preview_x3.png"))
    ref = (r["texture"].get("finish") or {}).get("ref", "k24")
    PV.labelled([("Winlu %s x4" % ref, PV.zoom(PV.tiled(CT.reference(ref), 3, 2), 4)),
                 (r.get("title", r["name"]) + " x4", PV.zoom(PV.tiled(g["tex"], 3, 2), 4))], cols=2).save(os.path.join(workdir, "tiles_x4.png"))


def out_path(p):
    p = p if os.path.isabs(p) else os.path.join(P.ROOT, p)
    if "Winlu Fantasy Tileset" in p:
        sys.exit("refusing to write into the Winlu folders (the original sheets stay untouched): " + p)
    # the game's own pictures stay untouched too: inside img/ this tool only writes its own sheets,
    # named Soft_*.png (so a typo can never overwrite e.g. img/tilesets/Outside_A2.png)
    img = os.path.normcase(os.path.join(P.ROOT, "img") + os.sep)
    if os.path.normcase(os.path.abspath(p)).startswith(img) and not os.path.basename(p).startswith("Soft_"):
        sys.exit("inside img/ this tool only writes its own sheets, named Soft_*.png (e.g. img/tilesets/Soft_%s): %s"
                 % (os.path.basename(p), p))
    return p


def make(recipes_and_slots, out, base=None, fresh=False, preview=True, quiet=False):
    """recipes_and_slots: [(recipe dict, {slot: how} or None)] -> writes 'out'; returns the reports."""
    outp = out_path(out)
    if base:
        start = P.sheet_path(base)
    elif os.path.exists(outp) and not fresh:
        start = outp
    else:
        start = P.WINLU_A2
    sheet = Image.open(start).convert("RGBA")
    before = sheet.copy()
    reports, targets, done = {}, [], []
    for r, slots in recipes_and_slots:
        r = copy.deepcopy(r)
        if slots:
            r["slots"] = slots
        g = build_ground(r, quiet)
        for k, b in g["blocks"].items():
            mz.paste(sheet, k, b)
            targets.append(k)
        work = os.path.join(P.WORK, r["name"])
        os.makedirs(work, exist_ok=True)
        T.to_img(g["tex"]).save(os.path.join(work, "tex.png"))
        for k, b in g["blocks"].items():
            E.to_image(b).save(os.path.join(work, "block_k%d.png" % k))
        rep = report(r, g)
        reports[r["name"]] = rep
        save_json(os.path.join(work, "report.json"), rep)
        if not quiet:
            print("%s -> %s" % (r["name"], ", ".join("k%d (%s)" % (k, "overlay" if mz.is_overlay_kind(k) and g["blocks"][k][..., 3].min() < 255 else "full") for k in g["blocks"])))
            print_report(r["name"], rep)
        r["_g"] = g
        done.append(r)
    changed = C.changed_kinds(before, sheet)
    stray = [k for k in changed if k not in targets]
    os.makedirs(os.path.dirname(outp), exist_ok=True)
    sheet.save(outp)
    if not quiet:
        print("sheet %s (from %s): changed kinds %s%s" % (os.path.relpath(outp, P.ROOT), os.path.relpath(start, P.ROOT), changed,
                                                          "  !! unexpected: %s" % stray if stray else "  ok"))
    if preview:
        for r in done:
            previews(r, r["_g"], sheet, os.path.join(P.WORK, r["name"]))
        if not quiet:
            print("previews in %s" % os.path.relpath(P.WORK, P.ROOT))
    return reports


# ------------------------------------------------------------------ PixelLab helpers
PROMPT = ("Seamless top-down ground texture that fills the whole square canvas edge to edge: {describe}. "
          "Soft painterly RPG tileset style with smooth gradients and many close colours, no outlines, no border, "
          "no vignette, no objects standing up, low contrast, even lighting, seen straight from above.")
STYLE_USAGE = "copy its soft painted technique: low contrast, smooth blended colour transitions, no outlines"


def style_ref(ref="k24", crop=24, colours=16):
    """A tiny style image that survives the MCP transfer: a crop of a Winlu ground at 1:1, as a
    16-colour palette PNG (about 600 characters of base64). The 2026-09-27 pilot lost characters of
    bigger refs in transit (a 7 KB ref failed; so did a 2.7 KB one on 2026-09-27 evening)."""
    body = CT.reference(ref)
    im = T.to_img(body[:crop, :crop]).quantize(colours, method=Image.Quantize.MEDIANCUT)
    buf = io.BytesIO()
    im.save(buf, "PNG", optimize=True)
    return im, base64.b64encode(buf.getvalue()).decode("ascii")


def pixellab_request(name, describe, ref="k24", seed=11, size=192):
    im, b64 = style_ref(ref)
    d = os.path.join(P.SRC, name)
    os.makedirs(d, exist_ok=True)
    im.save(os.path.join(d, "style_ref_%s.png" % ref))
    req = {"tool": "mcp__pixellab__create_image_pro_flash",
           "params": {"description": PROMPT.format(describe=describe), "width": size, "height": size,
                      "no_background": False, "seed": seed,
                      "style_image": {"base64": b64, "usage_description": STYLE_USAGE},
                      "style_options": {"color_palette": False, "outline": True, "detail": True, "shading": True}},
           "cost": "about %d generations (%dx%d)" % (max(1, math.ceil(9 * (size * size) / (256 * 256))), size, size),
           "then": "download the result into tools/tiles/soft/src/%s/ (make_ground.py --fetch URL src/%s/pl_<what>_s%d_%d.png) "
                   "and add it to the recipe: \"sources\": {\"pl\": {\"pixellab\": \"%s/pl_<what>_s%d_%d.png\"}}" % (name, name, seed, size, name, seed, size)}
    save_json(os.path.join(d, "pixellab_request_s%d.json" % seed), req)
    return req


def fetch(url, dest):
    dest = dest if os.path.isabs(dest) else os.path.join(HERE, dest)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(url) as resp:
        data = resp.read()
    Image.open(io.BytesIO(data)).convert("RGBA").save(dest)
    print("saved", os.path.relpath(dest, P.ROOT), Image.open(dest).size)


# ------------------------------------------------------------------ main
def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("recipe", nargs="?", help="recipes/<name>.json (or a path)")
    ap.add_argument("--name")
    ap.add_argument("--describe", default="")
    ap.add_argument("--kind", choices=["overlay", "full"])
    ap.add_argument("--slot", action="append", help="kNN, repeatable")
    ap.add_argument("--out")
    ap.add_argument("--base")
    ap.add_argument("--fresh", action="store_true")
    ap.add_argument("--sheet", help="a sheet recipe: several grounds into one A2")
    ap.add_argument("--no-preview", action="store_true")
    ap.add_argument("--quiet", action="store_true")
    ap.add_argument("--pixellab", action="store_true")
    ap.add_argument("--ref", default="k24")
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--size", type=int, default=192)
    ap.add_argument("--fetch", nargs=2, metavar=("URL", "DEST"))
    a = ap.parse_args(argv)

    if a.fetch:
        return fetch(*a.fetch)
    if a.pixellab:
        if not a.name or not a.describe:
            sys.exit("--pixellab needs --name and --describe")
        req = pixellab_request(a.name, a.describe, a.ref, a.seed, a.size)
        print(json.dumps(req, indent=1, ensure_ascii=False))
        return req
    if a.sheet:
        s = load_json(recipe_path(a.sheet))
        items = [(load_json(recipe_path(g["recipe"])), g.get("slots")) for g in s["grounds"]]
        return make(items, a.out or s.get("out", DEFAULT_OUT), a.base or s.get("base"), a.fresh or s.get("fresh", False),
                    not a.no_preview, a.quiet)
    if a.recipe:
        r = load_json(recipe_path(a.recipe))
    elif a.name:
        p = recipe_path(a.name)
        r = load_json(p) if os.path.exists(p) else new_recipe(a.name, a.describe, a.kind, (a.slot or [None])[0])
    else:
        ap.print_help()
        return
    slots = None
    if a.slot:
        slots = {s: a.kind or ("overlay" if mz.is_overlay_kind(kind_of(s)) else "full") for s in a.slot}
        for s_, how in slots.items():
            if (how == "overlay") != mz.is_overlay_kind(kind_of(s_)):
                print("warning: %s is a %s slot in a 'field' A2 (block columns 0-3 = grounds on layer 0, 4-7 = "
                      "overlays on layer 1) but gets a %s block" % (s_, "overlay" if mz.is_overlay_kind(kind_of(s_)) else "ground", how))
    return make([(r, slots)], a.out or DEFAULT_OUT, a.base, a.fresh, not a.no_preview, a.quiet)


if __name__ == "__main__":
    main()
