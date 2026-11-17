import { Inject, Injectable } from '@nestjs/common';
import type { AttributionDto, CodeLookup } from '@blowy/contract';
import { type AcquisitionSource, type Attribution, isCreatorCode, isQuizCode, isSignupCode, normalizeCode, resolveAttribution } from '@blowy/domain';
import { PROFILES } from '../../../shared/tokens';
import type { GroupsRepository } from '../../groups/ports';
import { GROUPS } from '../../groups/tokens';
import type { ProfilesRepository } from '../../me/ports';
import { Audience } from '../../safety/application/audience';
import { CREATORS, type CreatorsRepository } from '../ports';
import { QUARTIERS, QUIZ_RESULTS, type QuartiersRepository, type QuizResultsRepository } from '../../quartiers/ports';

/** Ce que sont les codes (créateur, invitation, « 3 mots », groupe) et d'où vient un compte. */
@Injectable()
export class Codes {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(CREATORS) private readonly creators: CreatorsRepository,
    @Inject(GROUPS) private readonly groups: GroupsRepository,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(QUIZ_RESULTS) private readonly quiz: QuizResultsRepository,
    @Inject(QUARTIERS) private readonly quartiers: QuartiersRepository,
  ) {}

  /**
   * Un code tapé ou lu dans un lien. Le créateur d'abord (codes gérés par l'équipe), puis une invitation, un lien
   * « 3 mots », un groupe. Compte suspendu, groupe fermé, créateur inactif : inconnu.
   */
  async lookup(raw: string): Promise<CodeLookup | null> {
    const code = normalizeCode(raw);
    // Résultat du quiz du site (`Q…`) ou inscription « Ouvre ton quartier » (`N…`) : formes à part, sans libellé.
    if (isQuizCode(code) && (await this.quiz.find(code))) return { kind: 'quiz', code, label: null };
    if (isSignupCode(code) && (await this.quartiers.findSignup({ code }))) return { kind: 'quartier', code, label: null };
    if (isCreatorCode(code)) {
      const c = await this.creators.find(code);
      if (c?.active) return { kind: 'creator', code, label: c.name };
    }
    const inviter = await this.audience.publiclyVisible(await this.profiles.findByInviteCode(code));
    if (inviter && !inviter.reviewWorld) return { kind: 'invite', code, label: inviter.displayName };
    const owner = await this.audience.publiclyVisible(await this.profiles.findByWordsCode(code));
    if (owner && !owner.reviewWorld) return { kind: 'words', code, label: owner.displayName };
    const group = await this.groups.findByInviteCode(code);
    if (group && group.status !== 'closed') return { kind: 'group', code, label: group.name };
    return null;
  }

  /** La source d'un compte à son inscription : invitation valide, sinon le premier lien ouvert ou le code tapé. */
  async attribution(userId: string, input: { inviteCode?: string; attribution?: AttributionDto }): Promise<Attribution> {
    const inviter = input.inviteCode ? await this.profiles.findByInviteCode(normalizeCode(input.inviteCode)) : null;
    const claimed = input.attribution ? { source: input.attribution.source as AcquisitionSource, ref: input.attribution.ref ? normalizeCode(input.attribution.ref) : null } : null;
    const ref = claimed?.ref ?? null;
    const [creator, owner, group, quiz, signup] = await Promise.all([
      claimed?.source === 'creator' && ref && isCreatorCode(ref) ? this.creators.find(ref) : null,
      claimed?.source === 'words' && ref ? this.profiles.findByWordsCode(ref) : null,
      claimed?.source === 'group' && ref ? this.groups.findByInviteCode(ref) : null,
      claimed?.source === 'quiz' && ref && isQuizCode(ref) ? this.quiz.find(ref) : null,
      claimed?.source === 'quartier' && ref && isSignupCode(ref) ? this.quartiers.findSignup({ code: ref }) : null,
    ]);
    // Inscription au quartier reprise : son objet de fondateur suit le compte.
    if (signup && !signup.userId) await this.quartiers.updateSignup(signup.id, { userId });
    return resolveAttribution(
      {
        claimed,
        inviterId: inviter && !inviter.reviewWorld ? inviter.id : null,
        creatorCode: creator?.active ? creator.code : null,
        wordsOwnerId: owner && !owner.reviewWorld ? owner.id : null,
        groupId: group && group.status !== 'closed' ? group.id : null,
        quizCode: quiz?.code ?? null,
        signupCode: signup?.code ?? null,
      },
      userId,
    );
  }
}
