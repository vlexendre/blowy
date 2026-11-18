#!/usr/bin/env bash
# Police du site (Allo, OFL 1.1, sans nom réservé) réduite à ce que le site affiche : alphabet latin (Latin-1 et
# Latin étendu A, assez pour fr, en, es, pt, nl), ponctuation, €, flèches ; graisses 400 à 800 (les seules du CSS) ;
# fonctionnalités OpenType par défaut des navigateurs. L'axe « opsz » est gardé (titres et texte n'ont pas le même
# dessin). 229 Ko → ~120 Ko. Le nom porte l'empreinte du fichier : il peut être mis en cache un an (public/_headers).
# Source : la police complète, gardée par l'administration (apps/admin/public/fonts/allo).
# Usage (racine du dépôt) : bash apps/web/scripts/fonts/subset-allo.sh   — puis mettre le nom affiché dans
# src/layouts/Base.astro (ALLO_FONT). Dépendances : fonttools, brotli (pip install fonttools brotli).
set -euo pipefail
ROOT=$(cd "$(dirname "$0")/../../../.." && pwd)
SRC=$ROOT/apps/admin/public/fonts/allo/AlloVariableFriendly.woff2
OUT=$ROOT/apps/web/public/fonts/allo
TMP=$(mktemp -d)
fonttools varLib.instancer "$SRC" wght=400:800 -o "$TMP/limited.ttf" -q
pyftsubset "$TMP/limited.ttf" \
  --unicodes="U+0020-007E,U+00A0-017F,U+0218-021B,U+02C6,U+02DA,U+02DC,U+2009-200A,U+2013-2014,U+2018-201E,U+2020-2022,U+2026,U+202F,U+2030,U+2039-203A,U+2044,U+20AC,U+2122,U+2190-2193,U+2212,U+2713,U+2726" \
  --flavor=woff2 --output-file="$TMP/allo.woff2"
HASH=$(sha256sum "$TMP/allo.woff2" | cut -c1-8)
rm -f "$OUT"/allo-latin.*.woff2
cp "$TMP/allo.woff2" "$OUT/allo-latin.$HASH.woff2"
rm -rf "$TMP"
ls -l "$OUT/allo-latin.$HASH.woff2"
