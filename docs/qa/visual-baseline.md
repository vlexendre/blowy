# État visuel initial — maquettes V4 ↔ app (2026-11-06)

Commande : `pnpm qa:visual` (références `design/v4-reference/renders`, correspondance
`tooling/qa/visual/routes.v4.json`). Rapport : `.local/qa/visual/index.html`, données :
`.local/qa/visual/results.json`. Deux exécutions complètes successives ont donné des chiffres
identiques au dixième de point près (capture déterministe).

## Méthode et lecture des chiffres

- App : export Expo web (react-native-web) avec shims de capture (`BLOWY_QA_CAPTURE=1`),
  `EXPO_PUBLIC_AUTH_MODE=firebase` (parcours de production, sans lien « comptes de démo »),
  API locale réelle + seed, session de démo injectée. Chromium 390×844 @2x, `prefers-reduced-motion`,
  safe areas émulées 47 px / 34 px (iPhone 390×844), horloge navigateur figée au 2026-11-06 10:00 Paris.
- Référence : rendus PNG des `.dc.html` (`tooling/design-render/render.mjs`), même viewport.
- Écart = % de pixels différents (pixelmatch, seuil 0,1, anticrénelage exclu), hors masques
  (compteur « en ligne » de Welcome, compte à rebours du Paywall, « État du hh:mm » du Nid,
  heures des messages du Chat). « Basse rés. » = écart moyen de couleur sur des cases 8×8 px :
  moins sensible aux décalages d'un pixel.
- **Le % sert à classer et à suivre une tendance, pas à juger seul la fidélité** : un écran
  au fond crème mais à la structure différente obtient un score bas (Réglages 9,1 % alors que
  le contenu ne correspond pas), un écran dont seul le fond diffère obtient un score très haut.

## Résultats

Écart moyen : **47,3 %** sur 38 écrans mesurés (48,7 % en comptant V4-Bravo, absent, à 100 %) ;
basse résolution 26,9 %. Sur les 15 écrans conservés en V5 (Craft, Vie, Éclosion, Compte, Vérif,
Chats, Chat, RdvIRL, Rupture, Story, Profil, Réglages, Confidentialité, Signaler, Supprimer) : 38,8 %.

| Écran | Écart | Basse rés. | | Écran | Écart | Basse rés. |
|---|---|---|---|---|---|---|
| V4-Bravo | absent | — | | V4-Classement | 41,6 % | 21,5 % |
| V4-Preuve | 93,0 % | 57,1 % | | V4-Vide | 41,3 % | 28,8 % |
| V4-Revelation | 86,1 % | 42,7 % | | V4-Chat | 39,7 % | 27,2 % |
| V4-Bebe | 85,7 % | 34,4 % | | V4-Craft | 38,2 % | 19,8 % |
| V4-Story | 84,2 % | 61,2 % | | V4-Profil | 37,6 % | 26,8 % |
| V4-Paywall | 81,5 % | 49,3 % | | V4-Abonnement | 37,0 % | 23,6 % |
| V4-Invite | 80,2 % | 35,5 % | | V4-Intention | 35,4 % | 19,9 % |
| V4-RdvIRL | 79,8 % | 62,5 % | | V4-Boutique | 29,3 % | 14,8 % |
| V4-Eclosion | 77,9 % | 30,6 % | | V4-Chats | 28,1 % | 20,0 % |
| V4-Serie | 71,3 % | 33,6 % | | V4-Emmenager | 25,7 % | 13,2 % |
| V4-Oeuf | 70,4 % | 33,3 % | | W-Repondre | 25,5 % | 12,5 % |
| V4-Match | 65,4 % | 34,5 % | | V4-Compte | 22,7 % | 14,9 % |
| V4-Carte | 64,5 % | 27,0 % | | V4-Confidentialite | 22,6 % | 19,0 % |
| V4-Nid | 54,9 % | 27,2 % | | V4-Notifs | 18,4 % | 10,1 % |
| V4-Quartier | 53,9 % | 26,7 % | | V4-Lien | 17,7 % | 12,6 % |
| V4-Welcome | 48,3 % | 21,5 % | | V4-Rupture | 17,7 % | 14,6 % |
| V4-Vie | 48,0 % | 36,0 % | | V4-Signaler | 16,9 % | 12,3 % |
| V4-Fiche | 44,7 % | 26,0 % | | V4-Supprimer | 16,5 % | 13,8 % |
| V4-Verif | 44,0 % | 28,3 % | | V4-Reglages | 9,1 % | 6,1 % |
| V4-Ami | 44,0 % | 24,4 % | | | | |

## Les 10 pires (cause principale, constatée sur les captures)

| Écran | Écart | Cause principale |
|---|---|---|
| V4-Bravo | absent | **structure manquante** : aucune route (célébration de mission validée). |
| V4-Preuve | 93,0 % | **structure manquante** : état « Pas encore disponible » (endpoint mission absent) sur fond crème au lieu de la caméra plein écran sombre. |
| V4-Revelation | 86,1 % | **couleurs/structure** : gabarit détail crème + pastille « verrouillé » (pas d'offre au niveau 2 de la démo) au lieu du plein écran dégradé rose/rouge. |
| V4-Bebe | 85,7 % | **structure manquante** : état indisponible (endpoint œuf/enfants absent) au lieu de la scène dégradée. |
| V4-Story | 84,2 % | **structure manquante** : bouton de partage système + bandeau indisponible ; ni onglets, ni carte story, ni réseaux, fond sombre absent. |
| V4-Paywall | 81,5 % | **couleurs** : panneau d'offres sur fond crème au lieu du fond violet dégradé ; avantages en liste ; pas de compte à rebours (coupé en V5). |
| V4-Invite | 80,2 % | **données + couleurs** : parrain non vérifiable (`GET /v1/referrals/:code` absent) → titre générique et bandeau ; fond corail plein de la maquette absent. |
| V4-RdvIRL | 79,8 % | **structure + couleurs** : liste statique sur crème (endpoint sécurité absent) au lieu de la carte lieu, du choix de l'ange gardien et du fond sombre. |
| V4-Eclosion | 77,9 % | **couleurs/espacements** : fond brun uni au lieu du dégradé violet, pas d'anneaux autour de l'œuf, titre en haut au lieu du centre. |
| V4-Serie | 71,3 % | **structure manquante** : ni calendrier, ni paliers, ni grand compteur sur fond corail (coupé en V5). |

V4-Oeuf (70,4 %) suit, même cause que V4-Bebe.

## Points systémiques

1. **Police d'affichage non conforme (jetons typographiques).** Les maquettes chargent Bricolage
   Grotesque **variable** (Google Fonts, axes `opsz`, `wdth 75..100`) et l'emploient en
   `font-stretch: 85%`, `letter-spacing: -.03em`, `line-height: .95`. L'app charge l'instance
   statique `BricolageGrotesque_800ExtraBold` (@expo-google-fonts, largeur 100 %) : titres ~15 %
   plus larges, retours à la ligne en plus (Welcome : 4 lignes au lieu de 3), texte plus haut.
   Les deux côtés chargent bien leurs polices (vérifié par `document.fonts` à chaque capture : 5/5
   `loaded` côté app) ; c'est l'instance choisie qui diffère, pas le chargement.
   Polices de l'app : `node_modules/@expo-google-fonts/bricolage-grotesque/800ExtraBold/BricolageGrotesque_800ExtraBold.ttf`
   et `@expo-google-fonts/inter/{400Regular,600SemiBold,700Bold,800ExtraBold}/Inter_*.ttf`
   (`app/_layout.tsx`, `app.config.ts`). Les maquettes n'utilisent pas Inter 800.
2. **Gabarits génériques au lieu de fonds par écran.** `DetailScreenTemplate` / `EmptyStateTemplate`
   rendent tout sur crème avec un titre en capitales ; les maquettes ont des fonds pleins ou
   dégradés propres (corail, violet, sombre, rose) sur une dizaine d'écrans. C'est la première
   source de pixels en écart.
3. **États « indisponible » faute d'endpoint** (mission, ligue, œuf, naissance, garde, ami,
   social, partage, parrainage, suggestions) : 10 écrans montrent le même état vide à la place du
   contenu.
4. **Barre d'onglets sur les écrans de pile.** Elle reste affichée sur Chat, Révélation, RdvIRL,
   Preuve, Story… alors que les maquettes de ces écrans n'en ont pas ; sur la Conversation elle
   recouvre le compositeur (capture web ; non vérifié sur appareil).
5. **Données de démo** : le seed ne crédite aucune pièce à Alex (0 vs 340), la série est vide, et
   les jauges se dégradent depuis la date du seed (Nino apparaît malade sur Nid / Profil). Les
   maquettes supposent série 8, 340 pièces, 3 rendez-vous. Un seed « vitrine » (ou un reseed avant
   capture) rendrait la comparaison plus stable.
6. **Safe areas** : émulées à 47/34 px ; le haut des écrans s'aligne alors à ±10 px sur les
   maquettes (padding 56 px). `--insets 0,0` pour les couper.
7. **Assets** : scène du Nid (parc vs intérieur chez Suzie), maisons et pets « orbite » de Welcome,
   illustrations de propositions : sprites présents dans `packages/sprites` mais non utilisés par
   ces écrans.

## Anomalies relevées pendant la capture (hors pixels)

- **Ouverture à froid sur une route profonde = déconnexion** : les requêtes partent avant la
  restauration de la session (jeton nul) → 401 → `onUnauthenticated` efface le jeton
  (constaté sur web : `localStorage` vidé après ouverture directe de `/chats/<id>`). Probable aussi
  sur appareil via lien universel/notification (non vérifié). Le banc complète l'en-tête
  `Authorization` au niveau réseau pour capturer l'écran nominal. → agent mobile (D).
- Message système affiché comme clé brute `chat.system.system.match.created` : l'API envoie
  `system.match.created`, l'app préfixe `chat.system.` et `fr.json` n'a pas `match.created`. → D / C.
- `GET /v1/conversations/:id/suggestions` → 404 (suggestion du pet jamais affichée).
- Référence V4-Reglages : une icône de la maquette est une image cassée (artefact de la maquette).
