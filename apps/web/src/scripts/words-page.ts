/** Page « 3 mots » : charge la personne, laisse choisir exactement 3 mots, envoie, remercie. */
import type { WordsPage } from '@blowy/contract';
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
const errorText = document.querySelector<HTMLElement>('[data-state="error"] .pub-text');

const selected = () => chips.filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.word ?? '');

function refresh(): void {
  const n = selected().length;
  if (count) {
    count.textContent = fill(c.counter, { n });
    count.classList.toggle('ok', n === MAX);
  }
  form?.classList.toggle('full', n >= MAX);
  if (submit) submit.disabled = n !== MAX || pendingSend;
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
  return { name: p.displayName, pet: p.pet.name };
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
  const img = document.querySelector<HTMLImageElement>('[data-pet]');
  if (img) setPetImage(img, page.pet.species, page.pet.mood, fill(c.petAlt, v));
  const done = document.querySelector<HTMLImageElement>('[data-pet-done]');
  if (done) setPetImage(done, page.pet.species, 'amour', fill(c.petAlt, v));
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
    showState('done');
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
    if (submit) submit.textContent = c.submit;
    refresh();
  }
});

onRetry(() => void load());
void load();
