# Maquettes V5.2 « Ton pet te trouve une bande »

Ces maquettes servent de référence pixel-perfect au développement. Les règles produit viennent de trois documents, du plus ancien au plus récent :

- `docs/product/concept-v5.md` ;
- `concept-v5.1.md` ;
- **`docs/product/concept-v5.2.md`** (décisions A à H), qui prime sur les deux autres.

Le tour 3 répond au jury tour 2 (`docs/research/jury/round-2/`) : les 3 bloquants et les défauts relevés écran par écran.

## Contenu

- **75 artboards** de 390 × 844 dans `project/` :
  - 72 écrans d'app et 3 pages web ;
  - tous en `lang="fr"`, `is_interactive`.
  - 5 écrans défilent : Sortie, Révélation, Réglages, Confidentialité, Signaler.
- **`project/canvas.json`** : la page « v5 — Bande » compte 9 rangées (A, B, B', C à H) dans l'ordre du parcours, avec des titres numérotés de 01 à 59, plus 4 notes (changements, casting, argent, boucles).
- **`facts.json`** : source unique des chiffres, dates et règles de la démo. Il contient :
  - la grille d'âge fixe ;
  - les tranches de chaque membre ;
  - la composition ;
  - les slugs ;
  - la chronologie ;
  - l'heure « maintenant » de chaque écran.
- **`check-facts.mjs`** : vérifie chaque `.dc.html` contre `facts.json`.
  - Commande : `node design/v5/check-facts.mjs [filtre]`.
  - Résultat : **75 fichiers, 2 480 vérifications, 0 contradiction**.
  - Sur la version du tour 2, il trouve 58 contradictions, dont toutes celles que le jury avait relevées à la main.
- **`a11y-audit.mjs`** : audit WCAG 2.2 AA dans Chromium.
  - Il calcule le contraste réel sur le fond, dégradés compris.
  - Il vérifie que chaque cible mesure au moins 44 × 44 pt.
  - Résultat : **75 écrans, 1 038 textes, 420 cibles, 0 problème, contraste minimum 4,53:1**.
- **Rendus** : `renders/*.png` (@2x). Les 75 écrans ont été rendus et relus un par un.

### Ce que contrôle `check-facts` (étendu au tour 3)

1. **Dates** : le jour de semaine de chaque date 2026 est vérifié.
2. **Chronologie** :
   - les paires de `facts.chronologie` sont dans l'ordre ;
   - les visages arrivent exactement 3 h avant la sortie ;
   - écran par écran (`facts.ecrans`), un événement n'est jamais affiché comme passé avant d'avoir eu lieu (« Café des Oiseaux » avant mer. 18 h, « Transcription » avant les visages de Jade, « rejoint ta bande » avant les votes) ;
   - un événement n'est jamais annoncé comme futur après avoir eu lieu.
3. **Grille d'âge** :
   - toute tranche « NN–MM ans » tombe sur la grille fixe ;
   - la tranche de chaque membre est incluse dans la composition annoncée ;
   - jamais d'âge exact.
4. **Phrases dérivées** :
   - « N personnes » = taille du groupe ;
   - « N nouvelles personnes / inconnu·es » = taille − toi − ta team (Lille : taille − team d'amorçage) ;
   - « N + toi », « on était N », « N sur 5 arrivés » ;
   - femmes + hommes = 5 ;
   - « au moins N personnes » = garantie ;
   - « il manque N » = manque de la ville en attente ;
   - « + N personnes du quartier » = taille − toi − bande ;
   - plus aucun seuil « N / M personnes ».
5. **Prix** : seulement ceux de la liste autorisée.
6. **Compteurs** :
   - le nombre de souvenirs ;
   - « N dans ta bande » selon la date de l'écran (1 avant les votes, 2 après).
7. **Cartes de partage** :
   - aucun prénom de tiers, quelle que soit la casse ;
   - aucun asset de pet d'un autre membre.
8. **Slugs** : aucun `blowy.app/…` ne contient un prénom.
9. **VoiceOver** : aucun point médian dans un `<button>`, un `<h1>`/`<h2>` ou un `a.btn`.
10. **Vocabulaire** : aucun terme banni. Sont bannis « alerte », « ville fermée », « pas encore ouvert », « App Store », « Restaurer mes achats », « remboursé·e », « Code Names », « photos la veille », « Ami·e », etc.

## Jetons et accessibilité

Le langage visuel est celui de la V4 :

- crème `#FFF7EC`, encre `#16110D`, citron `#C8F542`, mangue, rose, violet ;
- Bricolage Grotesque 800 + Inter ;
- `.btn` à ombre portée, `.chip`, `.card`, `.grp/.row`.

Les jetons foncés pour l'AA sont ceux du tour 2 :

- bouton `#D93A1C` ;
- texte corail `#C4341B` ;
- rose `#C2185B` ;
- gris `#6F6458` / `#5A5047` ;
- vert `#1E7A47`.

Les interrupteurs montrent leur état réel : ON `#3F7A0B` à droite, OFF `#8C7B66` à gauche. Leur `aria-label` dit « activé » ou « désactivé ».

## Casting et données (extrait de `facts.json`)

- **Aujourd'hui** : lun. 9 nov. 2026. Toi : Alex, il, 26–29 ans, Paris 11e, pet Nino.
- **Sortie 1** : jeu. 12 nov., 19 h 30, Jeux de société.
  - Composition : lun. 9 nov. 21 h.
  - Lieu : **mer. 11 nov. 18 h** (Café des Oiseaux, 12 rue Oberkampf, code 4827).
  - Visages : **jeu. 12 nov. 16 h 30**, soit 3 h avant.
  - Votes jusqu'au dim. 15 nov. 21 h 30.
- **Groupe** : 5 personnes, 26–34 ans, 2 femmes et 3 hommes, toi et Tom en team, 3 nouvelles personnes.
  - Léa, Malo et Sarah ont 26–29 ans ; Tom a 30–34 ans.
  - Garantie : au moins 2 personnes cherchent une histoire compatible.
- **Duo Jade** :
  - début : dim. 8 nov. 21 h ;
  - visages : mar. 10 nov. 21 h ;
  - rendez-vous : sam. 14 nov. 15 h au Comptoir Gabriel.
- **Duo Léa** (après les votes) : sam. 21 nov. 15 h, Parc des Buttes-Chaumont (gratuit).
- **Nantes** (en attente) : 87 personnes vérifiées. Il manque 2 personnes pour la sortie du sam. 21 nov., 15 h – 17 h.
- **Lille** (amorçage) : une team de 3 et 2 personnes en attente. Sortie le sam. 28 nov., 15 h – 17 h : Atelier céramique à La Fabrique, Lille-Wazemmes.
- **Slugs** :
  - invitation `blowy.app/i/r8Tz4w` ;
  - 3 mots `blowy.app/m/k7f2q` ;
  - ange `blowy.app/a/7Qm2xK9fPz4Lw8vR`.
- **Prix** :
  - 1re sortie offerte, puis 4,99 € la place ;
  - Duo gratuit pour 1 duo actif ;
  - Blowy+ 9,99 €/mois (toutes les sorties et duos illimités), payé avec Apple Pay.

## États

Chaque état important a son propre artboard. Les sélections sont jouables en Play via `state` : ange, votes, signalement, « Bloquer aussi », Rupture, W-Repondre, Pause.

Aucune réponse n'est présélectionnée :

- l'ange gardien, à la sortie comme en duo ;
- le vote, dont « Non » est la valeur par défaut, en contour, sans remplissage ;
- « Bloquer aussi », décoché.

## Écrans dans l'ordre du parcours

**A · Arrivée (8 étapes avant la Trouvée, ordre E)**

1. Welcome.
2. Ville (1/8), avec la variante Nantes : « À Nantes aussi, on sort. »
3. Toi : date de naissance et genre (2/8).
4. Pet et activités (3/8).
5. Rencontrer et intention (4/8).
6. Consentement (5/8), seulement si « histoire ». Les boutons « J'accepte » et « Potes seulement » ont le même poids.
7. Genres recherchés (6/8).
8. Créneaux (7/8).
9. Compte Apple (8/8), avec le prénom affiché et la discrétion désactivée par défaut.
10. Erreur d'âge : bouton « Compris », lien « Erreur de date ? ».

**B · Ta sortie**

- Trouvée, et sa variante « sortie potes uniquement cette semaine » (B).
- Sortie proposée, puis Selfie, puis Notifications, puis Tu y vas (« Ajouter à mon agenda »).
- Viens avec un pote, et l'arrivée du pote invité.
- Accueil, en 3 variantes : normal, mode discret, format à deux. Chacune a sa Pause.
- Chats, Chat du groupe (Codenames, pastilles pet + initiale), menu.

**B' · Partout dès 5 personnes (A)**

- Nantes : « Il manque 2 personnes pour ta sortie du samedi 21 novembre ». Trois actions : venir avec des potes, ajouter un créneau, la voie Duo.
- Lille : sortie d'amorçage datée, avec son lieu.
- Pas de place cette fois, Sortie annulée.
- Affiner plus tard, et Affiner : histoire. On y trouve les questions déplacées hors de l'onboarding : enfants (Oui / J'en ai déjà / Non / Je ne sais pas), sujets, semaines off, âge du groupe, éviter mes contacts.

**C · Veille et jour J (C)**

- Lieu confirmé (mer. 18 h), suivi de la carte « Demain, je sors avec 3 nouvelles personnes. Lieu secret. »
- Les visages à J −3 h :
  - filigrane « vu par Alex » ;
  - captures bloquées ;
  - « Je connais quelqu'un ici » une fois par mois, sans pénalité ;
  - « Je ne peux plus venir » compte comme une absence.
- Ange gardien, sans présélection. Page web de l'ange : le lien « Ce lien ne m'est pas destiné » passe au-dessus de l'encart blowy.
- W-Ange-aide : « Alex a besoin d'aide ».
- Check-in :
  - le code d'abord, la position une fois en option ;
  - Check-in fait : « 4 sur 5 arrivés » sans dire qui, « Range ton téléphone », « Besoin d'aide » en appui long ;
  - carte « J'y suis. ».

**D · Après**

- Sortie vécue : voter est l'action principale.
- Carte « On était 5. », avec des silhouettes génériques et Nino.
- Vote Amitié / Plus / Non.
- Tes accords : « Vous avez dit plus tous les deux ».
- Pas d'accord, avec « sauf ta bande ».
- Ta bande : Tom est « Ton pote · venu en team », « + Inviter » est discret.
- Ta rue : les pets de la bande et les souvenirs ; aucune notification, aucune jauge.

**E · Duo**

- Voie Duo : 1 duo actif gratuit. Nils a « Dire oui / Pas cette fois », et la limite est expliquée.
- Duo J. : écrire, puis les visages, puis un rendez-vous quand vous voulez. Nino propose pendant 7 jours, ensuite le duo reste ouvert. Bandeau de modération.
- Les visages, Rendez-vous (table confirmée par le lieu, ange sans présélection).
- Chat avec Léa, Rendez-vous au parc, Clin d'œil, Partir proprement.

**F · Partage**

- « Viens avec moi. » (Message en 1er), Décris-moi en 3 mots, W-Repondre.
- Les cartes « accords », « semaine » et « ville » sont supprimées (D).

**G · Compte**

- Profil : engrenage, « Affiner plus tard », visage le jour J.
- Fiche : la fiabilité est invisible pour le groupe, l'accessoire arrive au 4e souvenir.
- Tarifs (ligne Duo, Apple Pay), Blowy+ (« résiliable ici en 1 tap », sans « Restaurer »), Paiement.
- Réglages : Voie Duo, « Aide (non urgent) », mode discret affiché comme un état.
- Confidentialité : phrase F exacte, mode discret OFF réel.
- Signaler : 17 / 112 / 114 / 3919, « Incident sur place », « Absences répétées », Bloquer décoché.
- Supprimer : Blowy+ via Apple Pay.

**H · États** : Chargement, Réseau, Paiement refusé, Selfie non vérifié, Notifications refusées, Chats vides (avec la voie Duo).

## Écarts au concept (et décisions tranchées)

| Sujet | Décision | Pourquoi |
|---|---|---|
| Ordre E de l'onboarding | La date de naissance est sur l'écran « Toi », avec le genre. « Rencontrer » et l'intention sont sur un même écran. | Cela tient en 8 écrans sans fusionner deux décisions sensibles. |
| « Ta rue » | Un écran calme, sans interaction (G.21). On y entre par une ligne discrète depuis Bande. | Il n'y a rien à entretenir. |
| Mode discret | Désactivé par défaut (F) ; la variante d'Accueil montre l'état activé. | L'interrupteur montre son état réel. |
| Notifications de la démo | L'expéditeur est « blowy. », puisque le mode discret est désactivé. | Cohérent avec l'état réel. |
| Vote | « Non » est la valeur par défaut, en contour, sans remplissage. | « Sans réponse, c'est non », sans afficher de rejet. |
| Partage soirée | Silhouettes génériques et Nino. « Citer le lieu » n'est possible qu'à partir du ven. 13 nov. 9 h 30. | D.11 ; la carte ne permet pas de retrouver le lieu pendant la soirée. |
| Mots « 3 mots » | Accordés au pronom de la personne décrite (« loyal »), sans point médian. | VoiceOver (F.18). |
| Lieu partenaire (contrat, compensation de 15 €) | Admin web, non maquetté ici. | H.24 le renvoie à la V5.3. |

## Vocabulaire (un mot = un concept)

**sortie** · **groupe** (5 personnes) · **team** (tu viens avec 1 ou 2 potes) · **nouvelles personnes** · **bande** · **Ta rue** · **duo** · **rendez-vous à deux** · **lieu** (veille 18 h) · **visages** (J −3 h, jamais « photos ») · **besoin d'aide** (jamais « alerte ») · **check-in**, **code du chevalet** · **ange gardien** · **pause** · **mode discret** · **fiabilité** · **souvenir** · **accord** · **Partir proprement** · **place** · **Blowy+** · vote **Amitié / Plus / Non**.

## Textes clés (i18n)

| Clé | Texte |
|---|---|
| welcome.foot | Partout : une sortie se forme dès 5 personnes compatibles. Des groupes de ton âge, dès 18 ans. Tous genres, toutes orientations. |
| ville.nantes | À Nantes aussi, on sort. {n} personnes vérifiées. Une sortie se forme dès que 5 personnes compatibles partagent un créneau. |
| attente.title | Il manque {n} personnes pour ta sortie du {jour}. |
| amorcage | Ta team de 3 + 2 personnes en attente = une sortie. |
| compo | {taille} personnes · {âges} · {f} femmes, {h} hommes · toi et {pote} en team, {n} nouvelles personnes |
| garantie | Au moins 2 personnes du groupe cherchent aussi une histoire compatible avec la tienne. Jamais qui. |
| trouvee.potes | Cette semaine, sortie potes uniquement pour toi : pas assez de personnes compatibles pour une histoire sur ce créneau. |
| confirmation | Lieu confirmé · Les visages arrivent {visages}, 3 h avant, pour tout le groupe en même temps. |
| revelation | Chaque visage porte ton prénom en filigrane. Les captures d'écran sont bloquées. |
| checkin | Tu es là ? Tape le code à 4 chiffres écrit sur le chevalet orange. · 4 sur 5 arrivés · Range ton téléphone. |
| vote | « Plus » vaut au moins « amitié ». Sans réponse, c'est « non ». Tu ne sauras jamais qui a dit non ou n'a pas voté. |
| conf.orientation | Ton orientation et ce que tu cherches ne sont montrés à personne. Seule une personne avec qui tu as un duo sait que vous vous plaisez mutuellement. |
| partage.confirmation | Demain, je sors avec 3 nouvelles personnes. Lieu secret. |
| partage.soiree | On était 5. 3 nouvelles personnes et un pote, présentés par nos pets. |
| partage.invitation | Viens avec moi. |
| duo.limite | Gratuit : 1 duo actif. Blowy+ : sans limite. |
| w-ange.aide | Alex a besoin d'aide. Appelle Alex tout de suite. Sans réponse, appelle le 17. |
| erreur.age | Blowy est réservé aux 18 ans et plus. — Compris / Erreur de date ? |

## Générateur

Les écrans sont générés par des scripts Python, hors dépôt, qui lisent `facts.json` : base commune, A, B, C/D, E/F/G/H et `canvas.json`. Les `.dc.html` livrés sont autonomes et éditables à la main. Après toute modification, relancer `check-facts.mjs` et `a11y-audit.mjs`.
