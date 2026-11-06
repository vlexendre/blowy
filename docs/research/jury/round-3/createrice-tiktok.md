# Jury V5.2 · tour 3 · Créatrice TikTok (lifestyle, 180 k abonnés)

**Verdict.** Je peux tourner lundi → vendredi depuis des exports justes et sans flouter (carte du mercredi, « J'y suis », « On était 5 » avec « un pote »), mais l'épisode du dimanche a perdu sa carte au lieu de la garder anonyme, les quatre cartes se ressemblent trait pour trait, et il n'y a toujours ni mode capture ni export vidéo.

**Note globale : 8/10** (tour 1 : 5/10 · tour 2 : 7/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | Hook lisible en un plan ; « Partout dès 5 » : plus de « pas dans ta ville ». |
| Charge cognitive | 8 | Onboarding de 8 écrans : je le filme en accéléré. |
| Envie (J+1/J+7/J+30) | 8 | Le rythme lun. 21 h → mer. 18 h → jeu. → dim. 21 h 30 est une série toute faite. |
| Vraie rencontre (2 semaines) | 8 | Sortie à J+3 et amorçage daté : la série a une fin. |
| Sécurité et confiance | 8 | Je ne montre personne : rien à flouter sur les cartes. |
| Viralité / distribution | 8 | 4 cartes justes, mercredi et jeudi exportables ; dimanche perdu, pas de vidéo, mêmes visuels partout. |
| Argent | 8 | 1re offerte, 4,99 € : je peux dire le prix sans gêne. |
| Finition visuelle | 7 | Cartes propres mais identiques, 40 % de vide au milieu. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 75 fichiers, 2480 vérifications, 0 contradiction(s) » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 75 écrans, 1038 textes, 420 cibles, 0 problème(s), contraste minimum 4.53:1 ». J'ai aussi re-rendu les 75 sources (Playwright, @2x) et comparé aux PNG livrés : identiques au texte près (7 écrans diffèrent de quelques centaines de pixels d'illustration). Les deux outils passent. Ils ne voient pas ce qui suit, trouvé à la main :

- **Garantie « au moins 2 » + composition** (Trouvée, Sortie, Sortie-inscrit, Confirmation) : « 2 femmes, 3 hommes » et « Au moins 2 personnes du groupe cherchent aussi une histoire compatible avec la tienne ». Alex (il) cherche des femmes (ses duos : Jade, Léa) ; il n'y a que 2 femmes : ce sont forcément elles. check-facts vérifie « au moins N = garantie », pas que N reste inférieur à l'effectif du genre recherché.
- **Consentement après le duo** : Lien « Depuis dimanche 8 novembre, 21 h » (duo Jade) ; Confidentialité et Affiner-histoire « Accord donné le lundi 9 novembre ». La chronologie de facts.json ne contient pas la date d'accord.
- **Un seul lien pour deux promesses** : `blowy.app/i/r8Tz4w` est imprimé sur les 4 cartes publiques (Partage-confirmation, Partage-checkin, Partage, Partage-invitation), alors que V5-Invite dit « Lien à usage unique, réservé à toi ».
- **Position** : W-Ange-aide affiche « Position au moment de la demande · 21:04 · 12 rue Oberkampf » ; Confidentialité dit « Position · jamais stockée » et Check-in « Ta position n'est jamais demandée si tu tapes le code ».
- **Prénom avant le oui** : V5-Duo, carte « avec N. », pied de page « Dire oui à Nils ouvrirait un 2e duo ».
- **spec-v5.md non mise à jour** (en-tête : 2026-11-06, source `concept-v5.md`) : `photoRevealAt = min(9 h, startsAt − 3 h)` (= 9 h pour 19 h 30) et parcours J2 « 9 h photos simultanées » ; précondition « quartier `LIVE` », seuil 120, erreur `NEIGHBORHOOD_NOT_LIVE` ; `duo.maxActive` 3 ; place en placeholder 12 € « conso incluse » ; Blowy+ 19,99 € = 2 crédits + 1 accessoire mensuel ; annulation ≥ 24 h → crédit 90 j. Les écrans disent : visages à J −3 h, partout dès 5 personnes, 1 duo actif, 4,99 € conso non incluse, 9,99 € toutes les sorties, accessoires jamais vendus, annulation gratuite jusqu'aux visages.
- **Défauts de pixel du tour 2 toujours là** : légende chevauchée par l'ombre du bouton (Apres y≈1600–1625 @2x ; Abonnement y≈1615–1640) ; « Être rappelé par l'équipe… » collé au bord gauche de son fond (Signaler) ; chips inclinées (W-Repondre) ; titre bicolore (Souvenir) ; deux interrupteurs indépendants (Oeuf) ; 5 actions sous stress (Check-in-ok). Nouveaux : heures et dates coupées (« 21 / h. » Lien, « 10 / min. » Erreur-reseau, « mar. 10 / nov. » Accueil, « nov. / 21 h » Duo et Accueil-duo), « ; pour ta sécurité » en début de ligne (Groupe-menu), « Tom vient avec / toi » et « + 1 place pour un / pote » (Sortie, Sortie-inscrit), « nouvelle » ×3 sous les « ? » alors qu'un des trois est Malo.

## Mes exigences du tour 2 : vérification point par point

- **Carte « C'est confirmé · demain » sans visages ni lieu** : réglé (Partage-confirmation, mercredi 18 h).
- **« J'y suis » en pets** : réglé (Partage-checkin, silhouettes + Nino).
- **Export vidéo 6 s (éclosion, check-in)** : non. L'éclosion a disparu de l'onboarding ; aucun export vidéo.
- **Chiffres justes** : réglé (« 3 nouvelles personnes », « 3 nouvelles personnes et un pote »).
- **Aucun prénom de tiers, pets génériques** : réglé.
- **Mode capture sur Après** : non.
- **Carte d'accords où personne ne se reconnaît** : supprimée.

**Ma condition du 10 au tour 2** : série lundi → dimanche depuis des exports, sans flouter ; aucune carte fausse ; carte d'accords non reconnaissable.
**Statut** : lundi (Trouvée, aperçu manquant), mercredi, jeudi, vendredi : oui, sans flouter. Dimanche : plus de carte. Chiffres : justes.

## Lecture d'ensemble

Je peux enfin tourner 5 jours sur 7 sans flouter. Les deux trous : dimanche (résultats), et l'esthétique : les 4 cartes ont la même mise en page, les mêmes pastilles jaune/vert, Nino au même endroit et ~40 % de dégradé vide au milieu. Dans une série, ça se lit comme la même image republiée. Et toutes portent le même lien, que l'écran d'invitation dit « réservé à toi ».

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · « DES AMITIÉS, OU PLUS. EN VRAI, CETTE SEMAINE. » : hook en un plan. → —
- **V5-Ville** · 8/10 · « TU SORS OÙ ? » : bon hook ; rien à exporter. → —
- **V5-Ville-nantes** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Toi** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Pet** · 8/10 · Les 5 pets côte à côte : plan « lequel tu prends ? » ; aucun export de mon pet. → Export 9:16 « mon pet ».
- **V5-Rencontrer** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Consentement** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Toi-plus** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Dispos** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Compte** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Erreur-age** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Trouvee** · 8/10 · « NINO T'A TROUVÉ UNE SORTIE. » + icône partage : mon plan du lundi. L'icône ne dit pas quelle carte part. → Aperçu de la carte avant partage.
- **V5-Trouvee-potes** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Sortie** · 8/10 · « Comment ça se passe » : bon contenu explicatif. → —
- **V5-Verif** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Notifs** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Sortie-inscrit** · 8/10 · Bandeau « Tu y vas. » : pas d'animation exportable. → Micro-animation 1 s exportable.
- **V5-Team** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Invite** · 8/10 · « ALEX T'EMMÈNE À SA SORTIE. » : plan réaction de l'ami. → —
- **V5-Accueil** · 8/10 · Nino dans le salon, « Jeudi, on joue. » : filmable (discret OFF par défaut, réglé). → —
- **V5-Accueil-discret** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Accueil-duo** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Pause** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Chats** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Groupe** · 7/10 · « Ton dimanche idéal, en 3 mots ? » : super plan, mais les réponses des autres ne m'appartiennent pas. → Export « mes 3 mots » seuls.
- **V5-Groupe-menu** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Attente** · 8/10 · « IL MANQUE 2 PERSONNES POUR TA SORTIE DU SAMEDI 21 NOVEMBRE. » : hook « venez à Nantes », sans carte : je filme l'écran avec la barre d'onglets. → Carte « il manque 2 personnes à Nantes ».
- **V5-Amorcage** · 9/10 · « Ta team de 3 + 2 personnes en attente = une sortie. » : storytime parfait. → —
- **V5-Sortie-complete** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Sortie-annulee** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Affiner** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Affiner-histoire** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Confirmation** · 9/10 · Mercredi 18 h, « LIEU CONFIRMÉ » + « Partager « demain je sors » » : ma demande T2 réglée. → —
- **V5-Partage-confirmation** · 9/10 · « DEMAIN, JE SORS AVEC 3 NOUVELLES PERSONNES. LIEU SECRET. » + « Je raconte vendredi » : le cliffhanger de la série. Même mise en page et mêmes 4 pastilles jaune/vert que jeudi et vendredi. → Un visuel propre à chaque jour.
- **V5-Revelation** · 7/10 · Le moment le plus fort reste infilmable (normal) et sans version « réaction ». → Carte « Les visages sont arrivés · 3 h avant », sans visages.
- **V5-Ange** · 8/10 · « Ton ange verra seulement / jamais » : contenu safety. → —
- **W-Ange** · 8/10 · « TU VEILLES SUR ALEX CE SOIR. » : « j'ai mis ma coloc en ange gardien » ; adresse à flouter. → —
- **W-Ange-aide** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Checkin** · 7/10 · « TU ES LÀ ? » : le code ne doit jamais être filmé ; pas de mode capture. → —
- **V5-Checkin-ok** · 8/10 · « « J'y suis » » exportable depuis l'écran : réglé. → —
- **V5-Partage-checkin** · 8/10 · « J'Y SUIS. » : exportable, sans tiers. 40 % de dégradé vide, mêmes pastilles que mercredi. → Chevalet orange ou visuel du jeudi.
- **V5-Souvenir** · 8/10 · « SORTIE VÉCUE. » ; « Partager la soirée » descendu en lien gris. → —
- **V5-Partage** · 9/10 · « ON ÉTAIT 5. … 3 nouvelles personnes et un pote » : chiffre juste, réglé. → —
- **V5-Apres** · 6/10 · « ALORS, JEUDI ? » = le meilleur plan storytime, toujours sans mode capture (3 prénoms à l'écran). → Mode capture : silhouettes à la place des prénoms, aucune sélection visible.
- **V5-Apres-resultats** · 6/10 · La carte d'accords a été supprimée au lieu d'être anonymisée : mon épisode du dimanche (« alors, ça a matché ? ») n'a plus d'export. → Carte « dimanche 21 h 30 : les résultats sont tombés » sans chiffre ni pet.
- **V5-Apres-aucun** · 7/10 · « PAS D'ACCORD CETTE FOIS. » : contenu honnête, pas de carte. → Carte « 0 accord, 1 soirée ».
- **V5-Bande** · 8/10 · Rue des pets jolie, prénoms dessous. → Mode capture sans prénoms.
- **V5-Rue** · 8/10 · « TA RUE » : plan calme, que des pets. → —
- **V5-Duo** · 7/10 · Ressemble à toutes les apps de dating. → —
- **V5-Lien** · 7/10 · Messages privés. → —
- **V5-Lien-debloque** · 6/10 · Visage et vocal d'une autre : interdit à l'écran. → —
- **V5-RdvDuo** · 7/10 · Rien à filmer. → —
- **V5-Chat** · 6/10 · Messages privés. → —
- **V5-RdvDuo-lea** · 7/10 · Rien à filmer. → —
- **V5-Oeuf** · 7/10 · Pas exportable, et c'est voulu. → —
- **V5-Rupture** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Partage-invitation** · 8/10 · « VIENS AVEC MOI. » sans Tom : réglé. « Ta place jeudi » + lien que l'écran Invite dit « réservé à toi » : si je le poste, qui l'ouvre ? → Lien public distinct pour les Stories.
- **V5-Story** · 9/10 · « DÉCRIS-MOI EN 3 MOTS. » + slug aléatoire : postable. → —
- **W-Repondre** · 8/10 · Chips penchées : joli en vidéo. → —
- **V5-Profil** · 8/10 · Une seule carte listée (« Décris-moi ») ; les autres n'existent qu'au bon moment. → « Mes cartes » listant les 5.
- **V5-Fiche** · 8/10 · « Partager » sans aperçu. → Aperçu.
- **V5-Tarifs** · 9/10 · « Ne s'achète jamais : plus de visibilité » : montrable. → —
- **V5-Abonnement** · 8/10 · Honnête ; « duos sans limite » toujours dur à expliquer en 10 s. → —
- **V5-Paiement** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Paiement-ok** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Reglages** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Confidentialite** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Signaler** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Supprimer** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Chargement** · 8/10 · « Nino compose ton groupe… » : 1 s de suspense filmable. → —
- **V5-Erreur-reseau** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Paiement-echec** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Verif-echec** · 8/10 · Raton embarrassé : drôle, pas gênant. → —
- **V5-Notifs-refus** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Chats-vide** · 8/10 · Rien à filmer, et c'est normal. → —

## Les 3 changements qui feraient le plus monter ma note

1. Rendre l'épisode du dimanche : carte « les résultats sont tombés » sans pet ni prénom, et un mode capture sur « ALORS, JEUDI ? ».
2. Un visuel par jour : mercredi, jeudi, vendredi et invitation ont la même mise en page et les mêmes pastilles ; changer l'objet (enveloppe, chevalet orange, table, porte) et remplir le vide.
3. Export vidéo 6 s (pet choisi, « Tu y vas. », « J'y suis ») et une carte « il manque 2 personnes à Nantes ».

## Je mets 10 si…

Je mets 10 si je tourne lundi → dimanche entièrement depuis des exports de l'app, dimanche compris, sans flouter un visage, un prénom ou un lieu, avec un visuel différent par jour, si aucune carte n'affirme un chiffre faux (c'est fait) et si le lien que je publie n'est pas celui que l'app dit « réservé » à un ami.
