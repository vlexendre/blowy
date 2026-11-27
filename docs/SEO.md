# SEO de minimoa.app

Audit du 18 novembre 2026. Deux volets : la technique (crawl du sitemap et Lighthouse 12 sur le site en ligne) et les
mots-clés (DataForSEO via treg, Google France, langue française). Données brutes : `/home/claude/work/seo/`
(`audit.json`, `mots-cles-fr.csv`, `serp_*.json`).

## 1. Technique

Conforme : 65 pages du sitemap en 200, un titre et une description par page et par langue, canonique absolue,
`hreflang` des 5 langues + `x-default` sans aucune erreur de réciprocité, sitemap avec alternates, Lighthouse SEO 100,
performance ordinateur 99.

Corrigé (branche `web-seo`) : données structurées (Organization, WebSite, MobileApplication, FAQPage, fil
d'Ariane), bannière d'app Safari, `robots.txt` qui bloquait les aperçus X des liens `/m/` et `/i/`, performance mobile
(74-80, LCP 3,3 s, TBT 450-730 ms), cache des fichiers, accessibilité, descriptions trop longues, titres.

## 2. Mots-clés (France, volumes mensuels Google, novembre 2026)

| Intention | Requêtes | Recherches/mois | Difficulté |
|---|---|---|---|
| « app / appli / site pour se faire des amis » | 61 | 6 500 | très faible (1 à 10, jusqu'à 38 pour « site … gratuit ») |
| « comment se faire des amis » + adulte, timide, nouvelle ville | 281 | 12 500 | quasi nulle, **mais** « comment se faire des amis » seul est surtout le livre de Dale Carnegie |
| Livre de Carnegie (à ignorer) | 85 | 8 800 | — |
| Villes (« se faire des amis à Paris », « rencontrer des gens à Lyon »…) | 115 | 2 850 | 0 à 1 |
| Associations / activités pour rencontrer des gens | 15 | 800 | faible |
| « près de chez soi / autour de moi » | 8 | 480 | 26 |

Villes : Paris 1 350, Lyon 250, Bordeaux 220, Toulouse 200, Nantes 160, Lille 150, Marseille 130, Rennes 130,
Montpellier 110, Nice 80, Strasbourg 70.

Têtes de requêtes : « application pour se faire des amis » (1 000, KD 1), « appli pour se faire des amis » (1 000, KD 3),
« app pour se faire des amis » (1 000), « site pour se faire des amis » (390), « rencontrer des gens près de chez soi »
(390), « association pour rencontrer des gens » (590), « comment rencontrer des gens quand on est seul(e) » (2 × 320).

Qui se classe : uniquement des articles « les meilleures applis pour se faire des amis », Reddit (r/france,
r/SocialParis), Meetup, et une app concurrente (« Random »). Aucune app ne tient la requête avec sa propre page :
la place est libre et la difficulté est faible partout.

## 3. Plan

1. **Page d'accueil** sur « l'app pour se faire des potes près de chez toi » (titres déjà ajustés dans les 5 langues).
2. **Pages par ville** indexables : « Se faire des amis à Paris » … une par grande ville, branchées sur les quartiers
   (compteur d'inscrits, « ouvre ton quartier »), contenu propre à chaque ville. Commencer par les 11 villes ci-dessus.
3. **Guides** (une page chacun, utiles et honnêtes) : se faire des amis à l'âge adulte ; quand on est timide ; dans une
   nouvelle ville ; où rencontrer des gens quand on est seul ; associations et activités pour rencontrer du monde.
4. **Relations presse / listes** : demander l'ajout de Minimoa aux articles « meilleures applis pour se faire des
   amis » qui tiennent la première page (c'est là que les gens cherchent).
5. **Hors France** (Belgique, Suisse, Luxembourg ; anglais, espagnol, portugais, néerlandais) : même étude par marché
   avant d'écrire des pages dans ces langues.

## 4. Autres marchés (DataForSEO, 18 novembre 2026)

Le Luxembourg n'est pas couvert par la base de mots-clés DataForSEO. Les volumes sont des recherches Google par mois ;
plusieurs variantes d'une même requête portent souvent le même chiffre (groupes de synonymes) : les totaux sont des
ordres de grandeur. Détail : `/home/claude/work/seo/mots-cles-marches.csv`.

| Marché | Intention « app pour se faire des amis » | Villes | Lecture |
|---|---|---|---|
| Belgique, français | ~90 (« application pour se faire des amis » 50) | Bruxelles, Liège : 10 à 30 chacune | petit : une page Bruxelles et une page Liège suffisent |
| Suisse, français | ~60 (« app / application pour se faire des amis » 20 chacune, KD 46) | Genève, Lausanne : ~10-30 ; « se faire des amis en Suisse » 20 | petit : pages Genève et Lausanne |
| Belgique, néerlandais | ~70 (« app om vrienden te maken » 70, KD 0) | « vrienden maken in de buurt » 40, Anvers, Gand ~10 | petit ; vaut une page nl « vrienden maken in je buurt » |
| Pays-Bas (hors lancement) | ~210 (« vrienden maken app » 210, KD 4) | Amsterdam 40, Utrecht 30, Rotterdam 20 ; « in de buurt » 90 | à garder pour une ouverture des Pays-Bas |
| Royaume-Uni (hors lancement) | ~1 300 (« app to make friends », KD 15) | — | gros, concurrentiel ; « how to make friends » est surtout le livre |
| Espagne (hors lancement) | ~880 (« app para hacer amigos », KD 0) | — | intéressant le jour où l'Espagne ouvre |
| Brésil (hors lancement) | ~1 000 (« app para fazer amigos », KD 0) | — | idem ; « fazer amigos » est surtout le livre |

Décision proposée : rester centré sur la France (6 500 recherches/mois sur l'intention « app », 2 850 sur les villes) ;
ajouter 5 pages villes francophones hors de France (Bruxelles, Liège, Genève, Lausanne, Luxembourg) et une page en
néerlandais « vrienden maken in je buurt » pour la Flandre ; pas de pages villes ni de guides en anglais, espagnol ou
portugais tant que ces pays ne sont pas ouverts (les landings traduites suffisent).

Fait (18 novembre 2026) : `/se-faire-des-amis/bruxelles/`, `/liege/`, `/geneve/`, `/lausanne/`, `/luxembourg/`
(section « Belgique, Suisse, Luxembourg » du sommaire ; seule Bruxelles a une zone de quartier dans `@blowy/domain`, les
autres renvoient à `/quartier/`) et `/nl/vrienden-maken/` (néerlandais seul, canonique, sans hreflang, lien dans le
pied de page des pages en néerlandais ; texte : `apps/web/src/content/editorial/nl/vrienden-maken.ts`).

## 5. Suivi quotidien

Positions : `docs/seo/positions.csv` (date, requête, position Google France ou vide, URL classée), relevées par la routine
SEO quand `treg` est disponible.

- 19 novembre 2026 : guide `/guides/application-pour-se-faire-des-amis/` (requêtes « application / appli / app / site pour
  se faire des amis », intention « liste » de la première page : comparaison honnête des familles d'applis) ; maillage
  contextuel (chaque ville et chaque guide cité dans le texte d'au moins 3 autres pages, ancres variées, contrôle ajouté à
  `scripts/editorial-check.mts`) ; un seul `h1` sur /quiz/ et /quartier/ (les états cachés passent en `h2`).
- 20 novembre 2026 : guide `/guides/rencontrer-des-gens-pres-de-chez-soi/` (requête « rencontrer des gens près de chez soi »,
  390/mois, et variantes « autour de moi », « ses voisins ») : immeuble, lieux du quartier, bénévolat, outils locaux, passer
  du bonjour au café ; cité dans le texte des guides « seul », « application », « nouvelle ville » et de la page Nantes.
  Santé : 92 URLs en 200, aucune erreur ; Lighthouse mobile / 95-100-100, Lyon 99-100-100. Positions non relevées (`treg`
  absent de l'environnement de la routine).
- 21 novembre 2026 : page ville `/se-faire-des-amis/toulon/` (prochaine grande ville absente par population ; requêtes
  « se faire des amis / rencontrer des gens à Toulon ») : ville de nouveaux arrivants (Marine, hôpital, université),
  Mourillon, Haute-Ville et cours Lafayette, Chalucet, mont Faron, bateaux-bus de la rade, stade Mayol ; sans zone de
  quartier (renvoi à `/quartier/`). Citée dans le texte de Marseille, Nice et du guide « nouvelle ville ». Santé : 93 URLs
  en 200, aucune erreur ; Lighthouse mobile / 99-100-100, Bordeaux 100-100-100. Positions non relevées (`treg` absent).
- 22 novembre 2026 : page ville `/se-faire-des-amis/reims/` (prochaine grande ville absente par population ; requêtes
  « se faire des amis / rencontrer des gens à Reims ») : ville d'étudiants (université, Sciences Po, NEOMA) et de navetteurs
  vers Paris, place Drouet-d'Erlon, halles du Boulingrin, Clairmarais, Saint-Remi, Croix-Rouge et Chemin Vert, coulée
  verte du canal, Flâneries musicales, Stade de Reims ; sans zone de quartier (renvoi à `/quartier/`). Citée dans le texte
  de Paris, Lille et Strasbourg. Santé : 94 URLs en 200, aucune erreur ; Lighthouse mobile / 92-97 (un premier passage à
  79, cache froid, non reproduit), Toulouse 100-100-100. Positions non relevées (`treg` absent).
- 23 novembre 2026 : page ville `/se-faire-des-amis/saint-etienne/` (prochaine grande ville absente par population ;
  requêtes « se faire des amis / rencontrer des gens à Saint-Étienne ») : ville qui se réinvente (mine, Manufacture, design),
  place Jean-Jaurès, Jacquard et son marché, Crêt de Roc, Carnot-Manufacture-Châteaucreux (Cité du design, Le Fil),
  Fauriel et Bellevue, halles Mazerat, Geoffroy-Guichard, Fête du livre, Pilat, SaintéLyon, amicales de quartier ; sans
  zone de quartier (renvoi à `/quartier/`). Citée dans le texte de Lyon, Montpellier et du guide « nouvelle ville ».
  Santé : 95 URLs en 200, aucune erreur (seul « lien cassé » : `/cdn-cgi/l/email-protection`, réécriture d'adresse
  e-mail de Cloudflare dans la FAQ de l'accueil, normal) ; Lighthouse mobile / 95-100-100, Nantes 99-100-100. Positions
  non relevées (`treg` absent).
- 24 novembre 2026 : page ville `/se-faire-des-amis/le-havre/` (prochaine grande ville absente par population ; requêtes
  « se faire des amis / rencontrer des gens au Havre ») : centre Perret (Unesco), Saint-François, Saint-Vincent et la
  plage, ville haute (Sanvic, Bléville, Mont-Gaillard), Docks et Graville ; Halles centrales, Volcan et bibliothèque
  Niemeyer, MuMa, Tetris au fort de Tourneville, jardins suspendus, forêt de Montgeon, HAC, Transat Jacques Vabre, Un Été
  au Havre, campus (université, Sciences Po, ENSM, EM Normandie) ; sans zone de quartier (renvoi à `/quartier/`). Citée
  dans le texte de Paris, Rennes et du guide « nouvelle ville ». Santé : 96 URLs en 200, aucune erreur réelle ;
  Lighthouse mobile / 95-100-100, Lille 99-100-100. Positions non relevées (`treg` absent).
- 25 novembre 2026 : page ville `/se-faire-des-amis/villeurbanne/` (prochaine grande ville absente par population ;
  requêtes « se faire des amis / rencontrer des gens à Villeurbanne ») : ville à part entière à côté de Lyon, campus
  LyonTech-la Doua, Capitale française de la culture 2022, Gratte-Ciel, Charpennes-Tonkin, la Doua et Croix-Luizet,
  Grandclément et Cusset, Saint-Jean et les Buers ; TNP, Transbordeur, Le Zola et son Festival du film court, Rize,
  Les Invites, parc de la Feyssine, ASVEL à l'Astroballe ; sans zone de quartier (renvoi à `/quartier/`). Citée dans le
  texte de Lyon, Saint-Étienne et du guide « nouvelle ville ». Santé : 97 URLs en 200, aucune erreur réelle ; Lighthouse
  mobile / 95-100-100, Lyon 97-100-100. Positions non relevées (`treg` absent).
- 26 novembre 2026 : page ville `/se-faire-des-amis/dijon/` (prochaine grande ville absente par population ; requêtes
  « se faire des amis / rencontrer des gens à Dijon ») : Université Bourgogne Europe, Cité internationale de la
  gastronomie et du vin (mai 2022), centre historique et Halles, Montchapet, Port du Canal, Montmuzard, Fontaine-d'Ouche
  et Grésilles ; La Vapeur, Opéra, Théâtre Dijon-Bourgogne, lac Kir et Dijon Plage, voie verte du canal, combe à la
  Serpent, Foire internationale et gastronomique, JDA ; sans zone de quartier (renvoi à `/quartier/`). Citée dans le
  texte de Lyon, Strasbourg et du guide « nouvelle ville ». Ancres variées sur Genève, Reims, Bruxelles et l'article de
  blog (ancres exactes répétées). Santé : 98 URLs en 200, aucune erreur ; Lighthouse mobile / 91-100-100, Marseille
  97-100-100. **Premier relevé de positions** (treg via MCP, 8 requêtes, 0,048 $) : minimoa.app absent du top 30 sur
  les 8 requêtes (têtes « application / appli / site pour se faire des amis », « près de chez soi », Paris, Lyon,
  Toulouse, Bordeaux). Les résultats DataForSEO renvoient souvent `google.com/goto` dans `domain` : lire le fil d'Ariane.
  Prochaine ville : Angers.
- 27 novembre 2026 : page ville `/se-faire-des-amis/angers/` (prochaine grande ville absente par population ; requêtes
  « se faire des amis / rencontrer des gens à Angers ») : ville de campus (Université d'Angers, UCO), centre et Cité
  (château, Ralliement, rue Saint-Laud), Doutre et place de la Laiterie, Saint-Serge et l'Iceparc, Belle-Beille, lac de
  Maine et étang Saint-Nicolas, Monplaisir, Roseraie, Justices ; marché de la place Leclerc, Le Chabada, Le Quai, Premiers
  Plans, Accroche-Cœurs, La Loire à Vélo, SCO, Ducs d'Angers ; sans zone de quartier (renvoi à `/quartier/`). Citée dans
  le texte de Nantes, Rennes et du guide « nouvelle ville ». Santé : 99 URLs en 200, aucune erreur ; Lighthouse mobile
  / 94-100-100, Rennes 100-100-100. Positions (treg, 8 requêtes, 0,048 $) : **premières entrées dans le top 30** —
  « se faire des amis à marseille » 21e, « rencontrer des gens à lille » 28e ; absent ailleurs (4 têtes, Nantes,
  Rennes). Prochaine ville : Nîmes.

## 6. Blog d'actualité et GEO

Blog : `/blog/` (liste), `/blog/<article>/`, flux `/blog/rss.xml`. Un article part d'une actualité (étude, fête,
saison, événement d'une ville) et la relie à la façon de rencontrer du monde, puis à Minimoa (une aide parmi d'autres).
Ajouter un article : un fichier dans `apps/web/src/content/editorial/blog/` (type `BlogPost`), une ligne dans `POSTS` de
`blog.ts`, son aperçu (`editorial-og.mts` puis `build.py --og-pages`). `pnpm test` contrôle : 700-1 400 mots,
« L'essentiel » de 3 à 5 phrases, sources (chaque lien externe du texte en fait partie), au moins 3 liens internes dont
un guide, Minimoa cité. Pas d'actualité inventée : chaque date et chaque chiffre vient d'une source officielle vérifiée.

GEO (assistants et moteurs génératifs) :

- `/llms.txt`, généré au build : présentation factuelle de Minimoa et liste des guides, villes et articles.
- « L'essentiel » en tête de chaque article : phrases autonomes, datées et sourcées, faciles à citer.
- JSON-LD `BlogPosting` (`abstract`, `citation`, `keywords`), `Blog` sur la liste, FAQPage, fil d'Ariane.
- `robots.txt` laisse passer tous les robots (dont ceux des assistants) ; sources citées en clair en fin d'article.

- 19 novembre 2026 : premier article, `/blog/fetes-fin-annee-2026-rencontrer-du-monde/` (Fête des Lumières à Lyon du
  5 au 8 décembre 2026, marchés de Noël, étude Solitudes 2026 de la Fondation de France).
