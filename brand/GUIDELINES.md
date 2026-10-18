# PointHacker — Logo Guidelines

## 1. The logo

**Idea:** a bold P with a navigation arrow cut from its bowl, aimed up and to the right — your points heading
somewhere better. The arrow is both the "up and to the right" of gain and the "navigate" arrow of a travel app.

| Version | File | Use it for |
|---|---|---|
| Horizontal lockup (primary) | `masters/horizontal.svg` | Site header, docs, anywhere there's width |
| Stacked lockup | `masters/stacked.svg` | Square-ish spaces: social cards, splash screens |
| Symbol | `masters/symbol.svg` | Tight spaces at **48 px and up** |
| Symbol, small cut | `masters/symbol-small.svg` | **Under 48 px**: favicons, nav icons, avatars. Bigger arrow, shorter stem — the arrow in the standard symbol fills in below ~32 px |
| Wordmark only | `masters/wordmark.svg` | Rare; when the symbol already appears nearby |
| App icon | `masters/app-icon.svg`, `export/symbol/*app-icon*` | Home-screen / PWA tiles |

Dark backgrounds use the `-reversed` files (emerald-400 symbol + white word, drawn 2 units lighter so they don't
glow heavier than the light version) or the all-white `-white` files. One-colour black/white/emerald versions of
every lockup are in `export/`.

## 2. Clear space

Keep a clear zone of **1 × the stem width** on every side, where the stem width is the width of the P's vertical
stroke (56 of the symbol's 256 units — about 22 % of the symbol's height). The zone scales with the logo.

## 3. Minimum size

| Version | Screen | Print |
|---|---|---|
| Horizontal | 20 px tall (≈ 90 px wide) | 6 mm tall |
| Stacked | 48 px tall | 14 mm tall |
| Symbol | 48 px (below that, the small cut) | 10 mm |
| Small cut | 16 px | 4 mm |

## 4. Colour

| Name | Role | HEX | RGB | CMYK (approx.) | Pantone (nearest — check a swatch book) |
|---|---|---|---|---|---|
| Emerald 600 | Symbol on light grounds; the app's one accent | `#059669` | 5 150 105 | 97 0 30 41 | 340 C |
| Emerald 400 | Symbol on dark grounds | `#34D399` | 52 211 153 | 75 0 27 17 | 7479 C |
| Ink | Wordmark on light grounds | `#09090B` | 9 9 11 | 60 40 40 100 (rich black) | Black 6 C |
| White | Wordmark on dark grounds; symbol on emerald | `#FFFFFF` | 255 255 255 | 0 0 0 0 | — |

These are Tailwind's `emerald-600` / `emerald-400` / `zinc-950`, so the logo and the UI share one palette.
Emerald 600 on white is 3.8 : 1 — fine for a graphic (WCAG asks 3 : 1 for non-text), so don't use it for small
body text.

**Approved pairs:** emerald symbol + ink word on white or `#fafafa` · emerald-400 symbol + white word on near-black ·
white on emerald 600 · one-colour black on white · one-colour white on any dark or busy ground.

## 5. Typography

- Wordmark: **Space Grotesk SemiBold (600)**, tracking −2 %, converted to outlines — the same face the site uses
  for headings (`font-display`). SIL Open Font License, so logo use is allowed.
- Body text alongside the logo: Geist Sans (the site's body face).
- Never retype the wordmark — use the files; the outlines carry the kerning.

## 6. Don'ts

Don't stretch, squash or rotate it (the arrow's 45° is the point) · don't recolour outside the palette · don't put
emerald 400 on white or emerald 600 on black · don't add shadows, outlines, gradients or effects · don't fill the
arrow cut-out with a different colour — it's a hole, it shows the background · don't change the gap or size ratio
between symbol and word · don't use the standard symbol below 48 px (use the small cut).

## 7. Files

```
masters/   SVG masters (colour, ink, reversed, white, small cut, app icon)
export/    one-colour SVG + PNG variants of symbol, horizontal and stacked; web icon set in export/symbol/
           (favicon.ico, favicon.svg, apple-touch-icon.png, icon-192/512, maskable-512, site.webmanifest)
slides/    presentation board as PNGs · presentation.html is the same board as one page
source/    build.py — regenerates masters/ from the geometry (needs fonttools + uharfbuzz and the
           Space Grotesk variable font)
```

## 8. Handover notes

- **Construction:** 256-unit grid. Stem 56 wide × 200 tall; bowl 136 tall, right side a 68-radius semicircle with
  1.5 units of overshoot. Arrow: navigation chevron at exactly 45°, notch at 42 % of its length. Small cut: stem
  60, bowl 152, notch at 50 %, arrow ~13 % larger relative to the bowl.
- **Tested:** 16/32/48 px pixel test, light/dark/emerald/photo/pattern grounds, greyscale, one-colour black and
  white, squint blur, mirror and 180° (reads as "d" with an arrow — no unfortunate shapes), plus the mockups on the
  board.
- **Open items:** trademark clearance hasn't been checked — run a professional search before relying on the mark
  commercially. Pantone and CMYK values are calculated nearest matches, not press-proofed.
