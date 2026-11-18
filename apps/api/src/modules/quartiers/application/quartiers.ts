import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AdminQuartiers, MyQuartier, QuartierConfirmed, QuartierJoinBody, QuartierJoined, ZoneStatus } from '@blowy/contract';
import { quartierConfirmEmail, zoneLabel } from '@blowy/content';
import {
  type Locale,
  clampThreshold,
  isPlausibleEmail,
  isSignupCode,
  normalizeCode,
  normalizeEmail,
  zoneById,
  zoneOfPoint,
  zoneProgress,
} from '@blowy/domain';
import type { Env } from '../../../config/env';
import type { Mailer } from '../../../integrations/mailer/mailer';
import type { Clock } from '../../../shared/clock';
import { DomainError, errorText } from '../../../shared/errors';
import type { Ids } from '../../../shared/ids';
import { CLOCK, ENV, IDS, MAILER, PROFILES } from '../../../shared/tokens';
import { Growth } from '../../growth/application/growth';
import type { ProfilesRepository } from '../../me/ports';
import { Audience } from '../../safety/application/audience';
import type { PlacesRepository } from '../../vision/ports';
import { PLACES } from '../../vision/tokens';
import { QUARTIERS, type QuartiersRepository, type SignupRecord, type ZoneCounts, type ZoneRecord } from '../ports';

/**
 * « Ouvre ton quartier » (docs/VIRALITE.md) : compteur réel (inscriptions confirmées), inscription en double opt-in
 * (Resend), désinscription en un clic, le quartier de la zone d'une personne de l'app, et l'administration (seuil,
 * ouverture à la main). L'ouverture au seuil, les fondateurs et l'e-mail d'ouverture sont faits par `QuartierJobs`.
 */
@Injectable()
export class Quartiers {
  private readonly logger = new Logger('Quartiers');

  constructor(
    @Inject(QUARTIERS) private readonly repo: QuartiersRepository,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PLACES) private readonly places: PlacesRepository,
    @Inject(Audience) private readonly audience: Audience,
    @Inject(Growth) private readonly growth: Growth,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(IDS) private readonly ids: Ids,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private zoneOrThrow(id: string) {
    const z = zoneById(id);
    if (!z) throw new DomainError('not_found', errorText('zoneUnknown'));
    return z;
  }

  private statusOf(zoneId: string, record: ZoneRecord | null, counts: ZoneCounts | undefined, threshold: number, locale: Locale): ZoneStatus {
    const zone = this.zoneOrThrow(zoneId);
    return { zone: zone.id, label: zoneLabel(zone, locale), ...zoneProgress(counts?.confirmed ?? 0, threshold, record?.openedAt ?? null) };
  }

  async status(zoneId: string, locale: Locale): Promise<ZoneStatus> {
    const zone = this.zoneOrThrow(zoneId);
    const [record, counts, threshold] = await Promise.all([this.repo.findZone(zone.id), this.repo.counts([zone.id]), this.repo.threshold()]);
    return this.statusOf(zone.id, record, counts.get(zone.id), threshold, locale);
  }

  private now(): string {
    return this.clock.now().toISOString();
  }
  private token(): string {
    return `${this.ids.uuid()}${this.ids.uuid()}`.replace(/-/g, '');
  }
  private links(token: string): { confirmUrl: string; unsubscribeUrl: string } {
    return { confirmUrl: `${this.env.webUrl}/quartier/confirmer?t=${token}`, unsubscribeUrl: `${this.env.webUrl}/quartier/desinscription?t=${token}` };
  }

  /** Qui invite : une inscription (`N…`) ou le code d'invitation d'un compte visible ; jamais soi-même. */
  private async inviterOf(ref: string | undefined, self: SignupRecord | null): Promise<{ invitedByUser: string | null; invitedBySignup: string | null }> {
    const none = { invitedByUser: null, invitedBySignup: null };
    if (!ref) return none;
    const code = normalizeCode(ref);
    // Un code de compte (8 caractères) peut avoir la forme d'un code d'inscription (`N` + 7) : on ne conclut à une
    // inscription que si elle existe, sinon on cherche le compte.
    if (isSignupCode(code)) {
      const s = await this.repo.findSignup({ code });
      if (s) return s.id !== self?.id ? { invitedByUser: null, invitedBySignup: s.id } : none;
    }
    const p = await this.audience.publiclyVisible(await this.profiles.findByInviteCode(code));
    return p && !p.reviewWorld ? { invitedByUser: p.id, invitedBySignup: null } : none;
  }

  /**
   * « Préviens-moi » : la réponse est la même que l'adresse soit nouvelle ou déjà inscrite (on ne révèle pas qui est
   * inscrit). Nouvelle ou pas encore confirmée : l'e-mail de confirmation (re)part. Confirmée : rien n'est renvoyé ; un
   * autre quartier choisi la déplace (une adresse = un quartier).
   */
  async join(body: QuartierJoinBody): Promise<QuartierJoined> {
    if (!isPlausibleEmail(body.email)) throw new DomainError('invalid', errorText('emailInvalid'));
    const zone = this.zoneOrThrow(body.zone);
    const email = normalizeEmail(body.email);
    const at = this.now();
    await this.repo.ensureZone(zone.id, at);
    const existing = await this.repo.findSignup({ email });
    let mailTo: SignupRecord | null = null;
    if (existing) {
      const patch: Partial<SignupRecord> = { locale: body.locale };
      if (existing.zone !== zone.id) patch.zone = zone.id;
      if (!existing.confirmedAt) {
        patch.token = this.token();
        patch.consentAt = at;
        if (!existing.invitedByUser && !existing.invitedBySignup) Object.assign(patch, await this.inviterOf(body.ref, existing));
      }
      const updated = await this.repo.updateSignup(existing.id, patch);
      if (updated && !updated.confirmedAt) mailTo = updated;
    } else {
      for (let i = 0; i < 6 && !mailTo; i++) {
        const s: SignupRecord = {
          id: this.ids.uuid(),
          zone: zone.id,
          email,
          locale: body.locale,
          code: `N${this.ids.code().slice(0, 7)}`,
          token: this.token(),
          ...(await this.inviterOf(body.ref, null)),
          consentAt: at,
          confirmedAt: null,
          unsubscribedAt: null,
          openMailSentAt: null,
          userId: null,
          createdAt: at,
        };
        if (await this.repo.createSignup(s)) mailTo = s;
        else if (await this.repo.findSignup({ email })) break; // inscrite entre-temps : même réponse
      }
      await this.growth.web('quartier_join');
    }
    if (mailTo?.email && mailTo.token) {
      const threshold = await this.repo.threshold();
      try {
        await this.mailer.send({ to: mailTo.email, ...quartierConfirmEmail(body.locale, { zone: zoneLabel(zone, body.locale), threshold, ...this.links(mailTo.token) }) });
      } catch (err) {
        this.logger.warn(`e-mail de confirmation non parti : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      }
    }
    return { status: await this.status(zone.id, body.locale), sent: true };
  }

  /** Lien reçu par e-mail : l'adresse est confirmée et compte dans le quartier ; rend le code pour inviter. */
  async confirm(token: string, locale: Locale): Promise<QuartierConfirmed> {
    const s = await this.repo.findSignup({ token });
    if (!s || s.unsubscribedAt) throw new DomainError('not_found');
    if (!s.confirmedAt) {
      await this.repo.updateSignup(s.id, { confirmedAt: this.now() });
      await this.growth.web('quartier_confirm');
    }
    return { status: await this.status(s.zone, locale), code: s.code };
  }

  /** Désinscription en un clic : l'adresse est effacée tout de suite ; la personne ne compte plus. */
  async unsubscribe(token: string): Promise<void> {
    const s = await this.repo.findSignup({ token });
    if (!s) return;
    await this.repo.updateSignup(s.id, { unsubscribedAt: this.now(), email: null, token: null });
  }

  /** Le quartier de ta zone (centre de ta zone, déjà arrondi), et ton code pour inviter. */
  async mine(userId: string, locale: Locale): Promise<MyQuartier> {
    const [profile, place] = await Promise.all([this.profiles.findById(userId), this.places.find(userId)]);
    if (!profile) throw new DomainError('not_onboarded');
    const zone = place ? zoneOfPoint(place.home) : null;
    return { status: zone ? await this.status(zone.id, locale) : null, inviteCode: profile.inviteCode };
  }

  /** Un compte reprend une inscription (« Un code ? » ou lien de l'e-mail) : son objet de fondateur le suivra. */
  async claim(userId: string, code: string): Promise<void> {
    const s = await this.repo.findSignup({ code: normalizeCode(code) });
    if (s && !s.userId) await this.repo.updateSignup(s.id, { userId });
  }

  // ── Administration ──
  async adminList(locale: Locale): Promise<AdminQuartiers> {
    const [zones, threshold] = await Promise.all([this.repo.listZones(), this.repo.threshold()]);
    const counts = await this.repo.counts(zones.map((z) => z.zone));
    const items = zones
      .filter((z) => zoneById(z.zone))
      .map((z) => {
        const c = counts.get(z.zone) ?? { confirmed: 0, pending: 0, notified: 0, founders: 0 };
        return { ...this.statusOf(z.zone, z, c, threshold, locale), pending: c.pending, openedAt: z.openedAt, openedBy: z.openedBy, notified: c.notified, founders: c.founders };
      })
      .sort((a, b) => Number(a.open) - Number(b.open) || b.count - a.count || a.zone.localeCompare(b.zone));
    return { threshold, items };
  }

  async setThreshold(threshold: number, locale: Locale): Promise<AdminQuartiers> {
    await this.repo.setThreshold(clampThreshold(threshold), this.now());
    return this.adminList(locale);
  }

  /** Ouverture à la main : l'e-mail « ton quartier est ouvert » part au prochain passage du minuteur. */
  async adminOpen(zoneId: string, locale: Locale): Promise<AdminQuartiers> {
    const zone = this.zoneOrThrow(zoneId);
    await this.repo.ensureZone(zone.id, this.now());
    await this.repo.open(zone.id, this.now(), 'admin');
    return this.adminList(locale);
  }
}
