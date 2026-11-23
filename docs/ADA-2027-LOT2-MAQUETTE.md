# Lot 2 — cahier de la maquette (Fable, 23/11/2026)

Artifact Design `c30e7ec3-e3b4-46e3-b21d-8f74f2af37cc`, fichiers `project/V6-*.dc.html`. Lire le `SKILL.md` de l'artifact avant toute écriture. Un fichier n'a qu'un exécutant ; publication en mode `patch` qui ne nomme que ses fichiers ; sur conflit de version, relire `list_files` et republier. `canvas.json` : intégrateur seul.

## 0. Règles communes

**Barre d'onglets** (remplace partout le bloc `/* V7 : barre à pictogrammes seuls, 5 onglets */`) :
- 4 colonnes égales, ordre Minimoa · Quartier · Chats · Moi → `V6-GAccueil`, `V6-GQuartier`, `V6-Chats`, `V6-Moi`.
- Pictogramme 24 px, libellé visible 10 px graisse 800, onglet 54 px de haut.
- Actif : pilule jaune, encre `#14101F`, pictogramme plein, `aria-current="page"`.
- Pastilles Quartier (bonjours reçus) et Chats (non lus) : fond blanc, encre `#14101F` (pas blanc sur `#FF3D6E`, ~3,4:1).

**Visage avant le lien** (décision 7 amendée) : disque de photo très floue (flou ≥ 20 px sur 56 px, aucun trait reconnaissable) + minimoa de la personne en médaillon net de 24 px en bas à droite. Prénom visible, jamais de photo nette avant le lien, y compris Minimoa+. Après le lien (Chats, chat, Le lien) : photo nette. Supprimer la prop `plus` de GCarte et sa règle `.clear`.

**Mots interdits à l'écran** : ligue, étincelle, trophée, succès, combo, défi, habitude, bilan, groupe, vie(s), cœurs, niveau / « Niv. », fantôme, ghosté, boude, Wrapped, sticker, « question surprise », « +1 point commun », pourcentage de compatibilité, « −67 % », « en danger », « ne casse pas ».

**Typo et couleurs** : rien sous 13 px sauf libellé d'onglet 10 px (relever `.lbl` 11 px et les 10–12 px en ligne). Un seul élément jaune par planche hors pilule d'onglet. Petit texte sur corail ou orange : encre sombre.

**Audit des planches non lues** : mots interdits, `font-size` < 13, cibles < 44 px, `.hearts`, liens vers une planche supprimée.

## 1. Inventaire

| Planche | Verdict | Raison ou retouche |
|---|---|---|
| Welcome, GVision, GTaVision, GNaissance, TropJeune, GLocalisation, GConnexion | Garder | Audit §0. Welcome : « Des gens près de chez toi. Ton minimoa te les présente. » |
| GApercu, GApercuVide, Pret | Retoucher | Visages au motif flou + médaillon. Aucune vente sur l'état vide. |
| GAccueil | Refaire | §2.2 |
| GSeance | Garder | Audit §0 |
| GFin | Refaire | §2.3 |
| GSerie | Retoucher | Lien du gel vers GPlus retiré. Frise des paliers 7 · 30 · 100 · 365. « Une réponse par jour suffit. » → « Ta séance du jour la fait grandir. » |
| GCaractere, GBilan, Celebration, Ligue, Succes | Supprimer | |
| SeriePalier | Fusionner dans GFin (état `palier`) | |
| GardeRobe, Debloque | Garder | Retirer raccourcis défi/habitudes. L'objet gagné se fête sur l'accueil. |
| Animations | Refaire | Seulement : salut, réaction en séance, applaudissement, sieste, palier ; durée et version réduite pour chacun. |
| Rencontres, GCarte | Fusionner dans `V6-GQuartier` | §2.1 ; fichiers supprimés |
| GRencontre | Retoucher | Retour vers Quartier. Bande de distance (« Dans ton quartier »), jamais « À moins d’1 km ». Visage flou + médaillon. Jaune seulement sur « Dire bonjour ». Signaler / bloquer par un menu « … » de 44 px. |
| GPlus | Refaire | §2.6 |
| Invitation | Garder | Audit §0 |
| Chats | Refaire | §2.4 |
| GChat | Retoucher | §2.4 |
| Souvenirs | Supprimer | |
| Lien | Refaire en `V6-GLien` | §2.4 |
| Fantome | Refaire en état `endormi` de `V6-GLien` | §2.4 |
| LienOptions, Signaler | Garder | Retirer vies et niveaux |
| Moi | Retoucher | Lignes Ligue et Trophées retirées. Photo nette en tête. Bande Minimoa+ : « Plus de présentations, d’autres villes. », sans prix, bouton blanc. Relever les 12 px. |
| Reglages, Bloques, Supprimer | Garder | Reglages gagne « L’IA et tes chats ». |
| MonCompte | Retoucher | Compte + identité + nom du minimoa |
| GNotifs | Retoucher | Six lignes au plus. Panneau d'aide sombre : « Nino te prévient quand quelqu’un te fait signe. Jamais de pub. » Interrupteurs alignés sur l'atome `Toggle`. |
| GWidget | Retoucher | Écran verrouillé sans prénom ni visage : « Un message t’attend ». Texte sur corail en encre sombre. |
| Mots, GAdmin, GAdminChemin, Cible | Garder tel quel | Hors de l'app |

## 2. Planches à créer ou refaire (390×844 sauf mention)

### 2.1 `V6-GQuartier` — prop `etat`

Fixes : titre « TON QUARTIER » ; barre de zone (« Le Marais ») ; pilules « Liste » et « Discret » de 44 px ; carte avec épingles au motif flou, anneau jaune 3 px + étoile pleine pour les présentés du jour ; puce « 3 plus loin » ; « Toi » = halo de zone, jamais un point ; feuille opaque `#17142A`.

| État | Contenu |
|---|---|
| `replie` | Feuille de 96 px au-dessus de la barre : poignée, « Aujourd’hui · 3 personnes ». |
| `mi` (défaut) | Feuille à 46 %. « Visages flous jusqu’à votre bonjour. Positions arrondies. » Carte « Léa t’a dit bonjour » : « Répondre » (jaune), « Pas cette fois ». Lignes : « Sasha · Vous voulez tous les deux un foyer, un jour. · Dans ton quartier », « Malo · Comme toi, il part dehors le week-end. · À moins de 5 km ». |
| `ouvert` | Feuille jusque sous la barre de zone. En plus : « Hugo · Salué · en attente » (coche + texte), ligne Minimoa+ calme « Plus de monde, d’autres villes », pied « Demain, quelqu’un d’autre ». |
| `fiche` | Croix 44 px, visage flou 72 px, « Sasha », « Dans ton quartier », « Vous deux : » + 3 puces, « Dire bonjour » (jaune, 56 px), lien « Voir de plus près ». Variantes « En attente » (calme, désactivé, coche) et « Répondre ». |
| `liste` | Pas de carte. « Aujourd’hui · 3 personnes » puis « Sur la carte · 5 », lignes ≥ 72 px. |
| `sans-position` | « Nino a besoin de ton quartier » / « Ta zone, jamais ton adresse. » / « Activer » (jaune). Variante refus : « Choisir ma ville ». |

Vide (dans `mi`) : « Aujourd’hui · personne pour l’instant », « Compteur du quartier : 12 voisins inscrits », « Invite 3 personnes de ton quartier ». Aucune vente.
Épingle non présentée, compte gratuit : « Sasha n’est pas dans tes présentations du jour : lui dire bonjour depuis la carte, c’est avec Minimoa+. » + bouton calme « Découvrir Minimoa+ ».

### 2.2 `V6-GAccueil` — prop `maintenant` = `seance | faite | membre | repos | bonjour | sieste`

- Haut : panneau du minimoa (« NINO », puce d'humeur, « Garde-robe » en blanc, 4 soins de 44 px, aucun jaune). Une puce « 12 jours d’affilée » de 44 px → GSerie.
- `seance` : bandeau violet « Séance du jour · 5 questions · 2 min » / « Ta façon de vivre » / « À la fin : ta personne du jour ». Chemin de 7 étapes ; étape du jour 72 px, jaune, étiquette « Commencer » (seul jaune).
- `faite` : carte sombre « Séance du jour faite » / « Ta personne du jour » / « Demain, une nouvelle séance », lien « Revoir ta personne du jour ». Aucun jaune, aucun Minimoa+.
- `membre` : comme `faite` + lien « Continuer avec l’étape suivante ».
- `repos` : « À demain », bulle « Bien joué. À demain ! ».
- `bonjour` : une carte de personne sous le chemin, « Léa t’a dit bonjour » → Quartier.
- `sieste` : bulle « Zzz… », bouton blanc « Le réveiller ».
- Jumelle 375×667, `seance` : « Commencer » visible sans défiler.

### 2.3 `V6-GFin` — prop `etat` = `personne | envoye | vide | palier | perdu`

- `personne` : ligne de série 44 px (flamme, « 13 jours d’affilée » 17 px gras). Carte « Ta personne du jour » : visage flou 72 px + médaillon, « Léa », « Elle préfère aussi un dîner à 4 qu’une grosse soirée. », « Vous deux : » + 3 puces, « Pour dire bonjour : ta dernière vraie balade, c’était où ? », bouton jaune 56 px « Dire bonjour ». Panneau sombre « Ce que Nino a appris » / « Tu préfères un dîner à 4 qu’une grosse soirée. ». Pied « À demain pour la suite ».
- `envoye` : bouton calme avec coche « Bonjour envoyé » ; « On te prévient quand Léa répond. »
- `vide` : « Personne de nouveau aujourd’hui, à demain », action calme « Inviter un pote ». Aucune vente.
- `palier` : plein écran orange, encre sombre : « 7 JOURS D’AFFILÉE » / « Nino te connaît un peu mieux chaque jour. » / 13 px « Touche pour continuer ». Sans confettis.
- `perdu` : « Ta séance est enregistrée. Ta personne du jour t’attend sur l’accueil. » + un bouton.
- Jumelle 375×667, `personne` : « Dire bonjour » visible sans défiler.

### 2.4 Chats, chat, Le lien

État doux du lien (jamais de chiffre, jauge ni rouge) :

| État | Pictogramme | Phrase (« Le lien ») | Ligne de liste |
|---|---|---|---|
| `vivant` | deux bulles | « Vous vous parlez souvent. » | — |
| `calme` | une bulle | « C’est calme en ce moment. » | — |
| `moment` | bulle en pointillé | « Ça fait un moment. Un mot lui ferait plaisir. » | « Un mot lui ferait plaisir » |
| `endormi` | lune | « Le lien fait la sieste. Il se réveille au premier mot. » | « Lien endormi » |

Aide unique : « Chaque jour où vous vous écrivez fait grandir le lien. Après une pause, il se réveille dès qu’un mot arrive. »

- `V6-Chats` : lignes 72 px, deux visages nets, prénom, dernier message, au plus une puce (« À toi », « Nouveau », ou ligne d'état). En tête « Un mot t’attend » / « Léa t’a écrit aujourd’hui. Un petit mot et votre série continue. » « + » sombre 44 px. En bas « Déjà croisés » replié.
- `V6-GChat` : en-tête prénom + phrase d'état 13 px (au lieu des cœurs). Onglets « Chat · Le lien ». Répliques signées « Nino · brise-glace ». Envoi = seul jaune.
- `V6-GLien`, prop `etat` (4 états) : « À TOI / D’ÉCRIRE » ; « Léa t’a écrit. Réponds quand tu veux et la série passe à 13. » ; « Toi · Pas encore », « Léa · A écrit » ; bouton jaune « Écrire à Léa » ; carte d'état ; « Vos étapes » datées. Pas de grille de semaine à coches ni de « 1/2 ».
- `endormi` : fond de nuit, minimoa endormi ; « UNE PETITE / PAUSE. » ; « Ça fait un moment avec Tom. Le lien fait la sieste, il se réveille quand tu veux. » ; bulle « J’ai pensé à Tom cette semaine. Un petit mot, quand tu veux. » ; « Le réveiller » (blanc), « Le laisser partir ». Après : « Je lui ai fait un petit coucou. »

### 2.5 `V6-GEtats` — 1760×1900, 8 téléphones légendés

1. Vide (Chats) : « Pas encore de chat » / « Dis bonjour à quelqu’un du quartier, la conversation s’ouvre ici. » / « Voir le quartier ».
2. Chargement (Quartier) : squelettes à la forme des lignes.
3. Erreur : « Ça n’a pas chargé. Vérifie ta connexion, puis réessaie. » + « Réessayer ».
4. Hors ligne (chat) : « Hors ligne. Ton message partira au retour du réseau. » ; bulle « Pas envoyé · Réessayer ».
5. Terminé (accueil gratuit) : « À demain », sans vente.
6. Très grand texte (fin de séance, 17 → 40 px) : rien de coupé, bouton sur 2 lignes.
7. VoiceOver (Quartier en liste) : ordre numéroté, libellés (« Quartier, onglet, 2 sur 4, sélectionné », « Sasha, dans ton quartier. Ouvrir sa fiche, bouton », « Aujourd’hui, 3 personnes, titre »).
8. Animations réduites (palier) : image fixe, légende des remplacements (fondu ≤ 200 ms).

### 2.6 `V6-GPlus`

Titre « Minimoa+ : plus loin, plus de monde ». Avantages : « Plus de présentations chaque jour », « Des gens dans d’autres villes », « Ton profil en détail » (à confirmer côté code : n'existe pas encore dans l'app, voir lot 1 ; sinon retirer). Rien sur visages ni bonjours reçus. Prix seul sur sa ligne, sans « −67 % ». Barre fixe : bouton d'achat, renouvellement, « Restaurer mes achats · Conditions · Confidentialité » ; au-dessus « Continuer gratuitement ».

### 2.7 `V6-GAppStore` — 6 captures 430×932

Titre 2 lignes 44 px + vrai écran. Aucun visage net, aucune adresse.
1. « Il te présente / tes voisins » 2. « 5 questions, / 2 minutes » 3. « Puis quelqu’un / du quartier » 4. « Ton quartier, / pas ton adresse » 5. « Un bonjour, / et ça commence » 6. « Flou avant, / net après le bonjour ».
Note : l'histoire et le sous-titre « Il te présente tes voisins ».

## 3. Critères d'acceptation

1. Aucun mot interdit (textes, `aria-label`, props). Aucun lien vers une planche supprimée.
2. Barre d'onglets conforme partout.
3. Un seul jaune hors onglet à 390×844 et 375×667 ; action principale visible sans défiler à 375×667 (Accueil, Fin, Quartier).
4. Aide ≤ 2 lignes par écran ; une carte = titre + au plus une ligne grise.
5. Texte ≥ 13 px (onglet 10), corps 17, secondaire 13–15.
6. Contraste ≥ 4,5:1 (3:1 pour ≥ 28 px). Pas de blanc en petit corps sur corail/orange. `.dim` ne porte jamais d'information.
7. Cibles ≥ 44×44 px, espacées ≥ 8 px.
8. Aucun état porté par la teinte seule.
9. Visages : flou ≥ 20 px avant le lien, net seulement après ; aucune variante Minimoa+ nette.
10. Position : bandes « Dans ton quartier / À moins de 5 km / Autour de toi » seulement.
11. Aucun chiffre de lien, perte, compte à rebours, ni vente sur `faite`, `repos`, `vide`, `sans-position`.
12. Textes exactement ceux du cahier ; « ’ », « », tutoiement, majuscule, pas d'emoji, jamais « pet » ni « Blowy ».
13. `prefers-reduced-motion` coupe tout ; pas de boucle hors respiration ; fête ≤ 3 s.
14. Chaque `etat` existe en prop et s'affiche. GEtats : 8 cadres. App Store : 6 captures.
15. `canvas.json` : aucune planche orpheline, numérotation continue, notes p1–p3 à jour.

## 4. Ordre

1. Pilote (Opus) : `V6-GAccueil` + barre d'onglets + motif de visage flou → relecture Fable.
2. Parallèle : A `V6-GQuartier` + `V6-GRencontre` ; B `V6-GFin`, `V6-GSerie`, `V6-Animations` ; C `V6-Chats`, `V6-GChat`, `V6-GLien` ; D (Sonnet) `V6-Moi`, `V6-MonCompte`, `V6-Reglages`, `V6-GNotifs`, `V6-GPlus`, `V6-GWidget` ; E (Sonnet/Haiku) audit §0 + barre sur les planches gardées.
3. Opus : `V6-GEtats`, `V6-GAppStore`.
4. Intégrateur (Sonnet) : supprimer Rencontres, GCarte, Lien, Fantome, Souvenirs, GCaractere, GBilan, Celebration, Ligue, Succes, puis SeriePalier ; `canvas.json` (rangées A Inscription · B Chaque jour · C Quartier · D Chats et lien · E Moi · F États · G App Store · H Hors de l'app ; notes p1–p3).
5. Relecture Fable, puis colonne « Maquette » de `docs/SCREENS.md`.

## Écarts code ↔ maquette à faire suivre

- « Dire bonjour » partout (le code dit « Saluer » sur la fiche), 5 langues.
- Séance des membres : « Continuer avec l’étape suivante » (corriger `docs/SCREENS.md`).
- Grille de semaine du lien (`LivesPanel`, coches, « 1/2 ») retirée — item 27.
- « 7 jours sans message avec… » → « Ça fait un moment avec Tom. » — item 27.
- Note du Quartier « Visages flous jusqu’à votre bonjour. Positions arrondies. » — item 26.
- Police des titres : Anton (maquette) ou Allo ExtraBold (`docs/DESIGN.md`) — à confirmer.

## Décisions de la relecture finale (Fable, 23/11/2026)

- Quartier : présentés du jour = anneau blanc 3 px + étoile (pas jaune) ; feuille `mi` à 53 % en 375 ; un seul style d'interrupteur dans l'app : violet `#7A45F0`, piste éteinte `#3E3862`.
- Barre d'onglets seulement sur les quatre écrans racines (Accueil, Quartier, Chats, Moi) ; tous les écrans poussés (`moi/*`, `pet/*`, fin, série, chat, lien) n'en ont pas.
- Aucun prénom d'autrui avant la création du compte (App Review 5.1.1) ; aucune notification ne porte de prénom.
- GLien : la carte « À toi » n'existe que quand l'autre a vraiment écrit (état `vivant`).

## Écarts maquette → code (à faire suivre, item 6 et suivants)

**Accueil** (`(tabs)/pet.tsx`, à découper sous 300 lignes) : bandeau « Séance du jour · 5 questions · 2 min » / titre / « À la fin : ta personne du jour » ; `faite` : carte avec « Revoir ta personne du jour » (+ « Continuer avec l’étape suivante » pour un membre) ; `repos` : « À demain » + bulle « Bien joué. À demain ! » ; chemin de 7 étapes, étape du jour 72 px jaune « Commencer », seul jaune, visible en 375×667 ; panneau 184 px (168 en 375) avec puce d'humeur, sans pastille chiffrée sur Garde-robe, sans bouderie ; sous le chemin, une seule carte « Léa t’a dit bonjour » (au-dessus du chemin) — retirer carte de position, `WelcomeBack`, bannière `meet`, `UnlockCelebration`, `StreakMoment`, `FirstWeekMoment` ; `sieste` : bulle « Zzz… ».
**Barre d'onglets** : pastilles blanches encre sombre, libellé 10 px / 800, pictogramme plein actif.
**Fin** : « Ce que Nino a appris », « On te prévient quand Léa répond. », palier « Nino te connaît un peu mieux chaque jour. » sans confettis, fermeture seule à 2,6 s ; `perdu` : « Séance du jour faite » + « Retour à l’accueil » ; retirer `fin.location`.
**Série** : « Ta séance du jour la fait grandir. » ; frise 7 · 30 · 100 · 365.
**Quartier** : note « Visages flous jusqu’à votre bonjour. Positions arrondies. », « 3 plus loin », « Plus de monde, d’autres villes », « Nino a besoin de ton quartier » / « Ta zone, jamais ton adresse. » ; anneau blanc + étoile ; crans 96 px / 46 % (53 % en 375) / ouvert ; état vide court (compteur + bouton) ; « Saluer » → « Dire bonjour » ; titres sans `dim` ; « Lien copié » sans glyphe ✓.
**Chats et lien** : section « Vos étapes » ; carte « À toi » seulement quand c'est ton tour ; état vide « Voir le quartier ».
**États** : erreur unique « Ça n’a pas chargé. Vérifie ta connexion, puis réessaie. » ; « Hors ligne. Ton message partira au retour du réseau. »
**Moi, Réglages, Notifications** : `Toggle` violet ; fusions `moi/ia` + `moi/minimoas` (« L’IA et tes chats »), `moi/compte` + `moi/identite` ; « Il te connaît bien · 2 sur 3 », « Jamais de pub », « Floue pour les autres jusqu’à votre bonjour. » ; notification de bonjour sans prénom (vérifier `packages/content`).
**Minimoa+** : titre « Minimoa+ : plus loin, plus de monde » ; décider du gel de série vendu (`jokers`) ; libellé du bouton d'achat à aligner.
**Inscription (item 22)** : GApercu / GApercuVide absents de l'app ; `prenom`, `craft`, `preparation`, `statistiques` sans planche.

**Ajouts de la seconde relecture (PASSE, version 1795465327-359b)** : atome `Toggle` violet `#7A45F0`, piste éteinte `#3E3862` avec contour intérieur 1,5 px `#6F6990` sur l'état éteint ; confettis (écran « Prêt » seulement) joués une fois, < 3 s, jamais rejoués au retour, masqués en animations réduites. Restes de maquette non bloquants : MonCompte 1999 vs GNaissance 1996, logo Google couleur sur GConnexion, « depuis le 2 nov. » sur Bloques, bord blanc du champ de Supprimer, insécables de Pret, CSS mort `.fld.on`, `.rad.on`, `.vcare.hot`.
