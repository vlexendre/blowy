# Blowy+ : ce qu'il faut créer côté Apple, et comment tester

Blowy+ est vendu en achat intégré Apple et vérifié directement par notre API (aucun intermédiaire payant).
L'API vérifie localement les transactions signées par Apple ; elle n'a besoin d'aucune clé secrète pour cela.

## Les offres

| Offre | Identifiant produit (par défaut) | Prix | Essai |
|---|---|---|---|
| Annuelle | `app.blowy.plus.yearly` | 59,88 € par an | 7 jours gratuits (offre d'introduction) |
| Mensuelle | `app.blowy.plus.monthly` | 14,99 € par mois | aucun |

Les identifiants sont des réglages (`PLUS_PRODUCT_YEARLY`, `PLUS_PRODUCT_MONTHLY`) : s'ils changent dans App Store
Connect, les changer aussi dans `apps/api/.env`. Les prix réellement affichés viennent de StoreKit (localisés) ;
l'API ne fournit que des prix de repli.

## 1. Dans App Store Connect

1. **Contrat** : « Accords, taxes et banques » → accord des Apps payantes signé, coordonnées bancaires et fiscales
   remplies (sans cela, aucun achat ne fonctionne, même en bac à sable).
2. **Groupe d'abonnements** : Mon app → Monétisation → Abonnements → créer le groupe **Blowy+**. Les deux offres
   doivent être dans **le même groupe** (on ne peut avoir qu'un abonnement actif à la fois, et passer de l'un à l'autre).
3. **Les deux abonnements** dans ce groupe :
   - Référence « Blowy+ annuel », identifiant produit `app.blowy.plus.yearly`, durée **1 an**, prix 59,88 € (France ;
     laisser Apple calculer les autres pays ou les fixer), nom affiché et description en français (et EN, ES, PT, NL).
   - Référence « Blowy+ mensuel », identifiant `app.blowy.plus.monthly`, durée **1 mois**, prix 14,99 €.
   - Niveaux de service dans le groupe : annuel et mensuel au même niveau (mêmes avantages).
   - Ajouter une capture du paywall pour la revue de chaque abonnement.
4. **L'essai gratuit** : sur l'abonnement annuel → Prix de l'abonnement → « Configurer une offre d'introduction » →
   type **Essai gratuit**, durée **1 semaine**, tous les pays. Aucune offre sur le mensuel.
5. **Notifications serveur** : Mon app → Informations sur l'app → « Notifications du serveur App Store » →
   **Version 2** pour les deux URL :
   - Production : `https://<domaine de l'API>/v1/plus/apple/notifications`
   - Bac à sable : la même URL (l'API distingue l'environnement dans chaque notification).
   Puis « Envoyer une notification de test » : la réponse de l'API est `{"ok":true,"outcome":"test"}`.
6. **Apple ID de l'app** : noté dans Informations sur l'app (« Identifiant Apple », un nombre). Il va dans
   `APPLE_APP_APPLE_ID`.
7. Avant la soumission : renseigner l'URL des conditions (`/legal/conditions`), de la politique de confidentialité
   (`/legal/confidentialite`) et des conditions de l'abonnement (`/legal/abonnement`) du site.

## 2. Dans `apps/api/.env` (serveur seulement, jamais dans l'app ni dans le dépôt)

```
APPLE_BUNDLE_ID=app.blowy
APPLE_APP_APPLE_ID=<l'Apple ID numérique de l'app>
APPLE_ACCEPT_SANDBOX=1
PLUS_PRODUCT_YEARLY=app.blowy.plus.yearly
PLUS_PRODUCT_MONTHLY=app.blowy.plus.monthly
ADMIN_EMAILS=<adresses de l'équipe, séparées par des virgules>
```

`APPLE_ACCEPT_SANDBOX=1` est nécessaire tant que l'app est testée par TestFlight (les achats TestFlight sont du bac à
sable). Le passer à `0` refuse ces achats en production si on le souhaite plus tard.
Aucune clé « In-App Purchase » n'est requise aujourd'hui. Elle le deviendra si l'on ajoute le rattrapage par
l'App Store Server API (voir `apps/api/README.md`).

## 3. Ce que l'app doit faire (écran à venir)

1. `GET /v1/plus/paywall` (`api.plus.paywall()`) pour les faits : produits, frise de l'essai, avantages, nombre
   de personnes compatibles (0 : cacher le bloc), mentions de renouvellement, liens légaux.
2. `Product.products(for: [identifiants])`, afficher le prix **facturé** de StoreKit en grand (« 59,88 € par an »),
   l'équivalent mensuel en petit, « 7 jours gratuits, puis 59,88 € par an » si `isEligibleForIntroOffer`.
3. Acheter avec l'option `appAccountToken(UUID(uuidString: me.id))`.
4. Envoyer `transaction.jwsRepresentation` (et la `renewalInfo` signée si disponible) à
   `POST /v1/plus/purchases` (`api.plus.submitPurchase`), puis `transaction.finish()`.
5. « Restaurer mes achats » : `AppStore.sync()`, puis envoyer la transaction de `Transaction.currentEntitlements`.
6. Écouter `Transaction.updates` au lancement et envoyer chaque mise à jour de la même façon.

## 4. Tester en bac à sable

1. App Store Connect → Utilisateurs et accès → **Testeurs Sandbox** → créer un compte (adresse jamais utilisée chez Apple).
2. Sur l'iPhone : Réglages → App Store → Compte Sandbox → se connecter avec ce compte.
3. Installer un build TestFlight (ou de développement signé avec le bon bundle) pointant sur l'API de recette.
4. Acheter l'annuel : l'API répond `phase: "trial"` ; `GET /v1/me` rend `plus: true`.
5. En bac à sable, le temps est accéléré (d'après la documentation Apple « Testing in-app purchases with sandbox » : de l'ordre d'une heure pour un an et de quelques minutes pour une semaine d'essai ; à confirmer sur la page à jour) ; les renouvellements
   arrivent par notification (`DID_RENEW`) et le rappel du jour 5 est vite dû. Le réglage « Renouvellement » du compte
   sandbox (Réglages → App Store → Compte Sandbox → Gérer) permet d'accélérer ou d'arrêter les renouvellements et de
   simuler un échec de paiement (délai de grâce, nouvelle tentative).
6. Annuler depuis Réglages → identifiant → Abonnements : notification `DID_CHANGE_RENEWAL_STATUS`, l'API passe
   `willRenew: false`.
7. En bac à sable, Apple n'envoie chaque notification qu'une fois (pas de renvoi) : surveiller les journaux de l'API
   (`[Blowy+]`).
8. Le journal `store_notifications` (table, lecture par la clé service) garde chaque notification 90 jours avec son
   résultat (`applied`, `unlinked`, `duplicate`, `ignored`, `test`).

En local sans Apple : l'API en mémoire accepte des transactions fabriquées (`memoryJws` dans
`src/modules/billing/infrastructure/memory-billing.ts`), utilisées par `test/billing.e2e.test.ts`.
