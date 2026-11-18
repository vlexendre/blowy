/**
 * `?ref=<code>` sur n'importe quelle page du site (code d'un créateur, docs/VIRALITE.md) : gardé le temps de la visite
 * (sessionStorage, rien n'est envoyé), ajouté aux boutons qui ouvrent l'app (`minimoa://…?ref=CODE`) et montré dans la
 * boîte « Ton code » quand la page en a une. Aucune empreinte, aucun cookie.
 */
import { DEEP_LINK_SCHEME } from '../config/site';

const KEY = 'minimoa.ref';
const CODE = /^[A-Za-z0-9_-]{3,32}$/;

export function currentRef(): string | null {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('ref');
    if (fromUrl && CODE.test(fromUrl)) {
      sessionStorage.setItem(KEY, fromUrl.toUpperCase());
      return fromUrl.toUpperCase();
    }
    const kept = sessionStorage.getItem(KEY);
    return kept && CODE.test(kept) ? kept : null;
  } catch {
    return null;
  }
}

/** Lien de l'app avec le code du créateur, s'il y en a un. */
export function withRef(href: string): string {
  const ref = currentRef();
  if (!ref || !href.startsWith(DEEP_LINK_SCHEME)) return href;
  return `${href}${href.includes('?') ? '&' : '?'}ref=${encodeURIComponent(ref)}`;
}

/** « Copier » d'une boîte de code. */
export function bindCopy(box: string, code: string, t: { copy: string; copied: string }): void {
  const btn = document.querySelector<HTMLButtonElement>(`[data-code-box="${box}"] [data-copy]`);
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(code);
      btn.textContent = t.copied;
      window.setTimeout(() => (btn.textContent = t.copy), 2000);
    } catch {
      const out = document.querySelector<HTMLElement>(`[data-code-box="${box}"] [data-code]`);
      if (out) window.getSelection()?.selectAllChildren(out);
    }
  });
}

/** Sur chaque page : les boutons `minimoa://` emportent le code ; la boîte « ref » le montre. */
export function applyRef(): void {
  // Site de test : les boutons écrits `minimoa://` dans les pages ouvrent l'app « Minimoa Dev » (config/site.ts).
  if (DEEP_LINK_SCHEME !== 'minimoa://') {
    document.querySelectorAll<HTMLAnchorElement>('a[href^="minimoa://"]').forEach((a) => {
      a.href = `${DEEP_LINK_SCHEME}${(a.getAttribute('href') ?? '').slice('minimoa://'.length)}`;
    });
  }
  const ref = currentRef();
  if (!ref) return;
  document.querySelectorAll<HTMLAnchorElement>(`a[href^="${DEEP_LINK_SCHEME}"]`).forEach((a) => {
    if (!/[?&]ref=/.test(a.href)) a.href = withRef(a.getAttribute('href') ?? a.href);
  });
  const box = document.querySelector<HTMLElement>('[data-code-box="ref"]');
  const out = box?.querySelector<HTMLElement>('[data-code]');
  if (box && out) {
    out.textContent = ref;
    box.hidden = false;
  }
}
