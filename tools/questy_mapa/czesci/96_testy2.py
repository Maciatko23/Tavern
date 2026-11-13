

def sec_tests2():
    PT("w1_chapters_test", [
        ("const toRoad = async () => { await t.go(22, 12, 2, 2, { calm: false }); return band(); };", "const toRoad = async () => { await t.go(3, 76, 8, 2, { calm: false }); return band(); };"),
        ("Napad na Polnej drodze", "Napad na Kruczym Jarze", 2),
    ])
    PT("pustelnia_test", [
        ("ways.south.every(s => s[1] && s[1][0] === 950)", "ways.south.every(s => s[1] && s[1][0] === 125)"),
        ("dół (21-23, 71) -> Zbocze pod Pustelnią 950 (od 2026-10-30, nie do przystani)", "dół (21-23, 71) -> przystań, brama Ścieżki na klif (2026-11-11 kieszeń)"),
    ])
    PT("kruk_test", [
        ("    await t.locate(15, 5, 8);\n    await t.until(\"Kruk.state().k51.leg >= 2\", 30);", "    await t.locate(101, 97, 8);\n    await t.until(\"Kruk.state().k51.leg >= 2\", 30);"),
        ("kruk czeka przy górnej krawędzi przystani, potem leci nad klif", "kruk czeka przy bramie Ścieżki na klif (przystań), potem leci nad klif"),
    ])
    PT("debug_menu_test", [
        ("rows.filter(r => r.sec === \"lowy\" && !r.head).length === 5 &&", "rows.filter(r => r.sec === \"lowy\" && !r.head).length === 9 &&"),
        ("world = n => !!SwiatData.maps[n] || n === 1;", "world = n => !!SwiatData.maps[n] || (SwiatData.extra || []).includes(n) || n === 1;"),
        ("const OUT = [12, 17, 18, 21, 22, 23, 27, 120, 155, 156, 157, 159, 165, 166, 167, 168, 169, 175, 176, 177, 990, 991]", "const OUT = [12, 17, 18, 21, 22, 23, 27, 159, 165, 166, 167, 176, 177, 990, 991]"),
        ("the rows that went: Łowy", "the rows that came back (2026-11-11 pockets): Łowy"),
        ("!(await everyRow()).some(r => /Wataha", "(await everyRow()).filter(r => /Wataha"),
        ("Orlą Grań/.test(r.label)));", "Orlą Grań/.test(r.label)).length >= 8);"),
    ])
    PT("mountain_places_test", [
        ("    t.check(\"...and switch 16 does not open it\", still === true, still);", "    t.check(\"...and switch 16 does not matter: since 2026-11-11 the gate (6,27) is the open way into the Osada pocket (a passage under the arch, not a normal-priority block)\", still === false, still);"),
    ])
