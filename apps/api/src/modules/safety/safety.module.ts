import { Module } from '@nestjs/common';
import { Blocks } from './application/blocks.usecase';
import { Report } from './application/report.usecase';
import { SafetyController } from './interface/safety.controller';

@Module({
  controllers: [SafetyController],
  providers: [Blocks, Report],
})
export class SafetyModule {}
