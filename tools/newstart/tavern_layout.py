# The tavern's surroundings (Map008 "Okolice Tawerny") and its door into the tavern (Map001 "Tawerna"): one place for the
# generator (build_tavern_area.py), the apply script (tools/apply_tavern_area.py) and the tests (tavern_test.py), so both ends
# of the door always match.
#
#   Map008: the tavern's front with a big arched gate at (13..15, 9); walking up into it opens it and takes the player inside.
#   Map001: the doorway in the bottom wall (49..51, 54) of the big tavern (101x55 since 2026-10-05, tools/tavern/v2);
#   walking down onto it takes the player out in front of the gate.

TAVERN_MAP, OUTSIDE_MAP = 1, 8

# the gate on Map008: the event on the middle tile; the generator's gate covered the three (<Occupy:left=1,right=1>), the user's
# (event 22 since 2026-10-04) is one tile wide - tavern_test.py reads the tiles from the event
GATE = (24, 16)   # (event 22 in the user's hall since 2026-10-04, blocked by RegionLayers region 2; (19, 13) on town C, (14, 9) on the old 30x24 Map008)
GATE_TILES = [(23, 16), (24, 16), (25, 16)]
# where the player lands inside the tavern (just above the doorway, facing into the room)
INSIDE_LANDING = (50, 53, 8)

# the way out on Map001: the doorway tiles -> where the player lands on Map008 (in front of the gate, facing away from it)
EXITS = [((49, 54), (23, 17)), ((50, 54), (24, 17)), ((51, 54), (25, 17))]
EXIT_DIRECTION = 2

# the files as they were when the map was generated (2026-09-27). The apply script refuses to touch a file that has changed
# since (the user may have edited it in the editor); build_tavern_area.py refuses to build on a changed Map008 too.
BASE_SHA256 = {
    "Map008.json": "045a09231bda5498b769766a07f6c8f24f3622b25a8f204802ed0656f7c850c4",   # town C as tools/town/install_town.py installed it (2026-09-29)
    "Map001.json": "57dca04cc22892e3a36cf46ba6813725ead9db5a20410ee21f4c11a8053ff654",   # the big tavern as tools/apply_tavern_interior.py installs it (2026-09-28)
}

# the transfers already on Map008 (made by tools/apply_newstart_maps.py): they stay as they are, with their ids
KEPT_TRANSFERS = [(24, 68), (25, 68), (26, 68)]   # (the east gate to the manor: 51,30..32 until the user walled it up; since 2026-10-04 events 221-222 at 51,50..51, tools/town/east_gate.py)

# the pictures Map008 uses beyond Map003's (img/characters)
PICTURES = ["!Tavern_Yard", "!Signs", "!Decoration", "!Fantasy_chimney", "!Roof_Windows", "!$Gate_Wood1", "!lamp"]
