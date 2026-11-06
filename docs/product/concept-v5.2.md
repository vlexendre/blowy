# Concept V5.2 — décisions après le jury tour 2 (2026-11-06)

Tour 2 : moyenne 6,6 (T1 : 4,5), minimum 6 (T1 : 3), 3 bloquants (T1 : 25+). Synthèse : `docs/research/jury/round-2/_synthese.md`. Ces décisions amendent `concept-v5.md` et `concept-v5.1.md` ; en cas de conflit, ce document gagne. Objectif tour 3 : zéro bloquant, minimum ≥ 8.

## A. Plus de « ville fermée » : une sortie dès qu'il y a 5 personnes compatibles (Camille, Yanis, Sarah, Inès, Mehdi)
1. On supprime la notion de quartier fermé. **Dans n'importe quelle ville, une sortie se forme dès que 5 personnes vérifiées compatibles partagent un créneau.** L'ouverture d'un quartier ne change que la fréquence et le choix des lieux.
2. L'écran d'attente est honnête et actionnable : « À Nantes : 87 personnes vérifiées. Sur tes créneaux, il manque 2 personnes pour la sortie du samedi 21 novembre. » + **inviter des potes (team)** + élargir ses créneaux/activités/trajet + Duo si activé. Jamais de seuil abstrait (« 120 »).
3. La team compte : une team de 3 + 2 personnes en attente = une sortie. Montrer cette sortie d'amorçage avec date et lieu (exemple Lille).
4. Exemple maquetté pour une ville **loin** de toute ville active (Lille ou Nantes), pas seulement Saint-Denis.

## B. Garantie « pour toi » dans le groupe (Léa, Hugo, Camille, Yanis)
5. Pour qui a l'intention « une histoire », le groupe proposé garantit **au moins 2 personnes compatibles** (genres recherchés réciproques, tranche d'âge, intention). Affiché sur la fiche : « Au moins 2 personnes du groupe cherchent aussi une histoire compatible avec la tienne » — jamais qui.
6. Si ce n'est pas possible (ex. trop peu d'hommes gays sur ce créneau), on le dit avant « Je viens » : « Cette semaine, sortie potes uniquement pour toi » ou proposition d'un autre créneau / du Duo.
7. Équilibre femmes/hommes affiché dans l'aperçu en tant que composition (déjà) ; la team est comptée dans la composition.

## C. Révélation, âge, retrait (trust-safety, Hugo)
8. **Lieu** révélé la veille à 18 h (pour l'ange gardien). **Visages** révélés le jour J, **3 h avant** le début, avec filigrane du prénom de la personne qui regarde, capture d'écran bloquée/avertie. Annuler après la révélation des visages = absence.
9. **Grille d'âge fixe** (18–21, 22–25, 26–29, 30–34, 35–39, 40–44, 45–49, 50+), jamais centrée sur la personne. L'aperçu du groupe montre l'union des tranches ; une personne n'est jamais montrée avec une tranche hors de l'aperçu. Jamais d'âge exact.
10. « Je connais quelqu'un ici » : à la révélation des visages, chacun peut signaler en privé qu'il connaît quelqu'un (ex, collègue, conflit). C'est examiné automatiquement (lien réel déjà connu dans l'app, blocage) ou par un humain ; si accepté, la personne est déplacée vers un autre groupe sans pénalité. Limite : 1 fois par mois ; au-delà, c'est une annulation (absence).

## D. Partage sans fuite (trust-safety, Yanis, créatrice)
11. **Jamais le prénom d'un tiers** sur une carte de partage, filtre ou non. Jamais l'espèce réelle d'un pet d'un autre membre sur une carte (silhouettes génériques). **La carte « accords » est supprimée.**
12. Cartes exportables : invitation (« viens avec moi », sans tiers), confirmation du mercredi (« jeudi je sors avec 4 inconnus · lieu secret »), check-in (« j'y suis »), soirée (« on était 5 »). Chiffres toujours justes depuis facts.json (« 3 inconnu·es + Tom » → « 4 personnes que je ne connais pas » faux si Tom est ma team : écrire « 3 nouvelles personnes »).
13. Lien public « 3 mots » : slug aléatoire, jamais le prénom (`blowy.app/m/k7f2q`).

## E. Onboarding plus court et dans le bon ordre (growth, ux, Thomas)
14. **≤ 8 écrans avant de voir sa sortie trouvée.** Ordre : Welcome → Tu sors où ? → Date de naissance → Ton pet (craft + 4 questions de vision fusionnés en 2 écrans max) → Comment tu préfères rencontrer + intention (potes / histoire / les deux) → **Consentement art. 9** (seulement si « histoire ») puis **genres recherchés** → Créneaux → Compte (Apple) → Trouvée. Sous-choix sensibles (sérieuse, enfants), activités, semaines off, trajet : **« Affiner plus tard »** depuis le Profil, jamais avant le consentement.
15. Une décision par écran ; pas d'écran « 4/8 » répété : la barre de progression compte les écrans réels.

## F. Vérités à l'écran (ux, Sarah, Yanis, Inès)
16. Remplacer « Personne n'apprend jamais un non » par « Tu ne sauras jamais qui a dit non ou n'a pas voté. »
17. Confidentialité, phrase exacte : « Ton orientation et ce que tu cherches ne sont montrés à personne. Seule une personne avec qui tu as un duo sait que vous vous plaisez mutuellement. »
18. Vocabulaire unique : **visages** (jamais « photos » pour la révélation), **besoin d'aide** (jamais « alerte »), **confirmée** (état) / **confirmation** (moment) cohérents. Éviter le point médian dans les libellés de boutons et titres (VoiceOver) : formulations épicènes (« pote », « personne », « tes nouvelles têtes »).
19. Interrupteurs : libellé = état réel, couleur = état réel.
20. Pas de « remboursé·e » pour une sortie offerte. Pas de bouton principal « Corriger ma date » sur l'écran moins de 18 ans (bouton principal : « Compris », secondaire discret « Je me suis trompé·e »).

## G. Entre deux sorties, sans corvée (Inès, Sarah)
21. **« Ta rue »** : vue calme où vivent les pets de ta bande, décorée par tes souvenirs ; rien à entretenir, aucune notification, aucune jauge. Facultative, accessible depuis Bande.
22. Pause en 1 tap toujours présente ; « + Inviter » de l'Accueil réduit à une ligne discrète (Sarah).

## H. Lieu partenaire et argent (patron, investisseur)
23. Motif de signalement **« Incident sur place »** (lieu, personnel, autre client).
24. Côté lieu (hors app mobile, admin web à maquetter en V5.3) : contrat d'une page, créneaux, plafond de tables, effectif à J-1 18 h, **compensation forfaitaire de 15 € par place non honorée après la confirmation** (financée par la non-remise des absents), astreinte Blowy, nom + photo du lieu affichés la veille.
25. Duo : **gratuit 1 duo actif** ; Blowy+ = duos illimités et toutes les sorties. Blowy+ n'est jamais « l'argument » de l'onboarding.
26. Paiement : Stripe (Apple Pay) pour places et Blowy+ (services consommés hors app) — à revalider juridiquement avant soumission App Store ; les écrans disent « Apple Pay », jamais « App Store ».
27. Modèle économique chiffré : `docs/product/business-model.md` (hypothèses, P&L par sortie et par ville, cohortes cibles).
