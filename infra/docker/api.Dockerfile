# Image de production API (HTTP/WS) et worker — même image, deux commandes.
# Build : docker build -f infra/docker/api.Dockerfile -t blowy-api .
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

FROM base AS pruner
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@2 prune @blowy/api --docker

FROM base AS builder
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN pnpm turbo run build --filter=@blowy/api... \
 && pnpm deploy --filter=@blowy/api --prod /app

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production BLOWY_ENV=production
WORKDIR /app
RUN useradd --uid 10001 --create-home blowy
COPY --from=builder --chown=blowy /app .
USER blowy
EXPOSE 3000
# Liveness : /v1/healthz/live ; readiness : /v1/healthz/ready (DB + Redis).
HEALTHCHECK --interval=15s --timeout=3s CMD node -e "fetch('http://127.0.0.1:3000/v1/healthz/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Worker : surcharger la commande par ["node","dist/worker.js"] (arrêt gracieux sur SIGTERM).
CMD ["node", "dist/main.js"]
