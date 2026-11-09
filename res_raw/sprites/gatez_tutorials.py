"""
Generates the tooltip tutorial images (res/ui/building_tutorials) of the Gatez buildings drawn by
gatez_art.py: a small circuit on the green wires-layer grid used by the other tutorials, with the
values on the pins.

    python3 res_raw/sprites/gatez_tutorials.py [--out=DIR]

Run gatez_art.py first: the building sprites are read from res_raw/sprites.
"""

import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
SPRITES = HERE
OUT = os.path.join(HERE, "..", "..", "res", "ui", "building_tutorials")
FONT = os.path.join(HERE, "..", "..", "res", "fonts", "GameFont.woff2")

SIZE = 600
TILE = 100
SS = 2

BACKGROUND = (124, 168, 159, 255)
GRID = (115, 157, 149, 255)
WIRE_ON = (97, 239, 111, 255)
WIRE_OFF = (111, 204, 135, 255)
WIRE_EDGE = (70, 120, 95, 255)
OUTLINE = (100, 102, 110, 255)
INPUT_LABEL = (74, 144, 226, 255)
OUTPUT_LABEL = (102, 187, 106, 255)


# Center of the output squares, in tiles from the top of the building (sprite y = 47 of 192, extruded)
SQUARE_Y = 47 / 192 * (1 + 4 / 32) - 2 / 32


def sprite(rel):
    return Image.open(os.path.join(SPRITES, rel)).convert("RGBA")


class Scene:
    def __init__(self, offset=(0, 0)):
        self.img = Image.new("RGBA", (SIZE * SS, SIZE * SS), BACKGROUND)
        self.ox, self.oy = offset
        d = ImageDraw.Draw(self.img)
        for i in range(-1, SIZE // TILE + 2):
            x = (i * TILE + self.ox % TILE) * SS
            y = (i * TILE + self.oy % TILE) * SS
            d.line([(x, 0), (x, SIZE * SS)], fill=GRID, width=3 * SS)
            d.line([(0, y), (SIZE * SS, y)], fill=GRID, width=3 * SS)
        self.wires = []
        self.texts = []

    def p(self, x, y):
        """Tile coordinates -> canvas pixels (scaled)"""
        return (int((x * TILE + self.ox) * SS), int((y * TILE + self.oy) * SS))

    def building(self, rel, tx, ty, w=1, h=1):
        # Like the game: 2 world px (of 32) of extrusion on every side, per tile
        ext = 2 / 32
        im = sprite(rel).resize((round(w * (1 + 2 * ext) * TILE * SS), round(h * (1 + 2 * ext) * TILE * SS)), Image.LANCZOS)
        self.img.alpha_composite(im, self.p(tx - ext * w, ty - ext * h))

    def wire(self, points, on):
        d = ImageDraw.Draw(self.img)
        pts = [self.p(x, y) for x, y in points]
        d.line(pts, fill=WIRE_EDGE, width=17 * SS, joint="curve")
        d.line(pts, fill=WIRE_ON if on else WIRE_OFF, width=12 * SS, joint="curve")
        for x, y in pts:
            r = 8 * SS
            d.ellipse((x - r, y - r, x + r, y + r), fill=WIRE_EDGE)
            r = 6 * SS
            d.ellipse((x - r, y - r, x + r, y + r), fill=WIRE_ON if on else WIRE_OFF)

    def value(self, x, y, on):
        """The 0/1 the game writes on output squares"""
        font = ImageFont.truetype(FONT, 26 * SS)
        d = ImageDraw.Draw(self.img)
        d.text(
            self.p(x, y), "1" if on else "0", font=font, anchor="mm", fill=(255, 255, 255, 255),
            stroke_width=3 * SS, stroke_fill=OUTLINE,
        )

    def label(self, tx, ty, text, color):
        """The A/B/Y circles the game draws on puzzle inputs and outputs"""
        font = ImageFont.truetype(FONT, (20 if len(text) == 1 else 15) * SS)
        d = ImageDraw.Draw(self.img)
        cx, cy = self.p(tx + 0.1, ty + 0.1)
        r = 15 * SS
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=color)
        d.text((cx, cy), text, font=font, anchor="mm", fill=(255, 255, 255, 255))

    # --- puzzle inputs / outputs ---

    def signal(self, tx, ty, on, name):
        self.building("buildings/programmable_signal.png" if not on else "wires/programmable_signal_on.png", tx, ty)
        self.value(tx + 0.5, ty + SQUARE_Y, on)
        self.label(tx, ty, name, INPUT_LABEL)

    def acceptor(self, tx, ty, on, name):
        self.building("buildings/programmable_acceptor.png", tx, ty)
        if on:
            self.building("wires/programmable_acceptor_on.png", tx, ty)
        self.label(tx, ty, name, OUTPUT_LABEL)

    def save(self, name, out_dir):
        path = os.path.join(out_dir, name)
        self.img.resize((SIZE, SIZE), Image.LANCZOS).convert("RGB").save(path)
        print("wrote", path)


def two_input_gate(sprite_rel, a, b, result, out_dir, name):
    sc = Scene((50, 0))
    sc.wire([(0.5, 4), (0.5, 3.5), (2, 3.5)], a)
    sc.wire([(4.5, 4), (4.5, 3.5), (3, 3.5)], b)
    sc.wire([(2.5, 3), (2.5, 2)], result)
    sc.signal(0, 4, a, "A")
    sc.signal(4, 4, b, "B")
    sc.building(sprite_rel, 2, 3)
    sc.value(2.5, 3 + SQUARE_Y, result)
    sc.acceptor(2, 1, result, "Y")
    sc.save(name, out_dir)


def not_gate(out_dir):
    sc = Scene((50, 0))
    sc.wire([(2.5, 4), (2.5, 3.5)], False)
    sc.wire([(2.5, 2.5), (2.5, 2)], True)
    sc.signal(2, 4, False, "A")
    sc.building("buildings/logic_gate-not.png", 2, 2.5)
    sc.value(2.5, 2.5 + SQUARE_Y, True)
    sc.acceptor(2, 1, True, "Y")
    sc.save("logic_gate-not.png", out_dir)


def four_input(sprite_rel, values, result, out_dir, name):
    sc = Scene((0, 0))
    for i, v in enumerate(values):
        sc.wire([(1.5 + i, 4), (1.5 + i, 3.5)], v)
        sc.signal(1 + i, 4, v, "ABCD"[i])
    sc.wire([(1.5, 2.5), (1.5, 2)], result)
    sc.building(sprite_rel, 1, 2.5, w=4)
    sc.value(1.5, 2.5 + SQUARE_Y, result)
    sc.acceptor(1, 1, result, "Y")
    sc.save(name, out_dir)


def memory(sprite_rel, inputs, q, out_dir, name, clock=None):
    sc = Scene((0, 0))
    names = list(inputs.keys())
    for i, label in enumerate(names):
        v = inputs[label]
        sc.wire([(2.5 + i, 4), (2.5 + i, 3.5)], v)
        sc.signal(2 + i, 4, v, label)
    if clock is not None:
        pin_y = 3
        sc.wire([(5, 4), (5, pin_y), (4, pin_y)], clock)
        sc.signal(4.5, 4, clock, "C")
    sc.wire([(2.5, 2.5), (2.5, 2)], q)
    sc.wire([(3.5, 2.5), (3.5, 2)], not q)
    sc.building(sprite_rel, 2, 2.5, w=2)
    sc.value(2.5, 2.5 + SQUARE_Y, q)
    sc.value(3.5, 2.5 + SQUARE_Y, not q)
    sc.acceptor(2, 1, q, "Q")
    sc.acceptor(3, 1, not q, "Q'")
    sc.save(name, out_dir)


def inputs_and_outputs(out_dir, name):
    sc = Scene((50, 0))
    sc.wire([(1.5, 4), (1.5, 2)], True)
    sc.wire([(3.5, 4), (3.5, 2)], False)
    sc.signal(1, 4, True, "A")
    sc.signal(3, 4, False, "B")
    sc.acceptor(1, 1, True, "Y1")
    sc.acceptor(3, 1, False, "Y2")
    sc.save(name, out_dir)


def main():
    out_dir = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--out=")), OUT)
    os.makedirs(out_dir, exist_ok=True)
    two_input_gate("buildings/logic_gate-nand.png", True, True, False, out_dir, "logic_gate-nand.png")
    two_input_gate("buildings/logic_gate-nor.png", False, False, True, out_dir, "logic_gate-nor.png")
    not_gate(out_dir)
    four_input("buildings/four_input_logic_gate.png", [True, True, True, True], True, out_dir, "four_input_logic_gate-and.png")
    four_input("buildings/four_input_logic_gate-or.png", [False, False, True, False], True, out_dir, "four_input_logic_gate-or.png")
    memory("buildings/memory.png", {"S": True, "R": False}, True, out_dir, "memory.png")
    memory("buildings/memory-jk.png", {"J": True, "K": False}, True, out_dir, "memory-jk.png", clock=True)
    inputs_and_outputs(out_dir, "programmable_signal.png")
    inputs_and_outputs(out_dir, "programmable_acceptor.png")


if __name__ == "__main__":
    main()
