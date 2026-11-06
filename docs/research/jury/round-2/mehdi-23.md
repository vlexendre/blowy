# Jury V5.1 · tour 2 · Mehdi, 23 ans, Saint-Denis (93)

Profil : homme hétéro, alternant (≈ 1 000 € par mois), budget très serré, sceptique. J'ai rouvert les 75 rendus de `design/v5/renders/`, lu `concept-v5.1.md` et mon rapport du tour 1. Je me mets à Saint-Denis, avec mon pote Yacine.

**Verdict.** Ils ont écouté : la ville arrive en premier, Saint-Denis est annoncé honnêtement avec une date, la place passe à 4,99 € et Blowy+ revient à 2,50 € la sortie ; mais la seule sortie concrète reste à 25 min dans le 11e, la sortie d'amorçage n'a ni date ni lieu, et les cartes à partager affichent encore des chiffres faux.

**Note globale : 6/10** (tour 1 : voir `round-1/mehdi-23.md`)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension | 8 | « Des ami·es ou plus. En vrai, cette semaine. » + « Ouvert : Paris 11e, Lyon 4e. Ailleurs : une date d'ouverture » : je sais en 5 s que ce n'est pas encore chez moi, et c'est dit franchement. Reste « près de chez toi » dans le sous-titre. |
| Charge cognitive | 8 | Une question par écran, bouton grisé qui dit quoi faire, 8 étapes numérotées. Le vocabulaire (team, bande, duo, souvenir) est enfin stable. |
| Envie (J+1/J+7/J+30) | 6 | J+1 : oui. J+7 : `V5-Attente` me donne 3 choses à faire au lieu d'un bouton « Inviter ». J+30 : dépend de la sortie d'amorçage, qui n'a pas de date. |
| Vraie rencontre en 2 semaines | 5 | En 2 semaines : possible à Paris 11e (25 min, au-delà des 20 min que je peux cocher), ou via la team si on trouve un 3e et s'il existe une autre team, sans date ni lieu annoncés. Pas garanti. |
| Sécurité et confiance | 8 | Selfie 18+, visages la veille, fiabilité privée, « Je connais quelqu'un ici », alerte séparée du faux appel : sérieux. Petit accroc : « Bloquer aussi » est pré-coché dans `V5-Signaler`. |
| Viralité / distribution | 7 | La carte « Aide-nous à ouvrir Saint-Denis » et l'invitation de team, je les poste sur Snap. Mais les cartes « 4 inconnu·es » sont fausses (Tom est ma team), et ça se verra. |
| Argent | 8 | 4,99 € la place, conso non incluse, 1re offerte, aucune carte demandée ; Blowy+ 9,99 € pour 4 jeudis = 2,50 € la sortie. C'est honnête et c'est dans mon budget. Je retire 2 points : le RdvDuo propose une expo payante et la limite du Duo gratuit n'est pas écrite. |
| Finition visuelle | 7 | Propre, contrastes OK. Défauts : footer de `V5-Apres` collé sous le bouton, « SORTIE » en dégradé olive pâle dans `V5-Souvenir`, label technique « 1,5 s · touche pour passer » visible. |

## Mes reproches du tour 1, point par point

| Reproche du tour 1 | Statut |
|---|---|
| BLOQUANT `V5-Toi-quartier` : ville demandée à l'étape 4/5 | **Réglé** : `V5-Ville` est l'étape 1/8, `V5-Ville-fermee` répond avant toute création de pet. |
| BLOQUANT `V5-Attente` : jauge sans date, seul bouton « Inviter » | **Réglé** : « ouvre vers mars 2027 », 87 / 120, Paris 11e à 25 min, team 2/3, voie Duo. |
| BLOQUANT `V5-Boutique` : 12 €, 48 € par mois | **Réglé** : 4,99 €, Blowy+ 9,99 € (`V5-Tarifs`, `V5-Abonnement`). |
| « près de toi » contredit « jamais ta position » | **Partiel** : retiré de Ville, mais « près de chez toi » reste sur `V5-Welcome` et `W-Ange`. |
| Chiffres incohérents (4/5/6 personnes, souvenirs, abonnement) | **Partiel** : Chats, Bande, Profil, Abonnement sont justes ; `V5-Partage` et `V5-Partage-semaine` disent « 4 inconnu·es » alors que Tom est ma team (3 inconnu·es). |
| Clichés bobo (Polytechnique, brunch) | **Partiel** : écoles supprimées, « Foot » ajouté ; mais `V5-Trouvee` affiche encore « dimanche brunch · musique live ». |
| « en route » / quiz au check-in | **Réglé** pour les mots ; mais Malo sans coche dans `V5-Checkin-ok` montre toujours qui manque. |
| Fiabilité visible par le groupe | **Réglé** (`V5-Fiche`). |
| Rupture qui parle du pet, ngl, App Store, bouton W-Repondre illisible, 0 accord | **Réglés**. |
| Ma carte « Toi » dans la Révélation | **Non traité** : je ne vois toujours pas ce que les autres voient de moi. |
| Métro/trajet du lieu | **Réglé** à la confirmation (« métro Parmentier (ligne 3) »). |

Condition du 10 au tour 1 : sortie à moins de 20 min de Saint-Denis en 2 semaines, avec mon pote en +1, ≤ 5 € après la 1re, chiffres identiques partout. **Prix : oui. +1 : oui** (`V5-Team`, leur 1re offerte). **Moins de 20 min en 2 semaines : non** (Paris 11e = 25 min ; amorçage sans date ni lieu). **Chiffres partout : non** (« 4 inconnu·es », « TOM » sur une carte « sans prénoms »).

## Écran par écran

Note /10 · ce qui empêche le 10 → correction attendue.

- **V5-Welcome** — 8/10. « Ton pet te trouve une sortie à 5 près de chez toi » : faux pour moi, et c'est le mot que je reprochais. Le pied de page, lui, est honnête. → « une sortie à 5 dans ta ville » ; garder le pied de page.
- **V5-Ville** — 8/10. Je peux cocher « Trajet maximum 20 min », mais rien ne me dit qu'aucune ville ouverte n'est à 20 min de Saint-Denis. → Afficher sous le choix le trajet réel vers la ville ouverte la plus proche.
- **V5-Ville-fermee** — 8/10. « 87 / 120 · mars 2027 » : enfin franc. Mais « Je peux venir à Paris 11e · 25 min » est proposé même si j'ai coché 20 min, et la carte team ne donne ni délai ni lieu. → Respecter mon trajet max ; écrire « team complète : sortie sous 2 semaines, dans un des 2 lieux signés ».
- **V5-Team-amorcage** — 7/10. « Une sortie à 5 » : ma team de 3 + une autre team de 3 = 6. Pas de date, pas de lieu (2 lieux sur 3 signés d'après `V5-Attente`). « vérifié·e » sous Toi, « vérifié » sous Yacine. → Dire comment on tombe à 5 (team de 2 + 3), donner une date cible et le nom des lieux signés.
- **V5-Rencontrer** — 9/10. Clair, rien de coché.
- **V5-Intention** — 8/10. « Nouveaux potes · Une bande dans ton quartier » : mon quartier n'est pas ouvert (déjà dit au tour 1). → Texte selon la ville choisie : « une bande dans ta ville ».
- **V5-Intention-rempli** — 8/10. Les sous-choix sont clairs. Mais ils sont posés à l'étape 3, avant l'écran de consentement de l'étape 4 qui les appelle « les questions suivantes ». → Mettre le consentement avant cet écran.
- **V5-Consentement** — 7/10. Il annonce « une histoire sérieuse ou non » comme une question à venir, alors que j'y ai déjà répondu. Ça fait formulaire bâclé. → Le placer juste avant `V5-Intention`.
- **V5-Toi** — 9/10. La pastille « prénom seul » touche presque les bords de sa case (≈ 4 px). → Réduire le texte ou passer sur 2 rangées.
- **V5-Toi-plus** — 9/10. Rien à redire : « tout le monde voit les mêmes 3 boutons ».
- **V5-Craft** — 9/10. Une seule décision, « Tous gratuits » : bien.
- **V5-Vie** — 8/10. « Foot » est dans la 3e question, merci. La 1re (activités) n'a ni foot/five, ni ciné, ni « match au bar » ; l'en-tête dit encore « Ta vision ». → Ajouter « Foot / five » et « Ciné » aux activités ; renommer « Tes goûts ».
- **V5-Dispos** — 8/10. Créneaux corrects, mais ni vendredi soir ni samedi soir, qui sont mes soirs libres en alternance. → Ajouter vendredi ou samedi soir là où des lieux les acceptent.
- **V5-Eclosion** — 8/10. « 1,5 s · touche pour passer » en haut à droite : un libellé de dev visible par l'utilisateur. → Garder seulement « Passer ».
- **V5-Compte** — 9/10. Propre, « âge vérifié au selfie ».
- **V5-Compte-age** — 9/10. Tranche et âge du groupe : ce que je demandais.
- **V5-Trouvee** — 8/10. Composition anonyme, horaires, activité : bien. « En commun : dimanche brunch · musique live » : encore le même cliché. → Points communs tirés de mes réponses (foot, jeux).
- **V5-Sortie** — 8/10. « Ensuite 4,99 € la place… Aucune carte demandée aujourd'hui » : parfait. Le temps de trajet depuis chez moi n'apparaît qu'à la confirmation. → Ajouter « ≈ 25 min depuis Saint-Denis » dès cet écran.
- **V5-Verif** — 9/10. Titre réglé, « 1 minimum, 3 maximum » réglé.
- **V5-Notifs** — 9/10. 1 proposition par semaine, jamais après 23 h.
- **V5-Sortie-inscrit** — 9/10. Agenda sans le mot blowy, annulation gratuite rappelée.
- **V5-Team** — 8/10. Mon pote vient, sa 1re est offerte : c'est le levier qui me fait venir. « vérifié » sans écriture inclusive alors que le reste l'est. → Accord homogène.
- **V5-Accueil** — 8/10. Lisible, Pause en 1 tap. « Tes duos · Jade » apparaît avant ma 1re sortie sans que j'aie ouvert de duo. → Dans l'état « 1re semaine », tuile Duo vide avec « Ouvrir la voie Duo ».
- **V5-Accueil-discret** — 8/10. Utile, mais pas mon besoin.
- **V5-Pause** — 9/10. Rien n'est perdu, annulation gratuite rappelée.
- **V5-Chats** — 9/10. « Jeudi · 4 + toi » est enfin juste (L., M., S., Tom).
- **V5-Chats-vide** — 9/10. Dit quoi faire.
- **V5-Groupe** — 8/10. « foot frites potes » : on parle ma langue. « Code Names » s'écrit « Codenames ». → Corriger le nom du jeu.
- **V5-Groupe-menu** — 9/10. Signaler, Bloquer, Quitter, sans pénalité pour la sécurité.
- **V5-Sortie-complete** — 9/10. Réglé : je ne suis plus dans le groupe affiché, la raison est exacte.
- **V5-Sortie-annulee** — 9/10. Réglé : « Ta 1re sortie reste offerte », plus d'échéance périmée.
- **V5-Attente** — 8/10. Mon ancien bloquant est levé. Mais « 25 min » dépasse mes 20 min et « Ta team · 2 / 3 » ne dit pas quand la sortie aurait lieu. → Afficher une date cible pour la sortie d'amorçage.
- **V5-Revelation** — 8/10. Métro, adresse, tranches d'âge : bien. Je ne vois toujours pas ma propre carte telle que les autres la voient (demandé au tour 1). → Ajouter « Toi · 26–30 ans » dans la grille.
- **V5-Ange** — 9/10. Clair, facultatif, retirable.
- **W-Ange** — 7/10. L'encart dit toujours « une sortie à 5 près de chez toi » au proche, même s'il habite une ville fermée (reproche du tour 1). → « Paris 11e, Lyon 4e ; ta ville ? voir la date d'ouverture ».
- **W-Ange-alerte** — 9/10. Sérieux, texte à lire au 17.
- **V5-Checkin** — 9/10. Un bouton, position une seule fois.
- **V5-Checkin-code** — 9/10. Repli code : utile quand le GPS délire.
- **V5-Checkin-ok** — 7/10. Malo n'a pas de coche : tout le monde voit qui est en retard, même sans « en route ». « Je pars, mal à l'aise · remboursé·e » sur une sortie offerte. → Afficher seulement « 4 sur 5 arrivés » sans dire qui ; « sans effet » pour une sortie offerte.
- **V5-Souvenir** — 8/10. « SORTIE » en dégradé olive pâle, peu lisible à côté de « VÉCUE ». → Titre en encre unie.
- **V5-Partage** — 6/10. « avec 4 inconnu·es » : faux, Tom est ma team, donc 3 inconnu·es. C'est le genre d'erreur qui me faisait douter au tour 1. → Calculer « inconnu·es » = groupe − toi − ta team.
- **V5-Apres** — 8/10. Vote sur un écran, « non » par défaut : clair. Le texte « Modifiable, résultats le dim. 15 nov. 21 h 30. » est collé sous le bouton, rogné par son ombre. → Marge de 12 pt sous le bouton.
- **V5-Apres-resultats** — 9/10. Je ne vois que mes accords.
- **V5-Apres-aucun** — 9/10. Ton neutre, « nouveau groupe ».
- **V5-Partage-accords** — 8/10. Pets seulement, ok.
- **V5-Bande** — 9/10. Réglé : 2 dans ta bande, un pet par personne.
- **V5-Duo** — 8/10. « Gratuit » écrit, plus de %. Mais « 3 duos à la fois au plus » ici et « La voie Duo sans limite » dans Blowy+ : le gratuit, c'est limité à quoi exactement ? → Écrire la limite gratuite (3 duos en même temps) et ce que Blowy+ change.
- **V5-Lien** — 8/10. « Un rendez-vous… avant le mer. 18 nov. » : encore un délai. → « quand vous voulez, dans les 2 semaines » ou pas de date.
- **V5-Lien-debloque** — 9/10. Vocal facultatif, dit clairement.
- **V5-RdvDuo** — 8/10. Lieu partenaire dans le 11e, « chacun sa boisson » : ok. Toujours Oberkampf pour un mec du 93. → Proposer un lieu à mi-chemin selon les deux quartiers.
- **V5-RdvDuo-lea** — 6/10. « Expo Atelier des Lumières · billets à prendre chacun » : une entrée payante (de l’ordre de 17 €), l'appli me propose un rendez-vous plus cher que 3 sorties. → Proposer d'abord un lieu gratuit (parc, expo gratuite) et afficher le prix du billet.
- **V5-Chat** — 8/10. Signaler visible, souffleur utile. « Code Names ». → Corriger.
- **V5-Oeuf** — 9/10. Désactivé par défaut, « Ne jamais me le proposer ».
- **V5-Rupture** — 9/10. Réglé : messages pour une personne.
- **V5-Partage-semaine** — 6/10. « JEUDI, JE SORS AVEC 4 INCONNU·ES » : faux (Tom), en très gros, sur la carte que je posterais. → « avec 3 inconnu·es et mon pote ».
- **V5-Partage-invitation** — 7/10. « VIENS JEUDI AVEC MOI ET TOM. » alors que la pastille « Sans visages ni prénoms » est active. → Retirer le prénom quand l'option est active, ou ne pas afficher l'option ici.
- **V5-Partage-ville** — 8/10. Celle-là je la poste. « Une team de 3, et on sort avant » : avant quand ? → Ajouter une date cible.
- **V5-Story** — 8/10. ngl retiré, désactivable.
- **W-Repondre** — 9/10. Bouton désactivé lisible.
- **V5-Profil** — 9/10. Chiffres justes, « venu·e ».
- **V5-Fiche** — 9/10. Fiabilité privée, souvenirs gagnés.
- **V5-Tarifs** — 9/10. Tout est dit, y compris « les places incluses ne se reportent pas ».
- **V5-Abonnement** — 9/10. Statut « Gratuit » cohérent, résiliation App Store.
- **V5-Paiement** — 9/10. Apple Pay, 4,99 €, conso non incluse.
- **V5-Paiement-ok** — 9/10. Reçu, remboursement auto.
- **V5-Paiement-echec** — 9/10. « Rien n'a été débité », place gardée 30 min.
- **V5-Reglages** — 9/10. Quartiers, créneaux, âge : tout est là. « Aide · réponse sous 24 h » à côté du « moins d'1 h » de Signaler : deux délais. → Préciser « 24 h hors soirs de sortie ».
- **V5-Confidentialite** — 8/10. « Voie Duo » rangée dans « Réglages protecteurs, activés par défaut » : ce n'est pas un réglage de protection. → La déplacer dans Mes sorties > Format.
- **V5-Signaler** — 8/10. « Bloquer aussi » est coché d'avance, alors que le README promet « rien de présélectionné ». → Décoché par défaut, ou l'assumer dans le README.
- **V5-Supprimer** — 9/10. Réglé : App Store, chiffres justes, boutons de même poids.
- **V5-Chargement** — 9/10. « Rien à faire » : clair.
- **V5-Erreur-reseau** — 9/10. Code du chevalet hors ligne : utile.
- **V5-Verif-echec** — 9/10. Conseils concrets.
- **V5-Notifs-refus** — 9/10. Pas culpabilisant.
- **V5-Erreur-age** — 8/10. « tu peux la corriger » : un mineur comprend qu'il suffit de changer l'année. → « Si tu t'es trompé·e » + rappel que le selfie bloquera de toute façon.

Bloquants restants : 0.

## Les 3 changements qui feraient monter ma note le plus

1. Donner une date et un lieu à la sortie d'amorçage de Saint-Denis (« team complète → sortie sous 2 semaines au lieu X ou Y ») et respecter le trajet max coché : aujourd'hui ma seule sortie concrète est à 25 min.
2. Corriger les chiffres des cartes à partager : « 4 inconnu·es » → 3 quand on vient en team, et pas de prénom « TOM » sur une carte « sans prénoms ».
3. Des propositions qui ne coûtent rien de plus : RdvDuo d'abord dans un lieu gratuit, limite du Duo gratuit écrite, « près de chez toi » remplacé par la ville.

## Je mets 10 si…

Je mets 10 si, depuis Saint-Denis, l'appli me donne dans les 2 semaines une sortie datée dans un lieu nommé à 20 min maximum (sortie d'amorçage dès que ma team a 3 vérifiés, ou ville ouverte), avec Yacine, pour 4,99 € maximum après la 1re, et si aucune carte ni aucun écran ne contredit plus le groupe réel (3 inconnu·es + mon pote, pas de prénom sur une carte « sans prénoms »).

## Sources

- Atelier des Lumières, expo à billet payant (de l’ordre de 17 € plein tarif) : https://www.offi.fr/expositions-musees/atelier-des-lumieres-6668.html et https://parisjetaime.com/billets/musees-et-monuments/atelier-des-lumieres-m9000668
- Timeleft (comparaison prix, tour 1) : https://lepetitjournal.com/valence/a-voir-a-faire/jai-teste-timeleft-diner-inconnus-valencia-383532
