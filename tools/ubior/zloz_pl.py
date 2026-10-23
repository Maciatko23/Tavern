# tools/ubior/zloz_pl.py - zestawienia próby zbroi z PixelLab i zamachu mieczem z wyników tests/ubior_pl_test.js:
#   docs/ekwipunek/pixellab_proba_zbroje.png     zestaw skórzany i żelazny: stary wygląd (faktura na tunice, rysowane hełmy) nad nowym (PixelLab)
#                                                w tych samych ujęciach (chód 8 kierunków, bieg, praca, walka, miecz, siedzi, leży, przewrót)
#   docs/ekwipunek/pixellab_proba_materialy.png  inne materiały (przemalowana paleta PixelLab)
#   docs/ekwipunek/pixellab_proba_mapa.png       zrzuty z mapy: oba zestawy, stary / nowy
#   docs/ekwipunek/pixellab_proba_miecz.png      zamach mieczem (Hero_Sword): broń w kluczowych klatkach + zrzuty z mapy w 4 kierunkach
#   docs/ekwipunek/pixellab_zbroje_reszta.png    drugi etap: przeszywanica + czepiec, łuska + nosal, napierśnik + otwarty, hełm zakonny,
#                                                czepiec kolczy - stary nad nowym w tych samych ujęciach, materiały
#   docs/ekwipunek/pixellab_zbroje_reszta_mapa.png  drugi etap na mapie (zrzuty z gry), stary / nowy
#   python tools/ubior/zloz_pl.py tests/ubior_pl
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zloz_bron import grid, GAME, DOCS   # noqa: E402

NAZWY = {'skora': 'zestaw skórzany', 'zelazo': 'zestaw żelazny', 'przeszywanica': 'przeszywanica', 'luska': 'łuska', 'napiersnik': 'napierśnik',
         'zakonny': 'hełm zakonny', 'czepiec_kolczy': 'czepiec kolczy'}
SKLAD = {'skora': 'kaptur, skórznia, karwasze', 'zelazo': 'kapalin, kolczuga, nagolenniki, buty okute', 'przeszywanica': 'czepiec pikowany, przeszywanica (len)',
         'luska': 'hełm z nosalem, łuska (żelazo)', 'napiersnik': 'hełm otwarty, napierśnik (stal)', 'zakonny': 'hełm zakonny, kolczuga, nagolenniki, buty',
         'czepiec_kolczy': 'czepiec kolczy, łuska (stal)'}
KIER = {2: 'dół', 4: 'lewo', 6: 'prawo', 8: 'góra'}


def main(argv):
    src = argv[0] if argv else os.path.join(GAME, 'tests', 'ubior_pl')
    shots = os.path.join(src, 'shots')
    meta = json.load(open(os.path.join(src, 'meta.json'), encoding='utf-8'))
    P = lambda f: os.path.join(shots, f) if f else None
    rows = []
    for name, s in meta['sets'].items():
        rows.append((NAZWY[name] + ': było', SKLAD[name] + ' - faktura, rysowany hełm', [P(f) for f in s['old']]))
        rows.append((NAZWY[name] + ': PixelLab', SKLAD[name], [P(f) for f in s['new']]))
    grid(rows, meta['views'], 'Zbroja z PixelLab (próba): stary wygląd nad nowym, te same klatki arkuszy', os.path.join(DOCS, 'pixellab_proba_zbroje.png'),
         Z=2, left=270)
    rows = [(m['label'], ', '.join(v.replace('helm_', '').replace('zbroja_', '') for v in m['set'].values() if v), [P(f) for f in m['files']])
            for m in meta['materials']]
    grid(rows, meta['matViews'], 'Inne materiały: przemalowana paleta PixelLab', os.path.join(DOCS, 'pixellab_proba_materialy.png'), Z=2, left=420)
    rows = []
    labels = []
    for name in meta['sets']:
        for on in (False, True):
            sel = [m for m in meta['mapa'] if m['set'] == name and m['on'] == on]
            labels = [m['label'] for m in sel]
            rows.append((NAZWY[name] + (': PixelLab' if on else ': było'), 'zrzuty z ekranu', [P(m['file']) for m in sel]))
    grid(rows, labels, 'Zbroja z PixelLab na mapie (zrzuty z gry)', os.path.join(DOCS, 'pixellab_proba_mapa.png'), cw=112, ch=112, Z=2, left=270)
    fr = ['%s kl. %d' % (['dół', 'lewo', 'prawo', 'góra'][r], c) for r, c in meta['swordFrames']]
    rows = [(s['key'].replace('bron_', ''), 'zwykły arkusz (PixelLab)' if s['own'] else 'bron.py na osi miecza', [P(f) for f in s['files']]) for s in meta['sword']]
    by = {}
    for m in meta['miecz_mapa']:
        by.setdefault(m['dir'], []).append(m)
    for d, ms in sorted(by.items()):
        rows.append(('mapa: ' + KIER[d], 'zamach / cios / po ciosie', [P(m['file']) for m in ms] + [None] * (len(fr) - len(ms))))
    grid(rows, fr, 'Zamach mieczem (Hero_Sword, PixelLab): wypad i szerokie cięcie; broń na nim; zbroja żelazna', os.path.join(DOCS, 'pixellab_proba_miecz.png'),
         cw=112, ch=112, Z=2, left=290)
    # the second stage
    if meta.get('sets2'):
        rows = []
        for name, s in meta['sets2'].items():
            rows.append((NAZWY[name] + ': było', 'faktura na tunice, rysowany hełm', [P(f) for f in s['old']]))
            rows.append((NAZWY[name] + ': PixelLab', SKLAD[name], [P(f) for f in s['new']]))
        mv = meta['matViews'] + [''] * (len(meta['views']) - len(meta['matViews']))
        for m in meta.get('materials2', []):
            rows.append((m['label'], ', '.join(v.replace('helm_', '').replace('zbroja_', '') for v in m['set'].values() if v),
                         [P(f) for f in m['files']] + [None] * (len(meta['views']) - len(m['files']))))
        grid(rows, meta['views'], 'Zbroja z PixelLab - drugi etap: stary wygląd nad nowym (te same klatki), na dole inne materiały (ujęcia: ' +
             ', '.join(meta['matViews']) + ')', os.path.join(DOCS, 'pixellab_zbroje_reszta.png'), Z=2, left=330)
        rows = []
        labels = []
        for name in meta['sets2']:
            for on in (False, True):
                sel = [m for m in meta['mapa2'] if m['set'] == name and m['on'] == on]
                labels = [m['label'] for m in sel]
                rows.append((NAZWY[name] + (': PixelLab' if on else ': było'), SKLAD[name], [P(m['file']) for m in sel]))
        grid(rows, labels, 'Drugi etap na mapie (zrzuty z gry)', os.path.join(DOCS, 'pixellab_zbroje_reszta_mapa.png'), cw=112, ch=112, Z=2, left=330)


if __name__ == '__main__':
    main(sys.argv[1:])
