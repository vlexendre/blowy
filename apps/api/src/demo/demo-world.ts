import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { type Clock, todayOf } from '../shared/clock';
import type { Ids } from '../shared/ids';
import { CLOCK, IDS, PETS, PROFILES } from '../shared/tokens';
import { Wave } from '../modules/encounters/application/wave.usecase';
import { CreateLink } from '../modules/links/application/create-link.usecase';
import { SendMessage } from '../modules/links/application/send-message.usecase';
import type { OnboardedHook, ProfilesRepository } from '../modules/me/ports';
import type { PetsRepository } from '../modules/pets/ports';
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
      await this.pets.create({ id: this.ids.uuid(), ownerId: p.id, ...p.pet, decayedOn: todayOf(this.clock), createdAt: now });
    }
    await this.createLink.execute({ by: DEMO_MALO, with: DEMO_SASHA });
    this.logger.log('monde de démo prêt : Léa, Malo et Sasha');
  }

  async onOnboarded(userId: string): Promise<void> {
    if (DEMO_PEOPLE.some((p) => p.id === userId)) return;
    await this.wave.execute(DEMO_LEA, userId);
    const link = await this.createLink.execute({ by: DEMO_MALO, with: userId });
    for (const m of DEMO_MALO_MESSAGES) await this.sendMessage.execute({ linkId: link.id, userId: DEMO_MALO, body: m.body, tone: m.tone });
  }
}
