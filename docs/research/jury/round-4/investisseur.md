# Jury V5.3 · tour 4 · Investisseur (seed, marketplaces et consumer social)

**Verdict.** Le dossier a progressé là où je l'attendais (P&L refait avec la compensation lieu, Blowy+ en achat intégré, spec révision 4 presque alignée, slug par carte, côté lieu dessiné), mais la perte sur une absence payée est sous-estimée, l'astreinte et les tables à deux ne sont toujours pas chiffrées, Blowy+ mélange un service physique et une fonction numérique dans un achat intégré, la spec diverge encore sur 4 points, et rien n'est mesuré.

**Note globale : 8/10** (tour 1 : 4/10 · tour 2 : 6/10 · tour 3 : 7/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | Thèse « partout dès 5 » lisible. |
| Charge cognitive | 8 | Deux produits (groupe, duo) à expliquer et à opérer. |
| Envie (J+1/J+7/J+30) | 8 | Rythme hebdo, bande ; non mesuré. |
| Vraie rencontre (2 semaines) | 9 | Valeur à J+3, Lyon, Lille, Bordeaux daté. |
| Sécurité et confiance | 9 | Couche confiance = défendabilité. |
| Viralité / distribution | 9 | Attribution par slug enfin possible. |
| Argent | 7 | Contribution ≈ 4,90 € écrite, ≈ 4,60 € recalculée avant astreinte fixe, duos et annulations Blowy ; risque 3.1.3(e). |
| Finition visuelle | 9 | Propre et cohérent, y compris côté lieu. |

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

- **P&L avec compensation réelle** : réglé dans l'ensemble (forfait 15 € remplacé par 4,99 € / 3 € ; contribution ≈ 4,90 €). Erreur restante : une absence payée coûte 4,99 € reversés, pas 3,84 € (frais Stripe ≈ 0,32 € non rendus, TVA ≈ 0,83 € due) : ≈ −1,15 € par absence payée, ≈ −0,28 € par sortie.
- **Astreinte par soir et par ville** : non réglé (toujours 0,50 € par participant).
- **Spec au niveau du concept** : largement réglé (4,99 € / 9,99 €, `duo.maxActiveFree=1`, plus de seuil 120, `photoRevealAt`, annulation à `lockAt`, compensation D-045). Restent : composition « mardi 12 h » vs écrans « lundi 21 h », « rentable dès la 2ᵉ sortie », proposition 48 h vs 7 jours, slug ≥ 8 vs 5–6 caractères, en-tête « révision 3 ».
- **Trancher Blowy+ face à Apple** : tranché (achat intégré) ; le risque se déplace vers 3.1.3(e) (sorties consommées hors app dans un achat intégré) et la commission sur la part sorties.
- **Duo hors des points d'entrée** : partiel (Trouvée oui, Rencontrer et Accueil-duo non).
- **Slug par carte** : réglé.
- **Ma condition du 10 au tour 3** : cohorte de 8 semaines : non mesurée ; contribution positive après compensation réelle : oui sur le papier (≈ 4,6 €), à confirmer avec astreinte fixe ; 5 lieux sous contrat par quartier : 6 annoncés au 11e, contrat dessiné ; spec = concept = écrans : à 4 écarts près.

## Lecture d'ensemble

Recalcul (hypothèses de business-model, une correction) : revenu net 10,04 € ; compensation lieu −1,40 € écrit, −1,68 € avec la vraie perte sur une absence payée (0,4 × 0,6 × (3,84 + 1,15) + 0,4 × 0,4 × 3) ; vérification −1,25 € ; astreinte −2,50 € écrit. **Contribution ≈ 4,61 €**, positive. Mais l'astreinte « 18 h–2 h, rappel sous 5 min » est un coût fixe : une personne 8 h ≈ 200 € chargés par soir et par ville ; à 2,50 € par sortie, il faut 80 sorties par soir et par ville pour la payer. En phase de test (quelques sorties par soir), la contribution est négative de fait. Ajoutez 2 × 3 € par duo absent sur table réservée et 0 € de revenu duo. Le modèle a la bonne forme ; il lui manque la ligne de coûts fixes par ville et un avis juridique sur le mélange Blowy+.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · « Partout dès 5 personnes » : thèse de liquidité claire. → —
- **V5-Ville** · 9/10 · « 6 lieux partenaires » au 11e : début d'actif défendable. → —
- **V5-Ville-bordeaux** · 9/10 · « 3 lieux partenaires » : plus de promesse sans offre. → —
- **V5-Toi** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Genre** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Pet** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Rencontrer** · 7/10 · Duo encore au point de décision (T3) : deux produits à opérer avant la preuve de la 2e sortie payante. → Duo après la 1re sortie vécue.
- **V5-Intention** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Consentement** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Toi-plus** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Dispos** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Erreur-age** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Trouvee** · 9/10 · Valeur à J+3. → —
- **V5-Trouvee-amis** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Trouvee-lyon** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Sortie** · 9/10 · « Ensuite 4,99 € la place » avant ; annulation alignée sur l'effectif : la compensation est calculable. → —
- **V5-Team** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Partage-invitation** · 9/10 · Slug nominatif par message : attribution propre. → —
- **V5-Invite** · 9/10 · Invité : 1re offerte, CAC bas. → —
- **V5-Compte** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Verif** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Notifs** · 8/10 · « lun. 21:00 » contre « mardi 12 h » (spec) : la spec qu'on code et l'écran qu'on teste divergent sur le moment clé du cycle. → Une heure.
- **V5-Sortie-inscrit** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Accueil** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Accueil-discret** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Accueil-duo** · 7/10 · Un Accueil complet pour le format à deux. → —
- **V5-Pause** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Chats** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Groupe** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Groupe-menu** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Attente** · 8/10 · « Ajouter un créneau » + carte ville : la liquidité se construit sans achat média. → Mesurer le délai « il manque N » → sortie vécue.
- **V5-Partage-ville** · 9/10 · Lien propre : canal mesurable. → —
- **V5-Amorcage** · 9/10 · Amorçage daté dans un lieu nommé la veille : thèse testable. → —
- **V5-Amorcage-solo** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Sortie-complete** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Sortie-annulee** · 7/10 · Chaque annulation pour sous-effectif rallonge le CAC (« Ta 1re sortie reste offerte ») et bloque une table sans compensation prévue : coût non chiffré. → Ligne « annulations Blowy » dans business-model.
- **V5-Affiner** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Affiner-histoire** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Eviter** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Confirmation** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Partage-confirmation** · 9/10 · Slug par carte : le « 0,3 inscrit par sortie » devient mesurable par canal (ma demande T3). → —
- **V5-Revelation** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Partage-checkin** · 9/10 · Slug propre. → —
- **V5-Ange** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **W-Ange** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **W-Ange-aide** · 7/10 · « équipe joignable de 18 h à 2 h, les soirs de sortie », rappel « sous 5 min » : un coût par soir et par ville ; business-model le compte toujours 0,50 € par participant (T3, non changé). → Astreinte en coût fixe par soir × villes ouvertes, et seuil de sorties par soir pour l'amortir.
- **V5-Checkin** · 9/10 · Code du chevalet : présence vérifiable, compensation calculable. → —
- **V5-Checkin-ok** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Souvenir** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Apres** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Apres-resultats** · 9/10 · « Partager la soirée » principal ; accords = rétention. → —
- **V5-Partage** · 9/10 · Slug propre. → —
- **V5-Partage-dimanche** · 9/10 · Slug propre. → —
- **V5-Apres-aucun** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Bande** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Rue** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Duo** · 7/10 · Duo gratuit (1 actif) + Blowy+ illimité : le seul avantage numérique de Blowy+, et un 2e produit à modérer sans revenu propre. → Mesurer la part de Blowy+ achetée pour les duos.
- **V5-Duo-choix** · 8/10 · Upsell propre ; « 7 jours » contre 48 h (spec). → Une durée.
- **V5-Lien** · 8/10 · Modération sans revenu. → —
- **V5-Lien-debloque** · 8/10 · Idem. → —
- **V5-RdvDuo** · 6/10 · « table confirmée par Le Comptoir Gabriel », « Rendez-vous gratuit » ; L-Creneaux : « les tables à deux suivent la même règle de compensation » → 2 × 3 € par duo absent, revenu 0, absent du P&L. → « Lieu suggéré » sans réservation, ou ligne duo dans business-model.
- **V5-Chat** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-RdvDuo-lea** · 9/10 · Lieu public, zéro coût. → —
- **V5-Oeuf** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Rupture** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Story** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **W-Repondre** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Profil** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Fiche** · 8/10 · Règle d'absence fausse : chaque utilisateur qui s'y fie crée un litige et une compensation lieu. → Corriger.
- **V5-Tarifs** · 9/10 · Prix honnêtes, compensation dite au client. → —
- **V5-Abonnement** · 7/10 · Achat intégré, résiliation dans les réglages iPhone, « Rentable à partir de 3 sorties par mois » (juste : 2 × 4,99 € = 9,98 €). Mais Blowy+ mélange un service consommé hors de l'app (les sorties, 3.1.3(e) : moyens de paiement autres que l'achat intégré) et une fonction numérique (duos, 3.1.1 : achat intégré). L'achat intégré règle 3.1.1 et ouvre 3.1.3(e) ; et 15 % de commission sur la part « sorties ». La spec dit « rentable dès la 2ᵉ sortie ». → Deux produits : « Duos illimités » en achat intégré (prix bas) et « Pass sorties » en Stripe ; ou garder le mélange avec un avis écrit avant soumission. Spec alignée sur « 3 sorties ».
- **V5-Paiement** · 9/10 · Place via Apple Pay/Stripe = service hors app : défendable. → —
- **V5-Paiement-ok** · 9/10 · Reçu, remboursement automatique. → —
- **V5-Reglages** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Confidentialite** · 8/10 · Le lieu reçoit des prénoms sans que Confidentialité le dise : risque réglementaire et réputationnel évitable. → Ligne « Le lieu ».
- **V5-Signaler** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Supprimer** · 10/10 · Motif de départ collecté : ma demande T3 réglée. → —
- **V5-Chargement** · 8/10 · « quelques secondes » : modèle de composition différent de la spec. → Un seul modèle.
- **V5-Erreur-reseau** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Paiement-echec** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Verif-echec** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Notifs-refus** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **V5-Chats-vide** · 9/10 · Rien de bloquant pour le modèle sur cet écran. → —
- **L-Effectif** · 8/10 · Effectif, compensation, astreinte : l'actif « lieux » devient réel. « Virement le lundi » contre relevé mensuel (spec) : coût de trésorerie et d'ops différent. → Une périodicité, dans spec et écran.
- **L-Creneaux** · 9/10 · Plafond par créneau : l'offre est pilotable. → —
- **L-Contrat** · 8/10 · Sans engagement, préavis 30 j : 0 actif contractuel durable ; trous Blowy+ / annulation par Blowy / duos (coûts non budgétés). → Clauses complétées et chiffrées.

## Les 3 changements qui feraient le plus monter ma note

1. business-model : perte réelle sur absence payée, astreinte en coût fixe par soir et par ville (avec seuil de rentabilité en sorties/soir), tables à deux, annulations par Blowy pour sous-effectif ; puis le seuil de densité qui rend la contribution positive par ville.
2. Séparer ou faire valider Blowy+ : duos illimités (numérique, achat intégré) vs sorties (service hors app, Stripe) ; aligner la spec (« 3 sorties », heure de composition, 48 h/7 j, slugs, en-tête).
3. Lancer la cohorte de 8 semaines et publier ses chiffres (2e sortie payante sous 21 j, actifs M2, inscrits vérifiés par slug, absence < 8 %, contribution réelle).

## Je mets 10 si…

Je mets 10 si la cohorte de 8 semaines montre ≥ 40 % de 2e sortie payante sous 21 jours, ≥ 25 % d'actifs à M2, ≥ 0,3 inscrit vérifié par sortie vécue attribué par slug, une contribution positive par ville après astreinte fixe, compensation réelle (absences, Blowy+, duos, annulations par Blowy) et commissions, au moins 5 lieux sous contrat par quartier ouvert, un avis juridique écrit sur le canal de Blowy+, et si spec, concept et écrans ne divergent sur aucun chiffre.

## Sources

- [Apple — App Store Review Guidelines, 3.1.1 et 3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/#in-app-purchase)
- [Apple — App Store Small Business Program (15 %)](https://developer.apple.com/app-store/small-business-program/)
- [Stripe — tarifs France](https://stripe.com/fr/pricing)
