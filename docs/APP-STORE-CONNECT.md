# À faire dans App Store Connect (propriétaire)

Copie à jour de la section 7 de `docs/AUDIT-APPLE.md`, après les corrections de l'app et du serveur du 15 novembre
2026 (objets premium livrés, manifestes de confidentialité, accords pour l'IA tierce, autorisations iOS, position
arrondie, filtre des contenus, compte de revue, plus de photo du jour). À relire après chaque changement de ce que
l'app collecte ou partage. Les réponses ci-dessous suivent le code tel qu'il est sur `wip/soins-garde-robe`. Notes de
revue et compte de revue : `docs/APP-REVIEW.md`. Ordre de mise en production : `docs/LIVRAISON.md`.

## 1. Avant tout

- Compte développeur au nom de la société Avec Trois E (adhésion « Organisation », D-U-N-S), accord « Apps payantes »
  signé, banque et fiscalité remplies, statut de commerçant UE déclaré (audit M10).
- Identifiants : `app.blowy` avec Sign in with Apple, Push Notifications, App Groups (`group.app.blowy`), Associated
  Domains ; `app.blowy.widget` avec App Groups (`docs/WIDGETS.md`). L'extension est déclarée **iPhone seulement**, comme
  l'app (`supportsTablet: false`) : sur iPad, Blowy tourne en mode compatibilité iPhone.
- Langue principale : français. Pays : commencer par la France / l'UE francophone tant que les traductions ne sont pas
  faites (audit M1) et que la question des États-Unis n'est pas tranchée (audit M5).
- Version minimale : iOS 16.4 pour l'app ; widgets et activités en direct à partir d'iOS 17.

### Avant d'envoyer le premier binaire

| Point | Où | Qui |
|---|---|---|
| Builds `preview` et `production` signés avec `aps-environment = production` (variable `BLOWY_APS_ENVIRONMENT` des profils, `apps/mobile/eas.json`) ; le client de développement garde `development`. Contrôler les entitlements du `.ipa` (`codesign -d --entitlements :- Blowy.app`). | EAS | propriétaire |
| Rapport de confidentialité d'Xcode sur l'archive (Organizer › clic droit › *Generate Privacy Report*) : il doit lister le manifeste de l'app (`PrivacyInfo.xcprivacy` de la cible Blowy), celui de l'extension (`BlowyWidget.appex`, UserDefaults `1C8F.1`) et ceux des bibliothèques. Un e-mail « ITMS-91053 Missing API declaration » d'Apple après l'envoi = une raison manque : l'ajouter dans `ios.privacyManifests` (`apps/mobile/app.config.ts`). | Mac ou EAS | propriétaire |
| Même version et même numéro de build pour l'app et l'extension (sinon avertissement ITMS-90473) : à vérifier dans l'onglet « Builds » de la première version envoyée. | App Store Connect | propriétaire |
| `APPLE_TEAM_ID=<identifiant d'équipe>` dans les variables du build du site (Cloudflare Pages), puis vérifier `https://blowy.app/.well-known/apple-app-site-association` : `appIDs` doit contenir `<équipe>.app.blowy`. Sans la variable, le fichier ne déclare **aucune** app et les liens d'invitation et « 3 mots » s'ouvrent dans le navigateur. | Cloudflare | propriétaire |
| API : migrations et déploiement dans l'ordre de `docs/LIVRAISON.md` (migrations `20261115190000` à `20261115210000` **avant** le code) ; `AI_PROVIDER_NAME` et `AI_PROVIDER_COUNTRY` laissés vides tant que le prestataire est Anthropic (États-Unis), sinon les renseigner **en même temps** que `SUBPROCESSORS.ai` des pages légales (`apps/web/src/config/legal.ts`). | Supabase, Railway | propriétaire |
| Pages légales remplies, en ligne, et à jour pour l'IA (voir 5. et le rapport de l'audit, B2 et B5). | site | propriétaire, juriste |

## 2. Classement d'âge (questionnaire en vigueur au 16 novembre 2026)

| Question | Réponse | Pourquoi |
|---|---|---|
| Dating and Relationships | **Oui** | rencontres « plus » entre personnes réelles → 18+ minimum |
| Shared Location | **Oui** | les autres voient ta position approximative sur la carte |
| Messaging and Chat | **Oui** | chat entre liens |
| User-Generated Content | **Oui** | prénoms, photos de profil, messages |
| Social Media | Non | pas de fil qui diffuse largement |
| Advertising | Non | aucune publicité |
| Unrestricted Web Access | Non | les liens ouvrent seulement les pages de Blowy |
| Parental Controls | Non | |
| Age Assurance | Non (déclaration d'âge simple), sauf si l'API Declared Age Range est intégrée | |
| Mature or Suggestive Themes | Infrequent | rencontres amoureuses |
| Alcohol, Tobacco, or Drug Use or References | Infrequent | « apéro », 🍻 dans quelques textes |
| Profanity or Crude Humor | None (le contenu des gens est couvert par UGC) | |
| Sexual Content or Nudity | None | |
| Horror, violence, armes | None | |
| Medical or Treatment Information | None | |
| Health or Wellness Topics | None (ou Infrequent si la fiche parle de bien-être) | habitudes de vie |
| Gambling, Simulated Gambling, Contests, Loot Boxes | None | les objets premium sont tous inclus dans Blowy+, sans tirage |
| **Résultat attendu** | **18+** (Brésil : A18) | |

Dans la fiche, les visuels restent « 4+ » (2.3.8) : pas de scène suggestive dans les captures.

## 3. App Privacy (étiquettes), d'après les flux réels du code

« Tracking » : **non** pour tout (aucun SDK de publicité ni de mesure ; `NSPrivacyTracking` vaut `false` dans les trois
manifestes). Toutes les données ci-dessous sont **liées à l'identité**. Ce tableau est aussi déclaré dans le manifeste
de l'app (`NSPrivacyCollectedDataTypes`, `apps/mobile/app.config.ts`) : changer l'un, c'est changer l'autre.

| Catégorie Apple | Type | Collecté ? | Finalités |
|---|---|---|---|
| Contact Info | Email Address | Oui (relais Apple possible) | App Functionality |
| Contact Info | Name | Oui (prénom ou surnom) | App Functionality |
| Location | **Coarse Location** : l'API n'enregistre jamais le point exact, seulement le centre de sa maille de ~300 m et la zone du domicile (même maille), ou la ville choisie à la main (audit M6, corrigé ; le manifeste déclare `CoarseLocation`, vérifié par `plugins/ios-release.test.ts`). Le point exact ne sert qu'en mémoire, pendant la requête (sortie hors de la zone). | Oui | App Functionality |
| Sensitive Info | Sensitive Info (orientation sexuelle déductible du sexe et de « qui tu veux rencontrer ») | Oui | App Functionality |
| User Content | Emails or Text Messages (chat) | Oui | App Functionality |
| User Content | Photos or Videos (photo de profil, preuves d'habitude, défis photo ; anciennes photos du jour encore gardées dans les souvenirs des liens) | Oui | App Functionality |
| User Content | Customer Support | Oui (e-mails) | App Functionality |
| User Content | Other User Content (réponses au test de vision et aux questions du jour, habitudes, « 3 mots », texte des signalements) | Oui | App Functionality, Product Personalization |
| Identifiers | User ID | Oui | App Functionality |
| Purchases | Purchase History | Oui | App Functionality |
| Usage Data | Product Interaction (soins, séries, défis, rencontres acceptées ; sert aussi aux statistiques de l'administration) | Oui | App Functionality, Analytics |
| Other Data | Other Data Types (date de naissance, sexe) | Oui | App Functionality |
| Diagnostics | — | Non, tant qu'aucun outil de rapport de plantage n'est ajouté | |
| Health & Fitness | — | Non (habitudes déclarées, pas de mesure) | |

**IA tierce.** Les données envoyées au prestataire d'IA (Anthropic, États-Unis), à Expo (notifications) et à
l'hébergeur sont déjà couvertes par les lignes ci-dessus (prestataires) : pas de ligne à part. Ce que l'app fait pour
5.1.2(i), à décrire tel quel dans les notes de revue (6.) :
- **chat** : lecture par l'IA seulement si les deux personnes l'ont accepté ; la phrase d'accord nomme le prestataire et
  son pays (servie par l'API, depuis la configuration) ;
- **preuves d'habitude** : feuille d'accord avant la première photo (ce qui part, à qui, pourquoi, 24 h, et « Sans
  vérification par IA ») ; sans accord, l'API n'envoie aucune image (vérifié par les tests) et l'habitude se valide
  sans photo ;
- **vérifications de sécurité** : chaque photo de profil, réduite, avant d'être publiée (dit sous la photo dans Moi ›
  Réglages › Mon compte et dans la feuille de choix, avant de choisir ; ne se coupe pas : photo facultative) ; un message
  qui laisse un doute au filtre, seulement dans un chat où les deux ont accepté la lecture par l'IA ;
- **bilan de la semaine** : reformulé sans aucun prénom ni nom (seulement des chiffres et des phrases générales) ;
- **photo du défi du jour** : jamais envoyée à une IA ;
- tout se voit dans **Moi › L'IA et toi** (prestataire nommé, chaque usage), et ce qui se retire s'y retire.

## 4. Abonnements

- Groupe « Blowy+ » ; deux produits dans le même groupe, même niveau : `app.blowy.plus.yearly` (1 an, 59,88 €, essai
  gratuit 1 semaine en offre d'introduction) et `app.blowy.plus.monthly` (1 mois, 14,99 €, sans essai)
  (`docs/BLOWY-PLUS.md`).
- Description de chaque produit (et de la fiche) : ne promettre que ce qui existe. Proposition :
  « Toute la carte et changer de ville, une rencontre de plus chaque jour, 3 jokers de série par semaine, jusqu'à 6
  habitudes, le bilan détaillé du dimanche, renommer ton minimoa quand tu veux, et tous les objets premium de la
  garde-robe tant que tu es abonné. »
- **Objets premium (audit B3, livré)** : avec Blowy+, les 13 objets premium sont à la personne et se portent tout de
  suite ; sans Blowy+, leur fiche ouvre Blowy+. **À la fin de l'abonnement, le minimoa les range** (ils redeviennent
  verrouillés et reviennent avec un nouvel abonnement) ; la fiche de l'objet le dit. Rien d'autre n'est vendu à l'unité.
- Pour chacun : nom affiché et description dans chaque langue de la fiche ; **capture du paywall** pour la revue ; notes
  de revue.
- **Le premier abonnement doit être joint à la version soumise** (page de la version › « In-App Purchases and
  Subscriptions » › sélectionner les deux), sinon l'examinateur ne trouve pas les produits (2.1(b)).
- Notifications serveur App Store v2 vers `https://<API>/v1/plus/apple/notifications` (production et bac à sable).
- Pour tester les objets premium en bac à sable : acheter l'annuel, ouvrir Mon minimoa › Garde-robe : le compteur
  passe de N à N + 13, les objets « Blowy+ » se portent ; annuler et attendre la fin (accélérée en bac à sable) : ils
  quittent le minimoa.

## 5. Adresses obligatoires

- **Politique de confidentialité** : `https://blowy.app/legal/confidentialite` (champ App Privacy). Réécrite le 15
  novembre 2026 d'après le code (prestataire d'IA lu dans `apps/web/src/config/legal.ts`, quatre usages, position
  jamais exacte, filtre et suspensions automatiques, durées réellement appliquées, plus de photo du jour). Reste à
  remplir dans `legal.ts` : e-mails de contact, DPO, hébergeurs, médiateur, garanties de transfert, durée de
  conservation chez le prestataire d'IA (`AI_TERMS.retention`, selon le contrat), rotation des sauvegardes.
- **Assistance (Support URL)** : `https://blowy.app/legal/assistance`, avec un e-mail réel.
- **Conditions d'utilisation (EULA)** : soit le champ « Licence Agreement » personnalisé avec les conditions de Blowy,
  soit le contrat standard d'Apple **et** un lien « Conditions d'utilisation : https://blowy.app/legal/conditions » à la
  fin de la description. Ajouter aussi le lien des conditions Blowy+ (`/legal/abonnement`), qui doit décrire les objets
  premium comme en 4.
- Fiche : pas de prix dans le nom, le sous-titre ni les captures (2.3.7) ; captures de l'app en usage (2.3.3).

## 6. Notes de revue et compte de revue

Une seule source : **`docs/APP-REVIEW.md`** (fonctionnement du compte de revue, réglages Railway et Supabase, préparation
du compte, et §3 le texte exact à coller dans App Store Connect › Version › App Review Information, en anglais). Ne pas
recopier les notes ici : les modifier là-bas, après chaque changement de ce qu'un examinateur voit (onglets, chemins,
usages de l'IA, abonnement).
