# Jury V5.1 · tour 2 · Karim, gérant d'un bar à Paris 11e (partenaire potentiel)

**Verdict.** Vous avez écouté le comptoir : plus de boisson « au nom de Nino », plus de quiz, une table Blowy avec un chevalet et un code, « chacun paie ce qu'il boit », un message d'annulation qui ne m'accuse plus, et « le personnel du lieu n'intervient pas » ; mais je ne touche plus rien par place, personne ne me paie une table vide, et le contrat comme l'écran lieu sont « hors maquette » : je ne signe pas un écran que je n'ai pas vu.

**Note globale : 6/10** (tour 1 : 4/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 8 | 5 personnes, une table au nom de Blowy, un chevalet orange, un code : mon serveur comprend en 10 secondes. |
| Charge cognitive | 8 | Côté client, rien à demander au comptoir sauf « la table Blowy » ; côté staff, zéro animation. |
| Envie (J+1/J+7/J+30) | 6 | J'ai envie de tables pleines un soir creux. La démo est encore un jeudi 19 h 30 (mon coup de feu) ; Dispos montre mardi soir et dimanche brunch, bien, mais je ne vois nulle part que ce sont MES créneaux. |
| Vraie rencontre (2 semaines) | 7 | Le format groupe de 5, 2 h, table réservée, cartes de questions sur la table : ça marche chez moi. |
| Sécurité et confiance | 7 | W-Ange-alerte : « Une personne de l'équipe blowy. t'appelle sous 5 min et appelle le 17 si besoin. Le personnel du lieu n'intervient pas à ta place. » C'est ce que je voulais. Il me manque la fiche d'une page et le numéro d'astreinte, côté lieu. |
| Viralité / distribution | 7 | « Citer le lieu » sur la carte « On était 5 » + nom et photo du lieu la veille : de la visibilité pour moi. |
| Argent | 4 | Concept-v5.1 H.24 : « Le lieu partenaire ne reçoit pas de paiement par place. » Je ne paie plus de boisson, donc je ne perds rien quand ils viennent ; mais si 2 sur 5 ne viennent pas, ma table de 6 bloquée 2 h ne rapporte rien et personne ne me la paie. Et le Duo « table pour 2 réservée, rendez-vous gratuit » : réservée par qui, payée par qui ? |
| Finition visuelle | 7 | La « photo » du lieu est une illustration de café, pas ma salle ; pour une maquette ça passe, pour mon contrat non. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 75 fichiers, 786 vérifications, 0 contradiction » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 75 écrans, 1042 textes, 420 cibles, 0 problème, contraste minimum 4.53:1 ». Les deux passent. Ils ne contrôlent ni la chronologie entre écrans, ni les tranches d'âge, ni le sens des phrases dérivées : les contradictions relevées ci-dessous leur échappent.

## Mes exigences du tour 1 : vérification point par point

- **Créneaux choisis par le lieu, hors coup de feu** : partiellement. Dispos propose mar. soir, jeu. soir, sam. après-midi, dim. brunch « de Paris 11e ». Rien ne dit qui les fixe ; toute la démo reste un jeudi 19 h 30.
- **Effectif figé envoyé au lieu à J-1 18 h** : non visible. La confirmation existe côté client (mer. 18 h) ; côté lieu, « hors maquette mobile (admin) ».
- **6 € HT par place confirmée, identique quel que soit le financement, payé chaque semaine** : remplacé. Plus de paiement au lieu du tout ; en échange plus de boisson à fournir. Acceptable sur créneau creux, mais aucune compensation des absents ni des annulations tardives.
- **Boisson : code/QR, liste fermée, soft au même rang, pas de « boisson offerte »** : réglé autrement. « Consommation non incluse : chacun paie ce qu'il boit » (Sortie, Tarifs, Paiement). Plus rien à servir sur code : c'est plus simple pour moi. Loi Évin : rien à redire.
- **Quiz sur les téléphones, zéro animation pour le staff** : réglé. « Des cartes de questions sur la table, si vous voulez. Personne n'anime. »
- **Chevalet « Table Blowy » + code de check-in comme méthode principale** : partiellement. Chevalet orange au fond + code 4 chiffres : oui. Mais Check-in demande d'abord la position, le code n'arrive qu'en repli « plus de 150 m » ; rue Oberkampf, le bar d'à côté valide.
- **Annulation : message neutre, préavis 72 h** : partiellement. « Pas assez de confirmations… ce n'est la faute de personne » : réglé. Préavis 72 h : invisible (contrat hors maquette).
- **Alerte : protocole écrit, astreinte Blowy, Blowy appelle le 17, pas mon staff** : réglé côté client. Texte W-Ange-alerte et Signaler (rappel < 1 h). La fiche lieu et le numéro d'astreinte ne sont pas montrés.
- **Mon nom et ma photo dès la veille** : réglé. Révélation mer. 18 h : « Café des Oiseaux, 12 rue Oberkampf · métro Parmentier » + visuel (illustration).
- **Tête-à-tête : réservation transmise ou pas le mot « partenaire »** : à moitié. « Lieu partenaire · table pour 2 réservée » (Comptoir Gabriel, mar. 19 h, creux : bien) ; mais rien ne montre que le lieu a accepté, et c'est gratuit. Le RDV Léa est en « lieu public » : là c'est honnête.
- **Canal lieu → Blowy pour signaler un participant, motif « incident sur place »** : non traité. Signaler n'a aucun motif « ivresse, dégradation, bagarre » et le lieu n'a aucun canal.

**Ma condition du 10 au tour 1** : « j'ai devant moi un contrat d'une page et un écran lieu qui disent : mes créneaux, mon plafond de tables, l'effectif à J-1 18 h, 6 € HT minimum par place confirmée payés chaque semaine (même si la personne ne vient pas), une liste de boissons fermée servie sur code, zéro animation pour mon staff, une astreinte Blowy en cas d'alerte, 72 h de préavis dans les deux sens, et mon nom et ma photo affichés aux participants dès la veille »  
**Statut** : 3 sur 9 visibles (zéro animation, nom et photo la veille, astreinte côté client). Boisson et prix par place : le modèle a changé (je ne fournis plus rien, je ne touche rien). Contrat, écran lieu, créneaux, plafond, effectif J-1, préavis : « hors maquette ». Je révise ma condition ci-dessous.

## Lecture d'ensemble

Le nouveau deal, tel que je le lis : Blowy m'amène 5 personnes vérifiées sur un créneau que je choisis (j'espère), elles commandent à la carte au comptoir « au nom de Blowy », personne n'anime, et Blowy gère la sécurité. C'est un deal d'apporteur d'affaires, pas de privatisation : ça me va **si** la table bloquée ne me coûte rien. Sur un mardi 19 h 30 creux, 5 clients × 2 verres ≈ 60 € de chiffre : je prends. Sur un jeudi, je bloque une table de 6 qui m'aurait rapporté 80 à 100 € : je refuse, sauf garantie minimale si moins de 4 viennent.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 7/10 · Plus d'heure ni de « café » vendus en promesse : bien. « près de chez toi » : pas mon sujet. → —
- **V5-Ville** · 7/10 · « Paris 11e · ouvert » : combien de lieux derrière ? Si je suis seul, tout tombe chez moi. → Répartition et plafond par lieu (spec capacityOutings).
- **V5-Ville-fermee** · 8/10 · « Il faut aussi 3 lieux partenaires signés (2 le sont) » (sur Attente) : enfin on compte les lieux. → —
- **V5-Team-amorcage** · 6/10 · « Une sortie à 5, dans un lieu public partenaire » à Saint-Denis où 2 lieux sur 3 sont signés : quel lieu, à quel créneau ? → Lieu d'amorçage choisi parmi les signés, avec son accord.
- **V5-Rencontrer** · 7/10 · Rien qui me concerne. → —
- **V5-Intention** · 7/10 · Rien qui me concerne. → —
- **V5-Intention-rempli** · 7/10 · Rien qui me concerne. → —
- **V5-Consentement** · 8/10 · « Personne ne les voit : ni ton groupe, ni ta bande, ni le lieu » : je ne veux pas le savoir, très bien. → —
- **V5-Toi** · 7/10 · Rien qui me concerne. → —
- **V5-Toi-plus** · 7/10 · Rien qui me concerne. → —
- **V5-Craft** · 8/10 · « Tu ne dis jamais son nom à voix haute » : mon serveur vous remercie. → —
- **V5-Vie** · 7/10 · « Jeux de société, Bloc, Atelier, Expo, Balade » : je ne suis pas sur toutes les activités ; mon bar est « verre ou café ». → —
- **V5-Dispos** · 6/10 · Mardi soir, dimanche brunch : bien. Jeudi soir reste proposé et c'est l'exemple de toute la démo. → Créneaux = ceux publiés par les lieux ; montrer un mardi dans la démo.
- **V5-Eclosion** · 7/10 · Rien qui me concerne. → —
- **V5-Compte** · 8/10 · « L'âge est vérifié au selfie, avant ta 1re sortie » : je sers de l'alcool, c'est ce qu'il me faut. → —
- **V5-Compte-age** · 7/10 · Rien qui me concerne. → —
- **V5-Trouvee** · 7/10 · « un bar à jeux du 11e » : on cache mon nom jusqu'à la veille, logique. → —
- **V5-Sortie** · 7/10 · « Chacun paie ce qu'il boit », « Personne n'anime », « chevalet orange » : réglé. Mais « Tu tapes son code dans l'app, c'est ton check-in » ici, et l'écran Check-in commence par la position. → Une seule méthode : le code.
- **V5-Verif** · 8/10 · Moins d'embrouilles chez moi. → —
- **V5-Notifs** · 7/10 · Le client a la confirmation mer. 18 h ; moi je l'ai quand ? → Effectif envoyé au lieu avant 18 h (SMS ou tablette).
- **V5-Sortie-inscrit** · 7/10 · « Nom, photo et adresse du lieu : mer. 11 nov. 18 h » : bien. → —
- **V5-Team** · 7/10 · Des amis qui viennent ensemble consomment plus : bon pour moi. → —
- **V5-Accueil** · 7/10 · Rien qui me concerne. → —
- **V5-Accueil-discret** · 7/10 · Rien qui me concerne. → —
- **V5-Pause** · 7/10 · « Ta sortie reste prévue : tu peux l'annuler gratuitement jusqu'à mer. 18 h » : après 18 h, absence ; et ma table ? → —
- **V5-Chats** · 7/10 · Rien qui me concerne. → —
- **V5-Groupe** · 7/10 · Aucun message du lieu au verrouillage (« table au fond à gauche »). → Message de bienvenue du lieu à la confirmation.
- **V5-Groupe-menu** · 7/10 · Rien qui me concerne. → —
- **V5-Sortie-complete** · 8/10 · Plus de « 6 places prises » : réglé. → —
- **V5-Sortie-annulee** · 8/10 · Ancien bloquant levé : « Pas assez de confirmations… ce n'est la faute de personne ». Annulation par Blowy à J-1 : ma table est-elle payée ? → Indemnité lieu si Blowy annule < 24 h (contrat).
- **V5-Attente** · 8/10 · « Il faut aussi 3 lieux partenaires signés (2 le sont) » : réglé. → —
- **V5-Revelation** · 8/10 · « Café des Oiseaux · Table Blowy, chevalet orange au fond » : réglé ; le visuel est une illustration, je veux ma vraie photo. → Photo fournie par le lieu.
- **V5-Ange** · 7/10 · Rien qui me concerne. → —
- **W-Ange** · 7/10 · Mon adresse sur une page web : lieu public, OK. → —
- **W-Ange-alerte** · 8/10 · Ancien bloquant levé : « Le personnel du lieu n'intervient pas à ta place » et Blowy appelle le 17. → Fiche lieu d'une page + numéro d'astreinte montrés côté lieu.
- **V5-Checkin** · 6/10 · Position d'abord, code en repli : rue Oberkampf, le bar voisin valide. → Code du chevalet en méthode principale, position en confort.
- **V5-Checkin-code** · 8/10 · Code 4 chiffres + « Demande au comptoir la table Blowy » : c'est ma demande. → Code qui change à chaque sortie.
- **V5-Checkin-ok** · 8/10 · Ancien bloquant levé : « Chacun commande au comptoir, au nom de « Blowy » s'il faut un nom ». → —
- **V5-Souvenir** · 7/10 · « Jeudi 12 novembre · Café des Oiseaux » : mon nom reste. → Lien vers ma fiche (horaires).
- **V5-Partage** · 8/10 · « Citer le lieu » : ma visibilité. → Mon logo si je l'autorise.
- **V5-Apres** · 7/10 · Rien qui me concerne. → —
- **V5-Apres-resultats** · 7/10 · « Vous pourrez revenir ensemble à une sortie » : pas forcément chez moi. → « Retrouvez-vous au Café des Oiseaux ».
- **V5-Apres-aucun** · 7/10 · Rien qui me concerne. → —
- **V5-Partage-accords** · 7/10 · Rien qui me concerne. → —
- **V5-Bande** · 7/10 · « Sortie de bande » : des habitués potentiels. → Proposer le lieu de leur 1re sortie.
- **V5-Duo** · 7/10 · Rien qui me concerne. → —
- **V5-Lien** · 7/10 · « Lieu public » : honnête. → —
- **V5-Lien-debloque** · 7/10 · Rien qui me concerne. → —
- **V5-RdvDuo** · 5/10 · « Lieu partenaire · table pour 2 réservée … Rendez-vous gratuit » : qui a réservé, le lieu a-t-il accepté, et si personne ne vient ? → Afficher « confirmée par Le Comptoir Gabriel » ; sinon « lieu suggéré ».
- **V5-Chat** · 7/10 · Rien qui me concerne. → —
- **V5-RdvDuo-lea** · 8/10 · « Lieu public · billets à prendre chacun » : honnête, pas de faux partenaire. → —
- **V5-Oeuf** · 7/10 · Rien qui me concerne. → —
- **V5-Rupture** · 7/10 · Rien qui me concerne. → —
- **V5-Partage-semaine** · 7/10 · Rien qui me concerne. → —
- **V5-Partage-invitation** · 7/10 · Rien qui me concerne. → —
- **V5-Partage-ville** · 7/10 · Rien qui me concerne. → —
- **V5-Story** · 7/10 · Rien qui me concerne. → —
- **W-Repondre** · 7/10 · Rien qui me concerne. → —
- **V5-Profil** · 7/10 · Rien qui me concerne. → —
- **V5-Fiche** · 7/10 · Fiabilité : « une absence prévenue avant la confirmation ne compte jamais » : après, oui ; c'est mon intérêt aussi. → —
- **V5-Tarifs** · 5/10 · « Place de sortie 4,99 € » : rien pour le lieu, et aucune ligne ne le dit au client (qui croira que je touche une part). → Contrat lieu : garantie minimale si < 4 présents sur une table bloquée.
- **V5-Abonnement** · 6/10 · Blowy+ « toutes tes sorties » : mêmes tables chez moi, même absence de compensation. → —
- **V5-Paiement** · 7/10 · « Consommation non incluse » écrit au moment de payer : pas de malentendu au comptoir. → —
- **V5-Paiement-ok** · 7/10 · Rien qui me concerne. → —
- **V5-Reglages** · 7/10 · Rien qui me concerne. → —
- **V5-Confidentialite** · 7/10 · « ni le lieu » ne voit les préférences : bien. → —
- **V5-Signaler** · 6/10 · Aucun motif « incident dans l'établissement » (ivresse, dégradation) et aucun canal pour que MOI je signale un participant. → Motif « incident sur place » + canal lieu → équipe.
- **V5-Supprimer** · 6/10 · « Ta place du jeu. 19 nov. : remboursée » : et la table que j'ai bloquée ? → Suppression après J-1 18 h = place due au lieu ou non remboursée.
- **V5-Chargement** · 7/10 · Rien qui me concerne. → —
- **V5-Erreur-reseau** · 8/10 · « Le code du chevalet marche hors ligne » : mon sous-sol n'a pas de réseau, merci. → —
- **V5-Paiement-echec** · 7/10 · Rien qui me concerne. → —
- **V5-Verif-echec** · 7/10 · Rien qui me concerne. → —
- **V5-Notifs-refus** · 7/10 · Rien qui me concerne. → —
- **V5-Erreur-age** · 8/10 · Pas de mineurs chez moi : bien. → —
- **V5-Chats-vide** · 7/10 · Rien qui me concerne. → —

## Les 3 changements qui feraient le plus monter ma note

1. Montrer le contrat d'une page et l'écran lieu (même en maquette web) : mes créneaux, mon plafond de tables, l'effectif à J-1 avant 18 h, le préavis 72 h, le numéro d'astreinte.
2. Une garantie table bloquée : si moins de 4 présents, ou si Blowy annule à moins de 24 h, un forfait fixe (ex. 20 € HT) ; et la même règle pour les tables à deux du Duo qui disent « réservée ».
3. Code du chevalet en méthode principale de check-in, motif « incident sur place » et canal lieu → équipe dans Signaler, vraie photo du lieu dans la Révélation.

## Je mets 10 si…

Je mets 10 si j'ai devant moi un contrat d'une page et un écran lieu qui disent : mes créneaux (hors coup de feu), mon plafond de tables, l'effectif à J-1 avant 18 h, un forfait garanti quand une table bloquée a moins de 4 présents ou est annulée à moins de 24 h, zéro animation pour mon staff, un numéro d'astreinte Blowy, 72 h de préavis dans les deux sens, un canal pour signaler un participant, et ma vraie photo affichée la veille.
