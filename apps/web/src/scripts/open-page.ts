/** Page « Ouvre Minimoa » : langue du navigateur, et le bouton ouvre l'app sur le même chemin (minimoa://…). */
import { openCopy, pickOpenLocale, type OpenKind } from '../content/open';

const root = document.querySelector<HTMLElement>('[data-open-kind]');
const kind = root?.dataset.openKind as OpenKind | undefined;

const open = document.querySelector<HTMLAnchorElement>('[data-open]');
const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
if (open && /^[\w\-/]{1,120}$/.test(path)) open.href = `minimoa://${path}`;

const locale = pickOpenLocale(navigator.languages ?? [navigator.language]);
if (root && kind && locale !== 'fr') {
  const t = openCopy[locale];
  const c = t.kinds[kind];
  document.documentElement.lang = locale;
  document.title = c.meta;
  const set = (key: string, text: string) => {
    const el = document.querySelector<HTMLElement>(`[data-t="${key}"]`);
    if (el) el.textContent = text;
  };
  const title = document.querySelector<HTMLElement>('[data-t="title"]');
  if (title) {
    title.replaceChildren(
      ...c.title.map((line, i) => {
        const span = document.createElement('span');
        span.className = i > 0 && c.title.length > 2 && i === c.title.length - 1 ? 'ln dim' : 'ln';
        span.textContent = line;
        return span;
      }),
    );
  }
  set('text', c.text);
  set('open', t.open);
  set('home', t.home);
  set('downloadTitle', t.downloadTitle);
  set('downloadText', t.downloadText);
}
