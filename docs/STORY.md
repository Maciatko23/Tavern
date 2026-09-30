# Tawerna "Pod Złotym Kuflem" — dokument fabularny

## Przesłanka

Tawerna, wokół której toczy się gra (sama gra zaczyna się w domu dziadka
bohatera — patrz „Rozdział 1: Dług dziadka”), stoi na fundamentach dawnej twierdzy —
**Twierdzy Kruczych Skał**. Nikt we wsi nie traktuje tego poważnie: to dla nich
stara ciekawostka, temat na piosenkę biesiadną, nie fakt historyczny.
W piwnicach tawerny wciąż stoją oryginalne kamienne mury zamku, a gdzieś pod
nimi kryje się reszta twierdzy — nietknięta od pokoleń.

Twierdza nie broniła granicy ani szlaku handlowego. Zbudowano ją w jednym celu:
by strzec **Serca Twierdzy** — relikwii, wokół której cała budowla powstała.

## Centralny sekret: Serce Twierdzy

Serce Twierdzy to nie zwykły skarb i nie "uwięzione zło". To relikwia, która
pokazuje **absolutną, bezlitosną prawdę** każdemu, kto się do niej zbliży —
nie tylko fakty, ale wszystko naraz: kto cię zdradzi, jak umrzesz, co bliscy
naprawdę o tobie myślą, jaka jest prawdziwa cena każdego wyboru. Nie ma w tym
złej woli. Prawda po prostu nie filtruje się sama, a ludzki umysł nie jest
zbudowany, żeby znać wszystko naraz.

Zakon nie budował twierdzy, żeby chronić świat przed relikwią jak przed
potworem — budował ją, żeby **dawkować** dostęp do prawdy, którą Serce
oferuje bez pytania o pozwolenie. Nowicjusze dostawali jedno, ściśle
odmierzone pytanie rocznie. To wystarczało, by utrzymać zakon przy zdrowych
zmysłach przez pokolenia.

Twierdza nie upadła w wyniku oblężenia ani zdrady w klasycznym sensie. Upadła,
gdy jeden z ostatnich strażników — z dobrych, ludzkich powodów (chciał wiedzieć,
czy żona go kocha; czy twierdza przetrwa; czy zaufany przyjaciel go zdradzi)
— zaczął wracać do Serca po "jeszcze jedną" prawdę, ponad przydzielony limit.
To, co w końcu zobaczył, złamało go całkowicie — i w rozpaczy zrobił coś, co
otworzyło twierdzę na zagładę (nie musi to być akt agresji: równie dobrze mógł
po prostu przestać dbać o wardy, bo nic już nie miało dla niego znaczenia).
To, co ocalało z zakonu, ukryło relikwię głębiej, zapieczętowało dostęp i
rozgłosiło wersję o "opuszczonej, przeklętej ruinie" — wystarczająco
przerażającą, by nikt nie próbował kopać głębiej. Kilka pokoleń później na
gruzach stanęła tawerna. Budowniczy nie mieli pojęcia, na czym stawiają dach.

**Ton fabuły jest celowo mieszany i stopniowo mroczniejszy**: gra zaczyna się
jako ciepła, zabawna tawerna z wyrazistymi gośćmi, a prawda wychodzi na jaw
warstwami — im głębiej (dosłownie, pod ziemię), tym mniej to już zabawne.

## Struktura trzyaktowa (szkielet, do rozbudowy)

1. **Akt I — Tawerna.** Gracz poznaje karczmarza i gości, słyszy strzępki
   legend traktowanych jako żart. Pierwszy namacalny hak: ukryte przejście
   (dźwignia w regale/kominku) prowadzące do starych piwnic zamkowych —
   odkrycie, że legenda ma fizyczny fundament.
2. **Akt II — Ruiny pod spodem.** Gracz eksploruje ocalałe fragmenty twierdzy:
   kaplicę zakonu, kwatery strażników, pierwsze zapiski wskazujące, że
   "klątwa" to w rzeczywistości udokumentowana historia, nie przesąd. Pojawia
   się rywal/zagrożenie z zewnątrz, które też szuka Serca.
3. **Akt III — Prawda o Sercu.** Gracz dociera do samego Serca Twierdzy i musi
   zdecydować, co z nim zrobić:
   - **Zniszczyć** — chroni ludzi przed nieznośną wiedzą, ale traci się jedyne
     źródło pewności w świecie pełnym kłamstw.
   - **Zająć miejsce strażnika** — przejąć brzemię i dawkować prawdę innym tak
     jak robił to zakon; gorzko-słodkie zakończenie, gracz izoluje się jak
     dawni strażnicy.
   - **Uwolnić prawdę dla wszystkich** — utopijny odruch, który natychmiast
     idzie źle: wioska, w której każdy zna każdy sekret, nie staje się
     szczera, tylko się rozpada.
   - **Zapieczętować na nowo, ale z realnymi zasadami użycia** — rozwiązanie
     "szare", uczciwe wobec tego, co się stało zakonowi.

## Rozdział 1: Dług dziadka (nowy początek gry, w grze: Story.js)

Nowa gra zaczyna się w domu dziadka bohatera. Stare zapisy grają po staremu.

- **Dziadek Stach** — dziadek bohatera (inna postać niż Dziadek Ozzy
  z tawerny). Jest winien pieniądze Lordowi i pozwala wnukowi budować na
  swoim polu za lasem („Pole dziadka”, Map003) — tylko tam wolno budować.
- **Lord Leopold Zaleski** — mieszka w pięknym dworze obok tawerny
  (Posiadłość Lorda, Map024). Za dnia (8–20) stoi przed drzwiami dworu
  i przyjmuje spłatę, nocą przez drzwi odzywa się jego kamerdyner
  **Feliks**, który też przyjmuje pieniądze.
- **Dług:** 2500 G do dnia 60. Pieniądze liczą się jeszcze w nocy po
  terminie, do świtu (6:00) dnia 61. O świcie ludzie Lorda przychodzą
  zmierzyć pole — jeśli dług nie jest spłacony, pole przepada i gra się
  kończy (można wczytać zapis). Przypomnienia: listy od Lorda w dniach 20,
  40, 55, 59 i 60.
- **Praca:** Borgar zatrudnia bohatera; zmiana w tawernie (od 16 do 21, raz
  dziennie, 4 godziny) to cztery mini-gry, płaca od wyniku + napiwki.
  Borgar skupuje też towar.
- **Koniec rozdziału:** spłata całości — pole zostaje przy rodzinie,
  dziadek dziękuje (pokwitowanie przynosi Feliks).
- **Haczyk (propozycja, do potwierdzenia):** przy ostatniej spłacie Lord
  (albo Feliks) wspomina rodzinną bajkę: dwór postawiono z kamieni dawnej
  Twierdzy Kruczych Skał, najstarsze leżą pod tawerną, a „pod Kruczymi
  Skałami są drzwi, których nikt nie powinien otwierać”. Lord traktuje to
  jak bajkę dla dzieci — nie wiadomo jeszcze, czy dwór ma związek z
  frakcją, która wynajęła Gruma (patrz „Otwarte wątki”).

## Postacie (przepisane pod fabułę)

Istniejący NPC-e z tawerny nie są przypadkowi — każdy dostaje rolę w fabule:

- **Borgar Kowal (Karczmarz)** — nieświadomy potomek ostatniego kasztelana/
  dozorcy zakonu. Odziedziczył po rodzinie dziwny, niewytłumaczony nawyk:
  "nie pytaj o to, czego naprawdę nie chcesz wiedzieć" — powtarza to gościom
  jak żart, nie wiedząc, że to dosłowna zasada przetrwania jego przodków.
  Jego łuk fabularny: od "to tylko stara plotka" do konfrontacji z rodzinną
  tajemnicą.
- **Melia Srebrogłosa (Bard)** — jej ballady zawierają fragmenty prawdziwej
  historii — sama nie wie, skąd je zna, i traktuje je jako "natchnienie".
  Naturalne źródło poszlak podawanych "w przebraniu" piosenki.
- **Grum Żelazna Pięść (Najemnik)** — nieprzypadkowo wypytuje o góry/jaskinie
  na wschodzie. Wynajęła go frakcja (np. dwór, sztab wojskowy, gildia
  szpiegów), która chce Serca jako **narzędzia absolutnej pewności** — koniec
  z niepewnością w polityce, na dworze, na polu bitwy. Nie jest czarnym
  charakterem 1:1: wierzy, że robi coś praktycznego i racjonalnego, nie widzi
  jeszcze, jaki to koszt dla ludzi, których to dotknie — okazja na moralną
  szarość (można go przeciągnąć na stronę gracza albo nie).
- **Dziadek Ozzy (Stały bywalec)** — jako chłopiec kiedyś przypadkiem wpadł
  do zapomnianej piwnicy i miał krótki, niekontrolowany kontakt z Sercem.
  Od tamtej pory od czasu do czasu mówi rzeczy, których nie mógłby znać —
  ale zawsze w formie pijackiego bełkotu, więc nikt nigdy nie potraktował go
  poważnie. Komediowy nośnik prawdziwych, czasem niewygodnych wskazówek.

## Mechaniki odkrywania (do wdrożenia)

- **Sekretne przejście** w obecnej sali tawerny (np. dźwignia ukryta w
  regale przy kominku lub luźna cegła w murze) — pierwszy krok do piwnic.
  To najbliższy, konkretny kawałek do zaimplementowania w Map001.
- Warstwowe poszlaki: piosenki Melii, bełkot Ozzy'ego, zapiski/inskrypcje w
  ruinach — każde źródło daje inny kawałek tej samej układanki.
- Self-switche/zmienne do śledzenia postępu odkrycia prawdy (np. ile
  fragmentów historii gracz już poznał), które mogą odblokowywać nowe
  kwestie dialogowe u istniejących NPC-ów.
- **Prawdy jako przedmiot wyboru:** im bliżej Serca, tym gracz sam zaczyna
  poznawać niewygodne prawdy o NPC-ach (drobne na początku, cięższe później).
  Naturalny hak na dialogi rozgałęzione: gracz może komuś powiedzieć poznaną
  prawdę albo przemilczeć — z konsekwencjami dla relacji z tą postacią.

## Wyspa (propozycja, 2026-09-29)

Robocza nazwa: **Krucza Wyspa**. Strona z mapką i kartami miejsc: artefakt „Atlas Kruczej Wyspy”. Wszystko poniżej to propozycja do
wyboru - to, co już jest w grze, jest oznaczone numerem mapy.

### Świat: wojna na kontynencie

Na głównym kontynencie trwa wojna. Jej prawdziwy powód zna niewielu: strony szukają **reliktu, który daje absolutną pewność** - Serca
Twierdzy. Kto je zdobędzie, zna plany wroga, zdrajców we własnym obozie i wynik bitwy, zanim się zacznie. Wyspa jest ziemią niczyją,
kilka godzin promem od lądu - i właśnie dlatego ciągną na nią wszyscy: uchodźcy, dezerterzy, szpiedzy, werbownicy i poszukiwacze reliktu.
Frakcja, która wynajęła Gruma, to jedna ze stron tej wojny (otwarte: która i czy ma swoich ludzi we dworze Lorda).

Wojna nie jest w grze tłem z napisu - dociera na wyspę falami: po bitwie przypływa więcej uchodźców, wojsko rekwiruje zboże, rosną ceny,
w tawernie pojawiają się nowi goście z nowymi sprawami.

### Tawerna jako scena intryg

- **Stali bywalcy** (Borgar, Melia, Grum, Ozzy, Wanda, mieszkańcy miasteczka): każdy ma swoje miejsce na wyspie, do którego prowadzi jego
  wątek - latarnik, leśniczy, szeptucha, celnik, kapral z garnizonu.
- **Goście tymczasowi** przypływają promem i odpływają; ich sprawy są jednorazowe i zależą od stanu wojny (szpieg, który musi zniknąć przed
  świtem; wdowa szukająca męża-dezertera; kupiec, który sprzedaje „odłamek reliktu”).
- **Pokoje** jako scena: rozmowa podsłuchana przez ścianę, list zostawiony w pokoju, gość, który nie płaci i znika, zamiana kluczy.
- Mechanika odkrywania prawd (sekcja wyżej) działa tu najlepiej: im bliżej Serca, tym więcej gracz wie o gościach - i sam decyduje,
  komu to powiedzieć.

### Miejsca już w grze

- **Tawerna „Pod Złotym Kuflem”** (Map001, piętra Map025 „Pokoje gości”, Map026 „Apartamenty”) - na fundamentach Twierdzy Kruczych Skał.
- **Piwnica tawerny i luźna cegła** (Map009) - pierwsze wejście w głąb.
- **Posiadłość Lorda Zaleskiego** (Map024) - dwór z kamieni twierdzy; dług dziadka.
- **Dom dziadka Stacha i podwórze** (Map019, Map020), **Pole dziadka** (Map003).
- **Drogi i łąki**: Leśna droga (Map021), Polna droga (Map022), Skraj lasu (Map023), Łąki (Map004, Map017, Map018).
- Mapy w projekcie do podpięcia: Okolice Tawerny (Map008), Ruiny Zamku (Map010), Komnata Serca (Map011), Mroczny Las (Map012), Góry (Map013),
  Jaskinia (Map014), Polana (Map015), Las (Map005), Wzgórza (Map006), Brzeg Rzeki (Map007).

### Nowe miejsca - pod główną fabułę

- **Miasteczko** (obok tawerny) - rynek, kuźnia, świątynia, ratusz z sołtysem; większość stałych bywalców tu mieszka. Plotki, zlecenia,
  targ co tydzień; napięcia z garnizonem i z dworem.
- **Przystań i prom** - jedyne połączenie z kontynentem; stąd przychodzą goście tymczasowi i wieści z wojny. Celnik, przemyt, ukrywanie
  zbiega, rozkład promu. Łowienie ryb, handel.
- **Urwisko Kruków** - morska ściana wzgórza tawerny; kruki gnieżdżą się w resztkach murów. Zakon używał ich jako posłańców. Oswojony
  kruk (jak pies) przynosi listy, poszlaki, czasem cudze sekrety.
- **Latarnia na przylądku** - stoi na dawnej strażnicy zakonu. Soczewka to może odłamek Serca: we mgle pokazuje latarnikowi rzeczy, których
  nie powinien wiedzieć - poważny odpowiednik Ozzy'ego.
- **Pustelnia na klifie (skryptorium zakonu)** - ostatni żyjący strażnik albo jego uczeń; pilnuje zasady „jedno pytanie rocznie”, ma
  zaszyfrowane kroniki do odczytania. Odpowiedź na otwarty wątek o potomkach zakonu.
- **Kamieniołom i stara kopalnia** (wschodnie góry) - stąd kamień na twierdzę i dwór. Górnicy przebili się do tunelu łączącego się z
  podziemiami: drugie, groźniejsze wejście w głąb. Ruda żelaza.
- **Wrak na mieliźnie** - okręt jednej ze stron wojny, który płynął po Serce. Na pokładzie mapa wyspy z zaznaczeniami; jeden rozbitek siedzi
  w tawernie pod fałszywym imieniem.
- **Garnizon** (przy przystani) - wojsko jednej ze stron: pobór, rekwizycje zboża, spięcia z miasteczkiem. Gracz może sprzedawać plony
  wojsku albo mu podpadać.
- **Posterunek straży Lorda w miasteczku** (decyzja 2026-09-29) - garnizon w miasteczku nosi barwy Lorda Zaleskiego: to jego ludzie.
  Wiąże to dwór z wojną (otwarty wątek: czy to Lord stoi za frakcją, która wynajęła Gruma). Sprzedawca wody na rynku tylko rozmawia -
  wody nie sprzedaje (susza zostaje).
- **Stara cysterna zakonu** (pod wzgórzem) - zapas wody zakonu. Susza przed studnią zostaje: cysterna to nagroda za zejście w głąb, nie
  wczesne źródło wody.
- **Osada Milczących** (ukryta dolina w górach) - ludzie, którzy kiedyś „wiedzieli za dużo” (dotknęli prawdy) i odeszli od ludzi. Ciężkie
  miejsce na Akt II: żywy dowód, co Serce robi z człowiekiem.

### Nowe miejsca - pod questy poboczne i życie wyspy

- **Wysepka pływowa z kapliczką** - dostępna po grobli tylko w czasie odpływu; zagadka „zdążyć przed przypływem” (system czasu).
- **Bagna, błędne ogniki i szeptucha** - zielarka-znachorka, mikstury, handel ziołami; ogniki prowadzą do małych prawd (Serce w skali mikro).
- **Święty gaj ze starym dębem** - starszy niż zakon; święta: Noc Kupały (kwiat paproci - wydarzenie jednej nocy w roku), dożynki.
- **Gorące źródła** - odpoczynek (drabina odpoczynku), plotki i schadzki, spotkania przemytników.
- **Leśniczówka** - leśniczy kontra kłusownicy (biedni z miasteczka); polowania na dzika i wilki; spór, po czyjej stronie stanąć.

### Podziemia - 100 pięter w dół

Pasma tematyczne, piętra co 10 zrobione ręcznie (fabuła, bossowie, skróty i winda w górę), piętra pomiędzy składane automatycznie z
gotowych kawałków pokoi narysowanych w edytorze jako szablony (rdzeń już umie wstawiać zdarzenia na mapę). Każdy zapis ma swoje stałe
„ziarno” - piętro wygląda tak samo po powrocie.

1. **Piętra 1-10: Piwnice zamku** - fundamenty twierdzy, magazyny, pierwsze zapiski zakonu.
2. **Piętra 11-30: Kwatery i kaplica zakonu** - cele strażników, sala rytuału „jednego pytania”, cysterna.
3. **Piętra 31-50: Jaskinie i podziemna rzeka** - naturalne groty, grzyby, ruda; połączenie z kopalnią.
4. **Piętra 51-75: Ruiny starsze niż zakon** - to, co było tu przed twierdzą; kto pierwszy znalazł Serce.
5. **Piętra 76-99: Warstwa Prawdy** - szepty, halucynacje, prawdy o NPC-ach; tu gracz sam zaczyna „wiedzieć”.
6. **Piętro 100: Serce Twierdzy** - wybór z Aktu III.

## Otwarte wątki / do ustalenia później

- Nazwa i konkretny charakter frakcji, która wynajęła Gruma (dwór? wojsko?
  szpiedzy?). Czy to dwór Lorda Zaleskiego — nie przesądzone; w grze Lord
  zna tylko rodzinną bajkę o twierdzy (rozdział 1).
- Czy zakon strażników ma jakichś żyjących potomków/resztki poza Borgarem.
- Konkretna forma i wygląd Serca Twierdzy (klejnot? zwierciadło? studnia?
  coś żywego?) — coś, na co da się fizycznie "spojrzeć", skoro to ono pokazuje
  prawdę.
- Jak dokładnie wygląda "jedna prawda rocznie" w praktyce zakonu — rytuał?
  kto decydował, kto pyta?
- Rozgałęzienia w Akcie III i ich konsekwencje dla zakończenia.
- Nazwa wyspy (robocza: Krucza Wyspa) i które strony walczą na kontynencie.
- Czy Serce jest jedno, czy wojna toczy się też o jego odłamki (soczewka latarni, „odłamki” sprzedawane w tawernie).
- Jak wojna zmienia się w czasie gry (fale uchodźców, rekwizycje) - czy w rytmie dni, czy postępu fabuły.
