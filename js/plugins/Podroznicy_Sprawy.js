//=============================================================================
// Podroznicy_Sprawy.js
//=============================================================================
// The ferry's travellers, stage 2 (docs/PODROZNI.md 2.1-2.6, I2 - 2026-10-29): the code of the first six's matters. The quests
// themselves (K71, K72, D39, D40, D41, D42, D43), their talks and actions are data - Podroznicy_Data.js (the thread "podroznicy"),
// their words js/teksty/podroznicy.txt. Here:
//   - the HOOKS the data names (offers, the words of the steps, the letters, the sketches, the contest, the verse, the endings);
//   - I2 "Rozmowa przez ścianę": Podroznicy.podsluch - the hero facing a wall of the tavern (the plan's rooms: TavernLife.plan.DATA)
//     with a room behind it presses O: "Przyłóż ucho". The lines come in bubbles "(zza ściany)" every 2 s; the keywords in {braces}
//     are "..." below the conversation's Czujność; from the corridor every second line is lost and, without sneaking, 30% a line
//     they hear him ("Kto tam?"); moving ends it. Heard to the end: a journal note "Podsłuchane: ..." and the bus "podsluch"
//     { id, pelna }. Other plugins add their conversations: Podroznicy.podsluch.dodaj({ id, plik, mapa, pokoj, godziny, kwestie,
//     prog, raz, gdy }) (W15's courier, W16's dream);
//   - the actors at the garrison (Map162, ids 3008-3009 of Podroznicy's range): Antek among the recruits (D43), Zenon at Kłos's
//     scales at 11 (D42 - following him);
//   - Borgar's kettle (K71: the butler's letter steamed open), Zenon buying the hero's barley (D42 b), the bandage recipe of D39,
//     the renown of the quests done, Teofil's words on the island's map (D40).
// API: window.PodroznicySprawy; Podroznicy.podsluch.

/*:
 * @target MZ
 * @plugindesc Podróżni z promu - etap 2: sprawy pierwszej szóstki (K71, K72, D39-D43), podsłuch przez ścianę (I2), Antek i Zenon w garnizonie. v1.0.0
 * @author Claude
 * @base TawernaCore
 * @base Watki
 * @base Podroznicy_Data
 * @base Podroznicy
 * @orderAfter Podroznicy
 *
 * @help
 * ============================================================================
 * Podroznicy_Sprawy.js - sprawy podróżnych (docs/PODROZNI.md, etap 2)
 * ============================================================================
 * Zadania są danymi w Podroznicy_Data.js (wątek „podroznicy”), teksty w
 * js/teksty/podroznicy.txt. Ta wtyczka daje ich haki, podsłuch przez ścianę
 * (O twarzą do ściany pokoju w tawernie - „Przyłóż ucho”), Antka i Zenona w
 * garnizonie, kociołek Borgara (K71) i skup jęczmienia Zenona (D42).
 * Musi stać pod Podroznicy.js na liście wtyczek.
 * ============================================================================
 */

(() => {
    "use strict";
    const T = window.Tawerna, D = window.PodroznicyData, P = window.Podroznicy;
    if (!T || !window.Watki || !D || !P) throw new Error("Podroznicy_Sprawy.js: brak TawernaCore.js / Watki.js / Podroznicy_Data.js / Podroznicy.js - muszą być wyżej na liście wtyczek");
    const PLUGIN = "PodroznicySprawy";
    const w = D.watek, SP = D.SPRAWY;
    const fill = Watki.wstaw, C = Watki.mowa.C;
    const AK = { akapity: true };

    // ------------------------------------------------------------------ helpers
    const S = () => w.S();
    const has = () => !!window.$gameSystem && !!S();
    const day = () => T.time.day(), hour = () => T.time.hour();
    const teraz = () => day() * 24 + hour();
    const TQ = () => T.api("TownQuests");
    const item = id => (window.$dataItems && $dataItems[id]) || null;
    const count = id => (item(id) ? $gameParty.numItems(item(id)) : 0);
    const tx = k => w.tekst(k), txm = k => w.tekstMoze(k);
    const listOf = v => (Array.isArray(v) ? v : v ? [v] : []);
    const inHours = (h, hs) => { const [a, b] = hs; return a <= b ? h >= a && h < b : h >= a || h < b; };
    const wpis = pk => (has() ? S().obecni[pk] || null : null);
    const aktywne = id => { const q = TQ(), r = q && q.rec ? q.rec(id) : null; return !!r && r.s === "active"; };
    const attr = id => Number(T.call("Combat", "attr", id)) || 0;
    const report = (where, e) => console.error("[" + PLUGIN + "] " + where, e);
    const note = key => { const p = w.pair(key); if (p) T.call("Journal", "addNote", p[0], p[1]); };
    const zloto = (n, why) => {
        if (!n) return;
        if (n > 0) $gameParty.gainGold(n); else $gameParty.loseGold(-n);
        T.popup((n > 0 ? "+" : "") + n + " G", { icon: 314, kind: n > 0 ? "good" : "bad" });
    };
    const pierwszaWizyta = pk => { const e = wpis(pk); return !!e && (e.wizyta || 1) === 1; };
    const SB = () => T.api("SpeechBubbles");
    function dymek(ch, text, frames) {
        const sb = SB();
        if (sb && sb.say) sb.say(ch, text, frames); else T.popup(text, { color: "#eceef0" });
    }
    const path = (o, p) => { let v = o; for (const k of String(p).split(".")) { if (v === null || v === undefined) return undefined; v = v[k]; } return v; };

    // ==================================================================
    // 1. The hooks of the quests (the data's conditions, words and actions)
    // ==================================================================
    // ---- K71 "Listy z lądu"
    function k71List(k) {
        const s = S().k71;
        if (s.oddane[k]) return;
        w.vtake("list_" + k, 1);
        s.oddane[k] = day();
        zloto(SP.k71.zaList);
    }
    // the butler's letter read (steamed open, or shown to the Lord): W7's "papier na kopy" - the morning's thing seen of Feliks
    function w7Papier() {
        try { const Dw = T.api("Dwor"), s = Dw && Dw.state ? Dw.state() : null; if (s && s.obs && !s.obs.rano) s.obs.rano = day(); } catch (e) { report("w7Papier", e); }
    }
    // ---- K72 "Poczta z lądu": the letters of a visit
    function k72Start() {
        const s = S(), e = wpis("tobiasz"), A = SP.k72.adresaci, L = P.logika;
        const r = L.rng(L.mix(s.seed, day(), 72, e ? e.od : 0));
        const n = SP.k72.ile[0] + Math.floor(r() * (SP.k72.ile[1] - SP.k72.ile[0] + 1));
        const out = [];
        if (e && ((e.wizyta || 1) === 2 || e.od === SP.k72.kleofasOd)) out.push("pustelnik");   // (W15: Lipnica's letter to brother Kleofas)
        const pool = A.filter(k => !out.includes(k));
        while (out.length < n && pool.length) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
        s.k72 = { wizyta: e ? e.od : day(), adresaci: out, oddane: {} };
        const left = w.vcount("list_poczta");
        if (left > 0) w.vtake("list_poczta", left);
        w.vgive("list_poczta", out.length);
    }
    function k72List(k) {
        const s = S().k72;
        if (!s.adresaci.includes(k) || s.oddane[k]) return;
        w.vtake("list_poczta", 1);
        s.oddane[k] = day();
        zloto(SP.k72.zaList);
    }
    const k72Zostalo = () => { const s = S().k72; return s.adresaci.filter(k => !s.oddane[k]); };
    // ---- D39: the recipe of the medic (a bandage of fibre and yarrow - no herbs from the herb woman needed)
    const PRZEPIS = { id: SP.d39.przepis, inputs: [[92, 1], [150, 1]], output: [152, 1], manual: true, swing: "crouch", hours: 0.25, stamina: 1, startSe: "Item1" };
    Watki.scal(PRZEPIS, "podroznicy", "przepis");
    function przepisy() {
        const F = T.api("Farming"), list = F && F.HAND_RECIPES;
        if (!list) return;
        const on = has() && w.flag("d39Przepis"), i = list.findIndex(x => x.id === PRZEPIS.id);
        if (on && i < 0) list.push(PRZEPIS);
        else if (!on && i >= 0) list.splice(i, 1);
    }
    // ---- D40: the sketches
    const liczSzkice = () => Object.keys(S().d40.szkice).filter(k => S().d40.szkice[k]).length;
    const nazwaMiejsca = k => (D.SPOTS[k] && D.SPOTS[k].name) || k;
    function d40Szkic(spot) {
        const s = S().d40;
        if (s.szkice[spot.key] || liczSzkice() >= SP.d40.szkice) return [];
        s.szkice[spot.key] = day();
        T.audio.se("Book1", { volume: 70 });
        T.popup(fill(tx("d40.szkicNapis"), { miejsce: nazwaMiejsca(spot.key) }), { top: true, color: "#ffe27a", sub: fill(tx("d40.szkicPod"), { n: liczSzkice(), z: SP.d40.szkice }) });
        w.autoChecks();
        const q = TQ();
        if (q && q.syncSpots) q.syncSpots();
        return [];
    }
    // ---- D41: Melia and Jędrek
    const zaufanie = role => Number(T.call("TavernLife", "trust", role)) || 0;
    function brakujacaZwrotka() {
        const q = TQ(), r = q && q.rec ? q.rec("W3") : null;
        if (!q || !q.Q || !q.Q.W3 || !q.hasVerse || !r) return null;   // (W3 not begun: only the soldiers' version)
        return (q.Q.W3.verses || []).find(v => !q.hasVerse(v.key)) || null;
    }
    function d41Zawody() {
        const s = S().d41;
        zloto(s.zaklad === s.wygral ? SP.d41.zaklad : -SP.d41.zaklad);
        T.call("TavernLife", "addTrust", "melia", s.wygral === "melia" ? SP.d41.melia.wygrana : SP.d41.melia.przegrana, "D41");
    }
    function d41Zwrotka(miod) {
        const s = S().d41, q = TQ();
        if (Number(miod) && count(SP.d41.miod) > 0) $gameParty.loseItem(item(SP.d41.miod), 1);
        const v = brakujacaZwrotka();
        if (v && q && q.gainVerse) { s.zwrotka = v.key; w.setFlag("d41ZwrotkaZLadu"); q.gainVerse(v.key); }
        else { s.zwrotka = "wojskowa"; w.setFlag("d41Wojskowa"); note("d41.notatka.wojskowa"); }
        if (day() <= SP.d41.kupala) w.setFlag("d41Kupala");
        if ($gameSystem.addBuff) { $gameSystem.addBuff("inspired", SP.d41.natchniony); T.popup(fill(tx("d41.natchniony"), { h: SP.d41.natchniony }), { icon: 80, kind: "good" }); }
    }
    // ---- D42: the traces, Zenon gone, the endings
    function d42Slad(k) {
        const s = S().d42;
        if (s.slady[k] || !w.at("d42Slady")) return;
        s.slady[k] = day();
        note("d42.notatka.slad." + k);
        T.popup(tx("d42.sladNapis"), { top: true, color: "#ffe27a", sub: fill(tx("d42.sladPod"), { n: Object.keys(s.slady).length }) });
        w.autoChecks();
    }
    function d42Koniec(how) {
        if (!aktywne("D42")) return;
        S().d42.wybor = how;
        const rw = { xp: 100 };
        if (how === "a") {
            w.setFlag("zbozeZdemaskowany");
            P.wyjazd("zboze", P.naPromie(day() + 1));
            Object.assign(rw, { xp: 120, opinion: SP.d42.opinia.ujawnij, gold: 10, items: [[SP.d42.chleb, 1]] });
        } else if (how === "b") { w.setFlag("d42Handel"); rw.opinion = SP.d42.opinia.handel; }
        else if (how === "c") { w.setFlag("d42Worki"); rw.xp = 120; }
        else if (how === "d") w.setFlag("d42KlosMilczy");
        note("d42.notatka." + how);
        TQ().finish("D42", rw);
    }
    // ---- D43: the endings
    function d43Koniec(how) {
        if (!aktywne("D43")) return;
        S().d43.wybor = how;
        w.setFlag("d43_" + how);
        const rw = { xp: how === "d" ? 50 : 150 };
        if (how === "a" || how === "b") rw.opinion = SP.d43.opinia;
        if (how !== "d") P.renoma(SP.d43.renoma, "D43");
        if (how === "c") T.call("Garnizon", "addFavor", SP.d43.garnizon, "D43");
        note("d43.notatka." + how);
        TQ().finish("D43", rw);
    }

    w.haki({
        // K71
        k71Oferta: () => pierwszaWizyta("tobiasz"),
        k71Zmienne: () => { const e = wpis("tobiasz"); return { n: Object.keys(S().k71.oddane).length, z: SP.k71.listy.length, dzien: e ? e.do : "?" }; },
        k71List: (ctx, k) => k71List(k),
        w7Papier: () => w7Papier(),
        czujnosc: (ctx, n) => attr("per") >= Number(n),
        // K72 (each return of Tobiasz - his second visit on; once a visit)
        k72Oferta: () => { const e = wpis("tobiasz"); return !!e && (e.wizyta || 1) > 1 && S().k72.wizyta !== e.od && !aktywne("K72"); },
        k72Gotowe: () => { const s = S().k72; return s.adresaci.length > 0 && s.adresaci.every(k => s.oddane[k]); },
        k72Dla: (ctx, k) => { const s = S().k72; return s.adresaci.includes(k) && !s.oddane[k] && w.vcount("list_poczta") > 0; },
        k72List: (ctx, k) => k72List(k),
        k72Zmienne: () => ({ komu: k72Zostalo().map(k => txm("k72.kto." + k) || k).join(", ") || "-", n: k72Zostalo().length }),
        // D39
        d39Oferta: () => pierwszaWizyta("medyk"),
        d39PoNocy: () => { const n = S().d39.noc; return !!n && teraz() - n >= SP.d39.poNocy; },
        teraz: () => teraz(),
        opinia: (ctx, n) => { const q = TQ(); return !!q && q.opinion() >= Number(n); },
        przepisy: () => przepisy(),
        // D40
        d40Oferta: () => pierwszaWizyta("kartograf"),
        d40Chce: (ctx, q, r, st, key) => has() && !S().d40.szkice[key] && liczSzkice() < SP.d40.szkice,
        d40Szkic: (ctx, q, r, st, spot) => d40Szkic(spot),
        d40Zmienne: () => ({ n: liczSzkice(), z: SP.d40.szkice }),
        maMapeWraku: () => count(SP.d40.mapa) > 0,
        wrakPoszlaka: () => { const Wr = T.api("Wrak"); if (Wr && Wr.addClue) Wr.addClue("kartograf"); },
        slawa: (ctx, n) => { const QB = T.api("QuestBoard"); if (QB && QB.addRep) { QB.addRep(Number(n)); T.popup(fill(tx("slawa"), { n }), { kind: "good" }); } },
        // D41
        d41Oferta: () => !!wpis("grajek"),
        zloto: (ctx, n) => $gameParty.gold() >= Number(n),
        d41MeliaWygra: () => zaufanie("melia") >= SP.d41.prog,
        d41Zawody: () => d41Zawody(),
        zaufanie: (ctx, role, n) => T.call("TavernLife", "addTrust", role, Number(n), "D41"),
        renomaZmien: (ctx, n, why) => P.renoma(Number(n), why),
        maMiod: () => count(SP.d41.miod) > 0,
        d41BrakZwrotki: () => !!brakujacaZwrotka(),
        d41Wers: () => { const v = brakujacaZwrotka(); return v ? ["♪ " + v.lines[0] + "\n" + v.lines[1], "♪ " + v.lines[2] + "\n" + v.lines[3]] : []; },
        d41Zwrotka: (ctx, miod) => d41Zwrotka(miod),
        zakoncz: (ctx, id, rw) => { const q = TQ(); if (q && q.finish && aktywne(id)) q.finish(id, rw || {}); },
        // D42
        d42Oferta: () => pierwszaWizyta("zboze") && !w.flag("zbozeZdemaskowany"),
        d42Zmienne: () => { const e = wpis("zboze"); return { n: Object.keys(S().d42.slady).length, narada: e ? e.od + SP.d42.narada.po : "?" }; },
        d42Slad: (ctx, k) => d42Slad(k),
        d42ZnaUmowe: () => { const s = S().d42.slady; return !!(s.narada || s.celnik || s.pokoj); },
        placi: (ctx, n) => zloto(-Number(n)),
        d42Narada: () => { const e = wpis("zboze"); return !!e && w.at("d42Slady") && !S().d42.slady.narada && day() === e.od + SP.d42.narada.po; },
        d42Koniec: (ctx, how) => d42Koniec(how),
        // D43
        d43Oferta: () => !!wpis("urszula"),
        d43Slad: (ctx, k) => { const s = S().d43; if (!s.slady[k]) { s.slady[k] = day(); note("d43.notatka.slad." + k); } },
        d43Zmienne: () => ({ n: Object.keys(S().d43.slady).length }),
        hart: (ctx, n) => attr("wil") >= Number(n),
        przychylnosc: (ctx, n) => { const G = T.api("Garnizon"); try { return !!G && G.favor() >= Number(n); } catch (e) { return false; } },
        d43Koniec: (ctx, how) => d43Koniec(how)
    });

    // ==================================================================
    // 2. I2 - the conversation through a wall
    // ==================================================================
    const POD = [];
    const PAUZA = 120, START = 50;   // frames: between the lines, before the first
    function dodaj(def) {
        if (!def || !def.id) return false;
        const d = Object.assign({ prog: 5, godziny: [0, 24], raz: true, plik: "podroznicy" }, def);
        const i = POD.findIndex(x => x.id === d.id);
        if (i >= 0) POD[i] = d; else POD.push(d);
        return true;
    }
    for (const d of D.PODSLUCH) dodaj(Object.assign({}, d, { gdy: typeof d.gdy === "string" ? (name => () => !!w.hak(name, {}))(d.gdy) : d.gdy }));
    const roomKey = p => (/^\d+$/.test(String(p)) ? "r" + p : String(p));
    const planFloor = mapId => { const TL = T.api("TavernLife"), PD = TL && TL.plan && TL.plan.DATA; return PD ? PD.floors.find(f => f.map === mapId) || null : null; };
    const inRoom = (r, x, y) => r.r.some(q => x >= q[0] && x <= q[2] && y >= q[1] && y <= q[3]);
    const roomAt = (f, x, y) => f.rooms.find(r => inRoom(r, x, y)) || null;
    // where the hero would listen: facing a wall (one cell, in no room) with a guest's or a private room behind it ->
    // { room (the plan's key), name, mode: "sciana" (from a room) | "drzwi" (from a corridor: weaker) } or null
    function miejsceSluchu() {
        if (!window.$gameMap || !window.$gamePlayer) return null;
        const f = planFloor($gameMap.mapId());
        if (!f) return null;
        const x = Math.round($gamePlayer.x), y = Math.round($gamePlayer.y), d = $gamePlayer.direction();
        const dx = d === 6 ? 1 : d === 4 ? -1 : 0, dy = d === 2 ? 1 : d === 8 ? -1 : 0;
        if (!dx && !dy) return null;
        const here = roomAt(f, x, y), front = roomAt(f, x + dx, y + dy), behind = roomAt(f, x + 2 * dx, y + 2 * dy);
        if (!here || front || !behind || behind === here || (behind.t !== "private" && behind.t !== "guest")) return null;
        return { room: behind.k, name: behind.n, mode: here.t === "hall" ? "drzwi" : "sciana" };
    }
    const gdyOk = d => { try { return typeof d.gdy === "function" ? !!d.gdy() : true; } catch (e) { report("podsłuch " + d.id, e); return false; } };
    const zaliczona = d => !!(d.raz && S().podsluch[d.id]);
    // the conversation behind that wall now (its hours, its condition, not heard yet if once)
    function rozmowaZa(mapId, room) {
        const h = hour();
        return POD.find(d => d.mapa === mapId && roomKey(d.pokoj) === room && inHours(h, d.godziny) && !zaliczona(d) && gdyOk(d)) || null;
    }
    let sluch = null;
    const sneaking = () => !!T.call("Hunting", "sneaking");
    // O at a wall: listen (true - the O is used)
    function probuj() {
        if (!has() || sluch || $gameMap.isEventRunning() || $gamePlayer.isMoving()) return false;
        const m = $gameMap.mapId();
        if (m !== 1 && m !== 25 && m !== 26) return false;
        const at = miejsceSluchu();
        if (!at) return false;
        return sluchaj(at);
    }
    function sluchaj(at, force) {
        const m = $gameMap.mapId(), d = force || rozmowaZa(m, at.room);
        if (!d) {
            // nobody talks: a traveller's room - snoring / pages; a room of a conversation (another hour) - nothing; else O is not used
            const nr = /^r(\d+)$/.exec(at.room), h = hour();
            const zajety = !!(nr && S().ksiega[nr[1]]), czyjaRozmowa = POD.some(x => x.mapa === m && roomKey(x.pokoj) === at.room);
            if (!zajety && !czyjaRozmowa) return false;
            dymek($gamePlayer, tx(zajety ? (h >= 22 || h < 6 ? "podsluch.chrapie" : "podsluch.kartki") : "podsluch.nic"), 150);
            return true;
        }
        const tekstyPliku = Watki.teksty(d.plik) || {}, lines = listOf(path(tekstyPliku, d.kwestie));
        if (!lines.length) { report("podsłuch " + d.id, new Error("brak kwestii " + d.plik + ": " + d.kwestie)); return false; }
        const per = attr("per");
        sluch = { d, lines, i: 0, next: Graphics.frameCount + START, x: $gamePlayer.x, y: $gamePlayer.y, dir: $gamePlayer.direction(), mode: at.mode,
            name: at.name, per, pelna: per >= d.prog && at.mode === "sciana", sneak: sneaking(), heard: [] };
        dymek($gamePlayer, tx(at.mode === "drzwi" ? "podsluch.drzwi" : "podsluch.przyloz"), START + 20);
        return true;
    }
    function sluchTick() {
        const z = sluch;
        if (!z) return;
        const moved = Math.abs($gamePlayer.x - z.x) > 0.2 || Math.abs($gamePlayer.y - z.y) > 0.2 || $gamePlayer.direction() !== z.dir || Input.dir8;
        if (moved || $gameMap.isEventRunning() || $gameMessage.isBusy()) { koniec(false, "ruch"); return; }
        if (Graphics.frameCount < z.next) return;
        if (z.i >= z.lines.length) { koniec(true); return; }
        const i = z.i++, raw = String(z.lines[i]);
        z.next = Graphics.frameCount + PAUZA;
        if (z.mode === "drzwi") {
            if (!z.sneak && Math.random() < 0.3) { dymek($gamePlayer, tx("podsluch.ktoTam"), PAUZA); koniec(false, "uslyszeli"); return; }
            if (i % 2 === 1) { z.heard.push("..."); dymek($gamePlayer, tx("podsluch.niewyraznie"), PAUZA - 10); return; }
        }
        const m = /^([^:{}]{1,30}):\s*([\s\S]*)$/.exec(raw);
        const kto = m ? m[1].trim() : "", text = (m ? m[2] : raw).replace(/\{([^}]*)\}/g, (all, k) => (z.per >= z.d.prog ? k : "..."));
        const line = (kto ? kto + ": " : "") + text;
        z.heard.push(line);
        dymek($gamePlayer, fill(tx("podsluch.dymek"), { linia: line }), PAUZA - 10);
    }
    function koniec(done, why) {
        const z = sluch;
        sluch = null;
        if (!z || !has()) return;
        if (!done) {
            if (why === "uslyszeli" && z.d.raz) S().podsluch[z.d.id] = { d: day(), pelna: false, przepadla: true };
            T.emit("podsluchPrzerwany", { id: z.d.id, jak: why });
            return;
        }
        S().podsluch[z.d.id] = { d: day(), pelna: !!z.pelna };
        const tytul = fill(tx("podsluch.notatka"), { co: (z.d.tytul && txm(z.d.tytul)) || z.name });
        T.call("Journal", "addNote", tytul, z.heard.join("\n") + (z.pelna ? "" : "\n\n" + tx("podsluch.niepelna")));
        T.emit("podsluch", { id: z.d.id, pelna: !!z.pelna });
    }
    // a hint once a day per conversation: the hero near the room while they talk ("Zza ściany dochodzą głosy...")
    const podpowiedz = {};
    function podpowiedzTick() {
        const m = $gameMap.mapId();
        if (sluch || (m !== 1 && m !== 25 && m !== 26)) return;
        const f = planFloor(m);
        if (!f) return;
        const h = hour(), d0 = day(), x = $gamePlayer.x, y = $gamePlayer.y;
        for (const d of POD) {
            if (d.mapa !== m || podpowiedz[d.id] === d0 || !inHours(h, d.godziny) || zaliczona(d)) continue;
            const r = f.rooms.find(q => q.k === roomKey(d.pokoj));
            if (!r || !r.r.some(q => x >= q[0] - 3 && x <= q[2] + 3 && y >= q[1] - 3 && y <= q[3] + 3) || !gdyOk(d)) continue;
            podpowiedz[d.id] = d0;
            w.mysl([tx("podsluch.glosy")]);
        }
    }
    // O facing a wall (no event there): listening
    const _triggerButtonAction = Game_Player.prototype.triggerButtonAction;
    Game_Player.prototype.triggerButtonAction = function() {
        if (_triggerButtonAction.call(this)) return true;
        if (Input.isTriggered("ok")) { try { if (probuj()) return true; } catch (e) { report("podsłuch", e); } }
        return false;
    };
    P.podsluch = {
        dodaj, slyszane: id => { const s = has() ? S().podsluch[id] : null; return s ? Object.assign({}, s) : null; },
        trwa: () => !!sluch, stan: () => sluch, lista: () => POD.map(d => d.id), miejsce: miejsceSluchu, przerwij: () => koniec(false, "ruch"),
        // (tests, F9) listen to a conversation where the hero stands: { tryb: "sciana" | "drzwi" }
        sluchaj: (id, o) => { const d = POD.find(x => x.id === id); return !!d && has() && !sluch && sluchaj({ room: roomKey(d.pokoj), name: String(d.pokoj), mode: (o && o.tryb) || "sciana" }, d); },
        zapomnij: id => { if (has()) delete S().podsluch[id]; }
    };

    // ==================================================================
    // 3. The actors at the garrison (Map162): Antek (D43) and Zenon at Kłos's scales (D42)
    // ==================================================================
    const AKT = SP.aktorzy;
    const COND = { actorId: 1, actorValid: false, itemId: 1, itemValid: false, selfSwitchCh: "A", selfSwitchValid: false, switch1Id: 1, switch1Valid: false,
        switch2Id: 1, switch2Valid: false, variableId: 1, variableValid: false, variableValue: 0 };
    function aktorDane(key, a) {
        return { id: a.id, name: txm("aktor." + key) || key, note: "<Podroznicy:aktor>" + (a.bust ? "<Bust:" + a.bust + ">" : ""), x: a.x, y: a.y, pages: [{ conditions: Object.assign({}, COND), directionFix: false,
            image: { tileId: 0, characterName: "", direction: a.dir, pattern: 1, characterIndex: a.indeks || 0 },   // (its sheet when shown)
            list: [C(355, ["PodroznicySprawy.aktor(this, " + JSON.stringify(key) + ");"]), C(0, [])], moveFrequency: 3,
            moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: 3, moveType: 0, priorityType: 1,
            stepAnime: false, through: true, trigger: 0, walkAnime: true }] };
    }
    // (Podroznicy.wstaw asks it for every map: the events of this map)
    function wstaw(data, mapId) {
        const out = [];
        for (const [key, a] of Object.entries(AKT)) if (a.mapa === mapId && a.x < data.width && a.y < data.height) out.push(aktorDane(key, a));
        return out;
    }
    const widac = {
        antek: () => w.at("d43Antek") && inHours(hour(), AKT.antek.godziny),
        zenon: () => w.at("d42Slady") && !!wpis("zboze") && inHours(hour(), AKT.zenon.godziny)
    };
    function aktorzyTick() {
        for (const [key, a] of Object.entries(AKT)) {
            if (a.mapa !== $gameMap.mapId()) continue;
            const ev = $gameMap.event(a.id);
            if (!ev) continue;
            let on = false;
            try { on = has() && widac[key](); } catch (e) { report("aktor " + key, e); }
            const st = ev._podrS || (ev._podrS = {});
            if (st.ukryty !== !on) {
                st.ukryty = !on;
                ev.setTransparent(!on); ev.setThrough(!on); ev._priorityType = on ? 1 : 0;
                if (on) { ev.setImage(a.arkusz, a.indeks || 0); ev.locate(a.x, a.y); ev.setDirection(a.dir); }
            }
            // D42: following Zenon - the hero near him at the scales
            if (on && key === "zenon" && !S().d42.slady.sledzenie && Math.hypot($gamePlayer.x - a.x, $gamePlayer.y - a.y) <= SP.d42.widzi) {
                w.mysl([tx("d42.sledzenie.mysl")]);
                d42Slad("sledzenie");
            }
        }
    }
    T.onEventStart(ev => !!(ev._podrS && ev._podrS.ukryty), { owner: PLUGIN, priority: "hidden" });
    function aktor(interp, key) {
        if (!interp || !has()) return;
        const ev = $gameMap.event(interp.eventId());
        if (!ev || (ev._podrS && ev._podrS.ukryty)) return;
        const spk = { id: ev.eventId(), name: txm("aktor." + key) || key };
        let list;
        if (key === "antek" && w.at("d43Antek")) list = w.rozmowa("d43Antek", { spk });
        else list = Watki.mowa.linesTo([], spk, listOf(txm("aktor." + key + "Mowi")), null, 0, AK);
        if (list && list.length) Watki.mowa.uruchom(interp, list);
    }

    // ==================================================================
    // 4. Borgar's kettle (K71), Zenon buying barley (D42 b), the renown of the quests, Teofil's words on the map (D40)
    // ==================================================================
    (function opcje() {
        T.talk.option({ owner: PLUGIN, who: "borgar", id: "k71Para", order: T.talk.ORDER.extra + 11,
            when: () => has() && w.at("k71Listy") && w.vcount("list_feliks") > 0 && !S().k71.otwarty,
            label: () => txm("k71.para.etykieta") || "?",
            run: ctx => { try { return w.rozmowa("k71Para", { spk: { id: ctx.ev ? ctx.ev.eventId() : -1, name: "Borgar" } }); } catch (e) { report("k71Para", e); return null; } } });
        T.talk.option({ owner: PLUGIN, who: "zboze", id: "d42Sprzedaj", order: T.talk.ORDER.extra + 12,
            when: () => has() && w.flag("d42Handel") && !!wpis("zboze") && S().d42.sprzedal < SP.d42.najwyzej,
            label: () => fill(txm("d42.sprzedaj.etykieta") || "?", { cena: SP.d42.cena, zostalo: SP.d42.najwyzej - S().d42.sprzedal }),
            run: ctx => {
                const spk = { id: ctx.ev ? ctx.ev.eventId() : -1, name: "" }, it = item(SP.d42.jeczmien);
                const n = Math.min(count(SP.d42.jeczmien), SP.d42.najwyzej - S().d42.sprzedal);
                if (!n || !it) { T.popup.need(it ? it.iconIndex : 0, tx("d42.sprzedaj.brak")); return null; }
                $gameParty.loseItem(it, n);
                S().d42.sprzedal += n;
                zloto(n * SP.d42.cena);
                return Watki.mowa.linesTo([], spk, [fill(tx("d42.sprzedaj.ok"), { n, zloto: n * SP.d42.cena })], null, 0, AK);
            } });
        // W10 (docs/PODROZNI.md decyzja 14): the hero's answer to his mother's letter - Tobiasz (after K71) or Urszula (on the day she
        // sails) take it with them: no fee, no customs officer (Przystan.odpowiedz - the same menu as the ferryman's and Roch's)
        const Pz = () => T.api("Przystan");
        const mozeOdpisac = () => { const z = Pz(); try { return !!(z && z.odpowiedz && z.canReply && z.canReply()); } catch (e) { return false; } };
        const nosiciel = (who, when) => T.talk.option({ owner: PLUGIN, who, id: "listDoMatki:" + who, order: T.talk.ORDER.extra + 13,
            when: () => has() && !!wpis(who) && when() && mozeOdpisac(),
            label: () => txm("list.etykieta") || "?",
            run: ctx => { try { return Pz().odpowiedz(who, { id: ctx.ev ? ctx.ev.eventId() : -1, name: P.imie(who) }); } catch (e) { report("list " + who, e); return null; } } });
        nosiciel("tobiasz", () => !!(TQ() && TQ().isDone && TQ().isDone("K71")));
        nosiciel("urszula", () => { const e = wpis("urszula"); return !!e && e.do === day(); });
    })();
    T.on("townQuestAccepted", e => {
        if (!e || !has()) return;
        try {
            if (e.id === "K71") { S().k71 = { oddane: {}, otwarty: "", lord: 0 }; w.setFlag("k71ListLudmily"); }
            else if (e.id === "K72") k72Start();
            else if (e.id === "D39") S().d39 = { oklad: "", noc: 0, soltys: "" };
            else if (e.id === "D40") S().d40 = { szkice: {}, mapa: 0 };
            else if (e.id === "D41") S().d41 = { droga: "", zaklad: "", wygral: "", zwrotka: "" };
            else if (e.id === "D42") S().d42 = { slady: {}, wybor: "", sprzedal: 0 };
            else if (e.id === "D43") S().d43 = { slady: {}, wybor: "" };
        } catch (er) { report("start " + e.id, er); }
    }, { owner: PLUGIN });
    T.on("townQuestDone", e => { if (e && has() && SP.renoma[e.id]) P.renoma(SP.renoma[e.id], e.id); }, { owner: PLUGIN });
    T.on("podsluch", e => { if (e && e.id === "d42Narada" && has()) d42Slad("narada"); }, { owner: PLUGIN });
    // the island's map: a place not seen yet - Teofil's sentence instead of "?" once D40 is done (MapaWyspy.addHint; asked once the
    // game runs - the map's plugin may stand below this one)
    let mapaHak = false;
    function mapa() {
        if (mapaHak) return;
        const M = T.api("MapaWyspy");
        if (!M || !M.addHint) return;
        mapaHak = true;
        M.addHint(key => (has() && w.flag("szkicKartografa") ? txm("d40.karta." + key) || null : null));
    }

    // ------------------------------------------------------------------ the clock
    T.on("newGame", () => { przepisy(); mapa(); }, { owner: PLUGIN });
    T.on("load", () => { sluch = null; przepisy(); mapa(); }, { owner: PLUGIN });
    T.on("mapReady", () => { sluch = null; przepisy(); mapa(); if (has() && window.$gameMap && $gameMap.mapId() === AKT.antek.mapa) aktorzyTick(); }, { owner: PLUGIN });
    let ticks = 0;
    T.onMapUpdate(() => {
        if (sluch) { try { sluchTick(); } catch (e) { report("podsłuch", e); sluch = null; } }
        if (++ticks % 30 || !has()) return;
        if ($gameMap.mapId() === AKT.antek.mapa) aktorzyTick();
        else if (!$gameMap.isEventRunning()) { try { podpowiedzTick(); } catch (e) { report("podpowiedź", e); } }
    }, { owner: PLUGIN, name: "podroznicySprawy" });

    // ==================================================================
    // The API
    // ==================================================================
    window.PodroznicySprawy = T.register(PLUGIN, {
        wstaw, aktor, podsluch: P.podsluch, przepisy, k72Start, d42Slad, d43Koniec, d42Koniec, brakujacaZwrotka,
        liczSzkice: () => (has() ? liczSzkice() : 0), PRZEPIS
    });
})();
