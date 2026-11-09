"""
Generates the Gatez-specific building sprites in the same flat style as the upstream ones
(dark outline, light fill, hard drop shadow, pins at the tile edges).

    python3 res_raw/sprites/gatez_art.py                       # writes the sprites into res_raw/sprites/
    python3 res_raw/sprites/gatez_art.py --out=/tmp/x --preview  # somewhere else, plus a contact sheet

Requires Pillow. Run create_blueprint_previews.py (or this script, which calls the same code)
to refresh the blueprint versions. Toolbar icons and tutorial images are separate (res/ui).

Coordinates below are in "tile pixels": one tile is 192 px wide, like the shipped sprites.
Everything is drawn SS times bigger and downsampled, for anti-aliasing.
"""

import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "..", "..", "res", "fonts", "GameFont.woff2")

SS = 4
T = 192

# Palette (sampled from the upstream sprites)
OUTLINE = (100, 102, 110, 255)
FILL = (222, 225, 234, 255)
PIN = (121, 123, 133, 255)
GLYPH = (145, 148, 158, 255)
DARK_FILL = (145, 148, 158, 255)
BLUE = (128, 179, 255, 255)
BLUE_OUTLINE = (83, 93, 108, 255)
GREEN = (102, 187, 106, 255)
GREEN_LIGHT = (165, 230, 140, 255)
LAMP_ON = (255, 214, 79, 255)
LAMP_ON_LIGHT = (255, 240, 180, 255)
SHADOW_ALPHA = 18
SHADOW_OFFSET = 4
STROKE = 6


def s(v):
    return int(round(v * SS))


def pts(points):
    return [(s(x), s(y)) for x, y in points]


def bezier(p0, p1, p2, p3, steps=24):
    out = []
    for i in range(steps + 1):
        t = i / steps
        mt = 1 - t
        out.append(
            (
                mt ** 3 * p0[0] + 3 * mt ** 2 * t * p1[0] + 3 * mt * t ** 2 * p2[0] + t ** 3 * p3[0],
                mt ** 3 * p0[1] + 3 * mt ** 2 * t * p1[1] + 3 * mt * t ** 2 * p2[1] + t ** 3 * p3[1],
            )
        )
    return out


def arc(cx, cy, r, a0, a1, steps=24):
    return [
        (cx + r * math.cos(math.radians(a0 + (a1 - a0) * i / steps)), cy + r * math.sin(math.radians(a0 + (a1 - a0) * i / steps)))
        for i in range(steps + 1)
    ]


def rounded_rect_path(x0, y0, x1, y1, r_top, r_bottom=None):
    """Closed path of a rectangle with different top/bottom corner radii"""
    if r_bottom is None:
        r_bottom = r_top
    path = []
    path += arc(x1 - r_top, y0 + r_top, r_top, -90, 0)
    path += arc(x1 - r_bottom, y1 - r_bottom, r_bottom, 0, 90)
    path += arc(x0 + r_bottom, y1 - r_bottom, r_bottom, 90, 180)
    path += arc(x0 + r_top, y0 + r_top, r_top, 180, 270)
    return path


class Sprite:
    def __init__(self, w_tiles=1, h_tiles=1):
        self.w = T * w_tiles
        self.h = T * h_tiles
        self.img = Image.new("RGBA", (s(self.w), s(self.h)), (0, 0, 0, 0))

    def layer(self):
        layer = Image.new("RGBA", self.img.size, (0, 0, 0, 0))
        return layer, ImageDraw.Draw(layer)

    def add(self, layer, shadow=True):
        """Composites a layer, casting the hard drop shadow of the upstream sprites"""
        if shadow:
            alpha = layer.getchannel("A").point(lambda a: a * SHADOW_ALPHA // 255)
            shadow_layer = Image.new("RGBA", layer.size, (0, 0, 0, 0))
            shadow_layer.putalpha(alpha)
            shifted = Image.new("RGBA", layer.size, (0, 0, 0, 0))
            shifted.paste(shadow_layer, (s(SHADOW_OFFSET), s(SHADOW_OFFSET)))
            self.img.alpha_composite(shifted)
        self.img.alpha_composite(layer)

    # --- primitives, each one its own layer ---

    def shape(self, path, fill=FILL, outline=OUTLINE, stroke=STROKE, shadow=True):
        layer, d = self.layer()
        d.polygon(pts(path), fill=fill)
        if stroke:
            d.line(pts(path + [path[0], path[1]]), fill=outline, width=s(stroke), joint="curve")
        self.add(layer, shadow)

    def rrect(self, x0, y0, x1, y1, r, fill=FILL, outline=OUTLINE, stroke=STROKE, shadow=True):
        layer, d = self.layer()
        d.rounded_rectangle((s(x0), s(y0), s(x1), s(y1)), radius=s(r), fill=outline)
        d.rounded_rectangle(
            (s(x0 + stroke), s(y0 + stroke), s(x1 - stroke), s(y1 - stroke)),
            radius=s(max(0, r - stroke)),
            fill=fill,
        )
        self.add(layer, shadow)

    def circle(self, cx, cy, r, fill=FILL, outline=OUTLINE, stroke=STROKE, shadow=True):
        layer, d = self.layer()
        d.ellipse((s(cx - r), s(cy - r), s(cx + r), s(cy + r)), fill=outline)
        r2 = r - stroke
        d.ellipse((s(cx - r2), s(cy - r2), s(cx + r2), s(cy + r2)), fill=fill)
        self.add(layer, shadow)

    def text(self, cx, cy, text, size, fill=GLYPH, outline=OUTLINE, stroke=3, shadow=True, bold=2):
        """Centered text. `bold` thickens the regular game font with a same-colored stroke"""
        font = ImageFont.truetype(FONT, s(size))
        layer, d = self.layer()
        kwargs = dict(font=font, anchor="mm")
        if stroke:
            d.text((s(cx), s(cy)), text, fill=outline, stroke_width=s(bold + stroke), stroke_fill=outline, **kwargs)
        d.text((s(cx), s(cy)), text, fill=fill, stroke_width=s(bold), stroke_fill=fill, **kwargs)
        self.add(layer, shadow)

    def overline(self, cx, y, width, fill=OUTLINE, thickness=4):
        layer, d = self.layer()
        d.rounded_rectangle(
            (s(cx - width / 2), s(y - thickness / 2), s(cx + width / 2), s(y + thickness / 2)),
            radius=s(thickness / 2),
            fill=fill,
        )
        self.add(layer, False)

    def bar(self, x0, y0, x1, y1, fill=PIN, outline=OUTLINE, stroke=4, shadow=True):
        """A straight connection (wire inside a building)"""
        self.rrect(x0, y0, x1, y1, min(abs(x1 - x0), abs(y1 - y0)) / 2, fill, outline, stroke, shadow)

    # --- pins (same look as the upstream logic gates / memory) ---

    def ejector_top(self, cx, tile_y=0):
        """Output pin at the top edge: a funnel, narrow at the edge"""
        y = tile_y * T
        self.shape([(cx - 14, y + 1), (cx + 14, y + 1), (cx + 17, y + 20), (cx - 17, y + 20)], fill=PIN, stroke=5)

    def ejector_right(self, cy, tile_x=0):
        x = (tile_x + 1) * T
        self.shape([(x - 1, cy - 14), (x - 1, cy + 14), (x - 20, cy + 17), (x - 20, cy - 17)], fill=PIN, stroke=5)

    def acceptor_bottom(self, cx, tile_y=0):
        """Input pin at the bottom edge: a foot, wide at the edge"""
        y = (tile_y + 1) * T
        self.shape([(cx - 17, y - 2), (cx + 17, y - 2), (cx + 13, y - 22), (cx - 13, y - 22)], fill=PIN, stroke=5)

    def acceptor_side(self, cy, side, reach=40):
        """Input pin at the left/right edge with a short stub towards the body"""
        if side == "left":
            self.bar(18, cy - 6, reach + 4, cy + 6)
            self.shape([(3, cy - 17), (24, cy - 12), (24, cy + 12), (3, cy + 17)], fill=PIN, stroke=5)
        else:
            self.bar(T - reach - 4, cy - 6, T - 18, cy + 6)
            self.shape([(T - 3, cy - 17), (T - 24, cy - 12), (T - 24, cy + 12), (T - 3, cy + 17)], fill=PIN, stroke=5)

    def acceptor_right(self, cy, tile_x=0, reach=36):
        x = (tile_x + 1) * T
        self.bar(x - reach - 4, cy - 6, x - 18, cy + 6)
        self.shape([(x - 3, cy - 17), (x - 24, cy - 12), (x - 24, cy + 12), (x - 3, cy + 17)], fill=PIN, stroke=5)

    def arrow_up(self, cx, y_tip, y_base, fill=PIN):
        """Input arrow going into a body (memory style)"""
        self.shape(
            [
                (cx - 7, y_base),
                (cx - 7, y_tip + 20),
                (cx - 19, y_tip + 20),
                (cx, y_tip),
                (cx + 19, y_tip + 20),
                (cx + 7, y_tip + 20),
                (cx + 7, y_base),
            ],
            fill=fill,
            stroke=4,
        )

    def output_square(self, cx, tile_y=0, fill=FILL):
        y = tile_y * T
        self.rrect(cx - 34, y + 15, cx + 34, y + 81, 9, fill=fill)

    def save(self, path):
        out = self.img.resize((self.w, self.h), Image.LANCZOS)
        out.save(path)
        return out


# ---------------------------------------------------------------------------------------------
# Logic gates (1x1): output on top, inputs left and right (NOT: input at the bottom)
# Inverting gates (NOT, NAND, NOR) have a dark body and an inversion bubble as their output.
# ---------------------------------------------------------------------------------------------

AND_BODY = rounded_rect_path(35, 47, 157, 155, 34, 9)


def or_body_path():
    left = bezier((64, 58), (44, 72), (35, 110), (34, 154), 20)
    bottom = bezier((34, 154), (70, 130), (122, 130), (158, 154), 24)
    right = bezier((158, 154), (157, 110), (148, 72), (128, 58), 20)
    top = bezier((128, 58), (110, 50), (82, 50), (64, 58), 10)
    return left + bottom[1:] + right[1:] + top[1:-1]


def gate(body_path, symbol, inverted, symbol_size=58, symbol_y=118, plus=False, body_stroke=STROKE):
    sp = Sprite()
    sp.acceptor_side(100, "left")
    sp.acceptor_side(100, "right")
    sp.ejector_top(96)
    sp.shape(body_path, fill=DARK_FILL if inverted else FILL, stroke=body_stroke)
    if inverted:
        sp.circle(96, 47, 32)
    else:
        sp.output_square(96)
    glyph_fill = FILL if inverted else GLYPH
    if plus:
        draw_plus(sp, 96, symbol_y, 38, glyph_fill)
    else:
        sp.text(96, symbol_y, symbol, symbol_size, fill=glyph_fill, stroke=3)
    return sp


def draw_plus(sp, cx, cy, size, fill):
    a = size / 2
    t = size / 6.5
    path = [
        (cx - t, cy - a), (cx + t, cy - a), (cx + t, cy - t), (cx + a, cy - t), (cx + a, cy + t),
        (cx + t, cy + t), (cx + t, cy + a), (cx - t, cy + a), (cx - t, cy + t), (cx - a, cy + t),
        (cx - a, cy - t), (cx - t, cy - t),
    ]
    sp.shape(path, fill=fill, stroke=5)


def nand():
    return gate(AND_BODY, "&", True)


def nor():
    return gate(or_body_path(), "+", True, plus=True, symbol_y=106, body_stroke=5)


def not_gate():
    sp = Sprite()
    sp.acceptor_bottom(96)
    sp.ejector_top(96)
    sp.shape(
        [(96, 60), (164, 160)] + arc(158, 160, 9, 0, 90, 8)[1:] + [(34, 169)] + arc(34, 160, 9, 90, 180, 8) + [(28, 160)],
        fill=DARK_FILL,
    )
    sp.circle(96, 47, 32)
    return sp


# ---------------------------------------------------------------------------------------------
# 4-input AND / OR (4x1): output on top of the first tile, the 4 inputs at the bottom
# ---------------------------------------------------------------------------------------------


def four_input(kind):
    w = 4 * T
    sp = Sprite(4, 1)
    sp.ejector_top(96)
    for i in range(4):
        sp.acceptor_bottom(96 + i * T)

    if kind == "and":
        body = rounded_rect_path(35, 47, w - 35, 160, 30, 12)
    else:
        # Concave bottom, like the 2-input OR
        body = (
            arc(w - 65, 77, 30, -90, 0)
            + [(w - 35, 160)]
            + bezier((w - 35, 160), (w * 0.75, 136), (w * 0.25, 136), (35, 160), 40)[1:]
            + arc(65, 77, 30, 180, 270)
        )
    sp.shape(body, stroke=5 if kind == "or" else STROKE)

    # Internal wiring: every input goes up into a collector bar that feeds the output
    bar_y = 104
    sp.bar(78, bar_y - 10, 96 + 3 * T + 18, bar_y + 10, fill=FILL, stroke=5)
    for i in range(4):
        sp.arrow_up(96 + i * T, bar_y + 14, 178)
    sp.bar(89, 74, 103, bar_y - 6)
    sp.output_square(96)

    # Big symbol in the free space above the bar
    symbol_x = 2.5 * T
    if kind == "and":
        sp.text(symbol_x, 66, "&", 64, stroke=3)
    else:
        draw_plus(sp, symbol_x, 68, 42, GLYPH)
    return sp


# ---------------------------------------------------------------------------------------------
# Memory (2x1, blue body like the upstream memory sprites), with pin labels
# ---------------------------------------------------------------------------------------------


def memory_body(sp, w):
    chamfer = 22
    path = [
        (35 + chamfer, 30), (w - 35 - chamfer, 30), (w - 35, 30 + chamfer), (w - 35, 162 - chamfer),
        (w - 35 - chamfer, 162), (35 + chamfer, 162), (35, 162 - chamfer), (35, 30 + chamfer),
    ]
    sp.shape(path, fill=BLUE, outline=BLUE_OUTLINE)


def label(sp, cx, cy, text, over=False, size=30):
    sp.text(cx, cy, text, size, fill=FILL, outline=BLUE_OUTLINE, stroke=3, bold=1)
    if over:
        sp.overline(cx, cy - size * 0.46, size * 0.6, fill=FILL, thickness=5)


def two_bit_memory(sp):
    """Shared layout: outputs on top, inputs at the bottom, the stored bit as a bar in between"""
    for i in range(2):
        sp.ejector_top(96 + i * T)
        sp.acceptor_bottom(96 + i * T)


def memory_inside(sp):
    bar_y = 106
    for i in range(2):
        cx = 96 + i * T
        sp.bar(cx - 7, 74, cx + 7, bar_y - 6)
    sp.bar(70, bar_y - 10, 2 * T - 70, bar_y + 10, fill=FILL, stroke=5)
    for i in range(2):
        cx = 96 + i * T
        sp.arrow_up(cx, bar_y + 14, 178)
        sp.output_square(cx)
    label(sp, 96 + 58, 52, "Q")
    label(sp, 96 + T - 58, 52, "Q", over=True)


def sr_latch():
    sp = Sprite(2, 1)
    two_bit_memory(sp)
    memory_body(sp, 2 * T)
    memory_inside(sp)
    label(sp, 96 + 46, 146, "S")
    label(sp, 96 + T - 46, 146, "R")
    return sp


def jk_flip_flop():
    sp = Sprite(2, 1)
    two_bit_memory(sp)
    sp.acceptor_right(146, 1, reach=40)
    memory_body(sp, 2 * T)
    memory_inside(sp)
    label(sp, 96 + 46, 146, "J")
    label(sp, 96 + T - 46, 146, "K")
    # Clock input: the edge-triggered triangle
    sp.shape([(2 * T - 37, 130), (2 * T - 37, 162 - 24), (2 * T - 37, 162 - 24)], fill=FILL, stroke=0, shadow=False)
    sp.shape([(2 * T - 38, 131), (2 * T - 38, 161), (2 * T - 60, 146)], fill=FILL, outline=BLUE_OUTLINE, stroke=4)
    return sp


# ---------------------------------------------------------------------------------------------
# Puzzle inputs and outputs (1x1). The game draws the A/B/... and Y labels on top-left.
# ---------------------------------------------------------------------------------------------


def programmable_signal(on):
    sp = Sprite()
    sp.ejector_top(96)
    sp.rrect(30, 40, 162, 170, 18)
    # The game writes the current value (0/1) on this square, like on the gates' outputs
    sp.output_square(96)
    # Toggle switch: knob left = 0, knob right = 1
    sp.rrect(50, 106, 142, 152, 23, fill=GREEN if on else GLYPH)
    sp.circle(119 if on else 73, 129, 19, fill=FILL)
    return sp


LAMP = (96, 96, 42)


def programmable_acceptor():
    sp = Sprite()
    sp.acceptor_bottom(96)
    sp.rrect(30, 22, 162, 170, 18)
    sp.arrow_up(96, 140, 176)
    cx, cy, r = LAMP
    sp.circle(cx, cy, r, fill=GLYPH)
    return sp


def programmable_acceptor_on():
    """Drawn by the game over the acceptor when it receives a 1: only the lit lamp"""
    sp = Sprite()
    cx, cy, r = LAMP
    layer, d = sp.layer()
    for rr, a in [(r + 20, 45), (r + 11, 90)]:
        d.ellipse((s(cx - rr), s(cy - rr), s(cx + rr), s(cy + rr)), fill=LAMP_ON[:3] + (a,))
    sp.add(layer, False)
    sp.circle(cx, cy, r, fill=LAMP_ON, shadow=False)
    sp.circle(cx - 13, cy - 13, 12, fill=LAMP_ON_LIGHT, stroke=0, shadow=False)
    return sp

# ---------------------------------------------------------------------------------------------
# Toolbar icons (res/ui/building_icons, 128x128, flat grey like the upstream icons)
# ---------------------------------------------------------------------------------------------

ICON = 128
ICON_FILL = (142, 145, 155, 255)
ICON_OUTLINE = (99, 101, 107, 255)
ICON_LIGHT = (222, 225, 234, 255)


def icon_canvas():
    img = Image.new("RGBA", (s(ICON), s(ICON)), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def icon_save(img, path):
    img.resize((ICON, ICON), Image.LANCZOS).save(path)


def icon_programmable_acceptor(path):
    img, d = icon_canvas()
    d.polygon(pts([(52, 98), (76, 98), (72, 124), (56, 124)]), fill=ICON_OUTLINE)
    d.rounded_rectangle((s(12), s(6), s(116), s(106)), radius=s(18), fill=ICON_OUTLINE)
    d.rounded_rectangle((s(20), s(14), s(108), s(98)), radius=s(11), fill=ICON_FILL)
    d.ellipse((s(34), s(26), s(94), s(86)), fill=ICON_OUTLINE)
    d.ellipse((s(42), s(34), s(86), s(78)), fill=ICON_LIGHT)
    icon_save(img, path)


def icon_four_input_logic_gate(path):
    img, d = icon_canvas()
    # One output on top of the first tile, four inputs at the bottom
    d.rounded_rectangle((s(18), s(6), s(36), s(36)), radius=s(5), fill=ICON_OUTLINE)
    for i in range(4):
        x = 21 + i * 28.5
        d.rounded_rectangle((s(x - 9), s(88), s(x + 9), s(122)), radius=s(5), fill=ICON_OUTLINE)
    d.rounded_rectangle((s(4), s(28), s(124), s(100)), radius=s(16), fill=ICON_OUTLINE)
    d.rounded_rectangle((s(12), s(36), s(116), s(92)), radius=s(9), fill=ICON_FILL)
    font = ImageFont.truetype(FONT, s(54))
    d.text((s(64), s(62)), "&", font=font, anchor="mm", fill=ICON_LIGHT, stroke_width=s(2), stroke_fill=ICON_LIGHT)
    icon_save(img, path)


ICONS = {
    "programmable_acceptor.png": icon_programmable_acceptor,
    "four_input_logic_gate.png": icon_four_input_logic_gate,
}


SPRITES = {
    "buildings/logic_gate-nand.png": nand,
    "buildings/logic_gate-nor.png": nor,
    "buildings/logic_gate-not.png": not_gate,
    "buildings/four_input_logic_gate.png": lambda: four_input("and"),
    "buildings/four_input_logic_gate-or.png": lambda: four_input("or"),
    "buildings/memory.png": sr_latch,
    "buildings/memory-jk.png": jk_flip_flop,
    "buildings/programmable_signal.png": lambda: programmable_signal(False),
    "wires/programmable_signal_on.png": lambda: programmable_signal(True),
    "buildings/programmable_acceptor.png": programmable_acceptor,
    "wires/programmable_acceptor_on.png": programmable_acceptor_on,
}


def main():
    only = [a for a in sys.argv[1:] if not a.startswith("--")]
    out_dir = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--out=")), HERE)
    generated = {}
    for rel, fn in SPRITES.items():
        if only and not any(o in rel for o in only):
            continue
        path = os.path.join(out_dir, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        generated[rel] = fn().save(path)
        print("wrote", rel)

    if not only:
        icon_dir = (
            os.path.join(HERE, "..", "..", "res", "ui", "building_icons")
            if out_dir == HERE
            else os.path.join(out_dir, "icons")
        )
        os.makedirs(icon_dir, exist_ok=True)
        for name, fn in ICONS.items():
            fn(os.path.join(icon_dir, name))
            print("wrote icon", name)

    if "--preview" in sys.argv:
        bg = (225, 228, 235, 255)
        width = 4 * T + 40
        height = sum(img.height + 20 for img in generated.values()) + 20
        sheet = Image.new("RGBA", (width * 2, height), bg)
        y = 20
        for rel, img in generated.items():
            sheet.alpha_composite(img, (20, y))
            small = img.resize((img.width // 4, img.height // 4), Image.LANCZOS)
            sheet.alpha_composite(small, (width + 20, y))
            y += img.height + 20
        sheet.save(os.path.join(out_dir, "preview.png"))
        print("preview:", os.path.join(out_dir, "preview.png"))


if __name__ == "__main__":
    main()
