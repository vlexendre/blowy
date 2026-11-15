/**
 * Démo (mode mémoire) du chantier « plateforme » : Malo et Sasha ont dit oui à la lecture par l'IA dans leur lien,
 * et Malo dit oui dans le lien avec chaque nouvelle personne. Il suffit que la personne accepte à son tour
 * (première ouverture du chat) pour voir les minimoas réagir (modèle mémoire, déterministe, sans clé).
 * Un appareil fictif n'est pas enregistré : les push de démo partent vers l'appareil réel s'il s'enregistre.
 */
import { Inject, Injectable } from '@nestjs/common';
import { LINKS } from '../shared/tokens';
import { ChatMinimoas } from '../modules/links/minimoas/chat-minimoas';
import type { LinksRepository } from '../modules/links/ports';
import { DEMO_MALO, DEMO_SASHA } from './demo';

@Injectable()
export class PlateformeDemo {
  constructor(
    @Inject(ChatMinimoas) private readonly minimoas: ChatMinimoas,
    @Inject(LINKS) private readonly links: LinksRepository,
  ) {}

  /** Au démarrage : accord des deux dans le lien Malo–Sasha. */
  async seed(): Promise<void> {
    const [a, b] = DEMO_MALO < DEMO_SASHA ? [DEMO_MALO, DEMO_SASHA] : [DEMO_SASHA, DEMO_MALO];
    const link = await this.links.findBetween(a, b);
    if (!link) return;
    await this.minimoas.update(link.id, DEMO_MALO, { consent: true });
    await this.minimoas.update(link.id, DEMO_SASHA, { consent: true });
  }

  /** À l'inscription : Malo a déjà dit oui dans son lien avec la nouvelle personne. */
  async welcome(linkId: string): Promise<void> {
    await this.minimoas.update(linkId, DEMO_MALO, { consent: true });
  }
}
