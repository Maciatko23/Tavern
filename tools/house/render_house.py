# python render_house.py <concept A|B|...> [what ...] [--out DIR] [--hour H] [--port 9376]
# Renders a staged cottage (tools/house/staging/Map019_<concept>.json) in the real game through tools/tavern/render.js
# (the staged map is served in place of data/Map019.json by overriding DataManager.loadDataFile; data/ is never written).
#   what: full (the whole map at 1:1, evening 20:30), day (the whole map at 1:1, 11:00), screen (1280x720 at the map's
#         zoom 1.5, the hero and grandpa in the room), probe (the game's own passability of every cell -> json)
# Default: full day screen probe. CDP_PORT 9376 (this tool's port).
import os, sys, json, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
STAGING = os.path.join(HERE, "staging")

def jobs_for(concept, what, out, hour_full=20.5, hour_day=11):
    mp = os.path.join(STAGING, "Map019_%s.json" % concept)
    meta = json.load(open(os.path.join(STAGING, "Map019_%s_meta.json" % concept), encoding="utf-8"))
    sp = meta["spots"]
    hero = sp.get("render_hero") or sp.get("start") or sp["landing"]
    gp = sp.get("grandpa")
    jobs = []
    for w in what:
        base = {"map": mp, "id": 19, "wait": 150}
        if w == "full": base.update(mode="full", hour=hour_full, out=os.path.join(out, "koncepcja_%s.png" % concept))
        elif w == "day": base.update(mode="full", hour=hour_day, out=os.path.join(out, "koncepcja_%s_dzien.png" % concept))
        elif w == "screen":
            base.update(mode="screen", hour=sp.get("render_hour", 17.5), player=[hero[0], hero[1], hero[2] if len(hero) > 2 else 2],
                        out=os.path.join(out, "koncepcja_%s_ekran.png" % concept))
        elif w == "screen_day":
            base.update(mode="screen", hour=hour_day, player=[hero[0], hero[1], hero[2] if len(hero) > 2 else 2],
                        out=os.path.join(out, "koncepcja_%s_ekran_dzien.png" % concept))
        elif w == "probe": base.update(mode="full", hour=hour_day, out=os.path.join(out, "_probe_%s.png" % concept),
                                       probe=os.path.join(STAGING, "Map019_%s_probe.json" % concept))
        else: raise SystemExit("unknown: " + w)
        if gp: base["grandpa"] = gp
        jobs.append(base)
    return jobs

def main():
    args = sys.argv[1:]
    out = os.path.join(ROOT, "docs", "dom_dziadka")
    port = "9376"
    if "--out" in args:
        i = args.index("--out"); out = args[i + 1]; del args[i:i + 2]
    if "--port" in args:
        i = args.index("--port"); port = args[i + 1]; del args[i:i + 2]
    concepts = [a for a in args if a.isupper() or a.startswith("T")] or ["A", "B"]
    what = [a for a in args if a not in concepts] or ["full", "day", "screen", "probe"]
    os.makedirs(out, exist_ok=True)
    jobs = []
    for c in concepts: jobs += jobs_for(c, what, out)
    jp = os.path.join(STAGING, "_jobs.json")
    with open(jp, "wb") as f: f.write(json.dumps(jobs, indent=1).encode("utf-8"))
    env = dict(os.environ, CDP_PORT=port)
    subprocess.run(["node", os.path.join(HERE, "render.js"), jp], cwd=ROOT, env=env, check=False)

if __name__ == "__main__":
    main()
