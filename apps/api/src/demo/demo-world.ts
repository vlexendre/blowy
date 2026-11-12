import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { type Clock, todayOf } from '../shared/clock';
import type { Ids } from '../shared/ids';
import { itemById } from '@blowy/domain';
import { CLOCK, IDS, PET_ITEMS, PETS, PROFILES } from '../shared/tokens';
import { Wave } from '../modules/encounters/application/wave.usecase';
import { CreateLink } from '../modules/links/application/create-link.usecase';
import { SendMessage } from '../modules/links/application/send-message.usecase';
import type { OnboardedHook, ProfilesRepository } from '../modules/me/ports';
import { Wardrobe } from '../modules/pets/application/wardrobe';
import type { PetItemsRepository, PetsRepository } from '../modules/pets/ports';
import { DEMO_LEA, DEMO_MALO, DEMO_MALO_MESSAGES, DEMO_PEOPLE, DEMO_SASHA } from './demo';

/**
 * Remplit la base mémoire au démarrage (Léa, Malo, Sasha ; Malo et Sasha sont liés) et anime l'arrivée
 * d'une nouvelle personne : Léa la salue, Malo se lie avec elle et lui écrit. Chaque écran a ainsi des données.
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
        city: p.city,
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
        createdAt: now,
      });
      // Objets de la tenue offerts (achetés pour les premium), puis ceux de départ.
      const worn = Object.values(p.outfit).map((itemId) => ({ itemId, source: itemById(itemId)?.unlock.kind === 'premium' ? ('purchase' as const) : ('milestone' as const) }));
      await this.items.addMany(petId, worn, now);
      await this.wardrobe.sync(p.id);
    }
    await this.createLink.execute({ by: DEMO_MALO, with: DEMO_SASHA });
    this.logger.log('monde de démo prêt : Léa, Malo et Sasha');
  }

  async onOnboarded(userId: string): Promise<void> {
    if (DEMO_PEOPLE.some((p) => p.id === userId)) return;
    await this.refreshNeeds();
    await this.wave.execute(DEMO_LEA, userId);
    const link = await this.createLink.execute({ by: DEMO_MALO, with: userId });
    for (const m of DEMO_MALO_MESSAGES) await this.sendMessage.execute({ linkId: link.id, userId: DEMO_MALO, body: m.body, tone: m.tone });
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
