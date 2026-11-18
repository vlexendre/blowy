/** Bannière « Available in English » (organisms/LangBanner.astro) : proposée, jamais imposée. */
import { browserLocale, type Locale } from '../i18n/site';

const KEY = 'minimoa.langBanner';
const box = document.querySelector<HTMLElement>('[data-lang-banner]');

function run(): void {
  if (!box) return;
  const page = (document.documentElement.lang || 'fr').slice(0, 2).toLowerCase();
  const want = browserLocale(navigator.languages?.length ? navigator.languages : [navigator.language]);
  if (!want || want === page) return;
  try {
    if (localStorage.getItem(KEY) === want) return;
  } catch {
    // stockage indisponible : la bannière se montre
  }
  const alt = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${want}"]`);
  if (!alt) return;
  const texts = JSON.parse(box.querySelector('[data-lb-texts]')?.textContent ?? '{}') as Record<Locale, { text: string; go: string; close: string; lang: string }>;
  const t = texts[want];
  if (!t) return;
  const link = box.querySelector<HTMLAnchorElement>('[data-lb-link]');
  const close = box.querySelector<HTMLButtonElement>('[data-lb-close]');
  if (!link || !close) return;
  link.href = new URL(alt.href).pathname + window.location.hash;
  link.hreflang = t.lang;
  box.lang = t.lang;
  const text = box.querySelector('[data-lb-text]');
  const go = box.querySelector('[data-lb-go]');
  if (text) text.textContent = t.text;
  if (go) go.textContent = t.go;
  close.setAttribute('aria-label', t.close);
  close.addEventListener('click', () => {
    box.hidden = true;
    try {
      localStorage.setItem(KEY, want);
    } catch {
      // rien à garder
    }
  });
  box.hidden = false;
}

run();
