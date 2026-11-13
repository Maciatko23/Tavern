import sys, json, os
sys.path.insert(0,"docs/audyt_map/_robocze")
import kadry
from PIL import ImageDraw
F={
8:[
(5,(105,37,113,46),"Dom z przybudówką: elewacja ze schodkiem (lewa połowa piętro wyżej niż prawa), szare łaty w złączu, przybudówka z dachem urwanym; ten sam wzorzec też w (17,98)-(26,106) [dodatkowo ciemnozielony prostokątny cień obok przybudówki nie pasuje do jej kształtu] i (41,64)-(50,74).","Złożyć dom z jednej poziomej elewacji (bez schodka), przybudówkę dokończyć dachem do ziemi, cień przesunąć pod jej obrys.",2),
(1,(81,4,97,23),"Ogromny pusty, klepiskowo-brązowy dziedziniec stajni (17x20) bez rekwizytów - nudna płaska plama.","Podzielić płotkami/wybiegi, dodać poidła, żłoby, stóg siana; albo zmniejszyć plac i dać trawę.",2),
(3,(0,47,4,53),"Zachodnia brama: daszek bramki ucięty przez wieżę przy krawędzi mapy, pod nim ciemny prostokąt i urwane belki - wygląda jak ułamek budowli.","Dorysować pełną bramę albo wyciąć szczątki i zrobić zwykły otwór w murze.",2),
(3,(4,97,9,107),"Niedokończony ogródek: ramka płotu w kształcie odwróconego U (brak dolnego boku), 3 kapusty w pionie, obok luźne sosny.","Zamknąć płot ze wszystkich stron z furtką, zagęścić grządki w prostokąt.",2),
(2,(105,94,118,103),"Sad: górne dwa rzędy mają tylko 2 drzewa (po lewej), dolny rząd 4 drzewa o nierównych odstępach; prawa połowa pusta, wygląda na niedokończony.","Posadzić regularną siatkę 4x3 drzew, równe odstępy.",2),
(2,(2,61,25,73),"Trzy ogrodzone grządki kapusty: górny płot trzeciej działki o kratkę niżej niż dwóch pozostałych (krok w (18,62)), furtki w dolnych płotach w różnych miejscach.","Wyrównać górne płoty do jednej linii, furtki w tym samym miejscu.",1),
(5,(116,36,120,110),"Wewnętrzna krawędź wschodniego muru ma przerywany pas białych kresek (artefakt łączenia kafla) na całej długości.","Sprawdzić autokafel/okładzinę muru, zastąpić ciągłym kaflem krawędzi.",1),
(1,(39,97,48,106),"Ciemne rozmyte plamy trawy wokół studni-kapliczki wyglądają jak brudne smugi, nie jak cień.","Usunąć plamy lub zastąpić jednolitym cieniem budynku.",1),
(1,(60,43,76,56),"Prawa (i lewa) połowa rynku to płaska pusta bruk-plansza bez elementów poza straganami po bokach.","Dodać ławki, beczki, kwietniki, lampy w równych odstępach.",1),
(1,(1,91,30,106),"Duży trawnik z pojedynczymi sosnami i drzewem rozsianymi bez ładu (nierówne odstępy), obok luźny kamień i kępki.","Posadzić regularny szpaler lub grupę, usunąć pojedyncze kamienie.",1),
(1,(75,65,93,88),"Duże puste ugory (4 prostokąty klepiska bez roślin, tylko jedna działka obsadzona) - nudne brązowe płaszczyzny.","Obsadzić wszystkie działki rzędami albo dać trawę/kopce.",1),
(3,(116,112,120,119),"Narożnik SE muru: kawałek muru (118,115-119) urwany przy wieży, płot bez zakończenia.","Dokończyć narożnik wieżą i zamknięciem płotu.",1),
(1,(16,17,25,21),"Płat ciemniejszego bruku (17-23,18-19) na tle jasnego chodnika przed katedrą - dziwna łata koloru.","Ujednolicić bruk albo obrysować krawężnikiem.",1),
(5,(68,0,73,6),"Drzewo wyrasta z czoła murów przy tawernie (pień ucięty linią muru).","Przenieść drzewo na plac lub usunąć.",1),
],
111:[
(1,(22,0,100,29),"Gigantyczna pusta łąka na północy: tylko losowe szare plamy gruzu o dziwnych kształtach, brązowe łaty, pojedyncze sosny/krzaki i urwane kawałki płotu (35-37,23-28).","Zagospodarować (pola, sad, pastwisko z płotem) albo uprościć: usunąć plamy i luźne rekwizyty, zostawić dwie grupy drzew.",3),
(1,(30,98,110,119),"Południowy ugór: rozlane brązowe/ciemnozielone plamy bez kształtu, pojedyncze beczki, koła, kamienie, łopata - chaos i pustka.","Wyrównać, dodać ścieżkę, pola lub las; usunąć losowe plamy.",2),
(3,(34,109,56,119),"Wybieg/pole na południu: płot ma tylko górę i prawy bok, lewy z dziurą (y116-117), brak dolnego boku - ogrodzenie urwane.","Domknąć płot z czterech stron z furtką.",2),
(3,(106,34,119,42),"Początek fosy urywa się nagle prostokątnym wycięciem: ciemne pobocza zaczynają się w y=37, brązowa łata w rogu (115-117,35-37), droga wpada wprost w fosę.","Zakończyć fosę zaokrąglonym czołem/skarpą i poprowadzić drogę do mostu.",2),
(3,(106,98,119,108),"Koniec fosy: wypełnienie kończy się nierówno w y=106, ciemne pobocze urywa się w y=105, mur z przerwą (117,105-107).","Zamknąć fosę równą krawędzią, uzupełnić mur.",2),
(1,(109,40,118,100),"Fosa to płaska brązowa równina 8x60 z kilkoma chwastami - bardzo pusta i nudna.","Dodać wodę/błoto, trzcinę, kamienie albo zasypać część.",2),
(5,(107,58,111,72),"Skarpa fosy: do y~63 ciemnozielona kamienna, niżej brązowa - dwa różne style krawędzi.","Ujednolicić pobocza fosy.",1),
(2,(17,33,22,95),"Szpaler sosen przy zachodnim płocie: nierówne odstępy (luki 43-57), drzewa nachodzą na siebie (65-68), brak osi względem płotu.","Posadzić drzewa równo co 3 kratki wzdłuż płotu.",2),
(3,(12,30,26,66),"Kanciasty schodkowy brzeg morza (prostokątne stopnie co 1-3 kratki) z ciemnym obrysem.","Zaokrąglić brzeg większymi łukami (Shore chunks) lub poprowadzić prosto.",1),
(2,(103,0,112,32),"Droga północna ma przewężenia (talie) w y=10-12 i 25-27 i nierówną szerokość.","Wyprostować drogę do stałej szerokości.",1),
(1,(32,21,48,30),"Luźne kawałki płotu (35-37,23-28 i 43,25) bez celu oraz pojedynczy krzak i kamienie.","Usunąć lub dokończyć w pełny płot.",1),
(5,(36,70,41,78),"Cienie budynków jako ostro zakończone ciemne prostokąty obok ścian (także (89,42)).","Zastąpić miękkim cieniem (Cienie.js) lub usunąć.",1),
],
24:[
(1,(0,20,120,58),"Wielka pusta zielona równina na północ od posiadłości (120x38) - tylko kilka kęp drzew i szarych plam, żadnej treści.","Dodać las, pola, drogę dojazdową, ogrodzone łąki albo przyciąć mapę.",3),
(3,(0,12,120,22),"Kanciasty schodkowy brzeg morza na północy - proste kąty, ostre stopnie.","Zaokrąglić brzeg (Shore chunks) lub dać klif/skarpę.",2),
(1,(0,88,40,114),"Południowo-zachodni trawnik: szare plamy gruzu, ciemne rozlane zielone łaty i pojedyncze sosny bez układu.","Uporządkować: usunąć plamy, zrobić zagajnik lub sad.",2),
(3,(19,88,25,115),"Wolno leżące kawałki bruku (20-24,89-91; 20-23,97-98; 20-22,102-103; 20-23,113-114) na trawie - urwane fragmenty ścieżki.","Dorysować pełną ścieżkę/chodnik albo usunąć.",2),
(2,(23,96,29,106),"Droga ma przewężenie (25-27,101-103) i nierówne ścianki.","Wyprostować drogę do stałej szerokości.",1),
(1,(48,75,58,89),"Przybudówka/studnia z wozem, drewutnią i płotami: drzewa (czerwone, sosna) wchodzą na dach szopy, urwane odcinki płotu - ciasno, bez ładu.","Odsunąć drzewa, zamknąć płot, ułożyć w prostokątny dziedziniec.",2),
(5,(47,52,60,82),"Jaśniejszy prostokątny płat trawy z ostrymi bokami na wschód od posiadłości - sztuczna łata koloru.","Rozmyć/usunąć płat lub nadać naturalny kształt.",2),
(3,(18,57,27,67),"Ruina muru: poszarpane, urwane szczątki ścian z czarnym otworem, wygląda na ucięte.","Dokończyć ruinę kompletnym narożnikiem z gruzem wokół.",1),
(1,(3,31,25,46),"Zagajniki: sosny i jabłonie wymieszane w ciasne kępy, drzewa nachodzą na siebie.","Rozdzielić gatunki, zachować odstępy.",1),
(1,(63,63,93,83),"Kępki kwiatów w kształtach krzyżyków rozrzucone pasami, wyglądają jak losowy szum.","Zebrać w kilka zwartych rabat.",1),
]}
for mid,L in F.items():
    mp=kadry.load(mid); od="docs/audyt_map/Map%03d"%mid; os.makedirs(od,exist_ok=True)
    full=kadry.mapylib.render(mp,scale=0.2).convert("RGB"); fd=ImageDraw.Draw(full); c=48*0.2
    out=[]
    for i,(k,b,co,jak,w) in enumerate(L,1):
        x0,y0,x1,y1=b; mx0,my0,mx1,my1=max(0,x0-4),max(0,y0-4),min(120,x1+5),min(120,y1+5)
        if mx1-mx0>40: mx0,mx1=x0,x1+1
        if my1-my0>40: my0,my1=y0,y1+1
        sc=0.75 if (mx1-mx0)<=24 and (my1-my0)<=24 else (0.5 if (mx1-mx0)<=40 else 0.25)
        im=kadry.mapylib.render(mp,region=(mx0,my0,mx1,my1),scale=sc).convert("RGB"); d=ImageDraw.Draw(im); cc=48*sc
        d.rectangle([(x0-mx0)*cc,(y0-my0)*cc,(x1+1-mx0)*cc,(y1+1-my0)*cc],outline=(255,0,0),width=3)
        p="%s/%02d.png"%(od,i); im.save(p)
        fd.rectangle([x0*c,y0*c,(x1+1)*c,(y1+1)*c],outline=(255,0,0),width=2); fd.text((x0*c+3,y0*c+2),str(i),fill=(255,255,0))
        out.append({"kat":k,"x0":x0,"y0":y0,"x1":x1,"y1":y1,"co":co,"jak":jak,"waga":w,"obraz":p})
    full.save("docs/audyt_map/Map%03d_przeglad.png"%mid)
    json.dump(out,open("docs/audyt_map/Map%03d.json"%mid,"w",encoding="utf-8"),ensure_ascii=False,indent=1)
    from collections import Counter
    print(mid,len(out),sorted(Counter(o["kat"] for o in out).items()))
