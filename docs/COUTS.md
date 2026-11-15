# Coûts de Blowy — modèle et estimations par palier

Objectif (spéc §22) : tenir 1 M de téléchargements avec des coûts d'IA et d'API aussi bas que possible, et presque
rien tant qu'il n'y a personne. Prix publics relevés le **15 novembre 2026** sur les pages citées ; tout montant en
dollars US, hors TVA. Ce qui n'a pas pu être vérifié est signalé « **non vérifié** ».

## 1. Hypothèses d'usage

| Palier (téléchargements) | Actifs du mois (MAU, 25 %) | Actifs de la semaine (15 %) | Actifs du jour (DAU, 8 %) |
|---|---|---|---|
| 1 k | 250 | 150 | 80 |
| 10 k | 2 500 | 1 500 | 800 |
| 100 k | 25 000 | 15 000 | 8 000 |
| 1 M | 250 000 | 150 000 | 80 000 |

Par personne active un jour donné : 2 liens actifs, 15 messages écrits, 0,5 photo du jour, 0,75 preuve d'habitude
(la moitié des actifs tient une habitude, 1,5 preuve chacun), 5 push reçus. 40 % des liens ont l'accord des deux
pour la lecture par l'IA. Ces ratios sont des hypothèses de travail, à remplacer par les chiffres réels de
l'administration (« Coûts » et « Vue d'ensemble ») dès les premières semaines.

## 2. IA

### Prix et règles retenues
- Petit palier = **Claude Haiku 5.5** (`claude-haiku-5-5`) : 0,10 $ / million de jetons en entrée, 0,50 $ en sortie
  (prompt ≤ 100 k jetons), lecture du cache 0,01 $, écriture 0,125 $ ; lots −50 %.
  Palier moyen = **Claude Sonnet 5.5** (`claude-sonnet-5-5`) : 2 $ / 10 $. Sources : [modèles](https://platform.claude.com/docs/en/models/overview),
  [tarifs](https://platform.claude.com/docs/en/about-claude/pricing).
- Cache des consignes : marqué sur chaque consigne système, mais il ne s'applique qu'au-delà de **512 jetons** pour
  Haiku 5.5 et Sonnet 5.5 ([prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)).
  Nos consignes font ~300–400 jetons : le cache ne joue pas aujourd'hui ; c'est voulu (une consigne courte coûte
  moins qu'une consigne longue mise en cache). Si une consigne dépasse 512 jetons, il s'active sans changement de code.
- Image de preuve réduite à 512 × 512 : ⌈512/28⌉² = **361 jetons** ([vision](https://platform.claude.com/docs/en/build-with-claude/vision)).
- Les modèles récents comptent ~30 % de jetons de plus pour le même texte (page des tarifs) : les estimations
  ci-dessous comptent ~4 caractères par jeton ; garder une marge de 30 %.
- Tout passe par `AiGateway` : interrupteur (`AI_KILL_SWITCH`), plafond global du jour (`AI_DAILY_CEILING_USD`,
  3 $ par défaut), budget par personne, jour et fonction (`AI_USER_BUDGETS`), compteur `ai_usage_daily`.
  Quand l'IA refuse, une règle ou un modèle de phrase prend le relais : le produit marche à 0 $ d'IA.

### Appels par personne active et par jour

| Fonction | Déclencheur (jamais un appel par message) | Plafond codé | Appels moyens / DAU / jour | Jetons par appel (entrée / sortie) | Coût par appel | Coût / DAU / jour |
|---|---|---|---|---|---|---|
| `chat_remark` (remarque, relance) | lien où les deux ont dit oui : tous les 12 messages ; silence de 72 h | 3 interventions / lien / jour (règles comprises) ; 4 appels / personne / jour | 0,46 | ~650 / 30 | 80 µ$ | 37 µ$ |
| `moderation` (garde-fou) | heuristique de ton locale d'abord ; accord des deux | 1 par 24 h par lien ; 4 / personne / jour | inclus ci-dessus (~0,05) | ~650 / 30 | 80 µ$ | — |
| `habit_proof` (chantier « rituels ») | photo de preuve, 512 px, réponse de 4 jetons | 6 / personne / jour | 0,75 | ~750 / 4 | 77 µ$ | 58 µ$ |
| `weekly_review` (chantier « rituels ») | dimanche, comptes actifs de la semaine seulement | 1 / personne / jour | 0,27 (WAU / 7 / DAU) | ~900 / 250 | 215 µ$ | 58 µ$ |
| **Total** | | | | | | **≈ 150 µ$ (0,00015 $)** |

Brise-glace, premiers messages du jour, réactions aux mots doux et vannes, relances sans accord, santé du lien,
textes des notifications : **règles, 0 appel**.

Pire cas théorique (chaque actif atteint tous ses plafonds chaque jour) : ≈ 1 130 µ$ / DAU / jour, soit ~90 $ par jour
à 1 M de téléchargements — c'est le rôle du plafond global de l'empêcher.

| Palier | IA par jour (moyen) | IA par mois (moyen) | Plafond global conseillé (`AI_DAILY_CEILING_USD`) |
|---|---|---|---|
| 1 k | 0,01 $ | 0,4 $ | 3 $ (défaut) |
| 10 k | 0,12 $ | 3,7 $ | 3 $ (défaut) |
| 100 k | 1,2 $ | 37 $ | 3 $ (défaut), puis 5 $ |
| 1 M | 12 $ | 365 $ | **25 $** (à relever : avec 3 $, l'IA s'arrête chaque jour vers 10 h et les règles prennent le relais) |

Leviers si la facture monte : baisser `AI_USER_BUDGETS` (sans redéploiement), passer le bilan en traitement par lots
(−50 %, il n'est pas urgent), réserver le bilan par IA à Blowy+, couper `chat_remark` par l'interrupteur.

## 3. Notifications push

Service push d'Expo : « There is no cost associated with sending notifications through Expo push notification
service » ([FAQ Expo](https://docs.expo.dev/push-notifications/faq/)). Limites : 600 notifications par seconde et par
projet, 100 messages par requête ([envoi](https://docs.expo.dev/push-notifications/sending-notifications/)) — l'adaptateur
envoie par lots de 100 et vérifie les reçus 15 min plus tard. Volume : ≤ 3 par jour hors messages + messages
(un par lien toutes les 5 min au plus) ≈ 5 par DAU et par jour, soit 400 000 par jour à 1 M de téléchargements,
très en dessous de la limite. **Coût : 0 $** à tous les paliers. (Le compte Apple Developer et la clé APNs sont des
frais fixes hors de ce tableau — **non vérifié** ici.)

## 4. Base de données, authentification, temps réel, fichiers (Supabase)

Source : [supabase.com/pricing](https://supabase.com/pricing).
- **Free** : 0 $, 500 Mo de base, 50 000 MAU d'auth, 1 Go de fichiers, 5 Go de sortie, 200 connexions temps réel
  simultanées et 2 M de messages ; projet mis en pause après une semaine d'inactivité.
- **Pro** : à partir de 25 $ / mois : 8 Go de disque puis 0,125 $ / Go ; **100 000 MAU puis 0,00325 $ / MAU** ;
  250 Go de sortie puis 0,09 $ / Go ; 100 Go de fichiers puis 0,0213 $ / Go ; temps réel 500 connexions simultanées
  puis 10 $ les 1 000, 5 M de messages puis 2,50 $ le million. 10 $ de crédit de calcul inclus (instance Micro) ;
  Small 15 $, Medium 60 $, Large 110 $, XL 210 $ par mois.

Volumes estimés (hypothèses du §1) :
- **Base** : ~300 octets par message (ligne + index) × 15 par DAU et par jour ≈ 135 Ko par DAU et par mois ;
  journal des notifications purgé après 3 jours, compteurs d'IA par personne après 2 jours, tickets après 1 jour.
  À 1 M : ~11 Go de plus par mois (≈ 1,5 $ / mois de disque supplémentaire, cumulatif). Chaque liste a son index
  (voir la migration `20261115150000_plateforme.sql`) ; ranger `messages` par mois quand la table dépassera ~100 Go.
- **Temps réel** : seulement les chats ouverts (≈ 30 % des messages livrés en direct, 2 destinataires) :
  à 1 M, ~22 M de messages par mois → ~42 $ ; ~2 400 connexions simultanées au pic → ~20 $.
- **Fichiers** : photo du jour compressée sur le téléphone (~150 Ko), 0,5 par DAU et par jour ≈ 2,25 Mo par DAU et par
  mois ; preuves d'habitude supprimées sous 24 h. À 1 M : ~180 Go de plus par mois, cumulatif (~1 To après 6 mois
  ≈ 19 $ / mois) ; sortie des photos vues ~360 Go / mois → ~10 $ au-delà des 250 Go inclus.
- **Authentification** : c'est le poste qui grossit le plus — au-delà de 100 000 MAU, 0,00325 $ par MAU.

## 5. Hébergement de l'API

[Railway](https://railway.com/pricing) : Hobby 5 $ / mois minimum (5 $ d'usage inclus), Pro 20 $ ; à l'usage
≈ 0,000463 $ par vCPU-minute, ≈ 0,000232 $ par Go-minute de mémoire, 0,05 $ / Go de sortie ; tâches cron disponibles
sur Hobby et Pro. Une instance 0,5 vCPU / 512 Mo tournant tout le mois ≈ 15 $. L'API est sans état (cache et
limiteur en mémoire par instance, remplaçables par un cache partagé dans `PlateformeModule`) ; le minuteur est un
appel HTTP toutes les 5 minutes (Railway cron ou `pg_cron` de Supabase, gratuit). Sortie JSON estimée à
~0,5 Mo par DAU et par jour (les photos passent par des URL signées de Supabase, pas par l'API).

Non comptés ici : e-mails (Resend, peu d'envois : bienvenue, lien créé, coucou — tarif **non vérifié**),
fond de carte Apple (MapKit, annoncé sans clé ni coût dans la spéc — **non vérifié**), nom de domaine.

## 6. Estimation par palier (par mois)

| Poste | 1 k | 10 k | 100 k | 1 M |
|---|---|---|---|---|
| IA (moyenne, §2) | 0,4 $ | 4 $ | 37 $ | 365 $ |
| Push Expo | 0 $ | 0 $ | 0 $ | 0 $ |
| Supabase : forfait | 0 $ (Free) ou 25 $ (Pro, conseillé dès la mise en ligne : pas de pause) | 25 $ | 25 $ | 25 $ |
| Supabase : calcul (au-delà des 10 $ de crédit) | 0 $ | 0 $ | 5 $ (Small) | 100 $ (Large) |
| Supabase : MAU d'auth au-delà de 100 000 | 0 $ | 0 $ | 0 $ | 488 $ (150 000 × 0,00325 $) |
| Supabase : temps réel au-delà de l'inclus | 0 $ | 0 $ | 0 $ | ~60 $ |
| Supabase : fichiers, disque, sortie au-delà de l'inclus | 0 $ | 0 $ | ~5 $ | ~35 $ (après 6 mois) |
| API (Railway) | 5 $ | 5–15 $ | 15–30 $ | 120–180 $ |
| **Total estimé** | **≈ 5–30 $** | **≈ 35–45 $** | **≈ 90–100 $** | **≈ 1 200–1 250 $** |
| Par personne active du mois | — | ~0,016 $ | ~0,004 $ | ~0,005 $ |

À retenir :
- Presque rien au départ : l'IA coûte moins de 1 $ par mois à 1 k téléchargements ; le coût fixe est le forfait
  Supabase et l'instance de l'API.
- À 1 M, le premier poste n'est pas l'IA (~30 %) mais l'**authentification Supabase au MAU** (~40 %).
  À surveiller : compter les MAU réels, et si besoin négocier ou comparer avant d'atteindre ce palier.
- L'IA est bornée par construction : plafond global, budgets par personne, 3 interventions par lien et par jour,
  jamais d'appel par message ; l'interrupteur ramène son coût à 0 $ sans dégrader le produit (règles).

## 7. Suivi

- Administration → « Coûts » : appels, refus, erreurs, jetons et dépense estimée par jour, fonction et palier
  (`AiUsage.summary`), plafond et interrupteur.
- Revoir ce tableau à chaque palier franchi avec les vrais ratios (MAU / téléchargements, messages et photos par
  actif, part des liens avec accord), et les prix des pages citées.
