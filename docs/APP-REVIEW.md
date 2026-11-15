# App Review : compte de revue, notes et réglages

Réponse au constat B1 de `docs/AUDIT-APPLE.md` (l'examinateur ne peut pas atteindre les rencontres, les chats, l'IA,
le signalement ni le blocage). **Source unique** des notes de revue et du compte de revue : ce document dit ce que le
propriétaire règle, comment préparer le compte, et le texte exact à coller dans App Store Connect › Version › App
Review Information. Le reste d'App Store Connect (classement d'âge, App Privacy, abonnements, adresses) :
`docs/APP-STORE-CONNECT.md`. Ordre de mise en production (migrations, variables, contrôles) : `docs/LIVRAISON.md`.

## 1. Comment ça marche

- **Une adresse de revue**, configurée sur le serveur (`REVIEW_EMAIL`, `REVIEW_CODE`), peut se connecter sur l'app de
  production par « Connexion par e-mail » (lien replié sous le bouton Apple, visible de tous, rien de caché). Toute
  autre adresse, un mauvais code ou un serveur sans ces variables reçoivent la même réponse « Adresse ou code
  incorrect. » ; 10 essais par adresse IP et par quart d'heure, 60 par heure en tout. Sans les variables, la connexion
  par e-mail est fermée.
- L'API ouvre une **vraie session Supabase** pour cette adresse (compte créé s'il manque, lien de connexion à usage
  unique échangé aussitôt côté serveur, aucun e-mail envoyé) ; l'app la pose avec `setSession`.
- À l'inscription de ce compte, **puis à chaque connexion par le code**, le serveur lui pose un **monde d'exemple**
  remis à neuf, visible de lui seul (`profiles.review_world`, règle dans `Audience`) :
  - 8 personnes fictives compatibles avec lui (sexe et recherche accordés aux siens, vision proche de la sienne),
    autour de sa zone (sans zone : Paris, posée comme zone choisie à la main), et qui suivent sa zone s'il en change ;
  - un **coucou reçu** (Rencontres) ; des **rencontres expliquées** (3 points communs, 1 différence) ; des
    « potes de potes » proposés même sans position ;
  - un **lien ouvert avec Léa** (ou un autre prénom selon le compte) : conversation de 9 jours, série de 5 jours, et des
    répliques des minimoas de chaque rôle — brise-glace, relance après 3 jours de silence, remarque, garde-fou (visible
    du seul compte de revue) ; l'autre personne a **déjà accepté la lecture par l'IA**, l'examinateur voit donc la
    demande d'accord (prestataire nommé) à la première ouverture ; quand il écrit, la personne fictive **répond** et
    les minimoas réagissent ;
  - un **lien en danger** (2 vies sur 7) ;
  - sa **série** du défi du jour (6 jours, historique), **deux habitudes**, le **bilan de la semaine passée** ;
  - la **carte** : épingles dans la zone, « 3 minimoas plus loin » ; le **paywall** compte les personnes compatibles ;
  - **Signaler** et **Bloquer** marchent sur ces personnes (le signalement est enregistré, marqué « compte de revue »
    dans l'administration, sans alerte ni escalade ni suspension).
- Les personnes fictives **ne sont pas de vrais comptes** : comptes d'authentification bannis, sans mot de passe,
  adresses `…@review.blowy.invalid` (aucun e-mail ne part), jamais montrées à un vrai compte (rencontres, carte,
  coucous, invitations, « 3 mots », compteur du paywall), et le compte de revue ne voit aucun vrai compte. Elles sont
  **hors statistiques** (fonction SQL des chiffres du jour, jour d'activité jamais noté, propositions jamais comptées).
- **IA** : sans clé (`ANTHROPIC_API_KEY` absente ou `AI_KILL_SWITCH=1`), tout reste démontrable avec des lignes
  déterministes (répliques de règle, bilan en modèle de phrases, preuve d'habitude comptée « pas sûr », donc acceptée).
- **Remise à neuf** : à chaque connexion par le code, ou `POST /v1/review/reset` avec le jeton du compte de revue.
  Supprimer le compte de revue (Moi › Réglages › Supprimer mon compte) supprime aussi ses personnes fictives.

## 2. Ce que le propriétaire règle

### Railway (service de l'API), variables
| Variable | Valeur | Note |
|---|---|---|
| `REVIEW_EMAIL` | une adresse à vous, par ex. `appreview@blowy.app` | une seule ; jamais publiée ailleurs que dans les notes de revue |
| `REVIEW_CODE` | 10 caractères au moins, tirés au hasard (par ex. `openssl rand -hex 6`) | l'API refuse de démarrer en production avec moins de 10 |
| `ADMIN_EMAILS` | adresses de l'équipe de modération | reçoivent les alertes de signalements (audit M9) |
| `ADMIN_URL` | facultatif : adresse de l'administration | liens des alertes ; défaut `WEB_URL` + `/admin` |
| `RESEND_API_KEY`, `MAIL_FROM` | déjà prévues | sans elles, ni alertes ni rappel d'essai par e-mail |

Les deux premières vont ensemble (l'une sans l'autre : l'API refuse de démarrer). Les retirer après la validation
d'Apple ferme la connexion par e-mail ; les remettre avant chaque soumission (ou les laisser : l'adresse est inconnue
du public et le code est limité en essais).

### Supabase
- Authentication › Providers › **Email** : doit rester **activé** (c'est le défaut) : l'API ouvre la session de revue
  par un lien de connexion à usage unique. L'app ne propose aucune inscription par e-mail au public. Garder
  « Confirm email » activé. **Non vérifié** contre un vrai projet : si Supabase refuse le lien quand le fournisseur
  Email est coupé, c'est ce réglage.

### Apple (pour les e-mails, audit M3)
- Certificates, Identifiers & Profiles › Services › **Sign in with Apple for Email Communication** : enregistrer le
  domaine et l'adresse d'envoi (`MAIL_FROM`), sinon le relais `@privaterelay.appleid.com` refuse les e-mails
  (rappel de fin d'essai, avertissements de modération). Activer SPF/DKIM sur le domaine d'envoi (Resend le guide).

### Préparer le compte avant la soumission (une fois)
1. Sur un iPhone avec la version TestFlight : Bienvenue › créer son minimoa, passer le test de vision, répondre aux
   écrans, jusqu'à « Connexion ». Toucher **Connexion par e-mail**, saisir `REVIEW_EMAIL` et `REVIEW_CODE`,
   « Se connecter ». La localisation peut être refusée : le compte reçoit alors Paris comme zone choisie à la main
   (changeable tout de suite dans Rencontres ou Moi › Réglages › Ma position), et le monde se place autour.
2. L'inscription se termine : le monde d'exemple est posé. Vérifier Rencontres, Chats (Léa, Malo), la carte.
3. Moi › Réglages › Se déconnecter. L'examinateur se connectera par « J'ai déjà un compte » et retrouvera un monde neuf.

## 3. Notes de revue (à coller, en anglais)

Remplacer `<review e-mail>`, `<code>` et `<moderation e-mail>`.

```
Blowy is a French app for adults (18+) to meet compatible people for friendship or dating. Each user raises a small
creature ("minimoa") that represents their outlook on life and only introduces them to people whose outlook is
compatible (above 70%), always with an explanation (3 things in common, 1 difference).

DEMO ACCOUNT
Sign in with Apple is the public sign-in. For review, use the e-mail sign-in, which only works for this account:
1. On the welcome screen, tap "J'ai déjà un compte" (I already have an account).
2. Below the Apple button, tap "Connexion par e-mail" (Sign in with e-mail).
3. E-mail: <review e-mail>   Code: <code>   then tap "Se connecter".
The account opens with sample data visible to this account only (fictional people, never shown to real users,
reset at every sign-in):
- Rencontres tab: an incoming introduction (Accept / Not this time) and compatible people with the reasons.
  "La carte" (top right) shows the map of the area; Blowy+ shows the subscription.
- Chats tab: a chat with "Léa" (or another first name) and a link "in danger" (2 hearts left). On first opening of a
  chat, a sheet asks for consent to AI reading (see AI below). Léa has already agreed; if you agree too, the creatures
  can react to messages. When you write, the fictional person replies.
- Each chat has two tabs at the top: "Chat" (the conversation) and "Le lien" (the connection: who wrote today, the
  week, lives, next level, milestones). There is no daily photo; a connection's streak grows on days when both people
  write.
- Mon minimoa tab: today's challenge, a 6-day streak, two habits, and last week's review (weekly reviews are under
  Mon minimoa > Son caractère).
- Moi tab: "L'IA et toi" (what the third-party AI sees, each consent), Réglages (account, profile photo, location,
  blocked people, legal pages, account deletion), Blowy+.
You can also create your own account with Sign in with Apple (no sample data then).
If you delete the demo account, sign in again with the same e-mail and code: sign-up takes about 2 minutes and the
sample data is created again.

LANGUAGE
The app is in French. Tabs: Mon minimoa (home) · Chats · Rencontres (introductions) · Moi (profile, settings).

AGE
Date of birth is asked before sign-in; under 18 the sign-up stops and nothing is stored. The server checks again.

LOCATION
Used only while the app is open, to find compatible people around the user. The server never stores the exact
position: it is rounded to a ~300 m grid before being saved; others see a rounded and shifted position, never in real
time; "Discret" mode (map, top right) hides the user from the map. If location is refused, the user picks a city by
hand for free (Rencontres > "Choisir ma ville", or Moi > Réglages > Ma position) and still gets introductions.

AI (third party: Anthropic, United States)
Every use is disclosed where the data is given and listed in Moi > "L'IA et toi", which names the provider.
(1) Chats: an AI reads a short window of recent messages (authors marked A/B, no names) so the creatures can react,
only if BOTH people agree on the consent sheet shown at first opening of a chat (provider named, link to the privacy
policy; change it later in the chat's "..." menu or in Moi > "L'IA et toi").
(2) Habit proof photos: before the first proof, a sheet explains what is sent (the reduced photo and the habit name),
to whom, why, and that Blowy deletes it within 24 h; the person picks "Oui, vérifier par une IA" or "Sans
vérification par IA" (the habit is then confirmed without any photo and counts the same). Without consent the server
never sends an image.
(3) Safety checks: every profile photo is checked before it is shown (nudity, apparent minors, violence, hate, ads);
this is stated under the photo picker (Moi > Réglages > Mon compte) and in the picker sheet before a photo is chosen.
A profile photo is optional. In a chat where both people accepted AI reading, a message the word filter is unsure
about (e.g. a bare link) may also be checked after it is sent.
(4) Weekly reviews are rephrased by the AI from figures and generic sentences, without any first name or creature
name. The daily photo challenge is never sent to an AI.

SAFETY AND MODERATION
- Report and block: on any introduction (Rencontres > person > "..." > Signaler ou bloquer) and in a chat ("..." menu,
  or long-press a message > Signaler ce message). Reports reach our moderation team by e-mail right away for urgent
  ones (minor, threats) and in a digest otherwise; target handling time 24 h, with automatic escalation after 24 h.
- Filtering: names and messages are filtered by the server (multilingual word lists resistant to simple tricks).
  Clear violations (threats, hate, sexual content involving minors, commercial sex, scams) are not delivered: the chat
  shows "Message non envoyé" with the reason and keeps the text so it can be edited (nothing is retried
  automatically); a refused first name or creature name sends the person back to that field with the reason.
  Borderline messages (insults, explicit content) are delivered but flagged to moderators, and the sender's creature
  suggests a pause. Profile photos are checked when uploaded (nudity, minors, violence, hate, ads); a refused photo is
  deleted and the reason is shown.
  Accounts reported as a minor by two different people, or using explicit child-abuse vocabulary, are suspended
  automatically until a moderator reviews them.
- Contact: <moderation e-mail>. Account deletion: Moi > Réglages > Supprimer mon compte (immediate; revokes the Sign
  in with Apple token).

SUBSCRIPTION BLOWY+
Moi > Blowy+, or after sign-up. Yearly €59.88 with a 7-day free trial, monthly €14.99. Purchases are verified by our
server; sandbox purchases are accepted. "Restaurer mes achats" is on the same sheet. A reminder is sent on day 5 of
the trial by notification and by e-mail.

LOCATION AND PRIVACY LABELS
Location is declared as Coarse Location: the exact point is never stored (see LOCATION above).

WIDGETS AND LIVE ACTIVITIES
Home/Lock Screen widgets show the creature, its mood and the streak. A Live Activity starts when the user accepts the
daily challenge (it shows the time left until midnight and is removed 8 hours after it started at most), and in the
evening when a connection is waiting for a reply ("À toi d'écrire"); it never shows another person's name.
```

## 4. Ce qui reste à vérifier sur un vrai projet (non vérifié ici)

- La session de revue contre un vrai Supabase (`generateLink` puis `verifyOtp` ; création des comptes fictifs
  bannis avec un identifiant imposé) : testé seulement en mémoire.
- L'envoi réel des e-mails (Resend, relais d'Apple) : testé en mémoire (`ConsoleMailer`).
- Le monde d'exemple sur l'iPhone de l'examinateur (TestFlight) : parcouru sur l'export web en local.
