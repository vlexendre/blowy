/**
 * Seed V5 (spec-v5 §8.4, concept-v5.1, `design/v5/facts.json`) — TOUTES les identités sont FICTIVES.
 * Paris 11e et Lyon 4e · Croix-Rousse ouverts ; Saint-Denis fermé (87 vérifiés / 120, ouverture
 * estimée mars 2027) avec la team d'amorçage Mehdi + Yacine (2/3) ; lieux et créneaux ; la sortie de
 * la semaine d'Alex (jeudi 19 h 30, Café des Oiseaux, groupe de 5 : Alex + Tom en team, Léa, Malo,
 * Sarah déjà confirmé·es) ; une sortie passée (Alex présent : « 1 sortie sur 1 », 3 souvenirs, bande
 * Inès + Tom) ; un duo (Jade, voie Duo, échange en cours). Instants relatifs à `now` (jeudi suivant).
 */
import type { Db } from '../client.js';
import { sid } from './ids.js';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const TZ = 'Europe/Paris';
const CONSENTS = ['TERMS', 'PRIVACY', 'AI_MODERATION', 'SENSITIVE_PREFERENCES'];
const VERSION = '2026-11';

type Gender = 'WOMAN' | 'MAN' | 'NON_BINARY';
type Species = 'GASTON' | 'PIA' | 'NINO' | 'SUZIE';
type Looking = 'FRIENDS' | 'STORY' | 'BOTH';

/** Décalage (min) du fuseau à un instant, via Intl (changements d'heure compris). */
function offsetMin(ms: number, tz: string): number {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(ms));
  const g = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return (Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute')) - ms) / 60_000;
}
function wall(y: number, m: number, d: number, h: number, mi: number): Date {
  const guess = Date.UTC(y, m - 1, d, h, mi);
  return new Date(guess - offsetMin(guess - offsetMin(guess, TZ) * 60_000, TZ) * 60_000);
}
function civil(ms: number) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' }).formatToParts(new Date(ms));
  const g = (t: string) => p.find((x) => x.type === t)!.value;
  return { y: Number(g('year')), m: Number(g('month')), d: Number(g('day')), wd: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(g('weekday')) + 1 };
}
function isoWeekKey(ms: number): string {
  const c = civil(ms);
  const day = Date.UTC(c.y, c.m - 1, c.d);
  const thursday = new Date(day + (4 - c.wd) * DAY);
  const y = thursday.getUTCFullYear();
  const week = Math.floor((thursday.getTime() - Date.UTC(y, 0, 1)) / (7 * DAY)) + 1;
  return `${y}-W${String(week).padStart(2, '0')}`;
}
/** Prochain jeudi 19 h 30 dont la veille 18 h est encore à venir (≥ 6 h). */
function nextThursday(now: Date): { startsAt: Date; lockAt: Date } {
  for (let i = 0; i < 14; i++) {
    const c = civil(now.getTime() + i * DAY);
    if (c.wd !== 4) continue;
    const startsAt = wall(c.y, c.m, c.d, 19, 30);
    const eve = civil(startsAt.getTime() - DAY);
    const lockAt = wall(eve.y, eve.m, eve.d, 18, 0);
    if (lockAt.getTime() > now.getTime() + 6 * HOUR) return { startsAt, lockAt };
  }
  throw new Error('jeudi introuvable');
}
const birthDateFor = (age: number, now: Date) => new Date(Date.UTC(now.getUTCFullYear() - age, 0, 15));

interface V5Person {
  key: string;
  name: string;
  age: number;
  gender: Gender;
  looking: Looking;
  romance: Gender[];
  pet: { name: string; species: Species; axes: [number, number, number, number]; school: string; sunday: string; passions: string[] };
}

/** Personnes V5 nouvelles (Alex, Tom, Inès, Maya existent déjà dans le seed V4). */
const NEW_PEOPLE: (V5Person & { nb: 'paris' | 'lyon' | 'sd' })[] = [
  { key: 'lea', name: 'Léa', age: 27, gender: 'WOMAN', looking: 'BOTH', romance: ['MAN'], nb: 'paris', pet: { name: 'Suzie', species: 'SUZIE', axes: [0.5, -0.1, 0.4, 0.4], school: 'BEAUX_ARTS', sunday: 'BRUNCH', passions: ['MUSIQUE', 'ART'] } },
  { key: 'malo', name: 'Malo', age: 30, gender: 'MAN', looking: 'FRIENDS', romance: [], nb: 'paris', pet: { name: 'Gaston', species: 'GASTON', axes: [0.4, -0.2, 0.3, 0.5], school: 'AUTODIDACTE', sunday: 'BRUNCH', passions: ['JEUX', 'CUISINE'] } },
  { key: 'sarah', name: 'Sarah', age: 26, gender: 'WOMAN', looking: 'BOTH', romance: ['MAN'], nb: 'paris', pet: { name: 'Pia', species: 'PIA', axes: [0.6, -0.2, 0.5, 0.6], school: 'CIRQUE', sunday: 'BRUNCH', passions: ['MUSIQUE', 'VOYAGE'] } },
  { key: 'jade', name: 'Jade', age: 26, gender: 'WOMAN', looking: 'STORY', romance: ['MAN'], nb: 'paris', pet: { name: 'Caramel', species: 'NINO', axes: [0.3, 0.1, 0.4, 0.2], school: 'BEAUX_ARTS', sunday: 'MUSEE', passions: ['ART', 'LECTURE'] } },
  { key: 'nils', name: 'Nils', age: 30, gender: 'MAN', looking: 'FRIENDS', romance: [], nb: 'paris', pet: { name: 'Biscuit', species: 'GASTON', axes: [0.2, -0.3, 0.1, 0.4], school: 'POLYTECHNIQUE', sunday: 'RANDO', passions: ['SPORT', 'JEUX'] } },
  { key: 'camille', name: 'Camille', age: 31, gender: 'WOMAN', looking: 'FRIENDS', romance: [], nb: 'lyon', pet: { name: 'Pompon', species: 'SUZIE', axes: [-0.1, 0.4, 0.2, 0.1], school: 'AUTODIDACTE', sunday: 'MUSEE', passions: ['LECTURE', 'CINEMA'] } },
  { key: 'mehdi', name: 'Mehdi', age: 27, gender: 'MAN', looking: 'FRIENDS', romance: [], nb: 'sd', pet: { name: 'Tonnerre', species: 'NINO', axes: [0.3, -0.5, 0.0, 0.6], school: 'AUTODIDACTE', sunday: 'RANDO', passions: ['SPORT', 'MUSIQUE'] } },
  { key: 'yacine', name: 'Yacine', age: 28, gender: 'MAN', looking: 'BOTH', romance: ['WOMAN'], nb: 'sd', pet: { name: 'Mistral', species: 'GASTON', axes: [0.2, -0.4, 0.1, 0.5], school: 'POLYTECHNIQUE', sunday: 'RANDO', passions: ['SPORT', 'JEUX'] } },
];

export async function seedV5(db: Db, now: Date): Promise<{ accounts: string[]; outingId: string }> {
  // V5.5 (D-058) : astreinte mutualisée (fuseau Europe/Paris), 9 h → 2 h chaque jour sur 9 semaines (démo).
  const day0 = Math.floor(now.getTime() / 86_400_000) - 7;
  await db.safetyOnCallShift.createMany({
    data: Array.from({ length: 63 }, (_, i) => ({ timezone: 'Europe/Paris', startsAt: new Date((day0 + i) * 86_400_000 + 8 * 3_600_000), endsAt: new Date((day0 + i + 1) * 86_400_000 + 1 * 3_600_000), teamLabel: 'Astreinte Blowy (démo)' })),
  });
  const uid = (k: string) => sid(`user:${k}`);
  const pid = (k: string) => sid(`pet:${k}`);

  // ------------------------------------------------------------ villes et quartiers
  const parisZone = sid('zone:paris11');
  await db.zone.update({ where: { id: parisZone }, data: { name: 'Paris' } });
  await db.zone.createMany({ data: [{ id: sid('zone:lyon'), code: 'LYON', name: 'Lyon', timezone: TZ }, { id: sid('zone:saint-denis'), code: 'SAINT_DENIS', name: 'Saint-Denis', timezone: TZ }] });
  const NB = { paris: sid('nb:paris-11'), lyon: sid('nb:lyon-4'), sd: sid('nb:saint-denis') };
  await db.neighborhood.createMany({
    data: [
      { id: NB.paris, slug: 'paris-11', name: 'Paris 11e', city: 'Paris', cityZoneId: parisZone, timezone: TZ, status: 'LIVE', densityThreshold: 120, launchedAt: new Date(now.getTime() - 60 * DAY) },
      { id: NB.lyon, slug: 'lyon-4-croix-rousse', name: 'Lyon 4e · Croix-Rousse', city: 'Lyon', cityZoneId: sid('zone:lyon'), timezone: TZ, status: 'LIVE', densityThreshold: 120, launchedAt: new Date(now.getTime() - 20 * DAY) },
      { id: NB.sd, slug: 'saint-denis', name: 'Saint-Denis', city: 'Saint-Denis', cityZoneId: sid('zone:saint-denis'), timezone: TZ, status: 'WAITLIST', densityThreshold: 120, estimatedLaunchAt: new Date(Date.UTC(2027, 2, 15, 9)) },
    ],
  });
  const tpl = (nb: string, isoWeekday: number, h: number, mi: number, activity: 'DRINK_COFFEE' | 'BRUNCH' | 'CLIMBING' | 'GAMES') => ({ id: sid(`tpl:${nb}:${isoWeekday}:${h}`), neighborhoodId: nb, isoWeekday, localMinute: h * 60 + mi, activity });
  await db.neighborhoodSlotTemplate.createMany({
    data: [tpl(NB.paris, 2, 19, 30, 'DRINK_COFFEE'), tpl(NB.paris, 4, 19, 30, 'GAMES'), tpl(NB.paris, 6, 15, 0, 'CLIMBING'), tpl(NB.paris, 7, 11, 0, 'BRUNCH'), tpl(NB.lyon, 4, 19, 30, 'DRINK_COFFEE'), tpl(NB.lyon, 7, 11, 0, 'BRUNCH'), tpl(NB.sd, 4, 19, 30, 'DRINK_COFFEE')],
  });
  const venue = (key: string, nb: string, name: string, addressLine: string, postalCode: string, city: string, lat: number, lng: number, offerKey: string, activities: ('DRINK_COFFEE' | 'BRUNCH' | 'CLIMBING' | 'GAMES')[]) => ({
    id: sid(`venue:${key}`),
    neighborhoodId: nb,
    name,
    addressLine,
    postalCode,
    city,
    lat,
    lng,
    offerKey,
    activities,
    accessibilityTags: ['STEP_FREE'],
    checkinSecretRef: `seed-${key}`,
    staffContact: 'Contact lieu (fictif)',
  });
  await db.venue.createMany({
    data: [
      venue('cafe-des-oiseaux', NB.paris, 'Café des Oiseaux', '12 rue Oberkampf', '75011', 'Paris', 48.8649, 2.3707, 'venue.offer.table_reserved', ['GAMES', 'DRINK_COFFEE']),
      venue('comptoir-gabriel', NB.paris, 'Le Comptoir Gabriel', '30 rue de la Roquette', '75011', 'Paris', 48.8551, 2.3735, 'venue.offer.quiet_corner', ['BRUNCH', 'DRINK_COFFEE']),
      venue('bloc-oberkampf', NB.paris, 'Bloc Oberkampf', '88 rue Saint-Maur', '75011', 'Paris', 48.8662, 2.3797, 'venue.offer.activity_spot', ['CLIMBING']),
      venue('bistrot-croix-rousse', NB.lyon, 'Le Bistrot de la Croix-Rousse', '5 place de la Croix-Rousse', '69004', 'Lyon', 45.7745, 4.8316, 'venue.offer.table_reserved', ['DRINK_COFFEE', 'BRUNCH']),
      venue('cafe-basilique', NB.sd, 'Café de la Basilique', '2 rue de la République', '93200', 'Saint-Denis', 48.9356, 2.3594, 'venue.offer.table_reserved', ['DRINK_COFFEE']),
    ],
  });

  // ------------------------------------------------------------ personnes V5 (nouvelles)
  for (const p of NEW_PEOPLE) {
    const id = uid(p.key);
    await db.user.create({
      data: {
        id,
        email: `${p.key}@local.blowy.invalid`,
        birthDate: birthDateFor(p.age, now),
        timezone: TZ,
        zoneId: p.nb === 'paris' ? parisZone : p.nb === 'lyon' ? sid('zone:lyon') : sid('zone:saint-denis'),
        neighborhoodId: NB[p.nb],
        isFictional: true,
        onboardedAt: new Date(now.getTime() - 15 * DAY),
        lastActiveAt: new Date(now.getTime() - HOUR),
        createdAt: new Date(now.getTime() - 20 * DAY),
        authIdentities: { create: { provider: 'LOCAL', subject: p.key, signInProvider: 'local', email: `${p.key}@local.blowy.invalid` } },
        profile: { create: { displayName: p.name, gender: p.gender } },
        privacySettings: { create: { discreetModeChosenAt: new Date('2026-11-01T09:00:00Z') } },
        matchPreferences: { create: { ageMin: 18, ageMax: 45, seekingGenders: p.romance, intention: p.looking === 'FRIENDS' ? 'FRIENDS_GROUP' : 'OPEN_TO_MORE', lookingFor: p.looking, meetingMode: p.key === 'jade' ? 'DUO' : 'BOTH', romanceGenders: p.romance, storySeriousness: p.looking === 'FRIENDS' ? null : 'SEE_HOW_IT_GOES' } },
        outingPreferences: { create: { groupAgeMin: Math.max(18, p.age - 5), groupAgeMax: p.age + 5, activities: [], maxTravelMinutes: 30 } },
        acceptableNeighborhoods: { create: { neighborhoodId: NB[p.nb] } },
        processingConsents: { create: CONSENTS.map((purpose) => ({ purpose, version: VERSION, granted: true })) },
        verificationSessions: { create: { kind: 'SELFIE_QUALITY', provenance: 'LOCAL_DEMO', status: 'VERIFIED', providerRef: `seed:${p.key}`, verifiedAt: now, expiresAt: new Date(now.getTime() + 365 * DAY) } },
        ...(p.nb !== 'paris' && p.nb !== 'lyon' ? { waitlistEntry: { create: { neighborhoodId: NB[p.nb], joinedAt: new Date(now.getTime() - 10 * DAY) } } } : {}),
      },
    });
    await db.pet.create({
      data: {
        id: pid(p.key),
        kind: 'PRIMARY',
        species: p.pet.species,
        stage: 'BABY',
        name: p.pet.name,
        primaryOwnerId: id,
        engineVersion: 'pet-engine@seed',
        ownerships: { create: { userId: id, role: 'OWNER' } },
        vision: { create: { kindMischief: Math.round(p.pet.axes[0] * 1000), sportyContemplative: Math.round(p.pet.axes[1] * 1000), scienceArt: Math.round(p.pet.axes[2] * 1000), homeAdventure: Math.round(p.pet.axes[3] * 1000), school: p.pet.school, sunday: p.pet.sunday, passions: p.pet.passions, limit: 'MENTIR', contentVersion: 'content-seed' } },
        state: { create: { satiety: 80, energy: 80, mood: 80, health: 100, advancedTo: now, engineVersion: 'pet-engine@seed', tuningVersion: 'seed', engineState: {}, rngSeed: sid(`rng:${p.key}`).replace(/-/g, '') } },
      },
    });
  }

  // Personnes V4 réutilisées en V5 (Alex, Tom, Inès, Maya) : quartier, intentions, préférences.
  const v4 = [
    { key: 'alex', looking: 'BOTH' as Looking, romance: ['WOMAN'] as Gender[], groupAge: [24, 32] },
    { key: 'tom', looking: 'FRIENDS' as Looking, romance: [] as Gender[], groupAge: [24, 36] },
    { key: 'ines', looking: 'FRIENDS' as Looking, romance: [] as Gender[], groupAge: [21, 32] },
    { key: 'maya', looking: 'FRIENDS' as Looking, romance: [] as Gender[], groupAge: [20, 32] },
  ];
  for (const p of v4) {
    await db.user.update({
      where: { id: uid(p.key) },
      data: {
        neighborhoodId: NB.paris,
        matchPreferences: { update: { lookingFor: p.looking, meetingMode: 'BOTH', romanceGenders: p.romance, storySeriousness: p.looking === 'FRIENDS' ? null : 'SEE_HOW_IT_GOES' } },
        outingPreferences: { create: { groupAgeMin: p.groupAge[0]!, groupAgeMax: p.groupAge[1]!, activities: [], maxTravelMinutes: 30 } },
        acceptableNeighborhoods: { create: { neighborhoodId: NB.paris } },
        processingConsents: { create: { purpose: 'SENSITIVE_PREFERENCES', version: VERSION, granted: true } },
      },
    });
  }

  // Photos de profil « publiées » (placeholders sans fichier : la démo locale n'embarque aucun visage).
  for (const k of ['alex', 'tom', 'ines', 'maya', 'lea', 'malo', 'sarah', 'jade', 'nils', 'camille', 'mehdi', 'yacine']) {
    await db.mediaAsset.create({ data: { id: sid(`media:photo:${k}`), ownerUserId: uid(k), purpose: 'PROFILE_PHOTO', status: 'READY', storageKey: `seed/profile/${k}.jpg`, mimeType: 'image/jpeg', retentionClass: 'PROFILE_PHOTO', finalizedAt: new Date(now.getTime() - 14 * DAY) } });
  }

  // Saint-Denis : 87 vérifiés en attente (vrais comptes fictifs, jamais un compteur gonflé).
  const waiting = Array.from({ length: 85 }, (_, i) => `sd.${String(i + 1).padStart(2, '0')}`);
  await db.user.createMany({ data: waiting.map((k, i) => ({ id: uid(k), email: `${k}@local.blowy.invalid`, birthDate: birthDateFor(22 + (i % 15), now), timezone: TZ, zoneId: sid('zone:saint-denis'), neighborhoodId: NB.sd, isFictional: true, onboardedAt: new Date(now.getTime() - 5 * DAY), createdAt: new Date(now.getTime() - 6 * DAY) })) });
  await db.profile.createMany({ data: waiting.map((k, i) => ({ userId: uid(k), displayName: `Voisin·e ${i + 1}`, gender: (['WOMAN', 'MAN', 'NON_BINARY'] as const)[i % 3] })) });
  await db.verificationSession.createMany({ data: waiting.map((k) => ({ userId: uid(k), kind: 'SELFIE_QUALITY' as const, provenance: 'LOCAL_DEMO' as const, status: 'VERIFIED' as const, providerRef: `seed:${k}`, verifiedAt: now, expiresAt: new Date(now.getTime() + 365 * DAY) })) });
  await db.waitlistEntry.createMany({ data: waiting.map((k) => ({ userId: uid(k), neighborhoodId: NB.sd, joinedAt: new Date(now.getTime() - 5 * DAY) })) });

  // ------------------------------------------------------------ teams
  await db.team.create({ data: { id: sid('team:alex-tom'), cityZoneId: parisZone, createdById: uid('alex'), status: 'ACTIVE', inviteCode: 'alextom2026x', createdAt: new Date(now.getTime() - 9 * DAY) } });
  await db.teamMember.createMany({ data: ['alex', 'tom'].map((k) => ({ teamId: sid('team:alex-tom'), userId: uid(k), joinedAt: new Date(now.getTime() - 9 * DAY) })) });
  await db.team.create({ data: { id: sid('team:mehdi-yacine'), cityZoneId: sid('zone:saint-denis'), createdById: uid('mehdi'), status: 'ACTIVE', inviteCode: 'mehdiyacine9', createdAt: new Date(now.getTime() - 4 * DAY) } });
  await db.teamMember.createMany({ data: ['mehdi', 'yacine'].map((k) => ({ teamId: sid('team:mehdi-yacine'), userId: uid(k), joinedAt: new Date(now.getTime() - 4 * DAY) })) });

  // ------------------------------------------------------------ sortie passée (DONE, votes clos)
  const { startsAt, lockAt } = nextThursday(now);
  const prevStart = new Date(startsAt.getTime() - 7 * DAY);
  const prevId = sid('outing:prev');
  const prevSlot = sid('slot:prev');
  const instants = (s: Date, lock: Date, composedAt: Date) => ({
    startsAt: s,
    endsAt: new Date(s.getTime() + 2 * HOUR),
    composedAt,
    acceptDeadline: new Date(Math.min(composedAt.getTime() + 24 * HOUR, lock.getTime())),
    lockAt: lock,
    // V5.2 (C.8) : visages 3 h avant le début ; lieu la veille 18 h.
    photoRevealAt: new Date(s.getTime() - 3 * HOUR),
    checkinOpensAt: new Date(s.getTime() - 30 * 60_000),
    checkinClosesAt: new Date(s.getTime() + 90 * 60_000),
    votesCloseAt: new Date(s.getTime() + 90 * 60_000 + 72 * HOUR),
  });
  await db.compositionRun.create({ data: { id: sid('run:seed'), scopeKey: `zone:${parisZone}`, weekKey: 'seed', kind: 'WEEKLY', status: 'SUCCEEDED', algoVersion: 'seed', tuningVersion: 'seed', seed: 'seed', startedAt: now, finishedAt: now, stats: { seeded: true } } });
  await db.venueSlot.create({ data: { id: prevSlot, venueId: sid('venue:comptoir-gabriel'), startsAt: prevStart, activity: 'DRINK_COFFEE', capacityOutings: 1, reservedOutings: 1 } });
  const prevI = instants(prevStart, new Date(lockAt.getTime() - 7 * DAY), new Date(prevStart.getTime() - 3 * DAY));
  const prevWeek = isoWeekKey(prevStart.getTime());
  await db.outing.create({ data: { id: prevId, neighborhoodId: NB.paris, weekKey: prevWeek, venueSlotId: prevSlot, venueId: sid('venue:comptoir-gabriel'), activity: 'DRINK_COFFEE', status: 'DONE', capacity: 5, ...prevI, votesCloseAt: new Date(Math.min(prevI.votesCloseAt.getTime(), now.getTime() - HOUR)), votesClosedAt: new Date(now.getTime() - HOUR), compositionRunId: sid('run:seed'), tuningVersion: 'seed', algoVersion: 'seed' } });
  for (const k of ['alex', 'tom', 'ines', 'maya', 'nils']) {
    await db.outingSeat.create({ data: { id: sid(`seat:prev:${k}`), outingId: prevId, userId: uid(k), weekKey: prevWeek, teamId: k === 'alex' || k === 'tom' ? sid('team:alex-tom') : null, status: 'ATTENDED', funding: 'FREE_FIRST', acceptDeadline: prevI.acceptDeadline, invitedAt: prevI.composedAt, confirmedAt: prevI.composedAt, checkedInAt: prevStart } });
    await db.outingCheckIn.create({ data: { seatId: sid(`seat:prev:${k}`), method: 'GEO', createdAt: prevStart } });
    await db.reliabilityStat.create({ data: { userId: uid(k), attended: 1, updatedAt: now } });
    await db.reliabilityEvent.create({ data: { userId: uid(k), reason: 'OUTING_ATTENDED', delta: 0, episodeKey: sid(`seat:prev:${k}`) } });
  }
  await db.conversation.create({ data: { id: sid('conv:outing:prev'), kind: 'OUTING', outingId: prevId, closedAt: new Date(now.getTime() - HOUR), members: { create: ['alex', 'tom', 'ines', 'maya', 'nils'].map((k) => ({ userId: uid(k), joinedAt: prevI.composedAt })) } } });

  // Bande d'Alex : Inès (accord « ami·e » à la sortie passée) + Tom (team, PLUS_ONE). Amitiés V4 reconverties.
  const pair = (a: string, b: string) => [uid(a), uid(b)].sort() as [string, string];
  const band = async (other: string, origin: 'OUTING_VOTE' | 'PLUS_ONE') => {
    const [lo, hi] = pair('alex', other);
    const f = await db.friendship.update({ where: { userLowId_userHighId: { userLowId: lo, userHighId: hi } }, data: { origin, sourceOutingId: prevId, acceptedAt: new Date(now.getTime() - HOUR) } });
    await db.conversation.create({ data: { id: sid(`conv:band:alex-${other}`), kind: 'BAND', friendshipId: f.id, members: { create: [lo, hi].map((userId) => ({ userId, joinedAt: now })) } } });
    if (origin === 'OUTING_VOTE') await db.connectionReveal.create({ data: { sourceKind: 'OUTING', sourceId: prevId, userLowId: lo, userHighId: hi, result: 'FRIEND', revealedAt: new Date(now.getTime() - HOUR), friendshipId: f.id } });
  };
  await band('ines', 'OUTING_VOTE');
  await band('tom', 'PLUS_ONE');

  // Souvenirs d'Alex (3) et état V5 du pet (moteur `reduceV5` : mêmes compteurs).
  const alexPet = pid('alex');
  await db.petMemory.createMany({
    data: [
      { petId: alexPet, kind: 'HATCHED', refType: 'Pet', refId: alexPet, dedupKey: `HATCHED:${alexPet}:${alexPet}`, data: { species: 'NINO' }, createdAt: new Date(now.getTime() - 20 * DAY) },
      { petId: alexPet, kind: 'OUTING_LIVED', refType: 'Outing', refId: prevId, dedupKey: `OUTING_LIVED:${prevId}:${alexPet}`, data: { weekKey: prevWeek, venueName: 'Le Comptoir Gabriel', pets: 5 }, createdAt: prevI.checkinClosesAt },
      { petId: alexPet, kind: 'BAND_NEW_MEMBER', refType: 'Friendship', refId: sid('seed:band:alex-ines'), dedupKey: `BAND_NEW_MEMBER:${sid('seed:band:alex-ines')}:${alexPet}`, data: { petName: 'Gaston', species: 'GASTON' }, createdAt: new Date(now.getTime() - HOUR) },
    ],
  });
  await db.petAccessory.createMany({ data: ['scarf_red', 'badge_first_outing', 'bracelet_friendship'].map((accessoryId) => ({ petId: alexPet, accessoryId, source: 'MEMORY' as const, unlockedAt: new Date(now.getTime() - HOUR) })) });
  await db.petState.update({
    where: { petId: alexPet },
    data: { engineStateV5: { id: alexPet, species: 'NINO', stage: 'YOUNG', xpMilli: 400_000, memoryCount: 3, memoriesByKind: { HATCHED: 1, OUTING_LIVED: 1, BAND_NEW_MEMBER: 1 }, attendedCount: 1, unlockedAccessories: ['scarf_red', 'badge_first_outing', 'bracelet_friendship'], equipped: ['scarf_red'], reaction: null, recentEventIds: [] } },
  });

  // ------------------------------------------------------------ la sortie de la semaine d'Alex
  const outingId = sid('outing:week');
  const slotId = sid('slot:week');
  const weekKey = isoWeekKey(startsAt.getTime());
  const weekI = instants(startsAt, lockAt, new Date(now.getTime() - HOUR));
  await db.venueSlot.create({ data: { id: slotId, venueId: sid('venue:cafe-des-oiseaux'), startsAt, activity: 'GAMES', capacityOutings: 1, reservedOutings: 1 } });
  await db.outing.create({ data: { id: outingId, neighborhoodId: NB.paris, weekKey, venueSlotId: slotId, venueId: sid('venue:cafe-des-oiseaux'), activity: 'GAMES', status: 'PROPOSED', capacity: 5, ...weekI, compositionRunId: sid('run:seed'), tuningVersion: 'seed', algoVersion: 'seed' } });
  for (const k of ['alex', 'tom', 'lea', 'malo', 'sarah']) {
    const confirmed = ['lea', 'malo', 'sarah'].includes(k);
    await db.outingRequest.create({ data: { userId: uid(k), neighborhoodId: NB.paris, weekKey, slotStartsAt: [startsAt], teamId: k === 'alex' || k === 'tom' ? sid('team:alex-tom') : null, status: 'PLACED', createdAt: new Date(now.getTime() - 30 * HOUR) } });
    await db.outingSeat.create({
      data: { id: sid(`seat:week:${k}`), outingId, userId: uid(k), weekKey, teamId: k === 'alex' || k === 'tom' ? sid('team:alex-tom') : null, status: confirmed ? 'CONFIRMED' : 'INVITED', funding: confirmed ? 'FREE_FIRST' : null, acceptDeadline: weekI.acceptDeadline, invitedAt: weekI.composedAt, confirmedAt: confirmed ? weekI.composedAt : null, respondedAt: confirmed ? weekI.composedAt : null },
    });
  }

  // ------------------------------------------------------------ duo (voie Duo, T5) : Alex ↔ Jade, échange en cours
  const [jlo, jhi] = pair('alex', 'jade');
  await db.duo.create({ data: { id: sid('duo:alex-jade'), userLowId: jlo, userHighId: jhi, origin: 'LANE', status: 'EXCHANGE', exchangeEndsAt: new Date(now.getTime() + 40 * HOUR), dateDeadline: new Date(now.getTime() + 6 * DAY), messagesLow: 1, messagesHigh: 1 } });
  await db.conversation.create({ data: { id: sid('conv:duo:alex-jade'), kind: 'DUO', duoId: sid('duo:alex-jade'), members: { create: [jlo, jhi].map((userId) => ({ userId, joinedAt: now })) } } });

  return { accounts: ['alex', 'tom', 'lea', 'malo', 'sarah', 'ines', 'maya', 'nils', 'jade', 'camille', 'mehdi', 'yacine'], outingId };
}
