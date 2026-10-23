//=============================================================================
// Pustelnia.js
//=============================================================================
// PAKIET A (docs/miejsca_wyspy/PAKIETY.md) - the engine of "Pustelnia na klifie" (Map155) and its "Skryptorium" (Map156), concept
// approved by the user 2026-10-16 (docs/miejsca_wyspy/KONCEPCJA.md section 3). The data and texts: Pustelnia_Data.js.
//   - the place is built: Wyspa.ready(155) - the harbour's top edge (Map125 14-16, 0) leads up here (Wyspa.js puts it in)
//   - brother Kleofas (TownLife resident "pustelnik", 944): the first meeting (the pendant: "a messenger's sign"), honey from his
//     hives, the chronicles' gossip, the reading of the cards (Tawerna.talk.takeover, "meet" priority, like Przystan.js)
//   - the six ciphered cards of the chronicle (D23): 1 the Archive's chronicles (taken: shown to Kleofas / given to Ambroży: he hands
//     it over / left on the shelf: an injected event on Map119 / sold to Baltazar: it lies in his strongbox, taken at night in W5 rozdz. 4 -
//     Kantor.js; after W5 rozdz. 4 he sells it back), 2 the
//     Book of Questions on floor 20 (an injected event on Map146), 3 the Silent's "Rejestr straży" (Map123: its own event's list
//     gets one more line in code - the map file stays), 4-6 from the packages E, C, B (their flags kronikaKarta4..6). A card in
//     the bag is a quest thing (v:karta_N); it is read with Kleofas at the lectern (7-19, the pendant needed): two hours pass, a
//     chapter of "Kronika upadku" goes into the journal, 40 xp
//   - W2 rozdz. 7 "Jedno pytanie" (TownQuests.FX.w2Pytanie, the step in TownQuests_Data.js's W2): Ambroży gives the bell's heart in
//     Act II -> Kleofas hangs it (flag sercePustelni) -> the Night of the Question (the Wigilia, from midnight: seven strikes of the
//     tower's bell) -> one question, answered from the chronicles and the game's state; then one question every Wigilia
//   - K50 "Atrament dla pustelnika", D23 "Zaszyfrowane kroniki" (TownQuests packs from Pustelnia_Data.js; FX.d23Karty here)
// Ids 600-609 (Tawerna.inject, owner "Pustelnia"): 600 the card on floor 20 (Map146), 601 the card on the Archive's shelf (Map119).
// DROUGHT (the user's rule): the sea here is salt (the map's <Water:salt>); the cistern is empty; nothing gives the hero water.

/*:
 * @target MZ
 * @plugindesc [pakiet A] Pustelnia na klifie i Skryptorium (mapy 155, 156): brat Kleofas, zaszyfrowane kroniki (D23), atrament (K50), Noc Pytania (W2 rozdz. 7). v1.0.0
 * @author Claude
 * @base TawernaCore
 * @orderAfter Wyspa
 *
 * @help
 * ============================================================================
 * Pustelnia.js - pustelnia na klifie nad przystanią
 * ============================================================================
 * Mapa 155 „Pustelnia na klifie” i wnętrze 156 „Skryptorium”. Mieszka tu
 * brat Kleofas, ostatni kronikarz zakonu (TownLife, numer 944).
 *
 * - pierwsza rozmowa: Kleofas rozpoznaje wisiorek („znak posłańca”);
 * - K50 „Atrament dla pustelnika” (od dnia 6): szyszki, żelazo, deszczówka;
 * - D23 „Zaszyfrowane kroniki”: sześć kart po wyspie, czytanie przy pulpicie
 *   w skryptorium z Kleofasem (7-19, z wisiorkiem; mijają dwie godziny);
 * - W2 rozdz. 7 „Jedno pytanie”: serce dzwonu od Ambrożego, Noc Pytania
 *   w Wigilię o północy, potem jedno pytanie co roku;
 * - miód z uli Kleofasa (12 G).
 *
 * Zdarzenia 600-609: karta na piętrze 20 (mapa 146) i w Archiwum (mapa 119).
 * W skryptach: Pustelnia.state(), Pustelnia.read(n), Pustelnia.nightNow().
 * ============================================================================
 */

(() => {
    "use strict";
    const TK = Watki.teksty("pustelnia");   // (the words of this file: js/teksty/pustelnia.txt, kod.*)

    const T = window.Tawerna, D = window.PustelniaData;
    if (!T) throw new Error("Pustelnia.js: brak TawernaCore.js - musi być wyżej na liście wtyczek (the Tawerna core is missing)");
    if (!D) throw new Error("Pustelnia.js: brak Pustelnia_Data.js - musi być wyżej na liście wtyczek (the hermitage's data is missing)");
    const PLUGIN = "Pustelnia";
    const MAP = D.MAP, INNER = D.INNER, ARCHIVE = 119, FLOOR20 = 146, ELDER = 123;
    const KEY = "pustelnik", COIN_ICON = 314, BELL = { name: "Bell3", volume: 85, pitch: 70 };
    const HERO = { id: 0, name: "" };
    const C = (code, parameters, indent) => ({ code, indent: indent || 0, parameters });
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem;
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const W = () => window.Wyspa || T.api("Wyspa") || null;
    const pick = list => list[Math.floor(Math.random() * list.length)];
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    // (2026-10-23) the words: js/teksty/pustelnia.txt (D.TX; D.TX.kod - the words of this file)
    const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? vars[k] : m));
    const K = () => D.TX.kod;

    // ------------------------------------------------------------------
    // The state (the save): what the hermitage itself remembers (the quests' records and flags are TownQuests')
    // ------------------------------------------------------------------
    const store = T.state.define("pustelnia", () => ({ met: 0, read: {}, got: {}, asked: {}, rung: {}, honey: { day: 0, n: 0 }, chronN: 0, usualN: 0 }),
        { version: 1, owner: PLUGIN });
    const S = () => store();
    const qs = () => { const q = TQ(); return q && q.state ? q.state() : null; };
    const flags = () => { const s = qs(); return s ? s.flags : {}; };
    const flag = k => !!flags()[k];
    function setFlag(k) {
        const w = W();
        if (w && w.setFlag) w.setFlag(k);
        else { const f = flags(); if (!f[k]) f[k] = day(); }
        const q = TQ();
        if (q && q.autoChecks) q.autoChecks();
        if (q && q.refreshMarkers) q.refreshMarkers();
    }
    const vcount = k => { const s = qs(); return s && s.v ? s.v[k] || 0 : 0; };
    const vgive = (k, n) => { const s = qs(); if (s) s.v[k] = (s.v[k] || 0) + (n || 1); };
    const vtake = (k, n) => { const s = qs(); if (!s) return; s.v[k] = Math.max(0, (s.v[k] || 0) - (n || 1)); if (!s.v[k]) delete s.v[k]; };
    const vname = k => (D.VITEMS[k] ? D.VITEMS[k].name : k);
    const rec = id => { const q = TQ(); return q && q.rec ? q.rec(id) : null; };
    const isDone = id => { const q = TQ(); return !!(q && q.isDone && q.isDone(id)); };
    const isActive = id => { const r = rec(id); return !!r && r.s === "active"; };
    const note = (title, text) => T.call("Journal", "addNote", title, text);
    const xp = (n, why) => T.call("Combat", "gainXp", n, why, true) || 0;
    const actTwo = () => { const w = W(); return !!(w && w.actTwo && w.actTwo()); };

    // ------------------------------------------------------------------
    // The weather, the Wigilia and the Night of the Question
    // ------------------------------------------------------------------
    function rain() {
        if (!window.$gameScreen) return false;
        const t = $gameScreen.weatherType();
        if ((t === "rain" || t === "storm") && $gameScreen.weatherPower() > 0) return true;
        const Sv = T.api("Survival");
        try { if (Sv && Sv.currentWeather && $gameSystem.dayNightDay) { const w = Sv.currentWeather(); return !!w && w !== "snow"; } } catch (e) { /* (no weather yet) */ }
        return false;
    }
    // the first day of the Wigilia in the year of day d (Tawerna.time: winter, round its middle)
    function wigDay(d) {
        const len = T.time.seasonLength() * 4, y = T.time.year(d), from = (y - 1) * len + 1;
        for (let k = from; k < from + len; k++) if (T.time.isWigilia(k) && !T.time.isWigilia(k - 1)) return k;
        return from + len - 1;
    }
    // the night round the Wigilia's midnight: "early" (the evening before the bell) / "open" (after midnight, till 1:30); null else
    function nightOf(d, h) {
        const w = wigDay(d), N = D.NIGHT;
        if (d === w && h >= N.from) return { phase: "early", year: T.time.year(w), wig: w };
        const w0 = wigDay(d - 1);
        if (d === w0 + 1 && h < N.until) return { phase: "open", year: T.time.year(w0), wig: w0 };
        return null;
    }
    const heartHung = () => has() && flag("sercePustelni");
    const nightNow = () => has() && heartHung() && !!nightOf(day(), hour());
    // the next Night (its Wigilia day, its year) from today
    function nextNight() {
        let w = wigDay(day());
        const past = day() > w + 1 || (day() === w + 1 && hour() >= D.NIGHT.until);
        if (past || (has() && S().asked[T.time.year(w)])) w = wigDay(w + T.time.seasonLength() * 4);   // (this year's asked: the next)
        return { wig: w, year: T.time.year(w) };
    }

    // ------------------------------------------------------------------
    // Event commands: speech bubbles (\SPK[n]) and choices, the way TownQuests / Przystan write them
    // ------------------------------------------------------------------
    const LINE = 46, PAGE = 3;
    function wrap(text) {
        const out = [];
        for (const para of String(text).split("\n")) {
            let line = "";
            for (const w of para.split(/\s+/)) {
                if (!w) continue;
                if (line && (line + " " + w).length > LINE) { out.push(line); line = w; } else line = line ? line + " " + w : w;
            }
            if (line) out.push(line);
        }
        return out;
    }
    function sayTo(out, spk, text, ind) {
        const lines = wrap(text);
        for (let i = 0; i < lines.length; i += PAGE) {
            out.push(C(101, ["", 0, 0, 2, spk.name || ""], ind));
            lines.slice(i, i + PAGE).forEach((l, j) => out.push(C(401, [(j === 0 ? "\\SPK[" + spk.id + "]" : "") + l], ind)));
        }
        return out;
    }
    function linesTo(out, spk, arr, ind) {
        for (const raw of [].concat(arr || [])) {
            if (!raw) continue;
            const s = String(raw);
            if (s.startsWith("> ")) sayTo(out, HERO, s.slice(2), ind);
            else sayTo(out, spk, s, ind);
        }
        return out;
    }
    const act = (out, args, ind) => (out.push(C(355, ["Pustelnia.act(this, " + JSON.stringify(args) + ")"], ind)), out);
    function choiceTo(out, labels, branches, cancel, ind) {
        const i0 = ind || 0;
        out.push(C(102, [labels, cancel === undefined ? labels.length - 1 : cancel, 0, 2, 0], i0));
        labels.forEach((l, i) => {
            out.push(C(402, [i, l], i0));
            for (const c of branches[i] || []) out.push(Object.assign({}, c, { indent: (c.indent || 0) + i0 + 1 }));
            out.push(C(0, [], i0 + 1));
        });
        out.push(C(404, [], i0));
        return out;
    }
    function kleofasEv() {
        const L = TL(), ev = L && L.eventOf ? L.eventOf(KEY) : null;
        return ev && $gameMap.event(ev.eventId()) === ev ? ev : null;
    }
    const kleofasHere = () => { const ev = kleofasEv(); return !!ev && !(ev._town && ev._town.hidden); };
    const spkK = () => { const ev = kleofasEv(); return { id: ev ? ev.eventId() : -1, name: D.RESIDENT.name }; };
    function say(ev, text) {
        const SB = T.api("SpeechBubbles");
        if (SB && SB.say && ev) SB.say(ev, String(text).replace(/^> /, ""), 220); else T.popup(String(text).replace(/^> /, ""), { color: "#eceef0" });
    }
    // what a resident says by the hour (TownLife's talk slots), each time the next line
    function usual() {
        const L = TL(), t = L && L.lines ? L.lines(KEY) : null;
        if (!t) return "";
        const h = hour(), slot = rain() && t.rain ? "rain" : h >= 5 && h < 11 ? "morning" : h >= 11 && h < 17 ? "day" : h >= 17 && h < 22 ? "evening" : "night";
        const list = t[slot] || t.day || [];
        if (!list.length) return "";
        S().usualN = (S().usualN || 0) + 1;
        return list[S().usualN % list.length];
    }
    function questWants() {
        const q = TQ();
        if (!q || !q.markers) return false;
        if (q.refreshMarkers) q.refreshMarkers();
        const m = q.markers()[KEY];
        return m === "ready" || m === "new";
    }
    const questTalk = () => { const q = TQ(); return q && q.talkFor ? q.talkFor(KEY, false) : null; };

    // ------------------------------------------------------------------
    // The cards: found (flag kronikaKartaN), in the bag (v:karta_N), read (S().read[N])
    // ------------------------------------------------------------------
    const CARD = n => D.CARDS[n - 1];
    const found = n => flag(CARD(n).flag);
    const isRead = n => !!S().read[n];
    const readCount = () => D.CARDS.filter(c => isRead(c.n)).length;
    const inBag = () => D.CARDS.filter(c => vcount("karta_" + c.n) > 0 && !isRead(c.n)).map(c => c.n);
    function giveCard(n, why) {
        if (!has() || isRead(n) || S().got[n]) return false;
        if (!found(n)) setFlag(CARD(n).flag);
        S().got[n] = day();
        if (vcount("karta_" + n) < 1) vgive("karta_" + n, 1);
        T.popup(vname("karta_" + n), { top: true, color: "#ffd23f", sub: why || K().kartaSzyfr });
        const q = TQ();
        if (q && q.refreshMarkers) q.refreshMarkers();
        return true;
    }
    // the cards the other packages hand out (their flags kronikaKarta4..6) come into the bag
    function syncCards() {
        if (!has() || !qs()) return;
        for (const c of D.CARDS) if (c.n >= 4 && found(c.n) && !S().got[c.n] && !isRead(c.n)) giveCard(c.n);
    }
    // reading: two hours pass (like a rest), the chapter of "Kronika upadku" into the journal, 40 xp, the card goes into the chest
    function read(n) {
        if (!has() || isRead(n)) return false;
        const c = CARD(n);
        S().read[n] = day();
        vtake("karta_" + n, 1);
        if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(D.READ_TIME);
        note(fill(K().kronikaNotatka, { n, tytul: c.title }), c.note);
        const got = xp(40, fill(K().kronikaXp, { tytul: c.title }));
        T.popup(fill(K().kronikaTytul, { tytul: c.title }), { top: true, color: "#ffe27a", sub: fill(K().odczytane, { n: readCount() }) + (got ? fill(K().dosw, { n: got }) : "") });
        const q = TQ();
        if (q && q.autoChecks) q.autoChecks();
        if (q && q.refreshMarkers) q.refreshMarkers();
        return true;
    }
    const pendant = () => count(D.ITEM.pendant) > 0;
    const pendantIcon = () => (item(D.ITEM.pendant) ? item(D.ITEM.pendant).iconIndex : 0);
    // why a card cannot be read now (null: it can) - { pop: popup text } or { say: Kleofas's lines }
    function readBlock() {
        if (!pendant()) return { need: D.TX.noPendant };
        if ($gameMap.mapId() !== INNER || !kleofasHere()) return $gameMap.mapId() === INNER ? { pop: D.TX.noKleofas } : { say: D.TX.readWhere };
        if (!isDone("K50")) return { say: D.TX.readNoInk };
        if (!isActive("D23") && !isDone("D23")) return { say: D.TX.readNoQuest };
        if (!inHours(hour(), D.READ_HOURS)) return { say: D.TX.readLate };
        if (!inBag().length) return { say: D.TX.readNoCard };
        return null;
    }
    function readList(n) {
        const spk = spkK(), out = [];
        linesTo(out, spk, D.TX.readGo);
        out.push(C(221, []));                 // (the screen fades: two hours over the cipher)
        act(out, ["read", n]);
        out.push(C(222, []));
        linesTo(out, spk, CARD(n).read);
        return linesTo(out, spk, D.TX.readDone);
    }
    function readChoice() {
        const cards = inBag();
        if (cards.length === 1) return readList(cards[0]);
        const out = [];
        return choiceTo(out, cards.map(n => fill(K().karta, { tytul: CARD(n).title })).concat([K().nieTeraz]),
            cards.map(n => readList(n)).concat([[]]), cards.length);
    }
    // the lectern in the scriptorium (Map156): Pustelnia.lectern(this)
    function lectern(interp) {
        if (!has() || !interp) return;
        const b = readBlock();
        if (b && b.need) { T.popup.need(pendantIcon(), b.need); return; }
        if (b && b.pop) { T.popup(b.pop, { color: "#ffe9a8" }); return; }
        const out = b ? linesTo([], spkK(), b.say) : readChoice();
        if (out.length) interp.setupChild(out.concat([C(0, [])]), interp.eventId());
    }

    // ------------------------------------------------------------------
    // The Night of the Question (W2 rozdz. 7 the first time, then a question every Wigilia)
    // ------------------------------------------------------------------
    function canAsk(qd) {
        if (S().asked && Object.values(S().asked).some(a => a.id === qd.id) && !qd.keep) return false;
        if (!qd.need) return true;
        if (qd.need === "trust") return isDone("D23");
        const m = /^card:(\d)$/.exec(qd.need);
        return m ? isRead(Number(m[1])) : true;
    }
    // the answer from the chronicles and the game's state: { lines, note }
    function answer(id) {
        const f = flags();
        const A = D.TX.odpowiedzi;
        if (id === "dziadek") return { lines: A.dziadek.lines.slice(), note: A.dziadek.note };
        if (id === "zdrajca") {
            const Z = A.zdrajca, lines = Z.lines.slice();
            let n = Z.note;
            if (f.w5ChroniclesSold) { lines.push(Z.sprzedane); n += Z.sprzedaneNote; }
            else lines.push(Z.pilnuj);
            const w1 = rec("W1"), settled = f.w1Revealed || f.lordAlly || f.feliksPays || f.w1Silent;
            if (w1 && !settled) { lines.push(Z.woda); n += Z.wodaNote; }
            if (f.feliksPays && !f.feliksBroke) { lines.push(Z.milczenie); n += Z.milczenieNote; }
            return { lines, note: n };
        }
        if (id === "lord") {
            const lines = A.lord.lines.slice();
            if (f.w1Revealed || f.lordAlly) lines.push(A.lord.wie);
            return { lines, note: A.lord.note };
        }
        if (id === "serce") return { lines: A.serce.lines.slice(), note: A.serce.note };
        if (id === "dobiesz") return { lines: A.dobiesz.lines.slice(), note: A.dobiesz.note };
        return { lines: D.TX.night.keep, note: "" };
    }
    function nightTalk(spk) {
        const n = nightOf(day(), hour());
        if (!n || !heartHung()) return null;
        if (n.phase === "early") return linesTo([], spk, D.TX.night.early);
        if (S().asked[n.year]) return linesTo([], spk, D.TX.night.used);
        const out = [], first = !Object.keys(S().asked).length;
        linesTo(out, spk, first ? D.TX.night.ask : D.TX.night.askAgain);
        const list = D.QUESTIONS.filter(canAsk);
        const branches = list.map(qd => {
            const b = [];
            if (qd.keep) return linesTo(b, spk, D.TX.night.keep);
            act(b, ["ask", qd.id]);
            linesTo(b, spk, answer(qd.id).lines);
            return linesTo(b, spk, D.TX.night.done);
        });
        return choiceTo(out, list.map(qd => qd.label).concat([K().jeszczeNieWiem]), branches.concat([linesTo([], spk, D.TX.night.later)]), list.length);
    }
    function ask(id) {
        const n = nightOf(day(), hour()), qd = D.QUESTIONS.find(x => x.id === id);
        if (!n || n.phase !== "open" || !qd || qd.keep || S().asked[n.year]) return false;
        const a = answer(id);
        S().asked[n.year] = { id, day: day() };
        note(fill(K().pytanieTytul, { rok: n.year }), fill(K().pytanieNotatka, { pytanie: qd.label, odpowiedz: a.note }));
        const got = xp(100, K().pytanieXp);
        // (W2 rozdz. 7 the first time: the step turns into rozdz. 8 waiting)
        const r = rec("W2");
        if (r && r.s === "active" && r.t && (r.t.w2s || 0) === 2) {
            r.t.w2s = 3;
            T.popup(K().pytanieW2, { top: true, color: "#9ff0a8", sub: K().pytanieZadane + (got ? fill(K().dosw, { n: got }) : "") });
        } else T.popup(fill(K().pytanieTytul, { rok: n.year }), { top: true, color: "#9ff0a8", sub: K().pytanieZadane + (got ? fill(K().dosw, { n: got }) : "") });
        const q = TQ();
        if (q && q.refreshMarkers) q.refreshMarkers();
        return true;
    }
    // the seven strikes at midnight (the hero on the hermitage's maps hears them)
    let bellLeft = 0, bellNext = 0;
    function updateBell() {
        if (!has() || !heartHung()) return;
        const n = nightOf(day(), hour());
        if (n && n.phase === "open" && !S().rung[n.year]) {
            S().rung[n.year] = day();
            if ($gameMap.mapId() === MAP || $gameMap.mapId() === INNER) { bellLeft = 7; bellNext = Graphics.frameCount + 20; }
            const ev = kleofasEv();
            if (ev && kleofasHere()) say(ev, K().siedem);
        }
        if (bellLeft > 0 && Graphics.frameCount >= bellNext) {
            T.audio.se(BELL.name, { volume: $gameMap.mapId() === MAP ? BELL.volume : 55, pitch: BELL.pitch });
            bellLeft--;
            bellNext = Graphics.frameCount + 70;
        }
    }

    // ------------------------------------------------------------------
    // Kleofas's talk (TownLife's hook, first): the meeting, the Night, the quests, then his own menu
    // ------------------------------------------------------------------
    function kleofasTalk(ev) {
        const spk = { id: ev.eventId(), name: D.RESIDENT.name }, out = [];
        if (!S().met) {
            const Tr = T.api("Torch");
            if (Tr && Tr.isLit && Tr.isLit()) linesTo(out, spk, D.TX.meetTorch);
            linesTo(out, spk, D.TX.meet);
            return act(out, ["met"]);
        }
        const nt = nightTalk(spk);
        if (nt) return nt;
        if (questWants()) { const q = questTalk(); if (q && q.length) return q; }
        linesTo(out, spk, [pick(D.TX.ask)]);
        const labels = [], branches = [];
        if (inBag().length) {   // (outside the scriptorium he sends the hero to the lectern)
            labels.push(K().menu.czytaj);
            const b = readBlock();
            branches.push(b ? (b.say ? linesTo([], spk, b.say) : act([], ["pop", b.need || b.pop])) : readChoice());
        }
        if (vcount("kroniki") > 0 && !found(1)) { labels.push(K().menu.kroniki); branches.push(chronicleCard(spk)); }
        labels.push(fill(K().menu.miod, { cena: D.HONEY_PRICE }));
        branches.push(act([], ["honey"]));
        labels.push(K().menu.wisiorek);
        branches.push(linesTo([], spk, D.TX.pendant));
        labels.push(K().menu.coPisza);
        branches.push(act([], ["chron"]).concat(linesTo([], spk, [D.TX.chronicles[(S().chronN || 0) % D.TX.chronicles.length]])));
        labels.push(K().menu.coSlychac);
        branches.push(linesTo([], spk, [usual() || K().cicho]));
        labels.push(K().menu.bywaj);
        branches.push([]);
        return choiceTo(out, labels, branches, labels.length - 1);
    }
    function chronicleCard(spk) {
        const out = [];
        linesTo(out, spk, K().kronikiKarta);
        return act(out, ["card", 1, K().kronikiKartaPopup]);
    }
    // Ambroży hands over the card of the chronicles the hero gave him; Baltazar sells it back - (2026-10-17, W5) only once the card
    // is no longer in his strongbox in the kantor's cellar (Kantor.cardInBox: taken there at night in W5 rozdz. 4), at his prices
    // (double for an enemy, half in the hero's grip - Kantor.priceMul)
    function ambrozyTalk(ev) {
        const f = flags();
        if (found(1) || !(f.ambrozyChronicles || f.chroniclesForAmbrozy) || !(isActive("D23") || isDone("K50"))) return null;
        if (!inHours(hour(), [6, 21])) return null;
        const spk = { id: ev.eventId(), name: K().ambrozy }, out = [];
        linesTo(out, spk, K().ambrozyPyta.concat(D.TX.ambrozyCard));
        return act(out, ["card", 1, K().ambrozyPopup]);
    }
    const cardPrice = () => Math.max(1, Math.round(D.CARD_BUYBACK * (T.call("Kantor", "priceMul") || 1)));
    function baltazarTalk(ev) {
        const f = flags();
        if (found(1) || !f.w5ChroniclesSold || !isActive("D23") || !inHours(hour(), [8, 18])) return null;
        if (T.call("Kantor", "cardInBox")) return null;   // (W5: the card waits in his strongbox - the night in his cellar)
        const spk = { id: ev.eventId(), name: K().baltazar }, out = [];
        linesTo(out, spk, D.TX.balt);
        return choiceTo(out, [fill(K().biore, { cena: cardPrice() }), K().nieTeraz],
            [act([], ["buyCard"]).concat(linesTo([], spk, D.TX.baltYes)), linesTo([], spk, D.TX.baltNo)], 1);
    }
    function hook(key, ev) {
        if (!has()) return null;
        if (key === KEY) return kleofasTalk(ev);
        if (key === "dzwonnik") return ambrozyTalk(ev);
        if (key === "kupiec") return baltazarTalk(ev);
        return null;
    }
    // (2026-10-23, docs/ROZMOWY.md) the core's talk service: Kleofas's own talk, Ambroży's and Baltazar's card - "meet", after Kruk's
    // letters, before Przystan's people and the quests (as the old hooks; Kleofas speaks of his quests himself - questWants)
    function hookTalk() {
        if (hookTalk.done) return;
        hookTalk.done = true;
        T.talk.takeover({ owner: PLUGIN, who: [KEY, "dzwonnik", "kupiec"], priority: T.talk.PRIORITY.meet + 10,
            run: ctx => { try { return hook(ctx.who, ctx.ev); } catch (e) { console.error("[Pustelnia]", e); return null; } } });
    }
    hookTalk();

    // the script calls from the talks: Pustelnia.act(this, [what, ...])
    function actCall(interp, args) {
        if (!has() || !Array.isArray(args)) return;
        const [what, a, b] = args;
        const stop = () => { if (interp && interp._list) interp._index = interp._list.length; };
        try {
            if (what === "met") {
                if (!S().met) { S().met = day(); setFlag("pustelnikMet"); note(D.TX.meetNote[0], D.TX.meetNote[1]); }
            } else if (what === "honey") {
                const h = S().honey;
                if (h.day !== day()) { h.day = day(); h.n = 0; }
                const ev = kleofasEv();
                if (h.n >= 3) { if (ev) say(ev, D.TX.honeyNone[0]); stop(); return; }
                if ($gameParty.gold() < D.HONEY_PRICE) { T.popup.need(COIN_ICON, fill(K().potrzebujesz, { cena: D.HONEY_PRICE })); stop(); return; }
                $gameParty.loseGold(D.HONEY_PRICE);
                $gameParty.gainItem(item(D.ITEM.honey), 1);
                h.n++;
                if (ev) say(ev, pick(D.TX.honeyBuy));
            } else if (what === "chron") {
                S().chronN = (S().chronN || 0) + 1;
            } else if (what === "card") {
                giveCard(a, b);
            } else if (what === "buyCard") {
                const price = cardPrice();
                if ($gameParty.gold() < price) { T.popup.need(COIN_ICON, fill(K().potrzebujesz, { cena: price })); stop(); return; }
                $gameParty.loseGold(price);
                giveCard(1, K().baltazarPopup);
            } else if (what === "read") {
                read(a);
            } else if (what === "pop") {
                if (a === D.TX.noPendant) T.popup.need(pendantIcon(), a); else T.popup(a, { color: "#ffe9a8" });
                stop();
            } else if (what === "ask") {
                ask(a);
            } else if (what === "serce" || what === "zawies") {
                w2Act(what);
            }
        } catch (e) { console.error("[Pustelnia] act " + JSON.stringify(args), e); }
    }

    // ------------------------------------------------------------------
    // Things to look at, the cards lying about (Map146, Map119, Map123), the way east
    // ------------------------------------------------------------------
    function look(interp, what) {
        if (!has()) return;
        if (what === "dzwon") T.popup(heartHung() ? D.TX.bellHung : D.TX.bellMute, { color: "info" });
        else if (what === "tarcza") T.popup(pendant() ? D.TX.dial : D.TX.dialNoPendant, { color: "info" });
        else if (what === "ule") T.popup(hour() >= 20 || hour() < 5 ? D.TX.hivesDusk : D.TX.hives, { color: "info" });
    }
    let edgeAt = 0;
    function edge() {
        if (Graphics.frameCount - edgeAt < 60) return;
        edgeAt = Graphics.frameCount;
        T.popup(D.TX.edge, { color: "info" });
    }
    // a card picked up from where it lies: 2 floor 20, 1 the Archive's shelf, 3 the Silent's register
    function pickCard(interp, n) {
        if (!has() || found(n)) return;
        say($gamePlayer, K().kartaLezy[n] || "");
        giveCard(n);
        const ev = interp && $gameMap.event(interp.eventId());
        if (ev && interp.eventId() >= D.IDS[0] && interp.eventId() <= D.IDS[1]) ev.erase();
    }
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1,
        switch1Valid: false, switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function cardEvent(id, n, x, y, image, name) {
        const page = { conditions: Object.assign({}, BLANK), directionFix: true,
            image: Object.assign({ tileId: 0, characterName: "", direction: 2, pattern: 0, characterIndex: 0 }, image || {}),
            list: [C(355, ["Pustelnia.pick(this, " + n + ");"]), C(0, [])],
            moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: false };
        return { id, name, note: "<Pustelnia:karta" + n + ">", pages: [page], x, y };
    }
    T.inject([FLOOR20, ARCHIVE], { ids: D.IDS, owner: PLUGIN, build(data, mapId) {
        if (!has()) return [];
        if (mapId === FLOOR20 && !found(2))
            return [cardEvent(600, 2, 21, 16, { characterName: "!Underground_Props", characterIndex: 0, direction: 6, pattern: 2 }, TK.kod.build[0])];
        if (mapId === ARCHIVE && flag("chroniclesLeft") && !found(1))
            return [cardEvent(601, 1, 10, 4, null, TK.kod.build[1])];
        return [];
    } });
    // the Silent's register (Map123 "Rejestr straży"): one more line at the end of its pages - the map file stays as it is
    T.onMapData((data, mapId) => {
        if (mapId !== ELDER || !data || !data.events) return;
        for (const e of data.events) {
            if (!e || e.name !== TK.kod.glowna[0]) continue;
            for (const pg of e.pages || []) {
                const list = pg.list || [];
                if (list.some(c => c.code === 355 && /Pustelnia\.pick/.test(String(c.parameters[0])))) continue;
                const end = list.length && list[list.length - 1].code === 0 && list[list.length - 1].indent === 0 ? list.length - 1 : list.length;
                list.splice(end, 0, C(355, ["if (window.Pustelnia) Pustelnia.pick(this, 3);"]));
            }
        }
    }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // TownQuests' handlers: D23 (the cards), W2 rozdz. 7 (the bell's heart, the Night of the Question)
    // ------------------------------------------------------------------
    const W2L = () => { const q = TQ(); return (q && q.Q && q.Q.W2 && q.Q.W2.lines) || {}; };
    const stage = r => (r && r.t ? r.t.w2s || 0 : 0);
    const ambrozyOk = () => { const L = TL(), st = L && L.state ? L.state("dzwonnik") : null; return !!st && !st.hidden && inHours(hour(), [6, 21]); };
    function w2Act(what) {
        const r = rec("W2"), L = W2L();
        if (!r || r.s !== "active") return;
        const q = TQ();
        if (what === "serce" && stage(r) === 0) {
            r.t.w2s = 1;
            vgive("serce_dzwonu", 1);
            T.popup(vname("serce_dzwonu"), { top: true, color: "#ffd23f", sub: String(L.stage1 || "").replace(/^./, c => c.toUpperCase()) });
            if (L.heartNote) note(L.heartNote[0], L.heartNote[1]);
        } else if (what === "zawies" && stage(r) === 1 && vcount("serce_dzwonu") > 0) {
            r.t.w2s = 2;
            vtake("serce_dzwonu", 1);
            setFlag("sercePustelni");
            if (L.heartNoteKleofas) note(L.heartNoteKleofas[0], L.heartNoteKleofas[1]);
            const nn = nextNight();
            T.popup(K().nocPytania, { top: true, color: "#ffe27a", sub: fill(K().nocPytaniaSub, { dzien: nn.wig }) });
        }
        if (q && q.refreshMarkers) q.refreshMarkers();
    }
    function hookQuests() {
        const q = TQ();
        if (!q || !q.FX || hookQuests.done) return;
        hookQuests.done = true;
        Object.assign(q.FX, {
            d23Karty: {
                check: () => readCount() >= 6,
                vars: () => {
                    const bag = inBag(), miss = D.CARDS.filter(c => !found(c.n) && !isRead(c.n));
                    return { n: readCount(), wtorbie: bag.length ? fill(K().doOdczytania, { n: bag.length }) : "",
                        gdzie: miss.length ? fill(K().szukaj, { gdzie: miss.slice(0, 2).map(c => c.where).join("; ") }) : "" };
                },
                ready: (qq, r, st, key) => (key === KEY && inBag().length > 0 && inHours(hour(), D.READ_HOURS) ? true : null),
                talk: () => null
            },
            w2Pytanie: {
                vars: (qq, r) => {
                    const L = W2L(), s = stage(r), nn = nextNight();
                    const etap = s === 0 ? (actTwo() ? L.stage0 : L.stage0Wait) : s === 1 ? L.stage1 : s === 2 ? L.stage2 : L.stage3;
                    return { etap: String(etap || "").replace("{wigilia}", nn.wig).replace("{rok}", nn.year), wigilia: nn.wig, rok: nn.year };
                },
                ready: (qq, r, st, key) => {
                    const s = stage(r);
                    if (key === "dzwonnik") return s === 0 && actTwo() && ambrozyOk();
                    if (key === KEY) return (s === 1 && vcount("serce_dzwonu") > 0) || (s === 2 && nightNow() && nightOf(day(), hour()).phase === "open");
                    return null;
                },
                talk: (qq, r, st, key, spk) => {
                    const s = stage(r), L = W2L();
                    if (key === "dzwonnik" && s === 0 && actTwo() && ambrozyOk()) return { ready: true, list: act(linesTo([], spk, L.heart), ["serce"]) };
                    if (key === "dzwonnik" && s === 1 && vcount("serce_dzwonu") > 0) return { ready: false, list: linesTo([], spk, L.heartAway) };
                    if (key === KEY && s === 1 && vcount("serce_dzwonu") > 0) return { ready: true, list: act(linesTo([], spk, L.heartKleofas), ["zawies"]) };
                    if (key === KEY && s === 2) { const nt = nightTalk(spk); if (nt) return { ready: true, list: nt }; }
                    return null;
                },
                tick: (qq, r) => { if (r && r.t && r.t.w2s === undefined) r.t.w2s = 0; }
            }
        });
    }
    hookQuests();

    // TownLife's conditions by name (Pustelnia_Data's plan names them as functions too)
    (() => {
        const L = TL();
        if (L && L.addCondition) { L.addCondition("pustelniaDeszcz", rain); L.addCondition("nocPytania", nightNow); }
    })();

    // ------------------------------------------------------------------
    // The place is built: the harbour's top edge leads up here (Wyspa.js)
    // ------------------------------------------------------------------
    // (only once data/Map155.json is the real map - package 0's stub has the note <Wyspa:szkielet>: until the coordinator installs the
    // map, the way up from the harbour stays shut. Read once at the start, the way the engine reads its data files)
    let built = false;
    (function checkBuilt() {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "data/Map" + String(MAP).padStart(3, "0") + ".json");
            xhr.overrideMimeType("application/json");
            xhr.onload = () => {
                try {
                    const note = xhr.status < 400 ? String(JSON.parse(xhr.responseText).note || "") : "<Wyspa:szkielet>";
                    if (!/<Wyspa:szkielet>/.test(note)) { built = true; const w = W(); if (w && w.ready) w.ready(MAP); }
                } catch (e) { /* (no map: not built) */ }
            };
            xhr.send();
        } catch (e) { /* (no XHR: not built) */ }
    })();
    // (Kleofas's talk bust img/pictures/Pustelnik_Bust.png is in SpeechBubbles' own BUSTS table since the integration)

    let tick = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        updateBell();
        if (++tick % 60 === 0) syncCards();
    }, { owner: PLUGIN, name: "hermitage" });
    T.on("mapReady", () => { hookQuests(); hookTalk(); syncCards(); }, { owner: PLUGIN });

    // ------------------------------------------------------------------
    // The API
    // ------------------------------------------------------------------
    const api = {
        MAP, INNER, DATA: D, state: () => S(), act: actCall, lectern, look, edge, pick: pickCard, read, giveCard, syncCards,
        rain, nightNow, nightOf, wigDay, nextNight, heartHung, inBag, isRead, found, readCount, answer, ask, canAsk,
        kleofasHere, readBlock, built: () => built
    };
    window.Pustelnia = T.register(PLUGIN, api);
})();
