/**
 * V5.4 (A.6, D-049, spec-v5 §4.5) — « éviter les personnes que je connais » : opt-in EXPLICITE, proposé avant
 * la 1ʳᵉ composition (`askBeforeFirstOuting`), expliqué. Protocole `oprf-p256-v1` (domaine `contact-avoidance.ts`) :
 * le serveur ne reçoit jamais un numéro de contact ni son condensé ; il ne garde que le condensé du numéro
 * VÉRIFIÉ de la personne et les paires à éviter (`AvoidPair`). Aucune des deux personnes n'est informée ; aucun
 * retour de correspondance ; rien n'est journalisé (ni jetons, ni nombre de correspondances).
 * Retrait = consentement retiré + numéro et paires effacés.
 */
import { createHmac } from 'node:crypto';
import { CONTACT_AVOIDANCE_MAX_BATCH, type ContactAvoidanceStatus } from '@blowy/api-contract';
import type { CommandBus } from '../../../shared/application/command-bus.js';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { AppError, Errors } from '../../../shared/domain/errors.js';
import { CONTACT_PROTOCOL, digestOfToken, evaluateBlinded, tokenForNumber } from '../domain/contact-avoidance.js';

export const CONTACT_AVOIDANCE_PURPOSE = 'CONTACT_AVOIDANCE';
export const CONTACT_AVOIDANCE_CONSENT_VERSION = '2026-11';

export interface ContactAvoidanceRepository {
  /** Dernier consentement `CONTACT_AVOIDANCE` (null = jamais répondu). */
  consent(userId: string): Promise<boolean | null>;
  hasPhone(userId: string): Promise<boolean>;
  /** La personne a-t-elle déjà eu une place de sortie (même déclinée) ? */
  hasEverBeenInvited(userId: string): Promise<boolean>;
  recordConsent(scope: TxScope, userId: string, granted: boolean): Promise<void>;
  /** Enregistre le condensé du numéro vérifié ; `false` si un AUTRE compte l'a déjà. */
  savePhone(scope: TxScope, userId: string, tokenDigest: string): Promise<boolean>;
  /** Comptes (≠ soi) dont le numéro vérifié correspond à l'un des condensés. */
  usersWithDigests(digests: string[], exceptUserId: string): Promise<string[]>;
  addAvoidPairs(scope: TxScope, userId: string, others: string[]): Promise<void>;
  /** Retrait : numéro et paires effacés. */
  erase(scope: TxScope, userId: string): Promise<void>;
}
export const CONTACT_AVOIDANCE_REPOSITORY = Symbol('ContactAvoidanceRepository');

/** Vérification du numéro de la personne (fournisseur d'auth). Le numéro n'est gardé qu'en mémoire, le temps du calcul. */
export interface PhoneVerifier {
  verify(token: string): Promise<{ e164: string }>;
}
export const PHONE_VERIFIER = Symbol('PhoneVerifier');

export interface ContactAvoidanceKeys {
  oprfKey: bigint;
  digestKey: Buffer;
}

export class ContactAvoidanceUseCases {
  constructor(
    private readonly repo: ContactAvoidanceRepository,
    private readonly bus: CommandBus,
    private readonly verifier: PhoneVerifier | null,
    /** null = secret absent (production non configurée) → 503. */
    private readonly keys: ContactAvoidanceKeys | null,
  ) {}

  private requireKeys(): ContactAvoidanceKeys {
    if (!this.keys) throw new AppError('PROVIDER_UNAVAILABLE', 'Fonction indisponible pour le moment', { detailsSafe: { reason: 'CONTACT_AVOIDANCE_UNAVAILABLE' } });
    return this.keys;
  }

  async status(userId: string): Promise<ContactAvoidanceStatus> {
    const [consent, phone, invited] = await Promise.all([this.repo.consent(userId), this.repo.hasPhone(userId), this.repo.hasEverBeenInvited(userId)]);
    const status = consent === null ? 'NOT_ASKED' : consent && phone ? 'ENABLED' : 'DECLINED';
    return { status, askBeforeFirstOuting: status === 'NOT_ASKED' && !invited, protocol: { version: CONTACT_PROTOCOL, maxBatch: CONTACT_AVOIDANCE_MAX_BATCH } };
  }

  /** « Non merci » : la question ne revient plus avant la 1ʳᵉ sortie (activable plus tard depuis le Profil). */
  async decline(userId: string, commandId: string): Promise<ContactAvoidanceStatus> {
    await this.bus.execute({
      actorId: userId,
      operation: 'me.contacts_avoid.decline',
      commandId,
      payload: {},
      handle: async (scope) => {
        await scope.lock.users([userId]);
        await this.repo.erase(scope, userId);
        await this.repo.recordConsent(scope, userId, false);
        return { ok: true };
      },
    });
    return this.status(userId);
  }

  /** Accepte : numéro VÉRIFIÉ par le fournisseur d'auth (jamais saisi librement) → condensé de son jeton OPRF. */
  async enable(userId: string, phoneVerificationToken: string, commandId: string): Promise<ContactAvoidanceStatus> {
    const keys = this.requireKeys();
    if (!this.verifier) throw new AppError('PROVIDER_UNAVAILABLE', 'Vérification du numéro indisponible', { detailsSafe: { reason: 'PHONE_VERIFICATION_UNAVAILABLE' } });
    const { e164 } = await this.verifier.verify(phoneVerificationToken); // hors transaction (réseau)
    const digest = digestOfToken(keys.digestKey, tokenForNumber(keys.oprfKey, e164));
    await this.bus.execute({
      actorId: userId,
      operation: 'me.contacts_avoid.enable',
      commandId,
      // Ni le numéro ni le jeton dans le registre d'idempotence : seulement un condensé du condensé.
      payload: { phone: createHmac('sha256', keys.digestKey).update(`idem|${digest}`).digest('base64url') },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        if (!(await this.repo.savePhone(scope, userId, digest))) throw new AppError('CONFLICT', 'Ce numéro est déjà associé à un autre compte', { detailsSafe: { reason: 'PHONE_ALREADY_REGISTERED' } });
        await this.repo.recordConsent(scope, userId, true);
        return { ok: true };
      },
    });
    return this.status(userId);
  }

  private async requireEnabled(userId: string) {
    const s = await this.status(userId);
    if (s.status !== 'ENABLED') throw new AppError('CONSENT_REQUIRED', 'Active d’abord « éviter les personnes que je connais »', { detailsSafe: { purpose: CONTACT_AVOIDANCE_PURPOSE } });
  }

  /** Étape 2 : évalue les points aveuglés (aucune écriture, aucun journal). */
  async evaluate(userId: string, blinded: string[]): Promise<{ evaluated: string[] }> {
    const keys = this.requireKeys();
    await this.requireEnabled(userId);
    try {
      return { evaluated: blinded.map((b) => evaluateBlinded(keys.oprfKey, b)) };
    } catch {
      throw Errors.validation({ field: 'blinded', reason: 'INVALID_POINT' });
    }
  }

  /** Étape 3 : jetons des contacts → paires à éviter ; les jetons sont jetés aussitôt, aucune réponse ne dit qui. */
  async contacts(userId: string, tokens: string[], commandId: string): Promise<{ accepted: number }> {
    const keys = this.requireKeys();
    await this.requireEnabled(userId);
    let digests: string[];
    try {
      digests = [...new Set(tokens.map((t) => digestOfToken(keys.digestKey, t)))];
    } catch {
      throw Errors.validation({ field: 'tokens', reason: 'INVALID_TOKEN' });
    }
    const others = await this.repo.usersWithDigests(digests, userId);
    const batch = createHmac('sha256', keys.digestKey).update(`batch|${digests.sort().join(',')}`).digest('base64url');
    const { result } = await this.bus.execute({
      actorId: userId,
      operation: 'me.contacts_avoid.upload',
      commandId,
      payload: { batch },
      handle: async (scope) => {
        await scope.lock.users([userId]);
        await this.repo.addAvoidPairs(scope, userId, others);
        // Réponse identique quel que soit le nombre de correspondances (aucune information sur qui est inscrit).
        return { accepted: tokens.length };
      },
    });
    return result;
  }

  /** Retrait du consentement : numéro et paires effacés (spec §8.4). */
  async disable(userId: string, commandId: string): Promise<ContactAvoidanceStatus> {
    return this.decline(userId, commandId);
  }
}
