# Jury tour 7 — investisseur (Investisseur seed (consumer social))

**Verdict** : Business-model est enfin en V5.6 avec une astreinte nationale jour et soir, les sorties pour sécurité, les annulations par Blowy, le parrainage et la cannibalisation de Blowy+ (contribution ≈ 4,49 € par sortie, point mort ≈ 134 sorties par jour) ; mais le même document garde un tableau qui place le point mort à 80, il ne compense pas le lieu pour les tables Duo que la spec et l'écran lieu compensent, le SLA de 5 min affiché n'est pas dans le coût, et toujours ni cohorte ni avis juridique.

**Note globale : 9/10** (T1 4 · T2 6 · T3 7 · T4 8 · T5 8 · T6 8 · T7 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 9 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 7 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 6

- **business-model complet (T6 n° 1)** : fait pour l'essentiel (astreinte mutualisée jour + soir, sécurité, Blowy annule, parrainage, cannibalisation, point mort national). Restent : deux points morts (80 dans le tableau, 134 dans le texte), Duo « 0 € » contre la spec, SLA 5 min non dimensionné, ville d'amorçage absente, en-tête « Révisé après les jurys tours 3 et 4 ».
- **Une base (HT) et un chiffre partout (T6 n° 2)** : fait (Tarifs, L-Effectif, L-Contrat, spec §6.2 « 3e sortie »). Spec §10.1 garde « volume national du soir ».
- **Avis juridique Blowy+, cohorte de 8 semaines (T6 n° 3)** : pas faits.
- **Code** : E1, E7, E8, E10 fermés côté serveur ; E22 (sécurité non compensée), E23, E24 ouverts.

## Contrôles

`node design/v5/check-facts.mjs` : 104 fichiers, 6 925 vérifications, 0 contradiction. `a11y-audit.mjs` lancé comme le README l'indique (`.local/dc-runtime.js`) : 104 écrans, 1 520 textes, 564 cibles, 1 569 blocs, 0 problème, contraste min 4,53:1 (lancé sans argument, il sort 3 « problèmes » d'outillage : `{{blockMark}}` non résolu sur V5-Signaler, « Voir ma ville » à 888 px sur W-Repondre ; les rendus PNG sont propres). `tooling/qa/layout/overflow.mjs` : aucun signalement. Les 104 rendus ouverts (planches 4 par 4, lieu en taille réelle). Ce que les outils ne voient pas, relevé à la main : (1) **V5-Revelation** n'a aucun bouton « je pars pour ma sécurité » : les deux sorties proposées sont « Je connais quelqu'un ici » (1 fois par mois) et « Je ne le sens pas · imprévu » (place **non remboursée**), alors que « partir mal à l'aise » sur place (V5-Checkin-ok) est une sortie pour sécurité **remboursée** : ne pas venir coûte, venir puis partir ne coûte rien ; (2) « « Je connais quelqu'un ici » : 1 fois par mois, place remboursée » sur 10 écrans, sans la suite du concept A.1 / spec §2.7 (D-073) : « au-delà, sortie pour ta sécurité, sans pénalité » ; (3) W-Ange-aide « appelle Alex sous 5 min » : `facts.sla.aide` = 5 min, mais spec `[T] safety.humanResponseMinutes` = 60, §7.4 `responseMinutes:60`, et business-model ne dimensionne aucun délai de 5 min ; la même page, adressée à l'ange, dit « pendant toute **ta** sortie » ; (4) V5-RdvDuo, V5-RdvDuo-lea, V5-Duo-hh-rdv : « joignable pendant toute ta sortie » sur un rendez-vous, alors que concept A.5 et le glossaire de la spec disent « ta sortie ou ton rendez-vous » (la phrase canonique de `facts.regles.astreinte` a gardé la moitié) ; (5) spec §2.7 cite comme phrase « affichée à l'identique partout » « …sauf si tu pars pour ta sécurité (toujours possible, remboursé) ou pour un imprévu (1 fois par mois, non remboursé) », texte qu'aucun écran n'affiche ; spec §6.5 et §10.2 : « Si Blowy annule une sortie confirmée, le lieu reçoit 3 € par place réservée », écrans et contrat : « Sortie annulée par Blowy à la confirmation ou après : 3 € HT… » ; et spec §2.6 (`→ CANCELLED` à `lockAt` si < 4 : remboursements, aucune compensation ; §6.5 « avant la confirmation : 0 ») contre V5-Sortie-annulee (annulée à 18 h à la confirmation → 3 € HT au lieu) ; (6) spec §2.11 « **Non par défaut** » contre V5-Apres (aucune pastille cochée) ; spec §2.13 / §3.2 (prénom dès `EXCHANGE`) contre V5-Duo, V5-Lien et Confidentialité (« le prénom, aux visages ») ; (7) business-model V5.6 : le tableau d'astreinte calcule un point mort à 80 sorties/jour avec 7,59 €, le texte en dessous à 134 avec 4,49 € ; « Duo à une table de 2 : sans garantie ni compensation pour le lieu, 0 € » contre spec §2.13 / §6.5 et L-Creneaux (« même règle de compensation ») ; spec §10.1 « volume national **du soir** » ; (8) L-Effectif : « Relevé de novembre » qui commence au « jeu. 29 oct. » ; effectif limité au jeudi alors que L-Creneaux ouvre mardi, samedi, dimanche et une table de 2 ; L-Contrat art. 3 ne nomme ni la sortie pour sécurité ni l'imprévu (une place **payée** libérée pour sécurité vaut 4,16 € HT d'après le contrat, 3 € HT d'après la spec §6.5) ; le message d'accueil n'existe dans aucune section de la spec et n'apparaît pas sur V5-Confirmation ; (9) V5-Attente : « Si elles arrivent d'ici le jeu. 19 nov. » pour le sam. 21 nov., composé le mer. 18 nov. 21 h (J − 3) ; V5-Pas-encore et V5-Pas-encore-nantes : « On te prévient mardi à 21 h » (`facts.nantes.prevenu` en dur) alors que la spec calcule l'état honnête le vendredi 21 h W−1 et que le jeudi de Nantes se compose le lundi ; (10) V5-Trouvee : « Lieu calme, comme demandé dans Affiner » sur la 1re Trouvée, juste après l'onboarding (Affiner est « plus tard », écran 26) ; V5-Welcome « 60 ans et plus » contre la grille « 50 ans et plus » ; (11) Confidentialité n'a pas de ligne fiabilité (« Personne : tes votes, ta position, ton âge exact, ce que tu cherches »), ni contacts évités ni cartes (spec §2.16) ; V5-Ange garde sa propre liste ; (12) V5-Cartes : « Chaque carte … s'exporte en vidéo de 5 s » alors que « 3 mots » (V5-Story) et « Inviter » n'ont pas ce bouton ; aucun aperçu vidéo nulle part ; (13) spec §11.4 : E22 (sortie pour sécurité non compensée au lieu), E23 (« je connais quelqu'un » hors quota = **absence** dans le code), E24 (fiabilité exposée aux autres dans les contrats) sont « à faire » ; (14) V5-Team « GARDER LA PLACE DE TOM (30 MIN) » toujours plein bord ; V5-Revelation et V5-Duo-hh-visages « les captures sont détectées et signalées » (absolu).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | « Une sortie dès 5 personnes, partout » : business-model V5.6 place le point mort national à ≈ 134 sorties/jour (≈ 670 participants/jour) ; sous ce volume, chaque ville ouverte creuse la perte d'astreinte. | Plan de montée en volume (villes ouvertes par palier de sorties/jour) dans business-model. |
| V5-Ville | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Ville-bordeaux | 9 | ≈ 60 personnes, 3 lieux : le coût d'amorçage d'une ville (lieux, 1res sorties offertes) n'a pas de ligne ; seule l'astreinte est déclarée « sans surcoût ». | Ligne « ville d'amorçage ». |
| V5-Toi | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Genre | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Pet | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Rencontrer | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Intention | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Consentement | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Toi-plus | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Dispos | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Dispos-semaines | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Eviter | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Erreur-age | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Trouvee | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Trouvee-lyon | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Sortie-lyon | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Confirmation-lyon | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Trouvee-banlieue | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Sortie-banlieue | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Confirmation-banlieue | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Pas-encore | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Ville-nantes | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Trouvee-nantes | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Sortie-nantes | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Pas-encore-nantes | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Sortie | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Team | 10 | Parrainage = −1,15 €/sortie à 0,3 filleul : chiffré. | — |
| V5-Partage-invitation | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Invite | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Compte | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Verif | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Notifs | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Sortie-inscrit | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Accueil | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Accueil-discret | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Accueil-duo | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Pause | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Chats | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Groupe | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Groupe-menu | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Attente | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage-ville | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Amorcage | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Amorcage-solo | 9 | 5 places offertes d'un coup : CAC d'amorçage non chiffré. | Idem. |
| V5-Sortie-complete | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Sortie-annulee | 9 | Ligne « Blowy annule » chiffrée (2 % des sorties, −0,51 €) ; mais l'écran compense le lieu quand la sortie tombe à 18 h faute de monde, la spec non (§2.6) : le taux à mesurer n'est pas le même selon la version retenue, et il sera bien plus haut que 2 % en ville d'amorçage. | Trancher la règle ; taux d'annulation à 18 h par ville dans le test. |
| V5-Affiner | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Affiner-histoire | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Affiner-age | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Affiner-ambiance | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Confirmation | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage-confirmation | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Revelation | 9 | Sortie pour sécurité à 1 % des places (−0,34 €) : chiffrée. Si « Je ne le sens pas » devient un bouton sécurité (ce qu'il faut côté confiance), ce taux montera : sensibilité à prévoir. | Sensibilité 1 % → 5 %. |
| V5-Partage-checkin | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Ange | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| W-Ange | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| W-Ange-aide | 8 | « sous 5 min » : le modèle d'astreinte (2 personnes × 12 h, 600 €/jour pour la France) ne tient pas 5 min sur deux alertes simultanées, et la plage réelle (dim. 11 h → fin de sortie ≈ 23 h, RDV compris) dépasse 12 h. Spec : 60 min. | SLA en `[T]` et effectif d'astreinte dimensionné dessus (pics du jeudi et du samedi). |
| V5-Checkin | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Checkin-ok | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Souvenir | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Apres | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Apres-resultats | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage-jeudi | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage-dimanche | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Apres-aucun | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Bande | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Partage-bande | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Rue | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Duo | 9 | 3 duos gratuits : modération et RDV sans revenu, non chiffrés. | Coût par duo. |
| V5-Lien | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Duo-hh-proposition | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Duo-hh | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Duo-hh-visages | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Duo-hh-rdv | 8 | Idem à Marseille. | Idem. |
| V5-Lien-debloque | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-RdvDuo | 8 | Business-model : « Duo à une table de 2 : sans compensation pour le lieu, 0 € » ; spec §2.13 / §6.5 et L-Creneaux : absence au RDV = 3 € HT au lieu, astreinte mobilisée. Le modèle sous-estime un produit gratuit. | Ligne Duo : taux d'absence × 3 € HT + part d'astreinte. |
| V5-Chat | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-RdvDuo-lea | 8 | Idem, un samedi 15 h. | Idem. |
| V5-Oeuf | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Rupture | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Cartes | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Story | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| W-Repondre | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Profil | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Fiche | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Tarifs | 10 | Base HT/TTC explicite. | — |
| V5-Abonnement | 9 | « 3e sortie », spec alignée ; cannibalisation chiffrée (−1,10 €). Avis juridique sur Blowy+ par Stripe : toujours pas écrit. | Avis écrit avant soumission. |
| V5-Paiement | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Paiement-ok | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Reglages | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Confidentialite | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Signaler | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Supprimer | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Chargement | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Erreur-reseau | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Paiement-echec | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Verif-echec | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Notifs-refus | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| V5-Chats-vide | 10 | Rien qui change l'économie unitaire sur cet écran. | — |
| L-Effectif | 9 | Tout en HT : réglé. Période de relevé fausse (29 oct. dans novembre) : le rapprochement mensuel finance ne passera pas. | Période juste. |
| L-Creneaux | 9 | Créneaux de jour (sam. 15 h, dim. 11 h) : l'astreinte de jour est maintenant dans le modèle, mais sur 12 h seulement. | Plage réelle. |
| L-Contrat | 8 | Sans engagement, préavis 30 jours : aucun actif durable côté offre ; sortie pour sécurité non nommée (montant ambigu), non compensée dans le code (E22). | Engagement minimal de créneaux ; article 3 complet ; E22. |

## Les 3 changements qui feraient monter ma note le plus

1. business-model : un seul point mort (tableau recalculé à 4,49 €), ligne Duo (absences compensées 3 € HT + astreinte des RDV), astreinte dimensionnée sur la plage réelle et le SLA de 5 min, coût d'une ville d'amorçage, sensibilité du taux de sortie pour sécurité.
2. Spec et écrans d'accord sur la compensation quand une sortie tombe à 18 h (une règle, un taux à mesurer) et E22 fermé.
3. Avis juridique écrit sur Blowy+ via Stripe, puis cohorte de 8 semaines publiée.

## Je mets 10 si…

Je mets 10 si la cohorte de 8 semaines montre ≥ 40 % de 2e sortie payante sous 21 jours, ≥ 25 % d'actifs à M2, ≥ 0,3 inscrit vérifié par sortie vécue attribué par slug, une contribution positive après astreinte nationale dimensionnée sur le SLA affiché (5 min) et toutes les compensations (Duo compris), au moins 5 lieux sous contrat par quartier ouvert, un avis juridique écrit sur le canal de Blowy+, et si spec, concept, business-model et écrans ne divergent sur aucun chiffre (point mort, compensation Duo, annulation à 18 h).
