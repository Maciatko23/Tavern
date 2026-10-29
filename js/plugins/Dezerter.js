//=============================================================================
// Dezerter.js
//=============================================================================
// The chain W16 "Dezerter" (docs/PODROZNI.md 4.3, stage 4 of the ferry's travellers, 2026-10-29) - the ENGINE; the data:
// Dezerter_Data.js, the words: js/teksty/dezerter.txt. What the data cannot do:
//   - the hooks of the data: who is on the island (Podroznicy's book: Tymon "dezerter", Szczerba "lowczyni"), the days (the drum the
//     day after his ferry, Szczerba's night - her arrival + 3 or the night after the hero showed her the room), the clues, trust, the
//     words of the steps, the garrison's favour, the kantor open, Roch's debt
//   - Szczerba's night at room 5 (Map025, 23:00-2:00): she waits before his door (TownLife.hold); the hero may step between them (her
//     talk - time till her ferry / take him); nobody comes - at 2:00 she takes him ALIVE (the user's decision: the hunter never kills)
//   - her last day (8:00): Tymon still in his room after her grace - she takes him; hidden - her search (the place's chance), found or
//     not (then the camp: tymonOboz); her leaving and his leaving by the ferry with the matter not settled - the chain's own endings
//   - the endings: the garrison (Bełza takes the hero's word at favour 50: tymonGarnizon, favour +5), smuggled (Baltazar 50 G /
//     Roch: tymonPrzemyt), the camp (tymonOboz), given up (60 G the room / 80 G the pier: tymonWydany, Opinia -4), taken (tymonZabrany)
//   - Tymon outside the tavern's book (event 3060): in his hiding place (the belfry, grandpa's house, Kruczy Jar), in the garrison, in
//     the camp under the wall (or in Podgrodzie)
//   - the menus: Tymon's (the traveller's own - Podroznicy.js) "Szczerba cię szuka" and the bread (trust); Borgar's "Odstaw kubek do
//     góry dnem" (Szczerba's sign: the room shown, 60 G left for the hero)
//   - the scenes (simple: bubbles, balloons, a sound): the drum on the market, the hunter coming into the hall, the night at room 5,
//     the oath before Bełza
//   - the wall of room 5 (Podroznicy.podsluch - stage 2's mechanism; registered once it is there): "Nie podpalę!" - a clue, full or half
//   - Act III (docs/PODROZNI.md 4.4): tymonGarnizon - the royal soldiers come at favour 60 (not 80), Tymon with them; tymonOboz - Tomek
//     of the camp beside Rafał (when Rafał fights)
// Stage 3 (the night steps, the letters under the door) is not built: Dezerter.kuchnia({ nakarmil }) is Tymon followed to the kitchen
// at night (a clue; fed - trust), Dezerter.list(kto) a letter read (Tymon's - the talk at midnight; Szczerba's - the cup at Borgar's).
// API: window.Dezerter (Tawerna.api("Dezerter")).

/*:
 * @target MZ
 * @plugindesc [W16] Łańcuch „Dezerter” - silnik: Tomek z pokoju 5, Szczerba i jej noc pod piątką, rotmistrz Bełza, przemyt, kryjówki, Tymon w garnizonie albo w obozie, echa w Akcie III. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Dezerter_Data
 * @base Podroznicy
 * @orderAfter SwieteKosci
 * @orderAfter Garnizon
 * @orderAfter Act3
 *
 * @help
 * ============================================================================
 * Dezerter.js - łańcuch W16 „Dezerter” (docs/PODROZNI.md 4.3)
 * ============================================================================
 * Tomek (naprawdę Tymon Wrzos, dezerter) przypływa z drugą falą (dzień 25),
 * Szczerba - łowczyni nagród - promem po nim. Jej noc: trzy dni po
 * przyjeździe, 23:00-2:00 pod drzwiami pokoju 5 na piętrze gości. Szczerba
 * zawsze bierze Tymona żywego.
 * F9 → „Wyspa i fabuła” → „Wątek W16”: przeskok do rozdziału.
 * W skryptach: Dezerter.stan(), Dezerter.kuchnia(), Dezerter.list("tymon").
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.DezerterData;
    if (!T || !window.Watki || !D) throw new Error("Dezerter.js: brak TawernaCore.js / Watki.js / Dezerter_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Dezerter";
    const w = D.watek, KTO = D.KTO, TX = D.TX;
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
    const report = (where, e) => console.error("[Dezerter] " + where + ":", e);
    const COIN = 314;
    // (the tests: { los: 0-99 } - Szczerba's search roll)
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
    const dzienBebna = () => { const t = przyjazd(KTO.tymon); return t ? t + D.CZAS.beben : 0; };
    // her night: N 23:00 - N+1 2:00 (N: her arrival + 3, or the night after the hero showed her the room)
    const nocSzczerby = () => (has() && S().noc ? S().noc : przyjazd(KTO.szczerba) ? przyjazd(KTO.szczerba) + D.CZAS.noc : 0);
    function nocTeraz() {
        const n = nocSzczerby(), d = day(), h = hour();
        return !!n && ((d === n && h >= D.CZAS.nocGodziny[0]) || (d === n + 1 && h < D.CZAS.nocGodziny[1]));
    }
    const poNocy = () => { const n = nocSzczerby(), d = day(); return !!n && (d > n + 1 || (d === n + 1 && hour() >= D.CZAS.nocGodziny[1])); };
    const otwarta = () => has() && w.active("W16") && !S().koniec;
    const tymonWPokoju = () => !!wpis(KTO.tymon) && !S().koniec && S().plan !== "ukrycie";
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const evOf = key => { const L = TL(); const ev = L && L.eventOf ? L.eventOf(key) : null; return ev && !(ev._town && ev._town.hidden) && !ev.isTransparent() ? ev : null; };
    const punkty = o => Object.values(o || {}).reduce((a, v) => a + (v === true ? 1 : Number(v) || 0), 0);
    const tropy = () => punkty(S().tropy);
    const ufnosc = () => Object.keys(S().zaufanie).filter(k => S().zaufanie[k]).length;
    const odswiez = () => { const q = TQ(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const sprawdz = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); odswiez(); };
    const spkOf = ev => ({ id: ev ? ev.eventId() : -1, name: ev && ev.event() ? String(ev.event().name || "").replace(/\s*\(.*\)\s*$/, "") : "" });
    const note = (key, vars) => { const p = w.pair(key, vars); if (p) T.call("Journal", "addNote", p[0], p[1]); };
    const favor = () => { const G = T.api("Garnizon"); try { return G && G.favor ? G.favor() : 0; } catch (e) { return 0; } };
    const stop = interp => { if (interp && interp._list) interp._index = interp._list.length; };
    function zloto(n) {
        if (!(n > 0)) return;
        $gameParty.gainGold(n);
        T.popup(fill(tx("napis.zloto"), { n }), { icon: COIN, kind: "gold" });
    }
    const renoma = (n, why) => { const p = P(); if (p && p.renoma) p.renoma(n, why); };
    const opinia = n => T.call("TownQuests", "addOpinion", n, tx("zadania.W16.title"));
    function slawa(n) { if (T.call("QuestBoard", "addRep", n) !== undefined) T.popup(fill(tx("napis.slawa"), { n }), { top: true, color: "#9ff0a8" }); }
    const zakoncz = rw => { const q = TQ(); if (q && q.finish && w.active("W16")) q.finish("W16", rw || {}); };
    const trzymaj = (key, on, to) => { const L = TL(); try { if (L && L.hold) L.hold(key, on, to); } catch (e) { report("hold", e); } };

    // ==================================================================
    // 2. Scenes: bubbles, balloons and sounds in a row (never holding the hero)
    // ==================================================================
    const scena = { kroki: [], t: 0, mapa: 0 };
    function graj(kroki) { scena.kroki = kroki.slice(); scena.t = 0; scena.mapa = $gameMap.mapId(); }
    function scenaTick() {
        if (!scena.kroki.length) return;
        if ($gameMap.mapId() !== scena.mapa) { scena.kroki = []; return; }
        if (scena.t > 0) { scena.t--; return; }
        const k = scena.kroki.shift();
        const ch = typeof k.kto === "function" ? k.kto() : k.kto;
        if (k.tekst && ch && SB() && SB().say) SB().say(ch, k.tekst, k.klatki || D.BEBEN.dymek);
        if (k.emotka) for (const c of listOf(typeof k.kogo === "function" ? k.kogo() : ch)) if (c) $gameTemp.requestBalloon(c, k.emotka);
        if (k.dzwiek) T.audio.se(k.dzwiek[0], { volume: k.dzwiek[1] || 80, pitch: k.dzwiek[2] || 100 });
        if (k.mysl) w.mysl([k.mysl]);
        if (typeof k.zrob === "function") { try { k.zrob(); } catch (e) { report("scena", e); } }
        scena.t = k.czekaj || 0;
    }

    // ---------------------------------------------------------------- the drum on the market (the day after his ferry, 9-12)
    // the recruiter stands on the market that day (Garnizon: the day after a wave); Tymon is brought near him (TownLife.hold) - the
    // hero coming close: the drum, Tymon trembling, a clue
    let bebenTrzyma = false;
    function bebenTick() {
        const s = S();
        if ($gameMap.mapId() !== D.MAP.miasto) { bebenTrzyma = false; return; }
        if (bebenTrzyma && scena.kroki.length) return;   // (the scene plays: he stays by the drum till its end lets him go)
        const d = dzienBebna(), h = hour(), czas = !!d && day() === d && h >= D.CZAS.bebenGodziny[0] && h < D.CZAS.bebenGodziny[1] && !s.beben && !s.koniec;
        const werb = czas ? evOf("werbownik") : null, ty = czas ? evOf(KTO.tymon) : null;
        if (!werb || !ty) { if (bebenTrzyma) { trzymaj(KTO.tymon, false); bebenTrzyma = false; } return; }
        if (!bebenTrzyma) { trzymaj(KTO.tymon, true, D.BEBEN.tymon); bebenTrzyma = true; }
        if (scena.kroki.length || dist(ty, $gamePlayer) > D.BEBEN.widzi || dist(ty, { x: D.BEBEN.tymon[0], y: D.BEBEN.tymon[1] }) > 3 || !T.isCalm(SceneManager._scene)) return;
        s.beben = day();
        sprawdz();   // (the drum seen starts W16 - the clue comes at the scene's end)
        const gap = D.BEBEN.dymek + D.BEBEN.przerwa, drum = ["Blow2", 70, 55];
        graj([{ dzwiek: drum, czekaj: 18 }, { dzwiek: drum, czekaj: 18 }, { dzwiek: drum, kto: werb, tekst: tx("scena.beben.werbownik"), czekaj: 50 },
            { kto: ty, emotka: 6, czekaj: 30 }, { kto: ty, tekst: tx("scena.beben.tymon"), czekaj: gap },
            { mysl: tx("mysl.beben"), zrob: () => { trzymaj(KTO.tymon, false); bebenTrzyma = false; sprawdz(); if (w.active("W16")) trop("beben", 1); } }]);
    }
    // ---------------------------------------------------------------- the hunter comes into the hall (Map001, the evening she came)
    function wejscieTick() {
        const s = S();
        if (s.wejscie || $gameMap.mapId() !== D.MAP.karczma || scena.kroki.length) return;
        const e = wpis(KTO.szczerba), h = hour();
        if (!e || e.od !== day() || h < 18 || h >= 22) return;
        const sz = evOf(KTO.szczerba), borgar = T.call("TavernLife", "npc", "borgar");
        if (!sz || dist(sz, $gamePlayer) > 12 || !T.isCalm(SceneManager._scene)) return;
        s.wejscie = day();
        const reg = ["melia", "ozzy", "grum"].map(k => T.call("TavernLife", "npc", k)).filter(Boolean);
        graj([{ dzwiek: ["Door1", 70, 90], czekaj: 30 }, { kto: () => reg, emotka: 8, kogo: () => reg, czekaj: 40 },
            { kto: borgar || null, tekst: tx("scena.wejscie.borgar"), czekaj: 170 }, { kto: sz, tekst: tx("scena.wejscie.szczerba"), czekaj: 60 }]);
    }

    // ==================================================================
    // 3. The clues, trust, the endings
    // ==================================================================
    function trop(k, v) {
        const s = S();
        if (!k || !otwarta()) return;
        const before = tropy(), val = Math.max(Number(s.tropy[k]) || 0, Number(v) || 1);
        if (val === (Number(s.tropy[k]) || 0)) return;
        s.tropy[k] = val;
        const n = tropy();
        if (before < 2) T.popup(fill(tx("poszlaka.trop"), { n: Math.min(2, Math.floor(n)) }), { top: true, color: "#ffe27a" });
        if (before < 2 && n >= 2) note("notatki.tomek");
        sprawdz();
    }
    function ufa(k) {
        const s = S();
        if (!k || s.zaufanie[k] || !otwarta()) return;
        const before = ufnosc();
        s.zaufanie[k] = day();
        if (before < D.ZAUFANIE.prog && ufnosc() >= D.ZAUFANIE.prog) T.popup(tx("napis.ufa"), { kind: "good" });
    }
    function chleb() {
        const it = window.$dataItems && $dataItems[D.BREAD];
        if (!it || $gameParty.numItems(it) < 1) return false;
        $gameParty.loseItem(it, 1);
        ufa("chleb");
        return true;
    }
    // Tymon off the tavern's book now (he left the room: the garrison, the hiding place, the boat)
    function zKsiegi() { const p = P(); if (wpis(KTO.tymon) && p && p.odplyn) p.odplyn(KTO.tymon); }
    // Szczerba takes him (how: zabrany - her night, nobody came; oddal - the hero stood aside; wydany - the room shown; molo - the lie;
    // znaleziony - his hiding place found): ALIVE, in chains, by her ferry (he stays out of sight till then - TownLife's "gone")
    function zabierz(how) {
        const s = S();
        if (!otwarta()) return;
        s.koniec = how;
        trzymaj(KTO.szczerba, false);
        const sold = how === "wydany" || how === "molo";
        w.setFlag(sold ? "tymonWydany" : "tymonZabrany");
        const t = wpis(KTO.tymon), sz = wpis(KTO.szczerba), L = TL();
        if (t && sz && sz.do >= day()) { t.do = sz.do; if (L && L.setGone) L.setGone(KTO.tymon, true); }
        else zKsiegi();
        if (sold) opinia(D.OPINIA.wydany);
        if (how === "zabrany") renoma(D.RENOMA.zabrany, "w16Zabrany");
        note("notatki." + (how === "oddal" ? "zabrany" : how));
        zakoncz({});
    }
    // the room shown (Szczerba's talk, or the cup at Borgar's): 60 G at once; she comes the night after (tonight)
    function wskaz() {
        const s = S();
        if (!otwarta() || s.wskazal) return;
        s.wskazal = day();
        s.plan = "wydany";
        const h = hour();
        s.noc = h < D.CZAS.nocGodziny[1] ? day() - 1 : day();
        zloto(D.CENY.wskaz);
        note("notatki.list");
        if (w.at("w16Lowczyni") || w.at("w16Tomek") || w.at("w16Tymon")) w.complete(["w16Tomek", "w16Lowczyni", "w16Tymon"], { to: "w16Plan" });
        sprawdz();
    }
    // the lie of the pier: she pays 80 G as the chains close
    function molo() {
        if (!otwarta() || S().plan !== "molo") return;
        zloto(D.CENY.molo);
        zabierz("molo");
    }
    // the garrison: the hero's word to Bełza; Tymon reports himself (the oath)
    function garnizon() {
        const s = S();
        if (!otwarta()) return;
        s.koniec = "garnizon";
        w.setFlag("tymonGarnizon");
        zKsiegi();
        T.call("Garnizon", "addFavor", D.PRZYCHYLNOSC.nagroda, tx("zadania.W16.title"));
        renoma(D.RENOMA.dobrze, "w16Garnizon");
        slawa(D.SLAWA);
        note("notatki.garnizon");
        s.przysiega = day();
        zakoncz({ xp: D.XP.garnizon });
    }
    // away from the island: Baltazar's crate (50 G; the kantor knows) or Roch's cutter (free - the hero's done him a good turn)
    function przemyt(kto, interp) {
        const s = S();
        if (!otwarta() || s.plan !== "przemyt") return;
        if (kto === "baltazar") {
            if ($gameParty.gold() < D.CENY.baltazar) { T.popup.need(COIN, fill(tx("baltazar.brak"), { cena: D.CENY.baltazar })); stop(interp); return; }
            $gameParty.loseGold(D.CENY.baltazar);
        }
        s.koniec = "przemyt";
        w.setFlag("tymonPrzemyt");
        w.setFlag(kto === "baltazar" ? "tymonBaltazar" : "tymonRoch");
        zKsiegi();
        renoma(D.RENOMA.dobrze, "w16Przemyt");
        note(kto === "baltazar" ? "notatki.przemytBaltazar" : "notatki.przemytRoch");
        zakoncz({ xp: D.XP.przemyt });
    }
    // the hiding place: Tymon leaves his room tonight - till her ferry
    function ukryj(gdzie) {
        const s = S();
        if (!otwarta() || !D.TYMON.miejsca[gdzie]) return;
        Object.assign(s, { plan: "ukrycie", gdzie });
        trzymaj(KTO.szczerba, false);
        zKsiegi();
        if (w.at("w16Tymon")) w.complete("w16Tymon");
        sprawdz();
    }
    // her grace (the hero stood between them): till her ferry
    function zwloka() {
        const s = S(), sz = wpis(KTO.szczerba);
        if (!otwarta()) return;
        s.zwloka = sz ? sz.do : day() + 3;
        trzymaj(KTO.szczerba, false);
    }
    // her search of the hiding place (her last day): the place's chance; Ambroży who trusts the hero rings at a stranger's step
    function szukaj() {
        const s = S(), R = D.RYZYKO;
        if (!otwarta() || s.plan !== "ukrycie" || s.szukala) return;
        let p = R[s.gdzie] || 25;
        if (s.gdzie === "dzwonnica" && w.flag("ambrozyTrust")) p += R.ambrozy;
        p = Math.max(R.min, Math.min(R.max, p));
        const o = api.opts || {}, roll = typeof o.los === "number" ? o.los : Math.random() * 100;
        s.szukala = day();
        s.los = Math.round(roll);
        if (roll < p) { T.popup(tx("napis.znalazla"), { top: true, color: "#ff9f8f" }); zabierz("znaleziony"); return; }
        T.popup(tx("napis.szukala"), { top: true, color: "#9ff0a8" });
        s.koniec = "oboz";
        w.setFlag("tymonOboz");
        renoma(D.RENOMA.dobrze, "w16Oboz");
        slawa(2);
        note("notatki.oboz");
        zakoncz({ xp: D.XP.oboz });
    }
    // the night and her last day: by the clock (an hour, a new day, the map's tick - the hero may sleep through)
    function zegar() {
        if (!otwarta()) return;
        const s = S(), sz = wpis(KTO.szczerba);
        // her night passed with Tymon in his room, no grace: she took him (or after the room was shown)
        if (sz && tymonWPokoju() && !s.zwloka && poNocy() && nocSzczerby() >= sz.od) { zabierz(s.wskazal ? "wydany" : "zabrany"); return; }
        // her last day (the ferry's planning is done by 6:00 - a stay made longer moved her `do` already): 8:00
        if (sz && sz.do === day() && hour() >= D.CZAS.szukanie) {
            if (s.plan === "ukrycie") szukaj();
            else if (tymonWPokoju()) zabierz(s.zwloka ? "zabrany" : s.wskazal ? "wydany" : "zabrany");
        }
    }

    // ---------------------------------------------------------------- the night at room 5 (Map025): she waits at the door
    let nocDymek = -1, nocTrzyma = false;
    function nocTick() {
        const on = otwarta() && nocTeraz() && tymonWPokoju() && !S().zwloka && !!wpis(KTO.szczerba);
        if (!on || $gameMap.mapId() !== D.MAP.pietro) { if (nocTrzyma) { trzymaj(KTO.szczerba, false); nocTrzyma = false; } return; }
        const ev = TL() && TL().eventOf ? TL().eventOf(KTO.szczerba) : null;
        if (!ev) return;
        if (!(TL().held && TL().held(KTO.szczerba))) { trzymaj(KTO.szczerba, true, D.DRZWI.przed); nocTrzyma = true; }
        if (nocDymek !== nocSzczerby() && dist(ev, $gamePlayer) <= 8 && dist(ev, { x: D.DRZWI.przed[0], y: D.DRZWI.przed[1] }) <= 1.5 && SB() && SB().say) {
            nocDymek = nocSzczerby();
            SB().say(ev, tx("scena.noc.szczerba"), 200);
            $gameTemp.requestBalloon(ev, 8);
        }
    }

    // ==================================================================
    // 4. Tymon outside the book (event 3060): the hiding place, the garrison, the camp
    // ==================================================================
    const TY = D.TYMON;
    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    const MIEJSCE_MAP = {};
    for (const [k, m] of Object.entries(TY.miejsca)) MIEJSCE_MAP[m[0]] = k;
    function tymonDane(mapId) {
        const k = MIEJSCE_MAP[mapId], m = TY.miejsca[k];
        return { id: TY.id, name: "", note: "<Lancuchy:tymon>", x: m[1], y: m[2], pages: [{ conditions: Object.assign({}, COND), directionFix: false,
            image: { tileId: 0, characterName: TY.sheet, direction: m[3], pattern: 1, characterIndex: TY.index },
            list: [C(355, ["Dezerter.tymon(this);"]), C(0, [])], moveFrequency: 3, moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false },
            moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false, through: false, trigger: 0, walkAnime: true }] };
    }
    T.inject(Object.keys(MIEJSCE_MAP).map(Number), { ids: [TY.id, TY.id], owner: D.OWNER, build: (data, mapId) => (MIEJSCE_MAP[mapId] ? [tymonDane(mapId)] : []) });
    // where Tymon is now outside the book: the place's key (or "")
    function gdzieTymon() {
        if (!has()) return "";
        const s = S(), f = w.flags();
        if (s.plan === "ukrycie" && !s.koniec && s.gdzie) return s.gdzie;
        if (f.tymonGarnizon) return "garnizon";
        if (f.tymonOboz) { const q = TQ(); let camp = null; try { camp = q && q.w6 ? q.w6().camp : null; } catch (e) { camp = null; } return camp === "outside" ? "obozPoza" : "oboz"; }
        return "";
    }
    function tymonTick() {
        const ev = $gameMap.event(TY.id);
        if (!ev || !MIEJSCE_MAP[$gameMap.mapId()]) return;
        const A = T.api("Act3");
        let siege = false;
        try { siege = !!(A && A.phase && A.phase() === "siege"); } catch (e) { siege = false; }
        const on = !siege && MIEJSCE_MAP[$gameMap.mapId()] === gdzieTymon();
        const st = ev._lan || (ev._lan = {});
        if (st.on !== on) {
            st.on = on;
            ev.setTransparent(!on);
            ev.setThrough(!on);
            if (on) { const de = ev.event(); if (de) de.name = tx("tymon.imie"); }
        }
        if (!on && ev._trigger !== -1) ev._trigger = -1;
        else if (on && ev._trigger !== 0) ev._trigger = 0;
    }
    function tymon(interp) {
        if (!interp || !has()) return;
        const ev = $gameMap.event(interp.eventId()), k = MIEJSCE_MAP[$gameMap.mapId()];
        if (!ev || !k || k !== gdzieTymon()) return;
        const which = k === "obozPoza" ? "oboz" : k;
        Watki.mowa.uruchom(interp, w.linie([], { id: ev.eventId(), name: tx("tymon.imie") }, "miejsce." + which));
    }
    // the oath before Bełza (the garrison, right after his word): Tymon's event there and the captain
    function przysiegaTick() {
        const s = S();
        if (!s.przysiega || s.przysiega === -1 || $gameMap.mapId() !== D.MAP.garnizon || scena.kroki.length) return;
        const ty = $gameMap.event(TY.id), belza = evOf("rotmistrz");
        if (!ty || ty.isTransparent()) return;
        s.przysiega = -1;
        graj([{ czekaj: 30 }, { kto: ty, tekst: tx("scena.przysiega.tymon"), czekaj: 190 }, { kto: belza, tekst: tx("scena.przysiega.belza"), czekaj: 20 }]);
    }

    // ==================================================================
    // 5. The menus: Tymon's (the warning, the bread), Borgar's (the cup upside down)
    // ==================================================================
    const tymonOtwarty = () => otwarta() && !!wpis(KTO.tymon);
    T.talk.option({ owner: PLUGIN, who: KTO.tymon, id: "ostrzez", order: T.talk.ORDER.extra,
        when: () => tymonOtwarty() && !!wpis(KTO.szczerba) && !S().zaufanie.ostrzezony, label: () => tx("tymon.opcja.ostrzez"),
        run: ctx => { try { ufa("ostrzezony"); return w.linie([], spkOf(ctx.ev), "tymon.ostrzezenie"); } catch (e) { report("ostrzeżenie", e); return null; } } });
    T.talk.option({ owner: PLUGIN, who: KTO.tymon, id: "chleb", order: T.talk.ORDER.extra + 1,
        when: () => tymonOtwarty() && !S().zaufanie.chleb && !!window.$dataItems && $gameParty.numItems($dataItems[D.BREAD]) > 0, label: () => tx("tymon.opcja.chleb"),
        run: ctx => { try { return chleb() ? w.linie([], spkOf(ctx.ev), "tymon.chleb") : null; } catch (e) { report("chleb", e); return null; } } });
    T.talk.option({ owner: PLUGIN, who: "borgar", id: "kubek", order: T.talk.ORDER.extra + 20,
        when: () => otwarta() && !!S().kubek && !S().wskazal && !!wpis(KTO.szczerba) && tymonWPokoju(), label: () => tx("borgar.kubek"),
        run: ctx => {
            try {
                wskaz();
                return w.linie([], ctx.ev ? { id: ctx.ev.eventId(), name: "Borgar" } : { id: -1, name: "Borgar" }, "borgar.kubekDone");
            } catch (e) { report("kubek", e); return null; }
        } });

    // ==================================================================
    // 6. The wall of room 5 (Podroznicy.podsluch - the mechanism of stage 2): his dream at night
    // ==================================================================
    let podsluchJest = false;
    function podsluchDodaj() {
        const p = P();
        if (podsluchJest || !p || !p.podsluch || typeof p.podsluch.dodaj !== "function") return false;
        podsluchJest = true;
        try {
            p.podsluch.dodaj({ id: "w16Sen", plik: "dezerter", mapa: D.MAP.pietro, pokoj: D.DRZWI.pokoj, godziny: [0, 4], kwestie: "podsluch.sen", prog: 5, raz: true,
                gdy: () => otwarta() && tymonWPokoju() });
        } catch (e) { report("podsłuch", e); }
        return true;
    }
    podsluchDodaj();
    T.on("podsluch", e => { if (e && e.id === "w16Sen" && has()) trop("sen", e.pelna ? 1 : 0.5); }, { owner: PLUGIN });

    // ==================================================================
    // 7. Act III (docs/PODROZNI.md 4.4): the royal soldiers at favour 60 once Tymon serves with them (and he with them); Tomek of the
    //    camp beside Rafał when Rafał fights
    // ==================================================================
    (function echa() {
        const A3 = window.Act3Data;
        if (!A3 || !Array.isArray(A3.DEFENDERS)) return;
        const zTymonem = c => !!(c && c.bell && c.flags && c.flags.tymonGarnizon) && favor() >= D.PRZYCHYLNOSC.akt3;
        for (const d of A3.DEFENDERS) {
            if (!d || (d.key !== "garnizon" && d.key !== "garnizon_b") || d._w16) continue;
            const orig = d.when;
            d._w16 = true;
            d.when = c => { try { if (orig && orig(c)) return true; } catch (e) { /* (as false) */ } return zTymonem(c); };
        }
        const obronca = (base, when, words) => {
            const o = Object.assign({}, base, { when });
            Object.defineProperty(o, "name", { get: () => (TX.obrona && TX.obrona[words] ? TX.obrona[words].name : ""), enumerable: true, configurable: true });
            Object.defineProperty(o, "lines", { get: () => (TX.obrona ? TX.obrona[words] : null), enumerable: true, configurable: true });
            return o;
        };
        if (!A3.DEFENDERS.some(d => d && d.key === D.ECHA.garnizon.key)) A3.DEFENDERS.push(obronca(D.ECHA.garnizon, zTymonem, "garnizon"));
        if (!A3.DEFENDERS.some(d => d && d.key === D.ECHA.oboz.key)) A3.DEFENDERS.push(obronca(D.ECHA.oboz, c => !!(c && c.rafal === "ally" && c.flags && c.flags.tymonOboz), "oboz"));
    })();

    // ==================================================================
    // 8. The hooks of the data (conditions, words, actions, F9)
    // ==================================================================
    w.haki({
        mowca: (ctx, key) => { const ev = evOf(key); return ev ? spkOf(ev) : null; },
        tymonJest: () => !!wpis(KTO.tymon),
        lowczyniJest: () => !!wpis(KTO.szczerba),
        tymonPoznany: () => { const s = ksiega(); return !!(s && s.poznani && s.poznani[KTO.tymon]); },
        poBebnie: () => { const d = dzienBebna(); return !!d && day() > d; },
        tropyDwa: () => tropy() >= 2,
        nocTrwa: () => otwarta() && nocTeraz() && tymonWPokoju() && !S().zwloka && !!wpis(KTO.szczerba),
        // (the talk at midnight counts too - it is said in it)
        ufaPrzySpowiedzi: () => ufnosc() + (S().zaufanie.spowiedz ? 0 : 1) >= D.ZAUFANIE.prog,
        maChleb: () => !!window.$dataItems && $gameParty.numItems($dataItems[D.BREAD]) > 0,
        kantorOtwarty: () => !w.flag("w5Zamkniety") && !w.flag("w5BaltazarWrog"),
        rochGotow: () => w.done("D20") && !w.flag("d20Wydany"),
        przychylnoscBelzy: () => favor() >= D.PRZYCHYLNOSC.belza,
        w16Zmienne: () => {
            const s = S(), sz = wpis(KTO.szczerba), plan = s.plan || "brak";
            const words = { dzien: sz ? sz.do : "-", fv: favor(), prog: D.PRZYCHYLNOSC.belza, cena: plan === "molo" ? D.CENY.molo : D.CENY.baltazar,
                gdzie: s.gdzie ? tx("gdzie." + s.gdzie) : "", noc: nocSzczerby() || "-" };
            return Object.assign(words, { n: Math.min(2, Math.floor(tropy())), beben: dzienBebna() || "-",
                lowczyni: tx(sz ? "kroki.lowczyni.jest" : "kroki.lowczyni.czeka"), plan: fill(tx("kroki.plan." + plan) || "", words) });
        },
        // actions
        trop: (ctx, k, v) => trop(k, v),
        ufa: (ctx, k) => ufa(k),
        chleb: () => chleb(),
        wskaz: () => wskaz(),
        molo: () => molo(),
        garnizon: () => garnizon(),
        przemyt: (ctx, kto) => przemyt(kto, ctx.interp),
        ukryj: (ctx, gdzie) => ukryj(gdzie),
        zwloka: () => zwloka(),
        zabierz: (ctx, how) => zabierz(how),
        // F9: Tymon (and from the 2nd jump Szczerba) on the island; the clues, trust and the plan of the chapters before; the 4th - her
        // night tonight; the 5th - favour 55 (Bełza); the 7th - hidden in the belfry, her last day
        f9Przygotuj: ctx => {
            const k = Number(ctx.skok) || 1, s = S(), p = P(), L = TL();
            if (!p) return;
            if (day() < 25) $gameSystem._dayNightDay = 25;
            Object.assign(s, { plan: "", gdzie: "", noc: 0, zwloka: 0, wskazal: 0, kubek: 0, belzaNie: 0, koniec: "", szukala: 0, los: -1, przysiega: 0 });
            if (L && L.setGone) L.setGone(KTO.tymon, false);
            trzymaj(KTO.szczerba, false);
            // (both stay at least three days from now - a jump never lands on their leaving)
            const q = TQ(), prom = d => { for (let x = d; x < d + 6; x++) if (q && q.isFerry ? q.isFerry(x) : (x - 1) % 3 === 0) return x; return d; };
            const zostan = key => { const e = wpis(key); if (e && e.do < day() + 3) Object.assign(e, { do: prom(day() + 3), zostal: 0 }); };
            if (!wpis(KTO.tymon)) p.przyplyn(KTO.tymon);
            zostan(KTO.tymon);
            if (k >= 2) {
                if (!wpis(KTO.szczerba)) p.przyplyn(KTO.szczerba);
                zostan(KTO.szczerba);
                for (const j of ["rafal", "darin"]) if (tropy() < 2) s.tropy[j] = 1;
            }
            // (her night: tonight for the 4th jump, else three nights on - an older visit's night never takes him at once)
            s.noc = k === 4 ? day() : day() + D.CZAS.noc;
            if (k >= 5) { s.zaufanie.spowiedz = s.zaufanie.spowiedz || day(); }
            if (k === 5) { s.plan = "garnizon"; const f = favor(); if (f < 55) T.call("Garnizon", "addFavor", 55 - f, "F9", true); }
            if (k === 6) s.plan = "przemyt";
            if (k === 7) {
                Object.assign(s, { plan: "ukrycie", gdzie: "dzwonnica" });
                zKsiegi();
                // (her last day: no ferry longer - the search at 8:00)
                const sz = wpis(KTO.szczerba);
                if (sz) { sz.zostal = 1; if (sz.do > day()) $gameSystem._dayNightDay = sz.do; }
            }
        }
    });

    // ==================================================================
    // 9. The clock and the bus
    // ==================================================================
    let ticks = 0;
    T.onMapUpdate(() => {
        if (!has()) return;
        try {
            scenaTick();
            if (++ticks % 15) return;
            tymonTick();
            nocTick();
            bebenTick();
            wejscieTick();
            przysiegaTick();
            if (ticks % 60 === 0) zegar();
        } catch (e) { report("zegar", e); }
    }, { owner: PLUGIN, name: "dezerter" });
    const zegarBezpieczny = () => { if (!has()) return; try { zegar(); } catch (e) { report("zegar", e); } };
    T.on("hourChange", zegarBezpieczny, { owner: PLUGIN });
    T.on("dayStart", zegarBezpieczny, { owner: PLUGIN });
    T.on("mapReady", () => { scena.kroki = []; bebenTrzyma = false; nocTrzyma = false; podsluchDodaj(); if (has()) { try { tymonTick(); } catch (e) { report("mapa", e); } } }, { owner: PLUGIN });
    T.on("load", () => { scena.kroki = []; nocDymek = -1; bebenTrzyma = false; }, { owner: PLUGIN });
    // the ferry: Szczerba sails with the matter not settled (her search, or she takes him along); Tymon sails before anyone came - the
    // chain lost; Tymon gone with her - he is no longer "gone" in the town
    T.on("podroznyOdplynal", e => {
        if (!e || !has()) return;
        try {
            if (e.kto === KTO.tymon) { const L = TL(); if (L && L.gone && L.gone(KTO.tymon) && L.setGone) L.setGone(KTO.tymon, false); }
            if (e.jak !== "prom" || !otwarta()) return;
            const s = S();
            if (e.kto === KTO.szczerba) {
                if (s.plan === "ukrycie") szukaj();
                else if (wpis(KTO.tymon)) zabierz(s.wskazal ? "wydany" : "zabrany");
            } else if (e.kto === KTO.tymon) {
                s.koniec = "odplynal";
                note("notatki.odplynal");
                renoma(D.RENOMA.bezKonca, "bezKonca:" + KTO.tymon);
                const q = TQ();
                if (q && q.fail) q.fail("W16");
            }
        } catch (er) { report("odpływ", er); }
    }, { owner: PLUGIN });

    // ---------------------------------------------------------------- stage 3's doors (not built yet)
    // I4: Tymon followed to the kitchen at night (a clue; fed - trust); I5: a letter under the door read
    function kuchnia(o) { if (!otwarta()) return false; trop("kuchnia", 1); if (o && o.nakarmil) ufa("chleb"); return true; }
    // (-> the letter's words for the reader, or "" - Tymon's asks for the talk at midnight, Szczerba's tells of the cup at Borgar's)
    function list(kto) {
        if (!otwarta()) return "";
        if (kto === "lowczyni" || kto === KTO.szczerba) { S().kubek = S().kubek || day(); return fill(tx("list.szczerba"), { cena: D.CENY.wskaz }); }
        return kto === "tymon" || kto === KTO.tymon ? tx("list.tymon") : "";
    }

    Object.assign(api, { D, stan: () => S(), nocSzczerby, nocTeraz, dzienBebna, gdzieTymon, tymon, trop, ufa, wskaz, zwloka, zabierz, szukaj, zegar, kuchnia, list,
        scena: { trwa: () => scena.kroki.length > 0 }, podsluch: () => podsluchJest });
    window.Dezerter = T.register(PLUGIN, api);
})();
