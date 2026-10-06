//=============================================================================
// TavernDice_Data.js
//=============================================================================
// The dice game's tables (split out of TavernDice.js, 2026-09-29): the special dice, the rivals (when they sit at the table, what
// they play for, how they play, all they say), the merchant's hint, the hero's words, the autopilot's heads. Only data - TavernDice.js
// reads it when it needs it (registered: right above TavernDice).

/*:
 * @target MZ
 * @plugindesc Dane gry w kości (TavernDice.js): kości specjalne, rywale (godziny, stawki, sposób gry, wszystko, co mówią), słowa bohatera. Sam nic nie robi. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter TawernaCore
 * @base TavernDice
 * @orderBefore TavernDice
 *
 * @help
 * ============================================================================
 * TavernDice_Data.js - dane gry w kości
 * ============================================================================
 * Same tabele dla TavernDice.js (wydzielone z niego): kości specjalne
 * (DIE_TYPES), rywale przy stole (OPPONENTS, z ich kwestiami), kolejność
 * rywali, słowa bohatera i „głowy” autopilota (testy). Nowego rywala albo
 * kość dopisuje się TUTAJ. Parametry ma TavernDice.js.
 *
 * KOLEJNOŚĆ: TavernDice_Data, TavernDice, TavernDice_Art, TavernDice_Scene.
 * ============================================================================
 */

(() => {
    "use strict";
    const TW = window.Tawerna;
    if (!TW) throw new Error("TavernDice_Data.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    // (the family's shared bag: TavernDice.js and its parts; whichever file comes first makes it)
    const P = TW.api("TavernDice_parts") || TW.register("TavernDice_parts", {});
    if (P.data) return;   // (put into the page twice: kept as it was)

    // ==================================================================
    // The dice: the plain ones and the special ones (kept in $gameSystem, not database items)
    // ==================================================================
    const DIE_TYPES = {
        std: {
            name: "Zwykła kość", short: "zwykła", w: [1, 1, 1, 1, 1, 1],
            desc: "Kość z kości, jak w każdej karczmie. Uczciwa jak Borgar przy wadze.",
            effect: "Każde oczko tak samo często."
        },
        grusza: {
            name: "Kość z gruszy", short: "z gruszy", w: [1.25, 1, 1, 1, 1.15, 1],
            desc: "Wystrugana przez Bartka Kmiecia z gruszkowego drewna. Pachnie sadem.",
            effect: "Jedynki i piątki odrobinę częściej."
        },
        wdowa: {
            name: "Kość wdowy", short: "wdowy", w: [1, 1, 1, 1, 1.9, 1],
            desc: "Czarna jak żałoba, lekka jak plotka. Dziadek Ozzy wygrał ją kiedyś od wdowy z Młynówki.",
            effect: "Piątki wyraźnie częściej (ok. 1 na 4 rzuty)."
        },
        szczesciarz: {
            name: "Kość szczęściarza", short: "szczęściarza", w: [1.8, 1, 1, 1, 1, 1],
            desc: "Szczęśliwa kość Gruma, ze złotym połyskiem i czerwonym oczkiem.",
            effect: "Jedynki wyraźnie częściej (ok. 1 na 4 rzuty)."
        },
        krucze: {
            name: "Kość z Kruczych Skał", short: "z Kruczych Skał", w: [1.7, 1, 0.8, 1, 1.3, 1], rare: true,
            desc: "Z czarnego kamienia dawnej twierdzy. Zamiast jedynki wyryty kruk. Zimna w dłoni, nawet przy ogniu.",
            effect: "Kruk (jedynka) i piątki częściej, trójki rzadziej."
        }
    };
    const SPECIAL_ORDER = ["szczesciarz", "wdowa", "krucze", "grusza"];

    // ==================================================================
    // The rivals: when they sit at the table, what they play for, how they play, what they say
    // ==================================================================
    // ai.bank[n]: the turn's points at which they write them down when n dice would be left to throw (6: after hot dice)
    const OPPONENTS = {
        grum: {
            name: "Grum Żelazna Pięść", short: "Grum", role: "najemnik", style: "ryzykant", styleColor: "#ff9b6b",
            bust: "Actor2_5", sheet: "Actor2_Tall", index: 4,
            hours: [17, 24], stakes: [10, 15, 20, 25], perDay: 3,
            ai: { bank: [0, 450, 550, 700, 1100, 2000, Infinity], reckless: 0.2, chase: 1.8 },
            die: { key: "szczesciarz", chance: 0.5, giveAfter: 4 },
            quote: "Siadaj. Tylko nie płacz potem, jak zgarnę pulę.",
            lines: {
                greet: ["Siadaj. Tylko nie płacz potem, jak zgarnę pulę.", "No proszę, ktoś odważny. Kości czekają.", "Stawiaj, chłopcze. Grum nie gra za darmo."],
                meFirst: ["Ja pierwszy. Patrz i się ucz.", "Moja kolej na start. Tak ma być."],
                heroFirst: ["Zaczynaj. I tak cię dogonię.", "Ty pierwszy. Dam ci fory. Małe."],
                myBig: ["Ha! Tak się rzuca!", "Widzisz? Szczęście sprzyja odważnym.", "No i co ty na to, chłopcze?"],
                myBust: ["Na brodę mojej matki...", "Kości dziś krzywe.", "Niech to szlag!", "Pfff. Rozgrzewka."],
                myHot: ["Wszystkie sześć! Grum się rozkręca!", "Gorące! Jeszcze raz, całą garścią!"],
                push: ["Jeszcze raz. Kto nie ryzykuje, ten nie pije.", "Mało. Rzucam dalej.", "Grum nie zapisuje drobnych."],
                bank: ["Dobra, zapisuję. Nie przyzwyczajaj się.", "Do sakwy z tym."],
                heroBust: ["Ha! Pudło! Kości cię nie lubią, chłopcze.", "Hehe. Bywa.", "I tyle z twojej tury."],
                heroHot: ["Gorące kości? Farciarz...", "Hmpf. Rzucaj, rzucaj."],
                heroBig: ["Hmpf. Zwykłe szczęście.", "Nieźle. Ale to jeszcze nie koniec."],
                heroSmall: ["Zapisujesz tak mało? Tchórzysz?", "Ostrożny jak baba na lodzie."],
                win: ["Moje! Dzięki za piwo, chłopcze.", "Pula moja. Wróć, jak urośniesz."],
                lose: ["Wygrałeś. Uczciwie. Nie myśl, że się nie odegram.", "Grr. Masz szczęście, że lubię tę karczmę."],
                lucky: ["Moja szczęśliwa kość. Nie dotykaj, bo straci moc."],
                chat: ["Słyszałeś coś o jaskiniach na wschód stąd? Nie? Szkoda.", "Za górami płacą lepiej niż Borgar. Ale kości tam gorsze.", "Najemnik bez kości to jak miecz bez ostrza."],
                give: ["Weź ją. Moja szczęśliwa kość przestała mnie lubić. Może ciebie polubi."],
                tired: ["Dość na dziś. Sakwa pusta, a duma obolała. Jutro się odegram."]
            }
        },
        ozzy: {
            name: "Dziadek Ozzy", short: "Ozzy", role: "stały bywalec", style: "ostrożny", styleColor: "#8fc7ff",
            bust: "People2_1", sheet: "People2_Tall", index: 0,
            hours: [10, 23], stakes: [5, 10], perDay: 3,
            ai: { bank: [0, 250, 300, 350, 500, 850, Infinity], reckless: 0, chase: 1.4 },
            die: { key: "wdowa", chance: 0.35, giveAfter: 3 },
            visions: true, stories: true,
            quote: "Siadaj, siadaj, młody. Stary Ozzy lubi towarzystwo.",
            lines: {
                greet: ["Siadaj, siadaj, młody. Stary Ozzy lubi towarzystwo.", "O, gość! Zagramy? Tylko nie o grube pieniądze, emerytura skromna."],
                meFirst: ["Ja zaczynam? Starszym się ustępuje, hehe."],
                heroFirst: ["Młodzi przodem. Rzucaj."],
                myBig: ["O! Widzisz? Stare ręce jeszcze umieją.", "Hehe, jak za młodu!"],
                myBust: ["Ech... Kości jak moja pamięć. Nic nie zostało.", "Pudło? No to się napiję."],
                myHot: ["Wszystkie? Ojej, a ja nawet nie celowałem!"],
                push: ["Jeszcze jeden rzut... No dobra, jeden.", "Raz się żyje, a ja żyję już dość długo."],
                bank: ["Zapisuję, zapisuję. Pewne to pewne.", "Wróbel w garści, jak mawiała moja Halinka."],
                heroBust: ["Oj, pudło. Nie martw się, mnie też się zdarza. Codziennie.", "Kości mają humory. Jak ja."],
                heroHot: ["Gorące! Uważaj, żeby się nie sparzyć, hehe."],
                heroBig: ["No, no! Pięknie rzucone!", "Ho, ho! Masz rękę do kości."],
                heroSmall: ["Rozsądnie. Rozsądnie.", "Mądrze. Pewne to pewne."],
                win: ["Hehe! Stary Ozzy jeszcze coś potrafi!", "Moja wygrana. Postawię ci za to piwo. Za twoje pieniądze."],
                lose: ["Wygrałeś uczciwie. Moja Halinka by cię polubiła.", "Ech, przegrałem. Ale jaka zabawa!"],
                lucky: ["Ta czarna? Kość wdowy. Gram nią, jak mi smutno."],
                chat: [
                    "Za moich młodych lat grało się o kury, nie o grosze. Raz wygrałem koguta. Dziobał mnie do zimy.",
                    "Moja Halinka grała lepiej ode mnie. I lepiej gotowała. Właściwie wszystko robiła lepiej.",
                    "Kiedyś jeden kupiec z miasta przegrał tu buty. Szedł do domu boso, a śpiewał!",
                    "Ta tawerna stoi na starych kamieniach, wiesz? Jako chłopak wlazłem raz do piwnicy... Hyk. Nieważne. Rzucaj.",
                    "Borgar mówi: nie pytaj o to, czego nie chcesz wiedzieć. Mądry chłopak. Po dziadku.",
                    "Grum? Dobry chłopak, tylko za dużo pyta o jaskinie na wschodzie. Po co mu jaskinie?",
                    "Kiedyś rzuciłem sześć jedynek. Nikt mi nie wierzy. Ja też już nie wierzę.",
                    "Kości trzeba ogrzać w dłoni. Tak mówił mój ojciec. Potem przegrał krowę."
                ],
                vision: {
                    bust: ["Hyk... Nic z tego nie będzie. Nic a nic...", "Widzę pustkę... Hyk. Pudło."],
                    s16: ["Wszystkie po kolei... od jedynki do szóstki... hyk."],
                    straight: ["Po kolei... ładnie po kolei, jak kaczki..."],
                    kind: ["{w}... hyk... tak mi się widzi."],
                    one: ["Jedynka... Widzę jedynkę. Hyk."],
                    five: ["Piątka. Samotna piątka... hyk."],
                    after: ["Mówiłem.", "Hehe. Mówiłem przecież."]
                },
                give: ["Weź ją. Wygrałem ją kiedyś od wdowy z Młynówki. Ta to grała! Niech ci służy lepiej niż mnie."],
                tired: ["Na dziś dość, młody. Stare kości potrzebują snu. I moje, i te."]
            }
        },
        kupiec: {
            name: "Kupiec Wawrzyniec", short: "Wawrzyniec", role: "bogaty gość z miasta", style: "wyrachowany", styleColor: "#c9a6ff",
            bust: "People4_5", sheet: "People4", index: 4,
            hours: [18, 23], rare: true, stakes: [25, 35, 50], perDay: 2, minRep: 40,
            ai: { bank: [0, 300, 350, 400, 700, 1700, Infinity], reckless: 0.03, chase: 1.6 },
            die: { key: "krucze", chance: 0.4 },
            quote: "Pięćdziesiąt groszy tu, pięćdziesiąt tam... Siadaj, młodzieńcze.",
            lines: {
                greet: ["Pięćdziesiąt groszy tu, pięćdziesiąt tam... Siadaj, młodzieńcze.", "Szukam rozrywki na wieczór. Zagramy o coś wartego uwagi?"],
                meFirst: ["Pozwolisz, że zacznę. Czas to pieniądz."],
                heroFirst: ["Proszę. Gość przodem."],
                myBig: ["Inwestycja się zwraca.", "Tak wygląda dobry interes."],
                myBust: ["Hm. Koszty prowadzenia interesu.", "Każdy kupiec czasem traci towar."],
                myHot: ["Pełna ładownia. Płyniemy dalej."],
                push: ["Ryzyko jest ceną zysku.", "Jeszcze jeden rzut. Liczby są po mojej stronie."],
                bank: ["Zysk w kieszeni jest lepszy niż zysk w obietnicy.", "Zamykam rachunek tej tury."],
                heroBust: ["Tak kończy się chciwość.", "Przykro mi. Naprawdę. Trochę."],
                heroHot: ["Ho, ho. Imponujące.", "Szczęście początkującego?"],
                heroBig: ["Dobry rzut. Zanotuję to sobie.", "Proszę, proszę."],
                heroSmall: ["Ostrożność. Cenię to."],
                win: ["Interes się opłacił. Dziękuję za grę.", "Pula moja. Nic osobistego, młodzieńcze."],
                lose: ["Brawo. Rzadko przegrywam. Zapamiętam twoją twarz.", "Wygrałeś. Pieniądz lubi zmieniać właściciela."],
                lucky: ["Ta czarna? Pamiątka z podróży. Nie zwracaj na nią uwagi."],
                chat: ["Na targu w grodzie gra się o większe stawki. Ale tu jest przytulniej.", "Kupiłem kiedyś kość od kopacza spod Kruczych Skał. Od tamtej pory śnią mi się kruki.", "Rachunek prawdopodobieństwa, młodzieńcze. Nie szczęście."],
                tired: ["Na dziś wystarczy. Mój skarbnik by mnie zabił."]
            }
        },
        bartek: {
            name: "Bartek Kmieć", short: "Bartek", role: "chłop spod Młynówki", style: "nowicjusz", styleColor: "#8ee08a",
            bust: "Bartek_Bust", sheet: "People1_Tall", index: 4,
            hours: [14, 21], stakes: [5], perDay: 2,
            ai: { bank: [0, 300, 350, 400, 450, 600, Infinity], keepAll: true, miss: 0.12, reckless: 0, chase: 1.3 },
            die: { key: "grusza", chance: 1, giveAfter: 2 },
            quote: "Pięć groszy, więcej nie mam, żona liczy.",
            lines: {
                greet: ["Pięć groszy, więcej nie mam, żona liczy.", "Zagramy? Tylko powoli, ja dopiero się uczę."],
                meFirst: ["Ja pierwszy? Ojej. Dobra."],
                heroFirst: ["Ty zaczynaj, ja popatrzę, jak się to robi."],
                myBig: ["O matko, to się liczy? Liczy się, nie?", "Hej! Szkoda, że żona nie widziała!"],
                myBust: ["Ojej... No nic, ziemniaki też nie zawsze wschodzą.", "Ech. Jak z moim polem."],
                myHot: ["Wszystkie sześć? To tak można?!"],
                push: ["Rzucę jeszcze. Chyba tak się robi?"],
                bank: ["Zapiszę, zapiszę, bo mi ucieknie.", "Lepiej zapiszę, bo zapomnę."],
                heroBust: ["Oj. Współczuję. Szczerze!", "Pudło? Tak jak ja wczoraj."],
                heroHot: ["Wszystkie sześć? Jak to się robi?!"],
                heroBig: ["Ale rzut! Nauczysz mnie tak?"],
                heroSmall: ["Mądrze."],
                win: ["Wygrałem! Kupię żonie wstążkę!", "Naprawdę wygrałem? No proszę!"],
                lose: ["Przegrałem... Tylko nie mów żonie.", "No trudno. Dobra zabawa za pięć groszy."],
                lucky: ["Ta z gruszy? Sam wystrugałem. Nie jest krzywa. Chyba."],
                chat: ["U nas we wsi gra się w kości tylko w niedzielę. Po kościele. Za kościołem.", "Żona mówi, że kości to grzech. Ale sama gra w karty."],
                give: ["Nie mam już grosza... Weź moją kość. Sam wystrugałem z gruszy. Mnie i tak nie przynosi szczęścia."],
                tired: ["Na dziś koniec. Żona mnie zabije, jak przegram jeszcze grosz."]
            }
        }
    };
    // (from the tavern's fame on the quest board, QuestBoard.js: 40 Swój chłop, 80 Chluba tawerny)
    OPPONENTS.nieznajomy = {
        name: "Nieznajomy w kapturze", short: "Nieznajomy", role: "gość bez imienia", style: "zagadka", styleColor: "#c8bda8",
        bust: "Evil_8", sheet: null, index: 0,
        hours: [21, 24], stakes: [100], target: 3000, perDay: 1, minRep: 80, needsRep: true,
        ai: { bank: [0, 350, 400, 500, 800, 1800, Infinity], reckless: 0.08, chase: 1.7 },
        die: { key: "krucze", chance: 0.5, giveOnce: true, orGold: 100 },
        quote: "Kości nie kłamią. Ludzie kłamią. Siadaj.",
        lines: {
            greet: ["Kości nie kłamią. Ludzie kłamią. Siadaj.", "Sto sztuk złota. Do trzech tysięcy. Chluba tawerny chyba się nie boi?"],
            meFirst: ["Ja pierwszy. Tak miało być."],
            heroFirst: ["Proszę. Pokaż, ile jesteś wart."],
            myBig: ["Tak musiało być.", "Wiedziałem."],
            myBust: ["...", "Ciekawe."],
            myHot: ["Wszystkie sześć. Jak dawniej."],
            push: ["Jeszcze.", "Za mało, żeby przestać."],
            bank: ["Wystarczy.", "Zapisz to."],
            heroBust: ["Każdy kiedyś sięga o jeden rzut za daleko.", "Chciałeś wiedzieć za dużo."],
            heroHot: ["Kości cię dziś lubią. Nie przyzwyczajaj się."],
            heroBig: ["Nieźle.", "Kości cię lubią. Na razie."],
            heroSmall: ["Ostrożnie. Mądrze."],
            win: ["Pula moja. Jeszcze się spotkamy.", "Tak miało być."],
            lose: ["Wygrałeś. Rzadko to słyszę.", "Dobrze. Zasłużyłeś."],
            lucky: ["Ta kość jest stara. Starsza niż ta tawerna."],
            chat: ["Pod tą podłogą leżą starsze kamienie, niż myślisz.", "Pytasz, kim jestem? Zapytaj lepiej, czego szukasz.", "Niektórzy rzucają kośćmi, żeby nie myśleć o tym, co wiedzą."],
            give: ["Weź ją. Z Kruczych Skał. Ona i tak woli ciebie."],
            giveGold: ["Kość z Kruczych Skał już masz. Weź więc to. I nie pytaj."],
            tired: ["Na dziś dość. Znajdę cię."]
        }
    };
    // what the others say when the merchant sits by the window but does not play with the hero yet (fame below 40)
    const MERCHANT_HINT = {
        grum: "Ten kupiec przy oknie? Gra tylko z ludźmi, których zna. Mnie też długo nie znał.",
        ozzy: "Widzisz tego kupca z miasta? Gra tylko z ludźmi, których zna. Pokaż się w tawernie, to i z tobą siądzie.",
        bartek: "Kupiec mówi, że gra tylko z ludźmi, których zna. Mnie nie zna. Nikt mnie nie zna."
    };
    const OPP_ORDER = ["grum", "ozzy", "kupiec", "bartek", "nieznajomy"];
    const HERO_LINES = { vision: ["Skąd on to wiedział...?", "Zaraz... skąd on wiedział?"] };
    // the hero on autopilot (tests): plays like a sensible regular
    const AUTO_AI = {
        steady: { bank: [0, 300, 350, 400, 650, 1500, Infinity], reckless: 0, chase: 1.5 },
        bold: { bank: [0, 450, 550, 700, 1100, 2000, Infinity], reckless: 0.1, chase: 1.8 },
        timid: { bank: [0, 200, 250, 300, 350, 500, Infinity], reckless: 0, chase: 1.2 }
    };

    P.data = { DIE_TYPES, SPECIAL_ORDER, OPPONENTS, MERCHANT_HINT, OPP_ORDER, HERO_LINES, AUTO_AI };
})();
