/**
 * Onglet Quartier (docs/ADA-2027.md, décision 8) : les personnes de la carte et de la liste, réunies. Une même fiche
 * pour une épingle et pour une ligne : qui, pourquoi, où vous en êtes, et à quelle distance (en bandes, jamais au mètre).
 * Pur (pas de React) : testé dans `people.test.ts`.
 */
import type { Encounters, LatLng, MapPin, MatchExplanation, Person } from '@blowy/contract';

import { distanceBand, type DistanceBand } from '../chemin/logic';

/** Une personne du quartier, d'où qu'elle vienne (présentée aujourd'hui, épingle de la carte). */
export interface Neighbor {
  id: string;
  user: Person;
  compatibility: number;
  explanation: MatchExplanation;
  /** Où vous en êtes : rien encore, tu as salué, on t'a salué (la réponse se donne sur l'écran de la rencontre). */
  relation: 'none' | 'waved' | 'waved_you';
  /** Présentée aujourd'hui par ton minimoa (anneau jaune sur la carte ; gratuit : saluer est permis). */
  presented: boolean;
  /** Raison en une phrase (premier point commun, sinon ce que dit son minimoa). */
  reason: string;
  /** Distance à gros grains, si l'on connaît son épingle. */
  band: DistanceBand | null;
  /** Son épingle sur la carte, s'il en a une. */
  position: LatLng | null;
  /** Nouveau sur Minimoa (puce). */
  isNew: boolean;
}

export interface QuartierPeople {
  /** Présentés aujourd'hui, la personne du jour de la séance d'abord. */
  today: Neighbor[];
  /** Les autres épingles de la carte (l'alternative en liste à la carte, pour VoiceOver). */
  around: Neighbor[];
  /** Tout le monde, par identifiant (une épingle ou une ligne ouvre la même fiche). */
  byId: Map<string, Neighbor>;
}

/**
 * Réunit les présentations du jour (`GET /v1/encounters`) et les épingles de la carte (`GET /v1/map`). `from` : d'où
 * l'on mesure la distance (ton quartier) ; `dayPerson` : la personne du jour de la séance, en tête.
 */
export function quartierPeople(input: {
  encounters: Pick<Encounters, 'suggestions' | 'incoming'> | undefined;
  pins: readonly MapPin[];
  from: LatLng | null;
  dayPerson?: string | null;
}): QuartierPeople {
  const pins = new Map(input.pins.map((p) => [p.user.id, p]));
  const wavedYou = new Set((input.encounters?.incoming ?? []).map((i) => i.from.id));
  const bandOf = (pos: LatLng | null): DistanceBand | null => (pos && input.from ? distanceBand(input.from, pos) : null);
  const byId = new Map<string, Neighbor>();

  const suggestions = [...(input.encounters?.suggestions ?? [])].sort(
    (a, b) => Number(b.user.id === input.dayPerson) - Number(a.user.id === input.dayPerson),
  );
  const today = suggestions.map((s): Neighbor => {
    const pin = pins.get(s.user.id);
    const position = pin?.position ?? null;
    return {
      id: s.user.id,
      user: s.user,
      compatibility: s.compatibility,
      explanation: s.explanation,
      relation: s.waved ? 'waved' : wavedYou.has(s.user.id) ? 'waved_you' : (pin?.relation ?? 'none'),
      presented: true,
      reason: s.explanation.common[0]?.text ?? s.intro,
      band: bandOf(position),
      position,
      isNew: s.via === 'new' && !s.waved,
    };
  });
  for (const n of today) byId.set(n.id, n);

  const around: Neighbor[] = [];
  for (const p of input.pins) {
    if (byId.has(p.user.id)) continue;
    const n: Neighbor = {
      id: p.user.id,
      user: p.user,
      compatibility: p.compatibility,
      explanation: p.explanation,
      relation: wavedYou.has(p.user.id) ? 'waved_you' : (p.relation ?? 'none'),
      presented: false,
      reason: p.explanation.common[0]?.text ?? '',
      band: bandOf(p.position),
      position: p.position,
      isNew: false,
    };
    around.push(n);
    byId.set(n.id, n);
  }
  return { today, around, byId };
}

/**
 * Saluer depuis la fiche : permis pour une personne présentée aujourd'hui (gratuit compris) et avec Minimoa+ pour les
 * autres épingles ; sinon, l'avantage (`openPlus('map')`).
 */
export const canWave = (n: Pick<Neighbor, 'presented'>, plus: boolean): boolean => n.presented || plus;
