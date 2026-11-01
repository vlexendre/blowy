# Widgets Blowy (iOS + Android) — nécessite un build natif

Implémentation : `expo-widgets` 58.0.26 (+ `@expo/ui` 58.0.26), doc officielle vérifiée le
2026-11-01 (docs.expo.dev/versions/latest/sdk/widgets) et types du paquet installé.

| Élément | Fichier |
|---|---|
| Config plugin (App Group `group.app.blowy`, widget `BlowyPetWidget`, `enableAndroid: true`) | `apps/mobile/app.config.ts` |
| Widget iOS (SwiftUI via `@expo/ui/swift-ui`, `widgetURL` pour le deep link) | `apps/mobile/src/widgets/BlowyPetWidget.tsx` |
| Widget Android (Glance via `@expo/ui/jetpack-compose`) | `apps/mobile/src/widgets/BlowyPetWidget.android.tsx` |
| Instantané minimal et filtré (pur, testé) | `apps/mobile/src/widgets/snapshot.ts` |
| Synchronisation app → widget (`updateSnapshot`) | `apps/mobile/src/widgets/useWidgetSync.ts` |

Contenu : nom du pet, humeur (texte), série, « {pet partenaire} attend {mon pet} » seulement si
l'autre pet est présent au lieu et le mien absent. Jamais de photo, de message, de prénom humain
ni de lieu réel (écran verrouillé). Tap iOS → `blowy://widget/date/<relationshipId>` ou
`blowy://widget/pet`, réécrit par `app/+native-intent.tsx` vers le Nid.

## Vérifié ici (sans Xcode/Android SDK)
- `expo prebuild --no-install --clean` : cible `ios/ExpoWidgetsTarget` générée (BlowyPetWidget.swift,
  entitlements App Group `group.app.blowy`), `AndroidManifest` avec `APPWIDGET_UPDATE` +
  `blowy_pet_widget_info`. Dossiers natifs supprimés ensuite (régénérés par EAS/`expo run`).
- Registre de layouts expo-widgets construit pour iOS et Android
  (`node_modules/expo-widgets/scripts/build-layout-registry.mjs`) : le composant `'widget'` est
  capturé et sérialisé sans erreur.

## Reste à vérifier sur appareil
1. Compilation Xcode de la cible `ExpoWidgetsTarget` (signature : ajouter l'App Group au profil
   de provisionnement de l'app ET de l'extension `app.blowy.ExpoWidgetsTarget`).
2. Affichage des familles `systemSmall`, `systemMedium`, `accessoryRectangular` ; rythme de mise
   à jour décidé par WidgetKit.
3. Tap → ouverture du bon écran (cold start + app en arrière-plan).
4. **Android : pas d'ouverture d'URL au tap dans le runtime expo-widgets 58** (seules des actions
   de diffusion vers les boutons existent, `WidgetInteractionAction.kt`). Options : (a) attendre
   le support amont ; (b) petit config plugin Kotlin ajoutant un `actionStartActivity` sur la racine
   Glance. Non fait ici (pas de SDK Android pour compiler) — le widget Android s'affiche mais
   n'ouvre pas l'app au tap.
