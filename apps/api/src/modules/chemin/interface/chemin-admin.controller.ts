import { Body, Controller, Get, HttpCode, Inject, Param, Post, Put, UseGuards } from '@nestjs/common';
import {
  type AdminChemin,
  type AdminCheminQuestion,
  AdminCheminQuestionBody,
  type AdminCheminStats,
  AdminCheminStatusBody,
  type AdminCheminUnit,
  AdminCheminUnitBody,
} from '@blowy/contract';
import { z } from 'zod';
import { ZodPipe } from '../../../shared/zod.pipe';
import { AdminGuard } from '../../admin/interface/admin.guard';
import { CheminAdmin } from '../application/chemin-admin';

const Id = z.string().regex(/^[a-z0-9_]{2,60}$/);

/** Administration de Ton chemin (adresses de `ADMIN_EMAILS`) : questions, unités, statuts, compteur du jour. */
@Controller('admin/chemin')
@UseGuards(AdminGuard)
export class CheminAdminController {
  constructor(@Inject(CheminAdmin) private readonly admin: CheminAdmin) {}

  @Get()
  overview(): Promise<AdminChemin> {
    return this.admin.overview();
  }

  @Get('stats')
  stats(): Promise<AdminCheminStats> {
    return this.admin.stats();
  }

  @Post('questions')
  @HttpCode(200)
  createQuestion(@Body(new ZodPipe(AdminCheminQuestionBody)) body: AdminCheminQuestionBody): Promise<AdminCheminQuestion> {
    return this.admin.createQuestion(body);
  }

  @Put('questions/:id')
  updateQuestion(@Param('id', new ZodPipe(Id)) id: string, @Body(new ZodPipe(AdminCheminQuestionBody)) body: AdminCheminQuestionBody): Promise<AdminCheminQuestion> {
    return this.admin.updateQuestion(id, body);
  }

  @Post('questions/:id/status')
  @HttpCode(200)
  questionStatus(@Param('id', new ZodPipe(Id)) id: string, @Body(new ZodPipe(AdminCheminStatusBody)) body: z.infer<typeof AdminCheminStatusBody>): Promise<AdminCheminQuestion> {
    return this.admin.setQuestionStatus(id, body.status);
  }

  @Post('units')
  @HttpCode(200)
  createUnit(@Body(new ZodPipe(AdminCheminUnitBody)) body: AdminCheminUnitBody): Promise<AdminCheminUnit> {
    return this.admin.createUnit(body);
  }

  @Put('units/:id')
  updateUnit(@Param('id', new ZodPipe(Id)) id: string, @Body(new ZodPipe(AdminCheminUnitBody)) body: AdminCheminUnitBody): Promise<AdminCheminUnit> {
    return this.admin.updateUnit(id, body);
  }

  @Post('units/:id/status')
  @HttpCode(200)
  unitStatus(@Param('id', new ZodPipe(Id)) id: string, @Body(new ZodPipe(AdminCheminStatusBody)) body: z.infer<typeof AdminCheminStatusBody>): Promise<AdminCheminUnit> {
    return this.admin.setUnitStatus(id, body.status);
  }
}
