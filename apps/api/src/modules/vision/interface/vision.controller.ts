import { Body, Controller, Delete, Get, Inject, Post, Put, Query } from '@nestjs/common';
import {
  ChosenCityZ,
  LocationBody,
  type LocationStatus,
  type MapDto,
  MapQuery,
  type VisionProfileDto,
  type VisionTest,
  VisionTestBody,
} from '@blowy/contract';
import { type Locale, visionText } from '@blowy/content';
import { ReqLocale } from '../../../shared/locale';
import { shapeOf } from '@blowy/domain';
import type { z } from 'zod';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser, Public } from '../../../shared/auth.guard';
import { RateLimit } from '../../../shared/user-rate-limit';
import { ZodPipe } from '../../../shared/zod.pipe';
import { toPerson } from '../../me/interface/person.presenter';
import { moodForShape } from '../../pets/application/pet-catch-up';
import { toPublicPet } from '../../pets/interface/pet.presenter';
import { GetMap, type MapResult } from '../application/get-map.usecase';
import { type LocationState, Locations } from '../application/locations';
import { MyVision } from '../application/vision.usecases';
import { toExplanation, toLocationStatus, toVisionProfile, toVisionTest } from './vision.presenter';

const status = (s: LocationState): LocationStatus => toLocationStatus(s.profile, s.place, s.plus);

const latLng = (p: { lat: number; lng: number }) => ({ latitude: p.lat, longitude: p.lng });

export const toMapDto = (r: MapResult, locale: Locale = 'fr'): MapDto => ({
  status: r.status,
  message: r.status === 'no_location' ? visionText.in(locale).map.noLocation : null,
  scope: r.scope,
  center: r.center ? latLng(r.center) : null,
  radiusKm: r.radiusKm,
  pins: r.pins.map((p) => ({
    // Sur la carte comme dans les rencontres : visage caché, humeur selon la forme du minimoa.
    user: toPerson(p.profile, toPublicPet(p.pet, moodForShape(shapeOf(p.pet.needs))), 'hidden', null),
    position: latLng(p.match.shown),
    compatibility: p.match.score,
    explanation: toExplanation(p.match, p.profile.displayName, locale),
  })),
  beyond: { count: r.beyond.count, label: visionText.in(locale).map.beyond(r.beyond.count), blurred: r.beyond.blurred.map(latLng) },
  discreet: r.discreet,
  canChangeCity: r.canChangeCity,
});

@Controller('v1')
export class VisionController {
  constructor(
    @Inject(MyVision) private readonly vision: MyVision,
    @Inject(Locations) private readonly locations: Locations,
    @Inject(GetMap) private readonly getMap: GetMap,
  ) {}

  /** Public : le test se passe avant la connexion (les réponses partent avec l'inscription). */
  @Public()
  @Get('vision/test')
  test(@ReqLocale() locale: Locale): VisionTest {
    return toVisionTest(locale);
  }

  @RateLimit('write')
  @Post('vision/test')
  async retake(
    @CurrentUser() user: AuthUser,
    @Body(new ZodPipe(VisionTestBody)) body: z.infer<typeof VisionTestBody>,
    @ReqLocale() locale: Locale,
  ): Promise<VisionProfileDto> {
    return toVisionProfile(await this.vision.retakeTest(user.userId, body.answers), locale);
  }

  @Get('vision')
  async mine(@CurrentUser() user: AuthUser, @ReqLocale() locale: Locale): Promise<VisionProfileDto> {
    return toVisionProfile(await this.vision.get(user.userId), locale);
  }

  @RateLimit('write')
  @Post('me/location')
  async locate(@CurrentUser() user: AuthUser, @Body(new ZodPipe(LocationBody)) body: z.infer<typeof LocationBody>): Promise<LocationStatus> {
    return status(await this.locations.record(user.userId, { lat: body.latitude, lng: body.longitude }, body.consent === true));
  }

  @RateLimit('write')
  @Delete('me/location')
  async forget(@CurrentUser() user: AuthUser): Promise<LocationStatus> {
    return status(await this.locations.forget(user.userId));
  }

  @RateLimit('write')
  @Put('me/city')
  async chooseCity(@CurrentUser() user: AuthUser, @Body(new ZodPipe(ChosenCityZ)) body: z.infer<typeof ChosenCityZ>): Promise<LocationStatus> {
    return status(await this.locations.chooseCity(user.userId, { label: body.label, lat: body.latitude, lng: body.longitude }));
  }

  @RateLimit('write')
  @Delete('me/city')
  async clearCity(@CurrentUser() user: AuthUser): Promise<LocationStatus> {
    return status(await this.locations.clearCity(user.userId));
  }

  @Get('map')
  async map(@CurrentUser() user: AuthUser, @Query(new ZodPipe(MapQuery)) query: z.infer<typeof MapQuery>, @ReqLocale() locale: Locale): Promise<MapDto> {
    return toMapDto(await this.getMap.execute(user.userId, query), locale);
  }
}
