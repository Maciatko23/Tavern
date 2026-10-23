# Pakiet 0 rozszerzeń nowego terenu (docs/rozszerzenia/PLAN.md 2.3-2.8): przygotowuje STAGING (data/ i lista gry zostają nietknięte).
#   python tools/rozszerzenia/pakiet0.py            staging -> tools/rozszerzenia/staging/ (+ SHA.txt, ZMIANY.txt)
#   python tools/rozszerzenia/instaluj.py --pakiet0 [--wykonaj]   instaluje go (edytor zamknięty, kopie do archiwum)
# Co zmienia:
#   data/Items.json      puste rezerwy 185-249 (name "", note <Okolice:rezerwa>) - każda paczka wypełnia potem tylko swój blok
#   img/system/IconSet.png   z 29 na 33 wiersze (ikony 464-527, przezroczyste)
#   data/MapInfos.json   176 „Komora pod menhirami” (pod 18), 177 „Jaskinia przemytników” (pod 125)
#   data/Map176.json, data/Map177.json   puste szkielety 20x14, tileset 12 (rysują je paczki D i C)
#   data/System.json     nazwy przełączników 21-28
#   data/Map024.json, Map125.json, Map165.json   kafle (tools/rozszerzenia/kafle.py)
#   js/tawerna_wtyczki.js 10 nowych wtyczek (lista gry; do 2026-10-23 js/plugins.js) (dane przed TownLife, silniki po Orzel_Lot), opisy zmienionych wtyczek
import os, sys, json, re, shutil
from wspolne import ROOT, STAGING, read_json, json_text, dump, sha1, sha1_bytes
import kafle

try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass

ITEMS = (185, 249)
SWITCHES = {21: "Zas_Studnia", 22: "Zas_rez", 23: "Low_Wylom", 24: "Low_rez", 25: "Lud_Jaskinia", 26: "Lud_rez", 27: "Zak_Komora", 28: "Zak_rez"}
NEW_MAPS = [
    (176, "Komora pod menhirami", 18, "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<DarkDay:226>\n<DarkNight:226>\n<Ambience:cave>\n<Hunt:off>\n<Build:off>\n<Farm:off>\n<Minimap:off>\n<Okolice:szkielet>"),
    (177, "Jaskinia przemytników", 125, "<Dust:on>\n<Dark:on>\n<DayNight:off>\n<DarkDay:226>\n<DarkNight:226>\n<Ambience:cave>\n<Hunt:off>\n<Build:off>\n<Farm:off>\n<Minimap:off>\n<Okolice:szkielet>"),
]
DATA_PLUGINS = ["Okolice_Data", "Zasoby_Data", "Lowy_Data", "Ludzie_Data", "Zakon_Data"]
ENGINE_PLUGINS = ["Okolice", "Zasoby", "Lowy", "Ludzie", "Zakon"]
DESC_UPDATE = ["Forestry", "TownLife", "Debug"]   # (their @plugindesc changed: the editor would rewrite them anyway)

LOG, OUT = [], {}
def log(s): print(s); LOG.append(s)


def plugindesc(name):
    src = open(os.path.join(ROOT, "js", "plugins", name + ".js"), encoding="utf-8").read()
    m = re.search(r"@plugindesc\s+(.+)", src)
    if not m: raise SystemExit("STOP: %s.js bez @plugindesc" % name)
    return m.group(1).strip()


def stage_items():
    items, lay = read_json("data/Items.json")
    if len(items) - 1 >= ITEMS[0]:
        used = [i for i in range(ITEMS[0], min(len(items), ITEMS[1] + 1)) if items[i] and (items[i].get("name") or "<Okolice:rezerwa>" not in (items[i].get("note") or ""))]
        if used: raise SystemExit("STOP: Items.json ma już przedmioty w 185-249: %s" % used[:10])
    tmpl = dict(items[2])
    while len(items) <= ITEMS[1]:
        e = json.loads(json.dumps(tmpl))
        e.update({"id": len(items), "name": "", "description": "", "iconIndex": 0, "note": "<Okolice:rezerwa>"})
        items.append(e)
    OUT["data/Items.json"] = json_text(items, lay)
    log("Items.json: rezerwy %d-%d (było %d przedmiotów)" % (ITEMS[0], ITEMS[1], ITEMS[0] - 1))


def stage_iconset():
    from PIL import Image
    p = os.path.join(ROOT, "img", "system", "IconSet.png")
    im = Image.open(p)
    if im.size != (512, 928):
        if im.size == (512, 1056): raise SystemExit("STOP: IconSet ma już 33 wiersze")
        raise SystemExit("STOP: IconSet ma rozmiar %s (oczekiwano 512x928)" % (im.size,))
    im = im.convert("RGBA")
    big = Image.new("RGBA", (512, 1056), (0, 0, 0, 0))
    big.paste(im, (0, 0))
    os.makedirs(os.path.join(STAGING, "img", "system"), exist_ok=True)
    tmp = os.path.join(STAGING, "img", "system", "IconSet.png")
    big.save(tmp, optimize=True)
    OUT["img/system/IconSet.png"] = open(tmp, "rb").read()
    log("IconSet.png: 512x928 -> 512x1056 (ikony 464-527 wolne, przezroczyste)")


def stage_maps():
    infos, lay = read_json("data/MapInfos.json")
    order = max(m["order"] for m in infos if m)
    for (mid, name, parent, note) in NEW_MAPS:
        if mid < len(infos) and infos[mid]: raise SystemExit("STOP: MapInfos ma już mapę %d (%s)" % (mid, infos[mid]["name"]))
        if os.path.exists(os.path.join(ROOT, "data", "Map%03d.json" % mid)): raise SystemExit("STOP: data/Map%03d.json już jest" % mid)
        while len(infos) <= mid: infos.append(None)
        order += 1
        infos[mid] = {"id": mid, "expanded": False, "name": name, "order": order, "parentId": parent, "scrollX": 540.6666666666666, "scrollY": 316.6666666666667}
        base, _ = read_json("data/Map167.json")
        props = {k: v for k, v in base.items() if k not in ("data", "events")}
        W, H = 20, 14
        props.update({"displayName": name, "note": note, "width": W, "height": H, "tilesetId": 12, "autoplayBgm": False,
                      "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90}})
        m = dict(props)
        m["data"] = [0] * (6 * W * H)
        m["events"] = [None]
        OUT["data/Map%03d.json" % mid] = json_text(m, "map")
        log("Map%03d.json: szkielet „%s” 20x14, tileset 12 (pod mapą %d)" % (mid, name, parent))
    OUT["data/MapInfos.json"] = json_text(infos, lay)


def stage_system():
    s, lay = read_json("data/System.json")
    sw = s["switches"]
    while len(sw) <= max(SWITCHES): sw.append("")
    for i, n in SWITCHES.items():
        if sw[i] and sw[i] != n: raise SystemExit("STOP: przełącznik %d ma już nazwę %s" % (i, sw[i]))
        sw[i] = n
    OUT["data/System.json"] = json_text(s, lay)
    log("System.json: przełączniki 21-28 nazwane")


def stage_tiles():
    for rel, fn in (("data/Map024.json", kafle.apply_wylom), ("data/Map125.json", kafle.apply_zatoczka), ("data/Map165.json", kafle.apply_plycizny)):
        m, lay = read_json(rel)
        fn(m, log)
        OUT[rel] = json_text(m, lay)


def stage_plugins():
    p = os.path.join(ROOT, "js", "tawerna_wtyczki.js")   # (the game's plugin list)
    raw = open(p, "rb").read().decode("utf-8")
    head, sep, rest = raw.partition("var $tawernaWtyczki =\n[\n")
    if not sep: raise SystemExit("STOP: js/tawerna_wtyczki.js w nieznanym układzie")
    body, tail = rest.rsplit("\n];", 1)
    lines = body.split(",\n")
    entries = [json.loads(l) for l in lines]
    if ",\n".join(dump(e) for e in entries) != body: raise SystemExit("STOP: js/tawerna_wtyczki.js nie wraca do tej samej postaci po odczycie - przerwano")
    names = [e["name"] for e in entries]
    for n in DATA_PLUGINS + ENGINE_PLUGINS:
        if n in names: raise SystemExit("STOP: lista gry ma już %s" % n)
    def entry(n): return {"name": n, "status": True, "description": plugindesc(n), "parameters": {}}
    i = names.index("Dwor_Data") + 1
    entries[i:i] = [entry(n) for n in DATA_PLUGINS]
    names = [e["name"] for e in entries]
    j = names.index("Orzel_Lot") + 1
    entries[j:j] = [entry(n) for n in ENGINE_PLUGINS]
    for e in entries:
        if e["name"] in DESC_UPDATE: e["description"] = plugindesc(e["name"])
    names = [e["name"] for e in entries]
    if not (names.index("Zakon_Data") < names.index("TownLife") and names.index("Okolice") > names.index("Orzel_Lot") and names.index("Zakon") < names.index("TitleScreen")):
        raise SystemExit("STOP: zła kolejność wtyczek")
    text = head + sep + ",\n".join(dump(e) for e in entries) + "\n];" + tail
    OUT["js/tawerna_wtyczki.js"] = text.encode("utf-8")
    log("js/tawerna_wtyczki.js: +%s (po Dwor_Data), +%s (po Orzel_Lot); opisy: %s" % (", ".join(DATA_PLUGINS), ", ".join(ENGINE_PLUGINS), ", ".join(DESC_UPDATE)))


def main():
    if os.path.exists(STAGING): shutil.rmtree(STAGING)
    os.makedirs(STAGING)
    stage_items(); stage_iconset(); stage_maps(); stage_system(); stage_tiles(); stage_plugins()
    rows = ["# plik\tsha1 nowej wersji\tsha1 obecnej (- = nowy plik)"]
    for rel in sorted(OUT):
        dst = os.path.join(STAGING, *rel.split("/"))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        open(dst, "wb").write(OUT[rel])
        rows.append("%s\t%s\t%s" % (rel, sha1_bytes(OUT[rel]), sha1(os.path.join(ROOT, *rel.split("/")))))
    open(os.path.join(STAGING, "SHA.txt"), "w", encoding="utf-8", newline="\n").write("\n".join(rows) + "\n")
    open(os.path.join(STAGING, "ZMIANY.txt"), "w", encoding="utf-8", newline="\n").write(
        "Pakiet 0 rozszerzeń nowego terenu (docs/rozszerzenia/PLAN.md) - staging z tools/rozszerzenia/pakiet0.py\n\n" + "\n".join(LOG) +
        "\n\nInstalacja: python tools/rozszerzenia/instaluj.py --pakiet0 --wykonaj (edytor zamknięty; kopie: Tawerna_archiwum_2026-10-18/dane_przed_rozszerzeniami/pakiet0/)\n"
        "Po instalacji: otwórz projekt w edytorze na nowo (wtyczki są na liście gry - edytor jej nie zapisuje).\n")
    print("staging: %d plików -> %s" % (len(OUT), STAGING))


if __name__ == "__main__":
    main()
