import { Module } from '@nestjs/common';
import { ImagesSelfCheck } from './images-self-check';
import { HealthController } from './interface/health.controller';

@Module({ controllers: [HealthController], providers: [ImagesSelfCheck] })
export class HealthModule {}
