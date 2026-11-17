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
- **A, planche 2 : intégrée.** 48 corps de plus (colère, malade, timide, fier, rit, danse, accueil, assis, bâille, bain,
  applaudit, fête) : réparés (antennes de Suzie et corne de Pia en fête, mousse de Pia), même échelle que la planche 1
  (taille de la tête recalée sur `neutre` par les yeux), pieds sur y = 958 (`scripts/fit-poses/pack2.py`). Confettis
  (fête) et bulles (bain) en particules (`Burst`), muettes avec « réduire les animations ». Moments : refus → `colere`,
  besoins à plat → `malade`, première rencontre → `timide`, palier de série → `fier` puis `fete` (coffre et médaille),
  câlin → `rit`, repos → `assis` et parfois `danse` (rarement `bain` : aucune habitude douche/bain au catalogue), retour
  après plus de 3 jours → `accueil`, fin de soirée → `baille` puis `dodo`, défi relevé → `applaudit`.
- **B : intégrée.** Formes d'évolution en pied (mêmes noms de fichiers `<espèce>_evo_<forme>`, scintillements de la
  forme sociable en particules), bébé, œuf, œuf fêlé, éclosion, fantôme, en danger (`<espèce>_corps_<variante>`, poses
  du registre). Accueil : la forme courante au repos ; préparation : œuf → fêlé → éclosion → bébé ; fantôme dans le
  panneau d'un lien à 0 vie ; « en danger » pour un lien à 1–2 vies (onglet Le lien) et pour un minimoa délaissé
  (3 jours sans ouvrir l'app, jusqu'au premier soin). Pas de tenue sur l'œuf, l'éclosion, le fantôme ; couvre-chef
  seul sur le bébé.
- **D : intégrée en partie.** 24 éléments (`packages/ui/assets/misc`, registre `assets/misc.ts`) : la nourriture et le
  jouet du soin tournent (glissés jusqu'au pet, puis tenus dans `mange` / `joue`), coussin et plaid pour la sieste,
  canard et brosse au bain, petit habitat flou sur la scène (tapis, plante, lampe, cadre avec la dernière photo des
  souvenirs, veilleuse la nuit ; masqué sous 700 pt de haut), coffre et médaille aux paliers de série.
- **E : collection Hiver** (12 objets premium, Minimoa+) : bonnet, diadème, cache-oreilles, masque de ski, écharpe
  bleu nuit (dos recoloré), cape (dans le dos), moufles, chocolat, boule à neige, sapin et bonhomme (posés à côté),
  aura de flocons (tourne derrière le minimoa). Vitrine du paywall : son minimoa en bonnet, écharpe et aura.
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
