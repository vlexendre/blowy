# Inventaire des assets sprites

> Généré par `node packages/sprites/scripts/inventory.mjs` (après `pnpm --filter @blowy/sprites build`). Ne pas éditer à la main.
> Source : maquette V4 (`design/v4-reference/assets`) copiée dans `packages/sprites/assets` sous des noms parlants.

Matrice 4 espèces × 3 stades × 12 poses = 144 combinaisons : **23 dessinées**, **121 en repli déclaré**, **0 placeholder**.

Règle de repli (packages/sprites/src/resolve.ts) : pose demandée → chaîne `POSE_FALLBACKS` (même stade) → stade jeune mis à l’échelle (bébé ×0,72, adulte ×1,12) → placeholder. Une pose d’état (malade, endormi, affamé, triste) remplacée est toujours accompagnée d’un overlay (icône + libellé vocalisé) pour que l’état ne soit pas perdu.

Pour remplacer un repli : déposer le fichier PNG/WebP transparent au chemin `packages/sprites/assets/<espèce>/<stade>/<pose>.webp`, l’ajouter dans `POSE_SPRITES` (`src/catalog.ts`), lancer `pnpm --filter @blowy/sprites scan` puis ce script. Le test `manifest.test.ts` vérifie chemins, transparence, ligne de sol et cet inventaire.

## Poses manquantes (repli)

| Espèce | Stade | Pose | Rendu actuel |
|---|---|---|---|
| GASTON | BABY | PRESENTATION | YOUNG/PRESENTATION (gaston/young/presentation.webp) |
| GASTON | BABY | JOYFUL | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | BABY | SAD | YOUNG/POUTING (gaston/young/pouting.webp) + overlay sad |
| GASTON | BABY | SICK | YOUNG/PRESENTATION (gaston/young/presentation.webp) + overlay sick |
| GASTON | BABY | ASLEEP | YOUNG/PRESENTATION (gaston/young/presentation.webp) + overlay sleep |
| GASTON | BABY | HUNGRY | YOUNG/POUTING (gaston/young/pouting.webp) + overlay hungry |
| GASTON | BABY | POUTING | YOUNG/POUTING (gaston/young/pouting.webp) |
| GASTON | BABY | PROUD | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | BABY | SURPRISED | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | BABY | AFFECTIONATE | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | BABY | LEAP | YOUNG/LEAP (gaston/young/leap.webp) |
| GASTON | BABY | DANCE | YOUNG/LEAP (gaston/young/leap.webp) |
| GASTON | YOUNG | SAD | YOUNG/POUTING (gaston/young/pouting.webp) + overlay sad |
| GASTON | YOUNG | SICK | YOUNG/PRESENTATION (gaston/young/presentation.webp) + overlay sick |
| GASTON | YOUNG | ASLEEP | YOUNG/PRESENTATION (gaston/young/presentation.webp) + overlay sleep |
| GASTON | YOUNG | HUNGRY | YOUNG/POUTING (gaston/young/pouting.webp) + overlay hungry |
| GASTON | YOUNG | PROUD | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | YOUNG | SURPRISED | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | YOUNG | AFFECTIONATE | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | YOUNG | DANCE | YOUNG/LEAP (gaston/young/leap.webp) |
| GASTON | ADULT | PRESENTATION | YOUNG/PRESENTATION (gaston/young/presentation.webp) |
| GASTON | ADULT | JOYFUL | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | ADULT | SAD | YOUNG/POUTING (gaston/young/pouting.webp) + overlay sad |
| GASTON | ADULT | SICK | YOUNG/PRESENTATION (gaston/young/presentation.webp) + overlay sick |
| GASTON | ADULT | ASLEEP | YOUNG/PRESENTATION (gaston/young/presentation.webp) + overlay sleep |
| GASTON | ADULT | HUNGRY | YOUNG/POUTING (gaston/young/pouting.webp) + overlay hungry |
| GASTON | ADULT | POUTING | YOUNG/POUTING (gaston/young/pouting.webp) |
| GASTON | ADULT | PROUD | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | ADULT | SURPRISED | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | ADULT | AFFECTIONATE | YOUNG/JOYFUL (gaston/young/joyful.webp) |
| GASTON | ADULT | LEAP | YOUNG/LEAP (gaston/young/leap.webp) |
| GASTON | ADULT | DANCE | YOUNG/LEAP (gaston/young/leap.webp) |
| PIA | BABY | PRESENTATION | YOUNG/PRESENTATION (pia/young/presentation.webp) |
| PIA | BABY | JOYFUL | YOUNG/JOYFUL (pia/young/joyful.webp) |
| PIA | BABY | SAD | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay sad |
| PIA | BABY | SICK | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay sick |
| PIA | BABY | ASLEEP | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay sleep |
| PIA | BABY | HUNGRY | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay hungry |
| PIA | BABY | POUTING | YOUNG/PRESENTATION (pia/young/presentation.webp) |
| PIA | BABY | PROUD | YOUNG/PROUD (pia/young/proud.webp) |
| PIA | BABY | SURPRISED | YOUNG/JOYFUL (pia/young/joyful.webp) |
| PIA | BABY | AFFECTIONATE | YOUNG/JOYFUL (pia/young/joyful.webp) |
| PIA | BABY | LEAP | YOUNG/LEAP (pia/young/leap.webp) |
| PIA | BABY | DANCE | YOUNG/LEAP (pia/young/leap.webp) |
| PIA | YOUNG | SAD | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay sad |
| PIA | YOUNG | SICK | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay sick |
| PIA | YOUNG | ASLEEP | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay sleep |
| PIA | YOUNG | HUNGRY | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay hungry |
| PIA | YOUNG | POUTING | YOUNG/PRESENTATION (pia/young/presentation.webp) |
| PIA | YOUNG | SURPRISED | YOUNG/JOYFUL (pia/young/joyful.webp) |
| PIA | YOUNG | AFFECTIONATE | YOUNG/JOYFUL (pia/young/joyful.webp) |
| PIA | YOUNG | DANCE | YOUNG/LEAP (pia/young/leap.webp) |
| PIA | ADULT | PRESENTATION | YOUNG/PRESENTATION (pia/young/presentation.webp) |
| PIA | ADULT | JOYFUL | YOUNG/JOYFUL (pia/young/joyful.webp) |
| PIA | ADULT | SAD | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay sad |
| PIA | ADULT | SICK | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay sick |
| PIA | ADULT | ASLEEP | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay sleep |
| PIA | ADULT | HUNGRY | YOUNG/PRESENTATION (pia/young/presentation.webp) + overlay hungry |
| PIA | ADULT | POUTING | YOUNG/PRESENTATION (pia/young/presentation.webp) |
| PIA | ADULT | PROUD | YOUNG/PROUD (pia/young/proud.webp) |
| PIA | ADULT | SURPRISED | YOUNG/JOYFUL (pia/young/joyful.webp) |
| PIA | ADULT | AFFECTIONATE | YOUNG/JOYFUL (pia/young/joyful.webp) |
| PIA | ADULT | LEAP | YOUNG/LEAP (pia/young/leap.webp) |
| PIA | ADULT | DANCE | YOUNG/LEAP (pia/young/leap.webp) |
| NINO | BABY | JOYFUL | BABY/PRESENTATION (nino/baby/presentation.webp) |
| NINO | BABY | SAD | BABY/PRESENTATION (nino/baby/presentation.webp) + overlay sad |
| NINO | BABY | SICK | BABY/PRESENTATION (nino/baby/presentation.webp) + overlay sick |
| NINO | BABY | ASLEEP | BABY/PRESENTATION (nino/baby/presentation.webp) + overlay sleep |
| NINO | BABY | HUNGRY | BABY/PRESENTATION (nino/baby/presentation.webp) + overlay hungry |
| NINO | BABY | POUTING | BABY/PRESENTATION (nino/baby/presentation.webp) |
| NINO | BABY | PROUD | BABY/PRESENTATION (nino/baby/presentation.webp) |
| NINO | BABY | SURPRISED | BABY/PRESENTATION (nino/baby/presentation.webp) |
| NINO | BABY | AFFECTIONATE | BABY/PRESENTATION (nino/baby/presentation.webp) |
| NINO | BABY | LEAP | BABY/PRESENTATION (nino/baby/presentation.webp) |
| NINO | BABY | DANCE | BABY/PRESENTATION (nino/baby/presentation.webp) |
| NINO | YOUNG | SICK | YOUNG/SAD (nino/young/sad.webp) + overlay sick |
| NINO | YOUNG | HUNGRY | YOUNG/SAD (nino/young/sad.webp) + overlay hungry |
| NINO | YOUNG | POUTING | YOUNG/SAD (nino/young/sad.webp) |
| NINO | ADULT | PRESENTATION | YOUNG/PRESENTATION (nino/young/presentation.webp) |
| NINO | ADULT | JOYFUL | YOUNG/JOYFUL (nino/young/joyful.webp) |
| NINO | ADULT | SAD | YOUNG/SAD (nino/young/sad.webp) |
| NINO | ADULT | SICK | YOUNG/SAD (nino/young/sad.webp) + overlay sick |
| NINO | ADULT | ASLEEP | YOUNG/ASLEEP (nino/young/asleep.webp) |
| NINO | ADULT | HUNGRY | YOUNG/SAD (nino/young/sad.webp) + overlay hungry |
| NINO | ADULT | POUTING | YOUNG/SAD (nino/young/sad.webp) |
| NINO | ADULT | PROUD | YOUNG/PROUD (nino/young/proud.webp) |
| NINO | ADULT | SURPRISED | YOUNG/SURPRISED (nino/young/surprised.webp) |
| NINO | ADULT | AFFECTIONATE | YOUNG/AFFECTIONATE (nino/young/affectionate.webp) |
| NINO | ADULT | LEAP | YOUNG/LEAP (nino/young/leap.webp) |
| NINO | ADULT | DANCE | YOUNG/DANCE (nino/young/dance.webp) |
| SUZIE | BABY | PRESENTATION | YOUNG/PRESENTATION (suzie/young/presentation.webp) |
| SUZIE | BABY | JOYFUL | YOUNG/JOYFUL (suzie/young/joyful.webp) |
| SUZIE | BABY | SAD | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay sad |
| SUZIE | BABY | SICK | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay sick |
| SUZIE | BABY | ASLEEP | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay sleep |
| SUZIE | BABY | HUNGRY | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay hungry |
| SUZIE | BABY | POUTING | YOUNG/PRESENTATION (suzie/young/presentation.webp) |
| SUZIE | BABY | PROUD | YOUNG/PROUD (suzie/young/proud.webp) |
| SUZIE | BABY | SURPRISED | YOUNG/JOYFUL (suzie/young/joyful.webp) |
| SUZIE | BABY | AFFECTIONATE | YOUNG/AFFECTIONATE (suzie/young/affectionate.webp) |
| SUZIE | BABY | LEAP | YOUNG/LEAP (suzie/young/leap.webp) |
| SUZIE | BABY | DANCE | YOUNG/LEAP (suzie/young/leap.webp) |
| SUZIE | YOUNG | SAD | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay sad |
| SUZIE | YOUNG | SICK | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay sick |
| SUZIE | YOUNG | ASLEEP | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay sleep |
| SUZIE | YOUNG | HUNGRY | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay hungry |
| SUZIE | YOUNG | POUTING | YOUNG/PRESENTATION (suzie/young/presentation.webp) |
| SUZIE | YOUNG | SURPRISED | YOUNG/JOYFUL (suzie/young/joyful.webp) |
| SUZIE | YOUNG | DANCE | YOUNG/LEAP (suzie/young/leap.webp) |
| SUZIE | ADULT | PRESENTATION | YOUNG/PRESENTATION (suzie/young/presentation.webp) |
| SUZIE | ADULT | JOYFUL | YOUNG/JOYFUL (suzie/young/joyful.webp) |
| SUZIE | ADULT | SAD | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay sad |
| SUZIE | ADULT | SICK | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay sick |
| SUZIE | ADULT | ASLEEP | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay sleep |
| SUZIE | ADULT | HUNGRY | YOUNG/PRESENTATION (suzie/young/presentation.webp) + overlay hungry |
| SUZIE | ADULT | POUTING | YOUNG/PRESENTATION (suzie/young/presentation.webp) |
| SUZIE | ADULT | PROUD | YOUNG/PROUD (suzie/young/proud.webp) |
| SUZIE | ADULT | SURPRISED | YOUNG/JOYFUL (suzie/young/joyful.webp) |
| SUZIE | ADULT | AFFECTIONATE | YOUNG/AFFECTIONATE (suzie/young/affectionate.webp) |
| SUZIE | ADULT | LEAP | YOUNG/LEAP (suzie/young/leap.webp) |
| SUZIE | ADULT | DANCE | YOUNG/LEAP (suzie/young/leap.webp) |

## Poses présentes

- GASTON YOUNG PRESENTATION → `gaston/young/presentation.webp`
- GASTON YOUNG JOYFUL → `gaston/young/joyful.webp`
- GASTON YOUNG POUTING → `gaston/young/pouting.webp`
- GASTON YOUNG LEAP → `gaston/young/leap.webp`
- PIA YOUNG PRESENTATION → `pia/young/presentation.webp`
- PIA YOUNG JOYFUL → `pia/young/joyful.webp`
- PIA YOUNG PROUD → `pia/young/proud.webp`
- PIA YOUNG LEAP → `pia/young/leap.webp`
- NINO BABY PRESENTATION → `nino/baby/presentation.webp`
- NINO YOUNG PRESENTATION → `nino/young/presentation.webp`
- NINO YOUNG JOYFUL → `nino/young/joyful.webp`
- NINO YOUNG SAD → `nino/young/sad.webp`
- NINO YOUNG ASLEEP → `nino/young/asleep.webp`
- NINO YOUNG PROUD → `nino/young/proud.webp`
- NINO YOUNG SURPRISED → `nino/young/surprised.webp`
- NINO YOUNG AFFECTIONATE → `nino/young/affectionate.webp`
- NINO YOUNG LEAP → `nino/young/leap.webp`
- NINO YOUNG DANCE → `nino/young/dance.webp`
- SUZIE YOUNG PRESENTATION → `suzie/young/presentation.webp`
- SUZIE YOUNG JOYFUL → `suzie/young/joyful.webp`
- SUZIE YOUNG PROUD → `suzie/young/proud.webp`
- SUZIE YOUNG AFFECTIONATE → `suzie/young/affectionate.webp`
- SUZIE YOUNG LEAP → `suzie/young/leap.webp`

## Animations (4 frames attendues)

| Espèce | Marche | Saut |
|---|---|---|
| NINO | dedicated (4 frames) | composed (4 frames) |
| GASTON | procedural (0 frames) | composed (4 frames) |
| SUZIE | procedural (0 frames) | composed (4 frames) |
| PIA | procedural (0 frames) | composed (4 frames) |

`dedicated` = frames dessinées ; `composed` = séquence composée de poses existantes (présentation → bond → présentation) ; `procedural` = aucune frame : le PetRenderer déplace la pose de présentation avec un rebond (manque à combler par le pack).

## Accessoires (12/12 présents)

- HEADPHONES (HEAD) → `accessories/headphones.webp`
- BEANIE (HEAD) → `accessories/beanie.webp`
- CROWN (HEAD) → `accessories/crown.webp`
- SUNGLASSES (EYES) → `accessories/sunglasses.webp`
- BACKPACK (BACK) → `accessories/backpack.webp`
- FLOWER (CHEST) → `accessories/flower.webp`
- BALLOON (HAND) → `accessories/balloon.webp`
- MUG (HAND) → `accessories/mug.webp`
- BOOK (HAND) → `accessories/book.webp`
- TROPHY (FLOOR) → `accessories/trophy.webp`
- GIFT (FLOOR) → `accessories/gift.webp`
- BALL (FLOOR) → `accessories/ball.webp`

Placement : ancrage normalisé dans la boîte opaque par espèce et par slot (`ACCESSORY_PLACEMENTS`), échelle par stade (`STAGE_PLACEMENT_SCALE`). Mesuré à l’œil sur la maquette sur la pose de présentation ; le pack final devra fournir des ancrages par pose (tête qui bouge en saut/danse).

## Œufs et bébés

- œuf NINO → eggs/egg-nino.webp
- œuf GASTON → manquant (repli : œuf partagé générique)
- œuf SUZIE → manquant (repli : œuf partagé générique)
- œuf PIA → manquant (repli : œuf partagé générique)
- œuf SHARED → eggs/egg-shared.webp
- œuf CRACKING → eggs/egg-cracking.webp
- bébé hybride NINO_SUZIE → `hybrid/baby-nino-suzie.webp`
- Autres combinaisons de bébés : manquantes → variante explicite du parent « corps » (P-5.17).

## Autres manques identifiés

- Stades BÉBÉ (sauf Nino) et ADULTE (toutes espèces) : aucun dessin. Le dessin « Adulte » référencé par V4-Fiche (`324d5cda…`) n’est pas présent dans l’export.
- Assets référencés par la maquette mais absents de l’export : `6400a21a…` (Nino fâché), `e17f7a5a…` (alerte pet), `ba10d999…` (mission manger), `47cd8823…` (gel de série). Remplacés par des icônes vectorielles / poses existantes.
- Les sprites « Claude » (ancienne mascotte V1–V3 : `3d012c30…`, `4f1732e4…`, `5b3fde8a…`, `76e13d29…`, `bc9d8525…`, `c3d2f694…`, `c91c8c3f…`, `46a416be…`, `006eac88…`, `792b978a…`) ne sont pas utilisés : hors casting V4.
- Polices Bricolage Grotesque / Inter : instances statiques générées depuis `@fontsource-variable/*` (licence OFL) par `apps/mobile/scripts/fonts/build-fonts.py` → `apps/mobile/assets/fonts/`.
