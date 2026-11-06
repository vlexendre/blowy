# Concept V5.1 — décisions après le jury tour 1 (2026-11-06)

Jury tour 1 (15 membres) : moyenne 4,5/10, minimum 3. Synthèse : `docs/research/jury/round-1/_synthese.md`. Ces décisions **amendent** `concept-v5.md` et `spec-v5.md` ; en cas de conflit, ce document gagne. Objectif tour 2 : aucun bloquant, minimum ≥ 7, puis on itère vers 9–10.

## A. Confidentialité du vote (bloquant pour 8 membres)
1. Après la sortie, **Ami·e / Plus / Non sont toujours affichés pour tout le monde**. La compatibilité (genres recherchés, âges) est appliquée en silence au dépouillement : un « plus » incompatible devient « ami·e » sans que personne ne le sache.
2. **« Plus » vaut au moins « ami·e »** : résultat = min des deux votes (plus+plus → duo ; plus+ami → ami·es ; non → rien). Écrit sous les boutons : « Si l'autre dit ami·e, vous restez ami·es. »
3. Le vote se fait **sur un seul écran** : la liste des personnes présentes, une ligne par prénom avec 3 pastilles (ami·e / plus / non), « non » par défaut si on ne touche rien. Pas de défilement carte par carte.
4. Jamais « tout le monde a voté », jamais de compteur de votes. Chacun ne voit que **ses propres** accords, à la clôture (date fixe).

## B. Ville et quartier d'abord, et une vraie offre partout (bloquant pour 6 membres)
5. **1er écran après Welcome : « Tu sors où ? »** (ville + quartier, saisie libre avec suggestions ; jamais de géolocalisation ; jamais « près de toi »).
6. Ville ouverte → parcours normal. Ville/quartier fermé → écran honnête qui affiche la **progression réelle (ex. « 87 / 120 personnes vérifiées ») et une date estimée**, une inscription en 1 tap, et l'offre d'amorçage ci-dessous. Aucune création de pet exigée avant de savoir.
7. **Sortie entre potes (« Viens avec ta team »)** — nouveau cœur viral et réponse au démarrage à froid : tu peux venir **seul·e ou avec 1 à 2 ami·es**. Une team de 2–3 est associée à d'autres personnes ou à une autre team de ta ville pour former un groupe de 5. Dans une ville fermée, **une team qui atteint 3 personnes vérifiées déclenche une sortie d'amorçage** avec une autre team de la ville (pas besoin du seuil de quartier). Inviter = la boucle principale (K visé ≥ 0,3).
8. Mehdi : on peut choisir **plusieurs quartiers acceptables** (« je peux aller jusqu'au 11e »), et le temps de trajet max (20 / 30 / 45 min) déclaratif.

## C. Âge, intentions, préférences (bloquant pour 4)
9. **Date de naissance à l'inscription** ; 18+ **vérifié** (estimation d'âge au selfie, document si doute) avant la 1re sortie. Aucune présélection de genre ni d'intention dans l'onboarding.
10. **Tranche d'âge souhaitée** (curseur, défaut ±4 ans) pour le groupe. Avant « Je viens », l'aperçu du groupe montre **la composition anonyme** : « 5 personnes · 26–31 ans · 2 femmes, 3 hommes · 2 viennent en team », sans prénoms ni photos.
11. Intentions secrètes, multi-choix : **Nouveaux potes** / **Une histoire** (+ sous-choix secret « sérieuse » / « on verra », et facultatif « enfants un jour : oui / non / je ne sais pas ») / **Les deux**. Ces sous-choix ne servent qu'au matching et à l'indice « projet compatible » en Duo ; jamais affichés.
12. Âges : jamais l'âge exact aux autres ; une **tranche** (« 26–30 »).

## D. Créneaux et activités (Claire, Camille, Sarah, Inès)
13. Plus de « jeudi 19 h 30 » imposé : l'utilisateur coche **ses disponibilités** parmi les créneaux de sa ville (ex. mar. soir, jeu. soir, sam. après-midi, dim. brunch) et peut marquer des **semaines off** (garde alternée). Nino propose une sortie sur un créneau coché.
14. **Type d'activité** préféré (verre/café, brunch, bloc/escalade, atelier, jeux, expo) ; la sortie affiche l'activité. Pas de quiz animé par le staff ; pas de vocal obligatoire nulle part.
15. **Rythme** : 1 notification de proposition par semaine maximum ; **pause en 1 tap** depuis l'Accueil ; aucune pastille entre deux sorties hors messages reçus.

## E. Révélation et annulation (Hugo, Léa)
16. Visages révélés **à la confirmation du groupe (veille 18 h)**, en même temps que le lieu. Après la confirmation, **annuler = absence** (compte dans la fiabilité, pas de remboursement), sauf motif sécurité. Donc personne n'annule gratuitement après avoir vu les visages.

## F. Voie Duo (Thomas, Camille ; investisseur : rester simple)
17. Dans l'onboarding : **« Comment tu préfères rencontrer ? » En petit groupe / À deux, par écrit d'abord / Les deux.** Le Duo est une porte d'entrée à égalité, désactivée par défaut pour qui choisit « groupe ».
18. Duo = **texte d'abord** ; déblocage des **visages** après 48 h si les deux ont écrit ; le **vocal est facultatif** et jamais une condition. Indice « projet compatible » si les sous-choix C.11 concordent. Rendez-vous à deux proposé, jamais avant le déblocage des visages.

## G. Sécurité (trust-safety, Yanis, Léa)
19. **Signaler / Quitter** dans l'en-tête de tout écran où il y a des inconnus (chat de groupe, fiche de sortie, duo). Motifs ajoutés : « menace d'outing », « comportement pendant la sortie ». Réponse humaine < 1 h pendant les créneaux de sortie (affiché).
20. Consentement explicite et révocable (art. 9) pour les genres recherchés, écran dédié.
21. Lien ange gardien à jeton aléatoire, expirant ; check-in n'affiche que « arrivé·e » (jamais « en route »).
22. **Mode discret** proposé dans l'onboarding (icône et notifications neutres) ; par défaut ON si l'utilisateur coche « je préfère la discrétion ». Le pet n'est jamais à prononcer au bar (on se présente au nom de la réservation « Blowy »).

## H. Argent (Mehdi, Inès, investisseur, patron de bar)
23. **1re sortie offerte. Ensuite 4,99 € la place**, consommation **non incluse** (chacun paie ce qu'il boit au lieu). **Blowy+ 9,99 €/mois** = toutes tes sorties incluses (1 par semaine) + Duo illimité ; rentable dès la 2e sortie du mois. Aucune vente d'accessoires (supprimer les prix de la Boutique ; accessoires uniquement gagnés). Supprimer toute offre de rétention.
24. Le lieu partenaire ne reçoit pas de paiement par place : il reçoit un groupe confirmé à J-1 18 h, sur ses créneaux creux, sans animation, avec une astreinte Blowy. (Côté lieu : écran/contrat dans l'admin, hors maquette mobile.) Le nom et la photo du lieu sont montrés la veille.
25. Paiement : écran de paiement maquetté (Apple Pay), état « sortie payée », remboursement auto si la sortie n'a pas lieu.

## I. Viralité (growth, créatrice TikTok)
26. Après la sortie, **CTA principal = « Partager la soirée »** : carte 9:16 **sans visages ni prénoms** (pets du groupe, lieu, « on était 5 »), sticker lien. Idem carte « 2 accords » version pets seulement.
27. **Mode capture** : chaque moment clé (Trouvée, Check-in, Après) exportable en 9:16 propre.
28. **Team** (B.7) et **+1 nommé** remontés sur l'Accueil et la fiche de sortie. Retirer toute référence « ngl ». Vrais logos de réseaux (ou icônes génériques), pas de lettres.
29. La page web de l'ange gardien et celle de « 3 mots » donnent envie (aperçu de Blowy, lien vers la ville).

## J. Qualité et cohérence (ux-cognitif — conditions de passage)
30. **Une seule source de vérité** pour les chiffres de la démo : `design/v5/facts.json` (taille du groupe = 5 dont toi, dates **réelles 2026** vérifiées avec le jour de la semaine, nb de souvenirs, duos, prix, abonnement). Tous les écrans s'y conforment ; un script vérifie.
31. **WCAG 2.2 AA** : contraste ≥ 4,5:1 texte (corail sur crème insuffisant pour le texte courant → foncer le corail texte), ≥ 3:1 gros titres, cibles ≥ 44 pt, texte blanc jamais sur dégradé clair.
32. **États** : pour chaque écran clé, vide / chargement / erreur réseau / refus / sortie annulée / paiement échoué — au moins les 6 cités par l'ux.
33. Supprimer : ne jamais promettre de résilier un abonnement App Store (renvoyer vers les réglages Apple). Rupture : textes centrés sur la personne, pas le pet. L'œuf : uniquement si les deux l'activent, jamais envoyé par l'un.
