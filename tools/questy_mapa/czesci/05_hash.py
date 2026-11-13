

# ------------------------------------------------------------------ Farming.hash2 (Farming.js) - which cells hold a random dry bush
def _imul(a, b):
    r = (a * b) & 0xFFFFFFFF
    return r
def _i32(v): return v if v < 0x80000000 else v - 0x100000000
def hash2(x, y, s):
    h = _imul(x & 0xFFFFFFFF, 374761393) ^ _imul(y & 0xFFFFFFFF, 668265263) ^ _imul(s & 0xFFFFFFFF, 1103515245)
    h = _imul(h ^ (h >> 13), 1274126177)
    return ((h ^ (h >> 16)) & 0xFFFFFFFF) / 4294967296.0
BUSH_SHARE = 0.02
def bush_cells(x, y, w, h): return [[xx, yy] for yy in range(y, y + h) for xx in range(x, x + w) if hash2(xx, yy, 811) < BUSH_SHARE]
