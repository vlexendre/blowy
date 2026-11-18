"""Images du site minimoa.app, tirées du pack des minimoas (packages/ui/assets) : poses en pied réduites, minimoas
habillés (capturés dans l'app), la boucle du hero (soin → rencontre), bande finale, poses du quiz « Quel minimoa es-tu ? »,
aperçus de liens (Open Graph 1200 × 630) en Allo ExtraBold (la police du site), favicon et icône Apple.

Usage (depuis la racine du dépôt) :
  python3 -I apps/web/scripts/site-images/build.py
  python3 -I apps/web/scripts/site-images/build.py --boucle   # seulement le hero et l'aperçu de la landing (cinq langues)
  node apps/web/scripts/site-images/looks.mjs http://localhost:8081 /tmp/minimoa-looks   # tenues rendues par l'app
  python3 -I apps/web/scripts/site-images/build.py --looks /tmp/minimoa-looks              # → img/m/tenue_*.webp
  python3 -I apps/web/scripts/site-images/build.py --og-locales   # seulement les aperçus traduits (og/<langue>/)
  pnpm exec tsx apps/web/scripts/site-images/editorial-og.mts > /tmp/minimoa-og-pages.json
  python3 -I apps/web/scripts/site-images/build.py --og-pages /tmp/minimoa-og-pages.json   # villes et guides (og/villes/, og/guides/)
Dépendances : Pillow (webp). Sorties dans apps/web/public (fichiers versionnés).
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[4]
ASSETS = ROOT / 'packages/ui/assets'
PUB = ROOT / 'apps/web/public'
OUT = PUB / 'img/m'
OG = PUB / 'og'
ALLO = ROOT / 'apps/mobile/assets/fonts/allo/Allo-ExtraBold.otf'
ALLO_BOLD = ROOT / 'apps/mobile/assets/fonts/allo/Allo-Bold.otf'

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
# Résultat du quiz : une pose par caractère, sur l'espèce qui le porte (TRAIT_SPECIES et TRAIT_POSE du domaine).
QUIZ_POSES = {
    'sociable': 'nino_corps_coucou', 'joueur': 'nino_corps_danse', 'tendre': 'suzie_corps_joie', 'bavard': 'suzie_corps_rit',
    'pose': 'gaston_corps_pense', 'casanier': 'gaston_corps_assis', 'piquant': 'pia_corps_fier', 'discret': 'pia_corps_timide',
}
MISC = ['pomme', 'balle', 'coussin', 'peluche', 'canard', 'medaille', 'coffre', 'cookie', 'plante', 'lampe']


def pet(name: str) -> Image.Image:
    return Image.open(ASSETS / 'pets' / f'{name}.webp').convert('RGBA')


def save_webp(im: Image.Image, path: Path, width: int, q: int = 80) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    h = round(im.height * width / im.width)
    im.resize((width, h), Image.LANCZOS).save(path, 'WEBP', quality=q, method=6)


# ── Minimoas habillés ──────────────────────────────────────────────────────────────────────────────────────────────

# Les tenues de la garde-robe sont capturées dans l'app (DressedPet, route /dev/look : scripts/site-images/looks.mjs),
# puis posées ici sur la toile commune (`--looks <dossier>`) : img/m/tenue_<nom>.webp, 500 × 600, pieds alignés.

def looks(src_dir: str) -> None:
    for f in sorted(Path(src_dir).glob('*.png')):
        im = Image.open(f).convert('RGBA')
        im = fit_canvas(im.crop(im.getbbox()), 900, 1080, 0.97)
        save_webp(im, OUT / f'tenue_{f.stem}.webp', 500, 80)
        print('tenue :', f.stem)


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


def og(name: str, panel: str, lines: list[str], dim_from: int, art: Image.Image, art_box: tuple, tagline: str, out_dir: Path | None = None) -> None:
    W, H = 1200, 630
    top, bottom, fg = PANELS[panel]
    im = vgrad(W, H, top, bottom)
    glow(im, (980, 120), 360, (255, 255, 255), 46)
    if panel == 'night':
        glow(im, (1000, 520), 340, (109, 61, 240), 90)
    d = ImageDraw.Draw(im)
    # Titre en Allo ExtraBold (la police du site) : la taille la plus grande qui tient dans la colonne de gauche ;
    # interlignage serré (assez pour les accents des capitales) pour garder l'impact.
    col_w, max_h = art_box[0] - 64 - 36, 420
    size = 130
    while size > 36:
        f = ImageFont.truetype(str(ALLO), size)
        if max(d.textlength(l, font=f) for l in lines) <= col_w and size * 1.12 * len(lines) <= max_h:
            break
        size -= 2
    f = ImageFont.truetype(str(ALLO), size)
    lh = round(size * 1.12)
    y = (H - lh * len(lines)) // 2 - 10
    bg_mid = mix(top, bottom, 0.5)
    for i, l in enumerate(lines):
        color = mix(fg, bg_mid, 0.42) if i >= dim_from else fg
        d.text((64, y + i * lh), l, font=f, fill=color + (255,), anchor='la')
    small = ImageFont.truetype(str(ALLO_BOLD), 30)
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
    out = out_dir or OG
    out.mkdir(parents=True, exist_ok=True)
    im.convert('RGB').save(out / f'{name}.jpg', 'JPEG', quality=86, optimize=True, progressive=True)


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


# Aperçus des pages indexées traduites (landing, quiz, quartier) : og/<langue>/<page>.jpg, mêmes scènes que le
# français. Les pages de partage (/m/, /i/, /g/…) gardent l'aperçu français : une adresse pour toutes les langues, et les
# robots d'aperçu ne lancent pas le script qui choisit la langue.
OG_LOCALES = {
    'en': {'quiz': ['WHICH', 'MINIMOA', 'ARE YOU?'], 'quartier': ['YOUR', 'NEIGHBORHOOD', 'OPENS AT 50.']},
    'es': {'quiz': ['¿QUÉ', 'MINIMOA', 'ERES?'], 'quartier': ['TU BARRIO', 'ABRE CON 50.']},
    'pt': {'quiz': ['QUAL', 'MINIMOA', 'É VOCÊ?'], 'quartier': ['SEU BAIRRO', 'ABRE COM 50.']},
    'nl': {'quiz': ['WELKE', 'MINIMOA', 'BEN JIJ?'], 'quartier': ['JE BUURT', 'GAAT OPEN', 'BIJ 50.']},
}


def og_locales() -> None:
    quatre = row(['gaston_corps_pense', 'suzie_corps_joie', 'nino_corps_coucou', 'pia_corps_fier'], -0.22, [0.84, 0.9, 1.0, 0.88])
    groupe = row(['suzie_corps_joie', 'nino_corps_check', 'gaston_corps_applaudit'], -0.18, [0.92, 1.0, 0.9])
    for loc, t in OG_LOCALES.items():
        out = OG / loc
        og_boucle(loc)
        og('quiz', 'violet', t['quiz'], 9, quatre, (600, 120, 1180, 610), f'minimoa.app/{loc}/quiz', out)
        og('quartier', 'accent', t['quartier'], 1, groupe, (650, 110, 1180, 610), f'minimoa.app/{loc}/quartier', out)
    print('ok :', ', '.join(str(OG / l) for l in OG_LOCALES))


# ── La boucle : tu prends soin de ton minimoa → il te présente quelqu'un ───────────────────────────────────────────
# Visuels du hero (img/m/hero_soin.webp, img/m/hero_rencontre.webp, même échelle : le texte est dans la page) et aperçu
# de lien de la landing (og/accueil.jpg et og/<langue>/accueil.jpg) : deux cartes, le soin puis la rencontre.

BOUCLE_TEXT = {
    'fr': {'title': ['PRENDS SOIN DE TON MINIMOA.', 'IL TE PRÉSENTE DES POTES.'], 'care': 'Nourrir · Jouer · Câlin', 'wave': 'Léa te fait signe', 'near': 'Près de chez toi'},
    'en': {'title': ['TAKE CARE OF YOUR MINIMOA.', 'IT INTRODUCES YOU TO FRIENDS.'], 'care': 'Feed · Play · Cuddle', 'wave': 'Léa is waving at you', 'near': 'Near you'},
    'es': {'title': ['CUIDA DE TU MINIMOA.', 'TE PRESENTA A AMIGOS.'], 'care': 'Comer · Jugar · Mimos', 'wave': 'Léa te saluda', 'near': 'Cerca de ti'},
    'pt': {'title': ['CUIDE DO SEU MINIMOA.', 'ELE TE APRESENTA AMIGOS.'], 'care': 'Comer · Brincar · Carinho', 'wave': 'Léa acenou para você', 'near': 'Perto de você'},
    'nl': {'title': ['ZORG VOOR JE MINIMOA.', 'HIJ STELT JE VRIENDEN VOOR.'], 'care': 'Eten · Spelen · Knuffel', 'wave': 'Léa zwaait naar je', 'near': 'Bij jou in de buurt'},
}


def boucle_art() -> tuple[Image.Image, Image.Image]:
    """Nino qui mange (le soin) et Nino qui fait un check à Suzie, le minimoa de Léa (la rencontre), à la même échelle."""
    soin = pet('nino_corps_mange')
    soin = soin.crop(soin.getbbox())
    rencontre = row(['nino_corps_check', ImageOps.mirror(pet('suzie_corps_check'))], -0.2)
    return soin, rencontre


def hero_boucle() -> None:
    soin, rencontre = boucle_art()
    k = 760 / rencontre.height  # 2× la hauteur affichée (≈ 380 px)
    save_webp(soin, OUT / 'hero_soin.webp', round(soin.width * k), 80)
    save_webp(rencontre, OUT / 'hero_rencontre.webp', round(rencontre.width * k), 80)
    print('hero :', soin.height / rencontre.height, 'hauteur relative du soin')


def rounded(size: tuple[int, int], r: int, fill: tuple) -> Image.Image:
    im = Image.new('RGBA', size, (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), r, fill=fill)
    return im


def pill(im: Image.Image, center: tuple[int, int], text: str, font: ImageFont.FreeTypeFont, fg: tuple, bg: tuple, avatar: Image.Image | None = None, pad: int = 18, max_w: int = 10_000) -> None:
    """Pastille arrondie (avec un visage rond à gauche si `avatar`), police réduite si elle dépasse `max_w`."""
    d = ImageDraw.Draw(im)
    while True:
        tw = d.textlength(text, font=font)
        h = round(font.size * 1.9)
        aw = (h - 10 + 8) if avatar is not None else 0
        if tw + pad * 2 + aw <= max_w or font.size <= 18:
            break
        font = ImageFont.truetype(font.path, font.size - 1)
    w = round(tw + pad * 2 + aw)
    x, y = center[0] - w // 2, center[1] - h // 2
    sh = Image.new('RGBA', im.size, (0, 0, 0, 0))
    sh.alpha_composite(rounded((w, h), h // 2, (20, 16, 31, 70)), (x, y + 6))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)))
    im.alpha_composite(rounded((w, h), h // 2, bg + (255,)), (x, y))
    if avatar is not None:
        a = avatar.resize((h - 10, h - 10), Image.LANCZOS)
        m = Image.new('L', a.size, 0)
        ImageDraw.Draw(m).ellipse((0, 0, a.width - 1, a.height - 1), fill=255)
        disc = Image.new('RGBA', a.size, (255, 196, 223, 255))
        disc.alpha_composite(a)
        im.paste(disc, (x + 5 + pad // 3, y + 5), m)
        x += aw - pad // 3
    ImageDraw.Draw(im).text((x + pad, y + h / 2), text, font=font, fill=fg + (255,), anchor='lm')


def og_boucle(locale: str) -> None:
    t = BOUCLE_TEXT[locale]
    W, H, M = 1200, 630, 64
    top, bottom, fg = PANELS['accent']
    im = vgrad(W, H, top, bottom)
    glow(im, (980, 120), 360, (255, 255, 255), 46)
    d = ImageDraw.Draw(im)
    logo = ImageFont.truetype(str(ALLO), 36)
    d.text((M, M), 'minimoa', font=logo, fill=fg + (255,), anchor='la')
    lw = d.textlength('minimoa', font=logo)
    d.text((M + lw, M), '.', font=logo, fill=INK + (255,), anchor='la')
    small = ImageFont.truetype(str(ALLO_BOLD), 28)
    bg_mid = mix(top, bottom, 0.5)
    d.text((W - M, M + 4), 'minimoa.app', font=small, fill=mix(fg, bg_mid, 0.75) + (255,), anchor='ra')
    # Titre : deux lignes, la plus grande taille qui tient dans la largeur utile.
    size = 72
    while size > 30:
        f = ImageFont.truetype(str(ALLO), size)
        if max(d.textlength(l, font=f) for l in t['title']) <= W - 2 * M:
            break
        size -= 1
    f = ImageFont.truetype(str(ALLO), size)
    lh = round(size * 1.08)
    y0 = 128
    for i, l in enumerate(t['title']):
        d.text((M, y0 + i * lh), l, font=f, fill=(fg if i == 0 else mix(fg, bg_mid, 0.42)) + (255,), anchor='la')
    # Deux cartes : le soin, puis la rencontre (flèche entre les deux).
    soin, rencontre = boucle_art()
    cy0, cy1 = y0 + 2 * lh + 22, H - M
    ch = cy1 - cy0
    gap = 62
    c1w = 318
    c2w = W - 2 * M - c1w - gap
    cards = Image.new('RGBA', im.size, (0, 0, 0, 0))
    cards.alpha_composite(rounded((c1w, ch), 34, (255, 255, 255, 92)), (M, cy0))
    cards.alpha_composite(rounded((c2w, ch), 34, (255, 255, 255, 92)), (M + c1w + gap, cy0))
    im.alpha_composite(cards)
    # Pieds sur le bas de la carte (un peu de marge), même échelle pour les deux scènes.
    k = (ch - 50) / rencontre.height
    r = rencontre.resize((round(rencontre.width * k), round(rencontre.height * k)), Image.LANCZOS)
    s_ = soin.resize((round(soin.width * k), round(soin.height * k)), Image.LANCZOS)
    foot = cy1 - 30
    x2 = M + c1w + gap
    im.alpha_composite(s_, (M + (c1w - s_.width) // 2, foot - s_.height))
    im.alpha_composite(r, (x2 + 66, foot - r.height))
    room = (x2 + 66 + r.width + 4, W - M - 14)  # place libre à droite de la scène
    side = sum(room) // 2  # centre de la place libre à droite de la scène
    # Pastilles (dans la carte, à l'abri des bords).
    lab = ImageFont.truetype(str(ALLO_BOLD), 25)
    pill(im, (M + c1w // 2, cy1 - 30), t['care'], lab, (255, 255, 255), INK, max_w=c1w - 24)
    face = Image.open(ASSETS / 'pets/suzie_face.webp').convert('RGBA')
    pill(im, (side, cy0 + ch // 2 - 34), t['wave'], ImageFont.truetype(str(ALLO_BOLD), 26), INK, (255, 255, 255), face, max_w=room[1] - room[0])
    pill(im, (side, cy0 + ch // 2 + 34), t['near'], lab, (255, 255, 255), INK, max_w=room[1] - room[0])
    # Numéros et flèche.
    num = ImageFont.truetype(str(ALLO), 30)
    for i, x in enumerate([M + 20, M + c1w + gap + 20]):
        d = ImageDraw.Draw(im)
        d.ellipse((x, cy0 + 16, x + 44, cy0 + 60), fill=INK + (255,))
        d.text((x + 22, cy0 + 39), str(i + 1), font=num, fill=(255, 210, 63, 255), anchor='mm')
    ax0, ax1, ay = M + c1w + 12, M + c1w + gap - 12, cy0 + ch // 2
    d.line((ax0, ay, ax1 - 6, ay), fill=INK + (255,), width=8)
    d.polygon([(ax1, ay), (ax1 - 20, ay - 16), (ax1 - 20, ay + 16)], fill=INK + (255,))
    out = OG if locale == 'fr' else OG / locale
    out.mkdir(parents=True, exist_ok=True)
    im.convert('RGB').save(out / 'accueil.jpg', 'JPEG', quality=86, optimize=True, progressive=True)
    print('aperçu :', out / 'accueil.jpg')


def boucle() -> None:
    hero_boucle()
    for loc in BOUCLE_TEXT:
        og_boucle(loc)


# Aperçus des pages villes et guides (français seulement) : og/villes.jpg, og/villes/<ville>.jpg, og/guides.jpg,
# og/guides/<guide>.jpg. Titres et fonds lus dans content/editorial (scripts/site-images/editorial-og.mts).
def og_pages(specs_path: str) -> None:
    arts = {
        'trio': (row(['suzie_corps_joie', 'nino_corps_coucou', 'pia_corps_coucou'], -0.3, [0.78, 1.0, 0.8]), (620, 60, 1180, 610)),
        'groupe': (row(['suzie_corps_joie', 'nino_corps_check', 'gaston_corps_applaudit'], -0.18, [0.92, 1.0, 0.9]), (650, 110, 1180, 610)),
        'duo': (row(['nino_corps_check', ImageOps.mirror(pet('pia_corps_check'))], -0.2), (650, 110, 1180, 610)),
        'quatre': (row(['gaston_corps_pense', 'suzie_corps_joie', 'nino_corps_coucou', 'pia_corps_fier'], -0.22, [0.84, 0.9, 1.0, 0.88]), (600, 120, 1180, 610)),
        'timide': (pet('nino_corps_timide'), (770, 80, 1150, 600)),
        'marche': (pet('nino_corps_marche'), (770, 80, 1150, 600)),
        'pense': (pet('nino_corps_pense'), (770, 80, 1150, 600)),
    }
    specs = json.loads(Path(specs_path).read_text())
    for s in specs:
        art, box = arts[s['art']]
        out = OG / Path(s['out']).parent
        og(Path(s['out']).name, s['panel'], s['lines'], 99, art, box, s['tag'], out)
    print('ok :', len(specs), 'aperçus dans', OG)


def main() -> None:
    if '--og-locales' in sys.argv:
        og_locales()
        return
    if '--og-pages' in sys.argv:
        og_pages(sys.argv[sys.argv.index('--og-pages') + 1])
        return
    if '--looks' in sys.argv:
        looks(sys.argv[sys.argv.index('--looks') + 1])
        return
    if '--boucle' in sys.argv:
        boucle()
        return
    OUT.mkdir(parents=True, exist_ok=True)

    # Poses en pied (toile 900 × 1000 réduite : 450 × 500, 2× pour ~225 px affichés ; héros plus grand).
    for s in SPECIES:
        for pose in CARE_POSES + EXTRA[s]:
            save_webp(pet(f'{s}_corps_{pose}'), OUT / f'{s}_{pose}.webp', 450, 78)
    for e in EVO:
        save_webp(pet(f'nino_evo_{e}'), OUT / f'nino_evo_{e}.webp', 450, 78)
    for m in MISC:
        src = Image.open(ASSETS / 'misc' / f'{m}.webp').convert('RGBA')
        save_webp(src.crop(src.getbbox()), OUT / f'obj_{m}.webp', 160, 80)

    # Quiz : une pose par caractère (720 de large : la carte story les dessine en grand).
    for trait, name in QUIZ_POSES.items():
        save_webp(pet(name).crop(pet(name).getbbox()), OUT / f'quiz_{trait}.webp', 720, 82)

    # Minimoas habillés (garde-robe) : capturés dans l'app (`--looks`), relus ici pour l'aperçu de Minimoa+.
    pia_hiver = OUT / 'tenue_pia_hiver.webp'
    pia_hiver = Image.open(pia_hiver).convert('RGBA') if pia_hiver.exists() else pet('pia_corps_neutre')

    # Bande finale : les quatre qui font la fête.
    band = row(['nino_corps_danse', 'suzie_corps_fete', 'gaston_corps_applaudit', 'pia_corps_rit'], -0.14, [1.0, 0.94, 0.92, 0.96])
    save_webp(band, OUT / 'bande_fete.webp', 1200, 80)
    duo = row(['nino_corps_check', ImageOps.mirror(pet('pia_corps_check'))], -0.2)
    save_webp(duo, OUT / 'duo_check.webp', 700, 80)
    groupe = row(['suzie_corps_joie', 'nino_corps_check', 'gaston_corps_applaudit'], -0.18, [0.92, 1.0, 0.9])
    save_webp(groupe, OUT / 'groupe.webp', 700, 80)

    # Aperçus de liens (1200 × 630). Textes en français : la langue du site au moment du partage.
    tag = 'minimoa.app'
    boucle()  # hero et aperçu de la landing (cinq langues)
    og('i', 'violet', ['ON T’INVITE', 'SUR MINIMOA.'], 1, pet('nino_corps_coucou'), (760, 70, 1150, 600), tag)
    og('m', 'rose', ['DÉCRIS-MOI', 'EN 3 MOTS.', 'SOIS SYMPA.'], 1, pet('nino_corps_timide'), (770, 80, 1150, 600), 'Anonyme, et seulement des mots gentils')
    og('g', 'violet', ['TON GROUPE', 'T’ATTEND.'], 1, groupe, (650, 110, 1180, 610), tag)
    og('r', 'coral', ['UN MINIMOA', 'VEUT TE DIRE', 'SALUT.'], 2, duo, (650, 110, 1180, 610), tag)
    og('l', 'wine', ['TON LIEN', 'T’ATTEND.'], 1, row(['nino_corps_coucou', 'suzie_corps_coucou'], -0.16), (650, 110, 1180, 610), tag)
    og('plus', 'night', ['MINIMOA+'], 9, pia_hiver.crop(pia_hiver.getbbox()), (720, 50, 1150, 610), 'minimoa.app/plus')
    og('defi', 'orange', ['LE DÉFI', 'DU JOUR.'], 1, pet('nino_corps_pense'), (770, 80, 1150, 600), tag)
    og('habitudes', 'accent', ['TIENS TES', 'HABITUDES.', 'À PLUSIEURS.'], 2, groupe, (650, 110, 1180, 610), tag)
    og('carte', 'night', ['LA CARTE', 'DES MINIMOAS.'], 1, pet('nino_corps_marche'), (770, 80, 1150, 600), 'Position arrondie, jamais en direct')
    quatre = row(['gaston_corps_pense', 'suzie_corps_joie', 'nino_corps_coucou', 'pia_corps_fier'], -0.22, [0.84, 0.9, 1.0, 0.88])
    og('quiz', 'violet', ['QUEL', 'MINIMOA', 'ES-TU ?'], 9, quatre, (600, 120, 1180, 610), 'minimoa.app/quiz')
    og('quartier', 'accent', ['TON QUARTIER', 'OUVRE À 50.'], 1, groupe, (650, 110, 1180, 610), 'minimoa.app/quartier')
    og_locales()

    # Icônes : Apple (180 × 180, fond jaune, Nino de face), PNG 32 × 32 et 192 × 192 de repli.
    face = Image.open(ASSETS / 'pets/nino_face.webp').convert('RGBA')
    for size, name in [(180, 'apple-touch-icon.png'), (192, 'icon-192.png'), (512, 'icon-512.png'), (32, 'favicon-32.png')]:
        bg = vgrad(size, size, (255, 210, 63), (255, 176, 0))
        f = face.resize((round(size * 0.9), round(size * 0.9)), Image.LANCZOS)
        bg.alpha_composite(f, ((size - f.width) // 2, round(size * 0.1)))
        bg.convert('RGB').save(PUB / name, 'PNG', optimize=True)

    print('ok :', OUT, OG)


if __name__ == '__main__':
    main()
