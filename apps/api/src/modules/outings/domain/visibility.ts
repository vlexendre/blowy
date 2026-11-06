/**
 * Projecteur par acteur de la sortie — applique STRICTEMENT le tableau §3.1 de la spec (révision 4,
 * V5.3 B.7–B.8) : aperçu anonyme à l'invitation ; avant la confirmation (FORMING) les co-participant·es
 * ne sont vu·es que par leur PET ; à la confirmation (J-1 18 h, `lockAt`) lieu + prénoms + tranches +
 * fiabilité ; visages à `photoRevealAt` (J − 3 h) ; votes publiés à la clôture. Tout ce qui n'est pas
 * autorisé est ABSENT du JSON (pas de `null` révélateur). Jamais : intentions, genres recherchés, votes
 * d'autrui, âge exact, financement d'autrui, absence, motif d'annulation d'autrui, personne bloquée.
 */
import { ageBracketBounds, ageBracketOf, publicCancelReason, type RefundMode } from '@blowy/domain';
import type { OutingMemberView, OutingView } from '@blowy/api-contract';
import type { OutingFacts, SeatFacts } from './facts.js';
import { countsAsConfirmed, isPending, refundModeOfState, type CancelPreview } from './seat-policy.js';
import { memberPose, poseMomentOf } from './member-pose.js';

/**
 * Où en est le lecteur, d'après l'état de la sortie ET de sa propre place :
 * `PRE_LOCK` = confirmé·e avant la confirmation (pets seulement) ; `LOCKED` = confirmation passée
 * (prénoms, tranches, fiabilité, lieu ; pas de visage) ; `FACES` = à partir de `photoRevealAt`.
 */
export type ViewerPhase = 'INVITED' | 'PRE_LOCK' | 'LOCKED' | 'FACES' | 'CHECKIN' | 'VOTING' | 'AFTER' | 'INACTIVE';

const CHAT_READ_AFTER_CLOSE_MS = 7 * 86_400_000;

export function viewerPhase(o: OutingFacts, mine: SeatFacts, now: Date): ViewerPhase {
  if (o.status === 'CANCELLED') return 'INACTIVE';
  if (isPending(mine.status) && (o.status === 'PROPOSED' || o.status === 'FORMING')) return 'INVITED';
  if (mine.status === 'CONFIRMED' || mine.status === 'CHECKED_IN') {
    if (o.status === 'PROPOSED' || o.status === 'FORMING') return 'PRE_LOCK';
    if (o.status === 'CONFIRMED') return now >= o.photoRevealAt ? 'FACES' : 'LOCKED';
    if (o.status === 'CHECKIN_OPEN') return 'CHECKIN';
  }
  if (o.status === 'DONE' && mine.status === 'ATTENDED') return !o.votesClosedAt && now < o.votesCloseAt ? 'VOTING' : 'AFTER';
  return 'INACTIVE';
}

export interface ViewerContext {
  now: Date;
  /** Blocage dans un sens ou l'autre avec le lecteur. */
  blocked: ReadonlySet<string>;
  /** Liens actifs du lecteur (bande, duo) : « liens seulement » après la clôture. */
  linked: ReadonlySet<string>;
  /** Photos émises pour les seules personnes autorisées (`photoEligible`). */
  photos: ReadonlyMap<string, { mediaId: string; url: string }>;
  cancelPreview?: CancelPreview;
}

/** Personnes dont la photo est visible par le lecteur (révélation simultanée au verrouillage). */
export function photoEligible(viewerId: string, o: OutingFacts, now: Date, linked: ReadonlySet<string>): string[] {
  const mine = o.seats.find((s) => s.userId === viewerId);
  if (!mine) return [];
  const phase = viewerPhase(o, mine, now);
  const others = o.seats.filter((s) => s.userId !== viewerId);
  if (phase === 'FACES' || phase === 'CHECKIN') return others.filter((s) => s.status === 'CONFIRMED' || s.status === 'CHECKED_IN').map((s) => s.userId);
  if (phase === 'VOTING') return others.filter((s) => s.status === 'ATTENDED').map((s) => s.userId);
  if (phase === 'AFTER') return others.filter((s) => s.status === 'ATTENDED' && linked.has(s.userId)).map((s) => s.userId);
  return [];
}

function refundOf(s: SeatFacts): RefundMode {
  return refundModeOfState(s.funding, s.refundState);
}

export function projectOutingFor(viewerId: string, o: OutingFacts, ctx: ViewerContext): OutingView | null {
  const mine = o.seats.find((s) => s.userId === viewerId);
  if (!mine) return null;
  const now = ctx.now;
  const phase = viewerPhase(o, mine, now);
  const others = o.seats.filter((s) => s.userId !== viewerId && !ctx.blocked.has(s.userId));
  const inMyTeam = (s: SeatFacts) => !!mine.teamId && s.teamId === mine.teamId;
  // V5.7 (E32, D-084) : badge « calme » (opt-in) sur le pet, à partir de FORMING (jamais sur l'aperçu d'invitation).
  const calmVisible = o.status !== 'PROPOSED';
  // V5.10 (passe 5) : pose décorative déterministe par membre et par moment (jamais un signal sur la personne).
  const moment = poseMomentOf(phase);
  const base = (s: SeatFacts): OutingMemberView => ({ userId: s.userId, pet: { ...s.person.pet, pose: memberPose(o.id, s.userId, moment) }, threeWords: s.person.threeWords.slice(0, 3) as OutingMemberView['threeWords'], ...(inMyTeam(s) ? { inMyTeam: true as const } : {}), ...(calmVisible && s.person.calmBadge ? { calm: true as const } : {}) });
  const photo = (s: SeatFacts) => {
    const p = ctx.photos.get(s.userId);
    return p ? { photo: p } : {};
  };
  // V5.2 (C.9) : tranche de la grille FIXE, jamais l'âge exact ni une tranche centrée.
  // V5.6 (D-076, E24) : jamais la fiabilité d'autrui — elle n'est visible que par soi (`GET /v1/me/reliability`).
  const identity = (s: SeatFacts) => ({ firstName: s.person.firstName, ageRange: ageBracketOf(s.person.age) });

  let members: OutingMemberView[] = [];
  switch (phase) {
    case 'INVITED':
      // Pets seulement (invités + confirmés) : ni prénom, ni âge, ni photo, ni lieu.
      members = others.filter((s) => isPending(s.status) || countsAsConfirmed(s.status)).map(base);
      break;
    case 'PRE_LOCK':
      // V5.3 B.7 : avant la confirmation, chacun·e n'est vu·e que par son pet (auteur des messages du chat).
      for (const s of others) {
        if (countsAsConfirmed(s.status) || isPending(s.status)) members.push(base(s));
        else if (s.status === 'CANCELLED' && s.confirmedAt) members.push({ ...base(s), notComing: true }); // « X ne pourra pas venir » (pet)
      }
      break;
    case 'LOCKED':
    case 'FACES':
    case 'CHECKIN': {
      const faces = phase !== 'LOCKED';
      for (const s of others) {
        if (s.status === 'CONFIRMED' || s.status === 'CHECKED_IN') {
          members.push({ ...base(s), ...identity(s), ...(faces ? photo(s) : {}), ...(phase === 'CHECKIN' && s.status === 'CHECKED_IN' ? { arrived: true as const } : {}) });
        } else if (s.status === 'CANCELLED' && s.confirmedAt) {
          // « X ne pourra pas venir » — prénom à partir de la confirmation, sans motif, sans financement.
          members.push({ ...base(s), firstName: s.person.firstName, notComing: true });
        }
      }
      break;
    }
    case 'VOTING':
      members = others.filter((s) => s.status === 'ATTENDED').map((s) => ({ ...base(s), ...identity(s), ...photo(s) }));
      break;
    case 'AFTER':
      members = others.filter((s) => s.status === 'ATTENDED' && ctx.linked.has(s.userId)).map((s) => ({ ...base(s), firstName: s.person.firstName, ...photo(s) }));
      break;
    case 'INACTIVE':
      members = [];
  }

  const confirmedCount = o.seats.filter((s) => s.status === 'CONFIRMED' || s.status === 'CHECKED_IN').length;
  const showCount = phase === 'INVITED' || phase === 'PRE_LOCK' || phase === 'LOCKED' || phase === 'FACES' || phase === 'CHECKIN';
  const chatOpen = phase === 'PRE_LOCK' || phase === 'LOCKED' || phase === 'FACES' || phase === 'CHECKIN' || phase === 'VOTING' || (phase === 'AFTER' && now.getTime() < o.votesCloseAt.getTime() + CHAT_READ_AFTER_CLOSE_MS);

  const view: OutingView = {
    id: o.id,
    status: o.status,
    weekKey: o.weekKey,
    neighborhood: { name: o.neighborhoodName },
    startsAt: o.startsAt.toISOString(),
    endsAt: o.endsAt.toISOString(),
    capacity: o.capacity,
    activity: o.activity,
    ...(phase === 'INVITED' ? { preview: previewOf(o) } : {}),
    ...(showCount ? { confirmedCount } : {}),
    mySeat: {
      status: mine.status,
      ...(mine.funding ? { funding: mine.funding } : {}),
      ...(mine.status === 'HELD' && mine.holdExpiresAt ? { holdExpiresAt: mine.holdExpiresAt.toISOString() } : {}),
      ...(mine.status === 'INVITED' ? { acceptDeadline: mine.acceptDeadline.toISOString() } : {}),
      ...(ctx.cancelPreview && (mine.status === 'CONFIRMED' || mine.status === 'HELD') && now < o.startsAt ? { cancelPreview: ctx.cancelPreview } : {}),
    },
    timeline: {
      acceptDeadline: o.acceptDeadline.toISOString(),
      lockAt: o.lockAt.toISOString(),
      photoRevealAt: o.photoRevealAt.toISOString(),
      checkinOpensAt: o.checkinOpensAt.toISOString(),
      checkinClosesAt: o.checkinClosesAt.toISOString(),
      votesCloseAt: o.votesCloseAt.toISOString(),
    },
    // I-O4 : lieu exact seulement à partir du verrouillage et si MA place est confirmée.
    ...((o.status === 'CONFIRMED' || o.status === 'CHECKIN_OPEN') && (mine.status === 'CONFIRMED' || mine.status === 'CHECKED_IN')
      ? {
          venue: {
            name: o.venue.name,
            address: o.venue.address,
            offerLabel: o.venue.offerLabel,
            ...(o.venue.photoUrl ? { photoUrl: o.venue.photoUrl } : {}),
            bookingName: 'Blowy',
            // V5.5 (D-062) : plus de lat/lng (le check-in se fait par le code du chevalet).
          },
        }
      : {}),
    members,
    ...(chatOpen && o.conversationId ? { conversationId: o.conversationId } : {}),
    ...(phase === 'VOTING' ? { votes: { open: true, closesAt: o.votesCloseAt.toISOString() } } : phase === 'AFTER' ? { votes: { open: false, closesAt: o.votesCloseAt.toISOString() } } : {}),
    ...(o.status === 'CANCELLED' && o.cancelReason ? { cancelled: { reason: publicCancelReason(o.cancelReason), refund: refundOf(mine) } } : {}),
    // V5.3 B.7 (T4) : « je connais quelqu'un ici » dès la confirmation (verrouillage, prénoms + tranches + pets visibles).
    ...(o.status === 'CONFIRMED' && mine.status === 'CONFIRMED' && now < o.startsAt ? { knowsSomeoneAvailable: true as const } : {}),
  };
  return view;
}

/** Aperçu anonyme (V5.1 C.10) : taille, âges min–max, genres agrégés, nombre de teams. */
export function previewOf(o: OutingFacts) {
  const active = o.seats.filter((s) => isPending(s.status) || countsAsConfirmed(s.status));
  // V5.2 (C.9) : union des tranches de la grille fixe — jamais un âge exact.
  const brackets = active.map((s) => ageBracketBounds(ageBracketOf(s.person.age)));
  const genders: Partial<Record<'WOMAN' | 'MAN' | 'NON_BINARY' | 'UNDISCLOSED', number>> = {};
  for (const s of active) genders[s.person.gender] = (genders[s.person.gender] ?? 0) + 1;
  const teamSizes = new Map<string, number>();
  for (const s of active) if (s.teamId) teamSizes.set(s.teamId, (teamSizes.get(s.teamId) ?? 0) + 1);
  return {
    size: active.length,
    ageMin: Math.min(...brackets.map((b) => b[0])),
    ageMax: Math.max(...brackets.map((b) => b[1])),
    genders,
    teams: [...teamSizes.values()].filter((n) => n >= 2).length,
  };
}

/**
 * V5.4 (A.1) : la garantie « ≥ 2 compatibles » est appliquée par la composition mais n'est JAMAIS exposée,
 * ni dans le cas positif (D-038) ni dans le cas négatif (l'ancien « sortie entre amis pour toi », dont la
 * présence ou l'absence, croisée avec la composition, désignerait quelqu'un). Aucun projecteur ne la lit.
 */
