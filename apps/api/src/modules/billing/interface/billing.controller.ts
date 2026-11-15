import { Body, Controller, Get, HttpCode, Inject, Post } from '@nestjs/common';
import { AppleNotificationBody, type Paywall, SubmitPurchaseBody, type Subscription } from '@blowy/contract';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser, Public } from '../../../shared/auth.guard';
import { DomainError } from '../../../shared/errors';
import { ReqLocale } from '../../../shared/locale';
import { type Locale, facturationText, textOf } from '@blowy/content';
import { ZodPipe } from '../../../shared/zod.pipe';
import { HandleAppleNotification } from '../application/apple-notifications.usecase';
import { GetPaywall, GetSubscription, SubmitPurchase } from '../application/plus.usecases';

@Controller('v1/plus')
export class BillingController {
  constructor(
    @Inject(GetPaywall) private readonly paywall: GetPaywall,
    @Inject(GetSubscription) private readonly subscription: GetSubscription,
    @Inject(SubmitPurchase) private readonly submit: SubmitPurchase,
    @Inject(HandleAppleNotification) private readonly appleNotification: HandleAppleNotification,
  ) {}

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

  /** App Store Server Notifications V2 (appelé par Apple ; authentifié par la signature, pas par un jeton). */
  @Public()
  @Post('apple/notifications')
  @HttpCode(200)
  async apple(@Body(new ZodPipe(AppleNotificationBody)) body: z.infer<typeof AppleNotificationBody>): Promise<{ ok: true; outcome: string }> {
    const outcome = await this.appleNotification.execute(body.signedPayload);
    if (outcome === 'rejected') throw new DomainError('invalid', textOf(facturationText, (t) => t.plus.errors.notificationRejected));
    return { ok: true, outcome };
  }
}
