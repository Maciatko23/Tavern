# The hero's talk-bust layers (2026-11-17): every wearable shape family was made in PixelLab as ONE edit of the hero base
# (tools/popiersie_pl/hero_baza.png, edit_image_pro_flash "Keep exactly the same boy ... Only add <piece>"), the raw edits are in
# tools/popiersie_pl/surowe/<family>.png. This script cuts each edit into a layer:
#   warstwy/<family>.png        RGBA: the pixels that differ from the base inside the piece's region (+ the small holes inside it)
#   warstwy/<family>_ukryj.png  (only when needed) white = base pixels to erase before the layer is drawn: the base pixels the edit
#                               turned into background (hair sticking out past a helmet, a shirt wider than a coat) and, for head
#                               pieces, the base hair pixels the piece covers
#   warstwy.json                family -> file, mask, slot, draw order, native material, hides hair, items
#   baza.png                    the base with its light bottom strip cut away (rows 126-127 = row 125) - draw the layers on it
# Run: python tools/popiersie_pl/tnij.py [family ...]      (no names: all families in RODZINY)
# Composition (zestaw.py): baza -> erase every worn piece's ukryj -> draw the layers in "kolejnosc" order (low first).
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'surowe')
OUT = os.path.join(HERE, 'warstwy')
BASE = os.path.join(HERE, 'hero_baza.png')

# the draw order of the slots (low first): the torso garment, the neck, the straps, the cloak, the head
ORDER = {'tors': 10, 'szyja': 20, 'plecy': 30, 'dodatek': 35, 'plaszcz': 40, 'glowa': 50}
# family: (slot, native material, face: none (the face is kept) / frame (it frames the face: eyes, nose, mouth kept) / full
#          (it covers the face: nasal bar, closed helmet), items (ids) of that shape, the raw file if not <family>.png,
#          words for the description)
RODZINY = {
    # ---- head
    'kapelusz_slomkowy': ('glowa', 'słoma', 'none', [250, 251], None, 'słomkowy kapelusz z szerokim rondem'),
    'kapelusz_filcowy': ('glowa', 'filc', 'none', [290], None, 'filcowy kapelusz z miękkim rondem i taśmą'),
    'chusta': ('glowa', 'len', 'none', [252, 253, 254], None, 'lniana chusta zawiązana z tyłu głowy'),
    'czapka_filcowa': ('glowa', 'filc', 'none', [255, 256, 257], None, 'filcowa czapka z wywiniętym brzegiem'),
    'opaska': ('glowa', 'skóra', 'none', [258, 259], None, 'skórzana opaska na czole'),
    'kaptur_sukienny': ('glowa', 'sukno (wełna)', 'frame', [343, 419], None, 'kaptur z sukna z pelerynką na ramiona'),
    'kaptur_skorzany': ('glowa', 'skóra', 'frame', [340], None, 'skórzany kaptur ze szwami'),
    'kaptur_futrzany': ('glowa', 'skóra i futro', 'frame', [341], None, 'skórzany kaptur z futrzanym obszyciem'),
    'czepiec_pikowany': ('glowa', 'len (pikowany)', 'frame', [342], None, 'pikowany lniany czepiec wiązany pod brodą'),
    'czepiec_kolczy': ('glowa', 'żelazo (kolczuga)', 'frame', [345, 423, 426], None, 'kolczy kaptur na głowę, szyję i ramiona'),
    'kapalin': ('glowa', 'żelazo', 'none', [344, 422, 424], None, 'kapalin: kopulasty dzwon z szerokim rondem'),
    'helm_otwarty': ('glowa', 'skóra gotowana', 'none', [420], None, 'otwarty hełm z segmentów skóry'),
    'helm_nosal': ('glowa', 'żelazo', 'full', [346, 421], 'pilot_zelazo', 'stożkowy hełm z nosalem (pilot z 2026-11-17)'),
    'szyszak': ('glowa', 'stal', 'full', [347], None, 'szyszak: nosal, policzki i nakarczek'),
    'helm_zamkniety': ('glowa', 'stal', 'full', [348, 400, 425], None, 'zamknięty hełm garnczkowy (zakonny, garnczkowy)'),
    # ---- torso: clothes
    'koszula_lniana': ('tors', 'len', 'none', [260, 261, 262, 287], None, 'czysta lniana koszula ze sznurowanym dekoltem'),
    'koszula_odswietna': ('tors', 'len z haftem', 'none', [267], None, 'odświętna koszula z czerwonym haftem'),
    'kaftan': ('tors', 'wełna', 'none', [263, 264, 265], None, 'wełniany kaftan ze stójką i pętlicami'),
    'kurta': ('tors', 'skóra', 'none', [266, 171], None, 'skórzana kurta z wykładanym kołnierzem'),
    'kozuszek': ('tors', 'skóra i wełna', 'none', [284], None, 'kożuszek: kamizelka z owczej skóry'),
    'zupan': ('tors', 'sukno', 'none', [286], None, 'sukienny żupan ze stójką i guzikami'),
    'fartuch_kowalski': ('tors', 'skóra', 'none', [285], None, 'skórzany fartuch kowalski na koszuli'),
    # ---- torso: armour
    'przeszywanica': ('tors', 'len (pikowany)', 'none', [349, 356, 427], None, 'pikowana przeszywanica'),
    'skorznia': ('tors', 'skóra', 'none', [350], None, 'skórznia z naramiennikami'),
    'skorznia_cwiekowana': ('tors', 'czarna skóra i żelazo', 'none', [351], None, 'ćwiekowana skórznia'),
    'skorznia_futrzana': ('tors', 'skóra i futro', 'none', [428], None, 'skórznia podbita futrem niedźwiedzia'),
    'kolczuga': ('tors', 'żelazo (kolczuga)', 'none', [353, 357, 405, 433], 'pilot_zelazo', 'kolczuga ze skórzanym kołnierzem (pilot)'),
    'luska': ('tors', 'żelazo', 'none', [352, 354, 431, 434], None, 'łuska na skórzanym kaftanie'),
    'brygantyna': ('tors', 'sukno i stal', 'none', [355, 432], None, 'brygantyna: sukno nabite nitami'),
    'napiersnik': ('tors', 'stal', 'none', [358, 359, 429, 430], None, 'stalowy napierśnik z naramiennikami'),
    # ---- cloaks, neck, straps, accessories
    'plaszcz': ('plaszcz', 'wełna', 'none', [112, 294, 296], None, 'wełniany płaszcz z zapinką, kaptur opuszczony'),
    'peleryna': ('plaszcz', 'len', 'none', [293], None, 'lniana peleryna wiązana pod szyją'),
    'plaszcz_futrzany': ('plaszcz', 'futro', 'none', [295], None, 'płaszcz z niedźwiedziego futra na ramionach'),
    'szal': ('szyja', 'wełna', 'none', [], None, 'dziany wełniany szal'),
    'torba': ('plecy', 'skóra', 'none', [282, 283], None, 'pas torby przez pierś'),
    'plecak': ('plecy', 'skóra', 'none', [114, 292], None, 'szelki plecaka na ramionach'),
    'amulet': ('dodatek', 'rzemień', 'none', [381, 382, 473, 476], None, 'amulet na rzemieniu'),
    'kosz_wiklinowy': ('plecy', 'wiklina i lina', 'none', [292], None, 'sznurowe szelki kosza i jego brzeg nad ramieniem'),
}
# the look keys (Ubior_Data WZORY / WZORY_ZBROI "wzor" names) each layer serves; a colour or material other than the layer's own =
# recolour by that key's ramp. Two keys are shared by two shapes - the ITEM decides (see "uwaga"):
#   zbroja_przeszywanica_welna: 427 Sukienna przeszywanica -> przeszywanica, 355 Brygantyna and 432 Stalowa brygantyna -> brygantyna
#   zbroja_skorznia_skora: 350 Skórznia -> skorznia, 428 Futrzana skórznia -> skorznia_futrzana
WZORY = {
    'kapelusz_slomkowy': ['kapelusz_slomkowy', 'kapelusz_slomkowy_ciemny'],
    'kapelusz_filcowy': ['kapelusz_filcowy'],
    'chusta': ['chusta_biala', 'chusta_czerwona', 'chusta_niebieska'],
    'czapka_filcowa': ['czapka_filc_braz', 'czapka_filc_szara', 'czapka_filc_zielona'],
    'opaska': ['opaska_braz', 'opaska_czarna'],
    'kaptur_sukienny': ['helm_kaptur_welna', 'helm_kaptur_len'],
    'kaptur_skorzany': ['helm_kaptur_skora'],
    'kaptur_futrzany': ['helm_kaptur_skora_czarna'],
    'czepiec_pikowany': ['helm_czepiec_len', 'helm_czepiec_skora'],
    'czepiec_kolczy': ['helm_czepiec_zelazo', 'helm_czepiec_stal', 'helm_czepiec_zakon'],
    'kapalin': ['helm_kapalin_zelazo', 'helm_kapalin_stal', 'helm_kapalin_braz', 'helm_kapalin_zakon'],
    'helm_otwarty': ['helm_otwarty_skora', 'helm_otwarty_braz', 'helm_otwarty_zelazo', 'helm_otwarty_stal'],
    'helm_nosal': ['helm_nosal_zelazo', 'helm_nosal_braz', 'helm_nosal_zakon'],
    'szyszak': ['helm_nosal_stal'],
    'helm_zamkniety': ['helm_garnczkowy_stal', 'helm_zakonny_zakon', 'helm_zakonny_zelazo', 'helm_zakonny_stal'],
    'koszula_lniana': ['koszula_lniana_biala', 'koszula_lniana_zolta', 'koszula_lniana_niebieska', 'koszula_przewiewna'],
    'koszula_odswietna': ['koszula_odswietna'],
    'kaftan': ['kaftan_czerwony', 'kaftan_brazowy', 'kaftan_granatowy'],
    'kurta': ['kurta_zielona', 'kurta_brazowa'],
    'kozuszek': ['kozuszek'],
    'zupan': ['zupan_sukienny'],
    'fartuch_kowalski': ['fartuch_kowalski'],
    'przeszywanica': ['zbroja_przeszywanica_len', 'zbroja_przeszywanica_jedwab', 'zbroja_przeszywanica_welna'],
    'skorznia': ['zbroja_skorznia_skora'],
    'skorznia_cwiekowana': ['zbroja_skorznia_skora_czarna'],
    'skorznia_futrzana': ['zbroja_skorznia_skora'],
    'kolczuga': ['zbroja_kolczuga_zelazo', 'zbroja_kolczuga_stal', 'zbroja_kolczuga_zakon'],
    'luska': ['zbroja_luska_braz', 'zbroja_luska_zelazo', 'zbroja_luska_stal', 'zbroja_luska_zakon'],
    'brygantyna': ['zbroja_przeszywanica_welna'],
    'napiersnik': ['zbroja_napiersnik_braz', 'zbroja_napiersnik_zelazo', 'zbroja_napiersnik_stal', 'zbroja_napiersnik_zakon'],
    'plaszcz': ['plaszcz_zwiadowcy', 'plaszcz_zakonny'],
    'peleryna': ['plaszcz_lniany'],
    'plaszcz_futrzany': ['plaszcz_futrzany'],
    'szal': [],
    'torba': ['torba_plocienna', 'torba_skorzana'],
    'plecak': ['plecak'],
    'amulet': [],
    'kosz_wiklinowy': ['kosz_wiklinowy'],
}
UWAGI = {
    'przeszywanica': 'zbroja_przeszywanica_welna tylko dla 427 (Sukienna przeszywanica); 355 i 432 z tym samym kluczem -> brygantyna',
    'brygantyna': 'klucz zbroja_przeszywanica_welna dzieli z przeszywanicą: przedmioty 355 Brygantyna i 432 Stalowa brygantyna -> ta warstwa',
    'skorznia': 'zbroja_skorznia_skora: 350 -> ta warstwa; 428 Futrzana skórznia (ten sam klucz) -> skorznia_futrzana',
    'skorznia_futrzana': 'klucz zbroja_skorznia_skora dzieli ze skórznią: tylko przedmiot 428',
    'plaszcz': 'kształt jednego płaszcza z zapinką i opuszczonym kapturem; zwiadowcy = rampa szarozielona, zakonny = czarna (zapinka -> akcent)',
    'szal': 'nie ma jeszcze przedmiotu - warstwa na zapas',
    'amulet': 'dodatki (381, 382, 473, 476) nie mają klucza wyglądu - wisior na rzemieniu, kolor wisiora do przemalowania',
    'helm_zamkniety': 'zamknięty hełm: garnczkowy (425) i zakonny (348, 400) - ten sam kształt, zakonny = rampa zakon',
}
# not on the bust (the frame ends above the waist): the belts
NIEWIDOCZNE = ['pas_skorzany_braz', 'pas_skorzany_czarny', 'pas_sakiewka', 'pas_ladownica', 'pas_tragarza', 'pas_okuty_braz']
# the pilot edit (docs/ekwipunek/pilot/portret_tulow_zbroja.png) has both the nasal helmet and the mail shirt: the head family takes
# its head part, the torso family its torso part
SPLIT_Y = {'pilot_zelazo': 86}

T_OUT, T_FACE = 24, 44          # colour difference (max channel) that counts as changed: outside / inside the face
MIN_PART = 8                    # smaller changed specks are noise
MAX_HOLE = 200                  # holes inside a piece up to this size are filled (the piece's colour happened to equal the base's)
yy, xx = np.mgrid[0:128, 0:128]
FACE = ((xx - 54) / 21.0) ** 2 + ((yy - 65) / 20.0) ** 2 <= 1      # the face of the base (brows to chin, cheek to ear)
CORE = ((xx - 51) / 17.0) ** 2 + ((yy - 63) / 17.0) ** 2 <= 1      # its eyes, nose and mouth
CLOSE = {'tors': 2, 'szyja': 1, 'plecy': 1, 'dodatek': 1, 'plaszcz': 1, 'glowa': 2}   # closing radius: the piece's silhouette is solid


def dilate(m, r):
    H, W = m.shape
    p = np.pad(m, r)
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r + 1:
                out |= p[r + dy:r + dy + H, r + dx:r + dx + W]
    return out


def erode(m, r):
    return ~dilate(~m, r)


def load(p):
    a = np.array(Image.open(p).convert('RGBA')).astype(np.int16)
    a[126:128] = a[125]          # the light 1-2 px strip at the bottom edge of the PixelLab results: cut away
    return a


def components(mask):
    """4-connected components of a bool mask -> list of (ys, xs) arrays"""
    seen = np.zeros_like(mask, dtype=bool)
    out = []
    H, W = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        q = deque([(y0, x0)])
        seen[y0, x0] = True
        ys, xs = [], []
        while q:
            y, x = q.popleft()
            ys.append(y)
            xs.append(x)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    q.append((ny, nx))
        out.append((np.array(ys), np.array(xs)))
    return out


def cut(fam):
    slot, mat, face, items, raw, words = RODZINY[fam]
    base = load(BASE)
    ed = load(os.path.join(RAW, (raw or fam) + '.png'))
    ba, ea = base[..., 3] > 0, ed[..., 3] > 0
    d = np.abs(base[..., :3] - ed[..., :3]).max(2)
    ch = np.where(FACE, d > T_FACE, d > T_OUT) | (ba != ea)
    ch &= ea                                             # the layer holds only the edit's visible pixels
    region = np.ones_like(ch)
    if slot == 'glowa':
        if raw in SPLIT_Y:
            region &= yy < SPLIT_Y[raw]
        if face == 'none':
            region &= ~FACE | (yy < 47)                  # a hat's brim may shade the forehead, nothing lower
        elif face == 'frame':
            region &= ~CORE
    else:
        region &= (yy >= 70) & ~FACE
        if raw in SPLIT_Y:
            region &= yy >= SPLIT_Y[raw]
    ch &= region
    keep = np.zeros_like(ch)
    for ys, xs in components(ch):
        if len(ys) >= MIN_PART:
            keep[ys, xs] = True
    # a solid silhouette: close the gaps where the piece's pixels happen to equal the base's (grey mail on the grey shirt)
    r = CLOSE[slot]
    keep = erode(dilate(keep, r), r) & region & ea
    # fill the small enclosed holes (the piece's own pixels that equal the base's)
    for ys, xs in components(~keep & region):
        if len(ys) <= MAX_HOLE and ys.min() > 0 and xs.min() > 0 and xs.max() < 127 and ys.max() < 127 and ea[ys, xs].all():
            keep[ys, xs] = True
    layer = np.zeros_like(ed)
    layer[keep] = ed[keep]
    # what the base must lose: pixels the edit made background (in the region), and for head pieces the hair under the piece
    lum = base[..., :3].mean(2)
    hair = ba & (lum < 75) & ((yy < 47) | ~FACE) & (yy < 100)
    erase = ba & ~ea & region
    if slot == 'glowa':
        erase |= hair & keep
    hides_hair = bool(slot == 'glowa' and (hair & (erase | keep)).sum() > 0.25 * (hair & (yy < 48)).sum())
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray(layer.astype(np.uint8), 'RGBA').save(os.path.join(OUT, fam + '.png'))
    mpath = os.path.join(OUT, fam + '_ukryj.png')
    if erase.sum():
        m = np.zeros((128, 128, 4), np.uint8)
        m[erase] = (255, 255, 255, 255)
        Image.fromarray(m, 'RGBA').save(mpath)
    elif os.path.exists(mpath):
        os.remove(mpath)
    return {'plik': 'warstwy/%s.png' % fam, 'ukryj': ('warstwy/%s_ukryj.png' % fam) if erase.sum() else None, 'miejsce': slot,
            'kolejnosc': ORDER[slot], 'material': mat, 'ukrywa_wlosy': hides_hair, 'twarz': face, 'przedmioty': items,
            'wzory': WZORY.get(fam, []), 'uwaga': UWAGI.get(fam), 'opis': words, 'surowe': 'surowe/%s.png' % (raw or fam), 'piksele': int(keep.sum())}


if __name__ == '__main__':
    names = sys.argv[1:] or list(RODZINY)
    jp = os.path.join(HERE, 'warstwy.json')
    data = json.load(open(jp, encoding='utf-8')) if os.path.exists(jp) else {}
    b = load(BASE)
    Image.fromarray(b.astype(np.uint8), 'RGBA').save(os.path.join(HERE, 'baza.png'))
    for n in names:
        if not os.path.exists(os.path.join(RAW, (RODZINY[n][4] or n) + '.png')):
            print('brak', n)
            continue
        data[n] = cut(n)
        print('%-20s %5d px  ukryj=%s  wlosy=%s' % (n, data[n]['piksele'], bool(data[n]['ukryj']), data[n]['ukrywa_wlosy']))
    data = {k: data[k] for k in RODZINY if k in data}
    meta = {'_opis': 'Warstwy popiersia bohatera (128x128, zwrócone w lewo). Złożenie: baza.png -> wymaż piksele z "ukryj" każdej '
                     'noszonej rzeczy -> warstwy według "kolejnosc" (od najmniejszej). Jedna rzecz na miejsce (tors: ubranie albo zbroja). '
                     'Kolor: warstwa w materiale rodzimym; inne kolory/materiały = przemalowanie rampą (Ubior_Data RAMPY_ZBROI).',
            '_baza': 'baza.png', '_niewidoczne_na_popiersiu': NIEWIDOCZNE}
    json.dump(dict(meta, **data), open(jp, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    print('ok', jp)
