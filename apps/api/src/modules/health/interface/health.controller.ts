import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../shared/auth.guard';

@Public()
@Controller('health')
export class HealthController {
  @Get()
  health(): { ok: true } {
    return { ok: true };
  }
}
