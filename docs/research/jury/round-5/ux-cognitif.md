# Jury tour 5 — ux-cognitif (Chercheuse en UX cognitive)

**Verdict** : Les règles n'ont plus qu'une version à l'écran (annulation, heure, carte de duo, durée) et la plupart de mes défauts T4 sont soldés ; restent un lien hors cadre, une plage coupée, des réglages présents à deux endroits, trois listes « qui voit quoi » différentes et une spec qui contredit les écrans.

**Note globale : 9/10** (T1 5 · T2 7 · T3 8 · T4 8 · T5 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 8 |
| Vraie rencontre | 8 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 9 |
| Finition visuelle | 8 |

## Suivi de mes reproches du tour 4

- **Une règle d'absence (Fiche)** : fait : texte canonique sur Sortie, Confirmation, Fiche, Tarifs, Sortie-lyon.
- **Une heure de proposition** : fait à l'écran ; **pas fait** dans spec-v5 (« Mardi 12 h »).
- **Carte de duo = pet + initiale** : fait.
- **Défauts T4 (césures, « 1 sur 1 », interrupteurs de l'œuf, sélecteur de Story, Toi-plus, Dispos, Chargement, Affiner)** : faits.
- **Test 5 secondes sur 5 personnes** : **pas fait** (rien dans le dépôt).
- **Nouveaux défauts que les outils ne voient pas** : V5-Confirmation (lien sous le cadre), V5-Toi (« 26– / 29 ans »), V5-Chargement (« là. » orphelin), apostrophes droites mêlées aux courbes (« J'ai déjà un compte », « c'est toi qui choisis », « Bloc d'escalade »).

## Contrôles

`node design/v5/check-facts.mjs` : 88 fichiers, 4 958 vérifications, 0 contradiction. `a11y-audit.mjs` : 88 écrans, 0 problème, contraste min 4,53:1. Ce qu'ils ne voient pas, vérifié à la main et par `scratchpad/jury-r5-experts/overflow.mjs` (texte hors de l'artboard, plages « nn–nn ans » / heures coupées) : **V5-Confirmation** a son lien « Partager « cette semaine, je sors » » rendu sous le cadre (bas 868 px > 844) et **V5-Toi** coupe « 26– / 29 ans ». check-facts ne compare pas les écrans à `spec-v5.md`, qui est resté en V5.3 (« alignée sur … concept-v5.3 », « Mardi 12 h », Blowy+ « achat intégré via RevenueCat », « 1 duo actif », bandeau « sortie entre amis pour toi » au §3 et au §12 n° 8).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | « J'ai déjà un compte » en apostrophe droite, « Commencer » juste au-dessus en typographie courbe ailleurs. | ’ partout ; règle dans check-facts. |
| V5-Ville | 9 | « c'est toi qui choisis » : apostrophe droite. | ’. |
| V5-Ville-bordeaux | 9 | Même apostrophe droite ; « on te dit, après tes créneaux » : clair. | ’. |
| V5-Toi | 8 | « (« 26– / 29 ans ») » coupé à la ligne (relevé par mon script, pas par a11y-audit). | Insécable autour du tiret de plage ; ajouter « nn–nn » à l'audit. |
| V5-Genre | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Pet | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Rencontrer | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Intention | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Consentement | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Toi-plus | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Dispos | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Eviter | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Erreur-age | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Trouvee | 9 | Répond à « que se passe-t-il jeudi ? ». « ≈ 8 min / depuis Paris 11e » sur deux lignes, acceptable. | — |
| V5-Trouvee-lyon | 8 | Gabarit différent de la Trouvée Paris (pas de raton, pas d'« Activité choisie… », pas de partage, ordre des blocs) : on réapprend l'écran. | Un gabarit unique. |
| V5-Sortie-lyon | 8 | Tableau sec sans groupe ni « Comment ça se passe » : deux écrans « Ta sortie » différents selon la ville. | Même écran que V5-Sortie. |
| V5-Confirmation-lyon | 8 | Pas de pets nommés, pas de « Je connais quelqu'un ici », pas de métro ; « Le Mêlée Café » pour « Foot à 5 · un five de la Croix-Rousse ». | Même gabarit que la Confirmation Paris ; lieu cohérent avec l'activité. |
| V5-Trouvee-banlieue | 8 | Même écart de gabarit ; titre « Une sortie à 17 min de chez toi » sans « Nino t'a trouvé ». | Un gabarit unique. |
| V5-Sortie | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Team | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Partage-invitation | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Invite | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Compte | 8 | Le bouton principal est gelé sur « DISCRET OU NORMAL ? », mais « Avec mon numéro de téléphone » reste actif sans choix ; et le même choix revient en interrupteur sur Notifs. | Même garde sur les deux sorties ; un seul endroit pour ce choix. |
| V5-Verif | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Notifs | 8 | « Mode discret : désactivé / activé, ce serait « Rappel »… » : 2e décision sur le même sujet un écran après Compte, libellé en deux états. | Retirer l'interrupteur ; rappeler le choix en une ligne avec « modifier dans Confidentialité ». |
| V5-Sortie-inscrit | 9 | « voir la / règle » coupé ; sinon modèle. | Insécable. |
| V5-Accueil | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Accueil-discret | 9 | Explication toujours dépliée (T3, T4). | Repliable après la 1re vue. |
| V5-Accueil-duo | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Pause | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Chats | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Groupe | 9 | « sauf entre accords mutuels » dans un chat de groupe : quand, et entre qui ? | « … levé seulement dans un chat à deux, après vos deux oui ». |
| V5-Groupe-menu | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Attente | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Partage-ville | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Amorcage | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Amorcage-solo | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Sortie-complete | 8 | « Ta réponse est arrivée après la composition (lundi 21 h) » : on ne peut pas répondre avant de recevoir la proposition, qui arrive à 21 h. | Dire ce qui était en retard (« Tes créneaux sont arrivés après… »). |
| V5-Sortie-annulee | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Affiner | 8 | « Semaines sans moi » et « Trajet maximum » ici, dans Réglages et dans Créneaux ; « Éviter » ici et dans Confidentialité : un réglage, trois adresses. | Affiner = questions de rencontre seulement ; le reste dans Réglages. |
| V5-Affiner-histoire | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Confirmation | 7 | Lien « Partager « cette semaine, je sors » » rendu sous le cadre (868 > 844 px), bouton collé au bas. « Annulation gratuite jusqu'à mer. 11 nov. 18 h » affiché à… mer. 18 h : information morte. | « Annuler maintenant compte comme une absence, sauf… » ; ajouter « Imprévu » ; lien dans le cadre. |
| V5-Partage-confirmation | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Revelation | 9 | « Imprévu » ici seulement : entre mer. 18 h et jeu. 16 h 30, aucune entrée. | Même ligne sur la Confirmation. |
| V5-Partage-checkin | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Ange | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| W-Ange | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| W-Ange-aide | 8 | « son personnel n'intervient pas à ta place » adressé à l'ange : à la place de qui ? | « … à la place de l'équipe blowy. ». |
| V5-Checkin | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Checkin-ok | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Souvenir | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Apres | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Apres-resultats | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Partage | 8 | « 5 verres, 1 table » écrit dans le dessin : le dessin a besoin d'une légende. | Dessin lisible sans texte. |
| V5-Partage-dimanche | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Apres-aucun | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Bande | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Rue | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Duo | 9 | Carte réglée. « Dire oui » à une proposition dont on ne sait pas si c'est en amitié ou pour une histoire. | Rappeler « selon ce que tu cherches » (son propre choix, sans rien dire de N.). |
| V5-Lien | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Lien-debloque | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-RdvDuo | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Chat | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-RdvDuo-lea | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Oeuf | 9 | Interrupteurs liés (T2→T4 réglé). | — |
| V5-Rupture | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Cartes | 8 | « Cette semaine, je sors · mercredi » alors que la Trouvée la propose lundi ; pastilles de couleur sans aperçu. | Vignettes et date juste. |
| V5-Story | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| W-Repondre | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Profil | 8 | « il » deux fois (ligne d'identité et « Pronom « il » · modifier ») ; « Ton groupe voit : prénom, pronom, tranche d'âge, et ton visage » oublie le pet que Pet (4/9) annonce. | Une seule mention du pronom ; une seule liste « qui voit quoi ». |
| V5-Fiche | 9 | Règle juste ; paragraphe de 7 lignes. | Règle repliée derrière « voir la règle ». |
| V5-Tarifs | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Abonnement | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Paiement | 9 | « Bloc d'escalade » : apostrophe droite (aussi Sortie-annulee, Sortie-complete, Trouvee-banlieue). | ’. |
| V5-Paiement-ok | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Reglages | 8 | Doublons avec Affiner ; « Semaines sans / moi » coupé face à une valeur sur deux lignes. | Libellé « Semaines off » ou valeur courte. |
| V5-Confidentialite | 8 | Ligne « Ton groupe » sans pet ni nombre f/h (Genre et Pet les annoncent) : 3e version de la liste. « Position : jamais demandée » contre Check-in « Plutôt vérifier ma position une fois ». | Liste unique reprise partout ; « Position : une fois au check-in si tu le choisis, jamais gardée ». |
| V5-Signaler | 8 | Motif « Ne ressemble pas à son selfie » : le selfie n'est montré à personne (Verif). | « Ne ressemble pas à ses photos ». |
| V5-Supprimer | 8 | « Ta bande (2) et ton duo » : Alex a deux duos (J., Léa). | « Tes duos (2) ». |
| V5-Chargement | 8 | « Rien à faire d'ici / là. » : « là. » orphelin. | Insécable « d'ici là ». |
| V5-Erreur-reseau | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Paiement-echec | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Verif-echec | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Notifs-refus | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| V5-Chats-vide | 9 | « Voir ma proposition » alors qu'il n'y en a peut-être pas encore (Chargement : lundi 21 h). | « Voir quand arrive ma proposition ». |
| L-Effectif | 9 | Hiérarchie claire, bouton Signaler. | — |
| L-Creneaux | 9 | Une action, vocabulaire du glossaire, rien à mémoriser. | — |
| L-Contrat | 9 | Six articles lisibles en 30 s. | — |

## Les 3 changements qui feraient monter ma note le plus

1. Une seule source pour chaque règle hors écrans aussi : spec-v5 en V5.4 (heure, duos, Blowy+, bandeau retiré) et une liste unique « qui voit quoi » reprise sur Pet, Genre, Profil et Confidentialité (pet, nombre f/h, position au check-in).
2. Solder les défauts que les outils ne voient pas (Confirmation hors cadre, « 26–29 » coupé, « là. » orphelin, apostrophes droites, « il » ×2, gabarits Lyon/Saint-Denis, Sortie-complete) et ajouter à a11y-audit le contrôle « texte hors artboard » et « plage coupée » (`scratchpad/jury-r5-experts/overflow.mjs` le fait en une minute).
3. Un réglage = un endroit (Affiner ≠ Réglages, discret choisi une fois), puis faire enfin le test 5 secondes sur 5 personnes.

## Je mets 10 si…

Je mets 10 si aucune règle n'a deux versions entre écrans et spec (heure, duos, position, « qui voit quoi »), si chaque réglage n'a qu'une adresse, si les défauts listés ici sont à zéro sur les 88 rendus et si les outils détectent désormais texte hors cadre et plages coupées, et si un test 5 secondes sur 5 personnes répond juste à « que se passe-t-il jeudi ? » sur Trouvée, Sortie et Accueil.
