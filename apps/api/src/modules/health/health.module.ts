import { Module } from '@nestjs/common';
import { HealthController } from './interface/health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
