import { Body, Controller, Get, HttpCode, Inject, Logger, Post, type RawBodyRequest, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AppleNotificationBody, type Paywall, PlusOpenBody, type PlusMomentDto, SubmitPurchaseBody, type Subscription } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser, Public } from '../../../shared/auth.guard';
import { DomainError } from '../../../shared/errors';
import { ReqLocale } from '../../../shared/locale';
import { type Locale, facturationText, textOf } from '@blowy/content';
import { ZodPipe } from '../../../shared/zod.pipe';
import { HandleAppleNotification } from '../application/apple-notifications.usecase';
import { GetPaywall, GetSubscription, SubmitPurchase } from '../application/plus.usecases';
import { PlusMoments, PlusOpens } from '../application/plus-desire';
import type { AppleNotificationRelay } from '../ports';
import { APPLE_NOTIFICATION_RELAY } from '../tokens';

@Controller('v1/plus')
export class BillingController {
  private readonly logger = new Logger('RevenueCat');

  constructor(
    @Inject(GetPaywall) private readonly paywall: GetPaywall,
    @Inject(GetSubscription) private readonly subscription: GetSubscription,
    @Inject(SubmitPurchase) private readonly submit: SubmitPurchase,
    @Inject(HandleAppleNotification) private readonly appleNotification: HandleAppleNotification,
    @Inject(PlusOpens) private readonly opens: PlusOpens,
    @Inject(PlusMoments) private readonly moments: PlusMoments,
    @Inject(APPLE_NOTIFICATION_RELAY) private readonly relay: AppleNotificationRelay,
  ) {}

  /** La feuille s'est ouverte (compteur par déclencheur ; mesure seulement). */
  @Post('opens')
  @HttpCode(200)
  async opened(@Body(new ZodPipe(PlusOpenBody)) body: z.infer<typeof PlusOpenBody>): Promise<{ ok: true }> {
    await this.opens.record(body.trigger);
    return { ok: true };
  }

  /** Moment clé à saluer maintenant, décidé et réservé par le serveur (plafond : docs/DESIR.md). */
  @Post('moment')
  @HttpCode(200)
  async moment(@CurrentUser() user: AuthUser): Promise<PlusMomentDto> {
    return { moment: await this.moments.claim(user.userId) };
  }

  @Get('paywall')
  async getPaywall(@CurrentUser() user: AuthUser, @ReqLocale() locale: Locale): Promise<Paywall> {
    return this.paywall.execute(user.userId, locale);
  }

  @Get('subscription')
  async getSubscription(@CurrentUser() user: AuthUser, @ReqLocale() locale: Locale): Promise<Subscription> {
    return this.subscription.execute(user.userId, locale);
  }

  /** Après un achat ou « Restaurer mes achats » (transaction StoreKit 2 signée). */
  @Post('purchases')
  @HttpCode(200)
  async purchase(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(SubmitPurchaseBody)) body: z.infer<typeof SubmitPurchaseBody>,
    @ReqLocale() locale: Locale,
  ): Promise<Subscription> {
    return this.submit.execute(user.userId, body, locale);
  }

  /**
   * App Store Server Notifications V2 (appelé par Apple ; authentifié par la signature, pas par un jeton).
   * Relais RevenueCat (docs/BLOWY-PLUS.md §6) : APRÈS notre traitement, seulement pour une notification à la signature
   * valide (renvois compris : RevenueCat déduplique), et sans l'attendre : la réponse à Apple, son code et son délai
   * restent ceux d'avant. Une erreur technique de notre côté (500) ne relaie rien : Apple renverra, on relaiera alors.
   */
  @Public()
  @Post('apple/notifications')
  @HttpCode(200)
  async apple(
    @Body(new ZodPipe(AppleNotificationBody)) body: z.infer<typeof AppleNotificationBody>,
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ ok: true; outcome: string }> {
    const outcome = await this.appleNotification.execute(body.signedPayload);
    if (outcome === 'rejected') throw new DomainError('invalid', textOf(facturationText, (t) => t.plus.errors.notificationRejected));
    // Le corps reçu d'Apple, octet pour octet (`rawBody`, app.ts) ; à défaut, le même JSON réécrit.
    const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify({ signedPayload: body.signedPayload });
    this.relay.forward(raw).catch(() => this.logger.warn('relais de la notification Apple en échec'));
    return { ok: true, outcome };
  }
}
