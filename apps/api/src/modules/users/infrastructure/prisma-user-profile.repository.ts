import type { Db } from '@blowy/database';
import type { TxScope } from '../../../shared/application/unit-of-work.js';
import { txOf } from '../../../shared/infrastructure/prisma/prisma-unit-of-work.js';
import type { ConsentFact } from '../domain/consents.js';
import type { ProfilePatch, UserAggregate, UserProfileRepository } from '../application/ports/user-profile.repository.js';

export class PrismaUserProfileRepository implements UserProfileRepository {
  constructor(private readonly db: Db) {}

  async load(userId: string, at: Date): Promise<UserAggregate | null> {
    const u = await this.db.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        matchPreferences: true,
        privacySettings: true,
        zone: { select: { code: true } },
        primaryPet: { select: { id: true } },
        verificationSessions: { orderBy: { createdAt: 'desc' }, take: 1 },
        pausePeriods: { where: { endedAt: null, startsAt: { lte: at }, endsAt: { gt: at }, contextId: null }, take: 1 },
      },
    });
    if (!u) return null;
    const v = u.verificationSessions[0];
    const verified = v && v.status === 'VERIFIED' && (!v.expiresAt || v.expiresAt > at);
    const p = u.pausePeriods[0];
    return {
      id: u.id,
      status: u.status,
      birthDate: u.birthDate,
      timezone: u.timezone,
      zoneCode: u.zone?.code ?? null,
      reliability: u.reliability,
      onboardedAt: u.onboardedAt,
      isFictional: u.isFictional,
      displayName: u.profile?.displayName ?? null,
      gender: u.profile?.gender ?? 'UNDISCLOSED',
      primaryPetId: u.primaryPet?.id ?? null,
      preferences: u.matchPreferences
        ? {
            ageMin: u.matchPreferences.ageMin,
            ageMax: u.matchPreferences.ageMax,
            maxDistanceKm: u.matchPreferences.maxDistanceKm,
            seekingGenders: u.matchPreferences.seekingGenders,
            intention: u.matchPreferences.intention,
            widenConsented: u.matchPreferences.widenConsented,
          }
        : null,
      privacy: {
        photoPreference: u.privacySettings?.photoPreference ?? 'FROM_LEVEL_4_WITH_CONSENT',
        ageDisplay: u.privacySettings?.ageDisplay ?? 'RANGE',
        mapVisible: u.privacySettings?.mapVisible ?? false,
      },
      verification: v
        ? { status: v.status === 'VERIFIED' && !verified ? 'EXPIRED' : v.status, kind: v.kind, provenance: v.provenance, expiresAt: v.expiresAt, sessionUrl: v.status === 'PENDING' || v.status === 'NEEDS_RETRY' ? v.providerSessionUrl : null }
        : { status: 'NOT_STARTED', kind: null, provenance: null, expiresAt: null },
      activePause: p ? { id: p.id, contextId: p.contextId, startsAt: p.startsAt, endsAt: p.endsAt } : null,
    };
  }

  async zoneExists(code: string): Promise<boolean> {
    return (await this.db.zone.count({ where: { code, active: true } })) > 0;
  }

  async patchProfile(scope: TxScope, userId: string, patch: ProfilePatch): Promise<void> {
    const tx = txOf(scope);
    const zone = patch.zoneCode ? await tx.zone.findUnique({ where: { code: patch.zoneCode } }) : null;
    await tx.user.update({
      where: { id: userId },
      data: {
        ...(patch.birthDate ? { birthDate: patch.birthDate } : {}),
        ...(patch.timezone ? { timezone: patch.timezone } : {}),
        ...(zone ? { zoneId: zone.id } : {}),
        version: { increment: 1 },
      },
    });
    if (patch.displayName !== undefined || patch.gender !== undefined) {
      await tx.profile.upsert({
        where: { userId },
        create: { userId, displayName: patch.displayName ?? '', gender: patch.gender ?? 'UNDISCLOSED' },
        update: { ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}), ...(patch.gender ? { gender: patch.gender } : {}) },
      });
    }
  }

  async savePreferences(scope: TxScope, userId: string, prefs: NonNullable<UserAggregate['preferences']>): Promise<void> {
    await txOf(scope).matchPreferences.upsert({ where: { userId }, create: { userId, ...prefs }, update: prefs });
  }

  async savePrivacy(scope: TxScope, userId: string, privacy: UserAggregate['privacy']): Promise<void> {
    await txOf(scope).privacySettings.upsert({ where: { userId }, create: { userId, ...privacy }, update: privacy });
  }

  async appendConsents(scope: TxScope, userId: string, items: { purpose: string; version: string; granted: boolean }[]): Promise<void> {
    await txOf(scope).processingConsent.createMany({ data: items.map((i) => ({ userId, ...i, createdAt: scope.now })) });
  }

  async listConsents(userId: string): Promise<ConsentFact[]> {
    return this.db.processingConsent.findMany({ where: { userId }, orderBy: { createdAt: 'asc' }, select: { purpose: true, version: true, granted: true, createdAt: true } });
  }

  async pausesInPeriod(scope: TxScope, userId: string, periodKey: string) {
    return txOf(scope).pausePeriod.findMany({ where: { userId, periodKey }, select: { id: true, contextId: true, startsAt: true, endsAt: true, endedAt: true } });
  }

  async createPause(scope: TxScope, p: { id: string; userId: string; contextId: string | null; startsAt: Date; endsAt: Date; periodKey: string }): Promise<void> {
    await txOf(scope).pausePeriod.create({ data: { ...p, createdAt: scope.now } });
  }

  async endPause(scope: TxScope, userId: string, pauseId: string): Promise<boolean> {
    const r = await txOf(scope).pausePeriod.updateMany({ where: { id: pauseId, userId, endedAt: null }, data: { endedAt: scope.now } });
    return r.count === 1;
  }

  async markOnboarded(scope: TxScope, userId: string): Promise<void> {
    await txOf(scope).user.update({ where: { id: userId }, data: { onboardedAt: scope.now } });
  }

  async createVerification(scope: TxScope, v: Parameters<UserProfileRepository['createVerification']>[1]): Promise<void> {
    await txOf(scope).verificationSession.create({
      data: { ...v, verifiedAt: v.status === 'VERIFIED' ? scope.now : null, createdAt: scope.now },
    });
  }

  async isParticipant(userId: string, contextId: string): Promise<boolean> {
    return (await this.db.relationshipSide.count({ where: { userId, contextId, active: true } })) > 0;
  }
}
