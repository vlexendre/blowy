import { Module } from '@nestjs/common';
import { GetMap } from './application/get-map.usecase';
import { Locations } from './application/locations';
import { ReviewPlaces } from '../../review/review-places';
import { Matchmaker } from './application/matchmaker';
import { MyVision } from './application/vision.usecases';
import { VisionController } from './interface/vision.controller';

/** Vision, position et carte. Les dépôts et les ports partagés sont fournis par CoreModule (visionProviders). */
@Module({
  controllers: [VisionController],
  providers: [MyVision, Locations, Matchmaker, GetMap, ReviewPlaces],
  exports: [Matchmaker, Locations, ReviewPlaces],
})
export class VisionModule {}
