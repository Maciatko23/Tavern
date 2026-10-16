# python tools/miejsca_wyspy/rusztowanie_staging.py   - PAKIET 0 (rusztowanie), część danych: przygotowuje pliki TYLKO w
# tools/miejsca_wyspy/staging/ (nic w data/ ani w js/plugins.js). Instaluje je koordynator albo użytkownik, przy zamkniętym edytorze
# (docs/miejsca_wyspy/PAKIETY.md, „Pakiet 0 - instalacja”).
#   staging/data/Map155..167.json   puste szkielety map (rozmiar z koncepcji, tileset, nazwa, notatka <Wyspa:szkielet>); 158 i 164 wolne
#   staging/data/MapInfos.json      obecne MapInfos + wpisy 155-157, 159-163, 165-167
#   staging/data/Items.json         obecne Items + 177 Tran, 178 Mapa z zaznaczeniami, 179 Obrączka z krukiem (ikony zastępcze z RTP)
#   staging/data/System.json        obecne System + nazwy przełączników 17-20
#   staging/js/plugins.js           obecne plugins.js + 14 wtyczek na stałych miejscach
#   staging/ZMIANY.txt         co się zmienia, plik po pliku, ze skrótami SHA-256 oryginałów (instalacja sprawdza, że oryginał
#                              się nie zmienił od przygotowania)
# GAME_OVERLAY=tools/miejsca_wyspy/staging podaje grze staging/data/ zamiast data/ (test bez instalacji: tests/wyspa_szkielet_test.js).
# Pliki zachowują końcówki linii (LF) i układ edytora (jeden wpis w wierszu); nic, co już jest w grze, nie jest nadpisywane.
import os, sys, json, copy, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
sys.path.insert(0, ROOT + "tools/newstart")
import nslib   # noqa: E402

DATA = ROOT + "data/"
OUT = os.path.join(HERE, "staging") + "/"

MAPS = {   # id: (nazwa, rodzic, szerokość, wysokość, tileset, notatka)
    155: ("Pustelnia na klifie", 125, 48, 36, 11, "<Clouds:on>\n<Farm:off>\n<Water:salt>"),
    156: ("Skryptorium", 155, 15, 11, 8, ""),
    157: ("Urwisko Kruków", 125, 56, 36, 11, "<Clouds:on>\n<Farm:off>\n<Water:salt>"),
    159: ("Przylądek z latarnią", 125, 44, 40, 11, "<Clouds:on>\n<Farm:off>\n<Water:salt>"),
    160: ("Izba latarnika", 159, 13, 10, 8, ""),
    161: ("Laterna", 159, 11, 9, 8, ""),
    162: ("Garnizon nad zatoką", 125, 56, 40, 11, "<Clouds:on>\n<Farm:off>\n<Water:salt>"),
    163: ("Kwatera rotmistrza", 162, 13, 10, 8, ""),
    165: ("Wrak na mieliźnie", 162, 40, 30, 11, "<Clouds:on>\n<Farm:off>\n<Water:salt>"),
    166: ("Wrak - pod pokładem", 165, 24, 14, 8, ""),
    167: ("Stara cysterna zakonu", 10, 40, 28, 12, ""),
}
ITEMS = [   # id, nazwa, opis, ikona (zastępcza z RTP), itypeId, cena, notatka
    (177, "Tran", "Gęsty tran z ryb w glinianej baryłce. Pali się długo i jasno - latarnik z przylądka bierze każdą ilość. Nie do jedzenia.",
     176, 1, 6, "<Weight:1>"),
    (178, "Mapa z zaznaczeniami", "Mapa Kruczej Wyspy z kajuty wraku. Siedem miejsc zaznaczonych białym okiem.", 190, 2, 0, "<Weight:0>"),
    (179, "Obrączka z krukiem", "Stara mosiężna obrączka z nóżki kruka. Wybity na niej kruk - taki sam jak na wisiorku.", 145, 2, 0,
     "<Weight:0>\n<Pamiatka>"),
]
SWITCHES = {17: "Wyspa_KrataUrwisko", 18: "Wyspa_ZasuwaCysterny", 19: "Wyspa_MglaPrzyladek", 20: "Wyspa_Odplyw"}
DATA_PLUGINS = [
    ("Wyspa_Data", "Wyspa - wspólne dane sześciu nowych miejsc (mapy 155-167, numery zdarzeń 600-699, mieszkańcy 943-948, zadania, flagi, przejścia, pływy). v1.0.0"),
    ("Pustelnia_Data", "[pakiet A] Dane: pustelnia na klifie i skryptorium, brat Kleofas, kroniki. (szkielet) v0.0.0"),
    ("Kruk_Data", "[pakiet B] Dane: Urwisko Kruków i oswojony kruk. (szkielet) v0.0.0"),
    ("Latarnia_Data", "[pakiet C] Dane: przylądek z latarnią, latarnik Bazyli, mgła i soczewka. (szkielet) v0.0.0"),
    ("Garnizon_Data", "[pakiet D] Dane: garnizon nad zatoką, skup wojskowy, pobór. (szkielet) v0.0.0"),
    ("Wrak_Data", "[pakiet E] Dane: wrak na mieliźnie i rozbitek w tawernie. (szkielet) v0.0.0"),
    ("Cysterna_Data", "[pakiet F] Dane: stara cysterna zakonu. (szkielet) v0.0.0"),
]
ENGINE_PLUGINS = [
    ("Wyspa", "Wyspa - wspólny rdzeń sześciu nowych miejsc: przejścia z map użytkownika (dopiero gdy miejsce gotowe), pływy, flagi między pakietami. v1.0.0"),
    ("Pustelnia", "[pakiet A] Pustelnia na klifie i Skryptorium: brat Kleofas, zaszyfrowane kroniki, jedno pytanie rocznie. (szkielet) v0.0.0"),
    ("Kruk", "[pakiet B] Urwisko Kruków i oswojony kruk: kruczarnia, grzęda, listy, zwiad, błyskotki. (szkielet) v0.0.0"),
    ("Latarnia", "[pakiet C] Przylądek z latarnią: latarnik Bazyli, mgła morska, soczewka i wizje. (szkielet) v0.0.0"),
    ("Garnizon", "[pakiet D] Garnizon nad zatoką: chorągiew królewska, skup wojskowy, przychylność, pobór. (szkielet) v0.0.0"),
    ("Wrak", "[pakiet E] Wrak na mieliźnie i rozbitek w tawernie: mapa z zaznaczeniami, łacha w odpływie. (szkielet) v0.0.0"),
    ("Cysterna", "[pakiet F] Stara cysterna zakonu: zapas wody, czerpak raz dziennie, zasuwy, krata na Urwisku. (szkielet) v0.0.0"),
]
sha = lambda b: hashlib.sha256(b).hexdigest()


def dump(o):
    return json.dumps(o, ensure_ascii=False, separators=(",", ":"))


def raw(path):
    b = open(path, "rb").read()
    assert b"\r\n" not in b, path + ": CRLF?"
    return b


def stub_maps(report):
    for mid, (name, parent, w, h, ts, note) in sorted(MAPS.items()):
        if os.path.exists(DATA + "Map%03d.json" % mid):
            report.append("Map%03d.json: JUŻ JEST w data/ - nie przygotowuję" % mid); continue
        props = copy.deepcopy(nslib.BASE_PROPS)
        props.update({"width": w, "height": h, "tilesetId": ts, "displayName": name, "note": ("<Wyspa:szkielet>\n" + note).strip(),
                      "autoplayBgm": False, "bgm": {"name": "", "pan": 0, "pitch": 100, "volume": 90}, "autoplayBgs": False,
                      "bgs": {"name": "", "pan": 0, "pitch": 100, "volume": 90}, "encounterList": [], "parallaxName": "", "specifyBattleback": False})
        data = [0] * (w * h * 6)
        if ts == 11:
            for i in range(w * h): data[i] = 2048 + 16 * 48      # trawa, żeby w edytorze było widać mapę
        nslib.write_map(OUT + "data/Map%03d.json" % mid, props, data, [None])
        report.append("Map%03d.json: NOWY szkielet %s (%dx%d, tileset %d)" % (mid, name, w, h, ts))


def mapinfos(report):
    b = raw(DATA + "MapInfos.json")
    s = b.decode("utf-8")
    lines, infos = s.split("\n"), json.loads(s)
    order = max(o["order"] for o in infos if o) + 1
    for k, mid in enumerate(sorted(MAPS)):
        line = mid + 1
        cur = lines[line].rstrip(",")
        if cur != "null":
            o = json.loads(cur)
            assert o["id"] == mid and o["name"] == MAPS[mid][0], "MapInfos: id %d zajęte przez %s" % (mid, o.get("name"))
            continue
        row = {"id": mid, "expanded": False, "name": MAPS[mid][0], "order": order + k, "parentId": MAPS[mid][1], "scrollX": 0, "scrollY": 0}
        lines[line] = dump(row) + ("," if lines[line].endswith(",") else "")
    out = "\n".join(lines)
    js = json.loads(out)
    for mid in MAPS: assert js[mid]["id"] == mid and js[mid]["parentId"] == MAPS[mid][1]
    for mid in (158, 164): assert js[mid] is None
    assert all(js[i] == infos[i] for i in range(len(infos)) if i not in MAPS)
    open(OUT + "data/MapInfos.json", "wb").write(out.encode("utf-8"))
    report.append("MapInfos.json (oryginał sha256 %s): wpisy %s" % (sha(b), ", ".join("%d %s" % (m, MAPS[m][0]) for m in sorted(MAPS))))


def items(report):
    b = raw(DATA + "Items.json")
    s = b.decode("utf-8")
    its = json.loads(s)
    todo = [t for t in ITEMS if not (t[0] < len(its) and its[t[0]] and its[t[0]]["name"] == t[1])]
    for t in todo: assert t[0] == len(its) + todo.index(t), "Items.json: id %d nie jest kolejnym wolnym (ostatnie %d)" % (t[0], len(its) - 1)
    lines = s.split("\n")
    close = max(i for i, l in enumerate(lines) if l == "]")
    last = close - 1
    new = []
    for (iid, name, desc, icon, itype, price, note) in todo:
        it = copy.deepcopy(its[176])
        it.update({"id": iid, "name": name, "description": desc, "iconIndex": icon, "itypeId": itype, "price": price, "note": note})
        new.append(dump(it))
    if new:
        lines[last] = lines[last] + ","
        lines[close:close] = [l + ("," if k < len(new) - 1 else "") for k, l in enumerate(new)]
    out = "\n".join(lines)
    js = json.loads(out)
    for t in ITEMS: assert js[t[0]]["name"] == t[1]
    assert js[:len(its)] == its
    open(OUT + "data/Items.json", "wb").write(out.encode("utf-8"))
    report.append("Items.json (oryginał sha256 %s): %s" % (sha(b), ", ".join("%d %s" % (t[0], t[1]) for t in ITEMS)))


def system(report):
    b = raw(DATA + "System.json")
    s = b.decode("utf-8")
    sysj = json.loads(s)
    sw = sysj["switches"]
    for k, v in SWITCHES.items(): assert k < len(sw) and (not sw[k] or sw[k] == v), "System.json: przełącznik %d zajęty (%r)" % (k, sw[k])
    a = s.index('"switches":[')
    e = s.index("]", a)
    assert json.loads(s[a + len('"switches":'):e + 1]) == sw
    sw2 = list(sw)
    for k, v in SWITCHES.items(): sw2[k] = v
    out = s[:a] + '"switches":' + dump(sw2) + s[e + 1:]
    js = json.loads(out)
    assert {k: js[k] for k in js if k != "switches"} == {k: sysj[k] for k in sysj if k != "switches"}
    open(OUT + "data/System.json", "wb").write(out.encode("utf-8"))
    report.append("System.json (oryginał sha256 %s): przełączniki %s" % (sha(b), ", ".join("%d %s" % kv for kv in SWITCHES.items())))


def plugins(report):
    b = raw(ROOT + "js/plugins.js")
    lines = b.decode("utf-8").split("\n")
    for group, after in ((DATA_PLUGINS, "TownLife_Data"), (ENGINE_PLUGINS, "CzerwonaWoda")):
        anchor = after
        for name, desc in group:
            assert os.path.exists(ROOT + "js/plugins/%s.js" % name), "brak pliku wtyczki " + name
            if not any(l.startswith('{"name":"%s",' % name) for l in lines):
                i = [j for j, l in enumerate(lines) if l.startswith('{"name":"%s",' % anchor)]
                assert len(i) == 1 and lines[i[0]].endswith(","), "plugins.js: kotwica %s" % anchor
                lines.insert(i[0] + 1, dump({"name": name, "status": True, "description": desc, "parameters": {}}) + ",")
            anchor = name
    names = [l.split('"')[3] for l in lines if l.startswith('{"name":"')]
    assert names.index("TownLife_Data") < names.index("Wyspa_Data") < names.index("Cysterna_Data") < names.index("TownLife") < names.index("TownQuests_Data")
    assert names.index("TownQuests_Data") + 1 == names.index("TownQuests")
    assert names.index("CzerwonaWoda") < names.index("Wyspa") < names.index("Cysterna") < names.index("CleanHUD")
    open(OUT + "js/plugins.js", "wb").write("\n".join(lines).encode("utf-8"))
    report.append("plugins.js (oryginał sha256 %s): +%s pod TownLife_Data, +%s pod CzerwonaWoda" % (
        sha(b), ", ".join(n for n, _ in DATA_PLUGINS), ", ".join(n for n, _ in ENGINE_PLUGINS)))


def main():
    os.makedirs(OUT + "data", exist_ok=True)
    os.makedirs(OUT + "js", exist_ok=True)
    report = []
    stub_maps(report)
    mapinfos(report)
    items(report)
    system(report)
    plugins(report)
    text = "PAKIET 0 - pliki do instalacji (tools/miejsca_wyspy/staging -> data/, js/plugins.js), przy zamkniętym edytorze.\n" + "\n".join(report) + "\n"
    open(OUT + "ZMIANY.txt", "wb").write(text.encode("utf-8"))
    print(text)


if __name__ == "__main__":
    main()
