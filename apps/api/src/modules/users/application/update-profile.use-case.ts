/** Commande me.update_profile : profil + date de naissance (18+ serveur, figée après onboarding). */
import type { UpdateProfileRequest } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { MIN_AGE, ageOn, localCivilDate, parseCivilDate } from '../domain/age.js';
import type { UserProfileRepository } from './ports/user-profile.repository.js';

export class UpdateProfileUseCase {
  constructor(
    private readonly bus: CommandBus,
    private readonly repo: UserProfileRepository,
  ) {}

  async execute(actorId: string, commandId: string, req: UpdateProfileRequest) {
    if (req.timezone && !isValidTimeZone(req.timezone)) throw Errors.validation({ field: 'timezone' });
    if (req.zoneCode && !(await this.repo.zoneExists(req.zoneCode))) throw Errors.validation({ field: 'zoneCode' });
    return this.bus.execute({
      actorId,
      operation: 'me.update_profile',
      commandId,
      payload: req,
      handle: async (scope) => {
        await scope.lock.users([actorId]);
        const u = await this.repo.load(actorId, scope.now);
        if (!u) throw Errors.notFound('Utilisateur');
        let birthDate: Date | undefined;
        if (req.birthDate) {
          if (u.onboardedAt && u.birthDate) throw Errors.precondition('BIRTHDATE_LOCKED');
          const b = parseCivilDate(req.birthDate);
          if (!b) throw Errors.validation({ field: 'birthDate' });
          const age = ageOn(b, localCivilDate(scope.now, req.timezone ?? u.timezone));
          if (age < MIN_AGE) throw new AppError('AGE_RESTRICTED', 'Blowy est réservé aux personnes majeures');
          if (age > 120) throw Errors.validation({ field: 'birthDate' });
          birthDate = new Date(Date.UTC(b.y, b.m - 1, b.d));
        }
        await this.repo.patchProfile(scope, actorId, { ...req, birthDate });
        return { ok: true };
      },
    });
  }
}

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
