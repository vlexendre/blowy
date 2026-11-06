/**
 * Planificateur : transforme une intention (« prévenir Léa à J − 3 h ») en ligne `Notification`
 * QUEUED, dans la transaction du consommateur outbox. Rien n'est rendu ici : seules des références
 * sont stockées ; le texte est produit à l'envoi, avec les faits du moment (pertinence revérifiée).
 *
 * - échéance placée hors heures calmes (avance à 22 h 30 pour les rappels, sinon report à 8 h) ;
 * - déduplication par (personne, `dedupKey`) en base : un événement rejoué n'envoie rien de plus ;
 * - proposition de sortie : ≤ `[T] maxOutingProposalsPerWeek` par semaine (clé `proposal:<semaine>:<n>`).
 */
import type { NotificationsV5TuningSchema } from '@blowy/tuning';
import type { z } from 'zod';
import type { RandomSource } from '../../../shared/application/clock.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { PUSH_KINDS, type PushKey } from '../domain/catalog.js';
import { localDay, placeOutsideQuiet, safeTz } from '../domain/time.js';
import type { NewNotification, NotificationFactsReader, NotificationRefs, NotificationRepository } from './ports.js';

export type NotificationsTuning = z.output<typeof NotificationsV5TuningSchema>;

export interface Plan {
  userId: string;
  key: PushKey;
  /** Sujet de déduplication (ex. id de sortie) : clé = `<key>:<subject>` sauf `dedupKey` explicite. */
  subject: string;
  at: Date;
  expiresAt: Date | null;
  refs: NotificationRefs;
  groupKey?: string;
  dedupKey?: string;
}

export class NotificationPlanner {
  constructor(
    private readonly repo: NotificationRepository,
    private readonly facts: NotificationFactsReader,
    private readonly random: RandomSource,
    private readonly tuning: NotificationsTuning,
  ) {}

  private async rows(scope: TxScope, plans: Plan[]): Promise<NewNotification[]> {
    const people = await this.facts.people([...new Set(plans.map((p) => p.userId))]);
    const out: NewNotification[] = [];
    for (const p of plans) {
      const tz = safeTz(people.get(p.userId)?.tz);
      const base = p.at.getTime() < scope.now.getTime() ? scope.now : p.at;
      const spec = PUSH_KINDS[p.key];
      const deliverAt = spec.klass === 'SAFETY' ? base : placeOutsideQuiet(base, tz, this.tuning, { advanceable: spec.advanceable, notBefore: scope.now });
      if (p.expiresAt && deliverAt.getTime() > p.expiresAt.getTime()) continue; // ne serait jamais pertinente
      out.push({ id: this.random.uuid(), userId: p.userId, key: p.key, dedupKey: p.dedupKey ?? `${p.key}:${p.subject}`, groupKey: p.groupKey ?? null, deliverAt, expiresAt: p.expiresAt, refs: p.refs, localDay: localDay(deliverAt, tz) });
    }
    return out;
  }

  async enqueue(scope: TxScope, plans: Plan[]): Promise<number> {
    if (plans.length === 0) return 0;
    return this.repo.insert(scope, await this.rows(scope, plans));
  }

  /**
   * L'invitation de la semaine (D-052, V5.1 D.15) : au plus N par semaine ISO de la sortie. Au-delà,
   * une trace SUPPRESSED (sans texte) est gardée ; l'invitation reste visible dans l'app.
   */
  async enqueueProposal(scope: TxScope, p: Plan & { weekKey: string }): Promise<boolean> {
    const prefix = `proposal:${p.weekKey}:`;
    const already = await this.repo.countByDedupPrefix(scope, p.userId, prefix);
    if (already >= this.tuning.maxOutingProposalsPerWeek) {
      const [row] = await this.rows(scope, [{ ...p, at: scope.now, expiresAt: null }]);
      if (row) await this.repo.insert(scope, [{ ...row, suppressed: 'WEEKLY_PROPOSAL_CAP' }]);
      return false;
    }
    return (await this.enqueue(scope, [{ ...p, dedupKey: `${prefix}${already + 1}` }])) > 0;
  }
}
