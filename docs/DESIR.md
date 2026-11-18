# Donner envie de Minimoa+, sans rien inventer

Écrit le 18 novembre 2026 avec le code. Demande du propriétaire : « créer suffisamment de FOMO pour que les gens
s'abonnent ». Réponse : du désir fondé sur ce qui existe vraiment (de vraies personnes, de vrais objets, de vraies
dates), proposé au bon moment, plafonné par le serveur et mesuré par déclencheur.

Règles relues pour ce travail : App Review 3.1.2 (abonnements), 5.6 (« no manipulative practices »), Schedule 2 ;
directive 2005/29/CE et code de la consommation (pratiques commerciales trompeuses : fausse rareté, fausse urgence,
faux prix de référence) ; nos documents `docs/PAYWALL.md`, `docs/FIDELISATION.md`, `docs/AUDIT-APPLE.md` (Minimoa+).

## 1. Les garde-fous (non négociables, vérifiés par les tests)

| Interdit | Ce qu'on fait à la place |
|---|---|
| Faux compteur, faux « X personnes regardent » | Seuls des nombres calculés par le serveur sur de vraies personnes, filtrées par `Audience` (supprimées, suspendues, bloquées, discrètes : jamais comptées). À zéro, rien ne s'affiche. |
| Fausse rareté, faux compte à rebours, offre « unique » | Une seule échéance : la fin d'une collection saisonnière, écrite dans le domaine (`COLLECTIONS`) et appliquée par le serveur (après la date, ses objets ne sont plus donnés à personne). Pas de minuteur qui défile : une date et des jours restants. |
| Faux prix barré, remise inventée | Rien de nouveau sur les prix : la feuille reste celle de `docs/PAYWALL.md` (prix StoreKit, remise contre 12 mensualités). |
| Culpabilisation (« ton minimoa va mourir », « tu vas perdre tes amis ») | Les titres saluent un moment (« Premier lien. Et la suite ? », « 7 jours d'affilée. Bien joué. ») ou décrivent un avantage. Aucune perte annoncée. |
| Bloquer une fonction gratuite | Rien n'est retiré aux gratuits : répondre à un signe, saluer, la carte de sa zone, la garde-robe gagnée restent identiques. On **montre** ce que Minimoa+ ajoute. |
| Paywall à répétition | Une seule proposition forte (feuille ouverte d'elle-même) par moment clé, jamais deux en moins de 3 jours, jamais le jour de l'inscription (la feuille de l'inscription suffit), jamais avec Minimoa+, jamais au compte de revue d'Apple. Décidé et réservé côté serveur. Les autres entrées ne s'ouvrent que sur un geste de la personne. |
| Sortie cachée | Feuille inchangée : croix active dès l'ouverture, « Continuer gratuitement » toujours visible, tout tient sur un écran (revérifié avec les nouveaux titres, §4). |
| Révéler une identité | « Vu de loin » ne montre ni visage, ni prénom, ni position : un nombre et des silhouettes de décor (formes génériques, pas celles des vraies personnes, et jamais plus de silhouettes que de personnes). |
| Essai mis en avant à tort | Inchangé : un essai n'est annoncé que si StoreKit dit que la personne y a droit. |

## 2. Les mécanismes

### 2.1 « Vu de loin » (Rencontres et carte)

- **Quoi.** Sous les présentations du jour, une carte violette : « 12 minimoas compatibles de plus au-delà de ta zone,
  dont 3 à plus de 85 %. » puis « Sur la carte, hors de ta zone. Avec Minimoa+, toute la carte s'ouvre, et Nino te
  présente une personne de plus chaque jour. » → « Les voir avec Minimoa+ » (`openPlus('far_away')`). Sur la carte, le
  bandeau du bas dit le vrai nombre hors zone et combien à 85 % ou plus (« 26 compatibles hors de ta zone · Dont 24 à
  plus de 85 % · Minimoa+ »), au lieu de l'avantage seul.
- **Pourquoi ça marche.** L'aversion à la perte et la curiosité portent sur des gens réels et compatibles, au moment où
  la personne cherche justement du monde ; le chiffre « à plus de 85 % » rend le manque concret.
- **Pourquoi c'est honnête.** Le nombre vient du serveur (`ListEncounters.farAway`, `GetMap` : `beyond.strong`) :
  personnes compatibles (seuil de 70, filtres durs de la vision) à plus de 1,5 km et à moins de 20 km, ni présentées
  aujourd'hui, ni déjà saluées, ni liées, ni refusées, et montrables sur la carte (`Audience` contexte `map` : le mode
  discret les retire). Rien n'est promis de plus que ce que Minimoa+ donne vraiment : toute la carte (repères jusqu'à
  100) et une présentation de plus par jour (`encounterBonus`). On ne promet **pas** « salue qui tu veux » : un autre
  chantier limite les signes aux personnes présentées (voir §5). Avec Minimoa+ : `far` vaut null.
- **Contrat.** `Encounters.far` (`{ count, strong, label }` ou null), `MapBeyond.strong`.

### 2.2 Essayage gratuit (garde-robe)

- **Quoi.** La fiche d'un objet premium a « L'essayer sur Nino » : la fiche descend, le minimoa le porte ; une barre
  dit « Essayage : auréole sur Nino. Un aperçu, rien n'est gardé. Avec Minimoa+, il le porte pour de vrai. » →
  « Le garder avec Minimoa+ » (`openPlus('try_on', { item })`) ou « Retirer ».
- **Pourquoi ça marche.** Effet de dotation : voir *son* minimoa avec l'objet crée l'attachement avant l'achat.
- **Pourquoi c'est honnête.** C'est un aperçu local, jamais enregistré ni montré aux autres ; la phrase le dit.

### 2.3 Objet porté par un autre minimoa

- **Quoi.** Sur l'écran d'une rencontre, si l'autre minimoa porte un objet premium encore proposé : « Léa lui a mis
  auréole · Minimoa+ » → « Essayer sur Nino » (ouvre la garde-robe en essayage ; la feuille qui suit est comptée
  `worn_by`).
- **Pourquoi ça marche.** Désir social (« je veux le même »), sans pression.
- **Pourquoi c'est honnête, vie privée.** La tenue est déjà visible sur le minimoa de l'autre (avatars, scène) ; un
  objet premium ne se porte qu'avec Minimoa+, donc rien de nouveau n'est révélé. On n'a **pas** ajouté de badge
  « membre Minimoa+ » sur les profils : ce serait révéler un abonnement (donnée personnelle) et créer deux classes de
  personnes ; la tenue suffit. Jamais montré pour un objet d'une collection finie (qu'on ne peut plus avoir).

### 2.4 Collection saisonnière à vraie date de fin

- **Quoi.** Collection Hiver (12 objets) **du 1er novembre 2026 au 31 janvier 2027**. Dans la garde-robe : « Collection
  Hiver · Jusqu'au 31 janvier · encore 75 jours · Dans Minimoa+ jusqu'à cette date. Ensuite, seuls les minimoas qui
  l'ont eue la gardent. » → « L'avoir avec Minimoa+ » (`openPlus('collection')`, titre « Collection Hiver, jusqu'au
  31 janvier. »). Membre : « Elle est à toi, et le reste après cette date tant que Minimoa+ est actif. » La vitrine de
  la feuille prend ses objets dans la collection en cours (et des objets permanents hors saison).
- **Pourquoi ça marche.** Rareté et échéance réelles ; le « je la garde » récompense les abonnés de la saison.
- **Pourquoi c'est honnête.** La date est dans le domaine (`COLLECTIONS`, `packages/domain/src/desir.ts`) et appliquée
  par le serveur : pendant la collection, chaque lecture de la garde-robe d'un membre range ses objets dans `pet_items`
  (source `collection`) ; après le 31 janvier, `itemAvailable` les retire de la garde-robe de tous les autres
  (plus proposés, plus portables, retirés d'une tenue par `withoutUnavailable`) et la feuille n'en parle plus. **Une
  date de fin ne se repousse pas** (sinon la rareté devient fausse) : pour une nouvelle saison, ajouter une collection.
  Les objets gardés restent portables tant que Minimoa+ est actif, comme tous les objets premium (règle de
  `docs/BLOWY-PLUS.md`, inchangée). Dates à valider par le propriétaire (`COLLECTIONS`).
- **Contrat.** `Wardrobe.collection`, `Paywall.collection` (`{ id, until, daysLeft, items, kept }` ou null).

### 2.5 Moments clés

- **Quoi.** Juste après un vrai moment de valeur, la feuille s'ouvre une fois, avec un titre qui salue le moment :
  - premier lien (la personne a son tout premier lien, né il y a 2 jours au plus) : « Premier lien. Et la suite ? »,
    avantage « Plus de rencontres » en tête (`moment_first_link`) ;
  - 7 jours d'affilée au défi du jour (série de 7 à 9, faite il y a 2 jours au plus) : « 7 jours d'affilée. Bien
    joué. », avantage « 3 jokers par semaine » en tête (`moment_streak_7`).
- **Quand.** Sur l'accueil, quand tout est calme : après les fêtes, le défi du jour, le « te revoilà », les cartes à
  partager (palier de série, première semaine) et la demande des notifications ; une fois par lancement, l'app demande
  `POST /v1/plus/moment`.
- **Plafond (serveur, `plusMomentDue`, `PlusMoments`).** Une fois par moment (clé `plus_moment:<moment>`), jamais deux
  propositions fortes en moins de 3 jours (clé `plus_strong:<jour>`), jamais le jour de l'inscription, jamais avec
  Minimoa+, jamais au monde de revue d'Apple. Journal : `lifecycle_messages` (déjà partagé avec Minimoa+, purgé à 400
  jours, effacé avec le compte). Deux appels qui se croisent n'ouvrent qu'une feuille (réservation atomique).
- **Pourquoi ça marche.** Proposer quand la valeur vient d'être ressentie (pic d'engagement) convertit mieux qu'au
  hasard. **Pourquoi c'est honnête** : rare, prévisible, toujours refusable d'un geste.

### 2.6 Ce qu'on n'a pas fait, et pourquoi

| Idée | Pourquoi non |
|---|---|
| Signes reçus floutés « réponds aujourd'hui avec Minimoa+ » | Répondre à un signe est gratuit et illimité : le rendre payant bloquerait une fonction de base. Si le chantier anti-spam ajoute un plafond quotidien de **signes envoyés** plus haut avec Minimoa+, brancher la feuille sur son erreur dédiée (« limite de signes atteinte ») avec une raison `wave_limit` : le serveur dit déjà la limite, l'app n'a qu'à proposer Minimoa+ à cet endroit, sans dupliquer la règle. |
| Badge « Minimoa+ » sur le profil des membres | Révèle un abonnement et crée deux classes de personnes (§2.3). |
| « Il ne reste que N places », compte à rebours de l'offre | Inventé (aucune limite réelle). |
| Prix de lancement barré, « offre de la semaine » | Aucune offre réelle dans App Store Connect (`docs/FIDELISATION.md` §4). |

## 3. Mesure : conversion par déclencheur

- Chaque ouverture de la feuille envoie son déclencheur (`POST /v1/plus/opens`, une fois par ouverture, jamais pour un
  membre) ; chaque achat le joint (`SubmitPurchaseBody.trigger`). Le serveur compte par jour, sans personne derrière
  (`growth_counters`, métriques `plus_open`, `plus_trial`, `plus_paid`, `source` = déclencheur). Un achat ne compte que
  s'il ouvre Minimoa+ (une restauration d'un abonnement en cours ne compte pas).
- Déclencheurs (`PLUS_TRIGGERS`) : `onboarding`, `generic`, `premium_item`, `map`, `change_city`, `habits_limit`,
  `rename`, `detailed_review`, `jokers`, `encounters`, et pour le désir `far_away`, `try_on`, `worn_by`, `collection`,
  `moment_first_link`, `moment_streak_7`.
- Administration › Croissance › « Minimoa+ par déclencheur » (12 semaines) : ouvertures, essais, paiements, conversion
  ((essais + paiements) / ouvertures). À suivre : conversion de `far_away` et `moment_*` contre `generic` ; si un
  déclencheur fort convertit mal, le retirer plutôt que l'ouvrir plus souvent.

## 4. Vérifications

- Domaine : `packages/domain/src/desir.test.ts` (résumé, dates de la collection, garde après la fin, plafond des
  moments, rapport par déclencheur).
- API : `apps/api/test/desir.e2e.test.ts` (compteurs et restauration non comptée ; moment jamais le jour de
  l'inscription puis une seule fois ; vu de loin compté sans identité, discrets exclus, rien avec Minimoa+ ;
  collection gardée par le membre et retirée aux autres après le 31 janvier).
- Feuille : tient sur un écran avec les nouveaux titres (390 × 771 et 375 × 647, cinq langues ; outil
  `tools/fit.js` du dossier de travail).
- Captures fr 390 × 844 : rencontres « Vu de loin », carte, rencontre (objet porté), garde-robe (collection, essayage),
  feuille pour chaque nouveau déclencheur.

## 5. Où est le code

| Pièce | Fichier |
|---|---|
| Règles pures | `packages/domain/src/desir.ts` |
| Contrat | `packages/contract/src/v7/billing.ts` (`PlusTriggerZ`, `SeasonalCollectionZ`, `PlusOpenBody`, `PlusMomentZ`), `packages/contract/src/index.ts` (`FarAwayZ`, `Wardrobe.collection`), `v7/vision.ts` (`MapBeyond.strong`), `v7/croissance.ts` (`AdminGrowth.plus`) |
| Vu de loin | `modules/encounters/application/list-encounters.usecase.ts` (`farAway`), `modules/vision/application/get-map.usecase.ts` |
| Collection | `modules/pets/application/wardrobe.ts` (`keepCollection`, `settle`), `pets/interface/pet.presenter.ts` |
| Moments, ouvertures, achats | `modules/billing/application/plus-desire.ts`, `plus.usecases.ts` |
| Rapport | `modules/growth/application/growth-admin.ts`, `apps/admin/src/views/Growth.tsx` |
| App | `features/plus` (`PLUS_REASONS` = `PLUS_TRIGGERS`, `usePlusMoment`, titres), `app/(tabs)/rencontres.tsx`, `app/carte.tsx`, `app/pet/garde-robe.tsx`, `app/rencontre/[userId].tsx`, `app/(tabs)/pet.tsx` |
| UI | `packages/ui/src/organisms/DesireCards.tsx` (`FarAwayCard`, `CollectionBanner`, `TryOnBar`, `WornPremium`), `ItemDetail.secondary` |
| Textes | `locales/plus.ts` (titres), `locales/rencontres.ts` (vu de loin, objet porté), `locales/pet.ts` (essayage, collection), `packages/content/src/v7/vision.ts` (`map.far`) |
| Migration | `supabase/migrations/20261119100000_desir_plus.sql` |

Lien avec le chantier anti-spam (signes) : `wave.usecase.ts` n'est pas touché ici. Une fois ses plafonds fusionnés,
proposer Minimoa+ sur l'erreur « limite de signes atteinte » (déclencheur à ajouter : `wave_limit`) seulement si
Minimoa+ relève vraiment ce plafond, et avec la règle de l'autre chantier comme seule source.
