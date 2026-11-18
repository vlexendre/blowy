/**
 * Page /c/<code> : ce que l'API dit du code (visite comptée, sans IP). Code d'un créateur actif : « De la part de … » ;
 * sinon une simple bienvenue. Dans les deux cas : stores, « J'ai déjà Minimoa » (minimoa://c/CODE) et le code à taper.
 */
import { api } from '../lib/api';
import { readCode } from '../lib/code';
import { DEEP_LINK_SCHEME } from '../config/site';
import { fill } from '../content/public';
import { growthCopy, pickGrowthLocale } from '../content/growth';
import { bindCopy } from './ref';
import { showState } from './public-page';

const locale = pickGrowthLocale(navigator.languages ?? [navigator.language]);
const g = growthCopy[locale];
const t = g.creator;
const code = readCode('c')?.toUpperCase() ?? null;

function title(lines: readonly string[], name: string): void {
  const h = document.querySelector<HTMLElement>('[data-creator-title]');
  h?.replaceChildren(
    ...lines.map((l, i) => Object.assign(document.createElement('span'), { className: i > 0 ? 'ln dim' : 'ln', textContent: fill(l, { name: name.toUpperCase() }) })),
  );
}

async function load(): Promise<void> {
  if (locale !== 'fr') {
    document.documentElement.lang = locale;
    document.title = t.meta;
    document.querySelectorAll<HTMLElement>('[data-c]').forEach((el) => {
      const v = t[el.dataset.c as keyof typeof t];
      if (typeof v === 'string') el.textContent = v;
    });
    document.querySelectorAll<HTMLElement>('[data-code-box="creator"] [data-t]').forEach((el) => {
      const k = el.dataset.t;
      el.textContent = k === 'codeLabel' ? t.codeLabel : k === 'codeHelp' ? t.codeHelp : k === 'copy' ? g.copy : el.textContent;
    });
  }
  showState('loading', false);
  let name: string | null = null;
  if (code) {
    try {
      const found = await api.growth.code(code, true);
      if (found.kind === 'creator') name = found.label;
    } catch {
      name = null;
    }
  }
  const text = document.querySelector<HTMLElement>('[data-creator-text]');
  if (name) {
    title(t.title, name);
    if (text) text.textContent = t.intro;
  } else {
    title(t.unknownTitle, '');
    if (text) text.textContent = t.unknownText;
  }
  const open = document.querySelector<HTMLAnchorElement>('[data-open]');
  if (open) open.href = code ? `${DEEP_LINK_SCHEME}c/${encodeURIComponent(code)}` : DEEP_LINK_SCHEME;
  const box = document.querySelector<HTMLElement>('[data-code-box="creator"]');
  const out = box?.querySelector<HTMLElement>('[data-code]');
  if (box && out && code && name) {
    out.textContent = code;
    bindCopy('creator', code, g);
  } else if (box) box.hidden = true;
  showState('ready');
}

void load();
