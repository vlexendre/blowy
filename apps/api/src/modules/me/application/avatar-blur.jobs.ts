/**
 * Travail planifié (`modules/tick/jobs.ts`), idempotent : vignettes floues des photos de profil qui n'en ont pas encore
 * (photos envoyées avant l'item 26, ou vignette ratée à l'envoi). Parcourt les profils avec photo par pages, dans
 * l'ordre des identifiants ; une vignette existante n'est pas refaite. Une passe finie, le parcours se repose 24 h.
 * Le curseur vit en mémoire : un redémarrage relance une passe, sans effet de bord (seulement des vérifications).
 */
import { Inject, Injectable } from '@nestjs/common';
import { PROFILES } from '../../../shared/tokens';
import type { ProfilesRepository } from '../ports';
import { AvatarBlurs } from './avatar-blurs';

/** Profils examinés par passage du minuteur (toutes les 5 min). */
const CHECKED_PER_TICK = 100;
/** Vignettes fabriquées au plus par passage (lecture de la photo, calcul, écriture). */
const MADE_PER_TICK = 20;
const REST_MS = 24 * 3_600_000;

@Injectable()
export class AvatarBlurJobs {
  private cursor: string | null = null;
  private restUntil = 0;

  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(AvatarBlurs) private readonly blurs: AvatarBlurs,
  ) {}

  async runDue(now: Date, deadline?: number): Promise<number> {
    if (now.getTime() < this.restUntil) return 0;
    const page = await this.profiles.listAvatarsAfter(this.cursor, CHECKED_PER_TICK);
    let made = 0;
    let seen = 0;
    for (const p of page) {
      if (made >= MADE_PER_TICK || (deadline !== undefined && Date.now() >= deadline)) break;
      if (p.avatarPath && (await this.blurs.ensure(p.avatarPath)) === 'made') made += 1;
      this.cursor = p.id;
      seen += 1;
    }
    if (seen === page.length && page.length < CHECKED_PER_TICK) {
      this.cursor = null;
      this.restUntil = now.getTime() + REST_MS;
    }
    return made;
  }
}
