import { Module } from '@nestjs/common';
import { PetsModule } from '../pets/pets.module';
import { Words } from './application/words.usecase';
import { WordsController } from './interface/words.controller';
import { MyWordsController } from './interface/my-words.controller';

@Module({
  imports: [PetsModule],
  controllers: [WordsController, MyWordsController],
  providers: [Words],
})
export class WordsModule {}
