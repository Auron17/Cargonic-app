"""Kuzov turlari uchun yon tomondan yuk mashinasi rasmlari (assets/trucks/*.png).
Ishga tushirish: python3 scripts/draw-trucks.py — natija shaffof fonli PNG, ilovada profil kartasida."""
from PIL import Image, ImageDraw, ImageFilter
import os

SS = 4                      # supersampling (silliq chiziqlar uchun)
W, H = 760, 330             # yakuniy o'lcham
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'trucks')


def s(v):
    return int(round(v * SS))


def box(d, x0, y0, x1, y1, r, fill, outline=None, width=0):
    d.rounded_rectangle([s(x0), s(y0), s(x1), s(y1)], radius=s(r), fill=fill,
                        outline=outline, width=s(width) if width else 0)


def vgrad(img, x0, y0, x1, y1, top, bottom, r=0):
    """Vertikal gradient bilan to'ldirilgan yumaloq to'rtburchak"""
    w, h = s(x1) - s(x0), s(y1) - s(y0)
    g = Image.new('RGBA', (w, h))
    gd = ImageDraw.Draw(g)
    for i in range(h):
        t = i / max(h - 1, 1)
        c = tuple(int(top[k] + (bottom[k] - top[k]) * t) for k in range(4))
        gd.line([(0, i), (w, i)], fill=c)
    m = Image.new('L', (w, h), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, w - 1, h - 1], radius=s(r), fill=255)
    img.paste(g, (s(x0), s(y0)), m)


def wheel(d, cx, cy, r=34):
    d.ellipse([s(cx - r), s(cy - r), s(cx + r), s(cy + r)], fill=(28, 31, 36, 255))
    d.ellipse([s(cx - r * 0.58), s(cy - r * 0.58), s(cx + r * 0.58), s(cy + r * 0.58)], fill=(150, 158, 168, 255))
    d.ellipse([s(cx - r * 0.42), s(cy - r * 0.42), s(cx + r * 0.42), s(cy + r * 0.42)], fill=(196, 202, 210, 255))
    d.ellipse([s(cx - r * 0.14), s(cy - r * 0.14), s(cx + r * 0.14), s(cy + r * 0.14)], fill=(110, 116, 125, 255))


def shadow(img):
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([s(40), s(282), s(W + 200), s(312)], fill=(0, 0, 0, 70))
    return Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(s(8))), img)


def cab(img, d):
    """Kabina (chapda, old tomoni chapga qaragan)"""
    # kabina tanasi
    vgrad(img, 40, 70, 200, 262, (250, 251, 253, 255), (214, 219, 226, 255), r=22)
    # old oyna
    pts = [(56, 92), (118, 84), (118, 150), (50, 156)]
    d.polygon([(s(x), s(y)) for x, y in pts], fill=(70, 96, 128, 255))
    d.polygon([(s(x), s(y)) for x, y in [(60, 96), (92, 92), (70, 150), (54, 152)]], fill=(120, 150, 185, 255))
    # yon oyna
    box(d, 128, 88, 186, 148, 8, (70, 96, 128, 255))
    box(d, 134, 94, 160, 142, 6, (110, 140, 175, 255))
    # eshik chizig'i va dastagi
    d.line([s(124), s(84), s(124), s(250)], fill=(176, 183, 192, 255), width=s(2))
    box(d, 168, 166, 184, 172, 2, (150, 158, 168, 255))
    # oyna ko'zgusi
    box(d, 30, 98, 40, 140, 3, (40, 44, 50, 255))
    # bamper, fara
    box(d, 34, 236, 120, 262, 6, (60, 66, 74, 255))
    box(d, 40, 214, 70, 228, 5, (255, 214, 102, 255))
    # pog'ona
    box(d, 132, 226, 186, 236, 3, (120, 128, 138, 255))


def chassis(d, x1):
    box(d, 180, 236, x1, 256, 4, (52, 57, 64, 255))


def finish(img, name):
    img = shadow(img)
    img = img.resize((W, H), Image.LANCZOS)
    img.save(os.path.join(OUT, name + '.png'))


def base(body_end=W + 140):
    img = Image.new('RGBA', (s(W + 40), s(H)), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def wheels(d):
    for cx in (110, 470, 556, 642):
        wheel(d, cx, 262)


def tent():
    img, d = base()
    chassis(d, W + 40)
    # tent: tepasi yumaloq brezent, burmalar va pastida arqon
    vgrad(img, 208, 50, W + 60, 236, (222, 229, 238, 255), (186, 196, 210, 255), r=34)
    folds = Image.new('RGBA', img.size, (0, 0, 0, 0))
    fd = ImageDraw.Draw(folds)
    for i, x in enumerate(range(208, W + 40, 34)):
        if i % 2:
            fd.rectangle([s(x), s(62), s(x + 34), s(214)], fill=(30, 50, 80, 16))
    img.alpha_composite(folds)
    for x in range(276, W + 40, 102):
        d.line([s(x), s(58), s(x), s(222)], fill=(150, 162, 178, 255), width=s(4))
    d.line([s(214), s(206), s(W + 60), s(206)], fill=(140, 152, 168, 255), width=s(3))
    box(d, 208, 222, W + 60, 236, 4, (120, 128, 138, 255))
    cab(img, d); wheels(d); finish(img, 'tent')


def reefer(name, unit):
    img, d = base()
    chassis(d, W + 40)
    vgrad(img, 208, 40, W + 60, 236, (255, 255, 255, 255), (222, 227, 234, 255), r=8)
    for x in range(300, W + 40, 110):
        d.line([s(x), s(46), s(x), s(230)], fill=(208, 214, 222, 255), width=s(2))
    box(d, 208, 40, W + 60, 52, 6, (190, 198, 208, 255))
    if unit:
        # sovutgich bloki (old tomonda)
        box(d, 196, 58, 222, 138, 6, (90, 98, 110, 255))
        for y in range(70, 130, 12):
            d.line([s(200), s(y), s(218), s(y)], fill=(140, 150, 162, 255), width=s(2))
        # qor belgisi
        cx, cy = 470, 136
        for dx, dy in ((0, 26), (22, 13), (22, -13)):
            d.line([s(cx - dx), s(cy - dy), s(cx + dx), s(cy + dy)], fill=(84, 140, 214, 255), width=s(5))
    cab(img, d); wheels(d); finish(img, name)


def flatbed():
    img, d = base()
    chassis(d, W + 40)
    box(d, 208, 200, W + 60, 232, 4, (120, 128, 138, 255))
    box(d, 208, 168, W + 60, 204, 4, (226, 231, 238, 255))
    for x in range(260, W + 40, 90):
        d.line([s(x), s(170), s(x), s(202)], fill=(186, 194, 204, 255), width=s(3))
    # old to'siq
    box(d, 204, 110, 220, 204, 4, (90, 98, 110, 255))
    cab(img, d); wheels(d); finish(img, 'flatbed')


def tipper():
    img, d = base()
    chassis(d, W + 40)
    # ag'darma kuzov: past, old tomoni qiya, ustki qirrasi qalin
    pts = [(214, 108), (W + 60, 108), (W + 60, 232), (246, 232)]
    d.polygon([(s(x), s(y)) for x, y in pts], fill=(208, 214, 223, 255))
    d.polygon([(s(x), s(y)) for x, y in [(210, 100), (W + 60, 100), (W + 60, 116), (213, 116)]],
              fill=(150, 160, 172, 255))
    for x in range(290, W + 40, 76):
        d.line([s(x), s(116), s(x), s(232)], fill=(176, 186, 198, 255), width=s(5))
    # gidravlik silindr
    d.line([s(236), s(236), s(268), s(150)], fill=(70, 76, 84, 255), width=s(9))
    cab(img, d); wheels(d); finish(img, 'tipper')


def container():
    img, d = base()
    chassis(d, W + 40)
    box(d, 208, 222, W + 60, 236, 3, (90, 98, 110, 255))
    vgrad(img, 210, 46, W + 60, 222, (226, 120, 62, 255), (196, 92, 44, 255), r=4)
    for x in range(222, W + 50, 18):
        d.line([s(x), s(54), s(x), s(214)], fill=(176, 80, 38, 255), width=s(3))
    box(d, 210, 46, W + 60, 56, 2, (170, 74, 34, 255))
    box(d, 210, 212, W + 60, 222, 2, (170, 74, 34, 255))
    cab(img, d); wheels(d); finish(img, 'container')


def tanker():
    img, d = base()
    chassis(d, W + 40)
    # silindr sisterna: och kulrang, halqalar va lyuk
    vgrad(img, 214, 86, W + 50, 228, (214, 222, 232, 255), (168, 180, 196, 255), r=70)
    for x in (310, 430, 550, 670):
        d.line([s(x), s(96), s(x), s(218)], fill=(140, 154, 170, 255), width=s(5))
    box(d, 214, 148, W + 50, 162, 2, (150, 162, 176, 90))
    d.ellipse([s(430), s(70), s(478), s(96)], fill=(90, 98, 110, 255))
    d.ellipse([s(438), s(76), s(470), s(92)], fill=(176, 186, 198, 255))
    cab(img, d); wheels(d); finish(img, 'tanker')


def manipulator():
    img, d = base()
    chassis(d, W + 40)
    # bortli platforma
    box(d, 208, 196, W + 60, 232, 4, (120, 128, 138, 255))
    box(d, 208, 164, W + 60, 200, 4, (226, 231, 238, 255))
    for x in range(300, W + 40, 90):
        d.line([s(x), s(166), s(x), s(198)], fill=(186, 194, 204, 255), width=s(3))
    box(d, 204, 118, 220, 200, 4, (90, 98, 110, 255))
    # kran: kabina orqasida ustun va bukilgan o'q
    box(d, 226, 70, 258, 200, 6, (232, 140, 48, 255))
    d.line([s(242), s(78), s(430), s(52)], fill=(232, 140, 48, 255), width=s(16))
    d.line([s(430), s(52), s(560), s(118)], fill=(210, 118, 36, 255), width=s(12))
    d.line([s(560), s(118), s(560), s(164)], fill=(90, 98, 110, 255), width=s(4))
    cab(img, d); wheels(d); finish(img, 'manipulator')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    tent(); reefer('refrigerator', True); reefer('isothermal', False)
    flatbed(); tipper(); container(); tanker(); manipulator()
    print('ok')
