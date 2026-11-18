/**
 * Présenter une feuille de partage sans jamais rester bloqué ni échouer en silence.
 *
 * Sur iOS, la promesse d'une feuille de partage (`Share.share`, `react-native-share`) ne se règle qu'à sa fermeture,
 * et jamais si iOS a refusé de la présenter (une autre fenêtre se ferme encore, cf. `SheetTemplate.onClosed`). On
 * attend donc que l'interface soit posée avant de la présenter, puis on considère la feuille ouverte au bout de
 * `SHOWN_AFTER_MS` sans erreur : le bouton sort de son chargement et peut être touché de nouveau.
 */

/** Sans erreur au bout de ce délai, la feuille est à l'écran (elle reste ouverte tant que la personne choisit). */
export const SHOWN_AFTER_MS = 1200;

/** Deux images plus tard : la fenêtre qui se fermait est retirée, le bouton touché a fini son animation. */
export function settleUi(): Promise<void> {
  return new Promise((resolve) => {
    const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (cb: () => void) => setTimeout(cb, 16);
    raf(() => raf(() => resolve()));
  });
}

/**
 * Ouvre une feuille : `true` si elle s'est ouverte (fermée normalement, ou toujours à l'écran après `SHOWN_AFTER_MS`),
 * `false` si elle a échoué (exception, rejet). Une erreur arrivée plus tard appelle `onLateFailure`.
 */
export async function presentShare(open: () => Promise<unknown>, onLateFailure?: () => void, shownAfterMs = SHOWN_AFTER_MS): Promise<boolean> {
  await settleUi();
  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(true), shownAfterMs);
    let pending: Promise<unknown>;
    try {
      pending = Promise.resolve(open());
    } catch {
      finish(false);
      return;
    }
    pending.then(
      () => finish(true),
      () => {
        if (settled) onLateFailure?.();
        else finish(false);
      },
    );
  });
}
