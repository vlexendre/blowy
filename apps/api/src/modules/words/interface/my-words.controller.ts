import { Controller, Get, Inject } from '@nestjs/common';
import type { MyWords } from '@blowy/contract';
import type { AuthUser } from '../../../integrations/auth/ports';
import { CurrentUser } from '../../../shared/auth.guard';
import { Words } from '../application/words.usecase';

/** Ton lien « 3 mots » et ton résultat (carte à partager en story). */
@Controller('v1/me/words')
export class MyWordsController {
  constructor(@Inject(Words) private readonly words: Words) {}

  @Get()
  mine(@CurrentUser() user: AuthUser): Promise<MyWords> {
    return this.words.mine(user.userId);
  }
}
