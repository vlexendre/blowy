/**
 * Règles pures de l'ange gardien et des alertes (spec-v5 §2.9, §3.2 ; V5.1 G.19–21 ; V5.2 C.8).
 * Aucune horloge ni aléa ici : `now`, `tuning` et les faits sont passés en paramètres.
 *
 * Projecteur `projectGuardianPage` : ce que voit le proche, SANS compte. Tout ce qui n'est pas
 * explicitement permis est ABSENT : jamais d'autre participant (ni nombre, ni prénom, ni photo),
 * ni chat, ni fiabilité, ni statut Blowy+, ni AUCUNE position — même en alerte (V5.3 A.4 : le lieu
 * et l'heure de la sortie seulement ; la position éventuellement jointe ne sert qu'au staff).
 */
import { EMERGENCY_NUMBERS, type GuardianSubjectKind } from '@blowy/domain';

const H = 3_600_000;

/** Engagement affiché « réponse humaine < 1 h pendant les créneaux de sortie » (V5.1 G.19). Demande à B : `[T] safety.humanResponseMinutes`. */
export const HUMAN_RESPONSE_MINUTES = 60;
/** Rétention des métadonnées d'un lien après expiration (spec-v5 §8.5). */
export const GUARDIAN_METADATA_RETENTION_DAYS = 30;

export interface SafetyTuningSlice {
  guardianActiveBeforeHours: number;
  guardianLinkGraceHours: number;
  maxGuardianLinksPerSubject: number;
  guardianPushRetentionHours: number;
  alertPositionRetentionHours: number;
  alertsPerHour: number;
  removalAbuseThreshold: number;
  removalAbuseWindowDays: number;
  /** tuning-2026.12.3 (V5.3 B.9) : défauts appliqués si une tranche antérieure est fournie. */
  humanResponseMinutes?: number;
  uneasyLeaveRecontactThreshold?: number;
  uncomfortableLeaveWindowDays?: number;
  /** V5.7 (E31, D-078) : rappel humain visé pendant une sortie (« en quelques minutes »). */
  helpCallbackTargetMinutes?: number;
}

/** Réponse humaine visée (`[T] safety.humanResponseMinutes`, 60 par défaut). */
export const humanResponseMinutes = (t: Pick<SafetyTuningSlice, 'humanResponseMinutes'>): number => t.humanResponseMinutes ?? HUMAN_RESPONSE_MINUTES;
/** V5.7 (E31) : objectif de rappel humain (`[T] safety.helpCallbackTargetMinutes`, 5) ; la SLA dossier reste `humanResponseMinutes`. */
export const helpCallbackTargetMinutes = (t: Pick<SafetyTuningSlice, 'helpCallbackTargetMinutes'>): number => t.helpCallbackTargetMinutes ?? 5;

/** Faits d'un sujet (sortie ou RDV duo) du point de vue de son propriétaire. */
export interface SubjectFacts {
  kind: GuardianSubjectKind;
  id: string;
  ownerUserId: string;
  ownerFirstName: string;
  /** Place / RDV du propriétaire confirmé (création d'un lien possible). */
  confirmed: boolean;
  /** Sujet annulé, place retirée ou annulée : plus rien n'est servi. */
  cancelled: boolean;
  startsAt: Date;
  endsAt: Date;
  /** Révélation du lieu (verrouillage J-1 18 h) ; null = jamais avant la confirmation. */
  venueRevealAt: Date | null;
  venue: { name: string; address: string } | null;
  checkedInAt: Date | null;
  /** « Je pars, mal à l'aise » (V5.3 B.9) : renseigné seulement si la personne a choisi de prévenir son gardien. */
  leftAt?: Date | null;
}

export interface GuardianWindow {
  activeFrom: Date;
  expiresAt: Date;
}

/** Page « active » de `startsAt − 2 h` à `endsAt + 3 h` ; expiration dure = `endsAt + 3 h`. */
export function guardianWindow(s: Pick<SubjectFacts, 'startsAt' | 'endsAt'>, t: SafetyTuningSlice): GuardianWindow {
  return { activeFrom: new Date(s.startsAt.getTime() - t.guardianActiveBeforeHours * H), expiresAt: new Date(s.endsAt.getTime() + t.guardianLinkGraceHours * H) };
}

export function inWindow(w: GuardianWindow, now: Date): boolean {
  return now >= w.activeFrom && now < w.expiresAt;
}

/** Les créneaux « réponse humaine < 1 h » sont les fenêtres actives des sorties. */
export function supportStaffed(w: GuardianWindow, now: Date): boolean {
  return inWindow(w, now);
}

export interface GuardianLinkFacts {
  activeFrom: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

/** Un lien est servable s'il n'est ni révoqué ni expiré et si le sujet n'est pas annulé. */
export function linkServable(l: GuardianLinkFacts, s: SubjectFacts | null, now: Date): boolean {
  return !l.revokedAt && now < l.expiresAt && !!s && !s.cancelled;
}

export interface AlertFacts {
  id: string;
  status: 'OPEN' | 'SAFE' | 'HANDLED';
  createdAt: Date;
  resolvedAt: Date | null;
  position: { lat: number; lng: number; accuracyM: number } | null;
}

export type TimelineEntry = { type: 'CHECKED_IN' | 'OK' | 'ALERT' | 'ENDED'; at: string };

export interface GuardianPage {
  ownerFirstName: string;
  kind: GuardianSubjectKind;
  startsAt: string;
  endsAt: string;
  venue?: { name: string; address: string };
  timeline: TimelineEntry[];
  alert?: { at: string };
  active: boolean;
  expiresAt: string;
  emergencyNumbers: (typeof EMERGENCY_NUMBERS)[number][];
}

/**
 * Projection pour le proche. Avant `activeFrom` : rendez-vous prévu (date, heure) et, dès le
 * verrouillage, le lieu ; aucune chronologie (sauf une demande d'aide, jamais masquée). Pendant la fenêtre : chronologie (arrivé·e,
 * « tout va bien », alerte, terminé / parti·e si la personne l'a choisi).
 */
export function projectGuardianPage(i: { link: GuardianLinkFacts; subject: SubjectFacts; oks: Date[]; alerts: AlertFacts[]; now: Date }): GuardianPage {
  const { link, subject: s, now } = i;
  const active = now >= link.activeFrom && now < link.expiresAt;
  const started = now >= link.activeFrom;
  const timeline: TimelineEntry[] = [];
  if (started) {
    // Check-in : « arrivé·e à HH:MM » seulement (jamais « en route »).
    if (s.checkedInAt && s.checkedInAt <= now) timeline.push({ type: 'CHECKED_IN', at: s.checkedInAt.toISOString() });
    for (const at of i.oks) if (at >= link.activeFrom && at <= now) timeline.push({ type: 'OK', at: at.toISOString() });
    // Fin : départ anticipé (si la personne a prévenu son gardien) ou fin prévue.
    const ended = s.leftAt && s.leftAt <= now && s.leftAt < s.endsAt ? s.leftAt : now >= s.endsAt ? s.endsAt : null;
    if (ended) timeline.push({ type: 'ENDED', at: ended.toISOString() });
  }
  // Une demande d'aide est TOUJOURS montrée au proche, même hors fenêtre (jamais masquée par l'horaire).
  for (const a of i.alerts) if (a.createdAt <= now) timeline.push({ type: 'ALERT', at: a.createdAt.toISOString() });
  timeline.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  const open = i.alerts.filter((a) => a.status === 'OPEN' && a.createdAt <= now).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  const venueVisible = !!s.venue && !!s.venueRevealAt && now >= s.venueRevealAt;
  return {
    ownerFirstName: s.ownerFirstName,
    kind: s.kind,
    startsAt: s.startsAt.toISOString(),
    endsAt: s.endsAt.toISOString(),
    ...(venueVisible ? { venue: { name: s.venue!.name, address: s.venue!.address } } : {}),
    timeline,
    // V5.3 A.4 : jamais de position sur la page, même jointe à l'alerte.
    ...(open ? { alert: { at: open.createdAt.toISOString() } } : {}),
    active,
    expiresAt: link.expiresAt.toISOString(),
    emergencyNumbers: [...EMERGENCY_NUMBERS],
  };
}

/** Purge de la position d'alerte : `positionPurgeAfter`, repoussée tant qu'un dossier est ouvert. */
export function positionPurgeDue(a: { positionPurgeAfter: Date | null; positionPurgedAt: Date | null; caseOpen: boolean }, now: Date): boolean {
  return !!a.positionPurgeAfter && !a.positionPurgedAt && now >= a.positionPurgeAfter && !a.caseOpen;
}

/** Signal staff : la même personne a déclenché ≥ seuil retraits système dans la fenêtre (D-025). */
export function removalAbuse(countInWindow: number, t: SafetyTuningSlice): boolean {
  return countInWindow >= t.removalAbuseThreshold;
}

/** Libellé privé : espaces normalisés, 1–30 caractères (le contrat a déjà validé la borne). */
export function normalizeLabel(label: string | undefined): string | null {
  const v = label?.replace(/\s+/g, ' ').trim();
  return v ? v.slice(0, 30) : null;
}
