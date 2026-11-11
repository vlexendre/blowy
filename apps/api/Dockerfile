# API Blowy — image de production. Contexte de build = racine du dépôt :
#   docker build -f apps/api/Dockerfile -t blowy-api .
# ---------------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable

# Manifestes d'abord : l'installation reste en cache tant qu'ils ne changent pas.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY packages/domain/package.json packages/domain/
COPY packages/contract/package.json packages/contract/
COPY packages/content/package.json packages/content/
COPY packages/api-client/package.json packages/api-client/
RUN pnpm install --frozen-lockfile --filter "@blowy/api..."

# Sources : seulement l'API et les paquets internes qu'elle embarque.
COPY packages/domain/src packages/domain/src
COPY packages/contract/src packages/contract/src
COPY packages/content/src packages/content/src
COPY apps/api/src apps/api/src
COPY apps/api/tsconfig.json apps/api/tsup.config.ts apps/api/
RUN pnpm --filter @blowy/api build \
 && pnpm --filter @blowy/api deploy --prod --legacy /out \
 && cp -r apps/api/dist /out/dist

# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production BLOWY_ENV=production BLOWY_ADAPTERS=supabase PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /out/package.json ./package.json
COPY --from=build --chown=node:node /out/node_modules ./node_modules
COPY --from=build --chown=node:node /out/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1
CMD ["node", "dist/main.js"]
