/**
 * « Viens avec ta team » (V5.1 B.7) : 1 à 3 personnes d'une même ville, invitation par lien
 * (code aléatoire), une team active par personne (index unique partiel). Dans une ville fermée,
 * une team de 3 vérifiés est éligible à une sortie d'amorçage (job `outings.seeding`).
 */
import { TEAM_SIZE_CAP } from '@blowy/domain';
import type { TeamView } from '@blowy/api-contract';
import type { Tuning } from '@blowy/tuning';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { Clock, RandomSource } from '../../../shared/application/clock.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import type { OutingsRepository, TeamRow } from './ports/outings.repository.js';

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Accepte le code seul ou l'URL d'invitation complète. */
export const inviteCodeOf = (ref: string) => ref.trim().split('/').filter(Boolean).at(-1) ?? '';

export class TeamUseCases {
  constructor(
    private readonly repo: OutingsRepository,
    private readonly bus: CommandBus,
    private readonly clock: Clock,
    private readonly random: RandomSource,
    private readonly tuning: Tuning,
    private readonly publicWebOrigin: string,
  ) {}

  private code(): string {
    const hex = this.random.hex(12);
    let out = '';
    for (let i = 0; i < 12; i++) out += CODE_ALPHABET[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % CODE_ALPHABET.length];
    return out;
  }

  private async view(t: TeamRow, me: string): Promise<TeamView> {
    const closed = await this.repo.cityClosed(t.cityZoneId);
    return {
      id: t.id,
      status: t.status,
      members: t.members.map((m) => ({ userId: m.userId, firstName: m.firstName, pet: m.pet, verified: m.verified, me: m.userId === me })),
      seedingEligible: closed && t.members.filter((m) => m.verified).length >= this.tuning.outings.seeding.triggerTeamSize,
      createdAt: t.createdAt.toISOString(),
    };
  }

  inviteUrl(t: TeamRow) {
    return `${this.publicWebOrigin.replace(/\/$/, '')}/team/${t.inviteCode}`;
  }

  async mine(userId: string) {
    const t = await this.repo.teamOf(null, userId);
    if (!t) throw Errors.notFound('Team');
    return { team: await this.view(t, userId), inviteUrl: this.inviteUrl(t) };
  }

  async create(userId: string, commandId: string) {
    const r = await this.repo.requester(null, userId, this.clock.now());
    if (!r?.neighborhood) throw Errors.precondition('ONBOARDING_INCOMPLETE', { missing: ['NEIGHBORHOOD'] });
    const zoneId = r.neighborhood.cityZoneId;
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'teams.create',
      commandId,
      payload: {},
      handle: async (scope) => {
        await scope.lock.users([userId]);
        if (await this.repo.teamOf(scope, userId)) throw new AppError('CONFLICT', 'Déjà dans une team', { detailsSafe: { reason: 'ALREADY_IN_TEAM' } });
        const id = this.random.uuid();
        await this.repo.createTeam(scope, { id, cityZoneId: zoneId, createdById: userId, inviteCode: this.code() });
        await this.repo.addTeamMember(scope, id, userId);
        return { teamId: id };
      },
    });
    const t = (await this.repo.teamById(null, result.teamId))!;
    return { team: await this.view(t, userId), inviteUrl: this.inviteUrl(t) };
  }

  async join(userId: string, inviteRef: string, commandId: string) {
    const code = inviteCodeOf(inviteRef);
    const found = await this.repo.teamByCode(null, code);
    if (!found || found.status === 'DISSOLVED') throw Errors.precondition('TEAM_INVITE_INVALID');
    const r = await this.repo.requester(null, userId, this.clock.now());
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'teams.join',
      commandId,
      payload: { code },
      handle: async (scope) => {
        await scope.lock.users([userId, ...found.members.map((m) => m.userId)]);
        await scope.lock.teams([found.id]);
        const t = await this.repo.teamById(scope, found.id);
        if (!t || t.status === 'DISSOLVED') throw Errors.precondition('TEAM_INVITE_INVALID');
        if (t.members.some((m) => m.userId === userId)) return { teamId: t.id };
        if (await this.repo.teamOf(scope, userId)) throw new AppError('CONFLICT', 'Déjà dans une team', { detailsSafe: { reason: 'ALREADY_IN_TEAM' } });
        if (t.members.length >= TEAM_SIZE_CAP) throw new AppError('CONFLICT', 'Team complète', { detailsSafe: { reason: 'TEAM_FULL' } });
        if (!r?.neighborhood || r.neighborhood.cityZoneId !== t.cityZoneId) throw Errors.precondition('NOT_SAME_CITY');
        if (await this.repo.teamHasActiveSeat(scope, t.id, scope.now)) throw Errors.precondition('TEAM_LOCKED_IN_OUTING');
        await this.repo.addTeamMember(scope, t.id, userId);
        if (t.members.length + 1 >= 2 && t.status === 'FORMING') await this.repo.setTeamStatus(scope, t.id, 'ACTIVE');
        await scope.outbox.emit({ topic: 'team.member_joined', aggregateType: 'Team', aggregateId: t.id, payload: { teamId: t.id, userIds: [...t.members.map((m) => m.userId), userId] } });
        return { teamId: t.id };
      },
    });
    const t = (await this.repo.teamById(null, result.teamId))!;
    return { team: await this.view(t, userId), inviteUrl: this.inviteUrl(t) };
  }

  async leave(userId: string, teamId: string, commandId: string): Promise<{ left: true }> {
    const t0 = await this.repo.teamById(null, teamId);
    if (!t0 || !t0.members.some((m) => m.userId === userId)) throw Errors.notFound('Team');
    await this.bus.execute({
      actorId: userId,
      operation: 'teams.leave',
      commandId,
      payload: { teamId },
      handle: async (scope) => {
        await scope.lock.users(t0.members.map((m) => m.userId));
        await scope.lock.teams([teamId]);
        const t = await this.repo.teamById(scope, teamId);
        if (!t || !t.members.some((m) => m.userId === userId)) return { left: true };
        await this.repo.leaveTeam(scope, teamId, userId);
        const left = t.members.length - 1;
        await this.repo.setTeamStatus(scope, teamId, left === 0 ? 'DISSOLVED' : left === 1 ? 'FORMING' : 'ACTIVE');
        return { left: true };
      },
    });
    return { left: true };
  }
}
