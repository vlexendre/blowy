/**
 * Semis d'un environnement de test (docs/SEED-TEST.md) : des comptes de test réalistes dans les villes du site, avec
 * leur minimoa, leur test de vision, leur position dans le quartier, des habitudes, des liens et des conversations,
 * des groupes, des soins et des défis sur trois semaines, des coucous en attente, et des inscriptions « Ouvre ton
 * quartier ». Tout passe par les vrais cas d'usage (inscription, coucou, lien, message, soin, défi, groupe) : les
 * invariants tiennent. L'horloge est reculée au jour de chaque geste, puis rendue.
 *
 * Chaque compte est reconnaissable et purgeable : adresse `…@seed.minimoa.invalid`, identifiant `5eed5eed-…`, compte
 * d'authentification banni, et `profiles.review_world` = le monde du semis : `Audience` ne le montre jamais à un vrai
 * compte (ni rencontre, ni carte, ni coucou, ni invitation), il est hors statistiques et ne reçoit aucun e-mail.
 * Garde-fous (`guards.ts`) vérifiés à chaque appel, sans contournement possible.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CreateGroupBody, OnboardBody } from '@blowy/contract';
import { type Day, FOUNDERS_PER_ZONE, ITEM_SLOTS, type Outfit, addDays, dayOf, foundersOf, itemById } from '@blowy/domain';
import type { Env } from '../../config/env';
import { DomainError } from '../../shared/errors';
import { type Clock, canAdvance } from '../../shared/clock';
import type { Ids } from '../../shared/ids';
import { CLOCK, ENCOUNTERS, ENV, IDS, PROFILES } from '../../shared/tokens';
import type { SubscriptionsRepository } from '../../modules/billing/ports';
import { SUBSCRIPTIONS } from '../../modules/billing/tokens';
import { AnswerEncounter } from '../../modules/encounters/application/answer-encounter.usecase';
import { Wave } from '../../modules/encounters/application/wave.usecase';
import type { EncountersRepository } from '../../modules/encounters/ports';
import { GroupChat } from '../../modules/groups/application/group-chat';
import { GroupsUseCases } from '../../modules/groups/application/groups.usecases';
import { CreateLink } from '../../modules/links/application/create-link.usecase';
import { SendMessage } from '../../modules/links/application/send-message.usecase';
import { Onboard } from '../../modules/me/application/onboard.usecase';
import type { ProfilesRepository } from '../../modules/me/ports';
import { CarePet } from '../../modules/pets/application/care-pet.usecase';
import { SetOutfit } from '../../modules/pets/application/set-outfit.usecase';
import { Wardrobe } from '../../modules/pets/application/wardrobe';
import { QUARTIERS, type QuartiersRepository } from '../../modules/quartiers/ports';
import { DailyService } from '../../modules/rituels/application/daily.service';
import type { MatchCacheRepository } from '../../modules/vision/ports';
import { MATCH_CACHE } from '../../modules/vision/tokens';
import { Matchmaker } from '../../modules/vision/application/matchmaker';
import {
  type EnvSource,
  FOREIGN_ACCOUNT_LIMIT,
  SEED_WORLD_EMAIL,
  SEED_WORLD_ID,
  SEED_ZONE_CREATED_AT,
  SeedRefused,
  configRefusals,
  foreignAccountsRefusal,
  isExpectedAccount,
  isSeedEmail,
  isSeedId,
} from './guards';
import { type PlannedEvent, type PlannedPerson, type SeedOptions, type SeedPlan, buildPlan, planSummary, rngOf } from './plan';
import { SEED_STORE, type SeedStore } from './ports';

export interface SeedReport {
  dryRun: boolean;
  target: 'memory' | 'supabase';
  cities: string[];
  planned: Record<string, number>;
  /** Ce qui a vraiment été écrit (vide en `--dry-run`). */
  done: Record<string, number>;
  /** Gestes refusés par les règles du jeu (besoin déjà comblé, coucou non proposé…) : normal, comptés par type. */
  refused: Record<string, number>;
  /** Minimoa+ : posé seulement en mémoire (aucun reçu Apple fictif sur Supabase). */
  plus: 'memory' | 'skipped';
}

export interface PurgeReport {
  accounts: number;
  groups: number;
  signups: number;
  zones: number;
  /** Comptes de test rattachés au monde du semis, rendus à tout le monde. */
  detached: number;
}

const pairKey = (a: number, b: number): string => (a < b ? `${a}:${b}` : `${b}:${a}`);
/** Début des gestes d'un jour (5 h UTC) ; les minutes du plan s'y ajoutent (17 h au plus). */
const DAY_START_UTC = 'T05:00:00.000Z';
const LAST_MINUTE = 1020;

/** Recule l'horloge au moment d'un geste, puis la rend (horloge du développement local ou des tests). */
class TimeTravel {
  private shiftedHours = 0;
  readonly enabled: boolean;
  constructor(private readonly clock: Clock) {
    this.enabled = canAdvance(clock);
  }
  to(target: number): void {
    if (!canAdvance(this.clock)) return;
    const hours = (target - this.clock.now().getTime()) / 3_600_000;
    this.clock.advanceHours(hours);
    this.shiftedHours += hours;
  }
  restore(): void {
    if (canAdvance(this.clock) && this.shiftedHours !== 0) this.clock.advanceHours(-this.shiftedHours);
    this.shiftedHours = 0;
  }
}

interface RunContext {
  plan: SeedPlan;
  today: Day;
  base: number;
  onboarded: Set<number>;
  links: Map<string, string>;
  groups: Map<number, string>;
  done: Record<string, number>;
  refused: Record<string, number>;
}

@Injectable()
export class Seeder {
  private readonly logger = new Logger('Semis');

  constructor(
    @Inject(ENV) private readonly env: Env,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(SEED_STORE) private readonly store: SeedStore,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(QUARTIERS) private readonly quartiers: QuartiersRepository,
    @Inject(SUBSCRIPTIONS) private readonly subscriptions: SubscriptionsRepository,
    @Inject(MATCH_CACHE) private readonly matchCache: MatchCacheRepository,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    // Lu à la demande : l'inscription appelle le crochet de la démo, qui connaît le semis (dépendance circulaire sinon).
    @Inject(ModuleRef) private readonly moduleRef: ModuleRef,
    @Inject(Wave) private readonly wave: Wave,
    @Inject(AnswerEncounter) private readonly answer: AnswerEncounter,
    @Inject(CreateLink) private readonly createLink: CreateLink,
    @Inject(SendMessage) private readonly sendMessage: SendMessage,
    @Inject(CarePet) private readonly care: CarePet,
    @Inject(SetOutfit) private readonly setOutfit: SetOutfit,
    @Inject(Wardrobe) private readonly wardrobe: Wardrobe,
    @Inject(DailyService) private readonly daily: DailyService,
    @Inject(GroupsUseCases) private readonly groups: GroupsUseCases,
    @Inject(GroupChat) private readonly groupChat: GroupChat,
    @Inject(Matchmaker) private readonly matchmaker: Matchmaker,
  ) {}

  // ── Garde-fous ─────────────────────────────────────────────────────────────

  /**
   * Les quatre garde-fous, à chaque appel (semis, purge, rattachement) : la configuration reçue (`source`) et celle que
   * l'API a chargée, puis la base elle-même (pas plus de 20 comptes qui ressemblent à de vrais comptes).
   */
  async assertAllowed(source: EnvSource): Promise<void> {
    const mode = this.env.adapters;
    const reasons = configRefusals(
      { ...source, 'chargée.SUPABASE_URL': this.env.supabase?.url, 'chargée.API_URL': this.env.apiUrl },
      mode,
    );
    if (this.env.env === 'production') reasons.unshift('L’API est configurée pour la production : semis refusé.');
    if (reasons.length === 0) {
      const review = this.env.audit.review?.email ?? source.REVIEW_EMAIL ?? null;
      const foreign = await this.store.countForeignAccounts((email) => isExpectedAccount(email, review), FOREIGN_ACCOUNT_LIMIT);
      const refusal = foreignAccountsRefusal(foreign);
      if (refusal) reasons.push(refusal);
    }
    if (reasons.length > 0) throw new SeedRefused(reasons);
  }

  // ── Semis ──────────────────────────────────────────────────────────────────

  async run(input: { options: SeedOptions; dryRun?: boolean; source: EnvSource }): Promise<SeedReport> {
    await this.assertAllowed(input.source);
    const base = this.clock.now().getTime();
    const today = dayOf(new Date(base));
    const plan = buildPlan(input.options, today, await this.quartiers.threshold());
    const report: SeedReport = {
      dryRun: !!input.dryRun,
      target: this.env.adapters,
      cities: [...new Set(plan.people.map((p) => p.city))],
      planned: { ...planSummary(plan), plus: this.env.adapters === 'memory' ? plan.people.filter((p) => p.plus).length : 0 },
      done: {},
      refused: {},
      plus: this.env.adapters === 'memory' ? 'memory' : 'skipped',
    };
    if (input.dryRun) return report;
    if ((await this.store.seedAccountIds()).length > 0) {
      throw new SeedRefused(['Le semis est déjà en place dans cette base : lance d’abord la purge (--purge).']);
    }

    const ctx: RunContext = { plan, today, base, onboarded: new Set(), links: new Map(), groups: new Map(), done: report.done, refused: report.refused };
    await this.store.ensureAccount(SEED_WORLD_ID, SEED_WORLD_EMAIL);
    const travel = new TimeTravel(this.clock);
    if (!travel.enabled) this.logger.warn('horloge fixe : les gestes sont datés d’aujourd’hui');
    try {
      for (const ev of plan.events) {
        travel.to(this.timeOf(ctx, ev.daysAgo, ev.minute));
        await this.apply(ctx, ev);
      }
      travel.to(this.timeOf(ctx, 0, LAST_MINUTE));
      await this.dress(ctx, input.options.seed);
    } finally {
      travel.restore();
    }
    await this.seedQuartiers(ctx);
    this.logger.log(`semis posé : ${Object.entries(report.done).map(([k, v]) => `${k} ${v}`).join(', ')}`);
    return report;
  }

  /** Moment d'un geste : le jour (Paris) du plan, avant l'instant présent. */
  private timeOf(ctx: RunContext, daysAgo: number, minute: number): number {
    const t = Date.parse(`${addDays(ctx.today, -daysAgo)}${DAY_START_UTC}`) + minute * 60_000;
    const latest = ctx.base - 60_000;
    return t <= latest ? t : latest - (LAST_MINUTE - minute) * 1000;
  }

  private count(bucket: Record<string, number>, key: string, n = 1): void {
    bucket[key] = (bucket[key] ?? 0) + n;
  }

  private idOf(ctx: RunContext, slot: number): string | null {
    return ctx.onboarded.has(slot) ? (ctx.plan.people[slot]?.id ?? null) : null;
  }

  private async apply(ctx: RunContext, ev: PlannedEvent): Promise<void> {
    try {
      switch (ev.kind) {
        case 'onboard':
          return await this.onboardOne(ctx, ctx.plan.people[ev.who] as PlannedPerson);
        case 'link':
          return await this.link(ctx, ev.a, ev.b);
        case 'message': {
          const linkId = ctx.links.get(pairKey(ev.a, ev.b));
          const from = this.idOf(ctx, ev.from);
          if (!linkId || !from) return;
          await this.sendMessage.execute({ linkId, userId: from, body: ev.body });
          return this.count(ctx.done, 'messages');
        }
        case 'care': {
          const who = this.idOf(ctx, ev.who);
          if (!who) return;
          await this.care.execute(who, ev.action);
          return this.count(ctx.done, 'careActions');
        }
        case 'daily':
          return await this.dailyOne(ctx, ev.who, ev.choice);
        case 'group': {
          const creator = this.idOf(ctx, ev.creator);
          const members = ev.members.map((m) => this.idOf(ctx, m)).filter((m): m is string => m !== null);
          if (!creator || members.length < 2) return;
          const body = CreateGroupBody.parse({ name: ev.name, kind: ev.habitId ? 'habit' : 'free', ...(ev.habitId ? { habitId: ev.habitId } : {}), memberIds: members });
          const group = await this.groups.create(creator, body);
          ctx.groups.set(ev.key, group.id);
          return this.count(ctx.done, 'groups');
        }
        case 'groupJoin': {
          const groupId = ctx.groups.get(ev.key);
          const who = this.idOf(ctx, ev.who);
          if (!groupId || !who) return;
          await this.groups.accept(who, groupId);
          return this.count(ctx.done, 'groupMembers');
        }
        case 'groupMessage': {
          const groupId = ctx.groups.get(ev.key);
          const who = this.idOf(ctx, ev.who);
          if (!groupId || !who) return;
          await this.groupChat.send(who, groupId, ev.body);
          return this.count(ctx.done, 'groupMessages');
        }
        case 'wave': {
          const from = this.idOf(ctx, ev.from);
          const to = this.idOf(ctx, ev.to);
          if (!from || !to) return;
          const target = await this.waveTarget(from, to);
          if (!target) return this.count(ctx.refused, 'wave');
          await this.wave.execute(from, target);
          const e = await this.encounters.findPair(from, target);
          if (e?.status === 'waved') this.count(ctx.done, 'wavesPending');
          return;
        }
      }
    } catch (err) {
      // Un geste refusé par les règles (besoin déjà comblé, limite du jour, personne non proposée…) : on passe.
      if (err instanceof DomainError) return this.count(ctx.refused, ev.kind);
      throw err;
    }
  }

  /** Inscription par le vrai cas d'usage, sur un profil déjà rattaché au monde du semis (pas d'e-mail de bienvenue). */
  private async onboardOne(ctx: RunContext, p: PlannedPerson): Promise<void> {
    const now = this.clock.now().toISOString();
    await this.store.ensureAccount(p.id, p.email);
    await this.profiles.create({
      id: p.id,
      displayName: p.displayName,
      birthdate: p.birthdate,
      gender: p.gender,
      locale: p.locale,
      discreet: p.discreet,
      locationConsentAt: now,
      avatarPath: null,
      inviteCode: await this.freshCode(),
      wordsCode: await this.freshCode(),
      plusUntil: null,
      welcomeSentAt: now,
      createdAt: now,
      reviewWorld: SEED_WORLD_ID,
    });
    const body = OnboardBody.parse({
      displayName: p.displayName,
      birthdate: p.birthdate,
      pet: { name: p.petName, species: p.species },
      quiz: p.quiz,
      gender: p.gender,
      locale: p.locale,
      consents: { location: true },
      location: { latitude: p.point.lat, longitude: p.point.lng },
      visionAnswers: p.visionAnswers,
      habits: p.habits.map((habitId) => ({ habitId })),
    });
    await this.moduleRef.get(Onboard, { strict: false }).execute({ userId: p.id, email: p.email, body });
    ctx.onboarded.add(p.slot);
    this.count(ctx.done, 'accounts');
    this.count(ctx.done, 'habits', p.habits.length);
    // Minimoa+ : seulement en mémoire, comme le monde de démo (sur Supabase, il faudrait un faux reçu : jamais).
    if (p.plus && this.env.adapters === 'memory') {
      await this.subscriptions.setPlusUntil(p.id, `${addDays(ctx.today, 30)}T00:00:00.000Z`);
      this.count(ctx.done, 'plus');
    }
  }

  private async freshCode(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const code = this.ids.code();
      if (!(await this.profiles.codeTaken(code))) return code;
    }
    throw new Error('aucun code libre trouvé');
  }

  /** Lien par le vrai parcours : coucou puis « oui » ; si le coucou n'est pas proposé, lien par code d'invitation. */
  private async link(ctx: RunContext, a: number, b: number): Promise<void> {
    const ida = this.idOf(ctx, a);
    const idb = this.idOf(ctx, b);
    if (!ida || !idb) return;
    let linkId: string | null = null;
    try {
      await this.wave.execute(ida, idb);
      const encounter = await this.encounters.findPair(ida, idb);
      if (encounter?.status === 'waved') linkId = (await this.answer.accept(encounter.id, idb)).id;
    } catch (err) {
      if (!(err instanceof DomainError)) throw err;
    }
    linkId ??= (await this.createLink.execute({ by: ida, with: idb })).id;
    ctx.links.set(pairKey(a, b), linkId);
    this.count(ctx.done, 'links');
  }

  /**
   * On ne fait signe qu'à quelqu'un que l'app a montré (`WaveGuard.shown`) : la personne prévue si elle est parmi les
   * rencontres proposées, sinon la première proposée encore sans lien ni coucou (comme le ferait la personne).
   */
  private async waveTarget(from: string, planned: string): Promise<string | null> {
    const me = await this.profiles.findById(from);
    if (!me) return null;
    const shown = (await this.matchmaker.nearby(await this.matchmaker.seeker(me))).map((m) => m.userId).slice(0, 6);
    if (shown.includes(planned)) return planned;
    for (const id of shown) {
      if (!isSeedId(id) || (await this.encounters.findPair(from, id)) || (await this.encounters.findPair(id, from))) continue;
      return id;
    }
    return null;
  }

  /** Défi du jour : une question (réponse tirée au plan) ou « écrire à un lien » s'il a écrit ; les autres attendent. */
  private async dailyOne(ctx: RunContext, slot: number, choice: 0 | 1): Promise<void> {
    const who = this.idOf(ctx, slot);
    if (!who) return;
    const rec = await this.daily.ensure(who, dayOf(this.clock.now()));
    if (rec.status === 'done') return;
    if (rec.kind === 'question') await this.daily.answer(who, choice);
    else if (rec.kind === 'write') await this.daily.complete(who);
    else return this.count(ctx.refused, 'daily');
    this.count(ctx.done, 'dailyChallenges');
  }

  /** Tenue : parmi les objets vraiment possédés (gagnés pendant ces semaines, premium seulement avec Minimoa+). */
  private async dress(ctx: RunContext, seed: number): Promise<void> {
    const next = rngOf(seed ^ 0x5eed);
    for (const slot of [...ctx.onboarded].sort((x, y) => x - y)) {
      const id = ctx.plan.people[slot]?.id;
      if (!id) continue;
      await this.wardrobe.sync(id);
      const { owned } = await this.wardrobe.state(id);
      const outfit: Outfit = {};
      for (const s of ITEM_SLOTS) {
        const choices = [...owned].filter((i) => itemById(i)?.slot === s).sort();
        if (choices.length > 0 && next() < 0.65) outfit[s] = choices[Math.floor(next() * choices.length)];
      }
      if (Object.keys(outfit).length === 0) continue;
      await this.setOutfit.execute(id, outfit);
      this.count(ctx.done, 'outfits');
    }
  }

  /** Inscriptions « Ouvre ton quartier », confirmées, datées sur trois semaines ; un ou deux quartiers ouverts. */
  private async seedQuartiers(ctx: RunContext): Promise<void> {
    for (const z of ctx.plan.zones) {
      const existed = await this.quartiers.findZone(z.zone);
      await this.quartiers.ensureZone(z.zone, SEED_ZONE_CREATED_AT);
      for (const s of z.signups) {
        const createdAt = new Date(this.timeOf(ctx, s.createdDaysAgo, s.minute)).toISOString();
        const confirmedAt = new Date(Date.parse(createdAt) + s.confirmAfter * 60_000).toISOString();
        const invitedBy = s.invitedBy !== null ? (z.signups[s.invitedBy]?.id ?? null) : null;
        const created = await this.quartiers.createSignup({
          id: s.id,
          zone: z.zone,
          email: s.email,
          locale: s.locale,
          code: s.code,
          token: s.token,
          invitedByUser: null,
          invitedBySignup: invitedBy,
          consentAt: createdAt,
          confirmedAt,
          unsubscribedAt: null,
          openMailSentAt: null,
          userId: null,
          createdAt,
        });
        this.count(created ? ctx.done : ctx.refused, 'signups');
      }
      this.count(ctx.done, 'zones');
      // Un quartier qui existait avant le semis n'est jamais ouvert par lui (la purge ne saurait pas le refermer).
      if (z.open && !existed && (await this.quartiers.open(z.zone, new Date(ctx.base - 3_600_000).toISOString(), z.open))) {
        const founders = foundersOf(await this.quartiers.invitesOf(z.zone), FOUNDERS_PER_ZONE).map((key, i) => ({
          zone: z.zone,
          rank: i + 1,
          userId: key.startsWith('u:') ? key.slice(2) : null,
          signupId: key.startsWith('s:') ? key.slice(2) : null,
        }));
        await this.quartiers.setFounders(z.zone, founders, new Date(ctx.base).toISOString());
        this.count(ctx.done, 'openedZones');
      }
    }
  }

  // ── Purge ──────────────────────────────────────────────────────────────────

  /** Supprime tout ce que le semis a créé, et seulement cela (mêmes garde-fous). */
  async purge(source: EnvSource): Promise<PurgeReport> {
    await this.assertAllowed(source);
    // Seulement les comptes qui portent les deux marques : adresse du semis et identifiant du semis.
    const ids = (await this.store.seedAccountIds()).filter(isSeedId);
    const detached = await this.store.detachFromWorld(SEED_WORLD_ID, isSeedId);
    const groups = await this.store.removeGroupsCreatedBy(ids);
    const signups = await this.store.removeSeedSignups();
    const zones = await this.store.removeEmptySeedZones(SEED_ZONE_CREATED_AT);
    // Le monde en dernier : sa suppression emporterait en cascade tout profil encore rattaché.
    for (const id of ids.filter((x) => x !== SEED_WORLD_ID)) await this.store.removeAccount(id);
    if (ids.includes(SEED_WORLD_ID)) await this.store.removeAccount(SEED_WORLD_ID);
    const report = { accounts: ids.filter((x) => x !== SEED_WORLD_ID).length, groups, signups, zones, detached };
    this.logger.log(`semis purgé : ${JSON.stringify(report)}`);
    return report;
  }

  // ── Rattachement d'un compte de test ───────────────────────────────────────

  /**
   * Rattache des comptes de test (adresses données) au monde du semis : ils voient alors les comptes du semis
   * (rencontres, carte, coucous) ; la purge les rend ensuite à tout le monde. Jamais le compte de revue d'Apple.
   */
  async adopt(emails: readonly string[], source: EnvSource): Promise<{ adopted: string[]; missing: string[] }> {
    await this.assertAllowed(source);
    if (!(await this.store.seedAccountIds()).includes(SEED_WORLD_ID)) throw new SeedRefused(['Pas de semis dans cette base : lance d’abord le semis.']);
    const adopted: string[] = [];
    const missing: string[] = [];
    for (const email of emails) {
      const id = await this.store.accountIdByEmail(email);
      if (!id || isSeedEmail(email) || !(await this.adoptUser(id))) missing.push(email);
      else adopted.push(email);
    }
    return { adopted, missing };
  }

  /** Rattache un compte existant (hors compte de revue et ses personnes fictives) ; faux sinon. */
  async adoptUser(userId: string): Promise<boolean> {
    const profile = await this.profiles.findById(userId);
    if (!profile || (profile.reviewWorld && profile.reviewWorld !== SEED_WORLD_ID)) return false;
    if (profile.reviewWorld !== SEED_WORLD_ID) await this.profiles.update(userId, { reviewWorld: SEED_WORLD_ID });
    await this.matchCache.clear(userId);
    return true;
  }
}
