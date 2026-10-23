// Broń, zbroje, tarcze i dodatki (js/plugins/Bron_Data.js + Bron.js; nie ma ich jeszcze w js/plugins.js - test wkłada je do strony) na
// danych z tools/bron/staging (przedmioty 300-406, notatki starych broni, ikony 576+) - BEZ instalacji: przedmioty trafiają tylko do
// $dataItems w stronie, ikony do IconSet w pamięci. Sprawdza:
//   - dane: każda rzecz ma miejsce (broń w MELEE albo łuk / proca, zbroja w ARMORS i na części Equipment, tarcza w SHIELDS i w lewej
//     ręce, dodatek w „Dodatku”), statystyki, ikonę, cenę, wagę, zużycie (Durability); stare bronie z notatkami mają te same liczby;
//   - walka używa nowych liczb: cios z żelaza mocniejszy niż z brązu, ze stali jeszcze mocniejszy (prawdziwy cios w cel); ciężki młot
//     wolniejszy (zamach kilofa) i droższy w oddechu; za niski poziom osłabia; buzdygan mocniej w zbroję; zbroja zmniejsza cios
//     (części się sumują, sufit), tarcza blokuje według danych; kara oddechu ciężkiej zbroi, skradanie, chód;
//   - łuki: najlepszy posiadany strzela (Hunting_Weapons.defOf), karta i ręka;
//   - dodatki przez Combat.perk (życie, krytyk), unikaty (flaga, przychylność garnizonu), łup z bossa, łup ludzi, skrzynia podziemi;
//   - sklepy: kupno, sprzedaż, naprawa, kwatermistrz (przychylność), kantor, szmaciarz (używane), menu u garbarza, rozmowa z Tadkiem
//     (menu + „Porozmawiaj”), okno sklepu klawiszami (zrzut: tests/bron_dane/);
//   - kucie (przepis widać od poziomu, wykucie), zużycie i naprawa, F9 (wszystkie, zestaw na poziom N, +1000 G), brak błędów w konsoli.
//   node tests/bron_dane_test.js          (port CDP 9586; CDP_PORT=... inny)
"use strict";
const kit = require("./lib/kit.js");
const fs = require("fs");
const path = require("path");

const STAGING = path.join(__dirname, "..", "tools", "bron", "staging");
const OUT = path.join(__dirname, "bron_dane");
fs.mkdirSync(OUT, { recursive: true });
const ITEMS = JSON.parse(fs.readFileSync(path.join(STAGING, "Items_dopisek.json"), "utf8"));
const NOTES = JSON.parse(fs.readFileSync(path.join(STAGING, "Items_notatki.json"), "utf8"));
// the old weapons' numbers as Combat_Fight.js had them by hand (they must stay)
const OLD = { 156: [13, 26, 1.45, 10], 115: [26, 30, 1.6, 16], 60: [17, 24, 1.55, 16], 154: [20, 16, 2.25, 12], 116: [30, 42, 1.45, 22], 63: [22, 36, 1.45, 22] };

kit.test({ port: 9586, bootCheck: "gra się uruchamia", plugins: ["Bron_Data", "Bron"] }, async t => {
    t.check("Bron_Data i Bron w stronie", ["injected", "registered"].includes(t.plugins.Bron_Data) && ["injected", "registered"].includes(t.plugins.Bron), t.plugins);

    // ---- the staging into the page: the items, the old ones' notes, the icons under IconSet
    const loaded = await t.json(`(function(){ const add = ${JSON.stringify(ITEMS)}, notes = ${JSON.stringify(NOTES)};
        for (let i = $dataItems.length; i < 300; i++) $dataItems[i] = { id: i, name: "", note: "", meta: {}, iconIndex: 0, itypeId: 1, price: 0, description: "" };
        for (const it of add) { DataManager.extractMetadata(it); $dataItems[it.id] = it; }
        for (const id of Object.keys(notes)) { const it = $dataItems[id]; if (it.note.indexOf(notes[id]) < 0) it.note = it.note ? it.note + "\\n" + notes[id] : notes[id]; DataManager.extractMetadata(it); }
        Equipment.readNotes(); Combat.refreshGear(true); Bron.wire();
        return { len: $dataItems.length, last: $dataItems[$dataItems.length - 1].name }; })()`);
    t.check("staging w $dataItems (300-" + (299 + ITEMS.length) + ")", loaded.len === 300 + ITEMS.length, loaded);
    await t.eval(`(function(){ const old = ImageManager.loadSystem("IconSet"), add = Bitmap.load("tools/bron/staging/IconSet_nowe.png");
        window.__iconsDone = false;
        const join = () => { if (!old.isReady() || !add.isReady()) return setTimeout(join, 50);
            const top = Math.max(old.height, 36 * 32), b = new Bitmap(512, top + add.height); b.blt(old, 0, 0, 512, old.height, 0, 0); b.blt(add, 0, 0, 512, add.height, 0, top);
            ImageManager._system["img/system/IconSet.png"] = b; window.__iconsDone = b.height; };
        join(); return 0; })()`);
    t.check("ikony 576+ doklejone w pamięci", await t.until("window.__iconsDone > 1152", 15), await t.eval("window.__iconsDone"));

    // ---- the data
    const data = await t.json(`(function(){ const D = Bron_Data, E = Equipment, F = Tawerna.api("Combat_parts").fight, DU = Durability, bad = [], kinds = {};
        const PART = { glowa: "head", tors: "torso", rece: "hands", nogi: "legs", stopy: "feet" };
        for (const p of D.PRZEDMIOTY) { const it = $dataItems[p.id];
            if (!it || !it.name) { bad.push(p.id + ": brak w $dataItems"); continue; }
            if (!p.istnieje && (it.name !== p.nazwa || it.iconIndex !== 576 + p.id - 300 || !/<Weight:\\d+>/.test(it.note) || !(it.price > 0))) bad.push(p.id + ": nazwa / ikona / waga / cena");
            if (it.note.indexOf(D.notatka(p)) < 0) bad.push(p.id + ": notatka");
            kinds[p.typ] = (kinds[p.typ] || 0) + (p.istnieje ? 0 : 1);
            if (p.typ === "bron") {
                const s = D.staty(p);
                if (s.dystans) { if (!(s.damage > 0 && s.range > 0) || !Bron.isRanged(p.id)) bad.push(p.id + ": łuk / proca"); }
                else { const w = F.MELEE[p.id]; if (!w || !(w.dmg > 0) || !(w.cost > 0) || !(w.reach > 0) || !w.combo || !w.combo.length || F.MELEE_ORDER.indexOf(p.id) < 0) bad.push(p.id + ": MELEE"); }
            } else if (p.typ === "zbroja") {
                if (!F.ARMORS[p.id] || !(F.ARMORS[p.id].reduce > 0)) bad.push(p.id + ": ARMORS");
                if (E.WEARABLE[p.id] !== PART[p.miejsce]) bad.push(p.id + ": część " + E.WEARABLE[p.id]);
            } else if (p.typ === "tarcza") {
                if (!F.SHIELDS[p.id] || !(F.SHIELDS[p.id].reduce > 0)) bad.push(p.id + ": SHIELDS");
                if (E.WEARABLE[p.id] !== "left") bad.push(p.id + ": lewa ręka");
            } else if (E.WEARABLE[p.id] !== "extra") bad.push(p.id + ": dodatek");
            if (p.typ !== "dodatek" && (!DU.TOOLS[p.id] || !(DU.lifeOf(p.id) > 0))) bad.push(p.id + ": zużycie");
            if (!p.opis && !p.istnieje) bad.push(p.id + ": opis");
        }
        const old = {}; for (const id of ${JSON.stringify(Object.keys(OLD))}) { const w = F.MELEE[id]; old[id] = w ? [w.dmg, w.poise, w.reach, w.cost] : null; }
        return { bad, kinds, old, sh155: F.SHIELDS[155], order: F.MELEE_ORDER.slice(-7) }; })()`);
    t.check("dane: każda rzecz w bazie z notatką, ikoną, ceną, wagą; broń w MELEE, zbroja w ARMORS i na swojej części, tarcza w lewej ręce, dodatek w Dodatku, zużycie",
        data.bad.length === 0, data.bad.slice(0, 10));
    const looks = await t.json(`(function(){ const U = window.Ubior_Data || {}, all = Object.assign({}, U.WZORY || {}, U.WZORY_ZBROI || {}, U.WZORY_BRONI || {}, U.WZORY_TARCZ || {});
        return { n: Object.keys(all).length, missing: Bron_Data.PRZEDMIOTY.filter(p => p.typ !== "dodatek" && !all[Bron_Data.wygladOf(p)]).map(p => p.id + ":" + Bron_Data.wygladOf(p)) }; })()`);
    t.check("klucze wyglądu: każdy klucz z notatek jest w Ubior_Data.js grafiki (WZORY_ZBROI, WZORY_BRONI, WZORY_TARCZ, WZORY)", looks.n > 0 && looks.missing.length === 0, looks);
    t.check("~100 rzeczy: 48 broni (w tym unikaty i 2 stalowe narzędzia), 38 zbroi, 7 tarcz, 16 dodatków", data.kinds.bron === 48 && data.kinds.zbroja === 38 && data.kinds.tarcza === 7 && data.kinds.dodatek === 16, data.kinds);
    t.check("stare bronie z notatkami mają te same liczby co przedtem, kolejność starych zostaje",
        Object.keys(OLD).every(id => JSON.stringify(data.old[id]) === JSON.stringify(OLD[id])) && JSON.stringify(data.order) === "[115,154,60,116,63,156,59]" && data.sh155.reduce === 0.75 && data.sh155.breath === 0.7,
        { old: data.old, order: data.order, sh155: data.sh155 });

    // ---- a new game: the town square, a strong hero (no level's lack) - the target in front of him
    const ok = await t.newGame({ map: 3, x: 22, y: 14, dir: 6, hour: 10, day: 35, quiet: true, minimap: false });
    t.check("nowa gra", ok);
    if (!ok) return;
    await t.eval(`(function(){ Combat.hero().level = 30; Combat.hero().rev = (Combat.hero().rev || 0) + 1; $gameSystem.setStamina(250); Bron.wire(); Bron.refresh();
        window.__hits = []; window.__tgt = null;
        if (!window.__tgtHooked) { window.__tgtHooked = true; Hunting.addTargets(() => window.__tgt ? [window.__tgt] : []); }
        return 0; })()`);
    const blow = async (id, kind) => t.json(`new Promise(res => { Combat.resetAct(); $gameParty.gainItem($dataItems[${id}], 1); Combat.setHand("m${id}");
        const ref = { kind: () => ${JSON.stringify(kind || "")} }; window.__hits = [];
        window.__tgt = { x: $gamePlayer._realX + 0.5 + 1.0, y: $gamePlayer._realY + 0.5, radius: 0.5, ref, hit: (d, how, extra) => { window.__hits.push({ d, crit: !!(extra && extra.crit) }); } };
        $gamePlayer.setDirection(6); const w = Combat.weaponNow(${id}); Combat.pressAttack();
        let n = 0; const wait = () => { if (window.__hits.length || ++n > 120) { window.__tgt = null; const h = window.__hits[0] || null; res({ hit: h, dmg: w.dmg, cost: w.cost, base: h ? (h.crit ? Math.round(h.d / 1.6) : h.d) : 0 }); } else requestAnimationFrame(wait); }; wait(); })`);
    const br = await blow(304), fe = await blow(305), st = await blow(308);
    t.check("cios w cel: brązowy miecz < żelazny < stalowy (obrażenia z danych: 23 / 27 / 31)", br.hit && fe.hit && st.hit && br.base === 23 && fe.base === 27 && st.base === 31, { br, fe, st });
    const mace = await blow(317, "zbroja");
    t.check("buzdygan w pustą zbroję: +30% (25 -> 33)", mace.hit && mace.base === Math.round(25 * 1.3), mace);
    const heavy = await t.json(`(function(){ const CT = Tawerna.api("ChoppableTree"), F = Tawerna.api("Combat_parts").fight, m = F.MELEE[327], s = F.MELEE[305];
        return { hammer: CT.swingKind(m.combo[0]).frames, sword: CT.swingKind(s.combo[0]).frames, hc: Combat.meleeInfo(327).breath, sc: Combat.meleeInfo(305).breath, hp: m.poise, sp: s.poise }; })()`);
    t.check("młot bojowy cięższy: zamach kilofa (dłuższy niż miecza), droższy w oddechu, mocniej chwieje", heavy.hammer > heavy.sword && heavy.hc > heavy.sc && heavy.hp > heavy.sp, heavy);
    const lack = await t.json(`(function(){ const h = Combat.hero(); h.level = 6; const w = Combat.weaponNow(308), o = Bron.opis(308); h.level = 30; const w2 = Combat.weaponNow(308); return { dmg: w.dmg, cost: w.cost, lack: w.lack, full: w2.dmg, opis: o }; })()`);
    t.check("za niski poziom (6 przy stali 16): słabiej o 30% i drożej w oddechu, karta to mówi", lack.dmg === Math.round(31 * 0.7) && lack.cost > 10 && Math.abs(lack.lack - 0.3) < 1e-9 && lack.full === 31 && /słabiej o 30%/.test(lack.opis), lack);

    // ---- the armour and the shield
    const hit = (dmg, block) => t.json(`(function(){ const a = $gameParty.leader(); a.recoverAll(); Combat.resetAct(); $gamePlayer.setDirection(6); const hp0 = a.hp;
        ${block ? "Combat.act.mode = 'block'; Combat.act.blockT = 99;" : ""}
        const r = Combat.hitPlayer({ damage: ${dmg}, poise: 0, from: { x: $gamePlayer._realX + 1.5, y: $gamePlayer._realY + 0.5 }, name: "test", knock: 0 });
        return { r, lost: hp0 - a.hp }; })()`);
    const bare = await hit(50);
    await t.eval("(function(){ $gameParty.gainItem($dataItems[353], 1); Equipment.equip('torso', 353); Bron.refresh(); return 0; })()");
    const mail0 = await t.eval("Durability.left(353)");
    const mail = await hit(50);
    const mailLeft = await t.eval("Durability.left(353)");
    await t.eval("(function(){ for (const [p, id] of [['head', 346], ['hands', 362], ['legs', 368], ['feet', 372]]) { $gameParty.gainItem($dataItems[id], 1); Equipment.equip(p, id); } Bron.refresh(); return 0; })()");
    const full = await hit(50);
    const arm = await t.json("(function(){ const a = Combat.armor(); return { reduce: a.reduce, n: a.pieces.length, kara: a.kara }; })()");
    t.check("zbroja zmniejsza cios: bez niej 50, w kolczudze (28%) 36 i kolczuga się zużywa, w całym żelazie z kolczugą (48%) 26",
        bare.lost === 50 && mail.lost === 36 && mailLeft === mail0 - 1 && full.lost === Math.round(50 * (1 - arm.reduce)) && arm.n === 5 && Math.abs(arm.reduce - 0.48) < 0.001, { bare, mail, mail0, mailLeft, full, arm });
    const steel = await t.json(`(function(){ for (const [p, id] of [['head', 348], ['torso', 359], ['hands', 365], ['legs', 370], ['feet', 374]]) { $gameParty.gainItem($dataItems[id], 1); Equipment.equip(p, id); }
        Bron.refresh(); const a = Combat.armor(); return { reduce: a.reduce }; })()`);
    t.check("sufit zbroi: komplet zakonny (59%) liczy się jako 58%", Math.abs(steel.reduce - 0.58) < 1e-9, steel);
    const heavyKara = await t.json(`(function(){ $gameParty.gainItem($dataItems[354], 1); for (const [p, id] of [['head', 346], ['torso', 354], ['hands', 362], ['legs', 368], ['feet', 372]]) Equipment.equip(p, id);
        Bron.refresh(); const b1 = Combat.maxBreath(), sn = Combat.perk("sneak"), d1 = $gamePlayer.distancePerFrame();
        for (const p of ['head', 'torso', 'hands', 'legs', 'feet']) Equipment.unequip(p); Bron.refresh(); Combat.resetAct();
        return { b1, b0: Combat.maxBreath(), sn, sn0: Combat.perk("sneak"), d1, d0: $gamePlayer.distancePerFrame() }; })()`);
    t.check("ciężka zbroja (żelazna łuska + reszta): krótszy oddech (-10%), głośniej przy skradaniu (-0,31), chód (buty okute +6%, łuska -3%, nagolenniki -1%)",
        heavyKara.b1 === Math.max(30, Math.round(heavyKara.b0 * 0.9)) && Math.abs(heavyKara.sn - heavyKara.sn0 + 0.31) < 1e-6 && Math.abs(heavyKara.d1 / heavyKara.d0 - 1.02) < 1e-6, heavyKara);
    await t.eval("(function(){ $gameParty.gainItem($dataItems[155], 1); Equipment.equip('left', 155); return 0; })()");
    const wood = await hit(50, true);
    await t.eval("(function(){ $gameParty.gainItem($dataItems[378], 1); Equipment.equip('left', 378); return 0; })()");
    const kite = await hit(50, true);
    const kiteLeft = await t.eval("Durability.left(378)");
    t.check("tarcza blokuje według danych: drewniana 75% (zostaje 13), migdałowa 82% (zostaje 9) - i się zużywa", wood.r === "blocked" && kite.r === "blocked" && wood.lost === 13 && kite.lost === 9 && kiteLeft === 149, { wood, kite, kiteLeft });
    const buckler = await t.json(`(function(){ const w0 = Combat.parryWindow(); $gameParty.gainItem($dataItems[377], 1); Equipment.equip('left', 377); const w1 = Combat.parryWindow(); Equipment.equip('left', 378); return { w0, w1 }; })()`);
    t.check("puklerz: okno parowania dłuższe (x1,5)", buckler.w1 > buckler.w0 && Math.abs(buckler.w1 - buckler.w0 * 1.5) <= 1, buckler);

    // ---- the bows
    const bow = await t.json(`(function(){ $gameParty.gainItem($dataItems[126], 1); $gameParty.gainItem($dataItems[127], 20); const before = Bron.rangedItem();
        $gameParty.gainItem($dataItems[336], 1); const after = Bron.rangedItem(), def = Tawerna.api("Hunting_parts").weapons.defOf("bow");
        Combat.setHand("ranged"); const fi = Combat.fightInfo(); const right = Equipment.current("right");
        return { before, after, dmg: def.damage, item: def.item, range: def.range, fi: fi.weapon.id, shot: fi.weapon.shot, right }; })()`);
    t.check("łuk refleksyjny: najlepszy posiadany strzela (44 zamiast 30), karta i prawa ręka go pokazują", bow.before === 126 && bow.after === 336 && bow.dmg === 44 && bow.item === 336 && bow.fi === 336 && bow.right === 336, bow);

    // ---- the trinkets and the uniques
    const ring = await t.json(`(function(){ const h0 = Combat.perk("hp.max"), m0 = Combat.heroMhp(); $gameParty.gainItem($dataItems[384], 1); Equipment.equip('extra', 384); Bron.refresh();
        const h1 = Combat.perk("hp.max"), m1 = Combat.heroMhp(); $gameParty.gainItem($dataItems[391], 1); Equipment.equip('extra', 391); Bron.refresh();
        return { h0, h1, m0, m1, crit: Combat.perk("melee.crit"), opis: Equipment.slots().find(s => s.id === "extra").note }; })()`);
    t.check("dodatek przez Combat.perk: pierścień z hematytem +15 życia, pierścień najemnika +4% krytyka (jeden naraz)", ring.h1 - ring.h0 === 15 && ring.m1 - ring.m0 === 15 && Math.abs(ring.crit - 0.04) < 1e-9 && /krytyczne \+4%/.test(ring.opis), ring);
    const uniq = await t.json(`(function(){ const q = TownQuests.state(); q.flags.borgarWie = 35; const n = Bron.checkUniques(); const a = $gameParty.numItems($dataItems[396]);
        const again = Bron.checkUniques(); Garnizon.addFavor(100, "test", true); const b = $gameParty.numItems($dataItems[402]);
        return { n, a, again, b, dane: Object.keys(Bron.state().dane) }; })()`);
    t.check("unikaty: flaga W4 (borgarWie) -> Miecz Bogumiła raz; przychylność garnizonu 80 -> Szabla spod Brzozowej Woli", uniq.n >= 1 && uniq.a === 1 && uniq.again === 0 && uniq.b === 1, uniq);
    const loot = await t.json(`(function(){ const CD = CreaturesData, HD = HumansData;
        return { b70: CD.BOSSES.boss_70.loot.some(l => l[0] === 399 && l[1] === 1), b90: CD.BOSSES.boss_90.loot.some(l => l[0] === 405), guard: CD.BOSSES.guardian.loot.some(l => l[0] === 400),
            merc: HD.KINDS.mercenary.loot.some(l => l[0] === 353), sack: HD.CAMP.sack.loot.some(l => l[0] === 344), armour: CD.KINDS.zbroja.loot.some(l => l[0] === 345),
            lord: DworData.GEAR.some(g => g[0] === 346) }; })()`);
    t.check("łupy: boss 70 - Długi miecz bez herbu, boss 90 - Kolczuga Ostatniej Straży, strażnik bramy - hełm; najemnik, worek w obozie, pusta zbroja, zbrojownia Lorda",
        Object.values(loot).every(Boolean), loot);
    const ug = await t.json(`(function(){ const UG = Underground, keep = { info: UG.info, floorOf: UG.floorOf, bandOf: UG.bandOf };
        UG.info = () => ({ seed: 0, loot: {} }); UG.floorOf = () => 85; UG.bandOf = f => keep.bandOf(f);
        let got = null, seed = 0;
        for (seed = 1; seed < 400 && !got; seed++) { const s = seed; UG.info = () => ({ seed: s, loot: { 7: { kind: "relikwiarz", got: [] } } }); got = Bron.ugExtra(7); }
        Object.assign(UG, keep); const p = got ? Bron_Data.przedmiot(got) : null;
        return { got, seed, poziom: p ? p.poziom : 0, have: got ? $gameParty.numItems($dataItems[got]) : 0 }; })()`);
    t.check("relikwiarz na piętrze 85: dodatkowy rzut daje rzecz zakonną (poziom 18+)", !!ug.got && ug.poziom >= 18 && ug.have >= 1, ug);

    // ---- the shops
    await t.gold(5000);
    const buy = (key, id, used) => t.json(`(function(){ const g0 = $gameParty.gold(), n0 = $gameParty.numItems($dataItems[${id}]), r = Bron.kup(${JSON.stringify(key)}, ${id}, ${!!used});
        return { r, paid: g0 - $gameParty.gold(), got: $gameParty.numItems($dataItems[${id}]) - n0, worn: Equipment.worn(${id}) }; })()`);
    const k1 = await buy("kowal", 321);
    t.check("kowal Tadek: żelazny topór bojowy za 105 G, w torbie", k1.r.ok && k1.paid === 105 && k1.got === 1, k1);
    const lock = await t.json(`(function(){ const G = Garnizon.state(); const f0 = G.favor; G.favor = 20; const r1 = Bron.kup("kwatermistrz", 355); const r2 = Bron.kup("kwatermistrz", 353); G.favor = f0; return { r1, r2 }; })()`);
    t.check("kwatermistrz: brygantyna tylko od przychylności 50, kolczuga od razu", !lock.r1.ok && /przychylność garnizonu 50/.test(lock.r1.why) && lock.r2.ok, lock);
    const kan = await t.json(`(function(){ const mul = Kantor.priceMul(), g0 = $gameParty.gold(), r = Bron.kup("kantor", 308); return { r, paid: g0 - $gameParty.gold(), mul }; })()`);
    t.check("kantor: stalowy miecz za 240 G razy cennik kantoru", kan.r.ok && kan.paid === Math.round(240 * kan.mul), kan);
    const used = await t.json("Bron.usedToday('szmaciarz')");
    if (used.length) {
        const u1 = await buy("szmaciarz", used[0], true);
        const left = await t.json(`({ left: Durability.left(${used[0]}), life: Durability.lifeOf(${used[0]}), again: Bron.usedToday('szmaciarz').includes(${used[0]}), price: Bron_Data.cenaOf(Bron_Data.przedmiot(${used[0]})) })`);
        t.check("szmaciarz: używana rzecz za pół ceny, zużyta w połowie, raz na dzień", u1.r.ok && u1.paid === Math.round(left.price * 0.5) && Math.abs(left.left - left.life / 2) <= 1 && !left.again, { u1, left });
    } else t.check("szmaciarz: używane rzeczy na dziś", false, used);
    const sell = await t.json(`(function(){ const g0 = $gameParty.gold(); const r = Bron.sprzedaj("kowal", 321); const no = Bron.sprzedaj("kowal", 396); const cloth = Bron.sprzedaj("kowal", 349);
        return { r, got: $gameParty.gold() - g0, n: $gameParty.numItems($dataItems[321]), no, cloth, sellPerk: Combat.perk("sell") }; })()`);
    t.check("sprzedaż: topór u kowala za 40% (42 G), unikatu nie kupi, płótna też nie", sell.r.ok && sell.got === Math.round(105 * 0.4 * (1 + sell.sellPerk)) && sell.n === 0 && !sell.no.ok && !sell.cloth.ok, sell);
    const fix = await t.json(`(function(){ $gameParty.gainItem($dataItems[305], 1); Durability.setUsed(305, 110); const cost = Bron.repairPrice(305), g0 = $gameParty.gold(); const r = Bron.napraw("kowal", 305);
        const wrong = Bron.napraw("garbarz", 305); return { cost, r, paid: g0 - $gameParty.gold(), left: Durability.left(305), life: Durability.lifeOf(305), wrong }; })()`);
    t.check("naprawa u kowala: połowa zużycia żelaznego miecza za 30% x 1/2 ceny (17 G), wraca do pełna; garbarz metalu nie naprawi",
        fix.r.ok && fix.cost === 17 && fix.paid === 17 && fix.left === fix.life && !fix.wrong.ok, fix);
    const menus = await t.json(`(function(){ const ev = { eventId: () => 0 }, labels = list => { const c = (list || []).find(x => x.code === 102); return c ? c.parameters[0] : []; };
        $gameSystem.setDayNightHour(10); return { kowal: labels(Bron.menu("kowal", ev)), garbarz: labels(Ubior_Sklepy.menu("garbarz", ev)), szmaciarz: labels(Ubior_Sklepy.menu("szmaciarz", ev)) }; })()`);
    t.check("menu: Tadek „Pokaż broń i zbroje / Sprzedaj / Napraw / Porozmawiaj”, garbarz „Skórzane zbroje”, szmaciarz „Stara broń i błyskotki” przed „Porozmawiaj”",
        menus.kowal[0] === "Pokaż broń i zbroje" && menus.kowal.includes("Porozmawiaj") && menus.garbarz.indexOf("Skórzane zbroje") >= 0 && menus.garbarz.indexOf("Skórzane zbroje") < menus.garbarz.indexOf("Porozmawiaj")
        && menus.szmaciarz.includes("Stara broń i błyskotki"), menus);

    // ---- a real talk with Tadek in the town (the quests held quiet for it): the menu, then "Porozmawiaj" - the rest of the talk
    const town = await t.go(8, 40, 40, 2);
    await t.setHour(10);
    await t.frames(30);
    const tadek = await t.eval("(function(){ const e = TownLife.eventOf('kowal'); return e ? e.eventId() : 0; })()");
    if (town && tadek) {
        await t.eval(`(function(){ const q = TownQuests; window.__qkeep = { remarkFor: q.remarkFor, talkFor: q.talkFor, markers: q.markers, offerable: q.offerable };
            q.remarkFor = () => null; q.talkFor = () => null; q.markers = () => ({}); q.offerable = () => false; return 0; })()`);
        const talk1 = await t.talkTo(tadek, ["Nic, dziękuję"]);
        const talk2 = await t.talkTo(tadek, ["Porozmawiaj"]);
        await t.eval("(function(){ Object.assign(TownQuests, window.__qkeep); return 0; })()");
        const ch1 = (talk1.choices || []).map(c => [].concat(c.choices || c.list || c).join("|")).join(" ");
        t.check("rozmowa z Tadkiem: menu broni (wybór „Nic”), potem „Porozmawiaj” - dalsza rozmowa bez tego menu", talk1.done && /Pokaż broń i zbroje/.test(ch1) && talk2.done && talk2.log.length >= 2,
            { ch1, text2: talk2.text, choices2: talk2.choices });
    } else t.check("Tadek w miasteczku", false, { town, tadek });

    // ---- Kłos's deputy (D27: Kłos handed over): the soldier by the barrels sells the same, from the same favour
    const gz = await t.go(162, 42, 18, 2);
    await t.setHour(10);
    await t.frames(20);
    await t.eval("(function(){ TownQuests.state().flags.klosWydany = 35; Garnizon.state().favor = 30; return 0; })()");
    const dep = gz ? await t.talkTo(643, ["Bywaj."]) : null;
    const depShop = await t.json(`({ locked: Bron.kup("zastepca", 355), ok: Bron.kup("zastepca", 353), klos: Garnizon.klosGone(), witaj: Bron_Data.SKLEPY.zastepca.teksty.witaj,
        klosRows: Bron.menuRows("kwatermistrz", null) })`);
    await t.eval("(function(){ delete TownQuests.state().flags.klosWydany; return 0; })()");
    const before = await t.json(`({ dep: Bron.menuRows("zolnierz:beczki", null), klos: (Bron.menuRows("kwatermistrz", null) || []).map(r => r.label) })`);
    const depCh = dep ? (dep.choices[0] || []).join("|") : "", depLog = dep ? dep.log.map(l => l.t.replace(/\n/g, " ")).join(" / ") : "";
    t.check("zastępca Kłosa (żołnierz przy beczkach) po D27: jego słowa, powitanie i wybór „Pokaż zbrojownię / Bywaj.”; ten sam towar, brygantyna od przychylności 50; przed D27 linijka jest w menu Kłosa, nie u żołnierza",
        !!dep && dep.done && depCh === "Pokaż zbrojownię|Bywaj." && dep.log.length >= 2 && depShop.witaj.some(w => depLog.indexOf(w.slice(0, 30)) >= 0)
        && !depShop.locked.ok && depShop.ok.ok && depShop.klos && depShop.klosRows === null && before.dep === null && JSON.stringify(before.klos) === '["Pokaż zbrojownię"]',
        { depCh, depLog, depShop: { locked: depShop.locked, ok: depShop.ok.ok, klos: depShop.klos, klosRows: depShop.klosRows }, before });

    // ---- the steel axe and pickaxe: the tools (fewer blows than the iron ones) and weapons of steel
    const tools = await t.json(`(function(){ const O = Tawerna.api("ChoppableTree_parts").objects; [407, 408, 115, 116].forEach(id => $gameParty.loseItem($dataItems[id], 99));
        const act = (tool, needed) => { const a = { tool, needed, cost: 5 }; O.applyIronTool(a); return { n: a.needed, cost: a.cost, id: a.ironItem ? a.ironItem.id : 0 }; };
        const a0 = act(60, 20); $gameParty.gainItem($dataItems[115], 1); const a1 = act(60, 20); $gameParty.gainItem($dataItems[407], 1); const a2 = act(60, 20);
        $gameParty.gainItem($dataItems[116], 1); const r1 = act(63, 26); $gameParty.gainItem($dataItems[408], 1); const r2 = act(63, 26);
        const F = Tawerna.api("Combat_parts").fight, w = F.MELEE[407], k = F.MELEE[408];
        return { a0, a1, a2, r1, r2, own: O.ownsTool(63), axe: w && [w.dmg, w.cost], pick: k && [k.dmg, k.cost], life: [Durability.lifeOf(407), Durability.lifeOf(408)],
            forge: Bron_Data.przepisy().forge.filter(r => r.output[0] === 407 || r.output[0] === 408).length, kantor: Bron_Data.SKLEPY.kantor.sprzedaje.filter(id => id === 407 || id === 408).length }; })()`);
    t.check("stalowa siekiera i kilof: sosna 20 uderzeń -> żelazną 13, stalową 10 (i mniej sił); ruda 26 -> 17 / 13; w walce jak stal (30 / 35), zużycie, kuźnia, kantor",
        tools.a0.n === 20 && tools.a1.n === 13 && tools.a2.n === 10 && tools.a2.id === 407 && tools.a2.cost === 3 && tools.r1.n === 17 && tools.r2.n === 13 && tools.r2.id === 408
        && tools.own && JSON.stringify(tools.axe) === "[30,15]" && JSON.stringify(tools.pick) === "[35,21]" && tools.life[0] === 320 && tools.life[1] === 260 && tools.forge === 2 && tools.kantor === 2, tools);

    // ---- the shop's window by keys (a screenshot)
    await t.eval("Bron.otworz('kowal', 'kup'); 0");
    const opened = await t.until("SceneManager._scene && SceneManager._scene.constructor.name === 'Scene_BronSklep' && !SceneManager.isSceneChanging()", 10);
    await t.frames(20);
    await t.press("down");
    await t.press("down");
    await t.frames(10);
    await t.shot(path.join(OUT, "sklep_kowal.png"));
    const st1 = await t.json("SceneManager._scene.state()");
    await t.press("right");
    await t.frames(10);
    const st2 = await t.json("SceneManager._scene.state()");
    await t.press("cancel");
    const back = await t.until("SceneManager._scene instanceof Scene_Map && !SceneManager.isSceneChanging()", 10);
    t.check("okno sklepu kowala: lista z ceną (poziom 30 - cała), strzałki, zakładka Sprzedaż, P - wyjście", opened && st1.rows.length >= 20 && st1.index === 2 && st2.tab === "sprzedaj" && back, { st1: { tab: st1.tab, n: st1.rows.length, index: st1.index }, st2: { tab: st2.tab, rows: st2.rows.slice(0, 4) } });

    // ---- the forge: the recipes by the level, a forged sword
    const forge = await t.json(`(function(){ const h = Combat.hero(); h.level = 1; Bron.syncRecipes(); const at1 = Farming.BUILDINGS.forge.recipes.filter(r => r.bron).map(r => r.output[0]);
        h.level = 8; Bron.syncRecipes(); const at8 = Farming.BUILDINGS.forge.recipes.filter(r => r.bron).map(r => r.output[0]);
        h.level = 30; Bron.syncRecipes(); const all = Farming.BUILDINGS.forge.recipes.filter(r => r.bron).length, tan = Farming.BUILDINGS.tannery.recipes.filter(r => r.bron).length, wb = Farming.BUILDINGS.workbench.recipes.filter(r => r.bron).length;
        return { at1, at8, all, tan, wb }; })()`);
    t.check("kuźnia: na poziomie 1 tylko okuta tarcza (poziom 4), na 8 żelazny sztylet i miecz (poziom 9-12, bez stali), na 30 wszystkie 26; garbarnia 7, warsztat 6",
        JSON.stringify(forge.at1) === "[375]" && forge.at8.includes(301) && forge.at8.includes(305) && !forge.at8.includes(308) && forge.all === 26 && forge.tan === 7 && forge.wb === 6, forge);
    await t.go(3, 22, 14, 2);
    const made = await t.json(`(function(){ $gameParty.loseItem($dataItems[305], 9); $gameParty.gainItem($dataItems[86], 3); $gameParty.gainItem($dataItems[79], 2); $gameParty.gainItem($dataItems[97], 1);
        const r = Farming.BUILDINGS.forge.recipes.find(x => x.id === "bron_305"); return { ok: Farming.craftManual(null, r) }; })()`);
    await t.until("$gameParty.numItems($dataItems[305]) > 0", 8, 50);
    await t.frames(40);
    const after = await t.json("[305, 86, 79, 97].map(i => $gameParty.numItems($dataItems[i]))");
    t.check("wykuty żelazny miecz z 3 żelaza, 2 węgla, skóry", made.ok === true && after[0] === 1 && after[1] === 0 && after[2] === 0 && after[3] === 0, { made, after });

    // ---- F9
    const f9 = await t.json(`(function(){ const sec = Okolice.f9.sections().find(s => s.owner === "Bron"); if (!sec) return null; const rows = sec.rows;
        const g0 = $gameParty.gold(); const r3 = Okolice.f9.ok(rows[2]);
        const setRow = rows[1]; while (Bron.state().f9Poziom !== 12) Okolice.f9.pick(setRow, 1);
        for (const p of ['head', 'torso', 'hands', 'legs', 'feet']) Equipment.unequip(p);
        const r2 = Okolice.f9.ok(setRow), set = Bron.setFor(12);
        const worn = { torso: Equipment.current("torso"), head: Equipment.current("head"), hand: Combat.hand() };
        const r1 = Okolice.f9.ok(rows[0]); const all = Bron_Data.PRZEDMIOTY.filter(p => p.id >= 300).every(p => $gameParty.numItems($dataItems[p.id]) > 0);
        return { labels: rows.map(r => r.label), gold: $gameParty.gold() - g0, r1, r2, r3, worn, setTorso: set.tors.id, setWeapon: set.weapon.id, all }; })()`);
    t.check("F9: „daj wszystkie”, „zestaw na poziom 12” (założony), „+1000 G”", !!f9 && f9.labels.length === 3 && f9.gold === 1000 && f9.all && f9.worn.torso === f9.setTorso && f9.worn.hand === "m" + f9.setWeapon, f9);
    const errs = t.errors().filter(l => !/favicon|DevTools|Failed to load resource/.test(l));
    t.check("bez błędów w konsoli", errs.length === 0, errs.slice(0, 5));
});
