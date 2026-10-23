// The tools' wear without the game (Durability.js; with Bron.js wired: the weapons', the armour's and the shields' wear): the table
// (real items, a life, a unit, the word for breaking, the materials of the workbench's mending), a use wears one (only when owned),
// the warning at 15% left (once), the break on the last use (gone from the bag, "się złamała / złamał / złamały", the jacket "się
// podarła"), Dbały's slower wear (capped at 80%), the Polish forms of the units, the workbench's mending (Naprawiacz: half the
// materials) and the repair itself, the wear set outright (Ubior_Sklepy, Bron's used goods), the plugin's parameters (lifeFactor,
// enabled); Bron.js giving every new weapon, armour piece and shield its life, unit, mending and words.
// Mirrors tests/life_test.js (70 of 70, "zostało 11 uderzeń", "się złamała" / "złamał" / "złamały", every tool a real item) and
// tests/skills_test.js (Dbały 3: 36% less wear), tests/bron_dane_test.js (the new things' wear, the mail worn by a blow).
const unit = require("../lib/unit.js");

const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);

// a world: the database, a bag, the hero's skills (a fake Combat), the popups over the player (Survival.feedback)
function world(params, real) {
    const $dataItems = unit.data("Items");
    const o = { bag: {}, perks: {}, skills: {}, popups: [], sounds: [] };
    o.$gameParty = { numItems: it => o.bag[it.id] || 0, hasItem: it => (o.bag[it.id] || 0) > 0, gainItem(it, n) { o.bag[it.id] = Math.max(0, (o.bag[it.id] || 0) + n); },
        loseItem(it, n) { this.gainItem(it, -n); }, maxItems: () => 99, leader: () => null };
    o.$gameSystem = {};
    function Game_System() {}
    const globals = { $dataItems, $gameParty: o.$gameParty, Game_System, Survival: { feedback: (icon, text) => o.popups.push(text) },
        AudioManager: { playSe: se => o.sounds.push(se.name) }, DataManager: { isItem: it => !!it && $dataItems.includes(it) } };
    Object.defineProperty(globals, "$gameSystem", { get: () => o.$gameSystem, enumerable: true, configurable: true });
    if (!real) globals.Combat = { perk: k => o.perks[k] || 0, hasSkill: id => !!o.skills[id] };
    const files = real ? ["TawernaCore", "Durability", "Skills_Data", "Combat", "Combat_Fight", "Combat_UI", "Equipment", "Ubior_Data", "Bron_Data", "Bron"] : ["TawernaCore", "Durability"];
    o.w = unit.load(files, { globals, params: params ? { Durability: params } : undefined });
    o.D = o.w.Durability;
    o.give = (id, n) => o.$gameParty.gainItem($dataItems[id], n || 1);
    o.items = $dataItems;
    return o;
}

unit.test(t => {
    const o = world(), D = o.D;

    // ---- the table
    const G = { f: true, m: true, p: true, n: true };
    const bad = Object.entries(D.TOOLS).filter(([id, x]) => !(o.items[id] && o.items[id].name) || !(D.lifeOf(Number(id)) >= 1) || !["blow", "use", "cast", "cut", "shot", "jab", "block", "wear"].includes(x.unit) ||
        !G[x.g] || !(x.fix || []).every(([i, n]) => o.items[i] && o.items[i].name && n > 0)).map(([id]) => id);
    t.check("the table (" + Object.keys(D.TOOLS).length + " tools): every one a real item with a life, a unit, a gender for the word and real materials to mend it", bad.length === 0, bad);
    t.eq("lives as in the table at lifeFactor 100: stone axe 70, iron axe 220, stone pick 55, rod 45, the shield 40 blows taken; unknown 0; an unused axe 70 left",
        [D.lifeOf(60), D.lifeOf(115), D.lifeOf(63), D.lifeOf(100), D.lifeOf(155), D.lifeOf(9999), D.left(60)], [70, 220, 55, 45, 40, 0, 70]);

    // ---- using it
    const notOwned = D.use(60);
    o.give(60);
    const one = [D.use(60), D.used(60), D.left(60)];
    D.use(60, 3);
    t.check("a use wears one (not owned: nothing), use(id, 3) three", notOwned === false && D.used(60) === 4 && JSON.stringify(one) === "[false,1,69]", { notOwned, one, used: D.used(60) });
    o.$gameSystem._wear.used[60] = 58;
    o.popups.length = 0;
    D.use(60);
    D.use(60);
    t.eq("at 15% left a warning over the player, once: 'Kamienna siekiera: zostało 11 uderzeń' (tests/life_test.js)", o.popups, ["Kamienna siekiera: zostało 11 uderzeń"]);
    o.$gameSystem._wear.used[60] = 69;
    o.popups.length = 0;
    const broke = D.use(60);
    t.check("the last use breaks it: gone from the bag, 'Kamienna siekiera się złamała', a crash, the wear and the warning cleared",
        broke === true && o.bag[60] === 0 && o.popups.join() === "Kamienna siekiera się złamała" && o.sounds.includes("Crash") && D.used(60) === 0 && !o.$gameSystem._wear.warned[60], o.popups);
    o.popups.length = 0;
    for (const [id, last] of [[63, 54], [65, 89], [171, 59]]) { o.give(id); o.$gameSystem._wear.used[id] = last; D.use(id); }
    t.eq("the words by gender: 'Kamienny kilof się złamał', 'Grabie się złamały', the jacket its own: 'Skórzana kurtka się podarła'", o.popups,
        ["Kamienny kilof się złamał", "Grabie się złamały", "Skórzana kurtka się podarła"]);

    // ---- Dbały (Rzemiosło): a use wears less
    o.give(115);
    o.perks["tool.wear"] = 0.36;
    D.use(115);
    const dbaly = D.used(115);
    o.perks["tool.wear"] = 2;
    D.use(115);
    t.check("Dbały 3 (tool.wear 36%): a use wears 0.64 - the life left still shown whole (220); the perk counts 80% at most (a use 0.2)",
        near(dbaly, 0.64) && D.left(115) === 220 && near(D.used(115), 0.84), { dbaly, used: D.used(115) });
    o.perks = {};

    // ---- the words, the mending
    t.eq("the units' Polish forms: 1 uderzenie, 2-4 uderzenia, 5-21 uderzeń, 22 uderzenia, 112 uderzeń; rzut / rzuty / rzutów; cios / ciosy / ciosów",
        [1, 2, 4, 5, 12, 13, 21, 22, 112].map(n => n + " " + D.unitWord(60, n)).concat([1, 3, 7].map(n => D.unitWord(100, n)), [1, 2, 5].map(n => D.unitWord(155, n))),
        ["1 uderzenie", "2 uderzenia", "4 uderzenia", "5 uderzeń", "12 uderzeń", "13 uderzeń", "21 uderzeń", "22 uderzenia", "112 uderzeń", "rzut", "rzuty", "rzutów", "cios", "ciosy", "ciosów"]);
    o.give(60);
    o.give(63);
    o.bag[115] = 0;
    D.use(60);
    D.use(60);
    const rec = D.repairRecipes();
    const axe = rec.find(r => r.repair === 60);
    o.skills.c_repair = true;
    const halved = D.repairRecipes().find(r => r.repair === 60);
    t.check("the workbench's mending: one 'Napraw: ...' for each tool owned and worn (the axe, not the unused pick, not the iron axe gone); its materials, an hour; " +
        "Naprawiacz: half of each (at least 1)", rec.length === 1 && axe.name === "Napraw: Kamienna siekiera" && JSON.stringify(axe.inputs) === "[[77,1],[92,1]]" && axe.hours === 1 &&
        JSON.stringify(axe.output) === "[60,1]" && axe.manual && /teraz 68 z 70/.test(axe.desc) && JSON.stringify(halved.inputs) === "[[77,1],[92,1]]", rec.map(r => r.name));
    o.skills = {};
    o.give(116);
    o.$gameSystem._wear.used[116] = 170;
    o.$gameSystem._wear.warned[116] = true;
    const fixed = D.repair(116);
    t.check("repair: the wear back to nothing, the warning cleared, the journal's count of repairs +1; an unknown thing: no", fixed && D.used(116) === 0 && D.left(116) === 180 &&
        !o.$gameSystem._wear.warned[116] && o.$gameSystem._wear.repaired === 1 && D.repair(9999) === false);
    t.eq("the wear set outright (a used shirt, a used dagger): at most the life less one, 0 clears it, an unknown thing refused",
        [D.setUsed(60, 500), D.used(60), D.setUsed(60, 20), D.left(60), D.setUsed(60, 0), D.used(60), D.setUsed(9999, 5)], [true, 69, true, 50, true, 0, false]);

    // ---- the parameters
    const longer = world({ lifeFactor: "200" }), shorter = world({ lifeFactor: "50" }), off = world({ enabled: "false" });
    off.give(60);
    off.$gameSystem._wear = { used: { 60: 5 }, warned: {} };
    t.check("lifeFactor 200: twice as long (stone axe 140, rod 90); 50: half (35, 23 - rounded); enabled false: a use wears nothing, no mending offered",
        longer.D.lifeOf(60) === 140 && longer.D.lifeOf(100) === 90 && shorter.D.lifeOf(60) === 35 && shorter.D.lifeOf(100) === 23 && off.D.use(60) === false &&
        off.D.used(60) === 5 && off.D.repairRecipes().length === 0 && off.D.enabled() === false && D.enabled() === true);

    // ---- Bron.js: the new things' wear
    const b = world(null, true), BD = b.w.Bron_Data, DU = b.D;
    b.w.Bron.wire();   // (as at the boot; it ran when Bron.js loaded too - wiring again changes nothing)
    const added = Object.values(DU.TOOLS).filter(x => x.bron).length;
    const METAL = ["braz", "zelazo", "stal", "okute", "pierwszych", "zakon"];
    const wrong = BD.PRZEDMIOTY.filter(p => !p.istnieje && p.typ !== "dodatek").filter(p => {
        const x = DU.TOOLS[p.id], end = { f: "a", m: "", p: "y", n: "o" }[x && x.g];
        if (!x || x.life !== BD.trwalosc(p) || x.unit !== BD.jednostka(p) || JSON.stringify(x.fix) !== JSON.stringify(BD.MATERIALY[p.material].fix || [])) return true;
        if (p.typ === "bron") return x.broke !== undefined || x.g !== BD.RODZAJE[p.rodzaj].g;
        return x.broke !== (METAL.includes(p.material) ? "się rozpadł" : "się podarł") + end;
    }).map(p => p.id);
    t.check("Bron.js wired: every new weapon, armour piece and shield has its wear (" + added + " more): life, unit and mending of its material; " +
        "armour of metal 'się rozpadła', of leather or cloth 'się podarł', weapons the usual word; the trinkets none, the old tools as they were",
        wrong.length === 0 && added === 93 && Object.keys(DU.TOOLS).length === 18 + 93 && BD.PRZEDMIOTY.filter(p => p.typ === "dodatek").every(p => !DU.TOOLS[p.id]) && DU.lifeOf(60) === 70 &&
        DU.lifeOf(155) === 40, wrong);
    b.give(353);
    b.give(331);
    DU.setUsed(353, DU.lifeOf(353));
    DU.setUsed(331, DU.lifeOf(331));
    DU.use(353);
    DU.use(331);
    t.eq("the last blow taken by the mail: 'Kolczuga się rozpadła'; the iron spear's last jab: 'Żelazna włócznia się złamała'; their units 'cios' / 'pchnięcia'",
        b.popups.concat([DU.unitWord(353, 1), DU.unitWord(331, 3)]), ["Kolczuga się rozpadła", "Żelazna włócznia się złamała", "cios", "pchnięcia"]);
});
