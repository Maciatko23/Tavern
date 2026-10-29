//=============================================================================
// Przystan.js
//=============================================================================
// The harbour on the island's west coast (Map125 "Przystań", behind Podgrodzie; interiors 126 Chata Janka, 127 Szopa przy pochylni,
// 128 Komora celna - tools/przystan, docs/przystan/KONCEPCJA.md, approved by the user 2026-10-14). Its people are TownLife residents
// (TownLife_Data.js: janek 939, przemytnik 940, celnik 941, straznik_przystan 942); their quests are TownQuests' (K47, K48, D20, W10 -
// the thread "przystan" of Przystan_Data.js, put into TownQuests_Data.js's list). This plugin is what is the harbour's own:
//   - the first meetings, before any quest (Tawerna.talk.takeover, "meet" priority): Janek, who found the hero on the beach, gives back the
//     mother's scarf the sea threw up with the bundle (item 175, a keepsake); Roch Szkwał, the smuggler of the prologue, alive, hiding
//     under his first name - "hide that pendant"; the customs officer's ledger
//   - Janek's trade: he buys the sea's herring (173) and cod (174) and the pond's fish, sells smoked fish
//   - the ferry (TownQuests.isFerry: every 3 days) at the pier 9-15 with its ferryman (an injected event): no passage for the hero
//   - Roch's cutter: a wreck on the beach -> on the slipway (D20, flag d20Pochylnia) -> afloat (d20Gotowy); the night it sails (the
//     hero distracts the guard: d20Pomoc) and then a run every RUN_EVERY nights (Roch and the cutter away 21-6) with news and goods
//     from the mainland; or the hero gives him to the customs officer in the customs house (d20Wydany: 40 G, Roch gone for good)
//   - W10 "List do matki": the letter by the ferry (3 G - the officer reads it) or by the cutter; the news comes back (the thread
//     stays open: the mother does not come)
//   - (2026-10-17, W10 continued - the user's variant A) the mother's letters back: three of them, by the ferry (the ferryman on a
//     ferry day) or by Roch's cutter (after a run), the first some days after the news, the last about Act III; read in her own voice
//     (her bust - an injected silent event 763 beside the hero); grandpa's talk about his daughter (TownQuests' talk step); the hero's
//     answers with money or a parcel of food that keeps (ferry: 3 G and a tenth to the officer; the cutter free); one epilogue line
//     after the Heart (Przystan.epilogue, read by Underground.js); F9 "Wyspa i fabuła": "W10: przyślij list od matki"
//   - Janek's boat away while he is at sea; the thread's hooks (K47's rod, W10's words, the talks' actions); the sea's fishing bonus
//     after Janek's advice (Farming_Plots asks fishBonus)
// Ids 760-779 (Tawerna.inject, Map125): 760 the ferryman, 761-762 people off the ferry on the wave days, 763 the mother's voice
// (never seen: the letters' speaker, with her bust).
// DROUGHT (the user's rule): the sea is salt (the map's <Water:salt>, Farming_Plots.js) - nothing here gives the hero water.

/*:
 * @target MZ
 * @plugindesc Przystań (mapa 125): Janek i chusta matki, Roch Szkwał i jego kuter, celnik Lorda, prom w dni promu, skup ryb, list do matki. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Przystan_Data
 * @orderAfter Przystan_Data
 * @orderAfter TownLife
 * @orderAfter TownQuests
 *
 * @help
 * ============================================================================
 * Przystan.js - przystań na zachodnim brzegu wyspy
 * ============================================================================
 * Mapa 125 „Przystań” (za Podgrodziem), wnętrza 126 Chata Janka, 127 Szopa
 * przy pochylni, 128 Komora celna. Mieszkańcy są w TownLife_Data.js (Janek,
 * Roch, celnik Sambor Kwit, strażnik przystani), zadania w Przystan_Data.js
 * (K47 „Pierwszy połów”, K48 „Sieci po sztormie”, D20 „Kuter na pochylni”,
 * W10 „List do matki”) - wątek „przystan”, tu jego haki.
 *
 * Ta wtyczka:
 * - pierwsze spotkania: Janek oddaje Chustę matki (pamiątka), Roch żyje i
 *   każe schować wisiorek, celnik przedstawia się;
 * - Janek skupuje śledzie, dorsze i ryby, sprzedaje wędzoną rybę;
 * - prom stoi przy molo w dni promu (co 3 dni, 9-15), przewoźnik nie bierze
 *   nikogo bez glejtu Lorda, ale bierze listy;
 * - kuter Rocha: wrak na plaży, na pochylni, na wodzie; nocny rejs po
 *   wyborze w D20 (albo donos u celnika w komorze celnej);
 * - W10 „List do matki”: list promem albo kutrem, wieści z lądu, potem trzy
 *   listy od matki (przewoźnik w dzień promu albo Roch po rejsie; ostatni
 *   w okolicach Aktu III), rozmowa z dziadkiem, odpowiedzi z pieniędzmi
 *   albo paczką jedzenia, linijka w epilogu po Sercu, wiersz w F9;
 * - morze jest słone: picia nie ma (Farming_Plots.js, notatka <Water:salt>).
 *
 * Zdarzenia 760-779 na mapie 125: przewoźnik promu i ludzie z promu.
 * W skryptach: Przystan.state(), Przystan.kuterState(), Przystan.ferryNow().
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("przystan");   // (the words of this file: js/teksty/przystan.txt, kod.*)

    const T = window.Tawerna;
    if (!T) throw new Error("Przystan.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const PLUGIN = "Przystan";
    const MAP = 125, CUSTOMS = 128;
    const ITEM = { fish: 98, herring: 173, cod: 174, scarf: 175, tar: 176, smokedFish: 106, rod: 100, iron: 86, steel: 143, bandage: 152 };
    const SELL = { 173: 4, 174: 7, 98: 3 };                 // what Janek pays a piece
    const BUY_SMOKED = 16;                                   // a smoked fish from Janek
    const GOODS = [[86, 23], [143, 60], [152, 9]];           // Roch's goods from the mainland (half again dearer than the town)
    const LETTER_FERRY = 3, BETRAY_GOLD = 40, RUN_EVERY = 4;
    const WAVES = [10, 25, 37, 52];                          // the ferry's wave days - a fallback: TownQuests.waves() is the one source (W6)
    const FERRY_HOURS = [9, 15];
    const IDS = [760, 779];
    const COIN_ICON = 314;
    // (2026-10-17) W10's letters from the mother: the days between (gap1 after the news; the second gap2 after the first, or
    // reply+replyGap once answered, silentGap unanswered; the third gap3 after the second and only about Act III - noAct3 without
    // Act3.js), the gifts (gold; a parcel of `foodN` things that keep), the officer's tenth on money by the ferry, the quest's steps
    const MOTHER = 763;
    const W10 = { gap1: 8, gap2: 10, replyGap: 8, silentGap: 16, gap3: 10, noAct3: 24, gold: [20, 50], food: [105, 106, 124, 76], foodN: 3,
        cut: 0.1, step: { letter1: 2, grandpa: 3, letter2: 4, letter3: 5 } };
    const day = () => T.time.day(), hour = () => T.time.hour();
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const has = () => !!window.$gameSystem;

    // ------------------------------------------------------------------
    // The thread "przystan" (the engine Watki.js, docs/WATKI_DANE.md; its data - the harbour's state, the quests K47, K48, D20, W10
    // with their steps, the first meetings, Roch's night, the officer's offer - in Przystan_Data.js since 2026-10-29). Its words:
    // js/teksty/przystan.txt; the hooks below (w.haki: the menus with fish, goods and letters stay code - Watki.mowa)
    // ------------------------------------------------------------------
    const resident = key => { const L = TL(); return L && L.RESIDENTS ? L.RESIDENTS.find(r => r.key === key) || null : null; };
    function speaker(key) {
        const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null, r = resident(key);
        return { id: ev && $gameMap.event(ev.eventId()) === ev ? ev.eventId() : -1, name: r ? r.name : key };
    }
    const w = Watki.get("przystan");
    if (!w) throw new Error("Przystan.js: brak wątku „przystan” - Przystan_Data.js musi być wyżej na liście wtyczek");
    const { HERO, C, choiceTo } = Watki.mowa;
    const AK = { akapity: true, kto: speaker };
    const sayTo = (out, spk, text, ind) => Watki.mowa.sayTo(out, spk, text, ind || 0, AK);
    const linesTo = (out, spk, arr, ind) => Watki.mowa.linesTo(out, spk, arr, null, ind || 0, AK);

    // ------------------------------------------------------------------
    // The state (the save): the thread's
    // ------------------------------------------------------------------
    const S = () => w.S();
    // W10's letters (an older save has none yet): got [{ day, via }] the mother's letters read, replies [{ day, via, gold, food, gp }]
    // the hero's (gp: grandpa's words were in it), gold / food sent in all, force: the next letter comes at once (F9)
    const W = () => { const s = S(); return s.w10 || (s.w10 = { got: [], replies: [], gold: 0, food: 0, force: 0 }); };
    const flags = () => w.flags();
    function setFlag(k) { w.setFlag(k); w.autoChecks(); }   // (a flag and at once the quests' checks and markers)
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const qRec = id => w.rec(id);
    const atStep = (id, n) => { const r = qRec(id); return !!r && r.s === "active" && r.step === n; };

    // ------------------------------------------------------------------
    // The calendar: the ferry, the cutter's state and its runs
    // ------------------------------------------------------------------
    const ferryToday = (d = day()) => { const q = TQ(); return q && q.isFerry ? !!q.isFerry(d) : (d - 1) % 3 === 0; };
    const ferryNow = () => has() && ferryToday() && hour() >= FERRY_HOURS[0] && hour() < FERRY_HOURS[1];
    // (2026-10-28, docs/PODROZNI.md 5.1-5.2) the waves are TownQuests' (10, 25, 37, 52 - always a ferry day); the first wave brings
    // Ludmiła and Ela - on the pier till noon (in the town from noon: TownLife "w6Obecni"), the others till 14
    const waves = () => { const q = TQ(); return q && q.waves ? q.waves() : WAVES; };
    const firstWave = () => has() && waves()[0] === day();
    const waveNow = () => ferryNow() && waves().includes(day()) && hour() < (firstWave() ? 12 : 14);
    function kuterState() {
        const f = flags();
        if (f.d20Wydany) return "seized";
        if (f.d20Gotowy) return "water";
        if (f.d20Pochylnia) return "slip";
        return "beach";
    }
    const runNight = d => { const r0 = S().runDay0; return !!(has() && flags().d20Pomoc && r0 && d >= r0 && (d - r0) % RUN_EVERY === 0); };
    const kuterAway = () => has() && ((hour() >= 21 && runNight(day())) || (hour() < 6 && runNight(day() - 1)));
    // the last run that has come back (its day), 0 if none yet
    function lastRunBack() {
        if (!has() || !flags().d20Pomoc || !S().runDay0) return 0;
        const d = day(), h = hour();
        for (let r = d; r >= S().runDay0; r--) {
            if (!runNight(r)) continue;
            if (d > r + 1 || (d === r + 1 && h >= 6)) return r;
        }
        return 0;
    }
    const rochGone = () => has() && !!flags().d20Wydany;
    const fishBonus = () => (has() && flags().rybackaRada ? 0.1 : 0);

    // ------------------------------------------------------------------
    // W10: the mother's letters - which one is next, from which day, who brings it, may the hero answer
    // ------------------------------------------------------------------
    const storyGame = () => { const St = T.api("Story"); try { return !!(St && St.active && St.active()); } catch (e) { return false; } };
    const siegeFlags = () => { const f = flags(); return !!(f.act3Held || f.act3Costly || f.act3Fallen); };
    // Act III is near: the faction is coming or has come (Act3.phase not "idle"); without Act3.js: `noAct3` days after the last letter
    function act3Near(sinceDay) {
        if (siegeFlags()) return true;
        const A = T.api("Act3");
        if (!A || typeof A.phase !== "function") return day() >= sinceDay + W10.noAct3;
        let ph = "idle";
        try { ph = A.phase(); } catch (e) { ph = "idle"; }
        return !!ph && ph !== "idle";
    }
    function siegeOver() {
        if (siegeFlags()) return true;
        const A = T.api("Act3");
        try { return !!(A && A.outcome && A.outcome()); } catch (e) { return false; }
    }
    // the letter that comes next (1-3) while W10 waits for it, else 0
    function letterNo() {
        if (!has()) return 0;
        const k = W().got.length + 1;
        return k <= 3 && atStep("W10", W10.step["letter" + k]) ? k : 0;
    }
    const replyTo = k => W().replies.find(r => r.to === k) || null;
    const sentBefore = (k, what) => W().replies.filter(r => r.to < k).reduce((n, r) => n + (r[what] || 0), 0);
    // the day letter k may come from, null while it may not (the third waits for Act III); F9's force: at once
    function dueDay(k) {
        const w = W();
        if (w.force === k) return 0;
        if (k === 1) { const n = flags().w10Wiesc; return n ? n + W10.gap1 : null; }
        const prev = w.got[k - 2];
        if (!prev) return null;
        if (k === 2) { const r = replyTo(1); return r ? Math.max(prev.day + W10.gap2, r.day + W10.replyGap) : prev.day + W10.silentGap; }
        return act3Near(prev.day) ? prev.day + W10.gap3 : null;
    }
    const rochRuns = () => has() && !!flags().d20Pomoc && !flags().d20Wydany;
    // has the ferryman ("prom": a ferry day, 9-15) / Roch ("kuter": a run that came back on the day or later) letter k for the hero?
    function letterHere(k, who) {
        const d = k ? dueDay(k) : null;
        if (d === null) return false;
        if (who === "prom") return ferryNow() && day() >= d;
        if (who === "kuter") { const b = lastRunBack(); return rochRuns() && !kuterAway() && (W().force === k || (!!b && b + 1 >= d)); }
        return false;
    }
    // the hero may answer the last letter that came, once
    const canReply = () => has() && W().got.length > 0 && !replyTo(W().got.length);

    // ------------------------------------------------------------------
    // Event commands (Watki.mowa; "> " the hero, "@key: " another resident of the harbour) for the menus built here
    // ------------------------------------------------------------------
    const act = (out, args, ind) => Watki.mowa.script(out, "Przystan.act(this, " + JSON.stringify(args) + ")", ind);
    // the resident's usual line for now (TownLife's talk slots)
    function usual(key) {
        const L = TL(), t = L && L.lines ? L.lines(key) : null;
        if (!t) return "";
        const h = hour(), w = $gameScreen.weatherType(), rain = (w === "rain" || w === "storm") && $gameScreen.weatherPower() > 0;
        const slot = rain && t.rain ? "rain" : h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
        const list = t[slot] || t.day || [];
        if (!list.length) return "";
        S().usualN = (S().usualN || 0) + 1;
        return list[S().usualN % list.length];
    }
    // a quest of this resident's that wants him now (an offer or a hand-in): TownQuests speaks first then
    function questWants(key) {
        const q = TQ();
        if (!q || !q.markers) return false;
        if (q.refreshMarkers) q.refreshMarkers();
        const m = q.markers()[key];
        return m === "ready" || m === "new";
    }
    const questTalk = key => { const q = TQ(); return q && q.talkFor ? q.talkFor(key, false) : null; };

    // ------------------------------------------------------------------
    // TEXTS
    // ------------------------------------------------------------------
    const TX = {
        rochNews: [
            [],
            [],
            [],
            [],
            []],
        // (2026-10-15) the red water (CzerwonaWoda.js): why nobody boils the sea, the legend of the blood of Kruczych Skał
        refugees: [[], [],
            []],
        // (2026-10-17) W10 continued: the mother's letters - read in her voice (event 763 with Matka_Bust, the plate "Matka"), who
        // brings them, the hero's answers; grandpa's talk is TownQuests_Data's (W10's step 3)
        letters: {
            2: {
            },
            3: {
            }
        },
        reply: {
        },
        replyOpts: { },
        janekLetter: { },
        // W10's step lines ({odpis} in TownQuests_Data's W10, FX w10Vars)
        vars: { },
        // one line in the epilogue after the Heart (Underground.js asks Przystan.epilogue)
        epilog: {
        },
        f9: { }
    };
    Watki.scal(TX, "przystan", "");   // (its words: js/teksty/przystan.txt)

    // ------------------------------------------------------------------
    // W10: the letter as it is read (the carrier's words, then the mother's own - her bust - then the hero's) and the answer
    // ------------------------------------------------------------------
    const fillN = (s, n) => String(s).replace(/\{n\}/g, n);
    // what letter k says now (by what the hero answered and sent before it): { mom: [paragraphs], hero: [lines] }
    function letterText(k) {
        const L = TX.letters;
        if (k === 1) return { mom: L[1].slice(), hero: L.hero1.slice() };
        if (k === 2) {
            const r = replyTo(1), gold = sentBefore(2, "gold"), food = sentBefore(2, "food"), M = L[2];
            const mom = [r ? M.replied : M.silent, r && r.gp ? M.pipe : M.kiss, gold ? M.gold : M.noGold];
            if (food) mom.push(M.food);
            mom.push(M.land, M.end);
            return { mom, hero: (gold ? M.heroGold : M.hero).slice() };
        }
        const M = L[3], help = sentBefore(3, "gold") > 0 || sentBefore(3, "food") > 0;
        return { mom: [M.open, M.belt, M.north, M.warn, help ? M.help : W().replies.length ? M.wrote : M.silent, M.end],
            hero: [M.heroBelt, siegeOver() ? M.heroCame : M.heroRocks] };
    }
    const heroName = () => { const a = window.$gameActors && $gameActors.actor(1); return a ? a.name() : ""; };
    // the carrier hands letter k over, then it is read
    function letterList(k, via, spk) {
        const out = [];
        linesTo(out, spk, via === "prom" ? (k === 1 ? TX.ferryLetterIn : TX.ferryLetterMore)
            : k === 1 ? (flags().w10Kuter ? TX.rochLetterFound : TX.rochLetterPort) : TX.rochLetterMore);
        act(out, ["w10Open", k]);
        out.push(C(230, [3]));
        const t = letterText(k), mom = { id: MOTHER, name: TX.momName };
        for (const p of t.mom) sayTo(out, mom, p);
        linesTo(out, mom, t.hero);
        return act(out, ["w10Letter", k, via]);
    }
    // the answer: what is sent with it (a choice), the hero writing, the carrier taking it
    const GIFTS = ["none", "g1", "g2", "food"];
    function replyMenu(via, spk) {
        const O = TX.replyOpts;
        const labels = [O.plain, fillN(O.gold, W10.gold[0]), fillN(O.gold, W10.gold[1]), fillN(O.food, W10.foodN), O.no];
        const branches = GIFTS.map(g => act([], ["w10Reply", via, g]).concat(replyLines(via, g, spk))).concat([[]]);
        return choiceTo([], labels, branches, labels.length - 1);
    }
    function replyLines(via, gift, spk) {
        const R = TX.reply, i = W().replies.length + 1, out = [i === 1 ? R.first : i === 2 ? R.second : R.more];
        if (flags().w10Dziadek && !W().replies.some(r => r.gp)) out.push(R.pipe);
        if (gift === "g1" || gift === "g2") out.push(fillN(R.gold, W10.gold[gift === "g1" ? 0 : 1]));
        if (gift === "food") out.push(R.food);
        // (2026-10-29, docs/PODROZNI.md decyzja 14: Tobiasz i Urszula biorą list bez celnika i opłaty - ich słowa: reply.<via>)
        const said = via === "prom" ? R.ferry.concat(gift === "g1" || gift === "g2" ? R.ferryCut : []) : (via !== "kuter" && R[via]) || R.roch;
        return linesTo([], spk, out.concat(said));
    }

    // ------------------------------------------------------------------
    // The talks: Janek, Roch, the customs officer (TownLife's hook, first), the ferryman (an injected event)
    // ------------------------------------------------------------------
    const pick = list => list[Math.floor(Math.random() * list.length)];
    function janekTalk(ev) {
        const spk = { id: ev.eventId(), name: "Janek" }, f = flags(), out = [];
        if (!f.janekMet) return w.rozmowa("janekSpotkanie", { spk });
        if (f.d20Wydany && !S().janekBetrayTold) return w.rozmowa("janekZdrada", { spk });
        if (questWants("janek")) { const q = questTalk("janek"); if (q && q.length) return q; }
        // (W10) a letter from the mother waits with the ferryman or with Roch: Janek says so
        const lk = letterNo(), lw = lk && letterHere(lk, "prom") ? "prom" : lk && letterHere(lk, "kuter") ? "kuter" : null;
        linesTo(out, spk, [lw ? TX.janekLetter[lw] : pick(TX.janekMenuAsk)]);
        const labels = [], branches = [];
        const fish = [ITEM.herring, ITEM.cod, ITEM.fish].filter(id => count(id) > 0);
        labels.push(fish.length ? Watki.wstaw(TK.kod.janekTalk[0], { "1": fish.map(id => item(id).name.toLowerCase() + " ×" + count(id)).join(", ") }) : TK.kod.janekTalk[1]);
        branches.push(fish.length ? act([], ["sell"]).concat(linesTo([], spk, [pick(TX.janekSold)])) : linesTo([], spk, TX.janekSellNone));
        labels.push(Watki.wstaw(TK.kod.janekTalk[2], { BUY_SMOKED: BUY_SMOKED }));
        branches.push(act([], ["buySmoked"]));
        const RW = T.api("CzerwonaWoda");
        if (RW && RW.seaHere && $gameMap.mapId() === MAP) { labels.push(TK.kod.janekTalk[3]); branches.push(linesTo([], spk, RW.phase().grey ? TX.janekGrey : TX.janekRed)); }
        labels.push(TK.kod.janekTalk[4]);
        branches.push(linesTo([], spk, [usual("janek") || TK.kod.janekTalk[5]]));
        labels.push(TX.bywaj);
        branches.push([]);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    function rochTalk(ev) {
        const spk = { id: ev.eventId(), name: "Roch" }, f = flags(), out = [];
        if (!f.rochMet) return w.rozmowa("rochSpotkanie", { spk });
        // D20's night: the cutter is ready - tonight, while the guard sits by the brazier
        const h = hour();
        if (atStep("D20", 6) && (h >= 20 || h < 2)) return w.rozmowa("rochNoc", { spk });
        // (W10) a letter from the mother came with the cutter: handed over first
        const lk = letterNo();
        if (lk && letterHere(lk, "kuter")) return letterList(lk, "kuter", spk);
        if (questWants("przemytnik")) { const q = questTalk("przemytnik"); if (q && q.length) return q; }
        // the news after a run (the first one with the letter to the mother: the mother's trace)
        const back = lastRunBack();
        if (back && S().newsGiven < back) {
            const first = f.w10Kuter && atStep("W10", 1) && (back > S().letterDay || (back === S().letterDay && S().letterHour < 21));
            act(out, ["rochNews", back, first ? 1 : 0]);
            return linesTo(out, spk, first ? TX.rochNews[0] : TX.rochNews[1 + (S().newsN % (TX.rochNews.length - 1))]);
        }
        linesTo(out, spk, [pick(TX.rochMenuAsk)]);
        const labels = [], branches = [];
        if (atStep("W10", 0) && f.d20Pomoc) { labels.push(TK.kod.rochTalk[2]); branches.push(act([], ["w10Kuter"]).concat(linesTo([], spk, TX.rochLetter))); }
        else if (canReply() && rochRuns()) { labels.push(TX.replyOpts.roch); branches.push(replyMenu("kuter", spk)); }
        if (back && back >= day() - 2) {
            labels.push(TK.kod.rochTalk[3]);
            const sub = linesTo([], spk, TX.rochGoods);
            choiceTo(sub, GOODS.map(([id, p]) => item(id).name + " - " + p + " G").concat([TK.kod.rochTalk[4]]),
                GOODS.map(([id]) => act([], ["buy", id])).concat([[]]));
            branches.push(sub);
        }
        if (T.api("CzerwonaWoda")) { labels.push(TK.kod.rochTalk[5]); branches.push(linesTo([], spk, TX.rochRed)); }
        labels.push(TK.kod.rochTalk[6]);
        branches.push(linesTo([], spk, [usual("przemytnik") || TK.kod.rochTalk[7]]));
        labels.push(TX.bywaj);
        branches.push([]);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    function celnikTalk(ev) {
        const spk = { id: ev.eventId(), name: TK.kod.celnikTalk[0] };
        if (!S().celnikMet) return w.rozmowa("celnikSpotkanie", { spk });
        // D20: the hero may give Roch away - in the customs house, at the officer's desk
        if ($gameMap.mapId() === CUSTOMS && atStep("D20", 6) && !flags().d20Wydany) return w.rozmowa("celnikDonos", { spk });
        return null;
    }
    function hook(key, ev) {
        if (!has()) return null;
        if (key === "janek") return janekTalk(ev);
        if (key === "przemytnik") return rochTalk(ev);
        if (key === "celnik") return celnikTalk(ev);
        return null;
    }
    // (2026-10-23, docs/ROZMOWY.md) the core's talk service: Janek, Roch and the officer - first meetings and their menus before the
    // quests ("meet"; the quests' hand-ins come through their questWants), after the other plugins' errands at them (as the old hooks)
    function hookTalk() {
        if (hookTalk.done) return;
        hookTalk.done = true;
        T.talk.takeover({ owner: PLUGIN, who: ["janek", "przemytnik", "celnik"], priority: T.talk.PRIORITY.meet,
            run: ctx => { try { return hook(ctx.who, ctx.ev); } catch (e) { console.error("[Przystan]", e); return null; } } });
    }
    hookTalk();

    // the ferryman and the people off the ferry (injected events): Przystan.talk(this, "ferry" | "refugee")
    function talk(interp, who) {
        if (!has() || !interp) return;
        const ev = $gameMap.event(interp.eventId());
        if (!ev || (ev._przystan && ev._przystan.hidden)) return;
        const out = [];
        if (who === "ferry") {
            const spk = { id: ev.eventId(), name: TK.kod.talk[0] }, f = flags(), lk = letterNo();
            if (atStep("W10", 1) && f.w10Prom && day() >= S().letterDay + 3) {
                linesTo(out, spk, TX.ferryNews);
                if (count(ITEM.scarf) > 0) linesTo(out, spk, TX.ferryNewsScarf);
                act(out, ["ferryNews"]);
            } else if (lk && letterHere(lk, "prom")) {
                letterList(lk, "prom", spk).forEach(c => out.push(c));   // (W10: a letter from the mother)
            } else {
                linesTo(out, spk, TX.ferry);
                if (atStep("W10", 0)) choiceTo(out, [Watki.wstaw(TK.kod.talk[1], { LETTER_FERRY: LETTER_FERRY }), TK.kod.talk[2]],
                    [act([], ["w10Ferry"]).concat(linesTo([], spk, TX.ferryLetter)), []], 1);
                else if (canReply()) choiceTo(out, [TX.replyOpts.ferry, TK.kod.talk[2]], [replyMenu("prom", spk), []], 1);
            }
        } else {
            const p = PEOPLE.find(x => x.id === ev.eventId()), f1 = p && p.fala1 && firstWave() ? p.fala1 : null;
            const spk = { id: ev.eventId(), name: f1 ? (resident(f1.who) || {}).name || ev.event().name : ev.event().name };
            linesTo(out, spk, f1 ? TX.fala1[f1.who] : TX.refugees[(ev.eventId() + day()) % TX.refugees.length]);
        }
        if (out.length) interp.setupChild(out.concat([C(0, [])]), ev.eventId());
    }

    // the script calls from the talks
    function actCall(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const [what, a, b] = args, f = flags();
        const stop = () => { if (interp && interp._list) interp._index = interp._list.length; };
        try {
            if (what === "janekMet") {
                if (!f.janekMet) {
                    setFlag("janekMet");
                    if (count(ITEM.scarf) < 1 && item(ITEM.scarf)) $gameParty.gainItem(item(ITEM.scarf), 1);
                    T.popup(TK.kod.actCall[0], { top: true, color: "#ffd23f", sub: TK.kod.actCall[1] });
                    note(TK.kod.actCall[0], TK.kod.actCall[2]);
                }
            } else if (what === "rochMet") {
                if (!f.rochMet) {
                    setFlag("rochMet");
                    note(TK.kod.actCall[3], TK.kod.actCall[4]);
                }
            } else if (what === "celnikMet") {
                S().celnikMet = day();
            } else if (what === "janekBetrayTold") {
                S().janekBetrayTold = day();
            } else if (what === "sell") {
                let gold = 0;
                for (const id of [ITEM.herring, ITEM.cod, ITEM.fish]) {
                    const n = count(id);
                    if (n > 0) { $gameParty.loseItem(item(id), n, false); gold += n * SELL[id]; }
                }
                if (gold > 0) { $gameParty.gainGold(gold); S().sold += gold; T.popup("+" + gold + " G", { icon: COIN_ICON, kind: "good" }); }
            } else if (what === "buySmoked") {
                if ($gameParty.gold() < BUY_SMOKED) { T.popup.need(COIN_ICON, Watki.wstaw(TK.kod.actCall[5], { BUY_SMOKED: BUY_SMOKED })); stop(); return; }
                $gameParty.loseGold(BUY_SMOKED);
                $gameParty.gainItem(item(ITEM.smokedFish), 1);
            } else if (what === "buy") {
                const g = GOODS.find(x => x[0] === a);
                if (!g) return;
                if ($gameParty.gold() < g[1]) { T.popup.need(COIN_ICON, Watki.wstaw(TK.kod.actCall[6], { "1": g[1] })); stop(); return; }
                $gameParty.loseGold(g[1]);
                $gameParty.gainItem(item(g[0]), 1);
            } else if (what === "d20Help") {
                if (!f.d20Pomoc && atStep("D20", 6)) {
                    S().runDay0 = hour() < 6 ? day() - 1 : day();
                    setFlag("d20Pomoc");
                    note(TK.kod.actCall[7], TK.kod.actCall[8]);
                }
            } else if (what === "d20Betray") {
                if (!f.d20Wydany && atStep("D20", 6)) {
                    $gameParty.gainGold(BETRAY_GOLD);
                    T.popup("+" + BETRAY_GOLD + " G", { icon: COIN_ICON, kind: "good" });
                    setFlag("d20Wydany");
                    const L = TL();
                    if (L && L.setGone) L.setGone("przemytnik", true);
                    note(TK.kod.actCall[9], TK.kod.actCall[10]);
                }
            } else if (what === "rochNews") {
                S().newsGiven = Math.max(S().newsGiven, a || 0);
                if (b && f.w10Kuter && atStep("W10", 1)) newsOfMother(TK.kod.actCall[11]);
                else S().newsN = (S().newsN || 0) + 1;
            } else if (what === "w10Kuter") {
                if (atStep("W10", 0)) { S().letterDay = day(); S().letterHour = hour(); setFlag("w10Kuter"); }
            } else if (what === "w10Ferry") {
                if (!atStep("W10", 0)) return;
                if ($gameParty.gold() < LETTER_FERRY) { T.popup.need(COIN_ICON, Watki.wstaw(TK.kod.actCall[12], { LETTER_FERRY: LETTER_FERRY })); stop(); return; }
                $gameParty.loseGold(LETTER_FERRY);
                S().letterDay = day(); S().letterHour = hour();
                setFlag("w10Prom");
            } else if (what === "ferryNews") {
                if (atStep("W10", 1)) newsOfMother(TK.kod.actCall[13]);
            } else if (what === "w10Open") {
                // (the mother's voice: her silent event beside the hero, so the talk's bubble has her bust)
                const ev = $gameMap.mapId() === MAP ? $gameMap.event(MOTHER) : null;
                if (ev) { ev.setPosition($gamePlayer.x, $gamePlayer.y); setShown(ev, false); probeBust(ev); }
            } else if (what === "w10Letter") {
                if (letterNo() !== a) return;
                const w = W(), t = letterText(a), name = heroName();
                w.got.push({ day: day(), via: b });
                if (w.force === a) w.force = 0;
                if (b === "kuter") S().newsGiven = Math.max(S().newsGiven, lastRunBack());
                note(TX.letterTitles[a - 1], t.mom.map(p => p.replace(/\\N\[1\]/g, name)).join("\n"));
                setFlag("w10List" + a);
            } else if (what === "w10Reply") {
                replyAct(interp, a, b, stop);
            }
        } catch (e) { console.error("[Przystan] act " + JSON.stringify(args), e); }
    }
    // W10: the hero's answer to the last letter - by the ferry (3 G, a tenth of the money to the officer) or the cutter (free); with
    // nothing, 20 / 50 G, or a parcel of food that keeps (W10.foodN things of W10.food, the most plentiful first)
    function replyAct(interp, via, gift, stop) {
        const w = W(), k = w.got.length;
        if (!k || replyTo(k)) { stop(); return; }
        const fee = via === "prom" ? LETTER_FERRY : 0, g = gift === "g1" ? W10.gold[0] : gift === "g2" ? W10.gold[1] : 0;
        if ($gameParty.gold() < fee + g) { T.popup.need(COIN_ICON, Watki.wstaw(TK.kod.replyAct[0], { "1": fee + g })); stop(); return; }
        const names = [];
        let food = 0;
        if (gift === "food") {
            if (W10.food.reduce((n, id) => n + count(id), 0) < W10.foodN) {
                const ic = item(W10.food[0]);
                T.popup.need(ic ? ic.iconIndex : COIN_ICON, TX.foodNeed);
                stop();
                return;
            }
            let left = W10.foodN;
            for (const id of W10.food.slice().sort((x, y) => count(y) - count(x))) {
                const n = Math.min(left, count(id));
                if (n > 0) { $gameParty.loseItem(item(id), n, false); left -= n; names.push(item(id).name.toLowerCase() + (n > 1 ? " ×" + n : "")); }
                if (!left) break;
            }
            food = W10.foodN;
        }
        if (fee + g > 0) $gameParty.loseGold(fee + g);
        const net = via === "prom" ? Math.floor(g * (1 - W10.cut)) : g;
        const gp = !!flags().w10Dziadek && !w.replies.some(r => r.gp);
        w.replies.push({ day: day(), to: k, via, gold: net, food, gp });
        w.gold += net;
        w.food += food;
        setFlag("w10Odpisal");
        if (net || food) setFlag("w10Pomoc");
        const przez = via === "prom" ? TK.kod.replyAct[1] : via === "kuter" ? TK.kod.replyAct[2] : (TK.kod.przez && TK.kod.przez[via]) || TK.kod.replyAct[2];
        const text = Watki.wstaw(TK.kod.replyAct[7], { "1": przez, "2": g ? Watki.wstaw(TK.kod.replyAct[4], { net: net, "2": net !== g ? Watki.wstaw(TK.kod.replyAct[3], { g: g }) : "" }) : "", "3": food ? Watki.wstaw(TK.kod.replyAct[5], { "1": names.join(", ") }) : "", "4": gp ? TK.kod.replyAct[6] : "" });
        note(TX.replyTitles[Math.min(w.replies.length, TX.replyTitles.length) - 1] + (w.replies.length > TX.replyTitles.length ? " (" + w.replies.length + ")" : ""), text);
        T.popup(TX.replyPop, { top: true, color: "#ffd23f", sub: via === "prom" ? TK.kod.replyAct[8] : via === "kuter" ? TK.kod.replyAct[9] : (TK.kod.przezPod && TK.kod.przezPod[via]) || TK.kod.replyAct[9] });
    }
    // (the mother's bust is asked for before her first words: SpeechBubbles checks a tag's picture once, then knows it)
    function probeBust(ev) {
        const SB = window.SpeechBubbles;
        try { if (SB && SB.bustOf && ev) SB.bustOf(ev); } catch (e) { /* (no bubbles) */ }
    }
    function newsOfMother(who) {
        if (flags().w10Wiesc) return;
        setFlag("w10Wiesc");
        note(TK.kod.newsOfMother[0], Watki.wstaw(TK.kod.newsOfMother[1], { who: who }));
    }

    // ------------------------------------------------------------------
    // The hooks the thread's data names: K47's rod, W10's words, the talks' actions (the old Przystan.act), the officer's line
    // ------------------------------------------------------------------
    w.haki({
        // the speaker of a "@key: ..." line of the thread's talks (Przystan_Data.js mowa.kto)
        mowca: (ctx, key) => speaker(key),
        wedka: () => {
            if (count(ITEM.rod) > 0) { T.popup(TK.kod.pick[0], { icon: item(ITEM.rod).iconIndex, color: "#ffe9a8" }); return; }
            $gameParty.gainItem(item(ITEM.rod), 1);
        },
        fabula: () => storyGame(),
        w10Zmienne: ctx => {
            const r = ctx.r, k = r && r.step === W10.step.letter3 ? 2 : 1;
            return { odpis: replyTo(k) ? (k === 1 ? TX.vars.sent : TX.vars.sent2) : (k === 1 ? TX.vars.write : TX.vars.write2) };
        },
        akt: (ctx, name) => actCall(ctx.interp, [name]),
        zwykle: (ctx, key, orKey) => [usual(key) || w.tekst(orKey)]
    });

    // TownLife's conditions by name (a plan entry may name them too)
    (() => {
        const L = TL();
        if (L && L.addCondition) {
            L.addCondition("promDzis", () => ferryNow());
            L.addCondition("kuterRejs", () => kuterAway());
        }
    })();

    // ------------------------------------------------------------------
    // The ferryman and the people off the ferry (ids 760-779, Map125) - there only while the ferry is (Przystan's update)
    // ------------------------------------------------------------------
    const PEOPLE = [
        { id: 760, sheet: "$Npc_Kopacz", x: 11, y: 17, d: 2, who: "ferry", show: () => ferryNow() },
        // (2026-10-28) the first wave: Ludmiła and Ela come off the ferry (docs/PODROZNI.md 5.2) - fala1: their sheets and words that day
        { id: 761, sheet: "$Npc_Bogdan", x: 15, y: 16, d: 6, who: "refugee", show: () => waveNow(), fala1: { who: "ludmila", sheet: "$Npc_Ludmila" } },
        { id: 762, sheet: "$Npc_Halina", x: 16, y: 16, d: 4, who: "refugee", show: () => waveNow(), fala1: { who: "ela", sheet: "$Npc_Ela" } },
        // (W10) the mother's voice: never seen, never started - the letters' speaker (her bust, the plate "Matka"); moved beside the
        // hero as a letter is read (act w10Open)
        { id: MOTHER, sheet: "$Npc_Halina", x: 12, y: 18, d: 2, who: "mother", show: () => false,
          note: "<Bust:Matka_Bust><BustName:Matka>" }
    ];
    Watki.scal(PEOPLE, "przystan", "ludzie");   // (its words: js/teksty/przystan.txt, ludzie)
    function personData(p) {
        const page = {
            conditions: { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
                          switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 },
            directionFix: false, image: { tileId: 0, characterName: p.sheet, direction: p.d, pattern: 1, characterIndex: 0 },
            list: [C(355, ["Przystan.talk(this, " + JSON.stringify(p.who) + ");"]), C(0, [])],
            moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true
        };
        return { id: p.id, name: p.name, note: "<Przystan:" + p.who + ">" + (p.note || ""), pages: [page], x: p.x, y: p.y };
    }
    T.inject(MAP, { ids: IDS, owner: PLUGIN, build: () => PEOPLE.map(personData) });

    // ------------------------------------------------------------------
    // What is shown on the harbour: the ferry, Janek's boat, the cutter, the people of the ferry
    // ------------------------------------------------------------------
    let cache = null, tick = 0;
    function byName() {
        if (cache && cache.map === $gameMap.mapId() && cache.events === $gameMap._events) return cache.ev;
        const ev = {};
        for (const e of $gameMap.events()) { const n = e.event() && e.event().name; if (n) (ev[n] || (ev[n] = [])).push(e); }
        cache = { map: $gameMap.mapId(), events: $gameMap._events, ev };
        return ev;
    }
    function setShown(e, on) {
        if (!e) return;
        const st = e._przystan || (e._przystan = { prio: e._priorityType, through: e._through });
        if (on) {
            if (e._przystan.hidden === false) return;
            e.setTransparent(false); e.setThrough(st.through); e._priorityType = st.prio; st.hidden = false;
        } else {
            if (e._przystan.hidden === true) return;
            e.setTransparent(true); e.setThrough(true); e._priorityType = 0; st.hidden = true;
        }
    }
    function janekAtSea() {
        const L = TL(), r = resident("janek");
        if (!L || !L.entryAt || !r) return false;
        const e = L.entryAt(r, $gameSystem.dayNightHour ? $gameSystem.dayNightHour() : hour());
        return e.act === "inside" && e.where === "na_morze";
    }
    function sync() {
        if (!has() || !$gameMap || $gameMap.mapId() !== MAP) return;
        const ev = byName(), k = kuterState(), away = kuterAway();
        const show = (name, on) => (ev[name] || []).forEach(e => setShown(e, on));
        show("Prom", ferryNow());
        show(TK.kod.sync[0], !janekAtSea());
        show(TK.kod.sync[1], k === "beach");
        show(TK.kod.sync[2], k === "slip");
        // (on a run night the cutter goes once Roch is aboard: he walks to it and is gone - then it sails)
        const L = TL(), roch = L && L.eventOf ? L.eventOf("przemytnik") : null, aboard = !roch || !!(roch._town && roch._town.hidden);
        show(TK.kod.sync[3], k === "water" && !(away && aboard));
        for (const p of PEOPLE) {
            const e = $gameMap.event(p.id);
            if (e && p.fala1) { const want = firstWave() ? p.fala1.sheet : p.sheet; if (e.characterName() !== want) e.setImage(want, 0); }
            setShown(e, p.show());
        }
    }
    // a thing hidden (the ferry on other days, the cutter that is elsewhere, the ferryman away) never starts
    T.onEventStart(ev => !!(ev._przystan && ev._przystan.hidden), { owner: PLUGIN, priority: "hidden" });   // (the core's one start hook, 2026-10-23)
    const _Game_Map_setupEvents = Game_Map.prototype.setupEvents;
    Game_Map.prototype.setupEvents = function() {
        _Game_Map_setupEvents.call(this);
        cache = null;
        hookTalk();
        if (this.mapId() === MAP) { sync(); probeBust(this.event(MOTHER)); }
    };
    T.onMapUpdate(() => { if (++tick % 30 === 0) sync(); playPending(); }, { owner: PLUGIN, name: "harbour" });

    // ------------------------------------------------------------------
    // W10 for F9 ("Wyspa i fabuła": "W10: przyślij list od matki"), the Heart's epilogue (Underground.js), the tests
    // ------------------------------------------------------------------
    // the next letter at once: W10 on its step (the flags of the steps before set), the letter forced; null without TownQuests,
    // 0 when all three came
    function debugLetter() {
        const q = TQ();
        if (!has() || !q || !q.start) return null;
        const w = W(), k = w.got.length + 1;
        if (k > 3) return 0;
        const f = flags();
        if (!f.janekMet) f.janekMet = day();
        if (!f.w10Prom && !f.w10Kuter) { f.w10Prom = day(); S().letterDay = day(); S().letterHour = hour(); }
        if (!f.w10Wiesc) f.w10Wiesc = day();
        if (!atStep("W10", W10.step["letter" + k])) q.start("W10", W10.step["letter" + k], true);
        w.force = k;
        return k;
    }
    // (F9's letter, once the hero is on the harbour: read at once - the ferryman's words in the usual window if he is not there)
    function playPending() {
        const k = window.$gameTemp && $gameTemp._w10Play;
        if (!k || !has() || $gameMap.mapId() !== MAP || $gamePlayer.isTransferring() || $gameMap.isEventRunning() || $gameMessage.isBusy()) return;
        $gameTemp._w10Play = 0;
        if (letterNo() !== k) return;
        const ev = $gameMap.event(760), here = ev && !(ev._przystan && ev._przystan.hidden);
        $gameMap._interpreter.setup(letterList(k, "prom", { id: here ? 760 : -1, name: TK.kod.playPending[0] }).concat([C(0, [])]), 0);
    }
    // one line for the epilogue after the Heart: null - the hero never wrote to her
    function epilogue() {
        if (!has()) return null;
        const f = flags(), w = W(), E = TX.epilog;
        if (!qRec("W10") || !(f.w10Prom || f.w10Kuter)) return null;
        if (!w.got.length) return E.none;
        if (!w.replies.length) return E.silent;
        return w.gold > 0 || w.food > 0 ? E.helped : E.wrote;
    }
    // F9: Debug.js's island tab gets the row from here (its list window is Debug's own: its prototype is found as the scene is made)
    (function hookF9() {
        const SD = window.Scene_Debug;
        if (!SD || !SD.prototype || typeof SD.prototype.onIsleOk !== "function" || SD.prototype.onIsleOk._w10) return;
        const f9Label = () => { const k = has() ? W().got.length + 1 : 1; return k > 3 ? TX.f9.none : fillN(TX.f9.label, k); };
        const _create = SD.prototype.create;
        SD.prototype.create = function() {
            _create.apply(this, arguments);
            const L = this._list, P = L && Object.getPrototypeOf(L);
            if (!P || typeof P.isleRows !== "function" || P.isleRows._w10) return;
            const own = P.isleRows;
            P.isleRows = function() {
                const rows = own.apply(this, arguments), tab = rows.length ? rows[0].tab : 5;
                rows.push({ tab, kind: "info", label: TX.f9.head, head: true },
                    { tab, kind: "isleW10", label: f9Label(), icon: item(ITEM.scarf) ? item(ITEM.scarf).iconIndex : 87, desc: TX.f9.desc });
                return rows;
            };
            P.isleRows._w10 = true;
            const names = this._tabs && this._tabs._list ? this._tabs._list.map(c => c.name) : [];
            if (L._tab === names.indexOf(TK.kod.create[0])) L.setTab(L._tab, L.index());   // (opened on the island tab: read again)
        };
        const _ok = SD.prototype.onIsleOk;
        SD.prototype.onIsleOk = function(row) {
            if (!row || row.kind !== "isleW10") return _ok.apply(this, arguments);
            const say = (text, bad) => $gameTemp.pushLootPopup(row.icon, text, bad ? "#ffb4a0" : "#9ff0a8");
            const k = debugLetter();
            if (k === null) { say(TX.f9.noQuests, true); return false; }
            if (k === 0) { say(TX.f9.allIn, true); return false; }
            $gameTemp._w10Play = k;
            $gamePlayer.reserveTransfer(MAP, 110, 19, 4, 0);   // (2026-10-18: the harbour doubled to 112x80 - one inside its east edge)
            SoundManager.playOk();
            this.popScene();
            return true;
        };
        SD.prototype.onIsleOk._w10 = true;
    })();

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        MAP, ITEM, IDS, SELL, GOODS, RUN_EVERY, state: () => S(), flags, act: actCall, talk, ferryToday, ferryNow, waveNow, waves, kuterState, kuterAway,
        runNight, lastRunBack, rochGone, fishBonus, sync, janekAtSea, TX,
        // (2026-10-17) W10's letters: the next one (1-3, 0), the day it may come from, does the ferryman / Roch have it, may the
        // hero answer, what the letter says now, the record, F9's letter at once, the Heart's epilogue line
        W10, MOTHER, letterNo, dueDay, letterHere, canReply, letterText, letters: () => W(), debugLetter, epilogue,
        // (2026-10-29) the answer's menu for another carrier (Podroznicy: Tobiasz, Urszula - no fee, no customs): via = its key
        odpowiedz: (via, spk) => replyMenu(via, spk)
    };
    window.Przystan = T.register(PLUGIN, api);
})();
