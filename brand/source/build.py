"""Build the PointHacker "Heading Up" logo kit masters.

Usage: venv/bin/python -I kit-src/build.py <font.woff2> <out-dir>
"""
import math
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FONT, OUT = Path(sys.argv[1]), Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

EMERALD = "#059669"      # Tailwind emerald-600, the site's one accent
EMERALD_DARK = "#34D399"  # emerald-400, the accent on dark grounds
INK = "#09090B"          # zinc-950

# ---------------------------------------------------------------- symbol ---
# Construction (256 grid): stem 56 wide x 200 tall; bowl = 136-tall D whose
# right side is a 68-radius semicircle. Arrow is a navigation chevron aimed
# at 45 degrees, centred in the counter. The whole P is nudged so its ink box
# sits centred horizontally.


def arrow(cx, cy, s, deg=45, notch=0.42, wing=0.72, foot=0.78):
    pts = [(0, -1), (wing, foot), (0, notch), (-wing, foot)]
    a = math.radians(deg)
    out = [(cx + s * (x * math.cos(a) - y * math.sin(a)),
            cy + s * (x * math.sin(a) + y * math.cos(a))) for x, y in pts]
    return "M" + " L".join(f"{x:.2f} {y:.2f}" for x, y in out) + " Z"


def p_path(stem=56, top=28, bottom=228, bowl_h=136, x0=50, r_over=1.5):
    """P outline. The bowl's round side overshoots the flat top/bottom by
    r_over so it doesn't look smaller than the straight edges."""
    r = bowl_h / 2
    cx = x0 + stem + 32  # where the straight top hands over to the arc
    bb = top + bowl_h
    return (f"M{x0} {bottom}V{top}H{cx}"
            f"C{cx + r * 0.5523 + r_over:.2f} {top} {cx + r + r_over:.2f} {top + r - r * 0.5523:.2f} {cx + r + r_over:.2f} {top + r:.2f}"
            f"C{cx + r + r_over:.2f} {top + r + r * 0.5523:.2f} {cx + r * 0.5523 + r_over:.2f} {bb} {cx} {bb}"
            f"H{x0 + stem}V{bottom}Z")


def symbol_d(kind="primary"):
    if kind == "small":
        # 16-32 px cut: shorter stem, taller bowl, a bigger notch-less arrow
        # so the cut-out survives when each pixel is 16 units.
        return p_path(stem=60, top=24, bottom=232, bowl_h=152, x0=44) + " " + \
            arrow(128, 96, 52, notch=0.5)
    if kind == "reversed":
        # Light-on-dark spreads: stem 2 units thinner, arrow 2 units larger.
        return p_path(stem=54, x0=51) + " " + arrow(134, 100, 48)
    return p_path() + " " + arrow(134, 100, 46)


def svg(view, body, title="PointHacker logo"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}">'
            f"<title>{title}</title>{body}</svg>\n")


def sym(kind, fill, tx=0, ty=0, scale=1):
    t = f' transform="translate({tx} {ty}) scale({scale})"' if (tx or ty or scale != 1) else ""
    return f'<path fill="{fill}" fill-rule="evenodd"{t} d="{symbol_d(kind)}"/>'


# -------------------------------------------------------------- wordmark ---
font = TTFont(FONT)
font = instantiateVariableFont(font, {"wght": 600})
inst_path = OUT.parent / "SpaceGrotesk-600.ttf"
font.flavor = None
font.save(inst_path)

blob = hb.Blob.from_file_path(str(inst_path))
face = hb.Face(blob)
hbfont = hb.Font(face)
UPM = font["head"].unitsPerEm
CAP = font["OS/2"].sCapHeight  # 700
TRACK = -0.02 * UPM  # matches the nav's tracking-tight feel


def wordmark(text, cap_px, x, baseline):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hbfont, buf, {"kern": True, "liga": False})
    gs = font.getGlyphSet()
    order = font.getGlyphOrder()
    k = cap_px / CAP
    pen = SVGPathPen(gs)
    pen_x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        tp = TransformPen(pen, (k, 0, 0, -k, x + (pen_x + pos.x_offset) * k, baseline))
        gs[name].draw(tp)
        pen_x += pos.x_advance + TRACK
    width = (pen_x - TRACK) * k
    return pen.getCommands(), width


# ----------------------------------------------------------------- write ---
# P ink box: x 50..207.5, y 28..228
SYM_L, SYM_R, SYM_T, SYM_B = 50, 207.5, 28, 228


def write(name, content):
    (OUT / name).write_text(content)


for kind, fill, suffix in [("primary", EMERALD, ""), ("small", EMERALD, "-small"),
                           ("primary", INK, "-ink"), ("reversed", "#FFFFFF", "-reversed"),
                           ("reversed", EMERALD_DARK, "-on-dark")]:
    write(f"symbol{suffix}.svg", svg("0 0 256 256", sym(kind, fill)))

# Horizontal lockup: cap height = bowl height (136) would shout; 0.6 of the
# symbol's ink height reads as one unit. Cap band is centred on the bowl's
# optical centre rather than the full stem, so the word hangs off the bowl.
cap = 104
gap = 44
word_x = SYM_R + gap
baseline = 96 + cap / 2 + 4
wd, ww = wordmark("PointHacker", cap, word_x, baseline)
H_W = math.ceil(word_x + ww + SYM_L)
for suffix, sfill, wfill, kind in [("", EMERALD, INK, "primary"), ("-ink", INK, INK, "primary"),
                                   ("-reversed", EMERALD_DARK, "#FFFFFF", "reversed"),
                                   ("-white", "#FFFFFF", "#FFFFFF", "reversed")]:
    write(f"horizontal{suffix}.svg", svg(f"0 0 {H_W} 256",
          sym(kind, sfill) + f'<path fill="{wfill}" d="{wd}"/>'))

# Stacked: symbol above, word centred below.
s_cap = 92
s_word_d, s_ww = wordmark("PointHacker", s_cap, 0, 0)
S_W = math.ceil(max(s_ww, 256) + 64)
sym_tx = (S_W - (SYM_L + SYM_R)) / 2
s_base = 256 + 28 + s_cap
s_word_d, _ = wordmark("PointHacker", s_cap, (S_W - s_ww) / 2, s_base)
S_H = math.ceil(s_base + 32)
for suffix, sfill, wfill, kind in [("", EMERALD, INK, "primary"), ("-ink", INK, INK, "primary"),
                                   ("-reversed", EMERALD_DARK, "#FFFFFF", "reversed")]:
    write(f"stacked{suffix}.svg", svg(f"0 0 {S_W} {S_H}",
          sym(kind, sfill, tx=sym_tx) + f'<path fill="{wfill}" d="{s_word_d}"/>'))

# Wordmark only.
w_word_d, w_ww = wordmark("PointHacker", 104, 24, 104 + 24)
write("wordmark.svg", svg(f"0 0 {math.ceil(w_ww + 48)} 152", f'<path fill="{INK}" d="{w_word_d}"/>'))

# App-icon / tile: white P on an emerald rounded square; the arrow lets the
# emerald show through.
write("app-icon.svg", svg("0 0 256 256",
      f'<rect width="256" height="256" rx="56" fill="{EMERALD}"/>'
      + sym("reversed", "#FFFFFF", tx=128 - 0.62 * (SYM_L + SYM_R) / 2, ty=128 - 0.62 * 128, scale=0.62)))
print("horizontal", H_W, "stacked", S_W, S_H)
