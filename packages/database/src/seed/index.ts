/**
 * Seed local déterministe et rejouable (§20). TOUTES les identités sont FICTIVES (isFictional=true).
 * Refusé si BLOWY_ENV=production (ou staging). Réinitialise d'abord les tables (local/test seulement).
 *
 * Connexion locale (LocalAuthProvider) : credential = clé ci-dessous (ex. "alex").
 */
import { DEFAULT_TUNING } from '@blowy/tuning';
import { createDb, type Db } from '../client.js';
import { truncateAll } from '../reset.js';
import { sid } from './ids.js';
import { seedV5 } from './v5.js';

const env = process.env.BLOWY_ENV ?? 'local';
if (env === 'production' || env === 'staging') {
  console.error(`Seed refusé : BLOWY_ENV=${env}. Aucune donnée fictive hors local/test.`);
  process.exit(1);
}

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const TZ = 'Europe/Paris';
const CONSENT_VERSION = '2026-11';
const ENGINE_VERSION = 'pet-engine@seed';
const TUNING_VERSION = DEFAULT_TUNING.version;

type Species = 'GASTON' | 'PIA' | 'NINO' | 'SUZIE';
type Gender = 'WOMAN' | 'MAN' | 'NON_BINARY' | 'UNDISCLOSED';
interface Person {
  key: string;
  name: string;
  age: number;
  gender: Gender;
  seeking: Gender[];
  zone: 'PARIS_11' | 'CAMPUS_VIDE' | null;
  pet?: { name: string; species: Species; axes: [number, number, number, number]; school: string; sunday: string; passions: string[]; limit: string };
  verified?: boolean;
  onboarded?: boolean;
  intention?: 'FRIENDS_ONE' | 'FRIENDS_GROUP' | 'OPEN_TO_MORE' | 'LET_IT_HAPPEN';
}

const PEOPLE: Person[] = [
  { key: 'alex', name: 'Alex', age: 28, gender: 'MAN', seeking: ['WOMAN'], zone: 'PARIS_11', intention: 'OPEN_TO_MORE', pet: { name: 'Nino', species: 'NINO', axes: [0.6, -0.2, 0.4, 0.5], school: 'AUTODIDACTE', sunday: 'BRUNCH', passions: ['MUSIQUE', 'CUISINE', 'VOYAGE'], limit: 'GHOSTER' } },
  { key: 'l', name: 'L.', age: 27, gender: 'WOMAN', seeking: ['MAN'], zone: 'PARIS_11', intention: 'LET_IT_HAPPEN', pet: { name: 'Suzie', species: 'SUZIE', axes: [-0.4, 0.3, 0.6, 0.2], school: 'BEAUX_ARTS', sunday: 'MUSEE', passions: ['ART', 'MUSIQUE', 'LECTURE'], limit: 'MENTIR' } },
  { key: 'm', name: 'M.', age: 30, gender: 'MAN', seeking: ['WOMAN'], zone: 'PARIS_11', intention: 'OPEN_TO_MORE', pet: { name: 'Gaston', species: 'GASTON', axes: [-0.6, 0.7, -0.3, -0.5], school: 'POLYTECHNIQUE', sunday: 'CANAPE', passions: ['JEUX', 'CINEMA'], limit: 'RETARD' } },
  { key: 's', name: 'S.', age: 26, gender: 'WOMAN', seeking: ['MAN'], zone: 'PARIS_11', intention: 'OPEN_TO_MORE', pet: { name: 'Pia', species: 'PIA', axes: [0.2, -0.6, 0.1, 0.8], school: 'CIRQUE', sunday: 'RANDO', passions: ['SPORT', 'NATURE', 'DANSE'], limit: 'JUGER' } },
  { key: 'ines', name: 'Inès', age: 25, gender: 'WOMAN', seeking: [], zone: 'PARIS_11', intention: 'FRIENDS_GROUP', pet: { name: 'Gaston', species: 'GASTON', axes: [-0.2, 0.1, 0.3, -0.1], school: 'BEAUX_ARTS', sunday: 'BRUNCH', passions: ['CUISINE', 'ART'], limit: 'MENTIR' } },
  { key: 'tom', name: 'Tom', age: 29, gender: 'MAN', seeking: [], zone: 'PARIS_11', intention: 'FRIENDS_GROUP', pet: { name: 'Nino', species: 'NINO', axes: [0.5, -0.4, -0.5, 0.3], school: 'POLYTECHNIQUE', sunday: 'RANDO', passions: ['SPORT', 'JEUX'], limit: 'RETARD' } },
  { key: 'maya', name: 'Maya', age: 24, gender: 'WOMAN', seeking: [], zone: 'PARIS_11', intention: 'FRIENDS_ONE', pet: { name: 'Nino', species: 'NINO', axes: [0.1, 0.5, 0.7, 0.0], school: 'AUTODIDACTE', sunday: 'MUSEE', passions: ['LECTURE', 'CINEMA'], limit: 'JUGER' } },
  // Adultes de test (matchables, sans relation) — démonstration d'une proposition.
  { key: 'test.a', name: 'Test A', age: 31, gender: 'WOMAN', seeking: ['MAN'], zone: 'PARIS_11', intention: 'LET_IT_HAPPEN', pet: { name: 'Nino', species: 'NINO', axes: [0.3, 0.0, 0.2, 0.4], school: 'AUTODIDACTE', sunday: 'BRUNCH', passions: ['MUSIQUE', 'VOYAGE'], limit: 'GHOSTER' } },
  { key: 'test.b', name: 'Test B', age: 22, gender: 'NON_BINARY', seeking: [], zone: 'PARIS_11', intention: 'FRIENDS_ONE', verified: false, pet: { name: 'Gaston', species: 'GASTON', axes: [0, 0, 0, 0], school: 'CIRQUE', sunday: 'CANAPE', passions: ['JEUX'], limit: 'RETARD' } },
  // Parents du bébé (relation emménagée Plus, œuf éclos).
  { key: 'test.c', name: 'Test C', age: 33, gender: 'WOMAN', seeking: ['MAN'], zone: 'PARIS_11', intention: 'OPEN_TO_MORE', pet: { name: 'Pia', species: 'PIA', axes: [0.4, -0.1, 0.2, 0.6], school: 'CIRQUE', sunday: 'RANDO', passions: ['NATURE', 'VOYAGE'], limit: 'GHOSTER' } },
  { key: 'test.d', name: 'Test D', age: 34, gender: 'MAN', seeking: ['WOMAN'], zone: 'PARIS_11', intention: 'OPEN_TO_MORE', pet: { name: 'Gaston', species: 'GASTON', axes: [-0.3, 0.4, 0.1, 0.2], school: 'POLYTECHNIQUE', sunday: 'RANDO', passions: ['NATURE', 'CUISINE'], limit: 'MENTIR' } },
  // Zone vide : utilisateur seul sur son campus (attente honnête).
  { key: 'solo', name: 'Solo', age: 21, gender: 'UNDISCLOSED', seeking: [], zone: 'CAMPUS_VIDE', intention: 'LET_IT_HAPPEN', pet: { name: 'Nino', species: 'NINO', axes: [0, 0.2, 0.1, -0.2], school: 'AUTODIDACTE', sunday: 'CANAPE', passions: ['LECTURE'], limit: 'JUGER' } },
];

const STAFF = ['support', 'moderator', 'trust_lead', 'content_manager', 'finance', 'analyst', 'admin'] as const;

function birthDateFor(age: number, now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear() - age, 0, 15));
}

async function seed(db: Db, now: Date): Promise<void> {
  await truncateAll(db, env);
  const uid = (k: string) => sid(`user:${k}`);
  const pid = (k: string) => sid(`pet:${k}`);

  await db.zone.createMany({
    data: [
      { id: sid('zone:paris11'), code: 'PARIS_11', name: 'Paris 11e (démo)', timezone: TZ },
      { id: sid('zone:campus'), code: 'CAMPUS_VIDE', name: 'Campus vide (démo)', timezone: TZ },
    ],
  });
  const zoneId = (z: Person['zone']) => (z === 'PARIS_11' ? sid('zone:paris11') : z === 'CAMPUS_VIDE' ? sid('zone:campus') : null);

  // --- Comptes, profils, préférences, consentements, vérification démo, pets
  for (const p of PEOPLE) {
    const id = uid(p.key);
    await db.user.create({
      data: {
        id,
        email: `${p.key}@local.blowy.invalid`,
        emailVerified: false,
        birthDate: birthDateFor(p.age, now),
        timezone: TZ,
        zoneId: zoneId(p.zone),
        isFictional: true,
        onboardedAt: p.onboarded === false ? null : new Date(now.getTime() - 20 * DAY),
        lastActiveAt: new Date(now.getTime() - HOUR),
        createdAt: new Date(now.getTime() - 30 * DAY),
        authIdentities: { create: { provider: 'LOCAL', subject: p.key, signInProvider: 'local', email: `${p.key}@local.blowy.invalid` } },
        profile: { create: { displayName: p.name, gender: p.gender, publicSlug: `demo-${p.key.replace('.', '-')}` } },
        privacySettings: { create: { discreetModeChosenAt: new Date('2026-11-01T09:00:00Z') } },
        matchPreferences: {
          create: { ageMin: 18, ageMax: 40, maxDistanceKm: 5, seekingGenders: p.seeking, intention: p.intention ?? 'LET_IT_HAPPEN', areaCellLat: 48.8589, areaCellLng: 2.3800, areaPrecisionM: 500 },
        },
        processingConsents: { create: ['TERMS', 'PRIVACY', 'AI_MODERATION'].map((purpose) => ({ purpose, version: CONSENT_VERSION, granted: true })) },
        wallet: { create: { id: sid(`wallet:${p.key}`), balance: 0 } },
        streak: { create: { timeZone: TZ } },
      },
    });
    if (p.verified !== false) {
      await db.verificationSession.create({
        data: { userId: id, kind: 'SELFIE_QUALITY', provenance: 'LOCAL_DEMO', status: 'VERIFIED', providerRef: `seed:${p.key}`, verifiedAt: now, expiresAt: new Date(now.getTime() + 365 * DAY) },
      });
    }
    if (p.pet) {
      const g = DEFAULT_TUNING.gauges.initial;
      await db.pet.create({
        data: {
          id: pid(p.key),
          kind: 'PRIMARY',
          species: p.pet.species,
          stage: 'YOUNG',
          name: p.pet.name,
          primaryOwnerId: id,
          petXpMilli: 400_000,
          engineVersion: ENGINE_VERSION,
          ownerships: { create: { userId: id, role: 'OWNER' } },
          vision: {
            create: {
              kindMischief: Math.round(p.pet.axes[0] * 1000),
              sportyContemplative: Math.round(p.pet.axes[1] * 1000),
              scienceArt: Math.round(p.pet.axes[2] * 1000),
              homeAdventure: Math.round(p.pet.axes[3] * 1000),
              school: p.pet.school,
              sunday: p.pet.sunday,
              passions: p.pet.passions,
              limit: p.pet.limit,
              contentVersion: 'content-seed',
            },
          },
          state: { create: { ...g, advancedTo: now, engineVersion: ENGINE_VERSION, tuningVersion: TUNING_VERSION, engineState: {}, rngSeed: sid(`rng:${p.key}`).replace(/-/g, '') } },
          appearance: { create: {} },
          location: { create: { kind: 'HOME', since: now } },
        },
      });
    }
  }

  // --- Comptes staff (un par rôle), fictifs, MFA à enrôler via l'admin (agent F)
  for (const role of STAFF) {
    const key = `staff.${role}`;
    await db.user.create({
      data: {
        id: uid(key),
        email: `${key}@local.blowy.invalid`,
        isFictional: true,
        timezone: TZ,
        authIdentities: { create: { provider: 'LOCAL', subject: key, signInProvider: 'local' } },
        profile: { create: { displayName: `Staff ${role}` } },
        staffRoles: { create: { role } },
      },
    });
  }

  // --- Relations à plusieurs niveaux / branches
  const conv = async (ctxId: string, members: string[], kind: 'DATE' | 'NEIGHBORHOOD' = 'DATE') => {
    const id = sid(`conv:${ctxId}`);
    await db.conversation.create({ data: { id, kind, contextId: ctxId, members: { create: members.map((m) => ({ userId: uid(m), joinedAt: now })) } } });
    return id;
  };
  const relationship = async (name: string, a: string, b: string, o: { level: number; xp: number; branch: 'UNDECIDED' | 'FRIEND' | 'PLUS'; status: 'ACTIVE' | 'MOVED_IN'; ageDays: number; spot: string }) => {
    const [lo, hi] = [pid(a), pid(b)].sort() as [string, string];
    const pairId = sid(`pair:${name}`);
    await db.petPair.create({ data: { id: pairId, petLowId: lo, petHighId: hi } });
    const id = sid(`rel:${name}`);
    const started = new Date(now.getTime() - o.ageDays * DAY);
    await db.relationshipContext.create({
      data: {
        id,
        pairId,
        type: 'DATE',
        status: o.status,
        branch: o.branch,
        affinity: 78,
        xpMilli: o.xp * 1000,
        eligibleLevel: o.level,
        reachedLevel: o.level,
        complicity: 45,
        tension: 5,
        dateSpotKey: o.spot,
        timezone: TZ,
        startedAt: started,
        movedInAt: o.status === 'MOVED_IN' ? new Date(started.getTime() + 10 * DAY) : null,
        engineVersion: ENGINE_VERSION,
        tuningVersion: TUNING_VERSION,
        sides: {
          create: [a, b].map((k) => ({ userId: uid(k), petId: pid(k), joinedAt: started, exclusive: o.status === 'MOVED_IN' })),
        },
      },
    });
    const conversationId = await conv(id, [a, b]);
    if (o.status === 'MOVED_IN') {
      for (const k of [a, b]) await db.virtualLocation.update({ where: { petId: pid(k) }, data: { kind: 'SHARED_HOME', contextId: id } });
    }
    return { id, conversationId };
  };

  // Alex ↔ L. : niveau 2, branche indécise, actif (Nino au café, Suzie absente).
  const alexL = await relationship('alex-l', 'alex', 'l', { level: 2, xp: 320, branch: 'UNDECIDED', status: 'ACTIVE', ageDays: 6, spot: 'spot.brunch' });
  await db.virtualLocation.update({ where: { petId: pid('alex') }, data: { kind: 'DATE_SPOT', contextId: alexL.id } });
  // S. ↔ M. : emménagés, Plus, niveau 7, œuf en couvaison.
  const sm = await relationship('s-m', 's', 'm', { level: 7, xp: 3100, branch: 'PLUS', status: 'MOVED_IN', ageDays: 40, spot: 'spot.rando' });
  // Test C ↔ Test D : emménagés, Plus, niveau 7, bébé né.
  const cd = await relationship('c-d', 'test.c', 'test.d', { level: 7, xp: 3400, branch: 'PLUS', status: 'MOVED_IN', ageDays: 60, spot: 'spot.rando' });
  // Alex ↔ Test A : proposition ouverte (démo du flux d'acceptation).
  await db.matchBatch.create({ data: { id: sid('batch:seed'), zoneId: sid('zone:paris11'), localDate: 'seed', kind: 'SEED', status: 'COMPLETED', algoVersion: 'seed', tuningVersion: TUNING_VERSION, startedAt: now, finishedAt: now } });
  {
    const [lo, hi] = [pid('maya'), pid('test.a')].sort() as [string, string];
    const owner = (p: string) => (p === pid('maya') ? uid('maya') : uid('test.a'));
    await db.matchProposal.create({
      data: { id: sid('proposal:maya-testa'), batchId: sid('batch:seed'), petLowId: lo, petHighId: hi, userLowId: owner(lo), userHighId: owner(hi), kind: 'DISCOVERY', visionScore: 64, rankScore: 64, breakdown: {}, expiresAt: new Date(now.getTime() + 40 * HOUR) },
    });
  }

  // Messages : un échange publié et un cas de modération (rejet + dossier ouvert).
  const msg = async (key: string, conversationId: string, author: string | null, seq: number | null, status: 'PUBLISHED' | 'REJECTED', body: string | null, template?: string, minutesAgo = 60) => {
    const at = new Date(now.getTime() - minutesAgo * 60_000);
    await db.message.create({
      data: {
        id: sid(`msg:${key}`),
        conversationId,
        authorUserId: author ? uid(author) : null,
        clientMessageId: author ? `seed-${key}` : null,
        kind: author ? 'TEXT' : 'SYSTEM',
        status,
        seq,
        systemTemplate: template ?? null,
        createdAt: at,
        publishedAt: status === 'PUBLISHED' ? at : null,
        decidedAt: at,
        ...(body ? { content: { create: { body } } } : {}),
      },
    });
  };
  await msg('alexl-0', alexL.conversationId, null, 1, 'PUBLISHED', null, 'system.match.created', 6 * 24 * 60);
  await msg('alexl-1', alexL.conversationId, 'alex', 2, 'PUBLISHED', 'Salut ! Nino adore déjà le café du coin.', undefined, 120);
  await msg('alexl-2', alexL.conversationId, 'l', 3, 'PUBLISHED', 'Suzie aussi, elle a repéré les croissants.', undefined, 90);
  await msg('alexl-3', alexL.conversationId, 'l', null, 'REJECTED', 'Contenu de test synthétique [reject]', undefined, 30);
  await db.conversation.update({ where: { id: alexL.conversationId }, data: { lastSeq: 3 } });
  await db.relationshipSide.updateMany({ where: { contextId: alexL.id, userId: uid('alex') }, data: { replyOwedSince: new Date(now.getTime() - 90 * 60_000), replyOwedEpisode: sid('msg:alexl-2') } });
  await db.moderationDecision.create({ data: { subjectType: 'MESSAGE', subjectId: sid('msg:alexl-3'), messageId: sid('msg:alexl-3'), action: 'REJECT', source: 'AUTO', policyVersion: 'local-policy-2026.11.0', provider: 'local-deterministic', reasonCode: 'LOCAL_REJECT_MARKER' } });
  await db.moderationCase.create({ data: { id: sid('case:1'), subjectType: 'MESSAGE', subjectId: sid('msg:alexl-3'), reasonCode: 'LOCAL_REJECT_MARKER', priority: 2, dueAt: new Date(now.getTime() + 20 * HOUR) } });
  for (const c of [sm, cd]) await db.conversation.update({ where: { id: c.conversationId }, data: { lastSeq: 0 } });

  // Branche : ronde résolue PLUS pour S.–M. (les votes eux-mêmes sont dans BranchBallot, privés).
  await db.branchRound.create({ data: { id: sid('round:sm'), contextId: sm.id, roundNo: 1, status: 'RESOLVED', deadlineAt: new Date(now.getTime() - 25 * DAY), result: 'PLUS', resolvedAt: new Date(now.getTime() - 26 * DAY) } });
  await db.branchBallot.createMany({ data: [{ roundId: sid('round:sm'), userId: uid('s'), choice: 'PLUS' }, { roundId: sid('round:sm'), userId: uid('m'), choice: 'PLUS' }] });

  // --- Couvaison (S.–M.) : 1 nuit validée, la 2e ouverte.
  const egg = sid('egg:sm');
  await db.egg.create({ data: { id: egg, contextId: sm.id, timezone: TZ, warmthRaw: 46, nightsValidated: 1, seed: sid('eggseed:sm') } });
  await db.incubationNight.create({ data: { eggId: egg, logicalIndex: 1, status: 'VALIDATED', opensAt: new Date(now.getTime() - 2 * DAY), closesAt: new Date(now.getTime() - DAY), warmthGained: 46 } });
  await db.incubationNight.create({ data: { eggId: egg, logicalIndex: 2, status: 'OPEN', opensAt: new Date(now.getTime() - 2 * HOUR), closesAt: new Date(now.getTime() + 22 * HOUR) } });

  // --- Bébé (Test C – Test D) : œuf éclos, pet enfant non matchable, garde alternée.
  const egg2 = sid('egg:cd');
  const child = sid('pet:child-cd');
  await db.pet.create({
    data: {
      id: child,
      kind: 'CHILD',
      species: 'PIA',
      stage: 'BABY',
      name: 'Biscotte-Pépite',
      matchable: false,
      engineVersion: ENGINE_VERSION,
      ownerships: { create: [{ userId: uid('test.c'), role: 'COPARENT' }, { userId: uid('test.d'), role: 'COPARENT' }] },
      state: { create: { ...DEFAULT_TUNING.gauges.initial, advancedTo: now, engineVersion: ENGINE_VERSION, tuningVersion: TUNING_VERSION, engineState: {}, rngSeed: sid('rng:child').replace(/-/g, '') } },
      appearance: { create: { variant: 'pia-body/gaston-detail' } },
      location: { create: { kind: 'CUSTODY_HOME', since: now } },
    },
  });
  await db.egg.create({ data: { id: egg2, contextId: cd.id, status: 'HATCHED', timezone: TZ, warmthRaw: 150, nightsValidated: 3, seed: sid('eggseed:cd'), childPetId: child, hatchedAt: new Date(now.getTime() - 5 * DAY) } });
  await db.childPetData.create({ data: { petId: child, eggId: egg2, inheritedAxes: { kindMischief: 0.05, sportyContemplative: 0.15, scienceArt: 0.15, homeAdventure: 0.4 }, bodyFromPetId: pid('test.c'), detailFromPetId: pid('test.d'), seed: sid('eggseed:cd') } });
  await db.custodySchedule.create({ data: { childPetId: child, timezone: TZ, currentHolderUserId: uid('test.c'), weekKey: 'seed-week' } });
  await db.coparentLink.createMany({ data: [{ childPetId: child, userId: uid('test.c') }, { childPetId: child, userId: uid('test.d') }] });

  // --- Quartier : amitiés d'Alex avec Inès, Tom, Maya ; une bande de 4.
  for (const f of ['ines', 'tom', 'maya']) {
    const [lo, hi] = [uid('alex'), uid(f)].sort() as [string, string];
    await db.friendship.create({ data: { userLowId: lo, userHighId: hi, status: 'ACTIVE', invitedById: uid('alex'), acceptedAt: new Date(now.getTime() - 10 * DAY) } });
  }
  const group = sid('group:voisins');
  await db.group.create({ data: { id: group, name: 'Les Voisins du 11e (démo)', status: 'ACTIVE', localKey: 'local.cafe' } });
  await db.groupMember.createMany({ data: ['alex', 'ines', 'tom', 'maya'].map((k) => ({ groupId: group, userId: uid(k), status: 'ACTIVE' as const, joinedAt: new Date(now.getTime() - 9 * DAY) })) });
  await db.conversation.create({ data: { id: sid('conv:group'), kind: 'GROUP', groupId: group, members: { create: ['alex', 'ines', 'tom', 'maya'].map((k) => ({ userId: uid(k), joinedAt: now })) } } });

  // --- Missions : définition, mission du jour, soumissions pending / rejected / approved.
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  await db.missionDefinition.create({
    data: { id: sid('mdef:veggie'), key: 'veggie_plate', version: 1, status: 'PUBLISHED', titleKey: 'mission.veggie_plate.title', criteria: { visible: ['légumes', 'assiette'] }, accessibleAlternative: 'mission.veggie_plate.alt', linkXpMilli: 6000, petXpMilli: 20000, coins: 20, publishedAt: now },
  });
  await db.dailyMission.create({ data: { id: sid('daily:today'), definitionId: sid('mdef:veggie'), zoneId: sid('zone:paris11'), day } });
  const sub = (k: string, user: string, status: 'PENDING_ANALYSIS' | 'REJECTED' | 'APPROVED', ctx: string | null) =>
    db.missionSubmission.create({ data: { id: sid(`sub:${k}`), dailyMissionId: sid('daily:today'), userId: uid(user), contextId: ctx, status, submittedAt: new Date(now.getTime() - HOUR), serverDay: day, decidedAt: status === 'PENDING_ANALYSIS' ? null : now, reasonCode: status === 'REJECTED' ? 'INCONSISTENT_EVIDENCE' : null } });
  await sub('alex', 'alex', 'PENDING_ANALYSIS', alexL.id);
  await sub('l', 'l', 'REJECTED', alexL.id);
  await sub('m', 'm', 'APPROVED', sm.id);
  await db.missionAward.create({ data: { rewardKey: `mission:${sm.id}:${sid('daily:today')}:${uid('m')}:BASE`, userId: uid('m'), submissionId: sid('sub:m'), kind: 'BASE', linkXpMilli: 6000 } });

  // --- Économie : catalogue, produits store, achat SANDBOX local étiqueté pour Alex.
  const prices = DEFAULT_TUNING.coins.catalog;
  await db.catalogItem.createMany({
    data: [
      { id: 'streak_freeze', kind: 'STREAK_FREEZE', priceCoins: prices.streakFreeze },
      { id: 'visibility_boost', kind: 'VISIBILITY_BOOST', priceCoins: prices.visibilityBoost },
      { id: 'scarf_red', kind: 'ACCESSORY', priceCoins: 120 },
    ],
  });
  await db.storeProduct.createMany({
    data: [
      { id: 'blowy_plus_annual', kind: 'SUBSCRIPTION', entitlementId: 'blowy_plus' },
      { id: 'blowy_plus_monthly', kind: 'SUBSCRIPTION', entitlementId: 'blowy_plus' },
      { id: 'blowy_plus_weekly', kind: 'SUBSCRIPTION', entitlementId: 'blowy_plus' },
      { id: 'coins_500', kind: 'CONSUMABLE_COINS', coinsAmount: 500 },
    ],
  });
  // Abonnement Blowy+ et pièces : PAS fabriqués en base. Le fournisseur LOCAL_DEMO (agent G) est
  // la source d'autorité ; un abonnement seedé seul serait révoqué au premier /purchases/sync.
  // Démo : POST /v1/purchases/local-demo {"action":"SUBSCRIBE","productId":"blowy_plus_monthly"}
  //        POST /v1/purchases/local-demo {"action":"BUY_COINS","productId":"coins_500"}
  // Historique sandbox étiqueté (lecture admin) : transaction LOCAL_DEMO enregistrée, sans droit ni crédit.
  await db.storeTransaction.create({ data: { userId: uid('alex'), provider: 'LOCAL_DEMO', environment: 'LOCAL_DEMO', store: 'local', storeTransactionId: 'seed-local-demo-0001', productId: 'blowy_plus_monthly', kind: 'SUBSCRIPTION', purchasedAt: new Date(now.getTime() - 3 * DAY), status: 'RECORDED' } });

  // --- Fiabilité : un épisode journalisé (démonstration de l'historique).
  await db.reliabilityEvent.create({ data: { userId: uid('m'), contextId: sm.id, reason: 'DAILY_RESPONSIVE', delta: 1, episodeKey: `seed:${day}` } });
}

const db = createDb({ connectionString: process.env.DATABASE_URL ?? 'postgresql://blowy:blowy@localhost:5432/blowy' });
const now = new Date(Math.floor(Date.now() / HOUR) * HOUR);
try {
  await seed(db, now);
  const v5 = await seedV5(db, now);
  console.warn(`Seed V5 OK : comptes ${v5.accounts.join(', ')} ; sortie de la semaine d'Alex ${v5.outingId}`);
  console.warn(`Seed OK (${PEOPLE.length} personnes fictives, ${STAFF.length} comptes staff). Connexion locale : provider=local, credential=alex | l | m | s | ines | tom | maya | test.a … staff.admin`);
} catch (err) {
  console.error('Seed échoué :', err);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
