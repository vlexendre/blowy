/**
 * Configuration Prisma 7 (D-003). L'URL est lue depuis l'environnement ;
 * aucune valeur par défaut de production n'est codée ici.
 */
import { defineConfig } from 'prisma/config';

const url = process.env.DATABASE_URL ?? 'postgresql://blowy:blowy@localhost:5432/blowy';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx src/seed/index.ts',
  },
  datasource: { url },
});
