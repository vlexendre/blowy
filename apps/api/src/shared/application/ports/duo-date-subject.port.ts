/**
 * Sujet « rendez-vous à deux » de l'ange gardien (spec-v5 §2.9, sujet `DUO_DATE`) — fourni par
 * `connections`, consommé par `safety` (T4, E). Le proche ne voit jamais l'autre personne : ce port ne
 * donne ni son prénom, ni sa photo, ni sa présence ; seulement MA présence (« arrivé·e »).
 * Événements outbox émis par `connections` pour la révocation/chronologie : `duo.date_confirmed`,
 * `duo.date_cancelled {duoDateId, userIds}`, `duo.date_checked_in {duoDateId, userId}`,
 * `duo.date_done {duoDateId}`, `duo.ended {duoId, userIds}`.
 */
export interface DuoDateSubject {
  duoDateId: string;
  status: 'PROPOSED' | 'CONFIRMED' | 'DECLINED' | 'SUPERSEDED' | 'CANCELLED' | 'DONE';
  startsAt: Date;
  endsAt: Date;
  venue: { name: string; address: string };
  /** Mon check-in seulement. */
  myCheckedInAt: Date | null;
}

export interface DuoDateSubjectReader {
  /** null si `userId` n'est pas l'un des deux membres (même réponse qu'un identifiant inconnu). */
  subjectFor(userId: string, duoDateId: string): Promise<DuoDateSubject | null>;
}
export const DUO_DATE_SUBJECT_READER = Symbol('DuoDateSubjectReader');
