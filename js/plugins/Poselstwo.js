//=============================================================================
// Poselstwo.js
//=============================================================================
// The chain W14 "Poselstwo" (docs/PODROZNI.md 4.1, I6, 4.4 - stage 5 of the ferry's travellers, 2026-10-29) - the ENGINE; the data:
// Poselstwo_Data.js, the words: js/teksty/poselstwo.txt. What the data cannot do:
//   - the hooks of the data: who is on the island (Podroznicy's book: Albin "pielgrzym", the envoy's group "posel"), the days (the
//     council the day after the envoy came, the theft on the Kupała night inside his stay - else two days after he came), the clues,
//     the traces, the pier, the letter's ways, the words of the steps
//   - the dinner (I6): Borgar's row "Zanieś kolację do Złotego" 20:00-21:00 - the tray, and "in service" till 23:00 the gilded gate is
//     open (TavernLife.addGatePass - the gate of stage 3; registered once it is there)
//   - the council (Map026, 21:00-22:30): the envoy held in the Great salon (TownLife.hold), the Lord and Feliks beside him (events
//     3070-3071); heard through the dining room's wall (Podroznicy.podsluch)
//   - the Kupała night: Ostap at the bonfire (TownLife "gone" 22:00-6:00), Albin by the Gold suite's door 0:30-2:00 (event 3072) - the
//     hero near him: the theft prevented; nobody: at 1:30 the letter is gone, Albin sails with the next ferry (the pier 14-15), the
//     morning's words; the traces of the inquiry on the guests' floor (events 3073-3074)
//   - the letter: back to the envoy (60 G, Renoma +8, the garrison +10, poselWdzieczny), the Lord (w14LordWie, the envoy furious), a
//     copy at night first (Borgar's paper: Ostap may walk in), Albin sailing with it (poselstwoWyciek, Borgar blamed); Albin never
//     shown up sails as the faction's scout (pielgrzymDonosi)
//   - stage 3's doors, when they are there: the night steps (Podroznicy.kroki - Albin up to floor II), the letter under the door
//     (Podroznicy.listy), the search of room 15 (Podroznicy.przeszukanie - the rosary, his notes), the wall of room 15 (podsłuch)
//   - Act III (docs/PODROZNI.md 4.4): pielgrzymDonosi - the shared list of the faction's knowledge (one scout more in wave 3); poselWdzieczny
//     - the royal soldiers at favour 70; poselstwoWyciek - one archer more in wave 2 (one at most from the shared list of wave 2);
//     pielgrzymZlapany / pielgrzymZwiedziony - wave 3 one man fewer, not added to ansgarAlly
// API: window.Poselstwo (Tawerna.api("Poselstwo")).

/*:
 * @target MZ
 * @plugindesc [W14] Łańcuch „Poselstwo” - silnik: kolacja do Złotego „w służbie”, narada w Wielkim salonie, Noc Kupały i kradzież listu, ślady, molo, list (poseł / Lord / kopia), echa w Akcie III. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Poselstwo_Data
 * @base Podroznicy
 * @orderAfter Dezerter
 * @orderAfter Garnizon
 * @orderAfter Act3
 *
 * @help
 * ============================================================================
 * Poselstwo.js - łańcuch W14 „Poselstwo” (docs/PODROZNI.md 4.1)
 * ============================================================================
 * Albin (pątnik) przypływa z trzecią falą (dzień 37), poseł Korony z
 * Ostapem trzy dni później (Apartament Złoty). Kolacja u Borgara 20:00-21:00
 * otwiera złotą kratę „w służbie” do 23:00. Narada nazajutrz o 21:00 w
 * Wielkim salonie (słychać ją z Jadalni). Noc Kupały: kradzież listu.
 * F9 → „Wyspa i fabuła” → „Wątek W14”: przeskok do rozdziału.
 * W skryptach: Poselstwo.stan(), Poselstwo.opts = { kopia: 0-99 }.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.PoselstwoData;
    if (!T || !window.Watki || !D) throw new Error("Poselstwo.js: brak TawernaCore.js / Watki.js / Poselstwo_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Poselstwo";
    const w = D.watek, KTO = D.KTO, CZ = D.CZAS;
    const fill = Watki.wstaw, C = Watki.mowa.C;
    const S = () => w.S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const P = () => T.api("Podroznicy") || window.Podroznicy || null;
    const TL = () => T.api("TownLife");
    const TQ = () => T.api("TownQuests");
    const SB = () => T.api("SpeechBubbles");
    const tx = k => w.tekst(k);
    const listOf = v => (Array.isArray(v) ? v : v ? [v] : []);
    const report = (where, e) => console.error("[Poselstwo] " + where + ":", e);
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const COIN = 314;
    // (the tests: { kopia: 0-99 } - Ostap's roll when the letter is copied)
    const api = { opts: null };

    // ==================================================================
    // 1. Who is on the island, the days
    // ==================================================================
    const ksiega = () => { const p = P(); try { return p && has() ? p.stan() : null; } catch (e) { return null; } };
    const wpis = key => { const s = ksiega(); return s ? s.obecni[key] || null : null; };
    const byli = key => { const s = ksiega(); return s && s.byli[key] && s.byli[key].length ? s.byli[key] : null; };
    function przyjazd(key) {
        const e = wpis(key);
        if (e && (e.wizyta || 1) === 1) return e.od;
        const b = byli(key);
        return b ? b[0].od : 0;
    }
    const naradaDzien = () => (has() && S().naradaDzien ? S().naradaDzien : przyjazd(KTO.posel) ? przyjazd(KTO.posel) + CZ.narada : 0);
    // the night of the theft K (K 22:00 - K+1 6:00): the Kupała night inside the envoy's stay, else his arrival + 2 (or set by F9)
    const isKupala = d => T.time.season(d) === 1 && T.time.dayOfSeason(d) === 14;
    function nocKradziezy() {
        if (has() && S().noc) return S().noc;
        const p = przyjazd(KTO.posel), e = wpis(KTO.posel);
        if (!p) return 0;
        const end = e ? e.do - 1 : p + 5;
        for (let d = p + 1; d <= end; d++) if (isKupala(d)) return d;
        return p + CZ.noc;
    }
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const evOf = key => { const L = TL(); const ev = L && L.eventOf ? L.eventOf(key) : null; return ev && !(ev._town && ev._town.hidden) && !ev.isTransparent() ? ev : null; };
    const punkty = o => Object.values(o || {}).reduce((a, v) => a + (v === true ? 1 : Number(v) || 0), 0);
    const tropy = () => punkty(S().tropy), slady = () => punkty(S().slady);
    const otwarta = () => has() && w.active("W14") && !S().koniec;
    const odswiez = () => { const q = TQ(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const sprawdz = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); odswiez(); };
    const spkOf = ev => ({ id: ev ? ev.eventId() : -1, name: ev && ev.event() ? String(ev.event().name || "").replace(/\s*\(.*\)\s*$/, "") : "" });
    const note = key => { const p = w.pair(key); if (p) T.call("Journal", "addNote", p[0], p[1]); };
    const attr = k => Number(T.call("Combat", "attr", k)) || 0;
    function zloto(n) { if (!(n > 0)) return; $gameParty.gainGold(n); T.popup(fill(tx("napis.zloto"), { n }), { icon: COIN, kind: "gold" }); }
    const renoma = (n, why) => { const p = P(); if (p && p.renoma) p.renoma(n, why); };
    const przychylnosc = n => T.call("Garnizon", "addFavor", n, tx("zadania.W14.title"));
    const favor = () => { const G = T.api("Garnizon"); try { return G && G.favor ? G.favor() : 0; } catch (e) { return 0; } };
    const xp = n => T.call("Combat", "gainXp", n, tx("zadania.W14.title"), true);
    const zakoncz = rw => { const q = TQ(); if (q && q.finish && w.active("W14")) q.finish("W14", rw || {}); };
    const trzymaj = (key, on, to) => { const L = TL(); try { if (L && L.hold) L.hold(key, on, to); } catch (e) { report("hold", e); } };
    const gone = (key, on) => { const L = TL(); try { if (L && L.setGone) L.setGone(key, on); } catch (e) { report("gone", e); } };
    const STEPS_PRZED = ["w14Patnik", "w14Posel", "w14Narada", "w14Kradziez"];

    // ==================================================================
    // 2. Scenes: bubbles and balloons in a row (never holding the hero)
    // ==================================================================
    const scena = { kroki: [], t: 0, mapa: 0 };
    function graj(kroki) { scena.kroki = kroki.slice(); scena.t = 0; scena.mapa = $gameMap.mapId(); }
    function scenaTick() {
        if (!scena.kroki.length) return;
        if ($gameMap.mapId() !== scena.mapa) { scena.kroki = []; return; }
        if (scena.t > 0) { scena.t--; return; }
        const k = scena.kroki.shift(), ch = typeof k.kto === "function" ? k.kto() : k.kto;
        if (k.tekst && ch && SB() && SB().say) SB().say(ch, k.tekst, k.klatki || 170);
        if (k.emotka && ch) $gameTemp.requestBalloon(ch, k.emotka);
        if (k.dzwiek) T.audio.se(k.dzwiek[0], { volume: k.dzwiek[1] || 80, pitch: k.dzwiek[2] || 100 });
        if (k.mysl) w.mysl([k.mysl]);
        if (typeof k.zrob === "function") { try { k.zrob(); } catch (e) { report("scena", e); } }
        scena.t = k.czekaj || 0;
    }

    // ==================================================================
    // 3. The clues, the theft, the letter
    // ==================================================================
    function trop(k, v) {
        const s = S();
        if (!k || !otwarta()) return;
        const before = tropy(), val = Math.max(Number(s.tropy[k]) || 0, Number(v) || 1);
        if (val === (Number(s.tropy[k]) || 0)) return;
        s.tropy[k] = val;
        if (before < D.TROPY.prog) T.popup(fill(tx("napis.trop"), { n: Math.min(D.TROPY.prog, Math.floor(tropy())) }), { top: true, color: "#ffe27a" });
        if (before < D.TROPY.prog && tropy() >= D.TROPY.prog) note("notatki.patnik");
        sprawdz();
    }
    function slad(k, v) {
        const s = S();
        if (!k || !otwarta() || !s.kradziez) return;
        const before = slady(), val = Math.max(Number(s.slady[k]) || 0, Number(v) || 1);
        if (val === (Number(s.slady[k]) || 0)) return;
        s.slady[k] = val;
        if (before < D.SLADY.prog) T.popup(fill(tx("napis.slad"), { n: Math.min(D.SLADY.prog, Math.floor(slady())) }), { top: true, color: "#ffe27a" });
        odswiez();
    }
    // Albin to the tower before the theft (Wit): off the island's book, the quiet way of the chain
    function wieza() {
        const s = S();
        if (!otwarta() || s.albin) return;
        s.albin = "wieza";
        w.setFlag("pielgrzymZlapany");
        w.setFlag("pielgrzymZdemaskowany");
        const p = P();
        if (wpis(KTO.albin) && p && p.odplyn) p.odplyn(KTO.albin);
        note("notatki.wczesnie");
        xp(80);
        const at = STEPS_PRZED.find(n => w.at(n));
        if (at) w.complete(at, { to: "w14Spokoj" });
        sprawdz();
    }
    // the tray carried to the envoy
    function kolacja() {
        const s = S();
        if (w.vcount("taca_kolacja") < 1) return;
        w.vtake("taca_kolacja", 1);
        s.kolacje++;
        if (s.kolacje === 1) { note("notatki.kolacja"); xp(20); }
        if (w.at("w14Posel")) w.complete("w14Posel");
        sprawdz();
    }
    // the theft prevented: the hero by the Gold suite's door when Albin came
    function zapobiegl(ev) {
        const s = S();
        if (!otwarta() || s.kradziez || s.zapobiegl) return;
        s.zapobiegl = day();
        s.tropy.widziany = 3;
        w.setFlag("pielgrzymZdemaskowany");
        if (ev && SB() && SB().say) { SB().say(ev, tx("albin.przylapany"), 170); $gameTemp.requestBalloon(ev, 1); }
        w.mysl([tx("mysl.przylapany")]);
        note("notatki.zapobiegl");
        xp(80);
        const at = STEPS_PRZED.find(n => w.at(n));
        if (at) w.complete(at, { to: "w14Spokoj" });
        sprawdz();
    }
    // the theft: the letter in Albin's staff; he sails with the next ferry (the pier 14-15)
    function kradziez(k) {
        const s = S(), p = P();
        if (!otwarta() || s.kradziez || s.zapobiegl || s.albin || !wpis(KTO.albin) || !wpis(KTO.posel)) return;
        s.kradziez = k + 1;
        s.list = "albin";
        w.setFlag("w14Kradziez");
        if (p && p.wyjazd && p.naPromie) p.wyjazd(KTO.albin, p.naPromie(k + 1));
    }
    // the morning after: the envoy finds it out
    function rano() {
        const s = S();
        if (!otwarta() || !s.kradziez || s.rano) return;
        s.rano = day();
        T.popup(tx("napis.kradziez"), { top: true, color: "#ff9f8f" });
        note("notatki.kradziez");
        if ($gameMap.mapId() === D.MAP.apartamenty) {
            const posel = evOf(KTO.posel), ostap = evOf(KTO.ostap);
            graj([{ kto: posel, tekst: tx("scena.rano.posel"), emotka: 5, czekaj: 190 }].concat(s.kolacje ? [{ kto: ostap, tekst: tx("scena.rano.ostap"), emotka: 1, czekaj: 30 }] : []));
        }
        sprawdz();
    }
    function listOdebrany() {
        const s = S();
        if (!otwarta() || s.list !== "albin") return;
        s.list = "bohater";
        w.vgive("list_posla", 1);
        w.setFlag("pielgrzymZdemaskowany");
        T.audio.se("Book1", { volume: 80 });
    }
    // what is done with Albin once the letter is back: the tower (public), a false way, let go
    function albinLos(how) {
        const s = S();
        if (!w.active("W14") || (s.albin && s.albin !== "zdemaskowany")) return;
        s.albin = how;
        if (how === "wieza") {
            w.setFlag("pielgrzymZlapany");
            const p = P();
            if (wpis(KTO.albin) && p && p.odplyn) p.odplyn(KTO.albin);
            note("notatki.zlapany");
        } else if (how === "zwiedziony") { w.setFlag("pielgrzymZwiedziony"); note("notatki.zwiedziony"); }
        else note("notatki.puszczony");
        sprawdz();
    }
    // the letter back to the envoy; with a copy kept, the Lord may still see it
    function oddaj() {
        const s = S();
        if (!otwarta() || w.vcount("list_posla") < 1) return;
        w.vtake("list_posla", 1);
        s.list = "posel";
        s.oddany = day();
        w.setFlag("poselWdzieczny");
        zloto(D.NAGRODA.gold);
        renoma(D.NAGRODA.renoma, "w14List");
        przychylnosc(D.NAGRODA.przychylnosc);
        note("notatki.oddany");
        if (w.vcount("kopia_listu") < 1 || s.lordWie) koniec("oddany");
        else sprawdz();
    }
    // the Lord reads it: the letter itself (the envoy sails furious) or the copy
    function lordCzyta(co) {
        const s = S();
        if (!otwarta()) return;
        if (co === "kopia") {
            if (w.vcount("kopia_listu") < 1) return;
            w.vtake("kopia_listu", 1);
        } else {
            if (w.vcount("list_posla") < 1) return;
            w.vtake("list_posla", 1);
            s.list = "lord";
            przychylnosc(D.KARY.lordPrzychylnosc);
        }
        s.lordWie = day();
        w.setFlag("w14LordWie");
        note(co === "kopia" ? "notatki.kopia" : "notatki.lord");
        if (co !== "kopia" || s.oddany) koniec(co === "kopia" ? "oddany" : "lord");
        else sprawdz();
    }
    // the copy at night with Borgar's paper: an hour at the candle - Ostap may walk in
    function kopia() {
        const s = S();
        if (!otwarta() || w.vcount("list_posla") < 1 || w.vcount("kopia_listu") > 0) return [];
        const K = D.KOPIA, o = api.opts || {};
        const p = Math.max(K.min, Math.min(K.max, K.ryzyko - K.naCzujnosc * attr("per"))), roll = typeof o.kopia === "number" ? o.kopia : Math.random() * 100;
        if (typeof $gameSystem.advanceDayNight === "function") $gameSystem.advanceDayNight(K.godziny);
        if (roll < p) {
            w.vtake("list_posla", 1);
            s.list = "ostap";
            T.popup(tx("napis.kopiaZlapany"), { top: true, color: "#ff9f8f" });
            renoma(D.KARY.kopiaRenoma, "w14Kopia");
            przychylnosc(D.KARY.kopiaPrzychylnosc);
            note("notatki.kopiaZlapany");
            koniec("kopiaZlapany");
            return w.linie([], { id: -1, name: "Ostap" }, "kopia.ostap");
        }
        s.kopia = day();
        w.vgive("kopia_listu", 1);
        T.popup(tx("napis.kopia"), { top: true, color: "#ffe27a" });
        note("notatki.kopia");
        sprawdz();
        return [];
    }
    // the chain's end: how (spokoj | oddany | lord | kopiaZlapany | bezListu | donosi)
    function koniec(how) {
        const s = S();
        if (!otwarta()) return;
        s.koniec = how;
        if (how === "spokoj") {
            w.setFlag("poselWdzieczny");
            zloto(D.NAGRODA.gold);
            renoma(D.NAGRODA.renoma, "w14Spokoj");
            przychylnosc(D.NAGRODA.przychylnosc);
            zakoncz({ xp: 120 });
        } else if (how === "oddany") zakoncz({ xp: 100 });
        else if (how === "lord") zakoncz({ xp: 60 });
        else if (how === "bezListu") { w.vtake("list_posla", 1); przychylnosc(D.KARY.lordPrzychylnosc); zakoncz({ xp: 20 }); }
        else zakoncz({ xp: 20 });
    }

    // ==================================================================
    // 4. Borgar's rows: the dinner for the envoy, the paper for a copy; the gilded gate "in service"
    // ==================================================================
    const borgarSpk = ctx => (ctx && ctx.ev ? { id: ctx.ev.eventId(), name: "Borgar" } : { id: -1, name: "Borgar" });
    T.talk.option({ owner: PLUGIN, who: "borgar", id: "kolacja", order: T.talk.ORDER.extra + 30,
        when: () => has() && w.active("W14") && !!wpis(KTO.posel) && inHours(hour(), CZ.kolacja) && S().sluzba !== day() && w.vcount("taca_kolacja") < 1,
        label: () => tx("borgar.kolacja"),
        run: ctx => {
            try {
                S().sluzba = day();
                w.vgive("taca_kolacja", 1);
                T.popup(tx("napis.taca"), { kind: "info" });
                T.popup(tx("napis.sluzba"), { top: true, color: "#ffe27a" });
                odswiez();
                return w.linie([], borgarSpk(ctx), "borgar.kolacjaDaje");
            } catch (e) { report("kolacja", e); return null; }
        } });
    T.talk.option({ owner: PLUGIN, who: "borgar", id: "papier", order: T.talk.ORDER.extra + 31,
        when: () => otwarta() && w.at("w14List") && w.vcount("list_posla") > 0 && w.vcount("kopia_listu") < 1 && inHours(hour(), CZ.kopia),
        label: () => tx("borgar.papier"),
        run: ctx => { try { return w.linie([], borgarSpk(ctx), "borgar.papierDaje").concat(kopia()); } catch (e) { report("kopia", e); return null; } } });
    const sluzba = () => has() && S().sluzba === day() && inHours(hour(), CZ.sluzba);
    let bramaJest = false;
    function bramaDodaj() {
        if (bramaJest) return;
        const L = T.api("TavernLife");
        if (!L || typeof L.addGatePass !== "function") return;
        bramaJest = true;
        try { L.addGatePass(() => sluzba()); } catch (e) { report("krata", e); }
    }
    bramaDodaj();

    // ==================================================================
    // 5. The events: the Lord and Feliks at the council, Albin at the door, the traces on the guests' floor
    // ==================================================================
    const A = D.AKTORZY;
    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function zdarzenie(key, a) {
        return { id: a.id, name: "", note: "<Poselstwo:" + key + ">", x: a.x, y: a.y, pages: [{ conditions: Object.assign({}, COND), directionFix: false,
            image: { tileId: 0, characterName: a.sheet || "", direction: a.dir || 2, pattern: 1, characterIndex: a.index || 0 },
            list: [C(355, ["Poselstwo.zdarzenie(this, " + JSON.stringify(key) + ");"]), C(0, [])], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: a.sheet ? 1 : 0, stepAnime: false, through: !a.sheet, trigger: 0, walkAnime: true }] };
    }
    T.inject([D.MAP.apartamenty, D.MAP.pietro], { ids: [D.IDS[0], D.IDS[1]], owner: D.OWNER,
        build: (data, mapId) => Object.entries(A).filter(([, a]) => a.map === mapId).map(([k, a]) => zdarzenie(k, a)) });
    // when each is shown now
    function widoczne(key) {
        if (!has() || !w.active("W14")) return false;
        const s = S(), d = day(), h = hour();
        if (key === "lord" || key === "feliks") return d === naradaDzien() && inHours(h, D.NARADA.godziny) && !!wpis(KTO.posel) && !(key === "feliks" && T.call("TownLife", "gone", "feliks"));
        if (key === "albin") { const k = nocKradziezy(); return !!k && d === k + 1 && inHours(h, CZ.albin) && !s.kradziez && !s.zapobiegl && !s.albin && !!wpis(KTO.albin); }
        if (key === "wosk" || key === "krata") return !!s.kradziez && w.at("w14Sledztwo") && !s.slady[key];
        return false;
    }
    function pokaz(ev, key, on) {
        const st = ev._pos || (ev._pos = {});
        if (st.on !== on) {
            st.on = on;
            ev.setTransparent(!on);
            ev.setThrough(!on || !A[key].sheet);
            const de = ev.event();
            if (on && de) de.name = key === "lord" ? "Lord Zaleski" : key === "feliks" ? "Feliks" : key === "albin" ? tx("albin.imie") : tx("imie." + key);
        }
        if (!on && ev._trigger !== -1) ev._trigger = -1;
        else if (on && ev._trigger !== 0) ev._trigger = 0;
    }
    function zdarzeniaTick() {
        const m = $gameMap.mapId();
        if (m !== D.MAP.apartamenty && m !== D.MAP.pietro) return;
        for (const [key, a] of Object.entries(A)) {
            if (a.map !== m) continue;
            const ev = $gameMap.event(a.id);
            if (!ev) continue;
            const on = widoczne(key);
            pokaz(ev, key, on);
            if (on && key === "albin" && dist(ev, $gamePlayer) <= 5 && T.isCalm(SceneManager._scene)) { zapobiegl(ev); pokaz(ev, key, false); }
        }
    }
    // the action button on them: the Lord / Feliks - one line; the traces - read
    function zdarzenie_(interp, key) {
        if (!interp || !has() || !widoczne(key)) return;
        const ev = $gameMap.event(interp.eventId());
        if (key === "wosk" || key === "krata") {
            Watki.mowa.uruchom(interp, w.linie([], { id: -1, name: "" }, "slad." + key));
            slad(key, 1);
            return;
        }
        if (key === "albin" && ev) { zapobiegl(ev); return; }
    }
    // the council: the envoy held in the salon while it lasts (only on floor II, while the hero is there)
    let naradaTrzyma = false;
    function naradaTick() {
        const on = $gameMap.mapId() === D.MAP.apartamenty && widoczne("lord");
        if (on && !naradaTrzyma) { trzymaj(KTO.posel, true, D.NARADA.posel); naradaTrzyma = true; }
        else if (!on && naradaTrzyma) { trzymaj(KTO.posel, false); naradaTrzyma = false; }
    }

    // ==================================================================
    // 6. The clock: Ostap at the bonfire, the theft, the morning, the Kupała night's thought
    // ==================================================================
    let mysliKupala = -1;
    function zegar() {
        if (!has()) return;
        const s = S(), k = nocKradziezy(), d = day(), h = hour();
        // Ostap drinks at the bonfire (K 22:00 - K+1 6:00): out of his place at the door
        const pije = !!k && w.active("W14") && !!wpis(KTO.posel) && ((d === k && h >= 22) || (d === k + 1 && h < CZ.rano));
        if (pije && !s.ostapPije) { s.ostapPije = 1; gone(KTO.ostap, true); }
        else if (!pije && s.ostapPije) { s.ostapPije = 0; gone(KTO.ostap, false); }
        if (!otwarta() || !k) return;
        if (d === k && h >= 22 && mysliKupala !== k && [D.MAP.karczma, D.MAP.pietro, D.MAP.apartamenty].includes($gameMap.mapId())) { mysliKupala = k; w.mysl([tx("mysl.kupala")]); }
        if (!s.kradziez && (d > k + 1 || (d === k + 1 && h >= CZ.kradziez))) kradziez(k);
        if (s.kradziez && !s.rano && (d > s.kradziez || h >= CZ.rano)) rano();
    }

    // ==================================================================
    // 7. The ferry: Albin sails (with the letter - the leak; unexposed - the faction's scout), the envoy sails
    // ==================================================================
    T.on("podroznyOdplynal", e => {
        if (!e || !has() || e.jak !== "prom") return;
        try {
            const s = S();
            if (e.kto === KTO.albin) {
                if (w.active("W14") && s.list === "albin") {
                    s.albin = "uciekl";
                    s.koniec = "wyciek";
                    w.setFlag("poselstwoWyciek");
                    renoma(slady() >= D.SLADY.prog || tropy() >= D.TROPY.prog ? D.KARY.wyciekWskazal : D.KARY.wyciek, "w14Wyciek");
                    note("notatki.wyciek");
                    const q = TQ();
                    if (q && q.fail) q.fail("W14");
                } else if (!s.albin && !w.flag("pielgrzymZdemaskowany")) {
                    w.setFlag("pielgrzymDonosi");
                    if (w.active("W14")) { note("notatki.donosi"); if (!s.kradziez && !wpis(KTO.posel) && !byli(KTO.posel)) koniec("donosi"); }
                }
            }
            if (e.kto === KTO.posel && otwarta()) {
                if (w.at("w14Spokoj")) koniec("spokoj");
                else if (w.at("w14List")) koniec(s.oddany ? "oddany" : w.vcount("list_posla") > 0 ? "bezListu" : "oddany");
                else if (s.list === "bohater" || w.vcount("list_posla") > 0) koniec("bezListu");
                else koniec("brak");   // (no theft in his stay, or the letter still with Albin on the island: the envoy simply sails)
            }
        } catch (er) { report("odpływ", er); }
    }, { owner: PLUGIN });

    // ==================================================================
    // 8. Stage 2-3's mechanisms (each once it is there): the walls (room 15 at night, the Great salon), the night steps, the letter under
    //    the door, the search of room 15
    // ==================================================================
    const zarejestrowane = {};
    function mechanizmy() {
        const p = P();
        if (!p) return;
        const albinTu = () => otwarta() && !!wpis(KTO.albin) && !S().albin;
        if (!zarejestrowane.podsluch && p.podsluch && typeof p.podsluch.dodaj === "function") {
            zarejestrowane.podsluch = true;
            try {
                p.podsluch.dodaj({ id: "w14Okno", plik: "poselstwo", mapa: D.MAP.pietro, pokoj: "15", godziny: CZ.okno, kwestie: "podsluch.okno", prog: 5, raz: true,
                    gdy: () => albinTu() && day() === przyjazd(KTO.albin) + 1 && !S().tropy.okno });
                p.podsluch.dodaj({ id: "w14Narada", plik: "poselstwo", mapa: D.MAP.apartamenty, pokoj: "salon", godziny: D.NARADA.godziny, kwestie: "podsluch.narada", prog: 5, raz: true,
                    gdy: () => has() && w.active("W14") && day() === naradaDzien() && !!wpis(KTO.posel) });
            } catch (e) { report("podsłuch", e); }
        }
        if (!zarejestrowane.kroki && p.kroki && typeof p.kroki.dodaj === "function") {
            zarejestrowane.kroki = true;
            try {
                p.kroki.dodaj({ id: "w14Albin", kto: KTO.albin, arkusz: "$Npc_Pielgrzym", mapa: D.MAP.pietro, start: [41, 24, 8], trasa: [[41, 22], [44, 19], [70, 18], [88, 18], [92, 17]],
                    godziny: [CZ.albin[0], CZ.kradziez], raz: true,
                    gdy: () => { const k = nocKradziezy(); return albinTu() && !!k && day() === k + 1 && !S().kradziez && !S().zapobiegl && !!wpis(KTO.posel); },
                    koniec: ok => { if (ok && has()) { S().widziany = day(); S().slady.kroki = 2; } } });
            } catch (e) { report("kroki", e); }
        }
        if (!zarejestrowane.listy && p.listy && typeof p.listy.dodaj === "function") {
            zarejestrowane.listy = true;
            // (Intrygi reads its own words by `klucz` - ours come from `tekst`: [title, text])
            try { p.listy.dodaj({ id: "w14List", tekst: () => w.pair("list.albin"), gdy: () => albinTu() && !S().tropy.list && !S().kradziez, po: () => trop("list", 1) }); }
            catch (e) { report("listy", e); }
        }
        if (!zarejestrowane.przeszukanie && p.przeszukanie && typeof p.przeszukanie.dodaj === "function") {
            zarejestrowane.przeszukanie = true;
            try {
                p.przeszukanie.dodaj({ id: "w14Rozaniec", pokoj: "15", rzecz: "torba", kto: KTO.albin, plik: "poselstwo", klucz: "przeszukanie.rozaniec",
                    gdy: () => albinTu() && !S().tropy.rozaniec && !S().kradziez, po: () => trop("rozaniec", 1) });
                p.przeszukanie.dodaj({ id: "w14Notatki", pokoj: "15", rzecz: "kufer", kto: KTO.albin, plik: "poselstwo", klucz: "przeszukanie.notatki",
                    gdy: () => otwarta() && S().list === "albin" && !S().slady.notatki, po: () => slad("notatki", 2) });
            } catch (e) { report("przeszukanie", e); }
        }
    }
    mechanizmy();
    T.on("podsluch", e => {
        if (!e || !has()) return;
        if (e.id === "w14Okno") trop("okno", e.pelna ? 1 : 0.5);
        if (e.id === "w14Narada" && w.active("W14")) { S().narada = day(); if (e.pelna) note("notatki.narada"); xp(50); sprawdz(); }
    }, { owner: PLUGIN });

    // ==================================================================
    // 9. Act III (docs/PODROZNI.md 4.4)
    // ==================================================================
    (function echa() {
        const A3 = window.Act3Data;
        if (!A3 || !Array.isArray(A3.WAVES)) return;
        const fala = id => A3.WAVES.find(x => x && x.id === id);
        // the faction's knowledge: one scout more in wave 3 for any flag of the shared list (SwieteKosci.js installs it; here too, if not)
        const list = A3.WIEDZA_FRAKCJI = A3.WIEDZA_FRAKCJI || [];
        for (const f of D.ECHA.wiedza) if (!list.includes(f)) list.push(f);
        const w3 = fala("w3");
        if (w3 && !A3._wiedzaFrakcji) {
            A3._wiedzaFrakcji = PLUGIN;
            const orig = w3.extra;
            w3.extra = c => {
                const out = (typeof orig === "function" ? orig(c) : []) || [];
                const f = (c && c.flags) || {}, name = A3.TEXT && A3.TEXT.fale && A3.TEXT.fale.imiona ? A3.TEXT.fale.imiona.zwiadowca : "";
                if (f.w9FrakcjaPobita || out.some(x => x && x.name === name)) return out;
                if (list.some(k => f[k])) out.push({ kind: "knifer", name, lv: 0 });
                return out;
            };
        }
        // wave 3 one man fewer with Albin caught or misled - not added to ansgarAlly (W12) - nor counted twice
        if (w3 && !w3._w14) {
            w3._w14 = true;
            const origF = w3.fewer;
            w3.fewer = c => {
                const n = (typeof origF === "function" ? Number(origF(c)) || 0 : 0), f = (c && c.flags) || {};
                return n + (!f.ansgarAlly && D.ECHA.mniej.some(k => f[k]) ? 1 : 0);
            };
        }
        // one more man in wave 2 for any flag of its shared list (here: the leaked letter - one archer)
        const list2 = A3.WIEDZA_FALA2 = A3.WIEDZA_FALA2 || [];
        if (!list2.includes(D.ECHA.wyciekLucznik)) list2.push(D.ECHA.wyciekLucznik);
        const w2 = fala("w2");
        if (w2 && !A3._wiedzaFala2) {
            A3._wiedzaFala2 = PLUGIN;
            const orig2 = w2.extra;
            w2.extra = c => {
                const out = (typeof orig2 === "function" ? orig2(c) : []) || [], f = (c && c.flags) || {};
                if (!out.some(x => x && x._wiedza) && list2.some(k => f[k])) out.push({ kind: "archer", name: tx("akt3.lucznik"), lv: 0, _wiedza: true });
                return out;
            };
        }
        // the royal soldiers at favour 70 with the envoy grateful (with the bell, as always)
        if (Array.isArray(A3.DEFENDERS)) for (const d of A3.DEFENDERS) {
            if (!d || (d.key !== "garnizon" && d.key !== "garnizon_b") || d._w14) continue;
            const orig = d.when;
            d._w14 = true;
            d.when = c => { try { if (orig && orig(c)) return true; } catch (e) { /* (as false) */ } return !!(c && c.bell && c.flags && c.flags.poselWdzieczny) && favor() >= D.ECHA.wdzieczny; };
        }
    })();

    // ==================================================================
    // 10. The hooks of the data
    // ==================================================================
    w.haki({
        mowca: (ctx, key) => { const ev = evOf(key); return ev ? spkOf(ev) : null; },
        czujnosc: (ctx, n) => attr("per") >= Number(n),
        albinJest: () => !!wpis(KTO.albin),
        albinPoznany: () => { const s = ksiega(); return !!(s && s.poznani && s.poznani[KTO.albin]); },
        poPrzyjezdzieAlbina: () => { const d = przyjazd(KTO.albin); return !!d && day() > d; },
        poselJest: () => !!wpis(KTO.posel),
        tropyTrzy: () => tropy() >= D.TROPY.prog,
        tropyMniej: () => tropy() < D.TROPY.prog,
        sladyDwa: () => slady() >= D.SLADY.prog,
        naradaSlyszana: () => S().narada > 0,
        poNaradzie: () => { const n = naradaDzien(); return !!n && (day() > n || (day() === n && hour() >= D.NARADA.godziny[1])); },
        naMolo: () => { const e = wpis(KTO.albin); return $gameMap.mapId() === D.MAP.przystan && !!e && e.do === day() && inHours(hour(), [14, 15.1]); },
        w14Zmienne: () => {
            const s = S(), pe = wpis(KTO.posel), dzien = pe ? pe.do : "-";
            return { n: w.at("w14Sledztwo") ? Math.min(D.SLADY.prog, Math.floor(slady())) : Math.min(D.TROPY.prog, Math.floor(tropy())),
                posel: tx(pe ? "kroki.posel.jest" : "kroki.posel.czeka"), narada: naradaDzien() || "-", noc: nocKradziezy() || "-",
                ostap: s.kolacje > 0 ? tx("kroki.ostap") : "", dzien,
                list: fill(tx(s.oddany ? "kroki.list.kopia" : "kroki.list.ma"), { dzien }), spokoj: fill(tx(pe ? "kroki.spokoj.jest" : "kroki.spokoj.czeka"), { dzien }) };
        },
        trop: (ctx, k, v) => trop(k, v),
        slad: (ctx, k) => slad(k, 1),
        wieza: () => wieza(),
        kolacja: () => kolacja(),
        listOdebrany: () => listOdebrany(),
        albinLos: (ctx, how) => albinLos(how),
        oddaj: () => oddaj(),
        lordCzyta: (ctx, co) => lordCzyta(co),
        koniec: (ctx, how) => koniec(how),
        // F9: Albin (and from the 2nd jump the envoy and Ostap) on the island; the clues of the chapters before; the day of each chapter
        f9Przygotuj: ctx => {
            const k = Number(ctx.skok) || 1, s = S(), p = P();
            if (!p) return;
            if (day() < 37) $gameSystem._dayNightDay = 37;
            Object.assign(s, { koniec: "", albin: "", list: "", kradziez: 0, zapobiegl: 0, rano: 0, slady: {}, kopia: 0, oddany: 0, lordWie: 0, widziany: 0 });
            if (k < 3) Object.assign(s, { narada: 0, naradaDzien: 0, noc: 0 });
            if (k < 2) s.tropy = {};
            for (const it of ["taca_kolacja", "list_posla", "kopia_listu"]) w.vtake(it, 9);
            const q = TQ(), prom = d => { for (let x = d; x < d + 6; x++) if (q && q.isFerry ? q.isFerry(x) : (x - 1) % 3 === 0) return x; return d; };
            const zostan = key => { const e = wpis(key); if (e && e.do < day() + 3) Object.assign(e, { do: prom(day() + 3), zostal: 0 }); };
            if (!wpis(KTO.albin)) p.przyplyn(KTO.albin);
            zostan(KTO.albin);
            if (k >= 2) { if (!wpis(KTO.posel)) p.przyplyn(KTO.posel); zostan(KTO.posel); }
            if (k >= 3) { s.naradaDzien = day(); s.sluzba = day(); }
            if (k >= 4) { s.noc = day(); if (!s.narada) s.narada = day(); }
            if (k >= 5) {
                if (k === 6) { const f = prom(day()); if (f !== day()) $gameSystem._dayNightDay = f; }
                Object.assign(s, { kradziez: day(), list: "albin", rano: day(), noc: day() - 1 });
                s.kolacje = Math.max(1, s.kolacje);
                const e = wpis(KTO.albin);
                if (e) Object.assign(e, { do: k === 6 ? day() : prom(day() + 3), zostal: 1 });
            }
            if (k === 7) { s.list = "bohater"; w.vgive("list_posla", 1); s.slady = { wosk: 1, krata: 1 }; }
        }
    });

    // ==================================================================
    // 11. The clock and the bus
    // ==================================================================
    let ticks = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        try {
            scenaTick();
            if (++ticks % 15) return;
            zdarzeniaTick();
            naradaTick();
            if (ticks % 60 === 0) zegar();
        } catch (e) { report("zegar", e); }
    }, { owner: PLUGIN, name: "poselstwo" });
    const zegarBezpieczny = () => { if (!has()) return; try { zegar(); } catch (e) { report("zegar", e); } };
    T.on("hourChange", zegarBezpieczny, { owner: PLUGIN });
    T.on("dayStart", zegarBezpieczny, { owner: PLUGIN });
    T.on("mapReady", () => { scena.kroki = []; naradaTrzyma = false; bramaDodaj(); mechanizmy(); if (has()) { try { zdarzeniaTick(); zegar(); } catch (e) { report("mapa", e); } } }, { owner: PLUGIN });
    T.on("load", () => { scena.kroki = []; naradaTrzyma = false; mysliKupala = -1; }, { owner: PLUGIN });

    Object.assign(api, { D, stan: () => S(), naradaDzien, nocKradziezy, przyjazd, zdarzenie: zdarzenie_, trop, slad, wieza, kolacja, kradziez, rano, zapobiegl, oddaj, lordCzyta, kopia,
        koniec, zegar, sluzba, scena: { trwa: () => scena.kroki.length > 0 }, mechanizmy: () => Object.assign({}, zarejestrowane), brama: () => bramaJest });
    window.Poselstwo = T.register(PLUGIN, api);
})();
