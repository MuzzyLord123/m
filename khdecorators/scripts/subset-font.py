#!/usr/bin/env python3
"""
Cut Archivo down to what this site uses: src/fonts/archivo-kh.woff2.

    pip install fonttools brotli
    npm run build                      # so the built pages exist to be read
    python3 scripts/subset-font.py path/to/Archivo-variable.woff2

The source is Archivo's variable font with both axes (wght 100–900, wdth
62–125) — Google Fonts' latin file, or the full file from the Archivo release.

Why it exists: the hero headline is the LCP element on every page and it is set
wider than any fallback can imitate, so the page is not finished until this file
arrives. Google's latin file is 87KB; this one is 47KB. See src/app/fonts.ts.

What it keeps:
  - every character in the built HTML under .next/server/app, plus all of ASCII
    and the typographic punctuation the copy uses;
  - the weight axis limited to 400–800, the range the CSS asks for;
  - the width axis whole, 62–125 — the design depends on both ends of it.

Run it again whenever new copy brings in a character the site has not used
before (a town with an accent, a new symbol). Until then the browser shows that
one glyph from the fallback font, so nothing breaks in the meantime.
"""

import glob
import html
import os
import re
import sys

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'src', 'fonts', 'archivo-kh.woff2')

if len(sys.argv) != 2:
    sys.exit(__doc__)

chars = set()
pages = glob.glob(os.path.join(ROOT, '.next', 'server', 'app', '**', '*.html'), recursive=True)
if not pages:
    sys.exit('No built pages found. Run `npm run build` first.')
for page in pages:
    text = open(page, encoding='utf8').read()
    text = re.sub(r'<script[\s\S]*?</script>', ' ', text)
    text = re.sub(r'<style[\s\S]*?</style>', ' ', text)
    text = html.unescape(re.sub(r'<[^>]+>', ' ', text))
    chars |= set(text)

chars |= {chr(c) for c in range(0x20, 0x7F)}
chars |= set('£€©®°·×‘’‚“”„–—…•′″™←↑→↓−éÉ')
text = ''.join(sorted(c for c in chars if c.isprintable()))

font = instantiateVariableFont(TTFont(sys.argv[1]), {'wght': (400, 400, 800)})

options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['kern', 'liga', 'calt', 'tnum', 'lnum', 'case']
options.hinting = False
options.desubroutinize = True
options.notdef_outline = True

subsetter = subset.Subsetter(options)
subsetter.populate(text=text)
subsetter.subset(font)

font.flavor = 'woff2'
font.save(OUT)

check = TTFont(OUT)
print(
    f'{os.path.relpath(OUT, ROOT)}: {os.path.getsize(OUT) // 1024}KB, '
    f'{len(check.getGlyphOrder())} glyphs, '
    f'axes {[(a.axisTag, a.minValue, a.maxValue) for a in check["fvar"].axes]}'
)
