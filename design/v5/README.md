# Maquettes V5.1 « Ton pet te trouve une bande »

Ces maquettes servent de référence pixel-perfect au développement. Les règles produit sont dans `docs/product/concept-v5.md`, amendé par **`docs/product/concept-v5.1.md`** (décisions A à J, qui priment). Le tour 2 répond au jury tour 1 (`docs/research/jury/round-1/`).

## Contenu

- **75 artboards** de 390 × 844 dans `project/` :
  - 72 écrans d'app et 3 pages web ;
  - 5 écrans défilent (Sortie, Révélation, Réglages, Confidentialité, Signaler) ;
  - tous en `lang="fr"`, `is_interactive`.
- **`project/canvas.json`** : la page « v5 — Bande » compte 8 rangées (A à H) dans l'ordre du parcours, avec des titres numérotés de 01 à 61, plus 4 notes (changements, casting, argent, boucles).
- **`facts.json`** : source unique des chiffres et dates de la démo. Ce sont des dates 2026 réelles, avec le jour de semaine vérifié.
- **`check-facts.mjs`** : vérifie que chaque `.dc.html` respecte `facts.json`. Il contrôle :
  - le jour de semaine de chaque date ;
  - qu'aucun « jeudi N » n'est inventé ;
  - la taille du groupe (« 5 personnes », « 4 + toi », « 4 inconnu·es », « on était 5 ») ;
  - que tout prix en € figure dans la liste autorisée ;
  - le nombre de souvenirs, la taille de la bande et la jauge de la ville fermée ;
  - les mots interdits : ngl, XP, compte à rebours, « près de toi », « en route », « boisson incluse », 12 €, 19,99.
  - Commande : `node design/v5/check-facts.mjs`.
  - Résultat : **75 fichiers, 786 vérifications, 0 contradiction**. Testé aussi sur un fichier piégé : il détecte bien les 7 erreurs plantées.
- **`a11y-audit.mjs`** : audit WCAG 2.2 AA dans Chromium.
  - Il calcule le contraste de chaque texte visible sur son vrai fond (dégradés compris, en retenant le pire point du dégradé). Seuil : 4,5:1, ou 3:1 pour le gros texte.
  - Il mesure chaque cible tactile (≥ 44 × 44 pt ; pour un champ, c'est le label qui compte).
  - Commande : `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js`.
  - Résultat : **1 042 textes, 420 cibles, 0 problème, contraste minimum 4,53:1**.
- **Rendus** : `renders/*.png` (@2x), produits avec `tooling/design-render/render.mjs` par lots filtrés. Les 75 écrans sont rendus sans erreur JS.

## Jetons et accessibilité

Le langage visuel est celui de la V4 : crème `#FFF7EC`, encre `#16110D`, citron `#C8F542`, mangue `#FFB347`, rose `#FF3D7F`, violet `#7C3AED`, Bricolage Grotesque 800 + Inter, boutons `.btn` à ombre portée, `.chip`, `.card`, `.grp/.row`, barre en verre.

Pour passer l'AA, certaines couleurs ont été foncées pour le texte et les fonds sous texte :

| Usage | V4 | V5.1 | Contraste |
|---|---|---|---|
| Bouton principal (texte blanc) | `#FF5A3C` (3,1:1) | `#D93A1C` | 4,59:1 |
| Texte corail sur crème | `#FF5A3C` (2,9:1) | `#C4341B` | 5,1:1 |
| Rose sous texte blanc | `#FF3D7F` (3,4:1) | `#C2185B` | 5,9:1 |
| Texte secondaire | `#8A7E70` (3,7:1) | `#6F6458` / `#5A5047` | 5,8 / 7,4:1 |
| Vert de validation (texte) | `#2EAD6A` (2,9:1) | `#1E7A47` | 5,3:1 |

Le corail vif et le rose restent utilisés pour les surfaces décoratives. Le texte blanc n'est jamais posé sur un dégradé clair : les écrans « chauds » (Trouvée, Souvenir) ont du texte encre.

Autres réglages d'accessibilité :

- Interrupteurs à 44 pt de zone tactile.
- Points du logo « blowy. » en `aria-hidden`.
- `prefers-reduced-motion` coupe toutes les animations.
- Pastilles de progression doublées d'un `aria-label` (« Étape 3 sur 8 »).
- Rien n'est présélectionné : le bouton reste grisé, avec un libellé qui dit quoi faire (« Choisis une réponse »).

## Casting et données (extrait de `facts.json`)

- **Toi** : Alex, il, 26–30 ans, Paris 11e (accepte aussi le 10e et le 20e), pet Nino.
- **Sortie** : jeu. 12 nov., 19 h 30 – 21 h 30, jeux de société dans un bar à jeux du 11e.
  - Confirmation : mer. 11 nov. 18 h. On y découvre le Café des Oiseaux, son adresse, sa photo et les visages.
  - Votes jusqu'au dim. 15 nov. 21 h 30.
- **Groupe de 5** (« 4 + toi ») : 26–31 ans, 2 femmes et 3 hommes, 2 en team.
  - Tom (sa team, pet Pépite, un lutin) ;
  - Léa (Suzie) ;
  - Malo (Gaston) ;
  - Sarah (Pia).
- **Semaine suivante** : jeu. 19 nov., bloc d'escalade.
- **Duo** : Jade (Caramel).
  - Visages ven. 13 nov. 21 h ;
  - rendez-vous mar. 17 nov. 19 h au Comptoir Gabriel ;
  - rendez-vous avec Léa sam. 21 nov. 15 h, expo.
- **Bande** : Tom et Sarah (2). Nino a 3 souvenirs. Fiabilité : 1 sortie sur 1.
- **Ville fermée** : Saint-Denis, 87 / 120 personnes vérifiées, ouverture estimée en mars 2027, 25 min de RER D + métro jusqu'à Paris 11e.
- **Prix** : 1re sortie offerte, puis 4,99 € la place (consommation non incluse). Blowy+ à 9,99 €/mois. Statut démo : Gratuit.

## États

Une seule méthode : **un artboard par état important**. Il est relié au flux par un lien, ou posé seul sur le canvas pour les états d'erreur. Les états internes simples sont jouables en Play via `state` : sélections, votes, Rupture envoyée, W-Repondre envoyé, chat « L'utiliser ».

Une seule data-prop enum subsiste : `V5-Intention` (`etat` = vide / rempli). Son artboard `V5-Intention-rempli` montre les sous-choix secrets.

## Écrans dans l'ordre du parcours

Légende : *garder* = V4 copiée et ajustée ; *changer* = refait avec les composants V4 ; *nouveau* ; *P1* = reproche du jury tour 1 traité.

### A · Arrivée : la ville d'abord, aucune réponse présélectionnée

| # | Fichier | Source | Ce qui change (P1) | Liens |
|---|---|---|---|---|
| 01 | V5-Welcome | 01 Welcome | Titre « Des ami·es ou plus. En vrai, cette semaine. » ; 2e porte « ou un tête-à-tête, par écrit d'abord » ; « 18+ · selfie vérifié pour tous » ; villes ouvertes et date pour les autres ; « Tous genres, toutes orientations » ; 5 pets pour 5 personnes ; « pets & potes » retiré | Ville |
| 02 | V5-Ville | nouveau (B.5, B.8) | 1er écran : saisie libre avec suggestions, jamais de géolocalisation ni de « près de toi » ; quartiers acceptables ; trajet maximum facultatif | Rencontrer |
| 02b | V5-Ville-fermee | nouveau (B.6) | « Saint-Denis : pas encore », 87 / 120 personnes vérifiées, ouverture estimée en mars 2027, un seul message le jour J ; alternatives : venir à Paris 11e, ou former une team ; inscription en 1 tap, **avant toute création de pet** | Attente, Team-amorcage |
| 02c | V5-Team-amorcage | nouveau (B.7) | Team de 2 sur 3 : à 3 personnes vérifiées, sortie d'amorçage avec une autre team de la ville | Partage-ville, Attente |
| 03 | V5-Rencontrer | nouveau (F.17) | « Comment tu préfères rencontrer ? » : petit groupe, à deux par écrit, ou les deux | Intention |
| 04 | V5-Intention (+ -rempli) | 05 Intention | Nouveaux potes / Une histoire / Les deux, rien de coché ; sous-choix secrets « sérieuse / on verra » et « enfants : oui / non / je ne sais pas » ; toute la carte est la cible | Consentement |
| 05 | V5-Consentement | nouveau (G.20) | Consentement explicite et révocable (RGPD art. 9) avant les questions sensibles ; « Amitié seule » comme alternative à égalité | Toi |
| 06 | V5-Toi | Toi | Genre sans présélection, « Un autre mot… » et « Je préfère ne pas dire » en cartes ; **pronom choisi à part** | Toi-plus |
| 07 | V5-Toi-plus | Toi-plus | **Choix multiple** femmes / hommes / non-binaires, rien de coché ; « tout le monde voit les mêmes 3 boutons » | Craft |
| 08 | V5-Craft | 03 Craft | Une décision par écran : l'espèce (5, toutes gratuites) ; les curseurs sont retirés ; à quoi sert le pet, et on ne dit jamais son nom à voix haute | Vie |
| 09 | V5-Vie | 04 Vie | 3 questions (au lieu de 4 écoles) : activités de sortie (D.14), dimanche idéal, sujets élargis (asso, volley, « + Autre, j'écris ») ; un seul indicateur « 1 sur 3 » | Dispos |
| 10 | V5-Dispos | nouveau (D.13) | Créneaux de la ville (mar. soir, jeu. soir, sam. après-midi, dim. brunch) ; « une semaine sur deux » (paires ou impaires) ; 1 proposition par semaine au plus | Éclosion |
| 11 | V5-Eclosion | 06 Éclosion | 1,5 s, « touche pour passer » ; CTA « Créer mon compte » (plus « Garder Nino pour de vrai ») | Compte |
| 12 | V5-Compte (+ -age) | 07 Compte | Apple, Google ou téléphone ; puis **date de naissance** (tranche affichée, jamais l'âge exact), **âge du groupe** (curseur, ±4 ans par défaut, secret) et **prénom affiché** modifiable | Trouvée |

### B · Ta sortie de la semaine

| # | Fichier | Source | Ce qui change | Liens |
|---|---|---|---|---|
| 13 | V5-Trouvee | 10 Match | « Nino t'a trouvé une sortie » : jeu. 12 nov. 19 h 30 – 21 h 30, activité ; **composition anonyme** (5 personnes · 26–31 ans · 2 femmes, 3 hommes · 2 en team), aucun prénom d'inconnu ; « Partager » (mode capture) ; « Trop de monde ? Essaie à deux » | Sortie, Partage-semaine, Duo |
| 14 | V5-Sortie | nouveau | Composition anonyme ; « Comment ça se passe » (table Blowy, code du chevalet, cartes de questions facultatives, personne n'anime, chacun paie ce qu'il boit, tu pars quand tu veux) ; prix offert puis 4,99 € annoncé, aucune carte demandée ; team ; annulation gratuite jusqu'à la confirmation, ensuite = absence ; menu « … » Signaler | Verif, Team, Accueil |
| 15 | V5-Verif | 08 Vérif | « Vérifions que c'est toi » (au lieu de « Prouve que t'es toi ») ; ce que vérifie le selfie (vivant, 18+, ressemblance) ; durée de conservation ; 1 à 3 photos avec 3 conseils | Notifs, Verif-echec |
| 16 | V5-Notifs | 11 Notifs | Interrupteur **mode discret activé** ; exemples neutres (« Rappel ») ; 1 proposition par semaine au plus | Accueil, Notifs-refus |
| 17 | V5-Sortie-inscrit | nouveau | Bandeau pleine largeur « Tu y vas » ; ange gardien en ligne (facultatif) ; team ; « Ajouter à mon agenda » (sans le mot blowy) ; chat « 3 messages » | Groupe, Ange, Team |
| 18 | V5-Team | nouveau (B.7, I.28) | Viens avec 1 à 2 ami·es : leur 1re sortie est offerte, Nino garde l'équilibre, selfie pour tous | Partage-invitation |
| 19 | V5-Accueil (+ -discret) | 12 Nid | La carte sortie en premier ; « Tom vient avec toi · + Inviter » (team remontée) ; Ta bande / Tes duos sans compteur de places ; scène du pet réduite en bas ; **Pause** en 1 tap ; un seul badge (messages). Variante discrète : « Agenda », aucun pet ni prénom | Sortie-inscrit, Team, Pause |
| 20 | V5-Pause | nouveau (D.15) | 1 semaine / 2 semaines / jusqu'à mon retour ; rien n'est perdu | Accueil |
| 21 | V5-Chats (+ -vide) | 18 Chats | « Jeudi · 4 + toi » ; badges cohérents (3 + 1 = 4) ; état vide qui dit quoi faire | Groupe, Lien |
| 22 | V5-Groupe (+ -menu) | nouveau | Menu « … » : **Signaler, Bloquer, Quitter la sortie, Couper les notifications** ; « Messages modérés · pas de numéro ni de réseau avant jeudi » ; brise-glace facultatif ; « Rien d'obligatoire avant jeudi » | Revelation, Signaler |
| 23 | V5-Sortie-complete | refait (pire écran) | « Pas de place cette fois » : la raison exacte (réponse arrivée après la composition), **aucun groupe affiché**, rien n'est réservé sans accord, « Oui, le 19 / Non merci » | Sortie-inscrit |
| 24 | V5-Sortie-annulee | refait | Message neutre (« pas assez de confirmations, ce n'est la faute de personne ») ; ta 1re sortie reste offerte, fiabilité intacte, team prévenue ; **aucune échéance périmée** ; autre lieu et autre activité | Sortie-inscrit |
| 25 | V5-Attente | refait (27 Vide) | « Saint-Denis ouvre vers mars 2027 », 87 / 120 personnes vérifiées, 3 lieux nécessaires (2 signés), un seul message ; alternatives : sortie à Paris 11e (25 min), team 2 / 3, voie Duo déjà ouverte ; **aucun bouton « Inviter » culpabilisant** | Sortie, Team-amorcage, Duo |

### C · La veille et le jour J

| # | Fichier | Ce qui change |
|---|---|---|
| 26 | V5-Revelation | **Confirmation la veille à 18 h** (E.16) : nom, photo et adresse du lieu, métro, table ; visages avec **tranche d'âge** ; captures signalées ; « Je connais quelqu'un ici · retrait discret, sans pénalité » ; « Je ne peux plus venir · compte comme une absence » ; Signaler |
| 27 | V5-Ange | Facultatif, pour cette sortie seulement ; liste de ce que l'ange voit et ne voit jamais ; lien secret qui expire, retirable sans prévenir |
| 28 | W-Ange (+ -alerte) | URL à **jeton aléatoire**, sans prénom ; expiration affichée ; marge de 30 min expliquée ; « Je n'arrive pas à joindre Alex » ; « Ce lien ne m'est pas destiné ». Alerte : position **au moment de l'alerte**, texte à lire au 17, l'équipe rappelle sous 5 min, **le personnel du lieu n'intervient pas** |
| 29 | V5-Checkin (+ -code, -ok) | Bouton sans pet ; repli « code du chevalet » (état « plus de 150 m ») ; seulement des coches « arrivé·e », **jamais « en route »** ; pas de quiz ni de « boisson au nom de Nino » ; Signaler en en-tête ; « Besoin d'aide » expliqué ; « Je pars, mal à l'aise · remboursé·e, sans effet » ; alerte séparée du faux appel (appui long) |

### D · Après la sortie

| # | Fichier | Ce qui change |
|---|---|---|
| 30 | V5-Souvenir | Titre « Sortie vécue » sans « +1 » géant ni fiabilité ; **CTA principal « Partager la soirée »** ; vote en 2e |
| 31 | V5-Partage | Carte 9:16 « On était 5. » avec les pets du groupe, sans visages ni prénoms ; options « citer le lieu » et « sans logo » ; icônes génériques (Story, Message, Enregistrer, Copier le lien), aucun faux logo |
| 32 | V5-Apres | **Vote sur un seul écran** : une ligne par prénom, 3 pastilles Ami·e / Plus / Non **pour tout le monde**, « non » par défaut, « Un problème ? » sur chaque ligne ; « Plus vaut au moins ami·e » écrit en tête ; modifiable ; résultats à date fixe |
| 33 | V5-Apres-resultats (+ -aucun) | « Tes accords » : on ne voit que les siens, aucun « tout le monde a voté » ; un seul CTA ; partage « pets seulement ». État **0 accord** au ton neutre |
| 33c | V5-Partage-accords | Carte « +1 dans ma bande, +1 duo » avec pets seulement |
| 34 | V5-Bande | « 2 dans ta bande » (sans te compter) ; un pet distinct par personne ; « + Jeudi » sur chaque ligne ; menu par ligne (Partir proprement, bloquer) ; « Sortie de bande » (bande + 2 nouvelles personnes) |

### E · Duo

| # | Fichier | Ce qui change |
|---|---|---|
| 35 | V5-Duo | Gratuit ; **plus de pourcentage** ; tranches d'âge ; badge « projet compatible » (F.18) ; un duo « en amitié » (Nils, il) ; un seul verbe « Ouvrir » ; frise en tête ; pas de relance « place libre » ; désactivée par défaut pour qui choisit « groupe » |
| 36 | V5-Lien (+ -debloque) | « Vous écrivez » (texte d'abord) ; visages le ven. 13 nov. 21 h ; **vocal facultatif**, dit dès l'étape 1, avec transcription et lecture seulement dans l'app ; Signaler en en-tête |
| 37 | V5-RdvDuo (+ -lea) | Créneau **après** le déblocage (mar. 17 nov.) ; lieu partenaire avec table réservée, ou lieu public sinon ; choix commun ; « chacun sa boisson » ; ange gardien facultatif. Pour Léa : un autre lieu que celui de la sortie |
| 38 | V5-Chat | Duo de même nature que les autres ; Signaler visible en en-tête ; « L'utiliser » pré-remplit le champ (plus d'envoi au nom de l'utilisateur) ; aucune échéance |
| 39 | V5-Oeuf | **Désactivé par défaut**, il n'apparaît que si les deux l'activent chacun de leur côté (personne ne l'envoie) ; « Ne jamais me le proposer » |
| 40 | V5-Rupture | Messages écrits pour une personne, rien de présélectionné, « J'écris mon propre mot » ; fiabilité définie juste ; « Partir sans message » si insécurité |

### F · Partage et web

V5-Partage-semaine (mode capture de Trouvée), V5-Partage-invitation (+1), V5-Partage-ville (« Aide-nous à ouvrir Saint-Denis »), V5-Story (« Décris-moi en 3 mots », **référence NGL retirée**, mots non anonymes « je vois les mots, pas qui les a choisis », 18+, désactivable). W-Repondre : mots physiques retirés, « la personne qu'on appelle », bouton désactivé lisible (« Choisis 3 mots pour envoyer »), fin « Et toi, tu sors où ? » qui mène vers Ville.

### G · Compte et confiance

| Fichier | Ce qui change |
|---|---|
| V5-Profil | 3 chiffres justes (1 sur 1, 2, 3) ; « qui voit quoi » ; Blowy+ « Gratuit » partout |
| V5-Fiche | 3 souvenirs datés, distincts des accessoires (gagnés, jamais vendus) ; fiabilité **privée** (« fiable » pour le groupe), absence prévenue ou retrait de sécurité jamais comptés ; plus de barre segmentée |
| V5-Tarifs | Nouveau : offerte / 4,99 € / Blowy+ 9,99 € ; à partir de quand c'est rentable ; rien d'autre ne se vend |
| V5-Abonnement | Blowy+ 9,99 €/mois = toutes tes sorties + Duo sans limite ; statut cohérent ; **aucune offre de rétention dans le code** |
| V5-Paiement (+ -ok, -echec) | Feuille Apple Pay ; sortie payée avec reçu et remboursement automatique ; paiement refusé (rien débité, place gardée 30 min) |
| V5-Reglages | Pause en tête ; créneaux, quartiers, format, âge du groupe ; 1 proposition par semaine ; statut unique |
| V5-Confidentialite | « Qui voit quoi » ; « orientation jamais montrée ni déductible » ; mode discret, aperçus masqués et Duo **protecteurs par défaut** ; retrait du consentement art. 9 ; durées de conservation |
| V5-Signaler | Motifs IRL en tête (geste non voulu, pression sexuelle, suivi·e, ne ressemble pas, moins de 18 ans), puis outing, haine/LGBTphobie, photos non sollicitées, arnaque ; **rien de présélectionné** ; voie urgente 17 / 112 / 3919 + rappel humain < 1 h ; capture ; promesse honnête ; récapitulatif avant envoi |
| V5-Supprimer | Chiffres justes ; **ne promet plus de résilier l'App Store** ; mascotte neutre ; Pause et Supprimer de même poids |

### H · États (7)

V5-Chargement, V5-Erreur-reseau, V5-Paiement-echec, V5-Verif-echec, V5-Notifs-refus, V5-Erreur-age (moins de 18 ans), V5-Chats-vide. Il faut y ajouter les états produit V5-Sortie-complete, V5-Sortie-annulee, V5-Apres-aucun et V5-Ville-fermee.

## Écarts au concept (et décisions tranchées)

| Sujet | Décision | Pourquoi |
|---|---|---|
| Révélation | Visages et lieu la veille à 18 h, et non le matin (E.16 prime sur concept-v5 §2) | Laisser le temps de se préparer ; personne n'annule gratuitement après avoir vu les visages |
| Quiz animé | Supprimé ; remplacé par des cartes de questions facultatives sur la table | D.14 et patron de bar : zéro animation pour le personnel |
| Nom à donner au bar | On ne dit jamais le nom du pet : la table est « Blowy », le check-in se fait par code du chevalet | G.22 |
| Âge | Tranche partout (« 26–30 ans »), jamais l'âge exact, y compris dans la Révélation | C.12 |
| Fiabilité | Visible par toi seul·e ; le groupe voit « fiable » | Jury (Thomas, Claire) : anxiété liée à l'affichage public |
| Curseurs de caractère du pet | Retirés de l'onboarding | ux-cognitif : 8 décisions sur un écran, sans utilité pour la composition |
| 5e espèce « Pépite » (lutin orange) | Ajoutée avec des assets V4 existants, pour que chaque membre ait un pet distinct | Jury : deux pigeons et deux lapins rendaient le groupe illisible |
| Duo amical | Une proposition Duo peut être « en amitié » (Nils) | Thomas : « Duo amical » ; casting de même genre visible |
| Onboarding | 8 étapes au lieu de 5. La ville arrive en 1er ; consentement, créneaux et âge ajoutés | Décisions B, C, D, G ; chaque écran reste à une question |
| Ange gardien | Choisi sortie par sortie, jamais par défaut | trust-safety : contrôle coercitif |
| Blowy+ | Aucune place +1 offerte ; seuls les avantages de H.23 | H.23 fait foi |
| Lieu partenaire (contrat, mode comptoir) | Hors maquette mobile (admin), comme H.24 le prévoit | Non maquetté ici |

## Vocabulaire (un mot = un concept)

| Mot | Sens |
|---|---|
| **sortie** | rencontre de groupe hebdomadaire |
| **groupe** | les 5 personnes d'une sortie |
| **team** | toi et 1 à 2 ami·es qui venez ensemble |
| **bande** | contacts persistants |
| **duo** | tête-à-tête |
| **rendez-vous à deux** | rencontre d'un duo |
| **confirmation** | la veille à 18 h : lieu + visages |
| **visages** | photos révélées |
| **check-in**, **code du chevalet**, **ange gardien**, **alerte**, **pause**, **mode discret**, **fiabilité**, **souvenir**, **accord**, **Partir proprement**, **place**, **Blowy+** | une notion chacun, toujours ce mot |
| **ami·e / plus / non** | les 3 réponses du vote |

## Textes clés (i18n)

| Clé | Texte |
|---|---|
| welcome.title | Des ami·es ou plus. En vrai, cette semaine. |
| welcome.sub | Ton pet te trouve une sortie à 5 près de chez toi. Ou un tête-à-tête, par écrit d'abord. Ce que tu cherches reste secret. |
| welcome.foot | Ouvert : Paris 11e, Lyon 4e. Ailleurs : une date d'ouverture. Tous genres, toutes orientations. |
| ville.title / sub | Tu sors où ? / Ta ville ou ton quartier. On ne demande jamais ta position : c'est toi qui choisis. |
| ville.fermee | {Ville} : pas encore. {n} / {seuil} personnes vérifiées · Ouverture estimée : {mois}. On t'écrit une seule fois, le jour de l'ouverture. |
| team.title / sub | Viens avec ta team. / Seul·e ou avec 1 à 2 ami·es. Vous serez dans le même groupe de 5. |
| team.amorcage | Dès que ta team compte 3 personnes vérifiées, Nino organise une sortie d'amorçage avec une autre team de {ville}. |
| rencontrer | Comment tu préfères rencontrer ? En petit groupe / À deux, par écrit / Les deux |
| intention | Tu cherches… Nouveaux potes / Une histoire / Les deux · Une histoire plutôt… Sérieuse / On verra · Des enfants un jour ? Oui / Non / Je ne sais pas · Personne ne le voit. |
| consentement | Des réponses sensibles. Ton accord d'abord. … Tu retires ton accord quand tu veux. — J'accepte / Amitié seule |
| toi | Tu es… · Ton groupe voit seulement ton pronom : elle / il / iel / prénom seul |
| toi.plus | Pour une histoire, tu veux rencontrer… Des femmes / Des hommes / Des personnes non-binaires |
| dispos | Quand es-tu libre ? · Une semaine sur deux · Semaines libres : Paires / Impaires |
| compte.age | Les autres voient une tranche, jamais ton âge exact. · L'âge de ton groupe · Prénom affiché |
| compo | {n} personnes · {âges} · {f} femmes, {h} hommes · {t} viennent en team |
| sortie.deroule | Tu arrives : table Blowy, chevalet orange… Personne n'anime. Tu pars quand tu veux. Chacun paie ce qu'il boit. |
| sortie.annulation | Annulation gratuite jusqu'à {confirmation}. Après la confirmation, annuler compte comme une absence, sauf pour ta sécurité. |
| complete | Pas de place cette fois. Ta réponse est arrivée après la composition des groupes… Rien n'est réservé sans ton accord. |
| annulee | La sortie de jeudi n'aura pas lieu. Pas assez de confirmations pour former un bon groupe. Ce n'est la faute de personne. |
| confirmation | C'est confirmé · Je connais quelqu'un ici · retrait discret, sans pénalité · Je ne peux plus venir · compte comme une absence |
| checkin | Tu es arrivé·e ? Je suis là · Ta position est vérifiée une seule fois, maintenant. Personne ne la voit. · Plutôt le code du chevalet |
| vote | Alors, jeudi ? · « Plus » vaut au moins « ami·e ». Si l'autre dit ami·e, vous restez ami·es. Sans réponse, c'est « non ». Personne ne l'apprend. |
| accords / aucun | Tes accords. Tu ne vois que les tiens. / Pas d'accord cette fois. C'est fréquent après une 1re sortie. |
| partage | On était 5. · Sans visages ni prénoms · Citer le lieu · Sans logo blowy. |
| duo | Voie Duo · À deux, par écrit d'abord. Gratuit. Le vocal n'est jamais obligatoire. · projet compatible |
| lien | Trois étapes. Rien ne se débloque si un seul des deux écrit. |
| oeuf | Un œuf pour vos deux pets. Désactivé par défaut. … Personne ne l'envoie à l'autre. |
| rupture | J'ai passé un bon moment avec toi, mais je ne sens pas d'étincelle. Je préfère te le dire. |
| tarifs | 1re sortie offerte · Place de sortie 4,99 €, consommation non incluse · Blowy+ 9,99 € par mois : toutes tes sorties et la voie Duo sans limite |
| ange | Facultatif, pour cette sortie seulement. · Le lien est secret et expire 3 h après la fin. |
| w-ange.alerte | Alex a déclenché l'alerte. … Une personne de l'équipe blowy. t'appelle sous 5 min et appelle le 17 si besoin. Le personnel du lieu n'intervient pas à ta place. |
| signaler | En danger maintenant ? 17 / 112 / 3919 · Être rappelé·e par l'équipe · moins d'1 h les soirs de sortie |
| conf.orientation | Ton orientation n'est jamais montrée, ni déductible. |
| supprimer.abo | L'app ne peut pas résilier un abonnement App Store. Réglages › Abonnements. |
| erreurs | Pas de connexion. · Le paiement n'est pas passé. Rien n'a été débité. · On n'a pas pu vérifier. · Notifications refusées. Pas de souci. · Blowy est réservé aux 18 ans et plus. · Rien pour l'instant. |

## Générateur

Les écrans sont générés par des scripts Python, hors dépôt, qui lisent `facts.json` : base commune, A, B, C/D, E/F/G/H et `canvas.json`. Les `.dc.html` livrés sont autonomes et éditables à la main. Après toute modification, relancer `check-facts.mjs` et `a11y-audit.mjs`.
