import { Inject, Injectable, Logger } from '@nestjs/common';
import type { OnboardBody } from '@blowy/contract';
import { facturationText, textOf, visionText, welcomeEmail } from '@blowy/content';
import { GAUGE_KEYS, type Gauges, MIN_AGE, START_NEEDS, ZERO_GAUGES, ageOn, clampGauge, cleanPetName } from '@blowy/domain';
import type { Env } from '../../../config/env';
import { Notifier } from '../../../integrations/mailer/notifier';
import { type Clock, todayOf } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { CLOCK, ENV, IDS, ONBOARDED_HOOK, PETS, PROFILES } from '../../../shared/tokens';
import { CreateLink } from '../../links/application/create-link.usecase';
import { Bans } from '../../retention/application/bans';
import { PetCharacter } from '../../pets/application/pet-character';
import { Wardrobe } from '../../pets/application/wardrobe';
import type { PetsRepository } from '../../pets/ports';
import { DEFAULT_IDENTITY, type IdentityState, applyIdentity } from '../../vision/application/identity';
import { Locations } from '../../vision/application/locations';
import { VisionRecorder } from '../../vision/application/vision-recorder';
import { checkAnswers } from '../../vision/application/vision.usecases';
import type { OnboardedHook, Profile, ProfilesRepository } from '../ports';

export interface OnboardInput {
  userId: string;
  email: string | null;
  body: OnboardBody;
}

const CODE_ATTEMPTS = 8;

/**
 * Création du profil et du pet. Ordre choisi pour rester cohérent sans transaction :
 * profil, puis pet (un profil sans pet est repris au prochain essai), puis le reste (best effort).
 */
@Injectable()
export class Onboard {
  private readonly logger = new Logger('Onboard');

  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(PetCharacter) private readonly character: PetCharacter,
    @Inject(Wardrobe) private readonly wardrobe: Wardrobe,
    @Inject(CreateLink) private readonly createLink: CreateLink,
    @Inject(Notifier) private readonly notifier: Notifier,
    @Inject(ONBOARDED_HOOK) private readonly hook: OnboardedHook,
    @Inject(Locations) private readonly locations: Locations,
    @Inject(VisionRecorder) private readonly vision: VisionRecorder,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(ENV) private readonly env: Env,
    @Inject(Bans) private readonly bans: Bans,
  ) {}

  async execute({ userId, email, body }: OnboardInput): Promise<void> {
    const today = todayOf(this.clock);
    if (ageOn(body.birthdate, today) < MIN_AGE) throw new DomainError('too_young');
    const existing = await this.profiles.findById(userId);
    if (existing && (await this.pets.findByOwner(userId))) throw new DomainError('already_onboarded');
    // Exclusion définitive : même identifiant Apple ou Google qu'un compte exclu il y a moins de 3 ans.
    if (await this.bans.isBanned(userId)) throw new DomainError('forbidden', textOf(facturationText, (t) => t.moderation.banned));
    // Tout est vérifié avant d'écrire quoi que ce soit.
    // Le test se passe avant le compte ; sans réponses, l'inscription passe et `Me.visionTestDone` vaut faux.
    checkAnswers(body.visionAnswers, true);
    const nowIso = this.clock.now().toISOString();
    const identity = applyIdentity(DEFAULT_IDENTITY, { gender: body.gender, seeking: body.seeking, whom: body.whom ?? null, sensitiveConsent: body.consents.sensitive || undefined }, nowIso);
    if (body.location && !body.consents.location) throw new DomainError('invalid', textOf(visionText, (t) => t.errors.locationConsent));

    const profile = existing
      ? await this.profiles.update(userId, { ...identity, locale: body.locale, ...(body.consents.location && !existing.locationConsentAt ? { locationConsentAt: nowIso } : {}) })
      : await this.createProfile(userId, body, identity);
    // Vision et position avant le pet : refaits à l'identique si l'inscription est reprise.
    if (body.visionAnswers.length > 0) await this.vision.answerTest(userId, body.visionAnswers);
    if (body.location) await this.locations.record(userId, { lat: body.location.latitude, lng: body.location.longitude }, true);
    const petName = cleanPetName(body.pet.name);
    if (!petName) throw new DomainError('invalid', errorText('petNameEmpty'));
    const gauges = startingGauges(body.quiz);
    const now = this.clock.now().toISOString();
    await this.pets.create({
      id: this.ids.uuid(),
      ownerId: userId,
      name: petName,
      species: body.pet.species,
      gauges: ZERO_GAUGES,
      decayedOn: today,
      needs: START_NEEDS,
      needsAt: now,
      careDays: 0,
      lastCareOn: null,
      bestStreak: 0,
      outfit: {},
      renamedAt: null,
      createdAt: now,
    });
    await this.character.apply(userId, 'quiz', { extra: gauges });
    // Objets de départ, avant tout lien : ils ne sont pas « nouveaux » à la première vue du pet.
    await this.wardrobe.sync(userId);

    if (body.inviteCode) await this.joinInviter(userId, body.inviteCode.trim().toUpperCase());
    if (!profile.welcomeSentAt) {
      const sent = await this.notifier.notify(userId, welcomeEmail(profile.locale, { displayName: profile.displayName, petName, appUrl: this.env.webUrl }), email);
      if (sent) await this.profiles.update(userId, { welcomeSentAt: this.clock.now().toISOString() });
    }
    try {
      await this.hook.onOnboarded(userId);
    } catch (err) {
      this.logger.warn(`suite de l'inscription non faite : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }

  private async createProfile(userId: string, body: OnboardBody, identity: IdentityState): Promise<Profile> {
    const now = this.clock.now().toISOString();
    const profile: Profile = {
      id: userId,
      displayName: body.displayName,
      birthdate: body.birthdate,
      ...identity,
      locale: body.locale,
      discreet: false,
      locationConsentAt: body.consents.location ? now : null,
      avatarPath: null,
      inviteCode: await this.freshCode(),
      wordsCode: await this.freshCode(),
      plusUntil: null,
      welcomeSentAt: null,
      createdAt: this.clock.now().toISOString(),
    };
    await this.profiles.create(profile);
    return profile;
  }

  private async freshCode(): Promise<string> {
    for (let i = 0; i < CODE_ATTEMPTS; i++) {
      const code = this.ids.code();
      if (!(await this.profiles.codeTaken(code))) return code;
    }
    throw new Error('aucun code libre trouvé');
  }

  /** Un code d'invitation invalide n'empêche pas l'inscription : il est simplement ignoré. */
  private async joinInviter(userId: string, code: string): Promise<void> {
    const inviter = await this.profiles.findByInviteCode(code);
    if (!inviter || inviter.id === userId) return;
    try {
      await this.createLink.execute({ by: userId, with: inviter.id, notify: inviter.id });
    } catch (err) {
      this.logger.warn(`lien d'invitation non créé : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }
}

/** Jauges de départ = résultat du quiz, bornées. */
function startingGauges(quiz: Partial<Gauges>): Partial<Gauges> {
  const out: Partial<Gauges> = {};
  for (const k of GAUGE_KEYS) {
    const v = quiz[k];
    if (v !== undefined && v !== 0) out[k] = clampGauge(v);
  }
  return out;
}
