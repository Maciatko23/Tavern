# Builds every resident's bust (img/pictures/<Key>_Bust.png) with its make_<key>.py, then the line-up picture.
# Run: python tools/busts/make_residents.py [key ...]      (no keys: all of them)
# Each make_<key>.py repaints an RTP bust (330x350, facing left) - see the tables below for the base of each one.
# (2026-10-07: every bust checked against its map sheet - tools/busts/make_match.py -> docs/popiersia/zgodnosc_*.png)
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
# key -> (who, RTP base); the order is the line-up's
RESIDENTS = [
    ('soltys', 'Sołtys Bronisław', 'People1_5'), ('piekarka', 'Hanka Mączna', 'People4_2'), ('woziwoda', 'Kuba Woziwoda', 'SF_Actor2_3'),
    ('kowal', 'Tadek Młot', 'SF_Actor3_1'), ('kapral', 'Kapral Wit Czerwień', 'People3_7'), ('dzwonnik', 'Ambroży', 'People3_1'),
    ('kupiec', 'Baltazar Vey', 'People4_3'), ('garbarz', 'Ignac', 'Actor2_8'), ('feliks', 'Feliks', 'People4_7'),
    ('kamerdyner', 'Teodor', 'People4_1'), ('lord', 'Lord Leopold Zaleski', 'People2_5'), ('straznik', 'Strażnik dworu', 'People3_8'),
    ('bronek', 'Bronek', 'People1_1'), ('zosia', 'Zosia', 'People1_2'), ('ludmila', 'Ludmiła', 'SF_Actor3_2'), ('ela', 'Ela', 'People1_4'),
    ('rafal', 'Rafał', 'SF_Actor2_7'), ('zlodziej', 'Szymek', 'People2_3'), ('gracz', 'Lucjan Kość', 'People3_6'),
    ('bartek', 'Bartek Kmieć', 'SF_Actor2_1'), ('woznica', 'Wojciech', 'People2_7'), ('praczka', 'Marta Ługowa', 'SF_People1_6'),
    ('franek', 'Franek', 'SF_People1_1'), ('drwal', 'Zbych Smolarz', 'SF_Actor3_7'), ('klusownik', 'Rysiek Sidło', 'Actor1_3'),
    ('znachorka', 'Babka Jadwiga', 'People1_8'), ('szmaciarz', 'Józek Łata', 'Evil_1'), ('uchodzca', 'Darin z Kontynentu', 'SF_Actor1_5'),
    ('zebrak', 'Stary Gaweł', 'People4_5'), ('marek', 'Marek', 'SF_Actor3_3'),
]
# the tavern regulars (2026-10-07): their own busts <Name>_Bust (their old RTP busts did not look like their map sheets; the RTP
# names stay their keys in the game - SpeechBubbles.RENAMED); and Ambrozy's kept Order bust (Ambrozy_Bust_Zakon)
TAVERN = [('borgar', 'Borgar', 'People3_5'), ('melia', 'Melia', 'People2_2'), ('grum', 'Grum', 'Actor2_5'), ('ozzy', 'Ozzy', 'SF_People1_7'),
          ('wanda', 'Wanda', 'People1_6')]
EXTRA = ['ambrozy_zakon']

if __name__ == '__main__':
    keys = sys.argv[1:] or [k for k, _, _ in RESIDENTS + TAVERN] + EXTRA
    for k in keys:
        r = subprocess.run([sys.executable, os.path.join(HERE, 'make_%s.py' % k)], cwd=HERE)
        if r.returncode:
            sys.exit('make_%s.py failed' % k)
    if not sys.argv[1:]:
        subprocess.run([sys.executable, os.path.join(HERE, 'make_lineup.py')], cwd=HERE, check=True)
