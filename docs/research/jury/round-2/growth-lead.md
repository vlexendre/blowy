# Jury V5.1 · tour 2 · Growth lead (distribution et croissance)

**Verdict.** La V5.1 a enfin une machine de distribution cohérente (team de 2–3 comme unité d'acquisition, 5 cartes 9:16 dont « Partager la soirée » en CTA principal, ville fermée chiffrée 87/120 avec amorçage à 3), mais le funnel s'est allongé (13 écrans avant la première valeur), l'écran d'attente n'a plus aucun bouton de partage, et deux cartes affichent un chiffre faux qui se fera relever en commentaire.

**Note globale : 7/10** (tour 1 : 5/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 8 | « Des ami·es ou plus. En vrai, cette semaine. » + « Ouvert : Paris 11e, Lyon 4e. Ailleurs : une date d'ouverture » : la promesse et sa limite géographique sont dans le même plan. |
| Charge cognitive | 6 | Tour 1 : 16 écrans avant l'Accueil. Tour 2 : Welcome → Ville → Rencontrer → Intention (+ sous-choix) → Consentement → Toi → Toi-plus → Craft → Vie ×3 → Dispos → Éclosion → Compte → Compte-age = 15 écrans avant Trouvée, puis Sortie → Vérif → Notifs. Chaque écran est une fuite. |
| Envie (J+1/J+7/J+30) | 7 | Horloge hebdo + confirmation mer. 18 h + votes dim. 21 h 30 ; « Sortie de bande » pour J+30. Rien entre deux sorties hors chat, mais la Pause évite la désinstallation. |
| Vraie rencontre (2 semaines) | 8 | Sortie offerte à J+3, créneaux choisis, composition anonyme avant « Je viens », alternative le 19 sur complet/annulé. |
| Sécurité et confiance | 8 | La couche sécurité convertit les femmes, qui font la densité. |
| Viralité / distribution | 7 | 5 cartes (semaine, invitation, soirée, accords, ville) + 3 mots + ange gardien. Manques : pas de partage sur Attente, pas de lien depuis Ville-fermée, invitation de team sans aperçu côté invité, « 4 inconnu·es » faux. |
| Argent | 7 | 4,99 € et 9,99 € sont postables sans honte ; « 1re offerte » pour l'invité aussi = CAC de l'invitation quasi nul (le lieu n'est plus payé). |
| Finition visuelle | 7 | Cartes 9:16 propres et cohérentes ; 40 % de dégradé vide au milieu de chaque carte (bon pour stickers, mauvais en Message). |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 75 fichiers, 786 vérifications, 0 contradiction » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 75 écrans, 1042 textes, 420 cibles, 0 problème, contraste minimum 4.53:1 ». Les deux passent. Ils ne contrôlent ni la chronologie entre écrans, ni les tranches d'âge, ni le sens des phrases dérivées : les contradictions relevées ci-dessous leur échappent.

## Mes exigences du tour 1 : vérification point par point

- **Moment de partage post-sortie en CTA principal, sans visage ni prénom** : réglé. Souvenir : « PARTAGER LA SOIRÉE » au-dessus de « Voter en secret » ; carte « ON ÉTAIT 5 » avec 5 pets et lien blowy.app/s/paris11.
- **+1 étiqueté, 2e position de l'Accueil, depuis chaque ligne de Bande** : réglé. Accueil : « Une place pour un·e 2e ami·e · sa 1re offerte · + Inviter » sous la carte ; Bande : « + Jeudi » par ligne ; Team et Team-amorçage.
- **Cold start chiffré : vrai seuil 120, « il manque N », partage de la jauge, « Ailleurs » nominatif** : partiellement. 87/120 + mars 2027 + 3 lieux (2 signés) : réglé. Partage-ville existe. Mais Attente a retiré tout bouton d'invitation (« aucun bouton Inviter culpabilisant ») sans le remplacer par « Partager la jauge » ; Ville-fermée n'a pas d'entrée vers Partage-ville ; et l'inscription « en 1 tap » ne montre pas quel contact est capturé (« On t'écrit… » par où ?).
- **Story « Sortie » rendue, NGL retiré, vrais logos ou icônes** : réglé. Icônes génériques Story / Message / Enregistrer / Copier le lien.
- **Partage Trouvée (« ma semaine »)** : réglé. Bouton « Partager » sur Trouvée → Partage-semaine. Le texte « JE SORS AVEC 4 INCONNU·ES » est faux (Tom est l'ami).
- **Retirer « près de toi »** : partiellement. Retiré de Ville, mais « près de chez toi » reste sur Welcome et W-Ange.
- **Retirer l'état de rétention −50 %** : réglé. « aucune offre de rétention dans le code » (README).
- **Duo derrière la 1re sortie, mesurer la cannibalisation du +1** : non retenu. Duo est une porte d'entrée à égalité (Rencontrer) et « La voie Duo, déjà ouverte » sur Attente : la voie non virale est proposée à ceux qu'on veut faire inviter.

**Ma condition du 10 au tour 1** : « sur un test de 4 semaines dans le 11e, le funnel montré est mesuré (Welcome → 1re sortie vécue ≥ 25 %, chute au selfie < 30 %), si chaque sortie vécue produit au moins 0,3 nouvel inscrit vérifié dans le même quartier (+1 + story + ange gardien), et si le partage post-sortie est un CTA principal qui ne montre ni visage ni prénom »  
**Statut** : 1 sur 3 tenu par les maquettes (partage post-sortie en CTA principal sans visage). Les deux autres demandent un test terrain, toujours pas fait ; le funnel a même gagné des écrans.

## Lecture d'ensemble

K-factor recalculé avec la V5.1 (hypothèses) : team (30 % viennent avec 1,3 ami en moyenne × 60 % de vérification) ≈ 0,23 ; « Partager la soirée » (25 % postent × 300 vues × 0,1 % d'inscription vérifiée locale) ≈ 0,08 ; amorçage ville fermée (0,4 par inscrit hors zone, avant ouverture) ; ange gardien ≈ 0,02 ; 3 mots ≈ 0,04. Total en zone ouverte ≈ 0,35–0,4 (tour 1 : 0,2–0,3). C'est l'objectif K ≥ 0,3 de concept-v5.1 B.7, atteint sur le papier. Ce qui le menace : 15 écrans avant la valeur et le selfie après « Je viens ».

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 8/10 · Hook juste, 5 pets = 5 personnes, villes ouvertes nommées. « près de chez toi » contredit « on ne demande jamais ta position » de l'écran suivant. → « dans ton quartier ».
- **V5-Ville** · 8/10 · Ville en 1er : réglé ; quartiers acceptables et trajet = taux de placement. Pas de compteur « 12 sorties ce jeudi dans le 11e ». → Ligne de preuve sociale réelle sous « Paris 11e · ouvert ».
- **V5-Ville-fermee** · 7/10 · 87/120 + mars 2027 : réglé. Aucun bouton « Partager la jauge » ici (il n'existe que via la team) ; « M'inscrire » ne dit pas quel contact on laisse. → « M'inscrire avec mon numéro » + lien secondaire « Fais ouvrir Saint-Denis » (Partage-ville).
- **V5-Team-amorcage** · 8/10 · Meilleur mécanisme de cold start du dossier : 3 vérifiés = une sortie. Aucune date ni lieu pour la sortie d'amorçage : « quand ? » restera sans réponse. → « Sortie d'amorçage sous 2 semaines après le 3e selfie ».
- **V5-Rencontrer** · 6/10 · Duo à égalité avec le groupe dès l'écran 3 : la voie non virale capte ceux qui auraient invité. → « Les deux » en tête, ou Duo proposé après la 1re sortie ; mesurer le taux de team par choix.
- **V5-Intention** · 8/10 · Clair, rien coché. → —
- **V5-Intention-rempli** · 6/10 · 2 sous-questions de plus (sérieuse, enfants) dans le funnel avant toute valeur. → Les déplacer après la 1re sortie (« affine tes duos »).
- **V5-Consentement** · 7/10 · Nécessaire légalement, mais c'est un écran de plus avant Trouvée. → Ne le montrer qu'à ceux qui ont choisi « Une histoire / Les deux » (à confirmer à l'écran).
- **V5-Toi** · 7/10 · Genre + pronom : rapide. → —
- **V5-Toi-plus** · 7/10 · Clair ; à masquer pour « Nouveaux potes ». → —
- **V5-Craft** · 8/10 · Une décision, 5 espèces : réglé. → Bouton secondaire « Partager mon pet » (carte 9:16).
- **V5-Vie** · 6/10 · 3 questions = 3 écrans ; seule « Tu sors plutôt… » sert la composition. → Garder 1 question avant Trouvée ; les 2 autres dans le chat de groupe.
- **V5-Dispos** · 8/10 · Utile au taux de placement. → —
- **V5-Eclosion** · 7/10 · 1,5 s + CTA « Créer mon compte » : réglé. Toujours aucun export vidéo de l'éclosion. → Bouton « Filmer » 6 s, filigrane.
- **V5-Compte** · 8/10 · SSO 1 tap : bon. → —
- **V5-Compte-age** · 7/10 · Écran 15 ; 3 réglages dont un curseur. CTA « Voir ma sortie » = bonne promesse. → Âge du groupe par défaut sans le montrer ici.
- **V5-Trouvee** · 8/10 · « Partager » présent : réglé. CTA « Voir la sortie » noir sur fond corail, 330 px vides au-dessus. → Remonter les CTA ; garder Partager à côté.
- **V5-Sortie** · 8/10 · Prix futur annoncé, team visible : réglé. → Ligne « Tom vient avec toi · + 1 place » cliquable vers Partage-invitation.
- **V5-Verif** · 7/10 · « 1 min » annoncé, selfie + 1 à 3 photos : KPI n°1 du funnel ; aucun indicateur que la place est tenue pendant ce temps. → « Ta place est gardée 30 min ».
- **V5-Notifs** · 8/10 · « Ta place est réservée » en tête : bon renforcement. → —
- **V5-Sortie-inscrit** · 8/10 · Bandeau « Tu y vas » : réglé. Pas de « Dis-le à un·e ami·e » ici (la team est une ligne parmi 3). → Ligne team avec « + 1 place » explicite.
- **V5-Team** · 8/10 · « Leur 1re sortie est offerte aussi » : le bon argument. L'invité ne voit nulle part ce qu'il recevra (pas d'écran d'arrivée par lien). → Dessiner l'écran d'arrivée de l'invité (tour 1 : V5-Invite, disparu).
- **V5-Accueil** · 8/10 · Team remontée en 2e position, salon réduit : réglé. → —
- **V5-Accueil-discret** · 7/10 · Mode discret ON par défaut = aucun pet ni prénom à l'écran d'accueil pour tous : le produit perd son visage partageable. → Discret proposé, OFF par défaut sauf choix « discrétion ».
- **V5-Pause** · 8/10 · Évite la désinstallation : bon pour la rétention. → —
- **V5-Chats** · 7/10 · Pas de boucle bande → +1 visible (« Inviter Tom à jeudi »). → Raccourci « + Jeudi » sur la ligne bande.
- **V5-Groupe** · 8/10 · Brise-glace « 3 mots » : rétention avant J. → —
- **V5-Groupe-menu** · 8/10 · Rien côté growth. → —
- **V5-Sortie-complete** · 8/10 · Ancien 4/10 réglé : raison + « Oui, le 19 ». → —
- **V5-Sortie-annulee** · 8/10 · Ton neutre + alternative : réglé. → —
- **V5-Attente** · 6/10 · « Aucun bouton Inviter culpabilisant » : mais aucun partage non plus. Le moteur hors zone (concept B.6) n'a ici que la ligne team. → Bouton secondaire « Partager la jauge » (Partage-ville), sans culpabilité.
- **V5-Revelation** · 7/10 · Moment fort et privé, rien de partageable (normal). → Carte « Demain, 4 visages » sans visages.
- **V5-Ange** · 8/10 · Boucle d'acquisition déguisée en sécurité : bonne. → —
- **W-Ange** · 8/10 · Encart « une sortie à 5 près de chez toi… Voir › » : réglé. → Router vers Ville avec quartier pré-saisi.
- **W-Ange-alerte** · 8/10 · Aucun marketing : juste. → —
- **V5-Checkin** · 8/10 · Rien côté growth. → —
- **V5-Checkin-code** · 8/10 · Repli fiable : protège le taux de check-in, donc la fiabilité et la rétention. → —
- **V5-Checkin-ok** · 7/10 · Aucun moment capturable (5 prénoms à l'écran). → Carte « À la table · 5/5 » en pets.
- **V5-Souvenir** · 9/10 · « Partager la soirée » en CTA principal : ma demande n°1, réglée. → —
- **V5-Partage** · 7/10 · Carte propre, lien quartier, « Citer le lieu » ; « avec 4 inconnu·es » est faux (Tom) : premier commentaire garanti. → « 3 inconnu·es et un pote ».
- **V5-Apres** · 8/10 · Rien à partager (secret) : juste. → —
- **V5-Apres-resultats** · 8/10 · Un CTA + « Partager · pets seulement » : réglé. → —
- **V5-Apres-aucun** · 8/10 · « Voir le jeu. 19 nov. » relance tout de suite : bon. → —
- **V5-Partage-accords** · 6/10 · « +1 DANS MA BANDE. +1 DUO. » avec 2 pets dont celui de Sarah : identifiable par le groupe (vote révélé), donc à retirer, et c'est la carte la plus virale. → Silhouettes génériques ; la garder.
- **V5-Bande** · 8/10 · « + Jeudi » par ligne, « Sortie de bande » : réglé. → —
- **V5-Duo** · 6/10 · Ressemble à toutes les apps de dating ; aucune boucle. → —
- **V5-Lien** · 7/10 · Pas de boucle. → —
- **V5-Lien-debloque** · 7/10 · Privé. → —
- **V5-RdvDuo** · 7/10 · Pas de boucle. → —
- **V5-Chat** · 7/10 · Pas de boucle. → —
- **V5-RdvDuo-lea** · 7/10 · Pas de boucle. → —
- **V5-Oeuf** · 6/10 · Potentiel TikTok non exploité (carte des deux pets avec double accord). → —
- **V5-Rupture** · 8/10 · Promesse juste (« la fiabilité ne compte que les sorties ») : réglé. → —
- **V5-Partage-semaine** · 6/10 · « JEUDI, JE SORS AVEC 4 INCONNU·ES » faux (3 + Tom). → Phrase calculée.
- **V5-Partage-invitation** · 7/10 · « VIENS JEUDI AVEC MOI ET TOM » : bon objet de désir ; la Story publique donne la place au premier venu, souvent hors quartier : CAC gaspillé et place perdue. → Message seulement (pas Story) pour une place nominative.
- **V5-Partage-ville** · 8/10 · « Aide-nous à ouvrir Saint-Denis » + lien team : réglé. Accessible seulement depuis la team. → Entrée depuis Ville-fermée et Attente.
- **V5-Story** · 8/10 · NGL retiré : réglé. → —
- **W-Repondre** · 8/10 · Fin « Et toi, tu sors où ? » → Ville : réglé (qualifie le quartier). → —
- **V5-Profil** · 8/10 · « Mes cartes à partager » : un point d'entrée unique, réglé. → —
- **V5-Fiche** · 7/10 · « Partager » en haut doublonne le Profil. → Un seul point d'entrée.
- **V5-Tarifs** · 8/10 · Prix montrables en vidéo. → —
- **V5-Abonnement** · 7/10 · « Rentable à partir de 3 sorties par mois » sur 4 jeudis possibles : argument faible. → —
- **V5-Paiement** · 8/10 · Friction minimale (Face ID). → —
- **V5-Paiement-ok** · 8/10 · Upsell Blowy+ discret et chiffré. → —
- **V5-Reglages** · 8/10 · — → —
- **V5-Confidentialite** · 8/10 · — → —
- **V5-Signaler** · 8/10 · — → —
- **V5-Supprimer** · 7/10 · Aucun « pourquoi » (« pas assez de sorties ») qui alimente la carte de demande. → 1 question facultative.
- **V5-Chargement** · 8/10 · — → —
- **V5-Erreur-reseau** · 8/10 · — → —
- **V5-Paiement-echec** · 8/10 · Place gardée 30 min : limite la perte. → —
- **V5-Verif-echec** · 8/10 · Réessai guidé : réduit la chute au selfie. → —
- **V5-Notifs-refus** · 8/10 · « Ajouter à mon agenda » rattrape le refus : malin. → —
- **V5-Erreur-age** · 8/10 · — → —
- **V5-Chats-vide** · 8/10 · Renvoie vers la proposition. → —

## Les 3 changements qui feraient le plus monter ma note

1. Couper le funnel à ≤ 9 écrans avant Trouvée : 1 seule question Vie, sous-choix d'intention après la 1re sortie, âge du groupe implicite ; garder Ville, Rencontrer, Intention, Consentement, Toi, Toi-plus, Craft, Dispos, Compte.
2. Remettre un partage (non culpabilisant) sur Attente et Ville-fermée vers Partage-ville, montrer quel contact est capturé à l'inscription en 1 tap, et dessiner l'écran d'arrivée d'un invité de team.
3. Corriger les phrases des cartes (« 3 inconnu·es et un pote ») et rendre la carte d'accords anonyme (silhouettes), sinon elle sera retirée et la meilleure boucle avec.

## Je mets 10 si…

Je mets 10 si un test de 4 semaines dans le 11e mesure le funnel montré (Welcome → 1re sortie vécue ≥ 25 %, chute au selfie < 30 %), si chaque sortie vécue produit au moins 0,3 inscrit vérifié dans le même quartier (team + cartes + ange gardien, tracké par source), et si une ville fermée atteint une sortie d'amorçage en moins de 3 semaines grâce aux teams.

## Sources

- [ARR Club — Timeleft 18 M d'ARR, 150 k utilisateurs mensuels (avr. 2026)](https://www.arr.club/timeleft/timeleft-reaches-18m-arr-with-150k-monthly-users)
- [Shortimize — Locket, 250 M de vues avec un format répété](https://www.shortimize.com/blog/locketapps-tiktok-influencer-strategy-for-gaining-250m-views)
