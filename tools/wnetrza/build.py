# python tools/wnetrza/build.py [ids...] [--render] [--overlay] [--shots] [--compare] [--install] [--force]
# The interiors' polish (2026-10-12, user: "żeby wnętrza domków wyglądały ładnie, równo i profesjonalnie"): every interior is
# read from the BASE copy of its map (tools/wnetrza/base/MapNNN.json = data/ as the user left it on 2026-10-12, made by the first
# run) and edited in place by its plan in rooms.py - the user's own work in the editor stays (Map102/103/104/117 only get
# small additions in empty places), the others are refurnished and decorated. Writes nothing in data/ without --install.
#
#   (no option)   stage tools/wnetrza/staging/MapNNN.json + run the checks (walking from every landing, the doors, the residents'
#                 markers, the Silent's look events, every light a flame or a window by day)
#   --render      static pictures of the staged maps (tools/wnetrza/staging/render_NNN.png, with a grid)
#   --overlay     tools/wnetrza/staging/overlay/data/ = the staged maps, for the game (GAME_OVERLAY=tools/wnetrza/staging/overlay)
#   --shots       in-game pictures BEFORE (data/) and AFTER (the overlay), day + night -> docs/wnetrza_poprawa/ (CDP_PORT, 9461)
#   --compare     docs/wnetrza_poprawa/porownanie_NNN.png (before | after, day and night) + zestawienie.png
#   --install     writes data/MapNNN.json: refuses while the RPG Maker MZ editor (RPGMZ.exe) runs; a map changed in data/ since
#                 its base copy was taken is left alone (the user edited it again - rebase first: --rebase NNN); copies what it
#                 replaces to backup_art_2026-10-12/wnetrza/
#   --rebase      take the current data/ map as the new base (after the user edited it in the editor)
import os, sys, json, shutil, hashlib, subprocess, argparse, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
DATA = ROOT + "data/"
BASE = os.path.join(HERE, "base") + "/"
STAGING = os.path.join(HERE, "staging")
OVERLAY = os.path.join(STAGING, "overlay")
BACKUP = ROOT + "backup_art_2026-10-12/wnetrza/"
DOCS = ROOT + "docs/wnetrza_poprawa/"
REC = os.path.join(HERE, "installed.json")
sys.path.insert(0, HERE)
sha = lambda b: hashlib.sha256(b).hexdigest()

IDS = [100, 102, 103, 104, 105, 106, 107, 108, 109, 110, 112, 113, 114, 115, 116, 117, 121, 122, 123, 124]


def read(p):
    with open(p, "rb") as f: return f.read()


def editor_running():
    try:
        out = subprocess.run(["tasklist"], capture_output=True, text=True, errors="replace").stdout
    except Exception:
        return False
    return any(l.lower().startswith("rpgmz") for l in out.splitlines())


def ensure_base(ids, rebase=()):
    """the base copies: data/ as it was when this work started (2026-10-12); --rebase takes data/ again"""
    os.makedirs(BASE, exist_ok=True)
    for i in ids:
        n = "Map%03d.json" % i
        if not os.path.exists(BASE + n) or i in rebase:
            shutil.copy2(DATA + n, BASE + n)
            print("base <- data/%s" % n)


# ---------------------------------------------------------------------------------------------------- checks
def check(mid, j, base_j):
    """problems of a staged map (a list of strings)"""
    import wlib
    from engine import Engine, occupy_cells
    probs = []
    W, H, data = j["width"], j["height"], j["data"]
    events = [e for e in j["events"] if e]
    eng = Engine(W, H, data, wlib.FLAGS8, events)
    # (the Silent stand on their spots as solid figures by day - page 2 of their events: they block like furniture)
    for e in events:
        if any(p["priorityType"] == 1 and not p["through"] for p in e["pages"]):
            eng.block.add((e["x"], e["y"]))
    # the doors and the markers of the base are all there, in the same place, the same commands
    be = {e["id"]: e for e in base_j["events"] if e}
    ne = {e["id"]: e for e in events}
    for i, e in be.items():
        keep = e["name"].startswith("Miejsce:") or any(c["code"] not in (0, 108, 408) for p in e["pages"] for c in p["list"])
        if not keep: continue
        n = ne.get(i)
        if not n: probs.append("zdarzenie %d '%s' zniknęło" % (i, e["name"])); continue
        if n["pages"] != e["pages"] or n["name"] != e["name"]:
            probs.append("zdarzenie %d '%s' zmienione" % (i, e["name"]))
        if (n["x"], n["y"]) != (e["x"], e["y"]) and not e["name"].startswith("Milcz"):
            probs.append("zdarzenie %d '%s' przesunięte %s -> %s" % (i, e["name"], (e["x"], e["y"]), (n["x"], n["y"])))
    if max(ne) >= 355: probs.append("id zdarzeń do %d (>= 355 to zastrzeżone)" % max(ne))
    # walking from the landing
    exits = [e for e in events if any(c["code"] == 201 for p in e["pages"] for c in p["list"])]
    lands = [(e["x"], e["y"] - 1) for e in exits if e["y"] >= H - 2] or ([(3, 4)] if mid == 100 else [])
    people = [(e["x"], e["y"]) for e in events if e["name"].startswith("Miejsce:")]
    if not lands: probs.append("brak lądowania")
    seen = eng.reach(lands[:1], ignore=people if mid not in (121, 122, 123, 124) else []) if lands else set()
    for L in lands:
        if L not in seen: probs.append("lądowanie %s nie łączy się" % (L,))
        if not eng.standable(*L): probs.append("lądowanie %s zajęte" % (L,))
    for e in exits:
        if (e["x"], e["y"]) not in seen and mid != 100: probs.append("wyjście (%d,%d) nieosiągalne" % (e["x"], e["y"]))
    # every open cell reachable (nothing shut in), the residents' spots free and reachable, the looks can be stood by
    for y in range(H):
        for x in range(W):
            if eng.standable(x, y) and (x, y) not in seen and (x, y) not in people:
                # (a cell outside the room - the border / wall faces - is not "open" for the game either way)
                k = [data[(z * H + y) * W + x] for z in range(4)]
                if 0 < x < W - 1 and 0 < y < H - 1 and any(k):
                    probs.append("zamknięte pole (%d,%d)" % (x, y))
    for p in people:
        # (Map103: the user put the merchant's place on the chair at the head of his table - he sits there; the Silent stand
        # on their own invisible events)
        if not eng.standable(*p) and mid not in (103, 121, 122, 123, 124): probs.append("miejsce mieszkańca %s zajęte" % (p,))
        nb = [(p[0] + dx, p[1] + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
        if p not in seen and not any(n in seen for n in nb): probs.append("miejsce mieszkańca %s nieosiągalne" % (p,))
    for e in events:
        pg = e["pages"][0]
        if not pg["image"]["characterName"] and pg["priorityType"] == 1 and any(c["code"] == 355 for c in pg["list"]):
            nb = [(e["x"] + dx, e["y"] + dy) for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
            if not any(n in seen for n in nb): probs.append("'%s' (%d,%d): nie da się podejść" % (e["name"], e["x"], e["y"]))
    # lights: a window's sun only by day; every other light a warm flame on a picture (or on a fire / candle event's cell)
    import re
    pics = {(e["x"], e["y"]) for e in events if e["pages"][0]["image"]["characterName"]}
    for e in events:
        n = e["note"]
        if "<LightCone" in n and "when=day" not in n: probs.append("'%s' (%d,%d): słońce z okna także nocą" % (e["name"], e["x"], e["y"]))
        m = re.search(r"<Light:(\d+),(\d+),(\d+),(\d+)>", n)
        if m and "<LightSoft>" not in n:
            r, g, b = int(m.group(2)), int(m.group(3)), int(m.group(4))
            if not (r >= g >= b): probs.append("'%s' (%d,%d): zimne światło %s" % (e["name"], e["x"], e["y"], (r, g, b)))
            if not e["pages"][0]["image"]["characterName"] and (e["x"], e["y"]) not in pics:
                probs.append("'%s' (%d,%d): światło bez płomienia" % (e["name"], e["x"], e["y"]))
    # two pictures on one cell standing on the floor (one hides the other)
    seen_cells = {}
    for e in events:
        pg = e["pages"][0]
        if pg["image"]["characterName"] and pg["priorityType"] == 1:
            c = (e["x"], e["y"])
            if c in seen_cells and not e["name"].startswith("Milcz"):
                probs.append("dwa stojące obrazki na (%d,%d): '%s' i '%s'" % (c[0], c[1], seen_cells[c], e["name"]))
            seen_cells[c] = e["name"]
    return probs, seen


def stage(ids):
    import wlib, rooms
    out = {}
    bad = 0
    os.makedirs(STAGING, exist_ok=True)
    for mid in ids:
        mp = rooms.PLANS.get(mid, lambda m: m)(wlib.Room(mid, BASE))
        mp.windows_down()
        path, n = mp.stage(STAGING)
        raw = read(path)
        j = json.loads(raw.decode("utf-8"))
        base_j = json.loads(read(BASE + "Map%03d.json" % mid).decode("utf-8"))
        probs, seen = check(mid, j, base_j)
        print("Map%03d %-20s %dx%d, %d zdarzeń (było %d), osiągalne %d pól%s" % (
            mid, j.get("displayName", ""), j["width"], j["height"], n, len([e for e in base_j["events"] if e]), len(seen),
            "" if not probs else ""))
        for p in probs: print("   PROBLEM", p)
        bad += len(probs)
        out[mid] = raw
    return out, bad


def render(ids, src_dir, out_fmt, grid=True):
    sys.path.insert(0, ROOT + "tools/interiors")
    import irender as IR
    for mid in ids:
        m = IR.R.load_json(os.path.join(src_dir, "Map%03d.json" % mid))
        img = IR.render(m)
        if grid: img = IR.grid(img, lines=False)
        img.save(out_fmt % mid)
    print("render ->", out_fmt % ids[0], "...")


def shots(ids):
    """the game's own pictures: BEFORE (data/ as it is) and AFTER (the overlay), noon and 22:00 (tools/wnetrza/shots.js)"""
    env = dict(os.environ)
    env.setdefault("CDP_PORT", "9461")
    raw = os.path.join(DOCS, "surowe")
    for suffix, overlay in (("przed", None), ("po", "tools/wnetrza/staging/overlay")):
        e = dict(env)
        if overlay: e["GAME_OVERLAY"] = overlay
        else: e.pop("GAME_OVERLAY", None)
        cmd = ["node", ROOT + "tools/wnetrza/shots.js", raw, suffix] + [str(i) for i in ids]
        print("shots", suffix, "...")
        r = subprocess.run(cmd, cwd=ROOT, env=e, capture_output=True, text=True, errors="replace")
        tail = (r.stdout or "").strip().splitlines()[-3:]
        print("  " + " | ".join(tail))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*", type=int)
    ap.add_argument("--render", action="store_true")
    ap.add_argument("--overlay", action="store_true")
    ap.add_argument("--shots", action="store_true")
    ap.add_argument("--compare", action="store_true")
    ap.add_argument("--install", action="store_true")
    ap.add_argument("--force", action="store_true")
    ap.add_argument("--rebase", nargs="*", type=int)
    a = ap.parse_args()
    ids = a.ids or IDS
    ensure_base(IDS, rebase=a.rebase or ())
    staged, bad = stage(ids)
    if a.render:
        render(ids, STAGING, os.path.join(STAGING, "render_%03d.png"))
    if a.overlay or a.shots:
        os.makedirs(os.path.join(OVERLAY, "data"), exist_ok=True)
        for mid in IDS:
            p = os.path.join(STAGING, "Map%03d.json" % mid)
            if os.path.exists(p): shutil.copy2(p, os.path.join(OVERLAY, "data", "Map%03d.json" % mid))
        print("overlay -> tools/wnetrza/staging/overlay (GAME_OVERLAY=tools/wnetrza/staging/overlay)")
    if a.shots:
        shots(ids)
    if a.compare:
        import compare
        compare.run(ids, DOCS)
    if bad:
        print("STOP: %d problemów" % bad)
        if a.install: sys.exit(1)
    if not a.install:
        print("sprawdzenie zakończone - nic nie zapisano w data/ (--install zapisuje)")
        return
    if editor_running():
        sys.exit("STOP: działa edytor RPG Maker MZ (RPGMZ.exe) - zamknij go najpierw (przy zapisie nadpisałby data/).")
    rec = json.loads(read(REC).decode("utf-8")) if os.path.exists(REC) else {}
    os.makedirs(BACKUP, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%H%M%S")
    done = []
    for mid, raw in sorted(staged.items()):
        n = "Map%03d.json" % mid
        cur = read(DATA + n)
        if not a.force and sha(cur) not in (sha(read(BASE + n)), rec.get(n), sha(raw)):
            print("POMIJAM %s: zmieniona w edytorze po zrobieniu kopii bazowej (--rebase %d, potem build jeszcze raz)" % (n, mid))
            continue
        shutil.copy2(DATA + n, BACKUP + n.replace(".json", "_przed_%s.json" % stamp))
        with open(DATA + n, "wb") as f: f.write(raw)
        rec[n] = sha(raw)
        done.append(n)
    with open(REC, "wb") as f: f.write((json.dumps(rec, indent=1, sort_keys=True) + "\n").encode("utf-8"))
    print("zainstalowano:", ", ".join(done), "- kopie w", os.path.relpath(BACKUP, ROOT))


if __name__ == "__main__":
    main()
