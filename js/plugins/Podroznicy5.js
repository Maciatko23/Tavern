//=============================================================================
// Podroznicy5.js
//=============================================================================
// The ferry's travellers, stage 5 (docs/PODROZNI.md 2.3 - the second visit, 2.7, 2.13, I7, 4.4 - 2026-10-29) - the ENGINE of D44, D47
// and D48; the data: Podroznicy5_Data.js, the words: js/teksty/podroznicy5.txt. What the data cannot do:
//   - D44 "Podatek wojenny": the night of the payment (Erazm's arrival + 2): Feliks on the guests' corridor before room 4 22:40-23:20
//     (event 3080 - seen within 4 tiles), the talk behind the wall of room 4 at 23:00 (Podroznicy.podsluch - from room 2 or the door);
//     the report's endings (the Lord: w7PoborcaMonety and W7's night observation; Erazm told of Feliks: the garrison +5; the 20 G:
//     w7FeliksCzujny; silence); Erazm sailing with the report
//   - D47 "Wolna Kompania" (I7): the nights of noise till 1:00 (Renoma -1 a night, while nobody calms them); Hubert at arm-wrestling
//     (TavernLife.armWrestle, a rival a notch above Tadek) or at dice (TavernDice: Hubert as a rival of this matter only); the fist
//     fight in the tavern's yard (Humans.js - won or lost: respect); Wit throwing them out (kompaniaWroga, the next ferry); hired for
//     60 G (kompaniaNajeta); Grum (an ally of W8) talking them down
//   - D48 "Mapa Kruczej Wyspy" (Teofil, visit 2): the keepsake map, the fortress drawn (25 G, mapaTwierdzy), talked out of it, or his
//     sketch taken from the tube at night (Podroznicy.przeszukanie, stage 3 - caught: Renoma -3 and the sketch goes to the mainland)
//   - Act III (docs/PODROZNI.md 4.4): mapaTwierdzy - the shared list of the faction's knowledge (one scout more in wave 3);
//     kompaniaNajeta - two of the Company among the defenders after the bell; kompaniaWroga - one mercenary more in wave 4 (the shared
//     list of wave 4, one at most)
// API: window.Podroznicy5 (Tawerna.api("Podroznicy5")).

/*:
 * @target MZ
 * @plugindesc [etap 5] Sprawy podróżnych - silnik: D44 „Podatek wojenny” (noc u poborcy, raport), D47 „Wolna Kompania” (burdy, siłowanie, kości, bójka, Wit, najęcie, Grum), D48 „Mapa Kruczej Wyspy”, echa w Akcie III. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Podroznicy5_Data
 * @base Podroznicy
 * @orderAfter Poselstwo
 * @orderAfter Act3
 *
 * @help
 * ============================================================================
 * Podroznicy5.js - sprawy etapu 5 podróżnych (docs/PODROZNI.md)
 * ============================================================================
 * D44: w noc podatku (dwa dni po przyjeździe Erazma) Feliks przychodzi pod
 * czwórkę 22:40-23:20; o 23:00 rozmowę słychać przez ścianę z pokoju 2.
 * D47: Wolna Kompania hałasuje do 1:00 (Renoma -1 za noc), Hubert Szary:
 * siłowanie, kości, bójka na dziedzińcu, najęcie (60 G), Grum; kapral Wit.
 * D48: Teofil (wizyta 2) - mapa-pamiątka i twierdza na mapie.
 * F9 → „Wyspa i fabuła” → „Podróżni - sprawy etapu 5”: przeskok.
 * W skryptach: Podroznicy5.stan(), Podroznicy5.armOpts / diceOpts (testy).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.Podroznicy5Data;
    if (!T || !window.Watki || !D) throw new Error("Podroznicy5.js: brak TawernaCore.js / Watki.js / Podroznicy5_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Podroznicy5";
    const w = D.watek, KTO = D.KTO, D44 = D.D44, D47 = D.D47, D48 = D.D48;
    const fill = Watki.wstaw, C = Watki.mowa.C;
    const S = () => w.S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap;
    const P = () => T.api("Podroznicy") || window.Podroznicy || null;
    const TQ = () => T.api("TownQuests");
    const SB = () => T.api("SpeechBubbles");
    const tx = k => w.tekst(k);
    const report = (where, e) => console.error("[" + PLUGIN + "] " + where + ":", e);
    const inHours = (h, r) => (r[0] <= r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1]);
    const COIN = 314;
    // (the tests: armOpts / diceOpts - the bots' settings of the arm-wrestling and the dice table a talk starts)
    const api = { armOpts: null, diceOpts: null };

    // ==================================================================
    // 1. Who is on the island; the small things
    // ==================================================================
    const ksiega = () => { const p = P(); try { return p && has() ? p.stan() : null; } catch (e) { return null; } };
    const wpis = key => { const s = ksiega(); return s ? s.obecni[key] || null : null; };
    function przyjazd(key) {   // (the arrival of this visit - or of the last one, once gone)
        const e = wpis(key);
        if (e) return e.od;
        const s = ksiega(), b = s && s.byli[key];
        return b && b.length ? b[b.length - 1].od : 0;
    }
    const nocD44 = () => (has() && S().d44.noc) || (przyjazd(KTO.erazm) ? przyjazd(KTO.erazm) + D44.noc : 0);
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const odswiez = () => { const q = TQ(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const sprawdz = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); odswiez(); };
    const note = key => { const p = w.pair(key); if (p) T.call("Journal", "addNote", p[0], p[1]); };
    const attr = k => Number(T.call("Combat", "attr", k)) || 0;
    function zloto(n) { if (!(n > 0)) return; $gameParty.gainGold(n); T.popup(fill(tx("napis.zloto"), { n }), { icon: COIN, kind: "gold" }); }
    const renoma = (n, why) => { const p = P(); if (p && p.renoma) p.renoma(n, why); };
    const xp = (n, id) => T.call("Combat", "gainXp", n, tx("zadania." + id + ".title"), true);
    const zakoncz = (id, rw) => { const q = TQ(); if (q && q.finish && w.active(id)) q.finish(id, rw || {}); };
    const porazka = id => { const q = TQ(); if (q && q.fail && w.active(id)) q.fail(id); };
    const gone = (key, on) => { try { T.call("TownLife", "setGone", key, on); } catch (e) { report("gone", e); } };
    const feliksGone = () => !!T.call("TownLife", "gone", "feliks");
    // a popup over the hero (what he lacks - never a message box)
    function dymek(text) {
        if (!text) return;
        const sb = SB();
        if (sb && sb.say && window.$gamePlayer) sb.say($gamePlayer, text, 170); else T.popup(text, { color: "#ffcf8a" });
    }
    const kartyKronik = () => { const p = T.api("Pustelnia"); try { const r = p && p.state ? p.state().read : null; return r ? Object.keys(r).filter(k => r[k]).length : 0; } catch (e) { return 0; } };

    // ==================================================================
    // 2. D44 "Podatek wojenny" - the night, Feliks on the corridor, the report's endings
    // ==================================================================
    // (the Lord told: W7's night observation of Feliks, when W7 has not seen it yet - one of the "Dwa życia Feliksa")
    function dworNoc() {
        const Dw = T.api("Dwor");
        try { const st = Dw && Dw.state ? Dw.state() : null; if (st && st.obs && !st.obs.noc) st.obs.noc = day(); } catch (e) { report("dwór", e); }
    }
    function d44Koniec(how) {
        const s = S().d44;
        if (!has() || !w.active("D44") || s.koniec) return;
        s.koniec = how;
        if (how === "lord") { w.setFlag("w7PoborcaMonety"); dworNoc(); note("notatki.d44Lord"); }
        else if (how === "feliks") { w.setFlag("d44RaportFeliks"); T.call("Garnizon", "addFavor", D44.przychylnosc, tx("zadania.D44.title")); note("notatki.d44Feliks"); }
        else if (how === "donos") { zloto(D44.donos); w.setFlag("w7FeliksCzujny"); note("notatki.d44Donos"); }
        else { s.koniec = "milcz"; w.setFlag("d44RaportPoszedl"); note("notatki.d44Milczy"); }
        zakoncz("D44", { xp: D44.xp });
    }
    const F = D44.feliks;
    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function zdarzenie(key, a) {
        return { id: a.id, name: "", note: "<Podroznicy5:" + key + ">", x: a.x, y: a.y, pages: [{ conditions: Object.assign({}, COND), directionFix: false,
            image: { tileId: 0, characterName: a.sheet || "", direction: a.dir || 2, pattern: 1, characterIndex: a.index || 0 },
            list: [C(355, ["Podroznicy5.zdarzenie(this, " + JSON.stringify(key) + ");"]), C(0, [])], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0,
            priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true }] };
    }
    T.inject([F.map], { ids: [D.IDS[0], D.IDS[1]], owner: D.OWNER, build: (data, mapId) => (mapId === F.map ? [zdarzenie("feliks", F)] : []) });
    // Feliks before room 4: the night of the payment, Erazm here, D44 not over
    const feliksWidoczny = () => has() && !w.done("D44") && !S().d44.koniec && !!wpis(KTO.erazm) && day() === nocD44() && inHours(hour(), F.godziny) && !feliksGone();
    function pokaz(ev, on) {
        const st = ev._p5 || (ev._p5 = {});
        if (st.on !== on) {
            st.on = on;
            ev.setTransparent(!on);
            ev.setThrough(!on);
            const de = ev.event();
            if (on && de) de.name = tx("feliks.imie");
            if (on) { ev.locate(F.x, F.y); ev.setDirection(F.dir); }
        }
        if (!on && ev._trigger !== -1) ev._trigger = -1;
        else if (on && ev._trigger !== 0) ev._trigger = 0;
    }
    function feliksWidziany(ev) {
        const s = S().d44;
        if (!w.active("D44") || !w.at("d44Noc") || s.feliks) return;
        s.feliks = day();
        if (ev) $gameTemp.requestBalloon(ev, 1);
        w.mysl([tx("mysl.d44.feliks")]);
        sprawdz();
    }
    function feliksTick() {
        if ($gameMap.mapId() !== F.map) return;
        const ev = $gameMap.event(F.id);
        if (!ev) return;
        const on = feliksWidoczny();
        pokaz(ev, on);
        if (on && dist(ev, $gamePlayer) <= F.widzi && T.isCalm(SceneManager._scene)) feliksWidziany(ev);
    }
    function zdarzenie_(interp, key) {
        if (!interp || !has() || key !== "feliks" || !feliksWidoczny()) return;
        const ev = $gameMap.event(interp.eventId());
        feliksWidziany(ev);
        Watki.mowa.uruchom(interp, w.linie([], { id: interp.eventId(), name: tx("feliks.imie") }, "feliks.korytarz"));
    }

    // ==================================================================
    // 3. D47 "Wolna Kompania" - the noise, Hubert's games, the fight in the yard, the endings
    // ==================================================================
    const otwartaD47 = () => has() && w.active("D47") && !S().d47.koniec;
    function d47Koniec(how) {
        const s = S().d47, p = P();
        if (!otwartaD47()) return;
        s.koniec = how;
        if (how === "wit" || how === "krew") {
            w.setFlag("kompaniaWroga");
            if (how === "krew") w.setFlag("d47HubertZabity");
            else renoma(D47.renoma.wit, "d47Wit");
            note(how === "krew" ? "notatki.d47Krew" : "notatki.d47Wit");
            if (p && p.wyjazd && p.naPromie && wpis(KTO.kompania)) p.wyjazd(KTO.kompania, p.naPromie(day() + 1));
        } else if (how === "najeta") {
            w.setFlag("kompaniaNajeta");
            renoma(D47.renoma.spokoj, "d47Najeta");
            note("notatki.d47Najeta");
        } else {
            w.setFlag("kompaniaSpokoj");
            renoma(D47.renoma.spokoj, "d47Spokoj");
            note("notatki.d47Spokoj");
        }
        zakoncz("D47", { xp: how === "krew" ? 20 : D47.xp });
    }
    // the nights of noise: the evening before till 1:00 - counted from 1:00 of the next day (they came before that day; nobody calmed them)
    let burdaMysl = -1;
    function burdy() {
        const e = wpis(KTO.kompania), s = S().d47, d = day(), h = hour();
        if (!e || s.koniec || w.done("D47")) return;
        if (h >= D47.burda[0] && e.od < d && s.noc !== d) {
            s.noc = d;
            s.noce++;
            renoma(D47.renoma.burda, "d47Burda");
            T.popup(tx("napis.burda"), { top: true, color: "#ff9f8f" });
            odswiez();
        }
        // the hero in the tavern 22:00-1:00 hears them (once a night)
        const noc = h >= 22 ? d : h < D47.burda[0] ? d - 1 : -1;
        if (noc > 0 && noc >= e.od && burdaMysl !== noc && [D.MAP.karczma, D.MAP.pietro].includes($gameMap.mapId())) { burdaMysl = noc; w.mysl([tx("mysl.burda")]); }
    }
    // the dice rival of this matter (never at the tables by himself: not in OPP_ORDER)
    function hubertKosci() {
        const parts = T.api("TavernDice_parts"), O = parts && parts.data ? parts.data.OPPONENTS : null;
        if (O && !O.hubert) O.hubert = D.HUBERT_KOSCI;
        return !!(O && O.hubert);
    }
    hubertKosci();
    const hubertSpk = () => { const L = T.api("TownLife"), ev = L && L.eventOf ? L.eventOf(KTO.hubert) : null; return ev ? { id: ev.eventId(), name: tx("hubert.imie") } : { id: -1, name: tx("hubert.imie") }; };
    function poGrze(won) {
        if (!has()) return;
        if (won) { w.mysl([tx("mysl.d47.wygrana")]); d47Koniec("gra"); }
        else w.mysl([tx("mysl.d47.przegrana")]);
    }
    // arm-wrestling with Hubert (a notch above Tadek), for the stake
    function silowanie() {
        if (!otwartaD47()) return false;
        const H = D.HUBERT_SILOWANIE;
        const rv = { key: H.key, name: H.name, sub: H.sub, bust: H.bust, level: H.level, kicker: H.kicker, with: H.with, lines: H.lines };
        const ok = T.call("TavernLife", "armWrestle", Object.assign({ stake: D47.stawka, rival: rv }, api.armOpts || {}, { onEnd: res => { try { poGrze(!!(res && res.won)); } catch (e) { report("siłowanie", e); } } }));
        return !!ok;
    }
    // dice with Hubert at his stake (TavernDice says itself when the hero has too little)
    function kosci() {
        if (!otwartaD47() || !hubertKosci()) return false;
        const TD = window.TavernDice || T.api("TavernDice");
        if (!TD || !TD.start) return false;
        return !!TD.start(Object.assign({ opponent: "hubert", stake: D47.stawka }, api.diceOpts || {}, {
            onEnd: res => { try { poGrze(!!(res && (res.last ? res.last.won : res.won))); } catch (e) { report("kości", e); } } }));
    }
    // the fist fight: Hubert waits in the tavern's yard (Map008) - the hero comes near and it starts
    const BOJKA = "d47Bojka";
    let bojkaTrwa = false, bojkaBrak = 0;
    function bojkaTick() {
        const s = S().d47, H = T.api("Humans") || window.Humans;
        if (bojkaTrwa) {   // (the men cleared some other way - Humans.clear, a scene: after 5 s without his band Hubert is back to his day)
            if (H && H.band && H.band(BOJKA)) bojkaBrak = 0;
            else if (!bojkaBrak) bojkaBrak = Graphics.frameCount;
            else if (Graphics.frameCount - bojkaBrak > 300) { bojkaTrwa = false; bojkaBrak = 0; gone(KTO.hubert, false); }
            return;
        }
        if (!s.bojka || !otwartaD47() || $gameMap.mapId() !== D.MAP.miasto || !wpis(KTO.kompania)) return;
        const [x, y] = D47.podworze;
        if (dist($gamePlayer, { x, y }) > D47.zasieg || !T.isCalm(SceneManager._scene)) return;
        if (!H || !H.spawn) return;
        const o = { tag: BOJKA, name: tx("hubert.imie"), engaged: true, level: D47.poziom, gold: 0, loot: [], say: tx("hubert.bojka"), noBand: true };
        const h = H.spawn("mercenary", x, y, o) || (H.spawnNear ? H.spawnNear("mercenary", 3, 6, o) : null);
        if (!h) return;
        bojkaTrwa = true;
        gone(KTO.hubert, true);
    }
    function bojkaKoniec(jak, e) {
        if (bojkaTrwa) { bojkaTrwa = false; bojkaBrak = 0; gone(KTO.hubert, false); }
        if (!otwartaD47() || !S().d47.bojka) return;
        if (jak === "wygrana" && e && e.killed > 0) { d47Koniec("krew"); return; }
        w.mysl([tx(jak === "wygrana" ? "mysl.d47.wygrana" : "mysl.d47.bojkaKoniec")]);
        d47Koniec("bojka");
    }
    T.on("humansDone", e => { if (e && e.tag === BOJKA && has()) { try { bojkaKoniec("wygrana", e); } catch (er) { report("bójka", er); } } }, { owner: PLUGIN });
    T.on("heroRobbed", e => { if (e && e.tag === BOJKA && has()) { try { bojkaKoniec("przegrana", e); } catch (er) { report("bójka", er); } } }, { owner: PLUGIN });
    function d47Najmij() {
        if (!otwartaD47()) return;
        if ($gameParty.gold() < D47.najem) { dymek(fill(tx("d47.brak"), { cena: D47.najem })); return; }
        $gameParty.loseGold(D47.najem);
        d47Koniec("najeta");
    }

    // ==================================================================
    // 4. D48 "Mapa Kruczej Wyspy" - the keepsake, the fortress
    // ==================================================================
    const otwartaD48 = () => has() && w.active("D48") && !S().d48.koniec;
    function d48Pamiatka() {
        const s = S().d48;
        if (!has() || s.pamiatka) return;
        s.pamiatka = day();
        w.vgive("mapa_wyspy", 1);
        w.setFlag("mapaWyspyPamiatka");
        T.popup(tx("napis.mapa"), { top: true, color: "#ffe27a" });
    }
    function d48Koniec(how) {
        const s = S().d48;
        if (!otwartaD48()) return;
        s.koniec = how;
        if (how === "pomoz") { zloto(D48.zloto); w.setFlag("mapaTwierdzy"); note("notatki.d48Pomoc"); }
        else if (how === "przekonaj") { w.setFlag("mapaBezTwierdzy"); note("notatki.d48Bez"); }
        else if (how === "szkic") { w.setFlag("mapaSzkicZabrany"); note("notatki.d48Szkic"); }
        else { w.setFlag("mapaTwierdzy"); note("notatki.d48Zlapany"); }
        zakoncz("D48", { xp: how === "zlapany" ? 40 : D48.xp });
    }

    // ==================================================================
    // 5. Stage 2-3's mechanisms (each once it is there): the wall of room 4, the search of Teofil's tube
    // ==================================================================
    const zarejestrowane = {};
    function mechanizmy() {
        const p = P();
        if (!p) return;
        if (!zarejestrowane.podsluch && p.podsluch && typeof p.podsluch.dodaj === "function") {
            zarejestrowane.podsluch = true;
            try {
                p.podsluch.dodaj({ id: "d44Noc", plik: "podroznicy5", mapa: D.MAP.pietro, pokoj: "4", godziny: D44.godziny, kwestie: "podsluch.d44", prog: 5, raz: true,
                    gdy: () => has() && w.active("D44") && w.at("d44Noc") && day() === nocD44() && !!wpis(KTO.erazm) && !feliksGone() });
            } catch (e) { report("podsłuch", e); }
        }
        if (!zarejestrowane.przeszukanie && p.przeszukanie && typeof p.przeszukanie.dodaj === "function") {
            zarejestrowane.przeszukanie = true;
            try {
                p.przeszukanie.dodaj({ id: "d48Tuba", pokoj: "22", rzecz: "dowolna", kto: KTO.teofil, plik: "podroznicy5", klucz: "przeszukanie.tuba",
                    gdy: () => otwartaD48() && !!S().d48.plan, po: () => d48Koniec("szkic") });
            } catch (e) { report("przeszukanie", e); }
        }
    }
    mechanizmy();
    T.on("podsluch", e => {
        if (!e || !has() || e.id !== "d44Noc" || !w.active("D44")) return;
        const s = S().d44;
        s.slyszal = Math.max(s.slyszal || 0, e.pelna ? 1 : 0.5);
        sprawdz();
    }, { owner: PLUGIN });
    T.on("przeszukanie", e => { if (e && e.id === "d48Tuba" && e.zlapany && has()) { try { d48Koniec("zlapany"); } catch (er) { report("tuba", er); } } }, { owner: PLUGIN });

    // ==================================================================
    // 6. The ferry: Erazm sails with his report, the Company with its matter open, Teofil with the fortress
    // ==================================================================
    T.on("podroznyOdplynal", e => {
        if (!e || !has() || e.jak !== "prom") return;
        try {
            if (e.kto === KTO.erazm && w.active("D44") && !S().d44.koniec) {
                if (w.at("d44Raport")) d44Koniec("milcz");
                else porazka("D44");
            }
            if (e.kto === KTO.kompania && otwartaD47()) porazka("D47");
            if (e.kto === KTO.teofil && otwartaD48()) { w.setFlag("mapaTwierdzy"); porazka("D48"); }
        } catch (er) { report("odpływ", er); }
    }, { owner: PLUGIN });

    // ==================================================================
    // 7. Act III (docs/PODROZNI.md 4.4)
    // ==================================================================
    (function echa() {
        const A3 = window.Act3Data;
        if (!A3 || !Array.isArray(A3.WAVES)) return;
        const fala = id => A3.WAVES.find(x => x && x.id === id);
        // the faction's knowledge: one scout more in wave 3 for any flag of the shared list (installed by the first plugin of the list)
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
        // one mercenary more in wave 4 for any flag of its shared list (here: the Company thrown out)
        const list4 = A3.WIEDZA_FALA4 = A3.WIEDZA_FALA4 || [];
        for (const f of D.ECHA.fala4) if (!list4.includes(f)) list4.push(f);
        const w4 = fala("w4");
        if (w4 && !A3._wiedzaFala4) {
            A3._wiedzaFala4 = PLUGIN;
            const orig4 = w4.extra;
            w4.extra = c => {
                const out = (typeof orig4 === "function" ? orig4(c) : []) || [], f = (c && c.flags) || {};
                if (!out.some(x => x && x._fala4) && list4.some(k => f[k])) out.push({ kind: "mercenary", name: tx("akt3.najemnik"), lv: 1, _fala4: true });
                return out;
            };
        }
        // the Company hired: two of them through the yard's gate after the bell ("trzy i jeden"); its words read on every use
        if (Array.isArray(A3.DEFENDERS) && !A3.DEFENDERS.some(d => d && d.key === D.ECHA.kompania.key)) {
            const OB = Watki.scal({}, "podroznicy5", "obrona.kompania");
            const def = Object.assign({}, D.ECHA.kompania, { help: true, when: c => !!(c && c.bell && c.flags && c.flags.kompaniaNajeta && !c.flags.kompaniaWroga) });
            Object.defineProperty(def, "name", { get: () => OB.name || "", enumerable: true, configurable: true });
            Object.defineProperty(def, "lines", { get: () => ({ start: OB.start, hit: OB.hit, down: OB.down, win: OB.win }), enumerable: true, configurable: true });
            A3.DEFENDERS.push(def);
        }
    })();

    // ==================================================================
    // 8. The hooks of the data
    // ==================================================================
    const wieFeliks = () => !!S().d44.feliks || (S().d44.slyszal || 0) >= 1;
    w.haki({
        // D44
        erazmJest: () => !!wpis(KTO.erazm),
        d44Slyszal: () => (S().d44.slyszal || 0) > 0,
        d44WieFeliks: () => wieFeliks(),
        poNocyD44: () => { const n = nocD44(); return !!n && day() > n; },
        d44Zmienne: () => { const e = wpis(KTO.erazm); return { noc: nocD44() || "-", kto: tx(wieFeliks() ? "kroki.d44.feliks" : "kroki.d44.ktos"), dzien: e ? e.do : "-" }; },
        d44Koniec: (ctx, how) => d44Koniec(how),
        // D47
        kompaniaJest: () => !!wpis(KTO.kompania),
        poPierwszymWieczorze: () => { const e = wpis(KTO.kompania); return !!e && (day() > e.od || hour() >= 20); },
        d47Zmienne: () => ({ stawka: D47.stawka, cena: D47.najem, noce: S().d47.noce || 0 }),
        grumSojusznik: () => w.flag("grumAlly") && !w.flag("grumGone") && !w.flag("grumDead"),
        d47Stac: () => $gameParty.gold() >= D47.najem,
        d47Bojka: () => { if (otwartaD47() && !S().d47.bojka) { S().d47.bojka = day(); w.mysl([tx("mysl.d47.bojka")]); } },
        d47Najmij: () => d47Najmij(),
        d47Brak: () => dymek(fill(tx("d47.brak"), { cena: D47.najem })),
        d47Koniec: (ctx, how) => d47Koniec(how),
        // D48
        teofilWizyta2: () => { const e = wpis(KTO.teofil); return !!e && (e.wizyta || 1) >= 2; },
        d48Zmienne: () => ({ zloto: D48.zloto }),
        d48Przekona: () => kartyKronik() >= D48.karty || attr("wil") >= D48.hart,
        przeszukanieJest: () => { const p = P(); return !!(p && p.przeszukanie && typeof p.przeszukanie.dodaj === "function"); },
        d48Pamiatka: () => d48Pamiatka(),
        d48Koniec: (ctx, how) => d48Koniec(how),
        // F9: the traveller on the island for a few days more, the matter's state from its start, the day and the hour
        f9Przygotuj: ctx => {
            const k = Number(ctx.skok) || 1, p = P();
            if (!p) return;
            const zostan = key => { const e = wpis(key); if (e && e.do < day() + 3) Object.assign(e, { do: p.naPromie(day() + 3), zostal: 0 }); };
            if (k <= 2) {
                if (day() < 34) $gameSystem._dayNightDay = 34;
                if (!wpis(KTO.erazm)) p.przyplyn(KTO.erazm);
                zostan(KTO.erazm);
                Object.assign(S().d44, { slyszal: 0, feliks: 0, koniec: "", noc: day() });
                if (k === 2) Object.assign(S().d44, { slyszal: 1, feliks: day(), noc: Math.max(1, day() - 1) });
                if (p.podsluch && p.podsluch.zapomnij) p.podsluch.zapomnij("d44Noc");
            } else if (k === 3) {
                if (day() < 31) $gameSystem._dayNightDay = 31;
                if (!wpis(KTO.kompania)) p.przyplyn(KTO.kompania);
                zostan(KTO.kompania);
                Object.assign(S().d47, { hubert: 0, bojka: 0, noce: 0, noc: day(), borgar: 0, koniec: "" });
            } else if (k === 4) {
                if (day() < 40) $gameSystem._dayNightDay = 40;
                const e = wpis(KTO.teofil);
                if (e && (e.wizyta || 1) < 2) p.odplyn(KTO.teofil);
                const st = p.stan();
                st.wizyty = st.wizyty || {};
                if ((st.wizyty[KTO.teofil] || 0) < 1) st.wizyty[KTO.teofil] = 1;
                if (!wpis(KTO.teofil)) p.przyplyn(KTO.teofil);
                zostan(KTO.teofil);
                Object.assign(S().d48, { pamiatka: 0, plan: 0, koniec: "" });
                w.vtake("mapa_wyspy", 9);
            }
        }
    });

    // ==================================================================
    // 9. The clock and the bus
    // ==================================================================
    function zegar() {
        if (!has()) return;
        burdy();
    }
    let ticks = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        try {
            if (++ticks % 15) return;
            feliksTick();
            bojkaTick();
            if (ticks % 60 === 0) zegar();
        } catch (e) { report("zegar", e); }
    }, { owner: PLUGIN, name: "podroznicy5" });
    const zegarBezpieczny = () => { if (!has()) return; try { zegar(); } catch (e) { report("zegar", e); } };
    T.on("hourChange", zegarBezpieczny, { owner: PLUGIN });
    T.on("dayStart", zegarBezpieczny, { owner: PLUGIN });
    T.on("mapReady", () => {
        if (bojkaTrwa) { bojkaTrwa = false; bojkaBrak = 0; gone(KTO.hubert, false); }
        mechanizmy();
        hubertKosci();
        if (has()) { try { feliksTick(); zegar(); } catch (e) { report("mapa", e); } }
    }, { owner: PLUGIN });
    T.on("load", () => { burdaMysl = -1; bojkaTrwa = false; bojkaBrak = 0; }, { owner: PLUGIN });

    Object.assign(api, { D, stan: () => S(), nocD44, zdarzenie: zdarzenie_, silowanie, kosci, d44Koniec, d47Koniec, d48Koniec, d48Pamiatka, burdy, zegar,
        feliksWidoczny, bojka: { trwa: () => bojkaTrwa }, mechanizmy: () => Object.assign({}, zarejestrowane) });
    // (2026-10-29, etap 6) the Lord's letter of the 20th day before the deadline (day 40 of 60): a postscript about the tax collector
    // while D44 goes on (Story.js asks it) - the words: kod.letterPoborca in fabula.txt
    api.listPoborcy = () => { try { return has() && (w.active("D44") || (S().d44 && S().d44.noc && !S().d44.koniec && przyjazd(KTO.erazm))) ? "1" : ""; } catch (e) { return ""; } };
    window.Podroznicy5 = T.register(PLUGIN, api);
})();
