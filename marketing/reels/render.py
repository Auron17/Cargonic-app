"""Cargonic Instagram Reels renderer (1080x1920, 30fps).

Usage: python3 render.py <reel_id> <voice.mp3> <out.mp4>
Frames are drawn with Pillow and piped to ffmpeg; the voiceover is mixed
with a synthesized road/beat bed and whoosh/impact hits.
"""
import math
import random
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

from reels import REELS

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "assets"
W, H, FPS = 1080, 1920, 30
FONT_DIR = "/usr/share/fonts/opentype/inter/"

# Brand palette (src/theme/index.ts + app icon)
NAVY = (10, 22, 38)
BLUE = (36, 87, 245)
SKY = (54, 169, 245)
ORANGE = (249, 115, 22)
RED = (239, 68, 68)
GREEN = (16, 185, 129)
WHITE = (255, 255, 255)
SLATE = (15, 23, 42)
MUTED = (100, 116, 139)
APP_BG = (242, 244, 247)
YELLOW = (255, 214, 10)

_fonts = {}


def font(size, weight="Black", display=True):
    key = (size, weight, display)
    if key not in _fonts:
        name = ("InterDisplay-" if display else "Inter-") + weight + ".otf"
        _fonts[key] = ImageFont.truetype(FONT_DIR + name, size)
    return _fonts[key]


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_back(x):
    x = clamp(x)
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def lerp(a, b, t):
    return a + (b - a) * t


def mix(c1, c2, t):
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))


# ---------------------------------------------------------------- assets
def load(path, width=None):
    im = Image.open(path).convert("RGBA")
    if width:
        im = im.resize((width, int(im.height * width / im.width)), Image.LANCZOS)
    return im


TRUCK = load(ASSETS / "trucks/tent.png", 980)
TRUCK_SMALL = {k: load(ASSETS / f"trucks/{k}.png", 150) for k in
               ["tent", "refrigerator", "flatbed", "container", "tipper", "isothermal"]}
ICON = Image.open(ASSETS / "icon.png").convert("RGBA")
LOGO = load(ASSETS / "logo-horizontal.png", 760)


def rounded_icon(size):
    im = ICON.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=size // 4.5, fill=255)
    im.putalpha(mask)
    return im


# ---------------------------------------------------------------- backgrounds
def vertical_gradient(top, bottom, h=H):
    g = np.linspace(0, 1, h)[:, None, None]
    arr = (np.array(top)[None, None, :] * (1 - g) + np.array(bottom)[None, None, :] * g)
    arr = np.repeat(arr, W, axis=1).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def radial_glow(color, center, radius, strength=0.8):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt((xx - center[0]) ** 2 + (yy - center[1]) ** 2) / radius
    a = np.clip(1 - d, 0, 1) ** 2 * strength
    layer = np.zeros((H, W, 4), np.uint8)
    layer[..., :3] = color
    layer[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(layer, "RGBA")


def vignette(strength=0.75):
    yy, xx = np.mgrid[0:H, 0:W]
    d = np.sqrt(((xx - W / 2) / (W * 0.75)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
    a = np.clip(d - 0.45, 0, 1) * strength
    layer = np.zeros((H, W, 4), np.uint8)
    layer[..., 3] = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    return Image.fromarray(layer, "RGBA")


VIGNETTE = vignette()
HORIZON = 1020

_bg_cache = {}


def bg_cached(key, fn):
    if key not in _bg_cache:
        _bg_cache[key] = fn()
    return _bg_cache[key]


def road_base(glow):
    def make():
        im = vertical_gradient((4, 8, 20), (18, 26, 44)).convert("RGBA")
        im.alpha_composite(radial_glow(glow, (W // 2, HORIZON), 900, 0.55))
        d = ImageDraw.Draw(im)
        # far hills
        pts = [(0, HORIZON)]
        rnd = random.Random(3)
        for x in range(0, W + 60, 60):
            pts.append((x, HORIZON - 40 - rnd.randint(0, 70)))
        pts.append((W, HORIZON))
        d.polygon(pts, fill=(8, 12, 24))
        # ground + road
        d.rectangle((0, HORIZON, W, H), fill=(14, 18, 28))
        d.polygon([(W / 2 - 30, HORIZON), (W / 2 + 30, HORIZON), (W + 520, H), (-520, H)], fill=(34, 38, 48))
        for side in (-1, 1):
            d.line([(W / 2 + side * 28, HORIZON), (W / 2 + side * (W / 2 + 470), H)], fill=(200, 200, 200), width=6)
        return im
    return bg_cached(("road", glow), make)


def draw_road_dashes(im, t, speed=1.6):
    d = ImageDraw.Draw(im)
    for i in range(10):
        p = ((i / 10) + t * speed * 0.25) % 1.0
        z0, z1 = p ** 2.2, min(1, (p + 0.045) ** 2.2)
        y0, y1 = HORIZON + z0 * (H - HORIZON), HORIZON + z1 * (H - HORIZON)
        w0, w1 = 3 + z0 * 26, 3 + z1 * 26
        d.polygon([(W / 2 - w0, y0), (W / 2 + w0, y0), (W / 2 + w1, y1), (W / 2 - w1, y1)], fill=(250, 204, 21))


def flat_bg(top, bottom, glow=None, glow_pos=(W // 2, 700)):
    def make():
        im = vertical_gradient(top, bottom).convert("RGBA")
        if glow:
            im.alpha_composite(radial_glow(glow, glow_pos, 1000, 0.5))
        return im
    return bg_cached(("flat", top, bottom, glow, glow_pos), make)


def grid_overlay(im, t, color=(255, 255, 255), alpha=14):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    off = int(t * 40) % 90
    for x in range(-90, W + 90, 90):
        d.line([(x, 0), (x, H)], fill=color + (alpha,), width=2)
    for y in range(-90 + off, H + 90, 90):
        d.line([(0, y), (W, y)], fill=color + (alpha,), width=2)
    im.alpha_composite(layer)


# ---------------------------------------------------------------- text
def text_size(txt, f):
    b = f.getbbox(txt)
    return b[2] - b[0], b[3] - b[1], b


def text_layer(lines, size, fill=WHITE, weight="Black", stroke=0, stroke_fill=(0, 0, 0),
               line_gap=1.08, shadow=True, colors=None):
    f = font(size, weight)
    asc, desc = f.getmetrics()
    lh = int((asc + desc) * line_gap)
    widths = [f.getlength(line) for line in lines]
    lw, lh_total = int(max(widths)) + stroke * 2 + 40, lh * len(lines) + stroke * 2 + 40
    layer = Image.new("RGBA", (lw, lh_total), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i, line in enumerate(lines):
        x = (lw - widths[i]) / 2
        c = colors[i] if colors else fill
        d.text((x, 20 + stroke + i * lh), line, font=f, fill=c, stroke_width=stroke, stroke_fill=stroke_fill)
    if shadow:
        sh = Image.new("RGBA", layer.size, (0, 0, 0, 0))
        sh.putalpha(layer.getchannel("A").point(lambda a: int(a * 0.55)))
        sh = sh.filter(ImageFilter.GaussianBlur(14))
        base = Image.new("RGBA", layer.size, (0, 0, 0, 0))
        base.alpha_composite(sh, (0, 8))
        base.alpha_composite(layer)
        layer = base
    return layer


def paste_center(im, layer, cx, cy, scale=1.0, alpha=1.0, rot=0.0):
    if alpha <= 0.01 or scale <= 0.01:
        return
    lay = layer
    if abs(scale - 1) > 0.005:
        lay = lay.resize((max(1, int(lay.width * scale)), max(1, int(lay.height * scale))), Image.BILINEAR)
    if abs(rot) > 0.05:
        lay = lay.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 0.99:
        a = lay.getchannel("A").point(lambda v: int(v * alpha))
        lay = lay.copy()
        lay.putalpha(a)
    im.alpha_composite(lay, (int(cx - lay.width / 2), int(cy - lay.height / 2)))


def pop(im, layer, cx, cy, lt, delay=0.0, dur=0.35, shake=0.0, t=0.0):
    p = (lt - delay) / dur
    if p <= 0:
        return
    s = ease_back(p) if p < 1 else 1.0
    dx = dy = 0
    if shake:
        decay = max(0, 1 - (lt - delay) / 0.6)
        dx = math.sin(t * 90) * shake * decay
        dy = math.cos(t * 77) * shake * decay
    paste_center(im, layer, cx + dx, cy + dy, scale=0.6 + 0.4 * s, alpha=clamp(p * 2.5))


_layer_cache = {}


def tl(key, *args, **kw):
    k = repr((key, args, sorted(kw.items())))
    if k not in _layer_cache:
        _layer_cache[k] = text_layer(*args, **kw)
    return _layer_cache[k]


# ---------------------------------------------------------------- captions
def draw_caption(im, sc, t):
    """Karaoke-style caption in the safe zone above Instagram's bottom UI."""
    base = sc["start"]
    caps = sc["captions"]
    ci = 0
    for i, (a, b) in enumerate(sc["chunks"]):
        if t >= base + a - 0.15:
            ci = i
    words = caps[ci].split()
    if not words:
        return
    start, end = base + sc["chunks"][ci][0], base + sc["chunks"][ci][1]
    total = sum(len(w) + 1 for w in words)
    f = font(58, "ExtraBold")
    # line-wrap at ~880px
    lines, cur = [], []
    for i, w in enumerate(words):
        test = " ".join(words[j] for j in cur + [i])
        if cur and f.getlength(test) > 880:
            lines.append(cur)
            cur = [i]
        else:
            cur.append(i)
    lines.append(cur)
    acc, word_t = 0, []
    for w in words:
        word_t.append(start + (end - start) * acc / total)
        acc += len(w) + 1
    appear = clamp((t - start + 0.15) / 0.2)
    lh = 76
    y0 = 1480 - lh * len(lines) / 2
    box_w = max(f.getlength(" ".join(words[i] for i in idxs)) for idxs in lines) + 80
    pill = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle(
        ((W - box_w) / 2, y0 - 22 + (1 - appear) * 20, (W + box_w) / 2, y0 + lh * len(lines) + 14 + (1 - appear) * 20),
        radius=36, fill=(0, 0, 0, int(150 * appear)))
    im.alpha_composite(pill)
    d = ImageDraw.Draw(im)
    for li, idxs in enumerate(lines):
        line = " ".join(words[i] for i in idxs)
        x = (W - f.getlength(line)) / 2
        y = y0 + li * lh + (1 - appear) * 20
        for i in idxs:
            w = words[i]
            active = word_t[i] <= t
            cur_word = active and (i == len(words) - 1 or word_t[i + 1] > t)
            col = YELLOW if cur_word else (WHITE if active else (200, 205, 215))
            d.text((x, y), w, font=f, fill=col + (int(255 * appear),), stroke_width=7, stroke_fill=(0, 0, 0, int(230 * appear)))
            x += f.getlength(w + " ")


# ---------------------------------------------------------------- UI pieces
def rrect(d, box, r, fill, outline=None, width=0):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=width)


def phone_frame(screen):
    """Wrap a 640x1300 screen image in a phone body with shadow."""
    pw, ph = screen.width + 44, screen.height + 44
    body = Image.new("RGBA", (pw + 120, ph + 120), (0, 0, 0, 0))
    sh = Image.new("RGBA", body.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle((60, 80, 60 + pw, 80 + ph), 80, fill=(0, 0, 0, 170))
    body.alpha_composite(sh.filter(ImageFilter.GaussianBlur(30)))
    d = ImageDraw.Draw(body)
    rrect(d, (60, 60, 60 + pw, 60 + ph), 78, (22, 24, 30), outline=(70, 75, 88), width=4)
    mask = Image.new("L", screen.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, screen.width, screen.height), 58, fill=255)
    scr = screen.copy()
    scr.putalpha(mask)
    body.alpha_composite(scr, (82, 82))
    rrect(d, (60 + pw / 2 - 70, 98, 60 + pw / 2 + 70, 132), 17, (10, 10, 12))
    return body


SW, SH = 640, 1300


def status_bar(d, dark=True):
    c = SLATE if dark else WHITE
    d.text((40, 30), "9:41", font=font(28, "SemiBold", False), fill=c)
    rrect(d, (SW - 92, 36, SW - 44, 58), 6, None, outline=c, width=3)
    rrect(d, (SW - 88, 40, SW - 58, 54), 3, c)


def app_header(d, title, sub=None):
    d.rectangle((0, 0, SW, 190), fill=WHITE)
    status_bar(d)
    d.text((40, 96), title, font=font(48, "Bold"), fill=SLATE)
    if sub:
        d.text((SW - 40 - font(24, "SemiBold", False).getlength(sub), 112), sub, font=font(24, "SemiBold", False), fill=BLUE)


def load_card(route_from, route_to, truck, weight, price, bidding=False, highlight=0.0):
    cw, ch = SW - 48, 300
    card = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    rrect(d, (0, 0, cw, ch), 28, WHITE, outline=mix((232, 235, 240), ORANGE, highlight), width=3 + int(4 * highlight))
    d.ellipse((28, 34, 48, 54), fill=BLUE)
    d.line((38, 56, 38, 104), fill=(203, 213, 225), width=4)
    d.ellipse((28, 106, 48, 126), fill=ORANGE)
    d.text((66, 26), route_from, font=font(34, "Bold"), fill=SLATE)
    d.text((66, 98), route_to, font=font(34, "Bold"), fill=SLATE)
    card.alpha_composite(TRUCK_SMALL[truck], (cw - 172, 24))
    d.text((cw - 160, 100), weight, font=font(24, "SemiBold", False), fill=MUTED)
    d.line((24, 160, cw - 24, 160), fill=(232, 235, 240), width=2)
    d.text((28, 186), price, font=font(40, "Black"), fill=SLATE)
    d.text((28, 238), "Takliflar asosida" if bidding else "Belgilangan narx", font=font(22, "Medium", False), fill=MUTED)
    bw = 210
    rrect(d, (cw - bw - 24, 192, cw - 24, 262), 20, ORANGE if bidding else BLUE)
    lbl = "Taklif" if bidding else "Olaman"
    d.text((cw - 24 - bw / 2 - font(30, "Bold").getlength(lbl) / 2, 207), lbl, font=font(30, "Bold"), fill=WHITE)
    return card


LOADS = [
    ("Samarqand", "Toshkent", "tent", "20 t", "6 800 000 so‘m", True),
    ("Navoiy", "Andijon", "refrigerator", "18 t", "9 200 000 so‘m", False),
    ("Toshkent", "Buxoro", "flatbed", "22 t", "7 400 000 so‘m", True),
    ("Qarshi", "Namangan", "container", "24 t", "8 900 000 so‘m", False),
    ("Jizzax", "Farg‘ona", "tipper", "25 t", "5 600 000 so‘m", True),
    ("Olmaliq", "Termiz", "isothermal", "16 t", "8 100 000 so‘m", False),
]


def screen_feed(scroll, highlight_idx=-1, highlight=0.0, notif=0.0):
    scr = Image.new("RGBA", (SW, SH), APP_BG)
    d = ImageDraw.Draw(scr)
    y = 210 - scroll
    for i, ld in enumerate(LOADS * 2):
        if y > SH:
            break
        if y > -320:
            scr.alpha_composite(load_card(*ld, highlight=highlight if i == highlight_idx else 0.0), (24, int(y)))
        y += 324
    app_header(d, "Yuklar", "Barchasi ▾")
    # tab bar
    d.rectangle((0, SH - 120, SW, SH), fill=WHITE)
    for i, lbl in enumerate(["Yuklar", "Reyslarim", "Balans", "Profil"]):
        cx = SW / 8 * (2 * i + 1)
        col = BLUE if i == 0 else MUTED
        d.ellipse((cx - 14, SH - 98, cx + 14, SH - 70), fill=col)
        fw = font(20, "SemiBold", False)
        d.text((cx - fw.getlength(lbl) / 2, SH - 60), lbl, font=fw, fill=col)
    if notif > 0:
        ny = -140 + 200 * ease_out(notif)
        rrect(d, (20, ny, SW - 20, ny + 130), 28, (30, 41, 59))
        scr.alpha_composite(rounded_icon(74), (40, int(ny) + 28))
        d.text((132, ny + 26), "Yangi yuk: Navoiy → Toshkent", font=font(26, "Bold"), fill=WHITE)
        d.text((132, ny + 70), "20 t · 7 900 000 so‘m · hozir", font=font(23, "Medium", False), fill=(148, 163, 184))
    return scr


def screen_bid(typed, sent=0.0):
    scr = screen_feed(0)
    shade = Image.new("RGBA", (SW, SH), (2, 6, 23, 150))
    scr.alpha_composite(shade)
    d = ImageDraw.Draw(scr)
    top = 560
    rrect(d, (0, top, SW, SH + 40), 40, WHITE)
    rrect(d, (SW / 2 - 40, top + 16, SW / 2 + 40, top + 24), 4, (203, 213, 225))
    d.text((40, top + 50), "Taklif berish", font=font(44, "Bold"), fill=SLATE)
    d.text((40, top + 130), "Samarqand → Toshkent · 20 t", font=font(26, "Medium", False), fill=MUTED)
    d.text((40, top + 200), "Taklifingiz narxi (so‘mda)", font=font(26, "SemiBold", False), fill=SLATE)
    rrect(d, (40, top + 246, SW - 40, top + 346), 22, (248, 250, 252), outline=BLUE, width=4)
    full = "7 200 000"
    shown = full[:int(len(full) * clamp(typed))]
    d.text((70, top + 270), shown + ("|" if typed < 1 else ""), font=font(46, "Black"), fill=SLATE)
    d.text((40, top + 380), "Platforma komissiyasi taxminan ko‘rsatiladi", font=font(22, "Medium", False), fill=MUTED)
    col = mix(ORANGE, GREEN, clamp(sent))
    rrect(d, (40, top + 450, SW - 40, top + 550), 26, col)
    lbl = "Taklif yuborildi" if sent > 0.5 else "Taklifni yuborish"
    fb = font(34, "Bold")
    d.text((SW / 2 - fb.getlength(lbl) / 2, top + 478), lbl, font=fb, fill=WHITE)
    return scr


def screen_calls(n_visible):
    scr = Image.new("RGBA", (SW, SH), (12, 12, 16))
    d = ImageDraw.Draw(scr)
    status_bar(d, dark=False)
    d.text((40, 96), "So‘nggi qo‘ng‘iroqlar", font=font(42, "Bold"), fill=WHITE)
    names = ["Dispetcher Akmal", "+998 90 *** 12 47", "Yuk (Chirchiq)", "+998 93 *** 88 10", "Logist Sherzod",
             "+998 97 *** 05 33", "Yuk bor? (Navoiy)", "+998 99 *** 61 72", "Dispetcher 2", "+998 91 *** 40 18"]
    times = ["07:12", "07:20", "07:41", "08:05", "08:30", "08:52", "09:14", "09:40", "10:03", "10:27"]
    for i in range(min(int(n_visible), len(names))):
        y = 190 + i * 104
        d.text((40, y + 18), names[i], font=font(32, "SemiBold", False), fill=RED if i % 3 != 1 else WHITE)
        d.text((40, y + 60), "Javob yo‘q" if i % 2 == 0 else "Rad etildi", font=font(22, "Medium", False), fill=(140, 140, 150))
        d.text((SW - 130, y + 30), times[i], font=font(26, "Medium", False), fill=(140, 140, 150))
        d.line((40, y + 100, SW - 40, y + 100), fill=(40, 40, 48), width=2)
    return scr


def screen_balance(n_rows):
    scr = Image.new("RGBA", (SW, SH), APP_BG)
    d = ImageDraw.Draw(scr)
    rrect(d, (24, 210, SW - 24, 470), 32, BLUE)
    d.text((56, 240), "Shu oy kelishilgan haq", font=font(26, "Medium", False), fill=(219, 228, 255))
    d.text((56, 290), "38 400 000 so‘m", font=font(58, "Black"), fill=WHITE)
    d.text((56, 380), "5 ta reys · barchasi ko‘rinib turadi", font=font(24, "Medium", False), fill=(219, 228, 255))
    rows = [("Reys #1042 · Samarqand → Toshkent", "+6 800 000", GREEN),
            ("Komissiya · #1042", "−340 000", MUTED),
            ("Reys #1051 · Navoiy → Andijon", "+9 200 000", GREEN),
            ("Komissiya · #1051", "−460 000", MUTED),
            ("Reys #1063 · Toshkent → Buxoro", "+7 400 000", GREEN)]
    for i in range(min(int(n_rows), len(rows))):
        y = 510 + i * 128
        rrect(d, (24, y, SW - 24, y + 112), 24, WHITE)
        d.text((52, y + 22), rows[i][0], font=font(24, "SemiBold", False), fill=SLATE)
        d.text((52, y + 62), "12-okt, 14:20", font=font(20, "Medium", False), fill=MUTED)
        fa = font(30, "Bold")
        d.text((SW - 52 - fa.getlength(rows[i][1]), y + 38), rows[i][1], font=fa, fill=rows[i][2])
    app_header(d, "Balans")
    return scr



def screen_trip(progress):
    """Active-trip screen: step tracker with photo proof, filled by progress 0..1."""
    scr = Image.new("RGBA", (SW, SH), APP_BG)
    d = ImageDraw.Draw(scr)
    rrect(d, (24, 210, SW - 24, 430), 28, WHITE)
    d.text((52, 232), "Samarqand → Toshkent", font=font(34, "Bold"), fill=SLATE)
    d.text((52, 282), "Reys #1042 · 20 t · 6 800 000 so‘m", font=font(24, "Medium", False), fill=MUTED)
    rrect(d, (52, 340, 300, 394), 27, (219, 234, 254))
    d.text((74, 350), "Kelishilgan narx", font=font(24, "SemiBold", False), fill=BLUE)
    steps = ["Olindi", "Yo‘lda", "Ortishda", "Ortildi", "Topshirildi"]
    photo = {3: "Rasm yuklandi", 4: "Hujjat yuklandi"}
    done = progress * len(steps)
    y0 = 470
    for i, name in enumerate(steps):
        y = y0 + i * 130
        ok = done >= i + 1
        cur = i <= done < i + 1
        col = GREEN if ok else (ORANGE if cur else (203, 213, 225))
        if i < len(steps) - 1:
            d.line((70, y + 46, 70, y + 130), fill=GREEN if ok else (226, 232, 240), width=6)
        d.ellipse((44, y, 96, y + 52), fill=col)
        if ok:
            d.line([(58, y + 27), (68, y + 38), (84, y + 15)], fill=WHITE, width=6)
        d.text((126, y + 6), name, font=font(34, "Bold"), fill=SLATE if (ok or cur) else MUTED)
        if ok and i in photo:
            rrect(d, (360, y - 4, SW - 36, y + 56), 18, (209, 250, 229))
            d.text((380, y + 8), photo[i], font=font(24, "SemiBold", False), fill=(5, 150, 105))
    rrect(d, (24, SH - 150, SW - 24, SH - 40), 26, BLUE)
    lbl = "Zavod xaritada ko‘rmoqda"
    fl = font(30, "Bold")
    d.text((SW / 2 - fl.getlength(lbl) / 2, SH - 118), lbl, font=fl, fill=WHITE)
    app_header(d, "Reys")
    return scr


# ---------------------------------------------------------------- scenes
def item_at(s, item):
    """Item time relative to scene start: (chunk index, fraction of that chunk)."""
    ci, frac = item["at"]
    a, b = s["chunks"][ci]
    return a + (b - a) * frac


def sc_road(im, s, t, lt, dur):
    im.alpha_composite(road_base(s.get("glow", (249, 115, 22))))
    draw_road_dashes(im, t)
    x = lerp(-900, W / 2 - 490, ease_out(lt / 1.2)) + math.sin(t * 2) * 6
    bob = math.sin(t * 13) * 2
    im.alpha_composite(TRUCK, (int(x), int(1180 + bob)))
    if s.get("title"):
        pop(im, tl("t", s["title"], s.get("size", 104), colors=s.get("colors")), W / 2, 520, lt, 0.1)
    if s.get("chip"):
        f = font(46, "Bold")
        cw = f.getlength(s["chip"]) + 80
        chip = Image.new("RGBA", (int(cw), 100), (0, 0, 0, 0))
        cd = ImageDraw.Draw(chip)
        rrect(cd, (0, 0, cw, 100), 50, (255, 255, 255, 235))
        cd.text((40, 20), s["chip"], font=f, fill=SLATE)
        pop(im, chip, W / 2, 300, lt, 0.0)


def sc_big(im, s, t, lt, dur):
    if s.get("blue"):
        im.alpha_composite(flat_bg((30, 72, 230), (8, 20, 80), (90, 170, 255), (W // 2, 700)))
    else:
        im.alpha_composite(flat_bg((24, 6, 10), (6, 4, 8), s.get("glow", (190, 30, 40)), (W // 2, 760)))
    grid_overlay(im, t, alpha=10)
    if s.get("truck_ghost"):
        g = TRUCK.copy()
        g.putalpha(g.getchannel("A").point(lambda a: int(a * 0.22)))
        im.alpha_composite(g, (int(W / 2 - 490 + lt * 30), 1080))
    lines = s["lines"]
    pop(im, tl("big", lines, s.get("size", 190), colors=s.get("colors")), W / 2, s.get("y", 700), lt, 0.0,
        shake=s.get("shake", 18), t=t)
    if s.get("sub"):
        pop(im, tl("sub", s["sub"], 64, fill=(226, 232, 240), weight="Bold"), W / 2, s.get("y", 700) + 120 + 95 * len(lines),
            lt, 0.35)


def sc_costs(im, s, t, lt, dur):
    im.alpha_composite(flat_bg((22, 8, 10), (5, 5, 8), (170, 30, 30)))
    grid_overlay(im, t, alpha=8)
    for i, item in enumerate(s["items"]):
        start = item_at(s, item)
        if lt < start:
            continue
        y = 520 + i * 360
        p = ease_out((lt - start) / 0.35)
        label = tl("lbl", [item["label"]], 92, fill=WHITE)
        paste_center(im, label, W / 2 - (1 - p) * 300, y, alpha=p)
        cnt = clamp((lt - start) / 0.9)
        val = item["fmt"](cnt)
        vl = text_layer([val], 84, fill=RED, weight="Black", shadow=False)
        paste_center(im, vl, W / 2 + (1 - p) * 300, y + 120, alpha=p)


def sc_turn(im, s, t, lt, dur):
    im.alpha_composite(flat_bg((30, 72, 230), (12, 30, 120), (90, 170, 255), (W // 2, 600)))
    grid_overlay(im, t, alpha=16)
    flash = clamp(1 - lt / 0.25)
    paste_center(im, rounded_icon(300), W / 2, 520, scale=0.5 + 0.5 * ease_back(lt / 0.5), rot=(1 - ease_out(lt / 0.6)) * 90)
    pop(im, tl("turn", s["lines"], s.get("size", 120)), W / 2, 920, lt, 0.12)
    if flash > 0:
        im.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(255 * flash))))


def phone_scene(im, s, t, lt, dur, screen):
    im.alpha_composite(flat_bg((14, 34, 110), (6, 12, 34), (36, 87, 245), (W // 2, 900)))
    grid_overlay(im, t, alpha=12)
    if s.get("title"):
        pop(im, tl("ph", s["title"], s.get("size", 76), colors=s.get("colors")), W / 2, 220, lt, 0.0, dur=0.3)
    ph = phone_frame(screen)
    p = ease_out(lt / 0.55)
    scale = 0.74
    y = lerp(1500, 860, p) + math.sin(t * 1.5) * 6
    paste_center(im, ph, W / 2, y, scale=scale, rot=math.sin(t * 0.9) * 1.2)


def sc_app_feed(im, s, t, lt, dur):
    tap_at = dur - 1.2 if s.get("tap") else 1e9
    scroll = max(0.0, min(lt, tap_at) - 0.6) * 240
    hl = clamp((lt - tap_at) / 0.3)
    idx = int((scroll + 200) // 324)
    notif = clamp((lt - 0.4) / 0.4) if s.get("notif") else 0.0
    phone_scene(im, s, t, lt, dur, screen_feed(scroll, idx, hl, notif))


def sc_app_bid(im, s, t, lt, dur):
    phone_scene(im, s, t, lt, dur, screen_bid(clamp((lt - 0.5) / 1.2), clamp((lt - dur + 0.6) / 0.2)))


def sc_app_calls(im, s, t, lt, dur):
    phone_scene(im, s, t, lt, dur, screen_calls(1 + lt * 5))
    n = min(30, int(lt * 12) + 1)
    badge = text_layer([f"{n} ta qo‘ng‘iroq"], 70, fill=WHITE, stroke=0)
    bw, bh = badge.size
    bg = Image.new("RGBA", (bw + 20, bh), (0, 0, 0, 0))
    rrect(ImageDraw.Draw(bg), (10, 18, bw + 10, bh - 18), 40, RED + (235,))
    bg.alpha_composite(badge, (10, 0))
    paste_center(im, bg, W / 2, 1300 - 100, scale=1 + 0.06 * math.sin(lt * 14), rot=-4)


def sc_app_balance(im, s, t, lt, dur):
    phone_scene(im, s, t, lt, dur, screen_balance(lt * 3))


def sc_quote(im, s, t, lt, dur):
    im.alpha_composite(flat_bg((20, 20, 26), (6, 6, 10), (120, 120, 140)))
    f = font(84, "Black")
    lines = s["lines"]
    lw = max(f.getlength(x) for x in lines) + 140
    lh = 110 * len(lines) + 120
    bub = Image.new("RGBA", (int(lw), int(lh + 60)), (0, 0, 0, 0))
    d = ImageDraw.Draw(bub)
    rrect(d, (0, 0, lw, lh), 60, WHITE)
    d.polygon([(120, lh - 4), (220, lh - 4), (110, lh + 60)], fill=WHITE)
    for i, line in enumerate(lines):
        d.text((70, 60 + i * 110), line, font=f, fill=SLATE)
    pop(im, bub, W / 2, 700, lt, 0.0, shake=6, t=t)
    pop(im, tl("q", ["— har safar shu javob"], 54, fill=(160, 165, 180), weight="SemiBold"), W / 2, 1060, lt, 0.5)


def sc_calendar(im, s, t, lt, dur):
    im.alpha_composite(flat_bg((22, 8, 10), (5, 5, 8), (160, 30, 30)))
    grid_overlay(im, t, alpha=8)
    days = 1 + int(lerp(0, s.get("days", 14) - 1, ease_out(lt / max(0.5, dur - 0.4))))
    card = Image.new("RGBA", (560, 600), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    rrect(d, (0, 0, 560, 600), 50, WHITE)
    d.rounded_rectangle((0, 0, 560, 150), 50, fill=RED)
    d.rectangle((0, 100, 560, 150), fill=RED)
    lbl = "KUN O‘TDI"
    d.text((280 - font(54, "Black").getlength(lbl) / 2, 45), lbl, font=font(54, "Black"), fill=WHITE)
    num = str(days)
    fn = font(300, "Black")
    d.text((280 - fn.getlength(num) / 2, 170), num, font=fn, fill=SLATE)
    paste_center(im, card, W / 2, 680, scale=1 + 0.03 * math.sin(lt * 18) * (days < s.get("days", 14)))
    pop(im, tl("pay", ["To‘lov: kutilmoqda…"], 66, fill=(252, 165, 165)), W / 2, 1110, lt, 0.3)


def sc_verified(im, s, t, lt, dur):
    im.alpha_composite(flat_bg((14, 34, 110), (6, 12, 34), (36, 87, 245), (W // 2, 900)))
    grid_overlay(im, t, alpha=12)
    pop(im, tl("vt", s["title"], 80), W / 2, 260, lt, 0.0)
    items = s["items"]
    for i, name in enumerate(items):
        p = ease_out((lt - 0.3 - i * 0.35) / 0.4)
        if p <= 0:
            continue
        card = Image.new("RGBA", (880, 170), (0, 0, 0, 0))
        d = ImageDraw.Draw(card)
        rrect(d, (0, 0, 880, 170), 36, WHITE)
        d.ellipse((36, 45, 116, 125), fill=(227, 234, 254))
        d.text((58, 54), "Z", font=font(54, "Black"), fill=BLUE)
        d.text((150, 34), name[0], font=font(44, "Bold"), fill=SLATE)
        d.text((150, 98), name[1], font=font(28, "Medium", False), fill=MUTED)
        d.ellipse((770, 50, 840, 120), fill=GREEN)
        d.line([(788, 86), (802, 101), (824, 70)], fill=WHITE, width=9)
        paste_center(im, card, W / 2 + (1 - p) * 500, 520 + i * 210, alpha=p)


def sc_steps(im, s, t, lt, dur):
    im.alpha_composite(road_base((36, 87, 245)))
    draw_road_dashes(im, t, 2.4)
    im.alpha_composite(TRUCK, (int(W / 2 - 490 + math.sin(t * 2) * 8), int(1180 + math.sin(t * 13) * 2)))
    for i, step in enumerate(s["items"]):
        start = item_at(s, step)
        p = ease_out((lt - start) / 0.35)
        if p <= 0:
            continue
        card = Image.new("RGBA", (860, 150), (0, 0, 0, 0))
        d = ImageDraw.Draw(card)
        rrect(d, (0, 0, 860, 150), 40, (255, 255, 255, 240))
        d.ellipse((28, 28, 122, 122), fill=ORANGE if i < 2 else GREEN)
        num = str(i + 1)
        d.text((75 - font(56, "Black").getlength(num) / 2, 38), num, font=font(56, "Black"), fill=WHITE)
        d.text((156, 40), step["label"], font=font(60, "Black"), fill=SLATE)
        paste_center(im, card, W / 2, 330 + i * 190, scale=0.85 + 0.15 * ease_back((lt - start) / 0.35), alpha=p)


def sc_cta(im, s, t, lt, dur):
    im.alpha_composite(flat_bg((30, 72, 230), (8, 20, 80), (90, 170, 255), (W // 2, 500)))
    grid_overlay(im, t, alpha=16)
    card = Image.new("RGBA", (880, 220), (0, 0, 0, 0))
    rrect(ImageDraw.Draw(card), (0, 0, 880, 220), 60, WHITE)
    card.alpha_composite(LOGO, (60, 110 - LOGO.height // 2))
    pop(im, card, W / 2, 420, lt, 0.0)
    pop(im, tl("slogan", s["lines"], s.get("size", 92), colors=s.get("colors")), W / 2, 760, lt, 0.25)
    p = clamp((lt - 0.6) / 0.3)
    if p > 0:
        pulse = 1 + 0.05 * math.sin(lt * 7)
        btn = Image.new("RGBA", (820, 170), (0, 0, 0, 0))
        bd = ImageDraw.Draw(btn)
        rrect(bd, (0, 0, 820, 170), 85, ORANGE)
        lbl = s.get("button", "YUKLAB OL")
        fb = font(64, "Black")
        bd.text((410 - fb.getlength(lbl) / 2, 46), lbl, font=fb, fill=WHITE)
        paste_center(im, btn, W / 2, 1100, scale=pulse * (0.7 + 0.3 * ease_back(p)), alpha=p)
        pop(im, tl("link", ["Havola — profilda ↑"], 52, fill=(219, 228, 255), weight="Bold"), W / 2, 1260, lt, 0.9)



def sc_chat(im, s, t, lt, dur):
    im.alpha_composite(flat_bg((17, 27, 41), (8, 14, 24), (36, 87, 245), (W // 2, 700)))
    grid_overlay(im, t, alpha=6)
    d = ImageDraw.Draw(im)
    rrect(d, (40, 150, W - 40, 330), 44, (30, 41, 59))
    d.ellipse((70, 180, 170, 280), fill=(51, 65, 85))
    d.text((200, 182), s.get("chat_title", "Yuk guruhi"), font=font(56, "Bold"), fill=WHITE)
    d.text((200, 258), "yozmoqda…" if lt % 1.2 < 0.6 else "onlayn", font=font(32, "Medium", False), fill=(148, 163, 184))
    f = font(64, "SemiBold", False)
    y = 420
    for m in s["msgs"]:
        at = item_at(s, m)
        p = ease_out((lt - at) / 0.25)
        if p <= 0:
            continue
        side, text = m["side"], m["text"]
        bw = min(f.getlength(text) + 100, 960)
        x0 = 50 if side == "in" else W - 50 - bw
        by = y + (1 - p) * 40
        fill = (51, 65, 85) if side == "in" else (36, 87, 245)
        bub = Image.new("RGBA", (int(bw) + 10, 170), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bub)
        rrect(bd, (0, 0, bw, 150), 50, fill)
        bd.text((50, 38), text, font=f, fill=WHITE)
        paste_center(im, bub, x0 + bub.width / 2, by + 85, alpha=p)
        y += 200
    st = s.get("stamp")
    if st:
        at = item_at(s, {"at": st["at"]})
        if lt >= at:
            lay = tl("st", [st["text"]], st.get("size", 130), fill=st.get("color", RED))
            pop(im, lay, W / 2, 1130, lt, at, shake=10, t=t)


def sc_trip(im, s, t, lt, dur):
    phone_scene(im, s, t, lt, dur, screen_trip(clamp((lt - 0.4) / max(0.5, dur - 1.0))))


def sc_checks(im, s, t, lt, dur):
    im.alpha_composite(flat_bg((14, 34, 110), (6, 12, 34), (36, 87, 245), (W // 2, 900)))
    grid_overlay(im, t, alpha=12)
    pop(im, tl("ck", s["title"], s.get("size", 84), colors=s.get("colors")), W / 2, 260, lt, 0.0)
    for i, name in enumerate(s["items"]):
        at = item_at(s, {"at": s["ats"][i]})
        p = ease_out((lt - at) / 0.35)
        if p <= 0:
            continue
        card = Image.new("RGBA", (900, 160), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card)
        rrect(cd, (0, 0, 900, 160), 38, WHITE)
        cd.ellipse((30, 35, 120, 125), fill=GREEN)
        cd.line([(52, 82), (70, 100), (100, 62)], fill=WHITE, width=10)
        cd.text((150, 44), name, font=font(48, "Black"), fill=SLATE)
        paste_center(im, card, W / 2 + (1 - p) * 500, 520 + i * 190, alpha=p)



def edu_bg(im, t, tint=(36, 87, 245)):
    im.alpha_composite(flat_bg((10, 22, 50), (5, 10, 24), tint, (W // 2, 760)))
    grid_overlay(im, t, alpha=9)


def sc_route(im, s, t, lt, dur):
    edu_bg(im, t)
    pop(im, tl("rt", s["title"], 78, colors=s.get("colors")), W / 2, 250, lt, 0.0)
    # elevation profile: Toshkent -> Samarqand -> Toshkent
    pts = []
    for i in range(0, 101):
        x = 90 + i * 9
        u = i / 100
        y = 760 - (math.sin(u * 6.28 * 1.5) * 110 + math.sin(u * 6.28 * 4.0) * 40 + 40)
        pts.append((x, y))
    draw_to = int(len(pts) * ease_out(lt / max(1.0, dur - 0.8)))
    d = ImageDraw.Draw(im)
    if draw_to > 1:
        half = len(pts) // 2
        for i in range(1, min(draw_to, len(pts))):
            col = ORANGE if i <= half else (100, 116, 139)
            d.line([pts[i - 1], pts[i]], fill=col, width=12)
        hx, hy = pts[min(draw_to, len(pts)) - 1]
        d.ellipse((hx - 18, hy - 18, hx + 18, hy + 18), fill=WHITE)
    d.text((90, 830), "Toshkent", font=font(40, "Bold"), fill=WHITE)
    fs = font(40, "Bold")
    d.text((W - 90 - fs.getlength("Samarqand") * 0 - fs.getlength("Toshkent"), 830), "Toshkent", font=fs, fill=WHITE)
    d.text((W / 2 - fs.getlength("Samarqand") / 2, 830), "Samarqand", font=fs, fill=WHITE)
    for (txt, col, x) in [("300 km · YUK BILAN", ORANGE, W * 0.27), ("300 km · BO‘SH", (148, 163, 184), W * 0.73)]:
        pop(im, tl("seg", [txt], 52, fill=col), x, 960, lt, 0.9 if col == ORANGE else 1.8)
    tot = int(clamp((lt - 2.0) / 1.0) * 600)
    if lt > 2.0:
        pop(im, tl("tot", ["Jami: 600 km"], 120, fill=WHITE), W / 2, 1160, lt, 2.0)
    pop(im, tl("hint", ["baland-past yo‘l"], 46, fill=(148, 163, 184), weight="SemiBold"), W / 2, 640, lt, 0.4)


def sc_ledger(im, s, t, lt, dur):
    edu_bg(im, t, tint=s.get("tint", (36, 87, 245)))
    pop(im, tl("lt", s["title"], 84, colors=s.get("colors")), W / 2, 250, lt, 0.0)
    y = 430
    for r in s["rows"]:
        at = item_at(s, r)
        p = ease_out((lt - at) / 0.3)
        if p <= 0:
            y += 230
            continue
        card = Image.new("RGBA", (960, 200), (0, 0, 0, 0))
        cd = ImageDraw.Draw(card)
        hot = r.get("hot")
        rrect(cd, (0, 0, 960, 200), 40, (255, 255, 255, 245) if not hot else (255, 237, 213, 250))
        cd.text((40, 26), r["label"], font=font(46, "Black"), fill=SLATE)
        cd.text((40, 100), r["sub"], font=font(34, "Medium", False), fill=MUTED)
        fa = font(56, "Black")
        cd.text((920 - fa.getlength(r["amount"]), 62), r["amount"], font=fa, fill=r.get("color", RED))
        paste_center(im, card, W / 2 + (1 - p) * 700, y + 100, alpha=p)
        y += 230
    if s.get("note"):
        pop(im, tl("nt", s["note"], 50, fill=(252, 211, 77), weight="Bold"), W / 2, y + 90, lt, item_at(s, {"at": s["note_at"]}))


def sc_total(im, s, t, lt, dur):
    im.alpha_composite(flat_bg((30, 8, 12), (6, 4, 8), (170, 30, 30), (W // 2, 760)))
    grid_overlay(im, t, alpha=8)
    pop(im, tl("tt", ["JAMI XARAJAT"], 90, fill=(252, 165, 165)), W / 2, 420, lt, 0.0)
    cnt = clamp(lt / 0.8)
    val = f"{int(3_600_000 * ease_out(cnt)):,}".replace(",", " ")
    paste_center(im, text_layer([val], 190, fill=WHITE), W / 2, 700)
    pop(im, tl("so", ["so‘m"], 90, fill=WHITE, weight="Bold"), W / 2, 880, lt, 0.2)
    at = item_at(s, {"at": s["km_at"]})
    pop(im, tl("km", ["= 6 000 so‘m / km"], 110, fill=YELLOW), W / 2, 1130, lt, at, shake=10, t=t)


def sc_verdict(im, s, t, lt, dur):
    edu_bg(im, t, tint=(16, 185, 129))
    d = ImageDraw.Draw(im)
    pop(im, tl("vd", ["Foydadamisan?"], 96), W / 2, 250, lt, 0.0)
    inc_w = int(900 * ease_out((lt - 0.3) / 0.6))
    exp_w = int(900 * 3_600_000 / 6_800_000 * ease_out((lt - 0.9) / 0.6))
    d.text((90, 420), "Daromad", font=font(44, "Bold"), fill=WHITE)
    d.text((W - 90 - font(44, "Black").getlength("6 800 000"), 420), "6 800 000", font=font(44, "Black"), fill=WHITE)
    rrect(d, (90, 490, 90 + max(inc_w, 1), 580), 30, GREEN)
    d.text((90, 640), "Xarajat", font=font(44, "Bold"), fill=WHITE)
    d.text((W - 90 - font(44, "Black").getlength("3 600 000"), 640), "3 600 000", font=font(44, "Black"), fill=WHITE)
    rrect(d, (90, 710, 90 + max(exp_w, 1), 800), 30, RED)
    at = item_at(s, {"at": s["win_at"]})
    pop(im, tl("win", ["FOYDA", "3 200 000 so‘m"], 120, colors=[(110, 231, 183), WHITE]), W / 2, 1020, lt, at, shake=8, t=t)
    pop(im, tl("wn", ["ovqat, yo‘l to‘lovi va soliq hali chiqmagan"], 40, fill=(148, 163, 184), weight="SemiBold"),
        W / 2, 1290, lt, item_at(s, {"at": s["warn_at"]}))


def sc_rule(im, s, t, lt, dur):
    edu_bg(im, t, tint=(249, 115, 22))
    pop(im, tl("rl", ["ENG MUHIM QOIDA"], 80, fill=YELLOW), W / 2, 250, lt, 0.0)
    card = Image.new("RGBA", (960, 520), (0, 0, 0, 0))
    cd = ImageDraw.Draw(card)
    rrect(cd, (0, 0, 960, 520), 50, (255, 255, 255, 248))
    cd.text((60, 50), "Narxni hisobla:", font=font(48, "Bold"), fill=MUTED)
    cd.text((60, 130), "300 km  yuk bilan", font=font(64, "Black"), fill=(150, 160, 175))
    cd.line((60, 150, 560, 150), fill=RED, width=10)
    cd.text((60, 250), "600 km  BUTUN yo‘l", font=font(70, "Black"), fill=GREEN)
    cd.text((60, 400), "= har km 6 000 so‘m xarajat", font=font(46, "Bold"), fill=SLATE)
    paste_center(im, card, W / 2, 640, scale=0.8 + 0.2 * ease_back(lt / 0.5), alpha=clamp(lt / 0.25))
    at = item_at(s, {"at": s["loss_at"]})
    pop(im, tl("zr", ["3 600 000 dan past", "= ZARAR"], 104, colors=[WHITE, RED]), W / 2, 1130, lt, at, shake=14, t=t)


SCENES = {
    "road": sc_road, "big": sc_big, "costs": sc_costs, "turn": sc_turn, "feed": sc_app_feed,
    "bid": sc_app_bid, "calls": sc_app_calls, "balance": sc_app_balance, "quote": sc_quote,
    "route": sc_route, "ledger": sc_ledger, "total": sc_total, "verdict": sc_verdict, "rule": sc_rule, "chat": sc_chat, "trip": sc_trip, "checks": sc_checks, "calendar": sc_calendar, "verified": sc_verified, "steps": sc_steps, "cta": sc_cta,
}


# ---------------------------------------------------------------- timing
def speech_segments(audio):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", audio, "-af", "silencedetect=n=-35dB:d=0.25", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts, ends = [], []
    for line in out.splitlines():
        if "silence_start:" in line:
            starts.append(float(line.split("silence_start:")[1].split()[0]))
        if "silence_end:" in line:
            ends.append(float(line.split("silence_end:")[1].split()[0]))
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", audio],
                               capture_output=True, text=True).stdout)
    segs, cur = [], 0.0
    for s, e in zip(starts, ends):
        if s > 0.05:
            segs.append((cur, s))
        cur = e
    if cur < dur - 0.1:
        segs.append((cur, dur))
    return segs, dur


def assign_timing(reel, audio):
    segs, dur = speech_segments(audio)
    scenes = reel["scenes"]
    groups = [len(sc["captions"]) if isinstance(sc["captions"], list) else 1 for sc in scenes]
    if sum(groups) != len(segs):
        raise SystemExit(f"speech chunks={len(segs)} {[(round(a,2),round(b,2)) for a,b in segs]} but groups sum={sum(groups)}")
    i = 0
    for sc, g in zip(scenes, groups):
        sc["start"] = segs[i][0]
        sc["chunks"] = [(a - sc["start"], b - sc["start"]) for a, b in segs[i:i + g]]
        if isinstance(sc["captions"], str):
            sc["captions"] = [sc["captions"]]
        if len(sc["captions"]) != g:
            raise SystemExit(f"scene {sc['kind']} has {len(sc['captions'])} captions for {g} chunks")
        i += g
    for a, b in zip(scenes, scenes[1:]):
        a["end"] = b["start"]
    scenes[0]["start_scene"] = 0.0
    tail = reel.get("tail", 1.6)
    scenes[-1]["end"] = dur + tail
    return dur + tail


# ---------------------------------------------------------------- audio
SR = 44100


def synth_bed(total, cuts, impacts, bpm=96):
    n = int(total * SR)
    rng = np.random.default_rng(7)
    t = np.arange(n) / SR
    # road rumble: brown noise, lowpassed
    brown = np.cumsum(rng.normal(0, 1, n))
    brown -= np.convolve(brown, np.ones(4410) / 4410, mode="same")
    brown /= np.max(np.abs(brown)) + 1e-9
    bed = brown * 0.10
    # pulse: soft sub kick + offbeat hat
    beat = 60 / bpm
    out = bed
    for k in range(int(total / beat) + 1):
        st = int(k * beat * SR)
        L = int(0.35 * SR)
        if st + L >= n:
            break
        tt = np.arange(L) / SR
        f = 45 + 70 * np.exp(-tt * 30)
        kick = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
        out[st:st + L] += kick * 0.32
        hs = st + int(beat / 2 * SR)
        HL = int(0.05 * SR)
        if hs + HL < n:
            hat = rng.normal(0, 1, HL) * np.exp(-np.arange(HL) / SR * 80)
            hat = np.diff(hat, prepend=0)
            out[hs:hs + HL] += hat * 0.035
    # pad drone (Am-ish)
    for fr, a in [(110, 0.025), (164.8, 0.018), (220, 0.012)]:
        out += np.sin(2 * np.pi * fr * t) * a * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t))
    # whooshes at cuts
    for c in cuts:
        L = int(0.6 * SR)
        st = int((c - 0.45) * SR)
        if st < 0 or st + L >= n:
            continue
        noise = rng.normal(0, 1, L)
        env = np.sin(np.linspace(0, np.pi, L)) ** 2
        sweep = np.cumsum(noise) - np.convolve(np.cumsum(noise), np.ones(60) / 60, mode="same")
        out[st:st + L] += sweep / (np.max(np.abs(sweep)) + 1e-9) * env * 0.22
    for c in impacts:
        L = int(1.2 * SR)
        st = int(c * SR)
        if st + L >= n:
            continue
        tt = np.arange(L) / SR
        boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-tt * 12)) * tt) * np.exp(-tt * 3.5)
        out[st:st + L] += boom * 0.6
    fade = np.ones(n)
    fl = int(0.8 * SR)
    fade[-fl:] = np.linspace(1, 0, fl)
    out *= fade
    out /= np.max(np.abs(out)) + 1e-9
    return (out * 0.9 * 32767).astype(np.int16)


def write_wav(path, data):
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# ---------------------------------------------------------------- main
def render(reel_id, audio, out):
    reel = REELS[reel_id]
    total = assign_timing(reel, audio)
    scenes = reel["scenes"]
    for sc in scenes:
        print(f"{sc['start']:6.2f}-{sc['end']:6.2f} {sc['kind']:9s} {sc['captions']}")
    tmp = Path(out).with_suffix("")
    video_tmp = str(tmp) + "_v.mp4"
    bed_tmp = str(tmp) + "_bed.wav"
    cuts = [sc["start"] for sc in scenes[1:]]
    impacts = [sc["start"] for sc in scenes if sc.get("impact")]
    write_wav(bed_tmp, synth_bed(total, cuts, impacts))

    nframes = int(total * FPS)
    proc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                             "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                             "-pix_fmt", "yuv420p", video_tmp], stdin=subprocess.PIPE)
    si = 0
    for fi in range(nframes):
        t = fi / FPS
        while si < len(scenes) - 1 and t >= scenes[si]["end"]:
            si += 1
        sc = scenes[si]
        start = 0.0 if si == 0 else sc["start"]
        lt, dur = t - start, sc["end"] - start
        im = Image.new("RGBA", (W, H), (0, 0, 0, 255))
        SCENES[sc["kind"]](im, sc, t, lt, dur)
        im.alpha_composite(VIGNETTE)
        if t >= sc["start"] - 0.15:
            draw_caption(im, sc, t)
        # progress bar on top
        d = ImageDraw.Draw(im)
        d.rectangle((0, 0, int(W * t / total), 10), fill=ORANGE)
        # fade-in from black
        if t < 0.25:
            im.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(255 * (1 - t / 0.25)))))
        proc.stdin.write(im.convert("RGB").tobytes())
        if fi % 90 == 0:
            print(f"frame {fi}/{nframes}", flush=True)
    proc.stdin.close()
    proc.wait()

    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", video_tmp, "-i", audio, "-i", bed_tmp, "-filter_complex",
                    "[1:a]aresample=44100,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,"
                    "equalizer=f=3000:t=q:w=1:g=2,apad,asplit[v1][v2];"
                    "[2:a]volume=0.22[b];[b][v2]sidechaincompress=threshold=0.05:ratio=6:release=300[bd];"
                    "[bd][v1]amix=inputs=2:weights='1 1':normalize=0:duration=first,"
                    "loudnorm=I=-14:TP=-1.5:LRA=9,apad[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                    "-ac", "2", "-movflags", "+faststart", "-t", f"{nframes / FPS:.3f}", out], check=True)
    Path(video_tmp).unlink()
    Path(bed_tmp).unlink()
    print("wrote", out)


if __name__ == "__main__":
    render(sys.argv[1], sys.argv[2], sys.argv[3])
