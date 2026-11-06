/**
 * Pertinence À L'ENVOI (pas à la planification) : la sortie existe-t-elle encore, la place est-elle
 * toujours confirmée, le duo vivant, le message publié par la modération ? C'est aussi ce qui
 * garantit « rien entre deux sorties » : une notification de cycle n'a de sens que si son ancre vit.
 * Produit les variables du texte (jamais un âge, un vote, une position, un corps de message).
 *
 * Visibilité des noms (§3.1, V5.3 A.3/B.7) : prénoms d'un groupe seulement après la confirmation —
 * avant `lockAt`, l'auteur d'un message de groupe est désigné par son pet.
 */
import type { PushKey } from '../domain/catalog.js';
import type { Relevance } from '../domain/policy.js';
import type { TemplateVars } from '../domain/render.js';
import { formatHour, formatLongDay, formatWeekday, safeTz } from '../domain/time.js';
import type { NotificationFactsReader, NotificationRepository, OutingFacts, StoredNotification } from './ports.js';

export interface Resolved {
  relevance: Relevance;
  vars: TemplateVars;
  route: string;
}

const NO: Resolved = { relevance: { relevant: false }, vars: {}, route: '/home' };
const SEATED = new Set(['CONFIRMED', 'CHECKED_IN']);
const OUTING_DONE_OK = (o: OutingFacts, now: Date) => !o.votesClosedAt && now.getTime() < o.votesCloseAt.getTime();

export class RelevanceResolver {
  constructor(
    private readonly facts: NotificationFactsReader,
    private readonly repo: NotificationRepository,
  ) {}

  private async pet(userId: string) {
    return (await this.facts.people([userId])).get(userId)?.petName ?? undefined;
  }
  private async firstName(userId: string | undefined) {
    if (!userId) return undefined;
    return (await this.facts.people([userId])).get(userId)?.firstName || undefined;
  }

  async resolve(n: StoredNotification, now: Date): Promise<Resolved> {
    const r = n.refs;
    const key: PushKey = n.key;
    const yes = (vars: TemplateVars, route: string): Resolved => ({ relevance: { relevant: true }, vars, route });
    switch (key) {
      case 'safety.alert_sent':
        return yes({}, '/safety');
      case 'outing.unplaced':
        return yes({}, '/home');
      case 'outing.cancelled':
      case 'outing.composition_changed': {
        const o = r.outingId ? await this.facts.outing(r.outingId) : null;
        return yes(o ? { jour: formatWeekday(o.startsAt, o.tz) } : {}, r.outingId ? `/outings/${r.outingId}` : '/home');
      }
      case 'outing.refund_done': {
        // L'annulation (« ta place t'est rendue ») l'a déjà dit : pas de second message.
        if (r.outingId && (await this.repo.anyActive(n.userId, [`outing.cancelled:${r.outingId}`, `outing.composition_changed:${r.outingId}`]))) return NO;
        return yes({}, '/home');
      }
      case 'reliability.paused': {
        const until = await this.facts.reliabilityPausedUntil(n.userId);
        if (!until || until.getTime() <= now.getTime()) return NO;
        return yes({ jour: formatLongDay(until, safeTz(await this.facts.timezone(n.userId))) }, '/home');
      }
      case 'outing.invited':
      case 'outing.seeding_invited':
      case 'outing.invite_reminder':
      case 'outing.formed':
      case 'outing.confirmed':
      case 'outing.faces':
      case 'outing.checkin_open':
      case 'votes.opened':
      case 'votes.reminder':
      case 'votes.closed':
        return this.outing(n, now);
      case 'connection.friend':
      case 'connection.plus': {
        const prenom = await this.firstName(r.otherUserId);
        return yes({ prenom }, r.duoId ? `/duos/${r.duoId}` : '/band');
      }
      case 'team.member_joined': {
        const members = r.teamId ? await this.facts.teamMembers(r.teamId) : null;
        if (!members?.includes(n.userId) || !r.otherUserId || !members.includes(r.otherUserId)) return NO;
        return yes({ prenom: await this.firstName(r.otherUserId) }, '/home');
      }
      case 'duo.matched':
      case 'duo.unlocked':
      case 'duo.exchange_ending':
      case 'duo.deadline_soon':
      case 'duo.closed':
        return this.duo(n, now);
      case 'duo.date_proposed':
      case 'duo.date_confirmed':
      case 'duo.date_reminder':
      case 'duo.checkin_open':
      case 'duo.after_vote':
        return this.duoDate(n, now);
      case 'message.human':
        return this.message(n, now);
    }
  }

  private async outing(n: StoredNotification, now: Date): Promise<Resolved> {
    const o = n.refs.outingId ? await this.facts.outing(n.refs.outingId) : null;
    const seat = o?.seats.find((s) => s.userId === n.userId);
    if (!o || !seat || o.status === 'CANCELLED') return NO;
    const route = `/outings/${o.id}`;
    const jour = formatWeekday(o.startsAt, o.tz);
    const heure = formatHour(o.startsAt, o.tz);
    const yes = (vars: Resolved['vars']): Resolved => ({ relevance: { relevant: true }, vars, route });
    switch (n.key) {
      case 'outing.invited':
      case 'outing.seeding_invited':
        return seat.status === 'INVITED' && now < seat.acceptDeadline && (o.status === 'PROPOSED' || o.status === 'FORMING') ? yes({ jour, pet: await this.pet(n.userId) }) : NO;
      case 'outing.invite_reminder':
        return (seat.status === 'INVITED' || seat.status === 'HELD') && now < seat.acceptDeadline && (o.status === 'PROPOSED' || o.status === 'FORMING') ? yes({ jour }) : NO;
      case 'outing.formed':
        return seat.status === 'CONFIRMED' && (o.status === 'FORMING' || o.status === 'CONFIRMED') ? yes({ jour }) : NO;
      case 'outing.confirmed':
      case 'outing.faces':
        return SEATED.has(seat.status) && (o.status === 'CONFIRMED' || o.status === 'CHECKIN_OPEN') && now < o.startsAt ? yes({ jour, heure, lieu: o.venueName }) : NO;
      case 'outing.checkin_open':
        return seat.status === 'CONFIRMED' && o.status === 'CHECKIN_OPEN' ? yes({ lieu: o.venueName }) : NO;
      case 'votes.opened':
        return seat.status === 'ATTENDED' && OUTING_DONE_OK(o, now) ? yes({}) : NO;
      case 'votes.reminder':
        // Seulement à qui n'a rien enregistré ; ne dit jamais qui a voté.
        return seat.status === 'ATTENDED' && OUTING_DONE_OK(o, now) && !(await this.facts.hasBallot(o.id, n.userId)) ? yes({ heure: formatHour(o.votesCloseAt, o.tz) }) : NO;
      case 'votes.closed':
        return seat.status === 'ATTENDED' ? yes({ pet: await this.pet(n.userId) }) : NO;
      default:
        return NO;
    }
  }

  private async duo(n: StoredNotification, now: Date): Promise<Resolved> {
    const d = n.refs.duoId ? await this.facts.duo(n.refs.duoId) : null;
    if (!d || !d.userIds.includes(n.userId)) return NO;
    const other = d.userIds.find((u) => u !== n.userId)!;
    const route = `/duos/${d.id}`;
    const yes = (vars: Resolved['vars']): Resolved => ({ relevance: { relevant: true }, vars, route });
    const pets = await this.facts.people([n.userId, other]);
    switch (n.key) {
      case 'duo.matched':
        return d.status === 'EXCHANGE' ? yes({ pet: pets.get(n.userId)?.petName ?? undefined, autrePet: pets.get(other)?.petName ?? undefined }) : NO;
      case 'duo.exchange_ending': {
        if (d.status !== 'EXCHANGE' || !d.exchangeEndsAt || now >= d.exchangeEndsAt) return NO;
        const tz = safeTz(pets.get(n.userId)?.tz);
        return yes({ pet: pets.get(n.userId)?.petName ?? undefined, autrePet: pets.get(other)?.petName ?? undefined, heure: formatHour(d.exchangeEndsAt, tz) });
      }
      case 'duo.unlocked':
        return ['UNLOCKED', 'DATE_PROPOSED', 'DATE_CONFIRMED'].includes(d.status) ? yes({}) : NO;
      case 'duo.deadline_soon':
        return d.status === 'UNLOCKED' && d.dateDeadline && now < d.dateDeadline ? yes({ prenom: pets.get(other)?.firstName || undefined }) : NO;
      case 'duo.closed':
        return d.status === 'LEFT' || d.status === 'EXPIRED' ? yes({}) : NO;
      default:
        return NO;
    }
  }

  private async duoDate(n: StoredNotification, now: Date): Promise<Resolved> {
    const dd = n.refs.duoDateId ? await this.facts.duoDate(n.refs.duoDateId) : null;
    if (!dd || !dd.userIds.includes(n.userId)) return NO;
    const other = dd.userIds.find((u) => u !== n.userId)!;
    const route = `/duos/${dd.duoId}`;
    const jour = formatWeekday(dd.startsAt, dd.tz);
    const heure = formatHour(dd.startsAt, dd.tz);
    const yes = (vars: Resolved['vars']): Resolved => ({ relevance: { relevant: true }, vars, route });
    switch (n.key) {
      case 'duo.date_proposed':
        return dd.status === 'PROPOSED' && now < dd.startsAt ? yes({ prenom: await this.firstName(dd.proposedByUserId), jour, heure }) : NO;
      case 'duo.date_confirmed':
        return dd.status === 'CONFIRMED' && now < dd.startsAt ? yes({ jour, heure, lieu: dd.venueName }) : NO;
      case 'duo.date_reminder':
        return dd.status === 'CONFIRMED' && now < dd.startsAt ? yes({ heure, lieu: dd.venueName, prenom: await this.firstName(other) }) : NO;
      case 'duo.checkin_open':
        return dd.status === 'CONFIRMED' && !dd.checkedIn.includes(n.userId) && now < dd.endsAt ? yes({ lieu: dd.venueName }) : NO;
      case 'duo.after_vote':
        return dd.status === 'DONE' && !dd.votesClosedAt ? yes({}) : NO;
      default:
        return NO;
    }
  }

  private async message(n: StoredNotification, now: Date): Promise<Resolved> {
    const convId = n.refs.conversationId;
    const conv = convId ? await this.facts.conversation(convId) : null;
    const me = conv?.members.find((m) => m.userId === n.userId);
    if (!conv || conv.closedAt || !me || me.revokedAt) return NO;
    const since = n.refs.since ? new Date(n.refs.since) : n.createdAt;
    const seen = await this.facts.visibleMessageSince(conv.id, n.userId, since);
    // Encore en modération : on réessaie (jamais de push pour un message qui ne sera pas publié).
    if (seen === 'PENDING') return { relevance: { relevant: false, retryAt: new Date(now.getTime() + 60_000) }, vars: {}, route: '/home' };
    if (!seen) return NO;
    const p = (await this.facts.people([seen.authorUserId])).get(seen.authorUserId);
    let prenom = p?.firstName || undefined;
    if (conv.kind === 'OUTING' && conv.outingId) {
      const o = await this.facts.outing(conv.outingId);
      // Avant la confirmation (J-1 18 h), les auteurs du chat de groupe sont désignés par leur pet.
      if (!o || now < o.lockAt) prenom = p?.petName ?? undefined;
    }
    return { relevance: { relevant: true }, vars: { prenom }, route: `/conversations/${conv.id}` };
  }
}
