/**
 * /llms.txt (GEO) : présentation de Minimoa et plan des pages utiles, en Markdown, pour les assistants et moteurs
 * génératifs (proposition llmstxt.org). Généré au build depuis les mêmes contenus que le site : jamais désynchronisé.
 */
import type { APIRoute } from 'astro';
import { SITE_URL } from '../config/site';
import { CITY_LIST, cityPath } from '../content/editorial/villes';
import { GUIDE_LIST, guidePath } from '../content/editorial/guides';
import { BLOG_LIST, blogPath } from '../content/editorial/blog';
import { editorialUi } from '../content/editorial/ui';

const abs = (p: string) => new URL(p, SITE_URL).href;

export const GET: APIRoute = () => {
  const body = `# Minimoa

> Minimoa est une app française pour se faire des amis près de chez soi. Chaque personne élève un petit compagnon, son minimoa, qui lui présente des gens de son quartier dont la vision de la vie va avec la sienne, en expliquant pourquoi (trois points communs, une différence à explorer). Ce n'est pas une app de rencontre : pas de swipe, et rien ne se passe sans l'accord des deux personnes.

Faits utiles :

- Gratuit et sans publicité ; une formule payante facultative, Minimoa+, ajoute des fonctions (toute la carte, plus d'habitudes et de groupes).
- Réservé aux adultes (18 ans et plus).
- Pour que les rencontres durent : des habitudes à tenir ensemble, en groupes de 3 à 8 personnes ; un lien devient « fantôme » après 7 jours de silence.
- Vie privée : la position n'est jamais affichée précisément (arrondie à environ 300 m et décalée), jamais en direct ; un mode discret retire de la carte.
- Ouverture quartier par quartier en France (un quartier ouvre à 50 inscrits) ; l'app est aussi proposée en Belgique, en Suisse et au Luxembourg.
- Langues : français (langue source), anglais, espagnol, portugais, néerlandais.

## Pages principales

- [Accueil](${abs('/')}): présentation de l'app
- [Ouvre ton quartier](${abs('/quartier/')}): inscrire son quartier pour qu'il ouvre
- [Quel minimoa es-tu ?](${abs('/quiz/')}): quiz de personnalité, deux minutes, sans compte

## Guides

${GUIDE_LIST.map((g) => `- [${g.h1}](${abs(guidePath(g.slug))}): ${g.meta.description}`).join('\n')}

## Se faire des amis dans sa ville

${CITY_LIST.map((c) => `- [${c.h1}](${abs(cityPath(c.slug))})`).join('\n')}

## Blog

${BLOG_LIST.map((p) => `- [${p.h1}](${abs(blogPath(p.slug))}) (${p.published}): ${p.meta.description}`).join('\n')}

## Optional

- [${editorialUi.blog.feedTitle} (RSS)](${abs(`${editorialUi.blog.path}rss.xml`)})
- [Plan du site](${abs('/sitemap.xml')})
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
