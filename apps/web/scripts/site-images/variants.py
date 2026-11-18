"""Versions réduites des images de la landing (srcset/sizes), tirées des images déjà dans apps/web/public/img.

Chaque variante porte sa largeur dans son nom (`img/v/<nom>-<largeur>.webp`) et le manifeste
`apps/web/src/lib/img-variants.json` les liste pour `srcsetOf()` (src/lib/img.ts). À relancer après build.py.

Usage (depuis la racine du dépôt) : python3 -I apps/web/scripts/site-images/variants.py
Dépendances : Pillow (webp).
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
PUB = ROOT / 'apps/web/public'
OUT = PUB / 'img/v'
MANIFEST = ROOT / 'apps/web/src/lib/img-variants.json'

# (motif, largeurs voulues) : seules les largeurs plus petites que l'original sont produites. Seulement les images
# affichées avec `srcset` (pas celles que le script de la landing change de `src`, comme #apet).
RULES = [
    ('img/*_face.webp', [128]),  # visages : affichés de 28 à 48 px
    ('img/m/hero_nino.webp', [320, 480]),
    ('img/m/bande_fete.webp', [600, 900]),
    ('img/m/duo_check.webp', [360, 480]),
    ('img/m/nino_evo_*.webp', [240, 320]),
    ('img/m/tenue_*.webp', [240, 320]),
    *[(f'img/m/{n}.webp', [240, 320]) for n in ['nino_coucou', 'suzie_joie', 'pia_check', 'nino_danger', 'nino_fantome', 'nino_fier', 'nino_marche', 'suzie_coucou']],
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, list[list]] = {}
    for pattern, widths in RULES:
        for src in sorted(PUB.glob(pattern)):
            key = '/' + src.relative_to(PUB).as_posix()
            if key in manifest:
                continue
            im = Image.open(src).convert('RGBA')
            entries = []
            for w in widths:
                if w >= im.width:
                    continue
                h = round(im.height * w / im.width)
                dst = OUT / f'{src.stem}-{w}.webp'
                im.resize((w, h), Image.LANCZOS).save(dst, 'WEBP', quality=80, method=6)
                entries.append([w, '/' + dst.relative_to(PUB).as_posix()])
            if entries:
                manifest[key] = entries + [[im.width, key]]
    lines = [f'  {json.dumps(k)}: {json.dumps(v)}' for k, v in sorted(manifest.items())]
    MANIFEST.write_text('{\n' + ',\n'.join(lines) + '\n}\n')
    print(f'{len(manifest)} images, {sum(len(v) - 1 for v in manifest.values())} variantes')


if __name__ == '__main__':
    main()
