"""Recalage par les yeux (formes d'évolution, bébé, en danger) : là où le recalage par la silhouette du haut de la tête
se trompe (fourrure hérissée, tête de bébé), l'échelle, l'inclinaison et la position viennent des blancs des yeux
(écart des deux yeux ; Gaston, œil unique : sa largeur). Écrit `reg` dans fix.json pour les poses demandées.
Usage : python3 -I eyes_reg.py pose1,pose2 [--dry]"""
import os, sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../../..'))
A = os.path.join(ROOT, 'packages/ui/assets/pets/')
K = os.path.dirname(os.path.abspath(__file__)) + '/'
def img(s, p): return f'{A}{s}_{p}.webp' if p.startswith('evo_') else f'{A}{s}_corps_{p}.webp'
def eyes(s, p):
    c = np.asarray(Image.open(img(s, p)).convert('RGBA')).astype(float)
    rgb = c[..., :3]; v = rgb.min(-1); sat = rgb.max(-1) - rgb.min(-1)
    m = ndi.binary_opening((c[..., 3] > 250) & (v > 215) & (sat < 30), iterations=2)
    lab, n = ndi.label(m); res = []
    for j in range(1, n + 1):
        mm = lab == j
        if mm.sum() < 800: continue
        ys, xs = np.where(mm)
        if ys.mean() > 700: continue
        res.append((int(mm.sum()), float(xs.mean()), float(ys.mean()), float(xs.max() - xs.min())))
    res.sort(reverse=True)
    return res[:1] if s == 'gaston' else sorted(res[:2], key=lambda r: r[1])
def reg(s, p):
    e0, e1 = eyes(s, 'neutre'), eyes(s, p)
    if s == 'gaston':
        if not e1: return None
        k = e1[0][3] / e0[0][3]; rot = 0.0
        a, b = (e0[0][1], e0[0][2]), (e1[0][1], e1[0][2])
    else:
        if len(e1) < 2: return None
        d0 = np.subtract(e0[1][1:3], e0[0][1:3]); d1 = np.subtract(e1[1][1:3], e1[0][1:3])
        k = float(np.hypot(*d1) / np.hypot(*d0)); rot = float(np.degrees(np.arctan2(d1[1], d1[0]) - np.arctan2(d0[1], d0[0])))
        a = ((e0[0][1] + e0[1][1]) / 2, (e0[0][2] + e0[1][2]) / 2); b = ((e1[0][1] + e1[1][1]) / 2, (e1[0][2] + e1[1][2]) / 2)
    if p == 'bebe':
        # Bébé : les yeux sont presque aussi grands qu'adulte ; la taille de la tête vient de la largeur de la silhouette
        # à la hauteur des yeux.
        def width(q, y):
            al = np.asarray(Image.open(img(s, q)))[..., 3] > 128; xs = np.where(al[int(y)])[0]; return xs.max() - xs.min()
        k = width(p, b[1]) / width('neutre', a[1])
    return dict(s=round(k, 3), rot=round(rot, 1), ref_c=[round(a[0], 1), round(a[1], 1)], tgt_c=[round(b[0], 1), round(b[1], 1)])
if __name__ == '__main__':
    poses = sys.argv[1].split(','); fix = json.load(open(K + 'fix.json'))
    for s in ['nino', 'suzie', 'gaston', 'pia']:
        for p in poses:
            r = reg(s, p); print(s, p, r)
            if r and '--dry' not in sys.argv: fix.setdefault(s, {}).setdefault(p, {})['reg'] = r
    if '--dry' not in sys.argv: json.dump(fix, open(K + 'fix.json', 'w'), indent=1)
