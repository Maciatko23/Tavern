# black-background render -> RGBA (flood fill from the border)
import numpy as np
from PIL import Image
from collections import deque
def alpha(im):
    a = np.array(im.convert("RGB")).astype(int); h, w, _ = a.shape
    bg = (a.max(-1) <= 2); seen = np.zeros((h, w), bool); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if bg[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if bg[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and bg[ny, nx] and not seen[ny, nx]: seen[ny, nx] = True; q.append((ny, nx))
    return Image.fromarray(np.dstack([a, np.where(seen, 0, 255)]).astype(np.uint8))
