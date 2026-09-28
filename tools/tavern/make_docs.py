# One command for the concept pictures: builds the staged maps, renders them in the game (the page's data fetch is
# overridden, data/ is never written), draws the zone plans and puts everything into docs/tawerna_nowa/.
#   python make_docs.py            (CDP_PORT defaults to 9372; the game server must run on http://127.0.0.1:8765)
# Output: koncepcja_A.png (the whole map at 1:1 with the game's lighting, 18:00), koncepcja_A_strefy.png (the plan with
# zones and pins), koncepcja_A_ekran.png (the game screen at the map's zoom), the same for B and C, pietro.png (+ _strefy,
# _ekran), katalog.png comes from catalog.py.
import os, sys, json, shutil, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
DOCS = os.path.join(ROOT, "docs", "tawerna_nowa")
STAGE = os.path.join(HERE, "staging")
REN = os.path.join(STAGE, "renders")
os.makedirs(REN, exist_ok=True)
os.makedirs(DOCS, exist_ok=True)
env = dict(os.environ)
env.setdefault("CDP_PORT", "9372")
env["PYTHONIOENCODING"] = "utf-8"

def run(cmd):
    print(">", " ".join(cmd))
    subprocess.run(cmd, cwd=HERE, env=env, check=True)

run([sys.executable, "build_concepts.py"])
run([sys.executable, "catalog.py"])

MAPS = {"A": ("Map001_A.json", 1), "B": ("Map001_B.json", 1), "C": ("Map001_C.json", 1), "P": ("Pietro.json", 25)}
# where the hero stands for the screen view (x, y, facing)
SCREEN = {"A": [9, 17, 8], "B": [19, 19, 8], "C": [20, 17, 6], "P": [15, 13, 8]}
jobs = []
for k, (f, mid) in MAPS.items():
    m = os.path.join(STAGE, f)
    jobs.append({"map": m, "id": mid, "out": os.path.join(REN, k + "_lit.png"), "mode": "full", "hour": 18})
    jobs.append({"map": m, "id": mid, "out": os.path.join(REN, k + "_plain.png"), "mode": "full", "hour": 18, "nodark": True})
    jobs.append({"map": m, "id": mid, "out": os.path.join(REN, k + "_screen.png"), "mode": "screen", "hour": 18, "player": SCREEN[k], "wait": 200})
jf = os.path.join(REN, "jobs.json")
with open(jf, "wb") as fh:
    fh.write(json.dumps(jobs, indent=1).encode("utf-8"))
run(["node", os.path.join(HERE, "render.js"), jf])

TITLES = {
    "A": ("Koncepcja A - Długa sala", "Jedna długa sala biesiadna. Kominek, bar i scena wzdłuż tylnej ściany; za nią kuchnia i skład ze starych kamieni twierdzy."),
    "B": ("Koncepcja B - Sala w L", "Sala zawinięta w L wokół kuchni. Bar w narożniku, okienko do kuchni, scena zamyka wschodnie skrzydło."),
    "C": ("Koncepcja C - Dwie izby", "Karczma z bali: sień pośrodku, izba szynkowa po lewej, izba kominkowa z kośćmi i sceną po prawej."),
    "P": ("Piętro - Pokoje gości", "Korytarz z pięcioma pokojami, komnatą do wynajęcia (z kominkiem) i bieliźniarką; schody w dół w lewym dolnym rogu."),
}
for k in MAPS:
    t, sub = TITLES[k]
    run([sys.executable, "overview.py", k, os.path.join(REN, k + "_plain.png"), os.path.join(REN, k + "_strefy.png"), t, sub])
    name = "pietro" if k == "P" else "koncepcja_" + k
    shutil.copyfile(os.path.join(REN, k + "_lit.png"), os.path.join(DOCS, name + ".png"))
    shutil.copyfile(os.path.join(REN, k + "_strefy.png"), os.path.join(DOCS, name + "_strefy.png"))
    shutil.copyfile(os.path.join(REN, k + "_screen.png"), os.path.join(DOCS, name + "_ekran.png"))
print("done:", sorted(os.listdir(DOCS)))
