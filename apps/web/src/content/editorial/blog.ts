/**
 * Le blog : un article par actualité (docs/SEO.md §6). Pour publier : un fichier dans ./blog/, puis une ligne dans
 * `POSTS` ci-dessous. La liste est triée du plus récent au plus ancien.
 */
import type { BlogPost } from './types';
import { fetesFinAnnee2026 } from './blog/fetes-fin-annee-2026';

const POSTS: readonly BlogPost[] = [fetesFinAnnee2026];

export const BLOG_LIST: readonly BlogPost[] = [...POSTS].sort((a, b) => (a.published < b.published ? 1 : a.published > b.published ? -1 : 0));
export const BLOG: Record<string, BlogPost> = Object.fromEntries(BLOG_LIST.map((p) => [p.slug, p]));
export const blogPath = (slug: string): string => `/blog/${slug}/`;
