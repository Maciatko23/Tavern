import sys, os, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mozaika import mosaic
from PIL import Image, ImageDraw
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
T = tempfile.gettempdir()
def pair(mid, W, H, box, name, label, scale=1.0):
    a_, b_ = os.path.join(T, '_a.png'), os.path.join(T, '_b.png')
    mosaic(os.path.join(ROOT, 'tools/przeglad_ekranow/zrzuty/%d' % mid), W, H, a_, box=box)
    mosaic(os.path.join(ROOT, 'tools/usterki/reszta/po/%d' % mid), W, H, b_, box=box)
    a = Image.open(a_); b = Image.open(b_)
    im = Image.new('RGB', (a.width + b.width + 12, a.height + 22), (20, 20, 20)); im.paste(a, (0, 22)); im.paste(b, (a.width + 12, 22))
    d = ImageDraw.Draw(im); d.text((4, 4), 'PRZED   ' + label, fill=(255, 255, 0)); d.text((a.width + 16, 4), 'PO', fill=(255, 255, 0))
    if scale != 1.0: im = im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS)
    im.save(os.path.join(ROOT, 'docs/usterki/reszta', name)); print(name, im.size)
PAIRS = [
    (24, 120, 120, (8, 108, 45, 120), '024_33_plot_na_murze.png', 'Map024 row 33 (15,118) + row 34 (29,119): plot i krzaki namalowane na licu muru'),
    (24, 120, 120, (90, 52, 108, 86), '024_09_listwa.png', 'Map024 row 09 (98,56): kamienna listwa przez lake i pas kwiatow'),
    (24, 120, 120, (28, 33, 46, 46), '024_04_sad.png', 'Map024 row 04 (32,36): dwa grunty w ogrodzonym sadzie -> jeden'),
    (1, 63, 55, (44, 42, 60, 53), '001_11_dywany.png', 'Map001 row 11 (46,44): dwa ciemne puste dywany jak dziury w podlodze -> zdjete'),
    (3, 120, 120, (30, 0, 52, 12), '003_03_sosna.png', 'Map003 row 03 (42,3): sosna zlana z resztka muru -> przesunieta'),
    (3, 120, 120, (22, 44, 34, 56), '003_20_dziura.png', 'Map003 row 20 (27,49): czarny kwadracik w scianie skaly'),
    (3, 120, 120, (94, 14, 112, 44), '003_06_18_plamy.png', 'Map003 rows 06, 18 (100,20), (104,36): ciemnoszare owale na lace -> zdjete'),
    (4, 120, 120, (18, 78, 38, 96), '004_23_skaly.png', 'Map004 row 23 (23,82): glazy/rudy/krzaki w rownej siatce -> nieregularne skupisko'),
    (20, 120, 120, (30, 36, 60, 52), '020_cienie.png', 'Map020: twarde prostokaty cienia przy chacie dziadka'),
    (20, 120, 120, (22, 62, 52, 78), '020_13_pasy.png', 'Map020 row 13 (28,68): proste pasy ziemi na lace -> falisty obrys'),
    (120, 96, 68, (36, 18, 76, 56), '120_02_04_07_wzgorza.png', 'Map120 rows 02, 04, 07: postrzepione stopnie i labirynt muru -> dwa nieregularne wzgorza ze schodami'),
    (120, 96, 68, (0, 8, 46, 40), '120_01_03_cienie_i_drzewa.png', 'Map120 rows 01, 03: cienie warstwy 4 i sosny na palisadzie'),
    (120, 96, 68, (0, 44, 30, 62), '120_05_lacie_bruku.png', 'Map120 row 05: ciemne laty bruku jak plamy oleju'),
    (168, 130, 108, (56, 16, 78, 30), '168_sad_ruiny.png', 'Map168: osiem jablonek w siatce 4x2 -> stary, nieregularny sad (Zasoby_Data.js)'),
    (168, 130, 108, (36, 8, 100, 46), '168_05_pole.png', 'Map168 row 05 + warstwa nakladek: prostokatne plamy i proste szwy gruntu -> falisty obrys'),
    (168, 130, 108, (0, 76, 110, 108), '168_zatoka_brzegi.png', 'Map168: dlugie proste brzegi zatoki -> falujaca linia brzegowa'),
    (168, 130, 108, (44, 20, 62, 38), '168_cokol_sosna.png', 'Map168: sosna na licu cokolu przesunieta'),
    (175, 156, 60, (30, 3, 82, 52), '175_01_07_09_wzgorza.png', 'Map175 rows 01, 07, 09: trzy prostokatne obrysy -> nieregularne zaokraglone wzgorza (schody i miejsca Zakonu zostaja)'),
    (175, 156, 60, (72, 0, 100, 30), '175_02_04_pas.png', 'Map175 rows 02, 04: zolty pas o prostych brzegach i prosty brzeg jeziora -> falisty'),
    (175, 156, 60, (0, 8, 31, 32), '175_03_laty.png', 'Map175 row 03: zielone laty i pas bruku o prostych brzegach'),
    (175, 156, 60, (10, 46, 50, 60), '175_11_paski_muru.png', 'Map175 row 11: jasnozielone paski na gornej krawedzi muru -> gzyms'),
    (175, 156, 60, (118, 24, 156, 54), '175_08_plaskowyz.png', 'Map175 row 08: pusty plaskowyz -> plamy kamieni i ziemi'),
    (213, 96, 40, (0, 20, 40, 40), '213_01_cienie.png', 'Map213 rows 01, 03, 05: ciemne prostokaty u stop scian'),
    (121, 15, 11, (0, 0, 15, 11), '121_cienie.png', 'Map121: cienie warstwy 4 w izbie'),
    (122, 13, 10, (0, 0, 13, 10), '122_cienie.png', 'Map122: cienie warstwy 4 w chacie'),
    (123, 15, 11, (0, 0, 15, 11), '123_cienie.png', 'Map123: cienie warstwy 4 w chacie'),
    (124, 13, 10, (0, 0, 13, 10), '124_cienie.png', 'Map124: cienie warstwy 4 w chacie'),
]
if __name__ == '__main__':
    for (mid, W, H, box, name, label) in PAIRS:
        w = (box[2] - box[0]) * 24
        pair(mid, W, H, box, name, label, scale=min(1.0, 760.0 / w))
