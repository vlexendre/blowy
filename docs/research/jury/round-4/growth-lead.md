# Jury V5.3 · tour 4 · Growth lead (distribution et croissance)

**Verdict.** Mes trois demandes du tour 3 sont faites (un lien par carte et par personne, « Partager la soirée » en bouton principal sur Résultats, carte du dimanche rendue), plus la carte ville et la question de départ ; restent le Duo au point de décision, l'heure du rendez-vous hebdo qui change selon le document, et rien de mesuré.

**Note globale : 9/10** (tour 1 : 5/10 · tour 2 : 7/10 · tour 3 : 8/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | Hook + « Partout dès 5 personnes » en un plan. |
| Charge cognitive | 9 | 9 écrans, une question chacun ; compte après « Je viens ». |
| Envie (J+1/J+7/J+30) | 9 | Rythme hebdo, Ta rue avec un geste facultatif, Pause. |
| Vraie rencontre (2 semaines) | 8 | 11e à J+3, Lyon, Lille en solo et à 3 ; mais activité jamais demandée. |
| Sécurité et confiance | 9 | La couche confiance convertit les femmes, qui font la densité. |
| Viralité / distribution | 9 | 6 cartes, 6 liens, invitation par message seulement, dimanche rendu ; Duo encore au point de décision. |
| Argent | 8 | 1re offerte, 4,99 € postable ; Blowy+ en achat intégré. |
| Finition visuelle | 8 | Cartes de couleurs distinctes ; mer. et ven. gardent la même composition ; césures restantes. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 86 fichiers, 3549 vérifications, 0 contradiction(s) » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 86 écrans, 1207 textes, 469 cibles, 1255 blocs de texte mesurés, 0 problème(s), contraste minimum 4.53:1 ». Les 86 rendus ont été ouverts un par un. Les deux outils passent ; voici ce qu'ils ne voient pas, trouvé à la main (écrans, spec-v5 rév. 4, business-model) :

1. **Règle d'absence fausse sur V5-Fiche** : « Une absence prévenue avant les visages, ou un retrait pour ta sécurité, ne compte jamais. » C'est la règle V5.2. V5.3 B.6 et spec §1/§5 (D-043) : annuler après la confirmation (mer. 18 h), donc avant les visages (jeu. 16 h 30), **est** une absence. check-facts contrôle « annulation gratuite jusqu'à… » mais pas « absence prévenue avant les visages ».
2. **Trois horaires de composition** : V5-Sortie-complete « composition des groupes du jeu. 12 nov. (lundi 9 novembre, 21 h) » et V5-Notifs « lun. 21:00 » ; V5-Chargement « Nino compose ton groupe… quelques secondes » (composition instantanée à l'inscription) ; spec-v5 §1 « Mardi 12 h : composition de la semaine » et §9 job `outings.compose (mardi 12 h)`.
3. **Spec et écrans encore en désaccord** : « rentable dès la 2ᵉ sortie du mois » (spec §6.2) contre « Rentable à partir de 3 sorties par mois » (V5-Abonnement ; 2 × 4,99 = 9,98 € < 9,99 €, l'écran a raison) ; proposition duo « 48 h » (spec §5) contre « La proposition reste 7 jours » (V5-Duo-choix) ; `ShareLink` « slug aléatoire base36 ≥ 8 » contre `s/Hq3vT8` (6 car., casse mixte), `i/r8Tz4w` (6), `m/k7f2q` (5) ; en-tête de spec « révision 3 » alors que l'historique dit « 4 — cette révision ».
4. **Proposition de duo au-delà de « pet + initiale »** (V5-Duo, carte N.) : « 30–34 ans · il · musique live, volley · en amitié ». V5.3 A.3 et spec §5 : avant le double oui, « on ne voit que le pet et l'initiale ». check-facts ne vérifie que le prénom.
5. **Le lieu reçoit ton prénom, Confidentialité ne le dit pas** : L-Effectif liste « Alex, Tom, Léa, Malo, Sarah » (+ pets) ; V5-Confidentialite « Qui voit quoi » n'a que Ton groupe / Ta bande / Personne, et L-Effectif dit « prénoms seulement… aucune autre donnée » en affichant aussi les pets.
6. **Canal auxiliaire de la garantie** : V5-Trouvee-amis affiche « Cette semaine, sortie entre amis pour toi » quand la garantie n'est pas tenue (spec §3 : « moi seul·e, si la garantie n'a pas pu être tenue »). Son **absence** sur V5-Trouvee dit donc à Alex que des personnes compatibles « histoire » sont là. Avec « 2 femmes », c'est « au moins l'une des deux » (k = 2) au lieu de « exactement les deux » ; avec une seule personne du genre recherché (1 femme, 3 hommes, 1 non-binaire, permis par « jamais plus de 3 du même genre »), c'est exact.
7. **Activités jamais demandées** : l'onboarding ne demande plus d'activité (Pet = 1 question, Affiner « Activités · à choisir »), mais V5-Trouvee propose « Jeux de société » et V5-Amorcage-solo dit « une activité que tu as cochée ».
8. **Contrat lieu incomplet ou contradictoire** : L-Contrat « 3 € (1re sortie offerte) » ne dit rien des places Blowy+ (spec §6.5 : 3 € aussi pour `PLUS_INCLUDED`) ; « Préavis : 72 h… pour que Blowy en annule un. Dans les deux sens » (L-Creneaux) contre V5-Sortie-annulee « Pas assez de confirmations » (connu au plus tard à la veille 18 h, donc < 72 h) sans compensation lieu ; L-Effectif « Virement le lundi » contre spec §6.5/§10.2 « relevé mensuel » (`period 'YYYY-MM'`), relevé absent de l'écran ; « Signaler un participant » sans bouton ni numéro.
9. **P&L** : business-model compte une absence payée comme « revenu déjà perdu ≈ 3,84 € ». Or Blowy reverse **4,99 €** au lieu et a déjà payé ≈ 0,32 € de frais et doit ≈ 0,83 € de TVA : la place coûte ≈ −1,15 € de plus (≈ −0,28 € par sortie à 8 % d'absence, 60 % payées). Les tables à deux (« même règle de compensation », L-Creneaux) et l'astreinte 18 h–2 h « par soir » restent comptées à 0 ou par participant.
10. **Défauts de pixel restants** : césures « toi / compris » (Trouvée, Trouvée-amis), « 2 femmes, 3 / hommes » (Trouvée-lyon, Amorçage), « check- / in. » et « 4 / chiffres » (Sortie), « mer. / 21 h 30 » (Accueil, carte Ton duo), « à / décider » (Affiner) ; « 1 sur 1 / sortie où tu / es venu » sur 3 lignes (Profil, T3) ; deux interrupteurs indépendants (Oeuf, T2-T3) ; sélecteur « Autres cartes › » jamais dessiné (Story, T2-T3) ; même illustration de café pour Café des Oiseaux et Le Comptoir Gabriel (Confirmation, Checkin, RdvDuo) ; vignette du café posée comme un timbre sur le trottoir de Ta rue ; « Tom, ton pote, est prévenu » (Sortie-annulee) contre « proches » partout ; « Tu viens seul » sur Lille en solo (persona Sarah).

## Mes exigences du tour 3 : vérification point par point

- **Un lien par usage et par source** : réglé. `s/Hq3vT8` (mer.), `s/pL7c2N` (jeu.), `s/Zx9mQ4` (ven.), `s/aR5kW1` (dim.), `v/bD8nY3` (ville), `i/r8Tz4w` (invitation, message seulement), `m/k7f2q` (3 mots) ; spec `ShareLink` avec `attributedSignups`. Reste : longueur des slugs ≠ spec (≥ 8).
- **« Partager la soirée » en CTA principal après le vote** : réglé (V5-Apres-resultats, bouton orange).
- **Sortie virale pour les accords** : réglé (« Ma bande s'agrandit », sans chiffre ni pet).
- **Duo retiré des points de décision du funnel** : partiel. Trouvée ne le propose plus (« Venir avec quelqu'un que tu connais ») ; Rencontrer le garde à égalité ; Accueil-duo met la sortie en 3e.
- **Carte publique sur Attente** : réglé (« Aide Bordeaux à sortir »).
- **Question « pourquoi tu pars »** : réglé.
- **Ma condition du 10 au tour 3** (mesures du test de 8 semaines, 0,3 inscrit vérifié par sortie attribué par source, amorçage < 3 semaines, liens qui disent vrai) : liens vrais et attribution possible ; mesures toujours absentes (business-model les liste « à mesurer »).

## Lecture d'ensemble

Le tour règle la plomberie de la croissance : chaque carte a son lien, chaque lien dit vrai, et la boucle du dimanche existe. K-facteur recalculé (hypothèses identiques au T3) : venir avec quelqu'un ≈ 0,23 ; cartes mer./jeu./ven./dim. ≈ 0,12 (le CTA principal sur Résultats et la carte du dimanche ajoutent une occasion) ; ville ≈ 0,02 ; ange ≈ 0,02 ; 3 mots ≈ 0,04. Total ≈ 0,43 sur le papier, et pour la première fois mesurable par canal. Je ne monte pas à 10 sans mesure, et parce que l'heure du rendez-vous hebdo (lun. 21 h ? mar. 12 h ? instantané ?) n'est pas tranchée : c'est la notification qui porte toute la rétention.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · « DES AMITIÉS, OU PLUS. EN VRAI, CETTE SEMAINE. » + « Partout dès 5 personnes » : promesse et portée en un plan. Toujours aucune preuve sociale chiffrée ; ~220 px vides entre texte et pets. → Une ligne réelle « N sorties cette semaine à Paris 11e ».
- **V5-Ville** · 9/10 · « des sorties chaque semaine · 6 lieux partenaires » : preuve d'offre. → Ajouter le nombre de sorties de la semaine.
- **V5-Ville-bordeaux** · 9/10 · « 64 personnes vérifiées. 3 lieux partenaires » + règle des 5 : garde l'inscrit hors zone. Toujours rien sur « venir avec quelqu'un » ici (T3). → « Viens avec quelqu'un : il compte dans les 5 » dès cet écran.
- **V5-Toi** · 9/10 · Une question, rapide. → —
- **V5-Genre** · 9/10 · Une question ; 9 écrans au lieu de 8 : coût de funnel assumé (D.13). → Mesurer la chute 2/9 → 3/9.
- **V5-Pet** · 9/10 · Activités sorties de l'écran : bon pour le funnel. Toujours aucun export « mon pet ». → « Partager mon pet » (9:16) après le choix.
- **V5-Rencontrer** · 7/10 · « À deux, par écrit » et « Groupe et duo » à égalité avec « En petit groupe » à 5/9 : la voie sans invitation reste au point de décision (T3, non retenu). → Duo proposé après la 1re sortie vécue ; à défaut, mesurer le taux de « venir avec quelqu'un » par réponse.
- **V5-Intention** · 9/10 · Une question, « Personne ne le voit » rassure. → —
- **V5-Consentement** · 9/10 · « Amitié seulement » de même poids : bon pour la confiance. → Tracer le taux par bouton.
- **V5-Toi-plus** · 9/10 · Une question. CTA « Choisis une réponse » alors que c'est « une ou plusieurs cases ». → « Coche au moins une case ».
- **V5-Dispos** · 9/10 · Semaines off + trajet 30 min par défaut : réglé. → —
- **V5-Erreur-age** · 9/10 · « Nouvelle saisie dans 24 h » : ne pollue pas la base. → —
- **V5-Trouvee** · 9/10 · Lien secondaire « Venir avec quelqu'un que tu connais » : ma demande T3 réglée. Mais l'activité « Jeux de société » n'a jamais été demandée (voir outils, n° 7). → Activité par défaut annoncée (« Nino choisit l'activité, change-la dans Affiner »).
- **V5-Trouvee-amis** · 8/10 · Dit la vérité avant le choix ; secondaire « Voir un autre créneau » au lieu de « Venir avec quelqu'un ». → Même secondaire que Trouvée ; mesurer l'acceptation de cette variante.
- **V5-Trouvee-lyon** · 9/10 · Deuxième ville vivante, trajet affiché : preuve que « partout » existe. → —
- **V5-Sortie** · 9/10 · « Tom vient · + 1 place » sur une ligne : réglé. → —
- **V5-Team** · 9/10 · « Leur 1re sortie est offerte » : argument clair. → —
- **V5-Partage-invitation** · 9/10 · Lien personnel `i/r8Tz4w`, « Par message seulement, jamais en story » : réglé (ma demande n°1 T3). « Copier le lien » réouvre la porte à la Story, mais le lien ne marche qu'une fois. → —
- **V5-Invite** · 9/10 · « Ce lien t'a été envoyé par message, à toi seul : il ne marche qu'une fois » : enfin vrai. → —
- **V5-Compte** · 9/10 · Compte après « Je viens », place gardée 30 min : la bonne place dans le funnel. → Mesurer la chute Je viens → Compte.
- **V5-Verif** · 9/10 · « Ta place est gardée 30 min » : ma demande T3 réglée. → —
- **V5-Notifs** · 8/10 · « lun. 21:00 Une sortie pour toi cette semaine » ; la spec compose « mardi 12 h » (outils n° 2) : l'heure du rendez-vous hebdo, base de la rétention, n'est pas fixée. → Une seule heure de proposition dans spec, notifs et Sortie-complete.
- **V5-Sortie-inscrit** · 9/10 · Ligne « Tom vient · + 1 place » réglée. → —
- **V5-Accueil** · 9/10 · « Tom vient avec toi » discret ; « Réduire le pet ». → —
- **V5-Accueil-discret** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Accueil-duo** · 7/10 · Au format à deux, la sortie de groupe reste 3e carte, « facultatif » (T3, non réglé) : l'Accueil pousse le canal qui n'amène personne. → Sortie (avec « venir avec quelqu'un ») en tête, même au format à deux.
- **V5-Pause** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Chats** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Groupe** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Groupe-menu** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Attente** · 9/10 · Date, échéance, « Partager « Aide Bordeaux à sortir » » et « Venir avec quelqu'un » : mes deux demandes T3 réglées. → —
- **V5-Partage-ville** · 9/10 · Lien public propre `v/bD8nY3`, sans chiffre ni prénom : la boucle hors zone existe. → Pré-remplir la ville sur la page d'arrivée.
- **V5-Amorcage** · 9/10 · Toi + 2 proches + 2 Lillois, daté : le moteur d'amorçage est maquetté. → Afficher « 19 jours après ton inscription ».
- **V5-Amorcage-solo** · 8/10 · Solo maquetté (Sarah) ; « une activité que tu as cochée » alors qu'aucune activité n'est demandée (outils n° 7) ; « Tu viens seul » au masculin. → « Tu viens sans personne » ; activité expliquée.
- **V5-Sortie-complete** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Sortie-annulee** · 8/10 · Relance « Oui, le 19 » ; « Tom, ton pote » contredit « proches ». → « Tom est prévenu ».
- **V5-Affiner** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Affiner-histoire** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Eviter** · 9/10 · Explication claire, opt-in : ne freine pas l'inscription. → —
- **V5-Confirmation** · 9/10 · « Partager « cette semaine, je sors » » au pic d'attente. → —
- **V5-Partage-confirmation** · 9/10 · Slug propre `s/Hq3vT8` : ma demande n°1 T3 réglée. « Sans jour par défaut · « Demain » en option » : l'option n'est pas dessinée. → Dessiner le choix (sans jour / demain).
- **V5-Revelation** · 9/10 · « Partager « je sors ce soir », sans lieu ni heure » au bon moment (16 h 40). → —
- **V5-Partage-checkin** · 9/10 · Visuel propre (chevalet orange), slug `s/pL7c2N` : réglé. → —
- **V5-Ange** · 9/10 · Boucle d'acquisition déguisée en sécurité. → —
- **W-Ange** · 9/10 · Encart « Voir › » sous « Ce lien ne m'est pas destiné ». → Pré-remplir la ville du proche.
- **W-Ange-aide** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Checkin** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Checkin-ok** · 9/10 · « J'y suis » retiré de l'écran sous stress : réglé. → —
- **V5-Souvenir** · 9/10 · Vote principal, partage secondaire, comme décidé en E.17 ; le vrai CTA de partage est sur Résultats. → —
- **V5-Apres** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Apres-resultats** · 10/10 · « PARTAGER LA SOIRÉE » en bouton principal au pic émotionnel + « Ma bande s'agrandit › » : ma demande n°2 T3 réglée. → —
- **V5-Partage** · 9/10 · Slug `s/Zx9mQ4` ; même composition (Nino + 4 pastilles autour d'une table) que la carte du mercredi, seule la couleur change. → Un objet propre au vendredi.
- **V5-Partage-dimanche** · 9/10 · Carte du dimanche rendue, sans chiffre ni pet identifiable, slug `s/aR5kW1`. → Proposer aussi « Pas d'accord cette fois » en carte neutre (« 1 soirée, 3 nouvelles personnes »).
- **V5-Apres-aucun** · 8/10 · Relance « Voir le jeu. 19 nov. » ; aucune carte pour 0 accord : la moitié des 1res sorties n'a pas de sortie virale. → Carte « On était 5 » proposée ici aussi.
- **V5-Bande** · 9/10 · Sortie de bande au Café des Oiseaux : rétention + lieu. → —
- **V5-Rue** · 9/10 · Geste facultatif, zéro notification. → —
- **V5-Duo** · 8/10 · « Ou viens jeudi en groupe › » à côté de la limite : ma demande T3 réglée. → —
- **V5-Duo-choix** · 8/10 · « Passer à Blowy+ » propre ; « La proposition reste 7 jours » contre 48 h dans la spec. → Une seule durée.
- **V5-Lien** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Lien-debloque** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-RdvDuo** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Chat** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-RdvDuo-lea** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Oeuf** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Rupture** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Story** · 8/10 · « Autres cartes › » ouvre un sélecteur jamais dessiné (T2, T3) ; slug `m/k7f2q` à 5 caractères contre « ≥ 8 » dans la spec. → Dessiner le sélecteur ; slug ≥ 8.
- **W-Repondre** · 9/10 · Chips droites ; « Voir ma ville » qualifie la ville. → —
- **V5-Profil** · 8/10 · « Mes cartes › » existe mais ouvre un écran non dessiné. → Dessiner « Mes cartes » (6 cartes, chacune avec son lien).
- **V5-Fiche** · 9/10 · « Partager Nino » nommé : réglé. → —
- **V5-Tarifs** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Abonnement** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Paiement** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Paiement-ok** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Reglages** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Confidentialite** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Signaler** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Supprimer** · 10/10 · « Pourquoi tu pars ? · facultatif » : ma demande T3 réglée (signal de densité). → —
- **V5-Chargement** · 8/10 · « Nino compose ton groupe… quelques secondes » : composition instantanée, contraire à la composition hebdo (outils n° 2). → Dire ce qui se passe vraiment (« Nino cherche sur tes créneaux… »).
- **V5-Erreur-reseau** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Paiement-echec** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Verif-echec** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Notifs-refus** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **V5-Chats-vide** · 9/10 · Rien qui freine l'acquisition ou la rétention ici. → —
- **L-Effectif** · 9/10 · Côté lieu dessiné : la densité d'offre devient vendable. → —
- **L-Creneaux** · 9/10 · Plafond et créneaux hors coup de feu : capacité lisible pour piloter l'acquisition par créneau. → —
- **L-Contrat** · 9/10 · Contrat d'une page : on peut signer 5 lieux par quartier. → —

## Les 3 changements qui feraient le plus monter ma note

1. Trancher l'heure de composition (une seule, dans spec, Notifs, Sortie-complete, Chargement) et instrumenter l'entonnoir Welcome → 1re sortie vécue par étape (9 écrans + Compte + Selfie).
2. Sortir le Duo du point de décision : Rencontrer à deux réponses (« petit groupe » / « petit groupe + duo après ma 1re sortie »), Accueil-duo avec la sortie en tête.
3. Dessiner « Mes cartes » (6 cartes et leur lien), le sélecteur de Story, et une carte pour « Pas d'accord cette fois ».

## Je mets 10 si…

Je mets 10 si le test de 8 semaines prévu dans business-model mesure dans le 11e Welcome → 1re sortie vécue ≥ 25 % et une chute au selfie < 30 %, si chaque sortie vécue produit ≥ 0,3 inscrit vérifié attribué par slug (invitation, mer., jeu., ven., dim., ville, ange, 3 mots), si Bordeaux passe de « il manque 2 » à une sortie vécue en moins de 3 semaines, et si l'heure de la proposition hebdo est la même partout.
