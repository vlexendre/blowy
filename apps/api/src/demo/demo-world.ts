import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { type Clock, todayOf } from '../shared/clock';
import type { Ids } from '../shared/ids';
import { VISION_AXES, type VisionSignal, itemById } from '@blowy/domain';
import { CLOCK, ENCOUNTERS, IDS, PET_ITEMS, PETS, PROFILES } from '../shared/tokens';
import { AnswerEncounter } from '../modules/encounters/application/answer-encounter.usecase';
import { Wave } from '../modules/encounters/application/wave.usecase';
import type { EncountersRepository } from '../modules/encounters/ports';
import { CreateLink } from '../modules/links/application/create-link.usecase';
import { SendMessage } from '../modules/links/application/send-message.usecase';
import type { OnboardedHook, ProfilesRepository } from '../modules/me/ports';
import { Wardrobe } from '../modules/pets/application/wardrobe';
import type { PetItemsRepository, PetsRepository } from '../modules/pets/ports';
import { Locations } from '../modules/vision/application/locations';
import { VISION_SIGNALS, type VisionSignals } from '../modules/vision/tokens';
import { DEMO_LEA, DEMO_MALO, DEMO_MALO_MESSAGES, DEMO_PEOPLE, DEMO_SASHA } from './demo';

/**
 * Remplit la base mémoire au démarrage (Léa, Malo, Sasha et cinq autres autour de Paris, aux visions variées,
 * avec leur position ; Malo et Sasha sont liés) et anime l'arrivée
 * d'une nouvelle personne : Léa la salue (coucou à accepter), Malo l'a saluée et c'est accepté (le lien
 * s'ouvre et il écrit ; l'historique des rencontres n'est pas vide). Chaque écran a ainsi des données.
 */
@Injectable()
export class DemoWorld implements OnApplicationBootstrap, OnboardedHook {
  private readonly logger = new Logger('Démo');

  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(PET_ITEMS) private readonly items: PetItemsRepository,
    @Inject(Wardrobe) private readonly wardrobe: Wardrobe,
    @Inject(CreateLink) private readonly createLink: CreateLink,
    @Inject(SendMessage) private readonly sendMessage: SendMessage,
    @Inject(Wave) private readonly wave: Wave,
    @Inject(AnswerEncounter) private readonly answer: AnswerEncounter,
    @Inject(ENCOUNTERS) private readonly encounters: EncountersRepository,
    @Inject(Locations) private readonly locations: Locations,
    @Inject(VISION_SIGNALS) private readonly vision: VisionSignals,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const now = this.clock.now().toISOString();
    for (const p of DEMO_PEOPLE) {
      if (await this.profiles.findById(p.id)) continue;
      await this.profiles.create({
        id: p.id,
        displayName: p.displayName,
        birthdate: p.birthdate,
        gender: p.identity.gender,
        seeking: p.identity.seeking,
        whom: p.identity.whom,
        locale: 'fr',
        discreet: p.identity.discreet,
        sensitiveConsentAt: p.identity.whom ? now : null,
        locationConsentAt: p.place ? now : null,
        avatarPath: null,
        inviteCode: p.inviteCode,
        wordsCode: p.wordsCode,
        plusUntil: null,
        welcomeSentAt: now,
        createdAt: now,
      });
      const petId = this.ids.uuid();
      await this.pets.create({
        id: petId,
        ownerId: p.id,
        ...p.pet,
        decayedOn: todayOf(this.clock),
        needs: p.needs,
        needsAt: now,
        careDays: 0,
        lastCareOn: null,
        bestStreak: 0,
        outfit: p.outfit,
        renamedAt: null,
        createdAt: now,
      });
      // Objets de la tenue offerts (achetés pour les premium), puis ceux de départ.
      const worn = Object.values(p.outfit).map((itemId) => ({ itemId, source: itemById(itemId)?.unlock.kind === 'premium' ? ('purchase' as const) : ('milestone' as const) }));
      await this.items.addMany(petId, worn, now);
      await this.wardrobe.sync(p.id);
      // Vision : 2 réponses de test et 3 questions du jour par axe (confiance moyenne), puis la position.
      const signals: VisionSignal[] = VISION_AXES.flatMap((axis) =>
        [...Array<'test'>(2).fill('test'), ...Array<'daily'>(3).fill('daily')].map((source) => ({ axis, value: p.vision[axis], source, at: now })),
      );
      await this.vision.record(p.id, signals);
      if (p.place) await this.locations.record(p.id, p.place, true);
    }
    await this.createLink.execute({ by: DEMO_MALO, with: DEMO_SASHA });
    this.logger.log(`monde de démo prêt : ${DEMO_PEOPLE.map((p) => p.displayName).join(', ')}`);
  }

  async onOnboarded(userId: string): Promise<void> {
    if (DEMO_PEOPLE.some((p) => p.id === userId)) return;
    await this.refreshNeeds();
    // Chaque geste est indépendant : la personne a pu s'inscrire avec le code de Léa ou de Malo (déjà liés).
    await this.attempt('coucou de Léa', () => this.wave.execute(DEMO_LEA, userId));
    // Rencontre déjà acceptée avec Malo (refusée si la personne est arrivée par le code de Malo : déjà liés).
    await this.attempt('rencontre avec Malo', async () => {
      await this.wave.execute(DEMO_MALO, userId);
      const encounter = await this.encounters.findPair(DEMO_MALO, userId);
      if (encounter) await this.answer.accept(encounter.id, userId);
    });
    await this.attempt('lien avec Malo', async () => {
      const link = await this.createLink.execute({ by: DEMO_MALO, with: userId });
      for (const m of DEMO_MALO_MESSAGES) await this.sendMessage.execute({ linkId: link.id, userId: DEMO_MALO, body: m.body, tone: m.tone });
    });
  }

  private async attempt(what: string, run: () => Promise<unknown>): Promise<void> {
    try {
      await run();
    } catch (err) {
      this.logger.log(`${what} ignoré : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }

  /** Les pets de démo ne finissent jamais par bouder (Suzie doit pouvoir saluer les nouveaux venus). */
  private async refreshNeeds(): Promise<void> {
    const now = this.clock.now().toISOString();
    const pets = await this.pets.findByOwners(DEMO_PEOPLE.map((p) => p.id));
    for (const person of DEMO_PEOPLE) {
      const pet = pets.find((p) => p.ownerId === person.id);
      if (pet) await this.pets.saveNeeds(pet.id, person.needs, now);
    }
  }
}
