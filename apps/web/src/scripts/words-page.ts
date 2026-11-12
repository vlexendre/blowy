/** Page « 3 mots » : charge la personne, laisse choisir exactement 3 mots, montre leur effet, envoie, fait répondre le pet. */
import type { WordsPage } from '@blowy/contract';
import { deltaForWords, GAUGE_KEYS, type GaugeKey, type Mood } from '@blowy/domain';
import { wordLabel } from '@blowy/content';
import { api, failureOf } from '../lib/api';
import { readCode } from '../lib/code';
import { setPetImage } from '../lib/pet';
import { common, fill, wordsPage as c } from '../content/public';
import { fillTemplates, onRetry, showState } from './public-page';

const MAX = 3;
const code = readCode('m');
let page: WordsPage | null = null;
let pendingSend = false;

const form = document.querySelector<HTMLFormElement>('[data-form]');
const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-word]'));
const submit = document.querySelector<HTMLButtonElement>('[data-submit]');
const count = document.querySelector<HTMLElement>('[data-count]');
const formError = document.querySelector<HTMLElement>('[data-form-error]');
const sent = document.querySelector<HTMLElement>('[data-sent]');
const petImg = document.querySelector<HTMLImageElement>('[data-pet]');
const errorText = document.querySelector<HTMLElement>('[data-state="error"] .pub-text');

const selected = () => chips.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.word ?? '');

/** Humeur du pet du panneau selon le nombre de mots choisis (maquette : neutre → joie → amour). */
const moodFor = (n: number): Mood => (n === 0 ? 'neutre' : n === MAX ? 'amour' : 'joie');

/** Jauges : on part du centre (le caractère du pet n'est pas public) et on montre l'effet des mots choisis. */
function drawGauges(words: readonly string[]): void {
  const delta = deltaForWords(words);
  GAUGE_KEYS.forEach((k: GaugeKey) => {
    const el = document.querySelector<HTMLElement>(`[data-gauge="${k}"]`);
    if (!el) return;
    const d = delta[k] ?? 0;
    const x = 50 + Math.max(-100, Math.min(100, d)) / 2;
    const fillBar = el.querySelector<HTMLElement>('.mots-gauge b');
    const knob = el.querySelector<HTMLElement>('.mots-gauge u');
    if (fillBar) {
      fillBar.style.left = `${Math.min(50, x)}%`;
      fillBar.style.right = `${100 - Math.max(50, x)}%`;
    }
    if (knob) knob.style.left = `${x}%`;
    const label = el.querySelector<HTMLElement>('[data-delta]');
    if (label) {
      label.textContent = d === 0 ? '' : d > 0 ? `+${d}` : `−${-d}`;
      label.classList.toggle('down', d < 0);
    }
  });
}

function refresh(): void {
  const words = selected();
  const n = words.length;
  if (count) count.textContent = fill(c.counter, { n });
  form?.classList.toggle('full', n >= MAX);
  if (submit) {
    submit.disabled = n !== MAX || pendingSend;
    submit.classList.toggle('ready', n === MAX);
    if (!pendingSend) {
      const left = MAX - n;
      submit.textContent = n === 0 ? c.submitEmpty : left === 0 ? c.submit : fill(left > 1 ? c.submitMorePlural : c.submitMore, { n: left });
    }
  }
  drawGauges(words);
  if (page && petImg) setPetImage(petImg, page.pet.species, moodFor(n), fill(c.petAlt, vars(page)));
}

chips.forEach((b) => {
  b.addEventListener('click', () => {
    const on = b.getAttribute('aria-pressed') === 'true';
    if (!on && selected().length >= MAX) {
      if (formError) {
        formError.textContent = c.maxReached;
        formError.hidden = false;
      }
      return;
    }
    if (formError) formError.hidden = true;
    b.setAttribute('aria-pressed', on ? 'false' : 'true');
    refresh();
  });
});

function vars(p: WordsPage): Record<string, string> {
  return { name: p.displayName, nom: p.displayName.toLowerCase(), pet: p.pet.name, petNom: p.pet.name.toLowerCase() };
}

function showFailure(kind: ReturnType<typeof failureOf>): void {
  if (kind === 'not_found') return showState('not_found');
  if (kind === 'already_done') {
    const t = document.querySelector<HTMLElement>('[data-state="already_done"] .pub-text');
    if (t && page) t.textContent = fill(c.alreadyText, vars(page));
    if (page) {
      const img = document.querySelector<HTMLImageElement>('[data-pet-already]');
      if (img) setPetImage(img, page.pet.species, 'smug', fill(c.petAlt, vars(page)));
    }
    return showState('already_done');
  }
  if (errorText) errorText.textContent = kind === 'network' ? common.networkText : kind === 'rate_limited' ? common.busyText : common.genericText;
  showState('error');
}

/** Après l'envoi : le formulaire laisse place à la réponse du pet et à l'invitation à créer le sien. */
function showSent(words: readonly string[]): void {
  const list = document.querySelector<HTMLElement>('[data-list]');
  if (list) list.textContent = words.map((w) => wordLabel[w] ?? w).join(', ');
  if (form) form.hidden = true;
  if (sent) sent.hidden = false;
}

async function load(): Promise<void> {
  if (!code) return showState('not_found', false);
  showState('loading', false);
  try {
    page = await api.words.get(code);
  } catch (e) {
    return showFailure(failureOf(e));
  }
  const v = vars(page);
  fillTemplates(v);
  const face = `/img/${page.pet.species}_face.webp`;
  document.querySelectorAll<HTMLImageElement>('[data-pet-face]').forEach((img) => {
    img.src = face;
  });
  refresh();
  showState('form');
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const words = selected();
  if (!code || words.length !== MAX || pendingSend) {
    if (formError) {
      formError.textContent = c.needThree;
      formError.hidden = false;
    }
    return;
  }
  pendingSend = true;
  if (submit) submit.textContent = c.sending;
  refresh();
  try {
    await api.words.send(code, words);
    showSent(words);
  } catch (err) {
    const kind = failureOf(err);
    if (kind === 'invalid' && formError) {
      formError.textContent = c.needThree;
      formError.hidden = false;
    } else if (kind === 'network' || kind === 'rate_limited' || kind === 'other') {
      // on reste sur le formulaire pour ne pas perdre la sélection
      if (formError) {
        formError.textContent = kind === 'network' ? common.networkText : kind === 'rate_limited' ? common.busyText : common.genericText;
        formError.hidden = false;
      }
    } else showFailure(kind);
  } finally {
    pendingSend = false;
    refresh();
  }
});

onRetry(() => void load());
void load();
