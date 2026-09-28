# Tileset 8 flags: walkability of the other tileset-8 maps, today vs the new flags

Engine passability (4 tile layers, star rule, both directions) + blocking events (active page, same as characters, not through, `<Occupy>`), 4-way flood fill from every arrival point.

## Map002 Domek - Wnętrze (11x11, 8 events)
- arrivals: 58 floor cells (no transfer leads here: flood from every floor cell)
- reachable cells: 62 today, 58 with the new flags
- no longer reachable: (5,4), (6,2), (9,1), (9,2)
- newly reachable: none
- cells whose own passability changes (inside the reachable area): (1,3), (3,3), (4,3), (5,4), (5,6), (6,2), (6,3), (6,4), (6,5), (7,4), (8,3), (9,1), (9,2)
- the same, anywhere on the map (mostly walls that were walkable and now block): 17

## Map016  (17x13, 0 events)
- arrivals: 0 floor cells (no transfer leads here: flood from every floor cell)
- reachable cells: 0 today, 0 with the new flags
- no longer reachable: none
- newly reachable: none
- cells whose own passability changes (inside the reachable area): none
- the same, anywhere on the map (mostly walls that were walkable and now block): 0

## Map019 Dom dziadka (11x10, 19 events)
- arrivals: (5,7), (8,6)
- reachable cells: 43 today, 32 with the new flags
- no longer reachable: (1,1), (1,2), (2,2), (3,1), (3,2), (4,2), (5,2), (6,1), (6,2), (7,1), (7,2)
- newly reachable: none
- cells whose own passability changes (inside the reachable area): (1,1), (1,2), (2,2), (3,1), (3,2), (4,2), (5,2), (6,1), (6,2), (7,1), (7,2)
- the same, anywhere on the map (mostly walls that were walkable and now block): 12

## Map100 Chatka (7x6, 3 events)
- arrivals: 11 floor cells (no transfer leads here: flood from every floor cell)
- reachable cells: 11 today, 11 with the new flags
- no longer reachable: none
- newly reachable: none
- cells whose own passability changes (inside the reachable area): none
- the same, anywhere on the map (mostly walls that were walkable and now block): 1

Total reachability changes: 15