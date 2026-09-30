# python build_town.py [A] [B] [C]  -> tools/town/staging/Map008_<X>.json (+ _meta.json for check_town.py / render_town.py)
# Three concepts of the town around the tavern (Map008 "Okolice Tawerny" grown to about three times its area), for the user
# to choose from. Nothing is installed: data/, js/ and System.json are never written.
#   A "Rynek pod tawerną"          - the market square right in front of the tavern, streets radiating from it
#   B "Główna ulica"               - one long street from the south gate (Polna droga) to the Lord's manor (east), the tavern
#                                    midway on it, the street widening into the square in front of the tavern
#   C "Tarasy na wzgórzu twierdzy" - the tavern on the top of the fortress hill inside the old walls, the town below on
#                                    terraces joined by stairs
# Common: the tavern's front and its door event (id 7, -> Map001 50,82) exactly as today, moved as one block; the six edge
# transfers kept (ids 1..6) on the new edges; a dry well (no water tiles anywhere - water is sold from barrels); every solid
# tile closed by an invisible blocker exactly under it (Town.close_solids); NPC spots only marked (meta), no NPC events.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from townlib import *

SIGNPOST = ["Drogowskaz. Na południe: Polna droga.", "Na wschód: Posiadłość Lorda."]


# ================================================================================================ A: the square below the tavern
def canal(mp, x0, x1, y, bridges=(), name="Suchy kanał młyński"):
    """the dry mill canal running west-east: its north wall (A5 stone blocks) on row y, the dry bed (dark mud, A2 36) on
    row y+1, the south bank's kerb (A2 43) on row y+2; bridges: (x, w) wooden decks (A2 33) across both rows"""
    deck = set()
    for bx, bw in bridges:
        deck |= mp.rect(bx, y, bx + bw - 1, y + 1)
    for x in range(x0, x1 + 1):
        if (x, y) in deck: continue
        mp.tile(0, x, y, A5(x % 4, 4)); mp.owner[(x, y)] = name
        mp.layers[1][(x, y + 1)] = ("k", 36); mp.owner[(x, y + 1)] = name
        mp.layers[0][(x, y + 1)] = ("k", 24)
    for c in deck:
        mp.layers[0][c] = ("k", 33); mp.layers[1].pop(c, None)
    mp.keep_free |= mp.rect(x0, y, x1, y + 1)
    mp.canal_deck = deck

def stall(mp, x, y, style, goods, name):
    """a market stall from the E sheet's awning over a C-sheet table with goods: the awning's poles on row y+1, the table
    (2 wide) on rows y..y+1 below the canvas; the seller stands behind (row y-1)"""
    mp.awning(x, y, style)
    mp.thing_c("table", x, y + 1)
    for i, g in enumerate(goods[:2]):
        mp.thing_c(g, x + i, y + 2) if g else None
    mp.label(name, x + 1, y - 2, "stragan")

def concept_a():
    W, H = 56, 47
    mp = Town("A", W, H, "Koncepcja A - Rynek pod tawerną", 5601)
    mp.idea = ("Rynek zaczyna się tuż pod drzwiami tawerny: ogródek piwny wychodzi na plac, na środku sucha studnia, wokół "
               "stragany targu. Pod rynkiem biegnie wyschnięty kanał młyński (stary młyn z nieruchomym kołem), przez niego "
               "drewniane mostki. Z rynku ulice: na wschód do dworu Lorda, na południe do Polnej drogi, na zachód do świątyni. "
               "Za tawerną mur twierdzy z dwiema basztami - tawerna stoi tam, gdzie stała wieża główna.")
    mp.exits([27, 28, 29], [14, 15, 16])
    # ---- the tavern (today's block moved 14 right, 4 down): door (28,13); the beer garden spills onto the square
    mp.tavern(14, 4, {"behind": None, "lamps": None}, signpost=SIGNPOST,
              place={43: (26, 29), 50: (33, 17), 51: (37, 17), 52: (35, 17), 53: (24, 16), 54: (24, 17)})
    # ---- the old fortress behind: the wall along the top, two towers flanking the tavern
    mp.parapet_wall(0, 15, 0, 2, shield_at=(7,))
    mp.parapet_wall(40, 55, 0, 2, shield_at=(48,))
    mp.round_tower(16, 0, "Baszta zachodnia")
    mp.round_tower(38, 0, "Baszta wschodnia")
    mp.label("Mury twierdzy", 7, 1, "twierdza"); mp.label("Mury twierdzy", 48, 1, "twierdza")
    for x in (3, 11, 44, 52):
        mp.tile(3, x, 1, B(1, 12)); mp.tile(3, x, 2, B(1, 13))
    # ---- upper row: the temple (W) and the town hall (E) beside the tavern
    t = mp.house("swiatynia", "Świątynia", 3, 3, 12, 4, 4, "grey_scale", "fort_light", windows="tall_gothic_lit",
                 gate=("!$Gate_Cathedral1", 0), interior=True, kind="świątynia", npc="kaplan", win_cols=[1, 3, 8, 10], boxes=False,
                 note="stare księgi o twierdzy; mury z kamienia twierdzy")
    mp.dress(t, gable=(3, "grey", "fort_light"), ivy=[(0, 0), (11, 1), (1, 1), (10, 0)], torches=[5, 7], chimneys=[(10, "light")])
    mp.picture(9, 8, "!Flags_banner", 0, 6, 1, name="Chorągiew zakonu (stara)", priority=1, through=True)
    mp.prop("bell_tower", 1, 10, label="Dzwonnica")
    for sx in (3, 14):
        mp.prop("statue_knight", sx, 12, label="Posąg strażnika zakonu", cmds=msg("Omszały posąg rycerza w płaszczu z krukiem.", "Napis na cokole starty prawie do cna."))
    mp.picture(6, 12, "!Decoration", 0, 2, 1, name="Kosz żarowy", priority=1, through=False, step=True, note="<Light:170,120,60,20>")
    mp.picture(11, 12, "!Decoration", 0, 2, 1, name="Kosz żarowy", priority=1, through=False, step=True, note="<Light:170,120,60,20>")
    r = mp.house("ratusz", "Ratusz", 42, 4, 11, 4, 3, "red", "fort_stone", upper="timber", upper_h=2, windows="arch_lit",
                 gate=("!$Gate_Wood1", 0), banner="horse", interior=True, kind="ratusz", npc="soltys", win_cols=[1, 3, 7, 9],
                 note="sołtys, sprawy miasteczka, zlecenia; parter z kamieni twierdzy")
    mp.dress(r, gable=(3, "orange", "timber"), dormers=[(1, "red"), (9, "red")], chimneys=[(0, "grey"), (10, "grey")], lamps=[4, 6],
             ivy=[(0, 0), (10, 0)], signs=[(7, "scroll")])
    mp.prop("board_town", 42, 18, label="Tablica sołtysa", cmds=msg("Tablica sołtysa. Zarządzenia, zlecenia, listy gończe.", "(Zlecenia miasteczka - w następnym etapie.)"))
    mp.thing_c("planter_tree", 53, 12)
    mp.decor_tree(54, 9, "leafy")
    # ---- the square: dry well, stalls with awnings, benches, lamps; a kerb of light stone round it
    square = mp.rect(17, 14, 40, 27)
    mp.square = square
    mp.prop("well_dry", 28, 22, label="Sucha studnia", cmds=msg("Studnia. Na dnie tylko spękany muł i kamienie.", "Wyschła, zanim ktokolwiek pamięta."))
    mp.thing_c("barrel_water", 31, 23); mp.thing_c("barrel_water", 32, 23); mp.thing_c("barrel_ladle", 33, 23)
    mp.label("woda z beczek", 32, 24, "stragan")
    mp.prop("stall_orange", 19, 25, label="Stragan z warzywami", cmds=msg("Stragan przekupki. Targ w każdy piątek."))
    mp.prop("stall_purple", 23, 25, label="Stragan ze starzyzną", cmds=msg("Starocie, gliniane garnki i 'kamienie z twierdzy'."))
    mp.prop("stall_plain", 35, 24, label="Stragan z suknem", cmds=msg("Sukno i płótno z kontynentu. Targ w każdy piątek."))
    mp.prop("stall_orange", 38, 24, label="Stragan ze zbożem", cmds=msg("Worki zboża - to, czego nie zabrało wojsko."))
    mp.thing_c("sacks", 21, 26); mp.thing_c("barrel_apples", 17, 25); mp.thing_c("pots", 25, 26); mp.thing_c("sacks_b", 40, 23)
    mp.thing_c("bench", 25, 19); mp.thing_c("bench_b", 30, 19)
    # the square's north part: a table with stools under the tavern's windows, a cart with barrels, a flower planter
    mp.thing_c("table", 32, 16); mp.thing_c("stool", 31, 16); mp.thing_c("stool_b", 34, 16)
    mp.yard("cart", 21, 15, "Wózek z beczkami");
    mp.thing_c("planter_tree", 17, 19); mp.thing_c("planter_tree", 40, 19)
    for x, y in [(17, 14), (40, 14), (17, 27), (40, 27), (26, 27), (30, 27), (24, 21), (33, 21)]:
        mp.lamp(x, y)
    mp.thing_c("crate", 39, 21); mp.thing_c("crate_b", 38, 21); mp.thing_c("cart_b", 18, 21)
    mp.label("RYNEK", 28, 17, "rynek"); mp.label("targ w piątki", 20, 20, "rynek")
    # ---- west middle row: the old mill (by the dry canal), herbalist, shoemaker - fronts on the canal walk (y 28)
    m = mp.house("mlyn", "Stary młyn", 0, 20, 7, 4, 4, "slate_b", "dark_planks", windows="shutter_shut", door=5, win_cols=[1],
                 note="koło stoi - kanał wysechł", label="Stary młyn")
    mp.dress(m, gable=(1, "grey", "dark_planks"), chimneys=[(0, "light")], ivy=[(0, 0), (6, 1)])
    mp.picture(3, 30, "!$Waterwheel", 0, 2, 0, name="Koło młyńskie (stoi)", block=[(2, 29), (3, 29), (4, 29), (2, 30), (3, 30), (4, 30)])
    h = mp.house("zielarnia", "Zielarnia", 7, 21, 4, 4, 3, "thatch", "logs", windows="lattice_lit", sign="potions", door=2, win_cols=[0],
                 interior=True, kind="rzemiosło", npc="zielarka", note="zioła, maści, leczy uchodźców")
    mp.dress(h, dormers=[(1, "wood")], chimneys=[(3, "tan")], ivy=[(0, 0)])
    s = mp.house("szewc", "Szewc i krawiec", 11, 21, 6, 4, 3, "green", "tf_green", windows="lattice_lit", sign="scissors", door=4,
                 win_cols=[1], interior=True, kind="rzemiosło", npc="szewc", note="buty, płaszcze, łaty")
    mp.dress(s, gable=(0, "grey", "tf_green"), lamps=[3], signs=[(2, "horseshoe")])
    # ---- east middle row: the smithy with its open forge, a home - fronts on the canal walk
    k = mp.house("kuznia", "Kuźnia", 41, 21, 7, 4, 3, "black", "dark_stone", windows="stone_small", sign="anvil", door=2, win_cols=[5],
                 door_style="iron", interior=True, kind="rzemiosło", npc="kowal", note="narzędzia, okucia, zlecenia garnizonu")
    mp.dress(k, gable=(0, "grey", "dark_stone"), chimneys=[(6, "grey")], lamps=[6], signs=[(1, "armor")], ivy=[(0, 0)])
    mp.thing_c("weapon_rack", 45, 19); mp.thing_c("firewood", 48, 20)
    # the smithy's yard and the carters' corner by the east street: a hay cart, a stack of hay, crates, a small vegetable plot
    mp.thing_c("cart", 51, 18);
    mp.thing_c("crate_sack", 42, 20); mp.thing_c("barrel", 43, 20); mp.thing_c("chopping_block", 47, 18)
    mp.picture(49, 27, "!$Smith", 0, 2, 1, name="Kuźnia - palenisko", block=[(48 + i, 24 + j) for j in range(4) for i in range(3)], step=True,
               note="<Light:180,120,70,24>")
    d = mp.house("dom_e1", "Dom", 51, 20, 5, 4, 4, "slate", "tf_blue", windows="lattice_lit", door=3, win_cols=[1])
    mp.dress(d, dormers=[(2, "grey")], chimneys=[(0, "light")], ivy=[(0, 1)])
    # ---- the dry mill canal under the square, three wooden bridges
    canal(mp, 0, 55, 29, bridges=[(27, 3), (8, 2), (45, 2)])
    mp.label("Suchy kanał młyński", 13, 30, "kanał"); mp.label("Suchy kanał", 51, 30, "kanał")
    # ---- south, first row (fronts on the lane y 38..40): homes, the bakery, the shop - touching, gables and dormers
    b3 = mp.house("dom_s2", "Dom z kamieni twierdzy", 3, 32, 8, 3, 3, "slate_b", "fort_stone", windows="arch_wood_lit", door=4, win_cols=[1, 6],
                  note="dolna część z bloków muru twierdzy")
    mp.dress(b3, dormers=[(2, "dark"), (6, "dark")], chimneys=[(0, "grey")], lamps=[3], ivy=[(0, 0), (7, 0)], clutter=[("barrel", 5, 1)])
    b2 = mp.house("dom_s1", "Dom", 11, 32, 7, 4, 3, "orange", "tf_brace", windows="lattice_lit", door=5, win_cols=[1])
    mp.dress(b2, gable=(0, "orange", "tf_brace"), chimneys=[(6, "light")], ivy=[(0, 0)])
    b = mp.house("piekarnia", "Piekarnia", 18, 32, 7, 4, 3, "orange_b", "tf_orange", windows="lit", door_style="white", door=5, win_cols=[1, 3],
                 interior=True, kind="rzemiosło", npc="piekarka", note="chleb drożeje - wojsko rekwiruje zboże")
    mp.dress(b, gable=(0, "orange", "tf_orange"), chimneys=[(6, "red")], lamps=[4], signs=[(6, "coin")],
             clutter=[("barrel_flour", 0, 1), ("sacks", 1, 1), ("barrel_apples", 3, 1)])
    kt = mp.house("kantor", "Kantor „Towary z kontynentu”", 31, 32, 8, 3, 3, "blue", "brick_timber", windows="arch_wood_lit", sign="scales",
                  door_style="red", door=4, win_cols=[1, 6], interior=True, kind="handel", npc="kupiec", note="towar z promu, ceny rosną z każdą bitwą")
    mp.dress(kt, dormers=[(2, "blue"), (6, "blue")], chimneys=[(7, "light")], lamps=[3],
             clutter=[("barrel_crate", 2, 1), ("crate_jug", 7, 1)])
    e2 = mp.house("dom_s3", "Dom", 39, 32, 6, 3, 3, "red_tile", "tan_block", windows="shutter_lit", door=4, win_cols=[1])
    mp.dress(e2, chimneys=[(1, "tan")], dormers=[(4, "orange")], ivy=[(0, 0)], clutter=[("crate", 2, 1)])
    e3 = mp.house("dom_s4", "Dom", 45, 32, 6, 4, 3, "brown_scale", "tf_brace", windows="lattice_lit", door=1, win_cols=[3])
    mp.dress(e3, gable=(0, "brown", "tf_brown"), clutter=[("crate_b", 5, 1)])
    e4 = mp.house("dom_s5", "Dom", 51, 32, 5, 3, 3, "teal", "plaster", windows="lit", door=3, win_cols=[1])
    mp.dress(e4, dormers=[(2, "grey")], chimneys=[(1, "light")], ivy=[(4, 0)], clutter=[("planter", 0, 1)])
    # ---- south, second row (fronts on the bottom lane y 46): the garrison post with its drill yard, homes
    g = mp.house("posterunek", "Posterunek garnizonu", 31, 41, 7, 3, 2, "black", "grey_stone", windows="barred", banner="wolf", door=3,
                 door_style="iron", interior=True, kind="garnizon", npc="kapral", win_cols=[1, 5], boxes=False, note="kapral, rekwizycje, pobór")
    mp.dress(g, chimneys=[(5, "grey")], torches=[2, 4], signs=[(0, "sword")], ivy=[(6, 0)])
    mp.thing_c("weapon_rack", 39, 45); mp.thing_c("weapon_rack_b", 41, 45); mp.thing_c("dummy", 43, 45); mp.thing_c("target", 44, 45)
    mp.prop("tent_hide", 41, 42, label="Namiot żołnierzy")
    mp.picture(38, 42, "!Flags_banner", 0, 6, 1, name="Chorągiew garnizonu", priority=1, through=True)
    s1 = mp.house("dom_s6", "Dom", 47, 41, 6, 3, 2, "slate", "logs", windows="shutter_lit", door=4, win_cols=[1], boxes=False)
    mp.dress(s1, chimneys=[(1, "light")])
    s2 = mp.house("dom_s7", "Dom", 18, 41, 6, 3, 2, "straw", "grey_logs", windows="shutter_dark", door=1, win_cols=[3], boxes=False)
    mp.dress(s2, chimneys=[(4, "tan")])
    # the refugees' corner (SW) under a broken stretch of the old wall
    mp.parapet_wall(0, 6, 41, 1)
    mp.label("Mur twierdzy (resztki)", 3, 42, "twierdza")
    mp.prop("tent_hide", 2, 45, label="Namiot uchodźców"); mp.prop("tent_hide", 8, 46, label="Namiot uchodźców")
    mp.prop("tent_small", 12, 43, label="Szałas"); mp.prop("bedroll", 5, 44, label="Posłanie"); mp.prop("bedroll", 12, 46, label="Posłanie")
    mp.campfire(9, 43, pot=True); mp.campfire(15, 45)
    mp.prop("laundry", 15, 42, label="Sznur z praniem")
    mp.yard("sacks", 1, 46, "Tobołki"); mp.thing_c("crate_lid", 10, 46); mp.yard("cart", 0, 43, "Wózek uchodźców")
    mp.label("Obóz uchodźców", 7, 45, "uchodźcy")
    # ---- NPC spots
    for kk, x, y, dd in [("kaplan", 9, 12, 2), ("soltys", 46, 14, 2), ("pisarz", 44, 18, 4), ("kowal", 50, 28, 2), ("kupiec", 36, 38, 2),
                         ("piekarka", 23, 39, 2), ("zielarka", 11, 28, 2), ("szewc", 17, 28, 2), ("wodziarz", 32, 22, 2),
                         ("przekupka", 19, 22, 2), ("starzyzna", 22, 22, 2), ("kapral", 36, 46, 8), ("straznik", 26, 43, 6),
                         ("uchodzczyni", 10, 44, 4), ("dezerter", 14, 45, 4)]:
        mp.npc(kk, x, y, dd)
    # ---- ways: the square, the streets (E to the manor, S to Polna droga), the canal walks, lanes between the rows
    east = mp.rect(41, 14, 55, 16)
    south = mp.rect(27, 32, 29, 46)
    west = mp.rect(0, 13, 16, 15)
    walks = mp.rect(0, 28, 55, 28) | mp.rect(0, 31, 55, 31)
    lanes = mp.rect(0, 38, 26, 40) | mp.rect(30, 38, 55, 40) | mp.rect(24, 41, 26, 46) | mp.rect(30, 46, 55, 46) | mp.rect(16, 46, 26, 46)
    streets = east | south | west
    mp.streets = streets | walks | lanes
    paved = walks | mp.rect(3, 11, 14, 12) | mp.rect(41, 13, 54, 13)
    gardens = mp.rect(1, 18, 5, 18) | mp.rect(8, 18, 15, 18)
    for x, y, c in [(1, 18, "crop_a"), (2, 18, "crop_b"), (3, 18, "crop_c"), (4, 18, "crop_d"), (8, 18, "crop_c"), (9, 18, "crop_a"),
                    (10, 18, "crop_b"), (12, 18, "crop_d"), (13, 18, "crop_a"), (14, 18, "crop_c")]:
        mp.prop(c, x, y, label="Grządka")
    # ---- green edges: the game's own trees, bushes and rocks (choppable as on Map003); inside the town decorative trees
    for x, y, p in [(0, 7, "B"), (1, 16, "C"), (55, 20, "C"), (55, 9, "C"), (54, 44, "A"), (53, 46, "C"),
                    (16, 40, "!$Bush_Bare_A"), (0, 37, "!$Rock_Mossy")]:
        mp.tree(x, y, p)
    mp.decor_tree(18, 12, "leafy"); mp.decor_tree(38, 12, "small")
    mp.decor_tree(21, 3, "leafy"); mp.decor_tree(35, 3, "leafy"); mp.decor_tree(1, 17, "small")
    mp.fence(mp.rect(0, 16, 15, 16) - mp.rect(5, 16, 7, 16), 22, "Płotek ogródków")
    paint_ground(mp, streets=streets, lanes=lanes, square=square, paved=paved, gardens=gardens, tall_n=8, paved_kind=43, street_kind=40)
    mp.zones = [("Rynek", square, (240, 200, 90))]
    mp.shots = [(28, 16, 8, "przed tawerną"), (28, 25, 2, "rynek i sucha studnia"), (46, 29, 4, "kuźnia i suchy kanał"), (28, 40, 2, "ulica na południe")]
    return mp


# ================================================================================================ B: the main street
def concept_b():
    W, H = 64, 43
    mp = Town("B", W, H, "Koncepcja B - Główna ulica", 6402)
    mp.idea = ("Jedna długa ulica od południowej bramy (dawna brama twierdzy: dwie baszty i posągi strażników, droga na Polną "
               "drogę) do dworu Lorda na wschodzie. W połowie, po północnej stronie, cofnięta tawerna - ulica rozszerza się "
               "przed nią w plac z suchą studnią i targiem. Wzdłuż ulicy zwarte pierzeje domów, za nimi zaułki; uchodźcy "
               "koczują w cieniu muru tuż za bramą.")
    mp.exits([13, 14, 15], [25, 26, 27])
    # ---- the tavern set back from the street (moved 20 right, 9 down): door (34,18); its beer garden and back yard beside it
    mp.tavern(20, 9, {"behind": None, "lamps": None, "terrace": (-2, -1), "backyard": (0, -1)}, signpost=SIGNPOST,
              place={43: (11, 28), 50: (44, 20), 51: (46, 23), 52: (47, 20), 53: (28, 21), 54: (29, 21)})
    # ---- the old fortress: the wall along the top, taken apart behind the tavern (its stones are in the houses)
    mp.parapet_wall(0, 21, 0, 2, shield_at=(10,))
    mp.parapet_wall(46, 63, 0, 2, shield_at=(55,))
    mp.round_tower(22, 0, "Baszta zachodnia"); mp.round_tower(44, 0, "Baszta wschodnia")
    for x in (4, 15, 50, 60):
        mp.tile(3, x, 1, B(1, 12)); mp.tile(3, x, 2, B(1, 13))
    mp.label("Mur rozebrany na kamień", 33, 2, "twierdza")
    mp.decor_obj(26, 2, "!$Rock_Rubble", "Gruz z muru"); mp.decor_obj(40, 3, "!$Rock_Pile", "Gruz z muru")
    mp.decor_tree(28, 7, "leafy"); mp.decor_tree(39, 7, "leafy"); mp.decor_tree(33, 4, "pine_b")
    # ---- the square: the street widens in front of the tavern
    square = mp.rect(20, 19, 47, 27)
    mp.square = square
    mp.prop("well_dry", 35, 23, label="Sucha studnia", cmds=msg("Studnia. Na dnie tylko spękany muł i kamienie.", "Wyschła, zanim ktokolwiek pamięta."))
    mp.thing_c("barrel_water", 37, 23); mp.thing_c("barrel_water", 38, 23); mp.thing_c("barrel_ladle", 39, 23)
    mp.label("woda z beczek", 38, 21, "stragan")
    mp.prop("stall_orange", 31, 23, label="Stragan z warzywami", cmds=msg("Stragan przekupki. Targ w każdy piątek."))
    mp.prop("stall_purple", 42, 23, label="Stragan ze starzyzną", cmds=msg("Starocie, gliniane garnki i 'kamienie z twierdzy'."))
    mp.thing_c("sacks", 29, 23)
    for x, y in [(24, 19), (44, 19), (20, 25), (47, 25)]:
        mp.lamp(x, y)
    mp.label("PLAC", 35, 20, "rynek"); mp.label("targ w piątki", 31, 19, "rynek")
    # ---- the north frontage (fronts on the street): temple, a house, [beer garden, tavern, back yard], town hall
    t = mp.house("swiatynia", "Świątynia", 0, 17, 12, 4, 4, "grey_scale", "fort_light", windows="tall_gothic_lit",
                 gate=("!$Gate_Cathedral1", 0), interior=True, kind="świątynia", npc="kaplan", win_cols=[2, 4, 8, 10], boxes=False,
                 door=6, note="stare księgi o twierdzy")
    mp.dress(t, gable=(3, "grey", "fort_light"), torches=[5, 7], ivy=[(0, 0), (11, 1), (1, 1)], chimneys=[(11, "light")])
    n1 = mp.house("dom_n1", "Dom", 14, 17, 6, 4, 4, "orange", "tf_orange", windows="lattice_lit", door=4, win_cols=[1])
    mp.dress(n1, gable=(0, "orange", "tf_orange"), lamps=[3], ivy=[(5, 0)])
    r = mp.house("ratusz", "Ratusz", 50, 16, 11, 4, 3, "red", "fort_stone", upper="timber", upper_h=2, windows="arch_lit",
                 gate=("!$Gate_Wood1", 0), banner="horse", interior=True, kind="ratusz", npc="soltys", win_cols=[1, 3, 7, 9],
                 note="sołtys, sprawy miasteczka, zlecenia")
    mp.dress(r, gable=(3, "orange", "timber"), dormers=[(1, "red"), (9, "red")], chimneys=[(0, "grey"), (10, "grey")], lamps=[4, 6],
             signs=[(7, "scroll")], ivy=[(0, 0)])
    mp.prop("board_town", 61, 24, label="Tablica sołtysa", cmds=msg("Tablica sołtysa. Zarządzenia, zlecenia, listy gończe.", "(Zlecenia miasteczka - w następnym etapie.)"))
    mp.decor_tree(62, 21, "small")
    # ---- behind the north frontage: the back lane (y 11..12) and a row of homes under the old wall
    b1 = mp.house("dom_b1", "Dom", 0, 5, 6, 3, 3, "thatch", "logs", windows="shutter_lit", door=4, win_cols=[1])
    mp.dress(b1, dormers=[(2, "wood")], chimneys=[(5, "tan")])
    b2 = mp.house("dom_b2", "Dom z kamieni twierdzy", 7, 4, 6, 4, 3, "slate_b", "fort_stone", windows="arch_wood_lit", door=4, win_cols=[1],
                  note="dolna część z bloków muru twierdzy")
    mp.dress(b2, gable=(0, "grey", "fort_stone"), ivy=[(0, 0), (5, 1)])
    b3 = mp.house("dom_b3", "Dom", 14, 5, 6, 3, 3, "brown_scale", "boards", windows="lit", door=1, win_cols=[3])
    mp.dress(b3, dormers=[(3, "wood_dark")], chimneys=[(0, "grey")])
    b4 = mp.house("dom_b4", "Dom", 50, 4, 6, 4, 3, "teal", "plaster", windows="lit", door=4, win_cols=[1])
    mp.dress(b4, gable=(0, "grey", "plaster"), ivy=[(5, 0)])
    b5 = mp.house("dom_b5", "Dom", 57, 5, 6, 3, 3, "red_tile", "tf_brace", windows="lattice_lit", door=1, win_cols=[3])
    mp.dress(b5, dormers=[(3, "orange")], chimneys=[(5, "light")])
    for x, y in [(6, 10), (13, 10), (20, 10), (56, 10), (63, 10)]:
        mp.thing_c(["barrel", "crate", "sacks", "barrel_water", "crate_b"][x % 5], x, y)
    # ---- the south side of the street: backs on the street, fronts on the south lane (y 34..36)
    g = mp.house("posterunek", "Posterunek garnizonu", 16, 28, 6, 3, 3, "black", "grey_stone", windows="barred", banner="wolf", door=3,
                 win_cols=[1, 5], door_style="iron", interior=True, kind="garnizon", npc="kapral", boxes=False,
                 note="przy bramie: kontrola przybyszów, rekwizycje")
    mp.dress(g, torches=[2, 4], signs=[(0, "sword")], chimneys=[(5, "grey")])
    b = mp.house("piekarnia", "Piekarnia", 22, 28, 7, 4, 3, "orange_b", "tf_orange", windows="lit", door_style="white", door=5, win_cols=[1, 3],
                 interior=True, kind="rzemiosło", npc="piekarka", note="chleb drożeje - wojsko rekwiruje zboże")
    mp.dress(b, gable=(0, "orange", "tf_orange"), chimneys=[(6, "red")], lamps=[4], signs=[(6, "coin")],
             clutter=[("barrel_flour", 0, 1), ("sacks", 1, 1)])
    h = mp.house("zielarnia", "Zielarnia", 29, 28, 5, 3, 3, "thatch", "grey_logs", windows="square_lit", sign="potions", door=2, win_cols=[0, 4],
                 interior=True, kind="rzemiosło", npc="zielarka", note="zioła, maści, leczy uchodźców")
    mp.dress(h, dormers=[(2, "wood")], chimneys=[(0, "tan")], ivy=[(4, 0)], clutter=[("hide_rack", 0, 1)])
    s = mp.house("szewc", "Szewc i krawiec", 34, 28, 6, 4, 3, "green", "tf_green", windows="lattice_lit", sign="scissors", door=4,
                 win_cols=[1], interior=True, kind="rzemiosło", npc="szewc", note="buty, płaszcze, łaty")
    mp.dress(s, gable=(0, "grey", "tf_green"), lamps=[3])
    kt = mp.house("kantor", "Kantor „Towary z kontynentu”", 40, 28, 8, 3, 3, "blue", "brick_timber", windows="arch_wood_lit", sign="scales",
                  door_style="red", door=4, win_cols=[1, 6], interior=True, kind="handel", npc="kupiec", note="pierwszy sklep dla ludzi z promu")
    mp.dress(kt, dormers=[(2, "blue"), (6, "blue")], chimneys=[(7, "light")], lamps=[3], clutter=[("barrel_crate", 1, 1), ("crate_jug", 7, 1)])
    k = mp.house("kuznia", "Kuźnia", 48, 28, 6, 4, 3, "black", "dark_stone", windows="stone_small", sign="anvil", door=2, win_cols=[5],
                 door_style="iron", interior=True, kind="rzemiosło", npc="kowal", note="pierwszy warsztat od strony dworu")
    mp.dress(k, gable=(0, "grey", "dark_stone"), lamps=[4], signs=[(1, "armor")], ivy=[(0, 0)])
    mp.picture(55, 34, "!$Smith", 0, 2, 1, name="Kuźnia - palenisko", block=[(54 + i, 31 + j) for j in range(4) for i in range(3)], step=True,
               note="<Light:180,120,70,24>")
    mp.thing_c("firewood", 54, 30)
    d1 = mp.house("dom_s1", "Dom", 57, 28, 7, 4, 3, "orange", "tf_brace", windows="lattice_lit", door=5, win_cols=[1])
    mp.dress(d1, gable=(0, "orange", "tf_brace"), chimneys=[(6, "light")], ivy=[(6, 0)])
    # ---- the second row (fronts on the bottom lane y 42) and the garrison's drill yard
    s2 = mp.house("dom_s2", "Dom", 23, 37, 6, 3, 2, "straw", "grey_logs", windows="shutter_dark", door=1, win_cols=[3], boxes=False)
    mp.dress(s2, chimneys=[(4, "tan")])
    s3 = mp.house("dom_s3", "Dom", 30, 37, 6, 3, 2, "slate", "logs", windows="shutter_lit", door=4, win_cols=[1], boxes=False)
    mp.dress(s3, chimneys=[(1, "light")], ivy=[(0, 0)])
    mp.thing_c("weapon_rack", 37, 41); mp.thing_c("weapon_rack_b", 39, 41); mp.thing_c("dummy", 41, 41); mp.thing_c("target", 42, 41)
    mp.prop("tent_hide", 44, 38, label="Namiot żołnierzy")
    mp.picture(38, 38, "!Flags_banner", 0, 6, 1, name="Chorągiew garnizonu", priority=1, through=True)
    mp.label("plac ćwiczeń", 40, 39, "garnizon")
    s4 = mp.house("dom_s4", "Dom", 47, 37, 7, 3, 2, "purple", "boards", windows="lit", door=5, win_cols=[1], boxes=False)
    mp.dress(s4, chimneys=[(1, "grey")])
    s5 = mp.house("dom_s5", "Dom", 55, 37, 8, 3, 2, "brown_scale", "tf_brace", windows="lattice_lit", door=4, win_cols=[1, 6], boxes=False)
    mp.dress(s5, dormers=[(2, "wood"), (6, "wood")], chimneys=[(0, "grey")])
    # ---- the south gate: the old fortress gate - two towers, the order's guardian statues; the wall running west and east
    mp.round_tower(11, 36, "Baszta bramna"); mp.round_tower(16, 36, "Baszta bramna")
    mp.parapet_wall(0, 10, 37, 2, shield_at=(5,)); mp.parapet_wall(18, 21, 37, 2)
    for sx in (12, 16):
        mp.prop("statue_knight", sx, 35, label="Posąg strażnika zakonu", cmds=msg("Omszały posąg rycerza w płaszczu z krukiem.", "Pod nim wyryte: STRZEŻ, NIE PYTAJ."))
    mp.label("Brama (dawna brama twierdzy)", 14, 39, "twierdza")
    # the refugees in the lee of the wall, inside the gate
    mp.prop("tent_hide", 2, 31, label="Namiot uchodźców"); mp.prop("tent_hide", 8, 30, label="Namiot uchodźców")
    mp.prop("tent_small", 4, 35, label="Szałas"); mp.prop("bedroll", 1, 34, label="Posłanie"); mp.prop("bedroll", 9, 33, label="Posłanie")
    mp.campfire(5, 32, pot=True); mp.campfire(9, 35)
    mp.prop("laundry", 6, 28, label="Sznur z praniem")
    mp.yard("cart", 0, 36, "Wózek uchodźców"); mp.yard("sacks", 10, 29, "Tobołki"); mp.thing_c("crate_lid", 10, 32)
    mp.label("Obóz uchodźców", 5, 29, "uchodźcy")
    # ---- NPC spots
    for kk, x, y, dd in [("kaplan", 4, 25, 2), ("soltys", 58, 25, 2), ("pisarz", 60, 25, 8), ("kowal", 55, 35, 8), ("kupiec", 46, 34, 2),
                         ("piekarka", 25, 35, 2), ("zielarka", 32, 34, 2), ("szewc", 39, 35, 2), ("wodziarz", 38, 24, 2),
                         ("przekupka", 31, 22, 2), ("starzyzna", 42, 22, 2), ("kapral", 21, 34, 2), ("straznik", 12, 34, 6),
                         ("uchodzczyni", 5, 31, 2), ("dezerter", 8, 33, 4)]:
        mp.npc(kk, x, y, dd)
    # ---- ways
    main = mp.rect(0, 25, 63, 27) | mp.rect(13, 28, 15, 42)
    lanes = mp.rect(0, 11, 25, 12) | mp.rect(48, 11, 63, 12) | mp.rect(12, 13, 13, 24) | mp.rect(20, 13, 21, 18) | mp.rect(48, 13, 49, 24)
    lanes |= mp.rect(16, 34, 63, 36) | mp.rect(18, 42, 63, 42) | mp.rect(22, 37, 22, 41) | mp.rect(29, 37, 29, 41) | mp.rect(36, 37, 46, 41)
    lanes |= mp.rect(54, 37, 54, 41)
    streets = main
    mp.streets = streets | lanes
    for x, y, p in [(63, 4, "B"), (63, 41, "C"), (0, 14, "C"), (10, 42, "!$Bush_Bare_A")]:
        mp.tree(x, y, p)
    mp.decor_tree(24, 16, "small")
    paint_ground(mp, streets=streets, lanes=lanes, square=square, tall_n=10, street_kind=40, square_kind=42)
    mp.zones = [("Plac", square, (240, 200, 90))]
    mp.shots = [(34, 21, 8, "przed tawerną"), (14, 31, 2, "brama południowa"), (52, 26, 6, "ulica i ratusz"), (40, 35, 2, "zaułek południowy")]
    return mp


# ================================================================================================ C: terraces on the fortress hill
def fortress_stairs(mp, x0, x1, y0, y1):
    """broad stone stairs (A5 row 7: its left edge, middle and right edge pieces) through a wall or a cliff, walkable"""
    for x in range(x0, x1 + 1):
        col = 0 if x == x0 else 3 if x == x1 else 1 + (x - x0) % 2
        for y in range(y0, y1 + 1):
            mp.tile(0, x, y, A5(col, 7)); mp.layers[1].pop((x, y), None); mp.tile(2, x, y, 0)
            mp.owner.pop((x, y), None)
    mp.keep_free |= mp.rect(x0, y0, x1, y1)

def rock_cliff(mp, x0, x1, y, stairs=(), steps=(), name="Skała wzgórza"):
    """the hill's natural rock edge (A5 rows 11..15: the grass rim with stones, two rows of rock face, rounded ends) from
    x0 to x1 with its rim on row y. It is cut into segments at the stairs (walkable stone steps down through it) and at
    `steps`: every other segment sits one row lower, so the edge bulges in and out like the pack's cliffs (not one
    straight line). Rim cells stay walkable (the terrace's edge), the faces are closed (blockers / the tileset's flags)."""
    cuts, cur = [], None
    for x in range(x0, x1 + 1):
        if x in stairs:
            if cur: cuts.append(cur); cur = None
            continue
        if cur and x in steps:
            cuts.append(cur); cur = None
        if cur is None: cur = [x, x]
        else: cur[1] = x
    if cur: cuts.append(cur)
    for i, (a, b) in enumerate(cuts):
        dy = i % 2
        for x in range(a, b + 1):
            col = 0 if x == a else 2 if x == b else 1
            for j, row in enumerate((13, 14, 15)):
                mp.tile(0, x, y + dy + j, A5(col, row)); mp.layers[1].pop((x, y + dy + j), None)
                if row != 13: mp.owner[(x, y + dy + j)] = name
            if dy:
                mp.keep_free.add((x, y))
        mp.keep_free |= mp.rect(a, y + dy, b, y + dy + 2)
    if stairs:
        s0, s1 = min(stairs), max(stairs)
        fortress_stairs(mp, s0, s1, y, y + 3)

def concept_c():
    W, H = 52, 56
    mp = Town("C", W, H, "Koncepcja C - Tarasy na wzgórzu twierdzy", 5203)
    mp.idea = ("Tawerna stoi na szczycie wzgórza, na dziedzińcu dawnej twierdzy, otoczona jej murami i basztami. Szerokie "
               "schody między dwiema basztami bramnymi (posągi strażników, kosze żarowe, chorągwie z krukiem) prowadzą w dół "
               "na środkowy taras z rynkiem, suchą studnią i ratuszem - tu też droga do dworu Lorda. Niżej, za naturalną "
               "skalną krawędzią wzgórza, dolny taras: rzemieślnicy, kuźnia, posterunek, obóz uchodźców i droga na Polną drogę.")
    mp.exits([24, 25, 26], [31, 32, 33])
    # ---- the upper terrace: the fortress courtyard with the tavern (moved 11 right, 4 down: door 25,13)
    mp.tavern(11, 4, {"behind": None, "lamps": None, "backyard": (-22, 0), "terrace": (22, -3)}, signpost=SIGNPOST,
              place={43: (22, 24), 50: (40, 15), 51: (44, 16), 52: (42, 16), 53: (35, 14), 54: (36, 14)})
    mp.parapet_wall(2, 49, 0, 2, shield_at=(12, 38))
    mp.round_tower(0, 0, "Baszta północno-zachodnia"); mp.round_tower(50, 0, "Baszta północno-wschodnia")
    for x in (6, 16, 31, 42, 47):
        mp.tile(3, x, 1, B(1, 12)); mp.tile(3, x, 2, B(1, 13))
    mp.label("Mury twierdzy (za nimi Urwisko Kruków)", 25, 1, "twierdza")
    t = mp.house("swiatynia", "Świątynia (dawna kaplica zakonu)", 2, 4, 10, 4, 4, "grey_scale", "fort_light", windows="tall_gothic_lit",
                 gate=("!$Gate_Cathedral1", 0), interior=True, kind="świątynia", npc="kaplan", win_cols=[1, 3, 7, 9], boxes=False, door=5,
                 note="kaplica zakonu przerobiona na świątynię; stare księgi", label="Świątynia")
    mp.dress(t, gable=(2, "grey", "fort_light"), torches=[4, 6], ivy=[(0, 0), (9, 1), (8, 0)])
    for sx in (3, 10):
        mp.prop("statue_knight", sx, 13, label="Posąg strażnika zakonu", cmds=msg("Omszały posąg rycerza w płaszczu z krukiem.", "Napis na cokole starty prawie do cna."))
    tw = mp.house("dom_twierdza", "Dom w murach twierdzy", 44, 4, 6, 4, 3, "slate_b", "fort_stone", windows="arch_wood_lit", door=4, win_cols=[1],
                  note="dawna kordegarda, dziś mieszkanie")
    mp.dress(tw, gable=(0, "grey", "fort_stone"), ivy=[(0, 0), (5, 1)])
    for i, gx in enumerate((44, 46, 48)):
        mp.prop(["grave_cross_fl", "grave_cross", "grave_stone"][i], gx, 14, label="Grób strażnika")
    mp.label("groby strażników", 46, 15, "twierdza")
    mp.decor_tree(49, 12, "pine_b"); mp.decor_tree(34, 3, "leafy"); mp.decor_tree(14, 3, "small"); mp.decor_tree(40, 7, "leafy")
    mp.decor_obj(37, 10, "!$Rock_Rubble", "Gruz z muru"); mp.decor_obj(42, 4, "!$Rock_Pile", "Gruz z muru")
    mp.label("Dziedziniec twierdzy", 25, 16, "twierdza")
    # ---- the upper terrace's edge: the fortress wall, the grand stairs between the two gate towers (the gatehouse)
    mp.parapet_wall(0, 20, 19, 2, shield_at=(10,))
    mp.parapet_wall(30, 51, 19, 2, shield_at=(41,))
    mp.round_tower(21, 16, "Baszta bramna"); mp.round_tower(28, 16, "Baszta bramna")
    fortress_stairs(mp, 23, 27, 19, 21)
    for bx in (21, 29):
        mp.picture(bx, 19, "!Flags_banner", 0, 2, 1, name="Chorągiew z krukiem (stara)", priority=1, through=True)
    for sx in (21, 29):
        mp.prop("statue_knight", sx, 24, label="Posąg strażnika zakonu", cmds=msg("Rycerz z krukiem na tarczy. Pod nim:", "STRZEŻ, NIE PYTAJ."))
    for bx in (20, 30):
        mp.picture(bx, 23, "!Decoration", 0, 2, 1, name="Kosz żarowy", priority=1, through=False, step=True, note="<Light:170,120,60,20>")
    # ---- the middle terrace: the square, the town hall, the road to the manor
    square = mp.rect(13, 22, 37, 35)
    mp.square = square
    mp.prop("well_dry", 25, 30, label="Sucha studnia", cmds=msg("Studnia. Na dnie tylko spękany muł i kamienie.", "Wyschła, zanim ktokolwiek pamięta."))
    mp.thing_c("barrel_water", 28, 30); mp.thing_c("barrel_water", 29, 30); mp.thing_c("barrel_ladle", 30, 30)
    mp.prop("stall_orange", 16, 27, label="Stragan z warzywami", cmds=msg("Stragan przekupki. Targ w każdy piątek."))
    mp.prop("stall_purple", 20, 27, label="Stragan ze starzyzną", cmds=msg("Starocie, gliniane garnki i 'kamienie z twierdzy'."))
    mp.prop("stall_plain", 16, 33, label="Stragan z suknem", cmds=msg("Sukno i płótno z kontynentu. Targ w każdy piątek."))
    mp.prop("stall_orange", 34, 27, label="Stragan ze zbożem", cmds=msg("Worki zboża - to, czego nie zabrało wojsko."))
    mp.thing_c("table", 31, 34); mp.thing_c("stool", 30, 34); mp.thing_c("stool_b", 33, 34); mp.yard("cart", 34, 32, "Wózek")
    mp.thing_c("sacks", 18, 28); mp.thing_c("barrel_apples", 22, 28); mp.thing_c("crate", 36, 28)
    for x, y in [(13, 22), (37, 22), (13, 35), (37, 35), (22, 31), (28, 27)]:
        mp.lamp(x, y)
    mp.label("RYNEK", 25, 25, "rynek"); mp.label("targ w piątki", 18, 30, "rynek")
    r = mp.house("ratusz", "Ratusz", 39, 22, 11, 4, 3, "red", "fort_stone", upper="timber", upper_h=2, windows="arch_lit",
                 gate=("!$Gate_Wood1", 0), banner="horse", interior=True, kind="ratusz", npc="soltys", win_cols=[1, 3, 7, 9],
                 note="sołtys, sprawy miasteczka; parter z kamieni twierdzy")
    mp.dress(r, gable=(3, "orange", "timber"), dormers=[(1, "red"), (9, "red")], chimneys=[(0, "grey"), (10, "grey")], lamps=[4, 6],
             signs=[(7, "scroll")], ivy=[(0, 0)])
    mp.prop("board_town", 39, 35, label="Tablica sołtysa", cmds=msg("Tablica sołtysa. Zarządzenia, zlecenia, listy gończe.", "(Zlecenia miasteczka - w następnym etapie.)"))
    mp.decor_tree(50, 29, "small")
    b = mp.house("piekarnia", "Piekarnia", 1, 22, 7, 4, 3, "orange_b", "tf_orange", windows="lit", door_style="white", door=5, win_cols=[1, 3],
                 interior=True, kind="rzemiosło", npc="piekarka", note="chleb drożeje - wojsko rekwiruje zboże")
    mp.dress(b, gable=(0, "orange", "tf_orange"), chimneys=[(6, "red")], lamps=[4], signs=[(6, "coin")], clutter=[("barrel_flour", 0, 1)])
    m1 = mp.house("dom_m1", "Dom", 8, 22, 5, 4, 3, "brown_scale", "boards", windows="lit", door=1, win_cols=[3])
    mp.dress(m1, dormers=[(3, "wood_dark")], chimneys=[(0, "grey")], ivy=[(4, 0)])
    kt = mp.house("kantor", "Kantor „Towary z kontynentu”", 1, 30, 8, 3, 3, "blue", "brick_timber", windows="arch_wood_lit", sign="scales",
                  door_style="red", door=4, win_cols=[1, 6], interior=True, kind="handel", npc="kupiec", note="towar z promu wnoszony na wzgórze")
    mp.dress(kt, dormers=[(2, "blue"), (6, "blue")], chimneys=[(7, "light")], lamps=[3], clutter=[("barrel_crate", 1, 1)])
    m2 = mp.house("dom_m2", "Dom", 9, 30, 4, 3, 3, "teal", "plaster", windows="lit", door=2, win_cols=[0], boxes=True)
    mp.dress(m2, chimneys=[(3, "light")])
    # ---- the hill's natural rock edge between the middle and the lower terrace, two stairs down
    rock_cliff(mp, 0, 51, 37, stairs=(24, 25, 26), steps=(7, 16, 33, 40))
    fortress_stairs(mp, 45, 46, 37, 40)
    for x in range(45, 47):
        for j in range(4): mp.owner.pop((x, 37 + j), None)
    mp.label("Skalna krawędź wzgórza", 12, 39, "twierdza")
    # ---- the lower terrace: crafts, the smithy, homes; the second row with the garrison, the refugees under the hill
    h = mp.house("zielarnia", "Zielarnia", 1, 42, 6, 3, 3, "thatch", "grey_logs", windows="square_lit", sign="potions", door=4, win_cols=[1],
                 interior=True, kind="rzemiosło", npc="zielarka", note="pod skałą, zioła z urwiska")
    mp.dress(h, dormers=[(2, "wood")], chimneys=[(0, "tan")], ivy=[(5, 0)], clutter=[("hide_rack", 0, 1)])
    s = mp.house("szewc", "Szewc i krawiec", 8, 41, 7, 4, 3, "green", "tf_green", windows="lattice_lit", sign="scissors", door=5,
                 win_cols=[1], interior=True, kind="rzemiosło", npc="szewc")
    mp.dress(s, gable=(0, "grey", "tf_green"), lamps=[4])
    k = mp.house("kuznia", "Kuźnia", 28, 41, 6, 4, 3, "black", "dark_stone", windows="stone_small", sign="anvil", door=2, win_cols=[5],
                 door_style="iron", interior=True, kind="rzemiosło", npc="kowal", note="przy dolnej drodze, z dala od drewnianych domów")
    mp.dress(k, gable=(0, "grey", "dark_stone"), lamps=[4], signs=[(1, "armor")], ivy=[(0, 0)])
    mp.picture(35, 47, "!$Smith", 0, 2, 1, name="Kuźnia - palenisko", block=[(34 + i, 44 + j) for j in range(4) for i in range(3)], step=True,
               note="<Light:180,120,70,24>")
    mp.thing_c("anvil", 37, 47); mp.thing_c("grindstone", 38, 47); mp.thing_c("firewood", 35, 43)
    l1 = mp.house("dom_l1", "Dom", 39, 42, 5, 3, 3, "red_tile", "tan_block", windows="lit", door=3, win_cols=[1])
    mp.dress(l1, chimneys=[(1, "tan")], clutter=[("crate", 0, 1)])
    l2 = mp.house("dom_l2", "Dom", 47, 41, 5, 4, 3, "orange", "tf_brace", windows="lattice_lit", door=3, win_cols=[1])
    mp.dress(l2, dormers=[(2, "orange")], chimneys=[(4, "light")], ivy=[(0, 0)])
    g = mp.house("posterunek", "Posterunek garnizonu", 16, 50, 7, 3, 2, "black", "grey_stone", windows="barred", banner="wolf", door=3,
                 door_style="iron", interior=True, kind="garnizon", npc="kapral", win_cols=[1, 5], boxes=False, note="dolna brama: kontrola przybyszów, rekwizycje")
    mp.dress(g, chimneys=[(5, "grey")], torches=[2, 4], signs=[(0, "sword")])
    mp.thing_c("weapon_rack", 12, 52); mp.thing_c("weapon_rack_b", 12, 55); mp.thing_c("dummy", 14, 55); mp.thing_c("target", 15, 52)
    l3 = mp.house("dom_l3", "Dom", 28, 50, 6, 3, 2, "straw", "grey_logs", windows="shutter_dark", door=1, win_cols=[3], boxes=False)
    mp.dress(l3, chimneys=[(4, "tan")])
    l4 = mp.house("dom_l4", "Dom", 35, 50, 6, 3, 2, "slate", "logs", windows="shutter_lit", door=4, win_cols=[1], boxes=False)
    mp.dress(l4, chimneys=[(1, "light")], ivy=[(5, 0)])
    l5 = mp.house("dom_l5", "Dom", 42, 50, 5, 3, 2, "purple", "boards", windows="tiny_lit", door=2, win_cols=[0, 4], boxes=False)
    mp.dress(l5, chimneys=[(4, "grey")])
    l6 = mp.house("dom_l6", "Dom", 47, 50, 5, 3, 2, "brown_scale", "tf_brace", windows="lattice_lit", door=3, win_cols=[1], boxes=False)
    mp.dress(l6, chimneys=[(0, "light")])
    mp.prop("tent_hide", 2, 50, label="Namiot uchodźców"); mp.prop("tent_hide", 7, 52, label="Namiot uchodźców")
    mp.prop("tent_small", 3, 54, label="Szałas"); mp.prop("bedroll", 9, 49, label="Posłanie"); mp.prop("bedroll", 0, 53, label="Posłanie")
    mp.campfire(5, 51, pot=True); mp.campfire(9, 55)
    mp.yard("sacks", 1, 55, "Tobołki"); mp.thing_c("crate_lid", 11, 49)
    mp.label("Obóz uchodźców", 5, 53, "uchodźcy")
    # ---- NPC spots
    for kk, x, y, dd in [("kaplan", 5, 14, 2), ("soltys", 42, 31, 2), ("pisarz", 41, 35, 4), ("kowal", 35, 48, 2), ("kupiec", 7, 36, 2),
                         ("piekarka", 4, 29, 2), ("zielarka", 3, 48, 2), ("szewc", 11, 48, 2), ("wodziarz", 29, 29, 2),
                         ("przekupka", 16, 26, 2), ("starzyzna", 20, 26, 2), ("kapral", 21, 55, 8), ("straznik", 23, 49, 6),
                         ("uchodzczyni", 9, 52, 4), ("dezerter", 4, 52, 6)]:
        mp.npc(kk, x, y, dd)
    # ---- ways
    court = mp.rect(12, 14, 34, 18) | mp.rect(2, 12, 11, 13) | mp.rect(35, 13, 43, 18)
    east = mp.rect(38, 31, 51, 33)
    south = mp.rect(24, 41, 26, 55)
    streets = east | south
    lanes = mp.rect(0, 29, 12, 29) | mp.rect(0, 36, 12, 36) | mp.rect(38, 34, 51, 36) | mp.rect(44, 11, 49, 13)
    lanes |= mp.rect(0, 48, 23, 49) | mp.rect(27, 48, 51, 49) | mp.rect(12, 50, 15, 51) | mp.rect(16, 55, 23, 55) | mp.rect(27, 55, 51, 55)
    lanes |= mp.rect(44, 41, 46, 47) | mp.rect(27, 41, 27, 47)
    mp.streets = streets | lanes | court
    for x, y, p in [(0, 10, "B"), (0, 16, "C"), (51, 17, "C"), (0, 45, "C"), (51, 46, "C"), (38, 55, "!$Bush_Bare_A")]:
        mp.tree(x, y, p)
    paint_ground(mp, streets=streets, lanes=lanes, square=square, paved=court, tall_n=10, paved_kind=18, street_kind=40, square_kind=42)
    mp.zones = [("Rynek", square, (240, 200, 90))]
    mp.shots = [(25, 16, 8, "dziedziniec twierdzy"), (25, 25, 8, "schody i baszty bramne"), (25, 33, 2, "rynek"), (25, 44, 8, "dolny taras i skała")]
    return mp


CONCEPTS = {"A": concept_a, "B": concept_b, "C": concept_c}

def main():
    which = [a for a in sys.argv[1:] if a in CONCEPTS] or sorted(CONCEPTS)
    for c in which:
        mp = CONCEPTS[c]()
        n = mp.close_solids()
        path, ne = mp.write_staged()
        print("Map008_%s: %dx%d, %d events (%d blockers), %d buildings" % (c, mp.W, mp.H, ne, n, len(mp.buildings)))

if __name__ == "__main__":
    main()
