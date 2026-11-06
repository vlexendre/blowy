# Jury V5.2 · tour 3 · Growth lead (distribution et croissance)

**Verdict.** Le funnel est enfin court (8 écrans, 6 pour « potes ») et l'amorçage hors zone devient un moteur d'invitation daté, mais le partage du vendredi a perdu sa place de CTA, la carte d'accords a disparu au lieu d'être anonymisée, et un seul lien `r8Tz4w` pour toutes les cartes rend l'attribution impossible et contredit l'écran d'invitation.

**Note globale : 8/10** (tour 1 : 5/10 · tour 2 : 7/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | « DES AMITIÉS, OU PLUS. EN VRAI, CETTE SEMAINE. » + « Partout : une sortie se forme dès 5 personnes » : promesse et portée dans le même plan. |
| Charge cognitive | 8 | 15 → 8 écrans avant Trouvée (6 pour « potes ») ; reste 2 décisions sur Toi, Pet, Rencontrer. |
| Envie (J+1/J+7/J+30) | 8 | Rythme hebdo (lun. 21 h, mer. 18 h, jeu., dim. 21 h 30), Ta rue sans jauge, Pause en 1 tap. |
| Vraie rencontre (2 semaines) | 8 | Sortie offerte à J+3 dans le 11e, amorçage daté à Lille, « il manque 2 » à Nantes avec des actions. |
| Sécurité et confiance | 8 | La couche confiance convertit les femmes, qui font la densité. |
| Viralité / distribution | 7 | 4 cartes justes et un écran d'arrivée de l'invité ; mais carte d'accords supprimée, partage du vendredi rétrogradé, un seul slug pour tout. |
| Argent | 8 | 4,99 € / 9,99 € postables ; invité : 1re offerte, CAC d'invitation minimal. |
| Finition visuelle | 7 | Cartes propres mais identiques d'un jour à l'autre (mêmes pastilles, 40 % de vide) ; lignes et heures coupées. |

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

- **Funnel ≤ 9 écrans avant Trouvée** : réglé. Ville, Toi, Pet, Rencontrer, Consentement, Toi-plus, Dispos, Compte = 8 ; 6 pour qui choisit « potes ». Sous-choix d'intention, semaines off, âge du groupe : dans Affiner.
- **Partage sur Attente / Ville-fermée** : partiellement. La ville fermée n'existe plus (« partout dès 5 ») ; Attente met « Venir avec 1 ou 2 potes » en 1re action. Mais la carte ville est supprimée : plus aucun partage public hors team.
- **Écran d'arrivée de l'invité** : réglé (V5-Invite). Sa promesse « usage unique » est contredite par les cartes publiques (voir outils).
- **Phrases des cartes** : réglé (« 3 nouvelles personnes », « On était 5 », « 3 nouvelles personnes et un pote »).
- **Carte d'accords anonyme** : supprimée au lieu d'être anonymisée ; la boucle la plus forte a disparu.
- **« près de chez toi »** : réglé (« dans ta ville »).
- **Duo après la 1re sortie** : non retenu (Welcome, Rencontrer, Trouvée, Accueil-duo, Attente).
- **Partager la soirée en CTA principal** (tour 1, réglé au tour 2) : régressé, lien secondaire sur Souvenir.

**Ma condition du 10 au tour 2** : test de 4 semaines (funnel ≥ 25 %, selfie < 30 %), ≥ 0,3 inscrit vérifié par sortie vécue tracé par source, amorçage < 3 semaines.
**Statut** : maquetté (Amorçage daté sam. 28 nov.), pas mesuré. business-model.md liste ces indicateurs « à mesurer » ; aucun résultat. Et avec un seul slug sur toutes les cartes, « tracé par source » est impossible tel quel.

## Lecture d'ensemble

K-factor recalculé (hypothèses, comme au tour 2) : team ≈ 0,23 (30 % × 1,3 ami × 60 % vérifiés) ; cartes mercredi + jeudi + vendredi ≈ 0,08–0,10 (3 occasions au lieu d'une, mais le partage du vendredi a perdu sa place de CTA) ; ange ≈ 0,02 ; 3 mots ≈ 0,04 ; carte d'accords 0 (supprimée). Total ≈ 0,37–0,39, au-dessus de l'objectif 0,3 sur le papier.

Le gain du tour est le funnel (15 → 8 écrans) et la règle « partout dès 5 » qui transforme chaque inscrit hors zone en recruteur de team. Ce qui me retient à 8 : (1) un lien unique qui rend l'attribution impossible et ment sur l'écran Invite ; (2) le Duo toujours proposé au moment où l'on devrait inviter ; (3) aucune mesure.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · Hook juste, « Partout : une sortie se forme dès 5 personnes » ne ferme plus aucune ville. Aucune preuve sociale chiffrée ; 220 px vides entre texte et pets (y≈830–1050 @2x). → Une ligne réelle « N sorties cette semaine à Paris 11e » à la place du vide.
- **V5-Ville** · 9/10 · « 6 lieux partenaires » = preuve d'offre ; « Paris 10e · sorties dès 5 personnes compatibles » juste. → Ajouter le nombre de sorties de la semaine.
- **V5-Ville-nantes** · 9/10 · « 87 personnes vérifiées » + règle des 5 : garde l'inscrit hors zone. Aucune mention de la team ici, alors que c'est le levier n°1 de Nantes. → « Viens avec des potes : ils comptent » dès cet écran.
- **V5-Toi** · 8/10 · Deux réponses sur un écran, mais rapide : bon pour le funnel. → —
- **V5-Pet** · 8/10 · Pet + activités : un écran de moins. Le pet choisi n'est exportable nulle part. → « Partager mon pet » (9:16) après le choix.
- **V5-Rencontrer** · 6/10 · « À deux, par écrit » à égalité avec « En petit groupe » dès 4/8 : la voie sans invitation capte ceux qui auraient amené une team ; Welcome (« Ou un tête-à-tête ») et Trouvée la reproposent. → Duo proposé après la 1re sortie vécue ; mesurer le taux de team par choix.
- **V5-Consentement** · 8/10 · Seulement pour « histoire » : réglé. « Potes seulement » de même poids : bon pour la confiance, à tracer. → Taux par bouton dans le tableau de bord.
- **V5-Toi-plus** · 9/10 · Une question, garantie expliquée. → —
- **V5-Dispos** · 9/10 · « Une proposition par semaine au plus » : rythme tenable. → —
- **V5-Compte** · 9/10 · SSO 1 tap, discrétion OFF par défaut : Accueil avec pet, donc filmable. → —
- **V5-Erreur-age** · 9/10 · Clair, ne pollue pas la base. → —
- **V5-Trouvee** · 8/10 · 8 écrans avant cette valeur (T2 : 15) : ma demande n°1 réglée. Le seul lien secondaire sous le CTA est « Plutôt à deux ? Essayer la voie Duo » : fuite vers le canal non viral. → Lien secondaire « Venir avec un pote » ; Duo dans le menu.
- **V5-Trouvee-potes** · 8/10 · Dit la vérité avant le choix : évite la déception post-sortie, donc le churn. → Mesurer l'acceptation de cette variante contre Trouvée.
- **V5-Sortie** · 8/10 · « Tom vient avec toi · + 1 place pour un pote » présent : réglé. La ligne casse en 2 × 2 lignes (« Tom vient avec / toi », « + 1 place pour un / pote »). → Une ligne : « Tom vient · + 1 place ».
- **V5-Verif** · 8/10 · Selfie = KPI n°1 du funnel ; toujours rien qui dise que la place est tenue pendant ce temps. → « Ta place est gardée 30 min ».
- **V5-Notifs** · 9/10 · « Ta place est réservée » en tête : renforcement. → —
- **V5-Sortie-inscrit** · 8/10 · Même ligne team cassée sur 2 × 2 lignes. → Une ligne.
- **V5-Team** · 9/10 · « Leur 1re sortie est offerte » + règles d'équilibre : argument d'invitation clair. → —
- **V5-Invite** · 7/10 · Écran d'arrivée de l'invité (ma demande T2) : réglé et bon. Mais « Lien à usage unique, réservé à toi » est faux : le même `blowy.app/i/r8Tz4w` est imprimé sur 4 cartes publiques. → Lien de team nominatif à usage unique ; slug public distinct, par carte, pour l'attribution.
- **V5-Accueil** · 9/10 · « + Inviter » réduit à « Tom vient avec toi » : discret et utile. « mar. 10 / nov. » coupé. → Espace insécable.
- **V5-Accueil-discret** · 9/10 · Désormais un choix, pas l'état par défaut : réglé. → —
- **V5-Accueil-duo** · 7/10 · Au format à deux, la sortie de groupe devient « facultatif » en 3e carte : l'Accueil pousse le canal qui n'amène personne. → Garder la sortie (avec la team) en tête, même au format à deux.
- **V5-Pause** · 9/10 · Évite la désinstallation. → —
- **V5-Chats** · 9/10 · « Ton pote · venu en team » : la team est visible. → —
- **V5-Groupe** · 9/10 · Brise-glace 3 mots : rétention avant jeudi. → —
- **V5-Groupe-menu** · 9/10 · Rien côté croissance. → —
- **V5-Attente** · 8/10 · « Il manque 2 personnes » + « Venir avec 1 ou 2 potes » en 1re action : le moteur d'amorçage existe. Plus aucun partage public (la carte ville a été supprimée) : seule la team reste. → Bouton secondaire « Partager : il manque 2 personnes à Nantes » (carte sans tiers).
- **V5-Amorcage** · 9/10 · Date, lieu, team de 3 + 2 : ma condition T2 « sortie d'amorçage en moins de 3 semaines » est maquettée (sam. 28 nov.). Reste à la mesurer. → Indiquer « 19 jours après ton inscription » pour fixer l'attente.
- **V5-Sortie-complete** · 9/10 · Relance immédiate « Oui, le 19 ». → —
- **V5-Sortie-annulee** · 9/10 · Relance immédiate, team prévenue. → —
- **V5-Affiner** · 9/10 · Sous-choix sortis du funnel : réglé. → —
- **V5-Affiner-histoire** · 9/10 · Hors funnel : réglé. → —
- **V5-Confirmation** · 9/10 · « Partager « demain je sors » » en secondaire, au pic d'attente. → —
- **V5-Partage-confirmation** · 8/10 · Carte juste et le meilleur hook (« Je raconte vendredi »). Même lien que les 3 autres cartes : aucune attribution par source. → Slug par carte (mer., jeu., ven., invitation).
- **V5-Revelation** · 9/10 · Privé, normal. → —
- **V5-Ange** · 9/10 · Boucle d'acquisition déguisée en sécurité. → —
- **W-Ange** · 9/10 · Encart sous « Ce lien ne m'est pas destiné » + « Voir › » : réglé. → Pré-remplir la ville du proche.
- **W-Ange-aide** · 9/10 · Aucun marketing : juste. → —
- **V5-Checkin** · 9/10 · Code d'abord : fiabilise la présence, donc la rétention. → —
- **V5-Checkin-ok** · 8/10 · « « J'y suis » » à côté de « Besoin d'aide » : poster pendant la soirée contredit « Range ton téléphone ». → Proposer « J'y suis » avant le check-in ou à la fin.
- **V5-Partage-checkin** · 8/10 · Exportable ; 40 % de dégradé vide (y≈500–870) ; même illustration que mercredi et vendredi : en Story, les 3 jours se ressemblent. → Un visuel par moment (chevalet orange le jeudi).
- **V5-Souvenir** · 7/10 · « Partager la soirée » est redescendu en lien gris sous « Voter en secret » : ma demande n°1 du tour 1 (CTA principal au pic émotionnel) est défaite. → Après « Enregistrer mes votes », écran de confirmation avec « Partager la soirée » en CTA principal.
- **V5-Partage** · 8/10 · « 3 nouvelles personnes et un pote » : chiffre juste, réglé. Même lien que les autres cartes. → Slug propre à cette carte.
- **V5-Apres** · 9/10 · Un écran, un CTA. → —
- **V5-Apres-resultats** · 8/10 · La carte d'accords a été supprimée au lieu d'être anonymisée : le moment « on a matché » n'a plus de sortie virale. → Carte « +1 dans ma bande » sans pet ni prénom, publiable après accord des deux.
- **V5-Apres-aucun** · 9/10 · Relance « Voir le jeu. 19 nov. ». → —
- **V5-Bande** · 9/10 · « + Inviter » par ligne et Sortie de bande : réglé. → —
- **V5-Rue** · 8/10 · Calme, zéro notification : bon pour la rétention de ceux qui fuient les jauges ; aucune boucle. → —
- **V5-Duo** · 7/10 · La limite « 1 duo actif » pousse vers Blowy+, jamais vers la sortie de groupe. → « Ou viens jeudi en groupe » à côté de la limite.
- **V5-Lien** · 8/10 · Privé : pas de boucle, normal. → —
- **V5-Lien-debloque** · 8/10 · Privé. → —
- **V5-RdvDuo** · 8/10 · Privé. → —
- **V5-Chat** · 8/10 · Privé ; duo né d'une sortie = meilleure rétention. → —
- **V5-RdvDuo-lea** · 8/10 · Privé. → —
- **V5-Oeuf** · 8/10 · Gadget hors boucle. → —
- **V5-Rupture** · 9/10 · Sortie propre = moins de désinstallations après un duo raté. → —
- **V5-Partage-invitation** · 7/10 · « VIENS AVEC MOI. » sans tiers, Message en 1er : réglé. « Ta place jeudi » reste publiable en Story : la place de team part au premier inconnu, souvent hors quartier. → Message seulement pour une place ; lien nominatif.
- **V5-Story** · 9/10 · Slug aléatoire : réglé. → —
- **W-Repondre** · 9/10 · « Voir ma ville » qualifie la ville. → —
- **V5-Profil** · 9/10 · « Décris-moi en 3 mots » en ligne de profil. → —
- **V5-Fiche** · 8/10 · « Partager » en haut de Nino : on ne sait pas quelle carte part. → « Partager Nino » + aperçu.
- **V5-Tarifs** · 9/10 · Prix montrables en vidéo. → —
- **V5-Abonnement** · 8/10 · Honnête ; la ligne sous le bouton est mangée par son ombre. → 16 px de marge.
- **V5-Paiement** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Paiement-ok** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Reglages** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Confidentialite** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Signaler** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Supprimer** · 8/10 · Toujours aucune question « pourquoi tu pars » (signal de densité perdu). → Une question facultative.
- **V5-Chargement** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Erreur-reseau** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Paiement-echec** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Verif-echec** · 9/10 · Réessai guidé : limite la chute au selfie. → —
- **V5-Notifs-refus** · 9/10 · « Ajouter à mon agenda » rattrape le refus. → —
- **V5-Chats-vide** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —

## Les 3 changements qui feraient le plus monter ma note

1. Un lien par usage et par source : team = nominatif à usage unique (rend vrai l'écran Invite), cartes publiques = slug distinct par carte (mer., jeu., ven., 3 mots, ange) pour mesurer le 0,3 par canal.
2. Remettre « Partager la soirée » en CTA principal juste après « Enregistrer mes votes », et redonner une sortie virale aux accords (carte sans pet ni prénom, après accord des deux).
3. Retirer la voie Duo des points de décision du funnel (Welcome « Ou un tête-à-tête », Rencontrer, lien secondaire de Trouvée) et la proposer après la 1re sortie ; mesurer le taux de team par cohorte.

## Je mets 10 si…

Je mets 10 si le test de 8 semaines prévu dans business-model mesure dans le 11e Welcome → 1re sortie vécue ≥ 25 % et une chute au selfie < 30 %, si chaque sortie vécue produit ≥ 0,3 inscrit vérifié attribué par source (team, carte mer., carte jeu., carte ven., ange, 3 mots), si Nantes ou Lille passe de « il manque N » à une sortie vécue en moins de 3 semaines grâce aux teams, et si chaque lien imprimé dit vrai (usage unique ou public, jamais les deux).
