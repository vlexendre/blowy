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
