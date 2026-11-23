/**
 * Monde d'exemple du compte de revue d'Apple (App Review 2.1(a), audit B1). Quand l'adresse `REVIEW_EMAIL` s'inscrit,
 * puis à chaque connexion par son code (ou `POST /v1/review/reset`), le serveur lui pose un monde cohérent, visible de
 * ce seul compte, fait de vraies lignes marquées `profiles.review_world = <compte de revue>` :
 * - 8 personnes fictives compatibles (plan pur `reviewWorldPlan` : leur sexe et ce qu'elles cherchent passent les
 *   filtres du compte, leur vision est la sienne décalée), placées autour de sa zone (sans zone, le compte reçoit
 *   Paris comme zone choisie à la main, changeable tout de suite) : 4 dans la
 *   zone (épingles, rencontres expliquées), 3 au-delà (compteur « plus loin » et paywall), amis d'amis entre elles ;
 * - un coucou reçu ; un lien ouvert avec une conversation (répliques des minimoas de chaque rôle : brise-glace,
 *   relance, remarque, garde-fou visible de lui seul) et l'accord de lecture par l'IA déjà donné par l'autre ; un lien
 *   après quelques jours de silence (`warmth` « calme », ADA-2027 item 27) ;
 * - sa série du défi du jour avec son historique, deux habitudes, le bilan de la semaine passée ; son minimoa en forme.
 * Les personnes fictives n'ont pas de vrai compte (comptes d'authentification bannis, adresses `.invalid`) ; `Audience`
 * ne les montre qu'au compte de revue ; elles sont hors statistiques, hors alertes et hors e-mails.
 * La remise à neuf supprime les personnes fictives (cascade : liens, messages, rencontres, blocages) et les
 * signalements du compte, puis repose tout. Le compte de revue garde son minimoa et ses réglages.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { DAILY_CHALLENGES as DAILY_CATALOGUE, auditText, chatSystemText, chatLines } from '@blowy/content';
import {
  type Day,
  LEVEL_XP,
  type Locale,
  type LinkDay,
  MANUAL_AREA_CHANGE_DAYS,
  REVIEW_DEFAULT_CENTER,
  type StreakState,
  VISION_AXES,
  type VisionAxis,
  type VisionSignal,
  addDays,
  cellOf,
  dayOf,
  fixtureVision,
  levelForXp,
  newLink,
  reviewFixtureId,
  reviewWorldPlan,
  storedPoint,
  streakRunDays,
  weekStartOf,
} from '@blowy/domain';
import type { Env } from '../config/env';
import type { UserEmails } from '../integrations/auth/ports';
import type { Clock } from '../shared/clock';
import type { Ids } from '../shared/ids';
import { CLOCK, ENCOUNTERS, ENV, IDS, LINKS, MESSAGES, PETS, PROFILES, REPORTS, USER_EMAILS } from '../shared/tokens';
import type { EncountersRepository } from '../modules/encounters/ports';
import type { LinkRecord, LinksRepository, MessageRecord, MessagesRepository } from '../modules/links/ports';
import { ChatMinimoas } from '../modules/links/minimoas/chat-minimoas';
import type { OnboardedHook, Profile, ProfilesRepository } from '../modules/me/ports';
import { Wardrobe } from '../modules/pets/application/wardrobe';
import type { PetsRepository } from '../modules/pets/ports';
import { ReviewsService } from '../modules/rituels/application/reviews.service';
import { RitualsContext } from '../modules/rituels/application/rituals-context';
import type { DailyChallengesRepository, HabitsRepository, RitualStatesRepository } from '../modules/rituels/ports';
import { DAILY_CHALLENGES, HABITS, RITUAL_STATES } from '../modules/rituels/tokens';
import type { ReportsRepository } from '../modules/safety/ports';
import type { MatchCacheRepository, PlacesRepository } from '../modules/vision/ports';
import { MATCH_CACHE, PLACES, VISION_READER, VISION_SIGNALS, type VisionReader, type VisionSignals } from '../modules/vision/tokens';
import { FIXTURE_ACCOUNTS, type FixtureAccounts, fixtureEmail } from './review-auth';
import { ReviewPlaces } from './review-places';

/** Série du défi du jour posée sur le compte de revue (avec l'historique des jours faits). */
const REVIEWER_STREAK = { current: 6, best: 9, habitsKept: 8, habits: ['marcher', 'lire'] } as const;
const GOOD_NEEDS = { hunger: 85, energy: 85, mood: 90, sociability: 85 } as const;

@Injectable()
export class ReviewWorld implements OnboardedHook {
  private readonly logger = new Logger('Revue');

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(Wardrobe) private readonly wardrobe: Wardrobe,
    @Inject(LINKS) private readonly links: LinksRepository,
    @Inject(MESSAGES) private readonly messages: MessagesRepository,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(ChatMinimoas) private readonly minimoas: ChatMinimoas,
    @Inject(VISION_SIGNALS) private readonly visionSignals: VisionSignals,
    @Inject(VISION_READER) private readonly vision: VisionReader,
    @Inject(PLACES) private readonly places: PlacesRepository,
    @Inject(MATCH_CACHE) private readonly matchCache: MatchCacheRepository,
    @Inject(ReviewPlaces) private readonly reviewPlaces: ReviewPlaces,
    @Inject(RITUAL_STATES) private readonly states: RitualStatesRepository,
    @Inject(HABITS) private readonly habits: HabitsRepository,
    @Inject(DAILY_CHALLENGES) private readonly daily: DailyChallengesRepository,
    @Inject(ReviewsService) private readonly reviews: ReviewsService,
    @Inject(RitualsContext) private readonly ctx: RitualsContext,
    @Inject(REPORTS) private readonly reports: ReportsRepository,
    @Inject(USER_EMAILS) private readonly emails: UserEmails,
    @Inject(FIXTURE_ACCOUNTS) private readonly accounts: FixtureAccounts,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  /** L'adresse est-elle celle du compte de revue (configurée) ? */
  isReviewEmail(email: string | null | undefined): boolean {
    const review = this.env.audit.review;
    return !!review && !!email && email.trim().toLowerCase() === review.email;
  }

  /** Crochet d'inscription : le compte de revue reçoit son monde. */
  async onOnboarded(userId: string): Promise<void> {
    await this.claim(userId);
  }

  /** Si c'est le compte de revue, pose son monde et rend vrai ; sinon rend faux (le crochet suivant s'en charge). */
  async claim(userId: string): Promise<boolean> {
    if (!this.env.audit.review || !this.isReviewEmail(await this.emails.emailOf(userId))) return false;
    await this.reset(userId);
    return true;
  }

  /**
   * Remet le monde d'exemple à neuf. Rend le nombre de personnes fictives posées (0 si le compte n'a pas de minimoa).
   * `locale` : la langue de l'app au moment de la connexion (en-tête `Accept-Language`), adoptée avant de poser le monde :
   * tout y est écrit dans la langue que l'examinateur voit (messages, répliques des minimoas, bilan), même si le compte
   * a été utilisé dans une autre langue avant.
   */
  async reset(world: string, locale: Locale | null = null): Promise<number> {
    let reviewer = await this.profiles.findById(world);
    const reviewerPet = await this.pets.findByOwner(world);
    if (!reviewer || !reviewerPet) return 0;
    if (reviewer.reviewWorld !== world) reviewer = await this.profiles.update(world, { reviewWorld: world });
    if (locale && reviewer.locale !== locale) reviewer = await this.profiles.update(world, { locale });

    await this.profiles.deleteFixtures(world);
    await this.reports.removeBy(world);
    const now = this.clock.now();
    const nowIso = now.toISOString();
    const today = dayOf(now);
    await this.pets.saveNeeds(reviewerPet.id, GOOD_NEEDS, nowIso);

    // Vision du compte (test d'inscription) : les personnes fictives en partent.
    const mine = await this.vision.profileOf(world);
    const base = Object.fromEntries(VISION_AXES.map((a) => [a, mine[a].value])) as Record<VisionAxis, number>;
    const plan = reviewWorldPlan();
    const ids = plan.map((f) => reviewFixtureId(world, f.slot));
    for (const f of plan) {
      const id = ids[f.slot] as string;
      await this.accounts.ensure(id, fixtureEmail(world, f.slot));
      await this.profiles.create({
        id,
        displayName: f.displayName,
        birthdate: f.birthdate,
        gender: f.gender,
        locale: reviewer.locale,
        discreet: false,
        locationConsentAt: nowIso,
        avatarPath: null,
        inviteCode: this.code(),
        wordsCode: this.code(),
        plusUntil: null,
        welcomeSentAt: nowIso,
        createdAt: addDays(today, -40 + f.slot) + 'T09:00:00.000Z',
        reviewWorld: world,
      });
      await this.pets.create({
        id: this.ids.uuid(),
        ownerId: id,
        name: f.petName,
        species: f.species,
        gauges: { social: 20 + f.slot * 5, play: 10 * (f.slot % 3), tender: 15, talk: 5 * f.slot },
        decayedOn: today,
        needs: GOOD_NEEDS,
        needsAt: nowIso,
        careDays: 10 + f.slot,
        lastCareOn: today,
        bestStreak: 0,
        outfit: {},
        renamedAt: null,
        createdAt: nowIso,
      });
      await this.wardrobe.sync(id);
      const values = fixtureVision(base, f.visionDelta);
      const signals: VisionSignal[] = VISION_AXES.flatMap((axis) =>
        [...Array<'test'>(2).fill('test'), ...Array<'daily'>(3).fill('daily')].map((source) => ({ axis, value: values[axis], source, at: nowIso })),
      );
      await this.visionSignals.record(id, signals);
    }

    // Zone : celle du compte (position ou zone choisie). Sans zone, le compte de revue reçoit une zone choisie à la main
    // (Paris), changeable tout de suite : la carte et les rencontres proches sont pleines dès la connexion, même si
    // l'examinateur refuse la localisation. Le monde suit ensuite chaque changement (`ReviewPlaces`).
    let place = reviewer.locationConsentAt ? await this.places.find(world) : null;
    if (!place) {
      const home = storedPoint(REVIEW_DEFAULT_CENTER);
      place = { userId: world, last: home, locatedAt: nowIso, lastAwayAt: null, home, homeCell: cellOf(home), candidate: null, candidateSince: null, chosenCity: null, source: 'manual', manualArea: { label: 'Paris', setOn: addDays(today, -MANUAL_AREA_CHANGE_DAYS) } };
      if (!reviewer.locationConsentAt) reviewer = await this.profiles.update(world, { locationConsentAt: nowIso });
      await this.places.save(place);
    }
    await this.reviewPlaces.placeAround(world, place.home);

    const pair = (slot: number): string => ids[slot] as string;
    const active = plan.find((f) => f.role === 'link_active');
    const danger = plan.find((f) => f.role === 'link_danger');
    const wave = plan.find((f) => f.role === 'wave');
    if (active) await this.activeLink(world, pair(active.slot), reviewer, reviewerPet.name, today);
    if (danger) await this.dangerLink(world, pair(danger.slot), today, reviewer);
    if (wave) {
      await this.encounters.create({ id: this.ids.uuid(), fromUser: pair(wave.slot), toUser: world, status: 'waved', intro: null, createdAt: nowIso, statusAt: nowIso });
    }
    // Amis d'amis : proposés même sans position.
    for (const f of plan) if (f.friendOfSlot !== null) await this.plainLink(pair(f.friendOfSlot), pair(f.slot), today);

    await this.rituals(world, reviewer, today, now);
    await this.matchCache.clear(world);
    this.logger.log(`monde de revue posé : ${plan.length} personnes fictives`);
    return plan.length;
  }

  // ── Liens ──────────────────────────────────────────────────────────────────

  private ordered(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  private message(link: LinkRecord, author: { kind: 'user' | 'pet' | 'system'; id: string | null }, body: string, at: string, extra: Partial<MessageRecord> = {}): MessageRecord {
    return { id: this.ids.uuid(), linkId: link.id, authorKind: author.kind, authorId: author.id, kind: author.kind === 'system' ? 'event' : 'text', body, mediaPath: null, createdAt: at, ...extra };
  }

  /**
   * Lien ouvert depuis 9 jours : premiers mots, 3 jours de silence et la relance du minimoa, puis 5 jours d'affilée à
   * deux (série en cours), un message un peu vif et le garde-fou (visible du seul compte de revue), une remarque ; la
   * personne fictive a écrit aujourd'hui : « à toi d'écrire ». Elle a déjà accepté la lecture par l'IA.
   */
  private async activeLink(world: string, other: string, reviewer: Profile, reviewerPetName: string, today: Day): Promise<void> {
    const [userA, userB] = this.ordered(world, other);
    const ago = (n: number): Day => addDays(today, -n);
    const at = (n: number, time: string): string => new Date(`${ago(n)}T${time}Z`).toISOString();
    const otherIsA = userA === other;
    const duo: LinkDay[] = [5, 4, 3, 2, 1].map((n) => ({ day: ago(n), a: true, b: true }));
    const xp = (LEVEL_XP[2] ?? 120) + 40;
    const link: LinkRecord = {
      ...newLink(today),
      id: this.ids.uuid(),
      userA,
      userB,
      xp,
      level: levelForXp(xp),
      streak: 5,
      bestStreak: 5,
      duoDays: 5,
      lastDuoDayOn: ago(1),
      recentDays: [...duo, { day: today, a: otherIsA, b: !otherIsA }],
      milestones: [{ kind: 'level', value: 2, on: ago(6) }, { kind: 'level', value: 3, on: ago(2) }, { kind: 'streak', value: 3, on: ago(3) }],
      messageXpOn: null,
      messageXp: 0,
      createdAt: at(9, '18:00:00'),
      lastMessageAt: new Date(this.clock.now().getTime() - 60 * 60_000).toISOString(),
    };
    if (!(await this.links.create(link))) return;
    const lang = reviewer.locale;
    const t = auditText.in(lang).review;
    const them = { kind: 'user' as const, id: other };
    const me = { kind: 'user' as const, id: world };
    const lines = t.activeLines.map((l, i) => this.message(link, l.who === 'me' ? me : them, l.text, at(9, `18:${String(10 + i * 7).padStart(2, '0')}:00`)));
    const rows: MessageRecord[] = [
      this.message(link, { kind: 'system', id: null }, chatSystemText(lang).linkCreated, at(9, '18:00:00')),
      this.message(link, { kind: 'pet', id: other }, chatLines.icebreaker(lang, 'rythme', reviewerPetName, 7), at(9, '18:01:00'), { petRole: 'icebreaker' }),
      ...lines,
      this.message(link, { kind: 'pet', id: world }, t.nudge, at(5, '09:00:00'), { petRole: 'nudge' }),
      this.message(link, them, t.afterNudge[0] ?? '…', at(5, '12:30:00')),
      this.message(link, me, t.afterNudge[1] ?? '…', at(5, '13:00:00')),
      this.message(link, them, '🙂', at(4, '19:00:00')),
      this.message(link, me, '👋', at(4, '19:05:00')),
      this.message(link, them, t.short.coffee, at(3, '08:30:00')),
      this.message(link, me, t.short.yes, at(3, '08:40:00')),
      this.message(link, me, t.heated, at(2, '20:00:00')),
      this.message(link, { kind: 'pet', id: world }, t.guard, at(2, '20:00:30'), { petRole: 'guard', visibleTo: world }),
      this.message(link, them, t.apology, at(2, '20:30:00')),
      this.message(link, them, t.after[0]?.text ?? '…', at(1, '10:00:00')),
      this.message(link, me, t.short.tuesday, at(1, '10:30:00')),
      this.message(link, { kind: 'pet', id: other }, t.remark, at(1, '10:31:00'), { petRole: 'remark' }),
      this.message(link, them, t.today, new Date(this.clock.now().getTime() - 60 * 60_000).toISOString()),
    ];
    await this.messages.add(rows);
    // L'autre a déjà dit oui à la lecture par l'IA : à la première ouverture, le compte de revue voit la demande.
    await this.minimoas.update(link.id, other, { consent: true });
  }

  /** Lien après quelques jours de silence : dernier échange il y a 6 jours (`warmth` « calme »). */
  private async dangerLink(world: string, other: string, today: Day, reviewer: Profile): Promise<void> {
    const [userA, userB] = this.ordered(world, other);
    const ago = (n: number): Day => addDays(today, -n);
    const at = (n: number, time: string): string => new Date(`${ago(n)}T${time}Z`).toISOString();
    const xp = (LEVEL_XP[1] ?? 40) + 30;
    const link: LinkRecord = {
      ...newLink(ago(6)),
      id: this.ids.uuid(),
      userA,
      userB,
      xp,
      level: levelForXp(xp),
      streak: 0,
      bestStreak: 3,
      duoDays: 3,
      lastDuoDayOn: ago(6),
      recentDays: [8, 7, 6].map((n) => ({ day: ago(n), a: true, b: true })),
      milestones: [{ kind: 'level', value: 2, on: ago(12) }, { kind: 'streak', value: 3, on: ago(6) }],
      messageXpOn: null,
      messageXp: 0,
      createdAt: at(16, '18:00:00'),
      lastMessageAt: at(6, '19:31:00'),
    };
    if (!(await this.links.create(link))) return;
    const [theirs, mine] = auditText.in(reviewer.locale).review.dangerLines;
    await this.messages.add([
      this.message(link, { kind: 'system', id: null }, chatSystemText(reviewer.locale).linkCreated, at(16, '18:00:00')),
      this.message(link, { kind: 'user', id: other }, theirs ?? '…', at(6, '19:30:00')),
      this.message(link, { kind: 'user', id: world }, mine ?? '…', at(6, '19:31:00')),
    ]);
  }

  /** Lien ordinaire entre deux personnes fictives (amis d'amis). */
  private async plainLink(a: string, b: string, today: Day): Promise<void> {
    const [userA, userB] = this.ordered(a, b);
    const at = new Date(`${addDays(today, -20)}T18:00:00Z`).toISOString();
    await this.links.create({ ...newLink(today), id: this.ids.uuid(), userA, userB, messageXpOn: null, messageXp: 0, createdAt: at, lastMessageAt: at });
  }

  // ── Rituels du compte de revue ─────────────────────────────────────────────

  private async rituals(world: string, reviewer: Profile, today: Day, now: Date): Promise<void> {
    const streak: StreakState = { current: REVIEWER_STREAK.current, best: REVIEWER_STREAK.best, lastDoneOn: addDays(today, -1), jokerDays: [] };
    await this.states.upsert(world, { streak, lastSeenOn: today, habitsKept: REVIEWER_STREAK.habitsKept });
    const question = DAILY_CATALOGUE.find((c) => c.kind === 'question') ?? DAILY_CATALOGUE[0];
    if (question) {
      for (const day of streakRunDays(streak)) {
        const at = `${day}T10:00:00.000Z`;
        await this.daily.insertIfAbsent({ userId: world, day, challengeId: question.id, kind: question.kind, axis: question.axis, status: 'done', answer: 0, photoId: null, seenAt: at, acceptedAt: at, doneAt: at, createdAt: at });
      }
    }
    const active = new Set((await this.habits.listActive(world)).map((h) => h.habitId));
    for (const habitId of REVIEWER_STREAK.habits) {
      if (active.size >= 2) break;
      if (active.has(habitId)) continue;
      await this.habits.create({ id: this.ids.uuid(), userId: world, habitId, rhythm: 'daily', proofHour: 18, createdAt: now.toISOString(), archivedAt: null, askedOn: null });
      active.add(habitId);
    }
    // Le bilan de la semaine passée (modèle de phrases, ou IA si elle est branchée) : déjà dans l'historique.
    try {
      await this.reviews.build(await this.ctx.state(world), reviewer, addDays(weekStartOf(today), -7));
    } catch (err) {
      this.logger.warn(`bilan d’exemple non posé : ${err instanceof Error ? err.message : 'erreur'}`);
    }
  }

  private code(): string {
    return this.ids.code();
  }
}
