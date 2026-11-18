"""Images des e-mails de Minimoa (packages/content/src/email), servies par le site sous https://minimoa.app/email/.

PNG (les clients de messagerie ne lisent pas tous le WebP), fond transparent, en 2x : chaque image est affichée à la
moitié de sa taille (largeur et hauteur écrites dans `packages/content/src/email/art.ts`). Réduites avec pngquant
quand il est installé (sinon Pillow, palette adaptative).

Usage (depuis la racine du dépôt) :
  python3 -I apps/web/scripts/email-images.py
Le script affiche les tailles affichées : les reporter dans art.ts si une pose change.
Dépendances : Pillow ; pngquant (facultatif, recommandé).
"""
import shutil
import subprocess
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
PETS = ROOT / 'packages/ui/assets/pets'
WEB_IMG = ROOT / 'apps/web/public/img/m'
OUT = ROOT / 'apps/web/public/email'

# nom de sortie → (source, hauteur affichée en px CSS ; l'image fait le double)
SCENES = {
    'nino-coucou': (PETS / 'nino_corps_coucou.webp', 210),
    'suzie-coucou': (PETS / 'suzie_corps_coucou.webp', 200),
    'gaston-joie': (PETS / 'gaston_corps_joie.webp', 200),
    'pia-assis': (PETS / 'pia_corps_assis.webp', 180),
    'gaston-neutre': (PETS / 'gaston_corps_neutre.webp', 190),
    'suzie-dodo': (PETS / 'suzie_corps_dodo.webp', 170),
    'pia-fete': (PETS / 'pia_corps_fete.webp', 200),
    'gaston-pense': (PETS / 'gaston_corps_pense.webp', 190),
    'suzie-timide': (PETS / 'suzie_corps_timide.webp', 190),
    'nino-pense': (PETS / 'nino_corps_pense.webp', 200),
    'gaston-assis': (PETS / 'gaston_corps_assis.webp', 170),
    'nino-check': (PETS / 'nino_corps_check.webp', 200),
    'pia-check': (PETS / 'pia_corps_check.webp', 120),
    'nino-accueil': (PETS / 'nino_corps_accueil.webp', 200),
    'duo-rencontre': (WEB_IMG / 'hero_rencontre.webp', 190),
    'bande-fete': (WEB_IMG / 'bande_fete.webp', 180),
}
# Têtes du pied de page : les quatre minimoas, côte à côte.
FACES = ['nino', 'suzie', 'gaston', 'pia']
FACE_H = 34


def trimmed(path: Path) -> Image.Image:
    im = Image.open(path).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    return im.crop(box) if box else im


def fit_height(im: Image.Image, h: int) -> Image.Image:
    w = round(im.width * h / im.height / 2) * 2  # pair : la taille affichée (moitié) reste entière
    return im.resize((w, h), Image.LANCZOS)


def save(im: Image.Image, name: str) -> Path:
    path = OUT / f'{name}.png'
    if shutil.which('pngquant'):
        tmp = OUT / f'.{name}.raw.png'
        im.save(tmp, optimize=True)
        subprocess.run(['pngquant', '--force', '--strip', '--quality=40-90', '--speed=1', '--output', str(path), str(tmp)], check=True)
        tmp.unlink()
    else:
        im.quantize(colors=256, method=Image.FASTOCTREE, dither=Image.FLOYDSTEINBERG).save(path, optimize=True)
    return path


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sizes = {}
    for name, (src, h) in SCENES.items():
        im = fit_height(trimmed(src), h * 2)
        path = save(im, name)
        sizes[name] = (im.width // 2, im.height // 2, path.stat().st_size)
    faces = [fit_height(trimmed(PETS / f'{s}_face.webp'), FACE_H * 2) for s in FACES]
    gap = 8
    band = Image.new('RGBA', (sum(f.width for f in faces) + gap * (len(faces) - 1), FACE_H * 2), (0, 0, 0, 0))
    x = 0
    for f in faces:
        band.alpha_composite(f, (x, 0))
        x += f.width + gap
    path = save(band, 'bande-tetes')
    sizes['bande-tetes'] = (band.width // 2, band.height // 2, path.stat().st_size)
    for name, (w, h, b) in sizes.items():
        print(f'{name}: {w} × {h} px, {b // 1024} Ko')


if __name__ == '__main__':
    main()
