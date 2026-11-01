"""Régénère src/generated/asset-meta.ts à partir de packages/sprites/assets.

Usage : python3 -I packages/sprites/scripts/scan_assets.py
Mesure dimensions, présence d'alpha et boîte englobante opaque (alpha > 16) pour
calculer l'ancrage au sol (bas de la boîte) de chaque sprite. Nécessite Pillow.
"""
import json
import os
import sys

from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ASSETS = os.path.join(ROOT, 'assets')
OUT = os.path.join(ROOT, 'src', 'data', 'asset-meta.ts')

rows = []
for dirpath, _, files in os.walk(ASSETS):
    for name in sorted(files):
        if not name.lower().endswith(('.png', '.webp')):
            continue
        full = os.path.join(dirpath, name)
        rel = os.path.relpath(full, ASSETS).replace(os.sep, '/')
        im = Image.open(full).convert('RGBA')
        alpha = im.getchannel('A')
        transparent = alpha.getextrema()[0] < 255
        bbox = alpha.point(lambda v: 255 if v > 16 else 0).getbbox() or (0, 0, im.width, im.height)
        rows.append((rel, im.width, im.height, transparent, list(bbox)))

rows.sort()
lines = [
    '// Fichier généré par packages/sprites/scripts/scan_assets.py — ne pas éditer à la main.',
    'import type { AssetMeta } from \'../types.js\';',
    '',
    'export const ASSET_META: Readonly<Record<string, AssetMeta>> = {',
]
for rel, w, h, t, bb in rows:
    lines.append(
        f"  '{rel}': {{ width: {w}, height: {h}, transparent: {'true' if t else 'false'}, opaqueBox: [{bb[0]}, {bb[1]}, {bb[2]}, {bb[3]}] }},"
    )
lines.append('};')
lines.append('')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(lines))
SRC_OUT = os.path.join(ROOT, 'src', 'data', 'asset-sources.ts')
src = [
    '// Fichier généré par packages/sprites/scripts/scan_assets.py — ne pas éditer à la main.',
    '// Requires statiques pour Metro (bundle mobile uniquement). Importer via `@blowy/sprites/sources`.',
    'declare const require: (id: string) => number;',
    '',
    'export const ASSET_SOURCES: Readonly<Record<string, number>> = {',
]
for rel, *_ in rows:
    src.append(f"  '{rel}': require('../../assets/{rel}'),")
src.append('};')
src.append('')
with open(SRC_OUT, 'w', encoding='utf-8') as fh:
    fh.write('\n'.join(src))
print(f'{len(rows)} assets -> {OUT}, {SRC_OUT}', file=sys.stderr)
