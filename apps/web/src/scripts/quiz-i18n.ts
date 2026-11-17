/** Langue des pages quiz et quartier : français rendu au build, sinon celle du téléphone (`[data-q]` = chemin du texte). */
import { cityName, quizText } from '@blowy/content';
import { copyAt, pickQuizLocale, quizCopy, type QuizLang } from '../content/quiz';

export const locale = pickQuizLocale(navigator.languages ?? [navigator.language]);
export const t: QuizLang = quizCopy[locale];
export const qt = quizText.in(locale);

export function translatePage(): void {
  if (locale === 'fr') return;
  document.documentElement.lang = locale;
  document.querySelectorAll<HTMLElement>('[data-q]').forEach((el) => {
    const v = copyAt(t, el.dataset.q ?? '');
    if (v !== null) el.textContent = v;
  });
  document.querySelectorAll<HTMLInputElement>('[data-q-placeholder]').forEach((el) => {
    const v = copyAt(t, el.dataset.qPlaceholder ?? '');
    if (v !== null) el.placeholder = v;
  });
  document.querySelectorAll<HTMLOptionElement>('option[data-city]').forEach((o) => {
    o.textContent = cityName(o.dataset.city ?? '', locale);
  });
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/legal/"]').forEach((a) => {
    a.href = a.getAttribute('href')!.replace(/^\/legal\//, `/${locale}/legal/`);
  });
}

/** Remplace {clé} par sa valeur. */
export const fill = (s: string, vars: Record<string, string | number>): string => s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** Partage natif (feuille du téléphone), sinon copie du lien ; rend vrai si le lien a été copié. */
export async function shareOrCopy(data: { text: string; url: string }): Promise<'shared' | 'copied' | 'none'> {
  try {
    if (navigator.share) {
      await navigator.share({ text: data.text, url: data.url });
      return 'shared';
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') return 'none';
  }
  return (await copyText(data.url)) ? 'copied' : 'none';
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Le bouton dit « copié » deux secondes. */
export function flash(btn: HTMLElement, text: string): void {
  const before = btn.textContent;
  btn.textContent = text;
  window.setTimeout(() => (btn.textContent = before), 2000);
}

/** Textes d'une boîte de code (CodeBox, attributs `data-t`) dans la langue de la page. */
export function translateCodeBox(box: string, texts: { codeLabel: string; codeHelp: string; copy: string }): void {
  if (locale === 'fr') return;
  document.querySelectorAll<HTMLElement>(`[data-code-box="${box}"] [data-t]`).forEach((el) => {
    const k = el.dataset.t as keyof typeof texts;
    if (k in texts) el.textContent = texts[k];
  });
}
