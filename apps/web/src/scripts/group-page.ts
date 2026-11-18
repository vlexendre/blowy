/**
 * Page /g/… : un identifiant de groupe → « Ouvre Minimoa » (scripts/open-page.ts) ; un code court → la page publique du
 * lien d'invitation (nom, habitude, jours tenus, nombre de membres, espèces des minimoas ; jamais de prénom), le
 * bouton « Rejoindre dans l'app » (minimoa://g/CODE) et le code à taper à l'inscription. Langue du navigateur.
 */
import type { GroupPreview } from '@blowy/contract';
import { api, failureOf } from '../lib/api';
import { readCode } from '../lib/code';
import { DEEP_LINK_SCHEME } from '../config/site';
import { common, fill } from '../content/public';
import { growthCopy, pickGrowthLocale } from '../content/growth';
import { bindCopy, withRef } from './ref';
import { onRetry, showState } from './public-page';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const locale = pickGrowthLocale(navigator.languages ?? [navigator.language]);
const t = growthCopy[locale].group;
const code = readCode('g');
const errorText = document.querySelector<HTMLElement>('[data-state="error"] .pub-text');

const set = (sel: string, text: string) => {
  const el = document.querySelector<HTMLElement>(sel);
  if (el) el.textContent = text;
};
const count = (forms: { one: string; other: string }, n: number) => fill(n === 1 ? forms.one : forms.other, { n });

function translateStatic(): void {
  if (locale === 'fr') return;
  document.documentElement.lang = locale;
  document.title = t.meta;
  document.querySelectorAll<HTMLElement>('[data-g]').forEach((el) => {
    const key = el.dataset.g as keyof typeof t;
    const v = t[key];
    if (typeof v === 'string') el.textContent = v;
  });
  const nf = document.querySelector<HTMLElement>('[data-state="not_found"]');
  if (nf) {
    const title = nf.querySelector<HTMLElement>('.pub-title');
    if (title) title.replaceChildren(...t.notFoundTitle.map((l) => Object.assign(document.createElement('span'), { className: 'ln', textContent: l })));
    const text = nf.querySelector<HTMLElement>('.pub-text');
    if (text) text.textContent = t.notFoundText;
  }
  const box = document.querySelector<HTMLElement>('[data-code-box="group"]');
  box?.querySelectorAll<HTMLElement>('[data-t]').forEach((el) => {
    const k = el.dataset.t;
    el.textContent = k === 'codeLabel' ? t.codeLabel : k === 'codeHelp' ? t.codeHelp : k === 'copy' ? growthCopy[locale].copy : el.textContent;
  });
}

function render(g: GroupPreview, c: string): void {
  set('[data-group-name]', g.name);
  set('[data-group-habit]', g.habitLabel ? fill(t.habit, { habit: g.habitLabel }) : t.free);
  set('[data-group-members]', count(t.members, g.memberCount));
  set('[data-group-days]', g.kind === 'habit' ? (g.daysKept === 0 ? t.daysKept.zero : count(t.daysKept, g.daysKept)) : '');
  const missing = document.querySelector<HTMLElement>('[data-group-missing]');
  if (missing) {
    missing.textContent = g.full ? t.full : g.missing > 0 ? count(t.missing, g.missing) : '';
    missing.hidden = !g.full && g.missing === 0;
  }
  const pets = document.querySelector<HTMLElement>('[data-group-pets]');
  pets?.replaceChildren(
    ...g.species.slice(0, 8).map((s) => Object.assign(document.createElement('img'), { src: `/img/${s}_face.webp`, alt: '', width: 64, height: 64 })),
  );
  const join = document.querySelector<HTMLAnchorElement>('[data-join]');
  if (join) {
    join.href = withRef(`${DEEP_LINK_SCHEME}g/${encodeURIComponent(c)}`);
    join.toggleAttribute('aria-disabled', g.full);
  }
  const out = document.querySelector<HTMLElement>('[data-code-box="group"] [data-code]');
  if (out) out.textContent = c;
  bindCopy('group', c, growthCopy[locale]);
  showState('ready');
}

async function load(): Promise<void> {
  const raw = window.location.pathname.split('/').filter(Boolean)[1] ?? '';
  // Un groupe de l'app (identifiant) : « Ouvre Minimoa », comme les autres liens de l'app.
  if (UUID.test(raw)) {
    showState('open', false);
    await import('./open-page');
    return;
  }
  translateStatic();
  if (!code) return showState('not_found', false);
  showState('loading', false);
  try {
    render(await api.groups.preview(code), code.toUpperCase());
  } catch (e) {
    const kind = failureOf(e);
    if (kind === 'not_found' || kind === 'invalid') return showState('not_found');
    if (errorText) errorText.textContent = kind === 'network' ? common.networkText : kind === 'rate_limited' ? common.busyText : common.genericText;
    showState('error');
  }
}

onRetry(() => void load());
void load();
