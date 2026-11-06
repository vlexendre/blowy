/**
 * V5.8 (§3, D-086) : un numéro de téléphone n'est jamais échangé dans l'app avant les visages. Les numéros saisis dans
 * un chat de sortie ou de duo sont MASQUÉS pour les destinataires tant que les visages ne sont pas révélés
 * (sortie : `photoRevealAt` ; duo : déblocage à 48 h), puis servis tels quels. Le texte stocké n'est jamais modifié.
 *
 * Détection : suites de 8 à 15 chiffres, éventuellement précédées de `+` ou `00`, séparées par espaces, points,
 * tirets, barres, parenthèses (jusqu'à 3 caractères entre deux chiffres) — FR (06 12 34 56 78, 06.12.34.56.78,
 * +33 6 12 34 56 78, 0033 6…), international (+44 7700 900123, +1 (415) 555-0123), chiffres espacés un à un. Les dates
 * (2026-11-19, 19/11/2026) ne sont pas des numéros.
 */
export const PHONE_MASK = '[numéro masqué jusqu’aux visages]';

const CANDIDATE = /(?:\+|\b00)?\(?\d(?:[\s.\-/()\u00a0]{0,3}\d){7,}/g;
const DATE = /^(?:\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})$/;

export function containsPhone(text: string): boolean {
  return maskPhones(text) !== text;
}

export function maskPhones(text: string): string {
  return text.replace(CANDIDATE, (m) => {
    const digits = m.replace(/\D/g, '').length;
    if (digits < 8 || digits > 15) return m;
    if (DATE.test(m.trim())) return m;
    return PHONE_MASK;
  });
}
