//=============================================================================
// Mlyn.js
//=============================================================================
// The thread W19 "Sygnały z młyna" (docs/zadania_nowe/sygnaly_z_mlyna.md, 2026-11-12) - the ENGINE; the data: Mlyn_Data.js, the words:
// js/teksty/mlyn.txt, the interior: Map217 "Młyn" (tools/sygnaly/build_mlyn.py). What the data cannot do:
//   - the four poses of the sails (A plus "cisza", B iks "towar", C left slant "zatoczka", D right slant "pochylnia") on the town's own event
//     "Skrzydła wiatraka" (found by NAME on Map008; the user edits the map), the smugglers' evenings (19:30 / 20:15, held to 05:00), a turn
//     between two poses by the shorter way (7 ticks a frame, the creak), nothing runs while the sails turn on their own (the cost at rest is 0)
//   - the observation of the evenings (three, four when the book is torn out), the book page in the Archive (Map119), Roch's lantern pattern
//   - chapter 1: Walenty's night by the mill (S1: the sails move by themselves) or the spare key and the night in the empty mill
//   - chapter 2: the lookout Lasica in the drying yard of the town (the hero must be sneaking: Hunting.sneaking()), S2 "Lunetą", an optional ambush
//   - chapter 4: Walenty, Jasiek (three ways), the allies (Wit's menu), Ozzy's forecast (tide + wind), the lever of the brake in the axle chamber
//     (the mini-game "Ustaw skrzydła": arrows choose a pose, OK confirms, the second one a quarter of an hour later)
//   - chapter 5: the night in the cove of Przystan (Map125): the hero takes the lookout's place, the lantern talk (mini-game "Rozmowa światłami",
//     8 seconds, 1 or 2 chances), the boat at high tide, the ambush (Humans), three exits (Sambor / alone with Roch / the market), S5 the morning
// API: window.Mlyn (Tawerna.api("Mlyn")): stan(), poza(L), pozaTeraz(), dzwignia(), okno(), slad(k), debug*.
// Not built (said in the report): the D (pochylnia) landing as a second ambush site, the telescope and the shuttered lantern as items, Walenty's
// D2 "Mąka bez młyna" follow-up, the W5 "double" third choice, Roch's own boat night (D20), the Black Eyes' seal in the cave.

/*:
 * @target MZ
 * @plugindesc [W19] Wątek „Sygnały z młyna” - silnik: pozy skrzydeł, kod, obserwacja, wypatrywacz, wnętrze młyna (Map217), ustawianie skrzydeł, noc w zatoczce, mini-gry. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Mlyn_Data
 * @base TownLife
 * @base TawernaUI
 * @orderAfter Majster
 *
 * @help
 * ============================================================================
 * Mlyn.js - wątek W19 „Sygnały z młyna”
 * ============================================================================
 * Od dnia 24, wieczorem przy młynie albo w tawernie, Walenty prosi o czuwanie.
 * F9 → „Wyspa i fabuła” → „Wątek W19”: rozdział, poza skrzydeł, zmierzch,
 * łódź, kod. W skryptach: Mlyn.stan(), Mlyn.poza("B"), Mlyn.debugGo(n).
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.MlynData;
    if (!T || !window.Watki || !D) throw new Error("Mlyn.js: brak TawernaCore.js / Watki.js / Mlyn_Data.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "Mlyn";
    const w = D.watek, TX = D.TX, fill = Watki.wstaw, C = Watki.mowa.C;
    const S = () => w.S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const has = () => !!window.$gameSystem && !!window.$gameMap && !!window.$gameParty;
    const TL = () => T.api("TownLife");
    const TQ = () => T.api("TownQuests");
    const SB = () => T.api("SpeechBubbles");
    const tx = k => w.tekst(k);
    const tx1 = k => { const v = w.tekst(k); return Array.isArray(v) ? v[0] : v; };
    const report = (where, e) => console.error("[Mlyn] " + where + ":", e);
    const COIN = 314;
    const inHours = (h, a) => h >= a[0] && h < a[1];
    const mapId = () => ($gameMap ? $gameMap.mapId() : 0);
    const api = { opts: null, anim: null, pose: null, last: -1, nocDzien: 0 };

    // ==================================================================
    // 1. Basics: gold, XP, notes, the talk builders
    // ==================================================================
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    function zlato(n) {
        if (!(n > 0) || !has()) return;
        $gameParty.gainGold(n);
        T.popup(fill(tx("napis.zloto"), { n }), { icon: COIN, kind: "gold" });
    }
    const platnosc = n => { if ($gameParty.gold() < n) return false; $gameParty.loseGold(n); T.popup(fill(tx("napis.zaplata"), { n }), { icon: COIN, kind: "gold" }); return true; };
    const opinia = n => T.call("TownQuests", "addOpinion", n, tx("zadania.W19.title"));
    const xp = n => T.call("Combat", "gainXp", n, tx("zadania.W19.title"), true);
    const opiniaNow = () => { try { return TQ().state().opinion || 0; } catch (e) { return 0; } };
    const odswiez = () => { const q = TQ(); if (q && q.refreshMarkers) q.refreshMarkers(); };
    const sprawdzQ = () => { const q = TQ(); if (q && q.autoChecks) q.autoChecks(); odswiez(); };
    const note = (key, vars) => { const p = w.pair(key, vars); if (p) T.call("Journal", "addNote", p[0], p[1]); };
    const spkOf = key => { const L = TL(), ev = L && L.eventOf ? L.eventOf(key) : null; return { id: ev ? ev.eventId() : -1, name: w.tekstMoze(key + ".imie") || "" }; };
    const spkEv = (key, ev) => ({ id: ev ? ev.eventId() : spkOf(key).id, name: w.tekstMoze(key + ".imie") || "" });
    const linie = (out, sp, key, vars) => w.linie(out, sp, key, vars);
    const skrypt = (out, code) => Watki.mowa.script(out, code);
    const wybor = (out, labels, branches, cancel) => Watki.mowa.choiceTo(out, labels, branches, cancel);
    const bran = (sp, key, vars, code) => { const o = []; if (key) linie(o, sp, key, vars); if (code) skrypt(o, code); return o; };
    const uruchom = (interp, list) => Watki.mowa.uruchom(interp || null, list);
    const popupInfo = text => T.popup(text, { color: "info" });
    const HERO = Watki.mowa.HERO;
    const wait = (out, n) => out.push({ code: 230, indent: 0, parameters: [n] });
    const bars = on => { try { T.call("CleanHUD", "sceneBars", !!on); } catch (e) { /* no HUD */ } };
    const say = (ev, text, frames) => { const sb = SB(); if (sb && sb.say && ev) sb.say(ev, text, frames || 150); };
    const evId = id => ($gameMap && $gameMap.event(id)) || null;
    // lights are read from the map's <Light> events whatever their transparency: a light that is "off" is moved far off the map
    const gas = e => { if (e) { e.setTransparent(true); e.setThrough(true); e.locate(-60, -60); } };

    // ==================================================================
    // 2. State, the thread's clock, the days
    // ==================================================================
    const aktywny = () => has() && !!S().start && !S().koniec;
    // the evening a night belongs to (before 05:00 it is still the day before)
    const wieczorDzien = () => (hour() < D.KOD.koniec ? day() - 1 : day());
    const burza = d => { try { const S2 = window.Survival, p = S2 && S2.weatherPlan ? S2.weatherPlan(d) : null; return !!(p && p.storm); } catch (e) { return false; } };
    const przyplyw = (d, h) => { try { const W = T.api("Wyspa") || window.Wyspa; return W && W.tide ? W.tide(d, h).level : 1; } catch (e) { return 1; } };
    // a good night for the boat (the evening d): no storm on d or d + 1, a high water at 2:00 of d + 1
    const nocDobra = d => api.nocWymus === false ? false : (api.nocWymus === true || (!burza(d) && !burza(d + 1) && przyplyw(d + 1, D.CZAS.przybija) >= D.POGODA.przyplyw));
    function szukajNocy(od) { for (let d = od; d <= od + D.POGODA.dniPrzod; d++) if (nocDobra(d)) return d; return 0; }
    // the chapter from the thread's own state (the journal's step follows the same conditions; a debug jump back works too)
    const rozdzial = () => {
        if (!has()) return 0;
        const s = S();
        if (!s.start) return 0;
        if (s.koniec) return 6;
        return !s.cz1.scena ? 1 : !s.ch2.podsluch ? 2 : !s.kod.gotowe ? 3 : !s.ch4.set ? 4 : 5;
    };

    // ==================================================================
    // 3. The sails: four poses, the schedule of the smugglers, a turn by the shorter way
    // ==================================================================
    let skrzydlaEv = null, skrzydlaMap = 0;
    function skrzydla() {
        if (mapId() !== D.MAP.miasto) return null;
        if (skrzydlaEv && skrzydlaMap === $gameMap._mapId && $gameMap.event(skrzydlaEv._eventId) === skrzydlaEv) return skrzydlaEv;
        skrzydlaEv = null;
        for (const e of $gameMap.events()) if (e.event() && e.event().name === D.WIATRAK.skrzydla) { skrzydlaEv = e; skrzydlaMap = $gameMap._mapId; break; }
        return skrzydlaEv;
    }
    const kat = L => D.POZA_KLATKA[L];
    // frame f (0-11) -> [sheet, direction] (the sheets are 3 x 4 of 12 frames: f/4 -> sheet, f%4 -> row down/left/right/up)
    const KLATKA_ARKUSZ = ["!$Wiatrak_Skrzydla", "!$Wiatrak_Skrzydla_2", "!$Wiatrak_Skrzydla_3"], KLATKA_KIERUNEK = [2, 4, 6, 8];
    const klatkaImg = f => [KLATKA_ARKUSZ[Math.floor(((f % 12) + 12) % 12 / 4)], KLATKA_KIERUNEK[(((f % 12) + 12) % 12) % 4]];
    function ustawKlatke(ev, f) {
        const [sh, dir] = klatkaImg(f);
        ev._moveType = 0; ev._moveRouteForcing = false;
        ev.setImage(sh, 0); ev.setDirectionFix(false); ev.setDirection(dir); ev.setDirectionFix(true);
        ev.setPattern(1); ev._originalPattern = 1; ev.setWalkAnime(false); ev.setStepAnime(false);
    }
    // the pose NOW wanted by the thread: a letter, or null (the sails turn on their own)
    function pozaTeraz() {
        if (api.forced) return api.forced;
        if (!has() || !aktywny()) return null;
        const h = hour(), s = S();
        if (h >= D.KOD.koniec && h < D.KOD.p1) return null;
        const dz = wieczorDzien();
        const para = s.ch4.set === dz && s.ch4.poza.length === 2 ? s.ch4.poza : D.KOD.harmonogram[((dz % 4) + 4) % 4];
        return h >= D.KOD.p1 && h < D.KOD.p2 ? para[0] : para[1];
    }
    // set a pose at once (no turn) or by a turn; L = null: back to the town's own turning
    function poza(L, bezObrotu) {
        // (2026-11-15, nowy świat) the windmill of Podgrodzie has no sails event: its sails are Wiatrak.js's turning picture - a
        // pose stops them at its angle (frame f of the old sheets = 22.5 + 7.5 f degrees), null lets them turn with the wind again
        const W = window.Wiatrak;
        if (mapId() === D.MAP.miasto && !skrzydla() && W && typeof W.hold === "function") {
            if ((api.pose || null) !== (L || null) && L) { try { T.audio.se("Wood1", { volume: 55, pitch: 70 }); } catch (e) { /* no audio */ } }
            api.pose = L || null; api.anim = null;
            W.hold(L ? (22.5 + 7.5 * kat(L)) * Math.PI / 180 : null, !!bezObrotu);
            return true;
        }
        const ev = skrzydla();
        if (!ev) { api.pose = L || null; return false; }
        if (!L) {
            api.pose = null; api.anim = null;
            ev.setDirectionFix(false); ev._pageIndex = -2; ev.refresh();
            return true;
        }
        if (api.pose === L && !api.anim) return true;
        const prev = api.pose, from = prev ? (api.anim ? api.anim.f : kat(prev)) : 0, to = kat(L);
        api.pose = L;
        if (bezObrotu || !prev) { api.anim = null; ustawKlatke(ev, to); return true; }
        let d = (to - from + 12) % 12; if (d > 6) d -= 12;
        api.anim = { f: from, to, step: d > 0 ? 1 : -1, n: Math.abs(d), t: 0 };
        if (!api.anim.n) { api.anim = null; ustawKlatke(ev, to); return true; }
        try { T.audio.se("Wood1", { volume: 55, pitch: 70 }); } catch (e) { /* no audio */ }
        return true;
    }
    function obrotTick() {
        const a = api.anim, ev = skrzydla();
        if (!a || !ev) return;
        if (a.t++ % 7) return;
        a.f += a.step; a.n--;
        ustawKlatke(ev, a.f);
        if (a.n <= 0) api.anim = null;
    }
    // a clock of the sails: once every 30 frames on Map008 (the pose changes only at 19:30, 20:15, 05:00)
    let sailTicks = 0;
    function sailTick() {
        if (mapId() !== D.MAP.miasto) return;
        if (api.anim) { obrotTick(); }
        if (++sailTicks % 30) return;
        const want = pozaTeraz();
        if ((want || null) !== (api.pose || null)) poza(want, api.first || !hero8Blisko());
        api.first = false;
    }
    const hero8Blisko = () => Math.hypot($gamePlayer.x - D.WIATRAK.drzwi[0], $gamePlayer.y - D.WIATRAK.drzwi[1]) < D.KOD.zasieg + 4;

    // ==================================================================
    // 4. The observation (three evenings), the morning traces, the book page, Roch's pattern
    // ==================================================================
    function obserwujTick() {
        if (!aktywny() || mapId() !== D.MAP.miasto || rozdzial() < 3) return;
        const s = S(), h = hour(), dz = wieczorDzien();
        if (h < D.KOD.p1 || (h >= D.KOD.koniec && h < D.KOD.p1) || h >= 24 && false) return;
        const near = Math.hypot($gamePlayer.x - D.WIATRAK.drzwi[0], $gamePlayer.y - D.WIATRAK.drzwi[1]) <= D.KOD.zasieg;
        if (!near || s.obs.dni.includes(dz) || s.kod.gotowe) return;
        if (s.obs.dzienP !== dz) { s.obs.dzienP = dz; s.obs.p1 = ""; s.obs.p2 = ""; }
        if (h >= D.KOD.p1 && h < D.KOD.p2 && api.pose) s.obs.p1 = api.pose;
        if (h >= D.KOD.p2 && api.pose && s.obs.p1) s.obs.p2 = api.pose;
        if (s.obs.p1 && s.obs.p2) {
            s.obs.dni.push(dz);
            T.popup(fill(tx("napis.obserwacja"), { a: s.obs.p1, b: s.obs.p2, n: s.obs.dni.length, z: potrzeba() }), { top: true, color: "#ffe27a" });
            s.obs.rano.push([dz, jestLodzNocy(dz) ? 1 : 0]);
            note("notatki.obserwacja", { a: s.obs.p1, b: s.obs.p2, dzien: dz });
            kodSprawdz();
        }
    }
    const potrzeba = () => (S().wyrwana ? D.KOD.ileGdyWyrwana : D.KOD.ile);
    // did a boat come that night (the schedule's [B, C] and a high water)
    const jestLodzNocy = dz => { const p = D.KOD.harmonogram[((dz % 4) + 4) % 4]; return p[0] === "B" && p[1] === "C" && przyplyw(dz + 1, D.CZAS.przybija) >= D.POGODA.przyplyw; };
    function kodSprawdz() {
        const s = S();
        if (s.kod.gotowe) return;
        if (s.obs.dni.length >= potrzeba()) { s.kod.A = s.kod.B = s.kod.C = 1; }
        if (s.kod.B && s.kod.C) {
            s.kod.gotowe = day();
            T.popup(tx("napis.kodGotowy"), { top: true, color: "#ffe27a", sub: tx1("napis.kodGotowyPod") });
            note("notatki.kod");
        }
        sprawdzQ();
    }
    function ranoTick() {
        const s = S();
        if (!s.obs.rano.length) return;
        for (const [dz, came] of s.obs.rano.slice()) {
            if (day() > dz && hour() >= 6) {
                s.obs.rano.splice(s.obs.rano.findIndex(r => r[0] === dz), 1);
                note(came ? "notatki.slady" : "notatki.bezSladow", { dzien: dz });
            }
        }
    }
    // the book page of the Archive (Map119): the old code of the Raven Post; torn out when the chronicles were sold to Baltazar
    function ksiega() {
        if (!aktywny()) { popupInfo(tx1("ksiega.zamknieta")); return; }
        const s = S(), out = [];
        const sprzedane = !!w.flag("w5ChroniclesSold");
        if (sprzedane) {
            s.wyrwana = 1;
            linie(out, HERO, "ksiega.wyrwana");
            if (!s.ksiega) { s.ksiega = day(); note("notatki.wyrwana"); }
        } else {
            linie(out, HERO, "ksiega.strona");
            if (!s.ksiega) {
                s.ksiega = day();
                s.kod.A = s.kod.B = s.kod.C = s.kod.D = 1;
                note("notatki.ksiega");
                kodSprawdz();
            }
        }
        uruchom(null, out);
    }
    // Roch's lantern pattern for 10 G (a talk option on the smuggler of Przystan)
    const rochOpcja = () => aktywny() && rozdzial() >= 3 && !S().roch && S().kod.gotowe !== undefined;
    function rochPyta() {
        const s = S(), out = [], sp = spkOf("przemytnik");
        if ($gameParty.gold() < D.ROCH.ile) { linie(out, sp, "roch.brak"); return out; }
        wybor(out, [fill(tx1("roch.zaplac"), { n: D.ROCH.ile }), tx1("roch.nie")], [bran(sp, "roch.opowiada", null, "Mlyn.akcja('roch')"), bran(sp, "roch.nie2", null, null)], 1);
        return out;
    }
    // the characters without a menu of their own (Roch, Wit, Ozzy): a takeover of the "errand" level while there is something to ask, with the
    // way out "w innej sprawie" which lets the rest of the talk speak (as Majster.js's masters do)
    // (nowy świat, 2026-11-15) the new miller himself: once Jasiek has talked, the hero may ask Ambroży about the sails - he denies it
    // coldly and warns him off (a note in the journal; nothing else changes: the proof is the boat's night)
    const ambrozyOpcja = () => aktywny() && !!S().ch4.jasiek && !S().amb && !S().koniec;
    function ambrozyPyta() {
        const s = S(), out = [], sp = spkOf("nowy_mlynarz");
        linie(out, HERO, "ambrozy.pytam");
        linie(out, sp, "ambrozy.odpowiada");
        linie(out, HERO, "ambrozy.mysl");
        s.amb = day();
        note("notatki.ambrozy");
        return out;
    }
    const MENU = {
        nowy_mlynarz: { when: () => ambrozyOpcja(), label: () => tx1("ambrozy.opcja"), run: () => ambrozyPyta(), key: "nowy_mlynarz" },
        przemytnik: { when: () => rochOpcja(), label: () => tx1("roch.opcja"), run: () => rochPyta(), key: "przemytnik" },
        kapral: { when: () => aktywny() && rozdzial() === 4 && !!S().ch4.walenty && !S().ch4.soj, label: () => tx1("wit.opcja"), run: () => witPyta(), key: "kapral" },
    };
    // (Ozzy has a menu of his own: one more row - below)
    T.talk.takeover({ owner: PLUGIN, who: key => !!MENU[key], name: "menu", priority: T.talk.PRIORITY.errand, run: ctx => {
        try {
            if (!has()) return null;
            const k = ctx && ctx.who, m = k && MENU[k];
            if (!m || !m.when()) return null;
            const out = [];
            wybor(out, [m.label(), tx1("opcja.inna")], [skrypt([], "Mlyn.opcja(this, '" + k + "')"), skrypt([], "Mlyn.inna(this, '" + m.key + "')")], 1);
            return out;
        } catch (e) { report("menu", e); return null; }
    } });
    function opcja(interp, k) {
        const m = MENU[k];
        if (!m) return;
        const out = m.run();
        if (out) uruchom(interp, out);
    }
    function inna(interp, key) {
        const ev = interp && interp.eventId && $gameMap.event(interp.eventId());
        T.talk.run(interp, key, { ev, owner: PLUGIN, skip: PLUGIN });
    }

    // ==================================================================
    // 5. Walenty and Jasiek: the start, the night by the mill (S1), the spare key, the persuasion
    // ==================================================================
    const walentyJest = () => { const L = TL(), ev = L && L.eventOf ? L.eventOf("mlynarz") : null; return !!ev && !ev.isTransparent(); };
    function startWarunek() {
        if (!has()) return false;
        return day() >= D.START.dzien && inHours(hour(), D.START.godziny) && D.START.mapy.includes(mapId());
    }
    function walentyRozmowa() {
        if (!has() || !aktywny() && !startWarunek()) return null;
        const s = S(), out = [], sp = spkOf("mlynarz");
        if (s.koniec) return null;
        if (!s.start) { s.start = day(); sprawdzQ(); }
        if (rozdzial() === 1 && !s.cz1.scena) {
            if (!s.zgoda) {
                linie(out, sp, "walenty.prosba");
                wybor(out, [tx1("walenty.zostane"), tx1("walenty.nieTeraz")], [bran(sp, "walenty.zostaneOdp", null, "Mlyn.akcja('zgoda')"), bran(sp, "walenty.nieTerazOdp", null, null)], 1);
                return out;
            }
            linie(out, sp, "walenty.czekaj");
            if (!s.klucz) wybor(out, [tx1("walenty.kluczProsi"), tx1("walenty.kluczNie")], [bran(sp, "walenty.klucz", null, "Mlyn.akcja('klucz')"), []], 1);
            return out;
        }
        if (rozdzial() === 4 && s.kod.gotowe && !s.ch4.walenty) {
            linie(out, sp, "walenty.przekonaj");
            const labs = [], br = [];
            if (opiniaNow() >= D.START.opinia) { labs.push(tx1("walenty.zgodaOpinia")); br.push(bran(sp, "walenty.zgoda", null, "Mlyn.akcja('walenty', 0)")); }
            else if ($gameParty.gold() >= D.START.zaklopot) { labs.push(fill(tx1("walenty.zgodaZaplata"), { n: D.START.zaklopot })); br.push(bran(sp, "walenty.zgodaZ", null, "Mlyn.akcja('walenty', 1)")); }
            labs.push(tx1("walenty.pozniej")); br.push(bran(sp, "walenty.poznij", null, null));
            wybor(out, labs, br, labs.length - 1);
            return out;
        }
        if (rozdzial() >= 4) { linie(out, sp, s.ch4.set ? "walenty.poUstawieniu" : "walenty.wToku"); return out; }
        if (rozdzial() === 2 || rozdzial() === 3) { linie(out, sp, rozdzial() === 2 ? "walenty.swiatla" : "walenty.kod"); return out; }
        return null;
    }
    T.talk.takeover({ owner: PLUGIN, who: "mlynarz", name: "walenty", priority: T.talk.PRIORITY.owner, run: () => { try { return walentyRozmowa(); } catch (e) { report("Walenty", e); return null; } } });
    // Jasiek (chapter 4): he admits - three ways
    function jasiekRozmowa() {
        if (!has() || !aktywny()) return null;
        const s = S(), out = [], sp = spkOf("pomocnik");
        if (rozdzial() < 4 || !s.ch4.walenty) { linie(out, sp, rozdzial() >= 4 ? "jasiek.szuka" : "jasiek.dzien"); return out; }
        if (!s.ch4.jasiek) {
            linie(out, sp, "jasiek.przyznaje");
            const labs = [tx1("jasiek.pomoz"), fill(tx1("jasiek.odsylam"), { n: D.NAGRODY.odprawa }), tx1("jasiek.zignoruj")];
            wybor(out, labs, [bran(sp, "jasiek.pomozOdp", null, "Mlyn.akcja('jasiek','pomoc')"),
                $gameParty.gold() >= D.NAGRODY.odprawa ? bran(sp, "jasiek.odsylamOdp", null, "Mlyn.akcja('jasiek','odprawa')") : bran(HERO, "jasiek.brakZlota", null, null),
                bran(sp, "jasiek.zignorujOdp", null, "Mlyn.akcja('jasiek','klucz')")], 2);
            return out;
        }
        linie(out, sp, "jasiek.po." + s.ch4.jasiek);
        return out;
    }
    T.talk.takeover({ owner: PLUGIN, who: "pomocnik", name: "jasiek", priority: T.talk.PRIORITY.owner, run: () => { try { return jasiekRozmowa(); } catch (e) { report("Jasiek", e); return null; } } });
    const jasiekOdszedl = () => has() && S().ch4.jasiek === "odprawa";
    const registerCondition = () => { const L = TL(); if (L && L.addCondition) L.addCondition("mlynJasiek", () => !jasiekOdszedl()); };
    registerCondition();
    T.on("mapReady", registerCondition, { owner: PLUGIN });

    const akcje = {
        zgoda() { const s = S(); s.zgoda = day(); s.cz1.zgodaGodz = hour(); T.popup(tx("napis.zgoda"), { top: true, color: "#ffe27a", sub: tx1("napis.zgodaPod") }); sprawdzQ(); },
        klucz() { const s = S(); s.klucz = day(); T.popup(tx("napis.klucz"), { icon: 0, top: true, color: "#ffe27a" }); sprawdzQ(); },
        walenty(z) { const s = S(); if (Number(z) === 1 && !platnosc(D.START.zaklopot)) return; s.ch4.walenty = day(); sprawdzQ(); },
        jasiek(jak) {
            const s = S();
            if (jak === "odprawa" && !platnosc(D.NAGRODY.odprawa)) return;
            s.ch4.jasiek = jak;
            if (jak === "klucz") s.ch4.plotka = 1;
            if (jak === "pomoc") s.klucz = s.klucz || day();
            T.popup(tx("napis.jasiek." + jak), { top: true, color: "#ffe27a" });
            sprawdzQ();
        },
        roch() { const s = S(); if (!platnosc(D.ROCH.ile)) return; s.roch = day(); s.kod.wzor = 2; note("notatki.roch"); },
        soj(k) { const s = S(); s.ch4.soj = k; T.popup(tx("napis.soj." + k), { top: true, color: "#ffe27a" }); },
        ozzy() { ozzyPrognoza(); },
        wynik(k) { zakoncz(k); }
    };
    function akcja(nazwa, ...args) { try { if (akcje[nazwa]) akcje[nazwa](...args); } catch (e) { report("akcja " + nazwa, e); } }

    // the allies: Wit's menu (the three ways to the ambush) and Ozzy's forecast
    function witPyta() {
        const out = [], sp = spkOf("kapral");
        linie(out, sp, "wit.pyta");
        wybor(out, [tx1("wit.sambor"), tx1("wit.wit"), tx1("wit.sam")], [bran(sp, "wit.samborOdp", null, "Mlyn.akcja('soj','sambor')"), bran(sp, "wit.witOdp", null, "Mlyn.akcja('soj','wit')"),
            bran(sp, "wit.samOdp", null, "Mlyn.akcja('soj','sam')")], 2);
        return out;
    }
    // Ozzy's forecast (his talk: Mlyn_Data.js step 4 "rozmowy"): the beer paid, the nearest good night looked for (the words are the data's)
    function ozzyPrognoza() {
        const s = S();
        if (!platnosc(D.START.ozzy)) return;
        const d = szukajNocy(day());
        s.ch4.ozzy = day();
        if (d) { s.ch4.noc = d; note("notatki.noc", { dzien: d }); }
        else { s.ch4.noc = 0; s.ch4.ozzy = 0; }
        sprawdzQ();
    }

    // ---------------------------------------------------------------- S1 "Skrzydła same" (chapter 1) and the night in the empty mill
    let scena = null;   // { id, t } a running scene (the scenes run as event commands: this only keeps them from starting twice)
    function s1Warunek() {
        if (!aktywny() || scena || rozdzial() !== 1 || !S().zgoda || S().cz1.scena || mapId() !== D.MAP.miasto) return false;
        const h = hour(), s = S();
        if (!(day() > s.zgoda || (day() === s.zgoda && h >= D.CZAS.scenaOd)) || !(h >= D.CZAS.scenaOd && h < D.CZAS.scenaDo)) return false;
        return Math.hypot($gamePlayer.x - D.WIATRAK.przed[0], $gamePlayer.y - D.WIATRAK.przed[1]) <= 3 && !$gameMap.isEventRunning();
    }
    // Walenty waits beside the hero from 22:00 on the evening of the promise (TownLife.hold)
    function trzymajWalentego() {
        const L = TL();
        if (!L || !L.hold) return;
        const on = aktywny() && rozdzial() === 1 && !!S().zgoda && !S().cz1.scena && hour() >= D.CZAS.scenaOd && hour() < D.CZAS.scenaDo && (day() >= S().zgoda);
        if (on === api.holdW) return;
        api.holdW = on;
        try { L.hold("mlynarz", on, on ? [D.WIATRAK.przed[0] + 1, D.WIATRAK.przed[1]] : null); } catch (e) { report("hold", e); }
    }
    function scena1() {
        scena = { id: 1 };
        const sp = spkOf("mlynarz"), out = [];
        skrypt(out, "Mlyn.sc(1, 0)");
        wait(out, 70);
        linie(out, sp, "s1.walenty0");
        skrypt(out, "Mlyn.sc(1, 1)");        // the creak, sails a quarter on (to B, then C, then D)
        wait(out, 80);
        skrypt(out, "Mlyn.sc(1, 2)");
        wait(out, 80);
        skrypt(out, "Mlyn.sc(1, 3)");
        wait(out, 100);
        linie(out, sp, "s1.walenty1");
        linie(out, HERO, "s1.bohater");
        wait(out, 40);
        skrypt(out, "Mlyn.sc(1, 4)");
        linie(out, sp, "s1.walenty2");
        skrypt(out, "Mlyn.sc(1, 9)");
        uruchom(null, out);
    }
    function sc(id, krok) {
        try {
            if (id === 1) {
                if (krok === 0) { bars(true); $gameMap.startScroll(8, 3, 4); const l = evId(D.ID.latarniaWalentego); if (l) { l.locate(D.WIATRAK.przed[0] + 1, D.WIATRAK.przed[1]); l.setTransparent(false); } }
                else if (krok === 1) poza("B");
                else if (krok === 2) poza("C");
                else if (krok === 3) poza("D");
                else if (krok === 4) { const ev = $gameMap.events().find(e => e.event() && /Czapa wiatraka/.test(e.event().name)); T.audio.se("Wood1", { volume: 50, pitch: 60 }); }
                else if (krok === 9) { poza(null); gas(evId(D.ID.latarniaWalentego)); $gameMap.startScroll(2, 3, 4); bars(false); scena = null; const s = S(); s.cz1.scena = day(); note("notatki.s1"); T.popup(tx("napis.s1"), { top: true, color: "#ffe27a" }); sprawdzQ(); }
            } else if (id === 2) {
                if (krok === 0) { bars(true); }
                else if (krok === 1 || krok === 2) sc2(krok);
                else if (krok === 9) { bars(false); scena = null; }
            }
        } catch (e) { report("scena " + id, e); scena = null; bars(false); }
    }
    // the alternative: the spare key and the empty mill at night (the interior, Map217)
    function wnetrzeNoc() {
        if (!aktywny() || mapId() !== D.MAP.mlyn || rozdzial() !== 1 || S().cz1.scena || !S().klucz) return;
        const h = hour();
        if (!(h >= D.CZAS.wnetrzeOd || h < D.CZAS.wnetrzeDo)) return;
        const out = [];
        linie(out, HERO, "wnetrze.noc");
        skrypt(out, "Mlyn.akcja('s1alt')");
        uruchom(null, out);
    }
    akcje.s1alt = () => { const s = S(); if (s.cz1.scena) return; s.cz1.scena = day(); s.cz1.wnetrze = 1; note("notatki.s1alt"); T.popup(tx("napis.s1"), { top: true, color: "#ffe27a" }); sprawdzQ(); };

    // ==================================================================
    // 6. The door of the windmill (Map008 "Drzwi: Wiatrak"), the lever, the window, the clues
    // ==================================================================
    // open: the miller works (5:30-17:30) and the hero is with the thread's promise, or the hero has a key; always for the thread's chapter 4+
    function drzwiOtwarte() {
        if (!has()) return false;
        const s = S(), h = hour();
        if (s.klucz) return true;
        if (s.zgoda && inHours(h, [D.CZAS.drzwiOd, D.CZAS.drzwiDo])) return true;
        return false;
    }
    function drzwiZamkniete(eventId) {
        const t = $gameTemp, k = eventId || 440;
        t._budDoorPop = t._budDoorPop || {};
        if (t._budDoorPop[k] > Graphics.frameCount - 60) return;
        t._budDoorPop[k] = Graphics.frameCount;
        T.popup(tx("napis.zamkniety"), { color: "info" });
    }
    const slady = { wosk: 0, zeszyt: 0 };
    function slad(k) {
        if (!has()) return;
        const s = S(), out = [];
        s.cz1[k] = s.cz1[k] || 0;
        if (rozdzial() < 1) { popupInfo(tx1("slad.brak")); return; }
        linie(out, HERO, "slad." + k);
        if (!s.cz1[k]) { s.cz1[k] = day(); note("notatki.slad." + k); }
        uruchom(null, out);
    }
    function okno() {
        if (!has()) return;
        const out = [], s = S();
        linie(out, HERO, rozdzial() >= 2 && hour() >= D.CZAS.lasicaOd - 0.5 || hour() < 1 ? "okno.noc" : "okno.dzien");
        if (rozdzial() === 2 && lasicaTeraz()) linie(out, HERO, "okno.lasica");
        uruchom(null, out);
    }
    function dzwignia() {
        if (!has()) return;
        const s = S(), out = [], h = hour();
        if (!aktywny() || rozdzial() < 4 || !s.ch4.walenty) { linie(out, HERO, rozdzial() >= 1 ? "dzwignia.obca" : "dzwignia.zwykla"); uruchom(null, out); return; }
        if (!s.ch4.jasiek) { linie(out, HERO, "dzwignia.jasiek"); uruchom(null, out); return; }
        if (!s.ch4.soj) { linie(out, HERO, "dzwignia.sojusz"); uruchom(null, out); return; }
        if (!s.ch4.noc) { linie(out, HERO, "dzwignia.noc"); uruchom(null, out); return; }
        if (s.ch4.noc !== wieczorDzien()) { linie(out, HERO, "dzwignia.zlaNoc", { dzien: s.ch4.noc }); uruchom(null, out); return; }
        if (s.ch4.set === wieczorDzien()) { linie(out, HERO, "dzwignia.gotowe"); uruchom(null, out); return; }
        if (h < D.CZAS.ustawOd || h >= D.CZAS.ustawDo) { linie(out, HERO, "dzwignia.pora"); uruchom(null, out); return; }
        // the first pose now; the second a quarter of an hour later
        if (s.ch4.pierwsza && hour() - s.ch4.pierwszaGodz < D.CZAS.drugaPoza && s.ch4.pierwszaDzien === day()) { linie(out, HERO, "dzwignia.kwadrans"); uruchom(null, out); return; }
        const druga = !!s.ch4.pierwsza && s.ch4.pierwszaDzien === day();
        const opts = { druga, onEnd: r => ustawWynik(r, druga) };
        if (api.opts && api.opts.poza) { const f = api.opts.poza; api.opts = null; setTimeout(() => ustawWynik({ poza: f }, druga), 0); return; }
        if (!T.ui.open(Scene_Poza, opts)) report("dzwignia", "nie da się otworzyć mini-gry");
    }
    function ustawWynik(r, druga) {
        if (!has()) return;
        const s = S(), L = r && r.poza ? r.poza : "";
        if (!L) return;
        T.audio.se("Wood2", { volume: 70, pitch: 80 });
        if (!druga) {
            s.ch4.pierwsza = L; s.ch4.pierwszaGodz = hour(); s.ch4.pierwszaDzien = day();
            const out = []; linie(out, HERO, "dzwignia.pierwsza", { l: L }); uruchom(null, out);
            return;
        }
        const par = [s.ch4.pierwsza, L];
        s.ch4.pierwsza = ""; s.ch4.pierwszaDzien = 0;
        if (par[0] === "B" && par[1] === "C") {
            s.ch4.set = wieczorDzien(); s.ch4.poza = par;
            note("notatki.ustawione");
            T.popup(tx("napis.ustawione"), { top: true, color: "#ffe27a", sub: tx1("napis.ustawionePod") });
            const out = []; linie(out, HERO, "dzwignia.dobrze"); uruchom(null, out);
        } else {
            s.ch4.proby++;
            const out = [];
            if (s.ch4.proby >= D.CZAS.proby) {
                linie(out, HERO, "dzwignia.klucze");
                s.ch4.walenty = 0; s.ch4.jasiek = ""; s.ch4.soj = ""; s.ch4.ozzy = 0; s.ch4.noc = 0; s.ch4.proby = 0; s.ch4.plotka = 0; s.klucz = 0;
                note("notatki.klucze");
            } else linie(out, HERO, "dzwignia.zle", { n: D.CZAS.proby - s.ch4.proby });
            uruchom(null, out);
        }
        sprawdzQ();
    }

    // ==================================================================
    // 7. Chapter 2: the lookout in the drying yard, S2 "Lunetą", the choice (overhear / the ambush)
    // ==================================================================
    const lasicaTeraz = () => has() && aktywny() && rozdzial() === 2 && !S().ch2.podsluch && inHours(hour(), [D.CZAS.lasicaOd, D.CZAS.lasicaDo]) && S().ch2.dzien !== day() && S().ch2.ostrzezony !== day();
    const BLANK = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function aktor(id, name, sheet, x, y, dir, opt) {
        opt = opt || {};
        return { id, name, note: opt.note || "", x, y, pages: [{ conditions: Object.assign({}, BLANK), directionFix: false,
            image: { tileId: 0, characterName: sheet || "", direction: dir || 2, pattern: opt.pat === undefined ? 1 : opt.pat, characterIndex: opt.index || 0 }, list: [C(0, [])], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: opt.speed || 3, moveType: 0, priorityType: opt.prio === undefined ? 1 : opt.prio,
            stepAnime: !!opt.step, through: !!opt.through, trigger: opt.trigger || 0, walkAnime: opt.walk !== false }] };
    }
    function lasicaTick() {
        if (mapId() !== D.MAP.miasto || api.sc2) return;
        const ev = evId(D.ID.lasica);
        if (!ev) return;
        const on = lasicaTeraz();
        if (on === !ev.isTransparent()) { /* already as wanted */ }
        else {
            ev.setTransparent(!on);
            if (on) { ev.locate(D.LASICA.x, D.LASICA.y); ev.setDirection(D.LASICA.d); }
            const sv = evId(D.ID.lasicaSwiatlo); if (sv) gas(sv);
        }
        if (!on) return;
        // within reach: a sneaking hero hears (S2); a walking one is noticed and Lasica leaves for the night
        const d = Math.hypot($gamePlayer.x - D.LASICA.x, $gamePlayer.y - D.LASICA.y);
        if (d > D.LASICA.promien || $gameMap.isEventRunning() || scena) return;
        const H = window.Hunting, skrada = !!(H && H.sneaking && H.sneaking());
        if (skrada && d >= D.LASICA.ostrzez - 1) scena2();
        else if (d <= D.LASICA.ostrzez && !skrada) lasicaZauwazyl();
    }
    function lasicaZauwazyl() {
        const s = S(), ev = evId(D.ID.lasica);
        s.ch2.ostrzezony = day();
        s.ch2.proba++;
        const out = [];
        say(ev, tx1("lasica.kto"), 110);
        linie(out, HERO, "lasica.zauwazyl");
        uruchom(null, out);
        setTimeout(() => { try { const e2 = evId(D.ID.lasica); if (e2) e2.setTransparent(true); } catch (e) { /* the map changed */ } }, 1200);
    }
    function scena2() {
        scena = { id: 2 };
        api.sc2 = true;
        const s = S(), out = [], sp = { id: D.ID.lasica, name: tx("lasica.imie") };
        skrypt(out, "Mlyn.sc(2, 0)");
        wait(out, 30);
        linie(out, sp, "s2.lasica0");
        skrypt(out, "Mlyn.sc(2, 1)");
        wait(out, 90);
        linie(out, sp, "s2.lasica1");
        linie(out, HERO, "s2.bohater");
        skrypt(out, "Mlyn.sc(2, 2)");
        wait(out, 50);
        wybor(out, [tx1("s2.opcjaSluchaj"), tx1("s2.opcjaWalka")], [bran(HERO, null, null, "Mlyn.akcja2('sluchaj')"), bran(HERO, null, null, "Mlyn.akcja2('walka')")], 0);
        uruchom(null, out);
    }
    function sc2(krok) {
        try {
            const ev = evId(D.ID.lasica), sv = evId(D.ID.lasicaSwiatlo);
            if (krok === 1) {   // the lantern flashes K-D-K
                const zapal = on => { if (!sv) return; if (on) { sv.locate(D.LASICA.x - 1, D.LASICA.y); sv.setTransparent(false); } else gas(sv); };
                const plan = [[1, 160], [0, 220], [1, 450], [0, 220], [1, 160], [0, 0]];   // K D K: on / off, ms
                let n = 0;
                const blink = () => { try { if (!sv || n >= plan.length) return; const [on, ms] = plan[n++]; zapal(!!on); if (ms) setTimeout(blink, ms); } catch (e) { /* gone */ } };
                blink();
                T.audio.se("Switch2", { volume: 50, pitch: 130 });
            } else if (krok === 2) { /* the beat */ }
        } catch (e) { report("sc2", e); }
    }
    akcje.sluchaj = () => podsluchKoniec(false);
    akcje.walka = () => podsluchKoniec(true);
    function podsluchKoniec(walka) {
        const s = S();
        bars(false); scena = null; api.sc2 = false;
        s.ch2.podsluch = day(); s.ch2.dzien = day(); s.kod.wzor = Math.max(s.kod.wzor, 1);
        note("notatki.podsluch");
        const ev = evId(D.ID.lasica);
        if (walka) {
            s.ch2.walka = 1; s.ch4.plotka = 1;
            const H = window.Humans;
            if (H && H.ambush) { try { H.ambush(["bandit", "bandit"], { tag: "mlynLasica", far: [4, 7], say: tx1("s2.krzyk") }); } catch (e) { report("ambush", e); } }
            note("notatki.walka");
        }
        if (ev) { say(ev, tx1("lasica.odchodzi"), 100); setTimeout(() => { try { const e2 = evId(D.ID.lasica); if (e2) e2.setTransparent(true); } catch (e) { /* the map changed */ } }, 1500); }
        sprawdzQ();
    }

    // ==================================================================
    // 8. Mini-game "Ustaw skrzydła" (chapter 4): ← → choose a pose A-D, OK confirms
    // ==================================================================
    const ui = T.ui;
    const POZY_LISTA = ["A", "B", "C", "D"];
    class Scene_Poza extends ui.Scene_MiniGame {
        createGame() {
            this.idx = 1; this.flash = 0; this.wybrane = "";
            this.bmp = new Bitmap(Graphics.width, Graphics.height);
            this.pic = new Sprite(this.bmp);
            this.stage.addChild(this.pic);
            this.setTitle(tx("poza.tytul"), fill(tx1(this.opts.druga ? "poza.podDruga" : "poza.podPierwsza"), {}));
            this.setHints([["left", tx1("poza.wybierz")], ["ok", tx1("poza.zatwierdz")]], null);
        }
        begin() { this.setPhase("play"); this.draw(); }
        tick() {
            const k = this.trig;
            if (this.phase === "play") {
                if (k.left) { this.idx = (this.idx + 3) % 4; this.se("cursor"); this.flash = 6; }
                else if (k.right) { this.idx = (this.idx + 1) % 4; this.se("cursor"); this.flash = 6; }
                else if (k.ok) { this.wybrane = POZY_LISTA[this.idx]; this.se("ok"); this.setPhase("koniec"); }
            } else if (this.phase === "koniec") {
                if (this.phaseT > 25) this.end({ poza: this.wybrane });
            }
            if (this.flash > 0) this.flash--;
        }
        quitResult() { return { poza: "" }; }
        frame() { this.draw(); }
        draw() {
            const b = this.bmp, W = Graphics.width, H = Graphics.height, ctx = b.context;
            b.clear();
            const st = ui.style || {};
            const cx = W / 2, cy = H / 2 + 10;
            ctx.save();
            ctx.fillStyle = "rgba(11,12,15,0.88)"; ctx.fillRect(cx - 380, cy - 170, 760, 340);
            ctx.strokeStyle = st.accent || "#ffd23f"; ctx.lineWidth = 3; ctx.strokeRect(cx - 380, cy - 170, 760, 340);
            for (let i = 0; i < 4; i++) {
                const x = cx - 340 + i * 175, y = cy - 140, sel = i === this.idx;
                ctx.fillStyle = sel ? "rgba(255,210,63,0.16)" : "rgba(40,44,50,0.7)"; ctx.fillRect(x, y, 160, 190);
                ctx.strokeStyle = sel ? (st.accent || "#ffd23f") : "#3a3e46"; ctx.lineWidth = sel ? 4 : 2; ctx.strokeRect(x, y, 160, 190);
                this.drawSails(ctx, x + 80, y + 82, D.POZA_KLATKA[POZY_LISTA[i]], sel);
                b.fontSize = 28; b.textColor = sel ? (st.accent || "#ffd23f") : "#9fa4ad";
                b.drawText(POZY_LISTA[i], x, y + 156, 160, 32, "center");
            }
            b.fontSize = 22; b.textColor = "#eceef0";
            b.drawText(tx1("poza.opis." + POZY_LISTA[this.idx]), cx - 360, cy + 62, 720, 30, "center");
            b.fontSize = 18; b.textColor = "#9fa4ad";
            b.drawText(this.phase === "koniec" ? tx1("poza.skrzypi") : tx1("poza.stopka"), cx - 360, cy + 110, 720, 26, "center");
            ctx.restore();
            b._baseTexture && b._baseTexture.update && b._baseTexture.update();
        }
        // the sails as two crossed bars rotated by the frame's angle (22.5 + 7.5 f degrees), the hub, the post
        drawSails(ctx, x, y, f, sel) {
            const ang = (22.5 + 7.5 * f) * Math.PI / 180;
            ctx.save();
            ctx.translate(x, y);
            ctx.fillStyle = "#3c3f46"; ctx.fillRect(-4, 0, 8, 70);
            for (let k = 0; k < 4; k++) {
                ctx.save();
                ctx.rotate(ang + k * Math.PI / 2);
                ctx.fillStyle = sel ? "#e8d9a8" : "#a79b7a"; ctx.fillRect(-4, -2, 8, -62);
                ctx.fillStyle = sel ? "#c9b27a" : "#85795e"; ctx.fillRect(-12, -62, 24, 30);
                ctx.restore();
            }
            ctx.fillStyle = "#6b4a2c"; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
        pause() { this.se("cancel"); this.showChoice({ title: tx1("poza.pauza"), options: [tx1("poza.dalej"), tx1("poza.wyjdz")], cancel: 0, w: 440, onPick: i => { if (i === 1) this.end({ poza: "" }); } }); }
        state() { return Object.assign(super.state(), { idx: this.idx, wybrane: this.wybrane }); }
    }

    // ==================================================================
    // 9. Chapter 5: the night in the cove (Map125): the lantern talk (mini-game), the boat, the ambush, the exits
    // ==================================================================
    const nocPora = () => { const s = S(), d0 = s.ch4.set; return !!d0 && ((day() === d0 && hour() >= D.CZAS.nocOd) || (day() === d0 + 1 && hour() < D.CZAS.nocDo)); };
    const nocAktywna = () => has() && aktywny() && !!S().ch4.set && !S().koniec && nocPora();
    const zatoczkaDaleko = () => Math.hypot($gamePlayer.x - D.ZATOCZKA.hero[0], $gamePlayer.y - D.ZATOCZKA.hero[1]);
    const jestZasadzka = () => ({ sambor: false, wit: true, sam: true }[S().ch4.soj] !== false);
    function pelneFalszywe() { return S().ch4.plotka ? 1 : 0; }
    function wzorDnia() { return D.KOD.wzorB_C; }
    // the lantern question: from the night's seed - the boat asks one of three patterns; the answer is always the night's word (B-C = K D K)
    const PYTANIA = [["D", "K", "D"], ["K", "K", "D"], ["D", "D", "K"]];
    const pytanie = () => PYTANIA[((S().ch4.set || 1) % 3 + 3) % 3];
    class Scene_Latarnia extends ui.Scene_MiniGame {
        createGame() {
            this.szanse = this.opts.szanse || 1; this.proba = 0; this.wpis = []; this.flash = 0; this.msg = "";
            this.bmp = new Bitmap(Graphics.width, Graphics.height);
            this.pic = new Sprite(this.bmp);
            this.stage.addChild(this.pic);
            this.setTitle(tx("lat.tytul"), tx1("lat.pod"));
            this.setHints([["left", tx1("lat.k")], ["right", tx1("lat.d")], ["down", tx1("lat.od")], ["ok", tx1("lat.wyslij")]], null);
            this.q = this.opts.pytanie || pytanie();
            this.a = this.opts.odp || wzorDnia();
        }
        begin() { this.setPhase("pytanie"); this.draw(); }
        tick() {
            const k = this.trig;
            if (this.phase === "pytanie") {
                if (this.phaseT > 20 + this.q.length * 50) { this.setPhase("wpis"); this.limit = D.CZAS.sekundy * 60; this.wpis = []; }
            } else if (this.phase === "wpis") {
                const left = this.limit - this.phaseT;
                if (k.left && this.wpis.length < 5) { this.wpis.push("K"); this.se("cursor"); }
                else if (k.right && this.wpis.length < 5) { this.wpis.push("D"); this.se("cursor"); }
                else if (k.down) { this.wpis = []; this.se("cancel"); }
                else if (k.ok && this.wpis.length) this.oceń();
                else if (left <= 0) this.oceń();
            } else if (this.phase === "zle") {
                if (this.phaseT > 60) { this.proba >= this.szanse ? this.setPhase("koniec") : this.setPhase("pytanie"); }
            } else if (this.phase === "dobrze") {
                if (this.phaseT > 70) this.end({ ok: true, proby: this.proba });
            } else if (this.phase === "koniec") {
                if (this.phaseT > 60) this.end({ ok: false, proby: this.proba });
            }
        }
        oceń() {
            this.proba++;
            if (this.wpis.join("") === this.a.join("")) { this.se("ok"); this.setPhase("dobrze"); }
            else { this.se("buzzer", 0.8); this.setPhase("zle"); }
        }
        quitResult() { return { ok: false, proby: this.proba }; }
        frame() { this.draw(); }
        draw() {
            const b = this.bmp, W = Graphics.width, H = Graphics.height, ctx = b.context;
            b.clear();
            const st = ui.style || {};
            const cx = W / 2, cy = H / 2 + 10;
            ctx.save();
            ctx.fillStyle = "rgba(8,10,16,0.9)"; ctx.fillRect(cx - 360, cy - 160, 720, 320);
            ctx.strokeStyle = st.accent || "#ffd23f"; ctx.lineWidth = 3; ctx.strokeRect(cx - 360, cy - 160, 720, 320);
            b.fontSize = 24; b.textColor = st.accent || "#ffd23f";
            b.drawText(fill(tx1("lat.proba"), { n: Math.min(this.szanse, this.proba + (this.phase === "zle" || this.phase === "dobrze" || this.phase === "koniec" ? 0 : 1)), z: this.szanse }), cx - 340, cy - 150, 680, 34, "center");
            // the sea lantern: the dot flashes the question (K short, D long) in the pytanie phase
            const t = this.phaseT;
            let on = false;
            if (this.phase === "pytanie") {
                let acc = 20;
                for (const s of this.q) { const len = s === "K" ? 14 : 36; if (t >= acc && t < acc + len) on = true; acc += 50; }
            } else if (this.phase === "dobrze") on = (t % 30) < 24;
            ctx.fillStyle = "#0c1a2c"; ctx.fillRect(cx - 330, cy - 110, 660, 90);
            ctx.fillStyle = on ? "#ffd86b" : "#3a3320"; ctx.beginPath(); ctx.arc(cx, cy - 66, on ? 22 : 12, 0, Math.PI * 2); ctx.fill();
            if (on) { ctx.fillStyle = "rgba(255,216,107,0.25)"; ctx.beginPath(); ctx.arc(cx, cy - 66, 48, 0, Math.PI * 2); ctx.fill(); }
            // the question as marks, the hint (when the hero knows the night's word) and the hero's entry
            b.fontSize = 20; b.textColor = "#9fa4ad";
            b.drawText(this.phase === "pytanie" ? tx1("lat.patrz") : fill(tx1("lat.pytanie"), { q: this.q.map(s => s === "K" ? "•" : "—").join("  ") }), cx - 340, cy - 14, 680, 28, "center");
            if (S().kod.wzor >= 1 && this.phase !== "pytanie") { b.fontSize = 18; b.textColor = "#7fa6c9"; b.drawText(fill(tx1("lat.wskazowka"), { a: this.a.map(s => s === "K" ? "•" : "—").join("  ") }), cx - 340, cy + 14, 680, 26, "center"); }
            const wp = this.wpis, n = 5, sz = 56, gap = 18, total = n * sz + (n - 1) * gap;
            for (let i = 0; i < n; i++) {
                const x = cx - total / 2 + i * (sz + gap), y = cy + 46;
                ctx.fillStyle = i < wp.length ? "rgba(255,210,63,0.2)" : "rgba(40,44,50,0.7)"; ctx.fillRect(x, y, sz, 50);
                ctx.strokeStyle = "#3a3e46"; ctx.lineWidth = 2; ctx.strokeRect(x, y, sz, 50);
                if (i < wp.length) { ctx.fillStyle = "#ffd86b"; if (wp[i] === "K") { ctx.beginPath(); ctx.arc(x + sz / 2, y + 25, 8, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(x + 10, y + 21, sz - 20, 8); }
            }
            if (this.phase === "wpis") {
                const left = Math.max(0, this.limit - this.phaseT);
                ctx.fillStyle = left < 150 ? "#ff7b6b" : (st.accent || "#ffd23f"); ctx.fillRect(cx - 330, cy + 118, 660 * left / this.limit, 8);
            }
            b.fontSize = 28;
            if (this.phase === "dobrze") { b.textColor = "#8ee08a"; b.drawText(tx1("lat.dobrze"), cx - 340, cy + 120, 680, 36, "center"); }
            else if (this.phase === "zle") { b.textColor = "#ff9b8a"; b.drawText(tx1(this.proba >= this.szanse ? "lat.zleKoniec" : "lat.zle"), cx - 340, cy + 120, 680, 36, "center"); }
            else if (this.phase === "koniec") { b.textColor = "#ff9b8a"; b.drawText(tx1("lat.odplywa"), cx - 340, cy + 120, 680, 36, "center"); }
            ctx.restore();
            b._baseTexture && b._baseTexture.update && b._baseTexture.update();
        }
        pause() { this.se("cancel"); this.showChoice({ title: tx1("lat.pauza"), options: [tx1("poza.dalej"), tx1("lat.wyjdz")], cancel: 0, w: 440, onPick: i => { if (i === 1) this.end({ ok: false, proby: this.proba }); } }); }
        state() { return Object.assign(super.state(), { q: this.q, a: this.a, wpis: this.wpis.slice(), proba: this.proba, szanse: this.szanse }); }
    }
    const szanse = () => (S().kod.wzor >= 2 ? 2 : 1);

    // the cove's actors (Map125): created for the night window, shown by the scene
    const cx = D.ZATOCZKA;
    function zatoczkaBuild() {
        const out = [];
        out.push(aktor(D.ID.morze, "Światło na morzu", "", cx.swiatlo[0], cx.swiatlo[1], 4, { through: true, prio: 1, walk: false, note: "<Light:320,255,200,110><LightFlicker:0.1,255,190,90><LightHeight:18>" }));
        out.push(aktor(D.ID.lodz, "Łódź przemytników", "!$Lodz_Zaglowka_z_gory", cx.lodzStart[0], cx.lodzStart[1], 2, { through: true, prio: 1, walk: false, note: "<Light:340,255,190,90><LightFlicker:0.1,255,170,70><LightHeight:34>" }));
        out.push(aktor(D.ID.worki, "Worki ze zbożem", "!Tavern_Props2", cx.worki[0], cx.worki[1], 2, { through: false, prio: 1, walk: false, index: 3, pat: 2 }));
        out.push(aktor(D.ID.szyper, "Ostoja Rafa", "$Npc_Szyper", cx.szyper[0], cx.szyper[1], 4, { speed: 3, note: "<Light:260,255,190,90><LightFlicker:0.1,255,170,70><LightHeight:34>" }));
        out.push(aktor(D.ID.marynarz1, "Marynarz", "$Npc_Przemytnik", cx.marynarze[0][0], cx.marynarze[0][1], 4, { note: "<Light:190,255,190,90><LightFlicker:0.12,255,170,70><LightHeight:30>" }));
        out.push(aktor(D.ID.marynarz2, "Marynarz", "$Npc_Zolnierz", cx.marynarze[1][0], cx.marynarze[1][1], 4, {}));
        const sojSheet = { sambor: ["$Npc_Celnik", "$Npc_Kapral", "$Npc_Zolnierz"], wit: ["$Npc_Kapral", "$Npc_Zolnierz", "$Npc_Zolnierz"], sam: ["$Npc_Przemytnik", "$Npc_Dziadek", "$Npc_Zolnierz"] }[S().ch4.soj || "wit"];
        cx.sojusz.forEach((p, i) => out.push(aktor(D.ID.sojusznik1 + i, ["Sambor Kwit", "Wit", "Strażnik"][i], sojSheet[i], p[0], p[1], 4, i < 2 ? { note: "<Light:240,255,160,70><LightFlicker:0.16,255,110,40><LightHeight:34>" } : {})));
        cx.pochodnie.forEach((p, i) => out.push(aktor(D.ID.pochodnia1 + i, "Kosz ogniowy", "!Decoration", p[0], p[1], 2, { through: false, walk: false, step: true, index: 0, note: "<Light:300,120,52,14><LightFlicker:0.16,255,110,40>" })));
        return out;
    }
    T.inject([D.MAP.miasto, D.MAP.przystan, D.MAP.archiwum], { ids: D.IDS, owner: D.OWNER, build: (data, id) => {
        const out = [];
        if (id === D.MAP.miasto) {
            out.push(aktor(D.ID.lasica, "Łasica", "$Npc_Lasica", D.LASICA.x, D.LASICA.y, D.LASICA.d, { speed: 3 }));
            out.push(aktor(D.ID.latarniaWalentego, "Latarnia Walentego", "", D.WIATRAK.przed[0] + 1, D.WIATRAK.przed[1], 2, { through: true, walk: false, note: "<Light:170,255,170,80><LightFlicker:0.12,255,150,60><LightHeight:26>" }));
            out.push(aktor(D.ID.lasicaSwiatlo, "Przysłonięta latarnia", "", D.LASICA.x - 1, D.LASICA.y, 4, { through: true, walk: false, note: "<Light:480,255,190,90><LightFlicker:0.06,255,150,50><LightHeight:20>" }));
        } else if (id === D.MAP.przystan) {
            if (has() && nocAktywna()) out.push(...zatoczkaBuild());
        } else if (id === D.MAP.archiwum) {
            out.push({ id: D.ID.ksiega, name: "Zakurzony tom na pulpicie", note: "", x: 9, y: 5, pages: [{ conditions: Object.assign({}, BLANK), directionFix: true,
                image: { tileId: 0, characterName: "!$Altar", direction: 2, pattern: 0, characterIndex: 0 }, list: [C(355, ["Mlyn.ksiega()"]), C(0, [])], moveFrequency: 3,
                moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 1, stepAnime: false,
                through: false, trigger: 0, walkAnime: false }] });
        }
        return out;
    } });
    const nasz = id => evId(id);
    function ukryjWszystko() {
        for (const id of [D.ID.lodz, D.ID.worki, D.ID.szyper, D.ID.marynarz1, D.ID.marynarz2, D.ID.sojusznik1, D.ID.sojusznik2, D.ID.sojusznik3, D.ID.pochodnia1, D.ID.pochodnia2, D.ID.morze]) {
            gas(nasz(id));
        }
    }
    function pokaz(id, x, y, d) { const e = nasz(id); if (!e) return null; if (x !== undefined) e.locate(x, y); if (d) e.setDirection(d); e.setTransparent(false); e.setThrough([D.ID.lodz, D.ID.morze].includes(id)); return e; }
    // walk an event along a straight route to (x, y) (the cove is open sand; the event is "through")
    function ide(e, x, y, wolno) {
        if (!e) return;
        const route = [];
        let cxp = e.x, cyp = e.y;
        while (cxp !== x) { route.push({ code: cxp < x ? 3 : 2 }); cxp += cxp < x ? 1 : -1; }
        while (cyp !== y) { route.push({ code: cyp < y ? 1 : 4 }); cyp += cyp < y ? 1 : -1; }
        e.setMoveSpeed(wolno || 3);
        e.forceMoveRoute({ list: route.concat([{ code: 0 }]), repeat: false, skippable: true, wait: false });
    }
    let nocFaza = 0;
    function nocTick() {
        if (mapId() !== D.MAP.przystan) { if (nocFaza) { nocFaza = 0; } return; }
        if (!nocAktywna() || $gameMap.isEventRunning() || scena) return;
        const s = S();
        if (api.nocKey !== s.ch4.set) { api.nocKey = s.ch4.set; nocFaza = 0; }   // (a new night's setting: the conversation can begin again)
        if (nocFaza === 0) { ukryjWszystko(); nocFaza = 1; cx.pochodnie.forEach((p, i) => pokaz(D.ID.pochodnia1 + i, p[0], p[1])); }   // (the smugglers' fire baskets burn all the night)
        if (nocFaza === 1 && s.ch5.stan === 0 && zatoczkaDaleko() <= D.ZATOCZKA.pole && ((day() === s.ch4.set + 1 && hour() >= D.CZAS.pytanie) || false)) { nocFaza = 2; scena3(); }
        else if (nocFaza === 1 && s.ch5.stan === 0 && day() === s.ch4.set + 1 && hour() >= D.CZAS.nocDo - 0.01) { /* too late */ }
    }
    // a night that passed without the hero's answer: the signal is spent (the boat found no lantern), chapter 4's setting must be done again
    function nocMijala() {
        const s = S();
        if (!s.start || s.koniec) return;
        if (s.ch4.noc && s.ch4.noc < wieczorDzien() && !s.ch4.set) { s.ch4.noc = 0; s.ch4.ozzy = 0; }
        const d0 = s.ch4.set;
        if (d0 && s.ch5.stan === 0 && (day() > d0 + 1 || (day() === d0 + 1 && hour() >= D.CZAS.nocDo))) {
            s.ch4.set = 0; s.ch4.poza = []; s.ch4.noc = 0; s.ch4.ozzy = 0; s.ch4.proby++;
            note("notatki.niePrzyszedl");
            sprawdzQ();
        }
    }
    function scena3() {
        const s = S();
        scena = { id: 3 };
        const out = [];
        skrypt(out, "Mlyn.sc3(0)");
        wait(out, 50);
        linie(out, HERO, "s3.zajmuje");
        skrypt(out, "Mlyn.sc3(1)");
        wait(out, 30);
        uruchom(null, out);
    }
    function sc3(krok) {
        try {
            const s = S();
            if (krok === 0) { bars(true); const e = pokaz(D.ID.morze, cx.swiatlo[0], cx.swiatlo[1], 4); T.audio.se("Switch2", { volume: 40, pitch: 100 }); }
            else if (krok === 1) {
                const open = () => {
                    const opts = { szanse: szanse(), onEnd: r => latarniaKoniec(r) };
                    if (api.opts && api.opts.lat !== undefined) { const f = api.opts.lat; api.opts = null; setTimeout(() => latarniaKoniec({ ok: !!f, proby: 1 }), 0); return; }
                    if (!ui.open(Scene_Latarnia, opts)) report("latarnia", "nie da się otworzyć mini-gry");
                };
                open();
            }
        } catch (e) { report("sc3", e); scena = null; bars(false); }
    }
    function latarniaKoniec(r) {
        if (!has()) return;
        const s = S();
        if (!r || !r.ok) {
            s.ch5.bledy++;
            bars(false); scena = null; nocFaza = 1;
            gas(nasz(D.ID.morze));
            const out = []; linie(out, HERO, "s3.odplywa"); uruchom(null, out);
            note("notatki.odplynela");
            s.ch5.stan = 0; s.ch4.set = 0; s.ch4.poza = []; s.ch4.noc = 0; s.ch4.proby++;
            nocFaza = 9;
            sprawdzQ();
            return;
        }
        s.ch5.stan = 1; s.ch5.dzien = day();
        const out = [], sz = { id: D.ID.szyper, name: tx("szyper.imie") };
        linie(out, HERO, "s3.dobrze");
        wait(out, 30);
        skrypt(out, "Mlyn.sc3(2)");
        wait(out, 700);                // the boat comes in (12 s)
        skrypt(out, "Mlyn.sc3(3)");
        wait(out, 90);
        linie(out, sz, "s3.szyper");
        skrypt(out, "Mlyn.sc3(4)");
        uruchom(null, out);
    }
    function sc3b(krok) {
        try {
            const s = S();
            if (krok === 2) {
                const l = pokaz(D.ID.lodz, cx.lodzStart[0], cx.lodzStart[1], 2);
                gas(nasz(D.ID.morze));
                T.audio.se("Water1", { volume: 50, pitch: 90 });
                if (l) { l.setThrough(true); ide(l, cx.lodzDok[0], cx.lodzDok[1], 1); }
                s.ch5.stan = 2;
            } else if (krok === 3) {
                s.ch5.stan = 3;
                const sz = pokaz(D.ID.szyper, cx.lodzDok[0] + 3, cx.lodzDok[1], 6); const m1 = pokaz(D.ID.marynarz1, cx.lodzDok[0] + 3, cx.lodzDok[1] - 1, 6); const m2 = pokaz(D.ID.marynarz2, cx.lodzDok[0] + 3, cx.lodzDok[1] + 1, 6);
                ide(sz, cx.szyper[0], cx.szyper[1], 3); ide(m1, cx.marynarze[0][0], cx.marynarze[0][1], 3); ide(m2, cx.marynarze[1][0], cx.marynarze[1][1], 3);
                T.audio.se("Bell1", { volume: 30, pitch: 60 });
            } else if (krok === 4) {
                // the allies come out of the trees at 2:10 (S4); the hero's call
                bars(true);
                const sp = [spkOf("celnik"), spkOf("kapral")];
                for (let i = 0; i < 3; i++) { const e = pokaz(D.ID.sojusznik1 + i, cx.sojusz[i][0], cx.sojusz[i][1], 4); ide(e, cx.sojusz[i][0] - 3, cx.sojusz[i][1], 3); }
                cx.pochodnie.forEach((p, i) => pokaz(D.ID.pochodnia1 + i, p[0], p[1]));
                const out = [], soj = S().ch4.soj || "wit";
                const sam = nasz(D.ID.sojusznik1), wit = nasz(D.ID.sojusznik2);
                wait(out, 80);
                linie(out, { id: D.ID.sojusznik2, name: tx("wit.imie") }, "s4.wit");
                linie(out, { id: D.ID.sojusznik1, name: tx(soj === "sambor" ? "sambor.imie" : soj === "sam" ? "roch.imie" : "wit.imie") }, soj === "sambor" ? "s4.sambor" : soj === "sam" ? "s4.roch" : "s4.witDwa");
                skrypt(out, "Mlyn.sc3(5)");
                uruchom(null, out);
            } else if (krok === 5) {
                const soj = S().ch4.soj || "wit";
                const szy = nasz(D.ID.szyper);
                const ex = (S().ch4.plotka ? 1 : 0) + (w.flag("w5BaltazarWrog") ? 1 : 0) + (w.flag("w5Zamkniety") ? 1 : 0);
                if (soj === "sambor") { bars(false); wyjscieMenu(); return; }
                const kinds = soj === "wit" ? ["mercenary", "bandit"] : ["mercenary", "bandit", "bandit"];
                for (let i = 0; i < Math.min(2, ex); i++) kinds.push("bandit");
                const H = window.Humans;
                bars(false);
                S().ch5.walka = 1; S().ch5.stan = 4;
                if (H && H.ambush) { try { H.ambush(kinds, { tag: "mlynZatoczka", far: [3, 6], say: tx1("s4.szyper") }); } catch (e) { report("ambush", e); wyjscieMenu(); } }
                else wyjscieMenu();
                for (const id of [D.ID.marynarz1, D.ID.marynarz2]) { const e = nasz(id); if (e) e.setTransparent(true); }
            }
        } catch (e) { report("sc3b", e); scena = null; bars(false); }
    }
    T.on("humansDone", d => {
        if (!has() || !d) return;
        try {
            if (d.tag === "mlynZatoczka" && S().ch5.stan === 4) { S().ch5.stan = 5; setTimeout(() => { try { wyjscieMenu(); } catch (e) { report("wyjscie", e); } }, 1200); }
            if (d.tag === "mlynLasica") { /* nothing more: Lasica is gone (the flag plotka set) */ }
        } catch (e) { report("humansDone", e); }
    }, { owner: PLUGIN });
    // the three exits (the skipper in chains is the hero's to decide)
    function wyjscieMenu() {
        const s = S(), out = [], sz = { id: D.ID.szyper, name: tx("szyper.imie") };
        scena = null;
        const sz1 = nasz(D.ID.szyper); if (sz1) { sz1.setTransparent(false); sz1.setDirection(4); }
        const l = nasz(D.ID.lodz);
        linie(out, sz, "wyjscie.szyper");
        wybor(out, [tx1("wyjscie.sambor"), tx1("wyjscie.sam"), fill(tx1("wyjscie.targ"), { n: D.NAGRODY.targ.zloto })],
            [bran(HERO, "wyjscie.samborOdp", null, "Mlyn.akcja('wynik', 1)"), bran(HERO, "wyjscie.samOdp", null, "Mlyn.akcja('wynik', 2)"), bran(HERO, "wyjscie.targOdp", null, "Mlyn.akcja('wynik', 3)")], 0);
        uruchom(null, out);
    }
    function zakoncz(n) {
        if (!has()) return;
        const s = S();
        if (s.koniec) return;
        n = Number(n);
        const R = [null, D.NAGRODY.sambor, D.NAGRODY.sam, D.NAGRODY.targ][n];
        s.koniec = n; s.wyjscie = ["", "sambor", "sam", "targ"][n]; s.ch5.stan = 6;
        // (nowy świat) the smugglers taken: the new miller Ambroży, who gave the orders, is gone the same night (a bargain with the skipper: he stays)
        if ((n === 1 || n === 2) && TL() && TL().setGone) { try { TL().setGone("nowy_mlynarz", true); } catch (e) { /* (no such resident) */ } }
        zlato(R.zloto);
        opinia(R.opinia);
        xp(R.xp);
        if (R.roch) { try { T.call("TownQuests", "setFlag", "rochZaufanie", day()); } catch (e) { /* no flag */ } }
        if (n === 3) { s.mlynZdrada = 1; w.setFlag("mlynZdrada", day()); }
        else { w.setFlag("mlynBaltazar", day()); }
        w.setFlag("mlynKoniec", day());
        note("notatki.dziennikLodzi");
        note("notatki.koniec." + n);
        // the boat sails away, the cove empties
        const l = nasz(D.ID.lodz); if (l) { ide(l, cx.lodzStart[0], cx.lodzStart[1], 1); }
        for (const id of [D.ID.sojusznik1, D.ID.sojusznik2, D.ID.sojusznik3, D.ID.marynarz1, D.ID.marynarz2]) { const e = nasz(id); if (e) e.setTransparent(true); }
        setTimeout(() => { try { for (const id of [D.ID.szyper, D.ID.lodz, D.ID.pochodnia1, D.ID.pochodnia2]) gas(nasz(id)); } catch (e) { /* the map changed */ } }, 9000);
        poza(null);
        sprawdzQ();
        try { const q = TQ(); if (q && q.finish && w.active("W19")) q.finish("W19", {}); } catch (e) { report("finish", e); }
    }
    // Morze.js asks before it rolls / lands / shows a sign: nothing of the sea's thread on the smugglers' night in the cove
    function blocksSea(id) {
        if (!has() || id !== D.MAP.przystan) return false;
        const s = S();
        if (!s.start) return false;
        return nocAktywna() || !!scena || (s.ch5.stan >= 1 && s.ch5.stan < 6) || (!!s.koniec && !!s.ch5.dzien && day() === s.ch5.dzien && hour() < 6);
    }
    // S5 "Ranek w młynie": the morning after (once, by the mill)
    function epilogTick() {
        if (!has()) return;
        const s = S();
        if (!s.koniec || s.epilog || mapId() !== D.MAP.miasto || $gameMap.isEventRunning() || scena) return;
        if (!(day() > (s.ch5.dzien || day()) && hour() >= 6 && hour() < 11)) return;
        if (Math.hypot($gamePlayer.x - D.WIATRAK.przed[0], $gamePlayer.y - D.WIATRAK.przed[1]) > 4) return;
        s.epilog = day();
        const out = [], sp = spkOf("mlynarz");
        linie(out, sp, s.koniec === 3 ? "s5.zdrada" : "s5.walenty");
        if (s.koniec !== 3) { skrypt(out, "Mlyn.akcja2('nagrodaWalenty')"); }
        uruchom(null, out);
    }
    akcje.nagrodaWalenty = () => {
        const s = S();
        if (s.nagrody) return;
        s.nagrody = 1;
        zlato(D.NAGRODY.walenty.zloto);
        const f = item(82);
        if (f) { $gameParty.gainItem(f, D.NAGRODY.walenty.worki); T.popup("+" + D.NAGRODY.walenty.worki + " " + f.name, { icon: f.iconIndex }); }
    };

    // ==================================================================
    // 10. F9 (Debug.js "Wyspa i fabuła", the section "Wątek W19")
    // ==================================================================
    const f9 = { rozdzial: 1, poza: 0 };
    // the night of the cove NOW: the setting of the evening just done (set = yesterday's evening), 1:24 of this night, a high tide
    function przejdzNoc() {
        const s = S(), d = day();
        s.ch4.set = d - 1; s.ch4.noc = d - 1; s.ch4.poza = ["B", "C"]; s.ch5 = { stan: 0, dzien: 0, szanse: 0, bledy: 0, wynik: "", walka: 0, jaskinia: 0 };
        $gameSystem.setDayNightHour(1.4);
        try { const W = T.api("Wyspa") || window.Wyspa; if (W && W.forceTide) W.forceTide("high"); } catch (e) { /* no tide */ }
    }
    function debugGo(n) {
        const s = S();
        n = Math.max(0, Math.min(6, n | 0));
        Object.assign(s, D.defaults());
        if (n >= 1) { s.start = day(); }
        if (n >= 2) { s.zgoda = day() - 1; s.cz1.scena = day() - 1; }
        if (n >= 3) { s.ch2.podsluch = day() - 1; s.kod.wzor = 1; }
        if (n >= 4) { s.kod.A = s.kod.B = s.kod.C = s.kod.D = 1; s.kod.gotowe = day(); s.ksiega = day(); }
        if (n >= 5) { s.ch4.walenty = day(); s.ch4.jasiek = "pomoc"; s.ch4.soj = "wit"; s.ch4.noc = szukajNocy(day()) || day(); s.ch4.set = s.ch4.noc; s.ch4.poza = ["B", "C"]; s.klucz = day(); s.kod.wzor = 2; }
        if (n >= 6) { s.koniec = 1; s.wyjscie = "sambor"; }
        sprawdzQ();
        return s;
    }
    w.haki({
        ozzyGdy: () => aktywny() && rozdzial() === 4 && !!S().ch4.walenty && !S().ch4.noc,
        ozzyBrak: () => has() && $gameParty.gold() < D.START.ozzy,
        ozzyPiwo: () => ozzyPrognoza(),
        ozzyZmienne: () => ({ dzien: S().ch4.noc }),
        w19Start: () => { if (!startWarunek()) return false; if (!S().start) S().start = day(); return true; },
        krokZmienne: ctx => {
            const s = S(), step = ctx && ctx.r ? ctx.r.step : 0, v = {};
            const slowa = ["A", "B", "C", "D"].filter(L => s.kod[L]).map(L => L + " = " + tx("kod.slowo." + L)).join("; ") || tx("kod.brak");
            let t = "";
            if (step === 0) t = s.cz1.scena ? tx("kroki.0.po") : s.zgoda ? fill(tx("kroki.0.czeka"), { dzien: s.zgoda }) : tx("kroki.0.brak");
            else if (step === 1) t = s.ch2.ostrzezony === day() ? tx("kroki.1.ostrzezony") : s.ch2.podsluch ? tx("kroki.1.po") : tx("kroki.1.szukaj");
            else if (step === 2) t = fill(tx("kroki.2.tekst"), { n: s.obs.dni.length, z: potrzeba(), slowa, ksiega: s.ksiega ? (s.wyrwana ? tx("kroki.2.wyrwana") : tx("kroki.2.jest")) : tx("kroki.2.nie"), roch: s.roch ? tx("kroki.2.rochJest") : tx("kroki.2.rochNie") });
            else if (step === 3) {
                const cz = [s.ch4.walenty ? tx("kroki.3.wTak") : tx("kroki.3.wNie"), s.ch4.jasiek ? tx("kroki.3.jTak") : tx("kroki.3.jNie"), s.ch4.soj ? tx("kroki.3.sTak." + s.ch4.soj) : tx("kroki.3.sNie"),
                    s.ch4.noc ? fill(tx("kroki.3.nTak"), { dzien: s.ch4.noc }) : tx("kroki.3.nNie")];
                t = s.ch4.set ? fill(tx("kroki.3.po"), { dzien: s.ch4.set }) : fill(tx("kroki.3.tekst"), { lista: cz.join(" ") });
            } else if (step === 4) t = s.koniec ? fill(tx("kroki.4.po"), { wynik: tx("wyniki." + s.koniec) }) : fill(tx("kroki.4.tekst"), { dzien: s.ch4.set + 1 });
            v.tekst = t;
            return v;
        },
        f9Zmienne: ctx => {
            const co = ctx && ctx.row ? ctx.row.co : "";
            if (co === "rozdzial") return { n: f9.rozdzial };
            if (co === "poza") return { l: POZY_LISTA[f9.poza] };
            return {};
        },
        f9Wybierz: (ctx, delta) => {
            const co = ctx.row.co;
            if (co === "rozdzial") f9.rozdzial = ((f9.rozdzial - 1 + delta + 6) % 6) + 1;
            else if (co === "poza") f9.poza = (f9.poza + delta + 4) % 4;
            else return false;
            return true;
        },
        f9Ok: ctx => {
            if (!has()) return { say: tx("f9.brak"), bad: true };
            const co = ctx.row.co;
            if (co === "rozdzial") {
                const n = f9.rozdzial;
                debugGo(n);
                if (n === 5) przejdzNoc();
                const go = n >= 5 ? ["W19", D.MAP.przystan, cx.hero[0], cx.hero[1], cx.hero[2]] : n === 4 ? ["W19", D.MAP.mlyn, 22, 10, 4] : ["W19", D.MAP.miasto, D.WIATRAK.przed[0], D.WIATRAK.przed[1] + 1, 8];
                return { go, say: "rozdzial " + n };
            }
            if (co === "poza") { api.forced = POZY_LISTA[f9.poza]; poza(api.forced); return { go: ["W19", D.MAP.miasto, D.WIATRAK.przed[0], D.WIATRAK.przed[1] + 3, 8] }; }
            if (co === "zmierzch") { if (!S().start) debugGo(1); api.forced = null; $gameSystem.setDayNightHour(19.4); return { go: ["W19", D.MAP.miasto, D.WIATRAK.przed[0], D.WIATRAK.przed[1] + 3, 8] }; }
            if (co === "lodz") { debugGo(5); przejdzNoc(); return { go: ["W19", D.MAP.przystan, cx.hero[0], cx.hero[1], cx.hero[2]] }; }
            if (co === "kod") { const s = S(); s.kod.A = s.kod.B = s.kod.C = s.kod.D = 1; s.kod.wzor = 2; kodSprawdz(); return { back: true }; }
            if (co === "wylacz") { api.forced = null; const s = S(); s.koniec = s.koniec || 1; poza(null); ukryjWszystko(); sprawdzQ(); return { back: true }; }
            if (co === "wyzeruj") { api.forced = null; Object.assign(S(), D.defaults()); poza(null); ukryjWszystko(); sprawdzQ(); return { back: true }; }
            return null;
        }
    });

    // ==================================================================
    // 11. The clock and the bus
    // ==================================================================
    let ticks = 0;
    function zegar() {
        if (!has()) return;
        const s = S();
        if (!s.start && startWarunek() && !w.done("W19") && !w.active("W19")) { /* the thread starts by its own autoStart (w19Start); the talk with Walenty is the first beat */ }
        ranoTick();
        nocMijala();
        trzymajWalentego();
        wnetrzeNoc();
    }
    T.onMapUpdate(() => {
        if (!has()) return;
        try {
            if (mapId() === D.MAP.miasto) sailTick();
            if (++ticks % 15) return;
            if (mapId() === D.MAP.miasto) { obserwujTick(); lasicaTick(); if (s1Warunek()) scena1(); epilogTick(); }
            if (mapId() === D.MAP.przystan) nocTick();
            if (ticks % 60 === 0) zegar();
        } catch (e) { report("zegar", e); }
    }, { owner: PLUGIN, name: "mlyn" });
    T.on("hourChange", () => { if (!has()) return; try { zegar(); } catch (e) { report("godzina", e); } }, { owner: PLUGIN });
    T.on("dayStart", () => { if (!has()) return; try { zegar(); } catch (e) { report("dzień", e); } }, { owner: PLUGIN });
    // Game_Map.setup runs at every transfer (even to the same map) and not when a scene is left: the map really "came up again"
    const _Game_Map_setup = Game_Map.prototype.setup;
    Game_Map.prototype.setup = function() { api.setups = (api.setups || 0) + 1; return _Game_Map_setup.apply(this, arguments); };
    T.on("mapReady", () => {
        // (a return from a mini-game starts the map scene again: the same map - nothing of a running scene is reset then)
        const same = has() && api.seenSetups === api.setups;   // (no Game_Map.setup since the last time: only a mini-game's return)
        api.seenSetups = api.setups;
        if (same) { try { zegar(); } catch (e) { report("mapa", e); } return; }
        skrzydlaEv = null; nocFaza = 0; scena = null; api.holdW = false; api.sc2 = false;
        if (!has()) return;
        try {
            if (mapId() === D.MAP.miasto) {
                // after a load (or arriving) the sails stand in the pose the thread wants; otherwise they turn on their own
                api.pose = null; api.anim = null; api.first = true;
                const want = pozaTeraz();
                if (want) poza(want, true);
                gas(evId(D.ID.lasica)); gas(evId(D.ID.lasicaSwiatlo)); gas(evId(D.ID.latarniaWalentego));
            }
            if (mapId() === D.MAP.przystan) {
                ukryjWszystko();
                // a night's scene the hero walked out of: the conversation starts again (while the night lasts)
                const s = S();
                if (s.ch5.stan >= 1 && s.ch5.stan < 6 && !s.koniec) s.ch5.stan = 0;
            }
            if (mapId() === D.MAP.mlyn) wnetrzeNoc();
            zegar();
        } catch (e) { report("mapa", e); }
    }, { owner: PLUGIN });
    T.on("load", () => { api.pose = null; api.anim = null; api.holdW = false; api.seenSetups = -1; scena = null; bars(false); }, { owner: PLUGIN });

    window.Mlyn = T.register(PLUGIN, {
        stan: () => S(), blocksSea, rozdzial, opcja, inna, poza, pozaTeraz, ksiega, slad, okno, dzwignia, akcja, akcja2: (n, ...a) => akcja(n, ...a), sc, sc3: k => (k >= 2 ? sc3b(k) : sc3(k)),
        drzwi: ev => (drzwiOtwarte() ? true : (drzwiZamkniete(ev && ev.eventId ? ev.eventId() : 0), false)), drzwiOtwarte, drzwiZamkniete,
        nocDobra, szukajNocy, zakoncz, debugGo, aktywny, lasicaTeraz, nocAktywna, scena1, scena2, scena3, nocTick, obserwujTick, kodSprawdz, wyjscieMenu, epilogTick, sailTick,
        opts: o => { if (o !== undefined) api.opts = o; return api.opts; }, forced: f => { if (f !== undefined) { api.forced = f; } return api.forced; },
        api, Scene_Poza, Scene_Latarnia, potrzeba, jestLodzNocy, wieczorDzien, zatoczkaBuild, tick: zegar
    });
})();
