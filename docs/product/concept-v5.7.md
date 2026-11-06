# Concept V5.7 — décisions après le jury tour 7 (2026-11-06)

Tour 7 : **les 15 membres à 9/10, zéro bloquant** (T1 : moyenne 4,5, minimum 3). Ce tour vise le 10 : chaque membre a dit exactement ce qui manque. Amende V5 → V5.6.

## A. Sécurité (trust-safety, Léa, Yanis)
1. Les visages (et la Confirmation) : **trois sorties distinctes**, chacune avec sa phrase canonique — « Raison de sécurité » (toujours possible, sans pénalité, place remboursée), « Je connais quelqu'un ici » (1 fois par mois, place remboursée ; au-delà : examiné par l'équipe, jamais une absence), « Imprévu » (1 fois par mois, place non remboursée). « Je ne le sens pas » = imprévu, libellé tel quel.
2. **Délai d'aide** : paramètre `[T] safety.helpCallbackTargetMinutes = 5` (objectif de rappel humain pendant une sortie) ; la SLA dossier reste 60 min. Les écrans disent « Quelqu'un de l'équipe te rappelle en quelques minutes. » Chiffré dans le modèle économique (astreinte dimensionnée pour 5 min).
3. Rendez-vous Duo et page ange : « pendant tout ton rendez-vous » (Duo) / « pendant toute la sortie de Léa » (ange) — jamais « ta sortie » quand ce n'est pas la sienne.
4. Marseille (Yanis) : rendez-vous Duo avec choix de l'ange et « proposer un autre lieu ou une autre heure ».

## B. Vérité des dates (growth, ux, Camille)
5. Aucune date en dur : chaque échéance est calculée depuis la composition (J−3 21 h) et la confirmation (veille 18 h) via facts.json ; les écrans de remplacement disent « si un groupe se forme, réponse mercredi soir » au lieu de promettre une sortie.
6. Ville-nantes : aucune promesse d'histoire à l'étape 1/9 (indicateur seulement après l'intention) ; titres non répétés.

## C. Lieu (patron)
7. **Message d'accueil du lieu** : écrit par le lieu dans l'espace lieu, montré aux participants à la Confirmation (veille 18 h) et dans le chat du groupe à ce moment-là.
8. Relevé mensuel sur le mois civil ; effectif sur toute la semaine (tous les jours de créneaux) ; contrat qui nomme la sortie pour sécurité (3 € HT), l'imprévu (place reversée), « Blowy annule » (3 € HT par place réservée, à toute heure après la confirmation) ; **table Duo : 0 €, sans garantie** — aligner spec et écrans.
9. Tarifs, contrat et écran client : la même règle mot pour mot (phrases canoniques).

## D. Argent (investisseur, Inès)
10. Un seul point mort dans le modèle économique (tous postes : ≈ 134 sorties/jour au national) ; table Duo 0 €.
11. Tarifs : « Tu sors 2 fois par mois ? Paie à la place (2 × 4,99 €). Blowy+ devient intéressant dès la 3e sortie. »

## E. Partage (créatrice, Sarah)
12. Aperçu animé des vidéos 5 s (3 vignettes : début, milieu, fin) sur chaque carte animable, y compris « 3 mots ».
13. Les visages : plus aucun lien de partage. Souvenir : le vote d'abord, le partage seulement après le vote.

## F. Personas
14. Thomas : option « Montrer au groupe : je préfère le calme » (badge discret sur son pet dans le chat), désactivée par défaut.
15. Claire : une proposition maquettée sur un **week-end libre** de garde alternée ; l'écran Créneaux affiche le motif « un week-end sur deux ».
16. Inès : « personnes vérifiées » (jamais « inscrits ») dans les indicateurs.
17. Hugo : légende photo cohérente avec le moment (« photo du lieu » à la veille, plus « arrive la veille ») ; pets propres à chaque groupe (Lyon, Saint-Denis : jamais les pets de Paris ni le pet de Tom) ; raton du Welcome moins dominant.
18. Léa : « Une proposition pour vous deux » reformulé (« Nino propose un duo avec N. ») ; fiabilité marquée « visible par toi seulement » partout où elle apparaît.
19. Croissance : la voie Duo reste une porte d'égale importance à l'inscription (choix assumé pour les personnes que le groupe intimide — Thomas, Yanis) ; le README explique pourquoi.

## G. Défauts communs
20. Doublon « X vient avec toi » sur les 4 fiches Sortie ; Lille au gabarit commun ; éclaboussures de Souvenir ; titre posé sur le banc (Ta bande) ; « 5 / s. » coupé (Mes cartes) ; ligne HT sur l'écran client « Sortie annulée » (TTC côté client) ; « pour ta sécurité » écrit deux fois (Check-in fait) ; « Pigeonne » / « pigeon » uniformisé.
