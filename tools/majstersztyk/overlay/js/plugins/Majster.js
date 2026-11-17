//=============================================================================
// Majster.js
//=============================================================================
// The thread W22 "Majstersztyk" (docs/zadania_nowe/majstersztyk.md, 2026-11-11) - the ENGINE; the data: Majster_Data.js, the words:
// js/teksty/majster.txt, the interior: Map215 "Cech" (tools/majstersztyk/build_cech.py). What the data cannot do:
//   - the ranks (0-4): the poreka (a master's word - an option in his talk), the entry (20 G), the trial shelf of the Cech (the pieces
//     leave the bag, the guild looks at them "in the daylight" - the next morning from 7), the oath, the guard's order (a board, Wit,
//     the dispute with Ludwik), the choice of the trade, the trial piece, the sabotage (once: the piece on the shelf is found cracked),
//     the three clues (wet coal, the print in the ash, Jas), the night in the workshop (22-24, optional: Ludwik with a vial), the exam
//   - the pieces must be WHOLE and UNUSED (Durability.used(id) == 0 for every id the bag counts), right materials = right ids
//   - the exam on the market (Map008, a market day from 3 days after rank III, 12-15): a tribune of events (Tawerna.inject), the
//     commission and a few residents held on the square (TownLife.hold), the hero's pieces checked, the evidence offered, the mini-game
//     "Ostatnie szlify" (arrows, 3 rounds, never fails - only a grade), the four endings (honest master, exposed rival, two masters,
//     Ludwik wins - a retake after 14 days), the rewards, the Hammer of the master (an item <Majster:mlotek>: forge time -15%, tools last longer)
//   - the board's weekly orders after rank II (at most two a week), Ludwik's ferry (day 19), the door (open 8-17 once the poreka is
//     given), the guild's night actors (Ludwik with a lamp, Ostap) as events of the injected range
// API: window.Majster (Tawerna.api("Majster")): stan(), polka(), tablica(), slad(k), drzwi(ev), szlify(), wynik(...), debug*.
// Not built (said in the report): the apron overlays of Ubior, the "Cech:" row of the Postac screen, the guild's own workshop stations
// (the hero uses his own), the crowd picture of the market (the residents on the square stand in), Jas guarding the shelf the night
// before the exam (the second sabotage), the two pails for the Przytulek.

/*:
 * @target MZ
 * @plugindesc [W22] Wątek „Majstersztyk” - silnik: Cech (Map215), rangi, półka próbna, sabotaż, egzamin na rynku, mini-gra szlifów, Młotek majstra. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Majster_Data
 * @base TownLife
 * @base TawernaUI
 * @orderAfter Dezerter
 *
 * @help
 * ============================================================================
 * Majster.js - wątek W22 „Majstersztyk”
 * ============================================================================
 * Poręka mistrza (Tadek, Ignac albo Leon - opcja w rozmowie), wpisowe 20 G
 * u Ostapa w Cechu (8-17), trzy sztuki na półce próbnej, zamówienie straży,
 * sztuka próbna, egzamin na rynku w dzień targowy.
 * F9 → „Wyspa i fabuła” → „Wątek W22”: stan wątku, Ludwik, sabotaż, egzamin.
 * W skryptach: Majster.stan(), Majster.ranga(), Majster.debugGo(n).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.MajsterData;
    if (!T || !window.Watki || !D) throw new Error("Majster.js: brak TawernaCore.js / Watki.js / Majster_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Majster";
    const w = D.watek, TX = D.TX, fill = Watki.wstaw, C = Watki.mowa.C;
    const S = () => w.S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap && !!window.$gameParty;
    const TL = () => T.api("TownLife");
    const TQ = () => T.api("TownQuests");
    const SB = () => T.api("SpeechBubbles");
    const tx = k => w.tekst(k);
    const tx1 = k => { const v = w.tekst(k); return Array.isArray(v) ? v[0] : v; };
    const report = (where, e) => console.error("[Majster] " + where + ":", e);
    const COIN = 314;
    const inHours = (h, a) => h >= a[0] && h < a[1];
    const api = { opts: null };   // (the tests: { ocena: 0-2 } - the grade of the mini-game forced)

    // ==================================================================
    // 1. Items: whole and unused, the lists of the ranks
    // ==================================================================
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) && has() ? $gameParty.numItems(item(id)) : 0);
    const itemName = id => (item(id) ? item(id).name : "#" + id);
    const du = () => window.Durability || null;
    const used = id => { const d = du(); try { return !!(d && d.TOOLS && d.TOOLS[id] && d.used(id) > 0); } catch (e) { return false; } };
    function lista(etap, fach) {
        const z = D.SZTUKI[etap];
        if (!z) return [];
        return Array.isArray(z) ? z : (z[fach || S().fach] || []);
    }
    function listaText(l) { return l.map(([id, n]) => itemName(id) + (n > 1 ? " ×" + n : "")).join(", "); }
    // the check: every piece in the bag and none worn; { ok, brak: [names], uzyte: [names] }
    function sprawdz(l) {
        const brak = [], uzyte = [];
        for (const [id, n] of l) {
            if (count(id) < n) brak.push(itemName(id) + (n > 1 ? " ×" + n : ""));
            else if (used(id)) uzyte.push(itemName(id));
        }
        return { ok: !brak.length && !uzyte.length, brak, uzyte };
    }
    function zabierz(l) { for (const [id, n] of l) if (item(id)) $gameParty.loseItem(item(id), n, false); }
    function mlotekItem() { return window.$dataItems ? $dataItems.find(i => i && /<Majster:mlotek>/.test(i.note || "")) || null : null; }
    function zlato(n) {
        if (!(n > 0) || !has()) return;
        $gameParty.gainGold(n);
        T.popup(fill(tx("napis.zloto"), { n }), { icon: COIN, kind: "gold" });
    }
    const opinia = n => T.call("TownQuests", "addOpinion", n, tx("zadania.W22.title"));
    const xp = n => T.call("Combat", "gainXp", n, tx("zadania.W22.title"), true);
    const opiniaNow = () => { try { return TQ().state().opinion || 0; } catch (e) { return 0; } };

    // ==================================================================
    // 2. State, days, who is on the island
    // ==================================================================
    const ludwikJest = () => { if (!has()) return false; const l = S().ludwik; return !!l.przyjazd && !l.odplynal && (day() > l.przyjazd || (day() === l.przyjazd && hour() >= 12)); };
    const targ = d => { const q = TQ(); try { return q && q.isMarket ? !!q.isMarket(d) : d % 7 === 0; } catch (e) { return d % 7 === 0; } };
    const nextMarket = d => { let k = d; while (!targ(k) && k < d + 14) k++; return k; };
    const egzDzien = () => (has() && S().egz.dzien ? S().egz.dzien : 0);
    const egzDzis = () => has() && !!egzDzien() && egzDzien() === day() && (S().koniec === 0 || (S().koniec === 4 && !!S().egz.poprawka && day() >= S().egz.poprawka));
    const egzTeraz = () => egzDzis() && inHours(hour(), D.CZAS.egzGodziny);
    const dowody = () => { const s = S(); return (s.slady.wegiel ? 1 : 0) + (s.slady.odcisk ? 1 : 0) + (s.slady.swiadek ? 1 : 0) + (s.sab.noc === 2 || s.sab.noc === 3 ? 2 : s.sab.noc === 1 ? 1 : 0); };
    const odswiez = () => { const q = TQ(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const sprawdzQ = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); odswiez(); };
    const note = key => { const p = w.pair(key); if (p) T.call("Journal", "addNote", p[0], p[1]); };
    const spkOf = key => { const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null; return { id: ev ? ev.eventId() : -1, name: w.tekstMoze(key + ".imie") || "" }; };
    const dayAt = (d, h) => d + h / 24;
    // the rank as a word
    const rangaSlowo = n => tx("rangi." + n);

    // ==================================================================
    // 3. Commands of the talks: lines, choices, script calls
    // ==================================================================
    const linie = (out, sp, key, vars) => w.linie(out, sp, key, vars);
    const skrypt = (out, code) => Watki.mowa.script(out, code);
    const wybor = (out, labels, branches, cancel) => Watki.mowa.choiceTo(out, labels, branches, cancel);
    const bran = (sp, key, vars, code) => { const o = []; if (key) linie(o, sp, key, vars); if (code) skrypt(o, code); return o; };
    const uruchom = (interp, list) => Watki.mowa.uruchom(interp || null, list);
    const stop = interp => { if (interp && interp._list) interp._index = interp._list.length; };
    const popupInfo = text => T.popup(text, { color: "info" });

    // ==================================================================
    // 4. The ranks: actions of the talks (called by script commands: Majster.akcja)
    // ==================================================================
    function rangaNadaj(n) {
        const s = S();
        if (s.ranga >= n) return;
        s.ranga = n;
        T.popup(fill(tx("napis.ranga"), { ranga: rangaSlowo(n) }), { top: true, color: "#ffe27a" });
        const z = { 1: D.ZAPLATA.r1, 3: D.ZAPLATA.r3 }[n];
        if (z) zlato(z);
        xp(D.XP["r" + n] || 0);
        if (n === 1) note("notatki.czeladnik");
        if (n === 2) note("notatki.starszy");
        if (n === 3) { s.egz.ranga3 = day(); s.egz.dzien = nextMarket(day() + D.CZAS.egzamin); note("notatki.podmistrz"); }
        sprawdzQ();
    }
    const akcje = {
        wpisowe() {
            const s = S();
            if ($gameParty.gold() < D.START.wpisowe) return;
            $gameParty.loseGold(D.START.wpisowe);
            T.popup(tx("napis.wpisowe"), { icon: COIN, kind: "gold" });
            s.wpisowe = day();
            sprawdzQ();
        },
        ranga(n) { rangaNadaj(Number(n)); },
        fach(f) { const s = S(); s.fach = f; s.polka = null; sprawdzQ(); },
        zam2() {
            const s = S(), l = lista(2);
            if (!sprawdz(l).ok) return;
            zabierz(l);
            s.zam.dostarczono = day();
            s.zam.wynik = s.zam.wynik === "spoznione" ? "ostap" : s.zam.wynik;
            zlato(D.ZAPLATA.r2Polowa);
            sprawdzQ();
        },
        straz(wariant) {
            const s = S(), l = lista(2);
            if (!sprawdz(l).ok) return;
            zabierz(l);
            s.zam.dostarczono = day();
            s.zam.spor = 1;
            const g = { taniej: D.ZAPLATA.r2Taniej, lepiej: D.ZAPLATA.r2Lepiej, polowa: D.ZAPLATA.r2Polowa, plain: D.ZAPLATA.r2 }[wariant] || D.ZAPLATA.r2;
            s.zam.wynik = wariant;
            zlato(g);
            if (wariant === "razem") opinia(2);
            T.call("Garnizon", "addFavor", D.PRZYCHYLNOSC.garnizon);
            sprawdzQ();
        },
        dowody(v) { S().egz.dowody = v ? 1 : 0; },
        noc(n) {
            const s = S();
            s.sab.noc = Number(n);
            T.popup(fill(tx("napis.dowod"), { n: Math.min(3, dowody()) }), { top: true, color: "#ffe27a" });
            nocKoniec();
            sprawdzQ();
        },
        szlify() { szlify(); },
        koniec(n) { zakoncz(Number(n)); },
        wsk() { S().wsk = 1; },
        slad(k) { slad(k); }
    };
    // a script command of a talk: Majster.akcja("ranga", 1)
    function akcja(nazwa, ...args) {
        try { if (akcje[nazwa]) akcje[nazwa](...args); } catch (e) { report("akcja " + nazwa, e); }
    }

    // ==================================================================
    // 5. The trial shelf of the Cech (Map215), the clues, the board
    // ==================================================================
    // which pieces the shelf takes now: rank 0 - the three hands (etap 1); rank 2 with a trade - the trial piece (etap 3)
    function polkaCel() {
        const s = S();
        if (s.ranga === 0 && s.wpisowe) return { etap: 1, l: lista(1) };
        if (s.ranga === 2 && s.fach && s.zam.dostarczono) return { etap: 3, l: lista(3) };
        return null;
    }
    // the morning check: the pieces on the shelf were looked at in the daylight (from 7 the next day); the sabotage happens ONCE (rank 2,
    // Ludwik on the island): the cracked piece is lost
    const polkaRano = () => { const p = S().polka; return !!p && ((day() > p.dzien && hour() >= D.CZAS.polkaRano) || day() > p.dzien + 1); };
    function rano() {
        if (!has()) return;
        const s = S(), p = s.polka;
        if (!p || !polkaRano()) return;
        if (p.etap === 3 && s.sab.stan === 0 && ludwikJest()) {
            s.polka = null;
            s.sab.stan = 1; s.sab.dzien = day(); s.sab.scena = 1;
            note("notatki.sabotaz");
            sprawdzQ();
        }
    }
    function polka(interp) {
        if (!has()) return;
        rano();
        const s = S(), out = [], hero = Watki.mowa.HERO, cel = polkaCel(), p = s.polka;
        if (!s.poreka || !s.wpisowe || !cel && !p) { popupInfo(tx1("ostap.polkaPusta") || "Półka próbna"); return; }
        if (p) {
            popupInfo(tx1(polkaRano() ? "polka.rano" : "polka.czeka"));
            return;
        }
        const r = sprawdz(cel.l);
        if (r.ok) {
            wybor(out, [fill(tx1("polka.zloz"), { l: listaText(cel.l) }), tx1("polka.zostaw")], [bran(hero, null, null, "Majster.polkaZloz(" + cel.etap + ")"), []], 1);
            uruchom(interp, out);
        } else {
            const o = [];
            const parts = [];
            if (r.brak.length) parts.push(fill(tx1("polka.brak"), { l: r.brak.join(", ") }));
            if (r.uzyte.length) parts.push(fill(tx1("polka.uzyte"), { l: r.uzyte.join(", ") }));
            popupInfo(parts.join(" "));
        }
    }
    function polkaZloz(etap) {
        const s = S(), cel = polkaCel();
        if (!cel || cel.etap !== etap || !sprawdz(cel.l).ok) return;
        zabierz(cel.l);
        s.polka = { etap, dzien: day(), godz: hour() };
        T.popup(tx("napis.polka"), { top: true, color: "#ffe27a" });
        T.audio.se("Equip1", { volume: 70, pitch: 100 });
        sprawdzQ();
    }
    function slad(k) {
        if (!has()) return;
        const s = S();
        if (!s.sab.stan) { popupInfo(tx1("slad.brak")); return; }
        if (s.slady[k]) { popupInfo(tx1("slad.juz")); return; }
        s.slady[k] = 1;
        const out = []; linie(out, Watki.mowa.HERO, "slad." + k);
        uruchom(null, out);
        T.popup(fill(tx("napis.dowod"), { n: Math.min(3, dowody()) }), { top: true, color: "#ffe27a" });
        sprawdzQ();
    }
    // the board: the rank shown, the guard's order, the weekly orders
    function tablica(interp) {
        if (!has()) return;
        const s = S(), out = [], hero = Watki.mowa.HERO;
        if (s.ranga < 1) { popupInfo(tx1("tablica.brakRangi")); return; }
        const stan = fill(tx1("tablica.stan"), { ranga: rangaSlowo(s.ranga), rangaL: ludwikJest() ? rangaSlowo(Math.min(2, s.ranga + 1)) : "-", wolne: tablicaWolne() });
        Watki.mowa.plain(out, tx1("tablica.naglowek"), [stan], { spk: -1 });
        if (s.ranga === 1 && day() >= D.CZAS.zamowienieOd && !s.zam.wzieto) {
            linie(out, hero, "tablica.straz");
            wybor(out, [tx1("tablica.opcjaBiore"), tx1("tablica.opcjaNie")], [bran(hero, null, null, "Majster.zamWez()"), []], 1);
        } else if (s.ranga === 1 && s.zam.wzieto && !s.zam.dostarczono) {
            linie(out, hero, "tablica.strazJest", { termin: s.zam.termin });
        } else if (s.ranga >= 2 && tablicaWolne() > 0) {
            const z = tablicaZlecenie();
            if (z) {
                linie(out, hero, "tablica.zlecenie", { nazwa: itemName(z[0]), zaplata: z[1] });
                const lab = fill(tx1("tablica.opcjaOddaj"), { nazwa: itemName(z[0]) });
                wybor(out, [lab, tx1("tablica.opcjaZostaw")], [bran(hero, null, null, "Majster.zlecenieOddaj()"), []], 1);
            } else linie(out, hero, "tablica.nic");
        }
        uruchom(interp, out);
    }
    const tydzien = () => Math.floor((day() - 1) / 7);
    function tablicaWolne() { const s = S(); if (s.ranga < 2) return 0; if (s.tab.tydz !== tydzien()) return D.TABLICA.tydzien; return Math.max(0, D.TABLICA.tydzien - s.tab.n); }
    function tablicaZlecenie() { const pula = D.TABLICA.pula; const i = (tydzien() * 2 + S().tab.n) % pula.length; return pula[i]; }
    function zamWez() {
        const s = S();
        if (s.zam.wzieto) return;
        s.zam.wzieto = day(); s.zam.termin = day() + D.CZAS.zamowienie;
        const out = []; linie(out, Watki.mowa.HERO, "tablica.wziete", { termin: s.zam.termin }); uruchom(null, out);
        sprawdzQ();
    }
    function zlecenieOddaj() {
        const s = S(), z = tablicaZlecenie();
        if (!z || tablicaWolne() < 1) return;
        const r = sprawdz([[z[0], 1]]);
        if (!r.ok) { popupInfo(fill(tx1("tablica.zlecenieBrak"), { nazwa: itemName(z[0]) })); return; }
        zabierz([[z[0], 1]]);
        if (s.tab.tydz !== tydzien()) { s.tab.tydz = tydzien(); s.tab.n = 0; }
        s.tab.n++;
        zlato(z[1]);
        T.call("QuestBoard", "addRep", 1);
    }

    // ==================================================================
    // 6. The door of the Cech (Map008, event 194)
    // ==================================================================
    const drzwiOtwarte = () => has() && !!S().poreka && inHours(hour(), D.DRZWI.godziny);
    function drzwiZamkniete(eventId) {
        const t = $gameTemp, k = eventId || 194;
        t._budDoorPop = t._budDoorPop || {};
        if (t._budDoorPop[k] > Graphics.frameCount - 60) return;
        t._budDoorPop[k] = Graphics.frameCount;
        T.popup(S().poreka ? tx("napis.zamkniety") : tx("napis.obraduja"), { color: "info" });
    }

    // ==================================================================
    // 7. Ostap, Ludwik, Jas, the masters (talks)
    // ==================================================================
    function ostapRozmowa() {
        rano();
        const s = S(), out = [], sp = spkOf("ostap"), hero = Watki.mowa.HERO, e = egzTeraz();
        if (e && $gameMap.mapId() === D.MAP.miasto && s.ranga === 3) return egzaminRozmowa(out, sp);
        if (!s.poreka) { linie(out, sp, "ostap.nikt"); return out; }
        if (!s.wpisowe) {
            linie(out, sp, "ostap.poreka.pyta");
            if ($gameParty.gold() >= D.START.wpisowe) {
                wybor(out, [fill(tx1("ostap.wpisowe.tak"), { n: D.START.wpisowe }), tx1("ostap.wpisowe.nie")],
                    [bran(sp, "ostap.poreka.tak", null, "Majster.akcja('wpisowe')"), []], 1);
            } else linie(out, sp, "ostap.poreka.nie");
            return out;
        }
        if (s.ranga === 0) {
            if (!s.polka) { linie(out, sp, "ostap.trzyPusto"); return out; }
            if (!polkaRano()) { linie(out, sp, "ostap.rano"); return out; }
            linie(out, sp, "ostap.sztukiLeza"); linie(out, sp, "ostap.przysiega");
            skrypt(out, "Majster.oath()");
            skrypt(out, "Majster.akcja('ranga', 1)");
            s.polka = null;
            return out;
        }
        if (s.ranga === 1) {
            if (s.zam.doOstapa && !s.zam.dostarczono) {
                linie(out, sp, "ostap.ostapaOdbior");
                if (sprawdz(lista(2)).ok) wybor(out, [tx1("polka.zloz2"), tx1("polka.zostaw")], [bran(sp, null, null, "Majster.akcja('zam2')"), []], 1);
                return out;
            }
            if (s.zam.dostarczono) { linie(out, sp, "ostap.starszy"); skrypt(out, "Majster.akcja('ranga', 2)"); return out; }
            linie(out, sp, s.zam.wzieto ? "ostap.zamowienie" : "ostap.czeladnik");
            return out;
        }
        if (s.ranga === 2) {
            if (!s.fach) {
                linie(out, sp, "ostap.wybierzFach");
                wybor(out, [tx("fach.kowal"), tx("fach.garbarz"), tx("fach.ciesla")], [
                    bran(sp, "ostap.fachKowal", null, "Majster.akcja('fach','kowal')"), bran(sp, "ostap.fachGarbarz", null, "Majster.akcja('fach','garbarz')"),
                    bran(sp, "ostap.fachCiesla", null, "Majster.akcja('fach','ciesla')")], 0);
                return out;
            }
            if (s.polka && polkaRano()) { linie(out, sp, "ostap.podmistrz"); skrypt(out, "Majster.akcja('ranga', 3)"); s.polka = null; return out; }
            if (s.polka) { linie(out, sp, "ostap.polkaLezy"); return out; }
            if (s.sab.stan === 1) {
                linie(out, sp, "ostap.sabotaz");
                if (!s.sab.zwrot) { s.sab.zwrot = 1; linie(out, sp, "ostap.sabotazZwrot"); skrypt(out, "$gameParty.gainItem($dataItems[86], 1); Tawerna.popup('+1 ' + $dataItems[86].name, { icon: $dataItems[86].iconIndex });"); }
                return out;
            }
            linie(out, sp, "ostap.fachPrzed");
            return out;
        }
        if (s.ranga === 3 && !s.koniec) {
            linie(out, sp, egzDzis() ? "ostap.egzaminDzis" : "ostap.egzaminDzien", { dzien: egzDzien(), lista: listaText(egzLista()) });
            return out;
        }
        if (s.koniec === 4) {
            linie(out, sp, "ostap.egzaminDzien", { dzien: egzDzien(), lista: listaText(egzLista()) });
            return out;
        }
        if (s.koniec && !s.mlotek) { linie(out, sp, "ostap.mlotek"); skrypt(out, "Majster.mlotekDaj()"); return out; }
        linie(out, sp, "ostap.poEgzaminie");
        return out;
    }
    function ludwikRozmowa() {
        const s = S(), out = [], sp = spkOf("ludwik");
        const key = s.koniec === 2 ? "ludwik.zdemaskowany" : s.koniec === 4 ? "ludwik.wygral" : s.koniec === 3 ? "ludwik.zostal" : s.koniec === 1 ? "ludwik.mistrz"
            : s.sab.stan && s.sab.noc < 2 ? "ludwik.sabotazPotem" : s.ranga >= 2 ? "ludwik.potem" : "ludwik.dzien";
        linie(out, sp, key);
        return out;
    }
    function jasRozmowa() {
        const s = S(), out = [], sp = spkOf("jas"), hero = Watki.mowa.HERO;
        if (s.sab.stan && !s.slady.swiadek) {
            if (s.sab.stan === 1) { linie(out, sp, "jas.widzial"); skrypt(out, "Majster.slad('swiadek')"); }
            else linie(out, sp, "jas.nie");
        } else linie(out, sp, s.slady.swiadek ? "jas.juz" : "jas.dzien");
        return out;
    }
    T.talk.takeover({ owner: PLUGIN, who: "ostap", name: "ostap", priority: T.talk.PRIORITY.owner, run: () => { try { return ostapRozmowa(); } catch (e) { report("Ostap", e); return null; } } });
    T.talk.takeover({ owner: PLUGIN, who: "ludwik", name: "ludwik", priority: T.talk.PRIORITY.owner, run: () => { try { return ludwikRozmowa(); } catch (e) { report("Ludwik", e); return null; } } });
    T.talk.takeover({ owner: PLUGIN, who: "jas", name: "jas", priority: T.talk.PRIORITY.owner, run: () => { try { return jasRozmowa(); } catch (e) { report("Jas", e); return null; } } });
    // the masters' talk: the word for the guild, the lesson for the exam
    const START_OK = () => has() && day() >= D.START.dzien && opiniaNow() >= D.START.opinia && zelazo();
    // an iron thing the hero made (in the bag): any iron / steel / "okute" weapon, armour or tool of Bron_Data
    function zelazo() {
        const B = window.BronData;
        try {
            for (const it of $dataItems) {
                if (!it || it.id < 300 || !$gameParty.numItems(it)) continue;
                const p = B && B.przedmiot ? B.przedmiot(it.id) : null;
                if (p && /zelazo|stal|okute|braz/.test(String(p.material || ""))) return true;
            }
        } catch (e) { /* (no Bron data) */ }
        return [115, 116, 118, 87, 144, 91].some(id => count(id) > 0);   // (an iron axe / pick / saw / can / tongs / knife)
    }
    // the masters (Tadek, Ignac, Leon): a takeover first in their talk while there is something to ask - "Nie, w innej sprawie" lets the rest speak
    const MISTRZOWIE = ["kowal", "garbarz", "ciesla"];
    function mistrzRozmowa(key) {
        if (!has() || S().koniec) return null;
        const s = S(), out = [], sp = spkOf(key);
        let co = "";
        if (!s.poreka && s.ranga === 0 && !w.active("W22") && START_OK()) co = "poreka";
        else if (s.fach === key && s.ranga >= 2 && !s.wsk) co = "wskazowka";
        if (!co) return null;
        wybor(out, [tx1("opcja." + co), tx1("opcja.inna")], [skrypt([], "Majster.mistrz(this, '" + key + "', '" + co + "')"), skrypt([], "Majster.inna(this, '" + key + "')")], 1);
        return out;
    }
    function mistrz(interp, key, co) {
        const sp = spkOf(key), out = [];
        if (co === "poreka") { linie(out, sp, "poreka." + key); skrypt(out, "Majster.poreka('" + key + "')"); }
        else { linie(out, sp, "wskazowka." + key); skrypt(out, "Majster.akcja('wsk')"); }
        uruchom(interp, out);
    }
    function inna(interp, key) {
        const ev = interp && interp.eventId && $gameMap.event(interp.eventId());
        T.talk.run(interp, key, { ev, owner: PLUGIN, skip: PLUGIN });
    }
    for (const key of MISTRZOWIE) T.talk.takeover({ owner: PLUGIN, who: key, name: "mistrz", priority: T.talk.PRIORITY.errand, run: () => { try { return mistrzRozmowa(key); } catch (e) { report("mistrz", e); return null; } } });
    function poreka(fach) {
        const s = S();
        if (s.poreka) return;
        s.poreka = fach;
        sprawdzQ();
    }
    // Wit (the guard's order): the set delivered; the dispute with Ludwik (the first time)
    // Wit (the guard's order): while the order is on the hero's hands - the set delivered; the dispute with Ludwik (the first time)
    function witRozmowa() {
        if (!has()) return null;
        const s = S();
        if (!(s.ranga === 1 && s.zam.wzieto && !s.zam.dostarczono && !s.zam.doOstapa)) return null;
        const out = [];
        wybor(out, [tx1("wit.opcja"), tx1("opcja.inna")], [skrypt([], "Majster.witKomplet(this)"), skrypt([], "Majster.inna(this, 'kapral')")], 1);
        return out;
    }
    function witKomplet(interp) {
        const s = S(), sp = spkOf("kapral"), out = [];
        sp.name = tx1("wit.imie");
        if (day() > s.zam.termin) { linie(out, sp, "wit.spoznione"); skrypt(out, "Majster.zamSpoznione()"); }
        else if (!sprawdz(lista(2)).ok) linie(out, sp, "wit.brak");
        else if (ludwikJest()) {
            linie(out, sp, "wit.spor");
            const lepiej = opiniaNow() >= 30;
            wybor(out, [tx1("wit.opcjaTaniej"), tx1("wit.opcjaLepiej"), tx1("wit.opcjaRazem")], [
                bran(sp, "wit.taniej", null, "Majster.akcja('straz','taniej')"),
                bran(sp, lepiej ? "wit.lepiejTak" : "wit.lepiejNie", null, "Majster.akcja('straz','" + (lepiej ? "lepiej" : "polowa") + "')"),
                bran(sp, "wit.razem", null, "Majster.akcja('straz','razem')")], 0);
        } else { linie(out, sp, "wit.tak"); skrypt(out, "Majster.akcja('straz','plain')"); }
        uruchom(interp, out);
    }
    T.talk.takeover({ owner: PLUGIN, who: "kapral", name: "wit", priority: T.talk.PRIORITY.errand, run: () => { try { return witRozmowa(); } catch (e) { report("Wit", e); return null; } } });
    function zamSpoznione() { const s = S(); s.zam.wynik = "spoznione"; s.zam.doOstapa = 1; sprawdzQ(); }
    function oath() {
        T.audio.se("Hammer", { volume: 80, pitch: 90 });
        let n = 0;
        const t = setInterval(() => { if (++n >= 3) { clearInterval(t); return; } try { T.audio.se("Hammer", { volume: 80, pitch: 90 }); } catch (e) { /* ignore */ } }, 450);
    }
    function mlotekDaj() {
        const s = S(), it = mlotekItem();
        if (s.mlotek) return;
        s.mlotek = 1;
        if (it) { $gameParty.gainItem(it, 1); T.popup(tx("napis.mlotek"), { icon: it.iconIndex, top: true, color: "#ffe27a" }); }
        else report("młotek", "brak przedmiotu <Majster:mlotek> (instalator)");
    }

    // ==================================================================
    // 8. Ludwik's ferry (day 19), the sabotage morning, the night in the workshop
    // ==================================================================
    function zegar() {
        if (!has()) return;
        const s = S();
        if (s.ranga >= 1 && !s.ludwik.przyjazd && day() >= D.CZAS.ludwik) { s.ludwik.przyjazd = day(); note("notatki.ludwik"); }
        if (s.ludwik.przyjazd && !s.scenyZrobione.przyjazd && ludwikJest()) {
            s.scenyZrobione.przyjazd = 1;
            T.popup(tx("napis.ludwik"), { top: true, color: "#ffe27a" });
            const L = TL(), ev = L && L.eventOf ? L.eventOf("ludwik") : null;
            if (ev && $gameMap.mapId() === D.MAP.miasto && SB() && SB().say) { SB().say(ev, tx1("ludwik.przyjazd"), 200); w.mysl([tx1("ludwik.przyjazdBohater")]); }
        }
        rano();
        egzaminTick();
    }
    // the morning scene (the hero in the Cech, the cracked piece): once
    function sabotazScena() {
        const s = S();
        if (!s.sab.scena || $gameMap.mapId() !== D.MAP.cech) return;
        s.sab.scena = 0;
        T.audio.se("Crash", { volume: 70, pitch: 110 });
        const sp = spkOf("ostap"), jas = spkOf("jas");
        const out = [];
        linie(out, Watki.mowa.HERO, "sabotaz.rano"); linie(out, sp, "sabotaz.ostap"); linie(out, Watki.mowa.HERO, "sabotaz.tadek"); linie(out, jas, "sabotaz.jas");
        uruchom(null, out);
    }
    // the night actors of Map215 (injected events 4510 Ludwik, 4511 Ostap): the lamp comes in through the door at 22:00
    const noc = { faza: 0, t: 0 };
    const nocWarunek = () => has() && $gameMap.mapId() === D.MAP.cech && S().sab.stan === 1 && !!S().polka && S().polka.etap === 3 && !S().sab.noc && inHours(hour(), D.CZAS.noc);
    function bfs(ev, tx2, ty2) {
        const W = $gameMap.width(), H = $gameMap.height(), key = (x, y) => y * W + x;
        const prev = new Map([[key(ev.x, ev.y), null]]), q = [[ev.x, ev.y]];
        const dirs = [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]];
        while (q.length) {
            const [x, y] = q.shift();
            if (x === tx2 && y === ty2) break;
            for (const [d, dx, dy] of dirs) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev.has(key(nx, ny))) continue;
                if (!ev.canPass(x, y, d)) continue;
                prev.set(key(nx, ny), [x, y, d]);
                q.push([nx, ny]);
            }
        }
        if (!prev.has(key(tx2, ty2))) return null;
        const route = [];
        let c = prev.get(key(tx2, ty2));
        let cx = tx2, cy = ty2;
        while (c) { route.unshift(c[2]); cx = c[0]; cy = c[1]; c = prev.get(key(cx, cy)); }
        return route;
    }
    function idz(ev, x, y) {
        const r = bfs(ev, x, y);
        if (!r) return false;
        ev.forceMoveRoute({ list: r.map(d => ({ code: d === 2 ? 1 : d === 4 ? 2 : d === 6 ? 3 : 4 })).concat([{ code: 0 }]), repeat: false, skippable: true, wait: false });
        return true;
    }
    function nocEv(id) { return $gameMap.event(id) || null; }
    function nocPokaz(ev, sheet, x, y, d) {
        if (!ev) return;
        ev.setImage(sheet, 0); ev.setDirection(d || 8); ev.locate(x, y); ev.setTransparent(false); ev.setThrough(false); ev.setMoveSpeed(3);
        ev.setPriorityType(1);
    }
    function nocSchowaj(ev) { if (ev) { ev.setTransparent(true); ev.setThrough(true); ev.locate(0, 0); } }
    function nocTick() {
        if ($gameMap.mapId() !== D.MAP.cech) { noc.faza = 0; return; }
        if (!has() || $gameMap.isEventRunning()) return;
        const lud = nocEv(D.ID.nocLudwik);
        if (noc.faza === 0 && nocWarunek() && lud) {
            noc.faza = 1;
            T.audio.se("Door1", { volume: 70, pitch: 90 });
            nocPokaz(lud, "$Npc_Ludwik", 7, 17, 8);
            idz(lud, 4, 5);
        } else if (noc.faza === 1 && lud && !lud.isMoving() && lud.x === 4 && lud.y === 5) {
            noc.faza = 2;
            lud.setDirection(4);
            const out = [], sp = { id: lud.eventId(), name: tx("ludwik.imie") }, hero = Watki.mowa.HERO;
            linie(out, hero, "noc.start"); linie(out, sp, "noc.ludwik"); linie(out, hero, "noc.wybor");
            wybor(out, [tx1("noc.opcjaStop"), tx1("noc.opcjaDowod"), tx1("noc.opcjaOstap")], [
                bran(hero, "noc.stop", null, "Majster.akcja('noc', 1)"), bran(hero, "noc.dowod", null, "Majster.akcja('noc', 2)"),
                bran(hero, "noc.ostap", null, "Majster.nocOstap()")], 0);
            uruchom(null, out);
        }
    }
    function nocOstap() {
        const ost = nocEv(D.ID.nocOstap), lud = nocEv(D.ID.nocLudwik);
        if (ost) { nocPokaz(ost, "$Npc_Ostap", 7, 17, 8); idz(ost, 5, 6); }
        T.audio.se("Bell3", { volume: 80, pitch: 90 });
        akcja("noc", 3);
        if (lud) lud.setDirection(6);
    }
    function nocKoniec() {
        const lud = nocEv(D.ID.nocLudwik), ost = nocEv(D.ID.nocOstap);
        noc.faza = 3;
        if (lud) { idz(lud, 7, 17); }
        setTimeout(() => { try { nocSchowaj(lud); nocSchowaj(ost); } catch (e) { /* the map changed */ } }, 4500);
    }
    // the injected actors (empty until the scene)
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function actorDane(id, name, note, light) {
        return { id, name, note: (light ? "<Light:170,120,70,24>" : "") + (note || ""), x: 0, y: 0, pages: [{ conditions: Object.assign({}, BLANK), directionFix: false,
            image: { tileId: 0, characterName: "", direction: 8, pattern: 1, characterIndex: 0 }, list: [C(0, [])], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false,
            through: true, trigger: 0, walkAnime: true }] };
    }
    // the tribune's props on the market on the exam day (Map008): quiet events with the guild's things (no takeable look: they are scenery)
    function rekwizytDane(id, r) {
        return { id, name: r.name, note: "<Majster:trybuna>", x: r.x, y: r.y, pages: [{ conditions: Object.assign({}, BLANK), directionFix: true,
            image: { tileId: 0, characterName: r.sheet, direction: r.dir, pattern: r.pat, characterIndex: r.index }, list: [C(0, [])], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false,
            through: false, trigger: 0, walkAnime: false }] };
    }
    T.inject([D.MAP.cech, D.MAP.miasto], { ids: D.IDS, owner: D.OWNER, build: (data, mapId) => {
        const out = [];
        if (mapId === D.MAP.cech) { out.push(actorDane(D.ID.nocLudwik, "Ludwik (noc)", "<Majster:noc>", true)); out.push(actorDane(D.ID.nocOstap, "Ostap (noc)", "<Majster:noc>", false)); }
        if (mapId === D.MAP.miasto && has() && egzDzis()) D.TRYBUNA.rekwizyty.forEach((r, i) => out.push(rekwizytDane(D.ID.trybuna + i, r)));
        return out;
    } });

    // ==================================================================
    // 9. The exam: the tribune, the commission held on the market, the mini-game, the verdict, the endings
    // ==================================================================
    const egzLista = () => { const s = S(); return lista(4, s.fach); };
    const trzyma = { on: false };
    function trzymaj(on) {
        const L = TL();
        if (!L || !L.hold) return;
        if (on === trzyma.on) return;
        trzyma.on = on;
        for (const [key, p] of Object.entries(D.TRYBUNA.ludzie)) {
            const k = key === "ostap" || key === "ludwik" || key === "kowal" || key === "garbarz" || key === "ciesla" || key === "soltys" || key === "piekarka" || key === "woziwoda" || key === "dzwonnik" ? key : null;
            if (!k) continue;
            if (k === "ludwik" && !ludwikJest()) continue;
            try { L.hold(k, on, on ? [p[0], p[1]] : null); } catch (e) { report("hold " + k, e); }
        }
    }
    function egzaminTick() {
        if (!has()) return;
        const on = egzDzis() && $gameMap.mapId() === D.MAP.miasto && hour() >= D.TRYBUNA.godzinaStart && hour() < D.CZAS.egzGodziny[1];
        if (on !== trzyma.on) trzymaj(on);
        const s = S();
        // a day passed without the hero: the exam moves to the next market day (nothing lost)
        if (s.ranga === 3 && !s.koniec && s.egz.dzien && day() > s.egz.dzien) { s.egz.dzien = nextMarket(day()); sprawdzQ(); }
        if (s.koniec === 4 && s.egz.poprawka && day() >= s.egz.poprawka && (!s.egz.dzien || day() > s.egz.dzien)) { s.egz.dzien = nextMarket(Math.max(day(), s.egz.poprawka)); sprawdzQ(); }
    }
    function egzaminRozmowa(out, sp) {
        const s = S(), hero = Watki.mowa.HERO;
        if (!sprawdzEgz().ok) {
            linie(out, sp, "ostap.egzaminBrak");
            skrypt(out, "Majster.egzPrzesun()");
            return out;
        }
        linie(out, sp, s.koniec === 4 ? "egz.poprawka" : "ostap.egzaminTrybuna");
        if (s.sab.stan && dowody() >= D.OCENA.dowodyMin && ludwikJest()) {
            linie(out, sp, "ostap.dowodyPyta");
            wybor(out, [tx1("egz.dowody.tak"), tx1("egz.dowody.nie")], [bran(sp, "ostap.dowodyDziala", null, "Majster.akcja('dowody', 1)"), bran(null, null, null, "Majster.akcja('dowody', 0)")], 1);
        }
        linie(out, Watki.mowa.HERO, "egz.komisja");
        linie(out, sp, "egz.szlify");
        skrypt(out, "Majster.akcja('szlify')");
        return out;
    }
    function sprawdzEgz() {
        const s = S(), l = egzLista();
        const r = sprawdz(l);
        if (!r.ok && s.fach === "kowal") {   // the iron mail instead of the steel one
            const r2 = sprawdz(D.ALT_KOWAL);
            if (r2.ok) return { ok: true, alt: true, brak: [], uzyte: [] };
        }
        return r;
    }
    function egzPrzesun() {
        const s = S();
        s.egz.proby++;
        s.egz.dzien = nextMarket(day() + 1);
        sprawdzQ();
    }
    // ---------------------------------------------------------------- the mini-game "Ostatnie szlify"
    const ui = T.ui;
    const NAK = ["up", "right", "down", "left"];
    class Scene_Szlify extends ui.Scene_MiniGame {
        createGame() {
            this.runda = 0; this.pozycja = 0; this.bledy = 0; this.flash = 0; this.ukl = [];
            this.dlugosc = (this.opts.dlugosc || 3) + (this.opts.trudniej ? 1 : 0);
            this.bmp = new Bitmap(Graphics.width, Graphics.height);
            this.pic = new Sprite(this.bmp);
            this.stage.addChild(this.pic);
            this.nowyUklad();
            this.setTitle(tx("szlify.tytul"), tx("szlify.pod"));
            this.setHints([["up", tx("szlify.podpowiedz")]], null);
        }
        begin() { this.setPhase("play"); this.draw(); }
        nowyUklad() {
            this.ukl = []; this.pozycja = 0;
            for (let i = 0; i < this.dlugosc; i++) this.ukl.push(NAK[Math.floor(this.rng() * 4) % 4]);
        }
        tick() {
            const k = this.trig;
            if (this.phase === "play") {
                const want = this.ukl[this.pozycja];
                const pressed = ["up", "right", "down", "left"].find(d => k[d]);
                if (pressed) {
                    if (pressed === want) { this.pozycja++; this.flash = 6; this.se("cursor"); }
                    else { this.bledy++; this.flash = -10; this.se("buzzer", 0.8); }
                    if (this.pozycja >= this.ukl.length) {
                        T.audio.se("Hammer", { volume: 85, pitch: 95 });
                        this.runda++;
                        if (this.runda >= 3) { this.setPhase("wynik"); this.ocena = this.bledy === 0 ? 2 : this.bledy <= 3 ? 1 : 0; }
                        else { this.setPhase("przerwa"); }
                    }
                }
            } else if (this.phase === "przerwa") {
                if (this.phaseT > 24) { this.nowyUklad(); this.setPhase("play"); }
            } else if (this.phase === "wynik") {
                if (this.phaseT > 20 && k.ok) { this.se("ok"); this.end({ ocena: this.ocena, bledy: this.bledy }); }
            }
            if (this.flash > 0) this.flash--; else if (this.flash < 0) this.flash++;
        }
        quitResult() { return { ocena: 0, bledy: 9 }; }
        frame() { this.draw(); }
        draw() {
            const b = this.bmp, W = Graphics.width, H = Graphics.height, ctx = b.context;
            b.clear();
            const st = ui.style || {};
            const cx = W / 2, cy = H / 2 + 10;
            ctx.save();
            ctx.fillStyle = "rgba(11,12,15,0.86)"; ctx.fillRect(cx - 360, cy - 150, 720, 300);
            ctx.strokeStyle = st.accent || "#ffd23f"; ctx.lineWidth = 3; ctx.strokeRect(cx - 360, cy - 150, 720, 300);
            b.fontSize = 26; b.textColor = st.accent || "#ffd23f";
            b.drawText(fill(tx1("szlify.runda"), { n: Math.min(3, this.runda + (this.phase === "wynik" ? 0 : 1)) }), cx - 340, cy - 140, 680, 36, "center");
            const n = this.ukl.length, sz = 84, gap = 22, total = n * sz + (n - 1) * gap;
            for (let i = 0; i < n; i++) {
                const x = cx - total / 2 + i * (sz + gap), y = cy - 60;
                const done = i < this.pozycja, cur = i === this.pozycja && this.phase === "play";
                ctx.fillStyle = done ? "rgba(120,200,110,0.9)" : cur ? "rgba(255,210,63,0.25)" : "rgba(60,64,72,0.7)";
                ctx.fillRect(x, y, sz, sz);
                ctx.strokeStyle = cur ? (this.flash < 0 ? "#ff7b6b" : st.accent || "#ffd23f") : "#3a3e46"; ctx.lineWidth = 4; ctx.strokeRect(x, y, sz, sz);
                this.drawArrow(ctx, x + sz / 2, y + sz / 2, this.ukl[i], done ? "#0b0c0f" : "#eceef0");
            }
            b.fontSize = 22; b.textColor = this.bledy ? "#ffb347" : "#9fa4ad";
            b.drawText(fill(tx1("szlify.bledy"), { n: this.bledy }), cx - 340, cy + 50, 680, 30, "center");
            if (this.phase === "wynik") {
                b.fontSize = 44; b.textColor = this.ocena === 2 ? "#8ee08a" : this.ocena === 1 ? st.accent || "#ffd23f" : "#c9cdd4";
                b.drawText(tx1(this.ocena === 2 ? "szlify.mistrzowski" : this.ocena === 1 ? "szlify.dobry" : "szlify.zaliczony"), cx - 340, cy + 78, 680, 54, "center");
                b.fontSize = 20; b.textColor = "#9fa4ad";
                b.drawText(tx1("szlify.stopka"), cx - 340, cy + 126, 680, 28, "center");
            }
            ctx.restore();
            b._baseTexture && b._baseTexture.update && b._baseTexture.update();
        }
        drawArrow(ctx, x, y, dir, col) {
            ctx.fillStyle = col;
            ctx.beginPath();
            const r = 26;
            const pts = { up: [[0, -r], [r, r * 0.6], [-r, r * 0.6]], down: [[0, r], [r, -r * 0.6], [-r, -r * 0.6]], left: [[-r, 0], [r * 0.6, r], [r * 0.6, -r]], right: [[r, 0], [-r * 0.6, r], [-r * 0.6, -r]] }[dir];
            ctx.moveTo(x + pts[0][0], y + pts[0][1]); ctx.lineTo(x + pts[1][0], y + pts[1][1]); ctx.lineTo(x + pts[2][0], y + pts[2][1]);
            ctx.closePath(); ctx.fill();
        }
        pause() {
            this.se("cancel");
            this.showChoice({ title: tx1("szlify.pauza"), options: [tx1("szlify.pauzaOpcje"), tx1("szlify.pauzaWyjdz")], cancel: 0, w: 440, onPick: i => { if (i === 1) { this.end({ ocena: 0, bledy: 9 }); } } });
        }
        state() { return Object.assign(super.state(), { runda: this.runda, pozycja: this.pozycja, bledy: this.bledy, ukl: this.ukl.slice(), ocena: this.ocena }); }
    }
    function szlify() {
        const forced = api.opts && api.opts.ocena !== undefined ? Number(api.opts.ocena) : null;
        if (forced !== null) {
            api.opts = null; setTimeout(() => { try { wynik({ ocena: forced, bledy: 0 }); } catch (e) { report("szlify", e); } }, 0); return; }
        const s = S();
        const ok = ui.open(Scene_Szlify, { trudniej: s.sab.stan && dowody() < D.OCENA.dowodyMin, onEnd: wynik });
        if (!ok) report("szlify", "nie da się otworzyć mini-gry");
    }
    // ---------------------------------------------------------------- the verdict
    function wynik(res) {
        if (!has()) return;
        const s = S();
        let ocena = res && res.ocena !== undefined ? Number(res.ocena) : 0;
        const alt = !sprawdz(egzLista()).ok && s.fach === "kowal";
        if (alt) ocena = Math.min(ocena, 1);
        s.egz.ocena = ocena;
        const sp = spkOf("ostap"), out = [];
        T.audio.se("Applause1", { volume: 55, pitch: 100 });
        let koniec;
        if (api.forceKoniec) { koniec = api.forceKoniec; api.forceKoniec = 0; }
        else if (s.koniec === 4 && s.egz.poprawka) koniec = 1;                                  // the retake: Ludwik is master already, a "Zaliczony" is enough
        else if (s.egz.dowody && s.sab.stan && dowody() >= D.OCENA.dowodyMin) koniec = 2;  // the evidence shown
        else {
            const dziel = D.OCENA.opiniaDziel;
            const hero = ocena * 2 + Math.floor(opiniaNow() / dziel) + (s.wsk ? D.OCENA.wskazowka : 0);
            const lud = D.OCENA.ludwik + (s.sab.stan && dowody() < D.OCENA.dowodyMin ? 1 : 0);
            koniec = hero > lud ? 1 : 4;
            if (koniec === 1 && ocena >= 1 && opiniaNow() >= D.OCENA.dwochOpinia && ludwikJest()) {
                // two masters: asked at the table (the hero decides)
                linie(out, sp, "egz.wynik.ostrzez"); linie(out, sp, "egz.dwochPyta");
                wybor(out, [tx1("egz.dwoch"), tx1("egz.dwochNie")], [bran(sp, null, null, "Majster.akcja('koniec', 3)"), bran(sp, null, null, "Majster.akcja('koniec', 1)")], 1);
                s.egz.ocena = ocena;
                uruchom(null, out);
                return;
            }
        }
        linie(out, Watki.mowa.HERO, "egz.wynik.ostrzez");
        skrypt(out, "Majster.akcja('koniec', " + koniec + ")");
        uruchom(null, out);
    }
    function zakoncz(n) {
        const s = S(), out = [], sp = spkOf("ostap");
        if (s.koniec >= 1 && s.koniec <= 3) return;
        const ocena = s.egz.ocena >= 0 ? s.egz.ocena : 0;
        s.koniec = n;
        s.egz.dzien = 0;
        T.audio.se("Applause1", { volume: 70, pitch: 105 });
        linie(out, sp, "egz.wynik." + n, { ocena: tx("oceny." + ocena) });
        if (n === 4) {
            s.egz.poprawka = day() + D.CZAS.poprawka;
            s.ludwik.zostal = 1;
            opinia(D.OPINIA.ludwikWygral);
            uruchom(null, out);
            sprawdzQ();
            return;
        }
        s.ranga = 4;
        zlato(D.ZAPLATA.r4);
        xp(D.XP.r4);
        opinia(n === 2 ? D.OPINIA.demask : D.OPINIA.r4);
        if (n === 2) s.ludwik.odplynal = day() + 1;
        if (n === 3) s.ludwik.zostal = 1;
        trzymaj(false);
        note("notatki.majster");
        s.egz.kufel = day();
        linie(out, sp, "ostap.mlotek");
        skrypt(out, "Majster.mlotekDaj()");
        uruchom(null, out);
        const q = TQ();
        sprawdzQ();
        try { if (q && q.finish && w.active("W22")) q.finish("W22", {}); } catch (e) { report("finish", e); }
    }
    // the tavern's evening toast (Borgar stands a mug for the master): once, the exam day's evening
    function kufelTick() {
        const s = S();
        if (!s.egz.kufel || s.egz.kufelPokazany || $gameMap.mapId() !== D.MAP.tawerna || hour() < 18 || day() < s.egz.kufel) return;
        s.egz.kufelPokazany = 1;
        T.popup(tx1("egz.wieczor"), { top: true, color: "#ffe27a", sub: tx1("egz.wieczorBywalcy") });
    }

    // ==================================================================
    // 10. The master's hammer (forge time, tool wear: the skills' perks of Combat, which Farming / Durability read)
    // ==================================================================
    function perkWrap() {
        const C2 = window.Combat;
        if (!C2 || !C2.perk || C2.perk.__majster) return;
        const orig = C2.perk;
        const f = key => {
            let v = orig.call(C2, key);
            if (key === "smelt.speed" || key === "tool.wear") {
                try { if (S() && S().mlotek && mlotekItem() && $gameParty.numItems(mlotekItem()) > 0) v += key === "tool.wear" ? D.MLOTEK.narzedzia : D.MLOTEK.kuznia; } catch (e) { /* no game yet */ }
            }
            return v;
        };
        f.__majster = true;
        C2.perk = f;
    }

    // ==================================================================
    // 11. F9 (Debug.js "Wyspa i fabuła", the section "Wątek W22")
    // ==================================================================
    const f9 = { ranga: 1, ocena: 1, koniec: 1 };
    function debugGo(n) {
        const s = S();
        n = Math.max(0, Math.min(4, n | 0));
        Object.assign(s, D.defaults());
        s.ranga = 0;
        if (n >= 0) { s.poreka = "kowal"; s.wpisowe = day(); }
        if (n >= 1) { s.ranga = 1; }
        if (n >= 2) { s.ranga = 2; s.zam.wzieto = day() - 5; s.zam.termin = day(); s.zam.dostarczono = day() - 1; s.fach = "kowal"; s.ludwik.przyjazd = Math.max(1, day() - 3); }
        if (n >= 3) { s.ranga = 3; s.egz.ranga3 = day(); s.egz.dzien = nextMarket(day() + 3); s.ludwik.przyjazd = Math.max(1, day() - 5); }
        if (n >= 4) { s.ranga = 4; s.koniec = 1; s.mlotek = 0; }
        sprawdzQ();
        return s;
    }
    function f9Przygotuj(ocena) {
        const s = debugGo(3);
        s.egz.dzien = day();
        for (const [id, n] of lista(4, "kowal")) if (item(id)) { const have = count(id); if (have < n) $gameParty.gainItem(item(id), n - have); }
        s.sab = { stan: 1, dzien: day() - 6, scena: 0, noc: 0, zwrot: 1 };
        s.slady = { wegiel: 1, odcisk: 1, swiadek: 1 };
        api.opts = { ocena };
        sprawdzQ();
    }
    w.haki({
        krokZmienne: ctx => {
            const s = S(), step = ctx && ctx.r ? ctx.r.step : 0, v = {};
            const fach = s.fach ? tx("fach." + s.fach) : tx("fach.brak");
            const dowodyN = Math.min(3, dowody());
            let t = "";
            if (step === 0) t = s.poreka ? fill(tx("kroki.0.jest"), { kto: tx("fach." + s.poreka) }) : tx("kroki.0.brak");
            else if (step === 1) t = s.polka ? fill(tx("kroki.1.lezy"), { dzien: polkaRano() ? "" : "(jutro)" }) : tx("kroki.1.pusto");
            else if (step === 2) {
                if (s.zam.doOstapa) t = fill(tx("kroki.2.ostapa"), { dzien: "" });
                else if (s.zam.dostarczono) t = tx("kroki.2.ostap");
                else if (s.zam.wzieto) t = fill(tx("kroki.2.zamowienie"), { termin: s.zam.termin, ludwik: ludwikJest() ? fill(tx("kroki.2.ludwik"), { nl: " " }) : "" });
                else t = tx("kroki.2.brak");
            } else if (step === 3) {
                if (!s.fach) t = tx("kroki.3.fach");
                else if (s.sab.stan === 1 && !s.polka) t = fill(tx("kroki.3.pekla"), { lista: listaText(lista(3)), dowody: dowodyN });
                else if (s.polka) t = fill(tx("kroki.3.lezy"), { dzien: "" }) + (s.sab.stan === 1 && !s.sab.noc ? " " + fill(tx("kroki.3.noc"), { dowody: dowodyN }) : "");
                else t = fill(tx("kroki.3.sztuka"), { fach, lista: listaText(lista(3)) });
            } else if (step === 4) {
                if (s.koniec) t = fill(tx("kroki.4.po"), { wynik: tx("wyniki." + s.koniec) });
                else if (egzDzis()) t = fill(tx("kroki.4.dzis"), { lista: listaText(egzLista()) });
                else t = fill(tx("kroki.4.czeka"), { dzien: egzDzien(), fach, lista: listaText(egzLista()) });
            }
            v.tekst = t;
            return v;
        },
        f9Zmienne: ctx => {
            const co = ctx && ctx.row ? ctx.row.co : "";
            if (co === "ranga") return { n: f9.ranga };
            if (co === "egzamin") return { ocena: tx("oceny." + f9.ocena) };
            if (co === "koniec") return { n: f9.koniec };
            return {};
        },
        f9Wybierz: (ctx, delta) => {
            const co = ctx.row.co;
            if (co === "ranga") f9.ranga = (f9.ranga + delta + 5) % 5;
            else if (co === "egzamin") f9.ocena = (f9.ocena + delta + 3) % 3;
            else if (co === "koniec") f9.koniec = ((f9.koniec - 1 + delta + 4) % 4) + 1;
            else return false;
            return true;
        },
        f9Ok: ctx => {
            if (!has()) return { say: tx("f9.brak"), bad: true };
            const co = ctx.row.co;
            if (co === "ranga") { debugGo(f9.ranga); return { go: ["W22", D.MAP.cech, 7, 15, 8], say: "ranga " + f9.ranga }; }
            if (co === "przyjazd") { const s = S(); s.ludwik = { przyjazd: day(), odplynal: 0, zostal: 0 }; if (!s.ranga) debugGo(1); sprawdzQ(); return { back: true }; }
            if (co === "sabotaz") {
                const s = debugGo(2);
                s.polka = { etap: 3, dzien: day() - 1, godz: 12 };
                s.sab = { stan: 0, dzien: 0, scena: 0, noc: 0, zwrot: 0 };
                s.ludwik = { przyjazd: day() - 2, odplynal: 0, zostal: 0 };
                rano();
                return { go: ["W22", D.MAP.cech, 7, 15, 8] };
            }
            if (co === "egzamin") { f9Przygotuj(f9.ocena); return { go: ["W22", D.MAP.miasto, D.TRYBUNA.hero[0], D.TRYBUNA.hero[1], D.TRYBUNA.hero[2]] }; }
            if (co === "koniec") { f9Przygotuj(f9.ocena); api.forceKoniec = f9.koniec; return { go: ["W22", D.MAP.miasto, D.TRYBUNA.hero[0], D.TRYBUNA.hero[1], D.TRYBUNA.hero[2]] }; }
            if (co === "wyzeruj") { Object.assign(S(), D.defaults()); trzymaj(false); sprawdzQ(); return { back: true }; }
            return null;
        }
    });

    // ==================================================================
    // 12. The clock and the bus
    // ==================================================================
    let ticks = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        try {
            if (++ticks % 15) return;
            if ($gameMap.mapId() === D.MAP.cech) { sabotazScena(); nocTick(); }
            if (ticks % 60 === 0) zegar();
        } catch (e) { report("zegar", e); }
    }, { owner: PLUGIN, name: "majster" });
    T.on("hourChange", () => { if (!has()) return; try { zegar(); kufelTick(); } catch (e) { report("godzina", e); } }, { owner: PLUGIN });
    T.on("dayStart", () => { if (!has()) return; try { zegar(); } catch (e) { report("dzień", e); } }, { owner: PLUGIN });
    T.on("mapReady", () => {
        trzyma.on = false; noc.faza = 0;
        if (!has()) return;
        try {
            perkWrap();
            if ($gameMap.mapId() === D.MAP.cech) { rano(); sabotazScena(); }
            zegar();
            kufelTick();
        } catch (e) { report("mapa", e); }
    }, { owner: PLUGIN });
    T.on("load", () => { trzyma.on = false; noc.faza = 0; perkWrap(); }, { owner: PLUGIN });
    // the condition of Ludwik's residence in TownLife
    const registerCondition = () => { const L = TL(); if (L && L.addCondition) L.addCondition("majsterLudwik", () => ludwikJest() || (has() && !!S().ludwik.zostal && !S().ludwik.odplynal && S().koniec >= 3)); };
    registerCondition();
    T.on("mapReady", registerCondition, { owner: PLUGIN });

    window.Majster = T.register(PLUGIN, {
        stan: () => S(), ranga: () => S().ranga, polka, polkaZloz, tablica, slad, drzwi: ev => (drzwiOtwarte() ? true : (drzwiZamkniete(ev && ev.eventId ? ev.eventId() : 0), false)),
        drzwiOtwarte, drzwiZamkniete, akcja, oath, poreka, zamWez, zamSpoznione, zlecenieOddaj, egzPrzesun, mlotekDaj, nocOstap, szlify, wynik, zakoncz,
        dowody, ludwikJest, egzDzis, egzTeraz, egzDzien, sprawdz, lista, sprawdzEgz, rano, tick: zegar, trzymaj, debugGo, f9Przygotuj,
        opts: o => { if (o !== undefined) api.opts = o; return api.opts; }, forceKoniec: () => api.forceKoniec || 0, nextMarket, targ,
        nocWarunek, nocTick, perkWrap, Scene_Szlify, mistrz, inna, witKomplet, talkOstap: ostapRozmowa, talkLudwik: ludwikRozmowa, talkJas: jasRozmowa
    });
})();
