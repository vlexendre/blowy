/** Outils communs aux pages quiz et quartier : textes de la langue de la page (`i18n/client.ts`), partage, copie. */
import { quizText } from '@blowy/content';
import { quizCopy, type QuizLang } from '../content/quiz';
import { currentLocale } from '../i18n/client';

export { fill } from '../i18n/site';

export const locale = currentLocale();
export const t: QuizLang = quizCopy[locale];
export const qt = quizText.in(locale);

/** Partage natif (feuille du téléphone), sinon copie du lien. */
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
