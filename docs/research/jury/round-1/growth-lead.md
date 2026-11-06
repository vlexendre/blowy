# Jury V5 · tour 1 · Growth lead (distribution et croissance)

**Verdict.** La V5 a enfin une unité virale juste (le « +1 » à une vraie sortie, la jauge de quartier, la page de l'ange gardien), mais aucun écran n'est conçu pour être partagé au moment où l'émotion est maximale, et le cold start à l'arrondissement n'est pas chiffré : en l'état, K ≈ 0,3, pas 1.

**Note globale : 5/10**

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 7 | « Ton pet te trouve une bande. En vrai, cette semaine. » se comprend ; « pets & potes » et la mascotte brouillent le « c'est pour rencontrer des gens » sur une capture de store. |
| Charge cognitive | 6 | 16 écrans avant l'Accueil (Welcome → Notifs) pour une promesse « 2 min en tout » : chaque écran est un point de fuite du funnel. |
| Envie (J+1/J+7/J+30) | 6 | Le cycle hebdo (mardi : groupe, mercredi : lieu, jeudi : visages) est une bonne horloge de rétention ; rien entre deux sorties ne fait revenir J+3. |
| Vraie rencontre (2 semaines) | 6 | Sortie à J+7 au plus tard, c'est le meilleur atout ; mais aucun choix de créneau à l'écran (spec §2.4 : `slotStartsAt[]`), donc taux de placement inconnu. |
| Sécurité et confiance | 7 | Ange gardien, check-in, votes secrets : rassurant pour la conversion des femmes, qui conditionnent la densité. |
| Viralité / distribution | 5 | Trois boucles réelles (+1, liste d'attente, ange gardien) mais zéro bouton de partage sur Trouvée, Résultats ou Souvenir hors story ; la story « Sortie » n'est même pas rendue. |
| Argent | 4 | 12 € la place avec 1 conso : la marge Blowy après boisson et Stripe ne paie pas un CAC payant ; Blowy+ à 19,99 € pour 2 places à 12 € = 4 € d'économie, argument faible. |
| Finition visuelle | 7 | Typo display et pets très « TikTok-ready » ; contrastes faibles sur dégradés (texte blanc sur rose/orange). |

## Lecture d'ensemble

Repères marché : Timeleft a atteint 18 M d'ARR et 150 k utilisateurs mensuels en ~20 mois, en ouvrant des villes **à la pub payante**, sans ambassadeurs ; ses petites villes se sont lassées de « dîner avec les mêmes ~10 personnes » et il a dû refermer de 325 à ~220 villes. Amata coordonne ~2 000 rendez-vous/mois à New York avec un jeton à 20 $ et une pause après 2 annulations : même mécanique de fiabilité que Blowy, mais Amata ne vise pas l'amitié. Locket a fait 250 M de vues avec **un seul format TikTok répété** (visage 2 s + hook texte + capture d'écran de l'app). Gas a percé école par école avec liste d'attente : la densité locale avant l'ouverture, c'est exactement la promesse « Paris 11e · Lyon 4e » de Blowy, mais il faut le seuil de densité **visible et partageable**.

Calcul K-factor grossier (hypothèses à valider) : 30 % des inscrits utilisent le +1 × 35 % de conversion de l'invité (onboarding + selfie + même quartier + même semaine) ≈ 0,10 ; story « 3 mots » : 15 % la postent × 8 répondants × 5 % qui créent un pet ≈ 0,06 ; ange gardien : 60 % en désignent un × 3 % de conversion ≈ 0,02 ; liste d'attente : 20 % invitent × 1,5 inscrit ≈ 0,3 seulement **avant** ouverture. Total en régime ouvert ≈ 0,2–0,3. Il faut un moment de partage post-sortie à 0,3 de plus pour viser 0,6, et du payant ciblé par arrondissement pour le reste.

## Reproches du tour V4 (panel personas) : statut

- Invite à 100 pièces : **remplacée** par « Alex t'emmène à sa sortie · 1re offerte » (bien plus forte).
- Story « Naissance » / « On s'est vus » (outing) : **retirées** ; la story « Sortie » qui les remplace n'est pas rendue.
- Quartier vide tant qu'on n'invite pas 3 amis : **à moitié réglé** (la sortie remplit la bande), mais la Bande reste peuplée d'« ami·es invité·es ».
- Densité hors Paris (Bordeaux, Nantes, Marseille, Lille) : **assumé** par le lancement par quartier, non chiffré à l'écran.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 7/10 · Bon hook, mais le chip « Paris 11e · Lyon 4e » ne dit pas quoi faire si je suis ailleurs ; « 5 personnes » alors que l'orbite montre 4 pets. → Afficher « Ton quartier n'est pas ouvert ? Fais-le ouvrir » sous le CTA (entrée directe dans la liste d'attente) et aligner 5 pets = 5 personnes.
- **V5-Invite** · 7/10 · Le meilleur écran d'acquisition, mais CTA « Créer mon pet » au lieu de l'objet du désir (la place jeudi) ; 35 % de l'écran est vide sous l'encart boisson ; pas d'avertissement qu'il faudra un selfie + photo. → CTA « Prendre ma place jeudi » ; montrer le compte à faire (« 2 min + selfie ») ; ajouter le visage/prénom d'Alex (déjà vérifié) pour la preuve sociale.
- **V5-Craft** · 6/10 · 4 espèces + 4 curseurs = 8 décisions en écran 1 ; le « 3D · fais-le tourner » coûte du temps sans servir la sortie. → Une espèce + un tap ; curseurs déplacés après la 1re sortie (« affine Nino »).
- **V5-Vie** · 5/10 · « Il irait à l'école… Polytechnique / École du cirque » : pour un public venu par TikTok, ça sent le quiz ; 4 écrans de plus avant toute valeur. → Réduire à 2 questions max avant Trouvée, le reste dans le chat de groupe (les pets demandent).
- **V5-Intention** · 7/10 · Clair, mais les deux cases semblent cochées par défaut ; « Entre nous » en étape 03 alors qu'il n'y a pas de 02 visible. → Rien de coché par défaut ; numérotation cohérente.
- **V5-Toi** · 7/10 · Une question, 3 choix : bien. Double indicateur (barre 04 + 3 points) inutile. → Un seul indicateur de progression.
- **V5-Toi-plus** · 7/10 · Clair et secret. Rien de viral ici, normal. → Garder ; masquer l'écran si « Plus » n'a pas été coché.
- **V5-Toi-quartier** · 6/10 · « Ailleurs → liste d'attente » est noyé en 3e choix gris ; c'est pourtant ton moteur d'acquisition hors Paris 11e. « près de toi » sous Paris 11e suggère une géoloc. → « Ailleurs » ouvre une saisie d'arrondissement/quartier avec jauge immédiate et « invite 3 voisins pour ouvrir » ; retirer « près de toi ».
- **V5-Eclosion** · 6/10 · Animation sans action : 3–4 s de funnel en plus, aucun partage. → Proposer « filmer l'éclosion » (vidéo 6 s exportable avec watermark blowy.) : c'est un format TikTok natif.
- **V5-Eclosion-ne** · 6/10 · « Garder Nino pour de vrai » = créer un compte, wording ambigu ; pas de partage du pet né. → CTA « Créer mon compte » + bouton secondaire « Partager Nino » (carte 9:16).
- **V5-Compte** · 7/10 · Apple/Google/téléphone : bon. « Garde Nino » infantilise un peu ; 18 ans en petit gris. → Garder les SSO ; « Ton compte · 18 ans et plus » lisible.
- **V5-Trouvee** · 7/10 · LE moment screenshot (« Nino t'a trouvé une bande », pets, date) et il n'y a aucun bouton partager ; le « +1 un·e ami·e » est un carré pointillé sans texte d'action. → Bouton « Partager ma bande » (carte 9:16 sans prénoms) + carré +1 étiqueté « Emmène quelqu'un · gratuit pour sa 1re ».
- **V5-Sortie** · 7/10 · Fiche complète, mais aucune preuve sociale (combien de sorties ce jeudi dans le 11e ?) et le +1 n'explique pas que l'ami·e a aussi sa 1re offerte. → Ligne « 12 sorties ce jeudi dans le 11e » (vrais chiffres) ; +1 : « sa 1re sortie est offerte aussi ».
- **V5-Sortie-inscrit** · 6/10 · Copie quasi exacte de Sortie : l'état « Tu y vas » est un pill vert en haut à droite, rien ne célèbre l'engagement. → Bandeau « Tu y vas ! » + « Dis-le à un·e ami·e qui pourrait venir » (lien +1 pré-rempli).
- **V5-Sortie-complete** · 4/10 · Incohérent : « Les 6 places sont prises » alors que le groupe affiché fait 4 ; un utilisateur qui voit « complet » sans comprendre décroche. → Écrire la vraie raison (« ta demande est arrivée après la composition ») et ne pas afficher un groupe dont on ne fait pas partie.
- **V5-Sortie-annulee** · 6/10 · Bon ton (remboursée, prioritaire), mais la carte affiche encore « Lieu exact mercredi à 18 h · visages jeudi à 9 h ». → Retirer les infos périmées ; ajouter « Préviens ton +1 » si invité.
- **V5-Verif** · 6/10 · Mur de friction placé juste après « Je viens » : bonne place, mais « 30 s » sous-estime (selfie + 2 photos). → Annoncer « 1 min · selfie + 1 photo » ; mesurer la chute à cet écran comme KPI n°1.
- **V5-Notifs** · 7/10 · Bon pré-prompt contextuel (« Ton groupe va écrire »). → Garder ; ajouter « tu sauras quand ton quartier ouvre » pour les inscrits en liste d'attente.
- **V5-Accueil** · 6/10 · Le +1 est en 4e position (bandeau pointillé bas) ; 40 % de l'écran est un salon décoratif. → Réduire l'illustration à 25 %, remonter « Emmène un·e ami·e jeudi » juste sous la carte sortie.
- **V5-Attente** · 7/10 · Jauge 212/300 + CTA unique : bon. Mais pas de date estimée, pas de partage de la jauge, et 300 contredit le seuil de 120 vérifiés de la spec (§12 q.10). → Afficher le vrai seuil, « il manque 88 voisin·es », et un partage « Fais ouvrir Paris 20e » avec l'image de la jauge.
- **V5-Chats** · 7/10 · Clair. « Inès : qui vient jeudi avec Alex ? » montre une boucle bande → +1 : excellent. → Mettre en avant cette boucle : bouton « Inviter Inès à jeudi » dans la ligne Ta bande.
- **V5-Groupe** · 7/10 · Brise-glace « 3 mots » = rétention avant J ; « 4 + toi » alors que 3 pets visibles. → Corriger le compte ; ajouter un 2e prompt automatique la veille pour éviter le chat mort.
- **V5-Revelation** · 6/10 · Moment fort mais privé ; rien de partageable sans outing des autres. → Proposer « Partager : J'ai rendez-vous ce soir avec 3 inconnu·es » (pets seulement).
- **V5-Ange** · 7/10 · Bonne boucle d'acquisition déguisée en sécurité ; « Maman par WhatsApp » parfait. → Ajouter « Sam ne verra que ça » en haut, garder.
- **W-Ange** · 7/10 · L'encart « Découvrir › » en bas est discret et juste. Pas de lien vers le quartier (Sam habite peut-être le 11e). → Encart « Il y a des sorties à Paris 11e jeudi · 1re offerte » si même ville ; sinon liste d'attente de son quartier.
- **W-Ange-alerte** · 7/10 · Aucun marketing ici, c'est juste. → Ne rien ajouter.
- **V5-Checkin** · 7/10 · Gros bouton clair. → Rien côté growth.
- **V5-Checkin-ok** · 6/10 · « Malo en route » : statut inventé (la spec ne montre que « arrivé·e ») ; aucun moment de groupe à capturer. → « Photo de table » optionnelle sans visages (les mains + les boissons) partageable plus tard.
- **V5-Souvenir** · 7/10 · Bon pic émotionnel, mais le partage est relégué en lien texte sous « Voter en secret ». → Après le vote, revenir ici avec « Partager la story » en CTA principal ; pré-générer la carte 9:16.
- **V5-Apres** · 7/10 · Mécanique de vote propre ; c'est le moment où l'on a le plus envie d'en parler (« j'ai voté plus… »). → Rien à partager ici (secret) ; mais afficher « Ta prochaine sortie : jeudi 20 » après le dernier vote.
- **V5-Apres-resultats** · 6/10 · « 2 ACCORDS. » est le vrai moment screenshot de l'app et il n'a pas de partage anonymisé ; double CTA « Écrire à Léa ». → Carte partageable « +1 dans ma bande » (pets seulement, sans prénoms) ; un seul CTA.
- **V5-Bande** · 7/10 · « Viens jeudi avec quelqu'un » : bonne relance ; « 5 personnes » vs 4 pets dans la rue (Tom absent). → Corriger ; mettre un bouton +1 par ligne (« Venir jeudi avec Inès »).
- **V5-Chat** · 6/10 · « Proposer un rendez-vous · avant le 20 nov. » : une échéance qui n'existe pas pour un duo né d'une sortie (spec §12 q.14). → Retirer l'échéance ; garder le raccourci.
- **V5-Duo** · 6/10 · La voie Duo cannibalise la sortie (le produit viral) et ressemble à n'importe quelle app de rencontre ; « 84 % de vision » est la seule chose screenshotable. → Placer la voie Duo derrière la 1re sortie vécue ; mesurer si elle fait baisser le taux de +1.
- **V5-Lien** · 6/10 · Clair ; pas de boucle. → Rien côté growth.
- **V5-Lien-debloque** · 6/10 · Moment fort privé. → Rien à partager (visages).
- **V5-RdvDuo** · 5/10 · RDV « Sam. 15 nov. · 18 h » alors que les visages se débloquent « samedi 20 h » : on propose un rendez-vous avant de s'être vus. → Contraindre la proposition après le déblocage.
- **V5-RdvDuo-lea** · 6/10 · Même écran, cohérent. → Rien côté growth.
- **V5-Oeuf** · 6/10 · Clin d'œil mignon, potentiel TikTok (« on a un œuf ») mais caché dans un menu. → Une fois éclos, carte partageable des deux pets (avec double consentement).
- **V5-Rupture** · 6/10 · « Ghoster, c'est elle qui baisse » est faux (la fiabilité compte les présences) : une promesse fausse se voit vite sur les réseaux. → Corriger le texte.
- **V5-Story** · 5/10 · Seul l'onglet Question est rendu ; la story « Sortie » (« On était 5 au café ») — la plus forte pour l'acquisition locale — n'est pas montrée ; « ngl, mais en mieux » associe la marque à NGL (sanctionnée par la FTC en 2024 pour de faux messages anonymes). → Rendre les 3 onglets ; retirer la référence NGL ; ajouter un sticker lien « Viens jeudi · Paris 11e » sur la story Sortie.
- **W-Repondre** · 7/10 · Boucle Gas-like efficace : chips positifs, 3 choix, envoi. Fin « Alex t'emmène à sa prochaine sortie » = bon pont vers l'IRL. → Ajouter le quartier de la personne (« tu es dans le 11e ? ») avant de pousser l'install, sinon CAC gaspillé hors zone.
- **V5-Profil** · 6/10 · Vision card à partager : bon ; mais rien ne dit ce que l'autre recevra. → Aperçu de la carte avant partage.
- **V5-Fiche** · 6/10 · Souvenirs = preuve d'usage ; « Partager sa vision card » en haut doublonne le Profil. → Un seul point d'entrée de partage.
- **V5-Boutique** · 4/10 · Accessoires vendus 2,99 € à l'unité alors que la spec (D-020) les déclare non achetables ; Blowy+ 19,99 € pour 2 places à 12 € = 4 € d'économie. → Retirer l'achat d'accessoires ; Blowy+ avec une vraie raison (ex. +1 offert chaque mois à un·e ami·e : c'est aussi de l'acquisition).
- **V5-Reglages** · 7/10 · Rien côté growth. → —
- **V5-Abonnement** · 4/10 · L'état « Avant de partir… −50 % pendant 3 mois. L. continue d'en profiter aussi. » est toujours dans la source : s'il fuite en prod, c'est un bad buzz garanti. → Supprimer le bloc du fichier.
- **V5-Confidentialite** · 7/10 · Rien côté growth. → —
- **V5-Signaler** · 7/10 · Rien côté growth. → —
- **V5-Supprimer** · 6/10 · Bon (pause proposée) ; aucun « pourquoi » exploitable pour le quartier (« pas assez de sorties » doit alimenter la densité). → Si « Pas assez de sorties » : proposer la liste d'attente d'un quartier voisin.

## Les 3 changements qui feraient le plus monter ma note

1. Un vrai moment de partage post-sortie : carte 9:16 générée automatiquement (pets du groupe, café, « On était 5 jeudi soir, Paris 11e », lien « viens jeudi ») en CTA principal du Souvenir et des Résultats, avec un tracking K par source.
2. Faire du +1 le geste central : étiqueter le carré pointillé (« Emmène quelqu'un · sa 1re est offerte »), le mettre en 2e position de l'Accueil, et permettre le +1 depuis chaque ligne de la Bande.
3. Cold start chiffré par quartier : afficher le vrai seuil (spec : 120 vérifiés), « il manque N voisin·es », partage de la jauge, et « Ailleurs » qui ouvre une liste d'attente nominative dès l'onboarding.

## Je mets 10 si…

Je mets 10 si, sur un test de 4 semaines dans le 11e, le funnel montré est mesuré (Welcome → 1re sortie vécue ≥ 25 %, chute au selfie < 30 %), si chaque sortie vécue produit au moins 0,3 nouvel inscrit vérifié dans le même quartier (+1 + story + ange gardien), et si le partage post-sortie est un CTA principal qui ne montre ni visage ni prénom.

## Sources

- [ARR Club — Timeleft atteint 18 M d'ARR et 150 k utilisateurs mensuels (avr. 2026)](https://www.arr.club/timeleft/timeleft-reaches-18m-arr-with-150k-monthly-users)
- [Inside Timeleft's journey (substack) — ouverture par la pub, 325 → ~220 villes, lassitude des petites villes](https://timfrin.substack.com/p/inside-timelefts-journey-to-connecting)
- [Axios, 14/05/2026 — Amata : ~2 000 rendez-vous/mois, jeton 20 $, pause après 2 annulations](https://axios.com/2026/05/14/ai-matchmaker-online-dating-tech)
- [Global Dating Insights — Amata lève 6 M$](https://www.globaldatinginsights.com/featured/ai-dating-startup-amata-launches-with-6m-in-funding/)
- [Shortimize — Locket, 250 M de vues TikTok avec un format répété](https://www.shortimize.com/blog/locketapps-tiktok-influencer-strategy-for-gaining-250m-views)
- [Boston Globe, 09/07/2024 — FTC contre NGL (faux messages anonymes)](https://www.bostonglobe.com/2024/07/09/business/ftc-anonymous-messaging-app-children-ngl)
- [TechCrunch — Discord rachète Gas (lancement école par école)](https://techcrunch.com/2023/01/17/discord-acquires-gas-a-compliments-based-social-media-app-for-teens)
