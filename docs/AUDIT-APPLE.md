# Minimoa face à l'App Review d'Apple — audit avant soumission

Audit indépendant, lu le 15 novembre 2026 sur la branche `wip/soins-garde-robe` (dépôt `/home/claude/blowy`, lecture seule).
Méthode : règles d'Apple relues à la source le même jour (liens et citations ci-dessous), code lu fichier par fichier,
configuration Expo évaluée (`npx expo config --type introspect`, rien d'écrit dans le dépôt), app web exportée et
parcourue avec l'API locale en mémoire (captures dans `/home/claude/work/audit/shots/`).

> **Note sur la photo du jour.** Le propriétaire a décidé le 15 novembre de retirer la « photo du jour » des liens
> (`docs/V7-SPEC.md` §24) ; le code la contient encore pendant qu'un développeur la retire. Cet audit ne relève **rien
> sur cette fonction elle-même**. Mais elle apparaît encore dans des textes qui restent : textes d'autorisation iOS
> (appareil photo, photothèque), politique de confidentialité (§ « Les photos du jour et les souvenirs », § 5, tableau
> des durées), écran « Supprimer mon compte », réponses App Privacy. **Les pages légales et les réponses App Privacy
> devront être relues une fois le retrait fait** (voir B5, M7 et la section App Store Connect).

---

## 1. Verdict

**Non, Minimoa ne passerait pas la revue aujourd'hui.** Le socle est sérieux (connexion Apple officielle, suppression de
compte complète avec révocation du jeton Apple, signalement et blocage, paywall où le montant facturé est bien le prix
le plus visible, aucun SDK de pistage, porte d'âge avant la connexion). Mais six points provoqueraient très
probablement un refus, dont deux empêcheraient même l'examinateur de voir l'app correctement.

### Bloquants, du plus grave au moins grave

| # | Problème | Règle | Qui agit | Effort |
|---|---|---|---|---|
| B1 | L'examinateur ne peut pas atteindre les rencontres, les chats, l'IA du chat, le signalement ni le blocage : connexion Apple seule, aucun compte de démonstration, et rencontres limitées à 1,5 km autour de lui (il n'y a personne) | 2.1(a), 1.2 | Code + propriétaire | 1,5 à 3 j |
| B2 | Les pages légales affichent « À COMPLÉTER » partout (éditeur, adresse, e-mails de contact, hébergeur, fournisseur d'IA…), et le site n'a pas pu être joint | 2.1(a), 1.5, 5.1.1(i), 3.1.2 | Propriétaire + juriste | 0,5 j une fois les infos réunies |
| B3 | « Les objets premium » sont vendus dans Minimoa+ mais jamais donnés aux abonnés ; la garde-robe dit « Bientôt disponible… Pas encore en vente » | 3.1.2(c), 2.3.1, 5.6 | Code | 2 h (retirer) ou 1 j (livrer) |
| B4 | Manifestes de confidentialité incomplets : l'extension des widgets et le module natif lisent le groupe d'apps (`UserDefaults(suiteName:)`) sans raison déclarée ; l'extension n'a aucun `PrivacyInfo.xcprivacy` | Required reason API (refus à l'envoi) | Code | 2 h |
| B5 | Partage avec une IA tierce (Anthropic, États-Unis) sans le dire ni demander l'accord comme l'exige 5.1.2(i) depuis novembre 2025 : photos de preuve envoyées sans accord explicite, bilans de la semaine envoyés sans accord, lecture du chat qui ne dit pas que l'IA est un tiers ; « Rien n'est conservé » non garanti | 5.1.2(i), 5.1.1(i) | Code + juriste | 1 j |
| B6 | Aucun filtrage du contenu publié : messages, prénoms, noms de minimoa, photos de profil passent tels quels | 1.2 (1er point) | Code | 1 à 2 j |

### Décompte des constats

| Gravité | Nombre |
|---|---|
| Bloquant (refus très probable) | 6 |
| Majeur (refus possible ou question de l'examinateur) | 11 |
| Mineur (à corriger, risque faible) | 9 |
| Conforme (vérifié, rien à faire) | 14 |

---

## 2. Les règles utilisées (lues le 15 novembre 2026)

| Source | URL | Ce qu'on en retient |
|---|---|---|
| App Review Guidelines (« Last updated: October 16, 2026 ») | https://developer.apple.com/app-store/review/guidelines/ | citations dans chaque constat |
| Changement du 13 nov. 2025 (5.1.2(i) IA tierce, 4.1(c), 1.2.1(a)) | https://developer.apple.com/news?id=ey6d8onl | « Clarifies that you must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so. » |
| **Nouveaux descripteurs d'âge (2 nov. 2026, actifs le 16 nov. 2026)** | https://developer.apple.com/news/?id=yxkh08us | « Apps that include Dating and Relationships receive a minimum age rating of 18+. » Déclarations obligatoires pour toutes les apps au 12 janvier 2027. |
| Valeurs et définitions des classements d'âge | https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/ | catégories « Messaging and Chat », « User-Generated Content », « In-App Controls : Age Assurance » |
| Exigences d'âge Brésil, Australie, Singapour, Utah, Louisiane (24 fév. 2026) | https://developer.apple.com/news/?id=f5zj08ey | Australie, Singapour, Brésil : Apple bloque le téléchargement des apps 18+ sans confirmation d'âge ; Utah (comptes créés à partir du 6 mai 2026) et Louisiane (1er juillet 2026) : Declared Age Range API |
| Texas SB 2420 (3 juin 2026) | https://developer.apple.com/news/?id=sg176nne | en vigueur le 4 juin 2026 pour les nouveaux comptes Apple au Texas |
| FAQ Age assurance | https://developer.apple.com/support/age-assurance | « In regions where legally required, you need to check the age of the people using your app with the Declared Age Range API. » |
| Abonnements auto-renouvelables | https://developer.apple.com/app-store/subscriptions/ | « the amount that will be billed must be the most prominent pricing element in the layout » ; « your app and App Store metadata must include links to your Terms of Use and Privacy Policy » |
| Suppression de compte | https://developer.apple.com/support/offering-account-deletion-in-your-app/ | « Apps that support Sign in with Apple should use the Sign in with Apple REST API to revoke user tokens. » |
| App Privacy (« étiquettes ») | https://developer.apple.com/app-store/app-privacy-details/ | définitions de « collect », « Precise Location » (« three or more decimal places »), « Sensitive Info » |
| Required reason API | https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api | « apps that don't describe their use of required reason API in their privacy manifest file aren't accepted by App Store Connect » ; « For each executable or dynamic library in an app that uses a required reason API, the bundle … needs to include a privacy manifest file » |
| HIG Sign in with Apple | https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple | « Make a Sign in with Apple button no smaller than other sign-in buttons » |
| HIG Privacy (demandes d'autorisation) | https://developer.apple.com/design/human-interface-guidelines/privacy | « Include only one button and make it clear that it opens the system alert. » ; « don't provide a way for people to leave the screen or window without viewing the system alert » |
| HIG Live Activities (journal : 13 oct. 2026) | https://developer.apple.com/design/human-interface-guidelines/live-activities | « tasks and events that have a defined beginning and end » ; « Avoid displaying sensitive information. » ; « Don't use a Live Activity to display ads or promotions » |

**Ce qui a bougé récemment et compte pour Minimoa**
- Depuis le **16 novembre 2026 (demain)**, le questionnaire d'âge demande si l'app a des fonctions « Dating and
  Relationships » et « Shared Location ». Minimoa répond oui aux deux : **18+ obligatoire**, et au Brésil A18.
- Depuis novembre 2025, 5.1.2(i) nomme explicitement l'**IA tierce** : il faut le dire et obtenir un accord explicite.
- Les lois d'« age assurance » (Texas, Utah, Louisiane ; Australie, Singapour, Brésil) s'appliquent selon les pays où
  l'app est distribuée. **Ambigu :** pour une app réservée aux adultes déjà classée 18+, Apple bloque elle-même le
  téléchargement en Australie, à Singapour et au Brésil, mais dit que le développeur « may still have separate
  obligations ». À faire trancher par le juriste ; le plus simple au lancement est de ne pas ouvrir ces pays-là.
- Pas de règle propre aux apps de rencontre dans les Guidelines, en dehors de 4.3(b) (« dating … well established …
  we will not accept new submissions unless they offer a meaningfully different or improved experience ») et 1.1.4
  (« hookup » apps). Minimoa se distingue nettement (minimoa, vision, habitudes) : risque 4.3 faible.

---

## 3. Constats bloquants

### B1. L'examinateur ne peut pas voir l'essentiel de l'app
- **Règle :** 2.1(a) « include demo account info (and turn on your back-end service!) if your app includes a login… Ensure the demo mode exhibits your app's full features and functionality. » — https://developer.apple.com/app-store/review/guidelines/#app-completeness ; 1.2 (l'examinateur cherche toujours le signalement et le blocage).
- **Constat :**
  - En production, la seule connexion sur iPhone est Apple (`apps/mobile/src/core/adapters/supabase.ts:109`, `docs/CONNEXION.md`). Le code e-mail n'existe qu'en mode local (`app/(onboarding)/connexion.tsx`, `DevEmail`). On ne peut donc pas donner d'identifiants : l'examinateur crée un compte neuf avec son propre identifiant Apple.
  - Le « monde de démo » (Léa, Malo, Sasha…) n'existe qu'en local, en mémoire (`apps/api/src/config/env.ts:62` : `demo` exige `BLOWY_ENV=local` et `BLOWY_ADAPTERS=memory`).
  - Les rencontres demandent des personnes compatibles à moins d'environ 1,5 km (`docs/V7-SPEC.md` §10). L'examinateur est en général aux États-Unis : personne. Les écrans Rencontres et Chats resteront vides ; l'accord de lecture par l'IA, les répliques des minimoas, « Signaler » et « Bloquer » (dans `app/rencontre/[userId].tsx:198` et `app/link/[id]/options.tsx`) sont inatteignables.
- **Pourquoi c'est un risque :** refus classique « We were unable to review your app as it crashed / appears incomplete » ou « we could not locate the reporting mechanism ». Avec un chat entre inconnus et une IA qui lit les messages, Apple voudra le voir.
- **Correctif :** un **compte de revue** côté serveur :
  1. une connexion par e-mail et code, activée en production **seulement** pour une adresse listée dans `apps/api/.env` (par exemple `REVIEW_EMAILS=review@minimoa.app`), cachée derrière un lien discret « J'ai un code de démonstration » sous le bouton Apple (le bouton Apple reste le seul moyen pour le public) ;
  2. à la connexion de ce compte, un monde de démonstration **visible de lui seul** (le `DemoWorld` existant, rebranché sur Supabase) : une rencontre reçue, une rencontre proposée, un lien ouvert avec des messages, l'accord de lecture déjà donné par l'autre personne fictive, une habitude avec preuve demandée, un défi photo ; positions de démonstration recentrées sur la position de l'examinateur, ou ville choisie ;
  3. ces personnes fictives ne doivent **jamais** être montrées à de vrais utilisateurs (`Audience`), sinon c'est de faux profils dans une app de rencontre (5.6) ;
  4. les identifiants dans les notes de revue (section 7).
- **Effort :** 1,5 à 3 jours. **Qui :** code ; le propriétaire crée l'adresse et remplit les notes.

### B2. Pages légales à trous et site injoignable
- **Règles :** 2.1(a) « placeholder text, empty websites, and other temporary content should be scrubbed before submission » ; 1.5 « Make sure your app and its Support URL include an easy way to contact you » ; 5.1.1(i) la politique doit « Confirm that any third party with whom an app shares user data … will provide the same or equal protection » ; page Abonnements : « your app and App Store metadata must include links to your Terms of Use and Privacy Policy ».
- **Constat :** `apps/web/src/config/legal.ts:10-70` : `TODO = 'À COMPLÉTER'` pour la forme juridique, le capital, le SIREN, l'adresse, le téléphone, le directeur de la publication, **les trois e-mails de contact** (assistance, données, sécurité), le DPO, les hébergeurs, le médiateur et **tous les sous-traitants** (dont `ai`). Le site déjà construit (`apps/web/dist/legal/*/index.html`) contient ces « À COMPLÉTER » sur les dix pages. L'app pointe vers ces pages depuis le paywall, la connexion et les réglages (`https://minimoa.app/legal/...`). Depuis l'environnement d'audit, `https://minimoa.app` n'a pas répondu (erreur 502 du proxy) : impossible de dire s'il est en ligne. Le fichier `apps/web/public/.well-known/apple-app-site-association` contient encore `TEAMID.app.blowy`.
- **Incohérence :** l'app affiche `hello@minimoa.app` comme assistance (`packages/content/src/labels.ts:15`), la page Assistance affiche « À COMPLÉTER ».
- **Correctif :** remplir tous les champs, nommer chaque sous-traitant (base et stockage, hébergement de l'API, IA : Anthropic, e-mails, notifications : Expo, carte : Apple), mettre le site en ligne, vérifier chaque lien depuis un iPhone, remplacer `TEAMID`. Vérifier que `hello@minimoa.app` reçoit bien le courrier.
- **Effort :** une demi-journée une fois les informations réunies. **Qui :** propriétaire, juriste.

### B3. Une fonction vendue qui n'est pas livrée : les objets premium
- **Règles :** 3.1.2(c) « Before asking a customer to subscribe, you should clearly describe what the user will get for the price » ; 5.6 « Apps should never … charge for features or content that are not delivered » ; 2.3.1(a) « promoting content or services that it does not actually offer ».
- **Constat :** le paywall liste « Les objets premium » (`packages/content/src/v7/facturation-admin.ts:29`, visible dans `shots/_moi_blowy_plus_390x844.png`). Mais aucun code ne donne ces objets à un abonné : l'entitlement `premiumItems` (`packages/domain/src/entitlements.ts:41`) n'est lu nulle part, et le présentateur marque toujours un objet premium « premium » (`apps/api/src/modules/pets/interface/pet.presenter.ts:48`). La garde-robe dit « Bientôt disponible » et « Cet objet arrive avec Minimoa+. Pas encore en vente : on te prévient dès qu'il l'est. » (`apps/mobile/src/locales/pet.ts:195-246`). Un examinateur qui achète en bac à sable puis ouvre la garde-robe verra que l'avantage n'existe pas.
- **Correctif :** soit retirer `premium_items` de `PLUS_PERKS` et du texte « Toute la carte… objets premium » partout (paywall, description App Store, page `abonnement`) jusqu'à ce que ce soit prêt ; soit livrer : un abonné possède tous les objets `unlock.kind === 'premium'` tant que `hasPlus` est vrai, et la garde-robe le montre.
- **Effort :** 2 h pour retirer, environ 1 jour pour livrer. **Qui :** code.

### B4. Manifestes de confidentialité : l'extension et le groupe d'apps
- **Règle :** « Starting May 1, 2024, apps that don't describe their use of required reason API in their privacy manifest file aren't accepted by App Store Connect. » et « For each executable or dynamic library in an app that uses a required reason API, the bundle … needs to include a privacy manifest file » — https://developer.apple.com/documentation/bundleresources/describing-use-of-required-reason-api
- **Constat :**
  - `apps/mobile/modules/blowy-widgets/ios/BlowyShared.swift:32` : `UserDefaults(suiteName: appGroup)` ; `BlowyWidgetsModule.swift:156` : `UserDefaults.standard`. Ce code est compilé dans l'app **et** dans l'extension des widgets.
  - Lire les `UserDefaults` d'un groupe d'apps demande la raison `1C8F.1` ; les `UserDefaults` de l'app, `CA92.1`.
  - `apps/mobile/targets/widget/` n'a pas de `PrivacyInfo.xcprivacy`. `app.config.ts` ne déclare pas `ios.privacyManifests` (l'introspection rend `privacyManifests: None`) : le manifeste de l'app sera celui du gabarit Expo, qui ne connaît pas le groupe d'apps.
  - Les dépendances qui en ont besoin livrent le leur (React Native, `expo-constants`, `expo-file-system`, `expo-notifications`, `expo-localization`, `expo-application`, `expo-system-ui`, `async-storage`, `react-native-maps`) : bien.
- **Pourquoi :** App Store Connect renvoie alors un refus à l'envoi du binaire (message ITMS-91053 « Missing API declaration »), avant même la revue.
- **Correctif :**
  1. dans `app.config.ts`, `ios.privacyManifests` avec `NSPrivacyTracking: false`, `NSPrivacyAccessedAPITypes` : UserDefaults `CA92.1` et `1C8F.1` (en plus de ce que le gabarit déclare déjà) ;
  2. ajouter `apps/mobile/targets/widget/PrivacyInfo.xcprivacy` (UserDefaults `1C8F.1`, `NSPrivacyTracking` false, aucune donnée collectée) et vérifier que `@bacons/apple-targets` le copie dans la cible ;
  3. après le premier `eas build`, ouvrir le rapport de confidentialité d'Xcode (Organizer › Generate Privacy Report) pour contrôler.
- **Effort :** 2 h. **Qui :** code.

### B5. IA tierce : le dire, demander l'accord, ne pas promettre plus que le contrat
- **Règle :** 5.1.2(i) « You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so. » — https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing
- **Constat :** le fournisseur réel est Anthropic (`apps/api/src/integrations/ai/anthropic-model.ts:10`, modèles `claude-haiku-5-5` / `claude-sonnet-5-5` dans `apps/api/src/config/plateforme.env.ts:23-24`). Trois usages :
  1. **Lecture du chat** : l'accord est bien demandé à chacun et vérifié côté serveur avant tout appel (`apps/api/src/modules/links/minimoas/chat-minimoas.ts:216` et `:282`) — bon. Mais le texte dit seulement « une IA lit vos messages » (`packages/content/src/v7/chat.ts:40-41`) : rien ne dit que c'est un prestataire extérieur, ni lequel, ni où.
  2. **Photos de preuve** : envoyées à l'IA (`apps/api/src/modules/rituels/infrastructure/adapters.ts:36-55`) sans écran d'accord ; seule une ligne sous le viseur (« Aucun humain ne la voit : une IA la vérifie », `apps/mobile/src/locales/rituels.ts:188`). Le texte d'autorisation de l'appareil photo dit même « Une preuve n'est vue par personne » (`apps/mobile/app.config.ts:18`).
  3. **Bilan de la semaine** : texte de la semaine, avec les prénoms des liens (« Avec Léa : … »), envoyé à l'IA (`adapters.ts:86-100`) sans aucun accord.
  - « Rien n'est conservé après » (chat, politique de confidentialité) : vrai chez Minimoa, mais l'API d'un fournisseur d'IA garde en général les requêtes un temps limité (journaux de sécurité) sauf accord particulier de non-conservation. Rien dans le dépôt ne montre un tel accord.
- **Correctif :**
  - Accord du chat : ajouter une phrase « Cette IA est un service d'Anthropic (États-Unis), qui traite les messages pour nous et ne s'en sert pas pour entraîner ses modèles » (à confirmer contractuellement) et le lien vers la politique.
  - Preuves : une feuille d'accord une seule fois, avant la première preuve (« Ta photo est envoyée, réduite, à notre prestataire d'IA Anthropic pour vérifier l'habitude. Aucun humain ne la voit. Supprimée sous 24 h. » · « D'accord » / « Valider sans photo »), retirable dans Moi. Sans accord : validation déclarative.
  - Bilan : remplacer les prénoms par des repères (« [lien1] ») avant l'envoi et les remettre au retour ; alors aucune donnée personnelle ne part, sinon il faut un accord.
  - Texte d'autorisation de l'appareil photo à réécrire (voir M7).
  - Faire confirmer par le juriste et le contrat avec Anthropic la durée de conservation, puis écrire exactement cela (« conservé au plus N jours par le prestataire pour la sécurité, jamais pour entraîner un modèle ») à la place de « rien n'est conservé ».
- **Effort :** 1 jour. **Qui :** code + juriste.

### B6. Pas de filtre sur ce que les gens publient
- **Règle :** 1.2 « apps must include: A method for filtering objectionable material from being posted to the app; A mechanism to report offensive content and timely responses to concerns; The ability to block abusive users from the service; Published contact information » — https://developer.apple.com/app-store/review/guidelines/#user-generated-content
- **Constat :** signalement (avec motif « Personne mineure ») et blocage existent et marchent (bien). Mais aucun filtre :
  - messages : `apps/api/src/modules/links/application/send-message.usecase.ts:48` écrit le texte tel quel ;
  - photos de profil : `apps/api/src/modules/me/application/avatar.usecase.ts:23-32` accepte le fichier sans contrôle ; elles sont révélées aux liens (floues jusqu'au niveau 5) ;
  - prénom et nom du minimoa : texte libre, vus par les personnes présentées.
- **Pourquoi :** dans une app de rencontre, Apple demande en revue « a method for filtering objectionable material ». Les répliques des minimoas (générées par IA) ont, elles, un garde-fou (`cleanMinimoaLine`, `isKindText`) : bien.
- **Correctif :** une liste de mots interdits par langue (insultes, contenus sexuels explicites, haine) appliquée côté API aux messages, prénoms et noms de minimoa (refus avec message neutre, ou masquage) ; une analyse des photos de profil avant publication (service de modération d'images, ou le modèle de vision déjà branché — à déclarer alors comme partage avec une IA tierce, B5) ; dans les règles de la communauté, dire que les contenus sont filtrés.
- **Effort :** 1 à 2 jours. **Qui :** code.

---

## 4. Constats majeurs

### M1. Cinq langues déclarées, une seule écrite
- **Règles :** 2.3 (« Accurate Metadata ») et 2.1(a) (« final versions »).
- **Constat :** `app.config.ts:48` déclare `CFBundleLocalizations: ['fr','en','es','pt','nl']` et des fichiers `locales/en|es|pt|nl.json`, qui contiennent… le texte français des autorisations. `pnpm i18n:list` : **en : 92 textes traduits sur 1 970 ; es, pt, nl : 0**. Sur un iPhone en anglais, l'accueil est en anglais puis tout passe en français dès l'écran suivant (`shots/welcome_en-US.png`, `shots/craft_en-US.png`). L'App Store affichera « Anglais, Espagnol, Néerlandais, Portugais, Français » sur la fiche. Les widgets ont le même défaut (`targets/widget/Localizable.xcstrings`, « à revoir »).
- **Correctif :** pour la première version, ne déclarer que le français (`CFBundleLocalizations: ['fr']`, retirer `en|es|pt|nl` de `locales`, fiche App Store en français seulement) et choisir les pays de vente en conséquence ; rouvrir chaque langue quand elle est traduite. Les examinateurs lisent des apps en français ; ce qui pose problème, c'est d'annoncer ce qui n'existe pas.
- **Effort :** 1 h. **Qui :** code + propriétaire.

### M2. Paywall : conditions et liens sous la ligne de flottaison
- **Règles :** 3.1.2(c) ; page Abonnements (« Full renewal price, shown clearly and prominently » ; liens conditions et confidentialité).
- **Constat :** le prix facturé est bien le plus visible (« 59,88 € par an » en 30 pt, « soit 4,99 € par mois » en 13 pt), l'essai est bien expliqué (« 7 jours gratuits, puis », frise jour 0 / 5 / 7), la croix est visible tout de suite, « Continuer gratuitement » et « Restaurer mes achats » existent (`packages/ui/src/templates/PlusTemplate.tsx`). Mais sur un iPhone de 390 × 844 points, **le bouton d'achat, la mention de renouvellement, la restauration et les liens légaux sont sous le pli** (`shots/_moi_blowy_plus_390x844.png`, `shots/_moi_blowy_plus_375x667.png`) ; la mention de renouvellement est en 13 pt grisé après le bouton.
- **Pourquoi :** refus fréquents quand les conditions de renouvellement ou les liens ne sont pas visibles près du bouton d'achat.
- **Correctif :** une barre fixe en bas : bouton d'achat, une ligne « Renouvellement automatique à 59,88 €/an, annulable à tout moment dans Réglages », puis « Restaurer · Conditions · Confidentialité » ; la frise et les avantages défilent au-dessus.
- **Effort :** une demi-journée. **Qui :** code.

- **Fait (17 novembre 2026)** : barre fixe avec bouton, note (essai, date et prix du premier paiement, renouvellement,
  « Réglages › ton nom › Abonnements »), « Restaurer mes achats · Conditions d'utilisation · Confidentialité ». Détail
  dans « Minimoa+ et App Review » plus bas.

### M3. « On t'envoie un rappel » : seulement si les notifications sont permises
- **Règles :** 3.1.2(a) (« trick users into purchasing a subscription under false pretenses ») ; 5.6.
- **Constat :** la frise promet « Jour 5 — On t'envoie un rappel avant la fin de l'essai » (`packages/content/src/v7/facturation-admin.ts:38`). Le rappel part uniquement en notification push (`apps/api/src/modules/billing/application/billing.jobs.ts:56`). Si la personne a refusé les notifications (proposé pendant l'inscription), elle ne reçoit rien.
- **Correctif :** envoyer aussi un e-mail (l'adresse relais d'Apple fonctionne), ou écrire « On t'envoie un rappel (si les notifications sont activées) ».
- **Effort :** 2 h. **Qui :** code.

### M4. Les avantages de Minimoa+ ne disent pas la même chose d'un écran à l'autre
- **Règles :** 3.1.2(c), 2.3.1(a).
- **Constat :** paywall : « Plus de rencontres chaque jour », « 3 jokers de série par semaine » ; onglet Moi : « 3 rencontres à la fois, la carte, la garde-robe, 2 gels de série. » (`apps/mobile/src/locales/moi.ts:35`) ; Rencontres : « Une rencontre de plus chaque semaine. » (`apps/mobile/src/locales/rencontres.ts:61`). Le code donne +1 rencontre **par jour** et 3 jokers par semaine (`packages/domain/src/entitlements.ts:36-44`).
- **Correctif :** un seul jeu de phrases, tiré des mêmes clés que le paywall ; supprimer « la garde-robe » et « 2 gels ». **Effort :** 1 h. **Qui :** code.

### M5. Classement d'âge et vérification de l'âge
- **Règles :** 2.3.6 « Answer the age rating questions in App Store Connect honestly » ; annonce du 2 nov. 2026 (Dating and Relationships → 18+) ; FAQ Age assurance.
- **Constat :** l'âge est **déclaré** par la personne (roues de date, `app/(onboarding)/naissance.tsx:65-76`), refusé sous 18 ans, sans rien enregistrer, et revérifié par l'API (`too_young`). Après un refus, rien n'empêche de recommencer avec une autre date. Aucune utilisation de l'API Declared Age Range.
- **Correctif :**
  - questionnaire : réponses de la section 7 (18+) ;
  - pays : si les États-Unis sont ouverts, intégrer l'API Declared Age Range (iOS 26.2+) et refuser l'inscription quand Apple indique un mineur, au moins pour le Texas, l'Utah et la Louisiane ; sinon, ne pas ouvrir les États-Unis au lancement. Pour l'Australie, Singapour et le Brésil, Apple bloque le téléchargement des apps 18+ sans confirmation ; obligations propres à faire vérifier par le juriste ;
  - garder sur l'appareil une marque « refusé pour l'âge » pendant 24 h (frein léger contre la nouvelle tentative immédiate).
- **Effort :** questionnaire 15 min ; API 1 jour. **Qui :** propriétaire, juriste, code.

### M6. La position exacte est gardée, la politique dit « arrondie »
- **Règles :** 5.1.1(i) (politique exacte) ; définitions App Privacy (« Precise Location: … same or greater resolution as a latitude and longitude with three or more decimal places »).
- **Constat :** l'app relève la position en précision « Balanced » (`apps/mobile/src/features/map/location.ts:39`) et l'API enregistre `last: { lat: point.lat, lng: point.lng }` tel quel (`apps/api/src/modules/vision/application/locations.ts:50`), en `double precision` (`supabase/migrations/20261115130000_vision.sql:32`). La politique dit « on garde ta dernière position arrondie » ; l'onboarding dit « Arrondie à 300 m » (ce qui est vrai pour ce que voient les autres).
- **Correctif :** arrondir à l'entrée de l'API (grille d'environ 300 m) avant tout enregistrement, ou corriger la politique. Dans App Privacy, déclarer « Localisation précise » tant qu'on garde plus de 2 décimales (voir section 7).
- **Effort :** 2 h. **Qui :** code + juriste.

### M7. Textes d'autorisation iOS : inexacts, et des textes génériques en anglais injectés
- **Règle :** 5.1.1(ii) « Ensure your purpose strings clearly and completely describe your use of the data. »
- **Constat :**
  - Appareil photo (`app.config.ts:18`) : « pour ta photo du jour [retirée] et les preuves de tes habitudes. Une preuve n'est vue par personne » — faux (l'IA tierce la voit) et il manque le défi photo. Photothèque (`:53`) : « ta photo du jour ou ta photo de profil ».
  - L'introspection montre des clés ajoutées par les modules avec un texte anglais générique : `NSLocationAlwaysAndWhenInUseUsageDescription` et `NSLocationAlwaysUsageDescription` (« Allow $(PRODUCT_NAME) to access your location »), `NSMotionUsageDescription`, `NSLocationTemporaryUsageDescriptionDictionary` (expo-location), `NSFaceIDUsageDescription` (expo-secure-store). Minimoa n'utilise ni la position permanente, ni le mouvement, ni Face ID.
- **Correctif :** camera : « Minimoa utilise l'appareil photo pour les preuves de tes habitudes et les défis photo. Une preuve est vérifiée par une IA (aucun humain), puis supprimée sous 24 h. » ; photothèque : « Minimoa accède à la photo que tu choisis pour ta photo de profil. » ; options des modules : `expo-location` avec `locationAlwaysAndWhenInUsePermission: false`, `locationAlwaysPermission: false` (selon les options du module en SDK 58), `expo-secure-store` avec `faceIDPermission: false` ; vérifier le `Info.plist` du build. Traduire si d'autres langues restent déclarées.
- **Effort :** 1 h. **Qui :** code.

### M8. Sans la position, plus de rencontres du tout
- **Règles :** 5.1.1(iv) « Where possible, provide alternative solutions for users who don't grant consent. For example, if a user declines to share Location, offer the ability to manually enter an address. » ; 5.1.2(i) « Your app may not require users to enable system functionalities (such as … location services) in order to access functionality ».
- **Constat :** refuser la position coupe la carte et les rencontres proches (carte « aujourd'hui » de l'accueil, `app/(tabs)/pet.tsx` ; `app/carte.tsx:110-129`) ; le choix d'une ville existe mais seulement avec Minimoa+ (`changeCity`). Le reste de l'app marche.
- **Correctif :** permettre à tout le monde, sans position, de choisir sa ville une fois (liste existante `rencontres.carte.cities`) pour recevoir des rencontres dans cette ville ; Minimoa+ garde « changer de ville quand tu veux ».
- **Effort :** une demi-journée. **Qui :** code.

### M9. Signalements : personne n'est prévenu
- **Règle :** 1.2 « timely responses to concerns ».
- **Constat :** un signalement est seulement écrit en base (`apps/api/src/modules/safety/application/report.usecase.ts:28`) ; l'outil d'administration le montre, mais aucun e-mail ni alerte ne part. La politique promet « objectif : sous 24 h ».
- **Correctif :** e-mail immédiat à l'équipe pour chaque signalement (prioritaire pour « Personne mineure ») ; et, au lancement, quelqu'un qui regarde la file deux fois par jour. Dire dans les notes de revue qui modère et sous quel délai.
- **Effort :** 2 h. **Qui :** code + propriétaire.

### M10. Compte développeur : entité juridique et statut de commerçant (UE)
- **Règles :** 5.1.1(ix) « Apps that … require sensitive user information should be submitted by a legal entity that provides the services, and not by an individual developer » ; règlement européen sur les services numériques (DSA) : statut de « trader » dans App Store Connect.
- **Constat :** l'app ne collecte plus de données sensibles depuis §27 (17 nov. : plus de « ce que tu cherches » ni de « qui tu veux rencontrer »), mais elle met en relation des personnes réelles et vend un abonnement. Le compte doit être celui de la société Avec Trois E (adhésion « Organisation », numéro D-U-N-S), et le nom du vendeur sur l'App Store doit être celui de la société. Pour vendre dans l'UE, le statut de commerçant doit être déclaré (adresse, téléphone, e-mail publiés sur la fiche) ; sans lui, l'app n'est pas proposée dans l'UE.
- **Effort :** quelques jours de démarches. **Qui :** propriétaire.

### M11. Le partage de la position (« Shared Location ») et la sécurité des rencontres
- **Règles :** 1.4 (« If your app behaves in a way that risks physical harm, we may reject it ») ; 5.1.5 « Use Location Services in your app only when it is directly relevant » ; nouveau descripteur « Shared Location ».
- **Constat :** bien fait sur l'essentiel : position arrondie et décalée pour les autres, jamais en direct, mode discret (`docs/V7-SPEC.md` §10), conseil d'urgence dans le signalement (« Appelle le 17 ou le 112 », `apps/mobile/src/locales/chats.ts:317`), page « Sécurité » sur le site. Manque : un rappel de sécurité **dans l'app** au moment où un lien atteint le niveau « IRL » (rendez-vous), et la page Sécurité n'a pas encore son e-mail (B2). L'examinateur d'une app de rencontre regarde ce point.
- **Correctif :** une carte « Avant de vous voir : lieu public, prévenir un proche, partir quand tu veux » au passage du niveau IRL, avec lien vers la page Sécurité.
- **Effort :** 2 h. **Qui :** code.

---

## 5. Constats mineurs

| # | Constat | Règle | Correctif | Effort / qui |
|---|---|---|---|---|
| m1 | `/dev/motion` (banc d'animations) est atteignable en production par lien profond `blowy://dev/motion` : contrairement à `/dev/gallery` (`app/dev/gallery.tsx:408`), il n'a pas de garde `__DEV__` | 2.1(a) (contenu de test) | même garde que la galerie | 5 min, code |
| m2 | `apple-app-site-association` avec `TEAMID` : les liens universels (invitations, « 3 mots ») ne s'ouvriront pas dans l'app | 2.1 | remplacer par l'identifiant d'équipe | 5 min, propriétaire |
| m3 | `aps-environment: 'development'` écrit en dur (`app.config.ts:43`) | 2.5 | normalement remplacé par `production` à la signature App Store ; contrôler les entitlements du `.ipa` | 10 min, code |
| m4 | L'introspection montre `NSAllowsArbitraryLoads: true` (probablement le gabarit de l'introspection, pas le build) | 1.6 | vérifier le `Info.plist` du build ; l'API est en HTTPS | 10 min, code |
| m5 | Activité en direct à venir « série avec X : à toi d'écrire » (§24) : un prénom sur l'écran verrouillé d'une app de rencontre | HIG Live Activities « Avoid displaying sensitive information » | texte neutre (« Un lien t'attend ») ; le prénom seulement dans l'app | 30 min, code |
| m6 | Activité « défi du jour » jusqu'à minuit : peut dépasser 8 h | HIG « don't exceed eight hours » | le système la coupe à 8 h ; acceptable, ou la démarrer plus tard | — |
| m7 | « Minimoa » proche de « Minimoys » (marque d'EuropaCorp, *Arthur et les Minimoys*) | 4.1(c) « You cannot use another developer's … brand, or product name » ; 5.2.1 « Don't use protected third-party material such as trademarks … without permission » | Apple ne bloque en pratique que sur plainte du titulaire ; le vrai risque est juridique (opposition, retrait). Recherche d'antériorité INPI / EUIPO (classes 9, 41, 45) avant le lancement ; ne pas mettre « minimoa » dans le nom ni le sous-titre App Store tant que ce n'est pas tranché | juriste |
| m8 | Visuels (icône, minimoas) au rendu de 3D « stock » ; petite tache à recadrer entre les pieds sur `assets/images/icon.png` | 5.2.1 « Apps should be submitted by the person or legal entity that owns or has licensed the intellectual property » | garder la preuve des droits (contrat, licence, conditions de l'outil de génération) ; retoucher l'icône | propriétaire |
| m9 | Version d'extension : `app.blowy.widget` doit avoir le même numéro de version et de build que l'app | 2.5 (avertissement ITMS-90473) | vérifier dans le premier build EAS | 10 min, code |

---

## 6. Ce qui est conforme (vérifié)

1. **Connexion Apple** : bouton officiel `AppleAuthenticationButton`, type « Continue », blanc sur fond sombre, pleine largeur (`apps/mobile/src/features/session/AppleButton.ios.tsx`). Sur iPhone, Apple est le seul fournisseur : 4.8 ne demande rien de plus. Seul l'e-mail est demandé ; le prénom est demandé ensuite, ce qui est permis (HIG : « describing why you need additional data »).
2. **Suppression du compte** dans l'app (Réglages › Supprimer mon compte, `shots/_moi_supprimer_390x844.png`), complète, immédiate, aussi depuis un compte suspendu ; **révocation du jeton Apple** avant suppression (`apps/api/src/modules/me/application/delete-me.usecase.ts:30-39`) ; l'écran dit que l'abonnement n'est pas annulé automatiquement. Il faut les clés `APPLE_SIGNIN_*` en production, sinon la révocation est ignorée (`docs/CONNEXION.md`).
3. **Signalement et blocage** depuis une rencontre (`app/rencontre/[userId].tsx:198-199`), depuis le lien et sur un message (appui long → `/link/[id]/signaler`), avec motifs dont « Personne mineure ».
4. **Écrans d'avant-autorisation** (position, notifications) : un seul bouton « Continuer » qui ouvre la demande du système, conséquence d'un refus écrite, inscription qui continue après un refus. C'est exactement ce que demande la HIG ; l'absence de « Plus tard » est voulue et correcte.
5. **Notifications** non obligatoires, sans publicité (« Jamais de pub »), heures calmes, réglage par type : 4.5.4 respecté.
6. **Paywall** : montant facturé en plus gros, équivalent mensuel en petit, remise exacte (59,88 € contre 12 × 14,99 € = 179,88 €, soit −67 %), durée de l'essai et prix ensuite, « Continuer gratuitement », croix visible tout de suite, « Restaurer mes achats », « Gérer mon abonnement » pour les membres, prix venant de StoreKit (localisés). Reste M2, M3, M4 et B3.
7. **Achat** : StoreKit 2 via `expo-iap`, transactions vérifiées par signature côté serveur, `appAccountToken`. Le bac à sable est accepté par défaut (`APPLE_ACCEPT_SANDBOX=1`, `apps/api/src/config/facturation-admin.env.ts:14`) : **ne jamais le passer à 0**, les achats de l'examinateur sont des achats bac à sable contre le serveur de production.
8. **Android et web** n'achètent rien (« Disponible sur iPhone ») ; un abonnement acheté sur iPhone suit le compte : 3.1.3(b).
9. **Aucun pistage** : pas de SDK de publicité ni de mesure d'audience ; ATT inutile.
10. **Chiffrement** : `ITSAppUsesNonExemptEncryption: false` (HTTPS seulement), correct.
11. **Pas de demande d'avis maison** (5.6.1) ; pas de fausse urgence ni de compte à rebours ; plus d'écran « promesse » dans l'inscription (17 nov.).
12. **Pas de données sensibles** (§27) : on ne demande plus ce que les gens cherchent ni qui ils veulent rencontrer ; le sexe reste demandé (« je préfère ne pas dire » possible) et ne filtre rien.
13. **Porte d'âge avant la connexion**, rien d'enregistré sous 18 ans, double contrôle côté serveur.
14. **iPad** : `supportsTablet: false` (`app.config.ts:36`) ; l'app tourne en mode compatibilité iPhone, ce qui est accepté. Icône 1024 × 1024 sans transparence ; écran de lancement présent.

**Santé (5.1.3) :** les habitudes (marcher, sport, se coucher tôt…) sont des choix de mode de vie déclarés, sans HealthKit ni mesure : pas des « données de santé » au sens de 5.1.3. Par prudence, ne pas utiliser de mots médicaux dans la fiche. **Jeux de hasard (5.3) :** aucun tirage payant ; les objets se gagnent par paliers. **Mini-apps (4.7) :** non concerné.

---

## 7. À faire dans App Store Connect (propriétaire)

### 7.1 Avant tout
- Compte développeur au nom de la société (M10), accord « Apps payantes » signé, banque et fiscalité remplies, statut de commerçant UE déclaré.
- Identifiant `app.blowy` : Sign in with Apple, Push, App Groups (`group.app.blowy`), Associated Domains ; `app.blowy.widget` : App Groups (`docs/WIDGETS.md`).
- Langue principale : français. Pays : commencer par la France / l'UE francophone si les traductions ne sont pas prêtes (M1) et si la question des États-Unis n'est pas tranchée (M5).

### 7.2 Classement d'âge (questionnaire en vigueur au 16 novembre 2026)
| Question | Réponse | Pourquoi |
|---|---|---|
| Dating and Relationships | **Oui** | l'app fait se rencontrer des personnes réelles ; la nature du lien n'est pas demandée (§27), mais des relations peuvent naître → 18+ minimum |
| Shared Location | **Oui** | les autres voient ta position approximative sur la carte |
| Messaging and Chat | **Oui** | chat entre liens |
| User-Generated Content | **Oui** | prénoms, photos de profil, messages |
| Social Media | Non | pas de fil qui diffuse largement |
| Advertising | Non | |
| Unrestricted Web Access | Non | les liens ouvrent seulement les pages de Minimoa |
| Parental Controls | Non | |
| Age Assurance | Non (déclaration d'âge simple), sauf si l'API Declared Age Range est intégrée | |
| Mature or Suggestive Themes | Infrequent | aucun thème suggestif montré par l'app depuis §27 ; « Infrequent » par prudence (des adultes s'écrivent librement), « None » défendable : décision du propriétaire |
| Alcohol, Tobacco, or Drug Use or References | Infrequent | « apéro », 🍻 dans quelques textes |
| Profanity or Crude Humor | None (le contenu des gens est couvert par UGC) | |
| Sexual Content or Nudity | None | |
| Horror, violence, armes | None | |
| Medical or Treatment Information | None | |
| Health or Wellness Topics | None (ou Infrequent si la fiche parle de bien-être) | habitudes de vie |
| Gambling, Simulated Gambling, Contests, Loot Boxes | None | |
| **Résultat attendu** | **18+** (Brésil : A18) | |

Et dans la fiche, les visuels doivent rester « 4+ » (2.3.8) : pas de scène suggestive dans les captures.

### 7.3 App Privacy (étiquettes) — d'après les flux réels du code
« Tracking » : **non** pour tout. Toutes les données ci-dessous sont **liées à l'identité**.

| Catégorie Apple | Type | Collecté ? | Finalités |
|---|---|---|---|
| Contact Info | Email Address | Oui (relais Apple possible) | App Functionality |
| Contact Info | Name | Oui (prénom ou surnom) | App Functionality |
| Location | **Precise Location** (tant que M6 n'est pas corrigé) ; Coarse Location si l'API arrondit à moins de 3 décimales avant d'enregistrer | Oui | App Functionality |
| Sensitive Info | Sensitive Info | **Non** (depuis §27 : plus de « qui tu veux rencontrer » ; anciennes réponses effacées par `20261117130000_sans_recherche.sql`) | — |
| User Content | Emails or Text Messages (chat) | Oui | App Functionality |
| User Content | Photos or Videos (photo de profil, preuves d'habitude, défis photo ; photos du jour tant qu'elles existent) | Oui | App Functionality |
| User Content | Customer Support | Oui (e-mails) | App Functionality |
| User Content | Other User Content (réponses au test de vision et aux questions du jour, habitudes, « 3 mots », texte des signalements) | Oui | App Functionality, Product Personalization |
| Identifiers | User ID | Oui | App Functionality |
| Purchases | Purchase History | Oui | App Functionality |
| Usage Data | Product Interaction (soins, séries, défis, rencontres acceptées ; sert aussi aux statistiques de l'administration) | Oui | App Functionality, Analytics |
| Other Data | Other Data Types (date de naissance, sexe) | Oui | App Functionality |
| Diagnostics | — | Non, tant qu'aucun outil de rapport de plantage n'est ajouté | |
| Health & Fitness | — | Non (habitudes déclarées, pas de mesure) ; à revoir si une habitude « sport » enregistre des mesures | |

Les données envoyées à Anthropic, Expo (notifications) et à l'hébergeur sont déjà couvertes par les lignes ci-dessus (prestataires) : pas de ligne à part. **À relire une fois la photo du jour retirée** (ligne Photos) et une fois B5/M6 corrigés.

### 7.4 Abonnements
- Groupe « Minimoa+ » ; trois produits dans le même groupe, même niveau : `app.blowy.plus.yearly` (1 an, 59,88 €, essai gratuit 1 semaine en offre d'introduction), `app.blowy.plus.monthly` (1 mois, 14,99 €, sans essai) et `app.blowy.plus.weekly` (1 semaine, 2,99 €, sans essai) (`docs/BLOWY-PLUS.md`).
- Pour chacun : nom affiché et description dans chaque langue de la fiche ; **capture du paywall** pour la revue ; notes de revue.
- **Le premier abonnement doit être joint à la version soumise** (page de la version › « In-App Purchases and Subscriptions » › sélectionner les trois ; l'hebdomadaire, nouveau, passe en revue avec la version qui l'affiche), sinon l'examinateur ne trouve pas les produits (2.1(b)).
- Notifications serveur App Store v2 vers `https://<API>/v1/plus/apple/notifications` (production et bac à sable).

### 7.5 Adresses obligatoires
- **Politique de confidentialité** : `https://minimoa.app/legal/confidentialite` (champ App Privacy) — complète (B2).
- **Assistance (Support URL)** : `https://minimoa.app/legal/assistance`, avec un e-mail réel.
- **Conditions d'utilisation (EULA)** : soit le champ « Licence Agreement » personnalisé avec les conditions de Minimoa, soit le contrat standard d'Apple **et** un lien « Conditions d'utilisation : https://minimoa.app/legal/conditions » à la fin de la description (refus 3.1.2 fréquent sinon). Ajouter aussi le lien des conditions Minimoa+ (`/legal/abonnement`).
- Fiche : pas de prix dans le nom, le sous-titre ni les captures (2.3.7) ; captures de l'app en usage (2.3.3) ; ne promettre que ce qui existe (pas « objets premium » tant que B3 n'est pas réglé).

### 7.6 Texte pour les notes de revue (à adapter une fois B1 fait)
> Minimoa is a French app for adults (18+) to get to know compatible people nearby; what those connections become is up to them. Each user raises a small
> creature ("minimoa") that represents their outlook on life and introduces them only to people whose outlook is
> compatible (score above 70%).
>
> **Demo account.** Sign in with Apple is the only public sign-in. For review, tap "J'ai un code de démonstration"
> below the Apple button, enter `review@minimoa.app`, then the code `<code>`. This account comes with sample data visible
> only to it: an incoming introduction (Rencontres tab), an open chat with "Léa" (Chats tab), a pending habit proof
> and today's challenge (Mon minimoa tab). You can also create your own account with Sign in with Apple.
>
> **Language.** The app is in French. Main tabs: Mon minimoa (home) · Chats · Rencontres (introductions) · Moi (profile,
> settings).
>
> **Age.** Date of birth is asked before sign-in; under 18 the sign-up stops and nothing is stored. The server checks
> the age again.
>
> **Location.** Used only while the app is open, to find compatible people within about 1.5 km. Others see a position
> rounded to about 300 m and shifted, never in real time; "Mode discret" (Moi) hides you from the map. If location is
> refused, the app keeps working [and lets you choose a city].
>
> **AI (third party: Anthropic).** (1) In a chat, an AI reads a short window of recent messages so the creatures can
> react — only if BOTH people agree on the consent sheet shown at first opening (Chat › "…" › Minimoas). (2) Habit proof
> photos are checked by the AI after a one-time consent; no human sees them; deleted within 24 h. (3) Weekly summaries
> are rephrased by the AI without names.
>
> **Safety.** Report and block: from any introduction (Rencontres › person › "Signaler ou bloquer") and in a chat
> (… menu, or long-press a message › "Signaler ce message"). Reports reach our moderation team by e-mail and are handled
> within 24 h. Contact: `<e-mail>`. Account deletion: Moi › Réglages › Supprimer mon compte (immediate; revokes the
> Sign in with Apple token).
>
> **Subscription Minimoa+.** Moi › Minimoa+, or after sign-up. Yearly €59.88 with a 7-day free trial, monthly €14.99,
> weekly €2.99 (monthly and weekly without a trial); prices are read from StoreKit. The yearly discount badge compares
> the yearly price with twelve monthly payments only, never with the weekly plan. Purchases are verified by our server;
> sandbox purchases are accepted. "Restaurer mes achats" is on the same sheet. Subscribers get a reminder 2 days before
> the end of the trial (date, amount, how to cancel), and service messages for a failed payment or the end of the
> subscription; there is no countdown, no fake urgency and nothing is required to keep using the free app.
>
> **Widgets and Live Activities.** Home/Lock Screen widgets show the creature, its mood and the streak. A Live Activity
> starts when the user accepts the daily challenge and ends at midnight.

---

## 8. Ce qui n'a pas pu être vérifié ici

- **Build natif** : aucun Mac ni build EAS ; le code Swift des widgets n'a jamais été compilé (`docs/WIDGETS.md` le dit). Le manifeste de confidentialité final, les entitlements signés (`aps-environment`), le numéro de version de l'extension et le `Info.plist` réel (ATS, textes génériques) sont à contrôler sur le premier `.ipa`.
- **Sur appareil** : connexion Apple réelle (adresse relais, `authorizationCode`), achat et restauration en bac à sable, rappel d'essai, notifications push, widgets et activités en direct, caméra des preuves, carte Apple, performances et plantages, affichage en mode compatibilité sur iPad, tailles de texte d'accessibilité.
- **Site** : `https://blowy.app` n'a pas répondu depuis l'environnement d'audit (502) ; je n'ai lu que les pages construites dans `apps/web/dist`.
- **App Store Connect** : fiche, captures, mots-clés, prix, pays, questionnaire d'âge, étiquettes : rien n'est visible d'ici.
- **Contrats** : contrat avec Anthropic (conservation, entraînement, transfert hors UE), droits sur les visuels, recherche de marque « minimoa ».
- **Modération réelle** : qui traite les signalements, à quel rythme.
- **Retrait de la photo du jour** : en cours ; à relire ensuite (textes d'autorisation, politique, écran de suppression, App Privacy).

## Minimoa+ et App Review (revu le 17 novembre 2026)

Règles relues à la source ce jour : App Review Guidelines 3.1.1, 3.1.2(a)(b)(c), 2.3.1, 2.3.2, 5.1.1(i), 5.6 (version du
16 octobre 2026) ; Schedule 2 §3.8(b) ; page « Auto-renewable subscriptions » ; HIG « Apple In-App Purchase » (17
septembre 2026) ; EULA standard ; chemin d'annulation (support Apple). Ce que la feuille Minimoa+ respecte désormais :

- Le **montant facturé** de chaque offre et sa période est le prix le plus grand (montant en 20 à 23 pt dans chaque
  carte, période juste dessous ; feuille refaite le 18 novembre, `docs/PAYWALL.md`) ; équivalent mensuel et remise en
  13 pt, calculés sur les prix StoreKit ; le bouton répète l'action et le prix (« Commencer mes 7 jours gratuits » /
  « puis 59,88 € par an »).
- **Trois offres** (17 novembre) : trois cartes côte à côte, l'annuelle à gauche, choisie par défaut, avec la pastille
  de remise. La remise de l'annuelle se calcule contre douze mensualités seulement (jamais contre 52 semaines de
  l'hebdomadaire, comparaison qui serait trompeuse) ; l'hebdomadaire n'a ni équivalent mensuel ni pastille ; sa période
  est écrite en clair (« 2,99 € par semaine ») sur la case, dans le bouton (« M’abonner : 2,99 € par semaine ») et sous
  le bouton (renouvellement automatique, où annuler).
- **Prix et essai de StoreKit seulement** sur iPhone (`features/plus/index.tsx`, `core/adapters/storekit.ios.ts`) : si le
  magasin ne répond pas, ni prix ni bouton d'achat, « Réessayer » ; un essai n'est annoncé que si l'offre d'introduction
  StoreKit est un essai gratuit et que la personne y a droit.
- Dans et sous le bouton : durée de l'essai, prix ensuite **et date du premier paiement**, renouvellement automatique, où
  annuler (« Réglages › ton nom › Abonnements ») ; frise verticale (aujourd'hui → rappel du jour 5 → premier paiement,
  ou sans essai : paiement → renouvellement → annulable) ; mention complète sur la page « Conditions de Minimoa+ ».
- « Restaurer mes achats », « Conditions d'utilisation » et « Confidentialité » toujours visibles, liens construits par
  l'app (présents même si l'API ne répond pas) ; les conditions du site renvoient au contrat de licence standard d'Apple.
- Croix active dès l'ouverture, « Continuer gratuitement », paywall de l'inscription passable ; l'app reste gratuite.
- **Toute la feuille tient sur un écran, sans défiler** (390 × 844 et 375 × 667, fr/en/es/pt/nl, tous les états ; avec
  trois offres, revérifié le 17 novembre en retranchant les marges de sécurité d'un vrai iPhone : 375 × 647 et
  390 × 771 sur le web ; refait le 18 novembre après la refonte : 8 pt de marge au plus juste ; sur un petit écran, une
  seule pose du minimoa et un seul avantage puis « Et N de plus ») ; la mention
  longue de renouvellement est sur la page « Conditions de Minimoa+ », liée dans la feuille ; pas d'interrupteur
  d'essai, pas d'urgence.
- Membre : état et « Gérer mon abonnement » (feuille système), aucune relance d'achat.

Reste au propriétaire (App Store Connect) : noms affichés et localisations du groupe (dont l'hebdomadaire), capture de
revue de la feuille sur iPhone pour chacun des trois abonnements, EULA standard + liens à la fin de la description
(`docs/APP-STORE-CONNECT.md` §4-5).

Messages autour de l'abonnement (17 novembre, `docs/FIDELISATION.md`) : rappel 2 jours avant la fin de l'essai (date,
montant, comment annuler), bienvenue, paiement refusé (avec « Gérer mon abonnement »), au revoir sans pression (ce qu'on
garde gratuitement), une seule relance un mois après, sans offre tant qu'aucune n'existe dans App Store Connect ; aucune
fausse urgence, aucun « ton minimoa va mourir » (3.1.2, 5.6 et règles des pratiques trompeuses). Reste à vérifier sur iPhone
en bac à sable : lecture de l'essai par `expo-iap`, feuille de gestion. Risque connu : le rappel du jour 5 écrit le prix
de référence en euros (à corriger avant une vente hors zone euro).

## 9. Ordre conseillé

1. B4 (2 h), B3 (2 h), M4 et M7 (2 h), m1, m2 — tout ce qui est court.
2. B5 et B6 (2 à 3 jours), M6, M3, M9.
3. B1 compte de revue (2 à 3 jours).
4. B2, M10, M5 côté propriétaire et juriste, en parallèle.
5. M2 et M8 (1 jour), M1 (décision de langues).
6. Build TestFlight, passage complet sur iPhone avec la liste de la section 8, puis soumission avec les notes de 7.6.
