# docs/popiersia/zgodnosc_*.png: every talk bust beside its character on the map - the bust (as in the game, facing left), the
# map sheet's front frame enlarged x4 (nearest) and its head x8 - with a verdict: does the bust match the sprite (hair / bald
# head, beard, colours, clothes, hat)?
# Run: python tools/busts/make_match.py przed|po [out.png] [--pics DIR] [key ...]
#   przed: the verdicts before the 2026-10-07 pass (run with --pics backup_art_2026-10-07/popiersia to show the old busts)
#   po:    after it (the busts from img/pictures; the tavern regulars' own <Name>_Bust files)
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from make_residents import RESIDENTS

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
PICS = os.path.join(ROOT, 'img', 'pictures')
CHARS = os.path.join(ROOT, 'img', 'characters')

# (key, bust, who, sheet, (col, row) of the front frame in 64 px cells); the tavern regulars: (old RTP bust, own bust)
ENTRIES = [('hero', 'Hero_Bust', 'Bohater', 'Hero_Walk', (0, 0)), ('dziadek', 'Stach_Bust', 'Dziadek Stach', '$Npc_Dziadek', (1, 0)),
           ('borgar', ('People3_5', 'Borgar_Bust'), 'Borgar', '$Npc_Borgar', (1, 0)),
           ('melia', ('People2_8', 'Melia_Bust'), 'Melia', '$Npc_Melia', (1, 0)),
           ('grum', ('Actor2_5', 'Grum_Bust'), 'Grum', '$Npc_Grum', (1, 0)), ('ozzy', ('People2_1', 'Ozzy_Bust'), 'Ozzy', '$Npc_Ozzy', (1, 0)),
           ('wanda', ('People1_6', 'Wanda_Bust'), 'Wanda', '$Npc_Wanda', (1, 0))]
for key, who, base in RESIDENTS:
    K = key[0].upper() + key[1:]
    ENTRIES.append((key, K + '_Bust', who, '$Npc_' + K, (1, 0)))

OK, PART, BAD, FIXED = 'PASUJE', 'CZĘŚCIOWO', 'NIE PASUJE', 'POPRAWIONE'
COL = {OK: (120, 220, 120), PART: (240, 200, 80), BAD: (255, 100, 90), FIXED: (110, 190, 255)}
# the verdicts before the pass (2026-10-07)
PRZED = {
    'hero': (OK, 'czarne włosy, szara lniana koszula z łatami, bieda - jak na mapie.'),
    'dziadek': (OK, 'siwa broda, brązowa czapka, łatana sukmana. Drobne: na mapie czapka z daszkiem, broda krótsza.'),
    'borgar': (BAD, 'RTP: szlachcic w złoto-fioletowym kaftanie, kozia bródka. Mapa: karczmarz - pełna siwa broda, biała koszula, '
                    'fioletowa chusta, musztardowa kamizelka, fartuch.'),
    'melia': (BAD, 'RTP: różowe włosy, gogle, czarny top. Mapa: długie srebrne włosy, niebieska suknia, śliwkowa peleryna.'),
    'grum': (BAD, 'RTP: zielone nastroszone włosy, bez brody, goła pierś. Mapa: krótkie ciemne włosy, pełna ciemna broda, '
                  'brązowa skórznia (opaska na oko i czerwona chusta się zgadzają).'),
    'ozzy': (BAD, 'RTP: biała szata kapłana, okulary. Mapa: brązowy kapelusz, czerwony nos, siwe wąsy i broda, granatowy łatany płaszcz.'),
    'wanda': (PART, 'warkocz i brązowe włosy tak; brak jasnej bluzki z bufkami, gorsetu, fartucha i ścierki na ramieniu.'),
    'soltys': (PART, 'siwe włosy, sumiaste wąsy, złoty łańcuch tak; na mapie brązowa kamizelka na białej koszuli z długimi rękawami, w popiersiu brązowy kaftan.'),
    'piekarka': (PART, 'biały czepek tak; mapa: pulchna, brązowe włosy, niebieska suknia i biały fartuch (w popiersiu peleryna).'),
    'woziwoda': (OK, 'słomkowy kapelusz, brązowe włosy, biała koszula, brązowa kamizelka.'),
    'kowal': (BAD, 'na mapie ŁYSY, z pełną, gęstą ciemnobrązową brodą; w popiersiu czarne włosy i krótka czarna broda.'),
    'kapral': (PART, 'kapalin i wąsy tak; na mapie kolczuga i czerwony wapenrok z czarnym koniem, w popiersiu zbroja płytowa.'),
    'dzwonnik': (PART, 'łysy, biała broda tak; na mapie zwykły ciemnoszary habit ze sznurem i kluczem, w popiersiu ozdobna szata.'),
    'kupiec': (PART, 'zielony kaftan tak; na mapie bordowy kapelusz z rondem i czerwonym piórem, pełna czarna broda, ciemniejsza skóra.'),
    'garbarz': (PART, 'kaszkiet tak; na mapie oliwkowa koszula i skórzany fartuch, w popiersiu zielona peleryna.'),
    'feliks': (OK, 'siwe włosy, czarny surdut, biała chusta.'),
    'kamerdyner': (PART, 'siwe włosy, czerwona kamizelka, biała chusta tak; na mapie STARY sługa w czarnym fraku, bez okularów - w popiersiu młoda twarz w okularach.'),
    'lord': (OK, 'zaczesane włosy, broda, futrzany kołnierz, czerwony kaftan.'),
    'straznik': (PART, 'kapalin tak; na mapie kolczuga i czerwony wapenrok z czarnym koniem, w popiersiu zbroja płytowa.'),
    'bronek': (PART, 'rudobrązowe potargane włosy tak; na mapie kremowa lniana tunika bez fartucha, w popiersiu brązowy fartuch z łatą.'),
    'zosia': (PART, 'jasne kucyki tak; na mapie czerwona sukienka i biały fartuszek, w popiersiu różowa sukienka z kokardką.'),
    'ludmila': (PART, 'na mapie włosy związane, brązowa chusta na ramionach, szarozielona suknia; w popiersiu rozpuszczone, sweter.'),
    'ela': (PART, 'na mapie potargane ciemnobrązowe włosy i podarta zgaszona niebieska sukienka; w popiersiu schludna jasna fryzura i czysta sukienka.'),
    'rafal': (PART, 'na mapie prawie czarne kręcone potargane włosy, podarta niebieska tunika z łatą, bandaże; w popiersiu jasnobrązowe proste włosy, kurtka z kapturem.'),
    'zlodziej': (PART, 'na mapie rdzawy kaptur NA głowie; w popiersiu bez kaptura.'),
    'gracz': (OK, 'czarny kapelusz z piórem, wąsy, czerwony kaftan.'),
    'bartek': (PART, 'na mapie potargane piaskowe włosy, zarost, brązowa kamizelka na białej koszuli; w popiersiu gładki młodzik w swetrze.'),
    'woznica': (PART, 'kapelusz, żółta chusta, płaszcz tak; na mapie pełna siwobrązowa broda - w popiersiu brak.'),
    'praczka': (PART, 'chusta podobna; w popiersiu młoda zakonnica z białym kołnierzem, na mapie starsza kobieta, szara suknia, fartuch.'),
    'franek': (OK, 'rudobrązowe włosy, żółta koszula.'),
    'drwal': (OK, 'ciemne włosy, gęsta ciemna broda.'),
    'klusownik': (PART, 'na mapie zielony kaptur NA głowie, ciemne włosy; w popiersiu kaptur zsunięty, sterczące włosy.'),
    'znachorka': (PART, 'stara, siwe włosy tak; na mapie gruba ciemnobrązowa, prawie czarna chusta i brązowa suknia, w popiersiu jasnoszara chusta.'),
    'szmaciarz': (OK, 'kapelusz z łatami, łatany płaszcz.'),
    'uchodzca': (OK, 'ciemne włosy, oliwkowa kurta.'),
    'zebrak': (OK, 'siwe długie włosy i broda, łachmany.'),
    'marek': (BAD, 'nowy mieszkaniec bez popiersia - w rozmowie tylko dymek nad głową.'),
}
# after the pass: only what changed (the rest keeps its verdict from PRZED)
PO = {
    'kowal': (FIXED, 'łysy (ogolona, lśniąca czaszka z sadzą), krótkie ciemne włosy tylko nad uszami, pełna gęsta ciemnobrązowa broda z wąsami.'),
    'dzwonnik': (FIXED, 'zwykły ciemnoszary wełniany habit z wyłożonym kapturem, sznur z kluczem; ozdobna szata zakonu zachowana jako Ambrozy_Bust_Zakon.png.'),
    'borgar': (FIXED, 'nowe Borgar_Bust: pełna siwa broda, kremowa koszula, fioletowa chusta, musztardowa kamizelka (fartuch poniżej kadru).'),
    'melia': (FIXED, 'nowe Melia_Bust (baza People2_2): długie srebrne włosy, niebieska sznurowana suknia, śliwkowa pelerynka.'),
    'grum': (FIXED, 'nowe Grum_Bust: krótkie ciemne włosy, pełna broda, opaska i blizna, czerwona chusta, brązowa skórznia, żelazna rękawica.'),
    'ozzy': (FIXED, 'nowe Ozzy_Bust (baza SF_People1_7): zgnieciony brązowy kapelusz, czerwony nos, siwe wąsy i broda, granatowy łatany płaszcz.'),
    'wanda': (FIXED, 'nowe Wanda_Bust: kremowa bluzka z bufkami, sznurowany gorset, fartuch, ścierka na ramieniu, warkocz.'),
    'piekarka': (FIXED, 'brązowe włosy pod czepkiem, pełniejsza twarz, niebieska suknia, biały fartuch z mąką.'),
    'kapral': (FIXED, 'kolczy kaptur i kolczuga, czerwony wapenrok z czarnym koniem, kapalin, wąsy.'),
    'straznik': (FIXED, 'kolczy kołnierz i kolczuga, czerwony wapenrok z koniem, kapalin, brązowe włosy.'),
    'kupiec': (FIXED, 'bordowy kapelusz z rondem, piórem i rozetą, pełna czarna broda, śniada skóra (szarfa poniżej kadru).'),
    'garbarz': (FIXED, 'kaszkiet, oliwkowa koszula, skórzany fartuch na szelkach, skórzane rękawice.'),
    'ludmila': (FIXED, 'włosy związane w kok, brązowa wełniana chusta na ramionach, szarozielona suknia.'),
    'praczka': (FIXED, 'baza SF_People1_6: starsza, zmęczona, szaroniebieska chusta na głowie, szarobrązowa suknia, poplamiony fartuch.'),
    'zlodziej': (FIXED, 'rdzawy kaptur na głowie, ciemne włosy pod nim, łata.'),
    'klusownik': (FIXED, 'ciemnozielony kaptur na głowie, ciemne włosy, zarost, brązowa skórznia, łuk na plecach.'),
    'bartek': (FIXED, 'krótka piaskowa broda i zarost, ciemniejsze włosy, brązowa kamizelka na białej koszuli.'),
    'woznica': (FIXED, 'pełna siwobrązowa broda z wąsami nad szalem, ogorzała czerwona twarz.'),
    'soltys': (FIXED, 'brązowa zapinana kamizelka na białej koszuli z długimi rękawami, złoty łańcuch, krzaczaste brwi i sumiaste wąsy.'),
    'kamerdyner': (FIXED, 'postarzony (zmarszczki, siwe bokobrody), czarny frak, czerwona kamizelka, biały fular i rękawiczka; okulary -> monokl (gest ręki z bazy).'),
    'znachorka': (FIXED, 'gruba ciemnobrązowa, prawie czarna dziergana chusta, brązowa suknia, siwy kok, zioła.'),
    'rafal': (FIXED, 'prawie czarne kręcone włosy, zarost, cienie pod oczami, prosta niebieska lniana tunika z łatą i dziurami (bandaże poniżej kadru).'),
    'ela': (FIXED, 'potargane ciemnobrązowe włosy, zgaszona niebieska sukienka z łatami i rozdarciem.'),
    'bronek': (FIXED, 'bez fartucha: kremowa lniana tunika z dekoltem w serek i sznurkiem, rudawe włosy.'),
    'zosia': (FIXED, 'zgaszona czerwona sukienka, biały poplamiony fartuszek z szelkami, jasne kucyki.'),
    'marek': (FIXED, 'nowe Marek_Bust (baza SF_Actor3_3): długie potargane ciemne włosy, długa broda, blady i zakurzony, puste spojrzenie, brudna koszula, skórzana kamizelka.'),
}

BH = 280                 # the bust's height here
COLS = 3
CW, CH = 720, BH + 104
BG = (30, 31, 38)


def font(sz):
    for f in ('C:/Windows/Fonts/segoeui.ttf', 'C:/Windows/Fonts/arial.ttf'):
        if os.path.exists(f):
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def frame_of(sheet, cell):
    s = Image.open(os.path.join(CHARS, sheet + '.png')).convert('RGBA')
    x, y = cell
    return s.crop((x * 64, y * 64, x * 64 + 64, y * 64 + 64))


def head_box(fr):
    a = np.asarray(fr)[..., 3] > 20
    ys, xs = np.nonzero(a)
    top = ys.min()
    rows = a[top:top + 22]
    cx = int(round(np.nonzero(rows)[1].mean()))
    return (cx - 14, top - 2, cx + 14, top + 22)


def wrap(d, text, f, w):
    lines, cur = [], ''
    for word in text.split():
        t = (cur + ' ' + word).strip()
        if d.textlength(t, font=f) > w and cur:
            lines.append(cur)
            cur = word
        else:
            cur = t
    if cur:
        lines.append(cur)
    return lines


def build(out, entries, pics, verdicts, title):
    F1, F2, F3 = font(18), font(13), font(14)
    rows = (len(entries) + COLS - 1) // COLS
    sheet = Image.new('RGBA', (COLS * CW + 20, rows * CH + 50), BG + (255,))
    d = ImageDraw.Draw(sheet)
    d.text((12, 12), title, fill=(255, 220, 90, 255), font=F1)
    for i, (key, bust, who, sh, cell) in enumerate(entries):
        x0, y0 = 10 + (i % COLS) * CW, 44 + (i // COLS) * CH
        d.rectangle((x0, y0, x0 + CW - 8, y0 + CH - 8), outline=(60, 62, 74, 255))
        verdict, note = verdicts.get(key, ('?', ''))
        d.text((x0 + 8, y0 + 4), who, fill=(240, 240, 240, 255), font=F1)
        vx = x0 + 16 + d.textlength(who, font=F1)
        d.text((vx, y0 + 6), verdict, fill=COL.get(verdict, (200, 200, 200)) + (255,), font=F3)
        d.text((x0 + CW - 16 - d.textlength(bust + ' / ' + sh, font=F2), y0 + 8), bust + ' / ' + sh, fill=(150, 150, 160, 255), font=F2)
        for j, ln in enumerate(wrap(d, note, F2, CW - 30)[:4]):
            d.text((x0 + 8, y0 + 30 + j * 17), ln, fill=(200, 200, 210, 255), font=F2)
        p = os.path.join(pics, bust + '.png')
        if not os.path.exists(p) and not bust.endswith('_Bust'):
            p = os.path.join(PICS, bust + '.png')     # (the RTP busts: not in a backup folder)
        if os.path.exists(p):
            im = Image.open(p).convert('RGBA')
            im = im.resize((round(im.width * BH / im.height), BH), Image.LANCZOS)
            sheet.alpha_composite(im, (x0 + 4, y0 + CH - 8 - BH))
        else:
            d.text((x0 + 30, y0 + CH - BH / 2), 'BRAK ' + bust, fill=(255, 90, 90, 255), font=F1)
        fr = frame_of(sh, cell)
        bb = fr.getbbox()
        body = fr.crop(bb)
        body = body.resize((body.width * 4, body.height * 4), Image.NEAREST)
        sheet.alpha_composite(body, (x0 + 280 + (200 - body.width) // 2, y0 + CH - 12 - body.height))
        hb = head_box(fr)
        head = fr.crop(hb).resize(((hb[2] - hb[0]) * 8, (hb[3] - hb[1]) * 8), Image.NEAREST)
        hx, hy = x0 + CW - 8 - head.width - 6, y0 + CH - 12 - head.height - 40
        d.rectangle((hx - 1, hy - 1, hx + head.width, hy + head.height), fill=(52, 54, 64, 255))
        sheet.alpha_composite(head, (hx, hy))
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.convert('RGB').save(out)
    print('ok', out)


if __name__ == '__main__':
    args = sys.argv[1:]
    mode = args.pop(0) if args and args[0] in ('przed', 'po') else 'po'
    pics = PICS
    if '--pics' in args:
        i = args.index('--pics')
        pics = os.path.join(ROOT, args[i + 1]) if not os.path.isabs(args[i + 1]) else args[i + 1]
        del args[i:i + 2]
    out = args.pop(0) if args and args[0].endswith('.png') else os.path.join(ROOT, 'docs', 'popiersia', 'zgodnosc_%s.png' % mode)
    only = set(args)
    ents = []
    for key, bust, who, sh, cell in ENTRIES:
        if isinstance(bust, tuple):
            bust = bust[0] if mode == 'przed' else bust[1]
        if not only or key in only:
            ents.append((key, bust, who, sh, cell))
    verdicts = dict(PRZED)
    if mode == 'po':
        verdicts.update(PO)
    title = ('PRZED (2026-10-07): ' if mode == 'przed' else 'PO poprawkach (2026-10-07): ') + \
        'popiersie (jak w grze, zwrócone w lewo) | postać z mapy x4 | głowa x8 (nearest)'
    build(out, ents, pics, verdicts, title)
