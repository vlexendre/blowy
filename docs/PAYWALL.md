# La feuille Minimoa+ (paywall), version 2

Refonte du 18 novembre 2026, inspirée de références de paywalls envoyées par le propriétaire. Règles Apple et preuves :
`docs/AUDIT-APPLE.md` (« Minimoa+ et App Review ») ; offres et StoreKit : `docs/BLOWY-PLUS.md`.

## Où est le code

| Pièce | Fichier |
|---|---|
| Logique (offres, prix et essai StoreKit, achat, restauration, erreurs, membre) | `apps/mobile/src/features/plus/index.tsx` (`PlusOffer`) |
| Textes (fr source ; en, es, pt-BR, nl) | `apps/mobile/src/locales/plus.ts` |
| Mise en page | `packages/ui/src/templates/PlusTemplate.tsx` |
| Haut : marque, grand titre, minimoa en 3 poses | `packages/ui/src/organisms/PlusHero.tsx` |
| Offres en cartes | `packages/ui/src/organisms/PlusPlanCards.tsx` |
| Frise verticale | `packages/ui/src/organisms/TrialTimeline.tsx` |
| Ligne d'avantage « **Titre :** explication » | `packages/ui/src/molecules/PerkLine.tsx` |
| Bouton à deux lignes (action, puis prix) | `packages/ui/src/atoms/Button.tsx` (`subLabel`) |
| Pictogrammes cadenas ouvert, cloche, étoile | `packages/ui/src/atoms/Glyph.tsx` |
| Fond de la feuille | `packages/ui/src/theme.ts` (`plusBackdrop`) |
| StoreKit (inchangé) | `apps/mobile/src/core/adapters/storekit.ios.ts` |

## Structure, de haut en bas

1. **Fond** : voile violet de la marque en haut, qui se fond dans la nuit avant les offres (`plusBackdrop`).
2. **Marque « MINIMOA+ » et croix** : la croix est active dès l'ouverture ; le haut sert de poignée (tirer la feuille).
3. **Grand titre bénéfice** en capitales Allo ExtraBold, selon la raison d'ouverture (`openPlus(raison)`) :
   « Nino te présente plus de monde. », « Toute la carte, pas que ta zone. »…
4. **Le minimoa de la personne en trois poses** (coucou, marche, fier en tenue premium), chacune au-dessus d'un bénéfice
   court : « Plus de rencontres », « Toute la carte », « Objets premium » (formes courtes `plus.perks`, les mêmes que
   les autres écrans). L'objet premium qu'on vient de toucher habille la troisième pose.
5. **Avantages restants** en lignes « **Titre :** explication » avec une icône 3D (celui de la raison en tête, en
   jaune) ; deux lignes, puis « Et N de plus » qui déplie. Le lecteur d'écran lit la phrase de l'API.
6. **Offres en trois cartes côte à côte** : durée (« 1 an »), **montant facturé en grand** (« 59,88 € »), période
   dessous (« par an »), équivalent mensuel en petit (annuelle seulement) ; la carte choisie est remplie du dégradé
   violet, bord jaune, coche ronde ; pastille « Économise 67 % » au-dessus de l'annuelle.
7. **Frise verticale** (cadenas ouvert → cloche → étoile, sur une barre violet → corail) :
   - avec l'essai : « Aujourd'hui : tout Minimoa+ est ouvert » → « Jour 5 : rappel avant la fin de l'essai » →
     « Jour 7 : 1er paiement, sauf annulation » (titres de l'API, `trial.timeline`) ;
   - sans essai (mensuelle, hebdomadaire, ou essai déjà utilisé) : « Aujourd'hui : premier paiement, tout est ouvert »
     → « Chaque mois : renouvellement automatique » → « Quand tu veux : tu annules dans Réglages ». La feuille garde
     la même forme d'une offre à l'autre (rien ne saute sous le doigt).
8. **« Continuer gratuitement »** et « Conditions de Minimoa+ » (mention complète du renouvellement).
9. **Barre fixe** : bouton jaune large et arrondi, l'action puis le prix sur deux lignes (« Commencer mes 7 jours
   gratuits » / « puis 59,88 € par an » ; sans essai, « M'abonner : 14,99 € par mois ») ; dessous, la date du premier
   paiement, « Renouvellement automatique, annulable à tout moment dans Réglages › ton nom › Abonnements » ; puis la
   ligne discrète « Restaurer mes achats · Conditions · Confidentialité ».

Membre : mêmes haut et avantages (tous dépliés), puis la carte « Tu as Minimoa+ », l'état de l'abonnement et « Gérer mon
abonnement » (feuille système) ; aucun bouton d'achat.

**Petit écran** (hauteur de fenêtre < 740, donc 375 × 667) : une seule pose (la tenue premium) entre le titre et la
croix, le titre se règle pour qu'aucun mot ne soit coupé (`fitTitleSize`), une ligne d'avantage puis « Et N de plus »,
cartes et frise compactes.

## Ce qu'on a pris aux références

- Grand titre bénéfice très lisible et mascotte en trois poses illustrant trois bénéfices courts.
- Liste d'avantages avec icône et « **Titre :** explication ».
- Offres en cartes côte à côte, coche ronde, pastille de remise au-dessus de l'annuelle, carte choisie en dégradé.
- Frise d'essai verticale (cadenas, cloche, étoile sur une barre colorée).
- Bouton principal large, arrondi, couleur de la marque (le jaune d'action de l'app), avec le prix dans le libellé ;
  « annulable à tout moment » dessous ; « Restaurer · Conditions · Confidentialité » discret en bas ; croix en haut.
- Fond doux en dégradé de la marque, illustration en haut.

## Ce qu'on a refusé, et pourquoi

| Vu dans les références | Pourquoi non |
|---|---|
| « 0,00 € aujourd'hui » plus gros que le prix, bouton « Accès gratuit » | 3.1.2(c) et Schedule 2 : le montant facturé et sa période doivent être l'élément de prix le plus visible. Chez nous, le montant de chaque carte est le plus grand texte de prix ; l'équivalent mensuel reste petit. |
| Interrupteur « essai gratuit activé », « Pas sûr ? Activer l'accès gratuit » | Refusés par Apple depuis 2024 (présentation trompeuse de l'essai, 3.1.2(a)). L'essai est une propriété de l'offre StoreKit, annoncé seulement si la personne y a droit. |
| Compte à rebours, « offre unique, tu ne la reverras jamais », prix barré | Fausse urgence et prix de référence inventé : 5.6 (pratiques trompeuses), droit de la consommation. Aucun. |
| Note App Store, « 1M d'utilisateurs », avis | L'app n'est pas publiée : ce serait inventé (2.3.1, 5.6). Seul emplacement prévu : le nombre **réel** de personnes compatibles près de soi (`paywall.teaser`, venu de l'API) ; à zéro, rien ne s'affiche. |
| Demande de note avant l'achat | Interdit en pratique (et sans objet avant l'achat). |
| Remise de l'annuelle contre 52 semaines de l'hebdomadaire | Chiffre flatteur mais trompeur : la remise se calcule contre douze mensualités seulement (`yearlyDiscountPercent`, prix StoreKit) ; l'hebdomadaire n'a ni équivalent mensuel ni pastille. |
| Prix écrits dans le design | Prix et essai viennent de StoreKit seul (`useStoreProducts`) ; si le magasin ne répond pas : ni prix ni bouton d'achat, « Réessayer ». |
| Cacher « Continuer gratuitement » ou la croix, la croix qui apparaît après quelques secondes | La croix est active à l'ouverture, « Continuer gratuitement » toujours visible (l'app reste gratuite). |
| Liste longue qui défile | Toute la feuille tient sur un écran sans défiler (ci-dessous). |

## Vérification « tient sur un écran »

Captures web, API locale en mémoire, achat simulé (`tools/shoot.js` dans le dossier de travail) : 390 × 771 et
375 × 647 (390 × 844 et 375 × 667 moins les marges de sécurité d'un vrai iPhone), fr, en, es, pt, nl ; états essai
annuel, mensuel, hebdomadaire, membre. Aucun débordement, aucun texte coupé ; marge la plus juste : 8 pt (annuel, fr/es/nl,
390 × 771), sans la mention « Mode dev » qui n'existe pas en production.
