"""Images du site minimoa.app, tirées du pack des minimoas (packages/ui/assets) : poses en pied réduites, minimoas
habillés (placements de l'app), bande finale, aperçus de liens (Open Graph 1200 × 630), favicon et icône Apple, police
Anton auto-hébergée (sous-ensemble latin).

Usage (depuis la racine du dépôt) :
  pnpm exec tsx apps/web/scripts/site-images/placements.mts > /tmp/minimoa-placements.json
  python3 -I apps/web/scripts/site-images/build.py /tmp/minimoa-placements.json
Dépendances : Pillow (webp), fontTools + brotli (police). Sorties dans apps/web/public (fichiers versionnés).
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[4]
ASSETS = ROOT / 'packages/ui/assets'
PUB = ROOT / 'apps/web/public'
OUT = PUB / 'img/m'
OG = PUB / 'og'
ANTON = ROOT / 'node_modules/@expo-google-fonts/anton/400Regular/Anton_400Regular.ttf'
ALLO = ROOT / 'apps/mobile/assets/fonts/allo/Allo-ExtraBold.otf'

NIGHT = (11, 10, 20)
INK = (20, 16, 31)
SPECIES = ['nino', 'suzie', 'gaston', 'pia']

# Poses en pied utilisées par la landing (section « vivant » : une par soin, pour les quatre espèces).
CARE_POSES = ['neutre', 'mange', 'joue', 'dodo', 'rit', 'bain', 'danse']
EXTRA = {
    'nino': ['coucou', 'fier', 'pense', 'triste', 'danger', 'fantome', 'marche', 'timide', 'check', 'applaudit'],
    'suzie': ['joie', 'coucou'],
    'gaston': ['applaudit', 'joie'],
    'pia': ['coucou', 'check'],
}
EVO = ['casanier', 'equilibre', 'sociable', 'tendre', 'piquant', 'joueur']
MISC = ['pomme', 'balle', 'coussin', 'peluche', 'canard', 'medaille', 'coffre', 'cookie', 'plante', 'lampe']


def pet(name: str) -> Image.Image:
    return Image.open(ASSETS / 'pets' / f'{name}.webp').convert('RGBA')


def save_webp(im: Image.Image, path: Path, width: int, q: int = 80) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    h = round(im.height * width / im.width)
    im.resize((width, h), Image.LANCZOS).save(path, 'WEBP', quality=q, method=6)


# ── Minimoas habillés ──────────────────────────────────────────────────────────────────────────────────────────────

PAD = 260  # marge au-dessus de la toile (couvre-chefs qui dépassent)


def item_layer(p: dict, size: tuple[int, int]) -> Image.Image:
    """L'objet posé et tourné comme dans l'app (pivot `origin`, sens horaire), sur une toile transparente."""
    src = Image.open(ASSETS / 'items' / f"{p['image']}.webp").convert('RGBA')
    w, h = max(1, round(p['width'])), max(1, round(p['height'] * p['scaleY']))
    src = src.resize((w, h), Image.LANCZOS)
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    left, top = round(p['left']), round(p['top'] + PAD + p['height'] * p['originY'] * (1 - p['scaleY']))
    layer.alpha_composite(src, (left, top)) if left >= 0 and top >= 0 else layer.paste(src, (left, top), src)
    if p['rotate']:
        cx, cy = p['left'] + p['originX'] * p['width'], p['top'] + PAD + p['originY'] * p['height']
        layer = layer.rotate(-p['rotate'], resample=Image.BICUBIC, center=(cx, cy))
    return layer


def fur_shadow(layer: Image.Image, body_alpha: Image.Image, spec: dict, strength: float) -> Image.Image:
    """Ombre de l'objet sur la fourrure : silhouette sombre, floue, décalée, limitée à l'alpha du minimoa."""
    a = layer.getchannel('A').point(lambda v: round(v * spec['opacity'] * strength))
    a = ImageChops.offset(a, round(spec['x']), round(spec['y'])).filter(ImageFilter.GaussianBlur(spec['blur']))
    a = ImageChops.multiply(a, body_alpha)
    sh = Image.new('RGBA', layer.size, (26, 13, 0, 0))
    sh.putalpha(a)
    return sh


def dressed(o: dict) -> Image.Image:
    size = (900, 1000 + PAD)
    canvas = Image.new('RGBA', size, (0, 0, 0, 0))
    body = Image.new('RGBA', size, (0, 0, 0, 0))
    body.alpha_composite(pet(f"{o['species']}_corps_{o['pose']}"), (0, PAD))
    for p in o['layers']['back']:
        canvas.alpha_composite(item_layer(p, size))
    canvas.alpha_composite(body)
    body_alpha = body.getchannel('A')
    for p in o['layers']['front']:
        layer = item_layer(p, size)
        if p['wear'].get('fur') and p['slot'] != 'toy':
            canvas.alpha_composite(fur_shadow(layer, body_alpha, p['wear']['fur'], p['wear']['shadow']))
        canvas.alpha_composite(layer)
    return canvas.crop(canvas.getbbox())


def fit_canvas(im: Image.Image, w: int, h: int, foot: float = 0.96) -> Image.Image:
    """Pose une image détourée sur une toile w × h, centrée, pieds sur `foot` (part de la hauteur)."""
    k = min(w * 0.96 / im.width, h * foot * 0.98 / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.alpha_composite(im, ((w - im.width) // 2, round(h * foot) - im.height))
    return out


# ── Aperçus de liens ───────────────────────────────────────────────────────────────────────────────────────────────

def vgrad(w: int, h: int, top: tuple, bottom: tuple) -> Image.Image:
    g = Image.linear_gradient('L').resize((w, h))
    return Image.composite(Image.new('RGB', (w, h), bottom), Image.new('RGB', (w, h), top), g).convert('RGBA')


def glow(im: Image.Image, xy: tuple, r: int, color: tuple, a: int) -> None:
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse((xy[0] - r, xy[1] - r, xy[0] + r, xy[1] + r), fill=color + (a,))
    im.alpha_composite(layer.filter(ImageFilter.GaussianBlur(r * 0.45)))


def mix(c: tuple, bg: tuple, k: float) -> tuple:
    return tuple(round(c[i] * k + bg[i] * (1 - k)) for i in range(3))


PANELS = {
    'accent': ((255, 210, 63), (255, 176, 0), INK),
    'violet': ((109, 61, 240), (130, 83, 244), (255, 255, 255)),
    'coral': ((255, 90, 60), (255, 143, 107), (255, 255, 255)),
    'rose': ((255, 143, 198), (255, 196, 223), INK),
    'wine': ((42, 15, 46), (140, 29, 79), (255, 255, 255)),
    'orange': ((255, 122, 46), (255, 162, 77), INK),
    'night': ((23, 20, 42), (11, 10, 20), (255, 255, 255)),
}


def og(name: str, panel: str, lines: list[str], dim_from: int, art: Image.Image, art_box: tuple, tagline: str) -> None:
    W, H = 1200, 630
    top, bottom, fg = PANELS[panel]
    im = vgrad(W, H, top, bottom)
    glow(im, (980, 120), 360, (255, 255, 255), 46)
    if panel == 'night':
        glow(im, (1000, 520), 340, (109, 61, 240), 90)
    d = ImageDraw.Draw(im)
    # Titre Anton : la taille la plus grande qui tient dans la colonne de gauche.
    col_w, max_h = art_box[0] - 64 - 36, 420
    size = 150
    while size > 40:
        f = ImageFont.truetype(str(ANTON), size)
        widths = [d.textlength(l, font=f) for l in lines]
        if max(widths) <= col_w and size * 1.1 * len(lines) <= max_h:
            break
        size -= 2
    f = ImageFont.truetype(str(ANTON), size)
    lh = round(size * 1.1)
    y = (H - lh * len(lines)) // 2 - 10
    bg_mid = mix(top, bottom, 0.5)
    for i, l in enumerate(lines):
        color = mix(fg, bg_mid, 0.42) if i >= dim_from else fg
        d.text((64, y + i * lh), l, font=f, fill=color + (255,), anchor='la')
    small = ImageFont.truetype(str(ALLO), 30)
    logo = ImageFont.truetype(str(ALLO), 40)
    d.text((64, 52), 'minimoa', font=logo, fill=fg + (255,))
    lw = d.textlength('minimoa', font=logo)
    d.text((64 + lw, 52), '.', font=logo, fill=((255, 184, 0) if fg != INK else INK) + (255,))
    d.text((64, H - 60), tagline, font=small, fill=mix(fg, bg_mid, 0.75) + (255,), anchor='ls')
    x0, y0, x1, y1 = art_box
    a = art.copy()
    k = min((x1 - x0) / a.width, (y1 - y0) / a.height)
    a = a.resize((round(a.width * k), round(a.height * k)), Image.LANCZOS)
    pad = 48
    sa = Image.new('L', (a.width + pad * 2, a.height + pad * 2), 0)
    sa.paste(a.getchannel('A').point(lambda v: round(v * 0.32)), (pad, pad))
    shadow = Image.new('RGBA', sa.size, (20, 10, 30, 0))
    shadow.putalpha(sa.filter(ImageFilter.GaussianBlur(16)))
    ax, ay = x0 + ((x1 - x0) - a.width) // 2, y1 - a.height
    sx, sy = ax + 6 - pad, ay + 18 - pad
    layer = Image.new('RGBA', im.size, (0, 0, 0, 0))
    layer.paste(shadow, (sx, sy))
    im.alpha_composite(layer)
    im.alpha_composite(a, (ax, ay))
    OG.mkdir(parents=True, exist_ok=True)
    im.convert('RGB').save(OG / f'{name}.jpg', 'JPEG', quality=86, optimize=True, progressive=True)


def row(names: list[str], gap: float = -0.12, scales: list[float] | None = None) -> Image.Image:
    """Plusieurs minimoas côte à côte, pieds alignés."""
    ims = [pet(n) if isinstance(n, str) else n for n in names]
    ims = [i.crop(i.getbbox()) for i in ims]
    scales = scales or [1.0] * len(ims)
    ims = [i.resize((round(i.width * s), round(i.height * s)), Image.LANCZOS) for i, s in zip(ims, scales)]
    step = [round(i.width * (1 + gap)) for i in ims]
    w = sum(step[:-1]) + ims[-1].width
    h = max(i.height for i in ims)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    x = 0
    order = sorted(range(len(ims)), key=lambda k: scales[k])  # les plus grands devant
    xs = []
    for i, s in zip(ims, step):
        xs.append(x)
        x += s
    for k in order:
        out.alpha_composite(ims[k], (xs[k], h - ims[k].height))
    return out


def main() -> None:
    placements = json.loads(Path(sys.argv[1]).read_text()) if len(sys.argv) > 1 else []
    OUT.mkdir(parents=True, exist_ok=True)

    # Poses en pied (toile 900 × 1000 réduite : 450 × 500, 2× pour ~225 px affichés ; héros plus grand).
    for s in SPECIES:
        for pose in CARE_POSES + EXTRA[s]:
            save_webp(pet(f'{s}_corps_{pose}'), OUT / f'{s}_{pose}.webp', 450, 78)
    save_webp(pet('nino_corps_coucou'), OUT / 'hero_nino.webp', 720, 80)
    for e in EVO:
        save_webp(pet(f'nino_evo_{e}'), OUT / f'nino_evo_{e}.webp', 450, 78)
    for m in MISC:
        src = Image.open(ASSETS / 'misc' / f'{m}.webp').convert('RGBA')
        save_webp(src.crop(src.getbbox()), OUT / f'obj_{m}.webp', 160, 80)

    # Minimoas habillés (garde-robe), toile commune 600 × 720 pour aligner les pieds.
    dressed_ims = {}
    for o in placements:
        im = fit_canvas(dressed(o), 900, 1080, 0.97)
        dressed_ims[o['name']] = im
        save_webp(im, OUT / f"tenue_{o['name']}.webp", 500, 80)

    # Bande finale : les quatre qui font la fête.
    band = row(['nino_corps_danse', 'suzie_corps_fete', 'gaston_corps_applaudit', 'pia_corps_rit'], -0.14, [1.0, 0.94, 0.92, 0.96])
    save_webp(band, OUT / 'bande_fete.webp', 1200, 80)
    duo = row(['nino_corps_check', ImageOps.mirror(pet('pia_corps_check'))], -0.2)
    save_webp(duo, OUT / 'duo_check.webp', 700, 80)
    groupe = row(['suzie_corps_joie', 'nino_corps_check', 'gaston_corps_applaudit'], -0.18, [0.92, 1.0, 0.9])
    save_webp(groupe, OUT / 'groupe.webp', 700, 80)

    # Aperçus de liens (1200 × 630). Textes en français : la langue du site au moment du partage.
    tag = 'minimoa.app'
    trio = row(['suzie_corps_joie', 'nino_corps_coucou', 'pia_corps_coucou'], -0.3, [0.78, 1.0, 0.8])
    og('accueil', 'accent', ['ÉLÈVE TON', 'MINIMOA.', 'IL TE PRÉSENTE', 'DU MONDE.'], 2, trio, (620, 60, 1180, 610), tag)
    og('i', 'violet', ['ON T’INVITE', 'SUR MINIMOA.'], 1, pet('nino_corps_coucou'), (760, 70, 1150, 600), tag)
    og('m', 'rose', ['DÉCRIS-MOI', 'EN 3 MOTS.', 'SOIS SYMPA.'], 1, pet('nino_corps_timide'), (770, 80, 1150, 600), 'Anonyme, et seulement des mots gentils')
    og('g', 'violet', ['TON GROUPE', 'T’ATTEND.'], 1, groupe, (650, 110, 1180, 610), tag)
    og('r', 'coral', ['UN MINIMOA', 'VEUT TE DIRE', 'SALUT.'], 2, duo, (650, 110, 1180, 610), tag)
    og('l', 'wine', ['TON LIEN', 'T’ATTEND.'], 1, row(['nino_corps_coucou', 'suzie_corps_coucou'], -0.16), (650, 110, 1180, 610), tag)
    og('plus', 'night', ['MINIMOA+'], 9, dressed_ims.get('pia_hiver', pet('pia_corps_neutre')), (720, 50, 1150, 610), 'minimoa.app/plus')
    og('defi', 'orange', ['LE DÉFI', 'DU JOUR.'], 1, pet('nino_corps_pense'), (770, 80, 1150, 600), tag)
    og('habitudes', 'accent', ['TIENS TES', 'HABITUDES.', 'À PLUSIEURS.'], 2, groupe, (650, 110, 1180, 610), tag)
    og('carte', 'night', ['LA CARTE', 'DES MINIMOAS.'], 1, pet('nino_corps_marche'), (770, 80, 1150, 600), 'Position arrondie, jamais en direct')

    # Icônes : Apple (180 × 180, fond jaune, Nino de face), PNG 32 × 32 et 192 × 192 de repli.
    face = Image.open(ASSETS / 'pets/nino_face.webp').convert('RGBA')
    for size, name in [(180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png'), (32, 'favicon-32.png')]:
        bg = vgrad(size, size, (255, 210, 63), (255, 176, 0))
        f = face.resize((round(size * 0.9), round(size * 0.9)), Image.LANCZOS)
        bg.alpha_composite(f, ((size - f.width) // 2, round(size * 0.1)))
        bg.convert('RGB').save(PUB / name, 'PNG', optimize=True)

    # Anton auto-hébergée : sous-ensemble latin (français, anglais, espagnol, portugais, néerlandais), woff2.
    from fontTools import subset
    font_dir = PUB / 'fonts/anton'
    font_dir.mkdir(parents=True, exist_ok=True)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    f = subset.load_font(str(ANTON), opts)
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=list(range(0x20, 0x7F)) + list(range(0xA0, 0x180)) + [0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x2013, 0x2014, 0x20AC, 0x2022, 0x00B7, 0x202F, 0x2009, 0x2B])
    sub.subset(f)
    subset.save_font(f, str(font_dir / 'Anton.woff2'), opts)
    print('ok :', OUT, OG)


if __name__ == '__main__':
    main()
