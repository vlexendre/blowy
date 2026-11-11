import type { PipeTransform } from '@nestjs/common';
import type { z } from 'zod';
import { DomainError } from './errors';

/** Valide une entrée (corps, paramètre, requête) avec un schéma du contrat ; échec → `invalid`. */
export class ZodPipe<S extends z.ZodType> implements PipeTransform<unknown, z.infer<S>> {
  constructor(private readonly schema: S) {}

  transform(value: unknown): z.infer<S> {
    const parsed = this.schema.safeParse(value);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const where = first && first.path.length > 0 ? ` (${first.path.join('.')})` : '';
      throw new DomainError('invalid', `Ta demande n’est pas valide${where}.`);
    }
    return parsed.data;
  }
}
