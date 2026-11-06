# Concept V5.3 — décisions après le jury tour 3 (2026-11-06)

Tour 3 : moyenne 7,5 (T2 6,6 ; T1 4,5), minimum 6, 1 bloquant (le même pour Yanis, Thomas et trust-safety). Synthèse : `docs/research/jury/round-3/_synthese.md`. Amende V5, V5.1, V5.2 ; en cas de conflit ce document gagne. Objectif tour 4 : zéro bloquant, minimum ≥ 8, moyenne ≥ 8,5.

## A. Confidentialité (bloquant)
1. **La garantie « ≥ 2 compatibles » n'est jamais affichée** (appliquée en silence par la composition, déjà fait côté moteur). Seul cas visible, pour l'intéressé uniquement : « Cette semaine, sortie entre amis pour toi » sans chiffre. Retirer le libellé de Trouvée, Sortie, Sortie-inscrit, Toi-plus.
2. Règle de composition affichée comme règle générale (pas comme fait sur le groupe) : « Jamais plus de 3 personnes du même genre dans un groupe. »
3. Duo : avant le double « oui », on ne voit que le pet et l'initiale de l'autre ; le prénom et la carte complète apparaissent après.
4. Page ange gardien « besoin d'aide » : aucune position, seulement le lieu de la sortie et l'heure.
5. Carte « J'y suis » : jamais de lieu ni d'heure en direct (« Je sors ce soir » sans quartier ; publication possible seulement après la sortie pour le lieu).

## B. Calendrier d'une sortie (patron de bar, Thomas, Hugo, trust-safety)
6. **Annulation gratuite jusqu'à la confirmation (veille 18 h)**. Après : absence. C'est l'heure où l'effectif est envoyé au lieu.
7. À la confirmation (veille 18 h) : lieu, nom + photo du lieu, **prénoms, tranches d'âge et pets** du groupe (sans visage) — pour que Thomas sache à qui il aura affaire et puisse utiliser « je connais quelqu'un ici ».
8. **Visages à J −3 h** (inchangé), filigrane du regardeur.
9. « Je pars, mal à l'aise » : toujours possible, sans pénalité, déclenche un message au staff (et au gardien si choisi) ; si répété 3 fois, un humain recontacte.

## C. Argent (investisseur, patron)
10. **Blowy+ via achat intégré** (RevenueCat, déjà en place) car il contient des fonctions numériques (Duo illimité) ; **places à l'unité via Apple Pay / Stripe** (service consommé hors app). À revalider juridiquement avant soumission.
11. Compensation du lieu pour une place non honorée après confirmation : **le prix de la place (4,99 €) est reversé au lieu** si la place était payée ; si elle était offerte (1re sortie), Blowy verse **3 €**. Plus de forfait 15 €. Le modèle économique est recalculé dans `docs/product/business-model.md`.
12. La spec technique est mise à jour pour refléter V5.1 → V5.3 (prix, seuils, duos, horaires).

## D. Onboarding (ux, Claire, Mehdi)
13. **Une question par écran**, ≤ 9 écrans avant la Trouvée (on accepte 9 si c'est le prix d'une seule question par écran).
14. Dans l'écran des créneaux : une case « Certaines semaines je ne suis pas dispo (garde, travail) » (Claire) ; trajet max demandé une fois (Mehdi), défaut 30 min affiché.
15. Vocabulaire adulte et neutre : « venir avec quelqu'un » / « tes proches » plutôt que « team » / « potes » dans les titres ; « team » peut rester un terme d'interface secondaire. Choisir et s'y tenir partout.

## E. Viralité (growth, créatrice)
16. **Un lien unique par carte et par personne** (traçable : quelle carte a amené qui), jamais réutilisé ; l'écran Invite dit la vérité sur son usage.
17. Après les résultats du vote : **« Partager la soirée » = bouton principal** sur Résultats (le vote reste l'action principale du Souvenir).
18. Carte du dimanche réintroduite **sans chiffres ni pets identifiables** : « Ma bande s'agrandit » (silhouettes génériques).
19. Les 4 cartes doivent être **visuellement distinctes** (couleur, composition) ; l'export vidéo animé (pets génériques) est noté pour plus tard, pas maquetté.
20. Le Duo n'est pas proposé pendant l'onboarding si l'utilisateur a choisi « en petit groupe ».

## F. Le reste (personas)
21. Visages : remplacer les lettres par des **portraits illustrés neutres** (silhouettes stylisées, jamais de vraies personnes) avec la mention « ta photo ici » dans Vérif/Profil ; le README précise que l'app montre les vraies photos vérifiées.
22. Un écran à **Lyon** (Hugo) et une sortie **à Lille en solo** (Sarah).
23. Le pet peut être affiché en petit sur l'Accueil (réglage « taille du pet ») (Hugo).
24. Ta rue : une petite action facultative (ranger ses souvenirs, offrir un accessoire gagné au pet d'un membre de la bande), sans notification ni jauge (Inès).
25. Écran d'attente : une date (« prochaine sortie possible le … si … ») et une carte de partage « Aide Bordeaux à sortir » sans chiffres personnels (Inès, growth).
26. « Éviter les personnes que je connais » : expliqué (comparaison de numéros chiffrés sur l'appareil) et activé par défaut seulement si l'utilisateur l'accepte à l'écran dédié (pas d'import silencieux).
27. Côté lieu (web admin) : **3 écrans maquettés** — contrat d'une page, créneaux/plafond de tables, effectif de la veille 18 h avec liste « table Blowy » (sans données personnelles au-delà des prénoms).
28. Défauts de pixel persistants : légendes sous les boutons (Après, Blowy+, Signaler), chips inclinées qui se chevauchent, heures/dates coupées en fin de ligne, « SORTIE » en dégradé pâle illisible (Souvenir), chronologie des duos (8 nov. avant l'accord du 9). Étendre check-facts aux légendes rognées si possible (calcul de boîtes depuis le rendu).
