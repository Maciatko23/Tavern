//=============================================================================
// TavernLife_Regulars.js
//=============================================================================
// The tavern's regulars as people one talks to (the user, 2026-10-06: "rób wszystko"): Melia Srebrogłosa, Dziadek Ozzy and Grum
// Żelazna Pięść (Map001's events 2-4, found by TavernLife's NPCS) answer the action button with a talk of their own. First the town's
// quests speak (TownQuests.regularTalk: an offer, a hand-in, a reminder, a remark after what happened), then the greeting (by the
// hour and by how far they trust the hero) and a menu: what is new (the hour, the weather, the drought, the grandfather's debt), the
// rumours (from what really goes on: the quests' flags, the market, the ferry, the refugees), their own topics (Melia's songs and
// where she knows them from, a beer for Ozzy - and his "vision", tomorrow's weather read from the plan, Grum's war and his
// mountains, a game with Grum) and a farewell. Each in a voice of their own: Melia poetic, Ozzy a drunk old man who knows too much,
// Grum a mercenary of few words. Ozzy sleeps in the hall at night (a mumble, no menu).
// Trust ("Zaufanie", 0-100, five tiers): the first talk of a day, a beer for Ozzy, a song heard, a game with Grum or Ozzy (each
// once a day and only up to a point) - and the quests (TownQuests reward.trust). Deeper topics wait for it. The state: TavernLife's
// store, field "regulars". API on TavernLife: regular(interp), regularMenu, regularTopic, regularOf(ev), trust(role),
// addTrust(role, n, why), trustTier(role), regularsInfo(), REGULARS.

/*:
 * @target MZ
 * @plugindesc Stali bywalcy tawerny (część TavernLife.js): Melia, Dziadek Ozzy i Grum jako rozmówcy - powitania, co słychać, plotki, własne tematy, zaufanie. v1.0.0
 * @author Claude
 * @base TavernLife
 * @orderAfter TavernLife
 *
 * @help
 * ============================================================================
 * TavernLife_Regulars.js - stali bywalcy jako rozmówcy
 * ============================================================================
 * Część TavernLife.js. Melia, Dziadek Ozzy i Grum (zdarzenia 1-4 na mapie
 * tawerny, rozpoznawane po imieniu) zamiast jednego zdania mają rozmowę:
 * najpierw sprawy zadań (TownQuests), potem powitanie i menu tematów:
 * „Co słychać?”, „Jakieś plotki?”, tematy własne każdej postaci i
 * pożegnanie. Zaufanie (0-100: Obcy, Znajomy, Kompan, Przyjaciel,
 * Powiernik) rośnie od rozmów, piwa dla Ozzy'ego, pieśni Melii, gier z
 * Grumem i od zadań; głębsze tematy otwierają się z zaufaniem. Stan
 * w dzienniku: Miasteczko - Stali bywalcy tawerny.
 *
 * KOLEJNOŚĆ: pod TavernLife.js (najlepiej za jego innymi częściami).
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("stali_goscie");   // (the words of this file: js/teksty/stali_goscie.txt, kod.*)

    const T = window.Tawerna;
    if (!T) throw new Error("TavernLife_Regulars.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    const TL = T.api("TavernLife");
    if (!TL || !TL.lib) throw new Error("TavernLife_Regulars.js: brak TavernLife.js - musi być nad tą wtyczką na liście (TavernLife is missing)");
    const lib = TL.lib;
    const { C, q, S, npc, NPCS, say, sayAs, heroSay, script, run, day, hour, hash, popup, gold, needGold, bark, GOOD, notice } = lib;
    const TAVERN = 1;
    const ROLES = ["melia", "ozzy", "grum"];
    const BEER = 81, BEER_PRICE = 3;

    // ------------------------------------------------------------------
    // Trust: 0-100 per regular, five tiers; what everyday things give stops at a cap (the rest comes from deeds - the quests)
    // ------------------------------------------------------------------
    const TIERS = [
        { at: 0 }, { at: 15 }, { at: 35 }, { at: 60 }, { at: 85 }
    ];
    Watki.scal(TIERS, "stali_goscie", "progi");   // (its words: js/teksty/stali_goscie.txt, progi)
    const CAPS = { chat: 30, song: 40, beer: 50, game: 45, win: 50 };
    function rec(role) {
        const s = S(), all = s.regulars || (s.regulars = {});
        return all[role] || (all[role] = { trust: 0, day: 0, n: 0, said: {}, rum: [], got: {}, vis: 0, topics: {} });
    }
    const trust = role => (window.$gameSystem ? rec(role).trust : 0);
    function tierOf(v) { let i = 0; TIERS.forEach((t, k) => { if (v >= t.at) i = k; }); return i; }
    const trustTier = role => tierOf(trust(role));
    // n trust for `why`; kind: a daily source (once a day, up to its cap) or none (a deed: always)
    function addTrust(role, n, why, kind) {
        if (!window.$gameSystem || !REGULARS[role] || !n) return 0;
        const r = rec(role);
        if (kind) {
            if (r.got[kind] === day() || r.trust >= (CAPS[kind] || 100)) return 0;
            r.got[kind] = day();
            n = Math.min(n, (CAPS[kind] || 100) - r.trust);
        }
        const before = r.trust;
        r.trust = Math.max(0, Math.min(100, before + n));
        const got = r.trust - before;
        if (!got) return 0;
        const tb = tierOf(before), ta = tierOf(r.trust);
        if (ta !== tb && ta > tb) notice(REGULARS[role].name + ": " + TIERS[ta].name.toLowerCase(), REGULARS[role].tierText[ta]);
        T.emit("regularTrust", { role, trust: r.trust, change: got, why: String(why || ""), tier: ta });
        return got;
    }

    // ------------------------------------------------------------------
    // What they know of the world now (all read, nothing changed)
    // ------------------------------------------------------------------
    const TQ = () => T.api("TownQuests");
    const flags = () => { const Q = TQ(); try { return (Q && Q.state && Q.state().flags) || {}; } catch (e) { return {}; } };
    const clue = k => { const Q = TQ(); try { return !!(Q && Q.state && Q.state().clues[k]); } catch (e) { return false; } };
    const qDone = id => { const Q = TQ(); return !!(Q && Q.isDone && Q.isDone(id)); };
    const qRec = id => { const Q = TQ(); return Q && Q.rec ? Q.rec(id) : null; };
    const gone = k => !!T.call("TownLife", "gone", k);
    const dryDays = () => Number(T.call("TownQuests", "dryDays")) || 0;
    const isMarket = d => { const Q = TQ(); return Q && Q.isMarket ? !!Q.isMarket(d) : d % 7 === 0; };
    const isFerry = d => { const Q = TQ(); return Q && Q.isFerry ? !!Q.isFerry(d) : (d - 1) % 3 === 0; };
    const fame = () => { const QB = T.api("QuestBoard"); try { return QB && QB.reputation ? Number(QB.reputation()) || 0 : 0; } catch (e) { return 0; } };
    function weatherNow() {
        const Sv = T.api("Survival"), d = day(), h = hour();
        if (Sv && Sv.stormLevel && Sv.stormLevel(d, h) > 0) return "storm";
        const w = Sv && Sv.currentWeather ? Sv.currentWeather() : null;
        if (w) return w.type === "snow" ? "snow" : "rain";
        return null;
    }
    function debt() {
        const St = T.api("Story");
        try {
            if (!St || !St.active || !St.active() || !St.state()) return null;
            const s = St.state();
            return { left: St.left(), days: St.daysLeft(), paid: s.paid, debt: s.debt, done: !!s.done, lost: !!s.lost, back: !!(s.buy && s.buy.done) };
        } catch (e) { return null; }
    }
    const slot = h => (h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night");
    const asleep = role => role === "ozzy" && (hour() >= 23 || hour() < 6);
    // the hour as said: "o trzeciej po południu", "o ósmej rano"
    const ORD = [];
    Watki.scal(ORD, "stali_goscie", "godziny");   // (its words: js/teksty/stali_goscie.txt, godziny)
    function hourWords(h) {
        const H = Math.floor(h) % 24, part = H < 5 ? TK.kod.hourWords[0] : H < 11 ? TK.kod.hourWords[1] : H < 13 ? TK.kod.hourWords[2] : H < 18 ? TK.kod.hourWords[3] : TK.kod.hourWords[4];
        return Watki.wstaw(TK.kod.hourWords[5], { godzina: ORD[H % 12], pora: H === 12 ? "" : part });   // ("o " + the hour + the part of the day)
    }

    // ------------------------------------------------------------------
    // THE REGULARS: names, how they greet (by trust tier: 0..4), what they say, their rumours and topics - the words in
    // js/teksty/stali_goscie.txt (bywalcy.<role>.*: name, full, title, tierText, greet.<tier>, again, bye, heroBye, talk.*, sleep,
    // rumours.<n>.text - n in the order of the list below -, evergreen); here what the code needs: the rumours' ids and conditions
    // ------------------------------------------------------------------
    const REGULARS = {
        melia: {
            greet: [[], [], [], [], []],
            talk: {},
            rumours: [
                { id: "kubaWater", when: () => !qRec("W1") },
                { id: "kubaFled", when: () => !!flags().kubaFled },
                { id: "mill", when: () => !!flags().sluiceHalf },
                { id: "feliks", when: () => gone("feliks") },
                { id: "lucjan", when: () => !!flags().lucjanOut },
                { id: "purse", when: () => !!flags().k37Seen },
                { id: "market", when: () => isMarket(day() + 1) },
                { id: "ferry", when: () => isFerry(day()) },
                { id: "nameday", when: () => day() >= 26 && day() < 33 },
                { id: "kupala", when: () => day() >= 35 && day() < 42 },
                { id: "camp", when: () => day() >= 10 },
                { id: "fame", when: () => fame() >= 40 }
            ]
        },
        ozzy: {
            greet: [[], [], [], [], []],
            talk: {},
            rumours: [
                { id: "roses", when: () => !qRec("W1") },
                { id: "bell", when: () => !qRec("W2") },
                { id: "garden", when: () => !!flags().gardenKey },
                { id: "kubaFled", when: () => !!flags().kubaFled },
                { id: "mill", when: () => !!flags().sluiceHalf },
                { id: "feliks", when: () => gone("feliks") },
                { id: "stones", when: () => clue("lord_stones") },
                { id: "camp", when: () => day() >= 10 },
                { id: "ferry", when: () => isFerry(day()) }
            ]
        },
        grum: {
            greet: [[], [], [], [], []],
            talk: {},
            rumours: [
                { id: "wolves", when: () => day() >= 3 && !qDone("D5") },
                { id: "camp", when: () => day() >= 10 },
                { id: "gold", when: () => day() >= 5 },
                { id: "wit", when: () => !flags().witDegraded },
                { id: "tourney", when: () => !qDone("D6") && isMarket(day() + 1) },
                { id: "lucjan", when: () => !!flags().lucjanOut },
                { id: "ambush", when: () => !!flags().w1Ambushed },
                { id: "ambushWon", when: () => !!flags().w1AmbushWon },
                { id: "cistern", when: () => !!flags().cisternOpen },
                { id: "feliks", when: () => gone("feliks") }
            ]
        }
    };
    Watki.scal(REGULARS, "stali_goscie", "bywalcy");   // (its words: js/teksty/stali_goscie.txt, bywalcy)

    // ------------------------------------------------------------------
    // Which event is which regular (the tavern only): TavernLife's NPCS (by name, else by look)
    // ------------------------------------------------------------------
    let roleCache = { map: null, ids: {} };
    function regularOf(ev) {
        if (!ev || !$gameMap || $gameMap.mapId() !== TAVERN) return null;
        if (roleCache.map !== $gameMap) {
            roleCache = { map: $gameMap, ids: {} };
            for (const role of ROLES) { const e = npc(role); if (e) roleCache.ids[e.eventId()] = role; }
        }
        const role = roleCache.ids[ev.eventId()];
        return role && $gameMap.event(ev.eventId()) === ev ? role : null;
    }
    const STUB = [C(355, ["TavernLife.regular(this)"]), C(0, [])];
    // (2026-10-23) the core's one list hook (Tawerna.onEventList): the regulars' talk - over TavernLife's places, below HomeLife's (as the
    // old wrappers by the plugin list)
    T.onEventList(ev => (window.$gameMap && $gameMap.mapId() === TAVERN && ev._trigger !== 3 && ev._trigger !== 4 && regularOf(ev) ? STUB : null),
        { owner: "TavernLife_Regulars", priority: T.onEventList.PRIORITY.own + 20 });

    // ------------------------------------------------------------------
    // The talk: the quests first, then the greeting and the menu
    // ------------------------------------------------------------------
    // (2026-10-16, W12 "Rozbitek", Wrak.js) Eryk - the castaway who drew her - handed to the soldiers (flag ansgarGiven): Melia stops
    // joking FOR GOOD - her greetings, her "what is new" by the hour and her farewells stay short and cold (the songs and the rumours stay)
    const MELIA_SOBER = {
        greet: [[]],
        talk: {}
    };
    Watki.scal(MELIA_SOBER, "stali_goscie", "melia_smutna");   // (its words: js/teksty/stali_goscie.txt, melia_smutna)
    const R0 = role => {
        const d = REGULARS[role];
        if (role !== "melia" || !flags().ansgarGiven) return d;
        return Object.assign({}, d, { greet: d.greet.map(() => MELIA_SOBER.greet[0]), again: MELIA_SOBER.again, bye: MELIA_SOBER.bye,
            talk: Object.assign({}, d.talk, MELIA_SOBER.talk) });
    };
    const said = (role, list, key) => { const r = rec(role), n = r.topics[key] || 0; r.topics[key] = n + 1; return list[n % list.length]; };
    // what is new: the weather, the drought, the debt first; else the hour's lines in turn
    function newsLine(role) {
        const t = R0(role).talk, w = weatherNow(), dbt = debt();
        if (w && t[w]) return said(role, t[w], "w:" + w);
        if (dbt && dbt.done && t.debtPaid && !rec(role).topics.debtPaid) return said(role, t.debtPaid, "debtPaid");
        // (2026-10-15) the field lost to the Lord - once; bought back - once
        if (dbt && dbt.lost && !dbt.back && t.fieldLost && !rec(role).topics.fieldLost) return said(role, t.fieldLost, "fieldLost");
        if (dbt && dbt.back && t.fieldBack && !rec(role).topics.fieldBack) return said(role, t.fieldBack, "fieldBack");
        if (dbt && !dbt.done && !dbt.lost && dbt.days <= 7 && dbt.left > 0 && t.debtNear && rec(role).topics["debt:" + day()] === undefined) { rec(role).topics["debt:" + day()] = 1; return pickDay(t.debtNear, role); }
        if (dryDays() >= 6 && t.drought && rec(role).topics["dry:" + day()] === undefined) { rec(role).topics["dry:" + day()] = 1; return pickDay(t.drought, role); }
        const sl = slot(hour());
        return said(role, t[sl] || t.day, "s:" + sl);
    }
    const pickDay = (list, role) => list[Math.floor(hash(day(), role.length) * list.length) % list.length];
    // a rumour: the first true one not told yet; then the old ones in turn
    function rumourLine(role) {
        const r = rec(role), d = R0(role);
        for (const m of d.rumours) {
            let ok = false;
            try { ok = !!m.when(); } catch (e) { ok = false; }
            if (ok && !r.rum.includes(m.id)) { r.rum.push(m.id); return m.text; }
        }
        return said(role, d.evergreen, "evergreen");
    }
    function greeting(role) {
        const r = rec(role), d = R0(role);
        if (r.day !== day()) {
            r.day = day();
            addTrust(role, 1, "rozmowa", "chat");
            return pickDay(d.greet[tierOf(r.trust)], role);
        }
        return said(role, d.again, "again");
    }
    // the action button at a regular
    function regular(interp) {
        const ev = interp && $gameMap.event(interp.eventId()), role = regularOf(ev);
        if (!role) return;
        const out = [], Q = TQ();
        let qt = null;
        try { qt = Q && Q.regularTalk ? Q.regularTalk(role, ev) : null; } catch (e) { console.error(e); qt = null; }
        if (asleep(role)) {   // (Ozzy sleeps in the hall: only what a quest wants of him now, else a mumble)
            if (qt && qt.kind === "ready") { run(interp, qt.list); return; }
            sayAs(out, role, said(role, R0(role).sleep, "sleep"));
            run(interp, out);
            return;
        }
        if (qt && qt.list && qt.list.length) {
            for (const c of qt.list) out.push(c);
            if (qt.pop) qt.pop();
            if (rec(role).day !== day()) { rec(role).day = day(); addTrust(role, 1, "rozmowa", "chat"); }   // (the quest's talk was the greeting)
        }
        script(out, "TavernLife.regularMenu(this, " + q(role) + ", " + (qt && qt.list && qt.list.length ? 1 : 0) + ")");
        run(interp, out);
    }
    // the menu: options by the hour, the trust and the quests; each topic comes back to it, the farewell ends the talk
    function menuOptions(role) {
        const tr = trust(role), h = hour(), o = [["news", TK.kod.menuOptions[0]], ["rumour", TK.kod.menuOptions[1]]];
        if (role === "melia") {
            o.push(["songs", TK.kod.menuOptions[2]]);
            if (tr >= 35) o.push(["origin", TK.kod.menuOptions[3]]);
            if (lib.inSongHours() && S().songDay !== day() && !lib.meliaAway()) o.push(["sing", TK.kod.menuOptions[4]]);
        } else if (role === "ozzy") {
            o.push(["beer", Watki.wstaw(TK.kod.menuOptions[5], { BEER_PRICE: BEER_PRICE })]);
            if (tr >= 35) o.push(["cellar", TK.kod.menuOptions[6]]);
        } else if (role === "grum") {
            o.push(["war", TK.kod.menuOptions[7]]);
            if (tr >= 15) o.push(["home", TK.kod.menuOptions[8]]);
            o.push(["play", TK.kod.menuOptions[9]]);
        }
        // the quests' own topics (K27: Melia under the wall, W3: a jug of mead for Ozzy) - TownQuests says which
        const Q = TQ();
        try { for (const t of (Q && Q.regularTopics ? Q.regularTopics(role) : [])) o.splice(2, 0, ["q:" + t.id, t.label]); } catch (e) { console.error(e); }
        o.push(["bye", "Bywaj."]);
        return o;
    }
    function regularMenu(interp, role, again) {
        if (!REGULARS[role] || !npc(role)) return;
        const out = [], opts = menuOptions(role);
        sayAs(out, role, again ? said(role, R0(role).again, "again") : greeting(role));
        out.push(C(102, [opts.map(o => o[1]), opts.length - 1, 0, 2, 0]));
        opts.forEach(([key, label], i) => {
            out.push(C(402, [i, label]));
            if (key === "bye") {
                say(out, 0, R0(role).heroBye, null, "", 1);
                const n = NPCS[role], e = npc(role);
                say(out, e ? e.eventId() : -1, said(role, R0(role).bye, "bye"), n.face, n.name, 1);
            } else out.push(C(355, ["TavernLife.regularTopic(this, " + q(role) + ", " + q(key) + ")"], 1));
            out.push(C(0, [], 1));
        });
        out.push(C(404, []));
        run(interp, out);
    }
    const back = (out, role) => script(out, "TavernLife.regularMenu(this, " + q(role) + ", 1)");
    function regularTopic(interp, role, key) {
        const out = [], tr = trust(role);
        const hero = t => heroSay(out, t), her = t => sayAs(out, role, t);
        if (key.startsWith("q:")) {   // a quest's topic: its lines (TownQuests), then back to the menu
            const Q = TQ(), list = Q && Q.regularTopicList ? Q.regularTopicList(role, key.slice(2), npc(role)) : null;
            if (list) for (const c of list) out.push(c);
            back(out, role);
            run(interp, out);
            return;
        }
        switch (key) {
            case "news": hero(role === "ozzy" ? TK.kod.regularTopic[0] : TK.kod.regularTopic[1]); her(newsLine(role)); break;
            case "rumour": hero(TK.kod.regularTopic[2]); her(rumourLine(role)); break;
            // ---- Melia
            case "songs": {
                const heard = S().heard || [], all = TL.SONGS || [];
                hero(TK.kod.regularTopic[3]);
                if (!heard.length) her(TK.kod.regularTopic[4]);
                else if (heard.length < all.length) {
                    const left = all.filter(s => !heard.includes(s.id)).map(s => "„" + s.title + "”");
                    her(Watki.wstaw(TK.kod.regularTopic[5], { length: heard.length, length2: all.length, "3": left.join(", ") }));
                } else {
                    const w3 = qRec("W3");
                    her(w3 && w3.s === "active" ? TK.kod.regularTopic[6]
                        : w3 && w3.s === "done" ? TK.kod.regularTopic[7]
                            : TK.kod.regularTopic[8]);
                }
                break;
            }
            case "origin":
                hero(TK.kod.regularTopic[9]);
                her(TK.kod.regularTopic[10]);
                if (tr >= 60) her(TK.kod.regularTopic[11]);
                break;
            case "sing": {
                hero(TK.kod.regularTopic[12]);
                const list = lib.songTalk ? lib.songTalk() : null;
                if (list) { run(interp, out.concat(list)); return; }
                her(TK.kod.regularTopic[13]);
                break;
            }
            // ---- Ozzy
            case "beer": {
                hero(TK.kod.regularTopic[14]);
                if (gold() < BEER_PRICE) { needGold(BEER_PRICE); her(TK.kod.regularTopic[15]); break; }
                $gameParty.loseGold(BEER_PRICE);
                lib.spend(BEER_PRICE);
                const r = rec(role), first = r.vis !== day();
                her(TK.kod.regularTopic[16]);
                if (first) {
                    r.vis = day();
                    addTrust(role, 2, "piwo", "beer");
                    her(TK.kod.regularTopic[17]);
                    for (const l of visionLines()) her(l);
                } else her(TK.kod.regularTopic[18]);
                break;
            }
            case "cellar":
                hero(TK.kod.regularTopic[19]);
                her(TK.kod.regularTopic[20]);
                her(TK.kod.regularTopic[21]);
                if (tr >= 60) her(TK.kod.regularTopic[22]);
                break;
            // ---- Grum
            case "war": {
                hero(TK.kod.regularTopic[23]);
                her(said(role, [TK.kod.regularTopic[24],
                    TK.kod.regularTopic[25],
                    TK.kod.regularTopic[26]], "war"));
                break;
            }
            case "home":
                hero(TK.kod.regularTopic[27]);
                her(TK.kod.regularTopic[28]);
                if (tr >= 60) her(TK.kod.regularTopic[29]);
                break;
            case "play": {
                hero(TK.kod.regularTopic[30]);
                her(TK.kod.regularTopic[31]);
                const TD = T.api("TavernDice"), dice = !!(TD && TD.present && TD.present(undefined, undefined, "grum").length);
                const opts = [{ label: TK.kod.regularTopic[32], js: "TavernLife.regularStep(this, 'grum', 'arm')" },
                    { label: dice ? TK.kod.regularTopic[33] : TK.kod.regularTopic[34], js: "TavernLife.regularStep(this, 'grum', 'dice')" }, { label: TK.kod.regularTopic[35], js: [] }];
                lib.choose(out, opts);
                run(interp, out);
                return;
            }
        }
        back(out, role);
        run(interp, out);
    }
    function regularStep(interp, role, what) {
        if (what === "arm") {
            const fn = lib.kind("arm"), list = fn ? fn() : null;
            if (list) run(interp, list);
            return;
        }
        if (what === "dice") {
            const TD = T.api("TavernDice");
            if (!TD || !TD.present || !TD.present(undefined, undefined, "grum").length) { run(interp, sayAs([], role, TK.kod.regularStep[0])); return; }
            TD.start({ opponent: "grum" });
        }
    }
    // Ozzy's "vision" after a beer: tomorrow's weather read from the plan (always true) - and, now and then, one more true thing
    function visionLines() {
        const out = [], Sv = T.api("Survival"), d = day() + 1;
        const plan = Sv && Sv.weatherPlan ? Sv.weatherPlan(d) : null, after = Sv && Sv.weatherPlan ? Sv.weatherPlan(d + 1) : null;
        if (plan && plan.storm) out.push(Watki.wstaw(TK.kod.visionLines[0], { "1": hourWords(plan.storm.start) }));
        else if (plan && plan.type === "snow") out.push(Watki.wstaw(TK.kod.visionLines[1], { "1": hourWords(plan.start) }));
        else if (plan) out.push(Watki.wstaw(TK.kod.visionLines[2], { "1": hourWords(plan.start) }));
        else if (after) out.push(Watki.wstaw(TK.kod.visionLines[5], { "1": hourWords(after.storm ? after.storm.start : after.start), "2": after.storm ? TK.kod.visionLines[3] : TK.kod.visionLines[4] }));
        else out.push(TK.kod.visionLines[6]);
        const extra = [];
        if (isMarket(day() + 1)) extra.push(TK.kod.visionLines[7]);
        const dbt = debt();
        if (dbt && !dbt.done && dbt.left > 0) extra.push(Watki.wstaw(TK.kod.visionLines[8], { left: dbt.left }));
        const w1 = qRec("W1");
        if (w1 && w1.s === "active" && w1.step === 1) extra.push(TK.kod.visionLines[9]);
        const w2 = qRec("W2");
        if (w2 && w2.s === "active" && flags().gardenKey && !flags().signalBook) extra.push(TK.kod.visionLines[10]);
        extra.push(Watki.wstaw(TK.kod.visionLines[11], { "1": gold() }));
        if (extra.length && hash(day(), 31) < 0.7) out.push(extra[Math.floor(hash(day(), 33) * extra.length) % extra.length]);
        return out;
    }

    // ------------------------------------------------------------------
    // Trust from the everyday: a song heard, a tip, a game with Grum (arm, dice) or Ozzy (darts, dice)
    // ------------------------------------------------------------------
    T.on("songHeard", e => { if (!window.$gameSystem) return; addTrust("melia", 1, "pieśń", "song"); if (e && e.tipped) { const r = rec("melia"); if (r.trust < CAPS.song) r.trust++; } }, { owner: "TavernLife_Regulars" });
    T.on("tavernGame", e => {
        if (!window.$gameSystem || !e) return;
        const who = e.game === "arm" && (!e.rival || e.rival === "grum") ? "grum" : e.game === "darts" && e.rival === "ozzy" ? "ozzy" : null;
        if (!who) return;
        addTrust(who, 1, "gra", "game");
        if (e.won && who === "grum") addTrust(who, 1, "wygrana", "win");   // (Grum respects a hand that beats his)
    }, { owner: "TavernLife_Regulars" });
    for (const ev of ["diceWin", "diceLose"]) {
        T.on(ev, e => { if (window.$gameSystem && e && (e.rival === "grum" || e.rival === "ozzy")) addTrust(e.rival, 1, "kości", "game"); }, { owner: "TavernLife_Regulars" });
    }

    // ------------------------------------------------------------------
    // A word now and then when the hero walks by (Ozzy snores at night)
    // ------------------------------------------------------------------
    const BARKS = {};   // melia, ozzy, grum; spi - Ozzy asleep at night (the words: js/teksty/stali_goscie.txt, zaczepki)
    Watki.scal(BARKS, "stali_goscie", "zaczepki");   // (its words: js/teksty/stali_goscie.txt, zaczepki)
    const nextBark = {};
    T.onMapUpdate(scene => {
        if (scene !== SceneManager._scene || !$gameMap || $gameMap.mapId() !== TAVERN || Graphics.frameCount % 20 || $gameMap.isEventRunning() || lib.busy()) return;
        for (const role of ROLES) {
            const ev = npc(role);
            if (!ev || Math.hypot(ev.x - $gamePlayer.x, ev.y - $gamePlayer.y) > 3.5) continue;
            if ((nextBark[role] || 0) > Graphics.frameCount) continue;
            nextBark[role] = Graphics.frameCount + 1500 + Math.floor(Math.random() * 1200);
            if (Math.random() < 0.5) continue;
            const list = asleep(role) ? BARKS.spi : BARKS[role];
            bark(ev, list[Math.floor(Math.random() * list.length)], 130);
        }
    }, { owner: "TavernLife_Regulars", name: "barks" });
    T.on("mapEnter", () => { roleCache = { map: null, ids: {} }; }, { owner: "TavernLife_Regulars" });

    // ------------------------------------------------------------------
    // For the journal (TownQuests' tab "Miasteczko"): each regular, the trust and what it opens
    // ------------------------------------------------------------------
    const OPENS = {   // [trust, what it opens] - the words in js/teksty/stali_goscie.txt (otwiera.<role>.<n>.1)
        melia: [[35, ""], [60, ""]],
        ozzy: [[35, ""], [60, ""]],
        grum: [[15, ""], [60, ""]]
    };
    Watki.scal(OPENS, "stali_goscie", "otwiera");   // (its words: js/teksty/stali_goscie.txt, otwiera)
    function regularsInfo() {
        return ROLES.map(role => {
            const t = trust(role), ti = tierOf(t), nx = TIERS[ti + 1];
            const next = OPENS[role].find(([at]) => at > t);
            return { role, name: REGULARS[role].full, title: REGULARS[role].title, trust: t, tier: ti, tierName: TIERS[ti].name, text: REGULARS[role].tierText[ti] || "",
                next: nx ? nx.at : null, opens: next ? Watki.wstaw(TK.kod.regularsInfo[0], { "1": next[0], "2": next[1] }) : "" };
        });
    }

    Object.assign(TL, {
        REGULARS, TRUST_TIERS: TIERS, regular, regularMenu, regularTopic, regularStep, regularOf, trust, trustTier, addTrust, regularsInfo,
        visionLines, regularState: role => JSON.parse(JSON.stringify(rec(role)))
    });
    TL.modules.TavernLife_Regulars = true;
})();
