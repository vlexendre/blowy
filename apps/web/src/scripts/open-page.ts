/** Page « Ouvre Minimoa » : le bouton ouvre l'app sur le même chemin (minimoa://…). Les textes sont déjà dans la langue de la page. */
import { DEEP_LINK_SCHEME } from '../config/site';

const openLink = document.querySelector<HTMLAnchorElement>('[data-state="open"] [data-open]');
const appPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
if (openLink && /^[\w\-/]{1,120}$/.test(appPath)) openLink.href = `${DEEP_LINK_SCHEME}${appPath}`;
