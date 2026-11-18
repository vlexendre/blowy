/**
 * « Quel minimoa es-tu ? » : intro → 7 situations (une par écran, retour possible) → résultat calculé et gardé par
 * l'API sous un code court → carte story (canvas, Allo), « Partager en story », « Copier le lien », « Défie tes potes »
 * (`/quiz?ref=<code>`), le code à reprendre dans l'app, et « Ton quartier ouvre à 50 ».
 * Entonnoir compté par l'API (commencé, terminé, partagé) ; aucune donnée sur la personne, aucun cookie.
 */
import type { QuizResultDto } from '@blowy/contract';
import { QUIZ, type QuizAnswer, isQuizCode } from '@blowy/domain';
import { api, failureOf } from '../lib/api';
import { canvasToFile, drawStoryCard } from '../lib/story-card';
import { DEEP_LINK_SCHEME, SITE_URL } from '../config/site';
import { SPECIES_NAMES } from '../content/quiz';
import { growthCopy } from '../content/growth';
import { bindCopy, withRef } from './ref';
import { showState } from './public-page';
import { mountQuartierForm } from './quartier-form';
import { copyText, fill, flash, locale, qt, shareOrCopy, t } from './quiz-shared';
import { sharePathKeepingLocale } from '../i18n/client';
import { browserLocale, localeOfPath, localePath } from '../i18n/site';

const KEY = 'minimoa.quiz.mine';
const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector<T>(s);
const r = t.quiz.result;
const host = SITE_URL.replace(/^https?:\/\//, '');

function readQuizCode(): string | null {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const i = parts.indexOf('quiz');
  const seg = i >= 0 ? parts[i + 1] : undefined;
  const raw = new URLSearchParams(window.location.search).get('c') ?? (seg && seg !== 'index.html' ? seg : null);
  return raw && isQuizCode(raw) ? raw.toUpperCase() : null;
}
function readRef(): string | null {
  const raw = new URLSearchParams(window.location.search).get('ref');
  return raw && isQuizCode(raw) ? raw.toUpperCase() : null;
}
const mine = (): string | null => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};


// ── Le quiz ────────────────────────────────────────────────────────────────
let ref: string | null = readRef();
let answers: QuizAnswer[] = [];
let index = 0;
let started = false;

function renderQuestion(): void {
  const q = QUIZ[index];
  if (!q) return;
  const text = qt.questions[q.id];
  const step = $('[data-quiz-step]');
  if (step) step.textContent = fill(t.quiz.progress, { n: index + 1, total: QUIZ.length });
  const bar = $('[data-quiz-bar]');
  if (bar) bar.style.width = `${Math.round((index / QUIZ.length) * 100)}%`;
  const back = $('[data-quiz-back]');
  if (back) back.hidden = index === 0;
  const prompt = $('[data-quiz-prompt]');
  if (prompt) prompt.textContent = text?.prompt ?? '';
  const box = $('[data-quiz-choices]');
  box?.setAttribute('aria-label', text?.prompt ?? '');
  const chosen = answers.find((a) => a.questionId === q.id)?.choice;
  box?.replaceChildren(
    ...q.choices.map((c, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-choice';
      b.setAttribute('aria-pressed', String(chosen === c.id));
      b.append(Object.assign(document.createElement('b'), { textContent: 'ABC'[i] ?? '' }), document.createTextNode(text?.[c.id] ?? ''));
      b.addEventListener('click', () => choose(c.id));
      return b;
    }),
  );
  showState('question', false);
  prompt?.focus({ preventScroll: true });
}

function start(): void {
  answers = [];
  index = 0;
  if (!started) {
    started = true;
    void api.quiz.start(ref ?? undefined).catch(() => undefined);
  }
  renderQuestion();
  window.scrollTo({ top: 0 });
}

function choose(choice: QuizAnswer['choice']): void {
  const q = QUIZ[index];
  if (!q) return;
  answers = [...answers.filter((a) => a.questionId !== q.id), { questionId: q.id, choice }];
  if (index < QUIZ.length - 1) {
    index += 1;
    renderQuestion();
  } else void finish();
}

async function finish(): Promise<void> {
  showState('computing', false);
  try {
    const result = await api.quiz.submit({ answers, ...(ref ? { ref } : {}), locale });
    try {
      sessionStorage.setItem(KEY, result.code);
    } catch {
      // Navigation privée : le résultat reste à l'écran.
    }
    history.replaceState(null, '', sharePathKeepingLocale(`/quiz/${result.code}`));
    await showResult(result);
  } catch (e) {
    const err = $('[data-quiz-error]');
    if (err) err.textContent = failureOf(e) === 'rate_limited' ? t.quartier.errors.busy : t.quiz.error;
    showState('error');
  }
}

// ── Le résultat ────────────────────────────────────────────────────────────
const petSrc = (res: QuizResultDto) => `/img/m/quiz_${res.trait}.webp`;
let card: HTMLCanvasElement | null = null;

async function showResult(res: QuizResultDto): Promise<void> {
  const trait = qt.traits[res.trait];
  const name = SPECIES_NAMES[res.species];
  const headline = $('[data-quiz-headline]');
  if (headline) headline.textContent = trait.headline;
  const sp = $('[data-quiz-species]');
  if (sp) sp.textContent = fill(r.species, { name });
  const sentence = $('[data-quiz-sentence]');
  if (sentence) sentence.textContent = trait.sentence;
  const second = $('[data-quiz-second]');
  if (second) second.textContent = res.second ? qt.second(qt.traits[res.second].word) : '';
  const out = $('[data-code-box="quiz"] [data-code]');
  if (out) out.textContent = res.code;
  bindCopy('quiz', res.code, growthCopy[locale]);
  const open = $<HTMLAnchorElement>('[data-quiz-open]');
  if (open) open.href = withRef(`${DEEP_LINK_SCHEME}quiz/${res.code}`);

  const resultUrl = `${SITE_URL}/quiz/${res.code}`;
  const challengeUrl = `${SITE_URL}/quiz?ref=${res.code}`;
  const note = $('[data-quiz-note]');
  const say = (text: string) => {
    if (!note) return;
    note.hidden = false;
    note.textContent = text;
  };
  showState('result');
  window.scrollTo({ top: 0 });

  // Carte story : dessinée une fois, montrée en aperçu, partagée en fichier.
  const img = $<HTMLImageElement>('[data-quiz-card]');
  try {
    card = await drawStoryCard({
      species: res.species,
      kicker: r.cardKicker,
      title: trait.headline,
      subtitle: fill(r.species, { name }),
      sentence: trait.sentence,
      petSrc: petSrc(res),
      callout: r.cardCallout,
      url: `${host}/quiz/${res.code}`,
    });
    if (img) {
      img.src = card.toDataURL('image/png');
      img.alt = fill(r.cardAlt, { name, word: trait.word });
    }
  } catch {
    if (img) img.src = petSrc(res);
  }

  const story = $<HTMLButtonElement>('[data-quiz-story]');
  if (story)
    story.onclick = async () => {
      if (!card) return;
      void api.quiz.share('story').catch(() => undefined);
      const file = await canvasToFile(card, `minimoa-${res.code}.png`);
      const data = { files: [file], text: fill(r.shareText, { word: trait.word }) };
      try {
        if (navigator.canShare?.(data)) {
          await navigator.share(data);
          return;
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: file.name });
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      say(r.saved);
    };
  const copy = $<HTMLButtonElement>('[data-quiz-copy]');
  if (copy)
    copy.onclick = async () => {
      void api.quiz.share('link').catch(() => undefined);
      if (await copyText(resultUrl)) flash(copy, r.copied);
    };
  const challenge = $<HTMLButtonElement>('[data-quiz-challenge]');
  if (challenge)
    challenge.onclick = async () => {
      void api.quiz.share('challenge').catch(() => undefined);
      const done = await shareOrCopy({ text: fill(r.challengeText, { word: trait.word }), url: challengeUrl });
      if (done === 'copied') flash(challenge, r.copied);
    };
}

/** Le résultat de quelqu'un d'autre : son minimoa, puis « Et toi ? » (le quiz, compté comme un défi). */
function showShared(res: QuizResultDto): void {
  const pet = $<HTMLImageElement>('[data-quiz-shared-pet]');
  if (pet) {
    pet.src = petSrc(res);
    pet.alt = `${SPECIES_NAMES[res.species]}, ${qt.traits[res.trait].word}`;
  }
  const sp = $('[data-quiz-shared-species]');
  if (sp) sp.textContent = `${SPECIES_NAMES[res.species]} · ${qt.traits[res.trait].word}`;
  ref = res.code;
  showState('shared');
}

/**
 * Un défi (`/quiz?ref=CODE`) arrive sur la page française indexée : il est envoyé à quelqu'un dont on ne connaît pas
 * la langue, donc on l'ouvre dans celle de son téléphone. Jamais sans `?ref=` (pas de redirection selon la langue).
 */
function followChallengeLanguage(): boolean {
  const params = new URLSearchParams(window.location.search);
  if (!readRef() || params.has('lang') || localeOfPath(window.location.pathname) !== 'fr' || locale !== 'fr') return false;
  const phone = browserLocale(navigator.languages?.length ? navigator.languages : [navigator.language]) ?? 'en';
  if (phone === 'fr') return false;
  window.location.replace(`${localePath(phone, '/quiz/')}${window.location.search}`);
  return true;
}

async function load(): Promise<void> {
  if (followChallengeLanguage()) return;
  document.querySelectorAll<HTMLButtonElement>('[data-quiz-start]').forEach((b) => b.addEventListener('click', start));
  $('[data-quiz-back]')?.addEventListener('click', () => {
    if (index > 0) {
      index -= 1;
      renderQuestion();
    }
  });
  const form = $('[data-quartier-form]');
  if (form) mountQuartierForm(form);

  const code = readQuizCode();
  if (!code) return showState('intro', false);
  showState('computing', false);
  try {
    const res = await api.quiz.result(code);
    if (mine() === res.code) await showResult(res);
    else showShared(res);
  } catch (e) {
    const err = $('[data-quiz-error]');
    if (err) err.textContent = failureOf(e) === 'not_found' || failureOf(e) === 'invalid' ? t.quiz.notFound : t.quiz.error;
    showState('error');
  }
}

void load();
