# Jury V5.3 · tour 4 · Créatrice TikTok (lifestyle, 180 k abonnés)

**Verdict.** Je peux enfin tourner lundi → dimanche depuis des exports justes, sans flouter, avec un lien par carte qui n'est jamais celui d'un ami (dimanche rendu, jeudi au chevalet orange, Bordeaux en bleu), mais mercredi et vendredi ont encore la même mise en scène, « ALORS, JEUDI ? » n'a toujours pas de mode capture, et il n'y a aucun export vidéo.

**Note globale : 9/10** (tour 1 : 5/10 · tour 2 : 7/10 · tour 3 : 8/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | Hook lisible en un plan. |
| Charge cognitive | 9 | Onboarding de 9 écrans, une question chacun : filmable en accéléré. |
| Envie (J+1/J+7/J+30) | 9 | Lundi → dimanche est une série toute faite. |
| Vraie rencontre (2 semaines) | 8 | Sortie à J+3, Lille en solo : la série a une fin. |
| Sécurité et confiance | 9 | Rien à flouter sur les cartes. |
| Viralité / distribution | 9 | 6 cartes justes, liens propres, dimanche rendu ; ni vidéo ni mode capture. |
| Argent | 8 | 1re offerte, 4,99 € : je dis le prix sans gêne. |
| Finition visuelle | 8 | Couleurs distinctes ; mercredi et vendredi gardent la même composition. |

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

- **Épisode du dimanche** : réglé (V5-Partage-dimanche « MA BANDE S'AGRANDIT. », bouton principal « Partager la soirée » sur Résultats).
- **Un visuel par jour** : partiel. Jeudi (chevalet orange), dimanche (vert, pastilles en ligne), ville (bleu, épingle), invitation (beige) sont distincts ; mercredi (violet) et vendredi (rouge) gardent Nino sur la même table ovale avec les mêmes 4 pastilles.
- **Lien publié ≠ lien « réservé »** : réglé (invitation par message seulement, slugs par carte).
- **Mode capture sur « ALORS, JEUDI ? »** : non.
- **Export vidéo 6 s** : non (noté « plus tard » en E.19).
- **Carte « il manque 2 personnes »** : réglé (« Aide Bordeaux à sortir »).
- **Ma condition du 10 au tour 3** : lundi → dimanche depuis l'app, dimanche compris, sans flouter : oui ; visuel différent par jour : 5 sur 6 ; aucun chiffre faux : oui ; lien publié non réservé : oui.

## Lecture d'ensemble

Ma série tient : lundi (Trouvée), mercredi (« cette semaine, je sors »), jeudi (« je sors ce soir », chevalet), vendredi (« on était 5 »), dimanche (« ma bande s'agrandit »). C'est le premier tour où je n'ai rien à flouter ni à expliquer en commentaire. Ce qui manque pour le 10 est de l'ordre du format : un objet propre au mercredi et au vendredi (sinon, à J+5, ma série a l'air de republier la même image), un mode capture sur le vote (le plan le plus commenté sera « alors, jeudi ? »), et l'export animé que la concurrence (BeReal, Timeleft dans ses Reels) n'a pas.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · « DES AMITIÉS, OU PLUS. EN VRAI, CETTE SEMAINE. » : hook en un plan. → —
- **V5-Ville** · 8/10 · « TU SORS OÙ ? » : bon hook, rien à exporter. → —
- **V5-Ville-bordeaux** · 9/10 · « À Bordeaux aussi, on sort. » : plan « et chez vous ? ». → —
- **V5-Toi** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Genre** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Pet** · 8/10 · Les 5 pets côte à côte : plan « lequel tu prends ? » ; toujours aucun export de mon pet. → Export 9:16 « mon pet ».
- **V5-Rencontrer** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Intention** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Consentement** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Toi-plus** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Dispos** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Erreur-age** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Trouvee** · 8/10 · Mon plan du lundi ; l'icône partage ne dit pas quelle carte part (T3). → Aperçu de la carte au tap.
- **V5-Trouvee-amis** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Trouvee-lyon** · 9/10 · Lyon : je peux tourner hors Paris. → —
- **V5-Sortie** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Team** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Partage-invitation** · 9/10 · « VIENS AVEC MOI. » par message seulement : le lien que je publierais n'est plus celui « réservé » à un ami (ma condition T3). → —
- **V5-Invite** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Compte** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Verif** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Notifs** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Sortie-inscrit** · 8/10 · « Tu y vas. » : toujours pas d'animation exportable. → Micro-animation 1 s.
- **V5-Accueil** · 9/10 · « Jeudi, on joue. » dans le salon, filmable. → —
- **V5-Accueil-discret** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Accueil-duo** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Pause** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Chats** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Groupe** · 7/10 · « Ton dimanche idéal, en 3 mots ? » : super plan, mais les réponses des autres ne m'appartiennent pas (T3). → Export « mes 3 mots » seuls.
- **V5-Groupe-menu** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Attente** · 9/10 · Hook « il manque 2 personnes » + carte à partager : réglé. → —
- **V5-Partage-ville** · 9/10 · « AIDE BORDEAUX À SORTIR. » bleu, épingle : visuel propre, postable. → —
- **V5-Amorcage** · 9/10 · « Toi et 2 proches, + 2 personnes de Lille » : storytime. → —
- **V5-Amorcage-solo** · 9/10 · « Tu viens seul. Les 4 autres aussi. » : le meilleur hook solo de l'app (au féminin pour moi : « seule »). → Formulation épicène.
- **V5-Sortie-complete** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Sortie-annulee** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Affiner** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Affiner-histoire** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Eviter** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Confirmation** · 9/10 · « Partager « cette semaine, je sors » » au bon moment. → —
- **V5-Partage-confirmation** · 8/10 · Carte juste, lien propre ; même composition (Nino debout sur une table ovale, 4 pastilles jaune/bleu/rose/vert) que la carte du vendredi : seule la couleur de fond change. « Demain » en option, non dessiné. → Objet propre au mercredi (enveloppe, « lieu secret » scellé) ; dessiner l'option.
- **V5-Revelation** · 8/10 · « Partager « je sors ce soir » » depuis ici (16 h 40) : logique. Toujours pas de carte « les visages sont arrivés ». → —
- **V5-Partage-checkin** · 10/10 · « JE SORS CE SOIR. » + chevalet orange « Blowy » : visuel propre au jeudi, ma demande T3 réglée. → —
- **V5-Ange** · 8/10 · Rien à filmer, et c'est normal. → —
- **W-Ange** · 8/10 · « TU VEILLES SUR ALEX CE SOIR. » : contenu safety ; adresse à flouter. → —
- **W-Ange-aide** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Checkin** · 7/10 · Le code ne doit jamais être filmé ; pas de mode capture. → —
- **V5-Checkin-ok** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Souvenir** · 9/10 · « SORTIE VÉCUE. » monochrome, lisible en vidéo. → —
- **V5-Apres** · 6/10 · « ALORS, JEUDI ? » = meilleur plan storytime, toujours sans mode capture (3 prénoms) (T2, T3). → Mode capture : silhouettes à la place des prénoms.
- **V5-Apres-resultats** · 9/10 · « PARTAGER LA SOIRÉE » en bouton principal + « Ma bande s'agrandit › » : mon épisode du dimanche existe. → —
- **V5-Partage** · 8/10 · « ON ÉTAIT 5. » rouge-orange, juste ; même mise en scène que mercredi. → Un objet propre au vendredi (verres, table vue de haut).
- **V5-Partage-dimanche** · 10/10 · « MA BANDE S'AGRANDIT. » vert, pastilles en ligne + Nino qui saute, aucun chiffre ni pet identifiable : ma demande n°1 T3 réglée. → —
- **V5-Apres-aucun** · 7/10 · « PAS D'ACCORD CETTE FOIS. » : contenu honnête, sans carte (T3). → Carte « 0 accord, 1 soirée ».
- **V5-Bande** · 8/10 · Prénoms sous les pets. → Mode capture sans prénoms.
- **V5-Rue** · 8/10 · « TA RUE » : plan calme ; la vignette du café posée en timbre sur le trottoir fait bricolé à l'écran. → Objet dessiné.
- **V5-Duo** · 7/10 · Ressemble à toutes les apps de dating. → —
- **V5-Duo-choix** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Lien** · 7/10 · Messages privés. → —
- **V5-Lien-debloque** · 6/10 · Visage et vocal d'une autre : interdit à l'écran. → —
- **V5-RdvDuo** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Chat** · 6/10 · Messages privés. → —
- **V5-RdvDuo-lea** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Oeuf** · 7/10 · Pas exportable, et c'est voulu. → —
- **V5-Rupture** · 8/10 · Rien à filmer, et c'est normal. → —
- **V5-Story** · 8/10 · « DÉCRIS-MOI EN 3 MOTS. » postable ; « Autres cartes › » ouvre un sélecteur jamais dessiné (T3). → Dessiner le sélecteur.
- **W-Repondre** · 9/10 · Chips droites : moins joli en vidéo, plus lisible ; OK. → —
- **V5-Profil** · 8/10 · « Mes cartes › » : ma demande T3 amorcée, écran non dessiné. → Dessiner « Mes cartes ».
- **V5-Fiche** · 9/10 · « Partager Nino » : bon plan. → —
- **V5-Tarifs** · 9/10 · « Ne s'achète jamais : plus de visibilité » : montrable. → —
- **V5-Abonnement** · 8/10 · Honnête ; « duos sans limite » dur à expliquer en 10 s. → —
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
- **L-Effectif** · 8/10 · Côté lieu : « le bar qui reçoit 5 inconnus » est un vrai sujet, mais prénoms à l'écran. → —
- **L-Creneaux** · 8/10 · Rien à filmer. → —
- **L-Contrat** · 8/10 · « Aucune animation » : argument pour les bars que je tague. → —

## Les 3 changements qui feraient le plus monter ma note

1. Un objet propre au mercredi et au vendredi (enveloppe scellée « lieu secret » ; verres / table vue de haut) pour que les 6 cartes soient différentes en composition, pas seulement en couleur.
2. Mode capture sur V5-Apres et V5-Bande (silhouettes à la place des prénoms, aucune sélection visible).
3. Export vidéo 6 s (pet choisi, « Tu y vas. », chevalet du jeudi) et écran « Mes cartes » dessiné.

## Je mets 10 si…

Je mets 10 si je tourne lundi → dimanche entièrement depuis des exports de l'app, sans flouter un visage, un prénom ou un lieu, avec six cartes différentes en composition (pas seulement en couleur), un mode capture sur « ALORS, JEUDI ? », et au moins un export vidéo de quelques secondes.
