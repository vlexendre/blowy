/**
 * Pages villes : compteur réel du quartier (« 12 / 50 pour ouvrir Bordeaux »), lu à l'API publique quand l'encadré
 * « Ouvre ton quartier » approche de l'écran. Le client de l'API n'est chargé qu'à ce moment-là. Sans réseau, rien ne
 * s'affiche : le bouton vers /quartier/<zone> suffit.
 */
import { fill } from '../i18n/site';

async function show(box: HTMLElement, zone: string): Promise<void> {
  const counter = box.querySelector<HTMLElement>('[data-ed-counter]');
  const bar = box.querySelector<HTMLElement>('[data-ed-bar]');
  const text = box.querySelector<HTMLElement>('[data-ed-count]');
  if (!counter || !bar || !text) return;
  try {
    const { api } = await import('../lib/api');
    const s = await api.quartiers.status(zone);
    text.textContent = s.open
      ? fill(box.dataset.open ?? '', { zone: s.label })
      : fill(box.dataset.counter ?? '', { count: s.count, threshold: s.threshold, zone: s.label });
    counter.hidden = false;
    requestAnimationFrame(() => {
      bar.style.width = `${s.open ? 100 : Math.min(100, Math.round((s.count / Math.max(1, s.threshold)) * 100))}%`;
    });
  } catch {
    // Le compteur est un plus.
  }
}

for (const box of document.querySelectorAll<HTMLElement>('[data-ed-quartier]')) {
  const zone = box.dataset.edQuartier;
  if (!zone) continue;
  if (!('IntersectionObserver' in window)) {
    void show(box, zone);
    continue;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        void show(box, zone);
      }
    },
    { rootMargin: '400px 0px' },
  );
  io.observe(box);
}
