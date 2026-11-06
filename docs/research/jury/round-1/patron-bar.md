# Jury V5 · tour 1 · Karim, gérant d'un bar à Paris 11e (partenaire potentiel)

**Verdict.** Des groupes de 5 qui arrivent à l'heure, vérifiés, qui consomment et reviennent, je prends. Mais vos écrans promettent à ma place des choses que je n'ai jamais signées (une boisson « au nom de Nino », un quiz à 20 h, une équipe prévenue en cas d'alerte, des tête-à-tête « proposés » chez moi un samedi à 18 h) et personne ne me dit combien je touche, quand, ni pour qui.

**Note globale : 4/10**

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 7 | Je comprends le principe en 5 s : 5 inconnu·es, un café du quartier, un jeudi soir. |
| Charge cognitive | 7 | Côté client c'est simple ; côté comptoir, rien n'est prévu (aucun écran « staff »). |
| Envie (J+1/J+7/J+30) | 5 | J'ai envie de tables pleines un soir creux. Jeudi 19 h 30 n'est pas un soir creux rue Oberkampf. |
| Vraie rencontre (2 semaines) | 6 | Le format groupe de 5 dans un café, 2 h, avec une table réservée, c'est ce qui marche (les apéros Timeleft, les quiz) ; encore faut-il la table. |
| Sécurité et confiance | 5 | « Le lieu partenaire et l'équipe blowy. sont prévenus » (W-Ange-alerte) : mes serveurs ne sont ni formés ni payés pour ça, et rien ne dit ce qu'on attend d'eux. |
| Viralité / distribution | 5 | Mon nom sur la story « On était 5 au café » m'amène des clients ; mais l'écran Annulée écrit « Le café a dû fermer jeudi » : c'est moi qu'on accuse. |
| Argent | 3 | 12 € la place « boisson incluse » : combien pour moi ? Payé à la présence (spec : « export présences mensuel ») ou à la réservation ? Une table de 6 réservée 2 h un jeudi, c'est 80 à 100 € de chiffre normal ; 4 boissons à prix coûtant, c'est une perte. |
| Finition visuelle | 7 | Le café illustré est joli ; jamais une photo ni le nom de mon établissement avant la veille, donc aucune visibilité pour moi. |

## Lecture d'ensemble

Ce que je vois depuis le comptoir, dans l'ordre d'une soirée :

1. **Créneau.** Jeudi 19 h 30–21 h 30, c'est mon coup de feu (afterwork + dîner). Je bloque une table de 6 pour vous seulement si c'est payé à la réservation. Je signe tout de suite pour mardi ou mercredi 19 h 30 et dimanche 17 h. La spec prévoit des créneaux types par quartier (`slotTemplates` : jeu 19 h 30, sam 15 h, dim 11 h) : je veux choisir les miens.
2. **Effectif.** Les maquettes montrent tantôt 4 (Trouvée, Révélation, Check-in), tantôt 5 (Welcome, story), tantôt 6 (« Les 6 places sont prises »). Je dresse combien de couverts ? La spec dit 4 à 6, figé la veille à 18 h : envoyez-moi ce chiffre à 18 h, par SMS ou sur une tablette.
3. **Boisson.** « Ta boisson est au comptoir, au nom de Nino » : à 20 h j'ai deux groupes Blowy et quinze clients au comptoir, mon serveur ne va pas servir des ratons laveurs. Il me faut un code ou un QR à scanner, et une liste fermée (demi, verre de vin maison, soft, café) avec le soft au même rang que l'alcool. Pas de « boisson offerte » mise en avant dans vos pubs (loi Évin).
4. **Quiz.** « Le quiz de Nino démarre à 20 h » : c'est sur leur téléphone, j'espère ? Pas de son, pas de mon écran, pas de mon serveur.
5. **No-show.** Vous pénalisez l'absent par une pause d'une semaine ; moi je perds 2 couverts. Je veux être payé sur l'effectif confirmé à la veille 18 h, pas sur les présents.
6. **Alerte.** Si un client déclenche l'alerte, que fait mon équipe ? Il me faut une fiche d'une page (qui appelle qui, ce qu'on ne fait pas), un numéro Blowy qui répond pendant le créneau, et une assurance qui ne soit pas la mienne.
7. **Tête-à-tête.** RdvDuo propose « Café des Oiseaux · Sam. 15 nov. · 18 h » gratuitement : un samedi à 18 h je n'ai pas de table pour deux sans réservation. Soit vous réservez, soit vous n'écrivez pas « partenaire ».
8. **Annulation.** Si c'est moi qui annule, je veux 72 h de préavis contractuel et un message neutre (« La sortie est déplacée »), pas « Le café a dû fermer ».

Ce que je signerais : 1 à 2 tables par créneau hors coup de feu, **6 € HT par place confirmée à J-1 18 h** (boisson de la liste incluse, payée qu'ils viennent ou non), paiement hebdomadaire, deuxième consommation au prix carte, pas d'animation, fiche sécurité + numéro d'astreinte, mon nom et une vraie photo sur la fiche de sortie après verrouillage, préavis 72 h des deux côtés, aucune exclusivité. Avec 12 € la place, il vous reste 6 € moins Stripe : je ne sais pas si vous en vivez, mais c'est votre problème, pas le mien.

## Reproches du tour V4 (panel personas) : statut

- En V4 il n'y avait pas de lieu partenaire du tout (rendez-vous au niveau 6). La V5 me met au centre sans m'avoir consulté : progrès pour le produit, pas encore pour moi.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 6/10 · « jeudi 19 h 30 · un café du 11e · 5 personnes » vendu comme LA promesse : c'est mon créneau le plus plein de la semaine. → Afficher des créneaux variés (« mardi, mercredi ou dimanche ») selon les lieux partenaires.
- **V5-Invite** · 6/10 · « Ta 1re sortie est offerte, boisson comprise » : offerte par qui ? Si c'est moi qui paie la boisson, non. → Mention interne claire : la 1re place est payée au lieu par Blowy, comme les autres.
- **V5-Craft** · 7/10 · Rien qui me concerne. → —
- **V5-Vie** · 7/10 · Rien qui me concerne. → —
- **V5-Intention** · 7/10 · « Plus, si affinités » : des couples qui se forment chez moi, très bien, ça revient. → —
- **V5-Toi** · 7/10 · Rien qui me concerne. → —
- **V5-Toi-plus** · 7/10 · Rien qui me concerne. → —
- **V5-Toi-quartier** · 6/10 · « Paris 11e · ouvert » : combien de lieux partenaires derrière ? Si je suis seul, je prends toutes les sorties un jeudi. → Répartir les sorties entre lieux et me laisser plafonner (spec `capacityOutings`).
- **V5-Eclosion** · 7/10 · Rien qui me concerne. → —
- **V5-Eclosion-ne** · 7/10 · Rien qui me concerne. → —
- **V5-Compte** · 7/10 · « 18 ans minimum » : bien, je sers de l'alcool ; mais c'est déclaratif. → Âge vérifié avant la 1re sortie, sinon mon serveur doit contrôler les pièces d'identité.
- **V5-Trouvee** · 6/10 · Groupe de 4 affiché, « 5 personnes » ailleurs : je ne sais pas combien de couverts dresser. → Effectif figé envoyé au lieu à J-1 18 h.
- **V5-Sortie** · 5/10 · « Inclus : 1 boisson · le quiz de Nino » et « 2 h » : vous engagez ma carte et mon temps de table sans dire quelle boisson ni qui anime ; « Un café du 11e » sans aucune contrepartie de visibilité pour moi. → Liste de boissons fixée au contrat (soft au même rang), quiz 100 % sur téléphone et silencieux, mon nom affiché dès le verrouillage avec photo.
- **V5-Sortie-inscrit** · 6/10 · Rien pour moi ; l'inscription ne me prévient pas. → Compteur de places confirmées visible côté lieu en temps réel.
- **V5-Sortie-complete** · 5/10 · « Les 6 places sont prises » : 6 à ma table un jeudi, avec 4 affichés : quel est le vrai plafond ? → Plafond par table convenu avec moi (6 max).
- **V5-Sortie-annulee** · 3/10 · **BLOQUANT** · « Le café a dû fermer jeudi » : vous mettez la faute sur moi devant mes futurs clients, et vous les renvoyez « même café » la semaine d'après. → Message neutre (« La sortie est déplacée ») ; préavis contractuel 72 h ; si Blowy annule à moins de 24 h, la table est payée.
- **V5-Verif** · 7/10 · Selfie vérifié : moins de risques d'embrouille chez moi. → —
- **V5-Notifs** · 7/10 · « Le lieu exact de jeudi est arrivé » mercredi 18 h : il faut que je l'aie su avant eux. → Confirmation au lieu à J-1 12 h.
- **V5-Accueil** · 7/10 · Rien qui me concerne. → —
- **V5-Attente** · 6/10 · « Paris 20e pas encore ouvert » : vous ouvrez un quartier sans compter les lieux, seulement les inscrits. → Seuil d'ouverture = inscrits **et** lieux signés.
- **V5-Chats** · 7/10 · Rien qui me concerne. → —
- **V5-Groupe** · 6/10 · « Quelqu'un connaît le café ? » : bonne occasion de me présenter (2 lignes, une photo) à la veille. → Message du lieu au verrouillage : « Bienvenue au Café des Oiseaux, table au fond à gauche ».
- **V5-Revelation** · 6/10 · « Ce soir 19 h 30 : Café des Oiseaux, 12 rue Oberkampf » : 4 personnes qui me cherchent sans savoir quelle table. → « Table Blowy, chevalet orange au fond ».
- **V5-Ange** · 7/10 · Un proche connaît l'adresse : c'est rassurant pour moi aussi. → —
- **W-Ange** · 6/10 · Mon adresse et le créneau sur une page web : OK, c'est un lieu public. → —
- **W-Ange-alerte** · 3/10 · **BLOQUANT** · « Le lieu partenaire et l'équipe blowy. sont prévenus » : prévenus comment, et pour faire quoi ? Mon serveur n'est pas agent de sécurité ; s'il intervient mal, c'est ma responsabilité. → Protocole écrit d'une page signé avec moi, appel d'un humain Blowy à mon numéro, et l'équipe Blowy appelle le 17, pas mon staff.
- **V5-Checkin** · 6/10 · Check-in par position à 150 m (spec) : dans la rue Oberkampf, le bar d'à côté valide aussi. → Code à 4 chiffres sur le chevalet de ma table (spec `VENUE_CODE`) comme méthode principale.
- **V5-Checkin-ok** · 4/10 · **BLOQUANT** · « Ta boisson est au comptoir, au nom de Nino » + « Le quiz de Nino démarre à 20 h » : mon serveur doit connaître le nom de 5 animaux par groupe et lancer un quiz. Non. → QR ou code à scanner par mon serveur (liste des boissons, une seule fois par place) ; quiz sur les téléphones, sans moi.
- **V5-Souvenir** · 6/10 · « Jeudi 13 nov. · Café des Oiseaux » sur un souvenir : bien, mon nom reste. → Lien vers ma fiche (horaires, carte).
- **V5-Apres** · 7/10 · Rien qui me concerne. → —
- **V5-Apres-resultats** · 7/10 · « Vous pourrez revenir ensemble à une sortie » : bien, des habitués. → Proposer de revenir **chez moi** hors sortie (« le café de votre sortie est ouvert jusqu'à 2 h »).
- **V5-Bande** · 6/10 · La bande qui revient ensemble : clients récurrents potentiels, mais rien ne les ramène dans un lieu partenaire. → « Retrouver ta bande au Café des Oiseaux » avec une offre lieu (sans paiement Blowy).
- **V5-Chat** · 6/10 · « Revanche autour d'un vrai café ? » : le duo va ailleurs, pas forcément chez un partenaire. → Suggestion de lieux partenaires dans le raccourci rendez-vous.
- **V5-Duo** · 7/10 · Rien qui me concerne. → —
- **V5-Lien** · 6/10 · « Rendez-vous à deux · lieu public partenaire » : vous m'engagez sans réservation. → Partenaire = table réservée et confirmée par moi, sinon écrire « lieu public suggéré ».
- **V5-Lien-debloque** · 7/10 · Rien qui me concerne. → —
- **V5-RdvDuo** · 4/10 · **BLOQUANT** · « Nino et Caramel proposent Café des Oiseaux · Sam. 15 nov. · 18 h » : samedi 18 h je refuse les tables de 2 sans réservation ; gratuit pour vous, bancal pour moi. → Créneaux duo limités à mes disponibilités publiées ; réservation transmise à mon outil ; sinon pas le mot « partenaire ».
- **V5-RdvDuo-lea** · 5/10 · Mardi 18 nov. 19 h : créneau creux, parfait ; mais même problème de réservation. → Idem : réservation transmise et confirmée.
- **V5-Oeuf** · 7/10 · Rien qui me concerne. → —
- **V5-Rupture** · 7/10 · Rien qui me concerne. → —
- **V5-Story** · 6/10 · Story « Sortie » non rendue ; si elle dit « On était 5 au café », sans mon nom, je ne gagne rien. → Option « citer le lieu » (avec mon logo) après la sortie, sans visages.
- **W-Repondre** · 7/10 · Rien qui me concerne. → —
- **V5-Profil** · 7/10 · Rien qui me concerne. → —
- **V5-Fiche** · 6/10 · Souvenir « Café des Oiseaux · 13 nov. » : bien ; fiabilité : vos absents me coûtent des couverts. → Côté lieu : être payé sur les confirmés, pas sur les présents.
- **V5-Boutique** · 3/10 · **BLOQUANT** · « 1 place · boisson incluse · 12 € » : aucune ligne ne dit ce que touche le lieu ; Blowy+ à 19,99 € « 2 places » : est-ce que mes places sont payées pareil quand elles sont incluses dans l'abonnement ? → Contrat : prix fixe HT par place confirmée, identique quel que soit le financement (offerte, Blowy+, payée), payé chaque semaine.
- **V5-Reglages** · 7/10 · Rien qui me concerne. → —
- **V5-Abonnement** · 6/10 · « Places de sortie incluses 1 / 2 ce mois » : si l'abonné ne vient pas, ma table est vide. → Idem : payé sur confirmés.
- **V5-Confidentialite** · 7/10 · Rien qui me concerne. → —
- **V5-Signaler** · 5/10 · Aucun motif pour un incident dans mon établissement (bagarre, ivresse, dégradation) ; je ne peux pas non plus signaler un client Blowy. → Motifs « incident sur place » et canal lieu → Blowy pour signaler un participant.
- **V5-Supprimer** · 7/10 · « Ta place de jeudi est remboursée » : et ma table ? → Si suppression après J-1 18 h : place due au lieu.

## Les 3 changements qui feraient le plus monter ma note

1. Un contrat lieu visible dans le produit : créneaux choisis par le lieu (hors coup de feu), effectif figé envoyé à J-1 18 h, prix HT par place **confirmée** (pas présente) identique quel que soit le financement, paiement hebdomadaire, préavis 72 h et message d'annulation neutre.
2. Un mode comptoir : code ou QR par place pour servir la boisson d'une liste fermée (soft au même rang), chevalet « Table Blowy » avec code de check-in, quiz uniquement sur les téléphones.
3. Un protocole d'alerte écrit et une astreinte Blowy joignable pendant les créneaux, où c'est Blowy (pas mon serveur) qui appelle le 17 ; et des rendez-vous à deux qui passent par une vraie réservation ou n'utilisent pas le mot « partenaire ».

## Je mets 10 si…

Je mets 10 si j'ai devant moi un contrat d'une page et un écran lieu qui disent : mes créneaux, mon plafond de tables, l'effectif à J-1 18 h, 6 € HT minimum par place confirmée payés chaque semaine (même si la personne ne vient pas), une liste de boissons fermée servie sur code, zéro animation pour mon staff, une astreinte Blowy en cas d'alerte, 72 h de préavis dans les deux sens, et mon nom et ma photo affichés aux participants dès la veille.
