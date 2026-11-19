# Fidélisation : les messages qui donnent envie de revenir, sans jamais forcer

Ce que Minimoa dit aux gens en dehors de l'app (push, e-mail) et à leur retour, pour qu'ils restent : quand, par quel
canal, avec quels mots, et combien de fois au plus. Écrit le 17 novembre 2026 avec le code (`packages/domain/src/fidelite.ts`,
`modules/fidelite`, `modules/billing/application/plus-news.ts`).

## 1. Les règles (non négociables)

- **Ton** : chaleureux, la voix du minimoa quand ça s'y prête, tutoiement, humour sec. Jamais de culpabilisation (« tu
  abandonnes ton minimoa ? »), jamais de chantage (« il va mourir », « il est triste à cause de toi »), jamais de fausse
  urgence (« dernière chance », compte à rebours, offre qui expire alors qu'elle n'expire pas). Le minimoa **attend**, il
  ne souffre pas. Spéc §14, App Review 3.1.2 et 5.6, directive européenne sur les pratiques commerciales déloyales.
- **Des relations, pas un site de rencontre** (spéc §27) : « personnes », « monde », « lien », « rencontre » au sens de
  faire connaissance ; aucune allusion amoureuse.
- **Pas de genre supposé** pour la personne (« deux semaines sans nouvelles de toi », pas « on ne t'a pas vu »).
- **Une nouvelle de fidélisation par jour au plus** (premiers pas, absence, anniversaire), **entre 11 h et 20 h à
  l'heure de la personne** (son fuseau, `notification_settings.time_zone`), en plus des règles générales : heures calmes
  22 h – 8 h, 3 notifications par jour au plus hors messages (`decideNotification`).
- **Les réglages comptent** : chaque type se coupe dans Moi › Réglages › Notifications (« Premiers pas », « Nouvelles de
  ton minimoa », « Ton abonnement Minimoa+ »). Couper le type coupe aussi l'e-mail du même genre (absence de 14 jours,
  relance après la fin de Minimoa+). Les e-mails de **service** de l'abonnement (bienvenue, paiement refusé, au revoir,
  rappel de fin d'essai) partent toujours : ils disent ce qui se passe avec l'argent de la personne.
- **Jamais deux fois** : chaque message réserve sa clé dans `lifecycle_messages` (une ligne par personne et clé, aucun
  contenu) avant de partir. Apple qui renvoie une notification, deux minuteurs qui se croisent, l'app qui renvoie un
  achat : rien ne part en double. Clés gardées 400 jours, effacées avec le compte.
- **Jamais** au compte de revue d'Apple ni à ses personnes fictives (`review_world`), ni à un compte suspendu.

## 2. Tous les messages

Délai : par rapport à l'événement. « Fenêtre » : le message part au premier passage du minuteur (toutes les 30 min pour
ces messages) qui tombe entre 11 h et 20 h chez la personne ; il se rattrape 1 ou 2 jours, puis il est abandonné.

### Minimoa+ (type `plus_account`, sauf le rappel d'essai : `trial_reminder`)

| Message | Déclencheur (branché sur) | Canal | Délai | Texte FR (titre / corps ; e-mail : objet) | Plafond |
|---|---|---|---|---|---|
| Bienvenue | Achat dans l'app (`POST /v1/plus/purchases`) ou notification `SUBSCRIBED` / `DID_RENEW` après une fin ; achat de moins de 48 h | Push + e-mail (service) + message dans la feuille | Tout de suite (push reporté à 8 h la nuit) | « Bienvenue dans Minimoa+ » / « Nino a sorti les objets premium. Toute la carte et plus de rencontres sont à toi. » — E-mail « Bienvenue dans Minimoa+ » : la liste des avantages, la fin de l'essai et le rappel promis s'il y a un essai, comment gérer ou annuler (Réglages › ton nom › Abonnements). Dans la feuille : « Bienvenue dans Minimoa+. Nino a déjà sorti ses objets premium. » | Une fois par achat (clé `plus_welcome:<magasin>:<série>:<transaction>`) ; jamais pour la restauration d'un vieil achat |
| Rappel de fin d'essai (existant) | Minuteur `billing`, jour 5 de l'essai (2 jours avant le premier paiement), si le renouvellement est prévu | Push + e-mail (service) | Jour 5, entre 10 h et 20 h (Paris) ; dans les 12 dernières heures, à toute heure | « Ton essai Minimoa+ se termine bientôt » / « L’essai gratuit se termine le 22 novembre. Ensuite, premier paiement de 59,99 €. Pour l’éviter, annule dans les réglages de ton compte Apple, rubrique Abonnements. » — E-mail : date, montant, « puis chaque année », comment annuler au moins 24 h avant, bouton « Gérer mon abonnement » | Une fois par essai |
| Merci, une année de plus | Notification `DID_RENEW` de l'**annuel**, après une année payée (pas après l'essai, pas après un paiement rattrapé) | Push | Tout de suite | « Une année de plus avec Minimoa+ » / « Ton abonnement annuel est renouvelé. Merci de rester : Nino garde ses objets premium. » | Une fois par renouvellement. Rien pour le mensuel ni l'hebdomadaire (ce serait un message par mois ou par semaine) |
| Paiement refusé, délai de grâce | Notification `DID_FAIL_TO_RENEW` (sous-type `GRACE_PERIOD`) ou statut 4 | Push + e-mail (service) | Tout de suite (push reporté à 8 h la nuit) | « Le paiement de Minimoa+ n’est pas passé » / « Minimoa+ reste ouvert jusqu’au 3 décembre. Mets à jour ton moyen de paiement : Moi › Minimoa+ › Gérer mon abonnement. » — E-mail : ce qui arrive, pourquoi ça arrive, bouton « Gérer mon abonnement », et « tu préfères arrêter ? ne fais rien » | Une fois par échéance (`plus_billing:<série>:<échéance>`) |
| Paiement refusé, sans délai de grâce | `DID_FAIL_TO_RENEW` sans grâce, ou statut 3 | Push + e-mail (service) | Tout de suite | « Le paiement de Minimoa+ n’est pas passé » / « Minimoa+ est en pause. Mets à jour ton moyen de paiement : Moi › Minimoa+ › Gérer mon abonnement. » | Même clé : un seul des deux par échéance |
| Paiement rattrapé | `DID_RENEW` sous-type `BILLING_RECOVERY` | Push | Tout de suite | « Minimoa+ est de nouveau ouvert » / « Le paiement est passé. Merci, tout est rentré dans l’ordre. » | Une fois par transaction |
| Au revoir | Minuteur `billing` : Minimoa+ s'est arrêté (annulé, ou paiement jamais rattrapé), sans reprise depuis ; pas après un remboursement | Push + e-mail (service) | Dans les 7 jours qui suivent la fin, fenêtre 11 h – 20 h | « Minimoa+ s’arrête ici » / « Merci pour ce bout de chemin. Nino, tes liens et tes habitudes restent là, gratuitement. » — E-mail « Minimoa+ s’arrête ici » : ce qu'on garde gratuitement (le minimoa et sa garde-robe, objets premium rangés et rendus si on reprend ; liens et conversations ; défi du jour, série et 2 habitudes ; rencontres, carte de sa zone, bilan du dimanche) ; « dis-nous ce qui t’a manqué » à l'adresse d'assistance, facultatif | Une fois par fin (`plus_goodbye:<série>:<fin>`) |
| Tu nous manques (relance unique) | Minuteur `billing` : 30 à 37 jours après la fin, toujours sans Minimoa+ | Push + e-mail (coupé avec « Ton abonnement Minimoa+ ») | Fenêtre 11 h – 20 h | « Nino pense à toi » / « Ça fait un mois que Minimoa+ s’est arrêté. Si l’envie revient, il est toujours là ; le reste continue comme avant. » — E-mail « Nino pense à toi » : tout reste gratuit, Minimoa+ se reprend dans Moi › Minimoa+, « c’est le seul message qu’on t’envoie à ce sujet ». **Aucune offre** : il n'y en a pas dans App Store Connect (§4) | **Une seule** par personne (`plus_winback`, 400 jours) |

Ce que l'API ne sait pas, ou ne fait pas exprès :
- **Annulation** (`DID_CHANGE_RENEWAL_STATUS`, `AUTO_RENEW_DISABLED`) : aucun message de notre part au moment où la
  personne annule (Apple envoie déjà sa confirmation ; un message de plus ressemblerait à une relance). L'état se lit
  dans Moi › Minimoa+ (« Minimoa+ jusqu’au …, sans renouvellement »). L'au revoir part à la fin réelle.
- **Remboursement, retrait du partage familial** (`REFUND`, `REVOKE`) : pas d'au revoir ni de relance.
- **Hausse de prix** (`PRICE_INCREASE`) : non gérée (aucune hausse prévue) ; Apple prévient lui-même. À ajouter si un
  prix change un jour.
- **Délai de grâce** : sans « Billing Grace Period » activé dans App Store Connect, Apple coupe l'accès dès l'échec et
  c'est la variante « en pause » qui part. **À activer** (§5).
- **Sans notifications serveur v2** (URL non déclarée) : seuls la bienvenue (achat dans l'app), le rappel d'essai et
  l'au revoir (minuteur) partent ; ni merci, ni paiement refusé, ni rattrapé.
- **Monnaie du rappel d'essai** : il écrit le prix de référence en euros (risque connu, `docs/AUDIT-APPLE.md`).

### Rétention de l'app (gratuits et abonnés)

| Message | Déclencheur | Canal | Délai | Texte FR (titre / corps) | Plafond |
|---|---|---|---|---|---|
| Premiers pas, J1 (les gens) | Inscription il y a 1 jour (`profiles.created_at`) | Push (`first_steps`, `step` = `people` ou `people_none`) → ouvre Rencontres | Jour 1 seulement, fenêtre 11 h – 20 h | Quelqu'un à présenter ou un signe reçu (`ListEncounters.waiting`) : « Nino a quelqu’un pour toi » / « Viens voir qui, et pourquoi vous allez bien ensemble. » ; personne : « Nino cherche des gens pour toi » / « Personne de compatible près de toi pour l’instant : tu es parmi les premiers. Invite 2 potes, leurs potes suivront. » (Rencontres dit ce qui manque : vision, position, et propose d'inviter) | Une fois |
| Premiers pas, J2 (« 3 mots ») | Inscription il y a 2 jours | Push (`words`) → ouvre « Tes 3 mots » | Jour 2 seulement | « Nino veut savoir qui tu es » / « Envoie ton lien « 3 mots » à 3 potes : ils te décrivent, sans compte, et il te connaît mieux. » | Une fois |
| Premiers pas, J3 (habitude) | Inscription il y a 3 jours | Push (`habit`) → ouvre Habitudes | Jour 3 (jusqu'au jour 4) | « Nino a une idée » / « Choisis une habitude à tenir : il la suivra avec toi, et des gens près de chez toi la tiennent peut-être aussi. » | Une fois |
| Premiers pas, J5 (groupe) | Inscription il y a 5 jours | Push (`group`) → ouvre « Nouveau groupe » (on peut le créer seul et envoyer son lien) | Jour 5 (jusqu'au jour 6) | « À plusieurs, c’est plus simple » / « Rejoins un groupe par son lien, ou crée le tien et envoie-le à 2 potes. Il démarre à 3. » | Une fois |
| Premiers pas, J7 | Inscription il y a 7 jours | Push (`week`) → ouvre l'accueil, où la carte « Une semaine avec Nino » est proposée une fois (`FirstWeekMoment`) avec le bilan s'il est là | Jour 7 (jusqu'au jour 8) | « Une semaine avec Nino » / « Ta première semaine est là : ce qui a bougé, et une carte à partager. » | Une fois |
| Absence de 3 jours | 3 jours sans ouvrir l'app (`profiles.last_active_on`) ; compte de plus de 10 jours | Push (`minimoa_news`) → ouvre l'accueil | Jours 3 à 5 d'absence | « Nino se demande ce que tu deviens » / « Rien ne presse. Passe quand tu veux, il te garde ta place. » | Une fois par absence |
| Absence de 7 jours | 7 jours sans ouvrir l'app | Push | Jours 7 à 9 | « Nino s’ennuie un peu » / « Il compte les nuages en t’attendant. Un petit tour quand tu as le temps ? » | Une fois par absence |
| Absence de 14 jours | 14 jours sans ouvrir l'app | Push + e-mail (coupé avec « Nouvelles de ton minimoa ») | Jours 14 à 16 | Push : « Deux semaines déjà » / « Nino t’attend, sans rancune. Tes liens ont peut-être des nouvelles pour toi. » — E-mail « Nino te garde ta place » : « Deux semaines sans nouvelles de toi sur Minimoa. Rien de grave : la vie, ça occupe. » puis ce qui s'est passé (messages non lus, personnes qui ont fait signe, seulement celles qu'on peut encore lui montrer) ou « Rien ne presse : tout est là où tu l’as laissé. », et « si tu préfères faire une pause, c’est très bien aussi » | Une fois par absence ; rien au-delà (pas de relance à 30, 60, 90 jours) |
| Un mois avec son minimoa | Un mois après l'inscription (même jour du mois) | Push | Jour J (jusqu'à J + 2) | « Un mois avec Nino » / « Un mois que vous faites équipe. Merci d’être là. » | Une fois |
| Un an (puis chaque année) | Date anniversaire de l'inscription | Push | Jour J (jusqu'à J + 2) | « Un an avec Nino » (« 2 ans avec Nino »…) / « Joyeux anniversaire à vous deux. Viens voir le chemin parcouru. » | Une fois par année |
| Te revoilà (retour après longue absence) | Ouverture de l'accueil après 14 jours et plus sans l'ouvrir (mémoire de l'appareil) | Dans l'app (bandeau de l'accueil, en plus du « coucou » du minimoa) | À l'ouverture | « Te revoilà. Nino t’attendait. » / « Pendant ton absence : 3 messages non lus et 1 personne qui t’a fait signe. » ou « Rien n’a bougé sans toi : reprends où tu veux. » ; action « Voir mes chats » ou « Voir qui », fermeture « Merci » | Une fois par retour |
| Série en danger le soir (existant) | Le défi du jour pas fait, le soir (`rituels`) ; « à toi d'écrire » pour la série d'un lien (`links`) | Push | Le soir | « Ta série de 12 jours » / « Le défi du jour t’attend encore ce soir. » ; « Série avec Léa » / « 12 jours d’affilée. À toi d’écrire avant minuit. » | Une par jour chacun |

Ordre si deux tombent le même jour : anniversaire, puis absence, puis premiers pas ; l'autre attend le lendemain s'il est
encore dans sa fenêtre. Pendant les 10 premiers jours, les premiers pas remplacent les absences (une personne qui ne
revient pas après l'inscription reçoit J1, J2, J3, J5, J7, puis l'absence de 14 jours, et c'est tout). J1, J2 et J3 se suivent : ils ne se rattrapent pas le lendemain (`catchUpOf`).

Ordre des premiers pas changé le 19 nov. 2026 (audit de clarté : la promesse « ton minimoa te présente des gens » doit
arriver d'abord) : avant, J1 « 3 mots », J2 habitude, J3 groupe, J5 les gens. Clés du journal par sujet
(`first_steps:people`, `words`, `habit`, `group`, `week`) ; une ancienne clé par jour (`first_steps:d1`…) compte pour
son ancien sujet (`LEGACY_FIRST_STEP_TOPIC`) : une personne inscrite avant le changement ne reçoit jamais deux fois le
même message (elle peut en sauter un, jamais en recevoir un en double). Un report parti avant (`step` = `d1`…) garde son
ancien texte et son ancien lien (`firstStepOf`).

Les textes des cinq langues : `packages/content/src/v7/notifications.ts` (push), `packages/content/src/v7/fidelite.ts`
(e-mails), `apps/mobile/src/locales/pet.ts` (« Te revoilà »), `apps/mobile/src/locales/plus.ts` (bienvenue dans la
feuille), `apps/mobile/src/locales/moi.ts` (libellés des réglages).

## 3. Où c'est branché

- `packages/domain/src/fidelite.ts` : les règles pures (`fideliteDue`, `plusNewsAfter`, `plusGoodbyeDue`,
  `plusWinbackDue`, fenêtres, clés), testées dans `fidelite.test.ts`.
- `modules/fidelite` : `FideliteJobs.runDue(now)` (une ligne `fidelite` dans `modules/tick/jobs.ts`), `CatchUp` (ce qui
  s'est passé pendant une absence, filtré par `Audience`), le journal `LifecycleLog` (`lifecycle_messages`, réel et
  mémoire) et la lecture des personnes (`FidelitePeople`).
- `modules/billing` : `PlusNews` (appelé par `Subscriptions.apply` après chaque événement du magasin, et par
  `BillingJobs` pour l'au revoir et la relance).
- App : `features/pet/WelcomeBack.tsx` (accueil), réglages dans `app/moi/notifications.tsx`.
- Tests en mémoire : `apps/api/test/fidelite.e2e.test.ts`.

## 4. Textes pour Apple (à saisir dans App Store Connect seulement si le propriétaire le décide)

Rien de ceci n'est configuré aujourd'hui ; l'app et l'API marchent sans.

### Offres de reconquête (win-back)

App Store Connect › Abonnements › Minimoa+ › l'abonnement › Prix › « + » › Créer une offre de reconquête. Une offre
de reconquête n'a **pas de texte à elle** : l'App Store montre le nom affiché et la description de l'abonnement (déjà
localisés, `docs/APP-STORE-CONNECT.md` §4), l'icône, la durée et le prix ; une image de promotion (approuvée par la
revue, ni l'icône ni une capture) n'est demandée que pour la mettre en avant sur la fiche. Proposition, à valider :

| Champ | Annuel | Mensuel |
|---|---|---|
| Nom de référence (interne, définitif) | `Minimoa+ annuel · retour 2027` | `Minimoa+ mensuel · retour 2027` |
| Identifiant de l'offre (définitif) | `app.blowy.plus.yearly.retour1` | `app.blowy.plus.monthly.retour1` |
| Priorité | Normale | Normale |
| Durée payée minimale | 1 mois | 1 mois |
| Temps depuis la fin | de 1 à 6 mois | de 1 à 6 mois |
| Attente entre deux offres | 12 mois | 12 mois |
| Type | « Payer d'avance » (une première année à prix réduit) | « Paiement à l'usage » (2 ou 3 mois à prix réduit) |

Éviter le type « Gratuit » : l'API le lirait comme un essai gratuit (`offerDiscountType` = `FREE_TRIAL`) et enverrait
le rappel « ton essai se termine », pensé pour l'essai de 7 jours de l'annuel. Pas d'offre de reconquête sur
l'hebdomadaire. Une offre de reconquête est créée par produit et ne peut plus changer de prix ensuite.

Si une offre existe, la relance « tu nous manques » peut la mentionner sans prix (le prix vient de l'App Store) :
remplacer dans l'e-mail « Si l’envie revient, Minimoa+ se reprend en un instant dans l’app » par « Si l’envie revient,
l’App Store te propose un prix de retour pour Minimoa+ : tu le trouves dans Réglages › ton nom › Abonnements. » (même
idée dans chaque langue). Ne jamais écrire « dernière chance » ni une date de fin qui n'existe pas.

Côté app : rien à ajouter pour qu'une reconquête achetée sur l'App Store marche (elle arrive par `Transaction.updates`
et par les notifications serveur, `offerType` = 4). La proposer **dans** l'app (`PurchaseOption.winBackOffer` de
StoreKit, iOS 18) demanderait un écran et une version de plus.

### Offres promotionnelles

Aucune proposée : elles demandent une signature par une clé « In-App Purchase » côté serveur et un écran d'offre dans
l'app. Le paywall n'a pas besoin de promotion pour être honnête : l'essai de 7 jours de l'annuel suffit.

### Retention Messaging (message affiché quand quelqu'un touche « Annuler l'abonnement »)

API en préversion chez Apple (accès à demander par le titulaire du compte : « Request access to the Retention Messaging
API ») ; message par défaut par produit et par langue, texte seul (titre de 66 caractères au plus, corps de 144 ; à
vérifier sur la page d'Apple au moment de la saisie). Ne rien promettre d'autre que les avantages réels
(`entitlements`). Deux messages proposés :

**Message par défaut (les trois produits)**

| Langue | Titre | Corps |
|---|---|---|
| FR | Ce que Minimoa+ t’ouvre aujourd’hui | Toute la carte, une rencontre de plus chaque jour, 6 habitudes, le bilan détaillé et les objets premium. Tout le reste de Minimoa est gratuit. |
| EN | What Minimoa+ opens up for you today | The whole map, one more encounter a day, 6 habits, the detailed review and the premium items. The rest of Minimoa stays free. |
| ES | Lo que Minimoa+ te abre hoy | Todo el mapa, un encuentro más al día, 6 hábitos, el resumen detallado y los objetos premium. El resto de Minimoa sigue siendo gratis. |
| PT | O que o Minimoa+ libera para você hoje | O mapa inteiro, um encontro a mais por dia, 6 hábitos, o resumo detalhado e os itens premium. O resto do Minimoa continua grátis. |
| NL | Wat Minimoa+ vandaag voor je opent | De hele kaart, elke dag een ontmoeting meer, 6 gewoonten, het uitgebreide overzicht en de premium items. De rest van Minimoa blijft gratis. |

**Changer d'offre (mensuel et hebdomadaire → annuel ; message « switch-plan », temps réel seulement)**

| Langue | Titre | Corps |
|---|---|---|
| FR | Même Minimoa+, payé moins souvent | L’offre annuelle coûte moins cher que douze mois d’abonnement mensuel, avec exactement les mêmes avantages. |
| EN | Same Minimoa+, paid less often | The yearly plan costs less than twelve months of the monthly plan, with exactly the same benefits. |
| ES | El mismo Minimoa+, pagando menos veces | El plan anual cuesta menos que doce meses del plan mensual, con exactamente las mismas ventajas. |
| PT | O mesmo Minimoa+, pagando menos vezes | O plano anual custa menos que doze meses do plano mensal, com exatamente as mesmas vantagens. |
| NL | Hetzelfde Minimoa+, minder vaak betalen | Het jaarabonnement kost minder dan twaalf maanden van het maandabonnement, met precies dezelfde voordelen. |

Le second message compare l'annuel au mensuel (vrai à tous les prix actuels) et jamais à l'hebdomadaire ; il demande
le flux « temps réel » (un point d'accès de l'API qui répond à Apple, avec test de performance) : **non construit**.
Le message par défaut, lui, se configure une fois, sans code.

### Textes de l'abonnement hebdomadaire (App Store Connect)

Nom affiché : FR « Minimoa+ hebdomadaire », EN « Minimoa+ Weekly », ES « Minimoa+ semanal », PT « Minimoa+ semanal »,
NL « Minimoa+ wekelijks ». Description (55 caractères au plus), la même que les deux autres : FR « Toute la carte, plus
de rencontres, et plus encore ».

## 5. Ce que le propriétaire doit faire

1. Faire appliquer la migration `supabase/migrations/20261117140000_hebdo_fidelisation.sql` (avant le code ;
   `docs/DEPLOIEMENT-V7.md` §12).
2. App Store Connect : activer le **Billing Grace Period** (Abonnements › Minimoa+ › Délai de grâce de facturation,
   16 jours, tous les renouvellements) ; vérifier que les notifications serveur **v2** pointent sur l'API (production et
   bac à sable).
3. Décider des offres de reconquête et du message de Retention Messaging (§4), ou ne rien faire.
4. En bac à sable : acheter, faire échouer un renouvellement (Réglages › App Store › Compte Sandbox › Gérer), annuler,
   et vérifier les push et les e-mails reçus.

## 6. Premier déploiement : ne pas relancer les anciens abonnés

La relance ne part qu'entre 30 et 37 jours après la fin, et l'au revoir dans les 7 jours : au premier passage, seuls les
abonnements finis dans ces fenêtres sont concernés. Pour qu'aucun ancien abonné ne reçoive la relance (choix possible),
avant le déploiement :

```sql
insert into public.lifecycle_messages (user_id, key, sent_at)
select distinct s.user_id, 'plus_winback', now()
from public.subscriptions s
where s.user_id is not null and s.expires_at < now()
on conflict (user_id, key) do nothing;
```
