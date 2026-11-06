# Maquettes V5.5 « Ton pet te trouve une bande »

Ces maquettes servent de référence pixel-perfect au développement. Les règles produit viennent de six documents, du plus ancien au plus récent :

- `docs/product/concept-v5.md` ;
- `concept-v5.1.md` ;
- `concept-v5.2.md` ;
- `concept-v5.3.md` ;
- `concept-v5.4.md` ;
- **`docs/product/concept-v5.5.md`** (sections A–E), qui prime sur tous les autres.

Le tour 6 répond au jury tour 5 (`docs/research/jury/round-5/`, bloquant : rendez-vous Duo de jour sans astreinte) et au test des 5 secondes (`docs/research/jury/test-5-secondes-r5.md`).

## Contenu

- **97 artboards** dans `project/` :
  - 91 écrans d'app et 3 pages web, en 390 × 844 ;
  - **3 écrans côté lieu** (web admin) en 1280 × 800 : `L-Effectif`, `L-Creneaux`, `L-Contrat`.
- **`project/canvas.json`** : la page « v5 — Bande » compte 10 rangées (A, B, B', C à H, L), avec des titres de 01 à 62 (variantes en b, c, d…), plus 4 notes.
- **`facts.json`** : source unique des chiffres, dates et règles. Il contient :
  - le calendrier B : `annulationGratuiteIso` = lieu de la veille à 18 h ;
  - l'heure de l'accord (art. 9), avant tout duo ;
  - la règle d'équilibre. La garantie n'y est plus.
  - Bordeaux, Lyon et Lille en solo ;
  - un lien par carte (`slugs`, `slugParFichier`, `slugsPrives`).
- **`check-facts.mjs`** : `node design/v5/check-facts.mjs [filtre]`.
  - Résultat : **97 fichiers, 6 039 vérifications, 0 contradiction**.
- **`a11y-audit.mjs`** : `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js [filtre]`.
  - Il audite le contraste, les cibles de 44 pt et **la mise en page sur le DOM rendu**.
  - Résultat : **97 écrans, 1 423 textes, 538 cibles, 1 462 blocs de texte mesurés, 0 problème, contraste minimum 4,53:1**.
  - L'outil du jury `tooling/qa/layout/overflow.mjs` ne signale plus rien. Ses contrôles (texte hors cadre, plages « 26–29 ans » ou « 3 hommes » coupées) sont repris dans `a11y-audit`.
  - Les écrans qui défilent ont, dans `canvas.json`, la hauteur de leur rendu.
- **`render-v5.mjs`** : c'est la même logique que `tooling/design-render/render.mjs`, qui reste inchangé, mais chaque écran est rendu à sa taille (390 × 844 @2x, lieu en 1280 × 800 @1x).
  - Commande : `DESIGN_ROOT=design/v5 NODE_PATH=$(npm root -g) node design/v5/render-v5.mjs .local/dc-runtime.js design/v5/renders [filtre]`.
  - Les 97 rendus de `renders/` ont été relus.

### Contrôles ajoutés au tour 6 (`check-facts`)

1. **Astreinte** : jamais restreinte à une plage horaire (« 18 h à 2 h » est banni).
2. **Rendez-vous Duo** : toujours dans un lieu partenaire, avec la phrase d'astreinte exacte ; « Lieu public » est banni.
3. **Check-in** : par code seulement ; « position une fois » et « vérifier ma position » sont bannis.
4. **Carte Duo** : jamais le nom du pet de N. avant le double oui.
5. **Indicateurs de ville** :
   - un nombre affiché vaut au moins 10, est arrondi à la dizaine et précédé de « environ » ;
   - « histoire compatible avec la tienne » n'apparaît que dans un indicateur de ville arrondi (« À Paris 11e, une trentaine… »).
6. **Imprévu** : une fois par mois (« trimestre » est banni). La règle canonique est mise à jour.

### Contrôles ajoutés au tour 5 (`check-facts`)

1. **Aucun signal de compatibilité** : sont bannis « sortie entre amis », « entre amis pour toi », « une histoire est possible », « vous vous plaisez » et « Personne ne le voit, ni ne peut le deviner ».
2. **Règle d'annulation unique** :
   - le texte canonique de `facts.annulation.regle` est présent sur Sortie, Fiche, Confirmation et Tarifs (une date peut remplacer « la veille 18 h ») ;
   - « 1 fois par mois » n'apparaît qu'avec « je connais quelqu'un ici », et « 1 fois par trimestre » qu'avec l'imprévu.
3. **Carte Duo** : avant le double oui, ni tranche, ni type, ni activités de N.
4. **Duos** : toute mention « N duos actifs » vaut 3 ; « duos illimités » et « duos sans limite » sont bannis.
5. **Blowy+** : il n'est jamais en achat intégré (terme banni), et l'écran Blowy+ dit « Apple Pay » et ne vend que des sorties.
6. **Liens** : au moins 8 caractères pour un lien public, 12 pour un lien nominatif.
7. **Contrôle des contrôles** : sur des copies piégées, check-facts a bien relevé le bandeau « entre amis », la tranche et le type sur la carte Duo, la règle d'annulation modifiée et Blowy+ en achat intégré.

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
  - Blowy+ 9,99 €/mois : abonnement aux sorties, payé avec **Apple Pay**, résiliable dans l'app, rentable dès 3 sorties par mois ; Duo gratuit, 3 duos actifs au plus ;
  - une place vide après la veille 18 h : 4,99 € reversés au lieu, 3 € si elle était offerte ou dans Blowy+ ; 3 € par place si Blowy annule une sortie confirmée ; relevé mensuel.
- **Liens** :
  - `s/Hq3vT8` : cette semaine ;
  - `s/pL7c2N` : ce soir ;
  - `s/Zx9mQ4` : on était 5 ;
  - `s/aR5kW1` : ma bande s'agrandit ;
  - `v/bD8nY3` : Bordeaux ;
  - `i/r8Tz4w` : invitation personnelle, par message seulement ;
  - `m/k7f2q` : 3 mots ;
  - `a/…` : ange gardien.

## Changements du tour 6 (concept-v5.5 et test des 5 secondes)

- **Sécurité (bloquant)** :
  - l'astreinte couvre toutes les heures de créneaux ; partout, la phrase est « Une personne de l'équipe est joignable pendant toute ta sortie. » ;
  - le rendez-vous avec Léa passe au Café Ginette, avec une table à deux réservée après les deux oui ;
  - check-in par code seulement ;
  - proposition Duo : « Un capybara · N. », l'espèce et l'initiale, sans le nom du pet.
- **Imprévu** : une fois par mois, sans pénalité, place non remboursée. Les visages n'ont plus que 3 actions : je connais quelqu'un ici, je ne peux plus venir, partager.
- **Promesse vérifiable** :
  - Bordeaux : « environ 40 inscrits ont entre 18 et 25 ans » ;
  - Duo : « À Paris 11e, une trentaine de personnes cherchent une histoire compatible avec la tienne » ;
  - nouvel état « Cette semaine, pas encore » (Marseille) ;
  - Affiner : ambiance, âge pour une histoire, horizon pour les enfants ;
  - duo homme-homme (V5-Duo-hh).
- **Viralité** :
  - parrainage : une sortie offerte, une fois par mois au plus ;
  - partage sur Confirmation et sur les Trouvées de Lyon et Saint-Denis ;
  - cartes « Alors, jeudi ? » et « Ma bande » en mode capture, export « Vidéo 5 s » ;
  - « Mes cartes » en vignettes 9:16 ;
  - « Ma bande s'agrandit » sans mascotte.
- **Lieu** :
  - « Blowy annule » formulé à l'identique côté client et contrat ;
  - relevé détaillé par soirée ;
  - contrat signé par les deux parties, avec un article Responsabilité et les montants TTC/HT ;
  - astreinte « pendant tous vos créneaux ».
- **Gabarit unique** : Trouvée, Sortie et Confirmation sont générées par les mêmes fonctions pour Paris, Lyon et Saint-Denis (avec Yacine). Lyon a désormais un lieu cohérent avec l'activité.
- **Test des 5 secondes** :
  - frise de 3 jalons sur Sortie, règles derrière « Règles d'annulation › » ;
  - « Offerte (ta 1re sortie) · ensuite 4,99 € » sous le bouton ;
  - « Tom vient avec toi · 3 nouvelles personnes » ;
  - « à découvrir la veille » ;
  - « Nino (ton pet) t'a trouvé une sortie », et « Inviter quelqu'un à venir avec toi » ;
  - « Lieu révélé mer. 11 nov. 18 h », « Mettre en pause mes sorties » et « Taille du pet », partout où ces libellés apparaissent.
- **Phrases de Léa** :
  - « Personne ne voit que tu es en pause » ;
  - « Annulée le mer. 11 nov. à 18 h » ;
  - « Titre dans ton agenda : « Rendez-vous · 19 h 30 » » ;
  - « supprimée sous 48 h » ;
  - « Urgent pendant une sortie · < 1 h » ;
  - pastille grise dans Chats ;
  - Vérif « Alex · 26–29 ans ».
- **Finitions** :
  - Team : « selfie à faire » avec une horloge, bouton « Garder la place de Tom (30 min) » ;
  - Invite et Souvenir sans grande mascotte (Souvenir : 5 verres sur une table) ;
  - une seule liste « qui voit quoi » (Confidentialité, avec le pet et le nombre de femmes et d'hommes) ;
  - Affiner ne garde que les questions de rencontre ;
  - « Semaines off » coché dessiné ;
  - « Ne ressemble pas à ses photos » ;
  - apostrophes typographiques partout, insécables dans « 26–29 ans » et « d'ici là ».

## Changements du tour 5 (concept-v5.4)

- **A. Confidentialité** :
  - le bandeau « entre amis » est supprimé avec son écran ;
  - promesse générale sur Intention, Pour une histoire et Confidentialité : « Si tu cherches une histoire, Blowy compose tes groupes pour qu'elle soit possible. Il ne te dira jamais avec qui. » ;
  - proposition Duo : pet et initiale seulement ;
  - phrase « vous avez dit oui tous les deux » ;
  - Confidentialité : ligne « Le lieu : ton prénom et ton pet, la veille à 18 h » ;
  - mode discret choisi à l'inscription (« Discret » ou « Normal », aucun présélectionné) ;
  - écran « Éviter les personnes que tu connais » dans le parcours, avant la Trouvée ;
  - Welcome : « Toutes orientations · en groupe ou à deux », de 18 à 60 ans et plus, une table de 5.
- **B. Imprévus** :
  - une seule règle, écrite sur Sortie, Confirmation, Fiche, Tarifs et Sortie à Lyon ;
  - imprévu une fois par trimestre (lien sur Les visages) ;
  - « une semaine sur deux » expliqué sous les créneaux, avec la ligne « Semaines sans moi » dans Réglages.
- **C. Argent** :
  - Blowy+ est un abonnement aux sorties, payé avec Apple Pay et résiliable dans l'app ;
  - Duo gratuit, jusqu'à 3 duos actifs (l'écran « Un 2e duo ? » est supprimé) ;
  - lieu : 3 € par place si Blowy annule une sortie confirmée, relevé mensuel (novembre : 2 places vides, 7,99 €, versés le 5 décembre), bouton « Signaler un participant », SMS en cas de demande d'aide à sa table ;
  - contrat avec un article Données ; tables à deux dans la grille.
- **D. Finitions** :
  - « selfie à faire » au lieu de « vérifié » (Team) ;
  - temps de trajet sur toutes les Trouvées, et Saint-Denis vers Paris 18e ;
  - Lyon complet : Trouvée, Sortie, Confirmation, et la sortie de la semaine suivante ;
  - Lille en solo dans 5 jours, formulation épicène ;
  - Résultats : « Écrire à Léa » en action principale ;
  - « Partager Nino seul » ;
  - nouvel écran « Mes cartes » ;
  - Profil : « 1 / 1 » sur une ligne, pronom modifiable ;
  - interrupteurs de l'œuf liés ;
  - « Un jeu de cartes ? On est pile 5 ! » ;
  - Trouvée sur fond crème, raton réduit, activité « choisie selon le lieu et vos envies » ;
  - les « ? » du groupe portent une légende unique ;
  - insécables pour « 3 hommes », « du 11e », « toi compris », « check-in » ;
  - pages web sans villes codées en dur ;
  - case « J'ai 18 ans ou plus » ;
  - Chargement : « ta proposition arrive lundi à 21 h » ;
  - cartes « Cette semaine » (enveloppe scellée, choix « Demain » dessiné), « Je sors ce soir » (vert canard, chevalet) et « On était 5 » (5 verres, interrupteur « Sans logo ») : couleur et composition propres ;
  - invitation sans mascotte, avec « Texte + lien ».

## Changements du tour 4 (concept-v5.3, pour mémoire)

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
- **C. Argent** (tour 4, remplacé au tour 5 : Blowy+ passe en Apple Pay) : Blowy+ en achat intégré, places en Apple Pay, compensation du lieu dite au client (Tarifs) et au lieu (L-Effectif, L-Contrat).
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
| Réglage du Duo par carte | La carte « Un capybara · N. » montre une illustration de l'espèce, jamais le nom. | C.3. |
| Éviter | Écran facultatif sans numéro d'étape, entre Créneaux et Trouvée. | A.6 le veut avant la 1re composition ; il ne compte pas dans « ≤ 9 questions » car il n'en pose pas pour composer. |
| Mode discret de la démo | Alex a choisi « Normal » : Notifications montre l'icône blowy., Confidentialité dit « tu as choisi normal ». | Les exemples sont fidèles à l'état choisi. |
| Compte | Il est demandé après « Je viens », pas avant la Trouvée. | Il permet de tenir « ≤ 9 écrans, une question chacun » sans rien fusionner. La place est gardée 30 min. |
| Consentement | Il compte comme une étape (7/9) même s'il n'apparaît que pour « histoire ». | La pastille avance de façon régulière. Le parcours « amitiés » saute les étapes 7 et 8. |
| Trajet maximum | Il est sur l'écran des créneaux, avec 30 min présélectionné. | D.14 demande un défaut affiché ; c'est la seule présélection de l'onboarding. |
| Vote | Aucun état par défaut. « Sans réponse, c'est non, sans rien afficher. » | Le jury lisait le « Non » en contour comme un choix. |
| Vote et résultats | Les vignettes gardent l'initiale sur un dégradé. | Ce sont des listes jouables en Play (holes texte seulement). Les portraits sont sur Les visages, Lien, Chat, Profil et Vérif. |
| Tarif étudiant | Non maquetté. | Hors concept-v5.4 ; à trancher dans business-model. |
| Lien de la carte du jeudi | « Je sors ce soir » est proposé depuis Les visages (16 h 40), pas depuis le Check-in. | A.5 et « Range ton téléphone ». |
| Taille du pet | Le lien est sur l'Accueil, le réglage dans Réglages. | Un seul réglage (F.23). |

## Vocabulaire (un mot = un concept)

**sortie** · **groupe** (5 personnes) · **venir avec quelqu'un** / **tes proches** (« team » ne reste que dans des textes secondaires, jamais dans un titre ou un bouton) · **nouvelles personnes** · **à découvrir** · **bande** · **Ta rue** · **duo** (pet + initiale avant le double oui) · **confirmation** (veille 18 h : lieu, prénoms, pets) · **visages** (J −3 h) · **besoin d'aide** · **check-in**, **code du chevalet** · **ange gardien** · **pause** · **mode discret** · **fiabilité** · **souvenir** · **accord** · **Partir proprement** · **place** (Apple Pay) · **Blowy+** (abonnement aux sorties, Apple Pay) · vote **Amitié / Plus / Non**.

## Textes clés (i18n)

| Clé | Texte |
|---|---|
| compo.regle | Règle de chaque groupe : jamais plus de 3 personnes du même genre dans un groupe. |
| compo.inconnu | à découvrir |
| promesse | Si tu cherches une histoire, Blowy compose tes groupes pour qu’elle soit possible. Il ne te dira jamais avec qui. |
| annulation | Annulation gratuite jusqu’à la veille 18 h. Ensuite, c’est une absence, sauf pour ta sécurité, « je connais quelqu’un ici » ou un imprévu (chacun 1 fois par mois, sans pénalité, place non remboursée). |
| astreinte | Une personne de l’équipe est joignable pendant toute ta sortie. |
| parrainage | Quand la personne que tu invites vient à sa 1re sortie, ta prochaine sortie est offerte (1 par mois au plus). |
| pas.encore | Cette semaine, pas encore assez de personnes compatibles avec ce que tu cherches sur tes créneaux. Tu peux sortir quand même (en amitié) ou attendre la semaine prochaine. |
| compte.mode | Sur ton téléphone, blowy. apparaît… Discret / Normal |
| confirmation.groupe | Ton groupe · sans visages jusqu’à J −3 h — {prénom} · {tranche} · {pet} |
| revelation.captures | Ton prénom est en filigrane sur chaque visage ; les captures sont détectées et signalées. |
| team.title | Viens avec quelqu’un. |
| invite.lien | Ce lien t’a été envoyé par message, à toi seul : il ne marche qu’une fois. |
| attente | Il manque {n} personnes pour ta sortie du {jour}. … Sinon, Nino te propose le {date}, même créneau. |
| carte.confirmation / checkin / soiree / dimanche / ville / invitation | Cette semaine, je sors avec 3 nouvelles personnes. / Je sors ce soir. / On était 5. / Ma bande s’agrandit. / Aide {ville} à sortir. / Viens avec moi. |
| duo.limite | Gratuit : jusqu’à 3 duos actifs. Une proposition reste 48 h. · Ou viens jeudi en groupe › |
| duo.avantOui | Avant vos deux oui, chacun ne voit que le pet et l’initiale de l’autre. Le reste de la carte, après ; le prénom, aux visages. |
| abonnement | Un abonnement aux sorties, payé avec Apple Pay. Sans engagement, résiliable ici à tout moment. Les duos restent gratuits pour tout le monde. |
| tarifs.lieu | Le lieu ne prend rien sur ta place. Si ta place reste vide après la confirmation de la veille, son prix est reversé au lieu (3 € si elle était offerte). |
| eviter | Ton téléphone transforme chaque numéro en empreinte chiffrée. On compare seulement les empreintes. |
| ange.aide | Alex a besoin d’aide. · Lieu de la sortie · pas de position |

## Générateur

Les écrans sont générés par des scripts Python, hors dépôt, qui lisent `facts.json` : base commune, A, B, C/D, E/F/G/H, lieu et `canvas.json`. Les `.dc.html` livrés sont autonomes et éditables à la main. Après toute modification, relancer `check-facts.mjs` et `a11y-audit.mjs`.
