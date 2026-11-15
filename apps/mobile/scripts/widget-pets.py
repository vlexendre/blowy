#!/usr/bin/env python3
"""
Images des minimoas pour l'extension iOS (widgets et activités en direct), tirées de packages/ui/assets/pets.

Apple demande des images d'activité en direct pas plus grandes que leur emplacement : on les réduit ici une fois
pour toutes, en PNG @3x, dans le catalogue `targets/widget/Pets.xcassets` (versionné). À relancer seulement si
les illustrations changent :

    python3 apps/mobile/scripts/widget-pets.py      (demande Pillow : pip install pillow)
"""
import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "packages/ui/assets/pets"
OUT = ROOT / "apps/mobile/targets/widget/Pets.xcassets"

SPECIES = ["nino", "suzie", "gaston", "pia"]
# Bustes (forme : en forme → joie, bof → neutre, boude → triste) : ~110 pt de haut dans le widget moyen.
BUSTS = {"joie": 330, "neutre": 330, "triste": 330}
# Visages carrés : rond de l'écran verrouillé (~72 pt) et Dynamic Island / bannière (~44 pt au plus).
FACES = {"face": 216, "face_small": 132}


def write_imageset(name: str, image: Image.Image) -> None:
    folder = OUT / f"{name}.imageset"
    folder.mkdir(parents=True, exist_ok=True)
    image.save(folder / f"{name}.png", optimize=True)
    contents = {
        "images": [{"idiom": "universal", "filename": f"{name}.png", "scale": "3x"}],
        "info": {"author": "xcode", "version": 1},
    }
    (folder / "Contents.json").write_text(json.dumps(contents, indent=2) + "\n")


def fit_height(image: Image.Image, height: int) -> Image.Image:
    width = round(image.width * height / image.height)
    return image.resize((width, height), Image.LANCZOS)


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    (OUT / "Contents.json").write_text(json.dumps({"info": {"author": "xcode", "version": 1}}, indent=2) + "\n")
    for species in SPECIES:
        for pose, height in BUSTS.items():
            src = Image.open(SRC / f"{species}_{pose}.webp").convert("RGBA")
            write_imageset(f"{species}_{pose}", fit_height(src, height))
        face = Image.open(SRC / f"{species}_face.webp").convert("RGBA")
        for name, size in FACES.items():
            write_imageset(f"{species}_{name}", face.resize((size, size), Image.LANCZOS))
    print(f"{len(list(OUT.glob('*.imageset')))} images dans {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
