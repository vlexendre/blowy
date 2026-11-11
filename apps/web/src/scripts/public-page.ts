/** Outils communs des pages publiques : changement d'état, remplissage des gabarits {name}/{pet}. */
import { fill } from '../content/public';

/** Affiche un seul état `[data-state]` et place le focus sur son titre (lecteurs d'écran). */
export function showState(state: string, focus = true): void {
  document.querySelectorAll<HTMLElement>('[data-state]').forEach((el) => {
    el.hidden = el.dataset.state !== state;
  });
  if (!focus) return;
  const title = document.querySelector<HTMLElement>(`[data-state="${state}"] .pub-title`);
  title?.focus({ preventScroll: true });
}

/** Remplit tous les éléments portant data-tpl (texte) ou data-tpl-aria (aria-label). */
export function fillTemplates(vars: Record<string, string>): void {
  document.querySelectorAll<HTMLElement>('[data-tpl]').forEach((el) => {
    const tpl = el.dataset.tpl;
    if (tpl && !el.hasAttribute('data-count')) el.textContent = fill(tpl, vars);
  });
  document.querySelectorAll<HTMLElement>('[data-tpl-aria]').forEach((el) => {
    const tpl = el.dataset.tplAria;
    if (tpl) el.setAttribute('aria-label', fill(tpl, vars));
  });
}

/** Branche les boutons « réessayer ». */
export function onRetry(run: () => void): void {
  document.querySelectorAll<HTMLButtonElement>('[data-retry]').forEach((b) => b.addEventListener('click', run));
}

