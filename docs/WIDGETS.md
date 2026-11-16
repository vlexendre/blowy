# Widgets iOS et activités en direct (spéc §19)

Ce qui existe : deux widgets d'écran d'accueil (petit, moyen), deux widgets d'écran verrouillé (rond, rectangulaire)
et trois activités en direct (Dynamic Island et écran verrouillé) : le défi du jour accepté, la série d'un lien le soir
(« À toi d'écrire » avant minuit, sans prénom sur l'écran verrouillé ; spéc §24), une sortie en cours. Rien sur Android, sur le web ni dans Expo Go : le pont JavaScript n'y fait rien.

## Comment c'est construit

| Où | Quoi |
| --- | --- |
| `apps/mobile/targets/widget/` | L'extension (SwiftUI, WidgetKit, ActivityKit), décrite par `expo-target.config.js`. |
| `targets/widget/Pets.xcassets` | Les minimoas réduits pour l'extension (versionnés). Régénérer : `python3 apps/mobile/scripts/widget-pets.py`. |
| `targets/widget/Localizable.xcstrings` | Les textes de l'extension (fr, en, es, pt, nl ; hors français : texte français marqué « à revoir »). |
| `targets/widget/Generated/` | Recréé à chaque prebuild, non versionné : le modèle partagé et les couleurs de `@blowy/tokens`. |
| `targets/widget/PrivacyInfo.xcprivacy` | Manifeste de confidentialité de l'extension (UserDefaults du groupe d'apps, raison `1C8F.1` ; rien de collecté). Repris par le groupe synchronisé de la cible. Celui du module local est `modules/blowy-widgets/ios/PrivacyInfo.xcprivacy` (pod `BlowyWidgets_privacy`), celui de l'app `ios.privacyManifests` (`app.config.ts`). |
| `plugins/with-ios-release.js` | Après `@bacons/apple-targets` : l'extension en iPhone seulement comme l'app, même version que l'app (sinon le prebuild échoue). |
| `apps/mobile/modules/blowy-widgets/` | Module Expo local (iOS) : écrit l'état des widgets, démarre / met à jour / termine les activités, remonte les jetons APNs. |
| `modules/blowy-widgets/ios/BlowyShared.swift` | **Le** modèle partagé app ↔ extension (état des widgets, `BlowyActivityAttributes`). |
| `apps/mobile/plugins/with-blowy-widgets.js` | Plugin Expo : copie le modèle partagé et génère les couleurs dans `Generated/`, met le projet Xcode en français. |
| `apps/mobile/src/core/widgets.ts` | Pont JavaScript typé (`widgets.publish`, `widgets.activities.start/update/end/list/onToken`). |
| `apps/mobile/src/features/widgets/` | Ce qu'on montre (pur, testé) et le hook `useWidgetSync`, appelé dans `app/(tabs)/_layout.tsx`. |
| `packages/contract/src/v7/plateforme.ts` | `LiveActivityAttributesZ`, `LiveActivityStateZ`, `LIVE_ACTIVITY_ATTRIBUTES_TYPE` : le format des push d'activité ; `RegisterDeviceBody.kind`/`liveActivity`. |

**Outil retenu : [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets) 5.0.0** (Expo SDK 53+,
Xcode 16+). Il crée la cible d'extension au `expo prebuild` à partir de fichiers Swift ordinaires, avec ses
entitlements et sa déclaration pour les identifiants EAS. Écarté : [`expo-widgets`](https://docs.expo.dev/versions/v58.0.0/sdk/widgets/)
(officiel, mais les widgets s'y écrivent en JSX `@expo/ui` exécuté dans un runtime isolé, sans Swift ni catalogue de
textes ; annoncé [en alpha](https://expo.dev/blog/home-screen-widgets-and-live-activities-in-expo)) ;
`expo-live-activity` 0.4 et `react-native-widget-extension` 0.3 (activités seules ou peu suivis).

### Les données : l'app publie, le widget déroule

Le widget **n'appelle jamais l'API** : il n'a ni le jeton de la personne ni de raison de l'avoir. À chaque
changement des données déjà lues (pet, série, défi du jour), et seulement app au premier plan (Apple ne compte alors
pas les rechargements, voir [Keeping a widget up to date](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date)),
l'app calcule avec les règles du domaine (`decayNeeds`, `shapeOf`) une suite de moments : maintenant, toutes les 2 h
sur 24 h, et minuit (le défi repart, la série tombe sans joker). Elle les écrit en JSON dans le groupe d'apps et
recharge les deux widgets **si le contenu a changé**. L'extension montre le moment en cours, sans règle ni réseau
(`policy: .never`). Si l'app n'est pas rouverte, le widget continue de dérouler la journée prévue puis garde le
dernier moment.

Les activités sont démarrées par l'app (au premier plan, comme l'exige ActivityKit), une seule fois par clé
(`challenge:<jour>`, `link:<lien>:<jour>`) même si la personne les retire ; mises à jour et terminées par l'app au fil
des lectures (défi relevé → « Défi relevé » 15 min ; tu as écrit dans le lien → « Vous vous êtes écrit » 10 min ; minuit → retirée). L'activité d'un lien ne démarre dans
l'app que le soir (19 h – 22 h, Paris, comme le rappel du serveur), quand l'autre a écrit aujourd'hui et pas toi : la plus
longue série en jeu d'abord.
Pour la sortie : `startOuting(pet)` / `endOuting()` (`src/features/widgets`) sont prêts pour l'écran de la sortie.

Liens profonds : widgets et défi → `blowy://pet` ; série d'un lien → `blowy://link/<id>`.

## À faire dans le portail Apple (une fois)

L'identifiant d'équipe est sur <https://developer.apple.com/account> › Membership.

1. **Groupe d'apps** : Certificates, IDs & Profiles › Identifiers › App Groups › `+` → `group.app.blowy`
   (ou `group.<BLOWY_BUNDLE_ID>` si l'identifiant de l'app change).
2. **Identifiant de l'app `app.blowy`** : cocher *App Groups* (y ajouter `group.app.blowy`) et *Push Notifications*.
3. **Identifiant de l'extension `app.blowy.widget`** : EAS le crée au premier build ; cocher *App Groups* →
   `group.app.blowy`. Pas de push pour l'extension.
4. Lancer le premier `eas build` **en interactif** (connexion au compte Apple) : EAS
   [synchronise les capacités](https://docs.expo.dev/build-reference/ios-capabilities/) depuis les entitlements et
   peut créer puis affecter le groupe d'apps lui-même ; avec une clé d'API App Store Connect seule, il ne le peut pas
   (faire alors les étapes 1 à 3 à la main). Il génère aussi le profil de l'extension (déclarée par
   `@bacons/apple-targets` dans `extra.eas.build.experimental.ios.appExtensions`).
5. Pour les push d'activité (plus tard, côté API) : Keys › `+` › *Apple Push Notifications service (APNs)* → fichier
   `.p8`, son Key ID et le Team ID, à mettre dans `apps/api/.env` seulement.

Option : `APPLE_TEAM_ID=XXXXXXXXXX` dans l'environnement du build fait signer l'extension par la même équipe hors EAS
(sinon `@bacons/apple-targets` affiche un avertissement, sans effet sur EAS).

## Construire et tester sur un iPhone

Les widgets et les activités ne marchent ni dans Expo Go ni sur le web.

```bash
cd apps/mobile
eas build --profile development --platform ios   # client de dev, installé par QR code
# ou, sur un Mac avec Xcode 16+ :
npx expo prebuild --platform ios --clean && npx expo run:ios --device
```

Pour déboguer l'extension sur un Mac : ouvrir `ios/Blowy.xcworkspace`, schéma **BlowyWidget**, lancer sur
l'iPhone (Xcode propose de choisir le widget ou l'activité). Les fichiers Swift sont dans le groupe `expo:targets`.
Ne pas les modifier dans `ios/` : `prebuild --clean` repart de `targets/widget`.

### À regarder au premier lancement

- [ ] Le build passe ; dans l'iPhone, Réglages › Minimoa montre « Activités en direct ».
- [ ] Ouvrir l'app connecté, aller sur l'accueil, puis ajouter le widget **petit** et **moyen** : le bon minimoa (espèce),
      la bonne forme (en forme / bof / boude, panneau lie-de-vin quand il boude), sociabilité, série, défi.
- [ ] Galerie des widgets : noms « Ton minimoa » et « Ta série », aperçu avec Nino.
- [ ] Écran d'accueil en mode **sombre**, **clair**, puis **teinté** et **transparent** (iOS 18+ : appui long ›
      Modifier › Personnaliser) : textes lisibles, minimoa en gris teinté, pas de carré plein.
- [ ] Écran verrouillé : widget **rond** (visage dans la jauge) et **rectangulaire** (série, défi).
- [ ] Toucher chaque widget ouvre l'accueil de l'app.
- [ ] Accepter le défi du jour : l'activité apparaît (île compacte : visage + temps restant ; appui long : île
      déployée avec « Y aller » ; écran verrouillé : bannière, barre qui se vide jusqu'à minuit, « Série de N en jeu »).
- [ ] Relever le défi : « Défi relevé », puis l'activité s'efface au bout de 15 min. La retirer à la main, rouvrir
      l'app : elle ne revient pas le même jour.
- [ ] Le soir (19 h – 22 h), un lien t'a écrit et pas toi : « À toi d'écrire » (jamais de prénom sur l'écran
      verrouillé), série en jeu ; « Écrire » ouvre le chat ; y écrire montre « Vous vous êtes écrit » puis l'activité
      s'efface.
- [ ] Défi accepté le matin (9 h) : la carte affiche « avant minuit », passe en état périmé à 17 h et l'app la retire à
      la première ouverture après 17 h ; elle n'est pas relancée le même jour.
- [ ] Se déconnecter : les widgets passent sur « Ouvre Minimoa », les activités disparaissent.
- [ ] Mode avion pendant une heure : le widget avance seul (la sociabilité baisse), sans appeler le réseau.

## Push des activités (côté API)

**Fait côté API** (intégration V7, `apps/api/README.md` « Activités en direct iOS ») : jetons rangés à part
(`live_activity_tokens`), adaptateur APNs (variables `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_ENVIRONMENT`),
série d'un lien démarrée par push avec le rappel du soir `your_turn`, défi seulement `update` / `end`. Une fois l'API déployée avec la clé, mettre
`EXPO_PUBLIC_LIVE_ACTIVITY_PUSH=1` dans les profils de `apps/mobile/eas.json`. L'app envoie
`liveActivity.linkId` avec le jeton `update` d'une activité `link` (lu dans l'URL de l'activité) : écrire dans un lien ne
termine que l'activité de ce lien.

**Ce que l'app enverra** à `POST /v1/devices` (`RegisterDeviceBody`) :
`{ token, platform: 'ios', timeZone, kind: 'apns_live_activity', liveActivity: { use: 'start' } }` pour le jeton
« push-to-start » (iOS 17.2+, un par appareil, peut changer), et
`{ …, liveActivity: { use: 'update', activity: 'challenge' | 'link' | 'outing', activityId, linkId? } }` pour chaque activité en
cours (un jeton par activité, qui peut changer pendant sa vie). Jetons en hexadécimal.

**Ce que l'API doit faire** (`LiveActivityPusher`, `apps/api/src/integrations/push/live-activity.ts`) :

- Ranger `kind`, `use`, `activity`, `activityId` (le contrôleur écrit aujourd'hui `kind: 'expo'` en dur ; une
  migration pour les trois autres champs). Remplacer l'ancien jeton `update` d'une même activité ; oublier les jetons
  `update` après la fin de l'activité ; désactiver un jeton sur réponse APNs 410 / `BadDeviceToken`.
- Envoyer en HTTP/2 à `https://api.push.apple.com/3/device/<jeton>` (builds de développement :
  `api.sandbox.push.apple.com`), authentification par jeton (JWT ES256 signé avec la clé `.p8`), en-têtes
  `apns-push-type: liveactivity`, `apns-topic: app.blowy.push-type.liveactivity`, `apns-priority: 10` pour un
  démarrage, une fin ou un changement important, `5` sinon (hors budget).
- `aps.content-state` = `LiveActivityStateZ`, `aps.attributes` = `LiveActivityAttributesZ`, clés exactes, **dates en
  secondes Unix** (ActivityKit décode sans stratégie : une date ISO ou un champ en trop fait échouer la mise à jour).
  4 Ko au plus en tout.

```jsonc
// Démarrer (jeton use = start). iOS 18+ : "input-push-token": 1 renvoie un jeton update à l'app.
{ "aps": { "timestamp": 1794757320, "event": "start",
  "attributes-type": "BlowyActivityAttributes",
  "attributes": { "kind": "link", "pet": { "name": "Nino", "species": "nino" }, "startedAt": 1794757320,
                  "url": "blowy://link/<linkId>" },
  "content-state": { "endsAt": 1794783600, "streak": 4, "title": null, "done": false },
  "stale-date": 1794783600, "relevance-score": 75, "input-push-token": 1,
  "alert": { "title": "Un lien t’attend", "body": "À toi d’écrire avant minuit." } } }
// Mettre à jour (jeton use = update de cette activité)
{ "aps": { "timestamp": 1794760000, "event": "update", "stale-date": 1794783600,
  "content-state": { "endsAt": 1794783600, "streak": 12, "title": "Un café dehors", "done": false } } }
// Terminer (laisser l'état final 15 min)
{ "aps": { "timestamp": 1794770000, "event": "end", "dismissal-date": 1794770900,
  "content-state": { "endsAt": 1794783600, "streak": 13, "title": "Un café dehors", "done": true } } }
```

Correspondance avec le notifieur (`event: 'start'` sur `your_turn`) : **aucun prénom** dans les attributs ni dans
l'alerte (écran verrouillé visible de tous ; textes neutres `auditText.lockScreen`), `endsAt` ISO → secondes, `streak` (série du lien mis en avant) → `streak`, nom et espèce du minimoa lus par l'API. Démarrer par push
**seulement la série d'un lien** : l'activité du défi n'a de sens qu'une fois le défi accepté, dans l'app ; côté défi, se
contenter de `update` (série en danger) et `end` (minuit). Référence :
[Starting and updating Live Activities with ActivityKit push notifications](https://developer.apple.com/documentation/activitykit/starting-and-updating-live-activities-with-activitykit-push-notifications).

## Risques connus

- **Jamais compilé ici** (pas de Mac) : le premier build sur Mac/EAS peut révéler des erreurs Swift dans les vues.
  Vérifié : prebuild (cible, entitlements, Info.plist), modèle partagé compilé (Swift 6.2, mode 5) et décodé contre le
  JSON produit par le TypeScript, typecheck et tests du TypeScript, exports iOS et web.
- **8 heures au plus** par activité ([Apple](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities)) :
  un défi accepté le matin affiche minuit (sa vraie échéance), mais son activité est périmée 8 h après son début
  (`staleDate` = `BlowyActivityAttributes.staleDate(for:)`, plus tôt de minuit et début + 8 h) et l'app la retire à
  ce moment-là (`decideRunning`, `ACTIVITY_MAX_SECONDS`) ; elle n'est pas relancée le même jour. Côté API, le jeton
  d'une activité expire aussi au plus 8 h après son enregistrement (`endExpired`).
- **Minuit = minuit à Paris** (le jour du défi est celui du serveur) : décalé pour quelqu'un dans un autre fuseau.
- Après minuit sans ouvrir l'app, la série affichée suppose « joker restant → la série tient, sinon zéro » ; corrigée à
  la prochaine ouverture.
- iOS 16.4 à 16.x : l'app tourne, mais ni widgets ni activités (extension en iOS 17+). Teinte des images : iOS 18+.
- Le groupe d'apps suit l'identifiant : `group.<BLOWY_BUNDLE_ID>`. Changer l'identifiant demande un nouveau groupe.
- Le motif `ios` du `.gitignore` est contourné pour `apps/mobile/modules/*/ios` : vérifier que
  `git ls-files apps/mobile/modules` liste bien les trois fichiers Swift/podspec avant un build EAS.
- `aps-environment` est maintenant dans les entitlements de l'app : EAS active Push Notifications sur `app.blowy`.
