/** Formats d'affichage de l'espace lieu (français, fuseau du quartier). Aucune donnée personnelle ici. */
const TZ_DEFAULT = 'Europe/Paris';

const parts = (iso: string, tz: string) => {
  const d = new Date(iso);
  const f = new Intl.DateTimeFormat('fr-FR', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hourCycle: 'h23' });
  const o = Object.fromEntries(f.formatToParts(d).map((p) => [p.type, p.value]));
  return { weekday: o.weekday ?? '', day: o.day ?? '', month: o.month ?? '', year: o.year ?? '', hour: Number(o.hour ?? 0), minute: Number(o.minute ?? 0) };
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « 19 h 30 », « 18 h ». */
export function clock(iso: string, tz = TZ_DEFAULT): string {
  const p = parts(iso, tz);
  return p.minute === 0 ? `${p.hour} h` : `${p.hour} h ${String(p.minute).padStart(2, '0')}`;
}

/** « Jeudi 12 novembre » (majuscule initiale) ou « jeudi 12 novembre ». */
export function dayLabel(iso: string, tz = TZ_DEFAULT, capitalized = true): string {
  const p = parts(iso, tz);
  const s = `${p.weekday} ${p.day} ${p.month}`;
  return capitalized ? cap(s) : s;
}

/** « 2 novembre 2026 ». */
export function longDate(iso: string, tz = TZ_DEFAULT): string {
  const p = parts(iso, tz);
  return `${p.day} ${p.month} ${p.year}`;
}

export const ACTIVITY_LABEL: Record<string, string> = {
  /** V5.6 (E13) : rendez-vous Duo au lieu. */
  DUO_TABLE: 'Table de 2 (Duo)',
  GAMES: 'Jeux de société',
  DRINK_COFFEE: 'Verre ou café',
  BRUNCH: 'Brunch',
  CLIMBING: 'Bloc d’escalade',
  WORKSHOP: 'Atelier',
  EXHIBITION: 'Expo',
  SPORT: 'Sport',
};

export const euros = (cents: number) => `${(cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

/** Illustrations décoratives des lignes (jamais le pet de la personne : le lieu ne voit que des prénoms). */
export const ROW_ART: { src: string; background: string }[] = [
  { src: '/lieu/img/raton.webp', background: '#C8F542' },
  { src: '/lieu/img/renard.png', background: '#FFE1C2' },
  { src: '/lieu/img/lapin.webp', background: '#EEE6FF' },
  { src: '/lieu/img/ecureuil.webp', background: '#FFF1D6' },
  { src: '/lieu/img/pigeon.webp', background: '#DDF5EA' },
];
