// The map-note flags without the game (TawernaCore.js): every map's note (data/Map*.json) read the old way - the regexes the
// plugins had before stage 3 (six copies of mapNoteFlag, <Polish:off>, <FreeMove>, <Farm>/<Build>, <DarkDay:N>, <Zoom>, <Poziom>,
// <Hunt>, <Weather>/<Clouds>, <Ambience>) - and the new way (Tawerna.mapFlag / mapTag, as the plugins call them now): the same
// value on every map. Then the odd notes where the two readers part (none of them in the game's data).
const fs = require("fs");
const path = require("path");
const unit = require("../lib/unit.js");

unit.test(t => {
    const w = unit.load(["TawernaCore"]);
    const T = w.Tawerna;
    const W = 1280, H = 720, DURATION = 60, SPECIES = { rabbit: 1, deer: 1, boar: 1, wolf: 1 };
    const zoomParts = text => {
        const parts = text.split(",").map(s => s.trim()), scale = Number(parts[0]);
        if (!isFinite(scale) || scale <= 0) return null;
        const duration = parts[1] !== undefined && parts[1] !== "" ? Number(parts[1]) : DURATION;
        const hasX = parts[2] !== undefined && parts[2] !== "" && isFinite(Number(parts[2])), hasY = parts[3] !== undefined && parts[3] !== "" && isFinite(Number(parts[3]));
        return { scale, duration: isFinite(duration) ? duration : DURATION, x: hasX ? Number(parts[2]) : W / 2, y: hasY ? Number(parts[3]) : H / 2, followsPlayer: !hasX && !hasY };
    };
    const huntPairs = text => {
        const out = {};
        for (const pair of text.split(",")) { const [k, v] = pair.split("=").map(s => s.trim()); if (SPECIES[k] && Number(v) > 0) out[k] = Number(v); }
        return out;
    };
    // ---------------------------------------------------------------- the readers: [name, old(note), new()] (new reads $dataMap)
    const oldFlag = (note, tag, fallback) => {
        if (new RegExp("<" + tag + ":\\s*on\\s*>", "i").test(note)) return true;
        if (new RegExp("<" + tag + ":\\s*off\\s*>", "i").test(note)) return false;
        return fallback;
    };
    const oldOutdoor = note => /<(Clouds|Weather):\s*on\s*>/i.test(note);
    const newOutdoor = () => T.mapFlag("Clouds", false) || T.mapFlag("Weather", false);
    const READERS = [];
    for (const [plugin, tag, dflts] of [["CloudShadows", "Clouds", [true, false]], ["DayNightCycle", "DayNight", [true, false]], ["DustMotes", "Dust", [true, false]],
        ["RoomLighting", "Dark", [true, false]], ["Minimap", "Minimap", [null]]]) {
        for (const d of dflts) READERS.push([plugin + " <" + tag + "> (default " + d + ")", note => oldFlag(note, tag, d), () => T.mapFlag(tag, d)]);
    }
    READERS.push(
        ["RoomLighting <DarkDay:N>, <DarkNight:N>", note => ["DarkDay", "DarkNight"].map(tag => { const m = note.match(new RegExp("<" + tag + ":\\s*(\\d+)\\s*>", "i")); return m ? Number(m[1]) : null; }),
            () => ["DarkDay", "DarkNight"].map(tag => { const x = T.mapTag(tag); return x && /^\d+$/.test(x.raw) ? Number(x.raw) : null; })],
        ["Atmosphere <Ambience> / outdoors", note => { const m = note.match(/<Ambience:\s*(\w+)\s*>/i); return m ? m[1].toLowerCase() : oldOutdoor(note) ? "outdoor" : "-"; },
            () => { const m = T.mapTag("Ambience"); return m && /^\w+$/.test(m.raw) ? m.raw.toLowerCase() : newOutdoor() ? "outdoor" : "-"; }],
        ["Atmosphere <TimeMusic> (the map with / without its own BGM)", note => [true, false].map(a => oldFlag(note, "TimeMusic", oldOutdoor(note) && !a)),
            () => [true, false].map(a => T.mapFlag("TimeMusic", newOutdoor() && !a))],
        ["CharacterPolish, GroundDetail <Polish:off>", note => !/<Polish:\s*off\s*>/i.test(note), () => T.mapFlag("Polish", true, "off")],
        ["SurvivalHUD <Clock:off>, <Stamina:off>", note => [!/<Clock:\s*off\s*>/i.test(note), !/<Stamina:\s*off\s*>/i.test(note)], () => [T.mapFlag("Clock", true, "off"), T.mapFlag("Stamina", true, "off")]],
        ["FreeMovement <FreeMove> (off first; default on / off)", note => [true, false].map(d => /<FreeMove:\s*off\s*>/i.test(note) ? false : /<FreeMove:\s*on\s*>/i.test(note) ? true : d),
            () => [true, false].map(d => T.mapFlag("FreeMove", d, "off"))],
        ["Farming <Farm> (the first), else not <Dark:on>", note => { const x = /<Farm:\s*(on|off)\s*>/i.exec(note); return x ? x[1].toLowerCase() === "on" : !/<Dark:\s*on\s*>/i.test(note); },
            () => { const f = T.mapFlag("Farm", null, "first"); return f !== null ? f : !T.mapFlag("Dark", false); }],
        ["Farming <Build> (the first)", note => { const x = /<Build:\s*(on|off)\s*>/i.exec(note); return x ? x[1].toLowerCase() === "on" : "list"; },
            () => { const b = T.mapFlag("Build", null, "first"); return b !== null ? b : "list"; }],
        ["MapZoom <Zoom:scale,frames,x,y>", note => { const m = /<Zoom:\s*([^>]+)>/i.exec(note); return m ? zoomParts(m[1]) : null; }, () => { const m = T.mapTag("Zoom"); return m ? zoomParts(m.raw) : null; }],
        ["Combat <Poziom:N>", note => { const x = /<Poziom:\s*(\d+)\s*>/i.exec(note); return x ? Math.max(1, Number(x[1])) : "param"; },
            () => { const x = T.mapTag("Poziom"); return x && /^\d+$/.test(x.raw) ? Math.max(1, Number(x.raw)) : "param"; }],
        ["Hunting <Hunt:k=v,...> / <Hunt:off>", note => { const x = /<Hunt:\s*([^>]*)>/i.exec(note); return x ? (/^\s*off\s*$/i.test(x[1]) ? {} : huntPairs(x[1])) : "param"; },
            () => { const x = T.mapTag("Hunt"); return x ? (/^off$/i.test(x.raw) ? {} : huntPairs(x.raw)) : "param"; }],
        ["Survival, Needs: outdoors (<Weather:off> first, then <Weather:on> or <Clouds:on>)", note => /<Weather:\s*off\s*>/i.test(note) ? false : /<Weather:\s*on\s*>/i.test(note) || /<Clouds:\s*on\s*>/i.test(note),
            () => { const x = T.mapFlag("Weather", null, "off"); return x !== null ? x : T.mapFlag("Clouds", false); }],
        ["UITheme, MenuPanel, Atmosphere: outdoors (<Clouds:on> or <Weather:on>)", oldOutdoor, newOutdoor]
    );
    const read = (note, r) => { w.$dataMap = { note }; return [JSON.stringify(r[1](note)), JSON.stringify(r[2]())]; };

    // ---------------------------------------------------------------- every map of the game
    const dir = path.join(__dirname, "..", "..", "data");
    const notes = fs.readdirSync(dir).filter(f => /^Map\d+\.json$/.test(f)).sort().map(f => [f, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")).note || ""]);
    t.check("the maps' notes read (" + notes.length + ", " + notes.filter(n => /<\w+/.test(n[1])).length + " with tags)", notes.length >= 27 && notes.some(n => /<Clouds:on>/i.test(n[1])) && notes.some(n => /<Dark:on>/i.test(n[1])));
    for (const r of READERS) {
        const diff = notes.map(([f, note]) => [f].concat(read(note, r))).filter(x => x[1] !== x[2]);
        t.check(r[0] + ": the same on every map", diff.length === 0, diff.slice(0, 3));
    }
    // ---------------------------------------------------------------- when both are there: "on" wins, "off" wins, the first wins
    w.$dataMap = { note: "<Dust:off><Dust:on><FreeMove:on><FreeMove:off><Farm:off><Farm:on><Dust2:off>" };
    t.eq("both on and off: 'on' wins by default, wins 'off' / 'first' when asked; <Dust2> is another tag", [T.mapFlag("Dust", null), T.mapFlag("FreeMove", true, "off"), T.mapFlag("Farm", null, "first"), T.mapFlag("Dust2", null)], [true, false, false, false]);
    w.$dataMap = { note: "<Dust: ON ><Clock:on off><Hunt:off>" };
    t.eq("a plain on / off only (spaces and case do not matter), as the old regexes: <Clock:on off> is neither", [T.mapFlag("Dust", null), T.mapFlag("Clock", "none"), T.mapTag("Hunt").raw], [true, "none", "off"]);
    // ---------------------------------------------------------------- the odd notes where they part (none in the data - see above)
    const ODD = ["<Dust :on>", "<Hunt>", "<DarkDay:abc><DarkDay:80>"];
    const parts = ODD.map(note => READERS.filter(r => { const [a, b] = read(note, r); return a !== b; }).length);
    t.check("where the old and the new readers part, known and not in the data: a space before the colon (<Dust :on>), a bare <Hunt>, a bad first of two <DarkDay:N>",
        parts.every(n => n > 0), ODD.map((n, i) => n + ": " + parts[i]));
});
