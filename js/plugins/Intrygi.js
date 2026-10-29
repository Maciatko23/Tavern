//=============================================================================
// Intrygi.js
//=============================================================================
// The ferry's travellers, stage 3 - the intrigues on the tavern's floors (docs/PODROZNI.md 1.5-1.7, 3; 2026-10-29) - the ENGINE; the
// data: Intrygi_Data.js, the words: js/teksty/intrygi.txt.
//   - TavernLife's gates used: the hero's rooms taken by a traveller (room 3, the Gold suite - from Podroznicy's book), the renown's
//     prices (75+: 20% off, 90+: the chamber free once a week), tips a shift (TavernShift.addTipBonus: 40/60/80 - +1/+2/+3 G), the plan
//     of the tavern (who lives in a room, till when), the sleep broken by steps in the corridor (I4)
//   - THE DOORS of the travellers' rooms (Map025, rooms 4-24): shut while the guest lives there - "Zamknięte. Ktoś tu mieszka.",
//     "Zapukaj" (the guest inside answers through the door) / "Odejdź"; open while the guest is out and the maid cleans (9-11) or with
//     Borgar's key (renown 50+, an hour)
//   - THE SEARCH of a guest's things (his "Kufer" / "Torba" in his room) when a matter wants it: "Przeszukać cudze rzeczy?" - the guest
//     back within half an hour: caught (renown -3, he does not talk to the hero for the rest of his stay). Podroznicy.przeszukanie
//   - I4 NIGHT STEPS: a walker with a candle (its light goes with him) along the corridor: woken in a rented bed ("Wstań po cichu" /
//     "Śpij dalej") or awake upstairs; followed at a distance (within the candle's light he sees the hero), to the stairs - the clue.
//     Ozzy walking in his sleep the first time (K73; W3's mumbled verse), Tymon to the kitchen (W16: Dezerter.kuchnia). Podroznicy.kroki
//   - I5 LETTERS under the door: in the morning after a night in a rented room (Tymon's, Szczerba's - W16; Urszula's thanks - D43).
//     Podroznicy.listy
//   - D45 "Gość spod trójki", D46 "Skradziona szkatułka", K73 "Nocne kroki" - the hooks of their data
//   - the waiting steps of stage 4: SwieteKosci.przeszukanie() (Gaspar's box, room 12), Dezerter.kuchnia(), Dezerter.list(); D42's
//     room 20 (the contract)
// Bus: nocneKroki { id, ok, jak }, listPodDrzwiami { id }, przeszukanie { id, zlapany }. API: window.Intrygi.

/*:
 * @target MZ
 * @plugindesc Podróżni z promu - etap 3, silnik intryg: zamknięte drzwi zajętych pokoi, przeszukanie, nocne kroki ze świecą, listy pod drzwiami, D45 „Gość spod trójki”, D46 „Skradziona szkatułka”, K73. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Intrygi_Data
 * @base Podroznicy
 * @orderAfter Podroznicy_Sprawy
 *
 * @help
 * ============================================================================
 * Intrygi.js - intrygi na piętrach tawerny (docs/PODROZNI.md, rozdz. 3)
 * ============================================================================
 * Drzwi pokoi gości (4-24) są zamknięte, gdy ktoś tam mieszka. Kufry i torby
 * gości przeszukuje się tylko w sprawach, które tego chcą. Nocą ktoś idzie
 * korytarzem ze świecą - można go śledzić. Rano po nocy w wynajętym pokoju
 * pod drzwiami bywa list. Zadania D45, D46, K73 - dane w Intrygi_Data.js.
 * Musi stać pod Podroznicy_Sprawy.js na liście wtyczek.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.IntrygiData, PD = window.PodroznicyData, P = window.Podroznicy;
    if (!T || !window.Watki || !D || !PD || !P) throw new Error("Intrygi.js: brak TawernaCore.js / Watki.js / Intrygi_Data.js / Podroznicy.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Intrygi";
    const w = D.watek, fill = Watki.wstaw, C = Watki.mowa.C, AK = { akapity: true }, HERO = Watki.mowa.HERO;

    // ------------------------------------------------------------------ helpers
    const S = () => w.S();
    const has = () => !!window.$gameSystem && !!S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const teraz = () => day() * 24 + hour();
    const TQ = () => T.api("TownQuests");
    const TL = () => T.api("TavernLife");
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const tx = k => w.tekst(k), txm = k => w.tekstMoze(k);
    const listOf = v => (Array.isArray(v) ? v : v ? [v] : []);
    const inHours = (h, hs) => { const [a, b] = hs; return a <= b ? h >= a && h < b : h >= a || h < b; };
    const report = (where, e) => console.error("[" + PLUGIN + "] " + where, e);
    const PS = () => P.stan();
    const wpis = pk => (has() ? PS().obecni[pk] || null : null);
    const aktywne = id => { const q = TQ(), r = q && q.rec ? q.rec(id) : null; return !!r && r.s === "active"; };
    const zrobione = id => { const q = TQ(); return !!(q && q.isDone && q.isDone(id)); };
    const krokZadania = id => { const q = TQ(), r = q && q.rec ? q.rec(id) : null; return r && r.s === "active" ? (q.Q[id].steps[r.step] || {}).nazwa || "" : ""; };
    const mapId = () => (window.$gameMap ? $gameMap.mapId() : 0);
    const sneaking = () => !!T.call("Hunting", "sneaking");
    const note = (key, vars) => { const p = w.pair(key, vars); if (p) T.call("Journal", "addNote", p[0], p[1]); };
    const SB = () => T.api("SpeechBubbles");
    const dymek = (ch, text, frames) => { const sb = SB(); if (sb && sb.say && text) sb.say(ch, text, frames || 180); else if (text) T.popup(text, { color: "#eceef0" }); };
    const linie = (spk, lines, vars) => Watki.mowa.linesTo([], spk, listOf(lines), vars || null, 0, AK);
    // a talk in the event's interpreter (called from code without one - a test, F9: only the effect, no words); wKolejke: a talk for
    // the map's own interpreter, run once no event and no TavernLife sequence runs - never over a running one (the wake, the walk's end)
    const kolejka = [];
    const uruchom = (interp, list) => { if (interp && list && list.length) Watki.mowa.uruchom(interp, list); };
    const wKolejke = list => { if (list && list.length) kolejka.push(list); };
    const script = (out, code) => (out.push(C(355, [code])), out);
    const nocId = () => (hour() < 12 ? day() - 1 : day());   // (the night belongs to the evening it began)
    const tydzien = () => Math.floor((day() - 1) / 7);
    const hak = (name, ...args) => { if (!name) return undefined; if (typeof name === "function") return name(...args); return w.hak(name, {}, ...args); };
    const gdyOk = d => { try { return d.gdy === undefined ? true : !!hak(d.gdy); } catch (e) { report("warunek " + d.id, e); return false; } };

    // the plan of the tavern (TavernLife_Plan's data): a room's key at a cell, its number ("r12" -> "12")
    const planFloor = id => { const L = TL(), PDt = L && L.plan && L.plan.DATA; return PDt ? PDt.floors.find(f => f.map === id) || null : null; };
    function roomAt(map, x, y) {
        const f = planFloor(map);
        if (!f) return null;
        return f.rooms.find(r => r.r.some(q => x >= q[0] && x <= q[2] && y >= q[1] && y <= q[3])) || null;
    }
    const numerPokoju = (map, x, y) => { const r = roomAt(map, x, y), m = r && /^r(\d+)$/.exec(r.k); return m ? m[1] : null; };

    // a traveller in his room now: one of his residents' plan at this hour "inside" a place that is his room upstairs
    function wPokoju(pk) {
        for (const rk of P.rezydenci(pk)) {
            const plan = P.plan(rk) || [], h = hour();
            let e = plan[plan.length - 1];
            for (const x of plan) if (x[0] <= h) e = x;
            if (e && e[1] === "inside" && /^pokoj_/.test((P.wnetrze(rk) || {})[e[2]] || "")) return true;
        }
        return false;
    }
    // ...and within the next hours
    function wracaZa(pk, godzin) {
        for (const rk of P.rezydenci(pk)) {
            const plan = P.plan(rk) || [], h = hour(), w2 = P.wnetrze(rk) || {};
            for (const x of plan) if (x[0] > h && x[0] <= h + godzin && x[1] === "inside" && /^pokoj_/.test(w2[x[2]] || "")) return true;
        }
        return false;
    }

    // ==================================================================
    // 1. TavernLife's gates: the rooms taken, the prices, the tips, the plan, the wake
    // ==================================================================
    let furtkiZrobione = false;
    function furtki() {
        if (furtkiZrobione) return;
        const L = TL();
        if (!L || typeof L.addRoomGuard !== "function") return;
        furtkiZrobione = true;
        // the hero's room 3 / the Gold suite in Podroznicy's book
        L.addRoomGuard(room => {
            if (!has()) return null;
            const pk = PS().ksiega[String(room)], e = pk ? wpis(pk) : null;
            return e ? { kto: P.nazwa(pk), do: e.do } : null;
        });
        L.addRoomPrice((room, price) => {
            if (!has() || !(price > 0)) return price;
            const r = P.renoma();
            if (room === "komnata" && r >= D.RENOMA.komnata.od && S().komnataTydz !== tydzien()) return 0;
            return r >= D.RENOMA.rabat.od ? Math.max(1, Math.round(price * D.RENOMA.rabat.ile)) : price;
        });
        if (typeof L.addWake === "function") L.addWake(room => budzik(room));
        if (L.plan && typeof L.plan.addInfo === "function") L.plan.addInfo((floor, key) => planInfo(floor, key));
        const Sh = T.api("TavernShift");
        if (Sh && typeof Sh.addTipBonus === "function") Sh.addTipBonus(() => (has() ? ((D.RENOMA.napiwki.find(([p]) => P.renoma() >= p) || [0, 0])[1]) : 0));
    }
    // the plan of the tavern: who lives in a room upstairs, till when
    function planInfo(floor, key) {
        if (!has()) return null;
        const map = [1, 25, 26][floor], m = /^r(\d+)$/.exec(key), room = m ? m[1] : map === 26 && key === "s4" ? "zloty" : null;
        if (!room) return null;
        const pk = PS().ksiega[room], e = pk ? wpis(pk) : null;
        return e ? [{ icon: "room", text: fill(tx("plan.gosc"), { kto: P.nazwa(pk, true), do: e.do }) }] : null;
    }

    // ==================================================================
    // 2. The doors of the travellers' rooms (Map025)
    // ==================================================================
    const drzwiPokoju = ev => { if (mapId() !== D.MAP.pietro) return null; const de = ev.event(), m = de && D.DRZWI.re.exec(de.name || ""); return m ? m[1] : null; };
    const kluczBorgara = () => has() && S().klucz > teraz();
    function otwarte(room, pk) {
        if (wPokoju(pk)) return false;
        return inHours(hour(), D.DRZWI.sprzatanie) || kluczBorgara();
    }
    function drzwiLista(room, pk) {
        const out = linie(HERO, [tx("drzwi.zamkniete")]), labels = [tx("drzwi.zapukaj")], branches = [script([], "Intrygi.drzwi(this, 'zapukaj', " + JSON.stringify(room) + ");")];
        const opc = (key, co) => { labels.push(tx(key)); branches.push(script([], "Intrygi.drzwi(this, " + JSON.stringify(co) + ", " + JSON.stringify(room) + ");")); };
        if (room === "3" && aktywne("D45") && !S().d45.koniec && sneaking()) {
            if (inHours(hour(), D.D45.dziurka) && !S().d45.slady.dziurka) opc("d45.dziurka.etykieta", "dziurka");
            if (inHours(hour(), D.D45.notes)) opc("d45.notes.etykieta", "notes");
        }
        if (pk === "ksenia" && aktywne("D46") && !S().d46.koniec && !S().d46.widziane.zamek) opc("d46.zamek.etykieta", "zamek");
        labels.push(tx("drzwi.odejdz"));
        branches.push([]);
        return Watki.mowa.choiceTo(out, labels, branches, labels.length - 1);
    }
    T.onEventList(ev => {
        if (!has()) return null;
        const room = drzwiPokoju(ev);
        if (!room) return null;
        const pk = PS().ksiega[room];
        if (!pk) return null;
        const L = TL();
        if (L && L.isRented && L.isRented(room)) return null;
        if (otwarte(room, pk)) return null;
        return drzwiLista(room, pk).concat([C(0, [])]);
    }, { owner: PLUGIN, name: "drzwi", priority: "closed" });
    function drzwi(interp, co, room) {
        if (!has()) return;
        const pk = PS().ksiega[room];
        try {
            if (co === "zapukaj") {
                T.audio.se("Knock", { volume: 60 });
                const lines = pk && wPokoju(pk) ? [tx("drzwi.zza." + (pk.charAt(0) === "p" ? "pula" : "gosc"))] : [tx("drzwi.cisza")];
                uruchom(interp, linie(HERO, lines));
            } else if (co === "dziurka") {
                uruchom(interp, linie(HERO, listOf(tx("d45.dziurka.widok"))));
                d45Slad("dziurka");
            } else if (co === "notes") {
                uruchom(interp, linie(HERO, listOf(tx("d45.notes.widok"))));
                d45Koniec("c");
            } else if (co === "zamek") {
                uruchom(interp, linie(HERO, listOf(tx("d46.zamek." + (S().d46.wariant || "A")))));
                d46Slad("zamek");
            }
        } catch (e) { report("drzwi " + co, e); }
    }

    // ==================================================================
    // 3. The search of a guest's things
    // ==================================================================
    const SZUK = [];
    function szukanieDodaj(def) {
        if (!def || !def.id) return false;
        const d = Object.assign({ rzecz: "dowolna", plik: "intrygi" }, def);
        const i = SZUK.findIndex(x => x.id === d.id);
        if (i >= 0) SZUK[i] = d; else SZUK.push(d);
        return true;
    }
    for (const d of D.PRZESZUKANIA) szukanieDodaj(d);
    const szukane = () => S().szukane || (S().szukane = {});
    // the room of a search: its guest's room in the book (the usual one may have been taken), else the data's
    const pokojSzukania = d => { const e = d.kto ? wpis(d.kto) : null; return e && e.pokoj ? String(e.pokoj) : String(d.pokoj || ""); };
    function szukanieDla(room, rzecz) {
        if (!has()) return null;
        return SZUK.find(d => pokojSzukania(d) === room && !szukane()[d.id] && (d.rzecz === "dowolna" || d.rzecz === rzecz) && (!d.kto || PS().ksiega[room] === d.kto) && gdyOk(d)) || null;
    }
    const rzeczOf = name => (D.SZUKANIE.rzeczy.kufer.test(name) ? "kufer" : D.SZUKANIE.rzeczy.torba.test(name) ? "torba" : null);
    T.onEventList(ev => {
        if (!has() || mapId() !== D.MAP.pietro) return null;
        const de = ev.event(), rz = de && rzeczOf(de.name || "");
        if (!rz) return null;
        const room = numerPokoju(D.MAP.pietro, ev.x, ev.y), d = room ? szukanieDla(room, rz) : null;
        if (!d) return null;
        return [C(355, ["Intrygi.szukaj(this, " + JSON.stringify(d.id) + ");"]), C(0, [])];
    }, { owner: PLUGIN, name: "szukanie", priority: "scene" });
    function szukaj(interp, id) {
        const d = SZUK.find(x => x.id === id);
        if (!d || !has()) return;
        const out = linie(HERO, [tx("szukanie.pyta")]);
        uruchom(interp, Watki.mowa.choiceTo(out, [tx("szukanie.tak"), tx("szukanie.nie")], [script([], "Intrygi.szukajTak(this, " + JSON.stringify(id) + ");"), []], 1));
    }
    function szukajTak(interp, id) {
        const d = SZUK.find(x => x.id === id);
        if (!d || !has() || szukane()[id]) return;
        const pk = PS().ksiega[pokojSzukania(d)];
        if (pk && (wPokoju(pk) || wracaZa(pk, D.SZUKANIE.wraca))) {
            S().zly[pk] = day();
            P.renoma(D.SZUKANIE.kara, "przeszukanie:" + pk);
            uruchom(interp, linie(HERO, listOf(fill(tx("szukanie.zlapany"), { kto: P.nazwa(pk) }))));
            T.emit("przeszukanie", { id, zlapany: true });
            return;
        }
        szukane()[id] = day();
        let key = d.klucz;
        try { const k = hak(d.po); if (typeof k === "string" && k) key = k; } catch (e) { report("przeszukanie " + id, e); }
        const T2 = d.plik && d.plik !== "intrygi" ? Watki.teksty(d.plik) : null;
        const lines = T2 ? listOf(String(key).split(".").reduce((o, x) => (o && typeof o === "object" ? o[x] : undefined), T2)) : listOf(txm(key));
        uruchom(interp, linie(HERO, lines.length ? lines : [tx("szukanie.nic")]));
        T.emit("przeszukanie", { id, zlapany: false });
    }
    // a guest who caught the hero in his things does not talk to him for the rest of his stay
    T.talk.takeover({ owner: PLUGIN, name: "obrazony", who: key => { if (!has()) return false; const pk = P.osoba(key); return !!pk && !!S().zly[pk]; },
        priority: T.talk.PRIORITY.meet + 10, run: ctx => { try { return ctx.ev ? linie({ id: ctx.ev.eventId(), name: "" }, [tx("szukanie.obrazony")]) : null; } catch (e) { return null; } } });

    // ==================================================================
    // 4. I4 - the night steps
    // ==================================================================
    const KRO = [];
    function krokiDodaj(def) {
        if (!def || !def.id) return false;
        const d = Object.assign({ mapa: D.MAP.pietro, indeks: 0 }, def);
        const i = KRO.findIndex(x => x.id === d.id);
        if (i >= 0) KRO[i] = d; else KRO.push(d);
        return true;
    }
    for (const d of D.KROCZACY) krokiDodaj(d);
    // the walker due tonight (at most one a night; not the one put off by "Śpij dalej")
    function dzisNocny() {
        if (!has() || S().kroki.noc === nocId()) return null;
        return KRO.find(d => !(d.raz && S().kroki.zrobione[d.id]) && gdyOk(d)) || null;
    }
    // the wake of a sleep in a rented bed (TavernLife.addWake): at the walker's hour, on the guests' floor's rooms
    let auto = true;   // (the tests' quiet mode: no wakes, no walks by themselves - Intrygi.auto(false))
    function budzik(room) {
        if (!has() || !auto || room === "zloty") return null;
        const d = dzisNocny();
        if (!d) return null;
        const h = hour(), a = d.godziny[0];
        if (inHours(h, d.godziny)) return null;   // (in the walker's own hours: the walk starts as he lies down - not a wake)
        return { hour: a + 0.05, kto: d.id };
    }
    let szedl = null;   // the walk: { d, ev, i, stan, f0, wynik }
    let poSnie = null;  // "Śpij dalej": the room to sleep on in (once the talk is over)
    T.on("tavernWake", e => {
        if (!has() || !e) return;
        const d = KRO.find(x => x.id === e.kto) || dzisNocny();
        if (!d) return;
        const out = linie(HERO, listOf(tx("kroki.budzi")));
        Watki.mowa.choiceTo(out, [tx("kroki.wstan"), tx("kroki.spij")],
            [script([], "Intrygi.krokiStart(" + JSON.stringify(d.id) + ");"), script([], "Intrygi.spijDalej(" + JSON.stringify(e.room) + ", " + JSON.stringify(d.id) + ");")], 1);
        wKolejke(out);   // (TavernLife's sleep is still finishing)
    }, { owner: PLUGIN });
    function spijDalej(room, id) {
        if (!has()) return;
        S().kroki.noc = nocId();
        S().kroki.pominiete[id] = day();
        poSnie = room;
    }
    function krokiStart(id) {
        const d = KRO.find(x => x.id === id);
        if (!d || !has() || szedl || mapId() !== d.mapa) return false;
        const ev = $gameMap.event(D.IDS.kroczacy);
        if (!ev) return false;
        const s = S().kroki;
        s.noc = nocId();
        if (!s.pierwszy) s.pierwszy = day();
        ev.setImage(d.arkusz, d.indeks || 0);
        ev.locate(d.start[0], d.start[1]);
        ev.setDirection(d.start[2] || 2);
        ev.setTransparent(false);
        ev.setThrough(false);
        ev._priorityType = 1;
        ev.setMoveSpeed(D.KROKI.predkosc);
        ev._intryga = { kroczacy: true };
        const de = ev.event();
        if (de) de.name = txm(d.kto) || "";
        szedl = { d, ev, i: 0, stan: "czeka", f0: Graphics.frameCount };
        T.audio.se("Move1", { volume: 35, pitch: 70 });
        w.mysl([tx("kroki.slychac")]);
        w.autoChecks();
        return true;
    }
    function krokiKoniec(ok, jak) {
        const z = szedl;
        if (!z) return;
        szedl = null;
        const s = S().kroki;
        s.zrobione[z.d.id] = day();
        if (ok) s.udane = (s.udane || 0) + 1;
        let lista = null;
        try { lista = hak(z.d.koniec, ok, jak); } catch (e) { report("kroki " + z.d.id, e); }
        if (Array.isArray(lista) && lista.length) wKolejke(lista);
        T.emit("nocneKroki", { id: z.d.id, ok: !!ok, jak });
        w.autoChecks();
    }
    function ukryjKroczacego(ev) {
        if (!ev) return;
        ev.setImage("", 0);
        ev.setTransparent(true);
        ev.setThrough(true);
        ev._priorityType = 0;
    }
    function krokiTick() {
        const z = szedl;
        if (!z) return;
        const ev = z.ev, f = Graphics.frameCount;
        if (mapId() !== z.d.mapa || !ev || $gameMap.event(ev.eventId()) !== ev) { szedl = null; krokiKoniecBez(z, "zgubiony"); return; }
        const dx = $gamePlayer.x - ev.x, dy = $gamePlayer.y - ev.y, dist = Math.hypot(dx, dy);
        if (z.stan === "czeka") {
            const r = roomAt(z.d.mapa, Math.round($gamePlayer.x), Math.round($gamePlayer.y));
            if ((r && r.t === "hall") || f - z.f0 > D.KROKI.czeka) z.stan = "idzie";
            return;
        }
        if (z.stan === "wraca") {
            if (ev.isMoving()) return;
            if (ev.x === z.d.start[0] && ev.y === z.d.start[1] || f - z.f0 > 600) { ukryjKroczacego(ev); szedl = null; return; }
            const dir = ev.findDirectionTo(z.d.start[0], z.d.start[1]);
            if (dir > 0) ev.moveStraight(dir); else { ukryjKroczacego(ev); szedl = null; }
            return;
        }
        // seen: within the candle's light (closer while sneaking) - the excuse, back to his room
        if (f % 6 === 0 && dist < (sneaking() ? D.KROKI.skradanie : D.KROKI.widzi)) {
            ev.turnTowardPlayer();
            dymek(ev, tx(z.d.wymowka || "kroki.wymowka"), 200);
            z.stan = "wraca";
            z.f0 = f;
            const d = z.d;
            szedl = z;
            krokiKoniecBez(z, "zlapany", true);
            return;
        }
        if (ev.isMoving()) return;
        const cel = z.d.trasa[z.i];
        if (!cel) {
            const ok = dist <= D.KROKI.gubi;
            ukryjKroczacego(ev);
            szedl = z;
            krokiKoniec(ok, ok ? "doszedl" : "zgubiony");
            if (!ok) w.mysl([tx("kroki.zgubiony")]);
            return;
        }
        if (ev.x === cel[0] && ev.y === cel[1]) { z.i++; return; }
        const dir = ev.findDirectionTo(cel[0], cel[1]);
        if (dir > 0) ev.moveStraight(dir);
        else { ev.locate(cel[0], cel[1]); z.i++; }
    }
    // (caught / lost: the walk is over for tonight; `zostaw` - the walker still goes back on the map)
    function krokiKoniecBez(z, jak, zostaw) {
        const keep = zostaw ? szedl : null;
        szedl = z;
        krokiKoniec(false, jak);
        if (jak === "zlapany") w.mysl([tx("kroki.zlapany")]);
        if (keep) szedl = keep;
    }
    T.onEventStart(ev => !!(ev._intryga && ev._intryga.kroczacy && (ev.isTransparent() || szedl)), { owner: PLUGIN, name: "kroczacy", priority: "hidden" });
    // awake upstairs at the walker's hour: it starts by itself
    function krokiCzuwanie() {
        if (!auto || szedl || $gameMap.isEventRunning() || mapId() !== D.MAP.pietro) return;
        const d = dzisNocny();
        if (d && d.mapa === D.MAP.pietro && inHours(hour(), d.godziny)) krokiStart(d.id);
    }

    // ==================================================================
    // 5. I5 - the letter under the door
    // ==================================================================
    const LIS = [];
    function listyDodaj(def) {
        if (!def || !def.id) return false;
        const i = LIS.findIndex(x => x.id === def.id);
        if (i >= 0) LIS[i] = def; else LIS.push(def);
        return true;
    }
    for (const d of D.LISTY) listyDodaj(d);
    let zlotyList = null;   // (where the letter lies in the Gold suite - read from Map026 as it loads)
    // this morning's letter: the hero slept in a rented room, 6-10
    function listDzis() {
        if (!has()) return null;
        const L = TL(), r = L && L.rentedRoom ? L.rentedRoom() : null, s = S().listy;
        if (s.dzien === day()) return s.czytany ? null : LIS.find(d => d.id === s.id) ? { d: LIS.find(x => x.id === s.id), room: s.room } : null;
        if (!r || !r.slept || !inHours(hour(), [6, 10])) return null;
        const d = LIS.find(x => !s.byly[x.id] && gdyOk(x));
        Object.assign(s, { dzien: day(), id: d ? d.id : "", czytany: d ? 0 : 1, room: String(r.room) });
        return d ? { d, room: String(r.room) } : null;
    }
    function listGdzie(room) {
        if (room === "zloty") return zlotyList;
        return D.LIST_GDZIE[room] || null;
    }
    function list(interp) {
        const z = listDzis();
        if (!z || !has()) return;
        let p = null;
        try {
            if (z.d.tekst) { const t = hak(z.d.tekst); p = Array.isArray(t) ? t : t ? [tx("listy.tytul"), t] : null; }
            else p = w.pair(z.d.klucz);
        } catch (e) { report("list " + z.d.id, e); }
        const s = S().listy;
        s.czytany = day();
        s.byly[z.d.id] = day();
        if (p) {
            T.call("Journal", "addNote", p[0], p[1]);
            uruchom(interp, Watki.mowa.plain([], p[0], [p[1]]));
        }
        try { hak(z.d.po); } catch (e) { report("list " + z.d.id, e); }
        T.emit("listPodDrzwiami", { id: z.d.id });
        rekwizyty();
    }

    // ==================================================================
    // 6. The props: the walker, the letter, the soot (D45), the rope in the cellar (D45), the raftsman's bag on the pier (D46 C)
    // ==================================================================
    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function zdarzenie(id, name, note, x, y, code, prio, sheet) {
        return { id, name, note: note || "", x, y, pages: [{ conditions: Object.assign({}, COND), directionFix: !!sheet && /^!/.test(sheet),
            image: { tileId: 0, characterName: "", direction: 2, pattern: 1, characterIndex: 0 }, list: [C(355, [code]), C(0, [])], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: prio === undefined ? 0 : prio, stepAnime: false, through: true, trigger: 0, walkAnime: true }] };
    }
    const REK = {
        sadza: { map: D.D45.sadza[0], x: D.D45.sadza[1], y: D.D45.sadza[2], sheet: "!$Podr_Sadza", id: D.IDS.sadza, code: "Intrygi.rekwizyt(this, 'sadza');" },
        sznur: { map: D.D45.sznur[0], x: D.D45.sznur[1], y: D.D45.sznur[2], sheet: "!$Podr_Sznur", id: D.IDS.sznur, code: "Intrygi.rekwizyt(this, 'sznur');" },
        bagaz: { map: D.D46.bagaz[0], x: D.D46.bagaz[1], y: D.D46.bagaz[2], sheet: "!$Podr_Bagaz", id: D.IDS.bagaz, code: "Intrygi.rekwizyt(this, 'bagaz');" }
    };
    function wstaw(data, map) {
        const out = [];
        if (map === D.MAP.pietro) out.push(zdarzenie(D.IDS.kroczacy, "", "<Intrygi:kroczacy>" + D.KROKI.swiatlo, 1, 1, "0;", 1));
        if (map === D.MAP.pietro || map === D.MAP.apartamenty) {
            if (map === D.MAP.apartamenty) {
                const bed = (data.events || []).find(e => e && /<Tavern:bed[^>]*room=zloty/i.test(e.note || ""));
                zlotyList = bed ? [map, bed.x, Math.min(data.height - 1, bed.y + 1)] : null;
            }
            out.push(zdarzenie(D.IDS.list, "", "<Intrygi:list>", 1, 1, "Intrygi.list(this);", 0, "!$Podr_List"));
        }
        for (const [k, r] of Object.entries(REK)) if (r.map === map && r.x < data.width && r.y < data.height) out.push(zdarzenie(r.id, "", "<Intrygi:" + k + ">", r.x, r.y, r.code, 0, r.sheet));
        return out;
    }
    if (typeof P.dodajWstaw === "function") P.dodajWstaw(wstaw);
    const widac = {
        sadza: () => aktywne("D45") && !S().d45.slady.sadza && !!wpis("trojka") && day() > wpis("trojka").od && inHours(hour(), [6, 10]),
        sznur: () => aktywne("D45") && !S().d45.slady.sznur && !S().d45.koniec,
        bagaz: () => { const e = wpis("ksenia"); return aktywne("D46") && S().d46.trafny && S().d46.wariant === "C" && !S().d46.koniec && !!e && day() <= e.do && inHours(hour(), D.D46.bagazGodziny); }
    };
    function pokazRek(ev, on, sheet, x, y) {
        const st = ev._intryga || (ev._intryga = {});
        if (st.on === on && (!on || (ev.x === x && ev.y === y))) return;
        st.on = on;
        if (on) { ev.setImage(sheet, 0); ev.locate(x, y); ev.setTransparent(false); } else { ev.setImage("", 0); ev.setTransparent(true); }
    }
    function rekwizyty() {
        if (!has() || !window.$gameMap) return;
        const m = mapId();
        for (const [k, r] of Object.entries(REK)) {
            if (r.map !== m) continue;
            const ev = $gameMap.event(r.id);
            if (!ev) continue;
            let on = false;
            try { on = widac[k](); } catch (e) { report("rekwizyt " + k, e); }
            pokazRek(ev, on, r.sheet, r.x, r.y);
        }
        const lev = m === D.MAP.pietro || m === D.MAP.apartamenty ? $gameMap.event(D.IDS.list) : null;
        if (lev) {
            let at = null;
            try { const z = listDzis(); at = z ? listGdzie(z.room) : null; } catch (e) { report("list", e); }
            pokazRek(lev, !!at && at[0] === m, "!$Podr_List", at ? at[1] : 1, at ? at[2] : 1);
        }
        // (the walker's id is the harbour's actor on Map125 - only the guests' floor's walker is ours)
        const kev = m === D.MAP.pietro ? $gameMap.event(D.IDS.kroczacy) : null;
        if (kev && !szedl && !kev.isTransparent()) ukryjKroczacego(kev);
    }
    T.onEventStart(ev => !!(ev._intryga && !ev._intryga.kroczacy && !ev._intryga.on), { owner: PLUGIN, name: "rekwizyty", priority: "hidden" });
    function rekwizyt(interp, k) {
        if (!has()) return;
        try {
            if (k === "sadza" && widac.sadza()) { uruchom(interp, linie(HERO, listOf(tx("d45.sadza")))); d45Slad("sadza"); }
            else if (k === "sznur" && widac.sznur()) { uruchom(interp, linie(HERO, listOf(tx("d45.sznur")))); d45Slad("sznur"); }
            else if (k === "bagaz" && widac.bagaz()) { uruchom(interp, linie(HERO, listOf(tx("d46.bagaz")))); d46Koniec("dobrze"); }
        } catch (e) { report("rekwizyt " + k, e); }
        rekwizyty();
    }

    // ==================================================================
    // 7. D45 "Gość spod trójki"
    // ==================================================================
    function d45Slad(k) {
        const s = S().d45;
        if (s.slady[k] || s.koniec || !aktywne("D45")) return;
        s.slady[k] = day();
        note("d45.notatka.slad." + k);
        T.popup(tx("d45.sladNapis"), { top: true, color: "#ffe27a", sub: fill(tx("d45.sladPod"), { n: Object.keys(s.slady).length }) });
        w.autoChecks();
    }
    function d45Koniec(how) {
        const s = S().d45;
        if (s.koniec || !aktywne("D45")) return;
        s.koniec = how;
        w.setFlag("d45_" + how);
        w.setFlag("pomiaryPrzejete");
        if (how === "b") { w.setFlag("trojkaAresztowany"); T.call("Garnizon", "addFavor", D.D45.przychylnosc, "D45"); }
        P.renoma(D.D45.renoma[how] || 0, "D45");
        note("d45.notatka." + how);
        if (how === "a" || how === "b") { try { P.odplyn("trojka"); } catch (e) { report("trójka", e); } }
        TQ().finish("D45", D.D45.nagroda[how] || {});
    }
    // the stranger sails with his measurements (nobody stopped him): Act III's faction knows the vaults
    T.on("podroznyOdplynal", e => {
        if (!e || !has()) return;
        delete S().zly[e.kto];   // (gone: a later visit talks again)
        if (e.kto === "trojka" && !S().d45.koniec && (aktywne("D45") || !zrobione("D45"))) w.setFlag("pomiaryWyszly");
    }, { owner: PLUGIN });
    (function echo() {
        const A3 = window.Act3Data;
        if (!A3) return;
        const list = A3.WIEDZA_FRAKCJI = A3.WIEDZA_FRAKCJI || [];
        if (!list.includes("pomiaryWyszly")) list.push("pomiaryWyszly");
    })();

    // ==================================================================
    // 8. D46 "Skradziona szkatułka"
    // ==================================================================
    function d46Wariant() {
        const s = S().d46;
        if (s.wariant) return s.wariant;
        const L = P.logika, r = L.rng(L.mix(PS().seed || 1, 46));
        let v = ["A", "B", "C"][Math.floor(r() * 3)];
        if (v === "B" && !wpis("relikwie")) v = "A";
        s.wariant = v;
        return v;
    }
    function d46Slad(k) {
        const s = S().d46;
        if (!aktywne("D46") || s.koniec) return;
        s.widziane[k] = day();
        const v = d46Wariant();
        if (!(D.D46.wariantySlady[v] || []).includes(k) || s.slady[k]) return;
        s.slady[k] = day();
        note("d46.notatka.slad", { tekst: tx("d46.slad." + k + "." + v) });
        T.popup(tx("d46.sladNapis"), { top: true, color: "#ffe27a", sub: fill(tx("d46.sladPod"), { n: Object.keys(s.slady).length }) });
        w.autoChecks();
    }
    function d46Oskarz(kto) {
        const s = S().d46;
        if (!aktywne("D46") || s.koniec || s.oskarzeni[kto]) return;
        s.oskarzeni[kto] = day();
        const v = d46Wariant(), trafny = D.D46.winni[v] === kto;
        if (!trafny) {
            w.setFlag("d46Oskarzony_" + kto);
            if (kto === "gaspar") w.setFlag("gasparObrazony");
            T.call("TownQuests", "addOpinion", D.D46.opinia.zle, "D46");
            P.renoma(D.D46.renoma.zle, "D46:" + kto);
            note("d46.notatka.zle", { kto: tx("d46.kto." + kto) });
            return;
        }
        s.trafny = day();
        if (v === "C") { note("d46.notatka.molo"); w.autoChecks(); return; }
        d46Koniec("dobrze");
    }
    function d46Koniec(how) {
        const s = S().d46;
        if (!aktywne("D46") || s.koniec) return;
        s.koniec = how;
        const v = d46Wariant();
        if (how === "dobrze") {
            w.setFlag("d46Odzyskana");
            P.renoma(D.D46.renoma.dobrze, "D46");
            const QB = T.api("QuestBoard");
            if (QB && QB.addRep) QB.addRep(D.D46.slawa);
            note("d46.notatka.dobrze." + v);
            TQ().finish("D46", D.D46.nagroda[v] || {});
            return;
        }
        // (her ferry and no box: Borgar pays her 60 G - the renown down)
        w.setFlag("d46Przepadla");
        P.renoma(D.D46.renoma.przepadla, "D46");
        note("d46.notatka.przepadla");
        try { TQ().fail("D46"); } catch (e) { report("D46", e); }
    }
    function d46Termin() {
        if (!aktywne("D46") || S().d46.koniec) return;
        const e = wpis("ksenia");
        if (!e || day() > e.do || (day() === e.do && hour() >= D.D46.odplyw)) d46Koniec("przepadla");
    }

    // ==================================================================
    // 9. The hooks of the data
    // ==================================================================
    const SK = () => T.api("SwieteKosci"), DZ = () => T.api("Dezerter");
    const dzStan = () => { try { const d = DZ(); return d && d.stan ? d.stan() : null; } catch (e) { return null; } };
    w.haki({
        // D45
        trojkaJest: () => !!wpis("trojka"),
        trojkaOdplywaDzis: () => { const e = wpis("trojka"); return !!e && e.do === day() && hour() < 15; },
        d45Zmienne: () => { const e = wpis("trojka"); return { n: Object.keys(S().d45.slady).length, do: e ? e.do : "?" }; },
        d45Slad: (ctx, k) => d45Slad(k),
        d45Koniec: (ctx, how) => d45Koniec(how),
        ansgarSojusznik: () => w.flag("ansgarAlly"),
        // D46
        d46Kradziez: () => { const e = wpis("ksenia"); return !!e && (day() > e.od + D.D46.noc + 1 || (day() === e.od + D.D46.noc + 1 && hour() >= 6)) && day() <= e.do; },
        d46Zmienne: () => { const e = wpis("ksenia"); return { n: Object.keys(S().d46.slady).length, do: e ? e.do : "?" }; },
        d46Slad: (ctx, k) => d46Slad(k),
        d46Oskarz: (ctx, kto) => d46Oskarz(kto),
        gasparJest: () => !!wpis("relikwie"),
        d46Szukaj: () => aktywne("D46") && !S().d46.koniec && !S().d46.widziane.pokoj,
        d46Pokoj: () => { d46Slad("pokoj"); return "szukanie.d46." + d46Wariant(); },
        // K73 / the walkers
        ozzyLunatyk: () => !S().kroki.pierwszy,
        ozzyKoniec: (ctx, ok) => {
            if (!ok) return null;
            const q = TQ(), r = q && q.rec ? q.rec("W3") : null;
            if (r && q.hasVerse && !q.hasVerse("belkot") && q.gainVerse) { q.gainVerse("belkot"); return linie(HERO, listOf(tx("kroki.ozzy.zwrotka"))); }
            return linie(HERO, listOf(tx("kroki.ozzy.spiew")));
        },
        tymonKuchnia: () => { const s = dzStan(); return aktywne("W16") && !!s && !s.koniec && !(s.tropy || {}).kuchnia && P.jest("dezerter"); },
        tymonKoniec: (ctx, ok) => {
            if (!ok) return null;
            const out = linie(HERO, listOf(tx("kroki.tymon.kuchnia")));
            if (count(83) > 0) return Watki.mowa.choiceTo(out, [tx("kroki.tymon.chleb"), tx("kroki.tymon.wroc")],
                [script([], "Intrygi.tymon(true);"), script([], "Intrygi.tymon(false);")], 1);
            return script(out, "Intrygi.tymon(false);");
        },
        // I5's letters
        listTymona: () => { const st = krokZadania("W16"), s = dzStan(); return !!s && !s.koniec && (st === "w16Lowczyni" || st === "w16Tymon") && P.jest("dezerter") && !(s.spowiedz); },
        listSzczerby: () => { const st = krokZadania("W16"), s = dzStan(); return !!s && !s.koniec && st === "w16Lowczyni" && P.jest("lowczyni") && !s.kubek && !s.wskazal; },
        listUrszuli: () => zrobione("D43") && ["a", "b", "c"].includes(((PS().d43 || {}).wybor) || ""),
        // (the letters' words from W16's engine)
        // the searches of stage 2 / 4
        w15Szukaj: () => { const k = SK(); try { return !!k && aktywne("W15") && !(k.stan() || {}).skrzynka; } catch (e) { return false; } },
        w15Znalazl: () => { const k = SK(); if (k && k.przeszukanie) k.przeszukanie(); return "szukanie.w15"; },
        d42Szukaj: () => PD.watek.at("d42Slady") && !((PS().d42 || {}).slady || {}).pokoj,
        d42Znalazl: () => { const S2 = T.api("PodroznicySprawy"); if (S2 && S2.d42Slad) S2.d42Slad("pokoj"); return "szukanie.d42"; }
    });
    // (the letters' words from W16's engine; Szczerba's sets her cup at Borgar's)
    const listTekst = kto => { const d = DZ(); try { return d && d.list ? d.list(kto) || null : null; } catch (e) { return null; } };
    w.haki({ listTymonaTekst: () => listTekst("tymon"), listSzczerbyTekst: () => listTekst("lowczyni"),
        d46Winny: (ctx, kto) => D.D46.winni[d46Wariant()] === kto });
    function tymon(nakarmil) {
        const d = DZ();
        if (nakarmil && count(83) > 0) $gameParty.loseItem(item(83), 1);
        try { if (d && d.kuchnia) d.kuchnia({ nakarmil: !!nakarmil }); } catch (e) { report("kuchnia", e); }
    }
    // the podsłuch conversations of stage 3 (D45: the numbers from room 3; D46 A: Ksenia through her door)
    function podsluchy() {
        const pod = P.podsluch;
        if (!pod || !pod.dodaj || podsluchy.done) return;
        podsluchy.done = true;
        pod.dodaj({ id: "d45Liczby", plik: "intrygi", mapa: D.MAP.pietro, pokoj: "3", godziny: D.D45.podsluch, kwestie: "podsluch.liczby", prog: 5, raz: true,
            gdy: () => has() && aktywne("D45") && !S().d45.slady.liczby && !S().d45.koniec && !!wpis("trojka") });
        pod.dodaj({ id: "d46Ksenia", plik: "intrygi", mapa: D.MAP.pietro, pokoj: () => String((wpis("ksenia") || {}).pokoj || "18"), godziny: D.D46.podsluch, kwestie: "podsluch.ksenia", prog: 5, raz: true,
            gdy: () => has() && aktywne("D46") && d46Wariant() === "A" && !S().d46.slady.podsluch && !S().d46.koniec && !!wpis("ksenia") });
    }
    podsluchy();
    T.on("podsluch", e => {
        if (!e || !has()) return;
        if (e.id === "d45Liczby") d45Slad("liczby");
        if (e.id === "d46Ksenia") d46Slad("podsluch");
    }, { owner: PLUGIN });

    // ==================================================================
    // 10. Borgar's options: the key (renown 50+), the door of room 3 broken (D45 a), the accusation (D46)
    // ==================================================================
    const borgarSpk = ctx => ({ id: ctx && ctx.ev ? ctx.ev.eventId() : -1, name: "Borgar" });
    function szukanieChciane() {
        for (const d of SZUK) {
            if (szukane()[d.id] || !gdyOk(d)) continue;
            if (PS().ksiega[pokojSzukania(d)]) return true;
        }
        return false;
    }
    T.talk.option({ owner: PLUGIN, who: "borgar", id: "klucz", order: T.talk.ORDER.extra + 30,
        when: () => has() && P.renoma() >= D.KLUCZ.renoma && !kluczBorgara() && szukanieChciane(),
        label: () => tx("borgar.klucz"),
        run: ctx => { S().klucz = teraz() + D.KLUCZ.godzin; return linie(borgarSpk(ctx), listOf(tx("borgar.kluczDaje"))); } });
    T.talk.option({ owner: PLUGIN, who: "borgar", id: "d45Drzwi", order: T.talk.ORDER.extra + 31,
        when: () => has() && aktywne("D45") && !S().d45.koniec && Object.keys(S().d45.slady).length >= 3 && !!wpis("trojka"),
        label: () => tx("borgar.d45"),
        run: ctx => { const out = linie(borgarSpk(ctx), listOf(tx("d45.wywazamy"))); return script(out, "Intrygi.d45Koniec('a');"); } });
    T.talk.option({ owner: PLUGIN, who: "borgar", id: "d46Oskarz", order: T.talk.ORDER.extra + 32,
        when: () => has() && aktywne("D46") && !S().d46.koniec && !S().d46.trafny,
        label: () => tx("borgar.d46"),
        run: ctx => w.rozmowa("d46Oskarz", { spk: borgarSpk(ctx) }) });
    T.on("served", e => { if (e && e.service === "room" && e.room === "komnata" && !(e.price > 0) && has() && P.renoma() >= D.RENOMA.komnata.od) S().komnataTydz = tydzien(); }, { owner: PLUGIN });
    T.on("townQuestAccepted", e => {
        if (!e || !has()) return;
        if (e.id === "D46") { d46Wariant(); w.mysl(listOf(tx("d46.krzyk"))); }
        if (e.id === "D45") w.mysl(listOf(tx("d45.start")));
    }, { owner: PLUGIN });

    // ==================================================================
    // 11. F9 ("Wyspa i fabuła" - the section of the thread "intrygi")
    // ==================================================================
    const f9 = { wariant: 0 };
    const WARIANTY = ["A", "B", "C"];
    function f9Wiersze() {
        if (!has()) return [];
        return [
            { co: "d45", label: tx("f9.d45"), desc: tx("f9.d45Opis"), icon: 191 },
            { co: "d46", label: fill(tx("f9.d46"), { w: WARIANTY[f9.wariant] }), desc: tx("f9.d46Opis"), icon: 191, pick: f9.wariant },
            { co: "kroki", label: tx("f9.kroki"), desc: tx("f9.krokiOpis"), icon: 190 },
            { co: "list", label: tx("f9.list"), desc: tx("f9.listOpis"), icon: 191 },
            { co: "klucz", label: tx("f9.klucz"), desc: tx("f9.kluczOpis"), icon: 195 }
        ];
    }
    function f9Wybierz(row, delta) {
        if (row.co !== "d46") return false;
        f9.wariant = (f9.wariant + delta + 3) % 3;
        row.label = fill(tx("f9.d46"), { w: WARIANTY[f9.wariant] });
        row.pick = f9.wariant;
        return true;
    }
    const PIETRO = ["Piętro gości", D.MAP.pietro, 48, 49, 8];
    function f9Ok(row) {
        if (!has()) return null;
        switch (row.co) {
            case "d45": {
                if (!wpis("trojka") && !P.przyplyn("trojka")) return { say: tx("f9.nie"), bad: true };
                return { say: tx("f9.ok.d45"), go: PIETRO };
            }
            case "d46": {
                if (!wpis("ksenia") && !P.przyplyn("ksenia")) return { say: tx("f9.nie"), bad: true };
                const e = wpis("ksenia");
                e.od = day() - D.D46.noc - 1;
                e.do = Math.max(e.do, day() + 2);
                S().d46 = { wariant: WARIANTY[f9.wariant], slady: {}, widziane: {}, oskarzeni: {}, koniec: "", trafny: 0 };
                P.odswiez();
                $gameSystem.setDayNightHour(8);
                return { say: fill(tx("f9.ok.d46"), { w: WARIANTY[f9.wariant] }), go: PIETRO };
            }
            case "kroki": {
                S().kroki.noc = -1;
                $gameSystem.setDayNightHour(1.1);
                return { say: tx("f9.ok.kroki"), go: PIETRO };
            }
            case "list": {
                S().listy.dzien = 0;
                return { say: tx("f9.ok.list") };
            }
            case "klucz": S().klucz = teraz() + D.KLUCZ.godzin; return { say: tx("f9.ok.klucz") };
        }
        return null;
    }
    if (w.def) w.def.f9 = { naglowek: "f9.naglowek", wiersze: f9Wiersze, wybierz: f9Wybierz, ok: f9Ok };

    // ------------------------------------------------------------------ the clock
    T.on("newGame", () => { szedl = null; poSnie = null; kolejka.length = 0; furtki(); }, { owner: PLUGIN });
    T.on("load", () => { szedl = null; poSnie = null; kolejka.length = 0; furtki(); }, { owner: PLUGIN });
    // (back from a menu or the day's summary the map is the same: the walk goes on; a new map ends it)
    T.on("mapReady", e => { if (!e || e.transfer) szedl = null; furtki(); podsluchy(); rekwizyty(); }, { owner: PLUGIN });
    T.on("hourChange", () => { if (has()) { d46Termin(); rekwizyty(); } }, { owner: PLUGIN });
    furtki();
    let ticks = 0;
    T.onMapUpdate(() => {
        if (szedl) { try { krokiTick(); } catch (e) { report("kroki", e); szedl = null; } }
        if (kolejka.length && !$gameMap.isEventRunning() && !$gameMessage.isBusy() && !(TL() && TL().busy && TL().busy())) Watki.mowa.uruchom(null, kolejka.shift());
        if (poSnie && !$gameMap.isEventRunning() && !$gameMessage.isBusy()) {
            const room = poSnie;
            poSnie = null;
            const L = TL();
            if (L && L.sleep) L.sleep(room);
        }
        if (++ticks % 30 || !has()) return;
        try { krokiCzuwanie(); rekwizyty(); } catch (e) { report("zegar", e); }
    }, { owner: PLUGIN, name: "intrygi" });

    // ==================================================================
    // The API (and Podroznicy's: kroki, listy, przeszukanie)
    // ==================================================================
    P.kroki = { dodaj: krokiDodaj, start: krokiStart, trwa: () => !!szedl, stan: () => szedl, lista: () => KRO.map(d => d.id), dzis: () => (dzisNocny() || {}).id || null };
    P.listy = { dodaj: listyDodaj, dzis: () => { const z = listDzis(); return z ? z.d.id : null; }, lista: () => LIS.map(d => d.id) };
    P.przeszukanie = { dodaj: szukanieDodaj, dla: (room, rzecz) => { const d = szukanieDla(String(room), rzecz || "kufer"); return d ? d.id : null; }, lista: () => SZUK.map(d => d.id) };
    window.Intrygi = T.register(PLUGIN, {
        D, drzwi, szukaj, szukajTak, krokiStart, spijDalej, list, rekwizyt, rekwizyty, wstaw, tymon, d45Koniec, d45Slad, d46Slad, d46Oskarz, d46Koniec,
        d46Wariant: () => (has() ? d46Wariant() : ""), otwarte: room => { const pk = has() ? PS().ksiega[String(room)] : null; return !pk || otwarte(String(room), pk); },
        wPokoju, planInfo, budzik, auto: on => { if (on !== undefined) auto = on !== false; return auto; }, f9: { wiersze: f9Wiersze, wybierz: f9Wybierz, ok: f9Ok }, kroki: P.kroki, listy: P.listy, przeszukanie: P.przeszukanie
    });
})();
