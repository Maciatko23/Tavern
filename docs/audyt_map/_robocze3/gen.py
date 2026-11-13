import sys,json,os
sys.path.insert(0,"docs/audyt_map/_robocze3"); sys.path.insert(0,"tools/mapy")
import rc, mapylib
from PIL import ImageDraw
F={4:[],3:[],20:[]}
def f(m,kat,box,co,jak,waga): F[m].append(dict(kat=kat,x0=box[0],y0=box[1],x1=box[2],y1=box[3],co=co,jak=jak,waga=waga))
# ---- Map 4
f(4,3,(72,38,77,58),"Ciemny grunt lasu urywa się pionową, prostą krawędzią na x=74-75 przez ok. 20 kratek (y 38-58); kontrast z jasną łąką jak cięcie nożem.","Poszarpać krawędź plamami przejściowymi (jasno-ciemne kępy trawy, kilka drzew i krzaków na granicy), zamiast prostej linii.",3)
f(4,3,(94,30,103,60),"Wschodni brzeg lądu (x 96-102, y 0-120) to ostre schodki pod kątem prostym - kanciaste, zamiast obłego brzegu; długie proste odcinki co kilka kratek.","Wygładzić linię brzegu: łagodne zatoki/cyple, odcinki skośne 2:1, pas piasku/kamieni i trzcin; unikać schodków o równej długości.",2)
f(4,1,(30,62,60,90),"Ogromny pusty, jednolity płat łąki (ok. 90x60 kratek na południu/środku) - kilka samotnych sosen i kamyków, żadnego punktu orientacyjnego, nuda i wrażenie 'niedokończonej' mapy.","Dodać krajobraz: kępy drzew z podszytem, strumyk/staw, ścieżkę do czegoś, stóg, pastwisko z płotem, głaz-landmark, zróżnicowanie kolorów trawy.",3)
f(4,2,(3,53,27,58),"Siedem sosen stoi w jednej poziomej linii (y 54-57, x 4-26), nierówne odstępy: wygląda na szereg posadzony przez generator, nie las.","Rozrzucić naturalnie (grupy 2-4 drzew różnej wielkości) albo zrobić świadomy równy szpaler z równymi odstępami.",2)
f(4,3,(0,46,11,51),"Ścieżka z zachodniej bramy (y 47-49) kończy się w polu na x=9 kwadratowym kikutem - dojście donikąd.","Poprowadzić ją dalej i połączyć z główną drogą (x 11-23) albo zakończyć placykiem/ławką.",2)
f(4,3,(73,34,81,39),"Plama ścieżki w kształcie hantli (x 74-80, y 35-37) z rzędem gałęzi, urwana w środku łąki, bez początku i końca.","Usunąć albo przedłużyć do drogi; krzaki rozproszyć, nie w prostym rzędzie.",2)
f(4,5,(19,66,26,73),"Szeroka (4 kratki) prosta droga w dół (x 21-24, y 60-80) ma przewężenie do 1 kratki na y 68-70 - dwa kawałki autotile nie pasują; to samo na (11,98) i (11,113).","Wyrównać szerokość drogi; połączyć w jedną krawędź, dodać lekki zakręt zamiast prostej rury.",2)
f(4,1,(23,81,37,91),"Pole kamieni i gałęzi (x 24-36, y 82-90): rzędy krzaków w idealnie prostych liniach i rozsypane głazy bez grupowania - wygląda jak wzorek, nie rumowisko.","Zgrupować głazy w 2-3 kopce, krzaki wokół nich, resztę oczyścić; dodać trawę/ścieżkę wokół.",2)
f(4,1,(0,69,5,76),"Ciemnoszara, nieregularna plama przy murze (x 1-3, y 70-74) - nie wiadomo co to (kałuża? błoto?), wygląda jak błąd rysunku.","Zamienić na kałużę z brzegiem, ścieżkę lub trawę.",1)
f(4,1,(7,45,13,57),"Dwie wysokie sosny jedna nad drugą (x 10, y 47-53) stykają się pniem w koronę - wyglądają jak jedno krzywe drzewo.","Rozsunąć o min. 2 kratki albo zrobić jedno drzewo i dodać obok.",1)
f(4,1,(66,62,92,84),"Gaj sosen (x 70-90, y 64-81) jak owalna plama w pustej łące: gęsty w środku, ostry brzeg bez podszytu, krzaków i zmiany koloru ziemi.","Dać podszyt (paprocie, krzaki, ciemniejsza trawa pod koronami), nieregularny brzeg i polanę w środku.",2)
f(4,3,(0,13,4,20),"Brama w zachodnim murze (y 15-17): wieża nad i pod przerwą jest ucięta (dolna połowa kafla wieży na y 15, górna na y 18), przejście zaczyna się od przeciętych bastei.","Zakończyć mur pełnymi wieżami po obu stronach bramy (kafle wież kompletne), dodać obramowanie bramy.",2)
# ---- Map 3
f(3,5,(41,32,57,38),"Północny płot działki (y 34, x 42-77): korony i pnie sosen stoją dokładnie na linii płotu (x 43-56) - drzewa wrośnięte w płot, część słupków zasłonięta.","Odsunąć drzewa o 1-2 kratki od płotu albo wyciąć dla nich lukę w płocie.",2)
f(3,3,(62,34,68,46),"Prostokątny las wewnątrz działki kończy się pionową, prostą krawędzią na x=64-65 (y 35-47) - ślad po zamianie prostokątów; za linią równa trawa.","Rozluźnić brzeg lasu: pojedyncze drzewa i kępy wychodzące na polanę, poszarpany obrys.",2)
f(3,1,(62,46,76,59),"Skupisko kamieni, rud i splotów gałęzi (x 63-75, y 48-58): elementy nachodzą na siebie, trzy rodzaje śmieci w jednym kłębie, plama ciemnej trawy z prostym brzegiem pod spodem.","Zrobić 2-3 czytelne kopce (głazy razem, gałęzie razem), między nimi ścieżka/czysta trawa; plamę trawy rozmyć.",2)
f(3,1,(63,45,67,49),"Ciemnoszara plamka (x 64-65, y 46-47) przy ścieżce - jak dziura w mapie / niedokończona kałuża.","Usunąć albo zrobić jako kałużę/dziurę z obramowaniem.",1)
f(3,1,(99,19,108,41),"Kilka ciemnoszarych, postrzępionych smug na pustej łące (x 100-103,y 20-23; x 103-106,y 35-40; x 106-107,y 44-46; także x 7-10,y 70-74) - wyglądają jak błędy tła.","Zamienić na kałuże/błoto z gładkim brzegiem lub usunąć.",2)
f(3,3,(75,10,84,17),"Wschodni koniec drogi (x 76-82, y 12-15) rozpada się na poszarpane okruchy i kończy donikąd w pustej łące.","Doprowadzić drogę do celu albo zakończyć zaokrąglonym placykiem.",2)
f(3,5,(39,2,50,7),"Fragment muru na górze (x 40-47, y 3-4) wystaje w dół jak urwane półkole, ze stojącą na nim sosną - wygląda na ułamany kawałek.","Wyrównać do linii muru (y 2) albo dokończyć jako basztę z narożnikami; sosnę odsunąć.",2)
f(3,5,(21,34,34,53),"Ruina-krater (x 22-32, y 35-51): obrys skarpy ma poszarpane schodki i cienką ciemną obwódkę, prawy bok to prosta pionowa ściana, na dole pojedynczy czarny kafel (30,49) - składane z kawałków, które się nie zgrywają.","Przebudować jednym spójnym kształtem klifu (narożniki, schodki co 1 kratkę), usunąć czarny kafel, dorobić dojście od drogi.",3)
f(3,1,(30,62,60,90),"Cały obszar na południe od działki (y 60-95, x 0-120) to pusta trawa z samotnymi sosnami - bardzo nudny, 'wygenerowany' wygląd.","Dodać kępy drzew z podszytem, polanę, kamienie, ścieżkę/zagrodę; usunąć pojedyncze sosny w równej siatce.",3)
f(3,1,(91,68,112,87),"Gaj (x 93-110, y 70-85) to owalna kępa sosen na pustej łące, bez podszytu i bez zmiany podłoża, z ostrym brzegiem.","Dodać podszyt, ciemniejszą trawę, kilka pni/kłód, nieregularny obrys.",2)
f(3,5,(74,40,80,48),"Wschodnia bramka płotu (x 77, y 41-46): luka w płocie bez słupków bramnych, a droga kończy się poszarpanym kikutem przed linią płotu.","Dodać słupy bramne i dokończyć drogę przez bramę na zewnątrz.",2)
f(3,5,(40,44,47,51),"Zachodnia luka w płocie działki (x 42, y 46-49): płot urywa się bez słupków bramnych; droga wchodzi w bok.","Dodać słupy bramne po obu stronach i wyrównać drogę przez lukę.",1)
f(3,6,(73,33,79,60),"Płot działki: pionowe odcinki (x 42 i x 77) to cienkie pojedyncze słupki, a poziome mają grube dwuprzęsłowe belki - dwa różne wyglądy płotu w jednym ogrodzeniu.","Użyć jednego typu płotu (narożniki + boki z tej samej rodziny kafli).",2)
# ---- Map 20
f(20,3,(31,42,36,55),"Przy zachodnim płocie działki (x 31-36, y 43-55) leży płat innej, grubo teksturowanej ciemnej trawy z blokowymi, schodkowymi krawędziami - ostro odcina się od gładkiej trawy w środku działki i nie pasuje do jej stylu.","Zastąpić tą samą trawą co w środku albo zmiękczyć obrys kępami i krzakami; płat nie powinien dochodzić do samego płotu.",2)
f(20,3,(55,40,70,55),"Wschodnia granica działki: ciemny kwadratowy płat trawy (x 58-68, y 38-53) ma proste kanty, jedna krawędź idealnie wzdłuż płotu x=57 - bardzo kanciasty.","Zaokrąglić obrys płata, przerwać go kępami innej trawy, dodać krzaki na brzegu.",3)
f(20,3,(0,42,31,51),"Pas ciemnej trawy (x 0-30, y 44-49): górna krawędź to prosta pozioma linia na całej długości - wygląda jak prostokąt.","Zrobić nieregularny obrys, pozrywać pas na kilka płatów.",2)
f(20,5,(34,34,49,41),"Sosny rosną na linii północnego płotu (x 37-38 y 38-40 i x 45-46 y 36-38) - pnie wchodzą w płot, korona zasłania słupki.","Przesunąć drzewa poza płot lub usunąć fragmenty płotu pod koronami.",2)
f(20,5,(53,42,58,48),"Sosna (x 54-56, y 43-47) stoi przy samym płocie wschodnim i przy zagrodzie na siano - ściśnięte, zasłania zagrodę i płot.","Przesunąć sosnę o 2-3 kratki na zewnątrz ogrodzenia.",2)
f(20,5,(38,50,45,58),"Sosna (x 40-41, y 52-56) stoi na południowym płocie i zasłania poprzeczki; pod nią dużo rozproszonych kwiatków i pieńków - bałagan.","Przesunąć drzewo, kwiaty zgrupować w jedną rabatę.",2)
f(20,2,(53,50,59,56),"Południowo-wschodni róg ogrodzenia: dolny płot kończy się na x=55, a pionowy słupek wschodni sięga y=53 - narożnik się nie domyka (szpara ok. 1 kratki).","Dodać narożny słupek/przęsło, żeby płoty się stykały.",2)
f(20,2,(34,50,39,56),"Południowo-zachodni róg: pionowy płot schodzi do y=53, a dolny zaczyna się dopiero od x=37 - krzywy, niedomknięty narożnik.","Dodać narożnik i wyrównać długość płotów.",1)
f(20,5,(44,48,49,56),"Wąski, jednokratkowy pasek kamiennej ścieżki (x 46, y 50-53) odchodzi od chaty do furtki: cienka kropkowana linia niepasująca do szerokiej gliniastej drogi.","Zastąpić normalną ścieżką tej samej szerokości lub usunąć.",1)
f(20,6,(36,39,44,48),"Zagroda lewa (x 37-42, y 41-46): rozłożyste liściaste drzewo w jaśniejszej, innej palecie niż ciemne sosny i ściany chaty; do tego stos kamieni i kłoda w zagrodzie - styl i skala odstają.","Zamienić na drzewo z tego samego zestawu (jabłoń/sosna) lub dopasować kolory; uprościć wnętrze zagrody.",2)
f(20,1,(63,59,73,69),"Okruchy ścieżki bez połączenia (x 65-71, y 60-68) i drugi kawałek (x 83-88, y 62-68) - luźne plamy gliny bez początku i końca.","Połączyć w drogę lub usunąć.",2)
f(20,1,(13,13,18,23),"Cienki pionowy pasek ścieżki (x 15, y 15-21) obok szerokiej drogi - wygląda jak zadrapanie.","Usunąć albo zlać z szeroką drogą.",1)
f(20,3,(32,13,40,22),"Prostokątna plama gliny (x 34-38, y 15-20) z prostymi bokami, wyrwana z kontekstu.","Zaokrąglić, dodać ślady do ścieżki lub zamienić na trawę.",2)
f(20,1,(75,7,84,13),"Pozioma, 'falbaniasta' plama gliny (x 76-82, y 9-11) - wstęga w środku łąki bez sensu.","Usunąć albo zamienić na zaokrąglony placyk.",1)
f(20,3,(92,30,101,58),"Wschodni brzeg (x 97, y 30-60) to idealnie pionowa linia na 30 kratek - bez zatoczek; południowo-wschodni narożnik to równe schodki.","Powyginać linię brzegu, dodać cyple/zatoki i pas piasku.",2)
f(20,1,(5,68,28,87),"Dwa gaje (x 8-25, y 70-85 oraz x 52-70, y 68-83) to owalne kępy sosen w pustej łące; reszta południa (y 58-90) pusta i jednolita.","Dodać podszyt i polany, rozrzedzić brzegi gajów, wypełnić łąkę elementami (kamienie, krzaki, ścieżka).",2)

def run():
    from collections import Counter
    for m,lst in F.items():
        os.makedirs("docs/audyt_map/Map%03d"%m,exist_ok=True)
        for i,d in enumerate(lst,1):
            pad=3; x0=max(0,d['x0']-pad);y0=max(0,d['y0']-pad);x1=min(119,d['x1']+pad);y1=min(119,d['y1']+pad)
            w=x1-x0+1; sc=0.75 if w<=40 and (y1-y0)<=32 else 0.6
            p="docs/audyt_map/Map%03d/%02d.png"%(m,i)
            rc.crop(m,x0,y0,x1,y1,p,sc,box=(d['x0'],d['y0'],d['x1'],d['y1']))
            d['obraz']=p
        json.dump(lst,open("docs/audyt_map/Map%03d.json"%m,"w",encoding="utf-8"),ensure_ascii=False,indent=1)
        mp=rc._c[m]; im=mapylib.render(mp,scale=0.15).convert("RGB"); dr=ImageDraw.Draw(im); s=48*0.15
        for i,d in enumerate(lst,1):
            dr.rectangle([d['x0']*s,d['y0']*s,(d['x1']+1)*s,(d['y1']+1)*s],outline=(255,0,0),width=2)
            dr.text((d['x0']*s+3,d['y0']*s+2),str(i),fill=(255,255,0),font=mapylib.font(14,True))
        im.save("docs/audyt_map/Map%03d_przeglad.png"%m)
        print(m,len(lst),sorted(Counter(d['kat'] for d in lst).items()))
run()
