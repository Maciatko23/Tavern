//=============================================================================
// Goraczka.js
//=============================================================================
// The thread W21 "Gorączka w przytułku" (docs/zadania_nowe/goraczka.md) - the ENGINE; the data: Goraczka_Data.js, the words: js/teksty/goraczka.txt.
// A fever starts in the camp (day 30+, after the vote on the camp): Stefa's six sick lie in the poorhouse (the new one on Map216 when the camp
// is inside the wall, the old one on Map202 when it is outside), the town shuts the southern street (two carts) and sends a night patrol.
//   1. "Pierwsi chorzy": Stefa's first brew (one decoction, two sips of the hero's own rainwater, S1: the street is shut)
//   2. "Zioła i dzwon": two of three collections (Jadwiga's herbs, Kleofas's dressings, Hanka's boiling water), three beds served, old Gaweł
//      dies in the night if he gets no brew before 20:00 (S2: the bell)
//   3. "Kto pije, ten choruje": three questions, the barrel at the Eastern Cistern (the hero may taste it and fall ill), S3: the crowd at Ignac's
//   4. "Rów": the white crust in the gutter, the slab behind the Garbarnia (a shovel), Wawrzyn (three ways), the jar of crust
//   5. "Sąd i wybór": S4 the meeting before the town hall, A punish / B help him move the vats (a settling basin) / C silence, S5 the morning
// API: window.Goraczka (Tawerna.api("Goraczka")): stan(), akcja(name, ...), lozko(this, key), beczka(this), osad(this, i), plyta(this) ...

/*:
 * @target MZ
 * @plugindesc [W21] Gorączka w przytułku - silnik: chorzy w łóżkach (mapa 216 / 202), zapora na ulicy, zbiórki, beczka i rów, sceny S1-S5, wybór A/B/C. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Goraczka_Data
 * @orderAfter Majster
 *
 * @help
 * ============================================================================
 * Goraczka.js - wątek W21 „Gorączka w przytułku” (docs/zadania_nowe/goraczka.md)
 * ============================================================================
 * Od dnia 30 i po głosowaniu w sprawie obozu. Chorzy leżą w przytułku (mapa 216
 * w mieście albo mapa 202 na Podgrodziu). F9 → „Fabuła i postacie” → „Wątek W21”.
 * W skryptach: Goraczka.stan(), Goraczka.akcja("wywar").
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.GoraczkaData;
    if (!T || !window.Watki || !D) throw new Error("Goraczka.js: brak TawernaCore.js / Watki.js / Goraczka_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Goraczka";
    const w = D.watek, M = Watki.mowa, C = M.C, fill = Watki.wstaw;
    const S = () => w.S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap && !!window.$gameParty;
    const TL = () => T.api("TownLife") || window.TownLife || null;
    const TQ = () => T.api("TownQuests") || window.TownQuests || null;
    const SB = () => T.api("SpeechBubbles") || window.SpeechBubbles || null;
    const tx = k => w.tekst(k);
    const tx1 = k => { const v = w.tekst(k); return Array.isArray(v) ? v[0] : v; };
    const report = (where, e) => console.error("[Goraczka] " + where + ":", e);
    const onMap = id => has() && $gameMap.mapId() === id;
    const abs = (d, h) => d * 24 + h;
    const rel = () => (S().start > 0 ? day() - S().start : -1);              // days since the first one
    const linie = (out, sp, key, vars) => w.linie(out, sp, key, vars);
    const skrypt = (out, code) => M.script(out, code);
    const wybor = (out, labels, branches, cancel) => M.choiceTo(out, labels, branches, cancel);
    const bran = (sp, key, vars, code) => { const o = []; if (key) linie(o, sp, key, vars); if (code) skrypt(o, code); return o; };
    const uruchom = (interp, list) => M.uruchom(interp || null, list);
    const dist = (a, b) => Math.abs(a.x - b[0]) + Math.abs(a.y - b[1]);

    // ==================================================================
    // 0. State, steps, the hospital, the items
    // ==================================================================
    const flagOn = f => !!w.flag(f);
    const opiniaNow = () => { try { return TQ().state().opinion || 0; } catch (e) { return 0; } };
    const started = () => has() && S().start > 0;
    const campOut = () => S().camp === "outside";
    const hospital = () => (campOut() ? D.MAP.podgrodzie : D.MAP.przytulek);
    const rec = () => { try { return w.rec("W21"); } catch (e) { return null; } };
    function stepNow() { const r = rec(); return !r ? -1 : r.s === "done" ? 9 : r.s === "active" ? r.step : -1; }
    const ended = () => !!S().koniec && !!S().sc.s5;
    const itemBy = tag => (window.$dataItems || []).find(i => i && i.note && i.note.indexOf("<Goraczka:" + tag + ">") >= 0) || null;
    const numItem = id => (has() && $dataItems[id] ? $gameParty.numItems($dataItems[id]) : 0);
    function popupNeed(id, text) { const it = $dataItems[id]; T.popup.need(it ? it.iconIndex : 0, text); }
    function lose(id, n) { if (n > 0 && $dataItems[id]) $gameParty.loseItem($dataItems[id], n, false); }
    function gain(id, n) { if ($dataItems[id]) { $gameParty.gainItem($dataItems[id], n); T.popup("+" + n + " " + $dataItems[id].name, { icon: $dataItems[id].iconIndex }); } }
    function opinion(n, why) {
        const q = TQ();
        if (!q || !q.addOpinion || !n) return 0;
        const got = q.addOpinion(n, why || tx1("zadania.W21.title"));
        if (got) T.popup(fill(tx1(got > 0 ? "napis.opinia" : "napis.opiniaMinus"), { n: Math.abs(got) }), { top: true, color: got > 0 ? "#9ff0a8" : "#ff9f8f" });
        return got;
    }
    function gold(n) { if (!n || !has()) return; $gameParty.gainGold(n); T.popup(fill(tx1("napis.zloto"), { n }), { icon: 314, kind: "gold" }); }
    const note = k => { const p = w.pair("notatki." + k); if (p && !S().notes[k]) { S().notes[k] = 1; T.call("Journal", "addNote", p[0], p[1]); } };
    const mysl = k => w.mysl([tx1("mysl." + k)]);
    const sickN = () => D.CHORZY.filter(k => S().sick[k] === "c" || S().sick[k] === "u").length;
    const sickState = k => S().sick[k] || "";
    const doses = () => Object.keys(S().dose).length;

    // ==================================================================
    // 1. The start, the patients, the clock
    // ==================================================================
    // the thread begins once the day is 30 or later, the camp has been voted on and it is 8:00 (Stefa or Ludmiła calls the hero)
    const otwarta = () => has() && day() >= D.OD_DNIA && (flagOn("campInside") || flagOn("campOutside")) && (day() > D.OD_DNIA || hour() >= D.CZAS.start);
    function begin() {
        const s = S();
        if (s.start) return;
        s.start = day();
        s.camp = flagOn("campOutside") ? "outside" : "inside";
        for (const k of D.OD_POCZATKU) s.sick[k] = "c";
        T.popup(tx1("napis.start"), { top: true, color: "#ffd866" });
        note("start");
        mysl("start");
        w.autoChecks();
        refreshAll();
    }
    // the new ones fall ill on the second day; Gaweł's night (20:00 of the second day)
    function dayTick() {
        const s = S(), r = rel();
        if (r >= 1) for (const k of D.CHORZY) if (!s.sick[k]) s.sick[k] = "c";
        if (stepNow() >= 1 && !s.gawelDead && !s.dose.gawel && abs(day(), hour()) >= abs(s.start + 1, D.CZAS.wywarDo) && sickState("gawel") !== "x") {
            s.gawelDead = day(); s.sick.gawel = "x";
            opinion(D.NAGRODY.strata.opinia, tx1("imie.gawel"));
            T.popup(tx1("napis.gawel"), { top: true, color: "#ff9f8f" });
            note("gawel");
        }
        if (stepNow() === 4 && !s.zebranie) {   // chapter 4 is done: the sołtys sets the meeting (not before the fifth day, 15:00)
            s.zebranie = Math.max(day() + 1, s.start + D.CZAS.zebranieKiedy);
            T.popup(fill(tx1("napis.zebranie"), { dzien: s.zebranie }), { top: true, color: "#ffd866" });
        }
        // the epidemic dies down of its own when nobody did anything for four days after the meeting (ending C)
        if (!s.koniec && s.zebranie && abs(day(), hour()) >= abs(s.zebranie, D.CZAS.zebranieDo) && !s.sc.s4) endC(true);
        if (s.koniec && !s.sc.s5 && abs(day(), hour()) >= abs(s.koniecDzien + 1, 9)) s.sc.s5 = day();
        if (s.osadnik === 1 && day() >= s.osadnikDzien + D.CZAS.osadnik && !s.osadnikGotowy) osadnikGotowy();
    }
    let lastRefresh = "";
    const events = () => $gameMap.events();
    const evId = (k) => D.LOZKA[k] ? 4610 + D.CHORZY.indexOf(k) : 0;
    const evById = id => (has() ? $gameMap.event(id) || null : null);
    function hide(a) { if (!a) return; a.setTransparent(true); a.setThrough(true); }
    function showEv(a) { if (!a) return; a.setTransparent(false); }
    // the beds: every patient's overlay (sick: the head and the blanket; well: gone; dead: covered)
    function refreshSick() {
        if (!has() || !started() || $gameMap.mapId() !== hospital()) return;
        for (const k of D.CHORZY) {
            const a = evById(evId(k));
            if (!a) continue;
            const st = sickState(k);
            if (st === "c" || st === "u") { a.setImage(D.SPRITES.chory + k, 0); a.setTransparent(false); a.setThrough(false); }
            else if (st === "x") { a.setImage(D.SPRITES.przykryty, 0); a.setTransparent(false); a.setThrough(false); }
            else { a.setTransparent(true); a.setThrough(true); }
        }
    }
    function refreshZapora() {
        if (!has() || !onMap(D.MAP.miasto)) return;
        const on = started() && !!S().sc.s1 && !S().sc.s5;
        for (const id of [4620, 4621]) { const a = evById(id); if (!a) continue; if (on && !a._gorMoving) { const c = D.MIEJSCA.zapora[id - 4620]; if (a.x !== c[0] || a.y !== c[1]) a.locate(c[0], c[1]); showEv(a); a.setThrough(false); } else if (!on) hide(a); }
        const k = evById(4622);
        if (k) { if (started() && !campOut() && !ended()) { showEv(k); k.setThrough(false); } else hide(k); }
    }
    function refreshRow() {
        if (!has() || !onMap(D.MAP.miasto)) return;
        const on = started() && stepNow() >= 3 && !S().sc.s5;
        D.MIEJSCA.osad.forEach((c, i) => { const a = evById(4630 + i); if (!a) return; if (on) showEv(a); else hide(a); });
        const p = evById(4633);
        if (p) { if (on && !S().dowod.plyta) { showEv(p); p.setThrough(false); } else if (on) { showEv(p); p.setThrough(false); } else hide(p); }
    }
    let lastMapReady = -999;
    function refreshStefa() {
        if (!has()) return;
        const on = started() && !campOut() && !ended(), h = hour(), day_ = h >= 6 && h < 18;
        const a = evById(4623), b = evById(4624);
        // (nobody vanishes: a visible Stefa goes off - and the other one comes - only when the hero is not looking, i.e. far off or the map has just loaded)
        const free = ev => !ev || ev._transparent || !$gamePlayer || dist($gamePlayer, [ev.x, ev.y]) > 14 || Graphics.frameCount - lastMapReady < 90;
        if (a) { if (on && day_) { showEv(a); a.setThrough(false); } else if (free(a)) hide(a); }
        if (b) { if (on && !day_) { showEv(b); b.setThrough(false); } else if (free(b)) hide(b); }
    }
    function refreshAll() { try { stefaGone(); refreshSick(); refreshZapora(); refreshRow(); refreshStefa(); } catch (e) { report("refresh", e); } }

    // ==================================================================
    // 2. Stefa: the first brew, the pass, the counting
    // ==================================================================
    const spkOf = key => { if (key === "opiekunka" || key === "stefa") { const a = stefaEv(); return { id: a ? a.eventId() : 0, name: "" }; } const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null; return { id: ev ? ev.eventId() : 0, name: "" }; };
    const ALIAS = { stefa: "opiekunka", ignac: "garbarz", kleofas: "pustelnik", kuba: "woziwoda", hanka: "piekarka", jadwiga: "znachorka", wit: "kapral", tadek: "kowal", ambrozy: "dzwonnik" };
    function mowca(ctx, key) {
        if (D.LOZKA[key]) { const a = evById(evId(key)); return a ? { id: a.eventId(), name: "" } : { id: 0, name: "" }; }
        return spkOf(ALIAS[key] || key);
    }
    const OPT = { akapity: true, kto: k => mowca(null, k) };
    function run(interp, out) {
        if (!out || !out.length) return;
        if (interp && interp.setupChild) interp.setupChild(out.concat([C(0, [])]), interp.eventId ? interp.eventId() : 0);
        else w.uruchom(null, out);
    }
    // lines started by an ACTION (a script inside a running talk): never a new interpreter at once - wait until the map's interpreter and the messages are free
    function later(out, delay) {
        if (!out || !out.length) return;
        let n = 0;
        const iv = setInterval(() => {
            if (!has() || ++n > 400) { clearInterval(iv); return; }
            if ($gameMap.isEventRunning() || $gameMessage.isBusy() || n * 100 < (delay || 0)) return;
            clearInterval(iv);
            try { uruchom(null, out); } catch (e) { report("later", e); }
        }, 100);
    }
    function inna(interp, key) {
        const ev = interp && interp.eventId && $gameMap.event(interp.eventId());
        T.talk.run(interp, key, { ev, owner: PLUGIN, skip: PLUGIN });
    }
    function stefaMenu() {
        const s = S(), out = [], sp = spkOf("opiekunka"), st = stepNow();
        if (!s.met) { s.met = day(); linie(out, sp, "stefa.intro1"); linie(out, sp, "stefa.intro2"); }
        const labels = [], branches = [];
        if (st === 0 && !s.brew) { labels.push(tx1("stefa.opcja.wywar")); branches.push(skrypt([], "Goraczka.wywar(this)")); }
        labels.push(tx1("stefa.opcja.jak")); branches.push(skrypt([], "Goraczka.jakChorzy(this)"));
        if (st >= 4 && s.koniec) { /* (the counting is said by S5 and by "jak") */ }
        labels.push(tx1("opcja.inna")); branches.push(skrypt([], "Goraczka.inna(this, 'opiekunka')"));
        wybor(out, labels, branches, labels.length - 1);
        return out;
    }
    // the first brew: one decoction (item 110), two sips of the hero's own water; Szymek gets relief, the other two only weaken; the pass
    function wywar(interp) {
        const s = S(), sp = spkOf("opiekunka"), out = [];
        if (numItem(D.WYWAR) < 1) { popupNeed(D.WYWAR, tx1("napis.brakWywaru")); return; }
        const N = window.Needs;
        if (!N || (N.skinCharges ? N.skinCharges() : 0) < D.WODA) { popupNeed(129, tx1("napis.brakWody")); return; }
        lose(D.WYWAR, 1);
        N.state().skin = Math.max(0, N.skinCharges() - D.WODA);
        s.brew = day(); s.sick.szymek = "u";
        linie(out, sp, "stefa.wywar");
        const pass = itemBy("przepustka");
        s.pass = 1;
        if (pass) { $gameParty.gainItem(pass, 1); T.popup("+1 " + pass.name, { icon: pass.iconIndex }); }
        linie(out, sp, "stefa.przepustka");
        gold(D.NAGRODY.r1.zloto);
        note("wywar");
        run(interp, out);
        w.autoChecks(); refreshAll();
    }
    function jakChorzy(interp) {
        const s = S(), sp = spkOf("opiekunka"), out = [];
        const key = s.koniec ? "stefa.potem" : stepNow() <= 0 ? "stefa.jak0" : stepNow() === 1 ? "stefa.jak1" : stepNow() === 2 ? "stefa.jak2" : "stefa.jak3";
        linie(out, sp, key, { n: sickN(), zmarly: s.gawelDead ? tx1("stefa.zmarlGawel") : "", uratowani: s.saved });
        run(interp, out);
    }

    // ==================================================================
    // 3. The beds: the doses (chapter 2)
    // ==================================================================
    function lozko(interp, key) {
        const s = S(), st = sickState(key), out = [], sp = mowca(null, key);
        if (!started() || !st) return;
        if (st === "x") { linie(out, spkOf("opiekunka"), "lozko.zmarly"); run(interp, out); return; }
        if (stepNow() < 1 || s.koniec) { linie(out, sp, "lozko." + key + ".0"); run(interp, out); return; }
        if (s.dose[key]) { linie(out, sp, "lozko." + key + ".1"); run(interp, out); return; }
        linie(out, sp, "lozko." + key + ".0");
        const labels = [tx1("lozko.opcja.wywar")], branches = [skrypt([], "Goraczka.dawka(this, '" + key + "', 'wywar')")];
        if (key !== "gawel") { labels.push(tx1("lozko.opcja.oklad")); branches.push(skrypt([], "Goraczka.dawka(this, '" + key + "', 'oklad')")); }
        labels.push(tx1("lozko.opcja.nic")); branches.push([]);
        wybor(out, labels, branches, labels.length - 1);
        run(interp, out);
    }
    function dawka(interp, key, how) {
        const s = S(), out = [], sp = mowca(null, key);
        const id = how === "wywar" ? D.WYWAR : D.OPATRUNEK;
        if (s.dose[key]) return;
        if (numItem(id) < 1) { popupNeed(id, tx1(how === "wywar" ? "napis.brakWywaru" : "napis.brakOkladu")); return; }
        lose(id, 1);
        s.dose[key] = how; s.sick[key] = "u";
        T.audio.se("Heal1", { volume: 50, pitch: 90 });
        linie(out, sp, "lozko." + key + ".dane");
        run(interp, out);
        refreshSick();
        w.autoChecks();
    }
    const servedN = () => Object.keys(S().dose).length;

    // ==================================================================
    // 4. The collections (chapter 2): Jadwiga, Kleofas, Hanka
    // ==================================================================
    const zbN = () => ["jadwiga", "kleofas", "hanka"].filter(k => S().zb[k]).length;
    function zbiorkaMenu(key) {
        const s = S(), out = [], sp = spkOf(ALIAS[key] || key);
        const kluczZb = key === "jadwiga" ? "jadwiga" : key === "pustelnik" ? "kleofas" : "hanka";
        if (s.zb[kluczZb]) return null;
        linie(out, sp, "zb." + kluczZb + ".prosba");
        const labels = [tx1("zb." + kluczZb + ".opcja"), tx1("opcja.inna")], branches = [skrypt([], "Goraczka.zbiorka('" + kluczZb + "')"), skrypt([], "Goraczka.inna(this, '" + key + "')")];
        wybor(out, labels, branches, 1);
        return out;
    }
    function zbiorka(k) {
        const s = S(), out = [];
        if (k === "jadwiga") {
            const z = D.ZBIORKA.jadwiga;
            if (numItem(D.ZIOLA.dziurawiec) < z.dziurawiec) { popupNeed(D.ZIOLA.dziurawiec, fill(tx1("napis.brakZiol"), { n: z.dziurawiec, a: $dataItems[D.ZIOLA.dziurawiec].name })); return; }
            if (numItem(D.ZIOLA.kozlek) < z.kozlek) { popupNeed(D.ZIOLA.kozlek, fill(tx1("napis.brakZiol"), { n: z.kozlek, a: $dataItems[D.ZIOLA.kozlek].name })); return; }
            lose(D.ZIOLA.dziurawiec, z.dziurawiec); lose(D.ZIOLA.kozlek, z.kozlek);
        }
        if (k === "kleofas") {
            if (numItem(D.OPATRUNEK) < D.ZBIORKA.kleofas.opatrunek) { popupNeed(D.OPATRUNEK, fill(tx1("napis.brakZiol"), { n: D.ZBIORKA.kleofas.opatrunek, a: $dataItems[D.OPATRUNEK].name })); return; }
            lose(D.OPATRUNEK, D.ZBIORKA.kleofas.opatrunek);
        }
        s.zb[k] = day();
        T.audio.se("Item1", { volume: 60 });
        const ok = zbN() >= 2;
        w.mysl([fill(tx1("mysl.zb"), { n: zbN() })]);
        void out; void ok;
        w.autoChecks();
    }

    // ==================================================================
    // 5. Talks: the questions of chapter 3, Ignac, Wawrzyn, the sołtys
    // ==================================================================
    function pytanie(interp, key) {
        const s = S(), sp = spkOf(ALIAS[key] || key), out = [];
        s.lista[key] = day();
        linie(out, sp, "pytanie." + key);
        run(interp, out);
        if (D.LISTA_PYTAN.every(k => s.lista[k])) { note("lista"); mysl("lista"); }
        w.autoChecks();
    }
    function ignacMenu() {
        const s = S(), st = stepNow();
        if (st === 3 && !s.ign) {   // chapter 4: Ignac knows the smell
            const out = [], sp = spkOf("garbarz");
            linie(out, sp, s.s3 === "stoj" ? "ignac.row.sojusznik" : s.s3 === "nic" ? "ignac.row.zly" : "ignac.row.sprawdzil");
            skrypt(out, "Goraczka.akcja('ignacRada')");
            return out;
        }
        return null;
    }
    function wawrzynMenu() {
        const s = S(), st = stepNow(), sp = spkOf("wawrzyn"), out = [];
        if (!started()) return null;
        if (st === 3 && !s.wawrzyn) {
            if (!s.dowod.osad && !s.dowod.plyta && !s.dowod.sloik) { linie(out, sp, "wawrzyn.nic"); return out; }
            linie(out, sp, "wawrzyn.start");
            const labels = [tx1("wawrzyn.opcja.spokojnie"), tx1("wawrzyn.opcja.przycisnij")], branches = [bran(sp, "wawrzyn.spokojnie", null, "Goraczka.wawrzynPodejscie('spokojnie')"), bran(sp, "wawrzyn.przyciskasz", null, "Goraczka.wawrzynPodejscie('przycisnal')")];
            if (s.s3 && s.s3 !== "nic") { labels.push(tx1("wawrzyn.opcja.ignac")); branches.push(bran(sp, "wawrzyn.ignac", null, "Goraczka.wawrzynPodejscie('ignac')")); }
            labels.push(tx1("opcja.nic")); branches.push([]);
            wybor(out, labels, branches, labels.length - 1);
            return out;
        }
        if (st >= 4 && s.koniec === "B" && s.osadnik === 0) { linie(out, sp, "wawrzyn.osadnikProsba", { lista: budowaLista() }); wybor(out, [tx1("wawrzyn.opcja.materialy"), tx1("opcja.nic")], [skrypt([], "Goraczka.osadnik()"), []], 1); return out; }
        if (s.koniec) { linie(out, sp, "wawrzyn.po" + s.koniec); return out; }
        if (st >= 3 && s.wawrzyn) { linie(out, sp, "wawrzyn.czeka"); return out; }
        linie(out, sp, "wawrzyn.dzien");
        return out;
    }
    function wawrzynPodejscie(how) {   // (the lines are in the branch of the choice; here only the state)
        const s = S();
        s.wawrzyn = how; s.wawrzynDzien = day();
        if (how === "przycisnal") uciekl();
        note("wawrzyn");
        w.autoChecks();
    }
    function uciekl() {
        const L = TL();
        if (L && L.setGone) L.setGone("wawrzyn", day() + 1);
        S().sc.uciekl = day();
    }
    function ignacRada() { S().ign = day(); mysl("ignacRada"); }
    // chapter 3: the sołtys and the crowd are told off by the evidence; chapter 5: the soltys at the meeting
    T.talk.takeover({ owner: PLUGIN, name: "dawcy", priority: T.talk.PRIORITY.errand + 30,
        who: key => has() && started() && !ended() && (key === "opiekunka" || key === "znachorka" || key === "pustelnik" || key === "piekarka" || key === "woziwoda" || key === "kowal" || key === "garbarz" || key === "wawrzyn"),
        run: ctx => { try { return rozmowa(ctx.who); } catch (e) { report("rozmowa", e); return null; } } });
    function rozmowa(key) {
        const s = S(), st = stepNow();
        if (key === "opiekunka") return stefaMenu();
        if (key === "wawrzyn") return wawrzynMenu();
        if (key === "garbarz") return ignacMenu();
        if (st === 1 && (key === "znachorka" || key === "pustelnik" || key === "piekarka")) return zbiorkaMenu(key);
        if (st === 2 && D.LISTA_PYTAN.includes(key) && !s.lista[key] && s.start >= 0 && rel() >= 2) {
            const out = [], sp = spkOf(ALIAS[key] || key);
            wybor(out, [tx1("pytanie.opcja"), tx1("opcja.inna")], [skrypt([], "Goraczka.pytanie(this, '" + key + "')"), skrypt([], "Goraczka.inna(this, '" + key + "')")], 1);
            void sp;
            return out;
        }
        return null;
    }

    // ==================================================================
    // 6. The doors, the barrel, the ditch
    // ==================================================================
    function drzwiPrzytulek(interp) {
        if (!has()) return;
        const t = $gameTemp, k = interp && interp.eventId ? interp.eventId() : 0;
        if (!started() || campOut() || ended()) { popupOnce(k, tx1("drzwi.zamkniete")); return; }
        const h = hour(), night = h >= D.CZAS.godzinaPolicyjna || h < 6;
        const pass = itemBy("przepustka");
        const ok = !night || (pass && $gameParty.hasItem(pass)) || opiniaNow() >= D.OPINIA_PRZEPUSTKA;
        if (!ok) { popupOnce(k, tx1("drzwi.patrol")); return; }
        T.audio.se("Door1", { volume: 80 });
        $gamePlayer.reserveTransfer(D.MAP.przytulek, 10, 9, 8, 0);
        void t;
    }
    function popupOnce(k, text) {
        const t = $gameTemp; t._gorDoorPop = t._gorDoorPop || {};
        if (!(t._gorDoorPop[k] > Graphics.frameCount - 60)) { t._gorDoorPop[k] = Graphics.frameCount; T.popup(text, { color: "info" }); }
    }
    // the barrel cart at the Eastern Cistern: chapter 3, smell it (or taste: a mild fever)
    function beczka(interp) {
        if (!started() || stepNow() < 2) return;
        const out = [], sp = { id: 0, name: "" };
        linie(out, sp, "beczka.opis");
        wybor(out, [tx1("beczka.opcja.wachaj"), tx1("beczka.opcja.sprobuj"), tx1("opcja.nic")],
            [bran(sp, "beczka.wacham", null, "Goraczka.akcja('zapach')"), bran(sp, "beczka.probuje", null, "Goraczka.akcja('sprobuj')"), []], 2);
        run(interp, out);
    }
    function zapach() { const s = S(); if (!s.zapach) { s.zapach = day(); note("zapach"); } w.autoChecks(); }
    function sprobuj() {
        zapach();
        const SV = T.api("Survival");
        if (!S().ill) {
            S().ill = day();
            if ($gameSystem.addBuff) $gameSystem.addBuff("goraczka", 18);
            if (SV && SV.injure === undefined && $gameSystem.changeStamina) $gameSystem.changeStamina(-20);
            T.popup(tx1("napis.chory"), { top: true, color: "#ff9f8f" });
            note("chory");
        }
    }
    // the white crust in the gutter (3 places): two of them make the first piece of evidence; at the last one a jar can be filled
    function osad(interp, i) {
        const s = S();
        if (stepNow() < 3) return;
        const out = [], sp = { id: 0, name: "" };
        s.osadN[i] = day();
        const n = Object.keys(s.osadN).length;
        linie(out, sp, "osad." + (i + 1));
        if (n >= 2 && !s.dowod.osad) { s.dowod.osad = day(); skrypt(out, "Goraczka.akcja('dowod','osad')"); }
        if (i === 2 && !s.dowod.sloik) {
            wybor(out, [tx1("osad.opcja.sloik"), tx1("opcja.nic")], [bran(sp, "osad.sloik", null, "Goraczka.akcja('sloik')"), []], 1);
        }
        run(interp, out);
        w.autoChecks();
    }
    function sloik() {
        const s = S(), it = itemBy("sloik");
        if (s.dowod.sloik) return;
        s.dowod.sloik = day();
        if (it) { $gameParty.gainItem(it, 1); T.popup("+1 " + it.name, { icon: it.iconIndex }); }
        w.autoChecks();
    }
    function dowod(ctx, k) {
        T.popup(fill(tx1("napis.dowod"), { n: Object.keys(S().dowod).length }), { top: true, color: "#ffd866" });
        w.autoChecks();
    }
    function plyta(interp) {
        const s = S();
        if (stepNow() < 3) return;
        const out = [], sp = { id: 0, name: "" };
        if (s.dowod.plyta) { linie(out, sp, "plyta.juz"); run(interp, out); return; }
        const night = hour() >= D.CZAS.godzinaPolicyjna || hour() < 5;
        if (night) { linie(out, spkOf("kapral"), "plyta.patrol"); skrypt(out, "Goraczka.akcja('pouczenie')"); run(interp, out); return; }
        if (!$gameParty.hasItem($dataItems[D.LOPATA])) { popupNeed(D.LOPATA, tx1("napis.brakLopaty")); return; }
        linie(out, sp, "plyta.kopiesz");
        skrypt(out, "Goraczka.akcja('kopanie')");
        run(interp, out);
    }
    function kopanie() {
        const s = S();
        T.audio.se("Earth1", { volume: 70 }); setTimeout(() => T.audio.se("Earth1", { volume: 60, pitch: 90 }), 500);
        s.dowod.plyta = day();
        const out = []; linie(out, { id: 0, name: "" }, "plyta.znalazles");
        later(out, 900);
        dowod(null, "plyta");
        refreshRow();
    }
    function pouczenie() { opinion(-1, tx1("imie.patrol")); }

    // ==================================================================
    // 7. The scenes (bubbles, bars): S1 the closed street, S2 the bell, S3 at Ignac's, S4 the meeting, S5 the quiet
    // ==================================================================
    const scena = { kroki: [], t: 0, mapa: 0, holds: [] };
    function graj(kroki) { scena.kroki = kroki.slice(); scena.t = 0; scena.mapa = $gameMap.mapId(); }
    const busy = () => scena.kroki.length > 0;
    function scenaTick() {
        if (!scena.kroki.length) return;
        if ($gameMap.mapId() !== scena.mapa) { scena.kroki = []; zwolnij(); bars(false); return; }
        if (scena.t > 0) { scena.t--; return; }
        const k = scena.kroki.shift();
        let ch = typeof k.kto === "function" ? k.kto() : k.kto, text = k.tekst;
        const pf = text && /^@(\w+):\s*/.exec(text);
        if (pf) { text = text.slice(pf[0].length); ch = evOf(pf[1]) || ch; }
        if (text && ch && SB() && SB().say) SB().say(ch, text, k.klatki || 150);
        if (k.dzwiek) T.audio.se(k.dzwiek[0], { volume: k.dzwiek[1] || 80, pitch: k.dzwiek[2] || 100 });
        if (k.mysl) w.mysl([k.mysl]);
        if (typeof k.zrob === "function") { try { k.zrob(); } catch (e) { report("scena", e); } }
        scena.t = k.czekaj || 0;
    }
    const bars = on => { const h = T.api("CleanHUD"); try { if (h && h.sceneBars) h.sceneBars(on); } catch (e) { report("bars", e); } };
    const stefaEv = () => { for (const id of [4623, 4624]) { const a = evById(id); if (a && !a._transparent) return a; } const e = TL() && TL().eventOf ? TL().eventOf("opiekunka") : null; return e && !(e._town && e._town.hidden) ? e : null; };
    const evOf = key => { if (key === "bohater") return $gamePlayer; if (key === "stefa") return stefaEv(); if (D.LOZKA[key]) return evById(evId(key)); const e = TL() && TL().eventOf ? TL().eventOf(ALIAS[key] || key) : null; return e && !(e._town && e._town.hidden) ? e : null; };
    function trzymaj(spec) {   // [key -> [x, y, d]] : the residents walk there and stand (TownLife hold)
        const L = TL();
        for (const [key, c] of Object.entries(spec)) { const rk = ALIAS[key] || key; if (L && L.hold && L.hold(rk, true, [c[0], c[1]])) scena.holds.push(rk); }
    }
    function zwolnij() { const L = TL(); for (const k of scena.holds) if (L && L.hold) L.hold(k, false); scena.holds = []; }
    const near = (c, n) => has() && dist($gamePlayer, c) <= n;
    // ---- S1: the street is shut (18:30-20:00 of the first day)
    function scenaS1() {
        const s = S();
        if (s.sc.s1 || !onMap(D.MAP.miasto) || busy()) return;
        s.sc.s1 = day();
        refreshZapora();
        const sol = evOf("soltys"), wit = evOf("wit");
        bars(true);
        trzymaj({ soltys: [94, 92, 4], wit: [93, 91, 4] });
        // the carts roll in from the east to their places (they are given their start 8 cells east and driven in)
        const carts = [4620, 4621].map(id => evById(id)).filter(Boolean);
        carts.forEach((a, i) => { const c = D.MIEJSCA.zapora[i]; a.locate(c[0] + 8, c[1]); showEv(a); a._gorMoving = true; a._gorGoal = c[0]; a.setMoveSpeed(3); a.setThrough(true); });
        graj([{ czekaj: 30, dzwiek: ["Bell3", 50, 80], mysl: tx1("s1.mysl") },
            { czekaj: 220, zrob: () => driveCarts() },
            { kto: sol, tekst: tx("s1.soltys")[0], czekaj: 200 },
            { kto: wit, tekst: tx("s1.soltys")[1], czekaj: 170 },
            { kto: wit, tekst: tx("s1.wit")[0], czekaj: 170, dzwiek: ["Bell3", 50, 70] },
            { czekaj: 150, dzwiek: ["Bell3", 45, 70] },
            { czekaj: 20, zrob: () => { bars(false); zwolnij(); carts.forEach(a => { a._gorMoving = false; a.setThrough(false); }); refreshZapora(); T.popup(tx1("napis.policyjna"), { top: true, color: "#ffd866" }); note("ulica"); w.autoChecks(); } }]);
    }
    function driveCarts() {
        const id = setInterval(() => {
            if (!has() || !onMap(D.MAP.miasto)) { clearInterval(id); return; }
            let moving = false;
            for (const cid of [4620, 4621]) { const a = evById(cid); if (a && a._gorMoving && a.x > a._gorGoal) { moving = true; if (!a.isMoving()) a.moveStraight(4); } }
            if (!moving) clearInterval(id);
        }, 80);
    }
    // ---- S2: the bell for Gaweł (the morning after his death, by the poorhouse)
    function scenaS2() {
        const s = S();
        if (s.sc.s2 || !s.gawelDead || !onMap(D.MAP.miasto) || busy()) return;
        const kl = evOf("kleofas"), st = evOf("stefa");
        if (!kl || !st || dist(kl, D.MIEJSCA.przytulekPrzed) > 4) return;
        s.sc.s2 = day();
        bars(true);
        graj([{ czekaj: 30, mysl: tx1("s2.mysl") },
            { kto: st, tekst: tx("s2.stefa")[0], czekaj: 190 },
            { kto: kl, tekst: tx("s2.kleofas")[0], czekaj: 220 },
            { czekaj: 40, dzwiek: ["Bell3", 70, 60] }, { czekaj: 240 },
            { czekaj: 10, zrob: () => { bars(false); zwolnij(); note("gawelDzwon"); } }]);
    }
    function s2Hold() {   // Kleofas comes to the poorhouse's door at 7:00 of the morning after
        const s = S(), L = TL();
        if (!s.gawelDead || s.sc.s2 || !L) return;
        const h = hour(), d = day();
        if (d === s.gawelDead + (hour() < 12 && s.gawelDead === s.start + 1 ? 0 : 0) && false) return;
        if (!s.sc.s2hold && abs(d, h) >= abs(s.start + 2, 5.5) && abs(d, h) < abs(s.start + 2, 12)) { s.sc.s2hold = d; L.hold("pustelnik", true, [98, 106]); scena.holds.push("pustelnik"); }
        if (s.sc.s2hold && abs(d, h) >= abs(s.start + 2, 12) && !s.sc.s2) { s.sc.s2 = d; zwolnij(); }
    }
    // ---- S3: the crowd at Ignac's tannery (17:00-20:00 of the chapter-3 day)
    function s3Hold() {
        const s = S(), L = TL();
        if (stepNow() !== 2 || s.s3 || rel() < 2 || !L) return;
        const a = abs(day(), hour());
        if (!s.sc.s3hold && a >= abs(day(), D.CZAS.s3) && hour() < D.CZAS.s3Do) { s.sc.s3hold = day(); trzymaj(TLUM_S3_MAP()); }
        if (s.sc.s3hold === day() && hour() >= D.CZAS.s3Do) { s.sc.s3hold = 0; zwolnij(); s.s3 = "nic"; applyS3("nic", true); }
    }
    const TLUM_S3_MAP = () => Object.assign({}, D.TLUM_S3);
    function scenaS3() {
        const s = S();
        if (s.s3 || s.sc.s3 || !onMap(D.MAP.miasto) || busy() || stepNow() !== 2 || !s.sc.s3hold) return;
        if (!near(D.MIEJSCA.garbarniaIgnaca, 9)) return;
        const sol = evOf("soltys"), ig = evOf("ignac"), kuba = evOf("kuba");
        if (!sol || !ig || dist(sol, D.MIEJSCA.garbarniaIgnaca) > 6) return;
        s.sc.s3 = day();
        bars(true);
        graj([{ czekaj: 20, mysl: tx1("s3.mysl") },
            { kto: sol, tekst: tx("s3.soltys")[0], czekaj: 170 },
            { kto: ig, tekst: tx("s3.ignac")[0], czekaj: 170 },
            { kto: sol, tekst: tx("s3.soltys")[1], czekaj: 160 },
            { kto: kuba, tekst: tx("s3.kuba")[0], czekaj: 160 },
            { czekaj: 10, zrob: () => s3Wybor() }]);
    }
    function s3Wybor() {
        const sp = spkOf("garbarz"), out = [];
        wybor(out, [tx1("s3.opcja.stoj"), tx1("s3.opcja.sprawdz"), tx1("s3.opcja.nic")], [skrypt([], "Goraczka.s3('stoj')"), skrypt([], "Goraczka.s3('sprawdz')"), skrypt([], "Goraczka.s3('nic')")], 2);
        later(out);
        void sp;
    }
    function applyS3(how, auto) {
        const s = S(), out = [], ig = spkOf("garbarz");
        let h = how;
        if (h === "stoj" && !(D.LISTA_PYTAN.every(k => s.lista[k]) || opiniaNow() >= D.OPINIA_PRZEPUSTKA)) { T.popup(tx1("napis.zaMaloDowodow"), { kind: "need" }); h = "sprawdz"; }
        s.s3 = h;
        if (h === "stoj") { linie(out, spkOf("soltys"), "s3.stoj.soltys"); linie(out, ig, "s3.stoj.ignac"); opinion(1, tx1("imie.ignac")); w.setFlag("gorIgnacRabat"); }
        if (h === "sprawdz") { linie(out, ig, "s3.sprawdz.ignac"); linie(out, spkOf("soltys"), "s3.sprawdz.soltys"); }
        if (h === "nic") {
            const L = TL(); if (L && L.setGone) L.setGone("garbarz", day() + 3);
            opinion(D.NAGRODY.strata.opinia, tx1("imie.ignac"));
            if (!auto) linie(out, spkOf("soltys"), "s3.nic.soltys");
            T.popup(tx1("napis.ignacZamkniety"), { top: true, color: "#ff9f8f" });
        }
        if (out.length && !auto) later(out);
        bars(false); zwolnij();
        note("s3_" + h);
        w.autoChecks();
    }
    // ---- S4: the meeting before the town hall (the day set after chapter 4, 15:00-17:00)
    function s4Hold() {
        const s = S(), L = TL();
        if (stepNow() !== 4 || !s.zebranie || s.koniec || !L) return;
        if (day() === s.zebranie && hour() >= D.CZAS.zebranie && hour() < D.CZAS.zebranieDo && !s.sc.s4hold) { s.sc.s4hold = day(); trzymaj(Object.assign({}, D.TLUM_S4, { wawrzyn: D.WAWRZYN_S4 })); }
    }
    function scenaS4() {
        const s = S();
        if (s.sc.s4 || s.koniec || !onMap(D.MAP.miasto) || busy() || stepNow() !== 4 || !s.sc.s4hold || !near(D.MIEJSCA.ratuszPrzed, 8)) return;
        const sol = evOf("soltys"), wa = evOf("wawrzyn"), lu = evOf("ludmila");
        if (!sol || !wa) return;
        s.sc.s4 = day();
        bars(true);
        graj([{ czekaj: 20, mysl: tx1("s4.mysl") },
            { kto: sol, tekst: tx("s4.soltys")[0], czekaj: 180 },
            { kto: lu, tekst: tx("s4.ludmila")[0], czekaj: 170 },
            { kto: wa, tekst: tx("s4.wawrzyn")[0], czekaj: 190 },
            { kto: sol, tekst: tx("s4.soltys")[1], czekaj: 160 },
            { czekaj: 10, zrob: () => s4Wybor() }]);
    }
    function s4Wybor() {
        const out = [];
        wybor(out, [tx1("s4.opcja.A"), tx1("s4.opcja.B"), tx1("s4.opcja.C")], [skrypt([], "Goraczka.wybor('A')"), skrypt([], "Goraczka.wybor('B')"), skrypt([], "Goraczka.wybor('C')")], 2);
        later(out);
    }
    // ---- the endings
    function rewards(r) { gold(r.zloto); opinion(r.opinia, tx1("zadania.W21.title")); if (r.xp) w.wykonaj([{ xp: r.xp }], { args: [] }); if (r.przychylnosc) T.call("Garnizon", "addFavor", r.przychylnosc); }
    function liczUratowanych() {
        const s = S();
        s.saved = 6 - (s.gawelDead ? 1 : 0) - (zbN() < 3 ? 1 : 0);
        for (const k of D.CHORZY) if (s.sick[k] === "c" || s.sick[k] === "u") s.sick[k] = "z";
        if (s.saved >= 6) opinion(1, tx1("imie.stefa")); else if (s.saved <= 4) opinion(-1, tx1("imie.stefa"));
        const pass = itemBy("przepustka"); if (pass && $gameParty.hasItem(pass)) $gameParty.loseItem(pass, $gameParty.numItems(pass), false);
        w.setFlag("gorBylo");
    }
    function wybor_(how) {
        const s = S(), out = [], sol = spkOf("soltys");
        if (s.koniec) return;
        zwolnij(); bars(false);
        if (how === "A") {
            s.koniec = "A"; s.koniecDzien = day(); rewards(D.NAGRODY.A); w.setFlag("gorKara");
            if (!campOut()) w.setFlag("gorKaraObozu");
            const L = TL(); if (L && L.setGone) L.setGone("wawrzyn", day() + 7);
            linie(out, sol, "wybor.A.soltys");
        } else if (how === "B") {
            s.koniec = "B"; s.koniecDzien = day(); s.osadnik = 0;
            linie(out, spkOf("wawrzyn"), "wybor.B.wawrzyn");
            w.setFlag("gorPomoc");
        } else { endC(false); return; }
        liczUratowanych();
        if (how === "B") { /* (the rewards of B come when the basin stands) */ }
        if (out.length) later(out);
        note("wybor_" + how);
        w.autoChecks();
    }
    function endC(auto) {
        const s = S(), out = [];
        s.koniec = "C"; s.koniecDzien = day(); rewards(D.NAGRODY.C); w.setFlag("gorMilczenie");
        const L = TL(); if (L && L.setGone) L.setGone("garbarz", day() + 7);
        liczUratowanych();
        zwolnij(); bars(false);
        T.popup(tx1("napis.milczenie"), { top: true, color: "#ff9f8f" });
        if (!auto) { linie(out, spkOf("soltys"), "wybor.C.soltys"); later(out); }
        note("wybor_C");
        w.autoChecks();
    }
    // B: the materials of the basin handed to Wawrzyn; two days later the basin stands
    const budowaLista = () => Object.values(D.BUDOWA).map(([id, n]) => n + "x " + ($dataItems[id] ? $dataItems[id].name : id)).join(", ");
    function osadnik() {
        const s = S();
        for (const [id, n] of Object.values(D.BUDOWA)) if (numItem(id) < n) { popupNeed(id, fill(tx1("napis.brakBudowy"), { n, a: $dataItems[id].name })); return; }
        for (const [id, n] of Object.values(D.BUDOWA)) lose(id, n);
        s.osadnik = 1; s.osadnikDzien = day();
        T.audio.se("Hammer", { volume: 70, pitch: 90 });
        const out = []; linie(out, spkOf("wawrzyn"), "wawrzyn.osadnikStart"); later(out);
        w.autoChecks();
    }
    function osadnikGotowy() {
        const s = S(); s.osadnikGotowy = day();
        rewards(D.NAGRODY.B); w.setFlag("gorOsadnik");
        T.popup(tx1("napis.osadnik"), { top: true, color: "#9ff0a8" });
        note("osadnik");
        w.autoChecks();
    }
    // ---- S5: the morning after the choice
    function scenaS5() {
        const s = S();
        if (!s.koniec || s.sc.s5 || !onMap(D.MAP.miasto) || busy()) return;
        if (s.koniec === "B" && !s.osadnikGotowy) return;
        if (day() <= s.koniecDzien || hour() < 6.3 || hour() > 11) return;
        const st = evOf("stefa"), wit = evOf("wit");
        if (!near(D.MIEJSCA.przytulekPrzed, 16) && !near([92, 92], 14)) return;
        s.sc.s5 = day();
        bars(true);
        graj([{ czekaj: 20, mysl: tx1("s5.mysl") },
            { czekaj: 40, zrob: () => { for (const id of [4620, 4621]) hide(evById(id)); } },
            { kto: wit, tekst: tx("s5.wit")[0], czekaj: 170 },
            { czekaj: 30, dzwiek: ["Bell3", 70, 60] },
            { kto: st, tekst: fill(tx("s5.stefa")[0], { n: s.saved }), czekaj: 220 },
            { czekaj: 10, zrob: () => { bars(false); refreshAll(); note("cisza"); w.autoChecks(); } }]);
    }

    // ==================================================================
    // 8. Injected events: the sick, the carts, the cauldron, the crust, the slab
    // ==================================================================
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    const page = (cmds, o) => Object.assign({ conditions: Object.assign({}, BLANK), directionFix: true, image: { tileId: 0, characterName: "", direction: 2, pattern: 0, characterIndex: 0 },
        list: cmds || [C(0, [])], moveFrequency: 3, moveRoute: { list: [C(0, [])], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 1,
        stepAnime: false, through: false, trigger: 0, walkAnime: false }, o || {});
    const img = (sheet, index, dir, pat) => ({ tileId: 0, characterName: sheet, direction: dir || 2, pattern: pat || 0, characterIndex: index || 0 });
    const script = code => [C(355, [code]), C(0, [])];
    T.inject([D.MAP.miasto, D.MAP.przytulek, D.MAP.podgrodzie], { ids: D.IDS, owner: D.OWNER, build: (data, mapId) => {
        const list = [];
        if (mapId === D.MAP.przytulek || mapId === D.MAP.podgrodzie) {   // (hidden until the thread shows them: refreshSick)
            D.CHORZY.forEach((k, i) => { const c = D.LOZKA[k]; list.push({ id: 4610 + i, name: "Chory: " + k, note: "", x: c[0], y: c[1],
                pages: [page(script("Goraczka.lozko(this, '" + k + "')"), { through: true, trigger: 0 })] }); });
        }
        if (mapId === D.MAP.miasto) {
            D.MIEJSCA.zapora.forEach((c, i) => list.push({ id: 4620 + i, name: "Wóz zapory", note: "<Occupy:right=1>", x: c[0], y: c[1],
                pages: [page(script("Goraczka.zapora(this)"), { image: img("!House_Town", 0, 4, 1), priorityType: 1, directionFix: true, through: true })] }));
            const k = D.MIEJSCA.kociol;
            list.push({ id: 4622, name: "Kocioł Stefy", note: "<Light:230,120,52,14>", x: k[0], y: k[1],
                pages: [page(script("Goraczka.kociol(this)"), { image: img("!Decoration", 2, 6, 0), stepAnime: true, through: true })] });
            const sp = D.MIEJSCA.stefa;
            list.push({ id: 4623, name: "Stefa (przytułek, dzień)", note: "", x: sp[0], y: sp[1], pages: [page(script("Goraczka.stefa(this)"), { image: img("$Npc_Opiekunka", 0, sp[2], 1), directionFix: false, through: true })] });
            D.MIEJSCA.osad.forEach((c, i) => list.push({ id: 4630 + i, name: "Biały osad w rynnie", note: "", x: c[0], y: c[1],
                pages: [page(script("Goraczka.osad(this, " + i + ")"), { image: img(D.SPRITES.osad, 0, 2, 0), priorityType: 0, through: true })] }));
            const p = D.MIEJSCA.plyta;
            list.push({ id: 4633, name: "Płyta rowu", note: "", x: p[0], y: p[1], pages: [page(script("Goraczka.plyta(this)"), { image: img(D.SPRITES.plyta, 0, 2, 0), priorityType: 0, through: true })] });
        }
        if (mapId === D.MAP.przytulek) { const sp = D.MIEJSCA.stefaWewnatrz; list.push({ id: 4624, name: "Stefa (przytułek, noc)", note: "", x: sp[0], y: sp[1], pages: [page(script("Goraczka.stefa(this)"), { image: img("$Npc_Opiekunka", 0, sp[2], 1), directionFix: false, through: true })] }); }
        return list;
    } });
    function stefa(interp) { const ev = interp && interp.eventId && $gameMap.event(interp.eventId()); T.talk.run(interp, "opiekunka", { ev, owner: PLUGIN }); }
    function zapora(interp) { if (stepNow() >= 0) popupOnce(interp.eventId(), tx1("napis.zapora")); }
    function kociol(interp) { popupOnce(interp.eventId(), tx1("napis.kociol")); }

    // the hidden-at-rest state of the injected actors (set at map start) and the refresh
    T.on("mapReady", () => {
        if (!has()) return;
        scena.kroki = []; scena.holds = []; lastMapReady = Graphics.frameCount;
        if (started()) dayTick();
        refreshAll();
    }, { owner: PLUGIN });

    // ==================================================================
    // 9. The clock
    // ==================================================================
    let tickN = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        try {
            if (busy()) scenaTick();
            if (++tickN % 30) return;
            if (!S().start) { if (w.active("W21") && otwarta()) begin(); return; }
            dayTick();
            if (busy() || $gameMessage.isBusy() || $gameMap.isEventRunning()) return;
            const m = $gameMap.mapId();
            const key = m + ":" + hour().toFixed(1) + ":" + sickN();
            if (key !== lastRefresh) { lastRefresh = key; refreshAll(); }
            if (m === D.MAP.miasto) {
                if (stepNow() === 0 && S().brew && !S().sc.s1) {
                    if (hour() >= D.CZAS.zapora && hour() < D.CZAS.godzinaPolicyjna && near(D.MIEJSCA.s1Kamera, 22)) scenaS1();
                    else if (hour() >= D.CZAS.godzinaPolicyjna) { S().sc.s1 = day(); refreshZapora(); w.autoChecks(); }
                }
                scenaS2(); s2Hold(); s3Hold(); scenaS3(); s4Hold(); scenaS4(); scenaS5();
            }
        } catch (e) { report("zegar", e); }
    }, { owner: PLUGIN, name: "goraczka" });

    // TownLife's conditions: Wawrzyn lives in the town from the start of the thread, Stefa by the town's poorhouse while the camp is inside
    (function warunki() {
        const L = TL();
        if (!L || !L.addCondition) return;
        L.addCondition("gorWawrzyn", () => has() && started());
    })();
    // Stefa of Podgrodzie goes to the town while the camp is inside the wall (her place there: two actors, below); back when it is over
    function stefaGone() {
        const L = TL();
        if (!L || !L.setGone) return;
        const want = started() && !campOut() && !S().koniec;
        if (want !== !!L.gone("opiekunka")) L.setGone("opiekunka", want);
    }
    // the hero's mild fever (a bad premium, Survival.defineBuff): the work costs more for 18 hours
    (function buff() {
        const SV = T.api("Survival");
        if (SV && SV.defineBuff) SV.defineBuff("goraczka", { name: tx1("buff.nazwa"), icon: 414, bad: true, desc: tx1("buff.opis"), cost: 1.3 });
        else if (SV && SV.BUFFS) SV.BUFFS.goraczka = { name: tx1("buff.nazwa"), icon: 414, bad: true, desc: tx1("buff.opis") };
    })();

    // ==================================================================
    // 10. Steps, the haki, F9
    // ==================================================================
    const wsp = { s1: () => !!S().sc.s1 };
    w.haki({
        otwarta: () => otwarta(),
        mowca,
        k1Gotowe: () => started() && !!S().brew && !!S().sc.s1,
        k2Gotowe: () => started() && zbN() >= 2 && servedN() >= 3 && rel() >= 1,
        k3Gotowe: () => started() && D.LISTA_PYTAN.every(k => S().lista[k]) && !!S().zapach && !!S().s3,
        k4Gotowe: () => started() && Object.keys(S().dowod).length >= 2 && !!S().wawrzyn,
        k5Gotowe: () => started() && !!S().koniec && !!S().sc.s5,
        k1Zmienne: () => ({ k1: !S().brew ? tx1("kroki.k1.start") : !S().sc.s1 ? tx1("kroki.k1.ulica") : tx1("kroki.k1.gotowe") }),
        k2Zmienne: () => ({ k2: fill(tx1("kroki.k2.tekst"), { zb: zbN(), n: servedN(), gawel: S().gawelDead ? tx1("kroki.k2.zmarl") : S().dose.gawel ? tx1("kroki.k2.gawelOk") : tx1("kroki.k2.gawelCzeka") }) }),
        k3Zmienne: () => ({ k3: fill(tx1("kroki.k3.tekst"), { lista: D.LISTA_PYTAN.filter(k => S().lista[k]).length, zapach: S().zapach ? tx1("kroki.k3.zapachTak") : tx1("kroki.k3.zapachNie"), s3: S().s3 ? tx1("kroki.k3.s3Tak") : tx1("kroki.k3.s3Nie") }) }),
        k4Zmienne: () => ({ k4: fill(tx1("kroki.k4.tekst"), { n: Object.keys(S().dowod).length, wawrzyn: S().wawrzyn ? tx1("kroki.k4.wTak") : tx1("kroki.k4.wNie") }) }),
        k5Zmienne: () => ({ k5: S().koniec ? fill(tx1("kroki.k5.po"), { wynik: tx1("kroki.k5." + S().koniec), n: S().saved }) : S().zebranie ? fill(tx1("kroki.k5.zebranie"), { dzien: S().zebranie }) : tx1("kroki.k5.start") }),
        wawrzynPodejscie: (ctx, how) => wawrzynPodejscie(how),
        f9Przygotuj: () => has(),
        f9Rozdzial: (ctx, n) => f9Rozdzial(n),
        f9Dzien: () => { const s = S(); if (!s.start) { s.start = day(); s.camp = flagOn("campOutside") ? "outside" : "inside"; for (const k of D.OD_POCZATKU) s.sick[k] = "c"; } $gameSystem._dayNightDay = day() + 1; $gameSystem.setDayNightHour(8.5); dayTick(); refreshAll(); return { say: "Dzień +1" }; },
        f9Chorzy: () => { const s = S(); for (const k of D.CHORZY) if (!s.sick[k]) s.sick[k] = "c"; refreshAll(); return { say: "Wszyscy chorzy leżą" }; },
        f9WynikA: () => f9Wynik("A"), f9WynikB: () => f9Wynik("B"), f9WynikC: () => f9Wynik("C"),
        f9Zeruj: () => { const st = S(); for (const k of Object.keys(st)) delete st[k]; Object.assign(st, D.domyslne()); refreshAll(); return { say: "Wątek wyzerowany" }; }
    });
    function f9Rozdzial(n) {
        const s = S();
        if (!s.start) { s.start = day() - (n - 1) * 2; s.camp = flagOn("campOutside") ? "outside" : "inside"; }
        for (const k of D.CHORZY) if (!s.sick[k]) s.sick[k] = "c";
        if (n >= 2) { s.brew = s.start; s.sick.szymek = "u"; s.sc.s1 = s.start; s.pass = 1; }
        if (n >= 3) { s.zb = { jadwiga: day(), kleofas: day() }; s.dose.stas = "oklad"; s.dose.gawel = "wywar"; s.dose.mila = "oklad"; s.sick.stas = s.sick.gawel = s.sick.mila = "u"; }
        if (n >= 4) { for (const k of D.LISTA_PYTAN) s.lista[k] = day(); s.zapach = day(); s.s3 = "sprawdz"; }
        if (n >= 5) { s.dowod = { osad: day(), plyta: day() }; s.wawrzyn = "spokojnie"; s.zebranie = day(); }
        refreshAll(); w.autoChecks();
        return true;
    }
    function f9Wynik(k) { const s = S(); if (!s.start) f9Rozdzial(5); s.sc.s4 = day(); wybor_(k); if (k === "B") { s.osadnik = 1; s.osadnikDzien = day() - 3; } s.koniecDzien = day() - 1; return { say: "Wynik " + k }; }

    // ---- the actions of the scripts (Goraczka.akcja)
    const AKCJE = { ignacRada, uciekl, zapach, sprobuj, dowod: (k) => dowod(null, k), sloik, kopanie, pouczenie, met: () => { S().met = day(); } };
    function akcja(name, ...args) { const f = AKCJE[name]; if (f) f(...args); }

    window.Goraczka = T.register(PLUGIN, {
        stan: () => S(), stefa, akcja, wywar, jakChorzy, lozko, dawka, zbiorka, pytanie, wawrzynPodejscie, beczka, osad, plyta, drzwiPrzytulek, inna, zapora, kociol, osadnik,
        s3: how => applyS3(how), wybor: how => wybor_(how), begin, dayTick, refreshAll, scenaS1, scenaS2, scenaS3, scenaS4, scenaS5, stepNow, sickN, sickState, zbN, servedN,
        hospital, otwarta, trzymaj, zwolnij, busy, endC, osadnikGotowy, f9Rozdzial, itemBy, watek: w
    });
})();
