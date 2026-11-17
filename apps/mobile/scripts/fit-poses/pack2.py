"""Planche 2 du pack (colere, malade, timide, fier, rit, danse, accueil, assis, baille, bain, applaudit, fete) : réparation,
échelle commune par espèce, toile de l'app.

La découpe a recalé chaque image à sa façon (la première, `colere`, fixe l'échelle ; les poses trop larges ou trop
hautes ont été rétrécies pour tenir dans la toile) et n'a gardé que la plus grande forme. Ici :
  1. réparation : antennes de Suzie et corne de Pia en `fete` (reprises de la planche brute, fond blanc), mousse de
     Pia en `bain` (à moitié transparente au détourage) ;
  2. échelle réelle de chaque découpe par rapport à la planche brute (recalage de la silhouette colorée, sans les
     ombres ni la mousse), ramenée à celle de `colere` ; puis l'échelle de l'espèce (Gaston et Pia ×0,874 / ×0,881,
     comme la planche 1) ; une pose qui ne tiendrait plus dans la toile (bras ouverts de Gaston et Pia) est rétrécie
     juste assez (896 px de large au plus) ;
  3. pieds sur y = 958, centrée, webp (< 120 Ko).
Usage : python3 -I pack2.py <sortie> [--sheet var]   (découpes dans $MASCOTS/<espèce>2p/cut, planches brutes dans
$MASCOTS/<espèce>2p/raw).

`--sheet var` : planche des variantes (formes d'évolution en pied, bébé, œuf, œuf fêlé, éclosion, fantôme, en danger),
`$MASCOTS/<espèce>_var/{cut,raw}`, sortie `<espèce>_<variante>.webp`. Même méthode : `evo_equilibre` (première de la
planche, debout) a la taille de `neutre` ; les autres gardent leur taille relative (bébé plus petit, œufs à leur taille)."""
import os, sys, json
import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
M = os.environ.get('MASCOTS', '/home/claude/work/mascots/')
SHEETS = {
    '2p': dict(dir='2p', ref='colere', name='{s}_corps_{p}', poses=['colere', 'malade', 'timide', 'fier', 'rit', 'danse', 'accueil', 'assis', 'baille', 'bain', 'applaudit', 'fete']),
    'var': dict(dir='_var', ref='evo_equilibre', name='{s}_{p}', poses=['evo_equilibre', 'evo_sociable', 'evo_joueur', 'evo_casanier', 'evo_tendre', 'evo_piquant', 'bebe', 'oeuf', 'oeuf_fele', 'eclosion', 'fantome', 'danger']),
}
SHEET = SHEETS['var' if '--sheet' in sys.argv and sys.argv[sys.argv.index('--sheet') + 1] == 'var' else '2p']
D = SHEET['dir']
P2 = SHEET['poses']
F = {'nino': 1.0, 'suzie': 1.0, 'gaston': 0.874, 'pia': 0.881}
# La planche 2 n'a pas tout à fait les proportions de la planche 1 : à `colere` égale à `neutre` en hauteur, la tête
# (largeur des blancs des yeux, largeur de la silhouette à la hauteur des yeux, poses aux yeux ouverts) sort
# 3 % plus petite chez Suzie, 4 % plus grande chez Gaston, 10 % plus grande chez Pia. Recalé ici.
HEAD = {'nino': 1.0, 'suzie': 1.03, 'gaston': 0.96, 'pia': 0.91} if D == '2p' else {'nino': 1.0, 'suzie': 1.0, 'gaston': 1.0, 'pia': 1.0}
GROUND = 958
MAXW = 896


def raw_half(s, p):
    k = P2.index(p)
    im = Image.open(f'{M}{s}{D}/raw/pair{k // 2}.png').convert('RGB'); w = im.width // 2
    return im.crop((0, 0, w, im.height)) if k % 2 == 0 else im.crop((w, 0, im.width, im.height))


def raw_matte(s, p):
    """Détourage simple sur fond blanc (planche brute ×2) : alpha et couleur."""
    half = raw_half(s, p)
    c = np.asarray(half.resize((half.width * 2, half.height * 2), Image.LANCZOS)).astype(np.float32)
    mn = c.min(-1)
    denom = 255 - ndi.minimum_filter(mn, size=11)
    a = np.clip((255 - mn - 5) / np.maximum(denom - 5, 40), 0, 1)
    f = 255 - (255 - c) / np.maximum(a, 1e-3)[..., None]
    return np.clip(np.where(a[..., None] > 0.5, c, f), 0, 255), a


def solid_extent(a, th):
    lab, n = ndi.label(a > th); sz = ndi.sum(a > th, lab, range(1, n + 1)); m = lab == (1 + int(np.argmax(sz)))
    ys, xs = np.where(m); return xs.min(), xs.max(), ys.max()


def patch(cut, s, p, box):
    """Reprend la zone `box` (px de la découpe) dans la planche brute, là où la découpe n'est pas pleine."""
    ca = cut[..., 3] / 255
    rgb, ra = raw_matte(s, p)
    rx0, rx1, rby = solid_extent(ra, 0.6)
    cx0, cx1, cby = solid_extent(ca, 0.6)
    k = (cx1 - cx0) / (rx1 - rx0)
    yy, xx = np.mgrid[0:ca.shape[0], 0:ca.shape[1]].astype(np.float32)
    sx = (xx - cx0) / k + rx0; sy = (yy - cby) / k + rby
    a = ndi.map_coordinates(ra, [sy, sx], order=1, cval=0)
    col = np.dstack([ndi.map_coordinates(rgb[..., i], [sy, sx], order=1, cval=255) for i in range(3)])
    lab, n = ndi.label(a > 0.25); body = ca > 0.9
    keep = np.zeros_like(body)
    for j in range(1, n + 1):  # ce qui touche le corps (pas les confettis)
        if ((lab == j) & body).any(): keep |= lab == j
    keep = ndi.binary_dilation(keep, iterations=2)
    a = np.where(ndi.binary_erosion(ndi.binary_fill_holes(a > 0.35) & keep, iterations=3), 1.0, a)
    x0, y0, x1, y1 = box
    sel = np.zeros_like(body); sel[y0:y1, x0:x1] = True; sel &= ~(ca > 0.97)
    out = cut.copy()
    out[..., 3] = np.where(sel, np.where(keep, a, 0), ca) * 255
    out[..., :3] = np.where(sel[..., None], col, cut[..., :3])
    return out


def foam(cut, box):
    """Mousse blanche à moitié transparente (blanc sur blanc au détourage) : rendue pleine, bord adouci."""
    x0, y0, x1, y1 = box
    a = cut[y0:y1, x0:x1, 3] / 255; v = cut[y0:y1, x0:x1, :3].min(-1)
    boost = ndi.gaussian_filter(np.clip(a * 2.6, 0, 1), 1.2)
    out = cut.copy()
    out[y0:y1, x0:x1, 3] = np.where((v > 195) & (a > 0.15), np.maximum(a, boost), a) * 255
    return out


REPAIR = {} if D != '2p' else {('suzie', 'fete'): ('patch', (60, 100, 520, 330)), ('pia', 'fete'): ('patch', (140, 60, 330, 300)), ('pia', 'bain'): ('foam', (520, 100, 720, 300))}


def cut_scale(s, p):
    """Px de la découpe par px de la planche brute : recalage de la silhouette colorée (fourrure, bac, plaid)."""
    half = np.asarray(raw_half(s, p)).astype(np.float32)
    rm = ((half.max(-1) - half.min(-1)) > 45).astype(np.float32)
    a = np.asarray(Image.open(f'{M}{s}{D}/cut/' + SHEET['name'].format(s=s, p=p) + '.webp').convert('RGBA')).astype(np.float32)
    cm = ((a[..., 3] > 127) & ((a[..., :3].max(-1) - a[..., :3].min(-1)) > 45)).astype(np.float32)
    ys, xs = np.where(cm > 0); cm = cm[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    pad = cv2.copyMakeBorder(rm, 20, 20, 20, 20, cv2.BORDER_CONSTANT, value=0)
    best = (-1.0, 0.0)
    for k in np.arange(2.3, 3.6, 0.01):
        t = cv2.resize(cm, (max(1, round(cm.shape[1] / k)), max(1, round(cm.shape[0] / k))), interpolation=cv2.INTER_AREA)
        if t.shape[0] >= rm.shape[0] or t.shape[1] >= rm.shape[1]: continue
        v = float(cv2.matchTemplate(pad, t, cv2.TM_CCORR_NORMED).max())
        if v > best[0]: best = (v, float(k))
    return best[1]


if __name__ == '__main__':
    out = sys.argv[1]; total = 0; report = {}
    for s in ['nino', 'suzie', 'gaston', 'pia']:
        ref = cut_scale(s, SHEET['ref']); report[s] = {}
        for p in P2:
            cut = np.asarray(Image.open(f'{M}{s}{D}/cut/' + SHEET['name'].format(s=s, p=p) + '.webp').convert('RGBA')).astype(np.float32)
            if (s, p) in REPAIR:
                how, box = REPAIR[(s, p)]
                cut = patch(cut, s, p, box) if how == 'patch' else foam(cut, box)
            im = Image.fromarray(cut.clip(0, 255).astype(np.uint8), 'RGBA')
            k = F[s] * HEAD[s] * ref / cut_scale(s, p)
            a = np.asarray(im)[..., 3]; ys, xs = np.where(a > 8)
            fig = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
            k = min(k, MAXW / fig.width, (GROUND + 1) / fig.height)
            fig = fig.resize((round(fig.width * k), round(fig.height * k)), Image.LANCZOS)
            can = Image.new('RGBA', (900, 1000), (0, 0, 0, 0))
            can.alpha_composite(fig, (round(450 - fig.width / 2), round(GROUND + 1 - fig.height)))
            dst = os.path.join(out, SHEET['name'].format(s=s, p=p) + '.webp')
            q = 88
            while True:
                can.save(dst, 'WEBP', quality=q, method=6)
                if os.path.getsize(dst) < 118_000 or q <= 70: break
                q -= 4
            sz = os.path.getsize(dst); total += sz; report[s][p] = round(k, 3)
            print(SHEET['name'].format(s=s, p=p), round(k, 3), sz // 1024, 'Ko', flush=True)
    json.dump(report, open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pack2.json' if D == '2p' else 'pack_var.json'), 'w'), indent=1)
    print('total', total // 1024, 'Ko')
