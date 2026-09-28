# The catalogue of Winlu Fantasy Interior Remaster pieces useful for the tavern (tileset 8 "Wilu Fantasy Interior").
#   python catalog.py        -> tools/tavern/catalog.json + docs/tawerna_nowa/katalog.png (a contact sheet)
# Every entry: where it is (sheet, column, row on the 48 px grid), its size, the tile ids (what goes into the map data)
# and how it tiles / where it stands. Pictures (character sheets) are events: sheet + index + direction + pattern.
# Tile ids: B = 0.., C = 256.., D = 512.., E = 768.. (+128 for columns 8..15), A5 = 1536 + row*8 + col;
# autotiles: 2048 + kind*48 + shape (the shape is worked out from the neighbours; tavlib/nslib do it like the editor).
import os, json
from PIL import Image, ImageDraw, ImageFont
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..")).replace("\\", "/") + "/"
TS = ROOT + "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/tilesets/"
CH = ROOT + "img/tilesets/Winlu Fantasy Tileset - Interior/Remaster/characters/"
OWN = ROOT + "img/characters/"
SHEETS = {"A2": "Fantasy_Inside_A2", "A3": "Fantasy_Inside_A3", "A4": "Fantasy_Inside_A4", "A5": "Fantasy_Inside_A5",
          "B": "Fantasy_Inside_B", "C": "Fantasy_Inside_C", "D": "Fantasy_Inside_D", "E": "Fantasy_Inside_Shops",
          "C_white": "Fantasy_Inside_C_white", "E_Cathedral": "Fantasy_Inside_E_Cathedral"}
BASE = {"B": 0, "C": 256, "D": 512, "E": 768}

def tid(sheet, c, r):
    if sheet == "A5": return 1536 + r * 8 + c
    return BASE[sheet] + (128 if c >= 8 else 0) + r * 8 + (c % 8)

def T(name, cat, sheet, c, r, w=1, h=1, how="", used="", layer=2):
    """a block of plain tiles"""
    ids = [[tid(sheet, c + dx, r + dy) for dx in range(w)] for dy in range(h)]
    return {"nazwa": name, "kategoria": cat, "typ": "kafelki", "arkusz": sheet, "plik": SHEETS[sheet] + ".png",
            "kolumna": c, "wiersz": r, "szer": w, "wys": h, "tileId": ids, "warstwa": layer, "jak": how, "uzyte": used}

def AUTO(name, cat, sheet, kind, how="", used=""):
    return {"nazwa": name, "kategoria": cat, "typ": "autokafel", "arkusz": sheet, "plik": SHEETS[sheet] + ".png",
            "rodzaj": kind, "tileId_bazowy": 2048 + kind * 48, "warstwa": 0 if sheet != "A2" or kind < 20 or kind == 24 or kind == 25 or kind == 33 else 1,
            "jak": how, "uzyte": used}

def P(name, cat, sheet, index, direction=2, pattern=0, how="", used="", own=False):
    return {"nazwa": name, "kategoria": cat, "typ": "obrazek (zdarzenie)", "arkusz": sheet, "indeks": index, "kierunek": direction,
            "wzor": pattern, "w_grze": own, "jak": how, "uzyte": used}

ALL = "A B C P"
E = []
# ---------------------------------------------------------------- walls, floors, borders
E += [AUTO("Kamień z ryglem (szary mur, belki)", "Ściany", "A3", 50, "ściana A3, 3 rzędy wysokości; autokafel ściany (łączy się w poziomie)", "A: sala"),
      AUTO("Tynk jasny z ryglem", "Ściany", "A3", 51, "jak wyżej; kuchnie", "A B: kuchnia, P: bielizna"),
      AUTO("Tynk kremowy z boazerią", "Ściany", "A3", 52, "jak wyżej; jasna, elegancka sala", "B: sala"),
      AUTO("Boazeria drewniana (panele)", "Ściany", "A3", 54, "jak wyżej", "P: korytarz"),
      AUTO("Tapeta beżowa z czerwonym cokołem", "Ściany", "A3", 56, "jak wyżej", "P: pokoje"),
      AUTO("Bale (ściana z bali)", "Ściany", "A3", 59, "jak wyżej; karczma z bali", "C, P: pokój 3"),
      AUTO("Tapeta niebieska (adamaszek)", "Ściany", "A3", 62, "jak wyżej", "P"),
      AUTO("Tapeta ciemna (adamaszek)", "Ściany", "A3", 63, "jak wyżej; komnata", "P: komnata"),
      AUTO("Surowy kamień (stary mur twierdzy)", "Ściany", "A3", 71, "jak wyżej; skład ze starych kamieni, ściana kominka", "A B C"),
      AUTO("Deski jasne", "Podłogi", "A4", 81, "podłoga A4 (górna część autokafla), warstwa 0", "A: sala, P"),
      AUTO("Deski ciemne", "Podłogi", "A4", 83, "jw.", "P: pokój 3"),
      AUTO("Deski rudobrązowe", "Podłogi", "A4", 84, "jw.", "B: sala, C: izba szynkowa, P: korytarz"),
      AUTO("Deski pionowe (scena)", "Podłogi", "A4", 82, "jw.; podest sceny", "A B C: scena"),
      AUTO("Parkiet w jodełkę", "Podłogi", "A4", 80, "jw.", "C: izba kominkowa, P: komnata"),
      AUTO("Bruk szary (kocie łby)", "Podłogi", "A4", 96, "jw.; skład, piwnica", "A B C: skład"),
      AUTO("Płyty kamienne zielonoszare", "Podłogi", "A4", 97, "jw.; kuchnia", "A B C: kuchnia"),
      AUTO("Obramowanie ciemne drewno", "Obramowania", "A2", 25, "A2 na warstwie 0 wokół pomieszczeń; w tilesecie 8 nieprzechodnie", "A, P"),
      AUTO("Obramowanie ciemne drewno 2", "Obramowania", "A2", 24, "jw.; nieprzechodnie", "B"),
      AUTO("Obramowanie z końców bali", "Obramowania", "A2", 33, "jw.; UWAGA: w tilesecie 8 przechodnie - zamknięte blokadami", "C"),
      AUTO("Chodnik czerwony", "Dywany", "A2", 36, "A2 na warstwie 1 (na podłodze), dowolny prostokąt", "A B: chodnik od drzwi, P: korytarz"),
      AUTO("Wycieraczka beżowa", "Dywany", "A2", 37, "jw.", "sień, drzwi pokoi"),
      AUTO("Dywan ozdobny czerwono-złoty", "Dywany", "A2", 38, "jw.", "A C: scena"),
      AUTO("Dywan ciemnobrązowy", "Dywany", "A2", 21, "jw.", "A: kącik do kości"),
      AUTO("Dywan fioletowy ze złotem", "Dywany", "A2", 22, "jw.", "P: komnata"),
      AUTO("Dywan niebieski / zielony / pomarańczowy", "Dywany", "A2", 28, "jw. (także rodzaje 29, 30)", ""),
      AUTO("Kurz / cień na podłodze", "Dywany", "A2", 23, "półprzezroczysty, na warstwie 1", "")]
E += [T("Dywan okrągły czerwony", "Dywany", "B", 14, 12, 2, 2, "2x2 na warstwie 2", "P"),
      T("Dywan okrągły brązowy / ozdobny", "Dywany", "B", 12, 14, 4, 2, "dwa dywany 2x2", ""),
      T("Skóra niedźwiedzia", "Dywany", "D", 11, 13, 2, 3, "2x3 przed kominkiem", "A B C")]
# ---------------------------------------------------------------- the bar
E += [T("Lada pozioma (lewy koniec, środek, prawy koniec)", "Bar", "E", 0, 0, 3, 2, "blat w rzędzie y, front w y+1; środek (1,0..1) powtarzany w poziomie", ALL),
      T("Lada - ramię pionowe (lewe)", "Bar", "E", 3, 0, 1, 4, "(3,0) góra, (3,1) powtarzany środek, (3,2) koniec, (3,3) front; ramię L", "A C"),
      T("Lada - łącznik narożny", "Bar", "E", 4, 0, 1, 2, "narożnik L od strony prawej", ""),
      T("Lada - ramię pionowe (prawe)", "Bar", "E", 5, 0, 1, 4, "jak lewe, cień po drugiej stronie", "B"),
      T("Stojak z 4 beczkami z kranami", "Bar", "E", 0, 7, 4, 2, "4x2, stoi na rzędzie y+1 przy ścianie", "A B C"),
      T("Beczki z kranem / ze skrzynką butelek / z workami / z dzbanami", "Bar", "E", 4, 7, 4, 2, "cztery warianty 1x2", "A B C"),
      T("Półka: butelki, kufle, talerze", "Bar", "E", 6, 3, 2, 3, "2x3 przy ścianie; dół (rząd 5) stoi na podłodze", "A B C"),
      T("Półka z winem i szufladami", "Bar", "E", 1, 13, 2, 3, "2x3 przy ścianie", "A C"),
      T("Okrągłe stoliki z jedzeniem i piwem (16 wariantów)", "Bar", "E", 0, 9, 8, 4, "każdy 1x2: blat na y, nogi na y+1 (blokuj y+1)", ALL),
      T("Stolik okrągły duży", "Bar", "E", 0, 13, 1, 2, "1x2", ""),
      T("Tablica z desek (2 warianty)", "Bar", "E", 8, 8, 5, 2, "1x2; z karteczkami D(13..14,9) na warstwie 3 = tablica ogłoszeń", "sień"),
      T("Regał sklepowy ze skrzynkami", "Bar", "E", 9, 14, 6, 2, "3x2 i 3x2", "B: skład"),
      T("Stojaki na broń", "Bar", "E", 8, 5, 8, 3, "półki z mieczami, sztyletami", "")]
# ---------------------------------------------------------------- tables and seats
E += [T("Stół długi (poziomy)", "Stoły i siedziska", "C", 9, 4, 3, 2, "lewy (9), środek (10) powtarzany, prawy (11); 2 rzędy", "A B"),
      T("Stół długi na kozłach", "Stoły i siedziska", "C", 9, 6, 3, 2, "jw.", "A C"),
      T("Stół długi pionowy", "Stoły i siedziska", "C", 8, 4, 1, 3, "góra (8,4), środek (8,5) powtarzany, dół (8,6)", "B C"),
      T("Stół kwadratowy 2x2", "Stoły i siedziska", "C", 12, 4, 2, 2, "także na kozłach (12,6)", "A: kuchnia"),
      T("Ława pozioma 2-kafelkowa", "Stoły i siedziska", "C", 14, 1, 2, 1, "przy stołach, rząd nad i pod", "A B C"),
      T("Ława pionowa", "Stoły i siedziska", "C", 14, 2, 1, 3, "góra, środek powtarzany, dół", "B C"),
      T("Krzesła (przód, tył, bok L/P)", "Stoły i siedziska", "C", 8, 0, 6, 2, "oparcie w rzędzie nad krzesłem (warstwa 3)", ALL),
      T("Fotele z czerwonym siedziskiem", "Stoły i siedziska", "C", 8, 2, 6, 2, "jw.", "A B C, P: komnata"),
      T("Stołki i ławy", "Stoły i siedziska", "C", 14, 0, 2, 4, "(14,0) stołek duży, (15,3) mały", ALL),
      T("Stolik okrągły / biurko / stolik nocny", "Stoły i siedziska", "C", 4, 0, 3, 2, "1x2; blat na y (przy ścianie), front na y+1", "P"),
      T("Ława tapicerowana, krzesła z wysokim oparciem", "Stoły i siedziska", "C", 0, 14, 4, 2, "", "")]
# ---------------------------------------------------------------- fireplaces and fire
E += [T("Palenisko w ścianie (łuk)", "Kominki i ogień", "A5", 4, 11, 2, 3, "2x3 na warstwie 0 w ścianie", "A B C: piec chlebowy"),
      T("Palenisko z kratą", "Kominki i ogień", "A5", 2, 11, 2, 3, "2x3 na warstwie 0", ""),
      T("Kamienne pilastry kominka", "Kominki i ogień", "A5", 0, 12, 2, 2, "boki dużego kominka (lewy 0, prawy 1)", "A B C"),
      T("Łuk kominka (środek)", "Kominki i ogień", "A5", 4, 12, 2, 2, "duży kominek: pilastry + łuk + półka D(6..7,2..3)", "A B C"),
      P("Ognisko / kocioł nad ogniem (animowane)", "Kominki i ogień", "!Decoration", 2, 4, 0, "kierunek 4 ognisko, 6 kocioł na trójnogu; step anime", "A B C", own=True),
      P("Kominek kamienny z ogniem", "Kominki i ogień", "!$Fireplace2", 0, 4, 0, "animowany (step anime)", ""),
      P("Kominek z łukiem", "Kominki i ogień", "!$Fireplace1", 0, 4, 0, "animowany", "P: komnata"),
      P("Kominek ozdobny", "Kominki i ogień", "!$Fireplace4", 0, 4, 0, "animowany", ""),
      P("Piec kuchenny z garnkiem", "Kominki i ogień", "!$Fireplace_kitchen", 0, 4, 0, "animowany; już w img/characters", ALL, own=True),
      P("Okap kamienny (komin)", "Kominki i ogień", "!$chimney", 0, 6, 0, "nad piecem; wiersz 3 z zawieszonym czosnkiem/garnkami", ALL),
      P("Drewno na opał", "Kominki i ogień", "!Decoration_static", 3, 8, 2, "stos polan przy kominku (3 polana do minigry)", ALL)]
# ---------------------------------------------------------------- kitchen and stores
E += [T("Spiżarka: chleb, sery, warzywa", "Kuchnia i zapasy", "C", 4, 4, 4, 5, "półki 1x3 i 2x2 przy ścianie", "A B C"),
      T("Garnki i patelnie na ścianie", "Kuchnia i zapasy", "D", 0, 6, 3, 2, "1x2 na ścianie", "A B C"),
      T("Deski do krojenia (mięso, ryba, tasak)", "Kuchnia i zapasy", "D", 0, 8, 2, 2, "na stół (warstwa 3)", "A B C"),
      T("Beczki (stos 3, pojedyncze, z wodą, z jabłkami)", "Kuchnia i zapasy", "D", 8, 0, 8, 3, "stos 3x2 = D(10..12,0..1); pojedyncze 1x2", ALL),
      T("Worki", "Kuchnia i zapasy", "D", 8, 2, 3, 3, "2x2 i 1x1", ALL),
      T("Skrzynie, połamane skrzynie", "Kuchnia i zapasy", "D", 11, 3, 5, 4, "1x2 i 2x2", ALL),
      T("Pajęczyny", "Kuchnia i zapasy", "D", 13, 7, 3, 2, "w rogach ścian (warstwa 3)", "skład"),
      T("Gruz i kamienie", "Kuchnia i zapasy", "D", 11, 5, 2, 2, "pod luźną cegłą", "skład"),
      P("Wiszące szynki, ryby, zioła, czosnek", "Kuchnia i zapasy", "!Decoration_static", 2, 8, 0, "znak 2 wzory 0..2, znak 3 wzory 0..1 (kierunek 8)", ALL)]
# ---------------------------------------------------------------- light
E += [P("Żyrandol z świecami", "Światło", "!$Chandelier", 0, 4, 0, "nad stołem, priorytet nad postaciami, animowany", "A B C"),
      P("Kinkiet ze świecą", "Światło", "!Decoration2", 0, 2, 0, "na ścianie", "A B C"),
      P("Świece (1 / 3)", "Światło", "!Decoration2", 1, 6, 0, "kierunek 2 jedna, 6 trzy; na stołach i szafkach", ALL),
      P("Kandelabr stojący", "Światło", "!Decoration2", 4, 6, 0, "kierunek 2/4 czarny, 6/8 brązowy", ALL),
      P("Latarnie ścienne", "Światło", "!Decoration", 7, 2, 0, "kierunki 2/4/6 = 3 style; zdarzenie o 1 kratkę niżej niż latarnia", ALL, own=True),
      T("Okna nocne / oświetlone / łukowe", "Światło", "B", 0, 2, 8, 4, "1x2 na ścianie (rzędy 1-2 ściany)", ALL),
      T("Zasłony (czerwone, pomarańczowe, zielone...)", "Światło", "B", 0, 12, 6, 4, "1x2 na oknie (warstwa 3); rząd 14-15 długie", ALL)]
# ---------------------------------------------------------------- walls: decorations
E += [P("Głowa jelenia", "Dekoracje ścian", "!$Wall_decoration", 0, 2, 0, "zdarzenie 1 kratkę niżej niż głowa", "A B"),
      P("Tarcza z toporami", "Dekoracje ścian", "!$Wall_decoration", 0, 4, 0, "jw.", "A, P"),
      P("Chorągwie (koń, feniks, wilk, pięść...)", "Dekoracje ścian", "!Flags_banner_Inside", 0, 2, 0, "48x96; na ścianie", "A B C"),
      P("Obrazy i portrety", "Dekoracje ścian", "!Decoration_static", 6, 6, 2, "znaki 6/7, kierunki 4/6/8", "P"),
      P("Szyld tawerny z kuflem", "Dekoracje ścian", "!Signs", 2, 2, 1, "RTP/zewnętrzny zestaw, już w img/characters", "A B C", own=True),
      P("Zegar stojący", "Dekoracje ścian", "!clock", 0, 2, 0, "animowany wahadłem", "A C"),
      T("Półeczki ścienne (butelki, książki, talerze, dzbany)", "Dekoracje ścian", "D", 6, 0, 2, 6, "1x2: rzecz na y, półka na y+1", "A: półka nad kominkiem"),
      T("Regał z książkami", "Dekoracje ścian", "C", 0, 6, 5, 3, "1x3 i 2x3", "C")]
# ---------------------------------------------------------------- stairs
E += [T("Schody drewniane", "Schody", "A5", 0, 2, 4, 1, "stopień powtarzany w pionie (warstwa 0)", ALL),
      T("Schody kamienne", "Schody", "A5", 0, 3, 4, 2, "ciemne i jasne", ""),
      T("Schody w murze (drewniane / kamienne)", "Schody", "A5", 4, 0, 4, 4, "4x2: mur, 2 stopnie, mur", ""),
      T("Klapa w podłodze", "Schody", "A5", 1, 0, 1, 1, "zejście do piwnicy (drugi wariant sekretu)", ""),
      T("Czarna pustka", "Schody", "A5", 0, 0, 1, 1, "nad/pod schodami", ALL),
      T("Poręcze i słupy", "Schody", "B", 12, 0, 4, 8, "ramka balustrady (12..14, 4..7), słupy (12..13, 0..3)", "P: klatka schodowa")]
# ---------------------------------------------------------------- bedrooms
E += [T("Łóżka pojedyncze (zielone, patchwork)", "Pokoje gości", "C", 12, 10, 4, 3, "1x3 i 2x3; zagłówek na dolnym rzędzie ściany", "P"),
      T("Łóżka poziome", "Pokoje gości", "C", 8, 11, 4, 2, "2x2", ""),
      T("Łoże królewskie, łóżka czerwone, siennik", "Pokoje gości", "C", 9, 13, 7, 3, "1x3 / 2x3", "P"),
      T("Szafy i komody", "Pokoje gości", "C", 2, 9, 6, 4, "1x2 .. 2x3", "P"),
      T("Toaletka z lustrem", "Pokoje gości", "C", 8, 14, 1, 2, "", "P: komnata"),
      T("Parawany", "Pokoje gości", "C", 4, 13, 4, 3, "", ""),
      P("Kufry i skrzynie", "Pokoje gości", "!Fantasy_chest", 6, 2, 0, "znak 0 okuty, 1 złoty, 3 ozdobny, 6 prosty drewniany", "P")]
# ---------------------------------------------------------------- doors
E += [P("Drzwi drewniane (ciemne, jasne, łukowe okute)", "Drzwi", "!Fantasy_door1", 0, 2, 0, "48x96; kierunek 2 zamknięte .. 8 otwarte; już w img/characters", "P", own=True),
      P("Dziura w murze (po odsunięciu cegły)", "Drzwi", "!Fantasy_door1", 7, 6, 0, "strona 2 zdarzenia Luźna cegła - otwarte przejście", "propozycja"),
      P("Kamienny łuk / ciemne przejście", "Drzwi", "!Fantasy_door1", 7, 4, 1, "", "")]
# ---------------------------------------------------------------- small things
E += [T("Drobiazgi na stoły: talerze, kufle, butelki, kielichy, monety, księgi, zwoje", "Drobiazgi", "D", 0, 8, 8, 8, "na warstwie 3 na blatach; monety D(3..6,15) na stole do kości", ALL),
      T("Jedzenie na talerzach, ciasta", "Drobiazgi", "D", 0, 13, 4, 3, "jw.", ALL)]
# ---------------------------------------------------------------- not in the pack
MISSING = [
    ("Kości do gry i kubek", "brak w Winlu - na stole leżą monety i kufle; do domalowania 1 kafelek (kubek + kości)"),
    ("Wieszak / kołki na płaszcze", "brak - zastępczo wiszące płótna B(1,14..15) i B(5,14..15)"),
    ("Tablica kredowa z kreskami", "brak - zastępczo tablica na słupkach z !Tavern_Yard (znak 2)"),
    ("Lutnia / stojak na lutnię", "brak - zastępczo krzesło barda na scenie"),
    ("Tarcza do rzutek, kufle na haku", "brak (niekonieczne)"),
]

def frame_of(sheet_img, name, index, direction, pattern):
    big = name.startswith("!$") or name.startswith("$")
    W, H = sheet_img.size
    if big:
        fw, fh = W // 3, H // 4
        col, row = pattern, direction // 2 - 1
    else:
        fw, fh = W // 12, H // 8
        col, row = (index % 4) * 3 + pattern, (index // 4) * 4 + direction // 2 - 1
    return sheet_img.crop((col * fw, row * fh, (col + 1) * fw, (row + 1) * fh))

def autotile_block(img, sheet, kind):
    if sheet == "A2":
        i = kind - 16; x, y, w, h = (i % 8) * 96, (i // 8) * 144, 96, 144
    elif sheet == "A3":
        i = kind - 48; x, y, w, h = (i % 8) * 96, (i // 8) * 96, 96, 96
    else:
        i = kind - 80; r = i // 8
        x, w = (i % 8) * 96, 96
        y, h = ((r // 2) * 240, 144) if r % 2 == 0 else ((r // 2) * 240 + 144, 96)
    return img.crop((x, y, x + w, y + h))

def sheet_img(sheet):
    return Image.open(TS + SHEETS[sheet] + ".png").convert("RGBA")

def char_img(name):
    p = CH + name + ".png"
    if not os.path.exists(p): p = OWN + name + ".png"
    return Image.open(p).convert("RGBA")

def piece_image(e):
    if e["typ"] == "kafelki":
        im = sheet_img(e["arkusz"])
        return im.crop((e["kolumna"] * 48, e["wiersz"] * 48, (e["kolumna"] + e["szer"]) * 48, (e["wiersz"] + e["wys"]) * 48))
    if e["typ"] == "autokafel":
        return autotile_block(sheet_img(e["arkusz"]), e["arkusz"], e["rodzaj"])
    return frame_of(char_img(e["arkusz"]), e["arkusz"], e["indeks"], e["kierunek"], e["wzor"])

def contact_sheet(entries, out):
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 13)
    small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 11)
    head = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 22)
    title = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 30)
    W = 1800
    cats = []
    for e in entries:
        if e["kategoria"] not in cats: cats.append(e["kategoria"])
    # lay out: per category a heading and cards flowing left to right
    MAXW, MAXH = 300, 200
    placed, y = [], 70
    for cat in cats:
        placed.append(("head", cat, 20, y)); y += 36
        x, rowh = 20, 0
        for e in [e for e in entries if e["kategoria"] == cat]:
            im = piece_image(e)
            s = min(1.0, MAXW / im.size[0], MAXH / im.size[1])
            if s < 1: im = im.resize((max(1, int(im.size[0] * s)), max(1, int(im.size[1] * s))), Image.NEAREST)
            cw = max(im.size[0], 200) + 16
            ch = im.size[1] + 74
            if x + cw > W - 20:
                x = 20; y += rowh + 12; rowh = 0
            placed.append(("card", e, im, x, y, cw, ch))
            x += cw + 12; rowh = max(rowh, ch)
        y += rowh + 24
    y += 30 + 22 * (len(MISSING) + 1)
    sheet = Image.new("RGB", (W, y + 20), (22, 20, 24))
    d = ImageDraw.Draw(sheet)
    d.text((20, 18), "Katalog kafelków Winlu Fantasy Interior (Remaster) - tawerna", fill=(255, 214, 90), font=title)
    for it in placed:
        if it[0] == "head":
            d.text((it[2], it[3]), it[1], fill=(255, 214, 90), font=head)
            continue
        _, e, im, x, y0, cw, ch = it
        d.rectangle([x, y0, x + cw, y0 + ch], fill=(40, 36, 42), outline=(90, 80, 70))
        # checker under transparent pieces
        bg = Image.new("RGBA", im.size, (0, 0, 0, 0))
        cb = ImageDraw.Draw(bg)
        for yy in range(0, im.size[1], 8):
            for xx in range(0, im.size[0], 8):
                cb.rectangle([xx, yy, xx + 7, yy + 7], fill=(70, 66, 72, 255) if (xx // 8 + yy // 8) % 2 else (58, 54, 60, 255))
        bg.alpha_composite(im)
        sheet.paste(bg.convert("RGB"), (x + 8, y0 + 8))
        words, lines, cur = e["nazwa"].split(), [], ""
        for w_ in words:
            if len(cur) + len(w_) + 1 > max(26, (cw - 16) // 7): lines.append(cur); cur = w_
            else: cur = (cur + " " + w_).strip()
        lines.append(cur)
        for li, ln in enumerate(lines[:2]):
            d.text((x + 8, y0 + im.size[1] + 10 + li * 16), ln, fill=(240, 236, 228), font=font)
        if e["typ"] == "kafelki":
            ref = "%s (%d,%d) %dx%d  id %d" % (e["arkusz"], e["kolumna"], e["wiersz"], e["szer"], e["wys"], e["tileId"][0][0])
        elif e["typ"] == "autokafel":
            ref = "%s rodzaj %d  id %d+" % (e["arkusz"], e["rodzaj"], e["tileId_bazowy"])
        else:
            ref = "%s znak %d kier. %d wzór %d" % (e["arkusz"], e["indeks"], e["kierunek"], e["wzor"])
        d.text((x + 8, y0 + im.size[1] + 46), ref, fill=(170, 200, 230), font=small)
    yy = y - 22 * (len(MISSING) + 1) - 10
    d.text((20, yy), "Brakuje w zestawie Winlu (zastępstwa w koncepcjach):", fill=(255, 140, 110), font=head)
    for i, (n, why) in enumerate(MISSING):
        d.text((30, yy + 32 + i * 22), "- %s: %s" % (n, why), fill=(230, 220, 210), font=font)
    sheet.save(out)
    return sheet.size

if __name__ == "__main__":
    data = {"zestaw": "Winlu Fantasy Tileset - Interior (Remaster)", "tileset": "8 (Wilu Fantasy Interior): A2, A3, A4, A5, B, C, D, E = Fantasy_Inside_Shops",
            "uwaga": "C_white i E_Cathedral nie są w tilesecie 8 (żeby ich użyć, trzeba nowego tilesetu). Obrazki ze znakiem ! z folderu Winlu/characters "
                     "trzeba przy budowie skopiować do img/characters (w_grze=false: jeszcze ich tam nie ma).",
            "identyfikatory": "B = 0+, C = 256+, D = 512+, E = 768+ (kolumny 8..15: +128), A5 = 1536 + wiersz*8 + kolumna, autokafle 2048 + rodzaj*48 + kształt",
            "elementy": E, "brakuje": [{"nazwa": n, "uwaga": w} for n, w in MISSING]}
    with open(os.path.join(HERE, "catalog.json"), "wb") as f:
        f.write(json.dumps(data, ensure_ascii=False, indent=1).encode("utf-8"))
    size = contact_sheet(E, os.path.join(ROOT, "docs", "tawerna_nowa", "katalog.png"))
    print("catalog.json:", len(E), "entries; katalog.png", size)
