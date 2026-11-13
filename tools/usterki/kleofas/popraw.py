# -*- coding: utf-8 -*-
"""Kleofas przy kaplicy (2026-11-11): pustelnia poza swiatem (Wyspa_Data HERMITAGE_OPEN = false) - brat Kleofas mieszka przy kaplicy
w Kruczogrodzie (Map008: miejsca kaplica_drzwi / kaplica_lawka), dopoki pustelnia jest zamknieta; po jej powrocie wszystko wraca.

Czyta js/ - zapisuje TYLKO tools/usterki/kleofas/staging/ (te same sciezki wzgledne). Nic w js/ ani data/.
   python tools/usterki/kleofas/popraw.py
Dopasowanie tekstow: dokladne, STOP gdy brak albo wiecej niz jedno; pliki binarnie, LF."""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
os.chdir(ROOT)
STAG = os.path.join(HERE, "staging")
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass


def stop(msg): raise SystemExit("STOP: " + msg)
def read(rel): return open(rel, "rb").read().decode("utf-8")
def write(rel, txt):
    if "\r" in txt: stop(rel + ": CR w wyniku")
    p = os.path.join(STAG, *rel.split("/")); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, "wb").write(txt.encode("utf-8")); print("   staging:", rel)
def patch(txt, old, new, what):
    n = txt.count(old)
    if n != 1: stop("%s: dopasowan %d (oczekiwano 1)" % (what, n))
    return txt.replace(old, new)


# ------------------------------------------------------------------ Pustelnia_Data.js: Kleofas's second home + the words
rel = "js/plugins/Pustelnia_Data.js"; s = read(rel)
s = patch(s, '    const MAP = 155, INNER = 156;\n',
'''    const MAP = 155, INNER = 156;
    // (2026-11-11) the hermitage is out of the world (WyspaData.HERMITAGE_OPEN = false): brother Kleofas lives by the chapel of Kruczogrod
    // (Map008, the spots kaplica_drzwi / kaplica_lawka) and the steps that need him happen there. CHAPEL is read once at the load: it picks
    // the words ("kaplica.*" of the text files - appended below); the resident's second home (alt) follows the flag live.
    const CHAPEL_MAP = 8;
    const CHAPEL = !(window.WyspaData && window.WyspaData.HERMITAGE_OPEN);
''', "Pustelnia_Data MAP")
s = patch(s, '        away: ["cela_drzwi"],\n', '        away: ["cela_drzwi", "kaplica_drzwi"],\n', "Pustelnia_Data away")
s = patch(s, '''        barks: {
        },
        talk: {
        }
    };
    Watki.scal(RESIDENT, "pustelnia", "mieszkaniec");''',
'''        barks: {
        },
        talk: {
        },
        // while the hermitage is out of the world: he lives by the chapel of Kruczogrod (Map008) - at the door or on the bench all day (in the
        // rain at the door, under the eaves), not out at all from 20 to 22:30 (asleep inside) except the Night of the Question, when he waits
        // at the door. His words: mieszkaniec.alt.* of js/teksty/pustelnia.txt. The condition "pustelniaZamknieta": Pustelnia.js
        alt: { map: CHAPEL_MAP, when: "pustelniaZamknieta",
            plan: [[0, "inside", "kaplica_drzwi"], [0, "stand", "kaplica_drzwi", night],
                   [6, "stand", "kaplica_drzwi"],
                   [9, "stand", "kaplica_lawka", dry],
                   [13, "stand", "kaplica_drzwi"],
                   [15, "stand", "kaplica_lawka", dry],
                   [19, "stand", "kaplica_drzwi"],
                   [20, "inside", "kaplica_drzwi"],
                   [22.5, "stand", "kaplica_drzwi", night]],
            barks: {}, talk: {} }
    };
    Watki.scal(RESIDENT, "pustelnia", "mieszkaniec");
    // the words of the chapel version: "kaplica.<path>" in the text files below says the same path again for the time Kleofas lives by the
    // chapel; merged into the file's own tree FIRST (this plugin stands above the data plugins), so the quests' words copied from it later
    // are the chapel ones. Nothing is deleted: with the hermitage back (CHAPEL false) the files read as before.
    if (CHAPEL) ["pustelnia", "w2", "orzel", "kasztelan", "latarnia", "swiete_kosci", "zakon", "podroznicy"].forEach(f => Watki.scal(Watki.teksty(f), f, "kaplica"));''',
 "Pustelnia_Data RESIDENT")
s = patch(s, 'window.PustelniaData = { MAP, INNER, ITEM,', 'window.PustelniaData = { MAP, INNER, CHAPEL, CHAPEL_MAP, ITEM,', "Pustelnia_Data export")
write(rel, s)

# ------------------------------------------------------------------ Pustelnia.js: the condition, the bell at the chapel, the API
rel = "js/plugins/Pustelnia.js"; s = read(rel)
s = patch(s, '''        if (L && L.addCondition) { L.addCondition("pustelniaDeszcz", rain); L.addCondition("nocPytania", nightNow); }''',
'''        if (L && L.addCondition) { L.addCondition("pustelniaDeszcz", rain); L.addCondition("nocPytania", nightNow); L.addCondition("pustelniaZamknieta", chapel); }''', "Pustelnia conditions")
s = patch(s, '''    const heartHung = () => has() && flag("sercePustelni");''',
'''    // (2026-11-11) the hermitage out of the world: Kleofas lives by the chapel of Kruczogrod (Map008) - TownLife's alt home, see Pustelnia_Data
    const chapel = () => !(window.WyspaData && window.WyspaData.HERMITAGE_OPEN);
    const heartHung = () => has() && flag("sercePustelni");''', "Pustelnia chapel()")
s = patch(s, '''            if ($gameMap.mapId() === MAP || $gameMap.mapId() === INNER) { bellLeft = 7; bellNext = Graphics.frameCount + 20; }''',
'''            if ($gameMap.mapId() === MAP || $gameMap.mapId() === INNER || (chapel() && $gameMap.mapId() === D.CHAPEL_MAP)) { bellLeft = 7; bellNext = Graphics.frameCount + 20; }''', "Pustelnia bell")
s = patch(s, '''volume: $gameMap.mapId() === MAP ? BELL.volume : 55,''', '''volume: $gameMap.mapId() === MAP || $gameMap.mapId() === D.CHAPEL_MAP ? BELL.volume : 55,''', "Pustelnia bell volume")
s = patch(s, '''        kleofasHere, readBlock, built: () => built''', '''        kleofasHere, readBlock, chapel, built: () => built''', "Pustelnia api")
write(rel, s)

# ------------------------------------------------------------------ TownQuests.js: the Wigilia in the calendar
rel = "js/plugins/TownQuests.js"; s = read(rel)
s = patch(s, '''            if (T.time.isWigilia(d) && !T.time.isWigilia(d - 1)) out.push({ day: d, title: "Wigilia", text: S().flags.sercePustelni
                ? "Wspólna wieczerza. O północy dzwon w wieży skryptorium na klifie bije siedem razy - Noc Pytania u brata Kleofasa."
                : "Wspólna wieczerza. Mówią, że dawniej o północy bił siedem razy dzwon w wieży skryptorium na klifie." });''',
'''            // (2026-11-11) the hermitage out of the world: the bell of the chapel's tower in Kruczogrod
            const klif = !!(window.WyspaData && window.WyspaData.HERMITAGE_OPEN);
            if (T.time.isWigilia(d) && !T.time.isWigilia(d - 1)) out.push({ day: d, title: "Wigilia", text: S().flags.sercePustelni
                ? (klif ? "Wspólna wieczerza. O północy dzwon w wieży skryptorium na klifie bije siedem razy - Noc Pytania u brata Kleofasa."
                    : "Wspólna wieczerza. O północy dzwon w wieży kaplicy bije siedem razy - Noc Pytania u brata Kleofasa.")
                : (klif ? "Wspólna wieczerza. Mówią, że dawniej o północy bił siedem razy dzwon w wieży skryptorium na klifie."
                    : "Wspólna wieczerza. Mówią, że dawniej o północy bił siedem razy dzwon w wieży skryptorium na klifie. Teraz brat z klifu siedzi przy kaplicy.") });''', "TownQuests calendar")
write(rel, s)

# ------------------------------------------------------------------ the words: "kaplica.*" appended to the text files
def append(rel, block):
    s = read(rel)
    if not s.endswith("\n"): s += "\n"
    if "\nkaplica." in s or "[kaplica." in s: stop(rel + ": juz ma sekcje kaplica")
    write(rel, s + "\n" + block.strip("\n") + "\n")

HEAD = '''# ======================================================================== PRZY KAPLICY (pustelnia poza światem, 2026-11-11)
# Brat Kleofas zszedł z klifu i siedzi przy kaplicy w Kruczogrodzie (Map008), dopóki WyspaData.HERMITAGE_OPEN = false. Klucze „kaplica.<ścieżka>”
# mówią tę samą ścieżkę jeszcze raz i nadpisują ją TYLKO wtedy (Pustelnia_Data.js); gdy pustelnia wróci, czyta się tekst z góry pliku.
'''

append("js/teksty/pustelnia.txt", HEAD + '''# mieszkaniec przy kaplicy (talk / barks drugiego domu: RESIDENT.alt)
[mieszkaniec.alt.barks.stand]
(Kleofas mruczy psalm pod nosem. Fałszuje.)
Zszedłem z klifu na jakiś czas. Kaplica ciasna, ale nie wieje.
Morze jak krew... W kronikach trzy razy przez trzysta lat. A teraz co roku.
Chleb z miodem. Miód został na klifie. Pszczoły mnie tu nie znajdą. Tym lepiej dla nich.

[mieszkaniec.alt.barks.rain]
Deszcz! Pod okap, prędko - atrament mi rozmoczy!

[mieszkaniec.alt.barks.night]
Siedem uderzeń. Siedem. Pamiętaj.

[mieszkaniec.alt.talk.morning]
Godzinki odmówione, ławka na miejscu. Można pisać.
Wstaję o czwartej. Mój mistrz wstawał o trzeciej. Dlatego umarł przede mną.

[mieszkaniec.alt.talk.day]
Przepisuję kroniki, bo papier gnije, a pamięć jeszcze szybciej. Tu przynajmniej ktoś mi przeszkadza.
Miasto hałasuje. Ja wolę ciszę, ale ławka pod kaplicą to i tak więcej, niż mi trzeba.

[mieszkaniec.alt.talk.evening]
Słońce schodzi za mur. Kronikarze zapisywali każdy zachód, który był czerwony. Brakło im atramentu.
Wieczorem czyta się najgorzej, a myśli najlepiej.

[mieszkaniec.alt.talk.night]
Po nocy chodzą tylko złodzieje i głupcy. Którym jesteś?

[mieszkaniec.alt.talk.rain]
Deszcz! Cicho bądź i słuchaj, jak bębni o gonty. Najlepsza muzyka pod okapem.

# pierwsze spotkanie, notatka do dziennika
[kaplica.meet]
...Czego tu szukasz? Kaplica dla wszystkich otwarta, ale ławka jest moja.
> Nie wiedziałem, że ktoś tu siedzi. Skąd pan?
Z klifu nad przystanią. Zszedłem do miasta na jakiś czas. Klif poczeka, księgi też. (Kleofas patrzy na twoją szyję.) Pokaż to.
> Wisiorek? Matka dała mi go na drogę. Był jej ojca, dziadka Stacha.
Stacha... Hm. To by się zgadzało. To nie ozdoba, chłopcze. To znak posłańca. Kruki nie biorą się znikąd.
Jestem Kleofas. Przepisuję tu rzeczy, których nikt już nie czyta. Jak przyniesiesz atrament, może ci coś przeczytam.

[kaplica.meetNote]
Pustelnik przy kaplicy
Przy kaplicy w Kruczogrodzie siedzi brat Kleofas - ostatni kronikarz zakonu. Zszedł z klifu nad przystanią na jakiś czas. Na mój wisiorek powiedział: „To nie ozdoba. To znak posłańca.”

[kaplica.readWhere]
Nie tutaj. Szyfr czyta się przy pulpicie, a pulpit został w skryptorium na klifie. Karta poczeka.

kaplica.kod.nocPytaniaSub = Wigilia, dzień {dzien}, o północy - przy kaplicy

# co mówią o nim inni
[kaplica.uwagi.0.lines]
Spotkałeś brata pióra? Przy kaplicy? ...Mój mistrz mówił, że gdzieś tam siedzi ostatni kronikarz. Myślałem, że to bajka dla uczniów.

[kaplica.uwagi.1.lines]
Mnich przy kaplicy? Wiem, wiem. Podatku nie płaci, bo nie ma z czego. Zszedł z klifu, to i kłopotu nie robi.

[kaplica.uwagi.2.lines]
Słyszałem, że chodzisz do starego mnicha przy kaplicy. Gdyby miał jakieś księgi na sprzedaż... wiesz, gdzie mnie szukać, przyjacielu.
''')

append("js/teksty/w2.txt", HEAD + '''kaplica.zadania.W2.lines.stage1 = zanieś serce dzwonu bratu Kleofasowi, który przesiaduje przy kaplicy w Kruczogrodzie (za dnia).
kaplica.zadania.W2.lines.stage2 = Noc Pytania: w Wigilię (dzień {wigilia}) o północy dzwon w wieży kaplicy uderzy siedem razy. Bądź wtedy przy kaplicy - Kleofas odpowie na jedno pytanie.
kaplica.zadania.W2.lines.stage3 = pytanie zadane. Rozdział 8 „Alarm” czeka na Akt III. Następne pytanie u Kleofasa przy kaplicy: Wigilia roku {rok} (dzień {wigilia}).
[kaplica.zadania.W2.lines.heart]
Chłopcze. Chodź bliżej. (Ambroży wyjmuje z worka ciężki, czarny od starości kawał żelaza.) Serce dzwonu. Mój ród przechował je od upadku zakonu.
Nie z mojego dzwonu. Z dzwonu w wieży kaplicy - tam, gdzie przysiadł brat pióra. Pustelnik zszedł z klifu i siedzi pod nią na ławce.
Mój mistrz mówił: kiedy dzwon i pióro znów się spotkają, będzie można zapytać.
> Zapytać? O co?
O jedno. Raz w roku, w Wigilię, o północy. Siedem uderzeń - sygnał pytania. Zanieś mu to. Ja mam dzwonnicę, chłopcze, a ty nogi.

[kaplica.zadania.W2.lines.heartNote]
Serce dzwonu
Ambroży dał mi serce dzwonu, które jego ród przechował od upadku zakonu. Należy do dzwonu w wieży kaplicy, przy której siedzi brat Kleofas. „Kiedy dzwon i pióro znów się spotkają, będzie można zapytać.”

[kaplica.zadania.W2.lines.heartNoteKleofas]
Noc Pytania
Brat Kleofas zawiesi serce w dzwonie wieży kaplicy. W Wigilię o północy dzwon uderzy siedem razy - wtedy odpowie mi z kronik na jedno pytanie. Jedno na rok.

[kaplica.zadania.W2.lines.heartAway]
Serce dzwonu? Dla brata pióra, przy kaplicy. Ja mam dzwonnicę, chłopcze. Ty masz nogi.
''')

append("js/teksty/orzel.txt", HEAD + '''kaplica.zadania.W13.where = dom, Orla Grań, kaplica w Kruczogrodzie, dwór Lorda
kaplica.zadania.W13.steps.2.text = Zanieś pióro białego orła bratu Kleofasowi (siedzi przy kaplicy w Kruczogrodzie). Pióra zrzuca podrostek.

# orzelKleofas, mówi: pustelnik
[kaplica.uwagi.1.lines]
Jeździec Skrzydlatej Straży. W kronikach ostatni był trzysta lat temu. ...Tylko nie lataj nad kaplicą. Gołębie się denerwują, a ja z nimi.
''')

append("js/teksty/kasztelan.txt", HEAD + '''kaplica.where = Szukaj w zapiskach zakonu w podziemiach, w kronikach z Archiwum, u brata Kleofasa przy kaplicy (pokaż mu klucz) i u dziadka Stacha.
''')

append("js/teksty/latarnia.txt", HEAD + '''kaplica.zadania.W11.where = kantor Baltazara, przylądek z latarnią, kaplica w Kruczogrodzie
kaplica.kod.vars.5 = Weź soczewkę od Bazylego i zanieś ją bratu Kleofasowi (przy kaplicy w Kruczogrodzie). Niech przeczyta w kronikach, czym jest.
kaplica.kod.vars.6 = Zanieś soczewkę bratu Kleofasowi (przy kaplicy w Kruczogrodzie). Niech przeczyta w kronikach, czym jest.
[kaplica.bazyliDefended]
(Bazyli ociera krew z czoła.) Dobrze, że byłeś. Sam bym ich nie zatrzymał.
Weź szkło do pustelnika przy kaplicy w Kruczogrodzie. Kroniki znają je lepiej niż ja. I przynieś z powrotem.

[kaplica.bazyliGive]
Weź szkło do pustelnika przy kaplicy w Kruczogrodzie. Niech przeczyta w kronikach, czym jest. I przynieś z powrotem.

[kaplica.bazyliReads]
(Bazyli otwiera Księgę mgieł na pierwszej stronie, pisanej ręką kogoś bardzo starego.)
„Oko Strażnicy. Szlifowane z kryształu Pierwszych. We mgle odbija Serce jak przez łzy. Nie odpowiada - pokazuje.”
Tyle wiem od tego, co był przede mną. Pustelnik od kaplicy wiedziałby więcej, gdyby go ktoś zapytał.
''')

append("js/teksty/swiete_kosci.txt", HEAD + '''kaplica.zadania.W15.where = rynek, tawerna (pokój 12 na piętrze gości), kaplica, Podgrodzie, kantor, przystań
kaplica.zadania.W15.steps.1.text = Fałszywe kości? Poszlaki ({n} z 2): Ignac zna się na kościach (garbarnia), Tadek na srebrze (pokaż mu medalik Gaspara), brat Kleofas na zakonie (przy kaplicy), Melia na balladach (tawerna).
kaplica.kroki.komu.oba = Kamień z krukiem: komu? Bratu Kleofasowi (kaplica), Ambrożemu (dzwonnica), Baltazarowi (kantor, 80 G) albo celnikowi (przystań, 5 G). Spis z Lipnicy: bratu Augustynowi albo Kleofasowi.
kaplica.kroki.komu.kamien = Kamień z krukiem: komu? Bratu Kleofasowi (kaplica), Ambrożemu (dzwonnica), Baltazarowi (kantor, 80 G) albo celnikowi (przystań, 5 G).
kaplica.kroki.komu.spis = Spis z Lipnicy: bratu Augustynowi (pokój 8) albo bratu Kleofasowi (kaplica).
[kaplica.notatki.kamienKleofas]
Kamień u Kleofasa
Kamień z krukiem ze skrzynki Gaspara został u brata Kleofasa przy kaplicy. Mnich go nie sprzeda.
''')

append("js/teksty/zakon.txt", HEAD + '''kaplica.zadania.K68.where = kopce z krukiem i fundamenty strażnic → brat Kleofas przy kaplicy
kaplica.zadania.K68.steps.1.text = Daj bratu Kleofasowi przeczytać wszystkie Zapiski strażnic (przeczytane {r}/6; za dnia, przy kaplicy).
''')

append("js/teksty/podroznicy.txt", HEAD + '''kaplica.k72.kto.pustelnik = brat Kleofas (przy kaplicy)
''')
print("OK")
