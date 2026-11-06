# Maquettes V5.3 « Ton pet te trouve une bande »

Ces maquettes servent de référence pixel-perfect au développement. Les règles produit viennent de quatre documents, du plus ancien au plus récent :

- `docs/product/concept-v5.md` ;
- `concept-v5.1.md` ;
- `concept-v5.2.md` ;
- **`docs/product/concept-v5.3.md`** (sections A–F), qui prime sur les trois autres.

Le tour 4 répond au jury tour 3 (`docs/research/jury/round-3/`) : le bloquant de la garantie et les défauts relevés écran par écran.

## Contenu

- **86 artboards** dans `project/` :
  - 80 écrans d'app et 3 pages web, en 390 × 844 ;
  - **3 écrans côté lieu** (web admin) en 1280 × 800 : `L-Effectif`, `L-Creneaux`, `L-Contrat`.
- **`project/canvas.json`** : la page « v5 — Bande » compte 10 rangées (A, B, B', C à H, L), avec des titres de 01 à 62, plus 4 notes.
- **`facts.json`** : source unique des chiffres, dates et règles. Il contient :
  - le calendrier B : `annulationGratuiteIso` = lieu de la veille à 18 h ;
  - l'heure de l'accord (art. 9), avant tout duo ;
  - la règle d'équilibre. La garantie n'y est plus.
  - Bordeaux, Lyon et Lille en solo ;
  - un lien par carte (`slugs`, `slugParFichier`, `slugsPrives`).
- **`check-facts.mjs`** : `node design/v5/check-facts.mjs [filtre]`.
  - Résultat : **86 fichiers, 3 549 vérifications, 0 contradiction**.
- **`a11y-audit.mjs`** : `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js [filtre]`.
  - Il audite le contraste, les cibles de 44 pt et **la mise en page sur le DOM rendu**.
  - Résultat : **86 écrans, 1 207 textes, 469 cibles, 1 255 blocs de texte mesurés, 0 problème, contraste minimum 4,53:1**.
- **`render-v5.mjs`** : c'est la même logique que `tooling/design-render/render.mjs`, qui reste inchangé, mais chaque écran est rendu à sa taille (390 × 844 @2x, lieu en 1280 × 800 @1x).
  - Commande : `DESIGN_ROOT=design/v5 NODE_PATH=$(npm root -g) node design/v5/render-v5.mjs .local/dc-runtime.js design/v5/renders [filtre]`.
  - Les 86 rendus de `renders/` ont été relus un par un.

### Contrôles ajoutés au tour 4

**`check-facts`** :

1. **Garantie jamais affichée** :
   - « au moins 2 personnes » et « histoire compatible avec la tienne » sont bannis ;
   - `facts.groupe` ne doit plus contenir la garantie.
2. **Calendrier B** :
   - toute « annulation gratuite jusqu'à … » de la sortie se termine le mer. 11 nov. 18 h (jamais aux visages) ;
   - la Confirmation contient les prénoms, les tranches et les pets des 4 autres, sans aucun « Visage de ».
3. **Chronologie des duos** : l'accord du lun. 9 nov. 20 h 50 précède le début du duo (21 h 30).
4. **Duo** : sur V5-Duo et V5-Duo-choix, le prénom de N. n'apparaît jamais avant le oui mutuel.
5. **Liens** :
   - chaque carte affiche son propre lien (`slugParFichier`) ;
   - aucun lien n'est réutilisé par deux cartes ;
   - un lien privé (invitation) n'est jamais à côté d'une cible « Story ».
6. **Vocabulaire** :
   - « pote » et « team » sont interdits dans les titres et les boutons ;
   - sont aussi bannis « Potes seulement », « Nouveaux potes », « captures d'écran sont bloquées », « Position au moment » et « résiliable ici ».
7. **Phrases dérivées** : sont maintenant reconnues « 3 personnes du même genre » (la règle), « à découvrir », « toi compris », et les comptes de l'amorçage.

Pour vérifier que ces contrôles fonctionnent, j'ai injecté des erreurs dans des copies de test : check-facts a relevé la garantie, le lien privé publiable en Story et la carte sans lien attribué.

**`a11y-audit`** : contrôles de mise en page, mesurés avec Playwright à partir des boîtes englobantes :

- **texte qui touche l'ombre d'un bouton** : texte placé à moins de 4 px sous le décalage plus le flou de l'ombre (sur la copie de test d'Abonnement : −3 px, détecté) ;
- **texte rogné** par un ancêtre en `overflow: hidden` ;
- **texte collé au bord** de son fond coloré : moins de 6 px à gauche ou 4 px à droite ;
- **date ou heure coupée** en fin de ligne : « mar. 10 nov. », « 21 h 30 », « 10 min ». En complément, le générateur pose des espaces insécables dans ces groupes.

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

- **Aujourd'hui** : lun. 9 nov. 2026. Alex (il, 26–29 ans, Paris 11e, Nino) donne son accord art. 9 à 20 h 50.
- **Sortie 1** : jeu. 12 nov. 19 h 30, Jeux de société.
  - **mer. 11 nov. 18 h** :
    - fin de l'annulation gratuite ;
    - le lieu (Café des Oiseaux, photo fournie par le lieu) ;
    - les prénoms, les tranches et les pets ;
    - l'effectif envoyé au lieu.
  - **jeu. 12 nov. 16 h 30** : les visages.
  - Votes jusqu'au dim. 15 nov. 21 h 30.
- **Groupe** : 5 personnes, 26–34 ans, 2 femmes et 3 hommes, Alex vient avec Tom, 3 nouvelles personnes. La seule règle affichée, comme règle générale : « Jamais plus de 3 personnes du même genre dans un groupe. »
- **Duo Jade** (pour une histoire, projet compatible activé par les deux) :
  - début : lun. 9 nov. 21 h 30 ;
  - visages : mer. 11 nov. 21 h 30 ;
  - rendez-vous : sam. 14 nov. 15 h.
- **Duo N.** (en amitié) : seulement l'initiale avant le oui.
- **Bordeaux** :
  - 64 personnes vérifiées, 3 lieux ;
  - il manque 2 personnes pour le sam. 21 nov., sinon sortie le sam. 28 nov. ;
  - carte « Aide Bordeaux à sortir ».
- **Lille** :
  - toi et 2 proches, plus 2 personnes de Lille : 2 femmes, 3 hommes, 22–29 ans ;
  - variante en solo : 3 femmes, 2 hommes ;
  - le lieu est nommé la veille, ven. 27 nov. 18 h.
- **Lyon** : Lyon 7e vers Lyon 4e (18 min), mar. 17 nov., Foot à 5.
- **Argent** :
  - places en Apple Pay ;
  - Blowy+ 9,99 €/mois en **achat intégré**, résiliable dans Réglages de l'iPhone › Abonnements, rentable dès 3 sorties par mois ;
  - une place vide après la veille 18 h : 4,99 € reversés au lieu, 3 € si elle était offerte.
- **Liens** :
  - `s/Hq3vT8` : cette semaine ;
  - `s/pL7c2N` : ce soir ;
  - `s/Zx9mQ4` : on était 5 ;
  - `s/aR5kW1` : ma bande s'agrandit ;
  - `v/bD8nY3` : Bordeaux ;
  - `i/r8Tz4w` : invitation personnelle, par message seulement ;
  - `m/k7f2q` : 3 mots ;
  - `a/…` : ange gardien.

## Changements du tour 4 (concept-v5.3)

- **A. Confidentialité** :
  - plus aucune garantie affichée ;
  - les « ? » portent « à découvrir » (neutre) ;
  - Duo : N. avant le oui, carte montrée seulement après ton oui ;
  - W-Ange-aide : « Lieu de la sortie · pas de position » ;
  - « Je sors ce soir » sans lieu, sans quartier ni heure, proposé avant la sortie (depuis Les visages) et retiré du Check-in.
- **B. Calendrier** :
  - une seule règle partout : « Annulation gratuite jusqu'au mer. 11 nov. 18 h, autant de fois que nécessaire » ;
  - Confirmation avec la liste des prénoms et pets, plus « Je connais quelqu'un ici » ;
  - « Je pars, mal à l'aise » : sans pénalité, l'équipe est prévenue, rappel au bout de 3 fois.
- **C. Argent** : Blowy+ en achat intégré, places en Apple Pay, compensation du lieu dite au client (Tarifs) et au lieu (L-Effectif, L-Contrat).
- **D. Onboarding** :
  - 9 écrans avant la Trouvée, une question chacun : Ville, Naissance, Genre, Pet, Rencontrer, Tu cherches, Consentement, Pour une histoire, Créneaux ;
  - les créneaux incluent les semaines d'absence et le trajet maximum (30 min par défaut) ;
  - le compte arrive après « Je viens » (« Ta place en 1 tap ») ;
  - « venir avec quelqu'un » et « proches » partout.
- **E. Viralité** :
  - 6 cartes visuellement distinctes (couleur et composition), chacune avec son lien ;
  - « Partager la soirée » est l'action principale de Résultats ;
  - nouvelle carte du dimanche, « Ma bande s'agrandit » ;
  - aucun duo proposé à l'inscription si l'on choisit le petit groupe.
- **F. Personas** :
  - portraits illustrés neutres à la place des lettres. **L'app montre les vraies photos vérifiées** ; la maquette ne montre jamais de vraie personne, et Vérif/Profil disent « ta photo ici » ;
  - Lyon et Lille en solo ;
  - « Réduire le pet » sur l'Accueil et « Taille du pet » dans Réglages ;
  - Ta rue : maisons, souvenirs dans le décor, « Offrir tes lunettes à Pépite » (facultatif) ;
  - Bordeaux daté ;
  - écran « Éviter les personnes que je connais » (empreintes chiffrées sur l'appareil, désactivé tant qu'on n'a pas dit oui).
- **Lieu** : 3 écrans web au même langage visuel, adapté au bureau (barre latérale encre, cartes crème) :
  - effectif de la veille 18 h, table Blowy avec prénoms seulement ;
  - créneaux et plafond de tables ;
  - contrat d'une page.
- **Défauts de pixel** :
  - légendes décalées de 14 px sous les boutons ;
  - « SORTIE VÉCUE » en encre pleine, au-dessus du flou ;
  - chips droites dans W-Repondre ;
  - marge du rappel dans Signaler, case « Bloquer aussi » au contour neutre ;
  - lignes « Tom vient · + 1 place » ;
  - plus aucune date coupée.

## Écarts au concept (et décisions tranchées)

| Sujet | Décision | Pourquoi |
|---|---|---|
| Compte | Il est demandé après « Je viens », pas avant la Trouvée. | Il permet de tenir « ≤ 9 écrans, une question chacun » sans rien fusionner. La place est gardée 30 min. |
| Consentement | Il compte comme une étape (7/9) même s'il n'apparaît que pour « histoire ». | La pastille avance de façon régulière. Le parcours « amitiés » saute les étapes 7 et 8. |
| Trajet maximum | Il est sur l'écran des créneaux, avec 30 min présélectionné. | D.14 demande un défaut affiché ; c'est la seule présélection de l'onboarding. |
| Vote | Aucun état par défaut. « Sans réponse, c'est non, sans rien afficher. » | Le jury lisait le « Non » en contour comme un choix. |
| Vote et résultats | Les vignettes gardent l'initiale sur un dégradé. | Ce sont des listes jouables en Play (holes texte seulement). Les portraits sont sur Les visages, Lien, Chat, Profil et Vérif. |
| Lien de la carte du jeudi | « Je sors ce soir » est proposé depuis Les visages (16 h 40), pas depuis le Check-in. | A.5 et « Range ton téléphone ». |
| Taille du pet | Le lien est sur l'Accueil, le réglage dans Réglages. | Un seul réglage (F.23). |

## Vocabulaire (un mot = un concept)

**sortie** · **groupe** (5 personnes) · **venir avec quelqu'un** / **tes proches** (« team » ne reste que dans des textes secondaires, jamais dans un titre ou un bouton) · **nouvelles personnes** · **à découvrir** · **bande** · **Ta rue** · **duo** (en amitié / pour une histoire) · **confirmation** (veille 18 h : lieu, prénoms, pets) · **visages** (J −3 h) · **besoin d'aide** · **check-in**, **code du chevalet** · **ange gardien** · **pause** · **mode discret** · **fiabilité** · **souvenir** · **accord** · **Partir proprement** · **place** (Apple Pay) · **Blowy+** (achat intégré) · vote **Amitié / Plus / Non**.

## Textes clés (i18n)

| Clé | Texte |
|---|---|
| compo.regle | Règle de chaque groupe : jamais plus de 3 personnes du même genre dans un groupe. |
| compo.inconnu | à découvrir |
| trouvee.amis | Cette semaine, sortie entre amis pour toi. On te le dit avant que tu choisisses. |
| sortie.annulation | Annulation gratuite jusqu’au {veille 18 h}, autant de fois que nécessaire. Ensuite, c’est une absence : le lieu a reçu l’effectif. |
| confirmation.groupe | Ton groupe · sans visages jusqu’à J −3 h — {prénom} · {tranche} · {pet} |
| revelation.captures | Ton prénom est en filigrane sur chaque visage ; les captures sont détectées et signalées. |
| team.title | Viens avec quelqu’un. |
| invite.lien | Ce lien t’a été envoyé par message, à toi seul : il ne marche qu’une fois. |
| attente | Il manque {n} personnes pour ta sortie du {jour}. … Sinon, Nino te propose le {date}, même créneau. |
| carte.confirmation / checkin / soiree / dimanche / ville / invitation | Cette semaine, je sors avec 3 nouvelles personnes. / Je sors ce soir. / On était 5. / Ma bande s’agrandit. / Aide {ville} à sortir. / Viens avec moi. |
| duo.limite | Gratuit : 1 duo actif. Blowy+ : sans limite. · Ou viens jeudi en groupe › |
| duo.avantOui | N. ne voit ta carte qu’après ton oui. Prénom et carte complète : seulement si vous dites oui tous les deux. |
| abonnement | Achat intégré, résiliable à tout moment dans Réglages de l’iPhone › Abonnements. |
| tarifs.lieu | Le lieu ne prend rien sur ta place. Si ta place reste vide après la confirmation de la veille, son prix est reversé au lieu (3 € si elle était offerte). |
| eviter | Ton téléphone transforme chaque numéro en empreinte chiffrée. On compare seulement les empreintes. |
| ange.aide | Alex a besoin d’aide. · Lieu de la sortie · pas de position |

## Générateur

Les écrans sont générés par des scripts Python, hors dépôt, qui lisent `facts.json` : base commune, A, B, C/D, E/F/G/H, lieu et `canvas.json`. Les `.dc.html` livrés sont autonomes et éditables à la main. Après toute modification, relancer `check-facts.mjs` et `a11y-audit.mjs`.
