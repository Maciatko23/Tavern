//=============================================================================
// Rywal_Data.js
//=============================================================================
// The data of W9 chapter 3 "Rywal w ruinach" (docs/QUESTY.md W9 ch. 3): someone from outside goes down for the Heart too - the one
// the hero did not win over. Exactly one party, by the state of the game (Rywal.js who()):
//   1. grum     - Grum Żelazna Pięść with his mercenaries: W8 went to the faction (w8Faction) or Grum beat the hero at the tunnel
//                 (w8Lost) - and he is not an ally, gone or dead
//   2. lord     - the Lord's men (the manor's guard): the Lord is a rival at the Heart (Underground.lordStance: W1 a, lordCold, the
//                 manor's branch of the cistern shut, the field lost and not bought back)
//   3. baltazar - Baltazar Vey's men (the Black Eyes' smugglers): Baltazar is not in the hero's grip (W5 unfinished, an enemy, his
//                 kantor shut and he back with mercenaries)
//   4. kopacze  - the Black Eyes' own diggers with their commander (Act III's "Dowódca kopaczy"): Baltazar is in the hero's grip -
//                 the double game, w5FactionWatches: the faction itself follows the hero - and nobody above is a rival (the case
//                 "everyone won over": the faction comes anyway, as Act III shows)
// They go in through the tavern's cellar the night after the grate was opened, a floor every TIME.pace hours, leave traces (their
// mark, boot prints, cold camps, a dropped rope, a tripwire with bells), empty chests and tear the Order's notes about the way down;
// they stop at the tenth gate (the armour lets nobody by without the words) and give up after TIME.giveUpDays days there. The hero
// meets them on the floor they are on: a talk with choices, or a fight (Humans.js - beaten, he is robbed, never killed).
// Rywal.js is the engine. Registered right under Kantor.js (Rywal_Data, then Rywal).

/*:
 * @target MZ
 * @plugindesc [W9 rozdz. 3] Dane „Rywal w ruinach”: kto schodzi po Serce przed bohaterem (Grum, ludzie Lorda, ludzie Baltazara, kopacze Czarnych Oczu), ślady na piętrach 1-10, spotkanie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Kantor
 *
 * @help
 * ============================================================================
 * Rywal_Data.js - dane rozdziału 3 wątku W9 „Serce Twierdzy”
 * ============================================================================
 * Same dane: czyta je Rywal.js (silnik, zaraz pod tym plikiem). Numery
 * zdarzeń 828-839 (rejestr TawernaCore: "Rywal"), grafika !W9_Rywal.png
 * i strażnik dworu $Human_Dwor* (tools/w9_rywal/art.py).
 * ============================================================================
 */

(() => {
    "use strict";

    const MAP = { tavern: 1, cellar: 9, ruins: 10, floor10: 140, heart: 11 };
    const IDS = [828, 839];
    // the injected events (the same ids on every map - each map uses its own part):
    //   mark - the party's sign (chalk eye / the Lord's pennant), printsA / printsB - boot prints, fire - their fire (cold: burnt out;
    //   lit at the meeting), bed - a bedroll, rope - a dropped rope (taken: a rope), trap - the tripwire with bells, lead - the leader,
    //   man0-2 - his men, extra - a second bedroll / the wounded man at the tenth gate / a witness at the Heart
    const EV = { mark: 828, printsA: 829, printsB: 830, fire: 831, bed: 832, rope: 833, trap: 834, lead: 835, man0: 836, man1: 837, man2: 838, extra: 839 };
    // [sheet, index, direction, pattern] - !W9_Rywal (tools/w9_rywal/art.py)
    const ART = {
        eye: ["!W9_Rywal", 0, 2, 0], eyeArrow: ["!W9_Rywal", 0, 2, 1], eyeCrossed: ["!W9_Rywal", 0, 2, 2],
        pennant: ["!W9_Rywal", 0, 4, 0],
        printsV: ["!W9_Rywal", 0, 6, 0], printsH: ["!W9_Rywal", 0, 6, 1], printsX: ["!W9_Rywal", 0, 6, 2],
        rope: ["!W9_Rywal", 0, 8, 0], ropeEnd: ["!W9_Rywal", 0, 8, 1],
        bedRolled: ["!W9_Rywal", 1, 2, 0], bedSpread: ["!W9_Rywal", 1, 2, 1], bedHeap: ["!W9_Rywal", 1, 2, 2],
        wireH: ["!W9_Rywal", 1, 4, 0], wireV: ["!W9_Rywal", 1, 4, 1], wireCut: ["!W9_Rywal", 1, 4, 2],
        sack: ["!W9_Rywal", 1, 6, 0], sackOpen: ["!W9_Rywal", 1, 6, 1], papers: ["!W9_Rywal", 1, 6, 2],
        ash: ["!W9_Rywal", 1, 8, 0],
        fire: ["!Decoration", 2, 4, 0]
    };
    // every light is a flame: their camp fire at the meeting
    const FIRE_LIGHT = "<Light:180,255,150,70><LightFlicker:0.18,255,110,40><LightHeight:20>";

    // ------------------------------------------------------------------ the clock (game hours; an hour is a minute)
    // enter: the hour of the night after the grate was opened when they go in (the day the grate was first seen open + 1);
    // pace: hours a floor; giveUpDays: days at the tenth gate before they give up and go back up; meet: tiles from the leader
    // the talk starts at (the hero coming near their camp)
    const TIME = { enter: 1, pace: 6, giveUpDays: 3, meet: 6.5, cap: 10 };

    // ------------------------------------------------------------------ the traces of the floors they passed
    // camp: floors where they slept (a burnt-out fire and a bedroll in a middle room), rope: a dropped rope, trap: a tripwire with
    // bells across the way (stepped on: a fall, the bells - sneaking (C): seen and cut, a rope), rob: the part of the containers not
    // yet searched they empty (robKinds), torn: the Order's notes they tear out when the hero has not read them yet (the ones about
    // the way down: the castellan's keys, the steps, the tenth gate, the words)
    const TRAIL = {
        camp: [3, 6, 9], rope: [2, 5], trap: [4, 8], rob: 0.5,
        robKinds: ["skrzynia", "skrzynka", "beczka", "worek", "dzban", "sakwa", "relikwiarz", "monety"],
        torn: { 6: ["6"], 7: ["7"], 8: ["8"], 10: ["10d"] },
        trapDamage: 9, trapPerFloor: 1, ropeItem: 93
    };

    // ------------------------------------------------------------------ the hand-made places
    // Ruiny Zamku (Map010): boot prints from the narrow stairs to the great stairs down, the mark before them
    const RUINS = { prints: [[6, 8, "H"], [10, 8, "H"]], mark: [16, 8] };
    // floor 10 (Map140, Strażnica): their camp in the guard hall before the gate - the armour does not let them by. chest: the guard's
    // chest (its event, self switch A = opened); spider: the creature marker in the hall (their camp cleared it)
    const FLOOR10 = {
        fire: [22, 17], bed: [24, 16], bed2: [25, 18], lead: [15, 17, 4], men: [[21, 17, 6], [23, 18, 4], [22, 19, 8]], wounded: [19, 19, 2],
        mark: [14, 19], prints: [[12, 17, "H"], [14, 16, "H"]], chest: 30, spider: [21, 18], up: [5, 13]
    };
    // floor 100 (Map011): the ones who went down past the gate (the words sold / the hero as their guide) wait in the antechamber -
    // the three locks did not let them in either
    const HEART = { lead: [23, 17, 4], man: [24, 18, 4], ash: [25, 20] };

    // ------------------------------------------------------------------ the parties
    // lead / men: name, img [sheet, index], kind (Humans.js), look (its sheets), lv (levels over the place's), fights (the leader:
    // false - he goes off when it comes to blows); faction: the Black Eyes' men (Act III's attackers - Act3_Data reads w9Frakcja*);
    // mark: "eye" (the White Eye in chalk) or "pennant" (the Zaleskis' black horse)
    const PARTIES = {
        baltazar: {
            name: "Ludzie Baltazara", kto: "ludzie Baltazara Veya (Czarne Oczy)", flag: "w9RywalBaltazar", faction: true, mark: "eye",
            lead: { name: "Baltazar Vey", img: ["$Npc_Kupiec", 0], fights: false },
            men: [{ kind: "bandit", name: "Człowiek Baltazara", img: ["$Human_Bandit", 0], lv: 0 },
                { kind: "knifer", name: "Człowiek Baltazara", img: ["$Human_Knife", 0], lv: 0 },
                { kind: "archer", name: "Łucznik Baltazara", img: ["$Human_Archer", 0], lv: 0 }],
            enemyMan: { kind: "mercenary", name: "Najemnik Baltazara", img: ["$Human_Merc", 0], lv: 0 },   // (instead of the archer: Baltazar an enemy, with mercenaries)
            wounded: ["$Human_Bandit_Lie", 0], wName: "Józek"
        },
        grum: {
            name: "Grum i najemnicy", kto: "Grum Żelazna Pięść i jego najemnicy", flag: "w9RywalGrum", faction: true, mark: "eye",
            lead: { name: "Grum", img: ["$Npc_Grum", 0], fights: true, kind: "mercenary", lv: 2, gold: 30 },
            men: [{ kind: "mercenary", name: "Najemnik", img: ["$Human_Merc", 0], lv: -1 }, { kind: "bandit", name: "Najemnik", img: ["$Human_Bandit", 0], lv: 0 }],
            wounded: ["$Human_Merc_Lie", 0], wName: "Olbracht"
        },
        lord: {
            name: "Ludzie Lorda", kto: "ludzie Lorda Zaleskiego (straż dworu)", flag: "w9RywalDwor", faction: false, mark: "pennant",
            lead: { name: "Starszy straży dworu", img: ["$Human_Dwor", 0], fights: true, kind: "mercenary", look: "Dwor", lv: 0 },
            men: [{ kind: "mercenary", look: "Dwor", name: "Strażnik dworu", img: ["$Human_Dwor", 0], lv: -2 },
                { kind: "mercenary", look: "Dwor", name: "Strażnik dworu", img: ["$Human_Dwor", 0], lv: -2 }],
            wounded: ["$Human_Dwor_Lie", 0], wName: "Bartosz"
        },
        kopacze: {
            name: "Kopacze Czarnych Oczu", kto: "kopacze Czarnych Oczu z dowódcą", flag: "w9RywalKopacze", faction: true, mark: "eye",
            lead: { name: "Dowódca kopaczy", img: ["$Human_Captain", 0], fights: true, kind: "mercenary", look: "Captain", lv: 2 },
            men: [{ kind: "bandit", name: "Kopacz Czarnych Oczu", img: ["$Human_Bandit", 0], lv: 0 }, { kind: "knifer", name: "Kopacz Czarnych Oczu", img: ["$Human_Knife", 0], lv: 0 }],
            wounded: ["$Human_Knife_Lie", 0], wName: "Wolf"
        }
    };
    const ORDER = ["grum", "lord", "baltazar", "kopacze"];
    // the manor's guard of Humans.js (a mercenary recoloured into the Zaleskis' red - tools/w9_rywal/art.py): its looks
    const LOOKS = { Dwor: { anim: { raise: 5, hit: 7, guard: 3 }, shield: true, crouch: "Crouch8" }, Captain: { anim: { raise: 5, hit: 7, guard: 3 }, shield: true, crouch: "Kneel8" } };

    // why this party (the journal and the report)
    const WHY = {
        grumFaction: "Grum przeszedł do frakcji (W8: praca dla Czarnych Oczu, zawał przebity).",
        grumLost: "Grum pobił mnie przy tunelu i został z frakcją (W8).",
        lordField: "Lord trzyma pole dziadka i chce być pierwszy pod tawerną.",
        lordBranch: "Zamknąłem gałąź dworską w cysternie - Lord jest chłodny.",
        lordShamed: "Lord nie zapomniał wstydu na rynku (W1).",
        lordCold: "Lord patrzy na mnie chłodno.",
        lordForced: "Lord chce być pierwszy.",
        baltazarEnemy: "Baltazar jest moim wrogiem (W5).",
        baltazarBack: "Baltazar wrócił na wyspę z najemnikami (W5).",
        baltazarFree: "Baltazar Vey nie jest w mojej garści - kantor dalej handluje dla Czarnych Oczu (W5).",
        kopaczeGrip: "Baltazar jest w mojej garści, ale frakcja patrzy na każdy mój krok (podwójna gra, W5) - przysłała swoich.",
        kopaczeAll: "Nikt na górze nie jest mi wrogiem - więc Czarne Oczy przysłały swoich kopaczy.",
        forced: "(wymuszone w F9)"
    };

    // ------------------------------------------------------------------ the words
    const TX = {
        // the start: the cellar, the first trace
        cellar: ["> (Krata uchylona. Na stopniach świeże błoto... Ktoś zszedł tu w nocy.)"],
        noteStart: ["Ktoś schodzi przede mną", "Krata w piwnicy Borgara była w nocy uchylona, a na stopniach do Ruin Zamku zostało świeże błoto. {znak} Ktoś zszedł nocą przez naszą piwnicę i idzie w dół - przede mną. {why}"],
        znak: { eye: "Przy wielkich schodach kredą na posadzce: otwarte oko. Białe oko - znak Straży Pewności, Czarnych Oczu.",
            pennant: "Przy wielkich schodach wbity w szczelinę proporczyk: czarny koń na czerwieni - herb Zaleskich." },
        firstTop: ["Ktoś schodzi przede mną", "Świeże ślady w ruinach pod tawerną. Nie jestem tu sam."],
        // the traces (the action button on them)
        markEye: "Kredą na posadzce: otwarte oko i strzałka w dół. Znak Czarnych Oczu.",
        markPennant: "Proporczyk z czarnym koniem wbity w szczelinę. Ludzie Lorda byli tu przede mną.",
        prints: "Świeże ślady butów w kurzu. Kilku ludzi, ciężkie, okute buty.",
        campCold: "Wygasłe ognisko. Popiół zimny - spali tu i poszli w dół.",
        campLeft: "Ich ognisko. Jeszcze ciepłe.",
        bed: "Posłanie z wełnianego koca. Zostawili je.",
        rope: "Porzucona lina. Komuś się już nie przydała.",
        ropeTaken: "Lina ×1",
        noteCamp: ["Zimne ognisko w ruinach", "Na piętrze {f} wygasłe ognisko i posłanie. Spali tu - i poszli dalej w dół."],
        // the tripwire
        trapHit: "Linka z dzwonkami!",
        trapHitSub: "Ktoś rozciągnął ją w poprzek przejścia - na tych, co idą za nimi.",
        trapCut: ["> (Linka w poprzek przejścia, z dzwonkami. Przestępuję ją ostrożnie i przecinam.)"],
        trapDone: "Przecięta linka z dzwonkami.",
        noteTrap: ["Linka z dzwonkami", "W ruinach ktoś rozciąga w poprzek przejść linki z dzwonkami - na tych, co idą za nimi. Skradając się (C), widzę je w porę."],
        // the emptied chests, the torn notes
        robbed: "Wieko wyważone, w środku pusto. W kurzu świeże ślady palców - ktoś był tu przede mną.",
        noteRobbed: ["Puste skrzynie", "Na piętrach, którymi idą, skrzynie i beczki wybrane do dna. Ktoś zbiera to, co zostawił zakon - zanim ja tam dojdę."],
        torn: { eye: "Kartki wyrwane - przy gwoździu zostały tylko strzępy. Obok kredą: białe oko.",
            pennant: "Kartki wyrwane - przy gwoździu zostały strzępy, a na nich czerwona nitka z sukna." },
        noteTorn: ["Wyrwane zapiski", "Z zapisków zakonu ktoś wyrywa kartki - te o schodach, kluczach i dziesiątej bramie. Szukają drogi w dół."],
        // the meeting
        stop: { baltazar: "No proszę. Przyjaciel.", grum: "Stój. To ja.", lord: "Stój! W imieniu dworu!", kopacze: "Stać. Kto idzie?" },
        bark: { baltazar: "Gadaj z szefem. Ja tylko noszę.", grum: "Grum mówi za nas.", lord: "Starszy mówi za nas.", kopacze: "Dowódca mówi. My kopiemy." },
        woundedBark: "Ta zbroja... ona się rusza... (ranny jęczy)",
        greet: {
            baltazar: {
                intro: ["(Przy ognisku stoi Baltazar Vey w kupieckim płaszczu, z latarnią w ręku. Za nim jego ludzie.)"],
                normal: ["Przyjacielu! Co za spotkanie - i to w piwnicy. Myślałem, że ciekawość zostawiłeś na górze."],
                enemy: ["Ach. Wróg z rejestrem. Zawsze pod nogami - nawet sto stopni pod ziemią."],
                back: ["Zamknęli mi kantor, przyjacielu. To otworzę sobie coś większego. Pod tawerną."],
                road: ["Sztab płaci za każdy kamień tej twierdzy. A za drzwi pod skałą - za drzwi zapłaci tyle, że kupię całą wyspę."],
                gate: ["Tylko ta zbroja przy bramie... {ranny} spróbował przejść - ledwo żyje. Nie przepuszcza bez słów.", "A ty... ty je znasz, prawda? Widzę po oczach."]
            },
            grum: {
                intro: ["(Przy ognisku siedzi Grum z tarczą na kolanach. Jego najemnicy wstają na twój widok.)"],
                normal: ["Mówiłem ci, chłopcze. Nie schodź tu."],
                lost: ["Raz cię już położyłem przy tunelu. Nie każ mi drugi raz."],
                road: ["Rozkaz z lądu: drzwi pod skałą. Świadków nie zostawiać.", "...Ale ja nie zabijam tych, z którymi siłowałem się na rękę. Idź na górę."],
                gate: ["Zbroja przy bramie stoi i czeka na słowa. My czekamy razem z nią. {ranny} już nie czeka - leży."]
            },
            lord: {
                intro: ["(Trzech strażników dworu w czerwonych kaftanach. Starszy wstaje od ognia.)"],
                normal: ["Stój! W imieniu jaśnie pana Zaleskiego."],
                road: ["Pan kazał zobaczyć, co jest pod tawerną - zanim zrobi to ktoś inny. Ty na przykład."],
                gate: ["Ta zbroja przy bramie... {ranny} ledwo uszedł. O tym jaśnie pan nie mówił."]
            },
            kopacze: {
                intro: ["(Przy ognisku stoi człowiek w czarnej zbroi, z białym okiem na tarczy. Dwóch kopaczy podnosi kilofy.)"],
                normal: ["Czarne Oczy patrzą, chłopcze. Ty schodzisz - my idziemy twoimi śladami."],
                grip: ["Kupiec mówi, że jesteś nasz. Kupiec mówi dużo. Sztab woli patrzeć sam."],
                road: ["Pewność, chłopcze. Kto ma Serce, ten wie. Koniec zgadywania, koniec wojen o plotki. Tego chce sztab."],
                gate: ["Zbroja przy bramie zna słowa, których my nie znamy. {ranny} już tego nie zapomni.", "Ty je znasz."]
            }
        },
        lordWhy: {
            field: "Pole twojego dziadka jest teraz pana. Ta piwnica pod tawerną... też kiedyś będzie.",
            branch: "Ogród jaśnie pana usycha, a ty grzebiesz w rurach zakonu.",
            shamed: "Pan nie zapomniał rynku. I tego, kto go tam ośmieszył.",
            cold: "Pan mówił: kto coś znajdzie, ma przyjść najpierw do niego. Nie przyszedłeś."
        },
        again: { baltazar: ["Wróciłeś. Zmieniłeś zdanie, przyjacielu?"], grum: ["Jeszcze tu jesteś?"], lord: ["Znowu ty."], kopacze: ["Patrzymy na ciebie, chłopcze."] },
        // the short last line before the choice (a long one beside the choice's bubble would not fit - the bubble narrows)
        ask: { baltazar: "No więc, przyjacielu?", grum: "No?", lord: "Co powiesz?", kopacze: "Mów." },
        opt: {
            fight: { baltazar: "Odejdźcie albo was przegonię.", grum: "Odejdź, Grum. Albo cię zmuszę.", lord: "Zejdźcie mi z drogi.", kopacze: "Zawracajcie albo was zmuszę." },
            sell: "Sprzedam ci słowa strażnika.",
            guide: "Poprowadzę was przez bramę.",
            report: "Raport zdam jaśnie panu sam.",
            turn: "To nie twoja wojna, Grum.",
            warn: "Dalej czeka zbroja, która zabija każdego bez słów.",
            leave: "Nie moja sprawa."
        },
        fightStart: { baltazar: "Chłopcy, przyjaciel chce się bić. Ja nie lubię widoku krwi.", grum: "Dobra. Jak mus, to mus.", lord: "Za dwór!", kopacze: "Brać go. Żywego - wie za dużo." },
        sell: {
            ask: ["> Słowa strażnika dziesiątej bramy. Ile dasz?"],
            say: ["Sto pięćdziesiąt groszy. Uczciwie - jak u mnie zawsze.", "> Nie pytam o to, czego nie chcę wiedzieć.",
                "(Baltazar powtarza je szeptem, jakby liczył monety.) ...Interes życia, przyjacielu. Chłopcy, zbierać się. W dół."]
        },
        guide: {
            ask: ["> Znam słowa. Przeprowadzę was przez bramę."],
            say: ["Rozsądnie. Sto groszy teraz, reszta - kiedy zobaczymy światło.", "(Przy bramie mówisz zbroi słowa Borgara. Zbroja opuszcza miecz. Czarne Oczy przechodzą jeden po drugim.)",
                "Dalej trafimy sami. Do zobaczenia na dole, chłopcze."]
        },
        report: {
            ask: ["> Wracajcie na górę. Co tu znajdę, zaniosę panu sam - pierwszemu."],
            say: ["(Starszy drapie się pod hełmem.) Pan lubi, kiedy przychodzi się najpierw do niego...", "Dobrze. Ale jak nie przyjdziesz - wrócimy. Z dłuższą liną. Zbierać się, chłopcy."]
        },
        turn: {
            ask: ["> To nie twoja wojna, Grum. {powody}"],
            say: ["(Grum długo patrzy w ogień.) ...Żelazna Pięść nie zmienia stron dwa razy. Ale raz może.",
                "Chłopaki, na górę. Płacić już nie będą - za to, co tu widziałem, nikt nie zapłaci.", "A ty... jak przyjdą po twoją tawernę, stanę przy drzwiach."],
            need: ["Ładnie mówisz. Za mało, chłopcze. Żelazna Pięść nie zmienia stron dla słów."],
            powody: { marek: "Marek wrócił do Ludmiły i Eli.", kroniki: "Kroniki zakonu są w dobrych rękach.", honor: "Na rękę wygrałem z tobą uczciwie - na honor." }
        },
        warn: {
            ask: ["> Dalej, przy dziesiątej bramie, stoi zbroja. Zabija każdego, kto nie zna słów. Widziałem."],
            baltazar: ["Zbroja, która zabija? (Baltazar blednie pod latarnią.) Interes to interes - ale trup nie handluje. Zbieramy się."],
            lord: ["Zbroja, co zabija? Za to dwór mi nie płaci. Wracamy, chłopcy - pan dostanie raport, że tu nic nie ma."]
        },
        leave: { baltazar: ["Idź, idź. Spotkamy się niżej. Albo wyżej."], grum: ["Idź. I patrz pod nogi - ktoś tu rozciąga linki."], lord: ["Idź swoją drogą. My tu jeszcze posiedzimy."], kopacze: ["Idź. Pójdziemy twoimi śladami."] },
        goneUp: { baltazar: "Interes to interes.", grum: "Na górę, chłopaki.", lord: "Wracamy.", kopacze: "Zbierać się." },
        goneDown: { baltazar: "W dół, chłopcy. Do Serca.", kopacze: "Za mną. W dół." },
        // the outcomes: the journal's notes ({kto}: the party, {f}: the floor, {n}: the notes taken back)
        outcome: {
            pobici: ["Rywal w ruinach: pobici", "{Kto} pobici na piętrze {f}. Nie zejdą już przede mną.{zwrot}"],
            wygrali: ["Rywal w ruinach: pobity", "{Kto} pobili mnie na piętrze {f} i zabrali, co miałem. Wrócili na górę z łupem - i z kartkami zakonu w worku."],
            zawrocili: ["Rywal w ruinach: zawrócili", "Powiedziałem im o zbroi przy dziesiątej bramie. {Kto} zawrócili na górę - z tym, co już zabrali po drodze."],
            haslo: ["Rywal w ruinach: słowa strażnika", "Sprzedałem słowa strażnika dziesiątej bramy. {Kto} poszli w dół. Kiedyś zobaczę ich znowu - niżej."],
            przewodnik: ["Rywal w ruinach: przewodnik", "Przeprowadziłem {kto} przez dziesiątą bramę. Idą w dół, do Serca. Za mną - albo przede mną."],
            raport: ["Rywal w ruinach: raport dla Lorda", "Ludzie Lorda wrócili na górę. Obiecałem, że z tym, co znajdę, przyjdę do jaśnie pana pierwszy."],
            sojusz: ["Grum zawrócił", "Grum i jego najemnicy zawrócili w ruinach. „Jak przyjdą po twoją tawernę, stanę przy drzwiach.”"],
            odeszli: ["Rywal w ruinach: odeszli", "{Kto} czekali przy dziesiątej bramie - zbroja ich nie przepuściła. Odeszli na górę z tym, co zebrali po drodze."],
            odeszliUnseen: ["Ktoś był w ruinach", "Borgar mówi, że w nocy obcy wyszli z piwnicy, obładowani workami. Ktoś był w ruinach pod tawerną przede mną - i już go tam nie ma."]
        },
        recovered: " W ich worku wyrwane kartki zapisków zakonu ({n}) - teraz są u mnie.",
        grumFate: { killed: "Grum nie żyje. Leży w ruinach, z tarczą pod głową.", spared: "Grum podniósł się, splunął i poszedł na górę. „Odpływam pierwszym promem.”",
            robbed: "Grum oddał sakiewkę bez słowa i poszedł na górę. „Odpływam.”", fled: "Grum wycofał się w ciemność. Na górę - i na prom." },
        captainDead: "Dowódca kopaczy nie żyje. Czarne Oczy przyślą nowego.",
        topOutcome: {
            pobici: ["Rywal pobity", "{kto} nie zejdą już przede mną."], wygrali: ["Pobity", "{kto} poszli z łupem na górę."],
            zawrocili: ["Zawrócili", "{kto} wracają na górę."], haslo: ["Słowa sprzedane", "{kto} idą w dół. +150 G"], przewodnik: ["Przez bramę", "{kto} idą w dół. +100 G"],
            raport: ["Ludzie Lorda zawrócili", "Raport dla jaśnie pana - pierwszy."], sojusz: ["Grum zawrócił", "Stanie przy drzwiach tawerny."],
            odeszli: ["Rywal odszedł", "{kto} wrócili na górę."], odeszliUnseen: ["Ktoś był w ruinach", "Obcy wyszli w nocy z piwnicy tawerny."]
        },
        // the give-up at the gate: heard of in the cellar / tavern
        borgar: ["> (Borgar mówi, że w nocy ktoś wyszedł z piwnicy, obładowany workami. „Obcy. Nie pytałem.”)"],
        // the faction is armed for Act III (Act3.js's bus act3Armed): a word on who it is
        noteAct3: { faction: ["Ci z ruin", "Ludzie, którzy pytają o piwnicę tawerny, to ta sama Straż Pewności, którą spotkałem w ruinach - albo ich bracia. Czarne Oczy wiedzą, że droga w dół zaczyna się pod naszą podłogą."],
            lord: ["Ci z ruin", "Ludzie, którzy pytają o piwnicę tawerny, to nie ludzie Lorda z ruin - to Czarne Oczy. Dwór i frakcja chcą tego samego."] },
        // the Heart: the ones who went down past the gate wait before the door
        heartLine: { baltazar: "Trzy zamki, przyjacielu. Słowa nie wystarczą. Otwieraj - popatrzymy.", kopacze: "Trzy zamki. Sztab o tym nie wiedział. Otwieraj. Popatrzymy." },
        heartMan: "...",
        // the W9 steps in the journal (TownQuests) - {kto}, {gdzie}, {znaki}, {koniec}
        step: "Rywal w ruinach: {kto} schodzą po Serce przede mną (piętra 1–10). {gdzie} Znak: {znaki}.",
        stepAfter: "{koniec} Dalej w głąb: pod dziesiątą bramą kwatery i kaplica zakonu (piętra 11–30), niżej jaskinie, a na samym dole - Serce.",
        gdzie: { none: "Ślady zaczynają się w Ruinach Zamku.", seen: "Ostatni ślad: piętro {f}.", met: "Spotkani na piętrze {f}.", gate: "Czekają przy dziesiątej bramie." },
        znaki: { eye: "białe oko kredą", pennant: "proporczyk z czarnym koniem (herb Zaleskich)" },
        ktoUnseen: "ktoś z zewnątrz", znakiUnseen: "nie wiem - śladów nie widziałem",
        koniec: {
            pobici: "Rywal w ruinach pobity na piętrze {f}.", wygrali: "Rywal w ruinach pobił mnie i wrócił na górę z łupem.", zawrocili: "Rywal w ruinach zawrócił.",
            haslo: "Rywal poszedł w dół ze słowami strażnika.", przewodnik: "Rywal poszedł w dół za moją sprawą.", raport: "Ludzie Lorda wrócili na górę - raport zdam ja.",
            sojusz: "Grum zawrócił w ruinach.", odeszli: "Rywal odszedł spod dziesiątej bramy.",
            odeszliUnseen: "Ktoś był w ruinach przede mną i wyszedł nocą przez piwnicę tawerny."
        },
        // the epilogue (Underground.js epilogueExtras asks Rywal.epilogue): one line
        epilogue: {
            deep: { baltazar: "Baltazar Vey widział drzwi Komnaty Serca. Na lądzie opowiada o nich za darmo - nikt nie chce płacić za bajki.",
                kopacze: "Czarne Oczy doszły aż pod drzwi Komnaty. Trzech zamków nie otworzyły. Sztab dostał raport, którego nie umie przeczytać." },
            pobici: { faction: "Kartki zakonu, które Czarne Oczy wyrwały w ruinach, leżą teraz w twojej skrzyni.", lord: "Strażnicy dworu omijają piwnicę tawerny szerokim łukiem." },
            sojusz: "Grum mówi w tawernie, że raz w życiu zmienił stronę. Nie mówi, w którą.",
            raport: "Raport dla jaśnie pana był krótki. Lord czyta go co wieczór.",
            lost: "Kartki zakonu z ruin popłynęły na ląd. Ktoś je tam czyta przy świecy."
        },
        // the Lord at the Heart (Underground_Data LORD.arrive.rival asks w.rival.lordLine): his men met in the ruins
        lordLine: {
            pobici: "Moich ludzi pobiłeś w ruinach. Bartosz do dziś kuleje.",
            raport: "Obiecałeś mi raport. Przyszedłeś po Serce sam.",
            zawrocili: "Moi ludzie wrócili z ruin i mówili o zbroi, co zabija. Tchórze.",
            wygrali: "Moi ludzie wrócili z ruin z twoją sakiewką. Myślałem, że to wystarczy.",
            odeszli: "Moi ludzie czekali przy dziesiątej bramie trzy dni. Ty przeszedłeś."
        },
        // F9 ("Wyspa i fabuła")
        f9Names: { "": "z gry", baltazar: "ludzie Baltazara", grum: "Grum z najemnikami", lord: "ludzie Lorda", kopacze: "kopacze Czarnych Oczu" },
        f9: "W9: rywal (wymuś wariant): {name}   ←→ zmień, OK zacznij",
        f9desc: "Rywal z zewnątrz w ruinach (piętra 1-10). OK: krata otwarta, rywal już w drodze (piętro 3), bohater w Ruinach Zamku przy jego śladach.",
        f9Meet: "W9: rywal - spotkanie na piętrze {n}   ←→ piętro, OK idź",
        f9MeetDesc: "Rywal (wariant z wiersza wyżej) czeka na tym piętrze (1-10) - bohater na jego schodach, kilka kroków do ich ogniska."
    };

    // the steps added to TownQuests' W9 (Rywal.js appends them - the step numbers of old saves stay as they were)
    const STEPS = [
        { ch: 3, type: "custom", vars: "w9Rywal", w9r: "rival", text: TX.step },
        { ch: 3, type: "pause", vars: "w9Rywal", w9r: "after", text: TX.stepAfter }
    ];

    window.RywalData = { MAP, IDS, EV, ART, FIRE_LIGHT, TIME, TRAIL, RUINS, FLOOR10, HEART, PARTIES, ORDER, LOOKS, WHY, TX, STEPS, OWNER: "Rywal" };
})();
