//=============================================================================
// Act3_Data.js
//=============================================================================
// The data of Act III's siege of the tavern (Act3.js, docs/AKT3.md): when it comes, the warnings, the bell, the waves of the faction's
// men (Humans.js), the defenders by what the hero did (Grum, Borgar, Rafał, Marek, the townsfolk at Opinia 60+), the doors, the
// damage and the three outcomes, and every line said. Data only - Act3.js reads it (window.Act3Data).

/*:
 * @target MZ
 * @plugindesc Dane Aktu III (napad frakcji na tawernę): kiedy, ostrzeżenia, dzwon, fale, obrońcy, wyniki, teksty. Musi być nad Act3.js. v1.0.0
 * @author Tawerna
 * @base TawernaCore
 * @orderAfter TawernaCore
 *
 * @help
 * ============================================================================
 * Act3_Data.js - dane napadu na tawernę (Akt III)
 * ============================================================================
 * Same dane: czyta je Act3.js. Odległości w polach mapy, czasy w klatkach
 * (60 na sekundę) albo w godzinach gry (60 sekund to godzina).
 * ============================================================================
 */

(() => {
    "use strict";

    // ---------------------------------------------------------------------------------------------------------------------------
    // When: the hero has been down to floor `floor` (Underground.deepest()) with the cellar's grate open - the floor of the diggers'
    // cut (50), where the faction's own tunnel meets the Order's stairs: they learn that the way down starts under the tavern's floor.
    // Armed the first time he is on one of `maps` after that; the warnings run from then on, the strike comes the next night
    // (`delayDays`), from `from` o'clock to `to` - while he is in the tavern or the town. A night he is away the men wait; after
    // `waitNights` such nights they strike without him (the outcome reckoned from his allies).
    // ---------------------------------------------------------------------------------------------------------------------------
    const TRIGGER = { floor: 50, needOpen: true, maps: [1, 8, 9], delayDays: 1, from: 21, to: 4, waitNights: 3, siegeMaps: [1, 8] };

    // the maps and their places: the town (Map008) - the tavern's door, the yard's gate the men come through, where the townsfolk
    // stand, the bell's rope; the tavern (Map001) - the old door to the cellar ("Stare drzwi", the loose brick behind it), the kitchen
    // the men come in through, the front door, Borgar's place
    const TOWN = 8, TAVERN = 1;
    const SPOTS = {
        8: {
            door: [24, 17], doorTile: [24, 16], doorName: "Drzwi tawerny",
            gate: [[24, 23], [25, 23], [24, 22], [25, 22], [23, 22], [26, 21], [23, 21], [24, 24], [25, 24]],
            guard: [[21, 18], [27, 18], [19, 19], [29, 19], [22, 20], [26, 20], [17, 18], [31, 18]],
            from: [[24, 24], [25, 24], [24, 23], [25, 23]],
            bell: [47, 29], bellStand: [47, 30],
            fires: [[21, 15, 0.9], [27, 15, 1.0], [18, 16, 0.75], [30, 16, 0.8], [24, 14, 0.7]]
        },
        1: {
            door: [9, 14], doorTile: [9, 13], doorName: "Stare drzwi (piwnica)",
            kitchen: [[45, 11], [47, 11], [43, 12], [49, 12], [45, 13], [41, 12]],
            front: [[50, 51], [49, 51], [51, 51], [50, 50], [48, 50], [52, 50]],
            guard: [[10, 16], [8, 16], [11, 17], [7, 17]],
            hall: [[50, 30], [47, 31], [53, 31]],
            borgar: [52, 31], entry: [50, 53]
        }
    };
    // the events Act3 puts into the maps (Tawerna.inject, its range 840-859): 859 - the bell's rope on the town map (the alarm); 854-858
    // kept for later (the whole 840-858 in the core's registry; tests/core_test.js moved its free test ids to the 700s, 2026-10-07)
    const IDS = { from: 840, to: 859, rope: 859 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The waves, in order. map: where they come; kinds: Humans.js kinds; from: the spots they come in at (SPOTS[map][from]); march:
    // where the ones not fighting go (the door of that map); extra(ctx): who else comes (Grum and Rafał on the faction's side, the
    // commander) - { kind, name, look, lv (levels over the siege's), noSurrender, boss }; shout: what the first one calls out; notice:
    // the top line when it comes
    // ---------------------------------------------------------------------------------------------------------------------------
    const WAVES = [
        { id: "w1", map: 8, from: "gate", kinds: ["bandit", "bandit", "knifer"], shout: "Pochodnie pod drzwi! Ruszać się!",
          notice: ["Pod drzwiami tawerny!", "Trzech z pochodniami idzie przez dziedziniec."] },
        { id: "w2", map: 8, from: "gate", kinds: ["bandit", "archer", "knifer", "archer"], shout: "Łucznicy, na mur! Reszta do drzwi!",
          extra: c => (c.rafal === "enemy" ? [{ kind: "knifer", name: "Rafał", lv: 0, noSurrender: false }] : []),
          notice: ["Łucznicy!", "Druga grupa - strzelają z bramy dziedzińca."] },
        { id: "w3", map: 1, from: "kitchen", kinds: ["knifer", "bandit", "bandit"], shout: "Do starych drzwi! Krata jest za nimi!",
          notice: ["Tylnymi drzwiami!", "Są w środku - idą przez kuchnię do starych drzwi przy piwnicy."] },
        { id: "w4", map: 1, from: "front", kinds: ["mercenary", "bandit"], shout: "Dość zabawy. Otworzyć mi tę piwnicę.",
          extra: c => [{ kind: "mercenary", name: "Dowódca kopaczy", look: "Captain", lv: 2, boss: true }]
              .concat(c.grum === "enemy" ? [{ kind: "mercenary", name: "Grum", lv: 1, grum: true }] : []),
          notice: ["Dowódca!", "Frontowymi drzwiami wchodzi dowódca kopaczy ze swoimi ludźmi."] }
    ];
    // the commander's own look (PixelLab a8bb43b1, styled on the hero; tools/humans "captain"): a mercenary's sheets of his own -
    // img/characters/anim8/Captain_<Walk8|Atk8|Guard8|Kneel8|Lie8>.png and $Human_Captain[_Atk|_Guard|_Kneel|_Lie].png; anim: the
    // frames of his blow sheet (Humans.js LOOKS)
    const CAPTAIN = { look: "Captain", anim: { raise: 5, hit: 7, guard: 3 } };
    // the siege's level: the hero's level and the place's (Combat.placeLevel), kept between min and max; each kind's own levels over it
    const LEVEL = { heroDelta: -1, min: 3, max: 40, kinds: { bandit: 0, knifer: 0, archer: 0, mercenary: 1 } };
    // between two waves (frames); a wave on the map the hero is not on: after `offBreach` hours of the game it breaks the door
    // without him (the ones who got through the town's door come in with the next wave inside)
    const PACE = { gap: 360, firstGap: 240, offBreach: 1.0, offDamage: 6, reMarch: 120, workAt: 1.6 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The doors: life 100; each man at a door (not fighting) takes `per` of it every `every` frames. The town door broken: `breach`
    // damage, the ones there go in (they join the next wave inside). The old door broken: each man there goes down into the cellar
    // (`down` damage each) - the faction is under the tavern
    // ---------------------------------------------------------------------------------------------------------------------------
    const DOORS = { 8: { hp: 100, every: 30, per: 1, breach: 20 }, 1: { hp: 100, every: 36, per: 1, down: 35 } };
    // the outcome: damage 0-100 (the doors, the fires, the men who got through); held: under `held` and at most `heldLost` defenders
    // down (or `heldPart` of those who fought, whichever is more); fallen: `fallen` and more; costly: the rest. The hero beaten (robbed, not killed - Humans.js): the defenders left finish it
    // (their strength against the men left - POWER) - costly when they hold, fallen when not
    const OUTCOME = { held: 35, heldLost: 1, heldPart: 0.25, fallen: 100, beatenCostly: 50 };
    const POWER = { bandit: 1, knifer: 0.8, archer: 0.8, mercenary: 2, boss: 3, grum: 2.5 };
    // what each outcome brings (Opinia in the town, experience, gold from Borgar)
    const REWARD = {
        held: { opinion: 8, xp: 600, gold: 120 },
        costly: { opinion: 3, xp: 400, gold: 40 },
        fallen: { opinion: -3, xp: 150, gold: 0 }
    };
    // the damage the tavern shows afterwards (soot on the walls, broken shutters, embers): for how many days
    const SCARS = { days: 6 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The defenders. key (the outcome's lists), name, sheet (the 8-way walk, img/characters), atk (an attack sheet of Humans.js's -
    // the mercenary's look; else the blow is the body thrown forward and a swing drawn), maps (where they fight), from (where they
    // come in: "here" - on the spot; "gate" - the yard's gate after `delay` frames), hp / dmg / poise at level 1 (they grow with the
    // siege's level like the men), cd: frames between blows, speed, armor (part of a blow held off), follow: keeps by the hero (else
    // guards its spot), hide: TownLife residents / map events this one stands in for (hidden while the siege runs), when(c): whether
    // he comes (c: the state of the town - see Act3.js ctx())
    // ---------------------------------------------------------------------------------------------------------------------------
    const DEFENDERS = [
        { key: "borgar", name: "Borgar", sheet: "Npc_Borgar_Walk8", maps: [1], from: "here", hp: 140, dmg: 12, poise: 30, cd: [70, 100], speed: 3.9, armor: 0.1,
          guard: "door", hideEvent: 1, swing: "#d9c6a0", when: () => true,
          lines: { start: "Ja pilnuję piwnicy! Ty ich zatrzymaj!", hit: "Nie w mojej tawernie!", down: "Ugh... Dalej, synu... ja tu poleżę...", win: "Następnym razem niech zapukają." } },
        { key: "grum", name: "Grum", sheet: "anim8/Merc_Walk8", atk: "Merc", maps: [1, 8], from: "here", hp: 200, dmg: 20, poise: 70, cd: [60, 90], speed: 4.1, armor: 0.3,
          follow: true, hideEvent: 3, swing: "#e8e8e8", when: c => c.grum === "ally",
          lines: { start: "Znam ich. Płacili mi kiedyś. Teraz płacą za to.", hit: "Za wolno, chłopcy!", down: "Dobra... to... na razie wszystko...", win: "Żelazna Pięść nie zmienia stron dwa razy." } },
        { key: "rafal", name: "Rafał", sheet: "Npc_Rafal_Walk8", maps: [8], from: "gate", delay: 420, hp: 85, dmg: 10, poise: 24, cd: [80, 110], speed: 3.9,
          hide: ["rafal"], swing: "#b0a090", when: c => c.rafal === "ally",
          lines: { start: "Ukryłeś mnie, kiedy mnie szukali. Teraz ja!", hit: "To za Marka!", down: "Nie... dam rady...", win: "Już nie muszę uciekać." } },
        { key: "marek", name: "Marek", sheet: "Npc_Marek_Walk8", maps: [8], from: "gate", delay: 480, hp: 95, dmg: 11, poise: 26, cd: [80, 110], speed: 3.8,
          hide: ["marek"], swing: "#b0a090", when: c => c.marek,
          lines: { start: "Znam ich twarze z tunelu. Nie przejdą.", hit: "Za tych, co zostali na dole!", down: "Ludmiła... powiedz jej...", win: "Wystarczy. Wracam do domu." } },
        { key: "tadek", name: "Tadek", sheet: "Npc_Kowal_Walk8", maps: [8], from: "gate", delay: 600, hp: 120, dmg: 14, poise: 32, cd: [85, 115], speed: 3.7,
          hide: ["kowal"], swing: "#c8c8d0", help: true, when: c => c.helpers || (c.bell && c.flags.tadekFriend),
          lines: { start: "Kto podnosi rękę na tawernę, ma do czynienia z młotem!", hit: "Kowadło bije mocniej!", down: "Aj... ręka...", win: "Kuźnia otwarta od rana. Jakby co." } },
        { key: "ignac", name: "Ignac", sheet: "Npc_Garbarz_Walk8", maps: [8], from: "gate", delay: 720, hp: 85, dmg: 9, poise: 22, cd: [85, 120], speed: 3.7,
          hide: ["garbarz"], swing: "#b0a090", help: true, when: c => c.helpers,
          lines: { start: "Skórę wam wyprawię, łobuzy!", hit: "Ha!", down: "Uff... starczy mi...", win: "Dobra robota, chłopcze." } },
        { key: "kuba", name: "Kuba", sheet: "Npc_Woziwoda_Walk8", maps: [8], from: "gate", delay: 780, hp: 80, dmg: 8, poise: 20, cd: [85, 120], speed: 3.8,
          hide: ["woziwoda"], swing: "#b0a090", help: true, when: c => c.helpers,
          lines: { start: "Z drągiem od beczek - też się da!", hit: "Masz!", down: "Ała... noga...", win: "Wody wam nie dam. Ale pomóc - zawsze." } },
        { key: "uchodzcy", name: "Uchodźca", sheet: "Npc_Uchodzca_Walk8", maps: [8], from: "gate", delay: 840, hp: 70, dmg: 7, poise: 18, cd: [90, 125], speed: 3.7,
          swing: "#a89070", help: true, n: 2, when: c => c.helpers && c.camp,
          lines: { start: "Uciekaliśmy przed takimi. Dość uciekania!", hit: "Widłami cię!", down: "Ach...", win: "Tu jest teraz nasz dom." } },
        { key: "straz", name: "Strażnik dworu", sheet: "Npc_Straznik_Walk8", maps: [8], from: "gate", delay: 540, hp: 115, dmg: 13, poise: 30, cd: [80, 110], speed: 3.8, armor: 0.15,
          swing: "#d8d8e0", n: 2, when: c => !!c.flags.lordAlly,
          lines: { start: "Jaśnie pan przysyła pozdrowienia. I włócznie.", hit: "W imieniu dworu!", down: "Ranny...!", win: "Zameldujemy jaśnie panu." } }
    ];

    // ---------------------------------------------------------------------------------------------------------------------------
    // Ambroży trusts the hero (he rings the alarm himself): the bell's lessons (D16 - the key of the tower), the chronicles given to
    // him, the truth told, his trust flag - or W2 at its fourth chapter and on (the talk at the bell). f: TownQuests' flags, rec: its
    // record of a quest
    // ---------------------------------------------------------------------------------------------------------------------------
    const AMBROZY = {
        trusts: (f, rec) => !!(f.ambrozyTrust || f.bellKey || f.ambrozyChronicles || f.chroniclesForAmbrozy || f.w9Bell ||
            (rec && rec("W2") && (rec("W2").s === "done" || (rec("W2").step || 0) >= 3))),
        delay: 300   // frames after the strike begins: his first strike
    };
    // the townsfolk come at Opinia `opinion`+ once the alarm is rung (QUESTY.md W2 rozdz. 8)
    const HELP = { opinion: 60 };

    // ---------------------------------------------------------------------------------------------------------------------------
    // The words
    // ---------------------------------------------------------------------------------------------------------------------------
    const TEXT = {
        // the warnings: calls of the town's people near the hero (one each a day), Borgar and Grum in the tavern
        warnBarks: {
            kowal: ["Obcy w kolczugach kupili dziś u mnie dziesięć grotów. Nie targowali się. Nie podoba mi się to."],
            piekarka: ["Rano przy piecu stało dwóch obcych. Pytali, o której Borgar zamyka."],
            woziwoda: ["Na przystani przybił prom bez flagi. Wysiedli sami chłopcy z mieczami."],
            kapral: ["Kazali nam dziś nie patrzeć w stronę tawerny po zmroku. Nie powiem, kto kazał."],
            soltys: ["Ktoś pytał w ratuszu o stare plany tawerny. O piwnice."],
            garbarz: ["Psy całą noc ujadały na drodze do przystani. Ktoś tam obozuje."],
            ludmila: ["Widziałam takich ludzi na kontynencie. Zawsze przed spaloną wsią."],
            rafal: ["To ludzie od kopaczy. Poznaję ich po butach. Idą po wasze schody w dół."],
            kupiec: ["Jutro w nocy nie wychodź z domu, chłopcze. Radzę jako kupiec, nie jako przyjaciel."],
            zlodziej: ["Jakiś wielki w kolczudze dał mi grosz, żebym mu pokazał tylne drzwi tawerny. Nie pokazałem! ...Prawie."],
            dzwonnik: ["Coś wisi w powietrzu. Trzy i jeden - pamiętasz, co to znaczy?"],
            "*": ["Za dużo obcych w miasteczku. Za dużo.", "Słyszałeś? Pytają o piwnicę tawerny..."]
        },
        borgarWarn: ["Dwóch obcych pytało dziś o piwnicę. Powiedziałem, że trzymam tam kapustę.", "Jeśli przyjdą, to nocą. Tacy zawsze przychodzą nocą."],
        grumWarn: {
            ally: "Znam ten zapach. Jutro w nocy przyjdą moi dawni płatnicy. Będę przy drzwiach.",
            enemy: "Nie pij jutro wieczorem w tawernie, przyjacielu. Posłuchaj mnie choć raz.",
            neutral: "Jutro w nocy będzie tu gorąco. To nie moja wojna."
        },
        // Ambroży spoken to while the warnings run (TownLife's talk hook): he will ring - or tells where the rope is
        ambrozyTrusts: ["Słyszałem, co mówią na rynku.", "Jeśli przyjdą do tawerny, zadzwonię trzy i jeden. Ludzie wiedzą, co to znaczy - choć niektórzy udają, że nie."],
        ambrozyNot: ["Trzy i jeden... tak dzwoniło się, kiedy ktoś szedł na twierdzę.", "Lina wisi pod dzwonem, przy mojej wieży. Kto pociągnie, ten woła całe miasto. Ale kto by mnie słuchał."],
        noteArmed: ["Obcy w miasteczku", "Ludzie mówią o obcych z mieczami, którzy pytają o piwnicę tawerny. Ktoś wie, że zszedłem głęboko - i że droga w dół zaczyna się pod naszą podłogą. Jeśli przyjdą, to nocą. Trzy uderzenia dzwonu i jedno to alarm."],
        // the siege
        start: ["Napad na tawernę!", "Ludzie frakcji pod drzwiami. Obroń tawernę."],
        startInside: "Walą w drzwi! Na zewnątrz, szybko!",
        bellAmbrozy: ["Dzwon: trzy i jeden", "Ambroży bije na alarm."],
        bellNeeded: ["Alarm: trzy i jeden", "Lina dzwonu wisi przy wieży Ambrożego (na wschód od rynku)."],
        bellHero: ["Dzwon: trzy i jeden", "Całe miasteczko to słyszy."],
        bellWrong: "To nie był alarm... Jeszcze raz: trzy, przerwa, jeden.",
        bellDone: "Już dzwoni się na alarm.",
        bellCalm: "Nie ma powodu bić na alarm.",
        helpComes: ["Miasteczko idzie z pomocą", "Z młotami i widłami - na dziedziniec tawerny."],
        helpNot: ["Drzwi domów zostają zamknięte", "Miasteczko słyszy dzwon - i udaje, że śpi."],
        helpNotBark: ["Zamknij okiennice, Bronek!", "To nie nasza sprawa...", "Niech straż to załatwi."],
        grumNeutral: "To nie moja wojna. Siedzę i piję.",
        meliaHide: "Melia chowa lutnię pod ladę.",
        ozzyHide: "Ozzy wlazł pod stół.",
        doorBreach: ["Wyważyli drzwi tawerny!", "Ci, co się wdarli, idą w głąb tawerny."],
        cellarBreach: ["Zeszli do piwnicy!", "Stare drzwi puściły - ludzie frakcji są pod tawerną."],
        inside: ["Są w środku!", "Wracaj do tawerny - idą do starych drzwi przy piwnicy."],
        outside: ["Są pod drzwiami!", "Na dziedzińcu tawerny - wyjdź do nich."],
        bossBeaten: "Myślisz, że jesteśmy jedyni? Za nami przyjdą następni.",
        grumEnemy: "Mówiłem ci, żebyś nie przychodził. Teraz już za późno.",
        grumEnemyBeaten: "Dobra. Twoja wygrana. Odpływam pierwszym promem.",
        offscreenNotice: ["Kiedy cię nie było...", "Frakcja uderzyła na tawernę."],
        beaten: "Pobili cię - a reszta toczyła się bez ciebie.",
        // the outcomes: the top notice, Borgar's words, the journal's note
        outcome: {
            held: { title: "Tawerna obroniona", sub: "Do świtu nikt już nie zapuka. Borgar stawia wszystkim.",
                say: "Nie wiem, co oni tam chcieli znaleźć... ale nie dostali tego. Masz. Na koszt firmy - i to też.",
                note: ["Noc pod tawerną", "Frakcja uderzyła na tawernę - i odeszła z niczym. Piwnica jest nasza, krata cała. Miasteczko o tym mówi."] },
            costly: { title: "Tawerna ocalała - ale drogo", sub: "Okopcone ściany, połamane stoły, ranni ludzie. Piwnica nasza.",
                say: "Stoi. Okopcona, połamana, ale stoi. Odbudujemy. Ludzi szkoda bardziej niż stołów.",
                note: ["Noc pod tawerną", "Obroniliśmy piwnicę, ale tawerna wygląda jak po pożarze. Ranni: {lost}. Frakcja wróci - już wie, gdzie jest droga w dół."] },
            fallen: { title: "Tawerna padła", sub: "Zeszli do piwnicy. Teraz są pod nami - i przed nami.",
                say: "Przeszli przez stare drzwi... Krata stoi otworem. Synu - oni są już na dole. Przed tobą.",
                note: ["Noc pod tawerną", "Nie zatrzymaliśmy ich. Ludzie frakcji zeszli przez stare drzwi do piwnicy i dalej w dół. Na dole będą przede mną - i może przy samym Sercu."] }
        },
        // names in the outcome's lists (keys -> names)
        names: { borgar: "Borgar", grum: "Grum", rafal: "Rafał", marek: "Marek", tadek: "Tadek", ignac: "Ignac", kuba: "Kuba", uchodzcy: "uchodźcy", straz: "strażnicy dworu" },
        // F9 (Debug.js's menu, the events tab)
        f9Arm: "Akt III: uzbrój napad (ostrzeżenia, napad następnej nocy)",
        f9Start: "Akt III: napad na tawernę teraz",
        f9Reset: "Akt III: wyczyść stan napadu"
    };

    window.Act3Data = { TRIGGER, TOWN, TAVERN, SPOTS, IDS, WAVES, CAPTAIN, LEVEL, PACE, DOORS, OUTCOME, POWER, REWARD, SCARS, DEFENDERS, AMBROZY, HELP, TEXT };
})();
