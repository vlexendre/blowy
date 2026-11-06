"""
Génère les instances statiques des polices de l'app depuis les polices variables OFL du paquet
npm @fontsource-variable (mêmes binaires que Google Fonts, utilisés par les maquettes V4/V5).

Pourquoi : les maquettes utilisent Bricolage Grotesque variable avec `font-stretch:85%` et
`font-optical-sizing:auto` (opsz = taille en px) ; React Native natif ne sait pas régler les axes
d'une police variable. On fige donc une instance par taille d'affichage (opsz exact) :
  BricolageGrotesque-D<size>  wdth 85, wght 800, opsz=<size>  (style `.d`)
  BricolageGrotesque-B<size>  wdth 100, wght 800, opsz=<size> (boutons, `.act`, `.seg`, puces Bricolage)
  Inter-<wght>                Inter 4 (opsz 14 figé, comme Google Fonts), 400/500/600/700
Rendu : on CONSERVE la table `prep` des binaires Google (hinting=True au sous-ensemble). Sans elle,
Chrome/Skia rend la police statique avec avances arrondies et crénage dégradé (+2,6 % de largeur
mesurés sur Inter 13 px, +2,2 % sur Bricolage 29 px) ; avec elle, largeurs identiques au pixel près
aux polices variables des maquettes (.local/ui-fondation/fonttest, voir docs/design/design-language.md).
Les tailles DOIVENT rester alignées sur `opticalSizes` de @blowy/design-tokens (test :
apps/mobile/src/core/fonts/fonts.test.ts).

Usage : python3 -I apps/mobile/scripts/fonts/build-fonts.py   (fonttools + brotli requis)
"""
import copy, os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

HERE = os.path.dirname(os.path.abspath(__file__))
MOBILE = os.path.abspath(os.path.join(HERE, '..', '..'))
NM = os.path.join(MOBILE, 'node_modules', '@fontsource-variable')
OUT = os.path.join(MOBILE, 'assets', 'fonts')
GEN = os.path.join(MOBILE, 'src', 'core', 'fonts', 'font-files.generated.ts')

DISPLAY_SIZES = [13, 15, 16, 17, 18, 19, 20, 22, 24, 26, 28, 29, 30, 32, 34, 36, 38, 40, 44, 46, 48, 50, 52, 54, 56, 64, 96]
STRONG_SIZES = [13, 14, 15, 16, 17, 18, 19, 24, 40]
INTER_WEIGHTS = [400, 500, 600, 700]
# Sous-ensemble « latin » de Google Fonts + latin-ext utile (œ, ’, “ ”, …, €, flèches).
UNICODES = list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + [0x131, 0x152, 0x153, 0x2BB, 0x2BC, 0x2C6, 0x2DA, 0x2DC, 0x304, 0x308, 0x329] + list(range(0x2000, 0x2070)) + [0x20AC, 0x2122, 0x2191, 0x2193, 0x2192, 0x2190, 0x2212, 0x2215, 0xFEFF, 0xFFFD]


def rename(font, name):
    t = font['name']
    for rec in list(t.names):
        if rec.nameID in (1, 2, 3, 4, 6, 16, 17, 21, 22, 25):
            t.removeNames(nameID=rec.nameID)
    for nid, val in ((1, name), (2, 'Regular'), (3, name), (4, name), (6, name)):
        t.setName(val, nid, 3, 1, 0x409)
        t.setName(val, nid, 1, 0, 0)
    font['OS/2'].usWeightClass = 400  # famille mono-graisse : jamais de gras synthétique
    font['OS/2'].fsSelection = (font['OS/2'].fsSelection & ~0b1100001) | 0b1000000  # REGULAR
    font['head'].macStyle = 0


def build(src, axes, name):
    vf = TTFont(src, lazy=False)
    opts = subset.Options()
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.hinting = True  # garde `prep` : indispensable au rendu fidèle (voir en-tête)
    opts.notdef_outline = True
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=UNICODES)
    sub.subset(vf)
    inst = instantiateVariableFont(vf, axes, updateFontNames=False)
    rename(inst, name)
    inst.flavor = None
    path = os.path.join(OUT, name + '.ttf')
    inst.save(path)
    return name


def main():
    os.makedirs(OUT, exist_ok=True)
    bric = os.path.join(NM, 'bricolage-grotesque', 'files', 'bricolage-grotesque-latin-standard-normal.woff2')
    inter = os.path.join(NM, 'inter', 'files', 'inter-latin-wght-normal.woff2')
    for p in (bric, inter):
        if not os.path.exists(p):
            sys.exit(f'introuvable : {p} (pnpm install dans apps/mobile)')
    names = []
    for s in DISPLAY_SIZES:
        names.append(build(bric, {'wdth': 85, 'wght': 800, 'opsz': min(96, max(12, s))}, f'BricolageGrotesque-D{s}'))
    for s in STRONG_SIZES:
        names.append(build(bric, {'wdth': 100, 'wght': 800, 'opsz': min(96, max(12, s))}, f'BricolageGrotesque-B{s}'))
    for w in INTER_WEIGHTS:
        names.append(build(inter, {'wght': w}, f'Inter-{w}'))
    os.makedirs(os.path.dirname(GEN), exist_ok=True)
    with open(GEN, 'w') as f:
        f.write('// Fichier généré par apps/mobile/scripts/fonts/build-fonts.py — ne pas éditer.\n')
        f.write('/* eslint-disable @typescript-eslint/no-require-imports */\n')
        f.write('export const FONT_FILES = {\n')
        for n in names:
            f.write(f"  '{n}': require('../../../assets/fonts/{n}.ttf'),\n")
        f.write('} as const;\n')
    total = sum(os.path.getsize(os.path.join(OUT, n + '.ttf')) for n in names)
    print(f'{len(names)} instances, {total / 1024:.0f} Kio → {OUT}')


if __name__ == '__main__':
    main()
