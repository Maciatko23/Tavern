# Instaluje staging z tools/powieksz/powieksz.py --out DIR do data/ (powiększenie map, 2026-10-18).
#
#   python tools/powieksz/install.py DIR             sprawdza i pokazuje (nic nie zmienia)
#   python tools/powieksz/install.py DIR --wykonaj   instaluje
#
# Zabezpieczenia: edytor RPG Maker MZ (RPGMZ.exe) zamknięty; każdy plik w data/ taki jak w chwili przygotowania stagingu (SHA.txt);
# obecne pliki najpierw do archiwum: Tawerna_archiwum_2026-10-18/dane_przed_powiekszeniem/data/ (pierwsza kopia zostaje, kolejne
# z datą). Po instalacji: tools/powieksz/stan.json dostaje powiększone mapy (stary i nowy rozmiar, ziarno losu).
# Po instalacji otwórz projekt w edytorze na nowo, zanim cokolwiek w nim zapiszesz.
#   --archiwum NAZWA   kopie do Tawerna_archiwum_2026-10-18/NAZWA/data/ (np. dane_przed_przerzedzeniem dla tools/powieksz/przerzedz.py)
import os, sys, json, hashlib, shutil, subprocess, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
ARCH_NAME = sys.argv[sys.argv.index("--archiwum") + 1] if "--archiwum" in sys.argv else "dane_przed_powiekszeniem"
ARCH = os.path.join(os.path.dirname(ROOT), "Tawerna_archiwum_2026-10-18", ARCH_NAME)
DO = "--wykonaj" in sys.argv
ST = sys.argv[1]

def sha1(p): return hashlib.sha1(open(p, "rb").read()).hexdigest()

out = subprocess.run(["tasklist", "/FI", "IMAGENAME eq RPGMZ.exe"], capture_output=True, text=True).stdout
if "RPGMZ.exe" in out: raise SystemExit("STOP: edytor RPG Maker MZ jest otwarty - zamknij go. Nic nie zmieniono.")
rows = [l.rstrip("\n").split("\t") for l in open(os.path.join(ST, "SHA.txt"), encoding="utf-8") if l.strip() and not l.startswith("#")]
bad, todo = [], []
for rel, new, old in rows:
    cur, stg = os.path.join(ROOT, *rel.split("/")), os.path.join(ST, os.path.basename(rel))
    if sha1(stg) != new: bad.append("%s: plik w stagingu uszkodzony" % rel)
    elif sha1(cur) == new: print("już jest   " + rel)
    elif sha1(cur) != old: bad.append("%s: zmienił się w data/ od przygotowania stagingu" % rel)
    else: todo.append((rel, new)); print("instaluję  " + rel)
# kontrola map (tools/mapy/kontrola.py, docs/MAPY_ZASADY.md): mapa z błędami (zablokowane wejścia / wyjścia, zdarzenia poza mapą...)
# nie trafia do data/; nowe uwagi tylko się wypisują
sys.path.insert(0, os.path.join(ROOT, "tools", "mapy"))
import re as _re
import kontrola as _kontrola
for rel, new in todo:
    m = _re.search(r"Map(\d+)\.json$", rel)
    if not m: continue
    ok, _probs, txt = _kontrola.bramka(int(m.group(1)), os.path.join(ST, os.path.basename(rel)), quiet=True, scisle=False)
    if not ok: bad.append("%s: kontrola map - błędy:\n%s" % (rel, txt))
    elif "NOWE uwagi" in txt: print("uwaga      %s: %s" % (rel, txt.split("NOWE uwagi", 1)[1].strip()[:300]))
if bad:
    for b in bad: print("STOP: " + b)
    raise SystemExit("Nic nie zainstalowano - przygotuj staging na nowo.")
if not DO: raise SystemExit("(podgląd - nic nie zmieniono; dodaj --wykonaj)")
for rel, new in todo:
    cur = os.path.join(ROOT, *rel.split("/"))
    bak = os.path.join(ARCH, *rel.split("/"))
    os.makedirs(os.path.dirname(bak), exist_ok=True)
    if os.path.exists(bak): bak = bak.replace(".json", datetime.datetime.now().strftime("_%Y%m%d_%H%M%S.json"))
    shutil.copy2(cur, bak)
    data = open(os.path.join(ST, os.path.basename(rel)), "rb").read()
    open(cur, "wb").write(data)
    if sha1(cur) != new: raise SystemExit("STOP: zapis %s nie zgadza się" % rel)
st_path = os.path.join(HERE, "stan.json")
state = json.load(open(st_path, encoding="utf-8")) if os.path.exists(st_path) else {}
add = json.load(open(os.path.join(ST, "stan_dodaj.json"), encoding="utf-8"))
state.update(add)
open(st_path, "w", encoding="utf-8", newline="\n").write(json.dumps(state, ensure_ascii=False, indent=1) + "\n")
print("Zainstalowano %d plików (kopie poprzednich: %s). Mapy w stan.json: %s" % (len(todo), ARCH, ", ".join(sorted(state))))
print("Otwórz projekt w RPG Maker MZ na nowo, zanim cokolwiek w nim zapiszesz.")
