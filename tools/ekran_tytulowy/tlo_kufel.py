# Tło ekranu tytułowego „Kufel przy kominku” do gry: obraz z PixelLab (art/kufel_kominek.png, 640x360) x2 bez wygładzania,
# lekkie podbicie kontrastu, przyciemnienie z lewej (miejsce na napis i menu) i winieta. BEZ napisu, menu i iskier - to rysuje
# TitleScreen.js (żywe). Wynik: img/titles1/Tawerna_Title_Kufel.png
import os
from tytul import bg_art, grade, gradient, vignette, ROOT
img = bg_art("kufel_kominek.png")
img = grade(img, bright=1.0, contrast=1.05)
gradient(img, 0, 0, 0.82, 0.0, (10, 5, 2), x0=0, x1=620, horizontal=True)
vignette(img, 0.55)
out = os.path.join(ROOT, "img", "titles1", "Tawerna_Title_Kufel.png")
img.convert("RGB").save(out, optimize=True)
print(out, img.size)
