/**
 * Compteur mécanique (`CountUp`) : calculs purs, exécutés dans un worklet.
 *
 * La valeur animée dépasse un peu sa cible avant de revenir (`overshoot`, comme les barres) ; un nombre écrit, lui,
 * ne doit jamais montrer ce dépassement : compter de 0 à 100 affichait un instant « 102 % », et vers 99 la colonne
 * des centaines n'existant pas, « 02 ». Le nombre affiché reste donc entre la valeur de départ et la cible.
 */

/** Valeur montrée par le compteur : la valeur animée, bornée entre le départ et la cible (dans les deux sens). */
export function shownCount(animated: number, from: number, target: number): number {
  'worklet';
  const lo = Math.min(from, target);
  const hi = Math.max(from, target);
  return Math.min(hi, Math.max(lo, animated, 0));
}

/**
 * Position (0 à 10, 10 = le second « 0 » de la colonne) du chiffre de rang `place` (1, 10, 100…) : un chiffre ne
 * roule que pendant la dernière unité des chiffres à sa droite (retenue).
 */
export function digitPosition(value: number, place: number): number {
  'worklet';
  return (Math.floor(value / place) % 10) + Math.max(0, (value % place) - (place - 1));
}

/** Le nombre lu sur les colonnes, chiffre par chiffre arrondi (pour les tests). */
export function readCounter(value: number, digits: number): string {
  let out = '';
  for (let i = digits - 1; i >= 0; i--) out += String(Math.round(digitPosition(value, 10 ** i)) % 10);
  return out;
}
