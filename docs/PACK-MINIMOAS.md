# Pack complet des minimoas (images)

Référence de style : planche « turnaround » de chaque minimoa et l'affiche « Les pets de Blowy » (Nino lime à mèche
orange, deux yeux ; Suzie rose à antennes pompons ; Gaston orange cyclope à oreilles rondes ; Pia violette à cornes et
une dent). Fourrure 3D type film d'animation, fond blanc uni pour la génération, détourage ensuite.

Production : ChatGPT (génération d'images), avec la planche de référence jointe à chaque demande. Une planche = grille
stricte 4 × 3, corps entier pieds visibles, même échelle, même ligne de sol, aucune étiquette. Découpe et détourage dans
`/home/claude/work/mascots/` (script), puis `packages/ui/assets/pets/<espèce>_<pose>.webp` sur une toile commune
900 × 1000 (même cadrage pour toutes les poses, pour que les objets se posent pareil partout).

## A. Poses en corps entier (par espèce, 24)
Planche 1 : neutre · joie (petit bond) · triste · surpris · boude (bras croisés) · dort assis · mange (pomme) · joue
(ballon) · marche (profil) · coucou · check (high five) · pense.
Planche 2 : colère · malade (plaid, thermomètre) · timide (joues roses) · fier (poings sur les hanches) · rit · danse ·
bras ouverts (accueil) · assis content · bâille · bain (mousse) · applaudit · fête (confettis).

## B. Variantes (par espèce, 12)
Les six formes d'évolution en corps entier (casanier, équilibré, sociable, tendre, piquant, joueur), le bébé, l'œuf qui
éclot (3 étapes : œuf, fissuré, éclos), le fantôme (lien à 0 vie, translucide bleuté), le « lien en danger ».

## C. Objets portés (refaits pour être portés, pas posés)
Chaque objet est dessiné dans la perspective des minimoas (vue de face, très légère plongée), à l'échelle d'une tête de
minimoa, avec une ombre de contact douce intégrée sur sa face inférieure, et la partie qui serait cachée par la tête
retirée (intérieur d'un chapeau, branches de lunettes derrière la tête). Les couvre-chefs ont une variante par espèce
quand la tête change (mèche de Nino, antennes de Suzie, oreilles de Gaston, cornes de Pia). Les objets qui entourent
(écharpe, casque audio, sac à dos, cape) ont deux calques : avant et arrière.
Emplacements : tête · visage · cou · corps · dos · main · compagnon.

## D. Éléments pour rendre l'app vivante
- Soins : nourriture (pomme, cookie, smoothie, part de gâteau), jouets (ballon, peluche, toupie), sieste (coussin,
  plaid), câlin (cœurs pour son propre minimoa), bain (mousse, canard).
- Particules et effets : étincelles, confettis, notes de musique, « zzz », gouttes de sueur, éclair de colère, nuage gris.
- Habitat : coussin du minimoa, tapis, plantes, lampe, cadre au mur (décor de l'accueil, déblocable).
- Récompenses : coffre de palier, médaille de série, flamme de série par palier (3, 7, 14, 30, 60, 100).

## E. Minimoa+ (achats)
Collection premium cohérente (« saisons ») : 3 ensembles complets (tête + cou + corps + compagnon) par saison, un décor
d'habitat premium, une teinte de fourrure spéciale, une aura. Visuel de vitrine du paywall : les quatre minimoas habillés
d'objets premium.

## État (17 nov.)
- **A, planche 1 : intégrée.** 48 corps (`<espèce>_corps_<pose>.webp`, 12 poses × 4), même échelle par espèce (Gaston
  et Pia ×0,87–0,88 pour tenir dans la toile, poses rétrécies à la découpe recalées), pieds sur y = 958. Registre :
  `BODY_POSES`, `petBodyImage`, `bodyPoseFor` (humeur → pose : `amour` → `joie`, `salut` → `coucou`, `colere` → `boude`…).
  Utilisées par `PetActor` dès 96 pt ou habillé (fondu-enchaîné entre poses), `DressedPet`, `EncounterStage`
  (`marche` → `check`, `coucou` → `joie`), défi (`pense`), série (`joie`). Les bustes restent pour les petites tailles.
- **Habillage porté** : ancres mesurées par pose (`fit.json` → `species.<s>.poses`, script
  `apps/mobile/scripts/fit-poses/`), rendu « porté » dans `DressedPet` (ombre portée, voile de fourrure, ombre propre en
  bas à droite, fourrure devant le bas des couvre-chefs, objets enveloppants en deux calques, objet tenu dans la main
  libre sinon au sol, objets du visage masqués de profil). Planche : `/dev/fit?species=nino` (dev seulement).
- **C : à refaire** (les images actuelles sont des objets posés vus de face, sans partie cachée retirée) — liste
  dans le rapport de l'agent K (17 nov.) : en priorité cape, sac à dos, écharpe, casque audio (deux calques), puis les
  couvre-chefs par espèce.

## Production du 17 nov. (ChatGPT, référence jointe à chaque planche)
| Lot | Contenu | Fichiers source |
|---|---|---|
| Poses 1 | 12 poses × 4 (neutre, joie, triste, surpris, boude, dodo, mange, joue, marche, coucou, check, pense) | `work/mascots/<s>/cut` |
| Poses 2 | 12 poses × 4 (colère, malade, timide, fier, rit, danse, accueil, assis, bâille, bain, applaudit, fête) | `work/mascots/<s>2p/cut` |
| Variantes | 6 formes d'évolution en corps entier, bébé, œuf, œuf fêlé, éclosion, fantôme, en danger × 4 | `work/mascots/<s>_var/cut` |
| Couvre-chefs | 12, un seul jeu pour les quatre (placement mesuré sur le front) | `work/mascots/items/nino2/cut` |
| Visage | 12 + 6 versions à un verre pour Gaston | `work/mascots/items/visage/cut` |
| Cou et dos | 12, dont 8 en deux calques (avant + `_dos`) | `work/mascots/items/cou/cut` |
| Vêtements et objets tenus | 6 + 12 | `work/mascots/items/habits/cut` |
| Soins et habitat | 24 (nourriture, jeux, repos et bain, habitat, récompenses) | `work/mascots/soins/cut` |
| Minimoa+ hiver | 12 objets premium (dont une aura translucide) | `work/mascots/premium/cut` |

Règles qui ont marché : chaque objet seul, calque séparé (il s'anime indépendamment du minimoa) ; plein et opaque ; jamais
d'intérieur visible ni de trou (mèche, antennes, cornes passent derrière) ; lunettes sans branches ; objets enveloppants
en deux calques ; vêtements faits pour un corps en boule, découpés par la silhouette du minimoa.
