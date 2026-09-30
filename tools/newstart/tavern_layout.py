# The tavern's surroundings (Map008 "Okolice Tawerny") and its door into the tavern (Map001 "Tawerna"): one place for the
# generator (build_tavern_area.py), the apply script (tools/apply_tavern_area.py) and the tests (tavern_test.py), so both ends
# of the door always match.
#
#   Map008: the tavern's front with a big arched gate at (13..15, 9); walking up into it opens it and takes the player inside.
#   Map001: the doorway in the bottom wall (49..51, 83) of the big tavern (101x84 since 2026-09-28, tools/tavern/parter_layout.py);
#   walking down onto it takes the player out in front of the gate.

TAVERN_MAP, OUTSIDE_MAP = 1, 8

# the gate on Map008: the event stands on the middle tile and covers the three (<Occupy:left=1,right=1>)
GATE = (19, 13)   # (town C since 2026-09-29; was (14, 9) on the old 30x24 Map008)
GATE_TILES = [(18, 13), (19, 13), (20, 13)]
# where the player lands inside the tavern (just above the doorway, facing into the room)
INSIDE_LANDING = (50, 82, 8)

# the way out on Map001: the doorway tiles -> where the player lands on Map008 (in front of the gate, facing away from it)
EXITS = [((49, 83), (18, 14)), ((50, 83), (19, 14)), ((51, 83), (20, 14))]
EXIT_DIRECTION = 2

# the files as they were when the map was generated (2026-09-27). The apply script refuses to touch a file that has changed
# since (the user may have edited it in the editor); build_tavern_area.py refuses to build on a changed Map008 too.
BASE_SHA256 = {
    "Map008.json": "045a09231bda5498b769766a07f6c8f24f3622b25a8f204802ed0656f7c850c4",   # town C as tools/town/install_town.py installed it (2026-09-29)
    "Map001.json": "57dca04cc22892e3a36cf46ba6813725ead9db5a20410ee21f4c11a8053ff654",   # the big tavern as tools/apply_tavern_interior.py installs it (2026-09-28)
}

# the transfers already on Map008 (made by tools/apply_newstart_maps.py): they stay as they are, with their ids
KEPT_TRANSFERS = [(24, 68), (25, 68), (26, 68), (51, 30), (51, 31), (51, 32)]

# the pictures Map008 uses beyond Map003's (img/characters)
PICTURES = ["!Tavern_Yard", "!Signs", "!Decoration", "!Fantasy_chimney", "!Roof_Windows", "!$Gate_Wood1", "!lamp"]
