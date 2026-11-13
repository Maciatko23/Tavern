# -*- coding: utf-8 -*-
"""Questy pustelni 2026-11-11: siedem zadan wylaczonych razem z pustelnia (155/156/157) dostaje nowe miejsca na swiecie (zmiana fabuly:
jesienna burza zerwala sciezke na klif, brat Kleofas zniosl ksiegi do kaplicy w Kruczogrodzie, kruki zakonu przeniosly sie do kruczarni
w miescie). K50/D23 (kaplica + pulpit w srodku, Map178), K51/D24 (droga kruka przez Kruczy Jar do kruczarni, zerdz na Map008), K53 (4 rynny
na murach Kruczogrodu), D40 (dzwonnica + kruczarnia), K68 (kopiec na Orlej Grani, fundament strazy na wybiegu stajni). Gdy
WyspaData.HERMITAGE_OPEN = true wszystko dziala po staremu.

Czyta data/, js/ - zapisuje TYLKO tools/questy_pustelnia/staging/ (te same sciezki wzgledne). Mapy: Map178, Map108 tu; Map008 (tylko dopisane
zdarzenia - osobny skrypt miasto008.py, bo edytor / inny agent moze ja zmieniac). Dopasowanie JS: dokladne, STOP gdy brak albo wiecej niz
jedno; pliki binarnie, LF.
   python tools/questy_pustelnia/popraw.py"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
os.chdir(ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools", "rozszerzenia"))
import wspolne as W
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
STAG = os.path.join(HERE, "staging")
DONE = set()


def stop(msg): raise SystemExit("STOP: " + msg)
def write_bin(rel, data):
    p = os.path.join(STAG, *rel.split("/")); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb").write(data)
def read_src(rel):
    # (this run's own earlier step wins, else the live file - the staging of an earlier run is never read: re-runs are the same)
    p = os.path.join(ROOT, *rel.split("/"))
    if rel in DONE: p = os.path.join(STAG, *rel.split("/"))
    raw = open(p, "rb").read()
    if b"\r" in raw: stop(rel + " ma CR (LF wymagane)")
    return raw.decode("utf-8")
def patch(rel, pairs):
    s = read_src(rel)
    for old, new in pairs:
        n = s.count(old)
        if n != 1: stop("%s: wzorzec znaleziony %d razy: %r" % (rel, n, old[:90]))
        s = s.replace(old, new)
    write_bin(rel, s.encode("utf-8")); DONE.add(rel); print("   staging:", rel)
def append(rel, text):
    s = read_src(rel)
    s = s.rstrip("\n") + "\n\n"   # (a blank line first: a text section above must end)
    write_bin(rel, (s + text.strip("\n") + "\n").encode("utf-8")); DONE.add(rel); print("   staging (dopisane):", rel)


# =============================================================== Pustelnia_Data.js / Pustelnia.js (K50, D23: kaplica, pulpit w srodku)
patch("js/plugins/Pustelnia_Data.js", [
 ('    const CHAPEL_MAP = 8;\n', '    const CHAPEL_MAP = 8, CHAPEL_INNER = 178;   // (Map178 "Kaplica": the lectern of the chapel - D23\'s reading)\n'),
 ('["pustelnia", "w2", "orzel", "kasztelan", "latarnia", "swiete_kosci", "zakon", "podroznicy"]',
  '["pustelnia", "w2", "orzel", "kasztelan", "latarnia", "swiete_kosci", "zakon", "podroznicy", "kruk", "cysterna"]'),
 ('window.PustelniaData = { MAP, INNER, CHAPEL, CHAPEL_MAP, ITEM,', 'window.PustelniaData = { MAP, INNER, CHAPEL, CHAPEL_MAP, CHAPEL_INNER, ITEM,'),
])
patch("js/plugins/Pustelnia.js", [
 ('    const spkK = () => { const ev = kleofasEv(); return { id: ev ? ev.eventId() : -1, name: D.RESIDENT.name }; };\n',
  '''    // (2026-11-11, questy_pustelnia) the lectern of the chapel's interior (Map178 "Pulpit z księgą"): Kleofas, who stands outside by the door, steps in
    // for the reading - his picture (the event "Kleofas przy pulpicie", note <Pustelnia:czytanie>) is shown only for it
    const readerEv = () => ($gameMap.events().find(e => e && e.event() && /<Pustelnia:czytanie>/.test(e.event().note || "")) || null);
    const inChapel = () => chapel() && $gameMap.mapId() === D.CHAPEL_INNER;
    function reader(on) { const ev = readerEv(); if (!ev) return; ev.setTransparent(!on); if (on) ev.setOpacity(255); }
    function kleofasAtChapel() {
        const L = TL(), r = L && L.RESIDENTS ? L.RESIDENTS.find(x => x.key === KEY) : null;
        return !!r && !L.gone(KEY) && L.homeOf(r) === D.CHAPEL_MAP && L.entryAt(r, hour()).act !== "inside";
    }
    const spkK = () => { const ev = kleofasEv() || (inChapel() ? readerEv() : null); return { id: ev ? ev.eventId() : -1, name: D.RESIDENT.name }; };
'''),
 ('        if ($gameMap.mapId() !== INNER || !kleofasHere()) return $gameMap.mapId() === INNER ? { pop: D.TX.noKleofas } : { say: D.TX.readWhere };\n',
  '''        const ch = chapel(), there = $gameMap.mapId() === (ch ? D.CHAPEL_INNER : INNER);
        if (!there || !(ch ? kleofasAtChapel() : kleofasHere())) return there ? { pop: D.TX.noKleofas } : { say: D.TX.readWhere };
'''),
 ('''        if (!has() || !interp) return;
        const b = readBlock();
        if (b && b.need) { T.popup.need(pendantIcon(), b.need); return; }
        if (b && b.pop) { T.popup(b.pop, { color: "#ffe9a8" }); return; }
        const out = b ? say_([], spkK(), b.say) : readChoice();
        if (out.length) interp.setupChild(out.concat([C(0, [])]), interp.eventId());
''', '''        if (!has() || !interp) return;
        if ($gameMap.mapId() === D.CHAPEL_INNER && !chapel()) return;   // (the hermitage open: the chapel's pulpit is only a book on a stand)
        const b = readBlock();
        if (b && b.need) { T.popup.need(pendantIcon(), b.need); return; }
        if (b && b.pop) { T.popup(b.pop, { color: "#ffe9a8" }); return; }
        const ch = inChapel();
        if (ch) reader(true);
        const out = b ? say_([], spkK(), b.say) : readChoice();
        if (out.length) { if (ch) act(out, ["readerOff"]); interp.setupChild(out.concat([C(0, [])]), interp.eventId()); }
        else if (ch) reader(false);
'''),
 ('            } else if (what === "read") {\n                read(a);\n', '            } else if (what === "readerOff") {\n                reader(false);\n            } else if (what === "read") {\n                read(a);\n'),
 ('        pustelniaOtwarta: () => { const wy = W(); return !!(wy && wy.isReady && wy.isReady(D.MAP)); },',
  '        // (2026-11-11) the hermitage out of the world: K50 and D23 are offered at the chapel (Kleofas lives there, the lectern is in its interior)\n        pustelniaOtwarta: () => { const wy = W(); return chapel() || !!(wy && wy.isReady && wy.isReady(D.MAP)); },'),
 ('    T.on("mapReady", () => { hookTalk(); syncCards(); }, { owner: PLUGIN });', '    T.on("mapReady", () => { hookTalk(); syncCards(); reader(false); }, { owner: PLUGIN });'),
])

# =============================================================== Kruk.js (K51: droga kruka przez Kruczy Jar do kruczarni w miescie; D24: zerdz w miescie)
patch("js/plugins/Kruk.js", [
 ('    const MAP = D.MAP, HARBOUR = D.HARBOUR, HERMITAGE = D.HERMITAGE;\n',
  '''    const MAP = D.MAP, HARBOUR = D.HARBOUR, HERMITAGE = D.HERMITAGE;
    // (2026-11-11, questy_pustelnia) the Urwisko is out of the world (WyspaData.HERMITAGE_OPEN = false): the Order's ravens moved to the ravenry of
    // Kruczogrod (Map008, a tower with a room in the north-east; the old perches on the markers zerdz_1 / zerdz_2 there) and K51's raven leads there
    const TOWN = 8, KRUCZY_JAR = 3;
    const closedHermitage = () => !(window.WyspaData && window.WyspaData.HERMITAGE_OPEN);
    const RMAP = () => (closedHermitage() ? TOWN : MAP);   // (the map of the ravenry)
'''),
 ('        if (!tm || $gameMap.mapId() !== MAP) { oldPerches = []; return; }', '        if (!tm || $gameMap.mapId() !== RMAP()) { oldPerches = []; return; }'),
 ('''        return [
            // (2026-11-11 questy_mapa: the way to Pustelnia''', '''        // the way to the town's ravenry: the mast (Przystan) -> the east road of Przystan -> the road of Kruczy Jar by the town gate -> the town's
        // south gate (Kruczogrod) -> the perch of the young raven by the tower (a free flight over the town)
        if (closedHermitage()) return [
            { map: HARBOUR, at: mastPoint, near: 4.5, go: () => ({ x: 100.5, y: 70.9, z: 0 }), dawn: true },
            { map: HARBOUR, at: () => ({ x: 100.5, y: 70.9, z: 0 }), near: 4, go: () => ({ x: 126, y: 66, z: 90, off: true }) },
            { map: KRUCZY_JAR, at: () => ({ x: 35.5, y: 8.9, z: 0 }), near: 5, go: () => ({ x: 35.5, y: -5, z: 90, off: true }) },
            { map: TOWN, at: () => ({ x: 31.5, y: 107.9, z: 0 }), near: 5, go: () => oldPerchPoint("zerdz_2") },
            { map: TOWN, at: () => oldPerchPoint("zerdz_2"), near: 3.2, end: true }
        ];
        return [
            // (2026-11-11 questy_mapa: the way to Pustelnia'''),
 ('        if (!built) return null;   // (the Urwisko not built yet - package 0\'s stub: no raven anywhere)', '        if (!built && !closedHermitage()) return null;   // (the Urwisko not built yet - package 0\'s stub: no raven anywhere)'),
 ('        if (mapId !== MAP || clock() < s.scaredUntil) return null;\n        const at = oldPerchPoint("zerdz_2");', '        if (mapId !== RMAP() || clock() < s.scaredUntil) return null;\n        const at = oldPerchPoint("zerdz_2");'),
 ('        miejsceGotowe: (ctx, id) => !!(W() && W().isReady && W().isReady(id)),',
  '        // (the hermitage pocket out of the world: its places stand for the town\'s ravenry - K51 is offered, the raven leads to Kruczogrod)\n        miejsceGotowe: (ctx, id) => !!(W() && W().isReady && W().isReady(id)) || (closedHermitage() && (id === MAP || id === HERMITAGE)),'),
 ('        k51Gdzie: () => { const leg = S().k51.leg; return leg <= 1 ? TK.kod.vars[0] : leg === 2 ? TK.kod.vars[1] : TK.kod.vars[2]; },',
  '        k51Gdzie: () => { const leg = S().k51.leg, V = TK.kod.vars; return closedHermitage() ? V[[0, 0, 1, 2, 3][Math.min(leg, 4)]] || V[0] : leg <= 1 ? V[0] : leg === 2 ? V[1] : V[2]; },'),
])

# =============================================================== Cysterna.js (K53: cztery rynny na murach Kruczogrodu)
patch("js/plugins/Cysterna.js", [
 ('    T.inject([URW], { ids: D.IDS, owner: PLUGIN, build: data => gutterEvents(data) });',
  '''    // (2026-11-11, questy_pustelnia) the Urwisko is out of the world: the four gutters of the Order are on the old walls of Kruczogrod (Map008, the
    // markers "Miejsce: rynna_1..4" there); the grate of the overflow channel stays shut ("kanal zasypany" - the landslide)
    const townGutters = () => !(window.WyspaData && window.WyspaData.HERMITAGE_OPEN);
    T.inject([URW, TOWN], { ids: D.IDS, owner: PLUGIN, build: (data, mapId) => ((mapId === TOWN) === townGutters() ? gutterEvents(data) : []) });'''),
 ('        urwiskoGotowe: () => !!W() && W().isReady(URW),', '        urwiskoGotowe: () => townGutters() || (!!W() && W().isReady(URW)),'),
])

# =============================================================== Zakon_Data.js (K68: kopiec -> Orla Gran, fundament -> wybieg stajni w miescie)
patch("js/plugins/Zakon_Data.js", [
 ('    const TOWERS = [   // 7.1:', '''    // (2026-11-11, questy_pustelnia) the hermitage pocket is out of the world: the foundation of the third tower stands east of the Garrison
    // (Map162, outside the palisade: "the garrison was built on the Order's watchtower") and the cairn of the cliff on the platform of the Orla Gran (Map175, by the mine);
    // with WyspaData.HERMITAGE_OPEN = true the old places (Map157, Map155)
    const HERM = !!(window.WyspaData && window.WyspaData.HERMITAGE_OPEN);
    const TOWERS = [   // 7.1:'''),
 ('{ key: "straznica_157", map: 157, x: 94, y: 52, card: true,', '{ key: "straznica_157", map: HERM ? 157 : 162, x: HERM ? 94 : 83, y: HERM ? 52 : 45, card: true,'),
 ('{ key: "kopiec_155", map: 155, x: 70, y: 40, ids: { cairn: 2750, stone: 2751 }, at: [70, 41] }',
  '{ key: "kopiec_155", map: HERM ? 155 : 175, x: HERM ? 70 : 35, y: HERM ? 40 : 34, ids: { cairn: 2750, stone: 2751 }, at: HERM ? [70, 41] : [35, 35] }'),
 ('{ key: "straznica_157", map: 157, x: 96, y: 54, near: 3,', '{ key: "straznica_157", map: HERM ? 157 : 162, x: HERM ? 96 : 85, y: HERM ? 54 : 47, near: 3,'),
 ('{ key: "kopiec_155", map: 155, x: 70, y: 41, near: 2,', '{ key: "kopiec_155", map: HERM ? 155 : 175, x: HERM ? 70 : 35, y: HERM ? 41 : 36, near: 2,'),
])

# =============================================================== Podroznicy_Data.js / _Sprawy.js (D40: dzwonnica + kruczarnia zamiast klifu i baszty)
patch("js/plugins/Podroznicy_Data.js", [
 ('        d40_pustelnia: { map: 155, id: 951, marker: "urwisko", dx: 1, x: 8, y: 7, deco: "glint" },\n        d40_urwisko: { map: 157, id: 951, marker: "kruczarnia", dy: 1, x: 26, y: 13, deco: "glint" },\n',
  '''        // (2026-11-11, questy_pustelnia: the hermitage pocket out of the world - the stairs of the bell tower (Map108, the way up) and the foot of the
        // ravenry's tower (Map008) instead of the cliff and the tower of the ravens; the keys stay, with the hermitage open the old places)
        d40_pustelnia: (window.WyspaData && window.WyspaData.HERMITAGE_OPEN) ? { map: 155, id: 951, marker: "urwisko", dx: 1, x: 8, y: 7, deco: "glint" }
            : { map: 108, id: 952, marker: "widok_dzwonnica", x: 5, y: 4, deco: "glint" },
        d40_urwisko: (window.WyspaData && window.WyspaData.HERMITAGE_OPEN) ? { map: 157, id: 951, marker: "kruczarnia", dy: 1, x: 26, y: 13, deco: "glint" }
            : { map: 8, id: 908, marker: "widok_kruczarnia", x: 106, y: 9, deco: "glint" },
'''),
])
patch("js/plugins/Podroznicy_Sprawy.js", [
 ('        d40Oferta: () => pierwszaWizyta("kartograf") && !!(window.WyspaData && window.WyspaData.HERMITAGE_OPEN),',
  '        d40Oferta: () => pierwszaWizyta("kartograf"),   // (2026-11-11: the two view points of the hermitage pocket stand elsewhere while it is out - Podroznicy_Data SPOTS)'),
])

# =============================================================== the texts (sections "kaplica.*" merge only while the hermitage is out)
patch("js/teksty/pustelnia.txt", [
 ('''[kaplica.meet]
...Czego tu szukasz? Kaplica dla wszystkich otwarta, ale ławka jest moja.
> Nie wiedziałem, że ktoś tu siedzi. Skąd pan?
Z klifu nad przystanią. Zszedłem do miasta na jakiś czas. Klif poczeka, księgi też. (Kleofas patrzy na twoją szyję.) Pokaż to.
''', '''[kaplica.meet]
...Czego tu szukasz? Kaplica dla wszystkich otwarta, ale ławka jest moja.
> Nie wiedziałem, że ktoś tu siedzi. Skąd pan?
Z klifu nad przystanią. Jesienna burza zwaliła ścieżkę i do pustelni nie dojdzie dziś nawet koza. Księgi zakonu zniosłem tu, do kaplicy, w trzech workach. Tyle się dało unieść.
> A kruki? Podobno zakon trzymał kruki.
Kruki były mądrzejsze ode mnie. Zakon miał kruczarnię także w mieście: wieża z izbą przy północno-wschodnim murze. Tam się przeniosły, na stare żerdzie. Znajdziesz je bez trudu - kraczą jak sołtys. (Kleofas patrzy na twoją szyję.) Pokaż to.
'''),
 ('[kaplica.meetNote]\nPustelnik przy kaplicy\nPrzy kaplicy w Kruczogrodzie siedzi brat Kleofas - ostatni kronikarz zakonu. Zszedł z klifu nad przystanią na jakiś czas. Na mój wisiorek powiedział: „To nie ozdoba. To znak posłańca.”\n',
  '[kaplica.meetNote]\nPustelnik przy kaplicy\nPrzy kaplicy w Kruczogrodzie siedzi brat Kleofas - ostatni kronikarz zakonu. Jesienna burza zerwała ścieżkę na klif, więc zniósł księgi zakonu do kaplicy, a kruki zakonu przeniosły się do kruczarni - wieży z izbą w północno-wschodnim rogu miasta. Na mój wisiorek Kleofas powiedział: „To nie ozdoba. To znak posłańca.”\n'),
 ('[kaplica.readWhere]\nNie tutaj. Szyfr czyta się przy pulpicie, a pulpit został w skryptorium na klifie. Karta poczeka.\n',
  '[kaplica.readWhere]\nNie tutaj. Szyfr czyta się przy pulpicie - w kaplicy, przy dobrym świetle. Idź przodem, przyjdę za tobą. Za dnia.\n'),
])
append("js/teksty/pustelnia.txt", '''
# (2026-11-11, questy_pustelnia) K50 i D23 przy kaplicy: atrament oddajesz Kleofasowi pod kaplicą, karty czytacie przy pulpicie w kaplicy
kaplica.zadania.K50.where = brat Kleofas przy kaplicy w Kruczogrodzie
kaplica.zadania.K50.steps.0.text = Przynieś bratu Kleofasowi 4× Szyszki, 1× Żelazo i 1 porcję własnej deszczówki (przy kaplicy w Kruczogrodzie, za dnia).
kaplica.zadania.D23.where = pulpit w kaplicy w Kruczogrodzie + karty po całej wyspie
kaplica.zadania.D23.steps.0.text = Znajdź karty kroniki i odczytaj je z bratem Kleofasem przy pulpicie w kaplicy w Kruczogrodzie (7–19, potrzebny wisiorek). Odczytane: {n}/6.{wtorbie}{gdzie}
kaplica.karty.5.where = zwitek w obrączce kruka z kruczarni w Kruczogrodzie
''')

append("js/teksty/kruk.txt", '''
# ======================================================================== KRUCZARNIA W MIEŚCIE (pustelnia poza światem, 2026-11-11)
# Urwisko Kruków jest poza światem: kruki zakonu przeniosły się do kruczarni w Kruczogrodzie (wieża z izbą w północno-wschodnim rogu miasta, żerdzie
# pod wieżą). Klucze „kaplica.<ścieżka>” czyta się tylko wtedy (Pustelnia_Data.js).
kaplica.ravenryLook = Wieża kruczarni. Na starych żerdziach zakonu siedzą kruki. Jeden młody, z mosiężną obrączką na nóżce, patrzy prosto na ciebie.
kaplica.ravenryEmpty = Wieża kruczarni, stare żerdzie zakonu. Kruka z obrączką teraz tu nie ma.
kaplica.towerLook = Stare żerdzie zakonu pod wieżą kruczarni. Kilka kruków kracze na murze, reszta w wieży. Zapach jak z kurnika, tylko gorzej.
kaplica.leftHungry = {imie} odleciał do kruczarni. Głodny.
kaplica.fled = {imie} spłoszony odlatuje do kruczarni. Wróci rano.
kaplica.k51Ravenry = (Kruk siada na starej żerdzi pod wieżą kruczarni, między innymi krukami. Na nóżce błyska mu mosiężna obrączka.)
kaplica.listy.3.name = Brat Kleofas (przy kaplicy)
kaplica.kod.vars.0 = Kruk poleciał z masztu na wschód, wzdłuż drogi z przystani ku Kruczemu Jarowi.
kaplica.kod.vars.1 = Kruk przysiadł na drodze w Kruczym Jarze, niedaleko bramy miasta.
kaplica.kod.vars.2 = Kruk czeka w Kruczogrodzie, za południową bramą.
kaplica.kod.vars.3 = Kruk poleciał do kruczarni, w północno-wschodni róg miasta.
kaplica.kod.openYoungMenu.3 = Wrócił do kruczarni, bo był głodny. Nakarm go, to wróci z tobą.
kaplica.zadania.K51.where = przystań → Kruczy Jar → Kruczogród → kruczarnia
[kaplica.zadania.K51.reward.note]
Kruczarnia w mieście
Kruk z masztu zaprowadził mnie wschodnią drogą z przystani, przez Kruczy Jar i bramę południową do Kruczogrodu - do kruczarni zakonu, wieży z izbą w północno-wschodnim rogu miasta. Kruk z mosiężną obrączką siedzi tam na starej żerdzi.

kaplica.zadania.D24.where = kruczarnia w Kruczogrodzie → dom dziadka → działka
kaplica.zadania.D24.desc = Młody kruk z obrączką zakonu siedzi w kruczarni w Kruczogrodzie. Kruki nie biorą jedzenia z byle ręki - trzeba przychodzić, dzień po dniu.
kaplica.zadania.D24.steps.0.text = Nakarm kruka w kruczarni w Kruczogrodzie trzy razy, każdy raz innego dnia (surowe mięso albo ryba). Nie biegaj przy nim, psa zostaw w domu. Karmienia: {n}/3.
[kaplica.zadania.D24.steps.1.say]
> Dziadku. Kruk z kruczarni siada mi na ramieniu. Miał na nóżce to. (Pokazujesz obrączkę.)

[kaplica.zadania.D24.steps.1.done]
(Dziadek bierze obrączkę i długo obraca ją w palcach.) Skąd to masz? ...Siadaj.
Mój dziad trzymał kruki. Tam, w mieście, w wieży przy murze, zanim na górze postawili karczmę. Mówił, że nasza rodzina nosi listy, których nikt nie powinien czytać. Śmiałem się z niego.
Twój ojciec też się śmiał. A potem dał ci ten kamień na szyję.
(Dziadek milknie. Oddaje ci obrączkę.) Dbaj o tego ptaka. I postaw mu grzędę na działce. Kruk musi mieć swoje miejsce, jak każdy.

[kaplica.zadania.D24.steps.1.reward.note]
Ród kruczarzy
Dziadek rozpoznał obrączkę kruka. Jego dziad trzymał kruki w kruczarni w mieście, zanim na górze postawiono karczmę - „nasza rodzina nosi listy, których nikt nie powinien czytać”. Dziadek mówi, że sam się z tego śmiał, dopóki jego ojciec nie dał mu wisiorka z krukiem - tego samego, który potem dał mojej matce, a ona mnie.

[kaplica.zadania.D24.reward.note]
Oswojony kruk
Kruk z kruczarni mieszka teraz na grzędzie na działce. Lata ze mną, nosi listy po wyspie (nie przez morze), leci na zwiad, pilnuje pola przed ptakami, a czasem coś przynosi. Na noc wraca na grzędę.
''')

append("js/teksty/cysterna.txt", '''
# ======================================================================== RYNNY NA MURACH KRUCZOGRODU (pustelnia poza światem, 2026-11-11)
# Urwisko jest poza światem: krata przelewu stoi zasypana, a cztery rynny zakonu, którymi spływał deszcz do cysterny, są na starych murach twierdzy
# w Kruczogrodzie. Klucze „kaplica.<ścieżka>” czyta się tylko wtedy (Pustelnia_Data.js).
kaplica.grateBlocked = Za kratą kanał zasypany gruzem po osuwisku. Tędy nie wyjdziesz.
kaplica.leverSub = Krata przelewu puściła - ale kanał za nią jest zasypany.
kaplica.leverDone = Dźwignia opuszczona. Rygiel puszczony, kanał za kratą zasypany.
kaplica.rainOpenSub = Deszcz ze starych murów twierdzy znów spłynie do cysterny.
[kaplica.rainClogged]
> Z kanału ledwo kapie. Rynny na starych murach muszą być zapchane.

kaplica.rainLookN = Zasuwa deszczowa otwarta. Rynny na murach twierdzy: oczyszczone {n}/4.
kaplica.gutterLook = Rynna zakonu, wykuta w kamieniu muru - zapchana gruzem i starym gniazdem.
kaplica.zadania.D28.steps.2.text = Kanał przelewu kończy się kratą z krukiem. Otwórz ją dźwignią od środka (kanał na północnym wschodzie).
kaplica.zadania.K53.where = Stara cysterna zakonu → mury twierdzy w Kruczogrodzie
kaplica.zadania.K53.desc = Cysterna pije deszcz z rynien wykutych w starych murach twierdzy. Przez lata zapchały się gruzem i gniazdami, a zasuwa deszczowa zardzewiała. Deszcz spływa do ulic.
kaplica.zadania.K53.steps.1.text = Oczyść cztery rynny zakonu na starych murach Kruczogrodu z gruzu i gniazd ({n}/4) - kilofem albo łopatą.
[kaplica.zadania.K53.reward.note]
Rynny zakonu
Otworzyłem zasuwę deszczową w starej cysternie i oczyściłem cztery rynny zakonu na starych murach Kruczogrodu. Każdy deszcz znowu napełnia cysternę - trzy razy więcej niż przez zapchane rynny.

[kaplica.uwagi.5.lines]
Pada, a ja słyszę wodę pod wzgórzem. Jak za mojego mistrza. Ktoś oczyścił rynny na murach? ...Cztery i dwa, chłopcze. Woda idzie.
''')

append("js/teksty/zakon.txt", '''
# (2026-11-11, questy_pustelnia) kopiec z klifu stoi na Orlej Grani, fundament trzeciej strażnicy obok garnizonu (Map162)
kaplica.zadania.K68.steps.0.text = Znajdź wszystkie Zapiski strażnic: trzy w kopcach z krukiem (Omszała łąka, Skraj lasu, szczyt Orlej Grani) i trzy pod płytami strażnic (Polna droga, Góry, ziemia obok garnizonu) ({n}/6).
[kaplica.zadania.K68.offer.accept]
Kopce stoją przy starych drogach: na Omszałej łące, na Skraju lasu i na szczycie Orlej Grani, nad kamieniołomem. Wieże... z wież zostały fundamenty. Jedna stała nad zatoką, tam gdzie dziś garnizon - żołnierze postawili palisadę na jej kamieniach, a fundamenty zostały tuż obok. Szukaj płyt z krukiem.

kaplica.odkrycia.straznica_157.name = Fundamenty strażnicy przy garnizonie
kaplica.odkrycia.straznica_157.text = Pod trawą za palisadą garnizonu leżą fundamenty wieży zakonu. Garnizon postawiono obok, na jej kamieniach. Płyta z krukiem została.
kaplica.odkrycia.kopiec_155.name = Kopiec z krukiem na Orlej Grani
kaplica.odkrycia.kopiec_155.text = Kopiec na szczycie Orlej Grani, nad kamieniołomem, zwrócony do morza. Kamień z krukiem na wierzchu wytarty od wiatru.
''')

append("js/teksty/podroznicy.txt", '''
# (2026-11-11, questy_pustelnia) D40: dwa punkty widokowe pustelni zastąpione: schody dzwonnicy i stopa wieży kruczarni
kaplica.miejsca.d40_pustelnia.name = Punkt widokowy: schody dzwonnicy
kaplica.miejsca.d40_urwisko.name = Punkt widokowy: pod wieżą kruczarni
kaplica.zadania.D40.steps.0.text = Szkice z punktów widokowych ({n}/{z}): schody dzwonnicy, wieża kruczarni, latarnia, wieża garnizonu, nad kamieniołomem, róg nabrzeża przystani - na miejscu O przy znaczku.
''')


# =============================================================== maps (Map178 the chapel, Map108 the bell tower)
def load(n):
    o, lay = W.read_json("data/Map%03d.json" % n)
    if lay != "map": stop("Map%03d nie w ukladzie mapy" % n)
    for i, e in enumerate(o["events"]):
        if e is not None and e["id"] != i: stop("Map%03d: zdarzenie %d pod indeksem %d" % (n, e["id"], i))
    return o
def save(m, n):
    for i, e in enumerate(m["events"]):
        if e is not None and e["id"] != i: stop("Map%03d: id != indeks (%d/%d)" % (n, e["id"], i))
    txt_ = W.map_text(m).encode("utf-8")
    if json.loads(txt_.decode("utf-8")) != m: stop("Map%03d: round trip" % n)
    write_bin("data/Map%03d.json" % n, txt_); print("   staging: data/Map%03d.json" % n)
BLANK = {"actorId": 1, "actorValid": False, "itemId": 1, "itemValid": False, "selfSwitchCh": "A", "selfSwitchValid": False, "switch1Id": 1,
         "switch1Valid": False, "switch2Id": 1, "switch2Valid": False, "variableId": 1, "variableValid": False, "variableValue": 0}
def C(code, params, indent=0): return {"code": code, "indent": indent, "parameters": params}
def page(image=None, lst=None, trigger=0, priority=1, through=False, direction_fix=False):
    img = {"tileId": 0, "characterName": "", "direction": 2, "pattern": 0, "characterIndex": 0}
    if image: img.update(image)
    return {"conditions": dict(BLANK), "directionFix": direction_fix, "image": img, "list": lst or [C(0, [])], "moveFrequency": 3,
            "moveRoute": {"list": [C(0, [])], "repeat": True, "skippable": False, "wait": False}, "moveSpeed": 3, "moveType": 0,
            "priorityType": priority, "stepAnime": False, "through": through, "trigger": trigger, "walkAnime": False}
def add_event(m, name, x, y, pg, note=""):
    i = len(m["events"])
    m["events"].append({"id": i, "name": name, "note": note, "pages": [pg], "x": x, "y": y}); return i

m = load(178)
e16 = m["events"][16]
if e16["name"] != "Pulpit z księgą": stop("Map178: zdarzenie 16 to nie pulpit")
e16["pages"][0]["list"] = [C(355, ["if (window.Pustelnia) Pustelnia.lectern(this);"]), C(0, [])]
add_event(m, "Kleofas przy pulpicie", 10, 5,
          page({"characterName": "$Npc_Pustelnik", "direction": 6, "pattern": 1}, through=True, direction_fix=True), "<Pustelnia:czytanie>")
add_event(m, "Miejsce: kaplica_pulpit", 11, 6, page())
save(m, 178)

m = load(108)
add_event(m, "Miejsce: widok_dzwonnica", 5, 4, page())
save(m, 108)
print("gotowe: popraw.py (Map008: miasto008.py)")
