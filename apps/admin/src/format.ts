/** Mise en forme française des chiffres, dates et écarts. */
const int = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const dec1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const pct = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 });
const usd = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

export const fmtInt = (n: number | null | undefined): string => (n === null || n === undefined ? '—' : int.format(n));
export const fmtDec = (n: number | null | undefined): string => (n === null || n === undefined ? '—' : dec1.format(n));
export const fmtPct = (n: number | null | undefined): string => (n === null || n === undefined ? '—' : pct.format(n));
export const fmtUsd = (n: number | null | undefined): string => (n === null || n === undefined ? '—' : usd.format(n));

export const fmtDay = (day: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }): string =>
  new Intl.DateTimeFormat('fr-FR', { ...opts, timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
export const fmtDayShort = (day: string): string => fmtDay(day, { day: 'numeric', month: 'short' });
export const fmtDateTime = (iso: string): string =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(iso));

export function fmtAge(hours: number): string {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} j`;
}

/** Écart relatif entre deux valeurs ; null si l'une manque ou si la précédente vaut 0. */
export function change(value: number | null, previous: number | null): number | null {
  if (value === null || previous === null || previous === 0) return null;
  return (value - previous) / Math.abs(previous);
}

export const REASONS: Record<string, string> = {
  harcelement: 'Harcèlement',
  contenu_inapproprie: 'Contenu inapproprié',
  faux_profil: 'Faux profil',
  mineur: 'Personne mineure',
  autre: 'Autre',
};

export const ACTIONS: Record<string, string> = {
  warn: 'Avertissement',
  suspend: 'Suspension',
  delete: 'Suppression',
  dismiss: 'Classé sans suite',
  lift: 'Suspension levée',
};

export const FEATURES: Record<string, string> = {
  chat_remark: 'Remarques dans le chat',
  habit_proof: 'Preuves d’habitude',
  weekly_review: 'Bilans de la semaine',
  moderation: 'Modération',
};

export const SHAPES: Record<string, string> = { en_forme: 'En forme', bof: 'Bof', boude: 'Boude' };
