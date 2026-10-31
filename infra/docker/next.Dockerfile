# Image Next.js (web public ou admin). ARG APP=@blowy/web | @blowy/admin ; APP_DIR=apps/web | apps/admin
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
ARG APP=@blowy/web
ARG APP_DIR=apps/web

FROM base AS pruner
ARG APP
WORKDIR /repo
COPY . .
RUN pnpm dlx turbo@2 prune ${APP} --docker

FROM base AS builder
ARG APP
WORKDIR /repo
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN pnpm turbo run build --filter=${APP}...

FROM node:22-bookworm-slim AS runtime
ARG APP_DIR
ENV NODE_ENV=production
WORKDIR /app
RUN useradd --uid 10001 --create-home blowy
# Next en mode `output: 'standalone'`.
COPY --from=builder --chown=blowy /repo/${APP_DIR}/.next/standalone ./
COPY --from=builder --chown=blowy /repo/${APP_DIR}/.next/static ./${APP_DIR}/.next/static
COPY --from=builder --chown=blowy /repo/${APP_DIR}/public ./${APP_DIR}/public
USER blowy
ENV APP_DIR=${APP_DIR}
EXPOSE 3000
CMD ["sh", "-c", "node ${APP_DIR}/server.js"]
