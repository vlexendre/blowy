import { Module } from '@nestjs/common';
import { AppConfigController } from './interface/app-config.controller';

/** Versions de l'app servies par l'API (docs/VERSIONING.md). */
@Module({ controllers: [AppConfigController] })
export class AppConfigModule {}
