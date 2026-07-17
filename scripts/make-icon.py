#!/usr/bin/env python3
"""Generate a flat Pokéball icon for Android mipmaps + web favicon."""
import os
from PIL import Image, ImageDraw, ImageChops, ImageFilter

RED = (239, 68, 68, 255)      # #EF4444
WHITE = (255, 255, 255, 255)
BLACK = (23, 23, 23, 255)     # #171717

SRC = 1024  # master resolution


def circle_mask(img_size, cx, cy, r):
    m = Image.new('L', img_size, 0)
    ImageDraw.Draw(m).ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    return m


def make_ball(size):
    """Draw a Pokéball on a transparent `size`x`size` canvas (ball radius ~0.46*size)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = cy = size // 2
    R = int(size * 0.46)
    ow = max(2, int(R * 0.045))        # outline width
    Ri = R - ow                        # face radius
    band = int(Ri * 0.16)              # center belt height
    btn_r = int(Ri * 0.30)             # center button outer radius
    inner = int(btn_r * 0.60)          # button white core radius

    # 1) outer black outline circle
    d.ellipse([cx - R, cy - R, cx + R, cy + R], fill=BLACK)

    # 2) two-tone face (red top, white bottom) within radius Ri
    face = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(face).ellipse([cx - Ri, cy - Ri, cx + Ri, cy + Ri], fill=RED)
    white_disk = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(white_disk).ellipse([cx - Ri, cy - Ri, cx + Ri, cy + Ri], fill=WHITE)
    cm = circle_mask((size, size), cx, cy, Ri)
    bm = Image.new('L', (size, size), 0)
    ImageDraw.Draw(bm).rectangle([0, cy, size, size], fill=255)
    bot = ImageChops.multiply(cm, bm)
    face.paste(white_disk, (0, 0), bot)

    # 3) black center belt
    belt = Image.new('L', (size, size), 0)
    ImageDraw.Draw(belt).rectangle([cx - Ri, cy - band // 2, cx + Ri, cy + band // 2], fill=255)
    belt = ImageChops.multiply(belt, cm)
    face.paste(Image.new('RGBA', (size, size), BLACK), (0, 0), belt)

    # 4) center button (black ring + white core)
    ImageDraw.Draw(face).ellipse([cx - btn_r, cy - btn_r, cx + btn_r, cy + btn_r], fill=BLACK)
    ImageDraw.Draw(face).ellipse([cx - inner, cy - inner, cx + inner, cy + inner], fill=WHITE)

    # 5) composite face over outline (leaves black ring between Ri and R)
    img.paste(face, (0, 0), cm)
    return img


def make_legacy(size):
    """White rounded-rect background + smaller Pokéball centered."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(img).rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.18), fill=WHITE)
    bsz = int(size * 0.70)
    ball = master.resize((bsz, bsz), Image.LANCZOS)
    off = int((size - bsz) / 2)
    img.paste(ball, (off, off), ball)
    return img


def main():
    root = r'C:\Users\28166\Desktop\poke\android\app\src\main\res'

    # adaptive foreground sizes (full ball on transparent)
    fg_sizes = {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}
    # legacy icon sizes (white rounded bg + ball)
    lg_sizes = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}

    for dens, T in fg_sizes.items():
        d = os.path.join(root, f'mipmap-{dens}')
        fg = master.resize((T, T), Image.LANCZOS)
        fg.save(os.path.join(d, 'ic_launcher_foreground.png'), optimize=True)
        print('wrote', os.path.join(d, 'ic_launcher_foreground.png'), T)

    for dens, S in lg_sizes.items():
        d = os.path.join(root, f'mipmap-{dens}')
        leg = make_legacy(S)
        leg.save(os.path.join(d, 'ic_launcher.png'), optimize=True)
        leg.save(os.path.join(d, 'ic_launcher_round.png'), optimize=True)
        print('wrote', os.path.join(d, 'ic_launcher.png / _round.png'), S)

    # also a high-res web favicon png in public
    pub = r'C:\Users\28166\Desktop\poke\public'
    os.makedirs(pub, exist_ok=True)
    master.resize((512, 512), Image.LANCZOS).save(os.path.join(pub, 'pokeball-512.png'), optimize=True)
    print('wrote public/pokeball-512.png')


if __name__ == '__main__':
    master = make_ball(SRC)
    main()
