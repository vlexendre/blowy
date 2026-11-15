/** Réglages des notifications d'une personne : lecture (avec valeurs par défaut), mise à jour, appareils. */
import { Inject, Injectable } from '@nestjs/common';
import { notificationKindLabel } from '@blowy/content';
import {
  DEFAULT_MORNING_HOUR,
  DEFAULT_NOTIFICATION_TIMEZONE,
  NOTIFICATION_DAILY_CAP,
  NOTIFICATION_KINDS,
  type NotificationKindKey,
  QUIET_END_HOUR,
  QUIET_START_HOUR,
  isValidTimeZone,
  nextLocalHour,
} from '@blowy/domain';
import { CACHE, type Cache } from '../../shared/cache';
import type { Clock } from '../../shared/clock';
import { DomainError, errorText } from '../../shared/errors';
import { CLOCK, PROFILES } from '../../shared/tokens';
import type { ProfilesRepository } from '../me/ports';
import { type DevicesRepository, NOTIFICATION_SETTINGS, type NotificationSettingsRecord, type NotificationSettingsRepository, PUSH_DEVICES } from './ports';

const TTL_MS = 60_000;

export interface SettingsView {
  kinds: Record<NotificationKindKey, boolean>;
  morningHour: number;
  timeZone: string;
  quietHours: { start: typeof QUIET_START_HOUR; end: typeof QUIET_END_HOUR };
  dailyCap: typeof NOTIFICATION_DAILY_CAP;
  labels: Record<NotificationKindKey, string>;
  hasDevice: boolean;
}

@Injectable()
export class NotificationSettings {
  constructor(
    @Inject(NOTIFICATION_SETTINGS) private readonly repo: NotificationSettingsRepository,
    @Inject(PUSH_DEVICES) private readonly devices: DevicesRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(CACHE) private readonly cache: Cache,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /** Réglages enregistrés ou par défaut (mis en cache une minute). */
  async resolve(userId: string): Promise<NotificationSettingsRecord> {
    return this.cache.wrap(`notif:settings:${userId}`, TTL_MS, async () => (await this.repo.get(userId)) ?? this.defaults(userId));
  }

  async view(userId: string): Promise<SettingsView> {
    const [s, devices, profile] = await Promise.all([this.resolve(userId), this.devices.forUser(userId), this.profiles.findById(userId)]);
    const lang = profile?.locale ?? 'fr';
    const kinds = Object.fromEntries(NOTIFICATION_KINDS.map((k) => [k, !s.disabledKinds.includes(k)])) as Record<NotificationKindKey, boolean>;
    const labels = Object.fromEntries(NOTIFICATION_KINDS.map((k) => [k, notificationKindLabel(lang, k)])) as Record<NotificationKindKey, string>;
    return {
      kinds,
      morningHour: s.morningHour,
      timeZone: s.timeZone,
      quietHours: { start: QUIET_START_HOUR, end: QUIET_END_HOUR },
      dailyCap: NOTIFICATION_DAILY_CAP,
      labels,
      hasDevice: devices.some((d) => d.kind === 'expo'),
    };
  }

  async update(userId: string, patch: { kinds?: Partial<Record<NotificationKindKey, boolean>>; morningHour?: number; timeZone?: string }): Promise<SettingsView> {
    if (patch.timeZone !== undefined && !isValidTimeZone(patch.timeZone)) throw new DomainError('invalid', errorText('unknownTimeZone'));
    const current = await this.resolve(userId);
    const disabled = new Set(current.disabledKinds);
    for (const [k, on] of Object.entries(patch.kinds ?? {}) as [NotificationKindKey, boolean | undefined][]) {
      if (on === true) disabled.delete(k);
      if (on === false) disabled.add(k);
    }
    const next = this.withMorning({
      ...current,
      disabledKinds: NOTIFICATION_KINDS.filter((k) => disabled.has(k)),
      morningHour: patch.morningHour ?? current.morningHour,
      timeZone: patch.timeZone ?? current.timeZone,
      updatedAt: this.clock.now().toISOString(),
    }, (await this.devices.forUser(userId)).length > 0);
    await this.save(next);
    return this.view(userId);
  }

  /** Refuse une personne pas encore inscrite (`not_onboarded`). */
  async requireProfile(userId: string): Promise<void> {
    if (!(await this.profiles.findById(userId))) throw new DomainError('not_onboarded');
  }

  /** Enregistre l'appareil et le fuseau (appelé à chaque ouverture de l'app). */
  async registerDevice(userId: string, input: { token: string; platform: 'ios' | 'android'; timeZone: string }): Promise<SettingsView> {
    if (!(await this.profiles.findById(userId))) throw new DomainError('not_onboarded');
    const now = this.clock.now().toISOString();
    await this.devices.upsert({ token: input.token, userId, platform: input.platform, kind: 'expo', createdAt: now, lastSeenAt: now, disabledAt: null });
    const current = await this.resolve(userId);
    const timeZone = isValidTimeZone(input.timeZone) ? input.timeZone : current.timeZone;
    await this.save(this.withMorning({ ...current, timeZone, updatedAt: now }, true, current.timeZone !== timeZone));
    return this.view(userId);
  }

  async removeDevice(userId: string, token: string): Promise<void> {
    await this.devices.remove(token, userId);
    if ((await this.devices.forUser(userId)).length === 0) {
      const current = await this.resolve(userId);
      await this.save({ ...current, nextMorningAt: null, updatedAt: this.clock.now().toISOString() });
    }
  }

  /** Après l'envoi du matin : le prochain est demain à la même heure locale. */
  async scheduleNextMorning(s: NotificationSettingsRecord, after: Date): Promise<void> {
    await this.save({ ...s, nextMorningAt: nextLocalHour(after, s.timeZone, s.morningHour).toISOString() });
  }

  private defaults(userId: string): NotificationSettingsRecord {
    return { userId, timeZone: DEFAULT_NOTIFICATION_TIMEZONE, morningHour: DEFAULT_MORNING_HOUR, disabledKinds: [], nextMorningAt: null, updatedAt: this.clock.now().toISOString() };
  }

  /** Recalcule le prochain envoi du matin (rien sans appareil ou défi coupé). */
  private withMorning(s: NotificationSettingsRecord, hasDevice: boolean, force = true): NotificationSettingsRecord {
    if (!hasDevice || s.disabledKinds.includes('daily_challenge')) return { ...s, nextMorningAt: null };
    if (!force && s.nextMorningAt !== null) return s;
    return { ...s, nextMorningAt: nextLocalHour(this.clock.now(), s.timeZone, s.morningHour).toISOString() };
  }

  private async save(s: NotificationSettingsRecord): Promise<void> {
    await this.repo.save(s);
    await this.cache.delete(`notif:settings:${s.userId}`);
  }
}
